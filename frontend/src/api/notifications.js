import client from './client';

export const listMyNotifications = (params) =>
  client.get('/notifications', { params }).then((r) => r.data);
export const markNotificationRead = (id) =>
  client.patch(`/notifications/${id}/read`).then((r) => r.data);
export const markAllNotificationsRead = () =>
  client.patch('/notifications/read-all').then((r) => r.data);
