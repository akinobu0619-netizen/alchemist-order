# 音楽（BGM）プロンプト集 — Suno用

世界観: 近世西洋・錬金術ファンタジー。**シネマティックなJRPGオーケストラ**（FF的）で、**哀愁がありつつかっこいい**。

## 使い方（Suno）
1. **Instrumental（インストゥルメンタル）をON**（歌詞なしBGM）。
2. **Style（曲調）欄**に下のプロンプトを貼る。**Title**も設定。
3. 構成を効かせたい場合は、歌詞欄に `[Intro] [Build] [Main Theme] [Climax] [Outro]` のような**メタタグ**だけ入れる（インストでも構成誘導に効く）。
4. 1プロンプトで**数バージョン生成→いちばん良いものを採用**。ループ用に整えるのは後でこちらでも可。
5. ⚠️ 既存ゲーム名・作曲家名・アーティスト名は入れない（弾かれる/不安定）。音は「楽器・ジャンル・雰囲気・BPM」で表現する。

---

## ① オープニング / タイトル曲（哀愁＋荘厳）

**Title 例**: `Alchemist's Oath`

**Style（貼る）**:
```
Cinematic medieval-fantasy orchestral main theme, melancholic yet noble and hopeful,
sweeping lush strings, expressive solo cello and violin melody, harp and lute arpeggios,
ethereal wordless choir, warm solo flute, distant French horns, gentle timpani,
nostalgic and heroic, slow rubato build into a grand emotional swell, spacious reverb,
JRPG title screen, around 70 BPM, instrumental
```
**構成タグ（任意・歌詞欄）**: `[Soft Intro] [Theme on cello] [Strings build] [Grand swell with choir] [Quiet outro]`

> もし歌声入りの“テーマ曲”が欲しい場合は Instrumental を切り、荘厳なソプラノ＋合唱で。歌詞は意味より響き重視のラテン語風（例: `Lux aeterna, anima ignis...`）を別途出せます。

---

## ② ボス戦曲（めっちゃかっこいい）

**Title 例**: `Ashen King`

**Style（貼る）**:
```
Epic orchestral-rock boss battle theme, intense and cinematic, aggressive staccato
string ostinato, blaring brass stabs, heavy distorted electric guitar riffs,
thunderous taiko and double-bass drums, dramatic Latin choir chant, ominous pipe organ,
dark and heroic, relentless driving rhythm, dissonant tension into a key-change climax,
JRPG final boss, around 160 BPM, instrumental
```
**構成タグ（任意）**: `[Tense Intro] [Drop into main riff] [Choir chant section] [Guitar+strings duel] [Key-change climax] [Loop]`

> 「ラスボス＝灰王マグヌス」用に荘厳さ強め。通常ボス用に少し軽くするなら `final boss`→`battle theme`、BPMを `145` 程度に。

---

## 命名・配置（決めておく）
生成したMP3を `public/audio/<キー>.mp3` に置けば、こちらで画面ごとにループBGM＋ミュート切替を実装します。

| キー | 用途 |
|------|------|
| `title.mp3` | タイトル/オープニング |
| `boss.mp3` | ボス戦（ラスボス/支部長エース） |
| `battle.mp3` | 通常戦闘（今後） |
| `field.mp3` | フィールド探索（今後） |
| `town.mp3` | 町（今後） |
| `victory.mp3` | 勝利ファンファーレ（短尺・今後） |

## 今後ほしい曲（優先順メモ）
1. タイトル ② ボス（←今ここ） 3. 通常戦闘 4. フィールド 5. 町 6. 勝利ジングル 7. エンディング（哀愁の大曲）

→ タイトルとボスができたら `public/audio/` に入れて教えてください。BGM再生（ループ・画面遷移で切替・音量/ミュートUI）を実装します。
