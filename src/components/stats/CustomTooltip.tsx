"use client";

/**
 * Props für den CustomTooltip.
 *
 * Beschreibung:
 * - active → zeigt an, ob der Tooltip gerade sichtbar ist (Hover-Zustand)
 * - payload → enthält die Daten des aktuellen Punktes / Balkens (z. B. Minutenwert)
 * - label → Bezeichnung des aktuellen Werts (z. B. Keyword-Name oder Wochentag)
 */
type TooltipPayload = {
    value?: number;
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
 * Gemeinsame Darstellung des Tooltips für mehrere Diagramme.
 *
 * Vorteil:
 * - dieselbe Tooltip-Optik für Balken- und Liniendiagramm
 * - weniger doppelter Code
 * - zentrale Änderung, falls das Design später angepasst werden soll
 */
export default function CustomTooltip({ active, payload, label }: Props) {

    /**
     * Tooltip wird nur angezeigt, wenn:
     * - er aktiv ist (Hover)
     * - Daten vorhanden sind
     *
     * Andernfalls: nichts rendern
     * -> verhindert leere oder kaputte Tooltips
     */
    if (!active || !payload || payload.length === 0) {
        return null;
    }

    /**
     * Extrahiert den Wert aus dem Payload.
     * Wenn kein Wert vorhanden ist, wird 0 verwendet.
     */
    const value = payload[0]?.value ?? 0;

    return (
        <div className="rounded-md border bg-white p-2 shadow">

            {/* Bezeichnung des aktuellen Datenpunkts */}
            <p className="font-medium">{label}</p>

            {/* Wert in Minuten */}
            <p>{value} Minuten</p>

        </div>
    );
}