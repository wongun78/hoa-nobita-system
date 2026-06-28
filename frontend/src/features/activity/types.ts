export interface ActivityLog {
  id: string;
  actionType: string;
  message: string;
  actorName: string;
  targetName: string;
  createdAt: string;
}
