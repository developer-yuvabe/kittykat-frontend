import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Plus, Trash, Loader2, Globe } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { brandService } from "@/services/api/brand.service";
import {
  BrandFormValues,
  BrandURLRequest,
  UrlExtractionFormValues,
} from "@/types/brand.types";
import { createBrandSchema, urlExtractionSchema } from "@/schema/brand.schema";

interface BrandCreateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBrandCreated: (brand: any) => void;
}

export function CreateBrandDialog({
  open,
  onOpenChange,
  onBrandCreated,
}: BrandCreateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [colorsMap, setColorsMap] = useState<{
    [key: string]: { name: string; hex: string; rgb: string };
  }>({
    primary: { name: "Primary Color", hex: "#000000", rgb: "0,0,0" },
  });
  const urlForm = useForm<UrlExtractionFormValues>({
    resolver: zodResolver(urlExtractionSchema),
    defaultValues: {
      brand_url: "",
    },
  });
  const form = useForm<BrandFormValues>({
    resolver: zodResolver(createBrandSchema),
    defaultValues: {
      brand: {
        name: "Acme Corp",
        tagline: "Innovating the Future",
        mission:
          "To revolutionize the tech industry with innovative solutions.",
        vision: "A world where technology drives human progress.",
        values: ["Integrity", "Innovation", "Excellence"],
      },
      logo: {
        primary: "https://example.com/logo-primary.png",
        alternate: ["https://example.com/logo-alternate.png"],
        rules: {
          minimum_size: "100px",
          clear_space: "10px",
          prohibited_uses: ["Do not stretch or distort the logo."],
        },
      },
      typography: {
        primary_font: {
          name: "Roboto",
          weights: ["400", "700"],
          usage: "For body text and headings.",
        },
        secondary_font: {
          name: "Arial",
          weights: ["400"],
          usage: "For captions and smaller text.",
        },
      },
      colors: {
        primary: {
          name: "Primary Color",
          hex: "#FF5733",
          rgb: "255,87,51",
        },
      },
      creative_approach: {
        theme: "Futuristic and bold",
        casting: {
          description: "Young, dynamic individuals who represent innovation.",
          goal: "Appeal to the tech-savvy generation.",
        },
        network: "TechNetwork, Innovators Unite",
        representation: {
          values: ["Diversity", "Authenticity"],
          guidelines: "Ensure a broad range of representation in casting.",
        },
      },
      video_guidelines: {
        styling: {
          principles: ["Minimalistic", "Clean"],
        },
        light: {
          principles: ["Soft lighting for a warm effect."],
        },
        posing: {
          style: "Natural and relaxed.",
        },
        setting: {
          role: "Tech environments, creative studios.",
        },
        motion: {
          approach: "Slow-motion for dramatic effect.",
          camera_work: "Smooth tracking shots.",
          lighting: "Soft lighting with highlights.",
        },
        leg_down: {
          intent: "To convey stability and professionalism.",
        },
        still_life: {
          presentation: "Simple, with a focus on product details.",
        },
      },
    },
  });

  const onExtractFromUrl = async (data: UrlExtractionFormValues) => {
    try {
      setIsExtracting(true);

      const request: BrandURLRequest = {
        brand_url: data.brand_url,
      };

      const extracted = await brandService.extractBrandDataFromUrl(request);

      // Reset the form with the entire extracted data
      form.reset(extracted); // This will set all fields automatically based on the extracted data
    } catch (error) {
      console.error("Error extracting brand data:", error);
    } finally {
      setIsExtracting(false);
    }
  };

  const onSubmit = async (data: BrandFormValues) => {
    try {
      setIsSubmitting(true);

      // Send the request
      const createdBrand = await brandService.createBrand(data);

      // Close dialog and notify parent
      onOpenChange(false);
      onBrandCreated(createdBrand);
    } catch (error) {
      console.error("Error creating brand:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to add items to arrays
  const addItemToArray = (path: string, setValue: any, getValues: any) => {
    const currentValues = getValues(path) || [];
    setValue(path, [...currentValues, ""]);
  };

  // Helper function to remove items from arrays
  const removeItemFromArray = (
    path: string,
    index: number,
    setValue: any,
    getValues: any
  ) => {
    const currentValues = getValues(path) || [];
    if (currentValues.length > 1) {
      setValue(
        path,
        currentValues.filter((_: any, i: number) => i !== index)
      );
    }
  };

  // Helper function to add a new color to the colors map
  const addColor = () => {
    const colorKey = `color_${Object.keys(colorsMap).length + 1}`;
    const updatedColorsMap = {
      ...colorsMap,
      [colorKey]: { name: "", hex: "#000000", rgb: "0,0,0" },
    };

    setColorsMap(updatedColorsMap);

    // Update form values
    const currentColors = form.getValues("colors") || {};
    form.setValue("colors", {
      ...currentColors,
      [colorKey]: { name: "", hex: "#000000", rgb: "0,0,0" },
    });
  };

  // Helper function to remove a color from the colors map
  const removeColor = (key: string) => {
    if (Object.keys(colorsMap).length > 1) {
      const { [key]: removed, ...rest } = colorsMap;
      setColorsMap(rest);

      // Update form values
      const currentColors = form.getValues("colors") || {};
      const { [key]: removedColor, ...restColors } = currentColors;
      form.setValue("colors", restColors);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[80vw] max-h-[85vh] pb-0 overflow-y-auto"
        onScroll={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>Create New Brand</DialogTitle>
          <DialogDescription>
            Create a new brand by filling out the details or extract information
            from a website.
          </DialogDescription>
        </DialogHeader>

        {/* URL Extraction Section */}
        <div className="bg-gray-50 p-4 rounded-md ">
          <Form {...urlForm}>
            <form
              onSubmit={urlForm.handleSubmit(onExtractFromUrl)}
              className="flex items-end gap-4"
            >
              <FormField
                control={urlForm.control}
                name="brand_url"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel>Extract Brand Data from URL</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Globe className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="https://www.kittykat.ai"
                          className="pl-8"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isExtracting}>
                {isExtracting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Extracting
                  </>
                ) : (
                  "Extract"
                )}
              </Button>
            </form>
          </Form>
          <p className="text-xs text-gray-500 mt-2">
            Extract brand information from a website to pre-fill the form below.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 ">
            <Accordion type="single" collapsible defaultValue="brand">
              {/* Brand Information Section */}
              <AccordionItem value="brand">
                <AccordionTrigger>
                  <h3 className="text-lg font-semibold">Brand Information</h3>
                </AccordionTrigger>
                <AccordionContent>
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <FormField
                        control={form.control}
                        name="brand.name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Brand Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="brand.tagline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tagline</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="brand.mission"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mission</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={3} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="brand.vision"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vision</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={3} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Brand Values - Array Field */}
                      <div className="space-y-2">
                        <FormLabel>Brand Values</FormLabel>
                        {form.watch("brand.values")?.map((_, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <FormField
                              control={form.control}
                              name={`brand.values.${index}`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder={`Value ${index + 1}`}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                removeItemFromArray(
                                  "brand.values",
                                  index,
                                  form.setValue,
                                  form.getValues
                                )
                              }
                              disabled={form.watch("brand.values")?.length <= 1}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() =>
                            addItemToArray(
                              "brand.values",
                              form.setValue,
                              form.getValues
                            )
                          }
                        >
                          <Plus className="h-4 w-4 mr-2" /> Add Value
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>

              {/* Video Guidelines Section */}
              <AccordionItem value="video_guidelines">
                <AccordionTrigger>
                  <h3 className="text-lg font-semibold">Video Guidelines</h3>
                </AccordionTrigger>
                <AccordionContent>
                  <Card>
                    <CardContent className="pt-6 space-y-6">
                      {/* Styling */}
                      <div className="space-y-4 border p-4 rounded-md">
                        <h4 className="font-medium">Styling</h4>

                        {/* Styling Principles - Array Field */}
                        <div className="space-y-2">
                          <FormLabel>Principles</FormLabel>
                          {form
                            .watch("video_guidelines.styling.principles")
                            ?.map((_, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2"
                              >
                                <FormField
                                  control={form.control}
                                  name={`video_guidelines.styling.principles.${index}`}
                                  render={({ field }) => (
                                    <FormItem className="flex-1">
                                      <FormControl>
                                        <Input
                                          {...field}
                                          placeholder="Principle"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    removeItemFromArray(
                                      "video_guidelines.styling.principles",
                                      index,
                                      form.setValue,
                                      form.getValues
                                    )
                                  }
                                  disabled={
                                    form.watch(
                                      "video_guidelines.styling.principles"
                                    )?.length <= 1
                                  }
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() =>
                              addItemToArray(
                                "video_guidelines.styling.principles",
                                form.setValue,
                                form.getValues
                              )
                            }
                          >
                            <Plus className="h-4 w-4 mr-2" /> Add Principle
                          </Button>
                        </div>
                      </div>

                      {/* Light */}
                      <div className="space-y-4 border p-4 rounded-md">
                        <h4 className="font-medium">Light</h4>

                        {/* Light Principles - Array Field */}
                        <div className="space-y-2">
                          <FormLabel>Principles</FormLabel>
                          {form
                            .watch("video_guidelines.light.principles")
                            ?.map((_, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2"
                              >
                                <FormField
                                  control={form.control}
                                  name={`video_guidelines.light.principles.${index}`}
                                  render={({ field }) => (
                                    <FormItem className="flex-1">
                                      <FormControl>
                                        <Input
                                          {...field}
                                          placeholder="Principle"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    removeItemFromArray(
                                      "video_guidelines.light.principles",
                                      index,
                                      form.setValue,
                                      form.getValues
                                    )
                                  }
                                  disabled={
                                    form.watch(
                                      "video_guidelines.light.principles"
                                    )?.length <= 1
                                  }
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() =>
                              addItemToArray(
                                "video_guidelines.light.principles",
                                form.setValue,
                                form.getValues
                              )
                            }
                          >
                            <Plus className="h-4 w-4 mr-2" /> Add Principle
                          </Button>
                        </div>
                      </div>

                      {/* Posing */}
                      <div className="space-y-4 border p-4 rounded-md">
                        <h4 className="font-medium">Posing</h4>

                        <FormField
                          control={form.control}
                          name="video_guidelines.posing.style"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Style</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Setting */}
                      <div className="space-y-4 border p-4 rounded-md">
                        <h4 className="font-medium">Setting</h4>

                        <FormField
                          control={form.control}
                          name="video_guidelines.setting.role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Role</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Motion */}
                      <div className="space-y-4 border p-4 rounded-md">
                        <h4 className="font-medium">Motion</h4>

                        <FormField
                          control={form.control}
                          name="video_guidelines.motion.approach"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Approach</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="video_guidelines.motion.camera_work"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Camera Work</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="video_guidelines.motion.lighting"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Lighting</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Leg Down */}
                      <div className="space-y-4 border p-4 rounded-md">
                        <h4 className="font-medium">Leg Down</h4>

                        <FormField
                          control={form.control}
                          name="video_guidelines.leg_down.intent"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Intent</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Still Life */}
                      <div className="space-y-4 border p-4 rounded-md">
                        <h4 className="font-medium">Still Life</h4>

                        <FormField
                          control={form.control}
                          name="video_guidelines.still_life.presentation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Presentation</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>

              {/* Logo Section */}
              <AccordionItem value="logo">
                <AccordionTrigger>
                  <h3 className="text-lg font-semibold">Logo</h3>
                </AccordionTrigger>
                <AccordionContent>
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <FormField
                        control={form.control}
                        name="logo.primary"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary Logo URL</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="https://example.com/logo.png"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Alternate Logos - Array Field */}
                      <div className="space-y-2">
                        <FormLabel>Alternate Logos</FormLabel>
                        {form.watch("logo.alternate")?.map((_, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <FormField
                              control={form.control}
                              name={`logo.alternate.${index}`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="https://example.com/alternate-logo.png"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                removeItemFromArray(
                                  "logo.alternate",
                                  index,
                                  form.setValue,
                                  form.getValues
                                )
                              }
                              disabled={
                                form.watch("logo.alternate")?.length <= 1
                              }
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() =>
                            addItemToArray(
                              "logo.alternate",
                              form.setValue,
                              form.getValues
                            )
                          }
                        >
                          <Plus className="h-4 w-4 mr-2" /> Add Alternate Logo
                        </Button>
                      </div>

                      {/* Logo Rules */}
                      <div className="space-y-4 border p-4 rounded-md">
                        <h4 className="font-medium">Logo Rules</h4>

                        <FormField
                          control={form.control}
                          name="logo.rules.minimum_size"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Minimum Size</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="e.g., 50px x 50px"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="logo.rules.clear_space"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Clear Space</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="e.g., 10px on all sides"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Prohibited Uses - Array Field */}
                        <div className="space-y-2">
                          <FormLabel>Prohibited Uses</FormLabel>
                          {form
                            .watch("logo.rules.prohibited_uses")
                            ?.map((_, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2"
                              >
                                <FormField
                                  control={form.control}
                                  name={`logo.rules.prohibited_uses.${index}`}
                                  render={({ field }) => (
                                    <FormItem className="flex-1">
                                      <FormControl>
                                        <Input
                                          {...field}
                                          placeholder="Prohibited use description"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    removeItemFromArray(
                                      "logo.rules.prohibited_uses",
                                      index,
                                      form.setValue,
                                      form.getValues
                                    )
                                  }
                                  disabled={
                                    form.watch("logo.rules.prohibited_uses")
                                      ?.length <= 1
                                  }
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() =>
                              addItemToArray(
                                "logo.rules.prohibited_uses",
                                form.setValue,
                                form.getValues
                              )
                            }
                          >
                            <Plus className="h-4 w-4 mr-2" /> Add Prohibited Use
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>

              {/* Typography Section */}
              <AccordionItem value="typography">
                <AccordionTrigger>
                  <h3 className="text-lg font-semibold">Typography</h3>
                </AccordionTrigger>
                <AccordionContent>
                  <Card>
                    <CardContent className="pt-6 space-y-6">
                      {/* Primary Font */}
                      <div className="space-y-4 border p-4 rounded-md">
                        <h4 className="font-medium">Primary Font</h4>

                        <FormField
                          control={form.control}
                          name="typography.primary_font.name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Font Name</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="e.g., Helvetica"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Font Weights - Array Field */}
                        <div className="space-y-2">
                          <FormLabel>Font Weights</FormLabel>
                          {form
                            .watch("typography.primary_font.weights")
                            ?.map((_, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2"
                              >
                                <FormField
                                  control={form.control}
                                  name={`typography.primary_font.weights.${index}`}
                                  render={({ field }) => (
                                    <FormItem className="flex-1">
                                      <FormControl>
                                        <Input
                                          {...field}
                                          placeholder="e.g., Regular, Bold, Light"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    removeItemFromArray(
                                      "typography.primary_font.weights",
                                      index,
                                      form.setValue,
                                      form.getValues
                                    )
                                  }
                                  disabled={
                                    form.watch(
                                      "typography.primary_font.weights"
                                    )?.length <= 1
                                  }
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() =>
                              addItemToArray(
                                "typography.primary_font.weights",
                                form.setValue,
                                form.getValues
                              )
                            }
                          >
                            <Plus className="h-4 w-4 mr-2" /> Add Font Weight
                          </Button>
                        </div>

                        <FormField
                          control={form.control}
                          name="typography.primary_font.usage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Usage</FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  placeholder="Describe how this font should be used"
                                  rows={3}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Secondary Font */}
                      <div className="space-y-4 border p-4 rounded-md">
                        <h4 className="font-medium">Secondary Font</h4>

                        <FormField
                          control={form.control}
                          name="typography.secondary_font.name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Font Name</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="e.g., Georgia" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Font Weights - Array Field */}
                        <div className="space-y-2">
                          <FormLabel>Font Weights</FormLabel>
                          {form
                            .watch("typography.secondary_font.weights")
                            ?.map((_, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2"
                              >
                                <FormField
                                  control={form.control}
                                  name={`typography.secondary_font.weights.${index}`}
                                  render={({ field }) => (
                                    <FormItem className="flex-1">
                                      <FormControl>
                                        <Input
                                          {...field}
                                          placeholder="e.g., Regular, Bold, Light"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    removeItemFromArray(
                                      "typography.secondary_font.weights",
                                      index,
                                      form.setValue,
                                      form.getValues
                                    )
                                  }
                                  disabled={
                                    form.watch(
                                      "typography.secondary_font.weights"
                                    )?.length <= 1
                                  }
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() =>
                              addItemToArray(
                                "typography.secondary_font.weights",
                                form.setValue,
                                form.getValues
                              )
                            }
                          >
                            <Plus className="h-4 w-4 mr-2" /> Add Font Weight
                          </Button>
                        </div>

                        <FormField
                          control={form.control}
                          name="typography.secondary_font.usage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Usage</FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  placeholder="Describe how this font should be used"
                                  rows={3}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>

              {/* Colors Section */}
              <AccordionItem value="colors">
                <AccordionTrigger>
                  <h3 className="text-lg font-semibold">Colors</h3>
                </AccordionTrigger>
                <AccordionContent>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {Object.keys(colorsMap).map((colorKey) => (
                          <div
                            key={colorKey}
                            className="border p-4 rounded-md relative"
                          >
                            {Object.keys(colorsMap).length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2"
                                onClick={() => removeColor(colorKey)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}

                            <div className="grid grid-cols-3 gap-4">
                              <FormField
                                control={form.control}
                                name={`colors.${colorKey}.name`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Color Name</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        placeholder="e.g., Primary Blue"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`colors.${colorKey}.hex`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Hex Value</FormLabel>
                                    <div className="flex items-center gap-2">
                                      <Input {...field} placeholder="#000000" />
                                      <div
                                        className="w-8 h-8 rounded border"
                                        style={{ backgroundColor: field.value }}
                                      />
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`colors.${colorKey}.rgb`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>RGB Value</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="0,0,0" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        ))}

                        <Button
                          type="button"
                          variant="outline"
                          onClick={addColor}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" /> Add Color
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>

              {/* Creative Approach Section */}
              <AccordionItem value="creative_approach">
                <AccordionTrigger>
                  <h3 className="text-lg font-semibold">Creative Approach</h3>
                </AccordionTrigger>
                <AccordionContent>
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <FormField
                        control={form.control}
                        name="creative_approach.theme"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Theme</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Casting */}
                      <div className="space-y-4 border p-4 rounded-md">
                        <h4 className="font-medium">Casting</h4>

                        <FormField
                          control={form.control}
                          name="creative_approach.casting.description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea {...field} rows={3} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="creative_approach.casting.goal"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Goal</FormLabel>
                              <FormControl>
                                <Textarea {...field} rows={3} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="creative_approach.network"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Network</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Representation */}
                      <div className="space-y-4 border p-4 rounded-md">
                        <h4 className="font-medium">Representation</h4>

                        {/* Representation Values - Array Field */}
                        <div className="space-y-2">
                          <FormLabel>Values</FormLabel>
                          {form
                            .watch("creative_approach.representation.values")
                            ?.map((_, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2"
                              >
                                <FormField
                                  control={form.control}
                                  name={`creative_approach.representation.values.${index}`}
                                  render={({ field }) => (
                                    <FormItem className="flex-1">
                                      <FormControl>
                                        <Input {...field} placeholder="Value" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    removeItemFromArray(
                                      "creative_approach.representation.values",
                                      index,
                                      form.setValue,
                                      form.getValues
                                    )
                                  }
                                  disabled={
                                    form.watch(
                                      "creative_approach.representation.values"
                                    )?.length <= 1
                                  }
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() =>
                              addItemToArray(
                                "creative_approach.representation.values",
                                form.setValue,
                                form.getValues
                              )
                            }
                          >
                            <Plus className="h-4 w-4 mr-2" /> Add Value
                          </Button>
                        </div>

                        <FormField
                          control={form.control}
                          name="creative_approach.representation.guidelines"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Guidelines</FormLabel>
                              <FormControl>
                                <Textarea {...field} rows={3} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <DialogFooter className="sticky bottom-0 right-0 pb-4 pt-2 bg-white w-full">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Brand"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
