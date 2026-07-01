import axiosClient from './axiosClient';

export const checkIn = (payload) => axiosClient.post('/checkin', payload);

export const checkOut = (payload) => axiosClient.post('/checkout', payload);
