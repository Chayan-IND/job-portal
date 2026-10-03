const mongoose = require('mongoose');
const Job = require('../models/Job');
const CompanyProfile = require('../models/CompanyProfile');
const Application = require('../models/Application');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { getPagination, buildPaginatedResponse } = require('../utils/pagination');
const { cacheGet, cacheSet, cacheDel } = require('../config/redis');
const logger = require('../utils/logger');

// Job.company only stores a User reference (name, email) - the display
// name and logo actually live on CompanyProfile, a separate collection.
// This merges that in after the main query rather than a Mongoose
// populate, since populate can't reach across to a different collection
// keyed by the same user id without a $lookup-style virtual - a single
// extra query here is simpler and just as fast for list-sized results.
async function attachCompanyProfiles(jobs) {
  const companyIds = [...new Set(jobs.map((j) => j.company?._id?.toString() || j.company?.toString()))];
  if (companyIds.length === 0) return jobs;

  const profiles = await CompanyProfile.find({ user: { $in: companyIds } })
    .select('user companyName logoUrl')
    .lean();
  const profileMap = new Map(profiles.map((p) => [p.user.toString(), p]));

  return jobs.map((job) => {
    const companyId = (job.company?._id || job.company)?.toString();
    const profile = profileMap.get(companyId);
    return {
      ...job,
      company: {
        ...(typeof job.company === 'object' ? job.company : {}),
        name: profile?.companyName || job.company?.name,
        logoUrl: profile?.logoUrl || null,
      },
    };
  });
}

const createJob = catchAsync(async (req, res) => {
  const job = await Job.create({ ...req.body, company: req.user.id });
  await cacheDel('jobs:list:*');
  logger.info('Job created', { jobId: job._id.toString(), companyId: req.user.id });
  res.status(201).json({ success: true, data: { job } });
});

const updateJob = catchAsync(async (req, res, next) => {
  const job = await Job.findById(req.params.jobId);
  if (!job) return next(new AppError('Job not found.', 404));

  if (job.company.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You can only edit your own job postings.', 403));
  }

  Object.assign(job, req.body);
  await job.save();
  await cacheDel('jobs:list:*');

  res.status(200).json({ success: true, data: { job } });
});

const deleteJob = catchAsync(async (req, res, next) => {
  const job = await Job.findById(req.params.jobId);
  if (!job) return next(new AppError('Job not found.', 404));

  if (job.company.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You can only delete your own job postings.', 403));
  }

  await job.deleteOne();
  await cacheDel('jobs:list:*');

  res.status(200).json({ success: true, message: 'Job deleted.' });
});

const listJobs = catchAsync(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { skills, location, jobType, search } = req.query;

  const filter = { status: 'open' };
  if (location) filter.location = new RegExp(location, 'i');
  if (jobType) filter.jobType = jobType;
  if (skills) {
    const skillList = skills.split(',').map((s) => s.trim().toLowerCase());
    filter.skillsRequired = { $in: skillList };
  }
  if (search) filter.$text = { $search: search };

  const cacheKey = `jobs:list:${JSON.stringify({ filter, page, limit })}`;
  const cached = await cacheGet(cacheKey);
  if (cached) {
    return res.status(200).json({ success: true, cached: true, ...cached });
  }

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .populate('company', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Job.countDocuments(filter),
  ]);

  const jobsWithCompany = await attachCompanyProfiles(jobs);
  const responseBody = buildPaginatedResponse(jobsWithCompany, total, page, limit);
  await cacheSet(cacheKey, responseBody, 60);

  res.status(200).json({ success: true, cached: false, ...responseBody });
});

const getJob = catchAsync(async (req, res, next) => {
  const job = await Job.findById(req.params.jobId).populate('company', 'name email').lean();
  if (!job) return next(new AppError('Job not found.', 404));

  const [jobWithCompany] = await attachCompanyProfiles([job]);
  res.status(200).json({ success: true, data: { job: jobWithCompany } });
});

// Company's own postings, with a live applicant count per job so the
// dashboard can show something more useful than a bare list of titles.
const listMyJobs = catchAsync(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const [jobs, total] = await Promise.all([
    Job.find({ company: req.user.id }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Job.countDocuments({ company: req.user.id }),
  ]);

  const jobIds = jobs.map((j) => j._id);
  const counts = await Application.aggregate([
    { $match: { job: { $in: jobIds } } },
    { $group: { _id: '$job', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));
  const jobsWithCounts = jobs.map((job) => ({
    ...job,
    applicantCount: countMap.get(job._id.toString()) || 0,
  }));

  res.status(200).json({
    success: true,
    ...buildPaginatedResponse(jobsWithCounts, total, page, limit),
  });
});

// Small aggregate for the company dashboard's stats bar.
const getMyJobStats = catchAsync(async (req, res) => {
  const companyId = new mongoose.Types.ObjectId(req.user.id);

  const [statusCounts, applicantResult] = await Promise.all([
    Job.aggregate([
      { $match: { company: companyId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Application.aggregate([
      { $lookup: { from: 'jobs', localField: 'job', foreignField: '_id', as: 'jobDoc' } },
      { $unwind: '$jobDoc' },
      { $match: { 'jobDoc.company': companyId } },
      { $count: 'total' },
    ]),
  ]);

  const stats = {
    open: 0,
    closed: 0,
    totalJobs: 0,
    totalApplicants: applicantResult[0]?.total || 0,
  };
  statusCounts.forEach(({ _id, count }) => {
    stats[_id] = count;
    stats.totalJobs += count;
  });

  res.status(200).json({ success: true, data: stats });
});

module.exports = { createJob, updateJob, deleteJob, listJobs, getJob, listMyJobs, getMyJobStats };
