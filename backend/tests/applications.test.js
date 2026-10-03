const request = require('supertest');
const app = require('../src/app');
const Application = require('../src/models/Application');
const Notification = require('../src/models/Notification');
const db = require('./helpers/db');
const { seedRoles, registerUser, createJob, giveResume, auth } = require('./helpers/factories');

beforeAll(async () => { await db.connect(); });
afterAll(async () => { await db.disconnect(); });
beforeEach(async () => { await db.clearCollections(); await seedRoles(); });

async function setup() {
  const company = await registerUser('company');
  const student = await registerUser('student');
  const job = await createJob(company.user._id);
  return { company, student, job };
}

describe('POST /api/applications/jobs/:jobId/apply', () => {
  it('lets a student with a resume apply, and notifies the company', async () => {
    const { company, student, job } = await setup();
    await giveResume(student.user._id);

    const res = await request(app).post(`/api/applications/jobs/${job._id}/apply`)
      .set(auth(student.accessToken)).send({ coverNote: 'Please hire me' });

    expect(res.status).toBe(201);
    expect(res.body.data.application.status).toBe('applied');
    expect(res.body.data.application.resumeUrlSnapshot).toBe('https://example.com/resume.pdf');

    const note = await Notification.findOne({ user: company.user._id });
    expect(note.type).toBe('application_received');
  });

  it('requires a resume first', async () => {
    const { student, job } = await setup();
    const res = await request(app).post(`/api/applications/jobs/${job._id}/apply`).set(auth(student.accessToken)).send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/resume/i);
  });

  it('blocks a duplicate application with 409', async () => {
    const { student, job } = await setup();
    await giveResume(student.user._id);
    const url = `/api/applications/jobs/${job._id}/apply`;
    expect((await request(app).post(url).set(auth(student.accessToken)).send({})).status).toBe(201);
    expect((await request(app).post(url).set(auth(student.accessToken)).send({})).status).toBe(409);
    expect(await Application.countDocuments({ job: job._id })).toBe(1);
  });

  it('refuses closed jobs and jobs past their deadline', async () => {
    const { company, student } = await setup();
    await giveResume(student.user._id);
    const closed = await createJob(company.user._id, { status: 'closed' });
    const expired = await createJob(company.user._id, { applicationDeadline: new Date(Date.now() - 86400000) });
    expect((await request(app).post(`/api/applications/jobs/${closed._id}/apply`).set(auth(student.accessToken)).send({})).status).toBe(400);
    expect((await request(app).post(`/api/applications/jobs/${expired._id}/apply`).set(auth(student.accessToken)).send({})).status).toBe(400);
  });

  it('404s for a missing job, 400s for a malformed id, 400s for an over-long cover note', async () => {
    const { student, job } = await setup();
    await giveResume(student.user._id);
    expect((await request(app).post('/api/applications/jobs/507f1f77bcf86cd799439011/apply').set(auth(student.accessToken)).send({})).status).toBe(404);
    expect((await request(app).post('/api/applications/jobs/bad-id/apply').set(auth(student.accessToken)).send({})).status).toBe(400);
    expect((await request(app).post(`/api/applications/jobs/${job._id}/apply`).set(auth(student.accessToken)).send({ coverNote: 'x'.repeat(1001) })).status).toBe(400);
  });
});

