const request = require('supertest');
const crypto = require('crypto');
const app = require('../src/app');
const User = require('../src/models/User');
const db = require('./helpers/db');
const { seedRoles, registerUser, auth, uniqueEmail } = require('./helpers/factories');

beforeAll(async () => { await db.connect(); });
afterAll(async () => { await db.disconnect(); });
beforeEach(async () => { await db.clearCollections(); await seedRoles(); });

describe('POST /api/auth/register', () => {
  it('registers a student and returns tokens without exposing the password', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ name: 'Asha', email: 'asha@example.com', password: 'Password123', role: 'student' });

    expect(res.status).toBe(201);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.email).toBe('asha@example.com');
    expect(res.body.data.user.role).toBe('student');
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('stores the password hashed, never in plain text', async () => {
    await registerUser('student', { email: 'hash@example.com', password: 'Password123' });
    const stored = await User.findOne({ email: 'hash@example.com' }).select('+password');
    expect(stored.password).not.toBe('Password123');
    expect(stored.password).toMatch(/^\$2[aby]\$/);
  });

  it('normalizes email case', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ name: 'Case', email: 'Case.User@Example.COM', password: 'Password123', role: 'student' });
    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('case.user@example.com');
  });

  it('rejects a duplicate email with 409', async () => {
    await registerUser('student', { email: 'dup@example.com' });
    const res = await request(app).post('/api/auth/register')
      .send({ name: 'Again', email: 'dup@example.com', password: 'Password123', role: 'company' });
    expect(res.status).toBe(409);
  });

  it.each([
    ['short password', { password: 'abc1' }],
    ['password without a number', { password: 'passwordonly' }],
    ['invalid email', { email: 'not-an-email' }],
    ['missing name', { name: '' }],
    ['unknown role', { role: 'superuser' }],
  ])('rejects %s with 400', async (_label, override) => {
    const body = { name: 'X', email: uniqueEmail(), password: 'Password123', role: 'student', ...override };
    const res = await request(app).post('/api/auth/register').send(body);
    expect(res.status).toBe(400);
  });

  it('does not allow self-registering as admin', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ name: 'Eve', email: uniqueEmail(), password: 'Password123', role: 'admin' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
    const { email, password } = await registerUser('student');
    const res = await request(app).post('/api/auth/login').send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('gives the same generic error for wrong password and unknown email', async () => {
    const { email } = await registerUser('student');
    const wrongPw = await request(app).post('/api/auth/login').send({ email, password: 'WrongPass1' });
    const unknown = await request(app).post('/api/auth/login').send({ email: 'nobody@example.com', password: 'WrongPass1' });
    expect(wrongPw.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrongPw.body.message).toBe(unknown.body.message); // no user enumeration
  });

  it('locks the account after 5 failed attempts, even for the right password', async () => {
    const { email, password } = await registerUser('student');
    for (let i = 0; i < 5; i += 1) {
      const r = await request(app).post('/api/auth/login').send({ email, password: 'WrongPass1' });
      expect(r.status).toBe(401);
    }
    const locked = await request(app).post('/api/auth/login').send({ email, password });
    expect(locked.status).toBe(423);
  });

  it('resets the failed-attempt counter after a successful login', async () => {
    const { email, password } = await registerUser('student');
    for (let i = 0; i < 3; i += 1) {
      await request(app).post('/api/auth/login').send({ email, password: 'WrongPass1' });
    }
    await request(app).post('/api/auth/login').send({ email, password });
    const user = await User.findOne({ email });
    expect(user.failedLoginAttempts).toBe(0);
  });

  it('blocks deactivated accounts with 403', async () => {
    const { email, password } = await registerUser('student');
    await User.updateOne({ email }, { isActive: false });
    const res = await request(app).post('/api/auth/login').send({ email, password });
    expect(res.status).toBe(403);
  });

  it('requires email and password', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/me and token handling', () => {
  it('returns the current user for a valid token', async () => {
    const { accessToken, email } = await registerUser('company');
    const res = await request(app).get('/api/auth/me').set(auth(accessToken));
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(email);
  });

  it('rejects requests with no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects a garbage token', async () => {
    const res = await request(app).get('/api/auth/me').set(auth('not.a.token'));
    expect(res.status).toBe(401);
  });

  it('rejects a token signed with the wrong secret', async () => {
    const jwt = require('jsonwebtoken');
    const forged = jwt.sign({ sub: '507f1f77bcf86cd799439011', role: 'admin' }, 'wrong-secret');
    const res = await request(app).get('/api/auth/me').set(auth(forged));
    expect(res.status).toBe(401);
  });

  it('rejects an expired token with a clear message', async () => {
    const jwt = require('jsonwebtoken');
    const { user } = await registerUser('student');
    const expired = jwt.sign({ sub: user._id, role: 'student' }, process.env.JWT_SECRET, { expiresIn: -10 });
    const res = await request(app).get('/api/auth/me').set(auth(expired));
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/expired/i);
  });
});

