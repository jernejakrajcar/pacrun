import { Node } from "./Node.js";
export class Light extends Node{
    constructor(){
        super();

        Object.assign(this, {
            position:  [2,5,3],
            color: [255,255,255],
            ambient: 0.2,
            diffuse: 0.8,
            specular: 1,
            shininess: 10,
            attenuation: [0.02,0,0.02]
        });
    }
}