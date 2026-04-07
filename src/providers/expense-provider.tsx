"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Expense, ExpenseCategory } from "@/lib/types";

interface ExpenseContextType {
  expenses: Expense[];
  addExpense: (expense: Expense) => void;
  getMonthlyTotal: (year: number, month: number) => number;
  getCategoryTotals: (year: number, month: number) => Record<ExpenseCategory, number>;
  getSiteTotals: () => Record<string, number>;
}

const ExpenseContext = createContext<ExpenseContextType | null>(null);

// Demo seed data
const SEED_EXPENSES: Expense[] = [
  {
    id: "exp-1", date: "2026-04-06", storeName: "コーナン高石店", amount: 28500,
    category: "material", items: [{ name: "シリコン塗料 16kg", price: 18000 }, { name: "ローラーセット", price: 3500 }, { name: "マスキングテープ 5巻", price: 2500 }, { name: "シンナー 4L", price: 4500 }],
    siteId: "site-1", receiptImage: "", createdAt: "2026-04-06T10:00:00",
  },
  {
    id: "exp-2", date: "2026-04-05", storeName: "ENEOS 高石SS", amount: 5800,
    category: "transport", items: [{ name: "レギュラーガソリン 40L", price: 5800 }],
    siteId: null, receiptImage: "", createdAt: "2026-04-05T08:30:00",
  },
  {
    id: "exp-3", date: "2026-04-04", storeName: "MonotaRO", amount: 12400,
    category: "tool", items: [{ name: "高圧洗浄機ノズル", price: 6800 }, { name: "ケレンヘラセット", price: 3200 }, { name: "サンドペーパー #120 20枚", price: 2400 }],
    siteId: "site-1", receiptImage: "", createdAt: "2026-04-04T15:00:00",
  },
  {
    id: "exp-4", date: "2026-04-03", storeName: "ほっかほっか亭", amount: 4320,
    category: "food", items: [{ name: "のり弁当 ×3", price: 2700 }, { name: "お茶 ×3", price: 450 }, { name: "からあげ弁当 ×1", price: 1170 }],
    siteId: "site-1", receiptImage: "", createdAt: "2026-04-03T12:00:00",
  },
];

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>(SEED_EXPENSES);

  const addExpense = useCallback((expense: Expense) => {
    setExpenses((prev) => [expense, ...prev]);
  }, []);

  const getMonthlyTotal = useCallback((year: number, month: number) => {
    return expenses
      .filter((e) => { const d = new Date(e.date); return d.getFullYear() === year && d.getMonth() === month; })
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const getCategoryTotals = useCallback((year: number, month: number) => {
    const totals: Record<ExpenseCategory, number> = { material: 0, transport: 0, tool: 0, food: 0, other: 0 };
    expenses
      .filter((e) => { const d = new Date(e.date); return d.getFullYear() === year && d.getMonth() === month; })
      .forEach((e) => { totals[e.category] += e.amount; });
    return totals;
  }, [expenses]);

  const getSiteTotals = useCallback(() => {
    const totals: Record<string, number> = {};
    expenses.forEach((e) => {
      const key = e.siteId || "none";
      totals[key] = (totals[key] || 0) + e.amount;
    });
    return totals;
  }, [expenses]);

  return (
    <ExpenseContext.Provider value={{ expenses, addExpense, getMonthlyTotal, getCategoryTotals, getSiteTotals }}>
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpenses() {
  const ctx = useContext(ExpenseContext);
  if (!ctx) throw new Error("useExpenses must be used within ExpenseProvider");
  return ctx;
}
