import { promises } from "fs";
// save file use node fs
export function writeContentFile(content, filePath): Promise<void> {
  return promises.writeFile(filePath, content);
}
// save file use node fs
export function unlinkContentFile(filePath): Promise<void> {
  return promises.unlink(filePath);
}
