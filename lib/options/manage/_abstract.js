/**
 * @file the abstract management class
 */

/**
 * Management Options
 * @constructor
 * @abstract
 */
function ManagementOptionsAbstract() {

    /**
     * The get request type
     * @type {string}
     */
    const REQUEST_TYPE_GET = 'get';

    /**
     * The API Url for this type of Option request
     * @type {string}
     */
    var apiBaseURL = 'https://manageapi.imoneza.com';

    /**
     * The API's Key
     * @type {string}
     */
    var accessKey = '';

    /**
     * Override the API key
     * @param url
     * @returns {ManagementOptionsAbstract}
     */
    this.setApiBaseURL = function(url) {
        apiBaseURL = url;
        return this;
    };

    /**
     * Get the API key
     * @returns {string}
     */
    this.getApiBaseURL = function() {
        return apiBaseURL;
    };

    /**
     * Sets the API Access Key
     * @param key
     * @returns {ManagementOptionsAbstract}
     */
    this.setAccessKey = function(key) {
        accessKey = key;
        return this;
    };

    /**
     * Get API Access Key
     * @returns {string}
     */
    this.getAccessKey = function() {
        return accessKey;
    };

    /**
     * Get the request type
     * @returns {string}
     */
    this.getRequestType = function() {
        return REQUEST_TYPE_GET;
    };

    this.getEndPoint = function() {
        throw new Error('This is an abstract method.');
    }
};

module.exports = ManagementOptionsAbstract;