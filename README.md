# Yanai Google API library

## Usage

### Create instance.

```**.js
var ygapi = new Ygapi(strClientId, strClientSecret, strRedirectUrl, strScope)
```

Parameters.

1. strClientId: Client id.  
String.  
Necessary.
2. strClientSecret: Client secret.  
String.  
Necessary.
3. strRedirectUrl: Callback URL.  
String.  
Necessary.  
You can specify this argument either in URL form and 'postmessage'.  
The former is callback url redirected from the server.  
The latter if you specify 'postmessage' in this place, auth-code is sent through postmessage (only available in Google). Using postmessage you can avoid cross origin exception.
4. strScope: Scope.  
String.  
Necessary.

Example.

```**.js
var ygapi = new Ygapi(
	'123456789012-abcdefghijklmnopqrstuvwxyzabcdef.apps.googleusercontent.com',
	'1234567890abcdefghijklmn',
	'https://yourdomain.com/oauth2callback',
	'https://www.googleapis.com/auth/analytics.readonly'
);

// or

var ygapi = new Ygapi(
	'123456789012-abcdefghijklmnopqrstuvwxyzabcdef.apps.googleusercontent.com',
	'1234567890abcdefghijklmn',
	'postmessage',
	'https://www.googleapis.com/auth/youtube.upload'
);
```

See 
https://developers.google.com/identity/protocols/OAuth2



### Add a click event listener on an element to get auth-code (or token directly).

```*.js
Ygapi.getAuthCode(elButton, callback, strResponseType, strRedirectUrl, strScope, strClientId)
```

To get auth-code, user's authentication action is required.  
This method attaches the authentication process as a click-event.  
If an user clicks an element attached, an authentication window appears as a popup.

The authentication process returns either of auth-code or access token (You can specify which of them in the parameter).

This methods does not return auth-code for the reason of asynchronous processing. Instead you specify a callback function that the auto-code (or access token) is passed as a parameter.

Parameters.

1. elButton: Element to add event listener. Probably this should be anchor or button.  
Node. 
Necessary.
2. callback: Callback function that called when auth-code (or access token) is returned.  
The auth-code (or access token) is passed as a parameter.  
Function.  
Necessary.
3. strResponseType: 'code' or 'token'.  
If you get an access token, you should specify this 'token'. Otherwise auth-code is returned.  
String.  
Not necessary (Default: 'code').
4. strRedirectUrl: Callback URL.  
String.  
If you don't specify this, the value of constructor is applied.  
You can specify this parameter either in URL form and 'postmessage'.  
The former is callback url redirected from the server.  
The latter if you specify 'postmessage' in this place, auth-code is sent through postmessage (only available in Google). Using postmessage you can avoid cross origin exception.
5. strScope: Scope.  
String.  
If you don't specify this, the value of constructor is applied.
6. strClientId: Client id.  
String.  
If you don't specify this, the value of constructor is applied.

Example.

```**.js
ygapi.getAuthCode(document.getElementsById('auth-button'), function(x){
	if(x){localStorage.setItem('strAuthCode', x);}
}, 'code');
```



### Get token.

```*.js
Ygapi.getToken(strAuthcode, callback, strRedirectUrl, strClientId, strClientSecret)
```

Get an access token and an refresh token by auth-code.  
This methods does not return tokens for the reason of asynchronous processing.  
Instead you specify a callback function that the access token and the refresh token are passed as parameters.

Parameters.

1. strAuthcode: Auth-code.  
String.  
Necessary.
2. callback: Callback function that called when tokens are returned. The tokens are passed as parameters. The first is access token, and the second is refresh token.  
Function.  
Necessary.
3. strRedirectUrl: Callback URL.  
String.  
If you don't specify this, the value of constructor is applied.  
You should specify this parameter the same value as specified in authentication process.
4. strClientId: Client id.  
String.  
If you don't specify this, the value of constructor is applied.
5. strClientSecret: Client secret.  
String.  
If you don't specify this, the value of constructor is applied.

Example.

```**.js
ygapi.getToken(localStorage.getItem('strAuthCode'), function(x,y){
	if(x){localStorage.setItem('strAccessToken', x);}
	if(y){localStorage.setItem('strRefreshToken', y);}
	localStorage.removeItem('strAuthCode');
}, 'postmessage');
```



### Validate token.

```*.js
Ygapi.validateToken(strAccessToken, callbackValid, callbackExpired)
```

Validate token and specify processings when passed or failed.

