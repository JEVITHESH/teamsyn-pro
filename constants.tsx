
import { User, UserRole, ScheduleEvent, Poll } from './types';

export const INITIAL_USERS: User[] = [
  { id: '1', email: 'admin@teamsync.com', name: 'Alex Admin', role: UserRole.ADMIN, isActive: true, isApproved: true, avatar: 'https://picsum.photos/seed/admin/100' },
  { id: '2', email: 'leader@teamsync.com', name: 'Sarah Leader', role: UserRole.TEAM_LEADER, isActive: true, isApproved: true, avatar: 'https://picsum.photos/seed/sarah/100' },
  { id: '3', email: 'member@teamsync.com', name: 'John Member', role: UserRole.MEMBER, isActive: true, isApproved: true, avatar: 'https://picsum.photos/seed/john/100' },
];

