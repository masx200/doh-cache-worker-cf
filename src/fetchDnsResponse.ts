import { Env } from "./Env";

/**
 * 从上游 DoH 服务器获取 DNS 响应，并使用标准 Cache API 进行缓存。
 *
 * 与 Cloudflare 专有的 `cf: { cacheEverything: true }` 不同，此实现使用
 * `caches.default`（标准 Service Worker Cache API），可部署到 Cloudflare Workers、
 * Deno Deploy、Vercel Edge Runtime 等任何支持 Cache API 的边缘平台。
 *
 * 缓存策略：
 * - 先查缓存（cache.match），命中则直接返回，不回源。
 * - 未命中则回源 fetch，响应为 200 且 Content-Type 为 application/dns-message 时写入缓存。
 * - 写缓存通过 ctx.waitUntil 异步执行，不阻塞响应返回。
 * - 若平台不支持 caches API（全局无 caches 对象），则退化为直接 fetch，保证兼容性。
 *
 * @param upurl   上游 DoH 服务的完整请求 URL（含 ?dns= 参数）
 * @param headers 转发给上游的请求头
 * @param ctx     Worker 执行上下文，用于 ctx.waitUntil 异步写缓存（可选）
 */
export async function fetchDnsResponse(
    upurl: URL,
    headers: Headers,
    ctx?: ExecutionContext,
) {
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

    // 若平台不支持 Cache API，直接回源
    if (typeof caches === "undefined") {
        return await fetch(getRequest);
    }

    const cache = caches.default;

    // 1. 尝试读取缓存
    const cachedResponse = await cache.match(getRequest);
    if (cachedResponse) {
        console.log(`Cache hit: ${getRequest.url}`);
        return cachedResponse;
    }

    // 2. 缓存未命中，回源获取
    const response = await fetch(getRequest);

    // 3. 仅缓存成功的 DNS 响应（200 + application/dns-message）
    if (
        response.status === 200 &&
        response.headers.get("content-type") === "application/dns-message"
    ) {
        // 构造可缓存的响应副本，保留原始 Cache-Control；
        // 若上游未设置，则默认缓存 300 秒（DNS TTL 通常在此范围内）。
        const resHeaders = new Headers(response.headers);
        if (!resHeaders.has("Cache-Control")) {
            resHeaders.set("Cache-Control", "public, max-age=300");
        }
        const responseToCache = new Response(response.clone().body, {
            status: response.status,
            statusText: response.statusText,
            headers: resHeaders,
        });

        // 异步写缓存，不阻塞当前响应
        const putPromise = cache
            .put(getRequest, responseToCache)
            .then(() => console.log(`Cache stored: ${getRequest.url}`))
            .catch((err) =>
                console.error(`Cache put failed: ${getRequest.url}`, err),
            );

        if (ctx) {
            ctx.waitUntil(putPromise);
        }
    }

    return response;
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
