declare const _default: (() => {
  secretKey: string;
  webhookSecret: string;
  publishableKey: string;
}) &
  import("@nestjs/config").ConfigFactoryKeyHost<{
    secretKey: string;
    webhookSecret: string;
    publishableKey: string;
  }>;
export default _default;
