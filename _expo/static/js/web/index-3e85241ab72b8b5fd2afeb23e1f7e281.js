__d(function(g,r,i,a,m,e,d){Object.defineProperty(e,"__esModule",{value:!0});var n=r(d[0]);Object.keys(n).forEach(function(t){"default"!==t&&"__esModule"!==t&&(t in e&&e[t]===n[t]||Object.defineProperty(e,t,{enumerable:!0,get:function(){return n[t]}}))})},760,[937]);
__d(function(g,r,i,a,m,_e,d){Object.defineProperty(_e,"__esModule",{value:!0}),_e.connectFunctionsEmulator=N,_e.getFunctions=
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
function(n=(0,e.getApp)(),o=w){const s=(0,e._getProvider)((0,t.getModularInstance)(n),h).getImmediate({identifier:o}),c=(0,t.getDefaultEmulatorHostnameAndPort)("functions");c&&N(s,...c);return s},_e.httpsCallable=function(e,n,o){return function(e,t,n){return o=>function(e,t,n,o){const s=e._url(t);return y(e,s,n,o)}(e,t,o,n||{})}((0,t.getModularInstance)(e),n,o)},_e.httpsCallableFromURL=function(e,n,o){return function(e,t,n){return o=>y(e,t,o,n||{})}((0,t.getModularInstance)(e),n,o)};var e=r(d[0]),t=r(d[1]),n=r(d[2]);
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
const o="type.googleapis.com/google.protobuf.Int64Value",s="type.googleapis.com/google.protobuf.UInt64Value";function c(e,t){const n={};for(const o in e)e.hasOwnProperty(o)&&(n[o]=t(e[o]));return n}function u(e){if(null==e)return null;if(e instanceof Number&&(e=e.valueOf()),"number"==typeof e&&isFinite(e))return e;if(!0===e||!1===e)return e;if("[object String]"===Object.prototype.toString.call(e))return e;if(e instanceof Date)return e.toISOString();if(Array.isArray(e))return e.map(e=>u(e));if("function"==typeof e||"object"==typeof e)return c(e,e=>u(e));throw new Error("Data cannot be encoded in JSON: "+e)}function l(e){if(null==e)return e;if(e["@type"])switch(e["@type"]){case o:case s:{const t=Number(e.value);if(isNaN(t))throw new Error("Data cannot be decoded from JSON: "+e);return t}default:throw new Error("Data cannot be decoded from JSON: "+e)}return Array.isArray(e)?e.map(e=>l(e)):"function"==typeof e||"object"==typeof e?c(e,e=>l(e)):e}
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
   */const h="functions",p={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"};
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
   */class f extends t.FirebaseError{constructor(e,t,n){super(`${h}/${e}`,t||""),this.details=n}}
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
class k{constructor(e,t,n){this.auth=null,this.messaging=null,this.appCheck=null,this.auth=e.getImmediate({optional:!0}),this.messaging=t.getImmediate({optional:!0}),this.auth||e.get().then(e=>this.auth=e,()=>{}),this.messaging||t.get().then(e=>this.messaging=e,()=>{}),this.appCheck||n.get().then(e=>this.appCheck=e,()=>{})}async getAuthToken(){if(this.auth)try{const e=await this.auth.getToken();return null==e?void 0:e.accessToken}catch(e){return}}async getMessagingToken(){if(this.messaging&&"Notification"in self&&"granted"===Notification.permission)try{return await this.messaging.getToken()}catch(e){return}}async getAppCheckToken(e){if(this.appCheck){const t=e?await this.appCheck.getLimitedUseToken():await this.appCheck.getToken();return t.error?null:t.token}return null}async getContext(e){return{authToken:await this.getAuthToken(),messagingToken:await this.getMessagingToken(),appCheckToken:await this.getAppCheckToken(e)}}}
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
   */const w="us-central1";class T{constructor(e,t,n,o,s=w,c){this.app=e,this.fetchImpl=c,this.emulatorOrigin=null,this.contextProvider=new k(t,n,o),this.cancelAllRequests=new Promise(e=>{this.deleteService=()=>Promise.resolve(e())});try{const e=new URL(s);this.customDomain=e.origin+("/"===e.pathname?"":e.pathname),this.region=w}catch(e){this.customDomain=null,this.region=s}}_delete(){return this.deleteService()}_url(e){const t=this.app.options.projectId;if(null!==this.emulatorOrigin){return`${this.emulatorOrigin}/${t}/${this.region}/${e}`}return null!==this.customDomain?`${this.customDomain}/${e}`:`https://${this.region}-${t}.cloudfunctions.net/${e}`}}async function E(e,t,n,o){let s;n["Content-Type"]="application/json";try{s=await o(e,{method:"POST",body:JSON.stringify(t),headers:n})}catch(e){return{status:0,json:null}}let c=null;try{c=await s.json()}catch(e){}return{status:s.status,json:c}}async function y(e,t,n,o){const s={data:n=u(n)},c={},h=await e.contextProvider.getContext(o.limitedUseAppCheckTokens);h.authToken&&(c.Authorization="Bearer "+h.authToken),h.messagingToken&&(c["Firebase-Instance-ID-Token"]=h.messagingToken),null!==h.appCheckToken&&(c["X-Firebase-AppCheck"]=h.appCheckToken);const k=function(e){let t=null;return{promise:new Promise((n,o)=>{t=setTimeout(()=>{o(new f("deadline-exceeded","deadline-exceeded"))},e)}),cancel:()=>{t&&clearTimeout(t)}}}(o.timeout||7e4),w=await Promise.race([E(t,s,c,e.fetchImpl),k.promise,e.cancelAllRequests]);if(k.cancel(),!w)throw new f("cancelled","Firebase Functions instance was deleted.");const T=function(e,t){let n,o=function(e){if(e>=200&&e<300)return"ok";switch(e){case 0:case 500:return"internal";case 400:return"invalid-argument";case 401:return"unauthenticated";case 403:return"permission-denied";case 404:return"not-found";case 409:return"aborted";case 429:return"resource-exhausted";case 499:return"cancelled";case 501:return"unimplemented";case 503:return"unavailable";case 504:return"deadline-exceeded"}return"unknown"}(e),s=o;try{const e=t&&t.error;if(e){const t=e.status;if("string"==typeof t){if(!p[t])return new f("internal","internal");o=p[t],s=t}const c=e.message;"string"==typeof c&&(s=c),n=e.details,void 0!==n&&(n=l(n))}}catch(e){}return"ok"===o?null:new f(o,s,n)}(w.status,w.json);if(T)throw T;if(!w.json)throw new f("internal","Response is not valid JSON object.");let y=w.json.data;if(void 0===y&&(y=w.json.result),void 0===y)throw new f("internal","Response is missing data field.");return{data:l(y)}}const A="@firebase/functions",I="0.11.8";function N(e,n,o){!function(e,t,n){e.emulatorOrigin=`http://${t}:${n}`}((0,t.getModularInstance)(e),n,o)}var b,C;b=fetch.bind(self),(0,e._registerComponent)(new n.Component(h,(e,{instanceIdentifier:t})=>{const n=e.getProvider("app").getImmediate(),o=e.getProvider("auth-internal"),s=e.getProvider("messaging-internal"),c=e.getProvider("app-check-internal");return new T(n,o,s,c,t,b)},"PUBLIC").setMultipleInstances(!0)),(0,e.registerVersion)(A,I,C),(0,e.registerVersion)(A,I,"esm2017")},937,[516,518,517]);