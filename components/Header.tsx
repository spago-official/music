'use client';

interface HeaderProps {
  onHelpClick: () => void;
}

/**
 * アプリケーションヘッダー
 */
export default function Header({ onHelpClick }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* ロゴ/タイトル */}
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Tap Music
            </h1>
            <span className="text-xs text-gray-500 hidden sm:inline">
              🎵 タップでリズムを刻もう
            </span>
          </div>

          {/* ヘルプボタン */}
          <button
            onClick={onHelpClick}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="使い方を見る"
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
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
