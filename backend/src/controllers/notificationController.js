const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { getPagination, buildPaginatedResponse } = require('../utils/pagination');

const listMyNotifications = catchAsync(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { user: req.user.id };
  if (req.query.unreadOnly === 'true') filter.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user.id, isRead: false }),
  ]);

  res.status(200).json({ success: true, unreadCount, ...buildPaginatedResponse(notifications, total, page, limit) });
});

const markAsRead = catchAsync(async (req, res, next) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.notificationId, user: req.user.id },
    { $set: { isRead: true } },
    { new: true }
  );
  if (!notification) return next(new AppError('Notification not found.', 404));
  res.status(200).json({ success: true, data: { notification } });
});

const markAllAsRead = catchAsync(async (req, res) => {
  await Notification.updateMany({ user: req.user.id, isRead: false }, { $set: { isRead: true } });
  res.status(200).json({ success: true, message: 'All notifications marked as read.' });
});

module.exports = { listMyNotifications, markAsRead, markAllAsRead };
