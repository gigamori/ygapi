/**
 * Yanai Google API client library.
 * @class
 * @classdesc Very very simple Google API client class.
 * @author Takamichi Yanai / http://marketechlabo.com
 */

'use strict;'

/**
 * @constructor
 * @param {string} strClientId - Client id.
 * @param {string} strClientSecret - Client secret.
 * @param {string} strRedirectUrl - Callback URL.
 * @param {string} strScope - Scope.
 */
Ygapi = function (strClientId, strClientSecret, strRedirectUrl, strScope){

	if (strClientId === undefined && localStorage.getItem('strClientId') === null){
		throw 'argument missing.';
	}else{
		this.strClientId = strClientId || localStorage.getItem('strClientId');
	}
	if (strClientSecret === undefined && localStorage.getItem('strClientSecret') === null){
		throw 'argument missing.';
	}else{
		this.strClientSecret = strClientSecret || localStorage.getItem('strClientSecret');
	}
	if (strRedirectUrl === undefined && localStorage.getItem('strRedirectUrl') === null){
		throw 'argument missing.';
	}else{
		this.strRedirectUrl = strRedirectUrl || localStorage.getItem('strRedirectUrl');
	}
	if (strScope === undefined && localStorage.getItem('strScope') === null){
		throw 'argument missing.';
	}else{
		this.strScope = strScope || localStorage.getItem('strScope');
	}

/*
	this.strAuthCode = localStorage.getItem('strAuthCode') || '';
	this.strAccessToken = localStorage.getItem('strAccessToken') || '';
	this.strRefreshToken = localStorage.getItem('strRefreshToken') || '';
*/
}

/**
 * Pseudo constant values.
 * @constant
 */

Ygapi.INT_INTERVAL_AUTHCHECK = 1000;	// millisec

// Google
Ygapi.STR_AUTH_URL = 'https://accounts.google.com/o/oauth2/auth';
Ygapi.STR_POSTMESSAGE_RELAY_URL = 'https://accounts.google.com/o/oauth2/postmessageRelay';
Ygapi.STR_X_ORIGIN = 'https://accounts.google.com';
Ygapi.STR_TOKEN_ACQUIRE_URL = 'https://www.googleapis.com/oauth2/v3/token';
Ygapi.STR_TOKEN_VALIDATION_URL = 'https://www.googleapis.com/oauth2/v1/tokeninfo';
Ygapi.STR_API_ROOT = 'https://www.googleapis.com';

// Pseudo private methods using prototype to save memory.
Ygapi.prototype._ae = function (el, type, fn){
	if (el.addEventListener) {
		el.addEventListener(type, fn, false);
		el._ecnt = (el._ecnt) ? el.ecnt++ : 1;
	} else if(el.attachEvent) {
		el.attachEvent('on' + type, fn);
		el._ecnt = (el._ecnt) ? el.ecnt++ : 1;
	}
}

Ygapi.prototype._re = function (el, type, fn){
	if (el.removeEventListener) {
		el.removeEventListener(type, fn, false);
		el._ecnt = (el._ecnt) ? el.ecnt-- : 0;
	} else if(el.detachEvent) {
		el.detachEvent('on' + type, fn);
		el._ecnt = (el._ecnt) ? el.ecnt-- : 0;
	}
}

Ygapi.prototype._json2query = function (js){
	var result = '';
	for(key in js) {
	    result += key + '=' + js[key] + '&';
	}
	return result.slice(0, result.length - 1); 
}

// http://www.html5rocks.com/en/tutorials/cors/
Ygapi.prototype._createCORSRequest = function (method, url) {
	var oReq = new XMLHttpRequest();
	if ("withCredentials" in oReq) {

		// Check if the XMLHttpRequest object has a "withCredentials" property.
		// "withCredentials" only exists on XMLHTTPRequest2 objects.
		oReq.open(method, url, true);

	} else if (typeof XDomainRequest != "undefined") {

		// Otherwise, check if XDomainRequest.
		// XDomainRequest only exists in IE, and is IE's way of making CORS requests.
		oReq = new XDomainRequest();
		oReq.open(method, url);

	} else {

		// Otherwise, CORS is not supported by the browser.
		oReq = null;

	}
	return oReq;
}

