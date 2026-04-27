# CODEBUDDY.md This file provides guidance to WorkBuddy when working with code in this repository.

## 项目简介

`doh-cache` 是一个运行在 Cloudflare Workers 上的 DNS over HTTPS (DoH) 缓存代理。它将 DoH POST 请求转换为 GET 请求，并利用 Cloudflare Cache API 在边缘节点缓存 DNS 响应，大幅降低延迟和上游服务器压力。

## 常用命令

### 部署
```bash
pnpm run deploy
# 或者
npx wrangler deploy
```
将 Worker 部署到 Cloudflare。需要事先通过 `wrangler login` 完成身份认证。

### 格式化代码
```bash
pnpm run format
```
使用 Prettier 格式化所有 `.js`、`.ts`、`.css`、`.json`、`.md` 文件。代码风格由 `deno.json` 定义：4 空格缩进，双引号。

### 本地开发调试
```bash
npx wrangler dev
```
启动本地开发服务器（基于 Miniflare），默认监听 `http://localhost:8787`。

### TypeScript 类型检查
```bash
npx tsc --noEmit
```
仅做类型检查，不产生编译产物（`noEmit: true`）。实际打包由 Wrangler 的内置 esbuild 完成。

### 环境变量配置（本地覆盖）
在项目根目录创建 `.dev.vars` 文件：
```
DOH_ENDPOINT=https://doh.pub/dns-query
DOH_PATHNAME=/dns-query
```
`wrangler dev` 会自动加载此文件，无需修改 `wrangler.toml`。

---

## 架构概述

### 整体数据流

```
客户端请求
    │
    ▼
index.ts (Worker 入口)
    │  export default { fetch }
    ▼
Strict_Transport_Security  ← HSTS 中间件，包裹所有响应，注入 STS 头
    │
    ▼
fetchMiddleWare            ← 路由层：按路径和方法分发请求
    ├── GET /              → 返回 welcome.html 静态页面
    ├── POST /dns-query    → handleRequestPOST（Body 转 Base64，构造 GET URL）
    └── GET /dns-query     → handleGet（直接转发查询参数）
                                      │
                                      ▼
                             fetchDnsResponseLoadBalance  ← 负载均衡层
                                      │
                                      ▼
                             fetchDnsResponse  ← 实际 fetch，携带 cf.cacheEverything=true
                                      │
                                      ▼
                             上游 DoH 服务（doh.pub / alidns 等）
```

### 中间件模式

项目使用了一个轻量的中间件接口 `CloudflareMiddleWare<Env>`，签名为：

```ts
(request, env, ctx, next) => Promise<Response>
```

目前只有一个中间件实现：`Strict_Transport_Security`，它调用 `next()` 获取内层响应后，将响应体读取为 `Uint8Array`（`bodyToBuffer`），再重新构造 `Response` 并附加 `Strict-Transport-Security: max-age=31536000` 头。**注意**：因为需要修改响应头，必须将流式 body 完整缓冲后才能重构响应，这是 `bodyToBuffer` 存在的原因。

### 请求路由（fetchMiddleWare）

路由逻辑在 `fetchMiddleWare.ts` 中，核心判断：

- 路径匹配 `DOH_PATHNAME`（默认 `/dns-query`）：
  - `POST` + `Content-Type: application/dns-message` → `handleRequestPOST`
  - `GET` + 含 `dns` 查询参数 → `handleGet`
- 路径为 `/` → 返回欢迎页 HTML（`welcome.html` 通过 Wrangler 的 `import` 特性作为文本导入）
- 其他路径 → 404

### POST 请求处理（handleRequest.ts）

1. 读取二进制 DNS 查询体（`ArrayBuffer`）
2. 用 `base64Encode` 转换为 URL-safe Base64（替换 `+→-`、`/→_`、去掉 `=`，符合 RFC 4648 §5）
3. 从 `DOH_ENDPOINT` 中随机选一个上游节点，将 Base64 结果附加为 `?dns=` 参数
4. 追加 `Forwarded` 头（携带客户端 IP 来自 `cf-connecting-ip`）
5. 转交给 `fetchDnsResponseLoadBalance` 执行带重试的负载均衡请求

### GET 请求处理（handleGet.ts）

逻辑类似，但直接将原始查询字符串（已含 `dns` 参数）复制到上游 URL，省去 Base64 编码步骤。同样经过 `fetchDnsResponseLoadBalance`。

### 负载均衡（fetchDnsResponseLoadBalance.ts）

`fetchDnsResponseLoadBalance` 接受 `env`、目标 URL 和请求头：

1. 调用 `get_doh_url(env)` 解析 `DOH_ENDPOINT`：
   - 若为 JSON 数组字符串（如 `["https://a.com","https://b.com"]`），解析为多节点列表
   - 否则作为单节点
2. 用 `ArrayShuffle`（Fisher-Yates 随机排序）打乱节点顺序
3. 按顺序逐一尝试，调用 `fetchDnsResponse`（带 `cf.cacheEverything: true`）
4. 校验响应必须为 `2xx` 且 `Content-Type: application/dns-message`，否则记录错误继续下一个节点
5. 全部失败时返回 `502` 并汇总错误信息

### 缓存机制

缓存完全依赖 Cloudflare 的 `fetch` Cache API：在 `fetchDnsResponse` 中调用 `fetch(request, { cf: { cacheEverything: true } })`，Cloudflare 会按上游响应的 `Cache-Control` / `TTL` 自动在边缘节点缓存 DNS 响应。Worker 本身不维护任何内存缓存。

### 环境变量（Env 接口）

| 变量 | 说明 | 示例 |
|---|---|---|
| `DOH_ENDPOINT` | 上游 DoH URL，支持单个字符串或 JSON 数组 | `"https://doh.pub/dns-query"` 或 `'["https://a.com","https://b.com"]'` |
| `DOH_PATHNAME` | Worker 监听的 DNS 查询路径，默认 `/dns-query` | `/dns-query` |

生产配置在 `wrangler.toml` 的 `[vars]` 节定义；本地开发用 `.dev.vars` 覆盖。

### 工具函数

- `base64Encode`：标准 URL-safe Base64，供 POST→GET 转换使用
- `bodyToBuffer`：将任意 `BodyInit` 流读取为 `Uint8Array`，供 HSTS 中间件重构响应使用
- `ArrayShuffle`：对数组做随机排列，用于负载均衡节点打散
- `get_doh_url`：解析 `DOH_ENDPOINT` 环境变量，统一返回 `string[]`

### 构建工具链

- **Wrangler v4**：构建、打包（内置 esbuild）、部署、本地调试一体化
- **TypeScript**：`strict` 模式，`target: es2021`，类型检查仅使用 `@cloudflare/workers-types`；`noEmit: true`，不产生编译产物，实际 bundle 由 Wrangler 完成
- **Prettier**：格式化，配置见 `deno.json`（4 空格，双引号）
- **pnpm**：包管理器，`pnpm-workspace.yaml` 定义 workspace
