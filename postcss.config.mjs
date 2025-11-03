const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    "@csstools/postcss-oklab-function": { preserve: false },
    "postcss-preset-env": {
      stage: 3,
      autoprefixer: { flexbox: "no-2009" },
      features: {
        "oklab-function": { preserve: false },
        "lab-function": { preserve: false },
        "color-function": { preserve: false },
      },
    },
  },
};

export default config;
