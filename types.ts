
export enum UserRole {
  ADMIN = 'Admin',
  TEAM_LEADER = 'Team Leader',
  MEMBER = 'Member'
}

export enum TicketStatus {
  STARTED = 'Task Started',
  WORK_DONE = 'Work Done',
  REVIEW = 'Review',
  COMPLETE = 'Complete'
}

export interface Team {
  id: string;
  name: string;
  passkey: string;
  leaderId?: string;
  branchId?: string; // LINK TO BRANCH
  createdAt: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  teamId?: string | null; // Optional for Global Admin, required for others
  branchId?: string; // LINK TO BRANCH
  isActive: boolean;
  isApproved: boolean;
  avatar: string;
  requestedTeamName?: string; // For Pending Team Leaders
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: 'Low' | 'Medium' | 'High';
  assignedTo: string;
  creator_name?: string; // Added for display
  teamId: string;
  createdAt: number;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isBot?: boolean;
  chatId: string;
  teamId: string;
  attachment?: {
    type: 'image' | 'video';
    url: string;
  };
}

export interface Vote {
  userId: string;
  optionId: string;
  reason?: string;
}

export interface PollOption {
  id: string;
  text: string;
  requiresReason?: boolean;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  createdBy: string;
  createdAt: number;
  teamId: string;
  votes: Vote[];
}

export interface Reminder {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string;
  userId: string;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  location: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: number;
}

// Leader-created session
export interface StandupSession {
  id: string;
  teamId: string;
  title?: string;
  selectedDate: string;
  createdBy: string;
  createdAt: number;
}

// Member response
export interface StandupResponse {
  id: string;
  standupId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  message: string;
  submittedAt: number;
}
