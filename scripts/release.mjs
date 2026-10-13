/**
 * Release via PR + tag on merge commit (no direct version push to master).
 *
 * Usage:
 *   node scripts/release.mjs <patch|minor|major> [--dry-run]
 *   npm run release:patch -- --dry-run
 *
 * Dry-run: creates release/<version> branch + PR, does not create/push a tag.
 * Cleanup after dry-run:
 *   gh pr close <n> --delete-branch
 *   git checkout master && git fetch origin && git reset --hard origin/master
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertTagMatchesPackageVersion,
  parseReleaseArgs,
  stripVersionPrefix,
} from "./release-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MASTER = "master";
const POLL_INTERVAL_MS = 5_000;
const POLL_TIMEOUT_MS = 45 * 60 * 1000;

/**
 * @param {string} message
 * @returns {never}
 */
function fail(message) {
  console.error(`release: ${message}`);
  process.exit(1);
}

/**
 * @param {string} command
 * @param {string[]} args
 * @param {{ allowFail?: boolean, input?: string }} [opts]
 */
function run(command, args, opts = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    shell: true,
    env: process.env,
    input: opts.input,
    maxBuffer: 16 * 1024 * 1024,
  });
  const stdout = (result.stdout ?? "").trim();
  const stderr = (result.stderr ?? "").trim();
  if (result.status !== 0) {
    if (opts.allowFail) {
      return { ok: false, stdout, stderr, status: result.status ?? 1 };
    }
    const detail = [stderr, stdout].filter(Boolean).join("\n");
    fail(
      `${command} ${args.join(" ")} failed (exit ${result.status ?? "?"})${detail ? `\n${detail}` : ""}`,
    );
  }
  return { ok: true, stdout, stderr, status: 0 };
}

function sleep(ms) {
  const lock = new Int32Array(new SharedArrayBuffer(4));
  Atomics.wait(lock, 0, 0, ms);
}

function gitStdout(args) {
  return run("git", args).stdout;
}

function assertPreconditions() {
  const branch = gitStdout(["rev-parse", "--abbrev-ref", "HEAD"]);
  if (branch !== MASTER) {
    fail(`must be on ${MASTER} (currently on ${branch})`);
  }

  const dirty = gitStdout(["status", "--porcelain"]);
  if (dirty) {
    fail("worktree is not clean; commit or stash changes first");
  }

  run("git", ["fetch", "origin", MASTER]);
  const head = gitStdout(["rev-parse", "HEAD"]);
  const origin = gitStdout(["rev-parse", `origin/${MASTER}`]);
  if (head !== origin) {
    fail(
      `${MASTER} (${head.slice(0, 7)}) != origin/${MASTER} (${origin.slice(0, 7)}); pull/rebase first`,
    );
  }
}

/**
 * @param {string} bump
 * @returns {string} semver without leading v
 */
function bumpVersion(bump) {
  const before = JSON.parse(
    readFileSync(path.join(ROOT, "package.json"), "utf8"),
  ).version;
  const printed = run("npm", [
    "version",
    bump,
    "--no-git-tag-version",
  ]).stdout;
  const version = stripVersionPrefix(printed || "");
  const after = JSON.parse(
    readFileSync(path.join(ROOT, "package.json"), "utf8"),
  ).version;
  if (!version || version !== after) {
    fail(
      `npm version did not produce a consistent bump (before=${before}, printed=${printed}, after=${after})`,
    );
  }
  return after;
}

function restorePackageFilesFromHead() {
  run("git", ["checkout", "HEAD", "--", "package.json", "package-lock.json"], {
    allowFail: true,
  });
}

/**
 * @param {string} version
 * @param {boolean} dryRun
 * @returns {number} PR number
 */
