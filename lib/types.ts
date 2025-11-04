import { Timestamp } from 'firebase/firestore';

export interface Message {
  id: string;
  from: string; // Can be empty for anonymous
  to: string[]; // Array of recipient names/groups
  content: string;
  timestamp: Timestamp;
  color?: string; // Optional color for visual variety
  likes?: number; // Number of likes/hearts
  imageUrl?: string; // Optional image attachment
  repostedFrom?: string; // ID of the original message being reposted
  repostComment?: string; // Optional comment added by the reposter
}

export interface Group {
  id: string; // Lowercase version for ID
  displayName: string; // Formatted display name
  createdAt: Timestamp;
  messageCount: number;
}

export interface MessageFormData {
  from: string;
  to: string[];
  content: string;
  imageFile?: File; // Optional image file to upload
  repostedFrom?: string; // ID of the original message being reposted
  repostComment?: string; // Optional comment added by the reposter
}

export interface Reply {
  id: string;
  from: string; // Can be empty for anonymous
  content: string;
  timestamp: Timestamp;
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

