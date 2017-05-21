// 实现一个自定义组件tomasolu-view
Vue.component("tomasolu-view", {
    template: $("#template-tomasolu-view").html(),
    props: {
        fpu: FPU, memory: Memory
    },
    methods: {
        next_cycle: function () {
            alert("next cycle");
        },
        last_cycle: function () {
            alert("last cycle");
        },
    }
});

new Vue({
    el: "#te-view-div",
    data: {
        memory: new Memory(),
        fpu: new FPU(this.memory)
    }
});

function test() {
}