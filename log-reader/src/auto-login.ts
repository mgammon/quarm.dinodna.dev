// import * as robotjs from "robotjs";
import { exec } from "child_process";
import { config } from "./config";
import path from "path";
import { rmSync, writeFileSync } from "fs";

export const autoLogin = async (didLogReaderJustLaunch: boolean) => {
  console.log("Auto-login running");
  // If Client1 is open but we just launched the log reader, don't re-open or re-login.
  const pid = await getEverquestPid();
  if (pid && didLogReaderJustLaunch) {
    return;
  }

  await runAutoLoginAutoHotKeyScript();
};

// Get the PID of the eqgame.exe running with the window title Client1
async function getEverquestPid(): Promise<number | null> {
  if (process.platform !== "win32") {
    return null;
  }
  return new Promise<any>((resolve, reject) => {
    exec('tasklist /FI "WINDOWTITLE eq Client1"', (err, result) => {
      if (err) {
        return reject(err);
      }
      const eqgamePids = result
        .split("\n")
        .map((line) => {
          const [name, pid, _sessionName, _sessionNumber, _memUsage] =
            line.split(/\s+/);
          return { name, pid };
        })
        .filter((task) => task.name === "eqgame.exe")
        .map((task) => parseInt(task.pid));
      resolve(eqgamePids[0] || null);
    });
  });
}

// Kill the PID.  Throw an error if it can't close it.
// async function killPid(pid: number): Promise<void> {
//   return new Promise<void>((resolve, reject) => {
//     exec(`taskkill /pid ${pid} /t`, (err, result) => {
//       if (err) {
//         reject(`ERROR: Couldn't kill PID ${pid} - ${err}`);
//       } else {
//         resolve();
//       }
//     });
//   });
// }

async function runAutoLoginAutoHotKeyScript() {
  const eqgamePath = path.resolve(path.join(config.eqDirectory, "eqgame.exe"));
  rmSync("dinodna-auto-login.ahk", { force: true });
  writeFileSync(
    "dinodna-auto-login.ahk",
    `
    #SingleInstance Force
    SetKeyDelay 100

    if WinExist("Client1")
        WinClose

    sleep, 3000

    Run %COMSPEC% /c explorer.exe /select\`, "${eqgamePath}"
    Sleep 5000
    send, {Enter}
    sleep, 10000
    send, {Tab}
    send, {Enter}
    sleep, 1000
    send, {Enter}
    sleep, 1000
    send, ${config.eqMulePassword}
    send, {Enter}
    sleep, 3000
    send, {Enter}
    sleep, 15000
    send, {Enter}

    ExitApp
    Return
  `
  );

  return new Promise<void>((resolve, reject) => {
    exec("dinodna-auto-login.ahk", (err, result) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}
