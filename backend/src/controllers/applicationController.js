const mongoose = require('mongoose');
const Application = require('../models/Application');
const Job = require('../models/Job');
const StudentProfile = require('../models/StudentProfile');
const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { getPagination, buildPaginatedResponse } = require('../utils/pagination');
const logger = require('../utils/logger');

const applyToJob = catchAsync(async (req, res, next) => {
  const { jobId } = req.params;

  const job = await Job.findById(jobId);
  if (!job) return next(new AppError('Job not found.', 404));

  if (job.status !== 'open') {
    return next(new AppError('This job is no longer accepting applications.', 400));
  }
  if (job.applicationDeadline && job.applicationDeadline < new Date()) {
    return next(new AppError('The application deadline for this job has passed.', 400));
  }

  const profile = await StudentProfile.findOne({ user: req.user.id });
  if (!profile || !profile.resumeUrl) {
    return next(
      new AppError('Please upload a resume to your profile before applying.', 400)
    );
  }

  const existing = await Application.findOne({ job: jobId, student: req.user.id });
  if (existing) {
    return next(new AppError('You have already applied to this job.', 409));
  }

  let application;
  try {
    application = await Application.create({
      job: jobId,
      student: req.user.id,
      resumeUrlSnapshot: profile.resumeUrl,
      coverNote: req.body.coverNote || '',
    });
  } catch (err) {
    if (err.code === 11000) {
      return next(new AppError('You have already applied to this job.', 409));
    }
    throw err;
  }

  await Notification.create({
    user: job.company,
    type: 'application_received',
    message: `A new application was received for "${job.title}".`,
    relatedJob: job._id,
    relatedApplication: application._id,
  });

  logger.info('Application submitted', {
    applicationId: application._id.toString(),
    jobId,
    studentId: req.user.id,
  });

  res.status(201).json({ success: true, data: { application } });
});

const listMyApplications = catchAsync(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { student: req.user.id };
  if (req.query.status) filter.status = req.query.status;

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .populate('job', 'title company location jobType status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Application.countDocuments(filter),
  ]);

  res
    .status(200)
    .json({ success: true, ...buildPaginatedResponse(applications, total, page, limit) });
});

// Small aggregate for the student dashboard's stats bar - counts by
// status in one query rather than the frontend paging through everything.
const getMyApplicationStats = catchAsync(async (req, res) => {
  // req.user.id comes from the JWT as a plain string - $match in an
  // aggregation pipeline doesn't auto-cast the way find() does, so this
  // needs an explicit ObjectId conversion.
  const studentId = new mongoose.Types.ObjectId(req.user.id);
  const counts = await Application.aggregate([
    { $match: { student: studentId } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const stats = { applied: 0, shortlisted: 0, rejected: 0, hired: 0, total: 0 };
  counts.forEach(({ _id, count }) => {
    stats[_id] = count;
    stats.total += count;
  });

  res.status(200).json({ success: true, data: stats });
});

const listApplicationsForJob = catchAsync(async (req, res, next) => {
  const { jobId } = req.params;
  const job = await Job.findById(jobId);
  if (!job) return next(new AppError('Job not found.', 404));

  if (job.company.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You can only view applications for your own job postings.', 403));
  }

  const { page, limit, skip } = getPagination(req.query);
  const filter = { job: jobId };
  if (req.query.status) filter.status = req.query.status;

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .populate('student', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Application.countDocuments(filter),
  ]);

  res
    .status(200)
    .json({ success: true, ...buildPaginatedResponse(applications, total, page, limit) });
});

const updateApplicationStatus = catchAsync(async (req, res, next) => {
  const { applicationId } = req.params;
  const { status } = req.body;

  const application = await Application.findById(applicationId).populate('job');
  if (!application) return next(new AppError('Application not found.', 404));

  if (application.job.company.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new AppError('You can only update applications for your own job postings.', 403)
    );
  }

  application.status = status;
  await application.save();

  await Notification.create({
    user: application.student,
    type: 'application_status_changed',
    message: `Your application for "${application.job.title}" is now "${status}".`,
    relatedJob: application.job._id,
    relatedApplication: application._id,
  });

  logger.info('Application status updated', {
    applicationId: application._id.toString(),
    status,
  });

  res.status(200).json({ success: true, data: { application } });
});

module.exports = {
  applyToJob,
  listMyApplications,
  getMyApplicationStats,
  listApplicationsForJob,
  updateApplicationStatus,
};
