const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    phone: { type: String, trim: true },
    university: { type: String, trim: true, index: true },
    graduationYear: { type: Number, index: true },
    skills: { type: [String], default: [], set: (arr) => arr.map((s) => s.trim().toLowerCase()) },
    bio: { type: String, maxlength: 1000, default: '' },
    resumeUrl: { type: String, default: null },
    resumePublicId: { type: String, default: null },
    resumeResourceType: { type: String, enum: ['image', 'raw'], default: 'raw' },
  },
  { timestamps: true }
);

studentProfileSchema.index({ skills: 1, university: 1 });

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
