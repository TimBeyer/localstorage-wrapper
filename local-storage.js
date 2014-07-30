var _ = require('lodash');
var storage = window.localStorage;

var prefix = 'localstorage:';
var expiryKey = 'expiries';

var isJSON = function (str) {
    try {
        JSON.parse(str);
    }
    catch (e) {
        return false;
    }
    return true;
};

var isNumeric = function (str) {
    return !isNaN(str);
};

var expireKeys = function () {
    if (localStorageWrapper.has(expiryKey)) {
        var expiries = localStorageWrapper.get(expiryKey);
        var currentTimestamp = Date.now();

        var toBeExpired = _.first(expiries, function (expiry) {
            return expiry.timestamp <= currentTimestamp;
        });

        if (_.isEmpty(toBeExpired)) {
            return;
        }

        var toBeKept = _.last(expiries, function (expiry) {
            return expiry.timestamp > currentTimestamp;
        });

        _.each(toBeExpired, function (expiry) {
            localStorageWrapper.remove(expiry.key);
        });

        localStorageWrapper.set(expiryKey, toBeKept);
    }
};

var localStorageWrapper = {
    set: function (key, value) {
        key = prefix + key;
        if (_.isArray(value) || _.isPlainObject(value)) {
            storage.setItem(key, JSON.stringify(value));
        }
        else {
            storage.setItem(key, value);
        }
    },
    get: function (key) {
        key = prefix + key;
        var data = storage.getItem(key);
        if (isJSON(data)) {
            return JSON.parse(data);
        }
        else if (isNumeric(data)) {
            return parseFloat(data);
        }
        else {
            return data;
        }
    },
    has: function (key) {
        key = prefix + key;
        return storage.getItem(key) !== null;
    },
    expire: function (key, msFromNow) {
        var now = Date.now();
        var expiry = now + msFromNow;
        localStorageWrapper.expireAt(key, expiry);
    },
    expireAt: function (key, timestamp) {
        var expiries = localStorageWrapper.has(expiryKey) ? localStorageWrapper.get(expiryKey) : [];

        var expiryInfo = {
            timestamp: timestamp,
            key: key
        };

        // Since the list is sorted by timestamps, use binary search
        // to find insertion point instead of pushing and re-sorting
        var insertIndex = _.sortedIndex(expiries, expiryInfo, 'timestamp');
        expiries.splice(insertIndex, 0, expiryInfo);

        localStorageWrapper.set(expiryKey, expiries);
    },
    remove: function (key) {
        key = prefix + key;
        storage.removeItem(key);
    },
    clear: function () {
        storage.clear();
    },
    isEmpty: function () {
        return storage.length === 0;
    }
};

module.exports = {
    set: localStorageWrapper.set,
    get: function (key) {
        expireKeys();
        return localStorageWrapper.get(key);
    },
    has: function (key) {
        expireKeys();
        return localStorageWrapper.has(key);
    },
    expire: localStorageWrapper.expire,
    expireAt: localStorageWrapper.expireAt,
    remove: localStorageWrapper.remove,
    clear: localStorageWrapper.clear,
    isEmpty: localStorageWrapper.isEmpty
};