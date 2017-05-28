//实现Tomasolu算法

//define all operations and their exec_time
const operations = {
    "ld": {
        description: "load Immediate(rs) to Register(rt)",
        exec_time: 2,
        exec_result: function (ins, context) {
            return context.memory.read(ins.rs);
        }
    },
    "st": {
        description: "store Register(rs) to Immediate(rt) ",
        exec_time: 2,
    },
    "addd": {
        description: "floating point rs + rt => rd",
        exec_time: 2,
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


class MemoryBuffer {
    constructor (load_buffer_size, store_buffer_size, fpu) {
        this.fpu = fpu;
    }
    // issue一条load或者store指令，ins是Instruction类型
    issue(ins) {
        //TODO
    }
    // load或者buffer队列是否有空闲的位置
    is_free (ins) {
        //TODO
        return true;
    }
    /*
    * 内存缓冲区执行操作:检查寄存器状态,开始执行指令,若干周期之后指令完成的时候负责写回寄存器(并修改寄存器表达式)或者写回到内存
    * 负责维护指令的状态
    * current_cycle: 当前的时钟周期数
    * iter: 这一周期第几次调用到work
    * return: true or false, 表示这一周期有没有修改寄存器的值和表达式
     */
    work (current_cycle, iter) {
        //TODO
        return false;
    }
}


class ReservationStation {
    constructor (fpu) {
        this.fpu = fpu;
        //TODO
    }
    //是否还有空闲的位置, ins是Instruction类型
    is_free (ins) {
        //TODO
        return true;
    }
    //发射一条指令
    issue (ins) {
        //TODO
    }
    /*
     * 保留站执行操作:检查寄存器状态,开始执行指令,若干周期之后指令完成的时候负责写回寄存器并修改寄存器表达式.
     * 负责维护指令的状态
     * current_cycle: 当前的时钟周期数
     * iter: 这一周期第几次调用到work
     * return: true or false, 表示这一周期有没有修改寄存器的值和表达式
     */
    work (current_cycle, iter) {

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
            this.data[address] = {expression: "", value: 0};
        return this.data[address].value;
    }
    write (address, value) {
        if (! (address in this.data))
            this.data[address] = {expression: "", value: 0};
        return this.data[address].value = value;
    }
    //得到寄存器的表达式，没有表达式则返回""
    get_expression (address) {
        if (! (address in this.data))
            this.data[address] = {expression: "", value: 0};
        return this.data[address].expression;
    }
    //设置寄存器的表达式
    set_expression (address, expression) {
        if (! (address in this.data))
            this.data[address] = {expression: "", value: 0};
        return this.data[address].expression = expression;
    }
    //清除寄存器的表达式
    clear_expression (address) {
        this.set_expression(address, "");
    }
    toString () {
        return JSON.stringify(this.data);
    }
}

class FPU {
    constructor(memory=new Memory(), load_buffer_size=3, store_buffer_size=3) {
        this.instruction_list = []; // 指令列表
        this.instruction_status = {}; // 指令状态: issue, exec, finished
        this.next_to_issue = 0; //下一条要被issue的指令的index
        this.cycle_passed = 0; //当前过去了几个时钟周期

        this.memory = memory;
        this.register_file = new RegisterFile();
        this.context = {"memory": this.memory, "register_file": this.register_file};
        this.memory_buffer = new MemoryBuffer(load_buffer_size, store_buffer_size, this);
        this.reservation_station = new ReservationStation(this);
    }

    add_instruction(ins) {
        this.instruction_list.push(ins);
        this.instruction_status[ins] = "issue";
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

        // 发射一条指令
        if (this.next_to_issue < this.num_instruction()) // has unissued instructions
        {
            let to_issue = this.instruction_list[this.next_to_issue];
            let instruction = to_issue.instruction;
            let op = instruction.op;
            let device = null;

            if (op === "ld" || op === "st")
                device = this.memory_buffer;
            else if (op in {"addd": null, "subd": null, "multd": null, "divd": null})
                device = this.reservation_station;
            else
                throw "undefined operation " + op;

            // 内存读写缓冲区或保留站有空闲，可以发射指令
            if (device.is_free(instruction))
            {
                device.issue(instruction);
                console.log("issued " + instruction);
            }
        }


        //保留站和内存缓冲区工作，直到状态没有再变化
        let status_changed = true;
        let iter = 0;
        while (status_changed)
        {
            iter += 1;
            status_changed = this.reservation_station.work(this.cycle_passed, iter);
            status_changed |= this.memory_buffer.work(this.cycle_passed, iter);
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
