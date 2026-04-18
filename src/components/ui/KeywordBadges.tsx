import { getKeywordBadgeStyles, getKeywordDotStyles } from "@/lib/utils";
import type { Keyword } from "@/types";

/*
Darstellung der hinterlegten Keywords als Liste
Maßgeblich verwendet bei Zielen und der Anzeige angelegter Lernzeiten
*/

type KeywordBadgesProps = {
  keywords: Keyword[];
};

export function KeywordBadges({ keywords }: KeywordBadgesProps) {
  if (keywords.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {keywords.map((keyword) => (
        <span
          key={keyword.id}
          className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium"
          style={getKeywordBadgeStyles(keyword.color)}
        >
          <span
            className="h-2 w-2 flex-shrink-0 rounded-full"
            style={getKeywordDotStyles(keyword.color)}
          />
          {keyword.label}
        </span>
      ))}
    </div>
  );
}