import p5 from 'p5';
// import type { SamplePoint } from '../helpers.ts';
import { palettes, PLT_LEN } from '../palette.ts';

const ANIM_LEN_MSEC = 3000

export function drawChecker(
    p: p5,
    paletteIdx: number,
    targetSize: number
){
    p.noStroke()

    const progress = p.millis() % ANIM_LEN_MSEC / ANIM_LEN_MSEC

    const cx = p.width / targetSize
    const cy = p.height / targetSize

    const ux = p.width / cx
    const uy = p.height / cy

    p.rectMode("center")

    for (let x = 0; x < cx; x++) {
        for (let y = 0; y < cy; y++) {
            if ((x + y) % 2 != 0) continue

            p.fill(palettes[paletteIdx][(x + y) % PLT_LEN])

            const px = x * ux + ux / 2
            const py = y * uy + uy / 2
            const centerX = p.width / 2
            const centerY = p.height / 2

            const d = Math.hypot(px - centerX, py - centerY)
            const maxD = Math.hypot(centerX, centerY)

            // 距離に応じた縮小比（0..1）、最小倍率を設定
            let sizeMult = Math.pow(1 - d / maxD, 2)
            const minMult = 0.1
            sizeMult = Math.max(sizeMult, minMult)

            // 時間経過による変化（sin波で0.5〜1.5の範囲）
            const timeMult = 0.5 + Math.sin(progress * Math.PI * 2) * 0.5

            // 距離と時間の両方を組み合わせる
            const finalMult = sizeMult * timeMult

            p.push()
            p.translate(px, py)
            p.rotate(Math.pow(1. - progress, 5) * p.PI*2)
            p.rect(0, 0, ux * finalMult, uy * finalMult)
            p.pop()
        }
    }
}
