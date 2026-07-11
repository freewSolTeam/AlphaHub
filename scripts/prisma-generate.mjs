/**
 * Run `prisma generate` with a clear error when the dev server locks the engine (Windows EPERM).
 */
import { execSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { platform } from "node:os";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function listProjectDevPids() {
  if (platform() !== "win32") return [];

  const ps = spawnSync(
    "powershell",
    [
      "-NoProfile",
      "-Command",
      "Get-CimInstance Win32_Process -Filter \"name='node.exe'\" | Where-Object { $_.CommandLine -match 'next dev|start-server\\.js' -and $_.CommandLine -match [regex]::Escape('Alphahub') } | Select-Object -ExpandProperty ProcessId",
    ],
    { encoding: "utf8", cwd: root },
  );

  if (ps.status !== 0 || !ps.stdout?.trim()) return [];
  return ps.stdout
    .trim()
    .split(/\r?\n/)
    .map((line) => Number(line.trim()))
    .filter((pid) => Number.isFinite(pid) && pid > 0);
}

function devRunningHelp(pids) {
  const pidList = pids.length ? ` (PID: ${pids.join(", ")})` : "";
  console.error(`
Cannot run prisma generate while the dev server is running${pidList}.

The Prisma engine DLL is locked on Windows when \`npm run dev\` is active.

Fix:
  1. Stop \`npm run dev\` in every terminal (Ctrl+C).
  2. Wait 3–5 seconds.
  3. Run: npm run db:generate

Or use: npm run db:regen   (force-deletes client, then generates — still needs dev stopped)
`);
}

function epermHelp() {
  if (platform() !== "win32") {
    console.error(
      "\nEPERM: another process is using the Prisma engine. Stop `next dev`, then retry.\n",
    );
    return;
  }
  console.error(`
EPERM (Windows) — the engine file is locked, usually by \`npm run dev\`:

  1. Stop \`npm run dev\` in every terminal (Ctrl+C).
  2. Wait 3–5 seconds, then run: npm run db:generate
  3. If it still fails: Task Manager → end Node tasks for this project, then retry.
`);
}

const devPids = listProjectDevPids();
if (devPids.length > 0) {
  devRunningHelp(devPids);
  process.exit(1);
}

try {
  execSync("npx prisma generate", {
    stdio: "inherit",
    cwd: root,
    env: process.env,
    shell: true,
  });
} catch {
  if (platform() === "win32") {
    const engine = join(
      root,
      "node_modules",
      ".prisma",
      "client",
      "query_engine-windows.dll.node",
    );
    if (existsSync(engine)) epermHelp();
  }
  process.exit(1);
}
