const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    "postcss-preset-env": {
      stage: 0,
      autoprefixer: { flexbox: "no-2009" },
      features: {
        "oklab-function": { preserve: false },
        "lab-function": { preserve: false },
      },
    },
  },
};

export default config;
