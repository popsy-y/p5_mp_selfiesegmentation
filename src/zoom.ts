import p5 from 'p5'
import type { SamplePoint } from './helpers.ts'
import { DampedVector, DampedNumber } from './helpers.ts'

export type BoundingBox = {
    minX: number // normalized 0..1
    minY: number // normalized 0..1
    maxX: number // normalized 0..1
    maxY: number // normalized 0..1
    valid: boolean // true when any weighted sample exists
}

type ZoomOptions = {
    padding?: number // fractional padding added around box (e.g. 0.1 = 10%)
    maxScale?: number // upper clamp for zoom
    tauCenter?: number // damping tau for center
    tauScale?: number // damping tau for scale
    minSamplesForValid?: number // require at least this many weighted samples to treat box as valid
}

/**
 * Zoom controller that computes a bounding box around weighted sample points
 * (assumed to represent detected human region) and smoothly translates / scales
 * the coordinate system so the box fills the canvas.
 */
export class Zoom {
    private centerDamper: DampedVector
    private scaleDamper: DampedNumber
    private opts: Required<ZoomOptions>
    private lastBox: BoundingBox

    constructor(opts: ZoomOptions = {}) {
        this.opts = {
            padding: opts.padding ?? 0.1,
            maxScale: opts.maxScale ?? 3,
            tauCenter: opts.tauCenter ?? 0.35,
            tauScale: opts.tauScale ?? 0.4,
            minSamplesForValid: opts.minSamplesForValid ?? 2
        }

        // Start centered scale=1
        this.centerDamper = new DampedVector(new p5.Vector(0.5, 0.5), this.opts.tauCenter, 2)
        this.scaleDamper = new DampedNumber(1, this.opts.tauScale)
        this.lastBox = { minX: 0, minY: 0, maxX: 1, maxY: 1, valid: false }
    }

    /**
     * Update damped target from samples.
     * dt: seconds
     */
    update(samples: SamplePoint[] | null | undefined, dt: number) {
        if (!samples || samples.length === 0) {
            this.centerDamper.update(new p5.Vector(0.5, 0.5), dt)
            this.scaleDamper.update(1, dt)
            this.lastBox = { minX: 0, minY: 0, maxX: 1, maxY: 1, valid: false }
            return
        }

        let minX = Infinity
        let maxX = -Infinity
        let minY = Infinity
        let maxY = -Infinity
        let weightedCount = 0
        for (const s of samples) {
            if (s.weight > 0) {
                weightedCount++
                if (s.nx < minX) minX = s.nx
                if (s.nx > maxX) maxX = s.nx
                if (s.ny < minY) minY = s.ny
                if (s.ny > maxY) maxY = s.ny
            }
        }

        const valid = weightedCount >= this.opts.minSamplesForValid
        if (!valid) {
            // Gracefully return to neutral when not valid
            this.centerDamper.update(new p5.Vector(0.5, 0.5), dt)
            this.scaleDamper.update(1, dt)
            this.lastBox = { minX: 0, minY: 0, maxX: 1, maxY: 1, valid: false }
            return
        }

        // Apply padding in normalized space
        const padX = (maxX - minX) * this.opts.padding
        const padY = (maxY - minY) * this.opts.padding
        minX = Math.max(0, minX - padX)
        maxX = Math.min(1, maxX + padX)
        minY = Math.max(0, minY - padY)
        maxY = Math.min(1, maxY + padY)

        const boxW = Math.max(1e-6, maxX - minX)
        const boxH = Math.max(1e-6, maxY - minY)
        const centerX = (minX + maxX) / 2
        const centerY = (minY + maxY) / 2

        // Uniform scale so that box fits canvas: scale >=1 means zoom in.
        // Required scale to make box cover canvas along each axis is 1 / boxSize.
        let targetScale = Math.min(1 / boxW, 1 / boxH)
        targetScale = Math.min(this.opts.maxScale, Math.max(1, targetScale))

        this.centerDamper.update(new p5.Vector(centerX, centerY), dt)
        this.scaleDamper.update(targetScale, dt)
        this.lastBox = { minX, minY, maxX, maxY, valid: true }
    }

    /**
     * Apply current transform to p5 context. Call inside p.push()/p.pop().
     */
    apply(p: p5) {
        const c = this.centerDamper.value
        const s = this.scaleDamper.value
        // Transform so that center of box moves to canvas center then scale.
        // Order: move canvas center to origin, scale, shift target center to origin.
        p.translate(p.width / 2, p.height / 2)
        p.scale(s)
        p.translate(-c.x * p.width, -c.y * p.height)
    }

    /**
     * Start framing.
     */
    begin(p: p5){
        p.push()

        const c = this.centerDamper.value
        const s = this.scaleDamper.value
        // Transform so that center of box moves to canvas center then scale.
        // Order: move canvas center to origin, scale, shift target center to origin.
        p.translate(p.width / 2, p.height / 2)
        p.scale(s)
        p.translate(-c.x * p.width, -c.y * p.height)
    }

    /**
     * End framing.
     */
    end(p: p5) { p.pop() }

    /** Current scale value */
    get scale() { return this.scaleDamper.value }
    /** Current center (damped) */
    get center() { return this.centerDamper.value }
    /** Last computed bounding box (normalized) */
    get box() { return this.lastBox }
}
