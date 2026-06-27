export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
  ) {
    super(`HTTP ${status}: ${body.slice(0, 200)}`);
    this.name = "HttpError";
  }
}

interface FetchJsonOptions {
  retries?: number;
}

export async function fetchJson<T>(
  url: string,
  init: RequestInit = {},
  { retries = 3 }: FetchJsonOptions = {},
): Promise<T> {
  let delay = 500;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, init);

    if (res.ok) {
      return res.json() as Promise<T>;
    }

    const isRetryable = res.status === 429 || res.status >= 500;
    if (isRetryable && attempt < retries) {
      const retryAfterHeader = res.headers.get("Retry-After");
      const waitMs = retryAfterHeader
        ? parseInt(retryAfterHeader, 10) * 1000
        : delay;
      await new Promise((r) => setTimeout(r, waitMs));
      delay *= 2;
      continue;
    }

    const body = await res.text().catch(() => "");
    throw new HttpError(res.status, body);
  }

  throw new HttpError(0, "max retries exceeded");
}
