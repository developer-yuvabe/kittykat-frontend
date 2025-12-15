interface BrandPersonaDetailsProps {
  psychographics?: string[];
  painPoints?: string[];
  stylePreferences?: string[];
  visualDirection?: string[];
  messagingAngles?: string[];
  doGuidelines?: string[];
  dontGuidelines?: string[];
}

export function BrandPersonaDetails({
  psychographics,
  painPoints,
  stylePreferences,
  visualDirection,
  messagingAngles,
  doGuidelines,
  dontGuidelines,
}: BrandPersonaDetailsProps) {
  return (
    <>
      {psychographics && psychographics.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Lifestyle Profile
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {psychographics.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {painPoints && painPoints.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Pain Points
          </h4>
          <ul className="space-y-1 text-sm">
            {painPoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-muted-foreground mt-1">•</span>
                <span className="flex-1">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {stylePreferences && stylePreferences.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Style Preferences
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {stylePreferences.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-1 rounded-md bg-accent text-accent-foreground text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {visualDirection && visualDirection.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Visual Direction
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {visualDirection.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {messagingAngles && messagingAngles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Messaging Angles
          </h4>
          <ul className="space-y-1 text-sm">
            {messagingAngles.map((angle, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-muted-foreground mt-1">•</span>
                <span className="flex-1">{angle}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {doGuidelines && doGuidelines.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-green-600 dark:text-green-500 uppercase tracking-wide">
            Do&apos;s
          </h4>
          <ul className="space-y-1 text-sm">
            {doGuidelines.map((guideline, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-500 mt-1">
                  ✓
                </span>
                <span className="flex-1">{guideline}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {dontGuidelines && dontGuidelines.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-red-600 dark:text-red-500 uppercase tracking-wide">
            Don&apos;ts
          </h4>
          <ul className="space-y-1 text-sm">
            {dontGuidelines.map((guideline, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-red-600 dark:text-red-500 mt-1">✗</span>
                <span className="flex-1">{guideline}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
