import * as fs from "fs";
import * as path from "path";

// Настройки: что игнорируем
const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  ".idea",
  ".vscode",
  "dist",
  "out",
  "release",
  "assets",
  ".github",
]);

// Настройки: какие расширения файлов нам интересны (чтобы не листить всякие картинки)
const RELEVANT_EXTS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".css",
  ".html",
  ".sql",
  ".md",
  ".py",
  ".yml",
]);

// Файл куда пишем
const OUTPUT_DIR = ".ai";
const OUTPUT_FILE = path.join(OUTPUT_DIR, "tree.txt");

function getTree(dir: string, prefix = ""): string {
  const name = path.basename(dir);
  if (IGNORE_DIRS.has(name)) return "";

  let output = "";
  let entries: fs.Dirent[];

  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (_e) {
    return "";
  }

  // Сортируем: папки сверху, файлы снизу, алфавитный порядок
  entries.sort((a, b) => {
    if (a.isDirectory() === b.isDirectory()) {
      return a.name.localeCompare(b.name);
    }
    return a.isDirectory() ? -1 : 1;
  });

  // Фильтруем файлы
  const filtered = entries.filter((entry) => {
    if (entry.isDirectory()) return !IGNORE_DIRS.has(entry.name);
    return RELEVANT_EXTS.has(path.extname(entry.name));
  });

  filtered.forEach((entry, index) => {
    const isLast = index === filtered.length - 1;
    const marker = isLast ? "└── " : "├── ";
    const subPrefix = prefix + (isLast ? "    " : "│   ");

    output += `${prefix}${marker}${entry.name}\n`;

    if (entry.isDirectory()) {
      output += getTree(path.join(dir, entry.name), subPrefix);
    }
  });

  return output;
}

// Запуск
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

console.log("Generating project tree...");
const tree = getTree(process.cwd());

// Добавляем заголовок
const finalContent = `Project Structure (Generated: ${new Date().toISOString()})\n\nRoot:\n${tree}`;

fs.writeFileSync(OUTPUT_FILE, finalContent);
console.log(`✅ Tree saved to ${OUTPUT_FILE}`);
