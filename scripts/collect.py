#!/usr/bin/env python3
"""ポートフォリオ用の統計データを生成して data.json に焼き込む。

使い方:
    python3 scripts/collect.py

必要なもの:
    - gh CLI (ログイン済み)
    - scripts/mapping.local.json  … privateリポジトリ名→カテゴリの対応表。
      privateリポジトリ名を含むため gitignore されている。存在しない場合は
      未分類リポジトリ一覧を表示して中断する。

出力 (data.json) には集計値のみを含める。privateリポジトリの名前・説明が
1つでも混入していたらアサーションで中断する。
"""
import json
import re
import subprocess
import sys
import concurrent.futures
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MAPPING_PATH = ROOT / "scripts" / "mapping.local.json"
OUT_PATH = ROOT / "data.json"

# 1リポジトリの1言語あたりのバイト数上限。vendoredコードによる偏りを抑える
LANG_BYTE_CAP = 500_000

CATEGORIES = [
    "ai-agents",     # AIエージェント / LLMアプリケーション
    "web-saas",      # Webサービス / SaaS
    "native-apps",   # モバイル / デスクトップネイティブ
    "trading",       # トレーディング / 予測市場 / データ分析
    "devtools",      # 開発ツール / CLI / エージェントスキル
    "ml",            # 機械学習 / 強化学習
    "systems",       # 低レイヤ / システムプログラミング
    "web3",          # ブロックチェーン / zk
    "experiments",   # プロトタイプ / 実験
]


def gh(args, timeout=60):
    out = subprocess.run(["gh"] + args, capture_output=True, text=True, timeout=timeout)
    if out.returncode != 0:
        sys.exit(f"gh failed: {args}\n{out.stderr}")
    return out.stdout


def main():
    if not MAPPING_PATH.exists():
        sys.exit(f"{MAPPING_PATH} がない。カテゴリ対応表を用意してから実行して。")
    mapping = json.loads(MAPPING_PATH.read_text())

    repos = json.loads(gh([
        "repo", "list", "konaito", "--limit", "300", "--json",
        "name,visibility,description,primaryLanguage,createdAt,pushedAt,stargazerCount,isFork,url",
    ]))
    repos = [r for r in repos if not r["isFork"]]

    # 未分類のprivateリポジトリがあれば中断（黙って落とさない）
    unmapped = [r["name"] for r in repos if r["name"] not in mapping]
    if unmapped:
        sys.exit("未分類リポジトリがある。mapping.local.json に追加して:\n" + "\n".join(unmapped))

    # 言語バイト数（並列取得、キャップ付き）
    def langs(name):
        try:
            out = subprocess.run(["gh", "api", f"repos/konaito/{name}/languages"],
                                 capture_output=True, text=True, timeout=30)
            return json.loads(out.stdout) if out.returncode == 0 else {}
        except Exception:
            return {}

    lang_bytes = Counter()
    with concurrent.futures.ThreadPoolExecutor(8) as ex:
        for result in ex.map(langs, [r["name"] for r in repos]):
            for k, v in result.items():
                lang_bytes[k] += min(v, LANG_BYTE_CAP)

    # 主要言語ごとのリポジトリ数
    lang_repos = Counter(
        (r["primaryLanguage"] or {}).get("name") for r in repos if r["primaryLanguage"]
    )

    # 年別コントリビューション
    this_year = datetime.now(timezone.utc).year
    contributions = []
    for y in range(2021, this_year + 1):
        q = (f'query {{ viewer {{ contributionsCollection('
             f'from: "{y}-01-01T00:00:00Z", to: "{y}-12-31T23:59:59Z") '
             f'{{ contributionCalendar {{ totalContributions }} }} }} }}')
        data = json.loads(gh(["api", "graphql", "-f", f"query={q}"]))
        total = data["data"]["viewer"]["contributionsCollection"]["contributionCalendar"]["totalContributions"]
        contributions.append({"year": y, "total": total, "partial": y == this_year})

    # カテゴリ集計（private/public問わず全体像として数える）
    cat_counts = Counter()
    for r in repos:
        cat = mapping[r["name"]]
        if cat not in CATEGORIES:
            sys.exit(f"未知のカテゴリ {cat!r} ({r['name']})")
        cat_counts[cat] += 1

    # 公開して見せるプロジェクト（publicのみ、名前を出してよい）
    featured_names = [
        "ito", "terminal-browser", "opttab", "manga-agent", "nimmt", "ClaudeAsOpenAI",
    ]
    by_name = {r["name"]: r for r in repos}
    featured = []
    for n in featured_names:
        r = by_name.get(n)
        if not r:
            sys.exit(f"featured リポジトリ {n} が見つからない")
        if r["visibility"] != "PUBLIC":
            sys.exit(f"featured リポジトリ {n} が public でない")
        # GitHub Pagesで公開中ならそのURLを持たせる(404なら無し)
        pages = subprocess.run(["gh", "api", f"repos/konaito/{n}/pages", "--jq", ".html_url"],
                               capture_output=True, text=True, timeout=30)
        pages_url = pages.stdout.strip() if pages.returncode == 0 else ""
        featured.append({
            "name": r["name"],
            "description": r["description"] or "",
            "language": (r["primaryLanguage"] or {}).get("name", ""),
            "stars": r["stargazerCount"],
            "url": r["url"],
            **({"pagesUrl": pages_url} if pages_url else {}),
        })

    data = {
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "totals": {
            "repos": len(repos),
            "private": sum(1 for r in repos if r["visibility"] == "PRIVATE"),
            "public": sum(1 for r in repos if r["visibility"] == "PUBLIC"),
            "since": min(r["createdAt"] for r in repos)[:4],
        },
        "languagesByRepos": [
            {"name": k, "repos": v} for k, v in lang_repos.most_common(8)
        ],
        "languagesByBytes": [
            {"name": k, "bytes": v} for k, v in lang_bytes.most_common(10)
        ],
        "contributions": contributions,
        "categories": [
            {"id": c, "count": cat_counts.get(c, 0)} for c in CATEGORIES
        ],
        "featured": featured,
    }

    # 漏洩ガード: privateリポジトリの名前・説明が出力の値として含まれていないこと。
    # 一般英単語と重なるリポジトリ名の誤検知を避けるため、文字列値との
    # 完全一致（名前はURL末尾一致も）と、説明文の部分一致をチェックする。
    def walk(v):
        if isinstance(v, dict):
            for x in v.values():
                yield from walk(x)
        elif isinstance(v, list):
            for x in v:
                yield from walk(x)
        elif isinstance(v, str):
            yield v

    values = list(walk(data))
    for r in repos:
        if r["visibility"] != "PRIVATE":
            continue
        name = r["name"]
        if any(v == name or v.endswith(f"/{name}") for v in values):
            sys.exit(f"漏洩検出: privateリポジトリ名 {name!r} が data.json に含まれている")
        desc = (r["description"] or "").strip()
        if len(desc) >= 8 and any(desc in v for v in values):
            sys.exit(f"漏洩検出: privateリポジトリ {name!r} の説明文が data.json に含まれている")

    OUT_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    print(f"wrote {OUT_PATH}")
    print(json.dumps(data["totals"], ensure_ascii=False))


if __name__ == "__main__":
    main()
