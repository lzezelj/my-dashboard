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
export const eventCategoryLabels: Record<EventCategory, string> = {
  APPOINTMENT: 'Appointment',
  BIRTHDAY: 'Birthday',
  MOVIE: 'Movie',
  TV_SHOW: 'TV show',
  GAME: 'Game',
  TODO: 'Todo',
  OTHER: 'Other',
};
export const eventDetailLabels: Record<string, string> = {
  contactName: 'Contact person',
  contactPhone: 'Phone number',
  relationship: 'Relationship',
  birthYear: 'Birth year',
  giftIdeas: 'Gift ideas',
  director: 'Director',
  releaseYear: 'Release year',
  genre: 'Genre',
  watchOn: 'Cinema or streaming service',
  streamingService: 'Streaming service',
  platform: 'Platform',
  developer: 'Developer',
  progress: 'Progress',
  priority: 'Priority',
  project: 'Project or list',
  estimatedMinutes: 'Estimated minutes',
};
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
  details?: Record<string, string> | null;
  externalUid?: string | null;
  timeZone?: string | null;
  allDay?: boolean;
  location?: string | null;
  url?: string | null;
  recurrenceRule?: string | null;
  status?: string | null;
  sequence?: number | null;
  originalIcs?: string | null;
  recurrenceDates?: string[];
  exclusionDates?: string[];
  recurring: Recurrence | null;
  numberOfRecurrences: number | null;
  recurrenceEndDate?: string | null;
  allowCompletion: boolean;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  occurrenceDate?: string;
  sourceOccurrenceDate?: string;
}
export type EventInput = Omit<
  DashboardEvent,
  'id' | 'userId' | 'createdAt' | 'updatedAt' | 'occurrenceDate'
>;
