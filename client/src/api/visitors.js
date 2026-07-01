import axiosClient from './axiosClient';

export const getVisitors = (params) => axiosClient.get('/visitors', { params });

export const getVisitorById = (id) => axiosClient.get(`/visitors/${id}`);

export const createVisitor = (formData) =>
  axiosClient.post('/visitors', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updateVisitor = (id, formData) =>
  axiosClient.put(`/visitors/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const deleteVisitor = (id) => axiosClient.delete(`/visitors/${id}`);

export const setVisitorBlacklist = (id, payload) =>
  axiosClient.put(`/visitors/${id}/blacklist`, payload);
