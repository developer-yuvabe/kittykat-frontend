import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { DynamicFormLabel } from "./DynamicFormField";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

type Seedream4SequentailOptionsProps = {
  form: UseFormReturn<any>;
  source?: string;
};

export function Seedream4SequentailOptions({
  form,
  source,
}: Seedream4SequentailOptionsProps) {
  const value = form.watch("max_images");
  const IMAGE_COUNT = source === "remix" ? 14 : 15;
  const numberOfReferenceImagesUploaded = form.watch("image")?.length || 0;

  return (
    <div className="space-y-2">
      <DynamicFormLabel label="Maximum images to generate" optional={false} />

      <div className="flex items-center space-x-2">
        <Select
          defaultValue="0"
          value={value?.toString() || "0"}
          onValueChange={(value) => form.setValue("max_images", Number(value))}
        >
          <SelectTrigger className="w-full">
            {value === 0 ? (
              "Auto"
            ) : value ? (
              `${value} image${value > 1 ? "s" : ""}`
            ) : (
              <SelectValue />
            )}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={"0"}>
              <p>Auto</p>
              <Tooltip delayDuration={0}>
                <TooltipTrigger
                  asChild
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button className="">
                    <Info className="cursor-pointer" />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  data-allow-event-propagation="true"
                  side="right"
                  className="max-w-64"
                >
                  The mode will decide the number of images to generate.
                </TooltipContent>
              </Tooltip>
            </SelectItem>
            {[...Array(IMAGE_COUNT - numberOfReferenceImagesUploaded)].map(
              (_, index) => (
                <SelectItem key={index} value={(index + 1).toString()}>
                  {index + 1} image{index + 1 > 1 ? "s" : ""}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
export default Seedream4SequentailOptions;
