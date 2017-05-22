//实现Tomasolu算法

//define all operations and their exec_time
const operations = {
    "ld": {
        description: "load Register(rs) + Immediate(rt) to Register(rd)",
        exec_time: 2,
        write_time: 1,
        source_address: function (ins, context) {
            return context.register_file.read(ins.rt) + Number.parseInt(ins.rs);
        },
        write_back_address: function (ins, context) {
            return ins.rd;
        },
        exec_result: function (ins, context) {
            return context.memory.read(operations["ld"].source_address(ins, context));
        }
    },
    "addd": {
        description: "floating point rs + rt => rd",
        exec_time: 2,
        write_time: 1,
        write_back_address: function (ins, context) {
            return ins.rd;
        },
        exec_result: function (ins, context) {
            return context.register_file.read(ins.rs) + context.register_file.read(ins.rt);
        }
    },
    "subd": {
        description: "floating point rs - rt => rd",
        exec_time: 2,
        write_time: 1,
        write_back_address: function (ins, context) {
            return ins.rd;
        },
        exec_result: function (ins, context) {
            return context.register_file.read(ins.rs) - context.register_file.read(ins.rt);
        }
    },
    "multd": {
        description: "floating point rs * rt => rd",
        exec_time: 10,
        write_time: 1,
        write_back_address: function (ins, context) {
            return ins.rd;
        },
        exec_result: function (ins, context) {
            return context.register_file.read(ins.rs) * context.register_file.read(ins.rt);
        }
    },
    "divd": {
        description: "floating point rs / rt => rd",
        exec_time: 40,
        write_time: 1,
        write_back_address: function (ins, context) {
            return ins.rd;
        },
        exec_result: function (ins, context) {
            return context.register_file.read(ins.rs) / context.register_file.read(ins.rt);
        }
    },
};


