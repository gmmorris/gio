const _defaultExport = function namedFunctionExpression() {
  return `this is a namedFunctionExpression as default`;
};

const _namedExport = function namedExport() {
  return `this is a constant namedFunctionExpression`;
};

const defaultExport = gio.defineDefaultExport("namedFunctionExpression", _defaultExport);
const namedExport = gio.defineExport("namedExport", _namedExport);
export { defaultExport as default, namedExport as named };