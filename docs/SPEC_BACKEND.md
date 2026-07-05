# SPEC: バックエンド設計（Supabase）（F5）

策定: 2026-07 / 担当: Fable(設計)→Opus(実装=O10)→Sonnet(検証)
前提: [SPEC_RNG_REPLAY.md](SPEC_RNG_REPLAY.md)（リプレイ検証）／[SPEC_WEEKLY_TOWER.md](SPEC_WEEKLY_TOWER.md)（順位表の対象＝週塔）。
位置づけ: **ローンチ後・週塔がハッシュタグ運用で回り始めてから**着手する第2段ロケット。v1（ローカル+ハッシュタグ）で需要を確認してから実装する。

## 0. 一文サマリ

**登録不要のまま、週替わり塔のスコアをサーバが再シミュで検証して順位表に載せる。**
クライアントの申告は一切信用せず、正はサーバ側の正規エンジン再実行（SPEC_RNG_REPLAY §6）。任意でクラウドセーブも提供する。

## 1. 設計原則（ゲームの核を壊さない）

- **匿名ファースト**: このゲームのUSPは「インストール・登録不要」。**メール/パスワード登録を強制しない**。Supabase Anonymous Auth で無記名のまま参加でき、クラウドセーブ等の恒久化を望む人だけ後から任意で紐付け。
- **サーバ権威・クライアント不信**: スコア数値そのものは受け取らない。受け取るのは**リプレイlog**（seed+party+入力列）。サーバが再シミュして得た結果だけが正。
- **改竄は「検出」で足りる**: 完全防止（署名・難読化）はしない（SPEC_RNG_REPLAY §11）。再現しないスコアを弾ければ順位表は守れる。
- **無料枠で回す**: Supabase Free tier（DB 500MB/月間帯域等）内に収める。週次で古いlogを間引く（§7）。
- **個人情報を持たない**: PIIは保存しない。プレイヤー名は表示用の任意ニックネームのみ（既存 `playerName`）。

## 2. 認証（Anonymous Auth）

- 初回起動時に **`supabase.auth.signInAnonymously()`** で匿名ユーザーを作成、`auth.uid()` を得る。
  - このuidが順位表・クラウドセーブの所有者キー。localStorageのセッションで永続。
- **任意の恒久化（v2.1）**: 「別端末に引き継ぐ」を選んだ人だけ、匿名アカウントにメールOTPやOAuthをリンク（`linkIdentity`）。既定では一切求めない。
- 未認証（オフライン/失敗）でもゲームは完全に遊べる＝バックエンドは**純粋な付加機能**（既存localStorageセーブが常に主）。

## 3. データモデル（テーブル）

### 3.1 `players`（表示メタのみ）
| 列 | 型 | 備考 |
|---|---|---|
| id | uuid PK = auth.uid() | 匿名ユーザー |
| nickname | text | 表示名（任意・既定「ななし」）。PII禁止・長さ/NGワード検査 |
| title | text | 称号（クライアント申告・表示専用） |
| created_at | timestamptz | |

### 3.2 `weekly_scores`（順位表の本体）
| 列 | 型 | 備考 |
|---|---|---|
| id | uuid PK | |
| player_id | uuid FK→players | |
| week | text | `2026-W28`（SPEC_WEEKLY_TOWER §3） |
| reached | int | 制覇階数（**再シミュ後の値のみ格納**） |
| score | bigint | §6スコア（再シミュ後） |
| verified | bool | true=再シミュ一致。false=検証不能(版違い等)→参考記録 |
| ruleset | text | rulesetHash（SPEC_RNG_REPLAY §7） |
| modifier | text | 週モディファイアid |
| created_at | timestamptz | |
| 一意制約 | (player_id, week) | 1人1週1レコード（自己ベストのみ更新） |

### 3.3 `replay_logs`（検証の証拠・一時保管）
| 列 | 型 | 備考 |
|---|---|---|
| id | uuid PK | |
| score_id | uuid FK→weekly_scores | |
| log | jsonb | SPEC_RNG_REPLAY §5の行動ログ全体 |
| created_at | timestamptz | |
- logは検証に使ったら基本用済み。**その週の上位N件のみ保持**し残りは間引く（§7・容量対策）。

## 4. スコア提出フロー（O10・edge function）

```
クライアント: 週塔クリア → リプレイlog生成(SPEC_RNG_REPLAY §5) → submit_score(log) 呼出
        │
Edge Function `submit_score`（Deno・サーバ側で正規エンジンを実行）:
  1. ruleset照合。不一致 → verified=false で参考記録として格納し終了（棄却はしない）
  2. log.seed が `AO1|wtower|<今クライアントが主張する week>` の形式か・週が受付期間内か検査
  3. **turnResolver をサーバで import し、seed+party+cmds を再実行**（SPEC_RNG_REPLAY §6の検証器と同一コード）
  4. 各ターンckと result を照合。全一致 → verified=true
  5. 自己ベスト(player_id, week)より良ければ upsert。log を replay_logs へ
  6. 返却: { accepted, verified, rank推定 }
```

