const defaultExport = function namedFunctionExpression() {
  return `this is a namedFunctionExpression as default`;
}

const namedExport = function namedExport() {
  return `this is a constant namedFunctionExpression`;
}

export { defaultExport as default, namedExport as named };