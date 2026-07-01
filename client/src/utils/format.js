import dayjs from 'dayjs';

export const formatDate = (date) => (date ? dayjs(date).format('MMM D, YYYY') : '-');

export const formatDateTime = (date) => (date ? dayjs(date).format('MMM D, YYYY h:mm A') : '-');

export const formatTime = (date) => (date ? dayjs(date).format('h:mm A') : '-');

export const toInputDate = (date) => (date ? dayjs(date).format('YYYY-MM-DD') : '');

export const toInputDateTime = (date) => (date ? dayjs(date).format('YYYY-MM-DDTHH:mm') : '');

export const monthLabel = (year, month) => dayjs(`${year}-${month}-01`).format('MMM YYYY');

export const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || 'Something went wrong';
