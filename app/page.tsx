'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import TapPad from '@/components/TapPad';
import TransportControls from '@/components/TransportControls';
import TempoGuide from '@/components/TempoGuide';
import InstrumentSelect from '@/components/InstrumentSelect';
import { ToneAudioEngine } from '@/lib/audio/ToneAudioEngine';
import { Transport } from '@/lib/audio/Transport';
import { ToneFollowMode } from '@/lib/audio/modes/ToneFollowMode';
import { TapJudgement, InstrumentType } from '@/lib/types';
import * as Tone from 'tone';

export default function Home() {
  // オーディオエンジンとトランスポート
  const toneAudioEngineRef = useRef<ToneAudioEngine | null>(null);
  const transportRef = useRef<Transport | null>(null);
  const followModeRef = useRef<ToneFollowMode | null>(null);

  // UI状態
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(130); // Cherry は大体130 BPM
  const [volume, setVolume] = useState(0.8);
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentType>('full');
  const [lastJudgement, setLastJudgement] = useState<TapJudgement | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * 選択された楽器の音源パスを取得
   */
  const getAudioPath = (instrument: InstrumentType): string => {
    const pathMap: Record<InstrumentType, string> = {
      full: '/audio/demo.mp3',
      vocals: '/audio/separated/vocals.wav',
      bass: '/audio/separated/bass.wav',
      drums: '/audio/separated/drums.wav',
      other: '/audio/separated/other.wav',
    };
    return pathMap[instrument];
  };

  /**
   * 初期化（初回タップ時）
   */
  const initialize = async () => {
    if (isInitialized) return;

    setIsLoading(true);
    setError(null);

    try {
      // 選択された楽器の音源パスを取得
      const audioPath = getAudioPath(selectedInstrument);

      // Tone.jsを使用（ピッチ保存のため）
      const toneEngine = new ToneAudioEngine();
      await toneEngine.initialize();
      toneAudioEngineRef.current = toneEngine;
      await toneEngine.load(audioPath);

      // Tone.jsのコンテキストを使用
      const toneContext = Tone.getContext();
      const transport = new Transport(toneContext as any, {
        bpm,
        timeSignature: [4, 4],
      });
      transportRef.current = transport;

      // FOLLOWモードを初期化
      const followMode = new ToneFollowMode(toneEngine, transport, {
        tempoRange: [50, 200],
        adaptSpeed: 0.3,
        tapHistorySize: 4,
      });
      followModeRef.current = followMode;
      followMode.activate();

      setIsInitialized(true);
      console.log('✅ All systems initialized');
    } catch (err) {
      console.error('Initialization error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize audio');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 再生/一時停止
   */
  const handlePlayPause = async () => {
    if (!isInitialized) {
      await initialize();
      if (!toneAudioEngineRef.current || !transportRef.current) return;
    }

    const transport = transportRef.current!;
    const toneEngine = toneAudioEngineRef.current!;

    if (isPlaying) {
      // 一時停止
      transport.stop();
      setIsPlaying(false);
    } else {
      // 再生開始
      if (!toneEngine.getIsPlaying()) {
        toneEngine.play();
      }
      transport.start();
      setIsPlaying(true);
    }
  };

  /**
   * リセット
   */
  const handleReset = () => {
    if (!transportRef.current || !toneAudioEngineRef.current) return;

    transportRef.current.reset();
    toneAudioEngineRef.current.reset();
    if (followModeRef.current) {
      followModeRef.current.clearHistory();
    }
    setIsPlaying(false);
    setLastJudgement(null);
  };

  /**
   * タップハンドラ
   */
  const handleTap = useCallback(() => {
    if (!isPlaying) {
      // 初回タップで初期化して開始
      if (!isInitialized) {
        handlePlayPause();
      }
      return;
    }

    // FOLLOWモード処理
    if (followModeRef.current) {
      const tapEvent = followModeRef.current.onTap(performance.now());
      if (tapEvent) {
        setLastJudgement(tapEvent.judgement);
      }
    }
  }, [isPlaying, isInitialized]);

  /**
   * スペースキーでタップ
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleTap();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTap]);


  /**
   * BPM変更
   */
  const handleBPMChange = (newBpm: number) => {
    setBpm(newBpm);
    if (transportRef.current) {
      transportRef.current.setBPM(newBpm);
    }
  };

  /**
   * 音量変更
   */
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (toneAudioEngineRef.current) {
      toneAudioEngineRef.current.setMasterGain(newVolume);
    }
  };


  /**
   * 楽器変更
   */
  const handleInstrumentChange = async (newInstrument: InstrumentType) => {
    if (!isInitialized) {
      // まだ初期化されていない場合は、選択だけ変更
      setSelectedInstrument(newInstrument);
      return;
    }

    // 再生中の場合は停止
    const wasPlaying = isPlaying;
    if (wasPlaying) {
      handleReset();
    }

    setSelectedInstrument(newInstrument);
    setIsLoading(true);

    try {
      const audioPath = getAudioPath(newInstrument);

      // 新しい音源を読み込み
      if (toneAudioEngineRef.current) {
        await toneAudioEngineRef.current.load(audioPath);
      }

      console.log('🎵 Instrument changed:', newInstrument, 'path:', audioPath);

      // 再生中だった場合は再開
      if (wasPlaying) {
        handlePlayPause();
      }
    } catch (err) {
      console.error('Failed to change instrument:', err);
      setError(err instanceof Error ? err.message : 'Failed to change instrument');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * クリーンアップ
   */
  useEffect(() => {
    return () => {
      if (toneAudioEngineRef.current) {
        toneAudioEngineRef.current.dispose();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Tap Music
          </h1>
          <p className="text-gray-600">タップでリズムを刻もう</p>
          <p className="text-sm text-gray-500 mt-2">
            🎵 Playing: Spitz - Cherry (Demo)
          </p>
        </header>

        {/* エラー表示 */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <p className="font-semibold">⚠️ Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* メインコンテンツ */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* 楽器選択 */}
          <InstrumentSelect
            selectedInstrument={selectedInstrument}
            onChange={handleInstrumentChange}
            disabled={isLoading}
          />

          {/* トランスポートコントロール */}
          <div className="flex justify-center">
            <TransportControls
              isPlaying={isPlaying}
              bpm={bpm}
              volume={volume}
              onPlayPause={handlePlayPause}
              onReset={handleReset}
              onBPMChange={handleBPMChange}
              onVolumeChange={handleVolumeChange}
              disabled={isLoading}
            />
          </div>

          {/* テンポガイド */}
          <div className="flex justify-center">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <TempoGuide bpm={bpm} isPlaying={isPlaying} />
            </div>
          </div>

          {/* タップパッド */}
          <div className="flex justify-center">
            <TapPad
              onTap={handleTap}
              judgement={lastJudgement}
              currentBpm={bpm}
              disabled={isLoading}
            />
          </div>

          {/* 説明 */}
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6 text-sm text-gray-600 space-y-3">
            <h3 className="font-semibold text-gray-800 text-base">使い方：</h3>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>楽器を選択</strong>: Full Mix、Vocals、Bass、Drums、Otherから好きなパートを選べます</li>
              <li>STARTボタンを押すと曲が再生開始します</li>
              <li>タップパッドをタップ（またはスペースキー）でリズムを刻みます</li>
              <li><strong>タップのテンポに合わせて曲の速度が変わります</strong></li>
              <li>ゆっくりタップすれば曲も遅くなり、速くタップすれば曲も速くなります</li>
              <li>音程は保たれたまま、テンポだけが変わります</li>
            </ul>
            <p className="text-xs text-gray-500 mt-4">
              ℹ️ <strong>ヒント</strong>: 好きな楽器パートを選んで、あなたのリズムで演奏しましょう！音程を変えずにテンポだけを変えられるので、自由な速さで楽しめます。
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
