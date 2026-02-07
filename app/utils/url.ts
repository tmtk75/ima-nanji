import { parse, stringify } from "rison2";
import { getLocalTimezone, isValidTimezone } from "./timezone";

export interface TimezoneEntry {
	id: string;
	label?: string; // optional display name override (e.g. "Beijing" for Asia/Shanghai)
}

export interface AppState {
	timezones: TimezoneEntry[];
	referenceTime: Date | null; // null = live mode (current time)
	referenceId: string | null; // null = first timezone is the reference
	rangeEnd: number | null; // end hour (0-23) in reference timezone; null = single hour
}

// URL format: ?s=(tz:!(Asia/Tokyo,(id:America/New_York,l:Beijing)),t:'2024-01-15T10:00Z',ref:Asia/Tokyo)

interface RisonTzEntry {
	id: string;
	l?: string;
}

interface RisonState {
	tz?: (string | RisonTzEntry)[];
	t?: string;
	ref?: string;
	re?: number;
}

function toTimezoneEntry(raw: string | RisonTzEntry): TimezoneEntry | null {
	if (typeof raw === "string") {
		return isValidTimezone(raw) ? { id: raw } : null;
	}
	if (raw && typeof raw.id === "string" && isValidTimezone(raw.id)) {
		return { id: raw.id, label: raw.l || undefined };
	}
	return null;
}

function fromTimezoneEntry(entry: TimezoneEntry): string | RisonTzEntry {
	if (entry.label) {
		return { id: entry.id, l: entry.label };
	}
	return entry.id;
}

export function decodeState(searchParams: URLSearchParams): AppState {
	const sParam = searchParams.get("s");

	if (!sParam) {
		return {
			timezones: [{ id: getLocalTimezone() }],
			referenceTime: null,
			referenceId: null,
			rangeEnd: null,
		};
	}

	let data: RisonState;
	try {
		data = parse(sParam) as RisonState;
	} catch {
		return {
			timezones: [{ id: getLocalTimezone() }],
			referenceTime: null,
			referenceId: null,
			rangeEnd: null,
		};
	}

	const timezones = Array.isArray(data.tz)
		? data.tz.map(toTimezoneEntry).filter((e): e is TimezoneEntry => e !== null)
		: [{ id: getLocalTimezone() }];

	let referenceTime: Date | null = null;
	if (data.t) {
		const parsed = new Date(data.t);
		if (!Number.isNaN(parsed.getTime())) {
			referenceTime = parsed;
		}
	}

	const referenceId =
		data.ref && timezones.some((t) => t.id === data.ref) ? data.ref : null;

	const rangeEnd =
		typeof data.re === "number" && data.re >= 0 && data.re <= 95
			? data.re
			: null;

	return { timezones, referenceTime, referenceId, rangeEnd };
}

export function encodeState(state: AppState): string {
	if (state.timezones.length === 0) {
		return "";
	}

	const data: RisonState = {
		tz: state.timezones.map(fromTimezoneEntry),
	};

	if (state.referenceTime) {
		data.t = state.referenceTime.toISOString();
	}

	if (state.referenceId) {
		data.ref = state.referenceId;
	}

	if (state.rangeEnd != null) {
		data.re = state.rangeEnd;
	}

	return `?s=${stringify(data)}`;
}
