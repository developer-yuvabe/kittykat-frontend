import React from "react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

type TokenGenerateButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  tokens: number;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const TokenGenerateButton = ({
  onClick,
  disabled = false,
  loading = false,
  tokens,
  className,
  ...props
}: TokenGenerateButtonProps) => {
  return (
    <Button
      {...props}
      onClick={onClick}
      disabled={disabled}
      loading={loading}
      className={cn("", className)}
    >
      {loading
        ? "Generating..."
        : `Generate (${tokens.toLocaleString()} tokens)`}
    </Button>
  );
};

export default TokenGenerateButton;
