'use client';

import { useEffect, useState } from 'react';
import { TapJudgement } from '@/lib/types';

interface TapPadProps {
  onTap: () => void;
  judgement: TapJudgement | null;
  currentBpm: number;
  disabled?: boolean;
}

/**
 * タップパッドコンポーネント
 * タップ時に波紋アニメーションを表示
 */
export default function TapPad({ onTap, judgement, currentBpm, disabled = false }: TapPadProps) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [rippleId, setRippleId] = useState(0);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;

    // タップコールバック
    onTap();

    // 波紋アニメーション
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newRipple = { id: rippleId, x, y };
    setRipples((prev) => [...prev, newRipple]);
    setRippleId((prev) => prev + 1);

    // 1秒後に波紋を削除
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 1000);
  };

  // 判定に応じた色
  const getJudgementColor = (judge: TapJudgement | null): string => {
    if (!judge) return 'text-gray-400';
    switch (judge) {
      case 'perfect':
        return 'text-yellow-400';
      case 'good':
        return 'text-green-400';
      case 'early':
        return 'text-blue-400';
      case 'late':
        return 'text-orange-400';
      case 'miss':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getBpmText = (bpm: number): string => {
    return `${Math.round(bpm)} BPM`;
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      {/* タップパッド */}
      <div
        className={`
          relative w-full max-w-md aspect-square
          rounded-full
          ${disabled ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-br from-purple-500 to-pink-500 cursor-pointer active:scale-95'}
          transition-transform shadow-2xl
          overflow-hidden
          select-none
        `}
        onPointerDown={handlePointerDown}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Tap to play music"
      >
        {/* 波紋エフェクト */}
        {ripples.map((ripple) => (
          <div
            key={ripple.id}
            className="absolute rounded-full bg-white animate-ripple pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: 0,
              height: 0,
            }}
          />
        ))}

        {/* 中央テキスト */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="text-4xl font-bold mb-2">🎵</div>
            <div className={disabled ? 'text-base font-semibold' : 'text-2xl font-semibold'}>
              {disabled ? 'READYを押してください' : 'TAP'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
