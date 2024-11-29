/**
 * 定义一个Cloudflare中间件接口，用于规范中间件函数的结构和类型
 * 这个接口主要用于在处理请求时，定义哪些参数是必须的，以及期望的返回类型是什么
 *
 * @template Env 表示一个自定义环境变量的类型，允许在运行时访问特定的环境变量
 * @param request 请求对象，包含所有请求相关的信息，如URL、Headers、Method等
 * @param env 环境变量对象，允许中间件访问在运行时传递的环境变量
 * @param ctx 执行上下文对象，提供关于当前执行环境的上下文信息
 * @param next 一个必须被调用的函数，用于执行链中的下一个中间件或处理函数
 * @returns 返回一个Promise，解析为一个Response对象，表示中间件处理的结果
 */
export interface CloudflareMiddleWare<Env> {
  (
    request: Request,
    env: Env,
    ctx: ExecutionContext,
    next: () => Promise<Response>,
  ): Promise<Response>;
}
