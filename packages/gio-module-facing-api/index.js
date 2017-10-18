const rollup = require('rollup')

// see below for details on the options
const inputOptions = {
  input: require.resolve('./modules/index.js'),
}

const outputOptions = {
  format: 'iife'
}

module.exports = function (name = 'gio') {
  return rollup
    .rollup(inputOptions)
    .then(bundle => bundle.generate({ ...outputOptions, name }))
    .then(generated => generated.code)
}