var _self = this;
var HOST_NAME = location.href.split('service-worker.js')[0];
var VERSION_NAME = 'CACHE-v1';
var CACHE_NAME = HOST_NAME + '-' + VERSION_NAME;
var CACHE_HOST = [HOST_NAME];
var SUBSCRIBE_API = '/publish/subscribe';

var sentMessage = function(msg) {
	_self.clients.matchAll().then(function(clients) {
		clients.forEach(function(client) {
			client.postMessage(msg);
		});
	});
};

var onInstall = function(event) {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then(function() { _self.skipWaiting(); })
			.then(function() { console.log('Install success'); })
	);
};

var onActive = function(event) {
	event.waitUntil(
		caches
			.keys()
			.then(function(cacheNames) {
				return Promise.all(
					cacheNames.map(function(cacheName) {
						// Remove expired cache response
						if (CACHE_NAME.indexOf(cacheName) === -1) {
							return caches.delete(cacheName);
						}
					})
				);
			})
			.then(function() {
				_self.clients.claim();
			})
	);
};

var onMessage = function(event) {
	console.log(event.data);

	event.ports[0].postMessage('Hi, buddy.');
};

var isNeedCache = function(req) {
	var { method, url } = req;
	return method.toUpperCase() === 'GET' && CACHE_HOST.some(function(host) {
		return url.search(host) !== -1;
	});
};

var isCORSRequest = function(url, host) {
	return url.search(host) === -1;
};

var isValidResponse = function(response) {
	return response && response.status >= 200 && response.status < 400;
};

var handleFetchRequest = function(req) {
	if (isNeedCache(req)) {
		var request = isCORSRequest(req.url, HOST_NAME) ? new Request(req.url, {mode: 'cors'}) : req;
		return caches.match(request)
			.then(function(response) {
				// Cache hit - return response directly
				if (response) {
					// Update Cache for next time enter
					fetch(request)
						.then(function(response) {

							// Check a valid response
							if (isValidResponse(response)) {
								caches
									.open(CACHE_NAME)
									.then(function(cache) {
										cache.put(request, response);
									});
							} else {
								sentMessage('Update cache ' + request.url + ' fail: ' + response.message);
							}
						})
						.catch(function(err) {
							sentMessage('Update cache ' + request.url + ' fail: ' + err.message);
						});
					return response;
				}

				// Return fetch response
				return fetch(request)
					.then(function(response) {
						// Check if we received an valid response
						if (isValidResponse(response)) {
							var clonedResponse = response.clone();

							caches
								.open(CACHE_NAME)
								.then(function(cache) {
									cache.put(request, clonedResponse);
								});
						}

						return response;
					});
			});
	} else {
		return fetch(req);
	}
};

var onFetch = function(event) {
	event.respondWith(handleFetchRequest(event.request));
};

var onPush = function(event) {
	var payload = event.data ? event.data.text() : '{}';
	var { body, link } = JSON.parse(payload);

	event.waitUntil(_self.registration.showNotification('New Post Arrival', {
		body,
		data: link,
		icon: '/assets/img/logo/size-48.png'
	}));
};

var encodeStr = str => btoa(String.fromCharCode.apply(null, new Uint8Array(str)));
var getEncodeSubscriptionInfo = (subscription, type) => subscription.getKey ? encodeStr(subscription.getKey(type)) : '';
var onPushSubscriptionChange = function(event) {
	event.waitUntil(
		_self.registration.pushManager.subscribe({ userVisibleOnly: true })
			.then(function(subscription) {
				var endpoint = subscription.endpoint;
				var p256dh = getEncodeSubscriptionInfo(subscription, 'p256dh');
				var auth = getEncodeSubscriptionInfo(subscription, 'auth');

				var clientSubscription = { endpoint, keys: { p256dh, auth } };

				var options = {
					method: 'post',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(clientSubscription)
				};

				return fetch(SUBSCRIBE_API, options);
			})
	);
};

var onNotificationClick = function(event) {
	event.notification.close();

	event.waitUntil(clients.openWindow(event.notification.data));
};

_self.addEventListener('install', onInstall);

_self.addEventListener('activate', onActive);

_self.addEventListener('message', onMessage);

_self.addEventListener('fetch', onFetch);

// _self.addEventListener('push', onPush);

// _self.addEventListener('notificationclick', onNotificationClick);

// _self.addEventListener('pushsubscriptionchange', onPushSubscriptionChange);
