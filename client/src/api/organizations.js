import axiosClient from './axiosClient';

export const getMyOrganization = () => axiosClient.get('/organizations/me');

export const updateMyOrganization = (formData) =>
  axiosClient.put('/organizations/me', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// Public endpoint - used by the visitor self-registration page
export const getOrganizationHosts = (organizationId) =>
  axiosClient.get(`/organizations/${organizationId}/hosts`);
