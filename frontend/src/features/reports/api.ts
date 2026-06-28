import { api } from '../../lib/api';
import type { SystemReportResponse, ClassReportResponse } from './types';

export const reportsApi = {
  getSystemReport: async (): Promise<SystemReportResponse> => {
    const response = await api.get('/reports/system');
    return response.data.data;
  },

  getClassReport: async (classId: string): Promise<ClassReportResponse> => {
    const response = await api.get(`/reports/classes/${classId}`);
    return response.data.data;
  },
};
