import path from 'path'

import requireModule from './require/index'
import getCallerRelativePath from './getCallerRelativePath'

export default function(module){
  const relativeTo = path.dirname(getCallerRelativePath())
  console.log(`\n\nmodule ${module} is relative to: ${relativeTo}\n\n`)

  requireModule({ module, relativeTo })
    .then(requireFreshModule => {
      const transofmedModule = requireFreshModule()
    
      console.log(transofmedModule.doSomething())
    }).catch(e => {
      console.log(e)
    })
}