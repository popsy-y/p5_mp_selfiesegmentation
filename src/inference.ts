import {SelfieSegmentation} from "@mediapipe/selfie_segmentation";
import type {Results} from "@mediapipe/selfie_segmentation";

export class Segmentator {
    private model: SelfieSegmentation;
    private listeners: ((img: HTMLImageElement) => void)[] = [];

    constructor() {
        this.model = new SelfieSegmentation({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
            }
        });
        this.model.setOptions({
            modelSelection: 1,
        });
        this.model.onResults(this.onResults);
    }

    private onResults = (results: Results) => {
        if (!results.segmentationMask) return;
        const canvas = document.createElement('canvas');
        canvas.width = results.segmentationMask.width;
        canvas.height = results.segmentationMask.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(results.segmentationMask, 0, 0);
        const img = new Image();
        img.src = canvas.toDataURL();

        // リスナーを呼び出す
        this.listeners.forEach(fn => fn(img));
    };

    public onUpdate(fn: (img: HTMLImageElement) => void) {
        this.listeners.push(fn);
    }

    public async send(input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement) {
        await this.model.send({image: input});
    }
}