import axiosClient from './axiosClient';

export const getAppointments = (params) => axiosClient.get('/appointments', { params });

export const getAppointmentById = (id) => axiosClient.get(`/appointments/${id}`);

export const createAppointment = (payload) => axiosClient.post('/appointments', payload);

export const selfRegisterAppointment = (payload) =>
  axiosClient.post('/appointments/self-register', payload);

export const approveAppointment = (id, payload) =>
  axiosClient.put(`/appointments/${id}/approve`, payload);

export const rejectAppointment = (id, payload) =>
  axiosClient.put(`/appointments/${id}/reject`, payload);
