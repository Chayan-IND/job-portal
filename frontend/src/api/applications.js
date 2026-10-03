import client from './client';

export const applyToJob = (jobId, payload) =>
  client.post(`/applications/jobs/${jobId}/apply`, payload).then((r) => r.data);
export const listMyApplications = (params) =>
  client.get('/applications/me', { params }).then((r) => r.data);
export const getMyApplicationStats = () => client.get('/applications/me/stats').then((r) => r.data);
export const listApplicationsForJob = (jobId, params) =>
  client.get(`/applications/jobs/${jobId}`, { params }).then((r) => r.data);
export const updateApplicationStatus = (applicationId, status) =>
  client.patch(`/applications/${applicationId}/status`, { status }).then((r) => r.data);
