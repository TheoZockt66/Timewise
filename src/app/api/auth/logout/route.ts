import { NextResponse } from "next/server";
import { logout } from "@/lib/services/auth.service";
import type { ApiResponse } from "@/types";

/**
 * POST /api/auth/logout
 *
 * Meldet den aktuellen Benutzer ab und zerstört die Session.
 * Benötigt keinen Request-Body.
 *
 * Randfall: Ist kein User eingeloggt, gibt der Endpunkt
 * trotzdem Erfolg zurück (Logout ist idempotent).
 *
 * Anforderungsbezug: F3 (Logout), AK7
 *
 * @mapigeblich KI-generiert
 */
export async function POST(): Promise<
  NextResponse<ApiResponse<{ success: boolean }>>
> {
  try {
    // Business Logic an den Service delegieren
    const result = await logout();

    // Fehler vom Service → 500 (Logout sollte eigentlich nie fehlschlagen)
    if (result.error) {
      return NextResponse.json(result, { status: 500 });
    }

    // Erfolg → 200 OK
    return NextResponse.json(result, { status: 200 });
  } catch {
    // Unerwarteter Fehler
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
