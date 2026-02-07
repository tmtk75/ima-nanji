import type { TimezoneEntry } from "~/utils/url";
import { TimezoneRow } from "./timezone-row";

interface TimezoneListProps {
	timezones: TimezoneEntry[];
	referenceTime: Date;
	onTimeChange: (time: Date) => void;
	onSelectionChange: (time: Date, rangeEnd: number | null) => void;
	onRemove: (tzId: string) => void;
	highlightedTzId: string | null;
	referenceId: string;
	onSetReference: (tzId: string) => void;
	rangeEnd: number | null;
}

export function TimezoneList({
	timezones,
	referenceTime,
	onTimeChange,
	onSelectionChange,
	onRemove,
	highlightedTzId,
	referenceId,
	onSetReference,
	rangeEnd,
}: TimezoneListProps) {
	if (timezones.length === 0) {
		return (
			<div className="py-20 text-center">
				<p className="text-sm text-gray-400 dark:text-gray-500">
					No timezones added yet.
				</p>
				<p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
					Search above to add cities or timezones.
				</p>
			</div>
		);
	}

	return (
		<div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
			{timezones.map((entry) => (
				<TimezoneRow
					key={entry.id}
					timezone={entry.id}
					displayName={entry.label}
					referenceTimezone={referenceId}
					referenceTime={referenceTime}
					onTimeChange={onTimeChange}
					onRemove={() => onRemove(entry.id)}
					highlighted={entry.id === highlightedTzId}
					isReference={entry.id === referenceId}
					onSetReference={() => onSetReference(entry.id)}
					rangeEnd={rangeEnd}
					onSelectionChange={onSelectionChange}
				/>
			))}
		</div>
	);
}
