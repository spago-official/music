/**
 * 音源設定
 * 各音源のメタデータ（BPM、タイトル、パスなど）
 */

import { SongMeta, InstrumentType } from './types';

/**
 * 音源メタデータ
 */
export interface AudioSource {
  id: string;
  meta: SongMeta;
  paths: Record<InstrumentType, string>;
}

/**
 * 利用可能な音源
 *
 * NOTE: demo.mp3 は Cherry（SPYAIR）のカバー曲
 * 実際のBPMを測定して正確な値に更新してください
 */
export const AUDIO_SOURCES: Record<string, AudioSource> = {
  demo: {
    id: 'demo',
    meta: {
      title: 'Cherry (Cover)',
      artist: 'Unknown',
      bpm: 130, // TODO: 実際の音源のBPMを測定して正確な値に更新
      timeSignature: [4, 4],
    },
    paths: {
      full: '/audio/demo.mp3',
      vocals: '/audio/separated/vocals.wav',
      bass: '/audio/separated/bass.wav',
      drums: '/audio/separated/drums.wav',
      other: '/audio/separated/other.wav',
    },
  },
};

/**
 * デフォルト音源
 */
export const DEFAULT_AUDIO_SOURCE = AUDIO_SOURCES.demo;

/**
 * 音源IDから設定を取得
 */
export function getAudioSource(id: string): AudioSource {
  return AUDIO_SOURCES[id] || DEFAULT_AUDIO_SOURCE;
}

/**
 * 楽器パートの音源パスを取得
 */
export function getAudioPath(sourceId: string, instrument: InstrumentType): string {
  const source = getAudioSource(sourceId);
  return source.paths[instrument];
}

/**
 * 音源のBPMを取得
 */
export function getSourceBPM(sourceId: string): number {
  const source = getAudioSource(sourceId);
  return source.meta.bpm;
}
