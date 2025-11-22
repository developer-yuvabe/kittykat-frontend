export type BaseParam = {
  id: string;
  label: string;
  category: "initial" | "advanced";
  defaultValue?: any;
  required: boolean;
  tooltip?: string;
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
    optionHint?: string;
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

export type FirstFrameParam = BaseParam & {
  type: "first_frame";
};

export type LastFrameParam = BaseParam & {
  type: "last_frame";
};
export type AspectRatioParam = BaseParam & {
  type: "aspect_ratio";
  options: {
    optionValue: string;
    optionLabel: string;
    optionHint?: string;
  }[];
};

export type ModelParameter =
  | StringParam
  | SliderParam
  | EnumParam
  | AspectRatioParam
  | FileParam
  | BooleanParam
  | ImagesCountParam
  | NumberParam
  | TextAreaParam
  | FirstFrameParam
  | LastFrameParam;

// Type guard to check if a parameter is a frame parameter
export const isFrameParam = (
  param: ModelParameter
): param is FirstFrameParam | LastFrameParam => {
  return param.type === "first_frame" || param.type === "last_frame";
};

export type Model = {
  id: string;
  name: string;
  disabled: boolean;
  description?: string;
  provider: "openai" | "replicate" | "byteplus" | "gemini";
  type: "image" | "video" | "remix" | "image-upscale" | "vton";
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

  default_edit_model?: boolean;
  default_animation_model?: boolean;
  default_image_reference_model?: boolean;
};

export type Rule = {
  name: string;
  paramId: string;
  hintText?: string;
  disableIf: {
    name: string;
    paramId: string;
    /*
      If false, the default value of the parameter will be overridden to the value specified here.
    */
    restrict?: boolean;
  }[];
};
