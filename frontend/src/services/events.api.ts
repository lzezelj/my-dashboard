import type { DashboardEvent, EventCategory, EventInput } from '../types/events';
import { apiUrl } from '../config';

const baseUrl = `${apiUrl}/api/events`;
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, credentials: 'include' });
  if (!response.ok) {
    if (response.status === 401 && window.location.pathname !== '/unauthorized') {
      window.location.assign('/unauthorized');
    }
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? 'Event request failed');
  }
  return response.status === 204 ? (undefined as T) : (response.json() as Promise<T>);
}
export function getEvents(
  filters: { category?: EventCategory; from?: string; to?: string; upcoming?: boolean } = {},
) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) query.set(key, String(value));
  });
  return request<DashboardEvent[]>(`${baseUrl}${query.size ? `?${query}` : ''}`);
}
export const createEvent = (event: EventInput) =>
  request<DashboardEvent>(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
export const updateEvent = (id: number, event: Partial<EventInput>) =>
  request<DashboardEvent>(`${baseUrl}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
export const updateOccurrenceDescription = (
  id: number,
  occurrenceDate: string,
  description: string,
) =>
  request<DashboardEvent>(`${baseUrl}/${id}/occurrences/${occurrenceDate}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
  });
export const updateOccurrence = (
  id: number,
  occurrenceDate: string,
  update: { description?: string; date?: string },
) =>
  request<DashboardEvent>(`${baseUrl}/${id}/occurrences/${occurrenceDate}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update),
  });
export const getEventOccurrences = (id: number) =>
  request<DashboardEvent[]>(`${baseUrl}/${id}/occurrences`);
export type EventExport = {
  version: 2;
  exportedAt: string;
  events: Array<
    Omit<EventInput, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'occurrenceDate'> & {
      occurrenceOverrides: Array<{
        occurrenceDate: string;
        date: string | null;
        description: string | null;
      }>;
    }
  >;
};
export const exportEvents = () => request<EventExport>(`${baseUrl}/export`);
export async function exportIcs(): Promise<string> {
  const response = await fetch(`${baseUrl}/export/ics`, { credentials: 'include' });
  if (!response.ok) throw new Error('Could not export ICS calendar');
  return response.text();
}
export type IcsPreviewEvent = Partial<EventInput> & {
  sourceIndex: number;
  title: string;
  warnings: string[];
};
export const previewIcsImport = (ics: string) =>
  request<{ events: IcsPreviewEvent[] }>(`${baseUrl}/import/ics/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ics }),
  });
export const importIcs = (ics: string, selectedIndexes: number[]) =>
  request<ImportEventsResult>(`${baseUrl}/import/ics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ics, selectedIndexes }),
  });
export const checkImportDuplicates = (events: Array<Partial<EventInput>>) =>
  request<{
    duplicates: number[];
    matches: Array<{
      index: number;
      existing: DashboardEvent | null;
      duplicateOfIndex: number | null;
    }>;
  }>(`${baseUrl}/import/duplicates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ events }),
  });
export type ImportEventsResult = {
  imported: number;
  skipped: Array<{ index: number; message: string }>;
};
export const importEvents = (
  events: Array<{
    sourceIndex: number;
    event: Partial<EventInput> & { occurrenceOverrides?: unknown[] };
    preserveOverrides: boolean;
  }>,
) =>
  request<ImportEventsResult>(`${baseUrl}/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ events }),
  });
export const deleteEvent = (id: number) => request<void>(`${baseUrl}/${id}`, { method: 'DELETE' });
export const deleteEvents = (ids: number[]) =>
  request<{ count: number }>(`${baseUrl}/bulk`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
export const deleteAllEvents = () =>
  request<{ count: number }>(`${baseUrl}/all`, { method: 'DELETE' });
