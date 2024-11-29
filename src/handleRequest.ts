import { Env } from "./Env";
import { base64Encode } from "./base64Encode";

/**
 * 处理DNS请求的函数。
 * @param request 原始的请求对象，需要是一个POST请求，其中包含未编码的DNS查询。
 * @param env 包含环境配置的对象，例如DOH_ENDPOINT（DNS over HTTPS 终端）的URL。
 * @returns 返回一个Promise，该Promise解析为从原始服务器获取的响应。
 */
export async function handleRequestPOST(request: Request, env: Env) {
    // Base64 encode request body.
    const body = await request.arrayBuffer();
    if (body.byteLength === 0) {
        return new Response("bad request", { status: 400 });
    }
    const encodedBody = base64Encode(body);

    // Create a request URL with encoded body as query parameter.
    const url = new URL(`${
        env.DOH_ENDPOINT ??
            "https://doh.pub/dns-query"
    }`);
    url.searchParams.append("dns", encodedBody);

    if (!url.href.startsWith("https://")) {
        throw Error(`The DOH_ENDPOINT must be a HTTPS URL.`);
    }
    const headers = new Headers(request.headers);
    headers.append(
        "Forwarded",
        `proto=${new URL(request.url).protocol.slice(0, -1)};host=${
            new URL(request.url).hostname
        };by=${new URL(request.url).hostname};for=${
            request.headers.get("cf-connecting-ip")
        }`,
    );
    // Create a GET request from the original POST request.
    const getRequest = new Request(url.href, {
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
