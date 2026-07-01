import axiosClient from './axiosClient';

export const login = (payload) => axiosClient.post('/auth/login', payload);

export const register = (payload) => axiosClient.post('/auth/register', payload);

export const logout = () => axiosClient.post('/auth/logout');

export const getMe = () => axiosClient.get('/auth/me');

export const sendOtp = (payload) => axiosClient.post('/auth/send-otp', payload);

export const verifyOtp = (payload) => axiosClient.post('/auth/verify-otp', payload);
