import { Env } from "./Env";
import { handleGet } from "./handleGet";
import { handleRequest } from "./handleRequest";
//@ts-ignore
import welcome from "./welcome.html";
/**
 * Fetch中间件函数，用于处理 incoming requests and manages responses.
 *
 * 此中间件负责根据不同的请求路径和方法进行日志记录、请求路由和响应处理。
 * 它支持特定路径的处理，例如根路径和DNS查询路径，并根据请求方法做出相应的响应。
 *
 * @param request 请求对象，包含请求方法、URL和头部信息等。
 * @param env 环境变量对象，包含应用程序的配置和密钥。
 * @param ctx 执行上下文对象，用于在请求处理过程中传递和访问上下文信息。
 * @returns 返回一个Promise，解析为一个Response对象，作为对请求的响应。
 */
export async function fetchMiddleWare(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
): Promise<Response> {
    console.log(
        JSON.stringify(
            {
                request: {
                    method: request.method,
                    url: request.url,
                    Headers: Object.fromEntries(request.headers),
                },
            },
            null,
            2,
        ),
    );
    const url = new URL(request.url);
    const nextUrl = new URL(request.url);
    if (nextUrl.pathname === "/") {
        return new Response(welcome, {
            headers: {
                "content-type": "text/html",
            },
        });
    }
    if (url.pathname !== "/dns-query") {
        return new Response("not found", { status: 404 });
    }
    if (request.method === "POST") {
        return handleRequest(request, env);
    }
    if (request.method !== "GET") {
        return new Response("method not allowed", { status: 405 });
    }
    return handleGet(env, url, request);
}
