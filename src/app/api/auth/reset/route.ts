import { NextResponse } from "next/server";
import { resetPassword } from "@/lib/services/auth.service";
import type { ApiResponse } from "@/types";

/**
 * POST /api/auth/reset
 *
 * Sendet eine Passwort-Reset-E-Mail an die angegebene Adresse.
 *
 * Sicherheit: Gibt IMMER Erfolg zurück, auch wenn die E-Mail
 * nicht in der Datenbank existiert. Verhindert User-Enumeration
 * (Angreifer kann nicht herausfinden ob ein Account existiert).
 *
 * Anforderungsbezug: F4 (Passwort-Reset), AK8–AK9
 *
 * @mapigeblich KI-generiert
 */
export async function POST(
  request: Request
): Promise<NextResponse<ApiResponse<{ success: boolean }>>> {
  try {
    // Request-Body parsen
    const body = await request.json();

    // Business Logic an den Service delegieren
    const result = await resetPassword(body.email);

    // Validierungsfehler → 400
    if (result.error) {
      return NextResponse.json(result, { status: 400 });
    }

    // Erfolg → 200 OK
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
