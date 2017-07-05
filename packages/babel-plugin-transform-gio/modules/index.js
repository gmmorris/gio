const template = require('babel-template')
const { basename, extname } = require('path')
const { optional, identity } = require('./helpers')

const DEFAULTS = {
  pragma: 'gio.stub',
  pragmaExport: 'gio.export',
  pragmaDefineExport: 'gio.defineExport',
  pragmaDefineDefaultExport: 'gio.defineDefaultExport',
  transformExports: true,
  wrapExports: true
}

const createOptions = defaults => {
  let calculatedOptions = false
  return opts => {
    return calculatedOptions
      ? calculatedOptions
      : Object.assign(calculatedOptions, defaults, opts)
  }
}

function getPragmaRoot (pragma) {
  return optional(
      pragma.match(/^[^\.]+/)
    )
    .map(match => match[0])
    .getOrElse(pragma)
}

const wrapCreateExport = pragmaExport => template(`
  ${pragmaExport}(exports);
`);

const spiedDefaultExport = pragma => template(`
  const EXPORT_IDENTIFIER = ${pragma}(EXPORT_NAME, EXPORTED_IDENTIFIER);
  export default EXPORT_IDENTIFIER;
`, {sourceType: 'module'});

module.exports = function (babel) {
  const { types: t } = babel;

  const getOptions = createOptions(DEFAULTS)

  const renameDefaultExport = (exportPath, pragmaDefineExport) => {
      const { declaration } = exportPath.node
      const { name } = declaration.id

      const uniqueName = exportPath.scope.generateUidIdentifier(name)

      exportPath.replaceWith(declaration)
      exportPath.scope.rename(name, uniqueName.name)

      const EXPORTED_IDENTIFIER = declaration.id
      const EXPORT_IDENTIFIER = t.identifier(name)
      const EXPORT_NAME = t.stringLiteral(name)

      exportPath.insertAfter(spiedDefaultExport(pragmaDefineExport)({
        EXPORTED_IDENTIFIER,
        EXPORT_IDENTIFIER,
        EXPORT_NAME
      }))
  }

  const assignNameToDefaultExport = (exportPath, pragmaDefineExport) => {
      const { declaration } = exportPath.node
      const uniqueName = exportPath.scope.generateUidIdentifier('defaultExport')

      exportPath.replaceWith(
          t.functionDeclaration(
            uniqueName,
            declaration.params,
            declaration.body,
            declaration.generator,
            declaration.async
          )
      )

      const EXPORTED_IDENTIFIER = uniqueName
      const EXPORT_IDENTIFIER = t.identifier('defaultExport')
      const EXPORT_NAME = t.stringLiteral('defaultExport')

      exportPath.insertAfter(spiedDefaultExport(pragmaDefineExport)({
        EXPORTED_IDENTIFIER,
        EXPORT_IDENTIFIER,
        EXPORT_NAME
      }))
  }

  const isNamedDecleration = (t, exportPath) => {
      return t.isExportNamedDeclaration(exportPath) || 
        (t.isExportDefaultDeclaration(exportPath) && exportPath.node.declaration.id)
  }

  const isAnonymousDecleration = (t, exportPath) => {
      return t.isExportDefaultDeclaration(exportPath) && exportPath.node.declaration.id === null
  }

  return {
    pre(state) {
    },
    visitor: {
      FunctionDeclaration(path, state) {
        const { pragma } = getOptions(state.opts)
      },
      Program: {
        exit(path, state) {
          const { scope } = path;

          const { 
            pragma,
            pragmaExport,
            pragmaDefineExport,
            pragmaDefineDefaultExport,
            transformExports,
            wrapExports
          } = getOptions(state.opts)
          
          scope.rename(
            getPragmaRoot(pragma)
          )

          const gioSurvey = path
            .get("body")
            .reduce((state, path) => {
              if(path.isExportDefaultDeclaration()) {
                state.defaultExport = optional(path)
              } else if(path.isExportDeclaration()) {
                state.exports.push(path)
              }
              return state
            }, {
              defaultExport: optional(),
              exports: [],
              imports: []
            })

          gioSurvey.hasExports = gioSurvey.exports.length || !gioSurvey.defaultExport.isEmpty()

          if (gioSurvey.hasExports) {
            if(transformExports) {
              gioSurvey.defaultExport
                .filter(path => isNamedDecleration(t, path))
                .get(exportPath => renameDefaultExport(exportPath, pragmaDefineDefaultExport))

              gioSurvey.defaultExport
                .filter(path => isAnonymousDecleration(t, path))
                .get(exportPath => {
                  assignNameToDefaultExport(exportPath, pragmaDefineDefaultExport)
                  // renameDefaultExport(exportPath, pragmaDefineDefaultExport)
                })
            }

            if (wrapExports) {
              path.pushContainer("body", [wrapCreateExport(pragmaExport)()]);
            }
          }
        },
      }
    }
  };
}
