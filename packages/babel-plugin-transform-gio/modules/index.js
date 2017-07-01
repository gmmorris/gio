const template = require('babel-template')
const { basename, extname } = require('path')

const DEFAULTS = {
  pragma: 'gio.stub',
  pragmaExport: 'gio.export'
}

const identity = i => i
const optionalTruthy = val => ({
  map: fn => optionalTruthy(val ? fn(val) : val),
  orElse: fn => optionalTruthy(val ? val : fn()),
  get: () => val,
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

          const { pragma, pragmaExport } = getOptions(state.opts)

          scope.rename(
            getPragmaRoot(pragma)
          )

          const hasExports = path
            .get("body")
            .find(path => path.isExportDefaultDeclaration()) !== undefined

          if (hasExports) {
            path.pushContainer("body", [wrapEreateExport(pragmaExport)()]);
          }
        },
      }
    }
  };
}
