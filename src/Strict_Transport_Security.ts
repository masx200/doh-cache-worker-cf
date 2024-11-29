import { CloudflareMiddleWare } from "./CloudflareMiddleWare";
import { bodyToBuffer } from "./bodyToBuffer";
/**
 * 实现HTTP严格传输安全（HSTS）的中间件函数
 * 这个函数主要用于在响应中添加Strict-Transport-Security头，以增强安全性
 * 它通过指定响应体来确保传输的安全性，防止中间人攻击
 *
 * @param request 请求对象，包含请求的相关信息
 * @param env 环境变量，用于访问CloudflareWorkers的环境设置
 * @param ctx 上下文对象，提供了对响应链中其他部分的访问
 * @param next 一个函数，用于执行链中的下一个中间件
 * @returns 返回一个新的响应对象，包含添加了HSTS头的响应
 */
export async function Strict_Transport_Security<Env>(
    ...[request, env, ctx, next]: Parameters<CloudflareMiddleWare<Env>>
): Promise<Response> {
    // console.log(2);
    const response = await next();
    const headers = new Headers(response.headers);

    headers.append("Strict-Transport-Security", "max-age=31536000");
    // console.log(ctx.response.body);
    // 必须把响应的主体转换为Uint8Array才行
    const body = response.body && (await bodyToBuffer(response.body));
    // headers.delete("content-length");
    const res = new Response(body, {
        status: response.status,
        headers,
    });
    return res;
}
