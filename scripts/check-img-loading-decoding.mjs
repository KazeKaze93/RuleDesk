import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();
const RENDERER_DIR = path.join(ROOT_DIR, "src", "renderer");

const EXEMPT_FILES = new Set([
  "src/renderer/features/viewer/ViewerMedia.tsx",
  "src/renderer/components/ui/app-logo.tsx",
]);

const IMG_TAG_REGEX = /<img\b[\s\S]*?>/g;
const LOADING_LAZY_REGEX = /\bloading\s*=\s*["']lazy["']/;
const DECODING_ASYNC_REGEX = /\bdecoding\s*=\s*["']async["']/;

async function collectTsxFiles(directoryPath) {
  const directoryEntries = await fs.readdir(directoryPath, { withFileTypes: true });
  const files = [];

  for (const entry of directoryEntries) {
    const fullPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectTsxFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && fullPath.endsWith(".tsx")) {
      files.push(fullPath);
    }
  }

  return files;
}

function toRelativeProjectPath(filePath) {
  return path.relative(ROOT_DIR, filePath).split(path.sep).join(path.posix.sep);
}

function getLineNumber(fileContent, charIndex) {
  return fileContent.slice(0, charIndex).split("\n").length;
}

async function main() {
  const files = await collectTsxFiles(RENDERER_DIR);
  const violations = [];

  for (const filePath of files) {
    const relativePath = toRelativeProjectPath(filePath);
    if (EXEMPT_FILES.has(relativePath)) {
      continue;
    }

    const content = await fs.readFile(filePath, "utf8");
    const imgTags = content.matchAll(IMG_TAG_REGEX);

    for (const match of imgTags) {
      const tag = match[0];
      const hasLoadingLazy = LOADING_LAZY_REGEX.test(tag);
      const hasDecodingAsync = DECODING_ASYNC_REGEX.test(tag);

      if (hasLoadingLazy && hasDecodingAsync) {
        continue;
      }

      const line = getLineNumber(content, match.index ?? 0);
      const missingAttrs = [];

      if (!hasLoadingLazy) {
        missingAttrs.push('loading="lazy"');
      }
      if (!hasDecodingAsync) {
        missingAttrs.push('decoding="async"');
      }

      violations.push(`${relativePath}:${line} missing ${missingAttrs.join(" and ")}`);
    }
  }

  if (violations.length > 0) {
    console.error("Image loading/decoding check failed:");
    for (const violation of violations) {
      console.error(`- ${violation}`);
    }
    process.exit(1);
  }

  console.log("Image loading/decoding check passed.");
}

main().catch((error) => {
  console.error("Failed to run image loading/decoding check:", error);
  process.exit(1);
});
