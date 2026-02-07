import { useEffect, useMemo, useRef, useState } from "react";
import {
	getAbbreviation,
	getCityName,
	getOffset,
	getRegion,
	type SearchResult,
	searchTimezones,
} from "~/utils/timezone";
import type { TimezoneEntry } from "~/utils/url";

interface TimezoneSearchProps {
	onAdd: (entry: TimezoneEntry) => void;
	existingIds: string[];
	onHighlight: (tzId: string) => void;
}

export function TimezoneSearch({
	onAdd,
	existingIds,
	onHighlight,
}: TimezoneSearchProps) {
	const [query, setQuery] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLUListElement>(null);

	const existingSet = useMemo(() => new Set(existingIds), [existingIds]);

	const results = useMemo(() => searchTimezones(query), [query]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: reset index when results change
	useEffect(() => {
		setSelectedIndex(0);
	}, [results]);

	const handleSelect = (result: SearchResult) => {
		if (existingSet.has(result.id)) return;
		onAdd(
			result.label ? { id: result.id, label: result.label } : { id: result.id },
		);
		setQuery("");
		setIsOpen(false);
		inputRef.current?.focus();
	};

	const findSelectableIndex = (from: number, direction: 1 | -1): number => {
		let i = from;
		while (i >= 0 && i < results.length) {
			if (!existingSet.has(results[i].id)) return i;
			i += direction;
		}
		return from;
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (!isOpen || results.length === 0) {
			if (e.key === "ArrowDown" && query) {
				setIsOpen(true);
			}
			return;
		}

		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				setSelectedIndex((i) =>
					findSelectableIndex(Math.min(i + 1, results.length - 1), 1),
				);
				break;
			case "ArrowUp":
				e.preventDefault();
				setSelectedIndex((i) => findSelectableIndex(Math.max(i - 1, 0), -1));
				break;
			case "Enter":
				e.preventDefault();
				if (!existingSet.has(results[selectedIndex].id)) {
					handleSelect(results[selectedIndex]);
				}
				break;
			case "Escape":
				setIsOpen(false);
				break;
		}
	};

	useEffect(() => {
		if (listRef.current && isOpen) {
			const item = listRef.current.children[selectedIndex] as HTMLElement;
			item?.scrollIntoView({ block: "nearest" });
		}
	}, [selectedIndex, isOpen]);

	return (
		<div className="relative">
			<input
				ref={inputRef}
				type="text"
				value={query}
				onChange={(e) => {
					setQuery(e.target.value);
					setIsOpen(e.target.value.length > 0);
				}}
				onFocus={() => {
					if (query) setIsOpen(true);
				}}
				onBlur={() => {
					setTimeout(() => setIsOpen(false), 200);
				}}
				onKeyDown={handleKeyDown}
				placeholder="Add timezone... (e.g. Tokyo, JST, EST, GMT+9)"
				className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-300 dark:focus:border-indigo-700 transition-shadow"
			/>
			{isOpen && results.length > 0 && (
				<ul
					ref={listRef}
					className="absolute z-50 w-full mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl"
				>
					{results.map((result, i) => {
						const isAdded = existingSet.has(result.id);
						const displayName = result.label ?? getCityName(result.id);
						const showIanaName =
							result.label && result.label !== getCityName(result.id);
						return (
							<li key={`${result.id}:${result.label ?? ""}`}>
								<button
									type="button"
									onMouseDown={(e) => e.preventDefault()}
									onClick={() => {
										if (isAdded) {
											onHighlight(result.id);
										} else {
											handleSelect(result);
										}
									}}
									className={`w-full text-left px-4 py-2 text-sm ${
										isAdded
											? "opacity-35 cursor-pointer hover:opacity-50"
											: i === selectedIndex
												? "bg-indigo-50 dark:bg-indigo-900/30 cursor-pointer"
												: "hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
									}`}
								>
									<span className="font-medium text-gray-800 dark:text-gray-100">
										{displayName}
									</span>
									{showIanaName && (
										<span className="ml-1 text-gray-400 dark:text-gray-500">
											({getCityName(result.id)})
										</span>
									)}
									<span className="ml-2 text-gray-400 dark:text-gray-500">
										{getRegion(result.id)}
									</span>
									<span className="ml-2 text-gray-400 dark:text-gray-500 text-xs font-mono">
										{getAbbreviation(result.id)} · {getOffset(result.id)}
									</span>
									{isAdded && (
										<span className="ml-2 text-xs text-gray-400 dark:text-gray-600">
											(added)
										</span>
									)}
								</button>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
