// Fetch a URL and parse the response body as JSON.
// Throws when the request fails or the response is not OK.
export default async function fetchJson<T>(
    url: string,
    description: string,
    signal?: AbortSignal,
): Promise<T> {
    const response = await fetch(url, { signal });
    if (!response.ok) {
        throw new Error(
            `Failed to fetch ${description}: HTTP ${response.status} ${response.statusText}`,
        );
    }
    return response.json() as Promise<T>;
}
