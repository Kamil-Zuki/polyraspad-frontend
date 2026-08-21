"use client";

import React, { useMemo } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  PolarRadiusAxis,
  Tooltip,
} from "recharts";
import { useSkillBalance } from "@/lib/react-query/analytics-queries";
import { motion } from "framer-motion";
import { Brain, Activity, BookOpen, Mic, PenTool } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProjectContext } from "@/contexts/project-context";

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

function getCefrLevel(value: number): string {
  if (value <= 0) return "A1";
  if (value >= 100) return "C2";
  const index = Math.min(Math.floor((value / 100) * 6), 5);
  return CEFR_LEVELS[index];
}

interface SkillsRadarChartProps {
  className?: string;
}

export function SkillsRadarChart({ className }: SkillsRadarChartProps) {
  const { currentProject } = useProjectContext();
  const projectId = currentProject?.id || "";

  const { data: skillData, isLoading, error } = useSkillBalance(projectId);

  const chartData = useMemo(() => {
    if (!skillData) return [];
    return [
      {
        subject: "Reading",
        A: skillData.averageReadingLevel,
        fullMark: 100,
      },
      {
        subject: "Listening",
        A: skillData.averageListeningLevel,
        fullMark: 100,
      },
      {
        subject: "Writing",
        A: skillData.averageWritingLevel,
        fullMark: 100,
      },
      {
        subject: "Speaking",
        A: skillData.averageSpeakingLevel,
        fullMark: 100,
      },
    ];
  }, [skillData]);

  if (error) {
    return (
      <div className={cn("glass-panel rounded-3xl p-6 flex flex-col items-center justify-center border border-red-500/30 text-red-400 min-h-[300px]", className)}>
        <p>Failed to load skill balance data.</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "glass-panel rounded-3xl p-6 flex flex-col relative overflow-hidden group border border-app-border",
        className
      )}
    >
      {/* Dynamic background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-brand-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="p-2.5 rounded-xl bg-brand-primary/10 border border-brand-primary/20">
          <Brain className="w-5 h-5 text-brand-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-white">Skill Balance</h3>
          <p className="text-sm text-app-muted">Your language proficiency dimensions (CEFR)</p>
        </div>
      </div>

      <div className="flex-grow w-full h-[300px] relative z-10 flex items-center justify-center">
        {isLoading ? (
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-brand-primary/20 border-t-brand-primary animate-spin" />
            <span className="text-app-muted text-sm">Analyzing skills...</span>
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: "#9CA3AF", fontSize: 12, fontWeight: 500 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                tickCount={6}
                tickFormatter={(value: number) => getCefrLevel(value)}
                stroke="rgba(255,255,255,0.05)"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(19, 25, 39, 0.9)",
                  borderColor: "rgba(139, 92, 246, 0.3)",
                  borderRadius: "12px",
                  color: "#fff",
                  backdropFilter: "blur(8px)",
                }}
                itemStyle={{ color: "#8B5CF6", fontWeight: "bold" }}
                formatter={(value: any) => {
                  const numValue = Number(value);
                  return [`${numValue}% (${getCefrLevel(numValue)})`, "Proficiency"];
                }}
              />
              <Radar
                name="Skills"
                dataKey="A"
                stroke="#8B5CF6"
                strokeWidth={3}
                fill="url(#colorGradient)"
                fillOpacity={0.5}
                isAnimationActive={true}
                animationBegin={0}
                animationDuration={1500}
                animationEasing="ease-out"
              />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.2} />
                </linearGradient>
              </defs>
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-app-muted text-sm">No data available yet.</div>
        )}
      </div>
    </div>
  );
}
