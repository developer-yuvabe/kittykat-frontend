import fs from "fs";
import path from "path";

const docsDirectory = path.join(process.cwd(), "docs");

type FileName = "help";

export async function getMarkdownData(file: FileName) {
  const fullPath = path.join(docsDirectory, `${file}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");

  return fileContents;
}
