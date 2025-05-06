import { X } from "lucide-react";
import React from "react";

type ErrorMessageProps = {
  message: string;
};

const ErrorMessage = ({
  message,
}: ErrorMessageProps & {
  className?: string;
}) => {
  return (
    <div className="flex items-center space-x-2">
      <X className="w-4 h-4 text-destructive" />
      <p className="text-destructive text-sm">{message}</p>
    </div>
  );
};

export default ErrorMessage;
