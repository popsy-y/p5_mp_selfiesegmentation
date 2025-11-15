import p5 from 'p5';
import type { SamplePoint } from '../helpers.ts';
import { palettes, PLT_LEN } from '../palette.ts';

type Particle = {
    alive: boolean
    pos: p5.Vector
    initVel: p5.Vector
    vel: p5.Vector
    rot: number
    shapeFuncs: number[]
    life: number
    age: number
    colorOffset: number
}

const BUFFER_LEN = 100
const SPAWN_SPAN_MSEC = 500
const SPAWN_RATE = 10
const BASE_SIZE = 150
const ROT_RATE = .01
const parBuffer: Particle[] = Array.from({ length: BUFFER_LEN }, () => ({
    alive: false,
    pos: new p5.Vector(),
    initVel: new p5.Vector(),
    vel: new p5.Vector(),
    rot: Math.random(),
    shapeFuncs: [],
    life: 0,
    age: 0,
    colorOffset: 0
}))
const SHAPE_DRAWERS = [rec, cir, tri] as const

let lastSpawnIdx = 0
let lastSpawnTime = 0

/**
 * 回転する四角形を描画するモジュール
 * p.millis()を使用して時間経過に応じて回転する
 */
export function drawMultiParticle(
    p: p5,
    paletteIdx: number,
    centroid: p5.Vector,
    _samples: SamplePoint[],
    targetAvailable: boolean
) {
    if (!targetAvailable) return;

    // 中心位置を画面座標に変換
    const x = p.width * centroid.x;
    const y = p.height * centroid.y;

    p.noFill()
    p.strokeWeight(15)

    const now = p.millis()
    if (now - lastSpawnTime > SPAWN_SPAN_MSEC) {
        spawnParticles(p, SPAWN_RATE)
        lastSpawnTime = now
    }

    updateParticles(p, paletteIdx, x, y)
}

function spawnParticles(p: p5, amount: number) {
    for (let i = 0; i < amount; i++) {
        const particle = parBuffer[lastSpawnIdx]
        const direction = p5.Vector.fromAngle(p.random(p.TWO_PI)).mult(p.random(600, 1100))
        particle.alive = true
        particle.pos.set(0, 0)
        particle.initVel.set(direction)
        particle.vel.set(particle.initVel)
        particle.shapeFuncs = buildShapeSequence(p)
        particle.life = p.random(900, 1600)
        particle.age = 0
        lastSpawnIdx = (lastSpawnIdx + 1) % BUFFER_LEN
        particle.colorOffset = Math.floor(Math.random() * PLT_LEN)
    }
}

function updateParticles(p: p5, paletteIdx: number, cx: number, cy: number) {
    const dt = p.deltaTime * 0.001

    for (const particle of parBuffer) {
        if (!particle.alive) continue
        particle.age += p.deltaTime
        if (particle.age >= particle.life) {
            particle.alive = false
            continue
        }
        particle.pos.x += particle.vel.x * dt
        particle.pos.y += particle.vel.y * dt

        particle.rot += ROT_RATE

        const normInvAge = 1. - particle.age / particle.life
        particle.vel.x = particle.initVel.x * normInvAge
        particle.vel.y = particle.initVel.y * normInvAge

        p.push()
        p.translate(cx + particle.pos.x, cy + particle.pos.y)
        p.rotate(Math.PI * 2 * particle.rot)
        p.scale(normInvAge)

        let size = BASE_SIZE
        let shapeCount = 0
        for (const idx of particle.shapeFuncs) {
            p.stroke(palettes[paletteIdx][(particle.colorOffset + shapeCount) % PLT_LEN])
            shapeCount++
            const drawer = SHAPE_DRAWERS[idx]
            if (!drawer) continue
            size = drawer(p, size)
        }
        p.pop()
    }
}

function buildShapeSequence(p: p5): number[] {
    const len = p.floor(p.random(2, 5))
    const seq: number[] = []
    for (let i = 0; i < len; i++) {
        seq.push(p.floor(p.random(SHAPE_DRAWERS.length)))
    }
    return seq
}

function rec(p: p5, rad: number): number {
    const w = rad * Math.SQRT2
    p.rect(-w / 2, -w / 2, w)
    return w / 2
}

function cir(p: p5, rad: number): number {
    p.circle(0, 0, rad * 2)
    return rad * .8
}

function tri(p: p5, rad: number): number {
    const st = -p.PI / 2
    const ot = p.TWO_PI / 3 // one third
    p.triangle(
        p.cos(st) * rad, p.sin(st) * rad,
        p.cos(st + ot) * rad, p.sin(st + ot) * rad,
        p.cos(st + ot*2) * rad, p.sin(st + ot*2) * rad
    )
    return rad * 0.5;
}
