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
    this.updateCamera();
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
        this.updateCamera();
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
  updateCamera(height = 8) {
    if (this.view === "top") {
      // top view
      this.camera.position.set(0, 0, height);
      this.camera.up = new Vector3(0, 1, 0);
    }
    if (this.view === "front") {
      // front view
      this.camera.position.set(height, 0, 0);
      this.camera.up = new Vector3(0, 0, 1);
    }
    this.axisHelper.scale.set(height / 8, height / 8, height / 8);
    this.camera.lookAt(new Vector3());
    this.camera.updateProjectionMatrix();
  }
  fitContainerToCamera() {
    const boundingBox = new Box3().setFromObject(this.container);
    const center = boundingBox.getCenter(new Vector3());
    const size = boundingBox.getSize(new Vector3());
    const maxSize = Math.max(size.x, size.y, size.z);
    this.camera.zoom = 1;
    this.camera.left = -(2 * maxSize);
    this.camera.bottom = -(2 * maxSize);
    this.camera.top = 2 * maxSize;
    this.camera.right = 2 * maxSize;
    this.camera.near = -maxSize * 4;
    this.camera.far = maxSize * 4;
    // camera;
    this.updateCamera(maxSize);
  }
  render() {
    // console.log("render");
    this.renderer.render(this.scene, this.camera);
  }
}
