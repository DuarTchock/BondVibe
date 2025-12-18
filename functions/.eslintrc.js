module.exports = {
  parserOptions: {
    ecmaVersion: 2020, // Soporta optional chaining
  },
  env: {
    es6: true,
    node: true,
  },
  extends: ["eslint:recommended", "google"],
  rules: {
    "no-restricted-globals": ["error", "name", "length"],
    "prefer-arrow-callback": "error",
    "quotes": ["error", "double", {allowTemplateLiterals: true}],
    "indent": ["error", 2],
    "max-len": ["error", {code: 120}],
  },
};