// Public methods.
/**
 * Get auth code or access token directly.
 * @method
 * @param {node} elButton - Element to add event listener. Probably this should be anchor or button.
 * @param {function} callback - Callback function that called when auth-code (or access token) is returned. The auth-code (or access token) is passed as a parameter.
 * @param {string} strResponseType - 'code'(default) or 'token'.
 * @param {string} strRedirectUrl - Callback URL.
 * @param {string} strScope - Scope.
 * @param {string} strClientId - Client id.
 */
Ygapi.prototype.getAuthCode = function (elButton, callback, strResponseType, strRedirectUrl, strScope, strClientId){

	if(elButton === undefined || callback === undefined){
		throw 'argument missing.';
	}

	// 'token' or else = 'code'.
	strResponseType = (strResponseType == 'token') ? 'token' : 'code';
	strRedirectUrl = strRedirectUrl || this.strRedirectUrl;
	strScope = strScope || this.strScope;
	strClientId = strClientId || this.strClientId;

	var strUrl = Ygapi.STR_AUTH_URL
	+ '?response_type=' + strResponseType
	+ '&client_id=' + strClientId
	+ '&scope=' + encodeURIComponent(strScope)
	+ '&redirect_uri=' + encodeURIComponent(strRedirectUrl);

	strUrl += (strResponseType == 'code') ? '&access_type=offline&approval_prompt=force' : '';
	strUrl += (strRedirectUrl == 'postmessage') ? '&origin=' + encodeURIComponent(window.location.protocol + '//' + window.location.host) : '';

	if(!elButton._ecnt){
		if(strRedirectUrl == 'postmessage'){
			var frameExists = false;
			if (document.getElementsByTagName('iframe')){
				var elsif = document.getElementsByTagName('iframe');
				for (i=0; i<elsif.length; i++){
					if(elsif[i].src.indexOf('accounts.google.com') > -1){
						frameExists = true;
					}
					if(frameExists){
						break;
					}
				}
			}
			if(!frameExists){
				var elif = document.createElement('iframe');
				elif.src = Ygapi.STR_POSTMESSAGE_RELAY_URL + '?parent=' + encodeURIComponent(window.location.protocol + '//' + window.location.host);
				elif.style.width = "1px";
				elif.style.height = "1px";
				elif.style.position = "absolute";
				elif.style.top = "-100px";
				document.getElementsByTagName('body')[0].appendChild(elif);
			}
		}
		this._ae(elButton, 'click', function(){
			try{
				handleWindow(strUrl, callback, strResponseType);
			}catch(e){
				throw e;
			}
		});
	}

	function handleWindow(strUrl, callback, strResponseType){

		var c = Math.min(650, window.screen.width - 20), f = Math.min(600, window.screen.height - 30);
		var popup = window.open(strUrl, "_blank", "toolbar=no,location=yes,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,copyhistory=no,width=" + c + ",height=" + f + ",top=" + (window.screen.height - f) / 2 + ",left=" + (window.screen.width - c) / 2);
		var hI = window.setInterval(waitAuthReturn, Ygapi.INT_INTERVAL_AUTHCHECK);

		function waitAuthReturn(){
			if(popup.closed){
				window.clearInterval(hI);
			}else if(popup === null){
				window.clearInterval(hI);
			}else{
				strResponseType = (strResponseType == 'token') ? 'access_token' : strResponseType;

				if(strRedirectUrl == 'postmessage'){
					Ygapi.prototype._ae(window, 'message', function(x){
						if(x.origin == Ygapi.STR_X_ORIGIN){
							var strHref = JSON.parse(x.data).a[0];
							var strReturn = strHref.substring(strHref.indexOf(strResponseType + '=') + strResponseType.length + 1, strHref.length);
							strReturn = strReturn.substring(0, strReturn.search(/([&#]|$)/));
							callback(strReturn);
						}
					});
				}else if(popup.location.href.indexOf(strResponseType + '=') > -1){
					window.clearInterval(hI);
					var strHref = popup.location.href; // string by ref.
					var strReturn = strHref.substring(strHref.indexOf(strResponseType + '=') + strResponseType.length + 1, strHref.length);
					strReturn = strReturn.substring(0, strReturn.search(/([&#]|$)/));
					popup.close();
					callback(strReturn);
				}

			}
		}

	}

}

/**
 * Get token (access/refresh).
 * @method
 * @param {string} strAuthcode - Auth-code.
 * @param {function} callback - Callback function that called when tokens are returned. The tokens are passed as parameters. The first is access token, and the second is refresh token.
 * @param {string} strRedirectUrl - Callback URL.
 * @param {string} strClientId - Client id.
 * @param {string} strClientSecret - Client secret.
 */
Ygapi.prototype.getToken = function (strAuthcode, callback, strRedirectUrl, strClientId, strClientSecret){

	if(strAuthcode === undefined || callback === undefined){
		throw 'argument missing.';
	}
	strRedirectUrl = strRedirectUrl || this.strRedirectUrl;
	strClientId = strClientId || this.strClientId;
	strClientSecret = strClientSecret || this.strClientSecret;

	var strParams = 'grant_type=authorization_code'
	+ '&code=' + strAuthcode
	+ '&client_id=' + strClientId
	+ "&client_secret=" + strClientSecret
	+ '&redirect_uri=' + encodeURIComponent(strRedirectUrl);

	var oReq = this._createCORSRequest('POST', Ygapi.STR_TOKEN_ACQUIRE_URL);
	if (!oReq) {
		throw 'CORS not supported';
	}else{
		oReq.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		oReq.onreadystatechange = function(){
			if (oReq.readyState == 4){
				if (oReq.status == 200){
					var oRes = JSON.parse(oReq.responseText);
					callback(oRes['access_token'], oRes['refresh_token']);
				}else{
					throw oReq.status;
				}
			}
		}
		oReq.send(strParams);
	}
}

/**
 * Validate token.
 * @method
 * @param {string} strAccessToken - Access token to validate.
 * @param {function} callbackValid - Callback function that called when token is valid. The token is passed as a parameter.
 * @param {function} callbackExpired - Callback function that called when token is invalid (expired). The token is *not* passed as a parameter.
 */
Ygapi.prototype.validateToken = function (strAccessToken, callbackValid, callbackExpired){

	if(strAccessToken === undefined){
		throw 'argument missing.';
	}

	var strUrl = Ygapi.STR_TOKEN_VALIDATION_URL + '?access_token=' + strAccessToken;

	var oReq = this._createCORSRequest('GET', strUrl);
	if (!oReq) {
		throw 'CORS not supported';
	}else{
		oReq.onreadystatechange = function(){
			if (oReq.readyState == 4){
				if (oReq.status == 200){
					if (callbackValid !== undefined) {
						callbackValid(strAccessToken);
					}
				}else if(oReq.status == 400){
					if (callbackExpired !== undefined) {
						callbackExpired();
					}
				}else{
					throw oReq.status;
				}
			}
		}
		oReq.send();
	}

}

/**
 * Refresh token.
 * @method
 * @param {string} strRefreshToken - Refresh token to get a new access token.
 * @param {function} callback - Callback function that called when the new token is returned. The token is passed as a parameter.
 * @param {string} strClientId - Client id.
 * @param {string} strClientSecret - Client secret.
 */
Ygapi.prototype.refreshToken = function (strRefreshToken, callback, strClientId, strClientSecret){

	if(strRefreshToken === undefined || callback === undefined){
		throw 'argument missing.';
	}
	strClientId = strClientId || this.strClientId;
	strClientSecret = strClientSecret || this.strClientSecret;

	var strParams = 'grant_type=refresh_token'
	+ '&refresh_token=' + strRefreshToken
	+ '&client_id=' + strClientId
	+ "&client_secret=" + strClientSecret;

	var oReq = this._createCORSRequest('POST', Ygapi.STR_TOKEN_ACQUIRE_URL);
	if (!oReq) {
		throw 'CORS not supported';
	}else{
		oReq.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		oReq.onreadystatechange = function(){
			if (oReq.readyState == 4){
				if (oReq.status == 200){
					var oRes = JSON.parse(oReq.responseText);
					callback(oRes['access_token']);
				}else{
					throw oReq.status;
				}
			}
		}
		oReq.send(strParams);
	}
}

/**
 * Generate API URL.
 * @method
 * @param {string} strApiPath - Api path, which does not include hostname or '?' character.
 * @param {object} objParams - Parameter, key-value pair object.
 */
Ygapi.prototype.genUrl = function(strApiPath, objParams){

	if(strApiPath === undefined){
		throw 'argument missing.';
	}
	var strUrl = Ygapi.STR_API_ROOT + strApiPath;
	strUrl += (objParams === undefined) ? '' : '?' + this._json2query(objParams);
	return strUrl;

}

/**
 * Call API.
 * @method
 * @param {string} strUrl - API URL with parameters.
 * @param {string} strAccessToken - Access token.
 * @param {function} callback - Callback function that called execution succeeds. The response object (parsed as JSON) is passed as a parameter.
 */
Ygapi.prototype.callApi = function(strUrl, strAccessToken, callback){

	if(strUrl === undefined || strAccessToken === undefined || callback=== undefined){
		throw 'argument missing.';
	}

	var oReq = this._createCORSRequest('GET', strUrl);
	if (!oReq) {
		throw 'CORS not supported';
	}else{
		oReq.setRequestHeader('Authorization', 'Bearer ' + strAccessToken);
		oReq.onreadystatechange = function(){
			if (oReq.readyState == 4){
				if (oReq.status == 200){
					var oRes = JSON.parse(oReq.responseText);
					callback(oRes);
				}else{
					throw oReq.status;
				}
			}
		}
		oReq.send();
	}

}

/**
 * Process token and API at once.
 * @method
 * @param {string} strApiPath - Api path, which does not include hostname or '?' character.
 * @param {object} objParams - Parameter, key-value pair object.
 * @param {function} callback - Callback function that called execution succeeds. The response object (parsed as JSON) is passed as a parameter.
 */
// 
Ygapi.prototype.procApi = function(strApiPath, objParams, callback){

	if(strApiPath === undefined || objParams === undefined || callback=== undefined){
		throw 'argument missing.';
	}

	if (!localStorage.getItem('strAccessToken')){
		if (!localStorage.getItem('strAuthCode')){
			throw 'get authcode.';
		}

		this.getToken(localStorage.getItem('strAuthCode'), function(x,y){
			if(x){
				localStorage.setItem('strAccessToken', x);
				caloop(strApiPath, x, callback, objParams);
			}
			if(y){localStorage.setItem('strRefreshToken', y);}
			localStorage.removeItem('strAuthCode');
		}, 'postmessage');

	} else {

		this.validateToken(
			localStorage.getItem('strAccessToken'), 
			function(x){
				caloop(strApiPath, x, callback, objParams);
			}, 
			function(){
				localStorage.removeItem('strAccessToken');
				Ygapi.prototype.refreshToken(localStorage.getItem('strRefreshToken'), function(x){
					if(x){localStorage.setItem('strAccessToken', x);}
					caloop(strApiPath, x, callback, objParams);
				});
			}
		);

	}

	function caloop(strApiPath, strAccessToken, callback, objParams){
		var strUrl = Ygapi.prototype.genUrl(strApiPath, objParams);
		ca(strUrl, strAccessToken, callback);

		function ca(strUrl, strAccessToken, callback){
			Ygapi.prototype.callApi(strUrl, strAccessToken, function(x){
				callback(x);
				if(x.nextLink){
					ca(x.nextLink, strAccessToken, callback);
				}
			});
		}

	}
}
