import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },fadeIn: {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' },
      },
      fadeOut: {
        '0%': { opacity: '1' },
        '100%': { opacity: '0' },
      },
      keyframes: {
        bounceRightLeft: {
          '0%': { transform: 'translateX(0)' },    // Starts at current position
          '50%': { transform: 'translateX(6px)' }, // Move right slightly
          '100%': { transform: 'translateX(0)' },   // End at original position
        },
        bounceLeftRight: {
          '0%': { transform: 'translateX(0)' },    // Starts at current position
          '50%': { transform: 'translateX(-6px)' }, // Move left slightly
          '100%': { transform: 'translateX(0)' },   // End at original position
        },
      },
      animation: {
        bounceRightLeft: 'bounceRightLeft 0.6s ease-in-out 1', // Animation runs for 0.5s and happens once
        bounceLeftRight: 'bounceLeftRight 0.6s ease-in-out 1', // Animation runs for 0.5s and happens once
      },
    },
  },
  plugins: [],
};

export default config;
