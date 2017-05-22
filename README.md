# Tomasulo-emulator
A Tomasulo algorithm  emulator
## Run
open `index.html` with *chrome* or any other web browser.
## Tomasolu算法执行流程

在每个时钟周期：

    1. 按序发射一条指令
        1. LD和SW指令放到缓冲区中，缓冲区满则停顿一个周期不发射
           将结果寄存器状态标记为对应的缓冲区
        2. FP指令放到对应的RS中，RS忙则停顿一个周期不发射
           将结果寄存器状态标记为对应的RS
    2. 完成指令
        LD 完成寄存器写入，将寄存器状态清除，通知RS中等待LD指令结果的指令
        FP指令完成后清楚寄存器状态，通知RS中等待指令结果的指令
    3. 开始执行指令
        Rs中所有V已经准备好的指令开始执行