function createReleasePr(version, dryRun) {
  const title = version;
  const body = [
    `## Summary`,
    `- Version bump to **${version}** via \`release:*\` PR flow.`,
    dryRun
      ? `- **Dry-run:** do not merge; close this PR and delete the branch.`
      : `- After merge, the release script tags \`v${version}\` on the merge commit.`,
    ``,
    `## Test plan`,
    `- [ ] Confirm \`package.json\` / \`package-lock.json\` version is ${version}`,
    `- [ ] Local pre-push already ran on the release branch push`,
  ].join("\n");

  const bodyDir = mkdtempSync(path.join(tmpdir(), "ruledesk-release-pr-"));
  const bodyFile = path.join(bodyDir, "body.md");
  writeFileSync(bodyFile, body, "utf8");
  try {
    const created = run("gh", [
      "pr",
      "create",
      "--base",
      MASTER,
      "--head",
      `release/${version}`,
      "--title",
      title,
      "--body-file",
      bodyFile,
    ]);
    const url = created.stdout;
    const match = url.match(/\/pull\/(\d+)/);
    if (!match) {
      fail(`could not parse PR number from: ${url}`);
    }
    console.log(`release: opened PR ${url}`);
    return Number(match[1]);
  } finally {
    rmSync(bodyDir, { recursive: true, force: true });
  }
}

/**
 * @param {number} prNumber
 * @returns {string} merge commit SHA
 */
function waitForMerge(prNumber) {
  console.log(
    `release: attempting merge of PR #${prNumber} (or waiting until merged)…`,
  );
  run(
    "gh",
    ["pr", "merge", String(prNumber), "--merge", "--delete-branch=false"],
    { allowFail: true },
  );

  const started = Date.now();
  while (Date.now() - started < POLL_TIMEOUT_MS) {
    const json = run("gh", [
      "pr",
      "view",
      String(prNumber),
      "--json",
      "state,mergeCommit,url",
    ]).stdout;
    /** @type {{ state: string, mergeCommit: { oid: string } | null, url: string }} */
    const pr = JSON.parse(json);
    if (pr.state === "MERGED" && pr.mergeCommit?.oid) {
      console.log(
        `release: PR #${prNumber} merged at ${pr.mergeCommit.oid.slice(0, 7)}`,
      );
      return pr.mergeCommit.oid;
    }
    if (pr.state === "CLOSED") {
      fail(
        `PR #${prNumber} was closed without merge (${pr.url}); no tag created`,
      );
    }
    // Retry merge in case checks / mergeability became ready.
    run(
      "gh",
      ["pr", "merge", String(prNumber), "--merge", "--delete-branch=false"],
      { allowFail: true },
    );
    sleep(POLL_INTERVAL_MS);
  }
  fail(
    `timed out after ${POLL_TIMEOUT_MS / 1000}s waiting for PR #${prNumber} to merge; no tag created`,
  );
}

/**
 * @param {string} mergeSha
 * @param {string} version
 */
function tagMergeCommit(mergeSha, version) {
  run("git", ["fetch", "origin", MASTER, "--tags"]);

  const masterTip = gitStdout(["rev-parse", `origin/${MASTER}`]);
  const contained = run(
    "git",
    ["merge-base", "--is-ancestor", mergeSha, `origin/${MASTER}`],
    { allowFail: true },
  );
  if (!contained.ok) {
    fail(
      `merge commit ${mergeSha} is not on origin/${MASTER} (tip ${masterTip.slice(0, 7)}); no tag created`,
    );
  }

  const pkgJson = gitStdout(["show", `${mergeSha}:package.json`]);
  /** @type {{ version?: string }} */
  const pkg = JSON.parse(pkgJson);
  const tagName = `v${version}`;
  const match = assertTagMatchesPackageVersion({
    tagName,
    packageVersion: pkg.version ?? "",
  });
  if (!match.ok) {
    fail(`${match.error}; no tag created`);
  }

  const remoteTag = run("git", ["ls-remote", "--tags", "origin", tagName], {
    allowFail: true,
  });
  if (remoteTag.ok && remoteTag.stdout.includes(`refs/tags/${tagName}`)) {
    fail(`remote tag ${tagName} already exists; refusing to retag`);
  }

  const localTag = run("git", ["rev-parse", "-q", "--verify", `refs/tags/${tagName}`], {
    allowFail: true,
  });
  if (localTag.ok && localTag.stdout) {
    fail(`local tag ${tagName} already exists; delete it before releasing`);
  }

  run("git", ["tag", tagName, mergeSha]);
  const push = run("git", ["push", "origin", tagName], { allowFail: true });
  if (!push.ok) {
    run("git", ["tag", "-d", tagName], { allowFail: true });
    fail(
      `failed to push tag ${tagName}; local tag removed\n${push.stderr || push.stdout}`,
    );
  }
  console.log(
    `release: pushed ${tagName} → ${mergeSha.slice(0, 7)} (starts Release workflow)`,
  );
}

