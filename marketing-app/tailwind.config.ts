import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: "#6c2bd9",
          sand: "#f4e6d6",
          night: "#0b0d17",
        },
      },
    },
  },
  plugins: [],
}

export default config
