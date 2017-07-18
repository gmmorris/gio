
var Module = require('module')
var path = require('path')

function getParentOfCurrentModule (){
  return module.parent
}

export default function requireSourceAsModule(
  code, filename,
  {
    ModuleInstanciator = Module, getParent = getParentOfCurrentModule, getModulePaths = Module._nodeModulePaths, getDirectoryByFilename = path.dirname
  } = {}
) {
	const moduleFromSource = new ModuleInstanciator(filename, getParent())
	moduleFromSource.filename = filename
	moduleFromSource.paths = getModulePaths(getDirectoryByFilename(filename))
	moduleFromSource._compile(code, filename)
	return moduleFromSource.exports
}