/**
 * scripts/dependency_detox.cjs
 * v2.0 - Smarter analysis for Build Tools, UI Wrappers & CLI scripts.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Инструменты, которые мы не трогаем, потому что они работают "из тени" (CLI, configs)
const SAFE_BUILD_TOOLS = [
  "typescript",
  "eslint",
  "prettier",
  "vite",
  "electron",
  "electron-builder",
  "electron-vite",
  "tailwindcss",
  "postcss",
  "autoprefixer",
  "drizzle-kit",
  "repomix",
  "globals",
  "@types/node",
  "@types/react",
  "@types/react-dom",
  "concurrently",
  "wait-on",
  "cross-env",
  "rimraf",
  "basedpyright",
];

// Библиотеки, для которых 1 импорт - это норма (Pattern: UI Wrapper / Singleton)
const SINGLETON_PATTERNS = [
  "@radix-ui",
  "@headlessui",
  "zod",
  "zustand",
  "i18next",
  "better-sqlite3",
  "electron-log",
  "lucide-react",
  "clsx",
  "tailwind-merge",
];

const SHAME_LIST = {
  lodash: "Используй нативный JS. Ты не в 2015-м.",
  moment: "Слишком жирный. Бери date-fns или Intl.",
  axios: "У тебя есть fetch(). Зачем лишние 20кб?",
  "is-odd": "Серьезно? Удаляй.",
  uuid: "crypto.randomUUID() есть в платформе.",
};

class DependencyDetox {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.srcDir = path.join(rootDir, "src");
    this.pkgFile = path.join(rootDir, "package.json");
    this.totalFiles = 0;
    this.pkgData = {};
  }

  run(mode, targetPkg) {
    if (!fs.existsSync(this.pkgFile)) {
      console.error("❌ Нет package.json.");
      process.exit(1);
    }

    this.pkgData = JSON.parse(fs.readFileSync(this.pkgFile, "utf-8"));

    if (mode === "nuke") {
      this.nuke(targetPkg);
    } else {
      this.analyze();
    }
  }

  analyze() {
    console.log("💊 Начинаем детоксикацию зависимостей (V2 - Smart Mode)...\n");

    const deps = {
      ...this.pkgData.dependencies,
      ...this.pkgData.devDependencies,
    };
    const depNames = Object.keys(deps);

    // 1. Собираем весь код из SRC
    const fileContents = [];
    this.walk(this.srcDir, (f, content) => {
      fileContents.push(content);
      this.totalFiles++;
    });

    // 2. Собираем конфиги из корня (vite.config, tailwind.config и т.д.)
    const configContents = [];
    const configFiles = fs
      .readdirSync(this.rootDir)
      .filter(
        (f) => f.includes("config") || f.endsWith(".js") || f.endsWith(".ts")
      );
    configFiles.forEach((f) => {
      if (fs.statSync(path.join(this.rootDir, f)).isFile()) {
        configContents.push(
          fs.readFileSync(path.join(this.rootDir, f), "utf-8")
        );
      }
    });

    // 3. Собираем скрипты из package.json
    const scriptsContent = JSON.stringify(this.pkgData.scripts || {});

    console.log(
      `📂 Просканировано: ${this.totalFiles} файлов кода + конфиги + скрипты.`
    );
    console.log(`📦 Проверка ${depNames.length} пакетов...`);
    console.log("-".repeat(85));
    console.log(`| %-30s | %-10s | %-35s |`, "Package", "Usages", "Verdict");
    console.log("-".repeat(85));

    depNames.sort().forEach((dep) => {
      // Регулярка для импорта
      const regex = new RegExp(
        `(?:from|require\\()\\s*['"]${dep}(?:/.*)?['"]`,
        "g"
      );
      // Регулярка для простого упоминания (для конфигов и скриптов)
      const simpleRegex = new RegExp(`${dep}`, "g");

      let usages = 0;
      let configUsages = 0;
      let scriptUsages = 0;

      // Ищем в коде
      fileContents.forEach((c) => {
        if (c.match(regex)) usages++;
      });

      // Ищем в конфигах (просто по имени)
      configContents.forEach((c) => {
        if (c.match(simpleRegex)) configUsages++;
      });

      // Ищем в скриптах npm
      if (scriptsContent.match(simpleRegex)) scriptUsages++;

      this.printVerdict(dep, usages, configUsages, scriptUsages);
    });
    console.log("-".repeat(85));
  }

  printVerdict(dep, usages, configUsages, scriptUsages) {
    let verdict = "✅ OK";
    let color = "\x1b[32m"; // Green
    const totalRefs = usages + configUsages + scriptUsages;

    // Логика оправдания
    const isSafeTool = SAFE_BUILD_TOOLS.some((t) => dep.includes(t));
    const isSingleton = SINGLETON_PATTERNS.some((p) => dep.startsWith(p));
    const isSystem =
      dep.startsWith("@types") || dep.startsWith("eslint-plugin");

    if (totalRefs === 0) {
      if (isSafeTool || isSystem) {
        verdict = "🛡️  TOOL/SYS (Скрытое исп.)";
        color = "\x1b[36m"; // Cyan
      } else {
        verdict = "👻 GHOST (Удаляй!)";
        color = "\x1b[31m"; // Red
      }
    } else if (usages === 1) {
      if (isSingleton) {
        verdict = "💎 WRAPPER/SINGLETON (Ок)";
        color = "\x1b[32m";
      } else if (configUsages > 0 || scriptUsages > 0) {
        verdict = "⚙️  CONFIGURED";
        color = "\x1b[32m";
      } else {
        verdict = "⚠️ LAZY (1 usage)";
        color = "\x1b[33m"; // Yellow
      }
    } else if (usages < 3 && !isSystem && !isSafeTool && !isSingleton) {
      verdict = "⚠️ LOW USAGE";
      color = "\x1b[33m";
    }

    if (SHAME_LIST[dep] && totalRefs > 0) {
      verdict = `💩 SHAME: ${SHAME_LIST[dep]}`;
      color = "\x1b[35m"; // Magenta
    }

    // Форматирование
    const usageStr = `${usages} (src) / ${configUsages + scriptUsages} (cfg)`;
    console.log(`${color}| %-30s | %-10s | %s\x1b[0m`, dep, usageStr, verdict);
  }

  nuke(targetPkg) {
    if (!targetPkg) {
      console.error(
        "❌ Укажи пакет: node scripts/dependency_detox.cjs --nuke <pkg>"
      );
      process.exit(1);
    }
    console.log(`\n🧨 РЕЖИМ ХАОСА: Удаляем ${targetPkg}...`);
    try {
      execSync(`npm uninstall ${targetPkg}`, { stdio: "inherit" });
      console.log(`🏗️  Проверка типов (быстрее, чем билд)...`);
      // Используем tsc --noEmit для скорости, вместо full build
      execSync("npx tsc --noEmit", { stdio: "inherit" });
      console.log(`\n🤯 ПРОЕКТ ЖИВ! ${targetPkg} был бесполезен.`);
    } catch (error) {
      console.log(`\n💥 ОШИБКА. Зависимость нужна.`);
      console.log(`🚑 Rollback...`);
      execSync(`npm install ${targetPkg}`, { stdio: "inherit" });
    }
  }

  walk(dir, callback) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        this.walk(filePath, callback);
      } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
        callback(filePath, fs.readFileSync(filePath, "utf-8"));
      }
    }
  }
}

const args = process.argv.slice(2);
const mode = args.includes("--nuke") ? "nuke" : "scan";
const pkgName = args[args.indexOf("--nuke") + 1];

new DependencyDetox(process.cwd()).run(mode, pkgName);
