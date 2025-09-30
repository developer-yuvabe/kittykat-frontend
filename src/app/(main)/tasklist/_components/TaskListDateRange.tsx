import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";

interface TaskListDateRangeProps {
  dateFrom: string | undefined;
  dateTo: string | undefined;
  onDateFromChange: (date: Date | undefined) => void;
  onDateToChange: (date: Date | undefined) => void;
}

// Date Range Component
export const TaskListDateRange = ({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
}: TaskListDateRangeProps) => {
  const [isDateFromOpen, setIsDateFromOpen] = useState(false);
  const [isDateToOpen, setIsDateToOpen] = useState(false);

  const handleDateFromSelect = (date: Date | undefined) => {
    onDateFromChange(date);
    setIsDateFromOpen(false);
  };

  const handleDateToSelect = (date: Date | undefined) => {
    onDateToChange(date);
    setIsDateToOpen(false);
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="space-y-2">
        <Label>Date From</Label>
        <Popover open={isDateFromOpen} onOpenChange={setIsDateFromOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFrom ? (
                format(new Date(dateFrom), "MMM dd, yyyy")
              ) : (
                <span className="text-muted-foreground">From</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateFrom ? new Date(dateFrom) : undefined}
              onSelect={handleDateFromSelect}
              autoFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label>Date To</Label>
        <Popover open={isDateToOpen} onOpenChange={setIsDateToOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateTo ? (
                format(new Date(dateTo), "MMM dd, yyyy")
              ) : (
                <span className="text-muted-foreground">To</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateTo ? new Date(dateTo) : undefined}
              onSelect={handleDateToSelect}
              autoFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
