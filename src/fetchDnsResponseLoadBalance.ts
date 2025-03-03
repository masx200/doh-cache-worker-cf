import { ArrayShuffle } from "./ArrayShuffle";
import { Env } from "./Env";
import { fetchDnsResponse, get_doh_url } from "./fetchDnsResponse";

export async function fetchDnsResponseLoadBalance(
    env: Env,
    upurl: URL,
    headers: Headers,
) {
    const dohs = get_doh_url(env); // get the doh url from the env

    const errors = Array<string>();
    for (const doh of ArrayShuffle(dohs)) {
        const dohurl = new URL(doh);
        dohurl.search = upurl.search;
        const response = await fetchDnsResponse(dohurl, headers);

        if (
            response.ok &&
            response.headers.get("content-type") === "application/dns-message"
        ) {
            return response;
        } else {
            console.error(
                `doh=${doh} ,status=${response.status} ,statusText=${response.statusText}`,
            );
            errors.push(
                `doh=${doh} ,status=${response.status} ,statusText=${response.statusText}`,
            );
            continue;
        }
    }
    return new Response(
        "all doh server response failed\n" + errors.join("\n"),
        {
            status: 502,
        },
    );
}
