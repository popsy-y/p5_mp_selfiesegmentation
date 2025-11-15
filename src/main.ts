import p5 from 'p5';
import { Camera } from "@mediapipe/camera_utils";
import { P5Segmentator } from "./inference.ts";
import { FrameRate } from './framerate.ts';
import { calculateCentroid, DampedNumber, DampedVector, n2p1, type SamplePoint } from './helpers.ts';
import { Zoom } from './zoom.ts';
import { PerformanceTimer } from './perf/timer.ts';
import { drawMultiParticle } from './shapes/multiParticle.ts';
import { resetStyle } from './resetStyle.ts';
import { drawChecker } from './shapes/checker.ts';
import { palettes, PLT_LEN, type FixedLengthArray } from './palette.ts';
import { drawLines } from './shapes/lines.ts';
import { drawFocusLine } from './shapes/focusLine.ts';

let videoTime = -1
let inferTime = 0
const videoPerf = new PerformanceTimer()
const inferPerf = new PerformanceTimer()

const effState: FixedLengthArray<boolean, 10> = [false, false, false, false, false, false, false, false, false, false, ]
const chkEff = (idx: number) => effState[idx]

const sketch = (p: p5) => {
    const segmentator = new P5Segmentator(p)

    const videoElem = document.createElement('video') as HTMLVideoElement
    const cam = new Camera(videoElem, {
        onFrame: async () => {
            videoTime = videoPerf.elapsed()

            inferPerf.start()
            await segmentator.send(videoElem)
            inferTime = inferPerf.elapsed()
            inferPerf.stop()
            inferPerf.reset()

            videoPerf.reset()
            videoPerf.start()
        },
        width: 1920,
        height: 1080
    })

    let cameraGraphics: p5.Graphics
    let cameraInitiated = false

    const fps = new FrameRate(16)

    let centroidDamper: DampedVector
    let zoom: Zoom
    let doZoom = false

    let doDim = true

    let perfRequested: boolean
    const perf = new PerformanceTimer()

    const mspfPerf = new PerformanceTimer()

    let showDebugUi = true

    let dimDamper: DampedNumber

    p.setup = () => {
        cam.start().then(_ => {
            videoElem.addEventListener('loadedmetadata', () => {
                cameraGraphics = p.createGraphics(videoElem.videoWidth, videoElem.videoHeight)
                cameraInitiated = true
            })
        })

        const cnv = p.createCanvas(p.windowWidth, p.windowHeight)
        const app = document.getElementById('app')

        if (!app) throw new Error('No app element found')
        cnv.parent(app)

        p.noStroke()

        fps.reset()
        
        // initialize centroid damper: start centered, tau=0.25s, 2D
        centroidDamper = new DampedVector(p.createVector(0.5, 0.5, 0), 0.25, 2)
        dimDamper = new DampedNumber(0, .5)
        
        zoom = new Zoom({ padding: 0.4, maxScale: 3, tauCenter: 0.2, tauScale: 0.3 })
    }

    let paletteIdx = 0

    p.draw = () => {
        fps.onFrame()

        p.clear()

        if (cameraInitiated) {
            const resultGraphics = segmentator.getLatestMask()
            if (!resultGraphics){
                return
            }

            if (perfRequested) console.log("--- PERFORMANCE REPORT START ---")

            if (perfRequested) {
                mspfPerf.reset()
                mspfPerf.start()
            }

            if (perfRequested) perf.reset(); perf.start()
            
            cameraGraphics.drawingContext.drawImage(videoElem, 0, 0, cameraGraphics.width, cameraGraphics.height)

            if (perfRequested) console.log("Texture bake: " + perf.elapsed(2))


            //  SAMPLE FILLED AREA
            // -----------------------------
            if (perfRequested) perf.reset(); perf.start()
            
            const sampleGridX = 16
            const sampleGridY = 9
            const { centroid, opaqueRatio, samples } = calculateCentroid(p, resultGraphics, sampleGridX, sampleGridY)

            if (perfRequested) console.log("Sample & centroid: " + perf.elapsed(2))

            // damped centroid (centroid is normalized 0..1)
            const damped = centroidDamper.update(centroid, p.deltaTime / 1000)


            //  DRAW BACKGROUND
            // --------------------------
            const targetAvailable = opaqueRatio > .01

            if (perfRequested) perf.reset(); perf.start()
            
            p.image(cameraGraphics, 0, 0, p.width, p.height)

            // dumb way to dim bg~ so many dumb ways to dim bg~
            const dim = dimDamper.update(targetAvailable && doDim ? 1 : 0, p.deltaTime / 1000)
            p.fill(0, 0, 0, dim * 190)
            p.rect(0, 0, p.width, p.height)

            if (perfRequested) console.log("Background: " + perf.elapsed(2))


            //  DRAW INTERMEDIATE with zoom transform
            // --------------------------------------------------

            // update zoom controller
            if (perfRequested) perf.reset(); perf.start()
            const dummy: SamplePoint[] = [
                {nx: 0, ny: 0, weight: 1},
                {nx: 1, ny: 1, weight: 1}
            ]
            zoom.update(doZoom ? samples : dummy, p.deltaTime / 1000)
            if (perfRequested) console.log("Update zoom: " + perf.elapsed(2))
            
            if (perfRequested) perf.reset(); perf.start()


            // Intermediates

            // without zoom
            resetStyle(p)
            if (chkEff(3)) drawLines(p, paletteIdx, 8)

            resetStyle(p)
            if (chkEff(4)) drawFocusLine(p, paletteIdx, damped, 16)


            // with zoom
            zoom.begin(p)

            resetStyle(p)
            if (chkEff(1)) drawMultiParticle(p, paletteIdx, damped, samples, targetAvailable)

            resetStyle(p)
            if (chkEff(2)) drawChecker(p, paletteIdx, 100)

            zoom.end(p)
            

            if (perfRequested) console.log("Intermediate: " + perf.elapsed(2))


            //  DRAW FOREGROUND
            // --------------------------------------------------

            resetStyle(p)
            zoom.begin(p)

            if (perfRequested) perf.reset(); perf.start()
            const foreground = cameraGraphics.get()
            foreground.mask(resultGraphics.get())
            p.image(foreground, 0, 0, p.width, p.height)
            if (perfRequested) console.log("Foreground: " + perf.elapsed(2))

            zoom.end(p)

            if (perfRequested) {
                console.log("(ASYNC) VIDEO: " + videoTime)
                console.log("(ASYNC) INFER: " + inferTime)
                const f = fps.getFps(1)
                console.log("FPS: " + f)
                console.log("CALC MSPF: " + 1000 / f)
                console.log("ACTL MSPF: " + mspfPerf.elapsed(2))
            }

            if (perfRequested) console.log("--- PERFORMANCE REPORT END ---"); perfRequested = false

            // < DEBUG >
            {
                if (!showDebugUi) return

                if (samples) {
                    for (const s of samples) {
                        if (s.weight) {
                            p.fill(200, 50, 50)
                        } else {
                            p.fill(50, 150, 200)
                        }
                        p.ellipse(p.width * s.nx, p.height * s.ny, s.weight ? 10 : 2)
                    }
                }

                // visualize damped centroid
                p.fill(255, 255, 0)
                p.ellipse(p.width * damped.x, p.height * damped.y, 5)

                // draw bounding box (normalized) for debug
                const box = zoom.box
                if (box.valid) {
                    p.noFill()
                    p.stroke(0, 255, 0)
                    p.strokeWeight(2)
                    p.rect(
                        box.minX * p.width,
                        box.minY * p.height,
                        (box.maxX - box.minX) * p.width,
                        (box.maxY - box.minY) * p.height
                    )
                    p.noStroke()
                }

                p.fill(255, 255, 0)
                const textEpsilon = 5
                p.text(
                    "opaque: " + opaqueRatio +
                    " scale: " + zoom.scale.toFixed(2),
                    n2p1(damped.x, p.width) + textEpsilon,
                    n2p1(damped.y, p.height) + textEpsilon
                )
            }
            // </ DEBUG >
        }

        p.text("fps: " + fps.getFps(1), 10, 20)
    }

    p.keyPressed = () => {
        if (p.key == " ") p.fullscreen(true)

        if (p.key == "f") p.resizeCanvas(p.windowWidth, p.windowHeight)

        if (p.key == "p") perfRequested = true

        if (p.key == "u") showDebugUi = !showDebugUi

        if (p.key == "c") paletteIdx = (paletteIdx+1 + palettes.length) % palettes.length

        if ("0123456789".includes(p.key)) {
            const idx = parseInt(p.key)

            if (idx <= 9) effState[idx] = !effState[idx]
        }

        if (p.key == "z") doZoom = !doZoom
        if (p.key == "d") doDim = !doDim
    }
}

new p5(sketch)
