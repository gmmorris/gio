import { expect } from 'chai'
import { interceptExport, interceptDefaultExport } from './interceptExport' 

import { spy } from 'sinon'

describe('interceptExport', function() {
  it(`returns a function which calls the provided function`, function() {
    const returnValue = {}

    function exportFunction() {
      return returnValue
    }
    
    expect(
      interceptExport({}, 0, '', exportFunction, () => {})()
    ).to.equal(
      returnValue
    )
  })

  it(`passes the arguments to the wrapped function`, function() {
    const returnValue = {}

    function exportFunction() {
      return [...arguments]
    }
    
    expect(
      interceptExport({}, 0, '', exportFunction, () => {})(1, 2, 3)
    ).to.deep.equal(
      [1, 2, 3]
    )
  })

  it(`calls the Export visitor if provided`, function() {
    const Export = spy()
    function exportFunction() {
    }

    interceptExport({ Export }, 0, 'ExportedFunction', exportFunction, () => {})(1, 2, 3)

    expect(
      Export.calledOnce
    ).to.be.true

    expect(
      Export.calledWith(0, 'ExportedFunction', [1, 2, 3], exportFunction)
    ).to.be.true
  })
})

describe('interceptDefaultExport', function() {
  it(`returns a function which calls the provided function`, function() {
    const returnValue = {}

    function exportFunction() {
      return returnValue
    }
    
    expect(
      interceptDefaultExport({}, 0, '', exportFunction, () => {})()
    ).to.equal(
      returnValue
    )
  })

  it(`passes the arguments to the wrapped function`, function() {
    const returnValue = {}

    function exportFunction() {
      return [...arguments]
    }
    
    expect(
      interceptDefaultExport({}, 0, '', exportFunction, () => {})(1, 2, 3)
    ).to.deep.equal(
      [1, 2, 3]
    )
  })

  it(`calls the Export visitor if provided`, function() {
    const DefaultExport = spy()
    function exportFunction() {
    }

    interceptDefaultExport({ DefaultExport }, 0, 'ExportedFunction', exportFunction, () => {})(1, 2, 3)

    expect(
      DefaultExport.calledOnce
    ).to.be.true

    expect(
      DefaultExport.calledWith(0, 'ExportedFunction', [1, 2, 3], exportFunction)
    ).to.be.true
  })
})