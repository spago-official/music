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
    <div className="flex flex-col gap-3 max-w-2xl mx-auto">
      {instruments.map((instrument) => (
        <button
          key={instrument.id}
          onClick={() => onChange(instrument.id)}
          disabled={disabled}
          className={`
            flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 bg-white shadow-md
            ${
              selectedInstrument === instrument.id
                ? 'border-purple-600 bg-purple-50 shadow-lg'
                : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div className="text-4xl">{instrument.icon}</div>
          <div className="flex-1 text-left">
            <div className="text-base font-semibold text-gray-800">
              {instrument.name}
            </div>
            <div className="text-xs text-gray-500">
              {instrument.description}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
