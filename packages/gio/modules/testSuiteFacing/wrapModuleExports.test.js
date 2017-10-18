import { expect } from 'chai'
import { spy } from 'sinon'

import wrapModuleExports from './wrapModuleExports' 

describe('wrapModuleExports', function() {
  it(`takes a the exports of a module and a replacement function, and returns a new exports object having wrapped the exported functions`, function() {
    const moduleExports = {
      oneMethod: function () {},
      secondMethod: function () {},
      constant: { a: 1, b: 2, c: 3 }
    }

    const wrapper = spy((name) => ({ name }))

    expect(
      wrapModuleExports(moduleExports, wrapper)
    ).to.deep.equal(
      {
        oneMethod: { name: 'oneMethod' },
        secondMethod: { name: 'secondMethod' },
        constant: { a: 1, b: 2, c: 3 }
      }
    )

    expect(
      wrapper.calledTwice
    ).to.be.true

    expect(
      wrapper.calledWith('oneMethod', moduleExports.oneMethod)
    ).to.be.true

    expect(
      wrapper.calledWith('secondMethod', moduleExports.secondMethod)
    ).to.be.true
  })
  
  it(`wraps default exports too`, function() {
    const moduleExports = {
      oneMethod: function () {},
      default: function () {},
      constant: { a: 1, b: 2, c: 3 }
    }

    const wrapper = spy((name) => ({ name }))

    expect(
      wrapModuleExports(moduleExports, wrapper)
    ).to.deep.equal(
      {
        oneMethod: { name: 'oneMethod' },
        default: { name: 'default' },
        constant: { a: 1, b: 2, c: 3 }
      }
    )

    expect(
      wrapper.calledTwice
    ).to.be.true

    expect(
      wrapper.calledWith('oneMethod', moduleExports.oneMethod)
    ).to.be.true

    expect(
      wrapper.calledWith('default', moduleExports.default)
    ).to.be.true
  })
  
  it(`skips any specified exported functions`, function() {
    const moduleExports = {
      oneMethod: function () {},
      default: function () {},
      _gioInstallVisitors: function () {}
    }

    expect(
      wrapModuleExports(moduleExports, (key) => ({ key }), '_gioInstallVisitors')
    ).to.deep.equal(
      {
        oneMethod: { key: 'oneMethod' },
        default: { key: 'default' }
      }
    )
  })
})
