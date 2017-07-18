import { expect } from 'chai'
import { resolve, transform } from './require'
import babel from 'babel-core'

import { spy } from 'sinon'

describe('resolve', function() {
  it('should take a string and resolve it using the standard node Require resolution', function() {
    expect(
      resolve('./fixtures/testFile.js')
    ).to.equal(
`import readFile from 'fs';
console.log(readFile('.'));`
    )
  })
})

describe('transform', function() {
  it('should take the source of a module and transform it using the gio babel plugin', function() {
    const mockPluginFn = function(){}
    const mockPlugin = spy(() => mockPluginFn)
    
    const mockBabelTransform = spy(code => `;${code};`)

    const src = 'console.log("log something");'

    expect(
      transform(src, mockBabelTransform, mockPlugin)
    ).to.equal(
      ';console.log("log something");;'
    )

    expect(
      mockBabelTransform.withArgs(
        src,
        {
          plugins: [
            mockPluginFn
          ]
        }
      ).calledOnce
    ).to.be.true

    expect(
      mockPlugin.withArgs(babel).calledOnce
    ).to.be.true
  })
})