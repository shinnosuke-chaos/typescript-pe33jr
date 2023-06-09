import {
  BoxGeometry,
  BufferGeometry,
  CatmullRomCurve3,
  ExtrudeGeometry,
  Shape,
  ShapeGeometry,
  ShapePath,
  Vector3,
} from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader";
import { ExtrudePoint } from "./Types";

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
        (event) => {
          /* console.log(event) */
        },
        reject
      )
    );
  }

  // create a plane with tooth shape hole in it
  static planeWithToothShapes(w = 1, h = 1): ShapeGeometry {
    // create the outer shape, is a rect
    const outerShape = new Shape();
    outerShape.moveTo(-w, -h);
    outerShape.lineTo(w, -h);
    outerShape.lineTo(w, h);
    outerShape.lineTo(-w, h);
    outerShape.lineTo(-w, -h);

    // create the inner shape, is a half circle
    const innerShape = new Shape();
    innerShape.moveTo((-w * 3) / 4, (-h * 3) / 4);
    innerShape.lineTo(-w / 4, (-h * 3) / 4);
    // innerShape.lineTo(-w / 4, h / 4);
    innerShape.lineTo(-w / 4, 0);

    innerShape.arc(w / 4, 0, w / 4, Math.PI, 0, true);

    // innerShape.lineTo(w / 4, h / 4);

    innerShape.lineTo(w / 4, (-h * 3) / 4);
    innerShape.lineTo((w * 3) / 4, (-h * 3) / 4);
    // innerShape.lineTo((w * 3) / 4, (h * 3) / 4);
    innerShape.lineTo((w * 3) / 4, 0);
    innerShape.arc(-(w * 3) / 4, 0, (w * 3) / 4, 0, Math.PI, false);

    innerShape.lineTo((-w * 3) / 4, (h * 3) / 4);
    innerShape.lineTo((-w * 3) / 4, (-h * 3) / 4);
    // add the inner shape hole
    outerShape.holes.push(innerShape);
    return new ShapeGeometry(outerShape);
  }

  // extrude geometry with points
  static extrudeGeometryWithPoints(points: Vector3[]): ExtrudeGeometry {
    return new ExtrudeGeometry(GeometryLoader.createHouseShape(), {
      steps: 2,
      depth: 16,
      bevelEnabled: true,
      bevelThickness: 1,
      bevelSize: 1,
      bevelOffset: 0,
      bevelSegments: 1,
      extrudePath: new CatmullRomCurve3(points, false, "catmullrom", 0.5),
    });
  }

  static createHouseShape(len = 1) {
    var shape = new Shape();
    shape.moveTo(0, 0);
    shape.absarc(0, len, len, Math.PI * 0.5, Math.PI * 1.5, false);
    shape.lineTo(len, 0);
    shape.lineTo(len, len * 2);

    return shape;
  }
}
