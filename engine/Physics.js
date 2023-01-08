import { vec3, mat4 } from "../lib/gl-matrix-module.js";
import { canvasShake, endGame } from "../main.js";
import { Obstacle, Star, Ghost, Wall, Floor } from "./Node.js";

export class Physics {
  constructor(controller, scene, camera) {
    this.camera = camera;
    this.controller = controller;
    this.nodes = [];
    this.stars = 0;
    for (let i = 0; i < scene.nodes.length; i++) {
      this.nodes.push(scene.nodes[i]);
      if (scene.nodes[i].ob instanceof Star) {
        this.stars += 1;
      }
    }
  }

  update(dt) {
    const c = this.controller;
    if (c.velocity[0] != 0) {
      c.node.updateMatrix();
      // After moving, check for collision with every other node.
      for (let i = 0; i < this.nodes.length; i++) {
        if (this.nodes[i].ob instanceof Star) {
          this.nodes[i].ob.update(dt);
        }
        if (this.nodes[i].ob instanceof Ghost) {
          this.nodes[i].ob.update(dt);
        }
        if (this.nodes[i].aabb) {
          if (c.node !== this.nodes[i]) {
            this.resolveCollision(c, this.nodes[i]);
          }
        }
      }
    }
  }

  intervalIntersection(min1, max1, min2, max2) {
    return !(min1 > max2 || min2 > max1);
  }

  aabbIntersection(aabb1, aabb2) {
    return (
      this.intervalIntersection(
        aabb1.min[0],
        aabb1.max[0],
        aabb2.min[0],
        aabb2.max[0]
      ) &&
      this.intervalIntersection(
        aabb1.min[1],
        aabb1.max[1],
        aabb2.min[1],
        aabb2.max[1]
      ) &&
      this.intervalIntersection(
        aabb1.min[2],
        aabb1.max[2],
        aabb2.min[2],
        aabb2.max[2]
      )
    );
  }

  getTransformedAABB(node) {
    // Transform all vertices of the AABB from local to global space.
    const transform = node.getGlobalMatrix();
    const min = node.aabb[0];
    const max = node.aabb[1];
    const vertices = [
      [min[0], min[1], min[2]],
      [min[0], min[1], max[2]],
      [min[0], max[1], min[2]],
      [min[0], max[1], max[2]],
      [max[0], min[1], min[2]],
      [max[0], min[1], max[2]],
      [max[0], max[1], min[2]],
      [max[0], max[1], max[2]],
    ].map((v) => vec3.transformMat4(v, v, transform));

    // Find new min and max by component.
    const xs = vertices.map((v) => v[0]);
    const ys = vertices.map((v) => v[1]);
    const zs = vertices.map((v) => v[2]);
    const newmin = [Math.min(...xs), Math.min(...ys), Math.min(...zs)];
    const newmax = [Math.max(...xs), Math.max(...ys), Math.max(...zs)];
    return { min: newmin, max: newmax };
  }

  resolveCollision(a, b) {
    // Get global space AABBs.
    const aBox = this.getTransformedAABB(a);
    const bBox = this.getTransformedAABB(b);
    // Check if there is collision.
    const isColliding = this.aabbIntersection(aBox, bBox);
    if (!isColliding) {
      return;
    } else {
      if (b.ob instanceof Star) {
        let showPoints = document.getElementById("points");
        this.stars--;
        b.ob.mesh = null;
        //b.ob.node._translation = 0;
        //b.ob.transformationMatrixNeedsUpdate = true;
        showPoints.innerHTML = 10 - this.stars;
        this.removeNode(b.ob.node);
        if (this.stars == 0) {
          console.log("Congrats! You got all the stars");
          let sound = new Audio('/audio/win.mp3');
          sound.play();
          let canvas = document.getElementById("canvas");
          let end = document.getElementById("winner-screen");
          canvas.style.display = "none";
          end.style.display = "block";
          a.velocity = [0, 0, 0];
          endGame();
        }
      }
      if (b.ob instanceof Ghost) {
        canvasShake(0);
        a.velocity = [0, 0, 0];
        this.camera.velocity = [0, 0, 0];
        let sound = new Audio('/audio/gameover.mp3');
        sound.play();
        setTimeout(gameover, 500);
        endGame();
      }
      if (b.ob instanceof Obstacle) {
        canvasShake(0);
        a.velocity = [0, 0, 0];
        this.camera.velocity = [0, 0, 0];
        let sound = new Audio('/audio/gameover.mp3');
        sound.play();
        setTimeout(gameover, 500);
        endGame();
      }
      if (b.ob instanceof Wall) {
        canvasShake(0);
        a.velocity = [0, 0, 0];
        this.camera.velocity = [0, 0, 0];
        let sound = new Audio('/audio/gameover.mp3');
        sound.play();
        setTimeout(gameover, 500);
        endGame();
      }
      if (b.ob instanceof Floor) {
        //console.log(b.ob)
        //console.log(a.velocity[2])
      }
    }

    // Move node A minimally to avoid collision.
    const diffa = vec3.sub(vec3.create(), bBox.max, aBox.min);
    const diffb = vec3.sub(vec3.create(), aBox.max, bBox.min);

    let minDiff = Infinity;
    let minDirection = [0, 0, 0];
    if (diffa[0] >= 0 && diffa[0] < minDiff) {
      minDiff = diffa[0];
      minDirection = [minDiff, 0, 0];
    }
    if (diffa[1] >= 0 && diffa[1] < minDiff) {
      minDiff = diffa[1];
      minDirection = [0, minDiff, 0];
    }
    if (diffa[2] >= 0 && diffa[2] < minDiff) {
      minDiff = diffa[2];
      minDirection = [0, 0, minDiff];
    }
    if (diffb[0] >= 0 && diffb[0] < minDiff) {
      minDiff = diffb[0];
      minDirection = [-minDiff, 0, 0];
    }
    if (diffb[1] >= 0 && diffb[1] < minDiff) {
      minDiff = diffb[1];
      minDirection = [0, -minDiff, 0];
    }
    if (diffb[2] >= 0 && diffb[2] < minDiff) {
      minDiff = diffb[2];
      minDirection = [0, 0, -minDiff];
    }

    vec3.add(a.node.translation, a.node.translation, minDirection);
    a.node.updateMatrix();
  }

  removeNode(object) {
    var copy = this.nodes;
    for (let i = 0; i < this.nodes.length; i++) {
      if (object == this.nodes[i]) {
        copy.splice(i, 1);
      }
    }
    this.nodes = copy;
  }
}

function gameover(){
  let canvas = document.getElementById("canvas");
  let end = document.getElementById("gameover-screen");
  canvas.style.display = "none";
  end.style.display = "block";
}