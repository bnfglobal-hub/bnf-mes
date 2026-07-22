import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * 로그아웃 후 /login 으로 이동.
 *
 * 터널·리버스 프록시를 거치면 `request.url`의 호스트가 내부 주소(0.0.0.0:3000)라서
 * 그대로 리다이렉트하면 접속이 끊긴다. 프록시가 넘겨준 원래 호스트를 우선 사용한다.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", "");
  const target = forwardedHost
    ? `${forwardedProto}://${forwardedHost}/login`
    : new URL("/login", request.url).toString();

  return NextResponse.redirect(target, { status: 303 });
}
