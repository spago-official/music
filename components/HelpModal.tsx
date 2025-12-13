'use client';

import { useEffect } from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 使い方モーダル
 */
export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  // ESCキーで閉じる
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* モーダルコンテンツ */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-2xl font-bold text-gray-800">使い方</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="閉じる"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* コンテンツ */}
        <div className="px-6 py-6 text-gray-600 space-y-4">
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 text-lg">基本操作：</h3>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                <strong className="text-gray-800">楽器を選択</strong>: Full Mix、Vocals、Bass、Drums、Otherから好きなパートを選べます
              </li>
              <li>
                <strong className="text-gray-800">START</strong>ボタンを押すと曲が再生開始します
              </li>
              <li>
                タップパッドをタップ（またはスペースキー）でリズムを刻みます
              </li>
              <li>
                <strong className="text-gray-800">タップのテンポに合わせて曲の速度が変わります</strong>
              </li>
              <li>
                ゆっくりタップすれば曲も遅くなり、速くタップすれば曲も速くなります
              </li>
              <li>
                音程は保たれたまま、テンポだけが変わります
              </li>
            </ul>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-500">
              <strong className="text-gray-700">💡 ヒント</strong>: 好きな楽器パートを選んで、あなたのリズムで演奏しましょう！音程を変えずにテンポだけを変えられるので、自由な速さで楽しめます。
            </p>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-500">
              🎵 <strong className="text-gray-700">Playing</strong>: Spitz - Cherry (Demo)
            </p>
          </div>
        </div>

        {/* フッター */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-xl">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
