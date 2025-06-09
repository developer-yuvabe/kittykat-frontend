import { Loader2 } from "lucide-react";
import React from "react";

const loading = () => {
  return (
    <div className="flex items-center justify-center w-full h-[85vh]">
      <Loader2 className="text-primary animate-spin" size={40} />
    </div>
  );
};

export default loading;
