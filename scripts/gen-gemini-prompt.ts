import * as fs from "fs";
import * as path from "path";

const AI_DIR = ".ai";
const CONTEXT_FILE = path.join(AI_DIR, "CONTEXT.md");
const RULES_FILE = path.join(AI_DIR, "RULES.md"); // 👈 Новый файл
const TREE_FILE = path.join(AI_DIR, "tree.txt");
const OUTPUT_FILE = path.join(AI_DIR, "GEMINI_PROMPT.txt");

if (!fs.existsSync(TREE_FILE)) {
  console.error(
    '❌ Error: Tree file not found. Run "npm run ctx:update" first.'
  );
  process.exit(1);
}

const context = fs.existsSync(CONTEXT_FILE)
  ? fs.readFileSync(CONTEXT_FILE, "utf-8")
  : "# No context file found.";

const rules = fs.existsSync(RULES_FILE)
  ? fs.readFileSync(RULES_FILE, "utf-8")
  : "";

const tree = fs.readFileSync(TREE_FILE, "utf-8");

const prompt = `
=== CRITICAL INSTRUCTIONS (USER RULES) ===
${rules ? rules : "No specific user rules defined."}

=== SYSTEM CONTEXT ===
You are an AI Architect assisting with the "RuleDesk" project.
Here is the Master Context and File Structure. 
MEMORIZE THIS immediately.

${context}

=== PROJECT STRUCTURE (Latest) ===
${tree}

=== INSTRUCTION ===
Await my next command.
`;

fs.writeFileSync(OUTPUT_FILE, prompt);
console.log(`✅ Ready! Content saved to "${OUTPUT_FILE}"`);
