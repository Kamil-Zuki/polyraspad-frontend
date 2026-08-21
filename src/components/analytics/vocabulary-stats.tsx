import React from "react";



const NEXT_CEFR: Record<string, string> = {

  A1: "A2",

  A2: "B1",

  B1: "B2",

  B2: "C1",

  C1: "C2",

  C2: "C2",

};



function pct(n: number, total: number): number {

  if (total <= 0) return 0;

  return Math.round((n / total) * 100);

}



function clampProgress(n: number): number {

  return Math.min(100, Math.max(0, n));

}



interface VocabularyStatsProps {

  totalTerms: number;

  matureCount: number;

  savedCount?: number;

  reviewingCount?: number;

  learningCount: number;

  newCount: number;

  cefrLevel: {

    code: string;

    title: string;

    progressPercent: number;

    wordsToNextLevel?: number;

  };

  estimatedFluency: number;

  onStatusClick?: (status: string) => void;

}



export function VocabularyStats({

  totalTerms,

  matureCount,

  savedCount,

  reviewingCount,

  learningCount,

  newCount,

  cefrLevel,

  estimatedFluency,

  onStatusClick,

}: VocabularyStatsProps) {

  const resolvedReviewing = reviewingCount ?? 0;

  const resolvedSaved =

    savedCount ?? Math.max(0, learningCount - resolvedReviewing);



  const statusTotal = matureCount + resolvedSaved + resolvedReviewing + newCount;

  const displayTotal = totalTerms > 0 ? totalTerms : statusTotal;

  const knownPercent = pct(matureCount, displayTotal);

  const wordsToNext = cefrLevel.wordsToNextLevel ?? 0;

  const nextLevel = NEXT_CEFR[cefrLevel.code] ?? "A2";

  const isMaxLevel = cefrLevel.code === "C2";

  const levelTarget = isMaxLevel ? matureCount : matureCount + wordsToNext;

  const progressWidth = clampProgress(cefrLevel.progressPercent);



  const STATUS_SEGMENTS = [

    { key: "KNOWN", label: "Known", count: matureCount, color: "bg-status-success", textColor: "text-status-success" },

    { key: "LEARNING", label: "In Review", count: resolvedReviewing, color: "bg-violet-500", textColor: "text-violet-400" },

    { key: "SAVED", label: "Saved", count: resolvedSaved, color: "bg-brand-secondary", textColor: "text-brand-secondary" },

    { key: "NEW", label: "New", count: newCount, color: "bg-gray-500", textColor: "text-gray-400" },

  ] as const;



  if (displayTotal === 0) {

    return (

      <div className="glass-panel p-6 rounded-2xl border border-app-border">

        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">

          <i className="fas fa-book text-brand-primary" /> Vocabulary Statistics

        </h3>

        <p className="text-sm text-gray-400">

          Read, save terms, or create FSRS cards to start building your project vocabulary.

          Known, in review, saved, and new terms will appear here as you learn.

        </p>

      </div>

    );

  }



  return (

    <div className="glass-panel p-6 rounded-2xl border border-app-border">

      <div className="flex items-start justify-between gap-4 mb-6">

        <h3 className="text-lg font-bold text-white flex items-center gap-2">

          <i className="fas fa-book text-brand-primary" /> Vocabulary Statistics

        </h3>

        <div className="text-right shrink-0">

          <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">

            Known terms share

          </div>

          <div className="text-2xl font-bold text-status-success tabular-nums">{knownPercent}%</div>

        </div>

      </div>



      <p className="text-xs text-gray-500 mb-6">

        Known includes words marked known in Reader and words matured through FSRS review. Phrases are not counted.

      </p>



      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">

        {[

          { label: "Known", value: matureCount, color: "text-status-success" },

          { label: "In Review", value: resolvedReviewing, color: "text-violet-400" },

          { label: "Saved", value: resolvedSaved, color: "text-brand-secondary" },

          { label: "New", value: newCount, color: "text-gray-400" },

          { label: "Total", value: displayTotal, color: "text-white" },

        ].map((stat) => (

          <div

            key={stat.label}

            className="rounded-xl border border-app-border bg-app-bg/40 px-4 py-3 text-center"

          >

            <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">

              {stat.label}

            </div>

            <div className={`text-2xl font-bold tabular-nums ${stat.color}`}>

              {stat.value.toLocaleString()}

            </div>

          </div>

        ))}

      </div>



      <div className="mb-8 rounded-xl border border-app-border bg-app-bg/30 p-4">

        <div className="flex flex-wrap items-start justify-between gap-4 mb-3">

          <div>

            <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">

              Current Level

            </div>

            <div className="text-xl font-bold text-white">

              {cefrLevel.code}{" "}

              <span className="text-sm text-gray-400 font-normal">({cefrLevel.title})</span>

            </div>

          </div>

          {!isMaxLevel && (

            <div className="text-right">

              <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">

                Next Level

              </div>

              <div className="text-xl font-bold text-brand-primary">{nextLevel}</div>

            </div>

          )}

        </div>



        <div className="w-full h-3 bg-app-bg rounded-full overflow-hidden mb-2">

          <div

            className="h-full bg-linear-to-r from-brand-primary to-brand-secondary transition-all duration-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]"

            style={{ width: `${progressWidth}%` }}

          />

        </div>



        {isMaxLevel ? (

          <p className="text-xs text-gray-500">Maximum CEFR level reached for this project.</p>

        ) : (

          <div className="space-y-1">

            <p className="text-sm text-gray-300">

              {matureCount.toLocaleString()} / {levelTarget.toLocaleString()} known terms toward{" "}

              {nextLevel}

            </p>

            <p className="text-xs text-gray-500">

              {progressWidth}% through {cefrLevel.code}

              {progressWidth === 0 && matureCount > 0

                ? " — early progress; large vocabularies move slowly at first"

                : ""}

              {" · "}

              {wordsToNext.toLocaleString()} more known term

              {wordsToNext === 1 ? "" : "s"} needed

            </p>

          </div>

        )}



        <p className="text-xs text-gray-600 mt-3">

          Estimated fluency: {estimatedFluency}% (rough estimate from known terms)

        </p>

      </div>



      <div className="pt-6 border-t border-app-border">

        <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">

          Distribution

        </div>

        <p className="text-xs text-gray-500 mb-4">

          Known drives your level estimate. In Review, Saved, and New show terms still in the learning pipeline.

        </p>



        <div className="flex h-4 w-full overflow-hidden rounded-full bg-app-bg mb-4">

          {STATUS_SEGMENTS.map(({ key, label, count, color }) => {

            const width = pct(count, displayTotal);

            if (width <= 0) return null;

            return (

              <button

                key={key}

                type="button"

                onClick={() => onStatusClick?.(key)}

                className={`${color} hover:brightness-110 transition-all duration-500 cursor-pointer ${onStatusClick ? 'hover:scale-y-110' : ''}`}

                style={{ width: `${width}%`, transformOrigin: 'center' }}

                title={`${count} ${label} (${width}%)`}

              />

            );

          })}

        </div>



        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

          {STATUS_SEGMENTS.map(({ key, label, count, color }) => {

            const share = pct(count, displayTotal);

            return (

              <button

                key={key}

                type="button"

                onClick={() => onStatusClick?.(key)}

                className={`flex items-center justify-between rounded-lg border border-app-border bg-app-bg/30 px-3 py-2 transition-colors ${onStatusClick ? 'cursor-pointer hover:bg-white/5 hover:border-white/20' : ''}`}

              >

                <div className="flex items-center gap-2">

                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />

                  <span className="text-sm text-gray-300">{label}</span>

                </div>

                <div className="text-sm tabular-nums text-gray-400">

                  {count.toLocaleString()} ({share}%)

                </div>

              </button>

            );

          })}

        </div>

      </div>

    </div>

  );

}

