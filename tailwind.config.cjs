/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/renderer/**/*.{ts,tsx}'],
  // The journal's hand-tuned design lives in `journal.css` and relies on its
  // own resets. Disable Tailwind's preflight so utilities are available without
  // clobbering the existing pixel-perfect styling.
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {},
  },
  plugins: [],
};
