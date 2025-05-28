import { Button } from "@/components/ui/button";

interface ActionButton {
  label: string;
  onClick?: () => void;
  color?: string;
  hoverColor?: string;
  size?: "sm" | "default" | "lg" | "icon"; // Base size
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  responsiveSizeClassName?: string; // Custom Tailwind overrides
}

interface ActionButtonsRowProps {
  buttons: ActionButton[];
  className?: string;
}
export function ActionButtonsRow({
  buttons,
  className = "",
}: ActionButtonsRowProps) {
  return (
    <div className={`flex gap-2 mt-4 ${className}`}>
      {buttons.map((btn, i) => (
        <Button
          key={i}
          onClick={btn.onClick}
          variant={btn.variant ?? "default"}
          size={btn.size ?? "default"}
          className={`
            flex-1 
            ${btn.color ?? ""} 
            ${btn.hoverColor ? `hover:${btn.hoverColor}` : ""}
            ${btn.responsiveSizeClassName ?? ""}
          `}
          style={{
            ...(btn.color && { backgroundColor: btn.color }),
            ...(btn.hoverColor && { transition: "background-color 0.2s" }),
          }}
        >
          {btn.label}
        </Button>
      ))}
    </div>
  );
}
