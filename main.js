import { Application } from "./engine/Application.js";
import { Physics } from "./engine/Physics.js";
import { GLTFLoader } from "./engine/GLTFLoader.js";
import { Renderer } from "./engine/Renderer.js";
import { FirstPersonController } from "./engine/FirstPersonController.js";

class App extends Application {
  async start() {
    this.loader = new GLTFLoader();
    await this.loader.load("./models/scene/pacman-reduced.gltf");

    this.scene = await this.loader.loadScene(this.loader.defaultScene);
    this.camera = await this.loader.loadNode("Camera");
    
    this.light =  await this.loader.loadNode("Light");
    this.light.position = [3.5, -1.1, 10.8];
    this.light.color = [255, 255, 255];
    this.light.ambient = 0.25;
    this.light.diffuse = 3.3;
    this.light.intensity = 2.1;
    this.light.attenuation = [0.179, 0.027, 0.0];


    if (!this.scene || !this.camera) {
      throw new Error("Scene or Camera not present in glTF");
    }

    if (!this.camera.camera) {
      throw new Error("Camera node does not contain a camera reference");
    }

    this.renderer = new Renderer(this.gl);
    this.renderer.prepareScene(this.scene);

    this.object = await this.loader.loadNode("Pacman");

    this.controller = new FirstPersonController(this.object, this.gl.canvas);
    this.controllerCamera = new FirstPersonController(this.camera,this.gl.canvas);

    this.physics = new Physics(this.controller, this.scene, this.controllerCamera);
  }

  update(time, dt) {
    this.controller.update(dt);
    this.controllerCamera.update(dt);
    this.physics.update(dt);
    //this.light.translation = this.light.position;
  }

  render() {
    this.renderer.render(this.scene, this.camera, this.light);
  }

  resize(width, height) {
    this.camera.camera.aspect = width / height;
    this.camera.camera.updateProjectionMatrix();
  }

  stop(){
    this.loader = new GLTFLoader();
  }
}

const canvas = document.querySelector("canvas");
const app = new App(canvas);
await app.init();
document.querySelector(".loader-container").remove();
let mySound = new Audio('/audio/endlessmotion.mp3');
mySound.play();

export function endGame() {
  mySound.pause();
}

export async function canvasShake(amplitude){
  if(amplitude===0){
    canvas.classList.add("apply-shake");
  }
  await setTimeout(() => {canvas.classList.remove("apply-shake"); }, 500);
} 

