const monet = require('monet')
const { Maybe } = monet

module.exports = function(sourceFilePath) {
  return sourceFilePath.get('body').reduce((state, path) => {
    if (path.isExportDefaultDeclaration()) {
      state.defaultExport = Maybe.Some(path)
    } else if (path.isExportDeclaration()) {
      state.exports.push(path)
    }
    return state
  }, {
    defaultExport: Maybe.None(),
    exports: [],
    imports: []
  })
}
