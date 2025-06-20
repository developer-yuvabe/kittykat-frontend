import { FormField, FormItem } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useImageGenForm } from "@/hooks/useImageGenForm";
import { cn } from "@/lib/utils";
import React from "react";

const IMAGE_GEN_MODELS = [
  {
    value: "gpt-image-1",
    label: "GPT Image 1",
    disabled: false,
  },
  {
    value: "black-forest-labs/flux-dev",
    label: "Flux Dev",
    disabled: true,
  },
  {
    value: "black-forest-labs/flux-1.1-pro",
    label: "Flux 1.1 Pro",
    disabled: true,
  },
  {
    value: "black-forest-labs/flux-1.1-pro-ultra",
    label: "Flux 1.1 Pro Ultra",
    disabled: true,
  },
];

export default function A2iImageModelSelector() {
  const form = useImageGenForm();
  const watchModel = form.watch("model");
  const hasValue = !!watchModel;

  return (
    <div className="relative w-max">
      <label
        className={cn(
          "absolute left-3 transition-all duration-200 text-muted-foreground pointer-events-none",
          hasValue
            ? "top-0 text-xs font-medium translate-y-[-50%] bg-white px-1"
            : "top-1/2 -translate-y-1/2 text-sm"
        )}
      >
        Model
      </label>
      <FormField
        control={form.control}
        name="model"
        render={({ field }) => (
          <FormItem>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Available Models</SelectLabel>
                  {IMAGE_GEN_MODELS.map((model) => (
                    <SelectItem
                      key={model.value}
                      value={model.value}
                      disabled={model.disabled}
                      className="disabled:cursor-not-allowed"
                    >
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />
    </div>
  );
}
