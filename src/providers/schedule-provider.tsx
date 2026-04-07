"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { ScheduleProposal, SiteScheduleState } from "@/lib/types";

interface ScheduleContextType {
  schedules: Record<string, SiteScheduleState>;
  adoptPlan: (siteId: string, proposal: ScheduleProposal, allProposals: ScheduleProposal[]) => void;
  switchPlan: (siteId: string, proposalId: string) => void;
  getAdoptedSchedule: (siteId: string) => ScheduleProposal | null;
  getAllAdoptedSchedules: () => { siteId: string; plan: ScheduleProposal }[];
  getAlternatives: (siteId: string) => ScheduleProposal[];
}

const ScheduleContext = createContext<ScheduleContextType | null>(null);

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [schedules, setSchedules] = useState<Record<string, SiteScheduleState>>({});

  const adoptPlan = useCallback(
    (siteId: string, proposal: ScheduleProposal, allProposals: ScheduleProposal[]) => {
      setSchedules((prev) => ({
        ...prev,
        [siteId]: {
          siteId,
          adoptedPlan: proposal,
          alternativePlans: allProposals.filter((p) => p.id !== proposal.id),
        },
      }));
    },
    []
  );

  const switchPlan = useCallback((siteId: string, proposalId: string) => {
    setSchedules((prev) => {
      const current = prev[siteId];
      if (!current) return prev;

      const newAdopted = current.alternativePlans.find((p) => p.id === proposalId);
      if (!newAdopted) return prev;

      const newAlternatives = [
        ...current.alternativePlans.filter((p) => p.id !== proposalId),
        ...(current.adoptedPlan ? [current.adoptedPlan] : []),
      ];

      return {
        ...prev,
        [siteId]: {
          siteId,
          adoptedPlan: newAdopted,
          alternativePlans: newAlternatives,
        },
      };
    });
  }, []);

  const getAdoptedSchedule = useCallback(
    (siteId: string) => schedules[siteId]?.adoptedPlan || null,
    [schedules]
  );

  const getAllAdoptedSchedules = useCallback(
    () =>
      Object.values(schedules)
        .filter((s) => s.adoptedPlan)
        .map((s) => ({ siteId: s.siteId, plan: s.adoptedPlan! })),
    [schedules]
  );

  const getAlternatives = useCallback(
    (siteId: string) => schedules[siteId]?.alternativePlans || [],
    [schedules]
  );

  return (
    <ScheduleContext.Provider
      value={{ schedules, adoptPlan, switchPlan, getAdoptedSchedule, getAllAdoptedSchedules, getAlternatives }}
    >
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  const context = useContext(ScheduleContext);
  if (!context) throw new Error("useSchedule must be used within ScheduleProvider");
  return context;
}
