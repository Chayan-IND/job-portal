require('dotenv').config();
const mongoose = require('mongoose');
const { env } = require('../config/env');
const Role = require('../models/Role');
const logger = require('../utils/logger');

const SYSTEM_ROLES = [
  { name: 'student', description: 'Student user - can browse jobs and apply', isSystemRole: true,
    permissions: ['job:view', 'application:create', 'application:view_own', 'profile:edit_own', 'notification:view_own'] },
  { name: 'company', description: 'Company/recruiter user - can post jobs and review applicants', isSystemRole: true,
    permissions: ['job:create', 'job:edit_own', 'job:view', 'application:view_for_own_jobs', 'application:update_status', 'profile:edit_own', 'notification:view_own'] },
  { name: 'admin', description: 'Platform administrator - full access', isSystemRole: true, permissions: ['*'] },
];

async function seedRoles() {
  await mongoose.connect(env.mongoUri);
  logger.info('Connected to MongoDB for seeding roles');
  for (const role of SYSTEM_ROLES) {
    await Role.findOneAndUpdate({ name: role.name }, role, { upsert: true, new: true, setDefaultsOnInsert: true });
    logger.info(`Seeded role: ${role.name}`);
  }
  await mongoose.connection.close();
  logger.info('Role seeding complete');
}

seedRoles().catch((err) => {
  logger.error('Role seeding failed', { error: err.message });
  process.exit(1);
});
