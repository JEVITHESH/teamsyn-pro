
import { User, UserRole, ScheduleEvent, Poll } from './types';

export const INITIAL_USERS: User[] = [
  { id: '1', email: 'admin@teamsync.com', name: 'Alex Admin', role: UserRole.ADMIN, isActive: true, isApproved: true, avatar: 'https://picsum.photos/seed/admin/100' },
  { id: '2', email: 'leader@teamsync.com', name: 'Sarah Leader', role: UserRole.TEAM_LEADER, isActive: true, isApproved: true, avatar: 'https://picsum.photos/seed/sarah/100' },
  { id: '3', email: 'member@teamsync.com', name: 'John Member', role: UserRole.MEMBER, isActive: true, isApproved: true, avatar: 'https://picsum.photos/seed/john/100' },
];

export const MOCK_SCHEDULES: ScheduleEvent[] = [
  { id: 's1', title: 'Weekly Sync', date: '2023-11-20', description: 'Review progress and blockers', location: 'Zoom Room A' },
  { id: 's2', title: 'Product Demo', date: '2023-11-22', description: 'Showcase new features to stakeholders', location: 'Conference Hall' },
  { id: 's3', title: 'Project Kickoff', date: '2023-11-25', description: 'Planning the Q1 roadmap', location: 'HQ Office' },
];

export const MOCK_POLLS: Poll[] = [
  {
    id: 'p1',
    question: 'Initialize System Migration?',
    createdBy: '2',
    createdAt: Date.now(),
    options: [
      { id: 'o1', text: 'Yes' },
      { id: 'o2', text: 'No' },
    ],
    votes: [
      { userId: '1', optionId: 'o1', reason: 'Infrastructure is ready.' },
      { userId: '2', optionId: 'o1' }
    ],
    teamId: 'mock_team'
  }
];
