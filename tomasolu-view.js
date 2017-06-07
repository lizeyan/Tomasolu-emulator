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
            example_instructions_list: test_instructions_list,
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
            let togo = this.fpu.cycle_passed - this.forward_step;
            if (togo < 0) {
                this.popup_alert("can't go back to the time before FPU created", "danger");
                return;
            }
            let new_fpu = new FPU();
            _.each(this.fpu.instruction_list, function (ins) {
                new_fpu.add_instruction(new Instruction(ins.op, ins.rs, ins.rt, ins.rd));
            });
            this.fpu = new_fpu;
            this.fpu.cycle_pass(togo);
            this.$forceUpdate();
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
        },
        popup_alert: function(msg, type="default", strong="") {
            this.alert_list.push({type: type, strong: strong, msg: msg});
        },
        valid_or_default: function(val, _default) {
            if (val === undefined || val === null)
                return _default;
            else
                return val;
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