class Instruction {
    constructor(op, rs, rt, rd) {
        if (! (op in operations))
            throw "undefined operation type: " + op;
        this.op = op;
        this.rs = rs;
        this.rt = rt;
        this.rd = rd;
        this.operation = operations[op];
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
        let local_offset = offset;

        if (typeof address === String)
            local_address = Number.parseInt(address);
        if (typeof offset === String) {
            local_offset = Number.parseInt("" + offset);
        }

        local_address += local_offset;
        local_address = Math.floor(local_address);

        if (! (local_address in this.data))
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


class LoadBuffer {
    constructor (size, memory) {
        if (size <= 0)
            throw "buffer size is not greater than 0";
        this.buffer = [];
        this.memory = memory;
        for (let i = 0; i < size; ++i)
            this.buffer.push({busy: false, address: "", cache: null})
    }
    test_and_set (address) {
        let entry = _.findWhere(this.buffer, {busy: false});
        if (entry !== undefined)
        {
            entry.address = address;
            entry.busy = true;
            entry.cache = this.memory.read(address);
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
            entry.cache = null;
            return true;
        }
        else
            return false;
    }
}


class StoreBuffer {
    constructor (buffer_size, memory)
    {
        if (buffer_size <= 0)
            throw "buffer size is not greater than 0";
        this.buffer = [];
        this.memory = memory;
        for (let i = 0; i < buffer_size; ++i)
            this.buffer.push({busy: false, address: "", cache: null})
    }
    empty () {
        return _.defaults(_.countBy(this.buffer, "busy"), {true: 0, false: 0}).true === 0;
    }
}


class ReservationStation {
    constructor () {
        //TODO
    }
    test_and_set () {
        //TODO
        return true;
    }
}

//Memory use string address, number value
class RegisterFile {
    constructor ()
    {
        this.data = {};
    }
    read (address) {
        if (! (address in this.data))
            this.data[address] = 0;
        return this.data[address];
    }
    write (address, value) {
        return this.data[address] = value;
    }

    toString () {
        return JSON.stringify(this.data);
    }
}

class FPU {
    constructor(memory=new Memory(), load_buffer_size=3, store_buffer_size=3) {
        this.instruction_list = [];
        this.next_to_issue = 0;
        this.to_write_back = {}; // key: cycle, value: list of {instruction, status} which is to complete exec
        this.to_finish = {}; // key: cycle, value: list of {instruction, status} which is to complete write back

        this.cycle_passed = 0;

        this.memory = memory;
        this.register_file = new RegisterFile();
        this.context = {"memory": this.memory, "register_file": this.register_file};

        this.load_buffer = new LoadBuffer(load_buffer_size, this.memory);
        this.store_buffer = new StoreBuffer(store_buffer_size, this.memory);
        this.reservation_station = new ReservationStation();
    }

    add_instruction(ins) {
        this.instruction_list.push({
            instruction: ins,
            status: "issue", //issue, exec, write, finished
        })

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
        console.log("current cycle: " + this.cycle_passed);

        // try to issue new instructions. issue -> exec
        if (this.next_to_issue < this.num_instruction()) // has unissued instructions
        {
            let to_issue = this.instruction_list[this.next_to_issue];
            let instruction = to_issue.instruction;
            let op = instruction.op;
            let operation = operations[op];
            let ok_to_issue = false;

            // check if it's ok to issue and do necessary work as well
            if (op === "ld")
                ok_to_issue = this.store_buffer.empty() && this.load_buffer.test_and_set(operation.source_address(instruction, this.context));
            else if (op === "sw")
                ok_to_issue = false; // TODO
            else if (op in {"addd": null, "subd": null, "multd": null, "divd": null})
                ok_to_issue = this.reservation_station.test_and_set(instruction);

            // issue
            if (ok_to_issue)
            {
                let future = this.cycle_passed + operation.exec_time;
                if (! (future in this.to_write_back))
                    this.to_write_back[future] = [];
                this.to_write_back[future].push(to_issue);
                this.next_to_issue += 1;
                to_issue.status = "exec";
                console.log("issued " + instruction);
            }
        }

        // exec -> write
        if (this.cycle_passed in this.to_write_back)
        {
            let executed_list = this.to_write_back[this.cycle_passed];
            _.each(executed_list, _.bind(function (to_write_back) {
                let future = this.cycle_passed + operations[to_write_back.instruction.op].write_time;
                if (! (future in this.to_finish))
                    this.to_finish[future] = [];
                this.to_finish[future].push(to_write_back);
                to_write_back.status = "write";
                console.log("executed " + to_write_back.instruction);
            }, this));
        }

        // write -> finish
        if (this.cycle_passed in this.to_finish)
        {
            let written_list = this.to_finish[this.cycle_passed];
            _.each(written_list, _.bind(function (to_finish) {
                // write back
                let ins = to_finish.instruction;
                let operation = to_finish.instruction.operation;
                this.register_file.write(operation.write_back_address(ins, this.context), operation.exec_result(ins, this.context));
                //check operands and start to exec some issued instructions
                //TODO
                to_finish.status = "finished";
                console.log("finished " + to_finish.instruction);
            }, this));
        }
    }

    num_unfinished () {
        // return the number of unfinished instructions
        return _.defaults(_.countBy(this.instruction_list, function (ins) {
            return ins.status !== "finished";
        }), {true: 0, false: 0}).true;
    }

    num_instruction () {
        return this.instruction_list.length;
    }
}

// test
$(function () {
    let test_function_list = [
        function () {
            let fpu = new FPU();
            fpu.add_instruction(new Instruction("ld", "+34", "R2", "F6"));
            fpu.add_instruction(new Instruction("ld", "+45", "R3", "F2"));
            fpu.add_instruction(new Instruction("multd", "F2", "F4", "F0"));
            fpu.add_instruction(new Instruction("subd", "F6", "F2", "F8"));
            fpu.add_instruction(new Instruction("divd", "F0", "F6", "F10"));
            fpu.add_instruction(new Instruction("addd", "F8", "F2", "F6"));
            let terminated = false;
            for (let i = 0; i < 100; ++i) {
                fpu.single_cycle_pass();
                if (fpu.num_unfinished() === 0) {
                    terminated = true;
                    break;
                }
            }
            if (!terminated)
                throw "unterminated sequence";
            console.log(fpu.register_file);
        },
        function () {

        }
    ];
    apply_test(test_function_list, alert);
});
