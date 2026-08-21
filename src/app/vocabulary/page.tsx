"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  Clock,
  Layers,
  Search,
  Target,
  TrendingUp,
  BookOpen,
} from "lucide-react";
import { useProjectContext } from "@/contexts/project-context";
import { useVocabularyStats } from "@/lib/react-query/analytics-queries";
import { cn } from "@/lib/utils";
import { TermsTab } from "@/components/vocabulary/terms-tab";
import { CardsTab } from "@/components/vocabulary/cards-tab";

type TabId = "terms" | "cards";

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = "default",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  tone?: "default" | "accent" | "success";
}) {
  return (
    <div className="glass-panel rounded-2xl border border-app-border p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {sub ? <p className="text-xs text-gray-400 mt-1">{sub}</p> : null}
        </div>
        <div
          className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center",
            tone === "accent" && "bg-brand-primary/10 text-brand-primary",
            tone === "success" && "bg-emerald-400/10 text-emerald-400",
            tone === "default" && "bg-white/5 text-gray-400"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function DistributionBar({ stats }: { stats?: { totalTerms: number; newCount: number; learningCount: number; matureCount: number } }) {
  const t = useTranslations("vocabulary");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const total = stats?.totalTerms ?? 0;
  const newCount = stats?.newCount ?? 0;
  const learningCount = stats?.learningCount ?? 0;
  const matureCount = stats?.matureCount ?? 0;
  const knownCount = Math.max(0, total - newCount - learningCount - matureCount);

  if (total === 0) {
    return <div className="text-sm text-gray-500">No data yet.</div>;
  }

  const pct = (n: number) => (n / total) * 100;

  const handleStatusClick = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "terms"); // Switching to terms tab
    params.set("status", status); // Setting the filter
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-3">
      <div className="h-4 w-full rounded-full overflow-hidden flex bg-white/5">
        <button type="button" onClick={() => handleStatusClick("NEW")} className="h-full bg-brand-secondary hover:brightness-110 cursor-pointer transition-all hover:scale-y-110 origin-center" style={{ width: `${pct(newCount)}%` }} title={`${newCount} New (${Math.round(pct(newCount))}%)`} />
        <button type="button" onClick={() => handleStatusClick("LEARNING")} className="h-full bg-amber-400 hover:brightness-110 cursor-pointer transition-all hover:scale-y-110 origin-center" style={{ width: `${pct(learningCount)}%` }} title={`${learningCount} In Review (${Math.round(pct(learningCount))}%)`} />
        <button type="button" onClick={() => handleStatusClick("KNOWN")} className="h-full bg-emerald-400 hover:brightness-110 cursor-pointer transition-all hover:scale-y-110 origin-center" style={{ width: `${pct(matureCount)}%` }} title={`${matureCount} Mature (${Math.round(pct(matureCount))}%)`} />
        <button type="button" onClick={() => handleStatusClick("KNOWN")} className="h-full bg-white/20 hover:brightness-110 cursor-pointer transition-all hover:scale-y-110 origin-center" style={{ width: `${pct(knownCount)}%` }} title={`${knownCount} Known (${Math.round(pct(knownCount))}%)`} />
      </div>
      <div className="flex flex-wrap gap-3 text-xs">
        <button type="button" onClick={() => handleStatusClick("NEW")} className="inline-flex items-center gap-1.5 text-gray-300 hover:text-white cursor-pointer transition-colors">
          <span className="h-2 w-2 rounded-full bg-brand-secondary" />
          {t("status.new")} {newCount} ({Math.round(pct(newCount))}%)
        </button>
        <button type="button" onClick={() => handleStatusClick("LEARNING")} className="inline-flex items-center gap-1.5 text-gray-300 hover:text-white cursor-pointer transition-colors">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          {t("status.learning")} {learningCount} ({Math.round(pct(learningCount))}%)
        </button>
        <button type="button" onClick={() => handleStatusClick("KNOWN")} className="inline-flex items-center gap-1.5 text-gray-300 hover:text-white cursor-pointer transition-colors">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          {t("mature")} {matureCount} ({Math.round(pct(matureCount))}%)
        </button>
        <button type="button" onClick={() => handleStatusClick("KNOWN")} className="inline-flex items-center gap-1.5 text-gray-300 hover:text-white cursor-pointer transition-colors">
          <span className="h-2 w-2 rounded-full bg-white/20" />
          {t("status.known")} {knownCount} ({Math.round(pct(knownCount))}%)
        </button>
      </div>
    </div>
  );
}

export default function VocabularyPage() {
  const t = useTranslations("vocabulary");
  const { currentProject } = useProjectContext();
  const projectId = currentProject?.id ?? "";
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = (searchParams.get("tab") === "cards" ? "cards" : "terms") as TabId;

  const setTab = (tab: TabId) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "cards") {
      params.set("tab", "cards");
    } else {
      params.delete("tab");
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const { data: stats } = useVocabularyStats(projectId);
  const fluency = stats ? Math.round(stats.estimatedFluency) : 0;

  const tabs: { id: TabId; label: string; sub: string; icon: React.ElementType; badge?: number }[] = [
    {
      id: "terms",
      label: t("wordBank"),
      sub: t("wordBankDesc"),
      icon: BookOpen,
      badge: stats?.totalTerms,
    },
    {
      id: "cards",
      label: t("srsCards"),
      sub: t("srsCardsDesc"),
      icon: Search,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">{t("title")}</h1>
          <p className="text-gray-400 mt-1 text-sm">{t("subtitle")}</p>
        </div>

        {projectId && (
          <div className="flex gap-1.5 rounded-xl bg-white/5 p-1.5 w-fit border border-app-border">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTab(tab.id)}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-brand-primary/20 text-brand-primary shadow-sm border border-brand-primary/30"
                      : "text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded-full text-xs font-semibold tabular-nums",
                        isActive
                          ? "bg-brand-primary/30 text-brand-primary"
                          : "bg-white/10 text-gray-400"
                      )}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {!projectId ? (
        <div className="glass-panel rounded-2xl border border-app-border p-8 text-gray-400">
          {t("selectProject")}
        </div>
      ) : (
        <>
          {/* Stat cards & distribution — visible across both tabs for comprehensive overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Layers} label={t("totalTerms")} value={stats?.totalTerms ?? "—"} sub={t("allStatuses")} />
            <StatCard icon={Clock} label={t("learning")} value={stats?.learningCount ?? "—"} sub={t("activelyReviewed")} tone="accent" />
            <StatCard icon={CheckCircle2} label={t("mature")} value={stats?.matureCount ?? "—"} sub={t("longTermMemory")} tone="success" />
            <StatCard icon={TrendingUp} label={t("fluency")} value={`${fluency}%`} sub={stats?.cefrLevel?.title ?? "CEFR estimate"} tone="accent" />
          </div>

          <div className={cn("glass-panel rounded-2xl border border-app-border p-6 space-y-4")}>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-brand-primary" />
              <h2 className="text-lg font-semibold text-white">{t("statusDistribution")}</h2>
            </div>
            <DistributionBar
              stats={
                stats
                  ? {
                      totalTerms: stats.totalTerms,
                      newCount: stats.newCount,
                      learningCount: stats.learningCount,
                      matureCount: stats.matureCount,
                    }
                  : undefined
              }
            />
          </div>

          {/* Active tab content */}
          {activeTab === "terms" ? <TermsTab /> : <CardsTab />}
        </>
      )}
    </div>
  );
}

