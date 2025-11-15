export type FixedLengthArray<T, N extends number, A extends T[] = []> = 
    A['length'] extends N ? A : FixedLengthArray<T, N, [...A, T]>;

export const PLT_LEN = 5

export const palettes: FixedLengthArray<string, 5>[] = [
    ["#d7263d","#f46036","#2e294e","#1b998b","#c5d86d"],
    ["#2d3142","#bfc0c0","#ffffff","#ef8354","#4f5d75"],
    ["#386641","#6a994e","#a7c957","#f2e8cf","#bc4749"],
    ["#eac435","#345995","#e40066","#03cea4","#fb4d3d"],
    ["#e63946","#f1faee","#a8dadc","#457b9d","#1d3557"],
    ["#dad2d8","#143642","#0f8b8d","#ec9a29","#a8201a"]
]
