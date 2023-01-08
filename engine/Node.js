import { vec3, mat4, quat } from "../lib/gl-matrix-module.js";

export class Node {
  constructor(options = {}) {
    this._translation = options.translation
      ? vec3.clone(options.translation)
      : vec3.fromValues(0, 0, 0);
    this._rotation = options.rotation
      ? quat.clone(options.rotation)
      : quat.fromValues(0, 0, 0, 1);
    this._scale = options.scale
      ? vec3.clone(options.scale)
      : vec3.fromValues(1, 1, 1);
    this._matrix = options.matrix ? mat4.clone(options.matrix) : mat4.create();

    this.localMatrix = mat4.create();
    this.updateMatrix();

    this.rotationSpeed = 0.5;

    if (options.matrix) {
      this.updateTransformationComponents();
    } else if (options.translation || options.rotation || options.scale) {
      this.updateTransformationMatrix();
    }

    this.transformationMatrixNeedsUpdate = false;
    this.transformationComponentsNeedUpdate = false;

    this.camera = options.camera ?? null;
    this.mesh = options.mesh ?? null;

    this.children = [...(options.children ?? [])];
    for (const child of this.children) {
      child.parent = this;
    }
    this.parent = null;
    if (options.name) {
      if (options.name.startsWith("Obstacle")) {
        this.ob = new Obstacle(this);
        this.aabb = this.ob.aabb;
      }
      if (options.name.startsWith("Ghost")) {
        this.ob = new Ghost(this);
        this.aabb = this.ob.aabb;
      }
      if (options.name.startsWith("Star")) {
        this.ob = new Star(this);
        this.aabb = this.ob.aabb;
        this.rotationSpeed = 0.2;
      }
      if (options.name.startsWith("Wall-back")) {
        this.ob = new Wall(this, 0);
        this.aabb = this.ob.aabb;
      }
      if (options.name.startsWith("Wall-right")) {
        this.ob = new Wall(this, 2);
        this.aabb = this.ob.aabb;
      }
      if (options.name.startsWith("Wall-left")) {
        this.ob = new Wall(this, 1);
        this.aabb = this.ob.aabb;
      }
      if (options.name.startsWith("Floor")) {
        this.ob = new Floor(this);
        this.aabb = this.ob.aabb;
      }
    }
  }

  updateMatrix() {
    const m = this.localMatrix;
    const q = quat.clone(this._rotation);
    const v = vec3.clone(this._translation);
    const s = vec3.clone(this._scale);
    mat4.fromRotationTranslationScale(m, q, v, s);
  }

  updateTransformationComponents() {
    mat4.getRotation(this._rotation, this._matrix);
    mat4.getTranslation(this._translation, this._matrix);
    mat4.getScaling(this._scale, this._matrix);

    this.transformationComponentsNeedUpdate = false;
  }

  updateTransformationMatrix() {
    mat4.fromRotationTranslationScale(
      this._matrix,
      this._rotation,
      this._translation,
      this._scale
    );

    this.transformationMatrixNeedsUpdate = false;
  }

  get translation() {
    if (this.transformationComponentsNeedUpdate) {
      this.updateTransformationComponents();
    }
    return vec3.clone(this._translation);
  }

  set translation(translation) {
    if (this.transformationComponentsNeedUpdate) {
      this.updateTransformationComponents();
    }
    this._translation = vec3.clone(translation);
    this.transformationMatrixNeedsUpdate = true;
  }

  get rotation() {
    if (this.transformationComponentsNeedUpdate) {
      this.updateTransformationComponents();
    }
    return quat.clone(this._rotation);
  }

  set rotation(rotation) {
    if (this.transformationComponentsNeedUpdate) {
      this.updateTransformationComponents();
    }
    this._rotation = quat.clone(rotation);
    this.transformationMatrixNeedsUpdate = true;
  }

  get scale() {
    if (this.transformationComponentsNeedUpdate) {
      this.updateTransformationComponents();
    }
    return vec3.clone(this._scale);
  }

  set scale(scale) {
    if (this.transformationComponentsNeedUpdate) {
      this.updateTransformationComponents();
    }
    this._scale = vec3.clone(scale);
    this.transformationMatrixNeedsUpdate = true;
  }

  get localMatrix() {
    if (this.transformationMatrixNeedsUpdate) {
      this.updateTransformationMatrix();
    }
    return mat4.clone(this._matrix);
  }

