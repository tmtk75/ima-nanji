import { useEffect, useRef, useState } from "react";
import {
	formatDate,
	getDayOfWeekShort,
	getHourInTimezone,
	getMinuteInTimezone,
	getMonthDayShort,
	getTimePeriod,
	setHourInTimezone,
	setTimeInTimezone,
	type TimePeriod,
} from "~/utils/time";
import { getCityName, getTimezoneInfo } from "~/utils/timezone";
import { DatePicker } from "./date-picker";
import { TimePicker } from "./time-picker";

interface TimezoneRowProps {
	timezone: string;
	displayName?: string;
	referenceTimezone: string;
	referenceTime: Date;
	onTimeChange: (time: Date) => void;
	onSelectionChange: (time: Date, rangeEnd: number | null) => void;
	onRemove: () => void;
	highlighted?: boolean;
	isReference?: boolean;
	onSetReference?: () => void;
	rangeEnd: number | null;
}

const periodStyles: Record<TimePeriod, string> = {
	night: "bg-slate-700 text-slate-300 dark:bg-slate-800 dark:text-slate-400",
	morning:
		"bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
	business: "bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-300",
	evening:
		"bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-300",
};

export function TimezoneRow({
	timezone,
	displayName,
	referenceTimezone,
	referenceTime,
	onTimeChange,
	onSelectionChange,
	onRemove,
	highlighted,
	isReference,
	onSetReference,
	rangeEnd,
}: TimezoneRowProps) {
	const info = getTimezoneInfo(timezone, referenceTime);
	const containerRef = useRef<HTMLDivElement>(null);
	const rowRef = useRef<HTMLDivElement>(null);
	const isDragging = useRef(false);
	const [flashing, setFlashing] = useState(false);
	const [hoverSlot, setHoverSlot] = useState<number | null>(null);

	useEffect(() => {
		if (highlighted) {
			rowRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
			setFlashing(true);
			const timer = setTimeout(() => setFlashing(false), 1500);
			return () => clearTimeout(timer);
		}
	}, [highlighted]);

	const refHour = getHourInTimezone(referenceTime, referenceTimezone);
	const refMinute = getMinuteInTimezone(referenceTime, referenceTimezone);
	const localHour = getHourInTimezone(referenceTime, timezone);
	const localMinute = getMinuteInTimezone(referenceTime, timezone);
	const totalOffsetMinutes =
		localHour * 60 + localMinute - (refHour * 60 + refMinute);
	const hourOffset = Math.floor(totalOffsetMinutes / 60);
	const minuteRemainder = ((totalOffsetMinutes % 60) + 60) % 60;
	const selectedCol = refHour;

	const dragStartSlot = useRef<number | null>(null);
	const didDrag = useRef(false);

	const handleColClick = (col: number) => {
		if (didDrag.current) {
			didDrag.current = false;
			return;
		}
		onSelectionChange(
			setHourInTimezone(referenceTime, referenceTimezone, col),
			null,
		);
	};

	const getSlotFromPointer = (clientX: number): number => {
		if (!containerRef.current) return 0;
		const rect = containerRef.current.getBoundingClientRect();
		const fraction = (clientX - rect.left) / rect.width;
		return Math.min(95, Math.max(0, Math.floor(fraction * 96)));
	};

	const handlePointerDown = (e: React.PointerEvent) => {
		isDragging.current = true;
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
		const slot = getSlotFromPointer(e.clientX);
		dragStartSlot.current = slot;
		onSelectionChange(
			setTimeInTimezone(
				referenceTime,
				referenceTimezone,
				Math.floor(slot / 4),
				(slot % 4) * 15,
			),
			null,
		);
	};

	const handlePointerMove = (e: React.PointerEvent) => {
		const slot = getSlotFromPointer(e.clientX);
		if (!isDragging.current) {
			setHoverSlot(slot);
			return;
		}
		if (dragStartSlot.current === null) return;
		if (slot !== dragStartSlot.current) {
			didDrag.current = true;
			const startS = Math.min(dragStartSlot.current, slot);
			const endS = Math.max(dragStartSlot.current, slot);
			onSelectionChange(
				setTimeInTimezone(
					referenceTime,
					referenceTimezone,
					Math.floor(startS / 4),
					(startS % 4) * 15,
				),
				endS,
			);
		}
	};

	const handlePointerUp = () => {
		isDragging.current = false;
		dragStartSlot.current = null;
	};

	const handlePointerLeave = () => {
		setHoverSlot(null);
	};

	// Range calculation (slot = 0-95, each slot = 15 min)
	const startSlot = refHour * 4 + Math.floor(refMinute / 15);
	const hasRange = rangeEnd != null && rangeEnd !== startSlot;
	const rMinSlot = hasRange ? Math.min(startSlot, rangeEnd) : startSlot;
	const rMaxSlot = hasRange ? Math.max(startSlot, rangeEnd) : startSlot;

	// Duration label
	const durationMinutes = hasRange ? (rMaxSlot - rMinSlot) * 15 : 0;
	const durationH = Math.floor(durationMinutes / 60);
	const durationM = durationMinutes % 60;
	const durationLabel =
		durationM > 0
			? durationH > 0
				? `${durationH}h${durationM}m`
				: `${durationM}m`
			: `${durationH}h`;

	// Local range times for this timezone
	const formatSlotTime = (slot: number): string => {
		const h = (((Math.floor(slot / 4) + hourOffset) % 24) + 24) % 24;
		const m = ((slot % 4) * 15 + minuteRemainder) % 60;
		return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
	};
	const localRangeStart = hasRange ? formatSlotTime(rMinSlot) : null;
	const localRangeEnd = hasRange ? formatSlotTime(rMaxSlot) : null;

	const columns = Array.from({ length: 24 }, (_, col) => {
		const displayHour = (((col + hourOffset) % 24) + 24) % 24;
		return {
			col,
			displayHour,
			isSelected: !hasRange && col === selectedCol,
			period: getTimePeriod(displayHour),
		};
	});

	const midnightCol = columns.findIndex((c) => c.displayHour === 0);
	const midnightDate =
		midnightCol >= 0
			? setHourInTimezone(referenceTime, referenceTimezone, midnightCol)
			: referenceTime;
	const dayLabel = getDayOfWeekShort(midnightDate, timezone);
	const dateInfo = getMonthDayShort(midnightDate, timezone);

	return (
		<div
			ref={rowRef}
			className={`group flex flex-col md:flex-row items-stretch border-b border-gray-100 dark:border-gray-800 transition-colors duration-700 ${
				flashing ? "bg-indigo-50 dark:bg-indigo-900/30" : ""
			} ${isReference ? "border-l-2 border-l-indigo-500" : "border-l-2 border-l-transparent"}`}
		>
			{/* Info panel */}
			<div className="flex items-center justify-between md:w-52 shrink-0 px-4 py-3">
				<div className="min-w-0">
					<button
						type="button"
						onClick={onSetReference}
						className={`font-medium text-sm truncate block text-left transition-colors ${
							isReference
								? "text-indigo-600 dark:text-indigo-400"
								: "text-gray-900 dark:text-gray-50 hover:text-indigo-600 dark:hover:text-indigo-400"
						}`}
						title="Set as reference timezone"
					>
						{displayName ?? getCityName(timezone)}
					</button>
					<div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
						{info.abbreviation} · {info.offset}
					</div>
					<TimePicker
						hour={localHour}
						minute={localMinute}
						onTimeSelect={(h, m) =>
							onTimeChange(setTimeInTimezone(referenceTime, timezone, h, m))
						}
					/>
					{hasRange && (
						<div className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
							{localRangeStart} – {localRangeEnd}
						</div>
					)}
					<DatePicker
						date={referenceTime}
						timezone={timezone}
						onDateChange={onTimeChange}
						label={formatDate(referenceTime, timezone)}
					/>
				</div>
				<button
					type="button"
					onClick={onRemove}
					className="ml-2 p-1 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 hover:text-red-400 dark:hover:text-red-400 transition-all"
					aria-label={`Remove ${getCityName(timezone)}`}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-3.5 w-3.5"
						viewBox="0 0 20 20"
						fill="currentColor"
						role="img"
						aria-hidden="true"
					>
						<path
							fillRule="evenodd"
							d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
							clipRule="evenodd"
						/>
					</svg>
				</button>
			</div>

			{/* Timeline */}
			<div className="flex-1 min-w-0 flex flex-col justify-center">
				{/* Day of week label */}
				<div className="relative h-3.5 hidden md:block">
					<span
						className="absolute bottom-0 text-[9px] font-medium text-gray-400 dark:text-gray-500 leading-none whitespace-nowrap"
						style={{
							left: `${((midnightCol + 0.5) / 24) * 100}%`,
							transform: "translateX(-50%)",
						}}
					>
						{dayLabel}
					</span>
				</div>
				{/* Hour cells */}
				<div
					ref={containerRef}
					className="timeline-container relative flex overflow-x-auto md:overflow-x-visible touch-pan-y select-none pr-2"
					onPointerDown={handlePointerDown}
					onPointerMove={handlePointerMove}
					onPointerUp={handlePointerUp}
					onPointerLeave={handlePointerLeave}
				>
					{columns.map(({ col, displayHour, isSelected, period }) => (
						<button
							key={col}
							type="button"
							onClick={() => handleColClick(col)}
							className={`flex-1 min-w-[28px] text-[11px] font-mono text-center transition-colors ${
								displayHour === 0 ? "ml-0.5 rounded-l-md" : ""
							} ${
								isSelected
									? "bg-indigo-600 text-white font-semibold ring-1 ring-indigo-400"
									: displayHour === 0
										? "bg-gray-300/80 text-gray-700 dark:bg-gray-600 dark:text-gray-200"
										: periodStyles[period]
							} ${displayHour === 0 ? "py-1" : "py-2.5"}`}
						>
							{displayHour === 0 ? (
								<span className="flex flex-col items-center leading-none gap-0.5">
									<span className="text-[8px] font-sans font-semibold uppercase">
										{dateInfo.month}
									</span>
									<span className="text-[13px] font-semibold leading-none">
										{dateInfo.day}
									</span>
									<span className="text-[8px] opacity-50">
										0
										{minuteRemainder > 0 && (
											<span>:{String(minuteRemainder).padStart(2, "0")}</span>
										)}
									</span>
								</span>
							) : (
								<span>
									{displayHour}
									{minuteRemainder > 0 && (
										<span className="text-[8px] opacity-50">
											:{String(minuteRemainder).padStart(2, "0")}
										</span>
									)}
								</span>
							)}
						</button>
					))}
					{hasRange && (
						<div
							className="absolute top-0 bottom-0 bg-indigo-500/20 border-l-2 border-r-2 border-indigo-500 pointer-events-none flex items-center justify-between px-0.5"
							style={{
								left: `${(rMinSlot / 96) * 100}%`,
								width: `${((rMaxSlot - rMinSlot) / 96) * 100}%`,
							}}
						>
							<span className="text-[9px] font-mono font-semibold text-indigo-600 dark:text-indigo-300 bg-white/90 dark:bg-gray-900/90 px-0.5 rounded leading-none">
								{formatSlotTime(rMinSlot)}
							</span>
							<span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-300 bg-white/80 dark:bg-gray-900/80 px-1 py-0.5 rounded shadow-sm">
								{durationLabel}
							</span>
							<span className="text-[9px] font-mono font-semibold text-indigo-600 dark:text-indigo-300 bg-white/90 dark:bg-gray-900/90 px-0.5 rounded leading-none">
								{formatSlotTime(rMaxSlot)}
							</span>
						</div>
					)}
					{hoverSlot != null && !isDragging.current && (
						<div
							className="absolute top-0 bottom-0 pointer-events-none flex flex-col items-center"
							style={{
								left: `${(hoverSlot / 96) * 100}%`,
							}}
						>
							<span className="text-[9px] font-mono font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 px-1 rounded shadow -translate-x-1/2 -translate-y-full -mt-0.5 whitespace-nowrap">
								{formatSlotTime(hoverSlot)}
							</span>
							<div className="w-px h-full bg-gray-400 dark:bg-gray-500" />
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
