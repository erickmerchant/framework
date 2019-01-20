import test from 'tape'
import jsdom from 'jsdom'
import streamPromise from 'stream-to-promise'
import {createReadStream} from 'fs'
import main, {html, domUpdate} from '.'
import component from './fixtures/component.mjs'

const noop = () => {}
const newElement = Symbol('new target')

test('main.mjs - init to render', (t) => {
  t.plan(4)

  const commit = main({
    component(state, commit) {
      t.equal(typeof commit, 'function')

      t.equal(state, null)

      return newElement
    },
    update(element) {
      t.deepEqual(element, newElement)
    }
  })

  t.equal(typeof commit, 'function')

  commit()
})

test('main.mjs - using commit', (t) => {
  t.plan(1)

  main({
    component(state, commit) {
      if (state == null) {
        process.nextTick(() => {
          commit((state) => {
            t.equal(state, null)

            return 1
          })
        })
      }

      return newElement
    },
    update: noop
  })()
})

test('main.mjs - commit multiple', (t) => {
  t.plan(2)

  const commit = main({
    component(state) {
      t.equal(state, null)

      return newElement
    },
    update: noop
  })

  commit()

  commit()
})

test('html.mjs - producing virtual dom', (t) => {
  t.plan(4)

  const {div} = html

  t.deepEquals(div({class: 'test'}, 123), {tag: 'div', attributes: {class: 'test'}, children: [123]})

  t.deepEquals(div({class: 'test'}, 123), {tag: 'div', attributes: {class: 'test'}, children: [123]})

  t.deepEquals(div({class: 'test'}, 123), {tag: 'div', attributes: {class: 'test'}, children: [123]})

  t.deepEquals(div({onmount: noop, class: 'test'}, 123), {tag: 'div', attributes: {onmount: noop, class: 'test'}, children: [123]})
})

test('update.mjs - patching the dom', async (t) => {
  t.plan(8)

  const html = await streamPromise(createReadStream('./fixtures/document.html', 'utf8'))

  const dom = new jsdom.JSDOM(html)

  const update = domUpdate(dom.window.document.querySelector('main'), (callback) => callback())

  update(component({state: {heading: 'Test 1'}, dispatch: noop}))

  const result1 = dom.serialize()

  t.equals(result1.replace(/>\s+</g, '><'), '<!DOCTYPE html><html><head><title>Test Document</title></head><body><main><h1>Test 1</h1></main></body></html>')

  update(component({
    state: {
      heading: 'Test 2',
      hasP: true,
      isRed: true,
      pText: 'lorem ipsum dolor ....'
    },
    dispatch: noop
  }))

  const result2 = dom.serialize()

  t.equals(result2.replace(/>\s+</g, '><'), '<!DOCTYPE html><html><head><title>Test Document</title></head><body><main><h1>Test 2</h1><p class="red" data-red="yes">lorem ipsum dolor ....</p></main></body></html>')

  update(component({
    state: {
      heading: 'Test 3',
      hasP: true,
      isRed: false,
      pText: 'lorem ipsum dolor ....'
    },
    dispatch: noop
  }))

  const result3 = dom.serialize()

  t.equals(result3.replace(/>\s+</g, '><'), '<!DOCTYPE html><html><head><title>Test Document</title></head><body><main><h1>Test 3</h1><p class="blue" data-blue="yes">lorem ipsum dolor ....</p></main></body></html>')

  update(component({
    state: {
      heading: 'Test 4',
      hasForm: true,
      formStep: 1
    },
    dispatch: noop
  }))

  const result4 = dom.serialize()

  t.equals(result4.replace(/>\s+</g, '><'), '<!DOCTYPE html><html><head><title>Test Document</title></head><body><main><h1>Test 4</h1><form><input value="1"><input type="checkbox"><select><option selected="">1</option><option>2</option><option>3</option><option>4</option><option>5</option><option>6</option></select><button type="button" disabled="">Next</button></form></main></body></html>')

  update(component({
    state: {
      heading: 'Test 5',
      hasForm: true,
      formStep: 2
    },
    dispatch: noop
  }))

  const result5 = dom.serialize()

  t.equals(result5.replace(/>\s+</g, '><'), '<!DOCTYPE html><html><head><title>Test Document</title></head><body><main><h1>Test 5</h1><form><input><input type="checkbox"><select><option>1</option><option selected="">2</option><option>3</option></select><button type="submit">Submit</button></form></main></body></html>')

  update(component({
    state: {
      heading: 'Test 6',
      hasSvg: true
    },
    dispatch: noop
  }))

  const result6 = dom.serialize()

  t.equals(result6.replace(/>\s+</g, '><'), '<!DOCTYPE html><html><head><title>Test Document</title></head><body><main><h1>Test 6</h1><svg xmlns="http://www.w3.org/2000/svg"><path d="M2 2 2 34 34 34 34 2 z"></path></svg></main></body></html>')

  update(component({
    state: {
      heading: 'Test 7',
      hasOnmount: true
    },
    dispatch: noop
  }))

  const result7 = dom.serialize()

  t.equals(result7.replace(/>\s+</g, '><'), '<!DOCTYPE html><html><head><title>Test Document</title></head><body><main><h1>Test 7</h1><div>onmount set</div></main></body></html>')

  update(component({
    state: {
      heading: 'Test 8',
      hasOnupdate: true
    },
    dispatch: noop
  }))

  const result8 = dom.serialize()

  t.equals(result8.replace(/>\s+</g, '><'), '<!DOCTYPE html><html><head><title>Test Document</title></head><body><main><h1>Test 8</h1><div>onupdate set</div></main></body></html>')
})
