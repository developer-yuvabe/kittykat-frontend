// type SelectOption = {
//   label: string;
//   value: string | number;
// };

// type SliderConstraints = {
//   min: number;
//   max: number;
//   step: number;
// };

// export type FileParameter = {
//   type: "file";
//   name: string;
//   formName: string;
//   accept: string[];
//   maxSize: number;
//   maxImages: number;
//   disabled?: boolean;
// };

// export type SelectParameter = {
//   type: "select";
//   name: string;
//   formName: string;
//   options: SelectOption[];
//   icon?: LucideIcon;
//   disabled?: boolean;
// };

// export type SliderParameter = {
//   type: "slider";
//   name: string;
//   formName: string;
//   constraints?: SliderConstraints;
//   disabled?: boolean;
// };

// export type BooleanParameter = {
//   type: "boolean";
//   name: string;
//   formName: string;
//   disabled?: boolean;
// };

// export type TextParameter = {
//   type: "text";
//   name: string;
//   formName: string;
//   disabled?: boolean;
// };

// export type InitialParameter =
//   | FileParameter
//   | SelectParameter
//   | SliderParameter;

// export type AdvancedParameter =
//   | SelectParameter
//   | SliderParameter
//   | BooleanParameter
//   | TextParameter;

// // For array usage:
// export type InitialParameters = InitialParameter[];

// type DisableCondition = {
//   name: string;
//   value: string;
// };

// export type FieldRule = {
//   name: string;
//   value: string;
//   hintText?: string;
//   disableIf: DisableCondition[];
// };

// export type ModelInformation<TSchema extends ZodTypeAny> = {
//   id: string;
//   name: string;
//   provider: "openai" | "replicate";
//   parameters: InitialParameters;
//   advancedParameters: AdvancedParameter[];
//   disabled?: boolean;
//   zodSchema: TSchema;
//   defaultValues: z.infer<TSchema>;
//   // Optional prefix for custom finetuned models
//   prefix?: string;
//   // Used for disabling fields based on conditions
//   rules?: FieldRule[];
// };

export type BaseParam = {
  id: string;
  label: string;
  category: "initial" | "advanced";
  defaultValue?: any;
  required: boolean;
};

export type StringParam = BaseParam & {
  type: "string";
};

export type SliderParam = BaseParam & {
  type: "slider";
  min: number;
  max: number;
  step: number;
};

export type ImagesCountParam = BaseParam & {
  type: "image_count";
  min: number;
  max: number;
  step: number;
};

type EnumParam = BaseParam & {
  type: "enum";
  options: {
    optionValue: string;
    optionLabel: string;
  }[];
};

export type FileParam = BaseParam & {
  type: "file";
  fileTypes: string[];
  maxFileSizeLimit: number;
  maxLimit: number;
};

export type BooleanParam = BaseParam & {
  type: "boolean";
};

export type NumberParam = BaseParam & {
  type: "number";
  min: number;
  max: number;
};

export type TextAreaParam = BaseParam & {
  type: "text_area";
};

export type ModelParameter =
  | StringParam
  | SliderParam
  | EnumParam
  | FileParam
  | BooleanParam
  | ImagesCountParam
  | NumberParam
  | TextAreaParam;

export type Model = {
  id: string;
  name: string;
  disabled: boolean;
  description?: string;
  provider: "openai" | "replicate";
  type: "image" | "video" | "remix" | "image-upscale";
  model: string;
  prefix?: string;
  finetune_id?: string;
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
  rules?: Rule[];
  parameters: ModelParameter[];
};

export type Rule = {
  name: string;
  paramId: string;
  hintText?: string;
  disableIf: {
    name: string;
    paramId: string;
  };
};
