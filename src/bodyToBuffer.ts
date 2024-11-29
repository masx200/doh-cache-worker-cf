/**
 * 将给定的请求体转换为 Uint8Array 类型的缓冲区.
 *
 * 此函数的目的是处理可能的请求体，将其转化为缓冲区格式. 这在需要对请求数据进行进一步处理，
 * 或者需要以二进制格式传输数据时特别有用.
 *
 * @param body - 可选的请求体，可以是实现了 BodyInit 接口的任何类型，或者为 null.
 *               这允许函数灵活地处理不同类型的输入，包括未提供的请求体.
 * @returns 返回一个 Promise，解析为 Uint8Array 类型的缓冲区.
 *          这种异步处理方式使得函数能够处理可能非常大的数据，而不会阻塞执行线程.
 */
export async function bodyToBuffer(
    body?: BodyInit | null,
): Promise<Uint8Array> {
    return new Uint8Array(await new Response(body).arrayBuffer());
}
