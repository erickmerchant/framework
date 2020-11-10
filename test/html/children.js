import {test} from 'uvu'
import * as assert from 'uvu/assert'
import {html} from '../../main.js'

test('nodes -- static and dynamic', () => {
  const el = html`
    <ul>
      <li>0</li>
      <li>${1}</li>
      <li><span>2</span></li>
    </ul>
  `

  assert.is(el.type, 'node')

  assert.is(el.tag, 'ul')

  assert.is(el.dynamic, true)

  assert.is(el.children?.length, 3)

  assert.is(el.children?.[0]?.type, 'node')

  assert.is(el.children?.[0]?.tag, 'li')

  assert.is(el.children?.[0]?.dynamic, false)

  assert.is(el.children?.[0]?.children?.length, 1)

  assert.is(el.children?.[0]?.children?.[0]?.type, 'text')

  assert.is(el.children?.[0]?.children?.[0]?.value, '0')

  assert.is(el.children?.[1]?.type, 'node')

  assert.is(el.children?.[1]?.tag, 'li')

  assert.is(el.children?.[1]?.dynamic, true)

  assert.is(el.children?.[1]?.children?.length, 1)

  assert.is(el.children?.[1]?.children?.[0]?.type, 'variable')

  assert.is(el.children?.[1]?.children?.[0]?.variable, true)

  assert.is(el.children?.[1]?.children?.[0]?.value, 0)

  assert.is(el.children?.[2]?.type, 'node')

  assert.is(el.children?.[2]?.tag, 'li')

  assert.is(el.children?.[2]?.dynamic, false)

  assert.is(el.children?.[2]?.children?.length, 1)

  assert.is(el.children?.[2]?.children?.[0]?.type, 'node')

  assert.is(el.children?.[2]?.children?.[0]?.tag, 'span')

  assert.is(el.children?.[2]?.children?.[0]?.dynamic, false)

  assert.is(el.children?.[2]?.children?.[0]?.children?.length, 1)

  assert.is(el.children?.[2]?.children?.[0]?.children?.[0]?.type, 'text')

  assert.is(el.children?.[2]?.children?.[0]?.children?.[0]?.value, '2')
})