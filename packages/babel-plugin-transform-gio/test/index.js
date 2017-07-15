const path = require('path')
const fs = require('fs')
const babel = require('babel-core')
const resolve = require('try-resolve')
const trimEnd = require("lodash/trimEnd")

const chai = require('chai')
const { expect } = chai
// chai.config.showDiff = true

const plugin = require('../modules/index.js')

function transform(code, opts = {}) {
  return babel.transform(code, {
      plugins: [
        [
          plugin(babel),
          opts
        ]
      ]
    })
}

function readFile(filename) {
  if (fs.existsSync(filename)) {
    let file = trimEnd(fs.readFileSync(filename, "utf8"))
    file = file.replace(/\r\n/g, "\n")
    return file
  } else {
    throw new Error(`couldnt read fixture: ${filename}`)
  }
}

function writeSnapshot(filename, src) {
  try {
    fs.writeFileSync(filename, src)
  } catch(e) {
    console.log('Failed to write Snapshot')
  }
}

function humanize(val, noext) {
  if (noext) val = path.basename(val, path.extname(val))
  return val.replace(/-/g, " ")
}

function getFixtures (fixturesLoc) {
  return fs.readdirSync(fixturesLoc)
    .map(suiteName => {

      const filename = fixturesLoc + "/" + suiteName

      const options = [
          resolve(filename + "/options")
        ]
          .map(suiteOptsLoc => suiteOptsLoc
            ? require(suiteOptsLoc)
            : {}
          ).pop()

      const tests = fs.readdirSync(filename)
        .filter(taskName => fs.lstatSync(`${filename}/${taskName}`).isDirectory())
        .map(taskName => getTest(fixturesLoc, suiteName, taskName, `${filename}/${taskName}`))
        .filter(test => !test.options.skip)

      

      return {
        options,
        tests,
        only: tests.filter(test => !!test.options.only),
        title: humanize(suiteName),
        filename,
      }
    })
}


function getTest(fixturesLoc, suiteName, taskName, taskDir) {
  const srcAlias = `${suiteName}/${taskName}/src.js`
  const targetAlias = `${suiteName}/${taskName}/target.js`
  const src = `${suiteName}/${taskName}/src.js`
  const target = `${suiteName}/${taskName}/target.js`
  const targetSnapshot = `${suiteName}/${taskName}/snapshot.js`
    
  const taskOptsLoc = resolve(`${fixturesLoc}/${suiteName}/${taskName}/options.js`)

  const test = {
    title: humanize(taskName, true),
    options: {},
    src: {
      loc: src,
      code: readFile(`${fixturesLoc}/${src}`),
      filename: srcAlias,
    },
    target: {
      loc: target,
      code: readFile(`${fixturesLoc}/${target}`),
      filename: targetAlias,
    },
    snapshot: {
      filename: `${fixturesLoc}/${targetSnapshot}`
    }
  }

  if (taskOptsLoc){
    test.options = require(taskOptsLoc)
  }

  return test
}

function testRunner (fixturesLoc, name) {
  const suites = getFixtures(fixturesLoc)

  const only = suites.reduce((onlySuites, suite) => {
    return suite.only.length
      ? onlySuites.concat(
        [
          Object.assign(
            {},
            suite,
            { tests: suite.only }
          )
        ])
      : onlySuites
  }, [])

  const suitesToRun = only.length ? only : suites

  for (const testSuite of suitesToRun) {
    describe(name + '/' + testSuite.title, function() {
      for (const task of testSuite.tests) {
        it(task.title, () => {
          const { code : transformedCode } = transform(
            task.src.code,
            Object.assign({}, testSuite.options, task.options)
          )

          try { 
            expect(
              transformedCode
            ).to.equal(
              task.target.code
            )
          } catch(e) {
            // test failed, write snapshot
            writeSnapshot(task.snapshot.filename, transformedCode)
            throw e
          }
        })
      }
    })
  }
}

const name = path.basename(path.dirname(__dirname))
testRunner(__dirname + "/fixtures", name)
