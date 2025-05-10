// components/ErrorCard.tsx

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface ErrorCardProps {
  title: string;
  message: string;
}

const ErrorCard: React.FC<ErrorCardProps> = ({ title, message }) => {
  return (
    <Card className="bg-gray-50">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-gray-500">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-red-500">{message}</p>
      </CardContent>
    </Card>
  );
};

export default ErrorCard;
