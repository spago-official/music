/**
 * ToneFollowMode - Tone.jsを使ったテンポフォローモード
 * 音程を保ったままテンポを変更
 */

import { ToneAudioEngine } from '../ToneAudioEngine';
import { Transport } from '../Transport';
import { FollowModeConfig, TapEvent } from '../../types';
import * as Tone from 'tone';

export class ToneFollowMode {
  private audioEngine: ToneAudioEngine;
  private transport: Transport;
  private config: FollowModeConfig;
  private isActive: boolean = false;

  // タップ履歴（タイムスタンプ）
  private tapHistory: number[] = [];

  // 推定BPM
  private estimatedBPM: number | null = null;

  // 基準BPM（曲の本来のBPM）
  private baseBPM: number;

  // 最後のタップ時刻
  private lastTapTime: number = 0;

  // フェードアウトタイマー
  private fadeOutTimer: NodeJS.Timeout | null = null;

  constructor(audioEngine: ToneAudioEngine, transport: Transport, config: FollowModeConfig) {
    this.audioEngine = audioEngine;
    this.transport = transport;
    this.config = config;
    this.baseBPM = transport.getBPM();
  }

  /**
   * モードをアクティブ化
   */
  activate(): void {
    this.isActive = true;
    this.tapHistory = [];
    this.estimatedBPM = null;
    this.lastTapTime = 0;

    // 初期状態は無音
    this.audioEngine.setGate(false, 10);

    console.log('🎮 ToneFollowMode activated', this.config);
  }

  /**
   * モードを非アクティブ化
   */
  deactivate(): void {
    this.isActive = false;
    this.resetPlaybackRate();
    this.clearFadeOutTimer();
    this.audioEngine.setGate(false, 50);
  }

  /**
   * タップイベント処理
   */
  onTap(timestamp: number): TapEvent | null {
    if (!this.isActive) return null;

    const context = this.audioEngine.getContext();
    if (!context) return null;

    // 最後のタップ時刻を更新
    this.lastTapTime = timestamp;

    // ゲートを開く（音を鳴らす）
    this.audioEngine.setGate(true, 10);

    // 既存のフェードアウトタイマーをクリア
    this.clearFadeOutTimer();

    // タップが止まったらフェードアウト（1.5秒後）
    this.fadeOutTimer = setTimeout(() => {
      this.audioEngine.setGate(false, 300);
      console.log('🔇 Fading out (no tap detected)');
    }, 1500);

    // タップ履歴に追加
    this.tapHistory.push(timestamp);

    // 履歴サイズを制限
    if (this.tapHistory.length > this.config.tapHistorySize) {
      this.tapHistory.shift();
    }

    // BPMを推定
    this.estimatedBPM = this.estimateBPMFromTaps();

    // 再生速度を調整
    if (this.estimatedBPM !== null) {
      this.adjustPlaybackRate(this.estimatedBPM);
    }

    const tapEvent: TapEvent = {
      timestamp,
      audioTime: Tone.now(),
      judgement: 'good',
      deviation: 0,
    };

    console.log('👆 Tap:', {
      estimatedBPM: this.estimatedBPM?.toFixed(1),
      tapCount: this.tapHistory.length,
    });

    return tapEvent;
  }

  /**
   * タップ履歴からBPMを推定
   */
  private estimateBPMFromTaps(): number | null {
    if (this.tapHistory.length < 2) {
      return null;
    }

    // 直近N回のタップ間隔から平均を計算
    const intervals: number[] = [];
    for (let i = 1; i < this.tapHistory.length; i++) {
      const interval = this.tapHistory[i] - this.tapHistory[i - 1];
      intervals.push(interval);
    }

    // 平均タップ間隔（ミリ秒）
    const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;

    // BPMに変換
    const bpm = 60000 / avgInterval;

    // 極端な値を除外
    const minBPM = this.baseBPM * (this.config.tempoRange[0] / 100);
    const maxBPM = this.baseBPM * (this.config.tempoRange[1] / 100);

    if (bpm < minBPM || bpm > maxBPM) {
      return this.estimatedBPM !== null
        ? this.lerp(this.estimatedBPM, this.baseBPM, 0.1)
        : this.baseBPM;
    }

    return bpm;
  }

  /**
   * 再生速度を調整（音程を保つ）
   */
  private adjustPlaybackRate(targetBPM: number): void {
    const player = this.audioEngine.getPlayer();
    if (!player) return;

    // 基準BPMに対する倍率を計算
    const targetRate = targetBPM / this.baseBPM;

    // 許容範囲内にクランプ
    const minRate = this.config.tempoRange[0] / 100;
    const maxRate = this.config.tempoRange[1] / 100;
    const clampedRate = Math.max(minRate, Math.min(maxRate, targetRate));

    // 現在の再生速度
    const currentRate = player.playbackRate;

    // 滑らかに追従（線形補間）
    const newRate = this.lerp(currentRate, clampedRate, this.config.adaptSpeed);

    // 再生速度を設定（音程を保つ）
    this.audioEngine.setPlaybackRate(newRate);

    // Transportも同期（表示用）
    const newBPM = this.baseBPM * newRate;
    this.transport.setBPM(newBPM);
  }

  /**
   * 再生速度をリセット
   */
  private resetPlaybackRate(): void {
    this.audioEngine.setPlaybackRate(1.0);
    this.transport.setBPM(this.baseBPM);
  }

  /**
   * 線形補間
   */
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  /**
   * フェードアウトタイマーをクリア
   */
  private clearFadeOutTimer(): void {
    if (this.fadeOutTimer !== null) {
      clearTimeout(this.fadeOutTimer);
      this.fadeOutTimer = null;
    }
  }

  /**
   * 設定を更新
   */
  updateConfig(config: Partial<FollowModeConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 現在の設定を取得
   */
  getConfig(): FollowModeConfig {
    return { ...this.config };
  }

  /**
   * 推定BPMを取得
   */
  getEstimatedBPM(): number | null {
    return this.estimatedBPM;
  }

  /**
   * タップ履歴をクリア
   */
  clearHistory(): void {
    this.tapHistory = [];
    this.estimatedBPM = null;
    this.lastTapTime = 0;
    this.resetPlaybackRate();
    this.clearFadeOutTimer();
  }
}
