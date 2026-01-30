/**
 * 
 * Set API URL based on environment
 */

(function() {
    // Environment configuration
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
  
    // Current environment (will be automatically replaced during build)
    let currentEnvironment;
    try {
        currentEnvironment = __VITE_MODE__ || 'development';
    } catch (e) {
        // If variable is undefined, default to development environment
        currentEnvironment = 'development';
    }
  
    // Get configuration for current environment, ensure environment config exists
    const envConfig = environments[currentEnvironment] || environments.development;
  
    // Create global configuration object
    window.appConfig = {
      apiBaseUrl: envConfig.apiBaseUrl,
      imageUrlPrefix: envConfig.imageUrlPrefix

    };
  })();