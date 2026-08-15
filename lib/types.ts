import { Timestamp } from 'firebase/firestore';

export interface Message {
  id: string;
  from: string; // Can be empty for anonymous
  to: string[]; // Array of recipient names/groups
  content: string;
  timestamp: Timestamp | null; // null while the serverTimestamp write is pending
  color?: string; // Optional color for visual variety
  likes?: number; // Number of likes/hearts
  authorUid?: string; // Anonymous Firebase Auth uid for newly created messages
  repostedFrom?: string; // ID of the original message being reposted
  repostComment?: string; // Optional comment added by the reposter
  spaceCode: string; // Links message to space
}

export interface Group {
  id: string; // Lowercase version for ID
  displayName: string; // Formatted display name
  createdAt: Timestamp;
  messageCount: number;
  spaceCode: string; // Links group to space
}

export interface Space {
  code: string; // Unique user-created code
  title: string; // Space title (e.g., "My Event 2025")
  description?: string; // Optional description
  colors: {
    primary: string; // Primary gradient color
    secondary: string; // Secondary gradient color
    accent: string; // Accent color
  };
  popularGroups: string[]; // Custom popular groups for this space
  createdAt: Timestamp;
  createdBy?: string; // Optional creator identifier
  ownerUid?: string; // Anonymous Firebase Auth uid for newly created spaces
  stats: {
    messageCount: number;
    groupCount: number;
    totalLikes: number;
  };
}

export interface SpaceFormData {
  code: string;
  title: string;
  description?: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  popularGroups: string[];
  createdBy?: string;
}

export interface MessageFormData {
  from: string;
  to: string[];
  content: string;
  repostedFrom?: string; // ID of the original message being reposted
  repostComment?: string; // Optional comment added by the reposter
}

export interface Reply {
  id: string;
  from: string; // Can be empty for anonymous
  content: string;
  timestamp: Timestamp | null; // null while the serverTimestamp write is pending
  authorUid?: string; // Anonymous Firebase Auth uid for newly created replies
}

export interface ReplyFormData {
  from: string;
  content: string;
}

export interface RepostFormData {
  from: string;
  to: string[];
  repostComment?: string; // Optional comment added by the reposter
}
