import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { UseFormReturn } from "react-hook-form";
import { DynamicFormLabel } from "./DynamicFormField";

type Seedream4SequentailOptionsProps = {
  form: UseFormReturn<any>;
};

export function Seedream4SequentailOptions({
  form,
}: Seedream4SequentailOptionsProps) {
  const value = form.watch("max_images");
  const numberOfReferenceImagesUploaded = form.watch("image")?.length || 0;
  const isAuto = value === 0;

  return (
    <div className="space-y-2 pl-2 border-l border-border">
      <DynamicFormLabel label="Maximum images to generate" optional={false} />

      <div className="flex items-center space-x-2">
        <Button
          size={"xs"}
          variant="outline"
          className="p text-xs"
          onClick={() => form.setValue("max_images", isAuto ? 1 : 0)}
        >
          {isAuto ? "Custom" : "Auto"}
        </Button>
        {!isAuto && (
          <div className="flex items-center space-x-2 w-full">
            <Slider
              value={[isAuto ? 0 : value]}
              onValueChange={(val) => form.setValue("max_images", val[0])}
              min={1}
              max={15 - numberOfReferenceImagesUploaded}
              step={1}
              disabled={isAuto}
              className="disabled:opacity-50 disabled:cursor-pointer"
            />
            <p className="text-sm ml-2">{value}x</p>
          </div>
        )}
      </div>

      {!isAuto && (
        <span className="text-[10px] italic text-muted-foreground">
          (minimum: {1}, maximum: {15 - numberOfReferenceImagesUploaded})
        </span>
      )}
    </div>
  );
}
export default Seedream4SequentailOptions;
