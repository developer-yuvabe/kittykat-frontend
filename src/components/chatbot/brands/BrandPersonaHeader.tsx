import { CardHeader } from "@/components/ui/card";

interface BrandPersonaHeaderProps {
  name: string;
  summary?: string;
}

export function BrandPersonaHeader({ name, summary }: BrandPersonaHeaderProps) {
  return (
    <CardHeader className="border-b flex-shrink-0 pb-3 min-h-28">
      <h3 className="text-lg font-semibold">{name}</h3>
      {summary && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
          {summary}
        </p>
      )}
    </CardHeader>
  );
}
