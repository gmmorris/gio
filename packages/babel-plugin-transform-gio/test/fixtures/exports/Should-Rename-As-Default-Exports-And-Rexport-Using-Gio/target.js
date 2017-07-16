const _defaultExport = function namedFunctionExpression() {
  return `this is a namedFunctionExpression exported as default`;
};

const defaultExport = gio.defineDefaultExport(0, "default", _defaultExport);
export { defaultExport as default };