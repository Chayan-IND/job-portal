const StudentProfile = require('../models/StudentProfile');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { getPagination, buildPaginatedResponse } = require('../utils/pagination');
const { streamToCloudinary, deleteFromCloudinary } = require('../middleware/upload');
const logger = require('../utils/logger');

const getMyProfile = catchAsync(async (req, res) => {
  let profile = await StudentProfile.findOne({ user: req.user.id }).populate('user', 'name email');
  if (!profile) {
    profile = await StudentProfile.create({ user: req.user.id });
    profile = await profile.populate('user', 'name email');
  }
  res.status(200).json({ success: true, data: { profile } });
});

const updateMyProfile = catchAsync(async (req, res) => {
  const allowedFields = ['phone', 'university', 'graduationYear', 'skills', 'bio'];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const profile = await StudentProfile.findOneAndUpdate(
    { user: req.user.id },
    { $set: updates },
    { new: true, upsert: true, runValidators: true }
  );

  res.status(200).json({ success: true, data: { profile } });
});

const uploadResume = catchAsync(async (req, res, next) => {
  if (!req.file) return next(new AppError('No resume file was uploaded.', 400));

  const profile = await StudentProfile.findOne({ user: req.user.id });
  const resourceType = req.file.mimetype === 'application/pdf' ? 'image' : 'raw';

  if (profile?.resumePublicId) {
    await deleteFromCloudinary(profile.resumePublicId, profile.resumeResourceType || 'raw');
  }

  const result = await streamToCloudinary(req.file.buffer, 'job-portal/resumes', resourceType);

  const updated = await StudentProfile.findOneAndUpdate(
    { user: req.user.id },
    { $set: { resumeUrl: result.secure_url, resumePublicId: result.public_id, resumeResourceType: resourceType } },
    { new: true, upsert: true, runValidators: true }
  );

  logger.info('Resume uploaded', { userId: req.user.id, publicId: result.public_id, resourceType });
  res.status(200).json({ success: true, data: { profile: updated } });
});

const listStudents = catchAsync(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.query.skills) {
    const skillList = req.query.skills.split(',').map((s) => s.trim().toLowerCase());
    filter.skills = { $in: skillList };
  }
  if (req.query.university) filter.university = new RegExp(req.query.university, 'i');

  const [students, total] = await Promise.all([
    StudentProfile.find(filter).populate('user', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    StudentProfile.countDocuments(filter),
  ]);

  res.status(200).json({ success: true, ...buildPaginatedResponse(students, total, page, limit) });
});

module.exports = { getMyProfile, updateMyProfile, uploadResume, listStudents };
