import axiosClient from './axiosClient';

export const getVisitorsReport = (params) => axiosClient.get('/reports/visitors', { params });

export const getAppointmentsReport = (params) =>
  axiosClient.get('/reports/appointments', { params });

export const getCheckLogsReport = (params) => axiosClient.get('/reports/check-logs', { params });

const REPORT_PATHS = {
  visitors: '/reports/visitors',
  appointments: '/reports/appointments',
  'check-logs': '/reports/check-logs',
};

// Downloads a report as CSV by fetching it as a blob (the endpoint requires
// the Authorization header, so a plain <a href> won't work) and saving it.
export const downloadReportCsv = async (reportKey, params, filename) => {
  const response = await axiosClient.get(REPORT_PATHS[reportKey], {
    params: { ...params, format: 'csv' },
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename || `${reportKey}-report.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
