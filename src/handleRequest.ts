import { Env } from "./Env";
import { base64Encode } from "./base64Encode";
import { get_doh_url } from "./fetchDnsResponse";
import { fetchDnsResponseLoadBalance } from "./fetchDnsResponseLoadBalance";

/**
 * 处理DNS请求的函数。
 * @param request 原始的请求对象，需要是一个POST请求，其中包含未编码的DNS查询。
 * @param env 包含环境配置的对象，例如DOH_ENDPOINT（DNS over HTTPS 终端）的URL。
 * @returns 返回一个Promise，该Promise解析为从原始服务器获取的响应。
 */
export async function handleRequestPOST(request: Request, env: Env) {
     const dohs = get_doh_url(env); // get the doh url from the env
    
    // Base64 encode request body.
    //@ts-ignore
    const body = new Uint8Array(await request.arrayBuffer());
    if (body.byteLength === 0) {
        return new Response("bad request", { status: 400 });
    }
    const encodedBody = base64Encode(body);

    // Create a request URL with encoded body as query parameter.
    const upurl = new URL(
        `${dohs.length ? dohs[Math.floor(Math.random() * dohs.length)] : "https://doh.pub/dns-query"}`,
    );
    upurl.searchParams.append("dns", encodedBody);

    if (!upurl.href.startsWith("https://")) {
        throw Error(`The DOH_ENDPOINT must be a HTTPS URL.`);
    }
    const headers = new Headers(request.headers);
    headers.append(
        "Forwarded",
        `proto=${new URL(request.url).protocol.slice(0, -1)};host=${
            new URL(request.url).hostname
        };by=${new URL(request.url).hostname};for=${
            request.headers.get(
                "cf-connecting-ip",
            )
        }`,
    );
    // Create a GET request from the original POST request.
    return fetchDnsResponseLoadBalance(env, upurl, headers);
}
