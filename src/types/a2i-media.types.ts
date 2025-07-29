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

export type Model = {
  id: string;
  name: string;
  disabled: boolean;
  description?: string;
  provider: "openai" | "replicate";
  type: "image" | "video";
  prefix?: string;
  pricing:
    | {
        type: "fixed";
        price: number;
      }
    | {
        type: "variable";
        estimationTriggers: string[];
      };
  credits: number | null;
  parameters: Array<
    | {
        type: "string";
        category: "initial" | "advanced";
        label: string;
        id: string;
        defaultValue?: any;
        rules?: Rule[];
      }
    | {
        type: "slider";
        category: "initial" | "advanced";
        label: string;
        id: string;
        defaultValue?: any;
        rules?: Rule[];
        min: number;
        max: number;
        step: number;
      }
    | {
        type: "enum";
        category: "initial" | "advanced";
        label: string;
        id: string;
        defaultValue?: any;
        rules?: Rule[];
        options: {
          optionValue: string;
          optionLabel: string;
        }[];
      }
    | {
        type: "file";
        category: "initial" | "advanced";
        label: string;
        id: string;
        defaultValue?: any;
        rules?: Rule[];
        fileTypes: string[];
        maxFileSizeLimit: number;
        maxLimit: number;
      }
    | {
        type: "boolean";
        category: "initial" | "advanced";
        label: string;
        id: string;
        defaultValue?: any;
        rules?: Rule[];
      }
  >;
};

type Rule = {
  name: string;
  value: string;
  hintText?: string;
  disableIf: {
    name: string;
    value: string;
  };
};
