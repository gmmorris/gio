import augmentModuleExports from './augmentModuleExports'
import { interceptDefaultExport, interceptExport } from './interceptExport'

export function withArgs(fn, args) {
  return (argsObject = {}) => fn({ ...args, ...argsObject })
}

export default function createGioAPI() {
  const visitors = {}
  return {
    export: withArgs(augmentModuleExports, { visitors }),
    defineDefaultExport: withArgs(interceptDefaultExport, { visitors }),
    defineExport: withArgs(interceptExport, { visitors })
  }
}