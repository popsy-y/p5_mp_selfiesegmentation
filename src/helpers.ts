import p5 from 'p5'

export const vec2 = (x = 0, y = 0) => new p5.Vector(x, y)
export const vec3 = (x = 0, y = 0, z = 0) => new p5.Vector(x, y, z)

export const v2one = () => vec2(1, 1)
export const v3one = () => vec3(1, 1, 1)
