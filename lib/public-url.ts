type OriginOptions = {
  requestUrl?: string;
  headers?: Headers;
  configuredOrigin?: string;
  vercelProductionUrl?: string;
  vercelDeploymentUrl?: string;
};

function normalizeOrigin(value?: string) {
  if (!value) return undefined;
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    return new URL(candidate).origin;
  } catch {
    return undefined;
  }
}

function isLocalOrigin(origin: string) {
  const hostname = new URL(origin).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

export function resolvePublicOrigin(options: OriginOptions = {}) {
  const forwardedHost = options.headers?.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || options.headers?.get("host")?.split(",")[0]?.trim();
  const forwardedProto = options.headers?.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const requestProtocol = options.requestUrl ? new URL(options.requestUrl).protocol.replace(":", "") : undefined;
  const headerOrigin = host ? normalizeOrigin(`${forwardedProto || requestProtocol || "https"}://${host}`) : undefined;
  const requestOrigin = options.requestUrl ? normalizeOrigin(options.requestUrl) : undefined;
  const candidates = [
    headerOrigin,
    requestOrigin,
    normalizeOrigin(options.configuredOrigin),
    normalizeOrigin(options.vercelProductionUrl),
    normalizeOrigin(options.vercelDeploymentUrl),
  ].filter((origin): origin is string => Boolean(origin));

  return candidates.find((origin) => !isLocalOrigin(origin)) ?? candidates[0] ?? "http://localhost:3000";
}

export function publicUrl(path: string, request?: Request | string) {
  const requestUrl = typeof request === "string" ? request : request?.url;
  const headers = typeof request === "string" ? undefined : request?.headers;
  const origin = resolvePublicOrigin({
    requestUrl,
    headers,
    configuredOrigin: process.env.NEXT_PUBLIC_APP_URL,
    vercelProductionUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    vercelDeploymentUrl: process.env.VERCEL_URL,
  });
  return new URL(path.startsWith("/") ? path : `/${path}`, `${origin}/`).toString();
}
