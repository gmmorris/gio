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

      exportPath.replaceWith(declaration)
      exportPath.scope.rename(name)
      exportPath.insertAfter(spiedDefaultExport(pragmaDefineExport)({
        EXPORTED_IDENTIFIER: declaration.id,
        EXPORT_IDENTIFIER: t.identifier(name),
        EXPORT_NAME: t.stringLiteral(name)
      }))
  }

  const isNamedDecleration = (exportPath) => {
      return exportPath.node.declaration && exportPath.node.declaration.id
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
                .get(exportPath => {
                  renameDefaultExport(exportPath, pragmaDefineExport)
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
