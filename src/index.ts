import GeometryLoader from "./GeometryLoader";
import CustomViewer from "./CustomViewer";
import { App } from "./App";
// import CustomViewer2 from "./CustomViewer2";

customElements.define("custom-viewer", CustomViewer);
customElements.define("my-app", App);

// Write TypeScript code!
const viewer: CustomViewer = document.querySelector("custom-viewer");
const app: App = document.querySelector("my-app");

globalThis.app = app;
globalThis.viewer = viewer;
