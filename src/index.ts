// Import stylesheets
import BaseViewer from "./BaseViewer";
import GeometryLoader from "./Loader";
import Viewer from "./Viewer";
import Viewer2 from "./Viewer2";

// Write TypeScript code!
const appDiv: HTMLElement = document.getElementById("app");
let viewer: Viewer | Viewer2 = new Viewer();

const clickListeners = {
  "switch-view": () => {
    const isViewer = viewer instanceof Viewer;
    viewer.dispose();
    if (isViewer) {
      viewer = new Viewer2();
    } else {
      viewer = new Viewer();
    }
  },
  "load-stl": async () => {
    const geometry = await GeometryLoader.selectFromFile();
    const isViewer = viewer instanceof Viewer;
    if (isViewer) {
      viewer.replaceGeometry(geometry);
    }
  },
  "upside-down": () => {
    const isViewer = viewer instanceof BaseViewer;
    if (isViewer) {
      viewer.transform(Math.PI / 2);
    }
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
