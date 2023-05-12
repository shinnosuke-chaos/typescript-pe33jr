import * as THREE from 'three';
import {
  Color,
  Matrix4,
  Mesh,
  Object3D,
  Quaternion,
  Vector3,
  WebGLRenderer,
} from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

export default class Viewer {
  theta = 0;
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(
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
  geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
  material = new THREE.MeshNormalMaterial();
  container = new Object3D();
  mesh = new THREE.Mesh(this.geometry, this.material);
  axisHelper = new THREE.AxesHelper(5);
  timer;
  plane = new THREE.PlaneHelper(
    new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
    1,
    0xffff00
  );
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
    window.removeEventListener('resize', this.resizeListener);
    document.removeEventListener('wheel', this.onwheelListebner);
    this.renderer.domElement;
    this.renderer.dispose();
    this.renderer = null;
  }
  constructor() {
    this.scene.background = new Color(0xf0f0f0);
    // front view
    this.camera.position.x = 8;
    this.camera.up = new Vector3(0, 0, 1);
    this.camera.lookAt(new Vector3(0, 0, 0));
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
    this.renderer.setAnimationLoop(this.animate2.bind(this));
    document.body.appendChild(this.renderer.domElement);
    window.addEventListener('resize', this.resizeListener, false);
    this.renderer.domElement.addEventListener('wheel', this.onwheelListebner);
    this.animate();
  }
  // wheel event with shift and alt key
  onwheelListebner = (event) => {
    let dY = event.deltaY;
    if (event.shiftKey) {
      dY /= 10;
    }
    if (event.altKey) {
      this.transform(dY / 500);
      this.animate();
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
    const box = new THREE.Box3().setFromObject(this.mesh);
    const center = box.getCenter(new THREE.Vector3());
    this.mesh.applyMatrix4(
      new Matrix4().makeTranslation(-center.x, -center.y, -box.min.z)
    );
  }
  animate(time = 0) {
    clearTimeout(this.timer);
    this.timer = setTimeout(this.updateZ.bind(this), 1000);
  }
  animate2(time = 0) {
    this.renderer.render(this.scene, this.camera);
  }
}
