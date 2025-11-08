import p5 from 'p5';
import type { SamplePoint } from '../helpers.ts';

/**
 * 回転する四角形を描画するモジュール
 * p.millis()を使用して時間経過に応じて回転する
 */
export function drawRotatingSquare(
    p: p5,
    centroid: p5.Vector,
    _samples: SamplePoint[],
    targetAvailable: boolean
) {
    if (!targetAvailable) return;

    // 中心位置を画面座標に変換
    const x = p.width * centroid.x;
    const y = p.height * centroid.y;

    // 四角形のサイズ
    const size = 600;

    // p.millis()を使って回転角度を計算 (0 to 2π)
    const rotation = (p.millis() % (Math.PI * 2 * 1000)) / 1000;

    p.push();
    p.translate(x, y);
    p.rotate(rotation);
    
    // 四角形のスタイル
    p.fill(100, 200, 255, 150);
    p.stroke(255, 255, 255, 200);
    p.strokeWeight(2);
    
    // 中心を原点として四角形を描画
    p.rectMode(p.CENTER);
    p.rect(0, 0, size, size);
    
    p.pop();
}
