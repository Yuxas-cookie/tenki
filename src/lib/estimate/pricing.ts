import { PaintGrade, BuildingType, EstimateResult, EstimateLineItem } from "@/lib/types";

// 工程別単価（円/m²）
const PRICING_TABLE: Record<string, Record<PaintGrade, number>> = {
  "足場設置・撤去":      { silicon: 800,   fluorine: 800,   inorganic: 800 },
  "飛散防止シート":      { silicon: 200,   fluorine: 200,   inorganic: 200 },
  "高圧洗浄":           { silicon: 250,   fluorine: 250,   inorganic: 250 },
  "下地処理（ケレン）":   { silicon: 600,   fluorine: 600,   inorganic: 600 },
  "シーリング工事":      { silicon: 900,   fluorine: 900,   inorganic: 900 },
  "養生":              { silicon: 350,   fluorine: 350,   inorganic: 350 },
  "下塗り":            { silicon: 800,   fluorine: 800,   inorganic: 800 },
  "中塗り+上塗り":      { silicon: 2800,  fluorine: 4200,  inorganic: 5500 },
  "付帯部塗装":         { silicon: 1000,  fluorine: 1200,  inorganic: 1400 },
  "諸経費":            { silicon: 500,   fluorine: 500,   inorganic: 500 },
};

const BUILDING_COEFFICIENT: Record<BuildingType, number> = {
  house: 1.0,
  apartment: 0.85,
  public: 1.1,
};

const GRADE_LABELS: Record<PaintGrade, string> = {
  silicon: "シリコン塗料",
  fluorine: "フッ素塗料",
  inorganic: "無機塗料",
};

export const GRADE_INFO: Record<PaintGrade, { label: string; durability: string; feature: string; color: string; border: string; bg: string }> = {
  silicon: {
    label: "シリコン塗料",
    durability: "10〜13年",
    feature: "コストパフォーマンス最良。最も一般的な塗料グレード。",
    color: "from-blue-500 to-cyan-500",
    border: "border-blue-200",
    bg: "bg-blue-50",
  },
  fluorine: {
    label: "フッ素塗料",
    durability: "15〜18年",
    feature: "高耐久・高光沢。長期間メンテナンス不要。",
    color: "from-purple-500 to-pink-500",
    border: "border-purple-200",
    bg: "bg-purple-50",
  },
  inorganic: {
    label: "無機塗料",
    durability: "20〜25年",
    feature: "最高級グレード。圧倒的な耐候性と防汚性。",
    color: "from-amber-500 to-orange-500",
    border: "border-amber-200",
    bg: "bg-amber-50",
  },
};

export function calculateEstimate(
  paintArea: number,
  grade: PaintGrade,
  buildingType: BuildingType
): EstimateResult {
  const coeff = BUILDING_COEFFICIENT[buildingType];

  const lineItems: EstimateLineItem[] = Object.entries(PRICING_TABLE).map(
    ([name, prices]) => {
      const unitPrice = prices[grade];
      const area = paintArea;
      const subtotal = Math.round(unitPrice * area * coeff);
      return { name, unitPrice, area, subtotal };
    }
  );

  const subtotal = lineItems.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;

  return {
    grade,
    gradeLabel: GRADE_LABELS[grade],
    lineItems,
    subtotal,
    tax,
    total,
    paintArea,
    buildingType,
  };
}
