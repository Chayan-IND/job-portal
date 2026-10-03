const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    resumeUrlSnapshot: { type: String, required: true },
    coverNote: { type: String, maxlength: 1000, default: '' },
    status: { type: String, enum: ['applied', 'shortlisted', 'rejected', 'hired'], default: 'applied', index: true },
  },
  { timestamps: true }
);

applicationSchema.index({ job: 1, student: 1 }, { unique: true });
applicationSchema.index({ job: 1, status: 1, createdAt: -1 });
applicationSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model('Application', applicationSchema);
