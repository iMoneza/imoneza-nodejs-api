/**
 * @file the Connection object
 */

var ManagementOptionsAbstract = require('./options/management/_abstract'),
    moment = require('moment'),
    crypto = require('crypto'),
    request = require('request');

/**
 * Failure in authentication
 * @param message
 * @constructor
 */
function AuthenticationFailureError(message) {
    this.message = message || "";
}
AuthenticationFailureError.prototype = Error.prototype;

/**
 * Failure in access
 * @param message
 * @constructor
 */
function AccessDeniedError(message) {
    this.message = message || "";
}
AccessDeniedError.prototype = Error.prototype;

/**
 * 404 Not Found error
 * @param message
 * @constructor
 */
function NotFoundError(message) {
    this.message = message || "";
}
NotFoundError.prototype = Error.prototype;

/**
 * Connection object
 *
 * @param manageApiKey
 * @param manageApiSecret
 * @param accessApiKey
 * @param accessApiSecret
 * @param logger
 * @constructor
 */
var Connection = function(manageApiKey, manageApiSecret, accessApiKey, accessApiSecret, logger) {
    var manageApi = {
        key: manageApiKey,
        secret: manageApiSecret
    },
    accessApi = {
        key: accessApiKey,
        secret: accessApiSecret
    },
    log = logger,
    userRequestCallback;

    /**
     * Request method
     *
     * @param options
     * @param callback(err, dataObject)
     */
    this.request = function(options, callback) {
        if (!(options instanceof ManagementOptionsAbstract)) {
            throw new Error('Please pass in a Management Options object.');
        }

        userRequestCallback = (typeof callback === 'function') ? callback : function() {};

        var keys = (options instanceof ManagementOptionsAbstract) ? manageApi : accessApi;
        options.setAccessKey(keys.key);

        var endPoint = options.getEndPoint(),
            requestType = options.getRequestType();

        var url = options.getApiBaseURL() + endPoint;
        log.debug("URL: " + url);

        var timestamp = moment().utc().format('ddd, DD MMM YYYY HH:mm:ss ') + 'GMT';
        var tokenValues = [
            requestType.toUpperCase(),
            timestamp,
            endPoint.toLowerCase(),
            ''
        ];
        log.debug({tokenValues: tokenValues}, 'Token values');

        var tokenValuesString = tokenValues.join("\n");
        var hmac = crypto.createHmac('sha256', keys.secret);
        hmac.update(tokenValuesString);
        var token = hmac.digest('base64');
        log.debug("Token created: " + token);

        var authentication = keys.key + ":" + token;
        log.info("About to send to " + url + " via " + requestType + " with options of " + options.constructor.name);

        var requestOptions = {
            url: url,
            method: requestType,
            headers: {
                "Content-type": "application/json",
                "Accept": "application/json",
                "Authentication": authentication,
                "Timestamp": timestamp
            }
        };
        request(requestOptions, connectionRequestCallback);
        log.debug("Request has been submitted");
    };

    function connectionRequestCallback(error, response, body) {

        if (error) {
            log.error(error);
            return userRequestCallback(new Error(error));
        }

        log.debug({response: response}, "Response received.");

        // handle errors
        switch (response.statusCode) {
            case 200:
                // let this fall through
                break;

            case 401:
                log.debug({type: "AuthenticationFailureError", body: body}, "Error sent to user callback.");
                return userRequestCallback(new AuthenticationFailureError(body));
                break;

            case 403:
                log.debug({type: "AccessDeniedError", body: body}, "Error sent to user callback.");
                return userRequestCallback(new AccessDeniedError(body));
                break;

            case 404:
                log.debug({type: "NotFoundError", body: body}, "Error sent to user callback.");

                //sometimes it's a json string, sometimes it's not... so there's that.
                var errorString = '';
                if (body.charAt(0) === '{') {
                    var errorObject = JSON.parse(body);
                    errorString = errorObject.Message;
                }
                else {
                    errorString = body;
                }
                return userRequestCallback(new NotFoundError(errorString));
                break;
            default:
                log.debug({type: "Error", body: body}, "Error sent to user callback.");
                return userRequestCallback(new Error("Status Code: " + response.statusCode + ": " + body));
        }

        log.debug("All error checking passed, has successful response.");

        // do user clalback success with data object
    }
};



module.exports = Connection;