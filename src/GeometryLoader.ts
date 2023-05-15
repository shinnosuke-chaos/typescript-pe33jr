import { BoxGeometry, BufferGeometry, ShapeGeometry, ShapePath } from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader";

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

  static createBoxGeometry(sideLength: number = 2) {
    const geometry = new BoxGeometry(sideLength, sideLength, sideLength);
    return geometry;
  }

  static readSVGToGeometry(): Promise<ShapeGeometry[]> {
    const loader = new SVGLoader();
    return new Promise((resolve, reject) =>
      loader.load(
        "teeth.svg",
        (data) => {
          resolve(
            data.paths
              .map((path) =>
                SVGLoader.createShapes(path).map(
                  (shape) => new ShapeGeometry(shape)
                )
              )
              .flat()
          );
        },
        (event) => console.log(event),
        reject
      )
    );
  }
}
