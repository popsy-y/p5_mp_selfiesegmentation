export class PerformanceTimer {
  private startTime: number = 0;
  private accumulatedTime: number = 0;
  private isRunning: boolean = false;

  /**
   * タイマーを開始します
   */
  start(): void {
    if (!this.isRunning) {
      this.startTime = performance.now();
      this.isRunning = true;
    }
  }

  /**
   * タイマーを停止します
   */
  stop(): void {
    if (this.isRunning) {
      this.accumulatedTime += performance.now() - this.startTime;
      this.isRunning = false;
    }
  }

  /**
   * タイマーをリセットします
   */
  reset(): void {
    this.startTime = 0;
    this.accumulatedTime = 0;
    this.isRunning = false;
  }

/**
 * 経過時間をミリ秒で取得します
 * 指定した桁数に丸めたい場合は digits を指定します（小数点以下の桁数）
 */
elapsed(digits?: number): number {
    const value = this.isRunning
        ? this.accumulatedTime + (performance.now() - this.startTime)
        : this.accumulatedTime;

    if (digits === undefined) return value;

    const d = Math.max(0, Math.floor(digits));
    const factor = Math.pow(10, d);
    return Math.round(value * factor) / factor;
}

  /**
   * 経過時間を秒で取得します
   */
  elapsedSeconds(): number {
    return this.elapsed() / 1000;
  }

  /**
   * タイマーが実行中かどうかを取得します
   */
  get running(): boolean {
    return this.isRunning;
  }
}
