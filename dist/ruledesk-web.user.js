// ==UserScript==
// @name         RuleDesk Web
// @namespace    https://github.com/kazekaze93/ruledesk-web
// @version      0.74.3
// @description  Collections, playlists, favorites, artist updates, and page tweaks for rule34.xxx
// @license      GPL-3.0-or-later
// @downloadURL  https://raw.githubusercontent.com/KazeKaze93/RuleDesk/main/dist/ruledesk-web.user.js
// @updateURL    https://raw.githubusercontent.com/KazeKaze93/RuleDesk/main/dist/ruledesk-web.user.js
// @match        https://rule34.xxx/*
// @connect      api.rule34.xxx
// @grant        GM_download
// @grant        GM_getValue
// @grant        GM_info
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// ==/UserScript==

!function(){function e(e,t){return(t||"")+" (SystemJS Error#"+e+" https://github.com/systemjs/systemjs/blob/main/docs/errors.md#"+e+")"}function t(e,t){if(-1!==e.indexOf("\\")&&(e=e.replace(j,"/")),"/"===e[0]&&"/"===e[1])return t.slice(0,t.indexOf(":")+1)+e;if("."===e[0]&&("/"===e[1]||"."===e[1]&&("/"===e[2]||2===e.length&&(e+="/"))||1===e.length&&(e+="/"))||"/"===e[0]){var n,r=t.slice(0,t.indexOf(":")+1);if(n="/"===t[r.length+1]?"file:"!==r?(n=t.slice(r.length+2)).slice(n.indexOf("/")+1):t.slice(8):t.slice(r.length+("/"===t[r.length])),"/"===e[0])return t.slice(0,t.length-n.length-1)+e;for(var i=n.slice(0,n.lastIndexOf("/")+1)+e,o=[],s=-1,u=0;u<i.length;u++)-1!==s?"/"===i[u]&&(o.push(i.slice(s,u+1)),s=-1):"."===i[u]?"."!==i[u+1]||"/"!==i[u+2]&&u+2!==i.length?"/"===i[u+1]||u+1===i.length?u+=1:s=u:(o.pop(),u+=2):s=u;return-1!==s&&o.push(i.slice(s)),t.slice(0,t.length-n.length)+o.join("")}}function n(e,n){return t(e,n)||(-1!==e.indexOf(":")?e:t("./"+e,n))}function r(e,n,r,i,o){for(var s in e){var a=t(s,r)||s,f=e[s];if("string"==typeof f){var l=c(i,t(f,r)||f,o);l?n[a]=l:u("W1",s,f,"bare specifier did not resolve")}}}function i(e,t,i){var o;for(o in e.imports&&r(e.imports,i.imports,t,i,null),e.scopes||{}){var s=n(o,t);r(e.scopes[o],i.scopes[s]||(i.scopes[s]={}),t,i,s)}for(o in e.depcache||{})i.depcache[n(o,t)]=e.depcache[o];for(o in e.integrity||{})i.integrity[n(o,t)]=e.integrity[o]}function o(e,t){if(t[e])return e;var n=e.length;do{var r=e.slice(0,n+1);if(r in t)return r}while(-1!==(n=e.lastIndexOf("/",n-1)))}function s(e,t){var n=o(e,t);if(n){var r=t[n];if(null===r)return;if(!(e.length>n.length&&"/"!==r[r.length-1]))return r+e.slice(n.length);u("W2",n,r,"should have a trailing '/'")}}function u(t,n,r,i){console.warn(e(t,"Package target "+i+", resolving target '"+r+"' for "+n))}function c(e,t,n){for(var r=e.scopes,i=n&&o(n,r);i;){var u=s(t,r[i]);if(u)return u;i=o(i.slice(0,i.lastIndexOf("/")),r)}return s(t,e.imports)||-1!==t.indexOf(":")&&t}function a(){this[M]={}}function f(e){return e.id}function l(e,t,n,r){if(e.onload(n,t.id,t.d&&t.d.map(f),!!r),n)throw n}function d(t,n,r,i){var o=t[M][n];if(o)return o;var s=[],u=Object.create(null);P&&Object.defineProperty(u,P,{value:"Module"});var c=Promise.resolve().then((function(){return t.instantiate(n,r,i)})).then((function(r){if(!r)throw Error(e(2,"Module "+n+" did not instantiate"));var i=r[1]((function(e,t){o.h=!0;var n=!1;if("string"==typeof e)e in u&&u[e]===t||(u[e]=t,n=!0);else{for(var r in e)t=e[r],r in u&&u[r]===t||(u[r]=t,n=!0);e&&e.__esModule&&(u.__esModule=e.__esModule)}if(n)for(var i=0;i<s.length;i++){var c=s[i];c&&c(u)}return t}),2===r[1].length?{import:function(e,r){return t.import(e,n,r)},meta:t.createContext(n)}:void 0);return o.e=i.execute||function(){},[r[0],i.setters||[],r[2]||[]]}),(function(e){throw o.e=null,o.er=e,l(t,o,e,!0),e})),a=c.then((function(e){return Promise.all(e[0].map((function(r,i){var o=e[1][i],s=e[2][i];return Promise.resolve(t.resolve(r,n)).then((function(e){var r=d(t,e,n,s);return Promise.resolve(r.I).then((function(){return o&&(r.i.push(o),!r.h&&r.I||o(r.n)),r}))}))}))).then((function(e){o.d=e}))}));return o=t[M][n]={id:n,i:s,n:u,m:i,I:c,L:a,h:!1,d:void 0,e:void 0,er:void 0,E:void 0,C:void 0,p:void 0}}function h(e,t,n,r){if(!r[t.id])return r[t.id]=!0,Promise.resolve(t.L).then((function(){return t.p&&null!==t.p.e||(t.p=n),Promise.all(t.d.map((function(t){return h(e,t,n,r)})))})).catch((function(n){if(t.er)throw n;throw t.e=null,l(e,t,n,!1),n}))}function p(e,t){return t.C=h(e,t,t,{}).then((function(){return v(e,t,{})})).then((function(){return t.n}))}function v(e,t,n){function r(){try{var n=o.call(L);if(n)return n=n.then((function(){t.C=t.n,t.E=null,l(e,t,null,!0)}),(function(n){throw t.er=n,t.E=null,l(e,t,n,!0),n})),t.E=n;t.C=t.n,t.L=t.I=void 0}catch(r){throw t.er=r,r}finally{l(e,t,t.er,!0)}}if(!n[t.id]){if(n[t.id]=!0,!t.e){if(t.er)throw t.er;return t.E?t.E:void 0}var i,o=t.e;return t.e=null,t.d.forEach((function(r){try{var o=v(e,r,n);o&&(i=i||[]).push(o)}catch(s){throw t.er=s,l(e,t,s,!1),s}})),i?Promise.all(i).then(r):r()}}function m(){[].forEach.call(document.querySelectorAll("script"),(function(t){if(!t.sp)if("systemjs-module"===t.type){if(t.sp=!0,!t.src)return;System.import("import:"===t.src.slice(0,7)?t.src.slice(7):n(t.src,g)).catch((function(e){if(e.message.indexOf("https://github.com/systemjs/systemjs/blob/main/docs/errors.md#3")>-1){var n=document.createEvent("Event");n.initEvent("error",!1,!1),t.dispatchEvent(n)}return Promise.reject(e)}))}else if("systemjs-importmap"===t.type){t.sp=!0;var r=t.src?(System.fetch||fetch)(t.src,{integrity:t.integrity,priority:t.fetchPriority,passThrough:!0}).then((function(e){if(!e.ok)throw Error("Invalid status code: "+e.status);return e.text()})).catch((function(n){return n.message=e("W4","Error fetching systemjs-import map "+t.src)+"\n"+n.message,console.warn(n),"function"==typeof t.onerror&&t.onerror(),"{}"})):t.innerHTML;W=W.then((function(){return r})).then((function(n){!function(t,n,r){var o={};try{o=JSON.parse(n)}catch(s){console.warn(Error(e("W5","systemjs-importmap contains invalid JSON")+"\n\n"+n+"\n"))}i(o,r,t)}(N,n,t.src||g)}))}}))}var g,y="undefined"!=typeof Symbol,b="undefined"!=typeof self,S="undefined"!=typeof document,w=b?self:global;if(S){var O=document.querySelector("base[href]");O&&(g=O.href)}if(!g&&"undefined"!=typeof location){var E=(g=location.href.split("#")[0].split("?")[0]).lastIndexOf("/");-1!==E&&(g=g.slice(0,E+1))}var x,j=/\\/g,P=y&&Symbol.toStringTag,M=y?Symbol():"@",I=a.prototype;I.import=function(e,t,n){var r=this;return t&&"object"==typeof t&&(n=t,t=void 0),Promise.resolve(r.prepareImport()).then((function(){return r.resolve(e,t,n)})).then((function(e){var t=d(r,e,void 0,n);return t.C||p(r,t)}))},I.createContext=function(e){var t=this;return{url:e,resolve:function(n,r){return Promise.resolve(t.resolve(n,r||e))}}},I.onload=function(){},I.register=function(e,t,n){x=[e,t,n]},I.getRegister=function(){var e=x;return x=void 0,e};var L=Object.freeze(Object.create(null));w.System=new a;var C,R,W=Promise.resolve(),N={imports:{},scopes:{},depcache:{},integrity:{}},T=S;if(I.prepareImport=function(e){return(T||e)&&(m(),T=!1),W},I.getImportMap=function(){return JSON.parse(JSON.stringify(N))},S&&(m(),window.addEventListener("DOMContentLoaded",m)),I.addImportMap=function(e,t){i(e,t||g,N)},S){window.addEventListener("error",(function(e){J=e.filename,_=e.error}));var A=location.origin}I.createScript=function(e){var t=document.createElement("script");t.async=!0,e.indexOf(A+"/")&&(t.crossOrigin="anonymous");var n=N.integrity[e];return n&&(t.integrity=n),t.src=e,t};var J,_,k={},U=I.register;I.register=function(e,t){if(S&&"loading"===document.readyState&&"string"!=typeof e){var n=document.querySelectorAll("script[src]"),r=n[n.length-1];if(r){C=e;var i=this;R=setTimeout((function(){k[r.src]=[e,t],i.import(r.src)}))}}else C=void 0;return U.call(this,e,t)},I.instantiate=function(t,n){var r=k[t];if(r)return delete k[t],r;var i=this;return Promise.resolve(I.createScript(t)).then((function(r){return new Promise((function(o,s){r.addEventListener("error",(function(){s(Error(e(3,"Error loading "+t+(n?" from "+n:""))))})),r.addEventListener("load",(function(){if(document.head.removeChild(r),J===t)s(_);else{var e=i.getRegister(t);e&&e[0]===C&&clearTimeout(R),o(e)}})),document.head.appendChild(r)}))}))},I.shouldFetch=function(){return!1},"undefined"!=typeof fetch&&(I.fetch=fetch);var $=I.instantiate,B=/^(text|application)\/(x-)?javascript(;|$)/;I.instantiate=function(t,n,r){var i=this;return this.shouldFetch(t,n,r)?this.fetch(t,{credentials:"same-origin",integrity:N.integrity[t],meta:r}).then((function(r){if(!r.ok)throw Error(e(7,r.status+" "+r.statusText+", loading "+t+(n?" from "+n:"")));var o=r.headers.get("content-type");if(!o||!B.test(o))throw Error(e(4,'Unknown Content-Type "'+o+'", loading '+t+(n?" from "+n:"")));return r.text().then((function(e){return e.indexOf("//# sourceURL=")<0&&(e+="\n//# sourceURL="+t),(0,eval)(e),i.getRegister(t)}))})):$.apply(this,arguments)},I.resolve=function(n,r){return c(N,t(n,r=r||g)||n,r)||function(t,n){throw Error(e(8,"Unable to resolve bare specifier '"+t+(n?"' from "+n:"'")))}(n,r)};var F=I.instantiate;I.instantiate=function(e,t,n){var r=N.depcache[e];if(r)for(var i=0;i<r.length;i++)d(this,this.resolve(r[i],e),e);return F.call(this,e,t,n)},b&&"function"==typeof importScripts&&(I.instantiate=function(e){var t=this;return Promise.resolve().then((function(){return importScripts(e),t.getRegister(e)}))}),function(e){function t(t){return!e.hasOwnProperty(t)||!isNaN(t)&&t<e.length||a&&e[t]&&"undefined"!=typeof window&&e[t].parent===window}var n,r,i,o=e.System.constructor.prototype,s=o.import;o.import=function(o,u,c){return function(){for(var o in n=r=void 0,e)t(o)||(n?r||(r=o):n=o,i=o)}(),s.call(this,o,u,c)};var u=[[],function(){return{}}],c=o.getRegister;o.getRegister=function(){var o=c.call(this);if(o)return o;var s,a=function(o){var s,u,c=0;for(var a in e)if(!t(a)){if(0===c&&a!==n||1===c&&a!==r)return a;s?(i=a,u=o&&u||a):s=a===i,c++}return u}(this.firstGlobalProp);if(!a)return u;try{s=e[a]}catch(f){return u}return[[],function(e){return{execute:function(){e(s),e({default:s,__useDefault:!0})}}}]};var a="undefined"!=typeof navigator&&-1!==navigator.userAgent.indexOf("Trident")}("undefined"!=typeof self?self:global),function(e){var t=e.System.constructor.prototype,r=/^[^#?]+\.(css|html|json|wasm)([?#].*)?$/,i=t.shouldFetch.bind(t);t.shouldFetch=function(e){return i(e)||r.test(e)};var o=/^application\/json(;|$)/,s=/^text\/css(;|$)/,u=/^application\/wasm(;|$)/,c=t.fetch;t.fetch=function(t,r){return c(t,r).then((function(i){if(r.passThrough)return i;if(!i.ok)return i;var c=i.headers.get("content-type");return o.test(c)?i.json().then((function(e){return new Response(new Blob(['System.register([],function(e){return{execute:function(){e("default",'+JSON.stringify(e)+")}}})"],{type:"application/javascript"}))})):s.test(c)?i.text().then((function(e){return e=e.replace(/url\(\s*(?:(["'])((?:\\.|[^\n\\"'])+)\1|((?:\\.|[^\s,"'()\\])+))\s*\)/g,(function(e,r,i,o){return["url(",r,n(i||o,t),r,")"].join("")})),new Response(new Blob(["System.register([],function(e){return{execute:function(){var s=new CSSStyleSheet();s.replaceSync("+JSON.stringify(e)+');e("default",s)}}})'],{type:"application/javascript"}))})):u.test(c)?(WebAssembly.compileStreaming?WebAssembly.compileStreaming(i):i.arrayBuffer().then(WebAssembly.compile)).then((function(n){e.System.wasmModules||(e.System.wasmModules=Object.create(null)),e.System.wasmModules[t]=n;var r=[],i=[];return WebAssembly.Module.imports&&WebAssembly.Module.imports(n).forEach((function(e){var t=JSON.stringify(e.module);-1===r.indexOf(t)&&(r.push(t),i.push("function(m){i["+t+"]=m}"))})),new Response(new Blob(["System.register(["+r.join(",")+"],function(e){var i={};return{setters:["+i.join(",")+"],execute:function(){return WebAssembly.instantiate(System.wasmModules["+JSON.stringify(t)+"],i).then(function(m){e(m.exports)})}}})"],{type:"application/javascript"}))})):i}))}}("undefined"!=typeof self?self:global);var q="undefined"!=typeof Symbol&&Symbol.toStringTag;I.get=function(e){var t=this[M][e];if(t&&null===t.e&&!t.E)return t.er?null:t.n},I.set=function(t,n){try{new URL(t)}catch(s){console.warn(Error(e("W3",'"'+t+'" is not a valid URL to set in the module registry')))}var r;q&&"Module"===n[q]?r=n:(r=Object.assign(Object.create(null),n),q&&Object.defineProperty(r,q,{value:"Module"}));var i=Promise.resolve(r),o=this[M][t]||(this[M][t]={id:t,i:[],h:!1,d:[],e:null,er:void 0,E:void 0});return!o.e&&!o.E&&(Object.assign(o,{n:r,I:void 0,L:void 0,C:i}),r)},I.has=function(e){return!!this[M][e]},I.delete=function(e){var t=this[M],n=t[e];if(!n||n.p&&null!==n.p.e||n.E)return!1;var r=n.i;return n.d&&n.d.forEach((function(e){var t=e.i.indexOf(n);-1!==t&&e.i.splice(t,1)})),delete t[e],function(){var n=t[e];if(!n||!r||null!==n.e||n.E)return!1;r.forEach((function(e){n.i.push(e),e(n.n)})),r=null}};var D="undefined"!=typeof Symbol&&Symbol.iterator;I.entries=function(){var e,t,n=this,r=Object.keys(n[M]),i=0,o={next:function(){for(;void 0!==(t=r[i++])&&void 0===(e=n.get(t)););return{done:void 0===t,value:void 0!==t&&[t,e]}}};return o[D]=function(){return this},o}}();
!function(t){function e(t){t.registerRegistry=Object.create(null),t.namedRegisterAliases=Object.create(null)}var r=t.System;e(r);var i,s,n=r.constructor.prototype,l=r.constructor,a=function(){l.call(this),e(this)};a.prototype=n,r.constructor=a;var o=n.register;n.register=function(t,e,r,n){if("string"!=typeof t)return o.apply(this,arguments);var l=[e,r,n];return this.registerRegistry[t]=l,i||(i=l,s=t),Promise.resolve().then((function(){i=null,s=null})),o.apply(this,[e,r,n])};var u=n.resolve;n.resolve=function(t,e){try{return u.call(this,t,e)}catch(r){if(t in this.registerRegistry)return this.namedRegisterAliases[t]||t;throw r}};var c=n.instantiate;n.instantiate=function(t,e,r){var i=this.registerRegistry[t];return i?(this.registerRegistry[t]=null,i):c.call(this,t,e,r)};var g=n.getRegister;n.getRegister=function(t){var e=g.call(this,t);s&&t&&(this.namedRegisterAliases[s]=t);var r=i||e;return i=null,s=null,r}}("undefined"!=typeof self?self:global);
;(typeof System!='undefined')&&(System=new System.constructor());
System.register("./___monkey.entry.js", [],(function(exports,module){'use strict';return{execute:(function(){exports({A:A$1,C:Cs$1,D:D$1,E:E$1,F:Fi$1,G:G$1,L:Lc,N:N$1,O:O$1,S:dn$1,T:T$1,U:ut,W:Wn$1,X:P,_:kc,a:Vi$1,a3:Pt$1,a4:yo$1,a5:bo$1,a6:mo$1,a7:R$1,a8:Ks,aA:Hc,aB:Ei,aC:Dc,aD:ws$1,aH:Pt,aI:Ga,aJ:Wc,aK:Kt$1,aN:Ji,aO:Ec,aP:wo$1,aS:Os,aV:Kc,aZ:ot,aa:io$1,ab:Rc,ac:Xi$1,ad:jo$1,af:cn$1,ai:Ka,aj:Rt$1,ak:kt$1,al:qt,am:Ft,an:It,b:k$1,b0:Tt,b1:Es$1,b2:Ra,b3:Io$1,b4:Fo$1,b5:Ao$1,b6:ll,b7:po$1,b8:lo$1,b9:os,bB:Ts$1,bC:q$1,bD:Nt$1,bE:Ys,bF:Js,bG:Tc,bH:Mo$1,bK:Qs,bL:oo$1,bM:ro$1,bP:qt$1,bQ:za$1,bS:Jn$1,bT:gi,bW:un$1,bX:Et,ba:ln$1,bb:Bc,bc:Zs,bd:Co$1,be:M,bg:zt$1,bj:vc,bk:fo$1,bl:ul,bn:ho$1,bo:Gc,bp:K$1,bq:I$1,br:ko$1,bs:No$1,bt:yc,bu:bc,bv:xc,bw:st,bx:Ra$1,bz:Ft$1,c:Go,c$:Ti,c4:fc,c5:Xs,c6:lc,c8:Ua,c9:Va,cA:Mc,cC:zc,cH:mo,cJ:Ac,cL:Oc,cT:mi,cU:Tt$1,cW:Nc,cY:Fc,cZ:pi,ca:Wa,cb:Pc,cc:qc,ce:za,cg:Ba,ch:At$1,ci:fr,cm:Dt,cp:_c,cq:jt$1,ct:Nt,cu:uc,cz:Vc,d0:Ja$1,d1:Hs,d2:Ss$1,d3:Uc,d5:L$1,d6:ms$1,d9:qi$1,dA:al,dB:ol,dC:mc,dD:hc,dE:dc,dF:gc,dH:pc,dI:Mt$1,db:Va$1,dc:bs$1,de:As,df:xi,dg:el,dh:il,di:rl,dj:tl,dk:nl,dl:Wa$1,dm:Sc,dn:Go$1,dp:$o$1,dq:Yc,dv:$c,dw:Qc,dx:Xc,dy:Zc,dz:dl,e:Ic,g:Os$1,j:jc,t:Ds$1,w:ks,z:zo});var e=`ruledesk-web.storage`,t=`ruledesk-web.storage.backup`,n=`ruledesk-web.favs`,r=`ruledesk-web.appearance.background`,i=1572864,a=`Background image is too large (max 1.5 MB).`,o=`ruledesk-web-tokens`,s=`ruledesk-web-site-skin`,c=`rdw-skin`,l=`data-rdw-theme`,u=`site`,d=`site-dark`,f=`light`,ee=`dark`,te=`custom`,ne=f,re=`https://rule34.xxx`,ie=`/index.php`,ae=`post`,oe=`list`,se=`view`,ce=`page`,le=`tags`,ue=`favorites`,de=`view`,fe=`delete`,pe=`return_pid`,me=`/public/addfav.php`,he=`/index.php`,ge=`page`,_e=`type`,ve=`post`,ye=`vote`,be=`same-origin`,xe=`include`,Se=`exclude`,Ce=`id:>`,we=`File is not a RuleDesk Web export`,Te=`search`,Ee=`posts`,De=`ruledesk-web-document-style`,Oe=`ruledesk-web-updates-bar`,ke=`theme`,Ae=`dark`,je=`tag_blacklist`,Me=`/css/`,Ne=`desktop.css`,Pe=`desktop-dark.css`,Fe={nameLabel:`Name`,save:`Save`,cancel:`Cancel`,rename:`Rename`,delete:`Delete`,confirmDelete:`Delete this collection?`,confirm:`Confirm`,export:`Export`,import:`Import`,importErrorPrefix:`Import failed:`,enablePageTweaksLabel:`Enable page tweaks`,gridFavButtonsLabel:`Show favorite buttons in grid`,cardFavAddLabel:`Add post to favorites`,cardFavRemoveLabel:`Remove post from favorites`,cardFavGlyph:`★`,cardFavErrorNotLoggedIn:`Log in to use favorites`,cardFavErrorRequest:`Favorite request failed`,artistAdd:`Add`,artistFollow:`Follow`,artistFollowing:`Following`,artistInvalid:`Invalid artist tag.`,artistDuplicate:`Already following this artist.`,playlistChunkSizeLabel:`Collection part size`,seenUpTo:`Seen up to post #`,seenNothing:`Nothing marked as seen yet.`,markAllSeen:`Mark all seen`,goToPageOneToMark:`Go to page 1 to mark everything as seen`,noNewPostsSince:`No new posts since #`,updatesPartialHint:`This search covers only part of your artists. Marking as seen works when all artists are in one search (set “Artists per search” to 0).`,updatesBarMissingHost:`updates empty host not found; updates bar not mounted`},Ie={section:`rdw-section`,list:`rdw-list`,listItem:`rdw-list-item`,itemName:`rdw-item-name`,itemActions:`rdw-item-actions`,primaryButton:`rdw-primary-button`,secondaryButton:`rdw-secondary-button`,form:`rdw-form`,formActions:`rdw-form-actions`,toolbar:`rdw-toolbar`,hint:`rdw-hint`,error:`rdw-error`,confirmRow:`rdw-confirm-row`,thumb:`rdw-thumb`,cardFav:`rdw-card-fav`,cardFavMarked:`rdw-card-fav--marked`,cardFavError:`rdw-card-fav--error`,cardFavPending:`rdw-card-fav--pending`,gridFavsHidden:`rdw-grid-favs-hidden`,artistFollow:`rdw-artist-follow`,artistFollowMarked:`rdw-artist-follow--marked`,updatesBar:`rdw-updates-bar`,updatesBarActions:`rdw-updates-bar-actions`},Le=`filter_ai`,p=`#rdw/`,Re=`collections`,ze=`following`,Be=`settings`,Ve=`stats`,He=[Re,ze,Ve,Be],Ue=`collection`,We=`#rdw-c=`,Ge=`#rdw-dc=`,Ke=`${p}${Re}`,qe=`${p}${ze}`,Je=`${p}${Be}`,Ye=`${p}${Ve}`,Xe=`stats-menu`,Ze=`Statistics in site menu`,Qe=`rdw-stats-menu`,$e=`rdw-own-page`,et=`rdw-page-root`,tt=`rdw-downloads`,nt=`rdw-own-page-style`,rt=`div#header`,it$1=`div#header ul#navbar`,at$1=`current-page`,ot$1={collections:`rdw-nav-collections`,following:`rdw-nav-following`,favorites:`rdw-nav-favorites`,stats:`rdw-nav-stats`,settings:`rdw-nav-settings`},st$1={collections:`Collections`,following:`Following`,favorites:`Favorites`,stats:`Statistics`,settings:`RuleDesk`},ct$1=`my-favorites-container`,ut$1=`rdw-feed-menu`,dt$1={scrollRegion:`rdw-scroll-region`,settingsGroup:`rdw-settings-group`,settingsRow:`rdw-settings-row`,settingsRowSub:`rdw-settings-row--sub`,settingsCaption:`rdw-settings-caption`,pageCard:`rdw-page-card`},ft$1=`No followed artists yet`,pt$1=`Follow artists with the Follow button next to their name in the tag list.`,mt$1=`Filter artists (several: space or comma)`,ht$1=`rdw-feature-`,gt$1=`rdw-feature-choice-`,_t$1=`rdw-updates-group-size`,vt$1=`rdw-playlist-chunk-size`,yt$1=`rdw-artist-filter`,bt$1=`rdw-grid-fav-buttons`,xt$1=`rdw-tweaks-enabled`,St$1=`Collapse tags`,Ct$1=`tag-wiki`,wt$1=`Tag description on “?”`; exports({dd:t,d4:n,bA:r,cf:i,cd:a,aL:c,l:l,u:u,d:d,cP:f,cQ:ee,cO:te,ah:re,x:ie,cw:ae,cr:oe,cx:se,y:ce,ag:le,H:ue,Q:de,bN:fe,bO:pe,bV:me,b$:he,c0:ge,c3:_e,c1:ve,c2:ye,Z:be,c7:xe,bJ:Ce,da:we,a9:Te,cs:Ee,a_:De,bm:Oe,bI:je,bi:Fe,a$:Ie,a1:Le,dG:Re,cv:We,K:Ke,q:qe,J:Je,Y:Ye,cM:Xe,cD:Ze,cE:Qe,bh:$e,by:et,aU:tt,bf:nt,r:rt,i:it$1,v:at$1,o:ot$1,s:st$1,h:ct$1,f:ut$1,bY:dt$1,ds:ft$1,dr:pt$1,dt:mt$1,cV:ht$1,cX:gt$1,cB:_t$1,cy:vt$1,du:yt$1,cK:bt$1,cI:xt$1});function Tt$1(e,t){return e===`tag-groups`?St$1:e===Ct$1?wt$1:t}var Et$1=/[?#]/,Dt$1=1;function Ot$1(e){return He.some(t=>t===e)}function kt$1(e){return typeof e!=`string`}function At$1(e){return kt$1(e)?Re:e}function jt$1(e){return `${p}${Re}/${encodeURIComponent(e)}`}function Mt$1(e){return `${We}${encodeURIComponent(e)}`}function Nt$1(e){return `${Ge}${encodeURIComponent(e)}`}function Pt$1(e){if(!e.startsWith(`#rdw-dc=`))return null;let t=e.slice(8);if(t.length===0)return null;try{return decodeURIComponent(t)}catch{return t}}function Ft$1(e){return kt$1(e)?jt$1(e.collectionId):`${p}${e}`}function It$1(e){return e.split(Et$1)[0]??``}function Lt$1(e){try{return decodeURIComponent(e)}catch{return e}}function Rt$1(e){let t=e.trim();if(t.startsWith(`#rdw-c`)||!t.startsWith(`#rdw/`))return null;let n=t.slice(5).split(`/`),r=It$1(n[0]??``);if(!Ot$1(r))return null;if(r!==`collections`||n.length<=Dt$1)return r;let i=Lt$1(It$1(n[Dt$1]??``));return i.length===0?Re:{kind:Ue,collectionId:i}}function zt$1(){return `
html.${$e} ${rt} ~ *:not(#${et}):not(#${tt}) {
  display: none !important;
}
#${et} {
  display: block;
  box-sizing: border-box;
  width: 100%;
}
/* The space under the header is the page's own (the shell's top padding), so
   that a toolbar right under the header can have the same space above it as
   below it. */
html.${$e} ${rt} {
  margin-bottom: 0 !important;
}
`}var Bt$1=`rdw-thumb`,Vt$1=`rdw-page-favorites`,Ht$1=`--rdw-img`,Ut$1=`--rdw-fav-img`,Wt$1=`rdw-feature-style-`,Gt$1=`rdw-post-actions`; exports({ao:Bt$1,aY:Vt$1,ap:Ht$1,ar:Ut$1,aQ:Gt$1});function Kt$1(e){return `rdw-f-${e}`}function qt$1(e,t){return `rdw-f-${e}-${t}`}var Jt$1=`rdw-video-thumb`,Yt$1=`
  position: absolute;
  left: 6px;
  bottom: 6px;
  z-index: 2;
  padding: 1px 5px;
  border: 1px solid var(--rdw-border);
  border-radius: 4px;
  background: var(--rdw-surface);
  color: var(--rdw-text);
  font: 700 10px/1.4 var(--rdw-font);
  letter-spacing: 0.04em;
  pointer-events: none;`,Xt$1=`rdw-fav-browsing`,Zt$1=`rdw-fav-results`,Qt$1=`favorites-view`,$t$1=`scroll`,en$1=`ai-posts`,tn$1=`hide`,nn$1=`favorites`,m={warn(e,...t){console.warn(`[ruledesk-web] ${e}`,...t);},error(e,...t){console.error(`[ruledesk-web] ${e}`,...t);}},rn$1={thumb:`span.thumb`,thumbLink:`a[href*="s=view"]`,previewImage:`img.preview`,cardFavButton:`button.${Ie.cardFav}`,favoritesDeleteLink:`a[onclick]`,tagSidebar:`ul#tag-sidebar`,tagTypeArtist:`li.tag-type-artist`,tagTypeCharacter:`li.tag-type-character`,tagTypeCopyright:`li.tag-type-copyright`,tagSidebarRow:`ul#tag-sidebar > li[class*="tag-type-"]`,tagCount:`span.tag-count`,imageList:`div.image-list`,commentList:`div#comments div#comment-list`,commentThumb:`div#comments div#comment-list > div.post > div.col1.thumb`,commentTags:`div#comments div#comment-list > div.post > div.col2 > div.header > div.tags`,postListContent:`#post-list div.content`,contentRoot:`#content`,artistFollowButton:`button.${Ie.artistFollow}`,filterAiCheckbox:`input.toggleSwitch#chkFilterAI`,filterAiRow:`li:has(> label > span.switch > input.toggleSwitch#chkFilterAI)`,postPrevSearchLink:`a#prev_search_link`,postNextSearchLink:`a#next_search_link`,pagination:`div.pagination`,paginationLastPage:`div.pagination a[alt="last page"]`,paginationPageLink:`div.pagination > a[href]`,tagsHeadingAfterSearchTools:`#rdw-search-tools + h5`},an$1=/^s(\d+)$/,on$1=/^p(\d+)$/,sn$1=/s=delete&id=(\d+)/; exports({aW:Jt$1,aX:Yt$1,cl:Xt$1,co:Zt$1,ck:Qt$1,cj:$t$1,$:en$1,a2:tn$1,a0:nn$1,m:m,ae:rn$1});function cn$1(e){let t=an$1.exec(e.id);if(t===null)return null;let n=t[1];return n===void 0?null:n}function ln$1(e){let t=e.querySelector(rn$1.thumbLink);if(t===null)return null;let n=on$1.exec(t.id);if(n===null)return null;let r=n[1];return r===void 0?null:r}function un$1(e){let t=e.parentElement;if(t===null)return null;let n=on$1.exec(t.id);if(n===null)return null;let r=n[1];return r===void 0?null:r}function dn$1(e){let t=sn$1.exec(e);if(t===null)return null;let n=t[1];return n===void 0?null:n}var h=exports("bZ",{bg:`--rdw-bg`,surface:`--rdw-surface`,surface2:`--rdw-surface-2`,border:`--rdw-border`,text:`--rdw-text`,muted:`--rdw-muted`,accent:`--rdw-accent`,accentSoft:`--rdw-accent-soft`,danger:`--rdw-danger`,dangerSoft:`--rdw-danger-soft`,warn:`--rdw-warn`,warnSoft:`--rdw-warn-soft`,tagArtist:`--rdw-tag-artist`,tagCharacter:`--rdw-tag-character`,tagCopyright:`--rdw-tag-copyright`,tagMetadata:`--rdw-tag-metadata`,radiusS:`--rdw-radius-s`,radiusM:`--rdw-radius-m`,radiusL:`--rdw-radius-l`,shadow1:`--rdw-shadow-1`,shadow2:`--rdw-shadow-2`,font:`--rdw-font`,segTrack:`--rdw-seg-track`,segText:`--rdw-seg-text`,segOn:`--rdw-seg-on`,segOnText:`--rdw-seg-on-text`,backgroundImage:`--rdw-background-image`,backgroundDim:`--rdw-background-dim`}),fn$1={bg:`#f3f5f7`,surface:`#ffffff`,surface2:`#f4f6f8`,border:`#cfd6dd`,text:`#1c2228`,muted:`#5a6672`,accent:`#2f6fed`,accentSoft:`#e8f0fe`,danger:`#c0392b`,dangerSoft:`#fdecea`,warn:`#6b4e00`,warnSoft:`#fff4d6`,tagArtist:`#b00020`,tagCharacter:`#0a7a2f`,tagCopyright:`#8e24aa`,tagMetadata:`#ff8800`,radiusS:`6px`,radiusM:`8px`,radiusL:`10px`,shadow1:`0 1px 2px rgba(0, 0, 0, 0.06)`,shadow2:`0 8px 24px rgba(0, 0, 0, 0.25)`,font:`system-ui, "Segoe UI", sans-serif`,segTrack:`#c9d1d9`,segText:`#4a5560`,segOn:`#ffffff`,segOnText:`#1c2228`},pn$1={bg:`#16181c`,surface:`#1e2228`,surface2:`#262b33`,border:`#3a424c`,text:`#e8edf2`,muted:`#8a96a3`,accent:`#4c8bf5`,accentSoft:`#1a2f5a`,danger:`#e57373`,dangerSoft:`#3d1f1f`,warn:`#f0d68a`,warnSoft:`#3a3016`,tagArtist:`#ff6b81`,tagCharacter:`#5dcea0`,tagCopyright:`#ce93d8`,tagMetadata:`#ffb74d`,radiusS:`6px`,radiusM:`8px`,radiusL:`10px`,shadow1:`0 1px 2px rgba(0, 0, 0, 0.35)`,shadow2:`0 8px 24px rgba(0, 0, 0, 0.55)`,font:`system-ui, "Segoe UI", sans-serif`,segTrack:`transparent`,segText:`#8a96a3`,segOn:`#3a424c`,segOnText:`#e8edf2`},mn$1=/^#([0-9a-fA-F]{3})$/,hn$1=/^#([0-9a-fA-F]{6})$/,gn$1=.03928,_n$1=12.92,vn$1=2.4,yn$1=.055,bn$1=1.055,xn$1=.2126,Sn$1=.7152,Cn$1=.0722;function wn$1(e){let t=e/255;return t<=gn$1?t/_n$1:((t+yn$1)/bn$1)**vn$1}function Tn$1(e){let t=mn$1.exec(e.trim());if(t!==null){let e=t[1];return e===void 0?null:{r:Number.parseInt(e[0]+e[0],16),g:Number.parseInt(e[1]+e[1],16),b:Number.parseInt(e[2]+e[2],16)}}let n=hn$1.exec(e.trim());if(n!==null){let e=n[1];return e===void 0?null:{r:Number.parseInt(e.slice(0,2),16),g:Number.parseInt(e.slice(2,4),16),b:Number.parseInt(e.slice(4,6),16)}}return null}function En$1(e){let t=Tn$1(e);if(t===null)return null;let n=wn$1(t.r),r=wn$1(t.g),i=wn$1(t.b);return xn$1*n+Sn$1*r+Cn$1*i}var Dn$1=.05,On$1=`#aae5a4`,kn$1=`#89cf81`,An$1=`#98d491`,jn$1=`#000000`,Mn$1=`#000099`,Nn$1=`#4d4d4d`,Pn$1=`#303a30`,Fn$1=`#303030`,In$1=`#505a50`,Ln$1=`#c0c0c0`,Rn$1=`#b0e0b0`,zn$1=`#a8a8a8`,Bn$1=`#1a4d1a`,Vn$1=On$1; exports({b_:On$1,k:kn$1,P:Pn$1,I:In$1,R:Rn$1,B:Bn$1,V:Vn$1});function Hn$1(e,t){let n=En$1(e),r=En$1(t);if(n===null||r===null)return null;let i=Math.max(n,r),a=Math.min(n,r);return (i+Dn$1)/(a+Dn$1)}function Un$1(e,t,n,r){let i=Hn$1(t,e);if(i!==null&&i>=r)return t;for(let t of n){let n=Hn$1(t,e);if(n!==null&&n>=r)return t}return t}function Wn$1(e,t,n=[`#ffffff`]){return Un$1(e,t,n,3)}function Gn$1(e){if(e===void 0)return `light`;let t=En$1(e);return t!==null&&t<.5?`dark`:`light`}function g(e){return e.replace(/</g,`\\3c `)}function Kn$1(e){return [`${h.bg}: ${g(e.bg)};`,`${h.surface}: ${g(e.surface)};`,`${h.surface2}: ${g(e.surface2)};`,`${h.border}: ${g(e.border)};`,`${h.text}: ${g(e.text)};`,`${h.muted}: ${g(e.muted)};`,`${h.accent}: ${g(e.accent)};`,`${h.accentSoft}: ${g(e.accentSoft)};`,`${h.danger}: ${g(e.danger)};`,`${h.dangerSoft}: ${g(e.dangerSoft)};`,`${h.warn}: ${g(e.warn)};`,`${h.warnSoft}: ${g(e.warnSoft)};`,`${h.tagArtist}: ${g(e.tagArtist)};`,`${h.tagCharacter}: ${g(e.tagCharacter)};`,`${h.tagCopyright}: ${g(e.tagCopyright)};`,`${h.tagMetadata}: ${g(e.tagMetadata)};`,`${h.radiusS}: ${g(e.radiusS)};`,`${h.radiusM}: ${g(e.radiusM)};`,`${h.radiusL}: ${g(e.radiusL)};`,`${h.shadow1}: ${g(e.shadow1)};`,`${h.shadow2}: ${g(e.shadow2)};`,`${h.font}: ${g(e.font)};`,`${h.segTrack}: ${g(e.segTrack)};`,`${h.segText}: ${g(e.segText)};`,`${h.segOn}: ${g(e.segOn)};`,`${h.segOnText}: ${g(e.segOnText)};`].join(`
  `)}function qn$1(e,t=`:root`){return `${t} {\n  ${Kn$1(e)}\n}\n`}function Jn$1(e,t){e.style.setProperty(h.bg,t.bg),e.style.setProperty(h.surface,t.surface),e.style.setProperty(h.surface2,t.surface2),e.style.setProperty(h.border,t.border),e.style.setProperty(h.text,t.text),e.style.setProperty(h.muted,t.muted),e.style.setProperty(h.accent,t.accent),e.style.setProperty(h.accentSoft,t.accentSoft),e.style.setProperty(h.danger,t.danger),e.style.setProperty(h.dangerSoft,t.dangerSoft),e.style.setProperty(h.warn,t.warn),e.style.setProperty(h.warnSoft,t.warnSoft),e.style.setProperty(h.tagArtist,t.tagArtist),e.style.setProperty(h.tagCharacter,t.tagCharacter),e.style.setProperty(h.tagCopyright,t.tagCopyright),e.style.setProperty(h.tagMetadata,t.tagMetadata),e.style.setProperty(h.radiusS,t.radiusS),e.style.setProperty(h.radiusM,t.radiusM),e.style.setProperty(h.radiusL,t.radiusL),e.style.setProperty(h.shadow1,t.shadow1),e.style.setProperty(h.shadow2,t.shadow2),e.style.setProperty(h.font,t.font),e.style.setProperty(h.segTrack,t.segTrack),e.style.setProperty(h.segText,t.segText),e.style.setProperty(h.segOn,t.segOn),e.style.setProperty(h.segOnText,t.segOnText);}function Yn$1(e,t){t.backgroundImage!==void 0&&t.backgroundImage.length>0&&e.style.setProperty(h.backgroundImage,`url("${t.backgroundImage.replace(/[\\"]/g,`\\$&`)}")`),t.backgroundDim!==void 0&&e.style.setProperty(h.backgroundDim,String(t.backgroundDim));}function Xn$1(e){e.style.removeProperty(h.accent),e.style.removeProperty(h.bg),e.style.removeProperty(h.surface),e.style.removeProperty(h.text),e.style.removeProperty(h.backgroundImage),e.style.removeProperty(h.backgroundDim);}function Zn$1(e){let t=Object.values(e).filter(e=>typeof e==`number`);return Object.entries(e).filter(([e,n])=>t.indexOf(+e)===-1).map(([e,t])=>t)}function Qn$1(e,t){return typeof t==`bigint`?t.toString():t}var $n$1=class $n{constructor(e){this._getter=e,this._value=void 0;}get value(){let e=this._getter;return e!==void 0&&(this._value=e(),this._getter=void 0),this._value}};function er$1(e){return new $n$1(e)}function tr$1(e){return e==null}function nr$1(e){let t=+!!e.startsWith(`^`),n=e.endsWith(`$`)?e.length-1:e.length;return e.slice(t,n)}function rr$1(e,t,n){Object.defineProperty(e,t,{value:n,writable:true,enumerable:true,configurable:true});}var ir$1=`captureStackTrace`in Error?Error.captureStackTrace:(...e)=>{};function ar$1(e){return typeof e==`object`&&!!e&&!Array.isArray(e)}function or$1(e){if(ar$1(e)===false)return  false;let t=e.constructor;if(t===void 0||typeof t!=`function`)return  true;let n=t.prototype;return ar$1(n)!==false&&Object.prototype.hasOwnProperty.call(n,`isPrototypeOf`)!==false}var sr$1=new Set([`string`,`number`,`symbol`]);function cr$1(e){return e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`)}function lr$1(e,t,n){let r=new e._zod.constr(t??e._zod.def);return (!t||n?.parent)&&(r._zod.parent=e),r}function _(e){let t=e;if(!t)return {};if(typeof t==`string`)return {error:()=>t};if(t?.message!==void 0){if(t?.error!==void 0)throw Error("Cannot specify both `message` and `error` params");t.error=t.message;}return delete t.message,typeof t.error==`string`?{...t,error:()=>t.error}:t}function ur$1(e){return Object.keys(e).filter(t=>e[t]._zod.optin!==void 0&&e[t]._zod.optout===`optional`)}var dr$1={safeint:[-9007199254740991,2**53-1],int32:[-2147483648,2147483647],uint32:[0,4294967295],float32:[-34028234663852886e22,34028234663852886e22],float64:[-Number.MAX_VALUE,Number.MAX_VALUE]};function v$1(e,t=0){if(e.aborted===true)return  true;for(let n=t;n<e.issues.length;n++)if(e.issues[n]?.continue!==true)return  true;return  false}function fr$1(e,t=0){if(e.aborted===true)return  true;for(let n=t;n<e.issues.length;n++)if(e.issues[n]?.continue===false)return  true;return  false}function y$1(e,t){return t.map(t=>{var n;return (n=t).path??(n.path=[]),t.path.unshift(e),t})}function pr$1(e){return typeof e==`string`?e:e?.message}function mr$1(e){let t=[];for(let n of e??[]){let e=n._zod.def;if(!/_(length|size)$|_equals$/.test(e.check))break;let r=e.maximum??e.length??e.size;r>=0&&t.push([r,n]);}return t}function hr$1(e,t,n){var r;for(let i=t;i<e.length;i++)(r=e[i]).schema??(r.schema=n);}function gr$1(e,t,n){var r;let i=e.inst?._zod?.traits;i?.has(`$ZodType`)&&(i.has(`$ZodCheck`)?(r=e).schema??(r.schema=e.inst):e.schema=e.inst);let a=e.schema===e.inst?void 0:e.schema?._zod.def?.error,o=e.message?e.message:pr$1(e.inst?._zod.def?.error?.(e))??pr$1(a?.(e))??pr$1(t?.error?.(e))??pr$1(n.customError?.(e))??pr$1(n.localeError?.(e))??`Invalid input`,s={};for(let t of Object.keys(e))t!==`inst`&&t!==`schema`&&t!==`continue`&&t!==`input`&&t!==`__proto__`&&(s[t]=e[t]);return s.path??=[],s.message=o,t?.reportInput&&(s.input=e.input),s}var _r$1=/[\uD800-\uDBFF]/;function vr$1(e){let t=e.length;if(!_r$1.test(e))return t;let n=t;for(let r=0;r<t-1;r++)(e.charCodeAt(r)&64512)==55296&&(e.charCodeAt(r+1)&64512)==56320&&(n--,r++);return n}function yr$1(e){return Array.isArray(e)?`array`:typeof e==`string`?`string`:`unknown`}function br$1(e,t){for(let n in t){let r=Object.getOwnPropertyDescriptor(t,n);r.get?Object.defineProperty(e,n,{...r,enumerable:false}):Cr$1(e,n,r.value);}}function xr$1(e,t,n,r=true){return Object.defineProperty(e,t,{configurable:true,writable:true,enumerable:r,value:n}),n}function Sr$1(e,t,n){return xr$1(e,t,n,false)}function Cr$1(e,t,n){Object.defineProperty(e,t,{configurable:true,get(){return this==null?n:xr$1(this,t,n.bind(this))},set(e){xr$1(this,t,e);}});}function wr$1(e,t){let n=Object.getPrototypeOf(e);return t in n?void 0:n}var Tr$1,b$1=false,Er$1={configurable:true,get(){b$1=true;}};function x$1(e,t,n){let r=Object.getPrototypeOf(e._zod);t in r&&Tr$1!==e._zod?Tr$1=void 0:(Tr$1=e._zod,Object.defineProperty(r,t,{configurable:true,get(){Object.defineProperty(this,t,Er$1);let e=b$1;b$1=false;try{let r=n(this);return b$1?delete this[t]:Object.defineProperty(this,t,{configurable:!0,writable:!0,value:r}),b$1||=e,r}catch(n){throw delete this[t],b$1||=e,n}},set(e){Object.defineProperty(this,t,{configurable:true,writable:true,value:e});}}));}function Dr$1(e,t,n,r){let i=wr$1(e,t);i&&Object.defineProperty(i,t,{configurable:true,get(){let e={configurable:true,writable:true,enumerable:r,value:void 0};return Object.defineProperty(this,t,e),e.value=n(this),Object.defineProperty(this,t,e),e.value},set(e){Object.defineProperty(this,t,{configurable:true,writable:true,enumerable:r,value:e});}});}var Or$1,kr$1={value:void 0,enumerable:false},Ar$1=`captureStackTrace`in Error?Error:null;function jr$1(e){let t=Ar$1;if(t){let n=t.stackTraceLimit;if(typeof n==`number`){try{t.stackTraceLimit=0;}catch{return Ar$1=null,new e}try{return new e}finally{t.stackTraceLimit=n;}}}return new e}function S$1(e,t,n,r){let i={};function a(e){this.def=e,this.constr=d,this.traits=new Set;}a.prototype=i;let o=n,s=o&&new WeakSet;function c(n,r){if(!n._zod){kr$1.value=new a(r);try{Object.defineProperty(n,"_zod",kr$1);}finally{kr$1.value=void 0;}}else if(n._zod.traits.has(e))return;if(n._zod.traits.add(e),t(n,r),s){let e=Object.getPrototypeOf(n),t=n._zod.constr.prototype,r=e;for(;r&&r!==t;)r=Object.getPrototypeOf(r);let i=r??e;s.has(i)||(s.add(i),br$1(i,o));}let i=d.prototype;for(let e in i)Object.prototype.hasOwnProperty.call(i,e)&&(e in n||(n[e]=i[e].bind(n)));}let l=r?.Parent??Object;class u extends l{}Object.defineProperty(u,"name",{value:e});function d(e){let t=r?.Parent?jr$1(u):this;c(t,e);let n=t._zod.deferred;if(n){for(let e of n)e();t._zod.deferred=void 0;}let i=globalThis.__zod_globalConfig?.postProcessor;return i&&i(t),t}return Object.defineProperty(d,"init",{value:c}),Object.defineProperty(d,Symbol.hasInstance,{value:t=>r?.Parent&&t instanceof r.Parent?true:t?._zod?.traits?.has(e)}),Object.defineProperty(d,"name",{value:e}),d}var Mr$1=class Mr extends Error{constructor(){super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);}};(Or$1=globalThis).__zod_globalConfig??(Or$1.__zod_globalConfig={});var Nr$1=globalThis.__zod_globalConfig;function Pr$1(e){return Nr$1}function Fr$1(){let e=this._zod;return e.message??=JSON.stringify(e.def,Qn$1,2),e.message}function Ir$1(e){this._zod.message=e;}var Lr$1={get:Fr$1,set:Ir$1,enumerable:true,configurable:true},Rr$1={value:void 0,enumerable:false},zr$1=new WeakSet([Object.prototype,Error.prototype]),Br$1=S$1(`$ZodError`,(e,t)=>{e.name=`$ZodError`,Rr$1.value=t,Object.defineProperty(e,"issues",Rr$1),Rr$1.value=void 0,Object.defineProperty(e,"message",Lr$1);let n=Object.getPrototypeOf(e);zr$1.has(n)||(zr$1.add(n),Object.defineProperty(n,"toString",{configurable:true,enumerable:false,get(){let e=()=>this.message;return Object.defineProperty(this,"toString",{value:e,configurable:true,writable:true}),e},set(e){Object.defineProperty(this,"toString",{value:e,configurable:true,writable:true});}}));},void 0,{Parent:Error}),Vr$1=(e=>{let t=(n,r,i,a)=>{let o=i?{...i,async:false}:{async:false},s=n._zod.run({value:r,issues:[]},o);if(s instanceof Promise)throw new Mr$1;if(s.issues.length){let n=new((a?.Err)??e)(s.issues.map(e=>gr$1(e,o,Pr$1())));throw ir$1(n,a?.callee??t),n}return s.value};return t})(Br$1),Hr$1=(e=>{let t=async(n,r,i,a)=>{let o=i?{...i,async:true}:{async:true},s=n._zod.run({value:r,issues:[]},o);if(s instanceof Promise&&(s=await s),s.issues.length){let n=new((a?.Err)??e)(s.issues.map(e=>gr$1(e,o,Pr$1())));throw ir$1(n,a?.callee??t),n}return s.value};return t})(Br$1),Ur$1=(e=>(t,n,r)=>{let i=r?{...r,async:false}:{async:false},a=t._zod.run({value:n,issues:[]},i);if(a instanceof Promise)throw new Mr$1;return a.issues.length?Wr$1(e,a.issues,i):{success:true,data:a.value}})(Br$1);function Wr$1(e,t,n){let r;return {success:false,get error(){return r||(r=new e(t.map(e=>gr$1(e,n,Pr$1()))),t=void 0,n=void 0),r},set error(e){r=e,t=void 0,n=void 0;}}}var Gr$1=(e=>async(t,n,r)=>{let i=r?{...r,async:true}:{async:true},a=t._zod.run({value:n,issues:[]},i);return a instanceof Promise&&(a=await a),a.issues.length?Wr$1(e,a.issues,i):{success:true,data:a.value}})(Br$1),Kr$1=/^[\s\S]{0,}$/,qr$1=/^-?\d+(?:\.\d+)?$/,Jr$1=/^(?:true|false)$/i,Yr$1=S$1(`$ZodCheck`,(e,t)=>{var n;e._zod??={},e._zod.def=t,(n=e._zod).onattach??(n.onattach=[]);}),Xr$1=e=>{let t=e.value;return !tr$1(t)&&t.length!==void 0},Zr$1={number:`number`,bigint:`bigint`,object:`date`},Qr$1=S$1(`$ZodCheckGreaterThan`,(e,t)=>{Yr$1.init(e,t);let n=Zr$1[typeof t.value];e._zod.check=r=>{(t.inclusive?r.value>=t.value:r.value>t.value)||r.issues.push({origin:Zr$1[typeof r.value]??n,code:`too_small`,minimum:typeof t.value==`object`?t.value.getTime():t.value,input:r.value,inclusive:t.inclusive,inst:e,continue:!t.abort});};}),$r$1=S$1(`$ZodCheckNumberFormat`,(e,t)=>{Yr$1.init(e,t),t.format=t.format||`float64`;let n=t.format?.includes(`int`),r=n?`int`:`number`,[i,a]=dr$1[t.format];e._zod.check=o=>{let s=o.value;if(n){if(!Number.isInteger(s)){o.issues.push({expected:r,format:t.format,code:`invalid_type`,continue:false,input:s,inst:e});return}if(!Number.isSafeInteger(s)){s>0?o.issues.push({input:s,code:`too_big`,maximum:2**53-1,note:`Integers must be within the safe integer range.`,inst:e,origin:r,inclusive:true,continue:!t.abort}):o.issues.push({input:s,code:`too_small`,minimum:-9007199254740991,note:`Integers must be within the safe integer range.`,inst:e,origin:r,inclusive:true,continue:!t.abort});return}}s<i&&o.issues.push({origin:`number`,input:s,code:`too_small`,minimum:i,inclusive:true,inst:e,continue:!t.abort}),s>a&&o.issues.push({origin:`number`,input:s,code:`too_big`,maximum:a,inclusive:true,inst:e,continue:!t.abort});};}),ei$1=S$1(`$ZodCheckMinLength`,(e,t)=>{var n;Yr$1.init(e,t),(n=e._zod.def).when??(n.when=Xr$1),e._zod.check=n=>{let r=n.value,i=r.length;if((typeof r==`string`&&i>=t.minimum&&i<t.minimum*2?vr$1(r):i)>=t.minimum)return;let a=yr$1(r);n.issues.push({origin:a,code:`too_small`,minimum:t.minimum,inclusive:true,input:r,inst:e,continue:!t.abort});};}),ti$1={major:4,minor:6,patch:7},C$1=S$1(`$ZodType`,(e,t)=>{var n;e??={},e._zod.def=t,e._zod.bag=e._zod.bag||{},e._zod.version=ti$1;let r=e._zod.def.checks,i=e._zod.traits.has(`$ZodCheck`)?[e,...r??[]]:r?.length?[...r]:[];for(let t of i)for(let n of t._zod.onattach)n(e);if(i.length===0)(n=e._zod).deferred??(n.deferred=[]),e._zod.deferred?.push(()=>{e._zod.run=e._zod.parse;});else {let t=(t,n,r)=>{if(t.memo)return t;let i=v$1(t),a;for(let o of n){if(o._zod.def.when){if(fr$1(t)||!o._zod.def.when(t))continue}else if(i)continue;let n=t.issues.length,s=o._zod.check(t);if(s instanceof Promise&&r?.async===false)throw new Mr$1;if(a||s instanceof Promise)a=(a??Promise.resolve()).then(async()=>{await s,t.issues.length!==n&&(hr$1(t.issues,n,e),i||=v$1(t,n));});else {if(t.issues.length===n)continue;hr$1(t.issues,n,e),i||=v$1(t,n);}}return a?a.then(()=>t):t},n=(n,r,a)=>{if(v$1(n))return n.aborted=true,n;let o=t(r,i,a);if(o instanceof Promise){if(a.async===false)throw new Mr$1;return o.then(t=>e._zod.parse(t,a))}return e._zod.parse(o,a)};e._zod.run=(r,a)=>{if(a.skipChecks)return e._zod.parse(r,a);if(a.direction===`backward`){let t=e._zod.parse({value:r.value,issues:[]},{...a,skipChecks:true});return t instanceof Promise?t.then(e=>n(e,r,a)):n(t,r,a)}let o=e._zod.parse(r,a);if(o instanceof Promise){if(a.async===false)throw new Mr$1;return o.then(e=>t(e,i,a))}return t(o,i,a)};}},{get"~standard"(){return Sr$1(this,`~standard`,ii$1(this))},set"~standard"(e){xr$1(this,`~standard`,e);}}),ni$1=(e,t)=>e.issues.length?{issues:e.issues.map(e=>gr$1(e,t,Pr$1()))}:{value:e.value};async function ri$1(e,t){let n={async:true};return ni$1(await e._zod.run({value:t,issues:[]},n),n)}function ii$1(e){return {validate:t=>{let n={async:false};try{let r=e._zod.run({value:t,issues:[]},n);if(!(r instanceof Promise))return ni$1(r,n)}catch{}return ri$1(e,t)},vendor:`zod`,version:1}}var ai$1=S$1(`$ZodString`,(e,t)=>{C$1.init(e,t),e._zod.pattern=t.pattern??Kr$1,e._zod.parse=(n,r)=>{if(t.coerce)try{n.value=String(n.value);}catch{}return typeof n.value==`string`||n.issues.push({expected:`string`,code:`invalid_type`,input:n.value,inst:e}),n};}),oi$1=S$1(`$ZodNumber`,(e,t)=>{C$1.init(e,t),e._zod.pattern=qr$1,e._zod.parse=(n,r)=>{if(t.coerce)try{n.value=Number(n.value);}catch{}let i=n.value;if(typeof i==`number`&&!Number.isNaN(i)&&Number.isFinite(i))return n;let a=typeof i==`number`?Number.isNaN(i)?`NaN`:Number.isFinite(i)?void 0:String(i):void 0;return n.issues.push({expected:`number`,code:`invalid_type`,input:i,inst:e,...a?{received:a}:{}}),n};}),si$1=S$1(`$ZodNumberFormat`,(e,t)=>{$r$1.init(e,t),oi$1.init(e,t);}),ci$1=S$1(`$ZodBoolean`,(e,t)=>{C$1.init(e,t),e._zod.pattern=Jr$1,e._zod.parse=(n,r)=>{if(t.coerce)try{n.value=!!n.value;}catch{}let i=n.value;return typeof i==`boolean`||n.issues.push({expected:`boolean`,code:`invalid_type`,input:i,inst:e}),n};}),li$1=S$1(`$ZodUnknown`,(e,t)=>{C$1.init(e,t),e._zod.parse=e=>e;});function ui$1(e,t){let n=mr$1(e._zod.def.checks);if(!n.length)return;let r=Math.min(...n.map(e=>e[0])),i=e._zod.parse;e._zod.parse=(n,a)=>{let o=t(n.value);if(o>r&&!a?.skipChecks&&a?.direction!==`backward`){for(let[t,r]of mr$1(e._zod.def.checks))if(o>t&&r._zod.def.when(n)){let t=n.issues.length;return r._zod.check(n),n.issues[t].continue=false,hr$1(n.issues,t,e),n}}return i(n,a)};}var di$1=e=>Array.isArray(e)?e.length:-1;function fi$1(e,t,n){e.issues.length&&t.issues.push(...y$1(n,e.issues)),t.value[n]=e.value;}var pi$1=S$1(`$ZodArray`,(e,t)=>{C$1.init(e,t);let n=Nr$1.memoizer;n?.attach(e),e._zod.parse=(r,i)=>{let a=r.value;if(!Array.isArray(a))return r.issues.push({expected:`array`,code:`invalid_type`,input:a,inst:e}),r;r.value=n?n.alloc(e,r,Array(a.length),i):Array(a.length);let o=[],s=i?.abortEarly;for(let e=0;e<a.length;e++){let n=a[e],c=t.element._zod.run({value:n,issues:[]},i);if(c instanceof Promise)o.push(c.then(t=>fi$1(t,r,e)));else if(fi$1(c,r,e),s&&c.issues.length!==0&&v$1(c))break}return o.length?Promise.all(o).then(()=>r):r},ui$1(e,di$1);});function mi$1(e,t,n,r,i,a){let o=n in r,s=a===`optional`;if(o||!s||i!==`optional`){if(e.issues.length){if(i!==void 0&&s&&!o)return;t.issues.push(...y$1(n,e.issues));}!o&&i===void 0?e.issues.length||t.issues.push({code:`invalid_type`,expected:`nonoptional`,input:void 0,path:[n]}):e.value===void 0?(o||i===`defaulted`&&!s)&&(t.value[n]=void 0):t.value[n]=e.value;}}var hi$1=[];function gi$1(e){let t=Object.keys(e.shape),n=Object.getOwnPropertySymbols(e.shape),r=n.length?n:hi$1,i=r.length?[...t,...r]:t;for(let t of i)if(!e.shape?.[t]?._zod?.traits?.has(`$ZodType`))throw Error(`Invalid element at key "${String(t)}": expected a Zod schema`);let a=ur$1(e.shape);return {...e,allKeys:i,symbolKeys:r,keySet:new Set(t),numKeys:t.length,optionalKeys:new Set(a)}}function _i$1(e,t,n,r,i,a,o){let s=[],c=i.keySet,l=i.catchall._zod,u=l.def.type,d=l.optin,f=l.optout,ee=0;for(let i in t){if(o&&n.issues.length!==ee){if(v$1(n,ee))break;ee=n.issues.length;}if(c.has(i))continue;if(i===`__proto__`){u===`never`&&s.push(i);continue}if(u===`never`){s.push(i);continue}let a=l.run({value:t[i],issues:[]},r);a instanceof Promise?e.push(a.then(e=>mi$1(e,n,i,t,d,f))):mi$1(a,n,i,t,d,f);}return s.length&&n.issues.push({code:`unrecognized_keys`,keys:s,input:t,inst:a,continue:true}),e.length?Promise.all(e).then(()=>n):n}var vi$1=S$1(`$ZodObject`,(e,t)=>{C$1.init(e,t);let n=Object.getOwnPropertyDescriptor(t,`shape`),r=n?.get?n.get.raw:t.shape??{};if(r){let e=()=>{let n={...r};return Object.defineProperty(t,"shape",{value:n}),e.raw=n,n};e.raw=r,Object.defineProperty(t,"shape",{get:e});}let i=er$1(()=>gi$1(t));x$1(e,`propValues`,e=>{let t=e.def.shape,n={};for(let e in t){let r=t[e]._zod;if(r.values){Object.prototype.hasOwnProperty.call(n,e)||rr$1(n,e,new Set);for(let t of r.values)n[e].add(t);r.optin!==void 0&&n[e].add(void 0);}}return n});let a=ar$1,o=t.catchall,s,c=Nr$1.memoizer;c?.attach(e),e._zod.parse=(t,n)=>{s??=i.value;let r=t.value;if(!a(r))return t.issues.push({expected:`object`,code:`invalid_type`,input:r,inst:e}),t;t.value=c?c.alloc(e,t,{},n):{};let l=[],u=s.shape,d=n?.abortEarly,f=t.issues.length;for(let e of s.allKeys){if(d&&t.issues.length!==f){if(v$1(t,f))break;f=t.issues.length;}if(e===`__proto__`)continue;let i=u[e],a=i._zod.optin,o=i._zod.optout,s=i._zod.run({value:r[e],issues:[]},n);s instanceof Promise?l.push(s.then(n=>mi$1(n,t,e,r,a,o))):mi$1(s,t,e,r,a,o);}return o?_i$1(l,r,t,n,i.value,e,d===true):l.length?Promise.all(l).then(()=>t):t};}),yi$1=S$1(`$ZodRecord`,(e,t)=>{C$1.init(e,t);let n=Nr$1.memoizer;n?.attach(e),e._zod.parse=(r,i)=>{let a=r.value;if(!or$1(a))return r.issues.push({expected:`record`,code:`invalid_type`,input:a,inst:e}),r;let o=[],s=t.keyType._zod.values;if(s&&!t.partial){r.value=n?n.alloc(e,r,{},i):{};let c=new Set;for(let n of s)if(typeof n==`string`||typeof n==`number`||typeof n==`symbol`){if(c.add(typeof n==`number`?n.toString():n),n===`__proto__`)continue;let s=t.keyType._zod.run({value:n,issues:[]},i);if(s instanceof Promise)throw Error(`Async schemas not supported in object keys currently`);if(s.issues.length){r.issues.push({code:`invalid_key`,origin:`record`,issues:s.issues.map(e=>gr$1(e,i,Pr$1())),input:n,path:[n],inst:e});continue}let l=s.value;if(l===`__proto__`)continue;let u=t.valueType._zod.run({value:a[n],issues:[]},i);u instanceof Promise?o.push(u.then(e=>{e.issues.length&&r.issues.push(...y$1(n,e.issues)),r.value[l]=e.value;})):(u.issues.length&&r.issues.push(...y$1(n,u.issues)),r.value[l]=u.value);}let l;for(let e in a)if(!c.has(e)){if(t.mode===`loose`){if(e===`__proto__`)continue;r.value[e]=a[e];}else l??=[],l.push(e);}l&&l.length>0&&r.issues.push({code:`unrecognized_keys`,input:a,inst:e,keys:l,continue:true});}else {r.value=n?n.alloc(e,r,{},i):{};let c;for(let n of Reflect.ownKeys(a)){if(n===`__proto__`||!Object.prototype.propertyIsEnumerable.call(a,n))continue;let l=t.keyType._zod.run({value:n,issues:[]},i);if(l instanceof Promise)throw Error(`Async schemas not supported in object keys currently`);if(typeof n==`string`&&qr$1.test(n)&&l.issues.length){let e=t.keyType._zod.run({value:Number(n),issues:[]},i);if(e instanceof Promise)throw Error(`Async schemas not supported in object keys currently`);e.issues.length===0&&(l=e);}if(l.issues.length){t.mode===`loose`?r.value[n]=a[n]:s?(c??=[],c.push(n)):r.issues.push({code:`invalid_key`,origin:`record`,issues:l.issues.map(e=>gr$1(e,i,Pr$1())),input:n,path:[n],inst:e});continue}let u=l.value;if(u===`__proto__`)continue;let d=t.valueType._zod.run({value:a[n],issues:[]},i);d instanceof Promise?o.push(d.then(e=>{e.issues.length&&r.issues.push(...y$1(n,e.issues)),r.value[u]=e.value;})):(d.issues.length&&r.issues.push(...y$1(n,d.issues)),r.value[u]=d.value);}c&&c.length>0&&r.issues.push({code:`unrecognized_keys`,input:a,inst:e,keys:c,continue:true});}return o.length?Promise.all(o).then(()=>r):r};}),bi$1=S$1(`$ZodEnum`,(e,t)=>{C$1.init(e,t);let n=Zn$1(t.entries),r=new Set(n);e._zod.values=r,x$1(e,`pattern`,e=>{let t=Zn$1(e.def.entries).filter(e=>sr$1.has(typeof e));return RegExp(t.length?`^(${t.map(e=>cr$1(e.toString())).join(`|`)})$`:`^[^\\s\\S]$`)}),e._zod.parse=(t,i)=>{let a=t.value;return r.has(a)||t.issues.push({code:`invalid_value`,values:n,input:a,inst:e}),t};}),xi$1=S$1(`$ZodLiteral`,(e,t)=>{C$1.init(e,t);let n=new Set(t.values);e._zod.values=n,x$1(e,`pattern`,e=>{let t=e.def.values;return RegExp(t.length?`^(${t.map(e=>typeof e==`string`?cr$1(e):e?cr$1(e.toString()):String(e)).join(`|`)})$`:`^[^\\s\\S]$`)}),e._zod.parse=(r,i)=>{let a=r.value;return n.has(a)||r.issues.push({code:`invalid_value`,values:t.values,input:a,inst:e}),r};});function Si$1(e,t){return e.value=t.issues.length?void 0:t.value,e}var Ci$1=S$1(`$ZodOptional`,(e,t)=>{C$1.init(e,t),x$1(e,`optin`,e=>e.def.innerType._zod.optin===`defaulted`?`defaulted`:`optional`),e._zod.optout=`optional`,x$1(e,`values`,e=>{let t=e.def.innerType._zod.values;return t?new Set([...t,void 0]):void 0}),x$1(e,`pattern`,e=>{let t=e.def.innerType._zod.pattern;return t?RegExp(`^(${nr$1(t.source)})?$`):void 0}),e._zod.parse=(e,n)=>{if(e.value===void 0){if(t.innerType._zod.optin!==`defaulted`)return e;let r=t.innerType._zod.run({value:e.value,issues:[]},n);return r instanceof Promise?r.then(t=>Si$1(e,t)):Si$1(e,r)}return t.innerType._zod.run(e,n)};}),wi$1=S$1(`$ZodNullable`,(e,t)=>{C$1.init(e,t),x$1(e,`optin`,e=>e.def.innerType._zod.optin),x$1(e,`optout`,e=>e.def.innerType._zod.optout),x$1(e,`pattern`,e=>{let t=e.def.innerType._zod.pattern;return t?RegExp(`^(${nr$1(t.source)}|null)$`):void 0}),x$1(e,`values`,e=>e.def.innerType._zod.values?new Set([...e.def.innerType._zod.values,null]):void 0),e._zod.parse=(e,n)=>e.value===null?e:t.innerType._zod.run(e,n);});function Ti$1(e){return e.checks&&=[...e.checks],e}function Ei$1(e,t){return new e(Ti$1({type:`string`,..._(t)}))}function Di$1(e,t){return new e(Ti$1({type:`number`,checks:[],..._(t)}))}function Oi$1(e,t){return new e({type:`number`,check:`number_format`,abort:false,format:`safeint`,..._(t)})}function ki$1(e,t){return new e({type:`boolean`,..._(t)})}function Ai$1(e){return new e({type:`unknown`})}function ji$1(e,t){return new Qr$1({check:`greater_than`,..._(t),value:e,inclusive:false})}function Mi$1(e,t){return new Qr$1({check:`greater_than`,..._(t),value:e,inclusive:true})}function Ni$1(e){return ji$1(0,e)}function Pi$1(e){return Mi$1(0,e)}function Fi$1(e,t){return new ei$1({check:`min_length`,..._(t),minimum:e})}var w$1=S$1(`ZodMiniType`,(e,t)=>{if(!e._zod)throw Error(`Uninitialized schema in ZodMiniType.`);C$1.init(e,t),e.def=t,e.type=t.type;},{get with(){return this.check},set with(e){xr$1(this,`with`,e);},parse(e,t){return Vr$1(this,e,t,{callee:this.parse})},parseAsync(e,t){return Hr$1(this,e,t,{callee:this.parseAsync})},safeParse(e,t){return Ur$1(this,e,t)},safeParseAsync(e,t){return Gr$1(this,e,t)},check(...e){let t=this.def;return this.clone({...t,checks:[...t.checks??[],...e.map(e=>typeof e==`function`?{_zod:{check:e,def:{check:`custom`},onattach:[]}}:e)]},{parent:true})},clone(e,t){return lr$1(this,e,t)},brand(){return this},register(e,t){return e.add(this,t),this},apply(e,...t){return t.length===0?e(this):e(this,...t)}}),Ii$1=S$1(`ZodMiniString`,(e,t)=>{ai$1.init(e,t),w$1.init(e,t);});function T$1(e){return Ei$1(Ii$1,e)}var Li$1=S$1(`ZodMiniNumber`,(e,t)=>{oi$1.init(e,t),w$1.init(e,t);});function E$1(e){return Di$1(Li$1,e)}var Ri$1=S$1(`ZodMiniNumberFormat`,(e,t)=>{si$1.init(e,t),Li$1.init(e,t);});function D$1(e){return Oi$1(Ri$1,e)}var zi$1=S$1(`ZodMiniBoolean`,(e,t)=>{ci$1.init(e,t),w$1.init(e,t);});function O$1(e){return ki$1(zi$1,e)}var Bi$1=S$1(`ZodMiniUnknown`,(e,t)=>{li$1.init(e,t),w$1.init(e,t);});function Vi$1(){return Ai$1(Bi$1)}var Hi$1=S$1(`ZodMiniArray`,(e,t)=>{pi$1.init(e,t),w$1.init(e,t);});function k$1(e,t){return new Hi$1({type:`array`,element:e,..._(t)})}var Ui$1=S$1(`ZodMiniObject`,(e,t)=>{vi$1.init(e,t),w$1.init(e,t),Dr$1(e,`shape`,e=>e._zod.def.shape,false);});function A$1(e,t){return new Ui$1({type:`object`,shape:e??{},..._(t)})}var Wi$1=S$1(`ZodMiniRecord`,(e,t)=>{yi$1.init(e,t),w$1.init(e,t);});function j$1(e,t,n){return !t||!t._zod?new Wi$1({type:`record`,keyType:T$1(),valueType:e,..._(t)}):new Wi$1({type:`record`,keyType:e,valueType:t,..._(n)})}var Gi$1=S$1(`ZodMiniEnum`,(e,t)=>{bi$1.init(e,t),w$1.init(e,t),e.options=[...e._zod.values];});function M$1(e,t){return new Gi$1({type:`enum`,entries:Array.isArray(e)?Object.fromEntries(e.map(e=>[e,e])):e,..._(t)})}var Ki$1=S$1(`ZodMiniLiteral`,(e,t)=>{xi$1.init(e,t),w$1.init(e,t);});function qi$1(e,t){return new Ki$1({type:`literal`,values:Array.isArray(e)?e:[e],..._(t)})}var Ji$1=S$1(`ZodMiniOptional`,(e,t)=>{Ci$1.init(e,t),w$1.init(e,t);});function N$1(e){return new Ji$1({type:`optional`,innerType:e})}var Yi$1=S$1(`ZodMiniNullable`,(e,t)=>{wi$1.init(e,t),w$1.init(e,t);});function Xi$1(e){return new Yi$1({type:`nullable`,innerType:e})}var Zi$1=M$1([xe,Se]),Qi$1=M$1([Te,Ee]),$i$1=A$1({tag:T$1().check(Fi$1(1)),type:Zi$1}),ea$1=A$1({value:D$1(),exact:O$1()}),P$1=A$1({id:T$1().check(Fi$1(1)),name:T$1().check(Fi$1(1)),tags:k$1($i$1),kind:N$1(Qi$1),postIds:N$1(k$1(D$1())),thumbs:N$1(j$1(T$1(),T$1())),shuffledOrder:N$1(Xi$1(k$1(D$1()))),query:N$1(T$1()),cover:N$1(k$1(T$1())),postCount:N$1(ea$1),openedPostId:N$1(D$1()),newestPostId:N$1(D$1()),group:N$1(T$1())}),ta$1=`artist`,na$1=`character`,ra$1=`copyright`,ia$1=M$1([ta$1,na$1,ra$1]),aa$1=A$1({tag:T$1().check(Fi$1(1)),kind:N$1(ia$1),group:N$1(T$1()),addedAt:N$1(E$1()),cover:N$1(k$1(T$1())),postCount:N$1(ea$1),lastPostId:N$1(D$1()),lastPostSince:N$1(E$1())}),oa$1=A$1({fav:N$1(O$1()),seen:N$1(O$1())}),sa$1=M$1([u,d,f,ee,te]),ca$1=`light`,la$1=`dark`,ua$1=M$1([ca$1,la$1]),da$1=A$1({base:ua$1,backgroundImage:N$1(T$1()),backgroundDim:N$1(E$1())}),fa$1=A$1({base:N$1(ua$1),accent:N$1(T$1()),bg:N$1(T$1()),surface:N$1(T$1()),text:N$1(T$1()),backgroundImage:N$1(T$1()),backgroundDim:N$1(E$1())}),pa$1=A$1({theme:sa$1,custom:N$1(da$1)}),ma$1=A$1({theme:sa$1,custom:N$1(fa$1)}),ha$1=`video-player`,ga$1=`fit-height`,_a$1=`fit-width`,va$1=`original`,ya$1=ga$1,ba$1=M$1([ga$1,_a$1,va$1]),xa$1=A$1({volume:N$1(E$1()),muted:N$1(O$1()),playbackRate:N$1(E$1())}),Sa$1=A$1({gridFavButtons:O$1(),updatesGroupSize:N$1(D$1().check(Pi$1())),playlistChunkSize:N$1(D$1().check(Ni$1())),tweaksEnabled:N$1(O$1()),features:N$1(j$1(T$1(),O$1())),featureChoice:N$1(j$1(T$1(),T$1())),featureState:N$1(j$1(T$1(),Vi$1())),appearance:N$1(ma$1)}),Ca$1=A$1({seenPostId:D$1().check(Pi$1())}),F$1=A$1({version:qi$1(1),collections:k$1(P$1),artists:k$1(aa$1),marks:j$1(T$1(),oa$1),settings:N$1(Sa$1),updates:N$1(Ca$1)}),wa$1=`panel`,Ta$1=`width`,Ea$1=`height`,Da$1=`grid-density`,Oa$1=`default`,ka$1=`masonry`,Aa$1=`post-actions`,ja$1=A$1({tabId:T$1().check(Fi$1(1)),beatAt:E$1()}),Ma$1=`incremental`,Na$1=`full`,Pa$1=M$1([Ma$1,Na$1]),Fa$1=A$1({nextPid:D$1(),lastPid:D$1(),startedAt:T$1(),finishedAt:N$1(T$1()),running:N$1(O$1()),userId:N$1(D$1()),lock:N$1(ja$1),mode:N$1(Pa$1)}),Ia$1=A$1({version:qi$1(1),ids:k$1(D$1()),sync:N$1(Fa$1)}); exports({aE:ta$1,aF:na$1,aG:ra$1,c_:sa$1,cR:ca$1,cS:la$1,ax:ha$1,au:ga$1,av:_a$1,aw:va$1,at:ya$1,d7:F$1,M:Ma$1,p:Na$1,d8:Ia$1});function La$1(){return {volume:1,muted:false,playbackRate:1}}function Ra$1(e){let t=xa$1.safeParse(e);if(!t.success)return La$1();let n=La$1(),r=t.data.volume,i=t.data.muted,a=t.data.playbackRate;return {volume:r!==void 0&&Number.isFinite(r)?Math.min(1,Math.max(0,r)):n.volume,muted:i??n.muted,playbackRate:a!==void 0&&Number.isFinite(a)&&a>0?a:n.playbackRate}}function za$1(e){let t=ba$1.safeParse(e);return t.success?t.data:ya$1}function Ba$1(e){return typeof e==`object`&&!!e&&!Array.isArray(e)}function Va$1(e){let t=e.settings?.featureState;if(t===void 0)return {data:e,changed:false};let n=t[wa$1];if(!Ba$1(n))return {data:e,changed:false};let r=Object.prototype.hasOwnProperty.call(n,Ta$1),i=Object.prototype.hasOwnProperty.call(n,Ea$1);if(!r&&!i)return {data:e,changed:false};let a={};for(let[e,t]of Object.entries(n))e!==`width`&&e!==`height`&&(a[e]=t);let o={...t};Object.keys(a).length===0?delete o[wa$1]:o[wa$1]=a;let s=e.settings===void 0?{gridFavButtons:true}:{...e.settings};return Object.keys(o).length===0?delete s.featureState:s.featureState=o,{data:{...e,settings:s},changed:true}}function Ha$1(e){let t=e.settings?.featureChoice;if(t===void 0)return {data:e,changed:false};let n={...t},r=false;if(n[Da$1]===ka$1&&(n[Da$1]=Oa$1,r=true),Object.prototype.hasOwnProperty.call(n,Aa$1)&&(delete n[Aa$1],r=true),!r)return {data:e,changed:false};let i=e.settings===void 0?{gridFavButtons:true}:{...e.settings};return Object.keys(n).length===0?delete i.featureChoice:i.featureChoice=n,{data:{...e,settings:i},changed:true}}function I$1(e){return e.kind===Ee}function Ua$1(e){let t=false,n=[];for(let r of e.collections){if(!I$1(r)){n.push(r);continue}let e=r.thumbs===void 0,i=r.shuffledOrder===void 0;if(!e&&!i){n.push(r);continue}t=true;let a={...r};e&&(a.thumbs={}),i&&(a.shuffledOrder=null),n.push(a);}return t?{data:{...e,collections:n},changed:true}:{data:e,changed:false}}function Wa$1(e){return e.kind??`search`}function L$1(){return {version:1,ids:[]}}function Ga$1(){return {theme:ne}}function Ka$1(e){let t={base:e.base===`light`||e.base===`dark`?e.base:Gn$1(e.bg)};return e.backgroundImage!==void 0&&(t.backgroundImage=e.backgroundImage),e.backgroundDim!==void 0&&(t.backgroundDim=e.backgroundDim),t}function qa$1(e){return e.custom===void 0?{theme:e.theme}:{theme:e.theme,custom:Ka$1(e.custom)}}function Ja$1(){return {version:1,collections:[],artists:[],marks:{},settings:{gridFavButtons:true,updatesGroupSize:0,tweaksEnabled:true,appearance:Ga$1()},updates:{seenPostId:0}}}function Ya$1(e){let t=e.settings?.appearance;return t===void 0?Ga$1():qa$1(t)}function Xa$1(e){return e.settings?.gridFavButtons??true}function Za$1(e){return e.settings?.tweaksEnabled??true}function Qa$1(e){return e.settings?.updatesGroupSize??0}function $a$1(e){return e.settings?.playlistChunkSize??40}function eo$1(e){return e.updates?.seenPostId??0}var to$1=/^id:>(\d+)$/,no$1=/^id:(\d+)$/;function R$1(e){let t=e.trim().toLowerCase();if(t.length===0)return null;let n=t.replaceAll(` `,`_`);return /\s/.test(n)||n===`(`||n===`)`||n===`~`||n.startsWith(`-`)||n.length===0?null:n}function ro$1(e){return e.trim().split(/\s+/).filter(e=>e.length>0).map(e=>e.startsWith(`-`)&&e.length>1?{tag:e.slice(1),type:Se}:{tag:e,type:xe})}function io$1(e){return e.map(e=>e.type===`exclude`?`-${e.tag}`:e.tag).join(` `)}function ao$1(e){return encodeURIComponent(e).replaceAll(`(`,`%28`).replaceAll(`)`,`%29`)}function oo$1(e){let t=e.map(e=>ao$1(e.type===`exclude`?`-${e.tag}`:e.tag)).join(`+`),n=new URLSearchParams;return n.set(ce,ae),n.set(`s`,oe),`${re}${ie}?${n.toString()}&${le}=${t}`}function so$1(e){if(e.length===1){let t=e[0];return t===void 0?``:t}return `( ${e.join(` ~ `)} )`}function co$1(e,t,n){let r=[];for(let t of e){let e=R$1(t);e!==null&&r.push(e);}if(r.length===0)return [];let i=[];if(n<=0)i.push(r);else for(let e=0;e<r.length;e+=n)i.push(r.slice(e,e+n));return i.map(e=>{let n=so$1(e);return n})}function lo$1(e){return oo$1(ro$1(e))}function uo$1(e,t){let n=co$1(e,0,t)[0];return n===void 0?``:n}function fo$1(e,t){let n=uo$1(e,t);return n.length===0?oo$1([]):lo$1(n)}function po$1(e,t){return co$1(e,0,t)}function mo$1(e,t,n){let r=po$1(t,n);if(r.length<2)return  -1;let i=e.trim();return i.length===0?-1:r.findIndex(e=>No$1(i,e))}function ho$1(e){let t=e.trim().split(/\s+/).filter(e=>e.length>0);if(t.length===0)return ``;let n=t[t.length-1];return n!==void 0&&to$1.test(n)?t.slice(0,-1).join(` `):t.join(` `)}function go$1(e){let t=new Set;for(let n of e){let e=R$1(n);e!==null&&t.add(e);}return t}function _o$1(e,t){if(t.size===0)return null;let n=e.trim().split(/\s+/).filter(e=>e.length>0);if(n.length===0)return null;let r=n,i=false,a=n[n.length-1];if(a!==void 0&&to$1.test(a)&&(r=n.slice(0,-1),i=true),r.some(e=>to$1.test(e))||r.length===0)return null;let o=[];if(r.length===1){let e=r[0];if(e===void 0)return null;let n=R$1(e);return n===null||!t.has(n)?null:(o.push(n),{tags:o,hasIdFilter:i})}let s=r[0],c=r[r.length-1];if(s!==`(`||c!==`)`)return null;let l=r.slice(1,-1);if(l.length===0||l.length%2==0)return null;for(let e=0;e<l.length;e+=1){let n=l[e];if(n===void 0)return null;if(e%2==1){if(n!==`~`)return null;continue}let r=R$1(n);if(r===null||!t.has(r)||o.includes(r))return null;o.push(r);}return {tags:o,hasIdFilter:i}}function vo$1(e,t){if(e.length!==t.size)return  false;for(let n of e)if(!t.has(n))return  false;return  true}function yo$1(e,t){let n=go$1(t),r=_o$1(e,n);return r!==null&&vo$1(r.tags,n)}function bo$1(e,t){let n=go$1(t),r=_o$1(e,n);return r===null||!r.hasIdFilter||vo$1(r.tags,n)?false:r.tags.length>0&&r.tags.length<n.size}function xo$1(e){return `id:${String(e)}`}function So$1(e){if(e.length===1){let t=e[0];return t===void 0?``:xo$1(t)}return `( ${e.map(xo$1).join(` ~ `)} )`}function Co$1(e,t){let n=new Set;for(let t of e){if(!Number.isFinite(t))continue;let e=Math.trunc(t);e>=0&&n.add(e);}let r=Array.from(n).sort((e,t)=>t-e);if(r.length===0)return [];let i=[];if(t<=0)i.push(r);else for(let e=0;e<r.length;e+=t)i.push(r.slice(e,e+t));return i.map(So$1)}function wo$1(e){let t=e.trim().split(/\s+/).filter(e=>e.length>0);if(t.length===0)return null;if(t.length===1){let e=t[0];if(e===void 0)return null;let n=no$1.exec(e);if(n===null)return null;let r=Number(n[1]);return Number.isFinite(r)?[r]:null}let n=t[0],r=t[t.length-1];if(n!==`(`||r!==`)`)return null;let i=t.slice(1,-1);if(i.length===0||i.length%2==0)return null;let a=[];for(let e=0;e<i.length;e+=1){let t=i[e];if(t===void 0)return null;if(e%2==1){if(t!==`~`)return null;continue}let n=no$1.exec(t);if(n===null)return null;let r=Number(n[1]);if(!Number.isFinite(r)||a.includes(r))return null;a.push(r);}return a}var To$1=`sort:random`,Eo$1=/\s+/;function Do$1(e){return e.trim().split(Eo$1).filter(e=>e.length>0)}function Oo$1(e){let t=new Map;for(let n of Do$1(e))n!==`sort:random`&&t.set(n,(t.get(n)??0)+1);return t}function ko$1(e){let t=jo$1(e);return t.length===0||t===`all`}function Ao$1(e){return Do$1(e).includes(To$1)}function jo$1(e){return Do$1(e).filter(e=>e!==To$1).join(` `)}function Mo$1(e){let t=Do$1(e);return t.includes(`sort:random`)||t.push(To$1),t.join(` `)}function No$1(e,t){let n=Oo$1(e),r=Oo$1(t);if(n.size!==r.size)return  false;for(let[e,t]of n)if(r.get(e)!==t)return  false;return  true}var Po$1=`ruledesk-web.artists-mirror`;function Fo$1(e){try{localStorage.setItem(Po$1,JSON.stringify([...e]));}catch(e){m.error(`artists-mirror: write failed`,e);}}function Io$1(){try{let e=localStorage.getItem(Po$1);if(e===null)return null;let t=JSON.parse(e);if(!Array.isArray(t))return null;for(let e of t)if(typeof e!=`string`)return null;return t}catch(e){return m.error(`artists-mirror: read failed`,e),null}}var Lo$1=`ruledesk-web.covers-mirror`,Ro$1=j$1(T$1(),k$1(T$1())),zo$1=null,Bo$1={},Vo$1=null,Ho$1={};function Uo$1(){try{let e=localStorage.getItem(Lo$1);if(e===null)return {};if(e===zo$1)return Bo$1;let t=Ro$1.safeParse(JSON.parse(e));return zo$1=e,Bo$1=t.success?t.data:{},Bo$1}catch(e){return m.error(`cover-mirror: read failed`,e),{}}}function Wo$1(e){try{localStorage.setItem(Lo$1,JSON.stringify(e));}catch(e){m.error(`cover-mirror: write failed`,e);}}function Go$1(e){let t=Uo$1(),n=Object.hasOwn(t,e)?t[e]:void 0;return n===void 0?null:n}function Ko$1(e,t,n){let r=Uo$1(),i={};for(let e of n){let t=Object.hasOwn(r,e)?r[e]:void 0;t!==void 0&&(i[e]=t);}i[e]=[...t],Wo$1(i);}function qo$1(e){let t=Uo$1();if(!Object.hasOwn(t,e))return;let n={};for(let[r,i]of Object.entries(t))r!==e&&(n[r]=i);Wo$1(n);}var Jo$1=`ruledesk-web.counts-mirror`,Yo$1=A$1({value:D$1(),exact:O$1()}),Xo$1=j$1(T$1(),Yo$1);function Zo$1(){try{let e=localStorage.getItem(Jo$1);if(e===null)return {};if(e===Vo$1)return Ho$1;let t=Xo$1.safeParse(JSON.parse(e));return Vo$1=e,Ho$1=t.success?t.data:{},Ho$1}catch(e){return m.error(`count-mirror: read failed`,e),{}}}function Qo$1(e){try{localStorage.setItem(Jo$1,JSON.stringify(e));}catch(e){m.error(`count-mirror: write failed`,e);}}function $o$1(e){let t=Zo$1(),n=Object.hasOwn(t,e)?t[e]:void 0;return n===void 0?null:n}function es$1(e,t,n){let r=Zo$1(),i={};for(let e of n){let t=Object.hasOwn(r,e)?r[e]:void 0;t!==void 0&&(i[e]=t);}i[e]={value:t.value,exact:t.exact},Qo$1(i);}function ts$1(e){let t=Zo$1();if(!Object.hasOwn(t,e))return;let n={};for(let[r,i]of Object.entries(t))r!==e&&(n[r]=i);Qo$1(n);}var ns$1=2e4,rs$1=.1;function is$1(e=ns$1){return e+Math.floor(e*rs$1)}function as$1(e){let t=Number(e);return Number.isFinite(t)?Math.trunc(t):-1/0}function os$1(e,t=ns$1){let n=Object.entries(e),r=is$1(t);if(n.length<=r)return {marks:e,pruned:false};let i=[...n].sort((e,t)=>as$1(t[0])-as$1(e[0])),a={};for(let[e,n]of i.slice(0,t))a[e]=n;return {marks:a,pruned:true}}var z$1=null,B$1,ss$1=false;function cs$1(){return GM_getValue}function ls$1(){return GM_setValue}function us$1(e){return typeof e==`object`&&!!e&&!Array.isArray(e)}function ds$1(e){return typeof e==`number`&&Number.isInteger(e)}function fs$1(e){return Array.isArray(e)&&e.every(ds$1)}function ps$1(e){if(!us$1(e)||e.version!==1||!fs$1(e.ids))return null;let t={version:1,ids:e.ids};if(e.sync!==void 0){let n=Fa$1.safeParse(e.sync);n.success&&(t.sync=n.data);}return t}function ms$1(e){let t=Ia$1.safeParse(e);return t.success?t.data:null}function V$1(e){if(typeof e==`number`)return Number.isFinite(e)?Math.trunc(e):null;let t=e.trim();if(t.length===0)return null;let n=Number(t);return Number.isFinite(n)?Math.trunc(n):null}function hs$1(){let e=cs$1()(n,void 0);if(e==null)return L$1();let t=ps$1(e);return t===null?(m.error(`Invalid favs storage content; using empty favs`,{key:n}),L$1()):t}function gs$1(e){ls$1()(n,e);}function _s$1(e){z$1=new Set(e.ids),B$1=e.sync,ss$1=true;}function vs$1(){let t=cs$1()(e,void 0);if(t==null)return null;let n=F$1.safeParse(t);return n.success?n.data:null}function ys$1(t){let n=os$1(t.marks),r=n.pruned?{...t,marks:n.marks}:t;ls$1()(e,F$1.parse(r));}function bs$1(e){let t=e??vs$1(),r=cs$1()(n,void 0),i=r==null?L$1():ps$1(r),a=i??L$1();i===null&&r!=null&&m.error(`Invalid favs storage content; using empty favs`,{key:n});let o=new Set(a.ids),s=false,c=null;if(t!==null){let e={};for(let[n,r]of Object.entries(t.marks)){let t={};if(r.seen===true&&(t.seen=true),r.fav===true){let e=V$1(n);e!==null&&o.add(e),s=true;}else r.fav!==void 0&&(s=true);Object.keys(t).length>0?e[n]=t:r.fav===void 0&&r.seen===void 0&&(e[n]={});}let n=t;s&&(n={...t,marks:e});let r=Va$1(n),i=Ha$1(r.data);(s||r.changed||i.changed)&&(c=i.data);}c!==null&&ys$1(c);let l={version:a.version,ids:Array.from(o)};a.sync!==void 0&&(l.sync=a.sync);let u=new Set(a.ids);if(l.ids.length!==a.ids.length||l.ids.some(e=>!u.has(e))){let e=ms$1(l);if(e===null)m.error(`migrateMarksFavToFavs: strict favs validate failed; skipping write`,{key:n});else return gs$1(e),_s$1(e),c!==null}return _s$1(l),c!==null}function H$1(){return ss$1&&z$1!==null?z$1:(bs$1(),z$1===null&&_s$1(hs$1()),z$1??new Set)}function xs$1(e){let t={version:L$1().version,ids:Array.from(e)};B$1!==void 0&&(t.sync=B$1),gs$1(t),z$1=e,ss$1=true;}function Ss$1(){z$1=null,B$1=void 0,ss$1=false;}function Cs$1(){return H$1()}function ws$1(e){let t=V$1(e);return t!==null&&H$1().has(t)}function Ts$1(e){let t=V$1(e);if(t===null)return;let n=new Set(H$1());n.has(t)?z$1=n:(n.add(t),xs$1(n));}function Es$1(e){let t=V$1(e);if(t===null)return;let n=new Set(H$1());n.has(t)?(n.delete(t),xs$1(n)):z$1=n;}function Ds$1(e){if(e.length===0){H$1();return}let t=new Set(H$1()),n=false;for(let r of e){let e=V$1(r);e!==null&&(t.has(e)||(t.add(e),n=true));}n?xs$1(t):z$1=t;}function Os$1(){return H$1(),B$1}function ks(e){let t=H$1();B$1=e;let n={version:L$1().version,ids:Array.from(t)};e!==void 0&&(n.sync=e),gs$1(n),ss$1=true;}function As(e){let t=[],n={};for(let[r,i]of Object.entries(e)){if(i.fav===true){let e=V$1(r);e!==null&&t.push(e);}let e={};i.seen===true&&(e.seen=true),Object.keys(e).length>0&&(n[r]=e);}return {marks:n,favIds:t}}var js=null,Ms=false,Ns=0,Ps=1e3;function Fs(){return GM_getValue}function Is(){return GM_setValue}function Ls(){return Fs()(e,void 0)}function Rs(t){Is()(e,t);}function zs(e){js=e,Ms=true,Ns=Date.now();}function Bs(e){Fo$1(e.artists.map(e=>e.tag));}function Vs(e){Io$1()===null&&Bs(e);}function Hs(){js=null,Ms=false,Ns=0;}function Us(){let e=Ls();if(e==null){bs$1();let e=Ja$1();return Vs(e),e}let t=F$1.safeParse(e);if(!t.success){Gs(e),bs$1();let t=Ja$1();return Vs(t),t}if(!bs$1(t.data))return Vs(t.data),Ws(t.data);let n=Ls();if(n==null){let e=Ja$1();return Vs(e),e}let r=F$1.safeParse(n);return r.success?(Vs(r.data),Ws(r.data)):(Vs(t.data),Ws(t.data))}function Ws(e){let t=Ua$1(e);if(!t.changed)return e;let n=F$1.parse(t.data);return Rs(n),n}function Gs(n){Is()(t,n),m.error(`Invalid storage content backed up`,{key:e,backupKey:t});}function U$1(e){let t={gridFavButtons:Xa$1(e),updatesGroupSize:Qa$1(e),playlistChunkSize:$a$1(e),tweaksEnabled:Za$1(e)};return e.settings?.features!==void 0&&(t.features={...e.settings.features}),e.settings?.featureChoice!==void 0&&(t.featureChoice={...e.settings.featureChoice}),e.settings?.featureState!==void 0&&(t.featureState={...e.settings.featureState}),e.settings?.appearance!==void 0&&(t.appearance=e.settings.appearance),t}function W$1(e){if(!Number.isFinite(e))return null;let t=Math.trunc(e);return t<0?null:t}function G$1(){if(Ms&&js!==null)return js;let e=Us();return zs(e),e}function K$1(){return Hs(),G$1()}function Ks(){return Ms&&js!==null&&Date.now()-Ns<Ps?js:K$1()}function qs(e){for(let t of Object.values(e))if(t.fav!==void 0)return  true;return  false}function q$1(e){let t=Ua$1(F$1.parse(e)).data,n=os$1(t.marks),r=n.pruned?{...t,marks:n.marks}:t;if(Rs(r),!qs(r.marks)){zs(r),Bs(r);return}bs$1();let i=Ls();if(i==null){let e=Ja$1();zs(e),Bs(e);return}let a=F$1.safeParse(i);a.success?(zs(a.data),Bs(a.data)):(zs(r),Bs(r));}function Js(e,t){let n=K$1(),r=n.collections.find(t=>t.id===e);return r===void 0?null:(r.name=t.trim(),P$1.parse(r),q$1(n),r)}function Ys(e){let t=K$1(),n=t.collections.filter(t=>t.id!==e);return n.length!==t.collections.length&&(qo$1(e),ts$1(e),t.collections=n,q$1(t),true)}function Xs(e){let t=K$1(),n=P$1.parse({id:crypto.randomUUID(),name:e.trim(),tags:[],kind:Ee,postIds:[],thumbs:{},shuffledOrder:null});return t.collections.push(n),q$1(t),n}function Zs(){return G$1().collections.filter(I$1)}function Qs(e){let t=W$1(e);return t===null?[]:Zs().filter(e=>(e.postIds??[]).includes(t))}var $s=0,ec=2,tc=1;function nc(e){return String(e)}function rc(e,t){if(e===void 0)return null;let n=e[nc(t)];return n===void 0||n.length===0?null:n}function ic(e){if(e===void 0)return null;let t=e.trim();return t.length===0?null:t}function ac(e,t){if(e.length!==t.length)return  false;for(let n=0;n<e.length;n+=1)if(e[n]!==t[n])return  false;return  true}function oc(e){let t=[...e];for(let e=t.length-1;e>$s;--e){let n=Math.floor(Math.random()*(e+1)),r=t[e],i=t[n];r!==void 0&&i!==void 0&&(t[e]=i,t[n]=r);}if(t.length<ec||!ac(t,e))return t;let n=t[$s],r=t[tc];return n===void 0||r===void 0||(t[$s]=r,t[tc]=n),t}function sc(e,t){if(!Number.isFinite(e)||e<$s)return t;let n=Math.trunc(e);return n>t?t:n}function cc(e){let t=e.postIds??[],n=e.shuffledOrder;if(n==null)return [...t];let r=new Set(t),i=[],a=new Set;for(let e of n)r.has(e)&&!a.has(e)&&(i.push(e),a.add(e));for(let e of t)a.has(e)||(i.push(e),a.add(e));return i}function J$1(e,t){let n=e.collections.find(e=>e.id===t);return n===void 0||!I$1(n)?null:n}function Y$1(e){e.kind=Ee,e.tags=[],e.thumbs===void 0&&(e.thumbs={}),e.shuffledOrder===void 0&&(e.shuffledOrder=null);}function lc(e,t,n){let r=W$1(t);if(r===null)return null;let i=K$1(),a=J$1(i,e);if(a===null)return null;let o=[...a.postIds??[]];o.includes(r)||(o.push(r),a.shuffledOrder!==void 0&&a.shuffledOrder!==null&&(a.shuffledOrder=a.shuffledOrder.filter(e=>e!==r))),a.postIds=o;let s=ic(n),c=rc(a.thumbs,r),l=s??c;return l!==null&&(a.thumbs={...a.thumbs??{},[nc(r)]:l}),Y$1(a),P$1.parse(a),q$1(i),a}function uc(e,t){let n=K$1(),r=J$1(n,e);if(r===null)return null;let i=[...r.postIds??[]],a=new Set(i),o={...r.thumbs??{}},s=new Set;for(let e of t){let t=W$1(e.id);if(t===null)continue;a.has(t)||(a.add(t),i.push(t),s.add(t));let n=ic(e.thumbUrl??void 0)??rc(o,t);n!==null&&(o[nc(t)]=n);}return s.size>0&&r.shuffledOrder!==void 0&&r.shuffledOrder!==null&&(r.shuffledOrder=r.shuffledOrder.filter(e=>!s.has(e))),r.postIds=i,r.thumbs=o,Y$1(r),P$1.parse(r),q$1(n),{collection:r,added:s.size}}function dc(e,t){let n=K$1(),r=J$1(n,e);if(r===null)return null;let i=new Set;for(let e of t){let t=W$1(e);t!==null&&i.add(t);}let a=r.postIds??[],o=cc(r),s=[];for(let e=0;e<a.length;e+=1){let t=a[e];if(t===void 0||!i.has(t))continue;let n=o.indexOf(t);s.push({postId:t,thumbUrl:rc(r.thumbs,t),insertionIndex:e,displayIndex:n<$s?e:n});}if(s.length===0)return {collectionId:e,posts:s};let c=new Set(s.map(e=>e.postId));return r.postIds=a.filter(e=>!c.has(e)),r.shuffledOrder!==void 0&&r.shuffledOrder!==null&&(r.shuffledOrder=r.shuffledOrder.filter(e=>!c.has(e))),Y$1(r),P$1.parse(r),q$1(n),{collectionId:e,posts:s}}function fc(e,t){let n=W$1(t);return n===null||dc(e,[n])===null?null:G$1().collections.find(t=>t.id===e)??null}function pc(e){let t=K$1(),n=J$1(t,e.collectionId);if(n===null)return null;if(e.posts.length===0)return n;let r=[...n.postIds??[]],i={...n.thumbs??{}},a=[...e.posts].sort((e,t)=>e.insertionIndex-t.insertionIndex);for(let e of a){let t=W$1(e.postId);if(t!==null){if(!r.includes(t)){let n=sc(e.insertionIndex,r.length);r.splice(n,0,t);}e.thumbUrl!==null&&e.thumbUrl.length>0&&(i[nc(t)]=e.thumbUrl);}}if(n.postIds=r,n.thumbs=i,n.shuffledOrder!==void 0&&n.shuffledOrder!==null){let t=[...n.shuffledOrder],r=[...e.posts].sort((e,t)=>e.displayIndex-t.displayIndex);for(let e of r){let n=W$1(e.postId);if(n===null||t.includes(n))continue;let r=sc(e.displayIndex,t.length);t.splice(r,0,n);}n.shuffledOrder=t;}return Y$1(n),P$1.parse(n),q$1(t),n}function mc(e){let t=K$1(),n=J$1(t,e);return n===null?null:(n.shuffledOrder=oc(cc(n)),Y$1(n),P$1.parse(n),q$1(t),n)}function hc(e){let t=K$1(),n=J$1(t,e);return n===null?null:(n.shuffledOrder=null,Y$1(n),P$1.parse(n),q$1(t),n)}function gc(e,t,n){let r=K$1(),i=J$1(r,e);if(i===null||t===n)return  false;let a=cc(i),o=a.indexOf(t),s=a.indexOf(n);return o<0||s<0?false:(a.splice(o,1),a.splice(s,0,t),i.shuffledOrder===void 0||i.shuffledOrder===null?i.postIds=a:i.shuffledOrder=a,Y$1(i),P$1.parse(i),q$1(r),true)}function _c(e){let t=J$1(G$1(),e);return t===null?null:cc(t)}function vc(e,t){let n=K$1(),r=t.trim(),i=P$1.parse({id:crypto.randomUUID(),name:e.trim(),tags:ro$1(r),kind:Te,query:r});return n.collections.push(i),q$1(n),i}function yc(e,t){let n=[];for(let e of t){let t=e.trim();if(t.length!==0&&(n.push(t),n.length===4))break}if(n.length===0)return  false;let r=G$1().collections,i=r.find(t=>t.id===e);if(i===void 0||I$1(i)||(Ko$1(e,n,r.map(e=>e.id)),wc(i.cover??[],n)))return  false;let a=K$1(),o=a.collections.find(t=>t.id===e);return o===void 0||I$1(o)||wc(o.cover??[],n)?false:(o.cover=n,P$1.parse(o),q$1(a),true)}function bc(e,t){if(!Number.isInteger(t.value)||t.value<0)return  false;let n=G$1().collections,r=n.find(t=>t.id===e);if(r===void 0||I$1(r)||(es$1(e,t,n.map(e=>e.id)),Cc(r.postCount,t)))return  false;let i=K$1(),a=i.collections.find(t=>t.id===e);return a===void 0||I$1(a)||Cc(a.postCount,t)?false:(a.postCount={value:t.value,exact:t.exact},P$1.parse(a),q$1(i),true)}function xc(e,t,n){if(!Number.isInteger(t)||t<=0)return  false;let r=G$1().collections.find(t=>t.id===e);if(r===void 0||I$1(r)||r.newestPostId===t&&(!n||r.openedPostId===t))return  false;let i=K$1(),a=i.collections.find(t=>t.id===e);return a===void 0||I$1(a)?false:(a.newestPostId=Math.max(a.newestPostId??0,t),n&&(a.openedPostId=t,a.newestPostId=t),P$1.parse(a),q$1(i),true)}function Sc(e){return e.openedPostId!==void 0&&e.newestPostId!==void 0&&e.newestPostId>e.openedPostId}function Cc(e,t){return e!==void 0&&e.value===t.value&&e.exact===t.exact}function wc(e,t){if(e.length!==t.length)return  false;for(let n=0;n<e.length;n+=1)if(e[n]!==t[n])return  false;return  true}function Tc(e,t){let n=K$1(),r=n.collections.find(t=>t.id===e);if(r===void 0||I$1(r))return null;let i=t.trim();return r.query!==i&&(delete r.cover,delete r.postCount,qo$1(e),ts$1(e)),r.query=i,r.tags=ro$1(i),r.kind=Te,P$1.parse(r),q$1(n),r}function Ec(e){let t=G$1(),n=t.marks[e]??{};n.seen!==true&&(t.marks[e]={...n,seen:true},q$1(t));}function Dc(){return Xa$1(G$1())}function Oc(e){let t=G$1();t.settings={...U$1(t),gridFavButtons:e},q$1(t);}function kc(){return Za$1(G$1())}function Ac(e){let t=G$1();t.settings={...U$1(t),tweaksEnabled:e},q$1(t);}function jc(e,t){let n=G$1().settings?.features?.[e];return n===void 0?t:n}function Mc(e,t){let n=G$1(),r=U$1(n),i={...r.features??{},[e]:t};n.settings={...r,features:i},q$1(n);}function Nc(e){let t=G$1(),n=U$1(t),r=n.featureState;if(r===void 0||!(e in r))return;let i={};for(let[t,n]of Object.entries(r))t!==e&&(i[t]=n);t.settings={...n,featureState:i},q$1(t);}function Pc(e){return G$1().settings?.featureChoice?.[e]}function Fc(e,t){let n=G$1(),r=U$1(n),i={...r.featureChoice??{},[e]:t};n.settings={...r,featureChoice:i},q$1(n);}function Ic(e){return G$1().settings?.featureState?.[e]}function Lc(e,t){let n=K$1(),r=U$1(n),i=r.featureState;if(i!==void 0&&Object.hasOwn(i,e)&&JSON.stringify(i[e])===JSON.stringify(t))return;let a={...i??{},[e]:t};n.settings={...r,featureState:a},q$1(n);}function Rc(){let e=Qa$1(G$1());return !Number.isFinite(e)||e<=0?400:Math.min(Math.floor(e),400)}function zc(e){let t=G$1(),n=Number.isFinite(e)&&e>=0?Math.floor(e):0;n>400&&(n=400),t.settings={...U$1(t),updatesGroupSize:n},q$1(t);}function Bc(){return $a$1(G$1())}function Vc(e){let t=G$1(),n=Number.isFinite(e)&&e>0?Math.floor(e):40;t.settings={...U$1(t),playlistChunkSize:n},q$1(t);}function Hc(){return Ya$1(G$1())}function Uc(e){let t=pa$1.parse(e),n=G$1();return n.settings={...U$1(n),appearance:t},q$1(n),t}function Wc(){return eo$1(G$1())}function Gc(e){let t=G$1();t.updates={seenPostId:Number.isFinite(e)&&e>=0?Math.floor(e):0},q$1(t);}function Kc(){return Ks().artists.map(e=>e.tag)}function qc(e){return e.kind??`artist`}var X$1=`follow-groups`,Z$1=`collection-groups`;function Q$1(e,t){let n=e.settings?.featureState?.[t];if(!Array.isArray(n))return [];let r=[];for(let e of n)typeof e==`string`&&e.length>0&&r.push(e);return r}function $$1(e,t,n){let r=U$1(e);e.settings={...r,featureState:{...r.featureState??{},[t]:[...new Set(n)]}};}function Jc(e,t){let n=new Set(t),r=new Set;for(let t of e)t!==void 0&&t.length>0&&!n.has(t)&&r.add(t);return [...n,...[...r].sort((e,t)=>e.localeCompare(t))]}function Yc(){let e=G$1();return Jc(e.artists.map(e=>e.group),Q$1(e,X$1))}function Xc(e,t){let n=t===null?``:t.trim(),r=new Set(e),i=K$1(),a=0;return i.artists=i.artists.map(e=>{if(!r.has(e.tag)||(e.group??``)===n)return e;a+=1;let{group:t,...i}=e;return n.length>0?{...i,group:n}:i}),n.length>0&&$$1(i,X$1,[...Q$1(i,X$1),n]),(a>0||n.length>0)&&q$1(i),a}function Zc(e){let t=e.trim();if(t.length===0||Yc().includes(t))return  false;let n=K$1();return $$1(n,X$1,[...Q$1(n,X$1),t]),q$1(n),true}function Qc(e,t){let n=t.trim();if(n.length===0||n===e||Yc().includes(n))return  false;let r=K$1();return r.artists=r.artists.map(t=>t.group===e?{...t,group:n}:t),$$1(r,X$1,[...Q$1(r,X$1).map(t=>t===e?n:t),n]),q$1(r),true}function $c(e){let t=K$1(),n=0;return t.artists=t.artists.map(t=>{if(t.group!==e)return t;n+=1;let{group:r,...i}=t;return i}),$$1(t,X$1,Q$1(t,X$1).filter(t=>t!==e)),q$1(t),n}function el(){let e=G$1();return Jc(e.collections.map(e=>e.group),Q$1(e,Z$1))}function tl(e,t){let n=t===null?``:t.trim(),r=new Set(e),i=K$1(),a=0;return i.collections=i.collections.map(e=>{if(!r.has(e.id)||(e.group??``)===n)return e;a+=1;let{group:t,...i}=e;return n.length>0?{...i,group:n}:i}),n.length>0&&$$1(i,Z$1,[...Q$1(i,Z$1),n]),(a>0||n.length>0)&&q$1(i),a}function nl(e){let t=e.trim();if(t.length===0||el().includes(t))return  false;let n=K$1();return $$1(n,Z$1,[...Q$1(n,Z$1),t]),q$1(n),true}function rl(e,t){let n=t.trim();if(n.length===0||n===e||el().includes(n))return  false;let r=K$1();return r.collections=r.collections.map(t=>t.group===e?{...t,group:n}:t),$$1(r,Z$1,[...Q$1(r,Z$1).map(t=>t===e?n:t),n]),q$1(r),true}function il(e){let t=K$1(),n=0;return t.collections=t.collections.map(t=>{if(t.group!==e)return t;n+=1;let{group:r,...i}=t;return i}),$$1(t,Z$1,Q$1(t,Z$1).filter(t=>t!==e)),q$1(t),n}function al(e){let t=K$1(),n=new Set(t.artists.map(e=>e.tag)),r=0,i=0,a=0;for(let o of e){let e=R$1(o);e===null?a+=1:n.has(e)?i+=1:(n.add(e),t.artists.push(aa$1.parse({tag:e,addedAt:Date.now()})),r+=1);}return r>0&&q$1(t),{added:r,duplicates:i,invalid:a}}function ol(e){let t=new Set(e),n=K$1(),r=n.artists.filter(e=>!t.has(e.tag)),i=n.artists.length-r.length;return i>0&&(n.artists=r,q$1(n)),i}function sl(e,t){let n=t.postCount;return t.cover.length>0&&!wc(e.cover??[],t.cover)||n!==null&&(e.postCount?.value!==n.value||e.postCount.exact!==n.exact)||t.lastPostId>(e.lastPostId??0)}function cl(e,t,n){return t<=0||t<=(e.lastPostId??0)?false:(e.lastPostId=t,e.lastPostSince=n,true)}function ll(e,t,n=Date.now()){let r=Ks().artists.find(t=>t.tag===e);if(r===void 0||!sl(r,t))return  false;let i=K$1(),a=i.artists.find(t=>t.tag===e);if(a===void 0)return  false;let o=false;t.cover.length>0&&!wc(a.cover??[],t.cover)&&(a.cover=[...t.cover],o=true);let s=t.postCount;return s!==null&&(a.postCount?.value!==s.value||a.postCount.exact!==s.exact)&&(a.postCount={value:s.value,exact:s.exact},o=true),cl(a,t.lastPostId,n)&&(o=true),o&&q$1(i),o}function ul(e,t=Date.now()){if(!Ks().artists.some(t=>(e.get(t.tag)??0)>(t.lastPostId??0)))return  false;let n=K$1(),r=false;for(let i of n.artists){let n=e.get(i.tag);n!==void 0&&cl(i,n,t)&&(r=true);}return r&&q$1(n),r}function dl(e){let t=R$1(e);if(t===null)return  false;let n=K$1(),r=n.artists.filter(e=>e.tag!==t);return r.length!==n.artists.length&&(n.artists=r,q$1(n),true)}function it(e){return {querySelectorAll:t=>{let n=[];for(let r of e)r.matches(t)&&n.push(r),n.push(...r.querySelectorAll(t));return n}}}var at=new Set;function ot(e){return at.add(e),()=>{at.delete(e);}}function st(e,t){let n=t===void 0?e:it(t);for(let e of at)try{e(n);}catch(e){m.error(`thumbs-bus: a listener failed`,e);}}var ct=`rule34.xxx`,lt=`https:`;function ut(e){let t;try{t=new URL(e);}catch{return  false}return t.protocol===lt&&(t.hostname===ct||t.hostname.endsWith(`.${ct}`))}var dt=exports("aT",`
.${Bt$1} {
  position: relative;
  anchor-scope: ${Ht$1};
}

.${Bt$1} img.preview,
.${Bt$1} > a > img {
  anchor-name: ${Ht$1};
}
`),ft=`wimg.rule34.xxx`,pt=`https://ws-cdn-video.rule34.xxx`,mt=/^\/+thumbnails\/+([^/]+)\/+thumbnail_([^/]+)\.jpg$/i,ht=`https:`,gt=`thumbnails`,_t=`thumbnail_`,vt=`jpg`,yt=0,bt=new URL(pt).hostname,xt=/^\/+samples\/+([^/]+)\/+sample_([^/]+)\.[^/.]+$/i,St=/^\/+images\/+([^/]+)\/+([^/]+)\.[^/.]+$/i;function Ct(e){return !Number.isInteger(e)||e<yt?null:e}function wt(e){let t=xt.exec(e),n=t===null?St.exec(e):null,r=t??n;if(r===null)return null;let i=r[1],a=r[2];return i===void 0||a===void 0||i.length===0||a.length===0?null:{dir:i,hash:a}}function Tt(e){e.classList.add(Bt$1);}function Et(e){let t;try{t=new URL(e);}catch{return null}if(!ut(e))return null;let n=mt.exec(t.pathname);if(n===null)return null;let r=n[1],i=n[2];return r===void 0||i===void 0||r.length===0||i.length===0?null:`${pt}//images/${r}/${i}.mp4${t.search}`}function Dt(e,t){let n=Ct(t);if(n===null)return null;let r;try{r=new URL(e);}catch{return null}if(r.protocol!==ht||r.hostname!==`wimg.rule34.xxx`&&r.hostname!==bt)return null;let i=wt(r.pathname);return i===null?null:`https://${ft}/${gt}/${i.dir}/${_t}${i.hash}.${vt}?${String(n)}`}var Ot=exports("bR",`:scope > a > img`),kt=`webm-thumb`,At=`video`,jt=`vide`,Mt=/\s+/;function Nt(e){let t=e.trim().split(Mt);return t.includes(At)?true:t[t.length-1]===jt}function Pt(e,t){let n=0;for(let r of e.querySelectorAll(t)){let e=r.querySelector(Ot);e instanceof HTMLImageElement&&(e.classList.contains(kt)||Nt(e.title))&&(r.classList.add(Bt$1,Jt$1),n+=1);}return n}function Ft(e=rn$1.thumb){Pt(document,e),ot(t=>{Pt(t,e);});}function It(){Ft(rn$1.thumb);}var Lt=`rdw-gif-thumb`,Rt=`animated_gif`,zt=`nimated_gif`,Bt=`animated_gi`,Vt=`rdw-gif-thumb-style`,Ht=`GIF`,Ut=6,Wt=`
${dt.trim()}
.${Lt}::after {
  content: "${Ht}";${Yt$1}
}
@supports (anchor-name: --a) {
  .${Lt}::after {
    position-anchor: ${Ht$1};
    left: calc(anchor(left) + ${String(Ut)}px);
    bottom: calc(anchor(bottom) + ${String(Ut)}px);
  }
  html.${Vt$1} .${Lt}::after {
    position-anchor: ${Ut$1};
  }
}
`.trim();function Gt(e){let t=e.trim().split(Mt);return t.includes(Rt)||t[0]===zt||t[t.length-1]===Bt}function Kt(e,t){let n=0;for(let r of e.querySelectorAll(t)){let e=r.querySelector(Ot);e instanceof HTMLImageElement&&Gt(e.title)&&(r.classList.add(Bt$1,Lt),n+=1);}return n}function qt(e){if(document.getElementById(Vt)===null){let e=document.createElement(`style`);e.id=Vt,e.textContent=Wt,document.head.append(e);}Kt(document,e),ot(t=>{Kt(t,e);});}var v=`html.${c}`,y=`${v}.${Vt$1}`,b=`${v}[${l}="${ee}"]`,Jt=`html[${l}="${u}"]`,Yt=`html[${l}="${d}"]`,Xt=`html[${l}="${ee}"]`,Zt=`rdw-search-tools`,Qt=30,$t=1100,en=96,tn=Ut$1,nn=6,rn=28,an=16,on=`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 6h18'/%3E%3Cpath d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6'/%3E%3Cpath d='M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'/%3E%3Cpath d='M10 11v6'/%3E%3Cpath d='M14 11v6'/%3E%3C/svg%3E") center / contain no-repeat`,sn=4,cn=640,ln=220,x=`:where(:not([class*="rdw-"])${`:not(#${Zt} *)`})`,un=`rdw-post-panel-mounted`,dn=`li:has(a[onclick^="iCame("])`,S=Gt$1,fn=`rdw-select__list`,pn=`rdw-ac__list`,mn=`rdw-dialog`,hn=`rdw-playlist-menu`,gn=`thin`,_n=34,vn=2,yn=`rdw-post-panel-actions`,bn=`rdw-post-panel-actions-row`,xn=`rdw-post-panel-fav`,Sn=`rdw-post-panel-original`,Cn=`rdw-post-panel-tabpanel`,wn=`rdw-post-panel-post-action`,Tn=`rdw-tabs`,C=`rdw-tabs__tab`,En=`rdw-btn--primary`,Dn=`:not(:disabled:not([aria-busy="true"]))`,On=`rdw-search-tools-ai-posts`,kn=`rdw-fav-bulk-selected`,An=`rdw-fav-bulk-check`,jn=`rdw-favorites-bulk`,Mn=`rdw-favorites-bulk-bar`,Nn=`rdw-favorites-bulk-status`,Pn=`rdw-f-favorites-bulk-selecting`,Fn=`2px`,In=`2px`,Ln=`1.25rem`,Rn=`0.25rem`,zn=2,Bn=`0.75rem`,w=`${v} div#upload-form:has(#fileUpload):has(#tags)`,Vn=`rdw-upload-drag`,Hn=`rdw-upload-has-file`,Un=`rdw-upload-file-name`,Wn=`rdw-upload-preview`,T=`rdw-upload-hint`,Gn=`rdw-upload-note`,Kn=`rdw-notice-gone`,E=`rdw-upload-remove`,qn=`rdw-upload-preview-box`,Jn=`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M18 6 6 18'/%3E%3Cpath d='m6 6 12 12'/%3E%3C/svg%3E") center / contain no-repeat`,Yn=`rdw-upload-tag-count`,Xn=`rdw-upload-tag-count--short`,Zn=`rdw-upload-guide-toggle`,Qn=`rdw-upload-guide-folded`,$n=`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/%3E%3Cpolyline points='17 8 12 3 7 8'/%3E%3Cline x1='12' x2='12' y1='3' y2='15'/%3E%3C/svg%3E") center / contain no-repeat`,D=`${v} div#forum:not(.response-list)`,O=`${v} div#forum.response-list`,er=`rdw-forum-row-marked`,tr=`rdw-forum-only-new`,nr=`rdw-forum-toolbar`,rr=`rdw-forum-pin`,ir=`rdw-forum-no-value`,ar=`data-rdw-unit`,or=`rdw-forum-search`,sr=`rdw-forum-search-clear`,cr=`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='m21 21-4.3-4.3'/%3E%3C/svg%3E") center / contain no-repeat`,lr=`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M18 6 6 18'/%3E%3Cpath d='m6 6 12 12'/%3E%3C/svg%3E") center / 14px no-repeat`,ur=`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 17v5'/%3E%3Cpath d='M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z'/%3E%3C/svg%3E") center / contain no-repeat`,k={bg:`var(${h.bg})`,surface:`var(${h.surface})`,surface2:`var(${h.surface2})`,border:`var(${h.border})`,text:`var(${h.text})`,muted:`var(${h.muted})`,accent:`var(${h.accent})`,accentSoft:`var(${h.accentSoft})`,danger:`var(${h.danger})`,dangerSoft:`var(${h.dangerSoft})`,tagArtist:`var(${h.tagArtist})`,tagCharacter:`var(${h.tagCharacter})`,tagCopyright:`var(${h.tagCopyright})`,tagMetadata:`var(${h.tagMetadata})`,radiusS:`var(${h.radiusS})`,radiusM:`var(${h.radiusM})`,radiusL:`var(${h.radiusL})`,shadow1:`var(${h.shadow1})`,shadow2:`var(${h.shadow2})`,font:`var(${h.font})`},dr=`
/* —— base —— */
${v} body {
  font-family: ${k.font};
  font-size: 13px;
  line-height: 1.4;
  background: ${k.bg};
  color: ${k.text};
}

${v} body,
${v} body div,
${v} body h1,
${v} body h2,
${v} body h3,
${v} body h4,
${v} body h5,
${v} body h6,
${v} body p,
${v} body ul,
${v} body li,
${v} body dd,
${v} body dt,
${v} body input,
${v} body select,
${v} body button,
${v} body textarea {
  font-family: ${k.font};
}

/* A visited link looks like any other link: one colour for links on a page. */
${v} a:link,
${v} a:visited {
  color: ${k.accent};
  text-decoration: none;
}

${v} a:hover,
${v} a:active {
  color: ${k.text};
  text-decoration: none;
}

/*
 * My Account: "Logout" is not a link but a form button dressed as a heading,
 * <h4><button type="submit" style="… color: inherit …">. It takes the link
 * colour so the list of headings is one colour; the inline style needs
 * !important to be overridden.
 */
${v} h4 > button[type="submit"][style*="color: inherit"] {
  color: ${k.accent} !important;
}

${v} h4 > button[type="submit"][style*="color: inherit"]:hover {
  color: ${k.text} !important;
}

${v} a.last-page {
  color: ${k.muted};
}

${v} a.spoiler,
${v} span.spoiler {
  color: ${k.text};
  background: ${k.text};
}

${v} a.spoiler:hover,
${v} span.spoiler:hover {
  color: ${k.bg};
  background: ${k.text};
}

${v} hr {
  border-color: ${k.border};
}

${v} code {
  font-family: ui-monospace, monospace;
}

/* —— header —— */
${v} div#header {
  background: ${k.surface};
  border-bottom: 1px solid ${k.border};
  margin-bottom: 0.75em;
}

${v} div#header #site-title {
  background-image: none;
  background-color: transparent;
  padding: 12px 18px 4px 18px;
  font: 800 17px ${k.font};
  letter-spacing: -0.02em;
  color: ${k.text};
}

${v} div#header #site-title a {
  color: ${k.text};
  font-weight: 800;
  background: none;
  text-shadow: none;
}

${v} div#header ul#navbar {
  background: transparent;
  padding: 4px 18px 8px 10px;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

${v} div#header ul#navbar li {
  font-size: 13px;
  font-weight: normal;
  padding: 0;
  margin: 0;
  background: transparent;
  background-image: none;
  list-style: none;
  display: inline;
}

${v} div#header ul#navbar li a {
  display: inline-block;
  padding: 6px 10px;
  border-radius: ${k.radiusM};
  color: ${k.muted};
  font-weight: normal;
}

${v} div#header ul#navbar li.current-page {
  background: transparent;
  background-image: none;
}

/* The current section: the text colour and a line under it, so that it does
   not rest on colour alone. The accent on its soft fill was under 4.5:1. */
${v} div#header ul#navbar li.current-page a,
${v} #navbar li.current-page a {
  background: transparent;
  color: ${k.text};
  font-weight: 600;
  border-radius: 0;
  box-shadow: inset 0 -2px 0 ${k.accent};
}

${v} div#header ul#subnavbar {
  background: ${k.surface};
  border-top: 1px solid ${k.border};
  border-bottom: none;
  padding: 6px 18px;
  margin: 0;
}

${v} div#header ul#subnavbar li {
  padding: 0 8px;
  font-size: 12.5px;
}

${v} div#header ul#subnavbar li a {
  color: ${k.muted};
}

${v} div#header ul#subnavbar li a:hover {
  color: ${k.accent};
}

${v} div.tips {
  background: ${k.accentSoft};
  background-image: none;
  border-bottom: 1px solid ${k.border};
  color: ${k.text};
}

/* —— sidebar —— */
${v} div.sidebar {
  width: 228px;
  min-width: 228px;
  max-width: 228px;
  margin-right: 1em;
}

${v} div.sidebar h5,
${v} div.sidebar h6,
${v} ul#tag-sidebar h5,
${v} ul#tag-sidebar h6 {
  font: 600 10.5px ${k.font};
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${k.muted};
  margin: 0 0 6px;
}

/* Custom theme: a heading of the sidebar may stand straight on the user's
   picture, where grey small text is unreadable. It gets a backing of the
   card's colour; a shadow of the same colour widens it without moving
   anything. In a card the backing is the card's own colour and is not seen. */
html[${l}="${te}"].${c} div.sidebar h5,
html[${l}="${te}"].${c} ul#tag-sidebar h5 {
  /* Only as wide as its words: across the column it was a grey strip. */
  max-width: max-content;
  background: color-mix(in srgb, ${k.surface} 88%, transparent);
  box-shadow: 0 0 0 4px color-mix(in srgb, ${k.surface} 88%, transparent);
  border-radius: 2px;
}

/* A preview of a very tall post is a strip a few pixels wide: it is given a
   width and cropped to it, so that there is something to see and to click. */
${v} div#comments div#comment-list > div.post > div.col1 img.preview {
  min-width: ${String(en)}px;
  object-fit: cover;
}

/* Standalone "Tags"/"Search" (and similar) headings above the list card */
${v} div.sidebar > h5 {
  display: none;
}

/* Tags between search panel card and tag list (typical site markup) */
${v} div.tag-search + h5 {
  display: none;
}

/* D: Tags heading immediately after search-tools when they are siblings */
${v} ${rn$1.tagsHeadingAfterSearchTools} {
  display: none;
}

/* F: native AI filter row — only while search-tools AI posts row is rendered */
${v} body.${On} ${rn$1.filterAiRow} {
  display: none;
}

${v} div.tag-search,
${v} ul#tag-sidebar {
  background: ${k.surface};
  border: 1px solid ${k.border};
  border-radius: ${k.radiusL};
  padding: 12px;
  box-shadow: ${k.shadow1};
  box-sizing: border-box;
}

${v} div.tag-search {
  margin-bottom: 12px;
}

${v} ul#tag-sidebar {
  margin: 0;
  padding: 12px;
  list-style: none;
}

/*
 * Tag rows: ?/+/- /name (list) or ?/name (post) wrap as inline text;
 * count stays top-right on the first line (artists-sidebar.test markup).
 */
${v} ul#tag-sidebar > li {
  display: block;
  position: relative;
  margin: 0 0 5px;
  padding-right: 4.5em;
  font-size: 12.5px;
  line-height: 1.35;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

${v} ul#tag-sidebar > li > a {
  display: inline;
}

${v} ul#tag-sidebar > li > h5,
${v} ul#tag-sidebar > li > h6 {
  display: block;
  margin-top: 8px;
}

${v} ul#tag-sidebar > li:first-child > h5,
${v} ul#tag-sidebar > li:first-child > h6 {
  margin-top: 0;
}

${v} .tag-count,
${v} span.post-count,
${v} span.tag-count {
  position: absolute;
  top: 0;
  right: 0;
  margin-left: 0;
  color: ${k.muted};
  font-size: 12px;
  line-height: 1.35;
}

/*
 * Tag type color on the LAST link of the row (tag name).
 * List rows: ? + − name — name is 4th. Post rows: ? name — name is 2nd.
 * Operators / wiki stay muted on every page.
 */
${v} ul#tag-sidebar > li[class*="tag-type-"] > a:not(:last-of-type) {
  color: ${k.muted};
  font-size: 11px;
  font-weight: normal;
}

${v} .tag-type-artist > a,
${v} .tag-type-artist {
  color: ${k.tagArtist};
}

${v} .tag-type-character > a,
${v} .tag-type-character {
  color: ${k.tagCharacter};
}

${v} .tag-type-copyright > a,
${v} .tag-type-copyright {
  color: ${k.tagCopyright};
}

${v} .tag-type-metadata > a,
${v} .tag-type-metadata {
  color: ${k.tagMetadata};
}

${v} ul#tag-sidebar > li.tag-type-artist > a:last-of-type {
  color: ${k.tagArtist};
  font-size: 12.5px;
  font-weight: normal;
}

${v} ul#tag-sidebar > li.tag-type-character > a:last-of-type {
  color: ${k.tagCharacter};
  font-size: 12.5px;
  font-weight: normal;
}

${v} ul#tag-sidebar > li.tag-type-copyright > a:last-of-type {
  color: ${k.tagCopyright};
  font-size: 12.5px;
  font-weight: normal;
}

${v} ul#tag-sidebar > li.tag-type-metadata > a:last-of-type {
  color: ${k.tagMetadata};
  font-size: 12.5px;
  font-weight: normal;
}

${v} .tag-type-artist > a:hover,
${v} .tag-type-artist:hover,
${v} .tag-type-character > a:hover,
${v} .tag-type-character:hover,
${v} .tag-type-copyright > a:hover,
${v} .tag-type-copyright:hover,
${v} .tag-type-metadata > a:hover,
${v} .tag-type-metadata:hover,
${v} ul#tag-sidebar > li[class*="tag-type-"] > a:last-of-type:hover {
  color: ${k.accent};
}

/* Artist Follow: kit secondary on theme tokens (beats document-chrome #fff) */
${v} button.${Ie.artistFollow} {
  background: ${k.surface};
  border: 1px solid ${k.border};
  color: ${k.text};
  border-radius: ${k.radiusS};
}

${v} button.${Ie.artistFollow}:hover {
  background: ${k.accentSoft};
  border-color: ${k.accent};
  color: ${k.accent};
}

${v} button.${Ie.artistFollow}.${Ie.artistFollowMarked} {
  background: ${k.accentSoft};
  border-color: ${k.accent};
  color: ${k.accent};
}

/* —— search field —— */
${v} div.tag-search input[type="text"],
${v} div.tag-search input[type="search"] {
  width: 100%;
  height: 34px;
  box-sizing: border-box;
  border: 1px solid ${k.border};
  border-radius: ${k.radiusM};
  padding: 0 10px;
  background: ${k.surface};
  color: ${k.text};
  font-size: 13px;
}

${v} div.tag-search input[type="submit"]${x},
${v} div.tag-search button[type="submit"]${x} {
  width: 100%;
  box-sizing: border-box;
  margin-top: 8px;
  padding: 6px 12px;
  border: none;
  border-radius: ${k.radiusS};
  background: ${k.accent};
  color: ${k.surface};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

${v} div.tag-search input[type="submit"]${x}:hover,
${v} div.tag-search button[type="submit"]${x}:hover {
  filter: brightness(1.05);
}

/* One ring for the keyboard's focus on anything of the site that is not a
   field: links, thumbnails, buttons. The browser's own was a white rectangle
   on the dark theme. */
${v} a:focus-visible,
${v} button:focus-visible,
${v} summary:focus-visible {
  outline: 2px solid ${k.accent};
  outline-offset: 2px;
  border-radius: 4px;
}

${v} input[type="text"]${x}:focus,
${v} input[type="password"]${x}:focus,
${v} input[type="search"]${x}:focus,
${v} textarea${x}:focus,
${v} select${x}:focus {
  background: ${k.surface};
  outline: 2px solid ${k.accent};
  outline-offset: 1px;
  border-color: ${k.accent};
}

/*
 * A value the browser fills in itself (picked from its list of earlier
 * entries) gets the browser's own pale background, which cannot be set with
 * a background. An inset shadow as large as the field covers it, and the
 * text colour is set the way autofill reads it.
 */
${v} input${x}:-webkit-autofill,
${v} input${x}:-webkit-autofill:hover,
${v} input${x}:-webkit-autofill:focus,
${v} textarea${x}:-webkit-autofill {
  -webkit-text-fill-color: ${k.text};
  caret-color: ${k.text};
  box-shadow: 0 0 0 1000px ${k.surface} inset;
}

/* —— awesomplete —— */
/* Site hides closed lists with opacity/scale + display:block; do not undo that. */
${v} .awesomplete > ul[hidden],
${v} .awesomplete > ul:empty {
  display: none !important;
  pointer-events: none;
}

${v} .awesomplete > ul:not([hidden]):not(:empty) {
  background: ${k.surface};
  background-image: none;
  border: 1px solid ${k.border};
  border-radius: ${k.radiusL};
  box-shadow: ${k.shadow2};
  margin: 0.35em 0 0;
  padding: 4px 0;
  text-shadow: none;
  transform: none;
}

${v} .awesomplete > ul:before {
  display: none;
  content: none;
}

${v} .awesomplete > ul > li {
  padding: 6px 10px;
  color: ${k.text};
  cursor: pointer;
}

${v} .awesomplete > ul > li:hover,
${v} .awesomplete > ul > li[aria-selected="true"] {
  background: ${k.accentSoft};
  color: ${k.accent};
}

${v} .awesomplete mark {
  background: ${k.accentSoft};
  color: ${k.text};
}

${v} div.auto_complete {
  background: ${k.surface};
}

${v} div.auto_complete ul {
  border-color: ${k.border};
  background: ${k.surface};
}

${v} div.auto_complete ul li.selected {
  background-color: ${k.accentSoft};
}

${v} div.auto_complete ul strong.highlight {
  color: ${k.accent};
}

/* —— grid / thumbs (cell size unchanged) —— */
${v} div.image-list {
  column-gap: 4px;
  row-gap: 4px;
  align-items: flex-start;
  align-content: flex-start;
}

${v} img.preview,
${v} span.thumb > a > img {
  border-radius: ${k.radiusL};
}

/* Favorites: Remove stays subtle; hover must not paint the thumb cell */
${v} span.thumb,
${v} span.thumb:hover,
${v} span.thumb > a,
${v} span.thumb > a:hover {
  background-color: transparent;
}

${v} span.thumb > a[onclick] {
  color: ${k.muted};
  font-size: 12px;
  font-weight: normal;
  padding: 2px 8px;
  border-radius: ${k.radiusS};
  background: transparent;
  border: none;
}

${v} span.thumb > a[onclick]:hover {
  color: ${k.danger};
  background: transparent;
}

${v} span.thumb > a[onclick] b {
  font-weight: normal;
  color: inherit;
}

/* —— favorites bulk select (F HANDOFF; tokens for Light/Dark/Site) —— */
${v} body.${Pn} span.thumb {
  position: relative;
  cursor: pointer;
}

${v} span.thumb.${kn} {
  outline: ${Fn} solid ${k.accent};
  outline-offset: ${In};
  border-radius: ${k.radiusL};
}

/*
 * Check badge is a sibling of a#p{ID}, never inside the link.
 * Hidden until the thumb is selected.
 */
${v} span.thumb > .${An} {
  position: absolute;
  top: ${Rn};
  left: ${Rn};
  z-index: ${String(zn)};
  display: none;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: ${Ln};
  height: ${Ln};
  border-radius: 50%;
  background: ${k.accent};
  color: ${k.surface};
  font-size: ${Bn};
  font-weight: 700;
  line-height: 1;
  pointer-events: none;
}

${v} span.thumb.${kn} > .${An} {
  display: inline-flex;
}

${v} #${jn},
${v} .${Mn} {
  color: ${k.text};
}

${v} #${jn} .${Nn} {
  color: ${k.muted};
}

/* The frame of a video. With "Play icon on video thumbnails" on, the feature
   takes it off and puts a label on the thumb instead (features/video-mark.ts). */
${v} .${Jt$1} > a > img,
${v} .webm-thumb {
  border: 1px solid ${k.accent};
  box-sizing: border-box;
}

${v} img.flagged,
${v} img.has-children,
${v} img.has-parent,
${v} img.pending,
${v} img.video {
  border-width: 1px;
  border-style: solid;
  box-sizing: border-box;
}

${v} img.flagged {
  border-color: ${k.danger};
}

${v} img.has-children {
  border-color: ${k.tagCharacter};
}

${v} img.has-parent {
  border-color: ${k.tagMetadata};
}

${v} img.pending,
${v} img.video {
  border-color: ${k.accent};
}

/* —— pagination —— */
${v} div#paginator,
${v} .pagination {
  display: block;
  padding: 1.5em 0 1em;
  text-align: center;
  clear: both;
}

${v} div#paginator a,
${v} .pagination a {
  display: inline-block;
  margin: 0 3px;
  padding: 4px 10px;
  border: 1px solid ${k.border};
  border-radius: ${k.radiusM};
  background: ${k.surface};
  color: ${k.text};
  text-decoration: none;
}

${v} div#paginator a:hover,
${v} .pagination a:hover {
  background: ${k.accentSoft};
  color: ${k.accent};
  border-color: ${k.accent};
}

${v} div#paginator a.current,
${v} div#paginator span.current,
${v} .pagination a.current,
${v} .pagination span.current {
  background: ${k.accent};
  border-color: ${k.accent};
  color: ${k.surface};
  font-weight: 600;
}

${v} div#paginator span {
  margin: 0 3px;
  padding: 4px 8px;
}

${v} .manual-page-chooser > input[type="text"] {
  width: 4em;
  height: 28px;
  border: 1px solid ${k.border};
  border-radius: ${k.radiusS};
  background: ${k.surface};
  color: ${k.text};
  padding: 0 6px;
}

${v} .manual-page-chooser > input[type="submit"] {
  height: 28px;
  margin-left: 4px;
  padding: 0 10px;
  border: none;
  border-radius: ${k.radiusS};
  background: ${k.accent};
  color: ${k.surface};
  font-weight: 600;
  cursor: pointer;
}

/* —— forms / tables (site chrome; skip search-tools + any .rdw-* control) —— */
${v} input${x},
${v} select${x},
${v} textarea${x},
${v} button${x} {
  color: ${k.text};
  font-family: ${k.font};
}

${v} input[type="text"]${x},
${v} input[type="password"]${x},
${v} input[type="search"]${x},
${v} input[type="number"]${x},
${v} select${x},
${v} textarea${x} {
  background: ${k.surface};
  border: 1px solid ${k.border};
  border-radius: ${k.radiusS};
  color: ${k.text};
}

${v} button${x},
${v} input[type="submit"]${x},
${v} input[type="button"]${x},
${v} .gdprbutton button {
  background: ${k.surface};
  border: 1px solid ${k.border};
  border-radius: ${k.radiusS};
  color: ${k.text};
  padding: 4px 10px;
  cursor: pointer;
}

${v} button${x}:hover,
${v} input[type="submit"]${x}:hover,
${v} input[type="button"]${x}:hover,
${v} .gdprbutton button:hover {
  background: ${k.accentSoft};
  border-color: ${k.accent};
  color: ${k.accent};
}

/* Keep search submit as primary accent (overrides generic button chrome) */
${v} div.tag-search input[type="submit"],
${v} div.tag-search button[type="submit"],
${v} .manual-page-chooser > input[type="submit"] {
  background: ${k.accent};
  border: none;
  color: ${k.surface};
  font-weight: 600;
}

${v} div.tag-search input[type="submit"]:hover,
${v} div.tag-search button[type="submit"]:hover,
${v} .manual-page-chooser > input[type="submit"]:hover {
  background: ${k.accent};
  border: none;
  color: ${k.surface};
  filter: brightness(1.05);
}

${v} table {
  color: ${k.text};
}

${v} tr.tableheader,
${v} thead tr {
  background: ${k.surface2} !important;
  background-image: none !important;
  color: ${k.text};
}

${v} table.highlightable th {
  color: ${k.text};
  background: ${k.surface2};
}

${v} table.highlightable td {
  border-color: ${k.border};
}

${v} table.highlightable > tbody > tr:hover {
  background: ${k.accentSoft};
}

${v} table tr.good {
  background: ${k.accentSoft};
}

${v} table tr.selected {
  background: ${k.accentSoft} !important;
}

${v} table tr.highlight {
  background: ${k.surface2};
}

${v} table tr.pending-tag {
  background: ${k.surface2};
}

/* Zebra without native green tint */
${v} table tr:nth-child(odd) {
  background: ${k.surface2};
}

/* —— data tables: one frame for every list (aliases, artists, tags, pools, forum) —— */
${v} table.highlightable {
  background: ${k.surface};
  border: 1px solid ${k.border};
  border-radius: ${k.radiusL};
  border-collapse: separate;
  border-spacing: 0;
  overflow: hidden;
}

/*
 * Favorites: "Remove" sits beside the thumb, not inside it
 * (div.image-list > span > [span.thumb, br, a > b]). Quiet, not bold.
 */
${y} div.image-list > span > a[onclick] {
  color: ${k.muted};
  font-size: 12px;
}

${y} div.image-list > span > a[onclick] > b {
  font-weight: normal;
}

${y} div.image-list > span > a[onclick]:hover {
  color: ${k.danger};
}

/*
 * Favorites: the grid is the site's own, the same as on Posts: a square cell
 * with the picture in its middle. Only the row the site keeps under each thumb
 * for "Remove" goes away (below), so the rows sit as close as on Posts.
 */

/*
 * A favorites cell whose post was removed leaves no hole in its column.
 * The :not(.thumb) part matters: on a search page the thumbs themselves are the
 * direct children of the list, and they must never match.
 */
${y} div.image-list > span:not(.thumb):not(:has(span.thumb)) {
  /* The cell carries an inline display: grid. */
  display: none !important;
}

${y} div.image-list > span > span.thumb {
  position: relative;
}

/*
 * Favorites: "Remove" is a small bin button in the top right corner of the
 * picture, where Posts has the favorite star, and shows while the pointer is
 * over the post. The link stays where the site put it in the page; it is only
 * positioned against the image, and its text is kept for screen readers. The
 * row the site kept for it under the thumb goes away. Hidden while posts are
 * being selected.
 */
@supports (anchor-name: --a) {
  ${y} div.image-list > span:has(> a[onclick]) {
    anchor-scope: ${tn};
    grid-template-rows: auto !important;
  }

  ${y} div.image-list > span:has(> a[onclick]) > br {
    display: none;
  }

  ${y} div.image-list > span > span.thumb > a > img {
    anchor-name: ${Ht$1}, ${tn};
  }

  ${y} div.image-list > span > a[onclick] {
    position: absolute;
    position-anchor: ${tn};
    top: calc(anchor(top) + ${String(nn)}px);
    right: calc(anchor(right) + ${String(nn)}px);
    z-index: ${String(sn)};
    box-sizing: border-box;
    display: grid;
    place-items: center;
    width: ${String(rn)}px;
    height: ${String(rn)}px;
    padding: 0;
    border: 1px solid rgba(0, 0, 0, 0.13);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.93);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    font-size: 0;
    line-height: 0;
    text-decoration: none;
    opacity: 0;
    transition: opacity 0.12s ease;
  }

  ${y} div.image-list > span > a[onclick]::before {
    content: "";
    width: ${String(an)}px;
    height: ${String(an)}px;
    background: rgb(28, 34, 40);
    -webkit-mask: ${on};
    mask: ${on};
  }

  ${y} div.image-list > span > a[onclick]:hover::before {
    background: ${k.danger};
  }

  ${y} div.image-list > span:hover > a[onclick] {
    opacity: 0.65;
  }

  ${y} div.image-list > span > a[onclick]:hover,
  ${y} div.image-list > span > a[onclick]:focus-visible {
    opacity: 1;
  }

  ${y} body.${Pn} div.image-list > span > a[onclick] {
    display: none;
  }
}

/*
 * Comments and forum posts: the site gives the text columns fixed widths
 * (50em and 30em) and leaves half the window empty. They take the width that
 * is there, up to a readable limit.
 */
${v} div#comments div#comment-list > div.post {
  float: none;
  display: flex;
  gap: 16px;
  max-width: ${String($t)}px;
}

${v} div#comments div#comment-list > div.post > div.col1 {
  float: none;
  flex: 0 0 auto;
}

${v} div#comments div#comment-list > div.post > div.col2 {
  float: none;
  flex: 1 1 auto;
  width: auto;
  min-width: 0;
}

${v} div.response-list > div.post {
  display: flex;
  max-width: ${String($t)}px;
}

${v} div.response-list > div.post > div.author {
  float: none;
  flex: 0 0 auto;
}

${v} div.response-list > div.post > div.content {
  float: none;
  flex: 1 1 auto;
  width: auto;
  min-width: 0;
}

/*
 * Wiki → Create: the intro and the form labels carry an inline dark grey at
 * 11px, unreadable on a dark page. Inline styles need !important.
 */
${v} div.content > div[style*="width: 100%"] > div[style*="font-size: 11px"],
${v} div.content > div[style*="width: 100%"] center > div[style*="font-size: 11px"] {
  color: ${k.muted} !important;
  font-size: 12px !important;
}

${v} div.content > div[style*="width: 100%"] > div[style*="font-size: 11px"] > h3 {
  color: ${k.text};
}

/* Aliases: the example line under the intro is pure red inline. */
${v} div#content > div[style^="color:"] {
  color: ${k.muted} !important;
}

/* Artists: the links under the pager (Create, Order by …) are oversized. */
${v} div#content > div#footer {
  font-size: 13px;
}

/*
 * My Account: a bare list of headings (div#user-index > [h4 > a, p]…, then
 * h1 > a "To main post page"). One card, quiet captions, a normal last link.
 */
${v} div#user-index {
  box-sizing: border-box;
  max-width: ${String(cn)}px;
  padding: 8px 20px 16px;
  background: ${k.surface};
  border: 1px solid ${k.border};
  border-radius: ${k.radiusL};
}

${v} div#user-index h4 {
  margin: 14px 0 2px;
  font-size: 15px;
}

${v} div#user-index > p {
  margin: 0;
  color: ${k.muted};
}

${v} div#user-index > h1 {
  margin: 0;
  font-size: 13px;
  font-weight: normal;
}

/* Help: each group (div#static-more > div > ul > [li > h4, li > a]) is a card. */
${v} div#static-more > div {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 16px;
}

${v} div#static-more > div > ul {
  box-sizing: border-box;
  min-width: ${String(ln)}px;
  margin: 0;
  padding: 12px 20px 14px;
  list-style: none;
  background: ${k.surface};
  border: 1px solid ${k.border};
  border-radius: ${k.radiusL};
}

${v} div#static-more > div > ul > li {
  margin: 0;
  padding: 2px 0;
}

${v} div#static-more > div > ul h4 {
  margin: 0 0 4px;
}

/* Forms are not data: no stripes across their rows. */
${v} table.form tr:nth-child(odd),
${v} div#upload-form table tr:nth-child(odd),
${v} div#edit-form table tr:nth-child(odd) {
  background: transparent;
}

${v} table.form th {
  color: ${k.muted};
}

/* —— site form controls: one height, readable padding —— */
${v} input[type="text"]${x},
${v} input[type="password"]${x},
${v} input[type="search"]${x},
${v} input[type="number"]${x},
${v} select${x} {
  box-sizing: border-box;
  min-height: ${String(Qt)}px;
  padding: 4px 8px;
  font-size: 13px;
}

${v} textarea${x} {
  box-sizing: border-box;
  padding: 6px 8px;
  font-size: 13px;
}

/* "Choose File": the browser's own button, dressed as a secondary button. */
${v} input[type="file"]${x} {
  color: ${k.text};
  font-size: 12px;
}

${v} input[type="file"]${x}::file-selector-button {
  margin-right: 8px;
  padding: 4px 10px;
  border: 1px solid ${k.border};
  border-radius: ${k.radiusM};
  background: ${k.surface};
  color: ${k.text};
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

${v} input[type="file"]${x}::file-selector-button:hover {
  border-color: ${k.accent};
}

/*
 * —— upload ——
 * The image upload form: one card in two columns. The file on the left; tags,
 * rating, source, title and the button on the right; the guidelines above,
 * across both. The site's table stays: its rows are
 * placed by a grid, each found by the field it holds, so a form with other
 * fields (the video upload) is left as it is.
 */
${w} > form {
  max-width: 1200px;
}

${w} > form > h2 {
  margin: 0 0 10px;
  font-size: 18px;
}

${w} > form > br {
  display: none;
}

${w} > form > table {
  display: block;
  width: 100%;
  border: 0;
  background: transparent;
}

${w} > form > table > tbody {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
  grid-template-areas:
    "guide guide"
    "file tags"
    "file rating"
    "file source"
    "file title"
    "file mytags"
    "file submit";
  /* The last row beside the file takes whatever a tall picture adds, so the
     fields above it stay together instead of spreading down the column. */
  grid-template-rows: auto auto auto auto auto auto 1fr;
  gap: 12px 20px;
  align-items: start;
  padding: 16px;
  background: ${k.surface};
  border: 1px solid ${k.border};
  border-radius: ${k.radiusL};
}

${w} > form > table > tbody > tr {
  display: block;
  grid-column: 1 / -1;
  min-width: 0;
  background: transparent;
}

${w} > form > table > tbody > tr > td {
  display: block;
  padding: 0;
  border: 0;
  color: ${k.muted};
  font-size: 12px;
  line-height: 1.5;
}

${w} > form > table > tbody > tr:has(h3) {
  grid-area: guide;
}

/* The zone is as tall as the fields beside it. */
${w} > form > table > tbody > tr:has(#fileUpload) {
  grid-area: file;
  align-self: stretch;
}

${w} > form > table > tbody > tr:has(#fileUpload) > td {
  height: 100%;
}

${w} > form > table > tbody > tr:has(#txtSource) {
  grid-area: source;
}

${w} > form > table > tbody > tr:has(#txtTitle) {
  grid-area: title;
}

${w} > form > table > tbody > tr:has(#tags) {
  grid-area: tags;
}

${w} > form > table > tbody > tr:has(input[name="rating"]) {
  grid-area: rating;
}

${w} > form > table > tbody > tr:has(#my-tags) {
  grid-area: mytags;
}

/* The video upload (from Kaze, 18.11.2026): its "My Tags" row is a line and
   the link "Edit" with no #my-tags, it has a row with nothing in it, and a
   row for the progress of the upload. Unplaced, the first stood under the
   file zone, in the left column. */
${w} > form > table > tbody > tr:has(> td > a):not(:has(input)):not(:has(textarea)):not(:has(button)):not(:has(#my-tags)) {
  grid-area: mytags;
}

${w} > form > table > tbody > tr:has(> td:only-child:empty) {
  display: none;
}

${w} > form > table > tbody > tr:has(> td#progress) {
  grid-column: 2;
}

/* The note the script moves into the row of the button on the video upload. */
${w} .${Gn} {
  color: ${k.muted};
  font-size: 12px;
  line-height: 1.5;
}

${w} .${Gn} > b {
  color: ${k.text};
}

/* The site's timing line under the form, a leftover of debugging. */
${v} div#content:has(> div#upload-form) > center {
  display: none;
}

${w} > form > table > tbody > tr:has(input[type="submit"]) {
  grid-area: submit;
  padding-top: 12px;
  border-top: 1px solid ${k.border};
}

/* The site leaves an empty row in the form. */
${w} > form > table > tbody > tr:has(> td[style*="300px"]:not(:has(*))) {
  display: none;
}

${w} #txtSource,
${w} #txtTitle,
${w} #tags {
  box-sizing: border-box;
  width: 100%;
  margin-top: 4px;
}

${w} div.awesomplete {
  display: block;
}

${w} #tags {
  min-height: 96px;
  resize: vertical;
}

/* Shown only while there are fewer tags than the site asks for: a quiet count
   at first, a warning once the field was left or the form was sent. */
${w} .${Yn} {
  margin: 4px 0 0;
  color: ${k.muted};
}

${w} .${Yn}.${Xn} {
  color: ${k.danger};
  font-weight: 600;
}

${w} .${Yn}[hidden] {
  display: none;
}

/* The user's own sets of tags: a row of small buttons under the field. */
${w} .rdw-upload-sets {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin: 8px 0 0;
}

${w} .rdw-upload-sets-label {
  color: ${k.muted};
}

${w} .rdw-upload-set {
  min-height: 26px;
  padding: 0 10px;
  border: 1px solid ${k.border};
  border-radius: 13px;
  background: ${k.surface2};
  color: ${k.text};
  font: inherit;
  cursor: pointer;
}

${w} .rdw-upload-set:hover {
  border-color: ${k.muted};
}

${w} .rdw-upload-sets-edit {
  padding: 0 4px;
  border: 0;
  background: transparent;
  color: ${k.accent};
  font: inherit;
  cursor: pointer;
}

${w} .rdw-upload-sets-edit:hover {
  text-decoration: underline;
}

/* The line breaks the site spaces the tags cell with leave holes in a card. */
${w} tr:has(#tags) > td > br:not(label + br) {
  display: none;
}

/* The guidelines: quiet text that can be folded away. */
${w} tr:has(h3) > td > div {
  margin: 0 !important;
}

${w} tr:has(h3) h3 {
  margin: 0 0 4px;
  color: ${k.text};
  font-size: 14px;
}

${w} tr:has(h3) h4 {
  margin: 6px 0;
  color: ${k.text};
  font-size: 12px;
}

${w} tr:has(h3) br {
  display: none;
}

${w} tr:has(h3) ul {
  margin: 0;
  padding-left: 18px;
}

${w} td.${Qn} > div {
  display: none;
}

${w} button.${Zn} {
  float: right;
  margin: 0 0 4px 12px;
  padding: 0;
  border: 0;
  background: none;
  color: ${k.accent};
  font: 12px ${k.font};
  cursor: pointer;
}

${w} td.${Qn} > button.${Zn} {
  float: none;
  margin: 0;
}

/*
 * The file zone, once the script has dressed it (it adds the hint). The
 * site's field lies over the whole zone and is not drawn: a click anywhere
 * opens the file dialog, and a dropped file lands in the field itself.
 */
${w} td:has(> .${T}) {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-sizing: border-box;
  min-height: 240px;
  height: 100%;
  padding: 16px;
  border: 1px dashed ${k.border};
  border-radius: ${k.radiusL};
  background: ${k.surface2};
  text-align: center;
}

${w} td:has(> .${T}):hover,
${w} td.${Vn}:has(> .${T}) {
  border-color: ${k.accent};
}

${w} td:has(> .${T}) > br {
  display: none;
}

/* "Image File:" is said by the zone itself; the label stays for screen readers. */
${w} td:has(> .${T}) > label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}

${w} td:has(> .${T}) > #fileUpload {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

${w} td:has(> .${T})::before {
  content: "";
  width: 28px;
  height: 28px;
  background: ${k.muted};
  -webkit-mask: ${$n};
  mask: ${$n};
}

${w} td.${Hn}:has(> .${T})::before {
  display: none;
}

${w} td:has(> .${T}):has(> #fileUpload:focus-visible) {
  outline: 2px solid ${k.accent};
  outline-offset: 2px;
}

${w} .${T} {
  font-size: 13px;
}

${w} .${Un} {
  color: ${k.text};
  font-size: 13px;
  font-weight: 600;
  overflow-wrap: anywhere;
}

/* As large as the column lets it be: the zone grows with the picture. */
${w} img.${Wn} {
  max-width: 100%;
  height: auto;
  border-radius: ${k.radiusM};
}

${w} img.${Wn}[hidden] {
  display: none;
}

/* Once a file is chosen the hint is of no use; the button that takes it out is. */
${w} td.${Hn} > .${T} {
  display: none;
}

${w} .${qn} {
  position: relative;
  display: inline-block;
  max-width: 100%;
  line-height: 0;
}

/* A file that is not a picture has none: the cross goes to the corner of the zone. */
${w} .${qn}:has(> img[hidden]) {
  position: static;
}

/* A round cross in the top right corner, above the field that covers the zone. */
${w} button.${E} {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  width: 28px;
  height: 28px;
  min-height: 0;
  padding: 0;
  border: 1px solid ${k.border};
  border-radius: 50%;
  background: ${k.surface};
  cursor: pointer;
}

${w} button.${E}::before {
  content: "";
  position: absolute;
  inset: 6px;
  background: ${k.text};
  -webkit-mask: ${Jn};
  mask: ${Jn};
}

${w} button.${E}:hover {
  border-color: ${k.danger};
}

${w} button.${E}:hover::before {
  background: ${k.danger};
}

${w} button.${E}[hidden] {
  display: none;
}

/* Rating: the two radio buttons drawn as one switch of options. */
${w} input[name="rating"] {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

${w} input[name="rating"] + label {
  display: inline-flex;
  align-items: center;
  height: 30px;
  margin-top: 4px;
  padding: 0 14px;
  border: 1px solid ${k.border};
  background: var(${h.segTrack});
  color: var(${h.segText});
  font-size: 13px;
  cursor: pointer;
}

${w} input[name="rating"]:first-of-type + label {
  border-radius: ${k.radiusM} 0 0 ${k.radiusM};
}

${w} input[name="rating"]:last-of-type + label {
  margin-left: -1px;
  border-radius: 0 ${k.radiusM} ${k.radiusM} 0;
}

${w} input[name="rating"]:checked + label {
  background: var(${h.segOn});
  color: var(${h.segOnText});
  font-weight: 600;
}

${w} input[name="rating"]:focus-visible + label {
  outline: 2px solid ${k.accent};
  outline-offset: 2px;
}

/* The note above the button is the site's bold paragraph: readable, not shouting. */
${w} tr:has(input[type="submit"]) > td > b:first-of-type {
  font-weight: normal;
}

${w} tr:has(input[type="submit"]) br {
  display: none;
}

${w} tr:has(input[type="submit"]) input[type="submit"] {
  display: block;
  min-width: 160px;
  height: 36px;
  margin: 10px 0 12px;
  padding: 0 20px;
  border: 1px solid ${k.accent};
  border-radius: ${k.radiusM};
  background: ${k.accent};
  color: ${k.surface};
  font: 600 14px ${k.font};
  cursor: pointer;
}

@media (max-width: 860px) {
  ${w} > form > table > tbody {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: none;
    grid-template-areas:
      "guide"
      "file"
      "source"
      "tags"
      "rating"
      "title"
      "mytags"
      "submit";
  }
}

/*
 * —— forum ——
 * The list of topics (div#forum without .response-list): every row of the
 * site's table is laid out as a card by a grid, cell by cell. The table and
 * its cells stay where they are; only how they are drawn changes.
 *   td 1 title · td 2 created by · td 3 updated · td 4 updated by · td 5 replies
 */
${D} > table.highlightable {
  display: block;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  overflow: visible;
}

/* Kept for screen readers: the cards say what each number is by themselves. */
${D} > table.highlightable > thead {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}

${D} > table.highlightable > tbody {
  display: grid;
  gap: 6px;
}

${D} > table.highlightable > tbody > tr {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 110px 190px;
  grid-template-areas:
    "title replies updated"
    "by replies updatedby";
  column-gap: 16px;
  row-gap: 2px;
  align-items: center;
  padding: 10px 14px;
  background: ${k.surface};
  border: 1px solid ${k.border};
  border-radius: ${k.radiusL};
  cursor: pointer;
}

${D} > table.highlightable > tbody > tr:hover {
  background: ${k.surface};
  border-color: ${k.accent};
}

${D} > table.highlightable > tbody > tr > td {
  display: block;
  min-width: 0;
  padding: 0;
  border: 0;
  color: ${k.muted};
  font-size: 12px;
  text-align: right;
}

${D} > table.highlightable > tbody > tr > td:nth-child(1) {
  grid-area: title;
  color: ${k.text};
  font-size: 14px;
  text-align: left;
  overflow-wrap: anywhere;
}

${D} > table.highlightable > tbody > tr > td:nth-child(2) {
  grid-area: by;
  text-align: left;
}

${D} > table.highlightable > tbody > tr > td:nth-child(2)::before {
  content: "Started by ";
}

${D} > table.highlightable > tbody > tr > td:nth-child(3) {
  grid-area: updated;
}

${D} > table.highlightable > tbody > tr > td:nth-child(4) {
  grid-area: updatedby;
}

${D} > table.highlightable > tbody > tr > td:nth-child(4)::before {
  content: "by ";
}

/* A topic nobody has answered has no "updated by". */
${D} > table.highlightable > tbody > tr > td.${ir} {
  visibility: hidden;
}

${D} > table.highlightable > tbody > tr > td:nth-child(5) {
  grid-area: replies;
  font-size: 13px;
}

${D} > table.highlightable > tbody > tr > td[${ar}]::after {
  content: " " attr(${ar});
}

${D} span.forum-topic a {
  color: ${k.text};
  font-weight: 600;
}

${D} span.forum-topic a:hover {
  color: ${k.accent};
}

${D} span.locked-topic {
  display: inline-block;
  margin-left: 6px;
  padding: 0 7px;
  border: 1px solid ${k.border};
  border-radius: 999px;
  color: ${k.muted};
  font-size: 11px;
  line-height: 16px;
  white-space: nowrap;
  vertical-align: middle;
}

${D} .${rr} {
  display: inline-block;
  width: 14px;
  height: 14px;
  margin-right: 6px;
  background: ${k.muted};
  -webkit-mask: ${ur};
  mask: ${ur};
  vertical-align: -2px;
}

/* The search: a magnifier in the field and a button that clears it. */
${D} form.${or} {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 560px;
}

${D} form.${or}::before {
  content: "";
  position: absolute;
  left: 9px;
  top: 50%;
  z-index: 1;
  width: 14px;
  height: 14px;
  transform: translateY(-50%);
  background: ${k.muted};
  -webkit-mask: ${cr};
  mask: ${cr};
  pointer-events: none;
}

${D} form.${or} > input[name="search"] {
  flex: 1 1 auto;
  width: auto !important;
  min-width: 0;
  padding-left: 30px;
  padding-right: 30px;
}

/* Pulled back over the right end of the field. */
${D} button.${sr} {
  flex: none;
  width: 22px;
  height: 22px;
  margin: 0 0 0 -34px;
  padding: 0;
  border: 0;
  border-radius: ${k.radiusS};
  background: ${k.muted};
  -webkit-mask: ${lr};
  mask: ${lr};
  cursor: pointer;
}

${D} button.${sr}:hover {
  background: ${k.text};
}

${D} button.${sr}[hidden] {
  display: none;
}

${D} .${nr} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 0 0 10px;
}

${D}.${tr} > table.highlightable > tbody > tr:not(.${er}) {
  display: none;
}

@media (max-width: 900px) {
  ${D} > table.highlightable > tbody > tr {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      "title replies"
      "by updated"
      "by updatedby";
  }
}

/*
 * A topic (div#forum.response-list): every post is a card. The author and the
 * date go into one line above the text instead of a column beside it.
 */
${O} {
  display: grid;
  gap: 8px;
  max-width: ${String($t)}px;
}

${O} > div.post {
  display: block;
  float: none;
  max-width: none;
  margin: 0;
  padding: 12px 14px;
  background: ${k.surface};
  border: 1px solid ${k.border};
  border-radius: ${k.radiusL};
}

${O} > div.post > div.author {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 2px 10px;
  float: none;
  width: auto;
  margin: 0 0 6px;
  padding: 0;
}

${O} > div.post > div.author > h6.author {
  margin: 0;
  padding: 0;
  font-size: 13px;
  font-weight: 700;
}

${O} > div.post > div.author > h6.author a {
  color: ${k.text};
}

${O} > div.post > div.author > span.date {
  color: ${k.muted};
  font-size: 12px;
}

/* The card is the post; the text block inside it has no frame of its own. */
${O} > div.post > div.content {
  float: none;
  width: auto;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

/* The site puts two line breaks after a quote; the quote has its own margin. */
${O} > div.post > div.content > div.body div.quote + br,
${O} > div.post > div.content > div.body div.quote + br + br {
  display: none;
}

${O} > div.post > div.content > h6.response-title {
  margin: 0 0 6px;
  padding: 0;
  color: ${k.text};
  font-size: 14px;
  font-weight: 700;
}

${O} > div.post > div.content > h6.response-title:empty {
  display: none;
}

${O} > div.post > div.content > div.body {
  color: ${k.text};
  font-size: 14px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

${O} > div.post > div.content > div.body div.quote {
  margin: 6px 0;
  padding: 4px 10px;
  border-left: 2px solid ${k.border};
  border-radius: 0 ${k.radiusS} ${k.radiusS} 0;
  background: ${k.surface2};
  color: ${k.muted};
  font-size: 13px;
}

/* The bar between "quote" and "link" is a bare character: the links are
   spaced by their own padding instead. */
${O} > div.post > div.content > div.footer {
  margin: 8px 0 0 -6px;
  font-size: 0;
}

${O} > div.post > div.content > div.footer a {
  font-size: 12px;
}

${O} > div.post > div.content > div.footer br {
  display: none;
}

${O} > div.content {
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}

/* The reply form, shown by the site's "Respond": a card as wide as the posts. */
${O} > div.content > div#reply {
  padding: 12px 14px;
  background: ${k.surface};
  border: 1px solid ${k.border};
  border-radius: ${k.radiusL};
}

${O} > div.content > div#reply table {
  width: 100%;
  border: 0;
  background: transparent;
}

${O} > div.content > div#reply tr {
  background: transparent;
}

${O} > div.content > div#reply td {
  padding: 0 0 8px;
  border: 0;
  color: ${k.muted};
  font-size: 12px;
}

/* A row that holds only a hidden field takes no room. */
${O} > div.content > div#reply td:not(:has(input:not([type="hidden"]))):not(:has(textarea)) {
  padding: 0;
}

${O} > div.content > div#reply input[type="text"],
${O} > div.content > div#reply textarea {
  box-sizing: border-box;
  width: 100%;
  margin-top: 4px;
}

${O} > div.content > div#reply textarea {
  min-height: 140px;
  resize: vertical;
}

${v} .added-tags {
  color: ${k.tagCharacter};
}

${v} .removed-tags {
  color: ${k.danger};
}

${v} .obsolete-tag-change {
  color: ${k.text};
}

/* —— notices / cards —— */
${v} div.status-notice,
${v} div.notice,
${v} div.has-mail,
${v} div.blocked,
${v} div.quote,
${v} div.help div.code,
${v} div#post-comments div#comment-list > div,
${v} div#comments div#comment-list > div.post > div.col2,
${v} div.response-list > div.post > div.content {
  background: ${k.surface};
  border: 1px solid ${k.border};
  border-radius: ${k.radiusL};
  box-shadow: ${k.shadow1};
}

${v} div.status-notice {
  border-color: ${k.border};
  padding: 1em;
  margin: 1em;
  color: ${k.text};
}

/* In the row of a post a notice stands over the picture, beside the panel:
   it begins where the panel begins and is as wide as the picture. With the
   margin of a notice it was lower than the panel and narrower than the
   picture (Kaze, 19.11.2026, the "previous / next" strip). */
${v} div#post-view div.flexi div.status-notice {
  margin: 0 0 12px;
}

${v} div.notice {
  color: ${k.danger};
  padding: 0.75em 1em;
  margin-bottom: 1em;
}

/*
 * The site's message to the user (from Kaze, 18.11.2026) is div#notice, the
 * first thing in the body: "You can only cum once a day" and the like. In the
 * flow it stood as a bar over the whole page and pushed the header of the
 * panel and the picture down. It is a small plate at the bottom of the window,
 * over the page, and moves nothing. The script takes it away after a time
 * or on a click (site/site-notice.ts).
 */
${v} body > div#notice.notice {
  position: fixed;
  left: 50%;
  bottom: 20px;
  z-index: 30;
  transform: translateX(-50%);
  box-sizing: border-box;
  max-width: min(560px, calc(100vw - 32px));
  margin: 0;
  padding: 10px 16px;
  color: ${k.text};
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  text-align: center;
  box-shadow: ${k.shadow2};
}

${v} body > div#notice.notice {
  cursor: pointer;
}

${v} body > div#notice.notice:empty,
${v} body > div#notice.notice.${Kn} {
  display: none;
}

${v} div.has-mail {
  border-color: ${k.tagCharacter};
  background: ${k.accentSoft};
  padding: 1em;
  margin: 1em;
  color: ${k.text};
}

${v} div.blocked {
  border-color: ${k.danger};
  background: ${k.dangerSoft};
  color: ${k.danger};
  padding: 1em;
  margin: 1em;
}

${v} div.quote {
  border-color: ${k.border};
  background: ${k.surface2};
  background-image: none;
  color: ${k.text};
  padding: 12px;
  margin-top: 10px;
}

${v} div.help div.code {
  border: 1px dashed ${k.border};
  background: ${k.surface2};
  color: ${k.text};
}

${v} div.help h4 {
  color: ${k.tagCharacter};
}

${v} div#post-comments div#comment-list > div,
${v} div#comments div#comment-list > div.post > div.col2 {
  padding: 12px;
  margin-bottom: 1em;
}

${v} div.response-list > div.post > div.content {
  padding: 10px 12px;
}

${v} div.response-list > div.post > div.content > div.footer {
  color: ${k.muted};
  margin-top: 0.75em;
}

/* Edit | Respond (and similar) on comments / forum posts */
${v} div.response-list > div.post > div.content > div.footer a,
${v} ul.flat-list li a {
  color: ${k.muted};
  font-weight: normal;
  padding: 2px 6px;
  border-radius: ${k.radiusS};
}

${v} div.response-list > div.post > div.content > div.footer a:hover,
${v} ul.flat-list li a:hover {
  color: ${k.accent};
  background: ${k.accentSoft};
}

${v} ul.flat-list li a.forum-update {
  font-style: italic;
  color: ${k.muted};
}

${v} div.link-list ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

${v} div.link-list li {
  margin: 0 0 4px;
}

${v} div.link-list a {
  display: inline-block;
  padding: 4px 8px;
  border-radius: ${k.radiusS};
  color: ${k.muted};
}

${v} div.link-list a:hover {
  color: ${k.accent};
  background: ${k.accentSoft};
}

${v} span.author,
${v} span.date {
  color: ${k.muted};
}

${v} span.locked-topic {
  color: ${k.muted};
}

${v} strong.divider {
  color: ${k.muted};
}

${v} div#footer {
  color: ${k.muted};
}

${v} div#footer > .footer-disabled,
${v} div#footer > #label {
  color: ${k.muted};
}

${v} div#user-record > table > tbody > tr.positive-record {
  background: ${k.accentSoft};
}

${v} div#user-record > table > tbody > tr.negative-record {
  background: ${k.dangerSoft};
}

${v} div.mailbody {
  background-color: ${k.surface};
  border-color: ${k.border};
}

${v} div.mail .received {
  color: ${k.tagCharacter};
}

${v} div.mail .sent {
  color: ${k.danger};
}

${v} .gdprinner {
  background-color: ${k.surface};
  border-color: ${k.border};
  color: ${k.text};
}

/* —— post page —— */
/* E: hide native left-column chrome only while body.rdw-post-panel-mounted */
${v} body.${un} div#stats {
  display: none !important;
}

${v} body.${un} div.link-list {
  display: none !important;
}

${v} body.${un} ${dn} {
  display: none !important;
}

/*
 * Comments of a post (markup from Kaze, 18.11.2026). The line about the order
 * is the site's div holding the link "Change", among the comments: not a card, a small
 * grey line. A comment keeps its card; the bold line of score, "Up" and
 * "Report comment" is small and grey, and the rule after each comment and the
 * line breaks between them go.
 */
${v} div#post-comments div#comment-list > div:not([id]) {
  padding: 0;
  margin: 0 0 8px;
  border: 0;
  background: transparent;
  box-shadow: none;
  color: ${k.muted};
  font-size: 12px;
}

${v} div#post-comments div#comment-list > br,
${v} div#post-comments div#comment-list > div[id] > hr,
${v} div#post-comments div#comment-list > a#ci[hidden] {
  display: none;
}

${v} div#post-comments div#comment-list > div[id] > div.col1 > b {
  display: block;
  margin-top: 2px;
  color: ${k.muted};
  font-size: 11.5px;
  font-weight: normal;
}

${v} div#post-comments div#comment-list > div[id] > div.col1 > span {
  color: ${k.muted};
  font-size: 11.5px;
}

/* The site's "Edit | Respond" under the picture: two links, not the loudest
   heading of the page. The script marks the line. */
${v} .rdw-post-reply-links {
  margin: 8px 0;
  color: ${k.muted};
  font: 12.5px ${k.font};
  font-weight: normal;
}

/*
 * The site's "New Account Safety Check" (markup from Kaze, 18.11.2026): shown
 * on "Respond" to an account that has not commented yet. It is light green
 * with a dark blue button whatever the theme. Only its colours are changed:
 * what it asks, its checkbox and its two buttons are the site's.
 */
${v} div#new_user_modal {
  background: ${k.surface};
  border: 1px solid ${k.border};
  border-radius: ${k.radiusL};
  box-shadow: ${k.shadow2};
  color: ${k.text};
  font: 13px/1.5 ${k.font};
}

${v} div#new_user_modal > h2 {
  margin: 0 0 8px;
  color: ${k.text};
  font-size: 16px;
}

${v} div#new_user_modal > p,
${v} div#new_user_modal > ul,
${v} div#new_user_modal > label {
  color: ${k.text};
}

/* The site sets this line red in its own style attribute. */
${v} div#new_user_modal > p[style] {
  color: ${k.danger} !important;
}

${v} div#new_user_modal button {
  height: 32px;
  margin: 0 4px;
  padding: 0 14px;
  border: 1px solid ${k.border};
  border-radius: ${k.radiusM};
  background: ${k.surface};
  color: ${k.text};
  font: 600 13px ${k.font};
  cursor: pointer;
}

${v} div#new_user_modal button#confirm_agree_btn {
  border-color: ${k.accent};
  background: ${k.accent};
  color: ${k.surface};
}

/* The site's form for a comment, brought into the panel under the comments. */
${v} #${S} form#comment_form table {
  width: 100%;
  border: 0;
  background: transparent;
}

${v} #${S} form#comment_form tr {
  background: transparent;
}

${v} #${S} form#comment_form td {
  padding: 0 0 6px;
  border: 0;
}

${v} #${S} form#comment_form td:empty {
  display: none;
}

${v} #${S} form#comment_form textarea {
  box-sizing: border-box;
  width: 100%;
  min-height: 96px;
}

${v} .rdw-post-panel-comments-empty {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  color: ${k.muted};
  font: 12.5px ${k.font};
}

/*
 * A: comments moved into the panel column — lift site max-width: 680px
 * so #post-comments fills the narrow column.
 */
${v} body.${un} #${S} #post-comments {
  max-width: none;
}

${v} img#image {
  border-radius: ${k.radiusL};
}

${v} div#post-view > div#right-col > div#edit,
${v} div#edit-box {
  background: ${k.surface};
  border: 1px solid ${k.border};
  border-radius: ${k.radiusL};
  color: ${k.text};
}

${v} div#note-container > div.note-body {
  background: ${k.surface};
  border: 1px solid ${k.border};
  color: ${k.text};
  border-radius: ${k.radiusS};
}

${v} div#note-container > div.note-body > p.tn,
${v} tn {
  color: ${k.muted};
}

${v} div#note-container > div.note-box {
  border-color: ${k.accent};
  background: ${k.accentSoft};
}

${v} div#note-container > div.note-box > div.note-corner {
  background: ${k.accent};
}

${v} div#note-container > div.unsaved {
  background: ${k.surface};
  border-color: ${k.danger};
}

${v} div#note-container > div.unsaved > div.note-corner {
  background: ${k.danger};
}

${v} a.original-file-changed#highres {
  color: ${k.accent};
}

${v} div#post-add p#scale {
  color: ${k.muted};
}

${v} h2.wiki-title {
  color: ${k.accent};
}

${v} div.wiki > h2.title {
  color: ${k.accent};
}

${v} div#wiki-show > div#body > div#byline {
  color: ${k.muted};
}

${v} div#wiki-diff del {
  background-color: ${k.dangerSoft};
  color: ${k.danger};
}

${v} div#wiki-diff ins {
  background-color: ${k.accentSoft};
  color: ${k.text};
}

${v} dt.bad {
  color: ${k.danger};
}

${v} .blacklisted-tags-disabled {
  color: ${k.muted} !important;
}

/* —— dark theme contrast (tokens already dark; keep chrome readable) —— */
${b} a:hover,
${b} a:active {
  color: ${k.text};
}

${b} a.spoiler,
${b} span.spoiler {
  color: ${k.bg};
  background: ${k.text};
}

${b} a.spoiler:hover,
${b} span.spoiler:hover {
  color: ${k.text};
  background: ${k.muted};
}

${b} div#paginator a.current,
${b} div#paginator span.current,
${b} .pagination a.current,
${b} .pagination span.current,
${b} div.tag-search input[type="submit"],
${b} div.tag-search button[type="submit"],
${b} .manual-page-chooser > input[type="submit"],
${b} span.thumb > .${An},
${b} #${S} .${xn}.${En}${Dn} {
  color: ${k.text};
}

${b} div.has-mail {
  background: ${k.surface2};
  border-color: ${k.tagCharacter};
}

/*
 * Post panel actions + tabs (A→E HANDOFF).
 * Unscoped under #rdw-post-actions so Site default/Site dark (no html.rdw-skin)
 * still beat native button/link chrome via document --rdw-* tokens.
 */
#${S} .${yn},
#${S} .${bn},
#${S} .${Cn} {
  color: ${k.text};
}

#${S} .${xn}.${En}${Dn} {
  background: ${k.accent};
  border-color: ${k.accent};
  color: ${k.surface};
}

#${S} .${Sn} {
  box-sizing: border-box;
  width: ${String(_n)}px;
  height: ${String(_n)}px;
  min-width: ${String(_n)}px;
  min-height: ${String(_n)}px;
  background: ${k.surface};
  border: 1px solid ${k.border};
  color: ${k.text};
  text-decoration: none;
}

#${S} .${Tn} {
  border-bottom: 1px solid ${k.border};
  color: ${k.text};
}

#${S} .${C} {
  background: transparent;
  border: 0;
  border-bottom: ${String(vn)}px solid transparent;
  color: ${k.muted};
}

#${S} .${C}[aria-selected="true"] {
  color: ${k.text};
  font-weight: 600;
  border-bottom-color: ${k.accent};
}

#${S} .${wn} {
  background: ${k.surface};
  border: 1px solid ${k.border};
  color: ${k.text};
  justify-content: flex-start;
}

/* Site themes: muted fails AA on green/dark chrome — tabs use text; keep accent underline. */
${Jt} #${S} .${C},
${Yt} #${S} .${C} {
  color: ${k.text};
}

${Jt} #${S} .${C}[aria-selected="true"],
${Yt} #${S} .${C}[aria-selected="true"] {
  border-bottom-color: ${k.accent};
  color: ${k.text};
}

/* Dark RuleDesk: primary fill uses light label (surface token is dark). */
${Xt} #${S} .${xn}.${En}${Dn} {
  color: ${k.text};
}

/*
 * Own scrollable UI — tokens for all four themes (site/site-dark have no html.rdw-skin).
 * Fixes white post-column scrollbar on dark. Kit lists/dialogs + playlist menu.
 */
#${S},
.${fn},
.${pn},
.${mn},
.${hn} {
  scrollbar-width: ${gn};
  scrollbar-color: ${k.border} ${k.surface};
}

/* Site autocomplete lists under rdw-skin */
${v} .awesomplete > ul:not([hidden]):not(:empty),
${v} div.auto_complete ul {
  scrollbar-width: ${gn};
  scrollbar-color: ${k.border} ${k.surface};
}

/*
 * Script page host sits on site bg for Site default / Site dark (no html.rdw-skin).
 * Color uses document tokens; Shadow title inherits from the host once tokens sync.
 */
#${et} {
  color: ${k.text};
}
`.trim();function fr(){return dr}var pr=864e5,mr=`=`,hr=`stylesheet`,gr=`${Me}${Ne}`,_r=`${Me}${Pe}`;function vr(e,t){document.cookie=[`${ke}${mr}${e}`,`expires=${t.toUTCString()}`,`path=/`].join(`; `);}function yr(){document.cookie=[`${ke}${mr}`,`expires=${new Date(0).toUTCString()}`,`path=/`].join(`; `);}var br=/\/{2,}/g;function xr(e){return e.replace(br,`/`)}function Sr(e){try{let t=xr(new URL(e,location.href).pathname);return t===gr||t===_r}catch{return  false}}function Cr(e){return e===`dark`?Pe:Ne}function wr(e,t){return e.includes(`desktop-dark.css`)?e.replace(Pe,t):e.includes(`desktop.css`)?e.replace(Ne,t):e}function Tr(){let e=document.querySelectorAll(`link[rel="${hr}"]`);for(let t of e){let e=t.getAttribute(`href`);if(e!==null&&e.length!==0&&Sr(e))return t}return null}var Er=`Site desktop stylesheet link not found; theme cookie updated only`,Dr=`loading`,Or=`DOMContentLoaded`,kr={childList:true,subtree:true},A=null,j=null,Ar=false;function jr(e,t){let n=e.getAttribute(`href`);return n===null||n.length===0?false:(e.setAttribute(`href`,wr(n,Cr(t))),true)}function Mr(){j!==null&&(j.disconnect(),j=null),Ar&&=(document.removeEventListener(Or,Pr),false);}function Nr(){if(A===null)return  false;let e=Tr();return e===null||!jr(e,A)?false:(A=null,Mr(),true)}function Pr(){Ar=false,Nr()||A!==null&&(m.warn(Er),A=null,Mr());}function Fr(){m.warn(Er),A=null,Mr();}function Ir(e){let t=Tr();if(t!==null&&jr(t,e)){A=null,Mr();return}if(A=e,document.readyState!==Dr){Fr();return}let n=document.documentElement;j===null&&n!==null&&(j=new MutationObserver(()=>{Nr();}),j.observe(n,kr)),Ar||=(document.addEventListener(Or,Pr),true);}function Lr(e){if(e===`dark`){let e=new Date(Date.now()+365*pr);vr(Ae,e);}else yr();}function Rr(){Lr(`light`),Ir(`light`);}function zr(e){Lr(e),Ir(e);}var Br=.8,Vr=.85,Hr=.05,Ur=`image/jpeg`,Wr=`background-image`,Gr=`background-size`,Kr=`background-position`,qr=`background-repeat`,Jr=`background-attachment`,Yr=`#cc0000`,Xr=`#00aa00`,Zr=`#aa00aa`,Qr=`#ff8800`,$r=In$1,ei=`#f0a0a0`,ti=`#f0f0a0`,ni=`#f0a0f0`,ri=`#90d9ed`,ii=`#74bc6b`,ai=`#333333`,oi=`#e6e6e6`,si={bg:On$1,surface:On$1,surface2:An$1,border:kn$1,text:jn$1,muted:Nn$1,accent:Mn$1,accentSoft:kn$1,danger:fn$1.danger,dangerSoft:fn$1.dangerSoft,warn:fn$1.warn,warnSoft:fn$1.warnSoft,tagArtist:Yr,tagCharacter:Xr,tagCopyright:Zr,tagMetadata:Qr,radiusS:fn$1.radiusS,radiusM:fn$1.radiusM,radiusL:fn$1.radiusL,shadow1:fn$1.shadow1,shadow2:fn$1.shadow2,font:fn$1.font,segTrack:ii,segText:ai,segOn:On$1,segOnText:jn$1},ci={bg:Pn$1,surface:Pn$1,surface2:Fn$1,border:In$1,text:Ln$1,muted:zn$1,accent:Rn$1,accentSoft:$r,danger:pn$1.danger,dangerSoft:pn$1.dangerSoft,warn:pn$1.warn,warnSoft:pn$1.warnSoft,tagArtist:ei,tagCharacter:ti,tagCopyright:ni,tagMetadata:ri,radiusS:pn$1.radiusS,radiusM:pn$1.radiusM,radiusL:pn$1.radiusL,shadow1:pn$1.shadow1,shadow2:pn$1.shadow2,font:pn$1.font,segTrack:`transparent`,segText:zn$1,segOn:In$1,segOnText:oi};function li(e,t,n){let r=hi(t,e);if(r!==null&&r>=4.5)return {text:t,ratio:r,swapped:false};for(let t of n){let n=hi(t,e);if(n!==null&&n>=4.5)return {text:t,ratio:n,swapped:true}}return {text:t,ratio:r,swapped:false}}function ui(e){let t=li(e.surface,e.text,[e.bg,e.muted,e.accent,fn$1.text,pn$1.text]);return t.swapped?{...e,text:t.text}:e}var di=ui(si),fi=ui(ci);function pi(){return {base:ca$1,backgroundDim:0}}function mi(e){return Number.isFinite(e)?Math.min(Br,Math.max(0,e)):0}function hi(e,t){let n=En$1(e),r=En$1(t);if(n===null||r===null)return null;let i=Math.max(n,r),a=Math.min(n,r);return (i+Hr)/(a+Hr)}function gi(e){let t=e.theme;return t===`site-dark`?fi:t===`site`?di:t===`dark`||t===`custom`&&e.custom?.base===`dark`?pn$1:fn$1}function _i(e){return e.replace(/\\/g,`\\\\`).replace(/"/g,`\\"`)}function vi(){let e=document.body;e!==null&&(e.style.removeProperty(Wr),e.style.removeProperty(Gr),e.style.removeProperty(Kr),e.style.removeProperty(qr),e.style.removeProperty(Jr));}function yi(e,t){let n=document.body;if(n===null)return;if(e===void 0||e.length===0){vi();return}let r=mi(t),i=_i(e);n.style.setProperty(Wr,`linear-gradient(rgba(0, 0, 0, ${String(r)}), rgba(0, 0, 0, ${String(r)})), url("${i}")`),n.style.setProperty(Gr,`cover`),n.style.setProperty(Kr,`center`),n.style.setProperty(qr,`no-repeat`),n.style.setProperty(Jr,`fixed`);}function bi(e){e.theme===`site-dark`?zr(`dark`):e.theme===`site`?zr(`light`):Rr();}function xi(){let e=Number.isFinite(window.devicePixelRatio)&&window.devicePixelRatio>0?window.devicePixelRatio:1;return {width:Math.round(window.screen.width*e),height:Math.round(window.screen.height*e)}}function Si(e,t,n,r){if(!Number.isFinite(e)||!Number.isFinite(t)||e<=0||t<=0)return {width:0,height:0};if(e<=n&&t<=r)return {width:Math.round(e),height:Math.round(t)};let i=Math.min(n/e,r/t);return {width:Math.max(1,Math.round(e*i)),height:Math.max(1,Math.round(t*i))}}function Ci(e){return new Promise((t,n)=>{let r=new Image;r.onload=()=>{t(r);},r.onerror=()=>{n(Error(`Could not decode image`));},r.src=e;})}function wi(e){return new Promise((t,n)=>{let r=new FileReader;r.onload=()=>{typeof r.result==`string`?t(r.result):n(Error(`Could not read image file`));},r.onerror=()=>{n(r.error??Error(`Could not read image file`));},r.readAsDataURL(e);})}async function Ti(e){let t=await Ci(await wi(e)),n=t.naturalWidth,r=t.naturalHeight,i=xi(),a=Si(n,r,i.width,i.height),o=document.createElement(`canvas`);o.width=a.width,o.height=a.height;let s=o.getContext(`2d`);if(s===null)throw Error(`Could not prepare background image`);return s.drawImage(t,0,0,a.width,a.height),{dataUrl:o.toDataURL(Ur,Vr),sourceWidth:n,sourceHeight:r,outputWidth:a.width,outputHeight:a.height,belowScreen:n<i.width||r<i.height}}function Ei(e){let{appearance:t}=e;bi(t),Ni({appearance:t,siteSkinCss:e.siteSkinCss??fr(),...e.backgroundDataUrl===void 0?{}:{backgroundDataUrl:e.backgroundDataUrl}});let n=gi(t);if(ki(n),Ai(n),Di(t.theme)||document.documentElement.classList.remove(c),t.theme===`custom`&&t.custom!==void 0){let n=t.custom;yi(e.backgroundDataUrl??n.backgroundImage,n.backgroundDim??0),n.backgroundDim!==void 0&&document.documentElement.style.setProperty(h.backgroundDim,String(mi(n.backgroundDim)));}else vi();let r=hi(n.text,n.surface);return {contrastWarning:r!==null&&r<4.5,contrastRatio:r}}function Di(e){return e===`light`||e===`dark`||e===`custom`}function M(e){let t=document.getElementById(e);if(t instanceof HTMLStyleElement)return t;t!==null&&t.remove();let n=document.createElement(`style`);return n.id=e,(document.head??document.documentElement).append(n),n}function Oi(e,t){e.textContent!==t&&(e.textContent=t);}function ki(e){let t=M(o);return Oi(t,qn$1(e,`:root`)),t}function Ai(e){let t=document.getElementById(et);t instanceof HTMLElement&&Jn$1(t,e);}function ji(e=``){let t=M(s);return Oi(t,e),t}function Mi(e){let t=document.documentElement;t.setAttribute(l,e),Di(e)?t.classList.add(c):t.classList.remove(c);}function Ni(e){let{appearance:t}=e;Mi(t.theme);let n=gi(t);ki(n),Ai(n),ji(e.siteSkinCss??``);let r=document.documentElement;Xn$1(r);let i=e.omitBackgroundImage===true,a=i?void 0:e.backgroundDataUrl??t.custom?.backgroundImage;if(t.theme===`custom`&&t.custom!==void 0){let e=a!==void 0&&a.length>0?{backgroundImage:a,...t.custom.backgroundDim===void 0?{}:{backgroundDim:t.custom.backgroundDim}}:{...t.custom.backgroundDim===void 0?{}:{backgroundDim:t.custom.backgroundDim}};Yn$1(r,e);}else !i&&e.backgroundDataUrl!==void 0&&e.backgroundDataUrl.length>0&&Yn$1(r,{backgroundImage:e.backgroundDataUrl});}var Pi=`light`,Fi=`dark`,Ii,Li=false;function N(e){return typeof e==`object`&&!!e&&!Array.isArray(e)}function Ri(){return GM_getValue}function zi(){return Li||=(Ii=Ri()(e,void 0),true),Ii}function Bi(e){return e===`site`?u:e===`site-dark`?d:e===`light`?f:e===`dark`?ee:e===`custom`?te:ne}function Vi(e){if(!N(e))return;let t=e.base,n={base:t===Fi||t===Pi?t:Pi};return typeof e.backgroundImage==`string`&&(n.backgroundImage=e.backgroundImage),typeof e.backgroundDim==`number`&&Number.isFinite(e.backgroundDim)&&(n.backgroundDim=e.backgroundDim),n}function Hi(e){if(!N(e))return {theme:ne};let t=e.settings;if(!N(t))return {theme:ne};let n=t.appearance;if(!N(n))return {theme:ne};let r=Bi(n.theme);if(r!==`custom`)return {theme:r};let i=Vi(n.custom);return i===void 0?{theme:r}:{theme:r,custom:i}}function Ui(){return Hi(zi())}function Wi(){let e=zi();if(!N(e)||!N(e.settings))return {tweaksEnabled:true,features:{},featureChoice:{}};let t=e.settings,n=typeof t.tweaksEnabled!=`boolean`||t.tweaksEnabled,r={};if(N(t.features))for(let[e,n]of Object.entries(t.features))typeof n==`boolean`&&(r[e]=n);let i={};if(N(t.featureChoice))for(let[e,n]of Object.entries(t.featureChoice))typeof n==`string`&&(i[e]=n);return {tweaksEnabled:n,features:r,featureChoice:i}}function Gi(e,t,n){if(!e.tweaksEnabled)return  false;let r=e.features[t];return r===void 0?n:r}function Ki(e,t,n,r){let i=e.featureChoice[t];return i!==void 0&&r.includes(i)?i:n}function qi(e){let t=zi();if(N(t)&&N(t.settings)&&N(t.settings.featureState))return t.settings.featureState[e]}function P(e){let t=new URLSearchParams(e),n=t.get(ce),r=t.get(`s`);return n===`post`&&r===`list`?`list`:n===`post`&&r===`view`?`post`:n===`favorites`&&r===`view`?`favorites`:`other`}function Ji(e){let t=new URLSearchParams(e),n=t.get(ce),r=t.get(`s`),i=t.get(`id`);return n!==`post`||r!==`view`||i===null||i.trim().length===0||!/^\d+$/.test(i)?null:i}function Yi(e){let t=e.theme===`site-dark`?`dark`:`light`;Lr(t),Ir(t);}function Xi(){if(Rt$1(window.location.hash)===null)return;let e=document.documentElement;if(e===null)return;let t=M(nt);t.textContent=zt$1(),e.classList.add($e);}function Zi(){let e=Ui();Ni({appearance:e,siteSkinCss:fr(),omitBackgroundImage:true}),Yi(e),Xi(),P(window.location.search)===`favorites`&&document.documentElement.classList.add(Vt$1);}var Qi=`grid-density`,$i=150,ea=250,ta=`default`,na=`compact`,ra=`large`;function ia(e,t){let n=qt$1(Qi,e);return [`body.${n} span.thumb,`,`body.${n} span.thumb > a {`,`  width: ${String(t)}px !important;`,`  height: ${String(t)}px !important;`,`}`,`body.${n} img.preview {`,`  max-width: ${String(t)}px !important;`,`  max-height: ${String(t)}px !important;`,`}`].join(`
`)}function aa(){return [`body.${Kt$1(Qi)} div.image-list {`,`  column-gap: 4px !important;`,`  row-gap: 4px !important;`,`}`].join(`
`)}var oa=exports("as",{id:Qi,label:`Grid size`,pages:[`list`,`favorites`],defaultEnabled:true,cssOnly:true,choice:{options:[{value:ta,label:`Default`},{value:na,label:`Compact (150)`},{value:ra,label:`Large (250)`}],defaultValue:ta},css:[ia(na,$i),ia(ra,ea),aa()].join(`
`),mount:()=>void 0}),sa=`sidebar-right`,ca=`motion`,la=Kt$1(ca),ua=`body.${Kt$1(sa)}`,F=`body.${la}`,I=`120ms`,da=`160ms`,L=`cubic-bezier(0.2, 0, 0, 1)`,fa=`translateY(-2px)`,pa=`
${ua} div#post-list > div.sidebar,
${ua} div#post-view > div.sidebar {
  order: 2;
  margin-right: 0 !important;
  margin-left: 1em;
}
${ua} div#post-list > div.content {
  flex: 1 1 auto;
  min-width: 0;
}
`.trim(),ma=[`.rdw-btn`,`.rdw-icon-btn`,`.rdw-seg__btn`,`.rdw-chip`,`.rdw-field__input`,`.rdw-switch__track`,`.rdw-switch__thumb`];function ha(e){return `${ma.map(t=>`${e} ${t}`).join(`,
`)} {
  transition:
    background-color ${I} ${L},
    border-color ${I} ${L},
    color ${I} ${L},
    opacity ${I} ${L},
    transform ${I} ${L};
}
${e} .rdw-btn:active,
${e} .rdw-icon-btn:active {
  transform: scale(0.97);
}`}var ga=`@keyframes rdw-appear {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: none; }
}
@keyframes rdw-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}`;function _a(e){return `${e} .rdw-popover {
  animation: rdw-appear ${da} ${L};
}
${e} .rdw-dialog-backdrop {
  animation: rdw-fade ${da} ${L};
}`}var va=`
@media (prefers-reduced-motion: no-preference) {
${ga}
${F} span.thumb img {
  transition: transform ${da} ${L}, opacity ${I} ${L};
}
/* Not a video thumb: its hover preview is laid over the picture by measured
   position, and a picture that moves would slip from under it. */
${F} span.thumb:not(.rdw-video-thumb):hover img:not(.webm-thumb) {
  transform: ${fa};
}
${F} div#header ul#navbar li a,
${F} div#header ul#navbar li button {
  transition: color ${I} ${L}, box-shadow ${I} ${L};
}
${ha(F)}
${_a(F)}
}
`.trim(),ya=`
@media (prefers-reduced-motion: no-preference) {
${ga}
${ha(`:host-context(${F})`)}
${_a(`:host-context(${F})`)}
}
`.trim(),ba={id:sa,label:`Sidebar on the right`,pages:[`list`,`post`],defaultEnabled:false,cssOnly:true,css:pa,mount:()=>void 0},xa={id:ca,label:`Motion`,pages:[`list`,`post`,`favorites`,`other`],defaultEnabled:true,cssOnly:true,settingsCaption:`Thumbnails lift under the pointer; buttons, menus and dialogs change smoothly.`,css:va,mount:()=>void 0},Sa=`menu-cleanup`,Ca=`Clean header menu`,wa=`content`,Ta=`rdw-menu-hidden`,Ea=Kt$1(Sa),Da=`Header menu not found`,Oa=new Set([`iCame Top 100`,`Discord`,`X`,`Other Sites`,`Contact Us`,`DMCA`,`About`,`TOS`,`My Favorites`]),ka=[`list`,`post`,`favorites`,`other`],Aa=`body.${Ea} li.${Ta} { display:none !important; }`; exports({bU:ya,ay:ba,az:xa});function ja(e,t){let n=e.closest(`li`);return !(n===null||t!==null&&t.contains(n))}function Ma(){let e=document.getElementById(wa),t=document.querySelectorAll(`a`),n=[];for(let r of t)r instanceof HTMLAnchorElement&&ja(r,e)&&n.push(r);return n}function Na(e){let t=Ma();if(t.length===0)m.warn(Da);else for(let e of t){let t=e.textContent?.trim()??``;if(!Oa.has(t))continue;let n=e.closest(`li`);n!==null&&n.classList.add(Ta);}}var Pa=exports("aq",{id:Sa,label:Ca,pages:[...ka],defaultEnabled:true,cssOnly:true,css:Aa,mount:Na}),Fa=new Set,Ia=null,La=``;function Ra(e){return Fa.has(e)}function za(){return Ia===null?null:{pageKind:Ia,search:La}}function Ba(e,t){Ia=e,La=t;}function Va(e){let t=`${Wt$1}${e.id}`;if(document.getElementById(t)!==null)return;let n=document.createElement(`style`);n.id=t,n.textContent=e.css,document.head.append(n);}function Ha(t,n,r){return {pageKind:n,search:r,getState:e=>e(Ic(t.id)),setState:n=>{Lc(t.id,n);}}}function Ua(e){if(e.choice!==void 0)for(let t of e.choice.options)document.body.classList.remove(qt$1(e.id,t.value));}function Wa(e,t,n){if(!Fa.has(e.id)&&e.pages.includes(t)){Fa.add(e.id);try{e.mount(Ha(e,t,n));}catch(t){m.error(`Feature mount failed: ${e.id}`,t);}}}function Ga(e,t,n,r={}){if(!Fa.has(e.id)&&e.pages.includes(t)){if(Ba(t,n),document.body.classList.add(Kt$1(e.id)),e.choice!==void 0){let t=r.choiceValue??(()=>{let t=Pc(e.id);return t!==void 0&&e.choice.options.some(e=>e.value===t)?t:e.choice.defaultValue})();Ua(e),document.body.classList.add(qt$1(e.id,t));}Va(e),Wa(e,t,n);}}function Ka(){return new Promise(e=>{setTimeout(e,0);})}var qa=`sticky-header`,Ja=`Keep the header and the sidebar in place while scrolling`,Ya=`rdw-sticky-header`,R=`rdw-sticky-header`,Xa=`--rdw-header-h`,Za=`var(${Xa}, 0px)`,Qa=`div#header`,$a=25,eo=`rdw-skin`,to=[`div#post-list > div.sidebar`,`div#post-view > div.sidebar`],no=8,ro=to.join(`, `),io=`--rdw-sidebar-foot`,ao=`rdw-sidebar-more`,oo=32,so=2,co=`
html.${R} ${Qa} {
  position: sticky;
  top: 0;
  z-index: ${String($a)};
}
/* The site's header has no background of its own: held at the top it would
   let the page show through. The skin gives its header one; without the skin
   (Site default, Site dark) it gets the colour of the page. */
html.${R}:not(.${eo}) ${Qa} {
  background: var(--rdw-bg);
}
html.${R} ${to[0]},
html.${R} ${to[1]} {
  position: sticky;
  top: calc(${Za} + ${String(no)}px);
  max-height: calc(100vh - ${Za} - 16px - var(${io}, 0px));
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--rdw-border) transparent;
}
/* A strip that stays at the bottom edge of the sidebar and fades its last
   lines into the page. Not a mask on the sidebar: a mask hides everything
   drawn from inside it that lies outside its box, and a dialog opened from
   the search panel is drawn in the middle of the window. */
html.${R} div.sidebar.${ao}::after {
  content: "";
  position: sticky;
  bottom: 0;
  display: block;
  height: ${String(oo)}px;
  margin-top: -${String(oo)}px;
  background: linear-gradient(to bottom, transparent, var(--rdw-bg));
  pointer-events: none;
}
`.trim(),z=null; exports({cN:qa,cF:Ja,cG:Ya,aR:Za});function lo(){let e=document.querySelector(Qa),t=document.documentElement;if(e===null||!t.classList.contains(`rdw-sticky-header`)){t.style.removeProperty(Xa);return}let n=Math.round(e.getBoundingClientRect().height);t.style.setProperty(Xa,`${String(n)}px`),fo();}function uo(){let e=document.querySelector(ro);return e instanceof HTMLElement?e:null}function fo(){let e=document.documentElement,t=uo(),n=t?.parentElement;if(t===null||n==null){e.style.removeProperty(io);return}V!==t&&document.documentElement.classList.contains(`rdw-sticky-header`)&&(V?.removeEventListener(`scroll`,B),V=t,t.addEventListener(`scroll`,B,{passive:true}));let r=0;for(let e of n.children)e!==t&&e instanceof HTMLElement&&(r=Math.max(r,e.offsetHeight));let i=r<window.innerHeight?0:Math.max(0,Math.round(window.innerHeight-n.getBoundingClientRect().bottom));e.style.setProperty(io,`${String(i)}px`);let a=t.scrollHeight-t.scrollTop-t.clientHeight;t.classList.toggle(ao,a>so);}function B(){fo();}var V=null;function po(e){window.removeEventListener(`scroll`,B),window.removeEventListener(`resize`,B),V?.removeEventListener(`scroll`,B),V?.classList.remove(ao),V=null,e&&(window.addEventListener(`scroll`,B,{passive:true}),window.addEventListener(`resize`,B,{passive:true}),V=uo(),V?.addEventListener(`scroll`,B,{passive:true}));}function mo(e){document.documentElement.classList.toggle(R,e),z!==null&&(z.disconnect(),z=null);let t=document.querySelector(Qa);e&&t!==null&&typeof ResizeObserver==`function`&&(z=new ResizeObserver(lo),z.observe(t),document.body!==null&&z.observe(document.body)),po(e),lo();}var H=`rdw-nav-more`,U=`rdw-nav-more-list`,W=`rdw-nav-account`,ho=`rdw-nav-icon`,G=`rdw-subnav-action`,go=exports("n",`rdw-nav-due`),K=`rdw-subnav-`,_o=`rdw-header-layout`,vo=`More`,yo=`My Account`,q=`div#header ul#subnavbar`,bo=[{title:`Browse`,links:[`Tags`,`Artists`,`Pools`,`Aliases`,`Wiki`]},{title:`Community`,links:[`Comments`,`Forum`,`Help`]}],xo=new Set(bo.flatMap(e=>e.links)),So=`rdw-nav-more-heading`,Co=Math.max(...bo.map(e=>e.links.length))+1,wo=new Map([[`Video`,`video`],[`Random`,`random`],[`Help`,`help`],[`Upload`,`upload`],[`Upload Video`,`upload-video`]]),To=new Set([`Upload`,`Upload Video`]);function J(e){return `url("data:image/svg+xml,${`%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E${e.replaceAll(`<`,`%3C`).replaceAll(`>`,`%3E`)}%3C/svg%3E`}") center / contain no-repeat`}var Y={chevron:J(`<path d='m6 9 6 6 6-6'/>`),stats:J(`<path d='M3 3v18h18'/><path d='M18 17V9'/><path d='M13 17V5'/><path d='M8 17v-3'/>`),account:J(`<path d='M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2'/><circle cx='12' cy='7' r='4'/>`),settings:J(`<path d='M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z'/><circle cx='12' cy='12' r='3'/>`),video:J(`<polygon points='6 3 20 12 6 21 6 3'/>`),random:J(`<path d='m18 14 4 4-4 4'/><path d='m18 2 4 4-4 4'/><path d='M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22'/><path d='M2 6h1.972a4 4 0 0 1 3.6 2.2'/><path d='M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45'/>`),help:J(`<circle cx='12' cy='12' r='10'/><path d='M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3'/><path d='M12 17h.01'/>`),upload:J(`<path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/><polyline points='17 8 12 3 7 8'/><line x1='12' x2='12' y1='3' y2='15'/>`),uploadVideo:J(`<path d='m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5'/><rect x='2' y='6' width='14' height='12' rx='2'/>`)},X=`div#header ul#navbar`,Eo=`div#header:has(> #site-title):has(> ul#navbar)`,Do=`favorites`,Oo=`aria-current`,ko=18,Z=14,Ao=30;function Q(e,t,n){return `${e}::before {
  content: "";
  display: inline-block;
  flex: none;
  width: ${String(n)}px;
  height: ${String(n)}px;
  background: currentColor;
  -webkit-mask: ${t};
  mask: ${t};
}`}var jo=`
${Eo} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}
${Eo} > * {
  flex: 0 0 100%;
  box-sizing: border-box;
}
${Eo} > #site-title {
  flex: none;
  margin: 0;
  padding: 0 2px 0 18px;
  background-image: none;
  /* As tall as the menu beside it. In the site's dark theme the title and the
     menu have a background darker than the header's: a title only as tall as
     its text left a strip of the header's colour over and under it. */
  align-self: stretch;
  display: flex;
  align-items: center;
}
${Eo} > ul#navbar {
  flex: 1 1 0;
  min-width: 0;
  padding: 6px 18px 6px 6px;
}
${X} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}
${X} > li#${H} {
  order: 1;
  position: relative;
}
${X} > li#${ot$1.stats} {
  order: 2;
  margin-left: auto;
}
${X}:not(:has(> li#${ot$1.stats})) > li.${W} {
  margin-left: auto;
}
${X} > li.${W} {
  order: 3;
}
${X} > li#${ot$1.settings} {
  order: 4;
}
${X} > li.${ho} > a {
  display: inline-flex;
  align-items: center;
  font-size: 0;
  line-height: 0;
  padding: 6px 8px;
}
${Q(`${X} > li#${ot$1.stats} > a`,Y.stats,ko)}
${Q(`${X} > li.${W} > a`,Y.account,ko)}
${Q(`${X} > li#${ot$1.settings} > a`,Y.settings,ko)}
${X} > li.${go} > a {
  position: relative;
}
${X} > li.${go} > a::after {
  content: "";
  position: absolute;
  top: 3px;
  right: 3px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--rdw-accent);
}
${X} > li#${H} > button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border: 0;
  border-radius: var(--rdw-radius-m);
  background: transparent;
  color: var(--rdw-muted);
  font: inherit;
  cursor: pointer;
}
${X} > li#${H} > button:hover,
/* The keyboard's focus in the header is the ring every button and field of
   the script has: the browser's own was a white rectangle here. */
div#header a:focus-visible,
div#header button:focus-visible {
  outline: 2px solid var(--rdw-accent);
  outline-offset: 2px;
  border-radius: 4px;
}
/* A thumbnail's link in the themes of the site, where the skin's rule is not applied. */
span.thumb > a:focus-visible {
  outline: 2px solid var(--rdw-accent);
  outline-offset: 2px;
  border-radius: 4px;
}
${X} > li#${H} > button[aria-expanded="true"] {
  color: var(--rdw-text);
}
${X} > li#${H}:has(li.${at$1}) > button {
  color: var(--rdw-text);
  font-weight: 600;
  border-radius: 0;
  box-shadow: inset 0 -2px 0 var(--rdw-accent);
}
${X} > li#${H} > button::after {
  content: "";
  width: 14px;
  height: 14px;
  background: currentColor;
  -webkit-mask: ${Y.chevron};
  mask: ${Y.chevron};
}
${X} ul.${U} {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: ${String(Ao)};
  display: grid;
  /* A column to a group: the heading, then its sections. */
  grid-auto-flow: column;
  grid-template-rows: repeat(${String(Co)}, auto);
  grid-auto-columns: max-content;
  gap: 2px 12px;
  margin: 4px 0 0;
  padding: 6px;
  list-style: none;
  background: var(--rdw-surface);
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-l);
  box-shadow: var(--rdw-shadow-2);
}
${X} ul.${U}[hidden] {
  display: none;
}
${X} ul.${U} > li {
  display: block;
}
${X} ul.${U} > li > a {
  display: block;
}
${X} ul.${U} > li.${So} {
  /* A group starts a column, whatever the number of sections before it. */
  grid-row: 1;
  /* A caption, not a thing to press: small, faint, with a rule under it, and
     the sections below in the colour of text. The two read alike before. */
  margin: 0 4px 4px;
  padding: 2px 6px 6px;
  border-bottom: 1px solid var(--rdw-border);
  color: var(--rdw-muted);
  font: 600 10px var(--rdw-font);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: default;
  user-select: none;
}
${X} ul.${U} > li:not(.${So}) > a {
  color: var(--rdw-text);
}
${q} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}
${q} > li > a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
${q} > li.${G} > a {
  padding: 3px 10px;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  color: var(--rdw-text);
}
${q} > li.${G} > a:hover {
  border-color: var(--rdw-accent);
}
${q} > li {
  list-style: none;
}
${q} > li.${G} {
  order: 1;
}
${q} > li.${G}:not(li.${G} ~ li.${G}) {
  margin-left: auto;
}
${Q(`${q} > li.${K}video > a`,Y.video,Z)}
${Q(`${q} > li.${K}random > a`,Y.random,Z)}
${Q(`${q} > li.${K}help > a`,Y.help,Z)}
${Q(`${q} > li.${K}upload > a`,Y.upload,Z)}
${Q(`${q} > li.${K}upload-video > a`,Y.uploadVideo,Z)}
${co}
`.trim();function Mo(){if(document.getElementById(_o)!==null)return;let e=document.createElement(`style`);e.id=_o,e.textContent=jo,(document.head??document.documentElement).append(e);}function No(e){return e.querySelector(`:scope > a`)?.textContent?.trim()??``}function Po(e,t){let n=e.querySelector(`:scope > button`),r=e.querySelector(`:scope > ul.${U}`);n instanceof HTMLButtonElement&&r instanceof HTMLElement&&(r.hidden=!t,n.setAttribute(`aria-expanded`,t?`true`:`false`));}function Fo(){let e=document.createElement(`li`);e.id=H;let t=document.createElement(`button`);t.type=`button`,t.textContent=vo,t.setAttribute(`aria-haspopup`,`true`),t.setAttribute(`aria-expanded`,`false`);let n=document.createElement(`ul`);return n.className=U,n.hidden=true,e.append(t,n),t.addEventListener(`click`,()=>{Po(e,n.hasAttribute(`hidden`));}),document.addEventListener(`pointerdown`,t=>{!n.hidden&&t.target instanceof Node&&!e.contains(t.target)&&Po(e,false);}),document.addEventListener(`keydown`,r=>{r.key===`Escape`&&!n.hidden&&(Po(e,false),t.focus());}),{item:e,list:n}}function Io(e){let t=document.getElementById(H);if(t instanceof HTMLLIElement)return t;let n=[...e.querySelectorAll(`:scope > li`)].filter(e=>xo.has(No(e))),r=n[0];if(r===void 0)return null;let{item:i,list:a}=Fo();r.before(i);for(let e of bo){let t=e.links.map(e=>n.find(t=>No(t)===e)).filter(e=>e!==void 0);if(t.length===0)continue;let r=document.createElement(`li`);r.className=So,r.textContent=e.title,r.setAttribute(`role`,`presentation`),a.append(r,...t);}return i}function Lo(e){for(let t of e.querySelectorAll(`:scope > li`)){let e=No(t),n=e===yo;n&&t.classList.add(W),(n||t.id===ot$1.stats||t.id===ot$1.settings)&&(t.classList.add(ho),t.querySelector(`:scope > a`)?.setAttribute(`title`,e));}}function Ro(){let e=document.querySelector(q);if(e!==null)for(let t of e.querySelectorAll(`:scope > li`)){let e=No(t),n=wo.get(e);n!==void 0&&t.classList.add(`${K}${n}`),To.has(e)&&t.classList.add(G);}}function zo(e){new URLSearchParams(window.location.search).get(`page`)===Do&&e.querySelector(`li.current-page`)===null&&(e.querySelector(`li#${ot$1.favorites}`)??e.querySelector(`li#my-favorites-container`))?.classList.add(at$1);}function Bo(e){for(let t of e.querySelectorAll(`li > a`)){let e=t.parentElement?.classList.contains(at$1)===true;e&&t.getAttribute(Oo)!==`page`?t.setAttribute(Oo,`page`):!e&&t.hasAttribute(Oo)&&t.removeAttribute(Oo);}}var Vo=new WeakSet;function Ho(e){Vo.has(e)||typeof MutationObserver!=`function`||(Vo.add(e),new MutationObserver(()=>{Bo(e);}).observe(e,{subtree:true,attributes:true,attributeFilter:[`class`]}));}function Uo(e,t){let n=Array.from(e.children).slice(-t.length);t.length===0||t.every((e,t)=>n[t]===e)||e.append(...t);}function Wo(e){let t=[],n=e.querySelector(`:scope > li#${H}`),r=e.querySelector(`:scope > li#${ot$1.stats}`),i=e.querySelector(`:scope > li.${W}`),a=e.querySelector(`:scope > li#${ot$1.settings}`);for(let e of [n,r,i,a])e!==null&&t.push(e);Uo(e,t);let s=document.querySelector(q);s!==null&&Uo(s,Array.from(s.querySelectorAll(`:scope > li.${G}`)));}function Go(e){Mo(),Io(e),Lo(e),Ro(),Wo(e),zo(e),Bo(e),Ho(e);}var Ko=`feed`,qo=`Feed`,Jo=`li#${ct$1} a[href*="page=favorites"]`,Yo=/^[1-9]\d*$/;function Xo(e){for(let t of e.querySelectorAll(`li > a`))if((t.textContent?.trim()??``)===`Posts`){let e=t.parentElement;return e instanceof HTMLLIElement?e:null}return null}function Zo(e,t,n){let r=document.createElement(`li`);r.id=e;let i=document.createElement(`a`);return i.textContent=t,i.href=n,r.append(i),r}function Qo(){let e=document.querySelector(Jo)?.getAttribute(`href`);if(e==null)return null;let t;try{t=new URL(e,window.location.href).searchParams.get(`id`);}catch{return null}if(t===null||!Yo.test(t))return null;let r=new URLSearchParams;return r.set(ce,ue),r.set(`s`,de),r.set(`id`,t),`${ie}?${r.toString()}`}function $o(e){let t=document.querySelector(it$1);if(t===null)return  false;let n=Xo(t);if(n===null)return  false;let r=n,i=(e,t,n)=>{let i=document.getElementById(e);if(i!==null){r=i;return}let a=Zo(e,t,n);r.after(a),r=a;};Gi(e,Ko,true)&&i(ut$1,qo,qe),i(ot$1.collections,st$1.collections,Ke),i(ot$1.following,st$1.following,qe);let a=Qo();if(a!==null){i(ot$1.favorites,st$1.favorites,a);let e=document.getElementById(ct$1);e instanceof HTMLElement&&(e.hidden=true);}return e.features[`stats-menu`]!==false&&i(ot$1.stats,st$1.stats,Ye),document.getElementById(ot$1.settings)===null&&t.append(Zo(ot$1.settings,st$1.settings,Je)),Go(t),(e.features[`sticky-header`]??true)===true&&mo(true),true}var es=168,ts=2e3,ns=`ruledesk-web.search-tools-height`,rs=`rdw-search-tools-ai-posts`,is=`rdw-search-tools--mounted`; exports({cn:rs,aM:is});function as(){let e=null;try{e=window.localStorage.getItem(ns);}catch{}let t=e===null?NaN:Number(e);return !Number.isFinite(t)||t<=0||t>ts?es:Math.round(t)}function os(e){if(!(!Number.isFinite(e)||e<=0))try{window.localStorage.setItem(ns,String(Math.round(e)));}catch{}}var ss=`search-tools`,$=`rdw-search-tools`,cs=`rdw-search-tools`,ls=`rdw-search-tools-reserve`,us=8,ds=`input[name="tags"]`,fs=`ul#tag-sidebar`,ps=`content`,ms=[Pa,oa,ba];function hs(e){return [`body.${e} #${$}:not(.${is}) {`,`  min-height: ${String(as())}px;`,`}`,`body.${e} #${$} {`,`  margin-top: ${String(us)}px;`,`  box-sizing: border-box;`,`}`].join(`
`)}function gs(){let e=document.querySelector(ds);if(!(e instanceof HTMLInputElement))return;let t=e.closest(`form`);if(!(t instanceof HTMLFormElement))return;let n=document.getElementById($);if(n instanceof HTMLDivElement){n.previousElementSibling!==t&&t.after(n);return}let r=document.createElement(`div`);r.id=$,r.className=cs,t.after(r);}function _s(){let e=P(window.location.search);if(e!==`list`&&e!==`post`||!Gi(Wi(),ss,true))return  true;if(document.body===null||document.querySelector(ds)===null)return  false;let t=Kt$1(ss);document.body.classList.add(t),document.body.classList.add(rs);let n=M(ls);return n.textContent=hs(t),gs(),true}function vs(){let e=Wi(),t=false,n=false,r=()=>(!t&&document.getElementById(ps)!==null&&(Es(),t=$o(e)),!n&&document.querySelector(fs)!==null&&(n=_s()),t&&n);if(r())return;let i=new MutationObserver(()=>{r()&&i.disconnect();});i.observe(document,{childList:true,subtree:true}),document.addEventListener(`DOMContentLoaded`,()=>{i.disconnect(),$o(e);},{once:true});}function ys(){Es(),_s(),Ts();}var bs=`favorites-bulk`,xs=`rdw-favorites-hold`,Ss=5e3;function Cs(e){return typeof e==`object`&&!!e&&!Array.isArray(e)}function ws(){if(qi(`favorites-view`)===`scroll`)return  true;let e=qi(en$1);if(!Cs(e))return  false;let t=e[tn$1];return e.all===true||Cs(t)&&t.favorites===true}function Ts(){if(document.body===null||P(window.location.search)!==`favorites`||!Gi(Wi(),bs,true)||!ws())return;let e=M(xs);e.textContent=[`body.${Xt$1} div.image-list:not(.${Zt$1}),`,`body.${Xt$1} #paginator {`,`  display: none;`,`}`].join(`
`);let n=document.body;n.classList.add(Xt$1),window.setTimeout(()=>{document.querySelector(`.rdw-fav-results`)===null&&n.classList.remove(Xt$1);},Ss);}function Es(){if(document.body===null)return;let e=P(window.location.search),t=window.location.search,n=Wi();for(let r of ms){if(!r.pages.includes(e)||!Gi(n,r.id,r.defaultEnabled))continue;let i=r.choice===void 0?void 0:Ki(n,r.id,r.choice.defaultValue,r.choice.options.map(e=>e.value));Ga(r,e,t,{...i===void 0?{}:{choiceValue:i}});}}function Ds(e){document.readyState===`interactive`||document.readyState===`complete`?e():document.addEventListener(`DOMContentLoaded`,e,{once:true});}function Os(e){requestAnimationFrame(()=>{setTimeout(e,0);});}Zi(),vs(),Ds(()=>{ys(),Os(()=>{module.import('./app-M32Uzb9f-DIm5OcM2.js').then(function(n){return n.aW}).then(({startApp:e})=>e()).catch(e=>{m.error(`start failed`,e);});});});})}}));
System.register("./app-M32Uzb9f-DIm5OcM2.js", ['./___monkey.entry.js'],(function(exports,module){'use strict';var Wn$2,l$1,u$2,Bn$2,d$2,Rn$2,In$2,kn$2,Vn$2,Pn$2,A$3,N$3,O$3,D$2,E$2,T$2,m$2,Fi,Vi,k$3,G$4,Lc$1,Cs$1,ot$3,jc$1,Go$1,Ic$1,zo$1,rt$3,it$3,ut$3,Ke$3,st$3,qe$3,Os$1,Ye$3,ct$3,Je$3,go$1,Na$1,Ds$1,Ma$1,at$3,ks$1,ie$1,ce$1,ue$1,de$1,dn$2,ut$4,P$3,be$2,kc$1,en$2,nn$2,Le$3,tn$2,Pt$2,yo$1,bo$1,mo$1,R$3,Ks$1,Te$3,io$1,Rc$1,Xi,jo$1,rn$2,cn$2,le$1,re$1,Ka$1,Rt$2,kt$3,qt$2,Ft$2,It$2,Bt$2,Ht$2,Pa$1,Ut$2,oa,ya$1,ga$1,_a$1,va$1,ha$1,ba$1,xa$1,Hc$1,Ei$1,Dc$1,ws$1,ta,na,ra,Pt$3,Ga$1,Wc$1,Kt$2,c$1,is$1,Ji,Ec$1,wo$1,Gt$2,Za$1,Os$2,dt$3,tt$3,Kc$1,Jt$2,Yt$2,Vt$2,ot$4,De$3,Ie$3,Tt$3,Es$1,Ra$1,Io$1,Fo$1,Ao$1,ll$1,po$1,lo$1,os$1,ln$2,Bc$1,Zs$1,Co$1,M$3,nt$3,zt$2,$e$3,Fe$3,vc$1,fo$1,ul$1,Oe$3,ho$1,Gc$1,K$4,I$3,ko$1,No$1,yc$1,bc$1,xc$1,st$4,Ra$2,et$3,Ft$3,r,Ts$1,q$4,Nt$3,Ys$1,Js$1,Tc$1,Mo$1,je$3,Ce$3,Qs$1,oo$1,ro$1,fe$1,pe$1,qt$3,za$1,Ot$3,Jn$2,gi$1,ya$2,me$1,un$2,Et$3,dt$4,h$3,On$2,he$2,ge$2,ve$2,ye$2,_e$2,fc$1,Xs$1,lc$1,xe$3,Ua$1,Va$1,Wa$1,Pc$1,qc$1,a,za$2,i,Ba$1,At$3,fr$2,$t$2,Qt$2,Xt$2,Dt$3,rs$1,Zt$2,_c$1,jt$3,oe$1,Ee$3,Nt$4,uc$1,We$3,ae$1,se$1;return{setters:[function(module){Wn$2=module.W;l$1=module.l;u$2=module.u;Bn$2=module.B;d$2=module.d;Rn$2=module.R;In$2=module.I;kn$2=module.k;Vn$2=module.V;Pn$2=module.P;A$3=module.A;N$3=module.N;O$3=module.O;D$2=module.D;E$2=module.E;T$2=module.T;m$2=module.m;Fi=module.F;Vi=module.a;k$3=module.b;G$4=module.G;Lc$1=module.L;Cs$1=module.C;ot$3=module.o;jc$1=module.j;Go$1=module.c;Ic$1=module.e;zo$1=module.z;rt$3=module.r;it$3=module.i;ut$3=module.f;Ke$3=module.K;st$3=module.s;qe$3=module.q;Os$1=module.g;Ye$3=module.Y;ct$3=module.h;Je$3=module.J;go$1=module.n;Na$1=module.p;Ds$1=module.t;Ma$1=module.M;at$3=module.v;ks$1=module.w;ie$1=module.x;ce$1=module.y;ue$1=module.H;de$1=module.Q;dn$2=module.S;ut$4=module.U;P$3=module.X;be$2=module.Z;kc$1=module._;en$2=module.$;nn$2=module.a0;Le$3=module.a1;tn$2=module.a2;Pt$2=module.a3;yo$1=module.a4;bo$1=module.a5;mo$1=module.a6;R$3=module.a7;Ks$1=module.a8;Te$3=module.a9;io$1=module.aa;Rc$1=module.ab;Xi=module.ac;jo$1=module.ad;rn$2=module.ae;cn$2=module.af;le$1=module.ag;re$1=module.ah;Ka$1=module.ai;Rt$2=module.aj;kt$3=module.ak;qt$2=module.al;Ft$2=module.am;It$2=module.an;Bt$2=module.ao;Ht$2=module.ap;Pa$1=module.aq;Ut$2=module.ar;oa=module.as;ya$1=module.at;ga$1=module.au;_a$1=module.av;va$1=module.aw;ha$1=module.ax;ba$1=module.ay;xa$1=module.az;Hc$1=module.aA;Ei$1=module.aB;Dc$1=module.aC;ws$1=module.aD;ta=module.aE;na=module.aF;ra=module.aG;Pt$3=module.aH;Ga$1=module.aI;Wc$1=module.aJ;Kt$2=module.aK;c$1=module.aL;is$1=module.aM;Ji=module.aN;Ec$1=module.aO;wo$1=module.aP;Gt$2=module.aQ;Za$1=module.aR;Os$2=module.aS;dt$3=module.aT;tt$3=module.aU;Kc$1=module.aV;Jt$2=module.aW;Yt$2=module.aX;Vt$2=module.aY;ot$4=module.aZ;De$3=module.a_;Ie$3=module.a$;Tt$3=module.b0;Es$1=module.b1;Ra$1=module.b2;Io$1=module.b3;Fo$1=module.b4;Ao$1=module.b5;ll$1=module.b6;po$1=module.b7;lo$1=module.b8;os$1=module.b9;ln$2=module.ba;Bc$1=module.bb;Zs$1=module.bc;Co$1=module.bd;M$3=module.be;nt$3=module.bf;zt$2=module.bg;$e$3=module.bh;Fe$3=module.bi;vc$1=module.bj;fo$1=module.bk;ul$1=module.bl;Oe$3=module.bm;ho$1=module.bn;Gc$1=module.bo;K$4=module.bp;I$3=module.bq;ko$1=module.br;No$1=module.bs;yc$1=module.bt;bc$1=module.bu;xc$1=module.bv;st$4=module.bw;Ra$2=module.bx;et$3=module.by;Ft$3=module.bz;r=module.bA;Ts$1=module.bB;q$4=module.bC;Nt$3=module.bD;Ys$1=module.bE;Js$1=module.bF;Tc$1=module.bG;Mo$1=module.bH;je$3=module.bI;Ce$3=module.bJ;Qs$1=module.bK;oo$1=module.bL;ro$1=module.bM;fe$1=module.bN;pe$1=module.bO;qt$3=module.bP;za$1=module.bQ;Ot$3=module.bR;Jn$2=module.bS;gi$1=module.bT;ya$2=module.bU;me$1=module.bV;un$2=module.bW;Et$3=module.bX;dt$4=module.bY;h$3=module.bZ;On$2=module.b_;he$2=module.b$;ge$2=module.c0;ve$2=module.c1;ye$2=module.c2;_e$2=module.c3;fc$1=module.c4;Xs$1=module.c5;lc$1=module.c6;xe$3=module.c7;Ua$1=module.c8;Va$1=module.c9;Wa$1=module.ca;Pc$1=module.cb;qc$1=module.cc;a=module.cd;za$2=module.ce;i=module.cf;Ba$1=module.cg;At$3=module.ch;fr$2=module.ci;$t$2=module.cj;Qt$2=module.ck;Xt$2=module.cl;Dt$3=module.cm;rs$1=module.cn;Zt$2=module.co;_c$1=module.cp;jt$3=module.cq;oe$1=module.cr;Ee$3=module.cs;Nt$4=module.ct;uc$1=module.cu;We$3=module.cv;ae$1=module.cw;se$1=module.cx;}],execute:(function(){exports({A:A$2,B:B$2,C:mt$2,D:ft$2,E:Er$1,F:O,G:Ge,H:H$2,I:Ie$2,J:J$3,K:K$3,L:Ws,M:Ca,N:Nt,O:On$1,P:ot$2,R:Re$2,S:Se,T:Nt$2,U:Hs,V:V$2,W:Wn$1,X:dr,Y:or,Z:wr,_:Jz,a:Sr,a0:qz,a1:Xn,a2:Ye$1,a3:We$1,a6:Re$1,a7:Le$1,a8:yR,a9:wa,aA:pt$2,aC:MF,aE:$$1,aF:Q$1,aH:kg,aJ:ze$2,aL:ht$2,aM:Bn$1,aN:Ot$2,aO:g$1,aP:Ic,aQ:Le$2,aR:Ze$1,aS:Pi,aT:en,aU:tn,aV:kI,aa:sr,ab:It,ac:Ft,ad:Ie$1,ae:Kz,af:Wn,aj:Ue$1,ak:vR,al:W,am:we,an:tm,ao:Yr,ap:dt,at:jF,au:NF,aw:X$1,ax:Hg,ay:xt,az:Ot,c:wn$1,f:fi,g:g,h:Gz,i:iF,k:Or$1,l:lt$2,m:Sn$1,n:nF,o:oi,p:cF,q:qt$1,r:rg,s:sF,t:aF,u:Ge$1,w:wr$1,y:En$1,z:z$2});var u$1,d$1,f$1,p$1,m$1,h$2,g$2,_$2,v$1,y$1,b$1,x$1=Symbol.for(`pv`),S$1={},C$1=[],w$1=/^m(i|n|o|s|text|space)$/,T$1=Array.isArray,E$1=C$1.slice,D$1=Object.assign;function O$2(e){e&&e.parentNode&&e.remove();}function ee(e,t,n){var r,i,a,o={},s=arguments.length;for(a in t)a==`key`?r=t[a]:a==`ref`&&typeof e!=`function`?i=t[a]:o[a]=t[a];return s>2&&(o.children=s>3?E$1.call(arguments,2):n),k$2(e,o,r,i,null)}function k$2(e,t,n,r,i){var a={type:e,props:t,key:n,ref:r,__k:null,__:null,__b:0,__e:null,__c:null,constructor:x$1,__v:i||++d$1,__i:-1,__u:0};return !i&&u$1.vnode&&u$1.vnode(a),a}function A$2(e){return e.children}function j$2(e,t){this.props=e,this.context=t,this.__g=0;}function M$2(e,t){if(t==null)return e.__&&M$2(e.__,e.__i+1);for(var n;t<e.__k.length;t++)if((n=e.__k[t])&&n.__e)return n.__e;return typeof e.type!=`function`||e.props.__P?null:M$2(e)}function te(e){var t,n=e.__v,r=n.__e,i=[],a=[],o=e.__P;o&&((t=D$1({constructor:x$1},n)).__v=n.__v+1,u$1.vnode&&u$1.vnode(t),ue(o,t,n,e.__n,o.namespaceURI,32&n.__u?[r]:null,i,r||M$2(n),32&n.__u,a),t.__v=n.__v,t.__.__k[t.__i]=t,pe(i,t,a),n.__=n.__e=null,t.__e!=r&&N$2(t));}function N$2(e){if((e=e.__)&&e.__c&&!e.props.__P)return e.__e=null,e.__k.some(function(t){return t&&(e.__e=t.__e)}),N$2(e)}function P$2(e){(8&e.__g||(e.__g|=8,f$1.push(e),m$1++))&&p$1==u$1.debounceRendering||((p$1=u$1.debounceRendering)||queueMicrotask)(F$2);}function F$2(){try{for(var e,t=1;f$1.length;)f$1.length>t&&f$1.sort(h$2),e=f$1.shift(),t=f$1.length,8&e.__g&&te(e);}finally{(m$1=f$1.length)&&(p$1||queueMicrotask)(F$2);}}function ne(e,t,n,r,i,a,o,s,c,l,u){var d,f,p,m,h,g,_=r.__k||C$1,v=t.length;for(c=re(n,t,_,c,v),d=0;d<v;d++)(p=n.__k[d])!=null&&(f=~p.__i&&_[p.__i]||S$1,p.__i=d,g=ue(e,p,f,i,a,o,s,c,l,u),m=p.__e,(f.ref!=p.ref||8&f.__u)&&(f.ref&&he$1(f.ref,null,p,f),p.ref&&u.push(p.ref,p.__c||m,p)),h||=m,4&p.__u?(c=ie(p,c,e,!f.__v),f.__e&&(f.__e=null)):typeof p.type==`function`&&g!==void 0?c=g:m&&(c=m.nextSibling),p.__u&=-21);return n.__e=h,c}function re(e,t,n,r,i){var a,o,s,c,l,u,d,f,p,m=n.length,h=m,g=0,_=0,v=e.__k=Array(i);for(a=0;a<i;a++)(o=t[a])!=null&&typeof o!=`boolean`&&typeof o!=`function`?(typeof o!=`object`||o.constructor===String?o=v[a]=k$2(null,o):T$1(o)?o=v[a]=k$2(A$2,{children:o}):o.constructor===x$1&&o.__b?o=v[a]=k$2(o.type,o.props,o.key,o.ref,o.__v):v[a]=o,c=a+g,o.__=e,o.__b=e.__b+1,s=null,~(l=o.__i=oe(o,n,c,h))&&(h--,(s=n[l])&&(s.__u|=2)),s&&s.__v?(o.__u|=16,l==c-1?g--:l==c+1?g++:l!=c&&(l>c?g--:g++,_=1)):(~l||(i>m?g--:i<m&&g++),typeof o.type!=`function`&&(o.__u|=4))):v[a]=null;if(_){for(u=[],d=[],a=0;a<i;a++)if((o=v[a])&&16&o.__u){for(g=0,f=u.length;g<f;)u[p=g+f>>1]<o.__i?g=p+1:f=p;u[g]=o.__i,d[a]=g+1;}for(g=u.length;a--;)d[a]&&(d[a]==g?g--:v[a].__u|=4);}if(h)for(a=0;a<m;a++)!(s=n[a])||2&s.__u||(s.__e==r&&(r=M$2(s)),ge$1(s,s));return r}function ie(e,t,n,r){var i,a,o,s;if(typeof e.type==`function`){if(e.props.__P)return t;if(i=e.__k)for(a=0;a<i.length;a++)i[a]&&(i[a].__=e,t=ie(i[a],t,n,false));return t}for(t&&!t.parentNode&&(t=M$2(e))&&!t.parentNode&&(t=null),o=e.__e,s=t;s&&s.nodeType==8;)s=s.nextSibling;for(o!=s&&(!r&&n.moveBefore&&o.parentNode?n.moveBefore(o,t):n.insertBefore(o,t||null)),t=o;(t&&=t.nextSibling)&&t.nodeType==8&&!t.data.startsWith(`$s`););return t}function ae(e,t){return t||=[],e!=null&&typeof e!=`boolean`&&(T$1(e)?e.some(function(e){ae(e,t);}):t.push(e)),t}function oe(e,t,n,r){var i,a=e.key,o=e.type,s=t[n],c=s&&!(2&s.__u);if(s===null&&a==null||c&&a==s.key&&o==s.type)return n;if(r>+!!c){for(i=n-1;i>=0;i--)if((s=t[i])&&!(2&s.__u)&&a==s.key&&o==s.type)return i;for(i=n+1;i<t.length;i++)if((s=t[i])&&!(2&s.__u)&&a==s.key&&o==s.type)return i}return  -1}function se(e,t,n){n??=``,t[0]==`-`?e.setProperty(t,n):e[t]=n;}function ce(e,t,n,r,i){var a,o;if(t==`style`){if(typeof n==`string`)e.style.cssText=n;else {if(typeof r==`string`&&(e.style.cssText=r=``),r)for(t in r)n&&t in n||se(e.style,t);if(n)for(t in n)r&&n[t]==r[t]||se(e.style,t,n[t]);}}else if(t[0]==`o`&&t[1]==`n`)typeof n!=`function`&&(n=null),typeof r!=`function`&&(r=null),(e.__e||={})[t]=n,n&&r||(o=y$1[t]||(y$1[t]=le(t)),(e.__a||={})[t]=v$1,a=t!=(t=t.replace(_$2,`$1`)),(t=t.slice(2))[0]<`a`&&(t=t.toLowerCase()),n?e.addEventListener(t,o,a):e.removeEventListener(t,o,a));else {if(i==`http://www.w3.org/2000/svg`)t=t.replace(/xlink(H|:h)/,`h`).replace(/sName$/,`s`);else if(t!=`width`&&t!=`height`&&t!=`href`&&t!=`list`&&t!=`form`&&t!=`tabIndex`&&t!=`download`&&t!=`rowSpan`&&t!=`colSpan`&&t!=`role`&&t!=`popover`&&t in e)try{e[t]=n??``;return}catch{}if(typeof n==`function`)return;n==null||false===n&&t[4]!=`-`?e.removeAttribute(t):e.setAttribute(t,t==`popover`&&n==1?``:n);}}function le(e){return function(t){var n=this.__e;if(n){if(n=n[e],t[g$2]==null)t[g$2]=v$1++;else if(t[g$2]<this.__a[e])return;return n(u$1.event?u$1.event(t):t)}}}function ue(e,t,n,r,i,a,o,s,c,l){var d,f,p,m,h,g,_,v,y,b,S,w,E,ee,k,te,N,P,F=t.type;if(t.constructor!==x$1)return null;128&n.__u&&(c=32&n.__u,d=n.__c.__z)&&(t.__u|=c,f=a=[],d.nodeType==8?s=de(d,a):a.push(d),s=a[0]||s),(d=u$1.__b)&&d(t);n:if(typeof F==`function`){p=o.length;try{if(v=t.props,y=(d=F.prototype)&&d.render,b=(d=F.contextType)&&r[d.__c],S=d?b?b.props.value:d.__:r,(m=n.__c)?(t.__c=m,2&m.__g&&(m.__g|=1)):(y?t.__c=m=new F(v,S):(t.__c=m=new j$2(v,S),m.constructor=F,m.render=_e$1),b&&b.sub(m),m.state||(m.state={}),m.__n=r,m.__g|=8,m.__h=[],m.__k=[]),y&&(m.__s||(m.__s=m.state),F.getDerivedStateFromProps&&(m.__s==m.state&&(m.__s=D$1({},m.__s)),D$1(m.__s,F.getDerivedStateFromProps(v,m.__s)))),h=m.props,g=m.state,m.__v=t,n.__c){if(v!==h&&y&&!F.getDerivedStateFromProps&&m.componentWillReceiveProps&&m.componentWillReceiveProps(v,S),t.__v==n.__v&&!(8&m.__g)||!(4&m.__g)&&m.shouldComponentUpdate&&!1===m.shouldComponentUpdate(v,m.__s,S)){t.__v!=n.__v&&(m.props=v,m.state=m.__s,m.__g&=-9),t.__e=n.__e,t.__k=n.__k,t.__k.some(function(e){e&&(e.__=t);}),C$1.push.apply(m.__h,m.__k),m.__k=[],m.__h.length&&o.push(m),s=M$2(n);break n}m.componentWillUpdate&&m.componentWillUpdate(v,m.__s,S),y&&m.componentDidUpdate&&m.__h.push(function(){m.componentDidUpdate(h,g,_);});}else y&&!F.getDerivedStateFromProps&&m.componentWillMount&&m.componentWillMount(),y&&m.componentDidMount&&m.__h.push(m.componentDidMount);m.context=S,m.props=v,m.__P=e,m.__g&=-5,w=u$1.__r,E=y?25:0;do m.__g&=-9,w&&w(t),d=m.render(m.props,m.state=m.__s,m.context);while(8&m.__g&&++E<25);y&&(C$1.push.apply(m.__h,m.__k),m.__k=[]),m.state=m.__s,m.getChildContext&&(r=D$1({},r,m.getChildContext())),y&&n.__c&&m.getSnapshotBeforeUpdate&&(_=m.getSnapshotBeforeUpdate(h,g)),ee=d&&d.type===A$2&&d.key==null?d.props.children:d,v.__P&&(d=s,i=(e=v.__P).namespaceURI,c=a=null,n.props&&n.props.__P!=e&&(n.__k.some(function(e){e&&ge$1(e,e);}),n.__k=null),s=n.__k?M$2(n,0):null),s=ne(e,T$1(ee)?ee:[ee],t,n,r,i,a,o,s,c,l),v.__P&&(t.__e=null,s=d),t.__u&=-161,f&&f.some(O$2),m.__h.length&&o.push(m),1&m.__g&&(m.__g&=-4);}catch(e){if(o.length=p,t.__v=null,c||a){if(e&&e.then){if(t.__u|=128|c,a){for(~(N=a.indexOf(s||void 0))||(N=a.length);(P=a[N-1])&&P.nodeType==8;)N--;for(;N<a.length;N++)if(P=a[N]){if(a[N]=null,k){if(P==te)break}else {if(P.nodeType!=8)break;P.data.startsWith(`$s`)&&(te=de(k=P));}}}if(!k){for(;s&&s.nodeType==8&&s.nextSibling;)s=s.nextSibling;k=s;}(d=de(k=t.__c.__z||(t.__c.__z=k)))?(t.__e=k,s=d):t.__e=s,s&&=s.nextSibling;}else a&&a.some(O$2);}else t.__e=n.__e;t.__k||=n.__k||[],e&&e.then||fe(t),u$1.__e(e,t,n);}}else s=t.__e=me(n.__e,t,n,r,i,a,o,c,l,e);return (d=u$1.diffed)&&d(t),s}function de(e,t){if(e&&e.nodeType==8&&e.data.startsWith(`$s`))for(var n=1;e=e.nextSibling;){if(e.nodeType==8){if(e.data.startsWith(`$s`))n++;else if(e.data.startsWith(`/$s`)&&!--n)return e}t&&t.push(e);}}function fe(e){e&&(e.__c&&(e.__c.__g|=4),e.__k&&e.__k.some(fe));}function pe(e,t,n){for(var r=0;r<n.length;)he$1(n[r++],n[r++],n[r++]);u$1.__c&&u$1.__c(t,e),e.some(function(t){try{e=t.__h,t.__h=[],e.some(function(e){e.call(t);});}catch(e){u$1.__e(e,t.__v);}});}function me(e,t,n,r,i,a,o,s,c,l){var d,f,p,m,h,g,_,v,y=n.props||S$1,b=t.props,x=t.type;if(x==`svg`?i=`http://www.w3.org/2000/svg`:x==`math`?i=`http://www.w3.org/1998/Math/MathML`:i||=`http://www.w3.org/1999/xhtml`,a){for(d=0;d<a.length;d++)if((h=a[d])&&(x?h.localName==x:h.nodeType==3)){e=h,a[d]=null;break}}if(!e){if(v=l.ownerDocument||document,!x)return v.createTextNode(b);e=v.createElementNS(i,x,b.is?b:l),s&&=(u$1.__m&&u$1.__m(t,a),false),a=null;}if(x){if(l=x==`template`&&e.content||e,a=x==`textarea`&&b.defaultValue!=null?null:a&&E$1.call(l.childNodes),!s&&a)for(y={},d=0;d<e.attributes.length;d++)y[(h=e.attributes[d]).name]=h.value;for(d in y)h=y[d],d==`dangerouslySetInnerHTML`?p=h:d==`children`||d in b||d==`value`&&`defaultValue`in b||d==`checked`&&`defaultChecked`in b||ce(e,d,null,h,i);for(d in b)h=b[d],d==`children`?m=h:d==`dangerouslySetInnerHTML`?f=h:d==`value`?g=h:d==`checked`?_=h:s&&typeof h!=`function`||y[d]===h||ce(e,d,h,y[d],i);f?(s||p&&(f.__html==p.__html||f.__html==e.innerHTML)||(e.innerHTML=f.__html),t.__k=[]):(p&&(e.textContent=``),(x==`foreignObject`||i==`http://www.w3.org/1998/Math/MathML`&&w$1.test(x))&&(i=`http://www.w3.org/1999/xhtml`),ne(l,T$1(m)?m:[m],t,n,r,i,a,o,a?a[0]:n.__k&&M$2(n,0),s,c),a&&a.some(O$2)),s&&x!=`textarea`||(d=`value`,x==`progress`&&g==null?e.removeAttribute(d):g==null||g===e[d]&&(x!=`progress`||g)||ce(e,d,g,y[d],i),d=`checked`,_!=null&&_!=e[d]&&ce(e,d,_,y[d],i));}else y===b||s&&e.data==b||(e.data=b);return e}function he$1(e,t,n,r){try{typeof e==`function`?t?t.__x=e(t)||1:(r&&=r.__c||r.__e)&&(t=r.__x)&&(r.__x=null,typeof t==`function`?t():e(null)):e.current=t;}catch(e){u$1.__e(e,n);}}function ge$1(e,t,n){var r,i,a,o;if(u$1.unmount&&u$1.unmount(e),!(r=e.ref)||r.current&&r.current!=e.__e||he$1(r,null,t,e),r=e.__c){if(r.componentWillUnmount)try{r.componentWillUnmount();}catch(e){u$1.__e(e,t);}r.__P=r.__n=null;}if(r=e.__k)for(o=0;o<r.length;o++)r[o]&&ge$1(r[o],t,typeof e.type!=`function`||n&&!e.props.__P);!n&&(r=e.__c)&&(r=r.__z)&&(i=de(r,a=[]))&&(r==e.__e&&a.some(O$2),O$2(i),O$2(r)),n||O$2(e.__e),e.__e=e.__c=e.__=null;}function _e$1(e,t,n){return this.constructor(e,n)}function ve$1(e,t){var n,r,i,a;u$1.__&&u$1.__(e,t),t.nodeType==9&&(t=t.documentElement),r=(n=e&&32&e.__u)?null:t.__k,t.__k=k$2(A$2,{children:[e]}),i=[],a=[],ue(t,t.__k,r||S$1,S$1,t.namespaceURI,r?null:t.firstChild?E$1.call(t.childNodes):null,i,r?r.__e:t.firstChild,n,a),pe(i,t.__k,a),t.__k.props.children=null;}function ye$1(e){function t(e){var n,r;return this.getChildContext||(n=new Set,(r={})[t.__c]=this,this.getChildContext=function(){return r},this.shouldComponentUpdate=function(e){this.props.value!=e.value&&n.forEach(function(e){e.__g|=4,P$2(e);});},this.sub=function(e){n.add(e);var t=e.componentWillUnmount;e.componentWillUnmount=function(){n.delete(e),t&&t.call(e);};}),e.children}return t.__c=`__cC`+b$1++,t.__=e,t.Provider=(t.Consumer=function(e,t){return e.children(t)}).contextType=t,t}function be$1(e){return e.children}function xe$2(e,t){return k$2(be$1,{__P:t,children:e})}u$1={__e:function(e,t,n,r){for(var i,a,o;t=t.__;)if((i=t.__c)&&!(1&i.__g)){i.__g|=4;try{if((o=(a=i.constructor)&&a.getDerivedStateFromError)&&i.setState(a.getDerivedStateFromError(e)),i.componentDidCatch&&(i.componentDidCatch(e,r||{}),o=1),o&&8&i.__g)return void(i.__g|=2)}catch(t){e=t;}}throw m$1=0,e}},d$1=0,j$2.prototype.setState=function(e,t){var n=this.__s;n&&n!=this.state||(n=this.__s=D$1({},this.state)),typeof e==`function`&&(e=e(D$1({},n),this.props)),e&&(D$1(n,e),this.__v&&(t&&this.__k.push(t),P$2(this)));},j$2.prototype.forceUpdate=function(e){this.__v&&(this.__g|=4,e&&this.__h.push(e),P$2(this));},j$2.prototype.render=A$2,f$1=[],m$1=0,h$2=function(e,t){return e.__v.__b-t.__v.__b},g$2=Symbol(),_$2=/(PointerCapture)$|Capture$/i,v$1=0,y$1={},b$1=0;var I$2,L$2,Se$2,Ce$2,we$2=Object.is,Te$2=0,Ee$2=[],De$2=[],R$2=u$1,Oe$2=R$2.__b,ke$2=R$2.__r,Ae$2=R$2.diffed,je$2=R$2.__c,Me$2=R$2.unmount,Ne$2=R$2.__;function Pe$2(e,t){R$2.__h&&R$2.__h(L$2,e,Te$2||t),Te$2=0;var n=L$2.__H||(L$2.__H={__:[],__h:[]});return e>=n.__.length&&n.__.push({}),n.__[e]}function z$2(e){return Te$2=1,Fe$2(qe$2,e)}function Fe$2(e,t,n){var r=Pe$2(I$2++,2);if(r.t=e,!r.__c&&(r.__=[qe$2(void 0,t),function(e){var t=(r.__N||r.__)[0],n=r.t(t,e);we$2(t,n)||(r.__N=[n,r.__[1]],r.__c.setState({}));}],r.__c=L$2,!L$2.__f)){L$2.__f=true;var i=L$2.shouldComponentUpdate;L$2.shouldComponentUpdate=function(e,t,n){var r=this.__H;if(!r)return  true;var a=false,o=this.props!=e;if(r.__.some(function(e){e.__N&&(a=true,we$2(e.__[0],e.__N[0])||(o=true));}),i){var s=i.call(this,e,t,n);return a?s||o:s}return !a||o};}return r.__}function B$2(e,t){var n=Pe$2(I$2++,3);!R$2.__s&&Ke$2(n.__H,t)&&(n.__P=true,n.__=e,n.u=t,L$2.__H.__h.push(n));}function Ie$2(e,t){var n=Pe$2(I$2++,4);!R$2.__s&&Ke$2(n.__H,t)&&(n.__P=false,n.__=e,n.u=t,L$2.__h.push(n));}function V$2(e){return Te$2=5,Le$2(function(){return {current:e}},[])}function Le$2(e,t){var n=Pe$2(I$2++,7);return Ke$2(n.__H,t)&&(n.__=e(),n.__H=t),n.__}function Re$2(e,t){return Te$2=8,Le$2(function(){return e},t)}function ze$2(e){var t=L$2.context[e.__c],n=Pe$2(I$2++,9);return n.c=e,t?(n.__??(n.__=true,t.sub(L$2)),t.props.value):e.__}function H$2(){var e=Pe$2(I$2++,11);if(!e.__){for(var t=L$2.__v;!t.__m&&t.__;)t=t.__;var n=t.__m||(t.__m=[0,0]);e.__=`P`+n[0]+`-`+n[1]++;}return e.__}function Be$2(){var e;do{for(;e=De$2.shift();)try{We$2(e);}catch(t){R$2.__e(t,{__:(e=e.__P)&&e.__v});}for(;e=Ee$2.shift();){var t=e.__H;if(e.__P&&t)try{t.__h.some(We$2),t.__h.some(Ge$2),t.__h=[];}catch(n){t.__h=[],R$2.__e(n,e.__v);}}}while(De$2.length)}R$2.__b=function(e){L$2=null,Oe$2&&Oe$2(e);},R$2.__=function(e,t){e&&t.__k&&t.__k.__m&&(e.__m=t.__k.__m),Ne$2&&Ne$2(e,t);},R$2.__r=function(e){ke$2&&ke$2(e),I$2=0;var t=(L$2=e.__c).__H;t&&(Se$2==L$2?L$2.__h=[]:(t.__h.some(We$2),t.__h.some(Ge$2),I$2=0),t.__h=[],t.__.some(function(e){e.__N&&(e.__=e.__N),e.u=e.__N=void 0;})),Se$2=L$2;},R$2.diffed=function(e){Ae$2&&Ae$2(e);var t=e.__c;t&&t.__H&&(t.__H.__h.length&&Ue$2(Ee$2.push(t)),t.__H.__.some(function(e){e.u&&(e.__H=e.u);})),Se$2=L$2=null;},R$2.__c=function(e,t){t.some(function(e){try{e.__h.some(We$2),e.__h=e.__h.filter(function(e){return !e.__||Ge$2(e)});}catch(t){e.__h=[function(){throw t}];}}),je$2&&je$2(e,t);},R$2.unmount=function(e){Me$2&&Me$2(e);var t,n,r=e.__c;r&&r.__H&&(r.__H.__.some(function(r){try{if(r.__P&&r.__c){if(n===void 0){for(n=e.__;n&&(!n.__c||!n.__c.__P);)n=n.__;n&&=n.__c;}r.__P=n,Ue$2(De$2.push(r));}else We$2(r);}catch(e){t=e;}}),r.__H=void 0,t&&R$2.__e(t,r.__v));};var Ve$2=typeof requestAnimationFrame==`function`;function He$2(e){var t,n=function(){clearTimeout(r),Ve$2&&cancelAnimationFrame(t),setTimeout(e);},r=setTimeout(n,35);Ve$2&&(t=requestAnimationFrame(n));}function Ue$2(e){e!=1&&Ce$2==R$2.requestAnimationFrame||((Ce$2=R$2.requestAnimationFrame)||He$2)(Be$2);}function We$2(e){var t=L$2,n=e.__c;typeof n==`function`&&(e.__c=void 0,n()),L$2=t;}function Ge$2(e){var t=L$2;e.__c=e.__(),L$2=t;}function Ke$2(e,t){return !e||e.length!=t.length||t.some(function(t,n){return !we$2(t,e[n])})}function qe$2(e,t){return typeof t==`function`?t(e):t}var Je$2=`--rdw-control-h`,Ye$2=`--rdw-control-font`,Xe$2=12,U$2=`var(${Je$2}, 28px)`,W$2=`var(${Ye$2}, ${String(Xe$2)}px)`,G$3=exports("j",`
.rdw-kit-focusable:focus-visible {
  outline: 2px solid var(--rdw-accent);
  outline-offset: 2px;
}
`),Ze$2=Symbol.for(`pv`),Qe$2=0;function K$3(e,t,n,r,i,a){t||={};var o,s,c=t;if(`ref`in c&&typeof e!=`function`)for(s in c={},t)s==`ref`?o=t[s]:c[s]=t[s];var l={type:e,props:c,key:n,ref:o,__k:null,__:null,__b:0,__e:null,__c:null,constructor:Ze$2,__v:--Qe$2,__i:-1,__u:0};return u$1.vnode&&u$1.vnode(l),l}var $e$2=ye$1(false);function q$3(e){return ze$2($e$2)?null:K$3(`style`,{children:e.css})}var et$2=`ArrowDown`,tt$2=`ArrowUp`,nt$2=`Enter`,rt$2=`Escape`,it$2=-1,at$2=`
${G$3}
.rdw-ac {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.rdw-ac__dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  margin-right: 6px;
  border-radius: 50%;
  vertical-align: middle;
}
.rdw-ac__dot[data-kind="artist"] { background: var(--rdw-tag-artist); }
.rdw-ac__dot[data-kind="character"] { background: var(--rdw-tag-character); }
.rdw-ac__dot[data-kind="copyright"] { background: var(--rdw-tag-copyright); }
.rdw-ac__dot[data-kind="metadata"] { background: var(--rdw-tag-metadata); }
.rdw-ac__label {
  font: 600 10.5px var(--rdw-font);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--rdw-muted);
}
.rdw-ac__input {
  box-sizing: border-box;
  min-height: ${U$2};
  height: ${U$2};
  width: 100%;
  padding: 0 8px;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-surface);
  color: var(--rdw-text);
  font: inherit;
  font-size: ${W$2};
}
/* Site CSS paints focused text inputs light yellow; keep the theme colours. */
input.rdw-ac__input.rdw-kit-focusable:focus {
  background: var(--rdw-surface);
  color: var(--rdw-text);
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
  min-height: ${U$2};
  display: flex;
  align-items: center;
  padding: 0 8px;
  border-radius: var(--rdw-radius-s);
  font-size: ${W$2};
  color: var(--rdw-text);
  cursor: pointer;
}
.rdw-ac__option[aria-selected="true"],
.rdw-ac__option:hover {
  background: var(--rdw-surface-2);
}
`;function ot$2(e){let t=H$2(),n=H$2(),r=e.id??t,i=V$2(null),[a,o]=z$2(false),[s,c]=z$2(it$2),l=e.suggestions,u=l.length>0,d=a&&u&&e.disabled!==true;B$2(()=>{c(it$2),o(!!u);},[l,u]),B$2(()=>{if(!d)return;let e=e=>{let t=i.current;t!==null&&(e.composedPath().includes(t)||(o(false),c(it$2)));};return document.addEventListener(`mousedown`,e),()=>{document.removeEventListener(`mousedown`,e);}},[d]);let f=t=>{e.replaceOnSelect!==false&&e.onChange(t.value),e.onSelect?.(t),o(false),c(it$2);},p=[`rdw-ac`,e.className].filter(e=>e!==void 0&&e.length>0).join(` `),m=s>=0&&s<l.length?l[s]:void 0;return K$3(A$2,{children:[K$3(q$3,{css:at$2}),K$3(`div`,{className:p,ref:i,children:[e.label===void 0?null:K$3(`label`,{className:`rdw-ac__label`,htmlFor:r,children:e.label}),K$3(`input`,{id:r,className:`rdw-ac__input rdw-kit-focusable`,type:`text`,role:`combobox`,"aria-autocomplete":`list`,"aria-expanded":d,"aria-controls":n,"aria-activedescendant":m===void 0?void 0:`${n}-opt-${String(s)}`,value:e.value,placeholder:e.placeholder,disabled:e.disabled,"aria-label":e[`aria-label`]??e.label,autoComplete:`off`,onInput:t=>{e.onChange(t.currentTarget.value);},onFocus:()=>{u&&o(true);},onKeyDown:e=>{if(e.key===rt$2)d&&(e.preventDefault(),o(false),c(it$2));else if(e.key===et$2){if(!u)return;e.preventDefault(),o(true),c(e=>e<0?0:Math.min(e+1,l.length-1));}else if(e.key===tt$2){if(!d)return;e.preventDefault(),c(e=>e<=0?it$2:e-1);}else e.key===nt$2&&d&&m!==void 0&&(e.preventDefault(),f(m));}}),d?K$3(`ul`,{className:`rdw-ac__list`,role:`listbox`,id:n,tabIndex:-1,children:l.map((e,t)=>K$3(`li`,{id:`${n}-opt-${String(t)}`,role:`option`,className:`rdw-ac__option rdw-kit-focusable`,"aria-selected":t===s,onMouseDown:e=>{e.preventDefault();},onClick:()=>{f(e);},children:[e.type===`artist`||e.type===`character`||e.type===`copyright`||e.type===`metadata`?K$3(`span`,{className:`rdw-ac__dot`,"data-kind":e.type,"aria-hidden":`true`}):null,e.label]},`${e.value}:${e.type??``}:${e.label}`))}):null]})]})}var st$2=`
${G$3}
.rdw-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-sizing: border-box;
  min-height: ${U$2};
  border-radius: var(--rdw-radius-m);
  font: inherit;
  font-size: ${W$2};
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  padding: 0 12px;
  color: var(--rdw-text);
  background: var(--rdw-surface);
}
.rdw-btn--s {
  min-height: ${U$2};
  padding: 0 10px;
  font-size: ${W$2};
}
.rdw-btn--m {
  min-height: ${U$2};
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
.rdw-btn[aria-pressed="true"] {
  background: var(--rdw-accent-soft);
  border-color: var(--rdw-accent);
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
.rdw-btn--danger-quiet {
  background: var(--rdw-surface);
  border-color: var(--rdw-danger);
  color: var(--rdw-danger);
}
.rdw-btn--danger-quiet:hover:not(:disabled) {
  background: var(--rdw-danger-soft);
}
.rdw-btn:disabled,
.rdw-btn[aria-busy="true"] {
  opacity: 0.55;
  cursor: not-allowed;
}
/* A main button that cannot be pressed is grey: dimmed blue read as pressed. */
.rdw-btn--primary:disabled:not([aria-busy="true"]) {
  background: var(--rdw-surface-2);
  border-color: var(--rdw-border);
  color: var(--rdw-muted);
  opacity: 1;
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
`;function J$3(e){let t=e.variant??`secondary`,n=e.size??`m`,r=e.loading===true,i=e.disabled===true||r,a=[`rdw-btn`,`rdw-kit-focusable`,`rdw-btn--${t}`,`rdw-btn--${n}`,e.className].filter(e=>e!==void 0&&e.length>0).join(` `);return K$3(A$2,{children:[K$3(q$3,{css:st$2}),K$3(`button`,{type:e.type??`button`,className:a,disabled:i,"aria-busy":r?true:void 0,"aria-label":e[`aria-label`],title:e.title,"aria-pressed":e.pressed,...e.buttonRef===void 0?{}:{ref:e.buttonRef},onClick:e.onClick,children:[r?K$3(`span`,{className:`rdw-btn__spinner`,"aria-hidden":`true`}):null,e.children]})]})}var ct$2=`
.rdw-card {
  background: var(--rdw-surface);
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-l);
  box-shadow: var(--rdw-shadow-1);
}
`;function lt$2(e){let t=e.as??`div`,n=[`rdw-card`,e.className].filter(e=>e!==void 0&&e.length>0).join(` `);return K$3(A$2,{children:[K$3(q$3,{css:ct$2}),K$3(t,{className:n,children:e.children})]})}var Y$3=16;function X$3(e,t,n){let r={width:e,height:e,viewBox:`0 0 24 24`,fill:`none`,stroke:`currentColor`,"stroke-width":2,"stroke-linecap":`round`,"stroke-linejoin":`round`,"aria-hidden":n===void 0||void 0,role:n===void 0?void 0:`img`};return t!==void 0&&(r.className=t),n!==void 0&&(r[`aria-label`]=n),r}function ut$2(e){return K$3(`svg`,{...X$3(e.size??Y$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`polygon`,{points:`12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2`})]})}function dt$2(e){return K$3(`svg`,{...X$3(e.size??Y$3,e.className,e.title),fill:`currentColor`,stroke:`none`,children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`polygon`,{points:`12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2`})]})}function ft$2(e){return K$3(`svg`,{...X$3(e.size??Y$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`line`,{x1:`12`,y1:`5`,x2:`12`,y2:`19`}),K$3(`line`,{x1:`5`,y1:`12`,x2:`19`,y2:`12`})]})}function pt$2(e){return K$3(`svg`,{...X$3(e.size??Y$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`polyline`,{points:`20 6 9 17 4 12`})]})}function mt$2(e){return K$3(`svg`,{...X$3(e.size??Y$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`line`,{x1:`18`,y1:`6`,x2:`6`,y2:`18`}),K$3(`line`,{x1:`6`,y1:`6`,x2:`18`,y2:`18`})]})}function ht$2(e){return K$3(`svg`,{...X$3(e.size??Y$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`polyline`,{points:`6 9 12 15 18 9`})]})}function gt$2(e){return K$3(`svg`,{...X$3(e.size??Y$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`line`,{x1:`12`,y1:`19`,x2:`12`,y2:`5`}),K$3(`polyline`,{points:`5 12 12 5 19 12`})]})}function _t$2(e){return K$3(`svg`,{...X$3(e.size??Y$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`path`,{d:`M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6`}),K$3(`polyline`,{points:`15 3 21 3 21 9`}),K$3(`line`,{x1:`10`,y1:`14`,x2:`21`,y2:`3`})]})}function vt$2(e){return K$3(`svg`,{...X$3(e.size??Y$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`path`,{d:`M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z`})]})}function yt$2(e){return K$3(`svg`,{...X$3(e.size??Y$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`path`,{d:`M12 20h9`}),K$3(`path`,{d:`M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z`})]})}function bt$2(e){return K$3(`svg`,{...X$3(e.size??Y$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`path`,{d:`M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z`}),K$3(`line`,{x1:`4`,y1:`22`,x2:`4`,y2:`15`})]})}function xt$2(e){return K$3(`svg`,{...X$3(e.size??Y$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`path`,{d:`M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z`}),K$3(`polyline`,{points:`14 2 14 8 20 8`}),K$3(`line`,{x1:`8`,y1:`13`,x2:`16`,y2:`13`}),K$3(`line`,{x1:`8`,y1:`17`,x2:`12`,y2:`17`})]})}function St$2(e){return K$3(`svg`,{...X$3(e.size??Y$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`circle`,{cx:`11`,cy:`11`,r:`8`}),K$3(`line`,{x1:`21`,y1:`21`,x2:`16.65`,y2:`16.65`})]})}function Ct$2(e){return K$3(`svg`,{...X$3(e.size??Y$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`polyline`,{points:`3 6 5 6 21 6`}),K$3(`path`,{d:`M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2`})]})}function wt$2(e){return K$3(`svg`,{...X$3(e.size??Y$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`rect`,{x:`3`,y:`3`,width:`18`,height:`18`,rx:`2`,ry:`2`}),K$3(`circle`,{cx:`8.5`,cy:`8.5`,r:`1.5`}),K$3(`polyline`,{points:`21 15 16 10 5 21`})]})}function Tt$2(e){return K$3(`svg`,{...X$3(e.size??Y$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`line`,{x1:`2`,y1:`2`,x2:`22`,y2:`22`}),K$3(`path`,{d:`M10.41 10.41a2 2 0 1 1-2.83-2.83`}),K$3(`line`,{x1:`13.5`,y1:`13.5`,x2:`6`,y2:`21`}),K$3(`line`,{x1:`18`,y1:`12`,x2:`21`,y2:`15`}),K$3(`path`,{d:`M3.59 3.59A1.99 1.99 0 0 0 3 5v14a2 2 0 0 0 2 2h14c.55 0 1.052-.22 1.41-.59`}),K$3(`path`,{d:`M21 15V5a2 2 0 0 0-2-2H9`})]})}function Et$2(e){return K$3(`svg`,{...X$3(e.size??Y$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`rect`,{x:`9`,y:`9`,width:`13`,height:`13`,rx:`2`,ry:`2`}),K$3(`path`,{d:`M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1`})]})}function Dt$2(e){return K$3(`svg`,{...X$3(e.size??Y$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`rect`,{x:`3`,y:`3`,width:`18`,height:`18`,rx:`2`,ry:`2`}),K$3(`path`,{d:`M16 8h.01`}),K$3(`path`,{d:`M12 12h.01`}),K$3(`path`,{d:`M8 16h.01`})]})}function Ot$2(e){return K$3(`svg`,{...X$3(e.size??Y$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`circle`,{cx:`12`,cy:`12`,r:`1`}),K$3(`circle`,{cx:`19`,cy:`12`,r:`1`}),K$3(`circle`,{cx:`5`,cy:`12`,r:`1`})]})}function kt$2(e){return K$3(`svg`,{...X$3(e.size??Y$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`circle`,{cx:`12`,cy:`12`,r:`10`}),K$3(`path`,{d:`M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3`}),K$3(`path`,{d:`M12 17h.01`})]})}function At$2(e){return K$3(`svg`,{...X$3(e.size??Y$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`path`,{d:`M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4`}),K$3(`polyline`,{points:`7 10 12 15 17 10`}),K$3(`line`,{x1:`12`,y1:`15`,x2:`12`,y2:`3`})]})}function jt$2(e){return K$3(`svg`,{...X$3(e.size??Y$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`path`,{d:`M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8`}),K$3(`path`,{d:`M21 3v5h-5`}),K$3(`path`,{d:`M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16`}),K$3(`path`,{d:`M8 16H3v5`})]})}var Mt$2=`
${G$3}
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
  font-size: ${W$2};
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
  width: ${U$2};
  height: ${U$2};
  min-width: ${U$2};
  min-height: ${U$2};
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
`;function Nt$2(e){let t=e.variant??`dot`,n=e.kind??`default`,r=[`rdw-chip`,`rdw-chip--${t}`,n==="default"?void 0:`rdw-chip--${n}`,e.className].filter(e=>e!==void 0&&e.length>0).join(` `);return K$3(A$2,{children:[K$3(q$3,{css:Mt$2}),K$3(`span`,{className:r,children:[t===`dot`?K$3(`i`,{className:`rdw-chip__dot`,"aria-hidden":`true`}):null,K$3(`span`,{children:e.label}),e.onRemove===void 0?null:K$3(`button`,{type:`button`,className:`rdw-chip__remove rdw-kit-focusable`,"aria-label":`Remove ${e.label}`,onClick:e.onRemove,children:K$3(mt$2,{size:12})})]})]})}var Pt$1=Object.assign,Ft$1=/^(-|f[lo].*[^se]$|g.{5,}[^ps]$|z|o[pr]|(W.{5})?[lL]i.*(t|mp)$|an|(bo|s).{4}Im|sca|m.{6}[ds]|ta|c.*[st]$|wido|ini|asp|fill|st)/;function It$1(e,t){var n=xe$2(e,t);return n.containerInfo=t,n}var Lt$1=Symbol.for(`react.element`),Rt$1=/^(?:accent|alignment|arabic|baseline|cap|clip(?!PathU)|color|dominant|fill|flood|font|glyph(?!R)|horiz|image(?!S)|letter|lighting|marker(?!H|W|U)|overline|paint|pointer|shape|stop|strikethrough|stroke|text(?!L)|transform|underline|unicode|units|v|vector|vert|word|writing|x(?!C))[A-Z]/,zt$1=/[A-Z0-9]/g,Bt$1=typeof document<`u`,Vt$1=function(e){return /fil|che|rad/.test(e)};j$2.prototype.isReactComponent=true,[`componentWillMount`,`componentWillReceiveProps`,`componentWillUpdate`].forEach(function(e){Object.defineProperty(j$2.prototype,e,{configurable:true,get:function(){return this[`UNSAFE_`+e]},set:function(t){Object.defineProperty(this,e,{configurable:true,writable:true,value:t});}});});var Ht$1=u$1.event;u$1.event=function(e){return Ht$1&&(e=Ht$1(e)),e.persist=function(){},e.isPropagationStopped=function(){return this.cancelBubble},e.isDefaultPrevented=function(){return this.defaultPrevented},e.nativeEvent=e};var Ut$1={configurable:true,get:function(){return this.class}},Wt$1=u$1.vnode;u$1.vnode=function(e){if(typeof e.type==`string`)(function(e){var t=e.props,n=e.type,r={},i=n.indexOf(`-`)==-1;for(var a in t){var o=t[a];if(!(a==`value`&&`defaultValue`in t&&o==null||Bt$1&&a==`children`&&n==`noscript`||a==`class`||a==`className`)){if(a==`style`&&o&&o.constructor==Object){var s=void 0;for(var c in o)typeof o[c]!=`number`||Ft$1.test(c)||(s||=o=Pt$1({},o),o[c]+=`px`);}else if(a==`defaultValue`&&`value`in t&&t.value==null)a=`value`;else if(a==`download`&&true===o)o=``;else if(a==`translate`&&o===`no`)o=false;else if(a[0]==`o`&&a[1]==`n`){var l=a.toLowerCase();l==`ondoubleclick`?a=`ondblclick`:l!=`onchange`||n!=`input`&&n!=`textarea`||Vt$1(t.type)?l==`onfocus`?a=`onfocusin`:l==`onblur`&&(a=`onfocusout`):l=a=`oninput`,l==`oninput`&&r[a=l]&&(a=`oninputCapture`);}else i&&Rt$1.test(a)?a=a.replace(zt$1,`-$&`).toLowerCase():o===null&&(o=void 0);r[a]=o;}}if(n==`select`){var u=r.defaultValue==null?r.multiple&&Array.isArray(r.value)?r.value:null:r.defaultValue;u!=null&&(r.value=ae(t.children).forEach(function(e){e.props.selected=r.multiple?u.indexOf(e.props.value)!=-1:u==e.props.value;}));}t.class&&!t.className?(r.class=t.class,Object.defineProperty(r,"className",Ut$1)):t.className&&(r.class=r.className=t.className),e.props=r;})(e);else if(typeof e.type==`function`&&(`ref`in e.props&&`prototype`in e.type&&e.type.prototype.render&&(e.ref=e.props.ref,delete e.props.ref),e.type.defaultProps)){var t=Pt$1({},e.props);for(var n in e.type.defaultProps)t[n]===void 0&&(t[n]=e.type.defaultProps[n]);e.props=t;}e.ref&&!(`ref`in e.props)&&Object.defineProperty(e.props,"ref",{value:e.ref,configurable:true,writable:true}),e.$$typeof=Lt$1,Wt$1&&Wt$1(e);};var Gt$1=exports("aK",ye$1(false)),Kt$1=`
${G$3}
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
  min-height: ${U$2};
  height: ${U$2};
  width: 100%;
  padding: 0 8px;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-surface);
  color: var(--rdw-text);
  font: inherit;
  font-size: ${W$2};
}
/* Site CSS paints focused text inputs light yellow; keep the theme colours. */
input.rdw-field__input.rdw-kit-focusable:focus {
  background: var(--rdw-surface);
  color: var(--rdw-text);
}
/* A value filled in by the browser keeps the theme's colours too. */
.rdw-field__input:-webkit-autofill,
.rdw-field__input:-webkit-autofill:hover,
.rdw-field__input:-webkit-autofill:focus {
  -webkit-text-fill-color: var(--rdw-text);
  caret-color: var(--rdw-text);
  box-shadow: 0 0 0 1000px var(--rdw-surface) inset;
}
/* The ring of a field lies on its border and does not stand off it. */
.rdw-field__input.rdw-kit-focusable:focus-visible {
  outline-offset: -1px;
  border-color: var(--rdw-accent);
}
.rdw-field__input::placeholder {
  color: var(--rdw-muted);
}
.rdw-field__input:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
`;function qt$1(e){let t=H$2(),n=e.id??t,r=[`rdw-field`,e.className].filter(e=>e!==void 0&&e.length>0).join(` `);return K$3(A$2,{children:[K$3(q$3,{css:Kt$1}),K$3(`div`,{className:r,children:[e.label===void 0?null:K$3(`label`,{className:`rdw-field__label`,htmlFor:n,children:e.label}),e.type===`password`?K$3(`input`,{id:n,className:`rdw-field__input rdw-kit-focusable`,type:`password`,value:e.value,placeholder:e.placeholder,disabled:e.disabled,"aria-label":e[`aria-label`]??e.label,onInput:t=>{e.onChange(t.currentTarget.value);}}):K$3(`input`,{id:n,className:`rdw-field__input rdw-kit-focusable`,type:`text`,value:e.value,placeholder:e.placeholder,disabled:e.disabled,"aria-label":e[`aria-label`]??e.label,...e.inputAttrs,...e.inputRef===void 0?{}:{ref:e.inputRef},onInput:t=>{e.onChange(t.currentTarget.value);}})]})]})}var Jt$1=`confirm`,Yt$1=`fields`,Xt$1=`name`,Zt$1=`query`,Qt$1=`Name`,$t$1=`Query`,en$1=`primary`,tn$1=`Escape`,nn$1=`combobox`,rn$1=`true`,an$1=`Tab`,on$1=`keydown`,sn$1=`mousedown`,cn$1=40,ln$1=360,un$1=16,dn$1=.45,fn$1=16,pn$1=12,mn$1=8,hn$1=8,gn$1=`a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])`,_n$1=`
${G$3}
.rdw-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: ${String(cn$1)};
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: ${String(un$1)}px;
  background: rgba(0, 0, 0, ${String(dn$1)});
}
.rdw-dialog {
  box-sizing: border-box;
  width: 100%;
  max-width: ${String(ln$1)}px;
  display: grid;
  gap: ${String(pn$1)}px;
  padding: ${String(fn$1)}px;
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
  gap: ${String(mn$1)}px;
  margin: 0;
}
.rdw-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: ${String(hn$1)}px;
}
`;function vn$1(e){let t=e.querySelectorAll(gn$1),n=[];for(let e of t)e instanceof HTMLElement&&e.closest(`[hidden]`)===null&&n.push(e);return n}function yn$1(e,t){if(t===null)return  false;for(let n of e)if(n===t)return  true;return  false}function bn$1(e){if(e.variant===Jt$1){let t=e.confirmTone??en$1;return K$3(A$2,{children:[K$3(`p`,{className:`rdw-dialog__message`,children:e.message}),K$3(`div`,{className:`rdw-dialog__actions`,children:[K$3(J$3,{variant:`secondary`,size:`s`,onClick:e.onClose,children:e.cancelLabel}),K$3(J$3,{variant:t,size:`s`,onClick:e.onConfirm,children:e.confirmLabel})]})]})}if(e.variant===Yt$1){let t=e.nameLabel??Qt$1,n=e.queryLabel??$t$1,r=t=>{e.onFieldsChange({name:e.fields.name,query:t});};return K$3(`form`,{className:`rdw-dialog__fields`,onSubmit:t=>{t.preventDefault(),e.onSubmit();},children:[e.only===Zt$1?null:K$3(qt$1,{label:t,value:e.fields.name,onChange:t=>{e.onFieldsChange({name:t,query:e.fields.query});}}),e.only===Xt$1?null:e.renderQueryField===void 0?K$3(qt$1,{label:n,value:e.fields.query,onChange:r}):e.renderQueryField({label:n,value:e.fields.query,onChange:r}),K$3(`div`,{className:`rdw-dialog__actions`,children:[K$3(J$3,{variant:`secondary`,size:`s`,type:`button`,onClick:e.onClose,children:e.cancelLabel}),K$3(J$3,{variant:`primary`,size:`s`,type:`submit`,children:e.submitLabel})]})]})}return K$3(A$2,{children:e.children})}function xn$1(e){let t=e.composedPath()[0];return t instanceof Element&&t.getAttribute(`role`)===nn$1&&t.getAttribute(`aria-expanded`)===rn$1}function Sn$1(e){let t=V$2(null),n=V$2(false),r=V$2(null),i=H$2(),a=e.title!==void 0&&e.title.length>0,o=ze$2(Gt$1);if(B$2(()=>{if(!e.open){if(n.current){n.current=false;let e=r.current;r.current=null,e!==null&&typeof e.focus==`function`&&e.focus();}return}if(!n.current){let e=document.activeElement;r.current=e instanceof HTMLElement?e:null,n.current=true;}let i=t.current;if(i!==null){let t=e.initialFocusRef?.current??null;if(t!==null&&typeof t.focus==`function`)t.focus();else {let e=vn$1(i)[0];e===void 0?i.focus():e.focus();}}let a=n=>{if(n.key===tn$1){if(xn$1(n))return;n.preventDefault(),n.stopPropagation(),e.onClose();return}if(n.key!==an$1)return;let r=t.current;if(r===null)return;let i=vn$1(r);if(i.length===0){n.preventDefault(),r.focus();return}let a=i[0],o=i[i.length-1];if(a===void 0||o===void 0)return;let s=document.activeElement;n.shiftKey?s!==a&&r.contains(s)||(n.preventDefault(),o.focus()):s===o&&(n.preventDefault(),a.focus());},o=n=>{let r=t.current;r!==null&&(yn$1(n.composedPath(),r)||e.onClose());};return document.addEventListener(on$1,a,true),document.addEventListener(sn$1,o,true),()=>{document.removeEventListener(on$1,a,true),document.removeEventListener(sn$1,o,true);}},[e.open,e.onClose,e.initialFocusRef]),!e.open)return null;let s=[`rdw-dialog`,e.className].filter(e=>e!==void 0&&e.length>0).join(` `),c=K$3(A$2,{children:[K$3(q$3,{css:_n$1}),K$3(`div`,{className:`rdw-dialog-backdrop`,children:K$3(`div`,{ref:t,className:s,role:`dialog`,"aria-modal":`true`,"aria-label":a?void 0:e[`aria-label`],"aria-labelledby":a?i:void 0,tabIndex:-1,children:[a?K$3(`h2`,{id:i,className:`rdw-dialog__title`,children:e.title}):null,bn$1(e)]})})]});return o?c:It$1(K$3($e$2.Provider,{value:false,children:c}),document.body)}var Cn$1=`
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
`;function wn$1(e){let t=[`rdw-empty`,e.className].filter(e=>e!==void 0&&e.length>0).join(` `);return K$3(A$2,{children:[K$3(q$3,{css:Cn$1}),K$3(`div`,{className:t,role:`status`,children:[K$3(`p`,{className:`rdw-empty__title`,children:e.title}),e.description===void 0?null:K$3(`p`,{className:`rdw-empty__desc`,children:e.description}),e.action]})]})}var Tn$1=`
${G$3}
.rdw-icon-btn {
  box-sizing: border-box;
  display: inline-grid;
  place-items: center;
  min-width: ${U$2};
  min-height: ${U$2};
  width: ${U$2};
  height: ${U$2};
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
`;function En$1(e){let t=[`rdw-icon-btn`,`rdw-kit-focusable`,e.className].filter(e=>e!==void 0&&e.length>0).join(` `);return K$3(A$2,{children:[K$3(q$3,{css:Tn$1}),K$3(`button`,{type:`button`,className:t,"aria-label":e.label,title:e.label,"aria-pressed":e.pressed,"aria-haspopup":e.menuOpen===void 0?void 0:`menu`,"aria-expanded":e.menuOpen,...e.buttonRef===void 0?{}:{ref:e.buttonRef},disabled:e.disabled,onClick:e.onClick,children:e.children})]})}var Dn$1=`
${G$3}
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
  min-height: ${U$2};
  height: ${U$2};
  width: 100%;
  padding: 0 8px;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-surface);
  color: var(--rdw-text);
  font: inherit;
  font-size: ${W$2};
}
.rdw-num__input:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
/* The browser's own arrows are white boxes on a dark field; the arrow keys
   still change the number. */
.rdw-num__input::-webkit-inner-spin-button,
.rdw-num__input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.rdw-num__input {
  -moz-appearance: textfield;
  appearance: textfield;
}
/* The ring of a field lies on its border and does not stand off it. */
.rdw-num__input.rdw-kit-focusable:focus-visible {
  outline-offset: -1px;
  border-color: var(--rdw-accent);
}
`;function On$1(e){let t=H$2(),n=e.id??t,r=[`rdw-num`,e.className].filter(e=>e!==void 0&&e.length>0).join(` `);return K$3(A$2,{children:[K$3(q$3,{css:Dn$1}),K$3(`div`,{className:r,children:[e.label===void 0?null:K$3(`label`,{className:`rdw-num__label`,htmlFor:n,children:e.label}),K$3(`input`,{id:n,className:`rdw-num__input rdw-kit-focusable`,type:`number`,value:e.value??``,min:e.min,max:e.max,step:e.step,placeholder:e.placeholder,disabled:e.disabled,"aria-label":e.label,onInput:t=>{let n=t.currentTarget.value;if(n.trim()===``){e.onChange(null);return}let r=Number(n);e.onChange(Number.isFinite(r)?r:null);}})]})]})}var kn$1=`Escape`,An$1=`keydown`,jn$1=`mousedown`,Mn$1=`scroll`,Nn$1=`resize`,Pn$1=`rdw-popover--fixed`,Fn$1=120,In$1=4,Ln$1=`
${G$3}
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
.rdw-popover.${Pn$1} {
  position: fixed;
  z-index: ${String(Fn$1)};
  min-width: 0;
  margin: 0;
  box-sizing: border-box;
}
`;function Rn$1(e,t,n,r){let i=e;return i+n>r&&(i=r-n),{top:t+In$1,left:i}}function zn$1(e,t){if(t===null)return  false;for(let n of e)if(n===t)return  true;return  false}function Bn$1(e){let t=V$2(null),n=V$2(false);B$2(()=>{if(!e.open){if(n.current){n.current=false;let t=e.anchorRef?.current??null;t!==null&&typeof t.focus==`function`&&t.focus();}return}n.current=true;let r=t=>{t.key===kn$1&&(t.preventDefault(),e.onClose());},i=n=>{let r=t.current;if(r===null)return;let i=n.composedPath();zn$1(i,r)||zn$1(i,e.anchorRef?.current??null)||e.onClose();};return document.addEventListener(An$1,r),document.addEventListener(jn$1,i),()=>{document.removeEventListener(An$1,r),document.removeEventListener(jn$1,i);}},[e.open,e.onClose,e.anchorRef]);let r=e.widthPx,i=r!==void 0;if(Ie$2(()=>{if(!e.open||r===void 0)return;let n=()=>{let n=e.anchorRef?.current??null,i=t.current;if(n===null||i===null)return;let a=n.getBoundingClientRect(),o=Rn$1(e.alignEnd===true?Math.max(0,a.right-r):a.left,a.bottom,r,window.innerWidth);i.style.position=`fixed`,i.style.top=`${String(o.top)}px`,i.style.left=`${String(o.left)}px`,i.style.width=`${String(r)}px`;};n();let i=()=>{n();};return window.addEventListener(Mn$1,i,true),window.addEventListener(Nn$1,i),()=>{window.removeEventListener(Mn$1,i,true),window.removeEventListener(Nn$1,i);}},[e.open,e.anchorRef,e.alignEnd,r]),!e.open)return null;let a=[`rdw-popover`,i?Pn$1:void 0,e.className].filter(e=>e!==void 0&&e.length>0).join(` `),o=K$3(A$2,{children:[K$3(q$3,{css:Ln$1}),K$3(`div`,{ref:t,className:a,role:e.role??`dialog`,"aria-label":e[`aria-label`],children:e.children})]});return i&&document.body!==null?It$1(K$3($e$2.Provider,{value:false,children:o}),document.body):o}var Vn$1=`--rdw-progress-width`,Hn$1=`
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
  width: var(${Vn$1}, 0%);
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
`;function Un$1(e){return !Number.isFinite(e)||e<0?0:e>1?1:e}function Wn$1(e){let t=V$2(null),n=e.waiting===true,r=e.value!==void 0&&e.value!==null,i=r?Un$1(e.value):0,a=[`rdw-progress`,e.className].filter(e=>e!==void 0&&e.length>0).join(` `);return B$2(()=>{let e=t.current;e!==null&&(n||!r?e.style.removeProperty(Vn$1):e.style.setProperty(Vn$1,`${Math.round(i*100)}%`));},[n,r,i]),K$3(A$2,{children:[K$3(q$3,{css:Hn$1}),K$3(`div`,{className:a,children:[e.label===void 0?null:K$3(`div`,{className:`rdw-progress__label`,children:e.label}),K$3(`div`,{className:`rdw-progress__track`,role:`progressbar`,"aria-label":e.label,"aria-valuemin":0,"aria-valuemax":100,"aria-valuenow":r&&!n?Math.round(i*100):void 0,children:K$3(`div`,{ref:t,className:n?`rdw-progress__fill rdw-progress__fill--indeterminate`:`rdw-progress__fill`})})]})]})}var Gn$1=`rdw-search-field`,Kn$1=`rdw-search-help`,qn$1=`rdw-search-field__icon`,Jn$1=`rdw-search-field__tools`,Yn$1=`rdw-search-field__tool`,Xn$1=`rdw-search-help__note`,Zn$1=`rdw-search-field__input`,Qn$1=`rdw-suggest`,$n$1=`rdw-suggest__heading`,er$1=`rdw-suggest__list`,Z$3=`rdw-suggest__row`,tr$1=`rdw-suggest__row--active`,nr$1=`rdw-suggest__row--divider`,rr$1=`rdw-suggest__label`,ir$1=`rdw-suggest__trailing`,ar$1=320,or$1=480,sr$1=28,cr$1=4,lr$1=8,ur$1=120,dr$1=3,fr$1=`ArrowDown`,pr$1=`ArrowUp`,mr$1=`Enter`,hr$1=`Tab`,gr$1=`Escape`,_r$1=`Clear`,vr$1=320,yr$1=14,br$1=`
.${Gn$1} {
  position: relative;
  min-width: 0;
}
.${Gn$1} .${Zn$1} {
  margin: 0;
}
.${Gn$1} .${Zn$1} .rdw-field__input {
  padding-left: 30px;
  padding-right: 56px;
}
.${qn$1} {
  position: absolute;
  left: 9px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--rdw-muted);
  pointer-events: none;
}
.${Jn$1} {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 2px;
}
.${Yn$1} {
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  border-radius: var(--rdw-radius-s);
  background: transparent;
  color: var(--rdw-muted);
  cursor: pointer;
}
.${Yn$1}:hover,
.${Yn$1}[aria-expanded="true"] {
  color: var(--rdw-text);
}
.${Kn$1} {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 4px 12px;
  margin: 0;
}
/* The site styles dt on its own (bold, its own font); a command has to be in
   a fixed-width font, or the spaces that matter in it cannot be seen. */
.rdw-popover .${Kn$1} dt {
  margin: 0;
  font: 400 12px/1.4 ui-monospace, "Cascadia Mono", Consolas, "Courier New", monospace !important;
  white-space: pre;
  color: var(--rdw-text);
}
.${Kn$1} dd {
  margin: 0;
  color: var(--rdw-muted);
}
.${Xn$1} {
  margin: 8px 0 0;
  padding-top: 8px;
  border-top: 1px solid var(--rdw-border);
  color: var(--rdw-muted);
  line-height: 1.4;
}
`.trim(),xr$1=`
.${Qn$1} {
  position: fixed;
  z-index: ${String(ur$1)};
  box-sizing: border-box;
  margin: 0;
  padding: 4px;
  background: var(--rdw-surface);
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-l);
  box-shadow: var(--rdw-shadow-2);
  color: var(--rdw-text);
  font: 12.5px/1.35 var(--rdw-font);
}
.${$n$1} {
  padding: 4px 8px 6px;
  color: var(--rdw-muted);
  font: 600 10.5px var(--rdw-font);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.${er$1} {
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 224px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--rdw-border) transparent;
}
.${Z$3} {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: ${String(sr$1)}px;
  margin: 0;
  padding: 0 8px 0 11px;
  border-radius: var(--rdw-radius-s);
  list-style: none;
  cursor: pointer;
  position: relative;
}
.${Z$3}.${nr$1} {
  margin-top: 9px;
}
/* The rule between the tags that begin with what was typed and the rest. */
.${Z$3}.${nr$1}::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: -5px;
  border-top: 1px solid var(--rdw-border);
}
.${Z$3}:hover,
.${Z$3}.${tr$1} {
  background: var(--rdw-surface-2);
}
/* The line chosen with the keyboard has a bar as well: not told by colour alone. */
.${Z$3}.${tr$1}::before {
  content: "";
  position: absolute;
  left: 0;
  top: 4px;
  bottom: 4px;
  width: ${String(dr$1)}px;
  border-radius: ${String(dr$1)}px;
  background: var(--rdw-accent);
}
.${rr$1} {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--rdw-muted);
}
.${rr$1} b {
  color: var(--rdw-text);
  font-weight: 700;
}
/* On the chosen line the rest of the tag is in the text colour too: muted on
   the fill of that line passes the contrast limit only just (4.7:1 in Dark).
   What was typed is still told by its weight. */
.${Z$3}.${tr$1} .${rr$1} {
  color: var(--rdw-text);
}
.${ir$1} {
  flex: none;
  color: var(--rdw-muted);
  font-variant-numeric: tabular-nums;
  text-align: right;
}
`.trim();function Sr$1(e,t,n,r){let i=Math.max(0,r-16),a=Math.min(i,Math.max(ar$1,Math.min(or$1,n))),o=Math.max(lr$1,Math.min(e,r-lr$1-a));return {top:t+cr$1,left:o,width:a}}function Cr$1(e){return K$3(A$2,{children:[K$3(q$3,{css:br$1}),K$3(`dl`,{className:Kn$1,children:e.help.rows.map(([e,t])=>K$3(A$2,{children:[K$3(`dt`,{children:e}),K$3(`dd`,{children:t})]}))}),e.help.note===void 0?null:K$3(`p`,{className:Xn$1,children:e.help.note})]})}function wr$1(e){let[t,n]=z$2(false),r=V$2(null),i=V$2(null),a=V$2(null),o=V$2(null),s=H$2(),[c,l]=z$2(0),[u,d]=z$2(false),[f,p]=z$2(false),[m,h]=z$2(0),g=V$2(null),{help:_,suggest:v,onCommit:y}=e,b=e.clearLabel??_r$1,x=[Gn$1,e.className].filter(e=>e!==void 0&&e.length>0).join(` `),S=v!==void 0&&u&&!f?v.list(e.value,c):null,C=S?.items??[],w=C.length>0,T=w?Math.min(m,C.length-1):-1,E=()=>a.current?.selectionStart??e.value.length,D=t=>{e.onChange(t);let n=a.current?.selectionStart??t.length;l(n),p(false),h(0);let r=v===void 0?null:v.list(t,n);(r===null||r.items.length===0)&&y?.(t);},O=t=>{let n=v?.pick(e.value,c,t)??null;n!==null&&(g.current=n.caret,e.onChange(n.text),l(n.caret),h(0),y?.(n.text));};Ie$2(()=>{let e=g.current,t=a.current;e!==null&&t!==null&&(g.current=null,t.setSelectionRange(e,e));}),Ie$2(()=>{if(!w)return;let e=()=>{let e=i.current,t=o.current;if(e===null||t===null)return;let n=e.getBoundingClientRect(),r=Sr$1(n.left,n.bottom,n.width,window.innerWidth);t.style.top=`${String(r.top)}px`,t.style.left=`${String(r.left)}px`,t.style.width=`${String(r.width)}px`;};return e(),window.addEventListener(`scroll`,e,true),window.addEventListener(`resize`,e),()=>{window.removeEventListener(`scroll`,e,true),window.removeEventListener(`resize`,e);}},[w]),B$2(()=>{if(T<0)return;let e=o.current?.querySelector(`#${CSS.escape(`${s}-${String(T)}`)}`);e instanceof HTMLElement&&typeof e.scrollIntoView==`function`&&e.scrollIntoView({block:`nearest`});},[T,s]);let ee=t=>{if(!w)t.key===mr$1&&y?.(e.value);else if(t.key===fr$1||t.key===pr$1){t.preventDefault();let e=t.key===fr$1?1:-1;h((T+e+C.length)%C.length);}else t.key===mr$1||t.key===hr$1?(t.preventDefault(),O(T)):t.key===gr$1&&(t.preventDefault(),t.stopPropagation(),p(true),y?.(e.value));},k=w?K$3(A$2,{children:[K$3(q$3,{css:xr$1}),K$3(`div`,{className:Qn$1,ref:o,onMouseDown:e=>{e.preventDefault();},children:[S?.heading===null||S?.heading===void 0?null:K$3(`div`,{className:$n$1,"aria-hidden":`true`,children:S.heading}),K$3(`ul`,{className:er$1,id:s,role:`listbox`,"aria-label":S?.heading===null||S?.heading===void 0?v?.label:`${v?.label??``}: ${S.heading}`,children:C.map((e,t)=>K$3(`li`,{id:`${s}-${String(t)}`,role:`option`,"aria-selected":t===T,"aria-label":e.announce,className:[Z$3,t===T?tr$1:``,e.divider?nr$1:``].filter(e=>e.length>0).join(` `),onClick:()=>{O(t);},children:[K$3(`span`,{className:rr$1,children:[e.label.slice(0,e.matchStart),K$3(`b`,{children:e.label.slice(e.matchStart,e.matchStart+e.matchLength)}),e.label.slice(e.matchStart+e.matchLength)]}),e.trailing===null?null:K$3(`span`,{className:ir$1,children:e.trailing})]},e.key))})]})]}):null,j=v===void 0?{}:{role:`combobox`,autocomplete:`off`,"aria-autocomplete":`list`,"aria-expanded":w,"aria-controls":s,...T>=0?{"aria-activedescendant":`${s}-${String(T)}`}:{},onKeyDown:ee,onKeyUp:()=>{l(E());},onClick:()=>{l(E());},onFocus:()=>{d(true),l(E()),e.onFocus?.();},onBlur:()=>{d(false),p(false),y?.(e.value);}};return K$3(`div`,{className:x,ref:i,children:[K$3(q$3,{css:br$1}),K$3(St$2,{className:qn$1,size:yr$1}),K$3(qt$1,{...e.id===void 0?{}:{id:e.id},className:Zn$1,value:e.value,placeholder:e.placeholder,"aria-label":e[`aria-label`],inputRef:a,inputAttrs:j,onChange:D}),k!==null&&document.body!==null?It$1(K$3($e$2.Provider,{value:false,children:k}),document.body):null,K$3(`span`,{className:Jn$1,children:[e.value.length>0?K$3(`button`,{type:`button`,className:`${Yn$1} rdw-kit-focusable`,"aria-label":b,title:b,onClick:()=>{e.onChange(``),y?.(``),i.current?.querySelector(`input`)?.focus();},children:K$3(mt$2,{size:yr$1})}):null,_===void 0?null:K$3(`button`,{type:`button`,ref:r,className:`${Yn$1} rdw-kit-focusable`,"aria-label":_.label,title:_.label,"aria-expanded":t,onClick:()=>{n(!t);},children:K$3(kt$2,{size:yr$1})})]}),_===void 0?null:K$3(Bn$1,{open:t,onClose:()=>{n(false);},anchorRef:r,widthPx:_.widthPx??vr$1,alignEnd:true,"aria-label":_.label,children:K$3(Cr$1,{help:_})})]})}var Tr$1=`
.rdw-section-label {
  display: block;
  font: 600 10.5px var(--rdw-font);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--rdw-muted);
  margin: 0 0 4px;
}
`;function Er$1(e){let t=[`rdw-section-label`,e.className].filter(e=>e!==void 0&&e.length>0).join(` `);return e.htmlFor===void 0?K$3(A$2,{children:[K$3(q$3,{css:Tr$1}),K$3(`div`,{className:t,children:e.children})]}):K$3(A$2,{children:[K$3(q$3,{css:Tr$1}),K$3(`label`,{className:t,htmlFor:e.htmlFor,children:e.children})]})}var Dr$1=`
${G$3}
.rdw-seg {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  background: var(--rdw-seg-track, transparent);
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  padding: 2px;
  gap: 2px;
  /* The whole control is as tall as a button or a field beside it. */
  box-sizing: border-box;
  height: ${U$2};
}
.rdw-seg__btn {
  min-height: 0;
  height: 100%;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: var(--rdw-radius-s);
  background: transparent;
  color: var(--rdw-seg-text, var(--rdw-muted));
  font: inherit;
  font-size: ${W$2};
  cursor: pointer;
  padding: 0 8px;
}
.rdw-seg__btn[aria-checked="true"] {
  background: var(--rdw-seg-on, var(--rdw-surface));
  color: var(--rdw-seg-on-text, var(--rdw-text));
  font-weight: 600;
}
/* Not to be changed: the chosen option is still read, the others are faint. */
.rdw-seg[aria-disabled="true"] .rdw-seg__btn {
  cursor: not-allowed;
}
.rdw-seg[aria-disabled="true"] .rdw-seg__btn[aria-checked="false"] {
  opacity: 0.4;
}
.rdw-seg[aria-disabled="true"] .rdw-seg__btn[aria-checked="true"] {
  opacity: 0.75;
}
`;function Or$1(e){let t=[`rdw-seg`,e.className].filter(e=>e!==void 0&&e.length>0).join(` `),n=e.disabled===true;return K$3(A$2,{children:[K$3(q$3,{css:Dr$1}),K$3(`div`,{className:t,role:`radiogroup`,"aria-label":e.label,"aria-disabled":n?true:void 0,children:e.options.map(t=>{let r=t.value===e.value;return K$3(`button`,{type:`button`,role:`radio`,className:`rdw-seg__btn rdw-kit-focusable`,"aria-checked":r,"aria-disabled":n?true:void 0,tabIndex:r?0:-1,onClick:()=>{n||e.onChange(t.value);},onKeyDown:t=>{if(n||t.key!==`ArrowRight`&&t.key!==`ArrowLeft`)return;t.preventDefault();let r=e.options.findIndex(t=>t.value===e.value);if(r<0)return;let i=t.key===`ArrowRight`?1:-1,a=e.options[(r+i+e.options.length)%e.options.length];a!==void 0&&e.onChange(a.value);},children:t.label},t.value)})})]})}var kr$1=`rdw-selbar`,Ar=`rdw-selbar--row`,jr=`rdw-selbar--stack`,Mr=`rdw-selbar__count`,Nr=`rdw-selbar__head`,Pr=`rdw-selbar__pick`,Fr=`rdw-selbar__spacer`,Q$3=`rdw-selbar__actions`,Ir=`rdw-selbar__rule`,Lr=`Selection`,Rr=`Clear`,zr=`Cancel`,Br=` selected`,Vr=` (Ctrl+A)`,Hr=`keydown`,Ur=`KeyA`,Wr=`input, textarea, select, [contenteditable], [role="dialog"]`,Gr=`[role="dialog"]`,Kr=5,qr=`
.${kr$1} {
  box-sizing: border-box;
  color: var(--rdw-text);
  font-size: ${W$2};
}
.${Ar} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-height: ${U$2};
  margin-inline: ${String(Kr)}px;
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-accent-soft);
  box-shadow: 0 0 0 ${String(Kr)}px var(--rdw-accent-soft);
}
.${jr} {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border: 1px solid var(--rdw-accent);
  border-radius: var(--rdw-radius-l);
  background: var(--rdw-accent-soft);
}
.${Mr} {
  font-weight: 600;
  white-space: nowrap;
}
.${Ar} > .${Mr} {
  padding-inline: 4px 8px;
}
.${Nr},
.${Pr} {
  display: flex;
  align-items: center;
  gap: 8px;
}
.${Nr} {
  justify-content: space-between;
}
.${Fr} {
  flex: 1 1 0;
  min-width: 0;
}
.${Q$3} {
  display: flex;
  align-items: center;
  gap: 8px;
}
.${jr} .${Q$3} {
  flex-direction: column;
  align-items: stretch;
}
.${jr} .${Q$3} > .rdw-btn {
  width: 100%;
}
.${Ir} {
  flex: none;
  align-self: stretch;
  background: var(--rdw-border);
}
.${Ar} > .${Ir} {
  width: 1px;
  margin-block: 4px;
}
.${jr} > .${Ir} {
  height: 1px;
}
`;function Jr(e){if(document.querySelector(Gr)!==null)return  true;let t=e.composedPath()[0];if(!(t instanceof Element))return  false;if(t.closest(Wr)!==null)return  true;let n=t.getRootNode();return n instanceof ShadowRoot&&n.querySelector(Gr)!==null}function Yr(e){let t=e.layout??`row`,n=e.count===0,r=V$2(e.onSelectAll);r.current=e.onSelectAll,B$2(()=>{let e=e=>{e.code!==Ur||!(e.ctrlKey||e.metaKey)||e.altKey||e.shiftKey||e.defaultPrevented||Jr(e)||(e.preventDefault(),r.current());};return document.addEventListener(Hr,e),()=>{document.removeEventListener(Hr,e);}},[]);let i=K$3(`span`,{className:Mr,"aria-live":`polite`,children:`${String(e.count)}${Br}`}),a=e.selectAllLabel??`Select all`,o=e.selectAll??K$3(J$3,{variant:`ghost`,title:`${a}${Vr}`,onClick:e.onSelectAll,children:a}),s=K$3(J$3,{variant:`ghost`,disabled:n,onClick:e.onClear,children:Rr}),c=K$3(J$3,{variant:`secondary`,onClick:e.onCancel,children:zr}),l=e.children!==void 0&&e.children!==null,u=e.danger!==void 0&&e.danger!==null,d=l&&u?K$3(`span`,{className:Ir,"aria-hidden":`true`}):null;return t===`stack`?K$3(`div`,{className:`${kr$1} ${jr}`,role:`toolbar`,"aria-label":Lr,"aria-orientation":`vertical`,children:[K$3(q$3,{css:qr}),K$3(`div`,{className:Nr,children:[i,c]}),K$3(`div`,{className:Pr,children:[o,s]}),l?K$3(`div`,{className:Q$3,children:e.children}):null,d,u?K$3(`div`,{className:Q$3,children:e.danger}):null]}):K$3(`div`,{className:`${kr$1} ${Ar}`,role:`toolbar`,"aria-label":Lr,children:[K$3(q$3,{css:qr}),i,o,s,K$3(`span`,{className:Fr,"aria-hidden":`true`}),l?K$3(`div`,{className:Q$3,children:e.children}):null,d,u?K$3(`div`,{className:Q$3,children:e.danger}):null,c]})}var Xr=`rdw-select__list`,Zr=`rdw-select__list--floating`,Qr=4,$r=14,ei=220,ti=8,ni=360,ri=`scroll`,ii=`resize`,ai=`
${G$3}
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
  min-height: ${U$2};
  height: ${U$2};
  width: 100%;
  padding: 0 8px;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-surface);
  color: var(--rdw-text);
  font: inherit;
  font-size: ${W$2};
  cursor: pointer;
}
.rdw-select__trigger:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.${Xr} {
  position: absolute;
  z-index: 20;
  top: calc(100% + ${String(Qr)}px);
  left: 0;
  right: 0;
  margin: 0;
  padding: 4px;
  list-style: none;
  background: var(--rdw-surface);
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  box-shadow: var(--rdw-shadow-2);
  max-height: ${String(ei)}px;
  overflow: auto;
}
/* On a page of the site the list is drawn in <body> and placed by the trigger. */
.${Xr}.${Zr} {
  position: fixed;
  z-index: 120;
  right: auto;
  box-sizing: border-box;
  max-width: ${String(ni)}px;
  font: 12.5px/1.4 var(--rdw-font);
  text-align: left;
}
.rdw-select__option {
  min-height: ${U$2};
  display: flex;
  align-items: center;
  padding: 0 8px;
  border-radius: var(--rdw-radius-s);
  font-size: ${W$2};
  color: var(--rdw-text);
  cursor: pointer;
}
.rdw-select__option {
  justify-content: space-between;
  gap: 12px;
}
/* The chosen option has a tick and a heavier text; the fill is for the option
   under the pointer or the keyboard. One fill for both made them one. */
.rdw-select__option:hover,
.rdw-select__option:focus-visible {
  background: var(--rdw-surface-2);
}
.rdw-select__option[aria-selected="true"] {
  font-weight: 600;
}
.rdw-select__tick {
  flex: none;
  color: var(--rdw-accent);
}
`;function oi(e){let t=H$2(),n=V$2(null),r=V$2(null),i=V$2(null),[a,o]=z$2(false),s=!ze$2(Gt$1)&&!(n.current?.getRootNode()instanceof ShadowRoot),c=e.options.find(t=>t.value===e.value)??e.options[0],l=[`rdw-select`,e.className].filter(e=>e!==void 0&&e.length>0).join(` `);B$2(()=>{if(!a)return;let e=e=>{e.key===`Escape`&&o(false);},t=e=>{let t=n.current;if(t===null)return;let r=e.composedPath(),a=i.current;r.includes(t)||a!==null&&r.includes(a)||o(false);};return document.addEventListener(`keydown`,e),document.addEventListener(`mousedown`,t),()=>{document.removeEventListener(`keydown`,e),document.removeEventListener(`mousedown`,t);}},[a]),Ie$2(()=>{if(!a||!s)return;let e=()=>{let e=r.current,t=i.current;if(e===null||t===null)return;let n=e.getBoundingClientRect(),a=Math.min(t.scrollHeight,ei),o=n.bottom+Qr,s=o+a<=window.innerHeight-ti,c=n.top-Qr-a;t.style.top=`${String(s||c<ti?o:c)}px`,t.style.left=`${String(n.left)}px`,t.style.minWidth=`${String(n.width)}px`;};return e(),window.addEventListener(ri,e,true),window.addEventListener(ii,e),()=>{window.removeEventListener(ri,e,true),window.removeEventListener(ii,e);}},[a,s]);let u=a?K$3(`ul`,{className:s?`${Xr} ${Zr}`:Xr,role:`listbox`,id:t,tabIndex:-1,ref:i,children:e.options.map(t=>K$3(`li`,{role:`option`,className:`rdw-select__option rdw-kit-focusable`,"aria-selected":t.value===e.value,tabIndex:0,onClick:()=>{e.onChange(t.value),o(false);},onKeyDown:n=>{(n.key===`Enter`||n.key===` `)&&(n.preventDefault(),e.onChange(t.value),o(false),r.current?.focus());},children:[K$3(`span`,{children:t.label}),t.value===e.value?K$3(pt$2,{size:$r,className:`rdw-select__tick`}):null]},t.value))}):null;return K$3(A$2,{children:[K$3(q$3,{css:ai}),K$3(`div`,{className:l,ref:n,children:[e.label===void 0?null:K$3(`span`,{className:`rdw-select__label`,id:`${t}-label`,children:e.label}),K$3(`button`,{type:`button`,className:`rdw-select__trigger rdw-kit-focusable`,"aria-haspopup":`listbox`,"aria-expanded":a,"aria-controls":t,"aria-labelledby":e.label===void 0?void 0:`${t}-label`,disabled:e.disabled,ref:r,onClick:()=>{o(e=>!e);},children:[K$3(`span`,{children:c?.label??e.value}),K$3(ht$2,{size:14})]}),s?null:u]}),s&&u!==null?It$1(K$3($e$2.Provider,{value:false,children:u}),document.body):null]})}var si=`[${l$1}="${u$2}"]`,ci=`[${l$1}="${d$2}"]`,li=Wn$2(Bn$2,Vn$2,[kn$2,`#ffffff`]),ui=Wn$2(Rn$2,Pn$2,[`#16181c`,`#ffffff`]),di=`
${G$3}
.rdw-switch-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: ${U$2};
}
.rdw-switch {
  position: relative;
  box-sizing: border-box;
  width: 36px;
  height: ${U$2};
  min-width: 36px;
  min-height: ${U$2};
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
  /* Off, the track was dark on a dark card: an outline tells it from the card. */
  box-shadow: inset 0 0 0 1px var(--rdw-muted);
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
  /* Lighter than the track it lies on while off. */
  background: var(--rdw-muted);
  transition: left 0.15s ease;
}
.rdw-switch[aria-checked="true"] .rdw-switch__track {
  background: var(--rdw-accent);
  box-shadow: none;
}
.rdw-switch[aria-checked="true"] .rdw-switch__thumb {
  left: 15px;
  background: var(--rdw-surface);
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
html${si} .rdw-switch[aria-checked="true"] .rdw-switch__track,
:host-context(${si}) .rdw-switch[aria-checked="true"] .rdw-switch__track {
  background: ${Bn$2};
}
html${si} .rdw-switch[aria-checked="true"] .rdw-switch__thumb,
:host-context(${si}) .rdw-switch[aria-checked="true"] .rdw-switch__thumb {
  background: ${li};
}
html${si} .rdw-switch:not([aria-checked="true"]) .rdw-switch__track,
:host-context(${si}) .rdw-switch:not([aria-checked="true"]) .rdw-switch__track {
  background: var(--rdw-border);
}
/* Site dark: ON = accent; OFF = border; thumb contrast-checked vs accent. */
html${ci} .rdw-switch[aria-checked="true"] .rdw-switch__track,
:host-context(${ci}) .rdw-switch[aria-checked="true"] .rdw-switch__track {
  background: ${Rn$2};
}
html${ci} .rdw-switch[aria-checked="true"] .rdw-switch__thumb,
:host-context(${ci}) .rdw-switch[aria-checked="true"] .rdw-switch__thumb {
  background: ${ui};
}
html${ci} .rdw-switch:not([aria-checked="true"]) .rdw-switch__track,
:host-context(${ci}) .rdw-switch:not([aria-checked="true"]) .rdw-switch__track {
  background: ${In$2};
}
`;function fi(e){let t=[`rdw-switch-row`,e.className].filter(e=>e!==void 0&&e.length>0).join(` `);return K$3(A$2,{children:[K$3(q$3,{css:di}),K$3(`div`,{className:t,children:[K$3(`button`,{type:`button`,id:e.id,className:`rdw-switch rdw-kit-focusable`,role:`switch`,"aria-checked":e.checked,"aria-label":e.label,disabled:e.disabled,onClick:()=>{e.onChange(!e.checked);},children:K$3(`span`,{className:`rdw-switch__track`,children:K$3(`span`,{className:`rdw-switch__thumb`})})}),e.label===void 0?null:K$3(`span`,{className:`rdw-switch__label`,children:e.label})]})]})}var pi=`rdw-tab-`,mi=`rdw-tabpanel-`,hi=`ArrowRight`,gi=`ArrowLeft`;function _i(e){return `${pi}${e}`}function vi(e){return `${mi}${e}`}var yi=`
${G$3}
.rdw-tabs {
  display: flex;
  gap: 2px;
  border-bottom: 1px solid var(--rdw-border);
  padding: 0 8px;
}
.rdw-tabs__tab {
  box-sizing: border-box;
  min-height: ${U$2};
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
`;function bi(e){let t=[`rdw-tabs`,e.className].filter(e=>e!==void 0&&e.length>0).join(` `);return K$3(A$2,{children:[K$3(q$3,{css:yi}),K$3(`div`,{className:t,role:`tablist`,"aria-label":e[`aria-label`],children:e.items.map(t=>{let n=t.id===e.value;return K$3(`button`,{type:`button`,role:`tab`,id:_i(t.id),className:`rdw-tabs__tab rdw-kit-focusable`,"aria-selected":n,"aria-controls":vi(t.id),tabIndex:n?0:-1,onClick:()=>{e.onChange(t.id);},onKeyDown:t=>{if(t.key!==hi&&t.key!==gi)return;t.preventDefault();let n=e.items.findIndex(t=>t.id===e.value);if(n<0)return;let r=t.key===hi?1:-1,i=e.items[(n+r+e.items.length)%e.items.length];if(i===void 0)return;e.onChange(i.id);let a=t.currentTarget.parentElement?.querySelector(`#${_i(i.id)}`);a instanceof HTMLElement&&a.focus();},children:t.label},t.id)})})]})}var xi=6e3,Si=45,Ci=16,wi=420,Ti=12,Ei=8,Di=12,Oi=0,$$3=null;function ki(e){e.timerId!==null&&(window.clearTimeout(e.timerId),e.timerId=null);}function Ai(e){Oi+=1;let t={id:Oi,close:e,timerId:null},n=$$3;return $$3=t,n!==null&&(ki(n),n.close()),t}function ji(e){if($$3===null||$$3.id!==e)return;let t=$$3;ki(t),$$3=null,t.close();}function Mi(e){$$3!==null&&$$3.id===e&&($$3=null);}var Ni=`
${G$3}
.rdw-toast {
  position: fixed;
  z-index: ${String(Si)};
  left: 50%;
  bottom: ${String(Ci)}px;
  transform: translateX(-50%);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: ${String(Di)}px;
  width: max-content;
  max-width: min(${String(wi)}px, calc(100% - 32px));
  padding: ${String(Ei)}px ${String(Ti)}px;
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
`;function Pi(e){let[t,n]=z$2(null);return Ie$2(()=>{if(!e.open){n(null);return}let t=true,r=Ai(()=>{t&&n(null),e.onClose();});return n(r.id),r.timerId=window.setTimeout(()=>{ji(r.id);},xi),()=>{t=false,ki(r),Mi(r.id);}},[e.open,e.message,e.onClose]),!e.open||t===null||$$3===null||$$3.id!==t?null:K$3(A$2,{children:[K$3(q$3,{css:Ni}),K$3(`div`,{className:`rdw-toast`,role:`status`,children:[K$3(`p`,{className:`rdw-toast__message`,children:e.message}),e.action===void 0?null:K$3(J$3,{variant:`secondary`,size:`s`,onClick:e.action.onClick,children:e.action.label})]})]})}var s=`ruledesk-web.favorites-index`,c=1,l=`posts`,u=`id`,d=A$3({id:D$2(),tags:T$2(),thumb:T$2(),run:E$2(),pos:D$2(),cut:N$3(O$3())});function f(){return typeof indexedDB<`u`}function p(){return new Promise((e,t)=>{let n=indexedDB.open(s,c);n.onerror=()=>{t(n.error??Error(`favorites-index: open failed`));},n.onsuccess=()=>{e(n.result);},n.onupgradeneeded=()=>{let e=n.result;e.objectStoreNames.contains(l)||e.createObjectStore(l,{keyPath:u});};})}function m(e){return new Promise((t,n)=>{e.oncomplete=()=>{t();},e.onerror=()=>{n(e.error??Error(`favorites-index: transaction failed`));},e.onabort=()=>{n(e.error??Error(`favorites-index: transaction aborted`));};})}async function h$1(e){if(e.length===0||!f())return;let t=await p();try{let n=t.transaction(l,`readwrite`),r=n.objectStore(l);for(let t of e)r.put(t);await m(n);}finally{t.close();}}async function g$1(){if(!f())return [];let e=await p();try{let t=e.transaction(l,`readonly`).objectStore(l).getAll(),n=await new Promise((e,n)=>{t.onerror=()=>{n(t.error??Error(`favorites-index: read failed`));},t.onsuccess=()=>{let n=t.result;e(Array.isArray(n)?n:[]);};}),r=[];for(let e of n){let t=d.safeParse(e);t.success&&r.push(t.data);}return r}finally{e.close();}}function _$1(t){h$1(t).catch(t=>{m$2.warn(`favorites-index: write failed`,t);});}var he=`jpg`,ge=/\.([a-z0-9]{2,5})$/i,_e=`unknown error`,ve=`timeout`,ye=`downloads`,be=60,xe$1=/[\\/:*?"<>|]+/g,O$1=/\s+/g,Se$1=/^[. ]+|[. ]+$/g;function Ce$1(e){let t=e.replace(xe$1,` `).replace(O$1,` `).slice(0,be).replace(Se$1,``);return t.length>0?t:ye}var k$1=`rule34-[id]`,we$1=[`id`,`md5`,`rating`,`score`,`width`,`height`,`owner`,`date`],Te$1=/\[([a-z0-9]+)\]/gi,Ee$1=/[\\/:*?"<>|\u0000-\u001f]+/g,De$1=/([-_. ])[-_. ]+/g,Oe$1=/^[-_. ]+|[-_. ]+$/g,ke$1=120,Ae$1=10,je$1=/([^/]+?)(?:\.[a-z0-9]{2,5})?$/i; exports({a4:k$1,a5:we$1});function Me$1(e){return we$1.some(t=>t===e)}function A$1(e){try{return new URL(e,window.location.href).pathname}catch{return e}}function Ne$1(e){return ge.exec(A$1(e))?.[1]?.toLowerCase()??he}function Pe$1(e){return je$1.exec(A$1(e))?.[1]??``}function Fe$1(e,t,n){switch(e){case `id`:return String(t.postId);case `md5`:return Pe$1(t.url);case `rating`:return t.rating??``;case `score`:return t.score===void 0?``:String(t.score);case `width`:return t.width===void 0?``:String(t.width);case `height`:return t.height===void 0?``:String(t.height);case `owner`:return t.owner??``;case `date`:return new Date(n).toISOString().slice(0,Ae$1)}}function Ie$1(e,t,n=Date.now()){let r=e=>e.replace(Te$1,(e,r)=>{let i=r.toLowerCase();return Me$1(i)?Fe$1(i,t,n):``}).replace(Ee$1,` `).replace(O$1,` `).replace(De$1,`$1`).replace(Oe$1,``).slice(0,ke$1).replace(Oe$1,``),i=r(e);return `${i.length>0?i:r(k$1)}.${Ne$1(t.url)}`}function Le$1(e,t){return e.toLowerCase().includes(`[${t}]`)}function Re$1(e,t){if(!Le$1(e,t)){let n=e.trim();return n.length>0?`${n} [${t}]`:`[${t}]`}let n=RegExp(`\\[${t}\\]`,`gi`);return e.replace(n,``).replace(O$1,` `).trim()}var ze$1=/\.(?:jpe?g|png|gif|webp|avif|bmp|mp4|webm|mov|m4v)$/i;function Be$1(e){return ze$1.test(A$1(e))}function Ve$1(){return typeof GM_download==`function`}function j$1(e,t){return new Promise((n,r)=>{GM_download({url:e,name:t,headers:{Referer:`${window.location.origin}/`},onload:()=>{n();},onerror:e=>{let t=typeof e.error==`string`?e.error:_e;r(Error(t));},ontimeout:()=>{r(Error(ve));}});})}var M$1=`ruledesk-web.api`,N$1=A$3({userId:T$2().check(Fi(1)),apiKey:T$2().check(Fi(1))});function He$1(){let e=N$1.safeParse(GM_getValue(M$1));return e.success?e.data:null}function Ue$1(){return He$1()!==null}function We$1(e,t){let n=N$1.safeParse({userId:e.trim(),apiKey:t.trim()});return n.success?(GM_setValue(M$1,n.data),true):false}function Ge$1(){GM_setValue(M$1,null);}var Ke$1=/(?:^|[?&\s])user_id=([^&\s#]+)/i,qe$1=/(?:^|[?&\s])api_key=([^&\s#]+)/i;function Je$1(e){try{return decodeURIComponent(e)}catch{return e}}function Ye$1(e){let t=Ke$1.exec(e)?.[1],n=qe$1.exec(e)?.[1];if(t===void 0||n===void 0)return null;let r=N$1.safeParse({userId:Je$1(t).trim(),apiKey:Je$1(n).trim()});return r.success?r.data:null}var Xe$1=`downloads`;function Ze$1(){return kc$1()&&jc$1(`downloads`,true)&&Ve$1()&&Ue$1()}var Qe$1=`https://api.rule34.xxx/index.php`,$e$1=1e3,et$1=1e3,P$1=120,tt$1=`sort:`,nt$1=`id:<`,rt$1=/\s+/,it$1=`all`;function at$1(e){return new Promise(t=>{window.setTimeout(t,e);})}var ot$1=A$3({id:D$2(),file_url:T$2().check(Fi(1)),rating:N$3(Vi()),score:N$3(Vi()),width:N$3(Vi()),height:N$3(Vi()),owner:N$3(Vi())});function st$1(e){return typeof e==`string`&&e.length>0?e:void 0}function ct$1(e){let t=typeof e==`string`?Number(e):e;return typeof t==`number`&&Number.isFinite(t)?t:void 0}function lt$1(e,t){let n=new URLSearchParams;return n.set(`page`,`dapi`),n.set(`s`,`post`),n.set(`q`,`index`),n.set(`json`,`1`),n.set(`limit`,String($e$1)),n.set(`pid`,`0`),`id`in e?n.set(`id`,String(e.id)):e.tags.length>0&&e.tags!==it$1&&n.set(`tags`,e.tags),n.set(`user_id`,t.userId),n.set(`api_key`,t.apiKey),`${Qe$1}?${n.toString()}`}var ut$1=1100,dt$1=15e3,ft$1=429,pt$1=`ruledesk-web.api-last`,mt$1=0,ht$1=Promise.resolve();function gt$1(){try{let e=Number(window.localStorage.getItem(pt$1));return Number.isFinite(e)?e:0}catch{return 0}}function _t$1(e){try{window.localStorage.setItem(pt$1,String(e));}catch{}}function vt$1(){let e=ht$1.then(async()=>{let e=Date.now(),t=Math.min(gt$1(),e),n=Math.max(mt$1,t)+ut$1-e;n>0&&await at$1(n),mt$1=Date.now(),_t$1(mt$1);});return ht$1=e.catch(()=>void 0),e}var yt$1=`The script manager cannot ask the API (GM_xmlhttpRequest is missing)`,bt$1=`API request failed`,xt$1=`The script manager gave the API answer without its text`,St$1=`API request timed out`,Ct$1=200,wt$1=300,Tt$1=3e4;function Et$1(){return typeof GM_xmlhttpRequest==`function`}function Dt$1(e){return new Promise((t,n)=>{Et$1()?GM_xmlhttpRequest({method:`GET`,url:e,anonymous:true,timeout:Tt$1,onload:e=>{let r=e.responseText??e.response;typeof r==`string`?t({status:e.status,text:r}):n(Error(xt$1));},onerror:()=>{n(Error(bt$1));},onabort:()=>{n(Error(bt$1));},ontimeout:()=>{n(Error(St$1));}}):n(Error(yt$1));})}async function Ot$1(e,t){for(let n=0;;n+=1){await vt$1();let r=await Dt$1(lt$1(e,t));if(r.status===ft$1&&n<3)await at$1(dt$1);else {if(r.status<Ct$1||r.status>=wt$1)throw Error(`API HTTP ${String(r.status)}`);return r.text}}}function kt$1(e){let t=e.trim();if(t.length===0)return [];let n;try{n=JSON.parse(t);}catch{throw Error(`API: ${t.slice(0,P$1)}`)}if(typeof n==`string`)throw Error(`API: ${n.slice(0,P$1)}`);if(!Array.isArray(n))throw Error(`API: ${t.slice(0,P$1)}`);let r=[];for(let e of n){let t=ot$1.safeParse(e);t.success&&ut$4(t.data.file_url)&&r.push({postId:t.data.id,url:t.data.file_url,rating:st$1(t.data.rating),score:ct$1(t.data.score),width:ct$1(t.data.width),height:ct$1(t.data.height),owner:st$1(t.data.owner)});}return r}function At$1(e){return e.trim().split(rt$1).filter(e=>e.length>0&&!e.startsWith(tt$1)).join(` `)}async function jt$1(e,t){let n=At$1(e),r=[],i=null;for(;;){if(t.isCancelled())return r;let e=i===null?``:`${nt$1}${String(i)}`,a=kt$1(await Ot$1({tags:[n===it$1?``:n,e].filter(e=>e.length>0).join(` `)},t.credentials));if(a.length===0)return r;let o=a[0]?.postId??0;for(let e of a)r.push(e),o=Math.min(o,e.postId);if(t.onProgress(r.length),i!==null&&o>=i)return r;i=o,await at$1(et$1);}}async function Mt$1(e,t){let n=[];for(let r of e){if(t.isCancelled())break;let e=kt$1(await Ot$1({id:r},t.credentials)),i=e.find(e=>e.postId===r)??e[0];i!==void 0&&n.push(i),t.onProgress(n.length);}return n}function Nt$1(e,t){return e.kind===`query`?jt$1(e.tags,t):Mt$1(e.ids,t)}var Pt=`download-name`;function Ft(){let e=Ic$1(Pt);return typeof e==`string`&&e.trim().length>0?e:k$1}function It(t){let n=t.trim();Lc$1(Pt,n.length>0?n:k$1);}var Lt=`ruledesk-web.downloads`,Rt=`ruledesk-web.downloads.position`,zt=`ruledesk-web.downloads.running`,Bt=`1`,Vt=5e3,Ht=`The API returned no files for this. Deleted posts have none.`,Ut=A$3({label:T$2(),folder:T$2(),selected:N$3(D$2()),files:k$3(A$3({postId:D$2(),url:T$2(),rating:N$3(T$2()),score:N$3(E$2()),width:N$3(E$2()),height:N$3(E$2()),owner:N$3(T$2())}))}),Wt=A$3({next:D$2(),failed:k$3(D$2())}),Gt=`started in another tab or session`,Kt=`all`,F$1={phase:`idle`,label:``,selected:null,expected:null,total:0,done:0,failed:0,message:``},I$1=F$1,L$1=null,R$1=0,z$1=[],B$1=0,V$1=new Set;function H$1(e){I$1=e;for(let e of V$1)e(I$1);}function qt(e){return new Promise(t=>{window.setTimeout(t,e);})}function U$1(e){try{e?window.sessionStorage.setItem(zt,Bt):window.sessionStorage.removeItem(zt);}catch(e){m$2.warn(`downloads: session storage unavailable`,e);}}function Jt(){try{return window.sessionStorage.getItem(zt)===Bt}catch{return  false}}function Yt(){GM_setValue(Rt,{next:R$1,failed:z$1});}function Xt(){GM_setValue(Lt,null),GM_setValue(Rt,null),U$1(false);}function W$1(e,t=``){return {phase:e,label:L$1?.label??I$1.label,selected:L$1===null?I$1.selected:L$1.selected??null,expected:null,total:L$1?.files.length??I$1.total,done:R$1-z$1.length,failed:z$1.length,message:t}}async function Zt(e,t){let n=`${t}/${Ie$1(Ft(),e)}`;try{return await j$1(e.url,n),!0}catch(t){m$2.warn(`downloads: file failed, retrying once`,e.postId,t);}await qt(Vt);try{return await j$1(e.url,n),!0}catch(t){return m$2.warn(`downloads: file failed`,e.postId,t),false}}async function G$2(){let e=L$1;if(e===null)return;B$1+=1;let t=B$1;for(U$1(true),H$1(W$1(`running`));R$1<e.files.length;){let n=e.files[R$1];if(n===void 0)break;let r=await Zt(n,e.folder);if(t!==B$1||(r||z$1.push(n.postId),R$1+=1,Yt(),H$1(W$1(`running`)),R$1<e.files.length&&(await qt(400),t!==B$1)))return}Xt(),H$1(W$1(`done`));}function Qt(){return I$1}function $t(e){return V$1.add(e),()=>{V$1.delete(e);}}function en(){return I$1.phase===`collecting`||I$1.phase===`running`||I$1.phase===`paused`}async function tn(e,t,n=Kt){let r=He$1();if(r===null||en())return;B$1+=1;let i=B$1;L$1=null,R$1=0,z$1=[];let a=n===`selection`&&t.kind===`ids`?t.ids.length:null,o=t.kind===`ids`?t.ids.length:null,s={...F$1,phase:`collecting`,label:e,selected:a,expected:o};H$1(s);let c;try{c=await Nt$1(t,{credentials:r,onProgress:e=>{i===B$1&&H$1({...s,total:e});},isCancelled:()=>i!==B$1});}catch(t){if(i!==B$1)return;let n=t instanceof Error?t.message:String(t);m$2.warn(`downloads: collecting failed`,n),H$1({...F$1,phase:`error`,label:e,selected:a,message:n});return}i===B$1&&(c.length===0?H$1({...F$1,phase:`error`,label:e,selected:a,message:Ht}):(L$1={label:e,folder:Ce$1(e),files:c,...a===null?{}:{selected:a}},GM_setValue(Lt,L$1),Yt(),await G$2()));}function nn(){I$1.phase===`running`&&(B$1+=1,U$1(false),H$1(W$1(`paused`)));}function rn(){I$1.phase===`paused`&&L$1!==null&&G$2();}function an(){B$1+=1,L$1=null,R$1=0,z$1=[],Xt(),H$1(F$1);}function on(){if(I$1.phase!==`idle`)return;let e=Ut.safeParse(GM_getValue(Lt));if(!e.success)return;let t=Wt.safeParse(GM_getValue(Rt));L$1=e.data,R$1=t.success?Math.min(t.data.next,L$1.files.length):0,z$1=t.success?[...t.data.failed]:[],Jt()?G$2():H$1(W$1(`paused`,Gt));}var sn=`span.thumb > a[id^="p"]`,cn=/^p(\d+)$/,ln=`:scope > img`;function un(e,t,n,r=window.location.href){let i=[],a=new Set,o=n;for(let n of e.querySelectorAll(sn)){let e=cn.exec(n.id),s=n.querySelector(ln);if(e?.[1]===void 0||!(s instanceof HTMLImageElement))continue;let c=Number(e[1]);if(a.has(c))continue;a.add(c);let l=``;try{l=new URL(s.getAttribute(`src`)??``,r).href;}catch{l=``;}i.push({id:c,tags:s.title.trim(),thumb:ut$4(l)?l:``,run:t,pos:o,cut:true}),o+=1;}return i}var dn=1500,fn=[1e4,3e4,6e4],K$2=Ma$1,q$2=Na$1,pn=`li#my-favorites-container a[href*="page=favorites"]`,mn=`span.thumb`,hn=`span.thumb a[id^="p"]`,gn=`#paginator`,_n=`a[name="lastpage"]`,vn=`a[name="next"]`,yn=`a[onclick]`,bn=/^p(\d+)$/,xn=/[?&]pid=(\d+)/,Sn=`https://rule34.xxx`,Cn=36,wn=2,Tn=`not logged in or menu not found`,En=`unexpected page`; exports({ai:dn,ah:K$2,ag:q$2});function Dn(e,t,n){return {status:`aborted`,total:e,page:t,pages:n}}function On(e){return e instanceof DOMException&&e.name===`AbortError`||e instanceof Error&&e.name===`AbortError`}function J$2(e){if(e.aborted)throw new DOMException(`Aborted`,`AbortError`)}function kn(e,t){return new Promise((n,r)=>{if(t.aborted){r(new DOMException(`Aborted`,`AbortError`));return}let i=setTimeout(()=>{t.removeEventListener(`abort`,a),t.aborted?r(new DOMException(`Aborted`,`AbortError`)):n();},e),a=()=>{clearTimeout(i),r(new DOMException(`Aborted`,`AbortError`));};t.addEventListener(`abort`,a,{once:true});})}function An(e){if(e===null)return null;let t=e.trim();if(t.length===0)return null;let n=Number(t);return !Number.isFinite(n)||n<0?null:Math.trunc(n)}function jn(e){let t=xn.exec(e)?.[1];return t===void 0?null:An(t)}function Mn(e){try{return Y$2(new DOMParser().parseFromString(e,`text/html`))}catch{return ``}}function Y$2(e){let t=e.title.trim();return t.length<=80?t:t.slice(0,80)}function Nn(e,t){return t.length===0?`HTTP ${String(e)}`:`HTTP ${String(e)}: ${t}`}function Pn(){let e=Math.random().toString(Cn).slice(wn,12);return `tab-${String(Date.now())}-${e}`}function Fn(e){let t=e.querySelector(pn);if(!(t instanceof HTMLAnchorElement))return null;let n=t.getAttribute(`href`);if(n===null||n.length===0)return null;try{return An(new URL(n,Sn).searchParams.get(`id`))}catch{return null}}function In(e){return P$3(e)===`favorites`?An(new URLSearchParams(e).get(`id`)):null}function Ln(e,t,n){let r=Fn(e);if(r!==null)return r;let i=In(t);return i===null?n!==void 0&&Number.isFinite(n)?Math.trunc(n):null:i}function Rn(e,n){let r=new URLSearchParams;return r.set(ce$1,ue$1),r.set(`s`,de$1),r.set(`id`,String(e)),r.set(`pid`,String(n)),`${ie$1}?${r.toString()}`}function zn(e){return Math.floor(e/50)+1}function Bn(e){return Math.floor(e/50)+1}function Vn(e){let t=new Set,n=e.querySelectorAll(hn);for(let e of n){let n=bn.exec(e.id)?.[1];if(n===void 0)continue;let r=Number(n);Number.isFinite(r)&&t.add(Math.trunc(r));}let r=e.querySelectorAll(yn);for(let e of r){let n=e.getAttribute(`onclick`);if(n===null)continue;let r=dn$2(n);if(r===null)continue;let i=Number(r);Number.isFinite(i)&&t.add(Math.trunc(i));}return Array.from(t)}function Hn(e,t){let n=e.querySelector(_n);if(n instanceof HTMLAnchorElement){let e=n.getAttribute(`onclick`);return e===null||e.length===0?null:jn(e)}return e.querySelector(vn)===null?t:null}function Un(e){return e.querySelector(gn)!==null}function Wn(e){let t=e?.mode;if(t===K$2||t===q$2)return t}function Gn(e,t){if(e.length===0)return  false;for(let n of e)if(!t.has(n))return  false;return  true}function Kn(e,t,n){return e?Wn(t)??q$2:n??K$2}function qn(e){let t={nextPid:e.nextPid,lastPid:e.lastPid,startedAt:e.startedAt,running:e.running,userId:e.userId,mode:e.mode,lock:{tabId:e.tabId,beatAt:Date.now()}};return e.finishedAt!==void 0&&(t.finishedAt=e.finishedAt),ks$1(t),t}async function Jn(e,t){let n;try{n=await fetch(e,{method:`GET`,credentials:be$2,signal:t});}catch(t){if(On(t))throw t;let n=t instanceof Error?t.message:`request failed`;return m$2.warn(`favorites sync: fetch failed`,e,t),{ok:false,status:0,titleSnippet:n.slice(0,80),message:n}}let i=await n.text(),a=Mn(i);if(!n.ok)return m$2.warn(`favorites sync: HTTP error`,n.status,e),{ok:false,status:n.status,titleSnippet:a,message:Nn(n.status,a)};let o=new DOMParser().parseFromString(i,`text/html`);return Un(o)?{ok:true,doc:o,status:n.status,titleSnippet:Y$2(o)}:(m$2.warn(`favorites sync: missing paginator`,e),{ok:false,status:n.status,titleSnippet:Y$2(o),message:Nn(n.status,Y$2(o))})}async function Yn(e,t){let n=null;for(let r=0;r<=fn.length;r+=1){if(J$2(t),r>0){let n=fn[r-1];if(n===void 0)break;m$2.warn(`favorites sync: retrying after delay`,{attempt:r,delayMs:n,url:e}),await kn(n,t),J$2(t);}let i=await Jn(e,t);if(i.ok)return i;n=i;}return n===null?{ok:false,status:0,titleSnippet:``,message:Nn(0,``)}:n}async function Xn(e){let{onProgress:t,signal:n}=e,r=e.tabId??Pn(),i=Os$1(),a=Ln(document,window.location.search,i?.userId);if(a===null)return m$2.warn(`favorites sync: user id not found`),{status:`error`,message:Tn};let o=i!==void 0&&i.finishedAt===void 0,s=Kn(o,i,e.mode),c=o?i.startedAt:new Date().toISOString(),l=Date.parse(c),ee=Number.isNaN(l)?Date.now():l,u=o?i.nextPid:0,d=o?i.lastPid:0,f=u,p=Cs$1().size,h=zn(u),g=Bn(d),_=o&&i.nextPid>0,v=e=>{let t=e.nextPid??f;f=t,e.lastPid!==void 0&&(d=e.lastPid);let n={nextPid:t,lastPid:d,startedAt:c,userId:a,tabId:r,running:e.running,mode:s};e.finishedAt!==void 0&&(n.finishedAt=e.finishedAt),qn(n);};try{for(J$2(n),v({running:!0});;){J$2(n);let e=await Yn(Rn(a,u),n);if(!e.ok)return v({running:!0}),{status:`error`,message:e.message};let{doc:r}=e,i=r.querySelectorAll(mn).length;if(h=zn(u),i===0&&_){g=Math.max(g,h);let e=new Date().toISOString();return v({nextPid:u+50,running:!1,finishedAt:e}),t({page:h,pages:g,total:p}),{status:`completed`,total:p,pages:g}}let o=Hn(r,u);if(o===null)return m$2.warn(`favorites sync: unexpected page`,{pid:u,cardCount:i}),v({running:!0}),{status:`error`,message:En};if(d=o,g=Bn(d),i===0)return m$2.warn(`favorites sync: unexpected empty page`,{pid:u,lastPid:d}),v({running:!0}),{status:`error`,message:En};_=!0;let c=Vn(r);_$1(un(r,ee,u));let l=Gn(c,Cs$1());Ds$1(c),p=Cs$1().size;let f=u+50;if(v({nextPid:f,lastPid:d,running:!0}),t({page:h,pages:g,total:p}),s===K$2&&l||u>=d){let e=new Date().toISOString();return v({nextPid:f,lastPid:d,running:!1,finishedAt:e}),{status:`completed`,total:p,pages:g}}J$2(n),await kn(dn,n),J$2(n),u=f,h=zn(u);}}catch(e){return On(e)?(v({running:false}),Dn(p,h,g)):(m$2.error(`favorites sync: unexpected failure`,e),v({running:true}),{status:`error`,message:e instanceof Error?e.message:`unexpected error`})}}var Zn=`stats-history`,Qn=`last-backup`,$n=864e5,er=10;function tr(e){return typeof e!=`object`||!e?false:`day`in e&&typeof e.day==`string`&&`favorites`in e&&typeof e.favorites==`number`&&`followed`in e&&typeof e.followed==`number`&&`collections`in e&&typeof e.collections==`number`}function nr(e){return new Date(e).toISOString().slice(0,er)}function rr(){let e=Ic$1(Zn);return Array.isArray(e)?e.filter(tr):[]}function ir(e,t){return [...e.filter(e=>e.day!==t.day),t].slice(-400)}function ar(t=Date.now()){let n=rr(),r=nr(t);if(n.some(e=>e.day===r))return;let i=G$4();Lc$1(Zn,ir(n,{day:r,favorites:Cs$1().size,followed:i.artists.length,collections:i.collections.length}));}function or(){let e=Ic$1(Qn),t=typeof e==`string`?Date.parse(e):NaN;return Number.isFinite(t)?t:null}function sr(t=Date.now()){Lc$1(Qn,new Date(t).toISOString());}function cr(e,t){return Math.max(0,Math.floor((t-e)/$n))}function lr(e){return `${String(e)} ${e===1?`day`:`days`}`}function ur(e,t,n,r){if(e!==null){let t=cr(e,r),i=t===0?`Last backup: today.`:`Last backup: ${lr(t)} ago.`;return {due:n&&t>30,text:i}}let i=t===null?NaN:Date.parse(t),a=Number.isFinite(i)?cr(i,r):0;return {due:n&&a>=14,text:`No backup yet. Export keeps your collections and follows if the browser's data is lost.`}}function dr(e=Date.now()){let t=G$4(),n=t.artists.length>0||t.collections.length>0;return ur(or(),rr()[0]?.day??null,n,e)}var fr=`content`,pr=0,X$2=null,Z$2=false;function mr(e,t){return !(t!==null&&t.contains(e))}function hr(){let e=document.getElementById(fr),t=document.querySelectorAll(`a`);for(let n of t){if(!(n instanceof HTMLAnchorElement)||(n.textContent?.trim()??``)!==`Posts`)continue;let t=n.closest(`li`);if(t!==null&&t instanceof HTMLLIElement&&mr(t,e))return t}return null}function Q$2(){let e=document.querySelector(it$3);return e instanceof HTMLUListElement?e:null}function gr(){let e=document.querySelector(rt$3);return e instanceof HTMLElement?e:null}function _r(e){if(!Number.isFinite(e)||e<=0)return;let t=Math.trunc(e),n=Os$1();if(n?.userId===t)return;if(n!==void 0){let e={...n,userId:t};ks$1(e);return}let r=new Date().toISOString();ks$1({nextPid:pr,lastPid:pr,startedAt:r,finishedAt:r,userId:t});}function vr(e){let n=new URLSearchParams;return n.set(ce$1,ue$1),n.set(`s`,de$1),n.set(`id`,String(e)),`${ie$1}?${n.toString()}`}function yr(e=document,t=window.location.search){let n=Ln(e,t,Os$1()?.userId);return n===null||n<=0?null:(_r(n),vr(n))}function $$2(e,t,n){let r=document.getElementById(e);if(r instanceof HTMLLIElement){let e=r.querySelector(`a`);return e instanceof HTMLAnchorElement&&(e.textContent=t,e.href=n),r}let i=document.createElement(`li`);i.id=e;let a=document.createElement(`a`);return a.textContent=t,a.href=n,i.append(a),i}function br(){let e=document.getElementById(ct$3);e instanceof HTMLLIElement&&(e.hidden=true);}function xr(){let e=document.getElementById(ut$3);return e instanceof HTMLLIElement?e:hr()}function Sr(){if(gr()===null)return;let e=Q$2();if(e===null)return;let t=xr();if(t===null)return;let n=$$2(ot$3.collections,st$3.collections,Ke$3),r=$$2(ot$3.following,st$3.following,qe$3);n.parentElement===e?n.previousElementSibling!==t&&t.after(n):t.after(n),r.previousElementSibling!==n&&n.after(r);let a=yr(),s=document.getElementById(ot$3.favorites);if(a===null)s!==null&&s.remove();else {let e=$$2(ot$3.favorites,st$3.favorites,a);e.previousElementSibling!==r&&r.after(e);}let c=document.getElementById(ot$3.stats);if(jc$1(`stats-menu`,true)){let e=$$2(ot$3.stats,st$3.stats,Ye$3),t=document.getElementById(ot$3.favorites)??r;e.previousElementSibling!==t&&t.after(e);}else c!==null&&c.remove();br();let u=$$2(ot$3.settings,st$3.settings,Je$3);(u.parentElement!==e||e.lastElementChild!==u)&&e.append(u),Go$1(e),wr();}var Cr=`RuleDesk: time to export a backup (Data)`;function wr(){let e=document.getElementById(ot$3.settings);if(e===null)return;let t=dr().due;e.classList.toggle(go$1,t);let n=e.querySelector(`a`);n!==null&&(n.title=t?Cr:st$3.settings);}function Tr(e){return e===`collections`?ot$3.collections:e===`following`?ot$3.following:e===`stats`?ot$3.stats:ot$3.settings}function Er(){if(Z$2)return;Z$2=true;let e=Q$2();if(e===null){X$2=null;return}let t=e.querySelector(`li.${at$3}`);X$2=t instanceof HTMLLIElement&&!Object.values(ot$3).includes(t.id)?t:null;}function Dr(){for(let e of Object.values(ot$3)){let t=document.getElementById(e);t instanceof HTMLLIElement&&t.classList.remove(at$3);}}function Or(e){Er();let t=Q$2();if(t!==null)for(let e of t.querySelectorAll(`li.${at$3}`))e.classList.remove(at$3);Dr();let n=document.getElementById(Tr(e));n instanceof HTMLLIElement&&n.classList.add(at$3);}function kr(){Dr(),X$2!==null&&X$2.isConnected&&X$2.classList.add(at$3),X$2=null,Z$2=false;let e=Q$2();e!==null&&zo$1(e);}
var h=`ruledesk-web.settings-focus`,xe=exports("x",`favorites`);function g(e){return `${Je$3}/${encodeURIComponent(e)}`}function Se(e){let t=`${Je$3}/`;if(!e.startsWith(t))return null;let n=e.slice(t.length).split(`/`)[0]??``;if(n.length===0)return null;try{return decodeURIComponent(n)}catch{return n}}function Ce(e){try{window.sessionStorage.setItem(h,e);}catch{}}function we(){try{let e=window.sessionStorage.getItem(h);return window.sessionStorage.removeItem(h),e}catch{return null}}function _(e){window.location.hash=g(e);}var v=`g`,y=`tag-types`,Te=3e3,b={artist:`a`,character:`c`,copyright:`p`,metadata:`m`},Ee=`:`;function De(e){if(e===v)return `general`;for(let t of [`artist`,`character`,`copyright`,`metadata`])if(b[t]===e)return t;return null}function Oe(e){return e===`artist`||e===`character`||e===`copyright`||e===`metadata`?e:null}function x(e){return e.trim().toLowerCase().replaceAll(` `,`_`)}var S=null;function C(){if(S!==null)return S;let e=new Map,t=null;try{t=Ic$1(y);}catch{}if(Array.isArray(t))for(let n of t){if(typeof n!=`string`)continue;let t=n.indexOf(Ee),r=t>0?De(n.slice(0,t)):null;r!==null&&e.set(n.slice(t+1),r);}return S=e,e}function ke(e){let t=C().get(x(e));return t===void 0||t===`general`?null:t}function Ae(e){return C().has(x(e))}function w(t,n={}){let r=C(),i=false;for(let[e,a]of t){let t=(a===void 0?null:Oe(a))??(n.general===true&&a!==void 0?`general`:null),o=x(e);t!==null&&o.length!==0&&r.get(o)!==t&&(r.delete(o),r.set(o,t),i=true);}if(i){for(;r.size>Te;){let e=r.keys().next();if(e.done===true)break;r.delete(e.value);}try{Lc$1(y,[...r].map(([e,t])=>`${t===`general`?v:b[t]}${Ee}${e}`));}catch{}}}var je=`/public/autocomplete.php`,Me=exports("aD",`artist`),Ne=429,T=`AbortError`,Pe=A$3({label:T$2(),value:T$2(),type:N$3(Xi(T$2()))}),Fe=k$3(Pe);function Ie(e){let t=new URLSearchParams;return t.set(`q`,e),`${re$1}${je}?${t.toString()}`}function E(e){return e instanceof DOMException&&e.name===T?true:typeof e!=`object`||!e||!(`name`in e)?false:e.name===T}function Le(e){w(e.map(e=>[e.value,e.type??void 0]));let t=[];for(let n of e){let e=n.type===null||n.type===void 0?void 0:n.type;e===void 0?t.push({label:n.label,value:n.value}):t.push({label:n.label,value:n.value,type:e});}return t}function Re(e,t){let n=[],r=[];for(let i of e)i.type===t?n.push(i):r.push(i);return [...n,...r]}async function ze(e,t){return await D(e,t)??[]}async function D(e,t){let n=e.trim();if(n.length<2)return [];let i;try{let e={method:`GET`,credentials:be$2};t!==void 0&&(e.signal=t),i=await fetch(Ie(n),e);}catch(e){return E(e)||t?.aborted===true||m$2.error(`autocomplete: fetch failed`,e),null}if(i.status===Ne)return m$2.warn(`autocomplete: rate limited`,i.status),null;if(!i.ok)return m$2.warn(`autocomplete: HTTP error`,i.status),null;let a;try{a=await i.json();}catch(e){return E(e)||t?.aborted===true||m$2.error(`autocomplete: invalid JSON`,e),null}let o=Fe.safeParse(a);return o.success?Le(o.data):(m$2.error(`autocomplete: schema mismatch`,o.error),null)}function O(e={}){let t=null,n=null,r=e.preferType,i=()=>{t!==null&&(clearTimeout(t),t=null),n!==null&&(n.abort(),n=null);};return {query:(e,a)=>{i();let o=e.trim();o.length<2?a([]):t=setTimeout(()=>{t=null;let e=new AbortController;n=e,ze(o,e.signal).then(t=>{e.signal.aborted||(n===e&&(n=null),a(r===void 0?t:Re(t,r)));});},300);},cancel:i}}var Be=864e5,Ve=`;`,k=`=`;function A(){let e=`${Le$3}${k}`;for(let t of document.cookie.split(Ve)){let n=t.trim();if(!n.startsWith(e))continue;let r=n.slice(e.length);if(r===`1`)return  true;if(r===`0`)return  false}return null}function j(e){let t=new Date(Date.now()+365*Be);document.cookie=[`${Le$3}${k}${e?`1`:`0`}`,`expires=${t.toUTCString()}`,`path=/`].join(`; `);}var M=`posts`,N=`feed`,P=`following`,F=`collections`,He=[M,N,P,F,nn$2],Ue=`ai_generated`,I=`all`,L=tn$2,R=`show`,z=`hide`,We=`AI posts`,B=[{value:R,label:`Show`},{value:z,label:`Hide`}]; exports({aG:P,aq:F});function V(e){return typeof e==`object`&&!!e&&!Array.isArray(e)}function H(){let e=Ic$1(en$2),t={};if(!V(e))return {all:false,hide:t};let n=e[L];if(V(n))for(let e of He){let r=n[e];typeof r==`boolean`&&(t[e]=r);}return {all:e[I]===true,hide:t}}function U(t){Lc$1(en$2,{[I]:t.all,[L]:t.hide});}function W(){return H().all}function Ge(e){U({...H(),all:e});}function Ke(e){return H().hide[e]??false}function qe(){let e=H();e.hide.posts===void 0&&U({...e,hide:{...e.hide,[M]:A()===true}});}function G$1(e){return W()||Ke(e)}function K$1(e,t){let n=H();U({...n,hide:{...n.hide,[e]:t}});}function q$1(e){return G$1(e)?z:R}var Je=`sort:`,Ye=`score:`,Xe=new Set([`video`,`-video`]);function J$1(e){return e.trim().toLowerCase().split(/\s+/).filter(e=>e.length>0&&!e.startsWith(Je)&&!e.startsWith(Ye)&&!Xe.has(e))}function Ze(e,t){if(e.length!==t.length)return  false;let n=new Set(e);return t.every(e=>n.has(e))}function Qe(e,t,r){if(Pt$2(t)!==null)return F;let i=J$1(e);if(i.length===0)return M;let a=i.join(` `),s=[...r.artistTags];if(yo$1(a,s)||bo$1(a,s)||mo$1(a,s,r.groupSize)>=0)return N;let c=i[0];if(i.length===1&&c!==void 0){let e=new Set;for(let t of s){let n=R$3(t);n!==null&&e.add(n);}if(e.has(c))return P}for(let e of r.savedQueries){let t=J$1(e);if(t.length>0&&Ze(t,i))return F}return M}function $e(){let e=Ks$1();return {artistTags:e.artists.map(e=>e.tag),groupSize:Rc$1(),savedQueries:e.collections.filter(e=>e.kind===Te$3).map(e=>io$1(e.tags))}}function Y$1(e){return P$3(e.search)===`list`?Qe(e.searchParams.get(`tags`)??``,e.hash,$e()):null}function et(){return Y$1(new URL(window.location.href))}function X$1(e){if(e===`favorites`)return  false;try{let t=G$1(e),n=A();return n===t||n===null&&!t?!1:(j(t),!0)}catch(e){return m$2.warn(`ai-scope: the site's AI switch was not set`,e),false}}async function tt(e,t){let n=A(),r=X$1(e);try{return await t()}finally{r&&j(n===true);}}var nt=`rdw-ai-toggle`,rt=`rdw-ai-toggle__label`,Z$1=`rdw-ai-note`,it=`rdw-ai-note__link`,at=`AI`,ot=`AI posts`,st=`Hidden everywhere.`,ct=`Change in Settings`,lt=`
.${nt} {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.${rt} {
  font: 600 10.5px var(--rdw-font);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--rdw-muted);
}
.${Z$1} {
  margin: 4px 0 0;
  color: var(--rdw-muted);
  font: 11.5px/1.35 var(--rdw-font);
}
.${Z$1}[data-inline="true"] {
  margin: 0;
  white-space: nowrap;
}
.${it} {
  padding: 0;
  border: 0;
  background: none;
  color: var(--rdw-accent);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}
`;function ut(e){return K$3(A$2,{children:[K$3(`style`,{children:lt}),K$3(`p`,{className:Z$1,"data-inline":e.inline===true?`true`:void 0,children:[st,` `,K$3(`button`,{type:`button`,className:`${it} rdw-kit-focusable`,onClick:()=>{_(`ai`);},children:ct})]})]})}function dt(e){let t=W(),[n,r]=z$2(()=>q$1(e.scope));return K$3(A$2,{children:[K$3(`style`,{children:lt}),K$3(`span`,{className:nt,children:[K$3(`span`,{className:rt,"aria-hidden":`true`,children:at}),K$3(Or$1,{label:ot,options:B,value:t?z:n,disabled:t,onChange:t=>{(t===`show`||t===`hide`)&&(K$1(e.scope,t===z),X$1(e.scope),r(t));}})]}),t?K$3(ut,{inline:true}):null]})}var ft=`?`,pt=/^\d+$/,mt=`-`,ht=`:`,gt=[`(`,`)`,`~`],_t=/\D/g,vt=/\s+/,yt=`score:`,bt=`rating:`;function xt(e,t){let n=e.querySelector(rn$2.imageList);if(n===null)return [];let r=[],i=n.querySelectorAll(`${rn$2.thumb} ${rn$2.previewImage}`);for(let e of i){let n=e.getAttribute(`src`);if(n!==null&&n.trim().length!==0&&(r.push(n.trim()),r.length===t))break}return r}function St(e){let t=0;for(let n of e.querySelectorAll(rn$2.thumb)){let e=cn$2(n),r=e===null?NaN:Number(e);Number.isFinite(r)&&r>t&&(t=r);}return t}function Ct(e){let t=e.querySelector(rn$2.previewImage),n=t?.getAttribute(`title`)?.trim()??``,r=n.length>0?n:t?.getAttribute(`alt`)?.trim()??``,i=[];for(let e of r.split(vt)){let t=e.toLowerCase();e.length===0||t.startsWith(yt)||t.startsWith(bt)||i.push(t);}return i}function wt(e){let t=e.getAttribute(`href`);if(t===null)return null;let n=t.slice(t.indexOf(ft)+1),r=new URLSearchParams(n).get(`pid`);return r===null||!pt.test(r)?null:Number(r)}function Tt(e){let t=jo$1(e).split(` `),n=t[0];return t.length!==1||n===void 0||n.length===0||n.startsWith(mt)||n.includes(ht)||gt.includes(n)?null:n.toLowerCase()}function Et(e,t){for(let n of e.querySelectorAll(`a[href]`)){let e=n.getAttribute(`href`)??``,r=e.indexOf(ft);if(r<0)continue;let i=new URLSearchParams(e.slice(r+1)).get(le$1);if(i!==null&&i.trim().toLowerCase()===t)return  true}return  false}function Dt(e,t){let n=Tt(t);if(n===null)return null;for(let t of e.querySelectorAll(rn$2.tagSidebarRow)){if(!Et(t,n))continue;let e=(t.querySelector(rn$2.tagCount)?.textContent??``).replace(_t,``);return e.length===0?null:{value:Number(e),exact:true}}return null}function Ot(e,t){let n=Dt(e,t);if(n!==null)return n;let r=e.querySelector(rn$2.paginationLastPage);if(r!==null){let e=wt(r);if(e!==null)return {value:e,exact:false}}let i=null;for(let t of e.querySelectorAll(rn$2.paginationPageLink)){let e=wt(t);e!==null&&(i===null||e>i)&&(i=e);}if(i!==null)return {value:i,exact:false};let a=e.querySelector(rn$2.imageList);return a===null?null:{value:a.querySelectorAll(rn$2.thumb).length,exact:true}}var kt=`:`,At=/\s$/,jt=/(\S+)$/,Mt=[`(`,`)`,`~`];function Q$1(e){if(e.length===0||At.test(e))return null;let t=jt.exec(e),n=t?.[1];if(t===null||n===void 0||Mt.includes(n)||n.includes(kt))return null;let r=n.startsWith(`-`)&&n.length>1?`-`:``,i=n.slice(r.length);return i===`-`?null:{head:e.slice(0,t.index),prefix:r,stem:i}}function $$1(e,t){let n=Q$1(e);return n===null?`${e}${t} `:`${n.head}${n.prefix}${t} `}function Nt(e){let t=V$2(O()),[n,r]=z$2([]);B$2(()=>{let e=t.current;return ()=>{e.cancel();}},[]);let i=()=>{t.current.cancel(),r([]);},a=n=>{e.onChange(n);let a=Q$1(n);a===null?i():t.current.query(a.stem,r);},o=t=>{e.onChange($$1(e.value,t.value)),i();},s={...e.label===void 0?{}:{label:e.label},...e.placeholder===void 0?{}:{placeholder:e.placeholder},...e.id===void 0?{}:{id:e.id},...e.className===void 0?{}:{className:e.className},...e[`aria-label`]===void 0?{}:{"aria-label":e[`aria-label`]}};return K$3(ot$2,{...s,value:e.value,suggestions:n,replaceOnSelect:false,onChange:a,onSelect:o})}var la=`;`,ua=`=`,da=/[, ]|%20+/g,fa=`user:`,pa=`rating:`,ma=864e5,ha=365,ga=` `,_a=new Set;function va(e){return _a.add(e),()=>{_a.delete(e);}}function ya(e){let t=document.cookie.split(la),n=`${e}${ua}`;for(let e of t){let t=e.trim();if(t.startsWith(n))return t.slice(n.length)}return null}function ba(e){let t=new Set,n=[];for(let r of e){let e=r.trim().toLowerCase().replaceAll(` `,`_`);e.length===0||t.has(e)||(t.add(e),n.push(e));}return n}function xa(e){return e.length===0?``:encodeURIComponent(encodeURIComponent(e.join(ga)))}function Sa(e,t){document.cookie=[`${je$3}${ua}${e}`,`expires=${t.toUTCString()}`,`path=/`].join(`; `);}function Ca(){let e=ya(je$3);if(e===null||e.length===0)return [];let t;try{t=decodeURIComponent(decodeURI(e));}catch{return []}let n=[];for(let e of t.split(da)){let t=e.trim().toLowerCase();t.length!==0&&n.push(t);}return n}function wa(e){let t=ba(e),n=new Date(Date.now()+5*ha*ma);Sa(xa(t),n);for(let e of _a)e(t);}function Ta(e,t,n,r){if(r.length===0)return  false;let i=new Set;for(let t of e){let e=t.trim().toLowerCase();e.length>0&&i.add(e);}let a=n.trim().toLowerCase();for(let e of r)if(!e.startsWith(fa)){if(e.startsWith(pa)){let t=e.slice(7);if(t.length>0&&t===a)return  true}else if(i.has(e))return  true}return  false}var Ea=`blacklist-hide`,Da=`Hide blacklisted posts`,Oa=[`list`],ka=Kt$2(Ea),Aa=`rdw-blacklisted`,ja=`score:`,Ma=`rating:`,Na=/\s+/,Pa=`
body.${ka} span.thumb.${Aa} {
  display: none !important;
}
`.trim(),Fa,Ia;function La(e){let t=[];for(let n of e.trim().split(Na)){if(n.length===0)continue;let e=n.toLowerCase();e.startsWith(ja)||e.startsWith(Ma)||t.push(n);}return t}function Ra(e){for(let t of e.trim().split(Na))if(t.length!==0&&t.toLowerCase().startsWith(Ma))return t.slice(7);return ``}function za(e,t){if(!(e instanceof HTMLElement))return;let n=e.querySelector(rn$2.previewImage),r=n?.getAttribute(`alt`)??``,i=n?.getAttribute(`title`)??``,a=Ta(La(r),0,Ra(i),t);e.classList.toggle(Aa,a);}function Ba(e,t=Ca()){let n=e.querySelectorAll(rn$2.thumb);for(let e of n)za(e,t);}function Va(){Fa===void 0&&(Fa=ot$4(e=>{Ba(e);})),Ia===void 0&&(Ia=va(e=>{Ba(document,e);}));}function Ha(e){e.pageKind===`list`&&(Ba(document),Va());}var Ua={id:Ea,label:Da,pages:[...Oa],defaultEnabled:true,cssOnly:true,css:Pa,mount:Ha},Wa=`cdn-fallback`,Ga=`Retry a failed post image on other servers`,Ka=[`post`],qa=`img#image`,Ja=`error`,Ya=[`wimg.rule34.xxx`,`img.rule34.xxx`,`us.rule34.xxx`,`api-cdn.rule34.xxx`];function Xa(e,t){let n;try{n=new URL(e,window.location.href);}catch{return null}if(!Ya.includes(n.hostname))return null;for(let e of Ya)if(!(e===n.hostname||t.has(e)))return n.hostname=e,n.href;return null}function Za(e){try{return new URL(e,window.location.href).hostname}catch{return ``}}function Qa(e){let t=document.querySelector(qa);if(!(t instanceof HTMLImageElement))return;let n=new Set;t.addEventListener(Ja,()=>{let e=t.getAttribute(`src`)??``;n.add(Za(e));let r=Xa(e,n);r!==null&&t.setAttribute(`src`,r);});}var $a={id:Wa,label:Ga,pages:[...Ka],defaultEnabled:true,css:``,mount:Qa},eo=`mousedown`,to=`click`,no=`dragstart`,ro=0,io=0;function ao(e){let t=t=>{let n=t.target;return n instanceof Element?e(n):null},n=e=>{if(e.button!==ro)return;let n=t(e);n!==null&&(e.preventDefault(),e.stopPropagation(),n());},r=e=>{let n=t(e);n!==null&&(e.preventDefault(),e.stopPropagation(),e.detail===io&&n());},i=e=>{t(e)!==null&&e.preventDefault();};return document.addEventListener(eo,n,true),document.addEventListener(to,r,true),document.addEventListener(no,i,true),()=>{document.removeEventListener(eo,n,true),document.removeEventListener(to,r,true),document.removeEventListener(no,i,true);}}var oo=`rdw-dl-select`,so=`rdw-dl-selected`,co=3,lo=4,uo=10,fo=13,po=12,mo=`
body.${oo} ${rn$2.thumb} {
  cursor: pointer;
}
/* While posts are being marked a thumbnail does not lift under the pointer
   ("Motion" in the settings): lifted, it stands out of the frame of a marked post. */
body.${oo} ${rn$2.thumb}:hover img {
  transform: none !important;
}
/* The frame of a marked post is a layer over the whole cell, the picture
   under it. It was an outline of the cell, drawn inside it: a picture as tall
   as the cell stood over that line, and read as a post that had come out of
   its frame (Kaze, 19.11.2026). The tick is in the same layer: a round ground
   in its corner and the sign over it. A tick as well as a frame, because a
   frame alone would mark a post by colour only. "html" in front makes these
   rules stronger than those of the play sign and of GIF, which are the same
   pseudo-element of a thumb and gave way only by standing earlier. */
html body.${oo} ${rn$2.thumb}.${so} {
  position: relative;
  border-radius: var(--rdw-radius-m);
}
html body.${oo} ${rn$2.thumb}.${so}::after {
  content: "✓";
  position: absolute;
  inset: 0;
  z-index: ${String(lo)};
  box-sizing: border-box;
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  width: auto;
  height: auto;
  padding: 0 0 ${String(fo-po/2)}px 9px;
  border: ${String(co)}px solid var(--rdw-accent);
  border-radius: var(--rdw-radius-m);
  background: radial-gradient(
      circle at ${String(fo)}px calc(100% - ${String(fo)}px),
      var(--rdw-accent) ${String(uo)}px,
      transparent ${String(uo)}.5px
    )
    no-repeat;
  color: var(--rdw-surface);
  font: 700 ${String(po)}px/1 var(--rdw-font);
  letter-spacing: 0;
  pointer-events: none;
}
`.trim(),ho=`rdw-grid-select-style`;function go(){if(document.getElementById(ho)!==null)return;let e=document.createElement(`style`);e.id=ho,e.textContent=mo,document.head.append(e);}var _o=null;function vo(){let e=[];for(let t of document.querySelectorAll(`${rn$2.thumb}.${so}`)){let n=cn$2(t),r=n===null?NaN:Number(n);Number.isFinite(r)&&e.push(r);}return e}function yo(e){let t=e.closest(rn$2.thumb);return t===null||e.closest(`button`)!==null?null:()=>{t.classList.toggle(so),_o?.(vo().length);}}var bo=null;function xo(e){let t=[];for(let n of document.querySelectorAll(`${rn$2.thumb}.${so}`)){let r=cn$2(n),i=r===null?NaN:Number(r);r!==null&&Number.isFinite(i)&&n instanceof HTMLElement&&t.push({id:i,thumbUrl:e(n,r)});}return t}function So(){for(let e of document.querySelectorAll(rn$2.thumb))cn$2(e)!==null&&e.classList.add(so);_o?.(vo().length);}function Co(){for(let e of document.querySelectorAll(`.${so}`))e.classList.remove(so);_o?.(0);}function wo(){return document.body.classList.contains(oo)}function To(e){wo()||(go(),_o=e,document.body.classList.add(oo),bo=ao(yo));}function Eo(){bo?.(),bo=null,document.body.classList.remove(oo);for(let e of document.querySelectorAll(`.${so}`))e.classList.remove(so);_o=null;}var Do=Xe$1,Oo=`Download manager`,ko=[`list`,`post`,`favorites`,`other`],G=tt$3,Ao=`rdw-downloads-head`,jo=`rdw-downloads-title`,Mo=`rdw-downloads-text`,No=`rdw-downloads-actions`,Po=`rdw-downloads-minimised`,Fo=`rdw-downloads-chip`,Io=`rdw-progress__label`,Lo=`rdw-progress__fill--indeterminate`,Ro=`ruledesk-web.downloads.minimised`,zo=`1`,Bo=280,Vo=16,Ho=30,Uo=14,Wo=100,Go=`Downloading`,Ko=`Downloaded`,qo=`Couldn’t download`,Jo=`“`,Yo=`”`,Xo=`selected post`,Zo=`selected posts`,Qo=`Looking up files…`,$o=`found`,es=`of`,ts=`file`,ns=`files`,rs=`Paused`,is=`Finished`,as=`failed`,os=` · `,ss=`Looking up…`,cs=`Done`,ls=`Failed`,us=`Pause`,ds=`Resume`,fs=`Cancel`,ps=`Close`,ms=`Minimize`,hs=`Show the download`,gs=`downloads: session storage unavailable`,_s=`
#${G} {
  position: fixed;
  right: ${String(Vo)}px;
  bottom: ${String(Vo)}px;
  z-index: ${String(Ho)};
  width: ${String(Bo)}px;
  max-width: calc(100vw - 32px);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: var(--rdw-surface);
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-l);
  box-shadow: var(--rdw-shadow-2);
  color: var(--rdw-text);
  font: 12.5px/1.4 var(--rdw-font);
}
#${G}:empty {
  display: none;
}
#${G}.${Po} {
  width: auto;
  padding: 0;
  background: transparent;
  border: 0;
  box-shadow: none;
}
#${G} .${Fo} {
  box-shadow: var(--rdw-shadow-2);
  font-variant-numeric: tabular-nums;
}
#${G} .${Ao} {
  display: flex;
  align-items: center;
  gap: 8px;
}
#${G} .${jo} {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
#${G} .${Mo} {
  margin: 0;
  color: var(--rdw-muted);
  word-break: break-word;
}
#${G} .${Io} {
  font: 12.5px/1.4 var(--rdw-font);
  letter-spacing: 0;
  text-transform: none;
  word-break: break-word;
}
#${G} .${No} {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
@media (prefers-reduced-motion: reduce) {
  #${G} .${Lo} {
    animation: none;
  }
}
`.trim();function vs(){try{return window.sessionStorage.getItem(Ro)===zo}catch{return  false}}function ys(e){try{e?window.sessionStorage.setItem(Ro,zo):window.sessionStorage.removeItem(Ro);}catch(e){m$2.warn(gs,e);}}function bs(e){let t=e.phase===`done`?Ko:e.phase===`error`?qo:Go;if(e.selected!==null){let n=e.selected===1?Xo:Zo;return `${t} ${String(e.selected)} ${n}`}return `${t} ${Jo}${e.label}${Yo}`}function xs(e){let t=e.total===1?ts:ns,n=`${String(e.done)} ${es} ${String(e.total)} ${t}`;return e.failed>0?`${n}, ${String(e.failed)} ${as}`:n}function Ss(e){return e.phase===`collecting`?e.expected===null?`${Qo} ${String(e.total)} ${$o}`:`${Qo} ${String(e.total)} ${es} ${String(e.expected)}`:e.phase===`error`?e.message:e.phase===`paused`?`${e.message.length>0?`${rs}: ${e.message}`:rs}${os}${xs(e)}`:e.phase===`done`?`${is}${os}${xs(e)}`:xs(e)}function Cs(e){return e.total===0?0:(e.done+e.failed)/e.total}function ws(e){if(e.phase===`collecting`)return ss;if(e.phase===`error`)return ls;if(e.phase===`done`)return cs;let t=`${String(Math.round(Cs(e)*Wo))}%`;return e.phase===`paused`?`${rs}${os}${t}`:t}function Ts(e){let{host:t}=e,[n,r]=z$2(()=>Qt()),[i,a]=z$2(vs);B$2(()=>{let e=$t(r);return r(Qt()),e},[]);let o=n.phase===`idle`;B$2(()=>{t.classList.toggle(Po,i&&!o);},[t,i,o]);let s=e=>{ys(e),a(e);};if(o)return null;let c=bs(n),l=Ss(n);if(i)return K$3(J$3,{variant:`secondary`,size:`s`,className:Fo,title:`${hs}: ${c}${os}${l}`,onClick:()=>{s(false);},children:ws(n)});let u=n.phase===`done`||n.phase===`error`;return K$3(A$2,{children:[K$3(`div`,{className:Ao,children:[K$3(`p`,{className:jo,title:c,children:c}),K$3(En$1,{label:ms,onClick:()=>{s(true);},children:K$3(ht$2,{size:Uo})})]}),n.phase===`collecting`?n.expected===null?K$3(Wn$1,{waiting:true,label:l}):K$3(Wn$1,{value:n.expected===0?0:n.total/n.expected,label:l}):n.phase===`error`?K$3(`p`,{className:Mo,role:`alert`,children:l}):K$3(Wn$1,{value:Cs(n),label:l}),K$3(`div`,{className:No,children:[n.phase===`running`?K$3(J$3,{variant:`secondary`,size:`s`,onClick:nn,children:us}):null,n.phase===`paused`?K$3(J$3,{variant:`primary`,size:`s`,onClick:rn,children:ds}):null,K$3(J$3,{variant:`secondary`,size:`s`,onClick:an,children:u?ps:fs})]})]})}function Es(e){if(document.getElementById(G)!==null)return;let t=document.createElement(`div`);t.id=G,document.body.append(t),ve$1(K$3(Ts,{host:t}),t),on();}var Ds={id:Do,label:Oo,pages:[...ko],defaultEnabled:true,css:`${_s}
${mo}`,mount:Es},Os=exports("e",`tag-kind-lookup`),ks=1100,As=`general`,js=`:`,Ms=`*`,Ns=[],Ps=false,Fs=0,Is=new Set,Ls=new Set;function Rs(e){return Ls.add(e),()=>{Ls.delete(e);}}function zs(e){return new Promise(t=>{window.setTimeout(t,e);})}async function Bs(){Ps=true;for(let e=Ns.shift();e!==void 0;e=Ns.shift()){let t=await D(e);if(t===null){for(let t of [e,...Ns])Is.delete(t);Ns=[];break}let n=e,r=t.find(e=>x(e.value)===n);w([[n,r?.type??As]],{general:true});for(let e of Ls)e();Ns.length>0&&await zs(ks);}Ps=false;}function Vs(e){try{if(!jc$1(`tag-kind-lookup`,!0))return}catch{return}for(let t of e){let e=x(t);e.length<2||e.includes(js)||e.includes(Ms)||Is.has(e)||Ae(e)||Fs>=30||(Is.add(e),Fs+=1,Ns.push(e));}!Ps&&Ns.length>0&&Bs();}function Hs(e){let t=x(e);if(t.length===0||t.includes(`:`))return `default`;let n=ke(t);if(n!==null)return n;try{let e=G$4().artists.find(e=>x(e.tag)===t);return e===void 0?`default`:qc$1(e)}catch{return `default`}}var Us=` `;function Ws(e){let[,t]=z$2(0),n=e.join(Us);B$2(()=>{Vs((n.length===0?[]:n.split(Us)).filter(e=>Hs(e)==="default"));},[n]),B$2(()=>Rs(()=>{t(e=>e+1);}),[]);}function Gs(e){let t=new URLSearchParams;return t.set(`id`,e),`${re$1}${me$1}?${t.toString()}`}function Ks(e){let t=new URLSearchParams;return t.set(ge$2,ve$2),t.set(`s`,ye$2),t.set(`id`,e),t.set(_e$2,`up`),`${re$1}${he$2}?${t.toString()}`}function qs(e){let t=new URLSearchParams;return t.set(ce$1,ue$1),t.set(`s`,fe$1),t.set(`id`,e),t.set(pe$1,`0`),`${re$1}${ie$1}?${t.toString()}`}async function Js(e){let t=await fetch(e,{method:`GET`,credentials:be$2});if(!t.ok)throw Error(`HTTP ${String(t.status)}`);return (await t.text()).trim()}function Ys(e){if(e.length===0)return;let t=Number(e);if(Number.isFinite(t))return t}async function Xs(e){let t;try{t=await Js(Gs(e));}catch(t){return m$2.warn(`addfav request failed`,e,t),{status:`error`}}if(t===`1`)return {status:`already`};if(t===`2`)return {status:`not_logged_in`};if(t!==`3`)return m$2.warn(`Unexpected addfav response`,e,t),{status:`error`};try{let t=await Zs(e);return t===null?{status:`added`}:{status:`added`,score:t}}catch(t){return m$2.warn(`vote request failed after addfav`,e,t),{status:`added`}}}async function Zs(e){try{let t=Ys(await Js(Ks(e)));return t===void 0?null:t}catch(t){return m$2.warn(`vote request failed`,e,t),null}}async function Qs(e,t={}){try{let n={method:`GET`,credentials:be$2};t.signal!==void 0&&(n.signal=t.signal);let r=await fetch(qs(e),n);return r.ok?{status:`removed`}:(m$2.warn(`remove favorite HTTP error`,e,r.status),{status:`error`})}catch(n){return t.signal?.aborted===true||n instanceof DOMException&&n.name===`AbortError`||n instanceof Error&&n.name===`AbortError`||m$2.warn(`remove favorite request failed`,e,n),{status:`error`}}}var $s=/\s+/,ec=1,tc=`whole`,nc=`unknown`;function rc(e){return e.trim().split($s).filter(e=>e.length>0)}function ic(e,t,n){let r=e.get(t);r===void 0?e.set(t,new Set([n])):r.add(n);}function ac(e){if(e?.size!==1)return null;for(let t of e)return t;return null}function oc(e,t,n,r){if(r===false)return {tag:e,state:tc};if(n)return {tag:e,state:t===void 0?tc:nc};let i=ac(t);return i===null?{tag:e,state:`cut`}:{tag:i,state:tc}}function sc(e){let t=e.map(e=>rc(e.tags)),n=new Set,r=new Map,i=new Map,a=e=>{n.has(e)||(n.add(e),e.length>ec&&(ic(r,e.slice(ec),e),ic(i,e.slice(0,-1),e)));};return e.forEach((e,n)=>{let r=t[n]??[],i=e.cut===false?0:1,o=e.cut===false?r.length:r.length-1;for(let e=i;e<o;e+=1){let t=r[e];t!==void 0&&a(t);}}),e.map((e,a)=>{let o=t[a]??[],s=o[0],c=o[o.length-1];if(s===void 0||c===void 0||e.cut===false)return {...e,tagList:o,firstEnd:tc,lastEnd:tc};if(o.length===1){let t=n.has(s)?nc:`cut`;return {...e,tagList:o,firstEnd:t,lastEnd:t}}let l=oc(s,r.get(s),n.has(s),e.cut),u=oc(c,i.get(c),n.has(c),e.cut),d=[l.tag,...o.slice(1,-1),u.tag];return {...e,tagList:d,firstEnd:l.state,lastEnd:u.state}})}var cc=new WeakMap;function lc(e){let t=cc.get(e);if(t!==void 0)return t;let n=sc(e);return cc.set(e,n),n}var uc=`images`,dc=`videos`,fc=`id-asc`,pc=`id-desc`,mc=/\s+/,hc=`-`,gc=`*`,_c=`(`,vc=`)`,yc=`~`,bc=`~`,xc=`:`,Sc=`sort`,Cc=new Map([[`sort:id:asc`,fc],[`sort:id:desc`,pc],[`sort:id`,pc]]),wc=new Set([Sc,`user`,`md5`,`rating`,`parent`,`width`,`height`,`score`,`aspectratio`,`aspectratiof`,`sourcedomains`,`source`,`id`]),Tc=/[.+?^${}()|[\]\\]/g;function Ec(e){let t=e.split(gc).map(e=>e.replace(Tc,`\\$&`)).join(`.*`);return RegExp(`^${t}$`)}function Dc(e){let t=e.startsWith(gc)?e:e.slice(1),n=e.endsWith(gc)?e:e.slice(0,-1),r=e.endsWith(gc)?t:t.slice(0,-1);return {whole:Ec(e),noFirst:Ec(t),noLast:Ec(n),noEnds:Ec(r)}}function Oc(e){return e===`all`||e===`images`||e===`videos`}function kc(e){let t=e.indexOf(xc);return t>0&&wc.has(e.slice(0,t))}function Ac(e){let t=[],n=[],r=[],i=[],a=null,o=null;for(let s of e.toLowerCase().split(mc)){if(s.length===0)continue;if(o!==null){s===vc?(o.length>0&&r.push(o),o=null):s!==yc&&o.push(Dc(s));continue}if(s===_c){o=[];continue}let e=s.startsWith(hc),c=e?s.slice(1):s;if(c.length!==0){if(kc(c)){let t=e?void 0:Cc.get(c);t===void 0?i.push(s):a=t;}else c.endsWith(bc)?i.push(s):(e?n:t).push(Dc(c));}}return o!==null&&o.length>0&&r.push(o),{include:t,exclude:n,anyOf:r,sort:a,unsupported:i}}function jc(e){return e.include.length===0&&e.exclude.length===0&&e.anyOf.length===0&&e.sort===null}function Mc(e,t){let n=e.tagList,r=n.length-1;return n.some((n,i)=>{if(t.whole.test(n))return  true;let a=i===0&&e.firstEnd!==`whole`,o=i===r&&e.lastEnd!==`whole`;return a&&t.noFirst.test(n)||o&&t.noLast.test(n)||a&&o&&t.noEnds.test(n)})}function Nc(e,t){return t.include.every(t=>Mc(e,t))&&!t.exclude.some(t=>Mc(e,t))&&t.anyOf.every(t=>t.some(t=>Mc(e,t)))}function Pc(e,t){return t===`all`||Nt$4(e.tags)===(t===dc)}function Fc(e,t,n,r){let i=lc(e).filter(e=>t.has(e.id)&&Pc(e,r)&&Nc(e,n));return n.sort===`id-asc`?i.sort((e,t)=>e.id-t.id):n.sort===`id-desc`?i.sort((e,t)=>t.id-e.id):i.sort((e,t)=>t.run-e.run||e.pos-t.pos||t.id-e.id)}function Ic(e,t,n){let r=new Map;for(let n of lc(e)){if(!t.has(n.id))continue;let e=n.tagList.length-1,i=n.tagList.filter((t,r)=>(r!==0||n.firstEnd!==`cut`)&&(r!==e||n.lastEnd!==`cut`));for(let e of new Set(i))r.set(e,(r.get(e)??0)+1);}return [...r].map(([e,t])=>({tag:e,count:t})).sort((e,t)=>t.count-e.count||e.tag.localeCompare(t.tag)).slice(0,n)}var Lc=1831565813,Rc=4294967296;function zc(e,t){let n=t>>>0,r=()=>{n=n+Lc>>>0;let e=n;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/Rc},i=[...e];for(let e=i.length-1;e>0;--e){let t=Math.floor(r()*(e+1)),n=i[e],a=i[t];n!==void 0&&a!==void 0&&(i[e]=a,i[t]=n);}return i}var Bc=new Set([`(`,`)`,`~`]),Vc=`-`,Hc=`*`,Uc=/\s/,Wc=`starts`,Gc=`inside`,Kc=`Exclude`;function qc(e,t){let n=Math.max(0,Math.min(t,e.length)),r=n;for(;r>0&&!Uc.test(e.charAt(r-1));)--r;let i=n;for(;i<e.length&&!Uc.test(e.charAt(i));)i+=1;if(r===i)return null;let a=e.slice(r,i).toLowerCase(),o=a.startsWith(Vc);return {start:r,end:i,body:o?a.slice(1):a,negated:o}}function Jc(e,t){if(t===null||t.body.length===0)return null;let{body:n,negated:r}=t;if(Bc.has(n)||n.includes(Hc))return null;let i=r?Vc:``,a=[],o=[],s=[],c=null;for(let t of e)t.tag===n?c=t:t.tag.startsWith(n)?o.push(t):t.tag.includes(n)&&s.push(t);let l=(e,t)=>t.count-e.count||e.tag.localeCompare(t.tag),u=e=>e.every((t,n)=>{let r=e[n-1];return r===void 0||l(r,t)<=0});u(o)||o.sort(l),u(s)||s.sort(l);let d=(e,t)=>({insert:`${i}${e.tag}`,label:`${i}${e.tag}`,matchStart:i.length+e.tag.indexOf(n),matchLength:n.length,count:e.count,caption:null,group:t});for(let e of c===null?o:[c,...o])a.push(d(e,Wc));for(let e of s)a.push(d(e,Gc));return a.length===0||a.length===1&&c!==null?null:{heading:r?Kc:null,items:a.slice(0,20)}}function Yc(e,t,n){let r=e.slice(0,t.start),i=e.slice(t.end),a=i.length===0||!Uc.test(i.charAt(0))?` `:``,o=`${r}${n}${a}`,s=a.length>0?o.length:o.length+1;return {text:`${o}${i}`,caret:Math.min(s,o.length+i.length)}}function Xc(e,t){let n=new Set(t.map(e=>e.tag)),r=[];for(let t of e.toLowerCase().split(/\s+/))t.length===0||t.startsWith(Vc)||Bc.has(t)||t.includes(Hc)||t.includes(`:`)||n.has(t)||r.push(t);return r}function Zc(e,t){let n=null,r=false;for(let i of e){if(i.tag===t||!i.tag.includes(t))continue;let e=i.tag.startsWith(t);(n===null||e&&!r||e===r&&(i.tag.length<n.tag.length||i.tag.length===n.tag.length&&i.count>n.count))&&(n=i,r=e);}return n}var Qc=`(`,$c=`)`,el=`~`,tl=/\S+/g;function nl(e){return `Any of ${String(e)} ${e===1?`tag`:`tags`}`}function rl(e){let t=[],n=null,r=0,i=0;for(let a of e.matchAll(tl)){let e=a[0],o=a.index,s=o+e.length;if(i=s,n!==null){e===$c?(t.push({start:n,end:s,label:nl(r),excluded:false,group:true}),n=null):e!==el&&(r+=1);continue}if(e===Qc){n=o,r=0;continue}let c=e.startsWith(Vc)&&e.length>1;t.push({start:o,end:s,label:c?e.slice(1):e,excluded:c,group:false});}return n!==null&&t.push({start:n,end:i,label:nl(r),excluded:false,group:true}),t}function il(e){return e.replace(/\s+/g,` `).trim()}function al(e,t){return il(`${e.slice(0,t.start)} ${e.slice(t.end)}`)}function ol(e,t){if(t.group)return e;let n=t.excluded?t.label:`${Vc}${t.label}`;return il(`${e.slice(0,t.start)}${n}${e.slice(t.end)}`)}var sl=`none`,cl=`id:`,ll=`Any`,ul=`Not in any collection`;function dl(e){return e.kind===Ee$3}function fl(e){let t=e.filter(dl).map(e=>({value:`${cl}${e.id}`,label:e.name})).sort((e,t)=>e.label.localeCompare(t.label));return [{value:`any`,label:ll},{value:sl,label:ul},...t]}function pl(e,t){if(t===`none`){let t=new Set;for(let n of e)if(dl(n))for(let e of n.postIds??[])t.add(e);return e=>!t.has(e)}if(!t.startsWith(cl))return null;let n=t.slice(3),r=e.find(e=>dl(e)&&e.id===n);if(r===void 0)return null;let i=new Set(r.postIds??[]);return e=>i.has(e)}function ml(e,t){let n=new Map;for(let e of t)n.set(e.tag,e.count);let r=[],i=new Set;for(let t of e){let e=t.tag.toLowerCase(),a=n.get(e);a===void 0||a===0||i.has(e)||(i.add(e),r.push({tag:e,kind:t.kind??`artist`,count:a}));}return r.sort((e,t)=>t.count-e.count||e.tag.localeCompare(t.tag))}function hl(e,t){return rl(e).some(e=>!e.group&&!e.excluded&&e.label.toLowerCase()===t)}function gl(e,t){let n=rl(e).find(e=>!e.group&&e.label.toLowerCase()===t);if(n!==void 0)return n.excluded?ol(e,n):al(e,n);let r=e.trim();return r.length===0?t:`${r} ${t}`}var _l=`rdw-fav-more`,vl=`rdw-fav-controls`,yl=`rdw-fav-layout`,bl=`rdw-favorites-side`,xl=`rdw-fav-side`,Sl=`rdw-fav-side-slot`,Cl=228,wl=60,Tl=`rdw-fav-status`,El=`rdw-fav-search-box`,Dl=`rdw-fav-group-label`,Ol=`rdw-favorites-count`,kl=`rdw-favorites-head-actions`,Al=340,jl=Qt$2,Ml=`pages`,Nl=$t$2,Pl=250,Fl=`rdw-fav-empty`,Il=`Tags in your favorites`,Ll=`No favorites match this search`,Rl=`No favorites tagged “`,zl=`”`,Bl=`Tags match whole words. Closest tag in your favorites:`,Vl=`Tags match whole words, and no tag in your favorites has this in it.`,Hl=`Show `,Ul=`600px`,Wl=`rdw-fav-search`,Gl=`Search your favorites`,Kl=`Search favorites`,ql=`Clear search`,Jl={label:`Search syntax`,rows:[[`cat dog`,`posts with both tags`],[`( cat ~ dog )`,`posts with either tag; keep the spaces`],[`-sketch`,`posts without the tag`],[`cat*`,`tags that start with cat`],[`ca*t`,`tags like ca…t`]],note:`Favorites search uses tags only. rating:, score:, width:, height:, user: and the other metatags, and fuzzy tag~, work only in Posts search. The order is set with Sort.`,widthPx:Al},Yl=`Shuffle is on: the order in the search is not applied.`,Xl=` doesn’t work in Favorites.`,Zl=` don’t work in Favorites.`,Ql=` Favorites search uses tags only.`,$l=`:`,eu=`Reset search`,tu=`Collection`,nu=`Favorites aren’t synced yet. Search, filters and Scroll need a one-time sync (about 1.5 s per page).`,ru=`Sync favorites…`,iu=`Sync now`,au=`rdw-fav-sync-link`,ou=`-${Ue}`,su=`no AI posts`,cu=`No favorites here`,lu=`None of your favorites pass the Collection filter. Choose Any to see them all.`,uu=`Followed tags`,du=`Show all`,fu=`Show less`,pu=`-`,mu=`Type`,hu=`View`,gu=`Sort`,_u=`newest`,vu=`oldest`,yu=`shuffle`,bu=[{value:_u,label:`Newest`},{value:vu,label:`Oldest`},{value:yu,label:`Shuffle`}],xu=`Search`,Su=`Click Shuffle again for another order.`,Cu=`Finish selecting to change filters.`,wu=`Search terms`,Tu=`Click to exclude, click again to include`,Eu=12,Du=28,Ou=2,ku=`rdw-fav-side--more`,Au=`rdw-fav-side--locked`,ju=`rdw-fav-side__body`,Mu=`rdw-fav-side__head`,Nu=`rdw-fav-warning`,Pu=`rdw-fav-side__actions`,Fu=Pu,Iu=`rdw-fav-side__bar`,Lu=`rdw-fav-side__card`,Ru=`rdw-fav-side__group`,zu=`rdw-fav-side__lock`,Bu=`rdw-fav-side__hint`,Vu=`rdw-fav-followed`,Hu=`rdw-fav-followed__list`,Uu=`rdw-fav-followed__row`,Wu=`rdw-fav-followed__dot`,Gu=`rdw-fav-followed__name`,Ku=`rdw-fav-followed__count`,qu=`data-kind`,Ju=`rdw-fav-chips`,Yu=`rdw-fav-chip`;function Xu(e){return e===`newest`||e===`oldest`}var Zu=`Show more`,Qu=`en-US`,$u=`No index yet: run Full resync in RuleDesk → Favorites to search and scroll here.`,ed=`Could not remove the favorite. Try again.`,td=[{value:`all`,label:`All`},{value:uc,label:`Images`},{value:dc,label:`Videos`}],nd=[{value:Ml,label:`Pages`},{value:Nl,label:`Scroll`}],rd=`align-self: flex-start; display: grid; grid-template-rows: auto 10px;`,id=`index.php?page=post&s=view&id=`,ad=`image_thumb`,od=`Remove`,sd=`
body.${Xt$2} ${rn$2.imageList}:not(.${Zt$2}),
body.${Xt$2} #paginator {
  display: none !important;
}
body:not(.${Xt$2}) .${Zt$2},
body:not(.${Xt$2}) .${_l} {
  display: none;
}
/* The strip over the grid: the count, how the list is paged, the buttons. */
.${vl} {
  display: flex;
  flex: 1 1 auto;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.75rem;
  min-width: 0;
}
.${vl} .rdw-btn {
  font-weight: 500;
}
.${Dl} {
  font: 12px var(--rdw-font);
  color: var(--rdw-muted);
}
/* The page in two columns: the filters, and everything the site put there.
   Nothing of the site's is wrapped or moved; the block the grid is in becomes
   a grid of its own, and the column of filters is one more child of it. */
.${yl} {
  display: grid !important;
  grid-template-columns: ${String(Cl)}px minmax(0, 1fr);
  column-gap: 16px;
  row-gap: 0;
  align-items: start;
  /* The grid and the card start the same way off the header. The site and the
     skin set the padding of this block themselves: this has to win. */
  padding-top: ${String(Eu)}px !important;
}
.${yl} > * {
  grid-column: 2;
  min-width: 0;
}
/* The place of the column: the first column, every row. It takes no part in
   the sizing of the rows (a child that spans rows makes them taller by its
   own height), so its size is its place and nothing else. */
.${yl} > .${Sl} {
  grid-column: 1;
  grid-row: 1 / span ${String(wl)};
  align-self: stretch;
  contain: size;
}
/* Held beside the grid; taller than the window, it scrolls inside itself. */
.${xl} {
  box-sizing: border-box;
  position: sticky;
  top: calc(${Za$1} + ${String(Eu)}px);
  max-height: calc(100vh - ${Za$1} - 24px);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--rdw-border) transparent;
  color: var(--rdw-text);
  font: 12px/1.4 var(--rdw-font);
}
.${xl} * {
  font-family: var(--rdw-font);
}
/* A strip that fades the last lines while there is more below. Not a mask:
   the suggestions and the "?" open from inside the column. */
.${xl}.${ku}::after {
  content: "";
  position: sticky;
  bottom: 0;
  display: block;
  height: ${String(Du)}px;
  margin-top: -${String(Du)}px;
  background: linear-gradient(to bottom, transparent, var(--rdw-bg));
  pointer-events: none;
}
/* A card, as the search panel of Posts is: the filters read as one block
   and not as controls lying on the page. */
.${ju} {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: var(--rdw-surface);
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-l);
  box-shadow: var(--rdw-shadow-1);
}
/* A condition that does not work here: said in a plate, not in a grey line
   that is taken for nothing (the owner took one for a broken filter). */
.${Nu} {
  margin: 0;
  padding: 6px 8px;
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-warn-soft);
  color: var(--rdw-warn);
  font-size: 12px;
  line-height: 1.4;
  overflow-wrap: anywhere;
}
/* The rare actions are quieter than the two used all the time. */
.${ju} .${Fu} > .rdw-btn--ghost {
  color: var(--rdw-muted);
}
.${ju} .${Fu} > .rdw-btn--ghost:hover {
  color: var(--rdw-text);
}
.${Mu} {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
/* The buttons at the foot of the card, as "Reset" and "Select posts" are on Posts. */
.${ju} .${Fu} {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-top: 12px;
  border-top: 1px solid var(--rdw-border);
}
.${ju} .${Fu}:empty {
  display: none;
}
/* Each on a row of its own: the column has the room, and nothing is tucked away in a menu. */
.${ju} .${Fu} > .rdw-btn {
  flex: 1 1 100%;
  white-space: nowrap;
  font-weight: 500;
}
.${Ru} {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
/* The collection filter fills the card, as the switches above it do. */
.${Ru} > .rdw-select {
  display: flex;
}
.${Ru} > .rdw-select .rdw-select__trigger > span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.${au} {
  padding: 0;
  border: 0;
  background: none;
  color: var(--rdw-accent);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}
/* The followed among the favorites: a card of its own under the filters. */
.${Vu} {
  margin-top: 12px;
}
.${Hu} {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.${Hu} > li {
  margin: 0;
  padding: 0;
  list-style: none;
}
.${Uu} {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  min-height: 26px;
  padding: 0 6px;
  border: 1px solid transparent;
  border-radius: var(--rdw-radius-s);
  background: none;
  color: var(--rdw-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.${Uu}:hover {
  background: var(--rdw-surface-2);
}
.${Uu}[aria-pressed="true"] {
  background: var(--rdw-accent-soft);
  border-color: var(--rdw-accent);
}
.${Wu} {
  flex: none;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--rdw-tag-artist);
}
.${Uu}[${qu}="character"] .${Wu} {
  background: var(--rdw-tag-character);
}
.${Uu}[${qu}="copyright"] .${Wu} {
  background: var(--rdw-tag-copyright);
}
.${Gu} {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.${Ku} {
  flex: none;
  color: var(--rdw-muted);
  font-variant-numeric: tabular-nums;
}
.${Bu} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 11.5px;
}
.${Ju} {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.${Yu} {
  display: inline-flex;
  max-width: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
}
/* While posts are being selected the filters cannot be changed. */
.${zu} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
  margin: 0 0 8px;
  padding: 8px 10px;
  border: 1px solid var(--rdw-accent);
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-accent-soft);
  color: var(--rdw-text);
}
.${xl}.${Au} .${ju} {
  opacity: 0.45;
  pointer-events: none;
}
/* In place of the grid when nothing matches. */
.${Fl} {
  flex: 1 1 100%;
  box-sizing: border-box;
  display: grid;
  justify-items: center;
  gap: 6px;
  margin: 12px 0;
  padding: 28px 16px;
  border: 1px dashed var(--rdw-border);
  border-radius: var(--rdw-radius-l);
  color: var(--rdw-muted);
  font: 13px/1.5 var(--rdw-font);
  text-align: center;
}
.${Fl} strong {
  color: var(--rdw-text);
  font-weight: 700;
}
.${Fl} button {
  margin-top: 6px;
}
.${Tl} {
  flex: 0 0 100%;
  font: 12px var(--rdw-font);
  color: var(--rdw-muted);
}
.${Ol} {
  font: 12px var(--rdw-font);
  color: var(--rdw-muted);
  white-space: nowrap;
}
/* The buttons stand at the right end of the strip. */
.${vl} .${kl} {
  display: flex;
  align-items: center;
  gap: 0.35rem 0.5rem;
  margin-left: auto;
}
.${vl} .${kl}:empty {
  display: none;
}
.${_l} {
  display: block;
  margin: 12px auto 24px;
  padding: 6px 14px;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-surface);
  color: var(--rdw-text);
  font: 600 12px var(--rdw-font);
  cursor: pointer;
}
.${_l}[hidden] {
  display: none;
}
`.trim();function cd(e){return e===`pages`||e===Nl}function ld(){let e=Ic$1(jl);return cd(e)?e:Ml}function ud(){if(document.body.classList.contains(`rdw-fav-browsing`)){let e=document.querySelector(`.${Zt$2}`);if(e!==null)return e}return document}function dd(e){let t=String(e.id),n=document.createElement(`span`);n.setAttribute(`style`,rd);let r=document.createElement(`span`);r.className=`thumb`;let i=document.createElement(`a`);i.id=`p${t}`,i.href=`${id}${t}`;let a=document.createElement(`img`);a.src=e.thumb,a.title=e.tags,a.alt=ad,a.loading=`lazy`,i.append(a),r.append(i);let o=document.createElement(`a`);o.href=`#`,o.setAttribute(`onclick`,`document.location='index.php?page=favorites&s=delete&id=${t}&return_pid=0'; return false;`);let s=document.createElement(`b`);return s.textContent=od,o.append(s),n.append(r,document.createElement(`br`),o),n}var fd=null,pd=null;function md(e){let t=e.results.slice(e.shown,e.shown+100),n=[];for(let r of t){let t=dd(r);n.push(t),e.container.append(t);}e.shown+=t.length,e.more.hidden=e.shown>=e.results.length,t.length>0&&st$4(e.container,n);}function hd(e){let t=e.target;if(!(t instanceof Element))return;let n=t.closest(`a[onclick]`);if(!(n instanceof HTMLAnchorElement))return;let r=dn$2(n.getAttribute(`onclick`)??``);if(r===null)return;e.preventDefault(),e.stopPropagation();let i=n.parentElement;Qs(r).then(e=>{e.status===`removed`?i?.remove():pd?.();}).catch(e=>{m$2.warn(`favorites-browser: remove failed`,e),pd?.();});}var gd=new WeakSet;function _d(e){gd.has(e)||(gd.add(e),e.addEventListener(`click`,hd,true));}function vd(){if(fd!==null&&fd.container.isConnected)return fd;let e=document.querySelector(`${rn$2.imageList}:not(.${Zt$2})`);if(e===null)return null;let t=document.createElement(`div`);t.className=`image-list ${Zt$2}`,_d(t);let n=document.createElement(`button`);n.type=`button`,n.className=_l,n.textContent=Zu,n.hidden=true,e.after(t,n);let r={container:t,more:n,results:[],shown:0};return n.addEventListener(`click`,()=>{md(r);}),typeof IntersectionObserver==`function`&&new IntersectionObserver(e=>{e.some(e=>e.isIntersecting)&&md(r);},{rootMargin:Ul}).observe(n),fd=r,r}function yd(e){let t=vd();t!==null&&(t.container.replaceChildren(),t.results=e,t.shown=0,document.body.classList.add(Xt$2),md(t));}function bd(){return fd===null||!document.body.classList.contains(`rdw-fav-browsing`)?null:fd.results.map(e=>e.id)}function xd(e){let t=vd();t!==null&&(t.container.replaceChildren(e),t.results=[],t.shown=0,t.more.hidden=true,document.body.classList.add(Xt$2));}function Sd(e,t){return Ic(e,t,2**53-1)}function Cd(e){return e===null?null:{heading:e.heading,items:e.items.map((t,n)=>({key:`${t.group}:${t.insert}`,label:t.label,matchStart:t.matchStart,matchLength:t.matchLength,trailing:t.count===null?t.caption:t.count.toLocaleString(Qu),announce:t.count===null?`${t.label}, ${t.caption??``}`:`${t.label}, ${Od(t.count)}`,divider:n>0&&t.group===`inside`&&e.items[n-1]?.group!==`inside`}))}}function wd(e,t){let n=Xc(e,t)[0];if(n===void 0)return {title:Ll,note:``,offer:null};let r=Zc(t,n);return {title:`${Rl}${n}${zl}`,note:r===null?Vl:Bl,offer:r===null?null:{word:n,tag:r.tag,count:r.count}}}function Td(e,t,n){return e.trim().split(/\s+/).map(e=>e.toLowerCase()===t?n:e).join(` `)}function Ed(e,t){let n=document.createElement(`div`);n.className=Fl,n.setAttribute(`role`,`status`);let r=document.createElement(`strong`);if(r.textContent=e.title,n.append(r),e.note.length>0){let t=document.createElement(`span`);t.textContent=e.note,n.append(t);}let{offer:i}=e;if(i!==null){let e=document.createElement(`button`);e.type=`button`,e.className=`rdw-btn rdw-kit-focusable rdw-btn--secondary rdw-btn--m`,e.textContent=`${Hl}${i.tag} (${i.count.toLocaleString(Qu)})`,e.addEventListener(`click`,()=>{t(i.word,i.tag);}),n.append(e);}return n}function Dd(){document.body.classList.remove(Xt$2),fd!==null&&(fd.container.replaceChildren(),fd.results=[],fd.shown=0,fd.more.hidden=true);}function Od(e){return `${e.toLocaleString(Qu)} ${e===1?`post`:`posts`}`}function kd(e,t){return e>=t?``:`The index holds ${e.toLocaleString(Qu)} of ${t.toLocaleString(Qu)} favorites; Full resync in RuleDesk → Favorites adds the rest.`}function Ad(e){let t=[];for(let n of e){let e=n.startsWith(pu)?n.slice(1):n,r=e.indexOf($l),i=r>0?e.slice(0,r+1):e;t.includes(i)||t.push(i);}return t.length===0?``:`${t.join(`, `)}${t.length===1?Xl:Zl}${Ql}`}function jd(){return Os$1()?.finishedAt!==void 0}function Md(){let e=[...Cs$1()],t=e[Math.floor(Math.random()*e.length)];t!==void 0&&window.location.assign(`${id}${String(t)}`);}function Nd(e,t,n=``){let r=[],i=e.trim();i.length>0&&r.push(i);let a=td.find(e=>e.value===t);return t!==`all`&&a!==void 0&&r.push(a.label),n.length>0&&r.push(n),r.join(` · `)}function Pd(e={}){let[t,n]=z$2(``),[r,i]=z$2(``),[a,o]=z$2(`all`),[s,c]=z$2(()=>ld()),[l,u]=z$2(null),[d,f]=z$2(``),[p,m]=z$2(null),h=V$2(false),g=V$2(null),_$1=V$2(null),[v,y]=z$2(null),[b,x]=z$2(_u),[S,C]=z$2(`any`),[w,T]=z$2(()=>G$1(nn$2)),[ee,te]=z$2(false),[ne,re]=z$2(()=>jd());B$2(()=>{let e=()=>{re(jd());};return window.addEventListener(`hashchange`,e),()=>{window.removeEventListener(`hashchange`,e);}},[]);let ie=W(),[ae,oe]=z$2(false),{sideHost:se}=e,E=se!=null,D=E?se.closest(`.rdw-fav-side`)??se:null,ce=E&&!ne,ue=Ac(r),de=s===Nl||a!==`all`||v!==null||b!==`newest`||S!==`any`||w||!jc(ue),{onSummary:fe}=e;B$2(()=>{let e=[(S===`any`?void 0:fl(G$4().collections).find(e=>e.value===S))?.label??``,w?su:``].filter(e=>e.length>0);fe?.(Nd(r,a,e.join(` · `)));},[fe,r,a,S,w]);let pe=()=>{h.current||(h.current=true,g$1().then(e=>{u(e);}).catch(e=>{m$2.warn(`favorites-browser: index read failed`,e),u([]);}));};B$2(()=>{t.length>0&&l===null&&pe();},[t,l]),B$2(()=>{if(!E||G$4().artists.length===0)return;let e=window.setTimeout(pe,0);return ()=>{window.clearTimeout(e);}},[E]);let me=Le$2(()=>l===null?[]:Sd(l,Cs$1()),[l]),he=Le$2(()=>me.length===0?[]:ml(G$4().artists,me),[me]),ge=Le$2(()=>({label:Il,list:(e,t)=>Cd(Jc(me,qc(e,t))),pick:(e,t,n)=>{let r=qc(e,t),i=Jc(me,r)?.items[n];return r===null||i===void 0?null:Yc(e,r,i.insert)}}),[me]);B$2(()=>{if(D===null)return;let e=()=>{let e=D.scrollHeight-D.scrollTop-D.clientHeight;D.classList.toggle(ku,e>Ou);};e(),D.addEventListener(`scroll`,e,{passive:true}),window.addEventListener(`resize`,e,{passive:true});let t=typeof ResizeObserver==`function`?new ResizeObserver(e):null;return t?.observe(D),()=>{D.removeEventListener(`scroll`,e),window.removeEventListener(`resize`,e),t?.disconnect();}},[D]);let _e=e.locked===true;B$2(()=>{D?.classList.toggle(Au,_e);},[D,_e]),B$2(()=>(pd=()=>{f(ed);},()=>{pd=null;}),[]),B$2(()=>{if(!de||ce){Dd(),f(``),te(false),m(null);return}if(l===null){pe();return}let e=window.setTimeout(()=>{let e=Cs$1();if(l.length===0){Dd(),f($u),m(null);return}let t=Ac(r),o=pl(G$4().collections,S),s=w?{...t,exclude:[...t.exclude,...Ac(ou).exclude]}:t,c=Fc(l,e,s,a),u=o===null?c:c.filter(e=>o(e.id)),d=t.sort===null&&b===`oldest`?[...u].reverse():u,p=v===null?d:zc(d,v);p.length===0&&!jc(t)?xd(Ed(wd(r,me),(e,t)=>{let a=Td(r,e,t);n(a),i(a);})):p.length===0&&o!==null?xd(Ed({title:cu,note:lu,offer:null},()=>void 0)):yd(p);let h=l.filter(t=>e.has(t.id)).length;f(kd(h,e.size)),te(h<e.size),m(p.length);},Pl);return ()=>{window.clearTimeout(e);}},[de,ce,l,r,a,v,b,me,S,w]);let ve=Ad(ue.unsupported),ye=[v!==null&&ue.sort!==null?Yl:``,d].filter(e=>e.length>0),be=Cs$1().size,xe$1=p===null?be>0?Od(be):``:Od(p),{actionsRef:Se}=e;B$2(()=>(Se?.(_$1.current),()=>{Se?.(null);}),[Se]);let Ce=rl(t);Ws(Ce.filter(e=>!e.group&&!e.excluded).map(e=>e.label));let O=e=>{n(e),i(e);},we=v===null?b:yu,Te=fl(G$4().collections),Ee=Te.some(e=>e.value===S)?S:`any`,De=ae?he:he.slice(0,12),Oe=K$3(Or$1,{label:hu,options:nd,value:s,onChange:e=>{cd(e)&&(Lc$1(jl,e),c(e));}}),ke=K$3(A$2,{children:[_e&&e.onUnlock!==void 0?K$3(`div`,{className:zu,role:`status`,children:[K$3(`span`,{children:Cu}),K$3(J$3,{variant:`ghost`,size:`s`,onClick:()=>e.onUnlock?.(),children:Fe$3.cancel})]}):null,K$3(`div`,{className:ju,..._e?{inert:true}:{},children:[K$3(`div`,{className:Mu,children:[K$3(Er$1,{children:xu}),E&&!ce&&xe$1.length>0?K$3(`span`,{className:Ol,role:`status`,children:xe$1}):null]}),ce?K$3(A$2,{children:[K$3(`p`,{className:Nu,role:`status`,children:nu}),K$3(J$3,{variant:`secondary`,size:`s`,onClick:()=>{_(xe);},children:ru})]}):K$3(A$2,{children:[K$3(wr$1,{id:Wl,className:El,value:t,placeholder:Gl,"aria-label":Kl,clearLabel:ql,help:Jl,suggest:ge,onFocus:pe,onChange:n,onCommit:i}),ve.length>0?K$3(`p`,{className:Nu,role:`status`,children:ve}):null,ye.length>0?K$3(`span`,{className:Tl,role:`status`,children:[ye.join(` `),ee?K$3(A$2,{children:[` `,K$3(`button`,{type:`button`,className:`${au} rdw-kit-focusable`,onClick:()=>{_(xe);},children:iu})]}):null]}):null,Ce.length>0?K$3(`div`,{className:Ju,role:`group`,"aria-label":wu,children:Ce.map(e=>K$3(`button`,{type:`button`,className:`${Yu} rdw-kit-focusable`,title:e.group?void 0:Tu,"aria-pressed":e.group?void 0:e.excluded,onClick:n=>{let r=n.target;r instanceof Element&&r.closest(`button`)!==n.currentTarget||O(ol(t,e));},children:K$3(Nt$2,{label:e.label,variant:e.group?`group`:e.excluded?`exclude`:`dot`,kind:e.group||e.excluded?`default`:Hs(e.label),onRemove:()=>{O(al(t,e));}})},`${String(e.start)}:${e.label}`))}):null,K$3(`div`,{className:Ru,children:[K$3(Er$1,{children:mu}),K$3(Or$1,{label:mu,options:td,value:a,onChange:e=>{Oc(e)&&o(e);}})]}),K$3(`div`,{className:Ru,children:[K$3(Er$1,{children:We}),K$3(Or$1,{label:We,options:B,value:w?z:R,disabled:ie,onChange:e=>{if(ie)return;let t=e===z;K$1(nn$2,t),T(t);}}),ie?K$3(ut,{}):null]}),K$3(`div`,{className:Ru,children:[K$3(Er$1,{children:tu}),K$3(oi,{options:Te,value:Ee,onChange:C})]}),K$3(`div`,{className:Ru,children:[K$3(Er$1,{children:gu}),K$3(Or$1,{label:gu,options:bu,value:we,onChange:e=>{e===`shuffle`?(y(Date.now()),x(_u)):Xu(e)&&(y(null),x(e));}}),v===null?null:K$3(`p`,{className:Bu,children:Su})]}),E?K$3(`div`,{className:Ru,children:[K$3(Er$1,{children:hu}),Oe]}):null,t.trim().length>0||a!==`all`||S!==`any`?K$3(`div`,{children:K$3(J$3,{variant:`ghost`,size:`s`,onClick:()=>{O(``),o(`all`),C(`any`);},children:eu})}):null]}),E?K$3(`div`,{className:`${kl} ${Fu}`,ref:_$1}):null]}),E&&!ce&&he.length>0?K$3(`div`,{className:`${ju} ${Vu}`,..._e?{inert:true}:{},children:[K$3(Er$1,{children:uu}),K$3(`ul`,{className:Hu,children:De.map(e=>K$3(`li`,{children:K$3(`button`,{type:`button`,className:`${Uu} rdw-kit-focusable`,"aria-pressed":hl(t,e.tag),[qu]:e.kind,onClick:()=>{O(gl(t,e.tag));},children:[K$3(`span`,{className:Wu,"aria-hidden":`true`}),K$3(`span`,{className:Gu,children:e.tag}),K$3(`span`,{className:Ku,children:e.count.toLocaleString(Qu)})]})},e.tag))}),he.length>12?K$3(`div`,{children:K$3(J$3,{variant:`ghost`,size:`s`,onClick:()=>{oe(!ae);},children:ae?fu:`${du} (${he.length.toLocaleString(Qu)})`})}):null]}):null]});return E?K$3(A$2,{children:[K$3(`style`,{children:sd}),It$1(ke,se)]}):K$3(A$2,{children:[K$3(`style`,{children:sd}),ke,K$3(`div`,{className:vl,ref:g,children:[xe$1.length>0?K$3(`span`,{className:Ol,role:`status`,children:xe$1}):null,K$3(`span`,{className:Dl,"aria-hidden":`true`,children:hu}),Oe,K$3(`div`,{className:kl,ref:_$1})]})]})}var Fd=`rdw-collection-picker`,Id=`rdw-collection-picker-item`,Ld=`rdw-collection-picker-count`,Rd=`rdw-collection-picker-new`,zd=`rdw-collection-picker-list`,Bd=`rdw-collection-picker-check`,Vd=`rdw-collection-picker-name`,Hd=`rdw-collection-picker-empty`,Ud=`rdw-collection-picker-new-field`,Wd=`rdw-collection-picker-error`,Gd={create:`Create`,newName:`New collection name`,filter:`Filter collections…`,empty:`No collections yet`,noMatch:`No matching collections`,togglePrefix:`Toggle collection`,nameTaken:`A collection with this name already exists.`,list:`Custom collections`},Kd=`menuitemcheckbox`,qd=12,Jd=15,Yd=8,Xd=6,Zd=`
.${Fd} {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${String(Xd)}px;
  min-width: 0;
  color: var(--rdw-text);
  font: 12px/1.35 var(--rdw-font);
}
.${zd} {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 2px;
  max-height: 232px;
  overflow-x: hidden;
  overflow-y: auto;
}
button.${Id} {
  display: flex;
  align-items: center;
  gap: ${String(Yd)}px;
  box-sizing: border-box;
  width: 100%;
  min-height: 28px;
  margin: 0;
  padding: 0 6px;
  border: 0;
  border-radius: var(--rdw-radius-s);
  background: transparent;
  color: var(--rdw-text);
  font: inherit;
  font-weight: 400;
  text-align: left;
  cursor: pointer;
}
button.${Id}:hover,
button.${Id}:focus-visible {
  background: var(--rdw-surface-2);
}
button.${Id}:focus-visible {
  outline: 2px solid var(--rdw-accent);
  outline-offset: -2px;
}
.${Bd} {
  flex: 0 0 ${String(Jd)}px;
  display: inline-grid;
  place-items: center;
  box-sizing: border-box;
  width: ${String(Jd)}px;
  height: ${String(Jd)}px;
  border: 1px solid var(--rdw-border);
  border-radius: 4px;
  background: transparent;
  color: var(--rdw-surface);
}
.${Id}[aria-checked="true"] .${Bd} {
  background: var(--rdw-accent);
  border-color: var(--rdw-accent);
}
.${Vd} {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.${Ld} {
  flex: 0 0 auto;
  color: var(--rdw-muted);
  font-variant-numeric: tabular-nums;
}
.${Hd} {
  margin: 0;
  padding: 4px 6px;
  color: var(--rdw-muted);
}
form.${Rd} {
  display: flex;
  align-items: center;
  gap: ${String(Xd)}px;
  margin: 0;
  padding-top: ${String(Xd)}px;
  border-top: 1px solid var(--rdw-border);
}
.${Wd} {
  margin: 0;
  color: var(--rdw-danger);
}
.${Rd} .${Ud} {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
}
`.trim();function Qd(e){return e.trim().toLowerCase()}function $d(e,t){let n=Qd(t);return n.length===0||e.name.toLowerCase().includes(n)}function ef(e,t,n){let r=n();r===null?lc$1(e,t):lc$1(e,t,r);}function tf(e){let[t,n]=z$2(``),[r,i]=z$2(``),[a,o]=z$2(``),[,s]=z$2(0),c=Zs$1(),l=new Set(Qs$1(e.postId).map(e=>e.id)),u=c.length>8,d=u?c.filter(e=>$d(e,t)):c,f=()=>{s(e=>e+1),e.onChange?.();},p=t=>{l.has(t)?fc$1(t,e.postId):ef(t,e.postId,e.readThumbUrl),f();},m=()=>{let t=r.trim();t.length!==0&&(G$4().collections.some(e=>Qd(e.name)===Qd(t))?o(Gd.nameTaken):(ef(Xs$1(t).id,e.postId,e.readThumbUrl),i(``),f()));},h=c.length===0?Gd.empty:Gd.noMatch;return K$3(`div`,{className:Fd,children:[K$3(`style`,{children:Zd}),u?K$3(qt$1,{value:t,onChange:n,placeholder:Gd.filter,"aria-label":Gd.filter}):null,d.length===0?K$3(`p`,{className:Hd,children:h}):K$3(`div`,{className:zd,role:`group`,"aria-label":Gd.list,children:d.map(e=>K$3(`button`,{type:`button`,className:Id,role:Kd,"aria-checked":l.has(e.id),"aria-label":`${Gd.togglePrefix} ${e.name}`,onClick:t=>{t.preventDefault(),t.stopPropagation(),p(e.id);},children:[K$3(`span`,{className:Bd,"aria-hidden":`true`,children:l.has(e.id)?K$3(pt$2,{size:qd}):null}),K$3(`span`,{className:Vd,children:e.name}),K$3(`span`,{className:Ld,children:String(e.postIds?.length??0)})]},e.id))}),K$3(`form`,{className:Rd,onSubmit:e=>{e.preventDefault(),e.stopPropagation(),m();},children:[K$3(qt$1,{className:Ud,value:r,onChange:e=>{i(e),o(``);},placeholder:Gd.newName,"aria-label":Gd.newName}),K$3(J$3,{type:`submit`,variant:`primary`,size:`s`,disabled:r.trim().length===0,children:Gd.create})]}),a.length>0?K$3(`p`,{className:Wd,role:`alert`,children:a}):null]})}var nf=`img#image`,rf=`video#gelcomVideoPlayer`,af=`source`,of=`a[href*='tags=']`,sf=` `;function cf(e,t,n,r){let i=Number(e);return !Number.isInteger(i)||i<=0||t.length===0?null:{id:i,tags:t.join(sf),thumb:n!==null&&ut$4(n)?n:``,run:r,pos:0,cut:false}}function lf(e){e!==null&&_$1([e]);}function uf(e,t){let n=t.closest(rn$2.thumb);if(n===null)return;let r=n.querySelector(rn$2.previewImage),i=r instanceof HTMLImageElement?r.currentSrc||r.src:null;lf(cf(e,Ct(n),i,Date.now()));}function df(e=document){let t=[];for(let n of e.querySelectorAll(rn$2.tagSidebarRow)){let e=n.querySelectorAll(of),r=e[e.length-1]?.getAttribute(`href`);if(r==null)continue;let i=null;try{i=new URL(r,window.location.href).searchParams.get(le$1);}catch{i=null;}i!==null&&i.trim().length>0&&t.push(i.trim().toLowerCase());}return t}function ff(){let e=document.querySelector(nf);if(e instanceof HTMLImageElement&&e.src.length>0)return e.src;let t=document.querySelector(rf);if(!(t instanceof HTMLVideoElement))return null;let n=t.querySelector(af),r=t.currentSrc||t.src||(n instanceof HTMLSourceElement?n.src:``);return r.length>0?r:null}function pf(e){let t=ff(),n=t===null?null:Dt$3(t,Number(e));lf(cf(e,df(),n,Date.now()));}var mf=`rdw-icon-btn`;function hf(e,t){return `${t?Fe$3.cardFavRemoveLabel:Fe$3.cardFavAddLabel} ${e}`}function gf(e,t,n,r){t===`pending`?(e.disabled=true,e.classList.add(Ie$3.cardFavPending)):(e.classList.remove(Ie$3.cardFavMarked,Ie$3.cardFavError,Ie$3.cardFavPending),e.disabled=false,e.removeAttribute(`title`),t===`marked`?(e.setAttribute(`aria-pressed`,`true`),e.setAttribute(`aria-label`,hf(n,true)),e.classList.add(Ie$3.cardFavMarked)):t===`marked_error`?(e.setAttribute(`aria-pressed`,`true`),e.setAttribute(`aria-label`,hf(n,true)),e.classList.add(Ie$3.cardFavMarked,Ie$3.cardFavError),e.title=r??Fe$3.cardFavErrorRequest):t===`error`?(e.setAttribute(`aria-pressed`,`false`),e.setAttribute(`aria-label`,hf(n,false)),e.classList.add(Ie$3.cardFavError),e.title=r??Fe$3.cardFavErrorRequest):(e.setAttribute(`aria-pressed`,`false`),e.setAttribute(`aria-label`,hf(n,false))));}function _f(e,t,n=Ie$3.cardFav){let r=document.createElement(`button`);return r.type=`button`,r.className=n,r.textContent=Fe$3.cardFavGlyph,gf(r,t?`marked`:`idle`,e),r.addEventListener(`click`,t=>{t.preventDefault(),t.stopPropagation(),vf(r,e);}),r}async function vf(e,t){if(e.disabled)return;let n=e.getAttribute(`aria-pressed`)===`true`;if(gf(e,`pending`,t),n){let n=await Qs(t);if(n.status===`removed`){Es$1(t),gf(e,`idle`,t);return}gf(e,`marked_error`,t,Fe$3.cardFavErrorRequest),m$2.warn(`Remove favorite failed`,t,n);return}let r=await Xs(t);r.status===`added`||r.status===`already`?(Ts$1(t),uf(t,e),gf(e,`marked`,t)):r.status===`not_logged_in`?(gf(e,`error`,t,Fe$3.cardFavErrorNotLoggedIn),m$2.warn(`Favorite requires login`,t)):(gf(e,`error`,t,Fe$3.cardFavErrorRequest),m$2.warn(`Favorite failed`,t,r));}var yf=`playlist-menu`,bf=`Add to collection button`,xf=[`list`,`post`,`favorites`],K=`rdw-playlist-add`,Sf=`rdw-playlist-add--in`,Cf=`rdw-playlist-menu`,wf=`rdw-playlist-menu--popup`,Tf=`data-rdw-post-id`,Ef=`+`,Df=`Add to collection`,Of=2147483645,kf=260,Af=8,jf=4,Mf=28,Nf=6,Pf=38,Ff=`div.image-list > span > span.thumb`,If=`rdw-f-favorites-bulk-selecting`,Lf=`2px solid var(--rdw-accent)`,Rf=`2px`,zf=`keydown`,Bf=`pointerdown`,Vf=`Escape`,Hf=`body.${Kt$2(yf)}`,Uf=`
${Hf} .${K} {
  position: absolute;
  top: ${String(Pf)}px;
  right: ${String(Nf)}px;
  position-anchor: --rdw-img;
  top: calc(anchor(top) + ${String(Pf)}px);
  right: calc(anchor(right) + ${String(Nf)}px);
  z-index: 5;
  box-sizing: border-box;
  display: inline-grid;
  place-items: center;
  min-width: ${String(Mf)}px;
  min-height: ${String(Mf)}px;
  width: ${String(Mf)}px;
  height: ${String(Mf)}px;
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
${Hf} ${Ff} > .${K} {
  position-anchor: ${Ut$2};
}
${Hf}.${If} ${Ff} > .${K} {
  display: none;
}
${Hf} .${Bt$2}:hover .${K},
${Hf} .${K}:focus-visible {
  opacity: 0.65;
}
${Hf} .${Bt$2} .${K}:hover,
${Hf} .${K}:focus-visible {
  opacity: 1;
}
${Hf} .${K}:focus-visible {
  outline: ${Lf};
  outline-offset: ${Rf};
}
${Hf} .${K}.${Sf} {
  background: #ffd75e;
  border-color: #c79a00;
  color: #5c4500;
}
${Hf} .${Cf} {
  box-sizing: border-box;
  width: ${String(kf)}px;
  max-width: calc(100vw - 8px);
  padding: ${String(Af)}px;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-l);
  background: var(--rdw-surface);
  color: var(--rdw-text);
  font: 12px/1.35 var(--rdw-font);
}
${Hf} .${Cf}.${wf} {
  position: fixed;
  z-index: ${String(Of)};
  box-shadow: var(--rdw-shadow-2);
}
`,Wf=()=>null,Gf,Kf=null,qf=false,Jf=false;function Yf(e){if(e===null||e.length===0)return null;let t=Number(e);if(!Number.isFinite(t))return null;let n=Math.trunc(t);return n<0?null:n}function Xf(e){return Qs$1(e).length>0}function Zf(e,t){let n=Xf(t);e.classList.toggle(Sf,n),e.setAttribute(`aria-pressed`,n?`true`:`false`),e.setAttribute(`aria-label`,`${Df} ${String(t)}`);}function Qf(e){return `#p${e}`}function $f(e){let t=e.currentSrc.trim();if(t.length>0)return t;let n=e.getAttribute(`src`);if(n===null)return null;let r=n.trim();return r.length===0?null:r}function ep(e,t){let n=e.querySelector(Qf(t)),r=e.querySelectorAll(rn$2.previewImage),i=null;for(let e of r){if(!(e instanceof HTMLImageElement))continue;if(n instanceof Element&&n.contains(e)){i===null&&(i=e);continue}let t=$f(e);if(t!==null)return t}if(i!==null)return $f(i);let a=e.querySelector(Ot$3);return a instanceof HTMLImageElement?$f(a):null}function tp(e){let t=e.getAttribute(Tf);if(t===null||t.length===0)return null;let n=e.closest(rn$2.thumb);return n instanceof HTMLElement?ep(n,t):null}function np(e,t){let n=e.querySelector(Qf(t));if(n instanceof HTMLAnchorElement)return n;let r=e.querySelector(rn$2.thumbLink);return r instanceof HTMLAnchorElement?r:null}function rp(){Kf!==null&&(ve$1(null,Kf.menu),Kf.menu.remove(),Kf.trigger.setAttribute(`aria-expanded`,`false`),Kf=null,sp());}function ip(e){e.key===Vf&&Kf!==null&&(e.preventDefault(),rp());}function ap(e){if(Kf===null)return;let t=e.target;t instanceof Node&&(Kf.menu.contains(t)||Kf.trigger.contains(t)||rp());}function op(){qf||(qf=true,document.addEventListener(zf,ip)),Jf||(Jf=true,document.addEventListener(Bf,ap,true));}function sp(){qf&&=(document.removeEventListener(zf,ip),false),Jf&&=(document.removeEventListener(Bf,ap,true),false);}function cp(e,t){let n=t.getBoundingClientRect(),r=window.innerWidth,i=window.innerHeight;e.style.visibility=`hidden`,e.style.left=`0`,e.style.top=`0`,document.body.append(e);let a=e.offsetWidth,o=e.offsetHeight,s=n.right-a;s<jf&&(s=Math.min(n.left,r-a-jf)),s=Math.max(jf,Math.min(s,r-a-jf));let c=n.bottom+jf;c+o>i-jf&&(c=n.top-o-jf),c<jf&&(c=jf),e.style.left=`${String(s)}px`,e.style.top=`${String(c)}px`,e.style.visibility=``;}function lp(e){let t=document.querySelectorAll(`button.${K}[${Tf}="${String(e)}"]`);for(let n of t)n instanceof HTMLButtonElement&&Zf(n,e);}function up(){for(let e of document.querySelectorAll(`button.${K}[${Tf}]`)){let t=Number(e.getAttribute(Tf));e instanceof HTMLButtonElement&&Number.isFinite(t)&&Zf(e,t);}}function dp(e,t){let n=document.createElement(`div`);n.className=Cf,n.setAttribute(`role`,`menu`),n.setAttribute(Tf,String(e));let r=t?.onChange;return ve$1(ee(tf,{postId:e,readThumbUrl:t?.readThumbUrl??Wf,...r===void 0?{}:{onChange:r}}),n),n}function fp(e,t){if(Kf!==null&&Kf.trigger===e){rp();return}rp();let n=dp(t,{onChange:()=>{lp(t);},readThumbUrl:()=>tp(e)});n.classList.add(wf),cp(n,e),e.setAttribute(`aria-expanded`,`true`),Kf={menu:n,trigger:e,postId:t},op();}function pp(e,t){if(e.querySelector(`button.${K}`)!==null)return;let n=Yf(t);if(n===null)return;let r=np(e,t);if(r===null)return;Tt$3(e);let i=document.createElement(`button`);i.type=`button`,i.className=`${mf} ${K}`,i.textContent=Ef,i.setAttribute(Tf,String(n)),i.setAttribute(`aria-haspopup`,`menu`),i.setAttribute(`aria-expanded`,`false`),Zf(i,n),i.addEventListener(`click`,e=>{e.preventDefault(),e.stopPropagation(),fp(i,n);}),r.after(i);}function mp(e=document){let t=e.querySelectorAll(rn$2.thumb);for(let e of t){if(!(e instanceof HTMLElement))continue;let t=cn$2(e)??ln$2(e);t!==null&&pp(e,t);}}function hp(){Gf===void 0&&(Gf=ot$4(e=>{mp(e);}));}function gp(e){(e.pageKind===`list`||e.pageKind===`favorites`)&&(mp(document),hp());}var _p={id:yf,label:bf,settingsCaption:`A “+” on each thumbnail and on the post page: it opens the list of custom collections.`,pages:[...xf],defaultEnabled:true,css:Uf,mount:gp},vp=`rdw-bulk-collection`,yp=`rdw-bulk-collection-list`,bp=`rdw-bulk-collection-item`,xp=`rdw-bulk-collection-name`,Sp=`rdw-bulk-collection-count`,Cp=`rdw-bulk-collection-new`,wp=`rdw-bulk-collection-new-field`,Tp=`rdw-bulk-collection-title`,Ep=`rdw-bulk-collection-note`,Dp=`rdw-bulk-collection-error`,Op=`rdw-bulk-collection-foot`,kp=260,Ap=8,jp=`en-US`,Mp={aria:`Add posts to a collection`,filter:`Filter collections…`,empty:`No custom collections yet. Name one below.`,noMatch:`No matching collections`,newName:`New collection name`,create:`Create and add`,nameTaken:`A collection with this name already exists.`},Np=`
.${vp} {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
  color: var(--rdw-text);
  font: 13px/1.4 var(--rdw-font);
}
.${Tp} {
  margin: 0;
  font: 700 15px var(--rdw-font);
  color: var(--rdw-text);
}
.${Ep} {
  margin: 0;
  color: var(--rdw-muted);
}
.${yp} {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 2px;
  max-height: ${String(kp)}px;
  overflow-x: hidden;
  overflow-y: auto;
}
button.${bp} {
  display: flex;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  width: 100%;
  min-height: 32px;
  margin: 0;
  padding: 0 8px;
  border: 0;
  border-radius: var(--rdw-radius-s);
  background: transparent;
  color: var(--rdw-text);
  font: inherit;
  font-weight: 400;
  text-align: left;
  cursor: pointer;
}
button.${bp}:hover,
button.${bp}:focus-visible {
  background: var(--rdw-surface-2);
}
button.${bp}:focus-visible {
  outline: 2px solid var(--rdw-accent);
  outline-offset: -2px;
}
.${xp} {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.${Sp} {
  flex: none;
  color: var(--rdw-muted);
  font-variant-numeric: tabular-nums;
}
form.${Cp} {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding-top: 10px;
  border-top: 1px solid var(--rdw-border);
}
.${Cp} .${wp} {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
}
.${Dp} {
  margin: 0;
  color: var(--rdw-danger);
}
.${Op} {
  display: flex;
  justify-content: flex-end;
}
`.trim();function Pp(e){return e.trim().toLowerCase()}function Fp(e){return `${e.toLocaleString(jp)} ${e===1?`post`:`posts`}`}function Ip(e){return `Add ${Fp(e)} to a collection`}function Lp(e){return e.added===e.total?`Added ${Fp(e.total)} to “${e.name}”.`:e.added===0?`All ${Fp(e.total)} were already in “${e.name}”.`:`Added ${e.added.toLocaleString(jp)} of ${Fp(e.total)} to “${e.name}”; the rest were already there.`}function Rp(e){let[t,n]=z$2(``),[r,i]=z$2(``),[a,o]=z$2(``),s=e.open?Zs$1():[],c=s.length>Ap,l=Pp(t),u=c&&l.length>0?s.filter(e=>e.name.toLowerCase().includes(l)):s,d=()=>{n(``),i(``),o(``),e.onClose();},f=t=>{let n=uc$1(t,e.posts);if(n===null)return;let r={name:n.collection.name,added:n.added,total:e.posts.length};d(),e.onDone(r);},p=()=>{let e=r.trim();e.length!==0&&(G$4().collections.some(t=>Pp(t.name)===Pp(e))?o(Mp.nameTaken):f(Xs$1(e).id));};return K$3(Sn$1,{open:e.open,onClose:d,"aria-label":Mp.aria,className:vp,children:[K$3(`style`,{children:Np}),K$3(`h3`,{className:Tp,children:Ip(e.posts.length)}),c?K$3(qt$1,{value:t,onChange:n,placeholder:Mp.filter,"aria-label":Mp.filter}):null,u.length===0?K$3(`p`,{className:Ep,children:s.length===0?Mp.empty:Mp.noMatch}):K$3(`div`,{className:yp,children:u.map(e=>K$3(`button`,{type:`button`,className:bp,onClick:()=>{f(e.id);},children:[K$3(`span`,{className:xp,children:e.name}),K$3(`span`,{className:Sp,children:String(e.postIds?.length??0)})]},e.id))}),K$3(`form`,{className:Cp,onSubmit:e=>{e.preventDefault(),e.stopPropagation(),p();},children:[K$3(qt$1,{className:wp,value:r,onChange:e=>{i(e),o(``);},placeholder:Mp.newName,"aria-label":Mp.newName}),K$3(J$3,{type:`submit`,variant:`primary`,size:`s`,disabled:r.trim().length===0,children:Mp.create})]}),a.length>0?K$3(`p`,{className:Dp,role:`alert`,children:a}):null,K$3(`div`,{className:Op,children:K$3(J$3,{variant:`secondary`,size:`s`,onClick:d,children:Fe$3.cancel})})]})}var zp=false,Bp=`p`;function Vp(e){let t=e.querySelectorAll(rn$2.favoritesDeleteLink);for(let e of t){if(!(e instanceof HTMLAnchorElement))continue;let t=e.getAttribute(`onclick`);if(t===null)continue;let n=dn$2(t);if(n!==null)return n}let n=cn$2(e);if(n!==null)return n;let r=e.querySelectorAll(`a[id^="${Bp}"]`);for(let e of r){if(!(e instanceof HTMLAnchorElement))continue;let t=e.id;if(!t.startsWith(Bp))continue;let n=t.slice(1);if(/^\d+$/.test(n))return n}return null}function Hp(e=document){let t=[],n=new Set,r=e.querySelectorAll(rn$2.thumb);for(let e of r){if(!(e instanceof HTMLElement))continue;let r=Vp(e);r===null||n.has(r)||(n.add(r),t.push({thumb:e,postId:r}));}return t}var Up=new Set([`BR`,`HR`,`WBR`]),Wp=/^[|\u00b7•·,\s]*$/;function Gp(e,t){if(e.nodeType===Node.TEXT_NODE){let t=e.textContent??``;return Wp.test(t)}if(!(e instanceof HTMLElement))return  false;if(Up.has(e.tagName))return  true;if(!(e instanceof HTMLAnchorElement))return  false;let n=e.getAttribute(`onclick`);if(n===null)return  false;let r=dn$2(n);return r===null?false:t===null||r===t}function Kp(e){let t=Vp(e),n=[e],r=e.nextSibling;for(;r!==null&&!(r instanceof HTMLElement&&r.matches(rn$2.thumb)||!Gp(r,t));)n.push(r),r=r.nextSibling;for(let e of n)e.remove();}function qp(e){let t=[],n=new Set,r=e.querySelectorAll(rn$2.favoritesDeleteLink);for(let e of r){if(!(e instanceof HTMLAnchorElement))continue;let r=e.getAttribute(`onclick`);if(r===null)continue;let i=dn$2(r);i===null||n.has(i)||(n.add(i),t.push(i));}return t}function Jp(){zp||(zp=true,document.addEventListener(`click`,e=>{let t=e.target;if(!(t instanceof Element))return;let n=t.closest(`a`);if(!(n instanceof HTMLAnchorElement))return;let r=n.getAttribute(`onclick`);if(r===null)return;let i=dn$2(r);i!==null&&Es$1(i);},true));}function Yp(e=document,t=window.location.search){if(P$3(t)!==`favorites`)return;let n=qp(e),i=[];for(let e of n){let t=Number(e);Number.isFinite(t)&&i.push(Math.trunc(t));}Ds$1(i),Jp();}var Xp=`keydown`,Zp=`Escape`,Qp=`true`,$p=`input, textarea, select, [role="dialog"], [role="listbox"], [role="menu"]`;function em(e){if(e.defaultPrevented)return  true;let t=e.composedPath()[0];return t instanceof Element?t.closest($p)!==null||t.getAttribute(`aria-expanded`)===Qp:false}function tm(e,t){let n=V$2(t);n.current=t,B$2(()=>{if(!e)return;let t=e=>{e.key!==Zp||em(e)||n.current();};return document.addEventListener(Xp,t),()=>{document.removeEventListener(Xp,t);}},[e]);}var nm=`favorites-bulk`,rm=`Bulk remove favorites`,im=[`favorites`],am=`rdw-favorites-bulk`,om=`rdw-favorites-bulk`,sm=`rdw-favorites-pin`,cm=`rdw-favorites-pin`,lm=`rdw-favorites-filters`,um=`rdw-favorites-bulk-summary`,dm=`rdw-favorites-menu`,fm=`rdw-favorites-menu-item`,pm=`rdw-favorites-download`,mm=`rdw-favorites-download-title`,hm=`rdw-favorites-download-note`,gm=`rdw-favorites-download-stale`,_m=`rdw-favorites-link`,vm=200,ym=12,bm=`rdw-favorites-bulk-bar`,xm=`rdw-favorites-bulk-status`,Sm=`rdw-favorites-bulk-confirm`,Cm=`rdw-favorites-bulk-confirm-row`,wm=`rdw-favorites-bulk-progress`,Tm=`rdw-favorites-title`,Em=`Favorites`,Dm=`en-US`,Om=6,km=`rdw-fav-bulk-selected`,Am=`rdw-fav-bulk-check`,jm=`Select`,Mm=`Select page`,Nm=`Select loaded`,Pm=`Add to collection`,Fm=`Random post`,Im=`Open a random favorite`,Lm=`More actions`,Rm=`Download all…`,zm=`Sync favorites…`,Bm=`Sync first`,Vm=`Download all favorites?`,Hm=`Download results…`,Um=`Download the results?`,Wm=`Download the results`,Gm=`Download`,Km=`Download all favorites`,qm=`Selected`,Jm=864e5,Ym=`Favorites`,Xm=Fe$3.cancel,Zm=`Stop`,Qm=`Dismiss`,$m=`Remove from favorites…`,eh=`Download selected`,th=`Favorites (selected)`,nh=`rdw-favorites-bulk-select`,rh=`Remove `,ih=` favorite`,ah=` favorites`,oh=`? This cannot be undone on the site.`,sh=`Confirm bulk remove favorites`,ch=` of `,lh=`Deleted `,uh=` of `,dh=`. Failed on post `,fh=`.`,ph=`Stopped after `,mh=` of `,hh=`.`,gh=`✓`,_h=`#4c8bf5`,vh=`#ffffff`,yh=`2px`,bh=`2px`,xh=`1.25rem`,Sh=`0.25rem`,Ch=2,wh=`0.75rem`,q=Kt$2(nm),Th=`${q}-selecting`,Eh=`
/* While posts are being selected a thumbnail does not lift under the pointer:
   lifted, it stands out of the frame of a selected post. */
body.${Th} span.thumb:hover img {
  transform: none !important;
}
body.${q} .${om},
body.${q} .${cm} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  margin: 0;
  flex: 0 0 100%;
  grid-column: 1 / -1;
}
/* Beside the column of filters both stand in the second column of the block. */
body.${q} .${yl} > .${om},
body.${q} .${yl} > .${cm} {
  grid-column: 2;
  width: auto;
}
/* The selection bar in the column, over the card of filters. */
body.${q} .${Iu} .${bm} {
  margin-bottom: 8px;
  padding: 10px;
  border: 1px solid var(--rdw-accent);
  border-radius: var(--rdw-radius-l);
  background: var(--rdw-accent-soft);
  color: var(--rdw-text);
}
body.${q} .${Iu} .${bm} > .rdw-btn {
  flex: 1 1 auto;
  white-space: nowrap;
}
/* Holds only the page's heading, which is for screen readers: the menu
   already shows where you are. */
body.${q} .${om} {
  position: relative;
  height: 0;
}
/* The space under the header is the row's own padding, so that the row has
   the same space above it as below it, held or not. */
body.${q} div#header {
  margin-bottom: 0 !important;
}
/* The row of search, filters and buttons (or of the selection) stays at the top. */
body.${q} .${cm} {
  gap: 0.35rem 0.5rem;
  padding: ${String(ym)}px 0;
  position: sticky;
  top: ${Za$1};
  z-index: ${String(Om)};
  background: var(--rdw-bg);
}
body.${q} .${lm} {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  flex: 1 1 auto;
  min-width: 0;
}
body.${q} .${lm}[hidden] {
  display: none;
}
body.${q} .${Tm} {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
body.${q} .${om} .rdw-btn,
body.${q} .${cm} .rdw-btn {
  font-weight: 500;
}
/* The strip turned into the selection: filled, so that it is seen without
   reading it that a click on a thumbnail now selects (the designer, 17.11.2026). */
body.${q} .${cm} .${bm} {
  flex: 1 1 auto;
  padding: 4px 8px;
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-accent-soft);
  color: var(--rdw-text);
}
body.${q} .${um} {
  flex: 1 1 8rem;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font: 12px var(--rdw-font);
  color: var(--rdw-muted);
}
.${dm} {
  padding: 6px;
  gap: 2px;
}
.${fm} {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 30px;
  padding: 0 8px;
  border: 0;
  border-radius: var(--rdw-radius-s);
  background: transparent;
  color: var(--rdw-text);
  font: 13px var(--rdw-font);
  text-align: left;
  cursor: pointer;
}
.${fm}:hover,
.${fm}:focus-visible {
  background: var(--rdw-surface-2);
}
.${pm} {
  display: grid;
  gap: 0.5rem;
}
.${mm} {
  margin: 0;
  font: 700 15px var(--rdw-font);
  color: var(--rdw-text);
}
.${hm},
.${gm} {
  margin: 0;
  font: 13px/1.4 var(--rdw-font);
  color: var(--rdw-muted);
}
.${gm} {
  color: var(--rdw-text);
}
.${_m} {
  padding: 0;
  border: 0;
  background: none;
  color: var(--rdw-accent);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}
.${pm} .${Cm} {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.35rem 0.5rem;
  margin-top: 0.25rem;
}
body.${q} .${nh} {
  display: grid;
  gap: 6px;
  flex: 1 1 auto;
  min-width: 0;
}
body.${q} .${Iu} .${nh} {
  margin-bottom: 8px;
}
body.${q} .${bm} {
  display: flex;
  flex: 0 1 auto;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.5rem;
  box-sizing: border-box;
}
body.${q} .${xm} {
  flex: 0 1 auto;
  min-width: 0;
  font: inherit;
  font-size: 0.875rem;
  line-height: 1.3;
}
body.${q} .${Sm} {
  display: grid;
  gap: 0.75rem;
}
body.${q} .${Cm} {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.5rem;
}
body.${q} .${wm} {
  flex: 1 1 12rem;
  min-width: 8rem;
  max-width: 24rem;
}
body.${q} span.thumb {
  position: relative;
}
body.${q} span.thumb.${km} {
  outline: ${yh} solid var(--rdw-accent, ${_h});
  outline-offset: ${bh};
}
body.${q} span.thumb > .${Am} {
  position: absolute;
  top: ${Sh};
  left: ${Sh};
  z-index: ${String(Ch)};
  display: none;
  align-items: center;
  justify-content: center;
  width: ${xh};
  height: ${xh};
  border-radius: 999px;
  background: var(--rdw-accent, ${_h});
  color: var(--rdw-surface, ${vh});
  font-size: ${wh};
  font-weight: 700;
  line-height: 1;
  pointer-events: none;
}
body.${q} span.thumb.${km} > .${Am} {
  display: inline-flex;
}
`.trim();function Dh(e){return `${rh}${String(e)}${e===1?ih:ah}${oh}`}function Oh(e,t){return `${String(e)}${ch}${String(t)}`}function kh(e,t,n){return `${lh}${String(e)}${uh}${String(t)}${dh}${n}${fh}`}function Ah(e,t){return `${ph}${String(e)}${mh}${String(t)}${hh}`}function jh(e){return e instanceof DOMException&&e.name===`AbortError`||e instanceof Error&&e.name===`AbortError`}function Mh(e,t){return new Promise((n,r)=>{if(t.aborted){r(new DOMException(`Aborted`,`AbortError`));return}let i=setTimeout(()=>{t.removeEventListener(`abort`,a),t.aborted?r(new DOMException(`Aborted`,`AbortError`)):n();},e),a=()=>{clearTimeout(i),r(new DOMException(`Aborted`,`AbortError`));};t.addEventListener(`abort`,a,{once:true});})}function Nh(e){if(e.querySelector(`:scope > .rdw-fav-bulk-check`)!==null)return;let t=document.createElement(`span`);t.className=Am,t.setAttribute(`role`,`img`),t.setAttribute(`aria-label`,qm),t.textContent=gh;let n=e.querySelector(`a[id^="p"]`);n instanceof HTMLAnchorElement&&n.parentElement===e?n.after(t):e.prepend(t);}function Ph(e=document){let t=e.querySelectorAll(`${rn$2.thumb}.${km}`);for(let e of t)e.classList.remove(km);let n=e.querySelectorAll(`${rn$2.thumb} > .${Am}`);for(let e of n)e.remove();}function Fh(e,t){for(let n of e){let e=t.has(n.postId);if(n.thumb.classList.toggle(km,e),e)Nh(n.thumb);else {let e=n.thumb.querySelector(`:scope > .${Am}`);e!==null&&e.remove();}}}function Ih(){let e=document.querySelector(rn$2.imageList);if(e!==null&&e.parentNode!==null)return {parent:e.parentNode,before:e};let t=document.querySelector(rn$2.thumb);if(t!==null){let e=t.parentElement;if(e!==null&&e.parentNode!==null)return e!==document.body&&e!==document.documentElement?{parent:e.parentNode,before:e}:{parent:e,before:t}}let n=document.querySelector(`#paginator`);return n!==null&&n.parentNode!==null?{parent:n.parentNode,before:n}:{parent:document.body,before:document.body.firstChild}}function Lh(e=null){let t=e===null?[...Cs$1()].sort((e,t)=>t-e):[...e];t.length===0||en()||tn(Ym,{kind:`ids`,ids:t});}function Rh(e){let t=Hp(ud()).find(t=>t.postId===e);if(t!==void 0){Kp(t.thumb);return}let n=document.getElementById(`s${e}`);n instanceof HTMLElement&&Kp(n);}function zh(e,t){let n=e===void 0?NaN:Date.parse(e);if(!Number.isFinite(n))return {text:`Never synced.`,stale:true};let r=Math.max(0,Math.floor((t-n)/Jm)),i=r>7;return r===0?{text:`Synced today.`,stale:i}:{text:`Synced ${String(r)} ${r===1?`day`:`days`} ago.`,stale:i}}function Bh(e){let t=e===1?`original file`:`original files`;return `${e.toLocaleString(Dm)} ${t}: every favorite in the local list, not only this page.`}function Vh(e,t){let n=e===1?`original file`:`original files`;return `${e.toLocaleString(Dm)} ${n}: favorites matching ${t}, from all pages.`}function Hh(){Ce(xe),window.location.hash=Je$3;}function Uh(e){let[t,n]=z$2(false),[r,i]=z$2(false),a=V$2(null),[o,s]=z$2(null),c=e.summary.length>0,l=Cs$1().size,u=c&&o!==null?o.length:l,d=c?Hm:Rm,f=()=>{s(c?bd():null),i(true);},p=zh(Os$1()?.finishedAt,Date.now()),m=jd(),h=()=>{n(false);},g=()=>{i(false);};return K$3(A$2,{children:[m||!e.stacked?K$3(J$3,{variant:`secondary`,size:`s`,title:Im,onClick:Md,children:[K$3(Dt$2,{size:14}),Fm]}):null,K$3(J$3,{variant:`secondary`,size:`s`,onClick:e.onSelect,children:jm}),e.stacked&&!m?null:e.stacked?K$3(A$2,{children:[Ze$1()?K$3(J$3,{variant:`ghost`,size:`s`,disabled:l===0,onClick:f,children:[K$3(At$2,{size:14}),d]}):null,K$3(J$3,{variant:`ghost`,size:`s`,onClick:Hh,children:[K$3(jt$2,{size:14}),zm]})]}):K$3(En$1,{label:Lm,menuOpen:t,buttonRef:a,onClick:()=>{n(!t);},children:K$3(Ot$2,{size:16})}),K$3(Bn$1,{open:t&&!e.stacked,onClose:h,anchorRef:a,widthPx:vm,alignEnd:true,role:`menu`,"aria-label":Lm,className:dm,children:[Ze$1()?K$3(`button`,{type:`button`,role:`menuitem`,className:`${fm} rdw-kit-focusable`,disabled:l===0,onClick:()=>{h(),f();},children:[K$3(At$2,{size:16}),d]}):null,K$3(`button`,{type:`button`,role:`menuitem`,className:`${fm} rdw-kit-focusable`,onClick:()=>{h(),Hh();},children:[K$3(jt$2,{size:16}),zm]})]}),K$3(Sn$1,{open:r,onClose:g,"aria-label":c?Wm:Km,className:pm,children:[K$3(`h3`,{className:mm,children:c?Um:Vm}),K$3(`p`,{className:hm,children:[c?Vh(u,e.summary):Bh(u),p.stale?null:` ${p.text}`]}),p.stale?K$3(`p`,{className:gm,children:[p.text,` `,K$3(`button`,{type:`button`,className:`${_m} rdw-kit-focusable`,onClick:()=>{g(),Hh();},children:Bm})]}):null,K$3(`div`,{className:Cm,children:[K$3(J$3,{variant:`secondary`,size:`s`,onClick:g,children:Xm}),K$3(J$3,{variant:`primary`,size:`s`,disabled:u===0,onClick:()=>{g(),Lh(c?o:null);},children:`${Gm} ${u.toLocaleString(Dm)}`})]})]})]})}function Wh(e){let t=[];for(let n of Hp(ud())){if(!e.has(n.postId))continue;let r=Number(n.postId);Number.isInteger(r)&&r>0&&t.push({id:r,thumbUrl:ep(n.thumb,n.postId)});}return t}function Gh(e){let[t,n]=z$2({kind:`idle`}),[r,i]=z$2(()=>new Set),a=V$2(null),o=V$2(r);o.current=r;let[s,c]=z$2(null),[l,u]=z$2(``),d=t.kind===`selecting`||t.kind===`confirm`||t.kind===`removing`,{onSelectionModeChange:f,onBusyChange:p}=e;B$2(()=>{f(d);},[f,d]);let m=t.kind!==`idle`;B$2(()=>{p(m);},[p,m]),B$2(()=>{d?Fh(Hp(ud()),r):Ph();},[d,r]),B$2(()=>()=>{a.current?.abort(),Ph();},[]),B$2(()=>{if(t.kind===`selecting`||t.kind===`confirm`)return ao(e=>{if(e.closest(`.rdw-dialog-backdrop`)!==null)return null;let n=e.closest(rn$2.thumb);if(!(n instanceof HTMLElement)||!document.body.contains(n))return null;let r=Vp(n);return r===null?null:t.kind===`confirm`?()=>void 0:()=>{u(``),i(e=>{let t=new Set(e);return t.has(r)?t.delete(r):t.add(r),t});}})},[t.kind]);let h=()=>{a.current?.abort(),a.current=null,Ph(),u(``),i(new Set),n({kind:`idle`});};tm(t.kind===`selecting`,h);let g=()=>{i(new Set),n({kind:`selecting`});},_=()=>{let e=Hp(ud()).map(e=>e.postId);i(new Set(e));},v=()=>{i(new Set);},y=()=>{let e=o.current.size;e!==0&&n({kind:`confirm`,count:e});},b=()=>{n({kind:`selecting`});},x=async()=>{let e=[...o.current];if(e.length===0){n({kind:`selecting`});return}let t=new AbortController;a.current=t;let{signal:r}=t,s=e.length,c=0;n({kind:`removing`,done:c,total:s});try{for(let t=0;t<e.length;t+=1){if(r.aborted){n({kind:`stopped`,message:Ah(c,s)});return}let a=e[t];if(a===void 0)continue;let o=await Qs(a,{signal:r});if(r.aborted){n({kind:`stopped`,message:Ah(c,s)});return}if(o.status!==`removed`){n({kind:`error`,message:kh(c,s,a)});return}Es$1(a),Rh(a),c+=1,i(e=>{let t=new Set(e);return t.delete(a),t}),n({kind:`removing`,done:c,total:s}),t<e.length-1&&await Mh(dn,r);}Ph(),i(new Set),n({kind:`idle`});}catch(t){if(jh(t)||r.aborted){n({kind:`stopped`,message:Ah(c,s)});return}m$2.warn(`favorites-bulk: unexpected removal failure`,t);let i=e[c]??`?`;n({kind:`error`,message:kh(c,s,i)});}finally{a.current===t&&(a.current=null);}},S=()=>{a.current?.abort();};if(t.kind===`idle`)return e.headSlot===null?null:It$1(K$3(Uh,{onSelect:g,stacked:e.headSlot.classList.contains(Pu),summary:e.summary}),e.headSlot);if(t.kind===`removing`){let e=t.total===0?0:t.done/t.total;return K$3(`div`,{className:bm,children:[K$3(`div`,{className:wm,children:K$3(Wn$1,{value:e,label:Oh(t.done,t.total)})}),K$3(`span`,{className:xm,children:Oh(t.done,t.total)}),K$3(J$3,{variant:`secondary`,size:`s`,onClick:S,children:Zm})]})}if(t.kind===`error`||t.kind===`stopped`)return K$3(`div`,{className:bm,children:[K$3(`span`,{className:xm,children:t.message}),K$3(J$3,{variant:`secondary`,size:`s`,onClick:h,children:Qm})]});let C=r.size,w=t.kind===`confirm`,T=document.body.classList.contains(Xt$2);return K$3(A$2,{children:[K$3(`div`,{className:nh,children:[K$3(Yr,{layout:e.inColumn?`stack`:`row`,count:C,selectAllLabel:T?Nm:Mm,onSelectAll:_,onClear:v,onCancel:h,danger:K$3(J$3,{variant:`danger-quiet`,disabled:C===0||w,onClick:y,children:[K$3(Ct$2,{size:14}),$m]}),children:[K$3(J$3,{variant:`secondary`,disabled:C===0||w,onClick:()=>{c(Wh(o.current));},children:Pm}),Ze$1()?K$3(J$3,{variant:`secondary`,disabled:C===0||w,onClick:()=>{let e=Wh(o.current).map(e=>e.id);h(),e.length>0&&!en()&&tn(th,{kind:`ids`,ids:e},`selection`);},children:eh}):null]}),l.length>0||e.summary.length>0?K$3(`span`,{className:um,role:l.length>0?`status`:void 0,children:l.length>0?l:e.summary}):null]}),K$3(Rp,{open:s!==null,posts:s??[],onClose:()=>{c(null);},onDone:e=>{up(),u(Lp(e));}}),K$3(Sn$1,{open:w,onClose:b,"aria-label":sh,className:Sm,children:[K$3(`p`,{className:xm,children:Dh(C)}),K$3(`div`,{className:Cm,children:[K$3(J$3,{variant:`danger`,size:`s`,onClick:()=>{x();},children:`${rh}${String(r.size)}`}),K$3(J$3,{variant:`secondary`,size:`s`,onClick:b,children:Xm})]})]})]})}function Kh(e){let[t,n]=z$2(null),[r,i]=z$2(false),[a,o]=z$2(``);return K$3(A$2,{children:[K$3(`h1`,{className:Tm,children:Em}),It$1(K$3(A$2,{children:[K$3(`div`,{className:lm,hidden:r&&e.side===null,children:K$3(Pd,{actionsRef:n,onSummary:o,sideHost:e.side,locked:r})}),K$3(Gh,{onSelectionModeChange:e.onSelectionModeChange,headSlot:t,summary:a,onBusyChange:i,inColumn:e.side!==null})]}),e.pin)]})}function qh(e){if(document.getElementById(am)!==null)return;let t=Ih(),n=document.createElement(`div`);n.id=am,n.className=om;let r=document.createElement(`div`);r.id=sm,r.className=cm,t.parent.insertBefore(n,t.before),t.parent.insertBefore(r,t.before);let i=document.querySelector(rn$2.imageList);i!==null&&_d(i);let a=e=>{document.body.classList.toggle(Th,e);},o=null;if(t.parent instanceof HTMLElement&&t.parent!==document.body){let e=document.createElement(`div`);e.className=Sl;let i=document.createElement(`div`);i.id=bl,i.className=xl;let s=document.createElement(`div`);s.className=Iu,o=document.createElement(`div`),o.className=Lu,i.append(s,o),e.append(i),t.parent.insertBefore(e,n),t.parent.classList.add(yl),r.remove(),ve$1(K$3(Kh,{pin:s,side:o,onSelectionModeChange:a}),n);}else ve$1(K$3(Kh,{pin:r,side:o,onSelectionModeChange:a}),n);}var Jh={id:nm,label:rm,pages:[...im],defaultEnabled:true,css:Eh,mount:qh},Yh=`
.${Ie$3.cardFav} {
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
  .${Ie$3.cardFav} {
    position-anchor: --rdw-img;
    top: calc(anchor(top) + 4px);
    right: calc(anchor(right) + 4px);
  }
}

.${Ie$3.thumb}:hover .${Ie$3.cardFav},
.${Ie$3.cardFav}:focus-visible {
  opacity: 0.65;
}

.${Ie$3.thumb} .${Ie$3.cardFav}:hover,
.${Ie$3.cardFav}.${Ie$3.cardFavMarked},
.${Ie$3.cardFav}.${Ie$3.cardFavError},
.${Ie$3.cardFav}.${Ie$3.cardFavPending} {
  opacity: 1;
}

.${Ie$3.cardFav}:focus-visible {
  outline: 2px solid var(--rdw-accent);
  outline-offset: 2px;
}

.${Ie$3.cardFav}.${Ie$3.cardFavMarked} {
  background: #ffe08a;
  border-color: #a67c00;
  color: #5c4500;
}

.${Ie$3.cardFav}.${Ie$3.cardFavError} {
  background: #f8d7da;
  border-color: #a12828;
  color: #a12828;
}

.${Ie$3.cardFav}.${Ie$3.cardFavPending},
.${Ie$3.cardFav}:disabled {
  cursor: wait;
}

.${Ie$3.thumb}:has(> a[style*="display: none"]) .${Ie$3.cardFav},
.${Ie$3.thumb}:has(> a[style*="display:none"]) .${Ie$3.cardFav} {
  display: none !important;
}

body.${Ie$3.gridFavsHidden} .${Ie$3.cardFav} {
  display: none !important;
}

.${Ie$3.artistFollow} {
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

.${Ie$3.artistFollow}:focus-visible {
  outline: 2px solid var(--rdw-accent);
  outline-offset: 2px;
}

.${Ie$3.artistFollow}.${Ie$3.artistFollowMarked} {
  background: #ffe08a;
  border-color: #a67c00;
  color: #5c4500;
}

.${Ie$3.updatesBar} {
  margin: 8px 0;
  padding: 8px 10px;
  border: 1px solid var(--rdw-border);
  border-radius: 6px;
  background: var(--rdw-surface);
  font-family: Segoe UI, system-ui, sans-serif;
  font-size: 14px;
  color: var(--rdw-text);
}

.${Ie$3.updatesBar} .${Ie$3.hint} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 12px;
}

.${Ie$3.updatesBar} .${Ie$3.primaryButton} {
  border: 1px solid var(--rdw-accent);
  background: var(--rdw-accent);
  color: var(--rdw-surface);
  border-radius: 4px;
  cursor: pointer;
  min-height: 32px;
  padding: 4px 10px;
  font: inherit;
}

.${Ie$3.updatesBar} .${Ie$3.primaryButton}:focus-visible {
  outline: 2px solid var(--rdw-accent);
  outline-offset: 2px;
}

.${Ie$3.updatesBar} .${Ie$3.itemName} {
  color: var(--rdw-accent);
  font-weight: 600;
  text-decoration: underline;
}

.${Ie$3.updatesBarActions} {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
`,Xh,Zh=`
${Tn$1}

.${Ie$3.cardFav}.${Ie$3.cardFavMarked},
.${Ie$3.cardFav}.${Ie$3.cardFavError},
.${Ie$3.cardFav}.${Ie$3.cardFavPending} {
  opacity: 0;
}

.${Ie$3.thumb}:hover .${Ie$3.cardFav},
.${Ie$3.cardFav}:focus-visible {
  opacity: 0.65;
}

.${Ie$3.thumb} .${Ie$3.cardFav}:hover,
.${Ie$3.thumb}:hover .${Ie$3.cardFav}.${Ie$3.cardFavMarked},
.${Ie$3.thumb}:hover .${Ie$3.cardFav}.${Ie$3.cardFavError},
.${Ie$3.thumb}:hover .${Ie$3.cardFav}.${Ie$3.cardFavPending},
.${Ie$3.cardFav}.${Ie$3.cardFavMarked}:focus-visible,
.${Ie$3.cardFav}.${Ie$3.cardFavError}:focus-visible,
.${Ie$3.cardFav}.${Ie$3.cardFavPending}:focus-visible {
  opacity: 1;
}

.${Ie$3.cardFav}.rdw-icon-btn {
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.93);
  border: 1px solid rgba(0, 0, 0, 0.13);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  color: #1c2228;
  font-size: 13px;
}

.${Ie$3.cardFav}.${Ie$3.cardFavMarked}.rdw-icon-btn {
  background: #ffd75e;
  border-color: #c79a00;
  color: #5c4500;
}

/* As wide as what it holds, not the whole row. */
.${Ie$3.updatesBar} {
  display: flex;
  align-items: center;
  gap: 10px;
  box-sizing: border-box;
  width: fit-content;
  max-width: 100%;
  white-space: nowrap;
}

.${Ie$3.updatesBarActions} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.${Ie$3.updatesBar} .${Ie$3.hint} {
  margin: 0;
  font-weight: 700;
  font-size: 12px;
  color: var(--rdw-text);
}

.${Ie$3.updatesBar} .${Ie$3.primaryButton} {
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

.${Ie$3.updatesBar} .${Ie$3.secondaryButton} {
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

.${Ie$3.updatesBar} .${Ie$3.secondaryButton}:focus-visible,
.${Ie$3.updatesBar} .${Ie$3.primaryButton}:focus-visible {
  outline: 2px solid var(--rdw-accent);
  outline-offset: 2px;
}
`;function Qh(){Xh===void 0&&(Xh=ot$4(e=>{ig(e);}));}function $h(){if(document.getElementById(`ruledesk-web-document-style`)!==null)return;let e=document.createElement(`style`);e.id=De$3,e.textContent=`${dt$3}\n${Yh}\n${Zh}`,document.head.append(e);}function eg(e,t){let n=e.querySelector(`#p${t}`);if(n instanceof HTMLAnchorElement)return n;let r=e.querySelector(rn$2.thumbLink);return r instanceof HTMLAnchorElement?r:null}function tg(e,t,n){if(e.querySelector(rn$2.cardFavButton)!==null)return;let r=eg(e,t);if(r===null)return;Tt$3(e);let i=_f(t,n);i.classList.add(mf),r.after(i);}function ng(e){document.body.classList.toggle(Ie$3.gridFavsHidden,!e);}function rg(e){ng(e),e&&P$3(window.location.search)===`list`&&ig();}function ig(e=document,t=window.location.search){if(Qh(),P$3(t)!==`list`)return;$h();let n=Dc$1();if(ng(n),!n)return;let i=e.querySelectorAll(rn$2.thumb);for(let e of i){if(!(e instanceof HTMLElement))continue;let t=cn$2(e);t!==null&&tg(e,t,ws$1(t));}}var ag=`new`,og=/^id:>(\d+)$/,sg=` new`,cg=`Marked as seen up to #`,lg=`Only new`,ug=`Show all`;function dg(){let e=Io$1();return e!==null&&e.length>0?[...e]:Kc$1()}function fg(){let e=Io$1();Ks$1(),e!==null&&e.length>0&&Fo$1(e);}function pg(e){let t=new URLSearchParams(e).get(`pid`);if(t===null||t.trim().length===0)return 0;let n=Number(t);return !Number.isFinite(n)||n<0?0:Math.floor(n)}function mg(e){let t=0,n=e.querySelectorAll(rn$2.thumb);for(let e of n){let n=cn$2(e);if(n===null)continue;let r=Number(n);Number.isFinite(r)&&r>t&&(t=r);}return t}function hg(e,t){let n=0,r=e.querySelectorAll(rn$2.thumb);for(let e of r){let r=cn$2(e);if(r===null)continue;let i=Number(r);Number.isFinite(i)&&i>t&&(n+=1);}return n}function gg(e){let t=e.trim().split(/\s+/).filter(e=>e.length>0),n=t[t.length-1];return n!==void 0&&og.test(n)}function _g(e){let t=e instanceof Document?e.getElementById(Oe$3):e.querySelector(`#${Oe$3}`);t!==null&&t.remove();}function vg(){let e=document.createElement(`div`);return e.id=Oe$3,e.className=Ie$3.updatesBar,e}function yg(e,t){e.parentElement?.insertBefore(t,e);}function bg(e){return e.querySelector(rn$2.postListContent)??e.querySelector(rn$2.contentRoot)}function xg(e){let t=e.querySelectorAll(`${rn$2.thumb}.${ag}`);for(let e of t)e.classList.remove(ag);}function Sg(e,t){if(gg(e)){let t=document.createElement(`a`);return t.className=Ie$3.secondaryButton,t.href=lo$1(ho$1(e)),t.textContent=ug,t}if(t===0)return null;let n=`${ho$1(e)} ${Ce$3}${String(t)}`,r=document.createElement(`a`);return r.className=Ie$3.secondaryButton,r.href=lo$1(n),r.textContent=lg,r}function Cg(e,t,n){let r=Sg(t,n);r!==null&&e.append(r);}function wg(e,t){let n=bg(e);if(n===null){m$2.warn(Fe$3.updatesBarMissingHost);return}let r=vg(),i=Wc$1(),a=document.createElement(`p`);a.className=Ie$3.hint,a.textContent=`${Fe$3.noNewPostsSince}${String(i)}`;let o=document.createElement(`a`);o.className=Ie$3.secondaryButton,o.href=lo$1(ho$1(t)),o.textContent=ug;let s=document.createElement(`div`);s.className=Ie$3.updatesBarActions,s.append(a,o),r.append(s),n.insertBefore(r,n.firstChild);}function Tg(e){let t=vg(),n=document.createElement(`p`);n.className=Ie$3.hint,n.textContent=Fe$3.updatesPartialHint,t.append(n),yg(e,t);}function Eg(e,t,n,r){let i=vg(),a=Wc$1();if(pg(t)>0){let t=document.createElement(`p`);t.className=Ie$3.hint,t.textContent=Fe$3.goToPageOneToMark,i.append(t),yg(e,i);return}let o=hg(e,a),s=document.createElement(`div`);if(s.className=Ie$3.updatesBarActions,o===0){let t=document.createElement(`p`);t.className=Ie$3.hint,t.textContent=`${Fe$3.noNewPostsSince}${String(a)}`,s.append(t),r||Cg(s,n,a),i.append(s),yg(e,i);return}let c=document.createElement(`p`);c.className=Ie$3.hint,c.textContent=`${String(o)}${sg}`;let l=document.createElement(`button`);l.type=`button`,l.className=Ie$3.primaryButton,l.textContent=Fe$3.markAllSeen,l.addEventListener(`click`,()=>{let t=Math.max(Wc$1(),mg(e));if(Gc$1(t),xg(document),!r&&gg(n)){let e=ho$1(n);window.location.assign(lo$1(`${e} ${Ce$3}${String(t)}`));return}i.replaceChildren();let a=document.createElement(`p`);a.className=Ie$3.hint,a.textContent=`${cg}${String(t)}`;let o=document.createElement(`div`);o.className=Ie$3.updatesBarActions,o.append(a),r||Cg(o,n,t),i.append(o);}),s.append(c,l),r||Cg(s,n,a),i.append(s),yg(e,i);}function Dg(e=document,t=window.location.search,n={}){if(P$3(t)!==`list`)return;let i=new URLSearchParams(t).get(le$1);if(i===null||i.trim().length===0)return;let a=dg();fg();let o=n.merged===true,s=o||yo$1(i,a),c=!o&&bo$1(i,a);if(!s&&!c){_g(e);return}_g(e),$h();let l=e.querySelector(rn$2.imageList);l===null?wg(e,i):c?Tg(l):Eg(l,t,i,o);}function Og(e,t){return {cover:xt(e,4),postCount:Ot(e,t),lastPostId:St(e)}}async function kg(e){let t=oo$1([{tag:e,type:xe$3}]),n=await fetch(t,{method:`GET`,credentials:be$2});if(!n.ok)throw Error(`HTTP ${String(n.status)}`);let r=await n.text();return Og(new DOMParser().parseFromString(r,`text/html`),e)}var Ag=`0`,jg;function Mg(e,t){let n=new Map;for(let r of e.querySelectorAll(rn$2.thumb)){let e=cn$2(r),i=e===null?NaN:Number(e);if(Number.isFinite(i))for(let e of Ct(r))t.has(e)&&i>(n.get(e)??0)&&n.set(e,i);}n.size>0&&ul$1(n);}function Ng(e){let t=new URLSearchParams(e).get(`pid`);return t===null||t.length===0||t===Ag}function Pg(e){let t=new Set(Kc$1());if(t.size===0)return;let n=new URLSearchParams(e).get(`tags`)??``,r=Tt(n);r!==null&&t.has(r)&&Ng(e)&&!Ao$1(n)&&ll$1(r,Og(document,r)),Mg(document,t),jg===void 0&&(jg=ot$4(e=>{Mg(e,new Set(Kc$1()));}));}var Fg=rn$2.imageList,Ig=rn$2.thumb,Lg=`div.pagination`,Rg=`a[alt="next"]`;function zg(e){let t=new URL(e,window.location.href);if(t.origin!==window.location.origin)throw Error(`Cross-origin next page URL rejected: ${t.origin}`);return t.href}function Bg(e){let t=e.querySelector(Lg);if(t===null)return null;let n=t.querySelector(Rg);if(!(n instanceof HTMLAnchorElement))return null;let r=n.getAttribute(`href`);if(r===null||r.length===0||r===`#`)return null;try{return zg(r)}catch{return null}}function Vg(e){let t=e.querySelector(Fg);return t===null?[]:Array.from(t.querySelectorAll(Ig))}async function Hg(e){let t=zg(e),n=await fetch(t,{method:`GET`,credentials:be$2});if(!n.ok)throw Error(`HTTP ${String(n.status)}`);let r=await n.text(),i=new DOMParser().parseFromString(r,`text/html`);return {thumbs:Vg(i),nextUrl:Bg(i)}}var Ug=`rdw-feed-merged`,Wg=`rdw-feed-merge-pending`,Gg=`rdw-blacklisted`,Kg=`rdw-feed-merge-status`,qg=`rdw-feed-merge-sentinel`,Jg=`rdw-feed-merge-retry`,Yg=1e3,Xg=2,Zg=`0`,Qg=`div.pagination a[alt="next"]`,$g=`#`,e_=`score:`,t_=`rating:`,n_=/\s+/,r_=`Loading feed: part `,i_=` of `,a_=`End of feed`,o_=`Failed to load a part of the feed`,s_=`Retry`,c_=`
body.${Ug} ${rn$2.pagination} {
  display: none;
}
body.${Ug} ${rn$2.thumb}.${Wg},
body.${Ug} ${rn$2.thumb}.${Gg} {
  display: none !important;
}
.${qg} {
  display: block;
  width: 100%;
  height: 1px;
}
.${Kg} {
  display: block;
  width: 100%;
  margin: 12px 0;
  text-align: center;
  font-size: 13px;
  color: var(--rdw-muted);
}
.${Jg} {
  margin-left: 8px;
  padding: 2px 8px;
  font: inherit;
  color: var(--rdw-text);
  background: var(--rdw-surface);
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  cursor: pointer;
}
`;function l_(e,t,n){let r=[];for(;;){let i=-1,a=-1;for(let n=0;n<e.length;n+=1){let o=e[n];if(o===void 0)continue;let s=o.buffer[0];if(s===void 0){if(o.nextUrl!==null)return {emitted:r,starving:n};continue}let c=t(s);c>a&&(a=c,i=n);}let o=e[i]?.buffer.shift();if(o===void 0)return {emitted:r,starving:null};n.has(a)||(n.add(a),r.push(o));}}function u_(e){let t=cn$2(e),n=t===null?NaN:Number(t);return Number.isFinite(n)?n:0}function d_(e,t){return u_(t)-u_(e)}function f_(e){return new Promise(t=>{window.setTimeout(t,e);})}function p_(){let e=document.querySelector(Qg)?.getAttribute(`href`)??``;if(e.length===0||e===$g)return null;try{return new URL(e,window.location.href).href}catch{return null}}function m_(e,t){let n=e.querySelector(rn$2.previewImage),r=n?.getAttribute(`title`)?.trim()??n?.getAttribute(`alt`)?.trim()??``,i=[],a=0,o=``;for(let e of r.split(n_)){let t=e.toLowerCase();if(t.startsWith(e_)){let t=Number(e.slice(6));a=Number.isFinite(t)?t:a;}else t.startsWith(t_)?o=e.slice(7):e.length>0&&i.push(e);}Ta(i,a,o,t)&&e.classList.add(Gg);}function h_(e,t,n){let r=new URLSearchParams(e),i=r.get(`pid`);if(i!==null&&i.length>0&&i!==Zg)return  false;let a=r.get(`tags`)??``;return mo$1(a,t,n)===0}function g_(e){let t=document.querySelector(rn$2.imageList);if(t===null)return  false;let n=po$1(e.artistTags,e.groupSize);document.body.classList.add(Ug);let r=Array.from(t.querySelectorAll(rn$2.thumb));for(let e of r)e.classList.add(Wg);let i=n.map((e,t)=>t===0?{buffer:r.sort(d_),nextUrl:p_()}:{buffer:[],nextUrl:lo$1(e)}),a=document.createElement(`div`);a.className=qg,a.setAttribute(`aria-hidden`,`true`);let o=document.createElement(`div`);o.className=Kg,o.setAttribute(`role`,`status`),t.after(a,o);let s=new Set,c=0,l=false,u=0,d=()=>{let e=Xg*window.innerHeight;return a.getBoundingClientRect().top<window.innerHeight+e},f=n=>{if(n.length!==0){for(let e of n)e.classList.remove(Wg),t.append(e);c+=n.length,st$4(t,n),e.onChange();}},p=async e=>{let t=i[e];if(t===void 0||t.nextUrl===null)return;let n=Yg-(Date.now()-u);u>0&&n>0&&await f_(n),u=Date.now(),o.textContent=`${r_}${String(e+1)}${i_}${String(i.length)}…`,X$1(N);let r=await Hg(t.nextUrl),a=Ca(),s=[];for(let e of r.thumbs){let t=document.importNode(e,true);m_(t,a),s.push(t);}t.buffer.push(...s.sort(d_)),t.nextUrl=r.nextUrl,o.textContent=``;},m=async()=>{if(!l){l=true;try{for(;;){let e=l_(i,u_,s);if(f(e.emitted),e.starving===null){o.textContent=a_;return}if(c>0&&!d())return;try{await p(e.starving);}catch(e){m$2.warn(`feed-merge: fetch failed`,e),o.textContent=o_;let t=document.createElement(`button`);t.type=`button`,t.className=Jg,t.textContent=s_,t.addEventListener(`click`,()=>{o.textContent=``,m();}),o.append(t);return}}}finally{l=false;}}};if(typeof IntersectionObserver==`function`){let e=`${String(Xg*window.innerHeight)}px`;new IntersectionObserver(e=>{e.some(e=>e.isIntersecting)&&m();},{root:null,rootMargin:e,threshold:0}).observe(a);}return m(),true}var __=`feed`,v_=`Feed in site menu`,y_=[`list`,`post`,`favorites`,`other`],b_=`content`,x_=`Posts`,S_=`Feed`,C_=`current-page`,w_=`Follow artists to build your feed`,T_=`feed: Posts menu item not found`;function E_(){let e=Io$1();return e!==null&&e.length>0?[...e]:Kc$1()}function D_(){let e=Io$1();Ks$1(),e!==null&&e.length>0&&Fo$1(e);}var O_=6,k_=6,A_=`pageshow`,j_=`click`,M_=Kt$2(__),N_=`
body.${M_} span.thumb.new.${Bt$2} {
  position: relative;
}
body.${M_} span.thumb.new.${Bt$2}::before {
  content: "NEW";
  position: absolute;
  z-index: 4;
  left: ${String(O_)}px;
  top: ${String(k_)}px;
  background: var(--rdw-accent);
  color: var(--rdw-surface);
  font: 700 9.5px system-ui, Segoe UI, sans-serif;
  letter-spacing: 0.05em;
  padding: 2px 6px;
  border-radius: 9px;
  pointer-events: none;
}
@supports (anchor-name: --a) {
  body.${M_} span.thumb.new.${Bt$2}::before {
    position-anchor: ${Ht$2};
    left: calc(anchor(left) + ${String(O_)}px);
    top: calc(anchor(top) + ${String(k_)}px);
  }
}
`,P_,F_=false,I_=null;function L_(){let e=document.getElementById(b_),t=document.querySelectorAll(`a`);for(let n of t){if(!(n instanceof HTMLAnchorElement)||(n.textContent?.trim()??``)!==x_)continue;let t=n.closest(`li`);if(t!==null&&!(e!==null&&e.contains(t)))return t}return null}function R_(){let e=E_();return e.length===0?qe$3:fo$1(e,Rc$1())}function z_(){let e=document.getElementById(ut$3);if(!(e instanceof HTMLLIElement))return null;let t=e.querySelector(`a`);return t instanceof HTMLAnchorElement?t:null}function B_(){let e=z_();e!==null&&(e.href=R_(),E_().length===0?e.title=w_:e.removeAttribute(`title`));}function V_(){B_();}function H_(){B_();}function U_(e){F_||(F_=true,window.addEventListener(A_,V_)),I_!==e&&(I_!==null&&I_.removeEventListener(j_,H_),e.addEventListener(j_,H_),I_=e);}function W_(){let e=document.getElementById(ut$3);if(e instanceof HTMLLIElement){let t=e.querySelector(`a`);return t instanceof HTMLAnchorElement&&(B_(),U_(t)),e}let t=L_();if(t===null)return m$2.warn(T_),null;let n=document.createElement(`li`);n.id=ut$3;let r=document.createElement(`a`);return r.textContent=S_,r.href=R_(),E_().length===0&&(r.title=w_),n.append(r),t.after(n),U_(r),n}function G_(e,t){let n=new URLSearchParams(e).get(le$1);return n===null||n.trim().length===0?false:yo$1(n,t)||bo$1(n,t)||mo$1(n,t,Rc$1())>=0}function K_(e,t,n){let r=L_();t?(r?.classList.remove(C_),e.classList.add(C_)):(e.classList.remove(C_),n===`list`&&r?.classList.add(C_));}function q_(e,t){if(t===0)return;$h();let n=e.querySelectorAll(rn$2.thumb);for(let e of n){if(!(e instanceof HTMLElement))continue;let n=cn$2(e);if(n===null)continue;let r=Number(n);!Number.isFinite(r)||r<=t||(Tt$3(e),e.classList.add(`new`));}}function J_(){P_===void 0&&(P_=ot$4(e=>{q_(e,Wc$1());}));}function Y_(e){let t=W_();if(t===null)return;let n=E_();D_();let r=G_(e.search,n);if(K_(t,r,e.pageKind),e.pageKind===`list`&&Pg(e.search),!r||e.pageKind!==`list`)return;q_(document,Wc$1()),J_();let i=h_(e.search,n,Rc$1());Dg(document,e.search,{merged:i}),i&&g_({artistTags:n,groupSize:Rc$1(),onChange:()=>{Dg(document,e.search,{merged:i});}});}var X_={id:__,label:v_,pages:[...y_],defaultEnabled:true,css:`${N_}\n${c_}`,mount:Y_},Z_=`feed-counter`,Q_=`New posts counter beside Feed`,$_=`rdw-feed-count`,ev=`ruledesk-web.feed-count`,tv=Kt$2(Z_),nv=`+`,rv=`
body.${tv} .${$_} {
  display: inline-block;
  min-width: 16px;
  margin-left: 6px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--rdw-accent);
  /* The site's dark theme colours everything in the menu with a rule stronger
     than this one would be; the number was the link's green on a green pill. */
  color: var(--rdw-surface) !important;
  font: 700 10.5px/16px var(--rdw-font);
  text-align: center;
  vertical-align: middle;
}
body:not(.${tv}) .${$_} {
  display: none;
}
`.trim();function iv(e){return typeof e!=`object`||!e?false:`count`in e&&typeof e.count==`number`&&`more`in e&&typeof e.more==`boolean`&&`at`in e&&typeof e.at==`number`&&`seen`in e&&typeof e.seen==`number`&&`href`in e&&typeof e.href==`string`}function av(){try{let e=window.localStorage.getItem(ev),t=e===null?null:JSON.parse(e);return iv(t)?t:null}catch{return null}}function ov(e){try{window.localStorage.setItem(ev,JSON.stringify(e));}catch{}}function sv(e,t){let n=0;for(let r of e){let e=cn$2(r),i=e===null?NaN:Number(e);Number.isFinite(i)&&i>t&&(n+=1);}return {count:n,more:e.length>0&&n===e.length}}function cv(e){return e.count<=0?``:e.more?`${String(e.count)}${nv}`:String(e.count)}function lv(e,t,n,r){return e!==null&&e.seen===n&&e.href===r&&t-e.at>=0&&t-e.at<9e5}function uv(e,t){let n=cv(t),r=e.parentElement?.querySelector(`.rdw-feed-count`)??null;if(n.length===0){r?.remove();return}let i=r??document.createElement(`span`);i.className=$_,i.textContent=n,i.setAttribute(`aria-label`,`${n} new posts in the feed`),r===null&&e.append(i);}function dv(e,t){try{return new URL(e,window.location.href).search===new URL(t,window.location.href).search}catch{return  false}}function fv(e){let t=document.getElementById(ut$3)?.querySelector(`a`);if(!(t instanceof HTMLAnchorElement))return;let n=Wc$1(),r=t.href;if(n<=0||Kc$1().length===0||!r.includes(`tags=`)||dv(r,window.location.href))return;let i=Date.now(),a=av();a!==null&&lv(a,i,n,r)?uv(t,a):tt(N,()=>Hg(r)).then(e=>{let i=sv(e.thumbs,n);ov({...i,at:Date.now(),seen:n,href:r}),uv(t,i);}).catch(e=>{ov({count:0,more:false,at:Date.now(),seen:n,href:r}),m$2.warn(`feed-counter: request failed`,e);});}var pv={id:Z_,label:Q_,pages:[`list`,`post`,`favorites`,`other`],defaultEnabled:true,settingsCaption:`Asks the site for the first page of the feed when a page loads, at most once in 15 minutes. Counts the first feed group only.`,css:rv,mount:fv},mv=`div.link-list ul`,hv=`div#stats`,gv=`#fit-to-screen div.flexi, div#right-col div.flexi, div.flexi`,_v=`image`,vv=`div#header`,yv=`post-comments`,bv=`comment-list`,xv=[`Edit`,`Resize image`,`Report to moderation`,`Add Note`],Sv=`psc`,Cv=/^(Id|Posted|Size|Source|Rating|Score)\s*:/i,wv=/\s+/g,Tv=/\bby\b/i,Ev=/^\d+$/,Dv=`span, b, strong, em, small`,Ov=`nofollow noreferrer`;function kv(e){for(let t of xv)if(t===e)return  true;return  false}function Av(e){return e.replace(wv,` `).trim()}function jv(e){let t=Av(e.textContent??``),n=Cv.exec(t);if(n===null)return null;let r=n[1];return r===void 0?null:r.charAt(0).toUpperCase()+r.slice(1).toLowerCase()}var Mv=`div.status-notice`,Nv=`This post was deleted`,Pv=/Reason:\s*(.*?)\s*(?:\/\s*MD5:|$)/,Fv=/MD5:\s*([0-9a-f]+)/i;function Iv(e=document){for(let t of e.querySelectorAll(Mv)){let e=t.textContent?.trim()??``;if(t instanceof HTMLElement&&e.startsWith(Nv))return {element:t,reason:Pv.exec(e)?.[1]??``,md5:Fv.exec(e)?.[1]??``}}return null}function Lv(){let e=document.querySelector(gv);return e instanceof HTMLElement?e:null}function Rv(e,t){for(let n of e.children)if(n instanceof HTMLElement&&n.id!==t&&n.querySelector(`video`)!==null)return n;for(let n of e.children)if(n instanceof HTMLElement&&n.id!==t&&n.querySelector(`#image`)!==null)return n;for(let n of e.children)if(n instanceof HTMLElement&&n.id!==t)return n;return null}function zv(){let e=document.querySelector(mv),t=e===null?[document]:[e,document];for(let e of t){let t=e.querySelectorAll(`a[href]`);for(let e of t){if(!(e instanceof HTMLAnchorElement)||e.textContent?.trim()!==`Original image`)continue;let t=e.getAttribute(`href`);if(t!==null&&t.length!==0&&t!==`#`)return e}}return null}function Bv(){let e=document.querySelector(mv);if(e===null)return [];let t=[],n=e.querySelectorAll(`a[href]`);for(let e of n){if(!(e instanceof HTMLAnchorElement))continue;let n=e.textContent?.trim()??``;kv(n)&&t.push({text:n,anchor:e});}return t}function Vv(e){return `${Sv}${e}`}function Hv(e){let t=document.getElementById(Vv(e));return t instanceof HTMLElement?t:null}function Uv(e){let t=Hv(e);if(t===null)return null;let n=t.textContent?.trim()??``;return n.length>0?n:null}function Wv(e,t){let n=Hv(e);n!==null&&(n.textContent=String(t));}function Gv(e,t){let n=Hv(e);if(n===null)return ()=>{};let r=new MutationObserver(()=>{t(n.textContent?.trim()??``);});return r.observe(n,{characterData:true,childList:true,subtree:true}),()=>{r.disconnect();}}function Kv(e){let t=[],n=e.querySelector(`a[href]`),r=null,i=null;if(n instanceof HTMLAnchorElement){let e=n.getAttribute(`href`),t=n.textContent?.trim()??``;e!==null&&e.length>0&&t.length>0&&(r=t,i=e);}let a=e.cloneNode(true);if(!(a instanceof HTMLElement))return t;for(let e of a.querySelectorAll(`a`))e.remove();for(let e of a.querySelectorAll(`br`))e.replaceWith(` `);let o=Av(a.textContent??``);return o=o.replace(/^Posted\s*:\s*/i,``),o=o.replace(Tv,``).trim(),o=Av(o),o.length>0&&t.push({label:`Posted`,value:o,href:null}),r!==null&&i!==null&&t.push({label:`By`,value:r,href:i}),t}function qv(e){let t=e.querySelector(`a[href]`);if(!(t instanceof HTMLAnchorElement))return null;let n=t.getAttribute(`href`);if(n===null||n.length===0||n===`#`||!/^https?:/i.test(t.href))return null;let r=t.textContent?.trim()??``;return {label:`Source`,value:r.length>0?r:n,href:n}}function Jv(e,t){let n=Av(e.textContent??``),r=`${t}:`,i=n.toLowerCase(),a=r.toLowerCase();if(!i.startsWith(a))return null;let o=n.slice(r.length).trim();return o.length===0?null:{label:t,value:o,href:null}}function Yv(){let e=document.querySelector(hv);if(e===null)return [];let t=[],n=new Set,r=e.querySelectorAll(`li`);for(let e of r){if(!(e instanceof HTMLElement))continue;let r=jv(e);if(r!==null&&r!==`Score`){if(r===`Posted`)for(let r of Kv(e))n.has(r.label)||(n.add(r.label),t.push(r));else if(r===`Source`){if(n.has(`Source`))continue;let r=qv(e);r!==null&&(n.add(`Source`),t.push(r));}else if(r===`Id`||r===`Size`||r===`Rating`){if(n.has(r))continue;let i=Jv(e,r);i!==null&&(n.add(r),t.push(i));}}}return t}var Xv=/^(\d+)\s*x\s*(\d+)$/i;function Zv(){let e=Yv().find(e=>e.label===`Size`);return e===void 0?null:Qv(e.value)}function Qv(e){let t=Xv.exec(e.trim());if(t===null)return null;let n=Number(t[1]),r=Number(t[2]);return n>0&&r>0?{width:n,height:r}:null}var $v=Ov;function ey(e){let t=Av(e.textContent??``);return Ev.test(t)?t:null}function ty(e){for(let t of e.querySelectorAll(Dv)){let e=ey(t);if(e!==null)return e}let t=ey(e);return t===null?null:t}function ny(e){let t=e.closest(`li`);if(t!==null){for(let n of t.querySelectorAll(Dv)){if(e.contains(n))continue;let t=ey(n);if(t!==null)return t}for(let e of t.childNodes){if(e.nodeType!==Node.TEXT_NODE)continue;let t=Av(e.textContent??``);if(Ev.test(t))return t}let n=[t.previousElementSibling,t.nextElementSibling];for(let e of n){if(!(e instanceof HTMLElement)||e.querySelector(`a[onclick^="iCame("]`)!==null||jv(e)!==null)continue;let t=ty(e);if(t!==null)return t}}let n=e.nextElementSibling;if(n!==null){let e=ty(n);if(e!==null)return e}return null}function ry(){let e=document.querySelector(`div#stats > ul`)?.querySelector(`a[onclick^="iCame("]`)??document.querySelector(`a[onclick^="iCame("]`);return e instanceof HTMLAnchorElement?{anchor:e,count:ny(e)}:null}function iy(e){let t=document.querySelector(vv);return t instanceof HTMLElement?t.getBoundingClientRect().height+e:e}function ay(){let e=document.getElementById(yv);return e instanceof HTMLElement?e:null}var oy=/^(\d+)\s+comments?\b/i;function sy(){let e=document.getElementById(bv);if(e===null)return null;for(let t of e.childNodes){if(t.nodeType!==Node.TEXT_NODE)continue;let e=Av(t.textContent??``);if(e.length===0)continue;let n=oy.exec(e);if(n===null)return null;let r=n[1];if(r===void 0)return null;let i=Number(r);return Number.isFinite(i)?Math.trunc(i):null}return null}var cy=`gif-post`,ly=`Play GIFs on the post page`,uy=/\.gif$/i,dy=`data-rdw-gif`;function fy(e){try{return new URL(e,window.location.href).pathname}catch{return e}}function py(e){return uy.test(fy(e))}function my(e=document,t){let n=e.querySelector(`img#${_v}`),r=zv()?.href??``;return !(n instanceof HTMLImageElement)||!py(r)||py(n.currentSrc||n.src)?false:(n.setAttribute(dy,``),n.src=r,true)}function hy(e){document.body.classList.contains(Kt$2(cy))&&my();}var gy={id:cy,label:ly,pages:[`post`],defaultEnabled:true,settingsCaption:`The site shows a still copy of a GIF until its original is opened. With this on, the original is loaded at once.`,css:``,mount:hy},_y=`full-image`,vy=`Load full-size image`,yy=`Sharper and larger, but the page opens slower: originals are often several MB.`,by=`data-rdw-full`,xy=/\.(?:jpe?g|png|webp|bmp)$/i,Sy=`(min-width: 1100px)`,Cy=`body.${Kt$2(_y)}`,wy=`img#${_v}[${by}]`,Ty=`
${Cy} ${wy} {
  width: auto !important;
  height: auto !important;
  max-width: 100%;
}
@media ${Sy} {
  ${Cy} div#post-view > div#right-col {
    flex-grow: 1;
    min-width: 0;
  }
  ${Cy} div.flexi:has(${wy}) {
    flex-wrap: nowrap;
  }
  ${Cy} div.flexi > :has(${wy}) {
    flex: 0 1 auto;
    min-width: 0;
  }
  ${Cy} div.flexi:has(${wy}) > #${Gt$2} {
    flex-shrink: 0;
  }
}
`.trim();function Ey(e){try{return new URL(e,window.location.href).pathname}catch{return e}}function Dy(e,t){if(t.length===0||py(t))return null;let n=Ey(t);return !xy.test(n)||Ey(e.currentSrc||e.src)===n?null:t}function Oy(e=document,t){let n=e.querySelector(`img#${_v}`);if(!(n instanceof HTMLImageElement))return  false;let r=Dy(n,zv()?.href??``);if(r===null)return  false;let i=new Image;return i.addEventListener(`load`,()=>{n.isConnected&&(n.setAttribute(by,``),n.src=r);}),i.src=r,true}function ky(e){document.body.classList.contains(Kt$2(_y))&&Oy();}var Ay={id:_y,label:vy,pages:[`post`],defaultEnabled:false,settingsCaption:yy,css:Ty,mount:ky},jy=class extends Error{failure;constructor(e,t){super(t),this.failure=e;}},My=`tag-type-`,Ny=[`artist`,`character`,`copyright`,`general`,`metadata`],Py=/\D/g,Fy=`?`,Iy=` `,Ly=`webm-thumb`,Ry=429,zy=2,By=1e3,Vy=2,Hy=`(`,Uy=`)`,Wy=`~`,Gy=`pid`,Ky=20,qy=1100,Jy=`-`,Yy=new Set(`highres.hi_res.absurdres.absurd_res.lowres.text.english_text.japanese_text.dialogue.speech_bubble.watermark.signature.artist_name.artist_signature.patreon_username.twitter_username.web_address.url.dated.logo.ai_generated.ai_assisted.stable_diffusion.novelai.commentary.tagme.translated.translation_request.sound.animated.video.1girls.1boy.1girl.2girls.2boys.3girls.solo.duo.female.male.female_only.male_only.solo_female.solo_male.solo_focus.female_focus.male_focus.male/female.straight.human.simple_background.looking_at_viewer.explicit.questionable.safe.nsfw.adult.mature.perfect_body.beautiful.sexy.hot.cute.pretty`.split(`.`)),Xy=new Set([`patreon`,`patreon_reward`,`fanbox`,`pixiv`,`pixiv_fanbox`,`fantia`,`twitter`,`x_(twitter)`,`subscribestar`,`gumroad`,`ko-fi`,`boosty`,`skeb`,`onlyfans`,`fansly`,`deviantart`,`newgrounds`,`tumblr`,`discord`,`itch.io`,`original`,`original_character`,`commission`]),Zy=new Set([`original_character`,`oc`]),Qy=1e3,$y=3,eb=2,tb=4,nb=`favorites`,rb=`similar`,ib=`In your favorites`,ab=`Similar`;function ob(e){for(let t of e.classList){if(!t.startsWith(My))continue;let e=Ny.find(e=>e===t.slice(9));if(e!==void 0)return e}return null}var sb=/&#(\d+);/g,cb={"&amp;":`&`,"&quot;":`"`,"&lt;":`<`,"&gt;":`>`},lb=/&(?:amp|quot|lt|gt);/g;function ub(e){return e.replace(sb,(e,t)=>String.fromCodePoint(Number(t))).replace(lb,e=>cb[e]??e)}function db(e){let t=[...e.querySelectorAll(`a[href]`)].reverse();for(let e of t){let t=e.getAttribute(`href`)??``,n=t.indexOf(Fy);if(n<0)continue;let r=ub(new URLSearchParams(t.slice(n+1)).get(`tags`)?.trim().toLowerCase()??``);if(r.length>0&&!r.includes(Iy))return r}return null}function fb(e=document){let t=[],n=new Set;for(let r of e.querySelectorAll(rn$2.tagSidebarRow)){let e=ob(r),i=db(r);if(e===null||i===null||n.has(i))continue;n.add(i);let a=(r.querySelector(rn$2.tagCount)?.textContent??``).replace(Py,``);t.push({tag:i,kind:e,count:a.length===0?0:Number(a)});}return t}function pb(e){let t=e.querySelector(rn$2.imageList);if(t===null)return [];let n=[];for(let e of t.querySelectorAll(rn$2.thumb)){let t=Number(cn$2(e)??NaN),r=e.querySelector(rn$2.previewImage),i=r?.getAttribute(`src`)??``;Number.isFinite(t)&&r!==null&&i.length!==0&&n.push({id:t,thumb:i,tags:Ct(e),video:r.classList.contains(Ly)});}return n}function mb(e){return 1/Math.log(zy+(e>0?e:By))}function hb(e,t,n){let r=new Map(e.map(e=>[e.tag,mb(e.count)])),i=[];for(let e of t){if(e.id===n)continue;let t=0,a=0;for(let n of new Set(e.tags)){let e=r.get(n);e!==void 0&&(t+=1,a+=e);}i.push({...e,shared:t,score:a});}return i.sort((e,t)=>t.score-e.score||t.shared-e.shared||t.id-e.id)}function gb(e,t){return e.filter(e=>e.kind!==`metadata`&&e.count>0).sort((e,t)=>e.count-t.count).slice(0,t)}function _b(e){return e.replaceAll(`_`,` `)}function vb(e){let t=e.filter(e=>e.kind===`general`&&e.count>=Ky&&!Yy.has(e.tag)),n=t.filter(e=>e.count>=Qy);return (n.length>=$y?n:t).sort((e,t)=>e.count-t.count).slice(0,8).map(e=>e.tag)}function yb(e){return e.split(`_`).sort().join(`_`)}function bb(e,t){let n=t===`copyright`?Xy:Zy,r=new Map;for(let i of e){if(i.kind!==t||n.has(i.tag))continue;let e=yb(i.tag),a=r.get(e);(a===void 0||i.count>a.count)&&r.set(e,i);}return [...r.values()]}function xb(e,t){return [e.length>1?[Hy,e.join(` ${Wy} `),Uy].join(Iy):e[0]??``,...t.map(e=>`${Jy}${e}`)].join(Iy)}function Sb(e,t){let n=0;for(let r of e)t.includes(r.tag)&&r.count>n&&(n=r.count);return n}function Cb(e,t){let n=Math.min(20,Math.floor(e/42));return n>1?Math.floor(t()*n)*42:0}function wb(e,t){let n=[...e];for(let e=n.length-1;e>0;--e){let r=Math.floor(t()*(e+1)),i=n[e],a=n[r];i!==void 0&&a!==void 0&&(n[e]=a,n[r]=i);}return n}function Tb(e,t,n){return (t?[...e]:wb(e,n)).slice(0,5)}function Eb(e,t,n){let r=[],i=[];for(let n of e)(t.filter(e=>n.tags.includes(e)).length>=Vy?r:i).push(n);return [...wb(r,n),...wb(i,n)]}function Db(e,t){return [...e,...t.map(e=>`${Jy}${e}`)].join(Iy)}function Ob(e){let t=e.filter(e=>e.kind===`artist`).map(e=>e.tag),n=[],r=vb(e);r.length>0&&n.push({key:rb,kind:`similar`,name:ab,tags:r,without:t});for(let r of [`character`,`copyright`])for(let i of bb(e,r))n.push({key:`${r}:${i.tag}`,kind:r,name:_b(i.tag),tags:[i.tag],without:t});return n.push({key:nb,kind:`favorites`,name:ib,tags:[],without:[]}),n}function kb(e,t,n){let r=new Set(t.filter(e=>e.kind===`artist`||e.kind===`character`).map(e=>e.tag)),i=new Set(gb(t,tb).map(e=>e.tag)),a=[];for(let t of e){let e=t.tags.toLowerCase().split(/\s+/).filter(e=>e.length>0);(r.size>0?e.some(e=>r.has(e)):e.filter(e=>i.has(e)).length>=eb)&&t.thumb.length>0&&a.push({id:t.id,thumb:t.thumb,tags:e,video:false});}return hb(t,a,n).slice(0,42)}function Ab(e,t=0){let n=new URLSearchParams;return n.set(`page`,`post`),n.set(`s`,`list`),n.set(le$1,e),t>0&&n.set(Gy,String(t)),`${re$1}/index.php?${n.toString()}`}function jb(e){return `index.php?page=post&s=view&id=${String(e)}`}async function Mb(e,t=0){let n;try{n=await fetch(Ab(e,t),{method:`GET`,credentials:be$2});}catch(e){throw new jy(`offline`,e instanceof Error?e.message:`network`)}if(n.status===Ry)throw new jy(`limited`,`HTTP ${String(n.status)}`);if(!n.ok)throw new jy(`failed`,`HTTP ${String(n.status)}`);let r=await n.text();return pb(new DOMParser().parseFromString(r,`text/html`))}var Nb=`more-like-this`,Pb=`Related posts tab`,Fb=`Loads posts when you open the tab: one request per source.`,Ib=`more-like-this-source`,Lb=`Related posts`,Rb=`None of your favorites share tags with this post.`,zb=`Couldn't load: no connection.`,Bb=`The site asked to slow down. Try again in a minute.`,Vb=`Couldn't load: the site did not answer as expected.`,Hb=`Try again`,Ub=`Where the posts come from`,Wb=`Mixed from: `,Gb=`↻ Another mix`,Kb=`Other posts by these or other rare tags of this post`,qb=`Search these tags`,Jb=`Favorites`,Yb=`▶`,Xb=`→`,Zb=`…`,Qb=10,$b=1e3,ex=150,tx=26,nx=6,rx=`rdw-mlt-switch`,ix=`rdw-mlt-measure`,ax=`rdw-mlt-chip`,ox=`rdw-mlt-chip-count`,sx=`[role="radio"]:not(:disabled)`,cx=`ArrowLeft`,lx=`ArrowRight`,ux=`More sources`,dx=240,fx=`▾`,px=`body.${Kt$2(Nb)}`,mx=`rdw-mlt`,J=`${px} #${Gt$2} .${mx}`,hx=`
${J} {
  display: grid;
  gap: 10px;
  min-width: 0;
}
${J} .${rx} {
  position: relative;
}
${J} .rdw-mlt-sources {
  display: flex;
  flex-wrap: wrap;
  gap: ${String(nx)}px;
}
${J} .${ax} {
  box-sizing: border-box;
  max-width: 100%;
  height: ${String(tx)}px;
  padding: 0 11px;
  overflow: hidden;
  border: 1px solid var(--rdw-border);
  border-radius: ${String(tx/2)}px;
  background: transparent;
  color: var(--rdw-text);
  font: inherit;
  font-size: 12px;
  line-height: 24px;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}
${J} .${ax}:hover:not(:disabled) {
  border-color: var(--rdw-muted);
}
${J} .${ax}[aria-checked="true"] {
  border-color: var(--rdw-accent);
  background: var(--rdw-accent-soft);
  color: var(--rdw-accent);
  font-weight: 600;
}
${J} .${ax}:disabled {
  opacity: 0.55;
  cursor: default;
}
${J} .${ox} {
  color: var(--rdw-muted);
  font-weight: 400;
}
${J} .${ix} {
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  visibility: hidden;
  pointer-events: none;
  height: 0;
  overflow: hidden;
}
${J} .${ix} .${ax} {
  flex: none;
  max-width: none;
  font-weight: 600;
}
${px} .rdw-mlt-menu {
  padding: 4px;
  gap: 0;
}
${px} .rdw-mlt-menu button {
  display: block;
  box-sizing: border-box;
  width: 100%;
  min-height: 28px;
  padding: 0 8px;
  overflow: hidden;
  border: 0;
  border-radius: var(--rdw-radius-s);
  background: transparent;
  color: var(--rdw-text);
  font: 12px/1.35 var(--rdw-font);
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}
${px} .rdw-mlt-menu button:hover {
  background: var(--rdw-surface-2);
}
${J} .rdw-mlt-mix {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}
${J} .rdw-mlt-mix .rdw-mlt-link {
  flex: none;
}
${J} .rdw-mlt-line {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 12px;
}
${J} .rdw-mlt-link {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--rdw-accent);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  text-decoration: none;
}
${J} .rdw-mlt-link:hover:not(:disabled) {
  text-decoration: underline;
}
${J} .rdw-mlt-link:disabled {
  color: var(--rdw-muted);
  cursor: default;
}
${J} .rdw-mlt-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
${J} .rdw-mlt-cell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: ${String(ex)}px;
  overflow: hidden;
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-surface-2);
}
${J} .rdw-mlt-cell img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
${J} .rdw-mlt-video {
  position: absolute;
  left: 6px;
  bottom: 6px;
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--rdw-surface);
  color: var(--rdw-text);
  font-size: 10px;
  line-height: 1.4;
}
${J} .rdw-mlt-foot {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
@media (prefers-reduced-motion: no-preference) {
  ${J} .rdw-mlt-cell[data-waiting] {
    animation: rdw-mlt-wait 1.2s ease-in-out infinite alternate;
  }
}
@keyframes rdw-mlt-wait {
  from { opacity: 0.45; }
  to { opacity: 1; }
}
`.trim();function gx(e){return e===`similar`||e===`character`||e===`copyright`||e===`favorites`}function _x(e){return e.kind===`similar`?`Mixing similar posts${Zb}`:e.kind===`favorites`?`Looking through your favorites${Zb}`:`Loading posts with ${e.name}${Zb}`}function vx(e){return e.kind===`favorites`?Rb:e.kind===`similar`?`No posts by other artists with these tags.`:`No posts with ${e.name} by other artists.`}function yx(e){return e===`offline`?zb:e===`limited`?Bb:Vb}function bx(e){return `${String(e)} shared ${e===1?`tag`:`tags`}`}function xx(e){return `Few shared tags \u2014 this post has only ${String(e)} ${e===1?`tag`:`tags`}.`}function Sx(e){return `${Wb}${e.map(e=>e.replaceAll(`_`,` `)).join(`, `)}`}function Cx(e,t,n){let r=0,i=0;for(let a of e)r===0||i+n+a>t?(r+=1,i=a):i+=n+a;return r}function wx(e,t,n,r,i){let a=e.length;if(r<=0)return a;let o=n===null?[]:[n];for(let n=a;n>=1;--n)if(Cx([...e.slice(0,n),...n<a?[t]:[],...o],r,i)<=2)return n;return Math.min(1,a)}function Tx(e){return `${String(e)} more ${fx}`}function Ex(e,t,n){if(t===null||t>=e.length)return [...e];let r=e.slice(0,Math.max(1,t)),i=e.find(e=>e.key===n);return i!==void 0&&!r.includes(i)&&(r[r.length-1]=i),r}function Dx(e,t){let n=e.filter(e=>e.kind!==`favorites`);return n.find(e=>e.kind===t)??n[0]??null}function Ox(){return new Promise(e=>{window.setTimeout(e,qy);})}function kx(e){let t=Ob(e.tags),[n,r]=z$2(null),[i,a]=z$2({}),[o,s]=z$2(null),[c,l]=z$2([]),[,u]=z$2(0),[d,f]=z$2(null),p=V$2(null),[m,h]=z$2(false),g=V$2(null),_=V$2(null),v=e.now??Date.now,y=e.random??Math.random,{readFavorites:b}=e,x=(e,t)=>{let n=t instanceof jy?t.failure:`failed`;a(t=>({...t,[e]:{state:`error`,failure:n,at:v()}}));},S=(t,n)=>{let r=Tb(t.tags,n,y),i=xb(r,t.without),o=Cb(Sb(e.tags,r),y);a(e=>({...e,[t.key]:{state:`loading`}})),l(e=>e.filter(e=>e!==t.key)),(async()=>{let t=await e.load(i,o);return t.length>0||o===0?t:(await(e.pause??Ox)(),e.load(i,0))})().then(e=>{a(n=>({...n,[t.key]:{state:`ready`,posts:Eb(e,r,y),query:i,mixed:r}}));}).catch(e=>{x(t.key,e);});},C=(t,n)=>{r(t.key),n&&e.onPick(t.kind);let o=i[t.key];if(t.kind===`favorites`||o!==void 0&&o.state!==`error`)return;if(t.kind===`similar`){S(t,true);return}let s=Db(t.tags,t.without);a(e=>({...e,[t.key]:{state:`loading`}})),e.load(s,0).then(e=>{a(n=>({...n,[t.key]:{state:`ready`,posts:e,query:s,mixed:[]}}));}).catch(e=>{x(t.key,e);});};B$2(()=>{let n=Dx(t,e.lastKind);n!==null&&C(n,false);},[]),B$2(()=>{if(b===null){s([]);return}let e=true;return b().then(t=>{e&&s(t);}).catch(()=>{e&&s([]);}),()=>{e=false;}},[b]);let w=t.find(e=>e.key===n),T=w===void 0?void 0:w.kind===`favorites`?o===null?{state:`loading`}:{state:`ready`,posts:o,query:``,mixed:[]}:i[w.key],ee=T?.state===`error`&&T.failure===`limited`?Math.max(0,60-Math.floor((v()-T.at)/$b)):0,te=ee>0;B$2(()=>{if(!te)return;let e=window.setInterval(()=>{u(e=>e+1);},$b);return ()=>{window.clearInterval(e);}},[te]);let ne=Object.values(i).some(e=>e.state===`loading`),re=t.filter(e=>e.kind!==`favorites`),ie=t.find(e=>e.kind===`favorites`),ae=Ex(re,d,n),oe=re.filter(e=>!ae.includes(e)),se=ie===void 0||o===null||o.length===0?null:o.length;Ie$2(()=>{let e=g.current?.querySelector(`.rdw-mlt-sources`),t=p.current;if(!(e instanceof HTMLElement)||t===null)return;let n=e=>[...t.querySelectorAll(e)].map(e=>e instanceof HTMLElement?e.offsetWidth:0),r=wx(n(`[data-measure-tag]`),n(`[data-measure-more]`)[0]??0,n(`[data-measure-favorites]`)[0]??null,e.clientWidth,nx);f(e=>e===r?e:r);});let E=e=>{let t=e.key===lx?1:e.key===cx?-1:0,n=e.target,r=e.currentTarget;if(t===0||!(n instanceof HTMLElement)||!(r instanceof HTMLElement))return;let i=[...r.querySelectorAll(sx)],a=i[i.indexOf(n)+t];a instanceof HTMLElement&&(e.preventDefault(),a.focus());},D=(e,t)=>K$3(`button`,{type:`button`,role:`radio`,className:`${ax} rdw-kit-focusable`,"aria-checked":n===e.key,disabled:ne&&n!==e.key,onClick:()=>{C(e,true);},children:[t===null?e.name:`${Jb} `,t===null?null:K$3(`span`,{className:ox,children:String(t)})]},e.key),ce=w!==void 0&&c.includes(w.key),le=T?.state===`ready`?T.posts:[],ue=ce?le:le.slice(0,6);return K$3(`div`,{className:mx,children:[K$3(`div`,{ref:g,className:rx,children:[K$3(`div`,{className:ix,ref:p,"aria-hidden":`true`,children:[re.map(e=>K$3(`span`,{className:ax,"data-measure-tag":``,children:e.name},e.key)),K$3(`span`,{className:ax,"data-measure-more":``,children:Tx(re.length)}),se===null?null:K$3(`span`,{className:ax,"data-measure-favorites":``,children:[`${Jb} `,K$3(`span`,{className:ox,children:String(se)})]})]}),K$3(`div`,{className:`rdw-mlt-sources`,role:`radiogroup`,"aria-label":Ub,onKeyDown:E,children:[ae.map(e=>D(e,null)),oe.length>0?K$3(`button`,{type:`button`,className:`${ax} rdw-kit-focusable`,"aria-haspopup":`menu`,"aria-expanded":m,disabled:ne,onClick:()=>{h(e=>!e);},children:Tx(oe.length)}):null,ie===void 0||se===null?null:D(ie,se)]}),K$3(Bn$1,{open:m,onClose:()=>{h(false);},anchorRef:g,widthPx:dx,role:`menu`,"aria-label":ux,className:`rdw-mlt-menu`,children:oe.map(e=>K$3(`button`,{type:`button`,role:`menuitem`,className:`rdw-kit-focusable`,onClick:()=>{h(false),C(e,true);},children:e.name},e.key))})]}),w?.kind===`similar`&&T?.state===`ready`?K$3(`div`,{className:`rdw-mlt-mix`,children:[K$3(`p`,{className:`rdw-mlt-line`,children:Sx(T.mixed)}),K$3(`button`,{type:`button`,className:`rdw-mlt-link`,title:Kb,disabled:ne,onClick:()=>{S(w,false);},children:Gb})]}):null,w===void 0||T===void 0?null:T.state===`loading`?K$3(A$2,{children:[K$3(`p`,{className:`rdw-mlt-line`,role:`status`,children:_x(w)}),K$3(`div`,{className:`rdw-mlt-grid`,"aria-hidden":`true`,children:Array.from({length:6},(e,t)=>K$3(`span`,{className:`rdw-mlt-cell`,"data-waiting":``},t))})]}):T.state===`error`?K$3(`p`,{className:`rdw-mlt-line`,role:`alert`,children:[yx(T.failure),` `,K$3(`button`,{type:`button`,className:`rdw-mlt-link`,disabled:te,onClick:()=>{C(w,false);},children:te?`${Hb} (${String(ee)})`:Hb})]}):le.length===0?K$3(`p`,{className:`rdw-mlt-line`,role:`status`,children:vx(w)}):K$3(A$2,{children:[e.tags.length<Qb?K$3(`p`,{className:`rdw-mlt-line`,children:xx(e.tags.length)}):null,K$3(`div`,{className:`rdw-mlt-grid`,ref:_,children:ue.map(e=>K$3(`a`,{className:`rdw-mlt-cell`,href:jb(e.id),title:bx(e.shared),children:[K$3(`img`,{src:e.thumb,alt:`${w.name} #${String(e.id)}`,loading:`lazy`}),e.video?K$3(`span`,{className:`rdw-mlt-video`,"aria-hidden":`true`,children:Yb}):null]},e.id))}),K$3(`div`,{className:`rdw-mlt-foot`,children:[!ce&&le.length>6?K$3(`button`,{type:`button`,className:`rdw-mlt-link`,onClick:()=>{l(e=>[...e,w.key]),window.setTimeout(()=>{let e=_.current?.querySelectorAll(`a`)[6];e instanceof HTMLElement&&e.focus();},0);},children:`Show all ${String(le.length)}`}):K$3(`span`,{}),w.kind===`favorites`?null:K$3(`a`,{className:`rdw-mlt-link`,href:Ab(T.query),children:`${w.kind===`similar`?qb:`Search ${w.name}`} ${Xb}`})]})]})]})}var Ax={id:Nb,label:Pb,pages:[`post`],defaultEnabled:true,settingsCaption:Fb,css:hx,mount:()=>void 0},jx=`seen-dim`,Mx=`rdw-seen`,Nx=`Dim seen posts`,Px=`0.65`,Fx=`1`,Ix=`pageshow`,Lx,Rx=false;function zx(e=document){let t=G$4().marks,n=e.querySelectorAll(rn$2.thumb);for(let e of n){if(!(e instanceof HTMLElement))continue;let n=cn$2(e);n!==null&&e.classList.toggle(Mx,t[n]?.seen===true);}}function Bx(e){e.persisted&&(K$4(),zx(document));}function Vx(){Lx===void 0&&(Lx=ot$4(e=>{zx(e);})),Rx||(Rx=true,window.addEventListener(Ix,Bx));}function Hx(e){if(e.pageKind===`post`){let t=Ji(e.search);if(t===null){m$2.warn(`seen-dim: missing post id in search`,e.search);return}Ec$1(t);}else e.pageKind===`list`&&(zx(document),Vx());}var Ux={id:jx,label:Nx,pages:[`list`,`post`],defaultEnabled:true,cssOnly:true,css:`
body.${Kt$2(jx)} .${Mx} img.preview {
  opacity: ${Px};
}

body.${Kt$2(jx)} .${Mx}:hover img.preview {
  opacity: ${Fx};
}
`,mount:Hx},Wx=`image-zoom`,Gx=`Zoom the picture on click`,Kx=Kt$2(Wx),qx=`rdw-image-viewer`,Jx=`rdw-image-viewer-stage`,Yx=`rdw-image-viewer-image`,Xx=`rdw-image-viewer-bar`,Zx=`rdw-image-viewer-button`,Qx=`rdw-image-viewer-scale`,$x=`rdw-image-viewer--dragging`,eS=2147483e3,tS=24,nS=1.2,rS=4,iS=`Picture viewer`,aS=`Zoom in`,oS=`Zoom out`,sS=`Fit to window`,cS=`Actual size`,lS=`Close`,uS=`+`,dS=`−`,fS=`Fit`,pS=`1:1`,mS=`✕`,hS=`
body.${Kx} img#${_v} {
  cursor: zoom-in;
}
#${qx} {
  position: fixed;
  inset: 0;
  z-index: ${String(eS)};
  background: rgba(0, 0, 0, 0.88);
  overflow: hidden;
  touch-action: none;
  cursor: grab;
}
#${qx}.${$x} {
  cursor: grabbing;
}
#${qx} .${Jx} {
  position: absolute;
  inset: 0;
}
#${qx} .${Yx} {
  position: absolute;
  left: 50%;
  top: 50%;
  max-width: none;
  max-height: none;
  transform-origin: center;
  user-select: none;
  -webkit-user-drag: none;
}
#${qx} .${Xx} {
  position: absolute;
  left: 50%;
  bottom: 16px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-l);
  background: var(--rdw-surface);
  color: var(--rdw-text);
  font: 12px var(--rdw-font);
  cursor: default;
}
#${qx} .${Zx} {
  min-width: 30px;
  height: 28px;
  padding: 0 8px;
  border: 0;
  border-radius: var(--rdw-radius-s);
  background: transparent;
  color: var(--rdw-text);
  font: 600 12px var(--rdw-font);
  cursor: pointer;
}
#${qx} .${Zx}:hover,
#${qx} .${Zx}:focus-visible {
  background: var(--rdw-surface-2);
}
#${qx} .${Zx}:focus-visible {
  outline: 2px solid var(--rdw-accent);
  outline-offset: -2px;
}
#${qx} .${Qx} {
  min-width: 44px;
  text-align: center;
  color: var(--rdw-muted);
  font-variant-numeric: tabular-nums;
}
`.trim();function gS(e,t,n,r){if(e<=0||t<=0)return 1;let i=Math.max(1,n-48),a=Math.max(1,r-48);return Math.min(1,i/e,a/t)}var _S=2;function vS(e,t,n,r){let i=gS(e,t,n,r);if(e<=0||t<=0)return {scale:i,x:0,y:0};let a=Math.min(1,Math.max(1,n-48)/e),o=t*a;return a<=i||o<r*_S?{scale:i,x:0,y:0}:{scale:a,x:0,y:(o-r)/2+tS}}function yS(e,t,n){let r=e*t-n;return r>0?r/2+tS:0}function bS(e,t,n){return e*t>n}function xS(e,t,n,r){let i=yS(n,e.scale,r);return i===0?{...e,y:0}:{...e,y:Math.min(i,Math.max(-i,e.y-t))}}function SS(e,t){return Math.min(8,Math.max(t,e))}function CS(e,t,n,r,i){let a=SS(e.scale*t,i),o=a/e.scale;return a===i?{scale:a,x:0,y:0}:{scale:a,x:n-(n-e.x)*o,y:r-(r-e.y)*o}}var wS=null;function TS(e){let{state:t}=e;e.image.style.transform=`translate(-50%, -50%) translate(${String(t.x)}px, ${String(t.y)}px) scale(${String(t.scale)})`,e.scaleLabel.textContent=`${String(Math.round(t.scale*100))}%`;}function ES(e,t){e.fit=gS(e.image.naturalWidth,e.image.naturalHeight,window.innerWidth,window.innerHeight),e.state=t?{scale:e.fit,x:0,y:0}:{...e.state,scale:SS(e.state.scale,e.fit)},TS(e);}function DS(e,t,n,r){e.state=CS(e.state,t,n,r,e.fit),TS(e);}function OS(){if(wS===null)return;let{root:e,opener:t}=wS;wS=null,e.remove(),document.removeEventListener(`keydown`,kS,true),window.removeEventListener(`resize`,MS),t?.focus();}function kS(e){if(wS!==null){if(e.key===`Escape`)e.preventDefault(),e.stopPropagation(),OS();else if(e.key===`+`||e.key===`=`)DS(wS,nS,0,0);else if(e.key===`-`)DS(wS,1/nS,0,0);else if(e.key===`0`)ES(wS,true);else {let t=AS.get(e.key);t!==void 0&&jS(wS,t*window.innerHeight)&&e.preventDefault();}}}var AS=new Map([[`ArrowDown`,.15],[`ArrowUp`,-0.15],[`PageDown`,.9],[`PageUp`,-0.9],[` `,.9],[`End`,2**53-1],[`Home`,-9007199254740991]]);function jS(e,t){let n=e.image.naturalHeight;return bS(n,e.state.scale,window.innerHeight)?(e.state=xS(e.state,t,n,window.innerHeight),TS(e),true):false}function MS(){wS!==null&&ES(wS,false);}function NS(e,t,n){let r=document.createElement(`button`);return r.type=`button`,r.className=Zx,r.textContent=e,r.setAttribute(`aria-label`,t),r.title=t,r.addEventListener(`click`,e=>{e.stopPropagation(),n();}),r}function PS(e,t){OS();let n=document.createElement(`div`);n.id=qx,n.setAttribute(`role`,`dialog`),n.setAttribute(`aria-modal`,`true`),n.setAttribute(`aria-label`,iS),n.tabIndex=-1;let r=document.createElement(`div`);r.className=Jx;let i=document.createElement(`img`);i.className=Yx,i.alt=``,i.draggable=false,r.append(i);let a=document.createElement(`span`);a.className=Qx;let o=document.createElement(`div`);o.className=Xx;let s={root:n,image:i,scaleLabel:a,opener:t,state:{scale:1,x:0,y:0},fit:1};o.append(NS(dS,oS,()=>{DS(s,1/nS,0,0);}),a,NS(uS,aS,()=>{DS(s,nS,0,0);}),NS(fS,sS,()=>{ES(s,true);}),NS(pS,cS,()=>{s.state={scale:SS(1,s.fit),x:0,y:0},TS(s);}),NS(mS,lS,OS)),o.addEventListener(`pointerdown`,e=>{e.stopPropagation();}),n.append(r,o),i.addEventListener(`load`,()=>{ES(s,true),s.state=vS(i.naturalWidth,i.naturalHeight,window.innerWidth,window.innerHeight),TS(s);}),i.src=e,n.addEventListener(`wheel`,e=>{if(e.preventDefault(),!e.ctrlKey&&jS(s,e.deltaY))return;let t=e.clientX-window.innerWidth/2,n=e.clientY-window.innerHeight/2;DS(s,e.deltaY<0?nS:1/nS,t,n);},{passive:false});let c=null;n.addEventListener(`pointerdown`,e=>{e.button===0&&(c={startX:e.clientX,startY:e.clientY,x:s.state.x,y:s.state.y,moved:false},n.setPointerCapture?.(e.pointerId));}),n.addEventListener(`pointermove`,e=>{if(c===null)return;let t=e.clientX-c.startX,r=e.clientY-c.startY;!c.moved&&Math.hypot(t,r)<rS||(c.moved=true,n.classList.add($x),s.state={...s.state,x:c.x+t,y:c.y+r},TS(s));}),n.addEventListener(`pointerup`,e=>{let t=c;c=null,n.classList.remove($x),t!==null&&!t.moved&&e.target!==i&&OS();}),n.addEventListener(`dblclick`,e=>{if(e.target===i){if(s.state.scale>s.fit)ES(s,true);else {let t=e.clientX-window.innerWidth/2,n=e.clientY-window.innerHeight/2;DS(s,1/s.state.scale,t,n);}}}),wS=s,document.body.append(n),document.addEventListener(`keydown`,kS,true),window.addEventListener(`resize`,MS),TS(s),n.focus();}function FS(e){if(!document.body.classList.contains(Kx))return;let t=e.target;if(!(t instanceof HTMLImageElement)||t.id!==`image`||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault(),e.stopPropagation();let n=zv()?.href??``;PS(n.length>0?n:t.currentSrc||t.src,t);}var IS=false;function LS(e){IS||(IS=true,document.addEventListener(`click`,FS,true));}var RS={id:Wx,label:Gx,pages:[`post`],defaultEnabled:true,cssOnly:true,settingsCaption:`Pictures and GIFs. Scroll to zoom, drag to move, Esc to close.`,css:hS,mount:LS},zS=`infinite-scroll`,BS=`Infinite scroll`,VS=[`list`],HS=Kt$2(zS),US=2,WS=1e3,GS=`rdw-infinite-sentinel`,KS=`rdw-infinite-status`,qS=`rdw-infinite-page`,JS=`rdw-infinite-retry`,YS=`rdw-blacklisted`,XS=`Loading…`,ZS=`End of results`,QS=`Failed to load more`,$S=`Retry`,eC=`Paused: the last pages added nothing to the screen`,tC=`Load more`,nC=`Page `,rC=`div.pagination a[alt="next"]`,iC=`infinite-scroll: missing image-list or next link; not mounted`,aC=`score:`,oC=`rating:`,sC=`
body.${HS} .${GS} {
  display: block;
  width: 100%;
  height: 1px;
  margin: 0;
  padding: 0;
  border: 0;
  pointer-events: none;
}
body.${HS} .${KS} {
  display: block;
  width: 100%;
  margin: 0.75rem 0;
  text-align: center;
  font-size: 0.875rem;
  line-height: 1.4;
}
body.${HS} .${qS} {
  display: block;
  width: 100%;
  margin: 0.75rem 0 0.5rem;
  text-align: center;
  font-size: 0.8125rem;
  font-weight: 600;
  opacity: 0.75;
}
body.${HS} .${JS} {
  margin-left: 0.5rem;
  color: inherit;
  background: transparent;
  border: 1px solid currentColor;
  border-radius: 2px;
  padding: 0.15rem 0.5rem;
  cursor: pointer;
  font: inherit;
}
body.${HS} .${JS}:focus-visible {
  outline: 2px solid var(--rdw-accent);
  outline-offset: 2px;
}
body.${HS} span.thumb.${YS} {
  display: none !important;
}
`.trim();function cC(e){return new Promise(t=>{window.setTimeout(t,e);})}function lC(){let e=document.querySelector(rC);if(!(e instanceof HTMLAnchorElement))return null;let t=e.getAttribute(`href`);if(t===null||t.length===0||t===`#`)return null;try{return new URL(t,window.location.href).href}catch{return null}}function uC(e){let t=e.querySelector(rn$2.previewImage),n=t?.getAttribute(`title`)?.trim()??``,r=t?.getAttribute(`alt`)?.trim()??``,i=n.length>0?n:r;if(i.length===0)return {tags:[],score:0,rating:``};let a=[],o=0,s=``;for(let e of i.split(/\s+/)){if(e.length===0)continue;let t=e.toLowerCase();if(t.startsWith(aC)){let t=e.slice(6),n=Number(t);Number.isFinite(n)&&(o=n);}else t.startsWith(oC)?s=e.slice(7):a.push(e);}return {tags:a,score:o,rating:s}}function dC(){let e=new Set,t=document.querySelectorAll(rn$2.thumb);for(let n of t)n.id.length>0&&e.add(n.id);return e}function fC(e,t){if(!(e instanceof HTMLElement))return;let n=uC(e);Ta(n.tags,n.score,n.rating,t)&&e.classList.add(YS);}function pC(e){let t=document.createElement(`div`);return t.className=qS,t.textContent=`${nC}${String(e)}`,t}function mC(e){let t=document.createElement(`div`);t.className=GS,t.setAttribute(`aria-hidden`,`true`);let n=document.createElement(`div`);return n.className=KS,n.setAttribute(`role`,`status`),n.setAttribute(`aria-live`,`polite`),e.after(t,n),{sentinel:t,status:n}}function hC(e){e.replaceChildren(),e.textContent=XS;}function gC(e){e.replaceChildren(),e.textContent=ZS;}function _C(e,t){e.replaceChildren();let n=document.createElement(`span`);n.textContent=QS;let r=document.createElement(`button`);r.type=`button`,r.className=JS,r.textContent=$S,r.addEventListener(`click`,e=>{e.preventDefault(),t();}),e.append(n,r);}function vC(e,t){e.replaceChildren();let n=document.createElement(`span`);n.textContent=eC;let r=document.createElement(`button`);r.type=`button`,r.className=JS,r.textContent=tC,r.addEventListener(`click`,e=>{e.preventDefault(),t();}),e.append(n,r);}function yC(){return document.documentElement.scrollHeight}function bC(e){e.replaceChildren();}function xC(){return US*window.innerHeight}function SC(){return `${String(xC())}px`}function CC(e){let t=e.getBoundingClientRect(),n=xC(),r=window.innerHeight+n,i=-n;return t.top<r&&t.bottom>i}function wC(e){if(document.body.classList.contains(`rdw-feed-merged`))return;let t=document.querySelector(rn$2.imageList);if(t===null){m$2.warn(iC);return}let n=lC();if(n===null){m$2.warn(iC);return}let{sentinel:r,status:i}=mC(t),a=false,o=0,s=1,c=false,l=0,u=null,d=()=>{c=true,n=null,gC(i),u!==null&&(u.disconnect(),u=null);},f=async e=>{X$1(et()??`posts`);let n=await Hg(e),r=0,i=[];s+=1,t.append(pC(s));let a=dC(),o=Ca();for(let e of n.thumbs){if(e.id.length>0&&a.has(e.id))continue;let n=document.importNode(e,true);n.id.length>0&&a.add(n.id),fC(n,o),t.append(n),i.push(n),r+=1;}return st$4(t,i),{nextUrl:n.nextUrl,added:r}},p=async e=>{if(c||a||n===null)return;a=true;let t=e?.bypassRateLimit===true;try{for(;!c&&n!==null&&(e?.single===!0||CC(r));){let r=Date.now()-o;if(!t&&o>0&&r<WS){await cC(WS-r);continue}t=!1;let a=n;o=Date.now(),hC(i);try{let t=yC(),r=await f(a);if(n=r.nextUrl,bC(i),n===null){d();return}let o=t===0||yC()>t,s=r.added>0&&o;l=s?0:l+1;let c=e?.single===!0;if(l>=2||c&&!s){l=0,vC(i,()=>{p({bypassRateLimit:!0,single:!0});});return}if(c)return}catch(e){m$2.warn(`infinite-scroll: fetch failed`,a,e),_C(i,()=>{p({bypassRateLimit:!0});});return}}}finally{a=false;}};u=new IntersectionObserver(e=>{for(let t of e)if(t.isIntersecting){p();break}},{root:null,rootMargin:SC(),threshold:0}),u.observe(r);}var TC={id:zS,label:BS,pages:[...VS],defaultEnabled:true,css:sC,mount:wC},EC=`playlist-bar`,DC=`Collection header`,OC=[`list`],kC=`rdw-playlist-bar`,AC=`rdw-playlist-bar`,jC=`rdw-playlist-bar-title`,MC=`rdw-playlist-bar-name`,NC=`rdw-playlist-bar-back`,PC=`rdw-playlist-bar-kind`,FC=`← Collections`,IC=`Saved search`,LC=`rdw-playlist-bar-count`,RC=`rdw-playlist-bar-parts`,zC=`rdw-playlist-bar-part-label`,BC=`rdw-playlist-bar-part-link`,VC=`rdw-playlist-bar-caption`,HC=`rdw-dynamic-collection-bar`,UC=`rdw-dynamic-collection-actions`,WC=` posts`,GC=`Part `,KC=` of `,qC=`Posts are ordered by the site (newest first).`,JC=`Previous`,YC=`Next`,XC=`Shuffle`,ZC=`Original order`,QC=`Edit query`,$C=`Query`,ew=`none`,tw=`edit-query`,nw=`rename`,rw=`delete`,iw=`fields`,aw=`confirm`,ow=`danger`,sw=`name`,cw=`query`,lw=`secondary`,uw=`danger-quiet`,dw=`s`,fw=18,pw=8,mw=`playlist-bar: image-list not found; playlist bar not mounted`,Y=Kt$2(EC),hw=`
body.${Y} .${AC} {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-width: 100%;
  margin: 0.5rem 0;
  color: var(--rdw-text);
  box-sizing: border-box;
}
body.${Y} .${jC} {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem 0.75rem;
  max-width: 100%;
  font: inherit;
  line-height: 1.3;
}
body.${Y} .${NC} {
  color: var(--rdw-muted);
  font-size: 12px;
  text-decoration: none;
}
body.${Y} .${NC}:hover {
  color: var(--rdw-text);
}
body.${Y} .${PC} {
  color: var(--rdw-muted);
  font-size: 12px;
}
body.${Y} .${MC} {
  font-size: ${String(fw)}px;
  font-weight: 700;
}
body.${Y} .${LC} {
  opacity: 0.85;
}
body.${Y} .${RC} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.75rem;
  max-width: 100%;
  font: inherit;
  line-height: 1.3;
}
body.${Y} .${zC} {
  flex: 0 0 auto;
}
body.${Y} a.${BC} {
  color: inherit;
  text-decoration: underline;
}
body.${Y} a.${BC}:focus-visible {
  outline: 2px solid var(--rdw-accent);
  outline-offset: 2px;
}
body.${Y} .${VC} {
  margin: 0;
  font: inherit;
  font-size: 0.875rem;
  line-height: 1.35;
  opacity: 0.8;
}
body.${Y} .${UC} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${String(pw)}px;
  max-width: 100%;
}
`.trim();function gw(e){return new URLSearchParams(e).get(`tags`)??``}function _w(e,t){if(e.length!==t.length)return  false;let n=new Set(e);if(n.size!==e.length)return  false;for(let e of t)if(!n.has(e))return  false;return  true}function vw(e,t){let n=new Set(e);for(let e of t)if(!n.has(e))return  false;return  true}function yw(e){let t=Bc$1(),n=[];for(let r of Zs$1()){let i=r.postIds??[];if(!vw(i,e))continue;let a=Co$1(i,t),o=-1;for(let t=0;t<a.length;t+=1){let n=a[t];if(n===void 0)continue;let r=wo$1(n);if(r!==null&&_w(e,r)){o=t;break}}n.push({playlist:r,partIndex:o,partQueries:a});}return n.length===0?null:n.find(e=>e.partIndex>=0)??n[0]??null}function bw(e){return oo$1(ro$1(e))}function xw(e){let t=e instanceof Document?e.getElementById(kC):e.querySelector(`#${kC}`);t!==null&&t.remove();}function Sw(e){return e.querySelector(rn$2.imageList)}function Cw(e){return e.querySelector(rn$2.postListContent)??e.querySelector(rn$2.contentRoot)}function ww(e,t,n){n!==null&&n.parentElement===e?e.insertBefore(t,n):n===null?e.insertBefore(t,e.firstChild):n.parentElement?.insertBefore(t,n);}function Tw(e){return `${String(e)}${WC}`}function Ew(e,t){return `${GC}${String(e+1)}${KC}${String(t)}`}function Dw(e,t,n){if(n===void 0)return;let r=document.createElement(`a`);r.className=BC,r.href=bw(n),r.textContent=t,e.append(r);}function Ow(e){let{partIndex:t,partQueries:n}=e;if(n.length===0||t<0)return null;let r=document.createElement(`div`);r.className=RC;let i=document.createElement(`span`);return i.className=zC,i.textContent=Ew(t,n.length),r.append(i),n.length>1&&(Dw(r,JC,n[t-1]),Dw(r,YC,n[t+1])),r}function kw(e){let t=document.createElement(`div`);t.id=kC,t.className=AC;let n=document.createElement(`div`);n.className=jC;let r=document.createElement(`span`);r.className=MC,r.textContent=e.playlist.name;let i=document.createElement(`span`);i.className=LC,i.textContent=Tw(e.playlist.postIds?.length??0),n.append(r,i),t.append(n);let a=Ow(e);a!==null&&t.append(a);let o=document.createElement(`p`);return o.className=VC,o.textContent=qC,t.append(o),t}function Aw(e){let t=Sw(document);if(t!==null){let n=t.parentElement;return n===null?(m$2.warn(mw),false):(ww(n,e,t),true)}let n=Cw(document);return n===null?(m$2.warn(mw),false):(m$2.warn(mw),ww(n,e,null),true)}function jw(e){return e.query===void 0?io$1(e.tags):e.query}function Mw(e){if(ko$1(e))return null;for(let t of G$4().collections){if(I$3(t))continue;let n=jw(t);if(!ko$1(n)&&No$1(e,n))return t}return null}function Nw(e){let t=Pt$2(window.location.hash);if(t===null)return null;for(let n of G$4().collections){if(n.id!==t||I$3(n))continue;let r=jw(n);return ko$1(r)?ko$1(e)?n:null:No$1(e,r)?n:null}return null}var Pw=`#`;function Fw(e){let t=Nt$3(e);for(let e of document.querySelectorAll(rn$2.paginationPageLink)){let n=e.getAttribute(`href`);n===null||n.includes(Pw)||e.setAttribute(`href`,`${n}${t}`);}}function Iw(e){let t=e instanceof Document?e.getElementById(HC):e.querySelector(`#${HC}`);t instanceof HTMLElement&&(ve$1(null,t),t.remove());}function Lw(e){return `${Fe$3.confirmDelete} (${e})`}function Rw(e,t){window.location.assign(`${oo$1(ro$1(e))}${Nt$3(t)}`);}function zw(e){let[t,n]=z$2(e.initialName),[r,i]=z$2(e.storedQuery),[a,o]=z$2(ew),[s,c]=z$2({name:e.initialName,query:e.storedQuery}),l=Ao$1(e.pageQuery);function u(){o(ew);}function d(e){c({name:t,query:r}),o(e);}function f(){l?window.location.reload():Rw(Mo$1(e.pageQuery),e.collectionId);}function p(){Rw(jo$1(e.pageQuery),e.collectionId);}function m(){if(ko$1(s.query))return;let t=Tc$1(e.collectionId,s.query);if(t===null)return;let n=t.query??io$1(t.tags);i(n),Rw(n,e.collectionId);}function h(){let t=s.name.trim();if(t.length===0)return;let r=Js$1(e.collectionId,t);r!==null&&(n(r.name),u());}function g(){if(!Ys$1(e.collectionId)){u();return}let t=document.getElementById(HC);t instanceof HTMLElement&&(t.remove(),ve$1(null,t));}let _=a===tw||a===nw,v=a===nw?Fe$3.rename:QC,y=a===nw?h:m;return ee(A$2,null,ee(`div`,{className:jC},ee(`a`,{className:NC,href:Ke$3},FC),ee(`span`,{className:MC},t),ee(`span`,{className:PC},IC)),ee(`div`,{className:UC},ee(J$3,{variant:lw,size:dw,onClick:f},XC),l?ee(J$3,{variant:lw,size:dw,onClick:p},ZC):null,ee(J$3,{variant:lw,size:dw,onClick:()=>{d(tw);}},QC),ee(J$3,{variant:lw,size:dw,onClick:()=>{d(nw);}},Fe$3.rename),ee(J$3,{variant:uw,size:dw,onClick:()=>{o(rw);}},Fe$3.delete)),_?ee(Sn$1,{variant:iw,open:true,title:v,fields:s,onFieldsChange:c,onSubmit:y,onClose:u,submitLabel:Fe$3.save,cancelLabel:Fe$3.cancel,nameLabel:Fe$3.nameLabel,queryLabel:$C,only:a===nw?sw:cw,renderQueryField:e=>ee(Nt,e)}):null,a===rw?ee(Sn$1,{variant:aw,open:true,title:Fe$3.delete,message:Lw(t),confirmLabel:Fe$3.confirm,cancelLabel:Fe$3.cancel,confirmTone:ow,onConfirm:g,onClose:u}):null)}var Bw=`0`;function Vw(e){let t=new URLSearchParams(e).get(`pid`);return t===null||t.length===0||t===Bw}function Hw(e,t,n){if(ko$1(t)||Ao$1(t)||!Vw(n))return;yc$1(e,xt(document,4));let r=Ot(document,t);r!==null&&bc$1(e,r),xc$1(e,St(document),true);}function Uw(e,t){let n=Nw(e),r=n??Mw(e);if(r!==null&&Hw(r.id,e,t),n===null)return;let i=n;Fw(i.id);let a=document.createElement(`div`);a.id=HC,a.className=AC,Aw(a)&&ve$1(ee(zw,{collectionId:i.id,initialName:i.name,storedQuery:jw(i),pageQuery:e}),a);}function Ww(e,t){Hw(e,gw(t),t);}var Gw=`hashchange`,Kw=false,qw=``;function Jw(e){Kw||(Kw=true,window.addEventListener(Gw,()=>{(Pt$2(window.location.hash)??``)!==qw&&Yw({...e,search:window.location.search});}));}function Yw(e){Jw(e),qw=Pt$2(window.location.hash)??``,xw(document),Iw(document);let t=gw(e.search),n=wo$1(t);if(n!==null){let e=yw(n);e!==null&&Aw(kw(e));}Uw(t,e.search);}var Xw={id:EC,label:DC,settingsCaption:`A bar over the grid of an opened dynamic collection: its name, Shuffle, Edit query, Rename and Delete.`,pages:[...OC],defaultEnabled:true,css:hw,mount:Yw},Zw=`rdw-post-deleted`,Qw=`rdw-post-deleted-icon`,$w=`rdw-post-deleted-title`,eT=`rdw-post-deleted-reason`,tT=`rdw-post-deleted-related`,nT=`rdw-post-deleted-md5-row`,rT=`rdw-post-deleted-md5`,iT=`rdw-post-deleted-copy`,aT=`rdw-post-panel-open-related`,oT=`This post was deleted`,sT=`The post was deleted`,cT=`Show related posts`,lT=`Reason: `,uT=`MD5 `,dT=`Copy`,fT=`Copied`,pT=`Copy the MD5 of the file`,mT=40,hT=12,gT=1500,_T=new Map([[`tos`,`Breaks the site’s terms of service`]]);function vT(e){let t=e.trim();return t.length===0?``:_T.get(t.toLowerCase())??`${lT}${t}`}function yT(e){let[t,n]=z$2(false);B$2(()=>{if(!t)return;let e=window.setTimeout(()=>{n(false);},gT);return ()=>{window.clearTimeout(e);}},[t]);let r=vT(e.reason);return K$3(A$2,{children:[K$3(Tt$2,{size:mT,className:Qw}),K$3(`p`,{className:$w,children:oT}),r.length>0?K$3(`p`,{className:eT,children:r}):null,e.showRelated?K$3(J$3,{variant:`primary`,size:`m`,className:tT,onClick:()=>{document.dispatchEvent(new CustomEvent(aT));},children:cT}):null,e.md5.length>0?K$3(`div`,{className:nT,children:[K$3(`span`,{className:rT,children:`${uT}${e.md5}`}),K$3(J$3,{variant:`ghost`,size:`s`,className:iT,"aria-label":pT,onClick:()=>{try{navigator.clipboard.writeText(e.md5).then(()=>{n(!0);},e=>{m$2.warn(`post-actions: MD5 not copied`,e);});}catch(e){m$2.warn(`post-actions: no clipboard`,e);}},children:[K$3(t?pt$2:Et$2,{size:hT}),t?fT:dT]})]}):null]})}var bT=`keydown`,xT=`input, textarea, select, [contenteditable], [role="dialog"], [role="listbox"], [role="menu"]`,ST=`[role="dialog"]`,CT=`video`;function wT(e){if(e.defaultPrevented||e.repeat||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||document.querySelector(ST)!==null)return  true;let t=e.composedPath()[0];return t instanceof Element?t.closest(xT)===null?t===document.body||t===document.documentElement?false:t.closest(CT)!==null||t.querySelector(CT)!==null:true:false}function TT(e,t,n){let r=V$2(n);r.current=n,B$2(()=>{if(!t)return;let n=t=>{t.code!==e||wT(t)||(t.preventDefault(),r.current());};return document.addEventListener(bT,n),()=>{document.removeEventListener(bT,n);}},[t,e]);}var ET=`rdw-post-panel-collection-queue`,DT=`rdw-post-panel-collection-queue-name`,OT=`rdw-post-panel-collection-queue-position`,kT=`rdw-post-panel-collection-queue-nav`,AT=`rdw-kit-focusable`,jT=`‹`,MT=`›`,NT=`Previous post in collection`,PT=`Next post in collection`,FT=`Collection queue`,IT=` / `,LT=-1,RT=1,zT=`hashchange`,BT=`click`,VT=0,HT=8,UT=600,WT=.55,GT=`${ce$1}=${ae$1}&s=${se$1}`,KT=`
${G$3}
.${ET} {
  display: flex;
  align-items: center;
  gap: ${String(HT)}px;
  min-width: 0;
}
.${DT} {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--rdw-accent);
  font-weight: ${String(UT)};
  text-decoration: none;
}
.${OT} {
  flex: 0 0 auto;
  color: var(--rdw-muted);
  font-variant-numeric: tabular-nums;
}
a.${kT},
button.${kT} {
  box-sizing: border-box;
  flex: 0 0 auto;
  display: inline-grid;
  place-items: center;
  width: 28px;
  height: 28px;
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
button.${kT}:disabled {
  opacity: ${String(WT)};
  cursor: not-allowed;
}
`;function qT(e){if(!e.startsWith(`#rdw-c=`))return null;let t=e.slice(We$3.length).trim();if(t.length===0)return null;try{return decodeURIComponent(t)}catch{return t}}function JT(){return window.location.hash}function YT(e){for(let t of Zs$1())if(t.id===e)return t.name;return null}function XT(e,t){for(let n=0;n<e.length;n+=1)if(e[n]===t)return n;return LT}function ZT(e,t){return `${ie$1}?${GT}&id=${String(e)}${t}`}function QT(e,t,n){if(t<0||t>=e.length)return null;let r=e[t];return r===void 0?null:ZT(r,n)}function $T(e,t){if(e===null)return null;let n=qT(t);if(n===null)return null;let r=_c$1(n);if(r===null)return null;let i=XT(r,e);if(i===LT)return null;let a=YT(n);if(a===null)return null;let o=i+RT;return {name:a,collectionHref:jt$3(n),positionLabel:`${String(o)}${IT}${String(r.length)}`,previousHref:QT(r,i-1,t),nextHref:QT(r,i+1,t)}}function eE(e){window.location.replace(e);}function tE(e){let t=`${kT} ${AT}`;if(e.href===null)return K$3(`button`,{type:`button`,className:t,disabled:true,"aria-label":e.label,title:e.label,children:e.glyph});let n=e.href;return K$3(`a`,{className:t,href:n,"aria-label":e.label,title:e.label,onClick:e=>{nE(e)&&(e.preventDefault(),eE(n));},children:e.glyph})}function nE(e){return e.button===VT&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey}function rE(e,t){let n=e.target;if(!(n instanceof Element))return null;for(let e of t)if(n.closest(e.selector)!==null)return e;return null}function iE(e,t,n){B$2(()=>{if(!n)return;let r=[{selector:rn$2.postPrevSearchLink,href:e},{selector:rn$2.postNextSearchLink,href:t}],i=e=>{if(!nE(e))return;let t=rE(e,r);t!==null&&(e.preventDefault(),e.stopImmediatePropagation(),t.href!==null&&eE(t.href));};return document.addEventListener(BT,i,true),()=>{document.removeEventListener(BT,i,true);}},[e,t,n]);}function aE(e){let[t,n]=z$2(JT);B$2(()=>{let e=()=>{n(JT());};return window.addEventListener(zT,e),()=>{window.removeEventListener(zT,e);}},[]);let r=$T(e.postId,t);return iE(r===null?null:r.previousHref,r===null?null:r.nextHref,r!==null),r===null?null:K$3(`nav`,{className:ET,"aria-label":FT,children:[K$3(`style`,{children:KT}),K$3(`a`,{className:`${DT} ${AT}`,href:r.collectionHref,children:r.name}),K$3(`span`,{className:OT,children:r.positionLabel}),K$3(tE,{label:NT,glyph:jT,href:r.previousHref}),K$3(tE,{label:PT,glyph:MT,href:r.nextHref})]})}var oE=ha$1,sE=`Video player tweaks`,cE=[`post`],lE=`gelcomVideoPlayer`,uE=`fluid_video_wrapper_gelcomVideoPlayer`,dE=`fluid_video_wrapper`,fE=0,pE=1,mE=12,hE=Kt$2(oE),gE=`body.${hE}`,_E=`#${uE}.${dE}`,vE=`Fit height`,yE=`Fit width`,bE=`Original`,xE=[ga$1,_a$1,va$1],SE=`Fit height fills under the header (may upscale). Fit width uses the media column. Original is native pixels.`,CE=[`${gE} ${_E} {`,`  box-sizing: border-box;`,`}`].join(`
`);function wE(e){let{mode:t,videoWidth:n,videoHeight:r,columnWidthPx:i,availableHeightPx:a}=e;if(n<=0||r<=0||i<=0||a<=0)return {widthPx:0,heightPx:0};if(t===`original`)return {widthPx:n,heightPx:r};if(t===`fit-width`)return TE(n,r,i);let o=Math.round(a*n/r);return o<=i?{widthPx:o,heightPx:a}:TE(n,r,i)}function TE(e,t,n){return {widthPx:n,heightPx:Math.round(n*t/e)}}function EE(e){return Number.isFinite(e)?Math.min(pE,Math.max(fE,e)):fE}function DE(e){return e.getState(Ra$2)}function OE(e,t){e.setState({volume:t.volume,muted:t.muted,playbackRate:t.playbackRate});}function kE(){let e=document.getElementById(lE);return e instanceof HTMLVideoElement?e:null}function AE(){let e=document.getElementById(uE);return !(e instanceof HTMLElement)||!e.classList.contains(`fluid_video_wrapper`)?null:e}function jE(){for(let e of xE)if(document.body.classList.contains(qt$3(oE,e)))return e;return za$1(ya$1)}var ME=`div.flexi`,NE=`sticky`;function PE(e){let t=Number.parseFloat(e);return Number.isFinite(t)?t:0}function FE(e){let t=e.parentElement,n=e.closest(ME);if(t!==null&&n instanceof HTMLElement&&n.clientWidth>0){let r=n.clientWidth,i=document.getElementById(Gt$2);if(i!==null&&i.parentElement===n){let e=window.getComputedStyle(i);e.position===NE&&(r-=i.offsetWidth+PE(e.marginLeft)+PE(window.getComputedStyle(n).columnGap));}if(r=Math.floor(r),r>0){let n=e.style.width;e.style.width=`${String(r)}px`;let i=t.clientWidth;return e.style.width=n,i>0?Math.min(r,i):r}}return t!==null&&t.clientWidth>0?t.clientWidth:e.clientWidth}function IE(){let e=iy(mE);return Math.max(0,window.innerHeight-e)}function LE(e){e.style.removeProperty(`width`),e.style.removeProperty(`height`);}function RE(e,t){if(!document.body.classList.contains(hE)){LE(e);return}let n=t.videoWidth,r=t.videoHeight;if(n<=0||r<=0)return;let i=wE({mode:jE(),videoWidth:n,videoHeight:r,columnWidthPx:FE(e),availableHeightPx:IE()});i.widthPx<=0||i.heightPx<=0||(e.style.width=`${String(i.widthPx)}px`,e.style.height=`${String(i.heightPx)}px`);}function zE(e,t){let n=t.volume??pE,r=t.muted??false,i=t.playbackRate??1;e.volume=EE(n),e.muted=r,e.playbackRate=i;}var BE=400,VE,HE=null;function UE(e,t){HE=()=>{HE=null,window.clearTimeout(VE),VE=void 0,OE(e,{volume:EE(t.volume),muted:t.muted,playbackRate:t.playbackRate});},window.clearTimeout(VE),VE=window.setTimeout(()=>{HE?.();},BE);}function WE(){HE?.();}var GE=15e3;function KE(e,t){let n=DE(e),r=()=>{let e=AE();e!==null&&RE(e,t);};if(AE()===null){let e=new MutationObserver(()=>{AE()!==null&&(e.disconnect(),r());});e.observe(document.body,{childList:true,subtree:true}),window.setTimeout(()=>{e.disconnect();},GE);}t.readyState>=HTMLMediaElement.HAVE_METADATA&&(zE(t,n),r()),t.addEventListener(`loadedmetadata`,()=>{zE(t,DE(e)),r();}),t.addEventListener(`volumechange`,()=>{UE(e,t);}),t.addEventListener(`ratechange`,()=>{UE(e,t);}),window.addEventListener(`pagehide`,WE),window.addEventListener(`resize`,()=>{r();}),new MutationObserver(()=>{r();}).observe(document.body,{attributes:true,attributeFilter:[`class`]});}function qE(e){e.addEventListener(`click`,t=>{document.body.classList.contains(hE)&&t.button===0&&(t.preventDefault(),t.stopImmediatePropagation(),e.paused?e.play().catch(()=>void 0):e.pause());},true);}function JE(e){Os$2(()=>{let t=kE();t!==null&&(KE(e,t),qE(t));});}var YE={id:oE,label:sE,pages:[...cE],defaultEnabled:true,cssOnly:true,settingsCaption:SE,choice:{label:`Video size`,options:[{value:ga$1,label:vE},{value:_a$1,label:yE},{value:va$1,label:bE}],defaultValue:ya$1},css:CE,mount:JE},XE=`Collections`,ZE=`Custom collections`,QE=1;function $E(e){return `In ${String(e)} ${e===QE?`collection`:`collections`}`}var eD=14,tD=`source`,nD=`p`,rD=`rdw-post-panel-collections`,iD=`rdw-post-panel-collections-btn`;function aD(e){if(!(e instanceof HTMLSourceElement)){let t=e.currentSrc.trim();if(t.length>0)return t}let t=e.getAttribute(`src`);if(t===null)return null;let n=t.trim();return n.length===0?null:n}function oD(e){let t=document.getElementById(`${nD}${String(e)}`);return t instanceof Element?t:null}function sD(e,t){let n=oD(t);return n!==null&&n.contains(e)}function cD(e){let t=e.querySelector(tD);if(t instanceof HTMLSourceElement){let e=aD(t);if(e!==null)return e}return aD(e)}function lD(e){let t=[],n=document.getElementById(lE);n instanceof HTMLVideoElement&&t.push(n);for(let e of document.querySelectorAll(`video`))e instanceof HTMLVideoElement&&e!==n&&t.push(e);for(let n of t){if(sD(n,e))continue;let t=cD(n);if(t!==null)return t}return null}function uD(e,t){return e===null?null:Dt$3(e,t)}function dD(e){let t=document.getElementById(_v);if(t instanceof HTMLImageElement&&!sD(t,e)){let n=uD(aD(t),e);if(n!==null)return n}return uD(lD(e),e)}function fD(e){let[t,n]=z$2(false),r=V$2(null),[i,a]=z$2(()=>Qs$1(e.postId).length),o=Re$2(()=>{n(false),a(Qs$1(e.postId).length);},[e.postId]),s=Re$2(e=>{let t=e?.querySelector(`button`);r.current=t instanceof HTMLButtonElement?t:null;},[]),c=e.postId,l=Re$2(()=>dD(c),[c]);return K$3(`div`,{className:rD,ref:s,children:[K$3(J$3,{variant:`secondary`,size:`m`,className:iD,pressed:i>0,disabled:e.deleted===true&&i===0&&!t,...e.deleted===true&&i===0?{title:sT}:{},"aria-label":i>0?$E(i):XE,onClick:()=>{t?o():n(true);},children:[K$3(i>0?pt$2:ft$2,{size:eD}),i>0?$E(i):XE]}),K$3(Bn$1,{open:t,onClose:o,anchorRef:r,widthPx:260,"aria-label":ZE,children:K$3(tf,{postId:c,readThumbUrl:l})})]})}var pD=`rdw-post-panel-download`,mD=`video#gelcomVideoPlayer`,hD=`Download the original file`,gD=`Downloading…`,_D=`Saved to your downloads folder`,vD=`Could not download. Press to try again`,yD=16,bD={idle:hD,busy:gD,done:_D,failed:vD};function xD(e){let t=e.querySelector(mD);if(!(t instanceof HTMLVideoElement))return ``;let n=t.querySelector(`source`);return t.currentSrc||t.src||(n instanceof HTMLSourceElement?n.src:``)}function SD(e,t=document){let n=t.querySelector(`img#${_v}`);return [xD(t),e??``,n instanceof HTMLImageElement?n.currentSrc||n.src:``].find(e=>e.length>0&&Be$1(e)&&ut$4(e))??null}function CD(e){let[t,n]=z$2(`idle`);if(!Ve$1()||SD(e.originalHref)===null)return null;let r=bD[t];return K$3(`button`,{type:`button`,className:`${e.className} ${pD} rdw-kit-focusable`,"aria-label":r,title:r,"aria-busy":t===`busy`||void 0,disabled:t===`busy`,"data-phase":t,onClick:()=>{let t=SD(e.originalHref);t===null?n(`failed`):(n(`busy`),j$1(t,Ie$1(Ft(),{...e.info,url:t})).then(()=>{n(`done`);}).catch(t=>{m$2.warn(`post-panel: download failed`,e.info.postId,t),n(`failed`);}));},children:K$3(t===`done`?pt$2:At$2,{size:yD})})}var wD=`Edit`,TD=`Resize image`,ED=`Report…`,DD=`Report to moderation`,OD=`Add note`,kD=`rdw-post-panel-post-actions`,AD=`rdw-post-panel-post-action`,jD=14;function MD(e){return e===`Edit`?wD:e===`Resize image`?TD:e===`Report to moderation`?ED:OD}function ND(e){return K$3(e===`Edit`?yt$2:e===`Resize image`?wt$2:e===`Report to moderation`?bt$2:xt$2,{size:jD})}function PD(e){return e.links.length===0?null:K$3(`div`,{className:kD,children:e.links.map(e=>K$3(J$3,{variant:`ghost`,size:`m`,className:AD,"aria-label":e.text===`Report to moderation`?DD:MD(e.text),onClick:()=>{e.anchor.click();},children:[ND(e.text),MD(e.text)]},e.text))})}var FD=`info`,ID=`comments`,LD=`related`,RD=`Favorite`,zD=`In favorites`,BD=`Vote`,VD=`I came`,HD=`Comments`,UD=`Info`,WD=` · `,GD=`Original`,KD=`Vote`,qD=`I came`,JD=`KeyF`,YD=`Add to favorites (F)`,XD=`Remove from favorites (F)`,ZD=`Vote up`,QD=`Voted up`,$D=`Post details`,eO=14,tO=14,nO=`rdw-post-panel`,rO=`rdw-post-panel-card`,iO=`rdw-post-panel-actions`,aO=`rdw-post-panel-actions-row`,oO=`rdw-post-panel-fav`,sO=`rdw-post-panel-original`,cO=`rdw-post-panel-vote`,lO=`rdw-post-panel-stats`,uO=`rdw-post-panel-stat-label`,dO=`rdw-post-panel-stat-value`,fO=`rdw-post-panel-source`,pO=`rdw-post-panel-icame`,mO=`rdw-post-panel-comments`,hO=`rdw-post-panel-comments-host`,gO=`rdw-post-panel-info`,_O=`rdw-post-panel-tabs`,vO=`rdw-post-panel-tabpanel`;function yO(e){if(e===null||e.length===0)return null;let t=Number(e);if(!Number.isFinite(t))return null;let n=Math.trunc(t);return n<0?null:n}function bO(e,t){return e.find(e=>e.label===t)?.value.trim()??``}function xO(e,t,n){let r=Qv(bO(t,`Size`)),i=Number(n),a=bO(t,`Rating`).toLowerCase(),o=bO(t,`By`);return {postId:e,...a.length>0?{rating:a}:{},...n.trim().length>0&&Number.isFinite(i)?{score:i}:{},...r===null?{}:{width:r.width,height:r.height},...o.length>0?{owner:o}:{}}}function SO(e){return `${BD} ${e}`}function CO(e){return e===null?HD:`${HD}${WD}${String(e)}`}function wO(e){let t=yO(e.postId),[n,r]=z$2(()=>e.postId!==null&&ws$1(e.postId)),[i,a]=z$2(false),[o,s]=z$2(()=>e.postId===null?`—`:Uv(e.postId)??`—`),[c,l]=z$2(false),[u,d]=z$2(false),[f$1,p]=z$2(false),[m]=z$2(()=>Yv()),[h]=z$2(()=>Bv()),[g]=z$2(()=>Iv()===null?zv()?.href??null:null),[_]=z$2(()=>Iv()!==null),[v]=z$2(()=>ry()),[y]=z$2(()=>ay()!==null),[b]=z$2(()=>y?sy():null),[x,S]=z$2(()=>y&&LO()?ID:FD),[C]=z$2(()=>e.postId!==null&&jc$1(`more-like-this`,true)?fb(document):[]),w=C.length>0,[T,ee]=z$2(false),[te]=z$2(()=>{let e=Ic$1(Ib);return gx(e)?e:null}),ne=e.postId===null?NaN:Number(e.postId),[re]=z$2(()=>f()?async()=>kb(await g$1(),C,ne):null),ie=Re$2(async(e,t)=>hb(C,await Mb(e,t),ne),[C,ne]),ae=y||w;B$2(()=>{if(e.postId!==null)return Gv(e.postId,e=>{s(e.length>0?e:`—`);})},[e.postId]),B$2(()=>{if(!w)return;let e=()=>{S(LD),ee(true),document.getElementById(_i(LD))?.focus();};return document.addEventListener(aT,e),()=>{document.removeEventListener(aT,e);}},[w]);let oe=_&&!n,se=Re$2(async()=>{if(!(e.postId===null||i||oe)){a(true);try{if(n){let t=await Qs(e.postId);if(t.status===`removed`){Es$1(e.postId),r(!1);return}m$2.warn(`post-actions: remove favorite failed`,e.postId,t);return}let t=await Xs(e.postId);if(t.status===`added`||t.status===`already`){Ts$1(e.postId),pf(e.postId),r(!0),t.status===`added`&&t.score!==void 0&&(Wv(e.postId,t.score),s(String(t.score)));return}if(t.status===`not_logged_in`){m$2.warn(`post-actions: favorite requires login`,e.postId);return}m$2.warn(`post-actions: favorite failed`,e.postId,t);}finally{a(false);}}},[oe,i,n,e.postId]);TT(JD,e.postId!==null&&!oe,()=>{se();});let E=Re$2(async()=>{if(!(e.postId===null||c||_)){l(true);try{let t=await Zs(e.postId);t!==null&&(Wv(e.postId,t),s(String(t)),d(!0));}finally{l(false);}}},[_,e.postId,c]),D=Re$2(()=>{v?.anchor.click(),p(true);},[v]),ce=Re$2(e=>{S(e),e===`related`&&ee(true);},[]),ue=Le$2(()=>{let e=[{id:FD,label:UD}];return y&&e.push({id:ID,label:CO(b)}),w&&e.push({id:LD,label:Lb}),e},[b,y,w]),de=m.length>0||h.length>0||ae,fe=e.postId!==null||v!==null||g!==null;return K$3(`div`,{className:nO,children:[K$3(aE,{postId:t}),K$3(`div`,{className:iO,children:[e.postId!==null||t!==null?K$3(`div`,{className:aO,children:[e.postId===null?null:K$3(J$3,{variant:n?`secondary`:`primary`,size:`m`,className:oO,loading:i,disabled:oe,pressed:n,title:oe?sT:n?XD:YD,"aria-label":n?`${Fe$3.cardFavRemoveLabel} ${e.postId}`:`${Fe$3.cardFavAddLabel} ${e.postId}`,onClick:()=>{se();},children:[K$3(n?dt$2:ut$2,{size:eO}),n?zD:RD]}),t===null?null:K$3(fD,{postId:t,deleted:_})]}):null,fe?K$3(`div`,{className:aO,children:[e.postId===null?null:K$3(J$3,{variant:`secondary`,size:`m`,className:cO,loading:c,disabled:_,pressed:u,title:_?sT:u?QD:ZD,"aria-label":KD,onClick:()=>{E();},children:[K$3(gt$2,{size:eO}),SO(o)]}),v===null?null:K$3(J$3,{variant:`secondary`,size:`m`,className:pO,disabled:_,..._?{title:sT}:{},pressed:f$1,"aria-label":qD,onClick:D,children:[K$3(vt$2,{size:eO}),VD]}),g===null?null:K$3(`a`,{className:sO,href:g,target:`_blank`,rel:`noopener`,"aria-label":GD,title:GD,children:K$3(_t$2,{size:tO})}),t!==null&&!_?K$3(CD,{originalHref:g,info:xO(t,m,o),className:sO}):null]}):null]}),de?K$3(lt$2,{className:rO,as:`section`,children:[ae?K$3(bi,{className:_O,"aria-label":$D,items:ue,value:x,onChange:ce}):null,K$3(`div`,{className:vO,role:`tabpanel`,id:vi(FD),"aria-labelledby":_i(FD),hidden:ae&&x!==`info`,children:K$3(TO,{stats:m,moreLinks:h})}),y?K$3(`div`,{className:`${vO} ${mO}`,role:`tabpanel`,id:vi(ID),"aria-labelledby":_i(ID),hidden:x!==ID,children:K$3(BO,{})}):null,w?K$3(`div`,{className:vO,role:`tabpanel`,id:vi(LD),"aria-labelledby":_i(LD),hidden:x!==LD,children:T?K$3(kx,{tags:C,lastKind:te,onPick:e=>{Lc$1(Ib,e);},readFavorites:re,load:ie}):null}):null]}):null]})}function TO(e){return K$3(`div`,{className:gO,children:[e.stats.length>0?K$3(`div`,{className:lO,children:e.stats.map(e=>K$3(VO,{row:e},e.label))}):null,e.moreLinks.length>0?K$3(PD,{links:e.moreLinks}):null]})}var EO=`div#comment-list > div[id^="c"]`,DO=`div#comment-list > a#ci`,OO=`(0 hidden)`,kO=`Respond`,AO=`No comments yet`,jO=`Write a comment`,MO=`rdw-post-panel-comments-empty`,NO=`rdw-post-reply-links`,PO=`div#comment-list > div:not([id]) > a`,FO=`ruledesk-web.comments-return`;function IO(){try{window.sessionStorage.setItem(FO,window.location.search);}catch{}}function LO(){try{let e=window.sessionStorage.getItem(FO);return window.sessionStorage.removeItem(FO),e!==null&&e===window.location.search}catch{return  false}}function RO(){for(let e of document.querySelectorAll(`a`))if(e.textContent.trim()===kO)return e;return null}var zO=`comment_form`;function BO(){let e=V$2(null),t=V$2(null);B$2(()=>()=>{let e=t.current,n=document.getElementById(zO);e!==null&&e.parent!==null&&n!==null&&e.parent.insertBefore(n,e.next);},[]);let[n]=z$2(()=>{let e=ay();return e!==null&&e.querySelector(EO)===null}),[r]=z$2(()=>RO());return Ie$2(()=>{let e=ay(),t=e?.querySelector(DO);t instanceof HTMLElement&&t.textContent.trim()===OO&&(t.hidden=true);let n=r?.parentElement??null;n!==null&&Array.from(n.children).every(e=>e.tagName===`A`)&&n.classList.add(NO);let i=e?.querySelector(PO);return i?.addEventListener(`click`,IO),()=>{i?.removeEventListener(`click`,IO);}},[r]),Ie$2(()=>{let t=e.current,n=ay();if(t===null||n===null||n.parentElement===t)return;let r=n.parentNode,i=n.nextSibling;return t.append(n),()=>{r!==null&&(n.parentElement===t||n.parentNode===null)&&r.insertBefore(n,i);}},[]),K$3(A$2,{children:[n||r!==null?K$3(`div`,{className:MO,children:[K$3(`span`,{children:n?AO:``}),r===null?null:K$3(J$3,{variant:`secondary`,size:`s`,onClick:()=>{let n=e.current,i=document.getElementById(zO);n!==null&&r!==null&&(i instanceof HTMLFormElement?(window.getComputedStyle(i).display===`none`&&r.click(),i.parentElement!==n&&(t.current={parent:i.parentNode,next:i.nextSibling},n.append(i)),i.querySelector(`textarea`)?.focus()):(r.click(),r.scrollIntoView({block:`center`})));},children:jO})]}):null,K$3(`div`,{className:hO,ref:e})]})}function VO(e){let{row:t}=e;return K$3(A$2,{children:[K$3(`span`,{className:uO,children:t.label}),t.label===`Source`&&t.href!==null?K$3(`a`,{className:`${dO} ${fO}`,href:t.href,title:t.href,rel:$v,children:t.value}):t.href===null?K$3(`div`,{className:dO,children:t.value}):K$3(`a`,{className:dO,href:t.href,children:t.value})]})}var HO=`post-actions`,UO=`Post side panel`,WO=[`post`],GO=`rdw-post-panel-mounted`,KO=1100,qO=`(max-width: 1099px)`,JO=`(min-width: ${String(KO)}px)`,YO=360,XO=320,ZO=420,QO=13,$O=34,ek=10,tk=8,nk=12,rk=12,ik=12,ak=20,ok=62,sk=34,ck=`--rdw-post-panel-sticky-top`,lk=`--rdw-post-media-head`,uk=`data-rdw-large`,dk=`data-rdw-full`,fk=`rdw-post-actions`,pk=`rdw-post-actions--wide`,mk=`rdw-post-actions--narrow`,hk=`rdw-post-deleted-notice`,gk=640,_k=280,vk=`--rdw-post-deleted-ratio`,yk=`4 / 3`,bk=`post-actions: div.flexi missing; panel not mounted`,X=`body.${Kt$2(HO)}`,xk=`
${X} #fit-to-screen div.flexi,
${X} div#right-col div.flexi,
${X} div.flexi {
  flex-wrap: wrap;
  align-items: flex-start;
  /* Space between the media and the panel, beside it or under it. */
  gap: ${String(ik)}px;
}
${X} #${Gt$2}.${fk} {
  box-sizing: border-box;
  width: ${String(YO)}px;
  min-width: ${String(XO)}px;
  max-width: min(${String(ZO)}px, 100%);
  flex: 0 1 ${String(YO)}px;
  z-index: ${String(ak)};
  font: ${String(QO)}px/1.35 var(--rdw-font);
  color: var(--rdw-text);
}
${X} #${Gt$2}.${pk} {
  position: sticky;
  top: var(${ck}, ${String(rk)}px);
  align-self: flex-start;
  max-height: calc(100vh - var(${ck}, ${String(rk)}px) - ${String(rk)}px);
  overflow-y: auto;
}
${X} #${Gt$2}.${mk} {
  position: static;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  flex: 1 1 100%;
  margin: 0.75rem 0 0;
  max-height: none;
  overflow-y: visible;
}
${X} #${Gt$2} .rdw-post-panel {
  display: grid;
  gap: ${String(ek)}px;
  position: relative;
}
${X} #${Gt$2} .rdw-post-panel-card {
  padding: ${String(nk)}px;
  display: grid;
  gap: ${String(ek)}px;
}
${X} #${Gt$2} .rdw-btn {
  min-height: ${String($O)}px;
  font-size: ${String(QO)}px;
}
${X} #${Gt$2} .rdw-post-panel-actions {
  display: grid;
  gap: ${String(tk)}px;
}
${X} #${Gt$2} .rdw-post-panel-actions-row {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: ${String(tk)}px;
}
${X} #${Gt$2} .rdw-post-panel-actions-row > .rdw-btn,
${X} #${Gt$2} .rdw-post-panel-actions-row > .rdw-post-panel-collections {
  flex: 1 1 0;
  min-width: 0;
}
${X} #${Gt$2} .rdw-post-panel-collections {
  position: relative;
}
${X} #${Gt$2} .rdw-post-panel-collections .rdw-btn {
  width: 100%;
}
${X} #${Gt$2} .rdw-post-panel-original {
  box-sizing: border-box;
  flex: 0 0 ${String(sk)}px;
  width: ${String(sk)}px;
  height: ${String(sk)}px;
  min-width: ${String(sk)}px;
  min-height: ${String(sk)}px;
  display: inline-grid;
  place-items: center;
  padding: 0;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-surface);
  color: var(--rdw-text);
  text-decoration: none;
}
${X} #${Gt$2} button.rdw-post-panel-download {
  font: inherit;
  cursor: pointer;
}
${X} #${Gt$2} button.rdw-post-panel-download:disabled {
  opacity: 0.55;
  cursor: progress;
}
${X} #${Gt$2} button.rdw-post-panel-download[data-phase="done"] {
  border-color: var(--rdw-accent);
  color: var(--rdw-accent);
}
${X} #${Gt$2} button.rdw-post-panel-download[data-phase="failed"] {
  border-color: var(--rdw-danger);
  color: var(--rdw-danger);
}
${X} #${Gt$2} .rdw-post-panel-stats {
  display: grid;
  grid-template-columns: ${String(ok)}px 1fr;
  column-gap: ${String(tk)}px;
  row-gap: ${String(tk)}px;
  font-size: ${String(QO)}px;
}
${X} #${Gt$2} .rdw-post-panel-stat-label {
  color: var(--rdw-muted);
}
${X} #${Gt$2} .rdw-post-panel-source {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--rdw-accent);
}
${X} #${Gt$2} .rdw-post-panel-info {
  display: grid;
  gap: ${String(ek)}px;
}
${X} #${Gt$2} .rdw-post-panel-post-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2px ${String(tk)}px;
  padding-top: ${String(tk)}px;
  border-top: 1px solid var(--rdw-border);
}
${X} #${Gt$2} .rdw-post-panel-post-action {
  width: 100%;
  justify-content: flex-start;
  padding-left: 6px;
  padding-right: 6px;
  color: var(--rdw-text);
  font-weight: 400;
}
${X} #${Gt$2} .rdw-post-panel-post-action:hover {
  background: var(--rdw-surface-2);
}
${X} #${Gt$2} .rdw-post-panel-tabpanel[hidden] {
  display: none;
}
${X} #${Zw} {
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: ${String(gk)}px;
  max-width: 100%;
  aspect-ratio: var(${vk}, ${yk});
  min-height: ${String(_k)}px;
  max-height: max(${String(_k)}px, calc(100vh - var(${ck}, ${String(rk)}px) - var(${lk}, 0px) - ${String(rk)}px));
  padding: 24px 24px 56px;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-l);
  background: var(--rdw-surface);
  color: var(--rdw-muted);
  font: ${String(QO)}px/1.4 var(--rdw-font);
  text-align: center;
}
${X} #${Zw} p {
  margin: 0;
}
${X} #${Zw} .${Qw} {
  color: var(--rdw-muted);
}
${X} #${Zw} .${$w} {
  color: var(--rdw-text);
  font-size: 16px;
  font-weight: 600;
}
${X} #${Zw} .${tT} {
  margin-top: 8px;
}
${X} #${Zw} .${nT} {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 0;
}
${X} #${Zw} .${rT} {
  min-width: 0;
  overflow-wrap: anywhere;
  color: var(--rdw-muted);
  font: 11px/1.4 ui-monospace, "Cascadia Mono", Consolas, "Courier New", monospace;
  opacity: 0.8;
}
${X} #${Zw} .${iT} {
  flex: 0 0 auto;
  min-height: 24px;
  padding: 0 6px;
  color: var(--rdw-muted);
  font-size: 11px;
  font-weight: 400;
}
${X} #${Zw} .${iT}:hover {
  background: var(--rdw-surface-2);
  color: var(--rdw-text);
}
${X} div.status-notice.${hk} {
  display: none;
}
${X} #${Gt$2} .rdw-post-panel-comments-host {
  min-width: 0;
}
@media ${qO} {
  ${X} #${Gt$2}.${pk} {
    position: static;
    max-height: none;
    overflow-y: visible;
  }
}
@media ${JO} {
  ${X} div#post-view > div#right-col {
    flex-grow: 1;
  }
  ${X} div.flexi > :has(+ #${Gt$2}.${pk}) {
    margin-left: auto;
  }
  ${X} #${Gt$2}.${pk} {
    margin-left: 12px;
    margin-right: auto;
    flex-shrink: 0;
  }
  ${X} div#post-view > div#right-col {
    min-width: 0;
  }
  ${X} div.flexi:has(> #${Gt$2}.${pk}) {
    flex-wrap: nowrap;
  }
  ${X} div.flexi > :has(+ #${Gt$2}.${pk}) {
    flex: 0 1 auto;
    min-width: 0;
  }
  ${X} div.flexi > :has(+ #${Gt$2}.${pk}) img#${_v} {
    max-width: 100%;
    height: auto !important;
  }
  ${X} div.flexi > :has(+ #${Gt$2}.${pk}) img#${_v}[${uk}]:not([${dk}]) {
    max-height: calc(100vh - var(${ck}, ${String(rk)}px) - var(${lk}, 0px) - ${String(rk)}px);
    width: auto !important;
  }
}
`.trim(),Sk=null,Ck=null;function wk(){Sk!==null&&(Sk(),Sk=null),Ck!==null&&(ve$1(null,Ck),Ck.remove(),Ck=null);let e=document.getElementById(Gt$2);e!==null&&e.remove(),document.body.classList.remove(GO);}function Tk(){return typeof window.matchMedia==`function`?window.matchMedia(qO).matches:window.innerWidth<KO}function Ek(e){let t=iy(rk);e.style.setProperty(ck,`${String(t)}px`);}function Dk(e){let t=e.querySelector(`img#${_v}`);if(!(t instanceof HTMLImageElement)||t.hasAttribute(dk))return;let n=Number(t.getAttribute(`width`)),r=Number.isFinite(n)&&n>0?n:t.naturalWidth;r===0&&!t.complete&&t.addEventListener(`load`,()=>{Dk(e);},{once:true}),t.toggleAttribute(uk,r>850);let i=Math.max(0,Math.round(t.getBoundingClientRect().top-e.getBoundingClientRect().top));e.style.setProperty(lk,`${String(i)}px`);}function Ok(e,t){let n=Tk();e.classList.toggle(pk,!n),e.classList.toggle(mk,n),Ek(e),t.style.setProperty(ck,e.style.getPropertyValue(ck));let r=Rv(t,Gt$2);r===null?t.append(e):r.after(e),Dk(t);}function kk(e,t){let n=()=>{Ok(e,t);};n();let r=()=>{n();};window.addEventListener(`resize`,r);let i=null;if(typeof window.matchMedia==`function`){let e=window.matchMedia(qO),t=()=>{n();};typeof e.addEventListener==`function`?(e.addEventListener(`change`,t),i=()=>{e.removeEventListener(`change`,t);}):typeof e.addListener==`function`&&(e.addListener(t),i=()=>{e.removeListener(t);});}Sk=()=>{window.removeEventListener(`resize`,r),i!==null&&i();};}function Ak(e){let t=document.getElementById(Zw);t!==null&&(ve$1(null,t),t.remove());let n=Iv();if(n===null||e.querySelector(`#image, video`)!==null)return;let r=document.createElement(`div`);r.id=Zw,r.setAttribute(`role`,`status`);let i=Zv();i!==null&&r.style.setProperty(vk,`${String(i.width)} / ${String(i.height)}`),ve$1(ee(yT,{reason:n.reason,md5:n.md5,showRelated:jc$1(`more-like-this`,true)&&fb(document).length>0}),r);let a=null;for(let t of e.children)if(t.id!==`rdw-post-actions`){a=t;break}if(a===null)e.prepend(r);else {let e=a.querySelector(`a#prev_search_link, a#next_search_link`);for(;e!==null&&e.parentElement!==a;)e=e.parentElement;e===null?a.prepend(r):e.after(r);}n.element.classList.add(hk);}function jk(e){wk();let t=Lv();if(t===null){m$2.warn(bk);return}let r=document.createElement(`div`);r.id=Gt$2,r.className=fk,r.setAttribute(`role`,`complementary`),r.setAttribute(`aria-label`,UO);let i=Ji(e.search);Ck=r,document.body.classList.add(GO),Ok(r,t),kk(r,t),Ak(t),ve$1(ee(wO,{postId:i}),r);}var Mk={id:HO,label:UO,settingsCaption:`One panel beside the picture: Favorite, vote, download, collections and the details of the post, in place of the site's scattered links.`,pages:[...WO],defaultEnabled:true,css:xk,mount:jk},Nk=`Download results`,Pk=`Download every post of this search`,Fk=`Select`,Ik=`Pick posts on this page to add to a collection`,Lk=`Pick posts on this page to add to a collection or to download`,Rk=`Add to collection`,zk=`Select page`,Bk=`rdw-select-note`,Vk=`Download selected`,Hk=`Download results`,Uk=`Download`,Wk=` (selected)`,Gk=`selection`,Kk=`selected posts`,qk=`Download every post of “`,Jk=`”? The list is read through the API first, then the files are saved one by one. A large search takes a long time; it can be paused or cancelled in the panel.`;function Yk(e){return jo$1(new URLSearchParams(e).get(`tags`)??``)}function Xk(e){return new URLSearchParams(e).get(`s`)===oe$1}function Zk(e){let t=Pt$2(window.location.hash);if(t!==null){let e=G$4().collections.find(e=>e.id===t);if(e!==void 0)return e.name}return e}function Qk(e={}){let[t,n]=z$2(false),[r,i]=z$2(0),[a,o]=z$2(false),[s,c]=z$2(null),[l,u]=z$2(``);B$2(()=>()=>{Eo();},[]);let{onSelectingChange:d}=e;B$2(()=>{d?.(t);},[d,t]),tm(t,()=>{Eo(),n(false),i(0);});let f=window.location.search;if(!Xk(f))return null;let p=Ze$1(),m=Yk(f),h=Zk(m),g=()=>{Eo(),n(false),i(0);};if(t){let t=K$3(Yr,{layout:`stack`,count:r,selectAllLabel:zk,onSelectAll:So,onClear:Co,onCancel:g,children:[K$3(J$3,{variant:`secondary`,disabled:r===0,onClick:()=>{c(xo(ep));},children:Rk}),p?K$3(J$3,{variant:`secondary`,disabled:r===0,onClick:()=>{let e=vo();g(),e.length>0&&!en()&&tn(h.length>0?`${h}${Wk}`:Kk,{kind:`ids`,ids:e},Gk);},children:Vk}):null]}),n=e.barHost??null;return K$3(A$2,{children:[n===null?t:It$1(t,n),K$3(Rp,{open:s!==null,posts:s??[],onClose:()=>{c(null);},onDone:e=>{g(),up(),u(Lp(e));}})]})}return K$3(A$2,{children:[!p||ko$1(m)?null:K$3(J$3,{variant:`secondary`,size:`s`,title:Pk,onClick:()=>{o(true);},children:Nk}),K$3(J$3,{variant:`secondary`,size:`s`,title:p?Lk:Ik,onClick:()=>{u(``),To(i),n(true);},children:Fk}),l.length>0?K$3(`span`,{className:Bk,role:`status`,children:l}):null,K$3(Sn$1,{variant:`confirm`,open:a,title:Hk,message:`${qk}${h}${Jk}`,confirmLabel:Uk,cancelLabel:Fe$3.cancel,onConfirm:()=>{o(false),en()||tn(h,{kind:`query`,tags:m});},onClose:()=>{o(false);}})]})}var $k=`Save as collection`,eA=`Save this search as a dynamic collection`,tA=`New dynamic collection`,nA=`rdw-search-tools-save`,rA=`rdw-dialog__fields`,iA=`rdw-dialog__actions`,aA=`rdw-search-tools-save-error`,oA=`rdw-search-tools-saved`,sA=`Saved to Collections`,cA=`:`,lA=/\s+/,uA=[`(`,`)`,`~`],dA=`Query`,fA=`Enter a name.`,pA=`A collection with this name already exists.`,mA=`Enter a tag search that is not saved yet.`,hA=`
.${aA} {
  margin: 0;
  color: var(--rdw-danger);
  font-size: 12px;
}
.${oA} {
  flex: 1 1 auto;
  align-self: center;
  text-align: center;
  color: var(--rdw-muted);
  font-size: 12px;
}
`.trim();function gA(e){return e.query??io$1(e.tags)}function _A(e){let t=jo$1(e);if(ko$1(t)||!t.split(lA).some(e=>!uA.includes(e)&&!e.includes(cA))||wo$1(t)!==null)return null;let n=Kc$1();if(yo$1(t,n)||bo$1(t,n)||mo$1(t,n,Rc$1())>=0)return null;for(let e of G$4().collections)if(!I$3(e)&&No$1(t,gA(e)))return null;return t}function vA(e){let t=e.trim().toLowerCase();if(t.length===0)return fA;for(let e of G$4().collections)if(e.name.trim().toLowerCase()===t)return pA;return null}function yA(e,t){let n=new URLSearchParams(e);return n.get(`s`)===`list`&&No$1(n.get(`tags`)??``,t)}function bA(e){let[t,n]=z$2(false),[r,i]=z$2(``),[a,o]=z$2(``),[s,c]=z$2(``),[l,u]=z$2(false),d=_A(e.tags);if(d===null&&!t)return l?K$3(A$2,{children:[K$3(`style`,{children:hA}),K$3(`span`,{className:oA,role:`status`,children:sA})]}):null;let f=()=>{n(false),i(``),c(``);},p=()=>{let e=vA(r);if(e!==null){c(e);return}let t=_A(a);if(t===null){c(mA);return}let n=vc$1(r.trim(),t),i=window.location.search;yA(i,t)?(Ww(n.id,i),u(true),f()):(f(),window.location.assign(oo$1(ro$1(t))));};return K$3(A$2,{children:[K$3(`style`,{children:hA}),K$3(J$3,{variant:`secondary`,size:`s`,className:nA,title:eA,onClick:()=>{o(d??``),i(d??``),n(true);},children:$k}),K$3(Sn$1,{open:t,onClose:f,title:tA,children:K$3(`form`,{className:rA,onSubmit:e=>{e.preventDefault(),e.stopPropagation(),p();},children:[K$3(qt$1,{label:Fe$3.nameLabel,value:r,onChange:e=>{i(e),c(``);}}),K$3(Nt,{label:dA,value:a,onChange:e=>{o(e),c(``);}}),s.length>0?K$3(`p`,{className:aA,role:`alert`,children:s}):null,K$3(`div`,{className:iA,children:[K$3(J$3,{type:`button`,variant:`secondary`,size:`s`,onClick:f,children:Fe$3.cancel}),K$3(J$3,{type:`submit`,variant:`primary`,size:`s`,children:Fe$3.save})]})]})})]})}function xA(){return document.documentElement.classList.contains(c$1)}var SA=`div.awesomplete`,CA=`rdw-site-search-tools`,wA=`rdw-site-search-tool`,TA=`rdw-site-search-box`,EA=`Clear search`,DA=`Search syntax`,OA=380,kA=14,AA={label:DA,widthPx:OA,rows:[[`cat dog`,`posts with both tags`],[`( cat ~ dog )`,`posts with either tag; keep the spaces`],[`-cat`,`posts without the tag`],[`ca*t`,`any tag that starts with ca and ends with t`],[`night~`,`tags spelled like night`],[`user:bob`,`posts uploaded by bob`],[`rating:safe`,`by rating; -rating:safe for the rest`],[`parent:1234`,`post 1234 and its child posts`],[`width:>=1000`,`by size; height: works the same`],[`aspectratio:16:9`,`by shape, within 3%`],[`sourcedomains:x.com`,`by the site of the source`],[`md5:abc*`,`by the file's hash`]],note:`Sort, Min score, Media and AI posts are set with the controls below the field.`};function jA(e){let{input:t}=e,[n,r]=z$2(t.value.length>0),[i,a]=z$2(false),o=V$2(null);return B$2(()=>{let e=()=>{r(t.value.length>0);},n=window.setInterval(e,400);return t.addEventListener(`input`,e),t.addEventListener(`change`,e),()=>{window.clearInterval(n),t.removeEventListener(`input`,e),t.removeEventListener(`change`,e);}},[t]),K$3(A$2,{children:[n?K$3(`button`,{type:`button`,className:`${wA} rdw-kit-focusable`,"aria-label":EA,title:EA,onClick:()=>{t.value=``,t.dispatchEvent(new Event(`input`,{bubbles:true})),r(false),t.focus();},children:K$3(mt$2,{size:kA})}):null,K$3(`button`,{type:`button`,ref:o,className:`${wA} rdw-kit-focusable`,"aria-label":DA,title:DA,"aria-expanded":i,onClick:()=>{a(!i);},children:K$3(kt$2,{size:kA})}),K$3(Bn$1,{open:i,onClose:()=>{a(false);},anchorRef:o,widthPx:OA,"aria-label":DA,children:K$3(Cr$1,{help:AA})})]})}function MA(e){if(!xA())return;let t=e.closest(SA);if(!(t instanceof HTMLElement)||t.querySelector(`.rdw-site-search-tools`)!==null)return;t.classList.add(TA);let n=document.createElement(`span`);n.className=CA,t.append(n),ve$1(K$3(jA,{input:e}),n);}var NA=`search-tools`,PA=`Search tools`,FA=[`list`,`post`];function IA(){let e=Io$1();return e!==null&&e.length>0?[...e]:Kc$1()}var LA=`input[name="tags"]`,RA=`ul#tag-sidebar`,zA=`rdw-search-tools`,BA=`rdw-search-tools`,VA=`rdw-search-tools-card`,HA=`rdw-search-tools-chips`,UA=`rdw-search-tools-chip`,WA=`data-chip-start`,GA=`data-chip-end`,KA=`data-chip-toggle`,qA=`data-chip-remove`,JA=`rdw-search-tools-field`,YA=`rdw-search-tools-row-sort`,XA=`rdw-search-tools-foot`,ZA=`rdw-search-tools-bar`,QA=`rdw-search-tools-locked`,$A=`rdw-search-tools-reset`,ej=/\s+/,tj=/\s+/g,nj=700,rj=400,ij=`:`,aj=`score:>=`,oj=/^score:>=(\d+)$/,sj=`sort:`,cj=`video`,lj=`-${cj}`,uj=`tag-type-`,dj=`Sorts within the current search`,fj=`Reset`,pj=`Clear the search and all filters`,mj=`Enter`,hj=`input`,gj=`change`,_j=`click`,vj=`awesomplete-selectcomplete`,yj=`search-tools: search form not found; not mounted`,Z=Kt$2(NA),bj=4e3,xj={childList:true,subtree:true},Sj=[`artist`,`character`,`copyright`,`general`,`metadata`];function Cj(e){for(let t of Sj)if(t===e)return  true;return  false}var wj=[{value:`all`,label:`All`},{value:`images`,label:`Images`},{value:`videos`,label:`Videos`}],Tj=B,Ej=We,Dj={[N]:`Feed`,[P]:`Following`,[F]:`Collections`},Oj=[{value:`newest`,label:`Newest`,token:null},{value:`oldest`,label:`Oldest`,token:`sort:id:asc`},{value:`score`,label:`Top score`,token:`sort:score:desc`},{value:`updated`,label:`Recently updated`,token:`sort:updated:desc`},{value:`random`,label:`Random`,token:`sort:random`}],kj=new Map;for(let e of Oj)e.token!==null&&kj.set(e.token,e.value);var Aj=`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='m21 21-4.3-4.3'/%3E%3C/svg%3E") center / contain no-repeat`,jj=228,Mj=[`body.${Z} .${BA} {`,`  margin-top: 8px;`,`  max-width: 100%;`,`  box-sizing: border-box;`,`}`,`body.${Z} div.sidebar {`,`  width: ${String(jj)}px;`,`  min-width: ${String(jj)}px;`,`  max-width: ${String(jj)}px;`,`}`,`body.${Z} .${BA} {`,`  font-family: var(--rdw-font);`,`}`,`body.${Z} .${BA} * {`,`  font-family: var(--rdw-font);`,`}`,`body.${Z} .${VA} {`,`  padding: 10px;`,`  display: grid;`,`  gap: 10px;`,`}`,`body.${Z} .${HA} {`,`  display: flex;`,`  flex-wrap: wrap;`,`  gap: 5px;`,`}`,`body.${Z} .${UA} {`,`  cursor: default;`,`}`,`body.${Z} .${UA}[${KA}="1"] {`,`  cursor: pointer;`,`}`,`body.${Z} .${JA} {`,`  display: grid;`,`  gap: 0;`,`  min-width: 0;`,`}`,`body.${Z} .${YA} {`,`  display: grid;`,`  grid-template-columns: 1fr 72px;`,`  gap: 8px;`,`  align-items: start;`,`}`,`body.${Z} .${XA} {`,`  display: flex;`,`  flex-direction: column;`,`  align-items: stretch;`,`  gap: 6px;`,`  border-top: 1px solid var(--rdw-border);`,`  padding-top: 10px;`,`}`,`body.${Z} .${XA} > button {`,`  width: 100%;`,`  white-space: nowrap;`,`}`,`body.${Z} .${TA} {`,`  position: relative;`,`  display: block;`,`}`,`body.${Z} .${TA}::before {`,`  content: "";`,`  position: absolute;`,`  left: 9px;`,`  top: 50%;`,`  z-index: 1;`,`  width: 14px;`,`  height: 14px;`,`  transform: translateY(-50%);`,`  background: var(--rdw-muted);`,`  -webkit-mask: ${Aj};`,`  mask: ${Aj};`,`  pointer-events: none;`,`}`,`body.${Z} .${TA} > input[name="tags"] {`,`  padding-left: 30px !important;`,`  padding-right: 54px !important;`,`  box-sizing: border-box;`,`}`,`body.${Z} .${CA} {`,`  position: absolute;`,`  right: 4px;`,`  top: 50%;`,`  z-index: 1;`,`  transform: translateY(-50%);`,`  display: flex;`,`  gap: 2px;`,`}`,`body.${Z} button.${wA} {`,`  display: inline-grid;`,`  place-items: center;`,`  width: 22px;`,`  height: 22px;`,`  min-height: 0;`,`  margin: 0;`,`  padding: 0;`,`  border: 0;`,`  border-radius: var(--rdw-radius-s);`,`  background: transparent;`,`  color: var(--rdw-muted);`,`  cursor: pointer;`,`}`,`body.${Z} button.${wA}:hover {`,`  color: var(--rdw-text);`,`}`,`body.${Z} .${ZA}:not(:empty) {`,`  margin-bottom: 8px;`,`}`,`body.${Z} .${QA} {`,`  opacity: 0.45;`,`  pointer-events: none;`,`}`,`body.${Z} .${XA} > .${Bk} {`,`  font: 12px/1.4 var(--rdw-font);`,`  color: var(--rdw-muted);`,`}`].join(`
`);function Nj(){let e=document.querySelector(LA);return e instanceof HTMLInputElement?e:null}function Pj(e){let t=e.closest(`form`);return t instanceof HTMLFormElement?t:null}function Fj(e){let t=e.trim();return t.length===0?[]:t.split(ej).filter(e=>e.length>0)}function Ij(e){return e.replace(tj,` `).trim()}function Lj(e){return e.join(` `)}function Rj(e){return e.startsWith(`-`)&&e.length>1?e.slice(1):e}function zj(e){return e.trim().toLowerCase().replaceAll(` `,`_`)}function Bj(e){return e===cj||e===lj}function Vj(e){return Rj(e).startsWith(sj)}function Hj(e){return oj.test(Rj(e))}function Uj(e){return Bj(e)||Vj(e)||Hj(e)}function Wj(e){return Rj(e).includes(ij)}function Gj(e){let t=false,n=false;for(let r of e)r===cj?t=true:r===lj&&(n=true);return t?`videos`:n?`images`:`all`}function Kj(e){for(let t of e){let e=kj.get(Rj(t));if(e!==void 0)return e}return `newest`}function qj(e){for(let t of e){let e=oj.exec(Rj(t));if(e===null)continue;let n=e[1];if(n===void 0)continue;let r=Number(n);if(Number.isFinite(r)&&r>0)return r}return null}function Jj(e){return e.filter(e=>!Uj(e))}function Yj(e){return Oj.find(t=>t.value===e)?.token??null}function Xj(e,t,n,r){let i=Jj(e);t===`images`?i.push(lj):t===`videos`&&i.push(cj);let a=Yj(n);return a!==null&&i.push(a),r!==null&&r>0&&i.push(`${aj}${String(r)}`),i}function Zj(e){window.location.assign(oo$1(ro$1(Lj(e))));}function Qj(e){return e.startsWith(`-`)&&e.length>1?e.slice(1):`-${e}`}function $j(e,t,n){return t<0||n<t||t>=e.length?[...e]:e.filter((e,r)=>r<t||r>n)}function eM(e,t,n){return e.map((e,r)=>r===t?n:e)}function tM(e){return e===`artist`?`artist`:e===`character`?`character`:e===`copyright`?`copyright`:e===`metadata`?`metadata`:`default`}function nM(e){for(let t of e){if(!t.startsWith(uj))continue;let e=t.slice(9);if(Cj(e))return e}return null}var rM=[`?`,`+`,`-`],iM=1;function aM(e){let t=[...e.querySelectorAll(`a[href]`)].reverse();for(let e of t){let t=e.getAttribute(`href`);if(t===null||t.length===0)continue;let n;try{n=new URL(t,re$1);}catch{continue}let r=n.searchParams.get(le$1);if(r===null)continue;let i=Fj(r),a=i[0];if(i.length===iM&&a!==void 0)return zj(Rj(a))}for(let e of t){let t=e.textContent?.trim()??``;if(t.length>0&&!rM.includes(t))return zj(t)}return null}function oM(){let e=new Map,t=document.querySelector(RA);if(!(t instanceof HTMLUListElement))return e;for(let n of t.children){if(!(n instanceof HTMLLIElement))continue;let t=nM(n.classList);if(t===null)continue;let r=aM(n);r!==null&&e.set(r,t);}return w(e),e}function sM(){let e=document.querySelector(rn$2.filterAiCheckbox);return e instanceof HTMLInputElement?e:null}function cM(e){document.body.classList.toggle(rs$1,e);}function lM(e,t){let n=sM();if(n!==null)return e(n),()=>{};let r=false,i=e=>{r||(r=true,a.disconnect(),window.clearTimeout(o),e());},a=new MutationObserver(()=>{let t=sM();t!==null&&i(()=>{e(t);});});a.observe(document.documentElement,xj);let o=window.setTimeout(()=>{i(t);},bj);return ()=>{i(()=>{});}}function uM(){return et()??`posts`}function dM(e){return q$1(uM())}function fM(e,t){if(e[t]!==`(`)return null;for(let n=t+1;n<e.length;n+=1){if(e[n]===`(`)return null;if(e[n]===`)`){let r=e.slice(t+1,n);return r.length===0?null:{end:n,inner:r}}}return null}function pM(e){if(e.length===0||e.length%2==0)return null;let t=[];for(let n=0;n<e.length;n+=1){let r=e[n];if(r===void 0)return null;if(n%2==1){if(r!==`~`)return null}else {if(r===`(`||r===`)`||r===`~`)return null;t.push(r);}}return t.length>0?t:null}function mM(e){let t=e.join(` `),n=Lj([`(`,...e.flatMap((e,t)=>t===0?[e]:[`~`,e]),`)`]),r=IA(),i=e.length;return yo$1(n,r)||mo$1(n,r,Rc$1())>=0?{label:`Feed · ${String(r.length)} artists`,title:t}:{label:`Any of ${String(i)} tags`,title:t}}function hM(e){return e.map(e=>e.kind===`tag`?`t:${String(e.start)}:${e.token}:${e.chipKind}`:`g:${e.kind}:${String(e.start)}:${String(e.end)}:${e.label}:${e.title}`).join(`|`)}function gM(e){let t=oM(),n=[],r=0;for(;r<e.length;){let i=e[r];if(i===void 0)break;if(Uj(i)){r+=1;continue}let a=fM(e,r);if(a!==null){let t=e.slice(r,a.end+1),i=wo$1(Lj(t));if(i!==null&&i.length>0){n.push({kind:`id-group`,start:r,end:a.end,label:`${String(i.length)} posts`,title:t.join(` `)}),r=a.end+1;continue}let o=pM(a.inner);if(o!==null){let{label:e,title:t}=mM(o);n.push({kind:`or-group`,start:r,end:a.end,label:e,title:t}),r=a.end+1;continue}}let o=i.startsWith(`-`)&&i.length>1,s=t.get(zj(Rj(i)))??null;n.push({kind:`tag`,start:r,end:r,token:i,label:i,excluded:o,chipKind:s===null?Hs(Rj(i)):tM(s),title:Wj(i)?i:null}),r+=1;}return n}function _M(e){let t=Fj(e),n=gM(t);return {chips:n,chipsSig:hM(n),media:Gj(t),sort:Kj(t),minScore:qj(t)}}function vM(e){let t=document.getElementById(zA);if(t instanceof HTMLDivElement)return t.previousElementSibling!==e&&e.after(t),t;let n=document.createElement(`div`);return n.id=zA,n.className=BA,e.after(n),n}function yM(e,t){e.value=Ij(Lj(t));}function bM(e){let{input:t}=e,[n,r]=z$2(()=>_M(t.value)),[i,a]=z$2(n.minScore);Ws(n.chips.flatMap(e=>e.kind===`tag`&&!e.excluded&&e.chipKind==="default"&&!Wj(e.token)?[Rj(e.token)]:[]));let[o,s]=z$2(()=>{let e=sM();return e===null?null:dM()}),c=V$2(false),l=V$2(null),u=V$2(t.value),d=()=>{l.current!==null&&(window.clearTimeout(l.current),l.current=null);},f=e=>{d(),l.current=window.setTimeout(()=>{l.current=null,Zj(e);},rj);},p=e=>{let n=_M(t.value);u.current=t.value,r(e=>{let t=n.chipsSig===e.chipsSig;return t&&n.media===e.media&&n.sort===e.sort&&n.minScore===e.minScore?e:{...n,chips:t?e.chips:n.chips}}),c.current||a(n.minScore),e.navigate&&f(Fj(t.value));},m=(e,n)=>{yM(t,e),u.current=t.value;let i=_M(t.value);r(e=>{let t=i.chipsSig===e.chipsSig;return {...i,chips:t?e.chips:i.chips}}),c.current||a(i.minScore),n.navigate&&f(e);},h=V$2(p);h.current=p,B$2(()=>{let e=()=>{h.current({navigate:false});};t.addEventListener(hj,e),t.addEventListener(gj,e),t.addEventListener(vj,e);let n=document.querySelector(RA),r=()=>{window.setTimeout(()=>{h.current({navigate:false});},0);};n!==null&&n.addEventListener(_j,r);let i=window.setInterval(()=>{document.hidden||t.value!==u.current&&h.current({navigate:false});},nj);return ()=>{d(),t.removeEventListener(hj,e),t.removeEventListener(gj,e),t.removeEventListener(vj,e),n!==null&&n.removeEventListener(_j,r),window.clearInterval(i);}},[t]),B$2(()=>{let e=null,t=()=>{e!==null&&s(dM());},n=lM(n=>{e=n,s(dM()),cM(true),n.addEventListener(gj,t);},()=>{s(null),cM(false);});return ()=>{n(),e!==null&&e.removeEventListener(gj,t),cM(false);}},[]);let g=e=>{let n=e.target;if(!(n instanceof Element))return;let r=n.closest(`[${WA}]`);if(!(r instanceof HTMLElement))return;let i=r.getAttribute(WA),a=r.getAttribute(GA);if(i===null||a===null)return;let o=Number(i),s=Number(a);if(!Number.isFinite(o)||!Number.isFinite(s))return;if(n.closest(`[${qA}]`)!==null){e.preventDefault();let n=Fj(t.value);m($j(n,o,s),{navigate:true});return}if(r.getAttribute(KA)!==`1`)return;e.preventDefault();let c=Fj(t.value),l=c[o];l===void 0||Wj(l)||m(eM(c,o,Qj(l)),{navigate:true});},_=e=>{let n=wj.find(t=>t.value===e)?.value;if(n===void 0)return;let r=Fj(t.value);m(Xj(r,n,Kj(r),qj(r)),{navigate:true});},v=e=>{let n=Oj.find(t=>t.value===e)?.value;if(n===void 0)return;let r=Fj(t.value);m(Xj(r,Gj(r),n,qj(r)),{navigate:true});},y=()=>{let e=Fj(t.value),n=null;i!==null&&Number.isFinite(i)&&i>0&&(n=Math.floor(i));let r=qj(e);r===n?a(r):m(Xj(e,Gj(e),Kj(e),n),{navigate:true});},b=e=>{let n=Tj.find(t=>t.value===e)?.value;if(n===void 0)return;if(sM()===null){s(null);return}if(W()||n===q$1(uM()))return;let r=uM();K$1(r,n===z),X$1(r),s(n);let i=Fj(t.value),a=Fj(new URLSearchParams(window.location.search).get(`tags`)??``);Lj(i)===Lj(a)?window.location.reload():(d(),Zj(i));},x=Dj[uM()],S=x===void 0?Ej:`${Ej} in ${x}`,[C,w]=z$2(null),[T,ee]=z$2(false),te=()=>{d(),yM(t,[]),u.current=t.value,r(_M(``)),a(null),window.location.assign(oo$1([]));};return K$3(A$2,{children:[K$3(`style`,{children:Mt$2}),K$3(`div`,{className:ZA,ref:w}),K$3(`div`,{...T?{className:QA,inert:true}:{},children:K$3(lt$2,{className:VA,children:[n.chips.length>0?K$3(`div`,{className:JA,children:[K$3(Er$1,{children:`Tags`}),K$3(`div`,{className:HA,onClick:g,role:`list`,"aria-label":`Search tags`,children:n.chips.map(e=>{if(e.kind===`tag`){let t=e.excluded,n=t?`rdw-chip--exclude`:`rdw-chip--dot`,r=e.chipKind==="default"?Hs(Rj(e.token)):e.chipKind,i=!t&&r!=="default"?`rdw-chip--${r}`:``,a=!Wj(e.token);return K$3(`span`,{className:[`rdw-chip`,n,i,UA].filter(e=>e.length>0).join(` `),role:`listitem`,title:e.title??void 0,"data-chip-start":String(e.start),"data-chip-end":String(e.end),"data-chip-toggle":a?`1`:`0`,children:[t?null:K$3(`i`,{className:`rdw-chip__dot`,"aria-hidden":`true`}),K$3(`span`,{children:e.label}),K$3(`button`,{type:`button`,className:`rdw-chip__remove rdw-kit-focusable`,"aria-label":`Remove ${e.label}`,"data-chip-remove":`1`,children:K$3(mt$2,{size:12})})]},`t-${String(e.start)}-${e.token}`)}return K$3(`span`,{className:`rdw-chip rdw-chip--group ${UA}`,role:`listitem`,title:e.title,"data-chip-start":String(e.start),"data-chip-end":String(e.end),"data-chip-toggle":`0`,children:[K$3(`span`,{children:e.label}),K$3(`button`,{type:`button`,className:`rdw-chip__remove rdw-kit-focusable`,"aria-label":`Remove ${e.label}`,"data-chip-remove":`1`,children:K$3(mt$2,{size:12})})]},`g-${String(e.start)}-${String(e.end)}-${e.label}`)})})]}):null,K$3(`div`,{className:JA,children:[K$3(Er$1,{children:`Media`}),K$3(Or$1,{label:`Media`,options:wj.map(e=>({value:e.value,label:e.label})),value:n.media,onChange:_})]}),K$3(`div`,{className:YA,title:dj,children:[K$3(oi,{label:`Sort`,options:Oj.map(e=>({value:e.value,label:e.label})),value:n.sort,onChange:v}),K$3(`div`,{onFocusIn:()=>{c.current=true;},onFocusOut:e=>{let t=e.relatedTarget;t instanceof Node&&e.currentTarget.contains(t)||(c.current=false,y());},onKeyDown:e=>{e.key===mj&&(e.preventDefault(),y());},children:K$3(On$1,{label:`Min score`,placeholder:`Any`,value:i,min:1,step:1,onChange:a})})]}),o===null?null:K$3(`div`,{className:JA,children:[K$3(Er$1,{children:S}),K$3(Or$1,{label:S,options:Tj.map(e=>({value:e.value,label:e.label})),value:o,disabled:W(),onChange:b}),W()?K$3(ut,{}):null]}),K$3(`div`,{className:XA,children:[K$3(J$3,{variant:`secondary`,size:`s`,className:$A,title:pj,onClick:te,children:fj}),K$3(bA,{tags:t.value}),K$3(Qk,{barHost:C,onSelectingChange:ee})]})]})})]})}function xM(e){let t=Nj();if(t===null){m$2.warn(yj);return}let n=Pj(t);if(n===null){m$2.warn(yj);return}MA(t);let r=vM(n);ve$1(K$3(bM,{input:t}),r),r.classList.add(is$1);let i=()=>{wo()||os$1(r.getBoundingClientRect().height);};typeof ResizeObserver==`function`?new ResizeObserver(i).observe(r):window.requestAnimationFrame(i);}var SM={id:NA,label:PA,settingsCaption:`A panel under the search field: type, order and score are picked there and written into the search as text.`,pages:[...FA],defaultEnabled:true,css:Mj,mount:xM},CM=`tag-groups`,wM=`Collapse tags`,TM=`ul#tag-sidebar`,EM=`rdw-tag-group-toggle`,DM=`rdw-tag-group-collapsed`,OM=Kt$2(CM),kM=`Tag sidebar not found`,AM=new Set([`Copyright`,`Character`,`Artist`,`General`,`Meta`]),jM=[`General`,`Meta`],MM=[`list`,`post`],NM=`ul#tag-sidebar > li.${DM}`,PM=`html.${c$1} body.${OM} ${NM}`,FM=`body.${OM} ${NM}`,IM=[`${PM},`,`${FM} { display: none; }`,`body.${OM} button.${EM} {`,`  background: transparent;`,`  border: none;`,`  color: inherit;`,`  cursor: pointer;`,`  font: inherit;`,`  padding: 0;`,`}`,`body.${OM} button.${EM}:focus-visible {`,`  outline: 2px solid var(--rdw-accent);`,`  outline-offset: 2px;`,`}`].join(`
`),LM=A$3({collapsed:k$3(T$2())});function RM(){return {collapsed:[...jM]}}function zM(e){let t=LM.safeParse(e);return t.success?t.data:RM()}function BM(e){return AM.has(e)}function VM(e){let t=e.querySelector(`:scope > h6`);if(!(t instanceof HTMLHeadingElement))return null;let n=t.textContent?.trim()??``;return BM(n)?n:null}function HM(e){let t=[],n=null;for(let r of e.children){if(!(r instanceof HTMLLIElement))continue;let e=VM(r);e===null?n!==null&&n.members.push(r):(n={name:e,headerLi:r,members:[]},t.push(n));}return t}function UM(e,t){return `${e} (${String(t)})`}function WM(e,t,n){for(let t of e)t.classList.toggle(DM,n);t.setAttribute(`aria-expanded`,n?`false`:`true`);}function GM(e,t){e.setState({collapsed:[...t]});}function KM(e,t,n){let r=e.headerLi.querySelector(`:scope > h6`);if(!(r instanceof HTMLHeadingElement))return;let i=document.createElement(`button`);i.type=`button`,i.className=EM,i.textContent=UM(e.name,e.members.length);let a=t.has(e.name);WM(e.members,i,a),i.addEventListener(`click`,()=>{let r=!t.has(e.name);r?t.add(e.name):t.delete(e.name),WM(e.members,i,r),GM(n,[...t]);}),r.replaceChildren(i);}function qM(e){let t=document.querySelector(TM);if(!(t instanceof HTMLUListElement)){m$2.warn(kM);return}let n=e.getState(zM),r=new Set(n.collapsed),i=HM(t);for(let t of i)KM(t,r,e);}var JM={id:CM,label:wM,settingsCaption:`The tags in the sidebar fold by type, and an artist, character or copyright tag gets a Follow button.`,pages:[...MM],defaultEnabled:true,css:IM,resetStateOnToggle:true,mount:qM},YM=`tag-wiki`,XM=`Tag description on the ? in the sidebar`,ZM=Kt$2(YM),QM=`ul#tag-sidebar`,$M=`?`,eN=`page=wiki`,tN=`table.highlightable a[href*="page=wiki"][href*="s=view"]`,nN=`div#content > div.flexi > div`,rN=`a[href*="${le$1}="]`,iN=`Now Viewing:`,aN=`Tag type:`,oN=`Other Wiki Information`,sN=`rdw-tag-wiki`,cN=`rdw-tag-wiki-title`,lN=`rdw-tag-wiki-type`,uN=`rdw-tag-wiki-text`,dN=`rdw-tag-wiki-foot`,fN=320,pN=8,mN=2147483e3,hN=`Reading the wiki…`,gN=`The wiki has no entry for this tag.`,_N=`The wiki entry has no description.`,vN=`Could not read the wiki. Try again later.`,yN=`Open in the wiki`,bN=`Tag description`,xN=`
#${sN} {
  position: fixed;
  z-index: ${String(mN)};
  box-sizing: border-box;
  width: ${String(fN)}px;
  max-width: calc(100vw - 16px);
  padding: 10px 12px;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-l);
  background: var(--rdw-surface);
  box-shadow: var(--rdw-shadow-2);
  color: var(--rdw-text);
  font: 12px/1.45 var(--rdw-font);
}
#${sN} .${cN} {
  margin: 0;
  font: 700 13px var(--rdw-font);
  overflow-wrap: anywhere;
}
#${sN} .${lN} {
  margin: 2px 0 0;
  color: var(--rdw-muted);
}
#${sN} .${uN} {
  margin: 8px 0 0;
  max-height: 240px;
  overflow-y: auto;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
#${sN} .${dN} {
  margin: 8px 0 0;
  padding-top: 8px;
  border-top: 1px solid var(--rdw-border);
}
#${sN} .${dN} a {
  color: var(--rdw-accent);
}
`.trim();function SN(e){return e.trim().toLowerCase().replaceAll(` `,`_`)}function CN(e,t){let n=SN(t);for(let t of e.querySelectorAll(tN))if(SN(t.textContent??``)===n)return t.getAttribute(`href`);return null}function wN(e){return e instanceof HTMLBRElement?`
`:e.textContent??``}function TN(e){let t=e.querySelector(nN),n=t?.querySelector(`h2`)??null;if(t==null||n===null)return null;let r=(n.textContent??``).replace(iN,``).trim(),i=``,a=``,o=false;for(let e of t.childNodes){let t=(e.textContent??``).trim();if(e===n)o=true;else if(o){if(e instanceof HTMLElement&&t.startsWith(aN))i=t.slice(9).trim();else {if(e instanceof HTMLElement&&t===oN)break;a+=wN(e);}}}let s=a.split(`
`).map(e=>e.replace(/\s+/g,` `).trim()).join(`
`).replace(/\n{3,}/g,`

`).trim();return {title:r,type:i,text:s}}var EN=new Map;async function DN(e){let t=new URL(e,window.location.href);if(t.origin!==window.location.origin)throw Error(`cross-origin wiki address`);let n=await fetch(t.href,{method:`GET`,credentials:be$2});if(!n.ok)throw Error(`HTTP ${String(n.status)}`);return new DOMParser().parseFromString(await n.text(),`text/html`)}async function ON(e,t){let n=EN.get(e);if(n!==void 0&&n.kind!==`failed`)return n;let r;try{let n=CN(await DN(t),e);if(n===null)r={kind:`none`,href:t};else {let e=TN(await DN(n));r=e===null?{kind:`none`,href:n}:{kind:`entry`,entry:e,href:n};}}catch(n){m$2.warn(`tag-wiki: request failed`,e,n),r={kind:`failed`,href:t};}return EN.set(e,r),r}var kN=null;function AN(){document.getElementById(sN)?.remove(),document.removeEventListener(`keydown`,jN,true),document.removeEventListener(`pointerdown`,MN,true);let e=kN;kN=null,e?.focus();}function jN(e){e.key===`Escape`&&(e.preventDefault(),AN());}function MN(e){let t=document.getElementById(sN),n=e.target;t!==null&&n instanceof Node&&!t.contains(n)&&!(kN?.contains(n)??false)&&AN();}function NN(e,t){let n=document.createElement(`p`);return n.className=e,n.textContent=t,n}function PN(e,t,n){let r=[NN(cN,n?.kind===`entry`?n.entry.title:t)];if(n===null?r.push(NN(uN,hN)):n.kind===`entry`?(n.entry.type.length>0&&r.push(NN(lN,n.entry.type)),r.push(NN(uN,n.entry.text.length>0?n.entry.text:_N))):r.push(NN(uN,n.kind===`none`?gN:vN)),n!==null){let e=document.createElement(`p`);e.className=dN;let t=document.createElement(`a`);t.href=n.href,t.textContent=yN,e.append(t),r.push(e);}e.replaceChildren(...r);}function FN(e,t){let n=t.getBoundingClientRect(),r=Math.min(fN,window.innerWidth-16),i=n.right+pN;i+r>window.innerWidth-pN&&(i=Math.max(pN,n.left-r-pN));let a=e.offsetHeight,o=Math.max(pN,Math.min(n.top,window.innerHeight-a-pN));e.style.left=`${String(i)}px`,e.style.top=`${String(o)}px`;}function IN(e){let t=e.querySelectorAll(rN),n=t[t.length-1]?.getAttribute(`href`)??null;if(n===null)return null;try{let e=new URL(n,window.location.href).searchParams.get(le$1);return e===null||e.trim().length===0?null:e.trim()}catch{return null}}function LN(e,t){if(kN===e){AN();return}AN();let n=document.createElement(`div`);n.id=sN,n.setAttribute(`role`,`dialog`),n.setAttribute(`aria-label`,bN),PN(n,t,null),document.body.append(n),FN(n,e),kN=e,document.addEventListener(`keydown`,jN,true),document.addEventListener(`pointerdown`,MN,true),ON(t,e.href).then(r=>{kN===e&&n.isConnected&&(PN(n,t,r),FN(n,e));});}function RN(e){if(!document.body.classList.contains(ZM)||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;let t=e.target,n=t instanceof Element?t.closest(`a`):null;if(!(n instanceof HTMLAnchorElement)||(n.textContent??``).trim()!==$M||!(n.getAttribute(`href`)??``).includes(eN))return;let r=n.closest(`li`),i=r===null?null:IN(r);i!==null&&(e.preventDefault(),e.stopPropagation(),LN(n,i));}var zN=null;function BN(e){let t=document.querySelector(QM);t!==null&&t!==zN&&(zN=t,t.addEventListener(`click`,e=>{e instanceof MouseEvent&&RN(e);}));}var VN={id:YM,label:XM,pages:[`list`,`post`],defaultEnabled:true,cssOnly:true,settingsCaption:`Shows the wiki text beside the tag instead of opening the wiki. Two requests on a click: the wiki search and the entry.`,css:xN,mount:BN},HN=`thumb-tooltip`,UN=`Hide tag tooltip on thumbnails`,WN=[`list`,`favorites`,`other`],GN=Kt$2(HN),KN=`${GN}-inline`,qN=`inline`,JN=`:is(${rn$2.thumb}, ${rn$2.commentThumb}) > a:not([onclick])`,YN=`
body.${GN} ${rn$2.thumb} > a > img,
body.${GN} ${rn$2.commentThumb} > a > img {
  pointer-events: none;
}
body.${GN}.${KN} ${JN} {
  display: inline-block;
}
`.trim();function XN(e){let t=document.querySelector(JN);t!==null&&window.getComputedStyle(t).display===qN&&document.body.classList.add(KN);}var ZN={id:HN,label:UN,pages:[...WN],defaultEnabled:true,css:YN,cssOnly:true,mount:XN},QN=`video-mark`,$N=`Play icon on video thumbnails`,eP=`Off: a frame around the thumbnail instead. In the site's own themes the site's frame stays.`,tP=Kt$2(QN),nP=`html.${c$1} body.${tP}`,rP={id:QN,label:$N,pages:[`list`,`favorites`,`other`],defaultEnabled:true,cssOnly:true,settingsCaption:eP,css:`
${nP} .${Jt$2} > a > img,
${nP} .webm-thumb {
  border: 0;
}
${nP} .${Jt$2}::after {
  content: "\\25B6\\FE0E";${Yt$2}
}
@supports (anchor-name: --a) {
  ${nP} .${Jt$2}::after {
    position-anchor: ${Ht$2};
    left: calc(anchor(left) + 6px);
    bottom: calc(anchor(bottom) + 6px);
  }
  html.${Vt$2}.${c$1} body.${tP} .${Jt$2}::after {
    position-anchor: ${Ut$2};
  }
}
`.trim(),mount:()=>void 0},iP=`rdw-tags-collapsed`,aP=`rdw-tags-toggle`,oP=`rdw-comments-page-style`,sP=3,cP=1,lP=`:scope > span`,uP=`aria-expanded`,dP=`
${rn$2.commentTags}.${iP} {
  max-height: ${String(sP)}lh !important;
  overflow: hidden !important;
}
.${aP} {
  display: block;
  margin: 4px 0 0;
  padding: 0;
  border: 0;
  background: none;
  color: var(--rdw-accent);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.${aP}:hover {
  color: var(--rdw-text);
}
.${aP}:focus-visible {
  outline: 2px solid var(--rdw-accent);
  outline-offset: 2px;
}
`.trim();function fP(e=document){return e.querySelector(rn$2.commentList)!==null}function pP(e){return `Show all ${String(e)} tags`}var mP=`Show fewer tags`;function hP(){if(document.getElementById(oP)!==null)return;let e=document.createElement(`style`);e.id=oP,e.textContent=dP,document.head.append(e);}function gP(e){if(e.classList.add(iP),e.scrollHeight<=e.clientHeight+cP)return e.classList.remove(iP),false;let t=pP(e.querySelectorAll(lP).length),n=document.createElement(`button`);return n.type=`button`,n.className=aP,n.textContent=t,n.setAttribute(uP,`false`),n.addEventListener(`click`,()=>{let r=e.classList.toggle(iP);n.textContent=r?t:mP,n.setAttribute(uP,r?`false`:`true`);}),e.after(n),true}function _P(e=document){let t=0;for(let n of e.querySelectorAll(rn$2.commentTags))n instanceof HTMLElement&&gP(n)&&(t+=1);return t}function vP(){fP()&&(hP(),Pt$3(document,rn$2.commentThumb),qt$2(rn$2.commentThumb),_P());}var yP=`video-preview`,bP=`Video preview on hover`,xP=`Each preview loads the video file itself.`,SP=[`list`,`favorites`,`other`],CP=`rdw-video-preview`,wP=`img.preview.webm-thumb`,TP=`${rn$2.thumb}, ${rn$2.commentThumb}`,EP=3,DP=`none`,OP=`body.${Kt$2(yP)}`,kP=`
${dt$3.trim()}
${OP} .${CP} {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: ${String(EP)};
  margin: 0;
  padding: 0;
  border: 0;
  object-fit: contain;
  pointer-events: none;
}
@supports (anchor-name: --a) {
  ${OP} .${CP} {
    position-anchor: ${Ht$2};
    top: anchor(top);
    left: anchor(left);
    width: anchor-size(width);
    height: anchor-size(height);
  }
}
`.trim(),AP=new Map;function jP(e){let t=AP.get(e);return t===void 0?false:Date.now()-t<3e4||(AP.delete(e),false)}var MP=new WeakMap,NP=0,PP=null,FP=null,IP=null,LP=false;function RP(){FP!==null&&(window.clearTimeout(FP),FP=null);}function zP(){let e=PP;e!==null&&(PP=null,e.video.removeEventListener(`error`,e.onError),e.video.pause(),e.video.src=``,e.video.load(),e.video.remove());}function BP(e,t){let n=e.querySelector(`#p${t}`);if(n instanceof HTMLAnchorElement)return n;let r=e.querySelector(rn$2.thumbLink);if(r instanceof HTMLAnchorElement)return r;let i=e.querySelector(Ot$3)?.parentElement;return i instanceof HTMLAnchorElement?i:null}function VP(e){return cn$2(e)??ln$2(e)??un$2(e)}function HP(e){let t=e.querySelector(wP);if(t instanceof HTMLImageElement)return t;if(!e.classList.contains(`rdw-video-thumb`))return null;let n=e.querySelector(Ot$3);return n instanceof HTMLImageElement?n:null}function UP(e,t,n){let r=n.getBoundingClientRect();if(r.width<=0||r.height<=0)return;let i=t.getBoundingClientRect();e.style.top=`${String(r.top-i.top-t.clientTop)}px`,e.style.left=`${String(r.left-i.left-t.clientLeft)}px`,e.style.width=`${String(r.width)}px`,e.style.height=`${String(r.height)}px`;}function WP(e){let t=VP(e);if(t===null||jP(t))return;let n=HP(e);if(n===null)return;let r=Et$3(n.currentSrc||n.src);if(r===null)return;let i=BP(e,t);if(i===null)return;zP(),Tt$3(e);let o=document.createElement(`video`);o.className=CP,o.muted=true,o.defaultMuted=true,o.loop=true,o.playsInline=true,o.setAttribute(`playsinline`,``),o.preload=DP,o.setAttribute(`aria-hidden`,`true`);let s=()=>{AP.set(t,Date.now()),PP?.video===o?zP():(o.removeEventListener(`error`,s),o.pause(),o.src=``,o.load(),o.remove());};o.addEventListener(`error`,s),o.src=r,i.after(o),UP(o,e,n),PP={thumb:e,video:o,postId:t,onError:s};let c=o.play();c!==void 0&&c.catch(()=>{});}function GP(e){let t=e.currentTarget;if(!(t instanceof HTMLElement))return;let n=VP(t);n===null||jP(n)||HP(t)!==null&&(RP(),IP=t,FP=window.setTimeout(()=>{FP=null,IP===t&&WP(t);},200));}function KP(e){let t=e.currentTarget;t instanceof HTMLElement&&(IP===t&&(IP=null),RP(),PP?.thumb===t&&zP());}function qP(e){MP.get(e)!==NP&&HP(e)!==null&&(MP.set(e,NP),e.addEventListener(`pointerenter`,GP),e.addEventListener(`pointerleave`,KP));}function JP(e){let t=e.querySelectorAll(TP);for(let e of t)e instanceof HTMLElement&&qP(e);}function YP(){LP||(LP=true,JP(document),ot$4(e=>{JP(e);}));}function XP(e){(e.pageKind!==`other`||fP())&&Os$2(()=>{YP();});}var ZP={id:yP,label:bP,pages:[...SP],defaultEnabled:false,settingsCaption:xP,css:kP,mount:XP},QP=[X_,Pa$1,JM,SM,Ux,_p,Xw,Ua,TC,Mk,oa,ZN,Jh,YE,ZP,$a,Ds,RS,gy,Ay,Ax,ba$1,xa$1,pv,VN,rP],Q={header:`header`,grid:`grid`,post:`post`,video:`video`,feed:`feed`,ai:`ai`,search:`search`,collections:`collections`,favorites:`favorites`,downloads:`downloads`,appearance:`appearance`,other:`other`},$P=[{id:Q.header,title:`Header`},{id:Q.grid,title:`Grid and thumbnails`},{id:Q.post,title:`Post page`},{id:Q.video,title:`Video`},{id:Q.feed,title:`Feed`},{id:Q.ai,title:`AI posts`},{id:Q.search,title:`Search and sidebar`},{id:Q.collections,title:`Collections`},{id:Q.other,title:`Other`}]; exports({d:QP,Q:Q,$:$P});function eF(){return new Map([[Pa$1.id,Q.header],[Ux.id,Q.grid],[Ua.id,Q.grid],[TC.id,Q.grid],[ZN.id,Q.grid],[oa.id,Q.grid],[Mk.id,Q.post],[RS.id,Q.post],[Ay.id,Q.post],[Ax.id,Q.post],[gy.id,Q.post],[$a.id,Q.post],[YE.id,Q.video],[ZP.id,Q.video],[rP.id,Q.video],[X_.id,Q.feed],[pv.id,Q.feed],[SM.id,Q.search],[JM.id,Q.search],[VN.id,Q.search],[ba$1.id,Q.search],[_p.id,Q.collections],[Xw.id,Q.collections],[Jh.id,Q.favorites],[Ds.id,Q.downloads],[xa$1.id,Q.appearance]])}var tF=null;function nF(e){return tF??=eF(),tF.get(e)??Q.other}function rF(e){return QP.find(t=>t.id===e)}function iF(e){let t=rF(e);return t!==void 0&&jc$1(e,t.defaultEnabled)}function aF(e){let t=rF(e);if(t?.choice===void 0)return ``;let n=Pc$1(e);return n!==void 0&&t.choice.options.some(e=>e.value===n)?n:t.choice.defaultValue}function oF(){return za$2()??{pageKind:P$3(window.location.search),search:window.location.search}}function sF(e,t){let n=rF(e);if(n?.cssOnly!==true||!kc$1())return;if(!t){document.body.classList.remove(Kt$2(n.id)),Ua$1(n);return}Va$1(n),document.body.classList.add(Kt$2(n.id)),n.choice!==void 0&&(Ua$1(n),document.body.classList.add(qt$3(n.id,aF(n.id))));let{pageKind:r,search:i}=oF();Wa$1(n,r,i);}function cF(e,t){let n=rF(e);n?.cssOnly===true&&n.choice!==void 0&&kc$1()&&jc$1(e,n.defaultEnabled)&&(Va$1(n),Ua$1(n),document.body.classList.add(qt$3(n.id,t)));}function lF(e,t){return !Ra$1(e.id)&&e.pages.includes(t)&&jc$1(e.id,e.defaultEnabled)}async function uF(e,t,n=QP){if(Ba$1(e,t),kc$1())for(let r of n)lF(r,e)&&(Ga$1(r,e,t),await Ka$1());}var dF=`rdw-page-title`,fF=`rdw-section-label`,pF=`rdw-select__list`,mF=`rdw-ac__list`,hF=`rdw-dialog`,gF=`thin`,_F=`rdw-tabs`,vF=`rdw-tabs__tab`,yF=2,bF=12,xF=`[${l$1}="${u$2}"]`,SF=`[${l$1}="${d$2}"]`,CF=`
/* One ring for the keyboard's focus on the own pages too: the cover of a post
   in a collection, a link, a button without a ring of its own. Inside
   ":where", so that a control with its own way of showing focus keeps it. */
:where(a, button, summary, [tabindex]:not([tabindex="-1"])):focus-visible {
  outline: 2px solid var(--rdw-accent);
  outline-offset: 2px;
  border-radius: 4px;
}
.${dt$4.pageCard} {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;
}
.${dt$4.scrollRegion} {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
/* Shadow-DOM scrollables — tokens (site-skin cannot pierce :host). */
.${dt$4.scrollRegion},
.${pF},
.${mF},
.${hF} {
  scrollbar-width: ${gF};
  scrollbar-color: var(${h$3.border}) var(${h$3.surface});
}
/* Kit tabs in page shadow — tokens for all themes; Site muted→text. */
.${_F} {
  border-bottom: 1px solid var(${h$3.border});
  color: var(${h$3.text});
}
.${vF} {
  background: transparent;
  border: 0;
  border-bottom: ${String(yF)}px solid transparent;
  color: var(${h$3.muted});
}
.${vF}[aria-selected="true"] {
  color: var(${h$3.text});
  font-weight: 600;
  border-bottom-color: var(${h$3.accent});
}
:host-context(${xF}) .${vF},
:host-context(${SF}) .${vF} {
  color: var(${h$3.text});
}
:host-context(${xF}) .${vF}[aria-selected="true"],
:host-context(${SF}) .${vF}[aria-selected="true"] {
  border-bottom-color: var(${h$3.accent});
  color: var(${h$3.text});
}
.${Ie$3.section} {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.${dt$4.settingsGroup} {
  display: grid;
  gap: 0;
}
/* A row is a name with its caption close under it on the left, and the
   control on the right, in the middle of the two (the designer, 19.11.2026):
   a caption half-way between two rows was nobody's. */
.${dt$4.settingsRow} {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  column-gap: 12px;
  align-items: center;
  /* No room at the sides: the card gives one left edge to all that is in it. */
  padding: 9px 0;
  font-size: 12.5px;
  color: var(--rdw-text);
}
.${dt$4.settingsRow} > * {
  grid-column: 1 / -1;
}
/* A line between settings, so that a switch reads with its own name. */
.${dt$4.settingsRow} + .${dt$4.settingsRow} {
  border-top: 1px solid var(--rdw-border);
}
/* The switches of the features are a group of their own inside the list:
   the line is also drawn where that group begins and where it ends. */
.${dt$4.settingsRow} + .${dt$4.settingsGroup},
.${dt$4.settingsGroup} + .${dt$4.settingsRow} {
  border-top: 1px solid var(--rdw-border);
}
/* The options of a setting are part of it: no line between the two. */
.${dt$4.settingsRow} + .${dt$4.settingsRow}.${dt$4.settingsRowSub} {
  border-top: 0;
  padding-top: 0;
  /* Set in: it belongs to the setting over it. */
  padding-left: 16px;
}
.${dt$4.settingsRow} > .${dt$4.settingsCaption} {
  grid-column: 1;
  grid-row: 2;
  margin: 3px 0 0;
}
.${dt$4.settingsCaption} {
  margin: 0;
  font-size: ${String(bF)}px;
  line-height: 1.4;
  color: var(--rdw-muted);
}
/* Muted fails AA on the site's own themes (see the section label below). */
:host-context(${xF}) .${dt$4.settingsCaption},
:host-context(${SF}) .${dt$4.settingsCaption} {
  color: var(--rdw-text);
}
/*
 * Card vs page: surface not darker than page; Site default card = --c-bg,
 * border = --c-bg-alt. Higher specificity than kit .rdw-card so it wins.
 */
:host-context(${xF}) .rdw-card.${dt$4.pageCard} {
  background: ${On$2};
  border-color: ${kn$2};
}
:host-context(${SF}) .rdw-card.${dt$4.pageCard} {
  background: ${Pn$2};
  border-color: ${In$2};
}
.${dF} {
  color: var(--rdw-text);
}
.${fF} {
  color: var(--rdw-muted);
}
/* Muted fails AA on site greens / site-dark chrome — use text. */
:host-context(${xF}) .${dF},
:host-context(${SF}) .${dF},
:host-context(${xF}) .${fF},
:host-context(${SF}) .${fF} {
  color: var(--rdw-text);
}
/* The parts of a switch and of a number stand in the row's own grid. */
.${dt$4.settingsRow} > .rdw-switch-row,
.${dt$4.settingsRow} > .rdw-num {
  display: contents;
}
.${dt$4.settingsRow} > .rdw-switch-row > .rdw-switch__label,
.${dt$4.settingsRow} > .rdw-num > .rdw-num__label {
  grid-column: 1;
  grid-row: 1;
}
.${dt$4.settingsRow} > .rdw-switch-row > .rdw-switch,
.${dt$4.settingsRow} > .rdw-num > .rdw-num__input {
  grid-column: 2;
  grid-row: 1;
}
/* With a caption the control is in the middle of the name and the caption. */
.${dt$4.settingsRow}:has(> .${dt$4.settingsCaption}) > .rdw-switch-row > .rdw-switch,
.${dt$4.settingsRow}:has(> .${dt$4.settingsCaption}) > .rdw-num > .rdw-num__input {
  grid-row: 1 / span 2;
}
/* A row that cannot be changed now is dimmed whole, not its switch alone. */
.${dt$4.settingsRow}:has(:disabled) {
  opacity: 0.55;
}
.${dt$4.settingsRow} .rdw-switch:disabled,
.${dt$4.settingsRow} .rdw-num__input:disabled {
  opacity: 1;
}
/* A list and a number read as a switch does: the name on the left, the
   control on the right, as wide as what it holds. */
.${dt$4.settingsRow} .rdw-select {
  width: 100%;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
/* The name of a setting is not a heading: no capitals, the text of a row. */
.${dt$4.settingsRow} .rdw-select__label,
.${dt$4.settingsRow} .rdw-num__label {
  font: 400 12.5px var(--rdw-font);
  letter-spacing: 0;
  text-transform: none;
  color: var(--rdw-text);
}
.${dt$4.settingsRow} .rdw-select__trigger {
  flex: none;
  width: 160px;
}
/* The open list keeps under its trigger, not under the whole row. */
.${dt$4.settingsRow} .${pF} {
  left: auto;
  width: 160px;
  box-sizing: border-box;
}
.${dt$4.settingsRow} .rdw-num__input {
  flex: none;
  width: 80px;
}
.${Ie$3.list} {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.${Ie$3.listItem} {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-surface);
  color: var(--rdw-text);
}
.${Ie$3.itemName} {
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
.${Ie$3.itemName}:disabled {
  color: var(--rdw-muted);
  cursor: not-allowed;
}
.${Ie$3.itemActions},
.${Ie$3.formActions},
.${Ie$3.toolbar},
.${Ie$3.confirmRow} {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.${Ie$3.form} {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.${Ie$3.hint} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 12px;
}
.${Ie$3.error} {
  margin: 0;
  color: var(--rdw-danger);
  font-size: 12px;
}
`.trim(),wF=`tiles`,TF=`list`,EF=`View`,DF=[{value:wF,label:`Tiles`},{value:TF,label:`List`}],OF=`following-view`,kF=`collections-view`,AF=`max(0px, calc((100% - 960px) / 2))`; exports({as:EF,ar:DF,aI:OF,aB:kF,av:AF});function jF(e){return e===`tiles`||e===`list`}function MF(e){let t=Ic$1(e);return jF(t)?t:wF}function NF(e,t){Lc$1(e,t);}var PF=32,FF=13,IF=`rdw-page-shell`,LF=`rdw-page-shell--bare`,RF=12,zF=24,BF=`rdw-page-title`,VF=`rdw-page-title--hidden`,HF=`rdw-layout-wide`,UF=`rdw-layout-full`,WF=`
:host {
  all: initial;
  /* The site's own stylesheet names a font for every div, and a rule of the
     page beats :host unless :host says !important. Without it the script's
     pages were set in the site's wider font in the themes without the skin. */
  font-family: var(--rdw-font) !important;
  font-size: 13px;
  line-height: 1.35;
  color: var(--rdw-text);
  background: transparent;
  /* The script's own pages have room: their controls are a step larger. */
  ${Je$2}: ${String(PF)}px;
  ${Ye$2}: ${String(FF)}px;
}
.${IF} {
  box-sizing: border-box;
  max-width: 960px;
  margin: 0 auto;
  padding: ${String(zF)}px 12px 32px;
  display: flex;
  flex-direction: column;
  gap: ${String(RF)}px;
}
.${HF} .${IF} {
  max-width: none;
  margin: 0;
  padding: ${String(zF)}px 20px 32px;
}
.${UF} .${IF} {
  max-width: none;
  margin: 0;
  padding: ${String(zF)}px 20px 32px;
}
/* The toolbar gets the same space above it as there is between it and the list. */
.${IF}.${LF} {
  padding-top: ${String(RF)}px;
}
.${HF} .${BF} {
  padding-inline: ${AF};
}
.${BF} {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--rdw-text);
}
.${BF}.${VF} {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
${CF}
${ya$2}
`,GF=[at$2,st$2,ct$2,Mt$2,_n$1,Cn$1,Tn$1,Dn$1,Ln$1,Hn$1,br$1,xr$1,Tr$1,Dr$1,ai,qr,di,yi,Kt$1,Ni].join(`
`);function KF(e){return K$3(A$2,{children:[K$3(`style`,{children:WF}),K$3(`div`,{className:e.titleHidden?`${IF} ${LF}`:IF,children:[e.title===null?null:K$3(`h1`,{className:e.titleHidden?`${BF} ${VF}`:BF,children:e.title}),K$3($e$2.Provider,{value:true,children:e.children})]}),K$3(`style`,{children:GF})]})}function qF(e){return kt$3(e)?null:e===`collections`?st$3.collections:e===`following`?st$3.following:e===`stats`?st$3.stats:st$3.settings}function JF(e){return e===`collections`||e===`following`||e===`settings`}var YF=null,XF=null,ZF=null,QF=null;function $F(){return YF===null&&(YF=async()=>{let e=await module.import('./settings-page-DQbcdbAV-B2YUYsJ1.js');return K$3(e.SettingsPage,{})}),YF}function eI(){return XF===null&&(XF=async()=>{let e=await module.import('./collections-page-BHBUi-EK-XUUGRCfk.js');return K$3(e.CollectionsPage,{})}),XF}function tI(){return ZF===null&&(ZF=async()=>{let e=await module.import('./following-page-X6yD8OvD-C9JpxCRa.js');return K$3(e.FollowingPage,{})}),ZF}function nI(){return QF===null&&(QF=async()=>{let e=await module.import('./stats-section-Dir8yRE7-BLRMW4oY.js');return K$3(e.StatsPage,{})}),QF}function rI(e){return async()=>{let t=await module.import('./collection-detail-page-B_-pdwWz-DclH19ZZ.js');return K$3(t.CollectionDetailPage,{collectionId:e},e)}}function iI(e){return kt$3(e)?rI(e.collectionId):e===`collections`?eI():e===`following`?tI():e===`stats`?nI():$F()}function aI(e){return e===`collections`||e===`following`}var oI=null;function sI(){lI!==null&&oI!==null&&(lI.classList.toggle(HF,aI(oI)),lI.classList.toggle(UF,oI===`stats`||oI===`settings`));}var cI=null,lI=null,uI=0;function dI(e){Jn$2(e,gi$1(Hc$1()));}function fI(e){if(cI!==null&&lI!==null)return cI.parentElement!==e.parentElement&&e.after(cI),{host:cI,mount:lI};let t=document.getElementById(et$3);t!==null&&t.remove();let n=document.createElement(`div`);n.id=et$3;let r=n.attachShadow({mode:`open`}),i=document.createElement(`div`);return r.append(i),e.after(n),cI=n,lI=i,{host:n,mount:i}}async function pI(e,t){let{host:n,mount:r}=fI(t);dI(n);let i=++uI,a=await iI(e)();i===uI&&lI===r&&(oI=e,sI(),ve$1(K$3(Gt$1.Provider,{value:true,children:K$3(KF,{title:qF(e),titleHidden:JF(e),children:a})}),r));}function mI(){uI+=1,lI!==null&&ve$1(null,lI),cI!==null&&cI.remove(),cI=null,lI=null,oI=null;let e=document.getElementById(et$3);e!==null&&e.remove();}var hI=`hashchange`,gI=`popstate`,_I=`click`,vI=``,yI=false,bI=0;function xI(){let e=M$3(nt$3);e.textContent=zt$2();}function SI(){let e=document.querySelector(rt$3);return e instanceof HTMLElement?e:null}async function CI(e){let t=SI();t!==null&&(document.documentElement.classList.add($e$3),await pI(e,t),Or(At$3(e)));}function wI(){document.documentElement.classList.remove($e$3),mI(),kr();}async function TI(){let e=++bI;if(SI()===null){wI();return}let t=Rt$2(window.location.hash);if(t===null)wI();else try{await CI(t);}catch(t){m$2.error(`router: the page could not be shown`,t),e===bI&&wI();}}function EI(){TI();}function DI(){TI();}function OI(e){return e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey}async function kI(e){let t=Ft$3(e),n=`${window.location.pathname}${window.location.search}${t}`;Rt$2(window.location.hash)===null?window.history.pushState(window.history.state,vI,n):window.history.replaceState(window.history.state,vI,n),await TI();}function AI(e){if(e.defaultPrevented||OI(e))return;let t=e.target;if(!(t instanceof Element))return;let n=t.closest(`a`);if(!(n instanceof HTMLAnchorElement)||n.target===`_blank`||n.hasAttribute(`download`))return;let r;try{r=new URL(n.href,window.location.href);}catch{return}if(r.origin!==window.location.origin||r.pathname!==window.location.pathname||r.search!==window.location.search)return;let i=Rt$2(r.hash);i!==null&&(e.preventDefault(),kI(i));}async function jI(){xI(),SI()===null?wI():(Sr(),yI||(yI=true,window.addEventListener(hI,EI),window.addEventListener(gI,DI),document.addEventListener(_I,AI)),await TI());}function MI(e){let t=e.querySelectorAll(`a[href]`);for(let e of t){if(!(e instanceof HTMLAnchorElement)||e.hasAttribute(`onclick`))continue;let t=e.getAttribute(`href`);if(t===null||t.length===0)continue;let n;try{n=new URL(t,re$1);}catch{continue}if(n.searchParams.get(`page`)!==`post`||n.searchParams.get(`s`)!==`list`)continue;let r=n.searchParams.get(le$1);if(r!==null)return R$3(r)}return null}function NI(e,t){let n=new Set,r=[];for(let t of e)n.has(t)||(n.add(t),r.push(t));for(let e of t)n.has(e)||(n.add(e),r.push(e));return r}function PI(){let e=Io$1(),t=Kc$1();if(e===null||e.length===0)return t;let n=NI(e,t);return Fo$1(n),n}function FI(e,t){let n=K$4(),r=new Map(n.artists.map(e=>[e.tag,e])),i=Date.now();n.artists=e.map(e=>{let n=r.get(e);return n===void 0?t!==void 0&&t.tag===e&&t.kind!==`artist`?{tag:e,addedAt:i,kind:t.kind}:{tag:e,addedAt:i}:n}),q$4(n),Fo$1(e);}var II=[[rn$2.tagTypeArtist,ta],[rn$2.tagTypeCharacter,na],[rn$2.tagTypeCopyright,ra]];function LI(e){return PI().includes(e)}function RI(e,t){let n=PI();n.includes(e)?FI(n):FI([...n,e],{tag:e,kind:t});}function zI(e){FI(PI().filter(t=>t!==e));}function BI(e,t){e.setAttribute(`aria-pressed`,t?`true`:`false`),e.classList.toggle(Ie$3.artistFollowMarked,t);let n=t?Fe$3.artistFollowing:Fe$3.artistFollow,r=e.dataset.rdwArtistTag??``;e.setAttribute(`aria-label`,`${n}: ${r}`),e.textContent=n;}function VI(e,t,n){if(e.querySelector(rn$2.artistFollowButton)!==null)return;let r=document.createElement(`button`);r.type=`button`,r.className=Ie$3.artistFollow,r.dataset.rdwArtistTag=t,BI(r,LI(t)),r.addEventListener(`click`,e=>{e.preventDefault(),e.stopPropagation();let i=r.getAttribute(`aria-pressed`)===`true`;try{i?(zI(t),BI(r,!1)):(RI(t,n),BI(r,!0));}catch{BI(r,LI(t));}}),e.append(r);}function HI(e=document,t=window.location.search){let n=P$3(t);if(n!==`list`&&n!==`post`)return;$h();let i=e.querySelector(rn$2.tagSidebar);if(i!==null)for(let[e,t]of II)for(let n of i.querySelectorAll(e)){if(!(n instanceof HTMLElement))continue;let e=MI(n);e!==null&&VI(n,e,t);}}var UI=`rdw-list-pages-style`,WI=`table.highlightable tr.odd, table.highlightable tr.even`,GI=`a[href*="${le$1}="]`,KI=`forum-seen`,qI=`div#forum`,JI=`span.forum-topic a[href], a[href*='page=forum'][href*='s=view']`,YI=`rdw-forum-badge`,XI=`rdw-forum-row-marked`,ZI=`rdw-forum-read-all`,QI=`new`,$I=`updated`,eL=`Mark all as read`,tL=`All`,nL=`New for me`,rL=`rdw-forum-only-new`,iL=`rdw-forum-toolbar`,aL=`rdw-forum-pin`,oL=`rdw-forum-row-sticky`,sL=`rdw-forum-no-value`,cL=`data-rdw-unit`,lL=`rdw-forum-filter`,uL=`div#search > form > input[name="search"]`,dL=`rdw-forum-search`,fL=`rdw-forum-search-clear`,pL=`Clear search`,mL=`Search the forum`,hL=`sticky`,gL=`Sticky`,_L=`Locked`,vL=`N/A`,yL=`reply`,bL=`replies`,xL=3,SL=4,CL=`id`,wL=/\s+/g,TL=`tr[id^="artist-"]`,EL=`a[href*="page=artist"][href*="s=show"]`,DL=`tr`,OL=/^[a-z]+/,kL=`tags`,AL=`rdw-row-actions`,jL=`rdw-save-tag`,ML=`rdw-artist-name-cell`,NL=`Save as collection`,PL=`Saved`,FL=`RuleDesk`,IL=[[`tag-type-artist`,ta],[`tag-type-character`,na],[`tag-type-copyright`,ra]],LL=new Map([[`artist`,ta],[`character`,na],[`copyright`,ra]]),RL=`
.${YI} {
  display: inline-block;
  margin-left: 6px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--rdw-accent);
  color: var(--rdw-surface);
  font: 700 10.5px/16px var(--rdw-font);
  letter-spacing: 0.02em;
  vertical-align: middle;
}
tr.${XI} span.forum-topic a {
  font-weight: 700;
}
.${ZI},
.${lL},
.${jL} {
  min-height: 24px;
  padding: 0 8px;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-surface);
  color: var(--rdw-text);
  font: 12px var(--rdw-font);
  cursor: pointer;
}
/* "All" and "New for me" are one choice of two: joined, the chosen one lighter
   and heavier, as the switches of the script are. */
.${lL} {
  background: var(--rdw-seg-track, transparent);
  color: var(--rdw-seg-text, var(--rdw-muted));
}
.${lL}:first-of-type {
  border-radius: var(--rdw-radius-m) 0 0 var(--rdw-radius-m);
}
.${lL} + .${lL} {
  margin-left: -1px;
  border-radius: 0 var(--rdw-radius-m) var(--rdw-radius-m) 0;
}
.${lL}[aria-pressed="true"] {
  background: var(--rdw-seg-on, var(--rdw-surface));
  color: var(--rdw-seg-on-text, var(--rdw-text));
  font-weight: 600;
}
.${ZI} {
  margin-left: auto;
}
/* Artists: Follow stands at the right edge of the name's cell, one under
   another. Put straight after the name, the buttons made a staircase. */
.${ML} > button {
  float: right;
  margin-left: 12px;
}
/* Tags: two buttons to a row is forty on a page, heavier than the table
   itself. They show for the row under the pointer or the keyboard; a state
   that is already set (Following, Saved) stays in view. */
tr:not(:hover):not(:focus-within) > td.${AL} > button:not(:disabled):not([aria-pressed="true"]) {
  opacity: 0;
}
.${jL}:disabled {
  color: var(--rdw-muted);
  cursor: default;
}
.${AL} {
  white-space: nowrap;
}
.${AL} > * + * {
  margin-left: 6px;
}
`.trim();function zL(){if(document.getElementById(UI)!==null)return;let e=document.createElement(`style`);e.id=UI,e.textContent=RL,document.head.append(e);}function BL(e){return (e.textContent??``).replace(wL,` `).trim()}function VL(e){let t=e.querySelector(JI)?.getAttribute(`href`)??null;if(t===null||t.length===0)return null;try{return new URL(t,window.location.href).searchParams.get(CL)??t}catch{return t}}function HL(e){return typeof e==`object`&&!!e&&!Array.isArray(e)&&Object.values(e).every(e=>typeof e==`string`)}function UL(){let e=Ic$1(KI);return HL(e)?e:null}function WL(e,t){let n=new Map(Object.entries(e));for(let[e,r]of t)n.delete(e),n.set(e,r);let r=[...n].slice(Math.max(0,n.size-600));return Object.fromEntries(r)}function GL(e,t,n){let r=e[t];return r===void 0?QI:r===n?null:$I}function KL(e){e.classList.remove(XI),e.querySelector(`.${YI}`)?.remove();}function qL(e){let t=e.querySelector(`span.forum-topic`)?.firstChild??null;return t instanceof Text&&t.data.trim().toLowerCase().startsWith(hL)}function JL(e){return Number(e.trim())===1?yL:bL}function YL(e){let t=e.querySelector(`span.forum-topic`),n=t?.firstChild??null;if(t!==null&&n instanceof Text&&qL(e)){let t=document.createElement(`span`);t.className=aL,t.setAttribute(`role`,`img`),t.setAttribute(`aria-label`,gL),t.title=gL,n.replaceWith(t),e.classList.add(oL);}let r=e.querySelector(`span.locked-topic`);r!==null&&(r.textContent=_L);let i=e.querySelectorAll(`:scope > td`),a=i[xL];a!==void 0&&(a.textContent??``).trim()===vL&&a.classList.add(sL);let o=i[SL];o!==void 0&&o.setAttribute(cL,JL(o.textContent??``));}function XL(e,t){let n=document.createElement(`button`);return n.type=`button`,n.className=t,n.textContent=e,n}function ZL(e){let t=e.querySelector(uL),n=t?.parentElement??null;if(!(t instanceof HTMLInputElement)||n===null||n.querySelector(`.rdw-forum-search-clear`)!==null)return;n.classList.add(dL),t.placeholder.length===0&&(t.placeholder=mL);let r=document.createElement(`button`);r.type=`button`,r.className=fL,r.setAttribute(`aria-label`,pL),r.title=pL;let i=()=>{r.hidden=t.value.length===0;};r.addEventListener(`click`,()=>{t.value=``,i(),t.focus();}),t.addEventListener(`input`,i),t.after(r),i();}function QL(e){let t=xA();t&&ZL(e);let n=e.querySelector(`table.highlightable`),r=[...e.querySelectorAll(WI)],i=[];for(let e of r){let t=VL(e);t!==null&&i.push({row:e,key:t,signature:BL(e)});}if(i.length===0||n===null)return;if(t)for(let e of r)YL(e);n.addEventListener(`click`,e=>{let t=e.target;if(!(t instanceof Element)||t.closest(`a, button`)!==null)return;let n=t.closest(`tr`)?.querySelector(JI);n instanceof HTMLAnchorElement&&n.click();});let a=document.createElement(`div`);a.className=iL,n.before(a);let o=UL();if(o===null){Lc$1(KI,WL({},i.map(e=>[e.key,e.signature])));return}let s=e=>{Lc$1(KI,WL(UL()??{},e));},c=0;for(let e of i){let t=GL(o,e.key,e.signature);if(t===null)continue;c+=1,e.row.classList.add(XI);let n=document.createElement(`span`);n.className=YI,n.textContent=t;let r=e.row.querySelector(JI);(r?.parentElement??e.row.lastElementChild)?.append(n),r?.addEventListener(`click`,()=>{s([[e.key,e.signature]]);});}if(c===0)return;let l=XL(tL,lL),u=XL(nL,lL),d=t=>{e.classList.toggle(rL,t),l.setAttribute(`aria-pressed`,t?`false`:`true`),u.setAttribute(`aria-pressed`,t?`true`:`false`);};l.addEventListener(`click`,()=>{d(false);}),u.addEventListener(`click`,()=>{d(true);}),d(false);let f=XL(eL,ZI);f.addEventListener(`click`,()=>{s(i.map(e=>[e.key,e.signature]));for(let e of i)KL(e.row);d(false),a.replaceChildren();}),a.append(l,u,f);}function $L(e){for(let t of e.querySelectorAll(GI)){let e=t.getAttribute(`href`);if(e!==null)try{let t=new URL(e,window.location.href).searchParams.get(le$1),n=t===null?null:R$3(t);if(n!==null)return n}catch{}}return null}function eR(e){for(let[t,n]of IL)if(e.classList.contains(t)||e.querySelector(`.${t}`)!==null)return n;for(let t of e.querySelectorAll(`td`)){let e=OL.exec((t.textContent??``).trim().toLowerCase())?.[0]??``,n=LL.get(e);if(n!==void 0&&t.querySelector(GI)===null)return n}return null}function tR(e){let t=e.querySelector(EL)?.textContent??``;return t.trim().length===0?null:R$3(t.trim())}function nR(e){$h();for(let t of e){let e=tR(t),n=t.querySelector(EL)?.closest(`td`);e!==null&&n instanceof HTMLElement&&(n.classList.add(ML),VI(n,e,ta));}}function rR(e){return G$4().collections.some(t=>t.kind===`search`&&(t.query??``).trim()===e||t.name.trim().toLowerCase()===e)}function iR(e){let t=document.createElement(`button`);t.type=`button`,t.className=jL;let n=rR(e);return t.textContent=n?PL:NL,t.disabled=n,t.title=`${NL}: ${e}`,t.addEventListener(`click`,()=>{rR(e)||vc$1(e,e),t.textContent=PL,t.disabled=true;}),t}function aR(e){$h();let t=[...e.querySelectorAll(DL)].filter(e=>e.querySelector(`th`)===null),n=0;for(let e of t){let t=$L(e);if(t===null||e.querySelector(`.rdw-row-actions`)!==null)continue;let r=document.createElement(`td`);r.className=AL;let i=eR(e);i!==null&&VI(r,t,i),r.append(iR(t)),e.append(r),n+=1;}let r=e.querySelector(`tr.tableheader`)??e.querySelector(`th`)?.closest(`tr`)??null;if(n>0&&r!==null&&r.querySelector(`.rdw-row-actions`)===null){let e=document.createElement(`th`);e.className=AL,e.textContent=FL,r.append(e);}}function oR(e){return new URLSearchParams(e).get(`page`)===kL}function sR(e=window.location.search){let t=document.querySelector(qI);if(t!==null){zL(),QL(t);return}let n=[...document.querySelectorAll(TL)];if(n.length>0){zL(),nR(n);return}let r=document.querySelector(`table.highlightable`);r!==null&&oR(e)&&(zL(),aR(r));}var cR=`body > div#notice`,lR=`rdw-notice-gone`,uR=2500;function dR(){let e=document.querySelector(cR);return e instanceof HTMLElement?e:null}function fR(e){let t,n=()=>{window.clearTimeout(t),e.classList.add(lR);},r=()=>{window.clearTimeout(t),e.classList.remove(lR),e.textContent.trim()!==``&&(t=window.setTimeout(n,uR));};e.addEventListener(`click`,n),new MutationObserver(r).observe(e,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:[`style`]}),r();}function pR(){if(!xA())return;let e=dR();if(e!==null){fR(e);return}let t=new MutationObserver(()=>{let e=dR();e!==null&&(t.disconnect(),fR(e));});t.observe(document.body,{childList:true});}var mR=`upload-tag-sets`,hR=exports("v",2e3),gR=/\s+/;function _R(e){if(typeof e!=`object`||!e||!(`name`in e)||!(`tags`in e))return null;let{name:t,tags:n}=e;return typeof t!=`string`||typeof n!=`string`?null:{name:t.slice(0,40),tags:n.slice(0,hR)}}function vR(){let e=Ic$1(mR);if(!Array.isArray(e))return [];let t=[];for(let n of e){let e=_R(n);e!==null&&t.push(e);}return t}function yR(e){Lc$1(mR,e.map(e=>({name:e.name.slice(0,40),tags:e.tags.slice(0,hR)})));}function bR(){return vR().filter(e=>e.name.trim().length>0&&e.tags.trim().length>0)}function xR(e,t){let n=new Set(e.toLowerCase().split(gR).filter(e=>e.length>0)),r=[];for(let e of t.split(gR)){let t=e.toLowerCase();e.length>0&&!n.has(t)&&(n.add(t),r.push(e));}if(r.length===0)return e;let i=e.trimEnd();return `${i.length>0?`${i} `:``}${r.join(` `)} `}var SR=`div#upload-form`,CR=`fileUpload`,wR=`tags`,TR=`rdw-upload-drag`,ER=`rdw-upload-has-file`,DR=`rdw-upload-file-name`,OR=`rdw-upload-preview`,kR=`rdw-upload-hint`,AR=`rdw-upload-remove`,jR=`rdw-upload-preview-box`,MR=`rdw-upload-tag-count`,NR=`rdw-upload-tag-count--short`,PR=`rdw-upload-guide-toggle`,FR=`rdw-upload-guide-folded`,IR=`upload-guide-folded`,LR=`rdw-upload-sets`,RR=`rdw-upload-set`,zR=`rdw-upload-sets-label`,BR=`rdw-upload-sets-edit`,VR=exports("b",`upload`),HR=`Tag sets:`,UR=`Edit sets`,WR=`Add tag sets`,GR=`Adds: `,KR=`rdw-upload-note`,qR=`Drop a file here or click to choose one`,JR=`Remove file`,YR=`Show the upload guidelines`,XR=`Hide the guidelines`,ZR=1024,QR=[`B`,`KB`,`MB`,`GB`],$R=`image/`,ez=/\s+/;function tz(e){let t=Math.max(0,e),n=0;for(;t>=ZR&&n<QR.length-1;)t/=ZR,n+=1;return `${n===0||t>=100?String(Math.round(t)):t.toFixed(1)} ${QR[n]??`B`}`}function nz(e){return new Set(e.toLowerCase().split(ez).filter(e=>e.length>0)).size}function rz(e){let t=new Set,n=[];for(let r of e.split(ez)){let e=r.toLowerCase();r.length>0&&!t.has(e)&&(t.add(e),n.push(r));}let r=n.join(` `);return n.length>0&&/\s$/.test(e)?`${r} `:r}function iz(e){return e>=5?``:`${String(e)} of 5 tags`}function az(e){let t=e.closest(`td`);if(t===null||t.querySelector(`.rdw-upload-hint`)!==null)return;let n=document.createElement(`span`);n.className=kR,n.textContent=qR;let r=document.createElement(`span`);r.className=DR,r.setAttribute(`role`,`status`);let i=document.createElement(`img`);i.className=OR,i.alt=``,i.hidden=true;let a=document.createElement(`button`);a.type=`button`,a.className=AR,a.setAttribute(`aria-label`,JR),a.title=JR,a.hidden=true,a.addEventListener(`click`,()=>{e.value=``,e.dispatchEvent(new Event(`change`,{bubbles:true}));});let o=document.createElement(`span`);o.className=jR,o.append(i,a),t.append(o,n,r);let s=null,c=()=>{let n=e.files?.[0];s!==null&&(URL.revokeObjectURL(s),s=null),t.classList.toggle(ER,n!==void 0),a.hidden=n===void 0,r.textContent=n===void 0?``:`${n.name} · ${tz(n.size)}`,n!==void 0&&n.type.startsWith($R)?(s=URL.createObjectURL(n),i.src=s,i.hidden=false):(i.removeAttribute(`src`),i.hidden=true);};e.addEventListener(`change`,c);for(let n of [`dragenter`,`dragover`])e.addEventListener(n,()=>{t.classList.add(TR);});for(let n of [`dragleave`,`drop`])e.addEventListener(n,()=>{t.classList.remove(TR);});c();}function oz(e){let t=e.closest(`td`);if(t===null||t.querySelector(`.rdw-upload-tag-count`)!==null)return;let n=document.createElement(`div`);n.className=MR,n.setAttribute(`role`,`status`),(e.parentElement?.parentElement===t?e.parentElement:e).after(n);let r=false,i=()=>{let t=nz(e.value);n.textContent=iz(t),n.hidden=t>=5,n.classList.toggle(NR,r&&t<5);},a=()=>{r=true,i();};e.addEventListener(`blur`,a),t.closest(`form`)?.addEventListener(`submit`,a,true);let o=()=>{let t=rz(e.value);t!==e.value&&(e.value=t);};for(let t of [`change`,`blur`,`awesomplete-selectcomplete`])e.addEventListener(t,o);t.closest(`form`)?.addEventListener(`submit`,o,true);for(let t of [`input`,`change`,`keyup`,`blur`,`awesomplete-selectcomplete`])e.addEventListener(t,i);t.closest(`form`)?.addEventListener(`click`,()=>{window.setTimeout(i,0);}),i();}function sz(e){let t=e.closest(`td`);if(t===null||t.querySelector(`.rdw-upload-sets`)!==null)return;let n=document.createElement(`div`);n.className=LR;let r=bR();if(r.length>0){let e=document.createElement(`span`);e.className=zR,e.textContent=HR,n.append(e);}for(let t of r){let r=document.createElement(`button`);r.type=`button`,r.className=RR,r.textContent=t.name.trim(),r.title=`${GR}${t.tags.trim()}`,r.addEventListener(`click`,()=>{let n=xR(e.value,t.tags);if(n!==e.value){e.value=n;for(let t of [`input`,`change`])e.dispatchEvent(new Event(t,{bubbles:true}));}}),n.append(r);}let i=document.createElement(`button`);i.type=`button`,i.className=BR,i.textContent=r.length>0?UR:WR,i.addEventListener(`click`,()=>{_(VR);}),n.append(i);let a=t.querySelector(`.${MR}`),o=e.parentElement?.parentElement===t?e.parentElement:e;(a??o).after(n);}function cz(e){let t=e.querySelector(`td > div:has(> h3)`),n=t?.parentElement??null;if(t==null||n===null||n.querySelector(`.rdw-upload-guide-toggle`)!==null)return;let r=document.createElement(`button`);r.type=`button`,r.className=PR;let i=e=>{n.classList.toggle(FR,e),r.textContent=e?YR:XR,r.setAttribute(`aria-expanded`,e?`false`:`true`);};r.addEventListener(`click`,()=>{let e=!n.classList.contains(FR);Lc$1(IR,e),i(e);}),n.prepend(r),i(Ic$1(IR)===true);}function lz(e){let t=e.querySelector(`:scope > form`);if(t===null)return;let n=t.querySelector(`:scope > b`),r=t.querySelector(`tr:has(input[type="submit"]) > td`);if(n===null||r===null||t.querySelector(`.rdw-upload-note`)!==null)return;let i=document.createElement(`div`);i.className=KR;let a=n;for(;a!==null&&!(a instanceof HTMLScriptElement);){let e=a.nextSibling;a instanceof HTMLBRElement||i.append(a),a=e;}r.append(i);}function uz(){let e=document.querySelector(SR),t=document.getElementById(CR),n=document.getElementById(wR);e!==null&&t instanceof HTMLInputElement&&e.contains(t)&&(xA()&&(az(t),cz(e),lz(e)),n instanceof HTMLTextAreaElement&&e.contains(n)&&(oz(n),sz(n)));}var dz=`#paginator a[onclick]`,fz=`next`,pz=`lastpage`,mz=/[?&]pid=(\d+)/,hz=`none`;function gz(e){return e<=0?null:Math.floor((e-1)/50)*50}function _z(e){let t=mz.exec(e.getAttribute(`onclick`)??``);return t?.[1]===void 0?null:Number(t[1])}function vz(e,t,n){let r=0;for(let i of e.querySelectorAll(dz)){if(!(i instanceof HTMLElement))continue;let e=_z(i),a=i.getAttribute(`name`),o=n>=t;a===pz&&!o?e!==null&&e>t&&i.setAttribute(`onclick`,(i.getAttribute(`onclick`)??``).replace(mz,n=>n.replace(String(e),String(t)))):(e!==null&&e>t||(a===fz||a===pz)&&o)&&(i.style.display=hz,r+=1);}return r}function yz(){let e=Os$1();return e?.finishedAt!==void 0&&e.running!==true}function bz(e=window.location.search){if(!yz())return;let t=gz(Cs$1().size);if(t===null)return;let n=new URLSearchParams(e).get(`pid`),r=n!==null&&/^\d+$/.test(n)?Number(n):0;vz(document,t,r);}var xz=1e4,Sz=3e3,Cz,wz=false;function Tz(e){return new Promise(t=>{setTimeout(t,e);})}function Ez(){return Cz===void 0&&(Cz=Pn()),Cz}function Dz(e,t){if(e?.running!==true)return  false;let n=e.lock;return n===void 0||t-n.beatAt>xz}function Oz(e,t,n){if(e?.running!==true)return  false;let r=e.lock;return r===void 0||n-r.beatAt>1e4?false:r.tabId!==t}async function kz(){let e=Ez(),t=Os$1();if(Oz(t,e,Date.now())||!Dz(t,Date.now()))return  false;await Tz(Sz);let n=Os$1();if(Oz(n,e,Date.now())||!Dz(n,Date.now()))return  false;let r=Wn(n)??q$2;return await Xn({tabId:e,signal:new AbortController().signal,onProgress:()=>{},mode:r}),true}function Az(){wz||(wz=true,kz().catch(e=>{m$2.error(`favorites sync resume failed`,e);}));}var jz=`ruledesk-web.background`,Mz=1,Nz=`background`,Pz=`dataUrl`;function Fz(){return GM_getValue}function Iz(){return GM_setValue}function Lz(e){return typeof TextEncoder<`u`?new TextEncoder().encode(e).length:e.length}function Rz(){try{let e=Fz()(r,void 0);return typeof e!=`string`||e.length===0?null:e}catch(e){return m$2.error(`background-store: GM read failed`,e),null}}function zz(){try{Iz()(r,``);}catch(e){m$2.error(`background-store: GM clear failed`,e);}}function Bz(){return new Promise((e,t)=>{let n=indexedDB.open(jz,Mz);n.onerror=()=>{t(n.error??Error(`background-store: indexedDB open failed`));},n.onsuccess=()=>{e(n.result);},n.onupgradeneeded=()=>{let e=n.result;e.objectStoreNames.contains(Nz)||e.createObjectStore(Nz);};})}function Vz(e){return new Promise((t,n)=>{let r=e.transaction(Nz,`readonly`).objectStore(Nz).get(Pz);r.onerror=()=>{n(r.error??Error(`background-store: get failed`));},r.onsuccess=()=>{let e=r.result;typeof e==`string`&&e.length>0?t(e):t(null);};})}function Hz(e,t){return new Promise((n,r)=>{let i=e.transaction(Nz,`readwrite`),a=i.objectStore(Nz).put(t,Pz);a.onerror=()=>{r(a.error??Error(`background-store: put failed`));},i.oncomplete=()=>{n();},i.onerror=()=>{r(i.error??Error(`background-store: put transaction failed`));};})}function Uz(e){return new Promise((t,n)=>{let r=e.transaction(Nz,`readwrite`),i=r.objectStore(Nz).delete(Pz);i.onerror=()=>{n(i.error??Error(`background-store: delete failed`));},r.oncomplete=()=>{t();},r.onerror=()=>{n(r.error??Error(`background-store: delete transaction failed`));};})}async function Wz(e){let t=await Vz(e);if(t!==null)return zz(),t;let n=Rz();return n===null?null:(await Hz(e,n),zz(),n)}async function Gz(){try{let e=await Bz();try{return await Wz(e)}finally{e.close();}}catch(e){return m$2.error(`background-store: load failed`,e),null}}function Kz(e){return Lz(e)>i}async function qz(e){if(Kz(e))throw Error(a);let t=await Bz();try{await Hz(t,e),zz();}finally{t.close();}}async function Jz(){try{let e=await Bz();try{await Uz(e);}finally{e.close();}}catch(e){m$2.error(`background-store: clear idb failed`,e);}zz();}var Yz=`click`,Xz=`auxclick`,Zz=`hashchange`,Qz=`change`,$z=`ruledesk-web.ai-reload`;function eB(e){let t=Rt$2(e);return t===null?null:t===`following`?P:t===`collections`||kt$3(t)?F:null}function tB(){return eB(window.location.hash)??et()}function nB(){let e=tB();e!==null&&X$1(e);}function rB(){try{return window.sessionStorage.getItem($z)}catch{return null}}function iB(e){try{e===null?window.sessionStorage.removeItem($z):window.sessionStorage.setItem($z,e);}catch{}}function aB(e){let t=e.target;if(!(t instanceof Element))return;let n=t.closest(`a[href]`);if(!(n instanceof HTMLAnchorElement))return;let r;try{r=new URL(n.href,window.location.href);}catch{return}if(r.origin!==window.location.origin)return;let i=Y$1(r);i!==null&&X$1(i);}function oB(e){let t=e.target;if(!e.isTrusted||!(t instanceof HTMLInputElement)||!t.matches(rn$2.filterAiCheckbox))return;let n=et();n!==null&&K$1(n,t.checked);}var sB=false;function cB(){qe(),sB||(sB=true,document.addEventListener(Yz,aB,true),document.addEventListener(Xz,aB,true),window.addEventListener(Zz,nB),document.addEventListener(Qz,oB,true));let e=eB(window.location.hash);if(e!==null)return X$1(e),false;let t=et();if(t===null)return  false;let n=window.location.href;return !X$1(t)||rB()===n?(iB(null),false):(iB(n),window.location.reload(),true)}async function lB(){let e=Hc$1(),t=await Gz();Ei$1({appearance:e,siteSkinCss:fr$2(),...t!==null&&t.length>0?{backgroundDataUrl:t}:{}});}function $(e,t){try{t();}catch(t){m$2.error(`start: ${e} failed`,t);}}async function uB(e,t){try{await t();}catch(t){m$2.error(`start: ${e} failed`,t);}}async function dB(){if(await uB(`appearance`,lB),await Ka$1(),cB())return;let t=P$3(window.location.search),n=window.location.search;$(`site notice`,pR),t===`list`?($(`gif marks`,()=>{qt$2(rn$2.thumb);}),$(`video marks`,()=>{Ft$2(rn$2.thumb);}),$(`cards`,ig),await Ka$1(),$(`artist sidebar`,HI),await Ka$1()):t===`post`?($(`artist sidebar`,HI),await Ka$1()):t===`favorites`?($(`favorites page`,Yp),$(`favorite video marks`,It$2),$(`gif marks`,()=>{qt$2(rn$2.thumb);}),$(`favorites pager`,bz),await Ka$1()):($(`comments page`,vP),$(`list pages`,sR),$(`upload page`,uz),await Ka$1()),await uB(`features`,()=>uF(t,n)),await Ka$1(),await uB(`own pages`,jI),await Ka$1(),$(`favorites sync resume`,Az),$(`stats point`,ar);}var appM32Uzb9f=/*#__PURE__*/Object.freeze({__proto__:null,A:tm,C:QP,D:Hg,E:nF,F:Ca,I:wa,M:Ws,N:Hs,O:kg,P:Os,S:iF,T:$P,_:MF,a:VR,b:sF,c:yR,d:OF,f:AF,g:jF,h:DF,i:qz,j:Ic,k:rg,l:kI,m:TF,n:Jz,o:hR,p:EF,r:Gz,s:vR,startApp:dB,t:Kz,u:kF,v:NF,w:Q,x:aF,y:cF});exports("aW",appM32Uzb9f);})}}));
System.register("./settings-page-DQbcdbAV-B2YUYsJ1.js", ['./app-M32Uzb9f-DIm5OcM2.js','./___monkey.entry.js','./format-date-CpY7IdAY-BzMD4ndT.js'],(function(exports){'use strict';var z,V,B,Se,Ie,Q$1,K$1,On$1,fi$1,Ge,Sr$1,A,$P,xe,VR,wr$1,lt,wn$1,J$1,g,rg,iF,QP,nF,Os,H,Gz,G$1,Er$1,oi$1,Or$1,qt,Sn$1,sF,cF,aF,Wn$1,Ge$1,Nt,hR,En$1,mt,ft,O,Ws,Re,Ca$1,ot,Nt$1,Hs,dr$1,or$1,wr$2,Jz,qz,Xn$1,Ye,We,k,we,Re$1,Le,yR,wa$1,sr$1,It,Ft,Ie$1,Kz,Wn$2,q$1,K$2,dn$1,Ue,vR,W$1,we$2,dt,Fe,vt,Vc,Bc,Mc,_t,zc,Rc,Ze,Qe,Ja$1,Ya$1,mo$1,xt,Ac,Za$1,bt,Oc,Xe,qa$1,Hc,Ei$1,fr$1,te,u,d,f,ee,ca$1,la$1,mi$1,Tt,ht,Nc,gt,Fc,pi$1,sa$1,Ti$1,m,Os$1,G$2,a,Ja$2,Hs$1,Ss,Uc,Cs,n,L,ms,A$1,F,N,T,Ia$1,qi$1,we$1,ut,Va$1,q$2,bs,t,As,oa$1,kc,Dc,jc,Pc,xi$1,n$1;return{setters:[function(module){z=module.z;V=module.V;B=module.B;Se=module.S;Ie=module.I;Q$1=module.Q;K$1=module.K;On$1=module.O;fi$1=module.f;Ge=module.G;Sr$1=module.a;A=module.A;$P=module.$;xe=module.x;VR=module.b;wr$1=module.w;lt=module.l;wn$1=module.c;J$1=module.J;g=module.g;rg=module.r;iF=module.i;QP=module.d;nF=module.n;Os=module.e;H=module.H;Gz=module.h;G$1=module.j;Er$1=module.E;oi$1=module.o;Or$1=module.k;qt=module.q;Sn$1=module.m;sF=module.s;cF=module.p;aF=module.t;Wn$1=module.W;Ge$1=module.u;Nt=module.N;hR=module.v;En$1=module.y;mt=module.C;ft=module.D;O=module.F;Ws=module.L;Re=module.R;Ca$1=module.M;ot=module.P;Nt$1=module.T;Hs=module.U;dr$1=module.X;or$1=module.Y;wr$2=module.Z;Jz=module._;qz=module.a0;Xn$1=module.a1;Ye=module.a2;We=module.a3;k=module.a4;we=module.a5;Re$1=module.a6;Le=module.a7;yR=module.a8;wa$1=module.a9;sr$1=module.aa;It=module.ab;Ft=module.ac;Ie$1=module.ad;Kz=module.ae;Wn$2=module.af;q$1=module.ag;K$2=module.ah;dn$1=module.ai;Ue=module.aj;vR=module.ak;W$1=module.al;we$2=module.am;},function(module){dt=module.bY;Fe=module.bi;vt=module.cy;Vc=module.cz;Bc=module.bb;Mc=module.cA;_t=module.cB;zc=module.cC;Rc=module.ab;Ze=module.cD;Qe=module.cE;Ja$1=module.cF;Ya$1=module.cG;mo$1=module.cH;xt=module.cI;Ac=module.cJ;Za$1=module.aR;bt=module.cK;Oc=module.cL;Xe=module.cM;qa$1=module.cN;Hc=module.aA;Ei$1=module.aB;fr$1=module.ci;te=module.cO;u=module.u;d=module.d;f=module.cP;ee=module.cQ;ca$1=module.cR;la$1=module.cS;mi$1=module.cT;Tt=module.cU;ht=module.cV;Nc=module.cW;gt=module.cX;Fc=module.cY;pi$1=module.cZ;sa$1=module.c_;Ti$1=module.c$;m=module.m;Os$1=module.g;G$2=module.G;a=module.cd;Ja$2=module.d0;Hs$1=module.d1;Ss=module.d2;Uc=module.d3;Cs=module.C;n=module.d4;L=module.d5;ms=module.d6;A$1=module.A;F=module.d7;N=module.N;T=module.T;Ia$1=module.d8;qi$1=module.d9;we$1=module.da;ut=module.U;Va$1=module.db;q$2=module.bC;bs=module.dc;t=module.dd;As=module.de;oa$1=module.as;kc=module._;Dc=module.aC;jc=module.j;Pc=module.cb;xi$1=module.df;},function(module){n$1=module.n;}],execute:(function(){exports("SettingsPage",$o);var Qt=oa$1.id,$t=[{value:u,label:`Site default`},{value:d,label:`Site dark`},{value:f,label:`Light`},{value:ee,label:`Dark`},{value:te,label:`Custom`}],en=[{value:`default`,label:`Default`},{value:`compact`,label:`Compact`},{value:`large`,label:`Large`}],tn=[{value:ca$1,label:`Light`},{value:la$1,label:`Dark`}],nn=`Appearance`,rn=`Site theme`,an=`Light, Dark and Custom are drawn by RuleDesk. Site default and Site dark keep the site's own look.`,on=`In the site's own themes RuleDesk does not restyle the site: its fields, tables and buttons stay as the site draws them, and what RuleDesk adds can look out of place beside them. Light, Dark or Custom is recommended.`,sn=`Base`,cn=`Background image`,ln=`From a link or a file`,un=`https://… or data URL`,dn=`Dim`,fn=`Choose…`,pn=`Remove`,mn=`Reset theme`,hn=`Reset theme?`,gn=`The Custom theme goes back to the Light base, and its background image is removed. This cannot be undone.`,_n=`Reset`,vn=`danger`,yn=`rdw-appearance__bg-thumb`,bn=56,xn=36,Sn=160,Cn=`Grid`,wn=`For this screen use at least `,Tn=`Image size: `,En=`This image is smaller than your screen; it may look soft when stretched.`,Dn=`image/*`,On=`
${G$1}
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
.rdw-appearance__row + .rdw-appearance__row {
  border-top: 1px solid var(--rdw-border);
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}
.rdw-appearance__note {
  margin: 0 8px 6px;
  padding: 8px 10px;
  border: 1px solid var(--rdw-border);
  border-left: 3px solid var(--rdw-accent);
  border-radius: var(--rdw-radius-m);
  color: var(--rdw-text);
  font-size: 12px;
  line-height: 1.45;
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
  width: ${String(Sn)}px;
  flex: none;
}
.rdw-appearance__base {
  width: 140px;
  flex: none;
}
/* The name of a wide setting stands in one line over its field: beside the
   field it was pressed into a narrow column and broke into three lines. */
.rdw-appearance__row--stack {
  flex-direction: column;
  align-items: stretch;
}
.rdw-appearance__row-text--line {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
}
.rdw-appearance__bg-field {
  display: flex;
  align-items: center;
  gap: 8px;
}
.rdw-appearance__bg-field .rdw-field {
  flex: 1;
}
.${yn} {
  flex: none;
  box-sizing: border-box;
  width: ${String(bn)}px;
  height: ${String(xn)}px;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-s);
  background: var(--rdw-surface-2);
  object-fit: cover;
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
`;function kn(){let e=Pc(Qt),t=oa$1.choice?.options??[];return e!==void 0&&t.some(t=>t.value===e)?e:oa$1.choice?.defaultValue??`default`}function U(e){return e.custom??pi$1()}function An(e,t){let n=Uc(e);Ei$1({appearance:n,siteSkinCss:fr$1(),...t!=null&&t.length>0?{backgroundDataUrl:t}:{}});}function jn(){let e=xi$1();return `${wn}${String(e.width)}x${String(e.height)}`}function Mn(e){let t=H(),n=V(null),[r,i]=z(()=>Hc()),[a,o]=z(()=>kn()),[s,c]=z(()=>Hc().custom?.backgroundImage??``),[l,u]=z(null),[d,p]=z(``),[h,_]=z(null),[v]=z(()=>jn()),[y,b]=z(false);B(()=>{let e=false;return Gz().then(t=>{if(e||t===null)return;u(t);let n=Hc();n.theme===`custom`&&Ei$1({appearance:n,siteSkinCss:fr$1(),backgroundDataUrl:t});}),()=>{e=true;}},[]);let S=U(r),ee=r.theme===te,te$1=r.theme===`site`||r.theme===`site-dark`,ne=(l?.length??0)>0||(S.backgroundImage?.length??0)>0||s.length>0,re=l!==null&&l.length>0?l:S.backgroundImage??``;function C(e,t){i(e),An(e,t),p(``);}function w(e){let t=sa$1.safeParse(e);if(!t.success)return;let n=t.data;n===`custom`?C({theme:n,custom:U(r)},l):C({theme:n});}function ie(e){if(e!==`light`&&e!==`dark`)return;let t=e,n=U(Hc()),r={base:t,backgroundDim:mi$1(n.backgroundDim??0),...n.backgroundImage===void 0?{}:{backgroundImage:n.backgroundImage}};C({theme:te,custom:r},l);}function ae(e){let t=e.trim();c(t),_(null);let n=U(Hc()),r={base:n.base,backgroundDim:mi$1(n.backgroundDim??0),...t.length>0?{backgroundImage:t}:{}};t.length>0&&(u(null),Jz()),C({theme:te,custom:r});}function oe(e){let t=mi$1(e),n=U(Hc()),r={base:n.base,backgroundDim:t,...n.backgroundImage===void 0?{}:{backgroundImage:n.backgroundImage}};C({theme:te,custom:r},l);}async function se(e){if(e!==void 0)try{let t=await Ti$1(e);await qz(t.dataUrl),u(t.dataUrl),c(``),_({width:t.sourceWidth,height:t.sourceHeight,belowScreen:t.belowScreen});let n=U(Hc()),r={base:n.base,backgroundDim:mi$1(n.backgroundDim??0)};C({theme:te,custom:r},t.dataUrl);}catch(e){let t=e instanceof Error?e.message:`Could not read image file`;p(t);}}function ce(){Jz(),u(null),c(``),_(null);let e=U(Hc());C({theme:te,custom:{base:e.base,backgroundDim:0}});}function le(){Jz(),u(null),c(``),_(null);let e=pi$1();C({theme:te,custom:e});}function ue(e){o(e),Fc(Qt,e),cF(Qt,e);}let j=[`rdw-appearance`,e.className].filter(e=>e!==void 0&&e.length>0).join(` `);return K$1(A,{children:[K$1(`style`,{children:On}),K$1(`section`,{className:j,"aria-label":nn,children:[e.includeHeading===false?null:K$1(Er$1,{children:nn}),K$1(`div`,{className:`rdw-appearance__row`,children:[K$1(`div`,{className:`rdw-appearance__row-text`,children:[K$1(`span`,{children:rn}),K$1(`small`,{children:an})]}),K$1(oi$1,{className:`rdw-appearance__select`,options:$t,value:r.theme,onChange:w})]}),te$1?K$1(`p`,{className:`rdw-appearance__note`,role:`note`,children:on}):null,ee?K$1(A,{children:[K$1(`div`,{className:`rdw-appearance__row`,children:[K$1(`div`,{className:`rdw-appearance__row-text`,children:K$1(`span`,{children:sn})}),K$1(Or$1,{className:`rdw-appearance__base`,options:tn,value:S.base,label:sn,onChange:ie})]}),K$1(`div`,{className:`rdw-appearance__row rdw-appearance__row--stack`,children:[K$1(`div`,{className:`rdw-appearance__row-text rdw-appearance__row-text--line`,children:[K$1(`span`,{children:cn}),K$1(`small`,{children:ln})]}),K$1(`div`,{className:`rdw-appearance__bg`,onFocusOut:e=>{let t=e.currentTarget,n=e.relatedTarget;n instanceof Node&&t.contains(n)||ae(s);},children:[K$1(`div`,{className:`rdw-appearance__bg-field`,children:[K$1(qt,{value:s,placeholder:un,"aria-label":cn,onChange:e=>{c(e);}}),re.length>0?K$1(`img`,{className:yn,src:re,alt:``}):null]}),K$1(`div`,{className:`rdw-appearance__bg-actions`,children:[K$1(J$1,{variant:`secondary`,size:`s`,onClick:()=>{n.current?.click();},children:fn}),ne?K$1(J$1,{variant:`ghost`,size:`s`,onClick:ce,children:pn}):null,K$1(`input`,{ref:n,id:t,className:`rdw-appearance__file`,type:`file`,accept:Dn,"aria-hidden":`true`,tabIndex:-1,onChange:e=>{let t=e.currentTarget.files?.[0];se(t),e.currentTarget.value=``;}})]}),K$1(`p`,{className:`rdw-appearance__hint`,children:v}),h===null?null:K$1(`p`,{className:`rdw-appearance__hint`,children:[Tn,String(h.width),`x`,String(h.height)]}),h?.belowScreen===true?K$1(`div`,{className:`rdw-appearance__warn`,role:`status`,children:En}):null,ne?K$1(`label`,{className:`rdw-appearance__dim`,children:[K$1(`span`,{children:dn}),K$1(`input`,{type:`range`,min:0,max:.8,step:.05,value:S.backgroundDim??0,"aria-label":dn,onInput:e=>{oe(Number(e.currentTarget.value));}}),K$1(`span`,{children:String(mi$1(S.backgroundDim??0))})]}):null,d.length>0?K$1(`div`,{className:`rdw-appearance__warn`,role:`status`,children:d}):null]})]}),K$1(`div`,{className:`rdw-appearance__footer`,children:K$1(J$1,{variant:`secondary`,size:`s`,onClick:()=>{b(true);},children:mn})}),K$1(Sn$1,{variant:`confirm`,open:y,title:hn,message:gn,confirmLabel:_n,cancelLabel:Fe.cancel,confirmTone:vn,onConfirm:()=>{b(false),le();},onClose:()=>{b(false);}})]}):null,K$1(`div`,{className:`rdw-appearance__row`,children:[K$1(`div`,{className:`rdw-appearance__row-text`,children:K$1(`span`,{children:Cn})}),K$1(oi$1,{className:`rdw-appearance__select`,options:en,value:a,onChange:ue})]})]})]})}var W=`rdw-blacklist`,Nn=`rdw-blacklist-chips`,Pn=`rdw-blacklist-add-row`,Fn=`rdw-blacklist-hint`,In=`Add a tag`,Ln=`Add`,Rn=`Stored in this browser's site cookie. The list in your account settings is not changed and may overwrite this one after you log in again.`,zn=`rdw-blacklist-add`,Bn=/[, ]+/,Vn=`
.${W} {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.${W} .${Nn} {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.${W} .${Pn} {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: flex-end;
}
.${W} .${Pn} .rdw-field,
.${W} .${Pn} .rdw-ac {
  flex: 1 1 12rem;
  margin: 0;
}
.${W} .${Fn} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 12px;
}
`.trim();function Hn(e){let t=[];for(let n of e.split(Bn)){let e=n.trim();e.length!==0&&t.push(e);}return t}function Un(e){return wa$1([...e]),Ca$1()}function Wn(e={}){let t=e.includeHeading!==false,[r,o]=z(()=>Ca$1()),[s,c]=z(``),[l,u]=z([]),d=V(O());Ws(r),B(()=>{let e=d.current;return ()=>{e.cancel();}},[]);let f=Re(()=>{let e=Hn(s);e.length!==0&&(o(Un([...Ca$1(),...e])),c(``),u([]),d.current.cancel());},[s]);return K$1(A,{children:[K$1(`style`,{children:Vn}),K$1(`section`,{className:`rdw-section ${W}`,children:[t?K$1(Er$1,{children:`Blacklist`}):null,K$1(`form`,{className:Pn,onSubmit:e=>{e.preventDefault(),f();},children:[K$1(ot,{id:zn,label:In,value:s,suggestions:l,onChange:e=>{c(e),d.current.query(e,u);},onSelect:()=>{d.current.cancel(),u([]);}}),K$1(J$1,{type:`submit`,variant:`primary`,children:Ln})]}),K$1(`ul`,{className:Nn,children:r.map(e=>K$1(`li`,{children:K$1(Nt$1,{label:e,variant:`dot`,kind:Hs(e),onRemove:()=>{let t=Ca$1().filter(t=>t!==e);o(Un(t));}})},e))}),K$1(`p`,{className:Fn,children:Rn})]})]})}var Gn=`ruledesk-web-backup`,Kn=`merge`,qn=`replace`,Jn=A$1({format:qi$1(Gn),version:qi$1(1),exportedAt:T(),storage:F,favs:N(Ia$1),background:N(T())}),Yn=`The background in this file is not a picture`;function Xn(){return GM_getValue}function Zn(){return GM_setValue}function Qn(e){let t=e.issues[0];if(t===void 0)return `${we$1}: (root): Invalid data`;let n=t.path.length===0?`(root)`:t.path.map(e=>String(e)).join(`.`);return `${we$1}: ${n}: ${t.message}`}async function $n(){let e=await Gz();if(e!==null&&e.length!==0)return e}async function er(e){e===void 0||e.length===0?await Jz():await qz(e);}function tr(){let e=Xn()(n,void 0);if(e==null)return L();let t=ms(e);return t===null?(m.error(`backup: invalid favs; exporting empty favs`,{key:n}),L()):t}function nr(e){Zn()(n,Ia$1.parse(e)),Ss();}async function rr(){let e=await $n(),t$1={format:Gn,version:1,exportedAt:new Date().toISOString(),storage:G$2(),favs:tr(),...e===void 0?{}:{background:e}};Zn()(t,t$1);}function ir(e){return e===void 0?void 0:e.filter(ut)}function ar(e){return {...e,settings:cr(e.settings),collections:e.collections.map(e=>{let t={...e},n=ir(e.cover);if(n!==void 0&&(t.cover=n),e.thumbs!==void 0){let n={};for(let[t,r]of Object.entries(e.thumbs))ut(r)&&(n[t]=r);t.thumbs=n;}return t}),artists:e.artists.map(e=>{let t=ir(e.cover);return t===void 0?e:{...e,cover:t}})}}var or=/^data:image\/(?:jpeg|png|webp|gif|avif);base64,/i;function sr(e){return or.test(e)}function cr(e){let t=e?.appearance?.custom,n=t?.backgroundImage;if(e===void 0||e.appearance===void 0||t===void 0||n===void 0||ut(n)||sr(n))return e;let{backgroundImage:r,...i}=t;return {...e,appearance:{...e.appearance,custom:i}}}function lr(e){return {version:e.version,ids:e.ids}}var ur=`profile-stats`;function dr(e){let t=e.settings?.featureState;if(e.settings===void 0||t===void 0||!Object.hasOwn(t,ur))return e;let{[ur]:n,...r}=t;return {...e,settings:{...e.settings,featureState:r}}}function fr(e,t){let n=new Map;for(let t of e)n.set(t.tag,t);for(let e of t)n.set(e.tag,{...n.get(e.tag),...e});return Array.from(n.values())}function pr(e,t){let n=new Map;for(let t of e)n.set(t.id,t);for(let e of t)n.set(e.id,e);return Array.from(n.values())}function mr(e,t){let n={...e};for(let[e,r]of Object.entries(t))n[e]={...n[e]??{},...r};return n}function hr(e,t){let n=new Set([...e.ids,...t.ids]),r={version:t.version,ids:Array.from(n)};return e.sync!==void 0&&(r.sync=e.sync),r}function gr(e,t){return {artistCount:e.artists.length,collectionCount:e.collections.length,favCount:t.ids.length}}function _r(e){let t=As(e.marks);return {...e,marks:t.marks}}async function vr(e,t,n,r,i){await rr();let a=i?e:_r(e),o=Va$1(a);return q$2(o.data),i&&t!==void 0&&nr(t),r&&await er(n),bs(),Hs$1(),Ss(),gr(G$2(),tr())}function yr(e=new Date){return `${String(e.getFullYear())}-${String(e.getMonth()+1).padStart(2,`0`)}-${String(e.getDate()).padStart(2,`0`)}`}function br(e=new Date){return `ruledesk-web-backup-${yr(e)}.json`}async function xr(e){let t=dr(G$2()),n={format:Gn,version:1,exportedAt:new Date().toISOString(),storage:t,...e.includeFavorites?{favs:lr(tr())}:{}};if(e.includeBackground){let e=await $n();if(e!==void 0)return {...n,background:e}}return n}function Sr(e){return `${JSON.stringify(e,null,2)}\n`}function Cr(e,t){let n=new Blob([e],{type:`application/json`}),r=URL.createObjectURL(n),i=document.createElement(`a`);i.href=r,i.download=t,i.rel=`noopener`,document.body.append(i),i.click(),i.remove(),URL.revokeObjectURL(r);}async function wr(e){let t=await xr(e);return Cr(Sr(t),br()),sr$1(),t}async function Tr(e,t){let n;try{n=JSON.parse(e);}catch(e){return {ok:false,error:e instanceof Error?e.message:`Invalid JSON`}}let r=Jn.safeParse(n);if(!r.success)return {ok:false,error:Qn(r.error)};let i={...r.data,storage:ar(r.data.storage)};if(i.background!==void 0&&i.background.length>0){if(!sr(i.background))return {ok:false,error:Yn};if(Kz(i.background))return {ok:false,error:a}}let a$1=Object.prototype.hasOwnProperty.call(i,`background`),o=Object.prototype.hasOwnProperty.call(i,`favs`),s=i.favs===void 0?void 0:lr(i.favs);try{if(t===`replace`)return {ok:!0,summary:await vr(i.storage,o?s:void 0,a$1?i.background:void 0,!0,o)};let e=G$2(),n=tr(),r={version:e.version,collections:pr(e.collections,i.storage.collections),artists:fr(e.artists,i.storage.artists),marks:mr(e.marks,i.storage.marks),settings:i.storage.settings,updates:i.storage.updates??e.updates};return r.settings===void 0&&(r.settings=Ja$2().settings),{ok:!0,summary:await vr(r,o&&s!==void 0?hr(n,s):void 0,i.background,a$1,o)}}catch(e){return m.error(`backup import failed after parse`,e),Hs$1(),Ss(),{ok:false,error:e instanceof Error?e.message:`Import failed unexpectedly`}}}var Er=`Could not read file`;function Dr(e){return new Promise((t,n)=>{let r=new FileReader;r.onload=()=>{typeof r.result==`string`?t(r.result):n(Error(Er));},r.onerror=()=>{n(r.error??Error(Er));},r.readAsText(e);})}var G=`rdw-data-section`,Or=`rdw-data-actions`,kr=`rdw-data-hint`,Ar=`rdw-data-backup-plate`,jr=`rdw-data-backup-plate-text`,Mr=`rdw-data-backup-mark`,Nr=`!`,Pr=`Time to export one.`,Fr=`rdw-data-import-choice`,Ir=`rdw-data-file`,Lr=`Data`,Rr=`Include background image`,zr=`rdw-backup-include-bg`,Br=`Include favorites`,Vr=`rdw-backup-include-favs`,Hr=`Favorites restore via Favorites sync. Include them in the file only if you need to copy the local fav list.`,Ur=`Import the file`,Wr=`Merge adds the collections, followed artists and marks of the file to the ones here and takes the settings from the file. Replace erases what is here first.`,Gr=`Merge into current data`,Kr=`Replace current data`,qr=`Replace everything?`,Jr=`Collections, followed artists, marks and settings in this browser are erased and the file is put in their place. This cannot be undone. Export first if you are not sure.`,Yr=`Replace`,Xr=Fe.export,Zr=Fe.import,Qr=`Export failed:`,$r=`The file holds collections, followed artists (with covers and post counts) and settings. Blacklist and site theme are browser cookies and are not included.`,ei=`
.${G} {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.${G} .${Or} {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.${G} .${kr} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 12px;
}
/* No backup, or an old one, is a warning with its way out in it, not a grey line. */
.${G} .${Ar} {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 10px;
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-warn-soft);
  color: var(--rdw-warn);
  font-size: 12px;
}
.${G} .${jr} {
  flex: 1 1 200px;
  margin: 0;
}
.${G} .${Mr} {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 18px;
  height: 18px;
  border: 2px solid currentColor;
  border-radius: 50%;
  font-weight: 700;
  line-height: 1;
}
/* The dialog may be drawn in <body>, out of the section: no parent in the selector. */
.${Fr} {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}
.${Fr} p {
  margin: 0;
}
.${G} .${Ir} {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
`.trim();function ti(e){return `Imported ${String(e.artistCount)} artists, ${String(e.collectionCount)} collections, ${String(e.favCount)} favorites.`}function ni(e={}){let t=e.includeHeading!==false,n=V(null),[r,i]=z(false),[a,o]=z(false),[s,c]=z(``),[l,u]=z(``),[d,f]=z(()=>dr$1()),[p,m]=z(()=>or$1()===null),[h,g]=z(null),[_,v]=z(null),y=(e,t)=>{Tr(e,t).then(e=>{e.ok?u(ti(e.summary)):c(`${Fe.importErrorPrefix} ${e.error}`);}).catch(e=>{let t=e instanceof Error?e.message:`Could not read file`;c(`${Fe.importErrorPrefix} ${t}`);});},b=K$1(J$1,{variant:`primary`,onClick:()=>{c(``),u(``),wr({includeBackground:r,includeFavorites:a}).then(()=>{f(dr$1()),m(or$1()===null),wr$2();}).catch(e=>{let t=e instanceof Error?e.message:`Export failed unexpectedly`;c(`${Qr} ${t}`);});},children:Xr}),x=p||d.due;return K$1(A,{children:[K$1(`style`,{children:ei}),K$1(`section`,{className:`rdw-section ${G}`,children:[t?K$1(Er$1,{children:Lr}):null,x?K$1(`div`,{className:Ar,role:`status`,children:[K$1(`span`,{className:Mr,"aria-hidden":`true`,children:Nr}),K$1(`p`,{className:jr,children:d.due?`${d.text} ${Pr}`:d.text}),b]}):K$1(`p`,{className:kr,children:d.text}),K$1(`div`,{className:dt.settingsGroup,children:[K$1(`div`,{className:dt.settingsRow,children:K$1(fi$1,{id:zr,label:Rr,checked:r,onChange:i})}),K$1(`div`,{className:dt.settingsRow,children:[K$1(fi$1,{id:Vr,label:Br,checked:a,onChange:o}),K$1(`p`,{className:dt.settingsCaption,children:Hr})]})]}),K$1(`div`,{className:Or,children:[x?null:b,K$1(J$1,{variant:`secondary`,onClick:()=>{n.current?.click();},children:Zr}),K$1(`input`,{ref:n,className:Ir,type:`file`,accept:`application/json,.json`,"aria-hidden":`true`,tabIndex:-1,onChange:e=>{let t=e.currentTarget.files?.[0];e.currentTarget.value=``,t!==void 0&&(c(``),u(``),Dr(t).then(e=>{g(e);}).catch(e=>{let t=e instanceof Error?e.message:`Could not read file`;c(`${Fe.importErrorPrefix} ${t}`);}));}})]}),s.length>0?K$1(`p`,{className:`rdw-error`,children:s}):null,l.length>0?K$1(`p`,{className:`rdw-hint`,children:l}):null,K$1(`p`,{className:kr,children:$r}),K$1(Sn$1,{open:h!==null,title:Ur,onClose:()=>{g(null);},children:K$1(`div`,{className:Fr,children:[K$1(`p`,{children:Wr}),K$1(J$1,{variant:`primary`,onClick:()=>{let e=h;g(null),e!==null&&y(e,Kn);},children:Gr}),K$1(J$1,{variant:`danger-quiet`,onClick:()=>{v(h),g(null);},children:Kr}),K$1(J$1,{variant:`secondary`,onClick:()=>{g(null);},children:Fe.cancel})]})}),K$1(Sn$1,{variant:`confirm`,open:_!==null,title:qr,message:Jr,confirmLabel:Yr,cancelLabel:Fe.cancel,confirmTone:`danger`,onConfirm:()=>{let e=_;v(null),e!==null&&y(e,qn);},onClose:()=>{v(null);}})]})]})}var K=`rdw-downloads-settings`,ri=`rdw-downloads-settings-actions`,q=`rdw-downloads-settings-hint`,ii=`rdw-downloads-settings-tokens`,ai=`rdw-downloads-settings-token`,oi=`rdw-api-credentials`,si=`rdw-download-name`,ci=`File name`,li=`Saved.`,ui=`Anything typed outside the brackets is kept as it is; the extension is added by itself. Keep id or md5 in the name, or files will share one.`,di=`Files are saved as: `,fi=`Files go to the browser's download folder, each download into a folder named after the collection or the search.`,pi=`0f3a9c7b2d1e4f5a6b7c8d9e0f1a2b3c`,mi=`${pi.slice(0,4)}…${pi.slice(-4)}`,hi={postId:19374686,url:`https://wimg.rule34.xxx/images/1234/${pi}.jpg`,rating:`explicit`,score:42,width:1080,height:1632,owner:`uploader`},gi=`API key`,_i=`rdw-downloads-settings-key`,vi=`&api_key=…&user_id=…`,yi=`Remove key`,bi=`https://rule34.xxx/index.php?page=account&s=options`,xi=`account options page`,Si=`The download manager finds files through the site API with your own key. Generate it on the `,Ci=`, copy the whole line it shows and paste it here. The key stays in this browser and is not part of the Data export. Without a key there are no download buttons.`,wi=`Saved. Download buttons appear on collection pages and under the search panel.`,Ti=`Key removed.`,Ei=`Paste the whole line from the site: it must hold both api_key and user_id.`,Di=`A key is stored. Paste a new line to replace it.`,Oi=`
.${K} {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.${K} .${ri} {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.${K} .${q} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 12px;
}
/* The field and what is done with it in one row: Save was a paragraph away. */
.${_i} {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}
.${_i} .rdw-field {
  flex: 1 1 auto;
  min-width: 0;
}
.${ii} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 6px;
}
.${ai} {
  min-height: 24px;
  padding: 0 8px;
  border: 1px solid var(--rdw-border);
  border-radius: 12px;
  background: var(--rdw-surface-2);
  color: var(--rdw-text);
  font: 12px var(--rdw-font);
  cursor: pointer;
}
.${ai}:hover {
  border-color: var(--rdw-accent);
}
.${ai}[aria-pressed="true"] {
  background: var(--rdw-accent-soft);
  border-color: var(--rdw-accent);
}
`.trim(),ki=[{mask:k,name:`Site + ID`},{mask:`[id]`,name:`ID`},{mask:`[md5]`,name:`MD5 hash`},{mask:`[date] [id]`,name:`Date + ID`},{mask:`[id] [width]x[height]`,name:`ID + size`},{mask:`[rating] [id]`,name:`Rating + ID`},{mask:`[owner] [id]`,name:`Uploader + ID`}],Ai=ki.map(e=>e.mask),ji=`custom`,Mi=`Custom…`,Ni=`In the name:`,Pi=` — `;function Fi(e){return Ie$1(e,hi)}function Ii(e,t){return `${e}${Pi}${Fi(t).replace(pi,mi)}`}function Li(e){let[t,n]=z(()=>Ft()),[r,i]=z(()=>!Ai.includes(Ft())),[a,o]=z(false),s=e=>{It(e),n(Ft()),o(true);},c=[{value:ji,label:Mi},...ki.map(e=>({value:e.mask,label:Ii(e.name,e.mask)}))];return K$1(`form`,{className:K,onSubmit:e=>{e.preventDefault(),s(t);},children:[K$1(oi$1,{label:ci,disabled:e.disabled,options:c,value:r?ji:t,onChange:e=>{e===ji?(i(true),o(false)):(i(false),s(e));}}),r?K$1(A,{children:[K$1(qt,{id:si,value:t,placeholder:k,"aria-label":ci,disabled:e.disabled,onChange:e=>{n(e),o(false);}}),K$1(`div`,{className:ii,children:[K$1(`span`,{className:q,children:Ni}),we.map(r=>K$1(`button`,{type:`button`,className:`${ai} rdw-kit-focusable`,"aria-pressed":Le(t,r),disabled:e.disabled,onClick:()=>{n(Re$1(t,r)),o(false);},children:r},r))]}),K$1(`div`,{className:ri,children:K$1(J$1,{type:`submit`,variant:`primary`,size:`s`,disabled:e.disabled,children:Fe.save})}),K$1(`p`,{className:q,children:ui})]}):null,r||a?K$1(`p`,{className:q,role:`status`,children:[r?`${di}${Fi(t)}`:``,a?li:``].filter(e=>e.length>0).join(` `)}):null,K$1(`p`,{className:q,children:fi})]})}function Ri(e){let t=e.disabled===true,[n,r]=z(()=>Ue()),[i,a]=z(``),[o,s]=z(``),c=()=>{let e=Ye(i);e===null||!We(e.userId,e.apiKey)?s(Ei):(a(``),r(true),s(wi));};return K$1(`section`,{className:`rdw-section ${K}`,children:[K$1(`style`,{children:Oi}),K$1(`form`,{className:K,onSubmit:e=>{e.preventDefault(),c();},children:[K$1(`div`,{className:_i,children:[K$1(qt,{id:oi,label:gi,type:`password`,value:i,placeholder:n?Di:vi,disabled:t,onChange:e=>{a(e),s(``);}}),K$1(J$1,{type:`submit`,variant:`primary`,disabled:t||i.trim().length===0,children:Fe.save}),n?K$1(J$1,{type:`button`,variant:`secondary`,disabled:t,onClick:()=>{Ge$1(),a(``),r(false),s(Ti);},children:yi}):null]}),K$1(`p`,{className:q,children:[Si,K$1(`a`,{href:bi,target:`_blank`,rel:`noopener`,children:xi}),Ci]})]}),o.length>0?K$1(`p`,{className:q,role:`status`,children:o}):null,K$1(Li,{disabled:t})]})}var zi=`rdw-upload-sets-settings`,Bi=`rdw-upload-sets-settings-row`,Vi=`rdw-upload-sets-settings-name`,Hi=`rdw-upload-sets-settings-tags`,Ui=`rdw-upload-sets-settings-hint`,Wi=`rdw-upload-sets-settings-actions`,Gi=`Name`,Ki=`Tags`,qi=`My usual tags`,Ji=`tag_one tag_two`,Yi=`Add a set`,Xi=`Remove the set `,Zi=`Remove this set`,Qi=`No sets yet.`,$i=`A set is a button on the Upload page: it adds its tags to the Tags field, and a tag that is there already is not added twice. Tags are separated by spaces.`,ea=200,ta=14,na=`
.${zi} {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.${Bi} {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}
.${Bi} .${Vi} {
  flex: none;
  width: ${String(ea)}px;
}
.${Bi} .${Hi} {
  flex: 1 1 auto;
  min-width: 0;
}
.${zi} .${Ui} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 12px;
}
.${Wi} {
  display: flex;
}
`.trim();function ra(){let[e,t]=z(()=>vR()),n=e=>{yR(e),t(e);},r=(t,r)=>{n(e.map((e,n)=>n===t?{...e,...r}:e));};return K$1(`section`,{className:`rdw-section ${zi}`,children:[K$1(`style`,{children:na}),e.length===0?K$1(`p`,{className:Ui,children:Qi}):null,e.map((t,i)=>K$1(`div`,{className:Bi,children:[K$1(qt,{className:Vi,...i===0?{label:Gi}:{"aria-label":Gi},value:t.name,placeholder:qi,inputAttrs:{maxLength:40},onChange:e=>{r(i,{name:e});}}),K$1(Nt,{className:Hi,...i===0?{label:Ki}:{"aria-label":Ki},value:t.tags,placeholder:Ji,onChange:e=>{r(i,{tags:e.slice(0,hR)});}}),K$1(En$1,{label:t.name.trim().length>0?`${Xi}${t.name.trim()}`:Zi,onClick:()=>{n(e.filter((e,t)=>t!==i));},children:K$1(mt,{size:ta})})]},i)),K$1(`div`,{className:Wi,children:K$1(J$1,{variant:`secondary`,onClick:()=>{n([...e,{name:``,tags:``}]);},children:[K$1(ft,{size:ta}),Yi]})}),K$1(`p`,{className:Ui,children:$i})]})}var J=`rdw-favs-sync`,ia=`rdw-favs-sync-status`,aa=`rdw-favs-sync-actions`,oa=`rdw-favs-sync-note`,sa=`Favorites sync`,ca=`Sync favorites`,la=`Full resync`,ua=`Resume`,da=`Stop`,fa=`Starting sync…`,pa=`Favorites sync progress`,ma=` · `,Y=`en-US`,ha=1e3,ga=60,_a=e=>`${e.toLocaleString(Y)} ${e===1?`favorite`:`favorites`}`,va=e=>`last sync ${e}`,ya=e=>`last full sync ${e}`,ba=(e,t)=>t===null?`page ${e.toLocaleString(Y)}`:`page ${e.toLocaleString(Y)} of ${t.toLocaleString(Y)}`,xa=(e,t)=>`paused at ${ba(e,t)}`,Sa=e=>`Page ${e.page.toLocaleString(Y)} of ${e.pages.toLocaleString(Y)}`,Ca=`Sync adds new favorites and stops at the first page where every favorite is already known.`,wa=`Full resync re-reads every page to refresh tags.`,Ta=(e,t)=>`Full resync re-reads all ${e.toLocaleString(Y)} pages (${t}) to refresh tags.`,Ea=`Posts you removed on the site stay here.`,Da=`under a minute`,Oa=e=>`about ${String(e)} min`,ka=`
.${J} {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.${J} .${ia} {
  margin: 0;
  color: var(--rdw-text);
  font-size: 12px;
}
.${J} .${aa} {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.${J} .${oa} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 12px;
}
`.trim(),X=null;function Aa(e){let t=Date.parse(e);return Number.isFinite(t)?n$1(t):e}function ja(e){return Math.floor(e/50)+1}function Ma(e){return e===void 0||e.lastPid===0&&e.finishedAt===void 0?null:ja(e.lastPid)}function Na(e){let t=(e-1)*dn$1/ha;return t<ga?Da:Oa(Math.ceil(t/ga))}function Pa(){let e=Ma(Os$1());return [Ca,e===null||e<=1?wa:Ta(e,Na(e)),Ea].join(` `)}function Fa(e){return e!==void 0&&e.finishedAt===void 0}function Ia(e){return e.pages<=0?null:e.page/e.pages}function La(){let e=Os$1(),t=[_a(Cs().size)];if(e!==void 0&&e.finishedAt===void 0){let n=ja(e.nextPid),r=Ma(e);t.push(xa(n,r===null?null:Math.max(r,n)));}else if(e?.finishedAt!==void 0){let n=Aa(e.finishedAt);t.push(Wn$2(e)===q$1?ya(n):va(n));}return t.join(ma)}function Ra(){return {status:La(),progress:null,waiting:false,error:``,unfinished:Fa(Os$1()),busy:X!==null}}function za(e){let t=Ia(e);return {status:Sa(e),progress:t,waiting:t===null,error:``,unfinished:true,busy:true}}function Ba(e){return X=null,e.status===`error`?{...Ra(),error:e.message}:Ra()}async function Va(e,t){if(X!==null)return;let n=new AbortController,r=new Set;X={controller:n,listeners:r},r.add(t=>{e(za(t));}),e({status:fa,progress:null,waiting:true,error:``,unfinished:true,busy:true});try{let i=await Xn$1({onProgress:e=>{for(let t of r)t(e);},signal:n.signal,...t===void 0?{}:{mode:t}});X?.controller===n&&e(Ba(i));}catch(t){m.error(`favorites sync section: unexpected failure`,t),X?.controller===n&&(X=null,e({...Ra(),error:t instanceof Error?t.message:`unexpected error`}));}}function Ha(e={}){let t=e.includeHeading!==false,[n,r]=z(()=>Ra());return B(()=>{if(X===null)return;let e=e=>{r(za(e));};return X.listeners.add(e),r({status:fa,progress:null,waiting:true,error:``,unfinished:true,busy:true}),()=>{X?.listeners.delete(e);}},[]),K$1(A,{children:[K$1(`style`,{children:ka}),K$1(`section`,{className:`rdw-section ${J}`,children:[t?K$1(Er$1,{children:sa}):null,K$1(`p`,{className:ia,children:n.status}),n.busy?K$1(Wn$1,{value:n.progress,waiting:n.waiting,label:pa}):null,K$1(`div`,{className:aa,children:n.busy?K$1(J$1,{variant:`secondary`,onClick:()=>{X?.controller.abort();},children:da}):n.unfinished?K$1(J$1,{variant:`primary`,onClick:()=>{Va(r);},children:ua}):K$1(A,{children:[K$1(J$1,{variant:`primary`,onClick:()=>{Va(r,K$2);},children:ca}),K$1(J$1,{variant:`secondary`,onClick:()=>{Va(r,q$1);},children:la})]})}),n.error.length>0?K$1(`p`,{className:`rdw-error`,children:n.error}):null,K$1(`p`,{className:oa,children:Pa()})]})]})}var Ua=`rdw-ai-everywhere`,Wa=`Hide AI posts everywhere`,Ga=`When off, Posts, Feed, Following, Collections and Favorites each keep their own Show / Hide choice.`,Ka=`Off: the site looks as without RuleDesk. The page features below need this on; Favorites sync, Blacklist and Data work without it.`,qa=`rdw-tag-kind-lookup`,Ja=`Look up the kind of unknown tags`,Ya=`Colours the dot of a tag the script has not met on the site yet. Asks the site's tag suggestions once for each such tag, one request at a time.`,Xa=`Posts of a custom collection opened as one search. A longer collection is opened in parts.`,Za=`Local index`,Qa=`rdw-settings-block`,$a=`rdw-settings-block-title`,eo=`rdw-settings-nav-search`,to=`Artists per search`,no=`0 means the default, 400.`,ro=new Set([`grid-density`]),io=`.rdw-appearance__row:nth-child(even) {
  background: transparent;
}`,ao=`rdw-settings-section`,oo=`rdw-settings-section-title`,Z=`data-settings-section`,so=`rdw-settings-section-`,co=`data-settings-rows`,lo=`data-settings-hidden`,uo=`rdw-settings-rows`,fo=`rdw-settings-master`,po=`rdw-settings-row--master`,mo=`rdw-settings-layout`,ho=`rdw-settings-nav`,go=`rdw-settings-nav-title`,_o=`rdw-settings-nav-sub`,vo=`rdw-settings-nav-list`,yo=`rdw-settings-nav-link`,bo=`rdw-settings-nav-rule`,Q=`rdw-settings-content`,xo=200,So=720,Co=40,wo=900,To=16,Eo=160,Do=2,Oo=`RuleDesk`,ko=`Settings`,Ao=`Sections of the settings`,jo=`Search settings`,Mo=`Clear`,No=`rdw-settings-match`,Po=`scroll`,Fo=`hashchange`,Io=`STYLE`,Lo=`appearance`,Ro=`blacklist`,zo=xe,Bo=`downloads`,Vo=VR,Ho=`data`,Uo=[{id:Lo,title:`Appearance`,service:false},...$P.map(e=>({id:e.id,title:e.title,service:false})),{id:zo,title:`Favorites`,service:true},{id:Bo,title:`Downloads`,service:true},{id:Vo,title:`Upload`,service:true},{id:Ro,title:`Blacklist`,service:true},{id:Ho,title:`Data`,service:true}];function Wo(e){return `No settings match \u201c${e.trim()}\u201d.`}function Go(){let e=typeof GM_info>`u`?``:GM_info.script.version;return e.length>0?`${ko} \u00b7 ${e}`:ko}var Ko=`
/* The list of sections on the left, held in place, and a column of settings
   beside it: a name and its switch are near each other, not a screen apart. */
.${mo} {
  display: grid;
  grid-template-columns: ${String(xo)}px minmax(0, ${String(So)}px);
  column-gap: ${String(Co)}px;
  justify-content: center;
  align-items: start;
}
.${ho} {
  position: sticky;
  top: calc(${Za$1} + ${String(To)}px);
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}
.${go} {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--rdw-text);
}
.${_o} {
  margin: -10px 0 0;
  font-size: 12px;
  color: var(--rdw-muted);
}
.${vo} {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.${yo} {
  display: block;
  padding: 6px 10px;
  border-radius: var(--rdw-radius-m);
  color: var(--rdw-text);
  font-size: 13px;
  text-decoration: none;
}
.${yo}:hover {
  background: var(--rdw-surface);
}
.${yo}[aria-current="true"] {
  background: var(--rdw-surface-2);
  font-weight: 600;
}
.${bo} {
  height: 1px;
  margin: 8px 4px;
  background: var(--rdw-border);
}
.${Q} {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
/* Two levels only: a section with its name, and the card of its settings. */
.${ao} {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 28px;
  scroll-margin-top: calc(${Za$1} + ${String(To)}px);
}
.${oo} {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--rdw-text);
}
.rdw-card.${uo} {
  padding: 2px 16px;
  gap: 0;
}
/* The rows of Appearance are its own: the same edge and height as the others. */
.${Q} .rdw-appearance__row {
  padding: 9px 0;
  border-radius: 0;
}
/* The name of a field is written as the name of a row is, not in small capitals. */
.${Q} .rdw-field__label,
.${Q} .rdw-ac__label,
.${Q} .rdw-select__label {
  font: 400 12.5px var(--rdw-font);
  letter-spacing: 0;
  text-transform: none;
  color: var(--rdw-text);
}
.${Q} p a {
  color: var(--rdw-accent);
  text-decoration: none;
}
.${Q} p a:hover {
  text-decoration: underline;
}
/* What is done, under what is set, in the same card: a line and a name between them. */
.${Qa} {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 14px;
  border-top: 1px solid var(--rdw-border);
}
.${$a} {
  margin: 0;
  font: 600 12.5px var(--rdw-font);
  color: var(--rdw-text);
}
.${eo} {
  width: 100%;
}
/* The switch the others depend on stands first and apart, on a ground of its own. */
.rdw-card.${fo} {
  background: var(--rdw-surface-2);
}
.${po} .rdw-switch__label {
  font-weight: 600;
}
[${lo}] {
  display: none !important;
}
::highlight(${No}) {
  background-color: var(--rdw-accent-soft);
  color: var(--rdw-text);
}
@media (max-width: ${String(wo)}px) {
  .${mo} {
    grid-template-columns: minmax(0, 1fr);
    row-gap: 16px;
  }
  .${ho} {
    position: static;
  }
}
`.trim();function qo(e){let t=document.createTreeWalker(e,NodeFilter.SHOW_TEXT),n=[];for(let e=t.nextNode();e!==null;e=t.nextNode())e instanceof Text&&e.parentElement?.tagName!==Io&&n.push(e);return n}function Jo(e){return qo(e).map(e=>e.data).join(` `).toLowerCase()}function $(e,t){t?e.setAttribute(lo,``):e.removeAttribute(lo);}function Yo(e,t){let n=t.trim().toLowerCase(),r=0;for(let t of e.querySelectorAll(`[${Z}]`)){let e=[...t.querySelectorAll(`.${dt.settingsRow}`)],i=t.hasAttribute(co);if(n.length===0){$(t,false);for(let t of e)$(t,false);r+=1;continue}let a=t.querySelector(`.${oo}`),o=a!==null&&Jo(a).includes(n);if(!i||o){for(let t of e)$(t,false);let i=o||Jo(t).includes(n);$(t,!i),r+=+!!i;continue}let s=false,c=false;for(let t of e){let e=t.classList.contains(dt.settingsRowSub),r=Jo(t).includes(n)||e&&c;e?r&&t.previousElementSibling!==null&&$(t.previousElementSibling,false):c=r,$(t,!r),s||=r;}$(t,!s),r+=+!!s;}return r}function Xo(e,t){if(typeof Highlight>`u`||typeof CSS>`u`||!(`highlights`in CSS))return;CSS.highlights.delete(No);let n=t.trim().toLowerCase();if(n.length===0)return;let r=[];for(let t of qo(e)){let e=t.data.toLowerCase();for(let i=e.indexOf(n);i!==-1;i=e.indexOf(n,i+n.length)){let e=new Range;e.setStart(t,i),e.setEnd(t,i+n.length),r.push(e);}}r.length>0&&CSS.highlights.set(No,new Highlight(...r));}function Zo(e){return K$1(`section`,{id:`${so}${e.id}`,className:ao,"aria-labelledby":`${so}${e.id}-title`,[Z]:e.id,...e.rows===true?{[co]:``}:{},children:[K$1(`h2`,{id:`${so}${e.id}-title`,className:oo,children:e.title}),e.children]})}function Qo(e){let[,t]=z(0),n=()=>{t(e=>e+1);};return K$1(A,{children:e.features.map(t=>{let r=Tt(t.id,t.label),i=t.choice;return K$1(A,{children:[K$1(`div`,{className:dt.settingsRow,children:[K$1(fi$1,{id:`${ht}${t.id}`,label:r,checked:iF(t.id),disabled:e.disabled,onChange:e=>{Mc(t.id,e),t.resetStateOnToggle===true&&Nc(t.id),t.cssOnly===true?(sF(t.id,e),n()):window.location.reload();}}),t.settingsCaption!==void 0&&i===void 0?K$1(`p`,{className:dt.settingsCaption,children:t.settingsCaption}):null]}),i===void 0?null:K$1(`div`,{className:`${dt.settingsRow} ${dt.settingsRowSub}`,id:`${gt}${t.id}`,children:[K$1(oi$1,{label:i.label??r,disabled:e.disabled||!iF(t.id),options:i.options.map(e=>({value:e.value,label:e.label})),value:aF(t.id),onChange:e=>{Fc(t.id,e),t.cssOnly===true?(cF(t.id,e),n()):window.location.reload();}}),t.settingsCaption===void 0?null:K$1(`p`,{className:dt.settingsCaption,children:t.settingsCaption})]})]},t.id)})})}function $o(){let[n,r]=z(()=>kc()),[i,a]=z(()=>Rc()),[l,u]=z(()=>Bc()),[d,f]=z(()=>Dc()),[m,h]=z(()=>jc(Xe,true)),[g$1,_]=z(()=>W$1()),[v,b]=z(()=>jc(Os,true)),[x,ne]=z(()=>jc(qa$1,true)),C=V(null),w=V(null),[T,se]=z(``),[E,ce]=z(false),[le,ue]=z(Lo),[de]=z(()=>we$2());B(()=>{let e=e=>{if(e===null)return;let t=C.current?.querySelector(`[${Z}="${CSS.escape(e)}"]`);t instanceof HTMLElement&&typeof t.scrollIntoView==`function`&&(t.scrollIntoView({block:`start`}),ue(e));};e(Se(window.location.hash)??de);let t=()=>{e(Se(window.location.hash));};return window.addEventListener(Fo,t),()=>{window.removeEventListener(Fo,t);}},[de]),B(()=>{let e=()=>{let e=[...w.current?.querySelectorAll(`[${Z}]:not([${lo}])`)??[]],t=e[0];for(let n of e)n.getBoundingClientRect().top<=Eo&&(t=n);let n=document.documentElement;window.innerHeight+window.scrollY>=n.scrollHeight-Do&&(t=e[e.length-1]??t);let r=t?.getAttribute(Z)??null;r!==null&&ue(r);};return window.addEventListener(Po,e,{passive:true}),()=>{window.removeEventListener(Po,e);}},[]),Ie(()=>{let e=w.current;e!==null&&(ce(Yo(e,T)===0),Xo(e,T));});let fe={[Q$1.header]:K$1(A,{children:[K$1(`div`,{className:dt.settingsRow,children:K$1(fi$1,{id:Qe,label:Ze,checked:m,onChange:e=>{Mc(Xe,e),h(e),Sr$1();}})}),K$1(`div`,{className:dt.settingsRow,children:K$1(fi$1,{id:Ya$1,label:Ja$1,checked:x,onChange:e=>{Mc(qa$1,e),ne(e),mo$1(e);}})})]}),[Q$1.feed]:K$1(`div`,{className:dt.settingsRow,children:[K$1(On$1,{id:_t,label:to,value:i,min:0,step:1,onChange:e=>{zc(e??0),a(Rc());}}),K$1(`p`,{className:dt.settingsCaption,children:no})]}),[Q$1.ai]:K$1(`div`,{className:dt.settingsRow,children:[K$1(fi$1,{id:Ua,label:Wa,checked:g$1,onChange:e=>{Ge(e),_(e);}}),K$1(`p`,{className:dt.settingsCaption,children:Ga})]}),[Q$1.search]:K$1(`div`,{className:dt.settingsRow,children:[K$1(fi$1,{id:qa,label:Ja,checked:v,onChange:e=>{Mc(Os,e),b(e);}}),K$1(`p`,{className:dt.settingsCaption,children:Ya})]}),[Q$1.collections]:K$1(`div`,{className:dt.settingsRow,children:[K$1(On$1,{id:vt,label:Fe.playlistChunkSizeLabel,value:l,min:1,step:1,onChange:e=>{Vc(e??0),u(Bc());}}),K$1(`p`,{className:dt.settingsCaption,children:Xa})]})},M=n=>QP.filter(e=>!ro.has(e.id)&&nF(e.id)===n),pe=`${dt.pageCard} ${uo}`,me=new Set($P.map(e=>e.id)),I=e=>$P.some(t=>t.id===e&&M(t.id).length===0&&fe[t.id]===void 0),ge=Uo.filter(e=>!I(e.id)),ve=e=>{if(e===Lo)return K$1(lt,{className:dt.pageCard,children:[K$1(Mn,{includeHeading:false}),K$1(`style`,{children:io}),K$1(`div`,{className:dt.settingsGroup,children:K$1(Qo,{features:M(Q$1.appearance),disabled:!n})})]});if(e===zo)return K$1(lt,{className:dt.pageCard,children:[K$1(`div`,{className:dt.settingsGroup,children:[K$1(`div`,{className:dt.settingsRow,children:K$1(fi$1,{id:bt,label:Fe.gridFavButtonsLabel,checked:d,onChange:e=>{Oc(e),rg(e),f(e);}})}),K$1(Qo,{features:M(Q$1.favorites),disabled:!n})]}),K$1(`div`,{className:Qa,children:[K$1(`p`,{className:$a,children:Za}),K$1(Ha,{includeHeading:false})]})]});if(e===Bo)return K$1(lt,{className:dt.pageCard,children:[K$1(`div`,{className:dt.settingsGroup,children:K$1(Qo,{features:M(Q$1.downloads),disabled:!n})}),K$1(Ri,{disabled:!n||!iF(`downloads`)})]});if(e===Vo)return K$1(lt,{className:dt.pageCard,children:K$1(ra,{})});if(e===Ro)return K$1(lt,{className:dt.pageCard,children:K$1(Wn,{includeHeading:false})});if(e===Ho)return K$1(lt,{className:dt.pageCard,children:K$1(ni,{includeHeading:false})});let t=$P.find(t=>t.id===e);return t===void 0?null:K$1(lt,{className:pe,children:[K$1(Qo,{features:M(t.id),disabled:!n}),fe[t.id]]})},be=e=>K$1(`li`,{children:K$1(`a`,{className:`${yo} rdw-kit-focusable`,href:g(e.id),...le===e.id?{"aria-current":`true`}:{},children:e.title})},e.id);return K$1(`div`,{className:mo,ref:C,children:[K$1(`style`,{children:Ko}),K$1(`nav`,{className:ho,"aria-label":Ao,children:[K$1(`p`,{className:go,children:Oo}),K$1(`p`,{className:_o,children:Go()}),K$1(wr$1,{className:eo,value:T,placeholder:jo,"aria-label":jo,onChange:se}),K$1(`ul`,{className:vo,children:[ge.filter(e=>!e.service).map(be),K$1(`li`,{className:bo,role:`separator`}),ge.filter(e=>e.service).map(be)]})]}),K$1(`div`,{className:`${Q} ${dt.scrollRegion}`,ref:w,children:[T.trim().length===0?K$1(lt,{className:`${pe} ${fo}`,children:K$1(`div`,{className:`${dt.settingsRow} ${po}`,children:[K$1(fi$1,{id:xt,label:Fe.enablePageTweaksLabel,checked:n,onChange:e=>{Ac(e),r(e),window.location.reload();}}),K$1(`p`,{className:dt.settingsCaption,children:Ka})]})}):null,ge.map(e=>K$1(Zo,{id:e.id,title:e.title,rows:me.has(e.id),children:ve(e.id)},e.id)),E?K$1(wn$1,{title:Wo(T),action:K$1(J$1,{variant:`secondary`,onClick:()=>{se(``);},children:Mo})}):null]})]})}})}}));
System.register("./collections-page-BHBUi-EK-XUUGRCfk.js", ['./___monkey.entry.js','./app-M32Uzb9f-DIm5OcM2.js','./filter-terms-uUxvUct3-DKlarcbS.js'],(function(exports){'use strict';var K$1,G$1,el,Fe,Lc,Ys,il,rl,tl,nl,Wa,Za,l,te,ko,Sc,vc,Xs,oo,yc,bc,xc,Ee,jt$1,Go,Te,cn$1,$o,Nt$2,io,Ic,z$1,V$1,B$1,Re,tm,K$2,Yr,J$1,Or,wr,oi,dt$1,F$1,DF,EF,jF,NF,A$1,ft$1,wn$1,En$1,mt$1,Sn$1,AF,qt$1,Nt$1,X$1,Hg,xt$1,Ot$1,pt$1,kF,MF,ke,Ne,Me,Oe,Ie,Be,ze,Re$1;return{setters:[function(module){K$1=module.bp;G$1=module.G;el=module.dg;Fe=module.bi;Lc=module.L;Ys=module.bE;il=module.dh;rl=module.di;tl=module.dj;nl=module.dk;Wa=module.dl;Za=module.aR;l=module.l;te=module.cO;ko=module.br;Sc=module.dm;vc=module.bj;Xs=module.c5;oo=module.bL;yc=module.bt;bc=module.bu;xc=module.bv;Ee=module.cs;jt$1=module.cq;Go=module.dn;Te=module.a9;cn$1=module.af;$o=module.dp;Nt$2=module.bD;io=module.aa;Ic=module.e;},function(module){z$1=module.z;V$1=module.V;B$1=module.B;Re=module.R;tm=module.an;K$2=module.K;Yr=module.ao;J$1=module.J;Or=module.k;wr=module.w;oi=module.o;dt$1=module.ap;F$1=module.aq;DF=module.ar;EF=module.as;jF=module.at;NF=module.au;A$1=module.A;ft$1=module.D;wn$1=module.c;En$1=module.y;mt$1=module.C;Sn$1=module.m;AF=module.av;qt$1=module.q;Nt$1=module.N;X$1=module.aw;Hg=module.ax;xt$1=module.ay;Ot$1=module.az;pt$1=module.aA;kF=module.aB;MF=module.aC;},function(module){ke=module.k;Ne=module.N;Me=module.M;Oe=module.O;Ie=module.I;Be=module.B;ze=module.z;Re$1=module.R;}],execute:(function(){exports("CollectionsPage",Sr);var w=1500,Je=8e3,T=4,E=`sort:`;function Ye(e){return e.filter(e=>e.kind===`search`&&!ko((e.query??``).trim()))}function D(e){return !(e.query??``).toLowerCase().split(/\s+/).some(e=>e.startsWith(E))}function O(e){let t=0;for(let n of e){let e=cn$1(n),r=e===null?NaN:Number(e);Number.isFinite(r)&&r>t&&(t=r);}return t}function k(e){return new Promise(t=>{window.setTimeout(t,e);})}async function Xe(e,t,n){let r=e.length,i=0;for(let a of e){if(n())break;try{let e=oo(a.tags);X$1(F$1);let t=await Hg(e).catch(async()=>(await k(Je),Hg(e))),n=t.thumbs[0]?.parentElement??null,r=t.thumbs[0]?.ownerDocument??null;if(n!==null&&yc(a.id,xt$1(n,T)),r!==null){let e=Ot$1(r,(a.query??``).trim());e!==null&&bc(a.id,e);}D(a)&&xc(a.id,O(t.thumbs),a.openedPostId===void 0);}catch(e){return {ok:false,checked:i,name:a.name,reason:e instanceof Error?e.message:String(e)}}i+=1,t({done:i,total:r}),i<r&&await k(w);}return {ok:true,checked:i}}var Ze=`pageshow`,Qe=`rdw-collections-page`,A=`rdw-collections-header`,$e=`rdw-collections-toolbar`,et=`rdw-collections-filter`,tt=`rdw-collections-grid`,j=`rdw-collections-grid--list`,M=`rdw-collections-cell`,N=`rdw-collections-cell-actions`,nt=`Move to a group: `,rt=`text/plain`,it=44,P=`rdw-collection-card`,F=`rdw-collection-cover`,I=`rdw-collection-cover-cell`,L=`rdw-collection-cover-image`,R=`rdw-collection-cover-empty`,z=`rdw-collection-meta-row`,B=`rdw-collection-name`,V=`rdw-collection-caption`,H=`rdw-collection-form-error`,U=`rdw-collections-form-hint`,W=`name`,at=`query`,G=`Posts you add by hand.`,K=`A saved search. Check for new shows when it grows.`,ot=`Same syntax as the site search.`,q=`rdw-collection-card--selected`,J=`rdw-collection-card-mark`,st=`rdw-collections-selected-count`,ct=`all`,Y=`custom`,X=`dynamic`,Z=`custom`,Q=`dynamic`,lt=`All`,ut=`Custom`,dt=`Dynamic`,ft=`New`,pt=`Select`,mt=`Select collections to delete`,ht=`${Fe.delete}\u2026`,gt=`Delete collections`,_t=`Delete collection`,vt=`${Fe.delete} `,yt=`Delete 1 collection? This cannot be undone.`,bt=`Delete `,xt=` collections? This cannot be undone.`,St=`checkbox`,Ct=1,wt=3,Tt=`rdw-collections-check--failed`,Et=`Retry`,Dt=`New collection`,Ot=`Create`,kt=`Query`,At=`cat_ears -comic`,jt=`Show`,Mt=`Collection kind`,Nt=`Filter by name; several names separated by commas`,Pt=`Filter collections`,Ft=`Collections`,It=`Custom`,Lt=`Dynamic`,Rt=`new`,zt=`rdw-collection-new`,Bt=` · `;function Vt(e,t){return `${e}${Bt}${t}`}var Ht=`Check for new`,Ut=`Read the first page of every saved search: refresh its cover and post count and mark the ones with new posts. One request per search`,$=`rdw-collections-check-status`,Wt=`saved search`,Gt=`no query`,Kt=`en-US`,qt=`+`,Jt=`No collections yet`,Yt=`Custom collections are posts you pick. Dynamic collections are saved searches.`,Xt=`No matching collections`,Zt=`Nothing matches this filter.`,Qt=`Clear filter`;function $t(e){return `No collections match \u201c${e.trim()}\u201d.`}var en=`Enter a name.`,tn=`Enter a query.`,nn=`A collection with this name already exists.`,rn=`post`,an=`posts`,on=1,sn=2,cn=4,ln=2,un=12,dn=12,fn=12,pn=8,mn=220,hn=5,gn=`rdw-collections-toolbar-spacer`,_n=8,vn=8,yn=8,bn=10,xn=12,Sn=14,Cn=22,wn=14,Tn=14,En=2,Dn=`0.04em`,On=`rdw-collection-name`,kn=`rdw-collection-query`,An=`rdw-collections-filter`,jn=`rdw-collection-form-error`,Mn=[{value:ct,label:lt},{value:Y,label:ut},{value:X,label:dt}],Nn=[{value:Z,label:ut},{value:Q,label:dt}],Pn=`
.${Qe} {
  display: flex;
  flex-direction: column;
  gap: ${String(dn)}px;
}
.${A} {
  display: flex;
  flex-direction: column;
  gap: ${String(fn)}px;
}
.${$e} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${String(pn)}px;
}
.${$e} .${et} {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 100%;
  margin: 0;
}
/* The caption over the sort list would make the row taller; the options say what they sort by. */
.${$e} .rdw-select__label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
/* Starts short and grows with what is typed, up to the row. */
.${et} .rdw-field__input {
  field-sizing: content;
  width: ${String(mn)}px;
  min-width: ${String(mn)}px;
  max-width: 100%;
}
@supports (field-sizing: content) {
  .${et} .rdw-field__input {
    width: auto;
  }
}
/* Stays at the top of the window while the list scrolls under it. */
.${A} {
  position: sticky;
  top: ${Za};
  z-index: ${String(hn)};
  padding-block: 8px;
  margin: -8px 0;
  background: var(--rdw-bg);
}
/* Custom theme: over the user's picture a bar of the page's colour from edge
   to edge is a black slab. The toolbar is a card there, like the tiles. */
:host-context(html[${l}="${te}"]) .${A} {
  margin: 0;
  padding: 8px 12px;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-l);
  background: color-mix(in srgb, var(--rdw-surface) 88%, transparent);
  backdrop-filter: blur(10px);
}
.${tt} {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: ${String(un)}px;
}
.${M} {
  position: relative;
  display: grid;
  min-width: 0;
}
/* The button of a card's group: there under the pointer and for the keyboard,
   and while its menu is open. Always there, it would cover every cover. */
.${N} {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 4px;
  transition: opacity 120ms ease;
}
/* With its menu open the corner of a card is over the cards after it. */
.${N}:has([aria-expanded="true"]) {
  z-index: 4;
}
.${N} .rdw-icon-btn {
  background: var(--rdw-surface);
  border: 1px solid var(--rdw-border);
}
@media (hover: hover) {
  .${M}:not(:hover):not(:focus-within) .${N}:not(:has([aria-expanded="true"])) {
    opacity: 0;
  }
}
/* The card that is being carried to a tab stays in its place, faded. */
.${M} {
  transition: opacity 160ms ease, transform 160ms ease;
}
.${M}[data-dragged] {
  opacity: 0.4;
  transform: scale(0.96);
}
@media (prefers-reduced-motion: reduce) {
  .${M},
  .${N} {
    transition: none;
  }
}
.${j} .${N} {
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
}
.${j} .${P} {
  padding-right: 76px;
}
.${P} {
  display: flex;
  flex-direction: column;
  gap: ${String(vn)}px;
  min-width: 0;
  padding: ${String(_n)}px;
  box-sizing: border-box;
  text-decoration: none;
  color: var(--rdw-text);
  background: var(--rdw-surface);
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-l);
}
/*
 * The tiles take the whole window, and so does the toolbar over them: its
 * filters start where the first tile starts and its actions end where the
 * last one ends. Kept to a centred column, the toolbar broke into two rows
 * with half the window free beside it. The list view stays centred.
 */
.${Qe} > :not(.${tt}):not(.${A}),
.${j} {
  padding-inline: ${AF};
}
/* Between the filters and the actions: the actions stand at the right end. */
.${gn} {
  flex: 1 1 auto;
}
/* List view: one collection per row, a small cover, the count on the right. */
.${j} {
  grid-template-columns: minmax(0, 1fr);
  gap: 4px;
}
.${j} .${P} {
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 6px 8px;
}
.${j} .${F} {
  flex: none;
  width: ${String(it)}px;
}
.${j} .${z} {
  flex: 1 1 auto;
  justify-content: flex-start;
}
.${j} .${V} {
  flex: none;
}
.${j} .${J} {
  top: 50%;
  left: 17px;
  transform: translateY(-50%);
}
/* Under the pointer a card is only lighter. The accent frame is for the card
   the keyboard is on, and for a selected one: hover used to look selected. */
.${P}:hover {
  border-color: var(--rdw-muted);
  background: var(--rdw-surface-2);
}
.${P}:focus {
  outline: none;
}
.${P}:focus-visible {
  border-color: var(--rdw-accent);
  background: var(--rdw-surface-2);
  outline: none;
}
.${P} {
  position: relative;
}
.${q},
.${q}:hover {
  border-color: var(--rdw-accent);
  box-shadow: 0 0 0 1px var(--rdw-accent);
  background: var(--rdw-accent-soft);
}
.${J} {
  position: absolute;
  top: ${String(wn)}px;
  left: ${String(wn)}px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: ${String(Cn)}px;
  height: ${String(Cn)}px;
  border: ${String(En)}px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-surface);
  color: var(--rdw-surface);
}
.${q} .${J} {
  border-color: var(--rdw-accent);
  background: var(--rdw-accent);
}
.${st} {
  color: var(--rdw-muted);
  font-size: ${String(xn)}px;
  white-space: nowrap;
}
.${F} {
  display: grid;
  grid-template-columns: repeat(${String(sn)}, minmax(0, 1fr));
  grid-template-rows: repeat(${String(sn)}, minmax(0, 1fr));
  aspect-ratio: 1;
  gap: ${String(ln)}px;
  border-radius: var(--rdw-radius-m);
  overflow: hidden;
  background: var(--rdw-surface-2);
}
.${I},
.${R} {
  min-width: 0;
  min-height: 0;
  background: var(--rdw-surface-2);
}
.${L},
.${R} {
  display: block;
  width: 100%;
  height: 100%;
}
.${L} {
  object-fit: cover;
}
/* One picture fills the cover; two stand side by side; three are one tall
   and two small. Four are the grid as it is; none is one empty field. */
.${F}:not([data-filled="0"]):not([data-filled="4"]) > .${I}[data-empty] {
  display: none;
}
.${F}[data-filled="1"] > .${I}:not([data-empty]) {
  grid-column: 1 / -1;
  grid-row: 1 / -1;
}
.${F}[data-filled="2"] > .${I}:not([data-empty]) {
  grid-row: 1 / -1;
}
.${F}[data-filled="3"] > .${I}:nth-child(1 of :not([data-empty])) {
  grid-row: 1 / -1;
}
.${F}[data-filled="0"] {
  gap: 0;
}
.${z} {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${String(yn)}px;
  min-width: 0;
}
.${B} {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}
.${$} {
  flex: 1 1 100%;
  color: var(--rdw-muted);
  font-size: 12px;
}
/* A check that stopped: not a grey line among others, and with a way on. */
.${$}.${Tt} {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 10px;
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-warn-soft);
  color: var(--rdw-warn);
}
/* "New" is news, the kind of a collection is not: the kind is in the grey line
   under the name, and the accent colour is kept for this one mark. */
.${zt} {
  flex: none;
  padding: 0 6px;
  border-radius: 9px;
  background: var(--rdw-accent);
  color: var(--rdw-surface);
  font-size: ${String(bn)}px;
  font-weight: 700;
  letter-spacing: ${Dn};
  text-transform: uppercase;
}
.${V} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: ${String(xn)}px;
}
.${U} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 12px;
}
.${H} {
  margin: 0;
  color: var(--rdw-danger);
  font-size: ${String(xn)}px;
}
`.trim();function Fn(e){return e===ct||e===Y||e===X}function In(e){return e===Z||e===Q}function Ln(e){return e.trim().toLowerCase()}function Rn(e){return `${String(e)} ${e===on?rn:an}`}function zn(e,t){let n=e.trim();if(n.length===0)return en;let r=Ln(n);for(let e of t)if(Ln(e.name)===r)return nn;return null}function Bn(e,t){return Be([e],ze(t,Re$1))}function Vn(e,t,n){let r=[];for(let i of e){if(!Bn(i.name,n))continue;let e=Wa(i);t===Y&&e!==`posts`||t===X&&e!==`search`||r.push(i);}return r}var Hn=`created`,Un=`newest`,Wn=`name`,Gn=`size`,Kn=`collections-sort`,qn=`Sort`,Jn=[{value:Un,label:`Newest first`},{value:Hn,label:`Oldest first`},{value:Wn,label:`Name`},{value:Gn,label:`Most posts`}];function Yn(e){return e===`created`||e===`newest`||e===`name`||e===`size`}function Xn(){let e=Ic(Kn);return Yn(e)?e:Hn}function Zn(e){return Wa(e)===`posts`?e.postIds?.length??0:e.postCount?.value??0}function Qn(e,t){let n=[...e];return t===`created`?n:t===`newest`?n.reverse():(n.sort((e,t)=>e.name.localeCompare(t.name,void 0,{sensitivity:`base`,numeric:true})),t===`size`&&n.sort((e,t)=>Zn(t)-Zn(e)),n)}function $n(e){return e===X?Q:Z}function er(e,t){return e===Q&&t===Y?X:e===Z&&t===X?Y:t}function tr(e){let t=e.postIds??[],n=[];for(let e=0;e<cn;e+=1){let r=t[e];n.push(r===void 0?null:r);}return n}function nr(e,t){let n=e.thumbs;if(n===void 0)return null;let r=n[String(t)];return r===void 0||r.trim().length===0?null:r}function rr(e,t,n){let r=Vt(e,t);return n.length>0?`${r}${Bt}${n}`:r}function ir(e){let t=e.length,n=t===Ct?yt:`${bt}${String(t)}${xt}`;if(t===0)return n;let r=e.slice(0,wt).map(e=>`\u201c${e}\u201d`),i=t-r.length;return `${n} ${i>0?`${r.join(`, `)} and ${String(i)} more`:r.join(`, `)}.`}function ar(e){return `${e.toLocaleString(Kt)} ${e===Ct?`collection`:`collections`}`}function or(e,t){return e===t?ar(t):`${e.toLocaleString(Kt)} of ${ar(t)}`}var sr=`HTTP 429`,cr=`the site is asked too often (429). Wait a minute, then retry.`,lr=`no answer from the site. Check the connection, then retry.`;function ur(e){return e.includes(sr)?cr:/failed to fetch|networkerror|load failed/i.test(e)?lr:`${e}. Retry later.`}function dr(e,t,n){return `${e}, ${t}, ${n}`}function fr(e){let t=e.select,r=dr(e.collection.name,e.badge,e.meta);return t===null?K$2(`a`,{className:P,href:e.href,draggable:false,"aria-label":r,"data-collection-id":e.collection.id,"data-collection-kind":e.kind,children:[e.children,K$2(`span`,{className:z,children:[K$2(`span`,{className:B,children:e.collection.name}),e.hasNew?K$2(`span`,{className:zt,children:Rt}):null]}),K$2(`span`,{className:V,children:rr(e.badge,e.meta,e.group)})]}):K$2(`a`,{className:t.selected?`${P} ${q}`:P,href:e.href,role:St,"aria-checked":t.selected,"aria-label":r,"data-collection-id":e.collection.id,"data-collection-kind":e.kind,onClick:e=>{e.preventDefault(),t.onToggle();},children:[K$2(`span`,{className:J,"aria-hidden":`true`,children:t.selected?K$2(pt$1,{size:Tn}):null}),e.children,K$2(`span`,{className:z,children:[K$2(`span`,{className:B,children:e.collection.name}),e.hasNew?K$2(`span`,{className:zt,children:Rt}):null]}),K$2(`span`,{className:V,children:rr(e.badge,e.meta,e.group)})]})}function pr(e){let[t,n]=z$1(null);return t===e.url?K$2(`span`,{className:R}):K$2(`img`,{className:L,src:e.url,alt:``,onError:()=>{n(e.url);}})}function mr(e){let t=e.urls.filter(e=>e!==null).length;return K$2(`span`,{className:F,"data-filled":String(t),children:e.urls.map((t,n)=>{let r=e.postIds?.[n]??null;return K$2(`span`,{className:I,"data-empty":t===null?`true`:void 0,"data-cover-index":String(n),"data-post-id":r===null?``:String(r),children:t===null?K$2(`span`,{className:R}):K$2(pr,{url:t})},`${e.collectionId}-${String(n)}`)})})}function hr(e){let t=Rn(e.collection.postIds?.length??0),n=tr(e.collection),r=n.map(t=>t===null?null:nr(e.collection,t));return K$2(fr,{collection:e.collection,href:jt$1(e.collection.id),kind:Ee,badge:It,meta:t,select:e.select,group:e.group,children:K$2(mr,{collectionId:e.collection.id,urls:r,postIds:n})})}function gr(e){return e.query??io(e.tags)}function _r(e){return `${oo(e.tags)}${Nt$2(e.id)}`}function vr(e){if(ko(gr(e)))return Gt;let t=$o(e.id)??e.postCount??null;if(t===null)return Wt;let n=t.value.toLocaleString(Kt);return t.exact?`${n} ${t.value===on?rn:an}`:`${n}${qt} ${an}`}function yr(e){let t=Go(e.collection.id)??e.collection.cover??[],n=[];for(let e=0;e<cn;e+=1)n.push(t[e]??null);return K$2(fr,{collection:e.collection,href:_r(e.collection),kind:Te,badge:Lt,hasNew:Sc(e.collection),meta:vr(e.collection),select:e.select,group:e.group,children:K$2(mr,{collectionId:e.collection.id,urls:n})})}function br(e){return Wa(e.collection)===`posts`?K$2(hr,{collection:e.collection,select:e.select,group:e.group}):K$2(yr,{collection:e.collection,select:e.select,group:e.group})}function xr(e){let t=e.error.length>0,n=t&&e.errorField===W,i=t&&e.errorField===at,o=K$2(`p`,{id:jn,className:H,role:`alert`,children:e.error});return K$2(Sn$1,{variant:`content`,open:e.open,onClose:e.onClose,title:Dt,children:[K$2(Or,{label:Mt,options:Nn,value:e.kind,onChange:t=>{In(t)&&e.onKindChange(t);}}),K$2(`p`,{className:U,children:e.kind===Q?K:G}),K$2(`form`,{className:`rdw-dialog__fields`,onSubmit:t=>{t.preventDefault(),e.onSubmit();},children:[K$2(qt$1,{id:On,label:Fe.nameLabel,value:e.name,onChange:e.onNameChange}),n?o:null,e.kind===Q?K$2(A$1,{children:[K$2(Nt$1,{id:kn,label:kt,placeholder:At,value:e.query,onChange:e.onQueryChange}),i?o:K$2(`p`,{className:U,children:ot})]}):null,K$2(`div`,{className:`rdw-dialog__actions`,children:[K$2(J$1,{type:`button`,variant:`secondary`,size:`s`,onClick:e.onClose,children:Fe.cancel}),K$2(J$1,{type:`submit`,variant:`primary`,size:`s`,disabled:n,children:Ot})]})]})]})}function Sr(){let[e,n]=z$1(ct),[a,fe]=z$1(``),[l,pe]=z$1(()=>MF(kF)),[ge,ve]=z$1(()=>Xn()),[ye,be]=z$1(false),[d,xe]=z$1(Z),[f,m]=z$1(``),[h,g]=z$1(``),[_,v]=z$1(``),[ke$1,Me$1]=z$1(W),[,y]=z$1(0),[b,Le]=z$1(false),[Re$1,x]=z$1([]),[Be,S]=z$1(false),[C,w]=z$1(``),[Je,T]=z$1(null),[E,D]=z$1(null),[O,k]=z$1(null),[it,P]=z$1(``),[F,I]=z$1(false),[L,R]=z$1(false),z=V$1(false);B$1(()=>()=>{z.current=true;},[]);let B=()=>{let e=Ye(G$1().collections);e.length===0||L||(z.current=false,I(false),R(true),P(`Checking 0 of ${String(e.length)}…`),Xe(e,e=>{P(`Checking ${String(e.done)} of ${String(e.total)}…`);},()=>z.current).then(e=>{if(z.current)return;K$1(),R(false);let t=G$1().collections.filter(Sc).length;P(e.ok?`Checked ${String(e.checked)}; ${String(t)} with new posts.`:`Stopped at “${e.name}” after ${String(e.checked)} checked: ${ur(e.reason)}`),I(!e.ok),y(e=>e+1);}));},V=Re(()=>{be(false),v(``),m(``),g(``);},[]);B$1(()=>{let e=()=>{K$1(),y(e=>e+1);};return window.addEventListener(Ze,e),()=>{window.removeEventListener(Ze,e);}},[]);let H=G$1().collections,U=el(),G=Qn(Vn(H,e,a),ge).filter(e=>ke(e.group,C)),K=(e,t)=>{tl(e,t),y(e=>e+1);},ot=H.length===0?{title:Jt,description:Yt}:a.trim().length>0?{title:$t(a),description:``}:{title:Xt,description:Zt},q=G.filter(e=>Re$1.includes(e.id)),J=()=>{Le(false),x([]),S(false);};tm(b,J);let Y=e=>{x(t=>t.includes(e)?t.filter(t=>t!==e):[...t,e]);},X=()=>{for(let e of q)Ys(e.id);J(),y(e=>e+1);},lt=()=>{xe($n(e)),m(``),g(``),v(``),be(true);},ut=()=>{let e=zn(f,G$1().collections);if(e!==null){Me$1(W),v(e);return}if(d===Q&&ko(h)){Me$1(at),v(tn);return}let t=f.trim();d===Q?vc(t,h):Xs(t),n(e=>er(d,e)),V(),y(e=>e+1);};return K$2(`div`,{className:Qe,children:[K$2(`style`,{children:Pn}),K$2(`header`,{className:A,children:[b?K$2(Yr,{count:q.length,onSelectAll:()=>{x(G.map(e=>e.id));},onClear:()=>{x([]);},onCancel:J,danger:K$2(J$1,{type:`button`,variant:`danger-quiet`,disabled:q.length===0,onClick:()=>{S(true);},children:ht}),children:K$2(Ne,{groups:U,disabled:q.length===0,onMove:e=>{K(q.map(e=>e.id),e);},onNew:()=>{T({kind:`new`,targets:q.map(e=>e.id)});}})}):K$2(`div`,{className:$e,children:[K$2(Or,{label:jt,options:Mn,value:e,onChange:e=>{Fn(e)&&n(e);}}),K$2(wr,{id:An,className:et,value:a,placeholder:Pt,"aria-label":Nt,onChange:fe}),K$2(oi,{label:qn,options:Jn,value:ge,onChange:e=>{Yn(e)&&(Lc(Kn,e),ve(e));}}),K$2(dt$1,{scope:F$1}),K$2(Or,{label:EF,options:DF,value:l,onChange:e=>{jF(e)&&(NF(kF,e),pe(e));}}),K$2(`span`,{className:st,children:or(G.length,H.length)}),K$2(`span`,{className:gn,"aria-hidden":`true`}),K$2(A$1,{children:[H.length>0?K$2(J$1,{type:`button`,variant:`secondary`,title:mt,onClick:()=>{Le(true);},children:pt}):null,Ye(H).length>0?K$2(J$1,{type:`button`,variant:`secondary`,title:Ut,disabled:L,onClick:B,children:Ht}):null,K$2(J$1,{type:`button`,variant:`primary`,onClick:lt,children:[K$2(ft$1,{size:Sn}),ft]}),it.length>0?K$2(`span`,{className:F?`${$} ${Tt}`:$,role:`status`,children:[it,F?K$2(A$1,{children:[` `,K$2(J$1,{type:`button`,variant:`secondary`,size:`s`,onClick:B,children:Et})]}):null]}):null]})]}),H.length>0?K$2(Me,{total:H.length,groups:Oe(U,H.map(e=>e.group)),value:C,onChange:w,onNew:()=>{T({kind:`new`,targets:[]});},onRename:e=>{T({kind:`rename`,name:e});},onDelete:e=>{T({kind:`delete`,name:e,count:H.filter(t=>t.group===e).length});},dragging:E!==null,onDropTo:e=>{E!==null&&K([E],e),D(null);},locked:b}):null]}),G.length===0?K$2(wn$1,{title:ot.title,...ot.description.length>0?{description:ot.description}:{},...H.length>0&&a.trim().length>0?{action:K$2(J$1,{variant:`secondary`,onClick:()=>{fe(``);},children:Qt})}:{}}):K$2(`div`,{className:l===`list`?`${tt} ${j}`:tt,"aria-label":Ft,children:G.map(e=>K$2(`div`,{className:M,...E===e.id?{"data-dragged":``}:{},draggable:!b,onDragStart:t=>{t.dataTransfer?.setData(rt,e.name),D(e.id);},onDragEnd:()=>{D(null);},children:[K$2(br,{collection:e,group:e.group===C?``:e.group??``,select:b?{selected:Re$1.includes(e.id),onToggle:()=>{Y(e.id);}}:null}),b?null:K$2(`div`,{className:N,children:[K$2(Ne,{groups:U,current:e.group??``,iconLabel:`${nt}${e.name}`,onMove:t=>{K([e.id],t);},onNew:()=>{T({kind:`new`,targets:[e.id]});}}),K$2(En$1,{label:`${vt}${e.name}`,onClick:()=>{k(e);},children:K$2(mt$1,{size:Sn})})]})]},e.id))}),K$2(Sn$1,{variant:`confirm`,open:Be,title:gt,message:ir(q.map(e=>e.name)),confirmLabel:Fe.delete,cancelLabel:Fe.cancel,confirmTone:`danger`,onConfirm:X,onClose:()=>{S(false);}}),K$2(Sn$1,{variant:`confirm`,open:O!==null,title:_t,message:O===null?``:ir([O.name]),confirmLabel:Fe.delete,cancelLabel:Fe.cancel,confirmTone:`danger`,onConfirm:()=>{O!==null&&(Ys(O.id),y(e=>e+1)),k(null);},onClose:()=>{k(null);}}),K$2(Ie,{request:Je,groups:U,countLabel:ar,onCreate:(e,t)=>{t.length>0?tl(t,e):nl(e),T(null),y(e=>e+1);},onRename:(e,t)=>{rl(e,t),C===e&&w(t),T(null),y(e=>e+1);},onDelete:e=>{il(e),C===e&&w(``),T(null),y(e=>e+1);},onClose:()=>{T(null);}}),K$2(xr,{open:ye,kind:d,name:f,query:h,error:_,errorField:ke$1,onClose:V,onKindChange:e=>{xe(e),v(``);},onNameChange:e=>{m(e);let t=e.trim().length>0?zn(e,G$1().collections):null;Me$1(W),v(t??``);},onQueryChange:e=>{g(e),v(``);},onSubmit:ut})]})}})}}));
System.register("./following-page-X6yD8OvD-C9JpxCRa.js", ['./___monkey.entry.js','./app-M32Uzb9f-DIm5OcM2.js','./filter-terms-uUxvUct3-DKlarcbS.js'],(function(exports){'use strict';var K$1,Wc,Yc,qc,ta,pt$1,ft$2,ie,ce,ae,oe,mt$1,yt$1,na,ra,Fe,$c,Qc,Xc,Zc,dl,G$1,al,Za,l,te,oo,xe,ol,ll,m,z$1,V$1,O$1,Me,B$1,tm,K$2,ft$1,J$1,$$1,Q$1,wn,A$1,Yr,Or,wr,oi,dt$1,P$1,DF,EF,jF,NF,Wn,Sn,ot$1,AF,En,mt$2,pt$2,X$1,kg,OF,MF,ze,Ne,Me$1,Oe,Ie,Be,ke,Le;return{setters:[function(module){K$1=module.bp;Wc=module.aJ;Yc=module.dq;qc=module.cc;ta=module.aE;pt$1=module.dr;ft$2=module.ds;ie=module.x;ce=module.y;ae=module.cw;oe=module.cr;mt$1=module.dt;yt$1=module.du;na=module.aF;ra=module.aG;Fe=module.bi;$c=module.dv;Qc=module.dw;Xc=module.dx;Zc=module.dy;dl=module.dz;G$1=module.G;al=module.dA;Za=module.aR;l=module.l;te=module.cO;oo=module.bL;xe=module.c7;ol=module.dB;ll=module.b6;m=module.m;},function(module){z$1=module.z;V$1=module.V;O$1=module.F;Me=module.aD;B$1=module.B;tm=module.an;K$2=module.K;ft$1=module.D;J$1=module.J;$$1=module.aE;Q$1=module.aF;wn=module.c;A$1=module.A;Yr=module.ao;Or=module.k;wr=module.w;oi=module.o;dt$1=module.ap;P$1=module.aG;DF=module.ar;EF=module.as;jF=module.at;NF=module.au;Wn=module.W;Sn=module.m;ot$1=module.P;AF=module.av;En=module.y;mt$2=module.C;pt$2=module.aA;X$1=module.aw;kg=module.aH;OF=module.aI;MF=module.aC;},function(module){ze=module.z;Ne=module.N;Me$1=module.M;Oe=module.O;Ie=module.I;Be=module.B;ke=module.k;Le=module.L;}],execute:(function(){exports("FollowingPage",hn);var et=`pageshow`,y=`rdw-following-page`,b=`rdw-following-sticky`,x=`rdw-following-toolbar`,S=`rdw-following-filter`,tt=`rdw-following-meta`,C=`rdw-following-grid`,w=`rdw-following-grid--list`,T=`rdw-artist-card`,E=`rdw-artist-card--selected`,D=`rdw-artist-card-link`,O=`rdw-artist-card-mark`,k=`rdw-artist-card-actions`,A=`rdw-artist-cover`,nt=`rdw-artist-cover-cell`,j=`rdw-artist-cover-image`,M=`rdw-artist-name-row`,N=`rdw-artist-name`,P=`rdw-artist-new`,F=`rdw-artist-caption`,rt=`rdw-following-progress`,it=`rdw-following-add-tag`,at=`Open Posts`,ot=`${ie}?${ce}=${ae}&s=${oe}`,st=`all`,ct=`new`,lt=`name`,I=`posts`,L=`added`,ut=`Show`,dt=`Sort`,R=`new`,ft=`Select`,pt=`Unfollow`,mt=`Unfollow…`,ht=`Refresh`,gt=`Read each artist's first page again: cover, post count, newest post`,_t=`Artist tags, separated by spaces`,vt=`Add artists`,z=`Follow artists`,yt=/\s+/,bt=`Close`,B=`not opened yet`,V=`no new posts since `,H=`post`,U=`posts`,xt=`+`,St=`No matching artists`,Ct=`Nothing matches this filter.`,wt=`Clear filter`;function Tt(e){return `No artists match \u201c${e.trim()}\u201d.`}var Et=`Unfollow artists`,Dt=`Refresh artists`,Ot=`Stopped at `,kt=`Refreshed `,At=`checkbox`,W=`en-US`,jt=`en-GB`,G=1,Mt=864e5,K=60,Nt=1500,Pt=2e3,Ft=1e3,q=2,It=14,J=44,Y=220,X=5,Lt=`rdw-following-toolbar-spacer`,Rt=`rdw-following-toolbar-count`,zt=`Filter by name`,Bt=`all`,Vt=`Type`,Ht=[{value:Bt,label:`All types`},{value:ta,label:`Artists`},{value:na,label:`Characters`},{value:ra,label:`Copyrights`}],Ut={[ta]:``,[na]:`character`,[ra]:`copyright`},Wt=`Move to a group: `,Z=`text/plain`,Gt=[{value:st,label:`All`},{value:ct,label:`New`}],Kt=[{value:lt,label:`By name`},{value:I,label:`By posts`},{value:L,label:`Recently followed`}],qt=`
.${y} {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.${x} {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: flex-end;
}
.${x} .${S} {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 100%;
  margin: 0;
}
/*
 * The caption over the sort list made the row taller than the one on
 * Collections. It stays for screen readers; the options say what they sort by.
 */
.${x} .rdw-select__label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
/* Starts short and grows with what is typed, up to the row. */
.${S} .rdw-field__input {
  field-sizing: content;
  width: ${String(Y)}px;
  min-width: ${String(Y)}px;
  max-width: 100%;
}
@supports (field-sizing: content) {
  .${S} .rdw-field__input {
    width: auto;
  }
}
/*
 * The row with the filter and the buttons stays at the top of the window
 * while the list scrolls under it.
 */
.${b} {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: sticky;
  top: ${Za};
  z-index: ${String(X)};
  padding-block: 8px;
  margin: -8px 0;
  background: var(--rdw-bg);
}
/* Custom theme: over the user's picture a bar of the page's colour from edge
   to edge is a black slab. The toolbar is a card there, like the tiles. */
:host-context(html[${l}="${te}"]) .${b} {
  margin: 0;
  padding: 8px 12px;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-l);
  background: color-mix(in srgb, var(--rdw-surface) 88%, transparent);
  backdrop-filter: blur(10px);
}
.${tt},
.${F} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 12px;
}
/* The count in the toolbar: level with the controls, never broken in two. */
.${Rt} {
  align-self: center;
  white-space: nowrap;
}
.${C} {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 12px;
}
/*
 * The tiles take the whole window, and so does the toolbar over them: its
 * filters start where the first tile starts and its actions end where the
 * last one ends. Kept to a centred column, the toolbar broke into two rows
 * with half the window free beside it. The list view stays centred.
 */
.${y} > :not(.${C}):not(.${b}),
.${w} {
  padding-inline: ${AF};
}
/* Between the filters and the actions: the actions stand at the right end. */
.${Lt} {
  flex: 1 1 auto;
}
/* List view: one artist per row, a small cover, the numbers on the right. */
.${w} {
  grid-template-columns: minmax(0, 1fr);
  gap: 4px;
}
.${w} .${T} {
  padding: 6px 8px;
}
.${w} .${D} {
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding-right: 40px;
}
.${w} .${A} {
  flex: none;
  width: ${String(J)}px;
}
.${w} .${M} {
  flex: 1 1 auto;
}
.${w} .${F} {
  flex: none;
}
.${w} .${k} {
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
}
.${w} .${O} {
  top: 50%;
  left: 17px;
  transform: translateY(-50%);
}
.${T} {
  position: relative;
  min-width: 0;
  box-sizing: border-box;
  padding: 8px;
  background: var(--rdw-surface);
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-l);
}
/* Under the pointer a card is only lighter. The accent frame is for the card
   the keyboard is in, and for a selected one: hover used to look selected. */
.${T}:hover {
  border-color: var(--rdw-muted);
  background: var(--rdw-surface-2);
}
/* The keyboard's focus only: a card clicked with the mouse keeps the focus
   too, and with ":focus-within" a card just unselected kept the frame of a
   selected one. */
.${T}:has(:focus-visible),
.${E} {
  border-color: var(--rdw-accent);
}
.${E},
.${E}:hover {
  box-shadow: 0 0 0 1px var(--rdw-accent);
  background: var(--rdw-accent-soft);
}
.${D} {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  color: var(--rdw-text);
  text-decoration: none;
  outline: none;
}
.${A} {
  display: grid;
  grid-template-columns: repeat(${String(q)}, minmax(0, 1fr));
  grid-template-rows: repeat(${String(q)}, minmax(0, 1fr));
  aspect-ratio: 1;
  gap: 2px;
  border-radius: var(--rdw-radius-m);
  overflow: hidden;
}
.${nt} {
  min-width: 0;
  min-height: 0;
  background: var(--rdw-surface-2);
}
.${j} {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.${M} {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}
.${N} {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}
.${P} {
  flex: none;
  padding: 0 6px;
  border-radius: 9px;
  background: var(--rdw-accent);
  color: var(--rdw-surface);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}
.${k} {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 4px;
}
/* With its menu open the corner of a card is over the cards after it. */
.${k}:has([aria-expanded="true"]) {
  z-index: 4;
}
.${k} .rdw-icon-btn {
  background: var(--rdw-surface);
  border: 1px solid var(--rdw-border);
}
/* The buttons of a card are there under the pointer, for the keyboard and
   while the menu is open: on every card at once they crowded the covers.
   Where there is no pointer to hover with, they stay. */
@media (hover: hover) {
  .${T}:not(:hover):not(:focus-within) .${k}:not(:has([aria-expanded="true"])) {
    opacity: 0;
  }
}
.${k} {
  transition: opacity 120ms ease;
}
/* The card that is being carried to a tab stays in its place, faded. */
.${T} {
  transition: opacity 160ms ease, transform 160ms ease;
}
.${T}[data-dragged] {
  opacity: 0.4;
  transform: scale(0.96);
}
@media (prefers-reduced-motion: reduce) {
  .${T},
  .${k} {
    transition: none;
  }
}
.${O} {
  position: absolute;
  top: 14px;
  left: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 22px;
  height: 22px;
  border: 2px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-surface);
  color: var(--rdw-surface);
}
.${E} .${O} {
  border-color: var(--rdw-accent);
  background: var(--rdw-accent);
}
.${rt} {
  display: flex;
  align-items: center;
  gap: 8px;
}
.${rt} .rdw-progress {
  flex: 1 1 auto;
}
`.trim();function Jt(e){return e===st||e===ct}function Yt(e,t=``){let n=e.group??``;return [Ut[qc(e)],n===t?``:n].filter(e=>e.length>0).join(` · `)}function Xt(e,t,n){return t!==Bt&&qc(e)!==t?false:ke(e.group,n)}function Zt(e,t){let n=t===G?`artist`:`artists`;return e===t?`${String(t)} ${n}`:`${String(e)} of ${String(t)} ${n}`}function Qt(e){return e===lt||e===I||e===L}function Q(e){return e.replaceAll(`_`,` `)}function $t(e,t){return e.localeCompare(t,void 0,{sensitivity:`base`})}function $(){return [...G$1().artists]}function en(e,t){return t>0&&(e.lastPostId??0)>t}function tn(e,t){let n=e.lastPostSince;return n===void 0||t-n<K*Mt?null:n}function nn(e){let t=e.postCount;if(t===void 0)return B;let n=t.value.toLocaleString(W);return t.exact?`${n} ${t.value===G?H:U}`:`${n}${xt} ${U}`}function rn(e){return new Date(e).toLocaleDateString(jt,{day:`numeric`,month:`short`,year:`numeric`})}function an(e,t){let n=[...e].sort((e,t)=>$t(e.tag,t.tag));return t===I?n.sort((e,t)=>(t.postCount?.value??-1)-(e.postCount?.value??-1)):t===L&&n.sort((e,t)=>(t.addedAt??0)-(e.addedAt??0)),n}function on(e){return `Unfollow ${Q(e)}? This cannot be undone.`}function sn(e){return e.duplicates===0&&e.invalid===0?``:e.added===0&&e.invalid===0?Fe.artistDuplicate:e.added===0&&e.duplicates===0?Fe.artistInvalid:`Added ${String(e.added)}, already followed ${String(e.duplicates)}, invalid ${String(e.invalid)}.`}function cn(e){return e===G?`Unfollow 1 artist? This cannot be undone.`:`Unfollow ${String(e)} artists? This cannot be undone.`}function ln(e){let t=Math.ceil(e*Nt/Ft);return `This makes ${e===G?`1 request`:`${String(e)} requests`} to the site, one every ${String(Nt/Ft)} seconds (about ${String(t)} s). It stops at the first error.`}function un(e){return new Promise(t=>{window.setTimeout(t,e);})}function dn(e){let[t,n]=z$1(null);return t===e.url?null:K$2(`img`,{className:j,src:e.url,alt:``,loading:`lazy`,onError:()=>{n(e.url);}})}function fn(e){let t=e.artist.cover??[],n=[];for(let e=0;e<4;e+=1){let r=t[e];n.push(K$2(`span`,{className:nt,children:r===void 0?null:K$2(dn,{url:r})},e));}return K$2(`span`,{className:A,children:n})}function pn(e){let{artist:t,select:r}=e,a=Yt(t,e.openTab),o=tn(t,e.now),c=K$2(A$1,{children:[K$2(fn,{artist:t}),K$2(`span`,{className:M,children:[K$2(`span`,{className:N,title:t.tag,children:Q(t.tag)}),e.hasNew?K$2(`span`,{className:P,children:R}):null]}),K$2(`span`,{className:F,children:nn(t)}),a.length>0?K$2(`span`,{className:F,children:a}):null,o===null?null:K$2(`span`,{className:F,children:`${V}${rn(o)}`})]}),l=oo([{tag:t.tag,type:xe}]);return r===null?K$2(`div`,{className:T,"data-tag":t.tag,...e.dragged?{"data-dragged":``}:{},draggable:true,onDragStart:n=>{n.dataTransfer?.setData(Z,t.tag),e.onDragStart();},onDragEnd:e.onDragEnd,children:[K$2(`a`,{className:D,href:l,draggable:false,children:c}),K$2(`div`,{className:k,children:[K$2(Ne,{groups:e.groups,current:t.group??``,iconLabel:`${Wt}${t.tag}`,onMove:e.onMove,onNew:e.onNewGroup}),K$2(En,{label:`Unfollow ${t.tag}`,onClick:e.onUnfollow,children:K$2(mt$2,{size:It})})]})]}):K$2(`div`,{className:r.selected?`${T} ${E}`:T,"data-tag":t.tag,children:[K$2(`a`,{className:D,href:l,role:At,"aria-checked":r.selected,"aria-label":t.tag,onClick:e=>{e.preventDefault(),r.onToggle();},children:c}),K$2(`span`,{className:O,"aria-hidden":`true`,children:r.selected?K$2(pt$2,{size:It}):null})]})}function mn(e){return K$2(Sn,{variant:`content`,open:e.open,onClose:e.onClose,title:z,children:K$2(`form`,{className:`rdw-dialog__fields`,onSubmit:t=>{t.preventDefault(),e.onSubmit();},children:[K$2(ot$1,{id:it,label:_t,value:e.draft,suggestions:e.suggestions,replaceOnSelect:false,onChange:e.onDraftChange,onSelect:t=>{e.onSuggestionSelect(t.value);}}),e.error.length>0?K$2(`p`,{className:`rdw-error`,role:`alert`,children:e.error}):null,K$2(`div`,{className:`rdw-dialog__actions`,children:[K$2(J$1,{type:`button`,variant:`secondary`,size:`s`,onClick:e.onClose,children:Fe.cancel}),K$2(J$1,{type:`submit`,variant:`primary`,size:`s`,children:Fe.artistAdd})]})]})})}function hn(){let[e,n]=z$1(()=>$()),[i,ee]=z$1(``),[te,se]=z$1(st),[le,ue]=z$1(lt),[de,ve]=z$1(()=>MF(OF)),[p,m$1]=z$1(``),[h,g]=z$1(``),[Ee,_]=z$1(false),[Fe$1,v]=z$1([]),[T,E]=z$1(false),[D,O]=z$1(Bt),[k,A]=z$1(``),[nt,j]=z$1(null),[M,N]=z$1(null),[P,F]=z$1([]),[it,I]=z$1(false),[L,R]=z$1(null),[_t,z]=z$1(false),[B,V]=z$1(null),H=V$1(false),U=V$1(O$1({preferType:Me}));B$1(()=>{let e=U.current,t=()=>{K$1(),n($());};return window.addEventListener(et,t),()=>{window.removeEventListener(et,t),e.cancel(),H.current=true;}},[]);let xt=B?.succeeded===true;B$1(()=>{if(!xt)return;let e=window.setTimeout(()=>{V(null);},Pt);return ()=>{window.clearTimeout(e);}},[xt]);let At=()=>{let e=p.split(yt).filter(e=>e.length>0);if(e.length===0){g(Fe.artistInvalid);return}let t=al(e),r=sn(t);g(r),t.added>0&&m$1(``),r.length===0&&_(false),v([]),U.current.cancel(),n($());},W=Wc(),jt=Date.now(),G=ze(i,Le),Mt=e=>te===ct&&!en(e,W)||!Xt(e,D,k)?false:Be([e.tag],G),K=Yc(),Ft=e.some(e=>qc(e)!==ta),q=(e,t)=>{Xc(e,t),n($());},J=an(e,le).filter(Mt),Y=J.filter(e=>P.includes(e.tag)),X=e.length,Ut=X===0,Wt=B!==null&&B.running,Z=()=>{E(false),F([]),I(false);};tm(T,Z);let Yt=e=>{F(t=>t.includes(e)?t.filter(t=>t!==e):[...t,e]);},Q=()=>{ol(Y.map(e=>e.tag)),Z(),n($());},$t=async e=>{H.current=false;let t=e.length;V({done:0,total:t,running:true,message:``});let r=0;for(let i of e){if(H.current||r>0&&(await un(Nt),H.current))break;try{X$1(P$1),ll(i.tag,await kg(i.tag));}catch(e){let a=e instanceof Error?e.message:String(e);m.warn(`following: refresh failed`,i.tag,e),n($()),V({done:r,total:t,running:false,message:`${Ot}${i.tag}: ${a}`});return}r+=1,n($()),V({done:r,total:t,running:true,message:``});}V({done:r,total:t,running:false,message:`${kt}${String(r)} of ${String(t)}`,succeeded:true});},tn=()=>{_(false),g(``),v([]),U.current.cancel();},nn=K$2(J$1,{variant:`primary`,onClick:()=>{_(true);},children:[K$2(ft$1,{size:It}),vt]}),rn=K$2(mn,{open:Ee,onClose:tn,draft:p,error:h,suggestions:Fe$1,onDraftChange:e=>{m$1(e),h.length>0&&g(``);let t=Q$1(e);t===null?(U.current.cancel(),v([])):U.current.query(t.stem,v);},onSuggestionSelect:e=>{m$1($$1(p,e)),U.current.cancel(),v([]);},onSubmit:At});return K$2(`div`,{className:y,children:[K$2(`style`,{children:qt}),Ut?K$2(wn,{title:ft$2,description:pt$1,action:K$2(A$1,{children:[nn,K$2(J$1,{variant:`secondary`,onClick:()=>{window.location.assign(ot);},children:at})]})}):K$2(A$1,{children:[K$2(`div`,{className:b,children:[T?K$2(Yr,{count:Y.length,onSelectAll:()=>{F(J.map(e=>e.tag));},onClear:()=>{F([]);},onCancel:Z,danger:K$2(J$1,{variant:`danger-quiet`,disabled:Y.length===0,onClick:()=>{I(true);},children:mt}),children:K$2(Ne,{groups:K,disabled:Y.length===0,onMove:e=>{q(Y.map(e=>e.tag),e);},onNew:()=>{j({kind:`new`,targets:Y.map(e=>e.tag)});}})}):K$2(`div`,{className:x,children:[K$2(Or,{label:ut,options:Gt,value:te,onChange:e=>{Jt(e)&&se(e);}}),K$2(wr,{id:yt$1,className:S,value:i,placeholder:zt,"aria-label":mt$1,onChange:ee}),K$2(oi,{label:dt,options:Kt,value:le,onChange:e=>{Qt(e)&&ue(e);}}),Ft?K$2(oi,{label:Vt,options:Ht,value:D,onChange:O}):null,K$2(dt$1,{scope:P$1}),K$2(Or,{label:EF,options:DF,value:de,onChange:e=>{jF(e)&&(NF(OF,e),ve(e));}}),K$2(`span`,{className:`${tt} ${Rt}`,children:`${Zt(J.length,X)} · ${W>0?`${Fe.seenUpTo}${String(W)}`:Fe.seenNothing}`}),K$2(`span`,{className:Lt,"aria-hidden":`true`}),K$2(A$1,{children:[K$2(J$1,{variant:`secondary`,disabled:Wt,onClick:()=>{E(true);},children:ft}),K$2(J$1,{variant:`secondary`,title:gt,disabled:Wt||J.length===0,onClick:()=>{z(true);},children:ht}),nn]})]}),K$2(Me$1,{total:X,groups:Oe(K,e.map(e=>e.group)),value:k,onChange:A,onNew:()=>{j({kind:`new`,targets:[]});},onRename:e=>{j({kind:`rename`,name:e});},onDelete:t=>{j({kind:`delete`,name:t,count:e.filter(e=>e.group===t).length});},dragging:M!==null,onDropTo:e=>{M!==null&&q([M],e),N(null);},locked:T})]}),B===null?null:K$2(`div`,{className:rt,role:`status`,children:[K$2(Wn,{value:B.total===0?0:B.done/B.total,label:B.running?`${ht}: ${String(B.done)} of ${String(B.total)}`:B.message}),B.running?K$2(J$1,{variant:`secondary`,size:`s`,onClick:()=>{H.current=true;},children:Fe.cancel}):K$2(J$1,{variant:`secondary`,size:`s`,onClick:()=>{V(null);},children:bt})]}),J.length===0?i.trim().length>0?K$2(wn,{title:Tt(i),action:K$2(J$1,{variant:`secondary`,onClick:()=>{ee(``);},children:wt})}):K$2(wn,{title:St,description:Ct}):K$2(`div`,{className:de===`list`?`${C} ${w}`:C,children:J.map(e=>K$2(pn,{artist:e,hasNew:en(e,W),now:jt,select:T?{selected:P.includes(e.tag),onToggle:()=>{Yt(e.tag);}}:null,onUnfollow:()=>{R(e.tag);},groups:K,openTab:k,onMove:t=>{q([e.tag],t);},onNewGroup:()=>{j({kind:`new`,targets:[e.tag]});},onDragStart:()=>{N(e.tag);},onDragEnd:()=>{N(null);},dragged:M===e.tag},e.tag))})]}),rn,K$2(Ie,{request:nt,groups:K,countLabel:e=>Zt(e,e),onCreate:(e,t)=>{t.length>0?Xc(t,e):Zc(e),j(null),n($());},onRename:(e,t)=>{Qc(e,t),k===e&&A(t),j(null),n($());},onDelete:e=>{$c(e),k===e&&A(``),j(null),n($());},onClose:()=>{j(null);}}),K$2(Sn,{variant:`confirm`,open:it,title:Et,message:cn(Y.length),confirmLabel:pt,cancelLabel:Fe.cancel,confirmTone:`danger`,onConfirm:Q,onClose:()=>{I(false);}}),K$2(Sn,{variant:`confirm`,open:L!==null,title:pt,message:on(L??``),confirmLabel:pt,cancelLabel:Fe.cancel,confirmTone:`danger`,onConfirm:()=>{L!==null&&(dl(L),n($())),R(null);},onClose:()=>{R(null);}}),K$2(Sn,{variant:`confirm`,open:_t,title:Dt,message:ln(J.length),confirmLabel:ht,cancelLabel:Fe.cancel,onConfirm:()=>{z(false),$t(J);},onClose:()=>{z(false);}})]})}})}}));
System.register("./filter-terms-uUxvUct3-DKlarcbS.js", ['./app-M32Uzb9f-DIm5OcM2.js'],(function(exports){'use strict';var z$1,ze$1,Gt,V$1,K$1,J$1,ht,En,Bn,pt,B$1,Ie$1,Ot,ft,Sn,qt,A$1;return{setters:[function(module){z$1=module.z;ze$1=module.aJ;Gt=module.aK;V$1=module.V;K$1=module.K;J$1=module.J;ht=module.aL;En=module.y;Bn=module.aM;pt=module.aA;B$1=module.B;Ie$1=module.I;Ot=module.aN;ft=module.D;Sn=module.m;qt=module.q;A$1=module.A;}],execute:(function(){exports({B:Be,I:Ie,M:Me,N:Ne,O:Oe,k:ke,z:ze});var _=`\0none`,ee=`Groups`,v=`No group`,te=`New group`,y=`New group…`,b=`Move to group`,ne=`Actions of the group `,re=`Group options`,ie=`Rename…`,x=`Rename group`,S=`Delete`,ae=`Delete group…`,oe=`Delete group`,C=`Group name`,w=`Create`,T=`Save`,E=`Cancel`,se=`There is a group with this name already.`,ce=`More`,D=`Find a group`,O=`No group with this name.`,k=`…`,A=28,le=`resize`,ue=`ArrowDown`,j=`ArrowUp`,de=`Enter`,M=`rdw-groups`,N=`rdw-groups__tab`,P=`rdw-groups__item`,F=`rdw-groups__count`,fe=`rdw-groups__item--over`,I=`rdw-groups__item--drop`,L=`rdw-groups__item--landed`,R=`rdw-groups--dragging`,z=`rdw-groups__more`,pe=`rdw-groups__new`,B=`rdw-groups__measure`,V=`rdw-groups-menu__box`,H=`rdw-groups-menu__list`,U=`rdw-groups-menu__count`,W=`rdw-groups-menu__empty`,G=`rdw-groups-name__count`,K=`[role="menuitem"]:not(:disabled)`,q=`input, ${K}`,me=`[role="tab"]`,he=`ArrowLeft`,ge=`ArrowRight`,J=`rdw-groups-menu`,Y=`rdw-groups-menu__item`,X=`rdw-groups-menu__rule`,Z=`rdw-groups-menu--in-place`,_e=`rdw-groups-menu--end`,ve=`rdw-groups-menu__tick`,ye=`rdw-groups-move`,be=`rdw-groups-name`,xe=`rdw-groups-name__error`,Se=`rdw-groups-name__actions`,Ce=220,we=160,Q=14,Te=`
/* Tabs as in the header of the site (the designer's mock-up, 18.11.2026):
   words with no frames, a line under the row, a thicker one under the open tab. */
.${M} {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  position: relative;
  column-gap: ${String(A)}px;
  min-width: 0;
  border-bottom: 1px solid var(--rdw-border);
}
.${M}[inert] {
  opacity: 0.45;
}
.${P} {
  position: relative;
  display: inline-flex;
  align-items: center;
  margin-bottom: -1px;
  border-bottom: 2px solid transparent;
  transition: border-color 120ms ease, background-color 120ms ease, transform 120ms ease;
}
.${P}[data-selected="true"] {
  border-bottom-color: var(--rdw-accent);
}
.${N} {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 0 9px;
  border: 0;
  background: transparent;
  color: var(--rdw-muted);
  font: inherit;
  font-size: 13px;
  font-weight: 400;
  cursor: pointer;
  white-space: nowrap;
}
.${P}[data-none] .${N} {
  opacity: 0.8;
}
.${N}:hover,
.${P}[data-selected="true"] .${N} {
  color: var(--rdw-text);
  opacity: 1;
}
.${P}[data-selected="true"] .${N} {
  font-weight: 600;
}
.${F} {
  color: var(--rdw-muted);
  font-size: 12px;
  font-weight: 400;
}
/* The button of a group's own actions stands in the gap after its tab. Only
   the open group has it, and there it is always seen (the designer,
   18.11.2026): a group is renamed or deleted when it is open, and one button
   in the row is no noise. Hidden until the pointer came, it was not found. */
.${P} .${z} {
  position: absolute;
  left: 100%;
  top: 50%;
  z-index: 1;
  min-width: 20px;
  min-height: 20px;
  width: 20px;
  height: 20px;
  margin-left: 4px;
  transform: translateY(-50%);
  border: 0;
  background: var(--rdw-surface-2);
  color: var(--rdw-muted);
}
.${P} .${z}:hover,
.${P} .${z}[aria-expanded="true"] {
  color: var(--rdw-text);
}
/* Every group once more, unseen: by these it is counted how many fit the row. */
.${B} {
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  visibility: hidden;
  pointer-events: none;
  height: 0;
  overflow: hidden;
}
.${B} > * {
  flex: none;
}
.${pe} {
  display: inline-flex;
  align-items: center;
  margin-left: auto;
  padding-bottom: 2px;
}
/* While a card is carried, the tabs that take it say so, and the one under
   it comes forward; the tab that took it nods once. */
.${R} .${I} {
  border-bottom-style: dashed;
  border-bottom-color: var(--rdw-accent);
  animation: rdw-groups-wait 900ms ease-in-out infinite alternate;
}
.${R} .${I} .${N} {
  color: var(--rdw-text);
}
.${R} .${I}.${fe} {
  border-bottom-style: solid;
  background: var(--rdw-accent-soft);
  box-shadow: 0 0 0 6px var(--rdw-accent-soft);
  border-radius: var(--rdw-radius-s);
  transform: scale(1.08);
  animation: none;
}
.${L} {
  animation: rdw-groups-land 320ms ease-out;
}
@keyframes rdw-groups-wait {
  from { opacity: 0.6; }
  to { opacity: 1; }
}
@keyframes rdw-groups-land {
  0% { transform: scale(1.08); }
  45% { transform: scale(0.94); }
  100% { transform: scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .${P},
  .${R} .${I},
  .${L} {
    animation: none;
    transition: none;
  }
}
.${ye} {
  position: relative;
  display: inline-flex;
}
`,Ee=`
.${J} {
  padding: 4px;
  gap: 0;
}
/*
 * An own page hides everything of the body but itself, so a menu drawn in the
 * body would not be seen there: it is drawn under its button instead, as the
 * dialogs and the lists of an own page are drawn inside the page.
 */
.${J}.${Z} {
  top: calc(100% + 4px);
  left: 0;
  box-sizing: border-box;
  width: max-content;
  min-width: ${String(we)}px;
  max-width: ${String(Ce)}px;
}
.${J}.${Z}.${_e} {
  left: auto;
  right: 0;
}
.${Y} {
  display: flex;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  width: 100%;
  min-height: 28px;
  padding: 0 8px;
  border: 0;
  border-radius: var(--rdw-radius-s);
  background: transparent;
  color: var(--rdw-text);
  font: 12px/1.35 var(--rdw-font);
  text-align: left;
  cursor: pointer;
}
.${Y} > span:first-of-type {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.${V} {
  display: grid;
  gap: 4px;
  min-width: 0;
}
.${H} {
  display: grid;
  max-height: 320px;
  overflow-y: auto;
}
.${U} {
  flex: none;
  color: var(--rdw-muted);
}
.${W} {
  margin: 0;
  padding: 6px 8px;
  color: var(--rdw-muted);
}
.${Y}:hover:not(:disabled),
.${Y}:focus-visible {
  background: var(--rdw-surface-2);
}
.${Y}:disabled {
  cursor: default;
  font-weight: 600;
}
.${Y}[data-tone="danger"] {
  color: var(--rdw-danger);
}
.${ve} {
  flex: none;
  display: inline-flex;
  color: var(--rdw-accent);
}
.${X} {
  height: 1px;
  margin: 4px 0;
  background: var(--rdw-border);
}
`,De=`
.${be} {
  display: grid;
  gap: 8px;
  min-width: 260px;
}
.${G} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 11px;
  text-align: right;
}
.${xe} {
  margin: 0;
  color: var(--rdw-danger);
  font-size: 12px;
}
.${Se} {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
`;function Oe(e,t){let n=new Map;for(let e of t)e!==void 0&&e.length>0&&n.set(e,(n.get(e)??0)+1);return e.map(e=>({name:e,count:n.get(e)??0}))}function ke(e,t){if(t===``)return  true;let n=e??``;return t===`\0none`?n.length===0:n===t}function $(e){return e.length>20?`${e.slice(0,20)}${k}`:e}function Ae(e,t,n,r,i){let a=e.map((e,t)=>t);if(e.reduce((e,t)=>e+t+i,0)<=n)return a;let o=n-r-i,s=[];for(let t of a){let n=(e[t]??0)+i;if(n>o)break;s.push(t),o-=n;}if(t>=0&&t<e.length&&!s.includes(t)){let n=(e[t]??0)+i;for(;s.length>0&&o<n;){let t=s.pop();o+=(t===void 0?0:e[t]??0)+i;}s.push(t);}return s}function je(t){let[n,r]=z$1(``),i=V$1(null),s=V$1(null),{searchable:c}=t;B$1(()=>{if(c){s.current?.focus();return}let e=i.current?.querySelector(K);e instanceof HTMLElement&&e.focus();},[c]);let l=n.trim().toLowerCase(),f=l.length===0?t.entries:t.entries.filter(e=>e.label.toLowerCase().includes(l));return K$1(`div`,{className:V,ref:i,onKeyDown:e=>{let t=i.current;if(t===null)return;if(e.key===de&&e.target instanceof HTMLInputElement){let n=t.querySelector(`.${H} ${K}`);n instanceof HTMLElement&&(e.preventDefault(),n.click());return}let n=e.key===ue?1:e.key===j?-1:0;if(n===0)return;let r=[...t.querySelectorAll(q)];if(r.length===0)return;let a=r[((e.target instanceof Element?r.indexOf(e.target):-1)+n+r.length)%r.length];a instanceof HTMLElement&&(e.preventDefault(),a.focus());},children:[c?K$1(qt,{value:n,placeholder:D,"aria-label":D,inputRef:s,onChange:r}):null,K$1(`div`,{className:H,children:[f.map(t=>K$1(`button`,{type:`button`,role:`menuitem`,className:`${Y} rdw-kit-focusable`,disabled:t.current===true,onClick:t.onPick,children:[K$1(`span`,{children:t.label}),t.count===void 0?null:K$1(`span`,{className:U,children:String(t.count)}),t.current===true?K$1(`span`,{className:ve,"aria-hidden":`true`,children:K$1(pt,{size:Q})}):null]},t.key)),f.length===0&&l.length>0?K$1(`p`,{className:W,children:O}):null]}),t.children]})}function Me(e){let[r,a]=z$1(null),[s,y]=z$1(null),[b,x]=z$1(null),[S,oe]=z$1(null),[C,w]=z$1(false),T=V$1(null),E=V$1(null),se=V$1(null),D=ze$1(Gt),O=V$1(null);O.current=s?.anchor??null;let k=e.dragging===true;B$1(()=>{k||a(null);},[k]);let ue=e.groups.reduce((e,t)=>e+t.count,0),j=e.groups.map(e=>`${e.name}\u0000${String(e.count)}`).join(``),{value:de,total:V}=e;Ie$1(()=>{let e=T.current,t=E.current;if(e===null||t===null)return;let n=()=>{let n=j.length===0?[]:j.split(``).map(e=>e.split(`\0`)[0]??``),r=[...t.querySelectorAll(`[data-measure]`)].map(e=>e instanceof HTMLElement?e.offsetWidth:0),i=t.querySelector(`[data-measure-more]`),a=e.clientWidth;for(let t of e.querySelectorAll(`[data-fixed]`))a-=(t instanceof HTMLElement?t.offsetWidth:0)+A;let o=e.clientWidth===0?r.map((e,t)=>t):Ae(r,n.indexOf(de),a,i instanceof HTMLElement?i.offsetWidth:0,A),s=o.length===n.length?null:o.map(e=>n[e]??``);oe(e=>(e===null?``:e.join(``))===(s===null?``:s.join(``))&&e===null==(s===null)?e:s);};n(),window.addEventListener(le,n);let r=typeof ResizeObserver>`u`?null:new ResizeObserver(n);return r?.observe(e),()=>{window.removeEventListener(le,n),r?.disconnect();}},[j,de,V]);let H=S===null?e.groups:S.flatMap(t=>e.groups.filter(e=>e.name===t)),U=S===null?[]:e.groups.filter(e=>!S.includes(e.name)),W=(t,n)=>k&&e.onDropTo!==void 0?{onDragOver:e=>{e.preventDefault();let n=e.dataTransfer??void 0;n!==void 0&&(n.dropEffect=`move`),a(t);},onDragLeave:()=>{a(e=>e===t?null:e);},onDrop:r=>{r.preventDefault(),a(null),x(t),e.onDropTo?.(n);}}:{},G=(t,n,r)=>K$1(`button`,{type:`button`,role:`tab`,className:`${N} rdw-kit-focusable`,"aria-selected":e.value===t,...$(n)===n?{}:{title:n},onClick:()=>{e.onChange(t);},children:[$(n),K$1(`span`,{className:F,children:String(r)})]}),K=e=>[P,I,r===e?fe:``,b===e?L:``].filter(e=>e.length>0).join(` `),q=e=>b===e?{onAnimationEnd:()=>{x(null);}}:{},X=e=>{let t=e.key===ge?1:e.key===he?-1:0,n=e.target;if(t===0||!(n instanceof HTMLElement)||!n.matches(me))return;let r=e.currentTarget;if(!(r instanceof HTMLElement))return;let i=[...r.querySelectorAll(me)],a=i[i.indexOf(n)+t];a instanceof HTMLElement&&(e.preventDefault(),a.focus(),a.click());},_e=t=>K$1(Bn,{open:true,onClose:()=>{y(null);},anchorRef:O,...D?{}:{widthPx:we},role:`menu`,"aria-label":`${ne}${t}`,className:D?`${J} ${Z}`:J,children:[K$1(`style`,{children:Ee}),K$1(`button`,{type:`button`,role:`menuitem`,className:`${Y} rdw-kit-focusable`,onClick:()=>{y(null),e.onRename(t);},children:K$1(`span`,{children:ie})}),K$1(`button`,{type:`button`,role:`menuitem`,className:`${Y} rdw-kit-focusable`,"data-tone":`danger`,onClick:()=>{y(null),e.onDelete(t);},children:K$1(`span`,{children:ae})})]});return K$1(`div`,{className:k?`${M} ${R}`:M,ref:T,role:`tablist`,"aria-label":ee,onKeyDown:X,...e.locked===true?{inert:true}:{},children:[K$1(`style`,{children:Te}),K$1(`span`,{className:B,ref:E,"aria-hidden":`true`,children:[e.groups.map(e=>K$1(`span`,{className:N,"data-measure":``,children:[$(e.name),K$1(`span`,{className:F,children:String(e.count)})]},e.name)),K$1(`span`,{className:N,"data-measure-more":``,children:[`${ce} (${String(e.groups.length)})`,K$1(ht,{size:Q})]})]}),K$1(`span`,{className:P,"data-selected":String(e.value===``),"data-fixed":``,children:G(``,`All`,e.total)}),H.map(t=>K$1(`span`,{className:K(t.name),"data-selected":String(e.value===t.name),"data-group":t.name,onContextMenu:e=>{e.preventDefault();let n=e.currentTarget;y({name:t.name,anchor:n});},...W(t.name,t.name),...q(t.name),children:[G(t.name,t.name,t.count),e.value===t.name?K$1(En,{className:z,label:re,menuOpen:s?.name===t.name,onClick:e=>{let n=e.currentTarget;y(e=>e?.name===t.name?null:{name:t.name,anchor:n});},children:K$1(Ot,{size:Q})}):null,s?.name===t.name?_e(t.name):null]},t.name)),U.length>0?K$1(`span`,{className:P,"data-selected":`false`,"data-more":``,children:[K$1(`button`,{type:`button`,className:`${N} rdw-kit-focusable`,"aria-haspopup":`menu`,"aria-expanded":C,ref:se,onClick:()=>{w(e=>!e);},children:[`${ce} (${String(U.length)})`,K$1(ht,{size:Q})]}),C?K$1(Bn,{open:true,onClose:()=>{w(false);},anchorRef:se,...D?{}:{widthPx:Ce},role:`menu`,"aria-label":ee,className:D?`${J} ${Z}`:J,children:[K$1(`style`,{children:Ee}),K$1(je,{searchable:e.groups.length>10,entries:U.map(t=>({key:t.name,label:t.name,count:t.count,onPick:()=>{w(false),e.onChange(t.name);}}))})]}):null]}):null,e.groups.length>0?K$1(`span`,{className:K(_),"data-selected":String(e.value===_),"data-fixed":``,"data-none":``,...W(_,null),...q(_),children:G(_,v,e.total-ue)}):null,K$1(`span`,{className:pe,"data-fixed":``,children:K$1(J$1,{variant:`ghost`,onClick:e.onNew,children:[K$1(ft,{size:Q}),te]})})]})}function Ne(r){let[a,s]=z$1(false),l=ze$1(Gt),u=V$1(null),f=r.current??``,h=e=>{s(false),e();},_=()=>{s(e=>!e);};return K$1(`span`,{className:ye,children:[r.iconLabel===void 0?K$1(J$1,{variant:`secondary`,disabled:r.disabled===true,buttonRef:u,onClick:_,children:[b,K$1(ht,{size:Q})]}):K$1(En,{label:r.iconLabel,menuOpen:a,disabled:r.disabled===true,buttonRef:u,onClick:_,children:K$1(Pe,{})}),K$1(Bn,{open:a,onClose:()=>{s(false);},anchorRef:u,...l?{}:{widthPx:Ce,alignEnd:true},role:`menu`,"aria-label":b,className:l?`${J} ${Z} ${_e}`:J,children:[K$1(`style`,{children:Ee}),K$1(je,{searchable:r.groups.length>10,entries:r.groups.map(e=>({key:e,label:e,current:e===f,onPick:()=>{h(()=>{r.onMove(e);});}})),children:[r.groups.length>0?K$1(`div`,{className:X,"aria-hidden":`true`}):null,r.groups.length>0?K$1(`button`,{type:`button`,role:`menuitem`,className:`${Y} rdw-kit-focusable`,disabled:r.current!==void 0&&f.length===0,onClick:()=>{h(()=>{r.onMove(null);});},children:[K$1(`span`,{children:v}),r.current!==void 0&&f.length===0?K$1(`span`,{className:ve,"aria-hidden":`true`,children:K$1(pt,{size:Q})}):null]}):null,K$1(`button`,{type:`button`,role:`menuitem`,className:`${Y} rdw-kit-focusable`,onClick:()=>{h(r.onNew);},children:K$1(`span`,{children:y})})]},String(a))]})]})}function Pe(){return K$1(`svg`,{width:Q,height:Q,viewBox:`0 0 24 24`,fill:`none`,stroke:`currentColor`,"stroke-width":`2`,"stroke-linecap":`round`,"stroke-linejoin":`round`,"aria-hidden":`true`,children:[K$1(`path`,{d:`M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z`}),K$1(`path`,{d:`M10 13h6`}),K$1(`path`,{d:`M13.5 10.5 16 13l-2.5 2.5`})]})}function Fe(e,t,n){let r=`Delete the group “${e}”?`;return n===0?`${r} Nothing is in it.`:`${r} Its ${t} ${n===1?`goes`:`go`} to ${v}; nothing else is deleted.`}function Ie(e){let{request:t}=e,[n,i]=z$1(``),c=t!==null&&t.kind!==`delete`,l=t!==null&&t.kind===`rename`?t.name:``;B$1(()=>{c&&i(l);},[c,l]);let d=n.trim(),f=d.length>0&&d!==l&&e.groups.includes(d),h=d.length>0&&d!==l&&!f,g=()=>{h&&t!==null&&(t.kind===`new`?e.onCreate(d,t.targets):t.kind===`rename`&&e.onRename(t.name,d));};return K$1(A$1,{children:[K$1(Sn,{open:c,title:t!==null&&t.kind===`rename`?x:te,onClose:e.onClose,children:[K$1(`style`,{children:De}),K$1(`form`,{className:be,onSubmit:e=>{e.preventDefault(),g();},children:[K$1(qt,{value:n,placeholder:C,"aria-label":C,inputAttrs:{maxLength:40},onChange:e=>{i(e.slice(0,40));}}),K$1(`p`,{className:G,children:`${String(n.length)} / 40`}),f?K$1(`p`,{className:xe,role:`alert`,children:se}):null,K$1(`div`,{className:Se,children:[K$1(J$1,{type:`button`,variant:`secondary`,size:`s`,onClick:e.onClose,children:E}),K$1(J$1,{type:`submit`,variant:`primary`,size:`s`,disabled:!h,children:t!==null&&t.kind===`rename`?T:w})]})]})]}),K$1(Sn,{variant:`confirm`,open:t!==null&&t.kind===`delete`,title:oe,message:t!==null&&t.kind===`delete`?Fe(t.name,e.countLabel(t.count),t.count):``,confirmLabel:S,cancelLabel:E,confirmTone:`danger`,onConfirm:()=>{t!==null&&t.kind===`delete`&&e.onDelete(t.name);},onClose:e.onClose})]})}var Le=/[\s,]+/,Re=/,/; exports({L:Le,R:Re});function ze(e,t){return e.toLowerCase().split(t).map(e=>e.trim()).filter(e=>e.length>0)}function Be(e,t){if(t.length===0)return  true;let n=e.map(e=>e.toLowerCase());return t.some(e=>n.some(t=>t.includes(e)))}})}}));
System.register("./stats-section-Dir8yRE7-BLRMW4oY.js", ['./app-M32Uzb9f-DIm5OcM2.js','./___monkey.entry.js','./format-date-CpY7IdAY-BzMD4ndT.js'],(function(exports){'use strict';var K$1,lt$1,z$1,B$1,J$1,g$1,Ic,dt$1,Cs,G$1,Wa,Ic$1,A$1,E$1,N$1,T$1,Lc,D$1,be$1,ie,ce$1,n,r;return{setters:[function(module){K$1=module.K;lt$1=module.l;z$1=module.z;B$1=module.B;J$1=module.J;g$1=module.aO;Ic=module.aP;},function(module){dt$1=module.bY;Cs=module.C;G$1=module.G;Wa=module.dl;Ic$1=module.e;A$1=module.A;E$1=module.E;N$1=module.N;T$1=module.T;Lc=module.L;D$1=module.D;be$1=module.Z;ie=module.x;ce$1=module.y;},function(module){n=module.n;r=module.r;}],execute:(function(){exports("StatsPage",ft);var h=`profile-stats`,ce=1500,g=`account`,le=`home`,ue=`profile`,_=`div#user-index h4 > a[href*="s=profile"]`,de=`table.highlightable tr`,fe=`:scope > td`,pe=/^\d{4}-\d{2}-\d{2}$/,me=/^\d+$/,he=`Join Date`,ge=`Level`,v=`Posts`,_e=`Deleted Posts`,ve=`Comments`,ye=`Tag Edits`,be=`Note Edits`,xe=`Forum Posts`,Se=`No profile link on My Account. Log in to the site first.`,Ce=`The profile page has no table to read.`,y=N$1(D$1()),b=A$1({joinDate:N$1(T$1()),level:N$1(T$1()),posts:y,deletedPosts:y,comments:y,tagEdits:y,noteEdits:y,forumPosts:y,readAt:E$1()});function x(){let e=b.safeParse(Ic$1(h));return e.success?e.data:null}function we(){return `${ie}?${ce$1}=${g}&s=${le}`}function Te(e,t){let n=e.querySelector(_)?.getAttribute(`href`);if(n==null)return null;let r;try{r=new URL(n,t);}catch{return null}return r.origin!==new URL(t).origin||r.searchParams.get(`page`)!==g||r.searchParams.get(`s`)!==ue?null:r.href}function S(e){return e!==void 0&&me.test(e)?Number(e):void 0}function C(e,t){let n=new Map;for(let t of e.querySelectorAll(de)){let e=t.querySelectorAll(fe),r=e[0]?.textContent?.trim(),i=e[1]?.textContent?.trim();r!==void 0&&i!==void 0&&r.length>0&&n.set(r,i);}if(n.size===0)return null;let r=n.get(he),i=n.get(ge),a={readAt:t};r!==void 0&&pe.test(r)&&(a.joinDate=r),i!==void 0&&i.length>0&&(a.level=i);let o={posts:S(n.get(v)),deletedPosts:S(n.get(_e)),comments:S(n.get(ve)),tagEdits:S(n.get(ye)),noteEdits:S(n.get(be)),forumPosts:S(n.get(xe))};return {...a,...w(o)}}function w(e){let t={};for(let[n,r]of Object.entries(e))r!==void 0&&(t[n]=r);return t}async function T(e){let t=await fetch(e,{method:`GET`,credentials:be$1});if(!t.ok)throw Error(`HTTP ${String(t.status)}`);return new DOMParser().parseFromString(await t.text(),`text/html`)}function E(e){return new Promise(t=>{window.setTimeout(t,e);})}async function D(){let e=window.location.href,t=Te(await T(we()),e);if(t===null)throw Error(Se);await E(ce);let n=C(await T(t),Date.now()),r=b.safeParse(n);if(n===null||!r.success)throw Error(Ce);return Lc(h,r.data),r.data}var O=`rdw-stats`,k=`rdw-stats-tiles`,A=`rdw-stats-tile`,j=`rdw-stats-value`,M=`rdw-stats-label`,N=`rdw-stats-chart`,P=`rdw-stats-heading`,F=`rdw-stats-top`,I=`rdw-stats-top-row`,L=`rdw-stats-top-bar`,R=`rdw-stats-top-fill`,z=`rdw-stats-hint`,B=`rdw-stats-top--plain`,V=`rdw-stats-skeleton`,H=`rdw-stats-skeleton-bar`,U=`rdw-stats-profile`,W=`rdw-stats-profile-head`,G=`rdw-stats-profile-side`,Ee=`en-US`,De=10,Oe=1024,ke=100,Ae=2,je=160,K=`rdw-stats-column`,q=`rdw-stats-foot`,Me=20,Ne=1100,J=18,Y=`rdw-stats-skeleton-pulse`,Pe=1200,Fe=.5,Ie=`custom`,Le=`dynamic`,Re=` · `,X=`Collections`,ze=`Collections by posts`,Be=`Collections show here once they hold posts or their count is known.`,Ve=`Top tags in favorites`,He=`Run Full resync in RuleDesk → Favorites to fill this: it reads the tags of your favorites.`,Z=20,Ue=`Counting the tags of your favorites`,We=`Site profile`,Ge=`Refresh profile`,Ke=`Reads your profile page on the site: two requests, a moment apart`,qe=`Reading…`,Je=`These numbers are read from your profile page when this page is opened.`;function Ye(e,t){return e===null||t-e.readAt>=9e5}var Xe=`Read on `,Ze=`Could not read the profile: `,Qe=`Since `,$e=`Level`,et=315576e5,Q=12,tt=`Counted from the script's own data in this browser, except the site profile. Seen posts keep only the newest marks.`,nt=`
.${O} {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px ${String(Me)}px;
  align-items: start;
}
@media (min-width: ${String(Ne)}px) {
  .${O} {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
}
.${K} {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}
.${q} {
  grid-column: 1 / -1;
}
.${k} {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(${String(je)}px, 1fr));
  gap: 8px;
}
.${A},
.${N} {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  background: var(--rdw-surface-2);
  border-radius: var(--rdw-radius-m);
}
.${N} {
  gap: 8px;
  padding: 10px 12px;
}
.${j} {
  font-size: 18px;
  font-weight: 600;
  color: var(--rdw-text);
  white-space: nowrap;
}
.${P} {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--rdw-text);
}
.${M},
.${z} {
  margin: 0;
  font-size: 12px;
  color: var(--rdw-muted);
}
.${W},
.${G} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}
.${W} {
  justify-content: space-between;
}
/* The block is a card of the same colour as a tile, so its own tiles take
   the colour under the card to stay seen. */
.${U} .${A} {
  background: var(--rdw-surface);
}
.${F} {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.${I} {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) auto;
  align-items: center;
  gap: 8px;
  min-height: ${String(J)}px;
  font-size: 12px;
  line-height: ${String(J)}px;
}
.${B} > .${I} {
  grid-template-columns: minmax(0, 1fr) auto;
}
.${B} > .${I} > span:last-child {
  font-variant-numeric: tabular-nums;
}
.${I} > span:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.${L} {
  height: 6px;
  border-radius: 3px;
  background: var(--rdw-surface);
  overflow: hidden;
}
.${R} {
  display: block;
  height: 100%;
  background: var(--rdw-accent);
}
.${V} > div {
  display: flex;
  align-items: center;
  height: ${String(J)}px;
}
.${H} {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: var(--rdw-surface);
}
/* The grey rows breathe only for someone who has not asked for less motion. */
@media (prefers-reduced-motion: no-preference) {
  .${H} {
    animation: ${Y} ${String(Pe)}ms ease-in-out infinite alternate;
  }
}
@keyframes ${Y} {
  to {
    opacity: ${String(Fe)};
  }
}
`.trim();function rt(e,t){return `${$(e)} ${Ie}${Re}${$(t)} ${Le}`}function it(e,t){let n=0,r=0,i=new Set,a=[];for(let t of e.collections){let e;if(Wa(t)===`posts`){n+=1;let r=t.postIds??[];for(let e of r)i.add(e);e=r.length;}else r+=1,e=t.postCount?.value;e!==void 0&&e>0&&a.push({id:t.id,name:t.name,posts:e});}a.sort((e,t)=>t.posts-e.posts||e.name.localeCompare(t.name));let o=0;for(let t of Object.values(e.marks))t.seen===true&&(o+=1);let s=Math.ceil(JSON.stringify(e).length/Oe);return {tiles:[{label:`Followed artists`,value:e.artists.length},n+r===0?{label:X,value:0}:{label:X,value:n+r,detail:rt(n,r)},{label:`Posts in custom collections`,value:i.size},{label:`Favorites`,value:t},{label:`Seen posts`,value:o},{label:`Stored data`,value:s,unit:`KB`}],customCollections:n,dynamicCollections:r,topCollections:a.slice(0,De)}}function $(e){return e.toLocaleString(Ee)}function at(e){return e.collections.length===0?K$1(`p`,{className:z,children:Be}):K$1(`ol`,{className:`${F} ${B}`,children:e.collections.map(e=>K$1(`li`,{className:I,children:[K$1(`span`,{title:e.name,children:e.name}),K$1(`span`,{children:$(e.posts)})]},e.id))})}function ot(e,t){let n=Date.parse(`${e}T00:00:00Z`);if(Number.isNaN(n)||n>t)return null;let r=Math.floor((t-n)/et*Q),i=Math.floor(r/Q),a=r%Q,o=[];return i>0&&o.push(`${String(i)} ${i===1?`year`:`years`}`),a>0&&o.push(`${String(a)} ${a===1?`month`:`months`}`),o.length>0?o.join(` `):`under a month`}function st(e,t){let n=[],r$1=e.joinDate===void 0?null:ot(e.joinDate,t);if(r$1!==null&&e.joinDate!==void 0){let t=Date.parse(`${e.joinDate}T00:00:00`);n.push({label:r$1,text:`${Qe}${r(t)}`});}e.level!==void 0&&n.push({label:$e,text:e.level});let i=[[`Posts uploaded`,e.posts],[`Deleted posts`,e.deletedPosts],[`Comments`,e.comments],[`Tag edits`,e.tagEdits],[`Note edits`,e.noteEdits],[`Forum posts`,e.forumPosts]];for(let[e,t]of i)t!==void 0&&n.push({label:e,text:$(t)});return n}function ct(){return K$1(`div`,{className:`${F} ${V}`,role:`status`,"aria-label":Ue,children:Array.from({length:Z},(e,t)=>K$1(`div`,{children:K$1(`span`,{className:H})},t))})}function lt(){let[n,i]=z$1(null);B$1(()=>{let e=true;return g$1().then(t=>{let n=Ic(t,Cs(),Z);e&&i(n);}).catch(()=>{e&&i([]);}),()=>{e=false;}},[]);let a=n?.[0]?.count??0;return K$1(`div`,{className:N,children:[K$1(`p`,{className:P,children:Ve}),n===null?K$1(ct,{}):a===0?K$1(`p`,{className:z,children:He}):K$1(`ol`,{className:F,children:n.map(e=>K$1(`li`,{className:I,children:[K$1(`span`,{title:e.tag,children:e.tag.replaceAll(`_`,` `)}),K$1(`span`,{className:L,"aria-hidden":`true`,children:K$1(`span`,{className:R,style:{width:`${String(Math.max(Ae,Math.round(e.count/a*ke)))}%`}})}),K$1(`span`,{children:$(e.count)})]},e.tag))})]})}function ut(){let[i,a]=z$1(()=>x()),[o,s]=z$1(false),[c,l]=z$1(``),u=()=>{s(true),l(``),D().then(e=>{a(e);}).catch(e=>{l(e instanceof Error?e.message:String(e));}).finally(()=>{s(false);});};return B$1(()=>{Ye(x(),Date.now())&&u();},[]),K$1(`div`,{className:`${N} ${U}`,children:[K$1(`div`,{className:W,children:[K$1(`p`,{className:P,children:We}),K$1(`div`,{className:G,children:[i===null?null:K$1(`span`,{className:z,children:`${Xe}${n(i.readAt)}`}),K$1(J$1,{variant:`secondary`,size:`s`,title:Ke,disabled:o,onClick:u,children:o?qe:Ge})]})]}),c.length>0?K$1(`p`,{className:z,role:`status`,children:`${Ze}${c}`}):null,i===null?K$1(`p`,{className:z,children:Je}):K$1(`div`,{className:k,children:st(i,Date.now()).map(e=>K$1(`div`,{className:A,children:[K$1(`span`,{className:j,children:e.text}),K$1(`span`,{className:M,children:e.label})]},e.label))})]})}function dt(){let e=it(G$1(),Cs().size);return K$1(`section`,{className:`rdw-section ${O}`,children:[K$1(`style`,{children:nt}),K$1(`div`,{className:K,children:[K$1(`div`,{className:k,children:e.tiles.map(e=>K$1(`div`,{className:A,children:[K$1(`span`,{className:j,children:e.unit===void 0?$(e.value):`${$(e.value)} ${e.unit}`}),K$1(`span`,{className:M,children:e.label}),e.detail===void 0?null:K$1(`span`,{className:M,children:e.detail})]},e.label))}),K$1(`div`,{className:N,children:[K$1(`p`,{className:P,children:ze}),K$1(at,{collections:e.topCollections})]}),K$1(ut,{})]}),K$1(`div`,{className:K,children:K$1(lt,{})}),K$1(`p`,{className:`${z} ${q}`,children:tt})]})}function ft(){return K$1(lt$1,{className:dt$1.pageCard,children:K$1(dt,{})})}})}}));
System.register("./format-date-CpY7IdAY-BzMD4ndT.js", [],(function(exports){'use strict';return{execute:(function(){exports({n:n,r:r});var e=`en-GB`;function t(t){return new Date(t).toLocaleDateString(e,{day:`numeric`,month:`short`,year:`numeric`})}function n(n){let r=new Date(n).toLocaleTimeString(e,{hour:`2-digit`,minute:`2-digit`,hour12:false});return `${t(n)}, ${r}`}function r(t){return new Date(t).toLocaleDateString(e,{month:`short`,year:`numeric`})}})}}));
System.register("./collection-detail-page-B_-pdwWz-DclH19ZZ.js", ['./app-M32Uzb9f-DIm5OcM2.js','./___monkey.entry.js'],(function(exports){'use strict';var z$1,tm,V$1,Le$1,Re$1,Ze,K$1,A$1,Yr,J$1,wn,Sn,qt,Pi,en,tn,kI,mc,hc,Fe$1,_c,Zs,Ke$1,dc,gc,Js,Ys,Re$2,pc,ie,ce,ae,se,Mt;return{setters:[function(module){z$1=module.z;tm=module.an;V$1=module.V;Le$1=module.aQ;Re$1=module.R;Ze=module.aR;K$1=module.K;A$1=module.A;Yr=module.ao;J$1=module.J;wn=module.c;Sn=module.m;qt=module.q;Pi=module.aS;en=module.aT;tn=module.aU;kI=module.aV;},function(module){mc=module.dC;hc=module.dD;Fe$1=module.bi;_c=module.cp;Zs=module.bc;Ke$1=module.K;dc=module.dE;gc=module.dF;Js=module.bF;Ys=module.bE;Re$2=module.dG;pc=module.dH;ie=module.x;ce=module.y;ae=module.cw;se=module.cx;Mt=module.dI;}],execute:(function(){exports("CollectionDetailPage",Xe);var b=200,x=4,S=12,C=8,w=8,me=1,T=1,E=0,D=`move`,O=`0.4`,k=`contain`,A=`lazy`,j=`rdw-fav-bulk-selected`,M=`rdw-fav-bulk-check`,N=`✓`,P=`2px`,F=`2px`,I=`1.25rem`,L=`0.25rem`,he=2,R=`0.75rem`,z=`#4c8bf5`,B=`#ffffff`,V=`rdw-collection-detail`,H=`rdw-collection-back`,U=`rdw-collection-heading`,W=`rdw-collection-name`,G=`rdw-collection-count`,K=`rdw-collection-actions`,q=`rdw-collection-grid`,J=`rdw-collection-cell`,Y=`rdw-collection-fallback`,ge=`rdw-collection-missing`,_e=`rdw-collection-dialog-form`,ve=`rdw-collection-dialog-actions`,ye=`← Collections`,be=`Shuffle`,xe=`Original order`,Se=`Select`,Ce=`Download all`,we=`Download selected`,Te=`Drag a post onto another to change the order.`,X=`rdw-collection-cell--dragging`,Z=`rdw-collection-cell--drop`,Ee=`rdw-collection-hint`,De=`Undo`,Oe=`Remove from collection`,Q=`#`,ke=`Post #`,Ae=`post`,je=`posts`,Me=`Removed `,Ne=`Collection not found.`,Pe=`No posts yet`,Fe=`Add posts with + on a thumbnail, and with Collections on the post page.`,Ie=`rdw-collection-rename-name`,Le=`Rename collection`,Re=`Delete collection`;function ze(e){return e.length===0?Fe$1.confirmDelete:`Delete the collection \u201c${e}\u201d? The posts stay on the site; the list of them is lost. This cannot be undone.`}var Be=`Collection posts`,Ve=`
.${V} {
  display: flex;
  flex-direction: column;
  gap: ${String(S)}px;
}
.${H} {
  color: var(--rdw-accent);
  font-weight: 600;
  text-decoration: none;
}
.${U} {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: ${String(w)}px ${String(S)}px;
}
.${W} {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--rdw-text);
}
.${G} {
  margin: 0;
  color: var(--rdw-muted);
}
.${K} {
  display: flex;
  flex-wrap: wrap;
  gap: ${String(C)}px;
}
.${Ee} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 12px;
}
.${X} {
  opacity: ${O};
}
.${Z} {
  outline: 2px dashed var(--rdw-accent);
  outline-offset: -2px;
}
.${q} {
  display: grid;
  grid-template-columns: repeat(auto-fill, ${String(b)}px);
  gap: ${String(x)}px;
}
.${J} {
  position: relative;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${String(b)}px;
  height: ${String(b)}px;
  overflow: hidden;
  border: 1px solid var(--rdw-border);
  background: var(--rdw-surface);
  color: var(--rdw-text);
  text-decoration: none;
}
.${J} img {
  width: 100%;
  height: 100%;
  object-fit: ${k};
}
.${Y} {
  font-weight: 600;
  color: var(--rdw-muted);
}
.${ge} {
  margin: 0;
}
.${_e} {
  display: grid;
  gap: ${String(S)}px;
}
.${ve} {
  display: flex;
  justify-content: flex-end;
  gap: ${String(C)}px;
}
.${J}.${j} {
  outline: ${P} solid var(--rdw-accent, ${z});
  outline-offset: ${F};
}
.${J} > .${M} {
  position: absolute;
  top: ${L};
  left: ${L};
  z-index: ${String(he)};
  display: none;
  align-items: center;
  justify-content: center;
  width: ${I};
  height: ${I};
  border-radius: 999px;
  background: var(--rdw-accent, ${z});
  color: var(--rdw-surface, ${B});
  font-size: ${R};
  font-weight: 700;
  line-height: 1;
  pointer-events: none;
}
.${J}.${j} > .${M} {
  display: inline-flex;
}
`.trim();function He(e){return `${String(e)} ${e===T?Ae:je}`}function Ue(e){return `${Me}${String(e)} ${e===T?Ae:je}`}function We(e){return `${Q}${String(e)}`}function Ge(e,t){let n=e[String(t)];return n===void 0||n.length===0?null:n}function Ke(e){let t=_c(e);if(t===null)return null;let n=Zs().find(t=>t.id===e);return n===void 0?null:{name:n.name,order:t,thumbs:n.thumbs??{},shuffled:n.shuffledOrder!==null&&n.shuffledOrder!==void 0}}function qe(e,t){let n=new URLSearchParams;return n.set(ce,ae),n.set(`s`,se),n.set(`id`,String(t)),`${ie}?${n.toString()}${Mt(e)}`}function Je(e){return e.button!==E||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey}function Ye(e){let[t,n]=z$1(null),i=e.thumbUrl,o=i!==null&&t===i,s=V$1(i);s.current=i;let c=Re$1(()=>{n(s.current);},[]),ee=Re$1(e=>{e!==null&&e.addEventListener(`error`,c);},[c]),d=i!==null&&!o,f=e.drag,p=[J,e.selected?j:``,f?.draggingId===e.postId?X:``,f!==null&&f.overId===e.postId&&f.draggingId!==e.postId?Z:``].filter(e=>e.length>0).join(` `);return K$1(`a`,{className:p,href:qe(e.collectionId,e.postId),"aria-label":`${ke}${String(e.postId)}`,...e.selecting?{"aria-pressed":e.selected}:{},draggable:f!==null,onDragStart:t=>{f!==null&&(t.dataTransfer!==null&&(t.dataTransfer.effectAllowed=D),f.onStart(e.postId));},onDragOver:t=>{f!==null&&f.draggingId!==null&&(t.preventDefault(),f.onOver(e.postId));},onDrop:t=>{f!==null&&f.draggingId!==null&&(t.preventDefault(),f.onDrop(e.postId));},onDragEnd:()=>{f?.onEnd();},onClick:t=>{e.selecting&&!Je(t)&&(t.preventDefault(),e.onToggle(e.postId));},children:[d?K$1(`img`,{src:i,alt:``,loading:A,ref:ee}):K$1(`span`,{className:Y,children:We(e.postId)}),e.selected?K$1(`span`,{className:M,"aria-hidden":`true`,children:N}):null]})}function $(){return K$1(`a`,{className:H,href:Ke$1,children:ye})}function Xe(d){let[p,h]=z$1(0),[g,_]=z$1(false);tm(g,H);let[v,y]=z$1(()=>new Set),[re,b]=z$1(false),[x,S]=z$1(``),[C,w]=z$1(false),[E,D]=z$1(null),O=V$1(null),k=V$1(0),[A,j]=z$1(null),[M,N]=z$1(null),P=Le$1(()=>Ke(d.collectionId),[d.collectionId,p]),F=Re$1(()=>{h(e=>e+1);},[]),I=Re$1(()=>{O.current=null,D(null);},[]),L=Re$1(()=>{let e=O.current;e!==null&&(pc(e.snapshot),O.current=null,D(null),h(e=>e+1));},[]);function he(e){if(e.posts.length===0)return;k.current+=1;let t={id:k.current,message:Ue(e.posts.length),snapshot:e};O.current=t,D(t);}let R={draggingId:A,overId:M,onStart:j,onOver:N,onDrop:e=>{A!==null&&gc(d.collectionId,A,e),j(null),N(null),F();},onEnd:()=>{j(null),N(null);}};function z(e,t){t.length===0||en()||tn(e,{kind:`ids`,ids:t});}let B=Ze();function H(){_(false),y(new Set);}function J(e){y(t=>{let n=new Set(t);return n.has(e)?n.delete(e):n.add(e),n});}function Y(){P!==null&&(S(P.name),b(true));}function ye(e){e.preventDefault();let t=x.trim();t.length<me||(Js(d.collectionId,t),b(false),F());}function X(){w(false),Ys(d.collectionId)?kI(Re$2):F();}function Z(){if(v.size===0)return;let e=dc(d.collectionId,[...v]);H(),F(),e!==null&&he(e);}let Q=E===null?null:{label:De,onClick:L};return K$1(`div`,{className:V,"data-collection-id":d.collectionId,children:[K$1(`style`,{children:Ve}),P===null?K$1(A$1,{children:[K$1(`p`,{className:ge,children:Ne}),K$1($,{})]}):K$1(A$1,{children:[K$1($,{}),K$1(`div`,{className:U,children:[K$1(`h1`,{className:W,children:P.name}),K$1(`p`,{className:G,children:He(P.order.length)})]}),g?K$1(Yr,{count:v.size,onSelectAll:()=>{y(new Set(P.order));},onClear:()=>{y(new Set);},onCancel:H,danger:K$1(J$1,{variant:`danger-quiet`,disabled:v.size===0,onClick:Z,children:Oe}),children:B?K$1(J$1,{variant:`secondary`,disabled:v.size===0,onClick:()=>{z(P.name,P.order.filter(e=>v.has(e))),H();},children:we}):null}):K$1(`div`,{className:K,children:K$1(A$1,{children:[P.order.length>0?K$1(J$1,{variant:`secondary`,size:`s`,onClick:()=>{mc(d.collectionId),F();},children:be}):null,P.shuffled?K$1(J$1,{variant:`secondary`,size:`s`,onClick:()=>{hc(d.collectionId),F();},children:xe}):null,P.order.length>0?K$1(J$1,{variant:`secondary`,size:`s`,onClick:()=>{y(new Set),_(true);},children:Se}):null,B&&P.order.length>0?K$1(J$1,{variant:`secondary`,size:`s`,onClick:()=>{z(P.name,P.order);},children:Ce}):null,K$1(J$1,{variant:`secondary`,size:`s`,onClick:Y,children:Fe$1.rename}),K$1(J$1,{variant:`danger-quiet`,size:`s`,onClick:()=>{w(true);},children:Fe$1.delete})]})}),!g&&P.order.length>T?K$1(`p`,{className:Ee,children:Te}):null,P.order.length===0?K$1(wn,{title:Pe,description:Fe}):K$1(`div`,{className:q,"aria-label":Be,children:P.order.map(e=>K$1(Ye,{postId:e,collectionId:d.collectionId,thumbUrl:Ge(P.thumbs,e),selecting:g,selected:v.has(e),onToggle:J,drag:g?null:R},e))}),K$1(Sn,{open:re,onClose:()=>{b(false);},title:Fe$1.rename,"aria-label":Le,children:K$1(`form`,{className:_e,onSubmit:ye,children:[K$1(qt,{id:Ie,label:Fe$1.nameLabel,value:x,onChange:S}),K$1(`div`,{className:ve,children:[K$1(J$1,{type:`button`,variant:`secondary`,size:`s`,onClick:()=>{b(false);},children:Fe$1.cancel}),K$1(J$1,{type:`submit`,variant:`primary`,size:`s`,children:Fe$1.save})]})]})}),K$1(Sn,{variant:`confirm`,open:C,onClose:()=>{w(false);},title:Fe$1.delete,"aria-label":Re,message:ze(P===null?``:P.name),confirmLabel:Fe$1.delete,cancelLabel:Fe$1.cancel,confirmTone:`danger`,onConfirm:X})]}),K$1(Pi,{open:E!==null,message:E===null?``:E.message,onClose:I,...Q===null?{}:{action:Q}},E?.id)]})}})}}));
System.import("./___monkey.entry.js", "./");

/*! Third-party notices: RuleDesk Web includes the following packages.

preact 11.2.0 (MIT)

The MIT License (MIT)

Copyright (c) 2015-present Jason Miller

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

zod 4.6.7 (MIT)

MIT License

Copyright (c) 2025 Colin McDonnell

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

systemjs 6.15.1 (MIT)

MIT License
-----------

Copyright (C) 2013-2022 Guy Bedford

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
