import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { BlueprintAnalysis } from "@/lib/types";

const MOCK_RESULT: BlueprintAnalysis = {
  buildingType: "house",
  floors: 2,
  structure: "木造軸組工法",
  totalFloorArea: 118,
  estimatedPaintArea: 156,
  description: "2階建て木造住宅の設計図を分析しました。延べ床面積は約118m²、外壁の塗装面積は約156m²と推定されます。1階部分が約72m²、2階部分が約46m²の外壁面積となります。バルコニー部分の塗装面積も含んでいます。",
  notes: [
    "バルコニー外壁面の塗装面積を含みます",
    "屋根塗装は別途見積が必要です",
    "窓枠・ドア枠等の付帯部は付帯部塗装に含まれます",
    "建物の高さにより足場費用が変動する場合があります",
  ],
};

export async function POST(request: NextRequest) {
  const { image } = await request.json() as { image: string };

  if (!process.env.ANTHROPIC_API_KEY) {
    // Simulate delay for demo
    await new Promise((r) => setTimeout(r, 2500));
    return Response.json(MOCK_RESULT);
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const mediaType: "image/png" | "image/jpeg" | "image/gif" | "image/webp" =
      image.startsWith("data:image/jpeg") || image.startsWith("data:image/jpg") ? "image/jpeg"
      : image.startsWith("data:image/webp") ? "image/webp"
      : image.startsWith("data:image/gif") ? "image/gif"
      : "image/png";

    const base64Data = image.replace(/^data:[^;]+;base64,/, "");

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64Data },
            },
            {
              type: "text",
              text: `この建物の設計図・図面を分析して、以下の情報をJSON形式で返してください。
図面が不明瞭な場合は、一般的な建物として推定してください。

{
  "buildingType": "house" | "apartment" | "public",
  "floors": 階数（数値）,
  "structure": "木造軸組工法" | "RC造" | "鉄骨造" | "2×4工法" 等,
  "totalFloorArea": 延べ床面積（m²・数値）,
  "estimatedPaintArea": 外壁の塗装面積（m²・数値）,
  "description": "分析結果の説明（日本語・2〜3文）",
  "notes": ["補足事項1", "補足事項2"]
}

JSON以外のテキストは含めないでください。`,
            },
          ],
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return Response.json(MOCK_RESULT);

    const parsed: BlueprintAnalysis = JSON.parse(jsonMatch[0]);
    return Response.json(parsed);
  } catch {
    return Response.json(MOCK_RESULT);
  }
}
