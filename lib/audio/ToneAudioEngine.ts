/**
 * ToneAudioEngine - Tone.jsを使ったオーディオエンジン
 * シンプルな再生速度変更（音程も変わる）
 */

import * as Tone from 'tone';
import { AudioEngineConfig } from '../types';

export class ToneAudioEngine {
  private player: Tone.Player | null = null;
  private masterGain: Tone.Gain | null = null;
  private gateGain: Tone.Gain | null = null;
  private isInitialized: boolean = false;
  private isPlaying: boolean = false;
  private currentPlaybackRate: number = 1.0;
  private playStartTime: number = 0; // 再生開始時刻（performance.now()）
  private playStartOffset: number = 0; // 再生開始時の曲内オフセット

  /**
   * 初期化（ユーザージェスチャー後に呼ぶ）
   */
  async initialize(config?: AudioEngineConfig): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Tone.jsのコンテキストを開始
      await Tone.start();

      // マスターゲイン
      this.masterGain = new Tone.Gain(0.8).toDestination();

      // ゲート用ゲイン（初期値0 = 無音）
      this.gateGain = new Tone.Gain(0);

      // 接続: Player -> GateGain -> MasterGain -> Destination
      this.gateGain.connect(this.masterGain);

      this.isInitialized = true;

      console.log('🎵 ToneAudioEngine initialized', {
        sampleRate: Tone.getContext().sampleRate,
        state: Tone.getContext().state,
      });
    } catch (error) {
      console.error('Failed to initialize ToneAudioEngine:', error);
      throw error;
    }
  }

  /**
   * オーディオファイルを読み込み
   */
  async load(url: string): Promise<void> {
    if (!this.isInitialized || !this.gateGain) {
      throw new Error('ToneAudioEngine not initialized');
    }

    try {
      console.log('🎵 Loading audio:', url);

      // 既存のPlayerを破棄
      if (this.player) {
        this.player.dispose();
      }

      // Playerを作成
      this.player = new Tone.Player({
        url,
        loop: true,
        autostart: false,
      });

      // GateGainに直接接続
      this.player.connect(this.gateGain);

      // 読み込み完了を待つ
      await Tone.loaded();

      console.log('✅ Audio loaded:', {
        duration: this.player.buffer.duration,
      });
    } catch (error) {
      console.error('Failed to load audio:', error);
      throw error;
    }
  }

  /**
   * 再生開始
   */
  play(): void {
    if (!this.player) {
      throw new Error('Audio not loaded');
    }

    if (this.isPlaying) return;

    this.player.start();
    this.isPlaying = true;
    this.playStartTime = performance.now();

    console.log('▶️ Audio playing');
  }

  /**
   * 停止
   */
  stop(): void {
    if (!this.isPlaying || !this.player) return;

    this.player.stop();
    this.isPlaying = false;

    console.log('⏸️ Audio stopped');
  }

  /**
   * リセット（最初から）
   */
  reset(): void {
    this.stop();
    this.playStartTime = 0;
    this.playStartOffset = 0;
    if (this.gateGain) {
      this.gateGain.gain.cancelScheduledValues(Tone.now());
      this.gateGain.gain.value = 0;
    }
  }

  /**
   * ゲート開閉（滑らかに）
   * @param open true=開く（音が聞こえる）, false=閉じる（無音）
   * @param transitionMs 遷移時間（ミリ秒）
   */
  setGate(open: boolean, transitionMs: number = 50): void {
    if (!this.gateGain) return;

    const targetValue = open ? 1.0 : 0.0;
    const transitionSec = transitionMs / 1000;

    this.gateGain.gain.rampTo(targetValue, transitionSec);
  }

  /**
   * 再生速度を設定（音程も変わる）
   * @param rate 再生速度（1.0が通常速度）
   */
  setPlaybackRate(rate: number): void {
    if (!this.player) return;

    this.currentPlaybackRate = rate;

    // playbackRateを変更（音程も変わる）
    this.player.playbackRate = rate;

    console.log('🎵 Playback rate adjusted:', {
      rate: rate.toFixed(3),
    });
  }

  /**
   * マスター音量設定
   */
  setMasterGain(value: number): void {
    if (!this.masterGain) return;
    this.masterGain.gain.value = Math.max(0, Math.min(1, value));
  }

  /**
   * Tone.jsのコンテキストを取得
   */
  getContext(): Tone.BaseContext | null {
    return Tone.getContext();
  }

  /**
   * 初期化済みか
   */
  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * 再生中か
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * バッファの長さ（秒）
   */
  getDuration(): number {
    return this.player?.buffer.duration || 0;
  }

  /**
   * 現在の再生位置（秒）
   * ループ再生の場合、曲の長さで剰余を取る
   */
  getCurrentTime(): number {
    if (!this.isPlaying || !this.player) return 0;

    const duration = this.getDuration();
    if (duration === 0) return 0;

    // 経過時間（秒）を計算（再生速度を考慮）
    const elapsedMs = performance.now() - this.playStartTime;
    const elapsedSec = (elapsedMs / 1000) * this.currentPlaybackRate;

    // ループを考慮して曲内の位置を計算
    const totalTime = this.playStartOffset + elapsedSec;
    return totalTime % duration;
  }

  /**
   * Playerを取得（FollowMode用）
   */
  getPlayer(): Tone.Player | null {
    return this.player;
  }

  /**
   * クリーンアップ
   */
  dispose(): void {
    this.stop();
    if (this.player) {
      this.player.dispose();
      this.player = null;
    }
    if (this.gateGain) {
      this.gateGain.dispose();
      this.gateGain = null;
    }
    if (this.masterGain) {
      this.masterGain.dispose();
      this.masterGain = null;
    }
    this.isInitialized = false;
  }
}
