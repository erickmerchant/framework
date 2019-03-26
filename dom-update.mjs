/* global window */

const defaultDom = {
  tag: null,
  attributes: {},
  children: []
}

export default (target, w = window) => {
  const document = target.ownerDocument

  const fromHTML = (html) => {
    const div = document.createElement('div')

    div.innerHTML = html

    return div.childNodes
  }

  const getAttributeNS = (key, attributes) => {
    const colonIndex = key.indexOf(':')

    if (colonIndex > -1) {
      const prefix = key.substring(0, colonIndex)

      const nsKey = `xmlns:${prefix}`

      if (attributes[nsKey]) {
        return [attributes[nsKey], key.substring(colonIndex + 1)]
      }
    }

    return []
  }

  const morphAttributes = (target, nextAttributes, previousAttributes) => {
    const nextKeys = Object.keys(nextAttributes)

    let nextAttributeIndex = -1

    while (++nextAttributeIndex < nextKeys.length) {
      const key = nextKeys[nextAttributeIndex]

      const [attributeNS] = getAttributeNS(key, nextAttributes)

      const val = nextAttributes[key]

      const isBoolean = typeof val === 'boolean'

      const isEvent = key.startsWith('on')

      if (isBoolean || isEvent || key === 'value') {
        target[key] = val
      }

      if (!isEvent && val !== previousAttributes[key] && (!isBoolean || val)) {
        if (attributeNS != null) {
          target.setAttributeNS(attributeNS, key, isBoolean ? '' : val)
        } else {
          target.setAttribute(key, isBoolean ? '' : val)
        }
      }

      if (!isBoolean || val) {
        previousAttributes[key] = null
      }
    }
  }

  const removeUnusedAttributes = (target, previousAttributes) => {
    const previousKeys = Object.keys(previousAttributes)

    let previousAttributeIndex = -1

    while (++previousAttributeIndex < previousKeys.length) {
      const key = previousKeys[previousAttributeIndex]

      const [attributeNS, unnamespaced] = getAttributeNS(key, previousAttributes)

      if (previousAttributes[key] == null) {
        continue
      }

      const isEvent = key.startsWith('on')

      if (isEvent) {
        target[key] = null
      } else if (key === 'value') {
        target.value = ''
      } else if (typeof previousAttributes[key] === 'boolean') {
        target[key] = false
      }

      if (!isEvent) {
        if (attributeNS != null) {
          target.removeAttributeNS(attributeNS, unnamespaced)
        } else {
          target.removeAttribute(key)
        }
      }
    }
  }

  const morphChildren = (target, nextChildren, previousChildren) => {
    let nextChildIndex = -1

    let htmlCount = 0

    while (++nextChildIndex < nextChildren.length) {
      htmlCount--

      let nextChild = nextChildren[nextChildIndex]

      if (nextChild.html != null) {
        const html = fromHTML(nextChild.html)

        nextChildren.splice(nextChildIndex, 1, ...html)

        htmlCount = html.length

        nextChild = nextChildren[nextChildIndex]
      }

      const previousChild = previousChildren[nextChildIndex]

      const childNode = target.childNodes[nextChildIndex]

      const isHTML = htmlCount > 0

      if (nextChild === previousChild || (isHTML && childNode && childNode.isEqualNode(nextChild))) {
        continue
      }

      const isText = typeof nextChild !== 'object'

      let append = false

      let replace = false

      if (childNode == null) {
        append = true
      } else if (isHTML || (isText && childNode.nodeType !== 3) || (!isText && (childNode.nodeType !== 1 || childNode.nodeName.toLowerCase() !== nextChild.tag))) {
        replace = true
      }

      if (append || replace) {
        let el

        if (isText) {
          el = document.createTextNode(nextChild)
        } else if (isHTML) {
          el = nextChild
        } else {
          if (nextChild.attributes.xmlns != null) {
            el = document.createElementNS(nextChild.attributes.xmlns, nextChild.tag)
          } else {
            el = document.createElement(nextChild.tag)
          }

          morph(el, nextChild)
        }

        if (append) {
          target.appendChild(el)
        } else {
          target.replaceChild(el, childNode)
        }
      } else if (isText) {
        childNode.nodeValue = nextChild
      } else {
        morph(childNode, nextChild, previousChild)
      }
    }
  }

  const truncateChildren = (target, length) => {
    while (target.childNodes.length > length) {
      target.removeChild(target.childNodes[length])
    }
  }

  const morph = (target, next, previous) => {
    if (!previous) {
      previous = defaultDom
    }

    morphAttributes(target, next.attributes, previous.attributes)

    removeUnusedAttributes(target, previous.attributes)

    morphChildren(target, next.children, previous.children)

    truncateChildren(target, next.children.length)
  }

  let previous

  return (current) => {
    setTimeout(() => {
      morph(target, current, previous)

      previous = current
    }, 0)
  }
}
