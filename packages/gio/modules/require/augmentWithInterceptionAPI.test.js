import { expect } from 'chai'
import augmentWithInterceptionAPI from './augmentWithInterceptionAPI'

describe('augmentWithInterceptionAPI', function() {
  it('takes code string and appends it to the interception code', function() {
    const mockGetAPI = () => Promise.resolve('const gio = { define: () => {} };')
    return augmentWithInterceptionAPI(`export default gio.define(0, 'default', () => {});`, mockGetAPI)
      .then(result => {
        expect(
          result
        ).to.equal(
          `const gio = { define: () => {} };export default gio.define(0, 'default', () => {});`
        )
      })    
  })
})
