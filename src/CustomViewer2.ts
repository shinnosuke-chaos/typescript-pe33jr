import {
  AxesHelper,
  Box3,
  Box3Helper,
  BoxGeometry,
  BoxHelper,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  Line,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshNormalMaterial,
  Object3D,
  OrthographicCamera,
  Plane,
  PlaneHelper,
  Quaternion,
  Raycaster,
  Scene,
  ShapeGeometry,
  SphereGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { TransformControls } from "three/examples/jsm/controls/TransformControls";
import GeometryLoader from "./GeometryLoader";

export default class CustomViewer extends HTMLElement {
  view: "top" | "front" = "front";
  pointerScale = 0.1;
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
  teeth: Group = new Group();
  // help
  axisHelper = new AxesHelper();
  plane = new PlaneHelper(new Plane(new Vector3(0, 0, 1), 0), 1, 0xffff00);
  // mesh
  geometry = new BoxGeometry();
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
    this.updateWireframe(false);
    this._target = value;
    this.updateWireframe(true);
  }
  updateWireframe(wireframe: boolean) {
    this.target?.traverse((child) => {
      if (child instanceof Mesh) {
        child.material.wireframe = wireframe;
      }
    });
  }

  constructor() {
    super();
    console.log("construct");
    this.scene.background = new Color(0xf0f0f0);
    this.updateOrbitControl();
    this.helpGroup.add(this.axisHelper, this.plane);
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
    this.loadTeethGroup();
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
    // 当前鼠标悬停有目标点
    if (this.pointerMesh) {
      // 目标点为teeth上的点,isTeethHelper
      if (this.pointerMesh.userData.isTeethHelper) {
        // 目标点为固定点
        if (this.pointerMesh.userData.confirmed) {
          // 事件同时按下altKey,表示取消固定,还原操作对象(如存在),
          if (event.altKey) {
            this.pointerMesh.userData.confirmed = false;
            this.target =
              this.pointerMesh.userData.previousTarget || this.target;
            // 否则判断是否已保存前置操作对象,已保存则取消,
            // 反之则保存前置操作对象, 选取目标点为(移动旋转放大缩小)操作对象,
          } else {
            if (this.target === this.pointerMesh) {
              this.target = this.pointerMesh.userData.previousTarget;
            } else {
              this.pointerMesh.userData.previousTarget = this.target;
              this.target = this.pointerMesh;
              // TODO intersect container get z
            }
          }
          return;
        }
        // 目标点为非固定点,找本区域内是否有已经确定的固定点
        const existPoint = this.teeth.children.find(
          (child) =>
            child.userData.isTeethHelper &&
            child.userData.object === this.pointerMesh.userData.object &&
            child.userData.confirmed
        );
        // 当前区域(牙位)已经存在固定点,则将其位置移到目标点,
        // 同时保存前置操作对象, 选取目标点为(移动旋转放大缩小)操作对象
        // 由于此处直接返回,目标点在鼠标悬停事件中会被回收
        if (existPoint) {
          existPoint.position.copy(this.pointerMesh.position);
          existPoint.userData.previousTarget = this.target;
          this.target = existPoint;
          // TODO intersect container get z
          return;
        }
      }
      // 目标点为flat上的点,同时按下altKey,则反转固定点的状态
      if (event.altKey) {
        this.pointerMesh.userData.confirmed =
          !!!this.pointerMesh.userData.confirmed;
      }
      // 如果flat上的点达到3个,则方平目标
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
    // 回收所有未固定的teeth点
    for (const pointer of this.teeth.children.filter(
      (child) => child.userData.isTeethHelper
    )) {
      if (this.pointerMesh === pointer) {
        continue;
      }
      if (!pointer.userData.confirmed) {
        this.teeth.remove(pointer);
        pointer["geometry"].dispose();
        pointer["material"].dispose();
      }
    }
    // 回收所有未固定的flat点
    for (const pointer of this.mesh.children.filter(
      (child) => child.userData.isFlatHelper
    )) {
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

    const intersects = this.raycaster.intersectObjects(
      this.teeth.children.concat(this.mesh),
      false
    );
    if (intersects.length) {
      // intersected point position
      const object = intersects[0].object;
      const isExistHelper =
        object.userData.isTeethHelper || object.userData.isFlatHelper;
      // 当前鼠标悬停是否在teeth点上
      //  当前鼠标悬停是否在flat点上

      if (isExistHelper) {
        this.pointerMesh = object as Mesh;
        return;
      }
      const isMeshIntersected = object === this.mesh;
      const point = new Vector3().copy(intersects[0].point); // point in world
      if (isMeshIntersected) {
        this.mesh.worldToLocal(point);
      } else {
        this.teeth.worldToLocal(point);
      }

      // 同一牙位,未固定的前置悬停点存在,则仅改变位置,不重新渲染
      if (
        this.pointerMesh &&
        this.pointerMesh.userData.object === object &&
        !this.pointerMesh.userData.confirmed
      ) {
        this.pointerMesh.position.copy(point);
        return;
      }
      const radius = isMeshIntersected
        ? this.mesh.userData.maxSize / 10
        : this.teeth.userData.maxSize / 2;
      console.debug("radius", radius, isMeshIntersected);

      const mesh = new Mesh(
        new SphereGeometry(radius),
        new MeshNormalMaterial()
      );
      mesh.position.set(point.x, point.y, point.z);
      mesh.userData.object = object;
      mesh.userData.isTeethHelper = !isMeshIntersected;
      mesh.userData.isFlatHelper = isMeshIntersected;
      mesh.userData.confirmed = false;
      if (isMeshIntersected) {
        this.mesh.add(mesh);
      } else {
        mesh.scale.set(
          this.teeth.scale.x,
          this.teeth.scale.y,
          this.teeth.scale.z
        );
        this.teeth.add(mesh);
      }
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

    this.scene.children
      .filter(
        (child) =>
          (this.target === this.mesh && child.userData.isFlatHelper) ||
          (this.target === this.teeth && child.userData.isTeethHelper)
      )
      .forEach((child) => child.applyMatrix4(matrix));

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
    const [p1, p2, p3] = this.scene.children
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
      },
      immediate ? 0 : 1000
    );
  }
  loadTeethGroup() {
    const material = new MeshBasicMaterial({
      color: new Color().setHex(0x0f0f0f),
      side: DoubleSide,
      transparent: true,
      depthWrite: false,
      opacity: 0.5,
    });
    GeometryLoader.readSVGToGeometry().then((shapes) => {
      // 载入前对teeth进行清空 并还原缩放比例
      this.teeth.clear();
      this.teeth.scale.set(1, 1, 1);
      console.log("teeth loaded", shapes.length);
      for (const shape of shapes) {
        this.teeth.add(new Mesh(shape, material));
      }
      // 获取teeth group的center,此步骤之前 一定不也能对teeth进行缩放
      const box = new Box3().setFromObject(this.teeth);
      const center = box.getCenter(new Vector3());
      console.debug("Teeth Center", center);
      const size = box.getSize(new Vector3());
      console.debug("Teeth Size:", size);
      this.teeth.userData.maxSize = Math.max(size.x, size.y, size.z);
      // 对各个shape 相对于 teeth 进行center
      for (const shape of this.teeth.children) {
        shape["geometry"].translate(-center.x, -center.y, 0);
        shape.updateMatrixWorld(true);
      }
      // 此时针对teeth的位置进行旋转和缩放,可选,根据具体的svg而定
      this.teeth.applyMatrix4(new Matrix4().makeRotationZ(Math.PI));
      this.fitCameraView();
    });
  }
  replaceGeometry(geometry: BufferGeometry) {
    console.debug("replace geometry", geometry);

    if (geometry) {
      this.mesh.geometry.dispose();
      this.mesh.geometry = geometry as any;
      this.liftZAndCenterXY(true);
      this.fitCameraView();
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

    this.camera.left = -(2 * maxSize);
    this.camera.bottom = -(2 * maxSize);
    this.camera.top = 2 * maxSize;
    this.camera.right = 2 * maxSize;
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

    const teethScale =
      (maxSize / (this.teeth.userData.maxSize || maxSize)) * 1.1;
    this.teeth.scale.set(teethScale, teethScale, teethScale);
    const helpScale = maxSize * 1.2;
    this.helpGroup.scale.set(helpScale, helpScale, helpScale);
    console.debug("maxSize", maxSize, teethScale, helpScale);
  }
  render() {
    // console.log("render");
    this.renderer.render(this.scene, this.camera);
  }
}