describe('student views', () => {
  it('lists my applications, filters by status, and returns stats', async () => {
    const { company, student, job } = await setup();
    await giveResume(student.user._id);
    const job2 = await createJob(company.user._id, { title: 'Second' });
    await request(app).post(`/api/applications/jobs/${job._id}/apply`).set(auth(student.accessToken)).send({});
    await request(app).post(`/api/applications/jobs/${job2._id}/apply`).set(auth(student.accessToken)).send({});
    await Application.updateOne({ job: job2._id }, { status: 'shortlisted' });

    const all = await request(app).get('/api/applications/me').set(auth(student.accessToken));
    expect(all.body.data).toHaveLength(2);

    const shortlisted = await request(app).get('/api/applications/me?status=shortlisted').set(auth(student.accessToken));
    expect(shortlisted.body.data).toHaveLength(1);

    const stats = await request(app).get('/api/applications/me/stats').set(auth(student.accessToken));
    expect(stats.body.data).toMatchObject({ applied: 1, shortlisted: 1, total: 2 });
  });

  it("does not show other students' applications", async () => {
    const { company, student, job } = await setup();
    const other = await registerUser('student');
    await giveResume(student.user._id);
    await request(app).post(`/api/applications/jobs/${job._id}/apply`).set(auth(student.accessToken)).send({});
    const res = await request(app).get('/api/applications/me').set(auth(other.accessToken));
    expect(res.body.data).toHaveLength(0);
  });
});

describe('company reviewing applications', () => {
  async function applied() {
    const ctx = await setup();
    await giveResume(ctx.student.user._id);
    const res = await request(app).post(`/api/applications/jobs/${ctx.job._id}/apply`).set(auth(ctx.student.accessToken)).send({});
    return { ...ctx, application: res.body.data.application };
  }

  it('lets the owning company list applicants for its job', async () => {
    const { company, job } = await applied();
    const res = await request(app).get(`/api/applications/jobs/${job._id}`).set(auth(company.accessToken));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].student.email).toBeDefined();
  });

  it("forbids another company from seeing a job's applicants", async () => {
    const { job } = await applied();
    const other = await registerUser('company');
    const res = await request(app).get(`/api/applications/jobs/${job._id}`).set(auth(other.accessToken));
    expect(res.status).toBe(403);
  });

  it('lets the owner shortlist an applicant and notifies the student', async () => {
    const { company, student, application } = await applied();
    const res = await request(app).patch(`/api/applications/${application._id}/status`)
      .set(auth(company.accessToken)).send({ status: 'shortlisted' });
    expect(res.status).toBe(200);
    expect(res.body.data.application.status).toBe('shortlisted');
    const note = await Notification.findOne({ user: student.user._id, type: 'application_status_changed' });
    expect(note.message).toMatch(/shortlisted/);
  });

  it('rejects invalid status values (cannot set back to "applied" or invent one)', async () => {
    const { company, application } = await applied();
    for (const status of ['applied', 'promoted', '']) {
      const res = await request(app).patch(`/api/applications/${application._id}/status`).set(auth(company.accessToken)).send({ status });
      expect(res.status).toBe(400);
    }
  });

  it("forbids another company from changing someone else's application", async () => {
    const { application } = await applied();
    const other = await registerUser('company');
    const res = await request(app).patch(`/api/applications/${application._id}/status`).set(auth(other.accessToken)).send({ status: 'hired' });
    expect(res.status).toBe(403);
    expect((await Application.findById(application._id)).status).toBe('applied');
  });

  it('404s for an unknown application', async () => {
    const { company } = await applied();
    const res = await request(app).patch('/api/applications/507f1f77bcf86cd799439011/status').set(auth(company.accessToken)).send({ status: 'hired' });
    expect(res.status).toBe(404);
  });
});

describe('notifications', () => {
  it('lists, counts unread, and marks as read (only my own)', async () => {
    const { company, student, job } = await setup();
    await giveResume(student.user._id);
    await request(app).post(`/api/applications/jobs/${job._id}/apply`).set(auth(student.accessToken)).send({});

    const list = await request(app).get('/api/notifications').set(auth(company.accessToken));
    expect(list.body.unreadCount).toBe(1);
    const id = list.body.data[0]._id;

    const intruder = await request(app).patch(`/api/notifications/${id}/read`).set(auth(student.accessToken));
    expect(intruder.status).toBe(404);

    const read = await request(app).patch(`/api/notifications/${id}/read`).set(auth(company.accessToken));
    expect(read.body.data.notification.isRead).toBe(true);

    const after = await request(app).get('/api/notifications?unreadOnly=true').set(auth(company.accessToken));
    expect(after.body.data).toHaveLength(0);
  });
});
