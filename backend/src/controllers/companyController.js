const CompanyProfile = require('../models/CompanyProfile');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { streamToCloudinary, deleteFromCloudinary } = require('../middleware/upload');
const logger = require('../utils/logger');

const getMyProfile = catchAsync(async (req, res) => {
  let profile = await CompanyProfile.findOne({ user: req.user.id }).populate('user', 'name email');
  if (!profile) {
    profile = await CompanyProfile.create({ user: req.user.id, companyName: req.user.name || 'Unnamed Company' });
    profile = await profile.populate('user', 'name email');
  }
  res.status(200).json({ success: true, data: { profile } });
});

const updateMyProfile = catchAsync(async (req, res) => {
  const allowedFields = ['companyName', 'industry', 'website', 'description'];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const profile = await CompanyProfile.findOneAndUpdate(
    { user: req.user.id },
    { $set: updates },
    { new: true, upsert: true, runValidators: true }
  );

  res.status(200).json({ success: true, data: { profile } });
});

const uploadLogo = catchAsync(async (req, res, next) => {
  if (!req.file) return next(new AppError('No logo file was uploaded.', 400));

  const profile = await CompanyProfile.findOne({ user: req.user.id });
  if (profile?.logoPublicId) {
    await deleteFromCloudinary(profile.logoPublicId, 'image');
  }

  const result = await streamToCloudinary(req.file.buffer, 'job-portal/logos', 'image');

  const updated = await CompanyProfile.findOneAndUpdate(
    { user: req.user.id },
    { $set: { logoUrl: result.secure_url, logoPublicId: result.public_id } },
    { new: true, upsert: true, runValidators: true }
  );

  logger.info('Company logo uploaded', { userId: req.user.id, publicId: result.public_id });
  res.status(200).json({ success: true, data: { profile: updated } });
});

module.exports = { getMyProfile, updateMyProfile, uploadLogo };
