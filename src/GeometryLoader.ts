import { BufferAttribute, BufferGeometry } from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";

export default class GeometryLoader {
  static selectFromFile(): Promise<BufferGeometry> {
    // select file from local
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".stl";
    return new Promise((resolve, reject) => {
      input.onchange = (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;
        GeometryLoader.readFileToGeometry(file).then(resolve).catch(reject);
      };
      input.click();
    });
  }
  static async readFileToGeometry(file: File): Promise<BufferGeometry> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const loader = new STLLoader();
        const geometry = loader.parse(reader.result as ArrayBuffer);
        geometry.center();
        geometry.computeBoundingBox();
        resolve(geometry);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  static createBoxBufferGeometry() {
    const geometry = new BufferGeometry();
    // Create the vertices for the box.
    const vertices = new Float32Array([
      -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1, -1, -1, 1, 1, -1, 1, 1, 1, 1,
      -1, 1, 1,
    ]);
    // Create the indices for the box.
    const indices = new Float32Array([
      0, 1, 3, 2, 2, 3, 7, 6, 6, 7, 5, 4, 4, 5, 1, 0, 0, 2, 6, 4, 1, 5, 7, 3,
    ]);
    // Set the position attribute of the buffer geometry.
    geometry.setAttribute("position", new BufferAttribute(vertices, 3));
    // Set the index attribute of the buffer geometry.
    geometry.setAttribute("index", new BufferAttribute(indices, 1));
    return geometry;
  }
}
