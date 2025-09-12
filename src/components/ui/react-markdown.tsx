import React from "react";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import ReactMarkdown, { Components } from "react-markdown";

type ReactMarkdownProps = {
  content: string;
  components?: Components;
};

const ReactMarkdownRender = ({ content, components }: ReactMarkdownProps) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
};

export default ReactMarkdownRender;
