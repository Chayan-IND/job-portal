const request = require('supertest');
const app = require('../src/app');
const Job = require('../src/models/Job');
const db = require('./helpers/db');
const { seedRoles, registerUser, createJob, auth } = require('./helpers/factories');

beforeAll(async () => { await db.connect(); });
afterAll(async () => { await db.disconnect(); });
beforeEach(async () => { await db.clearCollections(); await seedRoles(); });

const validJob = {
  title: 'Frontend Developer',
  description: 'Build React UIs',
  location: 'Bengaluru',
  jobType: 'full-time',
  skillsRequired: ['React', ' CSS '],
};

describe('POST /api/jobs', () => {
  it('lets a company create a job and lowercases skills', async () => {
    const company = await registerUser('company');
    const res = await request(app).post('/api/jobs').set(auth(company.accessToken)).send(validJob);
    expect(res.status).toBe(201);
    expect(res.body.data.job.company).toBe(company.user._id);
    expect(res.body.data.job.skillsRequired).toEqual(['react', 'css']);
    expect(res.body.data.job.status).toBe('open');
  });

  it.each([
    ['missing title', { title: '' }],
    ['missing description', { description: '' }],
    ['missing location', { location: '' }],
    ['invalid jobType', { jobType: 'weekend' }],
    ['negative salary', { salaryMin: -5 }],
    ['bad deadline date', { applicationDeadline: 'tomorrow-ish' }],
    ['skillsRequired not an array', { skillsRequired: 'react' }],
  ])('rejects %s with 400', async (_l, override) => {
    const company = await registerUser('company');
    const res = await request(app).post('/api/jobs').set(auth(company.accessToken)).send({ ...validJob, ...override });
    expect(res.status).toBe(400);
  });

  it('ignores a client-supplied company id (cannot post as someone else)', async () => {
    const a = await registerUser('company');
    const b = await registerUser('company');
    const res = await request(app).post('/api/jobs').set(auth(a.accessToken)).send({ ...validJob, company: b.user._id });
    expect(res.status).toBe(201);
    expect(res.body.data.job.company).toBe(a.user._id);
  });
});

describe('GET /api/jobs (public list)', () => {
  it('is public and only returns open jobs', async () => {
    const c = await registerUser('company');
    await createJob(c.user._id, { title: 'Open one' });
    await createJob(c.user._id, { title: 'Closed one', status: 'closed' });
    const res = await request(app).get('/api/jobs');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Open one');
  });

  it('paginates', async () => {
    const c = await registerUser('company');
    for (let i = 0; i < 5; i += 1) await createJob(c.user._id, { title: `Job ${i}` });
    const res = await request(app).get('/api/jobs?page=2&limit=2');
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination).toMatchObject({ page: 2, limit: 2, total: 5, totalPages: 3, hasNextPage: true, hasPrevPage: true });
  });

  it('filters by jobType, location (case-insensitive) and skills', async () => {
    const c = await registerUser('company');
    await createJob(c.user._id, { title: 'A', jobType: 'internship', location: 'Kolkata', skillsRequired: ['python'] });
    await createJob(c.user._id, { title: 'B', jobType: 'full-time', location: 'Pune', skillsRequired: ['java'] });

    const byType = await request(app).get('/api/jobs?jobType=internship');
    expect(byType.body.data.map((j) => j.title)).toEqual(['A']);

    const byLoc = await request(app).get('/api/jobs?location=pune');
    expect(byLoc.body.data.map((j) => j.title)).toEqual(['B']);

    const bySkill = await request(app).get('/api/jobs?skills=Python');
    expect(bySkill.body.data.map((j) => j.title)).toEqual(['A']);
  });

  it('rejects bad query params', async () => {
    expect((await request(app).get('/api/jobs?limit=500')).status).toBe(400);
    expect((await request(app).get('/api/jobs?jobType=nope')).status).toBe(400);
  });

  // Needs a real MongoDB text index; skipped when run against a stand-in that lacks them.
  const textIt = process.env.STANDIN_DB ? it.skip : it;
  textIt('supports full-text search on title/description', async () => {
    const c = await registerUser('company');
    await createJob(c.user._id, { title: 'Quantum Engineer', description: 'Qubits' });
    await createJob(c.user._id, { title: 'Chef', description: 'Cooking' });
    const res = await request(app).get('/api/jobs?search=quantum');
    expect(res.body.data.map((j) => j.title)).toEqual(['Quantum Engineer']);
  });
});

