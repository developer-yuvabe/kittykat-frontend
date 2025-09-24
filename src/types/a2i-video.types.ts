export type A2iVideoGenerationResponse = {
  generation_id: string | string[];
  status: "processing" | "completed" | "failed";
  provider: string;
};
