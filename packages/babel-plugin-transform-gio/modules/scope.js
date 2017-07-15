exports.findReferencedBindingInScope = function(exportPath, scope) {
  return Object.values(scope.bindings).find(binding =>
    binding.referencePaths
      .map(path => path.parentPath)
      .find(parent => parent === exportPath)
  )
}

exports.findReferencedIdentifierBindingInScope = function(identifier, scope) {
  return Object.values(scope.bindings).find(binding =>
    binding.referencePaths
      .map(path => path.node)
      .find(node => node === identifier)
  )
}

exports.generateUniqueIdentifier = function(exportPath, identifier) {
  return exportPath.scope.generateUidIdentifier(identifier.name)
}
