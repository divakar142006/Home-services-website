import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(() => {
  const isGitHubPagesBuild = process.env.GITHUB_ACTIONS === "true";

  return {
    base: isGitHubPagesBuild ? "/Home-services-website/" : "/",
    plugins: [react()],
  };
});
