import p5 from 'p5';
import { Camera } from "@mediapipe/camera_utils";
import { Segmentator } from "./inference.ts";
import { FrameRate } from './framerate.ts';
import { calculateCentroid, DampedVector, n2p1 } from './helpers.ts';
import { Zoom } from './zoom.ts';
import { drawRotatingSquare } from './shapes/rotatingSquare.ts';
import { PerformanceTimer } from './perf/timer.ts';

const segmentator = new Segmentator()

let videoThreadDelta = -1
const videoPerf = new PerformanceTimer()

const videoElem = document.createElement('video') as HTMLVideoElement
const cam = new Camera(videoElem, {
    onFrame: async () => {
        videoThreadDelta = videoPerf.elapsed()
        await segmentator.send(videoElem)
        videoPerf.reset()
        videoPerf.start()
    },
    width: 1920,
    height: 1080
})

const sketch = (p: p5) => {
    let latestMask: HTMLImageElement | null = null;
    segmentator.onUpdate((img) => {
        latestMask = img;
    });

    let cameraGraphics: p5.Graphics
    let cameraInitiated = false

    let resultGraphics: p5.Graphics
    const initGraphics =
        (img: HTMLImageElement): p5.Graphics => p.createGraphics(img.width, img.height)

    const fps = new FrameRate(16)

    let centroidDamper: DampedVector
    let zoom: Zoom

    let perfRequested: boolean
    const perf = new PerformanceTimer()

    p.setup = () => {
        cam.start().then(_ => {
            videoElem.addEventListener('loadedmetadata', () => {
                cameraGraphics = p.createGraphics(videoElem.videoWidth, videoElem.videoHeight)
                cameraInitiated = true
            })
        })

        const cnv = p.createCanvas(1920, 1080)
        const app = document.getElementById('app')

        if (!app) throw new Error('No app element found')
        cnv.parent(app)

        p.noStroke()

        fps.reset()
        
        // initialize centroid damper: start centered, tau=0.25s, 2D
        centroidDamper = new DampedVector(p.createVector(0.5, 0.5, 0), 0.25, 2)
        
        zoom = new Zoom({ padding: 0.2, maxScale: 3, tauCenter: 0.35, tauScale: 0.4 })
    }

    p.draw = () => {
        fps.onFrame()

        p.clear()

        if (cameraInitiated && latestMask) {
            if (!resultGraphics){
                resultGraphics = initGraphics(latestMask)
            }

            if (perfRequested) console.log("--- PERFORMANCE REPORT START ---")

            if (perfRequested) perf.reset(); perf.start()
            
            cameraGraphics.drawingContext.drawImage(videoElem, 0, 0, cameraGraphics.width, cameraGraphics.height)

            resultGraphics.drawingContext.clearRect(0, 0, resultGraphics.width, resultGraphics.height)
            resultGraphics.drawingContext.drawImage(latestMask, 0, 0)
            
            if (perfRequested) console.log("Texture bake: " + perf.elapsed(2))


            //  SAMPLE FILLED AREA
            // -----------------------------
            if (perfRequested) perf.reset(); perf.start()
            
            const sampleGridX = 16
            const sampleGridY = 9
            const rt = p.createGraphics(16, 9)
            rt.copy(resultGraphics.get(), 0, 0, 1920, 1080, 0, 0, 16, 9)
            const { centroid, opaqueRatio, samples } = calculateCentroid(rt, sampleGridX, sampleGridY)

            if (perfRequested) console.log("Sample & centroid: " + perf.elapsed(2))

            // damped centroid (centroid is normalized 0..1)
            const damped = centroidDamper.update(centroid, p.deltaTime / 1000)


            //  DRAW BACKGROUND
            // --------------------------
            if (perfRequested) perf.reset(); perf.start()
            
                p.image(cameraGraphics, 0, 0, p.width, p.height)

            // dumb way to dim bg~ so many dumb ways to dim bg~
            p.fill(0, 0, 0, 190)
            p.rect(0, 0, p.width, p.height)

            if (perfRequested) console.log("Background: " + perf.elapsed(2))


            //  DRAW INTERMEDIATE + FOREGROUND with zoom transform
            // --------------------------------------------------
            
            // update zoom controller
            if (perfRequested) perf.reset(); perf.start()
            zoom.update(samples, p.deltaTime / 1000)
            zoom.begin(p)
            if (perfRequested) console.log("Update zoom: " + perf.elapsed(2))
            
            if (perfRequested) perf.reset(); perf.start()
            const targetAvailable = opaqueRatio > .01
            drawRotatingSquare(p, damped, samples, targetAvailable)
            if (perfRequested) console.log("Intermediate: " + perf.elapsed(2))

            if (perfRequested) perf.reset(); perf.start()
            const foreground = cameraGraphics.get()
            foreground.mask(resultGraphics.get())
            p.image(foreground, 0, 0, p.width, p.height)
            if (perfRequested) console.log("Foreground: " + perf.elapsed(2))
            
            zoom.end(p)

            if (perfRequested) console.log("VIDEO: " + videoThreadDelta)

            if (perfRequested) console.log("--- PERFORMANCE REPORT END ---"); perfRequested = false

            // < DEBUG >
            if (samples) {
                for (const s of samples) {
                    if (s.weight) {
                        p.fill(200, 50, 50)
                    } else {
                        p.fill(50, 150, 200)
                    }
                    p.ellipse(p.width * s.nx, p.height * s.ny, 3)
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
            // </ DEBUG >
        }

        p.text("fps: " + fps.getFps(1), 10, 20)
    }

    p.keyPressed = () => {
        p.fullscreen(true)

        if (p.key == "p") {
            perfRequested = true
        }
    }
}

new p5(sketch)
