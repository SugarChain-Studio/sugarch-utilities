import type { FuncWork } from '@sugarch/bc-mod-types';

export class WorkList {
    done: boolean;
    list: FuncWork[];

    constructor(done = false) {
        this.done = done;
        this.list = [];
    }

    run() {
        this.done = true;
        while (this.list.length > 0) this.list.shift()!();
    }

    push(work: FuncWork) {
        if (this.done) work();
        else this.list.push(work);
    }
}
