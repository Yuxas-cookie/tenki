import { NextRequest } from "next/server";

const MOCK_RESULT = {
  date: "2026-04-08",
  storeName: "コーナン高石店",
  amount: 28500,
  items: [
    { name: "シリコン塗料 16kg", price: 18000 },
    { name: "ローラーセット", price: 3500 },
    { name: "マスキングテープ 5巻", price: 2500 },
    { name: "シンナー 4L", price: 4500 },
  ],
  suggestedCategory: "material",
};

export async function POST(request: NextRequest) {
  const { image } = await request.json() as { image: string };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    await new Promise((r) => setTimeout(r, 2000));
    return Response.json(MOCK_RESULT);
  }

  try {
    const base64Data = image.replace(/^data:[^;]+;base64,/, "");
    const mimeType = image.startsWith("data:image/png") ? "image/png" : "image/jpeg";

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inlineData: { mimeType, data: base64Data } },
              { text: `このレシート画像から以下の情報をJSON形式で抽出してください。
JSONのみ返してください。

{
  "date": "YYYY-MM-DD形式の日付",
  "storeName": "店舗名",
  "amount": 合計金額（数値）,
  "items": [
    { "name": "商品名", "price": 金額（数値） }
  ],
  "suggestedCategory": "material" | "transport" | "tool" | "food" | "other"
}

カテゴリの判定基準:
- material: 塗料・塗装資材・建材
- transport: ガソリン・高速代・駐車場
- tool: 工具・道具・消耗品
- food: 食事・飲料
- other: 上記に当てはまらないもの` },
            ],
          }],
        }),
      }
    );

    if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return Response.json(MOCK_RESULT);

    return Response.json(JSON.parse(jsonMatch[0]));
  } catch {
    return Response.json(MOCK_RESULT);
  }
}
