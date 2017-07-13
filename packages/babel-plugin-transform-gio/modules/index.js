const template = require('babel-template')
const { basename, extname } = require('path')
const monet = require('monet')
const { Maybe } = monet

const reassignAndReexportDefaultExport = require('./spyOnExportDefaultDeclaration')
const reassignAndReexportNamedExport = require('./spyOnExportNamedDeclaration')
const surverySource = require('./surveySource')

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

function getPragmaRoot(pragma) {
  return Maybe.fromNull(pragma.match(/^[^\.]+/))
    .map(match => match[0])
    .orSome(pragma)
}

const wrapCreateExport = pragmaExport =>
  template(`
  ${pragmaExport}(exports);
`)

module.exports = function(babel) {
  const { types: t } = babel

  const getOptions = createOptions(DEFAULTS)

  return {
    pre(state) {},
    visitor: {
      FunctionDeclaration(path, state) {
        const { pragma } = getOptions(state.opts)
      },
      Program: {
        exit(path, state) {
          const { scope } = path

          const {
            pragma,
            pragmaExport,
            pragmaDefineExport,
            pragmaDefineDefaultExport,
            transformExports,
            wrapExports
          } = getOptions(state.opts)

          scope.rename(getPragmaRoot(pragma))

          const gioSurvey = surverySource(path)

          gioSurvey.hasExports =
            gioSurvey.exports.isSome() || gioSurvey.defaultExport.isSome()

          if (gioSurvey.hasExports) {
            if (transformExports) {
              gioSurvey.defaultExport
                .map(exportPath =>
                  reassignAndReexportDefaultExport(
                    t,
                    exportPath,
                    pragmaDefineDefaultExport
                  )
                )

              gioSurvey.exports.map(exportPaths => {
                exportPaths.forEach(exportPath => {
                  reassignAndReexportNamedExport(
                    t,
                    exportPath,
                    pragmaDefineExport,
                    pragmaDefineDefaultExport
                  )
                })
                return exportPaths
              })
            }

            if (wrapExports) {
              path.pushContainer('body', [wrapCreateExport(pragmaExport)()])
            }
          }
        }
      }
    }
  }
}
