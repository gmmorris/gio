const _defaultExport = function namedFunctionExpression() {
  return `this is a namedFunctionExpression as default`;
};

const _namedExport = function namedExport() {
  return `this is a constant namedFunctionExpression`;
};

const defaultExport = gio.defineDefaultExport("default", _defaultExport);
const namedExport = gio.defineExport("named", _namedExport);
export { defaultExport as default, namedExport as named };