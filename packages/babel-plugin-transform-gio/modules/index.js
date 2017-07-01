const template = require('babel-template')
const { basename, extname } = require('path')

const DEFAULTS = {
  pragma: 'gio.stub',
  pragmaExport: 'gio.export',
  transformExports: true,
  wrapExports: true
}

const identity = i => i
const optionalTruthy = val => ({
  map: fn => optionalTruthy(val ? fn(val) : val),
  orElse: fn => optionalTruthy(val ? val : fn()),
  get: (fn = identity) => val ? fn(val) : undefined,
  isEmpty: () => !val,
  getOrElse: (altVal) => val ? val : altVal
})

const createOptions = defaults => {
  let calculatedOptions = false
  return opts => {
    return calculatedOptions
      ? calculatedOptions
      : Object.assign(calculatedOptions, defaults, opts)
  }
}

function getPragmaRoot (pragma) {
  return optionalTruthy(
      pragma.match(/^[^\.]+/)
    )
    .map(match => match[0])
    .getOrElse(pragma)
}

const wrapEreateExport = pragmaExport => template(`
  ${pragmaExport}(exports);
`);  

const spiedDefaultExport = pragma => template(`
  export default ${pragma}(EXPORT_NAME, EXPORTED_IDENTIFIER)
`, {sourceType: 'module'});  

module.exports = function (babel) {
  const { types: t } = babel;

  const getOptions = createOptions(DEFAULTS)

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
                state.defaultExport = optionalTruthy(path)
              }
              if(path.isExportDeclaration()) {
                state.exports.push(path)
              }
              return state
            }, {
              defaultExport: optionalTruthy(),
              exports: [],
              imports: []
            })

          gioSurvey.hasExports = gioSurvey.exports.length || !!gioSurvey.defaultExport.isEmpty()

          if (transformExports) {
            gioSurvey.defaultExport
              .get(exportPath => {
                const { declaration } = exportPath.node
                const { name } = declaration.id

                exportPath.replaceWith(declaration)
                exportPath.scope.rename(name)
                exportPath.insertAfter(spiedDefaultExport(pragma)({
                  EXPORTED_IDENTIFIER: declaration.id,
                  EXPORT_NAME: t.stringLiteral(name)
                }))

              })
          }

          if (wrapExports && gioSurvey.exports.length) {
            path.pushContainer("body", [wrapEreateExport(pragmaExport)()]);
          }
        },
      }
    }
  };
}
