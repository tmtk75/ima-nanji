import { IANA_TIMEZONES } from "./iana-timezones";

const ALL_TIMEZONES: string[] = [...IANA_TIMEZONES];
const ALL_TIMEZONE_SET = new Set(ALL_TIMEZONES);

export interface TimezoneInfo {
	id: string;
	label: string;
	region: string;
	offset: string;
	abbreviation: string;
}

export function getCityName(tzId: string): string {
	const parts = tzId.split("/");
	return parts[parts.length - 1].replace(/_/g, " ");
}

export function getRegion(tzId: string): string {
	const parts = tzId.split("/");
	return parts[0];
}

export function getTimezoneInfo(tzId: string, date: Date): TimezoneInfo {
	const offsetFormatter = new Intl.DateTimeFormat("en-US", {
		timeZone: tzId,
		timeZoneName: "longOffset",
	});
	const offsetParts = offsetFormatter.formatToParts(date);
	const offset =
		offsetParts.find((p) => p.type === "timeZoneName")?.value ?? "";

	return {
		id: tzId,
		label: getCityName(tzId),
		region: getRegion(tzId),
		offset,
		abbreviation: resolveAbbreviation(tzId),
	};
}

function resolveAbbreviation(tzId: string): string {
	const known = KNOWN_ABBR_BY_TZ[tzId];
	if (known) return known;

	// Fallback to Intl
	const fmt = new Intl.DateTimeFormat("en-US", {
		timeZone: tzId,
		timeZoneName: "short",
	});
	return (
		fmt.formatToParts(new Date()).find((p) => p.type === "timeZoneName")
			?.value ?? ""
	);
}

export function isValidTimezone(tz: string): boolean {
	return ALL_TIMEZONE_SET.has(tz);
}

// Lazily built cache: maps each timezone to its abbreviation and offset
interface TzMeta {
	abbreviation: string;
	offset: string;
}

let metaCache: Map<string, TzMeta> | null = null;

function getMetaCache(): Map<string, TzMeta> {
	if (metaCache) return metaCache;

	const now = new Date();
	metaCache = new Map();

	for (const tz of ALL_TIMEZONES) {
		const shortFmt = new Intl.DateTimeFormat("en-US", {
			timeZone: tz,
			timeZoneName: "short",
		});
		const abbreviation =
			shortFmt.formatToParts(now).find((p) => p.type === "timeZoneName")
				?.value ?? "";

		const offsetFmt = new Intl.DateTimeFormat("en-US", {
			timeZone: tz,
			timeZoneName: "longOffset",
		});
		const offset =
			offsetFmt.formatToParts(now).find((p) => p.type === "timeZoneName")
				?.value ?? "";

		metaCache.set(tz, { abbreviation, offset });
	}

	return metaCache;
}

export function getAbbreviation(tzId: string): string {
	return resolveAbbreviation(tzId);
}

export function getOffset(tzId: string): string {
	return getMetaCache().get(tzId)?.offset ?? "";
}

