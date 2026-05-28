import boundaries from "eslint-plugin-boundaries";

export const eslintBoundariesConfig = {
  plugins: {
    boundaries,
  },
  settings: {
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
      },
    },
    "boundaries/dependency-nodes": ["import"],
    "boundaries/elements": [
      {
        type: "app",
        pattern: "./src/app",
      },
      {
        type: "features",
        pattern: "./src/features/*",
      },
      {
        type: "shared",
        pattern: "./src/shared",
      },
    ],
  },
  rules: {
    "boundaries/dependencies": [
      2,
      {
        default: "allow",
        rules: [
          {
            from: { type: "shared" },
            disallow: [
              { to: { type: "app" } },
              { to: { type: "features" } },
            ],
            message:
              "Модуль нижележащего слоя ({{ from.type }}) не может импортировать модуль вышележащего слоя ({{ to.type }})",
          },
          {
            from: { type: "features" },
            disallow: [{ to: { type: "app" } }],
            message:
              "Модуль нижележащего слоя ({{ from.type }}) не может импортировать модуль вышележащего слоя ({{ to.type }})",
          },
          {
            to: {
              type: "features",
              internalPath: "{model,ui,compose,board-templates}/**",
            },
            disallow: {
              from: { type: "*" },
            },
            message:
              "Модуль ({{ from.type }}) должен импортироваться через public API. Прямой импорт из {{ dependency.source }} запрещен",
          },
        ],
      },
    ],
  },
};
