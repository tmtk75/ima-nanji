import { useEffect, useRef, useState } from "react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import "react-day-picker/src/style.css";
import { formatDateISO, setDateInTimezone } from "~/utils/time";

interface DatePickerProps {
	date: Date;
	timezone: string;
	onDateChange: (date: Date) => void;
	label: string;
}

export function DatePicker({
	date,
	timezone,
	onDateChange,
	label,
}: DatePickerProps) {
	const [isOpen, setIsOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	const dateISO = formatDateISO(date, timezone);
	const [y, m, d] = dateISO.split("-").map(Number);
	const selectedDate = new Date(Date.UTC(y, m - 1, d));

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

	const defaultClassNames = getDefaultClassNames();

	const handleSelect = (selected: Date | undefined) => {
		if (!selected) return;
		const dateStr = `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, "0")}-${String(selected.getDate()).padStart(2, "0")}`;
		onDateChange(setDateInTimezone(date, timezone, dateStr));
		setIsOpen(false);
	};

	const handleToday = () => {
		const now = new Date();
		const todayStr = formatDateISO(now, timezone);
		onDateChange(setDateInTimezone(date, timezone, todayStr));
		setIsOpen(false);
	};

	return (
		<div ref={ref} className="relative">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="text-[11px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
			>
				{label}
			</button>
			{isOpen && (
				<div className="absolute z-50 top-full mt-1 left-0 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl p-3">
					<DayPicker
						mode="single"
						selected={selectedDate}
						onSelect={handleSelect}
						defaultMonth={selectedDate}
						weekStartsOn={1}
						footer={
							<button
								type="button"
								onClick={handleToday}
								className="mt-2 w-full text-center text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors py-1"
							>
								Today
							</button>
						}
						classNames={{
							root: `${defaultClassNames.root} !font-sans`,
							today: "!font-bold !text-indigo-600 dark:!text-indigo-400",
							selected:
								"!bg-indigo-600 !text-white !border-indigo-600 !rounded-md",
							chevron: `${defaultClassNames.chevron} !fill-indigo-500`,
							caption_label: "!text-sm !font-semibold",
							day: "!text-xs",
							weekday: "!text-[10px] !font-medium !text-gray-400",
						}}
						style={
							{
								"--rdp-accent-color": "rgb(79 70 229)",
								"--rdp-accent-background-color": "rgb(238 242 255)",
								"--rdp-day-height": "32px",
								"--rdp-day-width": "32px",
								"--rdp-day_button-height": "30px",
								"--rdp-day_button-width": "30px",
								"--rdp-day_button-border-radius": "6px",
							} as React.CSSProperties
						}
					/>
				</div>
			)}
		</div>
	);
}
