import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js Middleware – läuft auf der Edge vor jedem Request.
 * Delegiert die Session-Erneuerung an updateSession (Separation of Concerns).
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Middleware läuft auf allen Routen AUSSER:
     * – _next/static  → statische Assets
     * – _next/image   → Bildoptimierung
     * – favicon.ico   → Browser-Icon
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
