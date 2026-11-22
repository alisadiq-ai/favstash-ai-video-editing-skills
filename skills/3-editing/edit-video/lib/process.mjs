import { spawn, spawnSync } from "node:child_process";

// On Windows, npm/npx/etc. resolve to a .cmd shim, which spawn/spawnSync cannot exec directly
// without a shell; .exe tools (ffmpeg, yt-dlp, python3...) run the same either way. But the
// Windows shell (cmd.exe) tokenizes the command line on spaces, and Node does not quote the
// `command` string for you the way it quotes `args`, so a command path like an installed
// binary under a space-containing workspace path must be quoted here before use.
const useShell = process.platform === "win32";
const shellSafe = (command) => (useShell && /\s/.test(command) ? `"${command}"` : command);

export function commandStatus(command, args = ["--version"], options = {}) {
  const result = spawnSync(shellSafe(command), args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: options.timeout ?? 10_000,
    shell: useShell,
  });
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim();
  return {
    available: result.status === 0,
    version: output.split(/\r?\n/).find(Boolean) ?? null,
    error: result.error?.message ?? (result.status === 0 ? null : output || `exit ${result.status}`),
  };
}

export function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(shellSafe(command), args, {
      cwd: options.cwd,
      env: options.env ?? process.env,
      stdio: options.stdio ?? "inherit",
      shell: useShell,
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} failed${signal ? ` with signal ${signal}` : ` with exit code ${code}`}`));
    });
  });
}

export function runCapture(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(shellSafe(command), args, {
      cwd: options.cwd,
      env: options.env ?? process.env,
      stdio: ["ignore", "pipe", "pipe"],
      shell: useShell,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`${command} exited ${code}: ${stderr.trim()}`));
    });
  });
}
