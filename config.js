/**
 * Dynamic Configuration for Backend URLs
 * Automatically detects environment and sets appropriate backend URLs
 */

class AppConfig {
    constructor() {
        this.environment = this.detectEnvironment();
        this.config = this.getEnvironmentConfig();
    }

    /**
     * Detect the current environment based on hostname and other factors
     */
    detectEnvironment() {
        const hostname = window.location.hostname;

        // Development environment detection
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('local')) {
            return 'development';
        }

        // Staging environment detection (customize these patterns for your staging URLs)
        if (hostname.includes('staging') || hostname.includes('dev') || hostname.includes('test')) {
            return 'staging';
        }

        // Production environment (everything else)
        return 'production';
    }

    /**
     * Get configuration based on detected environment
     */
    getEnvironmentConfig() {
        const configs = {
            development: {
                apiUrl: 'http://localhost:2080/api/v1/sso-service',
                baseUrl: 'http://localhost:2080',
                debug: true
            },
            staging: {
                apiUrl: 'https://ia-idp-backend.onrender.com/api/v1/sso-service',
                baseUrl: 'https://ia-idp-backend.onrender.com',
                debug: true
            },
            production: {
                apiUrl: 'https://ia-idp-backend.onrender.com/api/v1/sso-service',
                baseUrl: 'https://ia-idp-backend.onrender.com',
                debug: false
            }
        };

        return configs[this.environment];
    }

    /**
     * Get the API URL for the current environment
     */
    getApiUrl() {
        return this.config.apiUrl;
    }

    /**
     * Get the base URL for the current environment
     */
    getBaseUrl() {
        return this.config.baseUrl;
    }


    /**
     * Get the current environment name
     */
    getEnvironment() {
        return this.environment;
    }

    /**
     * Check if debug mode is enabled
     */
    isDebugMode() {
        return this.config.debug;
    }

    /**
     * Get the redirect URI for the current environment
     */
    getRedirectUri() {
        return window.location.origin;
    }

    /**
     * Override configuration programmatically (useful for testing)
     */
    override(overrides) {
        this.config = { ...this.config, ...overrides };
        if (this.config.debug) {
            console.log('Configuration overridden:', overrides);
        }
    }

    /**
     * Log current configuration (only in debug mode)
     */
    logConfig() {
        if (this.config.debug) {
            console.log('Current Environment:', this.environment);
            console.log('Configuration:', {
                apiUrl: this.config.apiUrl,
                baseUrl: this.config.baseUrl,
                debug: this.config.debug
            });
        }
    }
}

// Create global configuration instance
window.AppConfig = new AppConfig();

// Log configuration in debug mode
window.AppConfig.logConfig();

// Export for module systems (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppConfig;
}
