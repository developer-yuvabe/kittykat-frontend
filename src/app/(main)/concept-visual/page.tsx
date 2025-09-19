import React from "react";
import ConceptVisualEditor from "./_components/ConceptVisualEditor";
import { StreamProvider } from "@/providers/langgraph/Stream";
const page = () => {
  return (
    <div>
      <StreamProvider>
        <ConceptVisualEditor />
      </StreamProvider>
    </div>
  );
};

export default page;
