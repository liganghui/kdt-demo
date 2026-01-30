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

// Get canvas export data
export function getExportData(store) {
  // GetURLParameters in
  const queryParams = new URLSearchParams(new URL(window.location.href).search)
  const urlParams = {}
  queryParams.forEach((value, key) => {
    urlParams[key] = value
  })
  var stageData= JSON.parse( window.kdt.state.stage.toJSON())
    stageData.children=stageData.children.map((item) => {
        // Filter out transform boxes and selection boxes
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
 * Update browser title
 * @param {string} name - Name to be displayed in the title
 * @param {string} suffix - Title suffix
 */
export function updateDocumentTitle(name, suffix = 'Cloud Configuration') {
  if (name && name.trim()) {
    document.title = `${name} - ${suffix}`
  } else {
    document.title = suffix
  }
}

export function getAssetPath(path) {
  // Get basic URL and ensure its validity
  const baseUrl = import.meta.env.VITE_APP_BASE_URL || '/'
  // Normalize the incoming path（Ensure it starts with '/' Start）
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  // If the path already contains the complete prefix，Then return directly
  if (normalizedPath.includes(baseUrl) && baseUrl !== '/') {
    return normalizedPath
  }
  // Normalize the basic URL（Ensure it ends with '/' End）
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  // Remove the leading '/'（Because normalizedBaseUrl Already has a trailing '/'）
  const pathWithoutLeadingSlash = normalizedPath.substring(1)
  // Concatenate and return the complete path
  return `${normalizedBaseUrl}${pathWithoutLeadingSlash}`
}

// Filter circular references
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

// Deep copy function，Skip circular references
export const safeDeepClone = (obj, hash = new WeakMap()) => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj)
  if (obj instanceof Array) return obj.map((item) => safeDeepClone(item, hash))
  if (hash.has(obj)) return {} // Return an empty object when encountering circular references

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
