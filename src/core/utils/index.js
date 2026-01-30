export function updateTransform(element, x, y) {
  // 获取当前的transform样式值
  var transform = element.style.transform

  // 使用正则表达式解析出translate的x和y值
  var translateRegex = /translate\(([^px]*)px, ([^px]*)px\)/
  // var matches = transform.match(translateRegex);
  // 增加20像素
  // var newX = parseFloat(matches[1]) + 20;
  // var newY = parseFloat(matches[2]) + 20;
  var newX = x
  var newY = y
  // 替换原来的translate值
  var newTransform = transform.replace(translateRegex, `translate(${newX}px, ${newY}px)`)
  // 设置新的transform样式回元素
  element.style.transform = newTransform
  return element
}

// 根据点位矩阵获取属性
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

  // 是否是第一次执行
  let firstInvoke = true

  function throttled() {
    let context = this
    let args = arguments

    // 如果是第一次触发，直接执行
    if (firstInvoke) {
      callback.apply(context, args)
      firstInvoke = false
      return
    }

    // 如果定时器已存在，直接返回。
    if (timerId) {
      return
    }

    timerId = setTimeout(function () {
      // 注意这里 将 clearTimeout 放到 内部来执行了
      clearTimeout(timerId)
      timerId = null

      callback.apply(context, args)
    }, wait)
  }

  // 返回一个闭包
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
      .filter(Boolean) // 确保过滤掉 undefined
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
    throw new Error('传入的值不是数字')
  }

  // 将值转换为浮点数，并保留指定的小数位
  let formattedValue = parseFloat(value).toFixed(decimalPlaces)

  // 使用正则表达式去除多余的 0
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
  // 检查常见的移动设备标识
  const mobileTest = /android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
  // 处理 iPadOS 13 及以上版本的情况
  const iPadTest =
    navigator.userAgent.match(/(iPad)/) ||
    (navigator.userAgent.match(/(Macintosh)/) && navigator.maxTouchPoints >= 1)

  return mobileTest || iPadTest
}


/**
 * 从 RGBA 或 16进制 字符串中提取 RGB 和 16进制色值
 * @param {string} rgbaString - 颜色字符串
 * @returns {Object|null} 包含 r, g, b  hex 属性的对象
 */
export function parseColor(colorString) {
  // 移除空格并转换为小写
  const color = colorString.replace(/\s/g, '').toLowerCase();
  
  let r, g, b;
  
  // 处理hex格式
  if (color.startsWith('#') || /^[0-9a-f]{3,6}$/i.test(color)) {
    let hex = color.startsWith('#') ? color.slice(1) : color;
    
    // 处理3位hex (如 #f00)
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    
    // 处理6位hex
    if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else {
      throw new Error('Invalid hex color format');
    }
  }
  // 处理rgb和rgba格式
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
    
    // 验证RGB值范围
    if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
      throw new Error('RGB values must be between 0 and 255');
    }
  }
  else {
    throw new Error('颜色转换异常');
  }
  
  // 转换为hex格式
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