export function getHourInTimezone(date: Date, timezone: string): number {
	const formatted = new Intl.DateTimeFormat("en-US", {
		timeZone: timezone,
		hour: "numeric",
		hour12: false,
	}).format(date);
	// "24" means midnight in some locales
	const hour = Number.parseInt(formatted, 10);
	return hour === 24 ? 0 : hour;
}

export function getMinuteInTimezone(date: Date, timezone: string): number {
	const formatted = new Intl.DateTimeFormat("en-US", {
		timeZone: timezone,
		minute: "numeric",
	}).format(date);
	return Number.parseInt(formatted, 10);
}

export function setHourInTimezone(
	date: Date,
	timezone: string,
	targetHour: number,
): Date {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: timezone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).formatToParts(date);

	const get = (type: Intl.DateTimeFormatPartTypes) =>
		parts.find((p) => p.type === type)?.value ?? "0";

	const year = get("year");
	const month = get("month");
	const day = get("day");
	const minute = get("minute");

	const localISO = `${year}-${month}-${day}T${String(targetHour).padStart(2, "0")}:${minute}:00`;
	return localTimeToUTC(localISO, timezone);
}

export function setTimeInTimezone(
	date: Date,
	timezone: string,
	targetHour: number,
	targetMinute: number,
): Date {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: timezone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour12: false,
	}).formatToParts(date);

	const get = (type: Intl.DateTimeFormatPartTypes) =>
		parts.find((p) => p.type === type)?.value ?? "0";

	const localISO = `${get("year")}-${get("month")}-${get("day")}T${String(targetHour).padStart(2, "0")}:${String(targetMinute).padStart(2, "0")}:00`;
	return localTimeToUTC(localISO, timezone);
}

export function formatTime24(date: Date, timezone: string): string {
	const h = getHourInTimezone(date, timezone);
	const m = getMinuteInTimezone(date, timezone);
	return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function localTimeToUTC(localISO: string, timezone: string): Date {
	const normalizedLocalISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(localISO)
		? `${localISO}:00`
		: localISO;

	// Treat the local ISO as if it were UTC to get a reference point
	const utcGuess = new Date(`${normalizedLocalISO}Z`);

	// Format that UTC time in the target timezone using DateTimeFormat parts
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: timezone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	}).formatToParts(utcGuess);

	const get = (type: Intl.DateTimeFormatPartTypes) =>
		Number.parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);

	// Reconstruct as UTC milliseconds to compute the offset
	const inTzAsUTC = Date.UTC(
		get("year"),
		get("month") - 1,
		get("day"),
		get("hour") === 24 ? 0 : get("hour"),
		get("minute"),
		get("second"),
	);

	const offset = utcGuess.getTime() - inTzAsUTC;
	return new Date(utcGuess.getTime() + offset);
}

export function formatTime(date: Date, timezone: string): string {
	return new Intl.DateTimeFormat("en-US", {
		timeZone: timezone,
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	}).format(date);
}

export function formatDate(date: Date, timezone: string): string {
	return new Intl.DateTimeFormat("en-US", {
		timeZone: timezone,
		weekday: "short",
		month: "short",
		day: "numeric",
	}).format(date);
}

export function formatLocalISO(date: Date, timezone: string): string {
	// sv-SE locale formats as "YYYY-MM-DD HH:MM:SS"
	const formatted = new Intl.DateTimeFormat("sv-SE", {
		timeZone: timezone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).format(date);
	return formatted.replace(" ", "T");
}

export function setDateInTimezone(
	date: Date,
	timezone: string,
	targetDateStr: string,
): Date {
	// targetDateStr is "YYYY-MM-DD"
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: timezone,
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).formatToParts(date);

	const get = (type: Intl.DateTimeFormatPartTypes) =>
		parts.find((p) => p.type === type)?.value ?? "00";

	const hour = get("hour") === "24" ? "00" : get("hour");
	const minute = get("minute");

	const localISO = `${targetDateStr}T${hour}:${minute}:00`;
	return localTimeToUTC(localISO, timezone);
}

export function formatDateISO(date: Date, timezone: string): string {
	return formatLocalISO(date, timezone).split("T")[0];
}

export function getDayOfWeekShort(date: Date, timezone: string): string {
	return new Intl.DateTimeFormat("en-US", {
		timeZone: timezone,
		weekday: "short",
	})
		.format(date)
		.toUpperCase();
}

export function getMonthDayShort(
	date: Date,
	timezone: string,
): { month: string; day: string } {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: timezone,
		month: "short",
		day: "numeric",
	}).formatToParts(date);
	return {
		month: (parts.find((p) => p.type === "month")?.value ?? "").toUpperCase(),
		day: parts.find((p) => p.type === "day")?.value ?? "",
	};
}

export function getISOWeekNumber(date: Date, timezone: string): number {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: timezone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(date);
	const get = (type: Intl.DateTimeFormatPartTypes) =>
		Number.parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);
	const local = new Date(Date.UTC(get("year"), get("month") - 1, get("day")));
	// ISO: Monday=1. getUTCDay() returns 0=Sun. Convert so Mon=0.
	const dayOfWeek = (local.getUTCDay() + 6) % 7;
	// Find the Thursday of this ISO week
	const thursday = new Date(local);
	thursday.setUTCDate(local.getUTCDate() - dayOfWeek + 3);
	// Jan 1 of the Thursday's year
	const jan1 = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
	const weekNumber =
		Math.floor((thursday.getTime() - jan1.getTime()) / (7 * 86400000)) + 1;
	return weekNumber;
}

export function shiftDayInTimezone(
	date: Date,
	timezone: string,
	days: number,
): Date {
	const dateStr = formatDateISO(date, timezone);
	const d = new Date(`${dateStr}T12:00:00Z`);
	d.setUTCDate(d.getUTCDate() + days);
	const newDateStr = d.toISOString().split("T")[0];
	return setDateInTimezone(date, timezone, newDateStr);
}

export type TimePeriod = "night" | "morning" | "business" | "evening";

export function getTimePeriod(hour: number): TimePeriod {
	if (hour >= 0 && hour < 6) return "night";
	if (hour >= 6 && hour < 9) return "morning";
	if (hour >= 9 && hour < 18) return "business";
	if (hour >= 18 && hour < 21) return "evening";
	return "night";
}
