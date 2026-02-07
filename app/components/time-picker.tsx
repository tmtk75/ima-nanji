import { useEffect, useRef, useState } from "react";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

interface TimePickerProps {
	hour: number;
	minute: number;
	onTimeSelect: (hour: number, minute: number) => void;
}

export function TimePicker({ hour, minute, onTimeSelect }: TimePickerProps) {
	const [isOpen, setIsOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const selectedRef = useRef<HTMLButtonElement>(null);

	const snappedMinute = Math.floor(minute / 15) * 15;

	useEffect(() => {
		if (!isOpen) return;
		const handler = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setIsOpen(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [isOpen]);

	useEffect(() => {
		if (isOpen && selectedRef.current) {
			selectedRef.current.scrollIntoView({ block: "nearest" });
		}
	}, [isOpen]);

	const handleSelect = (h: number, m: number) => {
		onTimeSelect(h, m);
		setIsOpen(false);
	};

	return (
		<div ref={ref} className="relative">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="text-base font-mono font-medium tabular-nums text-gray-800 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
			>
				{String(hour).padStart(2, "0")}:{String(snappedMinute).padStart(2, "0")}
			</button>
			{isOpen && (
				<div className="absolute z-50 top-full mt-1 left-0 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl p-2">
					<div className="flex gap-1">
						{/* Hour column */}
						<div className="overflow-y-auto max-h-48 scrollbar-thin">
							{HOURS.map((h) => (
								<button
									key={`h-${h}`}
									ref={h === hour ? selectedRef : undefined}
									type="button"
									onClick={() => handleSelect(h, snappedMinute)}
									className={`block w-10 py-1 text-center text-xs font-mono rounded-md transition-colors ${
										h === hour
											? "bg-indigo-600 text-white font-semibold"
											: "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
									}`}
								>
									{String(h).padStart(2, "0")}
								</button>
							))}
						</div>
						{/* Minute column */}
						<div className="flex flex-col justify-start">
							{MINUTES.map((m) => (
								<button
									key={`m-${m}`}
									type="button"
									onClick={() => handleSelect(hour, m)}
									className={`block w-10 py-1 text-center text-xs font-mono rounded-md transition-colors ${
										m === snappedMinute
											? "bg-indigo-600 text-white font-semibold"
											: "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
									}`}
								>
									{String(m).padStart(2, "0")}
								</button>
							))}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
