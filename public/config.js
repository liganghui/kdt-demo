/**
 * 应用程序配置文件
 * 根据环境设置 API URL
 */

(function() {
    // 环境配置
    const environments = {
      development: {
        apiBaseUrl: '',
        imageUrlPrefix:'',
      },
      production: {
        apiBaseUrl: '',
        imageUrlPrefix:''
      },
    };
  
    // 当前环境（构建时会自动替换）
    let currentEnvironment;
    try {
        currentEnvironment = __VITE_MODE__ || 'development';
    } catch (e) {
        // 如果变量未定义，默认使用开发环境
        currentEnvironment = 'development';
    }
  
    // 获取当前环境的配置，确保环境配置存在
    const envConfig = environments[currentEnvironment] || environments.development;
  
    // 创建全局配置对象
    window.appConfig = {
      apiBaseUrl: envConfig.apiBaseUrl,
      imageUrlPrefix: envConfig.imageUrlPrefix

    };
  })();