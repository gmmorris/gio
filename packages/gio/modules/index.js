import path from 'path'
import getCallerPath from 'get-caller-path'

import requireModule from './require/index'

export function shallowImport(module){
  const relativeTo = path.dirname(getCallerPath())
  console.log(`\n\nmodule ${module} is relative to: ${relativeTo}\n\n`)

  return requireModule({ module, relativeTo })
}