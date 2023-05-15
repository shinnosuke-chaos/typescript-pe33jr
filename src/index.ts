import GeometryLoader from "./GeometryLoader";
import CustomViewer from "./CustomViewer";
import CustomViewer2 from "./CustomViewer2";

customElements.define("custom-viewer", CustomViewer2);

// Write TypeScript code!
const appDiv: HTMLElement = document.getElementById("app");
const viewer: CustomViewer = document.querySelector("custom-viewer");

console.log(viewer);
const clickListeners = {
  "switch-view": () => {
    if (viewer.view === "top") {
      viewer.setAttribute("view", "front");
    } else {
      viewer.setAttribute("view", "top");
    }
  },
  "load-stl": async () => {
    const geometry = await GeometryLoader.selectFromFile();
    viewer.replaceGeometry(geometry);
  },
  "upside-down": () => {
    viewer.rotateAroundY(Math.PI / 2);
  },
};

// find specific target with dataset and is button
appDiv.onclick = (event) => {
  const target = event.target as HTMLElement;
  if (
    target.tagName === "BUTTON" &&
    target.dataset.action &&
    clickListeners[target.dataset.action]
  ) {
    clickListeners[target.dataset.action]();
  }
};