// Well-known abbreviations that Intl may not return (browser-dependent).
// Maps abbreviation -> array of IANA timezone IDs.
const ABBREVIATION_MAP: Record<string, string[]> = {
	jst: ["Asia/Tokyo"],
	kst: ["Asia/Seoul"],
	cst: ["America/Chicago", "Asia/Shanghai"],
	est: ["America/New_York"],
	edt: ["America/New_York"],
	cdt: ["America/Chicago"],
	mst: ["America/Denver"],
	mdt: ["America/Denver"],
	pst: ["America/Los_Angeles"],
	pdt: ["America/Los_Angeles"],
	akst: ["America/Anchorage"],
	akdt: ["America/Anchorage"],
	hst: ["Pacific/Honolulu"],
	cet: [
		"Europe/Paris",
		"Europe/Berlin",
		"Europe/Madrid",
		"Europe/Rome",
		"Europe/Amsterdam",
		"Europe/Brussels",
		"Europe/Vienna",
		"Europe/Warsaw",
		"Europe/Stockholm",
		"Europe/Zurich",
		"Europe/Oslo",
		"Europe/Copenhagen",
		"Europe/Prague",
		"Europe/Budapest",
		"Europe/Belgrade",
	],
	cest: [
		"Europe/Paris",
		"Europe/Berlin",
		"Europe/Madrid",
		"Europe/Rome",
		"Europe/Amsterdam",
		"Europe/Brussels",
		"Europe/Vienna",
		"Europe/Warsaw",
		"Europe/Stockholm",
		"Europe/Zurich",
		"Europe/Oslo",
		"Europe/Copenhagen",
		"Europe/Prague",
		"Europe/Budapest",
		"Europe/Belgrade",
	],
	eet: [
		"Europe/Athens",
		"Europe/Helsinki",
		"Europe/Bucharest",
		"Europe/Sofia",
		"Europe/Vilnius",
		"Europe/Riga",
		"Europe/Tallinn",
	],
	eest: [
		"Europe/Athens",
		"Europe/Helsinki",
		"Europe/Bucharest",
		"Europe/Sofia",
		"Europe/Vilnius",
		"Europe/Riga",
		"Europe/Tallinn",
	],
	wet: ["Europe/Lisbon", "Atlantic/Canary"],
	west: ["Europe/Lisbon", "Atlantic/Canary"],
	gmt: ["Europe/London", "Europe/Dublin"],
	bst: ["Europe/London"],
	ist: ["Asia/Calcutta"],
	ict: ["Asia/Bangkok"],
	wib: ["Asia/Jakarta"],
	wit: ["Asia/Jayapura"],
	wita: ["Asia/Makassar"],
	sgt: ["Asia/Singapore"],
	hkt: ["Asia/Hong_Kong"],
	pht: ["Asia/Manila"],
	myt: ["Asia/Kuala_Lumpur"],
	aest: ["Australia/Sydney"],
	aedt: ["Australia/Sydney"],
	acst: ["Australia/Adelaide"],
	acdt: ["Australia/Adelaide"],
	awst: ["Australia/Perth"],
	nzst: ["Pacific/Auckland"],
	nzdt: ["Pacific/Auckland"],
	brt: ["America/Sao_Paulo"],
	art: ["America/Buenos_Aires"],
	cat: ["Africa/Nairobi"],
	eat: ["Africa/Nairobi"],
	wat: ["Africa/Lagos"],
	sast: ["Africa/Johannesburg"],
	msk: ["Europe/Moscow"],
	trt: ["Europe/Istanbul"],
	gulf: ["Asia/Dubai"],
	pkt: ["Asia/Karachi"],
	npt: ["Asia/Katmandu"],
};

// Reverse lookup: IANA ID -> well-known abbreviation (prefer standard over DST)
const KNOWN_ABBR_BY_TZ: Record<string, string> = {};
for (const [abbr, tzIds] of Object.entries(ABBREVIATION_MAP)) {
	// Skip daylight/summer variants (they contain 'd' or end with 'st'/'t' pattern)
	// We'll let the DST-aware ones overwrite only if no standard exists
	for (const tzId of tzIds) {
		if (!KNOWN_ABBR_BY_TZ[tzId]) {
			KNOWN_ABBR_BY_TZ[tzId] = abbr.toUpperCase();
		}
	}
}

