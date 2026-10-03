const request = require('supertest');
const app = require('../../src/app');
const Role = require('../../src/models/Role');
const StudentProfile = require('../../src/models/StudentProfile');
const Job = require('../../src/models/Job');

// Same permissions as src/seed/seedRoles.js (that script runs on import, so we can't require it).
const ROLES = [
  { name: 'student', permissions: ['job:view', 'application:create', 'application:view_own', 'profile:edit_own', 'notification:view_own'] },
  { name: 'company', permissions: ['job:create', 'job:edit_own', 'job:view', 'application:view_for_own_jobs', 'application:update_status', 'profile:edit_own', 'notification:view_own'] },
  { name: 'admin', permissions: ['*'] },
];

async function seedRoles() {
  await Promise.all(ROLES.map((r) => Role.findOneAndUpdate({ name: r.name }, r, { upsert: true })));
}

let counter = 0;
function uniqueEmail(prefix = 'user') {
  counter += 1;
  return `${prefix}${counter}_${Date.now()}@example.com`;
}

/** Registers a user through the real API and returns { user, accessToken, refreshToken, email, password }. */
async function registerUser(role = 'student', overrides = {}) {
  const email = overrides.email || uniqueEmail(role);
  const password = overrides.password || 'Password123';
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: overrides.name || `Test ${role}`, email, password, role });
  if (res.status !== 201) {
    throw new Error(`registerUser failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return { ...res.body.data, email, password };
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });

async function createJob(companyUserId, overrides = {}) {
  return Job.create({
    company: companyUserId,
    title: 'Backend Developer',
    description: 'Build APIs with Node.js',
    location: 'Kolkata',
    jobType: 'full-time',
    skillsRequired: ['node', 'mongodb'],
    ...overrides,
  });
}

/** Gives a student a resume URL directly in the DB (real uploads go to Cloudinary, which we don't hit in tests). */
async function giveResume(studentUserId) {
  return StudentProfile.findOneAndUpdate(
    { user: studentUserId },
    { $set: { resumeUrl: 'https://example.com/resume.pdf', resumePublicId: 'test/resume' } },
    { upsert: true, new: true }
  );
}

module.exports = { seedRoles, registerUser, createJob, giveResume, auth, uniqueEmail };
