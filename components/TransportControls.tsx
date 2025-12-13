'use client';

interface TransportControlsProps {
  isPlaying: boolean;
  isInitialized: boolean;
  volume: number;
  onPlayPause: () => void;
  onReset: () => void;
  onVolumeChange: (volume: number) => void;
  disabled?: boolean;
}

/**
 * トランスポートコントロール - 再生/停止、音量調整
 */
export default function TransportControls({
  isPlaying,
  isInitialized,
  volume,
  onPlayPause,
  onReset,
  onVolumeChange,
  disabled = false,
}: TransportControlsProps) {
  const getButtonLabel = () => {
    if (isPlaying) return '⏸ PAUSE';
    if (isInitialized) return '▶ START';
    return '🎵 READY';
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-md bg-white rounded-xl shadow-lg p-6">
      {/* 再生コントロール */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={onPlayPause}
          disabled={disabled}
          className={`
            px-8 py-3 rounded-lg font-semibold text-white
            ${disabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 active:scale-95'}
            transition-all shadow-md
          `}
        >
          {getButtonLabel()}
        </button>
        <button
          onClick={onReset}
          disabled={disabled}
          className={`
            px-6 py-3 rounded-lg font-semibold
            ${disabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300 active:scale-95'}
            transition-all shadow-md
          `}
        >
          ⏹ RESET
        </button>
      </div>

      {/* 音量コントロール */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Volume: <span className="text-purple-600 font-bold">{Math.round(volume * 100)}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
}
