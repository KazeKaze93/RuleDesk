// ==UserScript==
// @name         RuleDesk Web
// @namespace    https://github.com/kazekaze93/ruledesk-web
// @version      0.16.6
// @description  Collections, playlists, favorites, artist updates, and page tweaks for rule34.xxx
// @downloadURL  https://raw.githubusercontent.com/KazeKaze93/ruledesk-web/main/dist/ruledesk-web.user.js
// @updateURL    https://raw.githubusercontent.com/KazeKaze93/ruledesk-web/main/dist/ruledesk-web.user.js
// @match        https://rule34.xxx/*
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-start
// ==/UserScript==

!function(){function e(e,t){return(t||"")+" (SystemJS Error#"+e+" https://github.com/systemjs/systemjs/blob/main/docs/errors.md#"+e+")"}function t(e,t){if(-1!==e.indexOf("\\")&&(e=e.replace(j,"/")),"/"===e[0]&&"/"===e[1])return t.slice(0,t.indexOf(":")+1)+e;if("."===e[0]&&("/"===e[1]||"."===e[1]&&("/"===e[2]||2===e.length&&(e+="/"))||1===e.length&&(e+="/"))||"/"===e[0]){var n,r=t.slice(0,t.indexOf(":")+1);if(n="/"===t[r.length+1]?"file:"!==r?(n=t.slice(r.length+2)).slice(n.indexOf("/")+1):t.slice(8):t.slice(r.length+("/"===t[r.length])),"/"===e[0])return t.slice(0,t.length-n.length-1)+e;for(var i=n.slice(0,n.lastIndexOf("/")+1)+e,o=[],s=-1,u=0;u<i.length;u++)-1!==s?"/"===i[u]&&(o.push(i.slice(s,u+1)),s=-1):"."===i[u]?"."!==i[u+1]||"/"!==i[u+2]&&u+2!==i.length?"/"===i[u+1]||u+1===i.length?u+=1:s=u:(o.pop(),u+=2):s=u;return-1!==s&&o.push(i.slice(s)),t.slice(0,t.length-n.length)+o.join("")}}function n(e,n){return t(e,n)||(-1!==e.indexOf(":")?e:t("./"+e,n))}function r(e,n,r,i,o){for(var s in e){var a=t(s,r)||s,f=e[s];if("string"==typeof f){var l=c(i,t(f,r)||f,o);l?n[a]=l:u("W1",s,f,"bare specifier did not resolve")}}}function i(e,t,i){var o;for(o in e.imports&&r(e.imports,i.imports,t,i,null),e.scopes||{}){var s=n(o,t);r(e.scopes[o],i.scopes[s]||(i.scopes[s]={}),t,i,s)}for(o in e.depcache||{})i.depcache[n(o,t)]=e.depcache[o];for(o in e.integrity||{})i.integrity[n(o,t)]=e.integrity[o]}function o(e,t){if(t[e])return e;var n=e.length;do{var r=e.slice(0,n+1);if(r in t)return r}while(-1!==(n=e.lastIndexOf("/",n-1)))}function s(e,t){var n=o(e,t);if(n){var r=t[n];if(null===r)return;if(!(e.length>n.length&&"/"!==r[r.length-1]))return r+e.slice(n.length);u("W2",n,r,"should have a trailing '/'")}}function u(t,n,r,i){console.warn(e(t,"Package target "+i+", resolving target '"+r+"' for "+n))}function c(e,t,n){for(var r=e.scopes,i=n&&o(n,r);i;){var u=s(t,r[i]);if(u)return u;i=o(i.slice(0,i.lastIndexOf("/")),r)}return s(t,e.imports)||-1!==t.indexOf(":")&&t}function a(){this[M]={}}function f(e){return e.id}function l(e,t,n,r){if(e.onload(n,t.id,t.d&&t.d.map(f),!!r),n)throw n}function d(t,n,r,i){var o=t[M][n];if(o)return o;var s=[],u=Object.create(null);P&&Object.defineProperty(u,P,{value:"Module"});var c=Promise.resolve().then((function(){return t.instantiate(n,r,i)})).then((function(r){if(!r)throw Error(e(2,"Module "+n+" did not instantiate"));var i=r[1]((function(e,t){o.h=!0;var n=!1;if("string"==typeof e)e in u&&u[e]===t||(u[e]=t,n=!0);else{for(var r in e)t=e[r],r in u&&u[r]===t||(u[r]=t,n=!0);e&&e.__esModule&&(u.__esModule=e.__esModule)}if(n)for(var i=0;i<s.length;i++){var c=s[i];c&&c(u)}return t}),2===r[1].length?{import:function(e,r){return t.import(e,n,r)},meta:t.createContext(n)}:void 0);return o.e=i.execute||function(){},[r[0],i.setters||[],r[2]||[]]}),(function(e){throw o.e=null,o.er=e,l(t,o,e,!0),e})),a=c.then((function(e){return Promise.all(e[0].map((function(r,i){var o=e[1][i],s=e[2][i];return Promise.resolve(t.resolve(r,n)).then((function(e){var r=d(t,e,n,s);return Promise.resolve(r.I).then((function(){return o&&(r.i.push(o),!r.h&&r.I||o(r.n)),r}))}))}))).then((function(e){o.d=e}))}));return o=t[M][n]={id:n,i:s,n:u,m:i,I:c,L:a,h:!1,d:void 0,e:void 0,er:void 0,E:void 0,C:void 0,p:void 0}}function h(e,t,n,r){if(!r[t.id])return r[t.id]=!0,Promise.resolve(t.L).then((function(){return t.p&&null!==t.p.e||(t.p=n),Promise.all(t.d.map((function(t){return h(e,t,n,r)})))})).catch((function(n){if(t.er)throw n;throw t.e=null,l(e,t,n,!1),n}))}function p(e,t){return t.C=h(e,t,t,{}).then((function(){return v(e,t,{})})).then((function(){return t.n}))}function v(e,t,n){function r(){try{var n=o.call(L);if(n)return n=n.then((function(){t.C=t.n,t.E=null,l(e,t,null,!0)}),(function(n){throw t.er=n,t.E=null,l(e,t,n,!0),n})),t.E=n;t.C=t.n,t.L=t.I=void 0}catch(r){throw t.er=r,r}finally{l(e,t,t.er,!0)}}if(!n[t.id]){if(n[t.id]=!0,!t.e){if(t.er)throw t.er;return t.E?t.E:void 0}var i,o=t.e;return t.e=null,t.d.forEach((function(r){try{var o=v(e,r,n);o&&(i=i||[]).push(o)}catch(s){throw t.er=s,l(e,t,s,!1),s}})),i?Promise.all(i).then(r):r()}}function m(){[].forEach.call(document.querySelectorAll("script"),(function(t){if(!t.sp)if("systemjs-module"===t.type){if(t.sp=!0,!t.src)return;System.import("import:"===t.src.slice(0,7)?t.src.slice(7):n(t.src,g)).catch((function(e){if(e.message.indexOf("https://github.com/systemjs/systemjs/blob/main/docs/errors.md#3")>-1){var n=document.createEvent("Event");n.initEvent("error",!1,!1),t.dispatchEvent(n)}return Promise.reject(e)}))}else if("systemjs-importmap"===t.type){t.sp=!0;var r=t.src?(System.fetch||fetch)(t.src,{integrity:t.integrity,priority:t.fetchPriority,passThrough:!0}).then((function(e){if(!e.ok)throw Error("Invalid status code: "+e.status);return e.text()})).catch((function(n){return n.message=e("W4","Error fetching systemjs-import map "+t.src)+"\n"+n.message,console.warn(n),"function"==typeof t.onerror&&t.onerror(),"{}"})):t.innerHTML;W=W.then((function(){return r})).then((function(n){!function(t,n,r){var o={};try{o=JSON.parse(n)}catch(s){console.warn(Error(e("W5","systemjs-importmap contains invalid JSON")+"\n\n"+n+"\n"))}i(o,r,t)}(N,n,t.src||g)}))}}))}var g,y="undefined"!=typeof Symbol,b="undefined"!=typeof self,S="undefined"!=typeof document,w=b?self:global;if(S){var O=document.querySelector("base[href]");O&&(g=O.href)}if(!g&&"undefined"!=typeof location){var E=(g=location.href.split("#")[0].split("?")[0]).lastIndexOf("/");-1!==E&&(g=g.slice(0,E+1))}var x,j=/\\/g,P=y&&Symbol.toStringTag,M=y?Symbol():"@",I=a.prototype;I.import=function(e,t,n){var r=this;return t&&"object"==typeof t&&(n=t,t=void 0),Promise.resolve(r.prepareImport()).then((function(){return r.resolve(e,t,n)})).then((function(e){var t=d(r,e,void 0,n);return t.C||p(r,t)}))},I.createContext=function(e){var t=this;return{url:e,resolve:function(n,r){return Promise.resolve(t.resolve(n,r||e))}}},I.onload=function(){},I.register=function(e,t,n){x=[e,t,n]},I.getRegister=function(){var e=x;return x=void 0,e};var L=Object.freeze(Object.create(null));w.System=new a;var C,R,W=Promise.resolve(),N={imports:{},scopes:{},depcache:{},integrity:{}},T=S;if(I.prepareImport=function(e){return(T||e)&&(m(),T=!1),W},I.getImportMap=function(){return JSON.parse(JSON.stringify(N))},S&&(m(),window.addEventListener("DOMContentLoaded",m)),I.addImportMap=function(e,t){i(e,t||g,N)},S){window.addEventListener("error",(function(e){J=e.filename,_=e.error}));var A=location.origin}I.createScript=function(e){var t=document.createElement("script");t.async=!0,e.indexOf(A+"/")&&(t.crossOrigin="anonymous");var n=N.integrity[e];return n&&(t.integrity=n),t.src=e,t};var J,_,k={},U=I.register;I.register=function(e,t){if(S&&"loading"===document.readyState&&"string"!=typeof e){var n=document.querySelectorAll("script[src]"),r=n[n.length-1];if(r){C=e;var i=this;R=setTimeout((function(){k[r.src]=[e,t],i.import(r.src)}))}}else C=void 0;return U.call(this,e,t)},I.instantiate=function(t,n){var r=k[t];if(r)return delete k[t],r;var i=this;return Promise.resolve(I.createScript(t)).then((function(r){return new Promise((function(o,s){r.addEventListener("error",(function(){s(Error(e(3,"Error loading "+t+(n?" from "+n:""))))})),r.addEventListener("load",(function(){if(document.head.removeChild(r),J===t)s(_);else{var e=i.getRegister(t);e&&e[0]===C&&clearTimeout(R),o(e)}})),document.head.appendChild(r)}))}))},I.shouldFetch=function(){return!1},"undefined"!=typeof fetch&&(I.fetch=fetch);var $=I.instantiate,B=/^(text|application)\/(x-)?javascript(;|$)/;I.instantiate=function(t,n,r){var i=this;return this.shouldFetch(t,n,r)?this.fetch(t,{credentials:"same-origin",integrity:N.integrity[t],meta:r}).then((function(r){if(!r.ok)throw Error(e(7,r.status+" "+r.statusText+", loading "+t+(n?" from "+n:"")));var o=r.headers.get("content-type");if(!o||!B.test(o))throw Error(e(4,'Unknown Content-Type "'+o+'", loading '+t+(n?" from "+n:"")));return r.text().then((function(e){return e.indexOf("//# sourceURL=")<0&&(e+="\n//# sourceURL="+t),(0,eval)(e),i.getRegister(t)}))})):$.apply(this,arguments)},I.resolve=function(n,r){return c(N,t(n,r=r||g)||n,r)||function(t,n){throw Error(e(8,"Unable to resolve bare specifier '"+t+(n?"' from "+n:"'")))}(n,r)};var F=I.instantiate;I.instantiate=function(e,t,n){var r=N.depcache[e];if(r)for(var i=0;i<r.length;i++)d(this,this.resolve(r[i],e),e);return F.call(this,e,t,n)},b&&"function"==typeof importScripts&&(I.instantiate=function(e){var t=this;return Promise.resolve().then((function(){return importScripts(e),t.getRegister(e)}))}),function(e){function t(t){return!e.hasOwnProperty(t)||!isNaN(t)&&t<e.length||a&&e[t]&&"undefined"!=typeof window&&e[t].parent===window}var n,r,i,o=e.System.constructor.prototype,s=o.import;o.import=function(o,u,c){return function(){for(var o in n=r=void 0,e)t(o)||(n?r||(r=o):n=o,i=o)}(),s.call(this,o,u,c)};var u=[[],function(){return{}}],c=o.getRegister;o.getRegister=function(){var o=c.call(this);if(o)return o;var s,a=function(o){var s,u,c=0;for(var a in e)if(!t(a)){if(0===c&&a!==n||1===c&&a!==r)return a;s?(i=a,u=o&&u||a):s=a===i,c++}return u}(this.firstGlobalProp);if(!a)return u;try{s=e[a]}catch(f){return u}return[[],function(e){return{execute:function(){e(s),e({default:s,__useDefault:!0})}}}]};var a="undefined"!=typeof navigator&&-1!==navigator.userAgent.indexOf("Trident")}("undefined"!=typeof self?self:global),function(e){var t=e.System.constructor.prototype,r=/^[^#?]+\.(css|html|json|wasm)([?#].*)?$/,i=t.shouldFetch.bind(t);t.shouldFetch=function(e){return i(e)||r.test(e)};var o=/^application\/json(;|$)/,s=/^text\/css(;|$)/,u=/^application\/wasm(;|$)/,c=t.fetch;t.fetch=function(t,r){return c(t,r).then((function(i){if(r.passThrough)return i;if(!i.ok)return i;var c=i.headers.get("content-type");return o.test(c)?i.json().then((function(e){return new Response(new Blob(['System.register([],function(e){return{execute:function(){e("default",'+JSON.stringify(e)+")}}})"],{type:"application/javascript"}))})):s.test(c)?i.text().then((function(e){return e=e.replace(/url\(\s*(?:(["'])((?:\\.|[^\n\\"'])+)\1|((?:\\.|[^\s,"'()\\])+))\s*\)/g,(function(e,r,i,o){return["url(",r,n(i||o,t),r,")"].join("")})),new Response(new Blob(["System.register([],function(e){return{execute:function(){var s=new CSSStyleSheet();s.replaceSync("+JSON.stringify(e)+');e("default",s)}}})'],{type:"application/javascript"}))})):u.test(c)?(WebAssembly.compileStreaming?WebAssembly.compileStreaming(i):i.arrayBuffer().then(WebAssembly.compile)).then((function(n){e.System.wasmModules||(e.System.wasmModules=Object.create(null)),e.System.wasmModules[t]=n;var r=[],i=[];return WebAssembly.Module.imports&&WebAssembly.Module.imports(n).forEach((function(e){var t=JSON.stringify(e.module);-1===r.indexOf(t)&&(r.push(t),i.push("function(m){i["+t+"]=m}"))})),new Response(new Blob(["System.register(["+r.join(",")+"],function(e){var i={};return{setters:["+i.join(",")+"],execute:function(){return WebAssembly.instantiate(System.wasmModules["+JSON.stringify(t)+"],i).then(function(m){e(m.exports)})}}})"],{type:"application/javascript"}))})):i}))}}("undefined"!=typeof self?self:global);var q="undefined"!=typeof Symbol&&Symbol.toStringTag;I.get=function(e){var t=this[M][e];if(t&&null===t.e&&!t.E)return t.er?null:t.n},I.set=function(t,n){try{new URL(t)}catch(s){console.warn(Error(e("W3",'"'+t+'" is not a valid URL to set in the module registry')))}var r;q&&"Module"===n[q]?r=n:(r=Object.assign(Object.create(null),n),q&&Object.defineProperty(r,q,{value:"Module"}));var i=Promise.resolve(r),o=this[M][t]||(this[M][t]={id:t,i:[],h:!1,d:[],e:null,er:void 0,E:void 0});return!o.e&&!o.E&&(Object.assign(o,{n:r,I:void 0,L:void 0,C:i}),r)},I.has=function(e){return!!this[M][e]},I.delete=function(e){var t=this[M],n=t[e];if(!n||n.p&&null!==n.p.e||n.E)return!1;var r=n.i;return n.d&&n.d.forEach((function(e){var t=e.i.indexOf(n);-1!==t&&e.i.splice(t,1)})),delete t[e],function(){var n=t[e];if(!n||!r||null!==n.e||n.E)return!1;r.forEach((function(e){n.i.push(e),e(n.n)})),r=null}};var D="undefined"!=typeof Symbol&&Symbol.iterator;I.entries=function(){var e,t,n=this,r=Object.keys(n[M]),i=0,o={next:function(){for(;void 0!==(t=r[i++])&&void 0===(e=n.get(t)););return{done:void 0===t,value:void 0!==t&&[t,e]}}};return o[D]=function(){return this},o}}();
!function(t){function e(t){t.registerRegistry=Object.create(null),t.namedRegisterAliases=Object.create(null)}var r=t.System;e(r);var i,s,n=r.constructor.prototype,l=r.constructor,a=function(){l.call(this),e(this)};a.prototype=n,r.constructor=a;var o=n.register;n.register=function(t,e,r,n){if("string"!=typeof t)return o.apply(this,arguments);var l=[e,r,n];return this.registerRegistry[t]=l,i||(i=l,s=t),Promise.resolve().then((function(){i=null,s=null})),o.apply(this,[e,r,n])};var u=n.resolve;n.resolve=function(t,e){try{return u.call(this,t,e)}catch(r){if(t in this.registerRegistry)return this.namedRegisterAliases[t]||t;throw r}};var c=n.instantiate;n.instantiate=function(t,e,r){var i=this.registerRegistry[t];return i?(this.registerRegistry[t]=null,i):c.call(this,t,e,r)};var g=n.getRegister;n.getRegister=function(t){var e=g.call(this,t);s&&t&&(this.namedRegisterAliases[s]=t);var r=i||e;return i=null,s=null,r}}("undefined"!=typeof self?self:global);
;(typeof System!='undefined')&&(System=new System.constructor());
System.register("./___monkey.entry.js", [],(function(exports,module){'use strict';return{execute:(function(){exports({$:isCollectionDetailPage,B:rdwPageHash,D:createFavoritesSyncTabId,G:readArtistsMirror,I:listArtistTags,J:writeArtistsMirror,K:reloadFromStorage,L:save,P:setSyncState,Q:Q$1,Y:a,Z:applyTokenProperties,_:resolveAppearancePalette,a:applyAppearanceTheme,a0:menuRouteForPage,a1:getSiteSkinCss,a2:$$1,aB:Segmented,aE:TextField,aF:Button,aG:clampBackgroundDim,aI:featurePanelLabel,aK:setFeatureEnabled,aL:applyCssOnlyFeatureEnabled,aM:isFeatureEnabled,aO:setFeatureChoiceValue,aP:applyCssOnlyFeatureChoice,aQ:getFeatureChoice,aR:createAutocompleteQuerier,aS:b,aT:readSiteBlacklist,aU:Chip,aV:AutocompleteField,aW:ProgressBar,aX:createDefaultCustomTheme,aZ:prepareBackgroundImageFile,a_:writeSiteBlacklist,ad:d,ae:Card,af:SectionLabel,ag:Switch,ai:setTweaksEnabled,aj:NumberField,al:setUpdatesGroupSize,am:getUpdatesGroupSize,ao:setPlaylistChunkSize,ap:getPlaylistChunkSize,ar:setGridFavButtonsEnabled,as:setGridFavButtonsVisible,at:P$1,au:T,av:A,ay:Select,b$:deleteCollection,b0:load,b1:createDefaultStorage,b2:clearStorageCache,b3:clearFavsCache,b4:object,b6:optional,b7:string,b9:literal,bB:buildSearchUrl,bD:getSeenPostId,bN:IconButton,bO:IconX,bP:isFollowingArtist,bQ:addArtist,bR:removeArtist,bT:w$1,bU:shuffleCollection,bV:resetCollectionOrder,bW:Toast,bX:getCollectionOrder,bY:listPlaylists,bZ:removePostsFromCollection,b_:renameCollection,bb:stripLegacyPanelWindowSize,bc:migrateMarksFavToFavs,be:createDefaultFavs,bf:parseFavsStrict,bg:setAppearance,bh:loadFavSet,bj:extractFavIdsFromMarks,bm:getTweaksEnabled,bn:getGridFavButtonsEnabled,bo:getFeatureChoiceValue,bp:getScreenPixelSize,bq:IconPlus,br:EmptyState,bs:resolveCollectionKind,bt:QueryField,bu:Dialog,bv:createDynamicCollection,bw:createPlaylist,by:collectionDetailHash,bz:readCoverMirror,c1:restorePosts,c3:collectionQueueHash,d:detectPageKind,e:ensureDocumentStyles,f:ensureStyleElement,g:getAppearance,h:buildOwnPageCss,j:getSyncState,k:readFavoritesSyncMode,m:mountCards,n:normalizeArtistTag,o:runFavoritesSync,p:parseRdwHash,r:runFeaturesYielding,s:syncFavoritesPage,x:resolveFavoritesUserId,y:yieldToMain});var STORAGE_KEY = "ruledesk-web.storage";
var STORAGE_BACKUP_KEY = exports("bi","ruledesk-web.storage.backup");
var FAVS_STORAGE_KEY = exports("bd","ruledesk-web.favs");
var DEBUG_KEY = "ruledesk-web.debug";
var APPEARANCE_BACKGROUND_KEY = exports("E","ruledesk-web.appearance.background");
var APPEARANCE_BACKGROUND_TOO_LARGE = exports("ac","Background image is too large (max 1.5 MB).");
var TOKEN_STYLE_ID = "ruledesk-web-tokens";
var SITE_SKIN_STYLE_ID = "ruledesk-web-site-skin";
var RDW_SKIN_CLASS = "rdw-skin";
var RDW_THEME_ATTR = exports("a5","data-rdw-theme");
var APPEARANCE_THEME_SITE = exports("a6","site");
var APPEARANCE_THEME_SITE_DARK = exports("a7","site-dark");
var APPEARANCE_THEME_LIGHT = exports("az","light");
var APPEARANCE_THEME_DARK = exports("aA","dark");
var APPEARANCE_THEME_CUSTOM = exports("aw","custom");
var DEFAULT_APPEARANCE_THEME = APPEARANCE_THEME_LIGHT;
var SITE_ORIGIN = exports("b","https://rule34.xxx");
var SEARCH_PATH = exports("X","/index.php");
var SEARCH_PAGE = exports("bG","post");
var SEARCH_SECTION = exports("bH","list");
var SEARCH_SECTION_VIEW = exports("c2","view");
var SEARCH_PARAM_PAGE = exports("T","page");
var SEARCH_PARAM_TAGS = exports("c","tags");
var FAVORITES_PAGE = exports("V","favorites");
var FAVORITES_SECTION_VIEW = exports("W","view");
var FAVORITES_SECTION_DELETE = "delete";
var FAVORITES_PARAM_RETURN_PID = "return_pid";
var ADDFAV_PATH = "/public/addfav.php";
var VOTE_PATH = "/index.php";
var VOTE_PARAM_PAGE = "page";
var VOTE_PARAM_TYPE = "type";
var VOTE_PAGE = "post";
var VOTE_SECTION = "vote";
var FETCH_CREDENTIALS = "same-origin";
var TAG_TYPE_INCLUDE = exports("bM","include");
var TAG_TYPE_EXCLUDE = "exclude";
var UPDATES_ID_PREFIX = "id:>";
var IMPORT_SCHEMA_ERROR_PREFIX = exports("ba","File is not a RuleDesk Web export");
var COLLECTION_KIND_SEARCH = exports("bA","search");
var COLLECTION_KIND_POSTS = exports("bx","posts");
var DOCUMENT_STYLE_ID = "ruledesk-web-document-style";
var UPDATES_BAR_ID = "ruledesk-web-updates-bar";
var SITE_THEME_COOKIE_NAME = "theme";
var SITE_THEME_COOKIE_VALUE_DARK = "dark";
var SITE_BLACKLIST_COOKIE_NAME = "tag_blacklist";
var SITE_THEME_STYLESHEET_DIR = "/css/";
var SITE_THEME_STYLESHEET_LIGHT = "desktop.css";
var SITE_THEME_STYLESHEET_DARK = "desktop-dark.css";
var UI_TEXT = exports("U",{
	nameLabel: "Name",
	save: "Save",
	cancel: "Cancel",
	rename: "Rename",
	delete: "Delete",
	confirmDelete: "Delete this collection?",
	confirm: "Confirm",
	export: "Export",
	import: "Import",
	importErrorPrefix: "Import failed:",
	enablePageTweaksLabel: "Enable page tweaks",
	gridFavButtonsLabel: "Show favorite buttons in grid",
	cardFavAddLabel: "Add post to favorites",
	cardFavRemoveLabel: "Remove post from favorites",
	cardFavGlyph: "★",
	cardFavErrorNotLoggedIn: "Log in to use favorites",
	cardFavErrorRequest: "Favorite request failed",
	artistTagLabel: "Artist tag",
	artistAdd: "Add",
	artistFollow: "Follow",
	artistFollowing: "Following",
	artistInvalid: "Invalid artist tag.",
	artistDuplicate: "Already following this artist.",
	updatesGroupSizeLabel: "Artists per search (0 = 400)",
	playlistChunkSizeLabel: "Collection part size",
	seenUpTo: "Seen up to post #",
	seenNothing: "Nothing marked as seen yet.",
	markAllSeen: "Mark all seen",
	goToPageOneToMark: "Go to page 1 to mark everything as seen",
	noNewPostsSince: "No new posts since #",
	updatesPartialHint: "This search covers only part of your artists. Marking as seen works when all artists are in one search (set “Artists per search” to 0).",
	updatesBarMissingHost: "updates empty host not found; updates bar not mounted"
});
var CSS_CLASS = exports("C",{
	section: "rdw-section",
	list: "rdw-list",
	listItem: "rdw-list-item",
	itemName: "rdw-item-name",
	itemActions: "rdw-item-actions",
	primaryButton: "rdw-primary-button",
	secondaryButton: "rdw-secondary-button",
	form: "rdw-form",
	formActions: "rdw-form-actions",
	toolbar: "rdw-toolbar",
	hint: "rdw-hint",
	error: "rdw-error",
	confirmRow: "rdw-confirm-row",
	thumb: "rdw-thumb",
	cardFav: "rdw-card-fav",
	cardFavMarked: "rdw-card-fav--marked",
	cardFavError: "rdw-card-fav--error",
	cardFavPending: "rdw-card-fav--pending",
	gridFavsHidden: "rdw-grid-favs-hidden",
	artistFollow: "rdw-artist-follow",
	artistFollowMarked: "rdw-artist-follow--marked",
	updatesBar: "rdw-updates-bar",
	updatesBarActions: "rdw-updates-bar-actions"
});
/** Hash routes and DOM ids for RuleDesk own pages (replaces floating panel). */
var RDW_HASH_PREFIX = "#rdw/";
var RDW_ROUTE_COLLECTIONS = exports("c0","collections");
var RDW_ROUTE_FOLLOWING = "following";
var RDW_ROUTE_SETTINGS = "settings";
var RDW_ROUTES = [
	RDW_ROUTE_COLLECTIONS,
	RDW_ROUTE_FOLLOWING,
	RDW_ROUTE_SETTINGS
];
/** Custom-collection detail under `#rdw/collections/<id>`. */
var RDW_COLLECTION_DETAIL_KIND = "collection";
var RDW_COLLECTION_QUEUE_HASH_PREFIX = "#rdw-c=";
var RDW_HASH_COLLECTIONS = exports("u",`${RDW_HASH_PREFIX}${RDW_ROUTE_COLLECTIONS}`);
var RDW_HASH_FOLLOWING = exports("w",`${RDW_HASH_PREFIX}${RDW_ROUTE_FOLLOWING}`);
var RDW_HASH_SETTINGS = exports("A",`${RDW_HASH_PREFIX}${RDW_ROUTE_SETTINGS}`);
var RDW_OWN_PAGE_CLASS = exports("i","rdw-own-page");
var RDW_PAGE_ROOT_ID = exports("q","rdw-page-root");
var RDW_OWN_PAGE_STYLE_ID = exports("R","rdw-own-page-style");
var HEADER_SELECTOR$1 = exports("H","div#header");
var NAVBAR_SELECTOR = exports("N","div#header ul#navbar");
var CURRENT_PAGE_CLASS$1 = exports("O","current-page");
var MENU_ITEM_ID = exports("M",{
	collections: "rdw-nav-collections",
	following: "rdw-nav-following",
	favorites: "rdw-nav-favorites",
	settings: "rdw-nav-settings"
});
var MENU_LABEL = exports("v",{
	collections: "Collections",
	following: "Following",
	favorites: "Favorites",
	settings: "RuleDesk"
});
/** Site native favorites entry (submenu); hidden when our Favorites item is shown. */
var MY_FAVORITES_CONTAINER_ID = exports("z","my-favorites-container");
var FEED_MENU_ITEM_ID = exports("t","rdw-feed-menu");
/** Shared class names for own-page section layouts (relocated from ui/panel). */
var PANEL_UI_CLASS = exports("a3",{
	artistMeta: "rdw-artist-meta",
	artistFilter: "rdw-artist-filter",
	artistList: "rdw-artist-list",
	artistRow: "rdw-artist-row",
	artistLink: "rdw-artist-link",
	artistUndo: "rdw-artist-undo",
	scrollRegion: "rdw-scroll-region",
	settingsGroup: "rdw-settings-group",
	settingsRow: "rdw-settings-row",
	settingsCaption: "rdw-settings-caption",
	pageCard: "rdw-page-card"
});
var UNFOLLOW_UNDO_MS = exports("bS",5e3);
var ARTISTS_EMPTY_TITLE = exports("bF","No followed artists yet");
var ARTISTS_EMPTY_HINT = exports("bE","Follow artists with the Follow button next to their name in the tag list.");
var ARTIST_FILTER_LABEL = exports("bI","Filter artists");
var UNFOLLOW_UNDO_LABEL = exports("bL","Undo");
var UNFOLLOWED_PREFIX = exports("bK","Unfollowed ");
var FEATURE_CHECKBOX_ID_PREFIX = exports("aJ","rdw-feature-");
var FEATURE_CHOICE_ID_PREFIX = exports("aN","rdw-feature-choice-");
var UPDATES_GROUP_SIZE_ID = exports("ak","rdw-updates-group-size");
var PLAYLIST_CHUNK_SIZE_ID = exports("an","rdw-playlist-chunk-size");
var ARTIST_FILTER_ID = exports("bJ","rdw-artist-filter");
var GRID_FAV_CHECKBOX_ID = exports("aq","rdw-grid-fav-buttons");
var TWEAKS_SWITCH_ID = exports("ah","rdw-tweaks-enabled");
var TAG_GROUPS_PANEL_LABEL = "Collapse tags";
function featurePanelLabel(featureId, fallback) {
	if (featureId === "tag-groups") return TAG_GROUPS_PANEL_LABEL;
	return fallback;
}
var HASH_SUFFIX_SPLIT = /[?#]/;
var COLLECTION_DETAIL_SEGMENT_INDEX = 1;
function isRdwRoute(value) {
	return RDW_ROUTES.some((route) => route === value);
}
function isCollectionDetailPage(page) {
	return typeof page !== "string";
}
/** Navbar item for a script page. Collection detail stays under Collections. */
function menuRouteForPage(page) {
	if (isCollectionDetailPage(page)) return RDW_ROUTE_COLLECTIONS;
	return page;
}
function collectionDetailHash(collectionId) {
	return `${RDW_HASH_PREFIX}${RDW_ROUTE_COLLECTIONS}/${encodeURIComponent(collectionId)}`;
}
function collectionQueueHash(collectionId) {
	return `${RDW_COLLECTION_QUEUE_HASH_PREFIX}${encodeURIComponent(collectionId)}`;
}
function rdwPageHash(page) {
	if (isCollectionDetailPage(page)) return collectionDetailHash(page.collectionId);
	return `${RDW_HASH_PREFIX}${page}`;
}
function hashSegment(raw) {
	return raw.split(HASH_SUFFIX_SPLIT)[0] ?? "";
}
function decodeCollectionId(raw) {
	try {
		return decodeURIComponent(raw);
	} catch {
		return raw;
	}
}
/**
* Parse location.hash → script page, or null when the hash is not ours.
* `#rdw-c=…` is the post-page queue and is never a script page.
* `#rdw/collections/<id>` is that custom collection; a bare
* `#rdw/collections` stays the list.
*/
function parseRdwHash(hash) {
	const trimmed = hash.trim();
	if (trimmed.startsWith("#rdw-c") || !trimmed.startsWith("#rdw/")) return null;
	const segments = trimmed.slice(5).split("/");
	const head = hashSegment(segments[0] ?? "");
	if (!isRdwRoute(head)) return null;
	if (head !== "collections" || segments.length <= COLLECTION_DETAIL_SEGMENT_INDEX) return head;
	const collectionId = decodeCollectionId(hashSegment(segments[COLLECTION_DETAIL_SEGMENT_INDEX] ?? ""));
	if (collectionId.length === 0) return RDW_ROUTE_COLLECTIONS;
	return {
		kind: RDW_COLLECTION_DETAIL_KIND,
		collectionId
	};
}
/** CSS: hide site siblings after header while own page is open. */
function buildOwnPageCss() {
	return `
html.${RDW_OWN_PAGE_CLASS} ${HEADER_SELECTOR$1} ~ *:not(#${RDW_PAGE_ROOT_ID}) {
  display: none !important;
}
#${RDW_PAGE_ROOT_ID} {
  display: block;
  box-sizing: border-box;
  width: 100%;
}
`;
}
/**
* Design tokens for RuleDesk Web UI and site skin.
* Light values match docs/design/mock-components.html.
*/
var TOKEN_VAR = exports("a4",{
	bg: "--rdw-bg",
	surface: "--rdw-surface",
	surface2: "--rdw-surface-2",
	border: "--rdw-border",
	text: "--rdw-text",
	muted: "--rdw-muted",
	accent: "--rdw-accent",
	accentSoft: "--rdw-accent-soft",
	danger: "--rdw-danger",
	dangerSoft: "--rdw-danger-soft",
	tagArtist: "--rdw-tag-artist",
	tagCharacter: "--rdw-tag-character",
	tagCopyright: "--rdw-tag-copyright",
	tagMetadata: "--rdw-tag-metadata",
	radiusS: "--rdw-radius-s",
	radiusM: "--rdw-radius-m",
	radiusL: "--rdw-radius-l",
	shadow1: "--rdw-shadow-1",
	shadow2: "--rdw-shadow-2",
	font: "--rdw-font",
	backgroundImage: "--rdw-background-image",
	backgroundDim: "--rdw-background-dim"
});
/** Light palette — page bg from mock-site-skin.html (.new); surfaces from mock-components. */
var LIGHT_PALETTE = {
	bg: "#f3f5f7",
	surface: "#ffffff",
	surface2: "#f4f6f8",
	border: "#cfd6dd",
	text: "#1c2228",
	muted: "#66727e",
	accent: "#2f6fed",
	accentSoft: "#e8f0fe",
	danger: "#c0392b",
	dangerSoft: "#fdecea",
	tagArtist: "#b00020",
	tagCharacter: "#0a7a2f",
	tagCopyright: "#8e24aa",
	tagMetadata: "#ff8800",
	radiusS: "6px",
	radiusM: "8px",
	radiusL: "10px",
	shadow1: "0 1px 2px rgba(0, 0, 0, 0.06)",
	shadow2: "0 8px 24px rgba(0, 0, 0, 0.25)",
	font: "system-ui, \"Segoe UI\", sans-serif"
};
/** Dark palette for theme=dark / site-dark / custom base. */
var DARK_PALETTE = {
	bg: "#16181c",
	surface: "#1e2228",
	surface2: "#262b33",
	border: "#3a424c",
	text: "#e8edf2",
	muted: "#8a96a3",
	accent: "#4c8bf5",
	accentSoft: "#1a2f5a",
	danger: "#e57373",
	dangerSoft: "#3d1f1f",
	tagArtist: "#ff6b81",
	tagCharacter: "#5dcea0",
	tagCopyright: "#ce93d8",
	tagMetadata: "#ffb74d",
	radiusS: "6px",
	radiusM: "8px",
	radiusL: "10px",
	shadow1: "0 1px 2px rgba(0, 0, 0, 0.35)",
	shadow2: "0 8px 24px rgba(0, 0, 0, 0.55)",
	font: "system-ui, \"Segoe UI\", sans-serif"
};
var HEX_SHORT_PATTERN = /^#([0-9a-fA-F]{3})$/;
var HEX_LONG_PATTERN = /^#([0-9a-fA-F]{6})$/;
var SRGB_LINEAR_THRESHOLD = .03928;
var SRGB_LINEAR_DIVISOR = 12.92;
var SRGB_GAMMA = 2.4;
var SRGB_A = .055;
var SRGB_B = 1.055;
var LUMA_R = .2126;
var LUMA_G = .7152;
var LUMA_B = .0722;
function channelToLinear(channel) {
	const c = channel / 255;
	if (c <= SRGB_LINEAR_THRESHOLD) return c / SRGB_LINEAR_DIVISOR;
	return ((c + SRGB_A) / SRGB_B) ** SRGB_GAMMA;
}
/** Parse #rgb / #rrggbb into 0–255 channels; null if unsupported. */
function parseHexColor(value) {
	const short = HEX_SHORT_PATTERN.exec(value.trim());
	if (short !== null) {
		const hex = short[1];
		if (hex === void 0) return null;
		return {
			r: Number.parseInt(hex[0] + hex[0], 16),
			g: Number.parseInt(hex[1] + hex[1], 16),
			b: Number.parseInt(hex[2] + hex[2], 16)
		};
	}
	const long = HEX_LONG_PATTERN.exec(value.trim());
	if (long !== null) {
		const hex = long[1];
		if (hex === void 0) return null;
		return {
			r: Number.parseInt(hex.slice(0, 2), 16),
			g: Number.parseInt(hex.slice(2, 4), 16),
			b: Number.parseInt(hex.slice(4, 6), 16)
		};
	}
	return null;
}
function relativeLuminance(hex) {
	const rgb = parseHexColor(hex);
	if (rgb === null) return null;
	const r = channelToLinear(rgb.r);
	const g = channelToLinear(rgb.g);
	const b = channelToLinear(rgb.b);
	return LUMA_R * r + LUMA_G * g + LUMA_B * b;
}
var CONTRAST_OFFSET$1 = .05;
/**
* Hex equivalents of `docs/design/site-desktop.css` light `* { --c-* }`.
* Script-page Site default chrome; keep in sync with skin/theme site palette.
*/
var SITE_LIGHT_C_BG = exports("a8","#aae5a4");
var SITE_LIGHT_C_BG_ALT = exports("a9","#89cf81");
var SITE_LIGHT_C_BG_OVERLAY = "#98d491";
var SITE_LIGHT_C_TEXT = "#000000";
var SITE_LIGHT_C_TEXT_SOFT = "#666666";
var SITE_LIGHT_C_LINK = "#000099";
/** Site dark script-page chrome (theme=site-dark). */
var SITE_DARK_C_BG = exports("aa","#303a30");
var SITE_DARK_C_SURFACE2 = "#303030";
var SITE_DARK_C_BORDER = exports("ab","#505a50");
var SITE_DARK_C_TEXT = "#c0c0c0";
var SITE_DARK_C_MUTED = "#878787";
var SITE_DARK_C_ACCENT = "#b0e0b0";
/**
* Site default switch ON track: green-family control color (not link blue).
* Must keep ≥ {@link CONTRAST_RATIO_UI_MIN} vs card bg ({@link SITE_LIGHT_C_BG}).
*/
var SITE_DEFAULT_SWITCH_ON = "#1a4d1a";
/** Preferred thumb fill on Site default switch ON (page/card green). */
var SITE_DEFAULT_SWITCH_THUMB_ON = SITE_LIGHT_C_BG;
/** WCAG contrast ratio of two hex colors; null if either is unparseable. */
function contrastRatio$1(foreground, background) {
	const l1 = relativeLuminance(foreground);
	const l2 = relativeLuminance(background);
	if (l1 === null || l2 === null) return null;
	const lighter = Math.max(l1, l2);
	const darker = Math.min(l1, l2);
	return (lighter + CONTRAST_OFFSET$1) / (darker + CONTRAST_OFFSET$1);
}
/**
* Prefer `preferred` when it meets `minRatio` vs `background`; else first
* candidate that does. Falls back to `preferred` if none pass.
*/
function pickContrastingHex(background, preferred, candidates, minRatio) {
	const preferredRatio = contrastRatio$1(preferred, background);
	if (preferredRatio !== null && preferredRatio >= minRatio) return preferred;
	for (const candidate of candidates) {
		const ratio = contrastRatio$1(candidate, background);
		if (ratio !== null && ratio >= minRatio) return candidate;
	}
	return preferred;
}
/** Thumb fill for a switch ON track that meets UI contrast, if possible. */
function resolveSwitchThumbOn(trackOn, preferredThumb, fallbacks = ["#ffffff"]) {
	return pickContrastingHex(trackOn, preferredThumb, fallbacks, 3);
}
/** Pick light/dark custom base from a legacy background hex. */
function customBaseFromLegacyBg(bg) {
	if (bg === void 0) return "light";
	const luma = relativeLuminance(bg);
	if (luma !== null && luma < .5) return "dark";
	return "light";
}
function escapeCssValue(value) {
	return value.replace(/</g, "\\3c ");
}
function tokensToCssDeclarations(palette) {
	return [
		`${TOKEN_VAR.bg}: ${escapeCssValue(palette.bg)};`,
		`${TOKEN_VAR.surface}: ${escapeCssValue(palette.surface)};`,
		`${TOKEN_VAR.surface2}: ${escapeCssValue(palette.surface2)};`,
		`${TOKEN_VAR.border}: ${escapeCssValue(palette.border)};`,
		`${TOKEN_VAR.text}: ${escapeCssValue(palette.text)};`,
		`${TOKEN_VAR.muted}: ${escapeCssValue(palette.muted)};`,
		`${TOKEN_VAR.accent}: ${escapeCssValue(palette.accent)};`,
		`${TOKEN_VAR.accentSoft}: ${escapeCssValue(palette.accentSoft)};`,
		`${TOKEN_VAR.danger}: ${escapeCssValue(palette.danger)};`,
		`${TOKEN_VAR.dangerSoft}: ${escapeCssValue(palette.dangerSoft)};`,
		`${TOKEN_VAR.tagArtist}: ${escapeCssValue(palette.tagArtist)};`,
		`${TOKEN_VAR.tagCharacter}: ${escapeCssValue(palette.tagCharacter)};`,
		`${TOKEN_VAR.tagCopyright}: ${escapeCssValue(palette.tagCopyright)};`,
		`${TOKEN_VAR.tagMetadata}: ${escapeCssValue(palette.tagMetadata)};`,
		`${TOKEN_VAR.radiusS}: ${escapeCssValue(palette.radiusS)};`,
		`${TOKEN_VAR.radiusM}: ${escapeCssValue(palette.radiusM)};`,
		`${TOKEN_VAR.radiusL}: ${escapeCssValue(palette.radiusL)};`,
		`${TOKEN_VAR.shadow1}: ${escapeCssValue(palette.shadow1)};`,
		`${TOKEN_VAR.shadow2}: ${escapeCssValue(palette.shadow2)};`,
		`${TOKEN_VAR.font}: ${escapeCssValue(palette.font)};`
	].join("\n  ");
}
/** CSS text for :root (or a host) with the given palette. */
function buildTokensCss(palette, selector = ":root") {
	return `${selector} {\n  ${tokensToCssDeclarations(palette)}\n}\n`;
}
/**
* Apply palette CSS variables on an element (documentElement or Shadow host).
* Inline properties so Shadow :host { all: initial } still sees the tokens.
*/
function applyTokenProperties(target, palette) {
	target.style.setProperty(TOKEN_VAR.bg, palette.bg);
	target.style.setProperty(TOKEN_VAR.surface, palette.surface);
	target.style.setProperty(TOKEN_VAR.surface2, palette.surface2);
	target.style.setProperty(TOKEN_VAR.border, palette.border);
	target.style.setProperty(TOKEN_VAR.text, palette.text);
	target.style.setProperty(TOKEN_VAR.muted, palette.muted);
	target.style.setProperty(TOKEN_VAR.accent, palette.accent);
	target.style.setProperty(TOKEN_VAR.accentSoft, palette.accentSoft);
	target.style.setProperty(TOKEN_VAR.danger, palette.danger);
	target.style.setProperty(TOKEN_VAR.dangerSoft, palette.dangerSoft);
	target.style.setProperty(TOKEN_VAR.tagArtist, palette.tagArtist);
	target.style.setProperty(TOKEN_VAR.tagCharacter, palette.tagCharacter);
	target.style.setProperty(TOKEN_VAR.tagCopyright, palette.tagCopyright);
	target.style.setProperty(TOKEN_VAR.tagMetadata, palette.tagMetadata);
	target.style.setProperty(TOKEN_VAR.radiusS, palette.radiusS);
	target.style.setProperty(TOKEN_VAR.radiusM, palette.radiusM);
	target.style.setProperty(TOKEN_VAR.radiusL, palette.radiusL);
	target.style.setProperty(TOKEN_VAR.shadow1, palette.shadow1);
	target.style.setProperty(TOKEN_VAR.shadow2, palette.shadow2);
	target.style.setProperty(TOKEN_VAR.font, palette.font);
}
/**
* Apply custom overrides via CSS variables (setProperty only — no inline style attrs).
* Call on document.documentElement (or a shadow host).
*/
function applyCustomThemeProperties(target, custom) {
	if (custom.backgroundImage !== void 0 && custom.backgroundImage.length > 0) target.style.setProperty(TOKEN_VAR.backgroundImage, `url("${custom.backgroundImage.replace(/"/g, "\\\"")}")`);
	if (custom.backgroundDim !== void 0) target.style.setProperty(TOKEN_VAR.backgroundDim, String(custom.backgroundDim));
}
function clearCustomThemeProperties(target) {
	target.style.removeProperty(TOKEN_VAR.accent);
	target.style.removeProperty(TOKEN_VAR.bg);
	target.style.removeProperty(TOKEN_VAR.surface);
	target.style.removeProperty(TOKEN_VAR.text);
	target.style.removeProperty(TOKEN_VAR.backgroundImage);
	target.style.removeProperty(TOKEN_VAR.backgroundDim);
}
function isDebugEnabled() {
	try {
		return GM_getValue(DEBUG_KEY, void 0) === true;
	} catch {
		return false;
	}
}
var log = exports("l",{
	debug(message, ...details) {
		if (!isDebugEnabled()) return;
		console.debug(`[ruledesk-web] ${message}`, ...details);
	},
	info(message, ...details) {
		if (!isDebugEnabled()) return;
		console.info(`[ruledesk-web] ${message}`, ...details);
	},
	warn(message, ...details) {
		console.warn(`[ruledesk-web] ${message}`, ...details);
	},
	error(message, ...details) {
		console.error(`[ruledesk-web] ${message}`, ...details);
	}
});
function getEnumValues(entries) {
	const numericValues = Object.values(entries).filter((v) => typeof v === "number");
	return Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v]) => v);
}
function jsonStringifyReplacer(_, value) {
	if (typeof value === "bigint") return value.toString();
	return value;
}
var Cached = class {
	constructor(getter) {
		this._getter = getter;
		this._value = void 0;
	}
	get value() {
		const getter = this._getter;
		if (getter !== void 0) {
			this._value = getter();
			this._getter = void 0;
		}
		return this._value;
	}
};
function cached(getter) {
	return new Cached(getter);
}
function nullish(input) {
	return input === null || input === void 0;
}
function cleanRegex(source) {
	const start = source.startsWith("^") ? 1 : 0;
	const end = source.endsWith("$") ? source.length - 1 : source.length;
	return source.slice(start, end);
}
function assignProp(target, prop, value) {
	Object.defineProperty(target, prop, {
		value,
		writable: true,
		enumerable: true,
		configurable: true
	});
}
var captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => {};
function isObject(data) {
	return typeof data === "object" && data !== null && !Array.isArray(data);
}
function isPlainObject(o) {
	if (isObject(o) === false) return false;
	const ctor = o.constructor;
	if (ctor === void 0) return true;
	if (typeof ctor !== "function") return true;
	const prot = ctor.prototype;
	if (isObject(prot) === false) return false;
	if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) return false;
	return true;
}
var propertyKeyTypes = /* @__PURE__*/ new Set([
	"string",
	"number",
	"symbol"
]);
function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function clone(inst, def, params) {
	const cl = new inst._zod.constr(def ?? inst._zod.def);
	if (!def || params?.parent) cl._zod.parent = inst;
	return cl;
}
function normalizeParams(_params) {
	const params = _params;
	if (!params) return {};
	if (typeof params === "string") return { error: () => params };
	if (params?.message !== void 0) {
		if (params?.error !== void 0) throw new Error("Cannot specify both `message` and `error` params");
		params.error = params.message;
	}
	delete params.message;
	if (typeof params.error === "string") return {
		...params,
		error: () => params.error
	};
	return params;
}
function optionalKeys(shape) {
	return Object.keys(shape).filter((k) => {
		return shape[k]._zod.optin !== void 0 && shape[k]._zod.optout === "optional";
	});
}
var NUMBER_FORMAT_RANGES = /*@__PURE__*/ (() => ({
	safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
	int32: [-2147483648, 2147483647],
	uint32: [0, 4294967295],
	float32: [-34028234663852886e22, 34028234663852886e22],
	float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
}))();
function aborted(x, startIndex = 0) {
	if (x.aborted === true) return true;
	for (let i = startIndex; i < x.issues.length; i++) if (x.issues[i]?.continue !== true) return true;
	return false;
}
function explicitlyAborted(x, startIndex = 0) {
	if (x.aborted === true) return true;
	for (let i = startIndex; i < x.issues.length; i++) if (x.issues[i]?.continue === false) return true;
	return false;
}
function prefixIssues(path, issues) {
	return issues.map((iss) => {
		var _a;
		(_a = iss).path ?? (_a.path = []);
		iss.path.unshift(path);
		return iss;
	});
}
function unwrapMessage(message) {
	return typeof message === "string" ? message : message?.message;
}
/** The leading size checks of `defChecks` that set an upper bound, each paired with it. */
function sizeCaps(defChecks) {
	const caps = [];
	for (const ch of defChecks ?? []) {
		const d = ch._zod.def;
		if (!/_(length|size)$|_equals$/.test(d.check)) break;
		const max = d.maximum ?? d.length ?? d.size;
		if (max >= 0) caps.push([max, ch]);
	}
	return caps;
}
function attachSchema(issues, start, inst) {
	var _a;
	for (let i = start; i < issues.length; i++) (_a = issues[i]).schema ?? (_a.schema = inst);
}
function finalizeIssue(iss, ctx, config) {
	var _a;
	const traits = iss.inst?._zod?.traits;
	if (traits?.has("$ZodType")) {
		if (traits.has("$ZodCheck")) (_a = iss).schema ?? (_a.schema = iss.inst);
		else iss.schema = iss.inst;
	}
	const schemaError = iss.schema !== iss.inst ? iss.schema?._zod.def?.error : void 0;
	const message = iss.message ? iss.message : unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(schemaError?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config.customError?.(iss)) ?? unwrapMessage(config.localeError?.(iss)) ?? "Invalid input";
	const full = {};
	for (const k of Object.keys(iss)) {
		if (k === "inst" || k === "schema" || k === "continue" || k === "input" || k === "__proto__") continue;
		full[k] = iss[k];
	}
	full.path ?? (full.path = []);
	full.message = message;
	if (ctx?.reportInput) full.input = iss.input;
	return full;
}
var highSurrogate = /[\uD800-\uDBFF]/;
function codePointLength(str) {
	const units = str.length;
	if (!highSurrogate.test(str)) return units;
	let count = units;
	for (let i = 0; i < units - 1; i++) if ((str.charCodeAt(i) & 64512) === 55296 && (str.charCodeAt(i + 1) & 64512) === 56320) {
		count--;
		i++;
	}
	return count;
}
function getLengthableOrigin(input) {
	if (Array.isArray(input)) return "array";
	if (typeof input === "string") return "string";
	return "unknown";
}
/**
* Installs a trait's members on its prototype. Each value builds that member for the instance on first read; the built value shadows the accessor as an own property, so a detached `const { parse } = schema` keeps working.
*
* Call this from a `proto` initializer, which runs once per prototype — never per instance.
*/
function members(proto, table) {
	for (const key in table) {
		const desc = Object.getOwnPropertyDescriptor(table, key);
		if (desc.get) Object.defineProperty(proto, key, {
			...desc,
			enumerable: false
		});
		else defineBound(proto, key, desc.value);
	}
}
/** Shadows a prototype member with an own value, so a getter that builds from the instance runs once. */
function own(inst, key, value, enumerable = true) {
	Object.defineProperty(inst, key, {
		configurable: true,
		writable: true,
		enumerable,
		value
	});
	return value;
}
/** Like {@link own}, for a member that was never an own data property and has to stay out of `Object.keys`. */
function hide(inst, key, value) {
	return own(inst, key, value, false);
}
function defineBound(proto, key, fn) {
	Object.defineProperty(proto, key, {
		configurable: true,
		get() {
			return this == null ? fn : own(this, key, fn.bind(this));
		},
		set(value) {
			own(this, key, value);
		}
	});
}
/** Returns the prototype to install on, or `undefined` if this group is already installed on it. */
function claim(inst, sentinel) {
	const proto = Object.getPrototypeOf(inst);
	return sentinel in proto ? void 0 : proto;
}
var installing;
var broke = false;
var breaker = {
	configurable: true,
	get() {
		broke = true;
	}
};
/**
* Installs a lazily-derived internal on the `_zod` prototype of `inst`'s
* constructor, computed from the internals object itself and cached there on
* first read. One accessor per constructor rather than one per instance.
*/
function defineLazyInternal(inst, key, compute) {
	const proto = Object.getPrototypeOf(inst._zod);
	if (key in proto && installing !== inst._zod) {
		installing = void 0;
		return;
	}
	installing = inst._zod;
	Object.defineProperty(proto, key, {
		configurable: true,
		get() {
			Object.defineProperty(this, key, breaker);
			const outer = broke;
			broke = false;
			try {
				const value = compute(this);
				if (broke) delete this[key];
				else Object.defineProperty(this, key, {
					configurable: true,
					writable: true,
					value
				});
				broke = broke || outer;
				return value;
			} catch (err) {
				delete this[key];
				broke = broke || outer;
				throw err;
			}
		},
		set(value) {
			Object.defineProperty(this, key, {
				configurable: true,
				writable: true,
				value
			});
		}
	});
}
/**
* Installs `key` on `inst`'s prototype, computed by `make` on first read and cached there as an own
* data property. One accessor per constructor rather than one per instance, because an own accessor
* puts every instance after the first into v8 dictionary mode. The key doubles as the sentinel.
*/
function installLazyProp(inst, key, make, enumerable) {
	const proto = claim(inst, key);
	if (!proto) return;
	Object.defineProperty(proto, key, {
		configurable: true,
		get() {
			const desc = {
				configurable: true,
				writable: true,
				enumerable,
				value: void 0
			};
			Object.defineProperty(this, key, desc);
			desc.value = make(this);
			Object.defineProperty(this, key, desc);
			return desc.value;
		},
		set(value) {
			Object.defineProperty(this, key, {
				configurable: true,
				writable: true,
				enumerable,
				value
			});
		}
	});
}
var _a;
var _zodDesc = {
	value: void 0,
	enumerable: false
};
var _E = "captureStackTrace" in Error ? Error : null;
function newError(Definition) {
	const E = _E;
	if (E) {
		const saved = E.stackTraceLimit;
		if (typeof saved === "number") {
			try {
				E.stackTraceLimit = 0;
			} catch {
				_E = null;
				return new Definition();
			}
			try {
				return new Definition();
			} finally {
				E.stackTraceLimit = saved;
			}
		}
	}
	return new Definition();
}
/* @__NO_SIDE_EFFECTS__ */
function $constructor(name, initializer, proto, params) {
	const zodProto = {};
	function Internals(def) {
		this.def = def;
		this.constr = _;
		this.traits = /* @__PURE__ */ new Set();
	}
	Internals.prototype = zodProto;
	const protoMembers = proto;
	const initialized = protoMembers && /* @__PURE__ */ new WeakSet();
	function init(inst, def) {
		if (!inst._zod) {
			_zodDesc.value = new Internals(def);
			try {
				Object.defineProperty(inst, "_zod", _zodDesc);
			} finally {
				_zodDesc.value = void 0;
			}
		} else if (inst._zod.traits.has(name)) return;
		inst._zod.traits.add(name);
		initializer(inst, def);
		if (initialized) {
			const own = Object.getPrototypeOf(inst);
			const ctorProto = inst._zod.constr.prototype;
			let up = own;
			while (up && up !== ctorProto) up = Object.getPrototypeOf(up);
			const target = up ?? own;
			if (!initialized.has(target)) {
				initialized.add(target);
				members(target, protoMembers);
			}
		}
		const proto = _.prototype;
		for (const k in proto) {
			if (!Object.prototype.hasOwnProperty.call(proto, k)) continue;
			if (!(k in inst)) inst[k] = proto[k].bind(inst);
		}
	}
	const Parent = params?.Parent ?? Object;
	class Definition extends Parent {}
	Object.defineProperty(Definition, "name", { value: name });
	function _(def) {
		const inst = params?.Parent ? newError(Definition) : this;
		init(inst, def);
		const deferred = inst._zod.deferred;
		if (deferred) {
			for (const fn of deferred) fn();
			inst._zod.deferred = void 0;
		}
		const pp = globalThis.__zod_globalConfig?.postProcessor;
		if (pp) pp(inst);
		return inst;
	}
	Object.defineProperty(_, "init", { value: init });
	Object.defineProperty(_, Symbol.hasInstance, { value: (inst) => {
		if (params?.Parent && inst instanceof params.Parent) return true;
		return inst?._zod?.traits?.has(name);
	} });
	Object.defineProperty(_, "name", { value: name });
	return _;
}
var $ZodAsyncError = class extends Error {
	constructor() {
		super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
	}
};
(_a = globalThis).__zod_globalConfig ?? (_a.__zod_globalConfig = {});
var globalConfig = globalThis.__zod_globalConfig;
function config(newConfig) {
	return globalConfig;
}
function _getMessage() {
	const internals = this._zod;
	internals.message ?? (internals.message = JSON.stringify(internals.def, jsonStringifyReplacer, 2));
	return internals.message;
}
function _setMessage(value) {
	this._zod.message = value;
}
var _messageDesc = {
	get: _getMessage,
	set: _setMessage,
	enumerable: true,
	configurable: true
};
var _issuesDesc = {
	value: void 0,
	enumerable: false
};
var _installedToString = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]);
var initializer = (inst, def) => {
	inst.name = "$ZodError";
	_issuesDesc.value = def;
	Object.defineProperty(inst, "issues", _issuesDesc);
	_issuesDesc.value = void 0;
	Object.defineProperty(inst, "message", _messageDesc);
	const proto = Object.getPrototypeOf(inst);
	if (!_installedToString.has(proto)) {
		_installedToString.add(proto);
		Object.defineProperty(proto, "toString", {
			configurable: true,
			enumerable: false,
			get() {
				const value = () => this.message;
				Object.defineProperty(this, "toString", {
					value,
					configurable: true,
					writable: true
				});
				return value;
			},
			set(value) {
				Object.defineProperty(this, "toString", {
					value,
					configurable: true,
					writable: true
				});
			}
		});
	}
};
var $ZodRealError = /* @__PURE__ */ $constructor("$ZodError", initializer, void 0, { Parent: Error });
var _parse = (_Err) => {
	const fn = (schema, value, _ctx, _params) => {
		const ctx = _ctx ? {
			..._ctx,
			async: false
		} : { async: false };
		const result = schema._zod.run({
			value,
			issues: []
		}, ctx);
		if (result instanceof Promise) throw new $ZodAsyncError();
		if (result.issues.length) {
			const e = new ((_params?.Err) ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
			captureStackTrace(e, _params?.callee ?? fn);
			throw e;
		}
		return result.value;
	};
	return fn;
};
var parse = /* @__PURE__*/ _parse($ZodRealError);
var _parseAsync = (_Err) => {
	const fn = async (schema, value, _ctx, params) => {
		const ctx = _ctx ? {
			..._ctx,
			async: true
		} : { async: true };
		let result = schema._zod.run({
			value,
			issues: []
		}, ctx);
		if (result instanceof Promise) result = await result;
		if (result.issues.length) {
			const e = new ((params?.Err) ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
			captureStackTrace(e, params?.callee ?? fn);
			throw e;
		}
		return result.value;
	};
	return fn;
};
var parseAsync = /* @__PURE__*/ _parseAsync($ZodRealError);
var _safeParse = (_Err) => (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		async: false
	} : { async: false };
	const result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) throw new $ZodAsyncError();
	return result.issues.length ? failure(_Err, result.issues, ctx) : {
		success: true,
		data: result.value
	};
};
var safeParse = /* @__PURE__*/ _safeParse($ZodRealError);
function failure(Err, issues, ctx) {
	let error;
	return {
		success: false,
		get error() {
			if (!error) {
				error = new Err(issues.map((iss) => finalizeIssue(iss, ctx, config())));
				issues = void 0;
				ctx = void 0;
			}
			return error;
		},
		set error(e) {
			error = e;
			issues = void 0;
			ctx = void 0;
		}
	};
}
var _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		async: true
	} : { async: true };
	let result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) result = await result;
	return result.issues.length ? failure(_Err, result.issues, ctx) : {
		success: true,
		data: result.value
	};
};
var safeParseAsync = /* @__PURE__*/ _safeParseAsync($ZodRealError);
var anyString = /^[\s\S]{0,}$/;
var number$1 = /^-?\d+(?:\.\d+)?$/;
var boolean$1 = /^(?:true|false)$/i;
var $ZodCheck = /*@__PURE__*/ $constructor("$ZodCheck", (inst, def) => {
	var _a;
	inst._zod ?? (inst._zod = {});
	inst._zod.def = def;
	(_a = inst._zod).onattach ?? (_a.onattach = []);
});
/** Default `when` for length-based checks: run only on non-nullish values with a `length`. */
var _whenHasLength = (payload) => {
	const val = payload.value;
	return !nullish(val) && val.length !== void 0;
};
var numericOriginMap = {
	number: "number",
	bigint: "bigint",
	object: "date"
};
var $ZodCheckGreaterThan = /*@__PURE__*/ $constructor("$ZodCheckGreaterThan", (inst, def) => {
	$ZodCheck.init(inst, def);
	const origin = numericOriginMap[typeof def.value];
	inst._zod.check = (payload) => {
		if (def.inclusive ? payload.value >= def.value : payload.value > def.value) return;
		payload.issues.push({
			origin: numericOriginMap[typeof payload.value] ?? origin,
			code: "too_small",
			minimum: typeof def.value === "object" ? def.value.getTime() : def.value,
			input: payload.value,
			inclusive: def.inclusive,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckNumberFormat = /*@__PURE__*/ $constructor("$ZodCheckNumberFormat", (inst, def) => {
	$ZodCheck.init(inst, def);
	def.format = def.format || "float64";
	const isInt = def.format?.includes("int");
	const origin = isInt ? "int" : "number";
	const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
	inst._zod.check = (payload) => {
		const input = payload.value;
		if (isInt) {
			if (!Number.isInteger(input)) {
				payload.issues.push({
					expected: origin,
					format: def.format,
					code: "invalid_type",
					continue: false,
					input,
					inst
				});
				return;
			}
			if (!Number.isSafeInteger(input)) {
				if (input > 0) payload.issues.push({
					input,
					code: "too_big",
					maximum: Number.MAX_SAFE_INTEGER,
					note: "Integers must be within the safe integer range.",
					inst,
					origin,
					inclusive: true,
					continue: !def.abort
				});
				else payload.issues.push({
					input,
					code: "too_small",
					minimum: Number.MIN_SAFE_INTEGER,
					note: "Integers must be within the safe integer range.",
					inst,
					origin,
					inclusive: true,
					continue: !def.abort
				});
				return;
			}
		}
		if (input < minimum) payload.issues.push({
			origin: "number",
			input,
			code: "too_small",
			minimum,
			inclusive: true,
			inst,
			continue: !def.abort
		});
		if (input > maximum) payload.issues.push({
			origin: "number",
			input,
			code: "too_big",
			maximum,
			inclusive: true,
			inst,
			continue: !def.abort
		});
	};
});
var $ZodCheckMinLength = /*@__PURE__*/ $constructor("$ZodCheckMinLength", (inst, def) => {
	var _a;
	$ZodCheck.init(inst, def);
	(_a = inst._zod.def).when ?? (_a.when = _whenHasLength);
	inst._zod.check = (payload) => {
		const input = payload.value;
		const units = input.length;
		if ((typeof input === "string" && units >= def.minimum && units < def.minimum * 2 ? codePointLength(input) : units) >= def.minimum) return;
		const origin = getLengthableOrigin(input);
		payload.issues.push({
			origin,
			code: "too_small",
			minimum: def.minimum,
			inclusive: true,
			input,
			inst,
			continue: !def.abort
		});
	};
});
var version = {
	major: 4,
	minor: 6,
	patch: 7
};
var $ZodType = /*@__PURE__*/ $constructor("$ZodType", (inst, def) => {
	var _a;
	inst ?? (inst = {});
	inst._zod.def = def;
	inst._zod.bag = inst._zod.bag || {};
	inst._zod.version = version;
	const defChecks = inst._zod.def.checks;
	const checks = inst._zod.traits.has("$ZodCheck") ? [inst, ...defChecks ?? []] : defChecks?.length ? [...defChecks] : [];
	for (const ch of checks) for (const fn of ch._zod.onattach) fn(inst);
	if (checks.length === 0) {
		(_a = inst._zod).deferred ?? (_a.deferred = []);
		inst._zod.deferred?.push(() => {
			inst._zod.run = inst._zod.parse;
		});
	} else {
		const runChecks = (payload, checks, ctx) => {
			if (payload.memo) return payload;
			let isAborted = aborted(payload);
			let asyncResult;
			for (const ch of checks) {
				if (ch._zod.def.when) {
					if (explicitlyAborted(payload)) continue;
					if (!ch._zod.def.when(payload)) continue;
				} else if (isAborted) continue;
				const currLen = payload.issues.length;
				const _ = ch._zod.check(payload);
				if (_ instanceof Promise && ctx?.async === false) throw new $ZodAsyncError();
				if (asyncResult || _ instanceof Promise) asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
					await _;
					if (payload.issues.length === currLen) return;
					attachSchema(payload.issues, currLen, inst);
					if (!isAborted) isAborted = aborted(payload, currLen);
				});
				else {
					if (payload.issues.length === currLen) continue;
					attachSchema(payload.issues, currLen, inst);
					if (!isAborted) isAborted = aborted(payload, currLen);
				}
			}
			if (asyncResult) return asyncResult.then(() => {
				return payload;
			});
			return payload;
		};
		const handleCanaryResult = (canary, payload, ctx) => {
			if (aborted(canary)) {
				canary.aborted = true;
				return canary;
			}
			const checkResult = runChecks(payload, checks, ctx);
			if (checkResult instanceof Promise) {
				if (ctx.async === false) throw new $ZodAsyncError();
				return checkResult.then((checkResult) => inst._zod.parse(checkResult, ctx));
			}
			return inst._zod.parse(checkResult, ctx);
		};
		inst._zod.run = (payload, ctx) => {
			if (ctx.skipChecks) return inst._zod.parse(payload, ctx);
			if (ctx.direction === "backward") {
				const canary = inst._zod.parse({
					value: payload.value,
					issues: []
				}, {
					...ctx,
					skipChecks: true
				});
				if (canary instanceof Promise) return canary.then((canary) => {
					return handleCanaryResult(canary, payload, ctx);
				});
				return handleCanaryResult(canary, payload, ctx);
			}
			const result = inst._zod.parse(payload, ctx);
			if (result instanceof Promise) {
				if (ctx.async === false) throw new $ZodAsyncError();
				return result.then((result) => runChecks(result, checks, ctx));
			}
			return runChecks(result, checks, ctx);
		};
	}
}, {
	get "~standard"() {
		return hide(this, "~standard", standardProps(this));
	},
	set "~standard"(value) {
		own(this, "~standard", value);
	}
});
/** The Standard Schema surface for `inst`. Shared so wrappers can extend it without forcing it. */
var toStandardResult = (r, ctx) => r.issues.length ? { issues: r.issues.map((iss) => finalizeIssue(iss, ctx, config())) } : { value: r.value };
async function validateAsync(inst, value) {
	const ctx = { async: true };
	return toStandardResult(await inst._zod.run({
		value,
		issues: []
	}, ctx), ctx);
}
function standardProps(inst) {
	return {
		validate: (value) => {
			const ctx = { async: false };
			try {
				const r = inst._zod.run({
					value,
					issues: []
				}, ctx);
				if (!(r instanceof Promise)) return toStandardResult(r, ctx);
			} catch (_) {}
			return validateAsync(inst, value);
		},
		vendor: "zod",
		version: 1
	};
}
var $ZodString = /*@__PURE__*/ $constructor("$ZodString", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = def.pattern ?? anyString;
	inst._zod.parse = (payload, _) => {
		if (def.coerce) try {
			payload.value = String(payload.value);
		} catch (_) {}
		if (typeof payload.value === "string") return payload;
		payload.issues.push({
			expected: "string",
			code: "invalid_type",
			input: payload.value,
			inst
		});
		return payload;
	};
});
var $ZodNumber = /*@__PURE__*/ $constructor("$ZodNumber", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = number$1;
	inst._zod.parse = (payload, _ctx) => {
		if (def.coerce) try {
			payload.value = Number(payload.value);
		} catch (_) {}
		const input = payload.value;
		if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) return payload;
		const received = typeof input === "number" ? Number.isNaN(input) ? "NaN" : !Number.isFinite(input) ? String(input) : void 0 : void 0;
		payload.issues.push({
			expected: "number",
			code: "invalid_type",
			input,
			inst,
			...received ? { received } : {}
		});
		return payload;
	};
});
var $ZodNumberFormat = /*@__PURE__*/ $constructor("$ZodNumberFormat", (inst, def) => {
	$ZodCheckNumberFormat.init(inst, def);
	$ZodNumber.init(inst, def);
});
var $ZodBoolean = /*@__PURE__*/ $constructor("$ZodBoolean", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = boolean$1;
	inst._zod.parse = (payload, _ctx) => {
		if (def.coerce) try {
			payload.value = Boolean(payload.value);
		} catch (_) {}
		const input = payload.value;
		if (typeof input === "boolean") return payload;
		payload.issues.push({
			expected: "boolean",
			code: "invalid_type",
			input,
			inst
		});
		return payload;
	};
});
var $ZodUnknown = /*@__PURE__*/ $constructor("$ZodUnknown", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload) => payload;
});
function capSize(inst, size) {
	const caps = sizeCaps(inst._zod.def.checks);
	if (!caps.length) return;
	const cap = Math.min(...caps.map((c) => c[0]));
	const parse = inst._zod.parse;
	inst._zod.parse = (payload, ctx) => {
		const n = size(payload.value);
		if (n > cap && !ctx?.skipChecks && ctx?.direction !== "backward") {
			for (const [max, ch] of sizeCaps(inst._zod.def.checks)) if (n > max && ch._zod.def.when(payload)) {
				const start = payload.issues.length;
				ch._zod.check(payload);
				payload.issues[start].continue = false;
				attachSchema(payload.issues, start, inst);
				return payload;
			}
		}
		return parse(payload, ctx);
	};
}
var arraySize = (input) => Array.isArray(input) ? input.length : -1;
function handleArrayResult(result, final, index) {
	if (result.issues.length) final.issues.push(...prefixIssues(index, result.issues));
	final.value[index] = result.value;
}
var $ZodArray = /*@__PURE__*/ $constructor("$ZodArray", (inst, def) => {
	$ZodType.init(inst, def);
	const memo = globalConfig.memoizer;
	memo?.attach(inst);
	inst._zod.parse = (payload, ctx) => {
		const input = payload.value;
		if (!Array.isArray(input)) {
			payload.issues.push({
				expected: "array",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		payload.value = memo ? memo.alloc(inst, payload, Array(input.length), ctx) : Array(input.length);
		const proms = [];
		const abortEarly = ctx?.abortEarly;
		for (let i = 0; i < input.length; i++) {
			const item = input[i];
			const result = def.element._zod.run({
				value: item,
				issues: []
			}, ctx);
			if (result instanceof Promise) proms.push(result.then((result) => handleArrayResult(result, payload, i)));
			else {
				handleArrayResult(result, payload, i);
				if (abortEarly && result.issues.length !== 0 && aborted(result)) break;
			}
		}
		if (proms.length) return Promise.all(proms).then(() => payload);
		return payload;
	};
	capSize(inst, arraySize);
});
function handlePropertyResult(result, final, key, input, optin, optout) {
	const isPresent = key in input;
	const isOptionalOut = optout === "optional";
	if (!isPresent && isOptionalOut && optin === "optional") return;
	if (result.issues.length) {
		if (optin !== void 0 && isOptionalOut && !isPresent) return;
		final.issues.push(...prefixIssues(key, result.issues));
	}
	if (!isPresent && optin === void 0) {
		if (!result.issues.length) final.issues.push({
			code: "invalid_type",
			expected: "nonoptional",
			input: void 0,
			path: [key]
		});
		return;
	}
	if (result.value === void 0) {
		if (isPresent || optin === "defaulted" && !isOptionalOut) final.value[key] = void 0;
	} else final.value[key] = result.value;
}
var NO_SYMBOL_KEYS = [];
function normalizeDef(def) {
	const keys = Object.keys(def.shape);
	const ownSymbols = Object.getOwnPropertySymbols(def.shape);
	const symbolKeys = ownSymbols.length ? ownSymbols : NO_SYMBOL_KEYS;
	const allKeys = symbolKeys.length ? [...keys, ...symbolKeys] : keys;
	for (const k of allKeys) if (!def.shape?.[k]?._zod?.traits?.has("$ZodType")) throw new Error(`Invalid element at key "${String(k)}": expected a Zod schema`);
	const okeys = optionalKeys(def.shape);
	return {
		...def,
		allKeys,
		symbolKeys,
		keySet: new Set(keys),
		numKeys: keys.length,
		optionalKeys: new Set(okeys)
	};
}
function handleCatchall(proms, input, payload, ctx, def, inst, abortEarly) {
	const unrecognized = [];
	const keySet = def.keySet;
	const _catchall = def.catchall._zod;
	const t = _catchall.def.type;
	const optin = _catchall.optin;
	const optout = _catchall.optout;
	let seen = 0;
	for (const key in input) {
		if (abortEarly && payload.issues.length !== seen) {
			if (aborted(payload, seen)) break;
			seen = payload.issues.length;
		}
		if (keySet.has(key)) continue;
		if (key === "__proto__") {
			if (t === "never") unrecognized.push(key);
			continue;
		}
		if (t === "never") {
			unrecognized.push(key);
			continue;
		}
		const r = _catchall.run({
			value: input[key],
			issues: []
		}, ctx);
		if (r instanceof Promise) proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, optin, optout)));
		else handlePropertyResult(r, payload, key, input, optin, optout);
	}
	if (unrecognized.length) payload.issues.push({
		code: "unrecognized_keys",
		keys: unrecognized,
		input,
		inst,
		continue: true
	});
	if (!proms.length) return payload;
	return Promise.all(proms).then(() => {
		return payload;
	});
}
var $ZodObject = /*@__PURE__*/ $constructor("$ZodObject", (inst, def) => {
	$ZodType.init(inst, def);
	const desc = Object.getOwnPropertyDescriptor(def, "shape");
	const sh = desc?.get ? desc.get.raw : def.shape ?? {};
	if (sh) {
		const get = () => {
			const newSh = { ...sh };
			Object.defineProperty(def, "shape", { value: newSh });
			get.raw = newSh;
			return newSh;
		};
		get.raw = sh;
		Object.defineProperty(def, "shape", { get });
	}
	const _normalized = cached(() => normalizeDef(def));
	defineLazyInternal(inst, "propValues", (zod) => {
		const shape = zod.def.shape;
		const propValues = {};
		for (const key in shape) {
			const field = shape[key]._zod;
			if (field.values) {
				if (!Object.prototype.hasOwnProperty.call(propValues, key)) assignProp(propValues, key, /* @__PURE__ */ new Set());
				for (const v of field.values) propValues[key].add(v);
				if (field.optin !== void 0) propValues[key].add(void 0);
			}
		}
		return propValues;
	});
	const isObject$1 = isObject;
	const catchall = def.catchall;
	let value;
	const memo = globalConfig.memoizer;
	memo?.attach(inst);
	inst._zod.parse = (payload, ctx) => {
		value ?? (value = _normalized.value);
		const input = payload.value;
		if (!isObject$1(input)) {
			payload.issues.push({
				expected: "object",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
		const proms = [];
		const shape = value.shape;
		const abortEarly = ctx?.abortEarly;
		let seen = payload.issues.length;
		for (const key of value.allKeys) {
			if (abortEarly && payload.issues.length !== seen) {
				if (aborted(payload, seen)) break;
				seen = payload.issues.length;
			}
			if (key === "__proto__") continue;
			const el = shape[key];
			const optin = el._zod.optin;
			const optout = el._zod.optout;
			const r = el._zod.run({
				value: input[key],
				issues: []
			}, ctx);
			if (r instanceof Promise) proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, optin, optout)));
			else handlePropertyResult(r, payload, key, input, optin, optout);
		}
		if (!catchall) return proms.length ? Promise.all(proms).then(() => payload) : payload;
		return handleCatchall(proms, input, payload, ctx, _normalized.value, inst, abortEarly === true);
	};
});
var $ZodRecord = /*@__PURE__*/ $constructor("$ZodRecord", (inst, def) => {
	$ZodType.init(inst, def);
	const memo = globalConfig.memoizer;
	memo?.attach(inst);
	inst._zod.parse = (payload, ctx) => {
		const input = payload.value;
		if (!isPlainObject(input)) {
			payload.issues.push({
				expected: "record",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		const proms = [];
		const values = def.keyType._zod.values;
		if (values && !def.partial) {
			payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
			const recordKeys = /* @__PURE__ */ new Set();
			for (const key of values) if (typeof key === "string" || typeof key === "number" || typeof key === "symbol") {
				recordKeys.add(typeof key === "number" ? key.toString() : key);
				if (key === "__proto__") continue;
				const keyResult = def.keyType._zod.run({
					value: key,
					issues: []
				}, ctx);
				if (keyResult instanceof Promise) throw new Error("Async schemas not supported in object keys currently");
				if (keyResult.issues.length) {
					payload.issues.push({
						code: "invalid_key",
						origin: "record",
						issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
						input: key,
						path: [key],
						inst
					});
					continue;
				}
				const outKey = keyResult.value;
				if (outKey === "__proto__") continue;
				const result = def.valueType._zod.run({
					value: input[key],
					issues: []
				}, ctx);
				if (result instanceof Promise) proms.push(result.then((result) => {
					if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
					payload.value[outKey] = result.value;
				}));
				else {
					if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
					payload.value[outKey] = result.value;
				}
			}
			let unrecognized;
			for (const key in input) if (!recordKeys.has(key)) {
				if (def.mode === "loose") {
					if (key === "__proto__") continue;
					payload.value[key] = input[key];
				} else {
					unrecognized = unrecognized ?? [];
					unrecognized.push(key);
				}
			}
			if (unrecognized && unrecognized.length > 0) payload.issues.push({
				code: "unrecognized_keys",
				input,
				inst,
				keys: unrecognized,
				continue: true
			});
		} else {
			payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
			let unrecognized;
			for (const key of Reflect.ownKeys(input)) {
				if (key === "__proto__") continue;
				if (!Object.prototype.propertyIsEnumerable.call(input, key)) continue;
				let keyResult = def.keyType._zod.run({
					value: key,
					issues: []
				}, ctx);
				if (keyResult instanceof Promise) throw new Error("Async schemas not supported in object keys currently");
				if (typeof key === "string" && number$1.test(key) && keyResult.issues.length) {
					const retryResult = def.keyType._zod.run({
						value: Number(key),
						issues: []
					}, ctx);
					if (retryResult instanceof Promise) throw new Error("Async schemas not supported in object keys currently");
					if (retryResult.issues.length === 0) keyResult = retryResult;
				}
				if (keyResult.issues.length) {
					if (def.mode === "loose") payload.value[key] = input[key];
					else if (values) {
						unrecognized = unrecognized ?? [];
						unrecognized.push(key);
					} else payload.issues.push({
						code: "invalid_key",
						origin: "record",
						issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
						input: key,
						path: [key],
						inst
					});
					continue;
				}
				const outKey = keyResult.value;
				if (outKey === "__proto__") continue;
				const result = def.valueType._zod.run({
					value: input[key],
					issues: []
				}, ctx);
				if (result instanceof Promise) proms.push(result.then((result) => {
					if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
					payload.value[outKey] = result.value;
				}));
				else {
					if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
					payload.value[outKey] = result.value;
				}
			}
			if (unrecognized && unrecognized.length > 0) payload.issues.push({
				code: "unrecognized_keys",
				input,
				inst,
				keys: unrecognized,
				continue: true
			});
		}
		if (proms.length) return Promise.all(proms).then(() => payload);
		return payload;
	};
});
var $ZodEnum = /*@__PURE__*/ $constructor("$ZodEnum", (inst, def) => {
	$ZodType.init(inst, def);
	const values = getEnumValues(def.entries);
	const valuesSet = new Set(values);
	inst._zod.values = valuesSet;
	defineLazyInternal(inst, "pattern", (zod) => {
		const patternValues = getEnumValues(zod.def.entries).filter((k) => propertyKeyTypes.has(typeof k));
		return new RegExp(patternValues.length ? `^(${patternValues.map((o) => escapeRegex(o.toString())).join("|")})$` : "^[^\\s\\S]$");
	});
	inst._zod.parse = (payload, _ctx) => {
		const input = payload.value;
		if (valuesSet.has(input)) return payload;
		payload.issues.push({
			code: "invalid_value",
			values,
			input,
			inst
		});
		return payload;
	};
});
var $ZodLiteral = /*@__PURE__*/ $constructor("$ZodLiteral", (inst, def) => {
	$ZodType.init(inst, def);
	const values = new Set(def.values);
	inst._zod.values = values;
	defineLazyInternal(inst, "pattern", (zod) => {
		const vals = zod.def.values;
		return new RegExp(vals.length ? `^(${vals.map((o) => typeof o === "string" ? escapeRegex(o) : o ? escapeRegex(o.toString()) : String(o)).join("|")})$` : "^[^\\s\\S]$");
	});
	inst._zod.parse = (payload, _ctx) => {
		const input = payload.value;
		if (values.has(input)) return payload;
		payload.issues.push({
			code: "invalid_value",
			values: def.values,
			input,
			inst
		});
		return payload;
	};
});
function handleOptionalResult(payload, result) {
	payload.value = result.issues.length ? void 0 : result.value;
	return payload;
}
var $ZodOptional = /*@__PURE__*/ $constructor("$ZodOptional", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional");
	inst._zod.optout = "optional";
	defineLazyInternal(inst, "values", (zod) => {
		const values = zod.def.innerType._zod.values;
		return values ? /* @__PURE__ */ new Set([...values, void 0]) : void 0;
	});
	defineLazyInternal(inst, "pattern", (zod) => {
		const pattern = zod.def.innerType._zod.pattern;
		return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : void 0;
	});
	inst._zod.parse = (payload, ctx) => {
		if (payload.value === void 0) {
			if (def.innerType._zod.optin !== "defaulted") return payload;
			const result = def.innerType._zod.run({
				value: payload.value,
				issues: []
			}, ctx);
			if (result instanceof Promise) return result.then((result) => handleOptionalResult(payload, result));
			return handleOptionalResult(payload, result);
		}
		return def.innerType._zod.run(payload, ctx);
	};
});
var $ZodNullable = /*@__PURE__*/ $constructor("$ZodNullable", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin);
	defineLazyInternal(inst, "optout", (zod) => zod.def.innerType._zod.optout);
	defineLazyInternal(inst, "pattern", (zod) => {
		const pattern = zod.def.innerType._zod.pattern;
		return pattern ? new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : void 0;
	});
	defineLazyInternal(inst, "values", (zod) => {
		return zod.def.innerType._zod.values ? /* @__PURE__ */ new Set([...zod.def.innerType._zod.values, null]) : void 0;
	});
	inst._zod.parse = (payload, ctx) => {
		if (payload.value === null) return payload;
		return def.innerType._zod.run(payload, ctx);
	};
});
function snapshotChecks(def) {
	if (def.checks) def.checks = [...def.checks];
	return def;
}
// @__NO_SIDE_EFFECTS__
function _string(Class, params) {
	return new Class(snapshotChecks({
		type: "string",
		...normalizeParams(params)
	}));
}
// @__NO_SIDE_EFFECTS__
function _number(Class, params) {
	return new Class(snapshotChecks({
		type: "number",
		checks: [],
		...normalizeParams(params)
	}));
}
// @__NO_SIDE_EFFECTS__
function _int(Class, params) {
	return new Class({
		type: "number",
		check: "number_format",
		abort: false,
		format: "safeint",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _boolean(Class, params) {
	return new Class({
		type: "boolean",
		...normalizeParams(params)
	});
}
// @__NO_SIDE_EFFECTS__
function _unknown(Class) {
	return new Class({ type: "unknown" });
}
// @__NO_SIDE_EFFECTS__
function _gt(value, params) {
	return new $ZodCheckGreaterThan({
		check: "greater_than",
		...normalizeParams(params),
		value,
		inclusive: false
	});
}
// @__NO_SIDE_EFFECTS__
function _gte(value, params) {
	return new $ZodCheckGreaterThan({
		check: "greater_than",
		...normalizeParams(params),
		value,
		inclusive: true
	});
}
// @__NO_SIDE_EFFECTS__
function _positive(params) {
	return /* @__PURE__ */ _gt(0, params);
}
// @__NO_SIDE_EFFECTS__
function _nonnegative(params) {
	return /* @__PURE__ */ _gte(0, params);
}
// @__NO_SIDE_EFFECTS__
function _minLength(minimum, params) {
	return new $ZodCheckMinLength({
		check: "min_length",
		...normalizeParams(params),
		minimum
	});
}
var ZodMiniType = /*@__PURE__*/ $constructor("ZodMiniType", (inst, def) => {
	if (!inst._zod) throw new Error("Uninitialized schema in ZodMiniType.");
	$ZodType.init(inst, def);
	inst.def = def;
	inst.type = def.type;
}, {
	get with() {
		return this.check;
	},
	set with(value) {
		own(this, "with", value);
	},
	parse(data, params) {
		return parse(this, data, params, { callee: this.parse });
	},
	parseAsync(data, params) {
		return parseAsync(this, data, params, { callee: this.parseAsync });
	},
	safeParse(data, params) {
		return safeParse(this, data, params);
	},
	safeParseAsync(data, params) {
		return safeParseAsync(this, data, params);
	},
	check(...checks) {
		const def = this.def;
		return this.clone({
			...def,
			checks: [...def.checks ?? [], ...checks.map((ch) => typeof ch === "function" ? { _zod: {
				check: ch,
				def: { check: "custom" },
				onattach: []
			} } : ch)]
		}, { parent: true });
	},
	clone(_def, params) {
		return clone(this, _def, params);
	},
	brand() {
		return this;
	},
	register(reg, meta) {
		reg.add(this, meta);
		return this;
	},
	apply(fn, ...args) {
		return args.length === 0 ? fn(this) : fn(this, ...args);
	}
});
var ZodMiniString = /*@__PURE__*/ $constructor("ZodMiniString", (inst, def) => {
	$ZodString.init(inst, def);
	ZodMiniType.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function string(params) {
	return /* @__PURE__ */ _string(ZodMiniString, params);
}
var ZodMiniNumber = /*@__PURE__*/ $constructor("ZodMiniNumber", (inst, def) => {
	$ZodNumber.init(inst, def);
	ZodMiniType.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function number(params) {
	return /* @__PURE__ */ _number(ZodMiniNumber, params);
}
var ZodMiniNumberFormat = /*@__PURE__*/ $constructor("ZodMiniNumberFormat", (inst, def) => {
	$ZodNumberFormat.init(inst, def);
	ZodMiniNumber.init(inst, def);
});
function int(params) {
	return /* @__PURE__ */ _int(ZodMiniNumberFormat, params);
}
var ZodMiniBoolean = /*@__PURE__*/ $constructor("ZodMiniBoolean", (inst, def) => {
	$ZodBoolean.init(inst, def);
	ZodMiniType.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function boolean(params) {
	return /* @__PURE__ */ _boolean(ZodMiniBoolean, params);
}
var ZodMiniUnknown = /*@__PURE__*/ $constructor("ZodMiniUnknown", (inst, def) => {
	$ZodUnknown.init(inst, def);
	ZodMiniType.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function unknown() {
	return /* @__PURE__ */ _unknown(ZodMiniUnknown);
}
var ZodMiniArray = /*@__PURE__*/ $constructor("ZodMiniArray", (inst, def) => {
	$ZodArray.init(inst, def);
	ZodMiniType.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function array(element, params) {
	return new ZodMiniArray({
		type: "array",
		element,
		...normalizeParams(params)
	});
}
var ZodMiniObject = /*@__PURE__*/ $constructor("ZodMiniObject", (inst, def) => {
	$ZodObject.init(inst, def);
	ZodMiniType.init(inst, def);
	installLazyProp(inst, "shape", (self) => self._zod.def.shape, false);
});
// @__NO_SIDE_EFFECTS__
function object(shape, params) {
	return new ZodMiniObject({
		type: "object",
		shape: shape ?? {},
		...normalizeParams(params)
	});
}
var ZodMiniRecord = /*@__PURE__*/ $constructor("ZodMiniRecord", (inst, def) => {
	$ZodRecord.init(inst, def);
	ZodMiniType.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function record(keyType, valueType, params) {
	if (!valueType || !valueType._zod) return new ZodMiniRecord({
		type: "record",
		keyType: /* @__PURE__ */ string(),
		valueType: keyType,
		...normalizeParams(valueType)
	});
	return new ZodMiniRecord({
		type: "record",
		keyType,
		valueType,
		...normalizeParams(params)
	});
}
var ZodMiniEnum = /*@__PURE__*/ $constructor("ZodMiniEnum", (inst, def) => {
	$ZodEnum.init(inst, def);
	ZodMiniType.init(inst, def);
	inst.options = [...inst._zod.values];
});
// @__NO_SIDE_EFFECTS__
function _enum(values, params) {
	return new ZodMiniEnum({
		type: "enum",
		entries: Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values,
		...normalizeParams(params)
	});
}
var ZodMiniLiteral = /*@__PURE__*/ $constructor("ZodMiniLiteral", (inst, def) => {
	$ZodLiteral.init(inst, def);
	ZodMiniType.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function literal(value, params) {
	return new ZodMiniLiteral({
		type: "literal",
		values: Array.isArray(value) ? value : [value],
		...normalizeParams(params)
	});
}
var ZodMiniOptional = /*@__PURE__*/ $constructor("ZodMiniOptional", (inst, def) => {
	$ZodOptional.init(inst, def);
	ZodMiniType.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function optional(innerType) {
	return new ZodMiniOptional({
		type: "optional",
		innerType
	});
}
var ZodMiniNullable = /*@__PURE__*/ $constructor("ZodMiniNullable", (inst, def) => {
	$ZodNullable.init(inst, def);
	ZodMiniType.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function nullable(innerType) {
	return new ZodMiniNullable({
		type: "nullable",
		innerType
	});
}
var TagTypeSchema = /* @__PURE__ */ _enum([TAG_TYPE_INCLUDE, TAG_TYPE_EXCLUDE]);
var CollectionKindSchema = /* @__PURE__ */ _enum([COLLECTION_KIND_SEARCH, COLLECTION_KIND_POSTS]);
var TagEntrySchema = /* @__PURE__ */ object({
	tag: (/* @__PURE__ */ string()).check(/* @__PURE__ */ _minLength(1)),
	type: TagTypeSchema
});
/**
* Optional `kind` / `postIds`: missing `kind` means a saved search.
* Custom (`posts`) rows may also carry `thumbs` and `shuffledOrder`.
* Dynamic searches may carry `query` (raw tag string). All three are optional
* so 0.15 blobs still parse; {@link migrateCollectionMediaFields} fills the
* custom-collection defaults without dropping `postIds` or search tags.
* `shuffledOrder: null` means insertion order (`postIds`).
* Dynamic searches may also carry `cover`: thumb URLs seen on the first
* page of their results, newest visit wins.
*/
var CollectionSchema = /* @__PURE__ */ object({
	id: (/* @__PURE__ */ string()).check(/* @__PURE__ */ _minLength(1)),
	name: (/* @__PURE__ */ string()).check(/* @__PURE__ */ _minLength(1)),
	tags: /* @__PURE__ */ array(TagEntrySchema),
	kind: /* @__PURE__ */ optional(CollectionKindSchema),
	postIds: /* @__PURE__ */ optional(/* @__PURE__ */ array(int())),
	thumbs: /* @__PURE__ */ optional(/* @__PURE__ */ record(/* @__PURE__ */ string(), /* @__PURE__ */ string())),
	shuffledOrder: /* @__PURE__ */ optional(/* @__PURE__ */ nullable(/* @__PURE__ */ array(int()))),
	query: /* @__PURE__ */ optional(/* @__PURE__ */ string()),
	cover: /* @__PURE__ */ optional(/* @__PURE__ */ array(/* @__PURE__ */ string()))
});
var ArtistEntrySchema = /* @__PURE__ */ object({ tag: (/* @__PURE__ */ string()).check(/* @__PURE__ */ _minLength(1)) });
/** Legacy `fav` remains optional so old storage/export blobs still parse. */
var MarkFlagsSchema = /* @__PURE__ */ object({
	fav: /* @__PURE__ */ optional(/* @__PURE__ */ boolean()),
	seen: /* @__PURE__ */ optional(/* @__PURE__ */ boolean())
});
var AppearanceThemeSchema = exports("aY",/* @__PURE__ */ _enum([
	APPEARANCE_THEME_SITE,
	APPEARANCE_THEME_SITE_DARK,
	APPEARANCE_THEME_LIGHT,
	APPEARANCE_THEME_DARK,
	APPEARANCE_THEME_CUSTOM
]));
var APPEARANCE_CUSTOM_BASE_LIGHT = exports("aC","light");
var APPEARANCE_CUSTOM_BASE_DARK = exports("aD","dark");
var AppearanceCustomBaseSchema = /* @__PURE__ */ _enum([APPEARANCE_CUSTOM_BASE_LIGHT, APPEARANCE_CUSTOM_BASE_DARK]);
/** Canonical custom theme: Light/Dark base + optional background image/dim. */
var AppearanceCustomSchema = /* @__PURE__ */ object({
	base: AppearanceCustomBaseSchema,
	backgroundImage: /* @__PURE__ */ optional(/* @__PURE__ */ string()),
	backgroundDim: /* @__PURE__ */ optional(/* @__PURE__ */ number())
});
/**
* Storage/export parse shape: accepts legacy accent/bg/surface/text so 0.10
* blobs still load; normalize via {@link normalizeAppearanceCustom}.
*/
var AppearanceCustomStoredSchema = /* @__PURE__ */ object({
	base: /* @__PURE__ */ optional(AppearanceCustomBaseSchema),
	accent: /* @__PURE__ */ optional(/* @__PURE__ */ string()),
	bg: /* @__PURE__ */ optional(/* @__PURE__ */ string()),
	surface: /* @__PURE__ */ optional(/* @__PURE__ */ string()),
	text: /* @__PURE__ */ optional(/* @__PURE__ */ string()),
	backgroundImage: /* @__PURE__ */ optional(/* @__PURE__ */ string()),
	backgroundDim: /* @__PURE__ */ optional(/* @__PURE__ */ number())
});
var AppearanceSchema = /* @__PURE__ */ object({
	theme: AppearanceThemeSchema,
	custom: /* @__PURE__ */ optional(AppearanceCustomSchema)
});
var AppearanceStoredSchema = /* @__PURE__ */ object({
	theme: AppearanceThemeSchema,
	custom: /* @__PURE__ */ optional(AppearanceCustomStoredSchema)
});
/**
* Package B: module toggle id for «Video player tweaks»
* (`settings.features[VIDEO_PLAYER_FEATURE_ID]`).
*/
var VIDEO_PLAYER_FEATURE_ID = "video-player";
/** Package B: `settings.featureChoice[VIDEO_PLAYER_FEATURE_ID]` values. */
var VIDEO_SIZE_FIT_HEIGHT = "fit-height";
var VIDEO_SIZE_FIT_WIDTH = "fit-width";
var VIDEO_SIZE_ORIGINAL = "original";
var DEFAULT_VIDEO_SIZE = VIDEO_SIZE_FIT_HEIGHT;
var VideoSizeSchema = /* @__PURE__ */ _enum([
	VIDEO_SIZE_FIT_HEIGHT,
	VIDEO_SIZE_FIT_WIDTH,
	VIDEO_SIZE_ORIGINAL
]);
/**
* Package B: persisted player prefs under
* `settings.featureState[VIDEO_PLAYER_FEATURE_ID]`.
*/
var VideoPlayerStateSchema = /* @__PURE__ */ object({
	volume: /* @__PURE__ */ optional(/* @__PURE__ */ number()),
	muted: /* @__PURE__ */ optional(/* @__PURE__ */ boolean()),
	playbackRate: /* @__PURE__ */ optional(/* @__PURE__ */ number())
});
var SettingsSchema = /* @__PURE__ */ object({
	gridFavButtons: /* @__PURE__ */ boolean(),
	updatesGroupSize: /* @__PURE__ */ optional(int().check(/* @__PURE__ */ _nonnegative())),
	playlistChunkSize: /* @__PURE__ */ optional(int().check(/* @__PURE__ */ _positive())),
	tweaksEnabled: /* @__PURE__ */ optional(/* @__PURE__ */ boolean()),
	features: /* @__PURE__ */ optional(/* @__PURE__ */ record(/* @__PURE__ */ string(), /* @__PURE__ */ boolean())),
	featureChoice: /* @__PURE__ */ optional(/* @__PURE__ */ record(/* @__PURE__ */ string(), /* @__PURE__ */ string())),
	featureState: /* @__PURE__ */ optional(/* @__PURE__ */ record(/* @__PURE__ */ string(), /* @__PURE__ */ unknown())),
	appearance: /* @__PURE__ */ optional(AppearanceStoredSchema)
});
var UpdatesSchema = /* @__PURE__ */ object({ seenPostId: int().check(/* @__PURE__ */ _nonnegative()) });
var StorageSchema = exports("b5",/* @__PURE__ */ object({
	version: /* @__PURE__ */ literal(1),
	collections: /* @__PURE__ */ array(CollectionSchema),
	artists: /* @__PURE__ */ array(ArtistEntrySchema),
	marks: /* @__PURE__ */ record(/* @__PURE__ */ string(), MarkFlagsSchema),
	settings: /* @__PURE__ */ optional(SettingsSchema),
	updates: /* @__PURE__ */ optional(UpdatesSchema)
}));
/** Legacy floating-panel size keys under settings.featureState.panel. */
var LEGACY_PANEL_FEATURE_STATE_ID = "panel";
var LEGACY_PANEL_WIDTH_KEY = "width";
var LEGACY_PANEL_HEIGHT_KEY = "height";
var GRID_DENSITY_CHOICE_ID = "grid-density";
var GRID_DENSITY_DEFAULT_VALUE = "default";
var LEGACY_MASONRY_CHOICE_VALUE = "masonry";
/** Post panel Info/Comments tab used to live here. Always Info as of 0.15.1. */
var POST_PANEL_TAB_CHOICE_ID = "post-actions";
var FavsSyncLockSchema = /* @__PURE__ */ object({
	tabId: (/* @__PURE__ */ string()).check(/* @__PURE__ */ _minLength(1)),
	beatAt: /* @__PURE__ */ number()
});
/** Package F HANDOFF: incremental stops early; full walks every page. */
var FAVS_SYNC_MODE_INCREMENTAL = "incremental";
var FAVS_SYNC_MODE_FULL = "full";
var FavsSyncModeSchema = /* @__PURE__ */ _enum([FAVS_SYNC_MODE_INCREMENTAL, FAVS_SYNC_MODE_FULL]);
var FavsSyncSchema = /* @__PURE__ */ object({
	nextPid: int(),
	lastPid: int(),
	startedAt: /* @__PURE__ */ string(),
	finishedAt: /* @__PURE__ */ optional(/* @__PURE__ */ string()),
	running: /* @__PURE__ */ optional(/* @__PURE__ */ boolean()),
	userId: /* @__PURE__ */ optional(int()),
	lock: /* @__PURE__ */ optional(FavsSyncLockSchema),
	mode: /* @__PURE__ */ optional(FavsSyncModeSchema)
});
var FavsSchema = exports("b8",/* @__PURE__ */ object({
	version: /* @__PURE__ */ literal(1),
	ids: /* @__PURE__ */ array(int()),
	sync: /* @__PURE__ */ optional(FavsSyncSchema)
}));
function createDefaultVideoPlayerState() {
	return {
		volume: 1,
		muted: false,
		playbackRate: 1
	};
}
function parseVideoPlayerState(raw) {
	const parsed = VideoPlayerStateSchema.safeParse(raw);
	if (!parsed.success) return createDefaultVideoPlayerState();
	const defaults = createDefaultVideoPlayerState();
	const volume = parsed.data.volume;
	const muted = parsed.data.muted;
	const playbackRate = parsed.data.playbackRate;
	return {
		volume: volume !== void 0 && Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : defaults.volume,
		muted: muted ?? defaults.muted,
		playbackRate: playbackRate !== void 0 && Number.isFinite(playbackRate) && playbackRate > 0 ? playbackRate : defaults.playbackRate
	};
}
function resolveVideoSize(raw) {
	const parsed = VideoSizeSchema.safeParse(raw);
	if (!parsed.success) return DEFAULT_VIDEO_SIZE;
	return parsed.data;
}
function isUnknownRecord$1(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}
/**
* Drop legacy floating-panel width/height from featureState.panel.
* Keeps tab and any other keys. No SCHEMA_VERSION bump.
*/
function stripLegacyPanelWindowSize(data) {
	const featureState = data.settings?.featureState;
	if (featureState === void 0) return {
		data,
		changed: false
	};
	const panelRaw = featureState[LEGACY_PANEL_FEATURE_STATE_ID];
	if (!isUnknownRecord$1(panelRaw)) return {
		data,
		changed: false
	};
	const hasWidth = Object.prototype.hasOwnProperty.call(panelRaw, LEGACY_PANEL_WIDTH_KEY);
	const hasHeight = Object.prototype.hasOwnProperty.call(panelRaw, LEGACY_PANEL_HEIGHT_KEY);
	if (!hasWidth && !hasHeight) return {
		data,
		changed: false
	};
	const nextPanel = {};
	for (const [key, value] of Object.entries(panelRaw)) {
		if (key === "width" || key === "height") continue;
		nextPanel[key] = value;
	}
	const nextFeatureState = { ...featureState };
	if (Object.keys(nextPanel).length === 0) delete nextFeatureState[LEGACY_PANEL_FEATURE_STATE_ID];
	else nextFeatureState[LEGACY_PANEL_FEATURE_STATE_ID] = nextPanel;
	const nextSettings = data.settings === void 0 ? { gridFavButtons: true } : { ...data.settings };
	if (Object.keys(nextFeatureState).length === 0) delete nextSettings.featureState;
	else nextSettings.featureState = nextFeatureState;
	return {
		data: {
			...data,
			settings: nextSettings
		},
		changed: true
	};
}
/**
* Saved masonry grid becomes default. Post-panel tab choice is removed.
* No SCHEMA_VERSION bump.
*/
function migrateRetiredFeatureChoices(data) {
	const featureChoice = data.settings?.featureChoice;
	if (featureChoice === void 0) return {
		data,
		changed: false
	};
	const nextChoice = { ...featureChoice };
	let changed = false;
	if (nextChoice[GRID_DENSITY_CHOICE_ID] === LEGACY_MASONRY_CHOICE_VALUE) {
		nextChoice[GRID_DENSITY_CHOICE_ID] = GRID_DENSITY_DEFAULT_VALUE;
		changed = true;
	}
	if (Object.prototype.hasOwnProperty.call(nextChoice, POST_PANEL_TAB_CHOICE_ID)) {
		delete nextChoice[POST_PANEL_TAB_CHOICE_ID];
		changed = true;
	}
	if (!changed) return {
		data,
		changed: false
	};
	const nextSettings = data.settings === void 0 ? { gridFavButtons: true } : { ...data.settings };
	if (Object.keys(nextChoice).length === 0) delete nextSettings.featureChoice;
	else nextSettings.featureChoice = nextChoice;
	return {
		data: {
			...data,
			settings: nextSettings
		},
		changed: true
	};
}
function isPlaylist(collection) {
	return collection.kind === COLLECTION_KIND_POSTS;
}
/**
* Posts collections gain `thumbs: {}` and `shuffledOrder: null` when those
* keys are absent. Saved searches (including explicit `kind: "search"`) are
* copied through unchanged. No SCHEMA_VERSION bump.
*/
function migrateCollectionMediaFields(data) {
	let changed = false;
	const collections = [];
	for (const collection of data.collections) {
		if (!isPlaylist(collection)) {
			collections.push(collection);
			continue;
		}
		const needsThumbs = collection.thumbs === void 0;
		const needsOrder = collection.shuffledOrder === void 0;
		if (!needsThumbs && !needsOrder) {
			collections.push(collection);
			continue;
		}
		changed = true;
		const next = { ...collection };
		if (needsThumbs) next.thumbs = {};
		if (needsOrder) next.shuffledOrder = null;
		collections.push(next);
	}
	if (!changed) return {
		data,
		changed: false
	};
	return {
		data: {
			...data,
			collections
		},
		changed: true
	};
}
function resolveCollectionKind(collection) {
	return collection.kind ?? "search";
}
function createDefaultFavs() {
	return {
		version: 1,
		ids: []
	};
}
function createDefaultAppearance() {
	return { theme: DEFAULT_APPEARANCE_THEME };
}
/**
* Drop legacy custom color fields; pick Light/Dark base from stored base or
* luminance of legacy `bg`.
*/
function normalizeAppearanceCustom(raw) {
	const next = { base: raw.base === "light" || raw.base === "dark" ? raw.base : customBaseFromLegacyBg(raw.bg) };
	if (raw.backgroundImage !== void 0) next.backgroundImage = raw.backgroundImage;
	if (raw.backgroundDim !== void 0) next.backgroundDim = raw.backgroundDim;
	return next;
}
function normalizeAppearance(stored) {
	if (stored.custom === void 0) return { theme: stored.theme };
	return {
		theme: stored.theme,
		custom: normalizeAppearanceCustom(stored.custom)
	};
}
function createDefaultStorage() {
	return {
		version: 1,
		collections: [],
		artists: [],
		marks: {},
		settings: {
			gridFavButtons: true,
			updatesGroupSize: 0,
			tweaksEnabled: true,
			appearance: createDefaultAppearance()
		},
		updates: { seenPostId: 0 }
	};
}
function resolveAppearance(data) {
	const stored = data.settings?.appearance;
	if (stored === void 0) return createDefaultAppearance();
	return normalizeAppearance(stored);
}
function resolveGridFavButtons(data) {
	return data.settings?.gridFavButtons ?? true;
}
function resolveTweaksEnabled(data) {
	return data.settings?.tweaksEnabled ?? true;
}
function resolveUpdatesGroupSize(data) {
	return data.settings?.updatesGroupSize ?? 0;
}
function resolvePlaylistChunkSize(data) {
	return data.settings?.playlistChunkSize ?? 40;
}
function resolveSeenPostId(data) {
	return data.updates?.seenPostId ?? 0;
}
var UPDATES_ID_TOKEN_PATTERN = /^id:>(\d+)$/;
var PLAYLIST_ID_TOKEN_PATTERN = /^id:(\d+)$/;
function normalizeArtistTag(raw) {
	const trimmed = raw.trim().toLowerCase();
	if (trimmed.length === 0) return null;
	const withUnderscores = trimmed.replaceAll(" ", "_");
	if (/\s/.test(withUnderscores)) return null;
	if (withUnderscores === "(" || withUnderscores === ")" || withUnderscores === "~") return null;
	if (withUnderscores.startsWith("-")) return null;
	if (withUnderscores.length === 0) return null;
	return withUnderscores;
}
function parseTags(raw) {
	return raw.trim().split(/\s+/).filter((token) => token.length > 0).map((token) => {
		if (token.startsWith("-") && token.length > 1) return {
			tag: token.slice(1),
			type: TAG_TYPE_EXCLUDE
		};
		return {
			tag: token,
			type: TAG_TYPE_INCLUDE
		};
	});
}
function serialize(tags) {
	return tags.map((entry) => entry.type === "exclude" ? `-${entry.tag}` : entry.tag).join(" ");
}
function encodeSearchToken(raw) {
	return encodeURIComponent(raw).replaceAll("(", "%28").replaceAll(")", "%29");
}
function buildSearchUrl(tags) {
	const encoded = tags.map((entry) => {
		return encodeSearchToken(entry.type === "exclude" ? `-${entry.tag}` : entry.tag);
	}).join("+");
	const params = new URLSearchParams();
	params.set(SEARCH_PARAM_PAGE, SEARCH_PAGE);
	params.set("s", SEARCH_SECTION);
	return `${SITE_ORIGIN}${SEARCH_PATH}?${params.toString()}&${SEARCH_PARAM_TAGS}=${encoded}`;
}
function formatGroupQuery(tags) {
	if (tags.length === 1) {
		const only = tags[0];
		return only === void 0 ? "" : only;
	}
	return `( ${tags.join(` ~ `)} )`;
}
function buildUpdatesQueries(artistTags, seenPostId, groupSize) {
	const normalized = [];
	for (const raw of artistTags) {
		const tag = normalizeArtistTag(raw);
		if (tag !== null) normalized.push(tag);
	}
	if (normalized.length === 0) return [];
	const groups = [];
	if (groupSize <= 0) groups.push(normalized);
	else for (let index = 0; index < normalized.length; index += groupSize) groups.push(normalized.slice(index, index + groupSize));
	return groups.map((group) => {
		const base = formatGroupQuery(group);
		return base;
	});
}
function buildUpdatesSearchUrl(query) {
	return buildSearchUrl(parseTags(query));
}
/**
* First artist OR-group without an id:> token (single tag, no parentheses, if one artist).
*/
function buildFeedQuery(artistTags, groupSize) {
	const first = buildUpdatesQueries(artistTags, 0, groupSize)[0];
	return first === void 0 ? "" : first;
}
/** Search URL for the first feed group of followed artists. */
function buildFeedUrl(artistTags, groupSize) {
	const query = buildFeedQuery(artistTags, groupSize);
	if (query.length === 0) return buildSearchUrl([]);
	return buildUpdatesSearchUrl(query);
}
function stripUpdatesIdFilter(tagsParam) {
	const tokens = tagsParam.trim().split(/\s+/).filter((token) => token.length > 0);
	if (tokens.length === 0) return "";
	const last = tokens[tokens.length - 1];
	if (last !== void 0 && UPDATES_ID_TOKEN_PATTERN.test(last)) return tokens.slice(0, -1).join(" ");
	return tokens.join(" ");
}
function trackedArtistSet(artistTags) {
	const tracked = /* @__PURE__ */ new Set();
	for (const raw of artistTags) {
		const tag = normalizeArtistTag(raw);
		if (tag !== null) tracked.add(tag);
	}
	return tracked;
}
function parseUpdatesArtistQuery(tagsParam, tracked) {
	if (tracked.size === 0) return null;
	const tokens = tagsParam.trim().split(/\s+/).filter((token) => token.length > 0);
	if (tokens.length === 0) return null;
	let body = tokens;
	let hasIdFilter = false;
	const last = tokens[tokens.length - 1];
	if (last !== void 0 && UPDATES_ID_TOKEN_PATTERN.test(last)) {
		body = tokens.slice(0, -1);
		hasIdFilter = true;
	}
	if (body.some((token) => UPDATES_ID_TOKEN_PATTERN.test(token))) return null;
	if (body.length === 0) return null;
	const tags = [];
	if (body.length === 1) {
		const only = body[0];
		if (only === void 0) return null;
		const tag = normalizeArtistTag(only);
		if (tag === null || !tracked.has(tag)) return null;
		tags.push(tag);
		return {
			tags,
			hasIdFilter
		};
	}
	const first = body[0];
	const lastBody = body[body.length - 1];
	if (first !== "(" || lastBody !== ")") return null;
	const inner = body.slice(1, -1);
	if (inner.length === 0 || inner.length % 2 === 0) return null;
	for (let index = 0; index < inner.length; index += 1) {
		const token = inner[index];
		if (token === void 0) return null;
		if (index % 2 === 1) {
			if (token !== "~") return null;
			continue;
		}
		const tag = normalizeArtistTag(token);
		if (tag === null || !tracked.has(tag)) return null;
		if (tags.includes(tag)) return null;
		tags.push(tag);
	}
	return {
		tags,
		hasIdFilter
	};
}
function isExactTrackedSet(tags, tracked) {
	if (tags.length !== tracked.size) return false;
	for (const tag of tags) if (!tracked.has(tag)) return false;
	return true;
}
function isFullUpdatesQuery(tagsParam, artistTags) {
	const tracked = trackedArtistSet(artistTags);
	const parsed = parseUpdatesArtistQuery(tagsParam, tracked);
	if (parsed === null) return false;
	return isExactTrackedSet(parsed.tags, tracked);
}
function isPartialUpdatesQuery(tagsParam, artistTags) {
	const tracked = trackedArtistSet(artistTags);
	const parsed = parseUpdatesArtistQuery(tagsParam, tracked);
	if (parsed === null) return false;
	if (!parsed.hasIdFilter) return false;
	if (isExactTrackedSet(parsed.tags, tracked)) return false;
	return parsed.tags.length > 0 && parsed.tags.length < tracked.size;
}
function formatPlaylistIdToken(postId) {
	return `id:${String(postId)}`;
}
function formatPlaylistChunkQuery(ids) {
	if (ids.length === 1) {
		const only = ids[0];
		return only === void 0 ? "" : formatPlaylistIdToken(only);
	}
	return `( ${ids.map(formatPlaylistIdToken).join(` ~ `)} )`;
}
/**
* Builds playlist search queries: ids descending, chunked by `chunkSize`.
* One id → `id:N`; multiple → `( id:A ~ id:B ~ ... )`.
* `chunkSize <= 0` keeps all ids in a single query.
*/
function buildPlaylistQueries(postIds, chunkSize) {
	const unique = /* @__PURE__ */ new Set();
	for (const raw of postIds) {
		if (!Number.isFinite(raw)) continue;
		const id = Math.trunc(raw);
		if (id >= 0) unique.add(id);
	}
	const sorted = Array.from(unique).sort((a, b) => b - a);
	if (sorted.length === 0) return [];
	const chunks = [];
	if (chunkSize <= 0) chunks.push(sorted);
	else for (let index = 0; index < sorted.length; index += chunkSize) chunks.push(sorted.slice(index, index + chunkSize));
	return chunks.map(formatPlaylistChunkQuery);
}
/**
* Parses a playlist id-query produced by `buildPlaylistQueries`.
* Returns null when any non-playlist token is present.
*/
function parsePlaylistQuery(tagsParam) {
	const tokens = tagsParam.trim().split(/\s+/).filter((token) => token.length > 0);
	if (tokens.length === 0) return null;
	if (tokens.length === 1) {
		const only = tokens[0];
		if (only === void 0) return null;
		const match = PLAYLIST_ID_TOKEN_PATTERN.exec(only);
		if (match === null) return null;
		const id = Number(match[1]);
		if (!Number.isFinite(id)) return null;
		return [id];
	}
	const first = tokens[0];
	const last = tokens[tokens.length - 1];
	if (first !== "(" || last !== ")") return null;
	const inner = tokens.slice(1, -1);
	if (inner.length === 0 || inner.length % 2 === 0) return null;
	const ids = [];
	for (let index = 0; index < inner.length; index += 1) {
		const token = inner[index];
		if (token === void 0) return null;
		if (index % 2 === 1) {
			if (token !== "~") return null;
			continue;
		}
		const match = PLAYLIST_ID_TOKEN_PATTERN.exec(token);
		if (match === null) return null;
		const id = Number(match[1]);
		if (!Number.isFinite(id)) return null;
		if (ids.includes(id)) return null;
		ids.push(id);
	}
	return ids;
}
/** Site shuffle token. Ignored when matching a saved dynamic search. */
var SORT_RANDOM_TOKEN = "sort:random";
var SEARCH_TOKEN_SPLIT = /\s+/;
function searchTokens(raw) {
	return raw.trim().split(SEARCH_TOKEN_SPLIT).filter((token) => token.length > 0);
}
function tokenCountsIgnoringSortRandom(raw) {
	const counts = /* @__PURE__ */ new Map();
	for (const token of searchTokens(raw)) {
		if (token === "sort:random") continue;
		counts.set(token, (counts.get(token) ?? 0) + 1);
	}
	return counts;
}
/** True when `raw` contains at least one `sort:random` token. */
function queryHasSortRandom(raw) {
	return searchTokens(raw).includes(SORT_RANDOM_TOKEN);
}
/** Token string with every `sort:random` removed. Other tokens keep their order. */
function withoutSortRandom(raw) {
	return searchTokens(raw).filter((token) => token !== SORT_RANDOM_TOKEN).join(" ");
}
/**
* Token string that includes one trailing `sort:random`.
* Existing shuffle tokens are left in place.
*/
function withSortRandom(raw) {
	const tokens = searchTokens(raw);
	if (!tokens.includes("sort:random")) tokens.push(SORT_RANDOM_TOKEN);
	return tokens.join(" ");
}
/**
* True when two search strings are the same multiset of tokens.
* Token order does not matter. Every `sort:random` token is ignored.
*/
function queriesMatchIgnoringSortRandom(left, right) {
	const leftCounts = tokenCountsIgnoringSortRandom(left);
	const rightCounts = tokenCountsIgnoringSortRandom(right);
	if (leftCounts.size !== rightCounts.size) return false;
	for (const [token, count] of leftCounts) if (rightCounts.get(token) !== count) return false;
	return true;
}
/** localStorage key for the followed-artists tag list mirror (not a cookie). */
var ARTISTS_MIRROR_KEY = "ruledesk-web.artists-mirror";
/**
* Writes the followed artist tags to localStorage.
* Store calls this on every artists-list save (authoritative), and seeds once
* on load only when the mirror is missing/unparseable — never replace-from-GM
* over an existing fresher mirror (bfcache).
* Swallows localStorage errors and logs them.
*/
function writeArtistsMirror(tags) {
	try {
		localStorage.setItem(ARTISTS_MIRROR_KEY, JSON.stringify([...tags]));
	} catch (error) {
		log.error("artists-mirror: write failed", error);
	}
}
/**
* Reads the mirrored artist tags.
* @returns tag list, or null if missing / unparseable
*/
function readArtistsMirror() {
	try {
		const raw = localStorage.getItem(ARTISTS_MIRROR_KEY);
		if (raw === null) return null;
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return null;
		for (const item of parsed) if (typeof item !== "string") return null;
		return parsed;
	} catch (error) {
		log.error("artists-mirror: read failed", error);
		return null;
	}
}
/** localStorage key for dynamic-collection covers, keyed by collection id. */
var COVER_MIRROR_KEY = "ruledesk-web.covers-mirror";
var CoverMirrorSchema = /* @__PURE__ */ record(/* @__PURE__ */ string(), /* @__PURE__ */ array(/* @__PURE__ */ string()));
/**
* Covers are written on a results page and read on the Collections page.
* Coming back with the browser Back button restores that page from bfcache,
* where the userscript storage can still hold the old value; localStorage is
* shared and current, so the card reads the cover from here first.
*/
function readAll() {
	try {
		const raw = localStorage.getItem(COVER_MIRROR_KEY);
		if (raw === null) return {};
		const parsed = CoverMirrorSchema.safeParse(JSON.parse(raw));
		return parsed.success ? parsed.data : {};
	} catch (error) {
		log.error("cover-mirror: read failed", error);
		return {};
	}
}
function writeAll(mirror) {
	try {
		localStorage.setItem(COVER_MIRROR_KEY, JSON.stringify(mirror));
	} catch (error) {
		log.error("cover-mirror: write failed", error);
	}
}
/** Mirrored cover of one collection, or null when none is stored. */
function readCoverMirror(collectionId) {
	const cover = readAll()[collectionId];
	return cover === void 0 ? null : cover;
}
/** Stores one cover and drops entries of collections that no longer exist. */
function writeCoverMirror(collectionId, cover, knownIds) {
	const current = readAll();
	const next = {};
	for (const id of knownIds) {
		const kept = current[id];
		if (kept !== void 0) next[id] = kept;
	}
	next[collectionId] = [...cover];
	writeAll(next);
}
/** Forgets the cover of one collection (query changed, collection deleted). */
function removeCoverMirror(collectionId) {
	const current = readAll();
	if (current[collectionId] === void 0) return;
	const next = {};
	for (const [id, cover] of Object.entries(current)) if (id !== collectionId) next[id] = cover;
	writeAll(next);
}
/** Keep at most this many mark entries (highest post ids). */
var MARKS_KEEP_LIMIT = 2e4;
/** Prune only after size exceeds keep limit by this fraction (hysteresis). */
var MARKS_PRUNE_OVERFLOW_RATIO = .1;
function marksPruneThreshold(keepLimit = MARKS_KEEP_LIMIT) {
	return keepLimit + Math.floor(keepLimit * MARKS_PRUNE_OVERFLOW_RATIO);
}
function postIdSortKey(postId) {
	const parsed = Number(postId);
	if (!Number.isFinite(parsed)) return Number.NEGATIVE_INFINITY;
	return Math.trunc(parsed);
}
/**
* When marks size exceeds keepLimit by 10%, keep only the highest
* `keepLimit` post ids. Below/at the threshold, returns the same object.
*/
function pruneMarksIfNeeded(marks, keepLimit = MARKS_KEEP_LIMIT) {
	const entries = Object.entries(marks);
	const threshold = marksPruneThreshold(keepLimit);
	if (entries.length <= threshold) return {
		marks,
		pruned: false
	};
	const sorted = [...entries].sort((left, right) => postIdSortKey(right[0]) - postIdSortKey(left[0]));
	const next = {};
	for (const [postId, flags] of sorted.slice(0, keepLimit)) next[postId] = flags;
	return {
		marks: next,
		pruned: true
	};
}
var cachedIds = null;
var cachedSync;
var cacheHydrated = false;
function getGmGetValue$1() {
	return GM_getValue;
}
function getGmSetValue$1() {
	return GM_setValue;
}
function isUnknownRecord(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}
function isIntNumber(value) {
	return typeof value === "number" && Number.isInteger(value);
}
function isIntNumberArray(value) {
	return Array.isArray(value) && value.every(isIntNumber);
}
/**
* Cheap page-path shape check: version + integer id array.
* Optional `sync` is validated with the small FavsSyncSchema when present.
* Full FavsSchema is reserved for {@link parseFavsStrict} (import / migration).
*/
function cheapParseFavs(raw) {
	if (!isUnknownRecord(raw)) return null;
	if (raw.version !== 1) return null;
	if (!isIntNumberArray(raw.ids)) return null;
	const next = {
		version: 1,
		ids: raw.ids
	};
	if (raw.sync !== void 0) {
		const syncParsed = FavsSyncSchema.safeParse(raw.sync);
		if (syncParsed.success) next.sync = syncParsed.data;
	}
	return next;
}
/** Full zod parse for import / migration callers. */
function parseFavsStrict(raw) {
	const parsed = FavsSchema.safeParse(raw);
	if (!parsed.success) return null;
	return parsed.data;
}
function normalizePostId$1(id) {
	if (typeof id === "number") {
		if (!Number.isFinite(id)) return null;
		return Math.trunc(id);
	}
	const trimmed = id.trim();
	if (trimmed.length === 0) return null;
	const parsed = Number(trimmed);
	if (!Number.isFinite(parsed)) return null;
	return Math.trunc(parsed);
}
function readFavsRaw() {
	const raw = getGmGetValue$1()(FAVS_STORAGE_KEY, void 0);
	if (raw === void 0 || raw === null) return createDefaultFavs();
	const parsed = cheapParseFavs(raw);
	if (parsed === null) {
		log.error("Invalid favs storage content; using empty favs", { key: FAVS_STORAGE_KEY });
		return createDefaultFavs();
	}
	return parsed;
}
function writeFavsData(data) {
	getGmSetValue$1()(FAVS_STORAGE_KEY, data);
}
function setCacheFromData(data) {
	cachedIds = new Set(data.ids);
	cachedSync = data.sync;
	cacheHydrated = true;
}
function readMainStorageRaw() {
	const raw = getGmGetValue$1()(STORAGE_KEY, void 0);
	if (raw === void 0 || raw === null) return null;
	const parsed = StorageSchema.safeParse(raw);
	if (!parsed.success) return null;
	return parsed.data;
}
function writeMainStorage(data) {
	const pruned = pruneMarksIfNeeded(data.marks);
	const next = pruned.pruned ? {
		...data,
		marks: pruned.marks
	} : data;
	getGmSetValue$1()(STORAGE_KEY, StorageSchema.parse(next));
}
/**
* Extract legacy `marks.*.fav === true` into favs.ids, strip `fav` from marks,
* strip legacy panel window size from featureState, save both keys.
* Idempotent. Preserves `marks.seen` and other featureState keys.
* Favs blob: full zod when rewriting after a marks/panel change; cheap read otherwise.
*/
function migrateMarksFavToFavs() {
	const main = readMainStorageRaw();
	const favsRaw = getGmGetValue$1()(FAVS_STORAGE_KEY, void 0);
	const favsCheap = favsRaw === void 0 || favsRaw === null ? createDefaultFavs() : cheapParseFavs(favsRaw);
	const favs = favsCheap ?? createDefaultFavs();
	if (favsCheap === null && favsRaw !== void 0 && favsRaw !== null) log.error("Invalid favs storage content; using empty favs", { key: FAVS_STORAGE_KEY });
	const ids = new Set(favs.ids);
	let marksChanged = false;
	let mainToWrite = null;
	if (main !== null) {
		const nextMarks = {};
		for (const [postId, flags] of Object.entries(main.marks)) {
			const nextFlags = {};
			if (flags.seen === true) nextFlags.seen = true;
			if (flags.fav === true) {
				const normalized = normalizePostId$1(postId);
				if (normalized !== null) ids.add(normalized);
				marksChanged = true;
			} else if (flags.fav !== void 0) marksChanged = true;
			if (Object.keys(nextFlags).length > 0) nextMarks[postId] = nextFlags;
			else if (flags.fav === void 0 && flags.seen === void 0) nextMarks[postId] = {};
		}
		let nextMain = main;
		if (marksChanged) nextMain = {
			...main,
			marks: nextMarks
		};
		const stripped = stripLegacyPanelWindowSize(nextMain);
		const choices = migrateRetiredFeatureChoices(stripped.data);
		if (marksChanged || stripped.changed || choices.changed) mainToWrite = choices.data;
	}
	if (mainToWrite !== null) writeMainStorage(mainToWrite);
	const nextFavs = {
		version: favs.version,
		ids: Array.from(ids)
	};
	if (favs.sync !== void 0) nextFavs.sync = favs.sync;
	if (nextFavs.ids.length !== favs.ids.length || nextFavs.ids.some((id) => !favs.ids.includes(id))) {
		const strict = parseFavsStrict(nextFavs);
		if (strict === null) log.error("migrateMarksFavToFavs: strict favs validate failed; skipping write", { key: FAVS_STORAGE_KEY });
		else {
			writeFavsData(strict);
			setCacheFromData(strict);
			return;
		}
	}
	setCacheFromData(nextFavs);
}
function ensureCache() {
	if (cacheHydrated && cachedIds !== null) return cachedIds;
	migrateMarksFavToFavs();
	if (cachedIds === null) setCacheFromData(readFavsRaw());
	return cachedIds ?? /* @__PURE__ */ new Set();
}
function persistIds(ids) {
	const next = {
		version: createDefaultFavs().version,
		ids: Array.from(ids)
	};
	if (cachedSync !== void 0) next.sync = cachedSync;
	writeFavsData(next);
	cachedIds = ids;
	cacheHydrated = true;
}
/** Clears the in-memory fav cache (tests / full remount). */
function clearFavsCache() {
	cachedIds = null;
	cachedSync = void 0;
	cacheHydrated = false;
}
function loadFavSet() {
	return ensureCache();
}
function isFav(id) {
	const normalized = normalizePostId$1(id);
	if (normalized === null) return false;
	return ensureCache().has(normalized);
}
function addFav(id) {
	const normalized = normalizePostId$1(id);
	if (normalized === null) return;
	const ids = new Set(ensureCache());
	if (ids.has(normalized)) {
		cachedIds = ids;
		return;
	}
	ids.add(normalized);
	persistIds(ids);
}
function removeFav(id) {
	const normalized = normalizePostId$1(id);
	if (normalized === null) return;
	const ids = new Set(ensureCache());
	if (!ids.has(normalized)) {
		cachedIds = ids;
		return;
	}
	ids.delete(normalized);
	persistIds(ids);
}
function addFavs(ids) {
	if (ids.length === 0) {
		ensureCache();
		return;
	}
	const next = new Set(ensureCache());
	let changed = false;
	for (const id of ids) {
		const normalized = normalizePostId$1(id);
		if (normalized === null) continue;
		if (!next.has(normalized)) {
			next.add(normalized);
			changed = true;
		}
	}
	if (changed) persistIds(next);
	else cachedIds = next;
}
function getSyncState() {
	ensureCache();
	return cachedSync;
}
function setSyncState(sync) {
	const ids = ensureCache();
	cachedSync = sync;
	const next = {
		version: createDefaultFavs().version,
		ids: Array.from(ids)
	};
	if (sync !== void 0) next.sync = sync;
	writeFavsData(next);
	cacheHydrated = true;
}
/**
* Strip legacy `fav` flags from a marks record and return the fav post ids found.
* Used by import to treat old `marks.fav` as fav ids.
*/
function extractFavIdsFromMarks(marks) {
	const favIds = [];
	const nextMarks = {};
	for (const [postId, flags] of Object.entries(marks)) {
		if (flags.fav === true) {
			const normalized = normalizePostId$1(postId);
			if (normalized !== null) favIds.push(normalized);
		}
		const nextFlags = {};
		if (flags.seen === true) nextFlags.seen = true;
		if (Object.keys(nextFlags).length > 0) nextMarks[postId] = nextFlags;
	}
	return {
		marks: nextMarks,
		favIds
	};
}
var cachedStorage = null;
var storageCacheHydrated = false;
function getGmGetValue$2() {
	return GM_getValue;
}
function getGmSetValue() {
	return GM_setValue;
}
function readRaw() {
	return getGmGetValue$2()(STORAGE_KEY, void 0);
}
function writeData(data) {
	getGmSetValue()(STORAGE_KEY, data);
}
function setStorageCache(data) {
	cachedStorage = data;
	storageCacheHydrated = true;
}
/** Authoritative replace: used after intentional GM writes ({@link save}). */
function syncArtistsMirror(data) {
	writeArtistsMirror(data.artists.map((entry) => entry.tag));
}
/**
* Seeds the mirror from GM only when missing/unparseable.
* Never replaces an existing fresher mirror (bfcache / cross-tab).
*/
function seedArtistsMirrorIfMissing(data) {
	if (readArtistsMirror() !== null) return;
	syncArtistsMirror(data);
}
/** Clears the in-memory main storage cache (tests / full remount). */
function clearStorageCache() {
	cachedStorage = null;
	storageCacheHydrated = false;
}
function loadUncached() {
	const raw = readRaw();
	if (raw === void 0 || raw === null) {
		migrateMarksFavToFavs();
		const empty = createDefaultStorage();
		seedArtistsMirrorIfMissing(empty);
		return empty;
	}
	const parsed = StorageSchema.safeParse(raw);
	if (!parsed.success) {
		backupInvalid(raw);
		migrateMarksFavToFavs();
		const empty = createDefaultStorage();
		seedArtistsMirrorIfMissing(empty);
		return empty;
	}
	migrateMarksFavToFavs();
	const after = readRaw();
	if (after === void 0 || after === null) {
		const empty = createDefaultStorage();
		seedArtistsMirrorIfMissing(empty);
		return empty;
	}
	const reparsed = StorageSchema.safeParse(after);
	if (!reparsed.success) {
		seedArtistsMirrorIfMissing(parsed.data);
		return persistCollectionMediaMigration(parsed.data);
	}
	seedArtistsMirrorIfMissing(reparsed.data);
	return persistCollectionMediaMigration(reparsed.data);
}
function persistCollectionMediaMigration(data) {
	const migrated = migrateCollectionMediaFields(data);
	if (!migrated.changed) return data;
	const parsed = StorageSchema.parse(migrated.data);
	writeData(parsed);
	return parsed;
}
function backupInvalid(raw) {
	getGmSetValue()(STORAGE_BACKUP_KEY, raw);
	log.error("Invalid storage content backed up", {
		key: STORAGE_KEY,
		backupKey: STORAGE_BACKUP_KEY
	});
}
function currentSettings(data) {
	const next = {
		gridFavButtons: resolveGridFavButtons(data),
		updatesGroupSize: resolveUpdatesGroupSize(data),
		playlistChunkSize: resolvePlaylistChunkSize(data),
		tweaksEnabled: resolveTweaksEnabled(data)
	};
	if (data.settings?.features !== void 0) next.features = { ...data.settings.features };
	if (data.settings?.featureChoice !== void 0) next.featureChoice = { ...data.settings.featureChoice };
	if (data.settings?.featureState !== void 0) next.featureState = { ...data.settings.featureState };
	if (data.settings?.appearance !== void 0) next.appearance = data.settings.appearance;
	return next;
}
function normalizePostId(postId) {
	if (!Number.isFinite(postId)) return null;
	const truncated = Math.trunc(postId);
	if (truncated < 0) return null;
	return truncated;
}
function load() {
	if (storageCacheHydrated && cachedStorage !== null) return cachedStorage;
	const data = loadUncached();
	setStorageCache(data);
	return data;
}
/** Drop the in-memory cache and re-read + validate from GM storage. */
function reloadFromStorage() {
	clearStorageCache();
	return load();
}
function save(data) {
	const migrated = migrateCollectionMediaFields(StorageSchema.parse(data)).data;
	const pruned = pruneMarksIfNeeded(migrated.marks);
	const toWrite = pruned.pruned ? {
		...migrated,
		marks: pruned.marks
	} : migrated;
	writeData(toWrite);
	migrateMarksFavToFavs();
	const after = readRaw();
	if (after === void 0 || after === null) {
		const empty = createDefaultStorage();
		setStorageCache(empty);
		syncArtistsMirror(empty);
		return;
	}
	const reparsed = StorageSchema.safeParse(after);
	if (!reparsed.success) {
		setStorageCache(toWrite);
		syncArtistsMirror(toWrite);
		return;
	}
	setStorageCache(reparsed.data);
	syncArtistsMirror(reparsed.data);
}
function renameCollection(id, name) {
	const data = reloadFromStorage();
	const target = data.collections.find((item) => item.id === id);
	if (target === void 0) return null;
	target.name = name.trim();
	CollectionSchema.parse(target);
	save(data);
	return target;
}
function deleteCollection(id) {
	const data = reloadFromStorage();
	const next = data.collections.filter((item) => item.id !== id);
	if (next.length === data.collections.length) return false;
	removeCoverMirror(id);
	data.collections = next;
	save(data);
	return true;
}
/** Creates a post playlist (`kind: "posts"`, empty tags, empty postIds). */
function createPlaylist(name) {
	const data = reloadFromStorage();
	const collection = CollectionSchema.parse({
		id: crypto.randomUUID(),
		name: name.trim(),
		tags: [],
		kind: COLLECTION_KIND_POSTS,
		postIds: [],
		thumbs: {},
		shuffledOrder: null
	});
	data.collections.push(collection);
	save(data);
	return collection;
}
function listPlaylists() {
	return load().collections.filter(isPlaylist);
}
function playlistsContaining(postId) {
	const normalized = normalizePostId(postId);
	if (normalized === null) return [];
	return listPlaylists().filter((playlist) => (playlist.postIds ?? []).includes(normalized));
}
var FISHER_YATES_STOP_INDEX = 0;
var SHUFFLE_DISTINCT_MIN_LENGTH = 2;
var SHUFFLE_FALLBACK_INDEX = 1;
function thumbKey(postId) {
	return String(postId);
}
function readThumb(thumbs, postId) {
	if (thumbs === void 0) return null;
	const value = thumbs[thumbKey(postId)];
	if (value === void 0 || value.length === 0) return null;
	return value;
}
function normalizeThumbUrl(thumbUrl) {
	if (thumbUrl === void 0) return null;
	const trimmed = thumbUrl.trim();
	if (trimmed.length === 0) return null;
	return trimmed;
}
function samePostOrder(left, right) {
	if (left.length !== right.length) return false;
	for (let index = 0; index < left.length; index += 1) if (left[index] !== right[index]) return false;
	return true;
}
/** Fisher-Yates. When another permutation exists, the result is not `order`. */
function shufflePermutation(order) {
	const next = [...order];
	for (let index = next.length - 1; index > FISHER_YATES_STOP_INDEX; index -= 1) {
		const swapIndex = Math.floor(Math.random() * (index + 1));
		const current = next[index];
		const swapped = next[swapIndex];
		if (current === void 0 || swapped === void 0) continue;
		next[index] = swapped;
		next[swapIndex] = current;
	}
	if (next.length < SHUFFLE_DISTINCT_MIN_LENGTH || !samePostOrder(next, order)) return next;
	const first = next[FISHER_YATES_STOP_INDEX];
	const second = next[SHUFFLE_FALLBACK_INDEX];
	if (first === void 0 || second === void 0) return next;
	next[FISHER_YATES_STOP_INDEX] = second;
	next[SHUFFLE_FALLBACK_INDEX] = first;
	return next;
}
function clampInsertIndex(index, length) {
	if (!Number.isFinite(index) || index < FISHER_YATES_STOP_INDEX) return length;
	const truncated = Math.trunc(index);
	if (truncated > length) return length;
	return truncated;
}
/**
* Display order: `shuffledOrder` with deleted ids dropped, then postIds that
* are not in that list (new since the shuffle), in insertion order.
* `null` / missing `shuffledOrder` is insertion order.
*/
function collectionDisplayOrder(collection) {
	const insertion = collection.postIds ?? [];
	const shuffled = collection.shuffledOrder;
	if (shuffled === void 0 || shuffled === null) return [...insertion];
	const present = new Set(insertion);
	const ordered = [];
	const seen = /* @__PURE__ */ new Set();
	for (const id of shuffled) {
		if (!present.has(id) || seen.has(id)) continue;
		ordered.push(id);
		seen.add(id);
	}
	for (const id of insertion) {
		if (seen.has(id)) continue;
		ordered.push(id);
		seen.add(id);
	}
	return ordered;
}
function findPlaylist(data, collectionId) {
	const target = data.collections.find((item) => item.id === collectionId);
	if (target === void 0 || !isPlaylist(target)) return null;
	return target;
}
function ensurePostsMedia(target) {
	target.kind = COLLECTION_KIND_POSTS;
	target.tags = [];
	if (target.thumbs === void 0) target.thumbs = {};
	if (target.shuffledOrder === void 0) target.shuffledOrder = null;
}
/**
* Phase 2 HANDOFF: custom collections are `kind: "posts"`.
* Append `postId` (no duplicates). Pass `thumbUrl` to store a thumb.
* Re-add with a URL fills an empty thumb; re-add without a URL keeps a known thumb.
* New ids stay out of `shuffledOrder` and show up at the end of {@link getCollectionOrder}.
*/
function addPostToCollection(collectionId, postId, thumbUrl) {
	const normalized = normalizePostId(postId);
	if (normalized === null) return null;
	const data = reloadFromStorage();
	const target = findPlaylist(data, collectionId);
	if (target === null) return null;
	const postIds = [...target.postIds ?? []];
	if (!postIds.includes(normalized)) {
		postIds.push(normalized);
		if (target.shuffledOrder !== void 0 && target.shuffledOrder !== null) target.shuffledOrder = target.shuffledOrder.filter((id) => id !== normalized);
	}
	target.postIds = postIds;
	const incoming = normalizeThumbUrl(thumbUrl);
	const known = readThumb(target.thumbs, normalized);
	const nextThumb = incoming ?? known;
	if (nextThumb !== null) target.thumbs = {
		...target.thumbs ?? {},
		[thumbKey(normalized)]: nextThumb
	};
	ensurePostsMedia(target);
	CollectionSchema.parse(target);
	save(data);
	return target;
}
/**
* Phase 2 HANDOFF: drops the given ids from a custom collection.
* Returned snapshot is the undo input for {@link restorePosts}.
* Unknown ids are omitted. A missing or non-posts collection returns null.
*/
function removePostsFromCollection(collectionId, postIds) {
	const data = reloadFromStorage();
	const target = findPlaylist(data, collectionId);
	if (target === null) return null;
	const removal = /* @__PURE__ */ new Set();
	for (const rawId of postIds) {
		const normalized = normalizePostId(rawId);
		if (normalized !== null) removal.add(normalized);
	}
	const currentIds = target.postIds ?? [];
	const display = collectionDisplayOrder(target);
	const posts = [];
	for (let index = 0; index < currentIds.length; index += 1) {
		const id = currentIds[index];
		if (id === void 0 || !removal.has(id)) continue;
		const displayIndex = display.indexOf(id);
		posts.push({
			postId: id,
			thumbUrl: readThumb(target.thumbs, id),
			insertionIndex: index,
			displayIndex: displayIndex < FISHER_YATES_STOP_INDEX ? index : displayIndex
		});
	}
	if (posts.length === 0) return {
		collectionId,
		posts
	};
	const removedIds = new Set(posts.map((post) => post.postId));
	target.postIds = currentIds.filter((id) => !removedIds.has(id));
	if (target.shuffledOrder !== void 0 && target.shuffledOrder !== null) target.shuffledOrder = target.shuffledOrder.filter((id) => !removedIds.has(id));
	ensurePostsMedia(target);
	CollectionSchema.parse(target);
	save(data);
	return {
		collectionId,
		posts
	};
}
function removePostFromPlaylist(id, postId) {
	const normalized = normalizePostId(postId);
	if (normalized === null) return null;
	if (removePostsFromCollection(id, [normalized]) === null) return null;
	return load().collections.find((item) => item.id === id) ?? null;
}
/** Phase 2 HANDOFF: puts {@link removePostsFromCollection} posts back. */
function restorePosts(snapshot) {
	const data = reloadFromStorage();
	const target = findPlaylist(data, snapshot.collectionId);
	if (target === null) return null;
	if (snapshot.posts.length === 0) return target;
	const postIds = [...target.postIds ?? []];
	const thumbs = { ...target.thumbs ?? {} };
	const byInsertion = [...snapshot.posts].sort((left, right) => left.insertionIndex - right.insertionIndex);
	for (const post of byInsertion) {
		const normalized = normalizePostId(post.postId);
		if (normalized === null) continue;
		if (!postIds.includes(normalized)) {
			const index = clampInsertIndex(post.insertionIndex, postIds.length);
			postIds.splice(index, 0, normalized);
		}
		if (post.thumbUrl !== null && post.thumbUrl.length > 0) thumbs[thumbKey(normalized)] = post.thumbUrl;
	}
	target.postIds = postIds;
	target.thumbs = thumbs;
	if (target.shuffledOrder !== void 0 && target.shuffledOrder !== null) {
		const order = [...target.shuffledOrder];
		const byDisplay = [...snapshot.posts].sort((left, right) => left.displayIndex - right.displayIndex);
		for (const post of byDisplay) {
			const normalized = normalizePostId(post.postId);
			if (normalized === null || order.includes(normalized)) continue;
			const index = clampInsertIndex(post.displayIndex, order.length);
			order.splice(index, 0, normalized);
		}
		target.shuffledOrder = order;
	}
	ensurePostsMedia(target);
	CollectionSchema.parse(target);
	save(data);
	return target;
}
/** Phase 2 HANDOFF: replaces `shuffledOrder` with a new permutation of the display order. */
function shuffleCollection(collectionId) {
	const data = reloadFromStorage();
	const target = findPlaylist(data, collectionId);
	if (target === null) return null;
	target.shuffledOrder = shufflePermutation(collectionDisplayOrder(target));
	ensurePostsMedia(target);
	CollectionSchema.parse(target);
	save(data);
	return target;
}
/** Phase 2 HANDOFF: `shuffledOrder: null` so {@link getCollectionOrder} follows `postIds`. */
function resetCollectionOrder(collectionId) {
	const data = reloadFromStorage();
	const target = findPlaylist(data, collectionId);
	if (target === null) return null;
	target.shuffledOrder = null;
	ensurePostsMedia(target);
	CollectionSchema.parse(target);
	save(data);
	return target;
}
/** Phase 2 HANDOFF: read-only display order. Null when the id is missing or not a posts collection. */
function getCollectionOrder(collectionId) {
	const target = findPlaylist(load(), collectionId);
	if (target === null) return null;
	return collectionDisplayOrder(target);
}
/**
* Phase 2 HANDOFF: saved search. `query` is stored raw; `tags` are `parseTags(query)`
* so existing search links keep working. Missing `query` on older rows means
* `serialize(collection.tags)`.
*/
function createDynamicCollection(name, query) {
	const data = reloadFromStorage();
	const trimmedQuery = query.trim();
	const collection = CollectionSchema.parse({
		id: crypto.randomUUID(),
		name: name.trim(),
		tags: parseTags(trimmedQuery),
		kind: COLLECTION_KIND_SEARCH,
		query: trimmedQuery
	});
	data.collections.push(collection);
	save(data);
	return collection;
}
/**
* Remembers the first thumbs of a saved search for its card cover.
* Keeps at most {@link DYNAMIC_COVER_SIZE} non-empty URLs. Writes only when the
* cover changed; an empty list never clears a stored cover.
* Returns true when storage was written.
*/
function setDynamicCover(collectionId, thumbUrls) {
	const cover = [];
	for (const url of thumbUrls) {
		const trimmed = url.trim();
		if (trimmed.length === 0) continue;
		cover.push(trimmed);
		if (cover.length === 4) break;
	}
	if (cover.length === 0) return false;
	const known = load().collections;
	const cached = known.find((item) => item.id === collectionId);
	if (cached === void 0 || isPlaylist(cached)) return false;
	writeCoverMirror(collectionId, cover, known.map((item) => item.id));
	if (sameStrings(cached.cover ?? [], cover)) return false;
	const data = reloadFromStorage();
	const target = data.collections.find((item) => item.id === collectionId);
	if (target === void 0 || isPlaylist(target)) return false;
	if (sameStrings(target.cover ?? [], cover)) return false;
	target.cover = cover;
	CollectionSchema.parse(target);
	save(data);
	return true;
}
function sameStrings(left, right) {
	if (left.length !== right.length) return false;
	for (let index = 0; index < left.length; index += 1) if (left[index] !== right[index]) return false;
	return true;
}
/** Phase 2 HANDOFF: replaces `query` and `tags` on a saved search. Posts collections return null. */
function updateDynamicQuery(collectionId, query) {
	const data = reloadFromStorage();
	const target = data.collections.find((item) => item.id === collectionId);
	if (target === void 0 || isPlaylist(target)) return null;
	const trimmedQuery = query.trim();
	if (target.query !== trimmedQuery) {
		delete target.cover;
		removeCoverMirror(collectionId);
	}
	target.query = trimmedQuery;
	target.tags = parseTags(trimmedQuery);
	target.kind = COLLECTION_KIND_SEARCH;
	CollectionSchema.parse(target);
	save(data);
	return target;
}
function setPostSeenMark(postId) {
	const data = load();
	const previous = data.marks[postId] ?? {};
	data.marks[postId] = {
		...previous,
		seen: true
	};
	save(data);
}
function getGridFavButtonsEnabled() {
	return resolveGridFavButtons(load());
}
function setGridFavButtonsEnabled(enabled) {
	const data = load();
	data.settings = {
		...currentSettings(data),
		gridFavButtons: enabled
	};
	save(data);
}
function getTweaksEnabled() {
	return resolveTweaksEnabled(load());
}
function setTweaksEnabled(enabled) {
	const data = load();
	data.settings = {
		...currentSettings(data),
		tweaksEnabled: enabled
	};
	save(data);
}
function getFeatureEnabled(id, defaultEnabled) {
	const stored = load().settings?.features?.[id];
	if (stored === void 0) return defaultEnabled;
	return stored;
}
function setFeatureEnabled(id, enabled) {
	const data = load();
	const settings = currentSettings(data);
	const features = {
		...settings.features ?? {},
		[id]: enabled
	};
	data.settings = {
		...settings,
		features
	};
	save(data);
}
function getFeatureChoiceValue(id) {
	return load().settings?.featureChoice?.[id];
}
function setFeatureChoiceValue(id, value) {
	const data = load();
	const settings = currentSettings(data);
	const featureChoice = {
		...settings.featureChoice ?? {},
		[id]: value
	};
	data.settings = {
		...settings,
		featureChoice
	};
	save(data);
}
function getFeatureState(id) {
	return load().settings?.featureState?.[id];
}
function setFeatureState(id, value) {
	const data = load();
	const settings = currentSettings(data);
	const featureState = {
		...settings.featureState ?? {},
		[id]: value
	};
	data.settings = {
		...settings,
		featureState
	};
	save(data);
}
/**
* Effective artists-per-search pack size for query building.
* Stored 0 (default) means MAX_UPDATES_GROUP_SIZE; values above the max are capped.
*/
function getUpdatesGroupSize() {
	const stored = resolveUpdatesGroupSize(load());
	if (!Number.isFinite(stored) || stored <= 0) return 400;
	return Math.min(Math.floor(stored), 400);
}
function setUpdatesGroupSize(size) {
	const data = load();
	let safeSize = Number.isFinite(size) && size >= 0 ? Math.floor(size) : 0;
	if (safeSize > 400) safeSize = 400;
	data.settings = {
		...currentSettings(data),
		updatesGroupSize: safeSize
	};
	save(data);
}
function getPlaylistChunkSize() {
	return resolvePlaylistChunkSize(load());
}
function setPlaylistChunkSize(size) {
	const data = load();
	const safeSize = Number.isFinite(size) && size > 0 ? Math.floor(size) : 40;
	data.settings = {
		...currentSettings(data),
		playlistChunkSize: safeSize
	};
	save(data);
}
function getAppearance() {
	return resolveAppearance(load());
}
function setAppearance(appearance) {
	const parsed = AppearanceSchema.parse(appearance);
	const data = load();
	data.settings = {
		...currentSettings(data),
		appearance: parsed
	};
	save(data);
	return parsed;
}
function getSeenPostId() {
	return resolveSeenPostId(load());
}
function setSeenPostId(seenPostId) {
	const data = load();
	data.updates = { seenPostId: Number.isFinite(seenPostId) && seenPostId >= 0 ? Math.floor(seenPostId) : 0 };
	save(data);
}
/**
* Followed artist tags from a fresh GM read (not the in-memory snapshot).
* Feed href / recognition and Follow/Unfollow must not diverge across pages.
*/
function listArtistTags() {
	return reloadFromStorage().artists.map((entry) => entry.tag);
}
function isFollowingArtist(tag) {
	const normalized = normalizeArtistTag(tag);
	if (normalized === null) return false;
	return listArtistTags().includes(normalized);
}
function addArtist(tag) {
	const normalized = normalizeArtistTag(tag);
	if (normalized === null) throw new Error("Invalid artist tag");
	const data = reloadFromStorage();
	if (data.artists.some((entry) => entry.tag === normalized)) throw new Error("Duplicate artist tag");
	const entry = ArtistEntrySchema.parse({ tag: normalized });
	data.artists.push(entry);
	save(data);
	return entry;
}
function removeArtist(tag) {
	const normalized = normalizeArtistTag(tag);
	if (normalized === null) return false;
	const data = reloadFromStorage();
	const next = data.artists.filter((entry) => entry.tag !== normalized);
	if (next.length === data.artists.length) return false;
	data.artists = next;
	save(data);
	return true;
}
var n;
var t$1;
var u$2;
var i$1;
var f$2;
var o$2;
var e$1;
var l$1;
var c$1;
var a$2;
var h$1 = Symbol.for("pv");
var p$1 = {};
var y$1 = [];
var v$1 = /^m(i|n|o|s|text|space)$/;
var w$2 = Array.isArray;
var d$1 = y$1.slice;
var _$1 = Object.assign;
function g$1(n) {
	n && n.parentNode && n.remove();
}
function k$1(n, t, r) {
	var u, i, f, o = {}, e = arguments.length;
	for (f in t) "key" == f ? u = t[f] : "ref" == f && "function" != typeof n ? i = t[f] : o[f] = t[f];
	return e > 2 && (o.children = e > 3 ? d$1.call(arguments, 2) : r), m$1(n, o, u, i, null);
}
function m$1(r, u, i, f, o) {
	var e = {
		type: r,
		props: u,
		key: i,
		ref: f,
		__k: null,
		__: null,
		__b: 0,
		__e: null,
		__c: null,
		constructor: h$1,
		__v: o || ++t$1,
		__i: -1,
		__u: 0
	};
	return !o && n.vnode && n.vnode(e), e;
}
function $$1(n) {
	return n.children;
}
function x$1(n, t) {
	this.props = n, this.context = t, this.__g = 0;
}
function S(n, t) {
	if (null == t) return n.__ && S(n.__, n.__i + 1);
	for (var r; t < n.__k.length; t++) if ((r = n.__k[t]) && r.__e) return r.__e;
	return "function" != typeof n.type || n.props.__P ? null : S(n);
}
function C$1(t) {
	var r, u = t.__v, i = u.__e, f = [], o = [], e = t.__P;
	e && ((r = _$1({ constructor: h$1 }, u)).__v = u.__v + 1, n.vnode && n.vnode(r), z$2(e, r, u, t.__n, e.namespaceURI, 32 & u.__u ? [i] : null, f, i || S(u), 32 & u.__u, o), r.__v = u.__v, r.__.__k[r.__i] = r, E$1(f, r, o), u.__ = u.__e = null, r.__e != i && j(r));
}
function j(n) {
	if ((n = n.__) && n.__c && !n.props.__P) return n.__e = null, n.__k.some(function(t) {
		return t && (n.__e = t.__e);
	}), j(n);
}
function L(t) {
	(8 & t.__g || (t.__g |= 8, u$2.push(t), f$2++)) && i$1 == n.debounceRendering || ((i$1 = n.debounceRendering) || queueMicrotask)(H$1);
}
function H$1() {
	try {
		for (var n, t = 1; u$2.length;) u$2.length > t && u$2.sort(o$2), n = u$2.shift(), t = u$2.length, 8 & n.__g && C$1(n);
	} finally {
		(f$2 = u$2.length) && (i$1 || queueMicrotask)(H$1);
	}
}
function I(n, t, r, u, i, f, o, e, l, c, a) {
	var s, h, v, w, d, _, g = u.__k || y$1, k = t.length;
	for (l = q(r, t, g, l, k), s = 0; s < k; s++) null != (v = r.__k[s]) && (h = ~v.__i && g[v.__i] || p$1, v.__i = s, _ = z$2(n, v, h, i, f, o, e, l, c, a), w = v.__e, (h.ref != v.ref || 8 & h.__u) && (h.ref && G$1(h.ref, null, v, h), v.ref && a.push(v.ref, v.__c || w, v)), d = d || w, 4 & v.__u ? (l = A$1(v, l, n, !h.__v), h.__e && (h.__e = null)) : "function" == typeof v.type && void 0 !== _ ? l = _ : w && (l = w.nextSibling), v.__u &= -21);
	return r.__e = d, l;
}
function q(n, t, r, u, i) {
	var f, o, e, l, c, a, s, p, y, v = r.length, d = v, _ = 0, g = 0, k = n.__k = Array(i);
	for (f = 0; f < i; f++) null != (o = t[f]) && "boolean" != typeof o && "function" != typeof o ? ("object" != typeof o || o.constructor === String ? o = k[f] = m$1(null, o) : w$2(o) ? o = k[f] = m$1($$1, { children: o }) : o.constructor === h$1 && o.__b ? o = k[f] = m$1(o.type, o.props, o.key, o.ref, o.__v) : k[f] = o, l = f + _, o.__ = n, o.__b = n.__b + 1, e = null, ~(c = o.__i = P$2(o, r, l, d)) && (d--, (e = r[c]) && (e.__u |= 2)), e && e.__v ? (o.__u |= 16, c == l - 1 ? _-- : c == l + 1 ? _++ : c != l && (c > l ? _-- : _++, g = 1)) : (~c || (i > v ? _-- : i < v && _++), "function" != typeof o.type && (o.__u |= 4))) : k[f] = null;
	if (g) {
		for (a = [], s = [], f = 0; f < i; f++) if ((o = k[f]) && 16 & o.__u) {
			for (_ = 0, p = a.length; _ < p;) a[y = _ + p >> 1] < o.__i ? _ = y + 1 : p = y;
			a[_] = o.__i, s[f] = _ + 1;
		}
		for (_ = a.length; f--;) s[f] && (s[f] == _ ? _-- : k[f].__u |= 4);
	}
	if (d) for (f = 0; f < v; f++) !(e = r[f]) || 2 & e.__u || (e.__e == u && (u = S(e)), J$1(e, e));
	return u;
}
function A$1(n, t, r, u) {
	var i, f, o, e;
	if ("function" == typeof n.type) {
		if (n.props.__P) return t;
		if (i = n.__k) for (f = 0; f < i.length; f++) i[f] && (i[f].__ = n, t = A$1(i[f], t, r, false));
		return t;
	}
	for (t && !t.parentNode && (t = S(n)) && !t.parentNode && (t = null), o = n.__e, e = t; e && 8 == e.nodeType;) e = e.nextSibling;
	for (o != e && (!u && r.moveBefore && o.parentNode ? r.moveBefore(o, t) : r.insertBefore(o, t || null)), t = o; (t = t && t.nextSibling) && 8 == t.nodeType && !t.data.startsWith("$s"););
	return t;
}
function O(n, t) {
	return t = t || [], null != n && "boolean" != typeof n && (w$2(n) ? n.some(function(n) {
		O(n, t);
	}) : t.push(n)), t;
}
function P$2(n, t, r, u) {
	var i, f = n.key, o = n.type, e = t[r], l = e && !(2 & e.__u);
	if (null === e && null == f || l && f == e.key && o == e.type) return r;
	if (u > (l ? 1 : 0)) {
		for (i = r - 1; i >= 0; i--) if ((e = t[i]) && !(2 & e.__u) && f == e.key && o == e.type) return i;
		for (i = r + 1; i < t.length; i++) if ((e = t[i]) && !(2 & e.__u) && f == e.key && o == e.type) return i;
	}
	return -1;
}
function T$1(n, t, r) {
	r ??= "", "-" == t[0] ? n.setProperty(t, r) : n[t] = r;
}
function N(n, t, r, u, i) {
	var f, o;
	if ("style" == t) if ("string" == typeof r) n.style.cssText = r;
	else {
		if ("string" == typeof u && (n.style.cssText = u = ""), u) for (t in u) r && t in r || T$1(n.style, t);
		if (r) for (t in r) u && r[t] == u[t] || T$1(n.style, t, r[t]);
	}
	else if ("o" == t[0] && "n" == t[1]) "function" != typeof r && (r = null), "function" != typeof u && (u = null), (n.__e || (n.__e = {}))[t] = r, r && u || (o = a$2[t] || (a$2[t] = V(t)), (n.__a || (n.__a = {}))[t] = c$1, f = t != (t = t.replace(l$1, "$1")), (t = t.slice(2))[0] < "a" && (t = t.toLowerCase()), r ? n.addEventListener(t, o, f) : n.removeEventListener(t, o, f));
	else {
		if ("http://www.w3.org/2000/svg" == i) t = t.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
		else if ("width" != t && "height" != t && "href" != t && "list" != t && "form" != t && "tabIndex" != t && "download" != t && "rowSpan" != t && "colSpan" != t && "role" != t && "popover" != t && t in n) try {
			n[t] = null == r ? "" : r;
			return;
		} catch (n) {}
		if ("function" == typeof r) return;
		null == r || false === r && "-" != t[4] ? n.removeAttribute(t) : n.setAttribute(t, "popover" == t && 1 == r ? "" : r);
	}
}
function V(t) {
	return function(r) {
		var u = this.__e;
		if (u) {
			if (u = u[t], null == r[e$1]) r[e$1] = c$1++;
			else if (r[e$1] < this.__a[t]) return;
			return u(n.event ? n.event(r) : r);
		}
	};
}
function z$2(t, r, u, i, f, o, e, l, c, a) {
	var s, p, v, d, k, b, m, M, C, j, L, H, q, A, O, P, T, N, V = r.type;
	if (r.constructor !== h$1) return null;
	128 & u.__u && (c = 32 & u.__u, s = u.__c.__z) && (r.__u |= c, p = o = [], 8 == s.nodeType ? l = B$1(s, o) : o.push(s), l = o[0] || l), (s = n.__b) && s(r);
	n: if ("function" == typeof V) {
		v = e.length;
		try {
			if (M = r.props, C = (s = V.prototype) && s.render, j = (s = V.contextType) && i[s.__c], L = s ? j ? j.props.value : s.__ : i, (d = u.__c) ? (r.__c = d, 2 & d.__g && (d.__g |= 1)) : (C ? r.__c = d = new V(M, L) : (r.__c = d = new x$1(M, L), d.constructor = V, d.render = K$1), j && j.sub(d), d.state || (d.state = {}), d.__n = i, d.__g |= 8, d.__h = [], d.__k = []), C && (d.__s || (d.__s = d.state), V.getDerivedStateFromProps && (d.__s == d.state && (d.__s = _$1({}, d.__s)), _$1(d.__s, V.getDerivedStateFromProps(M, d.__s)))), k = d.props, b = d.state, d.__v = r, u.__c) {
				if (M !== k && C && !V.getDerivedStateFromProps && d.componentWillReceiveProps && d.componentWillReceiveProps(M, L), r.__v == u.__v && !(8 & d.__g) || !(4 & d.__g) && d.shouldComponentUpdate && !1 === d.shouldComponentUpdate(M, d.__s, L)) {
					r.__v != u.__v && (d.props = M, d.state = d.__s, d.__g &= -9), r.__e = u.__e, r.__k = u.__k, r.__k.some(function(n) {
						n && (n.__ = r);
					}), y$1.push.apply(d.__h, d.__k), d.__k = [], d.__h.length && e.push(d), l = S(u);
					break n;
				}
				d.componentWillUpdate && d.componentWillUpdate(M, d.__s, L), C && d.componentDidUpdate && d.__h.push(function() {
					d.componentDidUpdate(k, b, m);
				});
			} else C && !V.getDerivedStateFromProps && d.componentWillMount && d.componentWillMount(), C && d.componentDidMount && d.__h.push(d.componentDidMount);
			d.context = L, d.props = M, d.__P = t, d.__g &= -5, H = n.__r, q = C ? 25 : 0;
			do
				d.__g &= -9, H && H(r), s = d.render(d.props, d.state = d.__s, d.context);
			while (8 & d.__g && ++q < 25);
			C && (y$1.push.apply(d.__h, d.__k), d.__k = []), d.state = d.__s, d.getChildContext && (i = _$1({}, i, d.getChildContext())), C && u.__c && d.getSnapshotBeforeUpdate && (m = d.getSnapshotBeforeUpdate(k, b)), A = s && s.type === $$1 && null == s.key ? s.props.children : s, M.__P && (s = l, f = (t = M.__P).namespaceURI, c = o = null, u.props && u.props.__P != t && (u.__k.some(function(n) {
				n && J$1(n, n);
			}), u.__k = null), l = u.__k ? S(u, 0) : null), l = I(t, w$2(A) ? A : [A], r, u, i, f, o, e, l, c, a), M.__P && (r.__e = null, l = s), r.__u &= -161, p && p.some(g$1), d.__h.length && e.push(d), 1 & d.__g && (d.__g &= -4);
		} catch (t) {
			if (e.length = v, r.__v = null, c || o) if (t && t.then) {
				if (r.__u |= 128 | c, o) {
					for (~(T = o.indexOf(l || void 0)) || (T = o.length); (N = o[T - 1]) && 8 == N.nodeType;) T--;
					for (; T < o.length; T++) if (N = o[T]) if (o[T] = null, O) {
						if (N == P) break;
					} else {
						if (8 != N.nodeType) break;
						N.data.startsWith("$s") && (P = B$1(O = N));
					}
				}
				if (!O) {
					for (; l && 8 == l.nodeType && l.nextSibling;) l = l.nextSibling;
					O = l;
				}
				(s = B$1(O = r.__c.__z || (r.__c.__z = O))) ? (r.__e = O, l = s) : r.__e = l, l = l && l.nextSibling;
			} else o && o.some(g$1);
			else r.__e = u.__e;
			r.__k || (r.__k = u.__k || []), t && t.then || D$1(r), n.__e(t, r, u);
		}
	} else l = r.__e = F$1(u.__e, r, u, i, f, o, e, c, a, t);
	return (s = n.diffed) && s(r), l;
}
function B$1(n, t) {
	if (n && 8 == n.nodeType && n.data.startsWith("$s")) for (var r = 1; n = n.nextSibling;) {
		if (8 == n.nodeType) {
			if (n.data.startsWith("$s")) r++;
			else if (n.data.startsWith("/$s") && !--r) return n;
		}
		t && t.push(n);
	}
}
function D$1(n) {
	n && (n.__c && (n.__c.__g |= 4), n.__k && n.__k.some(D$1));
}
function E$1(t, r, u) {
	for (var i = 0; i < u.length;) G$1(u[i++], u[i++], u[i++]);
	n.__c && n.__c(r, t), t.some(function(r) {
		try {
			t = r.__h, r.__h = [], t.some(function(n) {
				n.call(r);
			});
		} catch (t) {
			n.__e(t, r.__v);
		}
	});
}
function F$1(t, r, u, i, f, o, e, l, c, a) {
	var s, h, y, _, k, b, m, M, $ = u.props || p$1, x = r.props, C = r.type;
	if ("svg" == C ? f = "http://www.w3.org/2000/svg" : "math" == C ? f = "http://www.w3.org/1998/Math/MathML" : f || (f = "http://www.w3.org/1999/xhtml"), o) {
		for (s = 0; s < o.length; s++) if ((k = o[s]) && (C ? k.localName == C : 3 == k.nodeType)) {
			t = k, o[s] = null;
			break;
		}
	}
	if (!t) {
		if (M = a.ownerDocument || document, !C) return M.createTextNode(x);
		t = M.createElementNS(f, C, x.is ? x : a), l && (n.__m && n.__m(r, o), l = false), o = null;
	}
	if (C) {
		if (a = "template" == C && t.content || t, o = "textarea" == C && null != x.defaultValue ? null : o && d$1.call(a.childNodes), !l && o) for ($ = {}, s = 0; s < t.attributes.length; s++) $[(k = t.attributes[s]).name] = k.value;
		for (s in $) k = $[s], "dangerouslySetInnerHTML" == s ? y = k : "children" == s || s in x || "value" == s && "defaultValue" in x || "checked" == s && "defaultChecked" in x || N(t, s, null, k, f);
		for (s in x) k = x[s], "children" == s ? _ = k : "dangerouslySetInnerHTML" == s ? h = k : "value" == s ? b = k : "checked" == s ? m = k : l && "function" != typeof k || $[s] === k || N(t, s, k, $[s], f);
		h ? (l || y && (h.__html == y.__html || h.__html == t.innerHTML) || (t.innerHTML = h.__html), r.__k = []) : (y && (t.textContent = ""), ("foreignObject" == C || "http://www.w3.org/1998/Math/MathML" == f && v$1.test(C)) && (f = "http://www.w3.org/1999/xhtml"), I(a, w$2(_) ? _ : [_], r, u, i, f, o, e, o ? o[0] : u.__k && S(u, 0), l, c), o && o.some(g$1)), l && "textarea" != C || (s = "value", "progress" == C && null == b ? t.removeAttribute(s) : null == b || b === t[s] && ("progress" != C || b) || N(t, s, b, $[s], f), s = "checked", null != m && m != t[s] && N(t, s, m, $[s], f));
	} else $ === x || l && t.data == x || (t.data = x);
	return t;
}
function G$1(t, r, u, i) {
	try {
		"function" == typeof t ? r ? r.__x = t(r) || 1 : i && (i = i.__c || i.__e) && (r = i.__x) && (i.__x = null, "function" == typeof r ? r() : t(null)) : t.current = r;
	} catch (t) {
		n.__e(t, u);
	}
}
function J$1(t, r, u) {
	var i, f, o, e;
	if (n.unmount && n.unmount(t), !(i = t.ref) || i.current && i.current != t.__e || G$1(i, null, r, t), i = t.__c) {
		if (i.componentWillUnmount) try {
			i.componentWillUnmount();
		} catch (t) {
			n.__e(t, r);
		}
		i.__P = i.__n = null;
	}
	if (i = t.__k) for (e = 0; e < i.length; e++) i[e] && J$1(i[e], r, "function" != typeof t.type || u && !t.props.__P);
	!u && (i = t.__c) && (i = i.__z) && (f = B$1(i, o = [])) && (i == t.__e && o.some(g$1), g$1(f), g$1(i)), u || g$1(t.__e), t.__e = t.__c = t.__ = null;
}
function K$1(n, t, r) {
	return this.constructor(n, r);
}
function Q$1(t, r) {
	var u, i, f, o;
	n.__ && n.__(t, r), 9 == r.nodeType && (r = r.documentElement), i = (u = t && 32 & t.__u) ? null : r.__k, r.__k = m$1($$1, { children: [t] }), f = [], o = [], z$2(r, r.__k, i || p$1, p$1, r.namespaceURI, i ? null : r.firstChild ? d$1.call(r.childNodes) : null, f, i ? i.__e : r.firstChild, u, o), E$1(f, r.__k, o), r.__k.props.children = null;
}
function W(n) {
	return n.children;
}
function X(n, t) {
	return m$1(W, {
		__P: t,
		children: n
	});
}
n = { __e: function(n, t, r, u) {
	for (var i, o, e; t = t.__;) if ((i = t.__c) && !(1 & i.__g)) {
		i.__g |= 4;
		try {
			if ((e = (o = i.constructor) && o.getDerivedStateFromError) && i.setState(o.getDerivedStateFromError(n)), i.componentDidCatch && (i.componentDidCatch(n, u || {}), e = 1), e && 8 & i.__g) return void (i.__g |= 2);
		} catch (t) {
			n = t;
		}
	}
	throw f$2 = 0, n;
} }, t$1 = 0, x$1.prototype.setState = function(n, t) {
	var r = this.__s;
	r && r != this.state || (r = this.__s = _$1({}, this.state)), "function" == typeof n && (n = n(_$1({}, r), this.props)), n && (_$1(r, n), this.__v && (t && this.__k.push(t), L(this)));
}, x$1.prototype.forceUpdate = function(n) {
	this.__v && (this.__g |= 4, n && this.__h.push(n), L(this));
}, x$1.prototype.render = $$1, u$2 = [], f$2 = 0, o$2 = function(n, t) {
	return n.__v.__b - t.__v.__b;
}, e$1 = Symbol(), l$1 = /(PointerCapture)$|Capture$/i, c$1 = 0, a$2 = {};
var t;
var r;
var u$1;
var i;
var o$1 = Object.is;
var f$1 = 0;
var c = [];
var e = [];
var a$1 = n;
var v$2 = a$1.__b;
var l = a$1.__r;
var m = a$1.diffed;
var h = a$1.__c;
var s = a$1.unmount;
var p = a$1.__;
function y(n, t) {
	a$1.__h && a$1.__h(r, n, f$1 || t), f$1 = 0;
	var u = r.__H || (r.__H = {
		__: [],
		__h: []
	});
	return n >= u.__.length && u.__.push({}), u.__[n];
}
function d(n) {
	return f$1 = 1, _(G, n);
}
function _(n, u, i) {
	var f = y(t++, 2);
	if (f.t = n, !f.__c && (f.__ = [G(void 0, u), function(n) {
		var t = (f.__N || f.__)[0], r = f.t(t, n);
		o$1(t, r) || (f.__N = [r, f.__[1]], f.__c.setState({}));
	}], f.__c = r, !r.__f)) {
		r.__f = true;
		var c = r.shouldComponentUpdate;
		r.shouldComponentUpdate = function(n, t, r) {
			var u = this.__H;
			if (!u) return true;
			var i = false, f = this.props != n;
			if (u.__.some(function(n) {
				n.__N && (i = true, o$1(n.__[0], n.__N[0]) || (f = true));
			}), c) {
				var e = c.call(this, n, t, r);
				return i ? e || f : e;
			}
			return !i || f;
		};
	}
	return f.__;
}
function A(n, u) {
	var i = y(t++, 3);
	!a$1.__s && E(i.__H, u) && (i.__P = true, i.__ = n, i.u = u, r.__H.__h.push(i));
}
function F(n, u) {
	var i = y(t++, 4);
	!a$1.__s && E(i.__H, u) && (i.__P = false, i.__ = n, i.u = u, r.__h.push(i));
}
function T(n) {
	return f$1 = 5, w$1(function() {
		return { current: n };
	}, []);
}
function w$1(n, r) {
	var u = y(t++, 7);
	return E(u.__H, r) && (u.__ = n(), u.__H = r), u.__;
}
function b(n, t) {
	return f$1 = 8, w$1(function() {
		return n;
	}, t);
}
function P$1() {
	var n = y(t++, 11);
	if (!n.__) {
		for (var u = r.__v; !u.__m && u.__;) u = u.__;
		var i = u.__m || (u.__m = [0, 0]);
		n.__ = "P" + i[0] + "-" + i[1]++;
	}
	return n.__;
}
function g() {
	var n;
	do {
		for (; n = e.shift();) try {
			C(n);
		} catch (t) {
			a$1.__e(t, { __: (n = n.__P) && n.__v });
		}
		for (; n = c.shift();) {
			var t = n.__H;
			if (n.__P && t) try {
				t.__h.some(C), t.__h.some(D), t.__h = [];
			} catch (r) {
				t.__h = [], a$1.__e(r, n.__v);
			}
		}
	} while (e.length);
}
a$1.__b = function(n) {
	r = null, v$2 && v$2(n);
}, a$1.__ = function(n, t) {
	n && t.__k && t.__k.__m && (n.__m = t.__k.__m), p && p(n, t);
}, a$1.__r = function(n) {
	l && l(n), t = 0;
	var i = (r = n.__c).__H;
	i && (u$1 == r ? r.__h = [] : (i.__h.some(C), i.__h.some(D), t = 0), i.__h = [], i.__.some(function(n) {
		n.__N && (n.__ = n.__N), n.u = n.__N = void 0;
	})), u$1 = r;
}, a$1.diffed = function(n) {
	m && m(n);
	var t = n.__c;
	t && t.__H && (t.__H.__h.length && B(c.push(t)), t.__H.__.some(function(n) {
		n.u && (n.__H = n.u);
	})), u$1 = r = null;
}, a$1.__c = function(n, t) {
	t.some(function(n) {
		try {
			n.__h.some(C), n.__h = n.__h.filter(function(n) {
				return !n.__ || D(n);
			});
		} catch (t) {
			n.__h = [function() {
				throw t;
			}];
		}
	}), h && h(n, t);
}, a$1.unmount = function(n) {
	s && s(n);
	var t, r, u = n.__c;
	u && u.__H && (u.__H.__.some(function(u) {
		try {
			if (u.__P && u.__c) {
				if (void 0 === r) {
					for (r = n.__; r && (!r.__c || !r.__c.__P);) r = r.__;
					r = r && r.__c;
				}
				u.__P = r, B(e.push(u));
			} else C(u);
		} catch (n) {
			t = n;
		}
	}), u.__H = void 0, t && a$1.__e(t, u.__v));
};
var k = "function" == typeof requestAnimationFrame;
function z$1(n) {
	var t, r = function() {
		clearTimeout(u), k && cancelAnimationFrame(t), setTimeout(n);
	}, u = setTimeout(r, 35);
	k && (t = requestAnimationFrame(r));
}
function B(n) {
	1 != n && i == a$1.requestAnimationFrame || ((i = a$1.requestAnimationFrame) || z$1)(g);
}
function C(n) {
	var t = r, u = n.__c;
	"function" == typeof u && (n.__c = void 0, u()), r = t;
}
function D(n) {
	var t = r;
	n.__c = n.__(), r = t;
}
function E(n, t) {
	return !n || n.length != t.length || t.some(function(t, r) {
		return !o$1(t, n[r]);
	});
}
function G(n, t) {
	return "function" == typeof t ? t(n) : t;
}
var KIT_FOCUS_CSS = exports("ax",`
.rdw-kit-focusable:focus-visible {
  outline: 2px solid var(--rdw-accent);
  outline-offset: 2px;
}
`);
var f = Symbol.for("pv");
var o = 0;
function a(t, e, n$6, u, a, i) {
	e || (e = {});
	var c, l, p = e;
	if ("ref" in p && "function" != typeof t) for (l in p = {}, e) "ref" == l ? c = e[l] : p[l] = e[l];
	var s = {
		type: t,
		props: p,
		key: n$6,
		ref: c,
		__k: null,
		__: null,
		__b: 0,
		__e: null,
		__c: null,
		constructor: f,
		__v: --o,
		__i: -1,
		__u: 0
	};
	return n.vnode && n.vnode(s), s;
}
var KEY_ARROW_DOWN = "ArrowDown";
var KEY_ARROW_UP = "ArrowUp";
var KEY_ENTER$3 = "Enter";
var KEY_ESCAPE$2 = "Escape";
var NO_ACTIVE_INDEX = -1;
var AUTOCOMPLETE_FIELD_CSS = `
${KIT_FOCUS_CSS}
.rdw-ac {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.rdw-ac__label {
  font: 600 10.5px var(--rdw-font);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--rdw-muted);
}
.rdw-ac__input {
  box-sizing: border-box;
  min-height: 28px;
  height: 28px;
  width: 100%;
  padding: 0 8px;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-surface);
  color: var(--rdw-text);
  font: inherit;
  font-size: 12px;
}
.rdw-ac__input::placeholder {
  color: var(--rdw-muted);
}
.rdw-ac__input:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.rdw-ac__list {
  position: absolute;
  z-index: 20;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  margin: 0;
  padding: 4px;
  list-style: none;
  background: var(--rdw-surface);
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  box-shadow: var(--rdw-shadow-2);
  max-height: 220px;
  overflow: auto;
}
.rdw-ac__option {
  min-height: 28px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  border-radius: var(--rdw-radius-s);
  font-size: 12px;
  color: var(--rdw-text);
  cursor: pointer;
}
.rdw-ac__option[aria-selected="true"],
.rdw-ac__option:hover {
  background: var(--rdw-surface-2);
}
`;
function AutocompleteField(props) {
	const autoId = P$1();
	const listId = P$1();
	const inputId = props.id ?? autoId;
	const rootRef = T(null);
	const [open, setOpen] = d(false);
	const [activeIndex, setActiveIndex] = d(NO_ACTIVE_INDEX);
	const suggestions = props.suggestions;
	const hasSuggestions = suggestions.length > 0;
	const listOpen = open && hasSuggestions && props.disabled !== true;
	A(() => {
		setActiveIndex(NO_ACTIVE_INDEX);
		if (hasSuggestions) setOpen(true);
		else setOpen(false);
	}, [suggestions, hasSuggestions]);
	A(() => {
		if (!listOpen) return;
		const onPointerDown = (event) => {
			const root = rootRef.current;
			if (root === null) return;
			if (!event.composedPath().includes(root)) {
				setOpen(false);
				setActiveIndex(NO_ACTIVE_INDEX);
			}
		};
		document.addEventListener("mousedown", onPointerDown);
		return () => {
			document.removeEventListener("mousedown", onPointerDown);
		};
	}, [listOpen]);
	const selectOption = (option) => {
		if (props.replaceOnSelect !== false) props.onChange(option.value);
		props.onSelect?.(option);
		setOpen(false);
		setActiveIndex(NO_ACTIVE_INDEX);
	};
	const className = ["rdw-ac", props.className].filter((part) => part !== void 0 && part.length > 0).join(" ");
	const activeOption = activeIndex >= 0 && activeIndex < suggestions.length ? suggestions[activeIndex] : void 0;
	return /* @__PURE__ */ a($$1, { children: [/* @__PURE__ */ a("style", { children: AUTOCOMPLETE_FIELD_CSS }), /* @__PURE__ */ a("div", {
		className,
		ref: rootRef,
		children: [
			props.label !== void 0 ? /* @__PURE__ */ a("label", {
				className: "rdw-ac__label",
				htmlFor: inputId,
				children: props.label
			}) : null,
			/* @__PURE__ */ a("input", {
				id: inputId,
				className: "rdw-ac__input rdw-kit-focusable",
				type: "text",
				role: "combobox",
				"aria-autocomplete": "list",
				"aria-expanded": listOpen,
				"aria-controls": listId,
				"aria-activedescendant": activeOption !== void 0 ? `${listId}-opt-${String(activeIndex)}` : void 0,
				value: props.value,
				placeholder: props.placeholder,
				disabled: props.disabled,
				"aria-label": props["aria-label"] ?? props.label,
				autoComplete: "off",
				onInput: (event) => {
					props.onChange(event.currentTarget.value);
				},
				onFocus: () => {
					if (hasSuggestions) setOpen(true);
				},
				onKeyDown: (event) => {
					if (event.key === KEY_ESCAPE$2) {
						if (listOpen) {
							event.preventDefault();
							setOpen(false);
							setActiveIndex(NO_ACTIVE_INDEX);
						}
						return;
					}
					if (event.key === KEY_ARROW_DOWN) {
						if (!hasSuggestions) return;
						event.preventDefault();
						setOpen(true);
						setActiveIndex((current) => {
							if (current < 0) return 0;
							return Math.min(current + 1, suggestions.length - 1);
						});
						return;
					}
					if (event.key === KEY_ARROW_UP) {
						if (!listOpen) return;
						event.preventDefault();
						setActiveIndex((current) => {
							if (current <= 0) return NO_ACTIVE_INDEX;
							return current - 1;
						});
						return;
					}
					if (event.key === KEY_ENTER$3) {
						if (listOpen && activeOption !== void 0) {
							event.preventDefault();
							selectOption(activeOption);
						}
					}
				}
			}),
			listOpen ? /* @__PURE__ */ a("ul", {
				className: "rdw-ac__list",
				role: "listbox",
				id: listId,
				tabIndex: -1,
				children: suggestions.map((option, index) => /* @__PURE__ */ a("li", {
					id: `${listId}-opt-${String(index)}`,
					role: "option",
					className: "rdw-ac__option rdw-kit-focusable",
					"aria-selected": index === activeIndex,
					onMouseDown: (event) => {
						event.preventDefault();
					},
					onClick: () => {
						selectOption(option);
					},
					children: option.label
				}, `${option.value}:${option.type ?? ""}:${option.label}`))
			}) : null
		]
	})] });
}
var BUTTON_CSS = `
${KIT_FOCUS_CSS}
.rdw-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-sizing: border-box;
  min-height: 28px;
  border-radius: var(--rdw-radius-m);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  padding: 0 12px;
  color: var(--rdw-text);
  background: var(--rdw-surface);
}
.rdw-btn--s {
  min-height: 28px;
  padding: 0 10px;
  font-size: 12px;
}
.rdw-btn--m {
  min-height: 28px;
  padding: 0 12px;
}
.rdw-btn--primary {
  background: var(--rdw-accent);
  border-color: var(--rdw-accent);
  color: var(--rdw-surface);
}
.rdw-btn--secondary {
  background: var(--rdw-surface);
  border-color: var(--rdw-border);
  color: var(--rdw-text);
}
.rdw-btn--ghost {
  background: transparent;
  border-color: transparent;
  color: var(--rdw-accent);
}
.rdw-btn--danger {
  background: var(--rdw-danger);
  border-color: var(--rdw-danger);
  color: var(--rdw-surface);
}
.rdw-btn:disabled,
.rdw-btn[aria-busy="true"] {
  opacity: 0.55;
  cursor: not-allowed;
}
.rdw-btn__spinner {
  width: 12px;
  height: 12px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: rdw-btn-spin 0.7s linear infinite;
}
@keyframes rdw-btn-spin {
  to { transform: rotate(360deg); }
}
`;
function Button(props) {
	const variant = props.variant ?? "secondary";
	const size = props.size ?? "m";
	const loading = props.loading === true;
	const disabled = props.disabled === true || loading;
	const className = [
		"rdw-btn",
		"rdw-kit-focusable",
		`rdw-btn--${variant}`,
		`rdw-btn--${size}`,
		props.className
	].filter((part) => part !== void 0 && part.length > 0).join(" ");
	return /* @__PURE__ */ a($$1, { children: [/* @__PURE__ */ a("style", { children: BUTTON_CSS }), /* @__PURE__ */ a("button", {
		type: props.type ?? "button",
		className,
		disabled,
		"aria-busy": loading ? true : void 0,
		"aria-label": props["aria-label"],
		onClick: props.onClick,
		children: [loading ? /* @__PURE__ */ a("span", {
			className: "rdw-btn__spinner",
			"aria-hidden": "true"
		}) : null, props.children]
	})] });
}
var CARD_CSS$1 = `
.rdw-card {
  background: var(--rdw-surface);
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-l);
  box-shadow: var(--rdw-shadow-1);
}
`;
function Card(props) {
	const Tag = props.as ?? "div";
	const className = ["rdw-card", props.className].filter((part) => part !== void 0 && part.length > 0).join(" ");
	return /* @__PURE__ */ a($$1, { children: [/* @__PURE__ */ a("style", { children: CARD_CSS$1 }), /* @__PURE__ */ a(Tag, {
		className,
		children: props.children
	})] });
}
var DEFAULT_SIZE = 16;
function baseProps(size, className, title) {
	const props = {
		width: size,
		height: size,
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		"stroke-width": 2,
		"stroke-linecap": "round",
		"stroke-linejoin": "round",
		"aria-hidden": title === void 0 ? true : void 0,
		role: title === void 0 ? void 0 : "img"
	};
	if (className !== void 0) props.className = className;
	if (title !== void 0) props["aria-label"] = title;
	return props;
}
function IconStar(props) {
	return /* @__PURE__ */ a("svg", {
		...baseProps(props.size ?? DEFAULT_SIZE, props.className, props.title),
		children: [props.title !== void 0 ? /* @__PURE__ */ a("title", { children: props.title }) : null, /* @__PURE__ */ a("polygon", { points: "12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" })]
	});
}
function IconStarFilled(props) {
	return /* @__PURE__ */ a("svg", {
		...baseProps(props.size ?? DEFAULT_SIZE, props.className, props.title),
		fill: "currentColor",
		stroke: "none",
		children: [props.title !== void 0 ? /* @__PURE__ */ a("title", { children: props.title }) : null, /* @__PURE__ */ a("polygon", { points: "12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" })]
	});
}
function IconPlus(props) {
	return /* @__PURE__ */ a("svg", {
		...baseProps(props.size ?? DEFAULT_SIZE, props.className, props.title),
		children: [
			props.title !== void 0 ? /* @__PURE__ */ a("title", { children: props.title }) : null,
			/* @__PURE__ */ a("line", {
				x1: "12",
				y1: "5",
				x2: "12",
				y2: "19"
			}),
			/* @__PURE__ */ a("line", {
				x1: "5",
				y1: "12",
				x2: "19",
				y2: "12"
			})
		]
	});
}
function IconCheck(props) {
	return /* @__PURE__ */ a("svg", {
		...baseProps(props.size ?? DEFAULT_SIZE, props.className, props.title),
		children: [props.title !== void 0 ? /* @__PURE__ */ a("title", { children: props.title }) : null, /* @__PURE__ */ a("polyline", { points: "20 6 9 17 4 12" })]
	});
}
function IconX(props) {
	return /* @__PURE__ */ a("svg", {
		...baseProps(props.size ?? DEFAULT_SIZE, props.className, props.title),
		children: [
			props.title !== void 0 ? /* @__PURE__ */ a("title", { children: props.title }) : null,
			/* @__PURE__ */ a("line", {
				x1: "18",
				y1: "6",
				x2: "6",
				y2: "18"
			}),
			/* @__PURE__ */ a("line", {
				x1: "6",
				y1: "6",
				x2: "18",
				y2: "18"
			})
		]
	});
}
function IconChevronDown(props) {
	return /* @__PURE__ */ a("svg", {
		...baseProps(props.size ?? DEFAULT_SIZE, props.className, props.title),
		children: [props.title !== void 0 ? /* @__PURE__ */ a("title", { children: props.title }) : null, /* @__PURE__ */ a("polyline", { points: "6 9 12 15 18 9" })]
	});
}
function IconArrowUp(props) {
	return /* @__PURE__ */ a("svg", {
		...baseProps(props.size ?? DEFAULT_SIZE, props.className, props.title),
		children: [
			props.title !== void 0 ? /* @__PURE__ */ a("title", { children: props.title }) : null,
			/* @__PURE__ */ a("line", {
				x1: "12",
				y1: "19",
				x2: "12",
				y2: "5"
			}),
			/* @__PURE__ */ a("polyline", { points: "5 12 12 5 19 12" })
		]
	});
}
function IconExternalLink(props) {
	return /* @__PURE__ */ a("svg", {
		...baseProps(props.size ?? DEFAULT_SIZE, props.className, props.title),
		children: [
			props.title !== void 0 ? /* @__PURE__ */ a("title", { children: props.title }) : null,
			/* @__PURE__ */ a("path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" }),
			/* @__PURE__ */ a("polyline", { points: "15 3 21 3 21 9" }),
			/* @__PURE__ */ a("line", {
				x1: "10",
				y1: "14",
				x2: "21",
				y2: "3"
			})
		]
	});
}
function IconDroplet(props) {
	return /* @__PURE__ */ a("svg", {
		...baseProps(props.size ?? DEFAULT_SIZE, props.className, props.title),
		children: [props.title !== void 0 ? /* @__PURE__ */ a("title", { children: props.title }) : null, /* @__PURE__ */ a("path", { d: "M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" })]
	});
}
function IconPencil(props) {
	return /* @__PURE__ */ a("svg", {
		...baseProps(props.size ?? DEFAULT_SIZE, props.className, props.title),
		children: [
			props.title !== void 0 ? /* @__PURE__ */ a("title", { children: props.title }) : null,
			/* @__PURE__ */ a("path", { d: "M12 20h9" }),
			/* @__PURE__ */ a("path", { d: "M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" })
		]
	});
}
function IconFlag(props) {
	return /* @__PURE__ */ a("svg", {
		...baseProps(props.size ?? DEFAULT_SIZE, props.className, props.title),
		children: [
			props.title !== void 0 ? /* @__PURE__ */ a("title", { children: props.title }) : null,
			/* @__PURE__ */ a("path", { d: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" }),
			/* @__PURE__ */ a("line", {
				x1: "4",
				y1: "22",
				x2: "4",
				y2: "15"
			})
		]
	});
}
function IconNote(props) {
	return /* @__PURE__ */ a("svg", {
		...baseProps(props.size ?? DEFAULT_SIZE, props.className, props.title),
		children: [
			props.title !== void 0 ? /* @__PURE__ */ a("title", { children: props.title }) : null,
			/* @__PURE__ */ a("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }),
			/* @__PURE__ */ a("polyline", { points: "14 2 14 8 20 8" }),
			/* @__PURE__ */ a("line", {
				x1: "8",
				y1: "13",
				x2: "16",
				y2: "13"
			}),
			/* @__PURE__ */ a("line", {
				x1: "8",
				y1: "17",
				x2: "12",
				y2: "17"
			})
		]
	});
}
function IconImage(props) {
	return /* @__PURE__ */ a("svg", {
		...baseProps(props.size ?? DEFAULT_SIZE, props.className, props.title),
		children: [
			props.title !== void 0 ? /* @__PURE__ */ a("title", { children: props.title }) : null,
			/* @__PURE__ */ a("rect", {
				x: "3",
				y: "3",
				width: "18",
				height: "18",
				rx: "2",
				ry: "2"
			}),
			/* @__PURE__ */ a("circle", {
				cx: "8.5",
				cy: "8.5",
				r: "1.5"
			}),
			/* @__PURE__ */ a("polyline", { points: "21 15 16 10 5 21" })
		]
	});
}
var CHIP_CSS = `
${KIT_FOCUS_CSS}
.rdw-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 24px;
  height: 24px;
  padding: 0 4px 0 8px;
  border-radius: 12px;
  background: var(--rdw-surface-2);
  border: 1px solid var(--rdw-border);
  font-size: 12px;
  color: var(--rdw-text);
  max-width: 100%;
  white-space: nowrap;
}
.rdw-chip__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--rdw-muted);
  flex: none;
}
.rdw-chip--artist .rdw-chip__dot { background: var(--rdw-tag-artist); }
.rdw-chip--character .rdw-chip__dot { background: var(--rdw-tag-character); }
.rdw-chip--copyright .rdw-chip__dot { background: var(--rdw-tag-copyright); }
.rdw-chip--metadata .rdw-chip__dot { background: var(--rdw-tag-metadata); }
.rdw-chip--exclude {
  background: var(--rdw-danger-soft);
  border-color: var(--rdw-danger);
  color: var(--rdw-danger);
  text-decoration: line-through;
}
.rdw-chip--group {
  background: var(--rdw-accent-soft);
  border-color: var(--rdw-accent);
  color: var(--rdw-accent);
  font-weight: 600;
}
.rdw-chip__remove {
  box-sizing: border-box;
  width: 28px;
  height: 28px;
  min-width: 28px;
  min-height: 28px;
  margin: -2px -2px -2px 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--rdw-muted);
  display: grid;
  place-items: center;
  cursor: pointer;
  padding: 0;
}
.rdw-chip__remove:hover {
  background: var(--rdw-surface);
}
`;
function Chip(props) {
	const variant = props.variant ?? "dot";
	const kind = props.kind ?? "default";
	const className = [
		"rdw-chip",
		`rdw-chip--${variant}`,
		kind !== "default" ? `rdw-chip--${kind}` : void 0,
		props.className
	].filter((part) => part !== void 0 && part.length > 0).join(" ");
	return /* @__PURE__ */ a($$1, { children: [/* @__PURE__ */ a("style", { children: CHIP_CSS }), /* @__PURE__ */ a("span", {
		className,
		children: [
			variant === "dot" ? /* @__PURE__ */ a("i", {
				className: "rdw-chip__dot",
				"aria-hidden": "true"
			}) : null,
			/* @__PURE__ */ a("span", { children: props.label }),
			props.onRemove !== void 0 ? /* @__PURE__ */ a("button", {
				type: "button",
				className: "rdw-chip__remove rdw-kit-focusable",
				"aria-label": `Remove ${props.label}`,
				onClick: props.onRemove,
				children: /* @__PURE__ */ a(IconX, { size: 12 })
			}) : null
		]
	})] });
}
var TEXT_FIELD_CSS = `
${KIT_FOCUS_CSS}
.rdw-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.rdw-field__label {
  font: 600 10.5px var(--rdw-font);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--rdw-muted);
}
.rdw-field__input {
  box-sizing: border-box;
  min-height: 28px;
  height: 28px;
  width: 100%;
  padding: 0 8px;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-surface);
  color: var(--rdw-text);
  font: inherit;
  font-size: 12px;
}
.rdw-field__input::placeholder {
  color: var(--rdw-muted);
}
.rdw-field__input:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
`;
function TextField(props) {
	const autoId = P$1();
	const inputId = props.id ?? autoId;
	const className = ["rdw-field", props.className].filter((part) => part !== void 0 && part.length > 0).join(" ");
	return /* @__PURE__ */ a($$1, { children: [/* @__PURE__ */ a("style", { children: TEXT_FIELD_CSS }), /* @__PURE__ */ a("div", {
		className,
		children: [props.label !== void 0 ? /* @__PURE__ */ a("label", {
			className: "rdw-field__label",
			htmlFor: inputId,
			children: props.label
		}) : null, /* @__PURE__ */ a("input", {
			id: inputId,
			className: "rdw-field__input rdw-kit-focusable",
			type: "text",
			value: props.value,
			placeholder: props.placeholder,
			disabled: props.disabled,
			"aria-label": props["aria-label"] ?? props.label,
			onInput: (event) => {
				props.onChange(event.currentTarget.value);
			}
		})]
	})] });
}
var DIALOG_VARIANT_CONFIRM$1 = "confirm";
var DIALOG_VARIANT_FIELDS$1 = "fields";
var DIALOG_FIELD_NAME = "name";
var DIALOG_FIELD_QUERY = "query";
var DEFAULT_NAME_LABEL = "Name";
var DEFAULT_QUERY_LABEL = "Query";
var DEFAULT_CONFIRM_TONE = "primary";
var KEY_ESCAPE$1 = "Escape";
var ROLE_COMBOBOX = "combobox";
var ARIA_TRUE = "true";
var KEY_TAB = "Tab";
var EVENT_KEYDOWN$1 = "keydown";
var EVENT_MOUSEDOWN$1 = "mousedown";
var DIALOG_Z_INDEX = 40;
var DIALOG_MAX_WIDTH_PX = 360;
var DIALOG_BACKDROP_PADDING_PX = 16;
var DIALOG_BACKDROP_ALPHA = .45;
var DIALOG_PANEL_PADDING_PX = 16;
var DIALOG_PANEL_GAP_PX = 12;
var DIALOG_FIELDS_GAP_PX = 8;
var DIALOG_ACTIONS_GAP_PX = 8;
var FOCUSABLE_SELECTOR = [
	"a[href]",
	"button:not([disabled])",
	"textarea:not([disabled])",
	"input:not([disabled])",
	"select:not([disabled])",
	"[tabindex]:not([tabindex=\"-1\"])"
].join(", ");
var DIALOG_CSS = `
${KIT_FOCUS_CSS}
.rdw-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: ${String(DIALOG_Z_INDEX)};
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: ${String(DIALOG_BACKDROP_PADDING_PX)}px;
  background: rgba(0, 0, 0, ${String(DIALOG_BACKDROP_ALPHA)});
}
.rdw-dialog {
  box-sizing: border-box;
  width: 100%;
  max-width: ${String(DIALOG_MAX_WIDTH_PX)}px;
  display: grid;
  gap: ${String(DIALOG_PANEL_GAP_PX)}px;
  padding: ${String(DIALOG_PANEL_PADDING_PX)}px;
  background: var(--rdw-surface);
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-l);
  box-shadow: var(--rdw-shadow-2);
  color: var(--rdw-text);
  font: 12.5px/1.4 var(--rdw-font);
}
.rdw-dialog__title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--rdw-text);
}
.rdw-dialog__message {
  margin: 0;
}
.rdw-dialog__fields {
  display: grid;
  gap: ${String(DIALOG_FIELDS_GAP_PX)}px;
  margin: 0;
}
.rdw-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: ${String(DIALOG_ACTIONS_GAP_PX)}px;
}
`;
function listFocusable(root) {
	const nodes = root.querySelectorAll(FOCUSABLE_SELECTOR);
	const result = [];
	for (const node of nodes) {
		if (!(node instanceof HTMLElement)) continue;
		if (node.closest("[hidden]") !== null) continue;
		result.push(node);
	}
	return result;
}
function pathIncludesNode$1(path, node) {
	if (node === null) return false;
	for (const entry of path) if (entry === node) return true;
	return false;
}
function renderDialogBody(props) {
	if (props.variant === DIALOG_VARIANT_CONFIRM$1) {
		const tone = props.confirmTone ?? DEFAULT_CONFIRM_TONE;
		return /* @__PURE__ */ a($$1, { children: [/* @__PURE__ */ a("p", {
			className: "rdw-dialog__message",
			children: props.message
		}), /* @__PURE__ */ a("div", {
			className: "rdw-dialog__actions",
			children: [/* @__PURE__ */ a(Button, {
				variant: "secondary",
				size: "s",
				onClick: props.onClose,
				children: props.cancelLabel
			}), /* @__PURE__ */ a(Button, {
				variant: tone,
				size: "s",
				onClick: props.onConfirm,
				children: props.confirmLabel
			})]
		})] });
	}
	if (props.variant === DIALOG_VARIANT_FIELDS$1) {
		const nameLabel = props.nameLabel ?? DEFAULT_NAME_LABEL;
		const queryLabel = props.queryLabel ?? DEFAULT_QUERY_LABEL;
		const onQueryChange = (query) => {
			props.onFieldsChange({
				name: props.fields.name,
				query
			});
		};
		return /* @__PURE__ */ a("form", {
			className: "rdw-dialog__fields",
			onSubmit: (event) => {
				event.preventDefault();
				props.onSubmit();
			},
			children: [
				props.only !== DIALOG_FIELD_QUERY ? /* @__PURE__ */ a(TextField, {
					label: nameLabel,
					value: props.fields.name,
					onChange: (name) => {
						props.onFieldsChange({
							name,
							query: props.fields.query
						});
					}
				}) : null,
				props.only === DIALOG_FIELD_NAME ? null : props.renderQueryField !== void 0 ? props.renderQueryField({
					label: queryLabel,
					value: props.fields.query,
					onChange: onQueryChange
				}) : /* @__PURE__ */ a(TextField, {
					label: queryLabel,
					value: props.fields.query,
					onChange: onQueryChange
				}),
				/* @__PURE__ */ a("div", {
					className: "rdw-dialog__actions",
					children: [/* @__PURE__ */ a(Button, {
						variant: "secondary",
						size: "s",
						type: "button",
						onClick: props.onClose,
						children: props.cancelLabel
					}), /* @__PURE__ */ a(Button, {
						variant: "primary",
						size: "s",
						type: "submit",
						children: props.submitLabel
					})]
				})
			]
		});
	}
	return /* @__PURE__ */ a($$1, { children: props.children });
}
function isOpenCombobox(event) {
	const origin = event.composedPath()[0];
	return origin instanceof Element && origin.getAttribute("role") === ROLE_COMBOBOX && origin.getAttribute("aria-expanded") === ARIA_TRUE;
}
function Dialog(props) {
	const panelRef = T(null);
	const wasOpenRef = T(false);
	const restoreFocusRef = T(null);
	const titleId = P$1();
	const hasTitle = props.title !== void 0 && props.title.length > 0;
	A(() => {
		if (!props.open) {
			if (wasOpenRef.current) {
				wasOpenRef.current = false;
				const restore = restoreFocusRef.current;
				restoreFocusRef.current = null;
				if (restore !== null && typeof restore.focus === "function") restore.focus();
			}
			return;
		}
		if (!wasOpenRef.current) {
			const active = document.activeElement;
			restoreFocusRef.current = active instanceof HTMLElement ? active : null;
			wasOpenRef.current = true;
		}
		const panel = panelRef.current;
		if (panel !== null) {
			const initial = props.initialFocusRef?.current ?? null;
			if (initial !== null && typeof initial.focus === "function") initial.focus();
			else {
				const first = listFocusable(panel)[0];
				if (first !== void 0) first.focus();
				else panel.focus();
			}
		}
		const onKeyDown = (event) => {
			if (event.key === KEY_ESCAPE$1) {
				if (isOpenCombobox(event)) return;
				event.preventDefault();
				event.stopPropagation();
				props.onClose();
				return;
			}
			if (event.key !== KEY_TAB) return;
			const currentPanel = panelRef.current;
			if (currentPanel === null) return;
			const focusable = listFocusable(currentPanel);
			if (focusable.length === 0) {
				event.preventDefault();
				currentPanel.focus();
				return;
			}
			const first = focusable[0];
			const last = focusable[focusable.length - 1];
			if (first === void 0 || last === void 0) return;
			const active = document.activeElement;
			if (event.shiftKey) {
				if (active === first || !currentPanel.contains(active)) {
					event.preventDefault();
					last.focus();
				}
				return;
			}
			if (active === last) {
				event.preventDefault();
				first.focus();
			}
		};
		const onPointerDown = (event) => {
			const currentPanel = panelRef.current;
			if (currentPanel === null) return;
			if (pathIncludesNode$1(event.composedPath(), currentPanel)) return;
			props.onClose();
		};
		document.addEventListener(EVENT_KEYDOWN$1, onKeyDown, true);
		document.addEventListener(EVENT_MOUSEDOWN$1, onPointerDown, true);
		return () => {
			document.removeEventListener(EVENT_KEYDOWN$1, onKeyDown, true);
			document.removeEventListener(EVENT_MOUSEDOWN$1, onPointerDown, true);
		};
	}, [
		props.open,
		props.onClose,
		props.initialFocusRef
	]);
	if (!props.open) return null;
	const className = ["rdw-dialog", props.className].filter((part) => part !== void 0 && part.length > 0).join(" ");
	return /* @__PURE__ */ a($$1, { children: [/* @__PURE__ */ a("style", { children: DIALOG_CSS }), /* @__PURE__ */ a("div", {
		className: "rdw-dialog-backdrop",
		children: /* @__PURE__ */ a("div", {
			ref: panelRef,
			className,
			role: "dialog",
			"aria-modal": "true",
			"aria-label": hasTitle ? void 0 : props["aria-label"],
			"aria-labelledby": hasTitle ? titleId : void 0,
			tabIndex: -1,
			children: [hasTitle ? /* @__PURE__ */ a("h2", {
				id: titleId,
				className: "rdw-dialog__title",
				children: props.title
			}) : null, renderDialogBody(props)]
		})
	})] });
}
var EMPTY_STATE_CSS = `
.rdw-empty {
  display: grid;
  gap: 6px;
  justify-items: start;
  padding: 16px 8px;
  color: var(--rdw-muted);
  font: 12.5px/1.4 var(--rdw-font);
}
.rdw-empty__title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--rdw-text);
}
.rdw-empty__desc {
  margin: 0;
}
`;
function EmptyState(props) {
	const className = ["rdw-empty", props.className].filter((part) => part !== void 0 && part.length > 0).join(" ");
	return /* @__PURE__ */ a($$1, { children: [/* @__PURE__ */ a("style", { children: EMPTY_STATE_CSS }), /* @__PURE__ */ a("div", {
		className,
		role: "status",
		children: [
			/* @__PURE__ */ a("p", {
				className: "rdw-empty__title",
				children: props.title
			}),
			props.description !== void 0 ? /* @__PURE__ */ a("p", {
				className: "rdw-empty__desc",
				children: props.description
			}) : null,
			props.action
		]
	})] });
}
var ICON_BUTTON_CSS = `
${KIT_FOCUS_CSS}
.rdw-icon-btn {
  box-sizing: border-box;
  display: inline-grid;
  place-items: center;
  min-width: 28px;
  min-height: 28px;
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: var(--rdw-radius-m);
  border: 1px solid var(--rdw-border);
  background: var(--rdw-surface);
  color: var(--rdw-text);
  cursor: pointer;
}
.rdw-icon-btn[aria-pressed="true"] {
  background: var(--rdw-accent-soft);
  border-color: var(--rdw-accent);
  color: var(--rdw-accent);
}
.rdw-icon-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
`;
function IconButton(props) {
	const className = [
		"rdw-icon-btn",
		"rdw-kit-focusable",
		props.className
	].filter((part) => part !== void 0 && part.length > 0).join(" ");
	return /* @__PURE__ */ a($$1, { children: [/* @__PURE__ */ a("style", { children: ICON_BUTTON_CSS }), /* @__PURE__ */ a("button", {
		type: "button",
		className,
		"aria-label": props.label,
		"aria-pressed": props.pressed,
		disabled: props.disabled,
		onClick: props.onClick,
		children: props.children
	})] });
}
var NUMBER_FIELD_CSS = `
${KIT_FOCUS_CSS}
.rdw-num {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.rdw-num__label {
  font: 600 10.5px var(--rdw-font);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--rdw-muted);
}
.rdw-num__input {
  box-sizing: border-box;
  min-height: 28px;
  height: 28px;
  width: 100%;
  padding: 0 8px;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-surface);
  color: var(--rdw-text);
  font: inherit;
  font-size: 12px;
}
.rdw-num__input:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
`;
function NumberField(props) {
	const autoId = P$1();
	const inputId = props.id ?? autoId;
	const className = ["rdw-num", props.className].filter((part) => part !== void 0 && part.length > 0).join(" ");
	return /* @__PURE__ */ a($$1, { children: [/* @__PURE__ */ a("style", { children: NUMBER_FIELD_CSS }), /* @__PURE__ */ a("div", {
		className,
		children: [props.label !== void 0 ? /* @__PURE__ */ a("label", {
			className: "rdw-num__label",
			htmlFor: inputId,
			children: props.label
		}) : null, /* @__PURE__ */ a("input", {
			id: inputId,
			className: "rdw-num__input rdw-kit-focusable",
			type: "number",
			value: props.value ?? "",
			min: props.min,
			max: props.max,
			step: props.step,
			placeholder: props.placeholder,
			disabled: props.disabled,
			"aria-label": props.label,
			onInput: (event) => {
				const raw = event.currentTarget.value;
				if (raw.trim() === "") {
					props.onChange(null);
					return;
				}
				const next = Number(raw);
				props.onChange(Number.isFinite(next) ? next : null);
			}
		})]
	})] });
}
var w = Object.assign;
var x = /^(-|f[lo].*[^se]$|g.{5,}[^ps]$|z|o[pr]|(W.{5})?[lL]i.*(t|mp)$|an|(bo|s).{4}Im|sca|m.{6}[ds]|ta|c.*[st]$|wido|ini|asp|fill|st)/;
function U(n, t) {
	var e = X(n, t);
	return e.containerInfo = t, e;
}
var P = Symbol.for("react.element");
var $ = /^(?:accent|alignment|arabic|baseline|cap|clip(?!PathU)|color|dominant|fill|flood|font|glyph(?!R)|horiz|image(?!S)|letter|lighting|marker(?!H|W|U)|overline|paint|pointer|shape|stop|strikethrough|stroke|text(?!L)|transform|underline|unicode|units|v|vector|vert|word|writing|x(?!C))[A-Z]/;
var z = /[A-Z0-9]/g;
var H = typeof document < "u";
var Y = function(n) {
	return /fil|che|rad/.test(n);
};
x$1.prototype.isReactComponent = true, [
	"componentWillMount",
	"componentWillReceiveProps",
	"componentWillUpdate"
].forEach(function(n) {
	Object.defineProperty(x$1.prototype, n, {
		configurable: true,
		get: function() {
			return this["UNSAFE_" + n];
		},
		set: function(t) {
			Object.defineProperty(this, n, {
				configurable: true,
				writable: true,
				value: t
			});
		}
	});
});
var J = n.event;
n.event = function(n) {
	return J && (n = J(n)), n.persist = function() {}, n.isPropagationStopped = function() {
		return this.cancelBubble;
	}, n.isDefaultPrevented = function() {
		return this.defaultPrevented;
	}, n.nativeEvent = n;
};
var K = {
	configurable: true,
	get: function() {
		return this.class;
	}
};
var Q = n.vnode;
n.vnode = function(t) {
	if ("string" == typeof t.type) (function(t) {
		var e = t.props, r = t.type, u = {}, i = -1 == r.indexOf("-");
		for (var o in e) {
			var f = e[o];
			if (!("value" == o && "defaultValue" in e && null == f || H && "children" == o && "noscript" == r || "class" == o || "className" == o)) {
				if ("style" == o && f && f.constructor == Object) {
					var l = void 0;
					for (var a in f) "number" != typeof f[a] || x.test(a) || (l || (l = f = w({}, f)), f[a] += "px");
				} else if ("defaultValue" == o && "value" in e && null == e.value) o = "value";
				else if ("download" == o && true === f) f = "";
				else if ("translate" == o && "no" === f) f = false;
				else if ("o" == o[0] && "n" == o[1]) {
					var c = o.toLowerCase();
					"ondoubleclick" == c ? o = "ondblclick" : "onchange" != c || "input" != r && "textarea" != r || Y(e.type) ? "onfocus" == c ? o = "onfocusin" : "onblur" == c && (o = "onfocusout") : c = o = "oninput", "oninput" == c && u[o = c] && (o = "oninputCapture");
				} else i && $.test(o) ? o = o.replace(z, "-$&").toLowerCase() : null === f && (f = void 0);
				u[o] = f;
			}
		}
		if ("select" == r) {
			var s = null != u.defaultValue ? u.defaultValue : u.multiple && Array.isArray(u.value) ? u.value : null;
			null != s && (u.value = O(e.children).forEach(function(n) {
				n.props.selected = u.multiple ? -1 != s.indexOf(n.props.value) : s == n.props.value;
			}));
		}
		e.class && !e.className ? (u.class = e.class, Object.defineProperty(u, "className", K)) : e.className && (u.class = u.className = e.className), t.props = u;
	})(t);
	else if ("function" == typeof t.type && ("ref" in t.props && "prototype" in t.type && t.type.prototype.render && (t.ref = t.props.ref, delete t.props.ref), t.type.defaultProps)) {
		var e = w({}, t.props);
		for (var r in t.type.defaultProps) void 0 === e[r] && (e[r] = t.type.defaultProps[r]);
		t.props = e;
	}
	t.ref && !("ref" in t.props) && Object.defineProperty(t.props, "ref", {
		value: t.ref,
		configurable: true,
		writable: true
	}), t.$$typeof = P, Q && Q(t);
};
var KEY_ESCAPE$3 = "Escape";
var EVENT_KEYDOWN$2 = "keydown";
var EVENT_MOUSEDOWN = "mousedown";
var EVENT_SCROLL = "scroll";
var EVENT_RESIZE = "resize";
var POPOVER_FIXED_CLASS = "rdw-popover--fixed";
/** Above the post panel host (z-index 100 in post-actions.ts). */
var POPOVER_FIXED_Z_INDEX = 120;
var POPOVER_ANCHOR_GAP_PX = 4;
var POPOVER_CSS = `
${KIT_FOCUS_CSS}
.rdw-popover {
  position: absolute;
  z-index: 30;
  min-width: 180px;
  padding: 8px;
  display: grid;
  gap: 4px;
  background: var(--rdw-surface);
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-l);
  box-shadow: var(--rdw-shadow-2);
  color: var(--rdw-text);
  font: 12px/1.35 var(--rdw-font);
}
.rdw-popover.${POPOVER_FIXED_CLASS} {
  position: fixed;
  z-index: ${String(POPOVER_FIXED_Z_INDEX)};
  min-width: 0;
  margin: 0;
  box-sizing: border-box;
}
`;
function computeAnchoredPopoverPosition(anchorLeft, anchorBottom, widthPx, viewportWidthPx) {
	let left = anchorLeft;
	if (left + widthPx > viewportWidthPx) left = viewportWidthPx - widthPx;
	return {
		top: anchorBottom + POPOVER_ANCHOR_GAP_PX,
		left
	};
}
function pathIncludesNode(path, node) {
	if (node === null) return false;
	for (const entry of path) if (entry === node) return true;
	return false;
}
function Popover(props) {
	const rootRef = T(null);
	const wasOpenRef = T(false);
	A(() => {
		if (!props.open) {
			if (wasOpenRef.current) {
				wasOpenRef.current = false;
				const anchor = props.anchorRef?.current ?? null;
				if (anchor !== null && typeof anchor.focus === "function") anchor.focus();
			}
			return;
		}
		wasOpenRef.current = true;
		const onKeyDown = (event) => {
			if (event.key === KEY_ESCAPE$3) {
				event.preventDefault();
				props.onClose();
			}
		};
		const onPointerDown = (event) => {
			const root = rootRef.current;
			if (root === null) return;
			const path = event.composedPath();
			if (pathIncludesNode(path, root)) return;
			if (pathIncludesNode(path, props.anchorRef?.current ?? null)) return;
			props.onClose();
		};
		document.addEventListener(EVENT_KEYDOWN$2, onKeyDown);
		document.addEventListener(EVENT_MOUSEDOWN, onPointerDown);
		return () => {
			document.removeEventListener(EVENT_KEYDOWN$2, onKeyDown);
			document.removeEventListener(EVENT_MOUSEDOWN, onPointerDown);
		};
	}, [
		props.open,
		props.onClose,
		props.anchorRef
	]);
	const widthPx = props.widthPx;
	const anchored = widthPx !== void 0;
	F(() => {
		if (!props.open || widthPx === void 0) return;
		const apply = () => {
			const anchor = props.anchorRef?.current ?? null;
			const root = rootRef.current;
			if (anchor === null || root === null) return;
			const rect = anchor.getBoundingClientRect();
			const position = computeAnchoredPopoverPosition(rect.left, rect.bottom, widthPx, window.innerWidth);
			root.style.position = "fixed";
			root.style.top = `${String(position.top)}px`;
			root.style.left = `${String(position.left)}px`;
			root.style.width = `${String(widthPx)}px`;
		};
		apply();
		const onScrollOrResize = () => {
			apply();
		};
		window.addEventListener(EVENT_SCROLL, onScrollOrResize, true);
		window.addEventListener(EVENT_RESIZE, onScrollOrResize);
		return () => {
			window.removeEventListener(EVENT_SCROLL, onScrollOrResize, true);
			window.removeEventListener(EVENT_RESIZE, onScrollOrResize);
		};
	}, [
		props.open,
		props.anchorRef,
		widthPx
	]);
	if (!props.open) return null;
	const className = [
		"rdw-popover",
		anchored ? POPOVER_FIXED_CLASS : void 0,
		props.className
	].filter((part) => part !== void 0 && part.length > 0).join(" ");
	const body = /* @__PURE__ */ a($$1, { children: [/* @__PURE__ */ a("style", { children: POPOVER_CSS }), /* @__PURE__ */ a("div", {
		ref: rootRef,
		className,
		role: "dialog",
		"aria-label": props["aria-label"],
		children: props.children
	})] });
	if (anchored && document.body !== null) return U(body, document.body);
	return body;
}
var PROGRESS_WIDTH_VAR = "--rdw-progress-width";
var PROGRESS_BAR_CSS = `
.rdw-progress {
  display: grid;
  gap: 4px;
  width: 100%;
}
.rdw-progress__label {
  font: 600 10.5px var(--rdw-font);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--rdw-muted);
}
.rdw-progress__track {
  height: 6px;
  border-radius: 999px;
  background: var(--rdw-surface-2);
  border: 1px solid var(--rdw-border);
  overflow: hidden;
}
.rdw-progress__fill {
  height: 100%;
  width: var(${PROGRESS_WIDTH_VAR}, 0%);
  background: var(--rdw-accent);
  border-radius: inherit;
  transition: width 0.2s ease;
}
.rdw-progress__fill--indeterminate {
  width: 40%;
  animation: rdw-progress-indeterminate 1.1s ease-in-out infinite;
}
@keyframes rdw-progress-indeterminate {
  0% { transform: translateX(-120%); }
  100% { transform: translateX(280%); }
}
`;
function clampUnit(value) {
	if (!Number.isFinite(value)) return 0;
	if (value < 0) return 0;
	if (value > 1) return 1;
	return value;
}
function ProgressBar(props) {
	const fillRef = T(null);
	const waiting = props.waiting === true;
	const hasValue = props.value !== void 0 && props.value !== null;
	const ratio = hasValue ? clampUnit(props.value) : 0;
	const className = ["rdw-progress", props.className].filter((part) => part !== void 0 && part.length > 0).join(" ");
	A(() => {
		const fill = fillRef.current;
		if (fill === null) return;
		if (waiting || !hasValue) {
			fill.style.removeProperty(PROGRESS_WIDTH_VAR);
			return;
		}
		fill.style.setProperty(PROGRESS_WIDTH_VAR, `${Math.round(ratio * 100)}%`);
	}, [
		waiting,
		hasValue,
		ratio
	]);
	return /* @__PURE__ */ a($$1, { children: [/* @__PURE__ */ a("style", { children: PROGRESS_BAR_CSS }), /* @__PURE__ */ a("div", {
		className,
		children: [props.label !== void 0 ? /* @__PURE__ */ a("div", {
			className: "rdw-progress__label",
			children: props.label
		}) : null, /* @__PURE__ */ a("div", {
			className: "rdw-progress__track",
			role: "progressbar",
			"aria-label": props.label,
			"aria-valuemin": 0,
			"aria-valuemax": 100,
			"aria-valuenow": hasValue && !waiting ? Math.round(ratio * 100) : void 0,
			children: /* @__PURE__ */ a("div", {
				ref: fillRef,
				className: waiting ? "rdw-progress__fill rdw-progress__fill--indeterminate" : "rdw-progress__fill"
			})
		})]
	})] });
}
var SECTION_LABEL_CSS = `
.rdw-section-label {
  display: block;
  font: 600 10.5px var(--rdw-font);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--rdw-muted);
  margin: 0 0 4px;
}
`;
function SectionLabel(props) {
	const className = ["rdw-section-label", props.className].filter((part) => part !== void 0 && part.length > 0).join(" ");
	if (props.htmlFor !== void 0) return /* @__PURE__ */ a($$1, { children: [/* @__PURE__ */ a("style", { children: SECTION_LABEL_CSS }), /* @__PURE__ */ a("label", {
		className,
		htmlFor: props.htmlFor,
		children: props.children
	})] });
	return /* @__PURE__ */ a($$1, { children: [/* @__PURE__ */ a("style", { children: SECTION_LABEL_CSS }), /* @__PURE__ */ a("div", {
		className,
		children: props.children
	})] });
}
var SEGMENTED_CSS = `
${KIT_FOCUS_CSS}
.rdw-seg {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  background: var(--rdw-surface-2);
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  padding: 2px;
  gap: 2px;
}
.rdw-seg__btn {
  min-height: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: var(--rdw-radius-s);
  background: transparent;
  color: var(--rdw-muted);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  padding: 0 8px;
}
.rdw-seg__btn[aria-checked="true"] {
  background: var(--rdw-surface);
  color: var(--rdw-text);
  font-weight: 600;
  box-shadow: var(--rdw-shadow-1);
}
`;
function Segmented(props) {
	const className = ["rdw-seg", props.className].filter((part) => part !== void 0 && part.length > 0).join(" ");
	return /* @__PURE__ */ a($$1, { children: [/* @__PURE__ */ a("style", { children: SEGMENTED_CSS }), /* @__PURE__ */ a("div", {
		className,
		role: "radiogroup",
		"aria-label": props.label,
		children: props.options.map((option) => {
			const selected = option.value === props.value;
			return /* @__PURE__ */ a("button", {
				type: "button",
				role: "radio",
				className: "rdw-seg__btn rdw-kit-focusable",
				"aria-checked": selected,
				tabIndex: selected ? 0 : -1,
				onClick: () => {
					props.onChange(option.value);
				},
				onKeyDown: (event) => {
					if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
					event.preventDefault();
					const index = props.options.findIndex((item) => item.value === props.value);
					if (index < 0) return;
					const delta = event.key === "ArrowRight" ? 1 : -1;
					const next = props.options[(index + delta + props.options.length) % props.options.length];
					if (next !== void 0) props.onChange(next.value);
				},
				children: option.label
			}, option.value);
		})
	})] });
}
var SELECT_CSS = `
${KIT_FOCUS_CSS}
.rdw-select {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.rdw-select__label {
  font: 600 10.5px var(--rdw-font);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--rdw-muted);
}
.rdw-select__trigger {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 28px;
  height: 28px;
  width: 100%;
  padding: 0 8px;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-surface);
  color: var(--rdw-text);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.rdw-select__trigger:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.rdw-select__list {
  position: absolute;
  z-index: 20;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  margin: 0;
  padding: 4px;
  list-style: none;
  background: var(--rdw-surface);
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  box-shadow: var(--rdw-shadow-2);
  max-height: 220px;
  overflow: auto;
}
.rdw-select__option {
  min-height: 28px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  border-radius: var(--rdw-radius-s);
  font-size: 12px;
  color: var(--rdw-text);
  cursor: pointer;
}
.rdw-select__option[aria-selected="true"],
.rdw-select__option:hover {
  background: var(--rdw-surface-2);
}
`;
function Select(props) {
	const listId = P$1();
	const rootRef = T(null);
	const [open, setOpen] = d(false);
	const selected = props.options.find((option) => option.value === props.value) ?? props.options[0];
	const className = ["rdw-select", props.className].filter((part) => part !== void 0 && part.length > 0).join(" ");
	A(() => {
		if (!open) return;
		const onKeyDown = (event) => {
			if (event.key === "Escape") setOpen(false);
		};
		const onPointerDown = (event) => {
			const root = rootRef.current;
			if (root === null) return;
			if (!event.composedPath().includes(root)) setOpen(false);
		};
		document.addEventListener("keydown", onKeyDown);
		document.addEventListener("mousedown", onPointerDown);
		return () => {
			document.removeEventListener("keydown", onKeyDown);
			document.removeEventListener("mousedown", onPointerDown);
		};
	}, [open]);
	return /* @__PURE__ */ a($$1, { children: [/* @__PURE__ */ a("style", { children: SELECT_CSS }), /* @__PURE__ */ a("div", {
		className,
		ref: rootRef,
		children: [
			props.label !== void 0 ? /* @__PURE__ */ a("span", {
				className: "rdw-select__label",
				id: `${listId}-label`,
				children: props.label
			}) : null,
			/* @__PURE__ */ a("button", {
				type: "button",
				className: "rdw-select__trigger rdw-kit-focusable",
				"aria-haspopup": "listbox",
				"aria-expanded": open,
				"aria-controls": listId,
				"aria-labelledby": props.label !== void 0 ? `${listId}-label` : void 0,
				disabled: props.disabled,
				onClick: () => {
					setOpen((prev) => !prev);
				},
				children: [/* @__PURE__ */ a("span", { children: selected?.label ?? props.value }), /* @__PURE__ */ a(IconChevronDown, { size: 14 })]
			}),
			open ? /* @__PURE__ */ a("ul", {
				className: "rdw-select__list",
				role: "listbox",
				id: listId,
				tabIndex: -1,
				children: props.options.map((option) => /* @__PURE__ */ a("li", {
					role: "option",
					className: "rdw-select__option rdw-kit-focusable",
					"aria-selected": option.value === props.value,
					tabIndex: 0,
					onClick: () => {
						props.onChange(option.value);
						setOpen(false);
					},
					onKeyDown: (event) => {
						if (event.key === "Enter" || event.key === " ") {
							event.preventDefault();
							props.onChange(option.value);
							setOpen(false);
						}
					},
					children: option.label
				}, option.value))
			}) : null
		]
	})] });
}
var SITE_THEME_SELECTOR = `[${RDW_THEME_ATTR}="${APPEARANCE_THEME_SITE}"]`;
var SITE_DARK_THEME_SELECTOR = `[${RDW_THEME_ATTR}="${APPEARANCE_THEME_SITE_DARK}"]`;
var SWITCH_CSS = `
${KIT_FOCUS_CSS}
.rdw-switch-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 28px;
}
.rdw-switch {
  position: relative;
  box-sizing: border-box;
  width: 36px;
  height: 28px;
  min-width: 36px;
  min-height: 28px;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
}
.rdw-switch__track {
  display: block;
  width: 30px;
  height: 17px;
  margin: 0 auto;
  border-radius: 9px;
  background: var(--rdw-border);
  position: relative;
  transition: background 0.15s ease;
}
.rdw-switch__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: var(--rdw-surface);
  transition: left 0.15s ease;
}
.rdw-switch[aria-checked="true"] .rdw-switch__track {
  background: var(--rdw-accent);
}
.rdw-switch[aria-checked="true"] .rdw-switch__thumb {
  left: 15px;
}
.rdw-switch:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.rdw-switch__label {
  font-size: 12.5px;
  color: var(--rdw-text);
}
/* Site default: green ON (not link blue); OFF stays border; thumb contrast-checked. */
html${SITE_THEME_SELECTOR} .rdw-switch[aria-checked="true"] .rdw-switch__track,
:host-context(${SITE_THEME_SELECTOR}) .rdw-switch[aria-checked="true"] .rdw-switch__track {
  background: ${SITE_DEFAULT_SWITCH_ON};
}
html${SITE_THEME_SELECTOR} .rdw-switch[aria-checked="true"] .rdw-switch__thumb,
:host-context(${SITE_THEME_SELECTOR}) .rdw-switch[aria-checked="true"] .rdw-switch__thumb {
  background: ${resolveSwitchThumbOn(SITE_DEFAULT_SWITCH_ON, SITE_DEFAULT_SWITCH_THUMB_ON, [SITE_LIGHT_C_BG_ALT, "#ffffff"])};
}
html${SITE_THEME_SELECTOR} .rdw-switch:not([aria-checked="true"]) .rdw-switch__track,
:host-context(${SITE_THEME_SELECTOR}) .rdw-switch:not([aria-checked="true"]) .rdw-switch__track {
  background: var(--rdw-border);
}
/* Site dark: ON = accent; OFF = border; thumb contrast-checked vs accent. */
html${SITE_DARK_THEME_SELECTOR} .rdw-switch[aria-checked="true"] .rdw-switch__track,
:host-context(${SITE_DARK_THEME_SELECTOR}) .rdw-switch[aria-checked="true"] .rdw-switch__track {
  background: ${SITE_DARK_C_ACCENT};
}
html${SITE_DARK_THEME_SELECTOR} .rdw-switch[aria-checked="true"] .rdw-switch__thumb,
:host-context(${SITE_DARK_THEME_SELECTOR}) .rdw-switch[aria-checked="true"] .rdw-switch__thumb {
  background: ${resolveSwitchThumbOn(SITE_DARK_C_ACCENT, SITE_DARK_C_BG, ["#16181c", "#ffffff"])};
}
html${SITE_DARK_THEME_SELECTOR} .rdw-switch:not([aria-checked="true"]) .rdw-switch__track,
:host-context(${SITE_DARK_THEME_SELECTOR}) .rdw-switch:not([aria-checked="true"]) .rdw-switch__track {
  background: ${SITE_DARK_C_BORDER};
}
`;
function Switch(props) {
	const className = ["rdw-switch-row", props.className].filter((part) => part !== void 0 && part.length > 0).join(" ");
	return /* @__PURE__ */ a($$1, { children: [/* @__PURE__ */ a("style", { children: SWITCH_CSS }), /* @__PURE__ */ a("div", {
		className,
		children: [/* @__PURE__ */ a("button", {
			type: "button",
			id: props.id,
			className: "rdw-switch rdw-kit-focusable",
			role: "switch",
			"aria-checked": props.checked,
			"aria-label": props.label,
			disabled: props.disabled,
			onClick: () => {
				props.onChange(!props.checked);
			},
			children: /* @__PURE__ */ a("span", {
				className: "rdw-switch__track",
				children: /* @__PURE__ */ a("span", { className: "rdw-switch__thumb" })
			})
		}), props.label !== void 0 ? /* @__PURE__ */ a("span", {
			className: "rdw-switch__label",
			children: props.label
		}) : null]
	})] });
}
var TAB_ID_PREFIX = "rdw-tab-";
var TAB_PANEL_ID_PREFIX = "rdw-tabpanel-";
var KEY_ARROW_RIGHT = "ArrowRight";
var KEY_ARROW_LEFT = "ArrowLeft";
function kitTabId(id) {
	return `${TAB_ID_PREFIX}${id}`;
}
function kitTabPanelId(id) {
	return `${TAB_PANEL_ID_PREFIX}${id}`;
}
var TABS_CSS = `
${KIT_FOCUS_CSS}
.rdw-tabs {
  display: flex;
  gap: 2px;
  border-bottom: 1px solid var(--rdw-border);
  padding: 0 8px;
}
.rdw-tabs__tab {
  box-sizing: border-box;
  min-height: 28px;
  padding: 7px 10px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--rdw-muted);
  font: inherit;
  font-size: 12.5px;
  cursor: pointer;
  margin-bottom: -1px;
}
.rdw-tabs__tab[aria-selected="true"] {
  color: var(--rdw-text);
  font-weight: 600;
  border-bottom-color: var(--rdw-accent);
}
`;
function Tabs(props) {
	const className = ["rdw-tabs", props.className].filter((part) => part !== void 0 && part.length > 0).join(" ");
	return /* @__PURE__ */ a($$1, { children: [/* @__PURE__ */ a("style", { children: TABS_CSS }), /* @__PURE__ */ a("div", {
		className,
		role: "tablist",
		"aria-label": props["aria-label"],
		children: props.items.map((item) => {
			const selected = item.id === props.value;
			return /* @__PURE__ */ a("button", {
				type: "button",
				role: "tab",
				id: kitTabId(item.id),
				className: "rdw-tabs__tab rdw-kit-focusable",
				"aria-selected": selected,
				"aria-controls": kitTabPanelId(item.id),
				tabIndex: selected ? 0 : -1,
				onClick: () => {
					props.onChange(item.id);
				},
				onKeyDown: (event) => {
					if (event.key !== KEY_ARROW_RIGHT && event.key !== KEY_ARROW_LEFT) return;
					event.preventDefault();
					const index = props.items.findIndex((entry) => entry.id === props.value);
					if (index < 0) return;
					const delta = event.key === KEY_ARROW_RIGHT ? 1 : -1;
					const next = props.items[(index + delta + props.items.length) % props.items.length];
					if (next === void 0) return;
					props.onChange(next.id);
					const nextTab = event.currentTarget.parentElement?.querySelector(`#${kitTabId(next.id)}`);
					if (nextTab instanceof HTMLElement) nextTab.focus();
				},
				children: item.label
			}, item.id);
		})
	})] });
}
/** How long a toast stays visible before it dismisses itself. */
var TOAST_AUTO_HIDE_MS = 6e3;
var TOAST_Z_INDEX = 45;
var TOAST_BOTTOM_PX = 16;
var TOAST_MAX_WIDTH_PX = 420;
var TOAST_PADDING_X_PX = 12;
var TOAST_PADDING_Y_PX = 8;
var TOAST_GAP_PX = 12;
var nextToastSlotId = 0;
var activeToastSlot = null;
function clearSlotTimer(slot) {
	if (slot.timerId === null) return;
	window.clearTimeout(slot.timerId);
	slot.timerId = null;
}
function takeToastSlot(close) {
	nextToastSlotId += 1;
	const slot = {
		id: nextToastSlotId,
		close,
		timerId: null
	};
	const previous = activeToastSlot;
	activeToastSlot = slot;
	if (previous !== null) {
		clearSlotTimer(previous);
		previous.close();
	}
	return slot;
}
function dismissToast(id) {
	if (activeToastSlot === null || activeToastSlot.id !== id) return;
	const slot = activeToastSlot;
	clearSlotTimer(slot);
	activeToastSlot = null;
	slot.close();
}
function releaseToastSlot(id) {
	if (activeToastSlot !== null && activeToastSlot.id === id) activeToastSlot = null;
}
var TOAST_CSS = `
${KIT_FOCUS_CSS}
.rdw-toast {
  position: fixed;
  z-index: ${String(TOAST_Z_INDEX)};
  left: 50%;
  bottom: ${String(TOAST_BOTTOM_PX)}px;
  transform: translateX(-50%);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: ${String(TOAST_GAP_PX)}px;
  width: max-content;
  max-width: min(${String(TOAST_MAX_WIDTH_PX)}px, calc(100% - ${String(32)}px));
  padding: ${String(TOAST_PADDING_Y_PX)}px ${String(TOAST_PADDING_X_PX)}px;
  background: var(--rdw-surface);
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-l);
  box-shadow: var(--rdw-shadow-2);
  color: var(--rdw-text);
  font: 12.5px/1.4 var(--rdw-font);
}
.rdw-toast__message {
  margin: 0;
}
`;
function Toast(props) {
	const [slotId, setSlotId] = d(null);
	F(() => {
		if (!props.open) {
			setSlotId(null);
			return;
		}
		let alive = true;
		const slot = takeToastSlot(() => {
			if (alive) setSlotId(null);
			props.onClose();
		});
		setSlotId(slot.id);
		slot.timerId = window.setTimeout(() => {
			dismissToast(slot.id);
		}, TOAST_AUTO_HIDE_MS);
		return () => {
			alive = false;
			clearSlotTimer(slot);
			releaseToastSlot(slot.id);
		};
	}, [
		props.open,
		props.message,
		props.onClose
	]);
	if (!props.open || slotId === null) return null;
	if (activeToastSlot === null || activeToastSlot.id !== slotId) return null;
	return /* @__PURE__ */ a($$1, { children: [/* @__PURE__ */ a("style", { children: TOAST_CSS }), /* @__PURE__ */ a("div", {
		className: "rdw-toast",
		role: "status",
		children: [/* @__PURE__ */ a("p", {
			className: "rdw-toast__message",
			children: props.message
		}), props.action !== void 0 ? /* @__PURE__ */ a(Button, {
			variant: "secondary",
			size: "s",
			onClick: props.action.onClick,
			children: props.action.label
		}) : null]
	})] });
}var SITE_SELECTORS = exports("S",{
	thumb: "span.thumb",
	thumbLink: "a[href*=\"s=view\"]",
	previewImage: "img.preview",
	cardFavButton: `button.${CSS_CLASS.cardFav}`,
	favoritesDeleteLink: "a[onclick]",
	tagSidebar: "ul#tag-sidebar",
	tagTypeArtist: "li.tag-type-artist",
	imageList: "div.image-list",
	postListContent: "#post-list div.content",
	contentRoot: "#content",
	artistFollowButton: `button.${CSS_CLASS.artistFollow}`,
	/** Native AI filter checkbox (site owns click/cookie logic). */
	filterAiCheckbox: "input.toggleSwitch#chkFilterAI",
	/** Row wrapping the native AI filter control — hide when search-tools mirrors it. */
	filterAiRow: "li:has(> label > span.switch > input.toggleSwitch#chkFilterAI)",
	/** Post page: site link to the previous post of the last search (href="#", site JS). */
	postPrevSearchLink: "a#prev_search_link",
	/** Post page: site link to the next post of the last search (href="#", site JS). */
	postNextSearchLink: "a#next_search_link",
	/** Stray Tags heading between #rdw-search-tools and the tag list. */
	tagsHeadingAfterSearchTools: "#rdw-search-tools + h5"
});
var THUMB_ID_PATTERN = /^s(\d+)$/;
var FAVORITES_DELETE_ID_PATTERN = /s=delete&id=(\d+)/;
function extractPostIdFromThumb(thumb) {
	const match = THUMB_ID_PATTERN.exec(thumb.id);
	if (match === null) return null;
	const postId = match[1];
	return postId === void 0 ? null : postId;
}
function extractPostIdFromFavoritesDeleteOnclick(onclick) {
	const match = FAVORITES_DELETE_ID_PATTERN.exec(onclick);
	if (match === null) return null;
	const postId = match[1];
	return postId === void 0 ? null : postId;
}
/**
* Site chrome CSS for html.rdw-skin (light / dark / custom themes).
* Colors only via --rdw-* tokens. Does not change .thumb 200×200 cell size.
* Injected via applyAppearanceTheme → injectSiteSkinHook(getSiteSkinCss()).
*/
var ROOT = `html.${RDW_SKIN_CLASS}`;
var ROOT_DARK = `${ROOT}[${RDW_THEME_ATTR}="${APPEARANCE_THEME_DARK}"]`;
var ROOT_SITE = `html[${RDW_THEME_ATTR}="${APPEARANCE_THEME_SITE}"]`;
var ROOT_SITE_DARK = `html[${RDW_THEME_ATTR}="${APPEARANCE_THEME_SITE_DARK}"]`;
var ROOT_THEME_DARK = `html[${RDW_THEME_ATTR}="${APPEARANCE_THEME_DARK}"]`;
/** search-tools mount root (id + class in src/features/search-tools.tsx). */
var SEARCH_TOOLS_ROOT_ID$1 = "rdw-search-tools";
/** Reset control class (src/features/search-tools.tsx). */
var SEARCH_TOOLS_RESET_CLASS = "rdw-search-tools-reset";
/**
* Same exclusions as :not…:not…, but :where() zeros their specificity so an
* ID-bearing :not cannot outrank accent rules like div.tag-search submit.
*/
var WHERE_NOT_OUR_CONTROL = `:where(:not([class*="rdw-"])${`:not(#${SEARCH_TOOLS_ROOT_ID$1} *)`})`;
/**
* Body class Package E sets only while the post panel host is mounted
* (`POST_PANEL_MOUNTED_CLASS` in post-actions.ts).
*/
var RDW_POST_PANEL_MOUNTED_CLASS = "rdw-post-panel-mounted";
/** Native "I came" counter row — hide with panel chrome (E HANDOFF). */
var POST_PANEL_ICAME_ROW = "li:has(a[onclick^=\"iCame(\"])";
/** Post panel host id — keep in sync with POST_ACTIONS_ID in features/types.ts. */
var POST_ACTIONS_HOST_ID = "rdw-post-actions";
/** Kit select list — keep in sync with src/ui/kit/select.tsx. */
var KIT_SELECT_LIST_CLASS = "rdw-select__list";
/** Kit autocomplete list — keep in sync with src/ui/kit/autocomplete-field.tsx. */
var KIT_AC_LIST_CLASS = "rdw-ac__list";
/** Kit dialog panel — keep in sync with src/ui/kit/dialog.tsx. */
var KIT_DIALOG_CLASS = "rdw-dialog";
/** Playlist add-to menu — keep in sync with src/features/playlist-menu.ts. */
var PLAYLIST_MENU_CLASS = "rdw-playlist-menu";
/** Firefox / modern Chromium thin scrollbar (E HANDOFF). */
var SCROLLBAR_WIDTH = "thin";
/** Post panel Original control — keep in sync with post-actions ORIGINAL_BUTTON_SIZE_PX. */
var POST_PANEL_ORIGINAL_SIZE_PX = 34;
/** Active tab underline — keep in sync with kit/tabs.tsx. */
var POST_PANEL_TAB_UNDERLINE_PX = 2;
/** Post panel classes — keep in sync with src/features/post-panel/post-panel.tsx. */
var POST_PANEL_ACTIONS_CLASS = "rdw-post-panel-actions";
var POST_PANEL_ACTIONS_ROW_CLASS = "rdw-post-panel-actions-row";
var POST_PANEL_FAV_CLASS = "rdw-post-panel-fav";
var POST_PANEL_ORIGINAL_CLASS = "rdw-post-panel-original";
var POST_PANEL_TABPANEL_CLASS = "rdw-post-panel-tabpanel";
var POST_PANEL_POST_ACTION_CLASS = "rdw-post-panel-post-action";
/** Kit tabs — keep in sync with src/ui/kit/tabs.tsx. */
var KIT_TABS_CLASS = "rdw-tabs";
var KIT_TAB_CLASS = "rdw-tabs__tab";
var KIT_BTN_PRIMARY_CLASS = "rdw-btn--primary";
/**
* Body class while search-tools «AI posts» row is rendered
* (`SEARCH_TOOLS_AI_ROW_BODY_CLASS` in search-tools.tsx — F HANDOFF).
*/
var SEARCH_TOOLS_AI_ROW_BODY_CLASS$1 = "rdw-search-tools-ai-posts";
/** F bulk-select chrome — keep in sync with src/features/favorites-bulk.tsx. */
var FAV_BULK_SELECTED_CLASS = "rdw-fav-bulk-selected";
var FAV_BULK_CHECK_CLASS = "rdw-fav-bulk-check";
var FAV_BULK_ROOT_ID = "rdw-favorites-bulk";
var FAV_BULK_BAR_CLASS = "rdw-favorites-bulk-bar";
var FAV_BULK_STATUS_CLASS = "rdw-favorites-bulk-status";
/** Body class while selection mode is active (featureBodyClass + "-selecting"). */
var FAV_BULK_SELECTING_BODY_CLASS = "rdw-f-favorites-bulk-selecting";
var FAV_BULK_OUTLINE_WIDTH = "2px";
var FAV_BULK_OUTLINE_OFFSET = "2px";
var FAV_BULK_CHECK_SIZE = "1.25rem";
var FAV_BULK_CHECK_INSET = "0.25rem";
var FAV_BULK_CHECK_Z_INDEX = 2;
var FAV_BULK_CHECK_FONT_SIZE = "0.75rem";
var v = {
	bg: `var(${TOKEN_VAR.bg})`,
	surface: `var(${TOKEN_VAR.surface})`,
	surface2: `var(${TOKEN_VAR.surface2})`,
	border: `var(${TOKEN_VAR.border})`,
	text: `var(${TOKEN_VAR.text})`,
	muted: `var(${TOKEN_VAR.muted})`,
	accent: `var(${TOKEN_VAR.accent})`,
	accentSoft: `var(${TOKEN_VAR.accentSoft})`,
	danger: `var(${TOKEN_VAR.danger})`,
	dangerSoft: `var(${TOKEN_VAR.dangerSoft})`,
	tagArtist: `var(${TOKEN_VAR.tagArtist})`,
	tagCharacter: `var(${TOKEN_VAR.tagCharacter})`,
	tagCopyright: `var(${TOKEN_VAR.tagCopyright})`,
	tagMetadata: `var(${TOKEN_VAR.tagMetadata})`,
	radiusS: `var(${TOKEN_VAR.radiusS})`,
	radiusM: `var(${TOKEN_VAR.radiusM})`,
	radiusL: `var(${TOKEN_VAR.radiusL})`,
	shadow1: `var(${TOKEN_VAR.shadow1})`,
	shadow2: `var(${TOKEN_VAR.shadow2})`,
	font: `var(${TOKEN_VAR.font})`
};
/** Full site-skin stylesheet (empty until injected by boot). */
var SITE_SKIN_CSS = `
/* —— base —— */
${ROOT} body {
  font-family: ${v.font};
  font-size: 13px;
  line-height: 1.4;
  background: ${v.bg};
  color: ${v.text};
}

${ROOT} body,
${ROOT} body div,
${ROOT} body h1,
${ROOT} body h2,
${ROOT} body h3,
${ROOT} body h4,
${ROOT} body h5,
${ROOT} body h6,
${ROOT} body p,
${ROOT} body ul,
${ROOT} body li,
${ROOT} body dd,
${ROOT} body dt,
${ROOT} body input,
${ROOT} body select,
${ROOT} body button,
${ROOT} body textarea {
  font-family: ${v.font};
}

${ROOT} a:link {
  color: ${v.accent};
  text-decoration: none;
}

${ROOT} a:visited {
  color: ${v.muted};
  text-decoration: none;
}

${ROOT} a:hover,
${ROOT} a:active {
  color: ${v.text};
  text-decoration: none;
}

${ROOT} a.last-page {
  color: ${v.muted};
}

${ROOT} a.spoiler,
${ROOT} span.spoiler {
  color: ${v.text};
  background: ${v.text};
}

${ROOT} a.spoiler:hover,
${ROOT} span.spoiler:hover {
  color: ${v.bg};
  background: ${v.text};
}

${ROOT} hr {
  border-color: ${v.border};
}

${ROOT} code {
  font-family: ui-monospace, monospace;
}

/* —— header —— */
${ROOT} div#header {
  background: ${v.surface};
  border-bottom: 1px solid ${v.border};
  margin-bottom: 0.75em;
}

${ROOT} div#header #site-title {
  background-image: none;
  background-color: transparent;
  padding: 12px 18px 4px 18px;
  font: 800 17px ${v.font};
  letter-spacing: -0.02em;
  color: ${v.text};
}

${ROOT} div#header #site-title a {
  color: ${v.text};
  font-weight: 800;
  background: none;
  text-shadow: none;
}

${ROOT} div#header ul#navbar {
  background: transparent;
  padding: 4px 18px 8px 10px;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

${ROOT} div#header ul#navbar li {
  font-size: 13px;
  font-weight: normal;
  padding: 0;
  margin: 0;
  background: transparent;
  background-image: none;
  list-style: none;
  display: inline;
}

${ROOT} div#header ul#navbar li a {
  display: inline-block;
  padding: 6px 10px;
  border-radius: ${v.radiusM};
  color: ${v.muted};
  font-weight: normal;
}

${ROOT} div#header ul#navbar li.current-page {
  background: transparent;
  background-image: none;
}

${ROOT} div#header ul#navbar li.current-page a,
${ROOT} #navbar li.current-page a {
  background: ${v.accentSoft};
  color: ${v.accent};
  font-weight: 600;
}

${ROOT} div#header ul#subnavbar {
  background: ${v.surface};
  border-top: 1px solid ${v.border};
  border-bottom: none;
  padding: 6px 18px;
  margin: 0;
}

${ROOT} div#header ul#subnavbar li {
  padding: 0 8px;
  font-size: 12.5px;
}

${ROOT} div#header ul#subnavbar li a {
  color: ${v.muted};
}

${ROOT} div#header ul#subnavbar li a:hover {
  color: ${v.accent};
}

${ROOT} div.tips {
  background: ${v.accentSoft};
  background-image: none;
  border-bottom: 1px solid ${v.border};
  color: ${v.text};
}

/* —— sidebar —— */
${ROOT} div.sidebar {
  width: 228px;
  min-width: 228px;
  max-width: 228px;
  margin-right: 1em;
}

${ROOT} div.sidebar h5,
${ROOT} div.sidebar h6,
${ROOT} ul#tag-sidebar h5,
${ROOT} ul#tag-sidebar h6 {
  font: 600 10.5px ${v.font};
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${v.muted};
  margin: 0 0 6px;
}

/* Standalone "Tags"/"Search" (and similar) headings above the list card */
${ROOT} div.sidebar > h5 {
  display: none;
}

/* Tags between search panel card and tag list (typical site markup) */
${ROOT} div.tag-search + h5 {
  display: none;
}

/* D: Tags heading immediately after search-tools when they are siblings */
${ROOT} ${SITE_SELECTORS.tagsHeadingAfterSearchTools} {
  display: none;
}

/* F: native AI filter row — only while search-tools AI posts row is rendered */
${ROOT} body.${SEARCH_TOOLS_AI_ROW_BODY_CLASS$1} ${SITE_SELECTORS.filterAiRow} {
  display: none;
}

${ROOT} div.tag-search,
${ROOT} ul#tag-sidebar {
  background: ${v.surface};
  border: 1px solid ${v.border};
  border-radius: ${v.radiusL};
  padding: 12px;
  box-shadow: ${v.shadow1};
  box-sizing: border-box;
}

${ROOT} div.tag-search {
  margin-bottom: 12px;
}

${ROOT} ul#tag-sidebar {
  margin: 0;
  padding: 12px;
  list-style: none;
}

/*
 * Tag rows: ?/+/- /name (list) or ?/name (post) wrap as inline text;
 * count stays top-right on the first line (artists-sidebar.test markup).
 */
${ROOT} ul#tag-sidebar > li {
  display: block;
  position: relative;
  margin: 0 0 5px;
  padding-right: 4.5em;
  font-size: 12.5px;
  line-height: 1.35;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

${ROOT} ul#tag-sidebar > li > a {
  display: inline;
}

${ROOT} ul#tag-sidebar > li > h5,
${ROOT} ul#tag-sidebar > li > h6 {
  display: block;
  margin-top: 8px;
}

${ROOT} ul#tag-sidebar > li:first-child > h5,
${ROOT} ul#tag-sidebar > li:first-child > h6 {
  margin-top: 0;
}

${ROOT} .tag-count,
${ROOT} span.post-count,
${ROOT} span.tag-count {
  position: absolute;
  top: 0;
  right: 0;
  margin-left: 0;
  color: ${v.muted};
  font-size: 12px;
  line-height: 1.35;
}

/*
 * Tag type color on the LAST link of the row (tag name).
 * List rows: ? + − name — name is 4th. Post rows: ? name — name is 2nd.
 * Operators / wiki stay muted on every page.
 */
${ROOT} ul#tag-sidebar > li[class*="tag-type-"] > a:not(:last-of-type) {
  color: ${v.muted};
  font-size: 11px;
  font-weight: normal;
}

${ROOT} .tag-type-artist > a,
${ROOT} .tag-type-artist {
  color: ${v.tagArtist};
}

${ROOT} .tag-type-character > a,
${ROOT} .tag-type-character {
  color: ${v.tagCharacter};
}

${ROOT} .tag-type-copyright > a,
${ROOT} .tag-type-copyright {
  color: ${v.tagCopyright};
}

${ROOT} .tag-type-metadata > a,
${ROOT} .tag-type-metadata {
  color: ${v.tagMetadata};
}

${ROOT} ul#tag-sidebar > li.tag-type-artist > a:last-of-type {
  color: ${v.tagArtist};
  font-size: 12.5px;
  font-weight: normal;
}

${ROOT} ul#tag-sidebar > li.tag-type-character > a:last-of-type {
  color: ${v.tagCharacter};
  font-size: 12.5px;
  font-weight: normal;
}

${ROOT} ul#tag-sidebar > li.tag-type-copyright > a:last-of-type {
  color: ${v.tagCopyright};
  font-size: 12.5px;
  font-weight: normal;
}

${ROOT} ul#tag-sidebar > li.tag-type-metadata > a:last-of-type {
  color: ${v.tagMetadata};
  font-size: 12.5px;
  font-weight: normal;
}

${ROOT} .tag-type-artist > a:hover,
${ROOT} .tag-type-artist:hover,
${ROOT} .tag-type-character > a:hover,
${ROOT} .tag-type-character:hover,
${ROOT} .tag-type-copyright > a:hover,
${ROOT} .tag-type-copyright:hover,
${ROOT} .tag-type-metadata > a:hover,
${ROOT} .tag-type-metadata:hover,
${ROOT} ul#tag-sidebar > li[class*="tag-type-"] > a:last-of-type:hover {
  color: ${v.accent};
}

/* Artist Follow: kit secondary on theme tokens (beats document-chrome #fff) */
${ROOT} button.${CSS_CLASS.artistFollow} {
  background: ${v.surface};
  border: 1px solid ${v.border};
  color: ${v.text};
  border-radius: ${v.radiusS};
}

${ROOT} button.${CSS_CLASS.artistFollow}:hover {
  background: ${v.accentSoft};
  border-color: ${v.accent};
  color: ${v.accent};
}

${ROOT} button.${CSS_CLASS.artistFollow}.${CSS_CLASS.artistFollowMarked} {
  background: ${v.accentSoft};
  border-color: ${v.accent};
  color: ${v.accent};
}

/* —— search field —— */
${ROOT} div.tag-search input[type="text"],
${ROOT} div.tag-search input[type="search"] {
  width: 100%;
  height: 34px;
  box-sizing: border-box;
  border: 1px solid ${v.border};
  border-radius: ${v.radiusM};
  padding: 0 10px;
  background: ${v.surface};
  color: ${v.text};
  font-size: 13px;
}

${ROOT} div.tag-search input[type="submit"],
${ROOT} div.tag-search button[type="submit"] {
  width: 100%;
  box-sizing: border-box;
  margin-top: 8px;
  padding: 6px 12px;
  border: none;
  border-radius: ${v.radiusS};
  background: ${v.accent};
  color: ${v.surface};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

${ROOT} div.tag-search input[type="submit"]:hover,
${ROOT} div.tag-search button[type="submit"]:hover {
  filter: brightness(1.05);
}

/* Kit ghost / link-button: single line in the search-tools foot row */
${ROOT} #${SEARCH_TOOLS_ROOT_ID$1} .${SEARCH_TOOLS_RESET_CLASS} {
  flex-shrink: 0;
  white-space: nowrap;
  background: transparent;
  border-color: transparent;
  color: ${v.accent};
  font-weight: 600;
  padding: 0;
  min-height: auto;
  height: auto;
}

${ROOT} #${SEARCH_TOOLS_ROOT_ID$1} .${SEARCH_TOOLS_RESET_CLASS}:hover {
  color: ${v.text};
  background: transparent;
  border-color: transparent;
}

${ROOT} input[type="text"]${WHERE_NOT_OUR_CONTROL}:focus,
${ROOT} input[type="password"]${WHERE_NOT_OUR_CONTROL}:focus,
${ROOT} input[type="search"]${WHERE_NOT_OUR_CONTROL}:focus,
${ROOT} textarea${WHERE_NOT_OUR_CONTROL}:focus,
${ROOT} select${WHERE_NOT_OUR_CONTROL}:focus {
  background: ${v.surface};
  outline: 2px solid ${v.accent};
  outline-offset: 1px;
  border-color: ${v.accent};
}

/* —— awesomplete —— */
/* Site hides closed lists with opacity/scale + display:block; do not undo that. */
${ROOT} .awesomplete > ul[hidden],
${ROOT} .awesomplete > ul:empty {
  display: none !important;
  pointer-events: none;
}

${ROOT} .awesomplete > ul:not([hidden]):not(:empty) {
  background: ${v.surface};
  background-image: none;
  border: 1px solid ${v.border};
  border-radius: ${v.radiusL};
  box-shadow: ${v.shadow2};
  margin: 0.35em 0 0;
  padding: 4px 0;
  text-shadow: none;
  transform: none;
}

${ROOT} .awesomplete > ul:before {
  display: none;
  content: none;
}

${ROOT} .awesomplete > ul > li {
  padding: 6px 10px;
  color: ${v.text};
  cursor: pointer;
}

${ROOT} .awesomplete > ul > li:hover,
${ROOT} .awesomplete > ul > li[aria-selected="true"] {
  background: ${v.accentSoft};
  color: ${v.accent};
}

${ROOT} .awesomplete mark {
  background: ${v.accentSoft};
  color: ${v.text};
}

${ROOT} div.auto_complete {
  background: ${v.surface};
}

${ROOT} div.auto_complete ul {
  border-color: ${v.border};
  background: ${v.surface};
}

${ROOT} div.auto_complete ul li.selected {
  background-color: ${v.accentSoft};
}

${ROOT} div.auto_complete ul strong.highlight {
  color: ${v.accent};
}

/* —— grid / thumbs (cell size unchanged) —— */
${ROOT} div.image-list {
  column-gap: ${String(4)}px;
  row-gap: ${String(4)}px;
  align-items: flex-start;
  align-content: flex-start;
}

${ROOT} img.preview {
  border-radius: ${v.radiusL};
}

/* Favorites: Remove stays subtle; hover must not paint the thumb cell */
${ROOT} span.thumb,
${ROOT} span.thumb:hover,
${ROOT} span.thumb > a,
${ROOT} span.thumb > a:hover {
  background-color: transparent;
}

${ROOT} span.thumb > a[onclick] {
  color: ${v.muted};
  font-size: 12px;
  font-weight: normal;
  padding: 2px 8px;
  border-radius: ${v.radiusS};
  background: transparent;
  border: none;
}

${ROOT} span.thumb > a[onclick]:hover {
  color: ${v.danger};
  background: transparent;
}

${ROOT} span.thumb > a[onclick] b {
  font-weight: normal;
  color: inherit;
}

/* —— favorites bulk select (F HANDOFF; tokens for Light/Dark/Site) —— */
${ROOT} body.${FAV_BULK_SELECTING_BODY_CLASS} span.thumb {
  position: relative;
  cursor: pointer;
}

${ROOT} span.thumb.${FAV_BULK_SELECTED_CLASS} {
  outline: ${FAV_BULK_OUTLINE_WIDTH} solid ${v.accent};
  outline-offset: ${FAV_BULK_OUTLINE_OFFSET};
  border-radius: ${v.radiusL};
}

/*
 * Check badge is a sibling of a#p{ID}, never inside the link.
 * Hidden until the thumb is selected.
 */
${ROOT} span.thumb > .${FAV_BULK_CHECK_CLASS} {
  position: absolute;
  top: ${FAV_BULK_CHECK_INSET};
  left: ${FAV_BULK_CHECK_INSET};
  z-index: ${String(FAV_BULK_CHECK_Z_INDEX)};
  display: none;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: ${FAV_BULK_CHECK_SIZE};
  height: ${FAV_BULK_CHECK_SIZE};
  border-radius: 50%;
  background: ${v.accent};
  color: ${v.surface};
  font-size: ${FAV_BULK_CHECK_FONT_SIZE};
  font-weight: 700;
  line-height: 1;
  pointer-events: none;
}

${ROOT} span.thumb.${FAV_BULK_SELECTED_CLASS} > .${FAV_BULK_CHECK_CLASS} {
  display: inline-flex;
}

${ROOT} #${FAV_BULK_ROOT_ID},
${ROOT} .${FAV_BULK_BAR_CLASS} {
  color: ${v.text};
}

${ROOT} #${FAV_BULK_ROOT_ID} .${FAV_BULK_STATUS_CLASS} {
  color: ${v.muted};
}

${ROOT} .webm-thumb {
  border: 1px solid ${v.accent};
  box-sizing: border-box;
}

${ROOT} img.flagged,
${ROOT} img.has-children,
${ROOT} img.has-parent,
${ROOT} img.pending,
${ROOT} img.video {
  border-width: 1px;
  border-style: solid;
  box-sizing: border-box;
}

${ROOT} img.flagged {
  border-color: ${v.danger};
}

${ROOT} img.has-children {
  border-color: ${v.tagCharacter};
}

${ROOT} img.has-parent {
  border-color: ${v.tagMetadata};
}

${ROOT} img.pending,
${ROOT} img.video {
  border-color: ${v.accent};
}

/* —— pagination —— */
${ROOT} div#paginator,
${ROOT} .pagination {
  display: block;
  padding: 1.5em 0 1em;
  text-align: center;
  clear: both;
}

${ROOT} div#paginator a,
${ROOT} .pagination a {
  display: inline-block;
  margin: 0 3px;
  padding: 4px 10px;
  border: 1px solid ${v.border};
  border-radius: ${v.radiusM};
  background: ${v.surface};
  color: ${v.text};
  text-decoration: none;
}

${ROOT} div#paginator a:hover,
${ROOT} .pagination a:hover {
  background: ${v.accentSoft};
  color: ${v.accent};
  border-color: ${v.accent};
}

${ROOT} div#paginator a.current,
${ROOT} div#paginator span.current,
${ROOT} .pagination a.current,
${ROOT} .pagination span.current {
  background: ${v.accent};
  border-color: ${v.accent};
  color: ${v.surface};
  font-weight: 600;
}

${ROOT} div#paginator span {
  margin: 0 3px;
  padding: 4px 8px;
}

${ROOT} .manual-page-chooser > input[type="text"] {
  width: 4em;
  height: 28px;
  border: 1px solid ${v.border};
  border-radius: ${v.radiusS};
  background: ${v.surface};
  color: ${v.text};
  padding: 0 6px;
}

${ROOT} .manual-page-chooser > input[type="submit"] {
  height: 28px;
  margin-left: 4px;
  padding: 0 10px;
  border: none;
  border-radius: ${v.radiusS};
  background: ${v.accent};
  color: ${v.surface};
  font-weight: 600;
  cursor: pointer;
}

/* —— forms / tables (site chrome; skip search-tools + any .rdw-* control) —— */
${ROOT} input${WHERE_NOT_OUR_CONTROL},
${ROOT} select${WHERE_NOT_OUR_CONTROL},
${ROOT} textarea${WHERE_NOT_OUR_CONTROL},
${ROOT} button${WHERE_NOT_OUR_CONTROL} {
  color: ${v.text};
  font-family: ${v.font};
}

${ROOT} input[type="text"]${WHERE_NOT_OUR_CONTROL},
${ROOT} input[type="password"]${WHERE_NOT_OUR_CONTROL},
${ROOT} input[type="search"]${WHERE_NOT_OUR_CONTROL},
${ROOT} input[type="number"]${WHERE_NOT_OUR_CONTROL},
${ROOT} select${WHERE_NOT_OUR_CONTROL},
${ROOT} textarea${WHERE_NOT_OUR_CONTROL} {
  background: ${v.surface};
  border: 1px solid ${v.border};
  border-radius: ${v.radiusS};
  color: ${v.text};
}

${ROOT} button${WHERE_NOT_OUR_CONTROL},
${ROOT} input[type="submit"]${WHERE_NOT_OUR_CONTROL},
${ROOT} input[type="button"]${WHERE_NOT_OUR_CONTROL},
${ROOT} .gdprbutton button {
  background: ${v.surface};
  border: 1px solid ${v.border};
  border-radius: ${v.radiusS};
  color: ${v.text};
  padding: 4px 10px;
  cursor: pointer;
}

${ROOT} button${WHERE_NOT_OUR_CONTROL}:hover,
${ROOT} input[type="submit"]${WHERE_NOT_OUR_CONTROL}:hover,
${ROOT} input[type="button"]${WHERE_NOT_OUR_CONTROL}:hover,
${ROOT} .gdprbutton button:hover {
  background: ${v.accentSoft};
  border-color: ${v.accent};
  color: ${v.accent};
}

/* Keep search submit as primary accent (overrides generic button chrome) */
${ROOT} div.tag-search input[type="submit"],
${ROOT} div.tag-search button[type="submit"],
${ROOT} .manual-page-chooser > input[type="submit"] {
  background: ${v.accent};
  border: none;
  color: ${v.surface};
  font-weight: 600;
}

${ROOT} div.tag-search input[type="submit"]:hover,
${ROOT} div.tag-search button[type="submit"]:hover,
${ROOT} .manual-page-chooser > input[type="submit"]:hover {
  background: ${v.accent};
  border: none;
  color: ${v.surface};
  filter: brightness(1.05);
}

${ROOT} table {
  color: ${v.text};
}

${ROOT} tr.tableheader,
${ROOT} thead tr {
  background: ${v.surface2} !important;
  background-image: none !important;
  color: ${v.text};
}

${ROOT} table.highlightable th {
  color: ${v.text};
  background: ${v.surface2};
}

${ROOT} table.highlightable td {
  border-color: ${v.border};
}

${ROOT} table.highlightable > tbody > tr:hover {
  background: ${v.accentSoft};
}

${ROOT} table tr.good {
  background: ${v.accentSoft};
}

${ROOT} table tr.selected {
  background: ${v.accentSoft} !important;
}

${ROOT} table tr.highlight {
  background: ${v.surface2};
}

${ROOT} table tr.pending-tag {
  background: ${v.surface2};
}

/* Zebra without native green tint */
${ROOT} table tr:nth-child(odd) {
  background: ${v.surface2};
}

${ROOT} table.form th {
  color: ${v.muted};
}

/* Forum tables */
${ROOT} div#forum > table {
  background: ${v.surface};
  border: 1px solid ${v.border};
  border-radius: ${v.radiusL};
  border-collapse: separate;
  border-spacing: 0;
  overflow: hidden;
  box-shadow: ${v.shadow1};
}

${ROOT} div#forum > table th,
${ROOT} div#forum > table td {
  border-color: ${v.border};
  color: ${v.text};
}

${ROOT} div#forum > table th:first-child,
${ROOT} div#forum > table td:first-child {
  text-align: left;
}

${ROOT} div#forum > table tr:nth-child(odd) {
  background: ${v.surface2};
}

${ROOT} div#forum > table tr:nth-child(even) {
  background: ${v.surface};
}

${ROOT} div#forum > table.highlightable > tbody > tr:hover {
  background: ${v.accentSoft};
}

${ROOT} .added-tags {
  color: ${v.tagCharacter};
}

${ROOT} .removed-tags {
  color: ${v.danger};
}

${ROOT} .obsolete-tag-change {
  color: ${v.text};
}

/* —— notices / cards —— */
${ROOT} div.status-notice,
${ROOT} div.notice,
${ROOT} div.has-mail,
${ROOT} div.blocked,
${ROOT} div.quote,
${ROOT} div.help div.code,
${ROOT} div#post-comments div#comment-list > div,
${ROOT} div#comments div#comment-list > div.post > div.col2,
${ROOT} div.response-list > div.post > div.content {
  background: ${v.surface};
  border: 1px solid ${v.border};
  border-radius: ${v.radiusL};
  box-shadow: ${v.shadow1};
}

${ROOT} div.status-notice {
  border-color: ${v.border};
  padding: 1em;
  margin: 1em;
  color: ${v.text};
}

${ROOT} div.notice {
  color: ${v.danger};
  padding: 0.75em 1em;
  margin-bottom: 1em;
}

${ROOT} div.has-mail {
  border-color: ${v.tagCharacter};
  background: ${v.accentSoft};
  padding: 1em;
  margin: 1em;
  color: ${v.text};
}

${ROOT} div.blocked {
  border-color: ${v.danger};
  background: ${v.dangerSoft};
  color: ${v.danger};
  padding: 1em;
  margin: 1em;
}

${ROOT} div.quote {
  border-color: ${v.border};
  background: ${v.surface2};
  background-image: none;
  color: ${v.text};
  padding: 12px;
  margin-top: 10px;
}

${ROOT} div.help div.code {
  border: 1px dashed ${v.border};
  background: ${v.surface2};
  color: ${v.text};
}

${ROOT} div.help h4 {
  color: ${v.tagCharacter};
}

${ROOT} div#post-comments div#comment-list > div,
${ROOT} div#comments div#comment-list > div.post > div.col2 {
  padding: 12px;
  margin-bottom: 1em;
}

${ROOT} div.response-list > div.post > div.content {
  padding: 10px 12px;
}

${ROOT} div.response-list > div.post > div.content > div.footer {
  color: ${v.muted};
  margin-top: 0.75em;
}

/* Edit | Respond (and similar) on comments / forum posts */
${ROOT} div.response-list > div.post > div.content > div.footer a,
${ROOT} ul.flat-list li a {
  color: ${v.muted};
  font-weight: normal;
  padding: 2px 6px;
  border-radius: ${v.radiusS};
}

${ROOT} div.response-list > div.post > div.content > div.footer a:hover,
${ROOT} ul.flat-list li a:hover {
  color: ${v.accent};
  background: ${v.accentSoft};
}

${ROOT} ul.flat-list li a.forum-update {
  font-style: italic;
  color: ${v.muted};
}

${ROOT} div.link-list ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

${ROOT} div.link-list li {
  margin: 0 0 4px;
}

${ROOT} div.link-list a {
  display: inline-block;
  padding: 4px 8px;
  border-radius: ${v.radiusS};
  color: ${v.muted};
}

${ROOT} div.link-list a:hover {
  color: ${v.accent};
  background: ${v.accentSoft};
}

${ROOT} span.author,
${ROOT} span.date {
  color: ${v.muted};
}

${ROOT} span.locked-topic {
  color: ${v.muted};
}

${ROOT} strong.divider {
  color: ${v.muted};
}

${ROOT} div#footer {
  color: ${v.muted};
}

${ROOT} div#footer > .footer-disabled,
${ROOT} div#footer > #label {
  color: ${v.muted};
}

${ROOT} div#user-record > table > tbody > tr.positive-record {
  background: ${v.accentSoft};
}

${ROOT} div#user-record > table > tbody > tr.negative-record {
  background: ${v.dangerSoft};
}

${ROOT} div.mailbody {
  background-color: ${v.surface};
  border-color: ${v.border};
}

${ROOT} div.mail .received {
  color: ${v.tagCharacter};
}

${ROOT} div.mail .sent {
  color: ${v.danger};
}

${ROOT} .gdprinner {
  background-color: ${v.surface};
  border-color: ${v.border};
  color: ${v.text};
}

/* —— post page —— */
/* E: hide native left-column chrome only while body.rdw-post-panel-mounted */
${ROOT} body.${RDW_POST_PANEL_MOUNTED_CLASS} div#stats {
  display: none !important;
}

${ROOT} body.${RDW_POST_PANEL_MOUNTED_CLASS} div.link-list {
  display: none !important;
}

${ROOT} body.${RDW_POST_PANEL_MOUNTED_CLASS} ${POST_PANEL_ICAME_ROW} {
  display: none !important;
}

/*
 * A: comments moved into the panel column — lift site max-width: 680px
 * so #post-comments fills the narrow column.
 */
${ROOT} body.${RDW_POST_PANEL_MOUNTED_CLASS} #${POST_ACTIONS_HOST_ID} #post-comments {
  max-width: none;
}

${ROOT} img#image {
  border-radius: ${v.radiusL};
}

${ROOT} div#post-view > div#right-col > div#edit,
${ROOT} div#edit-box {
  background: ${v.surface};
  border: 1px solid ${v.border};
  border-radius: ${v.radiusL};
  color: ${v.text};
}

${ROOT} div#note-container > div.note-body {
  background: ${v.surface};
  border: 1px solid ${v.border};
  color: ${v.text};
  border-radius: ${v.radiusS};
}

${ROOT} div#note-container > div.note-body > p.tn,
${ROOT} tn {
  color: ${v.muted};
}

${ROOT} div#note-container > div.note-box {
  border-color: ${v.accent};
  background: ${v.accentSoft};
}

${ROOT} div#note-container > div.note-box > div.note-corner {
  background: ${v.accent};
}

${ROOT} div#note-container > div.unsaved {
  background: ${v.surface};
  border-color: ${v.danger};
}

${ROOT} div#note-container > div.unsaved > div.note-corner {
  background: ${v.danger};
}

${ROOT} a.original-file-changed#highres {
  color: ${v.accent};
}

${ROOT} div#post-add p#scale {
  color: ${v.muted};
}

${ROOT} h2.wiki-title {
  color: ${v.accent};
}

${ROOT} div.wiki > h2.title {
  color: ${v.accent};
}

${ROOT} div#wiki-show > div#body > div#byline {
  color: ${v.muted};
}

${ROOT} div#wiki-diff del {
  background-color: ${v.dangerSoft};
  color: ${v.danger};
}

${ROOT} div#wiki-diff ins {
  background-color: ${v.accentSoft};
  color: ${v.text};
}

${ROOT} dt.bad {
  color: ${v.danger};
}

${ROOT} .blacklisted-tags-disabled {
  color: ${v.muted} !important;
}

/* —— dark theme contrast (tokens already dark; keep chrome readable) —— */
${ROOT_DARK} a:visited {
  color: ${v.muted};
}

${ROOT_DARK} a:hover,
${ROOT_DARK} a:active {
  color: ${v.text};
}

${ROOT_DARK} a.spoiler,
${ROOT_DARK} span.spoiler {
  color: ${v.bg};
  background: ${v.text};
}

${ROOT_DARK} a.spoiler:hover,
${ROOT_DARK} span.spoiler:hover {
  color: ${v.text};
  background: ${v.muted};
}

${ROOT_DARK} div#paginator a.current,
${ROOT_DARK} div#paginator span.current,
${ROOT_DARK} .pagination a.current,
${ROOT_DARK} .pagination span.current,
${ROOT_DARK} div.tag-search input[type="submit"],
${ROOT_DARK} div.tag-search button[type="submit"],
${ROOT_DARK} .manual-page-chooser > input[type="submit"],
${ROOT_DARK} span.thumb > .${FAV_BULK_CHECK_CLASS},
${ROOT_DARK} #${POST_ACTIONS_HOST_ID} .${POST_PANEL_FAV_CLASS}.${KIT_BTN_PRIMARY_CLASS} {
  color: ${v.text};
}

${ROOT_DARK} div.has-mail {
  background: ${v.surface2};
  border-color: ${v.tagCharacter};
}

/*
 * Post panel actions + tabs (A→E HANDOFF).
 * Unscoped under #rdw-post-actions so Site default/Site dark (no html.rdw-skin)
 * still beat native button/link chrome via document --rdw-* tokens.
 */
#${POST_ACTIONS_HOST_ID} .${POST_PANEL_ACTIONS_CLASS},
#${POST_ACTIONS_HOST_ID} .${POST_PANEL_ACTIONS_ROW_CLASS},
#${POST_ACTIONS_HOST_ID} .${POST_PANEL_TABPANEL_CLASS} {
  color: ${v.text};
}

#${POST_ACTIONS_HOST_ID} .${POST_PANEL_FAV_CLASS}.${KIT_BTN_PRIMARY_CLASS} {
  background: ${v.accent};
  border-color: ${v.accent};
  color: ${v.surface};
}

#${POST_ACTIONS_HOST_ID} .${POST_PANEL_ORIGINAL_CLASS} {
  box-sizing: border-box;
  width: ${String(POST_PANEL_ORIGINAL_SIZE_PX)}px;
  height: ${String(POST_PANEL_ORIGINAL_SIZE_PX)}px;
  min-width: ${String(POST_PANEL_ORIGINAL_SIZE_PX)}px;
  min-height: ${String(POST_PANEL_ORIGINAL_SIZE_PX)}px;
  background: ${v.surface};
  border: 1px solid ${v.border};
  color: ${v.text};
  text-decoration: none;
}

#${POST_ACTIONS_HOST_ID} .${KIT_TABS_CLASS} {
  border-bottom: 1px solid ${v.border};
  color: ${v.text};
}

#${POST_ACTIONS_HOST_ID} .${KIT_TAB_CLASS} {
  background: transparent;
  border: 0;
  border-bottom: ${String(POST_PANEL_TAB_UNDERLINE_PX)}px solid transparent;
  color: ${v.muted};
}

#${POST_ACTIONS_HOST_ID} .${KIT_TAB_CLASS}[aria-selected="true"] {
  color: ${v.text};
  font-weight: 600;
  border-bottom-color: ${v.accent};
}

#${POST_ACTIONS_HOST_ID} .${POST_PANEL_POST_ACTION_CLASS} {
  background: ${v.surface};
  border: 1px solid ${v.border};
  color: ${v.text};
  justify-content: flex-start;
}

/* Site themes: muted fails AA on green/dark chrome — tabs use text; keep accent underline. */
${ROOT_SITE} #${POST_ACTIONS_HOST_ID} .${KIT_TAB_CLASS},
${ROOT_SITE_DARK} #${POST_ACTIONS_HOST_ID} .${KIT_TAB_CLASS} {
  color: ${v.text};
}

${ROOT_SITE} #${POST_ACTIONS_HOST_ID} .${KIT_TAB_CLASS}[aria-selected="true"],
${ROOT_SITE_DARK} #${POST_ACTIONS_HOST_ID} .${KIT_TAB_CLASS}[aria-selected="true"] {
  border-bottom-color: ${v.accent};
  color: ${v.text};
}

/* Dark RuleDesk: primary fill uses light label (surface token is dark). */
${ROOT_THEME_DARK} #${POST_ACTIONS_HOST_ID} .${POST_PANEL_FAV_CLASS}.${KIT_BTN_PRIMARY_CLASS} {
  color: ${v.text};
}

/*
 * Own scrollable UI — tokens for all four themes (site/site-dark have no html.rdw-skin).
 * Fixes white post-column scrollbar on dark. Kit lists/dialogs + playlist menu.
 */
#${POST_ACTIONS_HOST_ID},
.${KIT_SELECT_LIST_CLASS},
.${KIT_AC_LIST_CLASS},
.${KIT_DIALOG_CLASS},
.${PLAYLIST_MENU_CLASS} {
  scrollbar-width: ${SCROLLBAR_WIDTH};
  scrollbar-color: ${v.border} ${v.surface};
}

/* Site autocomplete lists under rdw-skin */
${ROOT} .awesomplete > ul:not([hidden]):not(:empty),
${ROOT} div.auto_complete ul {
  scrollbar-width: ${SCROLLBAR_WIDTH};
  scrollbar-color: ${v.border} ${v.surface};
}

/*
 * Script page host sits on site bg for Site default / Site dark (no html.rdw-skin).
 * Color uses document tokens; Shadow title inherits from the host once tokens sync.
 */
#${RDW_PAGE_ROOT_ID} {
  color: ${v.text};
}
`.trim();
/** Returns the site-skin CSS string for injection. */
function getSiteSkinCss() {
	return SITE_SKIN_CSS;
}
var MS_PER_DAY$1 = 864e5;
var COOKIE_NAME_VALUE_SEPARATOR$1 = "=";
var STYLESHEET_REL = "stylesheet";
var LIGHT_STYLESHEET_PATH = `${SITE_THEME_STYLESHEET_DIR}${SITE_THEME_STYLESHEET_LIGHT}`;
var DARK_STYLESHEET_PATH = `${SITE_THEME_STYLESHEET_DIR}${SITE_THEME_STYLESHEET_DARK}`;
function writeThemeCookie(value, expires) {
	document.cookie = [
		`${SITE_THEME_COOKIE_NAME}${COOKIE_NAME_VALUE_SEPARATOR$1}${value}`,
		`expires=${expires.toUTCString()}`,
		`path=/`
	].join("; ");
}
/** Deletes the site `theme` cookie (light / default). */
function clearSiteThemeCookie() {
	document.cookie = [
		`${SITE_THEME_COOKIE_NAME}${COOKIE_NAME_VALUE_SEPARATOR$1}`,
		`expires=${(/* @__PURE__ */ new Date(0)).toUTCString()}`,
		`path=/`
	].join("; ");
}
/** Collapse `//` (and longer) runs in a pathname so `/css/...` comparisons work. */
var REPEATED_PATH_SLASHES = /\/{2,}/g;
function collapsePathSlashes(pathname) {
	return pathname.replace(REPEATED_PATH_SLASHES, "/");
}
/**
* Match site desktop CSS hrefs via URL pathname (query ignored).
* Production uses absolute hrefs with a doubled slash (`…xxx//css/desktop.css?46`);
* collapsing repeated path slashes makes that equal `/css/desktop.css`.
*/
function isSiteDesktopStylesheetHref(href) {
	try {
		const path = collapsePathSlashes(new URL(href, location.href).pathname);
		return path === LIGHT_STYLESHEET_PATH || path === DARK_STYLESHEET_PATH;
	} catch {
		return false;
	}
}
function stylesheetFilenameForTheme(theme) {
	return theme === "dark" ? SITE_THEME_STYLESHEET_DARK : SITE_THEME_STYLESHEET_LIGHT;
}
/** Swap filename in the raw href so `//css/` and `/css/` forms stay intact. */
function replaceStylesheetFilename(href, filename) {
	if (href.includes("desktop-dark.css")) return href.replace(SITE_THEME_STYLESHEET_DARK, filename);
	if (href.includes("desktop.css")) return href.replace(SITE_THEME_STYLESHEET_LIGHT, filename);
	return href;
}
function findSiteDesktopStylesheetLink() {
	const links = document.querySelectorAll(`link[rel="${STYLESHEET_REL}"]`);
	for (const link of links) {
		const href = link.getAttribute("href");
		if (href === null || href.length === 0) continue;
		if (isSiteDesktopStylesheetHref(href)) return link;
	}
	return null;
}
var WARN_STYLESHEET_MISSING = "Site desktop stylesheet link not found; theme cookie updated only";
var READY_STATE_LOADING = "loading";
var EVENT_DOM_CONTENT_LOADED = "DOMContentLoaded";
var STYLESHEET_OBSERVER_OPTIONS = {
	childList: true,
	subtree: true
};
var pendingStylesheetTheme = null;
var stylesheetObserver = null;
var domContentLoadedBound = false;
function swapStylesheetLink(link, theme) {
	const href = link.getAttribute("href");
	if (href === null || href.length === 0) return false;
	link.setAttribute("href", replaceStylesheetFilename(href, stylesheetFilenameForTheme(theme)));
	return true;
}
function disconnectStylesheetWatch() {
	if (stylesheetObserver !== null) {
		stylesheetObserver.disconnect();
		stylesheetObserver = null;
	}
	if (domContentLoadedBound) {
		document.removeEventListener(EVENT_DOM_CONTENT_LOADED, onStylesheetDomReady);
		domContentLoadedBound = false;
	}
}
function tryApplyPendingStylesheet() {
	if (pendingStylesheetTheme === null) return false;
	const link = findSiteDesktopStylesheetLink();
	if (link === null) return false;
	if (!swapStylesheetLink(link, pendingStylesheetTheme)) return false;
	pendingStylesheetTheme = null;
	disconnectStylesheetWatch();
	return true;
}
function onStylesheetDomReady() {
	domContentLoadedBound = false;
	if (tryApplyPendingStylesheet()) return;
	if (pendingStylesheetTheme !== null) {
		log.warn(WARN_STYLESHEET_MISSING);
		pendingStylesheetTheme = null;
		disconnectStylesheetWatch();
	}
}
function warnStylesheetMissing() {
	log.warn(WARN_STYLESHEET_MISSING);
	pendingStylesheetTheme = null;
	disconnectStylesheetWatch();
}
/**
* Swap desktop.css ↔ desktop-dark.css once the link exists.
* At document-start the link is not parsed yet: watch documentElement and
* fall back to DOMContentLoaded. Warn only if it is still missing after that.
*/
function scheduleSiteDesktopStylesheet(theme) {
	const link = findSiteDesktopStylesheetLink();
	if (link !== null && swapStylesheetLink(link, theme)) {
		pendingStylesheetTheme = null;
		disconnectStylesheetWatch();
		return;
	}
	pendingStylesheetTheme = theme;
	if (document.readyState !== READY_STATE_LOADING) {
		warnStylesheetMissing();
		return;
	}
	const root = document.documentElement;
	if (stylesheetObserver === null && root !== null) {
		stylesheetObserver = new MutationObserver(() => {
			tryApplyPendingStylesheet();
		});
		stylesheetObserver.observe(root, STYLESHEET_OBSERVER_OPTIONS);
	}
	if (!domContentLoadedBound) {
		document.addEventListener(EVENT_DOM_CONTENT_LOADED, onStylesheetDomReady);
		domContentLoadedBound = true;
	}
}
/** Cookie only. Stylesheet swap is {@link scheduleSiteDesktopStylesheet}. */
function writeSiteThemeCookie(theme) {
	if (theme === "dark") {
		const expires = new Date(Date.now() + 365 * MS_PER_DAY$1);
		writeThemeCookie(SITE_THEME_COOKIE_VALUE_DARK, expires);
		return;
	}
	clearSiteThemeCookie();
}
/**
* RuleDesk skin modes need a predictable site base: no theme cookie + light CSS.
* Does not touch html.rdw-skin (that is owned by src/skin/theme.ts).
*/
function forceLightSiteBase() {
	writeSiteThemeCookie("light");
	scheduleSiteDesktopStylesheet("light");
}
function setSiteTheme(theme) {
	writeSiteThemeCookie(theme);
	scheduleSiteDesktopStylesheet(theme);
}
var BACKGROUND_DIM_MAX = .8;
/** JPEG quality when downscaling a custom background to screen size. */
var APPEARANCE_BACKGROUND_JPEG_QUALITY = .85;
var CONTRAST_OFFSET = .05;
var JPEG_MIME = "image/jpeg";
var BODY_BG_IMAGE = "background-image";
var BODY_BG_SIZE = "background-size";
var BODY_BG_POSITION = "background-position";
var BODY_BG_REPEAT = "background-repeat";
var BODY_BG_ATTACHMENT = "background-attachment";
/** Site light tag/link colors (not exported from tokens). */
var SITE_C_LINK_ARTIST = "#cc0000";
var SITE_C_LINK_CHARACTER = "#00aa00";
var SITE_C_LINK_COPYRIGHT = "#aa00aa";
var SITE_C_LINK_METADATA = "#ff8800";
/** Site dark accent-soft / tag colors (not exported from tokens). */
var SITE_DARK_ACCENT_SOFT = SITE_DARK_C_BORDER;
var SITE_DARK_TAG_ARTIST = "#f0a0a0";
var SITE_DARK_TAG_CHARACTER = "#f0f0a0";
var SITE_DARK_TAG_COPYRIGHT = "#f0a0f0";
var SITE_DARK_TAG_METADATA = "#90d9ed";
/**
* Script-page / token palette for Appearance theme "Site default".
* Card surface = --c-bg; border = --c-bg-alt (aligned with page-css host cards).
* Danger/radius/shadow/font from Light.
*/
var SITE_DEFAULT_PALETTE = {
	bg: SITE_LIGHT_C_BG,
	surface: SITE_LIGHT_C_BG,
	surface2: SITE_LIGHT_C_BG_OVERLAY,
	border: SITE_LIGHT_C_BG_ALT,
	text: SITE_LIGHT_C_TEXT,
	muted: SITE_LIGHT_C_TEXT_SOFT,
	accent: SITE_LIGHT_C_LINK,
	accentSoft: SITE_LIGHT_C_BG_ALT,
	danger: LIGHT_PALETTE.danger,
	dangerSoft: LIGHT_PALETTE.dangerSoft,
	tagArtist: SITE_C_LINK_ARTIST,
	tagCharacter: SITE_C_LINK_CHARACTER,
	tagCopyright: SITE_C_LINK_COPYRIGHT,
	tagMetadata: SITE_C_LINK_METADATA,
	radiusS: LIGHT_PALETTE.radiusS,
	radiusM: LIGHT_PALETTE.radiusM,
	radiusL: LIGHT_PALETTE.radiusL,
	shadow1: LIGHT_PALETTE.shadow1,
	shadow2: LIGHT_PALETTE.shadow2,
	font: LIGHT_PALETTE.font
};
/**
* Script-page / token palette for Appearance theme "Site dark".
* Surface = page bg (not darker chrome); danger/radius/shadow/font from Dark.
*/
var SITE_DARK_PALETTE = {
	bg: SITE_DARK_C_BG,
	surface: SITE_DARK_C_BG,
	surface2: SITE_DARK_C_SURFACE2,
	border: SITE_DARK_C_BORDER,
	text: SITE_DARK_C_TEXT,
	muted: SITE_DARK_C_MUTED,
	accent: SITE_DARK_C_ACCENT,
	accentSoft: SITE_DARK_ACCENT_SOFT,
	danger: DARK_PALETTE.danger,
	dangerSoft: DARK_PALETTE.dangerSoft,
	tagArtist: SITE_DARK_TAG_ARTIST,
	tagCharacter: SITE_DARK_TAG_CHARACTER,
	tagCopyright: SITE_DARK_TAG_COPYRIGHT,
	tagMetadata: SITE_DARK_TAG_METADATA,
	radiusS: DARK_PALETTE.radiusS,
	radiusM: DARK_PALETTE.radiusM,
	radiusL: DARK_PALETTE.radiusL,
	shadow1: DARK_PALETTE.shadow1,
	shadow2: DARK_PALETTE.shadow2,
	font: DARK_PALETTE.font
};
/**
* Pick text color for a surface: prefer `preferred`, else the first
* neighboring candidate that meets {@link CONTRAST_RATIO_MIN}.
*/
function pickContrastingText(surface, preferred, neighbors) {
	const preferredRatio = contrastRatio(preferred, surface);
	if (preferredRatio !== null && preferredRatio >= 4.5) return {
		text: preferred,
		ratio: preferredRatio,
		swapped: false
	};
	for (const candidate of neighbors) {
		const ratio = contrastRatio(candidate, surface);
		if (ratio !== null && ratio >= 4.5) return {
			text: candidate,
			ratio,
			swapped: true
		};
	}
	return {
		text: preferred,
		ratio: preferredRatio,
		swapped: false
	};
}
function finalizeSitePaletteText(palette) {
	const picked = pickContrastingText(palette.surface, palette.text, [
		palette.bg,
		palette.muted,
		palette.accent,
		LIGHT_PALETTE.text,
		DARK_PALETTE.text
	]);
	if (!picked.swapped) return palette;
	return {
		...palette,
		text: picked.text
	};
}
/** Site default after contrast gate (text-on-surface). */
var SITE_DEFAULT_PALETTE_RESOLVED = finalizeSitePaletteText(SITE_DEFAULT_PALETTE);
/** Site dark after contrast gate (text-on-surface). */
var SITE_DARK_PALETTE_RESOLVED = finalizeSitePaletteText(SITE_DARK_PALETTE);
function createDefaultCustomTheme() {
	return {
		base: APPEARANCE_CUSTOM_BASE_LIGHT,
		backgroundDim: 0
	};
}
function clampBackgroundDim(value) {
	if (!Number.isFinite(value)) return 0;
	return Math.min(BACKGROUND_DIM_MAX, Math.max(0, value));
}
/** WCAG contrast ratio of two hex colors; null if either is unparseable. */
function contrastRatio(foreground, background) {
	const l1 = relativeLuminance(foreground);
	const l2 = relativeLuminance(background);
	if (l1 === null || l2 === null) return null;
	const lighter = Math.max(l1, l2);
	const darker = Math.min(l1, l2);
	return (lighter + CONTRAST_OFFSET) / (darker + CONTRAST_OFFSET);
}
/**
* Canonical token palette for an Appearance value.
* Site themes use site chrome colors — not RuleDesk Light/Dark.
* Callers (boot/host) should use this instead of light/dark-only resolvers.
*/
function resolveAppearancePalette(appearance) {
	const theme = appearance.theme;
	if (theme === "site-dark") return SITE_DARK_PALETTE_RESOLVED;
	if (theme === "site") return SITE_DEFAULT_PALETTE_RESOLVED;
	if (theme === "dark") return DARK_PALETTE;
	if (theme === "custom") return appearance.custom?.base === "dark" ? DARK_PALETTE : LIGHT_PALETTE;
	return LIGHT_PALETTE;
}
function escapeUrlForCss(url) {
	return url.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
}
function clearBodyBackground() {
	const body = document.body;
	if (body === null) return;
	body.style.removeProperty(BODY_BG_IMAGE);
	body.style.removeProperty(BODY_BG_SIZE);
	body.style.removeProperty(BODY_BG_POSITION);
	body.style.removeProperty(BODY_BG_REPEAT);
	body.style.removeProperty(BODY_BG_ATTACHMENT);
}
/**
* Apply custom background image on <body> with a dim overlay (0–0.8).
* Cleared when image is empty.
*/
function applyBodyBackgroundImage(imageUrl, dim) {
	const body = document.body;
	if (body === null) return;
	if (imageUrl === void 0 || imageUrl.length === 0) {
		clearBodyBackground();
		return;
	}
	const clamped = clampBackgroundDim(dim);
	const escaped = escapeUrlForCss(imageUrl);
	body.style.setProperty(BODY_BG_IMAGE, `linear-gradient(rgba(0, 0, 0, ${String(clamped)}), rgba(0, 0, 0, ${String(clamped)})), url("${escaped}")`);
	body.style.setProperty(BODY_BG_SIZE, "cover");
	body.style.setProperty(BODY_BG_POSITION, "center");
	body.style.setProperty(BODY_BG_REPEAT, "no-repeat");
	body.style.setProperty(BODY_BG_ATTACHMENT, "fixed");
}
function syncSiteCookieAndStylesheet(appearance) {
	if (appearance.theme === "site-dark") {
		setSiteTheme("dark");
		return;
	}
	if (appearance.theme === "site") {
		setSiteTheme("light");
		return;
	}
	forceLightSiteBase();
}
/** CSS pixel screen size × devicePixelRatio (for background hints/resize). */
function getScreenPixelSize() {
	const dpr = Number.isFinite(window.devicePixelRatio) && window.devicePixelRatio > 0 ? window.devicePixelRatio : 1;
	return {
		width: Math.round(window.screen.width * dpr),
		height: Math.round(window.screen.height * dpr)
	};
}
/**
* Fit source inside max box without upscaling. Pure sizing helper (testable).
*/
function computeDownscaleSize(sourceWidth, sourceHeight, maxWidth, maxHeight) {
	if (!Number.isFinite(sourceWidth) || !Number.isFinite(sourceHeight) || sourceWidth <= 0 || sourceHeight <= 0) return {
		width: 0,
		height: 0
	};
	if (sourceWidth <= maxWidth && sourceHeight <= maxHeight) return {
		width: Math.round(sourceWidth),
		height: Math.round(sourceHeight)
	};
	const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
	return {
		width: Math.max(1, Math.round(sourceWidth * scale)),
		height: Math.max(1, Math.round(sourceHeight * scale))
	};
}
function loadImageElement(src) {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.onload = () => {
			resolve(image);
		};
		image.onerror = () => {
			reject(/* @__PURE__ */ new Error("Could not decode image"));
		};
		image.src = src;
	});
}
function readFileAsDataUrl(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result === "string") {
				resolve(reader.result);
				return;
			}
			reject(/* @__PURE__ */ new Error("Could not read image file"));
		};
		reader.onerror = () => {
			reject(reader.error ?? /* @__PURE__ */ new Error("Could not read image file"));
		};
		reader.readAsDataURL(file);
	});
}
/**
* Decode file, downscale to screen pixels (never upscale), encode JPEG.
*/
async function prepareBackgroundImageFile(file) {
	const image = await loadImageElement(await readFileAsDataUrl(file));
	const sourceWidth = image.naturalWidth;
	const sourceHeight = image.naturalHeight;
	const screen = getScreenPixelSize();
	const sized = computeDownscaleSize(sourceWidth, sourceHeight, screen.width, screen.height);
	const canvas = document.createElement("canvas");
	canvas.width = sized.width;
	canvas.height = sized.height;
	const context = canvas.getContext("2d");
	if (context === null) throw new Error("Could not prepare background image");
	context.drawImage(image, 0, 0, sized.width, sized.height);
	return {
		dataUrl: canvas.toDataURL(JPEG_MIME, APPEARANCE_BACKGROUND_JPEG_QUALITY),
		sourceWidth,
		sourceHeight,
		outputWidth: sized.width,
		outputHeight: sized.height,
		belowScreen: sourceWidth < screen.width || sourceHeight < screen.height
	};
}
/**
* Full theme apply for boot and settings UI:
* site cookie/stylesheet + html.rdw-skin / tokens / site-skin / custom props + body image.
* Token palette comes from {@link resolveAppearancePalette} and is written once via
* injectTokenStyles + syncPageRootTokens (same tick as applyAppearanceToDocument).
*/
function applyAppearanceTheme(options) {
	const { appearance } = options;
	syncSiteCookieAndStylesheet(appearance);
	applyAppearanceToDocument({
		appearance,
		siteSkinCss: options.siteSkinCss ?? getSiteSkinCss(),
		...options.backgroundDataUrl !== void 0 ? { backgroundDataUrl: options.backgroundDataUrl } : {}
	});
	const palette = resolveAppearancePalette(appearance);
	injectTokenStyles(palette);
	syncPageRootTokens(palette);
	if (!themeEnablesSkin(appearance.theme)) document.documentElement.classList.remove(RDW_SKIN_CLASS);
	if (appearance.theme === "custom" && appearance.custom !== void 0) {
		const custom = appearance.custom;
		applyBodyBackgroundImage(options.backgroundDataUrl ?? custom.backgroundImage, custom.backgroundDim ?? 0);
		if (custom.backgroundDim !== void 0) document.documentElement.style.setProperty(TOKEN_VAR.backgroundDim, String(clampBackgroundDim(custom.backgroundDim)));
	} else clearBodyBackground();
	const textOnSurface = contrastRatio(palette.text, palette.surface);
	return {
		contrastWarning: textOnSurface !== null && textOnSurface < 4.5,
		contrastRatio: textOnSurface
	};
}
/**
* Whether RuleDesk site-skin class is active.
* site / site-dark keep native page chrome; light / dark / custom enable rdw-skin.
*/
function themeEnablesSkin(theme) {
	return theme === "light" || theme === "dark" || theme === "custom";
}
/**
* Ensures a <style id=...> exists under documentElement (works before <head>).
* Safe at document-start. B1/B2 should reuse these helpers.
*/
function ensureStyleElement(id) {
	const existing = document.getElementById(id);
	if (existing instanceof HTMLStyleElement) return existing;
	if (existing !== null) existing.remove();
	const style = document.createElement("style");
	style.id = id;
	(document.head ?? document.documentElement).append(style);
	return style;
}
/** Inject or replace the design-token stylesheet. */
function injectTokenStyles(palette) {
	const style = ensureStyleElement(TOKEN_STYLE_ID);
	style.textContent = buildTokensCss(palette, ":root");
	return style;
}
/**
* Copy the same palette onto #rdw-page-root when present.
* Shadow DOM uses :host { all: initial }, so document :root tokens do not inherit.
*/
function syncPageRootTokens(palette) {
	const host = document.getElementById(RDW_PAGE_ROOT_ID);
	if (!(host instanceof HTMLElement)) return;
	applyTokenProperties(host, palette);
}
/**
* Inject or replace the site-skin stylesheet (rules scoped under html.rdw-skin).
*/
function injectSiteSkinHook(cssText = "") {
	const style = ensureStyleElement(SITE_SKIN_STYLE_ID);
	style.textContent = cssText;
	return style;
}
function applyHtmlThemeAttributes(theme) {
	const root = document.documentElement;
	root.setAttribute(RDW_THEME_ATTR, theme);
	if (themeEnablesSkin(theme)) root.classList.add(RDW_SKIN_CLASS);
	else root.classList.remove(RDW_SKIN_CLASS);
}
/**
* Document-start-safe appearance apply:
* html class/attr + token CSS (+ site-skin) + optional custom props.
* Palette from {@link resolveAppearancePalette} (site ≠ Light/Dark).
* Also syncs live #rdw-page-root Shadow host to the same palette.
*/
function applyAppearanceToDocument(options) {
	const { appearance } = options;
	applyHtmlThemeAttributes(appearance.theme);
	const palette = resolveAppearancePalette(appearance);
	injectTokenStyles(palette);
	syncPageRootTokens(palette);
	injectSiteSkinHook(options.siteSkinCss ?? "");
	const root = document.documentElement;
	clearCustomThemeProperties(root);
	const omitImage = options.omitBackgroundImage === true;
	const backgroundImage = omitImage ? void 0 : options.backgroundDataUrl ?? appearance.custom?.backgroundImage;
	if (appearance.theme === "custom" && appearance.custom !== void 0) {
		const overrides = backgroundImage !== void 0 && backgroundImage.length > 0 ? {
			backgroundImage,
			...appearance.custom.backgroundDim !== void 0 ? { backgroundDim: appearance.custom.backgroundDim } : {}
		} : { ...appearance.custom.backgroundDim !== void 0 ? { backgroundDim: appearance.custom.backgroundDim } : {} };
		applyCustomThemeProperties(root, overrides);
	} else if (!omitImage && options.backgroundDataUrl !== void 0 && options.backgroundDataUrl.length > 0) applyCustomThemeProperties(root, { backgroundImage: options.backgroundDataUrl });
}
/**
* Pre-paint appearance read: one GM_getValue + shape checks only (no zod).
* Full AppearanceSchema validation stays on the post-paint store path.
*/
var CUSTOM_BASE_LIGHT = "light";
var CUSTOM_BASE_DARK = "dark";
/** Cached raw STORAGE_KEY payload from the single pre-paint GM read. */
var rawStorageCache;
var rawStorageRead = false;
function isRecord(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}
function getGmGetValue() {
	return GM_getValue;
}
/**
* Single GM read for the pre-paint path. Subsequent calls reuse the cache
* so layout peek does not hit GM again before first paint.
*/
function readRawStorageOnce() {
	if (!rawStorageRead) {
		rawStorageCache = getGmGetValue()(STORAGE_KEY, void 0);
		rawStorageRead = true;
	}
	return rawStorageCache;
}
function cheapParseTheme(value) {
	if (value === "site") return APPEARANCE_THEME_SITE;
	if (value === "site-dark") return APPEARANCE_THEME_SITE_DARK;
	if (value === "light") return APPEARANCE_THEME_LIGHT;
	if (value === "dark") return APPEARANCE_THEME_DARK;
	if (value === "custom") return APPEARANCE_THEME_CUSTOM;
	return DEFAULT_APPEARANCE_THEME;
}
function cheapParseCustom(raw) {
	if (!isRecord(raw)) return;
	const baseRaw = raw.base;
	const custom = { base: baseRaw === CUSTOM_BASE_DARK || baseRaw === CUSTOM_BASE_LIGHT ? baseRaw : CUSTOM_BASE_LIGHT };
	if (typeof raw.backgroundImage === "string") custom.backgroundImage = raw.backgroundImage;
	if (typeof raw.backgroundDim === "number" && Number.isFinite(raw.backgroundDim)) custom.backgroundDim = raw.backgroundDim;
	return custom;
}
/**
* Cheap appearance extract from a raw GM storage blob (or undefined).
* Does not validate marks / collections / artists / favs.
*/
function cheapParseAppearance(raw) {
	if (!isRecord(raw)) return { theme: DEFAULT_APPEARANCE_THEME };
	const settings = raw.settings;
	if (!isRecord(settings)) return { theme: DEFAULT_APPEARANCE_THEME };
	const appearanceRaw = settings.appearance;
	if (!isRecord(appearanceRaw)) return { theme: DEFAULT_APPEARANCE_THEME };
	const theme = cheapParseTheme(appearanceRaw.theme);
	if (theme !== "custom") return { theme };
	const custom = cheapParseCustom(appearanceRaw.custom);
	if (custom === void 0) return { theme };
	return {
		theme,
		custom
	};
}
/** Pre-paint appearance: one GM read + cheap shape check. */
function peekAppearanceForPaint() {
	return cheapParseAppearance(readRawStorageOnce());
}
/**
* Cheap layout flags from the same cached GM blob (no second GM read, no zod).
* Used after CSS injection for grid-density / menu-cleanup / search reserve.
*/
function peekLayoutSettings() {
	const raw = readRawStorageOnce();
	if (!isRecord(raw) || !isRecord(raw.settings)) return {
		tweaksEnabled: true,
		features: {},
		featureChoice: {}
	};
	const settings = raw.settings;
	const tweaksEnabled = typeof settings.tweaksEnabled === "boolean" ? settings.tweaksEnabled : true;
	const features = {};
	if (isRecord(settings.features)) {
		for (const [key, value] of Object.entries(settings.features)) if (typeof value === "boolean") features[key] = value;
	}
	const featureChoice = {};
	if (isRecord(settings.featureChoice)) {
		for (const [key, value] of Object.entries(settings.featureChoice)) if (typeof value === "string") featureChoice[key] = value;
	}
	return {
		tweaksEnabled,
		features,
		featureChoice
	};
}
function resolveFeatureEnabled(layout, id, defaultEnabled) {
	if (!layout.tweaksEnabled) return false;
	const stored = layout.features[id];
	if (stored === void 0) return defaultEnabled;
	return stored;
}
function resolveFeatureChoice(layout, id, defaultValue, allowed) {
	const stored = layout.featureChoice[id];
	if (stored !== void 0 && allowed.includes(stored)) return stored;
	return defaultValue;
}
/**
* Pre-CSS operations on document-start (must stay minimal — A1 counts these):
* 1. GM_getValue(STORAGE_KEY) via {@link peekAppearanceForPaint}
* 2. cheap shape parse of settings.appearance (no zod)
* Then immediately inject theme + skin CSS (base color only, no background image).
*/
function syncSiteCookieAfterCss(appearance) {
	const theme = appearance.theme === "site-dark" ? "dark" : "light";
	writeSiteThemeCookie(theme);
	scheduleSiteDesktopStylesheet(theme);
}
/**
* If the URL already has #rdw/…, stamp html.rdw-own-page after CSS inject.
* Kept here (not in pages/router) so document-start does not import Preact host.
*/
function applyOwnPageClassEarly() {
	if (parseRdwHash(window.location.hash) === null) return;
	const root = document.documentElement;
	if (root === null) return;
	const style = ensureStyleElement(RDW_OWN_PAGE_STYLE_ID);
	style.textContent = buildOwnPageCss();
	root.classList.add(RDW_OWN_PAGE_CLASS);
}
/**
* Runs at userscript document-start, before DOMContentLoaded.
* Hot path: cheap appearance GM read → inject token + site-skin CSS (no bg image).
* Cookie sync / rdw-own-page run only after styles are in the DOM.
*/
function bootEarly() {
	const appearance = peekAppearanceForPaint();
	applyAppearanceToDocument({
		appearance,
		siteSkinCss: getSiteSkinCss(),
		omitBackgroundImage: true
	});
	syncSiteCookieAfterCss(appearance);
	applyOwnPageClassEarly();
}
var THUMB_CLASS = "rdw-thumb";
var THUMB_ANCHOR_NAME = "--rdw-img";
var FEATURE_STYLE_ID_PREFIX = "rdw-feature-style-";
var POST_ACTIONS_ID = "rdw-post-actions";
function featureBodyClass(id) {
	return `rdw-f-${id}`;
}
function featureChoiceBodyClass(id, value) {
	return `rdw-f-${id}-${value}`;
}
var FEATURE_ID$12 = "grid-density";
var COMPACT_PX = 150;
var LARGE_PX = 250;
var CHOICE_DEFAULT = "default";
var CHOICE_COMPACT = "compact";
var CHOICE_LARGE = "large";
function sizeCss(choiceValue, px) {
	const bodyClass = featureChoiceBodyClass(FEATURE_ID$12, choiceValue);
	return [
		`body.${bodyClass} span.thumb,`,
		`body.${bodyClass} span.thumb > a {`,
		`  width: ${String(px)}px !important;`,
		`  height: ${String(px)}px !important;`,
		`}`,
		`body.${bodyClass} img.preview {`,
		`  max-width: ${String(px)}px !important;`,
		`  max-height: ${String(px)}px !important;`,
		`}`
	].join("\n");
}
/** Same gap on both axes for Default, Compact, and Large. Does not set cell size. */
function gapCss() {
	return [
		`body.${featureBodyClass(FEATURE_ID$12)} div.image-list {`,
		`  column-gap: ${String(4)}px !important;`,
		`  row-gap: ${String(4)}px !important;`,
		`}`
	].join("\n");
}
var gridDensityFeature = exports("bk",{
	id: FEATURE_ID$12,
	label: "Grid size",
	pages: ["list", "favorites"],
	defaultEnabled: true,
	cssOnly: true,
	choice: {
		options: [
			{
				value: CHOICE_DEFAULT,
				label: "Default"
			},
			{
				value: CHOICE_COMPACT,
				label: "Compact (150)"
			},
			{
				value: CHOICE_LARGE,
				label: "Large (250)"
			}
		],
		defaultValue: CHOICE_DEFAULT
	},
	css: [
		sizeCss(CHOICE_COMPACT, COMPACT_PX),
		sizeCss(CHOICE_LARGE, LARGE_PX),
		gapCss()
	].join("\n"),
	mount: () => void 0
});
var FEATURE_ID$11 = "menu-cleanup";
var FEATURE_LABEL$11 = "Clean header menu";
var CONTENT_ID$1 = "content";
var HIDDEN_CLASS = "rdw-menu-hidden";
var BODY_FEATURE_CLASS$3 = featureBodyClass(FEATURE_ID$11);
var MISSING_MENU_WARN = "Header menu not found";
var HIDE_LINK_TEXT_SET = /* @__PURE__ */ new Set([
	"iCame Top 100",
	"Discord",
	"X",
	"Other Sites",
	"Contact Us",
	"DMCA",
	"About",
	"TOS",
	"My Favorites"
]);
var FEATURE_PAGES$11 = [
	"list",
	"post",
	"favorites",
	"other"
];
var FEATURE_CSS$11 = `body.${BODY_FEATURE_CLASS$3} li.${HIDDEN_CLASS} { display:none !important; }`;
function isHeaderMenuLink(anchor, content) {
	const listItem = anchor.closest("li");
	if (listItem === null) return false;
	if (content !== null && content.contains(listItem)) return false;
	return true;
}
function collectHeaderMenuLinks() {
	const content = document.getElementById(CONTENT_ID$1);
	const anchors = document.querySelectorAll("a");
	const headerLinks = [];
	for (const node of anchors) {
		if (!(node instanceof HTMLAnchorElement)) continue;
		if (!isHeaderMenuLink(node, content)) continue;
		headerLinks.push(node);
	}
	return headerLinks;
}
function mountMenuCleanup(_ctx) {
	const headerLinks = collectHeaderMenuLinks();
	if (headerLinks.length === 0) {
		log.warn(MISSING_MENU_WARN);
		return;
	}
	for (const anchor of headerLinks) {
		const text = anchor.textContent?.trim() ?? "";
		if (!HIDE_LINK_TEXT_SET.has(text)) continue;
		const listItem = anchor.closest("li");
		if (listItem === null) continue;
		listItem.classList.add(HIDDEN_CLASS);
	}
}
var menuCleanupFeature = {
	id: FEATURE_ID$11,
	label: FEATURE_LABEL$11,
	pages: [...FEATURE_PAGES$11],
	defaultEnabled: true,
	cssOnly: true,
	css: FEATURE_CSS$11,
	mount: mountMenuCleanup
};
function detectPageKind(search) {
	const params = new URLSearchParams(search);
	const page = params.get(SEARCH_PARAM_PAGE);
	const section = params.get("s");
	if (page === "post" && section === "list") return "list";
	if (page === "post" && section === "view") return "post";
	if (page === "favorites" && section === "view") return "favorites";
	return "other";
}
function readPostIdFromSearch(search) {
	const params = new URLSearchParams(search);
	const page = params.get(SEARCH_PARAM_PAGE);
	const section = params.get("s");
	const id = params.get("id");
	if (page !== "post" || section !== "view") return null;
	if (id === null || id.trim().length === 0) return null;
	if (!/^\d+$/.test(id)) return null;
	return id;
}
var COOKIE_PAIR_SEPARATOR = ";";
var COOKIE_NAME_VALUE_SEPARATOR = "=";
var BLACKLIST_SPLIT_PATTERN = /[, ]|%20+/g;
var USER_ENTRY_PREFIX = "user:";
var RATING_ENTRY_PREFIX = "rating:";
var MS_PER_DAY = 864e5;
var DAYS_PER_YEAR = 365;
var BLACKLIST_TAG_SEPARATOR = " ";
var changeListeners = /* @__PURE__ */ new Set();
/** Subscribe to writes of the site `tag_blacklist` cookie. */
function onSiteBlacklistChange(cb) {
	changeListeners.add(cb);
	return () => {
		changeListeners.delete(cb);
	};
}
function readCookieValue(name) {
	const pairs = document.cookie.split(COOKIE_PAIR_SEPARATOR);
	const prefix = `${name}${COOKIE_NAME_VALUE_SEPARATOR}`;
	for (const pair of pairs) {
		const trimmed = pair.trim();
		if (!trimmed.startsWith(prefix)) continue;
		return trimmed.slice(prefix.length);
	}
	return null;
}
function normalizeBlacklistTags(tags) {
	const seen = /* @__PURE__ */ new Set();
	const result = [];
	for (const raw of tags) {
		const normalized = raw.trim().toLowerCase().replaceAll(" ", "_");
		if (normalized.length === 0 || seen.has(normalized)) continue;
		seen.add(normalized);
		result.push(normalized);
	}
	return result;
}
function encodeBlacklistCookieValue(tags) {
	if (tags.length === 0) return "";
	return encodeURIComponent(encodeURIComponent(tags.join(BLACKLIST_TAG_SEPARATOR)));
}
function writeBlacklistCookie(value, expires) {
	document.cookie = [
		`${SITE_BLACKLIST_COOKIE_NAME}${COOKIE_NAME_VALUE_SEPARATOR}${value}`,
		`expires=${expires.toUTCString()}`,
		`path=/`
	].join("; ");
}
/**
* Reads the site `tag_blacklist` cookie using the site's decode + split rule.
* Empty tokens are dropped; entries are lowercased.
*/
function readSiteBlacklist() {
	const raw = readCookieValue(SITE_BLACKLIST_COOKIE_NAME);
	if (raw === null || raw.length === 0) return [];
	let decoded;
	try {
		decoded = decodeURIComponent(decodeURI(raw));
	} catch {
		return [];
	}
	const result = [];
	for (const part of decoded.split(BLACKLIST_SPLIT_PATTERN)) {
		const trimmed = part.trim().toLowerCase();
		if (trimmed.length === 0) continue;
		result.push(trimmed);
	}
	return result;
}
/**
* Writes the site `tag_blacklist` cookie (browser cookie only; account list untouched).
* Value encoding matches the live site: encodeURIComponent twice over space-joined tags.
*/
function writeSiteBlacklist(tags) {
	const normalized = normalizeBlacklistTags(tags);
	const expires = new Date(Date.now() + 5 * DAYS_PER_YEAR * MS_PER_DAY);
	writeBlacklistCookie(encodeBlacklistCookieValue(normalized), expires);
	for (const listener of changeListeners) listener(normalized);
}
/**
* True when any blacklist entry matches a post tag or `rating:x`.
* Entries starting with `user:` are ignored. `score` is reserved for callers.
*/
function isBlacklisted(tags, score, rating, list) {
	if (list.length === 0) return false;
	const tagSet = /* @__PURE__ */ new Set();
	for (const tag of tags) {
		const normalized = tag.trim().toLowerCase();
		if (normalized.length > 0) tagSet.add(normalized);
	}
	const ratingNorm = rating.trim().toLowerCase();
	for (const entry of list) {
		if (entry.startsWith(USER_ENTRY_PREFIX)) continue;
		if (entry.startsWith(RATING_ENTRY_PREFIX)) {
			const value = entry.slice(7);
			if (value.length > 0 && value === ratingNorm) return true;
			continue;
		}
		if (tagSet.has(entry)) return true;
	}
	return false;
}
var FEATURE_ID$10 = "blacklist-hide";
var FEATURE_LABEL$10 = "Hide blacklisted posts";
var FEATURE_PAGES$10 = ["list"];
var BODY_FEATURE_CLASS$2 = featureBodyClass(FEATURE_ID$10);
var CLASS_BLACKLISTED$1 = "rdw-blacklisted";
var SCORE_TOKEN_PREFIX$2 = "score:";
var RATING_TOKEN_PREFIX$1 = "rating:";
var WHITESPACE_SPLIT = /\s+/;
var FEATURE_CSS$10 = `
body.${BODY_FEATURE_CLASS$2} span.thumb.${CLASS_BLACKLISTED$1} {
  display: none !important;
}
`.trim();
var unsubscribeThumbsAdded$5;
var unsubscribeBlacklistChange;
function parseAltTags(alt) {
	const tags = [];
	for (const token of alt.trim().split(WHITESPACE_SPLIT)) {
		if (token.length === 0) continue;
		const lower = token.toLowerCase();
		if (lower.startsWith(SCORE_TOKEN_PREFIX$2) || lower.startsWith(RATING_TOKEN_PREFIX$1)) continue;
		tags.push(token);
	}
	return tags;
}
function parseTitleRating(title) {
	for (const token of title.trim().split(WHITESPACE_SPLIT)) {
		if (token.length === 0) continue;
		if (token.toLowerCase().startsWith(RATING_TOKEN_PREFIX$1)) return token.slice(7);
	}
	return "";
}
function applyBlacklistToThumb(thumb, list) {
	if (!(thumb instanceof HTMLElement)) return;
	const img = thumb.querySelector(SITE_SELECTORS.previewImage);
	const alt = img?.getAttribute("alt") ?? "";
	const title = img?.getAttribute("title") ?? "";
	const matched = isBlacklisted(parseAltTags(alt), 0, parseTitleRating(title), list);
	thumb.classList.toggle(CLASS_BLACKLISTED$1, matched);
}
function applyBlacklistToRoot(root, list = readSiteBlacklist()) {
	const thumbs = root.querySelectorAll(SITE_SELECTORS.thumb);
	for (const thumb of thumbs) applyBlacklistToThumb(thumb, list);
}
function ensureSubscriptions() {
	if (unsubscribeThumbsAdded$5 === void 0) unsubscribeThumbsAdded$5 = onThumbsAdded((root) => {
		applyBlacklistToRoot(root);
	});
	if (unsubscribeBlacklistChange === void 0) unsubscribeBlacklistChange = onSiteBlacklistChange((list) => {
		applyBlacklistToRoot(document, list);
	});
}
function mountBlacklistHide(ctx) {
	if (ctx.pageKind !== "list") return;
	applyBlacklistToRoot(document);
	ensureSubscriptions();
}
var blacklistHideFeature = {
	id: FEATURE_ID$10,
	label: FEATURE_LABEL$10,
	pages: [...FEATURE_PAGES$10],
	defaultEnabled: true,
	cssOnly: true,
	css: FEATURE_CSS$10,
	mount: mountBlacklistHide
};
function buildAddFavUrl(postId) {
	const params = new URLSearchParams();
	params.set("id", postId);
	return `${SITE_ORIGIN}${ADDFAV_PATH}?${params.toString()}`;
}
function buildVoteUrl(postId) {
	const params = new URLSearchParams();
	params.set(VOTE_PARAM_PAGE, VOTE_PAGE);
	params.set("s", VOTE_SECTION);
	params.set("id", postId);
	params.set(VOTE_PARAM_TYPE, "up");
	return `${SITE_ORIGIN}${VOTE_PATH}?${params.toString()}`;
}
/** Favorites delete URL used by single-remove and bulk-remove (same request kind). */
function buildRemoveFavUrl(postId) {
	const params = new URLSearchParams();
	params.set(SEARCH_PARAM_PAGE, FAVORITES_PAGE);
	params.set("s", FAVORITES_SECTION_DELETE);
	params.set("id", postId);
	params.set(FAVORITES_PARAM_RETURN_PID, "0");
	return `${SITE_ORIGIN}${SEARCH_PATH}?${params.toString()}`;
}
async function fetchText(url) {
	const response = await fetch(url, {
		method: "GET",
		credentials: FETCH_CREDENTIALS
	});
	if (!response.ok) throw new Error(`HTTP ${String(response.status)}`);
	return (await response.text()).trim();
}
function parseVoteScore(raw) {
	if (raw.length === 0) return;
	const score = Number(raw);
	if (!Number.isFinite(score)) return;
	return score;
}
async function addFavorite(postId) {
	let addResponse;
	try {
		addResponse = await fetchText(buildAddFavUrl(postId));
	} catch (error) {
		log.warn("addfav request failed", postId, error);
		return { status: "error" };
	}
	if (addResponse === "1") return { status: "already" };
	if (addResponse === "2") return { status: "not_logged_in" };
	if (addResponse !== "3") {
		log.warn("Unexpected addfav response", postId, addResponse);
		return { status: "error" };
	}
	try {
		const score = await voteUp(postId);
		if (score === null) return { status: "added" };
		return {
			status: "added",
			score
		};
	} catch (error) {
		log.warn("vote request failed after addfav", postId, error);
		return { status: "added" };
	}
}
/** GET vote-up endpoint; returns the new score number, or null if unparseable/failed. */
async function voteUp(postId) {
	try {
		const score = parseVoteScore(await fetchText(buildVoteUrl(postId)));
		return score === void 0 ? null : score;
	} catch (error) {
		log.warn("vote request failed", postId, error);
		return null;
	}
}
async function removeFavorite(postId, options = {}) {
	try {
		const init = {
			method: "GET",
			credentials: FETCH_CREDENTIALS
		};
		if (options.signal !== void 0) init.signal = options.signal;
		const response = await fetch(buildRemoveFavUrl(postId), init);
		if (!response.ok) {
			log.warn("remove favorite HTTP error", postId, response.status);
			return { status: "error" };
		}
		return { status: "removed" };
	} catch (error) {
		if (options.signal?.aborted === true || error instanceof DOMException && error.name === "AbortError" || error instanceof Error && error.name === "AbortError") return { status: "error" };
		log.warn("remove favorite request failed", postId, error);
		return { status: "error" };
	}
}
var removeClickBound = false;
var POST_LINK_ID_PREFIX = "p";
/**
* Resolve a favorites-page thumb's post id from Remove onclick, thumb id, or a#p{ID}.
*/
function resolveFavoriteThumbPostId(thumb) {
	const removeLinks = thumb.querySelectorAll(SITE_SELECTORS.favoritesDeleteLink);
	for (const link of removeLinks) {
		if (!(link instanceof HTMLAnchorElement)) continue;
		const onclick = link.getAttribute("onclick");
		if (onclick === null) continue;
		const fromOnclick = extractPostIdFromFavoritesDeleteOnclick(onclick);
		if (fromOnclick !== null) return fromOnclick;
	}
	const fromThumbId = extractPostIdFromThumb(thumb);
	if (fromThumbId !== null) return fromThumbId;
	const postLinks = thumb.querySelectorAll(`a[id^="${POST_LINK_ID_PREFIX}"]`);
	for (const link of postLinks) {
		if (!(link instanceof HTMLAnchorElement)) continue;
		const id = link.id;
		if (!id.startsWith(POST_LINK_ID_PREFIX)) continue;
		const postId = id.slice(1);
		if (/^\d+$/.test(postId)) return postId;
	}
	return null;
}
/** Current-page favorite thumbs that have a resolvable post id. */
function listFavoriteThumbEntries(root = document) {
	const entries = [];
	const seen = /* @__PURE__ */ new Set();
	const thumbs = root.querySelectorAll(SITE_SELECTORS.thumb);
	for (const node of thumbs) {
		if (!(node instanceof HTMLElement)) continue;
		const postId = resolveFavoriteThumbPostId(node);
		if (postId === null || seen.has(postId)) continue;
		seen.add(postId);
		entries.push({
			thumb: node,
			postId
		});
	}
	return entries;
}
var CELL_SEPARATOR_TAGS = /* @__PURE__ */ new Set([
	"BR",
	"HR",
	"WBR"
]);
var CELL_SEPARATOR_TEXT_PATTERN = /^[|\u00b7•·,\s]*$/;
/**
* True for Remove links / light separators that belong to a favorites cell.
* Stops adjacency walks before paginator, scripts, and other page chrome.
*/
function isFavoriteCellResidue(node, postId) {
	if (node.nodeType === Node.TEXT_NODE) {
		const text = node.textContent ?? "";
		return CELL_SEPARATOR_TEXT_PATTERN.test(text);
	}
	if (!(node instanceof HTMLElement)) return false;
	if (CELL_SEPARATOR_TAGS.has(node.tagName)) return true;
	if (!(node instanceof HTMLAnchorElement)) return false;
	const onclick = node.getAttribute("onclick");
	if (onclick === null) return false;
	const removeId = extractPostIdFromFavoritesDeleteOnclick(onclick);
	if (removeId === null) return false;
	return postId === null || removeId === postId;
}
/**
* Remove a favorites cell from the DOM: the thumb and, when Remove / separators
* sit between this thumb and the next `span.thumb`, those siblings too.
* Never injects into `a#p{ID}`; never deletes paginator/other non-cell nodes.
*/
function removeFavoriteCell(thumb) {
	const postId = resolveFavoriteThumbPostId(thumb);
	const nodesToRemove = [thumb];
	let sibling = thumb.nextSibling;
	while (sibling !== null) {
		if (sibling instanceof HTMLElement && sibling.matches(SITE_SELECTORS.thumb)) break;
		if (!isFavoriteCellResidue(sibling, postId)) break;
		nodesToRemove.push(sibling);
		sibling = sibling.nextSibling;
	}
	for (const node of nodesToRemove) node.remove();
}
function collectFavoritePostIds(root) {
	const ids = [];
	const seen = /* @__PURE__ */ new Set();
	const links = root.querySelectorAll(SITE_SELECTORS.favoritesDeleteLink);
	for (const link of links) {
		if (!(link instanceof HTMLAnchorElement)) continue;
		const onclick = link.getAttribute("onclick");
		if (onclick === null) continue;
		const postId = extractPostIdFromFavoritesDeleteOnclick(onclick);
		if (postId === null || seen.has(postId)) continue;
		seen.add(postId);
		ids.push(postId);
	}
	return ids;
}
function bindRemoveClickCapture() {
	if (removeClickBound) return;
	removeClickBound = true;
	document.addEventListener("click", (event) => {
		const target = event.target;
		if (!(target instanceof Element)) return;
		const link = target.closest("a");
		if (!(link instanceof HTMLAnchorElement)) return;
		const onclick = link.getAttribute("onclick");
		if (onclick === null) return;
		const postId = extractPostIdFromFavoritesDeleteOnclick(onclick);
		if (postId === null) return;
		removeFav(postId);
	}, true);
}
function syncFavoritesPage(root = document, search = window.location.search) {
	if (detectPageKind(search) !== "favorites") return;
	const ids = collectFavoritePostIds(root);
	const numericIds = [];
	for (const postId of ids) {
		const parsed = Number(postId);
		if (Number.isFinite(parsed)) numericIds.push(Math.trunc(parsed));
	}
	addFavs(numericIds);
	bindRemoveClickCapture();
}
/** Minimum pause between sequential favorites page fetches. */
var FAVORITES_SYNC_PAGE_PAUSE_MS = exports("a$",1500);
/** Pauses before each of the three retries (HTTP error / missing paginator). */
var FAVORITES_SYNC_RETRY_DELAYS_MS = [
	1e4,
	3e4,
	6e4
];
var FAVORITES_SYNC_MODE_INCREMENTAL = exports("bl",FAVS_SYNC_MODE_INCREMENTAL);
var FAVORITES_SYNC_MODE_FULL = exports("F",FAVS_SYNC_MODE_FULL);
var MY_FAVORITES_LINK_SELECTOR$1 = "li#my-favorites-container a[href*=\"page=favorites\"]";
var THUMB_SELECTOR$1 = "span.thumb";
var THUMB_POST_LINK_SELECTOR = "span.thumb a[id^=\"p\"]";
var PAGINATOR_SELECTOR = "#paginator";
var LASTPAGE_SELECTOR = "a[name=\"lastpage\"]";
var NEXT_SELECTOR = "a[name=\"next\"]";
var REMOVE_LINK_SELECTOR = "a[onclick]";
var POST_LINK_ID_PATTERN = /^p(\d+)$/;
var ONCLICK_PID_PATTERN = /[?&]pid=(\d+)/;
var URL_PARSE_BASE = "https://rule34.xxx";
var TAB_ID_RANDOM_RADIX = 36;
var TAB_ID_RANDOM_SLICE_START = 2;
var FAVORITES_SYNC_ERROR_NOT_LOGGED_IN = "not logged in or menu not found";
var FAVORITES_SYNC_ERROR_UNEXPECTED_PAGE = "unexpected page";
function createAbortResult(total, page, pages) {
	return {
		status: "aborted",
		total,
		page,
		pages
	};
}
function isAbortError$2(error) {
	return error instanceof DOMException && error.name === "AbortError" || error instanceof Error && error.name === "AbortError";
}
function throwIfAborted(signal) {
	if (signal.aborted) throw new DOMException("Aborted", "AbortError");
}
function delay$1(ms, signal) {
	return new Promise((resolve, reject) => {
		if (signal.aborted) {
			reject(new DOMException("Aborted", "AbortError"));
			return;
		}
		const timer = setTimeout(() => {
			signal.removeEventListener("abort", onAbort);
			if (signal.aborted) {
				reject(new DOMException("Aborted", "AbortError"));
				return;
			}
			resolve();
		}, ms);
		const onAbort = () => {
			clearTimeout(timer);
			reject(new DOMException("Aborted", "AbortError"));
		};
		signal.addEventListener("abort", onAbort, { once: true });
	});
}
function parsePositiveInt(raw) {
	if (raw === null) return null;
	const trimmed = raw.trim();
	if (trimmed.length === 0) return null;
	const value = Number(trimmed);
	if (!Number.isFinite(value) || value < 0) return null;
	return Math.trunc(value);
}
function parsePidFromOnclick(onclick) {
	const raw = ONCLICK_PID_PATTERN.exec(onclick)?.[1];
	if (raw === void 0) return null;
	return parsePositiveInt(raw);
}
function titleSnippetFromHtml(html) {
	try {
		return titleSnippetFromDocument(new DOMParser().parseFromString(html, "text/html"));
	} catch {
		return "";
	}
}
function titleSnippetFromDocument(doc) {
	const raw = doc.title.trim();
	if (raw.length <= 80) return raw;
	return raw.slice(0, 80);
}
function formatPauseMessage(status, titleSnippet) {
	if (titleSnippet.length === 0) return `HTTP ${String(status)}`;
	return `HTTP ${String(status)}: ${titleSnippet}`;
}
/** Stable tab id for sync lock (Package H / multi-tab). */
function createFavoritesSyncTabId() {
	const random = Math.random().toString(TAB_ID_RANDOM_RADIX).slice(TAB_ID_RANDOM_SLICE_START, 12);
	return `tab-${String(Date.now())}-${random}`;
}
function extractUserIdFromDocument(root) {
	const link = root.querySelector(MY_FAVORITES_LINK_SELECTOR$1);
	if (!(link instanceof HTMLAnchorElement)) return null;
	const href = link.getAttribute("href");
	if (href === null || href.length === 0) return null;
	try {
		return parsePositiveInt(new URL(href, URL_PARSE_BASE).searchParams.get("id"));
	} catch {
		return null;
	}
}
/**
* Reads `id` from a favorites view URL search string.
* Returns null when the location is not a favorites page or id is missing.
*/
function extractUserIdFromFavoritesSearch(search) {
	if (detectPageKind(search) !== "favorites") return null;
	return parsePositiveInt(new URLSearchParams(search).get("id"));
}
/**
* Resolve favorites owner id: menu link → favorites URL id → saved sync value.
*/
function resolveFavoritesUserId(root, search, savedUserId) {
	const fromMenu = extractUserIdFromDocument(root);
	if (fromMenu !== null) return fromMenu;
	const fromUrl = extractUserIdFromFavoritesSearch(search);
	if (fromUrl !== null) return fromUrl;
	if (savedUserId !== void 0 && Number.isFinite(savedUserId)) return Math.trunc(savedUserId);
	return null;
}
function buildFavoritesPageUrl(userId, pid) {
	const params = new URLSearchParams();
	params.set(SEARCH_PARAM_PAGE, FAVORITES_PAGE);
	params.set("s", FAVORITES_SECTION_VIEW);
	params.set("id", String(userId));
	params.set("pid", String(pid));
	return `${SEARCH_PATH}?${params.toString()}`;
}
function pageIndexFromPid(pid) {
	return Math.floor(pid / 50) + 1;
}
function pagesFromLastPid(lastPid) {
	return Math.floor(lastPid / 50) + 1;
}
function collectFavoriteIdsFromDocument(doc) {
	const ids = /* @__PURE__ */ new Set();
	const postLinks = doc.querySelectorAll(THUMB_POST_LINK_SELECTOR);
	for (const link of postLinks) {
		const raw = POST_LINK_ID_PATTERN.exec(link.id)?.[1];
		if (raw === void 0) continue;
		const parsed = Number(raw);
		if (Number.isFinite(parsed)) ids.add(Math.trunc(parsed));
	}
	const removeLinks = doc.querySelectorAll(REMOVE_LINK_SELECTOR);
	for (const link of removeLinks) {
		const onclick = link.getAttribute("onclick");
		if (onclick === null) continue;
		const postId = extractPostIdFromFavoritesDeleteOnclick(onclick);
		if (postId === null) continue;
		const parsed = Number(postId);
		if (Number.isFinite(parsed)) ids.add(Math.trunc(parsed));
	}
	return Array.from(ids);
}
/**
* Reads last-page pid from a[name="lastpage"] onclick only.
* No lastpage and no next → current page is last (returns currentPid).
* No lastpage but next exists, or lastpage onclick unparseable → null (unexpected).
*/
function resolveLastPid(doc, currentPid) {
	const lastpage = doc.querySelector(LASTPAGE_SELECTOR);
	if (lastpage instanceof HTMLAnchorElement) {
		const onclick = lastpage.getAttribute("onclick");
		if (onclick === null || onclick.length === 0) return null;
		return parsePidFromOnclick(onclick);
	}
	if (doc.querySelector(NEXT_SELECTOR) !== null) return null;
	return currentPid;
}
function hasPaginator(doc) {
	return doc.querySelector(PAGINATOR_SELECTOR) !== null;
}
/**
* Reads sync mode from persisted FavsSyncState.mode.
* Missing / unexpected → undefined.
*/
function readFavoritesSyncMode(sync) {
	const mode = sync?.mode;
	if (mode === FAVORITES_SYNC_MODE_INCREMENTAL || mode === FAVORITES_SYNC_MODE_FULL) return mode;
}
/**
* True when the page has at least one id and every id is already local.
* Empty pages are not early-stop (handled by trailing-empty completion).
*/
function pageIdsAllInLocalSet(pageIds, local) {
	if (pageIds.length === 0) return false;
	for (const id of pageIds) if (!local.has(id)) return false;
	return true;
}
function resolveRunMode(unfinished, existing, requested) {
	if (unfinished) return readFavoritesSyncMode(existing) ?? FAVORITES_SYNC_MODE_FULL;
	return requested ?? FAVORITES_SYNC_MODE_INCREMENTAL;
}
function persistSyncProgress(fields) {
	const state = {
		nextPid: fields.nextPid,
		lastPid: fields.lastPid,
		startedAt: fields.startedAt,
		running: fields.running,
		userId: fields.userId,
		mode: fields.mode,
		lock: {
			tabId: fields.tabId,
			beatAt: Date.now()
		}
	};
	if (fields.finishedAt !== void 0) state.finishedAt = fields.finishedAt;
	setSyncState(state);
	return state;
}
async function fetchFavoritesPageOnce(url, signal) {
	let response;
	try {
		response = await fetch(url, {
			method: "GET",
			credentials: FETCH_CREDENTIALS,
			signal
		});
	} catch (error) {
		if (isAbortError$2(error)) throw error;
		const message = error instanceof Error ? error.message : "request failed";
		log.warn("favorites sync: fetch failed", url, error);
		return {
			ok: false,
			status: 0,
			titleSnippet: message.slice(0, 80),
			message
		};
	}
	const html = await response.text();
	const titleSnippet = titleSnippetFromHtml(html);
	if (!response.ok) {
		log.warn("favorites sync: HTTP error", response.status, url);
		return {
			ok: false,
			status: response.status,
			titleSnippet,
			message: formatPauseMessage(response.status, titleSnippet)
		};
	}
	const doc = new DOMParser().parseFromString(html, "text/html");
	if (!hasPaginator(doc)) {
		log.warn("favorites sync: missing paginator", url);
		return {
			ok: false,
			status: response.status,
			titleSnippet: titleSnippetFromDocument(doc),
			message: formatPauseMessage(response.status, titleSnippetFromDocument(doc))
		};
	}
	return {
		ok: true,
		doc,
		status: response.status,
		titleSnippet: titleSnippetFromDocument(doc)
	};
}
/**
* Fetch one favorites page; retry up to 3 times after 10s / 30s / 60s on
* HTTP errors or missing paginator.
*/
async function fetchFavoritesPageWithRetries(url, signal) {
	let lastFailure = null;
	for (let attempt = 0; attempt <= FAVORITES_SYNC_RETRY_DELAYS_MS.length; attempt += 1) {
		throwIfAborted(signal);
		if (attempt > 0) {
			const delayMs = FAVORITES_SYNC_RETRY_DELAYS_MS[attempt - 1];
			if (delayMs === void 0) break;
			log.warn("favorites sync: retrying after delay", {
				attempt,
				delayMs,
				url
			});
			await delay$1(delayMs, signal);
			throwIfAborted(signal);
		}
		const result = await fetchFavoritesPageOnce(url, signal);
		if (result.ok) return result;
		lastFailure = result;
	}
	if (lastFailure === null) return {
		ok: false,
		status: 0,
		titleSnippet: "",
		message: formatPauseMessage(0, "")
	};
	return lastFailure;
}
/**
* Walks the site favorites list page-by-page and merges ids into local favs.
* Only adds; never removes. Network I/O lives here only (explicit user click).
*/
async function runFavoritesSync(options) {
	const { onProgress, signal } = options;
	const tabId = options.tabId ?? createFavoritesSyncTabId();
	const existing = getSyncState();
	const userId = resolveFavoritesUserId(document, window.location.search, existing?.userId);
	if (userId === null) {
		log.warn("favorites sync: user id not found");
		return {
			status: "error",
			message: FAVORITES_SYNC_ERROR_NOT_LOGGED_IN
		};
	}
	const unfinished = existing !== void 0 && existing.finishedAt === void 0;
	const mode = resolveRunMode(unfinished, existing, options.mode);
	const startedAt = unfinished ? existing.startedAt : (/* @__PURE__ */ new Date()).toISOString();
	let pid = unfinished ? existing.nextPid : 0;
	let lastPid = unfinished ? existing.lastPid : 0;
	let persistedNextPid = pid;
	let total = loadFavSet().size;
	let page = pageIndexFromPid(pid);
	let pages = pagesFromLastPid(lastPid);
	let sawNonEmptyPage = unfinished && existing.nextPid > 0;
	const writeProgress = (fields) => {
		const nextPid = fields.nextPid ?? persistedNextPid;
		persistedNextPid = nextPid;
		if (fields.lastPid !== void 0) lastPid = fields.lastPid;
		const payload = {
			nextPid,
			lastPid,
			startedAt,
			userId,
			tabId,
			running: fields.running,
			mode
		};
		if (fields.finishedAt !== void 0) payload.finishedAt = fields.finishedAt;
		persistSyncProgress(payload);
	};
	try {
		throwIfAborted(signal);
		writeProgress({ running: true });
		while (true) {
			throwIfAborted(signal);
			const fetched = await fetchFavoritesPageWithRetries(buildFavoritesPageUrl(userId, pid), signal);
			if (!fetched.ok) {
				writeProgress({ running: true });
				return {
					status: "error",
					message: fetched.message
				};
			}
			const { doc } = fetched;
			const cardCount = doc.querySelectorAll(THUMB_SELECTOR$1).length;
			page = pageIndexFromPid(pid);
			if (cardCount === 0 && sawNonEmptyPage) {
				pages = Math.max(pages, page);
				const finishedAt = (/* @__PURE__ */ new Date()).toISOString();
				writeProgress({
					nextPid: pid + 50,
					running: false,
					finishedAt
				});
				onProgress({
					page,
					pages,
					total
				});
				log.info("favorites sync: completed on empty trailing page", {
					total,
					pages,
					pid,
					mode
				});
				return {
					status: "completed",
					total,
					pages
				};
			}
			const resolvedLastPid = resolveLastPid(doc, pid);
			if (resolvedLastPid === null) {
				log.warn("favorites sync: unexpected page", {
					pid,
					cardCount
				});
				writeProgress({ running: true });
				return {
					status: "error",
					message: FAVORITES_SYNC_ERROR_UNEXPECTED_PAGE
				};
			}
			lastPid = resolvedLastPid;
			pages = pagesFromLastPid(lastPid);
			if (cardCount === 0) {
				log.warn("favorites sync: unexpected empty page", {
					pid,
					lastPid
				});
				writeProgress({ running: true });
				return {
					status: "error",
					message: FAVORITES_SYNC_ERROR_UNEXPECTED_PAGE
				};
			}
			sawNonEmptyPage = true;
			const ids = collectFavoriteIdsFromDocument(doc);
			const allKnown = pageIdsAllInLocalSet(ids, loadFavSet());
			addFavs(ids);
			total = loadFavSet().size;
			const nextPid = pid + 50;
			writeProgress({
				nextPid,
				lastPid,
				running: true
			});
			onProgress({
				page,
				pages,
				total
			});
			if (mode === FAVORITES_SYNC_MODE_INCREMENTAL && allKnown) {
				const finishedAt = (/* @__PURE__ */ new Date()).toISOString();
				writeProgress({
					nextPid,
					lastPid,
					running: false,
					finishedAt
				});
				log.info("favorites sync: incremental early stop", {
					total,
					pages,
					page,
					pid
				});
				return {
					status: "completed",
					total,
					pages
				};
			}
			if (pid >= lastPid) {
				const finishedAt = (/* @__PURE__ */ new Date()).toISOString();
				writeProgress({
					nextPid,
					lastPid,
					running: false,
					finishedAt
				});
				log.info("favorites sync: completed", {
					total,
					pages,
					mode
				});
				return {
					status: "completed",
					total,
					pages
				};
			}
			throwIfAborted(signal);
			await delay$1(FAVORITES_SYNC_PAGE_PAUSE_MS, signal);
			throwIfAborted(signal);
			pid = nextPid;
			page = pageIndexFromPid(pid);
		}
	} catch (error) {
		if (isAbortError$2(error)) {
			writeProgress({ running: false });
			log.info("favorites sync: aborted", {
				pid,
				total,
				mode
			});
			return createAbortResult(total, page, pages);
		}
		log.error("favorites sync: unexpected failure", error);
		writeProgress({ running: true });
		return {
			status: "error",
			message: error instanceof Error ? error.message : "unexpected error"
		};
	}
}
var FEATURE_ID$9 = "favorites-bulk";
var FEATURE_LABEL$9 = "Bulk remove favorites";
var FEATURE_PAGES$9 = ["favorites"];
var ROOT_ID$2 = "rdw-favorites-bulk";
var ROOT_CLASS$2 = "rdw-favorites-bulk";
var BAR_CLASS = "rdw-favorites-bulk-bar";
var STATUS_CLASS = "rdw-favorites-bulk-status";
var CONFIRM_CLASS = "rdw-favorites-bulk-confirm";
var CONFIRM_ROW_CLASS = "rdw-favorites-bulk-confirm-row";
var PROGRESS_WRAP_CLASS = "rdw-favorites-bulk-progress";
/** Selection chrome on site thumbs — skin may restyle (HANDOFF G). */
var CLASS_THUMB_SELECTED = "rdw-fav-bulk-selected";
var CLASS_THUMB_CHECK = "rdw-fav-bulk-check";
var TEXT_SELECT = "Select";
var TEXT_SELECT_PAGE = "Select page";
var TEXT_CLEAR = "Clear";
var TEXT_CANCEL = UI_TEXT.cancel;
var TEXT_CONFIRM = UI_TEXT.confirm;
var TEXT_STOP = "Stop";
var TEXT_DISMISS = "Dismiss";
var TEXT_REMOVE_SELECTED_PREFIX = "Remove selected (";
var TEXT_REMOVE_SELECTED_SUFFIX = ")";
var TEXT_SELECTED_SUFFIX = " selected";
var TEXT_CONFIRM_PREFIX = "Remove ";
var TEXT_CONFIRM_MID = " favorite";
var TEXT_CONFIRM_MID_PLURAL = " favorites";
var TEXT_CONFIRM_SUFFIX = "? This cannot be undone on the site.";
var TEXT_CONFIRM_ARIA = "Confirm bulk remove favorites";
var TEXT_PROGRESS_OF = " of ";
var TEXT_ERROR_DELETED_PREFIX = "Deleted ";
var TEXT_ERROR_DELETED_MID = " of ";
var TEXT_ERROR_FAILED_PREFIX = ". Failed on post ";
var TEXT_ERROR_FAILED_SUFFIX = ".";
var TEXT_STOPPED_PREFIX = "Stopped after ";
var TEXT_STOPPED_MID = " of ";
var TEXT_STOPPED_SUFFIX = ".";
var CHECK_GLYPH = "✓";
var ACCENT_FALLBACK = "#4c8bf5";
var SURFACE_FALLBACK = "#ffffff";
var SELECT_OUTLINE_WIDTH = "2px";
var SELECT_OUTLINE_OFFSET = "2px";
var CHECK_SIZE = "1.25rem";
var CHECK_INSET = "0.25rem";
var CHECK_Z_INDEX = 2;
var CHECK_FONT_SIZE = "0.75rem";
var BODY_CLASS$4 = featureBodyClass(FEATURE_ID$9);
var BODY_SELECTING_CLASS = `${BODY_CLASS$4}-selecting`;
var FEATURE_CSS$9 = `
body.${BODY_CLASS$4} .${ROOT_CLASS$2} {
  display: block;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  margin: 0.5rem 0;
  flex: 0 0 100%;
  grid-column: 1 / -1;
}
body.${BODY_CLASS$4} .${BAR_CLASS} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.5rem;
  width: 100%;
  box-sizing: border-box;
}
body.${BODY_CLASS$4} .${STATUS_CLASS} {
  flex: 1 1 12rem;
  min-width: 0;
  font: inherit;
  font-size: 0.875rem;
  line-height: 1.3;
}
body.${BODY_CLASS$4} .${CONFIRM_CLASS} {
  display: grid;
  gap: 0.75rem;
}
body.${BODY_CLASS$4} .${CONFIRM_ROW_CLASS} {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.5rem;
}
body.${BODY_CLASS$4} .${PROGRESS_WRAP_CLASS} {
  flex: 1 1 12rem;
  min-width: 8rem;
  max-width: 24rem;
}
body.${BODY_CLASS$4} span.thumb {
  position: relative;
}
body.${BODY_CLASS$4} span.thumb.${CLASS_THUMB_SELECTED} {
  outline: ${SELECT_OUTLINE_WIDTH} solid var(--rdw-accent, ${ACCENT_FALLBACK});
  outline-offset: ${SELECT_OUTLINE_OFFSET};
}
body.${BODY_CLASS$4} span.thumb > .${CLASS_THUMB_CHECK} {
  position: absolute;
  top: ${CHECK_INSET};
  left: ${CHECK_INSET};
  z-index: ${String(CHECK_Z_INDEX)};
  display: none;
  align-items: center;
  justify-content: center;
  width: ${CHECK_SIZE};
  height: ${CHECK_SIZE};
  border-radius: 999px;
  background: var(--rdw-accent, ${ACCENT_FALLBACK});
  color: var(--rdw-surface, ${SURFACE_FALLBACK});
  font-size: ${CHECK_FONT_SIZE};
  font-weight: 700;
  line-height: 1;
  pointer-events: none;
}
body.${BODY_CLASS$4} span.thumb.${CLASS_THUMB_SELECTED} > .${CLASS_THUMB_CHECK} {
  display: inline-flex;
}
`.trim();
function removeSelectedLabel(count) {
	return `${TEXT_REMOVE_SELECTED_PREFIX}${String(count)}${TEXT_REMOVE_SELECTED_SUFFIX}`;
}
function selectedCountLabel(count) {
	return `${String(count)}${TEXT_SELECTED_SUFFIX}`;
}
function confirmMessage(count) {
	return `${TEXT_CONFIRM_PREFIX}${String(count)}${count === 1 ? TEXT_CONFIRM_MID : TEXT_CONFIRM_MID_PLURAL}${TEXT_CONFIRM_SUFFIX}`;
}
function progressLabel(done, total) {
	return `${String(done)}${TEXT_PROGRESS_OF}${String(total)}`;
}
function errorMessage(deleted, total, failedPostId) {
	return `${TEXT_ERROR_DELETED_PREFIX}${String(deleted)}${TEXT_ERROR_DELETED_MID}${String(total)}${TEXT_ERROR_FAILED_PREFIX}${failedPostId}${TEXT_ERROR_FAILED_SUFFIX}`;
}
function stoppedMessage(deleted, total) {
	return `${TEXT_STOPPED_PREFIX}${String(deleted)}${TEXT_STOPPED_MID}${String(total)}${TEXT_STOPPED_SUFFIX}`;
}
function isAbortError$1(error) {
	return error instanceof DOMException && error.name === "AbortError" || error instanceof Error && error.name === "AbortError";
}
function delay(ms, signal) {
	return new Promise((resolve, reject) => {
		if (signal.aborted) {
			reject(new DOMException("Aborted", "AbortError"));
			return;
		}
		const timer = setTimeout(() => {
			signal.removeEventListener("abort", onAbort);
			if (signal.aborted) {
				reject(new DOMException("Aborted", "AbortError"));
				return;
			}
			resolve();
		}, ms);
		const onAbort = () => {
			clearTimeout(timer);
			reject(new DOMException("Aborted", "AbortError"));
		};
		signal.addEventListener("abort", onAbort, { once: true });
	});
}
function ensureCheckOverlay(thumb) {
	if (thumb.querySelector(`:scope > .rdw-fav-bulk-check`) !== null) return;
	const check = document.createElement("span");
	check.className = CLASS_THUMB_CHECK;
	check.setAttribute("aria-hidden", "true");
	check.textContent = CHECK_GLYPH;
	const postLink = thumb.querySelector(`a[id^="p"]`);
	if (postLink instanceof HTMLAnchorElement && postLink.parentElement === thumb) {
		postLink.after(check);
		return;
	}
	thumb.prepend(check);
}
function clearThumbSelectionChrome(root = document) {
	const selected = root.querySelectorAll(`${SITE_SELECTORS.thumb}.${CLASS_THUMB_SELECTED}`);
	for (const node of selected) node.classList.remove(CLASS_THUMB_SELECTED);
	const checks = root.querySelectorAll(`${SITE_SELECTORS.thumb} > .${CLASS_THUMB_CHECK}`);
	for (const node of checks) node.remove();
}
function applySelectionChrome(entries, selected) {
	for (const entry of entries) {
		const isSelected = selected.has(entry.postId);
		entry.thumb.classList.toggle(CLASS_THUMB_SELECTED, isSelected);
		if (isSelected) ensureCheckOverlay(entry.thumb);
		else {
			const check = entry.thumb.querySelector(`:scope > .${CLASS_THUMB_CHECK}`);
			if (check !== null) check.remove();
		}
	}
}
/**
* Place the bar as its own full-width row above the thumbs grid/list —
* not as a sibling grid/flex item beside the first thumb.
*/
function findBarHost() {
	const imageList = document.querySelector(SITE_SELECTORS.imageList);
	if (imageList !== null && imageList.parentNode !== null) return {
		parent: imageList.parentNode,
		before: imageList
	};
	const firstThumb = document.querySelector(SITE_SELECTORS.thumb);
	if (firstThumb !== null) {
		const grid = firstThumb.parentElement;
		if (grid !== null && grid.parentNode !== null) {
			if (grid !== document.body && grid !== document.documentElement) return {
				parent: grid.parentNode,
				before: grid
			};
			return {
				parent: grid,
				before: firstThumb
			};
		}
	}
	const paginator = document.querySelector("#paginator");
	if (paginator !== null && paginator.parentNode !== null) return {
		parent: paginator.parentNode,
		before: paginator
	};
	return {
		parent: document.body,
		before: document.body.firstChild
	};
}
function removeDomCellForPost(postId) {
	const entry = listFavoriteThumbEntries().find((item) => item.postId === postId);
	if (entry !== void 0) {
		removeFavoriteCell(entry.thumb);
		return;
	}
	const fallback = document.getElementById(`s${postId}`);
	if (fallback instanceof HTMLElement) removeFavoriteCell(fallback);
}
function FavoritesBulkBar(props) {
	const [phase, setPhase] = d({ kind: "idle" });
	const [selected, setSelected] = d(() => /* @__PURE__ */ new Set());
	const abortRef = T(null);
	const selectedRef = T(selected);
	selectedRef.current = selected;
	const selectionActive = phase.kind === "selecting" || phase.kind === "confirm" || phase.kind === "removing";
	A(() => {
		props.onSelectionModeChange(selectionActive);
	}, [props, selectionActive]);
	A(() => {
		if (!selectionActive) {
			clearThumbSelectionChrome();
			return;
		}
		applySelectionChrome(listFavoriteThumbEntries(), selected);
	}, [selectionActive, selected]);
	A(() => {
		return () => {
			abortRef.current?.abort();
			clearThumbSelectionChrome();
		};
	}, []);
	A(() => {
		if (phase.kind !== "selecting" && phase.kind !== "confirm") return;
		const onClickCapture = (event) => {
			const target = event.target;
			if (!(target instanceof Element)) return;
			if (target.closest(".rdw-dialog-backdrop") !== null) return;
			const thumb = target.closest(SITE_SELECTORS.thumb);
			if (!(thumb instanceof HTMLElement)) return;
			if (!document.body.contains(thumb)) return;
			const postId = resolveFavoriteThumbPostId(thumb);
			if (postId === null) return;
			event.preventDefault();
			event.stopPropagation();
			if (phase.kind === "confirm") return;
			setSelected((prev) => {
				const next = new Set(prev);
				if (next.has(postId)) next.delete(postId);
				else next.add(postId);
				return next;
			});
		};
		document.addEventListener("click", onClickCapture, true);
		return () => {
			document.removeEventListener("click", onClickCapture, true);
		};
	}, [phase.kind]);
	const resetToIdle = () => {
		abortRef.current?.abort();
		abortRef.current = null;
		clearThumbSelectionChrome();
		setSelected(/* @__PURE__ */ new Set());
		setPhase({ kind: "idle" });
	};
	const enterSelecting = () => {
		setSelected(/* @__PURE__ */ new Set());
		setPhase({ kind: "selecting" });
	};
	const selectPage = () => {
		const ids = listFavoriteThumbEntries().map((entry) => entry.postId);
		setSelected(new Set(ids));
	};
	const clearSelection = () => {
		setSelected(/* @__PURE__ */ new Set());
	};
	const beginConfirm = () => {
		const count = selectedRef.current.size;
		if (count === 0) return;
		setPhase({
			kind: "confirm",
			count
		});
	};
	const closeConfirm = () => {
		setPhase({ kind: "selecting" });
	};
	const runRemoval = async () => {
		const ids = [...selectedRef.current];
		if (ids.length === 0) {
			setPhase({ kind: "selecting" });
			return;
		}
		const controller = new AbortController();
		abortRef.current = controller;
		const { signal } = controller;
		const total = ids.length;
		let done = 0;
		setPhase({
			kind: "removing",
			done,
			total
		});
		try {
			for (let index = 0; index < ids.length; index += 1) {
				if (signal.aborted) {
					setPhase({
						kind: "stopped",
						message: stoppedMessage(done, total)
					});
					return;
				}
				const postId = ids[index];
				if (postId === void 0) continue;
				const result = await removeFavorite(postId, { signal });
				if (signal.aborted) {
					setPhase({
						kind: "stopped",
						message: stoppedMessage(done, total)
					});
					return;
				}
				if (result.status !== "removed") {
					setPhase({
						kind: "error",
						message: errorMessage(done, total, postId)
					});
					return;
				}
				removeFav(postId);
				removeDomCellForPost(postId);
				done += 1;
				setSelected((prev) => {
					const next = new Set(prev);
					next.delete(postId);
					return next;
				});
				setPhase({
					kind: "removing",
					done,
					total
				});
				if (index < ids.length - 1) await delay(FAVORITES_SYNC_PAGE_PAUSE_MS, signal);
			}
			clearThumbSelectionChrome();
			setSelected(/* @__PURE__ */ new Set());
			setPhase({ kind: "idle" });
		} catch (error) {
			if (isAbortError$1(error) || signal.aborted) {
				setPhase({
					kind: "stopped",
					message: stoppedMessage(done, total)
				});
				return;
			}
			log.warn("favorites-bulk: unexpected removal failure", error);
			const failedId = ids[done] ?? "?";
			setPhase({
				kind: "error",
				message: errorMessage(done, total, failedId)
			});
		} finally {
			if (abortRef.current === controller) abortRef.current = null;
		}
	};
	const stopRemoval = () => {
		abortRef.current?.abort();
	};
	if (phase.kind === "idle") return /* @__PURE__ */ a("div", {
		className: BAR_CLASS,
		children: /* @__PURE__ */ a(Button, {
			variant: "secondary",
			size: "s",
			onClick: enterSelecting,
			children: TEXT_SELECT
		})
	});
	if (phase.kind === "removing") {
		const ratio = phase.total === 0 ? 0 : phase.done / phase.total;
		return /* @__PURE__ */ a("div", {
			className: BAR_CLASS,
			children: [
				/* @__PURE__ */ a("div", {
					className: PROGRESS_WRAP_CLASS,
					children: /* @__PURE__ */ a(ProgressBar, {
						value: ratio,
						label: progressLabel(phase.done, phase.total)
					})
				}),
				/* @__PURE__ */ a("span", {
					className: STATUS_CLASS,
					children: progressLabel(phase.done, phase.total)
				}),
				/* @__PURE__ */ a(Button, {
					variant: "secondary",
					size: "s",
					onClick: stopRemoval,
					children: TEXT_STOP
				})
			]
		});
	}
	if (phase.kind === "error" || phase.kind === "stopped") return /* @__PURE__ */ a("div", {
		className: BAR_CLASS,
		children: [/* @__PURE__ */ a("span", {
			className: STATUS_CLASS,
			children: phase.message
		}), /* @__PURE__ */ a(Button, {
			variant: "secondary",
			size: "s",
			onClick: resetToIdle,
			children: TEXT_DISMISS
		})]
	});
	const count = selected.size;
	const confirmOpen = phase.kind === "confirm";
	return /* @__PURE__ */ a($$1, { children: [/* @__PURE__ */ a("div", {
		className: BAR_CLASS,
		children: [
			/* @__PURE__ */ a("span", {
				className: STATUS_CLASS,
				children: selectedCountLabel(count)
			}),
			/* @__PURE__ */ a(Button, {
				variant: "secondary",
				size: "s",
				onClick: selectPage,
				children: TEXT_SELECT_PAGE
			}),
			/* @__PURE__ */ a(Button, {
				variant: "secondary",
				size: "s",
				onClick: clearSelection,
				children: TEXT_CLEAR
			}),
			/* @__PURE__ */ a(Button, {
				variant: "danger",
				size: "s",
				disabled: count === 0 || confirmOpen,
				onClick: beginConfirm,
				children: removeSelectedLabel(count)
			}),
			/* @__PURE__ */ a(Button, {
				variant: "ghost",
				size: "s",
				onClick: resetToIdle,
				children: TEXT_CANCEL
			})
		]
	}), /* @__PURE__ */ a(Dialog, {
		open: confirmOpen,
		onClose: closeConfirm,
		"aria-label": TEXT_CONFIRM_ARIA,
		className: CONFIRM_CLASS,
		children: [/* @__PURE__ */ a("p", {
			className: STATUS_CLASS,
			children: confirmMessage(count)
		}), /* @__PURE__ */ a("div", {
			className: CONFIRM_ROW_CLASS,
			children: [/* @__PURE__ */ a(Button, {
				variant: "danger",
				size: "s",
				onClick: () => {
					runRemoval();
				},
				children: TEXT_CONFIRM
			}), /* @__PURE__ */ a(Button, {
				variant: "secondary",
				size: "s",
				onClick: closeConfirm,
				children: TEXT_CANCEL
			})]
		})]
	})] });
}
function mountFavoritesBulk(_ctx) {
	if (document.getElementById(ROOT_ID$2) !== null) return;
	const host = findBarHost();
	const root = document.createElement("div");
	root.id = ROOT_ID$2;
	root.className = ROOT_CLASS$2;
	host.parent.insertBefore(root, host.before);
	const onSelectionModeChange = (active) => {
		document.body.classList.toggle(BODY_SELECTING_CLASS, active);
	};
	Q$1(/* @__PURE__ */ a(FavoritesBulkBar, { onSelectionModeChange }), root);
}
var favoritesBulkFeature = {
	id: FEATURE_ID$9,
	label: FEATURE_LABEL$9,
	pages: [...FEATURE_PAGES$9],
	defaultEnabled: true,
	css: FEATURE_CSS$9,
	mount: mountFavoritesBulk
};
var BASE_GRID_CSS = `
.${THUMB_CLASS} {
  position: relative;
  anchor-scope: ${THUMB_ANCHOR_NAME};
}

.${THUMB_CLASS} img.preview {
  anchor-name: ${THUMB_ANCHOR_NAME};
}
`;
/** Grid thumbnail CDN host (rule34.xxx). */
var THUMB_IMAGE_HOST = "wimg.rule34.xxx";
/**
* Video CDN origin. Path after origin starts with `//images/` (verified double
* slash on ws-cdn-video.rule34.xxx).
*/
var VIDEO_CDN_ORIGIN = "https://ws-cdn-video.rule34.xxx";
var THUMB_PATH_PATTERN = /^\/thumbnails\/([^/]+)\/thumbnail_([^/]+)\.jpg$/i;
var HTTPS_PROTOCOL = "https:";
var THUMB_DIRECTORY = "thumbnails";
var THUMB_FILE_PREFIX = "thumbnail_";
var THUMB_FILE_EXT = "jpg";
var MIN_POST_ID = 0;
var VIDEO_CDN_HOST = new URL(VIDEO_CDN_ORIGIN).hostname;
/** `/samples/<dir>/sample_<hash>.<ext>` with repeated slashes allowed. */
var SAMPLE_MEDIA_PATTERN = /^\/+samples\/+([^/]+)\/+sample_([^/]+)\.[^/.]+$/i;
/** `/images/<dir>/<hash>.<ext>` with repeated slashes allowed. */
var IMAGE_MEDIA_PATTERN = /^\/+images\/+([^/]+)\/+([^/]+)\.[^/.]+$/i;
function normalizeMediaPostId(postId) {
	if (!Number.isInteger(postId) || postId < MIN_POST_ID) return null;
	return postId;
}
function readMediaDirAndHash(pathname) {
	const sample = SAMPLE_MEDIA_PATTERN.exec(pathname);
	const image = sample === null ? IMAGE_MEDIA_PATTERN.exec(pathname) : null;
	const match = sample ?? image;
	if (match === null) return null;
	const dir = match[1];
	const hash = match[2];
	if (dir === void 0 || hash === void 0 || dir.length === 0 || hash.length === 0) return null;
	return {
		dir,
		hash
	};
}
function ensureThumbAnchor(thumb) {
	thumb.classList.add(THUMB_CLASS);
}
/**
* Build the CDN mp4 URL from a grid webm thumb `img.preview` src.
* Thumb: `https://wimg.rule34.xxx/thumbnails/<dir>/thumbnail_<hash>.jpg?<id>`
* Video: `https://ws-cdn-video.rule34.xxx//images/<dir>/<hash>.mp4?<id>`
* Unparseable input → null (no guessing).
*/
function buildVideoUrlFromThumbUrl(thumbUrl) {
	let parsed;
	try {
		parsed = new URL(thumbUrl);
	} catch {
		return null;
	}
	if (parsed.hostname !== "wimg.rule34.xxx") return null;
	const match = THUMB_PATH_PATTERN.exec(parsed.pathname);
	if (match === null) return null;
	const dir = match[1];
	const hash = match[2];
	if (dir === void 0 || hash === void 0 || dir.length === 0 || hash.length === 0) return null;
	return `${VIDEO_CDN_ORIGIN}//images/${dir}/${hash}.mp4${parsed.search}`;
}
/**
* Thumb URL for a sample or full-media CDN URL.
* Sample: `https://wimg.rule34.xxx//samples/<dir>/sample_<hash>.<ext>?<id>`
* Image/video: `https://ws-cdn-video.rule34.xxx//images/<dir>/<hash>.<ext>?<id>`
* Result: `https://wimg.rule34.xxx/thumbnails/<dir>/thumbnail_<hash>.jpg?<postId>`
* Repeated slashes in the path are accepted. Unparseable input → null.
* The query is `postId` (the caller’s post), not whatever query the media URL had.
*/
function deriveThumbUrlFromMedia(mediaUrl, postId) {
	const normalizedId = normalizeMediaPostId(postId);
	if (normalizedId === null) return null;
	let parsed;
	try {
		parsed = new URL(mediaUrl);
	} catch {
		return null;
	}
	if (parsed.protocol !== HTTPS_PROTOCOL) return null;
	if (parsed.hostname !== "wimg.rule34.xxx" && parsed.hostname !== VIDEO_CDN_HOST) return null;
	const media = readMediaDirAndHash(parsed.pathname);
	if (media === null) return null;
	return `https://${THUMB_IMAGE_HOST}/${THUMB_DIRECTORY}/${media.dir}/${THUMB_FILE_PREFIX}${media.hash}.${THUMB_FILE_EXT}?${String(normalizedId)}`;
}
/** Kit IconButton root class — prefer for preview badges. */
var KIT_ICON_BUTTON_CLASS = "rdw-icon-btn";
function favAriaLabel(postId, marked) {
	return `${marked ? UI_TEXT.cardFavRemoveLabel : UI_TEXT.cardFavAddLabel} ${postId}`;
}
function applyFavButtonState(button, state, postId, errorTitle) {
	if (state === "pending") {
		button.disabled = true;
		button.classList.add(CSS_CLASS.cardFavPending);
		return;
	}
	button.classList.remove(CSS_CLASS.cardFavMarked, CSS_CLASS.cardFavError, CSS_CLASS.cardFavPending);
	button.disabled = false;
	button.removeAttribute("title");
	if (state === "marked") {
		button.setAttribute("aria-pressed", "true");
		button.setAttribute("aria-label", favAriaLabel(postId, true));
		button.classList.add(CSS_CLASS.cardFavMarked);
		return;
	}
	if (state === "marked_error") {
		button.setAttribute("aria-pressed", "true");
		button.setAttribute("aria-label", favAriaLabel(postId, true));
		button.classList.add(CSS_CLASS.cardFavMarked, CSS_CLASS.cardFavError);
		button.title = errorTitle ?? UI_TEXT.cardFavErrorRequest;
		return;
	}
	if (state === "error") {
		button.setAttribute("aria-pressed", "false");
		button.setAttribute("aria-label", favAriaLabel(postId, false));
		button.classList.add(CSS_CLASS.cardFavError);
		button.title = errorTitle ?? UI_TEXT.cardFavErrorRequest;
		return;
	}
	button.setAttribute("aria-pressed", "false");
	button.setAttribute("aria-label", favAriaLabel(postId, false));
}
function createFavButton(postId, marked, className = CSS_CLASS.cardFav) {
	const button = document.createElement("button");
	button.type = "button";
	button.className = className;
	button.textContent = UI_TEXT.cardFavGlyph;
	applyFavButtonState(button, marked ? "marked" : "idle", postId);
	button.addEventListener("click", (event) => {
		event.preventDefault();
		event.stopPropagation();
		handleFavToggleClick(button, postId);
	});
	return button;
}
async function handleFavToggleClick(button, postId) {
	if (button.disabled) return;
	const currentlyMarked = button.getAttribute("aria-pressed") === "true";
	applyFavButtonState(button, "pending", postId);
	if (currentlyMarked) {
		const result = await removeFavorite(postId);
		if (result.status === "removed") {
			removeFav(postId);
			applyFavButtonState(button, "idle", postId);
			return;
		}
		applyFavButtonState(button, "marked_error", postId, UI_TEXT.cardFavErrorRequest);
		log.warn("Remove favorite failed", postId, result);
		return;
	}
	const result = await addFavorite(postId);
	if (result.status === "added" || result.status === "already") {
		addFav(postId);
		applyFavButtonState(button, "marked", postId);
		return;
	}
	if (result.status === "not_logged_in") {
		applyFavButtonState(button, "error", postId, UI_TEXT.cardFavErrorNotLoggedIn);
		log.warn("Favorite requires login", postId);
		return;
	}
	applyFavButtonState(button, "error", postId, UI_TEXT.cardFavErrorRequest);
	log.warn("Favorite failed", postId, result);
}
/**
* Document-level CSS for grid fav buttons, artist Follow, updates bar.
* Owned with cards / preview chrome (not panel Shadow DOM).
*/
var CARD_CSS = `
.${CSS_CLASS.cardFav} {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 5;
  box-sizing: border-box;
  min-width: 28px;
  min-height: 28px;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid #333;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.92);
  color: #333;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  opacity: 0;
}

@supports (anchor-name: --a) {
  .${CSS_CLASS.cardFav} {
    position-anchor: --rdw-img;
    top: calc(anchor(top) + 4px);
    right: calc(anchor(right) + 4px);
  }
}

.${CSS_CLASS.thumb}:hover .${CSS_CLASS.cardFav},
.${CSS_CLASS.cardFav}:focus-visible {
  opacity: 0.65;
}

.${CSS_CLASS.thumb} .${CSS_CLASS.cardFav}:hover,
.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavMarked},
.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavError},
.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavPending} {
  opacity: 1;
}

.${CSS_CLASS.cardFav}:focus-visible {
  outline: 2px solid #4c8bf5;
  outline-offset: 2px;
}

.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavMarked} {
  background: #ffe08a;
  border-color: #a67c00;
  color: #5c4500;
}

.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavError} {
  background: #f8d7da;
  border-color: #a12828;
  color: #a12828;
}

.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavPending},
.${CSS_CLASS.cardFav}:disabled {
  cursor: wait;
}

.${CSS_CLASS.thumb}:has(> a[style*="display: none"]) .${CSS_CLASS.cardFav},
.${CSS_CLASS.thumb}:has(> a[style*="display:none"]) .${CSS_CLASS.cardFav} {
  display: none !important;
}

body.${CSS_CLASS.gridFavsHidden} .${CSS_CLASS.cardFav} {
  display: none !important;
}

.${CSS_CLASS.artistFollow} {
  margin-left: 4px;
  box-sizing: border-box;
  min-height: 18px;
  padding: 0 5px;
  border: 1px solid #666;
  border-radius: 3px;
  background: #fff;
  color: #333;
  cursor: pointer;
  font-size: 11px;
  line-height: 1.2;
  vertical-align: middle;
}

.${CSS_CLASS.artistFollow}:focus-visible {
  outline: 2px solid #4c8bf5;
  outline-offset: 2px;
}

.${CSS_CLASS.artistFollow}.${CSS_CLASS.artistFollowMarked} {
  background: #ffe08a;
  border-color: #a67c00;
  color: #5c4500;
}

.${CSS_CLASS.updatesBar} {
  margin: 8px 0;
  padding: 8px 10px;
  border: 1px solid var(--rdw-border);
  border-radius: 6px;
  background: var(--rdw-surface);
  font-family: Segoe UI, system-ui, sans-serif;
  font-size: 14px;
  color: var(--rdw-text);
}

.${CSS_CLASS.updatesBar} .${CSS_CLASS.hint} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 12px;
}

.${CSS_CLASS.updatesBar} .${CSS_CLASS.primaryButton} {
  border: 1px solid var(--rdw-accent);
  background: var(--rdw-accent);
  color: var(--rdw-surface);
  border-radius: 4px;
  cursor: pointer;
  min-height: 32px;
  padding: 4px 10px;
  font: inherit;
}

.${CSS_CLASS.updatesBar} .${CSS_CLASS.primaryButton}:focus-visible {
  outline: 2px solid var(--rdw-accent);
  outline-offset: 2px;
}

.${CSS_CLASS.updatesBar} .${CSS_CLASS.itemName} {
  color: var(--rdw-accent);
  font-weight: 600;
  text-decoration: underline;
}

.${CSS_CLASS.updatesBarActions} {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
`;
var unsubscribeThumbsAdded$4;
/**
* Document overlays for preview badges + feed bar (mock layout 1).
* Appended after CARD_CSS so hover-only visibility wins over marked-always-visible.
*/
var DOCUMENT_OVERLAY_CSS = `
${ICON_BUTTON_CSS}

.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavMarked},
.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavError},
.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavPending} {
  opacity: 0;
}

.${CSS_CLASS.thumb}:hover .${CSS_CLASS.cardFav},
.${CSS_CLASS.cardFav}:focus-visible {
  opacity: 0.65;
}

.${CSS_CLASS.thumb} .${CSS_CLASS.cardFav}:hover,
.${CSS_CLASS.thumb}:hover .${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavMarked},
.${CSS_CLASS.thumb}:hover .${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavError},
.${CSS_CLASS.thumb}:hover .${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavPending},
.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavMarked}:focus-visible,
.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavError}:focus-visible,
.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavPending}:focus-visible {
  opacity: 1;
}

.${CSS_CLASS.cardFav}.rdw-icon-btn {
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.93);
  border: 1px solid rgba(0, 0, 0, 0.13);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  color: #1c2228;
  font-size: 13px;
}

.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavMarked}.rdw-icon-btn {
  background: #ffd75e;
  border-color: #c79a00;
  color: #5c4500;
}

.${CSS_CLASS.updatesBar} {
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
}

.${CSS_CLASS.updatesBarActions} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.${CSS_CLASS.updatesBar} .${CSS_CLASS.hint} {
  margin: 0;
  font-weight: 700;
  font-size: 12px;
  color: var(--rdw-text);
}

.${CSS_CLASS.updatesBar} .${CSS_CLASS.primaryButton} {
  margin-left: auto;
  background: var(--rdw-accent);
  border: 1px solid var(--rdw-accent);
  border-radius: 8px;
  height: 28px;
  min-height: 28px;
  padding: 0 12px;
  font-weight: 600;
  font-size: 12px;
}

.${CSS_CLASS.updatesBar} .${CSS_CLASS.secondaryButton} {
  box-sizing: border-box;
  display: inline-grid;
  place-items: center;
  border: 1px solid var(--rdw-border);
  background: var(--rdw-surface);
  color: var(--rdw-text);
  border-radius: 8px;
  height: 28px;
  min-height: 28px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 400;
  text-decoration: none;
  cursor: pointer;
  white-space: nowrap;
}

.${CSS_CLASS.updatesBar} .${CSS_CLASS.secondaryButton}:focus-visible,
.${CSS_CLASS.updatesBar} .${CSS_CLASS.primaryButton}:focus-visible {
  outline: 2px solid var(--rdw-accent);
  outline-offset: 2px;
}
`;
function ensureThumbsAddedSubscription() {
	if (unsubscribeThumbsAdded$4 !== void 0) return;
	unsubscribeThumbsAdded$4 = onThumbsAdded((root) => {
		mountCards(root);
	});
}
function ensureDocumentStyles() {
	if (document.getElementById("ruledesk-web-document-style") !== null) return;
	const style = document.createElement("style");
	style.id = DOCUMENT_STYLE_ID;
	style.textContent = `${BASE_GRID_CSS}\n${CARD_CSS}\n${DOCUMENT_OVERLAY_CSS}`;
	document.head.append(style);
}
function findThumbLink$2(thumb, postId) {
	const byId = thumb.querySelector(`#p${postId}`);
	if (byId instanceof HTMLAnchorElement) return byId;
	const byHref = thumb.querySelector(SITE_SELECTORS.thumbLink);
	return byHref instanceof HTMLAnchorElement ? byHref : null;
}
function attachFavButton(thumb, postId, marked) {
	if (thumb.querySelector(SITE_SELECTORS.cardFavButton) !== null) return;
	const link = findThumbLink$2(thumb, postId);
	if (link === null) return;
	ensureThumbAnchor(thumb);
	const button = createFavButton(postId, marked);
	button.classList.add(KIT_ICON_BUTTON_CLASS);
	link.after(button);
}
function applyGridFavVisibilityClass(visible) {
	document.body.classList.toggle(CSS_CLASS.gridFavsHidden, !visible);
}
function setGridFavButtonsVisible(visible) {
	applyGridFavVisibilityClass(visible);
	if (visible && detectPageKind(window.location.search) === "list") mountCards();
}
function mountCards(root = document, search = window.location.search) {
	ensureThumbsAddedSubscription();
	if (detectPageKind(search) !== "list") return;
	ensureDocumentStyles();
	const enabled = getGridFavButtonsEnabled();
	applyGridFavVisibilityClass(enabled);
	if (!enabled) return;
	const thumbs = root.querySelectorAll(SITE_SELECTORS.thumb);
	for (const thumb of thumbs) {
		if (!(thumb instanceof HTMLElement)) continue;
		const postId = extractPostIdFromThumb(thumb);
		if (postId === null) continue;
		attachFavButton(thumb, postId, isFav(postId));
	}
}
/** Keep in sync with `FEED_NEW_CLASS` in features/feed.ts. */
var FEED_NEW_CLASS$1 = "new";
var ID_FILTER_PATTERN = /^id:>(\d+)$/;
var TEXT_NEW_SUFFIX = " new";
var TEXT_MARKED_SEEN_PREFIX = "Marked as seen up to #";
var TEXT_ONLY_NEW = "Only new";
var TEXT_SHOW_ALL = "Show all";
/**
* Followed artists for feed-bar recognition.
* Mirror first — GM_getValue on bfcache pages can be a frozen snapshot.
*/
function resolveFollowedArtistTags$2() {
	const mirrored = readArtistsMirror();
	if (mirrored !== null && mirrored.length > 0) return [...mirrored];
	return listArtistTags();
}
/**
* store load syncs the mirror from GM; restore a non-empty pre-read mirror so a
* bfcache-stale GM snapshot cannot wipe tags followed on another page.
*/
function reloadStoragePreservingArtistsMirror$1() {
	const mirrored = readArtistsMirror();
	reloadFromStorage();
	if (mirrored !== null && mirrored.length > 0) writeArtistsMirror(mirrored);
}
function readPid(search) {
	const raw = new URLSearchParams(search).get("pid");
	if (raw === null || raw.trim().length === 0) return 0;
	const value = Number(raw);
	if (!Number.isFinite(value) || value < 0) return 0;
	return Math.floor(value);
}
function maxThumbPostId(root) {
	let maxId = 0;
	const thumbs = root.querySelectorAll(SITE_SELECTORS.thumb);
	for (const thumb of thumbs) {
		const postId = extractPostIdFromThumb(thumb);
		if (postId === null) continue;
		const numeric = Number(postId);
		if (Number.isFinite(numeric) && numeric > maxId) maxId = numeric;
	}
	return maxId;
}
function countNewThumbs(root, seenPostId) {
	let count = 0;
	const thumbs = root.querySelectorAll(SITE_SELECTORS.thumb);
	for (const thumb of thumbs) {
		const postId = extractPostIdFromThumb(thumb);
		if (postId === null) continue;
		const numeric = Number(postId);
		if (Number.isFinite(numeric) && numeric > seenPostId) count += 1;
	}
	return count;
}
function tagsHaveIdFilter(tagsParam) {
	const tokens = tagsParam.trim().split(/\s+/).filter((token) => token.length > 0);
	const last = tokens[tokens.length - 1];
	return last !== void 0 && ID_FILTER_PATTERN.test(last);
}
function removeExistingBar$1(root) {
	const existing = root instanceof Document ? root.getElementById(UPDATES_BAR_ID) : root.querySelector(`#${UPDATES_BAR_ID}`);
	if (existing !== null) existing.remove();
}
function createBarShell() {
	const bar = document.createElement("div");
	bar.id = UPDATES_BAR_ID;
	bar.className = CSS_CLASS.updatesBar;
	return bar;
}
function insertBeforeImageList(imageList, bar) {
	imageList.parentElement?.insertBefore(bar, imageList);
}
function findEmptyUpdatesHost(root) {
	return root.querySelector(SITE_SELECTORS.postListContent) ?? root.querySelector(SITE_SELECTORS.contentRoot);
}
function clearNewHighlights(root) {
	const thumbs = root.querySelectorAll(`${SITE_SELECTORS.thumb}.${FEED_NEW_CLASS$1}`);
	for (const thumb of thumbs) thumb.classList.remove(FEED_NEW_CLASS$1);
}
function createToggleLink(tagsParam, seenPostId) {
	if (tagsHaveIdFilter(tagsParam)) {
		const link = document.createElement("a");
		link.className = CSS_CLASS.secondaryButton;
		link.href = buildUpdatesSearchUrl(stripUpdatesIdFilter(tagsParam));
		link.textContent = TEXT_SHOW_ALL;
		return link;
	}
	if (seenPostId === 0) return null;
	const onlyNewQuery = `${stripUpdatesIdFilter(tagsParam)} ${UPDATES_ID_PREFIX}${String(seenPostId)}`;
	const link = document.createElement("a");
	link.className = CSS_CLASS.secondaryButton;
	link.href = buildUpdatesSearchUrl(onlyNewQuery);
	link.textContent = TEXT_ONLY_NEW;
	return link;
}
function appendToggle(parent, tagsParam, seenPostId) {
	const toggle = createToggleLink(tagsParam, seenPostId);
	if (toggle !== null) parent.append(toggle);
}
function mountEmptyPageBar(root, tagsParam) {
	const host = findEmptyUpdatesHost(root);
	if (host === null) {
		log.warn(UI_TEXT.updatesBarMissingHost);
		return;
	}
	const bar = createBarShell();
	const seen = getSeenPostId();
	const text = document.createElement("p");
	text.className = CSS_CLASS.hint;
	text.textContent = `${UI_TEXT.noNewPostsSince}${String(seen)}`;
	const showAll = document.createElement("a");
	showAll.className = CSS_CLASS.secondaryButton;
	showAll.href = buildUpdatesSearchUrl(stripUpdatesIdFilter(tagsParam));
	showAll.textContent = TEXT_SHOW_ALL;
	const wrap = document.createElement("div");
	wrap.className = CSS_CLASS.updatesBarActions;
	wrap.append(text, showAll);
	bar.append(wrap);
	host.insertBefore(bar, host.firstChild);
}
function mountPartialBar(imageList) {
	const bar = createBarShell();
	const hint = document.createElement("p");
	hint.className = CSS_CLASS.hint;
	hint.textContent = UI_TEXT.updatesPartialHint;
	bar.append(hint);
	insertBeforeImageList(imageList, bar);
}
function mountFullBar(imageList, search, tagsParam) {
	const bar = createBarShell();
	const seen = getSeenPostId();
	if (readPid(search) > 0) {
		const hint = document.createElement("p");
		hint.className = CSS_CLASS.hint;
		hint.textContent = UI_TEXT.goToPageOneToMark;
		bar.append(hint);
		insertBeforeImageList(imageList, bar);
		return;
	}
	const newCount = countNewThumbs(imageList, seen);
	const actions = document.createElement("div");
	actions.className = CSS_CLASS.updatesBarActions;
	if (newCount === 0) {
		const hint = document.createElement("p");
		hint.className = CSS_CLASS.hint;
		hint.textContent = `${UI_TEXT.noNewPostsSince}${String(seen)}`;
		actions.append(hint);
		appendToggle(actions, tagsParam, seen);
		bar.append(actions);
		insertBeforeImageList(imageList, bar);
		return;
	}
	const summary = document.createElement("p");
	summary.className = CSS_CLASS.hint;
	summary.textContent = `${String(newCount)}${TEXT_NEW_SUFFIX}`;
	const markButton = document.createElement("button");
	markButton.type = "button";
	markButton.className = CSS_CLASS.primaryButton;
	markButton.textContent = UI_TEXT.markAllSeen;
	markButton.addEventListener("click", () => {
		const nextSeen = Math.max(getSeenPostId(), maxThumbPostId(imageList));
		setSeenPostId(nextSeen);
		clearNewHighlights(document);
		bar.replaceChildren();
		const confirm = document.createElement("p");
		confirm.className = CSS_CLASS.hint;
		confirm.textContent = `${TEXT_MARKED_SEEN_PREFIX}${String(nextSeen)}`;
		const wrap = document.createElement("div");
		wrap.className = CSS_CLASS.updatesBarActions;
		wrap.append(confirm);
		appendToggle(wrap, tagsParam, nextSeen);
		bar.append(wrap);
	});
	actions.append(summary, markButton);
	appendToggle(actions, tagsParam, seen);
	bar.append(actions);
	insertBeforeImageList(imageList, bar);
}
function mountUpdatesBar(root = document, search = window.location.search) {
	if (detectPageKind(search) !== "list") return;
	const tagsParam = new URLSearchParams(search).get(SEARCH_PARAM_TAGS);
	if (tagsParam === null || tagsParam.trim().length === 0) return;
	const artistTags = resolveFollowedArtistTags$2();
	reloadStoragePreservingArtistsMirror$1();
	const isFull = isFullUpdatesQuery(tagsParam, artistTags);
	const isPartial = isPartialUpdatesQuery(tagsParam, artistTags);
	if (!isFull && !isPartial) {
		removeExistingBar$1(root);
		return;
	}
	removeExistingBar$1(root);
	ensureDocumentStyles();
	const imageList = root.querySelector(SITE_SELECTORS.imageList);
	if (imageList === null) {
		mountEmptyPageBar(root, tagsParam);
		return;
	}
	if (isPartial) {
		mountPartialBar(imageList);
		return;
	}
	mountFullBar(imageList, search, tagsParam);
}
var FEATURE_ID$8 = "feed";
var FEATURE_LABEL$8 = "Feed in site menu";
var FEATURE_PAGES$8 = [
	"list",
	"post",
	"favorites",
	"other"
];
var CONTENT_ID = "content";
var POSTS_LINK_TEXT = "Posts";
var FEED_LINK_TEXT = "Feed";
var CURRENT_PAGE_CLASS = "current-page";
var NO_ARTISTS_TITLE = "Follow artists to build your feed";
var MISSING_POSTS_WARN = "feed: Posts menu item not found";
/**
* Followed artists for Feed href / page recognition.
* Prefers the localStorage mirror (fresh across pages); GM_getValue on bfcache
* pages can return a frozen snapshot, so reloadFromStorage alone is not enough.
*/
function resolveFollowedArtistTags$1() {
	const mirrored = readArtistsMirror();
	if (mirrored !== null && mirrored.length > 0) return [...mirrored];
	return listArtistTags();
}
/**
* store load/save syncs the mirror from GM. On bfcache pages that GM snapshot
* is stale and would wipe tags followed on another page — restore afterward.
*/
function reloadStoragePreservingArtistsMirror() {
	const mirrored = readArtistsMirror();
	reloadFromStorage();
	if (mirrored !== null && mirrored.length > 0) writeArtistsMirror(mirrored);
}
var NEW_PLAQUE_LEFT_PX = 6;
var NEW_PLAQUE_TOP_PX = 6;
var NEW_PLAQUE_ACCENT = "#2f6fed";
var EVENT_PAGESHOW$1 = "pageshow";
var EVENT_CLICK$2 = "click";
var BODY_CLASS$3 = featureBodyClass(FEATURE_ID$8);
var FEATURE_CSS$8 = `
body.${BODY_CLASS$3} span.thumb.new.${THUMB_CLASS} {
  position: relative;
}
body.${BODY_CLASS$3} span.thumb.new.${THUMB_CLASS}::after {
  content: "NEW";
  position: absolute;
  z-index: 4;
  left: ${String(NEW_PLAQUE_LEFT_PX)}px;
  top: ${String(NEW_PLAQUE_TOP_PX)}px;
  background: ${NEW_PLAQUE_ACCENT};
  color: #fff;
  font: 700 9.5px system-ui, Segoe UI, sans-serif;
  letter-spacing: 0.05em;
  padding: 2px 6px;
  border-radius: 9px;
  pointer-events: none;
}
@supports (anchor-name: --a) {
  body.${BODY_CLASS$3} span.thumb.new.${THUMB_CLASS}::after {
    position-anchor: ${THUMB_ANCHOR_NAME};
    left: calc(anchor(left) + ${String(NEW_PLAQUE_LEFT_PX)}px);
    top: calc(anchor(top) + ${String(NEW_PLAQUE_TOP_PX)}px);
  }
}
`;
var unsubscribeThumbsAdded$3;
var pageshowBound$1 = false;
var boundFeedLink = null;
function findPostsMenuItem() {
	const content = document.getElementById(CONTENT_ID);
	const anchors = document.querySelectorAll("a");
	for (const node of anchors) {
		if (!(node instanceof HTMLAnchorElement)) continue;
		if ((node.textContent?.trim() ?? "") !== POSTS_LINK_TEXT) continue;
		const listItem = node.closest("li");
		if (listItem === null) continue;
		if (content !== null && content.contains(listItem)) continue;
		return listItem;
	}
	return null;
}
function resolveFeedHref() {
	const artistTags = resolveFollowedArtistTags$1();
	if (artistTags.length === 0) return RDW_HASH_FOLLOWING;
	return buildFeedUrl(artistTags, getUpdatesGroupSize());
}
function findFeedLink() {
	const feedItem = document.getElementById(FEED_MENU_ITEM_ID);
	if (!(feedItem instanceof HTMLLIElement)) return null;
	const feedLink = feedItem.querySelector("a");
	return feedLink instanceof HTMLAnchorElement ? feedLink : null;
}
/**
* Recalculate Feed href from current followed artists (bfcache / late follow).
* Uses the artists mirror first; falls back to a fresh GM read when the mirror
* is missing or empty (GM alone is unreliable after Follow + Back / bfcache).
*/
function refreshFeedHref() {
	const feedLink = findFeedLink();
	if (feedLink === null) return;
	feedLink.href = resolveFeedHref();
	if (resolveFollowedArtistTags$1().length === 0) feedLink.title = NO_ARTISTS_TITLE;
	else feedLink.removeAttribute("title");
}
function onPageShow$1() {
	refreshFeedHref();
}
function onFeedClick() {
	refreshFeedHref();
}
function ensureFeedHrefListeners(feedLink) {
	if (!pageshowBound$1) {
		pageshowBound$1 = true;
		window.addEventListener(EVENT_PAGESHOW$1, onPageShow$1);
	}
	if (boundFeedLink === feedLink) return;
	if (boundFeedLink !== null) boundFeedLink.removeEventListener(EVENT_CLICK$2, onFeedClick);
	feedLink.addEventListener(EVENT_CLICK$2, onFeedClick);
	boundFeedLink = feedLink;
}
function ensureFeedMenuItem() {
	const existing = document.getElementById(FEED_MENU_ITEM_ID);
	if (existing instanceof HTMLLIElement) {
		const existingLink = existing.querySelector("a");
		if (existingLink instanceof HTMLAnchorElement) {
			refreshFeedHref();
			ensureFeedHrefListeners(existingLink);
		}
		return existing;
	}
	const postsItem = findPostsMenuItem();
	if (postsItem === null) {
		log.warn(MISSING_POSTS_WARN);
		return null;
	}
	const feedItem = document.createElement("li");
	feedItem.id = FEED_MENU_ITEM_ID;
	const feedLink = document.createElement("a");
	feedLink.textContent = FEED_LINK_TEXT;
	feedLink.href = resolveFeedHref();
	if (resolveFollowedArtistTags$1().length === 0) feedLink.title = NO_ARTISTS_TITLE;
	feedItem.append(feedLink);
	postsItem.after(feedItem);
	ensureFeedHrefListeners(feedLink);
	return feedItem;
}
function isFeedPage(search, artistTags) {
	const tagsParam = new URLSearchParams(search).get(SEARCH_PARAM_TAGS);
	if (tagsParam === null || tagsParam.trim().length === 0) return false;
	return isFullUpdatesQuery(tagsParam, artistTags) || isPartialUpdatesQuery(tagsParam, artistTags);
}
function applyCurrentPageHighlight(feedItem, onFeed, pageKind) {
	const postsItem = findPostsMenuItem();
	if (onFeed) {
		postsItem?.classList.remove(CURRENT_PAGE_CLASS);
		feedItem.classList.add(CURRENT_PAGE_CLASS);
		return;
	}
	feedItem.classList.remove(CURRENT_PAGE_CLASS);
	if (pageKind === "list") postsItem?.classList.add(CURRENT_PAGE_CLASS);
}
function markNewThumbs(root, seenPostId) {
	if (seenPostId === 0) return;
	ensureDocumentStyles();
	const thumbs = root.querySelectorAll(SITE_SELECTORS.thumb);
	for (const thumb of thumbs) {
		if (!(thumb instanceof HTMLElement)) continue;
		const postId = extractPostIdFromThumb(thumb);
		if (postId === null) continue;
		const numeric = Number(postId);
		if (!Number.isFinite(numeric) || numeric <= seenPostId) continue;
		ensureThumbAnchor(thumb);
		thumb.classList.add("new");
	}
}
function ensureNewThumbsSubscription() {
	if (unsubscribeThumbsAdded$3 !== void 0) return;
	unsubscribeThumbsAdded$3 = onThumbsAdded((root) => {
		markNewThumbs(root, getSeenPostId());
	});
}
function mountFeed(ctx) {
	const feedItem = ensureFeedMenuItem();
	if (feedItem === null) return;
	const artistTags = resolveFollowedArtistTags$1();
	reloadStoragePreservingArtistsMirror();
	const onFeed = isFeedPage(ctx.search, artistTags);
	applyCurrentPageHighlight(feedItem, onFeed, ctx.pageKind);
	if (!onFeed || ctx.pageKind !== "list") return;
	markNewThumbs(document, getSeenPostId());
	ensureNewThumbsSubscription();
	mountUpdatesBar(document, ctx.search);
}
var feedFeature = {
	id: FEATURE_ID$8,
	label: FEATURE_LABEL$8,
	pages: [...FEATURE_PAGES$8],
	defaultEnabled: true,
	css: FEATURE_CSS$8,
	mount: mountFeed
};
var SEEN_DIM_FEATURE_ID = "seen-dim";
var SEEN_CLASS = "rdw-seen";
var SEEN_DIM_LABEL = "Dim seen posts";
var SEEN_DIM_OPACITY = "0.65";
var SEEN_DIM_HOVER_OPACITY = "1";
var EVENT_PAGESHOW = "pageshow";
var unsubscribeThumbsAdded$2;
var pageshowBound = false;
function stampSeenOnThumbs(root = document) {
	const marks = load().marks;
	const thumbs = root.querySelectorAll(SITE_SELECTORS.thumb);
	for (const thumb of thumbs) {
		if (!(thumb instanceof HTMLElement)) continue;
		const postId = extractPostIdFromThumb(thumb);
		if (postId === null) continue;
		thumb.classList.toggle(SEEN_CLASS, marks[postId]?.seen === true);
	}
}
function onPageShow(event) {
	if (!event.persisted) return;
	reloadFromStorage();
	stampSeenOnThumbs(document);
}
function ensureListSubscriptions$1() {
	if (unsubscribeThumbsAdded$2 === void 0) unsubscribeThumbsAdded$2 = onThumbsAdded((root) => {
		stampSeenOnThumbs(root);
	});
	if (!pageshowBound) {
		pageshowBound = true;
		window.addEventListener(EVENT_PAGESHOW, onPageShow);
	}
}
function mountSeenDim(ctx) {
	if (ctx.pageKind === "post") {
		const postId = readPostIdFromSearch(ctx.search);
		if (postId === null) {
			log.warn("seen-dim: missing post id in search", ctx.search);
			return;
		}
		setPostSeenMark(postId);
		return;
	}
	if (ctx.pageKind !== "list") return;
	stampSeenOnThumbs(document);
	ensureListSubscriptions$1();
}
var seenDimFeature = {
	id: SEEN_DIM_FEATURE_ID,
	label: SEEN_DIM_LABEL,
	pages: ["list", "post"],
	defaultEnabled: true,
	cssOnly: true,
	css: `
body.${featureBodyClass(SEEN_DIM_FEATURE_ID)} .${SEEN_CLASS} img.preview {
  opacity: ${SEEN_DIM_OPACITY};
}

body.${featureBodyClass(SEEN_DIM_FEATURE_ID)} .${SEEN_CLASS}:hover img.preview {
  opacity: ${SEEN_DIM_HOVER_OPACITY};
}
`,
	mount: mountSeenDim
};
var IMAGE_LIST_SELECTOR = SITE_SELECTORS.imageList;
var THUMB_SELECTOR = SITE_SELECTORS.thumb;
var PAGINATION_SELECTOR = "div.pagination";
var NEXT_LINK_SELECTOR = "a[alt=\"next\"]";
function resolveSameOriginUrl(url) {
	const absolute = new URL(url, window.location.href);
	if (absolute.origin !== window.location.origin) throw new Error(`Cross-origin next page URL rejected: ${absolute.origin}`);
	return absolute.href;
}
function readNextUrl(doc) {
	const pagination = doc.querySelector(PAGINATION_SELECTOR);
	if (pagination === null) return null;
	const nextLink = pagination.querySelector(NEXT_LINK_SELECTOR);
	if (!(nextLink instanceof HTMLAnchorElement)) return null;
	const href = nextLink.getAttribute("href");
	if (href === null || href.length === 0 || href === "#") return null;
	try {
		return resolveSameOriginUrl(href);
	} catch {
		return null;
	}
}
function collectThumbs(doc) {
	const imageList = doc.querySelector(IMAGE_LIST_SELECTOR);
	if (imageList === null) return [];
	return Array.from(imageList.querySelectorAll(THUMB_SELECTOR));
}
/**
* Fetches a list page HTML document and extracts thumbs + the next-page URL.
* Throws on network failure or non-OK HTTP status.
*/
async function fetchNextPage(url) {
	const requestUrl = resolveSameOriginUrl(url);
	const response = await fetch(requestUrl, {
		method: "GET",
		credentials: FETCH_CREDENTIALS
	});
	if (!response.ok) throw new Error(`HTTP ${String(response.status)}`);
	const html = await response.text();
	const doc = new DOMParser().parseFromString(html, "text/html");
	return {
		thumbs: collectThumbs(doc),
		nextUrl: readNextUrl(doc)
	};
}
var FEATURE_ID$7 = "infinite-scroll";
var FEATURE_LABEL$7 = "Infinite scroll";
var FEATURE_PAGES$7 = ["list"];
var BODY_FEATURE_CLASS$1 = featureBodyClass(FEATURE_ID$7);
/** Prefetch when remaining distance to list end ≤ this many viewport heights. */
var PREFETCH_REMAINING_VIEWPORT_HEIGHTS = 2;
var MIN_REQUEST_INTERVAL_MS = 1e3;
var CLASS_SENTINEL = "rdw-infinite-sentinel";
var CLASS_STATUS = "rdw-infinite-status";
var CLASS_SEPARATOR = "rdw-infinite-page";
var CLASS_RETRY = "rdw-infinite-retry";
var CLASS_BLACKLISTED = "rdw-blacklisted";
var TEXT_LOADING = "Loading…";
var TEXT_END = "End of results";
var TEXT_ERROR = "Failed to load more";
var TEXT_RETRY = "Retry";
var PAGE_LABEL_PREFIX = "Page ";
var PAGINATION_NEXT_SELECTOR = "div.pagination a[alt=\"next\"]";
var WARN_MISSING = "infinite-scroll: missing image-list or next link; not mounted";
var SCORE_TOKEN_PREFIX$1 = "score:";
var RATING_TOKEN_PREFIX = "rating:";
var FEATURE_CSS$7 = `
body.${BODY_FEATURE_CLASS$1} .${CLASS_SENTINEL} {
  display: block;
  width: 100%;
  height: 1px;
  margin: 0;
  padding: 0;
  border: 0;
  pointer-events: none;
}
body.${BODY_FEATURE_CLASS$1} .${CLASS_STATUS} {
  display: block;
  width: 100%;
  margin: 0.75rem 0;
  text-align: center;
  font-size: 0.875rem;
  line-height: 1.4;
}
body.${BODY_FEATURE_CLASS$1} .${CLASS_SEPARATOR} {
  display: block;
  width: 100%;
  margin: 0.75rem 0 0.5rem;
  text-align: center;
  font-size: 0.8125rem;
  font-weight: 600;
  opacity: 0.75;
}
body.${BODY_FEATURE_CLASS$1} .${CLASS_RETRY} {
  margin-left: 0.5rem;
  color: inherit;
  background: transparent;
  border: 1px solid currentColor;
  border-radius: 2px;
  padding: 0.15rem 0.5rem;
  cursor: pointer;
  font: inherit;
}
body.${BODY_FEATURE_CLASS$1} .${CLASS_RETRY}:focus-visible {
  outline: 2px solid #4c8bf5;
  outline-offset: 2px;
}
body.${BODY_FEATURE_CLASS$1} span.thumb.${CLASS_BLACKLISTED} {
  display: none !important;
}
`.trim();
function sleep(ms) {
	return new Promise((resolve) => {
		window.setTimeout(resolve, ms);
	});
}
function readInitialNextUrl() {
	const nextLink = document.querySelector(PAGINATION_NEXT_SELECTOR);
	if (!(nextLink instanceof HTMLAnchorElement)) return null;
	const href = nextLink.getAttribute("href");
	if (href === null || href.length === 0 || href === "#") return null;
	try {
		return new URL(href, window.location.href).href;
	} catch {
		return null;
	}
}
function parseThumbMeta(thumb) {
	const img = thumb.querySelector(SITE_SELECTORS.previewImage);
	const title = img?.getAttribute("title")?.trim() ?? "";
	const alt = img?.getAttribute("alt")?.trim() ?? "";
	const source = title.length > 0 ? title : alt;
	if (source.length === 0) return {
		tags: [],
		score: 0,
		rating: ""
	};
	const tags = [];
	let score = 0;
	let rating = "";
	for (const token of source.split(/\s+/)) {
		if (token.length === 0) continue;
		const lower = token.toLowerCase();
		if (lower.startsWith(SCORE_TOKEN_PREFIX$1)) {
			const raw = token.slice(6);
			const parsed = Number(raw);
			if (Number.isFinite(parsed)) score = parsed;
			continue;
		}
		if (lower.startsWith(RATING_TOKEN_PREFIX)) {
			rating = token.slice(7);
			continue;
		}
		tags.push(token);
	}
	return {
		tags,
		score,
		rating
	};
}
function collectExistingThumbIds() {
	const ids = /* @__PURE__ */ new Set();
	const thumbs = document.querySelectorAll(SITE_SELECTORS.thumb);
	for (const thumb of thumbs) if (thumb.id.length > 0) ids.add(thumb.id);
	return ids;
}
function applyBlacklist(thumb, list) {
	if (!(thumb instanceof HTMLElement)) return;
	const meta = parseThumbMeta(thumb);
	if (isBlacklisted(meta.tags, meta.score, meta.rating, list)) thumb.classList.add(CLASS_BLACKLISTED);
}
function createSeparator(pageNumber) {
	const separator = document.createElement("div");
	separator.className = CLASS_SEPARATOR;
	separator.textContent = `${PAGE_LABEL_PREFIX}${String(pageNumber)}`;
	return separator;
}
function createUi(imageList) {
	const sentinel = document.createElement("div");
	sentinel.className = CLASS_SENTINEL;
	sentinel.setAttribute("aria-hidden", "true");
	const status = document.createElement("div");
	status.className = CLASS_STATUS;
	status.setAttribute("role", "status");
	status.setAttribute("aria-live", "polite");
	imageList.after(sentinel, status);
	return {
		sentinel,
		status
	};
}
function setStatusLoading(status) {
	status.replaceChildren();
	status.textContent = TEXT_LOADING;
}
function setStatusEnd(status) {
	status.replaceChildren();
	status.textContent = TEXT_END;
}
function setStatusError(status, onRetry) {
	status.replaceChildren();
	const message = document.createElement("span");
	message.textContent = TEXT_ERROR;
	const retry = document.createElement("button");
	retry.type = "button";
	retry.className = CLASS_RETRY;
	retry.textContent = TEXT_RETRY;
	retry.addEventListener("click", (event) => {
		event.preventDefault();
		onRetry();
	});
	status.append(message, retry);
}
function clearStatus(status) {
	status.replaceChildren();
}
function prefetchRootMarginPx() {
	return PREFETCH_REMAINING_VIEWPORT_HEIGHTS * window.innerHeight;
}
function prefetchRootMarginCss() {
	return `${String(prefetchRootMarginPx())}px`;
}
/** True when the sentinel is within the prefetch margin of the viewport (IO may not re-fire). */
function isSentinelNear(sentinel) {
	const rect = sentinel.getBoundingClientRect();
	const marginPx = prefetchRootMarginPx();
	const viewBottom = window.innerHeight + marginPx;
	const viewTop = -marginPx;
	return rect.top < viewBottom && rect.bottom > viewTop;
}
function mountInfiniteScroll(_ctx) {
	const imageList = document.querySelector(SITE_SELECTORS.imageList);
	if (imageList === null) {
		log.warn(WARN_MISSING);
		return;
	}
	let nextUrl = readInitialNextUrl();
	if (nextUrl === null) {
		log.warn(WARN_MISSING);
		return;
	}
	const { sentinel, status } = createUi(imageList);
	let inFlight = false;
	let lastRequestAt = 0;
	let pageNumber = 1;
	let ended = false;
	let observer = null;
	const finish = () => {
		ended = true;
		nextUrl = null;
		setStatusEnd(status);
		if (observer !== null) {
			observer.disconnect();
			observer = null;
		}
	};
	const appendBatch = async (requestUrl) => {
		const result = await fetchNextPage(requestUrl);
		pageNumber += 1;
		imageList.append(createSeparator(pageNumber));
		const existingIds = collectExistingThumbIds();
		const blacklist = readSiteBlacklist();
		for (const thumb of result.thumbs) {
			if (thumb.id.length > 0 && existingIds.has(thumb.id)) continue;
			const node = document.importNode(thumb, true);
			if (node.id.length > 0) existingIds.add(node.id);
			applyBlacklist(node, blacklist);
			imageList.append(node);
		}
		notifyThumbsAdded(imageList);
		return result.nextUrl;
	};
	const loadMore = async (options) => {
		if (ended || inFlight || nextUrl === null) return;
		inFlight = true;
		let bypassRateLimit = options?.bypassRateLimit === true;
		try {
			while (!ended && nextUrl !== null && isSentinelNear(sentinel)) {
				const elapsed = Date.now() - lastRequestAt;
				if (!bypassRateLimit && lastRequestAt > 0 && elapsed < MIN_REQUEST_INTERVAL_MS) {
					await sleep(MIN_REQUEST_INTERVAL_MS - elapsed);
					continue;
				}
				bypassRateLimit = false;
				const requestUrl = nextUrl;
				lastRequestAt = Date.now();
				setStatusLoading(status);
				try {
					nextUrl = await appendBatch(requestUrl);
					clearStatus(status);
					if (nextUrl === null) {
						finish();
						return;
					}
				} catch (error) {
					log.warn("infinite-scroll: fetch failed", requestUrl, error);
					setStatusError(status, () => {
						loadMore({ bypassRateLimit: true });
					});
					return;
				}
			}
		} finally {
			inFlight = false;
		}
	};
	observer = new IntersectionObserver((entries) => {
		for (const entry of entries) {
			if (!entry.isIntersecting) continue;
			loadMore();
			break;
		}
	}, {
		root: null,
		rootMargin: prefetchRootMarginCss(),
		threshold: 0
	});
	observer.observe(sentinel);
}
var infiniteScrollFeature = {
	id: FEATURE_ID$7,
	label: FEATURE_LABEL$7,
	pages: [...FEATURE_PAGES$7],
	defaultEnabled: true,
	css: FEATURE_CSS$7,
	mount: mountInfiniteScroll
};
var AUTOCOMPLETE_PATH = "/public/autocomplete.php";
var AUTOCOMPLETE_TAG_TYPE_ARTIST = exports("bC","artist");
var HTTP_TOO_MANY_REQUESTS = 429;
var ABORT_ERROR_NAME = "AbortError";
var AutocompleteItemSchema = object({
	label: string(),
	value: string(),
	type: optional(nullable(string()))
});
var AutocompleteResponseSchema = array(AutocompleteItemSchema);
function buildAutocompleteUrl(query) {
	const params = new URLSearchParams();
	params.set("q", query);
	return `${SITE_ORIGIN}${AUTOCOMPLETE_PATH}?${params.toString()}`;
}
function isAbortError(error) {
	if (error instanceof DOMException && error.name === ABORT_ERROR_NAME) return true;
	if (typeof error !== "object" || error === null || !("name" in error)) return false;
	return error.name === ABORT_ERROR_NAME;
}
function normalizeItems(raw) {
	const result = [];
	for (const item of raw) {
		const type = item.type === null || item.type === void 0 ? void 0 : item.type;
		if (type === void 0) result.push({
			label: item.label,
			value: item.value
		});
		else result.push({
			label: item.label,
			value: item.value,
			type
		});
	}
	return result;
}
/** Artists (or another preferred type) first; relative order otherwise preserved. */
function preferSuggestionType(items, preferType) {
	const preferred = [];
	const rest = [];
	for (const item of items) if (item.type === preferType) preferred.push(item);
	else rest.push(item);
	return [...preferred, ...rest];
}
/**
* GET /public/autocomplete.php?q=… (site redirects to ac.rule34.xxx).
* Short queries and failed/429 responses return []. Aborts are silent.
*/
async function fetchAutocomplete(query, signal) {
	const trimmed = query.trim();
	if (trimmed.length < 2) return [];
	let response;
	try {
		const init = {
			method: "GET",
			credentials: FETCH_CREDENTIALS
		};
		if (signal !== void 0) init.signal = signal;
		response = await fetch(buildAutocompleteUrl(trimmed), init);
	} catch (error) {
		if (isAbortError(error) || signal?.aborted === true) return [];
		log.error("autocomplete: fetch failed", error);
		return [];
	}
	if (response.status === HTTP_TOO_MANY_REQUESTS) {
		log.warn("autocomplete: rate limited", response.status);
		return [];
	}
	if (!response.ok) {
		log.warn("autocomplete: HTTP error", response.status);
		return [];
	}
	let json;
	try {
		json = await response.json();
	} catch (error) {
		if (isAbortError(error) || signal?.aborted === true) return [];
		log.error("autocomplete: invalid JSON", error);
		return [];
	}
	const parsed = AutocompleteResponseSchema.safeParse(json);
	if (!parsed.success) {
		log.error("autocomplete: schema mismatch", parsed.error);
		return [];
	}
	return normalizeItems(parsed.data);
}
/**
* Debounced autocomplete with AbortController cancellation of the prior request.
* Queries shorter than {@link AUTOCOMPLETE_MIN_CHARS} resolve to [] without a network call.
*/
function createAutocompleteQuerier(options = {}) {
	let timer = null;
	let controller = null;
	const preferType = options.preferType;
	const cancel = () => {
		if (timer !== null) {
			clearTimeout(timer);
			timer = null;
		}
		if (controller !== null) {
			controller.abort();
			controller = null;
		}
	};
	const query = (text, onResult) => {
		cancel();
		const trimmed = text.trim();
		if (trimmed.length < 2) {
			onResult([]);
			return;
		}
		timer = setTimeout(() => {
			timer = null;
			const next = new AbortController();
			controller = next;
			fetchAutocomplete(trimmed, next.signal).then((items) => {
				if (next.signal.aborted) return;
				if (controller === next) controller = null;
				onResult(preferType === void 0 ? items : preferSuggestionType(items, preferType));
			});
		}, 300);
	};
	return {
		query,
		cancel
	};
}
/** `sort:random`, `score:>=10`, `id:>5`: a filter, not a tag name. */
var FILTER_MARK = ":";
var TRAILING_SPACE = /\s$/;
var LAST_TOKEN = /(\S+)$/;
var SYNTAX_TOKENS = [
	"(",
	")",
	"~"
];
/**
* The tag the caret is on, taken as the last token of the query.
* Null when the query ends with whitespace or the token is search syntax
* (`(`, `)`, `~`) or a filter such as `sort:random`.
*/
function readLastQueryToken(query) {
	if (query.length === 0 || TRAILING_SPACE.test(query)) return null;
	const match = LAST_TOKEN.exec(query);
	const token = match?.[1];
	if (match === null || token === void 0) return null;
	if (SYNTAX_TOKENS.includes(token) || token.includes(FILTER_MARK)) return null;
	const prefix = token.startsWith("-") && token.length > 1 ? "-" : "";
	const stem = token.slice(prefix.length);
	if (stem === "-") return null;
	return {
		head: query.slice(0, match.index),
		prefix,
		stem
	};
}
/** Query with its last token replaced by `tag`, ready for the next token. */
function completeLastQueryToken(query, tag) {
	const last = readLastQueryToken(query);
	if (last === null) return `${query}${tag} `;
	return `${last.head}${last.prefix}${tag} `;
}
/**
* Search-query input with the site tag autocomplete on the token being typed.
* Requests go out only while the user types, debounced, one at a time
* (see {@link createAutocompleteQuerier}).
*/
function QueryField(props) {
	const querierRef = T(createAutocompleteQuerier());
	const [suggestions, setSuggestions] = d([]);
	A(() => {
		const querier = querierRef.current;
		return () => {
			querier.cancel();
		};
	}, []);
	const clearSuggestions = () => {
		querierRef.current.cancel();
		setSuggestions([]);
	};
	const onTyped = (value) => {
		props.onChange(value);
		const last = readLastQueryToken(value);
		if (last === null) {
			clearSuggestions();
			return;
		}
		querierRef.current.query(last.stem, setSuggestions);
	};
	const onPicked = (option) => {
		props.onChange(completeLastQueryToken(props.value, option.value));
		clearSuggestions();
	};
	const optional = {
		...props.label === void 0 ? {} : { label: props.label },
		...props.placeholder === void 0 ? {} : { placeholder: props.placeholder },
		...props.id === void 0 ? {} : { id: props.id }
	};
	return /* @__PURE__ */ a(AutocompleteField, {
		...optional,
		value: props.value,
		suggestions,
		replaceOnSelect: false,
		onChange: onTyped,
		onSelect: onPicked
	});
}
var FEATURE_ID$6 = "playlist-bar";
var FEATURE_LABEL$6 = "Collection header";
var FEATURE_PAGES$6 = ["list"];
var ROOT_ID$1 = "rdw-playlist-bar";
var ROOT_CLASS$1 = "rdw-playlist-bar";
var TITLE_CLASS = "rdw-playlist-bar-title";
var NAME_CLASS = "rdw-playlist-bar-name";
var COUNT_CLASS = "rdw-playlist-bar-count";
var PARTS_CLASS = "rdw-playlist-bar-parts";
var PART_LABEL_CLASS = "rdw-playlist-bar-part-label";
var PART_LINK_CLASS = "rdw-playlist-bar-part-link";
var CAPTION_CLASS = "rdw-playlist-bar-caption";
var DYNAMIC_ROOT_ID = "rdw-dynamic-collection-bar";
var ACTIONS_CLASS = "rdw-dynamic-collection-actions";
var TEXT_POSTS_SUFFIX = " posts";
var TEXT_PART_PREFIX = "Part ";
var TEXT_PART_OF = " of ";
var TEXT_CAPTION = "Posts are ordered by the site (newest first).";
var TEXT_PREV = "Previous";
var TEXT_NEXT = "Next";
var TEXT_SHUFFLE = "Shuffle";
var TEXT_ORIGINAL_ORDER = "Original order";
var TEXT_EDIT_QUERY = "Edit query";
var TEXT_QUERY_LABEL = "Query";
var DIALOG_NONE = "none";
var DIALOG_EDIT_QUERY = "edit-query";
var DIALOG_RENAME = "rename";
var DIALOG_DELETE = "delete";
var DIALOG_VARIANT_FIELDS = "fields";
var DIALOG_VARIANT_CONFIRM = "confirm";
var DIALOG_TONE_DANGER = "danger";
var DIALOG_ONLY_NAME = "name";
var DIALOG_ONLY_QUERY = "query";
var BAR_BUTTON_VARIANT = "secondary";
var BAR_BUTTON_SIZE = "s";
/** Same heading size and button gap as the custom collection page. */
var NAME_FONT_PX = 18;
var ACTIONS_GAP_PX = 8;
var WARN_MISSING_HOST = "playlist-bar: image-list not found; playlist bar not mounted";
var BODY_CLASS$2 = featureBodyClass(FEATURE_ID$6);
var FEATURE_CSS$6 = `
body.${BODY_CLASS$2} .${ROOT_CLASS$1} {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-width: 100%;
  margin: 0.5rem 0;
  color: var(--rdw-text);
  box-sizing: border-box;
}
body.${BODY_CLASS$2} .${TITLE_CLASS} {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem 0.75rem;
  max-width: 100%;
  font: inherit;
  line-height: 1.3;
}
body.${BODY_CLASS$2} .${NAME_CLASS} {
  font-size: ${String(NAME_FONT_PX)}px;
  font-weight: 700;
}
body.${BODY_CLASS$2} .${COUNT_CLASS} {
  opacity: 0.85;
}
body.${BODY_CLASS$2} .${PARTS_CLASS} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.75rem;
  max-width: 100%;
  font: inherit;
  line-height: 1.3;
}
body.${BODY_CLASS$2} .${PART_LABEL_CLASS} {
  flex: 0 0 auto;
}
body.${BODY_CLASS$2} a.${PART_LINK_CLASS} {
  color: inherit;
  text-decoration: underline;
}
body.${BODY_CLASS$2} a.${PART_LINK_CLASS}:focus-visible {
  outline: 2px solid var(--rdw-accent);
  outline-offset: 2px;
}
body.${BODY_CLASS$2} .${CAPTION_CLASS} {
  margin: 0;
  font: inherit;
  font-size: 0.875rem;
  line-height: 1.35;
  opacity: 0.8;
}
body.${BODY_CLASS$2} .${ACTIONS_CLASS} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${String(ACTIONS_GAP_PX)}px;
  max-width: 100%;
}
`.trim();
function readTagsParam(search) {
	return new URLSearchParams(search).get("tags") ?? "";
}
function idsEqualAsSet(left, right) {
	if (left.length !== right.length) return false;
	const set = new Set(left);
	if (set.size !== left.length) return false;
	for (const id of right) if (!set.has(id)) return false;
	return true;
}
function containsAllIds(postIds, queryIds) {
	const set = new Set(postIds);
	for (const id of queryIds) if (!set.has(id)) return false;
	return true;
}
function findPlaylistMatch(queryIds) {
	const chunkSize = getPlaylistChunkSize();
	const candidates = [];
	for (const playlist of listPlaylists()) {
		const postIds = playlist.postIds ?? [];
		if (!containsAllIds(postIds, queryIds)) continue;
		const partQueries = buildPlaylistQueries(postIds, chunkSize);
		let partIndex = -1;
		for (let index = 0; index < partQueries.length; index += 1) {
			const chunkQuery = partQueries[index];
			if (chunkQuery === void 0) continue;
			const chunkIds = parsePlaylistQuery(chunkQuery);
			if (chunkIds !== null && idsEqualAsSet(queryIds, chunkIds)) {
				partIndex = index;
				break;
			}
		}
		candidates.push({
			playlist,
			partIndex,
			partQueries
		});
	}
	if (candidates.length === 0) return null;
	return candidates.find((entry) => entry.partIndex >= 0) ?? candidates[0] ?? null;
}
function buildPlaylistSearchUrl(query) {
	return buildSearchUrl(parseTags(query));
}
function removeExistingBar(root) {
	const existing = root instanceof Document ? root.getElementById(ROOT_ID$1) : root.querySelector(`#${ROOT_ID$1}`);
	if (existing !== null) existing.remove();
}
function findImageList(root) {
	return root.querySelector(SITE_SELECTORS.imageList);
}
function findFallbackHost(root) {
	return root.querySelector(SITE_SELECTORS.postListContent) ?? root.querySelector(SITE_SELECTORS.contentRoot);
}
function insertBar(host, bar, before) {
	if (before !== null && before.parentElement === host) {
		host.insertBefore(bar, before);
		return;
	}
	if (before !== null) {
		before.parentElement?.insertBefore(bar, before);
		return;
	}
	host.insertBefore(bar, host.firstChild);
}
function formatPostCount(count) {
	return `${String(count)}${TEXT_POSTS_SUFFIX}`;
}
function formatPartLabel(partIndex, total) {
	return `${TEXT_PART_PREFIX}${String(partIndex + 1)}${TEXT_PART_OF}${String(total)}`;
}
function appendNeighborLink(parent, label, query) {
	if (query === void 0) return;
	const link = document.createElement("a");
	link.className = PART_LINK_CLASS;
	link.href = buildPlaylistSearchUrl(query);
	link.textContent = label;
	parent.append(link);
}
function buildPartsRow(match) {
	const { partIndex, partQueries } = match;
	if (partQueries.length === 0 || partIndex < 0) return null;
	const row = document.createElement("div");
	row.className = PARTS_CLASS;
	const label = document.createElement("span");
	label.className = PART_LABEL_CLASS;
	label.textContent = formatPartLabel(partIndex, partQueries.length);
	row.append(label);
	if (partQueries.length > 1) {
		appendNeighborLink(row, TEXT_PREV, partQueries[partIndex - 1]);
		appendNeighborLink(row, TEXT_NEXT, partQueries[partIndex + 1]);
	}
	return row;
}
function createBar(match) {
	const bar = document.createElement("div");
	bar.id = ROOT_ID$1;
	bar.className = ROOT_CLASS$1;
	const title = document.createElement("div");
	title.className = TITLE_CLASS;
	const name = document.createElement("span");
	name.className = NAME_CLASS;
	name.textContent = match.playlist.name;
	const count = document.createElement("span");
	count.className = COUNT_CLASS;
	count.textContent = formatPostCount(match.playlist.postIds?.length ?? 0);
	title.append(name, count);
	bar.append(title);
	const parts = buildPartsRow(match);
	if (parts !== null) bar.append(parts);
	const caption = document.createElement("p");
	caption.className = CAPTION_CLASS;
	caption.textContent = TEXT_CAPTION;
	bar.append(caption);
	return bar;
}
function placeBar(bar) {
	const imageList = findImageList(document);
	if (imageList !== null) {
		const host = imageList.parentElement;
		if (host === null) {
			log.warn(WARN_MISSING_HOST);
			return false;
		}
		insertBar(host, bar, imageList);
		return true;
	}
	const fallback = findFallbackHost(document);
	if (fallback === null) {
		log.warn(WARN_MISSING_HOST);
		return false;
	}
	log.warn(WARN_MISSING_HOST);
	insertBar(fallback, bar, null);
	return true;
}
function storedDynamicQuery(collection) {
	if (collection.query !== void 0) return collection.query;
	return serialize(collection.tags);
}
function findDynamicCollection(tagsParam) {
	for (const collection of load().collections) {
		if (isPlaylist(collection)) continue;
		const stored = storedDynamicQuery(collection);
		if (withoutSortRandom(stored).length === 0) continue;
		if (queriesMatchIgnoringSortRandom(tagsParam, stored)) return collection;
	}
	return null;
}
function removeDynamicBar(root) {
	const existing = root instanceof Document ? root.getElementById(DYNAMIC_ROOT_ID) : root.querySelector(`#${DYNAMIC_ROOT_ID}`);
	if (!(existing instanceof HTMLElement)) return;
	Q$1(null, existing);
	existing.remove();
}
function deleteConfirmMessage(collectionName) {
	return `${UI_TEXT.confirmDelete} (${collectionName})`;
}
function navigateToQuery(query) {
	window.location.assign(buildSearchUrl(parseTags(query)));
}
function DynamicCollectionBar(props) {
	const [name, setName] = d(props.initialName);
	const [query, setQuery] = d(props.storedQuery);
	const [dialog, setDialog] = d(DIALOG_NONE);
	const [fields, setFields] = d({
		name: props.initialName,
		query: props.storedQuery
	});
	const shuffled = queryHasSortRandom(props.pageQuery);
	function closeDialog() {
		setDialog(DIALOG_NONE);
	}
	function openFields(kind) {
		setFields({
			name,
			query
		});
		setDialog(kind);
	}
	function onShuffle() {
		if (shuffled) {
			window.location.reload();
			return;
		}
		navigateToQuery(withSortRandom(props.pageQuery));
	}
	function onOriginalOrder() {
		navigateToQuery(withoutSortRandom(props.pageQuery));
	}
	function onEditSubmit() {
		if (fields.query.trim().length === 0) return;
		const updated = updateDynamicQuery(props.collectionId, fields.query);
		if (updated === null) return;
		const nextQuery = updated.query ?? serialize(updated.tags);
		setQuery(nextQuery);
		navigateToQuery(nextQuery);
	}
	function onRenameSubmit() {
		const trimmedName = fields.name.trim();
		if (trimmedName.length === 0) return;
		const renamed = renameCollection(props.collectionId, trimmedName);
		if (renamed === null) return;
		setName(renamed.name);
		closeDialog();
	}
	function onConfirmDelete() {
		if (!deleteCollection(props.collectionId)) {
			closeDialog();
			return;
		}
		const root = document.getElementById(DYNAMIC_ROOT_ID);
		if (!(root instanceof HTMLElement)) return;
		root.remove();
		Q$1(null, root);
	}
	const fieldsOpen = dialog === DIALOG_EDIT_QUERY || dialog === DIALOG_RENAME;
	const fieldsTitle = dialog === DIALOG_RENAME ? UI_TEXT.rename : TEXT_EDIT_QUERY;
	const onFieldsSubmit = dialog === DIALOG_RENAME ? onRenameSubmit : onEditSubmit;
	return k$1($$1, null, k$1("div", { className: TITLE_CLASS }, k$1("span", { className: NAME_CLASS }, name)), k$1("div", { className: ACTIONS_CLASS }, k$1(Button, {
		variant: BAR_BUTTON_VARIANT,
		size: BAR_BUTTON_SIZE,
		onClick: onShuffle
	}, TEXT_SHUFFLE), shuffled ? k$1(Button, {
		variant: BAR_BUTTON_VARIANT,
		size: BAR_BUTTON_SIZE,
		onClick: onOriginalOrder
	}, TEXT_ORIGINAL_ORDER) : null, k$1(Button, {
		variant: BAR_BUTTON_VARIANT,
		size: BAR_BUTTON_SIZE,
		onClick: () => {
			openFields(DIALOG_EDIT_QUERY);
		}
	}, TEXT_EDIT_QUERY), k$1(Button, {
		variant: BAR_BUTTON_VARIANT,
		size: BAR_BUTTON_SIZE,
		onClick: () => {
			openFields(DIALOG_RENAME);
		}
	}, UI_TEXT.rename), k$1(Button, {
		variant: DIALOG_TONE_DANGER,
		size: BAR_BUTTON_SIZE,
		onClick: () => {
			setDialog(DIALOG_DELETE);
		}
	}, UI_TEXT.delete)), fieldsOpen ? k$1(Dialog, {
		variant: DIALOG_VARIANT_FIELDS,
		open: true,
		title: fieldsTitle,
		fields,
		onFieldsChange: setFields,
		onSubmit: onFieldsSubmit,
		onClose: closeDialog,
		submitLabel: UI_TEXT.save,
		cancelLabel: UI_TEXT.cancel,
		nameLabel: UI_TEXT.nameLabel,
		queryLabel: TEXT_QUERY_LABEL,
		only: dialog === DIALOG_RENAME ? DIALOG_ONLY_NAME : DIALOG_ONLY_QUERY,
		renderQueryField: (field) => k$1(QueryField, field)
	}) : null, dialog === DIALOG_DELETE ? k$1(Dialog, {
		variant: DIALOG_VARIANT_CONFIRM,
		open: true,
		title: UI_TEXT.delete,
		message: deleteConfirmMessage(name),
		confirmLabel: UI_TEXT.confirm,
		cancelLabel: UI_TEXT.cancel,
		confirmTone: DIALOG_TONE_DANGER,
		onConfirm: onConfirmDelete,
		onClose: closeDialog
	}) : null);
}
var FIRST_PAGE_PID = "0";
function isFirstResultsPage(search) {
	const pid = new URLSearchParams(search).get("pid");
	return pid === null || pid.length === 0 || pid === FIRST_PAGE_PID;
}
/** Thumb URLs of the first posts in the grid, read from the page as it is. */
function readFirstThumbUrls() {
	const imageList = findImageList(document);
	if (imageList === null) return [];
	const urls = [];
	const images = imageList.querySelectorAll(`${SITE_SELECTORS.thumb} ${SITE_SELECTORS.previewImage}`);
	for (const image of images) {
		const src = image.getAttribute("src");
		if (src === null || src.trim().length === 0) continue;
		urls.push(src.trim());
		if (urls.length === 4) break;
	}
	return urls;
}
/**
* The card cover of a dynamic collection is whatever its first results page
* showed last. Shuffled pages and later pages are skipped. No request is made.
*/
function rememberDynamicCover(collectionId, tagsParam, search) {
	if (queryHasSortRandom(tagsParam) || !isFirstResultsPage(search)) return;
	setDynamicCover(collectionId, readFirstThumbUrls());
}
function mountDynamicBar(tagsParam, search) {
	const collection = findDynamicCollection(tagsParam);
	if (collection === null) return;
	rememberDynamicCover(collection.id, tagsParam, search);
	const bar = document.createElement("div");
	bar.id = DYNAMIC_ROOT_ID;
	bar.className = ROOT_CLASS$1;
	if (!placeBar(bar)) return;
	Q$1(k$1(DynamicCollectionBar, {
		collectionId: collection.id,
		initialName: collection.name,
		storedQuery: storedDynamicQuery(collection),
		pageQuery: tagsParam
	}), bar);
}
function mountPlaylistBar(ctx) {
	removeExistingBar(document);
	removeDynamicBar(document);
	const tagsParam = readTagsParam(ctx.search);
	const queryIds = parsePlaylistQuery(tagsParam);
	if (queryIds !== null) {
		const match = findPlaylistMatch(queryIds);
		if (match !== null) placeBar(createBar(match));
	}
	mountDynamicBar(tagsParam, ctx.search);
}
var playlistBarFeature = {
	id: FEATURE_ID$6,
	label: FEATURE_LABEL$6,
	pages: [...FEATURE_PAGES$6],
	defaultEnabled: true,
	css: FEATURE_CSS$6,
	mount: mountPlaylistBar
};
var FEATURE_ID$5 = "playlist-menu";
var FEATURE_LABEL$5 = "Add to collection button";
var FEATURE_PAGES$5 = ["list", "post"];
var CLASS_ADD = "rdw-playlist-add";
var CLASS_ADD_IN = "rdw-playlist-add--in";
var CLASS_MENU = "rdw-playlist-menu";
var CLASS_MENU_POPUP = "rdw-playlist-menu--popup";
var CLASS_LIST = "rdw-playlist-menu-list";
var CLASS_ITEM$2 = "rdw-playlist-menu-item";
var CLASS_CHECK$1 = "rdw-playlist-menu-check";
var CLASS_NAME$2 = "rdw-playlist-menu-name";
var CLASS_NEW$1 = "rdw-playlist-menu-new";
var CLASS_NEW_FORM$1 = "rdw-playlist-menu-new-form";
var CLASS_NEW_INPUT = "rdw-playlist-menu-new-input";
var CLASS_NEW_SUBMIT = "rdw-playlist-menu-new-submit";
var ATTR_POST_ID = "data-rdw-post-id";
var TEXT_ADD_GLYPH = "+";
var TEXT_NEW_PLAYLIST = "New collection…";
var TEXT_CREATE$1 = "Create";
var TEXT_CHECK_MARK = "✓";
var LABEL_ADD = "Add to collection";
var LABEL_TOGGLE_PREFIX$1 = "Toggle collection";
var LABEL_NEW_NAME = "New collection name";
var MENU_Z_INDEX = 2147483645;
var MENU_MIN_WIDTH_PX = 180;
var MENU_MAX_HEIGHT_PX = 280;
var MENU_GAP_PX = 4;
var BUTTON_SIZE_PX = 28;
var BUTTON_OFFSET_PX = 6;
var BUTTON_BELOW_FAV_TOP_PX = 38;
var FOCUS_OUTLINE = "2px solid #4c8bf5";
var FOCUS_OUTLINE_OFFSET = "2px";
var EVENT_KEYDOWN = "keydown";
var EVENT_POINTERDOWN = "pointerdown";
var KEY_ESCAPE = "Escape";
var KEY_ENTER$2 = "Enter";
var BODY_SELECTOR$3 = `body.${featureBodyClass(FEATURE_ID$5)}`;
var FEATURE_CSS$5 = `
${BODY_SELECTOR$3} .${CLASS_ADD} {
  position: absolute;
  top: ${String(BUTTON_BELOW_FAV_TOP_PX)}px;
  right: ${String(BUTTON_OFFSET_PX)}px;
  position-anchor: --rdw-img;
  top: calc(anchor(top) + ${String(BUTTON_BELOW_FAV_TOP_PX)}px);
  right: calc(anchor(right) + ${String(BUTTON_OFFSET_PX)}px);
  z-index: 5;
  box-sizing: border-box;
  display: inline-grid;
  place-items: center;
  min-width: ${String(BUTTON_SIZE_PX)}px;
  min-height: ${String(BUTTON_SIZE_PX)}px;
  width: ${String(BUTTON_SIZE_PX)}px;
  height: ${String(BUTTON_SIZE_PX)}px;
  padding: 0;
  border: 1px solid rgba(0, 0, 0, 0.13);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.93);
  color: #1c2228;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  opacity: 0;
}
${BODY_SELECTOR$3} .${THUMB_CLASS}:hover .${CLASS_ADD},
${BODY_SELECTOR$3} .${CLASS_ADD}:focus-visible {
  opacity: 0.65;
}
${BODY_SELECTOR$3} .${THUMB_CLASS} .${CLASS_ADD}:hover,
${BODY_SELECTOR$3} .${CLASS_ADD}:focus-visible {
  opacity: 1;
}
${BODY_SELECTOR$3} .${CLASS_ADD}:focus-visible {
  outline: ${FOCUS_OUTLINE};
  outline-offset: ${FOCUS_OUTLINE_OFFSET};
}
${BODY_SELECTOR$3} .${CLASS_ADD}.${CLASS_ADD_IN} {
  background: #ffd75e;
  border-color: #c79a00;
  color: #5c4500;
}
${BODY_SELECTOR$3} .${CLASS_MENU} {
  box-sizing: border-box;
  min-width: ${String(MENU_MIN_WIDTH_PX)}px;
  max-height: ${String(MENU_MAX_HEIGHT_PX)}px;
  overflow: auto;
  padding: 0.35rem;
  border: 1px solid #444;
  border-radius: 4px;
  background: #fff;
  color: #1a1a1a;
  font: 13px/1.3 Segoe UI, system-ui, sans-serif;
}
${BODY_SELECTOR$3} .${CLASS_MENU}.${CLASS_MENU_POPUP} {
  position: fixed;
  z-index: ${String(MENU_Z_INDEX)};
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
}
${BODY_SELECTOR$3} .${CLASS_LIST} {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  margin: 0 0 0.35rem;
  padding: 0;
  list-style: none;
}
${BODY_SELECTOR$3} .${CLASS_ITEM$2} {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  width: 100%;
  margin: 0;
  padding: 0.25rem 0.35rem;
  border: 0;
  border-radius: 2px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
${BODY_SELECTOR$3} .${CLASS_ITEM$2}:hover,
${BODY_SELECTOR$3} .${CLASS_ITEM$2}:focus-visible {
  background: #e8f0fe;
}
${BODY_SELECTOR$3} .${CLASS_ITEM$2}:focus-visible {
  outline: ${FOCUS_OUTLINE};
  outline-offset: ${FOCUS_OUTLINE_OFFSET};
}
${BODY_SELECTOR$3} .${CLASS_CHECK$1} {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  flex: 0 0 1rem;
  font-weight: 700;
}
${BODY_SELECTOR$3} .${CLASS_NAME$2} {
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
${BODY_SELECTOR$3} .${CLASS_NEW$1},
${BODY_SELECTOR$3} .${CLASS_NEW_SUBMIT} {
  display: block;
  width: 100%;
  box-sizing: border-box;
  margin: 0;
  padding: 0.3rem 0.4rem;
  border: 1px solid #666;
  border-radius: 2px;
  background: #f5f5f5;
  color: inherit;
  font: inherit;
  cursor: pointer;
  text-align: left;
}
${BODY_SELECTOR$3} .${CLASS_NEW$1}:focus-visible,
${BODY_SELECTOR$3} .${CLASS_NEW_SUBMIT}:focus-visible,
${BODY_SELECTOR$3} .${CLASS_NEW_INPUT}:focus-visible {
  outline: ${FOCUS_OUTLINE};
  outline-offset: ${FOCUS_OUTLINE_OFFSET};
}
${BODY_SELECTOR$3} .${CLASS_NEW_FORM$1} {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
${BODY_SELECTOR$3} .${CLASS_NEW_INPUT} {
  box-sizing: border-box;
  width: 100%;
  margin: 0;
  padding: 0.3rem 0.4rem;
  border: 1px solid #666;
  border-radius: 2px;
  font: inherit;
}
`;
var NO_THUMB_URL = () => null;
var unsubscribeThumbsAdded$1;
var openPopup = null;
var escapeBound = false;
var pointerBound = false;
function parsePostId(value) {
	if (value === null || value.length === 0) return null;
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) return null;
	const truncated = Math.trunc(parsed);
	return truncated < 0 ? null : truncated;
}
function postInAnyPlaylist(postId) {
	return playlistsContaining(postId).length > 0;
}
function applyAddButtonState(button, postId) {
	const inPlaylist = postInAnyPlaylist(postId);
	button.classList.toggle(CLASS_ADD_IN, inPlaylist);
	button.setAttribute("aria-pressed", inPlaylist ? "true" : "false");
	button.setAttribute("aria-label", `${LABEL_ADD} ${String(postId)}`);
}
function postAnchorSelector(postId) {
	return `#p${postId}`;
}
function readImageAddress(img) {
	const current = img.currentSrc.trim();
	if (current.length > 0) return current;
	const attribute = img.getAttribute("src");
	if (attribute === null) return null;
	const trimmed = attribute.trim();
	if (trimmed.length === 0) return null;
	return trimmed;
}
/**
* Thumb URL from this post's `img.preview`.
* A preview outside `a#p{id}` wins. The copy nested in the link is used only
* when that is the only preview (rule34 puts `img.preview` inside the anchor).
*/
function readPreviewThumbUrl(thumb, postId) {
	const anchor = thumb.querySelector(postAnchorSelector(postId));
	const images = thumb.querySelectorAll(SITE_SELECTORS.previewImage);
	let nestedImage = null;
	for (const node of images) {
		if (!(node instanceof HTMLImageElement)) continue;
		if (anchor instanceof Element && anchor.contains(node)) {
			if (nestedImage === null) nestedImage = node;
			continue;
		}
		const url = readImageAddress(node);
		if (url !== null) return url;
	}
	if (nestedImage === null) return null;
	return readImageAddress(nestedImage);
}
function readThumbUrlFromTrigger(button) {
	const postId = button.getAttribute(ATTR_POST_ID);
	if (postId === null || postId.length === 0) return null;
	const thumb = button.closest(SITE_SELECTORS.thumb);
	if (!(thumb instanceof HTMLElement)) return null;
	return readPreviewThumbUrl(thumb, postId);
}
function addPostWithThumb$1(collectionId, postId, readThumbUrl) {
	const thumbUrl = readThumbUrl();
	if (thumbUrl !== null) {
		addPostToCollection(collectionId, postId, thumbUrl);
		return;
	}
	addPostToCollection(collectionId, postId);
}
function findThumbLink$1(thumb, postId) {
	const byId = thumb.querySelector(postAnchorSelector(postId));
	if (byId instanceof HTMLAnchorElement) return byId;
	const byHref = thumb.querySelector(SITE_SELECTORS.thumbLink);
	return byHref instanceof HTMLAnchorElement ? byHref : null;
}
function closeOpenMenu() {
	if (openPopup === null) return;
	openPopup.menu.remove();
	openPopup.trigger.setAttribute("aria-expanded", "false");
	openPopup = null;
	unbindGlobalCloseListeners();
}
function onDocumentKeydown(event) {
	if (event.key !== KEY_ESCAPE) return;
	if (openPopup === null) return;
	event.preventDefault();
	closeOpenMenu();
}
function onDocumentPointerDown(event) {
	if (openPopup === null) return;
	const target = event.target;
	if (!(target instanceof Node)) return;
	if (openPopup.menu.contains(target) || openPopup.trigger.contains(target)) return;
	closeOpenMenu();
}
function bindGlobalCloseListeners() {
	if (!escapeBound) {
		escapeBound = true;
		document.addEventListener(EVENT_KEYDOWN, onDocumentKeydown);
	}
	if (!pointerBound) {
		pointerBound = true;
		document.addEventListener(EVENT_POINTERDOWN, onDocumentPointerDown, true);
	}
}
function unbindGlobalCloseListeners() {
	if (escapeBound) {
		document.removeEventListener(EVENT_KEYDOWN, onDocumentKeydown);
		escapeBound = false;
	}
	if (pointerBound) {
		document.removeEventListener(EVENT_POINTERDOWN, onDocumentPointerDown, true);
		pointerBound = false;
	}
}
function positionMenuNear(menu, anchor) {
	const rect = anchor.getBoundingClientRect();
	const viewportWidth = window.innerWidth;
	const viewportHeight = window.innerHeight;
	menu.style.visibility = "hidden";
	menu.style.left = "0";
	menu.style.top = "0";
	document.body.append(menu);
	const menuWidth = menu.offsetWidth;
	const menuHeight = menu.offsetHeight;
	let left = rect.right - menuWidth;
	if (left < MENU_GAP_PX) left = Math.min(rect.left, viewportWidth - menuWidth - MENU_GAP_PX);
	left = Math.max(MENU_GAP_PX, Math.min(left, viewportWidth - menuWidth - MENU_GAP_PX));
	let top = rect.bottom + MENU_GAP_PX;
	if (top + menuHeight > viewportHeight - MENU_GAP_PX) top = rect.top - menuHeight - MENU_GAP_PX;
	if (top < MENU_GAP_PX) top = MENU_GAP_PX;
	menu.style.left = `${String(left)}px`;
	menu.style.top = `${String(top)}px`;
	menu.style.visibility = "";
}
function syncAddButtonsForPost(postId) {
	const buttons = document.querySelectorAll(`button.${CLASS_ADD}[${ATTR_POST_ID}="${String(postId)}"]`);
	for (const node of buttons) {
		if (!(node instanceof HTMLButtonElement)) continue;
		applyAddButtonState(node, postId);
	}
}
function fillPlaylistList(list, postId, readThumbUrl) {
	list.replaceChildren();
	const playlists = listPlaylists();
	const memberIds = new Set(playlistsContaining(postId).map((item) => item.id));
	for (const playlist of playlists) {
		const item = document.createElement("button");
		item.type = "button";
		item.className = CLASS_ITEM$2;
		item.setAttribute("role", "menuitemcheckbox");
		const checked = memberIds.has(playlist.id);
		item.setAttribute("aria-checked", checked ? "true" : "false");
		item.setAttribute("aria-label", `${LABEL_TOGGLE_PREFIX$1} ${playlist.name}`);
		const check = document.createElement("span");
		check.className = CLASS_CHECK$1;
		check.setAttribute("aria-hidden", "true");
		check.textContent = checked ? TEXT_CHECK_MARK : "";
		const name = document.createElement("span");
		name.className = CLASS_NAME$2;
		name.textContent = playlist.name;
		item.append(check, name);
		item.addEventListener("click", (event) => {
			event.preventDefault();
			event.stopPropagation();
			if (memberIds.has(playlist.id)) removePostFromPlaylist(playlist.id, postId);
			else addPostWithThumb$1(playlist.id, postId, readThumbUrl);
			fillPlaylistList(list, postId, readThumbUrl);
			syncAddButtonsForPost(postId);
		});
		list.append(item);
	}
}
function showNewPlaylistForm(host, list, postId, readThumbUrl, onCreated) {
	host.replaceChildren();
	const form = document.createElement("div");
	form.className = CLASS_NEW_FORM$1;
	const input = document.createElement("input");
	input.type = "text";
	input.className = CLASS_NEW_INPUT;
	input.setAttribute("aria-label", LABEL_NEW_NAME);
	input.autocomplete = "off";
	const submit = document.createElement("button");
	submit.type = "button";
	submit.className = CLASS_NEW_SUBMIT;
	submit.textContent = TEXT_CREATE$1;
	const commit = () => {
		const name = input.value.trim();
		if (name.length === 0) return;
		addPostWithThumb$1(createPlaylist(name).id, postId, readThumbUrl);
		fillPlaylistList(list, postId, readThumbUrl);
		syncAddButtonsForPost(postId);
		onCreated?.();
	};
	submit.addEventListener("click", (event) => {
		event.preventDefault();
		event.stopPropagation();
		commit();
	});
	input.addEventListener("keydown", (event) => {
		if (event.key !== KEY_ENTER$2) return;
		event.preventDefault();
		event.stopPropagation();
		commit();
	});
	form.append(input, submit);
	host.append(form);
	input.focus();
}
function mountNewPlaylistControl(host, list, postId, readThumbUrl, onCreated) {
	host.replaceChildren();
	const button = document.createElement("button");
	button.type = "button";
	button.className = CLASS_NEW$1;
	button.textContent = TEXT_NEW_PLAYLIST;
	button.addEventListener("click", (event) => {
		event.preventDefault();
		event.stopPropagation();
		showNewPlaylistForm(host, list, postId, readThumbUrl, onCreated);
	});
	host.append(button);
}
/**
* Builds the playlist membership menu for a post (list popup or post-actions).
* Callers own placement; list page uses a single floating instance.
*/
function createPlaylistMenu(postId, options) {
	const readThumbUrl = options?.readThumbUrl ?? NO_THUMB_URL;
	const root = document.createElement("div");
	root.className = CLASS_MENU;
	root.setAttribute("role", "menu");
	root.setAttribute(ATTR_POST_ID, String(postId));
	const list = document.createElement("div");
	list.className = CLASS_LIST;
	list.setAttribute("role", "group");
	fillPlaylistList(list, postId, readThumbUrl);
	const newHost = document.createElement("div");
	mountNewPlaylistControl(newHost, list, postId, readThumbUrl, options?.onCreated);
	root.append(list, newHost);
	return root;
}
function openMenuForButton(button, postId) {
	if (openPopup !== null && openPopup.trigger === button) {
		closeOpenMenu();
		return;
	}
	closeOpenMenu();
	const menu = createPlaylistMenu(postId, {
		onCreated: () => {
			closeOpenMenu();
		},
		readThumbUrl: () => readThumbUrlFromTrigger(button)
	});
	menu.classList.add(CLASS_MENU_POPUP);
	positionMenuNear(menu, button);
	button.setAttribute("aria-expanded", "true");
	openPopup = {
		menu,
		trigger: button,
		postId
	};
	bindGlobalCloseListeners();
}
function attachAddButton(thumb, postId) {
	if (thumb.querySelector(`button.${CLASS_ADD}`) !== null) return;
	const numericId = parsePostId(postId);
	if (numericId === null) return;
	const link = findThumbLink$1(thumb, postId);
	if (link === null) return;
	ensureThumbAnchor(thumb);
	const button = document.createElement("button");
	button.type = "button";
	button.className = `${KIT_ICON_BUTTON_CLASS} ${CLASS_ADD}`;
	button.textContent = TEXT_ADD_GLYPH;
	button.setAttribute(ATTR_POST_ID, String(numericId));
	button.setAttribute("aria-haspopup", "menu");
	button.setAttribute("aria-expanded", "false");
	applyAddButtonState(button, numericId);
	button.addEventListener("click", (event) => {
		event.preventDefault();
		event.stopPropagation();
		openMenuForButton(button, numericId);
	});
	link.after(button);
}
function stampPlaylistButtons(root = document) {
	const thumbs = root.querySelectorAll(SITE_SELECTORS.thumb);
	for (const thumb of thumbs) {
		if (!(thumb instanceof HTMLElement)) continue;
		const postId = extractPostIdFromThumb(thumb);
		if (postId === null) continue;
		attachAddButton(thumb, postId);
	}
}
function ensureListSubscriptions() {
	if (unsubscribeThumbsAdded$1 !== void 0) return;
	unsubscribeThumbsAdded$1 = onThumbsAdded((root) => {
		stampPlaylistButtons(root);
	});
}
function mountPlaylistMenu(ctx) {
	if (ctx.pageKind !== "list") return;
	stampPlaylistButtons(document);
	ensureListSubscriptions();
}
var playlistMenuFeature = {
	id: FEATURE_ID$5,
	label: FEATURE_LABEL$5,
	pages: [...FEATURE_PAGES$5],
	defaultEnabled: true,
	css: FEATURE_CSS$5,
	mount: mountPlaylistMenu
};
var CLASS_STRIP = "rdw-post-panel-collection-queue";
var CLASS_NAME$1 = "rdw-post-panel-collection-queue-name";
var CLASS_POSITION = "rdw-post-panel-collection-queue-position";
var CLASS_NAV = "rdw-post-panel-collection-queue-nav";
var CLASS_FOCUSABLE = "rdw-kit-focusable";
var GLYPH_PREVIOUS = "‹";
var GLYPH_NEXT = "›";
var LABEL_PREVIOUS = "Previous post in collection";
var LABEL_NEXT = "Next post in collection";
var ARIA_QUEUE = "Collection queue";
var POSITION_SEPARATOR = " / ";
var INDEX_NOT_FOUND = -1;
var POSITION_BASE = 1;
var EVENT_HASHCHANGE = "hashchange";
var EVENT_CLICK$1 = "click";
var MOUSE_BUTTON_PRIMARY = 0;
var QUEUE_GAP_PX = 8;
var NAME_FONT_WEIGHT = 600;
var NAV_DISABLED_OPACITY = .55;
var POST_VIEW_QUERY = `${SEARCH_PARAM_PAGE}=${SEARCH_PAGE}&s=${SEARCH_SECTION_VIEW}`;
var QUEUE_CSS = `
${KIT_FOCUS_CSS}
.${CLASS_STRIP} {
  display: flex;
  align-items: center;
  gap: ${String(QUEUE_GAP_PX)}px;
  min-width: 0;
}
.${CLASS_NAME$1} {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--rdw-accent);
  font-weight: ${String(NAME_FONT_WEIGHT)};
  text-decoration: none;
}
.${CLASS_POSITION} {
  flex: 0 0 auto;
  color: var(--rdw-muted);
  font-variant-numeric: tabular-nums;
}
a.${CLASS_NAV},
button.${CLASS_NAV} {
  box-sizing: border-box;
  flex: 0 0 auto;
  display: inline-grid;
  place-items: center;
  width: ${String(28)}px;
  height: ${String(28)}px;
  margin: 0;
  padding: 0;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-surface);
  color: var(--rdw-text);
  font: inherit;
  line-height: 1;
  text-decoration: none;
  cursor: pointer;
}
button.${CLASS_NAV}:disabled {
  opacity: ${String(NAV_DISABLED_OPACITY)};
  cursor: not-allowed;
}
`;
function readCollectionQueueId(hash) {
	if (!hash.startsWith("#rdw-c=")) return null;
	const raw = hash.slice(RDW_COLLECTION_QUEUE_HASH_PREFIX.length).trim();
	if (raw.length === 0) return null;
	try {
		return decodeURIComponent(raw);
	} catch {
		return raw;
	}
}
function readLocationHash() {
	return window.location.hash;
}
function collectionName(collectionId) {
	for (const playlist of listPlaylists()) if (playlist.id === collectionId) return playlist.name;
	return null;
}
function indexOfPost(order, postId) {
	for (let index = 0; index < order.length; index += 1) if (order[index] === postId) return index;
	return INDEX_NOT_FOUND;
}
function neighborPostHref(postId, queueHash) {
	return `${SEARCH_PATH}?${POST_VIEW_QUERY}&id=${String(postId)}${queueHash}`;
}
function hrefAt(order, index, queueHash) {
	if (index < 0 || index >= order.length) return null;
	const postId = order[index];
	if (postId === void 0) return null;
	return neighborPostHref(postId, queueHash);
}
function readQueue(postId, hash) {
	if (postId === null) return null;
	const collectionId = readCollectionQueueId(hash);
	if (collectionId === null) return null;
	const order = getCollectionOrder(collectionId);
	if (order === null) return null;
	const index = indexOfPost(order, postId);
	if (index === INDEX_NOT_FOUND) return null;
	const name = collectionName(collectionId);
	if (name === null) return null;
	const position = index + POSITION_BASE;
	return {
		name,
		collectionHref: collectionDetailHash(collectionId),
		positionLabel: `${String(position)}${POSITION_SEPARATOR}${String(order.length)}`,
		previousHref: hrefAt(order, index - 1, hash),
		nextHref: hrefAt(order, index + 1, hash)
	};
}
/**
* Steps inside a collection replace the history entry, so the browser Back
* button returns to the collection page instead of the previous post.
*/
function goToQueuePost(href) {
	window.location.replace(href);
}
function QueueStep(props) {
	const className = `${CLASS_NAV} ${CLASS_FOCUSABLE}`;
	if (props.href === null) return /* @__PURE__ */ a("button", {
		type: "button",
		className,
		disabled: true,
		"aria-label": props.label,
		children: props.glyph
	});
	const href = props.href;
	return /* @__PURE__ */ a("a", {
		className,
		href,
		"aria-label": props.label,
		onClick: (event) => {
			if (!isPlainPrimaryClick(event)) return;
			event.preventDefault();
			goToQueuePost(href);
		},
		children: props.glyph
	});
}
function isPlainPrimaryClick(event) {
	return event.button === MOUSE_BUTTON_PRIMARY && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}
function clickedSiteStep(event, steps) {
	const target = event.target;
	if (!(target instanceof Element)) return null;
	for (const step of steps) if (target.closest(step.selector) !== null) return step;
	return null;
}
/**
* While a post is open from a collection, the site's own "< previous / next >"
* links step through the collection instead of the last search. The click is
* taken in the capture phase so the site handler never runs; at either end of
* the collection the click does nothing. The links themselves are not changed.
*/
function useSiteStepLinks(previousHref, nextHref, active) {
	A(() => {
		if (!active) return;
		const steps = [{
			selector: SITE_SELECTORS.postPrevSearchLink,
			href: previousHref
		}, {
			selector: SITE_SELECTORS.postNextSearchLink,
			href: nextHref
		}];
		const onClick = (event) => {
			if (!isPlainPrimaryClick(event)) return;
			const step = clickedSiteStep(event, steps);
			if (step === null) return;
			event.preventDefault();
			event.stopImmediatePropagation();
			if (step.href !== null) goToQueuePost(step.href);
		};
		document.addEventListener(EVENT_CLICK$1, onClick, true);
		return () => {
			document.removeEventListener(EVENT_CLICK$1, onClick, true);
		};
	}, [
		previousHref,
		nextHref,
		active
	]);
}
function CollectionQueue(props) {
	const [hash, setHash] = d(readLocationHash);
	A(() => {
		const onHashChange = () => {
			setHash(readLocationHash());
		};
		window.addEventListener(EVENT_HASHCHANGE, onHashChange);
		return () => {
			window.removeEventListener(EVENT_HASHCHANGE, onHashChange);
		};
	}, []);
	const queue = readQueue(props.postId, hash);
	useSiteStepLinks(queue === null ? null : queue.previousHref, queue === null ? null : queue.nextHref, queue !== null);
	if (queue === null) return null;
	return /* @__PURE__ */ a("nav", {
		className: CLASS_STRIP,
		"aria-label": ARIA_QUEUE,
		children: [
			/* @__PURE__ */ a("style", { children: QUEUE_CSS }),
			/* @__PURE__ */ a("a", {
				className: `${CLASS_NAME$1} ${CLASS_FOCUSABLE}`,
				href: queue.collectionHref,
				children: queue.name
			}),
			/* @__PURE__ */ a("span", {
				className: CLASS_POSITION,
				children: queue.positionLabel
			}),
			/* @__PURE__ */ a(QueueStep, {
				label: LABEL_PREVIOUS,
				glyph: GLYPH_PREVIOUS,
				href: queue.previousHref
			}),
			/* @__PURE__ */ a(QueueStep, {
				label: LABEL_NEXT,
				glyph: GLYPH_NEXT,
				href: queue.nextHref
			})
		]
	});
}
/**
* DOM-ready scheduling helpers. Favorites sync resume lives in deferred app start
* so this module stays off the favs/storage import path.
*/
/**
* Run `callback` once the document is interactive enough for body mounts.
* At document-start, waits for DOMContentLoaded; if already past that, runs now.
*/
function whenDomReady(callback) {
	if (document.readyState === "interactive" || document.readyState === "complete") {
		callback();
		return;
	}
	document.addEventListener("DOMContentLoaded", callback, { once: true });
}
/**
* After first paint: rAF → zero-delay task → callback.
* Use for feature mounts and heavy module work.
*/
function scheduleAfterFirstPaint(callback) {
	requestAnimationFrame(() => {
		setTimeout(callback, 0);
	});
}
/** Read-only helpers for native post-page markup used by the side panel. */
var LINK_LIST_SELECTOR = "div.link-list ul";
var STATS_SELECTOR = "div#stats";
var FLEXI_SELECTOR = "#fit-to-screen div.flexi, div#right-col div.flexi, div.flexi";
var IMAGE_ID = "image";
var HEADER_SELECTOR = "div#header";
var POST_COMMENTS_ID = "post-comments";
var COMMENT_LIST_ID = "comment-list";
var MORE_LINK_TEXTS = [
	"Edit",
	"Resize image",
	"Report to moderation",
	"Add Note"
];
var SCORE_SPAN_ID_PREFIX = "psc";
var STAT_PREFIX_RE = /^(Id|Posted|Size|Source|Rating|Score)\s*:/i;
var WHITESPACE_RE = /\s+/g;
var BY_SPLIT_RE = /\bby\b/i;
var DIGITS_ONLY_RE = /^\d+$/;
var COUNTER_CANDIDATE_SELECTOR = "span, b, strong, em, small";
var SOURCE_REL = "nofollow noreferrer";
function isMoreLinkText(value) {
	for (const entry of MORE_LINK_TEXTS) if (entry === value) return true;
	return false;
}
function normalizeSpace(value) {
	return value.replace(WHITESPACE_RE, " ").trim();
}
function liPrefixLabel(li) {
	const full = normalizeSpace(li.textContent ?? "");
	const match = STAT_PREFIX_RE.exec(full);
	if (match === null) return null;
	const raw = match[1];
	if (raw === void 0) return null;
	return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}
function findFlexi() {
	const node = document.querySelector(FLEXI_SELECTOR);
	return node instanceof HTMLElement ? node : null;
}
/**
* Media / player wrapper = flexi child that holds video or img#image
* (never the panel host). Video posts have no img#image — use the player block.
*/
function findMediaWrapper(flexi, panelId) {
	for (const child of flexi.children) {
		if (!(child instanceof HTMLElement)) continue;
		if (child.id === panelId) continue;
		if (child.querySelector("video") !== null) return child;
	}
	for (const child of flexi.children) {
		if (!(child instanceof HTMLElement)) continue;
		if (child.id === panelId) continue;
		if (child.querySelector(`#image`) !== null) return child;
	}
	for (const child of flexi.children) {
		if (!(child instanceof HTMLElement)) continue;
		if (child.id === panelId) continue;
		return child;
	}
	return null;
}
function findOriginalAnchor() {
	const list = document.querySelector(LINK_LIST_SELECTOR);
	const roots = list !== null ? [list, document] : [document];
	for (const root of roots) {
		const links = root.querySelectorAll("a[href]");
		for (const node of links) {
			if (!(node instanceof HTMLAnchorElement)) continue;
			if (node.textContent?.trim() !== "Original image") continue;
			const href = node.getAttribute("href");
			if (href === null || href.length === 0 || href === "#") continue;
			return node;
		}
	}
	return null;
}
function collectMoreLinks() {
	const list = document.querySelector(LINK_LIST_SELECTOR);
	if (list === null) return [];
	const result = [];
	const links = list.querySelectorAll("a[href]");
	for (const node of links) {
		if (!(node instanceof HTMLAnchorElement)) continue;
		const text = node.textContent?.trim() ?? "";
		if (!isMoreLinkText(text)) continue;
		result.push({
			text,
			anchor: node
		});
	}
	return result;
}
function scoreSpanId(postId) {
	return `${SCORE_SPAN_ID_PREFIX}${postId}`;
}
function findScoreSpan(postId) {
	const span = document.getElementById(scoreSpanId(postId));
	return span instanceof HTMLElement ? span : null;
}
function readScoreText(postId) {
	const span = findScoreSpan(postId);
	if (span === null) return null;
	const text = span.textContent?.trim() ?? "";
	return text.length > 0 ? text : null;
}
function writeScoreText(postId, score) {
	const span = findScoreSpan(postId);
	if (span !== null) span.textContent = String(score);
}
/** Keep panel score in sync when the site mutates span#psc{ID}. */
function observeScoreSpan(postId, onChange) {
	const span = findScoreSpan(postId);
	if (span === null) return () => {};
	const emit = () => {
		onChange(span.textContent?.trim() ?? "");
	};
	const observer = new MutationObserver(emit);
	observer.observe(span, {
		characterData: true,
		childList: true,
		subtree: true
	});
	return () => {
		observer.disconnect();
	};
}
function parsePostedRows(li) {
	const rows = [];
	const authorLink = li.querySelector("a[href]");
	let authorName = null;
	let authorHref = null;
	if (authorLink instanceof HTMLAnchorElement) {
		const href = authorLink.getAttribute("href");
		const name = authorLink.textContent?.trim() ?? "";
		if (href !== null && href.length > 0 && name.length > 0) {
			authorName = name;
			authorHref = href;
		}
	}
	const clone = li.cloneNode(true);
	if (!(clone instanceof HTMLElement)) return rows;
	for (const node of clone.querySelectorAll("a")) node.remove();
	for (const node of clone.querySelectorAll("br")) node.replaceWith(" ");
	let dateText = normalizeSpace(clone.textContent ?? "");
	dateText = dateText.replace(/^Posted\s*:\s*/i, "");
	dateText = dateText.replace(BY_SPLIT_RE, "").trim();
	dateText = normalizeSpace(dateText);
	if (dateText.length > 0) rows.push({
		label: "Posted",
		value: dateText,
		href: null
	});
	if (authorName !== null && authorHref !== null) rows.push({
		label: "By",
		value: authorName,
		href: authorHref
	});
	return rows;
}
function parseSourceRow(li) {
	const link = li.querySelector("a[href]");
	if (!(link instanceof HTMLAnchorElement)) return null;
	const href = link.getAttribute("href");
	if (href === null || href.length === 0 || href === "#") return null;
	const text = link.textContent?.trim() ?? "";
	return {
		label: "Source",
		value: text.length > 0 ? text : href,
		href
	};
}
function parseSimpleRow(li, label) {
	const full = normalizeSpace(li.textContent ?? "");
	const prefix = `${label}:`;
	const lower = full.toLowerCase();
	const prefixLower = prefix.toLowerCase();
	if (!lower.startsWith(prefixLower)) return null;
	const value = full.slice(prefix.length).trim();
	if (value.length === 0) return null;
	return {
		label,
		value,
		href: null
	};
}
/**
* Parse statistics lis by prefix before colon.
* Posted → date + By (author link) as separate rows. Score is not a stats row.
*/
function readStatRows() {
	const stats = document.querySelector(STATS_SELECTOR);
	if (stats === null) return [];
	const rows = [];
	const seen = /* @__PURE__ */ new Set();
	const items = stats.querySelectorAll("li");
	for (const node of items) {
		if (!(node instanceof HTMLElement)) continue;
		const prefix = liPrefixLabel(node);
		if (prefix === null || prefix === "Score") continue;
		if (prefix === "Posted") {
			for (const row of parsePostedRows(node)) if (!seen.has(row.label)) {
				seen.add(row.label);
				rows.push(row);
			}
			continue;
		}
		if (prefix === "Source") {
			if (seen.has("Source")) continue;
			const row = parseSourceRow(node);
			if (row !== null) {
				seen.add("Source");
				rows.push(row);
			}
			continue;
		}
		if (prefix === "Id" || prefix === "Size" || prefix === "Rating") {
			if (seen.has(prefix)) continue;
			const row = parseSimpleRow(node, prefix);
			if (row !== null) {
				seen.add(prefix);
				rows.push(row);
			}
		}
	}
	return rows;
}
var SOURCE_LINK_REL = SOURCE_REL;
function readDigitsCandidate(node) {
	const text = normalizeSpace(node.textContent ?? "");
	if (DIGITS_ONLY_RE.test(text)) return text;
	return null;
}
function readCountInElement(root) {
	for (const node of root.querySelectorAll(COUNTER_CANDIDATE_SELECTOR)) {
		const digits = readDigitsCandidate(node);
		if (digits !== null) return digits;
	}
	const own = readDigitsCandidate(root);
	if (own !== null) return own;
	return null;
}
/**
* Look for a numeric counter in the same li or immediate neighbor lis/elements.
* Does not scan the whole stats ul (would false-match span#psc{ID}).
* No known site counter element → returns null (report «нужна разметка»).
*/
function findICameCount(anchor) {
	const li = anchor.closest("li");
	if (li !== null) {
		for (const node of li.querySelectorAll(COUNTER_CANDIDATE_SELECTOR)) {
			if (anchor.contains(node)) continue;
			const digits = readDigitsCandidate(node);
			if (digits !== null) return digits;
		}
		for (const child of li.childNodes) {
			if (child.nodeType !== Node.TEXT_NODE) continue;
			const digits = normalizeSpace(child.textContent ?? "");
			if (DIGITS_ONLY_RE.test(digits)) return digits;
		}
		const neighborLis = [li.previousElementSibling, li.nextElementSibling];
		for (const neighbor of neighborLis) {
			if (!(neighbor instanceof HTMLElement)) continue;
			if (neighbor.querySelector("a[onclick^=\"iCame(\"]") !== null) continue;
			if (liPrefixLabel(neighbor) !== null) continue;
			const digits = readCountInElement(neighbor);
			if (digits !== null) return digits;
		}
	}
	const sibling = anchor.nextElementSibling;
	if (sibling !== null) {
		const digits = readCountInElement(sibling);
		if (digits !== null) return digits;
	}
	return null;
}
function findICameTarget() {
	const scoped = document.querySelector("div#stats > ul")?.querySelector("a[onclick^=\"iCame(\"]") ?? document.querySelector("a[onclick^=\"iCame(\"]");
	if (!(scoped instanceof HTMLAnchorElement)) return null;
	return {
		anchor: scoped,
		count: findICameCount(scoped)
	};
}
function measureHeaderOffsetPx(gapPx) {
	const header = document.querySelector(HEADER_SELECTOR);
	if (!(header instanceof HTMLElement)) return gapPx;
	return header.getBoundingClientRect().height + gapPx;
}
/** Native comments block on the post page (moved into the panel, not cloned). */
function findPostComments() {
	const node = document.getElementById(POST_COMMENTS_ID);
	return node instanceof HTMLElement ? node : null;
}
var COMMENT_COUNT_RE = /^(\d+)\s+comments?\b/i;
/**
* Parse leading «N comment(s)» from the first non-empty text node under
* div#comment-list (not full textContent — child nodes glue into one word
* and break the trailing word-boundary).
* Returns null when the list is missing or the prefix is unparseable.
*/
function readCommentCount() {
	const list = document.getElementById(COMMENT_LIST_ID);
	if (list === null) return null;
	for (const child of list.childNodes) {
		if (child.nodeType !== Node.TEXT_NODE) continue;
		const text = normalizeSpace(child.textContent ?? "");
		if (text.length === 0) continue;
		const match = COMMENT_COUNT_RE.exec(text);
		if (match === null) return null;
		const raw = match[1];
		if (raw === void 0) return null;
		const parsed = Number(raw);
		if (!Number.isFinite(parsed)) return null;
		return Math.trunc(parsed);
	}
	return null;
}
/**
* Post-page Fluid Player tweaks: persist volume/mute/rate, and CSS/JS size
* modes (Fit height / Fit width / Original).
*
* Does not replace the Fluid wrapper or rename its classes — only the
* wrapper size via explicit width/height (overrides Fluid's intrinsic px).
*/
var FEATURE_ID$4 = VIDEO_PLAYER_FEATURE_ID;
var FEATURE_LABEL$4 = "Video player tweaks";
var FEATURE_PAGES$4 = ["post"];
var VIDEO_ELEMENT_ID = "gelcomVideoPlayer";
var FLUID_WRAPPER_ID = "fluid_video_wrapper_gelcomVideoPlayer";
var FLUID_WRAPPER_CLASS = "fluid_video_wrapper";
var VOLUME_MIN = 0;
var VOLUME_MAX = 1;
var CHROME_GAP_PX = 12;
var WARN_NO_VIDEO = "video-player: #gelcomVideoPlayer missing; tweaks not mounted";
var BODY_CLASS$1 = featureBodyClass(FEATURE_ID$4);
var BODY_SELECTOR$2 = `body.${BODY_CLASS$1}`;
var WRAPPER_SELECTOR = `#${FLUID_WRAPPER_ID}.${FLUID_WRAPPER_CLASS}`;
var SIZE_LABEL_FIT_HEIGHT = "Fit height";
var SIZE_LABEL_FIT_WIDTH = "Fit width";
var SIZE_LABEL_ORIGINAL = "Original";
var SIZE_MODE_VALUES = [
	VIDEO_SIZE_FIT_HEIGHT,
	VIDEO_SIZE_FIT_WIDTH,
	VIDEO_SIZE_ORIGINAL
];
/** Settings caption under the Video player tweaks switch. */
var VIDEO_PLAYER_SETTING_CAPTION = "Fit height fills under the header (may upscale). Fit width uses the media column. Original is native pixels.";
var FEATURE_CSS$4 = [
	`${BODY_SELECTOR$2} ${WRAPPER_SELECTOR} {`,
	`  box-sizing: border-box;`,
	`}`
].join("\n");
/**
* Pure size calculator for the three Video size modes.
* Fit height may upscale; Fit width always uses full column width;
* Original is videoWidth × videoHeight with no scaling.
*/
function computeVideoPlayerSize(input) {
	const { mode, videoWidth, videoHeight, columnWidthPx, availableHeightPx } = input;
	if (videoWidth <= 0 || videoHeight <= 0 || columnWidthPx <= 0 || availableHeightPx <= 0) return {
		widthPx: 0,
		heightPx: 0
	};
	if (mode === "original") return {
		widthPx: videoWidth,
		heightPx: videoHeight
	};
	if (mode === "fit-width") return sizeForColumnWidth(videoWidth, videoHeight, columnWidthPx);
	const widthIfFullHeight = Math.round(availableHeightPx * videoWidth / videoHeight);
	if (widthIfFullHeight <= columnWidthPx) return {
		widthPx: widthIfFullHeight,
		heightPx: availableHeightPx
	};
	return sizeForColumnWidth(videoWidth, videoHeight, columnWidthPx);
}
function sizeForColumnWidth(videoWidth, videoHeight, columnWidthPx) {
	return {
		widthPx: columnWidthPx,
		heightPx: Math.round(columnWidthPx * videoHeight / videoWidth)
	};
}
function clampVolume(value) {
	if (!Number.isFinite(value)) return VOLUME_MIN;
	return Math.min(VOLUME_MAX, Math.max(VOLUME_MIN, value));
}
function readStoredState(ctx) {
	return ctx.getState(parseVideoPlayerState);
}
function writeStoredState(ctx, state) {
	ctx.setState({
		volume: state.volume,
		muted: state.muted,
		playbackRate: state.playbackRate
	});
}
function findVideo() {
	const node = document.getElementById(VIDEO_ELEMENT_ID);
	return node instanceof HTMLVideoElement ? node : null;
}
function findWrapper() {
	const node = document.getElementById(FLUID_WRAPPER_ID);
	if (!(node instanceof HTMLElement)) return null;
	if (!node.classList.contains("fluid_video_wrapper")) return null;
	return node;
}
function readSizeModeFromBody() {
	for (const value of SIZE_MODE_VALUES) if (document.body.classList.contains(featureChoiceBodyClass(FEATURE_ID$4, value))) return value;
	return resolveVideoSize(DEFAULT_VIDEO_SIZE);
}
function measureMediaColumnWidthPx(wrapper) {
	const parent = wrapper.parentElement;
	if (parent !== null && parent.clientWidth > 0) return parent.clientWidth;
	return wrapper.clientWidth;
}
function measureAvailableHeightPx() {
	const chromeOffsetPx = measureHeaderOffsetPx(CHROME_GAP_PX);
	return Math.max(0, window.innerHeight - chromeOffsetPx);
}
function clearWrapperSize(wrapper) {
	wrapper.style.removeProperty("width");
	wrapper.style.removeProperty("height");
}
function applyWrapperSize(wrapper, video) {
	if (!document.body.classList.contains(BODY_CLASS$1)) {
		clearWrapperSize(wrapper);
		return;
	}
	const videoWidth = video.videoWidth;
	const videoHeight = video.videoHeight;
	if (videoWidth <= 0 || videoHeight <= 0) return;
	const size = computeVideoPlayerSize({
		mode: readSizeModeFromBody(),
		videoWidth,
		videoHeight,
		columnWidthPx: measureMediaColumnWidthPx(wrapper),
		availableHeightPx: measureAvailableHeightPx()
	});
	if (size.widthPx <= 0 || size.heightPx <= 0) return;
	wrapper.style.width = `${String(size.widthPx)}px`;
	wrapper.style.height = `${String(size.heightPx)}px`;
}
/**
* Apply persisted volume/mute/rate. Fluid's own volume UI may not mirror
* programmatic `video.volume` / `video.muted` — see LIVE-CHECK note.
*/
function applyPersistedPlayback(video, state) {
	const volume = state.volume ?? VOLUME_MAX;
	const muted = state.muted ?? false;
	const playbackRate = state.playbackRate ?? 1;
	video.volume = clampVolume(volume);
	video.muted = muted;
	video.playbackRate = playbackRate;
}
function persistFromVideo(ctx, video) {
	writeStoredState(ctx, {
		volume: clampVolume(video.volume),
		muted: video.muted,
		playbackRate: video.playbackRate
	});
}
function bindPlayer(ctx, video) {
	const wrapper = findWrapper();
	const state = readStoredState(ctx);
	const applyLayout = () => {
		if (wrapper !== null) applyWrapperSize(wrapper, video);
	};
	const onLoadedMetadata = () => {
		applyPersistedPlayback(video, readStoredState(ctx));
		applyLayout();
	};
	if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
		applyPersistedPlayback(video, state);
		applyLayout();
	}
	video.addEventListener("loadedmetadata", onLoadedMetadata);
	video.addEventListener("volumechange", () => {
		persistFromVideo(ctx, video);
	});
	video.addEventListener("ratechange", () => {
		persistFromVideo(ctx, video);
	});
	const onResize = () => {
		applyLayout();
	};
	window.addEventListener("resize", onResize);
	new MutationObserver(() => {
		applyLayout();
	}).observe(document.body, {
		attributes: true,
		attributeFilter: ["class"]
	});
}
function mountVideoPlayer(ctx) {
	scheduleAfterFirstPaint(() => {
		const video = findVideo();
		if (video === null) {
			log.warn(WARN_NO_VIDEO);
			return;
		}
		bindPlayer(ctx, video);
	});
}
var videoPlayerFeature = {
	id: FEATURE_ID$4,
	label: FEATURE_LABEL$4,
	pages: [...FEATURE_PAGES$4],
	defaultEnabled: true,
	cssOnly: true,
	settingsCaption: VIDEO_PLAYER_SETTING_CAPTION,
	choice: {
		label: "Video size",
		options: [
			{
				value: VIDEO_SIZE_FIT_HEIGHT,
				label: SIZE_LABEL_FIT_HEIGHT
			},
			{
				value: VIDEO_SIZE_FIT_WIDTH,
				label: SIZE_LABEL_FIT_WIDTH
			},
			{
				value: VIDEO_SIZE_ORIGINAL,
				label: SIZE_LABEL_ORIGINAL
			}
		],
		defaultValue: DEFAULT_VIDEO_SIZE
	},
	css: FEATURE_CSS$4,
	mount: mountVideoPlayer
};
var TEXT_COLLECTIONS = "Collections";
var TEXT_FILTER_PLACEHOLDER = "Filter collections…";
var TEXT_NEW = "New custom collection";
var TEXT_CREATE = "Create";
var TEXT_NEW_NAME_LABEL = "New collection name";
var ARIA_COLLECTIONS = "Custom collections";
var LABEL_TOGGLE_PREFIX = "Toggle collection";
var KEY_ENTER$1 = "Enter";
var VIDEO_SOURCE_SELECTOR = "source";
var POST_ANCHOR_ID_PREFIX = "p";
var CLASS_WRAP$1 = "rdw-post-panel-collections";
var CLASS_TRIGGER = "rdw-post-panel-collections-btn";
var CLASS_ITEM$1 = "rdw-post-panel-collection-item";
var CLASS_CHECK = "rdw-post-panel-collection-check";
var CLASS_NAME = "rdw-post-panel-collection-name";
var CLASS_NEW = "rdw-post-panel-collection-new";
var CLASS_NEW_FORM = "rdw-post-panel-collection-new-form";
function readAttributeSrc(element) {
	if (!(element instanceof HTMLSourceElement)) {
		const current = element.currentSrc.trim();
		if (current.length > 0) return current;
	}
	const attribute = element.getAttribute("src");
	if (attribute === null) return null;
	const trimmed = attribute.trim();
	if (trimmed.length === 0) return null;
	return trimmed;
}
function postAnchorElement(postId) {
	const anchor = document.getElementById(`${POST_ANCHOR_ID_PREFIX}${String(postId)}`);
	return anchor instanceof Element ? anchor : null;
}
function isInsidePostAnchor(node, postId) {
	const anchor = postAnchorElement(postId);
	return anchor !== null && anchor.contains(node);
}
function readVideoElementUrl(video) {
	const source = video.querySelector(VIDEO_SOURCE_SELECTOR);
	if (source instanceof HTMLSourceElement) {
		const sourceUrl = readAttributeSrc(source);
		if (sourceUrl !== null) return sourceUrl;
	}
	return readAttributeSrc(video);
}
function readVideoMediaUrl(postId) {
	const candidates = [];
	const byId = document.getElementById(VIDEO_ELEMENT_ID);
	if (byId instanceof HTMLVideoElement) candidates.push(byId);
	for (const node of document.querySelectorAll("video")) if (node instanceof HTMLVideoElement && node !== byId) candidates.push(node);
	for (const video of candidates) {
		if (isInsidePostAnchor(video, postId)) continue;
		const url = readVideoElementUrl(video);
		if (url !== null) return url;
	}
	return null;
}
function thumbFromMedia(mediaUrl, postId) {
	if (mediaUrl === null) return null;
	return deriveThumbUrlFromMedia(mediaUrl, postId);
}
/** Post-page thumb from img#image, otherwise the video source. Null when neither yields one. */
function readPostPageThumbUrl(postId) {
	const image = document.getElementById(IMAGE_ID);
	if (image instanceof HTMLImageElement && !isInsidePostAnchor(image, postId)) {
		const fromImage = thumbFromMedia(readAttributeSrc(image), postId);
		if (fromImage !== null) return fromImage;
	}
	return thumbFromMedia(readVideoMediaUrl(postId), postId);
}
function addPostWithThumb(collectionId, postId) {
	const thumbUrl = readPostPageThumbUrl(postId);
	if (thumbUrl !== null) {
		addPostToCollection(collectionId, postId, thumbUrl);
		return;
	}
	addPostToCollection(collectionId, postId);
}
function memberIdSet(postId) {
	return new Set(playlistsContaining(postId).map((item) => item.id));
}
function filterPlaylists(playlists, query) {
	const trimmed = query.trim().toLowerCase();
	if (trimmed.length === 0) return [...playlists];
	return playlists.filter((item) => item.name.toLowerCase().includes(trimmed));
}
function CollectionsMenu(props) {
	const [open, setOpen] = d(false);
	const [filter, setFilter] = d("");
	const [creating, setCreating] = d(false);
	const [newName, setNewName] = d("");
	const [revision, setRevision] = d(0);
	const triggerRef = T(null);
	const playlists = w$1(() => {
		return listPlaylists();
	}, [revision]);
	const members = w$1(() => {
		return memberIdSet(props.postId);
	}, [props.postId, revision]);
	const visible = w$1(() => filterPlaylists(playlists, filter), [playlists, filter]);
	const bump = b(() => {
		setRevision((value) => value + 1);
	}, []);
	const close = b(() => {
		setOpen(false);
		setCreating(false);
		setNewName("");
		setFilter("");
	}, []);
	const bindTrigger = b((node) => {
		const button = node?.querySelector("button");
		triggerRef.current = button instanceof HTMLButtonElement ? button : null;
	}, []);
	const toggleMembership = b((playlistId) => {
		if (members.has(playlistId)) removePostFromPlaylist(playlistId, props.postId);
		else addPostWithThumb(playlistId, props.postId);
		bump();
	}, [
		bump,
		members,
		props.postId
	]);
	const commitNew = b(() => {
		const name = newName.trim();
		if (name.length === 0) return;
		addPostWithThumb(createPlaylist(name).id, props.postId);
		bump();
		setCreating(false);
		setNewName("");
	}, [
		bump,
		newName,
		props.postId
	]);
	return /* @__PURE__ */ a("div", {
		className: CLASS_WRAP$1,
		ref: bindTrigger,
		children: [/* @__PURE__ */ a(Button, {
			variant: "secondary",
			size: "m",
			className: CLASS_TRIGGER,
			"aria-label": TEXT_COLLECTIONS,
			onClick: () => {
				setOpen((value) => !value);
			},
			children: [/* @__PURE__ */ a(IconPlus, { size: 14 }), TEXT_COLLECTIONS]
		}), /* @__PURE__ */ a(Popover, {
			open,
			onClose: close,
			anchorRef: triggerRef,
			widthPx: 260,
			"aria-label": ARIA_COLLECTIONS,
			children: [
				/* @__PURE__ */ a(TextField, {
					value: filter,
					onChange: setFilter,
					placeholder: TEXT_FILTER_PLACEHOLDER,
					"aria-label": TEXT_FILTER_PLACEHOLDER
				}),
				visible.map((playlist) => {
					const checked = members.has(playlist.id);
					return /* @__PURE__ */ a("button", {
						type: "button",
						className: CLASS_ITEM$1,
						role: "menuitemcheckbox",
						"aria-checked": checked,
						"aria-label": `${LABEL_TOGGLE_PREFIX} ${playlist.name}`,
						onClick: () => {
							toggleMembership(playlist.id);
						},
						children: [/* @__PURE__ */ a("span", {
							className: CLASS_CHECK,
							"aria-hidden": "true",
							children: checked ? /* @__PURE__ */ a(IconCheck, { size: 14 }) : null
						}), /* @__PURE__ */ a("span", {
							className: CLASS_NAME,
							children: playlist.name
						})]
					}, playlist.id);
				}),
				creating ? /* @__PURE__ */ a("div", {
					className: CLASS_NEW_FORM,
					onKeyDown: (event) => {
						if (event.key === KEY_ENTER$1) {
							event.preventDefault();
							commitNew();
						}
					},
					children: [/* @__PURE__ */ a(TextField, {
						value: newName,
						onChange: setNewName,
						label: TEXT_NEW_NAME_LABEL,
						"aria-label": TEXT_NEW_NAME_LABEL
					}), /* @__PURE__ */ a(Button, {
						variant: "primary",
						size: "s",
						onClick: commitNew,
						children: TEXT_CREATE
					})]
				}) : /* @__PURE__ */ a(Button, {
					variant: "ghost",
					size: "s",
					className: CLASS_NEW,
					onClick: () => {
						setCreating(true);
					},
					children: [/* @__PURE__ */ a(IconPlus, { size: 14 }), TEXT_NEW]
				})
			]
		})]
	});
}
var DISPLAY_EDIT = "Edit";
var DISPLAY_RESIZE = "Resize image";
var DISPLAY_REPORT = "Report to moderation";
var DISPLAY_ADD_NOTE = "Add note";
var CLASS_WRAP = "rdw-post-panel-post-actions";
var CLASS_ITEM = "rdw-post-panel-post-action";
var ICON_SIZE$1 = 14;
function buttonLabel(text) {
	if (text === "Edit") return DISPLAY_EDIT;
	if (text === "Resize image") return DISPLAY_RESIZE;
	if (text === "Report to moderation") return DISPLAY_REPORT;
	return DISPLAY_ADD_NOTE;
}
function actionIcon(text) {
	if (text === "Edit") return /* @__PURE__ */ a(IconPencil, { size: ICON_SIZE$1 });
	if (text === "Resize image") return /* @__PURE__ */ a(IconImage, { size: ICON_SIZE$1 });
	if (text === "Report to moderation") return /* @__PURE__ */ a(IconFlag, { size: ICON_SIZE$1 });
	return /* @__PURE__ */ a(IconNote, { size: ICON_SIZE$1 });
}
/** Full-width open buttons that proxy native link-list clicks. No Popover. */
function PostActionsList(props) {
	if (props.links.length === 0) return null;
	return /* @__PURE__ */ a("div", {
		className: CLASS_WRAP,
		children: props.links.map((link) => /* @__PURE__ */ a(Button, {
			variant: "secondary",
			size: "m",
			className: CLASS_ITEM,
			"aria-label": buttonLabel(link.text),
			onClick: () => {
				link.anchor.click();
			},
			children: [actionIcon(link.text), buttonLabel(link.text)]
		}, link.text))
	});
}
var POST_PANEL_TAB_INFO = "info";
var POST_PANEL_TAB_COMMENTS = "comments";
var TEXT_FAVORITE = "Favorite";
var TEXT_IN_FAVORITES = "In favorites";
var TEXT_VOTE_PREFIX = "Vote";
var TEXT_ICAME = "I came";
var TEXT_COMMENTS = "Comments";
var TEXT_INFO = "Info";
var TEXT_POST = "Post";
var TEXT_COMMENTS_COUNTED_SEP = " · ";
var LABEL_ORIGINAL = "Original";
var LABEL_VOTE = "Vote";
var LABEL_ICAME = "I came";
var ARIA_PANEL_TABS = "Post details";
var WARN_ICAME_COUNT = "post-actions: I came counter — нужна разметка";
var ICON_SIZE = 14;
var ORIGINAL_ICON_SIZE = 14;
var CLASS_ROOT = "rdw-post-panel";
var CLASS_CARD = "rdw-post-panel-card";
var CLASS_ACTIONS = "rdw-post-panel-actions";
var CLASS_ACTIONS_ROW = "rdw-post-panel-actions-row";
var CLASS_FAV = "rdw-post-panel-fav";
var CLASS_ORIGINAL = "rdw-post-panel-original";
var CLASS_VOTE = "rdw-post-panel-vote";
var CLASS_STATS = "rdw-post-panel-stats";
var CLASS_STAT_LABEL = "rdw-post-panel-stat-label";
var CLASS_STAT_VALUE = "rdw-post-panel-stat-value";
var CLASS_SOURCE = "rdw-post-panel-source";
var CLASS_ICAME = "rdw-post-panel-icame";
var CLASS_COMMENTS = "rdw-post-panel-comments";
var CLASS_COMMENTS_HOST = "rdw-post-panel-comments-host";
var CLASS_INFO = "rdw-post-panel-info";
var CLASS_TABS = "rdw-post-panel-tabs";
var CLASS_TAB_PANEL = "rdw-post-panel-tabpanel";
function parseNumericPostId(postId) {
	if (postId === null || postId.length === 0) return null;
	const parsed = Number(postId);
	if (!Number.isFinite(parsed)) return null;
	const truncated = Math.trunc(parsed);
	return truncated < 0 ? null : truncated;
}
function voteLabel(scoreText) {
	return `${TEXT_VOTE_PREFIX} ${scoreText}`;
}
function commentsTabLabel(count) {
	if (count === null) return TEXT_COMMENTS;
	return `${TEXT_COMMENTS}${TEXT_COMMENTS_COUNTED_SEP}${String(count)}`;
}
function PostPanel(props) {
	const numericId = parseNumericPostId(props.postId);
	const [favorited, setFavorited] = d(() => props.postId !== null ? isFav(props.postId) : false);
	const [favPending, setFavPending] = d(false);
	const [scoreText, setScoreText] = d(() => {
		if (props.postId === null) return "—";
		return readScoreText(props.postId) ?? "—";
	});
	const [votePending, setVotePending] = d(false);
	const [stats] = d(() => readStatRows());
	const [moreLinks] = d(() => collectMoreLinks());
	const [originalHref] = d(() => {
		return findOriginalAnchor()?.href ?? null;
	});
	const [iCame] = d(() => findICameTarget());
	const [hasComments] = d(() => findPostComments() !== null);
	const [commentCount] = d(() => hasComments ? readCommentCount() : null);
	const [activeTab, setActiveTab] = d(POST_PANEL_TAB_INFO);
	A(() => {
		if (props.postId === null) return;
		return observeScoreSpan(props.postId, (text) => {
			setScoreText(text.length > 0 ? text : "—");
		});
	}, [props.postId]);
	A(() => {
		if (iCame !== null && iCame.count === null) log.warn(WARN_ICAME_COUNT);
	}, [iCame]);
	const onFavClick = b(async () => {
		if (props.postId === null || favPending) return;
		setFavPending(true);
		try {
			if (favorited) {
				const result = await removeFavorite(props.postId);
				if (result.status === "removed") {
					removeFav(props.postId);
					setFavorited(false);
					return;
				}
				log.warn("post-actions: remove favorite failed", props.postId, result);
				return;
			}
			const result = await addFavorite(props.postId);
			if (result.status === "added" || result.status === "already") {
				addFav(props.postId);
				setFavorited(true);
				if (result.status === "added" && result.score !== void 0) {
					writeScoreText(props.postId, result.score);
					setScoreText(String(result.score));
				}
				return;
			}
			if (result.status === "not_logged_in") {
				log.warn("post-actions: favorite requires login", props.postId);
				return;
			}
			log.warn("post-actions: favorite failed", props.postId, result);
		} finally {
			setFavPending(false);
		}
	}, [
		favPending,
		favorited,
		props.postId
	]);
	const onVoteClick = b(async () => {
		if (props.postId === null || votePending) return;
		setVotePending(true);
		try {
			const score = await voteUp(props.postId);
			if (score !== null) {
				writeScoreText(props.postId, score);
				setScoreText(String(score));
			}
		} finally {
			setVotePending(false);
		}
	}, [props.postId, votePending]);
	const onICameClick = b(() => {
		iCame?.anchor.click();
	}, [iCame]);
	const onTabChange = b((id) => {
		setActiveTab(id);
	}, []);
	const tabItems = w$1(() => {
		const items = [{
			id: POST_PANEL_TAB_INFO,
			label: TEXT_INFO
		}];
		if (hasComments) items.push({
			id: POST_PANEL_TAB_COMMENTS,
			label: commentsTabLabel(commentCount)
		});
		return items;
	}, [commentCount, hasComments]);
	const showInfoCard = stats.length > 0 || moreLinks.length > 0 || hasComments;
	const showActionsRow2 = props.postId !== null || iCame !== null || originalHref !== null;
	return /* @__PURE__ */ a("div", {
		className: CLASS_ROOT,
		children: [
			/* @__PURE__ */ a(CollectionQueue, { postId: numericId }),
			/* @__PURE__ */ a("div", {
				className: CLASS_ACTIONS,
				children: [props.postId !== null || numericId !== null ? /* @__PURE__ */ a("div", {
					className: CLASS_ACTIONS_ROW,
					children: [props.postId !== null ? /* @__PURE__ */ a(Button, {
						variant: "primary",
						size: "m",
						className: CLASS_FAV,
						loading: favPending,
						"aria-label": favorited ? `${UI_TEXT.cardFavRemoveLabel} ${props.postId}` : `${UI_TEXT.cardFavAddLabel} ${props.postId}`,
						onClick: () => {
							onFavClick();
						},
						children: [favorited ? /* @__PURE__ */ a(IconStarFilled, { size: ICON_SIZE }) : /* @__PURE__ */ a(IconStar, { size: ICON_SIZE }), favorited ? TEXT_IN_FAVORITES : TEXT_FAVORITE]
					}) : null, numericId !== null ? /* @__PURE__ */ a(CollectionsMenu, { postId: numericId }) : null]
				}) : null, showActionsRow2 ? /* @__PURE__ */ a("div", {
					className: CLASS_ACTIONS_ROW,
					children: [
						props.postId !== null ? /* @__PURE__ */ a(Button, {
							variant: "secondary",
							size: "m",
							className: CLASS_VOTE,
							loading: votePending,
							"aria-label": LABEL_VOTE,
							onClick: () => {
								onVoteClick();
							},
							children: [/* @__PURE__ */ a(IconArrowUp, { size: ICON_SIZE }), voteLabel(scoreText)]
						}) : null,
						iCame !== null ? /* @__PURE__ */ a(Button, {
							variant: "secondary",
							size: "m",
							className: CLASS_ICAME,
							"aria-label": LABEL_ICAME,
							onClick: onICameClick,
							children: [/* @__PURE__ */ a(IconDroplet, { size: ICON_SIZE }), TEXT_ICAME]
						}) : null,
						originalHref !== null ? /* @__PURE__ */ a("a", {
							className: CLASS_ORIGINAL,
							href: originalHref,
							target: "_blank",
							rel: "noopener",
							"aria-label": LABEL_ORIGINAL,
							title: LABEL_ORIGINAL,
							children: /* @__PURE__ */ a(IconExternalLink, { size: ORIGINAL_ICON_SIZE })
						}) : null
					]
				}) : null]
			}),
			showInfoCard ? /* @__PURE__ */ a(Card, {
				className: CLASS_CARD,
				as: "section",
				children: [
					hasComments ? /* @__PURE__ */ a(Tabs, {
						className: CLASS_TABS,
						"aria-label": ARIA_PANEL_TABS,
						items: tabItems,
						value: activeTab,
						onChange: onTabChange
					}) : null,
					/* @__PURE__ */ a("div", {
						className: CLASS_TAB_PANEL,
						role: "tabpanel",
						id: kitTabPanelId(POST_PANEL_TAB_INFO),
						"aria-labelledby": kitTabId(POST_PANEL_TAB_INFO),
						hidden: hasComments && activeTab !== "info",
						children: /* @__PURE__ */ a(InfoPanel, {
							stats,
							moreLinks
						})
					}),
					hasComments ? /* @__PURE__ */ a("div", {
						className: `${CLASS_TAB_PANEL} ${CLASS_COMMENTS}`,
						role: "tabpanel",
						id: kitTabPanelId(POST_PANEL_TAB_COMMENTS),
						"aria-labelledby": kitTabId(POST_PANEL_TAB_COMMENTS),
						hidden: activeTab !== POST_PANEL_TAB_COMMENTS,
						children: /* @__PURE__ */ a(CommentsHost, {})
					}) : null
				]
			}) : null
		]
	});
}
function InfoPanel(props) {
	return /* @__PURE__ */ a("div", {
		className: CLASS_INFO,
		children: [props.stats.length > 0 ? /* @__PURE__ */ a("div", {
			className: CLASS_STATS,
			children: props.stats.map((row) => /* @__PURE__ */ a(StatRowView, { row }, row.label))
		}) : null, props.moreLinks.length > 0 ? /* @__PURE__ */ a($$1, { children: [/* @__PURE__ */ a(SectionLabel, { children: TEXT_POST }), /* @__PURE__ */ a(PostActionsList, { links: props.moreLinks })] }) : null]
	});
}
function CommentsHost() {
	const hostRef = T(null);
	F(() => {
		const host = hostRef.current;
		const comments = findPostComments();
		if (host === null || comments === null) return;
		if (comments.parentElement === host) return;
		const originParent = comments.parentNode;
		const originNext = comments.nextSibling;
		host.append(comments);
		return () => {
			if (originParent === null) return;
			if (comments.parentElement === host || comments.parentNode === null) originParent.insertBefore(comments, originNext);
		};
	}, []);
	return /* @__PURE__ */ a("div", {
		className: CLASS_COMMENTS_HOST,
		ref: hostRef
	});
}
function StatRowView(props) {
	const { row } = props;
	return /* @__PURE__ */ a($$1, { children: [/* @__PURE__ */ a("span", {
		className: CLASS_STAT_LABEL,
		children: row.label
	}), row.label === "Source" && row.href !== null ? /* @__PURE__ */ a("a", {
		className: `${CLASS_STAT_VALUE} ${CLASS_SOURCE}`,
		href: row.href,
		title: row.href,
		rel: SOURCE_LINK_REL,
		children: row.value
	}) : row.href !== null ? /* @__PURE__ */ a("a", {
		className: CLASS_STAT_VALUE,
		href: row.href,
		children: row.value
	}) : /* @__PURE__ */ a("div", {
		className: CLASS_STAT_VALUE,
		children: row.value
	})] });
}
var FEATURE_ID$3 = "post-actions";
var FEATURE_LABEL$3 = "Post side panel";
var FEATURE_PAGES$3 = ["post"];
/** Body class while the panel host is in the document — CSS hide handoff for G. */
var POST_PANEL_MOUNTED_CLASS = "rdw-post-panel-mounted";
var NARROW_BREAKPOINT_PX = 1100;
var NARROW_MEDIA_QUERY = `(max-width: ${String(1099)}px)`;
var PANEL_WIDTH_PX = 360;
var PANEL_MIN_WIDTH_PX = 320;
var PANEL_MAX_WIDTH_PX = 420;
var PANEL_FONT_SIZE_PX = 13;
var PANEL_BUTTON_HEIGHT_PX = 34;
var PANEL_BLOCK_GAP_PX = 10;
var PANEL_BUTTON_GAP_PX = 8;
var PANEL_CARD_PADDING_PX = 12;
var PANEL_STICKY_GAP_PX = 12;
var PANEL_Z_INDEX = 100;
var STAT_LABEL_WIDTH_PX = 62;
var ORIGINAL_BUTTON_SIZE_PX = 34;
var STICKY_TOP_VAR = "--rdw-post-panel-sticky-top";
var CLASS_PANEL = "rdw-post-actions";
var CLASS_MODE_WIDE = "rdw-post-actions--wide";
var CLASS_MODE_NARROW = "rdw-post-actions--narrow";
var WARN_NO_FLEXI = "post-actions: div.flexi missing; panel not mounted";
var BODY_SELECTOR$1 = `body.${featureBodyClass(FEATURE_ID$3)}`;
var FEATURE_CSS$3 = `
${BODY_SELECTOR$1} #fit-to-screen div.flexi,
${BODY_SELECTOR$1} div#right-col div.flexi,
${BODY_SELECTOR$1} div.flexi {
  flex-wrap: wrap;
  align-items: flex-start;
}
${BODY_SELECTOR$1} #${POST_ACTIONS_ID}.${CLASS_PANEL} {
  box-sizing: border-box;
  width: ${String(PANEL_WIDTH_PX)}px;
  min-width: ${String(PANEL_MIN_WIDTH_PX)}px;
  max-width: min(${String(PANEL_MAX_WIDTH_PX)}px, 100%);
  flex: 0 1 ${String(PANEL_WIDTH_PX)}px;
  z-index: ${String(PANEL_Z_INDEX)};
  font: ${String(PANEL_FONT_SIZE_PX)}px/1.35 var(--rdw-font);
  color: var(--rdw-text);
}
${BODY_SELECTOR$1} #${POST_ACTIONS_ID}.${CLASS_MODE_WIDE} {
  position: sticky;
  top: var(${STICKY_TOP_VAR}, ${String(PANEL_STICKY_GAP_PX)}px);
  align-self: flex-start;
  max-height: calc(100vh - var(${STICKY_TOP_VAR}, ${String(PANEL_STICKY_GAP_PX)}px) - ${String(PANEL_STICKY_GAP_PX)}px);
  overflow-y: auto;
}
${BODY_SELECTOR$1} #${POST_ACTIONS_ID}.${CLASS_MODE_NARROW} {
  position: static;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  flex: 1 1 100%;
  margin: 0.75rem 0 0;
  max-height: none;
  overflow-y: visible;
}
${BODY_SELECTOR$1} #${POST_ACTIONS_ID} .rdw-post-panel {
  display: grid;
  gap: ${String(PANEL_BLOCK_GAP_PX)}px;
  position: relative;
}
${BODY_SELECTOR$1} #${POST_ACTIONS_ID} .rdw-post-panel-card {
  padding: ${String(PANEL_CARD_PADDING_PX)}px;
  display: grid;
  gap: ${String(PANEL_BLOCK_GAP_PX)}px;
}
${BODY_SELECTOR$1} #${POST_ACTIONS_ID} .rdw-btn {
  min-height: ${String(PANEL_BUTTON_HEIGHT_PX)}px;
  font-size: ${String(PANEL_FONT_SIZE_PX)}px;
}
${BODY_SELECTOR$1} #${POST_ACTIONS_ID} .rdw-post-panel-actions {
  display: grid;
  gap: ${String(PANEL_BUTTON_GAP_PX)}px;
}
${BODY_SELECTOR$1} #${POST_ACTIONS_ID} .rdw-post-panel-actions-row {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: ${String(PANEL_BUTTON_GAP_PX)}px;
}
${BODY_SELECTOR$1} #${POST_ACTIONS_ID} .rdw-post-panel-actions-row > .rdw-btn,
${BODY_SELECTOR$1} #${POST_ACTIONS_ID} .rdw-post-panel-actions-row > .rdw-post-panel-collections {
  flex: 1 1 0;
  min-width: 0;
}
${BODY_SELECTOR$1} #${POST_ACTIONS_ID} .rdw-post-panel-collections {
  position: relative;
}
${BODY_SELECTOR$1} #${POST_ACTIONS_ID} .rdw-post-panel-collections .rdw-btn {
  width: 100%;
}
${BODY_SELECTOR$1} #${POST_ACTIONS_ID} .rdw-post-panel-original {
  box-sizing: border-box;
  flex: 0 0 ${String(ORIGINAL_BUTTON_SIZE_PX)}px;
  width: ${String(ORIGINAL_BUTTON_SIZE_PX)}px;
  height: ${String(ORIGINAL_BUTTON_SIZE_PX)}px;
  min-width: ${String(ORIGINAL_BUTTON_SIZE_PX)}px;
  min-height: ${String(ORIGINAL_BUTTON_SIZE_PX)}px;
  display: inline-grid;
  place-items: center;
  padding: 0;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-surface);
  color: var(--rdw-text);
  text-decoration: none;
}
${BODY_SELECTOR$1} #${POST_ACTIONS_ID} .rdw-post-panel-stats {
  display: grid;
  grid-template-columns: ${String(STAT_LABEL_WIDTH_PX)}px 1fr;
  column-gap: ${String(PANEL_BUTTON_GAP_PX)}px;
  row-gap: ${String(PANEL_BUTTON_GAP_PX)}px;
  font-size: ${String(PANEL_FONT_SIZE_PX)}px;
}
${BODY_SELECTOR$1} #${POST_ACTIONS_ID} .rdw-post-panel-stat-label {
  color: var(--rdw-muted);
}
${BODY_SELECTOR$1} #${POST_ACTIONS_ID} .rdw-post-panel-source {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--rdw-accent);
}
${BODY_SELECTOR$1} #${POST_ACTIONS_ID} .rdw-post-panel-info {
  display: grid;
  gap: ${String(PANEL_BLOCK_GAP_PX)}px;
}
${BODY_SELECTOR$1} #${POST_ACTIONS_ID} .rdw-post-panel-post-actions {
  display: grid;
  gap: ${String(PANEL_BUTTON_GAP_PX)}px;
}
${BODY_SELECTOR$1} #${POST_ACTIONS_ID} .rdw-post-panel-post-action {
  width: 100%;
  justify-content: flex-start;
}
${BODY_SELECTOR$1} #${POST_ACTIONS_ID} .rdw-post-panel-tabpanel[hidden] {
  display: none;
}
${BODY_SELECTOR$1} #${POST_ACTIONS_ID} .rdw-post-panel-comments-host {
  min-width: 0;
}
${BODY_SELECTOR$1} #${POST_ACTIONS_ID} .rdw-post-panel-collection-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin: 0;
  padding: 5px 6px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
${BODY_SELECTOR$1} #${POST_ACTIONS_ID} .rdw-post-panel-collection-item:hover,
${BODY_SELECTOR$1} #${POST_ACTIONS_ID} .rdw-post-panel-collection-item:focus-visible {
  background: var(--rdw-surface-2);
}
${BODY_SELECTOR$1} #${POST_ACTIONS_ID} .rdw-post-panel-collection-check {
  width: 15px;
  height: 15px;
  flex: 0 0 15px;
  display: inline-grid;
  place-items: center;
  border: 1px solid var(--rdw-border);
  border-radius: 4px;
  color: var(--rdw-surface);
  background: transparent;
}
${BODY_SELECTOR$1} #${POST_ACTIONS_ID} .rdw-post-panel-collection-item[aria-checked="true"] .rdw-post-panel-collection-check {
  background: var(--rdw-accent);
  border-color: var(--rdw-accent);
}
${BODY_SELECTOR$1} #${POST_ACTIONS_ID} .rdw-post-panel-collection-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
${BODY_SELECTOR$1} #${POST_ACTIONS_ID} .rdw-post-panel-collection-new-form {
  display: grid;
  gap: 6px;
}
@media ${NARROW_MEDIA_QUERY} {
  ${BODY_SELECTOR$1} #${POST_ACTIONS_ID}.${CLASS_MODE_WIDE} {
    position: static;
    max-height: none;
    overflow-y: visible;
  }
}
`.trim();
var layoutCleanup = null;
var panelHost = null;
function removeExistingPanel() {
	if (layoutCleanup !== null) {
		layoutCleanup();
		layoutCleanup = null;
	}
	if (panelHost !== null) {
		Q$1(null, panelHost);
		panelHost.remove();
		panelHost = null;
	}
	const existing = document.getElementById(POST_ACTIONS_ID);
	if (existing !== null) existing.remove();
	document.body.classList.remove(POST_PANEL_MOUNTED_CLASS);
}
function isNarrowViewport() {
	if (typeof window.matchMedia === "function") return window.matchMedia(NARROW_MEDIA_QUERY).matches;
	return window.innerWidth < NARROW_BREAKPOINT_PX;
}
function applyStickyTop(panel) {
	const topPx = measureHeaderOffsetPx(PANEL_STICKY_GAP_PX);
	panel.style.setProperty(STICKY_TOP_VAR, `${String(topPx)}px`);
}
function placePanel(panel, flexi) {
	const narrow = isNarrowViewport();
	panel.classList.toggle(CLASS_MODE_WIDE, !narrow);
	panel.classList.toggle(CLASS_MODE_NARROW, narrow);
	applyStickyTop(panel);
	const media = findMediaWrapper(flexi, POST_ACTIONS_ID);
	if (media !== null) {
		media.after(panel);
		return;
	}
	flexi.append(panel);
}
function bindLayout(panel, flexi) {
	const sync = () => {
		placePanel(panel, flexi);
	};
	sync();
	const onResize = () => {
		sync();
	};
	window.addEventListener("resize", onResize);
	let mediaCleanup = null;
	if (typeof window.matchMedia === "function") {
		const media = window.matchMedia(NARROW_MEDIA_QUERY);
		const onChange = () => {
			sync();
		};
		if (typeof media.addEventListener === "function") {
			media.addEventListener("change", onChange);
			mediaCleanup = () => {
				media.removeEventListener("change", onChange);
			};
		} else if (typeof media.addListener === "function") {
			media.addListener(onChange);
			mediaCleanup = () => {
				media.removeListener(onChange);
			};
		}
	}
	layoutCleanup = () => {
		window.removeEventListener("resize", onResize);
		if (mediaCleanup !== null) mediaCleanup();
	};
}
function mountPostActions(ctx) {
	removeExistingPanel();
	const flexi = findFlexi();
	if (flexi === null) {
		log.warn(WARN_NO_FLEXI);
		return;
	}
	const host = document.createElement("div");
	host.id = POST_ACTIONS_ID;
	host.className = CLASS_PANEL;
	host.setAttribute("role", "complementary");
	host.setAttribute("aria-label", FEATURE_LABEL$3);
	const postId = readPostIdFromSearch(ctx.search);
	panelHost = host;
	document.body.classList.add(POST_PANEL_MOUNTED_CLASS);
	placePanel(host, flexi);
	bindLayout(host, flexi);
	Q$1(k$1(PostPanel, { postId }), host);
}
var postActionsFeature = {
	id: FEATURE_ID$3,
	label: FEATURE_LABEL$3,
	pages: [...FEATURE_PAGES$3],
	defaultEnabled: true,
	css: FEATURE_CSS$3,
	mount: mountPostActions
};
var FEATURE_ID$2 = "search-tools";
var FEATURE_LABEL$2 = "Search tools";
var FEATURE_PAGES$2 = ["list", "post"];
/**
* Followed artists for Feed chip / source detection (read-only).
* Mirror first — GM snapshots on bfcache pages can omit recent follows.
*/
function resolveFollowedArtistTags() {
	const mirrored = readArtistsMirror();
	if (mirrored !== null && mirrored.length > 0) return [...mirrored];
	return listArtistTags();
}
var TAGS_INPUT_SELECTOR$1 = "input[name=\"tags\"]";
var TAG_SIDEBAR_SELECTOR$1 = "ul#tag-sidebar";
var MY_FAVORITES_LINK_SELECTOR = "li#my-favorites-container a[href*=\"page=favorites\"]";
var ROOT_ID = "rdw-search-tools";
var ROOT_CLASS = "rdw-search-tools";
var CARD_CLASS = "rdw-search-tools-card";
var CHIPS_CLASS = "rdw-search-tools-chips";
var CHIP_CLASS = "rdw-search-tools-chip";
var CHIP_ATTR_START = "data-chip-start";
var CHIP_ATTR_END = "data-chip-end";
var CHIP_ATTR_TOGGLE = "data-chip-toggle";
var CHIP_ATTR_REMOVE = "data-chip-remove";
var FIELD_CLASS = "rdw-search-tools-field";
var ROW_SORT_CLASS = "rdw-search-tools-row-sort";
var FOOT_CLASS = "rdw-search-tools-foot";
var HINT_CLASS = "rdw-search-tools-hint";
var RESET_CLASS = "rdw-search-tools-reset";
var TOKEN_SPLIT_RE = /\s+/;
var MULTI_SPACE_RE = /\s+/g;
var POLL_INTERVAL_MS = 700;
var NAV_DEBOUNCE_MS = 400;
var META_SEP = ":";
var SCORE_TOKEN_PREFIX = "score:>=";
var SCORE_TOKEN_RE = /^score:>=(\d+)$/;
var SORT_TOKEN_PREFIX = "sort:";
var MEDIA_VIDEO = "video";
var MEDIA_IMAGES = `-${MEDIA_VIDEO}`;
var TAG_TYPE_CLASS_PREFIX = "tag-type-";
var SORT_HINT = "Sorts within the current search";
var FOOT_HINT = "Typing needs Search or Enter; chips and filters apply instantly";
var RESET_LABEL = "Reset search";
var KEY_ENTER = "Enter";
var EVENT_INPUT = "input";
var EVENT_CHANGE = "change";
var EVENT_CLICK = "click";
var EVENT_AWESOMPLETE_SELECT = "awesomplete-selectcomplete";
var WARN_NO_FORM = "search-tools: search form not found; not mounted";
var BODY_CLASS = featureBodyClass(FEATURE_ID$2);
/**
* Set on document.body while the panel's «AI posts» row is rendered.
* Site-skin (HANDOFF G) must hide native Filter AI only under this class.
*/
var SEARCH_TOOLS_AI_ROW_BODY_CLASS = "rdw-search-tools-ai-posts";
var FILTER_AI_WAIT_TIMEOUT_MS = 4e3;
var FILTER_AI_OBSERVER_OPTIONS = {
	childList: true,
	subtree: true
};
var TAG_TYPES = [
	"artist",
	"character",
	"copyright",
	"general",
	"metadata"
];
function isTagType(value) {
	for (const entry of TAG_TYPES) if (entry === value) return true;
	return false;
}
var MEDIA_OPTIONS = [
	{
		value: "all",
		label: "All"
	},
	{
		value: "images",
		label: "Images"
	},
	{
		value: "videos",
		label: "Videos"
	}
];
var AI_POSTS_OPTIONS = [{
	value: "show",
	label: "Show"
}, {
	value: "hide",
	label: "Hide"
}];
var AI_POSTS_SECTION_LABEL = "AI posts";
var SORT_OPTIONS = [
	{
		value: "newest",
		label: "Newest",
		token: null
	},
	{
		value: "oldest",
		label: "Oldest",
		token: "sort:id:asc"
	},
	{
		value: "score",
		label: "Top score",
		token: "sort:score:desc"
	},
	{
		value: "updated",
		label: "Recently updated",
		token: "sort:updated:desc"
	},
	{
		value: "random",
		label: "Random",
		token: "sort:random"
	}
];
var SOURCE_OPTIONS = [
	{
		value: "all",
		label: "All"
	},
	{
		value: "feed",
		label: "Feed"
	},
	{
		value: "favorites",
		label: "Favorites"
	}
];
var SORT_TOKEN_TO_MODE = /* @__PURE__ */ new Map();
for (const option of SORT_OPTIONS) if (option.token !== null) SORT_TOKEN_TO_MODE.set(option.token, option.value);
var FEATURE_CSS$2 = [
	`body.${BODY_CLASS} .${ROOT_CLASS} {`,
	"  margin-top: 8px;",
	"  max-width: 100%;",
	"  box-sizing: border-box;",
	"}",
	`body.${BODY_CLASS} .${CARD_CLASS} {`,
	"  padding: 10px;",
	"  display: grid;",
	"  gap: 10px;",
	"}",
	`body.${BODY_CLASS} .${CHIPS_CLASS} {`,
	"  display: flex;",
	"  flex-wrap: wrap;",
	"  gap: 5px;",
	"}",
	`body.${BODY_CLASS} .${CHIP_CLASS} {`,
	"  cursor: default;",
	"}",
	`body.${BODY_CLASS} .${CHIP_CLASS}[${CHIP_ATTR_TOGGLE}="1"] {`,
	"  cursor: pointer;",
	"}",
	`body.${BODY_CLASS} .${FIELD_CLASS} {`,
	"  display: grid;",
	"  gap: 0;",
	"  min-width: 0;",
	"}",
	`body.${BODY_CLASS} .${ROW_SORT_CLASS} {`,
	"  display: grid;",
	"  grid-template-columns: 1fr 72px;",
	"  gap: 8px;",
	"  align-items: start;",
	"}",
	`body.${BODY_CLASS} .${FOOT_CLASS} {`,
	"  display: flex;",
	"  justify-content: space-between;",
	"  align-items: center;",
	"  border-top: 1px solid var(--rdw-border);",
	"  padding-top: 8px;",
	"}",
	`body.${BODY_CLASS} .${HINT_CLASS} {`,
	"  font-size: 12px;",
	"  color: var(--rdw-muted);",
	"}",
	`body.${BODY_CLASS} .${RESET_CLASS} {`,
	"  padding: 0;",
	"  min-height: auto;",
	"  height: auto;",
	"}"
].join("\n");
function findTagsInput() {
	const input = document.querySelector(TAGS_INPUT_SELECTOR$1);
	return input instanceof HTMLInputElement ? input : null;
}
function findSearchForm(input) {
	const form = input.closest("form");
	return form instanceof HTMLFormElement ? form : null;
}
function parseTokens(value) {
	const trimmed = value.trim();
	if (trimmed.length === 0) return [];
	return trimmed.split(TOKEN_SPLIT_RE).filter((token) => token.length > 0);
}
function normalizeSpaces(value) {
	return value.replace(MULTI_SPACE_RE, " ").trim();
}
function joinTokens(tokens) {
	return tokens.join(" ");
}
function bareTag(token) {
	if (token.startsWith("-") && token.length > 1) return token.slice(1);
	return token;
}
function normalizeTagKey(raw) {
	return raw.trim().toLowerCase().replaceAll(" ", "_");
}
function isMediaToken(token) {
	return token === MEDIA_VIDEO || token === MEDIA_IMAGES;
}
function isSortToken(token) {
	return bareTag(token).startsWith(SORT_TOKEN_PREFIX);
}
function isScoreToken(token) {
	return SCORE_TOKEN_RE.test(bareTag(token));
}
function isControlledToken(token) {
	return isMediaToken(token) || isSortToken(token) || isScoreToken(token);
}
function isMetaToken(token) {
	return bareTag(token).includes(META_SEP);
}
function readMediaMode(tokens) {
	let hasVideo = false;
	let hasImages = false;
	for (const token of tokens) if (token === MEDIA_VIDEO) hasVideo = true;
	else if (token === MEDIA_IMAGES) hasImages = true;
	if (hasVideo) return "videos";
	if (hasImages) return "images";
	return "all";
}
function readSortMode(tokens) {
	for (const token of tokens) {
		const mode = SORT_TOKEN_TO_MODE.get(bareTag(token));
		if (mode !== void 0) return mode;
	}
	return "newest";
}
function readMinScore(tokens) {
	for (const token of tokens) {
		const match = SCORE_TOKEN_RE.exec(bareTag(token));
		if (match === null) continue;
		const raw = match[1];
		if (raw === void 0) continue;
		const value = Number(raw);
		if (Number.isFinite(value) && value > 0) return value;
	}
	return null;
}
function freeTokens(tokens) {
	return tokens.filter((token) => !isControlledToken(token));
}
function sortTokenForMode(mode) {
	return SORT_OPTIONS.find((entry) => entry.value === mode)?.token ?? null;
}
function buildTokenSet(current, media, sort, minScore) {
	const next = freeTokens(current);
	if (media === "images") next.push(MEDIA_IMAGES);
	else if (media === "videos") next.push(MEDIA_VIDEO);
	const sortToken = sortTokenForMode(sort);
	if (sortToken !== null) next.push(sortToken);
	if (minScore !== null && minScore > 0) next.push(`${SCORE_TOKEN_PREFIX}${String(minScore)}`);
	return next;
}
function navigateTokens(tokens) {
	window.location.assign(buildSearchUrl(parseTags(joinTokens(tokens))));
}
function toggleExclude(token) {
	if (token.startsWith("-") && token.length > 1) return token.slice(1);
	return `-${token}`;
}
function removeTokenRange(tokens, start, end) {
	if (start < 0 || end < start || start >= tokens.length) return [...tokens];
	return tokens.filter((_, index) => index < start || index > end);
}
function replaceTokenAt(tokens, index, nextToken) {
	return tokens.map((token, tokenIndex) => tokenIndex === index ? nextToken : token);
}
function chipKindFromTagType(tagType) {
	if (tagType === "artist") return "artist";
	if (tagType === "character") return "character";
	if (tagType === "copyright") return "copyright";
	if (tagType === "metadata") return "metadata";
	return "default";
}
function readTagTypeFromClassList(classList) {
	for (const className of classList) {
		if (!className.startsWith(TAG_TYPE_CLASS_PREFIX)) continue;
		const typeName = className.slice(9);
		if (isTagType(typeName)) return typeName;
	}
	return null;
}
function extractSidebarTag(li) {
	const links = li.querySelectorAll("a[href]");
	for (const node of links) {
		if (!(node instanceof HTMLAnchorElement)) continue;
		const href = node.getAttribute("href");
		if (href === null || href.length === 0) continue;
		let url;
		try {
			url = new URL(href, SITE_ORIGIN);
		} catch {
			continue;
		}
		const tags = url.searchParams.get(SEARCH_PARAM_TAGS);
		if (tags !== null && tags.trim().length > 0) {
			const first = parseTokens(tags)[0];
			if (first !== void 0) return normalizeTagKey(bareTag(first));
		}
		const text = node.textContent?.trim() ?? "";
		if (text.length > 0) return normalizeTagKey(text);
	}
	return null;
}
function buildSidebarTagTypes() {
	const map = /* @__PURE__ */ new Map();
	const sidebar = document.querySelector(TAG_SIDEBAR_SELECTOR$1);
	if (!(sidebar instanceof HTMLUListElement)) return map;
	for (const child of sidebar.children) {
		if (!(child instanceof HTMLLIElement)) continue;
		const tagType = readTagTypeFromClassList(child.classList);
		if (tagType === null) continue;
		const tag = extractSidebarTag(child);
		if (tag === null) continue;
		map.set(tag, tagType);
	}
	return map;
}
function findFavoritesHref() {
	const anchor = document.querySelector(MY_FAVORITES_LINK_SELECTOR);
	if (!(anchor instanceof HTMLAnchorElement)) return null;
	const href = anchor.getAttribute("href");
	if (href === null || href.trim().length === 0) return null;
	return href;
}
function findFilterAiCheckbox() {
	const node = document.querySelector(SITE_SELECTORS.filterAiCheckbox);
	return node instanceof HTMLInputElement ? node : null;
}
function setAiRowBodyClass(active) {
	document.body.classList.toggle(SEARCH_TOOLS_AI_ROW_BODY_CLASS, active);
}
/**
* Resolve #chkFilterAI now or when the site injects it. Disconnects on find
* or timeout. Returns a cancel function for unmount.
*/
function waitForFilterAiCheckbox(onFound, onTimeout) {
	const existing = findFilterAiCheckbox();
	if (existing !== null) {
		onFound(existing);
		return () => {};
	}
	let settled = false;
	const finish = (action) => {
		if (settled) return;
		settled = true;
		observer.disconnect();
		window.clearTimeout(timeoutId);
		action();
	};
	const observer = new MutationObserver(() => {
		const checkbox = findFilterAiCheckbox();
		if (checkbox === null) return;
		finish(() => {
			onFound(checkbox);
		});
	});
	observer.observe(document.documentElement, FILTER_AI_OBSERVER_OPTIONS);
	const timeoutId = window.setTimeout(() => {
		finish(onTimeout);
	}, FILTER_AI_WAIT_TIMEOUT_MS);
	return () => {
		finish(() => {});
	};
}
function readAiPostsMode(checkbox) {
	return checkbox.checked ? "hide" : "show";
}
function detectSourceMode(search) {
	const params = new URLSearchParams(search);
	if (params.get("page") === "favorites") return "favorites";
	const tagsRaw = params.get("tags") ?? "";
	const artists = resolveFollowedArtistTags();
	if (isFullUpdatesQuery(tagsRaw, artists) || isPartialUpdatesQuery(tagsRaw, artists)) return "feed";
	return "all";
}
function tryParseParenGroup(tokens, start) {
	if (tokens[start] !== "(") return null;
	for (let index = start + 1; index < tokens.length; index += 1) {
		if (tokens[index] === "(") return null;
		if (tokens[index] === ")") {
			const inner = tokens.slice(start + 1, index);
			if (inner.length === 0) return null;
			return {
				end: index,
				inner
			};
		}
	}
	return null;
}
function isOrJoinedMembers(inner) {
	if (inner.length === 0 || inner.length % 2 === 0) return null;
	const members = [];
	for (let index = 0; index < inner.length; index += 1) {
		const token = inner[index];
		if (token === void 0) return null;
		if (index % 2 === 1) {
			if (token !== "~") return null;
			continue;
		}
		if (token === "(" || token === ")" || token === "~") return null;
		members.push(token);
	}
	return members.length > 0 ? members : null;
}
function orGroupLabel(members) {
	const title = members.join(" ");
	const query = joinTokens([
		"(",
		...members.flatMap((member, index) => index === 0 ? [member] : ["~", member]),
		")"
	]);
	const artists = resolveFollowedArtistTags();
	const count = members.length;
	if (isFullUpdatesQuery(query, artists)) return {
		label: `Feed · ${String(count)} artists`,
		title
	};
	return {
		label: `Any of ${String(count)} tags`,
		title
	};
}
function chipsSignature(chips) {
	return chips.map((chip) => {
		if (chip.kind === "tag") return `t:${String(chip.start)}:${chip.token}:${chip.chipKind}`;
		return `g:${chip.kind}:${String(chip.start)}:${String(chip.end)}:${chip.label}:${chip.title}`;
	}).join("|");
}
function buildChipModels(tokens) {
	const tagTypes = buildSidebarTagTypes();
	const chips = [];
	let index = 0;
	while (index < tokens.length) {
		const token = tokens[index];
		if (token === void 0) break;
		if (isControlledToken(token)) {
			index += 1;
			continue;
		}
		const group = tryParseParenGroup(tokens, index);
		if (group !== null) {
			const groupTokens = tokens.slice(index, group.end + 1);
			const playlistIds = parsePlaylistQuery(joinTokens(groupTokens));
			if (playlistIds !== null && playlistIds.length > 0) {
				chips.push({
					kind: "id-group",
					start: index,
					end: group.end,
					label: `${String(playlistIds.length)} posts`,
					title: groupTokens.join(" ")
				});
				index = group.end + 1;
				continue;
			}
			const members = isOrJoinedMembers(group.inner);
			if (members !== null) {
				const { label, title } = orGroupLabel(members);
				chips.push({
					kind: "or-group",
					start: index,
					end: group.end,
					label,
					title
				});
				index = group.end + 1;
				continue;
			}
		}
		const excluded = token.startsWith("-") && token.length > 1;
		const tagType = tagTypes.get(normalizeTagKey(bareTag(token))) ?? null;
		chips.push({
			kind: "tag",
			start: index,
			end: index,
			token,
			label: token,
			excluded,
			chipKind: chipKindFromTagType(tagType),
			title: isMetaToken(token) ? token : null
		});
		index += 1;
	}
	return chips;
}
function readPanelView(inputValue, search) {
	const tokens = parseTokens(inputValue);
	const chips = buildChipModels(tokens);
	return {
		chips,
		chipsSig: chipsSignature(chips),
		media: readMediaMode(tokens),
		sort: readSortMode(tokens),
		minScore: readMinScore(tokens),
		source: detectSourceMode(search)
	};
}
function ensureRoot(form) {
	const existing = document.getElementById(ROOT_ID);
	if (existing instanceof HTMLDivElement) {
		if (existing.previousElementSibling !== form) form.after(existing);
		return existing;
	}
	const root = document.createElement("div");
	root.id = ROOT_ID;
	root.className = ROOT_CLASS;
	form.after(root);
	return root;
}
function setInputValueOnly(input, tokens) {
	input.value = normalizeSpaces(joinTokens(tokens));
}
function SearchToolsPanel(props) {
	const { input } = props;
	const [view, setView] = d(() => readPanelView(input.value, window.location.search));
	const [scoreDraft, setScoreDraft] = d(view.minScore);
	const [aiPosts, setAiPosts] = d(null);
	const scoreFocusedRef = T(false);
	const navTimerRef = T(null);
	const lastPolledValueRef = T(input.value);
	const clearNavTimer = () => {
		if (navTimerRef.current !== null) {
			window.clearTimeout(navTimerRef.current);
			navTimerRef.current = null;
		}
	};
	const scheduleNavigate = (tokens) => {
		clearNavTimer();
		navTimerRef.current = window.setTimeout(() => {
			navTimerRef.current = null;
			navigateTokens(tokens);
		}, NAV_DEBOUNCE_MS);
	};
	const applyViewFromInput = (options) => {
		const next = readPanelView(input.value, window.location.search);
		lastPolledValueRef.current = input.value;
		setView((prev) => {
			const chipsUnchanged = next.chipsSig === prev.chipsSig;
			if (chipsUnchanged && next.media === prev.media && next.sort === prev.sort && next.minScore === prev.minScore && next.source === prev.source) return prev;
			return {
				...next,
				chips: chipsUnchanged ? prev.chips : next.chips
			};
		});
		if (!scoreFocusedRef.current) setScoreDraft(next.minScore);
		if (options.navigate) scheduleNavigate(parseTokens(input.value));
	};
	const writeTokens = (tokens, options) => {
		setInputValueOnly(input, tokens);
		lastPolledValueRef.current = input.value;
		const next = readPanelView(input.value, window.location.search);
		setView((prev) => {
			const chipsUnchanged = next.chipsSig === prev.chipsSig;
			return {
				...next,
				chips: chipsUnchanged ? prev.chips : next.chips
			};
		});
		if (!scoreFocusedRef.current) setScoreDraft(next.minScore);
		if (options.navigate) scheduleNavigate(tokens);
	};
	const applyViewRef = T(applyViewFromInput);
	applyViewRef.current = applyViewFromInput;
	A(() => {
		const onSiteInput = () => {
			applyViewRef.current({ navigate: false });
		};
		input.addEventListener(EVENT_INPUT, onSiteInput);
		input.addEventListener(EVENT_CHANGE, onSiteInput);
		input.addEventListener(EVENT_AWESOMPLETE_SELECT, onSiteInput);
		const sidebar = document.querySelector(TAG_SIDEBAR_SELECTOR$1);
		const onSidebarClick = () => {
			window.setTimeout(() => {
				applyViewRef.current({ navigate: false });
			}, 0);
		};
		if (sidebar !== null) sidebar.addEventListener(EVENT_CLICK, onSidebarClick);
		const pollId = window.setInterval(() => {
			if (document.hidden) return;
			if (input.value === lastPolledValueRef.current) return;
			applyViewRef.current({ navigate: false });
		}, POLL_INTERVAL_MS);
		return () => {
			clearNavTimer();
			input.removeEventListener(EVENT_INPUT, onSiteInput);
			input.removeEventListener(EVENT_CHANGE, onSiteInput);
			input.removeEventListener(EVENT_AWESOMPLETE_SELECT, onSiteInput);
			if (sidebar !== null) sidebar.removeEventListener(EVENT_CLICK, onSidebarClick);
			window.clearInterval(pollId);
		};
	}, [input]);
	A(() => {
		let checkbox = null;
		const onCheckboxChange = () => {
			if (checkbox === null) return;
			setAiPosts(readAiPostsMode(checkbox));
		};
		const cancelWait = waitForFilterAiCheckbox((found) => {
			checkbox = found;
			setAiPosts(readAiPostsMode(found));
			setAiRowBodyClass(true);
			found.addEventListener(EVENT_CHANGE, onCheckboxChange);
		}, () => {
			setAiPosts(null);
			setAiRowBodyClass(false);
		});
		return () => {
			cancelWait();
			if (checkbox !== null) checkbox.removeEventListener(EVENT_CHANGE, onCheckboxChange);
			setAiRowBodyClass(false);
		};
	}, []);
	const onChipsClick = (event) => {
		const target = event.target;
		if (!(target instanceof Element)) return;
		const chipEl = target.closest(`[${CHIP_ATTR_START}]`);
		if (!(chipEl instanceof HTMLElement)) return;
		const startRaw = chipEl.getAttribute(CHIP_ATTR_START);
		const endRaw = chipEl.getAttribute(CHIP_ATTR_END);
		if (startRaw === null || endRaw === null) return;
		const start = Number(startRaw);
		const end = Number(endRaw);
		if (!Number.isFinite(start) || !Number.isFinite(end)) return;
		if (target.closest(`[${CHIP_ATTR_REMOVE}]`) !== null) {
			event.preventDefault();
			const current = parseTokens(input.value);
			writeTokens(removeTokenRange(current, start, end), { navigate: true });
			return;
		}
		if (chipEl.getAttribute(CHIP_ATTR_TOGGLE) !== "1") return;
		event.preventDefault();
		const current = parseTokens(input.value);
		const currentToken = current[start];
		if (currentToken === void 0 || isMetaToken(currentToken)) return;
		writeTokens(replaceTokenAt(current, start, toggleExclude(currentToken)), { navigate: true });
	};
	const onMediaChange = (value) => {
		const media = MEDIA_OPTIONS.find((entry) => entry.value === value)?.value;
		if (media === void 0) return;
		const tokens = parseTokens(input.value);
		writeTokens(buildTokenSet(tokens, media, readSortMode(tokens), readMinScore(tokens)), { navigate: true });
	};
	const onSortChange = (value) => {
		const sort = SORT_OPTIONS.find((entry) => entry.value === value)?.value;
		if (sort === void 0) return;
		const tokens = parseTokens(input.value);
		writeTokens(buildTokenSet(tokens, readMediaMode(tokens), sort, readMinScore(tokens)), { navigate: true });
	};
	const commitScore = () => {
		const tokens = parseTokens(input.value);
		let minScore = null;
		if (scoreDraft !== null && Number.isFinite(scoreDraft) && scoreDraft > 0) minScore = Math.floor(scoreDraft);
		const current = readMinScore(tokens);
		if (current === minScore) {
			setScoreDraft(current);
			return;
		}
		writeTokens(buildTokenSet(tokens, readMediaMode(tokens), readSortMode(tokens), minScore), { navigate: true });
	};
	const onSourceChange = (value) => {
		const source = SOURCE_OPTIONS.find((entry) => entry.value === value)?.value;
		if (source === void 0) return;
		if (source === "feed") {
			const artists = resolveFollowedArtistTags();
			if (artists.length === 0) {
				setView((prev) => ({
					...prev,
					source: detectSourceMode(window.location.search)
				}));
				return;
			}
			clearNavTimer();
			navTimerRef.current = window.setTimeout(() => {
				navTimerRef.current = null;
				window.location.assign(buildFeedUrl(artists, getUpdatesGroupSize()));
			}, NAV_DEBOUNCE_MS);
			setView((prev) => ({
				...prev,
				source
			}));
			return;
		}
		if (source === "favorites") {
			const href = findFavoritesHref();
			if (href === null) {
				setView((prev) => ({
					...prev,
					source: detectSourceMode(window.location.search)
				}));
				return;
			}
			clearNavTimer();
			navTimerRef.current = window.setTimeout(() => {
				navTimerRef.current = null;
				window.location.assign(href);
			}, NAV_DEBOUNCE_MS);
			setView((prev) => ({
				...prev,
				source
			}));
			return;
		}
		setView((prev) => ({
			...prev,
			source: "all"
		}));
		scheduleNavigate(parseTokens(input.value));
	};
	const onAiPostsChange = (value) => {
		const mode = AI_POSTS_OPTIONS.find((entry) => entry.value === value)?.value;
		if (mode === void 0) return;
		const checkbox = findFilterAiCheckbox();
		if (checkbox === null) {
			setAiPosts(null);
			return;
		}
		const wantChecked = mode === "hide";
		if (checkbox.checked === wantChecked) {
			setAiPosts(mode);
			return;
		}
		checkbox.click();
		setAiPosts(readAiPostsMode(checkbox));
	};
	const onReset = () => {
		clearNavTimer();
		setInputValueOnly(input, []);
		lastPolledValueRef.current = input.value;
		setView(readPanelView("", window.location.search));
		setScoreDraft(null);
		window.location.assign(buildSearchUrl([]));
	};
	return /* @__PURE__ */ a($$1, { children: [/* @__PURE__ */ a("style", { children: CHIP_CSS }), /* @__PURE__ */ a(Card, {
		className: CARD_CLASS,
		children: [
			view.chips.length > 0 ? /* @__PURE__ */ a("div", {
				className: FIELD_CLASS,
				children: [/* @__PURE__ */ a(SectionLabel, { children: "Tags" }), /* @__PURE__ */ a("div", {
					className: CHIPS_CLASS,
					onClick: onChipsClick,
					role: "list",
					"aria-label": "Search tags",
					children: view.chips.map((chip) => {
						if (chip.kind === "tag") {
							const excluded = chip.excluded;
							const variantClass = excluded ? "rdw-chip--exclude" : "rdw-chip--dot";
							const kindClass = !excluded && chip.chipKind !== "default" ? `rdw-chip--${chip.chipKind}` : "";
							const toggleable = !isMetaToken(chip.token);
							return /* @__PURE__ */ a("span", {
								className: [
									"rdw-chip",
									variantClass,
									kindClass,
									CHIP_CLASS
								].filter((part) => part.length > 0).join(" "),
								role: "listitem",
								title: chip.title ?? void 0,
								"data-chip-start": String(chip.start),
								"data-chip-end": String(chip.end),
								"data-chip-toggle": toggleable ? "1" : "0",
								children: [
									!excluded ? /* @__PURE__ */ a("i", {
										className: "rdw-chip__dot",
										"aria-hidden": "true"
									}) : null,
									/* @__PURE__ */ a("span", { children: chip.label }),
									/* @__PURE__ */ a("button", {
										type: "button",
										className: "rdw-chip__remove rdw-kit-focusable",
										"aria-label": `Remove ${chip.label}`,
										"data-chip-remove": "1",
										children: /* @__PURE__ */ a(IconX, { size: 12 })
									})
								]
							}, `t-${String(chip.start)}-${chip.token}`);
						}
						return /* @__PURE__ */ a("span", {
							className: `rdw-chip rdw-chip--group ${CHIP_CLASS}`,
							role: "listitem",
							title: chip.title,
							"data-chip-start": String(chip.start),
							"data-chip-end": String(chip.end),
							"data-chip-toggle": "0",
							children: [/* @__PURE__ */ a("span", { children: chip.label }), /* @__PURE__ */ a("button", {
								type: "button",
								className: "rdw-chip__remove rdw-kit-focusable",
								"aria-label": `Remove ${chip.label}`,
								"data-chip-remove": "1",
								children: /* @__PURE__ */ a(IconX, { size: 12 })
							})]
						}, `g-${String(chip.start)}-${String(chip.end)}-${chip.label}`);
					})
				})]
			}) : null,
			/* @__PURE__ */ a("div", {
				className: FIELD_CLASS,
				children: [/* @__PURE__ */ a(SectionLabel, { children: "Media" }), /* @__PURE__ */ a(Segmented, {
					label: "Media",
					options: MEDIA_OPTIONS.map((entry) => ({
						value: entry.value,
						label: entry.label
					})),
					value: view.media,
					onChange: onMediaChange
				})]
			}),
			/* @__PURE__ */ a("div", {
				className: ROW_SORT_CLASS,
				title: SORT_HINT,
				children: [/* @__PURE__ */ a(Select, {
					label: "Sort",
					options: SORT_OPTIONS.map((entry) => ({
						value: entry.value,
						label: entry.label
					})),
					value: view.sort,
					onChange: onSortChange
				}), /* @__PURE__ */ a("div", {
					onFocusIn: () => {
						scoreFocusedRef.current = true;
					},
					onFocusOut: (event) => {
						const next = event.relatedTarget;
						if (next instanceof Node && event.currentTarget.contains(next)) return;
						scoreFocusedRef.current = false;
						commitScore();
					},
					onKeyDown: (event) => {
						if (event.key !== KEY_ENTER) return;
						event.preventDefault();
						commitScore();
					},
					children: /* @__PURE__ */ a(NumberField, {
						label: "Min score",
						value: scoreDraft,
						min: 1,
						step: 1,
						onChange: setScoreDraft
					})
				})]
			}),
			/* @__PURE__ */ a("div", {
				className: FIELD_CLASS,
				children: [/* @__PURE__ */ a(SectionLabel, { children: "Source" }), /* @__PURE__ */ a(Segmented, {
					label: "Source",
					options: SOURCE_OPTIONS.map((entry) => ({
						value: entry.value,
						label: entry.label
					})),
					value: view.source,
					onChange: onSourceChange
				})]
			}),
			aiPosts !== null ? /* @__PURE__ */ a("div", {
				className: FIELD_CLASS,
				children: [/* @__PURE__ */ a(SectionLabel, { children: AI_POSTS_SECTION_LABEL }), /* @__PURE__ */ a(Segmented, {
					label: AI_POSTS_SECTION_LABEL,
					options: AI_POSTS_OPTIONS.map((entry) => ({
						value: entry.value,
						label: entry.label
					})),
					value: aiPosts,
					onChange: onAiPostsChange
				})]
			}) : null,
			/* @__PURE__ */ a("div", {
				className: FOOT_CLASS,
				children: [/* @__PURE__ */ a("span", {
					className: HINT_CLASS,
					children: FOOT_HINT
				}), /* @__PURE__ */ a(Button, {
					variant: "ghost",
					size: "s",
					className: RESET_CLASS,
					onClick: onReset,
					children: RESET_LABEL
				})]
			})
		]
	})] });
}
function mountSearchTools(_ctx) {
	const input = findTagsInput();
	if (input === null) {
		log.warn(WARN_NO_FORM);
		return;
	}
	const form = findSearchForm(input);
	if (form === null) {
		log.warn(WARN_NO_FORM);
		return;
	}
	const root = ensureRoot(form);
	Q$1(/* @__PURE__ */ a(SearchToolsPanel, { input }), root);
}
var searchToolsFeature = {
	id: FEATURE_ID$2,
	label: FEATURE_LABEL$2,
	pages: [...FEATURE_PAGES$2],
	defaultEnabled: true,
	css: FEATURE_CSS$2,
	mount: mountSearchTools
};
var FEATURE_ID$1 = "tag-groups";
var FEATURE_LABEL$1 = "Collapse tags";
var TAG_SIDEBAR_SELECTOR = "ul#tag-sidebar";
var TOGGLE_CLASS = "rdw-tag-group-toggle";
var COLLAPSED_CLASS = "rdw-tag-group-collapsed";
var BODY_FEATURE_CLASS = featureBodyClass(FEATURE_ID$1);
var MISSING_SIDEBAR_WARN = "Tag sidebar not found";
var GROUP_HEADER_NAME_SET = /* @__PURE__ */ new Set([
	"Copyright",
	"Character",
	"Artist",
	"General",
	"Meta"
]);
var DEFAULT_COLLAPSED = ["General", "Meta"];
var FEATURE_PAGES$1 = ["list", "post"];
/**
* Site-skin `html.rdw-skin ul#tag-sidebar > li { display: block }` includes an id,
* so a body+class rule cannot hide the row. Match that chain, then add the
* collapsed class. The second selector covers site themes (no html.rdw-skin).
*/
var COLLAPSED_ROW = `ul#tag-sidebar > li.${COLLAPSED_CLASS}`;
var HIDE_COLLAPSED_WITH_SKIN = `html.${RDW_SKIN_CLASS} body.${BODY_FEATURE_CLASS} ${COLLAPSED_ROW}`;
var HIDE_COLLAPSED_SITE_THEME = `body.${BODY_FEATURE_CLASS} ${COLLAPSED_ROW}`;
var FEATURE_CSS$1 = [
	`${HIDE_COLLAPSED_WITH_SKIN},`,
	`${HIDE_COLLAPSED_SITE_THEME} { display: none; }`,
	`body.${BODY_FEATURE_CLASS} button.${TOGGLE_CLASS} {`,
	"  background: transparent;",
	"  border: none;",
	"  color: inherit;",
	"  cursor: pointer;",
	"  font: inherit;",
	"  padding: 0;",
	"}",
	`body.${BODY_FEATURE_CLASS} button.${TOGGLE_CLASS}:focus-visible {`,
	"  outline: 2px solid #8ab4f8;",
	"  outline-offset: 2px;",
	"}"
].join("\n");
var TagGroupsStateSchema = object({ collapsed: array(string()) });
function defaultState() {
	return { collapsed: [...DEFAULT_COLLAPSED] };
}
function parseTagGroupsState(raw) {
	const parsed = TagGroupsStateSchema.safeParse(raw);
	if (!parsed.success) return defaultState();
	return parsed.data;
}
function isGroupHeaderName(text) {
	return GROUP_HEADER_NAME_SET.has(text);
}
function readHeaderName(li) {
	const h6 = li.querySelector(":scope > h6");
	if (!(h6 instanceof HTMLHeadingElement)) return null;
	const text = h6.textContent?.trim() ?? "";
	if (!isGroupHeaderName(text)) return null;
	return text;
}
function collectGroups(sidebar) {
	const groups = [];
	let current = null;
	for (const child of sidebar.children) {
		if (!(child instanceof HTMLLIElement)) continue;
		const headerName = readHeaderName(child);
		if (headerName !== null) {
			current = {
				name: headerName,
				headerLi: child,
				members: []
			};
			groups.push(current);
			continue;
		}
		if (current !== null) current.members.push(child);
	}
	return groups;
}
function formatToggleLabel(name, count) {
	return `${name} (${String(count)})`;
}
function applyGroupCollapsed(members, button, collapsed) {
	for (const member of members) member.classList.toggle(COLLAPSED_CLASS, collapsed);
	button.setAttribute("aria-expanded", collapsed ? "false" : "true");
}
function writeCollapsedState(ctx, collapsedNames) {
	ctx.setState({ collapsed: [...collapsedNames] });
}
function mountToggle(group, collapsedNames, ctx) {
	const h6 = group.headerLi.querySelector(":scope > h6");
	if (!(h6 instanceof HTMLHeadingElement)) return;
	const button = document.createElement("button");
	button.type = "button";
	button.className = TOGGLE_CLASS;
	button.textContent = formatToggleLabel(group.name, group.members.length);
	const initiallyCollapsed = collapsedNames.has(group.name);
	applyGroupCollapsed(group.members, button, initiallyCollapsed);
	button.addEventListener("click", () => {
		const nextCollapsed = !collapsedNames.has(group.name);
		if (nextCollapsed) collapsedNames.add(group.name);
		else collapsedNames.delete(group.name);
		applyGroupCollapsed(group.members, button, nextCollapsed);
		writeCollapsedState(ctx, [...collapsedNames]);
	});
	h6.replaceChildren(button);
}
function mountTagGroups(ctx) {
	const sidebar = document.querySelector(TAG_SIDEBAR_SELECTOR);
	if (!(sidebar instanceof HTMLUListElement)) {
		log.warn(MISSING_SIDEBAR_WARN);
		return;
	}
	const state = ctx.getState(parseTagGroupsState);
	const collapsedNames = new Set(state.collapsed);
	const groups = collectGroups(sidebar);
	for (const group of groups) mountToggle(group, collapsedNames, ctx);
}
var tagGroupsFeature = {
	id: FEATURE_ID$1,
	label: FEATURE_LABEL$1,
	pages: [...FEATURE_PAGES$1],
	defaultEnabled: true,
	css: FEATURE_CSS$1,
	mount: mountTagGroups
};
var FEATURE_ID = "video-preview";
var FEATURE_LABEL = "Video preview on hover";
/** Settings caption for Phase 2 F/H (Switch hint under the toggle). */
var VIDEO_PREVIEW_SETTING_CAPTION = "Each preview loads the video file itself.";
var FEATURE_PAGES = ["list", "favorites"];
var VIDEO_CLASS = "rdw-video-preview";
var WEBM_PREVIEW_SELECTOR = "img.preview.webm-thumb";
var VIDEO_Z_INDEX = 3;
var PRELOAD_NONE = "none";
var BODY_SELECTOR = `body.${featureBodyClass(FEATURE_ID)}`;
var FEATURE_CSS = `
${BODY_SELECTOR} .${VIDEO_CLASS} {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: ${String(VIDEO_Z_INDEX)};
  margin: 0;
  padding: 0;
  border: 0;
  object-fit: contain;
  pointer-events: none;
}
@supports (anchor-name: --a) {
  ${BODY_SELECTOR} .${VIDEO_CLASS} {
    position-anchor: ${THUMB_ANCHOR_NAME};
    top: anchor(top);
    left: anchor(left);
    width: anchor-size(width);
    height: anchor-size(height);
  }
}
`.trim();
var failedPostIds = /* @__PURE__ */ new Set();
var boundThumbGeneration = /* @__PURE__ */ new WeakMap();
var bindGeneration = 0;
var activePreview = null;
var hoverTimerId = null;
var hoverThumb = null;
var started = false;
function clearHoverTimer() {
	if (hoverTimerId === null) return;
	window.clearTimeout(hoverTimerId);
	hoverTimerId = null;
}
function tearDownActive() {
	const current = activePreview;
	if (current === null) return;
	activePreview = null;
	current.video.removeEventListener("error", current.onError);
	current.video.pause();
	current.video.src = "";
	current.video.load();
	current.video.remove();
}
function findThumbLink(thumb, postId) {
	const byId = thumb.querySelector(`#p${postId}`);
	if (byId instanceof HTMLAnchorElement) return byId;
	const byHref = thumb.querySelector(SITE_SELECTORS.thumbLink);
	return byHref instanceof HTMLAnchorElement ? byHref : null;
}
function findWebmThumbImage(thumb) {
	const img = thumb.querySelector(WEBM_PREVIEW_SELECTOR);
	if (!(img instanceof HTMLImageElement)) return null;
	return img;
}
function startPreview(thumb) {
	const postId = extractPostIdFromThumb(thumb);
	if (postId === null || failedPostIds.has(postId)) return;
	const img = findWebmThumbImage(thumb);
	if (img === null) return;
	const videoUrl = buildVideoUrlFromThumbUrl(img.currentSrc || img.src);
	if (videoUrl === null) return;
	const link = findThumbLink(thumb, postId);
	if (link === null) return;
	tearDownActive();
	ensureThumbAnchor(thumb);
	const video = document.createElement("video");
	video.className = VIDEO_CLASS;
	video.muted = true;
	video.defaultMuted = true;
	video.loop = true;
	video.playsInline = true;
	video.setAttribute("playsinline", "");
	video.preload = PRELOAD_NONE;
	video.setAttribute("aria-hidden", "true");
	const onError = () => {
		failedPostIds.add(postId);
		if (activePreview?.video === video) tearDownActive();
		else {
			video.removeEventListener("error", onError);
			video.pause();
			video.src = "";
			video.load();
			video.remove();
		}
	};
	video.addEventListener("error", onError);
	video.src = videoUrl;
	link.after(video);
	activePreview = {
		thumb,
		video,
		postId,
		onError
	};
	const playResult = video.play();
	if (playResult !== void 0) playResult.catch(() => {});
}
function onThumbPointerEnter(event) {
	const thumb = event.currentTarget;
	if (!(thumb instanceof HTMLElement)) return;
	const postId = extractPostIdFromThumb(thumb);
	if (postId === null || failedPostIds.has(postId)) return;
	if (findWebmThumbImage(thumb) === null) return;
	clearHoverTimer();
	hoverThumb = thumb;
	hoverTimerId = window.setTimeout(() => {
		hoverTimerId = null;
		if (hoverThumb !== thumb) return;
		startPreview(thumb);
	}, 200);
}
function onThumbPointerLeave(event) {
	const thumb = event.currentTarget;
	if (!(thumb instanceof HTMLElement)) return;
	if (hoverThumb === thumb) hoverThumb = null;
	clearHoverTimer();
	if (activePreview?.thumb === thumb) tearDownActive();
}
function bindThumb(thumb) {
	if (boundThumbGeneration.get(thumb) === bindGeneration) return;
	if (findWebmThumbImage(thumb) === null) return;
	boundThumbGeneration.set(thumb, bindGeneration);
	thumb.addEventListener("pointerenter", onThumbPointerEnter);
	thumb.addEventListener("pointerleave", onThumbPointerLeave);
}
function bindThumbsInRoot(root) {
	const thumbs = root.querySelectorAll(SITE_SELECTORS.thumb);
	for (const thumb of thumbs) if (thumb instanceof HTMLElement) bindThumb(thumb);
}
function startBindings() {
	if (started) return;
	started = true;
	bindThumbsInRoot(document);
	onThumbsAdded((root) => {
		bindThumbsInRoot(root);
	});
}
function mountVideoPreview(ctx) {
	if (ctx.pageKind !== "list" && ctx.pageKind !== "favorites") return;
	scheduleAfterFirstPaint(() => {
		startBindings();
	});
}
var FEATURES = exports("aH",[
	feedFeature,
	menuCleanupFeature,
	tagGroupsFeature,
	searchToolsFeature,
	seenDimFeature,
	playlistMenuFeature,
	playlistBarFeature,
	blacklistHideFeature,
	infiniteScrollFeature,
	postActionsFeature,
	gridDensityFeature,
	favoritesBulkFeature,
	videoPlayerFeature,
	{
		id: FEATURE_ID,
		label: FEATURE_LABEL,
		pages: [...FEATURE_PAGES],
		defaultEnabled: false,
		settingsCaption: VIDEO_PREVIEW_SETTING_CAPTION,
		css: FEATURE_CSS,
		mount: mountVideoPreview
	}
]);
var mountedIds = /* @__PURE__ */ new Set();
var activePageKind = null;
var activeSearch = "";
var thumbsAddedListeners = /* @__PURE__ */ new Set();
/** Subscribe to thumbs inserted after the initial page load (e.g. infinite scroll). */
function onThumbsAdded(cb) {
	thumbsAddedListeners.add(cb);
	return () => {
		thumbsAddedListeners.delete(cb);
	};
}
/** Notify subscribers that new thumb nodes exist under `root`. */
function notifyThumbsAdded(root) {
	for (const listener of thumbsAddedListeners) listener(root);
}
function findFeature(id) {
	return FEATURES.find((feature) => feature.id === id);
}
function isFeatureEnabled(id) {
	const feature = findFeature(id);
	if (feature === void 0) return false;
	return getFeatureEnabled(id, feature.defaultEnabled);
}
function getFeatureChoice(id) {
	const feature = findFeature(id);
	if (feature?.choice === void 0) return "";
	const stored = getFeatureChoiceValue(id);
	if (stored !== void 0 && feature.choice.options.some((option) => option.value === stored)) return stored;
	return feature.choice.defaultValue;
}
function ensureFeatureCss(feature) {
	const styleId = `${FEATURE_STYLE_ID_PREFIX}${feature.id}`;
	if (document.getElementById(styleId) !== null) return;
	const style = document.createElement("style");
	style.id = styleId;
	style.textContent = feature.css;
	document.head.append(style);
}
function createContext(feature, pageKind, search) {
	return {
		pageKind,
		search,
		getState: (parse) => {
			return parse(getFeatureState(feature.id));
		},
		setState: (value) => {
			setFeatureState(feature.id, value);
		}
	};
}
function resolvePageContext() {
	if (activePageKind !== null) return {
		pageKind: activePageKind,
		search: activeSearch
	};
	return {
		pageKind: detectPageKind(window.location.search),
		search: window.location.search
	};
}
function clearChoiceBodyClasses(feature) {
	if (feature.choice === void 0) return;
	for (const option of feature.choice.options) document.body.classList.remove(featureChoiceBodyClass(feature.id, option.value));
}
function mountFeatureOnce(feature) {
	if (mountedIds.has(feature.id)) return;
	const { pageKind, search } = resolvePageContext();
	if (!feature.pages.includes(pageKind)) return;
	mountedIds.add(feature.id);
	try {
		feature.mount(createContext(feature, pageKind, search));
	} catch (error) {
		log.error(`Feature mount failed: ${feature.id}`, error);
	}
}
/**
* Body class + feature CSS + mount once. Used by layout-before-paint and runtime.
* Records the id in mountedIds so deferred runFeatures will not remount.
*/
function applyFeatureChrome(feature, pageKind, search, options = {}) {
	if (mountedIds.has(feature.id)) return;
	if (!feature.pages.includes(pageKind)) return;
	activePageKind = pageKind;
	activeSearch = search;
	document.body.classList.add(featureBodyClass(feature.id));
	if (feature.choice !== void 0) {
		const choiceValue = options.choiceValue ?? (() => {
			const stored = getFeatureChoiceValue(feature.id);
			if (stored !== void 0 && feature.choice.options.some((option) => option.value === stored)) return stored;
			return feature.choice.defaultValue;
		})();
		clearChoiceBodyClasses(feature);
		document.body.classList.add(featureChoiceBodyClass(feature.id, choiceValue));
	}
	ensureFeatureCss(feature);
	mountedIds.add(feature.id);
	try {
		feature.mount(createContext(feature, pageKind, search));
	} catch (error) {
		log.error(`Feature mount failed: ${feature.id}`, error);
	}
}
/**
* Live-apply a cssOnly feature enable/disable: body classes + CSS injection.
* Mounts once if not yet mounted when enabling. Does not remount on re-enable.
*/
function applyCssOnlyFeatureEnabled(id, enabled) {
	const feature = findFeature(id);
	if (feature?.cssOnly !== true) return;
	if (!getTweaksEnabled()) return;
	if (!enabled) {
		document.body.classList.remove(featureBodyClass(feature.id));
		clearChoiceBodyClasses(feature);
		return;
	}
	ensureFeatureCss(feature);
	document.body.classList.add(featureBodyClass(feature.id));
	if (feature.choice !== void 0) {
		clearChoiceBodyClasses(feature);
		document.body.classList.add(featureChoiceBodyClass(feature.id, getFeatureChoice(feature.id)));
	}
	mountFeatureOnce(feature);
}
/**
* Live-apply a cssOnly feature choice: swap body.rdw-f-<id>-<value> classes.
*/
function applyCssOnlyFeatureChoice(id, value) {
	const feature = findFeature(id);
	if (feature?.cssOnly !== true || feature.choice === void 0) return;
	if (!getTweaksEnabled()) return;
	if (!getFeatureEnabled(id, feature.defaultEnabled)) return;
	ensureFeatureCss(feature);
	clearChoiceBodyClasses(feature);
	document.body.classList.add(featureChoiceBodyClass(feature.id, value));
}
/** Zero-delay yield so the browser can paint / handle input between mounts. */
function yieldToMain() {
	return new Promise((resolve) => {
		setTimeout(resolve, 0);
	});
}
/**
* Mount remaining features one-by-one, yielding to the main thread between each.
* Skips ids already mounted during layout-before-paint.
*/
async function runFeaturesYielding(pageKind, search, features = FEATURES) {
	activePageKind = pageKind;
	activeSearch = search;
	if (!getTweaksEnabled()) return;
	for (const feature of features) {
		if (mountedIds.has(feature.id)) continue;
		if (!feature.pages.includes(pageKind)) continue;
		if (!getFeatureEnabled(feature.id, feature.defaultEnabled)) continue;
		applyFeatureChrome(feature, pageKind, search);
		await yieldToMain();
	}
}
/**
* DOM-ready, still before first paint yield: layout-affecting body classes + CSS.
* Does not mount thumb buttons, search Preact panel, feed, marks, etc.
*/
/** Must match search-tools root id/class (feature owns mount; we only reserve). */
var SEARCH_TOOLS_FEATURE_ID = "search-tools";
var SEARCH_TOOLS_ROOT_ID = "rdw-search-tools";
var SEARCH_TOOLS_ROOT_CLASS = "rdw-search-tools";
var SEARCH_TOOLS_RESERVE_STYLE_ID = "rdw-search-tools-reserve";
/** Approx panel height (chips + media + sort + source + foot) to avoid layout jump. */
var SEARCH_TOOLS_RESERVE_MIN_HEIGHT_PX = 168;
var SEARCH_TOOLS_RESERVE_MARGIN_TOP_PX = 8;
var TAGS_INPUT_SELECTOR = "input[name=\"tags\"]";
var LAYOUT_FEATURES = [menuCleanupFeature, gridDensityFeature];
function buildSearchReserveCss(bodyClass) {
	return [
		`body.${bodyClass} #${SEARCH_TOOLS_ROOT_ID} {`,
		`  min-height: ${String(SEARCH_TOOLS_RESERVE_MIN_HEIGHT_PX)}px;`,
		`  margin-top: ${String(SEARCH_TOOLS_RESERVE_MARGIN_TOP_PX)}px;`,
		"  box-sizing: border-box;",
		"}"
	].join("\n");
}
function ensureSearchToolsPlaceholder() {
	const input = document.querySelector(TAGS_INPUT_SELECTOR);
	if (!(input instanceof HTMLInputElement)) return;
	const form = input.closest("form");
	if (!(form instanceof HTMLFormElement)) return;
	const existing = document.getElementById(SEARCH_TOOLS_ROOT_ID);
	if (existing instanceof HTMLDivElement) {
		if (existing.previousElementSibling !== form) form.after(existing);
		return;
	}
	const root = document.createElement("div");
	root.id = SEARCH_TOOLS_ROOT_ID;
	root.className = SEARCH_TOOLS_ROOT_CLASS;
	form.after(root);
}
/**
* Apply grid-density / menu-cleanup chrome (+ menu mount) and reserve search
* panel space. Uses cached cheap layout settings (no store.load / zod).
*/
function applyLayoutBeforePaint() {
	const pageKind = detectPageKind(window.location.search);
	const search = window.location.search;
	const layout = peekLayoutSettings();
	for (const feature of LAYOUT_FEATURES) {
		if (!feature.pages.includes(pageKind)) continue;
		if (!resolveFeatureEnabled(layout, feature.id, feature.defaultEnabled)) continue;
		const choiceValue = feature.choice !== void 0 ? resolveFeatureChoice(layout, feature.id, feature.choice.defaultValue, feature.choice.options.map((option) => option.value)) : void 0;
		applyFeatureChrome(feature, pageKind, search, { ...choiceValue !== void 0 ? { choiceValue } : {} });
	}
	if ((pageKind === "list" || pageKind === "post") && resolveFeatureEnabled(layout, SEARCH_TOOLS_FEATURE_ID, true)) {
		const bodyClass = featureBodyClass(SEARCH_TOOLS_FEATURE_ID);
		document.body.classList.add(bodyClass);
		const style = ensureStyleElement(SEARCH_TOOLS_RESERVE_STYLE_ID);
		style.textContent = buildSearchReserveCss(bodyClass);
		ensureSearchToolsPlaceholder();
	}
}
bootEarly();
whenDomReady(() => {
	applyLayoutBeforePaint();
	scheduleAfterFirstPaint(() => {
		module.import('./app-DmZ929w1-B2f0K97j.js').then(({ startApp }) => {
			startApp();
		});
	});
});})}}));
System.register("./app-DmZ929w1-B2f0K97j.js", ['./___monkey.entry.js'],(function(exports,module){'use strict';var yieldToMain,detectPageKind,mountCards,syncFavoritesPage,runFeaturesYielding,getAppearance,applyAppearanceTheme,ensureDocumentStyles,SITE_SELECTORS,log,SITE_ORIGIN,SEARCH_PARAM_TAGS,normalizeArtistTag,CSS_CLASS,ensureStyleElement,RDW_OWN_PAGE_STYLE_ID,buildOwnPageCss,HEADER_SELECTOR,RDW_OWN_PAGE_CLASS,MENU_ITEM_ID,parseRdwHash,getSyncState,readFavoritesSyncMode,FAVORITES_SYNC_MODE_FULL,runFavoritesSync,UI_TEXT,Q$1,RDW_PAGE_ROOT_ID,NAVBAR_SELECTOR,FEED_MENU_ITEM_ID,RDW_HASH_COLLECTIONS,MENU_LABEL,RDW_HASH_FOLLOWING,resolveFavoritesUserId,MY_FAVORITES_CONTAINER_ID,RDW_HASH_SETTINGS,rdwPageHash,createFavoritesSyncTabId,APPEARANCE_BACKGROUND_KEY,readArtistsMirror,listArtistTags,writeArtistsMirror,reloadFromStorage,save,CURRENT_PAGE_CLASS,setSyncState,SEARCH_PARAM_PAGE,FAVORITES_PAGE,FAVORITES_SECTION_VIEW,SEARCH_PATH,a,applyTokenProperties,resolveAppearancePalette,isCollectionDetailPage,menuRouteForPage,getSiteSkinCss,$$1,PANEL_UI_CLASS,TOKEN_VAR,RDW_THEME_ATTR,APPEARANCE_THEME_SITE,APPEARANCE_THEME_SITE_DARK,SITE_LIGHT_C_BG,SITE_LIGHT_C_BG_ALT,SITE_DARK_C_BG,SITE_DARK_C_BORDER,APPEARANCE_BACKGROUND_TOO_LARGE;return{setters:[function(module){yieldToMain=module.y;detectPageKind=module.d;mountCards=module.m;syncFavoritesPage=module.s;runFeaturesYielding=module.r;getAppearance=module.g;applyAppearanceTheme=module.a;ensureDocumentStyles=module.e;SITE_SELECTORS=module.S;log=module.l;SITE_ORIGIN=module.b;SEARCH_PARAM_TAGS=module.c;normalizeArtistTag=module.n;CSS_CLASS=module.C;ensureStyleElement=module.f;RDW_OWN_PAGE_STYLE_ID=module.R;buildOwnPageCss=module.h;HEADER_SELECTOR=module.H;RDW_OWN_PAGE_CLASS=module.i;MENU_ITEM_ID=module.M;parseRdwHash=module.p;getSyncState=module.j;readFavoritesSyncMode=module.k;FAVORITES_SYNC_MODE_FULL=module.F;runFavoritesSync=module.o;UI_TEXT=module.U;Q$1=module.Q;RDW_PAGE_ROOT_ID=module.q;NAVBAR_SELECTOR=module.N;FEED_MENU_ITEM_ID=module.t;RDW_HASH_COLLECTIONS=module.u;MENU_LABEL=module.v;RDW_HASH_FOLLOWING=module.w;resolveFavoritesUserId=module.x;MY_FAVORITES_CONTAINER_ID=module.z;RDW_HASH_SETTINGS=module.A;rdwPageHash=module.B;createFavoritesSyncTabId=module.D;APPEARANCE_BACKGROUND_KEY=module.E;readArtistsMirror=module.G;listArtistTags=module.I;writeArtistsMirror=module.J;reloadFromStorage=module.K;save=module.L;CURRENT_PAGE_CLASS=module.O;setSyncState=module.P;SEARCH_PARAM_PAGE=module.T;FAVORITES_PAGE=module.V;FAVORITES_SECTION_VIEW=module.W;SEARCH_PATH=module.X;a=module.Y;applyTokenProperties=module.Z;resolveAppearancePalette=module._;isCollectionDetailPage=module.$;menuRouteForPage=module.a0;getSiteSkinCss=module.a1;$$1=module.a2;PANEL_UI_CLASS=module.a3;TOKEN_VAR=module.a4;RDW_THEME_ATTR=module.a5;APPEARANCE_THEME_SITE=module.a6;APPEARANCE_THEME_SITE_DARK=module.a7;SITE_LIGHT_C_BG=module.a8;SITE_LIGHT_C_BG_ALT=module.a9;SITE_DARK_C_BG=module.aa;SITE_DARK_C_BORDER=module.ab;APPEARANCE_BACKGROUND_TOO_LARGE=module.ac;}],execute:(function(){exports({i:navigateToRdwRoute,n:loadBackground,r:saveBackground,startApp:startApp,t:clearBackground});/** Matches host.tsx page title class (owned there; styled here for site polish). */
var PAGE_TITLE_CLASS$1 = "rdw-page-title";
/** Matches kit SectionLabel class. */
var SECTION_LABEL_CLASS = "rdw-section-label";
/** Kit select list — keep in sync with src/ui/kit/select.tsx. */
var KIT_SELECT_LIST_CLASS = "rdw-select__list";
/** Kit autocomplete list — keep in sync with src/ui/kit/autocomplete-field.tsx. */
var KIT_AC_LIST_CLASS = "rdw-ac__list";
/** Kit dialog panel — keep in sync with src/ui/kit/dialog.tsx. */
var KIT_DIALOG_CLASS = "rdw-dialog";
/** Firefox / modern Chromium thin scrollbar (E HANDOFF). */
var SCROLLBAR_WIDTH = "thin";
/** Kit tabs — keep in sync with src/ui/kit/tabs.tsx (A→E HANDOFF). */
var KIT_TABS_CLASS = "rdw-tabs";
var KIT_TAB_CLASS = "rdw-tabs__tab";
/** Active tab underline width — keep in sync with kit/tabs.tsx. */
var TAB_UNDERLINE_PX = 2;
var SITE_THEME_SELECTOR = `[${RDW_THEME_ATTR}="${APPEARANCE_THEME_SITE}"]`;
var SITE_DARK_THEME_SELECTOR = `[${RDW_THEME_ATTR}="${APPEARANCE_THEME_SITE_DARK}"]`;
/**
* Shared layout CSS for own-page section content (lists, settings rows, artists).
* Injected once from the page host shadow root.
*/
var PAGE_CONTENT_CSS = `
.${PANEL_UI_CLASS.pageCard} {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;
}
.${PANEL_UI_CLASS.scrollRegion} {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
/* Shadow-DOM scrollables — tokens (site-skin cannot pierce :host). */
.${PANEL_UI_CLASS.scrollRegion},
.${KIT_SELECT_LIST_CLASS},
.${KIT_AC_LIST_CLASS},
.${KIT_DIALOG_CLASS} {
  scrollbar-width: ${SCROLLBAR_WIDTH};
  scrollbar-color: var(${TOKEN_VAR.border}) var(${TOKEN_VAR.surface});
}
/* Kit tabs in page shadow — tokens for all themes; Site muted→text. */
.${KIT_TABS_CLASS} {
  border-bottom: 1px solid var(${TOKEN_VAR.border});
  color: var(${TOKEN_VAR.text});
}
.${KIT_TAB_CLASS} {
  background: transparent;
  border: 0;
  border-bottom: ${String(TAB_UNDERLINE_PX)}px solid transparent;
  color: var(${TOKEN_VAR.muted});
}
.${KIT_TAB_CLASS}[aria-selected="true"] {
  color: var(${TOKEN_VAR.text});
  font-weight: 600;
  border-bottom-color: var(${TOKEN_VAR.accent});
}
:host-context(${SITE_THEME_SELECTOR}) .${KIT_TAB_CLASS},
:host-context(${SITE_DARK_THEME_SELECTOR}) .${KIT_TAB_CLASS} {
  color: var(${TOKEN_VAR.text});
}
:host-context(${SITE_THEME_SELECTOR}) .${KIT_TAB_CLASS}[aria-selected="true"],
:host-context(${SITE_DARK_THEME_SELECTOR}) .${KIT_TAB_CLASS}[aria-selected="true"] {
  border-bottom-color: var(${TOKEN_VAR.accent});
  color: var(${TOKEN_VAR.text});
}
.${CSS_CLASS.section} {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.${PANEL_UI_CLASS.settingsGroup} {
  display: grid;
  gap: 2px;
}
.${PANEL_UI_CLASS.settingsRow} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 8px;
  border-radius: var(--rdw-radius-m);
  font-size: 12.5px;
  color: var(--rdw-text);
}
.${PANEL_UI_CLASS.settingsCaption} {
  flex: 1 0 100%;
  margin: 0;
  font-size: 11px;
  line-height: 1.35;
  color: var(--rdw-muted);
}
/*
 * Card vs page: surface not darker than page; Site default card = --c-bg,
 * border = --c-bg-alt. Higher specificity than kit .rdw-card so it wins.
 */
:host-context(${SITE_THEME_SELECTOR}) .rdw-card.${PANEL_UI_CLASS.pageCard} {
  background: ${SITE_LIGHT_C_BG};
  border-color: ${SITE_LIGHT_C_BG_ALT};
}
:host-context(${SITE_DARK_THEME_SELECTOR}) .rdw-card.${PANEL_UI_CLASS.pageCard} {
  background: ${SITE_DARK_C_BG};
  border-color: ${SITE_DARK_C_BORDER};
}
.${PAGE_TITLE_CLASS$1} {
  color: var(--rdw-text);
}
.${SECTION_LABEL_CLASS} {
  color: var(--rdw-muted);
}
/* Muted fails AA on site greens / site-dark chrome — use text. */
:host-context(${SITE_THEME_SELECTOR}) .${PAGE_TITLE_CLASS$1},
:host-context(${SITE_DARK_THEME_SELECTOR}) .${PAGE_TITLE_CLASS$1},
:host-context(${SITE_THEME_SELECTOR}) .${SECTION_LABEL_CLASS},
:host-context(${SITE_DARK_THEME_SELECTOR}) .${SECTION_LABEL_CLASS} {
  color: var(--rdw-text);
}
.${PANEL_UI_CLASS.settingsRow} .rdw-switch-row {
  width: 100%;
  justify-content: space-between;
  flex-direction: row-reverse;
}
.${PANEL_UI_CLASS.settingsRow} .rdw-select,
.${PANEL_UI_CLASS.settingsRow} .rdw-num {
  width: 100%;
}
.${PANEL_UI_CLASS.artistMeta} {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.${PANEL_UI_CLASS.artistFilter} {
  flex-shrink: 0;
}
.${PANEL_UI_CLASS.artistList} {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.${PANEL_UI_CLASS.artistRow} {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 6px;
  border-radius: var(--rdw-radius-s);
}
.${PANEL_UI_CLASS.artistRow}:hover {
  background: var(--rdw-surface-2);
}
.${PANEL_UI_CLASS.artistLink} {
  color: var(--rdw-accent);
  text-decoration: none;
  font-weight: 600;
  word-break: break-word;
  flex: 1 1 auto;
  min-width: 0;
}
.${PANEL_UI_CLASS.artistLink}:hover {
  text-decoration: underline;
}
.${PANEL_UI_CLASS.artistLink}:focus-visible {
  outline: 2px solid var(--rdw-accent);
  outline-offset: 2px;
}
.${PANEL_UI_CLASS.artistUndo} {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  font-size: 12px;
  color: var(--rdw-muted);
}
.${CSS_CLASS.list} {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.${CSS_CLASS.listItem} {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-surface);
  color: var(--rdw-text);
}
.${CSS_CLASS.itemName} {
  border: 0;
  background: transparent;
  color: var(--rdw-accent);
  text-align: left;
  cursor: pointer;
  padding: 0;
  font: inherit;
  font-weight: 600;
  word-break: break-word;
}
.${CSS_CLASS.itemName}:disabled {
  color: var(--rdw-muted);
  cursor: not-allowed;
}
.${CSS_CLASS.itemActions},
.${CSS_CLASS.formActions},
.${CSS_CLASS.toolbar},
.${CSS_CLASS.confirmRow} {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.${CSS_CLASS.form} {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.${CSS_CLASS.hint} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 12px;
}
.${CSS_CLASS.error} {
  margin: 0;
  color: var(--rdw-danger);
  font-size: 12px;
}
`.trim();
var PAGE_SHELL_CLASS = "rdw-page-shell";
var PAGE_TITLE_CLASS = "rdw-page-title";
/**
* Structural shell only — palette tokens come from applyTokenProperties on the
* host (same source as document :root via resolveAppearancePalette).
*/
var PAGE_HOST_CSS = `
:host {
  all: initial;
  font-family: var(--rdw-font);
  font-size: 13px;
  line-height: 1.35;
  color: var(--rdw-text);
  background: transparent;
}
.${PAGE_SHELL_CLASS} {
  box-sizing: border-box;
  max-width: ${String(960)}px;
  margin: 0 auto;
  padding: 16px 12px 32px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.${PAGE_TITLE_CLASS} {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--rdw-text);
}
${PAGE_CONTENT_CSS}
`;
function PageShell(props) {
	return /* @__PURE__ */ a($$1, { children: [/* @__PURE__ */ a("style", { children: PAGE_HOST_CSS }), /* @__PURE__ */ a("div", {
		className: PAGE_SHELL_CLASS,
		children: [props.title !== null ? /* @__PURE__ */ a("h1", {
			className: PAGE_TITLE_CLASS,
			children: props.title
		}) : null, props.children]
	})] });
}
function titleForRoute(route) {
	if (isCollectionDetailPage(route)) return null;
	if (route === "collections") return MENU_LABEL.collections;
	if (route === "following") return MENU_LABEL.following;
	return MENU_LABEL.settings;
}
var settingsFactory = null;
var collectionsFactory = null;
var followingFactory = null;
function getSettingsFactory() {
	if (settingsFactory === null) settingsFactory = async () => {
		const mod = await module.import('./settings-page-BrvhLESP-Dy7Wi1Jc.js');
		return /* @__PURE__ */ a(mod.SettingsPage, {});
	};
	return settingsFactory;
}
function getCollectionsFactory() {
	if (collectionsFactory === null) collectionsFactory = async () => {
		const mod = await module.import('./collections-page-CjN6PebE-CkoKBrWC.js');
		return /* @__PURE__ */ a(mod.CollectionsPage, {});
	};
	return collectionsFactory;
}
function getFollowingFactory() {
	if (followingFactory === null) followingFactory = async () => {
		const mod = await module.import('./following-page-BF-OvY-B-BaKgA9A3.js');
		return /* @__PURE__ */ a(mod.FollowingPage, {});
	};
	return followingFactory;
}
function collectionDetailFactory(collectionId) {
	return async () => {
		const mod = await module.import('./collection-detail-page-DyUosBR5-B7CU73IV.js');
		return /* @__PURE__ */ a(mod.CollectionDetailPage, { collectionId }, collectionId);
	};
}
function pageFactoryForRoute(route) {
	if (isCollectionDetailPage(route)) return collectionDetailFactory(route.collectionId);
	if (route === "collections") return getCollectionsFactory();
	if (route === "following") return getFollowingFactory();
	return getSettingsFactory();
}
var hostElement = null;
var mountPoint = null;
var renderGeneration = 0;
function syncHostTokens(host) {
	applyTokenProperties(host, resolveAppearancePalette(getAppearance()));
}
function ensureHost(header) {
	if (hostElement !== null && mountPoint !== null) {
		if (hostElement.parentElement !== header.parentElement) header.after(hostElement);
		return {
			host: hostElement,
			mount: mountPoint
		};
	}
	const existing = document.getElementById(RDW_PAGE_ROOT_ID);
	if (existing !== null) existing.remove();
	const host = document.createElement("div");
	host.id = RDW_PAGE_ROOT_ID;
	const shadow = host.attachShadow({ mode: "open" });
	const mount = document.createElement("div");
	shadow.append(mount);
	header.after(host);
	hostElement = host;
	mountPoint = mount;
	return {
		host,
		mount
	};
}
/** Mount Preact page for route into #rdw-page-root after div#header. */
async function showRdwPage(route, header) {
	const { host, mount } = ensureHost(header);
	syncHostTokens(host);
	const generation = ++renderGeneration;
	const page = await pageFactoryForRoute(route)();
	if (generation !== renderGeneration || mountPoint !== mount) return;
	Q$1(/* @__PURE__ */ a(PageShell, {
		title: titleForRoute(route),
		children: page
	}), mount);
}
/** Unmount own page and remove #rdw-page-root. */
function hideRdwPage() {
	renderGeneration += 1;
	if (mountPoint !== null) Q$1(null, mountPoint);
	if (hostElement !== null) hostElement.remove();
	hostElement = null;
	mountPoint = null;
	const stray = document.getElementById(RDW_PAGE_ROOT_ID);
	if (stray !== null) stray.remove();
}
var CONTENT_ID = "content";
/** Stub pids when persisting userId with no prior sync blob. */
var FAVORITES_USER_ID_STUB_PID = 0;
var savedSiteCurrent = null;
var siteCurrentCaptured = false;
function isHeaderMenuListItem(listItem, content) {
	if (content !== null && content.contains(listItem)) return false;
	return true;
}
function findPostsMenuItem() {
	const content = document.getElementById(CONTENT_ID);
	const anchors = document.querySelectorAll("a");
	for (const node of anchors) {
		if (!(node instanceof HTMLAnchorElement)) continue;
		if ((node.textContent?.trim() ?? "") !== "Posts") continue;
		const listItem = node.closest("li");
		if (listItem === null || !(listItem instanceof HTMLLIElement)) continue;
		if (!isHeaderMenuListItem(listItem, content)) continue;
		return listItem;
	}
	return null;
}
function findNavbar() {
	const navbar = document.querySelector(NAVBAR_SELECTOR);
	return navbar instanceof HTMLUListElement ? navbar : null;
}
function findHeader$1() {
	const header = document.querySelector(HEADER_SELECTOR);
	return header instanceof HTMLElement ? header : null;
}
/**
* Persist favorites owner id on the favs sync blob (Package E shape).
* Creates a finished stub when no sync exists so the UI does not show Resume.
*/
function persistFavoritesUserId(userId) {
	if (!Number.isFinite(userId) || userId <= 0) return;
	const normalized = Math.trunc(userId);
	const existing = getSyncState();
	if (existing?.userId === normalized) return;
	if (existing !== void 0) {
		const next = {
			...existing,
			userId: normalized
		};
		setSyncState(next);
		return;
	}
	const now = (/* @__PURE__ */ new Date()).toISOString();
	setSyncState({
		nextPid: FAVORITES_USER_ID_STUB_PID,
		lastPid: FAVORITES_USER_ID_STUB_PID,
		startedAt: now,
		finishedAt: now,
		userId: normalized
	});
}
function buildFavoritesHrefFromUserId(userId) {
	const params = new URLSearchParams();
	params.set(SEARCH_PARAM_PAGE, FAVORITES_PAGE);
	params.set("s", FAVORITES_SECTION_VIEW);
	params.set("id", String(userId));
	return `${SEARCH_PATH}?${params.toString()}`;
}
/**
* Favorites → site page; null when user id is unknown.
* Sources (Package E): menu link → favorites URL id → saved sync userId.
* Always persists a resolved id.
*/
function resolveFavoritesHref(root = document, search = window.location.search) {
	const userId = resolveFavoritesUserId(root, search, getSyncState()?.userId);
	if (userId === null || userId <= 0) return null;
	persistFavoritesUserId(userId);
	return buildFavoritesHrefFromUserId(userId);
}
function ensureMenuLink(id, label, href) {
	const existing = document.getElementById(id);
	if (existing instanceof HTMLLIElement) {
		const anchor = existing.querySelector("a");
		if (anchor instanceof HTMLAnchorElement) {
			anchor.textContent = label;
			anchor.href = href;
		}
		return existing;
	}
	const item = document.createElement("li");
	item.id = id;
	const anchor = document.createElement("a");
	anchor.textContent = label;
	anchor.href = href;
	item.append(anchor);
	return item;
}
function hideNativeMyFavorites() {
	const container = document.getElementById(MY_FAVORITES_CONTAINER_ID);
	if (container instanceof HTMLLIElement) container.hidden = true;
}
function insertionAnchorAfterFeedOrPosts() {
	const feed = document.getElementById(FEED_MENU_ITEM_ID);
	if (feed instanceof HTMLLIElement) return feed;
	return findPostsMenuItem();
}
/**
* Navbar: after Posts/Feed → Collections, Following, Favorites; end → RuleDesk.
* No-op when div#header / ul#navbar missing.
*/
function installSiteMenu() {
	if (findHeader$1() === null) return;
	const navbar = findNavbar();
	if (navbar === null) return;
	const anchor = insertionAnchorAfterFeedOrPosts();
	if (anchor === null) return;
	const collections = ensureMenuLink(MENU_ITEM_ID.collections, MENU_LABEL.collections, RDW_HASH_COLLECTIONS);
	const following = ensureMenuLink(MENU_ITEM_ID.following, MENU_LABEL.following, RDW_HASH_FOLLOWING);
	if (collections.parentElement !== navbar) anchor.after(collections);
	else if (collections.previousElementSibling !== anchor) anchor.after(collections);
	if (following.previousElementSibling !== collections) collections.after(following);
	const favoritesHref = resolveFavoritesHref();
	const existingFavorites = document.getElementById(MENU_ITEM_ID.favorites);
	if (favoritesHref === null) {
		if (existingFavorites !== null) existingFavorites.remove();
	} else {
		const favorites = ensureMenuLink(MENU_ITEM_ID.favorites, MENU_LABEL.favorites, favoritesHref);
		if (favorites.previousElementSibling !== following) following.after(favorites);
	}
	hideNativeMyFavorites();
	const settings = ensureMenuLink(MENU_ITEM_ID.settings, MENU_LABEL.settings, RDW_HASH_SETTINGS);
	if (settings.parentElement !== navbar || navbar.lastElementChild !== settings) navbar.append(settings);
}
function menuItemIdForRoute(route) {
	if (route === "collections") return MENU_ITEM_ID.collections;
	if (route === "following") return MENU_ITEM_ID.following;
	return MENU_ITEM_ID.settings;
}
function captureSiteCurrentIfNeeded() {
	if (siteCurrentCaptured) return;
	siteCurrentCaptured = true;
	const navbar = findNavbar();
	if (navbar === null) {
		savedSiteCurrent = null;
		return;
	}
	const current = navbar.querySelector(`li.${CURRENT_PAGE_CLASS}`);
	savedSiteCurrent = current instanceof HTMLLIElement && current.id !== MENU_ITEM_ID.collections && current.id !== MENU_ITEM_ID.following && current.id !== MENU_ITEM_ID.favorites && current.id !== MENU_ITEM_ID.settings ? current : null;
}
function clearAllOwnCurrent() {
	for (const id of Object.values(MENU_ITEM_ID)) {
		const item = document.getElementById(id);
		if (item instanceof HTMLLIElement) item.classList.remove(CURRENT_PAGE_CLASS);
	}
}
/** Mark the own-page nav item; remember site current-page for restore. */
function setOwnPageCurrentHighlight(route) {
	captureSiteCurrentIfNeeded();
	const navbar = findNavbar();
	if (navbar !== null) for (const child of navbar.querySelectorAll(`li.${CURRENT_PAGE_CLASS}`)) child.classList.remove(CURRENT_PAGE_CLASS);
	clearAllOwnCurrent();
	const item = document.getElementById(menuItemIdForRoute(route));
	if (item instanceof HTMLLIElement) item.classList.add(CURRENT_PAGE_CLASS);
}
/** Restore site current-page after leaving #rdw/ routes. */
function clearOwnPageCurrentHighlight() {
	clearAllOwnCurrent();
	if (savedSiteCurrent !== null && savedSiteCurrent.isConnected) savedSiteCurrent.classList.add(CURRENT_PAGE_CLASS);
	savedSiteCurrent = null;
	siteCurrentCaptured = false;
}
var EVENT_HASHCHANGE = "hashchange";
var EVENT_POPSTATE = "popstate";
var EVENT_CLICK = "click";
var HISTORY_STATE_TITLE = "";
var routerBound = false;
var syncGeneration = 0;
function ensureOwnPageStyle() {
	const style = ensureStyleElement(RDW_OWN_PAGE_STYLE_ID);
	style.textContent = buildOwnPageCss();
}
function findHeader() {
	const header = document.querySelector(HEADER_SELECTOR);
	return header instanceof HTMLElement ? header : null;
}
async function enterRoute(route) {
	const header = findHeader();
	if (header === null) return;
	document.documentElement.classList.add(RDW_OWN_PAGE_CLASS);
	await showRdwPage(route, header);
	setOwnPageCurrentHighlight(menuRouteForPage(route));
}
function leaveRoute() {
	document.documentElement.classList.remove(RDW_OWN_PAGE_CLASS);
	hideRdwPage();
	clearOwnPageCurrentHighlight();
}
async function syncFromHash() {
	const generation = ++syncGeneration;
	if (findHeader() === null) {
		leaveRoute();
		return;
	}
	const route = parseRdwHash(window.location.hash);
	if (route === null) {
		leaveRoute();
		return;
	}
	await enterRoute(route);
	if (generation !== syncGeneration) return;
}
function onHashChange() {
	syncFromHash();
}
function onPopState() {
	syncFromHash();
}
function isModifiedClick(event) {
	return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}
/**
* First visit to a #rdw/* route pushes history; switching among script pages
* replaces so Back returns to the underlying site page.
*/
async function navigateToRdwRoute(route) {
	const nextHash = rdwPageHash(route);
	const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;
	if (parseRdwHash(window.location.hash) !== null) window.history.replaceState(window.history.state, HISTORY_STATE_TITLE, nextUrl);
	else window.history.pushState(window.history.state, HISTORY_STATE_TITLE, nextUrl);
	await syncFromHash();
}
function onDocumentClick(event) {
	if (event.defaultPrevented || isModifiedClick(event)) return;
	const target = event.target;
	if (!(target instanceof Element)) return;
	const anchor = target.closest("a");
	if (!(anchor instanceof HTMLAnchorElement)) return;
	if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
	let url;
	try {
		url = new URL(anchor.href, window.location.href);
	} catch {
		return;
	}
	if (url.origin !== window.location.origin) return;
	if (url.pathname !== window.location.pathname || url.search !== window.location.search) return;
	const route = parseRdwHash(url.hash);
	if (route === null) return;
	event.preventDefault();
	navigateToRdwRoute(route);
}
/**
* Install navbar items + hash router. No menu / no page when div#header is absent.
* Page Preact modules load lazily on first #rdw/* open (factories in host).
* The collection detail module loads only for #rdw/collections/<id>.
*/
async function startRdwPages() {
	ensureOwnPageStyle();
	if (findHeader() === null) {
		leaveRoute();
		return;
	}
	installSiteMenu();
	if (!routerBound) {
		routerBound = true;
		window.addEventListener(EVENT_HASHCHANGE, onHashChange);
		window.addEventListener(EVENT_POPSTATE, onPopState);
		document.addEventListener(EVENT_CLICK, onDocumentClick);
	}
	await syncFromHash();
}
/** Lock with no heartbeat for this long is considered abandoned. */
var FAVORITES_SYNC_LOCK_STALE_MS = 1e4;
/** Grace pause after detecting a stale lock before this tab resumes. */
var FAVORITES_SYNC_RESUME_DELAY_MS = 3e3;
var sessionTabId;
var resumeAttempted = false;
function delay(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}
/** Stable tab id for this page session (created once). */
function getFavoritesSyncRunnerTabId() {
	if (sessionTabId === void 0) sessionTabId = createFavoritesSyncTabId();
	return sessionTabId;
}
/**
* True when sync claims to be running and the lock is missing or older than
* {@link FAVORITES_SYNC_LOCK_STALE_MS}. Fresh locks (any tabId) are not resumed.
*/
function shouldResumeStaleFavoritesSync(sync, now) {
	if (sync?.running !== true) return false;
	const lock = sync.lock;
	if (lock === void 0) return true;
	return now - lock.beatAt > FAVORITES_SYNC_LOCK_STALE_MS;
}
/**
* True when another tab holds a fresh lock — this tab must not start sync.
*/
function shouldSkipForFreshForeignLock(sync, thisTabId, now) {
	if (sync?.running !== true) return false;
	const lock = sync.lock;
	if (lock === void 0) return false;
	if (now - lock.beatAt > 1e4) return false;
	return lock.tabId !== thisTabId;
}
/**
* After a stale-lock check (and optional delay), resume via {@link runFavoritesSync}
* with this session's tabId so nextPid continues in this tab.
*/
async function resumeFavoritesSyncIfStale() {
	const tabId = getFavoritesSyncRunnerTabId();
	const before = getSyncState();
	if (shouldSkipForFreshForeignLock(before, tabId, Date.now())) return false;
	if (!shouldResumeStaleFavoritesSync(before, Date.now())) return false;
	await delay(FAVORITES_SYNC_RESUME_DELAY_MS);
	const after = getSyncState();
	if (shouldSkipForFreshForeignLock(after, tabId, Date.now())) return false;
	if (!shouldResumeStaleFavoritesSync(after, Date.now())) return false;
	const mode = readFavoritesSyncMode(after) ?? FAVORITES_SYNC_MODE_FULL;
	await runFavoritesSync({
		tabId,
		signal: new AbortController().signal,
		onProgress: () => {},
		mode
	});
	return true;
}
/**
* Fire-and-forget entry for DOM-ready: at most one resume attempt per page load.
*/
function maybeResumeFavoritesSync() {
	if (resumeAttempted) return;
	resumeAttempted = true;
	resumeFavoritesSyncIfStale().catch((error) => {
		log.error("favorites sync resume failed", error);
	});
}
var BACKGROUND_DB_NAME = "ruledesk-web.background";
var BACKGROUND_DB_VERSION = 1;
var BACKGROUND_STORE_NAME = "background";
/** Single record key inside the object store. */
var BACKGROUND_RECORD_KEY = "dataUrl";
function getGmGetValue() {
	return GM_getValue;
}
function getGmSetValue() {
	return GM_setValue;
}
function byteLengthUtf8(value) {
	if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(value).length;
	return value.length;
}
function readGmBackground() {
	try {
		const raw = getGmGetValue()(APPEARANCE_BACKGROUND_KEY, void 0);
		if (typeof raw !== "string" || raw.length === 0) return null;
		return raw;
	} catch (error) {
		log.error("background-store: GM read failed", error);
		return null;
	}
}
function clearGmBackground() {
	try {
		getGmSetValue()(APPEARANCE_BACKGROUND_KEY, "");
	} catch (error) {
		log.error("background-store: GM clear failed", error);
	}
}
function openBackgroundDb() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(BACKGROUND_DB_NAME, BACKGROUND_DB_VERSION);
		request.onerror = () => {
			reject(request.error ?? /* @__PURE__ */ new Error("background-store: indexedDB open failed"));
		};
		request.onsuccess = () => {
			resolve(request.result);
		};
		request.onupgradeneeded = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains(BACKGROUND_STORE_NAME)) db.createObjectStore(BACKGROUND_STORE_NAME);
		};
	});
}
function idbGet(db) {
	return new Promise((resolve, reject) => {
		const request = db.transaction(BACKGROUND_STORE_NAME, "readonly").objectStore(BACKGROUND_STORE_NAME).get(BACKGROUND_RECORD_KEY);
		request.onerror = () => {
			reject(request.error ?? /* @__PURE__ */ new Error("background-store: get failed"));
		};
		request.onsuccess = () => {
			const value = request.result;
			if (typeof value === "string" && value.length > 0) {
				resolve(value);
				return;
			}
			resolve(null);
		};
	});
}
function idbPut(db, dataUrl) {
	return new Promise((resolve, reject) => {
		const tx = db.transaction(BACKGROUND_STORE_NAME, "readwrite");
		const request = tx.objectStore(BACKGROUND_STORE_NAME).put(dataUrl, BACKGROUND_RECORD_KEY);
		request.onerror = () => {
			reject(request.error ?? /* @__PURE__ */ new Error("background-store: put failed"));
		};
		tx.oncomplete = () => {
			resolve();
		};
		tx.onerror = () => {
			reject(tx.error ?? /* @__PURE__ */ new Error("background-store: put transaction failed"));
		};
	});
}
function idbDelete(db) {
	return new Promise((resolve, reject) => {
		const tx = db.transaction(BACKGROUND_STORE_NAME, "readwrite");
		const request = tx.objectStore(BACKGROUND_STORE_NAME).delete(BACKGROUND_RECORD_KEY);
		request.onerror = () => {
			reject(request.error ?? /* @__PURE__ */ new Error("background-store: delete failed"));
		};
		tx.oncomplete = () => {
			resolve();
		};
		tx.onerror = () => {
			reject(tx.error ?? /* @__PURE__ */ new Error("background-store: delete transaction failed"));
		};
	});
}
/**
* If the legacy GM background key still holds a value and IDB is empty,
* copy it into IDB and clear the GM key.
*/
async function migrateGmToIdb(db) {
	const existing = await idbGet(db);
	if (existing !== null) {
		clearGmBackground();
		return existing;
	}
	const fromGm = readGmBackground();
	if (fromGm === null) return null;
	await idbPut(db, fromGm);
	clearGmBackground();
	return fromGm;
}
/** Loads the background data URL from IndexedDB (migrating from GM once if needed). */
async function loadBackground() {
	try {
		const db = await openBackgroundDb();
		try {
			return await migrateGmToIdb(db);
		} finally {
			db.close();
		}
	} catch (error) {
		log.error("background-store: load failed", error);
		return null;
	}
}
/** Stores a background image data URL in IndexedDB (clears any leftover GM value). */
async function saveBackground(dataUrl) {
	if (byteLengthUtf8(dataUrl) > 1572864) throw new Error(APPEARANCE_BACKGROUND_TOO_LARGE);
	const db = await openBackgroundDb();
	try {
		await idbPut(db, dataUrl);
		clearGmBackground();
	} finally {
		db.close();
	}
}
/** Removes the background from IndexedDB and clears any leftover GM value. */
async function clearBackground() {
	try {
		const db = await openBackgroundDb();
		try {
			await idbDelete(db);
		} finally {
			db.close();
		}
	} catch (error) {
		log.error("background-store: clear idb failed", error);
	}
	clearGmBackground();
}
function extractArtistTagFromLi(li) {
	const links = li.querySelectorAll("a[href]");
	for (const node of links) {
		if (!(node instanceof HTMLAnchorElement)) continue;
		if (node.hasAttribute("onclick")) continue;
		const href = node.getAttribute("href");
		if (href === null || href.length === 0) continue;
		let url;
		try {
			url = new URL(href, SITE_ORIGIN);
		} catch {
			continue;
		}
		if (url.searchParams.get("page") !== "post") continue;
		if (url.searchParams.get("s") !== "list") continue;
		const tags = url.searchParams.get(SEARCH_PARAM_TAGS);
		if (tags === null) continue;
		return normalizeArtistTag(tags);
	}
	return null;
}
function mergeArtistTagsByTag(left, right) {
	const seen = /* @__PURE__ */ new Set();
	const merged = [];
	for (const tag of left) {
		if (seen.has(tag)) continue;
		seen.add(tag);
		merged.push(tag);
	}
	for (const tag of right) {
		if (seen.has(tag)) continue;
		seen.add(tag);
		merged.push(tag);
	}
	return merged;
}
/**
* Union of mirror + GM artists by tag.
* Before Follow/Unfollow write so a bfcache-stale GM snapshot cannot drop
* artists followed on another page (present only in the mirror).
*
* listArtistTags → reload syncs the mirror from GM; restore/merge immediately
* so that sync cannot leave the mirror permanently wiped.
*/
function readMergedArtistTags() {
	const mirrored = readArtistsMirror();
	const fromStorage = listArtistTags();
	if (mirrored === null || mirrored.length === 0) return fromStorage;
	const merged = mergeArtistTagsByTag(mirrored, fromStorage);
	writeArtistsMirror(merged);
	return merged;
}
function persistArtistTags(tags) {
	const data = reloadFromStorage();
	data.artists = tags.map((tag) => ({ tag }));
	save(data);
	writeArtistsMirror(tags);
}
function isFollowingResolved(tag) {
	return readMergedArtistTags().includes(tag);
}
function followArtist(tag) {
	const current = readMergedArtistTags();
	if (current.includes(tag)) {
		persistArtistTags(current);
		return;
	}
	persistArtistTags([...current, tag]);
}
function unfollowArtist(tag) {
	persistArtistTags(readMergedArtistTags().filter((entry) => entry !== tag));
}
function applyFollowState(button, following) {
	button.setAttribute("aria-pressed", following ? "true" : "false");
	button.classList.toggle(CSS_CLASS.artistFollowMarked, following);
	const label = following ? UI_TEXT.artistFollowing : UI_TEXT.artistFollow;
	const tag = button.dataset.rdwArtistTag ?? "";
	button.setAttribute("aria-label", `${label}: ${tag}`);
	button.textContent = label;
}
function attachFollowButton(li, tag) {
	if (li.querySelector(SITE_SELECTORS.artistFollowButton) !== null) return;
	const button = document.createElement("button");
	button.type = "button";
	button.className = CSS_CLASS.artistFollow;
	button.dataset.rdwArtistTag = tag;
	applyFollowState(button, isFollowingResolved(tag));
	button.addEventListener("click", (event) => {
		event.preventDefault();
		event.stopPropagation();
		const following = button.getAttribute("aria-pressed") === "true";
		try {
			if (following) {
				unfollowArtist(tag);
				applyFollowState(button, false);
			} else {
				followArtist(tag);
				applyFollowState(button, true);
			}
		} catch {
			applyFollowState(button, isFollowingResolved(tag));
		}
	});
	li.append(button);
}
function mountArtistSidebar(root = document, search = window.location.search) {
	const kind = detectPageKind(search);
	if (kind !== "list" && kind !== "post") return;
	ensureDocumentStyles();
	const sidebar = root.querySelector(SITE_SELECTORS.tagSidebar);
	if (sidebar === null) return;
	const rows = sidebar.querySelectorAll(SITE_SELECTORS.tagTypeArtist);
	for (const row of rows) {
		if (!(row instanceof HTMLElement)) continue;
		const tag = extractArtistTagFromLi(row);
		if (tag === null) continue;
		attachFollowButton(row, tag);
	}
}
/**
* Re-apply appearance with full store validation + async IDB background.
* Pre-paint only had cheap appearance + base CSS (no background image).
*/
async function syncAppearanceAfterPaint() {
	const appearance = getAppearance();
	const backgroundDataUrl = await loadBackground();
	applyAppearanceTheme({
		appearance,
		siteSkinCss: getSiteSkinCss(),
		...backgroundDataUrl !== null && backgroundDataUrl.length > 0 ? { backgroundDataUrl } : {}
	});
}
/**
* Feature + own-page mount — after first paint (body exists).
* Modules run one-by-one with yields between them.
*/
async function startApp() {
	await syncAppearanceAfterPaint();
	await yieldToMain();
	const pageKind = detectPageKind(window.location.search);
	const search = window.location.search;
	if (pageKind === "list") {
		mountCards();
		await yieldToMain();
		mountArtistSidebar();
		await yieldToMain();
	} else if (pageKind === "post") {
		mountArtistSidebar();
		await yieldToMain();
	} else if (pageKind === "favorites") {
		syncFavoritesPage();
		await yieldToMain();
	}
	await runFeaturesYielding(pageKind, search);
	await yieldToMain();
	await startRdwPages();
	await yieldToMain();
	maybeResumeFavoritesSync();
}})}}));
System.register("./settings-page-BrvhLESP-Dy7Wi1Jc.js", ['./___monkey.entry.js','./app-DmZ929w1-B2f0K97j.js'],(function(exports){'use strict';var d,a,PANEL_UI_CLASS,Card,SectionLabel,Switch,UI_TEXT,TWEAKS_SWITCH_ID,setTweaksEnabled,NumberField,UPDATES_GROUP_SIZE_ID,setUpdatesGroupSize,getUpdatesGroupSize,PLAYLIST_CHUNK_SIZE_ID,setPlaylistChunkSize,getPlaylistChunkSize,GRID_FAV_CHECKBOX_ID,setGridFavButtonsEnabled,setGridFavButtonsVisible,P$1,T,A,getAppearance,applyAppearanceTheme,getSiteSkinCss,APPEARANCE_THEME_CUSTOM,KIT_FOCUS_CSS,Select,APPEARANCE_THEME_SITE,APPEARANCE_THEME_SITE_DARK,APPEARANCE_THEME_LIGHT,APPEARANCE_THEME_DARK,$$1,Segmented,APPEARANCE_CUSTOM_BASE_LIGHT,APPEARANCE_CUSTOM_BASE_DARK,TextField,Button,clampBackgroundDim,FEATURES,featurePanelLabel,FEATURE_CHECKBOX_ID_PREFIX,setFeatureEnabled,applyCssOnlyFeatureEnabled,isFeatureEnabled,FEATURE_CHOICE_ID_PREFIX,setFeatureChoiceValue,applyCssOnlyFeatureChoice,getFeatureChoice,createAutocompleteQuerier,b,readSiteBlacklist,Chip,AutocompleteField,ProgressBar,createDefaultCustomTheme,AppearanceThemeSchema,prepareBackgroundImageFile,writeSiteBlacklist,runFavoritesSync,log,FAVORITES_SYNC_PAGE_PAUSE_MS,load,createDefaultStorage,clearStorageCache,clearFavsCache,getSyncState,object,StorageSchema,optional,string,FavsSchema,literal,IMPORT_SCHEMA_ERROR_PREFIX,stripLegacyPanelWindowSize,save,migrateMarksFavToFavs,FAVS_STORAGE_KEY,createDefaultFavs,parseFavsStrict,setAppearance,loadFavSet,STORAGE_BACKUP_KEY,extractFavIdsFromMarks,gridDensityFeature,FAVORITES_SYNC_MODE_INCREMENTAL,FAVORITES_SYNC_MODE_FULL,getTweaksEnabled,getGridFavButtonsEnabled,getFeatureChoiceValue,getScreenPixelSize,loadBackground,clearBackground,saveBackground;return{setters:[function(module){d=module.ad;a=module.Y;PANEL_UI_CLASS=module.a3;Card=module.ae;SectionLabel=module.af;Switch=module.ag;UI_TEXT=module.U;TWEAKS_SWITCH_ID=module.ah;setTweaksEnabled=module.ai;NumberField=module.aj;UPDATES_GROUP_SIZE_ID=module.ak;setUpdatesGroupSize=module.al;getUpdatesGroupSize=module.am;PLAYLIST_CHUNK_SIZE_ID=module.an;setPlaylistChunkSize=module.ao;getPlaylistChunkSize=module.ap;GRID_FAV_CHECKBOX_ID=module.aq;setGridFavButtonsEnabled=module.ar;setGridFavButtonsVisible=module.as;P$1=module.at;T=module.au;A=module.av;getAppearance=module.g;applyAppearanceTheme=module.a;getSiteSkinCss=module.a1;APPEARANCE_THEME_CUSTOM=module.aw;KIT_FOCUS_CSS=module.ax;Select=module.ay;APPEARANCE_THEME_SITE=module.a6;APPEARANCE_THEME_SITE_DARK=module.a7;APPEARANCE_THEME_LIGHT=module.az;APPEARANCE_THEME_DARK=module.aA;$$1=module.a2;Segmented=module.aB;APPEARANCE_CUSTOM_BASE_LIGHT=module.aC;APPEARANCE_CUSTOM_BASE_DARK=module.aD;TextField=module.aE;Button=module.aF;clampBackgroundDim=module.aG;FEATURES=module.aH;featurePanelLabel=module.aI;FEATURE_CHECKBOX_ID_PREFIX=module.aJ;setFeatureEnabled=module.aK;applyCssOnlyFeatureEnabled=module.aL;isFeatureEnabled=module.aM;FEATURE_CHOICE_ID_PREFIX=module.aN;setFeatureChoiceValue=module.aO;applyCssOnlyFeatureChoice=module.aP;getFeatureChoice=module.aQ;createAutocompleteQuerier=module.aR;b=module.aS;readSiteBlacklist=module.aT;Chip=module.aU;AutocompleteField=module.aV;ProgressBar=module.aW;createDefaultCustomTheme=module.aX;AppearanceThemeSchema=module.aY;prepareBackgroundImageFile=module.aZ;writeSiteBlacklist=module.a_;runFavoritesSync=module.o;log=module.l;FAVORITES_SYNC_PAGE_PAUSE_MS=module.a$;load=module.b0;createDefaultStorage=module.b1;clearStorageCache=module.b2;clearFavsCache=module.b3;getSyncState=module.j;object=module.b4;StorageSchema=module.b5;optional=module.b6;string=module.b7;FavsSchema=module.b8;literal=module.b9;IMPORT_SCHEMA_ERROR_PREFIX=module.ba;stripLegacyPanelWindowSize=module.bb;save=module.L;migrateMarksFavToFavs=module.bc;FAVS_STORAGE_KEY=module.bd;createDefaultFavs=module.be;parseFavsStrict=module.bf;setAppearance=module.bg;loadFavSet=module.bh;STORAGE_BACKUP_KEY=module.bi;extractFavIdsFromMarks=module.bj;gridDensityFeature=module.bk;FAVORITES_SYNC_MODE_INCREMENTAL=module.bl;FAVORITES_SYNC_MODE_FULL=module.F;getTweaksEnabled=module.bm;getGridFavButtonsEnabled=module.bn;getFeatureChoiceValue=module.bo;getScreenPixelSize=module.bp;},function(module){loadBackground=module.n;clearBackground=module.t;saveBackground=module.r;}],execute:(function(){exports("SettingsPage",SettingsPage);var GRID_FEATURE_ID = gridDensityFeature.id;
var THEME_OPTIONS = [
	{
		value: APPEARANCE_THEME_SITE,
		label: "Site default"
	},
	{
		value: APPEARANCE_THEME_SITE_DARK,
		label: "Site dark"
	},
	{
		value: APPEARANCE_THEME_LIGHT,
		label: "Light"
	},
	{
		value: APPEARANCE_THEME_DARK,
		label: "Dark"
	},
	{
		value: APPEARANCE_THEME_CUSTOM,
		label: "Custom"
	}
];
var GRID_OPTIONS = [
	{
		value: "default",
		label: "Default"
	},
	{
		value: "compact",
		label: "Compact"
	},
	{
		value: "large",
		label: "Large"
	}
];
var BASE_OPTIONS = [{
	value: APPEARANCE_CUSTOM_BASE_LIGHT,
	label: "Light"
}, {
	value: APPEARANCE_CUSTOM_BASE_DARK,
	label: "Dark"
}];
var SECTION_TITLE = "Appearance";
var THEME_ROW_LABEL = "Site theme";
var THEME_ROW_HINT = "Light, dark or your own";
var BASE_ROW_LABEL = "Base";
var BG_IMAGE_LABEL = "Background image";
var BG_IMAGE_HINT = "From a link or a file";
var BG_URL_PLACEHOLDER = "https://… or data URL";
var BG_DIM_LABEL = "Dim";
var CHOOSE_LABEL = "Choose…";
var REMOVE_LABEL = "Remove";
var RESET_LABEL = "Reset to defaults";
var GRID_ROW_LABEL = "Grid";
var SCREEN_HINT_PREFIX = "For this screen use at least ";
var IMAGE_SIZE_PREFIX = "Image size: ";
var IMAGE_TOO_SMALL_WARN = "This image is smaller than your screen; it may look soft when stretched.";
var ACCEPT_IMAGE = "image/*";
var APPEARANCE_SECTION_CSS = `
${KIT_FOCUS_CSS}
.rdw-appearance {
  display: grid;
  gap: 2px;
}
.rdw-appearance__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 8px;
  border-radius: var(--rdw-radius-m);
  font-size: 12.5px;
  color: var(--rdw-text);
}
.rdw-appearance__row--top {
  align-items: flex-start;
}
.rdw-appearance__row:nth-child(even) {
  background: var(--rdw-surface-2);
}
.rdw-appearance__row-text {
  display: grid;
  gap: 2px;
  min-width: 0;
}
.rdw-appearance__row-text small {
  color: var(--rdw-muted);
  font-size: 11px;
}
.rdw-appearance__select {
  width: 110px;
  flex: none;
}
.rdw-appearance__base {
  width: 140px;
  flex: none;
}
.rdw-appearance__bg {
  display: grid;
  gap: 6px;
  width: 100%;
}
.rdw-appearance__bg-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.rdw-appearance__dim {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--rdw-muted);
}
.rdw-appearance__dim input[type="range"] {
  flex: 1;
  min-width: 80px;
  accent-color: var(--rdw-accent);
}
.rdw-appearance__hint {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 11px;
}
.rdw-appearance__warn {
  margin: 0;
  padding: 6px 8px;
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-danger-soft);
  color: var(--rdw-danger);
  font-size: 12px;
}
.rdw-appearance__file {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
.rdw-appearance__footer {
  display: flex;
  justify-content: flex-end;
  padding: 4px 8px 0;
}
`;
function resolveGridChoice() {
	const stored = getFeatureChoiceValue(GRID_FEATURE_ID);
	const options = gridDensityFeature.choice?.options ?? [];
	if (stored !== void 0 && options.some((option) => option.value === stored)) return stored;
	return gridDensityFeature.choice?.defaultValue ?? "default";
}
function ensureCustom(appearance) {
	return appearance.custom ?? createDefaultCustomTheme();
}
function persistAndApply(appearance, backgroundDataUrl) {
	const parsed = setAppearance(appearance);
	applyAppearanceTheme({
		appearance: parsed,
		siteSkinCss: getSiteSkinCss(),
		...backgroundDataUrl !== void 0 && backgroundDataUrl !== null && backgroundDataUrl.length > 0 ? { backgroundDataUrl } : {}
	});
}
function formatScreenHint() {
	const screen = getScreenPixelSize();
	return `${SCREEN_HINT_PREFIX}${String(screen.width)}x${String(screen.height)}`;
}
function AppearanceSection(props) {
	const fileInputId = P$1();
	const fileRef = T(null);
	const [appearance, setAppearanceState] = d(() => getAppearance());
	const [gridValue, setGridValue] = d(() => resolveGridChoice());
	const [bgUrlDraft, setBgUrlDraft] = d(() => {
		return getAppearance().custom?.backgroundImage ?? "";
	});
	const [storedBackgroundUrl, setStoredBackgroundUrl] = d(null);
	const [fileError, setFileError] = d("");
	const [imageMeta, setImageMeta] = d(null);
	const [screenHint] = d(() => formatScreenHint());
	A(() => {
		let cancelled = false;
		loadBackground().then((dataUrl) => {
			if (cancelled || dataUrl === null) return;
			setStoredBackgroundUrl(dataUrl);
			const current = getAppearance();
			if (current.theme !== "custom") return;
			applyAppearanceTheme({
				appearance: current,
				siteSkinCss: getSiteSkinCss(),
				backgroundDataUrl: dataUrl
			});
		});
		return () => {
			cancelled = true;
		};
	}, []);
	const custom = ensureCustom(appearance);
	const isCustom = appearance.theme === APPEARANCE_THEME_CUSTOM;
	const hasBackground = (storedBackgroundUrl?.length ?? 0) > 0 || (custom.backgroundImage?.length ?? 0) > 0 || bgUrlDraft.length > 0;
	function commitAppearance(next, backgroundDataUrl) {
		setAppearanceState(next);
		persistAndApply(next, backgroundDataUrl);
		setFileError("");
	}
	function onThemeChange(value) {
		const parsed = AppearanceThemeSchema.safeParse(value);
		if (!parsed.success) return;
		const theme = parsed.data;
		if (theme === "custom") {
			commitAppearance({
				theme,
				custom: ensureCustom(appearance)
			}, storedBackgroundUrl);
			return;
		}
		commitAppearance({ theme });
	}
	function onBaseChange(value) {
		if (value !== "light" && value !== "dark") return;
		const base = value;
		const current = ensureCustom(getAppearance());
		const nextCustom = {
			base,
			backgroundDim: clampBackgroundDim(current.backgroundDim ?? 0),
			...current.backgroundImage !== void 0 ? { backgroundImage: current.backgroundImage } : {}
		};
		commitAppearance({
			theme: APPEARANCE_THEME_CUSTOM,
			custom: nextCustom
		}, storedBackgroundUrl);
	}
	function onBgUrlCommit(url) {
		const trimmed = url.trim();
		setBgUrlDraft(trimmed);
		setImageMeta(null);
		const base = ensureCustom(getAppearance());
		const nextCustom = {
			base: base.base,
			backgroundDim: clampBackgroundDim(base.backgroundDim ?? 0),
			...trimmed.length > 0 ? { backgroundImage: trimmed } : {}
		};
		if (trimmed.length > 0) {
			setStoredBackgroundUrl(null);
			clearBackground();
		}
		commitAppearance({
			theme: APPEARANCE_THEME_CUSTOM,
			custom: nextCustom
		});
	}
	function onDimChange(raw) {
		const dim = clampBackgroundDim(raw);
		const base = ensureCustom(getAppearance());
		const nextCustom = {
			base: base.base,
			backgroundDim: dim,
			...base.backgroundImage !== void 0 ? { backgroundImage: base.backgroundImage } : {}
		};
		commitAppearance({
			theme: APPEARANCE_THEME_CUSTOM,
			custom: nextCustom
		}, storedBackgroundUrl);
	}
	async function onFileSelected(file) {
		if (file === void 0) return;
		try {
			const prepared = await prepareBackgroundImageFile(file);
			await saveBackground(prepared.dataUrl);
			setStoredBackgroundUrl(prepared.dataUrl);
			setBgUrlDraft("");
			setImageMeta({
				width: prepared.sourceWidth,
				height: prepared.sourceHeight,
				belowScreen: prepared.belowScreen
			});
			const base = ensureCustom(getAppearance());
			const nextCustom = {
				base: base.base,
				backgroundDim: clampBackgroundDim(base.backgroundDim ?? 0)
			};
			commitAppearance({
				theme: APPEARANCE_THEME_CUSTOM,
				custom: nextCustom
			}, prepared.dataUrl);
		} catch (error) {
			const message = error instanceof Error ? error.message : "Could not read image file";
			setFileError(message);
		}
	}
	function onRemoveBackground() {
		clearBackground();
		setStoredBackgroundUrl(null);
		setBgUrlDraft("");
		setImageMeta(null);
		const base = ensureCustom(getAppearance());
		commitAppearance({
			theme: APPEARANCE_THEME_CUSTOM,
			custom: {
				base: base.base,
				backgroundDim: 0
			}
		});
	}
	function onResetDefaults() {
		clearBackground();
		setStoredBackgroundUrl(null);
		setBgUrlDraft("");
		setImageMeta(null);
		const defaults = createDefaultCustomTheme();
		commitAppearance({
			theme: APPEARANCE_THEME_CUSTOM,
			custom: defaults
		});
	}
	function onGridChange(value) {
		setGridValue(value);
		setFeatureChoiceValue(GRID_FEATURE_ID, value);
		applyCssOnlyFeatureChoice(GRID_FEATURE_ID, value);
	}
	const className = ["rdw-appearance", props.className].filter((part) => part !== void 0 && part.length > 0).join(" ");
	return /* @__PURE__ */ a($$1, { children: [/* @__PURE__ */ a("style", { children: APPEARANCE_SECTION_CSS }), /* @__PURE__ */ a("section", {
		className,
		"aria-label": SECTION_TITLE,
		children: [
			/* @__PURE__ */ a(SectionLabel, { children: SECTION_TITLE }),
			/* @__PURE__ */ a("div", {
				className: "rdw-appearance__row",
				children: [/* @__PURE__ */ a("div", {
					className: "rdw-appearance__row-text",
					children: [/* @__PURE__ */ a("span", { children: THEME_ROW_LABEL }), /* @__PURE__ */ a("small", { children: THEME_ROW_HINT })]
				}), /* @__PURE__ */ a(Select, {
					className: "rdw-appearance__select",
					options: THEME_OPTIONS,
					value: appearance.theme,
					onChange: onThemeChange
				})]
			}),
			isCustom ? /* @__PURE__ */ a($$1, { children: [
				/* @__PURE__ */ a("div", {
					className: "rdw-appearance__row",
					children: [/* @__PURE__ */ a("div", {
						className: "rdw-appearance__row-text",
						children: /* @__PURE__ */ a("span", { children: BASE_ROW_LABEL })
					}), /* @__PURE__ */ a(Segmented, {
						className: "rdw-appearance__base",
						options: BASE_OPTIONS,
						value: custom.base,
						label: BASE_ROW_LABEL,
						onChange: onBaseChange
					})]
				}),
				/* @__PURE__ */ a("div", {
					className: "rdw-appearance__row rdw-appearance__row--top",
					children: [/* @__PURE__ */ a("div", {
						className: "rdw-appearance__row-text",
						children: [/* @__PURE__ */ a("span", { children: BG_IMAGE_LABEL }), /* @__PURE__ */ a("small", { children: BG_IMAGE_HINT })]
					}), /* @__PURE__ */ a("div", {
						className: "rdw-appearance__bg",
						onFocusOut: (event) => {
							const root = event.currentTarget;
							const next = event.relatedTarget;
							if (next instanceof Node && root.contains(next)) return;
							onBgUrlCommit(bgUrlDraft);
						},
						children: [
							/* @__PURE__ */ a(TextField, {
								value: bgUrlDraft,
								placeholder: BG_URL_PLACEHOLDER,
								"aria-label": BG_IMAGE_LABEL,
								onChange: (value) => {
									setBgUrlDraft(value);
								}
							}),
							/* @__PURE__ */ a("div", {
								className: "rdw-appearance__bg-actions",
								children: [
									/* @__PURE__ */ a(Button, {
										variant: "secondary",
										size: "s",
										onClick: () => {
											fileRef.current?.click();
										},
										children: CHOOSE_LABEL
									}),
									hasBackground ? /* @__PURE__ */ a(Button, {
										variant: "ghost",
										size: "s",
										onClick: onRemoveBackground,
										children: REMOVE_LABEL
									}) : null,
									/* @__PURE__ */ a("input", {
										ref: fileRef,
										id: fileInputId,
										className: "rdw-appearance__file",
										type: "file",
										accept: ACCEPT_IMAGE,
										"aria-hidden": "true",
										tabIndex: -1,
										onChange: (event) => {
											const file = event.currentTarget.files?.[0];
											onFileSelected(file);
											event.currentTarget.value = "";
										}
									})
								]
							}),
							/* @__PURE__ */ a("p", {
								className: "rdw-appearance__hint",
								children: screenHint
							}),
							imageMeta !== null ? /* @__PURE__ */ a("p", {
								className: "rdw-appearance__hint",
								children: [
									IMAGE_SIZE_PREFIX,
									String(imageMeta.width),
									"x",
									String(imageMeta.height)
								]
							}) : null,
							imageMeta?.belowScreen === true ? /* @__PURE__ */ a("div", {
								className: "rdw-appearance__warn",
								role: "status",
								children: IMAGE_TOO_SMALL_WARN
							}) : null,
							hasBackground ? /* @__PURE__ */ a("label", {
								className: "rdw-appearance__dim",
								children: [
									/* @__PURE__ */ a("span", { children: BG_DIM_LABEL }),
									/* @__PURE__ */ a("input", {
										type: "range",
										min: 0,
										max: .8,
										step: .05,
										value: custom.backgroundDim ?? 0,
										"aria-label": BG_DIM_LABEL,
										onInput: (event) => {
											onDimChange(Number(event.currentTarget.value));
										}
									}),
									/* @__PURE__ */ a("span", { children: String(clampBackgroundDim(custom.backgroundDim ?? 0)) })
								]
							}) : null,
							fileError.length > 0 ? /* @__PURE__ */ a("div", {
								className: "rdw-appearance__warn",
								role: "status",
								children: fileError
							}) : null
						]
					})]
				}),
				/* @__PURE__ */ a("div", {
					className: "rdw-appearance__footer",
					children: /* @__PURE__ */ a(Button, {
						variant: "ghost",
						size: "s",
						onClick: onResetDefaults,
						children: RESET_LABEL
					})
				})
			] }) : null,
			/* @__PURE__ */ a("div", {
				className: "rdw-appearance__row",
				children: [/* @__PURE__ */ a("div", {
					className: "rdw-appearance__row-text",
					children: /* @__PURE__ */ a("span", { children: GRID_ROW_LABEL })
				}), /* @__PURE__ */ a(Select, {
					className: "rdw-appearance__select",
					options: GRID_OPTIONS,
					value: gridValue,
					onChange: onGridChange
				})]
			})
		]
	})] });
}
var SECTION_CLASS$2 = "rdw-blacklist";
var CHIPS_CLASS = "rdw-blacklist-chips";
var ADD_ROW_CLASS = "rdw-blacklist-add-row";
var HINT_CLASS$1 = "rdw-blacklist-hint";
var ADD_LABEL = "Add tag";
var ADD_BUTTON = "Add";
var PERMANENT_HINT = "Stored in this browser's site cookie. The list in your account settings is not changed and may overwrite this one after you log in again.";
var ADD_INPUT_ID = "rdw-blacklist-add";
var TAG_SPLIT_PATTERN = /[, ]+/;
/** Layout CSS for the blacklist section (chips come from kit Chip). */
var BLACKLIST_SECTION_CSS = `
.${SECTION_CLASS$2} {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.${SECTION_CLASS$2} .${CHIPS_CLASS} {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.${SECTION_CLASS$2} .${ADD_ROW_CLASS} {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: flex-end;
}
.${SECTION_CLASS$2} .${ADD_ROW_CLASS} .rdw-field,
.${SECTION_CLASS$2} .${ADD_ROW_CLASS} .rdw-ac {
  flex: 1 1 12rem;
  margin: 0;
}
.${SECTION_CLASS$2} .${HINT_CLASS$1} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 12px;
}
`.trim();
function parseAddTokens(raw) {
	const result = [];
	for (const part of raw.split(TAG_SPLIT_PATTERN)) {
		const trimmed = part.trim();
		if (trimmed.length === 0) continue;
		result.push(trimmed);
	}
	return result;
}
function persistTags(tags) {
	writeSiteBlacklist([...tags]);
	return readSiteBlacklist();
}
function BlacklistSection(props = {}) {
	const includeHeading = props.includeHeading !== false;
	const [tags, setTags] = d(() => readSiteBlacklist());
	const [draft, setDraft] = d("");
	const [suggestions, setSuggestions] = d([]);
	const querierRef = T(createAutocompleteQuerier());
	A(() => {
		const querier = querierRef.current;
		return () => {
			querier.cancel();
		};
	}, []);
	const addTokens = b(() => {
		const tokens = parseAddTokens(draft);
		if (tokens.length === 0) return;
		setTags(persistTags([...readSiteBlacklist(), ...tokens]));
		setDraft("");
		setSuggestions([]);
		querierRef.current.cancel();
	}, [draft]);
	return /* @__PURE__ */ a($$1, { children: [/* @__PURE__ */ a("style", { children: BLACKLIST_SECTION_CSS }), /* @__PURE__ */ a("section", {
		className: `rdw-section ${SECTION_CLASS$2}`,
		children: [
			includeHeading ? /* @__PURE__ */ a(SectionLabel, { children: "Blacklist" }) : null,
			/* @__PURE__ */ a("ul", {
				className: CHIPS_CLASS,
				children: tags.map((tag) => /* @__PURE__ */ a("li", { children: /* @__PURE__ */ a(Chip, {
					label: tag,
					onRemove: () => {
						const next = readSiteBlacklist().filter((entry) => entry !== tag);
						setTags(persistTags(next));
					}
				}) }, tag))
			}),
			/* @__PURE__ */ a("form", {
				className: ADD_ROW_CLASS,
				onSubmit: (event) => {
					event.preventDefault();
					addTokens();
				},
				children: [/* @__PURE__ */ a(AutocompleteField, {
					id: ADD_INPUT_ID,
					label: ADD_LABEL,
					value: draft,
					suggestions,
					onChange: (value) => {
						setDraft(value);
						querierRef.current.query(value, setSuggestions);
					},
					onSelect: () => {
						querierRef.current.cancel();
						setSuggestions([]);
					}
				}), /* @__PURE__ */ a(Button, {
					type: "submit",
					variant: "primary",
					children: ADD_BUTTON
				})]
			}),
			/* @__PURE__ */ a("p", {
				className: HINT_CLASS$1,
				children: PERMANENT_HINT
			})
		]
	})] });
}
var BACKUP_FORMAT = "ruledesk-web-backup";
var IMPORT_MODE_MERGE = "merge";
var IMPORT_MODE_REPLACE = "replace";
var BackupFileSchema = object({
	format: literal(BACKUP_FORMAT),
	version: literal(1),
	exportedAt: string(),
	storage: StorageSchema,
	favs: optional(FavsSchema),
	background: optional(string())
});
function getGmGetValue() {
	return GM_getValue;
}
function getGmSetValue() {
	return GM_setValue;
}
function formatSchemaError(error) {
	const issue = error.issues[0];
	if (issue === void 0) return `${IMPORT_SCHEMA_ERROR_PREFIX}: (root): Invalid data`;
	const path = issue.path.length === 0 ? "(root)" : issue.path.map((segment) => String(segment)).join(".");
	return `${IMPORT_SCHEMA_ERROR_PREFIX}: ${path}: ${issue.message}`;
}
async function readBackgroundForBackup() {
	const dataUrl = await loadBackground();
	if (dataUrl === null || dataUrl.length === 0) return;
	return dataUrl;
}
async function writeBackgroundForBackup(value) {
	if (value === void 0 || value.length === 0) {
		await clearBackground();
		return;
	}
	await saveBackground(value);
}
function readFavsForBackup() {
	const raw = getGmGetValue()(FAVS_STORAGE_KEY, void 0);
	if (raw === void 0 || raw === null) return createDefaultFavs();
	const parsed = parseFavsStrict(raw);
	if (parsed === null) {
		log.error("backup: invalid favs; exporting empty favs", { key: FAVS_STORAGE_KEY });
		return createDefaultFavs();
	}
	return parsed;
}
function writeFavsForBackup(data) {
	getGmSetValue()(FAVS_STORAGE_KEY, FavsSchema.parse(data));
	clearFavsCache();
}
async function snapshotCurrentToBackupKey() {
	const background = await readBackgroundForBackup();
	const snapshot = {
		format: BACKUP_FORMAT,
		version: 1,
		exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
		storage: load(),
		favs: readFavsForBackup(),
		...background !== void 0 ? { background } : {}
	};
	getGmSetValue()(STORAGE_BACKUP_KEY, snapshot);
}
function mergeArtists(current, incoming) {
	const byTag = /* @__PURE__ */ new Map();
	for (const entry of current) byTag.set(entry.tag, entry);
	for (const entry of incoming) byTag.set(entry.tag, entry);
	return Array.from(byTag.values());
}
function mergeCollections(current, incoming) {
	const byId = /* @__PURE__ */ new Map();
	for (const entry of current) byId.set(entry.id, entry);
	for (const entry of incoming) byId.set(entry.id, entry);
	return Array.from(byId.values());
}
function mergeMarks(current, incoming) {
	const merged = { ...current };
	for (const [postId, flags] of Object.entries(incoming)) merged[postId] = {
		...merged[postId] ?? {},
		...flags
	};
	return merged;
}
function mergeFavs(current, incoming) {
	const ids = /* @__PURE__ */ new Set([...current.ids, ...incoming.ids]);
	const next = {
		version: incoming.version,
		ids: Array.from(ids)
	};
	if (incoming.sync !== void 0) next.sync = incoming.sync;
	else if (current.sync !== void 0) next.sync = current.sync;
	return next;
}
function buildSummary(storage, favs) {
	return {
		artistCount: storage.artists.length,
		collectionCount: storage.collections.length,
		favCount: favs.ids.length
	};
}
/**
* When the backup omits favs, strip legacy marks.fav so migrateMarksFavToFavs
* cannot enlarge the untouched local fav set.
*/
function storageWithoutMarkFavs(storage) {
	const stripped = extractFavIdsFromMarks(storage.marks);
	return {
		...storage,
		marks: stripped.marks
	};
}
async function applyImportedState(storage, favs, background, applyBackground, applyFavs) {
	await snapshotCurrentToBackupKey();
	const storageToWrite = applyFavs ? storage : storageWithoutMarkFavs(storage);
	const stripped = stripLegacyPanelWindowSize(storageToWrite);
	save(stripped.data);
	if (applyFavs && favs !== void 0) writeFavsForBackup(favs);
	if (applyBackground) await writeBackgroundForBackup(background);
	migrateMarksFavToFavs();
	clearStorageCache();
	clearFavsCache();
	return buildSummary(load(), readFavsForBackup());
}
/** Local calendar date YYYY-MM-DD for backup filenames. */
function backupDateStamp(date = /* @__PURE__ */ new Date()) {
	return `${String(date.getFullYear())}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function buildBackupFilename(date = /* @__PURE__ */ new Date()) {
	return `ruledesk-web-backup-${backupDateStamp(date)}.json`;
}
/** Build a validated backup object from current storage + optional IDB background. */
async function buildBackupFile(options) {
	const storage = load();
	const file = {
		format: BACKUP_FORMAT,
		version: 1,
		exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
		storage,
		...options.includeFavorites ? { favs: readFavsForBackup() } : {}
	};
	if (options.includeBackground) {
		const background = await readBackgroundForBackup();
		if (background !== void 0) return {
			...file,
			background
		};
	}
	return file;
}
function serializeBackupFile(file) {
	return `${JSON.stringify(file, null, 2)}\n`;
}
/** Trigger a browser download of the JSON text (Blob + `<a download>`). */
function downloadBackupText(json, filename) {
	const blob = new Blob([json], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	anchor.rel = "noopener";
	document.body.append(anchor);
	anchor.click();
	anchor.remove();
	URL.revokeObjectURL(url);
}
async function exportBackupDownload(options) {
	const file = await buildBackupFile(options);
	downloadBackupText(serializeBackupFile(file), buildBackupFilename());
	return file;
}
/**
* Parse and apply a backup JSON string.
* Invalid input leaves storage/favs/background unchanged.
* A file without a `favs` field leaves the local fav set untouched.
*/
async function importBackupJson(raw, mode) {
	let json;
	try {
		json = JSON.parse(raw);
	} catch (error) {
		return {
			ok: false,
			error: error instanceof Error ? error.message : "Invalid JSON"
		};
	}
	const parsed = BackupFileSchema.safeParse(json);
	if (!parsed.success) return {
		ok: false,
		error: formatSchemaError(parsed.error)
	};
	const incoming = parsed.data;
	const hasBackgroundField = Object.prototype.hasOwnProperty.call(incoming, "background");
	const hasFavsField = Object.prototype.hasOwnProperty.call(incoming, "favs");
	const incomingFavs = incoming.favs;
	try {
		if (mode === "replace") return {
			ok: true,
			summary: await applyImportedState(incoming.storage, hasFavsField ? incomingFavs : void 0, hasBackgroundField ? incoming.background : void 0, true, hasFavsField)
		};
		const currentStorage = load();
		const currentFavs = readFavsForBackup();
		const mergedStorage = {
			version: currentStorage.version,
			collections: mergeCollections(currentStorage.collections, incoming.storage.collections),
			artists: mergeArtists(currentStorage.artists, incoming.storage.artists),
			marks: mergeMarks(currentStorage.marks, incoming.storage.marks),
			settings: incoming.storage.settings,
			updates: incoming.storage.updates ?? currentStorage.updates
		};
		if (mergedStorage.settings === void 0) mergedStorage.settings = createDefaultStorage().settings;
		return {
			ok: true,
			summary: await applyImportedState(mergedStorage, hasFavsField && incomingFavs !== void 0 ? mergeFavs(currentFavs, incomingFavs) : void 0, incoming.background, hasBackgroundField, hasFavsField)
		};
	} catch (error) {
		log.error("backup import failed after parse", error);
		clearStorageCache();
		clearFavsCache();
		return {
			ok: false,
			error: error instanceof Error ? error.message : "Import failed unexpectedly"
		};
	}
}
var SECTION_CLASS$1 = "rdw-data-section";
var ACTIONS_CLASS$1 = "rdw-data-actions";
var HINT_CLASS = "rdw-data-hint";
var FILE_CLASS = "rdw-data-file";
var HEADING$1 = "Data";
var INCLUDE_BACKGROUND_LABEL = "Include background image";
var INCLUDE_BACKGROUND_ID = "rdw-backup-include-bg";
var INCLUDE_FAVORITES_LABEL = "Include favorites";
var INCLUDE_FAVORITES_ID = "rdw-backup-include-favs";
var FAVORITES_EXPORT_HINT = "Favorites restore via Favorites sync. Include them in the file only if you need to copy the local fav list.";
var IMPORT_MODE_LABEL = "Import mode";
var EXPORT_LABEL = UI_TEXT.export;
var IMPORT_LABEL = UI_TEXT.import;
var EXPORT_ERROR_PREFIX = "Export failed:";
var STORAGE_HINT = "Collections, artists, and settings live in Tampermonkey storage. Favorites are optional in this file. Blacklist and site theme are browser cookies and are not included.";
var MODE_OPTIONS = [{
	value: IMPORT_MODE_MERGE,
	label: "Merge"
}, {
	value: IMPORT_MODE_REPLACE,
	label: "Replace"
}];
var DATA_SECTION_CSS = `
.${SECTION_CLASS$1} {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.${SECTION_CLASS$1} .${ACTIONS_CLASS$1} {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.${SECTION_CLASS$1} .${HINT_CLASS} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 12px;
}
.${SECTION_CLASS$1} .${FILE_CLASS} {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
`.trim();
function formatSummary(summary) {
	return `Imported ${String(summary.artistCount)} artists, ${String(summary.collectionCount)} collections, ${String(summary.favCount)} favorites.`;
}
function readFileText(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result === "string") {
				resolve(reader.result);
				return;
			}
			reject(/* @__PURE__ */ new Error("Could not read file"));
		};
		reader.onerror = () => {
			reject(reader.error ?? /* @__PURE__ */ new Error("Could not read file"));
		};
		reader.readAsText(file);
	});
}
function DataSection(props = {}) {
	const includeHeading = props.includeHeading !== false;
	const fileRef = T(null);
	const [includeBackground, setIncludeBackground] = d(false);
	const [includeFavorites, setIncludeFavorites] = d(false);
	const [mode, setMode] = d(IMPORT_MODE_MERGE);
	const [error, setError] = d("");
	const [summary, setSummary] = d("");
	return /* @__PURE__ */ a($$1, { children: [/* @__PURE__ */ a("style", { children: DATA_SECTION_CSS }), /* @__PURE__ */ a("section", {
		className: `rdw-section ${SECTION_CLASS$1}`,
		children: [
			includeHeading ? /* @__PURE__ */ a(SectionLabel, { children: HEADING$1 }) : null,
			/* @__PURE__ */ a(Switch, {
				id: INCLUDE_BACKGROUND_ID,
				label: INCLUDE_BACKGROUND_LABEL,
				checked: includeBackground,
				onChange: setIncludeBackground
			}),
			/* @__PURE__ */ a(Switch, {
				id: INCLUDE_FAVORITES_ID,
				label: INCLUDE_FAVORITES_LABEL,
				checked: includeFavorites,
				onChange: setIncludeFavorites
			}),
			/* @__PURE__ */ a("p", {
				className: HINT_CLASS,
				children: FAVORITES_EXPORT_HINT
			}),
			/* @__PURE__ */ a(Segmented, {
				label: IMPORT_MODE_LABEL,
				options: [...MODE_OPTIONS],
				value: mode,
				onChange: (value) => {
					if (value === "merge" || value === "replace") setMode(value);
				}
			}),
			/* @__PURE__ */ a("div", {
				className: ACTIONS_CLASS$1,
				children: [
					/* @__PURE__ */ a(Button, {
						variant: "secondary",
						onClick: () => {
							setError("");
							setSummary("");
							exportBackupDownload({
								includeBackground,
								includeFavorites
							}).catch((caught) => {
								const message = caught instanceof Error ? caught.message : "Export failed unexpectedly";
								setError(`${EXPORT_ERROR_PREFIX} ${message}`);
							});
						},
						children: EXPORT_LABEL
					}),
					/* @__PURE__ */ a(Button, {
						variant: "secondary",
						onClick: () => {
							fileRef.current?.click();
						},
						children: IMPORT_LABEL
					}),
					/* @__PURE__ */ a("input", {
						ref: fileRef,
						className: FILE_CLASS,
						type: "file",
						accept: "application/json,.json",
						"aria-hidden": "true",
						tabIndex: -1,
						onChange: (event) => {
							const file = event.currentTarget.files?.[0];
							event.currentTarget.value = "";
							if (file === void 0) return;
							setError("");
							setSummary("");
							readFileText(file).then((text) => importBackupJson(text, mode)).then((result) => {
								if (!result.ok) {
									setError(`${UI_TEXT.importErrorPrefix} ${result.error}`);
									return;
								}
								setSummary(formatSummary(result.summary));
							}).catch((caught) => {
								const message = caught instanceof Error ? caught.message : "Could not read file";
								setError(`${UI_TEXT.importErrorPrefix} ${message}`);
							});
						}
					})
				]
			}),
			error.length > 0 ? /* @__PURE__ */ a("p", {
				className: "rdw-error",
				children: error
			}) : null,
			summary.length > 0 ? /* @__PURE__ */ a("p", {
				className: "rdw-hint",
				children: summary
			}) : null,
			/* @__PURE__ */ a("p", {
				className: HINT_CLASS,
				children: STORAGE_HINT
			})
		]
	})] });
}
var SECTION_CLASS = "rdw-favs-sync";
var STATUS_CLASS = "rdw-favs-sync-status";
var ACTIONS_CLASS = "rdw-favs-sync-actions";
var WARNING_CLASS = "rdw-favs-sync-warning";
var NOTE_CLASS = "rdw-favs-sync-note";
var HEADING = "Favorites sync";
var TEXT_SYNC = "Sync favorites";
var TEXT_FULL = "Full resync";
var TEXT_RESUME = "Resume";
var TEXT_STOP = "Stop";
var TEXT_WARNING = "Sync stops at the first page of already-known favorites (newest first). Full resync loads every page. One request per 1.5 s";
var TEXT_NOTE = "Sync only adds favorites. Posts removed on the site stay in the local set.";
var TEXT_IDLE_COUNT = (count) => `${String(count)} in local favorites set`;
var TEXT_LAST_SYNC = (iso) => `Last full sync: ${formatSyncDate(iso)}`;
var TEXT_PAUSED = (page, pages) => `Paused at page ${String(page)} of ${String(pages)}`;
var TEXT_PROGRESS = (p) => `Page ${String(p.page)} of ${String(p.pages)} · ${String(p.total)} ids`;
var TEXT_DONE = (total, pages) => `Synced ${String(total)} ids across ${String(pages)} pages`;
var TEXT_ABORTED = (page, pages, total) => `Stopped at page ${String(page)} of ${String(pages)} · ${String(total)} ids`;
var TEXT_STARTING = "Starting sync…";
var PAUSE_SECONDS = FAVORITES_SYNC_PAGE_PAUSE_MS / 1e3;
var FAVORITES_SYNC_SECTION_CSS = `
.${SECTION_CLASS} {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.${SECTION_CLASS} .${STATUS_CLASS} {
  margin: 0;
  color: var(--rdw-text);
  font-size: 12px;
}
.${SECTION_CLASS} .${ACTIONS_CLASS} {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.${SECTION_CLASS} .${WARNING_CLASS},
.${SECTION_CLASS} .${NOTE_CLASS} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 12px;
}
`.trim();
var activeSync = null;
function formatSyncDate(iso) {
	const parsed = Date.parse(iso);
	if (!Number.isFinite(parsed)) return iso;
	return new Date(parsed).toLocaleString();
}
function pageFromPid(pid) {
	return Math.floor(pid / 50) + 1;
}
function pagesFromLastPid(lastPid) {
	return Math.floor(lastPid / 50) + 1;
}
function isUnfinished(sync) {
	return sync !== void 0 && sync.finishedAt === void 0;
}
function ratioFromProgress(progress) {
	if (progress.pages <= 0) return null;
	return progress.page / progress.pages;
}
function buildStatusText() {
	const count = loadFavSet().size;
	const sync = getSyncState();
	const parts = [TEXT_IDLE_COUNT(count)];
	if (sync !== void 0 && sync.finishedAt === void 0) {
		const page = pageFromPid(sync.nextPid);
		const pages = Math.max(pagesFromLastPid(sync.lastPid), page);
		parts.push(TEXT_PAUSED(page, pages));
	} else if (sync?.finishedAt !== void 0) parts.push(TEXT_LAST_SYNC(sync.finishedAt));
	return parts.join(" · ");
}
function idleUi() {
	return {
		status: buildStatusText(),
		progress: null,
		waiting: false,
		error: "",
		unfinished: isUnfinished(getSyncState()),
		busy: activeSync !== null
	};
}
function progressUi(progress) {
	const ratio = ratioFromProgress(progress);
	return {
		status: TEXT_PROGRESS(progress),
		progress: ratio,
		waiting: ratio === null,
		error: "",
		unfinished: true,
		busy: true
	};
}
function applyResult(result) {
	activeSync = null;
	if (result.status === "error") return {
		...idleUi(),
		error: result.message
	};
	if (result.status === "completed") return {
		status: TEXT_DONE(result.total, result.pages),
		progress: result.pages > 0 ? 1 : null,
		waiting: false,
		error: "",
		unfinished: false,
		busy: false
	};
	return {
		status: TEXT_ABORTED(result.page, result.pages, result.total),
		progress: ratioFromProgress({
			page: result.page,
			pages: result.pages,
			total: result.total
		}),
		waiting: false,
		error: "",
		unfinished: isUnfinished(getSyncState()),
		busy: false
	};
}
async function startSync(setUi, mode) {
	if (activeSync !== null) return;
	const controller = new AbortController();
	const listeners = /* @__PURE__ */ new Set();
	activeSync = {
		controller,
		listeners
	};
	listeners.add((progress) => {
		setUi(progressUi(progress));
	});
	setUi({
		status: TEXT_STARTING,
		progress: null,
		waiting: true,
		error: "",
		unfinished: true,
		busy: true
	});
	try {
		const result = await runFavoritesSync({
			onProgress: (progress) => {
				for (const listener of listeners) listener(progress);
			},
			signal: controller.signal,
			...mode !== void 0 ? { mode } : {}
		});
		if (activeSync?.controller === controller) setUi(applyResult(result));
	} catch (error) {
		log.error("favorites sync section: unexpected failure", error);
		if (activeSync?.controller === controller) {
			activeSync = null;
			setUi({
				...idleUi(),
				error: error instanceof Error ? error.message : "unexpected error"
			});
		}
	}
}
function FavoritesSyncSection(props = {}) {
	const includeHeading = props.includeHeading !== false;
	const [ui, setUi] = d(() => idleUi());
	A(() => {
		if (activeSync === null) return;
		const listener = (progress) => {
			setUi(progressUi(progress));
		};
		activeSync.listeners.add(listener);
		setUi({
			status: TEXT_STARTING,
			progress: null,
			waiting: true,
			error: "",
			unfinished: true,
			busy: true
		});
		return () => {
			activeSync?.listeners.delete(listener);
		};
	}, []);
	return /* @__PURE__ */ a($$1, { children: [/* @__PURE__ */ a("style", { children: FAVORITES_SYNC_SECTION_CSS }), /* @__PURE__ */ a("section", {
		className: `rdw-section ${SECTION_CLASS}`,
		children: [
			includeHeading ? /* @__PURE__ */ a(SectionLabel, { children: HEADING }) : null,
			/* @__PURE__ */ a("p", {
				className: STATUS_CLASS,
				children: ui.status
			}),
			/* @__PURE__ */ a(ProgressBar, {
				value: ui.progress,
				waiting: ui.waiting,
				label: "Favorites sync progress"
			}),
			/* @__PURE__ */ a("div", {
				className: ACTIONS_CLASS,
				children: [!ui.unfinished ? /* @__PURE__ */ a($$1, { children: [/* @__PURE__ */ a(Button, {
					variant: "primary",
					disabled: ui.busy,
					onClick: () => {
						startSync(setUi, FAVORITES_SYNC_MODE_INCREMENTAL);
					},
					children: TEXT_SYNC
				}), /* @__PURE__ */ a(Button, {
					variant: "secondary",
					disabled: ui.busy,
					onClick: () => {
						startSync(setUi, FAVORITES_SYNC_MODE_FULL);
					},
					children: TEXT_FULL
				})] }) : /* @__PURE__ */ a(Button, {
					variant: "secondary",
					disabled: ui.busy,
					onClick: () => {
						startSync(setUi);
					},
					children: TEXT_RESUME
				}), /* @__PURE__ */ a(Button, {
					variant: "secondary",
					disabled: !ui.busy,
					onClick: () => {
						activeSync?.controller.abort();
					},
					children: TEXT_STOP
				})]
			}),
			ui.error.length > 0 ? /* @__PURE__ */ a("p", {
				className: "rdw-error",
				children: ui.error
			}) : null,
			/* @__PURE__ */ a("p", {
				className: WARNING_CLASS,
				children: TEXT_WARNING
			}),
			/* @__PURE__ */ a("p", {
				className: NOTE_CLASS,
				children: TEXT_NOTE
			}),
			/* @__PURE__ */ a("p", {
				className: "rdw-hint",
				children: `Pause between pages: ${String(PAUSE_SECONDS)} s`
			})
		]
	})] });
}
/** Grid density is owned by Appearance; omit from Page module list. */
var PAGE_FEATURE_SKIP = /* @__PURE__ */ new Set(["grid-density"]);
var APPEARANCE_FLAT_ROWS_CSS = `
.rdw-appearance__row:nth-child(even) {
  background: transparent;
}
`.trim();
function FeatureModules() {
	const [, bump] = d(0);
	const refresh = () => {
		bump((value) => value + 1);
	};
	return /* @__PURE__ */ a("div", {
		className: PANEL_UI_CLASS.settingsGroup,
		children: FEATURES.filter((feature) => !PAGE_FEATURE_SKIP.has(feature.id)).map((feature) => {
			const label = featurePanelLabel(feature.id, feature.label);
			const choice = feature.choice;
			return /* @__PURE__ */ a($$1, { children: [/* @__PURE__ */ a("div", {
				className: PANEL_UI_CLASS.settingsRow,
				children: [/* @__PURE__ */ a(Switch, {
					id: `${FEATURE_CHECKBOX_ID_PREFIX}${feature.id}`,
					label,
					checked: isFeatureEnabled(feature.id),
					onChange: (checked) => {
						setFeatureEnabled(feature.id, checked);
						if (feature.cssOnly === true) {
							applyCssOnlyFeatureEnabled(feature.id, checked);
							refresh();
							return;
						}
						window.location.reload();
					}
				}), feature.settingsCaption !== void 0 ? /* @__PURE__ */ a("p", {
					className: PANEL_UI_CLASS.settingsCaption,
					children: feature.settingsCaption
				}) : null]
			}), choice !== void 0 ? /* @__PURE__ */ a("div", {
				className: PANEL_UI_CLASS.settingsRow,
				id: `${FEATURE_CHOICE_ID_PREFIX}${feature.id}`,
				children: /* @__PURE__ */ a(Select, {
					label: choice.label ?? label,
					options: choice.options.map((option) => ({
						value: option.value,
						label: option.label
					})),
					value: getFeatureChoice(feature.id),
					onChange: (value) => {
						setFeatureChoiceValue(feature.id, value);
						if (feature.cssOnly === true) {
							applyCssOnlyFeatureChoice(feature.id, value);
							refresh();
							return;
						}
						window.location.reload();
					}
				})
			}) : null] }, feature.id);
		})
	});
}
function SettingsPage() {
	const [tweaks, setTweaks] = d(() => getTweaksEnabled());
	const [updatesGroup, setUpdatesGroup] = d(() => getUpdatesGroupSize());
	const [playlistChunk, setPlaylistChunk] = d(() => getPlaylistChunkSize());
	const [gridFavEnabled, setGridFavEnabled] = d(() => getGridFavButtonsEnabled());
	return /* @__PURE__ */ a("div", {
		className: PANEL_UI_CLASS.scrollRegion,
		children: [
			/* @__PURE__ */ a(Card, {
				className: PANEL_UI_CLASS.pageCard,
				children: [/* @__PURE__ */ a(AppearanceSection, {}), /* @__PURE__ */ a("style", { children: APPEARANCE_FLAT_ROWS_CSS })]
			}),
			/* @__PURE__ */ a(Card, {
				className: PANEL_UI_CLASS.pageCard,
				children: [/* @__PURE__ */ a(SectionLabel, { children: "Page" }), /* @__PURE__ */ a("div", {
					className: PANEL_UI_CLASS.settingsGroup,
					children: [
						/* @__PURE__ */ a("div", {
							className: PANEL_UI_CLASS.settingsRow,
							children: /* @__PURE__ */ a(Switch, {
								id: TWEAKS_SWITCH_ID,
								label: UI_TEXT.enablePageTweaksLabel,
								checked: tweaks,
								onChange: (checked) => {
									setTweaksEnabled(checked);
									setTweaks(checked);
									window.location.reload();
								}
							})
						}),
						/* @__PURE__ */ a(FeatureModules, {}),
						/* @__PURE__ */ a("div", {
							className: PANEL_UI_CLASS.settingsRow,
							children: /* @__PURE__ */ a(NumberField, {
								id: UPDATES_GROUP_SIZE_ID,
								label: UI_TEXT.updatesGroupSizeLabel,
								value: updatesGroup,
								min: 0,
								step: 1,
								onChange: (value) => {
									setUpdatesGroupSize(value ?? 0);
									setUpdatesGroup(getUpdatesGroupSize());
								}
							})
						}),
						/* @__PURE__ */ a("div", {
							className: PANEL_UI_CLASS.settingsRow,
							children: /* @__PURE__ */ a(NumberField, {
								id: PLAYLIST_CHUNK_SIZE_ID,
								label: UI_TEXT.playlistChunkSizeLabel,
								value: playlistChunk,
								min: 1,
								step: 1,
								onChange: (value) => {
									setPlaylistChunkSize(value ?? 0);
									setPlaylistChunk(getPlaylistChunkSize());
								}
							})
						})
					]
				})]
			}),
			/* @__PURE__ */ a(Card, {
				className: PANEL_UI_CLASS.pageCard,
				children: /* @__PURE__ */ a(BlacklistSection, {})
			}),
			/* @__PURE__ */ a(Card, {
				className: PANEL_UI_CLASS.pageCard,
				children: [
					/* @__PURE__ */ a(SectionLabel, { children: "Favorites" }),
					/* @__PURE__ */ a("div", {
						className: PANEL_UI_CLASS.settingsRow,
						children: /* @__PURE__ */ a(Switch, {
							id: GRID_FAV_CHECKBOX_ID,
							label: UI_TEXT.gridFavButtonsLabel,
							checked: gridFavEnabled,
							onChange: (checked) => {
								setGridFavButtonsEnabled(checked);
								setGridFavButtonsVisible(checked);
								setGridFavEnabled(checked);
							}
						})
					}),
					/* @__PURE__ */ a(FavoritesSyncSection, { includeHeading: false })
				]
			}),
			/* @__PURE__ */ a(Card, {
				className: PANEL_UI_CLASS.pageCard,
				children: /* @__PURE__ */ a(DataSection, {})
			})
		]
	});
}})}}));
System.register("./collections-page-CjN6PebE-CkoKBrWC.js", ['./___monkey.entry.js'],(function(exports){'use strict';var d,b,A,reloadFromStorage,load,a,Segmented,TextField,Button,IconPlus,EmptyState,resolveCollectionKind,UI_TEXT,QueryField,Dialog,createDynamicCollection,createPlaylist,COLLECTION_KIND_POSTS,collectionDetailHash,readCoverMirror,COLLECTION_KIND_SEARCH,buildSearchUrl;return{setters:[function(module){d=module.ad;b=module.aS;A=module.av;reloadFromStorage=module.K;load=module.b0;a=module.Y;Segmented=module.aB;TextField=module.aE;Button=module.aF;IconPlus=module.bq;EmptyState=module.br;resolveCollectionKind=module.bs;UI_TEXT=module.U;QueryField=module.bt;Dialog=module.bu;createDynamicCollection=module.bv;createPlaylist=module.bw;COLLECTION_KIND_POSTS=module.bx;collectionDetailHash=module.by;readCoverMirror=module.bz;COLLECTION_KIND_SEARCH=module.bA;buildSearchUrl=module.bB;}],execute:(function(){exports("CollectionsPage",CollectionsPage);var EVENT_PAGESHOW = "pageshow";
var PAGE_CLASS = "rdw-collections-page";
var HEADER_CLASS = "rdw-collections-header";
var TOOLBAR_CLASS = "rdw-collections-toolbar";
var FILTER_FIELD_CLASS = "rdw-collections-filter";
var GRID_CLASS = "rdw-collections-grid";
var CARD_CLASS = "rdw-collection-card";
var COVER_CLASS = "rdw-collection-cover";
var COVER_CELL_CLASS = "rdw-collection-cover-cell";
var COVER_IMAGE_CLASS = "rdw-collection-cover-image";
var COVER_EMPTY_CLASS = "rdw-collection-cover-empty";
var META_ROW_CLASS = "rdw-collection-meta-row";
var NAME_CLASS = "rdw-collection-name";
var BADGE_CLASS = "rdw-collection-badge";
var CAPTION_CLASS = "rdw-collection-caption";
var FORM_ERROR_CLASS = "rdw-collection-form-error";
var FILTER_ALL = "all";
var FILTER_CUSTOM = "custom";
var FILTER_DYNAMIC = "dynamic";
var KIND_CUSTOM = "custom";
var KIND_DYNAMIC = "dynamic";
var FILTER_ALL_LABEL = "All";
var FILTER_CUSTOM_LABEL = "Custom";
var FILTER_DYNAMIC_LABEL = "Dynamic";
var NEW_BUTTON_LABEL = "New";
var NEW_DIALOG_TITLE = "New collection";
var CREATE_LABEL = "Create";
var QUERY_FIELD_LABEL = "Query";
var QUERY_PLACEHOLDER = "tag -tag ( a ~ b )";
var TYPE_SEGMENTED_LABEL = "Show";
var KIND_SEGMENTED_LABEL = "Collection kind";
var FILTER_ARIA_LABEL = "Filter by name";
var FILTER_PLACEHOLDER = "Filter by name";
var GRID_LABEL = "Collections";
var BADGE_CUSTOM = "Custom";
var BADGE_DYNAMIC = "Dynamic";
var SAVED_SEARCH_CAPTION = "saved search";
var EMPTY_TITLE = "No collections yet";
var EMPTY_DESCRIPTION = "Custom collections are posts you pick. Dynamic collections are saved searches.";
var FILTER_EMPTY_TITLE = "No matching collections";
var FILTER_EMPTY_DESCRIPTION = "Nothing matches this filter.";
var EMPTY_NAME_MESSAGE = "Enter a name.";
var EMPTY_QUERY_MESSAGE = "Enter a query.";
var DUPLICATE_NAME_MESSAGE = "A collection with this name already exists.";
var POST_WORD_SINGULAR = "post";
var POST_WORD_PLURAL = "posts";
var POST_COUNT_SINGULAR = 1;
var COVER_AXIS_COUNT = 2;
var COVER_SLOT_COUNT = 4;
var COVER_GAP_PX = 2;
var GRID_MIN_TRACK_PX = 200;
var GRID_GAP_PX = 12;
var PAGE_STACK_GAP_PX = 12;
var HEADER_GAP_PX = 12;
var TOOLBAR_GAP_PX = 8;
var FILTER_FIELD_MIN_PX = 160;
var CARD_PADDING_PX = 8;
var CARD_GAP_PX = 8;
var META_GAP_PX = 8;
var BADGE_FONT_PX = 10;
var CAPTION_FONT_PX = 12;
var ICON_PX = 14;
var BADGE_TRACKING = "0.04em";
var NAME_FIELD_ID = "rdw-collection-name";
var QUERY_FIELD_ID = "rdw-collection-query";
var FILTER_FIELD_ID = "rdw-collections-filter";
var FORM_ERROR_ID = "rdw-collection-form-error";
var FILTER_OPTIONS = [
	{
		value: FILTER_ALL,
		label: FILTER_ALL_LABEL
	},
	{
		value: FILTER_CUSTOM,
		label: FILTER_CUSTOM_LABEL
	},
	{
		value: FILTER_DYNAMIC,
		label: FILTER_DYNAMIC_LABEL
	}
];
var NEW_KIND_OPTIONS = [{
	value: KIND_CUSTOM,
	label: FILTER_CUSTOM_LABEL
}, {
	value: KIND_DYNAMIC,
	label: FILTER_DYNAMIC_LABEL
}];
var COLLECTIONS_PAGE_CSS = `
.${PAGE_CLASS} {
  display: flex;
  flex-direction: column;
  gap: ${String(PAGE_STACK_GAP_PX)}px;
}
.${HEADER_CLASS} {
  display: flex;
  flex-direction: column;
  gap: ${String(HEADER_GAP_PX)}px;
}
.${TOOLBAR_CLASS} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${String(TOOLBAR_GAP_PX)}px;
}
.${TOOLBAR_CLASS} .${FILTER_FIELD_CLASS} {
  flex: 1 1 ${String(FILTER_FIELD_MIN_PX)}px;
  min-width: 0;
  margin: 0;
}
.${GRID_CLASS} {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(${String(GRID_MIN_TRACK_PX)}px, 1fr));
  gap: ${String(GRID_GAP_PX)}px;
}
.${CARD_CLASS} {
  display: flex;
  flex-direction: column;
  gap: ${String(CARD_GAP_PX)}px;
  min-width: 0;
  padding: ${String(CARD_PADDING_PX)}px;
  box-sizing: border-box;
  text-decoration: none;
  color: var(--rdw-text);
  background: var(--rdw-surface);
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-l);
}
.${CARD_CLASS}:hover,
.${CARD_CLASS}:focus,
.${CARD_CLASS}:focus-visible {
  border-color: var(--rdw-accent);
  background: var(--rdw-surface-2);
  outline: none;
}
.${COVER_CLASS} {
  display: grid;
  grid-template-columns: repeat(${String(COVER_AXIS_COUNT)}, minmax(0, 1fr));
  grid-template-rows: repeat(${String(COVER_AXIS_COUNT)}, minmax(0, 1fr));
  aspect-ratio: 1;
  gap: ${String(COVER_GAP_PX)}px;
  border-radius: var(--rdw-radius-m);
  overflow: hidden;
  background: var(--rdw-surface-2);
}
.${COVER_CELL_CLASS},
.${COVER_EMPTY_CLASS} {
  min-width: 0;
  min-height: 0;
  background: var(--rdw-surface-2);
}
.${COVER_IMAGE_CLASS},
.${COVER_EMPTY_CLASS} {
  display: block;
  width: 100%;
  height: 100%;
}
.${COVER_IMAGE_CLASS} {
  object-fit: cover;
}
.${META_ROW_CLASS} {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${String(META_GAP_PX)}px;
  min-width: 0;
}
.${NAME_CLASS} {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}
.${BADGE_CLASS} {
  flex: none;
  font-size: ${String(BADGE_FONT_PX)}px;
  font-weight: 700;
  letter-spacing: ${BADGE_TRACKING};
  text-transform: uppercase;
  color: var(--rdw-accent);
}
.${CAPTION_CLASS} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: ${String(CAPTION_FONT_PX)}px;
}
.${FORM_ERROR_CLASS} {
  margin: 0;
  color: var(--rdw-danger);
  font-size: ${String(CAPTION_FONT_PX)}px;
}
`.trim();
function isListFilter(value) {
	return value === FILTER_ALL || value === FILTER_CUSTOM || value === FILTER_DYNAMIC;
}
function isNewKind(value) {
	return value === KIND_CUSTOM || value === KIND_DYNAMIC;
}
function foldedName(name) {
	return name.trim().toLowerCase();
}
function postsLabel(count) {
	return `${String(count)} ${count === POST_COUNT_SINGULAR ? POST_WORD_SINGULAR : POST_WORD_PLURAL}`;
}
function nameError(name, collections) {
	const trimmed = name.trim();
	if (trimmed.length === 0) return EMPTY_NAME_MESSAGE;
	const key = foldedName(trimmed);
	for (const collection of collections) if (foldedName(collection.name) === key) return DUPLICATE_NAME_MESSAGE;
	return null;
}
function nameMatchesFilter(name, query) {
	const needle = query.trim().toLowerCase();
	if (needle.length === 0) return true;
	return name.toLowerCase().includes(needle);
}
function visibleCollections(collections, filter, nameQuery) {
	const visible = [];
	for (const collection of collections) {
		if (!nameMatchesFilter(collection.name, nameQuery)) continue;
		const kind = resolveCollectionKind(collection);
		if (filter === FILTER_CUSTOM && kind !== "posts") continue;
		if (filter === FILTER_DYNAMIC && kind !== "search") continue;
		visible.push(collection);
	}
	return visible;
}
function kindForFilter(filter) {
	if (filter === FILTER_DYNAMIC) return KIND_DYNAMIC;
	return KIND_CUSTOM;
}
function filterAfterCreate(kind, filter) {
	if (kind === KIND_DYNAMIC && filter === FILTER_CUSTOM) return FILTER_DYNAMIC;
	if (kind === KIND_CUSTOM && filter === FILTER_DYNAMIC) return FILTER_CUSTOM;
	return filter;
}
/** Cover uses insertion order (`postIds`), not shuffled display order. */
function coverPostIds(collection) {
	const ids = collection.postIds ?? [];
	const slots = [];
	for (let index = 0; index < COVER_SLOT_COUNT; index += 1) {
		const id = ids[index];
		slots.push(id === void 0 ? null : id);
	}
	return slots;
}
function thumbUrl(collection, postId) {
	const thumbs = collection.thumbs;
	if (thumbs === void 0) return null;
	const value = thumbs[String(postId)];
	if (value === void 0 || value.trim().length === 0) return null;
	return value;
}
function cardAriaLabel(name, badge, meta) {
	return `${name}, ${badge}, ${meta}`;
}
function CardLink(props) {
	return /* @__PURE__ */ a("a", {
		className: CARD_CLASS,
		href: props.href,
		"aria-label": cardAriaLabel(props.collection.name, props.badge, props.meta),
		"data-collection-id": props.collection.id,
		"data-collection-kind": props.kind,
		children: [
			props.children,
			/* @__PURE__ */ a("span", {
				className: META_ROW_CLASS,
				children: [/* @__PURE__ */ a("span", {
					className: NAME_CLASS,
					children: props.collection.name
				}), /* @__PURE__ */ a("span", {
					className: BADGE_CLASS,
					children: props.badge
				})]
			}),
			/* @__PURE__ */ a("span", {
				className: CAPTION_CLASS,
				children: props.meta
			})
		]
	});
}
/** Cover thumb. A thumb that fails to load leaves the empty cell. */
function CoverThumb(props) {
	const [failedUrl, setFailedUrl] = d(null);
	if (failedUrl === props.url) return /* @__PURE__ */ a("span", { className: COVER_EMPTY_CLASS });
	return /* @__PURE__ */ a("img", {
		className: COVER_IMAGE_CLASS,
		src: props.url,
		alt: "",
		onError: () => {
			setFailedUrl(props.url);
		}
	});
}
/** 2x2 card cover. A slot without a thumb stays an empty cell. */
function Cover(props) {
	return /* @__PURE__ */ a("span", {
		className: COVER_CLASS,
		children: props.urls.map((url, index) => {
			const postId = props.postIds?.[index] ?? null;
			return /* @__PURE__ */ a("span", {
				className: COVER_CELL_CLASS,
				"data-cover-index": String(index),
				"data-post-id": postId === null ? "" : String(postId),
				children: url !== null ? /* @__PURE__ */ a(CoverThumb, { url }) : /* @__PURE__ */ a("span", { className: COVER_EMPTY_CLASS })
			}, `${props.collectionId}-${String(index)}`);
		})
	});
}
function CustomCard(props) {
	const meta = postsLabel(props.collection.postIds?.length ?? 0);
	const slots = coverPostIds(props.collection);
	const urls = slots.map((postId) => postId === null ? null : thumbUrl(props.collection, postId));
	return /* @__PURE__ */ a(CardLink, {
		collection: props.collection,
		href: collectionDetailHash(props.collection.id),
		kind: COLLECTION_KIND_POSTS,
		badge: BADGE_CUSTOM,
		meta,
		children: /* @__PURE__ */ a(Cover, {
			collectionId: props.collection.id,
			urls,
			postIds: slots
		})
	});
}
function DynamicCard(props) {
	const cover = readCoverMirror(props.collection.id) ?? props.collection.cover ?? [];
	const slots = [];
	for (let index = 0; index < COVER_SLOT_COUNT; index += 1) slots.push(cover[index] ?? null);
	return /* @__PURE__ */ a(CardLink, {
		collection: props.collection,
		href: buildSearchUrl(props.collection.tags),
		kind: COLLECTION_KIND_SEARCH,
		badge: BADGE_DYNAMIC,
		meta: SAVED_SEARCH_CAPTION,
		children: /* @__PURE__ */ a(Cover, {
			collectionId: props.collection.id,
			urls: slots
		})
	});
}
function CollectionCard(props) {
	if (resolveCollectionKind(props.collection) === "posts") return /* @__PURE__ */ a(CustomCard, { collection: props.collection });
	return /* @__PURE__ */ a(DynamicCard, { collection: props.collection });
}
function NewCollectionDialog(props) {
	return /* @__PURE__ */ a(Dialog, {
		variant: "content",
		open: props.open,
		onClose: props.onClose,
		title: NEW_DIALOG_TITLE,
		children: [/* @__PURE__ */ a(Segmented, {
			label: KIND_SEGMENTED_LABEL,
			options: NEW_KIND_OPTIONS,
			value: props.kind,
			onChange: (value) => {
				if (isNewKind(value)) props.onKindChange(value);
			}
		}), /* @__PURE__ */ a("form", {
			className: "rdw-dialog__fields",
			onSubmit: (event) => {
				event.preventDefault();
				props.onSubmit();
			},
			children: [
				/* @__PURE__ */ a(TextField, {
					id: NAME_FIELD_ID,
					label: UI_TEXT.nameLabel,
					value: props.name,
					onChange: props.onNameChange
				}),
				props.kind === KIND_DYNAMIC ? /* @__PURE__ */ a(QueryField, {
					id: QUERY_FIELD_ID,
					label: QUERY_FIELD_LABEL,
					placeholder: QUERY_PLACEHOLDER,
					value: props.query,
					onChange: props.onQueryChange
				}) : null,
				props.error.length > 0 ? /* @__PURE__ */ a("p", {
					id: FORM_ERROR_ID,
					className: FORM_ERROR_CLASS,
					role: "alert",
					children: props.error
				}) : null,
				/* @__PURE__ */ a("div", {
					className: "rdw-dialog__actions",
					children: [/* @__PURE__ */ a(Button, {
						type: "button",
						variant: "secondary",
						size: "s",
						onClick: props.onClose,
						children: UI_TEXT.cancel
					}), /* @__PURE__ */ a(Button, {
						type: "submit",
						variant: "primary",
						size: "s",
						children: CREATE_LABEL
					})]
				})
			]
		})]
	});
}
function CollectionsPage() {
	const [filter, setFilter] = d(FILTER_ALL);
	const [nameQuery, setNameQuery] = d("");
	const [dialogOpen, setDialogOpen] = d(false);
	const [newKind, setNewKind] = d(KIND_CUSTOM);
	const [nameDraft, setNameDraft] = d("");
	const [queryDraft, setQueryDraft] = d("");
	const [formError, setFormError] = d("");
	const [, setRevision] = d(0);
	const closeDialog = b(() => {
		setDialogOpen(false);
		setFormError("");
		setNameDraft("");
		setQueryDraft("");
	}, []);
	A(() => {
		const onPageShow = () => {
			reloadFromStorage();
			setRevision((value) => value + 1);
		};
		window.addEventListener(EVENT_PAGESHOW, onPageShow);
		return () => {
			window.removeEventListener(EVENT_PAGESHOW, onPageShow);
		};
	}, []);
	const collections = load().collections;
	const visible = visibleCollections(collections, filter, nameQuery);
	const emptyCopy = collections.length === 0 ? {
		title: EMPTY_TITLE,
		description: EMPTY_DESCRIPTION
	} : {
		title: FILTER_EMPTY_TITLE,
		description: FILTER_EMPTY_DESCRIPTION
	};
	const openDialog = () => {
		setNewKind(kindForFilter(filter));
		setNameDraft("");
		setQueryDraft("");
		setFormError("");
		setDialogOpen(true);
	};
	const submitNew = () => {
		const message = nameError(nameDraft, load().collections);
		if (message !== null) {
			setFormError(message);
			return;
		}
		if (newKind === KIND_DYNAMIC && queryDraft.trim().length === 0) {
			setFormError(EMPTY_QUERY_MESSAGE);
			return;
		}
		const name = nameDraft.trim();
		if (newKind === KIND_DYNAMIC) createDynamicCollection(name, queryDraft);
		else createPlaylist(name);
		setFilter((current) => filterAfterCreate(newKind, current));
		closeDialog();
		setRevision((value) => value + 1);
	};
	return /* @__PURE__ */ a("div", {
		className: PAGE_CLASS,
		children: [
			/* @__PURE__ */ a("style", { children: COLLECTIONS_PAGE_CSS }),
			/* @__PURE__ */ a("header", {
				className: HEADER_CLASS,
				children: /* @__PURE__ */ a("div", {
					className: TOOLBAR_CLASS,
					children: [
						/* @__PURE__ */ a(Segmented, {
							label: TYPE_SEGMENTED_LABEL,
							options: FILTER_OPTIONS,
							value: filter,
							onChange: (value) => {
								if (isListFilter(value)) setFilter(value);
							}
						}),
						/* @__PURE__ */ a(TextField, {
							id: FILTER_FIELD_ID,
							className: FILTER_FIELD_CLASS,
							value: nameQuery,
							placeholder: FILTER_PLACEHOLDER,
							"aria-label": FILTER_ARIA_LABEL,
							onChange: setNameQuery
						}),
						/* @__PURE__ */ a(Button, {
							type: "button",
							variant: "primary",
							onClick: openDialog,
							children: [/* @__PURE__ */ a(IconPlus, { size: ICON_PX }), NEW_BUTTON_LABEL]
						})
					]
				})
			}),
			visible.length === 0 ? /* @__PURE__ */ a(EmptyState, {
				title: emptyCopy.title,
				description: emptyCopy.description
			}) : /* @__PURE__ */ a("div", {
				className: GRID_CLASS,
				"aria-label": GRID_LABEL,
				children: visible.map((collection) => /* @__PURE__ */ a(CollectionCard, { collection }, collection.id))
			}),
			/* @__PURE__ */ a(NewCollectionDialog, {
				open: dialogOpen,
				kind: newKind,
				name: nameDraft,
				query: queryDraft,
				error: formError,
				onClose: closeDialog,
				onKindChange: (kind) => {
					setNewKind(kind);
					setFormError("");
				},
				onNameChange: (name) => {
					setNameDraft(name);
					setFormError("");
				},
				onQueryChange: (query) => {
					setQueryDraft(query);
					setFormError("");
				},
				onSubmit: submitNew
			})
		]
	});
}})}}));
System.register("./following-page-BF-OvY-B-BaKgA9A3.js", ['./___monkey.entry.js'],(function(exports){'use strict';var d,T,createAutocompleteQuerier,AUTOCOMPLETE_TAG_TYPE_ARTIST,A,getSeenPostId,a,Card,PANEL_UI_CLASS,UI_TEXT,$$1,EmptyState,ARTISTS_EMPTY_HINT,ARTISTS_EMPTY_TITLE,Button,SEARCH_PATH,SEARCH_PARAM_PAGE,SEARCH_PAGE,SEARCH_SECTION,TextField,ARTIST_FILTER_LABEL,ARTIST_FILTER_ID,UNFOLLOWED_PREFIX,UNFOLLOW_UNDO_LABEL,buildSearchUrl,TAG_TYPE_INCLUDE,IconButton,IconX,AutocompleteField,normalizeArtistTag,isFollowingArtist,addArtist,log,removeArtist,UNFOLLOW_UNDO_MS,load;return{setters:[function(module){d=module.ad;T=module.au;createAutocompleteQuerier=module.aR;AUTOCOMPLETE_TAG_TYPE_ARTIST=module.bC;A=module.av;getSeenPostId=module.bD;a=module.Y;Card=module.ae;PANEL_UI_CLASS=module.a3;UI_TEXT=module.U;$$1=module.a2;EmptyState=module.br;ARTISTS_EMPTY_HINT=module.bE;ARTISTS_EMPTY_TITLE=module.bF;Button=module.aF;SEARCH_PATH=module.X;SEARCH_PARAM_PAGE=module.T;SEARCH_PAGE=module.bG;SEARCH_SECTION=module.bH;TextField=module.aE;ARTIST_FILTER_LABEL=module.bI;ARTIST_FILTER_ID=module.bJ;UNFOLLOWED_PREFIX=module.bK;UNFOLLOW_UNDO_LABEL=module.bL;buildSearchUrl=module.bB;TAG_TYPE_INCLUDE=module.bM;IconButton=module.bN;IconX=module.bO;AutocompleteField=module.aV;normalizeArtistTag=module.n;isFollowingArtist=module.bP;addArtist=module.bQ;log=module.l;removeArtist=module.bR;UNFOLLOW_UNDO_MS=module.bS;load=module.b0;}],execute:(function(){exports("FollowingPage",FollowingPage);var ADD_FORM_CLASS = "rdw-following-add";
var ADD_INPUT_ID = "rdw-following-add-tag";
var OPEN_POSTS_LABEL = "Open Posts";
var OPEN_POSTS_HREF = `${SEARCH_PATH}?${SEARCH_PARAM_PAGE}=${SEARCH_PAGE}&s=${SEARCH_SECTION}`;
var FOLLOWING_PAGE_CSS = `
.${ADD_FORM_CLASS} {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: flex-end;
}
.${ADD_FORM_CLASS} .rdw-field,
.${ADD_FORM_CLASS} .rdw-ac {
  flex: 1 1 12rem;
  margin: 0;
}
`.trim();
function displayArtistName(tag) {
	return tag.replaceAll("_", " ");
}
function compareArtistTags(a, b) {
	return a.localeCompare(b, void 0, { sensitivity: "base" });
}
function readArtists() {
	return [...load().artists];
}
function AddArtistForm(props) {
	return /* @__PURE__ */ a("form", {
		className: ADD_FORM_CLASS,
		onSubmit: (event) => {
			event.preventDefault();
			props.onSubmit();
		},
		children: [
			/* @__PURE__ */ a(AutocompleteField, {
				id: ADD_INPUT_ID,
				label: UI_TEXT.artistTagLabel,
				value: props.draft,
				suggestions: props.suggestions,
				onChange: props.onDraftChange,
				onSelect: props.onSuggestionSelect
			}),
			/* @__PURE__ */ a(Button, {
				type: "submit",
				variant: "primary",
				children: UI_TEXT.artistAdd
			}),
			props.error.length > 0 ? /* @__PURE__ */ a("p", {
				className: "rdw-error",
				children: props.error
			}) : null
		]
	});
}
function FollowingPage() {
	const [artists, setArtists] = d(() => readArtists());
	const [pending, setPending] = d([]);
	const [filter, setFilter] = d("");
	const [draft, setDraft] = d("");
	const [addError, setAddError] = d("");
	const [suggestions, setSuggestions] = d([]);
	const pendingRef = T(pending);
	pendingRef.current = pending;
	const querierRef = T(createAutocompleteQuerier({ preferType: AUTOCOMPLETE_TAG_TYPE_ARTIST }));
	A(() => {
		const querier = querierRef.current;
		return () => {
			querier.cancel();
			for (const entry of pendingRef.current) clearTimeout(entry.timer);
		};
	}, []);
	const clearPendingUnfollow = (tag) => {
		setPending((current) => {
			const index = current.findIndex((entry) => entry.tag === tag);
			if (index < 0) return current;
			const removed = current[index];
			if (removed !== void 0) clearTimeout(removed.timer);
			return current.filter((entry) => entry.tag !== tag);
		});
	};
	const onUnfollow = (tag) => {
		const existing = pendingRef.current.find((entry) => entry.tag === tag);
		if (existing !== void 0) clearTimeout(existing.timer);
		removeArtist(tag);
		const timer = setTimeout(() => {
			clearPendingUnfollow(tag);
			setArtists(readArtists());
		}, UNFOLLOW_UNDO_MS);
		setPending([...pendingRef.current.filter((entry) => entry.tag !== tag), {
			tag,
			timer
		}]);
		setArtists(readArtists());
	};
	const onUndo = (tag) => {
		clearPendingUnfollow(tag);
		try {
			addArtist(tag);
		} catch (error) {
			log.warn("Undo unfollow failed", error);
		}
		setArtists(readArtists());
	};
	const onAdd = () => {
		const normalized = normalizeArtistTag(draft);
		if (normalized === null) {
			setAddError(UI_TEXT.artistInvalid);
			return;
		}
		if (isFollowingArtist(normalized)) {
			setAddError(UI_TEXT.artistDuplicate);
			return;
		}
		try {
			addArtist(normalized);
		} catch (error) {
			const message = error instanceof Error ? error.message : UI_TEXT.artistDuplicate;
			setAddError(message.toLowerCase().includes("duplicate") ? UI_TEXT.artistDuplicate : UI_TEXT.artistInvalid);
			return;
		}
		setDraft("");
		setAddError("");
		setSuggestions([]);
		querierRef.current.cancel();
		setArtists(readArtists());
	};
	const pendingTags = new Set(pending.map((entry) => entry.tag));
	const sorted = [...artists].sort((a, b) => compareArtistTags(a.tag, b.tag));
	const showFilter = sorted.length + pending.length > 12;
	const filterValue = showFilter ? filter.trim().toLowerCase() : "";
	A(() => {
		if (!showFilter && filter.length > 0) setFilter("");
	}, [showFilter, filter]);
	const matchesFilter = (tag) => {
		if (filterValue.length === 0) return true;
		return tag.toLowerCase().includes(filterValue) || displayArtistName(tag).toLowerCase().includes(filterValue);
	};
	const pendingSorted = [...pending].sort((a, b) => compareArtistTags(a.tag, b.tag));
	const seen = getSeenPostId();
	const count = artists.length;
	const empty = sorted.length === 0 && pending.length === 0;
	return /* @__PURE__ */ a($$1, { children: [/* @__PURE__ */ a("style", { children: FOLLOWING_PAGE_CSS }), /* @__PURE__ */ a(Card, {
		className: PANEL_UI_CLASS.pageCard,
		children: /* @__PURE__ */ a("div", {
			className: PANEL_UI_CLASS.scrollRegion,
			children: [
				/* @__PURE__ */ a("div", {
					className: PANEL_UI_CLASS.artistMeta,
					children: [/* @__PURE__ */ a("p", {
						className: "rdw-hint",
						children: `${String(count)} artist${count === 1 ? "" : "s"}`
					}), /* @__PURE__ */ a("p", {
						className: "rdw-hint",
						children: seen > 0 ? `${UI_TEXT.seenUpTo}${String(seen)}` : UI_TEXT.seenNothing
					})]
				}),
				/* @__PURE__ */ a(AddArtistForm, {
					draft,
					error: addError,
					suggestions,
					onDraftChange: (value) => {
						setDraft(value);
						if (addError.length > 0) setAddError("");
						querierRef.current.query(value, setSuggestions);
					},
					onSuggestionSelect: () => {
						querierRef.current.cancel();
						setSuggestions([]);
					},
					onSubmit: onAdd
				}),
				empty ? /* @__PURE__ */ a($$1, { children: /* @__PURE__ */ a(EmptyState, {
					title: ARTISTS_EMPTY_TITLE,
					description: ARTISTS_EMPTY_HINT,
					action: /* @__PURE__ */ a(Button, {
						variant: "secondary",
						onClick: () => {
							window.location.assign(OPEN_POSTS_HREF);
						},
						children: OPEN_POSTS_LABEL
					})
				}) }) : /* @__PURE__ */ a($$1, { children: [showFilter ? /* @__PURE__ */ a("div", {
					className: PANEL_UI_CLASS.artistFilter,
					children: /* @__PURE__ */ a(TextField, {
						id: ARTIST_FILTER_ID,
						label: ARTIST_FILTER_LABEL,
						value: filter,
						onChange: setFilter
					})
				}) : null, /* @__PURE__ */ a("ul", {
					className: PANEL_UI_CLASS.artistList,
					children: [pendingSorted.map((entry) => {
						if (!matchesFilter(entry.tag)) return null;
						return /* @__PURE__ */ a("li", {
							className: PANEL_UI_CLASS.artistRow,
							"data-tag": entry.tag,
							children: /* @__PURE__ */ a("div", {
								className: PANEL_UI_CLASS.artistUndo,
								children: [/* @__PURE__ */ a("span", { children: `${UNFOLLOWED_PREFIX}${displayArtistName(entry.tag)}` }), /* @__PURE__ */ a(Button, {
									variant: "secondary",
									size: "s",
									onClick: () => {
										onUndo(entry.tag);
									},
									children: UNFOLLOW_UNDO_LABEL
								})]
							})
						}, `undo-${entry.tag}`);
					}), sorted.map((artist) => {
						if (pendingTags.has(artist.tag) || !matchesFilter(artist.tag)) return null;
						return /* @__PURE__ */ a("li", {
							className: PANEL_UI_CLASS.artistRow,
							"data-tag": artist.tag,
							children: [/* @__PURE__ */ a("a", {
								className: PANEL_UI_CLASS.artistLink,
								href: buildSearchUrl([{
									tag: artist.tag,
									type: TAG_TYPE_INCLUDE
								}]),
								title: artist.tag,
								children: displayArtistName(artist.tag)
							}), /* @__PURE__ */ a(IconButton, {
								label: `Unfollow ${artist.tag}`,
								onClick: () => {
									onUnfollow(artist.tag);
								},
								children: /* @__PURE__ */ a(IconX, { size: 14 })
							})]
						}, artist.tag);
					})]
				})] })
			]
		})
	})] });
}})}}));
System.register("./collection-detail-page-DyUosBR5-B7CU73IV.js", ['./___monkey.entry.js','./app-DmZ929w1-B2f0K97j.js'],(function(exports){'use strict';var d,T,w$1,b,a,$$1,Button,UI_TEXT,shuffleCollection,resetCollectionOrder,EmptyState,Dialog,TextField,Toast,getCollectionOrder,listPlaylists,RDW_HASH_COLLECTIONS,removePostsFromCollection,renameCollection,deleteCollection,RDW_ROUTE_COLLECTIONS,restorePosts,SEARCH_PARAM_PAGE,SEARCH_PAGE,SEARCH_SECTION_VIEW,SEARCH_PATH,collectionQueueHash,navigateToRdwRoute;return{setters:[function(module){d=module.ad;T=module.au;w$1=module.bT;b=module.aS;a=module.Y;$$1=module.a2;Button=module.aF;UI_TEXT=module.U;shuffleCollection=module.bU;resetCollectionOrder=module.bV;EmptyState=module.br;Dialog=module.bu;TextField=module.aE;Toast=module.bW;getCollectionOrder=module.bX;listPlaylists=module.bY;RDW_HASH_COLLECTIONS=module.u;removePostsFromCollection=module.bZ;renameCollection=module.b_;deleteCollection=module.b$;RDW_ROUTE_COLLECTIONS=module.c0;restorePosts=module.c1;SEARCH_PARAM_PAGE=module.T;SEARCH_PAGE=module.bG;SEARCH_SECTION_VIEW=module.c2;SEARCH_PATH=module.X;collectionQueueHash=module.c3;},function(module){navigateToRdwRoute=module.i;}],execute:(function(){exports("CollectionDetailPage",CollectionDetailPage);var CELL_SIZE_PX = 200;
var GRID_GAP_PX = 4;
var SECTION_GAP_PX = 12;
var ACTIONS_GAP_PX = 8;
var HEADING_GAP_PX = 8;
var NAME_MIN_LENGTH = 1;
var POST_COUNT_SINGULAR = 1;
var MOUSE_BUTTON_PRIMARY = 0;
var OBJECT_FIT_CONTAIN = "contain";
var IMG_LOADING_LAZY = "lazy";
/** Same mark chrome as favorites bulk select. */
var CLASS_MARK_SELECTED = "rdw-fav-bulk-selected";
var CLASS_MARK_CHECK = "rdw-fav-bulk-check";
var MARK_CHECK_GLYPH = "✓";
var SELECT_OUTLINE_WIDTH = "2px";
var SELECT_OUTLINE_OFFSET = "2px";
var CHECK_SIZE = "1.25rem";
var CHECK_INSET = "0.25rem";
var CHECK_Z_INDEX = 2;
var CHECK_FONT_SIZE = "0.75rem";
var ACCENT_FALLBACK = "#4c8bf5";
var SURFACE_FALLBACK = "#ffffff";
var CLASS_ROOT = "rdw-collection-detail";
var CLASS_BACK = "rdw-collection-back";
var CLASS_HEADING = "rdw-collection-heading";
var CLASS_NAME = "rdw-collection-name";
var CLASS_COUNT = "rdw-collection-count";
var CLASS_ACTIONS = "rdw-collection-actions";
var CLASS_GRID = "rdw-collection-grid";
var CLASS_CELL = "rdw-collection-cell";
var CLASS_FALLBACK = "rdw-collection-fallback";
var CLASS_MISSING = "rdw-collection-missing";
var CLASS_DIALOG_FORM = "rdw-collection-dialog-form";
var CLASS_DIALOG_ACTIONS = "rdw-collection-dialog-actions";
var LABEL_BACK = "← Collections";
var LABEL_SHUFFLE = "Shuffle";
var LABEL_ORIGINAL_ORDER = "Original order";
var LABEL_SELECT = "Select";
var LABEL_SELECT_ALL = "Select all";
var LABEL_CLEAR = "Clear";
var LABEL_CANCEL = UI_TEXT.cancel;
var LABEL_UNDO = "Undo";
var REMOVE_SELECTED_PREFIX = "Remove selected (";
var REMOVE_SELECTED_SUFFIX = ")";
var FALLBACK_PREFIX = "#";
var POST_LINK_LABEL_PREFIX = "Post #";
var POST_NOUN_SINGULAR = "post";
var POST_NOUN_PLURAL = "posts";
var REMOVED_PREFIX = "Removed ";
var UNKNOWN_COLLECTION_MESSAGE = "Collection not found.";
var EMPTY_COLLECTION_TITLE = "No posts yet";
var EMPTY_COLLECTION_HINT = "Add posts with + on a thumbnail, and with Collections on the post page.";
var RENAME_INPUT_ID = "rdw-collection-rename-name";
var RENAME_DIALOG_LABEL = "Rename collection";
var DELETE_DIALOG_LABEL = "Delete collection";
var GRID_LABEL = "Collection posts";
var COLLECTION_DETAIL_CSS = `
.${CLASS_ROOT} {
  display: flex;
  flex-direction: column;
  gap: ${String(SECTION_GAP_PX)}px;
}
.${CLASS_BACK} {
  color: var(--rdw-accent);
  font-weight: 600;
  text-decoration: none;
}
.${CLASS_HEADING} {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: ${String(HEADING_GAP_PX)}px ${String(SECTION_GAP_PX)}px;
}
.${CLASS_NAME} {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--rdw-text);
}
.${CLASS_COUNT} {
  margin: 0;
  color: var(--rdw-muted);
}
.${CLASS_ACTIONS} {
  display: flex;
  flex-wrap: wrap;
  gap: ${String(ACTIONS_GAP_PX)}px;
}
.${CLASS_GRID} {
  display: grid;
  grid-template-columns: repeat(auto-fill, ${String(CELL_SIZE_PX)}px);
  gap: ${String(GRID_GAP_PX)}px;
}
.${CLASS_CELL} {
  position: relative;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${String(CELL_SIZE_PX)}px;
  height: ${String(CELL_SIZE_PX)}px;
  overflow: hidden;
  border: 1px solid var(--rdw-border);
  background: var(--rdw-surface);
  color: var(--rdw-text);
  text-decoration: none;
}
.${CLASS_CELL} img {
  width: 100%;
  height: 100%;
  object-fit: ${OBJECT_FIT_CONTAIN};
}
.${CLASS_FALLBACK} {
  font-weight: 600;
  color: var(--rdw-muted);
}
.${CLASS_MISSING} {
  margin: 0;
}
.${CLASS_DIALOG_FORM} {
  display: grid;
  gap: ${String(SECTION_GAP_PX)}px;
}
.${CLASS_DIALOG_ACTIONS} {
  display: flex;
  justify-content: flex-end;
  gap: ${String(ACTIONS_GAP_PX)}px;
}
.${CLASS_CELL}.${CLASS_MARK_SELECTED} {
  outline: ${SELECT_OUTLINE_WIDTH} solid var(--rdw-accent, ${ACCENT_FALLBACK});
  outline-offset: ${SELECT_OUTLINE_OFFSET};
}
.${CLASS_CELL} > .${CLASS_MARK_CHECK} {
  position: absolute;
  top: ${CHECK_INSET};
  left: ${CHECK_INSET};
  z-index: ${String(CHECK_Z_INDEX)};
  display: none;
  align-items: center;
  justify-content: center;
  width: ${CHECK_SIZE};
  height: ${CHECK_SIZE};
  border-radius: 999px;
  background: var(--rdw-accent, ${ACCENT_FALLBACK});
  color: var(--rdw-surface, ${SURFACE_FALLBACK});
  font-size: ${CHECK_FONT_SIZE};
  font-weight: 700;
  line-height: 1;
  pointer-events: none;
}
.${CLASS_CELL}.${CLASS_MARK_SELECTED} > .${CLASS_MARK_CHECK} {
  display: inline-flex;
}
`.trim();
function postsCountLabel(count) {
	return `${String(count)} ${count === POST_COUNT_SINGULAR ? POST_NOUN_SINGULAR : POST_NOUN_PLURAL}`;
}
function removedPostsMessage(count) {
	return `${REMOVED_PREFIX}${String(count)} ${count === POST_COUNT_SINGULAR ? POST_NOUN_SINGULAR : POST_NOUN_PLURAL}`;
}
function removeSelectedLabel(count) {
	return `${REMOVE_SELECTED_PREFIX}${String(count)}${REMOVE_SELECTED_SUFFIX}`;
}
function fallbackLabel(postId) {
	return `${FALLBACK_PREFIX}${String(postId)}`;
}
function thumbUrlFor(thumbs, postId) {
	const value = thumbs[String(postId)];
	if (value === void 0 || value.length === 0) return null;
	return value;
}
function readCollectionDetail(collectionId) {
	const order = getCollectionOrder(collectionId);
	if (order === null) return null;
	const collection = listPlaylists().find((item) => item.id === collectionId);
	if (collection === void 0) return null;
	return {
		name: collection.name,
		order,
		thumbs: collection.thumbs ?? {},
		shuffled: collection.shuffledOrder !== null && collection.shuffledOrder !== void 0
	};
}
/** Post page link that carries the collection queue hash, not a script route. */
function collectionPostHref(collectionId, postId) {
	const params = new URLSearchParams();
	params.set(SEARCH_PARAM_PAGE, SEARCH_PAGE);
	params.set("s", SEARCH_SECTION_VIEW);
	params.set("id", String(postId));
	return `${SEARCH_PATH}?${params.toString()}${collectionQueueHash(collectionId)}`;
}
function isModifiedClick(event) {
	return event.button !== MOUSE_BUTTON_PRIMARY || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}
function PostCell(props) {
	const [failedUrl, setFailedUrl] = d(null);
	const thumbUrl = props.thumbUrl;
	const failed = thumbUrl !== null && failedUrl === thumbUrl;
	const thumbUrlRef = T(thumbUrl);
	thumbUrlRef.current = thumbUrl;
	const markFailed = b(() => {
		setFailedUrl(thumbUrlRef.current);
	}, []);
	const imageRef = b((node) => {
		if (node === null) return;
		node.addEventListener("error", markFailed);
	}, [markFailed]);
	const showImage = thumbUrl !== null && !failed;
	const className = [CLASS_CELL, props.selected ? CLASS_MARK_SELECTED : ""].filter((part) => part.length > 0).join(" ");
	return /* @__PURE__ */ a("a", {
		className,
		href: collectionPostHref(props.collectionId, props.postId),
		"aria-label": `${POST_LINK_LABEL_PREFIX}${String(props.postId)}`,
		...props.selecting ? { "aria-pressed": props.selected } : {},
		onClick: (event) => {
			if (!props.selecting || isModifiedClick(event)) return;
			event.preventDefault();
			props.onToggle(props.postId);
		},
		children: [showImage ? /* @__PURE__ */ a("img", {
			src: thumbUrl,
			alt: "",
			loading: IMG_LOADING_LAZY,
			ref: imageRef
		}) : /* @__PURE__ */ a("span", {
			className: CLASS_FALLBACK,
			children: fallbackLabel(props.postId)
		}), props.selected ? /* @__PURE__ */ a("span", {
			className: CLASS_MARK_CHECK,
			"aria-hidden": "true",
			children: MARK_CHECK_GLYPH
		}) : null]
	});
}
function BackToCollections() {
	return /* @__PURE__ */ a("a", {
		className: CLASS_BACK,
		href: RDW_HASH_COLLECTIONS,
		children: LABEL_BACK
	});
}
function CollectionDetailPage(props) {
	const [revision, setRevision] = d(0);
	const [selecting, setSelecting] = d(false);
	const [selected, setSelected] = d(() => /* @__PURE__ */ new Set());
	const [renameOpen, setRenameOpen] = d(false);
	const [nameDraft, setNameDraft] = d("");
	const [deleteOpen, setDeleteOpen] = d(false);
	const [toast, setToast] = d(null);
	const toastRef = T(null);
	const toastIdRef = T(0);
	const detail = w$1(() => readCollectionDetail(props.collectionId), [props.collectionId, revision]);
	const refresh = b(() => {
		setRevision((value) => value + 1);
	}, []);
	const onToastClose = b(() => {
		toastRef.current = null;
		setToast(null);
	}, []);
	const onUndo = b(() => {
		const current = toastRef.current;
		if (current === null) return;
		restorePosts(current.snapshot);
		toastRef.current = null;
		setToast(null);
		setRevision((value) => value + 1);
	}, []);
	function showRemoval(snapshot) {
		if (snapshot.posts.length === 0) return;
		toastIdRef.current += 1;
		const next = {
			id: toastIdRef.current,
			message: removedPostsMessage(snapshot.posts.length),
			snapshot
		};
		toastRef.current = next;
		setToast(next);
	}
	function leaveSelectMode() {
		setSelecting(false);
		setSelected(/* @__PURE__ */ new Set());
	}
	function togglePost(postId) {
		setSelected((current) => {
			const next = new Set(current);
			if (next.has(postId)) next.delete(postId);
			else next.add(postId);
			return next;
		});
	}
	function openRename() {
		if (detail === null) return;
		setNameDraft(detail.name);
		setRenameOpen(true);
	}
	function submitRename(event) {
		event.preventDefault();
		const trimmed = nameDraft.trim();
		if (trimmed.length < NAME_MIN_LENGTH) return;
		renameCollection(props.collectionId, trimmed);
		setRenameOpen(false);
		refresh();
	}
	function confirmDelete() {
		setDeleteOpen(false);
		if (!deleteCollection(props.collectionId)) {
			refresh();
			return;
		}
		navigateToRdwRoute(RDW_ROUTE_COLLECTIONS);
	}
	function removeSelected() {
		if (selected.size === 0) return;
		const snapshot = removePostsFromCollection(props.collectionId, [...selected]);
		leaveSelectMode();
		refresh();
		if (snapshot !== null) showRemoval(snapshot);
	}
	const toastAction = toast === null ? null : {
		label: LABEL_UNDO,
		onClick: onUndo
	};
	return /* @__PURE__ */ a("div", {
		className: CLASS_ROOT,
		"data-collection-id": props.collectionId,
		children: [
			/* @__PURE__ */ a("style", { children: COLLECTION_DETAIL_CSS }),
			detail === null ? /* @__PURE__ */ a($$1, { children: [/* @__PURE__ */ a("p", {
				className: CLASS_MISSING,
				children: UNKNOWN_COLLECTION_MESSAGE
			}), /* @__PURE__ */ a(BackToCollections, {})] }) : /* @__PURE__ */ a($$1, { children: [
				/* @__PURE__ */ a(BackToCollections, {}),
				/* @__PURE__ */ a("div", {
					className: CLASS_HEADING,
					children: [/* @__PURE__ */ a("h1", {
						className: CLASS_NAME,
						children: detail.name
					}), /* @__PURE__ */ a("p", {
						className: CLASS_COUNT,
						children: postsCountLabel(detail.order.length)
					})]
				}),
				/* @__PURE__ */ a("div", {
					className: CLASS_ACTIONS,
					children: selecting ? /* @__PURE__ */ a($$1, { children: [
						/* @__PURE__ */ a(Button, {
							variant: "secondary",
							size: "s",
							onClick: () => {
								setSelected(new Set(detail.order));
							},
							children: LABEL_SELECT_ALL
						}),
						/* @__PURE__ */ a(Button, {
							variant: "secondary",
							size: "s",
							onClick: () => {
								setSelected(/* @__PURE__ */ new Set());
							},
							children: LABEL_CLEAR
						}),
						/* @__PURE__ */ a(Button, {
							variant: "secondary",
							size: "s",
							disabled: selected.size === 0,
							onClick: removeSelected,
							children: removeSelectedLabel(selected.size)
						}),
						/* @__PURE__ */ a(Button, {
							variant: "secondary",
							size: "s",
							onClick: leaveSelectMode,
							children: LABEL_CANCEL
						})
					] }) : /* @__PURE__ */ a($$1, { children: [
						/* @__PURE__ */ a(Button, {
							variant: "secondary",
							size: "s",
							onClick: () => {
								shuffleCollection(props.collectionId);
								refresh();
							},
							children: LABEL_SHUFFLE
						}),
						detail.shuffled ? /* @__PURE__ */ a(Button, {
							variant: "secondary",
							size: "s",
							onClick: () => {
								resetCollectionOrder(props.collectionId);
								refresh();
							},
							children: LABEL_ORIGINAL_ORDER
						}) : null,
						/* @__PURE__ */ a(Button, {
							variant: "secondary",
							size: "s",
							onClick: () => {
								setSelected(/* @__PURE__ */ new Set());
								setSelecting(true);
							},
							children: LABEL_SELECT
						}),
						/* @__PURE__ */ a(Button, {
							variant: "secondary",
							size: "s",
							onClick: openRename,
							children: UI_TEXT.rename
						}),
						/* @__PURE__ */ a(Button, {
							variant: "danger",
							size: "s",
							onClick: () => {
								setDeleteOpen(true);
							},
							children: UI_TEXT.delete
						})
					] })
				}),
				detail.order.length === 0 ? /* @__PURE__ */ a(EmptyState, {
					title: EMPTY_COLLECTION_TITLE,
					description: EMPTY_COLLECTION_HINT
				}) : /* @__PURE__ */ a("div", {
					className: CLASS_GRID,
					"aria-label": GRID_LABEL,
					children: detail.order.map((postId) => /* @__PURE__ */ a(PostCell, {
						postId,
						collectionId: props.collectionId,
						thumbUrl: thumbUrlFor(detail.thumbs, postId),
						selecting,
						selected: selected.has(postId),
						onToggle: togglePost
					}, postId))
				}),
				/* @__PURE__ */ a(Dialog, {
					open: renameOpen,
					onClose: () => {
						setRenameOpen(false);
					},
					title: UI_TEXT.rename,
					"aria-label": RENAME_DIALOG_LABEL,
					children: /* @__PURE__ */ a("form", {
						className: CLASS_DIALOG_FORM,
						onSubmit: submitRename,
						children: [/* @__PURE__ */ a(TextField, {
							id: RENAME_INPUT_ID,
							label: UI_TEXT.nameLabel,
							value: nameDraft,
							onChange: setNameDraft
						}), /* @__PURE__ */ a("div", {
							className: CLASS_DIALOG_ACTIONS,
							children: [/* @__PURE__ */ a(Button, {
								type: "button",
								variant: "secondary",
								size: "s",
								onClick: () => {
									setRenameOpen(false);
								},
								children: UI_TEXT.cancel
							}), /* @__PURE__ */ a(Button, {
								type: "submit",
								variant: "primary",
								size: "s",
								children: UI_TEXT.save
							})]
						})]
					})
				}),
				/* @__PURE__ */ a(Dialog, {
					variant: "confirm",
					open: deleteOpen,
					onClose: () => {
						setDeleteOpen(false);
					},
					title: UI_TEXT.delete,
					"aria-label": DELETE_DIALOG_LABEL,
					message: UI_TEXT.confirmDelete,
					confirmLabel: UI_TEXT.delete,
					cancelLabel: UI_TEXT.cancel,
					confirmTone: "danger",
					onConfirm: confirmDelete
				})
			] }),
			/* @__PURE__ */ a(Toast, {
				open: toast !== null,
				message: toast === null ? "" : toast.message,
				onClose: onToastClose,
				...toastAction === null ? {} : { action: toastAction }
			}, toast?.id)
		]
	});
}})}}));
System.import("./___monkey.entry.js", "./");
