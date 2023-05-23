import { join, isAbsolute } from "path";
import { spawn } from "child_process";

const workerPath = join(__dirname, "../intersection2/venv/Scripts/python.exe");
const scriptPath = join(__dirname, "../intersection2/intersection.py");

export function intersect(
  part0: string,
  part1: string,
  part1_result: string,
  part2: string,
  part2_result: string
): Promise<string[]> {
  spawn(workerPath);
  console.log(arguments);
  if (
    arguments.length !== 5 &&
    Array.from(arguments).some((arg) => !isAbsolute(arg))
  ) {
    return;
  }
  return new Promise((resolve, reject) => {
    const worker = spawn(workerPath, [scriptPath, ...Array.from(arguments)]);
    worker.stdout.on("data", (data) => {
      console.log("[intersect worker] stdout: " + data.toString());
    });
    worker.stderr.on("data", (data) => {
      console.error("[intersect worker] stderr: " + data.toString());
    });
    worker.on("close", (code) => {
      console.log("[intersect worker] exited with code " + code);
      if (code === 0) {
        resolve([part1_result, part2_result]);
      } else {
        reject();
      }
    });
  });
}
