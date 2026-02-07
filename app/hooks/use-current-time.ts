import { useEffect, useState } from "react";

export function useCurrentTime(frozenTime: Date | null): Date {
	const [now, setNow] = useState(() => new Date());

	useEffect(() => {
		if (frozenTime) return;

		setNow(new Date());
		const interval = setInterval(() => setNow(new Date()), 60_000);
		return () => clearInterval(interval);
	}, [frozenTime]);

	return frozenTime ?? now;
}
