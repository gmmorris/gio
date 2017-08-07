export function installVisitors (visitorsContainer, visitors = {}){
  Object.assign(visitorsContainer, visitors)
}

export default function (visitors, moduleExports, visitorInstaller = installVisitors){
  if(typeof moduleExports !== 'object') {
    throw new Error('An invalid module export has been encountered. Are you sure this module is using valid ES Module syntax?')
  }

  moduleExports._gioInstallVisitors = visitorInstaller.bind(undefined, visitors)
}