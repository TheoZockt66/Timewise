import { createClient } from "@/lib/supabase/server";
import type { AuthResponse, ApiResponse, AuthCredentials } from "@/types";

// ─── Konstanten ───

// Mindestlänge für Passwörter (Supabase-Standard ist 6)
const MIN_PASSWORD_LENGTH = 6;
// Maximale E-Mail-Länge (RFC 5321)
const MAX_EMAIL_LENGTH = 254;

// ─── Validierung ───

/**
 * Prüft ob die E-Mail ein gültiges Format hat.
 * Einfache Regex-Prüfung – Supabase validiert nochmals serverseitig.
 */
function isValidEmail(email: string): boolean {
  // RFC 5322 vereinfachte Prüfung: mindestens ein Zeichen vor @, Domain mit Punkt
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= MAX_EMAIL_LENGTH;
}

/**
 * Validiert die Eingabedaten für Login/Registrierung.
 * Gibt einen Fehlertext zurück oder null wenn alles gültig ist.
 */
function validateCredentials(credentials: AuthCredentials): string | null {
  // E-Mail darf nicht leer sein
  if (!credentials.email || credentials.email.trim().length === 0) {
    return "E-Mail-Adresse ist erforderlich.";
  }

  // E-Mail-Format prüfen
  if (!isValidEmail(credentials.email.trim())) {
    return "Ungültiges E-Mail-Format. Bitte eine gültige E-Mail-Adresse eingeben.";
  }

  // Passwort darf nicht leer sein
  if (!credentials.password || credentials.password.length === 0) {
    return "Passwort ist erforderlich.";
  }

  // Passwort-Mindestlänge prüfen
  if (credentials.password.length < MIN_PASSWORD_LENGTH) {
    return `Passwort muss mindestens ${MIN_PASSWORD_LENGTH} Zeichen lang sein.`;
  }

  return null;
}

/**
 * Validiert eine E-Mail-Adresse für den Passwort-Reset.
 * Weniger streng als bei Login, da nur E-Mail benötigt wird.
 */
function validateEmail(email: string): string | null {
  if (!email || email.trim().length === 0) {
    return "E-Mail-Adresse ist erforderlich.";
  }

  if (!isValidEmail(email.trim())) {
    return "Ungültiges E-Mail-Format. Bitte eine gültige E-Mail-Adresse eingeben.";
  }

  return null;
}

// ─── Service-Funktionen ───

/**
 * Registriert einen neuen Benutzer mit E-Mail und Passwort.
 *
 * Ablauf:
 * 1. Eingabedaten validieren
 * 2. Supabase Auth signUp aufrufen
 * 3. Session und User-Daten zurückgeben
 *
 * Randfall: Supabase sendet eine Bestätigungs-E-Mail.
 * Bis zur Bestätigung ist die Session eingeschränkt.
 */
export async function register(
  credentials: AuthCredentials
): Promise<ApiResponse<AuthResponse>> {
  // Schritt 1: Eingabedaten validieren
  const validationError = validateCredentials(credentials);
  if (validationError) {
    return {
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: validationError,
      },
    };
  }

  // Schritt 2: Supabase-Client erstellen und Registrierung durchführen
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: credentials.email.trim(),
    password: credentials.password,
  });

  // Schritt 3: Fehlerbehandlung für Supabase-Fehler
  if (error) {
    return {
      data: null,
      error: {
        code: "REGISTRATION_FAILED",
        message: "Registrierung fehlgeschlagen. Bitte versuche es erneut.",
        details: error.message,
      },
    };
  }

  // Randfall: Supabase gibt keinen User zurück (sollte nicht passieren)
  if (!data.user) {
    return {
      data: null,
      error: {
        code: "REGISTRATION_FAILED",
        message: "Registrierung fehlgeschlagen. Kein Benutzer erstellt.",
      },
    };
  }

  // Schritt 4: Erfolgreiche Antwort zusammenbauen
  return {
    data: {
      user: {
        id: data.user.id,
        email: data.user.email!,
        created_at: data.user.created_at,
      },
      // Session kann null sein, wenn E-Mail-Bestätigung erforderlich ist
      session: data.session
        ? {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at ?? 0,
          }
        : { access_token: "", refresh_token: "", expires_at: 0 },
    },
    error: null,
  };
}

