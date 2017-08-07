import { expect } from 'chai'
import augmentModuleExports, { installVisitors } from './augmentModuleExports' 

import { spy } from 'sinon'

describe('augmentModuleExports', function() {
  it('takes an exported object and augments it with the installVisitors function', function() {
    const moduleExports = {}
    const visitors = {}
    const visitorInstaller  = spy()

    augmentModuleExports({
      visitors,
      moduleExports,
      visitorInstaller
    })

    expect(
      moduleExports._gioInstallVisitors
    ).to.be.a('function')

    moduleExports._gioInstallVisitors()

    expect(
      visitorInstaller.calledOnce
    ).to.be.true

    expect(
      visitorInstaller.getCall(0).args[0]
    ).to.equal(
      visitors
    )
  })

  it(`throws if a non object is provided as the module's exports`, function() {
    expect(
      () => augmentModuleExports({})
    ).to.throw(
      /An invalid module export has been encountered. Are you sure this module is using valid ES Module syntax\?/
    )
  })

  it(`throws if a non object is provided as the module's exports`, function() {
    expect(
      () => augmentModuleExports({ moduleExports: {} })
    ).to.not.throw()
  })
})

describe('installVisitors', function() {
  it(`takes a visitors container and visitors definition and augments the container with the visitors`, function() {
    
    const visitorContainter = {
      originalVisitor: function() {}
    }
    
    const visitors = {
      someVisitor: function() {},
      anotherVisitor: function() {}
    }

    installVisitors(visitorContainter, visitors)

    expect(
      visitorContainter
    ).to.deep.equal(
      {
        originalVisitor: visitorContainter.originalVisitor,
        someVisitor: visitors.someVisitor,
        anotherVisitor: visitors.anotherVisitor
      }
    )
  })
})
