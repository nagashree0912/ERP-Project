import { NextResponse } from "next/server";
// NOTE: Session lives in localStorage (demo mode) or Supabase cookies.
// Client-side Shell handles auth redirects, so middleware stays pass-through.
export function middleware() {
  return NextResponse.next();
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };

