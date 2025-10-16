import p5 from 'p5'
import { palettes } from './palette'

export const drawEffect = (p: p5, _background: p5.Graphics, _mask: p5.Graphics) => {
    const now = p.millis() / 1000

    p.push()
    p.translate(0, p.height / 2)

    p.noFill()
    p.strokeWeight(30)


    const cpIdx = Math.floor(Math.floor(now * 100) / 100) % palettes.length
    const cpFrom = palettes[cpIdx]
    const cpTo = palettes[(cpIdx + 1) % palettes.length]

    const count = 15
    const uAng = p.TWO_PI / count
    for (let i = 0; i < count; i++) {
        const cf = cpFrom[i % cpFrom.length]
        const ct = cpTo[i % cpTo.length]
        const c = p.lerpColor(p.color(cf), p.color(ct), now / 2 % 1)
        p.stroke(c)

        p.push()
        p.translate(p.width / count * i, p.sin((i / 2 + now / 10) % p.TWO_PI) * 300)
        p.rotate(uAng * i + now / 100 * i)
        nGon(p, 300, 3 + i % 6, 0, 0)
        p.pop()
    }

    p.pop()
}


const nGon = (p: p5, rad: number, verts: number, px: number, py: number, pz = 0) => {
    p.push()
    p.translate(px, py, pz)

    p.beginShape()

    for (let i = 0; i < verts; i++) {
        const angle = p.TWO_PI * (i / verts)
        p.vertex(p.cos(angle) * rad, p.sin(angle) * rad)
    }

    p.endShape(p.CLOSE)

    p.pop()
}
