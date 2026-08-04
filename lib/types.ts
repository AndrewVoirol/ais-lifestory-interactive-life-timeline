// ============================================================
// Shared types for the collaborative life story system
// ============================================================

/** A photo attached to a life event as supporting evidence */
export interface EventPhoto {
  id: string;
  /** Base64 data URI (data:image/...;base64,...) */
  dataUrl: string;
  uploadedBy: string;
  uploadedByColor: string;
  caption?: string;
  timestamp: number;
}

/** A comment/correction on a life event */
export interface EventComment {
  id: string;
  contributorName: string;
  contributorColor: string;
  content: string;
  timestamp: number;
  /** If this comment disputes/corrects the event */
  isCorrection?: boolean;
}

/** A record of a correction made to an event */
export interface Correction {
  contributorName: string;
  contributorColor: string;
  field: 'date' | 'description' | 'title' | 'order';
  oldValue: string;
  newValue: string;
  timestamp: number;
}

/** A life event on the timeline */
export interface LifeEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  /** Who contributed this event */
  contributedBy?: string;
  /** Contributor's assigned color */
  contributorColor?: string;
  /** Contributor's unique ID */
  contributorId?: string;
  /** Photos attached as evidence */
  photos?: EventPhoto[];
  /** Comment thread */
  comments?: EventComment[];
  /** History of corrections */
  corrections?: Correction[];
}

/** A contributor in the session */
export interface Contributor {
  id: string;
  name: string;
  color: string;
  /** Is this person the "subject" of the story? */
  isSubject?: boolean;
  lastSeen: number;
  isOnline: boolean;
}

/** Chat message with contributor attribution */
export interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  contributorName?: string;
  contributorColor?: string;
  timestamp?: number;
}

// ============================================================
// SSE message types sent between server and clients
// ============================================================

export type SSEMessage =
  | { type: 'init'; events: LifeEvent[]; users: Contributor[] }
  | { type: 'update'; events: LifeEvent[] }
  | { type: 'presence'; users: Contributor[] }
  | { type: 'user-count'; count: number };

// ============================================================
// API request types
// ============================================================

export type EventMutation =
  | { type: 'add'; payload: LifeEvent }
  | { type: 'update'; payload: LifeEvent[] }
  | { type: 'delete'; payload: string }
  | { type: 'reorder'; payload: string[] }
  | { type: 'add-comment'; payload: { eventId: string; comment: EventComment } }
  | { type: 'add-photo'; payload: { eventId: string; photo: EventPhoto } }
  | { type: 'add-correction'; payload: { eventId: string; correction: Correction } }
  | { type: 'join'; payload: Contributor }
  | { type: 'leave'; payload: string }; // contributor id

// ============================================================
// Contributor color palette — warm, distinguishable
// ============================================================

export const CONTRIBUTOR_COLORS = [
  '#e07a5f', // terracotta
  '#3d85c6', // steel blue
  '#81b29a', // sage
  '#f2cc8f', // sand
  '#9b5de5', // violet
  '#f15bb5', // pink
  '#00bbf9', // cyan
  '#fee440', // yellow
  '#8ac926', // lime
  '#ff6b6b', // coral
] as const;

export function getRandomColor(): string {
  return CONTRIBUTOR_COLORS[Math.floor(Math.random() * CONTRIBUTOR_COLORS.length)];
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}
