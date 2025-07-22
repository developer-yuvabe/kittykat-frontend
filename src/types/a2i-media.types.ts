import { LucideIcon } from "lucide-react";
import z, { ZodTypeAny } from "zod";

type SelectOption = {
  label: string;
  value: string | number;
};

type SliderConstraints = {
  min: number;
  max: number;
  step: number;
};

export type FileParameter = {
  type: "file";
  name: string;
  formName: string;
  accept: string[];
  maxSize: number;
  maxImages: number;
  disabled?: boolean;
};

export type SelectParameter = {
  type: "select";
  name: string;
  formName: string;
  options: SelectOption[];
  icon?: LucideIcon;
  disabled?: boolean;
};

export type SliderParameter = {
  type: "slider";
  name: string;
  formName: string;
  constraints?: SliderConstraints;
  disabled?: boolean;
};

export type BooleanParameter = {
  type: "boolean";
  name: string;
  formName: string;
  disabled?: boolean;
};

export type TextParameter = {
  type: "text";
  name: string;
  formName: string;
  disabled?: boolean;
};

export type InitialParameter =
  | FileParameter
  | SelectParameter
  | SliderParameter;

export type AdvancedParameter =
  | SelectParameter
  | SliderParameter
  | BooleanParameter
  | TextParameter;

// For array usage:
export type InitialParameters = InitialParameter[];

type DisableCondition = {
  name: string;
  value: string;
};

export type FieldRule = {
  name: string;
  value: string;
  hintText?: string;
  disableIf: DisableCondition[];
};

export type ModelInformation<TSchema extends ZodTypeAny> = {
  id: string;
  name: string;
  provider: "openai" | "replicate";
  parameters: InitialParameters;
  advancedParameters: AdvancedParameter[];
  disabled?: boolean;
  zodSchema: TSchema;
  defaultValues: z.infer<TSchema>;
  // Optional prefix for custom finetuned models
  prefix?: string;
  // Used for disabling fields based on conditions
  rules?: FieldRule[];
};
