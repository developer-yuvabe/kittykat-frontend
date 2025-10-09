import React from "react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { Spinner } from "../ui/spinner";

type TokenGenerateButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  tokens: number;
  isCalculatingTokens?: boolean;
  className?: string;
  label?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const TokenGenerateButton = ({
  onClick,
  disabled = false,
  loading = false,
  tokens,
  isCalculatingTokens,
  className,
  label = "Generate",
  ...props
}: TokenGenerateButtonProps) => {
  return (
    <Button
      {...props}
      onClick={onClick}
      disabled={disabled || isCalculatingTokens}
      className={cn("", className)}
    >
      {loading ? (
        <Spinner />
      ) : (
        <>
          {label}
          {isCalculatingTokens && <Spinner />}
          {!isCalculatingTokens &&
            tokens > 0 &&
            ` (${tokens.toLocaleString()} tokens)`}
        </>
      )}
    </Button>
  );
};

export default TokenGenerateButton;
