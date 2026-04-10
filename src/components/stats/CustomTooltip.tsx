"use client";

/**
 * Props für den CustomTooltip.
 *
 * Beschreibung:
 * - active → zeigt an, ob der Tooltip gerade sichtbar ist (Hover-Zustand)
 * - payload → enthält die Daten des aktuellen Balkens (z. B. Minutenwert)
 * - label → Bezeichnung des Balkens (z. B. Keyword-Name)
 */
type TooltipPayload = {
    value: number;
};

type Props = {
    active?: boolean;
    payload?: TooltipPayload[];
    label?: string;
};

/**
 * CustomTooltip
 *
 * Ziel:
 * Individuelle Darstellung des Tooltips für das Balkendiagramm.
 *
 * Vorteil:
 * - volle Kontrolle über Inhalt und Layout
 * - vermeidet unerwünschte Standard-Anzeigen wie "minutes:"
 */
export default function CustomTooltip({ active, payload, label }: Props) {

    /**
     * Tooltip wird nur angezeigt, wenn:
     * - er aktiv ist (Hover)
     * - Daten vorhanden sind
     *
     * Andernfalls: nichts rendern (verhindert leere Tooltips)
     */
    if (!active || !payload || payload.length === 0) {
        return null;
    }

    /**
     * Extrahiert den Minutenwert aus dem Payload.
     * payload[0] enthält die Daten des aktuell gehoverter Balkens.
     */
    const value = payload[0].value;

    return (
        <div className="rounded-md border bg-white p-2 shadow">

            {/* Label (z. B. Keyword-Name) */}
            <p className="font-medium">{label}</p>

            {/* Wert in Minuten */}
            <p>{value} Minuten</p>

        </div>
    );
}