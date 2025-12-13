'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TapPad from '@/components/TapPad';
import TransportControls from '@/components/TransportControls';
import TempoGuide from '@/components/TempoGuide';
import Header from '@/components/Header';
import HelpModal from '@/components/HelpModal';
import { ToneAudioEngine } from '@/lib/audio/ToneAudioEngine';
import { Transport } from '@/lib/audio/Transport';
import { ToneFollowMode } from '@/lib/audio/modes/ToneFollowMode';
import { TapJudgement, InstrumentType } from '@/lib/types';
import * as Tone from 'tone';

function PlayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const instrumentParam = searchParams.get('instrument') as InstrumentType | null;

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
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentType>(
    instrumentParam || 'full'
  );
  const [lastJudgement, setLastJudgement] = useState<TapJudgement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // 楽器が指定されていない場合はトップページにリダイレクト
  useEffect(() => {
    if (!instrumentParam) {
      router.push('/');
    }
  }, [instrumentParam, router]);

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
   * 楽器名を日本語で取得
   */
  const getInstrumentName = (instrument: InstrumentType): string => {
    const nameMap: Record<InstrumentType, string> = {
      full: 'Full Mix',
      vocals: 'Vocals',
      bass: 'Bass',
      drums: 'Drums',
      other: 'Other',
    };
    return nameMap[instrument];
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
  const handlePlayPause = useCallback(async () => {
    if (!isInitialized) {
      // 初期化のみ（再生はしない）
      await initialize();
      return;
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
  }, [isInitialized, isPlaying]);

  /**
   * リセット
   */
  const handleReset = useCallback(() => {
    if (!transportRef.current || !toneAudioEngineRef.current) return;

    transportRef.current.reset();
    toneAudioEngineRef.current.reset();
    if (followModeRef.current) {
      followModeRef.current.clearHistory();
    }
    setIsPlaying(false);
    setLastJudgement(null);
  }, []);

  /**
   * タップハンドラ
   */
  const handleTap = useCallback(async () => {
    // 初期化されていない場合は初期化
    if (!isInitialized) {
      await initialize();
      if (!toneAudioEngineRef.current || !transportRef.current) return;
    }

    // 再生されていない場合は再生開始
    if (!isPlaying) {
      const transport = transportRef.current!;
      const toneEngine = toneAudioEngineRef.current!;

      if (!toneEngine.getIsPlaying()) {
        toneEngine.play();
      }
      transport.start();
      setIsPlaying(true);
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
   * BPMを定期的に更新
   */
  useEffect(() => {
    if (!isPlaying || !transportRef.current) return;

    const interval = setInterval(() => {
      if (transportRef.current) {
        const currentBpm = transportRef.current.getBPM();
        setBpm(currentBpm);
      }
    }, 100); // 100msごとに更新

    return () => clearInterval(interval);
  }, [isPlaying]);

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
   * 楽器を変更して戻る
   */
  const handleChangeInstrument = () => {
    // 再生中なら停止
    if (isPlaying) {
      handleReset();
    }
    // トップページに戻る
    router.push('/');
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

  // 楽器が指定されていない場合は何も表示しない
  if (!instrumentParam) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* ヘッダー */}
      <Header onHelpClick={() => setIsHelpOpen(true)} />

      {/* ヘルプモーダル */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      <div className="container mx-auto px-4 py-8">
        {/* 選択中の楽器表示 */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="bg-white rounded-xl shadow-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">選択中:</span>
              <span className="text-lg font-bold text-purple-600">
                {getInstrumentName(selectedInstrument)}
              </span>
            </div>
            <button
              onClick={handleChangeInstrument}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-semibold transition-colors"
            >
              楽器を変更
            </button>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <p className="font-semibold">⚠️ Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* メインコンテンツ */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* 初期化済みで再生前の場合のメッセージ */}
          {isInitialized && !isPlaying && (
            <div className="text-center">
              <p className="text-lg text-purple-600 font-semibold animate-pulse">
                👇 タップパッドをタップして演奏を開始しましょう
              </p>
            </div>
          )}

          {/* トランスポートコントロール */}
          <div className="flex justify-center">
            <TransportControls
              isPlaying={isPlaying}
              isInitialized={isInitialized}
              volume={volume}
              onPlayPause={handlePlayPause}
              onReset={handleReset}
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

export default function PlayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <PlayContent />
    </Suspense>
  );
}
