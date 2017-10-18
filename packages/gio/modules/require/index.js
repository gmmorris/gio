
import { resolve, transform, resolveConfig } from './require'
import requireSourceAsModule from './requireSourceAsModule'
import augmentWithInterceptionAPI from './augmentWithInterceptionAPI'

function ensureBabelConfig(babelConfig){
  return babelConfig
    ? Promise.resovle(babelConfig)
    : resolveConfig()
}

export default function (module, config){
  return Promise.all([
      resolve(module),
      ensureBabelConfig(config)
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