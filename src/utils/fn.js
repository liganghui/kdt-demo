
export const formatNumber = (value, decimalPlaces) => {
  if (value === '') {
    return
  }
  // Convert the value to a floating-point number，And retain the specified number of decimal places
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
        // Note here Put clearTimeout Put into to execute internally
        clearTimeout(timerId)
        timerId = null
  
        callback.apply(context, args)
      }, wait)
    }
  
    // Return a closure
    return throttled
  }

// ConvertBase64encoded string intoUTF-8encoded string
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