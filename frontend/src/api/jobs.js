import client from './client';

export const listJobs = (params) => client.get('/jobs', { params }).then((r) => r.data);
export const getJob = (jobId) => client.get(`/jobs/${jobId}`).then((r) => r.data);
export const listMyJobs = (params) => client.get('/jobs/mine', { params }).then((r) => r.data);
export const getMyJobStats = () => client.get('/jobs/mine/stats').then((r) => r.data);
export const createJob = (payload) => client.post('/jobs', payload).then((r) => r.data);
export const updateJob = (jobId, payload) =>
  client.patch(`/jobs/${jobId}`, payload).then((r) => r.data);
export const deleteJob = (jobId) => client.delete(`/jobs/${jobId}`).then((r) => r.data);
