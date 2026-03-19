/**
 * Startseite (Landing Page) von Timewise.
 * Aktuell als Platzhalter – wird durch die Auth-Weiterleitung ersetzt,
 * sobald Supabase Auth integriert ist.
 */
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">Timewise</h1>
        <p className="text-muted-foreground text-lg">
          Intelligente Zeitplanung für Studierende
        </p>
        <p className="text-sm text-muted-foreground">
          Projektsetup abgeschlossen – bereit für die Entwicklung.
        </p>
      </div>
    </main>
  );
}
