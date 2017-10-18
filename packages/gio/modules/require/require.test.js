import { expect } from 'chai'
import { resolve, resolveConfig, transform } from './require'
import * as babel from 'babel-core'
import fs from 'fs'
import resolvePath from 'resolve'
import { spy } from 'sinon'

describe('resolve', function() {
  it('should take a string and resolve it using the standard node Require resolution', function() {
    return resolve('./fixtures/testFile.js')
    .then(result => {
      expect(
        result
      ).to.equal(
        `import readFile from 'fs';\nconsole.log(readFile('.'));`
      )
    })
  })
  it('should reject if the module cannot be resolved', function() {
    return resolve('./testFile.js')
    .catch(e => {
      expect(
        e instanceof Error
      ).to.be.true
    })
  })
})

describe('resolveConfig', function() {
  it('should find the nearest .babelrc and return its contents', function() {
    return resolveConfig()
    .then(result => {
      expect(
        result
      ).to.deep.equal(
        JSON.parse(
          fs.readFileSync(
            resolvePath.sync('../../.babelrc')
          )
        )
      )
    })
  })

  it('should resovle with an empty config and a warning message if none can be found', function() {
    const mockConsole = {
      warn: spy()
    }

    return resolveConfig('.madeUpConfig', mockConsole)
    .then(result => {
      expect(
        result
      ).to.deep.equal(
        {}
      )

      expect(
        mockConsole.warn.calledWith(
          'Error: Could not locate the configuration file for Babel:.madeUpConfig'
        )
      ).to.be.true
    })
  })
})

describe('transform', function() {
  it('should take the source of a module and transform it using the gio babel plugin', function() {
    const mockPluginFn = function(){}
    const mockPlugin = spy(() => mockPluginFn)
    
    const mockBabelTransform = spy(code => `;${code};`)

    const src = 'console.log("log something");'

    expect(
      transform(src, {}, mockBabelTransform, mockPlugin)
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

  it('should take a babel config and augment the transform with that configuration', function() {
    const mockPluginFn = function(){}
    const mockPlugin = spy(() => mockPluginFn)
    
    const mockBabelTransform = spy(code => `;${code};`)

    const src = 'console.log("log something");'

    transform(
      src,
      {
        "presets": [
          "es2015", "es2016"
        ],
        "plugins": ["transform-object-rest-spread"]
      },
      mockBabelTransform,
      () => 'gio-plugin'
    )

    expect(
      mockBabelTransform
        .calledWithMatch(
          src,
          {
            "presets": [
              "es2015", "es2016"
            ],
            "plugins": ["transform-object-rest-spread", 'gio-plugin']
          }
        )
    ).to.be.true
  })
})