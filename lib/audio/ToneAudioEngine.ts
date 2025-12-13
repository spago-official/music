/**
 * ToneAudioEngine - Tone.jsを使ったオーディオエンジン
 * 音程を保ったままテンポを変更可能（Player + PitchShift使用）
 */

import * as Tone from 'tone';
import { AudioEngineConfig } from '../types';

export class ToneAudioEngine {
  private player: Tone.Player | null = null;
  private pitchShift: Tone.PitchShift | null = null;
  private masterGain: Tone.Gain | null = null;
  private gateGain: Tone.Gain | null = null;
  private isInitialized: boolean = false;
  private isPlaying: boolean = false;
  private currentPlaybackRate: number = 1.0;

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

      // ピッチシフト（音程補正用）
      this.pitchShift = new Tone.PitchShift({
        pitch: 0,           // 初期値：ピッチ変更なし
        windowSize: 0.1,    // 窓サイズ（秒）
        delayTime: 0,       // 遅延なし
        feedback: 0,        // フィードバックなし
      });

      // ゲート用ゲイン（初期値0）
      this.gateGain = new Tone.Gain(0);

      // 接続: Player -> PitchShift -> GateGain -> MasterGain -> Destination
      this.pitchShift.connect(this.gateGain);
      this.gateGain.connect(this.masterGain);

      this.isInitialized = true;

      console.log('🎵 ToneAudioEngine initialized with PitchShift', {
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
    if (!this.isInitialized || !this.pitchShift) {
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

      // PitchShiftに接続
      this.player.connect(this.pitchShift);

      // 読み込み完了を待つ
      await Tone.loaded();

      console.log('✅ Audio loaded with Player + PitchShift:', {
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

    console.log('▶️ Audio playing (gate closed)');
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
   * ゲート一時開放（指定時間後に自動で閉じる）
   * @param holdMs ゲートを開けておく時間（ミリ秒）
   * @param openTransitionMs 開く時の遷移時間
   * @param closeTransitionMs 閉じる時の遷移時間
   */
  openGateTemporarily(
    holdMs: number,
    openTransitionMs: number = 10,
    closeTransitionMs: number = 50
  ): void {
    if (!this.gateGain) return;

    const now = Tone.now();
    const holdSec = holdMs / 1000;
    const openSec = openTransitionMs / 1000;
    const closeSec = closeTransitionMs / 1000;

    // スケジュール済みの値をキャンセル
    this.gateGain.gain.cancelScheduledValues(now);

    // 即座に開く
    this.gateGain.gain.rampTo(1.0, openSec, now);

    // holdMs後に閉じる
    this.gateGain.gain.rampTo(0.0, closeSec, now + holdSec);
  }

  /**
   * 再生速度を設定（音程を保つ）
   * @param rate 再生速度（1.0が通常速度）
   */
  setPlaybackRate(rate: number): void {
    if (!this.player || !this.pitchShift) return;

    this.currentPlaybackRate = rate;

    // playbackRateを変更
    this.player.playbackRate = rate;

    // playbackRateによる音程変化を補正
    // rate が 2.0 なら 1オクターブ上がるので、-12半音シフト
    // rate が 0.5 なら 1オクターブ下がるので、+12半音シフト
    const pitchShiftInSemitones = -12 * Math.log2(rate);
    this.pitchShift.pitch = pitchShiftInSemitones;

    console.log('🎵 Playback rate adjusted (pitch-preserved):', {
      rate: rate.toFixed(3),
      pitchShift: pitchShiftInSemitones.toFixed(2) + ' semitones',
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
    if (this.pitchShift) {
      this.pitchShift.dispose();
      this.pitchShift = null;
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
