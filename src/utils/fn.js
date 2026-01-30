
export const formatNumber = (value, decimalPlaces) => {
  if (value === '') {
    return
  }
  // 将值转换为浮点数，并保留指定的小数位
  let formattedValue = parseFloat(value).toFixed(decimalPlaces)
  return parseFloat(formattedValue)
}

export function  isBase64(str) {
    const base64Regex = /^[A-Za-z0-9+/=]+$/
    return base64Regex.test(str) && str.length % 4 === 0
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

// 将Base64编码的字符串解码成UTF-8编码的字符串
export function  decodeBase64(base64Str) {
    try {
      const binaryStr = atob(base64Str)
      const len = binaryStr.length
      const bytes = new Uint8Array(len)
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i)
      }
      const decodedStr = new TextDecoder('utf-8').decode(bytes)
      return decodedStr
    } catch (e) {
      console.error('Invalid Base64 string', e)
      return null
    }
  }