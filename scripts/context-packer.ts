import * as fs from "fs";
import * as path from "path";

// === НАСТРОЙКИ (КРУТИ ЗДЕСЬ) ===
const CONFIG = {
  rootDir: process.cwd(),
  outputFile: path.join(process.cwd(), ".ai", "FULL_CONTEXT.txt"),

  // 1. ЧТО БЕРЕМ (Whitelist) - Самое важное
  includeDirs: [
    "src",
    "electron", // Если есть отдельная папка для электрона
    "scripts",
  ],

  // 2. ЯВНЫЕ КОРНЕВЫЕ ФАЙЛЫ
  includeRootFiles: [
    "package.json",
    "tsconfig.json",
    "vite.config.ts",
    "electron.vite.config.ts",
    "tailwind.config.js",
    ".cursorrules",
    "drizzle.config.ts",
  ],

  // 3. ЧТО ТОЧНО НЕ БЕРЕМ (Blacklist)
  ignorePatterns: [
    "node_modules",
    ".git",
    "dist",
    "out",
    "build",
    ".idea",
    ".vscode",
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock", // УБИЙЦЫ КОНТЕКСТА
    "*.log",
    "*.sqlite",
    "*.db",
    "components/ui", // Shadcn компоненты часто стандартные, можно игнорить или брать выборочно
    "assets",
    "public",
  ],

  // 4. ОГРАНИЧЕНИЯ
  maxLinesPerFile: 300, // Если больше -> режем середину
  maxTotalLines: 4000, // Если вышли за лимит -> паникуем (шутка, просто предупреждаем)
};

// ==========================================

const isIgnored = (filePath: string): boolean => {
  const relative = path.relative(CONFIG.rootDir, filePath);
  // Проверка на точное совпадение с блэклистом
  if (
    CONFIG.ignorePatterns.some(
      (p) => relative.includes(p) || filePath.endsWith(p)
    )
  )
    return true;
  // Если это папка, и она не в whitelist (и не корень) - игнор
  const parts = relative.split(path.sep);
  if (parts.length > 1 && !CONFIG.includeDirs.includes(parts[0])) return true;
  return false;
};

const minifyAndTruncate = (content: string, filePath: string): string => {
  let lines = content.split("\n");

  // Удаляем пустые строки и однострочные комменты (опционально)
  lines = lines.filter(
    (l) => l.trim().length > 0 && !l.trim().startsWith("//")
  );

  if (lines.length > CONFIG.maxLinesPerFile) {
    const head = lines.slice(0, 50).join("\n");
    const tail = lines.slice(-50).join("\n");
    return `${head}\n\n... [SNIPPED ${
      lines.length - 100
    } LINES] ...\n\n${tail}`;
  }

  return lines.join("\n");
};

const generateTree = (dir: string, prefix = ""): string => {
  let tree = "";
  const files = fs.readdirSync(dir);

  // Упрощенная сортировка
  files.sort((a, b) => {
    const aStat = fs.statSync(path.join(dir, a));
    const bStat = fs.statSync(path.join(dir, b));
    if (aStat.isDirectory() && !bStat.isDirectory()) return -1;
    if (!aStat.isDirectory() && bStat.isDirectory()) return 1;
    return a.localeCompare(b);
  });

  files.forEach((file, index) => {
    const fullPath = path.join(dir, file);
    if (
      CONFIG.ignorePatterns.some(
        (p) => file === p || fullPath.includes("node_modules")
      )
    )
      return; // Базовый игнор для дерева

    const isLast = index === files.length - 1;
    tree += `${prefix}${isLast ? "└── " : "├── "}${file}\n`;

    if (fs.statSync(fullPath).isDirectory()) {
      tree += generateTree(fullPath, prefix + (isLast ? "    " : "│   "));
    }
  });
  return tree;
};

const run = () => {
  console.log("🔪 Surgical Context Packer v2 starting...");

  let output = `# PROJECT CONTEXT (OPTIMIZED)\nDate: ${new Date().toISOString()}\n\n`;
  output += `## FILE TREE\n\`\`\`\n${generateTree(CONFIG.rootDir)}\n\`\`\`\n\n`;
  output += `## CONTENT\n`;

  let totalLines = 0;
  let fileCount = 0;

  // 1. Process Root Files
  CONFIG.includeRootFiles.forEach((fileName) => {
    const fullPath = path.join(CONFIG.rootDir, fileName);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf-8");
      output += `<file path="${fileName}">\n${minifyAndTruncate(
        content,
        fileName
      )}\n</file>\n\n`;
      totalLines += content.split("\n").length;
      fileCount++;
    }
  });

  // 2. Process Whitelisted Dirs
  const processDir = (dirPath: string) => {
    if (!fs.existsSync(dirPath)) return;
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
      const fullPath = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);

      if (isIgnored(fullPath)) return;

      if (stat.isDirectory()) {
        processDir(fullPath);
      } else {
        // Только код
        if (
          ![".ts", ".tsx", ".js", ".json", ".py", ".css"].includes(
            path.extname(file)
          )
        )
          return;

        const content = fs.readFileSync(fullPath, "utf-8");
        const processed = minifyAndTruncate(content, file);
        const relative = path.relative(CONFIG.rootDir, fullPath);

        output += `<file path="${relative}">\n${processed}\n</file>\n\n`;
        totalLines += processed.split("\n").length;
        fileCount++;
      }
    });
  };

  CONFIG.includeDirs.forEach((dir) =>
    processDir(path.join(CONFIG.rootDir, dir))
  );

  // Ensure output dir
  const aiDir = path.dirname(CONFIG.outputFile);
  if (!fs.existsSync(aiDir)) fs.mkdirSync(aiDir);

  fs.writeFileSync(CONFIG.outputFile, output);

  console.log(`✅ Done!`);
  console.log(`   Files packed: ${fileCount}`);
  console.log(`   Total Lines: ~${totalLines}`);
  console.log(
    `   Output size: ${(fs.statSync(CONFIG.outputFile).size / 1024).toFixed(
      2
    )} KB`
  );

  if (totalLines > CONFIG.maxTotalLines) {
    console.warn(
      `⚠️  WARNING: Output is still large (${totalLines} lines). Consider adding more ignores.`
    );
  }
};

run();
