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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  AdvancedParameter,
  FieldRule,
  InitialParameter,
} from "@/types/a2i-media.types";
import { InfoIcon } from "lucide-react";
import { FieldValues, UseFormReturn, useWatch } from "react-hook-form";

type FieldParam = InitialParameter | AdvancedParameter;

type DynamicFormFieldProps<T extends FieldValues> = {
  param: FieldParam;
  rules?: FieldRule[];
  form: UseFormReturn<T>;
  type: "initial" | "advanced";
};

const DynaicFormLabel = ({
  label,
  showLabel = true,
}: {
  label: string;
  showLabel?: boolean;
}) => {
  return showLabel ? (
    <FormLabel className="text-xs text-muted-foreground">{label}</FormLabel>
  ) : null;
};

export function DynamicFormField<T extends FieldValues>({
  param,
  form,
  type = "initial",
  rules,
}: DynamicFormFieldProps<T>) {
  const watchedValues = useWatch({
    control: form.control,
  });

  const getShouldDisableOption = (
    formName: string,
    value: string
  ): { disabled: boolean; hintText?: string } => {
    if (!rules) return { disabled: false };

    const matchingRule = rules.find(
      (r) => r.name === formName && r.value === value
    );
    if (!matchingRule) return { disabled: false };

    const shouldDisable = matchingRule.disableIf.some((cond) => {
      return watchedValues?.[cond.name] === cond.value;
    });

    return {
      disabled: shouldDisable,
      hintText: shouldDisable ? matchingRule.hintText : undefined,
    };
  };

  if (param.disabled) {
    return <></>;
  }

  return (
    <FormField
      control={form.control}
      name={param.formName as any}
      render={({ field }) => {
        switch (param.type) {
          case "slider":
            const SlideComp = (
              <FormItem>
                <div>
                  <div className="flex items-center justify-between">
                    <DynaicFormLabel label={param.name} />
                    {
                      <span className="text-xs text-muted-foreground">
                        {field.value}
                      </span>
                    }
                  </div>
                </div>
                <FormControl>
                  <Slider
                    disabled={param.disabled}
                    value={[field.value ?? param.constraints?.min ?? 0]}
                    onValueChange={(val) => field.onChange(val[0])}
                    min={param.constraints?.min}
                    max={param.constraints?.max}
                    step={param.constraints?.step}
                  />
                </FormControl>
                {
                  <span className="text-[10px] italic text-muted-foreground">
                    (minimum: {param.constraints?.min}, maximum:{" "}
                    {param.constraints?.max})
                  </span>
                }
              </FormItem>
            );

            return type === "initial" ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"}>{field.value}x</Button>
                </PopoverTrigger>
                <PopoverContent
                  forceMount
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
                <DynaicFormLabel
                  showLabel={type !== "initial"}
                  label={param.name}
                />
              </FormItem>
            );

          case "select":
            return (
              <FormItem
                className={cn("w-full", {
                  "w-max": type === "initial",
                })}
              >
                <DynaicFormLabel
                  showLabel={type !== "initial"}
                  label={param.name}
                />

                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger
                      className={cn("w-full !gap-0", {
                        "w-max": type === "initial",
                      })}
                      disableDropdown
                    >
                      {(() => {
                        const selected = param.options?.find(
                          (opt) => opt.value === field.value
                        );
                        return selected ? (
                          <div className="flex items-center gap-2">
                            {param.icon && <param.icon className="w-4 h-4" />}
                            {selected.label}
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
                    {param.options?.map(({ value, label }) => {
                      const { disabled, hintText } = getShouldDisableOption(
                        param.formName,
                        value.toString()
                      );

                      if (disabled) {
                        return (
                          <div
                            key={value.toString()}
                            className="focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none pointer-events-auto opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2"
                          >
                            <FormLabel className="font-normal">
                              {label}

                              {hintText && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger className="cursor-not-allowed self-end">
                                      <InfoIcon className="w-3 h-3" />
                                    </TooltipTrigger>
                                    <TooltipContent>{hintText}</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </FormLabel>
                          </div>
                        );
                      }

                      return (
                        <SelectItem
                          key={value.toString()}
                          value={value.toString()}
                          className="flex items-center gap-3 justify-between px-2 py-3 rounded-md hover:bg-muted w-full"
                          title={hintText}
                        >
                          <FormLabel className="font-normal">{label}</FormLabel>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </FormItem>
            );

          case "text":
            return (
              <FormItem>
                <DynaicFormLabel
                  showLabel={type !== "initial"}
                  label={param.name}
                />
                <FormControl>
                  <Input {...field} placeholder={param.name} />
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
