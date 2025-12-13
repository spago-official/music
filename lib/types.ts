/**
 * 型定義
 * 将来の拡張を見据えた設計
 */

/**
 * トラック情報（将来のマルチトラック対応）
 */
export type TrackRole = 'master' | 'guitar' | 'bass' | 'drums' | 'vocal' | 'other';

/**
 * 楽器選択（分離音源用）
 */
export type InstrumentType = 'full' | 'vocals' | 'bass' | 'drums' | 'other';

export interface InstrumentOption {
  id: InstrumentType;
  name: string;
  icon: string;
  audioPath: string;
}

export interface Track {
  id: string;
  name: string;
  role: TrackRole;
  buffer: AudioBuffer | null;
  gain: number;
  mute: boolean;
  solo: boolean;
}

/**
 * 曲メタデータ
 */
export interface SongMeta {
  title: string;
  artist?: string;
  bpm: number;
  timeSignature: [number, number]; // [拍子の分子, 分母] 例: [4, 4]
  key?: string;
  sections?: SongSection[];
  grid?: number; // 量子化グリッド (1/4, 1/8, 1/16 など)
}

export interface SongSection {
  name: string; // "Intro", "Verse", "Chorus" など
  startBar: number;
  endBar: number;
}


/**
 * タップ判定結果
 */
export type TapJudgement = 'perfect' | 'good' | 'early' | 'late' | 'miss';


/**
 * タップイベント
 */
export interface TapEvent {
  timestamp: number; // performance.now()
  audioTime: number; // AudioContext.currentTime相当
  judgement: TapJudgement;
  deviation: number; // 直近ビートからの偏差（ミリ秒）
}

/**
 * セッション情報（将来のマルチプレイヤー対応）
 */
export interface Session {
  id: string;
  hostId: string;
  peers: Peer[];
  tempoSource: 'host' | 'shared';
  syncMode: 'strict' | 'natural';
  maxPlayers: number;
}

export interface Peer {
  id: string;
  name: string;
  track: Track;
  latency: number; // RTT/2
}

/**
 * オーディオエンジン設定
 */
export interface AudioEngineConfig {
  sampleRate?: number;
  latencyHint?: AudioContextLatencyCategory;
}

/**
 * Transport設定
 */
export interface TransportConfig {
  bpm: number;
  timeSignature: [number, number];
  loop?: boolean;
  loopStart?: number; // 小節番号
  loopEnd?: number; // 小節番号
}

/**
 * フォローモード設定
 */
export interface FollowModeConfig {
  tempoRange: [number, number]; // [最小%, 最大%] 例: [90, 110]
  adaptSpeed: number; // テンポ追従速度 (0.0 ~ 1.0)
  tapHistorySize: number; // 推定に使うタップ履歴数
}

/**
 * アナリティクス用イベント（将来実装）
 */
export interface AnalyticsEvent {
  type: 'tap' | 'mode_change' | 'session_start' | 'session_end';
  timestamp: number;
  data: Record<string, unknown>;
}
