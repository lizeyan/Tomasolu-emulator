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
        };
    },
    methods: {
        next_cycle: function () {
            this.fpu.single_cycle_pass();
            this.$forceUpdate();
        },
        last_cycle: function () {
            alert("last cycle");
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
    },
    computed: {
    }
});

let app = new Vue({
    el: "#te-view-div",
    data: {
    }
});

$(function test() {
});