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
  
  return renamedVariableDeclaration(
    {
      UNIQUE_NAME: uniqueName,
      FUNCTION_DECLARATION
    }
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

  return spiedExport(pragmaDefineExport)({
    EXPORTED_IDENTIFIER,
    EXPORT_IDENTIFIER,
    EXPORT_NAME
  })
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
        variableDeclaration.declarations
          .filter(declaration => t.isFunctionExpression(declaration.init))
          .map(
            declaration => (
              {
                id: declaration.id,
                declaration: declaration.init,
                definedConst: true
              }
            )
          )        
      )
      .filter(declarations => declarations.length > 0)
    : Maybe.None()

const mergeExports = (t, declarations) => 
  t.exportNamedDeclaration(
    t.variableDeclaration(
      'const',
      declarations.map(declaration => {
        return declaration.declaration.declarations[0]
      })
    ),
    declarations.reduce((specifiers, declaration) => {
      return specifiers.concat(declaration.specifiers)
    }, [])
  )

const mergeVariables = (t, declarations) => 
  t.variableDeclaration(
    'const',
    declarations.map(declaration => {
      return declaration.declarations[0]
    })
  )

const mergeDeclarations = (t, declarations) => [
  mergeExports(t, declarations.exports),
  mergeVariables(t, declarations.variables)
]

module.exports = function reassignAndReexportExport(
  t,
  exportPath,
  pragmaDefineExport
) {
  const { declaration } = exportPath.node

  const applyReassign = (dec) => {
    const { id, declaration, definedConst } = dec
    const uniqueName = exportPath.scope.generateUidIdentifier(id.name)

    return [
      definedConst
      ? reassignExportToFunctionExpression(
        t,
        exportPath,
        pragmaDefineExport,
        uniqueName,
        declaration
      )
      : reassignExportToFunctionDeclaration(
        t,
        exportPath,
        pragmaDefineExport,
        uniqueName,
        declaration
      ),
      exportSpiedExport(t, exportPath, pragmaDefineExport, uniqueName, id)
    ]
  }

  const insertDeclerationsAndRemoveOriginalDeclaration = declerations => {
    declerations.forEach(declaration => {
      exportPath.insertAfter(declaration)
    })
    exportPath.remove()
    return declerations
  }

  getIDAndDeclerationOfFunctionDeclaration(t, declaration)
    .map(applyReassign)
    .map(insertDeclerationsAndRemoveOriginalDeclaration)

  getIDAndDeclerationOfVariableDeclaration(t, declaration)
    .map(declaredVariables => {
      return declaredVariables.reduce((declarations, declaration) => {
        const nodes = applyReassign(declaration)
        return {
          exports: declarations.exports.concat(
            nodes.filter(t.isExportNamedDeclaration)
          ),
          variables: declarations.variables.concat(
            nodes.filter(t.isVariableDeclaration)
          )
        }
      }, {
        exports: [],
        variables: []
      })
    })
    .map(declarations => 
      mergeDeclarations(t, declarations)
    )
    .map(insertDeclerationsAndRemoveOriginalDeclaration)

  return exportPath
}
