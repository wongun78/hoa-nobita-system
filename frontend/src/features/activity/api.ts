import { api } from '../../lib/api';
import type { ActivityLog } from './types';

export const activityApi = {
  getRecent: () => api.get<ActivityLog[]>('/activity/recent'),
  getRecentForClass: (classId: string) => api.get<ActivityLog[]>(`/classes/${classId}/activity`),
};
