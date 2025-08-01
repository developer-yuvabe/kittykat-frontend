import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { delay } from "@/lib/utils";
import { videoGenerationSchema } from "@/schema/video-gen.schema";
import {
  estimateVideoGenerationCredits,
  videoGenerationService,
} from "@/services/api/video-gen.service";
import { useBrandStore } from "@/store/brand.store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { BrainIcon, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type VideoGenerationOnProps = {
  startImage: string;
  closeDialog: () => void;
};

const VideoGeneration = ({
  startImage,
  closeDialog,
}: VideoGenerationOnProps) => {
  const { selectedBrandId } = useBrandStore();

  const form = useForm<z.infer<typeof videoGenerationSchema>>({
    resolver: zodResolver(videoGenerationSchema),
    defaultValues: {
      prompt: "",
      provider: "replicate",
      model: "kwaivgi/kling-v1.5-standard",
      start_image: startImage,
      negative_prompt: "",
      duration: 5,
      cfg_scale: 0.5,
      aspect_ratio: "16:9",
    },
  });
  const { data: estimatedCredits, isPending } = useQuery({
    queryKey: ["video-credits", form.watch("duration")],
    queryFn: async () => {
      return await estimateVideoGenerationCredits(form.getValues());
    },
  });

  const onSubmit = async (data: z.infer<typeof videoGenerationSchema>) => {
    try {
      if (!selectedBrandId) {
        throw new Error("Brand ID is missing.");
      }
      await videoGenerationService(selectedBrandId, data);

      await delay(1000);
      closeDialog();
    } catch (err) {
      console.error("Failed to generate video:", err);
    }
  };

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6">
      <div className="w-full flex flex-col gap-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex gap-4 items-end">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration</FormLabel>
                    <Select
                      value={field.value.toString()}
                      onValueChange={(val) => field.onChange(Number(val))}
                    >
                      <FormControl>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {["5", "10"].map((val) => (
                          <SelectItem key={val} value={val}>
                            {val}s
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="aspect_ratio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aspect Ratio</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {["16:9", "9:16", "1:1"].map((val) => (
                          <SelectItem key={val} value={val}>
                            {val}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="cfg_scale"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-between">
                    <span>Creativity</span>
                    <span className="text-muted-foreground text-sm">
                      Relevance
                    </span>
                  </FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Slider
                        min={0}
                        max={1}
                        step={0.01}
                        value={[field.value]}
                        onValueChange={(val) => field.onChange(val[0])}
                      />
                      <span className="text-sm font-medium w-10 text-right">
                        {field.value.toFixed(2)}
                      </span>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-between">
                    <span>Prompt</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please describe your creative ideas for the video. Example: A serene beach at sunset, a bustling city street, a futuristic landscape..."
                      className="min-h-[120px] resize-none"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="negative_prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-between">
                    <span>Negative Prompt (Optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="List the type of content you dont want to see in the video. Examples: blur, distortion, low quality... "
                      className="min-h-[60px] resize-none"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full bg-primary text-white text-md h-12 "
              disabled={
                form.formState.isSubmitting ||
                !form.formState.isValid ||
                isPending
              }
              loading={form.formState.isSubmitting}
            >
              <BrainIcon />
              Concept Visual Generation
              {isPending && <Loader2 className="animate-spin" />}
              {estimatedCredits && (
                <span className="text-sm italic">
                  ({estimatedCredits} credits)
                </span>
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default VideoGeneration;
