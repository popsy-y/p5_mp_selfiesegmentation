import p5 from 'p5';
// import type { SamplePoint } from '../helpers.ts';
import { palettes, PLT_LEN } from '../palette.ts';

const ANIM_LEN_MSEC = 3000

export function drawLines(
    p: p5,
    paletteIdx: number,
    slices: number
){
    p.noStroke()

    const progress = p.millis() % ANIM_LEN_MSEC / ANIM_LEN_MSEC
    const scale = Math.pow(Math.abs(Math.sin(p.millis() / 1000)), 5)

    const ul = p.height / slices

    p.rectMode("center")

    p.push()
    p.translate(p.width / 2, p.height / 2)

    for (let i = 0; i < slices; i++) {
        p.fill(palettes[paletteIdx][i % PLT_LEN])

        p.push()
        p.rotate(p.PI / 4)
        p.translate(
            0,
            ul*i - p.height/2
        )
        p.rect(0, 0, p.width * 1.5, ul * scale)
        p.pop()

        p.push()
        p.rotate(-p.PI / 4)
        p.translate(
            0,
            ul*i - p.height/2
        )
        p.rect(0, 0, p.width * 1.5 * scale, ul * scale * .4)
        p.pop()
    }
    p.pop()
}
