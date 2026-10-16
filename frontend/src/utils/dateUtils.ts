export function dateToISOString(date: string): string {
  return new Date(`${date}T00:00:00Z`).toISOString();
}

export function isoToDateInputValue(iso: string): string {
  const date = new Date(iso);

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

export function dateTimeToISOString(date: string, time: string): string {
  return new Date(`${date}T${time}`).toISOString();
}

export function isoToTimeInputValue(iso: string): string {
  const date = new Date(iso);

  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function isoToDisplayDate(iso: string): string {
  const date = new Date(iso);

  return `${date.getUTCDate()}/${date.getUTCMonth() + 1}/${date.getUTCFullYear()}`;
}

export function dateOnlyToDisplay(value: string): string {
  const [year, month, day] = value.slice(0, 10).split('-');
  return year && month && day ? `${day}/${month}/${year}` : 'No date';
}

export function dateOnlyToWeekdayDisplay(value: string): string {
  const date = value.slice(0, 10);
  const weekday = new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'long' });
  return `${weekday}, ${dateOnlyToDisplay(date)}`;
}

export function isoToLocalDateTimeInputValue(iso: string): string {
  const date = new Date(iso);
  return `${localDateInputValue(date)}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function localDateInputValue(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function getCurrentTime() {
  const now = new Date();

  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export function getTimePlusOneMinute() {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 1);

  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}
