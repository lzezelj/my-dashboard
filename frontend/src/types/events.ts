export const eventCategories = [
  'APPOINTMENT',
  'BIRTHDAY',
  'MOVIE',
  'TV_SHOW',
  'GAME',
  'TODO',
  'OTHER',
] as const;
export const recurrences = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const;
export type EventCategory = (typeof eventCategories)[number];
export type Recurrence = (typeof recurrences)[number];
export interface DashboardEvent {
  id: number;
  userId: number | null;
  category: EventCategory;
  title: string;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  description: string | null;
  recurring: Recurrence | null;
  numberOfRecurrences: number | null;
  allowCompletion: boolean;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  occurrenceDate?: string;
}
export type EventInput = Omit<
  DashboardEvent,
  'id' | 'userId' | 'createdAt' | 'updatedAt' | 'occurrenceDate'
>;
