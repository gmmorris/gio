const _defaultExport = function namedFunctionExpression() {
  return `this is a namedFunctionExpression exported as default`;
};

const defaultExport = gio.defineDefaultExport("default", _defaultExport);
export { defaultExport as default };