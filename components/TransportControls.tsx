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
    <div className="flex gap-4 w-full">
      <button
        onClick={onPlayPause}
        disabled={disabled}
        className={`
          flex-1 py-2 rounded-lg font-semibold text-white text-sm
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
          flex-1 py-2 rounded-lg font-semibold text-sm
          ${disabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300 active:scale-95'}
          transition-all shadow-md
        `}
      >
        ⏹ RESET
      </button>
    </div>
  );
}
