const monet = require('monet')
const { Maybe } = monet

const push = (arr, val) => {
  arr.push(val)
  return arr
}

module.exports = function(sourceFilePath) {
  return sourceFilePath.get('body').reduce((state, path) => {
    if (path.isExportDefaultDeclaration()) {
      state.defaultExport = Maybe.Some(path)
    } else if (path.isExportDeclaration() || path.isExportNamedDeclaration()) {
      state.exports = state.exports.orElse(Maybe.Some([])).map(arr => push(arr, path))
    } else if (path.isImportDeclaration()) {
      state.imports = state.imports.orElse(Maybe.Some([])).map(arr => push(arr, path))
    }
    return state
  }, {
    defaultExport: Maybe.None(),
    exports: Maybe.None(),
    imports: Maybe.None()
  })
}
