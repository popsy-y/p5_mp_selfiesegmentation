import p5 from 'p5';
import { Camera } from "@mediapipe/camera_utils";
import { Segmentator } from "./inference.ts";
import { drawEffect } from './effect.ts';
import { FrameRate } from './framerate.ts';

const segmentator = new Segmentator()

const videoElem = document.createElement('video') as HTMLVideoElement
const cam = new Camera(videoElem, {
    onFrame: async () => {
        await segmentator.send(videoElem)
    },
    width: 1280,
    height: 720
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

    p.setup = () => {
        cam.start().then(_ => {
            videoElem.addEventListener('loadedmetadata', () => {
                cameraGraphics = p.createGraphics(videoElem.videoWidth, videoElem.videoHeight)
                cameraInitiated = true
            })
        })

        const cnv = p.createCanvas(1280, 720)
        const app = document.getElementById('app')

        if (!app) throw new Error('No app element found')
        cnv.parent(app)

        p.noStroke()
        p.fill(255)

        fps.reset()
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

            p.image(cameraGraphics, 0, 0)

            drawEffect(p, cameraGraphics, resultGraphics)

            const foreground = cameraGraphics.get()
            foreground.mask(resultGraphics.get())
            p.image(foreground, 0, 0)
        }

        p.text("fps: " + fps.getFps(1), 10, 20)
    }

    p.keyPressed = () => {
        p.fullscreen(true)
    }
}

new p5(sketch)
