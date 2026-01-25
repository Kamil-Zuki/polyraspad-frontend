import React from 'react';

interface VocabularyStatsProps {
    totalLemmas: number;
    matureCount: number;
    learningCount: number;
    newCount: number;
    cefrLevel: {
        code: string;
        title: string;
        progressPercent: number;
    };
    estimatedFluency: number;
}

export function VocabularyStats({
    totalLemmas,
    matureCount,
    learningCount,
    newCount,
    cefrLevel,
    estimatedFluency
}: VocabularyStatsProps) {
    const stats = [
        { label: 'Total Lemmas', value: totalLemmas, color: 'text-white' },
        { label: 'Mature (Known)', value: matureCount, color: 'text-status-success' },
        { label: 'Learning', value: learningCount, color: 'text-brand-secondary' },
        { label: 'New', value: newCount, color: 'text-gray-400' },
    ];

    return (
        <div className="glass-panel p-6 rounded-2xl border border-app-border">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <i className="fas fa-book text-brand-primary" /> Vocabulary Statistics
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                {stats.map((stat) => (
                    <div key={stat.label} className="text-center">
                        <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">
                            {stat.label}
                        </div>
                        <div className={`text-3xl font-bold tabular-nums ${stat.color}`}>
                            {stat.value.toLocaleString()}
                        </div>
                    </div>
                ))}
            </div>

            {/* CEFR Level Progress */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">
                            Current Level
                        </div>
                        <div className="text-2xl font-bold text-white">
                            {cefrLevel.code} <span className="text-sm text-gray-400 font-normal">({cefrLevel.title})</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">
                            Estimated Fluency
                        </div>
                        <div className="text-2xl font-bold text-brand-primary">
                            {estimatedFluency}%
                        </div>
                    </div>
                </div>
                <div className="w-full h-3 bg-app-bg rounded-full overflow-hidden">
                    <div
                        className="h-full bg-linear-to-r from-brand-primary to-brand-secondary transition-all duration-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                        style={{ width: `${cefrLevel.progressPercent}%` }}
                    />
                </div>
                <div className="text-xs text-gray-500 mt-2">
                    {cefrLevel.progressPercent}% progress to next level
                </div>
            </div>

            {/* Distribution Chart (Visual) */}
            <div className="mt-6 pt-6 border-t border-app-border">
                <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-4">
                    Distribution
                </div>
                <div className="flex items-end gap-2 h-32">
                    <div className="flex-1 flex flex-col items-center justify-end">
                        <div
                            className="w-full bg-status-success rounded-t transition-all duration-500"
                            style={{ height: `${(matureCount / totalLemmas) * 100}%` }}
                        />
                        <div className="text-[10px] text-gray-500 mt-2">Mature</div>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-end">
                        <div
                            className="w-full bg-brand-secondary rounded-t transition-all duration-500"
                            style={{ height: `${(learningCount / totalLemmas) * 100}%` }}
                        />
                        <div className="text-[10px] text-gray-500 mt-2">Learning</div>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-end">
                        <div
                            className="w-full bg-gray-500 rounded-t transition-all duration-500"
                            style={{ height: `${(newCount / totalLemmas) * 100}%` }}
                        />
                        <div className="text-[10px] text-gray-500 mt-2">New</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
