import { expect } from 'chai'
import spy from './spy'

describe('spy', function() {

  it('should expose a function which is a wrapper for sinon stubs', function() {
    const spawnedSpy = spy()

    expect(
      spawnedSpy()
    ).to.be.a('function')

    expect(
      spawnedSpy().isSinonProxy
    ).to.be.true
  })
})