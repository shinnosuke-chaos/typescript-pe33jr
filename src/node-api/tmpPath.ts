import { join, dirname, basename, extname, isAbsolute } from "path";
import { tmpdir } from "os";

export function tmpFilePath(): string[] {
  const random = Math.random().toString().substr(2);
  return Array(3)
    .fill(0)
    .map((_, idx) => join(tmpdir(), `scjb_${random}_${idx}.stl`));
}
export function resultFilePath(modelPath: string): string[] {
  if (!modelPath || !isAbsolute(modelPath)) {
    throw new Error("modelPath must be absolute");
  }
  const dir = dirname(modelPath);
  const ext = extname(modelPath);
  const base = basename(modelPath, ext);
  return Array(2)
    .fill(0)
    .map((_, idx) => join(dir, `${base}_scjb_${idx + 1}${ext}`));
}
