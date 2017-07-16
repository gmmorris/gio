const template = require('babel-template')
const monet = require('monet')
const { Maybe } = monet

const spiedExport = pragma =>
  template(
    `
    export const EXPORT_IDENTIFIER = ${pragma}(EXPORT_ID, EXPORT_NAME, EXPORTED_IDENTIFIER);
    `,
    { sourceType: 'module' }
  )

const renamedVariableDeclaration = template(`
  const UNIQUE_NAME = FUNCTION_DECLARATION
`)

const reassignExportToFunctionDeclaration = (
  t,
  exportPath,
  pragmaDefineExport,
  uniqueName,
  declaration
) => {
  return t.functionDeclaration(
    uniqueName,
    declaration.params,
    declaration.body,
    declaration.generator,
    declaration.async
  )
}

const reassignExportToFunctionExpression = (
  t,
  exportPath,
  pragmaDefineExport,
  uniqueName,
  declaration
) => {
  const FUNCTION_DECLARATION = t.functionExpression(
    null,
    declaration.params,
    declaration.body,
    declaration.generator,
    declaration.async
  )

  return renamedVariableDeclaration({
    UNIQUE_NAME: uniqueName,
    FUNCTION_DECLARATION
  })
}

const exportSpiedExport = (
  t,
  exportPath,
  pragmaDefineExport,
  id,
  uniqueName,
  exportIdentifier,
  exportName = exportIdentifier
) => {
  const EXPORTED_IDENTIFIER = uniqueName
  const EXPORT_IDENTIFIER = exportIdentifier
  const EXPORT_NAME = t.stringLiteral(exportName.name)
  const EXPORT_ID = t.numericLiteral(id)

  return spiedExport(pragmaDefineExport)({
    EXPORTED_IDENTIFIER,
    EXPORT_IDENTIFIER,
    EXPORT_NAME,
    EXPORT_ID
  })
}

const isExportedFunctionDeclaration = (t, declaration) =>
  t.isFunctionDeclaration(declaration)
    ? Maybe.Some({
        id: declaration.id,
        declaration
      })
    : Maybe.None()

const isExportedExpressions = (t, variableDeclaration) =>
  t.isVariableDeclaration(variableDeclaration)
    ? Maybe.Some(
        variableDeclaration.declarations
          .filter(declaration => t.isFunctionExpression(declaration.init))
          .map(declaration => ({
            id: declaration.id,
            declaration: declaration.init
          }))
      ).filter(declarations => declarations.length > 0)
    : Maybe.None()

const mergeExports = (t, declarations, kind) =>
  t.exportNamedDeclaration(
    t.variableDeclaration(
      kind,
      declarations.map(declaration => {
        return declaration.declaration.declarations[0]
      })
    ),
    declarations.reduce((specifiers, declaration) => {
      return specifiers.concat(declaration.specifiers)
    }, [])
  )

const mergeVariables = (t, declarations, kind) =>
  t.variableDeclaration(
    kind,
    declarations.map(declaration => declaration.declarations[0])
  )

const mergeDeclarations = (t, declarations, kind) => [
  mergeExports(t, declarations.exports, kind),
  mergeVariables(t, declarations.variables, kind)
]

const applyReassignDeclaration = (t, dec, exportPath, pragmaDefineExport, generateExportId) => {
  const { id, declaration } = dec
  const uniqueName = exportPath.scope.generateUidIdentifier(id.name)

  return [
    reassignExportToFunctionDeclaration(
      t,
      exportPath,
      pragmaDefineExport,
      uniqueName,
      declaration
    ),
    exportSpiedExport(t, exportPath, pragmaDefineExport, generateExportId(), uniqueName, id)
  ]
}
const applyReassignExpression = (t, dec, exportPath, pragmaDefineExport, generateExportId) => {
  const { id, declaration } = dec
  const uniqueName = exportPath.scope.generateUidIdentifier(id.name)

  return [
    reassignExportToFunctionExpression(
      t,
      exportPath,
      pragmaDefineExport,
      uniqueName,
      declaration
    ),
    exportSpiedExport(t, exportPath, pragmaDefineExport, generateExportId(), uniqueName, id)
  ]
}

function handleExportedDeclaration(
  t,
  declaration,
  exportPath,
  pragmaDefineExport,
  generateExportId
) {
  const insertDeclerationsAndRemoveOriginalDeclaration = declerations => {
    declerations.forEach(declaration => {
      exportPath.insertAfter(declaration)
    })
    exportPath.remove()
    return declerations
  }

  isExportedFunctionDeclaration(t, declaration)
    .map(declaration =>
      applyReassignDeclaration(t, declaration, exportPath, pragmaDefineExport, generateExportId)
    )
    .map(insertDeclerationsAndRemoveOriginalDeclaration)

  isExportedExpressions(t, declaration)
    .map(declaredVariables => {
      return declaredVariables.reduce(
        (declarations, declaration) => {
          const nodes = applyReassignExpression(
            t,
            declaration,
            exportPath,
            pragmaDefineExport,
            generateExportId
          )
          return {
            exports: declarations.exports.concat(
              nodes.filter(t.isExportNamedDeclaration)
            ),
            variables: declarations.variables.concat(
              nodes.filter(t.isVariableDeclaration)
            )
          }
        },
        {
          exports: [],
          variables: []
        }
      )
    })
    .map(declarations => mergeDeclarations(t, declarations, declaration.kind))
    .map(insertDeclerationsAndRemoveOriginalDeclaration)

  return declaration
}

module.exports = function reassignAndReexportExport(
  t,
  exportPath,
  maybeNode,
  pragmaDefineExport,
  pragmaDefineDefaultExport,
  generateExportId
) {
  return maybeNode
    .flatMap(node => Maybe.fromNull(node.declaration))
    .map(declaration => {
      handleExportedDeclaration(
        t,
        declaration,
        exportPath,
        pragmaDefineExport,
        generateExportId
      )
      return exportPath
    })
}
