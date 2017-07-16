const _defaultExport = function namedFunctionExpression() {
  return `this is a namedFunctionExpression as default`;
};

const _namedExport = function namedExport() {
  return `this is a constant namedFunctionExpression`;
};

const defaultExport = gio.defineDefaultExport(0, "default", _defaultExport);
const namedExport = gio.defineExport(1, "named", _namedExport);
export { defaultExport as default, namedExport as named };