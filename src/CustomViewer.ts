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
  Vector2,
  Raycaster,
  SphereGeometry,
  Group,
  MeshBasicMaterial,
  DoubleSide,
  CylinderGeometry,
} from "three";
import { TransformControls } from "three/examples/jsm/controls/TransformControls";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import GeometryLoader from "./GeometryLoader";

export default class CustomViewer extends HTMLElement {
  view: "top" | "front" = "front";
  theta = 0;
  scale = 1;
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
  orbitControl: OrbitControls = new OrbitControls(
    this.camera,
    this.renderer.domElement
  );
  // geometry = new BufferGeometry();
  geometry = new CylinderGeometry(1, 2, 2);

  material = new MeshNormalMaterial();
  container = new Object3D();
  mesh = new Mesh(this.geometry, this.material);
  axisHelper = new AxesHelper(5);
  flatHelper = new Object3D();
  pointerMesh: Mesh;
  raycaster: Raycaster = new Raycaster();
  timer;
  plane = new PlaneHelper(new Plane(new Vector3(0, 0, 1), 0), 5, 0xffff00);
  teeth: Group = new Group();
  target = this.container;
  constructor() {
    super();
    console.log("construct");
    this.scene.background = new Color(0xf0f0f0);
    this.updateOrbitControl();
    this.updateCamera();
    this.container.add(this.mesh);
    this.scene.add(
      this.camera,
      this.container,
      this.axisHelper,
      this.flatHelper,
      this.control,
      this.plane,
      this.teeth
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
    this.loadTeethGroup();
    this.renderer.setAnimationLoop(this.render.bind(this));
    window.addEventListener("resize", this.resizeListener, false);
    this.addEventListener("pointermove", this.onPointerMoveListener);
    this.addEventListener("click", this.onClickListener);
    document.addEventListener("keydown", this.onkeydownListener);
    document.addEventListener("wheel", this.onwheelListener);
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
    this.removeEventListener("pointermove", this.onPointerMoveListener);
    this.removeEventListener("click", this.onClickListener);
    window.removeEventListener("resize", this.resizeListener);
    document.removeEventListener("keydown", this.onkeydownListener);
    document.removeEventListener("wheel", this.onwheelListener);
    this.renderer.domElement;
    this.renderer.dispose();
    this.renderer = null;
  }
  onClickListener = (event) => {
    console.log("pointer click", event.altKey);
    if (event.altKey && this.pointerMesh) {
      this.pointerMesh.userData.confirmed =
        !!!this.pointerMesh.userData.confirmed;
    }
    if (
      this.flatHelper.children.filter((point) => point.userData.confirmed)
        .length === 3
    ) {
      this.flatMesh();
    }
  };
  onPointerMoveListener = (event) => {
    // calculate pointer position in normalized device coordinates
    // (-1 to +1) for both components
    for (const pointer of this.flatHelper.children) {
      if (!pointer.userData.confirmed) {
        this.flatHelper.remove(pointer);
      }
    }
    const x = (event.clientX / innerWidth) * 2 - 1;
    const y = -(event.clientY / innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(new Vector2(x, y), this.camera);
    {
      const intersects = this.raycaster.intersectObjects(
        this.flatHelper.children
      );
      if (intersects.length) {
        // interected point position
        this.pointerMesh = intersects[0].object as Mesh;
        return;
      }
    }
    {
      const intersects = this.raycaster.intersectObjects(
        this.container.children
      );
      if (intersects.length) {
        // interected point position
        const point = intersects[0].point;
        const mesh = new Mesh(
          new SphereGeometry(this.scale * 0.1),
          new MeshNormalMaterial()
        );
        mesh.position.set(point.x, point.y, point.z);
        this.flatHelper.add(mesh);
        this.pointerMesh = mesh;
      } else {
        this.pointerMesh = undefined;
      }
    }
  };
  onkeydownListener = (event) => {
    console.log(
      "keydown",
      event.key,
      event.ctrlKey,
      event.altKey,
      event.metaKey,
      event.shiftKey
    );

    if (event.shiftKey) {
      this.target =
        this.target === this.container ? this.teeth : this.container;
      return;
    }

    let d = 0.1;
    let x = 0,
      y = 0,
      z = 0,
      a = 0,
      s = 0,
      h = 0;

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
      case "q":
        a = -d;
        break;
      case "e":
        a = d;
        break;
      case "r":
        s = -d;
        break;
      case "f":
        s = d;
        break;
      case "t":
        h = d;
        break;
      case "g":
        h = -d;
        break;
    }

    const matrix = new Matrix4();
    if (x || y || z) matrix.makeTranslation(x, y, z);
    if (s) matrix.makeScale(s + 1, s + 1, s + 1);
    if (a) matrix.makeRotationAxis(new Vector3(0, 0, 1), a);
    if (h) matrix.makeTranslation(0, 0, h);
    this.target.applyMatrix4(matrix);
  };
  flatMesh() {
    console.log("flat mesh with three points");
    const [p1, p2, p3] = this.flatHelper.children
      .filter((point) => point.userData.confirmed)
      .map((point) => new Vector3().copy(point.position));
    const normal = new Vector3().crossVectors(
      new Vector3().subVectors(p2, p1),
      new Vector3().subVectors(p3, p1)
    );
    const axis = new Vector3(0, 0, 1);
    const plane = new Plane().setFromNormalAndCoplanarPoint(normal, p1);
    const origin = plane.coplanarPoint(new Vector3());
    const translationMatrix = new Matrix4();
    const cross = new Vector3().crossVectors(axis, normal).normalize();
    const rotationMatrix = new Matrix4().makeRotationAxis(
      cross,
      normal.angleTo(axis) + Math.PI
    );
    if (this.view === "top") {
      translationMatrix.makeTranslation(0, -origin.y, 0);
    }
    if (this.view === "front") {
      translationMatrix.makeTranslation(0, 0, -origin.z);
    }

    const matrix = new Matrix4().multiplyMatrices(
      translationMatrix,
      rotationMatrix
    );
    this.mesh.applyMatrix4(matrix);
    this.flatHelper.children.forEach(
      (point) => (point.userData.confirmed = false)
    );
    this.liftZAndCenterXY(true);
  }
  // wheel event with shift and alt key
  onwheelListener = (event) => {
    console.log(event.key, event.altKey, event.shiftKey, event.metaKey);
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
    this.fitContainerToCamera();
  };
  rotateAroundY(dy = 0) {
    clearTimeout(this.timer);
    const v = new Vector3(0, 1, 0);
    v.applyAxisAngle(new Vector3(0, 0, 1), -this.theta);
    const q1 = new Quaternion().setFromAxisAngle(v, dy);
    this.mesh.applyQuaternion(q1);
  }
  liftZAndCenterXY(immediate = false) {
    clearTimeout(this.timer);
    this.timer = setTimeout(
      () => {
        const box = new Box3().setFromObject(this.mesh);
        const center = box.getCenter(new Vector3());
        this.mesh.applyMatrix4(
          new Matrix4().makeTranslation(-center.x, -center.y, -box.min.z)
        );
      },
      immediate ? 0 : 1000
    );
  }
  loadTeethGroup() {
    console.log("load teeth Group");
    this.teeth.scale.multiplyScalar(0.001 * this.scale);
    const material = new MeshBasicMaterial({
      color: new Color().setHex(0x000000),
      side: DoubleSide,
      transparent: true,
      depthWrite: false,
      opacity: 0.25,
    });
    GeometryLoader.readSVGToGeommetry().then((shapes) => {
      this.teeth.clear();
      console.log("teeth loaded", shapes);
      for (const shape of shapes) {
        this.teeth.add(new Mesh(shape, material));
      }
      // move teeth to center
      const box = new Box3().setFromObject(this.teeth);
      const center = box.getCenter(new Vector3());
      this.teeth.applyMatrix4(
        new Matrix4().makeTranslation(-center.x, -center.y, -center.z)
      );
      this.teeth.applyMatrix4(
        new Matrix4().makeRotationAxis(new Vector3(0, 0, 1), Math.PI)
      );
    });
  }
  replaceGeometry(geometry: BufferGeometry) {
    if (geometry) {
      this.mesh.geometry.dispose();
      this.mesh.geometry = geometry as any;
    }
    this.fitContainerToCamera();
  }
  updateOrbitControl() {
    // only dragging is enabled
    this.orbitControl.enableZoom = false;
    this.orbitControl.enablePan = false;
  }
  updateCamera(height = 8) {
    this.scale = height / 8;
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
    this.axisHelper.scale.set(this.scale, this.scale, this.scale);
    this.plane.size *= this.scale;
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
