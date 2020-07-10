import test from 'uvu'
import * as assert from 'uvu/assert'
import jsdom from 'jsdom'
import delay from 'delay'
import {createDomView, html} from '../../main.js'

test('no change - dynamic', async () => {
  const dom = new jsdom.JSDOM(`
    <!doctype html>
    <html>
      <head>
        <title></title>
      </head>
      <body>
      </body>
    </html>
  `)

  const el = dom.window.document.body

  const item = (i) =>
    html`
      <li>${i}</li>
    `

  const view = createDomView(
    el,
    () => html`
      <body>
        <ul>
          ${[1, 2, 3].map((i) => item(i))}
        </ul>
        ${html`
          <p>lorem ipsum dolor</p>
        `}
      </body>
    `
  )

  view()

  await delay(0)

  assert.equal(el.childNodes?.length, 2)

  assert.equal(el.childNodes?.[0]?.nodeName, 'UL')

  assert.equal(el.childNodes?.[0]?.childNodes?.length, 3)

  assert.equal(el.childNodes?.[1]?.nodeName, 'P')

  assert.equal(el.childNodes?.[1]?.childNodes?.length, 1)

  view()

  await delay(0)

  assert.equal(el.childNodes?.length, 2)

  assert.equal(el.childNodes?.[0]?.nodeName, 'UL')

  assert.equal(el.childNodes?.[0]?.childNodes?.length, 3)

  assert.equal(el.childNodes?.[1]?.nodeName, 'P')

  assert.equal(el.childNodes?.[1]?.childNodes?.length, 1)
})
