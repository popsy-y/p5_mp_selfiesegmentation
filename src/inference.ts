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
        const s = performance.now()
        img.src = canvas.toDataURL();// お前かーーーー
        console.log(performance.now() - s)

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

import p5 from 'p5'

export class P5Segmentator{
    private model: SelfieSegmentation;
    private resultGraphics: p5.Graphics

    constructor(p: p5) {
        this.model = new SelfieSegmentation({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
            }
        });
        this.model.setOptions({
            modelSelection: 1,
        });
        this.resultGraphics = p.createGraphics(2, 2)
        this.model.onResults(this.onResults);
    }

    private onResults = (results: Results) => {
        if (!results.segmentationMask) return;

        const rg = this.resultGraphics
        const sm = results.segmentationMask

        if (
            rg.width != sm.width ||
            rg.height != sm.height
        ) {
            this.resultGraphics.resizeCanvas(sm.width, sm.height)
        }

        this.resultGraphics.drawingContext.clearRect(0, 0, sm.width, sm.height)
        this.resultGraphics.drawingContext.drawImage(results.segmentationMask, 0, 0)
    };

    // public onUpdate(fn: (img: HTMLImageElement) => void) {
    //     this.listeners.push(fn);
    // }

    public async send(input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement) {
        await this.model.send({image: input});
    }

    public getLatestMask(): p5.Graphics {
        return this.resultGraphics
    }
}
