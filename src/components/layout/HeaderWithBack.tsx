"use client";

/**
 * HeaderWithBack
 *
 * Zweck:
 * Diese Komponente stellt eine einheitliche Navigationsleiste dar,
 * bestehend aus:
 * - einem Zurück-Button (links)
 * - dem Timewise-Logo (rechts)
 *
 * Verhalten:
 * - Beide Elemente führen zur Startseite "/"
 * - Wird auf allen Dashboard-Seiten wiederverwendet
 *
 * Vorteil:
 * - Vermeidung von Code-Duplikaten (DRY-Prinzip)
 * - Einheitliches Layout im gesamten Projekt
 */

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeaderWithBack() {
    return (
        /**
         * Container:
         * - relative → ermöglicht absolute Positionierung des Buttons
         * - flex → horizontale Ausrichtung
         * - justify-end → Logo rechts
         */
        <div className="relative mb-6 flex min-h-14 items-center justify-end">

            {/**
       * Zurück-Button:
       * - absolute links positioniert
       * - nutzt Link → Navigation ohne Seitenreload
       * - Icon + Text für bessere UX
       */}
            <Button
                asChild
                type="button"
                variant="outline"
                className="absolute left-0 min-h-11"
            >
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Zurück
                </Link>
            </Button>

            {/**
       * Logo:
       * - klickbar → führt zur Startseite
       * - dient zusätzlich als visuelles Branding
       */}
            <Link href="/" className="inline-block">
                <Image
                    src="/timewise-logo.svg"
                    alt="Timewise Logo"
                    width={216}
                    height={56}
                    className="h-14 w-[216px] object-contain"
                />
            </Link>
        </div>
    );
}