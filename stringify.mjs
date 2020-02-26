const escape = (str) => String(str).replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/'/g, '&quot;')
  .replace(/'/g, '&#039;')

const selfClosing = [
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr'
]

const noop = () => {}

const resolve = (obj) => {
  if (typeof obj === 'function') {
    obj = obj(noop)
  }

  return obj
}

export const stringify = (obj) => {
  const {tag, attributes, children, variables} = resolve(obj)

  let result = `<${tag}`
  const isSelfClosing = selfClosing.includes(tag)

  const reducedAttributes = attributes.reduce((acc, curr) => {
    if (curr.key) {
      if (curr.key.startsWith('on')) return acc

      acc.push(curr)
    } else {
      for (const [key, value] of Object.entries(variables[curr.value])) {
        acc.push({key, value})
      }
    }

    return acc
  }, [])

  for (const attr of reducedAttributes) {
    let value = attr.value

    if (attr.variable) {
      value = variables[value]
    }

    if (value === true) {
      result += ` ${attr.key}`
    } else if (value !== false) {
      result += ` ${attr.key}="${escape(value)}"`
    }
  }

  result += isSelfClosing ? '>' : '>'

  if (!isSelfClosing) {
    let i = 0

    while (i < children.length) {
      let child = children[i]

      if (child.type === 'variable') {
        child = resolve(variables[child.value])
      }

      if (Array.isArray(child)) {
        children.splice(i, 1, ...child.map((child) => {
          child = resolve(child)

          return child
        }))

        child = child[0]
      }

      if (child.type != null) {
        switch (child.type) {
          case 'html':
            result += child.html
            break

          case 'text':
            result += escape(child.text)
            break

          case 'node':
            result += stringify({...child, variables: child.view != null ? child.variables : variables})
            break
        }
      } else {
        result += escape(child)
      }

      i++
    }

    result += `</${tag}>`
  }

  return result
}
