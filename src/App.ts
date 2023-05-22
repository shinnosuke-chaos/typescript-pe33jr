import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import CustomViewer from "./CustomViewer";
import GeometryLoader from "./GeometryLoader";
import { State } from "./Types";
import { Matrix4 } from "three";

export class App extends HTMLElement {
  state: State = {};
  constructor() {
    super();
    this.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      if (
        target.tagName === "BUTTON" &&
        target.dataset.action &&
        this.clickListeners[target.dataset.action]
      ) {
        this.clickListeners[target.dataset.action]();
      }
    });
  }
  connectedCallback() {
    this.viewer.addEventListener("update", () => {
      this.persistState();
    });
    this.restoreState();
  }
  clickListeners = {
    "switch-view": () => {
      if (this.viewer.view === "top") {
        this.state.stage = "stage-1";
        this.viewer.setAttribute("view", "front");
      } else {
        this.state.stage = "stage-2";
        this.viewer.setAttribute("view", "top");
      }
      this.persistState();
    },
    "load-stl": async () => {
      const geometry = await GeometryLoader.selectFromFile();
      this.viewer.replaceMeshGeometry(geometry);
    },
    "upside-down": () => {
      this.viewer.rotateAroundAxis(Math.PI);
    },
    "switch-extrude": () => {
      this.viewer.switchExtrudeGeometry();
    },
  };
  get viewer(): CustomViewer {
    return this.querySelector("custom-viewer");
  }
  persistState() {
    if (this.viewer.model.geometry.userData.filePath) {
      this.state.modelFile = this.viewer.model.geometry.userData.filePath;
      this.state.modelMatrix = this.viewer.model.matrix.toArray();
    }
    localStorage.setItem("__persist_state__", JSON.stringify(this.state));
  }
  async restoreState() {
    const json = localStorage.getItem("__persist_state__");
    const state = JSON.parse(json);
    if (state?.modelFile) {
      this.state = state;
      const stlLoader = new STLLoader();
      const geometry = await stlLoader.loadAsync(this.state.modelFile);
      geometry.center();
      geometry.computeBoundingBox();
      geometry.userData.filePath = this.state.modelFile;
      this.viewer.replaceMeshGeometry(
        geometry,
        new Matrix4().fromArray(this.state.modelMatrix)
      );
      switch (this.state.stage) {
        case "stage-1":
          this.viewer.setAttribute("view", "front");
          break;
        case "stage-2":
          this.viewer.setAttribute("view", "top");
          break;
      }
    }
  }
}
