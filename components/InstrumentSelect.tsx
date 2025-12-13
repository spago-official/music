'use client';

import { InstrumentType } from '@/lib/types';

interface InstrumentSelectProps {
  selectedInstrument: InstrumentType;
  onChange: (instrument: InstrumentType) => void;
  disabled?: boolean;
}

/**
 * 楽器選択コンポーネント
 */
export default function InstrumentSelect({
  selectedInstrument,
  onChange,
  disabled = false,
}: InstrumentSelectProps) {
  const instruments: Array<{ id: InstrumentType; name: string; icon: string; description: string }> = [
    { id: 'full', name: 'Full Mix', icon: '🎵', description: 'フルミックス' },
    { id: 'vocals', name: 'Vocals', icon: '🎤', description: 'ボーカルのみ' },
    { id: 'bass', name: 'Bass', icon: '🎸', description: 'ベースのみ' },
    { id: 'drums', name: 'Drums', icon: '🥁', description: 'ドラムのみ' },
    { id: 'other', name: 'Other', icon: '🎹', description: 'その他の楽器' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
        楽器を選択
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {instruments.map((instrument) => (
          <button
            key={instrument.id}
            onClick={() => onChange(instrument.id)}
            disabled={disabled}
            className={`
              p-4 rounded-lg border-2 transition-all duration-200
              ${
                selectedInstrument === instrument.id
                  ? 'border-purple-600 bg-purple-50 shadow-md scale-105'
                  : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="text-4xl mb-2">{instrument.icon}</div>
            <div className="text-sm font-semibold text-gray-800">
              {instrument.name}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {instrument.description}
            </div>
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-4 text-center">
        💡 ヒント: 分離された音源を選んで、それぞれのパートだけでリズムを刻めます
      </p>
    </div>
  );
}
