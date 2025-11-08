import p5 from 'p5';
import { Camera } from "@mediapipe/camera_utils";
import { Segmentator } from "./inference.ts";
import { drawEffect } from './effect.ts';
import { FrameRate } from './framerate.ts';
import { calculateCentroid, DampedVector, n2p1 } from './helpers.ts';
import { drawRotatingSquare } from './shapes/rotatingSquare.ts';

const segmentator = new Segmentator()

const videoElem = document.createElement('video') as HTMLVideoElement
const cam = new Camera(videoElem, {
    onFrame: async () => {
        await segmentator.send(videoElem)
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
    }

    p.draw = () => {
        fps.onFrame()

        p.clear()

        if (cameraInitiated && latestMask) {
            if (!resultGraphics){
                resultGraphics = initGraphics(latestMask)
            }

            cameraGraphics.drawingContext.drawImage(videoElem, 0, 0, cameraGraphics.width, cameraGraphics.height)

            resultGraphics.drawingContext.clearRect(0, 0, resultGraphics.width, resultGraphics.height)
            resultGraphics.drawingContext.drawImage(latestMask, 0, 0)


            //  DRAW BACKGROUND
            // --------------------------
            p.image(cameraGraphics, 0, 0, p.width, p.height)

            // dumb way to dim bg~ so many dumb ways to dim bg~
            p.fill(0, 0, 0, 190)
            p.rect(0, 0, p.width, p.height)


            //  SAMPLE FILLED AREA
            // -----------------------------
            const sampleGridX = 16
            const sampleGridY = 9
            const { centroid, opaqueRatio, samples } = calculateCentroid(resultGraphics, sampleGridX, sampleGridY)

            // damped centroid (centroid is normalized 0..1)
            const damped = centroidDamper.update(centroid, p.deltaTime / 1000)

            
            //  DRAW INTERMEDIATE LAYER
            // ----------------------------------
            // draw some shapes that chases detected subject
            // expected io: drawShapeFunc(p: p5, centroid: p5.Vector, samples: SamplePoint[], targetAvailable: boolean)
            const targetAvailable = opaqueRatio > .01 // 対象が検出されているかの判定
            drawRotatingSquare(p, damped, samples, targetAvailable)


            //  DRAW FOREGROUND
            // --------------------------
            const foreground = cameraGraphics.get()
            foreground.mask(resultGraphics.get())
            p.image(foreground, 0, 0, p.width, p.height)


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

            const textEpsilon = 5
            p.text("opaque: " + opaqueRatio, n2p1(damped.x, p.width) + textEpsilon, n2p1(damped.y, p.height) + textEpsilon)
            // </ DEBUG >
        }

        p.text("fps: " + fps.getFps(1), 10, 20)
    }

    p.keyPressed = () => {
        p.fullscreen(true)
    }
}

new p5(sketch)
