import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js Proxy (früher: Middleware) – läuft auf der Edge vor jedem Request.
 * Delegiert die Session-Erneuerung an updateSession (Separation of Concerns).
 *
 * Umbenennung von middleware.ts → proxy.ts gemäß Next.js 16 Konvention.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Proxy läuft auf allen Routen AUSSER:
     * – _next/static  → statische Assets
     * – _next/image   → Bildoptimierung
     * – favicon.ico   → Browser-Icon
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
