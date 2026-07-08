import { spawn } from "node:child_process";
import path from "node:path";

const isWindows = process.platform === "win32";
const viteBin = path.resolve(
  process.cwd(),
  "node_modules",
  ".bin",
  isWindows ? "vite.cmd" : "vite",
);

function run(label, command, args) {
  const child = spawn(command, args, {
    stdio: ["ignore", "pipe", "pipe"],
    shell: false,
    env: { ...process.env, FORCE_COLOR: "1" },
  });

  child.stdout.on("data", (chunk) => {
    process.stdout.write(`[${label}] ${chunk}`);
  });
  child.stderr.on("data", (chunk) => {
    process.stderr.write(`[${label}] ${chunk}`);
  });
  child.on("exit", (code) => {
    if (code && !shuttingDown) {
      console.error(`[${label}] exited with code ${code}`);
      shutdown(code);
    }
  });
  return child;
}

let shuttingDown = false;
const children = [
  run("api", "node", ["server/index.mjs"]),
  run("web", viteBin, ["--host", "0.0.0.0"]),
];

function shutdown(code = 0) {
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
