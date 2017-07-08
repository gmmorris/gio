const template = require('babel-template')
const monet = require('monet')
const { Maybe } = monet

const spiedExport = pragma =>
    template(
    `
    export const EXPORT_IDENTIFIER = ${pragma}(EXPORT_NAME, EXPORTED_IDENTIFIER);
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
  declaration,
  defineConst
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

const reassignExportToFunctionExpression = (
  t,
  exportPath,
  pragmaDefineExport,
  uniqueName,
  declaration,
  defineConst
) => {
  const FUNCTION_DECLARATION =
    t.functionExpression(
      null,
      declaration.params,
      declaration.body,
      declaration.generator,
      declaration.async
    )
  
  exportPath.replaceWith(
    renamedVariableDeclaration(
      {
        UNIQUE_NAME: uniqueName,
        FUNCTION_DECLARATION
      }
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

const getIDAndDeclerationOfFunctionDeclaration = (t, declaration) =>
  t.isFunctionDeclaration(declaration)
    ? Maybe.Some(
        {
          id: declaration.id,
          declaration,
          definedConst: false
        }
      )
    : Maybe.None()

const getIDAndDeclerationOfVariableDeclaration = (t, declaration) =>
  t.isVariableDeclaration(declaration)
    ? Maybe.Some(
        {
          id: declaration.declarations[0].id,
          declaration: declaration.declarations[0].init,
          definedConst: true
        }
      )
    : Maybe.None()

module.exports = function reassignAndReexportExport(
  t,
  exportPath,
  pragmaDefineExport
) {
  const { declaration } = exportPath.node

  const applyReassign = (dec) => {
    const { id, declaration, definedConst } = dec
    const uniqueName = exportPath.scope.generateUidIdentifier(id.name)

    if(definedConst) {
      reassignExportToFunctionExpression(
      t,
      exportPath,
      pragmaDefineExport,
      uniqueName,
      declaration)
    } else {
      reassignExportToFunctionDeclaration(
      t,
      exportPath,
      pragmaDefineExport,
      uniqueName,
      declaration)
    }

    exportSpiedExport(t, exportPath, pragmaDefineExport, uniqueName, id)
    return declaration
  }

  getIDAndDeclerationOfFunctionDeclaration(t, declaration)
    .map(applyReassign)

  getIDAndDeclerationOfVariableDeclaration(t, declaration)
    .map(applyReassign)

  return exportPath
}
