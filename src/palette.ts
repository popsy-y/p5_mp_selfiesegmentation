export type FixedLengthArray<T, N extends number, A extends T[] = []> = 
    A['length'] extends N ? A : FixedLengthArray<T, N, [...A, T]>;

export const PLT_LEN = 5

export const palettes: FixedLengthArray<string, 5>[] = [
    ["#220c10","#506c64","#77cbb9","#75b8c8","#cdd3d5"],
    ["#eac435","#345995","#e40066","#03cea4","#fb4d3d"],
    ["#230903","#656256","#9ebc9f","#d3b88c","#f4f2f3"],
    ["#dad2d8","#143642","#0f8b8d","#ec9a29","#a8201a"]
]
