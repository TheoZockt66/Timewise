/**
 * Test-Generator für Timewise (Ollama-Variante)
 *
 * Liest eine TypeScript-Quellcode-Datei ein, lässt ein lokales Llama-Modell via
 * Ollama dafür Vitest-Unit-Tests generieren (inkl. Edge Cases), speichert sie
 * als .test.ts-Datei und führt sie anschließend automatisch aus.
 *
 * Verwendung:
 *   npm run generate-tests -- src/lib/lernzeit.ts
 *
 * Voraussetzungen:
 *   - Ollama installiert und gestartet (https://ollama.com)
 *   - Modell geladen: ollama pull llama3.1:8b
 *   - Paket installiert: tsx
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { basename, dirname, join, extname } from 'node:path';

// ============================================================
// Konfiguration
// ============================================================

const OLLAMA_URL = 'http://localhost:11434/api/chat';
const MODEL = 'llama3.2:3b';
// Tipp: Für bessere Ergebnisse bei Code-Generierung:
// const MODEL = 'qwen2.5-coder:7b';

// ============================================================
// Hilfsfunktionen
// ============================================================

function logStep(message: string): void {
  console.log(`\n\x1b[36m▶ ${message}\x1b[0m`);
}

function logSuccess(message: string): void {
  console.log(`\x1b[32m✓ ${message}\x1b[0m`);
}

function logError(message: string): void {
  console.error(`\x1b[31m✗ ${message}\x1b[0m`);
}

function logInfo(message: string): void {
  console.log(`  ${message}`);
}

/**
 * Extrahiert TypeScript-Code aus einer Markdown-Code-Block-Antwort.
 * Llama liefert Code oft in ```typescript ... ``` Blöcken zurück.
 */
function extractCodeFromResponse(response: string): string {
  const codeBlockRegex = /```(?:typescript|ts|javascript|js)?\n([\s\S]*?)```/;
  const match = response.match(codeBlockRegex);

  if (match && match[1]) {
    return match[1].trim();
  }

  // Fallback: Wenn kein Code-Block gefunden wird, gehen wir davon aus,
  // dass die gesamte Antwort Code ist
  return response.trim();
}

/**
 * Bestimmt den Pfad für die Test-Datei basierend auf dem Quellcode-Pfad.
 * z.B. src/lib/lernzeit.ts → src/lib/lernzeit.test.ts
 */
function getTestFilePath(sourceFilePath: string): string {
  const dir = dirname(sourceFilePath);
  const ext = extname(sourceFilePath);
  const name = basename(sourceFilePath, ext);
  return join(dir, `${name}.test${ext}`);
}

// ============================================================
// Ollama-Aufruf
// ============================================================

interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OllamaResponse {
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

async function callOllama(messages: OllamaMessage[]): Promise<string> {
  // 5 Minuten Timeout — Modell braucht beim ersten Aufruf Zeit zum Laden
  const signal = AbortSignal.timeout(5 * 60 * 1000);

  const response = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: false,
      options: {
        temperature: 0.2, // niedrig für deterministischere Code-Ausgabe
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama-Request fehlgeschlagen (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as OllamaResponse;
  return data.message.content;
}

/**
 * Prüft, ob Ollama erreichbar ist und das konfigurierte Modell verfügbar ist.
 */
async function checkOllamaAvailable(): Promise<void> {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = (await response.json()) as { models: Array<{ name: string }> };
    const availableModels = data.models.map((m) => m.name);

    if (!availableModels.some((name) => name === MODEL || name.startsWith(MODEL + ':'))) {
      logError(`Modell "${MODEL}" ist in Ollama nicht geladen.`);
      logInfo(`Verfügbare Modelle: ${availableModels.join(', ') || '(keine)'}`);
      logInfo(`Modell herunterladen mit: ollama pull ${MODEL}`);
      process.exit(1);
    }
  } catch (error: any) {
    logError('Ollama ist nicht erreichbar auf http://localhost:11434');
    logInfo('Stelle sicher, dass Ollama läuft. Starten mit: ollama serve');
    logInfo(`Fehlerdetails: ${error.message}`);
    process.exit(1);
  }
}

// ============================================================
// LLM-Aufruf: Tests generieren
// ============================================================

async function generateTests(sourceCode: string, sourceFileName: string): Promise<string> {
  const systemPrompt = `Du bist ein erfahrener TypeScript-Entwickler, der hochwertige Unit-Tests mit Vitest schreibt.

Deine Aufgabe ist es, für gegebenen TypeScript-Code umfassende Unit-Tests zu generieren.

Anforderungen an die Tests:
1. Nutze Vitest-Syntax (import { describe, test, expect } from 'vitest')
2. Gruppiere zusammengehörige Tests mit describe()
3. Schreibe aussagekräftige Test-Namen auf Deutsch
4. Decke Happy Paths ab (normale Eingaben mit erwarteten Ergebnissen)
5. Decke Edge Cases ab:
   - Leere Eingaben (leere Strings, leere Arrays, null, undefined)
   - Grenzwerte (0, negative Zahlen, sehr große Zahlen)
   - Ungültige Eingaben (falsche Typen, falsches Format)
   - Spezialfälle der Domäne (z.B. bei Zeiten: Mitternacht, gleiche Start- und Endzeit)
6. Jeder Test sollte exakt eine Sache prüfen
7. Verwende sprechende Variablennamen
8. Wenn die Funktion auf externe Abhängigkeiten zugreift (Datenbank, API), nutze vi.mock()

WICHTIG: Gib ausschließlich den Test-Code zurück, eingeschlossen in einen \`\`\`typescript Code-Block. Keine Erklärungen davor oder dahinter.`;

  const userPrompt = `Hier ist der TypeScript-Code aus der Datei \`${sourceFileName}\`:

\`\`\`typescript
${sourceCode}
\`\`\`

Generiere umfassende Vitest-Unit-Tests für alle exportierten Funktionen in dieser Datei. Achte besonders auf Edge Cases.`;

  const response = await callOllama([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);

  return extractCodeFromResponse(response);
}

// ============================================================
// LLM-Aufruf: Tests validieren / Edge-Case-Prüfung
// ============================================================

async function reviewTestCoverage(
  sourceCode: string,
  testCode: string
): Promise<{ adequate: boolean; missingCases: string[] }> {
  const systemPrompt = `Du bist ein Code-Reviewer. Deine Aufgabe ist es zu prüfen, ob ein gegebenes Set von Unit-Tests die wichtigsten Edge Cases einer Funktion abdeckt.

Antworte ausschließlich mit einem JSON-Objekt im folgenden Format (ohne Markdown-Code-Block, nur das reine JSON):
{
  "adequate": true,
  "missingCases": ["Beschreibung von Edge Case 1", "Beschreibung von Edge Case 2"]
}

Setze "adequate" auf true, wenn die wichtigsten Edge Cases abgedeckt sind. Wenn wichtige Fälle fehlen, setze "adequate" auf false und liste sie in "missingCases" auf.

WICHTIG: Antworte NUR mit dem JSON-Objekt, ohne weiteren Text, ohne Markdown.`;

  const userPrompt = `Quellcode:
\`\`\`typescript
${sourceCode}
\`\`\`

Generierte Tests:
\`\`\`typescript
${testCode}
\`\`\`

Prüfe die Test-Abdeckung und antworte mit dem JSON-Objekt.`;

  const response = await callOllama([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);

  // JSON aus der Antwort parsen (kann in Markdown-Block sein oder nicht)
  let jsonText = response.trim();
  const jsonMatch = jsonText.match(/```(?:json)?\n([\s\S]*?)```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1].trim();
  }

  // Manchmal kommt vor/nach dem JSON noch Text — versuchen, nur das JSON zu isolieren
  const jsonObjectMatch = jsonText.match(/\{[\s\S]*\}/);
  if (jsonObjectMatch) {
    jsonText = jsonObjectMatch[0];
  }

  try {
    return JSON.parse(jsonText);
  } catch (error) {
    logError(`Konnte Review-Antwort nicht parsen. Rohantwort:`);
    logInfo(response);
    return { adequate: true, missingCases: [] };
  }
}

// ============================================================
// Tests ausführen
// ============================================================

function runTests(testFilePath: string): { success: boolean; output: string } {
  try {
    const output = execSync(`npx vitest run ${testFilePath}`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    return { success: true, output };
  } catch (error: any) {
    return {
      success: false,
      output: error.stdout?.toString() || error.message,
    };
  }
}

// ============================================================
// Hauptablauf
// ============================================================

async function main(): Promise<void> {
  // 1. Argumente prüfen
  const sourceFilePath = process.argv[2];
  if (!sourceFilePath) {
    logError('Bitte gib einen Pfad zur Quellcode-Datei an.');
    logInfo('Beispiel: npm run generate-tests -- src/lib/lernzeit.ts');
    process.exit(1);
  }

  if (!existsSync(sourceFilePath)) {
    logError(`Datei nicht gefunden: ${sourceFilePath}`);
    process.exit(1);
  }

  // 2. Ollama-Verfügbarkeit prüfen
  logStep('Prüfe Ollama-Verbindung...');
  await checkOllamaAvailable();
  logSuccess(`Ollama erreichbar, Modell "${MODEL}" ist geladen`);

  // 3. Quellcode einlesen
  logStep(`Lese Quellcode aus ${sourceFilePath}`);
  const sourceCode = readFileSync(sourceFilePath, 'utf-8');
  const sourceFileName = basename(sourceFilePath);
  logInfo(`${sourceCode.split('\n').length} Zeilen eingelesen`);

  // 4. Tests generieren
  logStep('Generiere Tests mit Ollama (kann etwas dauern)...');
  const startGen = Date.now();
  const testCode = await generateTests(sourceCode, sourceFileName);
  const genDuration = ((Date.now() - startGen) / 1000).toFixed(1);
  logSuccess(`Test-Code generiert (${testCode.split('\n').length} Zeilen, ${genDuration}s)`);

  // 5. Test-Datei schreiben
  const testFilePath = getTestFilePath(sourceFilePath);
  logStep(`Schreibe Test-Datei: ${testFilePath}`);

  if (existsSync(testFilePath)) {
    logInfo('⚠ Bestehende Test-Datei wird überschrieben');
  }

  writeFileSync(testFilePath, testCode, 'utf-8');
  logSuccess('Test-Datei gespeichert');

  // 6. Tests ausführen
  logStep('Führe generierte Tests aus...');
  const testResult = runTests(testFilePath);

  if (testResult.success) {
    logSuccess('Alle Tests sind grün!');
    console.log('\n' + testResult.output);
  } else {
    logError('Tests sind fehlgeschlagen oder kompilieren nicht');
    console.log('\n' + testResult.output);
    logInfo('\nDie generierte Test-Datei wurde behalten, damit du sie inspizieren kannst.');
    logInfo('Bei kleineren Modellen wie Llama 3.1 8B kann es nötig sein, Tests manuell zu korrigieren.');
  }

  // 7. Edge-Case-Review
  logStep('Prüfe Edge-Case-Abdeckung...');
  const review = await reviewTestCoverage(sourceCode, testCode);

  if (review.adequate) {
    logSuccess('Edge-Case-Abdeckung sieht gut aus');
  } else {
    logInfo('⚠ Möglicherweise fehlende Edge Cases:');
    review.missingCases.forEach((edgeCase, i) => {
      logInfo(`  ${i + 1}. ${edgeCase}`);
    });
    logInfo('\nDu kannst das Skript erneut ausführen oder die Tests manuell ergänzen.');
  }

  // 8. Zusammenfassung
  console.log('\n' + '─'.repeat(60));
  console.log('Zusammenfassung:');
  console.log(`  Modell:           ${MODEL}`);
  console.log(`  Quelldatei:       ${sourceFilePath}`);
  console.log(`  Test-Datei:       ${testFilePath}`);
  console.log(`  Tests grün:       ${testResult.success ? 'Ja' : 'Nein'}`);
  console.log(`  Edge Cases ok:    ${review.adequate ? 'Ja' : 'Nein'}`);
  console.log('─'.repeat(60) + '\n');

  process.exit(testResult.success ? 0 : 1);
}

main().catch((error) => {
  logError(`Unerwarteter Fehler: ${error.message}`);
  console.error(error);
  process.exit(1);
});