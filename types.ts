
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
  linkedinId?: string;
  githubId?: string;
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
  branchId: string; // LINK TO BRANCH
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
  chatType?: 'group' | 'dm';
  recipientId?: string;
  teamId: string;
  branchId: string; // LINK TO BRANCH
  attachment?: {
    type: 'image' | 'video';
    url: string;
  };
  deletedFor?: string[]; // Array of user IDs who deleted this message for themselves
  isDeleted?: boolean; // Deleted for everyone
  isEdited?: boolean;
  replyToId?: string; // ID of the message being replied to
  forwardedFrom?: string; // Name of the original sender
  isPinned?: boolean; // Is the message pinned
  pinExpiresAt?: number;
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
  branchId: string; // LINK TO BRANCH
  votes: Vote[];
}

export interface Reminder {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string;
  userId: string;
  teamId: string;
  branchId: string; // LINK TO BRANCH
}

export interface ScheduleEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  location: string;
  teamId: string;
  branchId: string; // LINK TO BRANCH
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
  branchId: string; // LINK TO BRANCH
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

export type ProjectStatus = 'Active' | 'Completed' | 'Pending';

export interface ProjectMember {
  userId: string;
  name: string;
  role?: string;
  avatar?: string;
}

export interface Project {
  id: string;
  teamId: string;
  branchId: string; // LINK TO BRANCH
  name: string;
  description: string;
  detailedDescription: string;
  githubLink: string;
  status: ProjectStatus;
  priority?: 'Low' | 'Medium' | 'High';
  progress?: number;
  startDate: string;
  deadline: string;
  teamMembers: ProjectMember[];
  excelFileData?: string; // base64 data for simplicity, or URL
  excelFileName?: string;
  createdBy: string;
  createdAt: number;
}