/**
 * Meldet einen Benutzer mit E-Mail und Passwort an.
 *
 * Ablauf:
 * 1. Eingabedaten validieren
 * 2. Supabase Auth signInWithPassword aufrufen
 * 3. Session und User-Daten zurückgeben
 *
 * Randfall: Falsche Credentials → generische Fehlermeldung
 * (kein Hinweis ob E-Mail existiert, aus Sicherheitsgründen).
 */
export async function login(
  credentials: AuthCredentials
): Promise<ApiResponse<AuthResponse>> {
  // Schritt 1: Eingabedaten validieren
  const validationError = validateCredentials(credentials);
  if (validationError) {
    return {
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: validationError,
      },
    };
  }

  // Schritt 2: Supabase-Client erstellen und Login durchführen
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email.trim(),
    password: credentials.password,
  });

  // Schritt 3: Fehlerbehandlung – generische Meldung aus Sicherheitsgründen
  if (error) {
    return {
      data: null,
      error: {
        code: "INVALID_CREDENTIALS",
        message: "E-Mail oder Passwort ist falsch. Bitte versuche es erneut.",
        details: error.message,
      },
    };
  }

  // Schritt 4: Erfolgreiche Antwort zusammenbauen
  return {
    data: {
      user: {
        id: data.user.id,
        email: data.user.email!,
        created_at: data.user.created_at,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at ?? 0,
      },
    },
    error: null,
  };
}

/**
 * Meldet den aktuellen Benutzer ab und zerstört die Session.
 *
 * Randfall: Auch wenn kein User eingeloggt ist, gibt signOut keinen Fehler.
 * Das ist gewollt – Logout ist idempotent.
 */
export async function logout(): Promise<ApiResponse<{ success: boolean }>> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  // Fehlerbehandlung
  if (error) {
    return {
      data: null,
      error: {
        code: "LOGOUT_FAILED",
        message: "Abmeldung fehlgeschlagen. Bitte versuche es erneut.",
        details: error.message,
      },
    };
  }

  return {
    data: { success: true },
    error: null,
  };
}

/**
 * Sendet eine Passwort-Reset-E-Mail an die angegebene Adresse.
 *
 * Sicherheitsaspekt: Gibt IMMER Erfolg zurück, auch wenn die E-Mail
 * nicht existiert. Verhindert User-Enumeration.
 *
 * Randfall: Der Reset-Link in der E-Mail führt zum /api/auth/callback
 * Endpunkt, der den Token-Tausch übernimmt.
 */
export async function resetPassword(
  email: string
): Promise<ApiResponse<{ success: boolean }>> {
  // Schritt 1: E-Mail validieren
  const validationError = validateEmail(email);
  if (validationError) {
    return {
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: validationError,
      },
    };
  }

  // Schritt 2: Reset-E-Mail über Supabase senden
  const supabase = await createClient();
  // Fehler wird absichtlich ignoriert (User-Enumeration verhindern)
  await supabase.auth.resetPasswordForEmail(email.trim());

  // Immer Erfolg melden, egal ob E-Mail existiert
  return {
    data: { success: true },
    error: null,
  };
}

/**
 * Tauscht einen Auth-Code gegen eine Session (für E-Mail-Bestätigung / Reset).
 *
 * Wird vom Callback-Endpunkt aufgerufen wenn der User auf den
 * Bestätigungs-/Reset-Link in der E-Mail klickt.
 */
export async function exchangeCodeForSession(
  code: string
): Promise<ApiResponse<{ success: boolean }>> {
  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return {
      data: null,
      error: {
        code: "CODE_EXCHANGE_FAILED",
        message: "Der Bestätigungslink ist ungültig oder abgelaufen.",
        details: error.message,
      },
    };
  }

  return {
    data: { success: true },
    error: null,
  };
}
