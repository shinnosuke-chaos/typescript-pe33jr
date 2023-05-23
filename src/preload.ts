import { contextBridge } from "electron";
import * as SCJB from "./node-api";

window.addEventListener("DOMContentLoaded", () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const type of ["chrome", "node", "electron"]) {
    replaceText(`${type}-version`, process.versions[type]);
    console.log(`${type}-version`, process.versions[type]);
  }

  contextBridge.exposeInIsolatedWorld(0, "scjb", SCJB);

  console.debug("preload loaded");
});
