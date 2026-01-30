/**
 * 画布默认配置参数
 */

const stageConfig = {
  stageHeight: 1080,
  name:'新画布',
  stageWidth: 1920,
  allowMobileRotation: true, // 默认允许移动端旋转
  stageBackgroundColor: 'rgb(255, 255, 255)',
  gridColor: 'red',
  gridWidth: 50,
  gridSwich: false,
  cssCode: '',
  jsCode: '',
  scaleMethod: 'fill',
  disableStageScale: false,
  predefineColors: [
    '#000',
    '#fff',
    '#ffd700',
    '#90ee90',
    '#00ced1',
    '#1e90ff',
    '#c71585',
    'rgba(255, 69, 0, 0.68)',
    'rgb(255, 120, 0)',
    'hsv(51, 100, 98)',
    'hsva(120, 40, 94, 0.5)',
    'hsl(181, 100%, 37%)',
    'hsla(209, 100%, 56%, 0.73)',
    '#c7158577'
  ]
}
export default stageConfig
