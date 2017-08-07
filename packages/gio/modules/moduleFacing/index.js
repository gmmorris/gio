import augmentModuleExports from './augmentModuleExports'
import { interceptDefaultExport, interceptExport } from './interceptExport'

const gio = {
  export: augmentModuleExports,
  defineDefaultExport: interceptDefaultExport,
  defineExport: interceptExport
}

export default gio