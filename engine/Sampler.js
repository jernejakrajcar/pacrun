export class Sampler {

    constructor(options = {}) {
        this.mag = options.mag ?? 9729; //linear
        this.min = options.min ?? 9729; //linear
        this.wrapS = options.wrapS ?? 10497; //
        this.wrapT = options.wrapT ?? 10497; //
    }

}
