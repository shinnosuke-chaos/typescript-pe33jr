import {
  AxesHelper,
  Box3,
  BoxGeometry,
  BufferGeometry,
  Color,
  DoubleSide,
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
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { TransformControls } from "three/examples/jsm/controls/TransformControls";
import GeometryLoader from "./GeometryLoader";

const color = 0xffffff;
const emissive = 0xff0000;
export default class CustomViewer extends HTMLElement {
  view: "top" | "front" = "front";
  scene = new Scene();
  camera = new OrthographicCamera();
  cameraHeight = this.camera.far / 2;
  renderer = new WebGLRenderer();
  control: TransformControls = new TransformControls(
    this.camera,
    this.renderer.domElement
  );
  orbitControl: OrbitControls = new OrbitControls(
    this.camera,
    this.renderer.domElement
  );

  // group
  helpGroup = new Object3D();
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
  material = new MeshNormalMaterial();
  mesh = new Mesh(this.geometry, this.material);
  // others
  pointerMesh: Mesh;
  raycaster: Raycaster = new Raycaster();
  timer;
  private _target: Object3D = null;
  public get target(): Object3D {
    return this._target;
  }
  public set target(value: Object3D) {
    this.focusTarget(false);
    this._target = value;
    this.focusTarget(true);
  }
  focusTarget(focus: boolean) {
    this.target?.traverse((child) => {
      if (child instanceof Mesh) {
        // child.material.metalness = focus ? 0.8 : 0.2;
      }
    });
  }

  constructor() {
    super();
    console.log("construct");
    this.scene.background = new Color(0xf0f0f0);
    this.updateOrbitControl();
    this.helpGroup.add(this.axisHelper, this.teeth);
    this.scene.add(
      this.camera,
      this.mesh,
      this.control,
      this.helpGroup,
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
        this.fitCameraView();
        break;
    }
  }
  // watched properties
  connectedCallback() {
    console.log("connected");
    this.target = this.mesh;
    this.renderer.setAnimationLoop(this.render.bind(this));
    window.addEventListener("resize", this.resizeListener, false);
    this.addEventListener("pointermove", this.onPointerMoveListener);
    this.addEventListener("click", this.onClickListener);
    document.addEventListener("keydown", this.onkeydownListener);
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
    document.removeEventListener("wheel", this.onwheelListener);
    this.renderer.domElement;
    this.renderer.dispose();
    this.renderer = null;
  }
  onClickListener = (event) => {
    console.log(
      "pointer click",
      event.altKey,
      this.pointerMesh,
      this.pointerMesh?.userData.isFlatHelper,
      this.pointerMesh?.userData.isTeethHelper
    );
    if (this.pointerMesh) {
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
  onPointerMoveListener = (event) => {
    // 回收所有未固定的flat点
    for (const pointer of this.mesh.children) {
      if (this.pointerMesh === pointer) {
        continue;
      }
      if (!pointer.userData.confirmed) {
        this.mesh.remove(pointer);
        pointer["geometry"].dispose();
        pointer["material"].dispose();
      }
    }

    const x = (event.clientX / innerWidth) * 2 - 1;
    const y = -(event.clientY / innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(new Vector2(x, y), this.camera);
    // 悬停在teeth上
    // 悬停在mesh上
    // 设置当前对象

    const intersects = this.raycaster.intersectObject(this.mesh);
    if (intersects.length) {
      // intersected point position
      const object = intersects[0].object as Mesh;
      const isExistHelper =
        object.userData.isTeethHelper || object.userData.isFlatHelper;
      // 当前鼠标悬停是否在teeth点上
      //  当前鼠标悬停是否在flat点上
      const isTeethHelper = this.view === "top";
      const isFlatHelper = this.view === "front";
      const color = isTeethHelper
        ? 0xff0000
        : isFlatHelper
        ? 0x00ff00
        : 0xffffff;

      if (isExistHelper) {
        this.pointerMesh = object as Mesh;
        return;
      }
      const point = new Vector3().copy(intersects[0].point); // point in world
      this.mesh.worldToLocal(point);

      // 同一牙位,未固定的前置悬停点存在,则仅改变位置,不重新渲染
      if (this.pointerMesh && !this.pointerMesh.userData.confirmed) {
        this.pointerMesh.userData.isTeethHelper = isTeethHelper;
        this.pointerMesh.userData.isFlatHelper = isFlatHelper;
        const material = this.pointerMesh.material as MeshBasicMaterial;
        material.color.setHex(color);
        this.pointerMesh.position.copy(point);
        return;
      }

      const radius = this.mesh.userData.maxSize / 20;
      console.debug("radius", radius);

      const mesh = new Mesh(
        new SphereGeometry(radius),

        new MeshBasicMaterial({
          color,
          wireframe: true,
        })
      );
      mesh.position.set(point.x, point.y, point.z);
      mesh.userData.radius = radius;
      mesh.userData.isTeethHelper = isTeethHelper;
      mesh.userData.isFlatHelper = isFlatHelper;
      mesh.userData.confirmed = false;
      this.mesh.add(mesh);
      this.pointerMesh = mesh;
      return;
    }

    // 不存在悬停点 清空当前悬停点
    this.pointerMesh = undefined;
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
      this.target = this.target === this.mesh ? this.teeth : this.mesh;
      return;
    }

    let d = (0.1 * this.mesh.userData.maxSize) / 2;
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
        s = -0.1;
        break;
      case "f":
        s = 0.1;
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
    if (s) {
      if (this.target.userData.isTeethHelper) {
        (this.target as Mesh).geometry.dispose();
        this.target.userData.radius = this.target.userData.radius * (s + 1);
        (this.target as Mesh).geometry = new SphereGeometry(
          this.target.userData.radius
        );
        return;
      }
      matrix.makeScale(s + 1, s + 1, s + 1);
    }
    if (a) {
      console.debug("position", this.target.position);
      const pos = new Vector3().copy(this.target.position);
      const translation1 = new Matrix4().makeTranslation(
        -pos.x,
        -pos.y,
        -pos.z
      );
      const rotation = new Matrix4().makeRotationZ(a);
      const translation2 = new Matrix4().makeTranslation(pos.x, pos.y, pos.z);
      matrix.multiplyMatrices(translation2, rotation).multiply(translation1);
    }
    if (h) matrix.makeTranslation(0, 0, h);
    this.target.applyMatrix4(matrix);

    // matrix only affect x and y axis
    if (this.target.userData.previousTarget) {
      const isZOnly =
        matrix.elements[0] === 0 &&
        matrix.elements[1] === 0 &&
        matrix.elements[2] !== 0 &&
        matrix.elements[3] === 0 &&
        matrix.elements[4] === 0 &&
        matrix.elements[5] === 0 &&
        matrix.elements[6] !== 0 &&
        matrix.elements[7] === 0 &&
        matrix.elements[8] === 0 &&
        matrix.elements[9] === 0 &&
        matrix.elements[10] !== 0 &&
        matrix.elements[11] === 0 &&
        matrix.elements[12] === 0 &&
        matrix.elements[13] === 0 &&
        matrix.elements[14] === 0 &&
        matrix.elements[15] === 1;
      if (!isZOnly) {
        // TODO intersect container get z
      }
    }
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
    console.log(event.key, event.altKey, event.shiftKey, event.metaKey);
    let dY = event.deltaY;
    if (event.shiftKey) {
      dY /= 10;
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
    this.fitCameraView();
    this.renderer.setSize(innerWidth, innerHeight);
  };
  rotateAroundAxis(dy = 0, axis = new Vector3(0, 1, 0)) {
    // const v = new Vector3(0, 1, 0);
    // v.applyAxisAngle(new Vector3(0, 0, 1), -this.theta);
    const q1 = new Quaternion().setFromAxisAngle(axis, dy);
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
        this.fitCameraView();
      },
      immediate ? 0 : 1000
    );
  }
  replaceGeometry(geometry: BufferGeometry) {
    console.debug("replace geometry", geometry);

    if (geometry) {
      this.mesh.geometry.dispose();
      this.mesh.geometry = geometry as any;
      this.liftZAndCenterXY(true);
    }
  }
  updateOrbitControl() {
    // only dragging is enabled
    this.orbitControl.enableZoom = false;
    this.orbitControl.enablePan = false;
  }

  fitCameraView() {
    console.debug("camera", this.camera);
    const boundingBox = new Box3().setFromObject(this.mesh);
    console.debug("boundingBox", boundingBox);

    const center = boundingBox.getCenter(new Vector3());
    console.debug("center", center);
    const size = boundingBox.getSize(new Vector3());
    console.debug("size", size);
    const maxSize = Math.max(size.x, size.y, size.z) || 5;

    this.mesh.userData.maxSize = maxSize;

    this.camera.left = -(1.5 * maxSize);
    this.camera.bottom = -(1.5 * maxSize);
    this.camera.top = 1.5 * maxSize;
    this.camera.right = 1.5 * maxSize;
    this.camera.near = -maxSize * 4;
    this.camera.far = maxSize * 4;
    if (this.view === "top") {
      this.camera.position.set(0, 0, maxSize * 2);
      this.camera.up = new Vector3(0, 1, 0);
    }
    if (this.view === "front") {
      this.camera.position.set(maxSize * 2, 0, 0);
      this.camera.up = new Vector3(0, 0, 1);
    }
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();

    // this.teeth.scale.set(1, 1, 1);
    this.teeth.geometry.dispose();
    this.teeth.geometry = GeometryLoader.planeWithToothShapes(
      size.x / 1.2,
      size.y / 1.2
    );
    this.teeth.position.setZ(size.z);
    this.helpGroup.scale.set(size.x * 1.1, size.y * 1.1, size.z * 1.1);
    console.debug("maxSize", maxSize);
  }
  render() {
    // console.log("render");
    this.renderer.render(this.scene, this.camera);
  }
}
