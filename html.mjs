const isNameChar = (char) => char && 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-:'.indexOf(char) > -1
const isSpaceChar = (char) => char && ' \t\n\r'.indexOf(char) > -1
const isQuoteChar = (char) => char && '\'"'.indexOf(char) > -1

const clone = (obj, variables, prefix = '') => {
  const variable = variables.find((variable) => variable.path === prefix)

  if (variable != null) {
    if (obj != null && typeof obj === 'object') {
      const result = variable.value

      for (const key of Object.keys(obj)) {
        result[key] = clone(obj[key], variables, `${prefix}.${key}`)
      }

      return result
    }

    return variable.value
  }

  if (obj == null || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map((item, i) => clone(item, variables, `${prefix}.${i}`))
  }

  const result = {}

  for (const key of Object.keys(obj)) {
    result[key] = clone(obj[key], variables, `${prefix}.${key}`)
  }

  return result
}

const tokenize = (str, inTag = false) => {
  const acc = []
  let i = 0

  const current = () => str.charAt(i)
  const next = () => str.charAt(i + 1)

  while (current()) {
    if (!inTag && current() === '<') {
      let value = ''
      let end = false

      if (next() === '/') {
        end = true

        i++
      }

      while (next() && isNameChar(next())) {
        i++

        value += current()
      }

      acc.push({
        type: !end ? 'tag' : 'endtag',
        value
      })

      inTag = value

      i++

      continue
    }

    if (inTag && isSpaceChar(current())) {
      i++

      continue
    }

    if (inTag && current() === '/' && next() === '>') {
      acc.push({
        type: 'end',
        value: inTag
      }, {
        type: 'endtag',
        value: inTag
      }, {
        type: 'end',
        value: inTag
      })

      inTag = false

      i += 2

      continue
    }

    if (inTag && current() === '>') {
      acc.push({
        type: 'end',
        value: ''
      })

      inTag = false

      i++

      continue
    }

    if (inTag && isNameChar(current())) {
      let value = ''

      i--

      while (next() && isNameChar(next())) {
        i++

        value += current()
      }

      acc.push({
        type: 'key',
        value
      })

      if (next() === '=') {
        i++

        let quote = ''
        let value = ''

        if (isQuoteChar(next())) {
          i++

          quote = current()

          while (next() && next() !== quote) {
            i++

            value += current()
          }

          i++

          acc.push({
            type: 'value',
            value
          })
        } else if (next()) {
          while (next() && !isSpaceChar(next()) && next() !== '>') {
            i++

            value += current()
          }

          if (next() !== '>') i++

          acc.push({
            type: 'value',
            value
          })
        }
      }

      i++

      continue
    }

    if (!inTag) {
      let value = ''

      while (current() && current() !== '<') {
        value += current()

        i++
      }

      if (value.trim()) {
        acc.push({
          type: 'text',
          value
        })
      }

      continue
    }

    i++
  }

  return acc
}

const parse = (tokens, child, path, emit) => {
  while (tokens.length) {
    const token = tokens.shift()

    if (token.type === 'end') {
      break
    } else if (token.type === 'key') {
      if (tokens[0] && tokens[0].type === 'value') {
        child.attributes[token.value] = tokens.shift().value
      } else if (tokens[0] && tokens[0].type === 'variable') {
        emit([...path, 'attributes', token.value])

        child.attributes[token.value] = null

        tokens.shift()
      } else {
        child.attributes[token.value] = true
      }
    } else if (token.type === 'variable') {
      emit([...path, 'attributes'])
    }
  }

  while (tokens.length) {
    const token = tokens.shift()

    if (token.type === 'endtag' && token.value === child.tag) {
      break
    } else if (token.type === 'tag') {
      const grand = {
        tag: token.value,
        attributes: {},
        children: []
      }

      child.children.push(parse(tokens, grand, [...path, 'children', child.children.length], emit))
    } else if (token.type === 'text') {
      child.children.push(token.value)
    } else if (token.type === 'variable') {
      emit([...path, 'children', child.children.length])

      child.children.push(null)
    }
  }

  return child
}

const cache = {}

const saturate = (key, vars) => {
  const variables = cache[key].paths.map((path, i) => {
    return {
      path,
      value: vars[i]
    }
  })

  return clone(cache[key].root, variables)
}

const build = (key, strs, vars) => {
  const paths = []

  const emit = (path) => {
    paths.push(path.join('.'))
  }

  const tokens = strs.reduce((acc, str, i) => {
    let inTag = false

    if (acc.length - 2 > -1 && acc[acc.length - 1].type !== 'end') {
      const prev = acc[acc.length - 2]

      if (['tag', 'key', 'value'].includes(prev.type)) {
        const filtered = acc.filter((val) => val.type === 'tag')
        inTag = filtered[filtered.length - 1].value
      }
    }

    acc.push(...tokenize(str, inTag))

    if (i < vars.length) {
      acc.push({
        type: 'variable'
      })
    }

    return acc
  }, [])

  const children = []

  while (tokens.length) {
    const token = tokens.shift()

    if (token.type === 'tag') {
      const child = {
        tag: token.value,
        attributes: {},
        children: []
      }

      children.push(parse(tokens, child, [''], emit))
    } else if (token.type === 'text') {
      children.push(token.value)
    }
  }

  if (children.length !== 1) {
    throw Error('one root element expected')
  }

  const root = children[0]

  cache[key] = {
    root,
    paths
  }

  return saturate(key, vars)
}

const makeTag = (key) => (strs, ...vars) => {
  if (cache[key]) {
    return saturate(key, vars)
  }

  return build(key, strs, vars)
}

export default new Proxy({}, {
  get(_, tag) {
    return makeTag(tag)
  }
})

export const safe = (html) => {
  return {html}
}
