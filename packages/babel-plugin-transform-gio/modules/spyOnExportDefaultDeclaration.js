const template = require('babel-template')
const monet = require('monet')
const { Maybe } = monet

const {
  findReferencedIdentifierBindingInScope,
  generateUniqueIdentifier
} = require('./scope')

const spiedDefaultExpressionExport = pragma =>
  template(` export default (${pragma}(EXPORT_ID, EXPORT_NAME, EXPORTED_EXPRESSION));`, {
    sourceType: 'module'
  })

const spiedDefaultExport = pragma =>
  template(
    `
  const EXPORT_IDENTIFIER = ${pragma}(EXPORT_ID, EXPORT_NAME, EXPORTED_IDENTIFIER);
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
  exportName,
  id
) => {
  const EXPORTED_IDENTIFIER = uniqueName
  const EXPORT_IDENTIFIER = exportName
  const EXPORT_NAME = t.stringLiteral(exportName.name)
  const EXPORT_ID = t.numericLiteral(id)

  return spiedDefaultExport(pragmaDefineExport)({
    EXPORT_ID,
    EXPORTED_IDENTIFIER,
    EXPORT_IDENTIFIER,
    EXPORT_NAME
  })
}

const createSpiedDefaultExpressionExport = (
  t,
  pragmaDefineExport,
  decleration,
  exportName,
  id
) => {
  const EXPORTED_EXPRESSION = decleration
  const EXPORT_NAME = t.stringLiteral(exportName.name)
  const EXPORT_ID = t.numericLiteral(id)

  return spiedDefaultExpressionExport(pragmaDefineExport)({
    EXPORTED_EXPRESSION,
    EXPORT_NAME,
    EXPORT_ID
  })
}

function handleExportedDeclaration(
  t,
  exportPath,
  pragmaDefineExport,
  functionDeclaration,
  generateExportId
) {
  return Maybe.Some(functionDeclaration)
    .map(functionDeclaration => {
      const identifier = getIdentifierForDeclaredDefaultExport(t, exportPath)
      return {
        identifier,
        uniqueName: generateUniqueIdentifier(exportPath, identifier),
        declarationPath: exportPath,
        functionDeclaration
      }
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
        createSpiedDefaultExport(t, pragmaDefineExport, uniqueName, identifier, generateExportId())
      )

      return functionDeclaration
    })
}

function handleExportedExpression(
  t,
  exportPath,
  pragmaDefineExport,
  functionExpression,
  generateExportId
) {
  return Maybe.Some(functionExpression).map(functionExpression => {
    const identifier = getIdentifierForDeclaredDefaultExport(t, exportPath)
    exportPath.replaceWith(
      createSpiedDefaultExpressionExport(
        t,
        pragmaDefineExport,
        functionExpression,
        identifier,
        generateExportId()
      )
    )

    return functionExpression
  })
}

function handleExportedIdentifier(
  t,
  exportPath,
  pragmaDefineExport,
  exportedIdentifier,
  generateExportId
) {
  return Maybe.Some(exportedIdentifier)
    .flatMap(identifier =>
      Maybe.fromNull(
        findReferencedIdentifierBindingInScope(
          exportedIdentifier,
          exportPath.scope
        )
      ).map(binding => ({
        identifier,
        uniqueName: generateUniqueIdentifier(exportPath, identifier),
        declarationPath: binding.path,
        functionDeclaration: t.isFunctionDeclaration(binding.path)
          ? binding.path.node
          : binding.path.node.init
      }))
    )
    .map(({ identifier, declarationPath, functionDeclaration, uniqueName }) => {
      if (t.isFunctionDeclaration(declarationPath)) {
        declarationPath.replaceWith(
          t.functionDeclaration(
            uniqueName,
            functionDeclaration.params,
            functionDeclaration.body,
            functionDeclaration.generator,
            functionDeclaration.async
          )
        )
      } else {
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
      }

      exportPath.insertAfter(
        createSpiedDefaultExport(
          t,
          pragmaDefineExport,
          uniqueName,
          identifier,
          generateExportId()
        )
      )

      exportPath.remove()
      return functionDeclaration
    })
}

module.exports = function reassignAndReexportDefaultExport(
  t,
  exportPath,
  pragmaDefineExport,
  generateExportId
) {
  const declaration = Maybe.fromNull(exportPath.node.declaration)

  declaration
    .filter(t.isFunctionDeclaration)
    .map(functionDeclaration =>
      handleExportedDeclaration(
        t,
        exportPath,
        pragmaDefineExport,
        functionDeclaration,
        generateExportId
      )
    )

  declaration
    .filter(t.isFunctionExpression)
    .map(functionExpression =>
      handleExportedExpression(
        t,
        exportPath,
        pragmaDefineExport,
        functionExpression,
        generateExportId
      )
    )

  declaration
    .filter(t.isIdentifier)
    .map(exportedIdentifier =>
      handleExportedIdentifier(
        t,
        exportPath,
        pragmaDefineExport,
        exportedIdentifier,
        generateExportId
      )
    )

  return exportPath
}
