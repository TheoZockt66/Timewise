"use client";

/**
 * DateNavigation
 *
 * Ziel:
 * Wiederverwendbare Navigations-Komponente für Zeiträume.
 *
 * Darstellung:
 * - zwei zusammenhängende Buttons wie im Kalender
 * - links: vorheriger Zeitraum
 * - rechts: nächster Zeitraum
 *
 * Vorteil:
 * - einheitliches UI
 * - DRY-Prinzip
 * - später auch für weitere Ansichten nutzbar
 */

type Props = {
    onPrev: () => void;
    onNext: () => void;
};

function ChevronLeftIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M15 18l-6-6 6-6" />
        </svg>
    );
}

function ChevronRightIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M9 6l6 6-6 6" />
        </svg>
    );
}

export default function DateNavigation({ onPrev, onNext }: Props) {
    return (
        // Button-Gruppe im Stil der Kalender-Navigation
        <div className="inline-flex overflow-hidden rounded shadow-sm">

            {/* Button: vorheriger Zeitraum */}
            <button
                type="button"
                onClick={onPrev}
                className="
                flex items-center justify-center
                h-10 w-12
                text-white
                bg-[#7700F4]
                hover:bg-[#5500B0]
                transition
            "
                aria-label="Vorheriger Zeitraum"
            >
                <ChevronLeftIcon />
            </button>

            {/* Button: nächster Zeitraum */}
            <button
                type="button"
                onClick={onNext}
                className="
                flex items-center justify-center
                h-10 w-12
                text-white
                bg-[#7700F4]
                hover:bg-[#5500B0]
                transition
            "
                aria-label="Nächster Zeitraum"
            >
                <ChevronRightIcon />
            </button>
        </div>
    );
}