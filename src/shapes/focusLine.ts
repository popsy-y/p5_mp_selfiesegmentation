import p5 from 'p5';
// import type { SamplePoint } from '../helpers.ts';
import { palettes, PLT_LEN } from '../palette.ts';

export function drawFocusLine(
    p: p5,
    paletteIdx: number,
    centroid: p5.Vector,
    blades: number
){
    const ua = p.PI*2 / blades

    const cxp = p.width * centroid.x
    const cyp = p.height * centroid.y

    p.strokeWeight(20)

    const rad = Math.sqrt(p.pow(p.width/2, 2) + p.pow(p.height/2, 2))

    p.push()

    for (let i = 0; i < blades; i++) {
        p.stroke(palettes[paletteIdx][i % PLT_LEN])

        const px = Math.cos(ua * i) * rad
        const py = Math.sin(ua * i) * rad
        p.line(cxp, cyp, px + p.width/2, py + p.height/2)
    }

    p.pop()
}
