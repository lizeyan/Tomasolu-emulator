//实现Tomasolu算法
class Instruction {
    constructor (op, rs, rt, rd) {
        this.op = op;
        this.rs = rs;
        this.rt = rt;
        this.rd = rd;
    }
    toString () {
        return "(" + this.op + " " + this.rs + " " + this.rt + " " + this.rd + ")";
    }
}

class Memory {
    constructor (){
        this.data = {};
    }
    read(address) {
        let local_address = address;
        if (typeof address !== Number)
            local_address = Number.parseInt(address);
        if (! local_address in this.data)
            return this.write(local_address, 0);
        else
            return this.data[local_address];
    }
    write(address, value) {
        let local_address = address;
        if (typeof address !== Number)
            local_address = Number.parseInt(address);
        return this.data[local_address] = value
    }
    toString() {
        //TODO
    }
}

class FPU {
    constructor (memory) {
        //IN TEST
        // this.instruction_list = [];
        this.instruction_list = [new Instruction("load", "r1", "+32", "r3"), new Instruction("add", "r1", "r2", "r3")];
        this.cycle_passed = 0;
        this.memory = memory;
    }

    // 时钟度过n个周期
    cycle_pass (n) {
        if (n < 0) {
            console.log("warning: Do not support time machine now")
        }
        for (let i = 0; i < n; ++i)
            single_cycle_pass();
    }

    single_cycle_pass () {
        this.cycle_passed += 1;
        //TODO
    }
}