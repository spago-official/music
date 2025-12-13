'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import HelpModal from '@/components/HelpModal';
import InstrumentSelect from '@/components/InstrumentSelect';
import { InstrumentType } from '@/lib/types';

export default function Home() {
  const router = useRouter();
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentType>('full');
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const handleStart = () => {
    // 選択された楽器とともに演奏ページに遷移
    router.push(`/play?instrument=${selectedInstrument}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* ヘッダー */}
      <Header onHelpClick={() => setIsHelpOpen(true)} />

      {/* ヘルプモーダル */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* メインコンテンツ */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              楽器を選択してください
            </h2>
            <p className="text-lg text-gray-600">
              好きなパートを選んで、あなたのリズムで演奏しましょう
            </p>
          </div>

          {/* 楽器選択 */}
          <div className="mb-12">
            <InstrumentSelect
              selectedInstrument={selectedInstrument}
              onChange={setSelectedInstrument}
            />
          </div>

          {/* STARTボタン */}
          <div className="flex justify-center">
            <button
              onClick={handleStart}
              className="px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xl font-bold rounded-full shadow-lg transition-all transform hover:scale-105 active:scale-95"
            >
              START 🎵
            </button>
          </div>

          {/* 説明 */}
          <div className="mt-16 max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6 text-sm text-gray-600 space-y-3">
            <h3 className="font-semibold text-gray-800 text-base">このアプリについて：</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>タップのテンポに合わせて曲の速度が変わります</li>
              <li>ゆっくりタップすれば曲も遅くなり、速くタップすれば曲も速くなります</li>
              <li>音程は保たれたまま、テンポだけが変わります</li>
              <li>Full Mix、Vocals、Bass、Drums、Otherから好きなパートを選べます</li>
            </ul>
            <p className="text-xs text-gray-500 mt-4">
              💡 <strong>ヒント</strong>: 音程を変えずにテンポだけを変えられるので、自由な速さで楽しめます。
            </p>
          </div>
        </div>

        {/* フッター */}
        <footer className="text-center mt-16 text-sm text-gray-500">
          <p>Built with Next.js + Web Audio API</p>
          <p className="mt-1">🎵 Tap to the beat, feel the rhythm</p>
        </footer>
      </div>
    </div>
  );
}
