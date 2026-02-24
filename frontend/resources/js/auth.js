/**
 * Auth Module - Handles authentication token management
 * This module provides functions to manage the JWT token stored in localStorage
 */

const AuthModule = {
    TOKEN_STORAGE_KEY: 'authToken',
    EMAIL_STORAGE_KEY: 'authEmail',
    API_BASE_URL: 'http://localhost:3000',

    /**
     * Get the stored authentication token
     * @returns {string|null} The JWT token or null if not logged in
     */
    getToken() {
        return localStorage.getItem(this.TOKEN_STORAGE_KEY);
    },

    /**
     * Get the stored email
     * @returns {string|null} The user's email or null
     */
    getEmail() {
        return localStorage.getItem(this.EMAIL_STORAGE_KEY);
    },

    /**
     * Check if user is logged in
     * @returns {boolean} True if token exists
     */
    isLoggedIn() {
        return this.getToken() !== null;
    },

    /**
     * Store authentication token
     * @param {string} token - JWT token
     */
    setToken(token) {
        localStorage.setItem(this.TOKEN_STORAGE_KEY, token);
    },

    /**
     * Store email
     * @param {string} email - User's email
     */
    setEmail(email) {
        localStorage.setItem(this.EMAIL_STORAGE_KEY, email);
    },

    /**
     * Clear authentication data (logout)
     */
    clear() {
        localStorage.removeItem(this.TOKEN_STORAGE_KEY);
        localStorage.removeItem(this.EMAIL_STORAGE_KEY);
    },

    /**
     * Make an authenticated API request
     * @param {string} endpoint - API endpoint (without base URL)
     * @param {object} options - Fetch options
     * @returns {Promise<Response>} Fetch response
     */
    async authenticatedFetch(endpoint, options = {}) {
        const token = this.getToken();
        
        if (!token) {
            throw new Error('Not authenticated');
        }

        const headers = {
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };

        return fetch(`${this.API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });
    },

    /**
     * Logout from the server
     * @returns {Promise<boolean>} True if logout successful
     */
    async logout() {
        try {
            const response = await this.authenticatedFetch('/auth/logout', {
                method: 'POST'
            });

            if (response.ok) {
                this.clear();
                return true;
            }
        } catch (error) {
            console.error('Logout error:', error);
        }

        // Clear token even if logout fails
        this.clear();
        return false;
    },

    /**
     * Redirect to login if not authenticated
     */
    requireAuth() {
        if (!this.isLoggedIn()) {
            window.location.href = 'sign-in.php';
        }
    }
};

// Export for module usage if in a module context
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthModule;
}
