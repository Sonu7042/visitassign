import axiosClient from './axiosClient';

export const getDashboardStats = () => axiosClient.get('/dashboard/stats');

export const getDashboardAnalytics = () => axiosClient.get('/dashboard/analytics');