  set localMatrix(matrix) {
    this._matrix = mat4.clone(matrix);
    this.transformationComponentsNeedUpdate = true;
    this.transformationMatrixNeedsUpdate = false;
  }

  get globalMatrix() {
    if (this.parent) {
      const globalMatrix = this.parent.globalMatrix;
      return mat4.multiply(globalMatrix, globalMatrix, this.localMatrix);
    } else {
      return this.localMatrix;
    }
  }

  getGlobalMatrix() {
    if (this.parent) {
      const globalMatrix = this.parent.globalMatrix;
      return mat4.multiply(globalMatrix, globalMatrix, this.localMatrix);
    } else {
      return this.localMatrix;
    }
  }

  addChild(node) {
    if (node.parent) {
      node.parent.removeChild(node);
    }

    this.children.push(node);
    node.parent = this;
  }

  removeChild(node) {
    const index = this.children.indexOf(node);
    if (index >= 0) {
      this.children.splice(index, 1);
      node.parent = null;
    }
  }

  traverse(before, after) {
    if (before) {
      before(this);
    }
    for (const child of this.children) {
      child.traverse(before, after);
    }
    if (after) {
      after(this);
    }
  }

  getNode() {
    return this.node;
  }

  updateRotation(dt) {
    const angle = this.rotationSpeed * dt;
    // Create a quaternion representing the rotation
    const rotation = quat.fromAxisAngle(quat.create(), [0, 1, 0], angle);
    // Rotate the object's current rotation by the calculated rotation
    quat.mul(this._rotation, this._rotation, rotation);
    // Update the transformation matrix to reflect the new rotation
    this.transformationMatrixNeedsUpdate = true;
  }
}

Node.defaults = {
  translation: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
  aabb: {
    min: [0, 0, 0],
    max: [0, 0, 0],
  },
};

export class Star extends Node {
  constructor(node) {
    super(node);
    this.node = node;
    this.aabb = [
      [-1.0, -0.5, -0.5],
      [1.0, 0.5, 0.5],
    ];
  }
  update(dt) {
    // Update the rotation of the object
    quat.rotateZ(
      this.node._rotation,
      this.node._rotation,
      dt * this.rotationSpeed
    );
    // Set the rotation of the node
    this.node._rotation = this._rotation;
    this.node.transformationMatrixNeedsUpdate = true;
  }
}

export class Ghost extends Node {
  constructor(node) {
    super(node);
    this.node = node;
    this.aabb = [
      [-0.8, -1.0, -0.5],
      [0.8, 1.0, 0.5],
    ];

    this.speed = 1;
    this.movementDirection = 1;

  }

  update(dt) {
    const movementDistance = 5; // Move 10 units to the left and right
    if (Math.abs(this.node._translation[0]) >= movementDistance) {
        this.movementDirection *= -1;
    }

    this.node._translation[0] += this.movementDirection * 0.1;

    this.node.transformationMatrixNeedsUpdate = true;
  }
}

export class Obstacle extends Node {
  constructor(node) {
    super(node);
    this.node = node;
    this.aabb = [
      [-1.2, -0.2, -1.2],
      [1.2, 0.2, 1.2],
    ];
    //this.update(4);
  }
  update(dt) {
    this._rotation = quat.clone(this._rotation);
    this._rotation = quat.rotateY(this._rotation, this._rotation, 1 * dt);
  }
}

export class Wall extends Node {
    constructor(node, type) {
      super(node);
      this.node = node;
      if(type == 0){ // 0 - back
        this.aabb = [
          [-5.05, -0.1, -2.05],
          [5.05, 0.1, 2.05],
        ];
      }
      /*if(type == 1){ // 1 - left
        this.aabb = [
          [-2.05, -50.0, -0.05],
          [2.05, 50.0, 0.05],
        ];
      }
      if(type == 2){ // 2 - right
        this.aabb = [
          [-0.05, -50.1, -2.05],
          [0.05, 50.1, 2.05],
        ];
      }*/
      
    }
    update(dt) {
    }
  }

  export class Floor extends Node {
    constructor(node) {
      super(node);
      this.node = node;
      this.aabb = [
        [-1.5, -69, -0.05],
        [1.5, 69, 0.05],
      ];
    }
    update(dt) {
    }
  }
