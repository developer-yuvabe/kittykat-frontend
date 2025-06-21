import { useImageGenForm } from "@/hooks/useImageGenForm";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const qualities = ["low", "medium", "high"] as const;
const backgrounds = ["auto", "transparency", "opaque"] as const;
const moderations = ["auto", "low"] as const;

const GptImag1AdvanceParameters = ({
  outputFormat,
}: {
  outputFormat: string;
}) => {
  const form = useImageGenForm();

  return (
    <div className="space-y-4">
      <FormLabel className="text-muted-foreground text-sm">
        Advance Parameters
      </FormLabel>
      <FormField
        control={form.control}
        name="quality"
        render={({ field }) => (
          <FormItem className="flex flex-row justify-between gap-x-2">
            <FormLabel className="text-sm">Quality</FormLabel>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value}
              disabled={form.formState.isSubmitting}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {qualities.map((q) => (
                  <SelectItem key={q} value={q}>
                    {q.charAt(0).toUpperCase() + q.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="background"
        render={({ field }) => (
          <FormItem className="flex flex-row justify-between gap-x-2">
            <FormLabel className="text-sm">Background</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {backgrounds.map((b) => (
                  <SelectItem
                    key={b}
                    value={b}
                    disabled={
                      outputFormat === "jpeg" && b === "transparency"
                        ? true
                        : false
                    }
                  >
                    {b.charAt(0).toUpperCase() + b.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="moderation"
        render={({ field }) => (
          <FormItem className="flex flex-row justify-between gap-x-2">
            <FormLabel className="text-sm">Moderation</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {moderations.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default GptImag1AdvanceParameters;
