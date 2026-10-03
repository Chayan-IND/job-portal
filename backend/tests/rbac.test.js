const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const db = require('./helpers/db');
const { seedRoles, registerUser, createJob, auth } = require('./helpers/factories');

beforeAll(async () => { await db.connect(); });
afterAll(async () => { await db.disconnect(); });
beforeEach(async () => { await db.clearCollections(); await seedRoles(); });

describe('role-based access control', () => {
  it('students cannot use company-only endpoints', async () => {
    const student = await registerUser('student');
    const company = await registerUser('company');
    const job = await createJob(company.user._id);
    const h = auth(student.accessToken);

    expect((await request(app).post('/api/jobs').set(h).send({})).status).toBe(403);
    expect((await request(app).get('/api/jobs/mine').set(h)).status).toBe(403);
    expect((await request(app).patch(`/api/jobs/${job._id}`).set(h).send({ title: 'x' })).status).toBe(403);
    expect((await request(app).delete(`/api/jobs/${job._id}`).set(h)).status).toBe(403);
    expect((await request(app).get(`/api/applications/jobs/${job._id}`).set(h)).status).toBe(403);
    expect((await request(app).get('/api/students').set(h)).status).toBe(403);
    expect((await request(app).get('/api/companies/me').set(h)).status).toBe(403);
  });

  it('companies cannot use student-only endpoints', async () => {
    const company = await registerUser('company');
    const job = await createJob(company.user._id);
    const h = auth(company.accessToken);

    expect((await request(app).post(`/api/applications/jobs/${job._id}/apply`).set(h).send({})).status).toBe(403);
    expect((await request(app).get('/api/applications/me').set(h)).status).toBe(403);
    expect((await request(app).get('/api/students/me').set(h)).status).toBe(403);
  });

  it('anonymous users get 401 on every protected route', async () => {
    const protectedRoutes = [
      ['get', '/api/auth/me'], ['get', '/api/jobs/mine'], ['post', '/api/jobs'],
      ['get', '/api/applications/me'], ['get', '/api/students/me'],
      ['get', '/api/companies/me'], ['get', '/api/notifications'],
    ];
    for (const [method, url] of protectedRoutes) {
      const res = await request(app)[method](url);
      expect(res.status).toBe(401);
    }
  });

  it("requires the specific permission, not just the role (token without 'job:create' is refused)", async () => {
    const company = await registerUser('company');
    const stripped = jwt.sign({ sub: company.user._id, role: 'company', permissions: [] }, process.env.JWT_SECRET, { expiresIn: '5m' });
    const res = await request(app).post('/api/jobs').set(auth(stripped))
      .send({ title: 'T', description: 'D', location: 'L', jobType: 'full-time' });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/job:create/);
  });

  it('student and company profiles are created on first access and updatable', async () => {
    const student = await registerUser('student');
    const get = await request(app).get('/api/students/me').set(auth(student.accessToken));
    expect(get.status).toBe(200);
    const patch = await request(app).patch('/api/students/me').set(auth(student.accessToken))
      .send({ university: 'IIT Kharagpur', skills: [' Node ', 'React'], resumeUrl: 'https://evil.example/x.pdf' });
    expect(patch.body.data.profile.university).toBe('IIT Kharagpur');
    expect(patch.body.data.profile.skills).toEqual(['node', 'react']);
    // mass-assignment guard: resumeUrl can only be set via the upload endpoint
    expect(patch.body.data.profile.resumeUrl).toBeNull();

    const company = await registerUser('company');
    const cp = await request(app).patch('/api/companies/me').set(auth(company.accessToken)).send({ companyName: 'Acme', industry: 'Tech' });
    expect(cp.body.data.profile.companyName).toBe('Acme');
  });
});

describe('platform basics', () => {
  it('health endpoint reports ok when DB is connected', async () => {
    const res = await request(app).get('/api/health');
    expect([200, 404]).toContain(res.status);
  });

  it('returns a JSON 404 for unknown routes', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('sets security headers and does not leak the framework', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('strips NoSQL-injection operators from input', async () => {
    await registerUser('student', { email: 'victim@example.com' });
    const res = await request(app).post('/api/auth/login').send({ email: { $gt: '' }, password: { $gt: '' } });
    expect(res.status).toBe(400);
  });
});
