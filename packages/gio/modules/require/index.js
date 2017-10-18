
import { resolve, transform, resolveConfig } from './require'
import requireSourceAsModule from './requireSourceAsModule'
import augmentWithInterceptionAPI from './augmentWithInterceptionAPI'

function ensureBabelConfig(babelConfig, relativeTo){
  return babelConfig
    ? Promise.resovle(babelConfig)
    : resolveConfig(relativeTo)
}

export default function ({ module, relativeTo, config }){
  return Promise.all([
      resolve(module, relativeTo),
      ensureBabelConfig(config, relativeTo)
    ])
    .then(([moduleResolution, config]) => transform(moduleResolution, config))
    .then(transformed => transformed.code)
    .then(augmentWithInterceptionAPI)
    .then(interceptibleCode =>
      requireSourceAsModule(
        interceptibleCode,
        module
      )
    )
}