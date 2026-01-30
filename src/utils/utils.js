export const uuid = () => {
  var s = []
  var hexDigits = '0123456789abcdef'
  for (var i = 0; i < 36; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1)
  }
  s[14] = '4' // bits 12-15 of the time_hi_and_version field to 0010
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1) // bits 6-7 of the clock_seq_hi_and_reserved to 01
  s[8] = s[13] = s[18] = s[23] = '-'

  var uuid = s.join('')
  return uuid
}


export const funEval = (value) => {
  return new Function('return ' + value + ';')()
}

export const getFunction = (fun, def) => {
  if (!validatenull(fun)) {
    try {
      return funEval(fun)
    } catch {
      return () => {}
    }
  } else if (def) return () => {}
}
export const getJson = (str) => {
  if (validatenull(str)) return {}
  else if (typeof str == 'string') {
    try {
      return JSON.parse(str)
    } catch {
      return {}
    }
  } else {
    return str
  }
}
export const checkUrl = (url) => {
  var reg = /http(s)?:\/\/([\w-.]+)+(:[0-9]+)?.*$/
  if (!reg.test(url)) {
    return false
  } else {
    return true
  }
}
export function isNumber(val) {
  if (parseFloat(val).toString() == 'NaN') {
    return false
  } else {
    return true
  }
}

// 获取画布导出的数据
export function getExportData(store) {
  // 获取URL中的参数
  const queryParams = new URLSearchParams(new URL(window.location.href).search)
  const urlParams = {}
  queryParams.forEach((value, key) => {
    urlParams[key] = value
  })
  var stageData= JSON.parse( window.kdt.state.stage.toJSON())
    stageData.children=stageData.children.map((item) => {
        // 过滤掉变换框和选择框
        item.children = item.children.filter((child) => child.className!=='Transformer' && child.attrs.name!=='transformerSelectionRect') 
        return item
   })
  return {
    stage: JSON.stringify( stageData),
    http: store.state.stage.http,
    filters: store.state.stage.filters,
    variables: store.state.stage.variables,
    systemConfig: store.state.stage.systemConfig,
    queryParams: urlParams
  }
}

/**
 * 更新浏览器标题
 * @param {string} name - 要显示在标题中的名称
 * @param {string} suffix - 标题后缀
 */
export function updateDocumentTitle(name, suffix = '云组态') {
  if (name && name.trim()) {
    document.title = `${name} - ${suffix}`
  } else {
    document.title = suffix
  }
}

export function getAssetPath(path) {
  // 获取基础 URL 并确保其有效性
  const baseUrl = import.meta.env.VITE_APP_BASE_URL || '/'
  // 标准化传入的路径（确保以 '/' 开头）
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  // 如果路径已经包含完整的前缀，则直接返回
  if (normalizedPath.includes(baseUrl) && baseUrl !== '/') {
    return normalizedPath
  }
  // 标准化基础 URL（确保以 '/' 结尾）
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  // 移除路径开头的 '/'（因为 normalizedBaseUrl 已经有结尾的 '/'）
  const pathWithoutLeadingSlash = normalizedPath.substring(1)
  // 拼接并返回完整路径
  return `${normalizedBaseUrl}${pathWithoutLeadingSlash}`
}

// 过滤循环引用
export const removeCircular = (obj) => {
  const seen = new WeakSet()
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]'
      }
      seen.add(value)
    }
    return value
  })
}

// 深拷贝函数，跳过循环引用
export const safeDeepClone = (obj, hash = new WeakMap()) => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj)
  if (obj instanceof Array) return obj.map((item) => safeDeepClone(item, hash))
  if (hash.has(obj)) return {} // 遇到循环引用返回空对象

  hash.set(obj, true)
  const cloneObj = {}
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloneObj[key] = safeDeepClone(obj[key], hash)
    }
  }
  return cloneObj
}
export const safeStringify = (obj) => {
  const seen = new WeakSet()
  return JSON.stringify(obj, (key, val) => {
    if (val != null && typeof val === 'object') {
      if (seen.has(val)) {
        return '[Circular]'
      }
      seen.add(val)
    }
    return val
  })
}
