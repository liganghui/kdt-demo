 export const ENV_CONFIG = {
  // Environment Judgment Function
  isDEV: () => import.meta.env.DEV,
  isPROD: () => import.meta.env.PROD,
};

// Export Common Environment Judgments
export const { isDevelopment, isProduction } = ENV_CONFIG;

export default  ENV_CONFIG