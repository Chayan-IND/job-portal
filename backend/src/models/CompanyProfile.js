const mongoose = require('mongoose');

const companyProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    companyName: { type: String, trim: true, required: [true, 'Company name is required'], index: true },
    industry: { type: String, trim: true },
    website: { type: String, trim: true },
    description: { type: String, maxlength: 2000, default: '' },
    logoUrl: { type: String, default: null },
    logoPublicId: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CompanyProfile', companyProfileSchema);
