"use client";
import * as React from "react";
import { Input } from "./input";
import { Eye, EyeOff } from "lucide-react";

const PasswordInput = ({
  className,
  ...props
}: React.ComponentProps<"input">) => {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className="relative">
      <Input
        className={`pr-10 ${className}`}
        type={showPassword ? "text" : "password"}
        {...props}
      />
      <button
        type="button"
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
        onClick={() => {
          setShowPassword(!showPassword);
        }}
      >
        {!showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
};

export { PasswordInput };
