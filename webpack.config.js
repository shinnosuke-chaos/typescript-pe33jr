const path = require("path");

const generalConfig = {
  mode: "production",
  devtool: "source-map",
  resolve: {
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: [".ts", ".tsx", ".js"],
    // Add support for TypeScripts fully qualified ESM imports.
    extensionAlias: {
      ".js": [".js", ".ts"],
      ".cjs": [".cjs", ".cts"],
      ".mjs": [".mjs", ".mts"],
    },
  },
  externals: [{ three: "THREE" }],
  module: {
    rules: [
      // all files with a `.ts`, `.cts`, `.mts` or `.tsx` extension will be handled by `ts-loader`
      { test: /\.([cm]?ts|tsx)$/, loader: "ts-loader" },
    ],
  },
};

module.exports = [
  {
    entry: {
      index: "./src/index.ts",
    },
    output: {
      filename: "[name].bundle.js",
      path: path.resolve("app/bundle"),
    },
    target: "electron-renderer",
    ...generalConfig,
  },
  {
    entry: {
      preload: "./src/preload.ts",
    },
    output: {
      filename: "[name].bundle.js",
      path: path.resolve("app/bundle"),
    },
    target: "electron-main",
    ...generalConfig,
  },
];
