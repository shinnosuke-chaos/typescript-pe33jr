import {
  AxesHelper,
  Box3,
  BoxGeometry,
  BufferGeometry,
  Color,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  Material,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshNormalMaterial,
  MeshPhongMaterial,
  MeshStandardMaterial,
  Object3D,
  OrthographicCamera,
  Plane,
  Quaternion,
  Raycaster,
  Scene,
  SphereGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls";
import { TransformControls } from "three/examples/jsm/controls/TransformControls";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter";

import GeometryLoader from "./GeometryLoader";
import { State } from "./Types";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const color = 0xffffff;
const emissive = 0xff0000;
export default class CustomViewer extends HTMLElement {
  // groups
  container_1: Group;
  container_2: Group;
  container_helper: Group;

  get model() {
    return this.container_2?.userData?.model;
  }

  radius: number;
  xScale: number = 1;
  yScale: number = 1;
  zTranslate: number = 0;

  extrude_type = 0;

  state: State;
  view: "top" | "front" = "front";
  scene = new Scene();
  camera = new OrthographicCamera();
  cameraHeight = this.camera.far / 2;
  renderer = new WebGLRenderer();
  control: TransformControls = new TransformControls(
    this.camera,
    this.renderer.domElement
  );
  cameraControl: OrbitControls = new OrbitControls(
    this.camera,
    this.renderer.domElement
  );

  // teeth
  teeth = new Mesh(
    GeometryLoader.planeWithToothShapes(),
    new MeshNormalMaterial({
      side: DoubleSide,
    })
  );
  // help
  axisHelper = new AxesHelper();
  // mesh
  geometry = new SphereGeometry();
  // geometry = new BufferGeometry();
  // geometry = new CylinderGeometry();
  modelMaterial = new MeshNormalMaterial();
  mesh: Mesh;

  // others
  pointerMesh: Mesh;
  raycaster: Raycaster = new Raycaster();
  timer;
  target: Object3D = null;

  constructor() {
    super();
    console.log("construct");

    // this.container_1 = new Group();
    // this.container_2 = new Group();
    this.container_helper = new Group();

    this.container_helper.add(this.axisHelper);

    this.scene.background = new Color(0xf0f0f0);
    this.scene.add(this.camera, this.control, this.container_helper);
    this.renderer.setSize(innerWidth, innerHeight);
    this.appendChild(this.renderer.domElement);
  }
  triggerUpdate() {
    this.dispatchEvent(new CustomEvent("update"));
  }
  static get observedAttributes() {
    return ["view"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case "view":
        console.log(name, newValue);
        this.view = newValue;
        if (this.view === "top") {
          this.camera.position.set(0, 0, 1000);
          this.camera.up = new Vector3(0, 1, 0);
        }
        if (this.view === "front") {
          this.camera.position.set(1000, 0, 0);
          this.camera.up = new Vector3(0, 0, 1);
        }
        this.camera.lookAt(0, 0, 0);
        this.camera.updateProjectionMatrix();
        break;
    }
  }
  // watched properties
  connectedCallback() {
    console.log("connected");
    this.updateControl();

    this.renderer.setAnimationLoop(this.render.bind(this));
    window.addEventListener("resize", this.resizeListener, false);
    this.addEventListener("pointermove", this.onPointerMoveListener);
    this.addEventListener("click", this.onClickListener);
    document.addEventListener("keydown", this.onkeydownListener);
    document.addEventListener("keyup", this.onKeyupListener);
    document.addEventListener("wheel", this.onwheelListener);
    this.liftZAndCenterXY(true);
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
    document.removeEventListener("keyup", this.onKeyupListener);
    document.removeEventListener("wheel", this.onwheelListener);
    this.renderer.domElement;
    this.renderer.dispose();
    this.renderer = null;
    this.cameraControl.dispose();
    this.control.dispose();
  }
  onClickListener = (event) => {
    if (!event.ctrlKey) {
      return;
    }
    if (!this.model) {
      return;
    }
    if (
      this.onPointerMoveListener_lastIntersection?.object?.parent ===
      this.container_2?.userData?.points
    ) {
      this.container_2.userData.points.remove(
        this.onPointerMoveListener_lastIntersection.object
      );
    } else if (
      this.onPointerMoveListener_lastIntersection?.object === this.model
    ) {
      const point = this.onPointerMoveListener_lastIntersection.point;
      this.model.worldToLocal(point);
      const radius = 1;
      const indicator = new Mesh(
        new SphereGeometry(radius),
        new MeshBasicMaterial({
          color: 0xaa0000,
        })
      );
      indicator.position.set(point.x, point.y, point.z);
      indicator.userData.isTeethHelper = true;
      indicator.userData.confirmed = true;
      this.container_2.userData.points.add(indicator);
      return;
      if (this.pointerMesh.userData.isTeethHelper) {
        if (this.pointerMesh.userData.confirmed) {
          if (this.target !== this.pointerMesh) {
            this.pointerMesh.userData.previousTarget = this.target;
            this.target = this.pointerMesh;
            return;
          }
          this.target = this.pointerMesh.userData.previousTarget || this.target;
        }
        this.pointerMesh.userData.confirmed =
          !this.pointerMesh.userData.confirmed;

        if (this.pointerMesh.userData.confirmed) {
          // TODO intersect container get z
        }
      }
      if (this.pointerMesh.userData.isFlatHelper) {
        this.pointerMesh.userData.confirmed =
          !!!this.pointerMesh.userData.confirmed;
      }

      (this.pointerMesh.material as MeshBasicMaterial).wireframe =
        !!!this.pointerMesh.userData.confirmed;
      // 如果flat上的点达到3个,则放平目标
      if (
        this.mesh.children.filter(
          (child) => child.userData.isFlatHelper && child.userData.confirmed
        ).length === 3
      ) {
        this.flatMesh();
      }
    }
  };

  onPointerMoveListener_lastIntersection = null;
  onPointerMoveListener_lastActiveTime = 0;
  onPointerMoveListener = (event) => {
    if (!event.ctrlKey) {
      this.container_2?.remove(this.pointerMesh);
      this.pointerMesh = undefined;
      return;
    }
    if (!this.model) {
      return;
    }
    const lastActiveTime = Date.now();
    if (lastActiveTime - this.onPointerMoveListener_lastActiveTime < 30) {
      return;
    }
    this.onPointerMoveListener_lastActiveTime = lastActiveTime;

    const x = (event.clientX / innerWidth) * 2 - 1;
    const y = -(event.clientY / innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(new Vector2(x, y), this.camera);

    const intersects0 = this.raycaster.intersectObject(
      this.container_2?.userData.points
    );
    if (intersects0.length) {
      const intersection = intersects0[0];
      this.onPointerMoveListener_lastIntersection = intersection;
      this.container_2?.remove(this.pointerMesh);
      this.pointerMesh = undefined;
      return;
    }

    const intersects = this.raycaster.intersectObject(this.model);
    if (intersects.length) {
      const intersection = intersects[0];
      this.onPointerMoveListener_lastIntersection = intersection;
      const point = new Vector3().copy(intersection.point);
      this.model.worldToLocal(point);

      const radius = 1;
      const indicator =
        this.pointerMesh ??
        new Mesh(
          new SphereGeometry(radius),
          new MeshBasicMaterial({
            color,
          })
        );
      indicator.position.set(point.x, point.y, point.z);
      indicator.userData.radius = radius;
      indicator.userData.confirmed = false;
      this.container_2.add(indicator);
      this.pointerMesh = indicator;
      return;
    } else {
      // 不存在悬停点 清空当前悬停点
      this.container_2.remove(this.pointerMesh);
      this.pointerMesh = undefined;
    }
    const intersects2 = this.raycaster.intersectObject(this.container_1);
    if (intersects2.length) {
      const intersection = intersects2[0];
      this.onPointerMoveListener_lastIntersection = intersection;
      return;
    }
  };
  onKeyupListener = (event) => {
    if (event.key === "Control") {
      this.cameraControl.enabled = true;
    }
  };
  onkeydownListener = (event) => {
    // if (event.shiftKey) {
    //   this.target = this.target === this.mesh ? this.teeth : this.mesh;
    //   return;
    // }
    if (event.key === "Control") {
      this.cameraControl.enabled = false;
      return;
    }
    if (!this.model?.userData?.maxSize) {
      return;
    }

    const d = 0.1;
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
      default:
        return;
    }

    const matrix = new Matrix4();
    if (x || y || z) matrix.makeTranslation(x, y, z);
    this.container_2.applyMatrix4(matrix);
  };
  intersectMeshFromPoint(point: Vector3) {
    const raycaster = new Raycaster();
    raycaster.set(point, new Vector3(0, 0, 1));
    const intersects = raycaster.intersectObject(this.mesh);
    if (intersects.length) {
      const intersect = intersects[0];
      console.debug(intersect.point);
      return intersect.point;
    }
  }
  flatMesh() {
    console.log("flat mesh with three points");
    const [p1, p2, p3] = this.mesh.children
      .filter(
        (child) => child.userData.isFlatHelper && child.userData.confirmed
      )
      .map((point) => {
        point.userData.confirmed = false;
        return new Vector3().copy(point.position);
      });
    const normal = new Vector3().crossVectors(
      new Vector3().subVectors(p2, p1),
      new Vector3().subVectors(p3, p1)
    );
    const axis = new Vector3(0, 0, 1);
    const origin = new Plane()
      .setFromNormalAndCoplanarPoint(normal, p1)
      .coplanarPoint(new Vector3());

    const matrix = new Matrix4().multiplyMatrices(
      // center plane translation
      new Matrix4().makeTranslation(-origin.x, -origin.y, -origin.z),
      new Matrix4().makeRotationFromQuaternion(
        new Quaternion().setFromAxisAngle(
          new Vector3().crossVectors(axis, normal).normalize(),
          normal.angleTo(axis)
        )
      )
    );
    this.mesh.applyMatrix4(matrix);
    this.liftZAndCenterXY(true);
  }
  // wheel event with shift and alt key
  onwheelListener = (event) => {
    if (!this.control.enabled) {
      return;
    }
    switch (this.view) {
      case "top":
        if (!this.container_2) {
          return;
        }
        let dY = event.deltaY;
        console.log(this.onPointerMoveListener_lastIntersection);
        if (event.altKey) {
        } else {
          if (
            this.onPointerMoveListener_lastIntersection?.object?.parent ===
            this.container_1
          ) {
            let { scale } = this.container_1.userData;
            if (dY > 0) {
              scale = 1.02;
            } else if (dY < 0) {
              scale = 0.99;
            }
            this.container_1.userData.scale = scale;
            this.container_1.applyMatrix4(
              new Matrix4().makeScale(scale, scale, scale)
            );
          } else {
            const q = new Quaternion().setFromAxisAngle(
              new Vector3(0, 0, 1),
              dY / 1000
            );
            this.container_2.applyQuaternion(q);
          }
        }
        break;
      case "front":
        break;
    }
    return;
    let dY = event.deltaY;
    if (event.shiftKey) {
      dY /= 10;
    }

    if (this.view === "top") {
      this.radius += dY / 500;
      this.switchExtrudeGeometry();
      return;
    }

    if (event.altKey) {
      this.rotateAroundAxis(dY / 500);
      this.liftZAndCenterXY();
    } else {
      // this.theta += dY / 500;
      // this.theta %= Math.PI * 2;
      // this.mesh.rotation.z = this.theta;
      this.rotateAroundAxis(dY / 500, new Vector3(0, 0, 1));
    }
  };
  resizeListener = () => {
    // this.fitCameraView();
    this.renderer.setSize(innerWidth, innerHeight);
  };
  rotateAroundAxis(dy = 0, axis = new Vector3(0, 1, 0)) {
    // const v = new Vector3(0, 1, 0);
    // v.applyAxisAngle(new Vector3(0, 0, 1), -this.theta);
    const q1 = new Quaternion().setFromAxisAngle(axis, dy);
    this.container_2.userData.model?.applyQuaternion(q1);
    this.triggerUpdate();
  }
  liftZAndCenterXY(immediate = false) {
    clearTimeout(this.timer);
    this.timer = setTimeout(
      () => {
        const model = this.container_2?.userData?.model;
        if (!model) return;
        const box = model.userData.boundingBox;
        const center = box.getCenter(new Vector3());
        const m = new Matrix4().makeTranslation(
          -center.x,
          -center.y,
          -box.min.z
        );
        this.container_2.applyMatrix4(m);
      },
      immediate ? 0 : 1000
    );
  }
  exportModelAndExtrude(): string[] {
    console.log("export model");
    const model = this.container_2?.userData?.model;
    const extrude = this.container_2?.userData?.extrude;
    if (!model || !extrude) return;
    return [model, ...extrude.children].map(
      (obj) => obj && new STLExporter().parse(obj)
    );
  }
  replaceMeshGeometry(geometry: BufferGeometry, matrix?: Matrix4) {
    console.debug("replace geometry", geometry);

    if (geometry) {
      this.scene.remove(this.container_2);
      this.container_2 = new Group();
      this.scene.add(this.container_2);
      const model = new Mesh(geometry as any, this.modelMaterial);
      this.container_2.add(model);
      const points = new Group();
      this.container_2.add(points);
      this.container_2.userData.points = points;
      const extrude = new Group();
      this.container_2.add(extrude);
      this.container_2.userData.extrude = extrude;

      const boundingBox = new Box3().setFromObject(model);
      const size = boundingBox.getSize(new Vector3());
      const maxSize = Math.max(size.x, size.y, size.z) || 5;
      this.container_2.userData.model = model;
      model.userData.maxSize = maxSize;
      model.userData.boundingBox = boundingBox;

      if (!matrix) {
        this.liftZAndCenterXY(true);
      } else {
        this.container_2.applyMatrix4(matrix);
      }
      this.resetContainer_1();
      this.triggerUpdate();
    }
  }
  switchExtrudeGeometry(rotate: boolean = true) {
    console.debug("switch extrude geometry", rotate);
    debugger;
    // if (!this.mesh.visible) {
    //   this.mesh.visible = true;
    //   this.extrude.visible = true;
    //   return;
    // }
    console.debug(
      "switch extrude geometry",
      this.container_2?.userData?.points?.children
    );
    const points = this.container_2?.userData?.points?.children
      ?.filter(
        (child) => child.userData.confirmed && child.userData.isTeethHelper
      )
      .map(
        (point) => point.position.clone()
        // .setZ(this.teeth.position.z)
      );
    // .map((point) => ({
    //   x: point.position.x,
    //   y: point.position.y,
    //   z: point.position.z,
    //   a: point.userData.radius,
    // }));
    if (!points.length) return;
    const geometries = GeometryLoader.extrudeGeometryWithPoints(
      points,
      this.radius,
      this.xScale,
      this.yScale,
      this.zTranslate,
      rotate ? ++this.extrude_type : this.extrude_type
    );
    this.container_2.userData.extrude.children.length = 0;
    geometries
      .map((g) => new Mesh(g, this.modelMaterial))
      .forEach((m) => {
        this.container_2.userData.extrude.add(m);
      });
    // this.mesh.visible = false;
    // this.extrude.visible = true
  }
  updateControl() {
    this.control.enabled = false;
    this.cameraControl.enabled = true;
    // this.trackBallControl.noRotate = true;
    // only dragging is enabled
    this.cameraControl.enablePan = false;
    this.cameraControl.enableZoom = false;
  }

  resetContainer_1() {
    if (!this.model) return;

    this.scene.remove(this.container_1);
    this.container_1 = new Group();
    this.container_1.userData.scale = 1;
    this.scene.add(this.container_1);

    const size = this.model.userData.boundingBox.getSize(new Vector3());
    const maxSize = this.model.userData.maxSize;
    const rate = window.innerWidth / window.innerHeight;

    this.camera.left = -(1.5 * maxSize * rate);
    this.camera.bottom = -(1.5 * maxSize);
    this.camera.top = 1.5 * maxSize;
    this.camera.right = 1.5 * maxSize * rate;
    this.camera.updateProjectionMatrix();

    this.radius = Math.max(maxSize / 4, 10);
    this.container_helper.scale.set(size.x, size.y, size.z);

    if (this.control.enabled) {
      // no shape mesh when cons
      const shapeGeometry = GeometryLoader.planeWithToothShapes(
        size.x / 1.2,
        size.y / 1.2
      );
      const shapeMesh = new Mesh(
        shapeGeometry,
        new MeshNormalMaterial({
          side: DoubleSide,
        })
      );
      shapeMesh.position.setZ(0);
      this.container_1.add(shapeMesh);
    }
  }
  render() {
    // console.log("render");
    this.cameraControl.update();
    this.renderer.render(this.scene, this.camera);
  }
}
