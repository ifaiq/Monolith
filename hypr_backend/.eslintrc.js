/* eslint-disable quote-props */
module.exports = {
  extends: [
    "./node_modules/jslint-configs/config-node.js",
    "plugin:node/recommended",
  ],
  parser: "@babel/eslint-parser",
  parserOptions: {
    ecmaVersion: 2018,
    requireConfigFile: false,
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    node: true,
  },
  globals: { Promise: true, sails: true, _: true, async: true },
  rules: {
    "callback-return": ["error"],
    "comma-style": ["error"],
    "curly": ["error"],
    "eqeqeq": ["error"],
    "eol-last": ["error"],
    "handle-callback-err": ["error"],
    "indent": ["error"],
    "no-dupe-keys": ["error"],
    "no-duplicate-case": ["error"],
    "no-extra-semi": ["error"],
    "no-labels": ["error"],
    "no-mixed-spaces-and-tabs": ["error"],
    "no-redeclare": ["error"],
    "no-return-assign": ["error"],
    "no-sequences": ["error"],
    "no-trailing-spaces": ["error"],
    "no-unexpected-multiline": ["error"],
    "no-unreachable": ["error"],
    "no-unused-vars": ["error", { args: "none" }],
    "no-use-before-define": ["off", { functions: false }],
    "one-var": ["error", "never"],
    "prefer-arrow-callback": ["error"],
    "quotes": [
      "error",
      "double",
      { allowTemplateLiterals: true },
    ],
    "semi": ["error"],
    "semi-spacing": ["error"],
    "semi-style": ["error"],
    "no-prototype-builtins": ["error"],
    "no-fallthrough": ["error"],
    "no-case-declarations": ["error"],
    "comma-dangle": ["error"],
    "arrow-parens": ["error"],
    "max-len": ["error"],
    "prefer-const": ["error"],
    "padded-blocks": ["error"],
    "brace-style": ["error"],
    "no-console": ["error"],
    "arrow-body-style": ["error"],
    "no-multiple-empty-lines": ["error"],
    "key-spacing": ["error"],
    "space-infix-ops": ["error"],
    "guard-for-in": ["error"],
    "no-extra-parens": ["error"],
    "no-else-return": ["error"],
    "no-param-reassign": ["error"],
    "no-shadow": ["error"],
    "dot-notation": ["error"],
    "comma-spacing": ["error"],
    "arrow-spacing": ["error"],
    "space-before-blocks": ["error"],
    "spaced-comment": ["error"],
    "default-case": ["error"],
    "no-eq-null": ["error"],
    "no-var": ["error"],
    "no-empty": ["error"],
    "no-async-promise-executor": ["off"],
    "no-throw-literal": ["off"],
    "consistent-return": ["warn"],
    "camelcase": ["off"],
    "no-undef": ["off"],
    "linebreak-style": ["off"],
    "radix": ["off"],
    "node/no-unsupported-features/es-builtins": ["off"],
  },
  overrides: [
    {
      files: ["*.test.js"],
      rules: {
        "node/no-unpublished-require": "off",
      },
    },
  ],
};