__d(function(g,r,i,a,m,_e,d){var e=r(d[0]);Object.defineProperty(_e,"__esModule",{value:!0});var s={SDK_VERSION:!0,firebase:!0};_e.firebase=_e.default=_e.SDK_VERSION=void 0;var t=r(d[1]),n=r(d[2]),o=e(r(d[3])),c=e(r(d[4])),u=e(r(d[5])),l=e(r(d[6])),f=r(d[7]);Object.keys(f).forEach(function(e){"default"!==e&&"__esModule"!==e&&(Object.prototype.hasOwnProperty.call(s,e)||e in _e&&_e[e]===f[e]||Object.defineProperty(_e,e,{enumerable:!0,get:function(){return f[e]}}))});let p,h;class b extends n.FirebaseModule{constructor(...e){super(...e),this._isAutoInitEnabled=null==this.native.isAutoInitEnabled||this.native.isAutoInitEnabled,this._isDeliveryMetricsExportToBigQueryEnabled=null!=this.native.isDeliveryMetricsExportToBigQueryEnabled&&this.native.isDeliveryMetricsExportToBigQueryEnabled,this._isRegisteredForRemoteNotifications=null==this.native.isRegisteredForRemoteNotifications||this.native.isRegisteredForRemoteNotifications,o.default.registerHeadlessTask("ReactNativeFirebaseMessagingHeadlessTask",()=>p?e=>p(e):()=>Promise.resolve()),t.isIOS&&(this.emitter.addListener("messaging_message_received_background",e=>p?p(e):Promise.resolve()),this.emitter.addListener("messaging_settings_for_notification_opened",e=>h?h(e):Promise.resolve()))}get isAutoInitEnabled(){return this._isAutoInitEnabled}get isDeviceRegisteredForRemoteMessages(){return!!t.isAndroid||this._isRegisteredForRemoteNotifications}get isDeliveryMetricsExportToBigQueryEnabled(){return this._isDeliveryMetricsExportToBigQueryEnabled}setAutoInitEnabled(e){if(!(0,t.isBoolean)(e))throw new Error("firebase.messaging().setAutoInitEnabled(*) 'enabled' expected a boolean value.");return this._isAutoInitEnabled=e,this.native.setAutoInitEnabled(e)}getInitialNotification(){return this.native.getInitialNotification().then(e=>e||null)}getDidOpenSettingsForNotification(){return t.isIOS?this.native.getDidOpenSettingsForNotification().then(e=>e):Promise.resolve(!1)}getIsHeadless(){return this.native.getIsHeadless()}getToken({appName:e,senderId:s}={}){if(!(0,t.isUndefined)(e)&&!(0,t.isString)(e))throw new Error("firebase.messaging().getToken(*) 'appName' expected a string.");if(!(0,t.isUndefined)(s)&&!(0,t.isString)(s))throw new Error("firebase.messaging().getToken(*) 'senderId' expected a string.");return this.native.getToken(e||this.app.name,s||this.app.options.messagingSenderId)}deleteToken({appName:e,senderId:s}={}){if(!(0,t.isUndefined)(e)&&!(0,t.isString)(e))throw new Error("firebase.messaging().deleteToken(*) 'appName' expected a string.");if(!(0,t.isUndefined)(s)&&!(0,t.isString)(s))throw new Error("firebase.messaging().deleteToken(*) 'senderId' expected a string.");return this.native.deleteToken(e||this.app.name,s||this.app.options.messagingSenderId)}onMessage(e){if(!(0,t.isFunction)(e))throw new Error("firebase.messaging().onMessage(*) 'listener' expected a function.");const s=this.emitter.addListener("messaging_message_received",e);return()=>s.remove()}onNotificationOpenedApp(e){if(!(0,t.isFunction)(e))throw new Error("firebase.messaging().onNotificationOpenedApp(*) 'listener' expected a function.");const s=this.emitter.addListener("messaging_notification_opened",e);return()=>s.remove()}onTokenRefresh(e){if(!(0,t.isFunction)(e))throw new Error("firebase.messaging().onTokenRefresh(*) 'listener' expected a function.");const s=this.emitter.addListener("messaging_token_refresh",s=>{const{token:t}=s;e(t)});return()=>s.remove()}requestPermission(e){if(t.isAndroid)return Promise.resolve(1);const s={alert:!0,announcement:!1,badge:!0,carPlay:!0,provisional:!1,sound:!0,criticalAlert:!1,providesAppNotificationSettings:!1};if(!e)return this.native.requestPermission(s);if(!(0,t.isObject)(e))throw new Error("firebase.messaging().requestPermission(*) expected an object value.");return Object.entries(e).forEach(([e,n])=>{if(!(0,t.hasOwnProperty)(s,e))throw new Error(`firebase.messaging().requestPermission(*) unexpected key "${e}" provided to permissions object.`);if(!(0,t.isBoolean)(n))throw new Error(`firebase.messaging().requestPermission(*) the permission "${e}" expected a boolean value.`);s[e]=n}),this.native.requestPermission(s)}registerDeviceForRemoteMessages(){if(t.isAndroid)return Promise.resolve();this.firebaseJson.messaging_ios_auto_register_for_remote_messages;return this._isRegisteredForRemoteNotifications=!0,this.native.registerForRemoteNotifications()}unregisterDeviceForRemoteMessages(){return t.isAndroid?Promise.resolve():(this._isRegisteredForRemoteNotifications=!1,this.native.unregisterForRemoteNotifications())}getAPNSToken(){return t.isAndroid?Promise.resolve(null):this.native.getAPNSToken()}setAPNSToken(e,s){if((0,t.isUndefined)(e)||!(0,t.isString)(e))throw new Error("firebase.messaging().setAPNSToken(*) 'token' expected a string value.");if(!((0,t.isUndefined)(s)||(0,t.isString)(s)&&["prod","sandbox","unknown"].includes(s)))throw new Error("firebase.messaging().setAPNSToken(*) 'type' expected one of 'prod', 'sandbox', or 'unknown'.");return t.isAndroid?Promise.resolve(null):this.native.setAPNSToken(e,s)}hasPermission(){return this.native.hasPermission()}onDeletedMessages(e){if(!(0,t.isFunction)(e))throw new Error("firebase.messaging().onDeletedMessages(*) 'listener' expected a function.");const s=this.emitter.addListener("messaging_message_deleted",e);return()=>s.remove()}onMessageSent(e){if(!(0,t.isFunction)(e))throw new Error("firebase.messaging().onMessageSent(*) 'listener' expected a function.");const s=this.emitter.addListener("messaging_message_sent",e);return()=>{s.remove()}}onSendError(e){if(!(0,t.isFunction)(e))throw new Error("firebase.messaging().onSendError(*) 'listener' expected a function.");const s=this.emitter.addListener("messaging_message_send_error",e);return()=>s.remove()}setBackgroundMessageHandler(e){if(!(0,t.isFunction)(e))throw new Error("firebase.messaging().setBackgroundMessageHandler(*) 'handler' expected a function.");p=e,t.isIOS&&this.native.signalBackgroundMessageHandlerSet()}setOpenSettingsForNotificationsHandler(e){if(t.isIOS){if(!(0,t.isFunction)(e))throw new Error("firebase.messaging().setOpenSettingsForNotificationsHandler(*) 'handler' expected a function.");h=e}}sendMessage(e){if(t.isIOS)throw new Error("firebase.messaging().sendMessage() is only supported on Android devices.");let s;try{s=(0,u.default)(this.app.options.messagingSenderId,e)}catch(e){throw new Error(`firebase.messaging().sendMessage(*) ${e.message}.`)}return this.native.sendMessage(s)}subscribeToTopic(e){if(!(0,t.isString)(e))throw new Error("firebase.messaging().subscribeToTopic(*) 'topic' expected a string value.");if(e.indexOf("/")>-1)throw new Error("firebase.messaging().subscribeToTopic(*) 'topic' must not include \"/\".");return this.native.subscribeToTopic(e)}unsubscribeFromTopic(e){if(!(0,t.isString)(e))throw new Error("firebase.messaging().unsubscribeFromTopic(*) 'topic' expected a string value.");if(e.indexOf("/")>-1)throw new Error("firebase.messaging().unsubscribeFromTopic(*) 'topic' must not include \"/\".");return this.native.unsubscribeFromTopic(e)}useServiceWorker(){}usePublicVapidKey(){}setDeliveryMetricsExportToBigQuery(e){if(!(0,t.isBoolean)(e))throw new Error("firebase.messaging().setDeliveryMetricsExportToBigQuery(*) 'enabled' expected a boolean value.");return this._isDeliveryMetricsExportToBigQueryEnabled=e,this.native.setDeliveryMetricsExportToBigQuery(e)}async isSupported(){return!c.default.isAndroid||(playServicesAvailability=v.utils().playServicesAvailability,playServicesAvailability.isAvailable)}}_e.SDK_VERSION=l.default;_e.default=(0,n.createModuleNamespace)({statics:{AuthorizationStatus:{NOT_DETERMINED:-1,DENIED:0,AUTHORIZED:1,PROVISIONAL:2,EPHEMERAL:3},NotificationAndroidPriority:{PRIORITY_MIN:-2,PRIORITY_LOW:-1,PRIORITY_DEFAULT:0,PRIORITY_HIGH:1,PRIORITY_MAX:2},NotificationAndroidVisibility:{VISIBILITY_SECRET:-1,VISIBILITY_PRIVATE:0,VISIBILITY_PUBLIC:1}},version:l.default,namespace:"messaging",nativeModuleName:"RNFBMessagingModule",nativeEvents:["messaging_token_refresh","messaging_message_sent","messaging_message_deleted","messaging_message_received","messaging_message_send_error","messaging_notification_opened",...t.isIOS?["messaging_message_received_background","messaging_settings_for_notification_opened"]:[]],hasMultiAppSupport:!1,hasCustomUrlOrRegionSupport:!1,ModuleClass:b});const v=_e.firebase=(0,n.getFirebaseRoot)()},755,[1,763,772,4,83,793,794,795]);
__d(function(g,r,i,a,m,e,d){var t=r(d[0]);Object.defineProperty(e,"__esModule",{value:!0});var n={getDataUrlParts:!0,once:!0,isError:!0,hasOwnProperty:!0,stripTrailingSlash:!0,isIOS:!0,isAndroid:!0,isOther:!0,tryJSONParse:!0,tryJSONStringify:!0,Base64:!0,ReferenceBase:!0};Object.defineProperty(e,"Base64",{enumerable:!0,get:function(){return o.default}}),Object.defineProperty(e,"ReferenceBase",{enumerable:!0,get:function(){return f.default}}),e.getDataUrlParts=function(t){const n=t.includes(";base64");let[c,u]=t.split(",");if(!c||!u)return{base64String:void 0,mediaType:void 0};c=c.replace("data:","").replace(";base64",""),u&&u.includes("%")&&(u=decodeURIComponent(u));n||(u=o.default.btoa(u));return{base64String:u,mediaType:c}},e.hasOwnProperty=function(t,n){return Object.hasOwnProperty.call(t,n)},e.isAndroid=void 0,e.isError=function(t){if("[object Error]"===Object.prototype.toString.call(t))return!0;return t instanceof Error},e.isOther=e.isIOS=void 0,e.once=function(t,n){let o,c=!1;return function(...u){return c||(c=!0,o=t.apply(n||this,u)),o}},e.stripTrailingSlash=function(t){if(!(0,c.isString)(t))return t;return t.endsWith("/")?t.slice(0,-1):t},e.tryJSONParse=function(t){try{return t&&JSON.parse(t)}catch(n){return t}},e.tryJSONStringify=function(t){try{return JSON.stringify(t)}catch(t){return null}};t(r(d[1]));var o=t(r(d[2])),c=r(d[3]);Object.keys(c).forEach(function(t){"default"!==t&&"__esModule"!==t&&(Object.prototype.hasOwnProperty.call(n,t)||t in e&&e[t]===c[t]||Object.defineProperty(e,t,{enumerable:!0,get:function(){return c[t]}}))});var u=r(d[4]);Object.keys(u).forEach(function(t){"default"!==t&&"__esModule"!==t&&(Object.prototype.hasOwnProperty.call(n,t)||t in e&&e[t]===u[t]||Object.defineProperty(e,t,{enumerable:!0,get:function(){return u[t]}}))});var s=r(d[5]);Object.keys(s).forEach(function(t){"default"!==t&&"__esModule"!==t&&(Object.prototype.hasOwnProperty.call(n,t)||t in e&&e[t]===s[t]||Object.defineProperty(e,t,{enumerable:!0,get:function(){return s[t]}}))});var l=r(d[6]);Object.keys(l).forEach(function(t){"default"!==t&&"__esModule"!==t&&(Object.prototype.hasOwnProperty.call(n,t)||t in e&&e[t]===l[t]||Object.defineProperty(e,t,{enumerable:!0,get:function(){return l[t]}}))});var f=t(r(d[7]));e.isIOS=!1,e.isAndroid=!1,e.isOther=!0},763,[1,83,764,768,769,770,767,771]);
__d(function(g,r,_i,a,m,e,d){var t=r(d[0]);Object.defineProperty(e,"__esModule",{value:!0}),e.default=void 0;var o=t(r(d[1])),n=r(d[2]);const i="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";e.default={btoa:function(t){let o,n=0,f=0,s="";for(f=0,n=0,o=i;t.charAt(0|n)||(o="=",n%1);s+=o.charAt(63&f>>8-n%1*8)){const o=t.charCodeAt(n+=.75);if(o>255)throw new Error("'RNFirebase.Base64.btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");f=f<<8|o}return s},atob:function(t){let o,n=0,f=0,s=0,c="";const l=t.replace(/[=]+$/,"");if(l.length%4==1)throw new Error("'RNFirebase.Base64.atob' failed: The string to be decoded is not correctly encoded.");for(f=0,s=0,n=0;o=l.charAt(n++);~o&&(s=f%4?64*s+o:o,f++%4)?c+=String.fromCharCode(255&s>>(-2*f&6)):0)o=i.indexOf(o);return c},fromData:function(t){if(t instanceof Blob){const o=new FileReader,{resolve:i,reject:f,promise:s}=(0,n.promiseDefer)();return o.readAsDataURL(t),o.onloadend=function(){i({string:o.result,format:"data_url"})},o.onerror=function(t){o.abort(),f(t)},s}if(t instanceof ArrayBuffer||t instanceof Uint8Array)return Promise.resolve({string:(0,o.default)(t),format:"base64"});throw new Error("'RNFirebase.Base64.fromData' failed: Unknown data type.")}}},764,[1,765,767]);
__d(function(g,r,i,a,m,e,d){"use strict";const t=r(d[0]);m.exports=function(n){if(n instanceof ArrayBuffer&&(n=new Uint8Array(n)),n instanceof Uint8Array)return t.fromByteArray(n);if(!ArrayBuffer.isView(n))throw new Error("data must be ArrayBuffer or typed array");const{buffer:f,byteOffset:y,byteLength:o}=n;return t.fromByteArray(new Uint8Array(f,y,o))}},765,[766]);
__d(function(g,r,_i,a,m,e,d){"use strict";e.byteLength=function(t){var n=h(t),o=n[0],u=n[1];return 3*(o+u)/4-u},e.toByteArray=function(t){var u,c,i=h(t),f=i[0],A=i[1],C=new o(function(t,n,o){return 3*(n+o)/4-o}(0,f,A)),y=0,s=A>0?f-4:f;for(c=0;c<s;c+=4)u=n[t.charCodeAt(c)]<<18|n[t.charCodeAt(c+1)]<<12|n[t.charCodeAt(c+2)]<<6|n[t.charCodeAt(c+3)],C[y++]=u>>16&255,C[y++]=u>>8&255,C[y++]=255&u;2===A&&(u=n[t.charCodeAt(c)]<<2|n[t.charCodeAt(c+1)]>>4,C[y++]=255&u);1===A&&(u=n[t.charCodeAt(c)]<<10|n[t.charCodeAt(c+1)]<<4|n[t.charCodeAt(c+2)]>>2,C[y++]=u>>8&255,C[y++]=255&u);return C},e.fromByteArray=function(n){for(var o,u=n.length,c=u%3,h=[],i=16383,A=0,C=u-c;A<C;A+=i)h.push(f(n,A,A+i>C?C:A+i));1===c?(o=n[u-1],h.push(t[o>>2]+t[o<<4&63]+"==")):2===c&&(o=(n[u-2]<<8)+n[u-1],h.push(t[o>>10]+t[o>>4&63]+t[o<<2&63]+"="));return h.join("")};for(var t=[],n=[],o="undefined"!=typeof Uint8Array?Uint8Array:Array,u="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",c=0;c<64;++c)t[c]=u[c],n[u.charCodeAt(c)]=c;function h(t){var n=t.length;if(n%4>0)throw new Error("Invalid string. Length must be a multiple of 4");var o=t.indexOf("=");return-1===o&&(o=n),[o,o===n?0:4-o%4]}function i(n){return t[n>>18&63]+t[n>>12&63]+t[n>>6&63]+t[63&n]}function f(t,n,o){for(var u,c=[],h=n;h<o;h+=3)u=(t[h]<<16&16711680)+(t[h+1]<<8&65280)+(255&t[h+2]),c.push(i(u));return c.join("")}n["-".charCodeAt(0)]=62,n["_".charCodeAt(0)]=63},766,[]);
__d(function(g,r,i,a,m,e,d){Object.defineProperty(e,"__esModule",{value:!0}),e.promiseDefer=function(){const n={resolve:null,reject:null};return n.promise=new Promise((t,l)=>{n.resolve=t,n.reject=l}),n},e.promiseWithOptionalCallback=function(t,l){if(!(0,n.isFunction)(l))return t;return t.then(n=>(l&&1===l.length?l(null):l&&l(null,n),n)).catch(n=>(l&&l(n),Promise.reject(n)))};var n=r(d[0])},767,[768]);
__d(function(g,r,_i,a,m,e,d){var n=r(d[0]);Object.defineProperty(e,"__esModule",{value:!0}),e.isAlphaNumericUnderscore=function(n){return t.test(n)},e.isArray=s,e.isBoolean=function(n){return"boolean"==typeof n},e.isDate=function(n){return n&&"[object Date]"===Object.prototype.toString.call(n)&&!isNaN(n)},e.isE164PhoneNumber=function(n){return/^\+[1-9]\d{1,14}$/.test(n)},e.isFinite=function(n){return Number.isFinite(n)},e.isFunction=function(n){return!!n&&"function"==typeof n},e.isInteger=function(n){return Number.isInteger(n)},e.isNull=i,e.isNumber=function(n){return"number"==typeof n},e.isObject=o,e.isOneOf=function(n,t=[]){if(!s(t))return!1;return t.includes(n)},e.isString=u,e.isUndefined=function(n){return void 0===n},e.isValidUrl=function(n){return c.test(n)},e.noop=function(){},e.objectKeyValuesAreStrings=function(n){if(!o(n))return!1;const t=Object.entries(n);for(let n=0;n<t.length;n++){const[i,o]=t[n];if(!u(i)||!u(o))return!1}return!0},e.validateOptionalNativeDependencyExists=function(n,t,i){if(i)return;let o="You attempted to use an optional API that's not enabled natively. \n\n To enable ";throw o+=t,o+=` please set the 'react-native' -> '${n}' key to true in your firebase.json file`,o+=", re-run pod install and rebuild your iOS app. If you're not using Pods then make sure you've have downloaded the necessary Firebase iOS SDK dependencies for this API.",new Error(o)};n(r(d[1]));const t=/^[a-zA-Z0-9_]+$/;function i(n){return null===n}function o(n){return!!n&&("object"==typeof n&&!Array.isArray(n)&&!i(n))}function u(n){return"string"==typeof n}function s(n){return Array.isArray(n)}const c=/^(http|https):\/\/[^ "]+$/},768,[1,83]);
__d(function(g,r,_i,a,m,e,d){Object.defineProperty(e,"__esModule",{value:!0}),e.generateDatabaseId=function(o=0){const h=new Array(8);let f=(new Date).getTime()+o;const c=f===n;n=f;for(let o=7;o>=0;o-=1)h[o]=t.charAt(f%64),f=Math.floor(f/64);if(0!==f)throw new Error("We should have converted the entire timestamp.");let i=h.join("");if(c){let t;for(t=11;t>=0&&63===l[t];t-=1)l[t]=0;l[t]+=1}else for(let t=0;t<12;t+=1)l[t]=Math.floor(64*Math.random());for(let o=0;o<12;o++)i+=t.charAt(l[o]);if(20!==i.length)throw new Error("Length should be 20.");return i},e.generateFirestoreId=function(){let t="";for(let n=0;n<20;n++)t+=o.charAt(Math.floor(Math.random()*o.length));return t};const t="-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz",o="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";let n=0;const l=[]},769,[]);
__d(function(g,r,_i,a,m,e,d){function t(t){return t.split("/").filter(t=>t.length>0)}Object.defineProperty(e,"__esModule",{value:!0}),e.INVALID_PATH_REGEX=e.INVALID_KEY_REGEX=void 0,e.isValidKey=function(t){return"string"==typeof t&&0!==t.length&&!i.test(path)},e.isValidPath=function(t){return"string"==typeof t&&0!==t.length&&!n.test(t)},e.pathChild=function(n,i){const o=t(i).join("/");if(0===n.length)return o;return`${n}/${o}`},e.pathIsEmpty=function(n){return!t(n).length},e.pathLastComponent=function(t){const n=t.lastIndexOf("/",t.length-2);if(-1===n)return t;return t.slice(n+1)},e.pathParent=function(t){if(0===t.length)return null;const n=t.lastIndexOf("/");if(n<=0)return null;return t.slice(0,n)},e.pathPieces=t,e.pathToUrlEncodedString=function(n){const i=t(n);let o="";for(let t=0;t<i.length;t++)o+=`/${encodeURIComponent(String(i[t]))}`;return o||"/"},e.toFilePath=function(t){let n=t.replace("file://","");n.includes("%")&&(n=decodeURIComponent(n));return n};const n=e.INVALID_PATH_REGEX=/[[\].#$\u0000-\u001F\u007F]/;const i=e.INVALID_KEY_REGEX=/[\[\].#$\/\u0000-\u001F\u007F]/},770,[]);
__d(function(g,r,i,a,m,e,d){Object.defineProperty(e,"__esModule",{value:!0}),e.default=void 0;e.default=class{constructor(t){let s=t;s?(s=s.length>1&&s.endsWith("/")?s.substring(0,s.length-1):s,s.startsWith("/")&&s.length>1&&(s=s.substring(1,s.length))):s="/",this.path=s}get key(){return"/"===this.path?null:this.path.substring(this.path.lastIndexOf("/")+1)}}},771,[]);
__d(function(g,r,i,a,m,e,d){var t=r(d[0]);Object.defineProperty(e,"__esModule",{value:!0});var n={FirebaseApp:!0,FirebaseModule:!0,NativeFirebaseError:!0,SharedEventEmitter:!0};Object.defineProperty(e,"FirebaseApp",{enumerable:!0,get:function(){return o.default}}),Object.defineProperty(e,"FirebaseModule",{enumerable:!0,get:function(){return c.default}}),Object.defineProperty(e,"NativeFirebaseError",{enumerable:!0,get:function(){return f.default}}),Object.defineProperty(e,"SharedEventEmitter",{enumerable:!0,get:function(){return y.default}});var o=t(r(d[1])),u=r(d[2]);Object.keys(u).forEach(function(t){"default"!==t&&"__esModule"!==t&&(Object.prototype.hasOwnProperty.call(n,t)||t in e&&e[t]===u[t]||Object.defineProperty(e,t,{enumerable:!0,get:function(){return u[t]}}))});var c=t(r(d[3])),f=t(r(d[4])),l=r(d[5]);Object.keys(l).forEach(function(t){"default"!==t&&"__esModule"!==t&&(Object.prototype.hasOwnProperty.call(n,t)||t in e&&e[t]===l[t]||Object.defineProperty(e,t,{enumerable:!0,get:function(){return l[t]}}))});var b=r(d[6]);Object.keys(b).forEach(function(t){"default"!==t&&"__esModule"!==t&&(Object.prototype.hasOwnProperty.call(n,t)||t in e&&e[t]===b[t]||Object.defineProperty(e,t,{enumerable:!0,get:function(){return b[t]}}))});var p=r(d[7]);Object.keys(p).forEach(function(t){"default"!==t&&"__esModule"!==t&&(Object.prototype.hasOwnProperty.call(n,t)||t in e&&e[t]===p[t]||Object.defineProperty(e,t,{enumerable:!0,get:function(){return p[t]}}))});var y=t(r(d[8]))},772,[1,773,775,788,776,789,791,774,786]);
__d(function(g,r,i,a,m,e,d){Object.defineProperty(e,"__esModule",{value:!0}),e.default=void 0;var t=r(d[0]);e.default=class{constructor(t,n,s,o){const{name:l,automaticDataCollectionEnabled:c}=n;this._name=l,this._deleted=!1,this._deleteApp=o,this._options=Object.assign({},t),this._automaticDataCollectionEnabled=!!c,s?(this._initialized=!0,this._nativeInitialized=!0):(this._initialized=!1,this._nativeInitialized=!1)}get name(){return this._name}get options(){return Object.assign({},this._options)}get automaticDataCollectionEnabled(){return this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(n){this._checkDestroyed(),(0,t.getAppModule)().setAutomaticDataCollectionEnabled(this.name,n),this._automaticDataCollectionEnabled=n}_checkDestroyed(){if(this._deleted)throw new Error(`Firebase App named '${this._name}' already deleted`)}extendApp(t){this._checkDestroyed(),Object.assign(this,t)}delete(){return this._checkDestroyed(),this._deleteApp()}toString(){return this.name}}},773,[774]);
__d(function(g,r,_i,a,m,e,d){var t=r(d[0]);Object.defineProperty(e,"__esModule",{value:!0}),e.getAppModule=function(){if(p[n.APP_NATIVE_MODULE])return p[n.APP_NATIVE_MODULE];const t=(0,s.getReactNativeModule)(n.APP_NATIVE_MODULE);if(!t)throw new Error(b("app"));return p[n.APP_NATIVE_MODULE]=v("app",t,[]),p[n.APP_NATIVE_MODULE]},e.getNativeModule=function(t){const n=f(t);if(p[n])return p[n];return function(t){const n=t._config,o=f(t),{namespace:i,nativeEvents:u,nativeModuleName:c,hasMultiAppSupport:l,hasCustomUrlOrRegionSupport:h,disablePrependCustomUrlOrRegion:y}=n,O={},E=Array.isArray(c),A=E?c:[c];for(let n=0;n<A.length;n++){const o=(0,s.getReactNativeModule)(A[n]);if(!E&&!o)throw new Error(b(i));E&&(O[A[n]]=!!o);const u=[];l&&u.push(t.app.name),h&&!y&&u.push(t._customUrlOrRegion),Object.assign(O,v(i,o,u))}if(u&&u.length)for(let t=0,n=u.length;t<n;t++)_(u[t]);return Object.freeze(O),p[o]=O,p[o]}(t)};var n=r(d[1]),o=t(r(d[2])),i=t(r(d[3])),u=t(r(d[4])),s=r(d[5]),c=r(d[6]);const p={},l={};function f(t){return`${t._customUrlOrRegion||""}:${t.app.name}:${t._config.namespace}`}function h(t,n,i){return(...u)=>{const s=n(...i,...u);if(s&&s.then){const n=(new Error).stack;return s.catch(i=>Promise.reject(new o.default(i,n,t)))}return s}}function v(t,n,o){const i={};if(!n)return n;let u=Object.keys(Object.getPrototypeOf(n));u.length||(u=Object.keys(n));for(let s=0,c=u.length;s<c;s++){const c=u[s];"function"==typeof n[c]?i[c]=h(t,n[c],o):i[c]=n[c]}return i}function _(t){l[t]||(i.default.addListener(t,n=>{n.appName&&n.databaseId?u.default.emit(`${n.appName}-${n.databaseId}-${t}`,n):n.appName?u.default.emit(`${n.appName}-${t}`,n):u.default.emit(t,n)}),l[t]=!0)}function b(t){const n=`firebase.${t}()`;return c.isIOS||c.isAndroid?`You attempted to use a Firebase module that's not installed natively on your project by calling ${n}.\r\n\r\nEnsure you have installed the npm package '@react-native-firebase/${t}', have imported it in your project, and have rebuilt your native application.`:`You attempted to use a Firebase module that's not installed on your project by calling ${n}.\r\n\r\nEnsure you have installed the npm package '@react-native-firebase/${t}' and have imported it in your project.`}},774,[1,775,776,777,786,778,763]);
__d(function(g,r,i,a,m,e,d){Object.defineProperty(e,"__esModule",{value:!0}),e.KNOWN_NAMESPACES=e.DEFAULT_APP_NAME=e.APP_NATIVE_MODULE=void 0;e.APP_NATIVE_MODULE="RNFBAppModule",e.DEFAULT_APP_NAME="[DEFAULT]",e.KNOWN_NAMESPACES=["appCheck","appDistribution","auth","analytics","remoteConfig","crashlytics","database","inAppMessaging","installations","firestore","functions","indexing","storage","dynamicLinks","messaging","naturalLanguage","ml","notifications","perf","utils"]},775,[]);
__d(function(g,r,i,a,m,e,d){Object.defineProperty(e,"__esModule",{value:!0}),e.default=void 0;class t extends Error{static fromEvent(s,n,o){return new t({userInfo:s},o||(new Error).stack,n)}constructor(s,n,o){super();const{userInfo:u}=s;Object.defineProperty(this,"namespace",{enumerable:!1,value:o}),Object.defineProperty(this,"code",{enumerable:!1,value:`${this.namespace}/${u.code||"unknown"}`}),Object.defineProperty(this,"message",{enumerable:!1,value:`[${this.code}] ${u.message||s.message}`}),Object.defineProperty(this,"jsStack",{enumerable:!1,value:n}),Object.defineProperty(this,"userInfo",{enumerable:!1,value:u}),Object.defineProperty(this,"nativeErrorCode",{enumerable:!1,value:u.nativeErrorCode||null}),Object.defineProperty(this,"nativeErrorMessage",{enumerable:!1,value:u.nativeErrorMessage||null}),this.stack=t.getStackWithMessage(`NativeFirebaseError: ${this.message}`,this.jsStack)}static getStackWithMessage(t,s){return[t,...s.split("\n").slice(2,13)].join("\n")}}e.default=t},776,[]);
__d(function(g,r,i,a,m,e,d){var t=r(d[0]);Object.defineProperty(e,"__esModule",{value:!0}),e.default=void 0;var s=t(r(d[1])),n=r(d[2]);class o extends s.default{constructor(){super((0,n.getReactNativeModule)("RNFBAppModule")),this.ready=!1}addListener(t,s,o){const u=(0,n.getReactNativeModule)("RNFBAppModule");this.ready||(u.eventsNotifyReady(!0),this.ready=!0),u.eventsAddListener(t),g.RNFBDebug;let v=super.addListener(`rnfb_${t}`,(...t)=>(g.RNFBDebug&&g.RNFBTest&&g.RNFBDebugInTestLeakDetection,s(...t)),o);v.eventType=`rnfb_${t}`;let l=v.remove;return v.remove=()=>{u.eventsRemoveListener(t,!1),null!=super.removeSubscription?super.removeSubscription(v):null!=l&&l()},v}removeAllListeners(t){(0,n.getReactNativeModule)("RNFBAppModule").eventsRemoveListener(t,!0),super.removeAllListeners(`rnfb_${t}`)}removeSubscription(t){(0,n.getReactNativeModule)("RNFBAppModule").eventsRemoveListener(t.eventType.replace("rnfb_"),!1),super.removeSubscription&&super.removeSubscription(t)}}e.default=new o},777,[1,605,778]);
__d(function(g,r,i,a,m,e,d){Object.defineProperty(e,"__esModule",{value:!0}),Object.defineProperty(e,"getReactNativeModule",{enumerable:!0,get:function(){return t.getReactNativeModule}}),Object.defineProperty(e,"setReactNativeModule",{enumerable:!0,get:function(){return t.setReactNativeModule}});var t=r(d[0])},778,[779]);
__d(function(g,r,i,a,m,e,d){var t=r(d[0]);Object.defineProperty(e,"__esModule",{value:!0}),e.getReactNativeModule=function(t){const n=o[t];if(!n)throw new Error(`Native module ${t} is not registered.`);if(!g.RNFBDebug)return n;return new Proxy(n,{ownKeys:t=>Object.keys(t),get:(t,o)=>"function"!=typeof n[o]?n[o]:(...t)=>{const u=n[o](...t);return u&&u.then?u.then(t=>t,t=>{throw t}):u}})},e.setReactNativeModule=u;var n=t(r(d[1]));const o={};function u(t,n){o[t]=n}u("RNFBAppModule",n.default)},779,[1,780]);
__d(function(g,r,_i,a,m,e,d){var t=r(d[0]);Object.defineProperty(e,"__esModule",{value:!0}),e.default=void 0;var n=r(d[1]),i=t(r(d[2]));let o=!1,l=0,s=[],c={},p={};function f(t,n){if(!o||!c.hasOwnProperty(t)){const i={eventName:t,eventBody:n};return void s.push(i)}setImmediate(()=>i.default.emit("rnfb_"+t,n))}function u(){if(0===s.length)return;const t=Array.from(s);s=[];for(let n=0;n<t.length;n++){const i=t[n];f(i.eventName,i.eventBody)}}e.default={NATIVE_FIREBASE_APPS:[],FIREBASE_RAW_JSON:"{}",async initializeApp(t,i){const o=i.name,l=(0,n.getApps)().find(t=>t.name===o);if(l)return l;const s={name:o};!0!==i.automaticDataCollectionEnabled&&!1!==i.automaticDataCollectionEnabled||(s.automaticDataCollectionEnabled=i.automaticDataCollectionEnabled);const c=Object.assign({},t);return c.gaTrackingId&&(c.measurementId=c.gaTrackingId),delete c.clientId,(0,n.initializeApp)(c,s),{options:t,appConfig:i}},setLogLevel(t){(0,n.setLogLevel)(t)},setAutomaticDataCollectionEnabled(t,i){(0,n.getApp)(t).automaticDataCollectionEnabled=i},async deleteApp(t){(0,n.getApp)(t)&&(0,n.deleteApp)(t)},metaGetAll:()=>({}),jsonGetAll:()=>({}),async preferencesSetBool(t,n){p[t]=n},preferencesSetString(t,n){p[t]=n},preferencesGetAll:()=>Object.assign({},p),preferencesClearAll(){p={}},addListener(){},removeListeners(){},eventsNotifyReady(t){o=t,o&&setImmediate(()=>u())},eventsGetListeners:()=>({listeners:l,queued:s.length,events:c}),eventsPing(t,n){f(t,n)},eventsAddListener(t){l++,c.hasOwnProperty(t)?c[t]++:c[t]=1,setImmediate(()=>u())},eventsRemoveListener(t,n){if(c.hasOwnProperty(t))if(c[t]<=1||n){const n=c[t];l-=n,delete c[t]}else l--,c[t]--}}},780,[1,781,224]);
__d(function(g,r,i,a,m,e,d){Object.defineProperty(e,"__esModule",{value:!0});var n=r(d[0]);Object.keys(n).forEach(function(t){"default"!==t&&"__esModule"!==t&&(t in e&&e[t]===n[t]||Object.defineProperty(e,t,{enumerable:!0,get:function(){return n[t]}}))})},781,[782]);
__d(function(g,r,i,a,m,e,d){Object.defineProperty(e,"__esModule",{value:!0});var n=r(d[0]);Object.keys(n).forEach(function(t){"default"!==t&&"__esModule"!==t&&(t in e&&e[t]===n[t]||Object.defineProperty(e,t,{enumerable:!0,get:function(){return n[t]}}))});
/**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
/**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
(0,n.registerVersion)("firebase","10.12.2","app")},782,[783]);
__d(function(g,r,i,a,m,_e,d){Object.defineProperty(_e,"__esModule",{value:!0}),Object.defineProperty(_e,"FirebaseError",{enumerable:!0,get:function(){return n.FirebaseError}}),_e._DEFAULT_ENTRY_NAME=_e.SDK_VERSION=void 0,_e._addComponent=V,_e._addOrOverwriteComponent=function(e,t){e.container.addOrOverwriteComponent(t)},_e._apps=void 0,_e._clearComponents=function(){U.clear()}
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */,_e._components=void 0,_e._getProvider=K,_e._isFirebaseApp=q,_e._isFirebaseServerApp=function(e){return void 0!==e.settings},_e._registerComponent=J,_e._removeServiceInstance=function(e,t,n=H){K(e,t).clearInstance(n)},_e._serverApps=void 0,_e.deleteApp=Z,_e.getApp=function(e=H){const t=z.get(e);if(!t&&e===H&&(0,n.getDefaultAppConfig)())return X();if(!t)throw Y.create("no-app",{appName:e});return t},_e.getApps=function(){return Array.from(z.values())},_e.initializeApp=X,_e.initializeServerApp=function(t,s){if((0,n.isBrowser)())throw Y.create("invalid-server-app-environment");void 0===s.automaticDataCollectionEnabled&&(s.automaticDataCollectionEnabled=!1);let o;o=q(t)?t.options:t;const c=Object.assign(Object.assign({},s),o);void 0!==c.releaseOnDeref&&delete c.releaseOnDeref;if(void 0!==s.releaseOnDeref&&"undefined"==typeof FinalizationRegistry)throw Y.create("finalization-registry-not-supported",{});const l=""+(h=JSON.stringify(c),[...h].reduce((e,t)=>Math.imul(31,e)+t.charCodeAt(0)|0,0)),p=T.get(l);var h;if(p)return p.incRefCount(s.releaseOnDeref),p;const f=new e.ComponentContainer(l);for(const e of U.values())f.addComponent(e);const u=new Q(o,s,l,f);return T.set(l,u),u},_e.onLog=function(e,n){if(null!==e&&"function"!=typeof e)throw Y.create("invalid-log-argument");(0,t.setUserLogHandler)(e,n)},_e.registerVersion=ee,_e.setLogLevel=function(e){(0,t.setLogLevel)(e)}
/**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */;var e=r(d[0]),t=r(d[1]),n=r(d[2]),s=r(d[3]);
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
class o{constructor(e){this.container=e}getPlatformInfoString(){return this.container.getProviders().map(e=>{if(function(e){const t=e.getComponent();return"VERSION"===(null==t?void 0:t.type)}(e)){const t=e.getImmediate();return`${t.library}/${t.version}`}return null}).filter(e=>e).join(" ")}}const c="@firebase/app",l="0.10.5",p=new t.Logger("@firebase/app"),h="@firebase/app-compat",f="@firebase/analytics-compat",u="@firebase/analytics",b="@firebase/app-check-compat",v="@firebase/app-check",_="@firebase/auth",w="@firebase/auth-compat",C="@firebase/database",D="@firebase/database-compat",y="@firebase/functions",E="@firebase/functions-compat",O="@firebase/installations",S="@firebase/installations-compat",A="@firebase/messaging",I="@firebase/messaging-compat",P="@firebase/performance",F="@firebase/performance-compat",N="@firebase/remote-config",$="@firebase/remote-config-compat",j="@firebase/storage",R="@firebase/storage-compat",k="@firebase/firestore",x="@firebase/vertexai-preview",B="@firebase/firestore-compat",M="firebase",H=_e._DEFAULT_ENTRY_NAME="[DEFAULT]",L={[c]:"fire-core",[h]:"fire-core-compat",[u]:"fire-analytics",[f]:"fire-analytics-compat",[v]:"fire-app-check",[b]:"fire-app-check-compat",[_]:"fire-auth",[w]:"fire-auth-compat",[C]:"fire-rtdb",[D]:"fire-rtdb-compat",[y]:"fire-fn",[E]:"fire-fn-compat",[O]:"fire-iid",[S]:"fire-iid-compat",[A]:"fire-fcm",[I]:"fire-fcm-compat",[P]:"fire-perf",[F]:"fire-perf-compat",[N]:"fire-rc",[$]:"fire-rc-compat",[j]:"fire-gcs",[R]:"fire-gcs-compat",[k]:"fire-fst",[B]:"fire-fst-compat",[x]:"fire-vertex","fire-js":"fire-js",[M]:"fire-js-all"},z=_e._apps=new Map,T=_e._serverApps=new Map,U=_e._components=new Map;function V(e,t){try{e.container.addComponent(t)}catch(n){p.debug(`Component ${t.name} failed to register with FirebaseApp ${e.name}`,n)}}function J(e){const t=e.name;if(U.has(t))return p.debug(`There were multiple attempts to register component ${t}.`),!1;U.set(t,e);for(const t of z.values())V(t,e);for(const t of T.values())V(t,e);return!0}function K(e,t){const n=e.container.getProvider("heartbeat").getImmediate({optional:!0});return n&&n.triggerHeartbeat(),e.container.getProvider(t)}function q(e){return void 0!==e.options}const W={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},Y=new n.ErrorFactory("app","Firebase",W);
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
class G{constructor(t,n,s){this._isDeleted=!1,this._options=Object.assign({},t),this._config=Object.assign({},n),this._name=n.name,this._automaticDataCollectionEnabled=n.automaticDataCollectionEnabled,this._container=s,this.container.addComponent(new e.Component("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.checkDestroyed(),this._automaticDataCollectionEnabled=e}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(e){this._isDeleted=e}checkDestroyed(){if(this.isDeleted)throw Y.create("app-deleted",{appName:this._name})}}
/**
   * @license
   * Copyright 2023 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */class Q extends G{constructor(e,t,n,s){const o=void 0!==t.automaticDataCollectionEnabled&&t.automaticDataCollectionEnabled,p={name:n,automaticDataCollectionEnabled:o};if(void 0!==e.apiKey)super(e,p,s);else{super(e.options,p,s)}this._serverConfig=Object.assign({automaticDataCollectionEnabled:o},t),this._finalizationRegistry=new FinalizationRegistry(()=>{this.automaticCleanup()}),this._refCount=0,this.incRefCount(this._serverConfig.releaseOnDeref),this._serverConfig.releaseOnDeref=void 0,t.releaseOnDeref=void 0,ee(c,l,"serverapp")}toJSON(){}get refCount(){return this._refCount}incRefCount(e){this.isDeleted||(this._refCount++,void 0!==e&&this._finalizationRegistry.register(e,this))}decRefCount(){return this.isDeleted?0:--this._refCount}automaticCleanup(){Z(this)}get settings(){return this.checkDestroyed(),this._serverConfig}checkDestroyed(){if(this.isDeleted)throw Y.create("server-app-deleted")}}
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */_e.SDK_VERSION="10.12.2";function X(t,s={}){let o=t;if("object"!=typeof s){s={name:s}}const c=Object.assign({name:H,automaticDataCollectionEnabled:!1},s),l=c.name;if("string"!=typeof l||!l)throw Y.create("bad-app-name",{appName:String(l)});if(o||(o=(0,n.getDefaultAppConfig)()),!o)throw Y.create("no-options");const p=z.get(l);if(p){if((0,n.deepEqual)(o,p.options)&&(0,n.deepEqual)(c,p.config))return p;throw Y.create("duplicate-app",{appName:l})}const h=new e.ComponentContainer(l);for(const e of U.values())h.addComponent(e);const f=new G(o,c,h);return z.set(l,f),f}async function Z(e){let t=!1;const n=e.name;if(z.has(n))t=!0,z.delete(n);else if(T.has(n)){e.decRefCount()<=0&&(T.delete(n),t=!0)}t&&(await Promise.all(e.container.getProviders().map(e=>e.delete())),e.isDeleted=!0)}function ee(t,n,s){var o;let c=null!==(o=L[t])&&void 0!==o?o:t;s&&(c+=`-${s}`);const l=c.match(/\s|\//),h=n.match(/\s|\//);if(l||h){const e=[`Unable to register library "${c}" with version "${n}":`];return l&&e.push(`library name "${c}" contains illegal characters (whitespace or "/")`),l&&h&&e.push("and"),h&&e.push(`version name "${n}" contains illegal characters (whitespace or "/")`),void p.warn(e.join(" "))}J(new e.Component(`${c}-version`,()=>({library:c,version:n}),"VERSION"))}const te="firebase-heartbeat-store";let ae=null;function re(){return ae||(ae=(0,s.openDB)("firebase-heartbeat-database",1,{upgrade:(e,t)=>{if(0===t)try{e.createObjectStore(te)}catch(e){}}}).catch(e=>{throw Y.create("idb-open",{originalErrorMessage:e.message})})),ae}async function ne(e,t){try{const n=(await re()).transaction(te,"readwrite"),s=n.objectStore(te);await s.put(t,ie(e)),await n.done}catch(e){if(e instanceof n.FirebaseError)p.warn(e.message);else{const t=Y.create("idb-set",{originalErrorMessage:null==e?void 0:e.message});p.warn(t.message)}}}function ie(e){return`${e.name}!${e.options.appId}`}
/**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */class se{constructor(e){this.container=e,this._heartbeatsCache=null;const t=this.container.getProvider("app").getImmediate();this._storage=new ce(t),this._heartbeatsCachePromise=this._storage.read().then(e=>(this._heartbeatsCache=e,e))}async triggerHeartbeat(){var e,t;const n=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),s=oe();if((null!=(null===(e=this._heartbeatsCache)||void 0===e?void 0:e.heartbeats)||(this._heartbeatsCache=await this._heartbeatsCachePromise,null!=(null===(t=this._heartbeatsCache)||void 0===t?void 0:t.heartbeats)))&&this._heartbeatsCache.lastSentHeartbeatDate!==s&&!this._heartbeatsCache.heartbeats.some(e=>e.date===s))return this._heartbeatsCache.heartbeats.push({date:s,agent:n}),this._heartbeatsCache.heartbeats=this._heartbeatsCache.heartbeats.filter(e=>{const t=new Date(e.date).valueOf();return Date.now()-t<=2592e6}),this._storage.overwrite(this._heartbeatsCache)}async getHeartbeatsHeader(){var e;if(null===this._heartbeatsCache&&await this._heartbeatsCachePromise,null==(null===(e=this._heartbeatsCache)||void 0===e?void 0:e.heartbeats)||0===this._heartbeatsCache.heartbeats.length)return"";const t=oe(),{heartbeatsToSend:s,unsentEntries:o}=function(e,t=1024){const n=[];let s=e.slice();for(const o of e){const e=n.find(e=>e.agent===o.agent);if(e){if(e.dates.push(o.date),le(n)>t){e.dates.pop();break}}else if(n.push({agent:o.agent,dates:[o.date]}),le(n)>t){n.pop();break}s=s.slice(1)}return{heartbeatsToSend:n,unsentEntries:s}}(this._heartbeatsCache.heartbeats),c=(0,n.base64urlEncodeWithoutPadding)(JSON.stringify({version:2,heartbeats:s}));return this._heartbeatsCache.lastSentHeartbeatDate=t,o.length>0?(this._heartbeatsCache.heartbeats=o,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),c}}function oe(){return(new Date).toISOString().substring(0,10)}class ce{constructor(e){this.app=e,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return!!(0,n.isIndexedDBAvailable)()&&(0,n.validateIndexedDBOpenable)().then(()=>!0).catch(()=>!1)}async read(){if(await this._canUseIndexedDBPromise){const e=await async function(e){try{const t=(await re()).transaction(te),n=await t.objectStore(te).get(ie(e));return await t.done,n}catch(e){if(e instanceof n.FirebaseError)p.warn(e.message);else{const t=Y.create("idb-get",{originalErrorMessage:null==e?void 0:e.message});p.warn(t.message)}}}(this.app);return(null==e?void 0:e.heartbeats)?e:{heartbeats:[]}}return{heartbeats:[]}}async overwrite(e){var t;if(await this._canUseIndexedDBPromise){const n=await this.read();return ne(this.app,{lastSentHeartbeatDate:null!==(t=e.lastSentHeartbeatDate)&&void 0!==t?t:n.lastSentHeartbeatDate,heartbeats:e.heartbeats})}}async add(e){var t;if(await this._canUseIndexedDBPromise){const n=await this.read();return ne(this.app,{lastSentHeartbeatDate:null!==(t=e.lastSentHeartbeatDate)&&void 0!==t?t:n.lastSentHeartbeatDate,heartbeats:[...n.heartbeats,...e.heartbeats]})}}}function le(e){return(0,n.base64urlEncodeWithoutPadding)(JSON.stringify({version:2,heartbeats:e})).length}
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */var pe;pe="",J(new e.Component("platform-logger",e=>new o(e),"PRIVATE")),J(new e.Component("heartbeat",e=>new se(e),"PRIVATE")),ee(c,l,pe),ee(c,l,"esm2017"),ee("fire-js","")},783,[784,519,785,520]);
__d(function(g,r,i,a,m,_e,d){Object.defineProperty(_e,"__esModule",{value:!0}),_e.Provider=_e.ComponentContainer=_e.Component=void 0;var t=r(d[0]);
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
_e.Component=class{constructor(t,e,n){this.name=t,this.instanceFactory=e,this.type=n,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(t){return this.instantiationMode=t,this}setMultipleInstances(t){return this.multipleInstances=t,this}setServiceProps(t){return this.serviceProps=t,this}setInstanceCreatedCallback(t){return this.onInstanceCreated=t,this}};const e="[DEFAULT]";
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */class n{constructor(t,e){this.name=t,this.container=e,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(e){const n=this.normalizeInstanceIdentifier(e);if(!this.instancesDeferred.has(n)){const e=new t.Deferred;if(this.instancesDeferred.set(n,e),this.isInitialized(n)||this.shouldAutoInitialize())try{const t=this.getOrInitializeService({instanceIdentifier:n});t&&e.resolve(t)}catch(t){}}return this.instancesDeferred.get(n).promise}getImmediate(t){var e;const n=this.normalizeInstanceIdentifier(null==t?void 0:t.identifier),s=null!==(e=null==t?void 0:t.optional)&&void 0!==e&&e;if(!this.isInitialized(n)&&!this.shouldAutoInitialize()){if(s)return null;throw Error(`Service ${this.name} is not available`)}try{return this.getOrInitializeService({instanceIdentifier:n})}catch(t){if(s)return null;throw t}}getComponent(){return this.component}setComponent(t){if(t.name!==this.name)throw Error(`Mismatching Component ${t.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=t,this.shouldAutoInitialize()){if(function(t){return"EAGER"===t.instantiationMode}
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */(t))try{this.getOrInitializeService({instanceIdentifier:e})}catch(t){}for(const[t,e]of this.instancesDeferred.entries()){const n=this.normalizeInstanceIdentifier(t);try{const t=this.getOrInitializeService({instanceIdentifier:n});e.resolve(t)}catch(t){}}}}clearInstance(t=e){this.instancesDeferred.delete(t),this.instancesOptions.delete(t),this.instances.delete(t)}async delete(){const t=Array.from(this.instances.values());await Promise.all([...t.filter(t=>"INTERNAL"in t).map(t=>t.INTERNAL.delete()),...t.filter(t=>"_delete"in t).map(t=>t._delete())])}isComponentSet(){return null!=this.component}isInitialized(t=e){return this.instances.has(t)}getOptions(t=e){return this.instancesOptions.get(t)||{}}initialize(t={}){const{options:e={}}=t,n=this.normalizeInstanceIdentifier(t.instanceIdentifier);if(this.isInitialized(n))throw Error(`${this.name}(${n}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const s=this.getOrInitializeService({instanceIdentifier:n,options:e});for(const[t,e]of this.instancesDeferred.entries()){n===this.normalizeInstanceIdentifier(t)&&e.resolve(s)}return s}onInit(t,e){var n;const s=this.normalizeInstanceIdentifier(e),o=null!==(n=this.onInitCallbacks.get(s))&&void 0!==n?n:new Set;o.add(t),this.onInitCallbacks.set(s,o);const c=this.instances.get(s);return c&&t(c,s),()=>{o.delete(t)}}invokeOnInitCallbacks(t,e){const n=this.onInitCallbacks.get(e);if(n)for(const s of n)try{s(t,e)}catch(t){}}getOrInitializeService({instanceIdentifier:t,options:n={}}){let s=this.instances.get(t);if(!s&&this.component&&(s=this.component.instanceFactory(this.container,{instanceIdentifier:(o=t,o===e?void 0:o),options:n}),this.instances.set(t,s),this.instancesOptions.set(t,n),this.invokeOnInitCallbacks(s,t),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,t,s)}catch(t){}var o;return s||null}normalizeInstanceIdentifier(t=e){return this.component?this.component.multipleInstances?t:e:t}shouldAutoInitialize(){return!!this.component&&"EXPLICIT"!==this.component.instantiationMode}}_e.Provider=n;_e.ComponentContainer=class{constructor(t){this.name=t,this.providers=new Map}addComponent(t){const e=this.getProvider(t.name);if(e.isComponentSet())throw new Error(`Component ${t.name} has already been registered with ${this.name}`);e.setComponent(t)}addOrOverwriteComponent(t){this.getProvider(t.name).isComponentSet()&&this.providers.delete(t.name),this.addComponent(t)}getProvider(t){if(this.providers.has(t))return this.providers.get(t);const e=new n(t,this);return this.providers.set(t,e),e}getProviders(){return Array.from(this.providers.values())}}},784,[785]);
__d(function(g,_r,_i,_a2,m,_e,_d){Object.defineProperty(_e,"__esModule",{value:!0}),_e.Sha1=_e.RANDOM_FACTOR=_e.MAX_VALUE_MILLIS=_e.FirebaseError=_e.ErrorFactory=_e.Deferred=_e.DecodeBase64StringError=_e.CONSTANTS=void 0,_e.areCookiesEnabled=function(){if("undefined"==typeof navigator||!navigator.cookieEnabled)return!1;return!0}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */,_e.assertionError=_e.assert=void 0,_e.async=function(t,e){return(...r)=>{Promise.resolve(!0).then(()=>{t(...r)}).catch(t=>{e&&e(t)})}},_e.base64urlEncodeWithoutPadding=_e.base64Encode=_e.base64Decode=_e.base64=void 0,_e.calculateBackoffMillis=function(t,e=T,r=w){const n=e*Math.pow(r,t),o=Math.round(M*n*(Math.random()-.5)*2);return Math.min(N,n+o)}
/**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */,_e.contains=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},_e.createMockUserToken=function(t,e){if(t.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');const r=e||"demo-project",n=t.iat||0,o=t.sub||t.user_id;if(!o)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");const i=Object.assign({iss:`https://securetoken.google.com/${r}`,aud:r,iat:n,exp:n+3600,auth_time:n,sub:o,user_id:o,firebase:{sign_in_provider:"custom",identities:{}}},t);return[a(JSON.stringify({alg:"none",type:"JWT"})),a(JSON.stringify(i)),""].join(".")}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */,_e.createSubscribe=function(t,e){const r=new C(t,e);return r.subscribe.bind(r)},_e.decode=void 0,_e.deepCopy=function(t){return u(void 0,t)},_e.deepEqual=function t(e,r){if(e===r)return!0;const n=Object.keys(e),o=Object.keys(r);for(const i of n){if(!o.includes(i))return!1;const n=e[i],s=r[i];if(O(n)&&O(s)){if(!t(n,s))return!1}else if(n!==s)return!1}for(const t of o)if(!n.includes(t))return!1;return!0},_e.deepExtend=u,_e.errorPrefix=D,_e.extractQuerystring=function(t){const e=t.indexOf("?");if(!e)return"";const r=t.indexOf("#",e);return t.substring(e,r>0?r:void 0)}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */,_e.getExperimentalSetting=_e.getDefaults=_e.getDefaultEmulatorHostnameAndPort=_e.getDefaultEmulatorHost=_e.getDefaultAppConfig=void 0,_e.getGlobal=f,_e.getModularInstance=
/**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
function(t){return t&&t._delegate?t._delegate:t},_e.getUA=b,_e.isAdmin=void 0,_e.isBrowser=function(){return"object"==typeof self&&self.self===self},_e.isBrowserExtension=function(){const t="object"==typeof chrome?chrome.runtime:"object"==typeof browser?browser.runtime:void 0;return"object"==typeof t&&void 0!==t.id},_e.isElectron=function(){return b().indexOf("Electron/")>=0},_e.isEmpty=function(t){for(const e in t)if(Object.prototype.hasOwnProperty.call(t,e))return!1;return!0},_e.isIE=function(){const t=b();return t.indexOf("MSIE ")>=0||t.indexOf("Trident/")>=0},_e.isIndexedDBAvailable=function(){try{return"object"==typeof indexedDB}catch(t){return!1}},_e.isMobileCordova=function(){return!!(window.cordova||window.phonegap||window.PhoneGap)&&/ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(b())},_e.isNode=_,_e.isNodeSdk=function(){return!0===t.NODE_CLIENT||!0===t.NODE_ADMIN},_e.isReactNative=function(){return"object"==typeof navigator&&"ReactNative"===navigator.product},_e.isSafari=function(){return!_()&&!!navigator.userAgent&&navigator.userAgent.includes("Safari")&&!navigator.userAgent.includes("Chrome")},_e.isUWP=function(){return b().indexOf("MSAppHost/")>=0},_e.issuedAtTime=_e.isValidTimestamp=_e.isValidFormat=void 0,_e.jsonEval=S,_e.map=function(t,e,r){const n={};for(const o in t)Object.prototype.hasOwnProperty.call(t,o)&&(n[o]=e.call(r,t[o],o,t));return n},_e.ordinal=function(t){if(!Number.isFinite(t))return`${t}`;return t+function(t){t=Math.abs(t);const e=t%100;if(e>=10&&e<=20)return"th";const r=t%10;if(1===r)return"st";if(2===r)return"nd";if(3===r)return"rd";return"th"}(t)},_e.promiseWithTimeout=
/**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
function(t,e=2e3){const r=new p;return setTimeout(()=>r.reject("timeout!"),e),t.then(r.resolve,r.reject),r.promise}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */,_e.querystring=function(t){const e=[];for(const[r,n]of Object.entries(t))Array.isArray(n)?n.forEach(t=>{e.push(encodeURIComponent(r)+"="+encodeURIComponent(t))}):e.push(encodeURIComponent(r)+"="+encodeURIComponent(n));return e.length?"&"+e.join("&"):""},_e.querystringDecode=function(t){const e={},r=t.replace(/^\?/,"").split("&");return r.forEach(t=>{if(t){const[r,n]=t.split("=");e[decodeURIComponent(r)]=decodeURIComponent(n)}}),e},_e.safeGet=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)?t[e]:void 0},_e.stringToByteArray=_e.stringLength=void 0,_e.stringify=function(t){return JSON.stringify(t)}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */,_e.validateArgCount=_e.uuidv4=void 0,_e.validateCallback=function(t,e,r,n){if(n&&!r)return;if("function"!=typeof r)throw new Error(D(t,e)+"must be a valid function.")},_e.validateContextObject=function(t,e,r,n){if(n&&!r)return;if("object"!=typeof r||null===r)throw new Error(D(t,e)+"must be a valid context object.")}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */,_e.validateIndexedDBOpenable=function(){return new Promise((t,e)=>{try{let r=!0;const n="validate-browser-context-for-indexeddb-analytics-module",o=self.indexedDB.open(n);o.onsuccess=()=>{o.result.close(),r||self.indexedDB.deleteDatabase(n),t(!0)},o.onupgradeneeded=()=>{r=!1},o.onerror=()=>{var t;e((null===(t=o.error)||void 0===t?void 0:t.message)||"")}}catch(t){e(t)}})},_e.validateNamespace=function(t,e,r){if(r&&!e)return;if("string"!=typeof e)throw new Error(D(t,"namespace")+"must be a valid firebase namespace.")};
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
const t=_e.CONSTANTS={NODE_CLIENT:!1,NODE_ADMIN:!1,SDK_VERSION:"${JSCORE_VERSION}"},e=function(t,e){if(!t)throw r(e)};
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */_e.assert=e;const r=function(e){return new Error("Firebase Database ("+t.SDK_VERSION+") INTERNAL ASSERT FAILED: "+e)};
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */_e.assertionError=r;const n=function(t){const e=[];let r=0;for(let n=0;n<t.length;n++){let o=t.charCodeAt(n);o<128?e[r++]=o:o<2048?(e[r++]=o>>6|192,e[r++]=63&o|128):55296==(64512&o)&&n+1<t.length&&56320==(64512&t.charCodeAt(n+1))?(o=65536+((1023&o)<<10)+(1023&t.charCodeAt(++n)),e[r++]=o>>18|240,e[r++]=o>>12&63|128,e[r++]=o>>6&63|128,e[r++]=63&o|128):(e[r++]=o>>12|224,e[r++]=o>>6&63|128,e[r++]=63&o|128)}return e},o=_e.base64={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:"function"==typeof atob,encodeByteArray(t,e){if(!Array.isArray(t))throw Error("encodeByteArray takes an array as a parameter");this.init_();const r=e?this.byteToCharMapWebSafe_:this.byteToCharMap_,n=[];for(let e=0;e<t.length;e+=3){const o=t[e],i=e+1<t.length,s=i?t[e+1]:0,a=e+2<t.length,c=a?t[e+2]:0,u=o>>2,h=(3&o)<<4|s>>4;let f=(15&s)<<2|c>>6,l=63&c;a||(l=64,i||(f=64)),n.push(r[u],r[h],r[f],r[l])}return n.join("")},encodeString(t,e){return this.HAS_NATIVE_SUPPORT&&!e?btoa(t):this.encodeByteArray(n(t),e)},decodeString(t,e){return this.HAS_NATIVE_SUPPORT&&!e?atob(t):function(t){const e=[];let r=0,n=0;for(;r<t.length;){const o=t[r++];if(o<128)e[n++]=String.fromCharCode(o);else if(o>191&&o<224){const i=t[r++];e[n++]=String.fromCharCode((31&o)<<6|63&i)}else if(o>239&&o<365){const i=((7&o)<<18|(63&t[r++])<<12|(63&t[r++])<<6|63&t[r++])-65536;e[n++]=String.fromCharCode(55296+(i>>10)),e[n++]=String.fromCharCode(56320+(1023&i))}else{const i=t[r++],s=t[r++];e[n++]=String.fromCharCode((15&o)<<12|(63&i)<<6|63&s)}}return e.join("")}(this.decodeStringToByteArray(t,e))},decodeStringToByteArray(t,e){this.init_();const r=e?this.charToByteMapWebSafe_:this.charToByteMap_,n=[];for(let e=0;e<t.length;){const o=r[t.charAt(e++)],s=e<t.length?r[t.charAt(e)]:0;++e;const a=e<t.length?r[t.charAt(e)]:64;++e;const c=e<t.length?r[t.charAt(e)]:64;if(++e,null==o||null==s||null==a||null==c)throw new i;const u=o<<2|s>>4;if(n.push(u),64!==a){const t=s<<4&240|a>>2;if(n.push(t),64!==c){const t=a<<6&192|c;n.push(t)}}}return n},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let t=0;t<this.ENCODED_VALS.length;t++)this.byteToCharMap_[t]=this.ENCODED_VALS.charAt(t),this.charToByteMap_[this.byteToCharMap_[t]]=t,this.byteToCharMapWebSafe_[t]=this.ENCODED_VALS_WEBSAFE.charAt(t),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[t]]=t,t>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(t)]=t,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(t)]=t)}}};class i extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}_e.DecodeBase64StringError=i;const s=function(t){const e=n(t);return o.encodeByteArray(e,!0)};_e.base64Encode=s;const a=function(t){return s(t).replace(/\./g,"")};_e.base64urlEncodeWithoutPadding=a;const c=function(t){try{return o.decodeString(t,!0)}catch(t){}return null};
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function u(t,e){if(!(e instanceof Object))return e;switch(e.constructor){case Date:return new Date(e.getTime());case Object:void 0===t&&(t={});break;case Array:t=[];break;default:return e}for(const r in e)e.hasOwnProperty(r)&&h(r)&&(t[r]=u(t[r],e[r]));return t}function h(t){return"__proto__"!==t}
/**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function f(){return"undefined"!=typeof self?self:window}
/**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */_e.base64Decode=c;const l=()=>{try{return f().__FIREBASE_DEFAULTS__||(()=>{if("undefined"==typeof process||void 0===process.env)return;const t=process.env.__FIREBASE_DEFAULTS__;return t?JSON.parse(t):void 0})()||(()=>{if("undefined"==typeof document)return;let t;try{t=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch(t){return}const e=t&&c(t[1]);return e&&JSON.parse(e)})()}catch(t){return}};_e.getDefaults=l;const d=t=>{var e,r;return null===(r=null===(e=l())||void 0===e?void 0:e.emulatorHosts)||void 0===r?void 0:r[t]};_e.getDefaultEmulatorHost=d;_e.getDefaultEmulatorHostnameAndPort=t=>{const e=d(t);if(!e)return;const r=e.lastIndexOf(":");if(r<=0||r+1===e.length)throw new Error(`Invalid host ${e} with no separate hostname and port!`);const n=parseInt(e.substring(r+1),10);return"["===e[0]?[e.substring(1,r-1),n]:[e.substring(0,r),n]};_e.getDefaultAppConfig=()=>{var t;return null===(t=l())||void 0===t?void 0:t.config};
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
_e.getExperimentalSetting=t=>{var e;return null===(e=l())||void 0===e?void 0:e[`_${t}`]};class p{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((t,e)=>{this.resolve=t,this.reject=e})}wrapCallback(t){return(e,r)=>{e?this.reject(e):this.resolve(r),"function"==typeof t&&(this.promise.catch(()=>{}),1===t.length?t(e):t(e,r))}}}
/**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function b(){return"undefined"!=typeof navigator&&"string"==typeof navigator.userAgent?navigator.userAgent:""}function _(){var t;const e=null===(t=l())||void 0===t?void 0:t.forceEnvironment;if("node"===e)return!0;if("browser"===e)return!1;try{return"[object process]"===Object.prototype.toString.call(g.process)}catch(t){return!1}}_e.Deferred=p;class y extends Error{constructor(t,e,r){super(e),this.code=t,this.customData=r,this.name="FirebaseError",Object.setPrototypeOf(this,y.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,v.prototype.create)}}_e.FirebaseError=y;class v{constructor(t,e,r){this.service=t,this.serviceName=e,this.errors=r}create(t,...e){const r=e[0]||{},n=`${this.service}/${t}`,o=this.errors[t],i=o?function(t,e){return t.replace(E,(t,r)=>{const n=e[r];return null!=n?String(n):`<${r}?>`})}(o,r):"Error",s=`${this.serviceName}: ${i} (${n}).`;return new y(n,s,r)}}_e.ErrorFactory=v;const E=/\{\$([^}]+)}/g;
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function S(t){return JSON.parse(t)}const A=function(t){let e={},r={},n={},o="";try{const i=t.split(".");e=S(c(i[0])||""),r=S(c(i[1])||""),o=i[2],n=r.d||{},delete r.d}catch(t){}return{header:e,claims:r,data:n,signature:o}};_e.decode=A;_e.isValidTimestamp=function(t){const e=A(t).claims,r=Math.floor((new Date).getTime()/1e3);let n=0,o=0;return"object"==typeof e&&(e.hasOwnProperty("nbf")?n=e.nbf:e.hasOwnProperty("iat")&&(n=e.iat),o=e.hasOwnProperty("exp")?e.exp:n+86400),!!r&&!!n&&!!o&&r>=n&&r<=o};_e.issuedAtTime=function(t){const e=A(t).claims;return"object"==typeof e&&e.hasOwnProperty("iat")?e.iat:null};_e.isValidFormat=function(t){const e=A(t).claims;return!!e&&"object"==typeof e&&e.hasOwnProperty("iat")};function O(t){return null!==t&&"object"==typeof t}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
_e.isAdmin=function(t){const e=A(t).claims;return"object"==typeof e&&!0===e.admin};_e.Sha1=class{constructor(){this.chain_=[],this.buf_=[],this.W_=[],this.pad_=[],this.inbuf_=0,this.total_=0,this.blockSize=64,this.pad_[0]=128;for(let t=1;t<this.blockSize;++t)this.pad_[t]=0;this.reset()}reset(){this.chain_[0]=1732584193,this.chain_[1]=4023233417,this.chain_[2]=2562383102,this.chain_[3]=271733878,this.chain_[4]=3285377520,this.inbuf_=0,this.total_=0}compress_(t,e){e||(e=0);const r=this.W_;if("string"==typeof t)for(let n=0;n<16;n++)r[n]=t.charCodeAt(e)<<24|t.charCodeAt(e+1)<<16|t.charCodeAt(e+2)<<8|t.charCodeAt(e+3),e+=4;else for(let n=0;n<16;n++)r[n]=t[e]<<24|t[e+1]<<16|t[e+2]<<8|t[e+3],e+=4;for(let t=16;t<80;t++){const e=r[t-3]^r[t-8]^r[t-14]^r[t-16];r[t]=4294967295&(e<<1|e>>>31)}let n,o,i=this.chain_[0],s=this.chain_[1],a=this.chain_[2],c=this.chain_[3],u=this.chain_[4];for(let t=0;t<80;t++){t<40?t<20?(n=c^s&(a^c),o=1518500249):(n=s^a^c,o=1859775393):t<60?(n=s&a|c&(s|a),o=2400959708):(n=s^a^c,o=3395469782);const e=(i<<5|i>>>27)+n+u+o+r[t]&4294967295;u=c,c=a,a=4294967295&(s<<30|s>>>2),s=i,i=e}this.chain_[0]=this.chain_[0]+i&4294967295,this.chain_[1]=this.chain_[1]+s&4294967295,this.chain_[2]=this.chain_[2]+a&4294967295,this.chain_[3]=this.chain_[3]+c&4294967295,this.chain_[4]=this.chain_[4]+u&4294967295}update(t,e){if(null==t)return;void 0===e&&(e=t.length);const r=e-this.blockSize;let n=0;const o=this.buf_;let i=this.inbuf_;for(;n<e;){if(0===i)for(;n<=r;)this.compress_(t,n),n+=this.blockSize;if("string"==typeof t){for(;n<e;)if(o[i]=t.charCodeAt(n),++i,++n,i===this.blockSize){this.compress_(o),i=0;break}}else for(;n<e;)if(o[i]=t[n],++i,++n,i===this.blockSize){this.compress_(o),i=0;break}}this.inbuf_=i,this.total_+=e}digest(){const t=[];let e=8*this.total_;this.inbuf_<56?this.update(this.pad_,56-this.inbuf_):this.update(this.pad_,this.blockSize-(this.inbuf_-56));for(let t=this.blockSize-1;t>=56;t--)this.buf_[t]=255&e,e/=256;this.compress_(this.buf_);let r=0;for(let e=0;e<5;e++)for(let n=24;n>=0;n-=8)t[r]=this.chain_[e]>>n&255,++r;return t}};class C{constructor(t,e){this.observers=[],this.unsubscribes=[],this.observerCount=0,this.task=Promise.resolve(),this.finalized=!1,this.onNoObservers=e,this.task.then(()=>{t(this)}).catch(t=>{this.error(t)})}next(t){this.forEachObserver(e=>{e.next(t)})}error(t){this.forEachObserver(e=>{e.error(t)}),this.close(t)}complete(){this.forEachObserver(t=>{t.complete()}),this.close()}subscribe(t,e,r){let n;if(void 0===t&&void 0===e&&void 0===r)throw new Error("Missing Observer.");n=function(t,e){if("object"!=typeof t||null===t)return!1;for(const r of e)if(r in t&&"function"==typeof t[r])return!0;return!1}(t,["next","error","complete"])?t:{next:t,error:e,complete:r},void 0===n.next&&(n.next=x),void 0===n.error&&(n.error=x),void 0===n.complete&&(n.complete=x);const o=this.unsubscribeOne.bind(this,this.observers.length);return this.finalized&&this.task.then(()=>{try{this.finalError?n.error(this.finalError):n.complete()}catch(t){}}),this.observers.push(n),o}unsubscribeOne(t){void 0!==this.observers&&void 0!==this.observers[t]&&(delete this.observers[t],this.observerCount-=1,0===this.observerCount&&void 0!==this.onNoObservers&&this.onNoObservers(this))}forEachObserver(t){if(!this.finalized)for(let e=0;e<this.observers.length;e++)this.sendOne(e,t)}sendOne(t,e){this.task.then(()=>{if(void 0!==this.observers&&void 0!==this.observers[t])try{e(this.observers[t])}catch(t){"undefined"!=typeof console&&console.error}})}close(t){this.finalized||(this.finalized=!0,void 0!==t&&(this.finalError=t),this.task.then(()=>{this.observers=void 0,this.onNoObservers=void 0}))}}function x(){}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function D(t,e){return`${t} failed: ${e} argument `}_e.validateArgCount=function(t,e,r,n){let o;if(n<e?o="at least "+e:n>r&&(o=0===r?"none":"no more than "+r),o){throw new Error(t+" failed: Was called with "+n+(1===n?" argument.":" arguments.")+" Expects "+o+".")}};_e.stringToByteArray=function(t){const r=[];let n=0;for(let o=0;o<t.length;o++){let i=t.charCodeAt(o);if(i>=55296&&i<=56319){const r=i-55296;o++,e(o<t.length,"Surrogate pair missing trail surrogate.");i=65536+(r<<10)+(t.charCodeAt(o)-56320)}i<128?r[n++]=i:i<2048?(r[n++]=i>>6|192,r[n++]=63&i|128):i<65536?(r[n++]=i>>12|224,r[n++]=i>>6&63|128,r[n++]=63&i|128):(r[n++]=i>>18|240,r[n++]=i>>12&63|128,r[n++]=i>>6&63|128,r[n++]=63&i|128)}return r};
/**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
_e.stringLength=function(t){let e=0;for(let r=0;r<t.length;r++){const n=t.charCodeAt(r);n<128?e++:n<2048?e+=2:n>=55296&&n<=56319?(e+=4,r++):e+=3}return e};
/**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
_e.uuidv4=function(){return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,t=>{const e=16*Math.random()|0;return("x"===t?e:3&e|8).toString(16)})};const T=1e3,w=2,N=_e.MAX_VALUE_MILLIS=144e5,M=_e.RANDOM_FACTOR=.5},785,[]);
__d(function(g,r,i,a,m,e,d){var t=r(d[0]);Object.defineProperty(e,"__esModule",{value:!0}),e.default=void 0;var u=t(r(d[1]));e.default=new u.default},786,[1,787]);
__d(function(g,r,i,a,m,e,d){Object.defineProperty(e,"__esModule",{value:!0}),e.default=void 0;e.default=class{#e={};addListener(t,n,s){if("function"!=typeof n)throw new TypeError("EventEmitter.addListener(...): 2nd argument must be a function.");const l=function(t,n){let s=t[n];null==s&&(s=new Set,t[n]=s);return s}(this.#e,t),o={context:s,listener:n,remove(){l.delete(o)}};return l.add(o),o}emit(t,...n){const s=this.#e[t];if(null!=s)for(const t of Array.from(s))t.listener.apply(t.context,n)}removeAllListeners(t){null==t?this.#e={}:delete this.#e[t]}listenerCount(t){const n=this.#e[t];return null==n?0:n.size}}},787,[]);
__d(function(g,r,i,a,m,e,d){var t=r(d[0]);Object.defineProperty(e,"__esModule",{value:!0}),e.default=void 0;var n=r(d[1]),u=t(r(d[2]));let s=null;class l{constructor(t,n,u){this._app=t,this._nativeModule=null,this._customUrlOrRegion=u,this._config=Object.assign({},n)}get app(){return this._app}get firebaseJson(){return s||(s=JSON.parse((0,n.getAppModule)().FIREBASE_RAW_JSON),s)}get emitter(){return u.default}eventNameForApp(...t){return`${this.app.name}-${t.join("-")}`}get native(){return this._nativeModule||(this._nativeModule=(0,n.getNativeModule)(this)),this._nativeModule}}e.default=l,l.__extended__={}},788,[1,774,786]);
__d(function(g,r,_i,a,m,_e,d){var e=r(d[0]);Object.defineProperty(_e,"__esModule",{value:!0}),_e.deleteApp=b,_e.getApp=function(e=n.DEFAULT_APP_NAME){u||f();const t=p[e];if(!t)throw new Error(`No Firebase App '${e}' has been created - call firebase.initializeApp()`);return t},_e.getApps=function(){u||f();return Object.values(p)},_e.initializeApp=function(e={},o){let l=o;(0,t.isObject)(o)&&!(0,t.isNull)(o)||(l={name:o,automaticResourceManagement:!1,automaticDataCollectionEnabled:!0});(0,t.isUndefined)(l.name)&&(l.name=n.DEFAULT_APP_NAME);const{name:u}=l;if(!u||!(0,t.isString)(u))return Promise.reject(new Error(`Illegal App name: '${u}'`));if(p[u])return Promise.reject(new Error(`Firebase App named '${u}' already exists`));if(!(0,t.isObject)(e))return Promise.reject(new Error(`firebase.initializeApp(options, <- expects an Object but got '${typeof e}'`));if(!(0,t.isString)(e.apiKey))return Promise.reject(new Error("Missing or invalid FirebaseOptions property 'apiKey'."));if(!(0,t.isString)(e.appId))return Promise.reject(new Error("Missing or invalid FirebaseOptions property 'appId'."));if(!(0,t.isString)(e.databaseURL))return Promise.reject(new Error("Missing or invalid FirebaseOptions property 'databaseURL'."));if(!(0,t.isString)(e.messagingSenderId))return Promise.reject(new Error("Missing or invalid FirebaseOptions property 'messagingSenderId'."));if(!(0,t.isString)(e.projectId))return Promise.reject(new Error("Missing or invalid FirebaseOptions property 'projectId'."));if(!(0,t.isString)(e.storageBucket))return Promise.reject(new Error("Missing or invalid FirebaseOptions property 'storageBucket'."));const f=new i.default(e,l,!1,b.bind(null,u,!0));return p[u]=f,c(p[u]),(0,s.getAppModule)().initializeApp(e,l).then(()=>(f._initialized=!0,f)).catch(e=>{throw delete p[u],e})},_e.initializeNativeApps=f,_e.setLogLevel=function(e){if(!["error","warn","info","debug","verbose"].includes(e))throw new Error('LogLevel must be one of "error", "warn", "info", "debug", "verbose"');(t.isIOS||t.isOther)&&(0,s.getAppModule)().setLogLevel(e)},_e.setOnAppCreate=function(e){c=e},_e.setOnAppDestroy=function(e){l=e},_e.setReactNativeAsyncStorage=function(e){if(!(0,t.isObject)(e))throw new Error("firebase.setReactNativeAsyncStorage(*) 'asyncStorage' must be an object.");if(!(0,t.isFunction)(e.setItem))throw new Error("firebase.setReactNativeAsyncStorage(*) 'asyncStorage.setItem' must be a function.");if(!(0,t.isFunction)(e.getItem))throw new Error("firebase.setReactNativeAsyncStorage(*) 'asyncStorage.getItem' must be a function.");if(!(0,t.isFunction)(e.removeItem))throw new Error("firebase.setReactNativeAsyncStorage(*) 'asyncStorage.removeItem' must be a function.");(0,o.setReactNativeAsyncStorageInternal)(e)};var t=r(d[1]),i=e(r(d[2])),n=r(d[3]),o=r(d[4]),s=r(d[5]);const p={};let c=null,l=null,u=!1;function f(){const e=(0,s.getAppModule)(),{NATIVE_FIREBASE_APPS:t}=e;if(t&&t.length)for(let e=0;e<t.length;e++){const{appConfig:n,options:o}=t[e],{name:s}=n;p[s]=new i.default(o,n,!0,b.bind(null,s,!0)),c(p[s])}u=!0}function b(e,t){if(e===n.DEFAULT_APP_NAME&&t)return Promise.reject(new Error("Unable to delete the default native firebase app instance."));const i=p[e];if(void 0===i)throw new Error(`Firebase App named '${e}' already deleted`);return(0,s.getAppModule)().deleteApp(e).then(()=>{i._deleted=!0,l(i),delete p[e]})}},789,[1,763,773,775,790,774]);
__d(function(g,r,i,a,m,e,d){Object.defineProperty(e,"__esModule",{value:!0}),e.getItem=async function(t){return await s.getItem(n+t)},e.getReactNativeAsyncStorageInternal=async function(){return s},e.isMemoryStorage=function(){return s===o},e.prefix=e.memoryStorage=void 0,e.removeItem=async function(t){return await s.removeItem(n+t)},e.setItem=async function(t,o){return await s.setItem(n+t,o)},e.setReactNativeAsyncStorageInternal=function(t){s=t||o};const t=e.memoryStorage=new Map,n=e.prefix="@react-native-firebase:",o={setItem:(n,o)=>(t.set(n,o),Promise.resolve()),getItem:n=>t.has(n)?Promise.resolve(t.get(n)):Promise.resolve(null),removeItem:function(n){return t.delete(n),Promise.resolve()}};let s=o},790,[]);
__d(function(g,r,_i,a,m,e,d){var t=r(d[0]);Object.defineProperty(e,"__esModule",{value:!0}),e.createFirebaseRoot=_,e.createModuleNamespace=function(t={}){const{namespace:n,ModuleClass:o}=t;if(!c[n]){if(u.default.__extended__!==o.__extended__)throw new Error("INTERNAL ERROR: ModuleClass must be an instance of FirebaseModule.");c[n]=Object.assign({},t)}return N()[n]},e.firebaseAppModuleProxy=E,e.getFirebaseRoot=N;var n=r(d[1]),o=t(r(d[2])),s=t(r(d[3])),i=r(d[4]),u=t(r(d[5])),p=r(d[6]);let l=null;const c={},f={},b={},h={};function A(t,n){if(c[n])return function(t){if(h[t])return h[t];const{statics:n,hasMultiAppSupport:s,ModuleClass:u}=c[t];function l(n){const l=n||(0,p.getApp)();if(!(l instanceof o.default))throw new Error([`"firebase.${t}(app)" arg expects a FirebaseApp instance or undefined.`,"","Ensure the arg provided is a Firebase app instance; or no args to use the default Firebase app."].join("\r\n"));if(!s&&l.name!==i.DEFAULT_APP_NAME)throw new Error([`You attempted to call "firebase.${t}(app)" but; ${t} does not support multiple Firebase Apps.`,"",`Ensure the app provided is the default Firebase app only and not the "${l.name}" app.`].join("\r\n"));return f[l.name]||(f[l.name]={}),f[l.name][t]||(f[l.name][t]=new u(l,c[t])),f[l.name][t]}return Object.assign(l,n||{}),Object.freeze(l),h[t]=l,h[t]}(n);throw moduleWithDashes=n.split(/(?=[A-Z])/).join("-").toLowerCase(),new Error([`You attempted to use 'firebase.${n}' but this module could not be found.`,"",`Ensure you have installed and imported the '@react-native-firebase/${moduleWithDashes}' package.`].join("\r\n"))}function E(t,o){if(c[o])return t._checkDestroyed(),function(t,o){if(b[t.name]&&b[t.name][o])return b[t.name][o];b[t.name]||(b[t.name]={});const{hasCustomUrlOrRegionSupport:s,hasMultiAppSupport:u,ModuleClass:p}=c[o];if(!u&&t.name!==i.DEFAULT_APP_NAME)throw new Error([`You attempted to call "firebase.app('${t.name}').${o}" but; ${o} does not support multiple Firebase Apps.`,"",`Ensure you access ${o} from the default application only.`].join("\r\n"));return b[t.name][o]=function(s){void 0!==s&&(0,n.isString)(s);const i=s?`${s}:${o}`:o;return f[t.name]||(f[t.name]={}),f[t.name][i]||(f[t.name][i]=new p(t,c[o],s)),f[t.name][i]},b[t.name][o]}(t,o);throw moduleWithDashes=o.split(/(?=[A-Z])/).join("-").toLowerCase(),new Error([`You attempted to use "firebase.app('${t.name}').${o}" but this module could not be found.`,"",`Ensure you have installed and imported the '@react-native-firebase/${moduleWithDashes}' package.`].join("\r\n"))}function _(){l={initializeApp:p.initializeApp,setReactNativeAsyncStorage:p.setReactNativeAsyncStorage,get app(){return p.getApp},get apps(){return(0,p.getApps)()},SDK_VERSION:s.default,setLogLevel:p.setLogLevel};for(let t=0;t<i.KNOWN_NAMESPACES.length;t++){const n=i.KNOWN_NAMESPACES[t];Object.defineProperty(l,n,{enumerable:!1,get:A.bind(null,l,n)})}return l}function N(){return l||_()}(0,p.setOnAppCreate)(t=>{for(let n=0;n<i.KNOWN_NAMESPACES.length;n++){const o=i.KNOWN_NAMESPACES[n];Object.defineProperty(t,o,{enumerable:!1,get:E.bind(null,t,o)})}}),(0,p.setOnAppDestroy)(t=>{delete f[t.name],delete b[t.name]})},791,[1,763,773,792,775,788,789]);
__d(function(g,r,i,a,m,e,d){m.exports="20.5.0"},792,[]);
__d(function(g,r,i,a,m,e,d){Object.defineProperty(e,"__esModule",{value:!0}),e.default=function(s,o){const l={};if((0,t.isUndefined)(o)||!(0,t.isObject)(o))throw new Error("'remoteMessage' expected an object value");if(o.to){if(!(0,t.isString)(o.to))throw new Error("'remoteMessage.to' expected a string value");l.to=o.to}else l.to=`${s}@fcm.googleapis.com`;if(o.messageId){if(!(0,t.isString)(o.messageId))throw new Error("'remoteMessage.messageId' expected a string value");l.messageId=o.messageId}else l.messageId=(0,t.generateFirestoreId)();if((0,t.hasOwnProperty)(o,"ttl")){if(!(0,t.isNumber)(o.ttl))throw new Error("'remoteMessage.ttl' expected a number value");if(o.ttl<0||!(0,t.isInteger)(o.ttl))throw new Error("'remoteMessage.ttl' expected a positive integer value");l.ttl=o.ttl}else l.ttl=3600;if(o.data){if(!(0,t.isObject)(o.data))throw new Error("'remoteMessage.data' expected an object value");l.data={};for(let t in o.data)o.data.hasOwnProperty(t)&&("object"!=typeof o.data[t]||Array.isArray(o.data[t])||null===o.data[t]?l.data[t]=o.data[t]:l.data[t]=JSON.stringify(o.data[t]))}else l.data={};if(o.collapseKey){if(!(0,t.isString)(o.collapseKey))throw new Error("'remoteMessage.collapseKey' expected a string value");l.collapseKey=o.collapseKey}if(o.messageType){if(!(0,t.isString)(o.messageType))throw new Error("'remoteMessage.messageType' expected a string value");l.messageType=o.messageType}return l};var t=r(d[0])},793,[763]);
__d(function(g,r,i,a,m,e,d){m.exports="20.5.0"},794,[]);
__d(function(g,r,i,a,m,e,d){Object.defineProperty(e,"__esModule",{value:!0}),e.deleteToken=function(n,t){if(null!=t)return n.deleteToken();return n.deleteToken(t)},e.experimentalSetDeliveryMetricsExportedToBigQueryEnabled=function(n,t){return n.setDeliveryMetricsExportToBigQuery(t)},e.getAPNSToken=function(n){return n.getAPNSToken()},e.getDidOpenSettingsForNotification=function(n){return n.getDidOpenSettingsForNotification()},e.getInitialNotification=function(n){return n.getInitialNotification()},e.getIsHeadless=function(n){return n.getIsHeadless()},e.getMessaging=function(t){if(t)return n.firebase.app(t.name).messaging();return n.firebase.app().messaging()},e.getToken=function(n,t){if(null!=t)return n.getToken();return n.getToken(t)},e.hasPermission=function(n){return n.hasPermission()},e.isAutoInitEnabled=function(n){return n.isAutoInitEnabled},e.isDeliveryMetricsExportToBigQueryEnabled=function(n){return n.isDeliveryMetricsExportToBigQueryEnabled},e.isDeviceRegisteredForRemoteMessages=function(n){return n.isDeviceRegisteredForRemoteMessages},e.isSupported=function(n){return n.isSupported()},e.onDeletedMessages=function(n,t){return n.onDeletedMessages(t)},e.onMessage=function(n,t){return n.onMessage(t)},e.onMessageSent=function(n,t){return n.onMessageSent(t)},e.onNotificationOpenedApp=function(n,t){return n.onNotificationOpenedApp(t)},e.onSendError=function(n,t){return n.onSendError(t)},e.onTokenRefresh=function(n,t){return n.onTokenRefresh(t)},e.registerDeviceForRemoteMessages=function(n){return n.registerDeviceForRemoteMessages()},e.requestPermission=function(n,t){return n.requestPermission(t)},e.sendMessage=function(n,t){return n.sendMessage(t)},e.setAPNSToken=function(n,t,o){return n.setAPNSToken(t,o)},e.setAutoInitEnabled=function(n,t){return n.setAutoInitEnabled(t)},e.setBackgroundMessageHandler=function(n,t){return n.setBackgroundMessageHandler(t)},e.setOpenSettingsForNotificationsHandler=function(n,t){return n.setOpenSettingsForNotificationsHandler(t)},e.subscribeToTopic=function(n,t){return n.subscribeToTopic(t)},e.unregisterDeviceForRemoteMessages=function(n){return n.unregisterDeviceForRemoteMessages()},e.unsubscribeFromTopic=function(n,t){return n.unsubscribeFromTopic(t)};var n=r(d[0])},795,[755]);