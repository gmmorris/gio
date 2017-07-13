
exports.findReferencedBindingInScope = function (exportPath, scope) {
  return Object.values(scope.bindings)
    .find(binding =>
      binding.referencePaths
        .map(path => path.parentPath)
        .find(parent => parent === exportPath)
    )
}