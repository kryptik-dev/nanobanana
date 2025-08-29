// Message types for chat interaction
export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: Date;
  profilePicture?: string; // URL to profile picture
  images?: Array<{
    url: string;
    type: 'input' | 'output';
    alt?: string;
  }>;
}

// Model interface for LLM models
export interface Model {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  systemPrompt: string;
}

// User profile interface
export interface UserProfile {
  id: string;
  name: string;
  profilePicture?: string;
  email?: string;
}