- **サーバがエンジンを実行できること＝O3β/γ（turnResolver抽出）が前提**。ここがF5/O10の技術的クリティカルパス。
- エンジンcoreは `src/engine/`（純関数・DOM非依存）なのでDenoでそのまま動く設計（SPEC_RNG_REPLAY §9のアーキテクチャがこれを担保）。
- レート制限: 同一player_id・同一週の提出は数回/分に制限（Edge Function内 or DBトリガ）。

## 5. RLS（Row Level Security）ポリシー

全テーブルRLS有効。**書き込みは基本Edge Function（service_role）経由**にして、クライアントの直書きは最小化。

| テーブル | select | insert/update | 方針 |
|---|---|---|---|
| players | 全員可(表示用) | 本人(auth.uid()=id)のみ upsert | nicknameは本人のみ変更 |
| weekly_scores | 全員可(順位表公開) | **service_roleのみ**（Edge経由） | クライアント直書き禁止＝スコア偽装不可 |
| replay_logs | 本人のみ or 非公開 | service_roleのみ | 証拠。公開不要 |
| cloud_saves(§8) | 本人のみ | 本人のみ | 他人のセーブは一切見えない |

- 順位表read は匿名でも可（公開ランキング）。ただしscoreの**書き込み経路をEdgeに一本化**することでRLSだけに頼らず整合を担保。

## 6. 順位表クエリ

- 週リーダーボード: `select nickname,reached,score,verified from weekly_scores join players where week=$1 and verified order by score desc limit 100`。
- 「あなたの順位」: 同週での自分のscoreの上位件数+1。
- 表示は verified を優先し、参考記録(verified=false)は別枠 or グレー表示（版違いプレイヤーを排除しないため）。

## 7. 容量・コスト管理（Free tier内）

- `replay_logs` は各週**確定後に上位保持ぶんを残して削除**（cron/pg_cron・日次）。1件2–5KB×上位数百件＝軽微。
- `weekly_scores` は1人1週1行＝行数はプレイヤー数×週数で線形。数千人規模まで無料枠で余裕。
- 帯域: 順位表readはキャッシュ可（同週内は上位が緩やかに変化）。クライアント側で短TTLキャッシュ。
- 監視: Supabaseダッシュボードで容量/帯域を週次確認（PROMOのKPIレビューに同席）。

## 8. クラウドセーブ（任意機能・優先度低）

- `cloud_saves`: { player_id PK, save jsonb, updated_at, device_label }。
- **手動同期を既定**（自動常時同期はコスト/競合が増える）: 設定画面に「クラウドに保存／から復元」。
- 競合解決: updated_at の新しい方を採用＋復元前に確認ダイアログ（ローカルを上書きする旨）。
- セーブJSONはそのまま（PIIなし）。将来のセーブ版マイグレーションは既存 `loadGame` の補完ロジックを流用。
- **注意**: クラウドセーブはチート耐性を与えない（セーブ改竄は依然可能）。順位表は§4の再シミュで独立に守られているため、セーブとスコアの信頼は分離されている。

## 9. 実装段取り（O10・依存順）

1. **前提**: O3β/γ（turnResolver抽出＋verify_replay.mjs）完了。これ無しにF5は始めない。
2. Supabaseプロジェクト作成・匿名Auth有効化・テーブル+RLS+一意制約。
3. `submit_score` Edge Function（verify_replayのサーバ移植＝同一engine import）。
4. クライアント: 匿名サインイン→週塔クリア時にlog提出→順位表画面。
5. 参考記録/検証済みの表示分け、レート制限、pg_cronの間引き。
6. （後日・任意）クラウドセーブ。

## 10. 受け入れテスト（Sonnet）

1. **匿名で完走**: 未登録のまま週塔スコア提出→順位表に自分が出る。
2. **改竄検出**: logのreached改竄→verified=false（サーバ再シミュ不一致）。RLSでweekly_scores直書きを試行→拒否。
3. **版違い**: 旧rulesetのlog提出→棄却されず参考記録として格納。
4. **自己ベスト更新**: 同週2回提出で良い方だけが残る（一意制約+upsert）。
5. **オフライン耐性**: バックエンド不通でもゲーム進行・ローカルセーブに影響なし。
6. **容量**: pg_cron間引き後に上位保持件数のlogのみ残る。

## 11. 非目標

- 課金/アイテム販売（サーバ権限管理が別次元。F8 Steam判断後に別spec）。
- リアルタイム対戦・同期（本ゲームは非同期スコア競争）。
- フレンド/ソーシャルグラフ。
- 完全なチート防止（正はサーバ再シミュ＝検出主義。SPEC_RNG_REPLAY §11を踏襲）。
