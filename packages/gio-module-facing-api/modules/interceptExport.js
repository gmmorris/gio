export function interceptDefaultExport(visitors, id, exportedName, exportedFunction, log = console.log) {
  return function (...args) {
    log(`interceptDefaultExport: ${id}, ${exportedName}`)
    if(visitors.DefaultExport) {
      visitors.DefaultExport(id, exportedName, args, exportedFunction)
    }
    return exportedFunction.apply(this, args)
  }
}

export function interceptExport(visitors, id, exportedName, exportedFunction, log = console.log) {
  return function (...args) {
    log(`interceptExport: ${id}, ${exportedName}`)
    if(visitors.Export) {
      visitors.Export(id, exportedName, args, exportedFunction)
    }
    return exportedFunction.apply(this, args)
  }
}
