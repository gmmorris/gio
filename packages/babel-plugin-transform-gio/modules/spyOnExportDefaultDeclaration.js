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

const reassignDefaultExport = (
  t,
  exportPath,
  pragmaDefineExport,
  uniqueName,
  declaration
) => {
  exportPath.replaceWith(
    t.functionDeclaration(
      uniqueName,
      declaration.params,
      declaration.body,
      declaration.generator,
      declaration.async
    )
  )
}

const exportSpiedDefaultExport = (
  t,
  exportPath,
  pragmaDefineExport,
  uniqueName,
  exportName
) => {
  const EXPORTED_IDENTIFIER = uniqueName
  const EXPORT_IDENTIFIER = exportName
  const EXPORT_NAME = t.stringLiteral(exportName.name)

  exportPath.insertAfter(
    spiedDefaultExport(pragmaDefineExport)({
      EXPORTED_IDENTIFIER,
      EXPORT_IDENTIFIER,
      EXPORT_NAME
    })
  )
}

module.exports = function reassignAndReexportDefaultExport(
  t,
  exportPath,
  pragmaDefineExport
) {
  const declaration = Maybe.fromNull(exportPath.node.declaration)
  const id = getIdentifierForDeclaredDefaultExport(t, exportPath)
  const uniqueName = exportPath.scope.generateUidIdentifier(id.name)


  declaration
    .filter(t.isFunctionDeclaration)
    .map(functionDeclaration => {
      reassignDefaultExport(
        t,
        exportPath,
        pragmaDefineExport,
        uniqueName,
        functionDeclaration
      )
      exportSpiedDefaultExport(t, exportPath, pragmaDefineExport, uniqueName, id)
      return functionDeclaration
    })

  return exportPath
}
