/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        void: '#0A0E1A',      // page background — near-black ink navy
        surface: '#121A2C',   // card background — deep navy panel
        surface2: '#26314A',  // border / divider — muted navy-gray

        pulse: '#3D5AFE',     // primary brand / "Go" status — cobalt indigo
        gold: '#C9A24B',      // premium accent — muted gold, used sparingly
        warn: '#C98A3A',      // "Caution" status — warm amber-bronze
        crit: '#B84C42',      // "Abort" status — deep brick red

        textmain: '#EDF1F9',  // primary text — soft ivory-white
        textmuted: '#8896B0', // secondary text — cool blue-gray
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}