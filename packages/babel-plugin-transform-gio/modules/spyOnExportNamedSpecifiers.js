const template = require('babel-template')
const monet = require('monet')
const { Maybe } = monet

const {
  findReferencedIdentifierBindingInScope,
  generateUniqueIdentifier
} = require('./scope')

const spiedDefinition = pragma =>
  template(
    `
    const EXPORT_IDENTIFIER = ${pragma}(EXPORT_NAME, EXPORTED_IDENTIFIER);
    `,
    { sourceType: 'module' }
  )

const defineSpiedExport = (
  t,
  exportPath,
  pragmaDefineExport,
  uniqueName,
  exportIdentifier,
  exportName = exportIdentifier
) => {
  const EXPORTED_IDENTIFIER = uniqueName
  const EXPORT_IDENTIFIER = exportIdentifier
  const EXPORT_NAME = t.stringLiteral(exportName.name)

  return spiedDefinition(pragmaDefineExport)({
    EXPORTED_IDENTIFIER,
    EXPORT_IDENTIFIER,
    EXPORT_NAME
  })
}

function handleExportedIdentifier(
  t,
  exportPath,
  pragmaDefineExport,
  exportedIdentifier,
  exportedLocalIdentifier
) {
  return Maybe.Some(exportedLocalIdentifier).flatMap(identifier =>
    Maybe.fromNull(
      findReferencedIdentifierBindingInScope(identifier, exportPath.scope)
    )
      .map(binding => ({
        identifier,
        uniqueName: generateUniqueIdentifier(exportPath, identifier),
        declarationPath: binding.path,
        functionDeclaration: t.isFunctionDeclaration(binding.path)
          ? binding.path.node
          : binding.path.node.init
      }))
      .map(
        ({ identifier, declarationPath, functionDeclaration, uniqueName }) => {
          const exportName = t.isFunctionDeclaration(declarationPath)
            ? uniqueName
            : Maybe.fromNull(functionDeclaration.id).orSome(uniqueName)

          declarationPath.replaceWith(
            t.VariableDeclarator(
              uniqueName,
              t.functionExpression(
                exportName,
                functionDeclaration.params,
                functionDeclaration.body,
                functionDeclaration.generator,
                functionDeclaration.async
              )
            )
          )

          exportPath.insertBefore(
            defineSpiedExport(
              t,
              exportPath,
              pragmaDefineExport,
              uniqueName,
              identifier,
              exportedIdentifier
            )
          )

          return functionDeclaration
        }
      )
  )
}

function isDefaultIdentifier(id) {
  return id && id.name === 'default'
}

function handleExportedSpecifiers(
  t,
  specifiers,
  exportPath,
  pragmaDefineExport,
  pragmaDefineDefaultExport
) {
  specifiers.map(({ exported, local }) => {
    handleExportedIdentifier(
      t,
      exportPath,
      isDefaultIdentifier(exported)
        ? pragmaDefineDefaultExport
        : pragmaDefineExport,
      exported,
      local
    )
  })

  return specifiers
}

module.exports = function reassignAndReexportExport(
  t,
  exportPath,
  maybeNode,
  pragmaDefineExport,
  pragmaDefineDefaultExport
) {
  return maybeNode
    .flatMap(node => Maybe.fromNull(node.specifiers))
    .filter(specifiers => specifiers.length)
    .map(specifiers => {
      handleExportedSpecifiers(
        t,
        specifiers,
        exportPath,
        pragmaDefineExport,
        pragmaDefineDefaultExport
      )

      return exportPath
    })
}
