import { useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { type AppState, decodeState, encodeState } from "~/utils/url";

export function useTimezoneParams() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	const state = useMemo(() => decodeState(searchParams), [searchParams]);

	const updateState = useCallback(
		(partial: Partial<AppState>) => {
			const merged = { ...state, ...partial };
			navigate(encodeState(merged) || "?", { replace: true });
		},
		[state, navigate],
	);

	return { ...state, updateState };
}
