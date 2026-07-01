import axiosClient from './axiosClient';

export const getVisitors = (params) => axiosClient.get('/visitors', { params });

export const getVisitorById = (id) => axiosClient.get(`/visitors/${id}`);

// Do not set Content-Type manually. The browser must add the multipart
// boundary generated for this specific FormData body.
export const createVisitor = (formData) => axiosClient.post('/visitors', formData);

export const updateVisitor = (id, formData) =>
  axiosClient.put(`/visitors/${id}`, formData);

export const deleteVisitor = (id) => axiosClient.delete(`/visitors/${id}`);

export const setVisitorBlacklist = (id, payload) =>
  axiosClient.put(`/visitors/${id}/blacklist`, payload);
