 export const ENV_CONFIG = {
  // 环境判断函数
  isDEV: () => import.meta.env.DEV,
  isPROD: () => import.meta.env.PROD,
};

// 导出常用的环境判断
export const { isDevelopment, isProduction } = ENV_CONFIG;

export default  ENV_CONFIG