describe('GET /api/jobs/:jobId', () => {
  it('returns a job publicly', async () => {
    const c = await registerUser('company');
    const job = await createJob(c.user._id);
    const res = await request(app).get(`/api/jobs/${job._id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.job.title).toBe('Backend Developer');
  });
  it('404s for a valid but missing id and 400s for a malformed id', async () => {
    expect((await request(app).get('/api/jobs/507f1f77bcf86cd799439011')).status).toBe(404);
    expect((await request(app).get('/api/jobs/not-an-id')).status).toBe(400);
  });
});

describe('PATCH / DELETE /api/jobs/:jobId', () => {
  it('lets the owner update a job', async () => {
    const c = await registerUser('company');
    const job = await createJob(c.user._id);
    const res = await request(app).patch(`/api/jobs/${job._id}`).set(auth(c.accessToken)).send({ title: 'Senior Backend', status: 'closed' });
    expect(res.status).toBe(200);
    expect(res.body.data.job.title).toBe('Senior Backend');
    expect(res.body.data.job.status).toBe('closed');
  });

  it("forbids another company from editing or deleting someone else's job", async () => {
    const owner = await registerUser('company');
    const other = await registerUser('company');
    const job = await createJob(owner.user._id);
    const patch = await request(app).patch(`/api/jobs/${job._id}`).set(auth(other.accessToken)).send({ title: 'Hacked' });
    const del = await request(app).delete(`/api/jobs/${job._id}`).set(auth(other.accessToken));
    expect(patch.status).toBe(403);
    expect(del.status).toBe(403);
    expect((await Job.findById(job._id)).title).toBe('Backend Developer');
  });

  it('lets the owner delete a job', async () => {
    const c = await registerUser('company');
    const job = await createJob(c.user._id);
    const res = await request(app).delete(`/api/jobs/${job._id}`).set(auth(c.accessToken));
    expect(res.status).toBe(200);
    expect(await Job.findById(job._id)).toBeNull();
  });

  it('returns 404 when updating a job that does not exist', async () => {
    const c = await registerUser('company');
    const res = await request(app).patch('/api/jobs/507f1f77bcf86cd799439011').set(auth(c.accessToken)).send({ title: 'x' });
    expect(res.status).toBe(404);
  });
});

describe('company dashboard endpoints', () => {
  it('lists only my jobs with applicant counts', async () => {
    const me = await registerUser('company');
    const other = await registerUser('company');
    await createJob(me.user._id, { title: 'Mine' });
    await createJob(other.user._id, { title: 'Theirs' });
    const res = await request(app).get('/api/jobs/mine').set(auth(me.accessToken));
    expect(res.status).toBe(200);
    expect(res.body.data.map((j) => j.title)).toEqual(['Mine']);
    expect(res.body.data[0].applicantCount).toBe(0);
  });

  // Uses $lookup; skipped on stand-in DBs that lack it (set STANDIN_DB=1). Runs on real MongoDB.
  const lookupIt = process.env.STANDIN_DB ? it.skip : it;
  lookupIt('returns job stats', async () => {
    const me = await registerUser('company');
    await createJob(me.user._id);
    await createJob(me.user._id, { status: 'closed' });
    const res = await request(app).get('/api/jobs/mine/stats').set(auth(me.accessToken));
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ open: 1, closed: 1, totalJobs: 2, totalApplicants: 0 });
  });
});
