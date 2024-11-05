module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [0, "always", ["foo"]],
    "signed-off-by": [2, "always", ["Signed-off-by:"]],
  },
};
