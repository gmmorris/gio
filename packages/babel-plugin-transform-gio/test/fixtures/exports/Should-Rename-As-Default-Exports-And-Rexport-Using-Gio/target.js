const _defaultExport = function namedFunctionExpression() {
  return `this is a namedFunctionExpression`;
};

const defaultExport = gio.defineDefaultExport("namedFunctionExpression", _defaultExport);
export { defaultExport as default };