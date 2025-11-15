import p5 from 'p5'

export const resetStyle = (p: p5) => {
    p.fill(255)
    p.stroke(0)
    p.strokeWeight(1)
    p.rectMode("corner")
}
