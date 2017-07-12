const template = require('babel-template')
const monet = require('monet')
const { Maybe } = monet

const spiedDefaultExport = pragma =>
  template(
    `
  const EXPORT_IDENTIFIER = ${pragma}(EXPORT_NAME, EXPORTED_IDENTIFIER);
  export default EXPORT_IDENTIFIER;
`,
    { sourceType: 'module' }
  )

const isNamedDecleration = (t, exportPath) => {
  return (
    t.isExportNamedDeclaration(exportPath) ||
    (t.isExportDefaultDeclaration(exportPath) && exportPath.node.declaration.id)
  )
}

const getIdentifierForDeclaredDefaultExport = (t, exportPath) =>
  isNamedDecleration(t, exportPath)
    ? exportPath.node.declaration.id
    : t.identifier('defaultExport')

const createSpiedDefaultExport = (
  t,
  pragmaDefineExport,
  uniqueName,
  exportName
) => {
  const EXPORTED_IDENTIFIER = uniqueName
  const EXPORT_IDENTIFIER = exportName
  const EXPORT_NAME = t.stringLiteral(exportName.name)

  return spiedDefaultExport(pragmaDefineExport)({
    EXPORTED_IDENTIFIER,
    EXPORT_IDENTIFIER,
    EXPORT_NAME
  })
}

function findReferencedBindingInScope(exportPath, scope) {
  return Object.values(scope.bindings)
    .find(binding =>
      binding.referencePaths
        .map(path => path.parentPath)
        .find(parent => parent === exportPath)
    )
}

function either (left, right) {
  return left.orElse(right)
}

function generateUniqueIdentifier (exportPath, identifier) {
  return exportPath.scope.generateUidIdentifier(identifier.name)
}

function handleExportedDeclaration(t, exportPath, pragmaDefineExport, functionDeclaration) {
  return Maybe.Some(functionDeclaration)
    .map(functionDeclaration => {
      const identifier = getIdentifierForDeclaredDefaultExport(t, exportPath)
      return (
        {
          identifier,
          uniqueName: generateUniqueIdentifier(exportPath, identifier),
          declarationPath: exportPath,
          functionDeclaration,
        }
      )
    })
    .map(({ identifier, declarationPath, functionDeclaration, uniqueName }) => {
      declarationPath.replaceWith(
          t.functionDeclaration(
            uniqueName,
            functionDeclaration.params,
            functionDeclaration.body,
            functionDeclaration.generator,
            functionDeclaration.async
          )
        )

      exportPath.insertAfter(
        createSpiedDefaultExport(t, pragmaDefineExport, uniqueName, identifier)
      )

      return functionDeclaration
    })
}

function handleExportedIdentifier(t, exportPath, pragmaDefineExport, exportedIdentifier) {
  return Maybe.Some(exportedIdentifier)
    .flatMap(identifier => 
      Maybe
        .fromNull(findReferencedBindingInScope(exportPath, exportPath.scope))
        .map(binding => ({
          identifier,
          uniqueName: generateUniqueIdentifier(exportPath, identifier),
          declarationPath: binding.path,
          functionDeclaration: binding.path.node.init
        })
      )
    )
    .map(({ identifier, declarationPath, functionDeclaration, uniqueName }) => {
      declarationPath.replaceWith(
        t.VariableDeclarator(
          uniqueName,
          t.functionExpression(
            uniqueName,
            functionDeclaration.params,
            functionDeclaration.body,
            functionDeclaration.generator,
            functionDeclaration.async
          )
        )
      )

      exportPath.insertAfter(
        createSpiedDefaultExport(t, pragmaDefineExport, uniqueName, identifier)
      )

      exportPath.remove()
      return functionDeclaration
    })
}

module.exports = function reassignAndReexportDefaultExport(
  t,
  exportPath,
  pragmaDefineExport
) {
  const declaration = Maybe.fromNull(exportPath.node.declaration)

  try {
    return either(
      declaration
        .filter(t.isFunctionDeclaration)
        .map(functionDeclaration => handleExportedDeclaration(t, exportPath, pragmaDefineExport, functionDeclaration))
      ,
      declaration
        .filter(t.isIdentifier)
        .map(exportedIdentifier => handleExportedIdentifier(t, exportPath, pragmaDefineExport, exportedIdentifier))
    )
  } catch(e) {
    console.log(e)
    throw new Error('Unable to parse default export')
  }
}
