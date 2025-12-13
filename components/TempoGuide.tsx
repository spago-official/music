'use client';

import { useEffect, useState } from 'react';

interface TempoGuideProps {
  bpm: number;
  isPlaying: boolean;
}

/**
 * テンポガイド - 視覚的メトロノーム
 * 目標BPMのビートを光で示す
 */
export default function TempoGuide({ bpm, isPlaying }: TempoGuideProps) {
  const [isBeating, setIsBeating] = useState(false);
  const [beatCount, setBeatCount] = useState(0);

  useEffect(() => {
    if (!isPlaying) {
      setIsBeating(false);
      setBeatCount(0);
      return;
    }

    // 1拍の長さ（ミリ秒）
    const beatDuration = (60 / bpm) * 1000;

    const interval = setInterval(() => {
      setIsBeating(true);
      setBeatCount((prev) => (prev + 1) % 4);

      // 100msでビート表示を消す
      setTimeout(() => {
        setIsBeating(false);
      }, 100);
    }, beatDuration);

    return () => clearInterval(interval);
  }, [bpm, isPlaying]);

  if (!isPlaying) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-center">
        <p className="text-xs font-medium text-gray-700 mb-1">
          目標テンポ: <span className="text-purple-600 font-bold">{bpm} BPM</span>
        </p>
        <p className="text-[10px] text-gray-500">このリズムに合わせてタップ</p>
      </div>

      {/* メトロノーム表示 */}
      <div className="flex items-center gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`
              w-8 h-8 rounded-full transition-all duration-100
              ${beatCount === i && isBeating
                ? 'bg-purple-600 scale-125 shadow-lg'
                : 'bg-gray-300'
              }
              ${i === 0 ? 'ring-2 ring-purple-300' : ''}
            `}
          />
        ))}
      </div>

      {/* 音符アイコン */}
      <div className="flex items-center gap-2">
        <div
          className={`
            text-2xl transition-transform duration-100
            ${isBeating ? 'scale-125' : 'scale-100'}
          `}
        >
          {isBeating ? '♪' : '♩'}
        </div>
      </div>
    </div>
  );
}
