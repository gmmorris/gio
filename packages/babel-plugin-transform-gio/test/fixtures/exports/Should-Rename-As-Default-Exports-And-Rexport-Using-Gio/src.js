const defaultExport = function namedFunctionExpression() {
  return `this is a namedFunctionExpression exported as default`;
}

export { defaultExport as default };