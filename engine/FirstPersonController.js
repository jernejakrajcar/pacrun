import { quat, vec3, mat4 } from "../lib/gl-matrix-module.js";

export class FirstPersonController {
  constructor(node, domElement) {
    this.node = node;
    this.aabb = [[-1.0,-1.0,-1.0],[1.0,1.0,1.0]];
    this.domElement = domElement;

    this.keys = {};

    this.pitch = 0;
    this.yaw = 0;

    this.velocity = [0, 0, 0];
    this.acceleration = 100;
    this.maxSpeed = 50;
    this.decay = 0.9;

    this.gravity = -9.81*2; // added gravity force
    this.jumpDuration = 0.1; // added jump duration
    this.isJumping = false; // added flag to track if object is currently jumping
    this.jumpTimer = 0; // added timer to track how long the object has been jumping
    
    this.pointerSensitivity = 0.002;

    this.initHandlers();
  }

  initHandlers() {
    this.pointermoveHandler = this.pointermoveHandler.bind(this);
    this.keydownHandler = this.keydownHandler.bind(this);
    this.keyupHandler = this.keyupHandler.bind(this);

    const element = this.domElement;
    const doc = element.ownerDocument;

    doc.addEventListener("keydown", this.keydownHandler);
    doc.addEventListener("keyup", this.keyupHandler);

    element.addEventListener("click", (e) => element.requestPointerLock());
    doc.addEventListener("pointerlockchange", (e) => {
      if (doc.pointerLockElement === element) {
        doc.addEventListener("pointermove", this.pointermoveHandler);
      } else {
        doc.removeEventListener("pointermove", this.pointermoveHandler);
      }
    });
  }

  update(dt) {
    // Calculate forward and right vectors.
    const cos = Math.cos(this.yaw);
    const sin = Math.sin(this.yaw);
    const forward = [-sin, 0, -cos];
    const up = [0, 1, 0];
    const side = [0.2, 0, 0];
    var vy = 0;
    
    // Map user input to the acceleration vector.
    const acc = vec3.create();
    if (this.keys["KeyW"]) {
      vec3.add(acc, acc, forward);
      // Update velocity based on acceleration.
      vec3.scaleAndAdd(this.velocity, this.velocity, acc, dt * this.acceleration);
    }
    if (this.keys["KeyS"]) {
      vec3.sub(acc, acc, forward);
      vec3.scaleAndAdd(this.velocity, this.velocity, acc, dt * this.acceleration);
    }
    if (this.keys["KeyD"]) {
      vec3.add(this.velocity, this.velocity, side);
      //vec3.scaleAndAdd(this.velocity, this.velocity, acc, 0.5);
    }
    if (this.keys["KeyA"]) {
      vec3.sub(this.velocity, this.velocity, side);
    }
    if (this.keys["Space"] && !this.isJumping) {
      this.isJumping = true; // set the flag to true
      this.jumpTimer = 0; // reset the jump timer
      this.velocity[1] = 2.5; // apply an upward force to the object
      vec3.add(this.velocity, this.velocity, up);
      vec3.scaleAndAdd(this.velocity, this.velocity, acc, dt * this.acceleration);
      //vy = this.velocity[1];
    }
    if (this.keys["KeyV"]) {
      this.velocity[1] = -2.5; // apply an upward force to the object
      vec3.add(this.velocity, this.velocity, up);
      vec3.scaleAndAdd(this.velocity, this.velocity, acc, dt * this.acceleration);
      //vy = this.velocity[1];
    }

    // If there is no user input, apply decay.
    if (
      !this.keys["KeyW"] &&
      !this.keys["KeyS"] &&
      !this.keys["KeyD"] &&
      !this.keys["KeyA"] &&
      !this.keys["Space"]
    ) {
      const decay = Math.exp(dt * Math.log(1 - this.decay));
      vec3.scale(this.velocity, this.velocity, decay);
      if (this.isJumping) {
        this.jumpTimer += dt; // increment the jump timer
        if (this.jumpTimer < this.jumpDuration) {
          // apply an upward force while the jump timer is less than the jump duration
          //this.velocity[1] += this.gravity * dt;
          vec3.sub(this.velocity, this.velocity, up);
          vec3.scaleAndAdd(this.velocity, this.velocity, acc, dt * this.gravity);
        } else {
          // jump is over, reset the flag
          this.isJumping = false;
        }
      }
    }

    // Limit speed to prevent accelerating to infinity and beyond.
    const speed = vec3.length(this.velocity);
    if (speed > this.maxSpeed) {
      vec3.scale(this.velocity, this.velocity, this.maxSpeed / speed);
    }

    // Update translation based on velocity.
    this.node.translation = vec3.scaleAndAdd(
      vec3.create(),
      this.node.translation,
      this.velocity,
      dt
    );
  }

  pointermoveHandler(e) {
    const dx = e.movementX;
    const dy = e.movementY;

    this.pitch -= dy * this.pointerSensitivity;
    this.yaw -= dx * this.pointerSensitivity;

    const twopi = Math.PI * 2;
    const halfpi = Math.PI / 2;

    this.pitch = Math.min(Math.max(this.pitch, -halfpi), halfpi);
    this.yaw = ((this.yaw % twopi) + twopi) % twopi;
  }

  keydownHandler(e) {
    this.keys[e.code] = true;

  }

  keyupHandler(e) {
    this.keys[e.code] = false;
  }

  getGlobalMatrix(){
    return this.node.getGlobalMatrix();
  }
}
