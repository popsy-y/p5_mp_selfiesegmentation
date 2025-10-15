export class FrameRate{
    private last: number
    private deltas: number[]

    private nSamples: number

    constructor (nSamples: number) {
        this.last = 0
        this.reset()

        this.deltas = []

        this.nSamples = nSamples
    }

    public reset () {
        this.last = performance.now()
    }

    public chnageSampleLen (nSamples: number){
        this.nSamples = nSamples
    }

    public onFrame() {
        const now = performance.now()

        this.fifo(now - this.last)
        this.last = now
    }

    public getFps(nFractions: number): number {
        const fps = 1000 / this.getAvg()
        const mult = Math.pow(10, nFractions)
        return Math.round(fps * mult) / mult
    }

    private fifo(newSample: number){
        if (this.deltas.length > this.nSamples){
            this.deltas.shift()
        }

        this.deltas.push(newSample)
    }

    private getAvg(): number {
        return this.deltas.reduce((prev, cur) => prev + cur) / this.deltas.length
    }
}