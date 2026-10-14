import type { DashboardEvent, EventCategory, EventInput } from '../types/events';
const baseUrl = 'http://localhost:3000/api/events';
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
export function getEvents(filters: { category?: EventCategory; from?: string; to?: string } = {}) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) query.set(key, value);
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
export const deleteEvent = (id: number) => request<void>(`${baseUrl}/${id}`, { method: 'DELETE' });
