/**
 * The package's own HTTP client, built on fetch.
 *
 * It is deliberately tiny and mirrors the slice of the axios interface the
 * table needs — `get(url, { params })` resolving to `{ data }` — so an
 * application can pass its own client instead without adapting anything.
 *
 * @param {{ headers?: Record<string, string>, credentials?: RequestCredentials }} [options]
 */
export function createHttpClient(options = {}) {
    const { headers = {}, credentials = 'same-origin' } = options;

    function buildUrl(url, params = {}) {
        const query = new URLSearchParams();

        for (const [key, value] of Object.entries(params)) {
            if (value === null || value === undefined) {
                continue;
            }

            query.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : value);
        }

        const qs = query.toString();

        return qs ? `${url}${url.includes('?') ? '&' : '?'}${qs}` : url;
    }

    async function get(url, config = {}) {
        const response = await fetch(buildUrl(url, config.params), {
            method: 'GET',
            credentials,
            signal: config.signal,
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...headers,
            },
        });

        // fetch only rejects on network failure, so a 403 would otherwise read as data.
        if (!response.ok) {
            const error = new Error(`Request to ${url} failed with status ${response.status}`);
            error.status = response.status;
            error.response = response;

            throw error;
        }

        return { data: await response.json() };
    }

    return { get };
}

export const httpClient = createHttpClient();

/**
 * A write, for the few things a table does besides reading: saving a view, storing a
 * preference. Same envelope as `get`, plus the token Laravel expects on anything that changes
 * state — read from the page's own meta tag, so no application code has to pass it in.
 */
export async function sendJson(url, method, body = {}) {
    const token = document.querySelector('meta[name="csrf-token"]')?.content ?? '';

    const response = await fetch(url, {
        method,
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': token,
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const error = new Error(`Request to ${url} failed with status ${response.status}`);
        error.status = response.status;
        error.payload = await response.json().catch(() => null);

        throw error;
    }

    return { data: await response.json() };
}
