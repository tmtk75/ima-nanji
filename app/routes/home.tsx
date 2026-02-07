import { useCallback, useEffect, useState } from "react";
import { TimezoneList } from "~/components/timezone-list";
import { TimezoneSearch } from "~/components/timezone-search";
import { useCurrentTime } from "~/hooks/use-current-time";
import { useTimezoneParams } from "~/hooks/use-timezone-params";
import { formatDate, getISOWeekNumber, shiftDayInTimezone } from "~/utils/time";
import type { TimezoneEntry } from "~/utils/url";
import type { Route } from "./+types/home";

export function meta(_args: Route.MetaArgs) {
	return [
		{ title: "ima-nanji - Timezone Comparison" },
		{
			name: "description",
			content: "Compare times across different timezones instantly",
		},
	];
}

export default function Home() {
	const { timezones, referenceTime, referenceId, rangeEnd, updateState } =
		useTimezoneParams();
	const currentTime = useCurrentTime(referenceTime);
	const [highlightedTzId, setHighlightedTzId] = useState<string | null>(null);

	const handleHighlight = useCallback((tzId: string) => {
		setHighlightedTzId(null);
		requestAnimationFrame(() => setHighlightedTzId(tzId));
	}, []);

	const handleAddTimezone = (entry: TimezoneEntry) => {
		if (timezones.some((t) => t.id === entry.id)) return;
		updateState({ timezones: [...timezones, entry] });
	};

	const handleRemoveTimezone = (tzId: string) => {
		const newTimezones = timezones.filter((t) => t.id !== tzId);
		const update: Partial<{
			timezones: TimezoneEntry[];
			referenceId: string | null;
		}> = {
			timezones: newTimezones,
		};
		if (referenceId === tzId) {
			update.referenceId = null;
		}
		updateState(update);
	};

	const handleSetReference = (tzId: string) => {
		updateState({
			referenceId: tzId === timezones[0]?.id ? null : tzId,
		});
	};

	const handleTimeChange = (time: Date) => {
		updateState({ referenceTime: time });
	};

	const handleResetToNow = () => {
		updateState({ referenceTime: null, rangeEnd: null });
	};

	const handleSelectionChange = (time: Date, newRangeEnd: number | null) => {
		updateState({ referenceTime: time, rangeEnd: newRangeEnd });
	};

	const effectiveRefTz = referenceId ?? timezones[0]?.id ?? "UTC";

	const handleShiftDay = (days: number) => {
		updateState({
			referenceTime: shiftDayInTimezone(currentTime, effectiveRefTz, days),
		});
	};

	useEffect(() => {
		if (rangeEnd == null) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				updateState({ rangeEnd: null });
			}
		};
		const handleClick = (e: MouseEvent) => {
			if ((e.target as HTMLElement).closest(".timeline-container")) return;
			updateState({ rangeEnd: null });
		};
		document.addEventListener("keydown", handleKeyDown);
		document.addEventListener("pointerdown", handleClick);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			document.removeEventListener("pointerdown", handleClick);
		};
	}, [rangeEnd, updateState]);

	const isLiveMode = referenceTime === null;
	const existingIds = timezones.map((t) => t.id);

	return (
		<div className="min-h-screen">
			<header className="px-4 py-5 sm:px-6">
				<div className="max-w-6xl mx-auto">
					<div className="flex items-center justify-between">
						<h1 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-50">
							ima-nanji
							<span className="ml-2 text-sm font-normal text-gray-400 dark:text-gray-500">
								timezone comparison
							</span>
						</h1>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => handleShiftDay(-1)}
								className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
								aria-label="Previous day"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-4 w-4"
									viewBox="0 0 20 20"
									fill="currentColor"
									role="img"
									aria-hidden="true"
								>
									<path
										fillRule="evenodd"
										d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
										clipRule="evenodd"
									/>
								</svg>
							</button>
							<span className="text-xs font-medium text-gray-600 dark:text-gray-400 tabular-nums min-w-[5.5rem] text-center">
								{formatDate(currentTime, effectiveRefTz)}
								<span className="ml-1.5 text-gray-400 dark:text-gray-500">
									W{getISOWeekNumber(currentTime, effectiveRefTz)}
								</span>
							</span>
							<button
								type="button"
								onClick={() => handleShiftDay(1)}
								className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
								aria-label="Next day"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-4 w-4"
									viewBox="0 0 20 20"
									fill="currentColor"
									role="img"
									aria-hidden="true"
								>
									<path
										fillRule="evenodd"
										d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
										clipRule="evenodd"
									/>
								</svg>
							</button>
							{!isLiveMode && (
								<button
									type="button"
									onClick={handleResetToNow}
									className="ml-1 px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
								>
									Now
								</button>
							)}
							{isLiveMode && (
								<span className="ml-1 flex items-center gap-1.5 text-xs font-medium text-indigo-500 dark:text-indigo-400">
									<span className="relative flex h-1.5 w-1.5">
										<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
										<span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500" />
									</span>
									Live
								</span>
							)}
						</div>
					</div>
					<div className="mt-4">
						<TimezoneSearch
							onAdd={handleAddTimezone}
							existingIds={existingIds}
							onHighlight={handleHighlight}
						/>
					</div>
				</div>
			</header>

			<main className="max-w-6xl mx-auto px-4 sm:px-6">
				<TimezoneList
					timezones={timezones}
					referenceTime={currentTime}
					onTimeChange={handleTimeChange}
					onRemove={handleRemoveTimezone}
					highlightedTzId={highlightedTzId}
					referenceId={referenceId ?? timezones[0]?.id ?? ""}
					onSetReference={handleSetReference}
					rangeEnd={rangeEnd}
					onSelectionChange={handleSelectionChange}
				/>
			</main>
		</div>
	);
}
