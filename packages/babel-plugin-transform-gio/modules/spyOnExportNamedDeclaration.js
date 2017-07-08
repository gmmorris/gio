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
  exportPath.insertAfter(
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
  
  exportPath.insertAfter(
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

const getIDAndDeclerationOfVariableDeclaration = (t, variableDeclaration) =>
  t.isVariableDeclaration(variableDeclaration)
    ? Maybe.Some(
        variableDeclaration.declarations.map(
          declaration => (
            {
              id: declaration.id,
              declaration: declaration.init,
              definedConst: true
            }
          )
        )        
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
        declaration
      )
    } else {
      reassignExportToFunctionDeclaration(
        t,
        exportPath,
        pragmaDefineExport,
        uniqueName,
        declaration
      )
    }

    exportSpiedExport(t, exportPath, pragmaDefineExport, uniqueName, id)
    return declaration
  }

  getIDAndDeclerationOfFunctionDeclaration(t, declaration)
    .map(applyReassign)
    .map(dec => {
      exportPath.remove()
      return dec
    })

  getIDAndDeclerationOfVariableDeclaration(t, declaration)
    .map(declaredVariables => {
      return declaredVariables.map(applyReassign)
    })
    .map(dec => {
      exportPath.remove()
      return dec
    })

  return exportPath
}
