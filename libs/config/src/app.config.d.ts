declare const _default: (() => {
  nodeEnv: string;
  port: number;
  appUrl: string;
  apiUrl: string;
  corsOrigins: string[];
  logLevel: string;
}) &
  import("@nestjs/config").ConfigFactoryKeyHost<{
    nodeEnv: string;
    port: number;
    appUrl: string;
    apiUrl: string;
    corsOrigins: string[];
    logLevel: string;
  }>;
export default _default;
