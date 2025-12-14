'use client';

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
}

/**
 * 楽曲の進行状況を表示するプログレスバー
 */
export default function ProgressBar({ currentTime, duration, isPlaying }: ProgressBarProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow-md p-3">
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-600 min-w-[35px]">
          {formatTime(currentTime)}
        </span>

        {/* プログレスバー */}
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-600 transition-all duration-100"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>

        <span className="text-xs text-gray-600 min-w-[35px]">
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}
