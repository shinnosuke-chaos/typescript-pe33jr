import { join } from "path";
import { tmpdir } from "os";

export function tmpFilePath(): string[] {
  const random = Math.random().toString().substr(2);
  return Array(5)
    .fill(0)
    .map((_, idx) => join(tmpdir(), `scjb_${random}_${idx}.stl`));
}
