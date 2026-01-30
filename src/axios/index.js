import { checkUrl } from '@/utils/utils'
import axios from 'axios'
const token = {
  Authorization: 'Bearer ' +localStorage.getItem('Authorization')
}
window.$glob = {
  url: window.appConfig?.apiBaseUrl || '',
  params: {},
  query: {},
  header: {
    Authorization: token.Authorization
  }
}
function getGlobParams() {
  var query = window.location.search.substring(1)
  query = query.split('&')
  query.forEach((ele) => {
    var pair = ele.split('=')
    window.$glob.params[pair[0]] = pair[1]
  })
}
getGlobParams()
axios.defaults.timeout = 30000
//返回其他状态吗
axios.defaults.validateStatus = function (status) {
  return status >= 200 && status <= 500 // 默认的
}
//跨域请求，允许保存cookie
// axios.defaults.withCredentials = true
axios.interceptors.request.use(
  (config) => {
    if (!checkUrl(config.url)) config.url = window.$glob.url + config.url
    let header = window.$glob.header || {}
    config.headers = { ...config.headers, ...header }
    let data = window.$glob.query || {}
    let key
    if (['get', 'delete'].includes(config.method)) {
      key = 'params'
    } else if (['post', 'put'].includes(config.method)) {
      key = 'data'
    }
    if (typeof config[key] === 'object') {
      config[key] = Object.assign(config[key] || {}, data)
    }
    if (config.headers.proxy) {
      let headers = {}
      for (let ele in config.headers) {
        if (typeof config.headers[ele] !== 'object') headers[ele] = config.headers[ele]
      }
      let form = {
        url: config.url,
        method: config.method,
        headers: headers
      }
      form[key] = config[key]
      config.url = window.$website.url + '/visual/proxy'
      config.method = 'post'
      config.data = form
    }
    if (config.headers && !config.headers.Authorization) {
      config.headers.Authorization = token.Authorization
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)
//HTTPrequest拦截
axios.interceptors.response.use(
  (config) => {
    return config.status === 200 ? config.data : config
  },
  (error) => {
    return Promise.reject(new Error(error))
  }
)

export default axios
