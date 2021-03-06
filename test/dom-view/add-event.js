import {test} from 'uvu'
import * as assert from 'uvu/assert'
import jsdom from 'jsdom'
import delay from 'delay'
import {createDomView, html} from '../../main.js'

test('add event', async () => {
  const dom = new jsdom.JSDOM(`
    <!doctype html>
    <html>
      <head>
        <title></title>
      </head>
      <body></body>
    </html>
  `)

  const el = dom.window.document.body

  let clicked = false

  const onclick = () => {
    clicked = true
  }

  const view = createDomView(
    el,
    () => html`
      <body>
        <button type="button" onclick=${onclick}>Click Me</button>
      </body>
    `
  )

  view()

  await delay(0)

  const button = el.querySelector('button')

  button.dispatchEvent(new dom.window.Event('click', {bubbles: true}))

  await delay(0)

  assert.is(clicked, true)
})
