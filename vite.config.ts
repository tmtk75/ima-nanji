import { execSync } from "node:child_process";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

function resolveCommitSha(): string {
	try {
		return execSync("git rev-parse --short=12 HEAD").toString().trim();
	} catch {
		return "unknown";
	}
}

export default defineConfig({
	base: "/ima-nanji/",
	define: {
		"import.meta.env.VITE_COMMIT_SHA": JSON.stringify(resolveCommitSha()),
	},
	plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
});
