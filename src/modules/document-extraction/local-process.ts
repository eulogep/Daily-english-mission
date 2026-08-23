import { spawn } from "node:child_process";
import { resolve, sep } from "node:path";

export type LocalProcessResult = { stdout: string; stderr: string; durationMs: number };
export type LocalProcessOptions = { cwd: string; timeoutMs: number; maxOutputBytes?: number; env?: NodeJS.ProcessEnv };

export function pathIsWithinRoots(candidate: string, allowedRoots: string[]) {
  const target = resolve(candidate).toLocaleLowerCase();
  return allowedRoots.some((root) => {
    const base = resolve(root).toLocaleLowerCase();
    return target === base || target.startsWith(`${base}${sep}`);
  });
}

export function runBoundedLocalProcess(executable: string, args: string[], options: LocalProcessOptions): Promise<LocalProcessResult> {
  const maxOutputBytes = options.maxOutputBytes ?? 8 * 1024 * 1024;
  return new Promise((resolvePromise, reject) => {
    const startedAt = Date.now();
    const child = spawn(executable, args, {
      cwd: options.cwd,
      shell: false,
      windowsHide: true,
      env: { ...process.env, HF_HUB_OFFLINE: "1", TRANSFORMERS_OFFLINE: "1", ...options.env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    let outputBytes = 0;
    let settled = false;
    const finish = (error?: Error, result?: LocalProcessResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error); else resolvePromise(result!);
    };
    const collect = (bucket: Buffer[]) => (chunk: Buffer) => {
      outputBytes += chunk.length;
      if (outputBytes > maxOutputBytes) {
        child.kill();
        finish(new Error("LOCAL_PROCESS_OUTPUT_LIMIT_EXCEEDED"));
        return;
      }
      bucket.push(chunk);
    };
    child.stdout.on("data", collect(stdout));
    child.stderr.on("data", collect(stderr));
    child.once("error", (error) => finish(error));
    child.once("close", (code) => {
      const result = { stdout: Buffer.concat(stdout).toString("utf8"), stderr: Buffer.concat(stderr).toString("utf8"), durationMs: Date.now() - startedAt };
      finish(code === 0 ? undefined : new Error(`LOCAL_PROCESS_EXIT_${code}: ${result.stderr.slice(-1200)}`), result);
    });
    const timer = setTimeout(() => {
      child.kill();
      finish(new Error("LOCAL_PROCESS_TIMEOUT"));
    }, options.timeoutMs);
  });
}
