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
import { cn } from "@/lib/utils";
import { AdvancedParameter, InitialParameter } from "@/types/a2i-media.types";
import { FieldValues, UseFormReturn } from "react-hook-form";

type FieldParam = InitialParameter | AdvancedParameter;

type DynamicFormFieldProps<T extends FieldValues> = {
  param: FieldParam;
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
}: DynamicFormFieldProps<T>) {
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
                    {param.options?.map(({ value, label }) => (
                      <SelectItem
                        key={value.toString()}
                        value={value.toString()}
                        className="flex items-center gap-3 justify-between px-2 py-3 rounded-md hover:bg-muted w-full"
                      >
                        <FormLabel className="font-normal">{label}</FormLabel>
                      </SelectItem>
                    ))}
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
