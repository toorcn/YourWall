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
}

