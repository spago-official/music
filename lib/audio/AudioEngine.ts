/**
 * AudioEngine - Web Audio APIの管理
 * オーディオファイルの読み込み、再生、ゲイン制御
 */

import { AudioEngineConfig, Track } from '../types';

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGainNode: GainNode | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private gateGainNode: GainNode | null = null;
  private buffer: AudioBuffer | null = null;
  private isInitialized: boolean = false;
  private isPlaying: boolean = false;
  private startTime: number = 0;
  private pauseOffset: number = 0;

  /**
   * AudioContextを初期化（ユーザージェスチャー後に呼ぶ）
   */
  async initialize(config?: AudioEngineConfig): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.audioContext = new AudioContext({
        latencyHint: config?.latencyHint || 'interactive',
        sampleRate: config?.sampleRate,
      });

      // iOS Safariの自動再生制限対策
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // マスターゲイン
      this.masterGainNode = this.audioContext.createGain();
      this.masterGainNode.gain.value = 0.8;

      // ゲート用ゲイン（初期値0）
      this.gateGainNode = this.audioContext.createGain();
      this.gateGainNode.gain.value = 0;

      // 接続: source → gate → master → destination
      this.gateGainNode.connect(this.masterGainNode);
      this.masterGainNode.connect(this.audioContext.destination);

      this.isInitialized = true;

      console.log('🎵 AudioEngine initialized', {
        sampleRate: this.audioContext.sampleRate,
        baseLatency: this.audioContext.baseLatency,
        state: this.audioContext.state,
      });
    } catch (error) {
      console.error('Failed to initialize AudioContext:', error);
      throw error;
    }
  }

  /**
   * オーディオファイルを読み込み
   */
  async load(url: string): Promise<void> {
    if (!this.audioContext) {
      throw new Error('AudioEngine not initialized. Call initialize() first.');
    }

    try {
      console.log('🎵 Loading audio:', url);
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      this.buffer = await this.audioContext.decodeAudioData(arrayBuffer);
      console.log('✅ Audio loaded:', {
        duration: this.buffer.duration,
        sampleRate: this.buffer.sampleRate,
        channels: this.buffer.numberOfChannels,
      });
    } catch (error) {
      console.error('Failed to load audio:', error);
      throw error;
    }
  }

  /**
   * 再生開始（内部クロックで常に進行、ゲインで制御）
   */
  play(): void {
    if (!this.audioContext || !this.buffer || !this.gateGainNode) {
      throw new Error('AudioEngine not ready');
    }

    if (this.isPlaying) return;

    // 既存のソースがあれば停止
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode.disconnect();
    }

    // 新しいソースノード作成
    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.buffer;
    this.sourceNode.loop = true; // ループ再生
    this.sourceNode.connect(this.gateGainNode);

    // 再生開始
    this.startTime = this.audioContext.currentTime - this.pauseOffset;
    this.sourceNode.start(0, this.pauseOffset);
    this.isPlaying = true;

    console.log('▶️ Audio playing (gate closed)');
  }

  /**
   * 停止
   */
  stop(): void {
    if (!this.isPlaying || !this.sourceNode || !this.audioContext) return;

    // 現在の再生位置を保存
    this.pauseOffset = this.audioContext.currentTime - this.startTime;

    // ソース停止
    this.sourceNode.stop();
    this.sourceNode.disconnect();
    this.sourceNode = null;
    this.isPlaying = false;

    console.log('⏸️ Audio stopped');
  }

  /**
   * リセット（最初から）
   */
  reset(): void {
    this.stop();
    this.pauseOffset = 0;
    this.startTime = 0;
    if (this.gateGainNode) {
      this.gateGainNode.gain.cancelScheduledValues(this.audioContext!.currentTime);
      this.gateGainNode.gain.value = 0;
    }
  }

  /**
   * ゲート開閉（滑らかに）
   * @param open true=開く（音が聞こえる）, false=閉じる（無音）
   * @param transitionMs 遷移時間（ミリ秒）
   */
  setGate(open: boolean, transitionMs: number = 50): void {
    if (!this.gateGainNode || !this.audioContext) return;

    const now = this.audioContext.currentTime;
    const targetValue = open ? 1.0 : 0.0;
    const timeConstant = transitionMs / 1000 / 5; // setTargetAtTimeの時定数

    this.gateGainNode.gain.cancelScheduledValues(now);
    this.gateGainNode.gain.setTargetAtTime(targetValue, now, timeConstant);

    // デバッグログ
    // console.log(`🚪 Gate ${open ? 'OPEN' : 'CLOSE'} (${transitionMs}ms)`);
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
    if (!this.gateGainNode || !this.audioContext) return;

    const now = this.audioContext.currentTime;
    const holdSec = holdMs / 1000;
    const openTimeConstant = openTransitionMs / 1000 / 5;
    const closeTimeConstant = closeTransitionMs / 1000 / 5;

    // スケジュール済みの値をキャンセル
    this.gateGainNode.gain.cancelScheduledValues(now);

    // 即座に開く
    this.gateGainNode.gain.setTargetAtTime(1.0, now, openTimeConstant);

    // holdMs後に閉じる
    this.gateGainNode.gain.setTargetAtTime(0.0, now + holdSec, closeTimeConstant);
  }

  /**
   * マスター音量設定
   */
  setMasterGain(value: number): void {
    if (!this.masterGainNode) return;
    this.masterGainNode.gain.value = Math.max(0, Math.min(1, value));
  }

  /**
   * AudioContextを取得
   */
  getAudioContext(): AudioContext | null {
    return this.audioContext;
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
    return this.buffer?.duration || 0;
  }

  /**
   * ソースノードを取得（FollowMode用）
   */
  getSourceNode(): AudioBufferSourceNode | null {
    return this.sourceNode;
  }

  /**
   * クリーンアップ
   */
  dispose(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.isInitialized = false;
  }
}
