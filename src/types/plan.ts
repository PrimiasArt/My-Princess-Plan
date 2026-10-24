export type AppLanguage = 'vi' | 'th';

export type StickerCategory = 'royal' | 'pets' | 'activities' | 'expressions';

export interface StickerDefinition {
  id: string;
  name: string;
  nameTh: string;
  subtitle: string;
  subtitleTh: string;
  category: StickerCategory;
  emoji: string;
  imageUrl?: string;
  bgColor: string;
  borderColor: string;
  defaultNote?: string;
  defaultNoteTh?: string;
  defaultDuration?: string;
  defaultDurationTh?: string;
}

export interface ScheduledActivity {
  id: string;
  stickerId: string;
  title: string;
  timeRange: string;
  location: string;
  note: string;
  moodStickerId?: string;
  hearts: number;
  addedBy: 'prince' | 'princess';
}

export interface StickyNoteItem {
  id: string;
  author: 'prince' | 'princess';
  authorName: string;
  content: string;
  color: 'pink' | 'yellow' | 'mint' | 'lavender' | 'peach';
  expressionStickerId: string;
  tag: string;
  targetSlotId?: string; // undefined = general board note
  createdAt: string;
  pinned?: boolean;
}

export interface FloatingStickerItem {
  id: string;
  stickerId: string;
  x: number; // percentage 5..90
  y: number; // percentage 5..90
  rotation: number; // degrees -18..18
  scale: number;
  caption?: string;
}

export interface TimeSlot {
  id: string;
  periodName: string;
  timeLabel: string;
  icon: string;
  themeColor: string;
  activities: ScheduledActivity[];
}

export type ApprovalStatus = 'pending' | 'approved' | 'revision_requested';

export interface DatePlan {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  targetTime: string; // HH:mm
  dressCode: string;
  princessMood: string;
  approvalStatus: ApprovalStatus;
  approvalMessage?: string;
  bobaBribeCount: number;
  slots: TimeSlot[];
  stickyNotes: StickyNoteItem[];
  floatingStickers: FloatingStickerItem[];
  updatedAt: number;
}

export interface CoupleRoomData {
  roomPin: string;
  princeName: string;
  princessName: string;
  activePlanId: string;
  plans: DatePlan[];
  updatedAt: number;
}

export interface FirebaseConfigInput {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}
