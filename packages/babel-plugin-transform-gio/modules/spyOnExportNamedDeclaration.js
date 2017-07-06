const template = require('babel-template')

const spiedExport = pragma =>
    template(
    `
    export const EXPORT_IDENTIFIER = ${pragma}(EXPORT_NAME, EXPORTED_IDENTIFIER);
    `,
    { sourceType: 'module' }
  )

const reassignExport = (
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

const exportSpiedExport = (
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
    spiedExport(pragmaDefineExport)({
      EXPORTED_IDENTIFIER,
      EXPORT_IDENTIFIER,
      EXPORT_NAME
    })
  )
}

module.exports = function reassignAndReexportExport(
  t,
  exportPath,
  pragmaDefineExport
) {
  const { declaration } = exportPath.node
  const id = declaration.id
  const uniqueName = exportPath.scope.generateUidIdentifier(id.name)

  reassignExport(
    t,
    exportPath,
    pragmaDefineExport,
    uniqueName,
    declaration
  )
  exportSpiedExport(t, exportPath, pragmaDefineExport, uniqueName, id)
  return exportPath
}
