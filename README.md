# Tap Music - タップで奏でる音楽アプリ

Web Audio APIを使った、タップでリズムを刻む音楽体験アプリ（MVP）

![Tap Music](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Web Audio API](https://img.shields.io/badge/Web_Audio_API-✓-green)

## 🎵 概要

**Tap Music**は、画面をタップすることで音楽を「奏でる」体験を提供するWebアプリケーションです。曲は常に内部で進行していますが、タップすることで一定時間だけ音が聞こえるようになります（ゲートモード）。ビートに合わせてタップすることで、自分が音楽を演奏しているような感覚を味わえます。

### 主な機能

- **ゲートモード**: タップで音量ゲートを開き、ビートに合わせて音楽を奏でる
- **リアルタイム判定**: タップのタイミングをPERFECT/GOOD/EARLY/LATE/MISSで判定
- **ビート可視化**: リアルタイムでビートを視覚的に表示
- **難易度調整**: EASY/NORMAL/HARDで判定窓の広さを変更
- **BPM調整**: 60-180の範囲でテンポを調整可能
- **キーボード対応**: スペースキーでもタップ可能

## 🚀 クイックスタート

### 必要環境

- Node.js 18.17以上
- npm または yarn

### インストールと起動

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev
```

ブラウザで http://localhost:3000 (または http://localhost:3001) を開く

### ビルド

```bash
# 本番ビルド
npm run build

# 本番サーバー起動
npm start
```

## 🎮 使い方

1. **START**ボタンを押して曲を再生開始（最初は無音）
2. タップパッドをタップ（またはスペースキー）してビートに合わせてタップ
3. リズムに乗ってタップし続けると、曲が鳴り続ける
4. 判定（PERFECT/GOOD/EARLY/LATE/MISS）を見ながらタイミングを調整
5. BPMや難易度を変えて遊んでみる

### 操作方法

- **タップパッド**: クリック/タップで音を鳴らす
- **スペースキー**: タップと同じ
- **START/PAUSE**: 再生/一時停止
- **RESET**: 最初から再開
- **BPMスライダー**: テンポ調整
- **Volumeスライダー**: 音量調整
- **Difficulty**: 判定窓の広さ変更

## 🏗️ アーキテクチャ

### ディレクトリ構成

```
tap-music-app/
├── app/
│   ├── page.tsx              # メインページ
│   ├── layout.tsx            # レイアウト
│   └── globals.css           # グローバルスタイル
├── components/
│   ├── TapPad.tsx            # タップパッドUI
│   ├── BeatMeter.tsx         # ビートメーター
│   ├── TransportControls.tsx # 再生コントロール
│   └── DifficultySelect.tsx  # 難易度選択
├── lib/
│   ├── types.ts              # 型定義
│   ├── audio/
│   │   ├── AudioEngine.ts    # Web Audio API管理
│   │   ├── Transport.ts      # 時間管理・クロック
│   │   └── modes/
│   │       └── GateMode.ts   # ゲートモード実装
│   └── timing/
│       └── quantize.ts       # 量子化・判定ロジック
└── public/
    └── audio/
        └── demo.mp3          # 音源ファイル
```

### 技術スタック

- **Next.js 16**: App Router使用
- **TypeScript**: 型安全な実装
- **Tailwind CSS**: スタイリング
- **Web Audio API**: 低レイテンシなオーディオ処理
- **React Hooks**: 状態管理

### 設計思想

#### 三層分離アーキテクチャ

1. **AudioEngine層**: Web Audio APIの抽象化
   - AudioContext管理
   - オーディオファイルの読み込み
   - ゲイン制御（マスター/ゲート）

2. **Transport層**: 音楽の時間管理
   - BPM、拍子の管理
   - 現在のビート情報計算
   - 再生/停止/リセット制御

3. **Mode層**: 演奏モードの実装
   - GateMode: タップでゲート開閉
   - (将来) StepMode: スライス再生
   - (将来) FollowMode: テンポ追従

#### クリック音防止

すべてのゲイン変更は`setTargetAtTime`を使用し、急激な変化を避けています。

```typescript
// 例: ゲート開閉
gateGainNode.gain.setTargetAtTime(targetValue, now, timeConstant);
```

#### タイミング精度

- `performance.now()`と`AudioContext.currentTime`を組み合わせて高精度な判定
- タップイベントは`pointerdown`を使用（`click`より低レイテンシ）
- iOS Safariの自動再生制限に対応

## 🎹 将来の拡張可能性

現在のMVPは基盤となる設計を実装しています。以下の拡張に対応可能：

### マルチトラック対応

```typescript
// Track型を拡張
interface Track {
  id: string;
  role: 'guitar' | 'bass' | 'drums' | 'vocal';
  buffer: AudioBuffer;
  gain: number;
  mute: boolean;
  solo: boolean;
}
```

### 複数人同時演奏

```typescript
// Session型を使用
interface Session {
  id: string;
  hostId: string;
  peers: Peer[];
  syncMode: 'strict' | 'natural';
}
```

### StepMode（スライス再生）

`lib/audio/modes/StepMode.ts`として実装予定

### FollowMode（テンポ追従）

`lib/audio/modes/FollowMode.ts`として実装予定

### モーション対応

DeviceMotionEvent/DeviceOrientationEventを使った操作

## 📱 対応環境

### デスクトップ

- ✅ Chrome (最新版)
- ✅ Firefox (最新版)
- ✅ Safari (最新版)
- ✅ Edge (最新版)

### モバイル

- ✅ iOS Safari (最新版)
- ✅ Android Chrome (最新版)

### 注意事項

- iOSでは初回タップ後にAudioContextが有効化されます
- モバイルではブラウザのバックグラウンド動作に制限があります
- 最良の体験にはヘッドフォン/イヤフォンの使用を推奨

## 🔧 カスタマイズ

### 音源の追加・変更

1. **音源ファイルの配置**
   - `public/audio/`に音源ファイルを配置
   - 分離音源の場合は`public/audio/separated/`に配置

2. **BPMの測定**
   - オンラインBPMツール（[TapTempo.io](https://taptempo.io/)など）を使用
   - 音源を再生しながらビートに合わせてタップしてBPMを測定
   - 既存の楽曲の場合、BPMデータベース（Songsterr、Tunebatなど）で確認可能
   - 注意: 数え方（倍取り）によってBPMが2倍になることがあります
     - 例: スピッツ「チェリー」は 97 BPM（倍取りで 194 BPM）

3. **設定ファイルの更新**

`lib/audio-config.ts`に音源情報を追加：

```typescript
export const AUDIO_SOURCES: Record<string, AudioSource> = {
  demo: {
    id: 'demo',
    meta: {
      title: 'Cherry (Cover)',
      artist: 'Spitz',
      bpm: 97, // スピッツ「チェリー」の正確なBPM
      timeSignature: [4, 4],
    },
    paths: {
      full: '/audio/demo.mp3',
      vocals: '/audio/separated/vocals.wav',
      bass: '/audio/separated/bass.wav',
      drums: '/audio/separated/drums.wav',
      other: '/audio/separated/other.wav',
    },
  },
  // 新しい音源を追加する場合
  mySong: {
    id: 'mySong',
    meta: {
      title: '曲名',
      artist: 'アーティスト名',
      bpm: 120, // 測定したBPM
      timeSignature: [4, 4],
    },
    paths: {
      full: '/audio/my-song.mp3',
      vocals: '/audio/separated/my-song-vocals.wav',
      // ... 他のパート
    },
  },
};
```

4. **音源の切り替え**

`app/play/page.tsx`で使用する音源IDを変更：

```typescript
const audioSourceId = 'mySong'; // 使用する音源IDを指定
```

### 判定窓の調整

`lib/timing/quantize.ts`の`JUDGEMENT_WINDOWS`を編集：

```typescript
const JUDGEMENT_WINDOWS: Record<Difficulty, { perfect: number; good: number; ok: number }> = {
  easy: { perfect: 100, good: 200, ok: 300 },
  normal: { perfect: 60, good: 120, ok: 200 },
  hard: { perfect: 40, good: 80, ok: 120 },
};
```

## 🐛 トラブルシューティング

### 音が鳴らない

- ブラウザの音量を確認
- アプリ内のVolumeスライダーを確認
- iOSの場合、サイレントモードを解除

### レイテンシが大きい

- ブラウザを最新版に更新
- 他のタブを閉じる
- Bluetoothオーディオではなく有線接続を使用

### タップ判定がずれる

- BPMを曲に合わせて調整
- 難易度をEASYに変更して試す

## 📄 ライセンス

MIT License

## 🙏 謝辞

- 音源: スピッツ「チェリー」(97 BPM) - デモ使用
- フレームワーク: Next.js, React
- Web標準: Web Audio API, Tone.js

---

**Tap Music** - 🎵 Tap to the beat, feel the rhythm
