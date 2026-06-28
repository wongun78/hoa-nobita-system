import type { ActivityLog } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Activity, User, FileText, BookOpen, CheckCircle, Bell } from 'lucide-react';

interface RecentActivityTimelineProps {
  activities: ActivityLog[];
}

export function RecentActivityTimeline({ activities }: RecentActivityTimelineProps) {
  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Chưa có hoạt động nào gần đây
      </div>
    );
  }

  const getIcon = (actionType: string) => {
    if (actionType.includes('USER')) return <User className="h-4 w-4 text-blue-500" />;
    if (actionType.includes('CLASS')) return <BookOpen className="h-4 w-4 text-green-500" />;
    if (actionType.includes('ASSIGNMENT')) return <FileText className="h-4 w-4 text-orange-500" />;
    if (actionType.includes('SUBMISSION')) return <CheckCircle className="h-4 w-4 text-purple-500" />;
    if (actionType.includes('MATERIAL')) return <FileText className="h-4 w-4 text-teal-500" />;
    if (actionType.includes('NOTIFICATION')) return <Bell className="h-4 w-4 text-yellow-500" />;
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex gap-4 items-start">
          <div className="mt-1 bg-muted p-2 rounded-full">
            {getIcon(activity.actionType)}
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium leading-none">
              {activity.message}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: vi })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
