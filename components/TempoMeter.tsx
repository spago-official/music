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
    if (diff > 0) return '速い';
    return '遅い';
  };

  const position = getGaugePosition();
  const color = getColor();

  return (
    <div className="w-full">
      <div className="text-center mb-2">
        <h3 className="text-xs font-semibold text-gray-700">テンポメーター (目標: {targetBpm} BPM)</h3>
      </div>

      {/* ゲージ */}
      <div className="relative h-10 bg-gray-200 rounded-lg overflow-hidden mb-2">
        {/* 中央のライン */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-400 z-10 transform -translate-x-1/2" />

        {/* 左側のグラデーション（遅い） */}
        <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-gradient-to-r from-blue-300 to-transparent opacity-30" />

        {/* 右側のグラデーション（速い） */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-red-300 to-transparent opacity-30" />

        {/* インジケーター */}
        {isPlaying && currentBpm && (
          <div
            className={`absolute top-1/2 w-3 h-7 ${color} rounded-full transform -translate-y-1/2 transition-all duration-150 shadow-lg`}
            style={{
              left: `calc(50% + ${position / 2}%)`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        )}
      </div>

      {/* ラベル */}
      <div className="flex justify-between text-[10px] text-gray-600 mb-2">
        <span>← 遅い</span>
        <span className="font-semibold text-gray-700">ピッタリ</span>
        <span>速い →</span>
      </div>

      {/* ステータステキスト */}
      <div className="text-center">
        <p className={`text-xs font-bold ${
          !currentBpm ? 'text-gray-400' :
          Math.abs(getBpmDiff()) < 2 ? 'text-green-600' :
          'text-gray-700'
        }`}>
          {isPlaying ? getStatusText() : 'タップを開始してください'}
        </p>
      </div>
    </div>
  );
}
