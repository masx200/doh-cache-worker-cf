# ⚡ doh-cache ⚡

[![Deploy to Cloudflare Workers](https://github.com/masx200/doh-cache-worker-cf/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/masx200/doh-cache-worker-cf/actions/workflows/deploy.yml)
![GitHub](https://img.shields.io/github/license/masx200/doh-cache-worker-cf)

👷 `doh-cache` is a Cloudflare Worker to make DNS over HTTPS requests cacheable
at edge.

🚀 Running in production at **<https://dns.paesa.es/dns-query>**

## How it Works

`doh-cache` transforms a DoH POST request to a DoH GET request and uses the
Cache API to store the response in Cloudflare's cache. Drastically reducing
response latency and server costs by using Cloudflare global network to serve
cached responses.

## License

MIT License

# 设置环境变量

# DOH_ENDPOINT 是 DNS over HTTPS 的终端 URL。

# 可以是一个字符串，表示单个终端 URL：

`DOH_ENDPOINT=https://doh.pub/dns-query`

# 或者是一个 JSON 数组字符串，包含多个终端 URL，用于负载均衡或备用：

`DOH_ENDPOINT=["https://doh.pub/dns-query","https://dns.alidns.com/dns-query"]`

# DOH_PATHNAME 是 DNS over HTTPS 请求路径，默认值为 `/dns-query`：

`DOH_PATHNAME=/dns-query`
