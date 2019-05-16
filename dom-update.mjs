/* global window */

export default (target) => {
  const document = target.ownerDocument

  const fromHTML = (html) => {
    const div = document.createElement('div')

    div.innerHTML = html

    return div.childNodes
  }

  const morphAttributes = (target, nextAttributes, namespaces) => {
    for (const key in nextAttributes) {
      let attributeNS

      const colonIndex = key.indexOf(':')

      if (colonIndex > -1) {
        const prefix = key.substring(0, colonIndex)

        const nsKey = `xmlns:${prefix}`

        if (namespaces[nsKey]) {
          attributeNS = namespaces[nsKey]
        }
      }

      const val = nextAttributes[key]

      const isBoolean = typeof val === 'boolean'

      const isEvent = key.startsWith('on')

      if (isBoolean || isEvent || key === 'value') {
        target[key] = val
      }

      if (!isEvent) {
        if (val == null || val === false) {
          target.removeAttribute(key)
        } else if (attributeNS != null) {
          target.setAttributeNS(attributeNS, key, isBoolean ? '' : val)
        } else {
          target.setAttribute(key, isBoolean ? '' : val)
        }
      }
    }
  }

  const morphChildren = (target, nextChildren, namespaces) => {
    let htmlCount = 0

    for (let nextChildIndex = 0; nextChildIndex < nextChildren.length; nextChildIndex++) {
      htmlCount--

      let nextChild = nextChildren[nextChildIndex]

      if (nextChild.html != null) {
        const html = fromHTML(nextChild.html)

        nextChildren.splice(nextChildIndex, 1, ...html)

        htmlCount = html.length

        nextChild = nextChildren[nextChildIndex]
      }

      const childNode = target.childNodes[nextChildIndex]

      const isHTML = htmlCount > 0

      if (isHTML && childNode && childNode.isEqualNode(nextChild)) {
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
          const namespace = nextChild.attributes.xmlns || namespaces.xmlns

          if (namespace != null) {
            el = document.createElementNS(namespace, nextChild.tag)
          } else {
            el = document.createElement(nextChild.tag)
          }

          morph(el, nextChild, namespaces)
        }

        if (append) {
          target.appendChild(el)
        } else {
          target.replaceChild(el, childNode)
        }
      } else if (isText) {
        if (childNode.nodeValue !== nextChild) {
          childNode.nodeValue = nextChild
        }
      } else {
        morph(childNode, nextChild, namespaces)
      }
    }
  }

  const truncateChildren = (target, length) => {
    while (target.childNodes.length > length) {
      target.removeChild(target.childNodes[length])
    }
  }

  const morph = (target, next, namespaces = {}) => {
    for (const key in next.attributes) {
      if (key === 'xmlns' || key.startsWith('xmlns:')) {
        namespaces[key] = next.attributes[key]
      }
    }

    morphAttributes(target, next.attributes, namespaces)

    const nextChildren = []

    while (next.children.length) {
      const child = next.children.shift()

      if (child == null) continue

      if (Array.isArray(child)) {
        while(child.length) {
          const c = child.shift()

          if (c == null) continue

          nextChildren.push(c)
        }

        continue
      }

      nextChildren.push(child)
    }

    next.children = nextChildren

    morphChildren(target, next.children, namespaces)

    truncateChildren(target, nextChildren.length)
  }

  return (current) => {
    setTimeout(() => {
      morph(target, current)
    }, 0)
  }
}