Parameters.

1. strAccessToken: Access token to validate.  
String.  
Necessary.
2. callbackValid: Callback function that called when token is valid.  
The token is passed as a parameter.  
Function.  
Not necessary. If you don't specify, do nothing when valid.
3. callbackExpired: Callback function that called when token is invalid (expired).  
The token is *not* passed as a parameter.  
Function.  
Not necessary. If you don't specify, do nothing when invalid.

Example.

```**.js
ygapi.validateToken(
	localStorage.getItem('strAccessToken'), 
	function(x){console.log('valid')}, 
	function(){console.log('expired')}
);
```



### Refresh token.

```*.js
Ygapi.refreshToken(strRefreshToken, callback, strClientId, strClientSecret)
```

Refresh access token (get new access token) using refresh token.

Parameters.

1. strRefreshToken: Refresh token to get a new access token.  
String.  
Necessary.
2. callback: Callback function that called when the new token is returned.  
The token is passed as a parameter.  
Function.  
Necessary.
3. strClientId: Client id.  
String.  
If you don't specify this, the value of constructor is applied.
4. strClientSecret: Client secret.  
String.  
If you don't specify this, the value of constructor is applied.

Example.

```**.js
ygapi.refreshToken(localStorage.getItem('strRefreshToken'), function(x){
	if(x){localStorage.setItem('strAccessToken', x);}
	console.log(localStorage.getItem('strAccessToken'));
});
```



### Generate API URL.

```*.js
Ygapi.genUrl(strApiPath, objParams)
```

Generate API URL by api path and parameters.

Parameters.

1. strApiPath: Api path, which does not include hostname or '?' character.  
String.  
Necessary.
2. objParams: Parameter, key-value pair object.  
Object.  
Not necessary (no parameters).

Example.

```**.js
var strUrl = ygapi.genUrl(
	'/analytics/v3/data/ga', 
	{
		'ids': 'ga:12345678',
		'start-date': '2015-07-01',
		'end-date': '2015-08-10',
		'metrics': 'ga:sessions,ga:bounces',
		'dimensions': 'ga:medium,ga:landingPagePath',
		'max-results': 10,
	}
);
```



### Call API.

```*.js
Ygapi.callApi(strUrl, strAccessToken, callback)
```

Generate API URL by api path and parameters.

Parameters.

1. strUrl: API URL with parameters.  
String.  
Necessary.
2. strAccessToken: Access token.  
String.  
Necessary.
3. callback: Callback function that called execution succeeds.  
The response object (parsed as JSON) is passed as a parameter.  
Function.  
Necessary.
Passed parameter is an object of `JSON.parse(xmlHttpRequest.responseText)`

Example.

```**.js
ygapi.callApi(
	strUrl, 
	localStorage.getItem('strAccessToken'), 
	function(x){
		for(i=0;i<x.rows.length;i++){
			console.log(x.rows[i]);
		}
	}
);
```



### A method which collect up processings above.

```*.js
Ygapi.procApi(strApiPath, objParams, callback)
```

Generate URL and call API at once.  
When access token is missing or invalid, this method gets the token before calling API.  
If 'nextLink' value appears in the server response, this method calls API recursively and get all records automatically. (Callback function is applied for all records.)

This method uses localStorage values below.

- localStorage.getItem('strAccessToken') as strAccessToken.
- localStorage.getItem('strRefreshToken') as strRefreshToken.
- localStorage.getItem('strAuthCode') as strAuthCode.

Parameters.

1. strApiPath: Api path, which does not include hostname or '?' character.  
String.  
Necessary.
2. objParams: Parameter, key-value pair object.  
Object.  
Not necessary (no parameters).
3. callback: Callback function that called execution succeeds. The response object (parsed as JSON) is passed as a parameter.  
Function.  
Necessary.
Passed parameter is an object of `JSON.parse(xmlHttpRequest.responseText)`

Example.

```**.js
ygapi.procApi(
	'/analytics/v3/data/ga', 
	{
		'ids': 'ga:12345678',
		'start-date': '2015-07-01',
		'end-date': '2015-07-10',
		'metrics': 'ga:sessions,ga:bounces',
		'dimensions': 'ga:medium,ga:landingPagePath',
		'max-results': 100,
	},
	function(x){
		for(i=0;i<x.rows.length;i++){
			console.log(x.rows[i]);
		}
	}
);
```



## LICENSE

This software is released under the MIT License, see LICENSE.txt.
