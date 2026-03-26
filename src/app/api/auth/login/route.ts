import { NextResponse } from "next/server";
import { login } from "@/lib/services/auth.service";
import type { ApiResponse, AuthResponse } from "@/types";

/**
 * POST /api/auth/login
 *
 * Meldet einen Benutzer mit E-Mail und Passwort an.
 * Gibt bei Erfolg die Session-Daten (JWT) zurück.
 *
 * Sicherheit: Bei falschen Credentials wird eine generische
 * Fehlermeldung zurückgegeben (keine User-Enumeration).
 *
 * Anforderungsbezug: F2 (Login), AK4–AK6
 *
 * @mapigeblich KI-generiert — Validierung und Fehlerbehandlung im Service
 */
export async function POST(
  request: Request
): Promise<NextResponse<ApiResponse<AuthResponse>>> {
  try {
    // Request-Body parsen
    const body = await request.json();

    // Business Logic an den Service delegieren
    const result = await login({
      email: body.email,
      password: body.password,
    });

    // Fehler vom Service → passenden HTTP-Status zurückgeben
    if (result.error) {
      const status = result.error.code === "VALIDATION_ERROR" ? 400 : 401;
      return NextResponse.json(result, { status });
    }

    // Erfolg → 200 OK (bestehender Benutzer angemeldet)
    return NextResponse.json(result, { status: 200 });
  } catch {
    // Unerwarteter Fehler (z.B. ungültiger JSON-Body)
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "INTERNAL_ERROR",
          message: "Ein unerwarteter Fehler ist aufgetreten.",
        },
      },
      { status: 500 }
    );
  }
}
