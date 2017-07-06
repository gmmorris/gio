const { optional, identity } = require('./helpers')

module.exports = function(sourceFilePath) {
  return sourceFilePath.get('body').reduce((state, path) => {
    if (path.isExportDefaultDeclaration()) {
      state.defaultExport = optional(path)
    } else if (path.isExportDeclaration()) {
      state.exports.push(path)
    }
    return state
  }, {
    defaultExport: optional(),
    exports: [],
    imports: []
  })
}
