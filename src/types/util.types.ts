import React from "react";

export type Suggestion = {
  title: string;
  icon: React.ComponentType<any>;
  prompt: string;
  redirectTo: "brand" | "campaign" | "moodboard" | "concept_visual_generator";
};
