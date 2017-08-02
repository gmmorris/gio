import { expect } from 'chai'
import requireSourceAsModule from './requireSourceAsModule'

import { spy } from 'sinon'

describe('requireSourceAsModule', function() {
  it('should takes a file name and instanciates a new Module with the current module as parent', function() {
    const mockModule = spy(() => ({ _compile: () => {} }))
    const parent = { module: true }
    const getParentOfCurrentModule = () => parent

    const filename = 'source.js'
    const module = requireSourceAsModule('', filename, { ModuleInstanciator: mockModule, getParent: getParentOfCurrentModule })
    
    expect(
      mockModule.withArgs(filename, parent).calledOnce
    ).to.be.true
  })

  it('should set the paths of the current Node executable on the module', function() {

    const paths = ['.', '$PATH']
    const dir = '/path/to/module/'
    const filename = 'source.js'

    const getDirectoryByFilename = spy(() => dir)
    const getModulePaths = spy(() => paths)

    const ModuleInstanciator = function (){
      return (
        { 
          _compile: function () {
            expect(
              this.paths
            ).to.equal(
              paths
            )
            return {
              exports: {}
            }
          } 
        }
      )
    } 

    const moduleExecutor = requireSourceAsModule('', filename, { ModuleInstanciator, getDirectoryByFilename, getModulePaths })
    
    expect(
      getDirectoryByFilename.withArgs(filename).calledOnce
    ).to.be.true

    expect(
      getModulePaths.withArgs(dir).calledOnce
    ).to.be.true

  })

  it('should compile the source and return the compiled exports', function() {

    const filename = 'source.js'
    const source = 'console.log("");'

    const expectedExports = {
      do: () => {}
    }

    const module = { 
      _compile: spy(function () {
        this.exports = expectedExports
      })
    }
    const ModuleInstanciator = function (){
      return module
    } 

    const moduleExecutor = requireSourceAsModule(source, filename, { ModuleInstanciator })
    
    const compiledModule = moduleExecutor()

    expect(
      module._compile.withArgs(source, filename).calledOnce
    ).to.be.true
    
    expect(
      compiledModule
    ).to.deep.equal(
      expectedExports
    )
  })
})
