import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useState, useEffect } from "react";

interface AskKittykartAcceptAndStartDialogProps {
  isOpen: boolean;
  isSubmitting: boolean;
  clientName: string;
  onClose: () => void;
  onSubmit: (etaDate: Date) => void;
}

export function AskKittykartAcceptAndStartDialog({
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
}: AskKittykartAcceptAndStartDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const calculateSuggestedETA = () => {
    // Calculate ETA based on current workload and complexity
    // Default to 3-5 business days for now
    const businessDays = 3;
    const currentDate = new Date();
    const eta = new Date(currentDate);

    // Add business days (skip weekends)
    let daysAdded = 0;
    while (daysAdded < businessDays) {
      eta.setDate(eta.getDate() + 1);
      if (eta.getDay() !== 0 && eta.getDay() !== 6) {
        // Not Sunday (0) or Saturday (6)
        daysAdded++;
      }
    }

    return eta;
  };

  // Set suggested date when dialog opens
  useEffect(() => {
    if (isOpen && !selectedDate) {
      setSelectedDate(calculateSuggestedETA());
    }
  }, [isOpen, selectedDate]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setIsCalendarOpen(false); // Close calendar when date is selected
    }
  };

  const handleSubmit = () => {
    if (selectedDate) {
      onSubmit(selectedDate);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Accept and Start Working</DialogTitle>
          <DialogDescription>
            This will mark the request as &quot;In Progress&quot; and send an
            automatic update to the client. You can select the estimated
            delivery date before sending.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Estimated Delivery Date
            </label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  autoFocus
                  disabled={(date) =>
                    date < new Date() || date < new Date("1900-01-01")
                  }
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedDate || isSubmitting}
            variant="default"
          >
            {isSubmitting ? "Processing..." : "Accept & Start"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
