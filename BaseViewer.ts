import {
  AxesHelper,
  Box3,
  BufferGeometry,
  Color,
  Matrix4,
  Mesh,
  MeshNormalMaterial,
  Object3D,
  OrthographicCamera,
  Plane,
  PlaneHelper,
  Quaternion,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import { TransformControls } from "three/examples/jsm/controls/TransformControls";
import GeometryLoader from "./src/GeometryLoader";

export type ViewerOptions = Partial<{
  camera: {
    position: Vector3;
    up: Vector3;
    lookAt: Vector3;
  };
}>;

export const defaultViewerOptions: ViewerOptions = {
  camera: {
    position: new Vector3(8, 0, 0),
    up: new Vector3(0, 0, 1),
    lookAt: new Vector3(),
  },
};

export default class BaseViewer {
  view: "top" | "front" = "front";
  theta = 0;
  scene = new Scene();
  camera = new OrthographicCamera(
    window.innerWidth / -2000,
    window.innerWidth / 2000,
    window.innerHeight / 2000,
    window.innerHeight / -2000,
    1,
    1000
  );
  renderer = new WebGLRenderer();
  control: TransformControls = new TransformControls(
    this.camera,
    this.renderer.domElement
  );
  geometry = GeometryLoader.createBoxBufferGeometry();
  // geometry = new BoxGeometry(0.2, 0.2, 0.2);
  material = new MeshNormalMaterial();
  container = new Object3D();
  mesh = new Mesh(this.geometry, this.material);
  axisHelper = new AxesHelper(5);
  timer;
  plane = new PlaneHelper(new Plane(new Vector3(0, 0, 1), 0), 1, 0xffff00);
  constructor(private readonly options?: ViewerOptions) {
    this.scene.background = new Color(0xf0f0f0);
    // front view
    this.camera.position.copy(
      this.options?.camera?.position || defaultViewerOptions.camera.position
    );
    this.camera.up = new Vector3().copy(
      this.options?.camera?.up || defaultViewerOptions.camera.up
    );
    this.camera.lookAt(
      new Vector3().copy(
        this.options?.camera?.lookAt || defaultViewerOptions.camera.lookAt
      )
    );
    this.container.add(this.mesh);
    this.scene.add(
      this.camera,
      this.container,
      this.axisHelper,
      this.control,
      this.control,
      this.plane
    );
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setAnimationLoop(this.animate.bind(this));
    document.body.appendChild(this.renderer.domElement);
    window.addEventListener("resize", this.resizeListener, false);
    this.animate2();
  }
  replaceGeometry(geometry: BufferGeometry) {
    if (geometry) {
      this.mesh.geometry.dispose();
      this.mesh.geometry = geometry;
    }
    this.fitContainerToCamera();
  }
  fitContainerToCamera() {
    console.debug(this.camera.left);

    const { max, min } = new Box3().setFromObject(this.container);
    const maxRange = Math.max(max.x - min.x, max.y - min.y, max.z - min.z);
    this.camera.left = -maxRange * 2;
    this.camera.right = maxRange * 2;
    this.camera.top = maxRange * 2;
    this.camera.bottom = -maxRange * 2;
    if (this.view === "top") {
      this.camera.position.setZ(maxRange);
    }
    if (this.view === "front") {
      this.camera.position.setX(maxRange);
    }
    this.camera.updateProjectionMatrix();
  }
  dispose() {
    this.scene.traverse((child) => {
      if (child instanceof Mesh) {
        child.geometry.dispose();
        child.material.dispose();
      }
    });

    this.scene.children = [];
    this.scene = null;
    document.body.removeChild(this.renderer.domElement);
    window.removeEventListener("resize", this.resizeListener);
    document.removeEventListener("wheel", this.onwheelListener);
    this.renderer.domElement;
    this.renderer.dispose();
    this.renderer = null;
  }
  onkeydownListener = (event) => {
    let d = 0.1;
    let x = 0,
      y = 0,
      z = 0;
    switch (event.key) {
      case "w":
        y = d;
        break;
      case "a":
        x = -d;
        break;
      case "s":
        y = -d;
        break;
      case "d":
        x = d;
        break;
    }
    this.container.applyMatrix4(new Matrix4().makeTranslation(x, y, z));
  };
  // wheel event with shift and alt key
  onwheelListener = (event) => {
    let dY = event.deltaY;
    if (event.shiftKey) {
      dY /= 10;
    }
    if (event.altKey) {
      this.transform(dY / 500);
      this.animate2();
    } else {
      this.theta += dY / 500;
      this.theta %= Math.PI * 2;
      this.container.rotation.z = this.theta;
    }
  };
  resizeListener = () => {
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };
  transform(dy = 0) {
    clearTimeout(this.timer);
    const v = new Vector3(0, 1, 0);
    v.applyAxisAngle(new Vector3(0, 0, 1), -this.theta);
    const q1 = new Quaternion().setFromAxisAngle(v, dy);
    this.mesh.applyQuaternion(q1);
  }
  updateZ() {
    const box = new Box3().setFromObject(this.mesh);
    const center = box.getCenter(new Vector3());
    this.mesh.applyMatrix4(
      new Matrix4().makeTranslation(-center.x, -center.y, -box.min.z)
    );
  }
  animate2(time = 0) {
    clearTimeout(this.timer);
    this.timer = setTimeout(this.updateZ.bind(this), 1000);
  }
  animate(time = 0) {
    this.renderer.render(this.scene, this.camera);
  }
}
