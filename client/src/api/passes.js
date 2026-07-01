import axiosClient from './axiosClient';

export const generatePass = (appointmentId) =>
  axiosClient.post('/passes/generate', { appointmentId });

export const getPassById = (id) => axiosClient.get(`/passes/${id}`);

export const getMyPasses = () => axiosClient.get('/passes/my');

export const emailPass = (id) => axiosClient.post(`/passes/${id}/email`);
