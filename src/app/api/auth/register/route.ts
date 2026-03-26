import { NextResponse } from "next/server";
import { register } from "@/lib/services/auth.service";
import type { ApiResponse, AuthResponse } from "@/types";

/**
 * POST /api/auth/register
 *
 * Registriert einen neuen Benutzer mit E-Mail und Passwort.
 * Die Business Logic liegt im auth.service – diese Route
 * ist nur die Transport-Schicht (Separation of Concerns).
 *
 * Anforderungsbezug: F1 (Registrierung), AK1–AK3
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
    const result = await register({
      email: body.email,
      password: body.password,
    });

    // Fehler vom Service → passenden HTTP-Status zurückgeben
    if (result.error) {
      // Validierungsfehler → 400, sonstige Auth-Fehler → 401
      const status = result.error.code === "VALIDATION_ERROR" ? 400 : 401;
      return NextResponse.json(result, { status });
    }

    // Erfolg → 201 Created (neuer Benutzer wurde angelegt)
    return NextResponse.json(result, { status: 201 });
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
