'use client';

interface TempoMeterProps {
  targetBpm: number;
  currentBpm: number | null;
  isPlaying: boolean;
}

/**
 * テンポメーター - タップのテンポが目標に対して速い/遅いを表示
 */
export default function TempoMeter({ targetBpm, currentBpm, isPlaying }: TempoMeterProps) {
  // BPMの差分を計算
  const getBpmDiff = (): number => {
    if (!currentBpm) return 0;
    return currentBpm - targetBpm;
  };

  // ゲージの位置を計算（-100 to +100）
  const getGaugePosition = (): number => {
    const diff = getBpmDiff();
    // ±30 BPMを最大値として、-100から+100にマッピング
    const maxDiff = 30;
    const position = (diff / maxDiff) * 100;
    // -100から+100の範囲にクランプ
    return Math.max(-100, Math.min(100, position));
  };

  // 色を計算
  const getColor = (): string => {
    const position = Math.abs(getGaugePosition());
    if (position < 10) return 'bg-green-500'; // ピッタリ
    if (position < 30) return 'bg-yellow-500'; // ちょっとずれてる
    if (position < 60) return 'bg-orange-500'; // かなりずれてる
    return 'bg-red-500'; // めっちゃずれてる
  };

  // テキストを取得
  const getStatusText = (): string => {
    if (!currentBpm) return '---';
    const diff = getBpmDiff();
    if (Math.abs(diff) < 2) return 'PERFECT!';
    if (diff > 0) return `+${diff.toFixed(1)} BPM (速い)`;
    return `${diff.toFixed(1)} BPM (遅い)`;
  };

  const position = getGaugePosition();
  const color = getColor();

  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
      <div className="text-center mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">テンポメーター</h3>
        <p className="text-xs text-gray-500">
          目標: {targetBpm} BPM
        </p>
      </div>

      {/* ゲージ */}
      <div className="relative h-12 bg-gray-200 rounded-lg overflow-hidden mb-3">
        {/* 中央のライン */}
        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gray-400 z-10 transform -translate-x-1/2" />

        {/* 左側のグラデーション（遅い） */}
        <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-gradient-to-r from-blue-300 to-transparent opacity-30" />

        {/* 右側のグラデーション（速い） */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-red-300 to-transparent opacity-30" />

        {/* インジケーター */}
        {isPlaying && currentBpm && (
          <div
            className={`absolute top-1/2 w-4 h-8 ${color} rounded-full transform -translate-y-1/2 transition-all duration-150 shadow-lg`}
            style={{
              left: `calc(50% + ${position / 2}%)`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        )}
      </div>

      {/* ラベル */}
      <div className="flex justify-between text-xs text-gray-600 mb-3">
        <span>← 遅い</span>
        <span className="font-semibold text-gray-700">ピッタリ</span>
        <span>速い →</span>
      </div>

      {/* ステータステキスト */}
      <div className="text-center">
        <p className={`text-sm font-bold ${
          !currentBpm ? 'text-gray-400' :
          Math.abs(getBpmDiff()) < 2 ? 'text-green-600' :
          'text-gray-700'
        }`}>
          {isPlaying ? getStatusText() : 'タップを開始してください'}
        </p>
        {currentBpm && isPlaying && (
          <p className="text-xs text-gray-500 mt-1">
            現在のテンポ: {currentBpm.toFixed(1)} BPM
          </p>
        )}
      </div>
    </div>
  );
}
