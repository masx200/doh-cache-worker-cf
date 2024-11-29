//@ts-ignore
// 定义一个环境变量接口，用于指定DNS解析的相关配置
export interface Env {
    // DNS解析服务的API地址
    DOH_ENDPOINT: string;
    // DNS解析服务的请求路径
    DOH_PATHNAME: string;
}
