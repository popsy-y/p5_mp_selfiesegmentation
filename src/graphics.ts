import p5 from 'p5';
import {Camera} from "@mediapipe/camera_utils";
import {Segmentator} from "./inference.ts";

const segmentator = new Segmentator()

const videoElem = document.createElement('video') as HTMLVideoElement
const camera = new Camera(videoElem, {
    onFrame: async () => {
        await segmentator.send(videoElem)
    },
    width: 1280,
    height: 720
});
camera.start()

const sketch = (p: p5) => {
    let latestMask: HTMLImageElement | null = null;
    segmentator.onUpdate((img) => {
        latestMask = img;
    });

    let resultGraphics: p5.Graphics
    const initGraphics =
        (img: HTMLImageElement): p5.Graphics => p.createGraphics(img.width, img.height)

    const res = 30

    p.setup = () => {
        const cnv = p.createCanvas(1280, 720)
        const app = document.getElementById('app')
        console.log(app)
        if (!app) throw new Error('No app element found')
        cnv.parent(app)
    }

    p.draw = () => {
        p.clear();

        const ux = p.width / res;
        const uy = p.height / res;
        for (let i = 0; i <= res; i++) {
            for (let j = 0; j <= res; j++) {
                p.fill((i + j) % 2 == 0 ? 255 : 100);
                p.rect(i * ux, j * uy, ux, uy);
            }
        }

        if (latestMask) {
            if (!resultGraphics){
                resultGraphics = initGraphics(latestMask);
            }

            resultGraphics.drawingContext.clearRect(0, 0, resultGraphics.width, resultGraphics.height);
            resultGraphics.drawingContext.drawImage(latestMask, 0, 0);

            p.image(resultGraphics, 0, 0, p.width, p.height);
        }
    }

    p.keyPressed = () => {
        p.fullscreen(true)
    }
}

new p5(sketch)
