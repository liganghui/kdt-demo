export function updateTransform(element, x, y) {
  // Get the currenttransformstyle value
  var transform = element.style.transform

  // Use regular expressions to parse outtranslateofxandyvalue
  var translateRegex = /translate\(([^px]*)px, ([^px]*)px\)/
  // var matches = transform.match(translateRegex);
  // Increase20pixels
  // var newX = parseFloat(matches[1]) + 20;
  // var newY = parseFloat(matches[2]) + 20;
  var newX = x
  var newY = y
  // Replace the originaltranslatevalue
  var newTransform = transform.replace(translateRegex, `translate(${newX}px, ${newY}px)`)
  // Set the newtransformstyle back to the element
  element.style.transform = newTransform
  return element
}

// Get properties according to the point matrix
export function getDecompose(me) {
  var a = me[0],
    b = me[1],
    c = me[2],
    d = me[3],
    acos = Math.acos,
    atan = Math.atan,
    sqrt = Math.sqrt,
    pi = Math.PI,
    translate = { x: me[4], y: me[5] },
    rotation = 0,
    scale = { x: 1, y: 1 },
    skew = { x: 0, y: 0 },
    determ = a * d - b * c

  if (a || b) {
    var r = sqrt(a * a + b * b)
    rotation = b > 0 ? acos(a / r) : -acos(a / r)
    scale = { x: r, y: determ / r }
    skew.x = atan((a * c + b * d) / (r * r))
  } else if (c || d) {
    var s = sqrt(c * c + d * d)
    rotation = pi * 0.5 - (d > 0 ? acos(-c / s) : -acos(c / s))
    scale = { x: determ / s, y: s }
    skew.y = atan((a * c + b * d) / (s * s))
  } else {
    // a = b = c = d = 0
    scale = { x: 0, y: 0 } // = invalid matrix
  }

  return {
    scale: scale,
    position: translate,
    rotation: rotation,
    skew: skew
  }
}

export function throttle(fn, wait) {
  let callback = fn
  let timerId = null

  // Whether it is the first execution
  let firstInvoke = true

  function throttled() {
    let context = this
    let args = arguments

    // If it is the first trigger，Execute directly
    if (firstInvoke) {
      callback.apply(context, args)
      firstInvoke = false
      return
    }

    // If the timer already exists，Return directly。
    if (timerId) {
      return
    }

    timerId = setTimeout(function () {
      // Note here will clearTimeout put execute internally
      clearTimeout(timerId)
      timerId = null

      callback.apply(context, args)
    }, wait)
  }

  // Return a closure
  return throttled
}

export function getParamNodes(node, that, getActiveNodes = true) {
  let nodes = []
  if (node instanceof Konva.Node) {
    nodes = [node]
  } else if (node instanceof Array) {
    nodes = [...node]
      .map((item) => {
        if (item instanceof Konva.Node || item instanceof Konva.Group) {
          return item
        } else if (typeof item === 'string') {
          return that.stateManage.class.node.getNodeById(item)
        }
      })
      .filter(Boolean) // Ensure to filter out undefined
  } else if (typeof node === 'string') {
    nodes = [that.stateManage.class.node.getNodeById(node)]
  } else if (!node && getActiveNodes) {
    nodes = that.state.selectedNodes
  }
  return nodes
}
export function getParamNode(node, that) {
  if (node instanceof Konva.Node || node instanceof Konva.Group) {
    return node
  } else if (typeof node === 'string') {
    return that.stateManage.class.node.getNodeById(node)
  } else {
    return null
  }
}

function formatNumber(value, decimalPlaces) {
  if (isNaN(value)) {
    throw new Error('the value passed in is not a number')
  }

  // Convert the value to a floating - point number，and retain the specified number of decimal places
  let formattedValue = parseFloat(value).toFixed(decimalPlaces)

  // Use regular expressions to remove excess 0
  formattedValue = parseFloat(formattedValue).toString()

  return formattedValue
}

export function isJSONString(str) {
  if (typeof str !== 'string') {
    return false
  }

  try {
    JSON.parse(str)
    return true
  } catch (e) {
    return false
  }
}

export function isMobile() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera
  // Check common mobile device identifiers
  const mobileTest = /android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
  // Handle iPadOS 13 and above versions
  const iPadTest =
    navigator.userAgent.match(/(iPad)/) ||
    (navigator.userAgent.match(/(Macintosh)/) && navigator.maxTouchPoints >= 1)

  return mobileTest || iPadTest
}


/**
 * From RGBA or 16hexadecimal extract from the string RGB and 16hexadecimal color values
 * @param {string} rgbaString - color string
 * @returns {Object|null} containing r, g, b  hex properties object
 */
export function parseColor(colorString) {
  // Remove spaces and convert to lowercase
  const color = colorString.replace(/\s/g, '').toLowerCase();
  
  let r, g, b;
  
  // Handlehexformat
  if (color.startsWith('#') || /^[0-9a-f]{3,6}$/i.test(color)) {
    let hex = color.startsWith('#') ? color.slice(1) : color;
    
    // Handle3bithex (such as #f00)
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    
    // Handle6bithex
    if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else {
      throw new Error('Invalid hex color format');
    }
  }
  // Handlergbandrgbaformat
  else if (color.startsWith('rgb')) {
    const match = color.match(/rgba?\(([^)]+)\)/);
    if (!match) {
      throw new Error('Invalid rgb/rgba color format');
    }
    
    const values = match[1].split(',').map(val => parseFloat(val.trim()));
    
    if (values.length < 3) {
      throw new Error('Invalid rgb/rgba color format');
    }
    
    r = Math.round(values[0]);
    g = Math.round(values[1]);
    b = Math.round(values[2]);
    
    // ValidateRGBvalue range
    if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
      throw new Error('RGB values must be between 0 and 255');
    }
  }
  else {
    throw new Error('color conversion exception');
  }
  
  // Convert tohexformat
  const toHex = (num) => {
    const hex = num.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  
  return {
    r: r,
    g: g,
    b: b,
    hex: hex
  };
}