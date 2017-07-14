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
  exportIdentifier,
  exportName = exportIdentifier
) => {
  const EXPORTED_IDENTIFIER = uniqueName
  const EXPORT_IDENTIFIER = exportIdentifier
  const EXPORT_NAME = t.stringLiteral(exportName.name)

  return spiedExport(pragmaDefineExport)({
    EXPORTED_IDENTIFIER,
    EXPORT_IDENTIFIER,
    EXPORT_NAME
  })
}

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

const isExportedFunctionDeclaration = (t, declaration) =>
  t.isFunctionDeclaration(declaration)
    ? Maybe.Some(
        {
          id: declaration.id,
          declaration
        }
      )
    : Maybe.None()

const isExportedExpressions = (t, variableDeclaration) =>
  t.isVariableDeclaration(variableDeclaration)
    ? Maybe.Some(
        variableDeclaration.declarations
          .filter(declaration => t.isFunctionExpression(declaration.init))
          .map(
            declaration => (
              {
                id: declaration.id,
                declaration: declaration.init
              }
            )
          )        
      )
      .filter(declarations => declarations.length > 0)
    : Maybe.None()

const mergeExports = (t, declarations, kind) => 
  t.exportNamedDeclaration(
    t.variableDeclaration(
      kind,
      declarations.map(declaration => {
        return declaration.declaration.declarations[0]
      })
    ),
    declarations.reduce(
      (specifiers, declaration) => {
        return specifiers.concat(declaration.specifiers)
      },
      []
    )
  )

const mergeVariables = (t, declarations, kind) => 
  t.variableDeclaration(
    kind,
    declarations.map(declaration =>
      declaration.declarations[0]
    )
  )

const mergeDeclarations = (t, declarations, kind) => [
  mergeExports(t, declarations.exports, kind),
  mergeVariables(t, declarations.variables, kind)
]

const applyReassignDeclaration = (t, dec, exportPath, pragmaDefineExport) => {
  const { id, declaration, definedConst } = dec
  const uniqueName = exportPath.scope.generateUidIdentifier(id.name)

  return [
    reassignExportToFunctionDeclaration(
      t,
      exportPath,
      pragmaDefineExport,
      uniqueName,
      declaration
    ),
    exportSpiedExport(t, exportPath, pragmaDefineExport, uniqueName, id)
  ]
}
const applyReassignExpression = (t, dec, exportPath, pragmaDefineExport) => {
  const { id, declaration, definedConst } = dec
  const uniqueName = exportPath.scope.generateUidIdentifier(id.name)

  return [
    reassignExportToFunctionExpression(
      t,
      exportPath,
      pragmaDefineExport,
      uniqueName,
      declaration
    ),
    exportSpiedExport(t, exportPath, pragmaDefineExport, uniqueName, id)
  ]
}

function handleExportedDeclaration (t, declaration, exportPath, pragmaDefineExport) {
  const insertDeclerationsAndRemoveOriginalDeclaration = declerations => {
    declerations.forEach(declaration => {
      exportPath.insertAfter(declaration)
    })
    exportPath.remove()
    return declerations
  }

  isExportedFunctionDeclaration(t, declaration)
    .map(declaration => applyReassignDeclaration(t, declaration, exportPath, pragmaDefineExport))
    .map(insertDeclerationsAndRemoveOriginalDeclaration)

  isExportedExpressions(t, declaration)
    .map(declaredVariables => {
      return declaredVariables.reduce((declarations, declaration) => {
        const nodes = applyReassignExpression(t, declaration, exportPath, pragmaDefineExport)
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
      mergeDeclarations(t, declarations, declaration.kind)
    )
    .map(insertDeclerationsAndRemoveOriginalDeclaration)

  return declaration
}


function handleExportedIdentifier(t, exportPath, pragmaDefineExport, exportedIdentifier, exportedLocalIdentifier) {
  return Maybe.Some(exportedLocalIdentifier)
    .flatMap(identifier =>
      Maybe
        .fromNull(findReferencedIdentifierBindingInScope(identifier, exportPath.scope))
        .map(binding => (
          {
            identifier,
            uniqueName: generateUniqueIdentifier(exportPath, identifier),
            declarationPath: binding.path,
            functionDeclaration: t.isFunctionDeclaration(binding.path)
              ? binding.path.node
              : binding.path.node.init
          }
        ))
        .map(({ identifier, declarationPath, functionDeclaration, uniqueName }) => {
          const exportName = t.isFunctionDeclaration(declarationPath)
            ? uniqueName
            : Maybe
                .fromNull(functionDeclaration.id)
                .orSome(uniqueName)

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
            defineSpiedExport(t, exportPath, pragmaDefineExport, uniqueName, identifier, exportedIdentifier)
          )

          return functionDeclaration
        })
    )
      
}

function isDefaultIdentifier(id) {
  return id && id.name === 'default'
}

function handleExportedSpecifiers(t, specifiers, exportPath, pragmaDefineExport, pragmaDefineDefaultExport) {

  specifiers.map(({ exported, local }) => {
    handleExportedIdentifier(
      t,
      exportPath,
      isDefaultIdentifier(exported)
        ? pragmaDefineDefaultExport
        : pragmaDefineExport,
      exported,
      local,
    )
  })

  return specifiers
}

module.exports = function reassignAndReexportExport(
  t,
  exportPath,
  pragmaDefineExport,
  pragmaDefineDefaultExport
) {
  return Maybe.fromNull(exportPath.node)
    .map(node => {
      Maybe.fromNull(node.declaration)
        .map(declaration => handleExportedDeclaration (t, declaration, exportPath, pragmaDefineExport))
      
      Maybe.fromNull(node.specifiers)
        .filter(specifiers => specifiers.length)
        .map(specifiers => handleExportedSpecifiers (t, specifiers, exportPath, pragmaDefineExport, pragmaDefineDefaultExport))

      return exportPath
    })
    .orSome(exportPath)
}
