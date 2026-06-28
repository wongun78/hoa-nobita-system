import { useQuery } from '@tanstack/react-query';
import { reportsApi } from './api';

export const useSystemReport = () => {
  return useQuery({
    queryKey: ['reports', 'system'],
    queryFn: reportsApi.getSystemReport,
  });
};

export const useClassReport = (classId: string) => {
  return useQuery({
    queryKey: ['reports', 'classes', classId],
    queryFn: () => reportsApi.getClassReport(classId),
    enabled: !!classId,
  });
};