function resetLocalToOriginMaster() {
  run("git", ["checkout", MASTER]);
  run("git", ["reset", "--hard", `origin/${MASTER}`]);
}

function main() {
  const parsed = parseReleaseArgs(process.argv.slice(2));
  if ("error" in parsed) {
    fail(parsed.error);
  }
  const { bump, dryRun } = parsed;

  assertPreconditions();

  let version = "";
  try {
    version = bumpVersion(bump);
  } catch (err) {
    restorePackageFilesFromHead();
    throw err;
  }

  const branch = `release/${version}`;
  const existing = run("git", ["rev-parse", "-q", "--verify", branch], {
    allowFail: true,
  });
  if (existing.ok && existing.stdout) {
    restorePackageFilesFromHead();
    fail(`branch ${branch} already exists locally`);
  }

  const remoteBranch = run(
    "git",
    ["ls-remote", "--heads", "origin", branch],
    { allowFail: true },
  );
  if (remoteBranch.ok && remoteBranch.stdout.includes(`refs/heads/${branch}`)) {
    restorePackageFilesFromHead();
    fail(`branch ${branch} already exists on origin`);
  }

  run("git", ["checkout", "-b", branch]);
  run("git", ["add", "package.json", "package-lock.json"]);
  const staged = gitStdout(["diff", "--cached", "--name-only"]);
  if (!staged.includes("package.json")) {
    restorePackageFilesFromHead();
    run("git", ["checkout", MASTER], { allowFail: true });
    run("git", ["branch", "-D", branch], { allowFail: true });
    fail("version bump did not stage package.json");
  }
  run("git", ["commit", "-m", version]);

  const pushBranch = run("git", ["push", "-u", "origin", "HEAD"], {
    allowFail: true,
  });
  if (!pushBranch.ok) {
    console.error(pushBranch.stderr || pushBranch.stdout);
    fail(
      `failed to push ${branch}; fix pre-push / remote errors, then retry from a clean ${MASTER}`,
    );
  }

  let prNumber;
  try {
    prNumber = createReleasePr(version, dryRun);
  } catch (err) {
    fail(
      `PR create failed for ${branch}. Branch may still exist on origin — delete it if aborting. ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (dryRun) {
    console.log("");
    console.log("release: dry-run complete (no tag created or pushed).");
    console.log(`  PR: #${prNumber}`);
    console.log("  Cleanup:");
    console.log(`    gh pr close ${prNumber} --delete-branch`);
    console.log(
      `    git checkout ${MASTER} && git fetch origin && git reset --hard origin/${MASTER}`,
    );
    resetLocalToOriginMaster();
    return;
  }

  const mergeSha = waitForMerge(prNumber);
  tagMergeCommit(mergeSha, version);
  resetLocalToOriginMaster();
  console.log(`release: done — ${version} tagged and Release workflow should run.`);
}

try {
  main();
} catch (err) {
  fail(err instanceof Error ? err.message : String(err));
}
