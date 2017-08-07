export function installVisitors (visitorsContainer, visitors = {}){
  Object.assign(visitorsContainer, visitors)
    // Object.keys(exports)
    //   .filter(exportName => typeof exports[exportName] === 'function')
    //   .forEach(exportName => {
    //     exports[exportName] =
    //       _spyExport(
    //         exports[exportName],
    //         callExport.bind(this, exportName)
    //       )
    //   })
}

export default function ({ visitors, moduleExports, visitorInstaller = installVisitors }){
  if(typeof moduleExports !== 'object') {
    throw new Error('An invalid module export has been encountered. Are you sure this module is using valid ES Module syntax?')
  }

  moduleExports._gioInstallVisitors = visitorInstaller.bind(undefined, visitors)
}