const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: [true, 'Job title is required'], trim: true, maxlength: 150 },
    description: { type: String, required: [true, 'Job description is required'], maxlength: 5000 },
    skillsRequired: { type: [String], default: [], set: (arr) => arr.map((s) => s.trim().toLowerCase()) },
    location: { type: String, trim: true, required: [true, 'Location is required'] },
    jobType: { type: String, enum: ['full-time', 'part-time', 'internship', 'contract'], required: true },
    salaryMin: { type: Number, min: 0 },
    salaryMax: { type: Number, min: 0 },
    applicationDeadline: { type: Date },
    status: { type: String, enum: ['open', 'closed'], default: 'open', index: true },
  },
  { timestamps: true }
);

jobSchema.index({ title: 'text', description: 'text' });
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ skillsRequired: 1, status: 1 });
jobSchema.index({ location: 1, status: 1 });

module.exports = mongoose.model('Job', jobSchema);
