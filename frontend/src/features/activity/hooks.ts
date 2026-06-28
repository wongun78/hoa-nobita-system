import { useQuery } from '@tanstack/react-query';
import { activityApi } from './api';

export const useRecentActivity = () => {
  return useQuery({
    queryKey: ['activity', 'recent'],
    queryFn: () => activityApi.getRecent().then((res: any) => res.data),
  });
};

export const useClassActivity = (classId: string) => {
  return useQuery({
    queryKey: ['activity', 'class', classId],
    queryFn: () => activityApi.getRecentForClass(classId).then((res: any) => res.data),
    enabled: !!classId,
  });
};
