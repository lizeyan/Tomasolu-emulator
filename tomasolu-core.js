//实现Tomasolu算法

//define all operations and their exec_time

const add_compute_num = 1;
const multi_compute_num = 1;

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
        exec_result: function (a, b) {
            return a + b;
        }
    },
    "subd": {
        description: "floating point rs - rt => rd",
        exec_time: 2,
        write_back_address: function (ins, context) {
            return ins.rd;
        },
        exec_result: function (a, b) {
            return a - b;
        }
    },
    "multd": {
        description: "floating point rs * rt => rd",
        exec_time: 10,
        write_back_address: function (ins, context) {
            return ins.rd;
        },
        exec_result: function (a, b) {
            return a * b;
        }
    },
    "divd": {
        description: "floating point rs / rt => rd",
        exec_time: 40,
        write_back_address: function (ins, context) {
            return ins.rd;
        },
        exec_result: function (a, b) {
            return a / b;
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

class ReservationContent{
    constructor(op, rs, ins, satisfy=false, busy=false, time=0, name="", vj="", vk="", qj="", qk=""){
        this.name = name;
        this.satisfy = satisfy; //是否满足两个寄存器都可取
        this.busy = busy;
        this.time = time;
        this.ins = ins;
        this.op = op;
        this.rs = rs;
        this.vj = vj;
        this.vk = vk;
        this.qj = qj;
        this.qk = qk;
        this.compute_time = 0; //这条指令已经计算的时间
        this.rank = 0; //在保留站的第几位
        this.ans = 0; //计算的结果
    }
}

class MemoryBufferContent{
    constructor(ins, satisfy=false, busy=false, name="", A=""){
        this.name = name;
        this.satisfy = satisfy; //load或store的源可取
        this.busy = busy;
        this.running = false;
        this.data = 0;
        this.ins = ins;
        this.op = ins.op;
        this.rs = ins.rs;
        this.A = ins.rd;
        this.begin_time = 0; //这条指令开始计算的时间
        this.rank = 0; //在保留站的第几位
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
            return this.write(local_address, 121);
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
        var jsonMemory = JSON.stringify(this.data);
        return jsonMemory;
    }
}


class MemoryBuffer {
    constructor (load_buffer_size = 3, store_buffer_size = 3, fpu) {
        this.fpu = fpu;
		this.load_buffer_size = load_buffer_size;
		this.store_buffer_size = store_buffer_size;
		this.load_buffer_used = 0;
		this.store_buffer_used = 0;
		this.load_buffer = new Array(load_buffer_size);
        this.store_buffer = new Array(store_buffer_size);
        for(let i = 0; i < load_buffer_size; ++i)
            this.load_buffer[i] = null;
        for(let i = 0; i <store_buffer_size; ++i)
            this.store_buffer[i] = null;
		
    }
    // load或者buffer队列是否有空闲的位置
    is_free (ins) {
        if(ins.op === "ld")
		{
            if(this.load_buffer_used < this.load_buffer_size)
                return true;
            else
                return false;
        }
		else if(ins.op === "st")
		{
            if(this.store_buffer_used < this.store_buffer_size)
                return true;
            else
                return false;
        }
    }
    // issue一条load或者store指令，ins是Instruction类型
    issue(ins) {
        if (ins.op == "ld")
        {
            if(this.load_buffer_used >= this.load_buffer_size) 
                throw "can't issue " + ins.op;
            else
                this.load_buffer_used += 1;
        }
        else
        {
            if(this.store_buffer_used >= this.store_buffer_size) 
                throw "can't issue " + ins.op;
            else
                this.store_buffer_used += 1;
        }

        var this_content = new MemoryBufferContent(ins);
        if (ins.op == "ld") // Load
        {
            this_content.satisfy = true;
            this_content.busy = true;
            let rank = 0;

            for(let i = 0; i < this.load_buffer_size; ++i)
                if(this.load_buffer[i] == null)
                {
                    
                    rank = i;
                    this_content.rank = rank;
                    // 设置写入寄存器的表达式
                    this_content.name = ins.op + this_content.rank.toString();
                    this.load_buffer[i] = this_content;
                    this.fpu.register_file.set_expression(ins.rs, this_content.name);
                    console.log("load buffer issued", this.load_buffer[i]);
                    break;
                }
            
        }
        else // Store
        {
            this_content.busy = true;
            if(this.fpu.register_file.get_expression(ins.rs) == "") // 寄存器中有可供store的值
            {
                this_content.data = this.fpu.register_file.read(ins.rs);
                this_content.satisfy = true;   
            }
            else
            {
                this_content.satisfy = false; 
            }
            let rank = 0;
            for(let i = 0; i < this.store_buffer_size; ++i)
                if(this.store_buffer[i] == null)
                {   
                    rank = i;
                    this_content.rank = rank;
                    // 设置写入寄存器的表达式
                    this_content.name = ins.op + this_content.rank.toString();
                    this.store_buffer[i] = this_content;
                    break;
                }
        }
    }
    /*
    * 内存缓冲区执行操作:检查寄存器状态,开始执行指令,若干周期之后指令完成的时候负责写回寄存器(并修改寄存器表达式)
    * 或者写回到内存负责维护指令的状态
    * current_cycle: 当前的时钟周期数
     */
    work (current_cycle) {

        // 判断是否开始执行，设置开始执行时间
        for(let i = 0; i < this.load_buffer_size; ++i)
            if(this.load_buffer[i] != null && this.load_buffer[i].busy)
                if(this.load_buffer[i].satisfy && !this.load_buffer[i].running)
                {
                    this.load_buffer[i].begin_time = current_cycle;
                    this.load_buffer[i].running = true;
                }
        for(let i = 0; i < this.store_buffer_size; ++i)
        {
            if(this.store_buffer[i] != null && this.store_buffer[i].busy && !this.load_buffer[i].running)
            {
                if(this.store_buffer[i].satisfy)
                {
                    this.store_buffer[i].begin_time = current_cycle;
                    this.store_buffer[i].running = true;
                }
                else
                {
                    if(this.fpu.register_file.get_expression(this.store_buffer[i].rs) == "")
                    {
                        this.store_buffer[i].satisfy = true;
                        this.store_buffer[i].begin_time = current_cycle;
                        this.store_buffer[i].running = true;
                    }
                }
            }
        }


        for(let i = 0; i < this.load_buffer_size; ++i)
            if(this.load_buffer[i] != null && this.load_buffer[i].busy && this.load_buffer[i].satisfy)
            {
                if(current_cycle - this.load_buffer[i].begin_time === operations[this.load_buffer[i].op].exec_time)
                {
                    // DO EXECUTE
                    this.load_buffer[i].data = this.fpu.memory.read(this.load_buffer[i].A);
                    console.log("load buffer content", this.load_buffer[i]);
                }
            }

         for(let i = 0; i < this.store_buffer_size; ++i)
            if(this.store_buffer[i] != null && this.store_buffer[i].busy && this.store_buffer[i].satisfy)
            {
                if(current_cycle - this.store_buffer[i].begin_time === operations[this.store_buffer[i].op].exec_time)
                {
                    // DO EXECUTE
                    this.store_buffer[i].data = this.fpu.register_file.read(this.store_buffer[i].rs);
                }
            }
        
    }

    /*
    * 如果这个周期有要写到寄存器或内存的，先进行写回
    * current_cycle: 当前的时钟周期数
    */
    write_back (current_cycle) {
        for(let i = 0; i < this.load_buffer_size; ++i)
            if(this.load_buffer[i] != null && this.load_buffer[i].busy)
            {
                if(current_cycle - this.load_buffer[i].begin_time === operations[this.load_buffer[i].op].exec_time + 1)
                {
                    // DO WRITEBACK
                    if(this.fpu.register_file.get_expression(this.load_buffer[i].rs) == this.load_buffer[i].name)
                    {
                        this.fpu.register_file.write(this.load_buffer[i].rs, this.load_buffer[i].data);
                        //已写回的表达式为空
                        this.fpu.register_file.set_expression(this.load_buffer[i].rs, "");
                    }
                
                    this.load_buffer_used -= 1;
                    //写入这条指令的写回时间
                    this.fpu.instruction_status_change_time[this.load_buffer[i].ins]["write_time"] = current_cycle;
                    this.fpu.instruction_status_change_time[this.load_buffer[i].ins]["finish_time"] = current_cycle - 1;
                    this.load_buffer[i] = null;
                }
            }

        for(let i = 0; i < this.store_buffer_size; ++i)
            if(this.store_buffer[i] != null && this.store_buffer[i].busy)
            {
                if(current_cycle - this.store_buffer[i].begin_time === operations[this.lstore_buffer[i].op].exec_time + 1)
                {
                    // DO WRITE MEMORY
                    this.fpu.memory.write(this.store_buffer[i].A, this.store_buffer[i].data);
                    
                    this.store_buffer_used -= 1;
                    //写入这条指令的写回时间
                    this.fpu.instruction_status_change_time[this.store_buffer[i].ins]["write_time"] = current_cycle;
                    this.fpu.instruction_status_change_time[this.store_buffer[i].ins]["finish_time"] = current_cycle - 1;
                    this.store_buffer[i] = null;
                }
            }


    }

    toString() {
        var jsonLoadBuffer = JSON.stringify(this.load_buffer);
        var jsonStoreBuffer = JSON.stringify(this.store_buffer);
        var rt = "\nLoad Buffer:\n" + jsonLoadBuffer + "\nStore Buffer:\n" + jsonStoreBuffer;
        return rt;
    }
}


class ReservationStation {
    constructor (fpu, add_size=3, multi_size=2) {
        this.fpu = fpu;
        this.add_size = add_size;
        this.multi_size = multi_size;
        this.add_used = 0;
        this.multi_used = 0;
        this.add_compute_work = new Array(add_compute_num); //当前被哪个保留站占用计算资源，-1表示闲置
        this.multi_compute_work = new Array(multi_compute_num); //当前被哪个保留站占用计算资源，-1表示闲置
        this.add_reservation_stations = new Array(add_size);
        this.multi_reservation_stations = new Array(multi_size);
        for(let i = 0; i < add_size; ++i)
            this.add_reservation_stations[i] = null;
        for(let i = 0; i < multi_size; ++i)
            this.multi_reservation_stations[i] = null;
        for(let i = 0; i < add_compute_num; ++i)
            this.add_compute_work[i] = -1;
        for(let i = 0; i < add_compute_num; ++i)
            this.multi_compute_work[i] = -1;
    }
    //是否还有空闲的位置, ins是Instruction类型
    is_free (ins) 
    {
        if(ins.op == "addd" || ins.op == "subd")
        {
            if(this.add_used < this.add_size)
                return true;
            else
                return false;
        }
        else if(ins.op == "multd" || ins.op == "divd")
        {
            if(this.multi_used < this.multi_size)
                return true;
            else
                return false;
        }
    }
    //发射一条指令
    issue (ins) {
        let type = 0; // 1为加减，2为乘除
        if(ins.op == "addd" || ins.op == "subd")
            type = 1;
        else if(ins.op == "multd" || ins.op == "divd")
            type = 2;
        else
            return;
        // 如果保留站已满，那么issue失败
        if (type === 1)
        {
            if(this.add_used >= this.add_size) 
                throw "can't issue 3 " + ins.op;
        }
        else
        {
            if(this.multi_used >= this.multi_size) 
                throw "can't issue 4 " + ins.op;
        }
        // 更新保留站使用大小
        if (type === 1) 
            this.add_used += 1; 
        else
            this.multi_used += 1;
        // 为这个待issue的类构建一个新的保留站项目
        var this_content = new ReservationContent(ins.op, ins.rs, ins);
        // 检测rt寄存器是否可用
        if(this.fpu.register_file.get_expression(ins.rt) == ""){
            this_content.vj = this.fpu.register_file.read(ins.rt);
        }else{
            this_content.qj = this.fpu.register_file.get_expression(ins.rt);
        }
        // 检测rd寄存器是否可用
        if(this.fpu.register_file.get_expression(ins.rd) == ""){
            this_content.vk = this.fpu.register_file.read(ins.rd)
        }else{
            this_content.qk = this.fpu.register_file.get_expression(ins.rd);
        }
        // 判断是否两个寄存器都可用，设置satisfy
        if(this_content.qj == "" && this_content.qk == "")
            this_content.satisfy = true;
        else
            this_content.satisfy = false;
        // 将这个保留站项目加入列表中
        let rank = 0;
        if (type == 1)
        {
            for(let i = 0; i < this.add_size; ++i)
                if(this.add_reservation_stations[i] === null){
                    this.add_reservation_stations[i] = this_content;
                    rank = i;
                    break;
                }
        }
        else
        {
            for(let i = 0; i < this.multi_size; ++i)
                if(this.multi_reservation_stations[i] === null){
                    this.multi_reservation_stations[i] = this_content;
                    rank = i;
                    break;
                }
        }
        this_content.rank = rank;
        // 设置写入寄存器的表达式
        this_content.name = ins.op + this_content.rank.toString();
        this.fpu.register_file.set_expression(ins.rs, this_content.name);
        // 如果条件满足，那么让其开始运行
        if(this_content.satisfy){
            if(type == 1){
                for(let i = 0; i < add_compute_num; ++i)
                    if(this.add_compute_work[i] == -1){
                        this.add_compute_work[i] = this_content.rank;
                        this_content.busy = true;
                        this_content.ans = operations[this_content.op].exec_result(this_content.vj, this_content.vk);
                        break;
                    }
            }else{
                for(let i = 0; i < multi_compute_num; ++i)
                    if(this.multi_compute_work[i] == -1){
                        this.multi_compute_work[i] = this_content.rank;
                        this_content.busy = true;
                        this_content.ans = operations[this_content.op].exec_result(this_content.vj, this_content.vk);
                        break;
                    }
            }
        }
    }
    /*
     * 保留站执行操作:检查寄存器状态,开始执行指令,若干周期之后指令完成的时候负责写回寄存器并修改寄存器表达式.
     * 负责维护指令的状态
     * current_cycle: 当前的时钟周期数
     */
    work (current_cycle) {
        //更新所有保留站的寄存器，将q转成v
        for(let i = 0; i < this.add_size; ++i){
            //如果不存在或已经满足条件直接跳过
            if(this.add_reservation_stations[i] == null || this.add_reservation_stations[i].satisfy) continue;
            //更新vj和vk
            if(this.add_reservation_stations[i].vj == "")
                if(this.fpu.register_file.get_expression(this.add_reservation_stations[i].ins.rt) == "")
                    this.add_reservation_stations[i].vj = this.fpu.register_file.read(this.add_reservation_stations[i].ins.rt)
            if(this.add_reservation_stations[i].vk == "")
                if(this.fpu.register_file.get_expression(this.add_reservation_stations[i].ins.rd) == "")
                    this.add_reservation_stations[i].vk = this.fpu.register_file.read(this.add_reservation_stations[i].ins.rd)
            //更新所有满足条件的保留站项目
            if(this.add_reservation_stations[i].vj != "" && this.add_reservation_stations[i].vk != "")
                this.add_reservation_stations[i].satisfy = true;
        }
        for(let i = 0; i < this.multi_size; ++i){
            //如果不存在或已经满足条件直接跳过
            if(this.multi_reservation_stations[i] == null || this.multi_reservation_stations[i].satisfy) continue;
            //更新vj和vk
            if(this.multi_reservation_stations[i].vj == "")
                if(this.fpu.register_file.get_expression(this.multi_reservation_stations[i].ins.rt) == "")
                    this.multi_reservation_stations[i].vj = this.fpu.register_file.read(this.multi_reservation_stations[i].ins.rt)
            if(this.multi_reservation_stations[i].vk == "")
                if(this.fpu.register_file.get_expression(this.multi_reservation_stations[i].ins.rd) == "")
                    this.multi_reservation_stations[i].vk = this.fpu.register_file.read(this.multi_reservation_stations[i].ins.rd)
            //更新所有满足条件的保留站项目
            if(this.multi_reservation_stations[i].vj != "" && this.multi_reservation_stations[i].vk != "")
                this.multi_reservation_stations[i].satisfy = true;
        }

        //对仍存在的计算资源，分配给已经满足的保留站项目
        for(let i = 0; i < add_compute_num; ++i){
            if(this.add_compute_work[i] == -1){
                //寻找所有满足条件却未开始计算的保留项，为最早issue的那个分配
                let min_time = 1123456789;
                let min_rank = 1;
                let find = false;
                for(let j = 0; j < this.add_size; ++j){
                    if(this.add_reservation_stations[j] != null && this.add_reservation_stations[j].satisfy && !this.add_reservation_stations[j].busy 
                        && this.fpu.instruction_status_change_time[this.add_reservation_stations[j].ins]["issue_time"] < min_time){
                        min_time = this.fpu.instruction_status_change_time[this.add_reservation_stations[j].ins]["issue_time"];
                        min_rank = j;
                        find = true;
                    }
                }
                if(!find) break;
                //为min_rank的保留站项分配计算资源
                this.add_compute_work[i] = this.add_reservation_stations[min_rank].rank;
                this.add_reservation_stations[min_rank].busy = true;
                this.add_reservation_stations[min_rank].ans = operations[this.add_reservation_stations[min_rank].op].exec_result(this.add_reservation_stations[min_rank].vj, this.add_reservation_stations[min_rank].vk);
            }
        }
        for(let i = 0; i < multi_compute_num; ++i){
            if(this.multi_compute_work[i] == -1){
                //寻找所有满足条件却未开始计算的保留项，为最早issue的那个分配
                let min_time = 1123456789;
                let min_rank = 1;
                let find = false;
                for(let j = 0; j < this.multi_size; ++j){
                    if(this.multi_reservation_stations[j] != null && this.multi_reservation_stations[j].satisfy && !this.multi_reservation_stations[j].busy 
                        && this.fpu.instruction_status_change_time[this.multi_reservation_stations[j].ins]["issue_time"] < min_time){
                        min_time = this.fpu.instruction_status_change_time[this.multi_reservation_stations[j].ins]["issue_time"];
                        min_rank = j;
                        find = true;
                    }
                }
                if(!find) break;
                //为min_rank的保留站项分配计算资源
                this.multi_compute_work[i] = this.multi_reservation_stations[min_rank].rank;
                this.multi_reservation_stations[min_rank].busy = true;
                this.multi_reservation_stations[min_rank].ans = operations[this.multi_reservation_stations[min_rank].op].exec_result(this.multi_reservation_stations[min_rank].vj, this.multi_reservation_stations[min_rank].vk);
            }
        }

        //将所有在计算的，计算时间加一
        for(let i = 0; i < this.add_size; ++i)
            if(this.add_reservation_stations[i] != null && this.add_reservation_stations[i].busy)
                this.add_reservation_stations[i].compute_time += 1;
        for(let i = 0; i < this.multi_size; ++i)
            if(this.multi_reservation_stations[i] != null && this.multi_reservation_stations[i].busy)
                this.multi_reservation_stations[i].compute_time += 1;
    }

    /*
    * 如果这个周期有要写到寄存器或内存的，先进行写回 
    * current_cycle: 当前的时钟周期数
    */
    write_back (current_cycle) {
        for(let i = 0; i < this.add_size; ++i)
        {
            if(this.add_reservation_stations[i] === null) 
                continue;
            // 如果该指令已经计算完毕，那么进行写回操作
            if(this.add_reservation_stations[i].compute_time === operations[this.add_reservation_stations[i].op].exec_time)
            {
                // 如果要写入的寄存器的名称和这个保留站项的名字一致，就写入
                if(this.fpu.register_file.get_expression(this.add_reservation_stations[i].rs) === this.add_reservation_stations[i].name)
                {
                    this.fpu.register_file.write(this.add_reservation_stations[i].rs, this.add_reservation_stations[i].ans);
                    //已写回的表达式为空
                    this.fpu.register_file.set_expression(this.add_reservation_stations[i].rs, "");
                    console.log("add writeback rs : ", this.add_reservation_stations[i].rs)
                }
                //释放这个保留站的位置
                this.add_used -= 1;
                //释放计算资源
                console.log("before release compute",this.add_reservation_stations[i]);
                for(let i = 0; i < add_compute_num; ++i)
                    if(this.add_reservation_stations[i] === null)
                        if(this.add_compute_work[i] === this.add_reservation_stations[i].rank)
                            this.add_compute_work[i] = -1;
                //写入这条指令的写回时间
                this.fpu.instruction_status_change_time[this.add_reservation_stations[i].ins]["write_time"] = current_cycle;
                this.fpu.instruction_status_change_time[this.add_reservation_stations[i].ins]["finish_time"] = current_cycle - 1;
                this.add_reservation_stations[i] = null;
            }
        }

        for(let i = 0; i < this.multi_size; ++i)
        {
            if(this.multi_reservation_stations[i] == null) 
                continue;
            // 如果该指令已经计算完毕，那么进行写回操作
            if(this.multi_reservation_stations[i].compute_time == operations[this.multi_reservation_stations[i].op].exec_time)
            {
                // 如果要写入的寄存器的名称和这个保留站项的名字一致，就写入
                if(this.fpu.register_file.get_expression(this.multi_reservation_stations[i].rs) == this.multi_reservation_stations[i].name)
                {
                    this.fpu.register_file.write(this.multi_reservation_stations[i].rs, this.multi_reservation_stations[i].ans);
                    //已写回的表达式为空
                    this.fpu.register_file.set_expression(this.multi_reservation_stations[i].rs, "");
                }
                //释放这个保留站的位置
                this.multi_used -= 1;
                //释放计算资源
                for(let i = 0; i < multi_compute_num; ++i)
                    if(this.multi_compute_work[i] == this.multi_reservation_stations[i].rank)
                        this.multi_compute_work[i] = -1;
                //写入这条指令的写回时间
                this.fpu.instruction_status_change_time[this.multi_reservation_stations[i].ins]["write_time"] = current_cycle;
                this.fpu.instruction_status_change_time[this.multi_reservation_stations[i].ins]["finish_time"] = current_cycle - 1;
                this.multi_reservation_stations[i] = null;
            }
        }
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
        this.instruction_status_change_time = {}; // 指令的运行状态的三个时间，发射指令时间(issue_time)，执行完毕时间(finish_time)，写回结果时间(write_time)
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
            let op = to_issue.op;
            let device = null;

            if (op === "ld" || op === "st")
                device = this.memory_buffer;
            else if (op in {"addd": null, "subd": null, "multd": null, "divd": null})
                device = this.reservation_station;
            else
                throw "undefined operation " + op;

            // 内存读写缓冲区或保留站有空闲，可以发射指令
            if (device.is_free(to_issue))
            {
                this.instruction_status_change_time[to_issue] = {};
                this.instruction_status_change_time[to_issue]["issue_time"] = this.cycle_passed;
                device.issue(to_issue);
                console.log("issued " + to_issue);
                this.next_to_issue += 1;
            }
        }

        //保留站和内存缓冲区工作，直到状态没有再变化
        this.reservation_station.write_back(this.cycle_passed)
        this.memory_buffer.write_back(this.cycle_passed)
        this.reservation_station.work(this.cycle_passed);
        this.memory_buffer.work(this.cycle_passed);
        // console.log("load buffer ", this.memory_buffer.load_buffer);
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
            fpu.add_instruction(new Instruction("ld", "F6", "+34", ""));
            fpu.add_instruction(new Instruction("ld", "F2", "+45", ""));
            fpu.add_instruction(new Instruction("multd", "F0", "F2", "F4"));
            fpu.add_instruction(new Instruction("subd", "F8", "F6", "F2"));
            fpu.add_instruction(new Instruction("divd", "F10", "F0", "F6"));
            fpu.add_instruction(new Instruction("addd", "F6", "F8", "F2"));
            let terminated = false;
            for (let i = 0; i < 70; ++i) {
                fpu.single_cycle_pass();

                if (fpu.num_unfinished() === 0) {
                    terminated = true;
                    break;
                }
            }
            if (!terminated)
            {
                console.log("\n\n你们真是逆天狂神！！！\n\n\n");
                console.log("next to issue:", fpu.next_to_issue);
                console.log("next inst to issue:", fpu.instruction_list[fpu.next_to_issue]);
                console.log("memory buffer ", fpu.memory_buffer.toString());
                console.log("registers\n", fpu.register_file.toString());
                throw "unterminated sequence";
            }
            
        },
        function () {

        }
    ];
    // apply_test(test_function_list, alert);
    apply_test(test_function_list);
});
