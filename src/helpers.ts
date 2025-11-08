import p5 from 'p5'

export const vec2 = (x = 0, y = 0) => new p5.Vector(x, y)
export const vec3 = (x = 0, y = 0, z = 0) => new p5.Vector(x, y, z)

export const v2one = () => vec2(1, 1)
export const v3one = () => vec3(1, 1, 1)

// Converts normalized coordinate to pixel coodinate in given resolution
// Convert a single normalized coordinate to pixel coordinate (one dimension).
export function n2p1(
	n = 0.5,
	length = 1,
	{ clamp = true, round = true }: { clamp?: boolean; round?: boolean } = {}
): number {
	let v = n * length

	if (clamp) {
		v = Math.max(0, Math.min(length - 1, v))
	}

	if (round) {
		v = Math.floor(v)
	}

	return v
}

// Convert 2D normalized coords to pixel coords using n2p1 for each dimension.
export function n2p(
	nx = 0.5,
	ny = 0.5,
	width = 1,
	height = 1,
	opts: { clamp?: boolean; round?: boolean } = {}
): p5.Vector {
	const x = n2p1(nx, width, opts)
	const y = n2p1(ny, height, opts)
	return vec2(x, y)
}

export type SamplePoint = {
	nx: number // normalized x (0..1)
	ny: number // normalized y (0..1)
	weight: number // 0 or 1 in current implementation
}

export function calculateCentroid(
	resultGraphics: p5.Graphics,
	sampleGridX = 16,
	sampleGridY = 9
): { centroid: p5.Vector; opaqueRatio: number; samples: SamplePoint[] } {
	// Ensure pixels are up-to-date
	resultGraphics.loadPixels()
	const pxs = resultGraphics.pixels

	const ux = resultGraphics.width / sampleGridX
	const uy = resultGraphics.height / sampleGridY

	let sumW = 0
	let sumWX = 0
	let sumWY = 0
	let opaqueCount = 0

	const samples: SamplePoint[] = []

	for (let x = 0; x < sampleGridX; x++) {
		for (let y = 0; y < sampleGridY; y++) {
			const sx = Math.floor(ux * x + ux / 2)
			const sy = Math.floor(uy * y + uy / 2)

			const baseIdx = (sx + sy * resultGraphics.width) * 4
			const alpha = pxs[baseIdx + 3] // 0-255

			const weight = alpha > 128 ? 1 : 0

			const nx = sx / resultGraphics.width
			const ny = sy / resultGraphics.height

			sumW += weight
			sumWX += weight * nx
			sumWY += weight * ny

			if (weight) opaqueCount++

			samples.push({ nx, ny, weight })
		}
	}

	const centroidX = sumW > 0 ? sumWX / sumW : 0.5
	const centroidY = sumW > 0 ? sumWY / sumW : 0.5

	const centroid = new p5.Vector(centroidX, centroidY)
	const opaqueRatio = opaqueCount / (sampleGridX * sampleGridY)

	return { centroid, opaqueRatio, samples }
}

// Exponential damper for scalar values with time-constant control
export class DampedNumber {
	value: number
	tau: number // seconds; smaller = snappier

	constructor(initial = 0, tau = 0.2) {
		this.value = initial
		this.tau = Math.max(1e-6, tau)
	}

	// Advance towards target by dt seconds
	update(target: number, dt: number): number {
		if (!(dt > 0)) return this.value
		const a = 1 - Math.exp(-dt / this.tau)
		this.value += (target - this.value) * a
		return this.value
	}

	// Immediately set value
	reset(v: number) {
		this.value = v
	}
}

// Exponential damper for p5.Vector (2D or 3D) with time-constant control
export class DampedVector {
	value: p5.Vector
	tau: number // seconds
	dims: 2 | 3

	constructor(initial?: p5.Vector, tau = 0.2, dims: 2 | 3 = 2) {
		this.value = initial ? initial.copy() : new p5.Vector(0, 0, 0)
		this.tau = Math.max(1e-6, tau)
		this.dims = dims
	}

	update(target: p5.Vector, dt: number): p5.Vector {
		if (!(dt > 0)) return this.value
		const a = 1 - Math.exp(-dt / this.tau)
		// Lerp components independently to avoid allocation
		this.value.x += (target.x - this.value.x) * a
		this.value.y += (target.y - this.value.y) * a
		if (this.dims === 3) {
			const tz = (typeof target.z === 'number') ? target.z : 0
			this.value.z += (tz - this.value.z) * a
		}
		return this.value
	}

	reset(v: p5.Vector) {
		this.value.set(v.x, v.y, typeof v.z === 'number' ? v.z : this.value.z)
	}
}
