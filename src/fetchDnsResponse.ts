import { Env } from "./Env";

export async function fetchDnsResponse(upurl: URL, headers: Headers) {
    const getRequest = new Request(upurl.href, {
        method: "GET",
        body: null,
        headers: headers,
    });
    console.log(
        JSON.stringify(
            {
                request: {
                    method: getRequest.method,
                    url: getRequest.url,
                    Headers: Object.fromEntries(getRequest.headers),
                },
            },
            null,
            2,
        ),
    );
    // Fetch response from origin server.
    return await fetch(getRequest, {
        cf: {
            cacheEverything: true,
        },
    });
}
export function get_doh_url(env: Env): string[] {
    if (
        env.DOH_ENDPOINT?.startsWith("[") &&
        env.DOH_ENDPOINT?.endsWith("]")
    ) {
        const dohs = JSON.parse(env.DOH_ENDPOINT ?? "");

        if (dohs.length) {
            return dohs; //new URL(dohs[Math.floor(dohs.length * Math.random())]).href;
        }
    }
    return [
        new URL(env.DOH_ENDPOINT ?? "https://dns.alidns.com/dns-query")
            .href,
    ];
}
