"use client";

import { useState, useCallback, useRef } from "react";
import { ScheduleProposal, SimulationState, SimulationMode, Site, WeatherDay } from "@/lib/types";

const STATUS_PROGRESS: Record<string, number> = {
  "AIエンジンを起動中...": 5,
  "天気データを分析中...": 20,
  "工程の依存関係を確認中...": 40,
  "3つのプランを生成中...": 60,
  "提案を最終調整中...": 80,
  "緊急天気変更を検知...": 15,
  "残工程を確認中...": 35,
  "代替スケジュールを計算中...": 55,
  "リスケ提案を生成中...": 75,
  "最適スケジュールを計算中...": 65,
};

export function useAISimulation() {
  const [state, setState] = useState<SimulationState>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [proposals, setProposals] = useState<ScheduleProposal[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState("idle"); setStatusMessage(""); setProgress(0); setProposals(null); setError(null);
  }, []);

  const run = useCallback((site: Site, weather: WeatherDay[], mode: SimulationMode) => {
    setState("thinking"); setStatusMessage("AIエンジンを起動中..."); setProgress(5); setProposals(null); setError(null);
    const controller = new AbortController(); abortRef.current = controller;
    const endpoint = mode === "optimize" ? "/api/ai/optimize" : "/api/ai/reschedule";

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ site, processes: site.processes, weather }),
      signal: controller.signal,
    }).then(async (res) => {
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No body");
      const decoder = new TextDecoder(); let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const ev = JSON.parse(line);
            if (ev.type === "status") {
              setStatusMessage(ev.data);
              setProgress(STATUS_PROGRESS[ev.data] || 50);
            }
            else if (ev.type === "reasoning_chunk") {
              // Still receive but don't expose - just bump progress
              setProgress((p) => Math.min(p + 1, 90));
            }
            else if (ev.type === "proposals") { setProgress(100); setState("complete"); setProposals(ev.data); }
            else if (ev.type === "result") { setProgress(100); setState("complete"); setProposals(ev.data.proposals || null); }
            else if (ev.type === "error") { setState("error"); setError(ev.data.message); }
          } catch { /* skip */ }
        }
      }
    }).catch((err) => {
      if (err instanceof Error && err.name === "AbortError") return;
      setState("error"); setError(err instanceof Error ? err.message : "エラーが発生しました");
    });
  }, []);

  return { state, statusMessage, progress, proposals, error, run, reset };
}
