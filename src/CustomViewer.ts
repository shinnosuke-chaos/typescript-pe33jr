import {
  Scene,
  OrthographicCamera,
  WebGLRenderer,
  MeshNormalMaterial,
  Object3D,
  Mesh,
  AxesHelper,
  PlaneHelper,
  Plane,
  Vector3,
  Color,
  Box3,
  Matrix4,
  Quaternion,
  BufferGeometry,
  BoxGeometry,
} from "three";
import { TransformControls } from "three/examples/jsm/controls/TransformControls";
import GeometryLoader from "./GeometryLoader";

export default class CustomViewer extends HTMLElement {
  view: "top" | "front" = "front";
  theta = 0;
  scene = new Scene();
  camera = new OrthographicCamera(
    -innerWidth / 200,
    innerWidth / 200,
    innerHeight / 200,
    -innerHeight / 200,
    1,
    1000
  );
  renderer = new WebGLRenderer();
  control: TransformControls = new TransformControls(
    this.camera,
    this.renderer.domElement
  );
  // geometry = GeometryLoader.createBoxBufferGeometry();
  geometry = new BoxGeometry(2, 2, 2);
  material = new MeshNormalMaterial();
  container = new Object3D();
  mesh = new Mesh(this.geometry, this.material);
  axisHelper = new AxesHelper(5);
  timer;
  plane = new PlaneHelper(new Plane(new Vector3(0, 0, 1), 0), 1, 0xffff00);

  constructor() {
    super();
    console.log("construct");
    this.scene.background = new Color(0xf0f0f0);
    if (this.view === "top") {
      // top view
      this.camera.position.set(0, 0, 8);
      this.camera.up = new Vector3(0, 1, 0);
    }
    if (this.view === "front") {
      // front view
      this.camera.position.set(8, 0, 0);
      this.camera.up = new Vector3(0, 0, 1);
    }
    this.camera.lookAt(new Vector3());
    this.container.add(this.mesh);
    this.scene.add(
      this.camera,
      this.container,
      this.axisHelper,
      this.control,
      this.plane
    );
    this.renderer.setSize(innerWidth, innerHeight);
    this.appendChild(this.renderer.domElement);
  }
  static get observedAttributes() {
    return ["view"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case "view":
        console.log(name, newValue);
        this.view = newValue;
        this.fitContainerToCamera();
        break;
    }
  }
  // watched properties
  connectedCallback() {
    console.log("connected");
    this.renderer.setAnimationLoop(this.render.bind(this));
    window.addEventListener("resize", this.resizeListener, false);
    this.addEventListener("keydown", this.onkeydownListener);
    this.addEventListener("wheel", this.onwheelListener);
    this.liftZAndCenterXY();
  }
  disconnectedCallback() {
    console.log("disconnected");
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
    this.removeEventListener("keydown", this.onkeydownListener);
    this.removeEventListener("wheel", this.onwheelListener);
    this.renderer.domElement;
    this.renderer.dispose();
    this.renderer = null;
  }
  onkeydownListener = (event) => {
    console.log("keydown", ".....");
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
      this.rotateAroundY(dY / 500);
      this.liftZAndCenterXY();
    } else {
      this.theta += dY / 500;
      this.theta %= Math.PI * 2;
      this.container.rotation.z = this.theta;
    }
  };
  resizeListener = () => {
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(innerWidth, innerHeight);
  };
  rotateAroundY(dy = 0) {
    clearTimeout(this.timer);
    const v = new Vector3(0, 1, 0);
    v.applyAxisAngle(new Vector3(0, 0, 1), -this.theta);
    const q1 = new Quaternion().setFromAxisAngle(v, dy);
    this.mesh.applyQuaternion(q1);
  }
  liftZAndCenterXY() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      const box = new Box3().setFromObject(this.mesh);
      const center = box.getCenter(new Vector3());
      this.mesh.applyMatrix4(
        new Matrix4().makeTranslation(-center.x, -center.y, -box.min.z)
      );
    }, 1000);
  }
  replaceGeometry(geometry: BufferGeometry) {
    if (geometry) {
      this.mesh.geometry.dispose();
      this.mesh.geometry = geometry as any;
    }
    this.fitContainerToCamera();
  }
  fitContainerToCamera() {
    const box = new Box3().setFromObject(this.container);
    const { max, min } = box;
    const maxRange = Math.max(max.x - min.x, max.y - min.y, max.z - min.z);
    this.camera.left = -maxRange * 2;
    this.camera.right = maxRange * 2;
    this.camera.top = maxRange * 2;
    this.camera.bottom = -maxRange * 2;
    if (this.view === "top") {
      this.camera.position.set(0, 0, maxRange);
      this.camera.up = new Vector3(0, 1, 0);
    }
    if (this.view === "front") {
      this.camera.position.set(maxRange, 0, 0);
      this.camera.up = new Vector3(0, 0, 1);
    }
    this.camera.lookAt(new Vector3());
    this.camera.updateProjectionMatrix();
  }
  render() {
    // console.log("render");
    this.renderer.render(this.scene, this.camera);
  }
}
