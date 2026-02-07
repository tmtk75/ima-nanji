import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	base: "/ima-nanji/",
	plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
});
