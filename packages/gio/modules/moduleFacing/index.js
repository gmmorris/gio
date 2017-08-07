import augmentModuleExports from './augmentModuleExports'
import { interceptDefaultExport, interceptExport } from './interceptExport'

export function partialNamedArg(fn, args) {
  return (argsObject = {}) => fn({ ...args, ...argsObject })
}

export default function createGioAPI() {
  const visitors = {}
  return {
    export: partialNamedArg(augmentModuleExports, { visitors }),
    defineDefaultExport: partialNamedArg(interceptDefaultExport, { visitors }),
    defineExport: partialNamedArg(interceptExport, { visitors })
  }
}