describe('POST /api/auth/refresh', () => {
  it('issues a new access token from a valid refresh token', async () => {
    const { refreshToken } = await registerUser('student');
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('requires a refresh token', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});
    expect(res.status).toBe(400);
  });

  it('rejects an invalid refresh token', async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'bogus' });
    expect(res.status).toBe(401);
  });

  it('rejects an ACCESS token used as a refresh token', async () => {
    const { accessToken } = await registerUser('student');
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: accessToken });
    expect(res.status).toBe(401);
  });

  it('refuses to refresh for a deactivated account', async () => {
    const { refreshToken, email } = await registerUser('student');
    await User.updateOne({ email }, { isActive: false });
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(401);
  });
});

describe('forgot / reset password', () => {
  it('returns the same generic response whether or not the email exists', async () => {
    const { email } = await registerUser('student');
    const known = await request(app).post('/api/auth/forgot-password').send({ email });
    const unknown = await request(app).post('/api/auth/forgot-password').send({ email: 'ghost@example.com' });
    expect(known.status).toBe(200);
    expect(unknown.status).toBe(200);
    expect(known.body.message).toBe(unknown.body.message);
  });

  it('stores only a hashed reset token', async () => {
    const { email } = await registerUser('student');
    await request(app).post('/api/auth/forgot-password').send({ email });
    const user = await User.findOne({ email }).select('+passwordResetToken +passwordResetExpires');
    expect(user.passwordResetToken).toMatch(/^[a-f0-9]{64}$/);
    expect(user.passwordResetExpires.getTime()).toBeGreaterThan(Date.now());
  });

  it('resets the password with a valid token, then the old password stops working', async () => {
    const { email, password } = await registerUser('student');
    // The controller only logs the raw token (no email sender yet), so plant a known one.
    const rawToken = crypto.randomBytes(32).toString('hex');
    await User.updateOne({ email }, {
      passwordResetToken: crypto.createHash('sha256').update(rawToken).digest('hex'),
      passwordResetExpires: Date.now() + 60 * 60 * 1000,
    });

    const reset = await request(app).post('/api/auth/reset-password').send({ token: rawToken, password: 'NewPassword9' });
    expect(reset.status).toBe(200);

    const oldLogin = await request(app).post('/api/auth/login').send({ email, password });
    const newLogin = await request(app).post('/api/auth/login').send({ email, password: 'NewPassword9' });
    expect(oldLogin.status).toBe(401);
    expect(newLogin.status).toBe(200);
  });

  it('does not let a reset token be used twice', async () => {
    const { email } = await registerUser('student');
    const rawToken = crypto.randomBytes(32).toString('hex');
    await User.updateOne({ email }, {
      passwordResetToken: crypto.createHash('sha256').update(rawToken).digest('hex'),
      passwordResetExpires: Date.now() + 60 * 60 * 1000,
    });
    const first = await request(app).post('/api/auth/reset-password').send({ token: rawToken, password: 'NewPassword9' });
    const second = await request(app).post('/api/auth/reset-password').send({ token: rawToken, password: 'AnotherPass8' });
    expect(first.status).toBe(200);
    expect(second.status).toBe(400);
  });

  it('rejects an expired reset token', async () => {
    const { email } = await registerUser('student');
    const rawToken = crypto.randomBytes(32).toString('hex');
    await User.updateOne({ email }, {
      passwordResetToken: crypto.createHash('sha256').update(rawToken).digest('hex'),
      passwordResetExpires: Date.now() - 1000,
    });
    const res = await request(app).post('/api/auth/reset-password').send({ token: rawToken, password: 'NewPassword9' });
    expect(res.status).toBe(400);
  });

  it('rejects a made-up reset token and a weak new password', async () => {
    const bogus = await request(app).post('/api/auth/reset-password').send({ token: 'abc', password: 'NewPassword9' });
    expect(bogus.status).toBe(400);
    const weak = await request(app).post('/api/auth/reset-password').send({ token: 'abc', password: 'short' });
    expect(weak.status).toBe(400);
  });
});
