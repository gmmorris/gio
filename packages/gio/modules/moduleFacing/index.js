import partial from 'lodash.partial'

import augmentModuleExports from './augmentModuleExports'
import { interceptDefaultExport, interceptExport } from './interceptExport'

export default function createGioAPI() {
  const visitors = {}
  return {
    export: partial(augmentModuleExports)(visitors),
    defineDefaultExport: partial(interceptDefaultExport)(visitors),
    defineExport: partial(interceptExport)(visitors)
  }
}