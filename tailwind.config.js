// @ts-mandatory: Tailwind CSS build configuration consumed directly by the Tailwind CLI
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.ts", "./dist/**/*.js"],
  theme: {
    extend: {
      colors: {
        fmDark: "#0b091a",
        fmSidebar: "#13102a",
        fmCard: "#1a1638",
        fmAccent: "#6366f1",
        fmCyan: "#06b6d4",
        fmEmerald: "#10b981",
        fmPitchGreen: "#1b6329",
        fmPitchDark: "#144d1f"
      }
    }
  }
};
