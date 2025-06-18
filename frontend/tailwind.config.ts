import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      /* 1️⃣  Movement ---------------------------------------------------- */
      keyframes: {
        "gradient-shift": {
          "0%,100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        /* 20 s so the motion is barely noticeable, like JetBrains */
        "gradient-x": "gradient-shift 20s ease infinite",
      },

      /* 2️⃣  Make the gradient huge so colour bands are wide ------------- */
      backgroundSize: {
        "400%": "400% 400%",
      },
    },
  },
  plugins: [],
};

export default config;
