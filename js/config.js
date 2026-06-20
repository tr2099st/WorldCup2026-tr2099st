/**
 * 公開版ではCloudflare Pages Functionsの /api を経由します。
 * APIトークンはブラウザへ置かず、CloudflareのSecretで管理してください。
 *
 * このプロジェクトは無料プラン・支払い方法登録不要が絶対条件です。
 * Cloudflare Workers/PagesはFreeプランのみ使用してください。
 * 有料サービスが必要な場合は、導入前に必ずユーザーへ報告してください。
 */
export const APP_CONFIG = {
  apiBaseUrl: "/api",
  competitionCode: "WC",
  season: 2026,
  // 無料APIへの負荷と利用回数を抑えるため、1時間ごとに更新します。
  refreshIntervalMs: 60 * 60 * 1_000,
  servicePolicy: Object.freeze({
    freePlanOnly: true,
    paymentMethodAllowed: false,
    usageBasedBillingAllowed: false,
    paidServicesAllowed: false,
    requireApprovalBeforePaidService: true,
  }),
};
