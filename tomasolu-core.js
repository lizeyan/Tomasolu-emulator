//实现Tomasolu算法

//define all operations and their speed
const operations = {
    "ld": {
        description: "load Register(rs) + Immediate(rt) to Register(rd)",
        speed: 2,
        work: function (rs, rt, rd, kwargs) {
            kwargs.register_file.write(rd, kwargs.memory.read(kwargs.register_file.read(rs), rt));
        }
    },
    "addd": {
        description: "floating point rs + rt => rd",
        speed: 2,
        work: function (rs, rt, rd, kwargs) {
            kwargs.register_file.write(rd, kwargs.register_file.read(rs) + kwargs.register_file.read(rt));
        }
    },
    "subd": {
        description: "floating point rs - rt => rd",
        speed: 2,
        work: function (rs, rt, rd, kwargs) {
            kwargs.register_file.write(rd, kwargs.register_file.read(rs) - kwargs.register_file.read(rt));
        }
    },
    "multd": {
        description: "floating point rs * rt => rd",
        speed: 10,
        work: function (rs, rt, rd, kwargs) {
            kwargs.register_file.write(rd, kwargs.register_file.read(rs) * kwargs.register_file.read(rt));
        }
    },
    "divd": {
        description: "floating point rs / rt => rd",
        speed: 40,
        work: function (rs, rt, rd, kwargs) {

            kwargs.register_file.write(rd, kwargs.register_file.read(rs) / kwargs.register_file.read(rt));
        }
    },
};


class Instruction {
    constructor(op, rs, rt, rd) {
        if (!op in operations)
            throw "undefined operation type: " + op;
        this.op = op;
        this.rs = rs;
        this.rt = rt;
        this.rd = rd;
    }

    work (kwargs) {
        operations[this.op].work(this.rs, this.rt, this.rd, kwargs);
    }

    toString() {
        return "(" + this.op + " " + this.rs + " " + this.rt + " " + this.rd + ")";
    }
}


//Memory use integer address, integer value
class Memory {
    constructor() {
        this.data = {};
    }

    read(address, offset=0) {
        let local_address = address;
        let local_offset = address;

        if (typeof address === String)
            local_address = Number.parseInt(address);
        if (typeof offset === String) {
            local_offset = Number.parseInt("" + offset);
        }

        local_address += local_offset;
        local_address = Number.floor(local_address);

        if (!local_address in this.data)
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


class MemoryBuffer {
    constructor (size) {
        if (size <= 0)
            throw "buffer size is not greater than 0";
        this.buffer = [];
        for (let i = 0; i < size; ++i)
            this.buffer.push({busy: false, address: ""})
    }
    test_and_set (address) {
        let entry = _.findWhere(this.buffer, {busy: false});
        if (entry !== undefined)
        {
            entry.address = address;
            entry.busy = true;
            return true;
        }
        else
            return false;

    }
    unset (address) {
        let entry = _.findWhere(this.buffer, {address: address});
        if (entry !== undefined)
        {
            entry.address = "";
            entry.busy = false;
            return true;
        }
        else
            return false;
    }
}


//Memory use string address, number value
class RegisterFile {
    constructor ()
    {
        this.data = {};
    }
    read (address) {
        if (! address in this.data)
            this.data[address] = 0;
        return this.data[address];
    }
    write (address, value) {
        return this.data[address] = value;
    }
}

class FPU {
    constructor(memory=new Memory(), load_buffer_size=3, store_buffer_size=3) {
        //IN TEST
        // this.instruction_list = [];
        this.instruction_list = [
            new Instruction("ld", "+34", "R2", "F6"),
            new Instruction("ld", "+45", "R3", "F2"),
            new Instruction("multd", "F2", "F4", "F0"),
            new Instruction("subd", "F6", "F2", "F8"),
            new Instruction("divd", "F0", "F6", "F10"),
            new Instruction("addd", "F8", "F2", "F6"),
        ];
        this.cycle_passed = 0;
        this.memory = memory;
        this.register_file = new RegisterFile();
        this.to_complete = {}; // key: cycle, value: list of instructions which is to complete in this cycle

        this.load_buffer = new MemoryBuffer(load_buffer_size);
        this.store_buffer = new MemoryBuffer(store_buffer_size);
    }

    // 时钟度过n个周期
    cycle_pass(n=1) {
        if (n < 0) {
            console.log("warning: Do not support time machine now")
        }
        for (let i = 0; i < n; ++i)
            this.single_cycle_pass();
    }

    single_cycle_pass() {
        this.cycle_passed += 1;

        // complete instructions
        if (this.cycle_passed in this.to_complete)
        {
            _.each(this.to_complete[this.cycle_passed], _.bind(function (ins) {
                ins.work({memory: this.memory, register_file: this.register_file});
            }, this));
        }
        // try to issue new instructions
    }
}