// City aliases not in IANA database. Maps lowercase city name -> IANA ID.
const CITY_ALIASES: Record<string, string> = {
	// Europe
	barcelona: "Europe/Madrid",
	valencia: "Europe/Madrid",
	seville: "Europe/Madrid",
	milan: "Europe/Rome",
	naples: "Europe/Rome",
	florence: "Europe/Rome",
	venice: "Europe/Rome",
	turin: "Europe/Rome",
	munich: "Europe/Berlin",
	hamburg: "Europe/Berlin",
	frankfurt: "Europe/Berlin",
	cologne: "Europe/Berlin",
	dusseldorf: "Europe/Berlin",
	stuttgart: "Europe/Berlin",
	lyon: "Europe/Paris",
	marseille: "Europe/Paris",
	nice: "Europe/Paris",
	toulouse: "Europe/Paris",
	manchester: "Europe/London",
	birmingham: "Europe/London",
	edinburgh: "Europe/London",
	glasgow: "Europe/London",
	liverpool: "Europe/London",
	rotterdam: "Europe/Amsterdam",
	antwerp: "Europe/Brussels",
	geneva: "Europe/Zurich",
	basel: "Europe/Zurich",
	salzburg: "Europe/Vienna",
	krakow: "Europe/Warsaw",
	gothenburg: "Europe/Stockholm",
	porto: "Europe/Lisbon",
	st_petersburg: "Europe/Moscow",
	// Americas
	san_francisco: "America/Los_Angeles",
	seattle: "America/Los_Angeles",
	portland: "America/Los_Angeles",
	las_vegas: "America/Los_Angeles",
	san_diego: "America/Los_Angeles",
	miami: "America/New_York",
	boston: "America/New_York",
	washington: "America/New_York",
	philadelphia: "America/New_York",
	atlanta: "America/New_York",
	houston: "America/Chicago",
	dallas: "America/Chicago",
	austin: "America/Chicago",
	san_antonio: "America/Chicago",
	minneapolis: "America/Chicago",
	phoenix: "America/Phoenix",
	salt_lake_city: "America/Denver",
	montreal: "America/Toronto",
	vancouver: "America/Vancouver",
	calgary: "America/Edmonton",
	// Asia
	osaka: "Asia/Tokyo",
	kyoto: "Asia/Tokyo",
	nagoya: "Asia/Tokyo",
	fukuoka: "Asia/Tokyo",
	sapporo: "Asia/Tokyo",
	yokohama: "Asia/Tokyo",
	busan: "Asia/Seoul",
	beijing: "Asia/Shanghai",
	guangzhou: "Asia/Shanghai",
	shenzhen: "Asia/Shanghai",
	chengdu: "Asia/Shanghai",
	mumbai: "Asia/Calcutta",
	delhi: "Asia/Calcutta",
	bangalore: "Asia/Calcutta",
	hyderabad: "Asia/Calcutta",
	chennai: "Asia/Calcutta",
	hanoi: "Asia/Ho_Chi_Minh",
	phuket: "Asia/Bangkok",
	bali: "Asia/Makassar",
	penang: "Asia/Kuala_Lumpur",
	cebu: "Asia/Manila",
	// Oceania
	melbourne: "Australia/Melbourne",
	brisbane: "Australia/Brisbane",
	gold_coast: "Australia/Brisbane",
	wellington: "Pacific/Auckland",
	// Africa
	cairo: "Africa/Cairo",
	cape_town: "Africa/Johannesburg",
	durban: "Africa/Johannesburg",
	casablanca: "Africa/Casablanca",
	marrakech: "Africa/Casablanca",
	accra: "Africa/Accra",
	addis_ababa: "Africa/Addis_Ababa",
	dar_es_salaam: "Africa/Dar_es_Salaam",
	// Middle East
	dubai: "Asia/Dubai",
	abu_dhabi: "Asia/Dubai",
	doha: "Asia/Qatar",
	riyadh: "Asia/Riyadh",
	jeddah: "Asia/Riyadh",
	tel_aviv: "Asia/Jerusalem",
	beirut: "Asia/Beirut",
};

// Reverse lookup: IANA ID -> list of alias names
const ALIASES_BY_TZ: Record<string, string[]> = {};
for (const [alias, tz] of Object.entries(CITY_ALIASES)) {
	if (!ALIASES_BY_TZ[tz]) {
		ALIASES_BY_TZ[tz] = [];
	}
	ALIASES_BY_TZ[tz].push(alias);
}

function formatAlias(alias: string): string {
	return alias.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface SearchResult {
	id: string;
	label?: string;
}

export function searchTimezones(
	query: string,
	exclude: string[] = [],
): SearchResult[] {
	if (!query.trim()) return [];

	const lower = query.toLowerCase().trim();
	const excludeSet = new Set(exclude);
	const cache = getMetaCache();

	const results: SearchResult[] = [];
	const seenKeys = new Set<string>();

	const addResult = (id: string, label?: string) => {
		const key = label ? `${id}:${label}` : id;
		if (seenKeys.has(key)) return;
		seenKeys.add(key);
		results.push(label ? { id, label } : { id });
	};

	// 1. Abbreviation matches: add IANA entry + city aliases
	for (const tz of ABBREVIATION_MAP[lower] ?? []) {
		if (excludeSet.has(tz)) continue;
		addResult(tz);
		for (const alias of ALIASES_BY_TZ[tz] ?? []) {
			addResult(tz, formatAlias(alias));
		}
	}

	// 2. City alias matches (partial match: "barce" matches "barcelona")
	const lowerUnderscore = lower.replace(/ /g, "_");
	for (const [alias, tz] of Object.entries(CITY_ALIASES)) {
		if (alias.includes(lowerUnderscore) && !excludeSet.has(tz)) {
			addResult(tz, formatAlias(alias));
		}
	}

	const prioritizedIds = new Set(results.map((r) => r.id));

	const filtered = ALL_TIMEZONES.filter((tz) => {
		if (excludeSet.has(tz)) return false;
		if (prioritizedIds.has(tz)) return false;

		const label = tz.replace(/_/g, " ").toLowerCase();
		if (label.includes(lower)) return true;

		const meta = cache.get(tz);
		if (!meta) return false;

		if (meta.abbreviation.toLowerCase() === lower) return true;

		const offsetLower = meta.offset.toLowerCase();
		if (offsetLower.includes(lower)) return true;

		return false;
	});

	for (const tz of filtered) {
		addResult(tz);
	}

	return results.slice(0, 20);
}

export function getLocalTimezone(): string {
	return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
