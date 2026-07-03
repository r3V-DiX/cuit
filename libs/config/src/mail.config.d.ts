declare const _default: (() => {
  resendApiKey: string;
  from: string;
  supportEmail: string;
}) &
  import("@nestjs/config").ConfigFactoryKeyHost<{
    resendApiKey: string;
    from: string;
    supportEmail: string;
  }>;
export default _default;
