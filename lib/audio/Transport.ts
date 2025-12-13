/**
 * Transport - 音楽の時間管理とクロック
 * BPM、拍子、再生位置を管理
 */

import { TransportConfig, BeatInfo } from '../types';
import { calculateBeatInfo, getBarDuration } from '../timing/quantize';

export class Transport {
  private config: TransportConfig;
  private audioContext: AudioContext;
  private startTime: number = 0; // AudioContext時間での開始時刻
  private pauseTime: number = 0; // 一時停止時の経過時間
  private isPlaying: boolean = false;

  constructor(audioContext: AudioContext, config: TransportConfig) {
    this.audioContext = audioContext;
    this.config = config;
  }

  /**
   * 再生開始
   */
  start(): void {
    if (this.isPlaying) return;

    this.isPlaying = true;
    // pauseTimeがある場合は途中から再開
    this.startTime = this.audioContext.currentTime - this.pauseTime;
  }

  /**
   * 一時停止
   */
  stop(): void {
    if (!this.isPlaying) return;

    this.isPlaying = false;
    this.pauseTime = this.getCurrentTime();
  }

  /**
   * リセット（最初から）
   */
  reset(): void {
    this.isPlaying = false;
    this.startTime = 0;
    this.pauseTime = 0;
  }

  /**
   * 現在の経過時間を取得（秒）
   */
  getCurrentTime(): number {
    if (!this.isPlaying) {
      return this.pauseTime;
    }
    return this.audioContext.currentTime - this.startTime;
  }

  /**
   * 現在のビート情報を取得
   */
  getBeatInfo(): BeatInfo {
    const now = this.getCurrentTime();
    return calculateBeatInfo(now, this.config.bpm, this.config.timeSignature);
  }

  /**
   * BPMを設定
   */
  setBPM(bpm: number): void {
    this.config.bpm = bpm;
  }

  /**
   * 現在のBPMを取得
   */
  getBPM(): number {
    return this.config.bpm;
  }

  /**
   * 拍子を設定
   */
  setTimeSignature(timeSignature: [number, number]): void {
    this.config.timeSignature = timeSignature;
  }

  /**
   * 現在の拍子を取得
   */
  getTimeSignature(): [number, number] {
    return this.config.timeSignature;
  }

  /**
   * 再生中かどうか
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * AudioContext時間での現在時刻を取得
   */
  getAudioContextTime(): number {
    return this.audioContext.currentTime;
  }

  /**
   * 指定した小節の開始時刻を取得（秒）
   */
  getBarStartTime(barIndex: number): number {
    const barDuration = getBarDuration(this.config.bpm, this.config.timeSignature);
    return barIndex * barDuration;
  }

  /**
   * ループ設定（将来実装）
   */
  setLoop(enabled: boolean, startBar?: number, endBar?: number): void {
    this.config.loop = enabled;
    if (startBar !== undefined) this.config.loopStart = startBar;
    if (endBar !== undefined) this.config.loopEnd = endBar;
  }
}
