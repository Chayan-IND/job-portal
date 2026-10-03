const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const AppError = require('../utils/AppError');

const memoryStorage = multer.memoryStorage();

const resumeUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new AppError('Resume must be a PDF or Word document.', 400));
    }
    return cb(null, true);
  },
}).single('resume');

const logoUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new AppError('Logo must be an image file.', 400));
    }
    return cb(null, true);
  },
}).single('logo');

function handleUpload(uploader) {
  return (req, res, next) => {
    uploader(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') return next(new AppError('File is too large.', 400));
        return next(new AppError(err.message, 400));
      }
      if (err) return next(err);
      return next();
    });
  };
}

function streamToCloudinary(buffer, folder, resourceType = 'raw') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      }
    );
    stream.end(buffer);
  });
}

async function deleteFromCloudinary(publicId, resourceType = 'raw') {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

module.exports = {
  uploadResumeMiddleware: handleUpload(resumeUpload),
  uploadLogoMiddleware: handleUpload(logoUpload),
  streamToCloudinary,
  deleteFromCloudinary,
};
