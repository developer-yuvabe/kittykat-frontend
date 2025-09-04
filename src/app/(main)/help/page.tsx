import ReactMarkdownRender from "@/components/ui/react-markdown";
import { getMarkdownData } from "@/services/api/server/md.service";
import React from "react";

const page = async () => {
  const content = await getMarkdownData("help");

  return (
    <div className="prose mx-auto container py-4">
      <ReactMarkdownRender content={content} />
    </div>
  );
};

export default page;
