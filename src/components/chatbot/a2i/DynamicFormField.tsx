import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ModelParameter, Rule } from "@/types/a2i-media.types";
import { InfoIcon } from "lucide-react";
import { FieldValues, UseFormReturn, useWatch } from "react-hook-form";
import { toast } from "sonner";
import Seedream4SequentailOptions from "./Seedream4SequentailOptions";

type DynamicFormFieldProps<T extends FieldValues> = {
  param: ModelParameter;
  rules?: Rule[];
  form: UseFormReturn<T>;
  type: "initial" | "advanced";
  sliderSuffix?: string;
  source?: "remix" | "upscale" | "vton";
  allModelParameters?: ModelParameter[];
};

export const DynamicFormLabel = ({
  label,
  showLabel = true,
  optional,
  className,
}: {
  label: string;
  showLabel?: boolean;
  optional: boolean;
  className?: string;
}) => {
  return showLabel ? (
    <FormLabel className={cn("text-xs text-muted-foreground", className)}>
      {label}
      <span className="italic">{optional ? "(optional)" : ""}</span>
    </FormLabel>
  ) : null;
};

export function DynamicFormField<T extends FieldValues>({
  param,
  form,
  type = "initial",
  rules,
  sliderSuffix,
  source,
  allModelParameters,
}: DynamicFormFieldProps<T>) {
  const watchedValues = useWatch({
    control: form.control,
  });

  const getShouldDisableOption = (
    formName: string,
    value: string
  ): { disabled: boolean; hintText?: string } => {
    if (!rules || rules.length === 0) return { disabled: false };

    const matchingRules = rules.filter(
      (r) => r.name === formName && r.paramId === value
    );

    if (matchingRules.length === 0) return { disabled: false };

    for (const rule of matchingRules) {
      const shouldDisable = rule.disableIf.some(
        (cond) => watchedValues?.[cond.name] === cond.paramId
      );

      if (shouldDisable) {
        return { disabled: true, hintText: rule.hintText };
      }
    }

    return { disabled: false };
  };

  const applyRestrictIfDefaults = (fieldName: string, newValue: string) => {
    if (!rules || !allModelParameters) return;

    for (const rule of rules) {
      for (const cond of rule.disableIf) {
        if (
          cond.restrict === false &&
          cond.name === fieldName &&
          cond.paramId === newValue
        ) {
          const restrictedParam = allModelParameters.find(
            (p) => p.id === rule.name
          );

          if (restrictedParam?.defaultValue !== undefined) {
            form.setValue(rule.name as any, restrictedParam.defaultValue);
            toast.info(
              `${restrictedParam.label} reset to ${restrictedParam.defaultValue}`
            );
            return;
          }
        }
      }
    }
  };

  if (
    watchedValues?.["model"] === "seedream-4-0-250828" &&
    param.id === "max_images"
  ) {
    return watchedValues?.["sequential_image_generation"] === true ? (
      <Seedream4SequentailOptions form={form} source={source} />
    ) : null;
  }

  return (
    <FormField
      control={form.control}
      name={param.id as any}
      render={({ field }) => {
        switch (param.type) {
          case "slider":
          case "image_count":
            const SlideComp = (
              <FormItem>
                <div>
                  <div className="flex items-center justify-between">
                    <DynamicFormLabel
                      label={param.label}
                      optional={!param.required}
                    />
                    {
                      <span className="text-xs text-muted-foreground">
                        {field.value}
                      </span>
                    }
                  </div>
                </div>
                <FormControl>
                  <Slider
                    value={[field.value ?? param.min ?? 0]}
                    onValueChange={(val) => field.onChange(val[0])}
                    min={param.min}
                    max={param.max}
                    step={param.step}
                  />
                </FormControl>
                {
                  <span className="text-[10px] italic text-muted-foreground">
                    (minimum: {param?.min}, maximum: {param?.max})
                  </span>
                }
              </FormItem>
            );

            return type === "initial" ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"}>
                    {field.value}
                    {sliderSuffix ?? "x"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="center"
                  side="top"
                  className="space-y-2 w-64"
                >
                  {SlideComp}
                </PopoverContent>
              </Popover>
            ) : (
              SlideComp
            );

          case "number":
            return (
              <FormItem className="flex flex-col  gap-2">
                <DynamicFormLabel
                  showLabel={type !== "initial"}
                  label={param.label}
                  optional={!param.required}
                />
                <FormControl>
                  <NumberInput
                    value={field.value}
                    onChange={(value) => field.onChange(value)}
                    min={param.min}
                    max={param.max}
                    className="w-full"
                  />
                </FormControl>
              </FormItem>
            );

          case "text_area":
            return (
              <FormItem className="flex flex-col gap-2">
                <DynamicFormLabel
                  showLabel={type !== "initial"}
                  label={param.label}
                  optional={!param.required}
                />
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder={param.label}
                    className="max-h-40 resize-none"
                  />
                </FormControl>
              </FormItem>
            );

          case "boolean":
            return (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(!!checked)}
                    className="h-4 w-4"
                  />
                </FormControl>
                <DynamicFormLabel
                  showLabel={type !== "initial"}
                  label={param.label}
                  optional={!param.required}
                />
              </FormItem>
            );

          case "enum":
            return (
              <FormItem
                className={cn("w-full", {
                  "w-max": type === "initial",
                })}
              >
                <DynamicFormLabel
                  showLabel={type !== "initial"}
                  label={param.label}
                  optional={!param.required}
                />

                <Select
                  onValueChange={(v) => {
                    if (!v) return;
                    field.onChange(v);
                    applyRestrictIfDefaults(param.id, v);
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger
                      className={cn("w-full !gap-0", {
                        "w-max": type === "initial",
                      })}
                      disableDropdown
                    >
                      {(() => {
                        const selected = param.options?.find(
                          (opt) => opt.optionValue === field.value
                        );
                        return selected ? (
                          <div className="flex items-center gap-2">
                            {/* {param.icon && <param.icon className="w-4 h-4" />} */}
                            {selected.optionLabel}
                          </div>
                        ) : (
                          <span>Select</span>
                        );
                      })()}
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent
                    className={cn("w-full", {
                      "w-max": type === "initial",
                    })}
                  >
                    {param.options?.map(
                      ({ optionValue, optionLabel, optionHint }) => {
                        const { disabled, hintText } = getShouldDisableOption(
                          param.id,
                          optionValue.toString()
                        );

                        if (disabled) {
                          return (
                            <div
                              key={optionValue.toString()}
                              className="focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-3 rounded-sm py-3 pr-8 pl-2 text-sm outline-hidden select-none pointer-events-auto opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2"
                            >
                              <FormLabel className="font-normal">
                                {optionLabel}

                                {hintText && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger className="cursor-not-allowed self-end">
                                        <InfoIcon className="w-3 h-3" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        {hintText}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </FormLabel>
                            </div>
                          );
                        }

                        return (
                          <SelectItem
                            key={optionValue.toString()}
                            value={optionValue.toString()}
                            className="flex items-center gap-3 justify-between px-2 py-3 rounded-md hover:bg-muted w-full"
                            title={hintText}
                          >
                            <FormLabel className="font-normal">
                              {optionLabel}
                            </FormLabel>
                            {optionHint && (
                              <TooltipIconButton
                                side="right"
                                tooltipClassName="max-w-44"
                                tooltip={optionHint}
                              >
                                <InfoIcon />
                              </TooltipIconButton>
                            )}
                          </SelectItem>
                        );
                      }
                    )}
                  </SelectContent>
                </Select>
              </FormItem>
            );

          case "string":
            return (
              <FormItem>
                <DynamicFormLabel
                  showLabel={type !== "initial"}
                  label={param.label}
                  optional={!param.required}
                />
                <FormControl>
                  <Input {...field} placeholder={param.label} />
                </FormControl>
                <FormMessage />
              </FormItem>
            );

          default:
            return <></>;
        }
      }}
    />
  );
}
