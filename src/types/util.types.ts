import React from "react";

export type Suggestion = {
  title: string;
  icon: React.ComponentType<any>;
  prompt?: string;
  redirectTo: {
    type: "brand" | "campaign" | "moodboard" | "a2i-input" | "link";
    link?: string;
    tab?: string;
  };
};
