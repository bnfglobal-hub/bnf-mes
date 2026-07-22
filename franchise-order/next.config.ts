import type { NextConfig } from "next";

/**
 * Next.js는 CSRF 방어를 위해 Server Action 요청의 Origin이 호스트와 일치하는지 확인한다.
 * 터널(cloudflared)이나 리버스 프록시를 거쳐 접속하면 Origin이 달라 요청이 차단되므로,
 * 허용할 도메인을 환경변수로 지정한다.
 *
 *   ALLOWED_ORIGINS="abc.trycloudflare.com,*.mydomain.com"
 *
 * Vercel 같은 정식 배포에서는 Origin과 호스트가 같아 설정이 필요 없다.
 */
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  experimental: {
    serverActions: allowedOrigins.length > 0 ? { allowedOrigins } : undefined,
  },
};

export default nextConfig;
