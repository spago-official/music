/**
 * タイミング量子化とビート判定
 */

import { TapJudgement, Difficulty } from '../types';

/**
 * 難易度ごとの判定窓（ミリ秒）
 */
const JUDGEMENT_WINDOWS: Record<Difficulty, { perfect: number; good: number; ok: number }> = {
  easy: { perfect: 100, good: 200, ok: 300 },
  normal: { perfect: 60, good: 120, ok: 200 },
  hard: { perfect: 40, good: 80, ok: 120 },
};

/**
 * BPMと拍子から1拍の長さ（秒）を計算
 */
export function getBeatDuration(bpm: number, timeSignature: [number, number]): number {
  // 1拍 = 60 / BPM 秒（4分音符基準）
  // timeSignature[1] が分母（4なら4分音符、8なら8分音符）
  const quarterNoteDuration = 60 / bpm;
  const beatDuration = quarterNoteDuration * (4 / timeSignature[1]);
  return beatDuration;
}

/**
 * 1小節の長さ（秒）を計算
 */
export function getBarDuration(bpm: number, timeSignature: [number, number]): number {
  const beatDuration = getBeatDuration(bpm, timeSignature);
  return beatDuration * timeSignature[0]; // 拍数をかける
}

/**
 * 現在時刻から直近のビートタイミングを計算
 * @param nowSec 現在時刻（秒）
 * @param bpm BPM
 * @param timeSignature 拍子
 * @param grid 量子化グリッド（1=1拍, 0.5=8分音符, 0.25=16分音符）
 * @returns 直近ビートの時刻（秒）
 */
export function quantizeToBeat(
  nowSec: number,
  bpm: number,
  timeSignature: [number, number] = [4, 4],
  grid: number = 1.0
): number {
  const beatDuration = getBeatDuration(bpm, timeSignature);
  const gridDuration = beatDuration * grid;

  // 現在時刻が何グリッド目か
  const gridIndex = Math.round(nowSec / gridDuration);

  return gridIndex * gridDuration;
}

/**
 * タップと直近ビートの偏差（ミリ秒）を計算
 * @param tapTimeSec タップ時刻（秒）
 * @param bpm BPM
 * @param timeSignature 拍子
 * @param grid 量子化グリッド
 * @returns 偏差（ミリ秒）。正=遅れ、負=早すぎ
 */
export function calculateDeviation(
  tapTimeSec: number,
  bpm: number,
  timeSignature: [number, number] = [4, 4],
  grid: number = 1.0
): number {
  const nearestBeat = quantizeToBeat(tapTimeSec, bpm, timeSignature, grid);
  const deviationSec = tapTimeSec - nearestBeat;
  return deviationSec * 1000; // ミリ秒に変換
}

/**
 * 偏差から判定を決定
 * @param deviationMs 偏差（ミリ秒）
 * @param difficulty 難易度
 * @returns 判定結果
 */
export function judgeDeviation(deviationMs: number, difficulty: Difficulty): TapJudgement {
  const absDeviation = Math.abs(deviationMs);
  const windows = JUDGEMENT_WINDOWS[difficulty];

  if (absDeviation <= windows.perfect) {
    return 'perfect';
  } else if (absDeviation <= windows.good) {
    return 'good';
  } else if (absDeviation <= windows.ok) {
    return deviationMs > 0 ? 'late' : 'early';
  } else {
    return 'miss';
  }
}

/**
 * タップを評価（偏差計算 + 判定）
 * @param tapTimeSec タップ時刻（秒）
 * @param bpm BPM
 * @param timeSignature 拍子
 * @param difficulty 難易度
 * @param grid 量子化グリッド
 * @returns { judgement, deviation }
 */
export function evaluateTap(
  tapTimeSec: number,
  bpm: number,
  timeSignature: [number, number] = [4, 4],
  difficulty: Difficulty = 'normal',
  grid: number = 1.0
): { judgement: TapJudgement; deviation: number } {
  const deviation = calculateDeviation(tapTimeSec, bpm, timeSignature, grid);
  const judgement = judgeDeviation(deviation, difficulty);

  return { judgement, deviation };
}

/**
 * 現在時刻からビート情報を計算
 * @param nowSec 現在時刻（秒）
 * @param bpm BPM
 * @param timeSignature 拍子
 * @returns ビート情報
 */
export function calculateBeatInfo(
  nowSec: number,
  bpm: number,
  timeSignature: [number, number] = [4, 4]
): { bar: number; beat: number; phase: number; totalBeats: number } {
  const beatDuration = getBeatDuration(bpm, timeSignature);
  const barDuration = getBarDuration(bpm, timeSignature);

  // 総拍数
  const totalBeats = Math.floor(nowSec / beatDuration);

  // 小節番号
  const bar = Math.floor(nowSec / barDuration);

  // 小節内の経過時間
  const timeInBar = nowSec % barDuration;

  // 拍番号（小節内）
  const beat = Math.floor(timeInBar / beatDuration);

  // 拍内位相 (0.0 ~ 1.0)
  const timeInBeat = timeInBar % beatDuration;
  const phase = timeInBeat / beatDuration;

  return { bar, beat, phase, totalBeats };
}

/**
 * 次のビートまでの時間（ミリ秒）を計算
 */
export function getTimeToNextBeat(
  nowSec: number,
  bpm: number,
  timeSignature: [number, number] = [4, 4]
): number {
  const beatDuration = getBeatDuration(bpm, timeSignature);
  const timeInBeat = nowSec % beatDuration;
  const timeToNext = beatDuration - timeInBeat;
  return timeToNext * 1000; // ミリ秒に変換
}
