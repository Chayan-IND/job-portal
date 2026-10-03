import client from './client';

export const getMyStudentProfile = () => client.get('/students/me').then((r) => r.data);
export const updateMyStudentProfile = (payload) =>
  client.patch('/students/me', payload).then((r) => r.data);
export const uploadResume = (file) => {
  const formData = new FormData();
  formData.append('resume', file);
  return client
    .post('/students/me/resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

export const getMyCompanyProfile = () => client.get('/companies/me').then((r) => r.data);
export const updateMyCompanyProfile = (payload) =>
  client.patch('/companies/me', payload).then((r) => r.data);
export const uploadLogo = (file) => {
  const formData = new FormData();
  formData.append('logo', file);
  return client
    .post('/companies/me/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};
