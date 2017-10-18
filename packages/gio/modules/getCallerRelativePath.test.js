import { expect } from 'chai'
import getCallerRelativePath from './getCallerRelativePath'
import callGetCallerRelativePathFromFixtures from '../fixtures/callerOf_getCallerRelativePath'
import resolvePath from 'resolve'

describe('getCallerRelativePath', function() {
  it('should return the path of the file which calls it', function() {
    expect(
      getCallerRelativePath()
    ).to.match(
      /node_modules\/mocha/
    )
  })

  it('should return the path of the file which calls it', function() {
    expect(
      callGetCallerRelativePathFromFixtures()
    ).to.equal(
      __filename
    )
  })
})