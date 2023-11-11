const path = require("path");

module.exports = {
  "extends": [
    path.join(__dirname, "../.eslintrc.json"),
    "plugin:@conarti/feature-sliced/recommended"
  ],
  "parserOptions": {
    "project": path.join(__dirname, "../tsconfig.json"),
    type: "module"
  }
}
