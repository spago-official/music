'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TapPad from '@/components/TapPad';
import TransportControls from '@/components/TransportControls';
import TempoGuide from '@/components/TempoGuide';
import TempoMeter from '@/components/TempoMeter';
import ProgressBar from '@/components/ProgressBar';
import Header from '@/components/Header';
import HelpModal from '@/components/HelpModal';
import { ToneAudioEngine } from '@/lib/audio/ToneAudioEngine';
import { Transport } from '@/lib/audio/Transport';
import { ToneFollowMode } from '@/lib/audio/modes/ToneFollowMode';
import { TapJudgement, InstrumentType } from '@/lib/types';
import { DEFAULT_AUDIO_SOURCE, getAudioPath, getSourceBPM } from '@/lib/audio-config';
import * as Tone from 'tone';

function PlayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const instrumentParam = searchParams.get('instrument') as InstrumentType | null;

  // オーディオエンジンとトランスポート
  const toneAudioEngineRef = useRef<ToneAudioEngine | null>(null);
  const transportRef = useRef<Transport | null>(null);
  const followModeRef = useRef<ToneFollowMode | null>(null);

  // 音源設定
  const audioSourceId = 'demo'; // 現在は1つのみ
  const sourceBPM = getSourceBPM(audioSourceId);

  // UI状態
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm] = useState(sourceBPM); // 音源の正しいBPMを使用
  const [volume, setVolume] = useState(0.8);
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentType>(
    instrumentParam || 'full'
  );
  const [lastJudgement, setLastJudgement] = useState<TapJudgement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [estimatedBpm, setEstimatedBpm] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);


  // 楽器が指定されていない場合はトップページにリダイレクト
  useEffect(() => {
    if (!instrumentParam) {
      router.push('/');
    }
  }, [instrumentParam, router]);

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
      const audioPath = getAudioPath(audioSourceId, selectedInstrument);

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
      // 初期化して再生開始
      await initialize();
      if (!toneAudioEngineRef.current || !transportRef.current) return;

      // 初期化完了後に再生開始
      const toneEngine = toneAudioEngineRef.current;
      const transport = transportRef.current;

      toneEngine.play();
      transport.start();
      setIsPlaying(true);
      return;
    }

    const transport = transportRef.current!;
    const toneEngine = toneAudioEngineRef.current!;

    if (isPlaying) {
      // 一時停止（音楽は流れ続けるがゲートで無音に）
      transport.stop();
      toneEngine.setGate(false);
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
    // 初期化されていない場合は初期化して再生開始
    if (!isInitialized) {
      await initialize();
      if (!toneAudioEngineRef.current || !transportRef.current || !followModeRef.current) return;

      // 初期化完了後すぐに再生開始
      const transport = transportRef.current;
      const toneEngine = toneAudioEngineRef.current;

      toneEngine.play();
      transport.start();
      setIsPlaying(true);

      // ゲートを開いて音を出す
      const tapEvent = followModeRef.current.onTap(performance.now());
      if (tapEvent) {
        setLastJudgement(tapEvent.judgement);
      }
      return;
    }

    // 初期化済みだが再生されていない場合は再生開始
    if (!isPlaying) {
      const transport = transportRef.current!;
      const toneEngine = toneAudioEngineRef.current!;

      if (!toneEngine.getIsPlaying()) {
        toneEngine.play();
      }
      transport.start();
      setIsPlaying(true);

      // ゲートを開いて音を出す
      if (followModeRef.current) {
        const tapEvent = followModeRef.current.onTap(performance.now());
        if (tapEvent) {
          setLastJudgement(tapEvent.judgement);
        }
      }
      return;
    }

    // FOLLOWモード処理（再生中のタップ）
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
   * 推定BPMを定期的に更新
   */
  useEffect(() => {
    if (!isPlaying || !followModeRef.current) return;

    const interval = setInterval(() => {
      if (followModeRef.current) {
        const estimated = followModeRef.current.getEstimatedBPM();
        setEstimatedBpm(estimated);
      }
    }, 100); // 100msごとに更新

    return () => clearInterval(interval);
  }, [isPlaying]);

  /**
   * 再生位置を定期的に更新
   */
  useEffect(() => {
    if (!toneAudioEngineRef.current) return;

    const engine = toneAudioEngineRef.current;

    // 曲の長さを取得
    const audioDuration = engine.getDuration();
    setDuration(audioDuration);

    // 再生位置を定期的に更新
    const interval = setInterval(() => {
      if (engine) {
        const time = engine.getCurrentTime();
        setCurrentTime(time);
      }
    }, 100); // 100msごとに更新

    return () => clearInterval(interval);
  }, [isInitialized, isPlaying]);


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

      <div className="container mx-auto px-4 py-4">
        {/* 選択中の楽器表示 */}
        <div className="max-w-4xl mx-auto mb-1">
          <div className="bg-white rounded-lg shadow-md p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">選択中:</span>
              <span className="text-base font-bold text-purple-600">
                {getInstrumentName(selectedInstrument)}
              </span>
            </div>
            <button
              onClick={handleChangeInstrument}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              楽器を変更
            </button>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="max-w-2xl mx-auto mb-1 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <p className="font-semibold text-sm">⚠️ Error</p>
            <p className="text-xs">{error}</p>
          </div>
        )}

        {/* メインコンテンツ */}
        <div className="max-w-6xl mx-auto space-y-2">
          {/* 上段: TransportControls と TempoGuide/Meter */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 左側: プログレスバーとトランスポートコントロール */}
            <div className="flex flex-col items-center gap-2">
              {/* プログレスバー */}
              <ProgressBar
                currentTime={currentTime}
                duration={duration}
                isPlaying={isPlaying}
              />

              {/* トランスポートコントロール */}
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

            {/* テンポ情報 */}
            <div className="bg-white rounded-xl shadow-lg p-4 space-y-4">
              <TempoGuide bpm={bpm} isPlaying={isPlaying} />
              <TempoMeter
                targetBpm={bpm}
                currentBpm={estimatedBpm}
                isPlaying={isPlaying}
              />
            </div>
          </div>

          {/* メッセージ */}
          <div className="text-center min-h-[2rem]">
            {isInitialized && !isPlaying && (
              <p className="text-base text-purple-600 font-semibold animate-pulse">
                👇 タップパッドをタップして演奏を開始
              </p>
            )}
          </div>

          {/* タップパッド */}
          <div className="flex justify-center pt-2">
            <TapPad
              onTap={handleTap}
              judgement={lastJudgement}
              currentBpm={bpm}
              disabled={isLoading}
            />
          </div>
        </div>
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
