// 实现一个自定义组件tomasolu-view
Vue.component("tomasolu-view", {
    template: $("#template-tomasolu-view").html(),
    data: function () {
        let addresses = new Array(16);
        for (let i = 0; i !== 16; i += 1)
            addresses[i] = i;
        return {
            fpu: new FPU(),
            memory_query_addresses: addresses,
            loading: true,
            example_instructions_list: [
                [
                    new Instruction("ld", "F6", "+34", ""),
                    new Instruction("ld", "F2", "+45", ""),
                    new Instruction("ld", "F10", "+5", ""),
                    new Instruction("addd", "F0", "F6", "F2"),
                    new Instruction("st", "F10", "+1", ""),
                    new Instruction("st", "F0", "+1", ""),
                ],
                [
                    new Instruction("ld", "F6", "+34", ""),
                    new Instruction("ld", "F2", "+45", ""),
                    new Instruction("multd", "F2", "F4", "F0"),
                    new Instruction("subd", "F6", "F2", "F8"),
                    new Instruction("divd", "F0", "F6", "F10"),
                    new Instruction("addd", "F8", "F2", "F6"),
                ],
                [],
            ],
            forward_step: 1,
            alert_list: [],
        };
    },
    methods: {
        next_cycle: function () {
            this.fpu.cycle_pass(this.forward_step);
            this.$forceUpdate();
        },
        last_cycle: function () {
            this.popup_alert("not implemented", "danger");
        },
        range: function (begin, stop, step=1) {
            let ret = [];
            for (let i = 0; i !== stop; i += step)
                ret.push(i);
            return ret;
        },
        initialize: function () {
            this.fpu = new FPU();
            this.loading = true;
        },
        push_empty_instruction: function () {
            if (!this.loading)
                return;
            this.fpu.add_instruction(new Instruction("ld", "F1", "0", "F1"));
        },
        pop_empty_instruction: function () {
            if (!this.loading)
                return;
            this.fpu.instruction_list.pop();
        },
        load_example_instructions: function (idx) {
            this.initialize();
            _.each(this.example_instructions_list[idx], _.bind(function (ins) {
                this.fpu.add_instruction(new Instruction(ins.op, ins.rs, ins.rt, ins.rd));
            }, this));
            this.loading = false;
        },
        popup_alert: function(msg, type="default", strong="") {
            this.alert_list.push({type: type, strong: strong, msg: msg});
        }
    }
    ,
    computed: {
    }
});

Vue.component("alert-banning", {
    template: $("#tmplt-alert").html(),
    props: ["type", "strong", "msg"]
});

let app = new Vue({
    el: "#te-view-div",
    data: {
    }
});

$(function test() {
});