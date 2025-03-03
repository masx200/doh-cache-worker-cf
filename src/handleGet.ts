import { Env } from "./Env";
/**
 * Handles GET requests to the DNS resolver service.
 *
 * This function is responsible for processing GET requests, forwarding them to the designated DNS resolver endpoint, and returning the response.
 * It also adds forwarding headers to the request to ensure that the original request information is passed on.
 *
 * @param env Environment variables, containing configuration information such as the DNS resolver endpoint.
 * @param originurl The URL of the original request, used to construct the request to the DNS resolver service.
 * @param request The original request object, containing headers and other information needed to construct the new request.
 * @returns Returns the response from the DNS resolver service.
 */
export async function handleGet(env: Env, originurl: URL, request: Request) {
    const upurl = new URL(`${
        env.DOH_ENDPOINT ??
            "https://doh.pub/dns-query"
    }`);
    upurl.search = originurl.search;
    const headers = new Headers(request.headers);
    headers.append(
        "Forwarded",
        `proto=${new URL(originurl).protocol.slice(0, -1)};host=${
            new URL(originurl).hostname
        };by=${originurl.host};for=${request.headers.get("cf-connecting-ip")}`,
    );
    if (!upurl.href.startsWith("https://")) {
        throw Error(`The DOH_ENDPOINT must be a HTTPS URL.`);
    }
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
