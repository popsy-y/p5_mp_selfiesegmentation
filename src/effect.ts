import p5 from 'p5'

export const drawEffect = (p: p5, effectBuffer: p5.Graphics, background: p5.Graphics, mask: p5.Graphics) => {
    const count = 30
    const rad = 300

    const now = p.millis() / 1000

    p.push()
    p.translate(p.width / 2, p.height / 2)

    const uAng = p.TWO_PI / count
    for (let i = 0; i < count; i++) {
        const ang = (now + uAng * i) % p.TWO_PI

        p.circle(
            p.cos(ang) * rad,
            p.sin(ang) * rad,
            50
        )
    }

    p.pop()
}