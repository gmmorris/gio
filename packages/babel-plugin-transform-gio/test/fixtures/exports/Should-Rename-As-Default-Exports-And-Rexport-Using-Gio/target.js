const _defaultExport = function namedFunctionExpression() {
  return `this is a namedFunctionExpression exported as default`;
};

const defaultExport = gio.defineDefaultExport("namedFunctionExpression", _defaultExport);
export { defaultExport as default };