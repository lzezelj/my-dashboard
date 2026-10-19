const RETRYABLE_STATUS_CODES = new Set([502, 503, 504]);

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));

export async function fetchWithWakeRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  try {
    const response = await fetch(input, init);
    if (!RETRYABLE_STATUS_CODES.has(response.status)) return response;
  } catch (error) {
    if (!(error instanceof TypeError)) throw error;
  }

  await wait(1_500);
  return fetch(input, init);
}
