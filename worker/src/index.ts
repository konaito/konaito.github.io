/**
 * コナイトペディアの自然言語検索の中継。
 *
 * ブラウザからクエリとページのパーツを受け取り、Vercel AI Gateway 経由で
 * Jev（typesafe-ai/jev）に「このパーツはクエリに直接答えるか」を boolean で聞き、
 * パーツごとの確率を返す。APIキーはこの Worker の secret にだけ置く。
 */

interface Env {
    AI_GATEWAY_API_KEY: string;
    ALLOWED_ORIGINS: string; // カンマ区切り
    RATE_LIMITER?: { limit(opts: { key: string }): Promise<{ success: boolean }> };
}

interface Part {
    id: string;
    text: string;
}

const GATEWAY_URL = "https://ai-gateway.vercel.sh/v4/ai/evaluation-model";
const MODEL_ID = "typesafe-ai/jev";

// 濫用対策の上限。ページのパーツ数（約130）に余裕を持たせた値
const MAX_QUERY_CHARS = 200;
const MAX_PARTS = 200;
const MAX_PART_CHARS = 400;
const BATCH_SIZE = 40;

function corsHeaders(origin: string | null, env: Env): Record<string, string> {
    const allowed = env.ALLOWED_ORIGINS.split(",").map((s) => s.trim());
    const headers: Record<string, string> = { Vary: "Origin" };
    if (origin && allowed.includes(origin)) {
        headers["Access-Control-Allow-Origin"] = origin;
        headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
        headers["Access-Control-Allow-Headers"] = "Content-Type";
        headers["Access-Control-Max-Age"] = "86400";
    }
    return headers;
}

function json(body: unknown, status: number, headers: Record<string, string>): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...headers, "Content-Type": "application/json; charset=utf-8" },
    });
}

async function evaluateBatch(query: string, parts: Part[], env: Env): Promise<Record<string, number>> {
    const questions: Record<string, unknown> = {};
    parts.forEach((p, i) => {
        questions[`q${i}`] = {
            type: "boolean",
            instructions: {
                // 「話題が近いだけ」を明示的に false にすると、同種の項目が並ぶ表での誤検出が減る
                task: "ユーザーが検索クエリで知りたいことの答えが、この部分に書かれているか？ 話題が近いだけ、同じ種類のものが並んでいるだけの場合は false。",
                part: p.text,
            },
        };
    });
    const payload = {
        state: { page: "内藤剛汰（konaito）の百科事典風プロフィールページ", query },
        questions,
        providerOptions: { gateway: { zeroDataRetention: true } },
    };

    let lastError = "";
    for (let attempt = 0; attempt < 3; attempt++) {
        const res = await fetch(GATEWAY_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${env.AI_GATEWAY_API_KEY}`,
                "Content-Type": "application/json",
                "ai-gateway-protocol-version": "0.0.1",
                "ai-gateway-auth-method": "api-key",
                "ai-evaluation-model-specification-version": "4",
                "ai-model-id": MODEL_ID,
            },
            body: JSON.stringify(payload),
        });
        if (res.ok) {
            const data = (await res.json()) as { answers?: Record<string, { probability?: number }> };
            const scores: Record<string, number> = {};
            parts.forEach((p, i) => {
                const prob = data.answers?.[`q${i}`]?.probability;
                // 答えが欠けたパーツは黙って0にせず、呼び出し元で検知できるよう除外する
                if (typeof prob === "number") scores[p.id] = prob;
            });
            return scores;
        }
        lastError = `${res.status} ${(await res.text()).slice(0, 200)}`;
        if (![429, 500, 502, 503, 504, 529].includes(res.status)) break;
        await new Promise((r) => setTimeout(r, 300 * 2 ** attempt));
    }
    throw new Error(`Jev gateway error: ${lastError}`);
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const origin = request.headers.get("Origin");
        const cors = corsHeaders(origin, env);

        if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
        if (request.method !== "POST") return json({ error: "method not allowed" }, 405, cors);
        if (!cors["Access-Control-Allow-Origin"]) return json({ error: "origin not allowed" }, 403, cors);

        if (env.RATE_LIMITER) {
            const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
            const { success } = await env.RATE_LIMITER.limit({ key: ip });
            if (!success) return json({ error: "rate limited" }, 429, cors);
        }

        let body: { query?: unknown; parts?: unknown };
        try {
            body = await request.json();
        } catch {
            return json({ error: "invalid json" }, 400, cors);
        }

        const query = typeof body.query === "string" ? body.query.trim() : "";
        if (!query || query.length > MAX_QUERY_CHARS) return json({ error: "invalid query" }, 400, cors);
        if (!Array.isArray(body.parts) || body.parts.length === 0 || body.parts.length > MAX_PARTS) {
            return json({ error: "invalid parts" }, 400, cors);
        }
        const parts: Part[] = [];
        for (const p of body.parts as Part[]) {
            if (typeof p?.id !== "string" || typeof p?.text !== "string") return json({ error: "invalid part" }, 400, cors);
            parts.push({ id: p.id.slice(0, 40), text: p.text.slice(0, MAX_PART_CHARS) });
        }

        const batches: Part[][] = [];
        for (let i = 0; i < parts.length; i += BATCH_SIZE) batches.push(parts.slice(i, i + BATCH_SIZE));

        const started = Date.now();
        try {
            const results = await Promise.all(batches.map((b) => evaluateBatch(query, b, env)));
            const scores = Object.assign({}, ...results) as Record<string, number>;
            return json({ scores, missing: parts.length - Object.keys(scores).length, ms: Date.now() - started }, 200, cors);
        } catch (e) {
            return json({ error: e instanceof Error ? e.message : "upstream error" }, 502, cors);
        }
    },
};
