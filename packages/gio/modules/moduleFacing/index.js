import augmentModuleExports from './augmentModuleExports'
import { interceptDefaultExport, interceptExport } from './interceptExport'

export default function createGioAPI() {
  const visitors = {}
  return {
    export: augmentModuleExports.bind(undefined, visitors),
    defineDefaultExport: interceptDefaultExport.bind(undefined, visitors),
    defineExport: interceptExport.bind(undefined, visitors)
  }
}