'use client';

interface TransportControlsProps {
  isPlaying: boolean;
  bpm: number;
  volume: number;
  onPlayPause: () => void;
  onReset: () => void;
  onBPMChange: (bpm: number) => void;
  onVolumeChange: (volume: number) => void;
  disabled?: boolean;
}

/**
 * トランスポートコントロール - 再生/停止、BPM、音量調整
 */
export default function TransportControls({
  isPlaying,
  bpm,
  volume,
  onPlayPause,
  onReset,
  onBPMChange,
  onVolumeChange,
  disabled = false,
}: TransportControlsProps) {
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
          {isPlaying ? '⏸ PAUSE' : '▶ START'}
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

      {/* BPMコントロール */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          BPM: <span className="text-purple-600 font-bold tabular-nums">{bpm}</span>
        </label>
        <div className="flex gap-3 items-center">
          <input
            type="range"
            min="60"
            max="180"
            step="1"
            value={bpm}
            onChange={(e) => onBPMChange(Number(e.target.value))}
            disabled={disabled}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
          />
          <input
            type="number"
            min="60"
            max="180"
            value={bpm}
            onChange={(e) => onBPMChange(Number(e.target.value))}
            disabled={disabled}
            className="w-20 px-2 py-1 border border-gray-300 rounded text-center disabled:bg-gray-100"
          />
        </div>
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
