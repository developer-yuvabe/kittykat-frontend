import { cn } from "@/lib/utils";
import { useStreamContext } from "@/providers/langgraph/Stream";
import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "../ui/button";
import { Info } from "lucide-react";
import { parseAsBoolean, useQueryState } from "nuqs";
import { format } from "date-fns";

type AgentDebugProps = {
  className?: string;
};

const AgentDebug = ({ className }: AgentDebugProps) => {
  const [hideToolCalls] = useQueryState(
    "hideToolCalls",
    parseAsBoolean.withDefault(true)
  );
  const [open, setOpen] = React.useState(false);

  const { values } = useStreamContext();

  if (hideToolCalls) return null;

  return (
    <div className={cn("", className)}>
      <Popover open={open} onOpenChange={(isOpen) => setOpen(isOpen)}>
        <PopoverTrigger asChild onClick={() => setOpen(open)}>
          <Button variant="outline" size="icon" className="rounded-full">
            <Info />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-xl" align="end">
          <div className="grid gap-4">
            <h3 className="font-medium leading-none text-lg">Agent Debug</h3>
            <div className="border border-gray-200 rounded-md overflow-hidden w-full">
              <table className="min-w-full text-sm text-left border-collapse">
                <tbody>
                  <tr className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium text-gray-700 capitalize">
                      Total messages
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {values?.messages ? values.messages.length : 0}
                    </td>
                  </tr>
                  <tr className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium text-gray-700 capitalize">
                      Last agent triggered
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {values.next ?? "N/A"}
                    </td>
                  </tr>
                  <tr className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium text-gray-700 capitalize">
                      Timestamp
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {values.timestamp && format(values.timestamp, "PPpp")}
                    </td>
                  </tr>
                  {Object.entries(values)
                    .filter(
                      ([key]) =>
                        key !== "timestamp" &&
                        key !== "messages" &&
                        key !== "next"
                    )
                    .map(([key, value]) => (
                      <tr key={key} className="border-b last:border-0">
                        <td className="px-3 py-2 font-medium text-gray-700 capitalize">
                          {key.replace(/_/g, " ")}
                        </td>
                        <td className="px-3 py-2 text-gray-600">
                          {((value ?? "-") as string) || null}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default AgentDebug;
