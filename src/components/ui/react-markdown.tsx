import React from "react";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import ReactMarkdown from "react-markdown";

type ReactMarkdownProps = {
  content: string;
};

const ReactMarkdownRender = ({ content }: ReactMarkdownProps) => {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
      {content}
    </ReactMarkdown>
  );
};

export default ReactMarkdownRender;
