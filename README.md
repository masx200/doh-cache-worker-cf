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

`DOH_ENDPOINT=https://doh.pub/dns-query`

`DOH_PATHNAME=/dns-query`
