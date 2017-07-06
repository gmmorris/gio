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
    } else if (path.isExportDeclaration()) {
      state.exports = Maybe.Some(push(state.exports.orSome([]), path))
    } else if (path.isImportDeclaration()) {
      state.imports = Maybe.Some(push(state.imports.orSome([]), path))
    }
    return state
  }, {
    defaultExport: Maybe.None(),
    exports: Maybe.None(),
    imports: Maybe.None()
  })
}
