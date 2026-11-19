// ==UserScript==
// @name         RuleDesk Web
// @namespace    https://github.com/kazekaze93/ruledesk-web
// @version      0.72.3
// @description  Collections, playlists, favorites, artist updates, and page tweaks for rule34.xxx
// @downloadURL  https://raw.githubusercontent.com/KazeKaze93/RuleDesk/main/dist/ruledesk-web.user.js
// @updateURL    https://raw.githubusercontent.com/KazeKaze93/RuleDesk/main/dist/ruledesk-web.user.js
// @match        https://rule34.xxx/*
// @grant        GM_download
// @grant        GM_getValue
// @grant        GM_info
// @grant        GM_setValue
// @run-at       document-start
// ==/UserScript==

!function(){function e(e,t){return(t||"")+" (SystemJS Error#"+e+" https://github.com/systemjs/systemjs/blob/main/docs/errors.md#"+e+")"}function t(e,t){if(-1!==e.indexOf("\\")&&(e=e.replace(j,"/")),"/"===e[0]&&"/"===e[1])return t.slice(0,t.indexOf(":")+1)+e;if("."===e[0]&&("/"===e[1]||"."===e[1]&&("/"===e[2]||2===e.length&&(e+="/"))||1===e.length&&(e+="/"))||"/"===e[0]){var n,r=t.slice(0,t.indexOf(":")+1);if(n="/"===t[r.length+1]?"file:"!==r?(n=t.slice(r.length+2)).slice(n.indexOf("/")+1):t.slice(8):t.slice(r.length+("/"===t[r.length])),"/"===e[0])return t.slice(0,t.length-n.length-1)+e;for(var i=n.slice(0,n.lastIndexOf("/")+1)+e,o=[],s=-1,u=0;u<i.length;u++)-1!==s?"/"===i[u]&&(o.push(i.slice(s,u+1)),s=-1):"."===i[u]?"."!==i[u+1]||"/"!==i[u+2]&&u+2!==i.length?"/"===i[u+1]||u+1===i.length?u+=1:s=u:(o.pop(),u+=2):s=u;return-1!==s&&o.push(i.slice(s)),t.slice(0,t.length-n.length)+o.join("")}}function n(e,n){return t(e,n)||(-1!==e.indexOf(":")?e:t("./"+e,n))}function r(e,n,r,i,o){for(var s in e){var a=t(s,r)||s,f=e[s];if("string"==typeof f){var l=c(i,t(f,r)||f,o);l?n[a]=l:u("W1",s,f,"bare specifier did not resolve")}}}function i(e,t,i){var o;for(o in e.imports&&r(e.imports,i.imports,t,i,null),e.scopes||{}){var s=n(o,t);r(e.scopes[o],i.scopes[s]||(i.scopes[s]={}),t,i,s)}for(o in e.depcache||{})i.depcache[n(o,t)]=e.depcache[o];for(o in e.integrity||{})i.integrity[n(o,t)]=e.integrity[o]}function o(e,t){if(t[e])return e;var n=e.length;do{var r=e.slice(0,n+1);if(r in t)return r}while(-1!==(n=e.lastIndexOf("/",n-1)))}function s(e,t){var n=o(e,t);if(n){var r=t[n];if(null===r)return;if(!(e.length>n.length&&"/"!==r[r.length-1]))return r+e.slice(n.length);u("W2",n,r,"should have a trailing '/'")}}function u(t,n,r,i){console.warn(e(t,"Package target "+i+", resolving target '"+r+"' for "+n))}function c(e,t,n){for(var r=e.scopes,i=n&&o(n,r);i;){var u=s(t,r[i]);if(u)return u;i=o(i.slice(0,i.lastIndexOf("/")),r)}return s(t,e.imports)||-1!==t.indexOf(":")&&t}function a(){this[M]={}}function f(e){return e.id}function l(e,t,n,r){if(e.onload(n,t.id,t.d&&t.d.map(f),!!r),n)throw n}function d(t,n,r,i){var o=t[M][n];if(o)return o;var s=[],u=Object.create(null);P&&Object.defineProperty(u,P,{value:"Module"});var c=Promise.resolve().then((function(){return t.instantiate(n,r,i)})).then((function(r){if(!r)throw Error(e(2,"Module "+n+" did not instantiate"));var i=r[1]((function(e,t){o.h=!0;var n=!1;if("string"==typeof e)e in u&&u[e]===t||(u[e]=t,n=!0);else{for(var r in e)t=e[r],r in u&&u[r]===t||(u[r]=t,n=!0);e&&e.__esModule&&(u.__esModule=e.__esModule)}if(n)for(var i=0;i<s.length;i++){var c=s[i];c&&c(u)}return t}),2===r[1].length?{import:function(e,r){return t.import(e,n,r)},meta:t.createContext(n)}:void 0);return o.e=i.execute||function(){},[r[0],i.setters||[],r[2]||[]]}),(function(e){throw o.e=null,o.er=e,l(t,o,e,!0),e})),a=c.then((function(e){return Promise.all(e[0].map((function(r,i){var o=e[1][i],s=e[2][i];return Promise.resolve(t.resolve(r,n)).then((function(e){var r=d(t,e,n,s);return Promise.resolve(r.I).then((function(){return o&&(r.i.push(o),!r.h&&r.I||o(r.n)),r}))}))}))).then((function(e){o.d=e}))}));return o=t[M][n]={id:n,i:s,n:u,m:i,I:c,L:a,h:!1,d:void 0,e:void 0,er:void 0,E:void 0,C:void 0,p:void 0}}function h(e,t,n,r){if(!r[t.id])return r[t.id]=!0,Promise.resolve(t.L).then((function(){return t.p&&null!==t.p.e||(t.p=n),Promise.all(t.d.map((function(t){return h(e,t,n,r)})))})).catch((function(n){if(t.er)throw n;throw t.e=null,l(e,t,n,!1),n}))}function p(e,t){return t.C=h(e,t,t,{}).then((function(){return v(e,t,{})})).then((function(){return t.n}))}function v(e,t,n){function r(){try{var n=o.call(L);if(n)return n=n.then((function(){t.C=t.n,t.E=null,l(e,t,null,!0)}),(function(n){throw t.er=n,t.E=null,l(e,t,n,!0),n})),t.E=n;t.C=t.n,t.L=t.I=void 0}catch(r){throw t.er=r,r}finally{l(e,t,t.er,!0)}}if(!n[t.id]){if(n[t.id]=!0,!t.e){if(t.er)throw t.er;return t.E?t.E:void 0}var i,o=t.e;return t.e=null,t.d.forEach((function(r){try{var o=v(e,r,n);o&&(i=i||[]).push(o)}catch(s){throw t.er=s,l(e,t,s,!1),s}})),i?Promise.all(i).then(r):r()}}function m(){[].forEach.call(document.querySelectorAll("script"),(function(t){if(!t.sp)if("systemjs-module"===t.type){if(t.sp=!0,!t.src)return;System.import("import:"===t.src.slice(0,7)?t.src.slice(7):n(t.src,g)).catch((function(e){if(e.message.indexOf("https://github.com/systemjs/systemjs/blob/main/docs/errors.md#3")>-1){var n=document.createEvent("Event");n.initEvent("error",!1,!1),t.dispatchEvent(n)}return Promise.reject(e)}))}else if("systemjs-importmap"===t.type){t.sp=!0;var r=t.src?(System.fetch||fetch)(t.src,{integrity:t.integrity,priority:t.fetchPriority,passThrough:!0}).then((function(e){if(!e.ok)throw Error("Invalid status code: "+e.status);return e.text()})).catch((function(n){return n.message=e("W4","Error fetching systemjs-import map "+t.src)+"\n"+n.message,console.warn(n),"function"==typeof t.onerror&&t.onerror(),"{}"})):t.innerHTML;W=W.then((function(){return r})).then((function(n){!function(t,n,r){var o={};try{o=JSON.parse(n)}catch(s){console.warn(Error(e("W5","systemjs-importmap contains invalid JSON")+"\n\n"+n+"\n"))}i(o,r,t)}(N,n,t.src||g)}))}}))}var g,y="undefined"!=typeof Symbol,b="undefined"!=typeof self,S="undefined"!=typeof document,w=b?self:global;if(S){var O=document.querySelector("base[href]");O&&(g=O.href)}if(!g&&"undefined"!=typeof location){var E=(g=location.href.split("#")[0].split("?")[0]).lastIndexOf("/");-1!==E&&(g=g.slice(0,E+1))}var x,j=/\\/g,P=y&&Symbol.toStringTag,M=y?Symbol():"@",I=a.prototype;I.import=function(e,t,n){var r=this;return t&&"object"==typeof t&&(n=t,t=void 0),Promise.resolve(r.prepareImport()).then((function(){return r.resolve(e,t,n)})).then((function(e){var t=d(r,e,void 0,n);return t.C||p(r,t)}))},I.createContext=function(e){var t=this;return{url:e,resolve:function(n,r){return Promise.resolve(t.resolve(n,r||e))}}},I.onload=function(){},I.register=function(e,t,n){x=[e,t,n]},I.getRegister=function(){var e=x;return x=void 0,e};var L=Object.freeze(Object.create(null));w.System=new a;var C,R,W=Promise.resolve(),N={imports:{},scopes:{},depcache:{},integrity:{}},T=S;if(I.prepareImport=function(e){return(T||e)&&(m(),T=!1),W},I.getImportMap=function(){return JSON.parse(JSON.stringify(N))},S&&(m(),window.addEventListener("DOMContentLoaded",m)),I.addImportMap=function(e,t){i(e,t||g,N)},S){window.addEventListener("error",(function(e){J=e.filename,_=e.error}));var A=location.origin}I.createScript=function(e){var t=document.createElement("script");t.async=!0,e.indexOf(A+"/")&&(t.crossOrigin="anonymous");var n=N.integrity[e];return n&&(t.integrity=n),t.src=e,t};var J,_,k={},U=I.register;I.register=function(e,t){if(S&&"loading"===document.readyState&&"string"!=typeof e){var n=document.querySelectorAll("script[src]"),r=n[n.length-1];if(r){C=e;var i=this;R=setTimeout((function(){k[r.src]=[e,t],i.import(r.src)}))}}else C=void 0;return U.call(this,e,t)},I.instantiate=function(t,n){var r=k[t];if(r)return delete k[t],r;var i=this;return Promise.resolve(I.createScript(t)).then((function(r){return new Promise((function(o,s){r.addEventListener("error",(function(){s(Error(e(3,"Error loading "+t+(n?" from "+n:""))))})),r.addEventListener("load",(function(){if(document.head.removeChild(r),J===t)s(_);else{var e=i.getRegister(t);e&&e[0]===C&&clearTimeout(R),o(e)}})),document.head.appendChild(r)}))}))},I.shouldFetch=function(){return!1},"undefined"!=typeof fetch&&(I.fetch=fetch);var $=I.instantiate,B=/^(text|application)\/(x-)?javascript(;|$)/;I.instantiate=function(t,n,r){var i=this;return this.shouldFetch(t,n,r)?this.fetch(t,{credentials:"same-origin",integrity:N.integrity[t],meta:r}).then((function(r){if(!r.ok)throw Error(e(7,r.status+" "+r.statusText+", loading "+t+(n?" from "+n:"")));var o=r.headers.get("content-type");if(!o||!B.test(o))throw Error(e(4,'Unknown Content-Type "'+o+'", loading '+t+(n?" from "+n:"")));return r.text().then((function(e){return e.indexOf("//# sourceURL=")<0&&(e+="\n//# sourceURL="+t),(0,eval)(e),i.getRegister(t)}))})):$.apply(this,arguments)},I.resolve=function(n,r){return c(N,t(n,r=r||g)||n,r)||function(t,n){throw Error(e(8,"Unable to resolve bare specifier '"+t+(n?"' from "+n:"'")))}(n,r)};var F=I.instantiate;I.instantiate=function(e,t,n){var r=N.depcache[e];if(r)for(var i=0;i<r.length;i++)d(this,this.resolve(r[i],e),e);return F.call(this,e,t,n)},b&&"function"==typeof importScripts&&(I.instantiate=function(e){var t=this;return Promise.resolve().then((function(){return importScripts(e),t.getRegister(e)}))}),function(e){function t(t){return!e.hasOwnProperty(t)||!isNaN(t)&&t<e.length||a&&e[t]&&"undefined"!=typeof window&&e[t].parent===window}var n,r,i,o=e.System.constructor.prototype,s=o.import;o.import=function(o,u,c){return function(){for(var o in n=r=void 0,e)t(o)||(n?r||(r=o):n=o,i=o)}(),s.call(this,o,u,c)};var u=[[],function(){return{}}],c=o.getRegister;o.getRegister=function(){var o=c.call(this);if(o)return o;var s,a=function(o){var s,u,c=0;for(var a in e)if(!t(a)){if(0===c&&a!==n||1===c&&a!==r)return a;s?(i=a,u=o&&u||a):s=a===i,c++}return u}(this.firstGlobalProp);if(!a)return u;try{s=e[a]}catch(f){return u}return[[],function(e){return{execute:function(){e(s),e({default:s,__useDefault:!0})}}}]};var a="undefined"!=typeof navigator&&-1!==navigator.userAgent.indexOf("Trident")}("undefined"!=typeof self?self:global),function(e){var t=e.System.constructor.prototype,r=/^[^#?]+\.(css|html|json|wasm)([?#].*)?$/,i=t.shouldFetch.bind(t);t.shouldFetch=function(e){return i(e)||r.test(e)};var o=/^application\/json(;|$)/,s=/^text\/css(;|$)/,u=/^application\/wasm(;|$)/,c=t.fetch;t.fetch=function(t,r){return c(t,r).then((function(i){if(r.passThrough)return i;if(!i.ok)return i;var c=i.headers.get("content-type");return o.test(c)?i.json().then((function(e){return new Response(new Blob(['System.register([],function(e){return{execute:function(){e("default",'+JSON.stringify(e)+")}}})"],{type:"application/javascript"}))})):s.test(c)?i.text().then((function(e){return e=e.replace(/url\(\s*(?:(["'])((?:\\.|[^\n\\"'])+)\1|((?:\\.|[^\s,"'()\\])+))\s*\)/g,(function(e,r,i,o){return["url(",r,n(i||o,t),r,")"].join("")})),new Response(new Blob(["System.register([],function(e){return{execute:function(){var s=new CSSStyleSheet();s.replaceSync("+JSON.stringify(e)+');e("default",s)}}})'],{type:"application/javascript"}))})):u.test(c)?(WebAssembly.compileStreaming?WebAssembly.compileStreaming(i):i.arrayBuffer().then(WebAssembly.compile)).then((function(n){e.System.wasmModules||(e.System.wasmModules=Object.create(null)),e.System.wasmModules[t]=n;var r=[],i=[];return WebAssembly.Module.imports&&WebAssembly.Module.imports(n).forEach((function(e){var t=JSON.stringify(e.module);-1===r.indexOf(t)&&(r.push(t),i.push("function(m){i["+t+"]=m}"))})),new Response(new Blob(["System.register(["+r.join(",")+"],function(e){var i={};return{setters:["+i.join(",")+"],execute:function(){return WebAssembly.instantiate(System.wasmModules["+JSON.stringify(t)+"],i).then(function(m){e(m.exports)})}}})"],{type:"application/javascript"}))})):i}))}}("undefined"!=typeof self?self:global);var q="undefined"!=typeof Symbol&&Symbol.toStringTag;I.get=function(e){var t=this[M][e];if(t&&null===t.e&&!t.E)return t.er?null:t.n},I.set=function(t,n){try{new URL(t)}catch(s){console.warn(Error(e("W3",'"'+t+'" is not a valid URL to set in the module registry')))}var r;q&&"Module"===n[q]?r=n:(r=Object.assign(Object.create(null),n),q&&Object.defineProperty(r,q,{value:"Module"}));var i=Promise.resolve(r),o=this[M][t]||(this[M][t]={id:t,i:[],h:!1,d:[],e:null,er:void 0,E:void 0});return!o.e&&!o.E&&(Object.assign(o,{n:r,I:void 0,L:void 0,C:i}),r)},I.has=function(e){return!!this[M][e]},I.delete=function(e){var t=this[M],n=t[e];if(!n||n.p&&null!==n.p.e||n.E)return!1;var r=n.i;return n.d&&n.d.forEach((function(e){var t=e.i.indexOf(n);-1!==t&&e.i.splice(t,1)})),delete t[e],function(){var n=t[e];if(!n||!r||null!==n.e||n.E)return!1;r.forEach((function(e){n.i.push(e),e(n.n)})),r=null}};var D="undefined"!=typeof Symbol&&Symbol.iterator;I.entries=function(){var e,t,n=this,r=Object.keys(n[M]),i=0,o={next:function(){for(;void 0!==(t=r[i++])&&void 0===(e=n.get(t)););return{done:void 0===t,value:void 0!==t&&[t,e]}}};return o[D]=function(){return this},o}}();
!function(t){function e(t){t.registerRegistry=Object.create(null),t.namedRegisterAliases=Object.create(null)}var r=t.System;e(r);var i,s,n=r.constructor.prototype,l=r.constructor,a=function(){l.call(this),e(this)};a.prototype=n,r.constructor=a;var o=n.register;n.register=function(t,e,r,n){if("string"!=typeof t)return o.apply(this,arguments);var l=[e,r,n];return this.registerRegistry[t]=l,i||(i=l,s=t),Promise.resolve().then((function(){i=null,s=null})),o.apply(this,[e,r,n])};var u=n.resolve;n.resolve=function(t,e){try{return u.call(this,t,e)}catch(r){if(t in this.registerRegistry)return this.namedRegisterAliases[t]||t;throw r}};var c=n.instantiate;n.instantiate=function(t,e,r){var i=this.registerRegistry[t];return i?(this.registerRegistry[t]=null,i):c.call(this,t,e,r)};var g=n.getRegister;n.getRegister=function(t){var e=g.call(this,t);s&&t&&(this.namedRegisterAliases[s]=t);var r=i||e;return i=null,s=null,r}}("undefined"!=typeof self?self:global);
;(typeof System!='undefined')&&(System=new System.constructor());
System.register("./___monkey.entry.js", [],(function(exports,module){'use strict';return{execute:(function(){exports({B:Es$1,D:D$1,E:E$1,G:Gn$1,I:Ii$1,N:N$1,O:O$1,P:Pc,S:fn$1,T:T$1,U:Uo,W:ut,X:P,_:Ec,a:A$1,a3:Pt$1,a4:bo$1,a5:xo$1,a6:ho$1,a7:R$1,a8:Us,aA:zc,aB:Ti,aC:wc,aD:xs$1,aH:Pt,aI:Ua,aJ:Vc,aK:Kt$1,aN:Ki,aO:Cc,aP:To$1,aS:Es,aV:Uc,aZ:ot,aa:ao$1,ab:Fc,ac:Zi$1,ad:Mo$1,af:ln$1,ai:Wa,aj:Rt$1,ak:kt$1,al:qt,am:Ft,an:It,b:Hi$1,b0:Tt,b1:Cs$1,b2:Ia,b3:Lo$1,b4:Io$1,b5:jo$1,b6:ol,b7:mo$1,b8:uo$1,b9:is,bB:Ss$1,bC:q$1,bD:Nt$1,bE:Ks,bF:Gs,bG:Sc,bH:No$1,bK:Ys,bL:so$1,bM:io$1,bP:qt$1,bQ:Ba$1,bS:Yn$1,bT:hi,bW:dn$1,bX:Et,ba:un$1,bb:Lc,bc:Js,bd:wo$1,be:M,bg:zt$1,bj:hc,bk:po$1,bl:sl,bn:go$1,bo:Hc,bp:K$1,bq:I$1,br:Ao$1,bs:Po$1,bt:gc,bu:_c,bv:vc,bw:st,bx:za$1,bz:Ft$1,c:G$1,c$:wi,c4:lc,c5:qs,c6:oc,c8:Va,c9:za,cA:kc,cC:Ic,cH:fo,cJ:Dc,cL:Tc,cT:pi,cU:Tt$1,cW:Ac,cY:Mc,cZ:fi,ca:Ha,cb:jc,cc:Wc,ce:La,cg:Ra,ch:At$1,ci:dr,cm:Dt,cp:mc,cq:jt$1,ct:Nt,cu:sc,cz:Rc,d0:Ya$1,d1:zs,d2:ys$1,d3:Bc,d5:L$1,d6:ds$1,d9:Ji$1,dA:nl,dB:rl,dC:dc,dD:fc,dE:cc,dF:pc,dH:uc,dI:Mt$1,db:Ha$1,dc:_s$1,de:Ds,df:bi,dg:Zc,dh:tl,di:el,dj:Qc,dk:$c,dl:Ga$1,dm:yc,dn:Ho$1,dp:Xo$1,dq:Kc,dv:Xc,dw:Yc,dx:qc,dy:Jc,dz:cl,e:bs$1,f:Oc,g:Nc,h:Lo,k:k$1,n:Ts$1,w:ws$1});var e=`ruledesk-web.storage`,t=`ruledesk-web.storage.backup`,n=`ruledesk-web.favs`,r=`ruledesk-web.appearance.background`,i=1572864,a=`Background image is too large (max 1.5 MB).`,o=`ruledesk-web-tokens`,s=`ruledesk-web-site-skin`,c=`rdw-skin`,l=`data-rdw-theme`,u=`site`,d=`site-dark`,f=`light`,ee=`dark`,te=`custom`,ne=f,re=`https://rule34.xxx`,ie=`/index.php`,ae=`post`,oe=`list`,se=`view`,ce=`page`,le=`tags`,ue=`favorites`,de=`view`,fe=`delete`,pe=`return_pid`,me=`/public/addfav.php`,he=`/index.php`,ge=`page`,_e=`type`,ve=`post`,ye=`vote`,be=`same-origin`,xe=`include`,Se=`exclude`,Ce=`id:>`,we=`File is not a RuleDesk Web export`,Te=`search`,Ee=`posts`,De=`ruledesk-web-document-style`,Oe=`ruledesk-web-updates-bar`,ke=`theme`,Ae=`dark`,je=`tag_blacklist`,Me=`/css/`,Ne=`desktop.css`,Pe=`desktop-dark.css`,Fe={nameLabel:`Name`,save:`Save`,cancel:`Cancel`,rename:`Rename`,delete:`Delete`,confirmDelete:`Delete this collection?`,confirm:`Confirm`,export:`Export`,import:`Import`,importErrorPrefix:`Import failed:`,enablePageTweaksLabel:`Enable page tweaks`,gridFavButtonsLabel:`Show favorite buttons in grid`,cardFavAddLabel:`Add post to favorites`,cardFavRemoveLabel:`Remove post from favorites`,cardFavGlyph:`★`,cardFavErrorNotLoggedIn:`Log in to use favorites`,cardFavErrorRequest:`Favorite request failed`,artistAdd:`Add`,artistFollow:`Follow`,artistFollowing:`Following`,artistInvalid:`Invalid artist tag.`,artistDuplicate:`Already following this artist.`,playlistChunkSizeLabel:`Collection part size`,seenUpTo:`Seen up to post #`,seenNothing:`Nothing marked as seen yet.`,markAllSeen:`Mark all seen`,goToPageOneToMark:`Go to page 1 to mark everything as seen`,noNewPostsSince:`No new posts since #`,updatesPartialHint:`This search covers only part of your artists. Marking as seen works when all artists are in one search (set “Artists per search” to 0).`,updatesBarMissingHost:`updates empty host not found; updates bar not mounted`},Ie={section:`rdw-section`,list:`rdw-list`,listItem:`rdw-list-item`,itemName:`rdw-item-name`,itemActions:`rdw-item-actions`,primaryButton:`rdw-primary-button`,secondaryButton:`rdw-secondary-button`,form:`rdw-form`,formActions:`rdw-form-actions`,toolbar:`rdw-toolbar`,hint:`rdw-hint`,error:`rdw-error`,confirmRow:`rdw-confirm-row`,thumb:`rdw-thumb`,cardFav:`rdw-card-fav`,cardFavMarked:`rdw-card-fav--marked`,cardFavError:`rdw-card-fav--error`,cardFavPending:`rdw-card-fav--pending`,gridFavsHidden:`rdw-grid-favs-hidden`,artistFollow:`rdw-artist-follow`,artistFollowMarked:`rdw-artist-follow--marked`,updatesBar:`rdw-updates-bar`,updatesBarActions:`rdw-updates-bar-actions`},Le=`filter_ai`,p=`#rdw/`,Re=`collections`,ze=`following`,Be=`settings`,Ve=`stats`,He=[Re,ze,Ve,Be],Ue=`collection`,We=`#rdw-c=`,Ge=`#rdw-dc=`,Ke=`${p}${Re}`,qe=`${p}${ze}`,Je=`${p}${Be}`,Ye=`${p}${Ve}`,Xe=`stats-menu`,Ze=`Statistics in site menu`,Qe=`rdw-stats-menu`,$e=`rdw-own-page`,et=`rdw-page-root`,tt=`rdw-downloads`,nt=`rdw-own-page-style`,rt=`div#header`,it=`div#header ul#navbar`,at$1=`current-page`,ot$1={collections:`rdw-nav-collections`,following:`rdw-nav-following`,favorites:`rdw-nav-favorites`,stats:`rdw-nav-stats`,settings:`rdw-nav-settings`},st$1={collections:`Collections`,following:`Following`,favorites:`Favorites`,stats:`Statistics`,settings:`RuleDesk`},ct$1=`my-favorites-container`,ut$1=`rdw-feed-menu`,dt$1={scrollRegion:`rdw-scroll-region`,settingsGroup:`rdw-settings-group`,settingsRow:`rdw-settings-row`,settingsRowSub:`rdw-settings-row--sub`,settingsCaption:`rdw-settings-caption`,pageCard:`rdw-page-card`},ft$1=`No followed artists yet`,pt$1=`Follow artists with the Follow button next to their name in the tag list.`,mt$1=`Filter artists (several: space or comma)`,ht$1=`rdw-feature-`,gt$1=`rdw-feature-choice-`,_t$1=`rdw-updates-group-size`,vt$1=`rdw-playlist-chunk-size`,yt$1=`rdw-artist-filter`,bt$1=`rdw-grid-fav-buttons`,xt$1=`rdw-tweaks-enabled`,St$1=`Collapse tags`,Ct$1=`tag-wiki`,wt$1=`Tag description on “?”`; exports({dd:t,d4:n,bA:r,cf:i,cd:a,aL:c,l:l,u:u,d:d,cP:f,cQ:ee,cO:te,ah:re,C:ie,cw:ae,cr:oe,cx:se,M:ce,ag:le,Q:ue,R:de,bN:fe,bO:pe,bV:me,b$:he,c0:ge,c3:_e,c1:ve,c2:ye,Z:be,c7:xe,bJ:Ce,da:we,a9:Te,cs:Ee,a_:De,bm:Oe,bI:je,bi:Fe,a$:Ie,a1:Le,dG:Re,cv:We,K:Ke,q:qe,J:Je,Y:Ye,cM:Xe,cD:Ze,cE:Qe,bh:$e,by:et,aU:tt,bf:nt,r:rt,i:it,y:at$1,o:ot$1,s:st$1,p:ct$1,j:ut$1,bY:dt$1,ds:ft$1,dr:pt$1,dt:mt$1,cV:ht$1,cX:gt$1,cB:_t$1,cy:vt$1,du:yt$1,cK:bt$1,cI:xt$1});function Tt$1(e,t){return e===`tag-groups`?St$1:e===Ct$1?wt$1:t}var Et$1=/[?#]/,Dt$1=1;function Ot$1(e){return He.some(t=>t===e)}function kt$1(e){return typeof e!=`string`}function At$1(e){return kt$1(e)?Re:e}function jt$1(e){return `${p}${Re}/${encodeURIComponent(e)}`}function Mt$1(e){return `${We}${encodeURIComponent(e)}`}function Nt$1(e){return `${Ge}${encodeURIComponent(e)}`}function Pt$1(e){if(!e.startsWith(`#rdw-dc=`))return null;let t=e.slice(8);if(t.length===0)return null;try{return decodeURIComponent(t)}catch{return t}}function Ft$1(e){return kt$1(e)?jt$1(e.collectionId):`${p}${e}`}function It$1(e){return e.split(Et$1)[0]??``}function Lt$1(e){try{return decodeURIComponent(e)}catch{return e}}function Rt$1(e){let t=e.trim();if(t.startsWith(`#rdw-c`)||!t.startsWith(`#rdw/`))return null;let n=t.slice(5).split(`/`),r=It$1(n[0]??``);if(!Ot$1(r))return null;if(r!==`collections`||n.length<=Dt$1)return r;let i=Lt$1(It$1(n[Dt$1]??``));return i.length===0?Re:{kind:Ue,collectionId:i}}function zt$1(){return `
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
  pointer-events: none;`,Xt$1=`rdw-fav-browsing`,Zt$1=`rdw-fav-results`,Qt$1=`favorites-view`,$t$1=`scroll`,en$1=`ai-posts`,tn$1=`hide`,nn$1=`favorites`; exports({aW:Jt$1,aX:Yt$1,cl:Xt$1,co:Zt$1,ck:Qt$1,cj:$t$1,$:en$1,a2:tn$1,a0:nn$1});function rn$1(){try{return GM_getValue(`ruledesk-web.debug`,void 0)===!0}catch{return  false}}var m={debug(e,...t){rn$1()&&console.debug(`[ruledesk-web] ${e}`,...t);},info(e,...t){rn$1()&&console.info(`[ruledesk-web] ${e}`,...t);},warn(e,...t){console.warn(`[ruledesk-web] ${e}`,...t);},error(e,...t){console.error(`[ruledesk-web] ${e}`,...t);}},an$1={thumb:`span.thumb`,thumbLink:`a[href*="s=view"]`,previewImage:`img.preview`,cardFavButton:`button.${Ie.cardFav}`,favoritesDeleteLink:`a[onclick]`,tagSidebar:`ul#tag-sidebar`,tagTypeArtist:`li.tag-type-artist`,tagTypeCharacter:`li.tag-type-character`,tagTypeCopyright:`li.tag-type-copyright`,tagSidebarRow:`ul#tag-sidebar > li[class*="tag-type-"]`,tagCount:`span.tag-count`,imageList:`div.image-list`,commentList:`div#comments div#comment-list`,commentThumb:`div#comments div#comment-list > div.post > div.col1.thumb`,commentTags:`div#comments div#comment-list > div.post > div.col2 > div.header > div.tags`,postListContent:`#post-list div.content`,contentRoot:`#content`,artistFollowButton:`button.${Ie.artistFollow}`,filterAiCheckbox:`input.toggleSwitch#chkFilterAI`,filterAiRow:`li:has(> label > span.switch > input.toggleSwitch#chkFilterAI)`,postPrevSearchLink:`a#prev_search_link`,postNextSearchLink:`a#next_search_link`,pagination:`div.pagination`,paginationLastPage:`div.pagination a[alt="last page"]`,paginationPageLink:`div.pagination > a[href]`,tagsHeadingAfterSearchTools:`#rdw-search-tools + h5`},on$1=/^s(\d+)$/,sn$1=/^p(\d+)$/,cn$1=/s=delete&id=(\d+)/; exports({m:m,ae:an$1});function ln$1(e){let t=on$1.exec(e.id);if(t===null)return null;let n=t[1];return n===void 0?null:n}function un$1(e){let t=e.querySelector(an$1.thumbLink);if(t===null)return null;let n=sn$1.exec(t.id);if(n===null)return null;let r=n[1];return r===void 0?null:r}function dn$1(e){let t=e.parentElement;if(t===null)return null;let n=sn$1.exec(t.id);if(n===null)return null;let r=n[1];return r===void 0?null:r}function fn$1(e){let t=cn$1.exec(e);if(t===null)return null;let n=t[1];return n===void 0?null:n}var h=exports("bZ",{bg:`--rdw-bg`,surface:`--rdw-surface`,surface2:`--rdw-surface-2`,border:`--rdw-border`,text:`--rdw-text`,muted:`--rdw-muted`,accent:`--rdw-accent`,accentSoft:`--rdw-accent-soft`,danger:`--rdw-danger`,dangerSoft:`--rdw-danger-soft`,warn:`--rdw-warn`,warnSoft:`--rdw-warn-soft`,tagArtist:`--rdw-tag-artist`,tagCharacter:`--rdw-tag-character`,tagCopyright:`--rdw-tag-copyright`,tagMetadata:`--rdw-tag-metadata`,radiusS:`--rdw-radius-s`,radiusM:`--rdw-radius-m`,radiusL:`--rdw-radius-l`,shadow1:`--rdw-shadow-1`,shadow2:`--rdw-shadow-2`,font:`--rdw-font`,segTrack:`--rdw-seg-track`,segText:`--rdw-seg-text`,segOn:`--rdw-seg-on`,segOnText:`--rdw-seg-on-text`,backgroundImage:`--rdw-background-image`,backgroundDim:`--rdw-background-dim`}),pn$1={bg:`#f3f5f7`,surface:`#ffffff`,surface2:`#f4f6f8`,border:`#cfd6dd`,text:`#1c2228`,muted:`#5a6672`,accent:`#2f6fed`,accentSoft:`#e8f0fe`,danger:`#c0392b`,dangerSoft:`#fdecea`,warn:`#6b4e00`,warnSoft:`#fff4d6`,tagArtist:`#b00020`,tagCharacter:`#0a7a2f`,tagCopyright:`#8e24aa`,tagMetadata:`#ff8800`,radiusS:`6px`,radiusM:`8px`,radiusL:`10px`,shadow1:`0 1px 2px rgba(0, 0, 0, 0.06)`,shadow2:`0 8px 24px rgba(0, 0, 0, 0.25)`,font:`system-ui, "Segoe UI", sans-serif`,segTrack:`#c9d1d9`,segText:`#4a5560`,segOn:`#ffffff`,segOnText:`#1c2228`},mn$1={bg:`#16181c`,surface:`#1e2228`,surface2:`#262b33`,border:`#3a424c`,text:`#e8edf2`,muted:`#8a96a3`,accent:`#4c8bf5`,accentSoft:`#1a2f5a`,danger:`#e57373`,dangerSoft:`#3d1f1f`,warn:`#f0d68a`,warnSoft:`#3a3016`,tagArtist:`#ff6b81`,tagCharacter:`#5dcea0`,tagCopyright:`#ce93d8`,tagMetadata:`#ffb74d`,radiusS:`6px`,radiusM:`8px`,radiusL:`10px`,shadow1:`0 1px 2px rgba(0, 0, 0, 0.35)`,shadow2:`0 8px 24px rgba(0, 0, 0, 0.55)`,font:`system-ui, "Segoe UI", sans-serif`,segTrack:`transparent`,segText:`#8a96a3`,segOn:`#3a424c`,segOnText:`#e8edf2`},hn$1=/^#([0-9a-fA-F]{3})$/,gn$1=/^#([0-9a-fA-F]{6})$/,_n$1=.03928,vn$1=12.92,yn$1=2.4,bn$1=.055,xn$1=1.055,Sn$1=.2126,Cn$1=.7152,wn$1=.0722;function Tn$1(e){let t=e/255;return t<=_n$1?t/vn$1:((t+bn$1)/xn$1)**yn$1}function En$1(e){let t=hn$1.exec(e.trim());if(t!==null){let e=t[1];return e===void 0?null:{r:Number.parseInt(e[0]+e[0],16),g:Number.parseInt(e[1]+e[1],16),b:Number.parseInt(e[2]+e[2],16)}}let n=gn$1.exec(e.trim());if(n!==null){let e=n[1];return e===void 0?null:{r:Number.parseInt(e.slice(0,2),16),g:Number.parseInt(e.slice(2,4),16),b:Number.parseInt(e.slice(4,6),16)}}return null}function Dn$1(e){let t=En$1(e);if(t===null)return null;let n=Tn$1(t.r),r=Tn$1(t.g),i=Tn$1(t.b);return Sn$1*n+Cn$1*r+wn$1*i}var On$1=.05,kn$1=`#aae5a4`,An$1=`#89cf81`,jn$1=`#98d491`,Mn$1=`#000000`,Nn$1=`#000099`,Pn$1=`#4d4d4d`,Fn$1=`#303a30`,In$1=`#303030`,Ln$1=`#505a50`,Rn$1=`#c0c0c0`,zn$1=`#b0e0b0`,Bn$1=`#a8a8a8`,Vn$1=`#1a4d1a`,Hn$1=kn$1; exports({b_:kn$1,A:An$1,F:Fn$1,L:Ln$1,z:zn$1,V:Vn$1,H:Hn$1});function Un$1(e,t){let n=Dn$1(e),r=Dn$1(t);if(n===null||r===null)return null;let i=Math.max(n,r),a=Math.min(n,r);return (i+On$1)/(a+On$1)}function Wn$1(e,t,n,r){let i=Un$1(t,e);if(i!==null&&i>=r)return t;for(let t of n){let n=Un$1(t,e);if(n!==null&&n>=r)return t}return t}function Gn$1(e,t,n=[`#ffffff`]){return Wn$1(e,t,n,3)}function Kn$1(e){if(e===void 0)return `light`;let t=Dn$1(e);return t!==null&&t<.5?`dark`:`light`}function g(e){return e.replace(/</g,`\\3c `)}function qn$1(e){return [`${h.bg}: ${g(e.bg)};`,`${h.surface}: ${g(e.surface)};`,`${h.surface2}: ${g(e.surface2)};`,`${h.border}: ${g(e.border)};`,`${h.text}: ${g(e.text)};`,`${h.muted}: ${g(e.muted)};`,`${h.accent}: ${g(e.accent)};`,`${h.accentSoft}: ${g(e.accentSoft)};`,`${h.danger}: ${g(e.danger)};`,`${h.dangerSoft}: ${g(e.dangerSoft)};`,`${h.warn}: ${g(e.warn)};`,`${h.warnSoft}: ${g(e.warnSoft)};`,`${h.tagArtist}: ${g(e.tagArtist)};`,`${h.tagCharacter}: ${g(e.tagCharacter)};`,`${h.tagCopyright}: ${g(e.tagCopyright)};`,`${h.tagMetadata}: ${g(e.tagMetadata)};`,`${h.radiusS}: ${g(e.radiusS)};`,`${h.radiusM}: ${g(e.radiusM)};`,`${h.radiusL}: ${g(e.radiusL)};`,`${h.shadow1}: ${g(e.shadow1)};`,`${h.shadow2}: ${g(e.shadow2)};`,`${h.font}: ${g(e.font)};`,`${h.segTrack}: ${g(e.segTrack)};`,`${h.segText}: ${g(e.segText)};`,`${h.segOn}: ${g(e.segOn)};`,`${h.segOnText}: ${g(e.segOnText)};`].join(`
  `)}function Jn$1(e,t=`:root`){return `${t} {\n  ${qn$1(e)}\n}\n`}function Yn$1(e,t){e.style.setProperty(h.bg,t.bg),e.style.setProperty(h.surface,t.surface),e.style.setProperty(h.surface2,t.surface2),e.style.setProperty(h.border,t.border),e.style.setProperty(h.text,t.text),e.style.setProperty(h.muted,t.muted),e.style.setProperty(h.accent,t.accent),e.style.setProperty(h.accentSoft,t.accentSoft),e.style.setProperty(h.danger,t.danger),e.style.setProperty(h.dangerSoft,t.dangerSoft),e.style.setProperty(h.warn,t.warn),e.style.setProperty(h.warnSoft,t.warnSoft),e.style.setProperty(h.tagArtist,t.tagArtist),e.style.setProperty(h.tagCharacter,t.tagCharacter),e.style.setProperty(h.tagCopyright,t.tagCopyright),e.style.setProperty(h.tagMetadata,t.tagMetadata),e.style.setProperty(h.radiusS,t.radiusS),e.style.setProperty(h.radiusM,t.radiusM),e.style.setProperty(h.radiusL,t.radiusL),e.style.setProperty(h.shadow1,t.shadow1),e.style.setProperty(h.shadow2,t.shadow2),e.style.setProperty(h.font,t.font),e.style.setProperty(h.segTrack,t.segTrack),e.style.setProperty(h.segText,t.segText),e.style.setProperty(h.segOn,t.segOn),e.style.setProperty(h.segOnText,t.segOnText);}function Xn$1(e,t){t.backgroundImage!==void 0&&t.backgroundImage.length>0&&e.style.setProperty(h.backgroundImage,`url("${t.backgroundImage.replace(/[\\"]/g,`\\$&`)}")`),t.backgroundDim!==void 0&&e.style.setProperty(h.backgroundDim,String(t.backgroundDim));}function Zn$1(e){e.style.removeProperty(h.accent),e.style.removeProperty(h.bg),e.style.removeProperty(h.surface),e.style.removeProperty(h.text),e.style.removeProperty(h.backgroundImage),e.style.removeProperty(h.backgroundDim);}function Qn$1(e){let t=Object.values(e).filter(e=>typeof e==`number`);return Object.entries(e).filter(([e,n])=>t.indexOf(+e)===-1).map(([e,t])=>t)}function $n$1(e,t){return typeof t==`bigint`?t.toString():t}var er$1=class er{constructor(e){this._getter=e,this._value=void 0;}get value(){let e=this._getter;return e!==void 0&&(this._value=e(),this._getter=void 0),this._value}};function tr$1(e){return new er$1(e)}function nr$1(e){return e==null}function rr$1(e){let t=+!!e.startsWith(`^`),n=e.endsWith(`$`)?e.length-1:e.length;return e.slice(t,n)}function ir$1(e,t,n){Object.defineProperty(e,t,{value:n,writable:true,enumerable:true,configurable:true});}var ar$1=`captureStackTrace`in Error?Error.captureStackTrace:(...e)=>{};function or$1(e){return typeof e==`object`&&!!e&&!Array.isArray(e)}function sr$1(e){if(or$1(e)===false)return  false;let t=e.constructor;if(t===void 0||typeof t!=`function`)return  true;let n=t.prototype;return or$1(n)!==false&&Object.prototype.hasOwnProperty.call(n,`isPrototypeOf`)!==false}var cr$1=new Set([`string`,`number`,`symbol`]);function lr$1(e){return e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`)}function ur$1(e,t,n){let r=new e._zod.constr(t??e._zod.def);return (!t||n?.parent)&&(r._zod.parent=e),r}function _$1(e){let t=e;if(!t)return {};if(typeof t==`string`)return {error:()=>t};if(t?.message!==void 0){if(t?.error!==void 0)throw Error("Cannot specify both `message` and `error` params");t.error=t.message;}return delete t.message,typeof t.error==`string`?{...t,error:()=>t.error}:t}function dr$1(e){return Object.keys(e).filter(t=>e[t]._zod.optin!==void 0&&e[t]._zod.optout===`optional`)}var fr$1={safeint:[-9007199254740991,2**53-1],int32:[-2147483648,2147483647],uint32:[0,4294967295],float32:[-34028234663852886e22,34028234663852886e22],float64:[-Number.MAX_VALUE,Number.MAX_VALUE]};function v$1(e,t=0){if(e.aborted===true)return  true;for(let n=t;n<e.issues.length;n++)if(e.issues[n]?.continue!==true)return  true;return  false}function pr$1(e,t=0){if(e.aborted===true)return  true;for(let n=t;n<e.issues.length;n++)if(e.issues[n]?.continue===false)return  true;return  false}function mr$1(e,t){return t.map(t=>{var n;return (n=t).path??(n.path=[]),t.path.unshift(e),t})}function hr$1(e){return typeof e==`string`?e:e?.message}function gr$1(e){let t=[];for(let n of e??[]){let e=n._zod.def;if(!/_(length|size)$|_equals$/.test(e.check))break;let r=e.maximum??e.length??e.size;r>=0&&t.push([r,n]);}return t}function _r$1(e,t,n){var r;for(let i=t;i<e.length;i++)(r=e[i]).schema??(r.schema=n);}function vr$1(e,t,n){var r;let i=e.inst?._zod?.traits;i?.has(`$ZodType`)&&(i.has(`$ZodCheck`)?(r=e).schema??(r.schema=e.inst):e.schema=e.inst);let a=e.schema===e.inst?void 0:e.schema?._zod.def?.error,o=e.message?e.message:hr$1(e.inst?._zod.def?.error?.(e))??hr$1(a?.(e))??hr$1(t?.error?.(e))??hr$1(n.customError?.(e))??hr$1(n.localeError?.(e))??`Invalid input`,s={};for(let t of Object.keys(e))t!==`inst`&&t!==`schema`&&t!==`continue`&&t!==`input`&&t!==`__proto__`&&(s[t]=e[t]);return s.path??=[],s.message=o,t?.reportInput&&(s.input=e.input),s}var yr$1=/[\uD800-\uDBFF]/;function br$1(e){let t=e.length;if(!yr$1.test(e))return t;let n=t;for(let r=0;r<t-1;r++)(e.charCodeAt(r)&64512)==55296&&(e.charCodeAt(r+1)&64512)==56320&&(n--,r++);return n}function xr$1(e){return Array.isArray(e)?`array`:typeof e==`string`?`string`:`unknown`}function Sr$1(e,t){for(let n in t){let r=Object.getOwnPropertyDescriptor(t,n);r.get?Object.defineProperty(e,n,{...r,enumerable:false}):Tr$1(e,n,r.value);}}function Cr$1(e,t,n,r=true){return Object.defineProperty(e,t,{configurable:true,writable:true,enumerable:r,value:n}),n}function wr$1(e,t,n){return Cr$1(e,t,n,false)}function Tr$1(e,t,n){Object.defineProperty(e,t,{configurable:true,get(){return this==null?n:Cr$1(this,t,n.bind(this))},set(e){Cr$1(this,t,e);}});}function Er$1(e,t){let n=Object.getPrototypeOf(e);return t in n?void 0:n}var Dr$1,y$1=false,Or$1={configurable:true,get(){y$1=true;}};function b$1(e,t,n){let r=Object.getPrototypeOf(e._zod);t in r&&Dr$1!==e._zod?Dr$1=void 0:(Dr$1=e._zod,Object.defineProperty(r,t,{configurable:true,get(){Object.defineProperty(this,t,Or$1);let e=y$1;y$1=false;try{let r=n(this);return y$1?delete this[t]:Object.defineProperty(this,t,{configurable:!0,writable:!0,value:r}),y$1||=e,r}catch(n){throw delete this[t],y$1||=e,n}},set(e){Object.defineProperty(this,t,{configurable:true,writable:true,value:e});}}));}function kr$1(e,t,n,r){let i=Er$1(e,t);i&&Object.defineProperty(i,t,{configurable:true,get(){let e={configurable:true,writable:true,enumerable:r,value:void 0};return Object.defineProperty(this,t,e),e.value=n(this),Object.defineProperty(this,t,e),e.value},set(e){Object.defineProperty(this,t,{configurable:true,writable:true,enumerable:r,value:e});}});}var Ar$1,jr$1={value:void 0,enumerable:false},Mr$1=`captureStackTrace`in Error?Error:null;function Nr$1(e){let t=Mr$1;if(t){let n=t.stackTraceLimit;if(typeof n==`number`){try{t.stackTraceLimit=0;}catch{return Mr$1=null,new e}try{return new e}finally{t.stackTraceLimit=n;}}}return new e}function x$1(e,t,n,r){let i={};function a(e){this.def=e,this.constr=d,this.traits=new Set;}a.prototype=i;let o=n,s=o&&new WeakSet;function c(n,r){if(!n._zod){jr$1.value=new a(r);try{Object.defineProperty(n,"_zod",jr$1);}finally{jr$1.value=void 0;}}else if(n._zod.traits.has(e))return;if(n._zod.traits.add(e),t(n,r),s){let e=Object.getPrototypeOf(n),t=n._zod.constr.prototype,r=e;for(;r&&r!==t;)r=Object.getPrototypeOf(r);let i=r??e;s.has(i)||(s.add(i),Sr$1(i,o));}let i=d.prototype;for(let e in i)Object.prototype.hasOwnProperty.call(i,e)&&(e in n||(n[e]=i[e].bind(n)));}let l=r?.Parent??Object;class u extends l{}Object.defineProperty(u,"name",{value:e});function d(e){let t=r?.Parent?Nr$1(u):this;c(t,e);let n=t._zod.deferred;if(n){for(let e of n)e();t._zod.deferred=void 0;}let i=globalThis.__zod_globalConfig?.postProcessor;return i&&i(t),t}return Object.defineProperty(d,"init",{value:c}),Object.defineProperty(d,Symbol.hasInstance,{value:t=>r?.Parent&&t instanceof r.Parent?true:t?._zod?.traits?.has(e)}),Object.defineProperty(d,"name",{value:e}),d}var Pr$1=class Pr extends Error{constructor(){super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);}};(Ar$1=globalThis).__zod_globalConfig??(Ar$1.__zod_globalConfig={});var Fr$1=globalThis.__zod_globalConfig;function S$1(e){return Fr$1}function Ir$1(){let e=this._zod;return e.message??=JSON.stringify(e.def,$n$1,2),e.message}function Lr$1(e){this._zod.message=e;}var Rr$1={get:Ir$1,set:Lr$1,enumerable:true,configurable:true},zr$1={value:void 0,enumerable:false},Br$1=new WeakSet([Object.prototype,Error.prototype]),Vr$1=x$1(`$ZodError`,(e,t)=>{e.name=`$ZodError`,zr$1.value=t,Object.defineProperty(e,"issues",zr$1),zr$1.value=void 0,Object.defineProperty(e,"message",Rr$1);let n=Object.getPrototypeOf(e);Br$1.has(n)||(Br$1.add(n),Object.defineProperty(n,"toString",{configurable:true,enumerable:false,get(){let e=()=>this.message;return Object.defineProperty(this,"toString",{value:e,configurable:true,writable:true}),e},set(e){Object.defineProperty(this,"toString",{value:e,configurable:true,writable:true});}}));},void 0,{Parent:Error}),Hr$1=(e=>{let t=(n,r,i,a)=>{let o=i?{...i,async:false}:{async:false},s=n._zod.run({value:r,issues:[]},o);if(s instanceof Promise)throw new Pr$1;if(s.issues.length){let n=new((a?.Err)??e)(s.issues.map(e=>vr$1(e,o,S$1())));throw ar$1(n,a?.callee??t),n}return s.value};return t})(Vr$1),Ur$1=(e=>{let t=async(n,r,i,a)=>{let o=i?{...i,async:true}:{async:true},s=n._zod.run({value:r,issues:[]},o);if(s instanceof Promise&&(s=await s),s.issues.length){let n=new((a?.Err)??e)(s.issues.map(e=>vr$1(e,o,S$1())));throw ar$1(n,a?.callee??t),n}return s.value};return t})(Vr$1),Wr$1=(e=>(t,n,r)=>{let i=r?{...r,async:false}:{async:false},a=t._zod.run({value:n,issues:[]},i);if(a instanceof Promise)throw new Pr$1;return a.issues.length?Gr$1(e,a.issues,i):{success:true,data:a.value}})(Vr$1);function Gr$1(e,t,n){let r;return {success:false,get error(){return r||(r=new e(t.map(e=>vr$1(e,n,S$1()))),t=void 0,n=void 0),r},set error(e){r=e,t=void 0,n=void 0;}}}var Kr$1=(e=>async(t,n,r)=>{let i=r?{...r,async:true}:{async:true},a=t._zod.run({value:n,issues:[]},i);return a instanceof Promise&&(a=await a),a.issues.length?Gr$1(e,a.issues,i):{success:true,data:a.value}})(Vr$1),qr$1=/^[\s\S]{0,}$/,Jr$1=/^-?\d+(?:\.\d+)?$/,Yr$1=/^(?:true|false)$/i,Xr$1=x$1(`$ZodCheck`,(e,t)=>{var n;e._zod??={},e._zod.def=t,(n=e._zod).onattach??(n.onattach=[]);}),Zr$1=e=>{let t=e.value;return !nr$1(t)&&t.length!==void 0},Qr$1={number:`number`,bigint:`bigint`,object:`date`},$r$1=x$1(`$ZodCheckGreaterThan`,(e,t)=>{Xr$1.init(e,t);let n=Qr$1[typeof t.value];e._zod.check=r=>{(t.inclusive?r.value>=t.value:r.value>t.value)||r.issues.push({origin:Qr$1[typeof r.value]??n,code:`too_small`,minimum:typeof t.value==`object`?t.value.getTime():t.value,input:r.value,inclusive:t.inclusive,inst:e,continue:!t.abort});};}),ei$1=x$1(`$ZodCheckNumberFormat`,(e,t)=>{Xr$1.init(e,t),t.format=t.format||`float64`;let n=t.format?.includes(`int`),r=n?`int`:`number`,[i,a]=fr$1[t.format];e._zod.check=o=>{let s=o.value;if(n){if(!Number.isInteger(s)){o.issues.push({expected:r,format:t.format,code:`invalid_type`,continue:false,input:s,inst:e});return}if(!Number.isSafeInteger(s)){s>0?o.issues.push({input:s,code:`too_big`,maximum:2**53-1,note:`Integers must be within the safe integer range.`,inst:e,origin:r,inclusive:true,continue:!t.abort}):o.issues.push({input:s,code:`too_small`,minimum:-9007199254740991,note:`Integers must be within the safe integer range.`,inst:e,origin:r,inclusive:true,continue:!t.abort});return}}s<i&&o.issues.push({origin:`number`,input:s,code:`too_small`,minimum:i,inclusive:true,inst:e,continue:!t.abort}),s>a&&o.issues.push({origin:`number`,input:s,code:`too_big`,maximum:a,inclusive:true,inst:e,continue:!t.abort});};}),ti$1=x$1(`$ZodCheckMinLength`,(e,t)=>{var n;Xr$1.init(e,t),(n=e._zod.def).when??(n.when=Zr$1),e._zod.check=n=>{let r=n.value,i=r.length;if((typeof r==`string`&&i>=t.minimum&&i<t.minimum*2?br$1(r):i)>=t.minimum)return;let a=xr$1(r);n.issues.push({origin:a,code:`too_small`,minimum:t.minimum,inclusive:true,input:r,inst:e,continue:!t.abort});};}),ni$1={major:4,minor:6,patch:7},C$1=x$1(`$ZodType`,(e,t)=>{var n;e??={},e._zod.def=t,e._zod.bag=e._zod.bag||{},e._zod.version=ni$1;let r=e._zod.def.checks,i=e._zod.traits.has(`$ZodCheck`)?[e,...r??[]]:r?.length?[...r]:[];for(let t of i)for(let n of t._zod.onattach)n(e);if(i.length===0)(n=e._zod).deferred??(n.deferred=[]),e._zod.deferred?.push(()=>{e._zod.run=e._zod.parse;});else {let t=(t,n,r)=>{if(t.memo)return t;let i=v$1(t),a;for(let o of n){if(o._zod.def.when){if(pr$1(t)||!o._zod.def.when(t))continue}else if(i)continue;let n=t.issues.length,s=o._zod.check(t);if(s instanceof Promise&&r?.async===false)throw new Pr$1;if(a||s instanceof Promise)a=(a??Promise.resolve()).then(async()=>{await s,t.issues.length!==n&&(_r$1(t.issues,n,e),i||=v$1(t,n));});else {if(t.issues.length===n)continue;_r$1(t.issues,n,e),i||=v$1(t,n);}}return a?a.then(()=>t):t},n=(n,r,a)=>{if(v$1(n))return n.aborted=true,n;let o=t(r,i,a);if(o instanceof Promise){if(a.async===false)throw new Pr$1;return o.then(t=>e._zod.parse(t,a))}return e._zod.parse(o,a)};e._zod.run=(r,a)=>{if(a.skipChecks)return e._zod.parse(r,a);if(a.direction===`backward`){let t=e._zod.parse({value:r.value,issues:[]},{...a,skipChecks:true});return t instanceof Promise?t.then(e=>n(e,r,a)):n(t,r,a)}let o=e._zod.parse(r,a);if(o instanceof Promise){if(a.async===false)throw new Pr$1;return o.then(e=>t(e,i,a))}return t(o,i,a)};}},{get"~standard"(){return wr$1(this,`~standard`,ai$1(this))},set"~standard"(e){Cr$1(this,`~standard`,e);}}),ri$1=(e,t)=>e.issues.length?{issues:e.issues.map(e=>vr$1(e,t,S$1()))}:{value:e.value};async function ii$1(e,t){let n={async:true};return ri$1(await e._zod.run({value:t,issues:[]},n),n)}function ai$1(e){return {validate:t=>{let n={async:false};try{let r=e._zod.run({value:t,issues:[]},n);if(!(r instanceof Promise))return ri$1(r,n)}catch{}return ii$1(e,t)},vendor:`zod`,version:1}}var oi$1=x$1(`$ZodString`,(e,t)=>{C$1.init(e,t),e._zod.pattern=t.pattern??qr$1,e._zod.parse=(n,r)=>{if(t.coerce)try{n.value=String(n.value);}catch{}return typeof n.value==`string`||n.issues.push({expected:`string`,code:`invalid_type`,input:n.value,inst:e}),n};}),si$1=x$1(`$ZodNumber`,(e,t)=>{C$1.init(e,t),e._zod.pattern=Jr$1,e._zod.parse=(n,r)=>{if(t.coerce)try{n.value=Number(n.value);}catch{}let i=n.value;if(typeof i==`number`&&!Number.isNaN(i)&&Number.isFinite(i))return n;let a=typeof i==`number`?Number.isNaN(i)?`NaN`:Number.isFinite(i)?void 0:String(i):void 0;return n.issues.push({expected:`number`,code:`invalid_type`,input:i,inst:e,...a?{received:a}:{}}),n};}),ci$1=x$1(`$ZodNumberFormat`,(e,t)=>{ei$1.init(e,t),si$1.init(e,t);}),li$1=x$1(`$ZodBoolean`,(e,t)=>{C$1.init(e,t),e._zod.pattern=Yr$1,e._zod.parse=(n,r)=>{if(t.coerce)try{n.value=!!n.value;}catch{}let i=n.value;return typeof i==`boolean`||n.issues.push({expected:`boolean`,code:`invalid_type`,input:i,inst:e}),n};}),ui$1=x$1(`$ZodUnknown`,(e,t)=>{C$1.init(e,t),e._zod.parse=e=>e;});function di$1(e,t){let n=gr$1(e._zod.def.checks);if(!n.length)return;let r=Math.min(...n.map(e=>e[0])),i=e._zod.parse;e._zod.parse=(n,a)=>{let o=t(n.value);if(o>r&&!a?.skipChecks&&a?.direction!==`backward`){for(let[t,r]of gr$1(e._zod.def.checks))if(o>t&&r._zod.def.when(n)){let t=n.issues.length;return r._zod.check(n),n.issues[t].continue=false,_r$1(n.issues,t,e),n}}return i(n,a)};}var fi$1=e=>Array.isArray(e)?e.length:-1;function pi$1(e,t,n){e.issues.length&&t.issues.push(...mr$1(n,e.issues)),t.value[n]=e.value;}var mi$1=x$1(`$ZodArray`,(e,t)=>{C$1.init(e,t);let n=Fr$1.memoizer;n?.attach(e),e._zod.parse=(r,i)=>{let a=r.value;if(!Array.isArray(a))return r.issues.push({expected:`array`,code:`invalid_type`,input:a,inst:e}),r;r.value=n?n.alloc(e,r,Array(a.length),i):Array(a.length);let o=[],s=i?.abortEarly;for(let e=0;e<a.length;e++){let n=a[e],c=t.element._zod.run({value:n,issues:[]},i);if(c instanceof Promise)o.push(c.then(t=>pi$1(t,r,e)));else if(pi$1(c,r,e),s&&c.issues.length!==0&&v$1(c))break}return o.length?Promise.all(o).then(()=>r):r},di$1(e,fi$1);});function hi$1(e,t,n,r,i,a){let o=n in r,s=a===`optional`;if(o||!s||i!==`optional`){if(e.issues.length){if(i!==void 0&&s&&!o)return;t.issues.push(...mr$1(n,e.issues));}!o&&i===void 0?e.issues.length||t.issues.push({code:`invalid_type`,expected:`nonoptional`,input:void 0,path:[n]}):e.value===void 0?(o||i===`defaulted`&&!s)&&(t.value[n]=void 0):t.value[n]=e.value;}}var gi$1=[];function _i$1(e){let t=Object.keys(e.shape),n=Object.getOwnPropertySymbols(e.shape),r=n.length?n:gi$1,i=r.length?[...t,...r]:t;for(let t of i)if(!e.shape?.[t]?._zod?.traits?.has(`$ZodType`))throw Error(`Invalid element at key "${String(t)}": expected a Zod schema`);let a=dr$1(e.shape);return {...e,allKeys:i,symbolKeys:r,keySet:new Set(t),numKeys:t.length,optionalKeys:new Set(a)}}function vi$1(e,t,n,r,i,a,o){let s=[],c=i.keySet,l=i.catchall._zod,u=l.def.type,d=l.optin,f=l.optout,ee=0;for(let i in t){if(o&&n.issues.length!==ee){if(v$1(n,ee))break;ee=n.issues.length;}if(c.has(i))continue;if(i===`__proto__`){u===`never`&&s.push(i);continue}if(u===`never`){s.push(i);continue}let a=l.run({value:t[i],issues:[]},r);a instanceof Promise?e.push(a.then(e=>hi$1(e,n,i,t,d,f))):hi$1(a,n,i,t,d,f);}return s.length&&n.issues.push({code:`unrecognized_keys`,keys:s,input:t,inst:a,continue:true}),e.length?Promise.all(e).then(()=>n):n}var yi$1=x$1(`$ZodObject`,(e,t)=>{C$1.init(e,t);let n=Object.getOwnPropertyDescriptor(t,`shape`),r=n?.get?n.get.raw:t.shape??{};if(r){let e=()=>{let n={...r};return Object.defineProperty(t,"shape",{value:n}),e.raw=n,n};e.raw=r,Object.defineProperty(t,"shape",{get:e});}let i=tr$1(()=>_i$1(t));b$1(e,`propValues`,e=>{let t=e.def.shape,n={};for(let e in t){let r=t[e]._zod;if(r.values){Object.prototype.hasOwnProperty.call(n,e)||ir$1(n,e,new Set);for(let t of r.values)n[e].add(t);r.optin!==void 0&&n[e].add(void 0);}}return n});let a=or$1,o=t.catchall,s,c=Fr$1.memoizer;c?.attach(e),e._zod.parse=(t,n)=>{s??=i.value;let r=t.value;if(!a(r))return t.issues.push({expected:`object`,code:`invalid_type`,input:r,inst:e}),t;t.value=c?c.alloc(e,t,{},n):{};let l=[],u=s.shape,d=n?.abortEarly,f=t.issues.length;for(let e of s.allKeys){if(d&&t.issues.length!==f){if(v$1(t,f))break;f=t.issues.length;}if(e===`__proto__`)continue;let i=u[e],a=i._zod.optin,o=i._zod.optout,s=i._zod.run({value:r[e],issues:[]},n);s instanceof Promise?l.push(s.then(n=>hi$1(n,t,e,r,a,o))):hi$1(s,t,e,r,a,o);}return o?vi$1(l,r,t,n,i.value,e,d===true):l.length?Promise.all(l).then(()=>t):t};}),bi$1=x$1(`$ZodRecord`,(e,t)=>{C$1.init(e,t);let n=Fr$1.memoizer;n?.attach(e),e._zod.parse=(r,i)=>{let a=r.value;if(!sr$1(a))return r.issues.push({expected:`record`,code:`invalid_type`,input:a,inst:e}),r;let o=[],s=t.keyType._zod.values;if(s&&!t.partial){r.value=n?n.alloc(e,r,{},i):{};let c=new Set;for(let n of s)if(typeof n==`string`||typeof n==`number`||typeof n==`symbol`){if(c.add(typeof n==`number`?n.toString():n),n===`__proto__`)continue;let s=t.keyType._zod.run({value:n,issues:[]},i);if(s instanceof Promise)throw Error(`Async schemas not supported in object keys currently`);if(s.issues.length){r.issues.push({code:`invalid_key`,origin:`record`,issues:s.issues.map(e=>vr$1(e,i,S$1())),input:n,path:[n],inst:e});continue}let l=s.value;if(l===`__proto__`)continue;let u=t.valueType._zod.run({value:a[n],issues:[]},i);u instanceof Promise?o.push(u.then(e=>{e.issues.length&&r.issues.push(...mr$1(n,e.issues)),r.value[l]=e.value;})):(u.issues.length&&r.issues.push(...mr$1(n,u.issues)),r.value[l]=u.value);}let l;for(let e in a)if(!c.has(e)){if(t.mode===`loose`){if(e===`__proto__`)continue;r.value[e]=a[e];}else l??=[],l.push(e);}l&&l.length>0&&r.issues.push({code:`unrecognized_keys`,input:a,inst:e,keys:l,continue:true});}else {r.value=n?n.alloc(e,r,{},i):{};let c;for(let n of Reflect.ownKeys(a)){if(n===`__proto__`||!Object.prototype.propertyIsEnumerable.call(a,n))continue;let l=t.keyType._zod.run({value:n,issues:[]},i);if(l instanceof Promise)throw Error(`Async schemas not supported in object keys currently`);if(typeof n==`string`&&Jr$1.test(n)&&l.issues.length){let e=t.keyType._zod.run({value:Number(n),issues:[]},i);if(e instanceof Promise)throw Error(`Async schemas not supported in object keys currently`);e.issues.length===0&&(l=e);}if(l.issues.length){t.mode===`loose`?r.value[n]=a[n]:s?(c??=[],c.push(n)):r.issues.push({code:`invalid_key`,origin:`record`,issues:l.issues.map(e=>vr$1(e,i,S$1())),input:n,path:[n],inst:e});continue}let u=l.value;if(u===`__proto__`)continue;let d=t.valueType._zod.run({value:a[n],issues:[]},i);d instanceof Promise?o.push(d.then(e=>{e.issues.length&&r.issues.push(...mr$1(n,e.issues)),r.value[u]=e.value;})):(d.issues.length&&r.issues.push(...mr$1(n,d.issues)),r.value[u]=d.value);}c&&c.length>0&&r.issues.push({code:`unrecognized_keys`,input:a,inst:e,keys:c,continue:true});}return o.length?Promise.all(o).then(()=>r):r};}),xi$1=x$1(`$ZodEnum`,(e,t)=>{C$1.init(e,t);let n=Qn$1(t.entries),r=new Set(n);e._zod.values=r,b$1(e,`pattern`,e=>{let t=Qn$1(e.def.entries).filter(e=>cr$1.has(typeof e));return RegExp(t.length?`^(${t.map(e=>lr$1(e.toString())).join(`|`)})$`:`^[^\\s\\S]$`)}),e._zod.parse=(t,i)=>{let a=t.value;return r.has(a)||t.issues.push({code:`invalid_value`,values:n,input:a,inst:e}),t};}),Si$1=x$1(`$ZodLiteral`,(e,t)=>{C$1.init(e,t);let n=new Set(t.values);e._zod.values=n,b$1(e,`pattern`,e=>{let t=e.def.values;return RegExp(t.length?`^(${t.map(e=>typeof e==`string`?lr$1(e):e?lr$1(e.toString()):String(e)).join(`|`)})$`:`^[^\\s\\S]$`)}),e._zod.parse=(r,i)=>{let a=r.value;return n.has(a)||r.issues.push({code:`invalid_value`,values:t.values,input:a,inst:e}),r};});function Ci$1(e,t){return e.value=t.issues.length?void 0:t.value,e}var wi$1=x$1(`$ZodOptional`,(e,t)=>{C$1.init(e,t),b$1(e,`optin`,e=>e.def.innerType._zod.optin===`defaulted`?`defaulted`:`optional`),e._zod.optout=`optional`,b$1(e,`values`,e=>{let t=e.def.innerType._zod.values;return t?new Set([...t,void 0]):void 0}),b$1(e,`pattern`,e=>{let t=e.def.innerType._zod.pattern;return t?RegExp(`^(${rr$1(t.source)})?$`):void 0}),e._zod.parse=(e,n)=>{if(e.value===void 0){if(t.innerType._zod.optin!==`defaulted`)return e;let r=t.innerType._zod.run({value:e.value,issues:[]},n);return r instanceof Promise?r.then(t=>Ci$1(e,t)):Ci$1(e,r)}return t.innerType._zod.run(e,n)};}),Ti$1=x$1(`$ZodNullable`,(e,t)=>{C$1.init(e,t),b$1(e,`optin`,e=>e.def.innerType._zod.optin),b$1(e,`optout`,e=>e.def.innerType._zod.optout),b$1(e,`pattern`,e=>{let t=e.def.innerType._zod.pattern;return t?RegExp(`^(${rr$1(t.source)}|null)$`):void 0}),b$1(e,`values`,e=>e.def.innerType._zod.values?new Set([...e.def.innerType._zod.values,null]):void 0),e._zod.parse=(e,n)=>e.value===null?e:t.innerType._zod.run(e,n);});function Ei$1(e){return e.checks&&=[...e.checks],e}function Di$1(e,t){return new e(Ei$1({type:`string`,..._$1(t)}))}function Oi$1(e,t){return new e(Ei$1({type:`number`,checks:[],..._$1(t)}))}function ki$1(e,t){return new e({type:`number`,check:`number_format`,abort:false,format:`safeint`,..._$1(t)})}function Ai$1(e,t){return new e({type:`boolean`,..._$1(t)})}function ji$1(e){return new e({type:`unknown`})}function Mi$1(e,t){return new $r$1({check:`greater_than`,..._$1(t),value:e,inclusive:false})}function Ni$1(e,t){return new $r$1({check:`greater_than`,..._$1(t),value:e,inclusive:true})}function Pi$1(e){return Mi$1(0,e)}function Fi$1(e){return Ni$1(0,e)}function Ii$1(e,t){return new ti$1({check:`min_length`,..._$1(t),minimum:e})}var w$1=x$1(`ZodMiniType`,(e,t)=>{if(!e._zod)throw Error(`Uninitialized schema in ZodMiniType.`);C$1.init(e,t),e.def=t,e.type=t.type;},{get with(){return this.check},set with(e){Cr$1(this,`with`,e);},parse(e,t){return Hr$1(this,e,t,{callee:this.parse})},parseAsync(e,t){return Ur$1(this,e,t,{callee:this.parseAsync})},safeParse(e,t){return Wr$1(this,e,t)},safeParseAsync(e,t){return Kr$1(this,e,t)},check(...e){let t=this.def;return this.clone({...t,checks:[...t.checks??[],...e.map(e=>typeof e==`function`?{_zod:{check:e,def:{check:`custom`},onattach:[]}}:e)]},{parent:true})},clone(e,t){return ur$1(this,e,t)},brand(){return this},register(e,t){return e.add(this,t),this},apply(e,...t){return t.length===0?e(this):e(this,...t)}}),Li$1=x$1(`ZodMiniString`,(e,t)=>{oi$1.init(e,t),w$1.init(e,t);});function T$1(e){return Di$1(Li$1,e)}var Ri$1=x$1(`ZodMiniNumber`,(e,t)=>{si$1.init(e,t),w$1.init(e,t);});function E$1(e){return Oi$1(Ri$1,e)}var zi$1=x$1(`ZodMiniNumberFormat`,(e,t)=>{ci$1.init(e,t),Ri$1.init(e,t);});function D$1(e){return ki$1(zi$1,e)}var Bi$1=x$1(`ZodMiniBoolean`,(e,t)=>{li$1.init(e,t),w$1.init(e,t);});function O$1(e){return Ai$1(Bi$1,e)}var Vi$1=x$1(`ZodMiniUnknown`,(e,t)=>{ui$1.init(e,t),w$1.init(e,t);});function Hi$1(){return ji$1(Vi$1)}var Ui$1=x$1(`ZodMiniArray`,(e,t)=>{mi$1.init(e,t),w$1.init(e,t);});function k$1(e,t){return new Ui$1({type:`array`,element:e,..._$1(t)})}var Wi$1=x$1(`ZodMiniObject`,(e,t)=>{yi$1.init(e,t),w$1.init(e,t),kr$1(e,`shape`,e=>e._zod.def.shape,false);});function A$1(e,t){return new Wi$1({type:`object`,shape:e??{},..._$1(t)})}var Gi$1=x$1(`ZodMiniRecord`,(e,t)=>{bi$1.init(e,t),w$1.init(e,t);});function j$1(e,t,n){return !t||!t._zod?new Gi$1({type:`record`,keyType:T$1(),valueType:e,..._$1(t)}):new Gi$1({type:`record`,keyType:e,valueType:t,..._$1(n)})}var Ki$1=x$1(`ZodMiniEnum`,(e,t)=>{xi$1.init(e,t),w$1.init(e,t),e.options=[...e._zod.values];});function M$1(e,t){return new Ki$1({type:`enum`,entries:Array.isArray(e)?Object.fromEntries(e.map(e=>[e,e])):e,..._$1(t)})}var qi$1=x$1(`ZodMiniLiteral`,(e,t)=>{Si$1.init(e,t),w$1.init(e,t);});function Ji$1(e,t){return new qi$1({type:`literal`,values:Array.isArray(e)?e:[e],..._$1(t)})}var Yi$1=x$1(`ZodMiniOptional`,(e,t)=>{wi$1.init(e,t),w$1.init(e,t);});function N$1(e){return new Yi$1({type:`optional`,innerType:e})}var Xi$1=x$1(`ZodMiniNullable`,(e,t)=>{Ti$1.init(e,t),w$1.init(e,t);});function Zi$1(e){return new Xi$1({type:`nullable`,innerType:e})}var Qi$1=M$1([xe,Se]),$i$1=M$1([Te,Ee]),ea$1=A$1({tag:T$1().check(Ii$1(1)),type:Qi$1}),ta$1=A$1({value:D$1(),exact:O$1()}),P$1=A$1({id:T$1().check(Ii$1(1)),name:T$1().check(Ii$1(1)),tags:k$1(ea$1),kind:N$1($i$1),postIds:N$1(k$1(D$1())),thumbs:N$1(j$1(T$1(),T$1())),shuffledOrder:N$1(Zi$1(k$1(D$1()))),query:N$1(T$1()),cover:N$1(k$1(T$1())),postCount:N$1(ta$1),openedPostId:N$1(D$1()),newestPostId:N$1(D$1()),group:N$1(T$1())}),na$1=`artist`,ra$1=`character`,ia$1=`copyright`,aa$1=M$1([na$1,ra$1,ia$1]),oa$1=A$1({tag:T$1().check(Ii$1(1)),kind:N$1(aa$1),group:N$1(T$1()),addedAt:N$1(E$1()),cover:N$1(k$1(T$1())),postCount:N$1(ta$1),lastPostId:N$1(D$1()),lastPostSince:N$1(E$1())}),sa$1=A$1({fav:N$1(O$1()),seen:N$1(O$1())}),ca$1=M$1([u,d,f,ee,te]),la$1=`light`,ua$1=`dark`,da$1=M$1([la$1,ua$1]),fa$1=A$1({base:da$1,backgroundImage:N$1(T$1()),backgroundDim:N$1(E$1())}),pa$1=A$1({base:N$1(da$1),accent:N$1(T$1()),bg:N$1(T$1()),surface:N$1(T$1()),text:N$1(T$1()),backgroundImage:N$1(T$1()),backgroundDim:N$1(E$1())}),ma$1=A$1({theme:ca$1,custom:N$1(fa$1)}),ha$1=A$1({theme:ca$1,custom:N$1(pa$1)}),ga$1=`video-player`,_a$1=`fit-height`,va$1=`fit-width`,ya$1=`original`,ba$1=_a$1,xa$1=M$1([_a$1,va$1,ya$1]),Sa$1=A$1({volume:N$1(E$1()),muted:N$1(O$1()),playbackRate:N$1(E$1())}),Ca$1=A$1({gridFavButtons:O$1(),updatesGroupSize:N$1(D$1().check(Fi$1())),playlistChunkSize:N$1(D$1().check(Pi$1())),tweaksEnabled:N$1(O$1()),features:N$1(j$1(T$1(),O$1())),featureChoice:N$1(j$1(T$1(),T$1())),featureState:N$1(j$1(T$1(),Hi$1())),appearance:N$1(ha$1)}),wa$1=A$1({seenPostId:D$1().check(Fi$1())}),F$1=A$1({version:Ji$1(1),collections:k$1(P$1),artists:k$1(oa$1),marks:j$1(T$1(),sa$1),settings:N$1(Ca$1),updates:N$1(wa$1)}),Ta$1=`panel`,Ea$1=`width`,Da$1=`height`,Oa$1=`grid-density`,ka$1=`default`,Aa$1=`masonry`,ja$1=`post-actions`,Ma$1=A$1({tabId:T$1().check(Ii$1(1)),beatAt:E$1()}),Na$1=`incremental`,Pa$1=`full`,Fa$1=M$1([Na$1,Pa$1]),Ia$1=A$1({nextPid:D$1(),lastPid:D$1(),startedAt:T$1(),finishedAt:N$1(T$1()),running:N$1(O$1()),userId:N$1(D$1()),lock:N$1(Ma$1),mode:N$1(Fa$1)}),La$1=A$1({version:Ji$1(1),ids:k$1(D$1()),sync:N$1(Ia$1)}); exports({aE:na$1,aF:ra$1,aG:ia$1,c_:ca$1,cR:la$1,cS:ua$1,ax:ga$1,au:_a$1,av:va$1,aw:ya$1,at:ba$1,d7:F$1,x:Na$1,v:Pa$1,d8:La$1});function Ra$1(){return {volume:1,muted:false,playbackRate:1}}function za$1(e){let t=Sa$1.safeParse(e);if(!t.success)return Ra$1();let n=Ra$1(),r=t.data.volume,i=t.data.muted,a=t.data.playbackRate;return {volume:r!==void 0&&Number.isFinite(r)?Math.min(1,Math.max(0,r)):n.volume,muted:i??n.muted,playbackRate:a!==void 0&&Number.isFinite(a)&&a>0?a:n.playbackRate}}function Ba$1(e){let t=xa$1.safeParse(e);return t.success?t.data:ba$1}function Va$1(e){return typeof e==`object`&&!!e&&!Array.isArray(e)}function Ha$1(e){let t=e.settings?.featureState;if(t===void 0)return {data:e,changed:false};let n=t[Ta$1];if(!Va$1(n))return {data:e,changed:false};let r=Object.prototype.hasOwnProperty.call(n,Ea$1),i=Object.prototype.hasOwnProperty.call(n,Da$1);if(!r&&!i)return {data:e,changed:false};let a={};for(let[e,t]of Object.entries(n))e!==`width`&&e!==`height`&&(a[e]=t);let o={...t};Object.keys(a).length===0?delete o[Ta$1]:o[Ta$1]=a;let s=e.settings===void 0?{gridFavButtons:true}:{...e.settings};return Object.keys(o).length===0?delete s.featureState:s.featureState=o,{data:{...e,settings:s},changed:true}}function Ua$1(e){let t=e.settings?.featureChoice;if(t===void 0)return {data:e,changed:false};let n={...t},r=false;if(n[Oa$1]===Aa$1&&(n[Oa$1]=ka$1,r=true),Object.prototype.hasOwnProperty.call(n,ja$1)&&(delete n[ja$1],r=true),!r)return {data:e,changed:false};let i=e.settings===void 0?{gridFavButtons:true}:{...e.settings};return Object.keys(n).length===0?delete i.featureChoice:i.featureChoice=n,{data:{...e,settings:i},changed:true}}function I$1(e){return e.kind===Ee}function Wa$1(e){let t=false,n=[];for(let r of e.collections){if(!I$1(r)){n.push(r);continue}let e=r.thumbs===void 0,i=r.shuffledOrder===void 0;if(!e&&!i){n.push(r);continue}t=true;let a={...r};e&&(a.thumbs={}),i&&(a.shuffledOrder=null),n.push(a);}return t?{data:{...e,collections:n},changed:true}:{data:e,changed:false}}function Ga$1(e){return e.kind??`search`}function L$1(){return {version:1,ids:[]}}function Ka$1(){return {theme:ne}}function qa$1(e){let t={base:e.base===`light`||e.base===`dark`?e.base:Kn$1(e.bg)};return e.backgroundImage!==void 0&&(t.backgroundImage=e.backgroundImage),e.backgroundDim!==void 0&&(t.backgroundDim=e.backgroundDim),t}function Ja$1(e){return e.custom===void 0?{theme:e.theme}:{theme:e.theme,custom:qa$1(e.custom)}}function Ya$1(){return {version:1,collections:[],artists:[],marks:{},settings:{gridFavButtons:true,updatesGroupSize:0,tweaksEnabled:true,appearance:Ka$1()},updates:{seenPostId:0}}}function Xa$1(e){let t=e.settings?.appearance;return t===void 0?Ka$1():Ja$1(t)}function Za$1(e){return e.settings?.gridFavButtons??true}function Qa$1(e){return e.settings?.tweaksEnabled??true}function $a$1(e){return e.settings?.updatesGroupSize??0}function eo$1(e){return e.settings?.playlistChunkSize??40}function to$1(e){return e.updates?.seenPostId??0}var no$1=/^id:>(\d+)$/,ro$1=/^id:(\d+)$/;function R$1(e){let t=e.trim().toLowerCase();if(t.length===0)return null;let n=t.replaceAll(` `,`_`);return /\s/.test(n)||n===`(`||n===`)`||n===`~`||n.startsWith(`-`)||n.length===0?null:n}function io$1(e){return e.trim().split(/\s+/).filter(e=>e.length>0).map(e=>e.startsWith(`-`)&&e.length>1?{tag:e.slice(1),type:Se}:{tag:e,type:xe})}function ao$1(e){return e.map(e=>e.type===`exclude`?`-${e.tag}`:e.tag).join(` `)}function oo$1(e){return encodeURIComponent(e).replaceAll(`(`,`%28`).replaceAll(`)`,`%29`)}function so$1(e){let t=e.map(e=>oo$1(e.type===`exclude`?`-${e.tag}`:e.tag)).join(`+`),n=new URLSearchParams;return n.set(ce,ae),n.set(`s`,oe),`${re}${ie}?${n.toString()}&${le}=${t}`}function co$1(e){if(e.length===1){let t=e[0];return t===void 0?``:t}return `( ${e.join(` ~ `)} )`}function lo$1(e,t,n){let r=[];for(let t of e){let e=R$1(t);e!==null&&r.push(e);}if(r.length===0)return [];let i=[];if(n<=0)i.push(r);else for(let e=0;e<r.length;e+=n)i.push(r.slice(e,e+n));return i.map(e=>{let n=co$1(e);return n})}function uo$1(e){return so$1(io$1(e))}function fo$1(e,t){let n=lo$1(e,0,t)[0];return n===void 0?``:n}function po$1(e,t){let n=fo$1(e,t);return n.length===0?so$1([]):uo$1(n)}function mo$1(e,t){return lo$1(e,0,t)}function ho$1(e,t,n){let r=mo$1(t,n);if(r.length<2)return  -1;let i=e.trim();return i.length===0?-1:r.findIndex(e=>Po$1(i,e))}function go$1(e){let t=e.trim().split(/\s+/).filter(e=>e.length>0);if(t.length===0)return ``;let n=t[t.length-1];return n!==void 0&&no$1.test(n)?t.slice(0,-1).join(` `):t.join(` `)}function _o$1(e){let t=new Set;for(let n of e){let e=R$1(n);e!==null&&t.add(e);}return t}function vo$1(e,t){if(t.size===0)return null;let n=e.trim().split(/\s+/).filter(e=>e.length>0);if(n.length===0)return null;let r=n,i=false,a=n[n.length-1];if(a!==void 0&&no$1.test(a)&&(r=n.slice(0,-1),i=true),r.some(e=>no$1.test(e))||r.length===0)return null;let o=[];if(r.length===1){let e=r[0];if(e===void 0)return null;let n=R$1(e);return n===null||!t.has(n)?null:(o.push(n),{tags:o,hasIdFilter:i})}let s=r[0],c=r[r.length-1];if(s!==`(`||c!==`)`)return null;let l=r.slice(1,-1);if(l.length===0||l.length%2==0)return null;for(let e=0;e<l.length;e+=1){let n=l[e];if(n===void 0)return null;if(e%2==1){if(n!==`~`)return null;continue}let r=R$1(n);if(r===null||!t.has(r)||o.includes(r))return null;o.push(r);}return {tags:o,hasIdFilter:i}}function yo$1(e,t){if(e.length!==t.size)return  false;for(let n of e)if(!t.has(n))return  false;return  true}function bo$1(e,t){let n=_o$1(t),r=vo$1(e,n);return r!==null&&yo$1(r.tags,n)}function xo$1(e,t){let n=_o$1(t),r=vo$1(e,n);return r===null||!r.hasIdFilter||yo$1(r.tags,n)?false:r.tags.length>0&&r.tags.length<n.size}function So$1(e){return `id:${String(e)}`}function Co$1(e){if(e.length===1){let t=e[0];return t===void 0?``:So$1(t)}return `( ${e.map(So$1).join(` ~ `)} )`}function wo$1(e,t){let n=new Set;for(let t of e){if(!Number.isFinite(t))continue;let e=Math.trunc(t);e>=0&&n.add(e);}let r=Array.from(n).sort((e,t)=>t-e);if(r.length===0)return [];let i=[];if(t<=0)i.push(r);else for(let e=0;e<r.length;e+=t)i.push(r.slice(e,e+t));return i.map(Co$1)}function To$1(e){let t=e.trim().split(/\s+/).filter(e=>e.length>0);if(t.length===0)return null;if(t.length===1){let e=t[0];if(e===void 0)return null;let n=ro$1.exec(e);if(n===null)return null;let r=Number(n[1]);return Number.isFinite(r)?[r]:null}let n=t[0],r=t[t.length-1];if(n!==`(`||r!==`)`)return null;let i=t.slice(1,-1);if(i.length===0||i.length%2==0)return null;let a=[];for(let e=0;e<i.length;e+=1){let t=i[e];if(t===void 0)return null;if(e%2==1){if(t!==`~`)return null;continue}let n=ro$1.exec(t);if(n===null)return null;let r=Number(n[1]);if(!Number.isFinite(r)||a.includes(r))return null;a.push(r);}return a}var Eo$1=`sort:random`,Do$1=/\s+/;function Oo$1(e){return e.trim().split(Do$1).filter(e=>e.length>0)}function ko$1(e){let t=new Map;for(let n of Oo$1(e))n!==`sort:random`&&t.set(n,(t.get(n)??0)+1);return t}function Ao$1(e){let t=Mo$1(e);return t.length===0||t===`all`}function jo$1(e){return Oo$1(e).includes(Eo$1)}function Mo$1(e){return Oo$1(e).filter(e=>e!==Eo$1).join(` `)}function No$1(e){let t=Oo$1(e);return t.includes(`sort:random`)||t.push(Eo$1),t.join(` `)}function Po$1(e,t){let n=ko$1(e),r=ko$1(t);if(n.size!==r.size)return  false;for(let[e,t]of n)if(r.get(e)!==t)return  false;return  true}var Fo$1=`ruledesk-web.artists-mirror`;function Io$1(e){try{localStorage.setItem(Fo$1,JSON.stringify([...e]));}catch(e){m.error(`artists-mirror: write failed`,e);}}function Lo$1(){try{let e=localStorage.getItem(Fo$1);if(e===null)return null;let t=JSON.parse(e);if(!Array.isArray(t))return null;for(let e of t)if(typeof e!=`string`)return null;return t}catch(e){return m.error(`artists-mirror: read failed`,e),null}}var Ro$1=`ruledesk-web.covers-mirror`,zo$1=j$1(T$1(),k$1(T$1()));function Bo$1(){try{let e=localStorage.getItem(Ro$1);if(e===null)return {};let t=zo$1.safeParse(JSON.parse(e));return t.success?t.data:{}}catch(e){return m.error(`cover-mirror: read failed`,e),{}}}function Vo$1(e){try{localStorage.setItem(Ro$1,JSON.stringify(e));}catch(e){m.error(`cover-mirror: write failed`,e);}}function Ho$1(e){let t=Bo$1(),n=Object.hasOwn(t,e)?t[e]:void 0;return n===void 0?null:n}function Uo$1(e,t,n){let r=Bo$1(),i={};for(let e of n){let t=Object.hasOwn(r,e)?r[e]:void 0;t!==void 0&&(i[e]=t);}i[e]=[...t],Vo$1(i);}function Wo$1(e){let t=Bo$1();if(!Object.hasOwn(t,e))return;let n={};for(let[r,i]of Object.entries(t))r!==e&&(n[r]=i);Vo$1(n);}var Go$1=`ruledesk-web.counts-mirror`,Ko$1=A$1({value:D$1(),exact:O$1()}),qo$1=j$1(T$1(),Ko$1);function Jo$1(){try{let e=localStorage.getItem(Go$1);if(e===null)return {};let t=qo$1.safeParse(JSON.parse(e));return t.success?t.data:{}}catch(e){return m.error(`count-mirror: read failed`,e),{}}}function Yo$1(e){try{localStorage.setItem(Go$1,JSON.stringify(e));}catch(e){m.error(`count-mirror: write failed`,e);}}function Xo$1(e){let t=Jo$1(),n=Object.hasOwn(t,e)?t[e]:void 0;return n===void 0?null:n}function Zo$1(e,t,n){let r=Jo$1(),i={};for(let e of n){let t=Object.hasOwn(r,e)?r[e]:void 0;t!==void 0&&(i[e]=t);}i[e]={value:t.value,exact:t.exact},Yo$1(i);}function Qo$1(e){let t=Jo$1();if(!Object.hasOwn(t,e))return;let n={};for(let[r,i]of Object.entries(t))r!==e&&(n[r]=i);Yo$1(n);}var $o$1=2e4,es$1=.1;function ts$1(e=$o$1){return e+Math.floor(e*es$1)}function ns$1(e){let t=Number(e);return Number.isFinite(t)?Math.trunc(t):-1/0}function rs$1(e,t=$o$1){let n=Object.entries(e),r=ts$1(t);if(n.length<=r)return {marks:e,pruned:false};let i=[...n].sort((e,t)=>ns$1(t[0])-ns$1(e[0])),a={};for(let[e,n]of i.slice(0,t))a[e]=n;return {marks:a,pruned:true}}var z$1=null,B$1,is$1=false;function as$1(){return GM_getValue}function os$1(){return GM_setValue}function ss$1(e){return typeof e==`object`&&!!e&&!Array.isArray(e)}function cs$1(e){return typeof e==`number`&&Number.isInteger(e)}function ls$1(e){return Array.isArray(e)&&e.every(cs$1)}function us$1(e){if(!ss$1(e)||e.version!==1||!ls$1(e.ids))return null;let t={version:1,ids:e.ids};if(e.sync!==void 0){let n=Ia$1.safeParse(e.sync);n.success&&(t.sync=n.data);}return t}function ds$1(e){let t=La$1.safeParse(e);return t.success?t.data:null}function V$1(e){if(typeof e==`number`)return Number.isFinite(e)?Math.trunc(e):null;let t=e.trim();if(t.length===0)return null;let n=Number(t);return Number.isFinite(n)?Math.trunc(n):null}function fs$1(){let e=as$1()(n,void 0);if(e==null)return L$1();let t=us$1(e);return t===null?(m.error(`Invalid favs storage content; using empty favs`,{key:n}),L$1()):t}function ps$1(e){os$1()(n,e);}function ms$1(e){z$1=new Set(e.ids),B$1=e.sync,is$1=true;}function hs$1(){let t=as$1()(e,void 0);if(t==null)return null;let n=F$1.safeParse(t);return n.success?n.data:null}function gs$1(t){let n=rs$1(t.marks),r=n.pruned?{...t,marks:n.marks}:t;os$1()(e,F$1.parse(r));}function _s$1(e){let t=e??hs$1(),r=as$1()(n,void 0),i=r==null?L$1():us$1(r),a=i??L$1();i===null&&r!=null&&m.error(`Invalid favs storage content; using empty favs`,{key:n});let o=new Set(a.ids),s=false,c=null;if(t!==null){let e={};for(let[n,r]of Object.entries(t.marks)){let t={};if(r.seen===true&&(t.seen=true),r.fav===true){let e=V$1(n);e!==null&&o.add(e),s=true;}else r.fav!==void 0&&(s=true);Object.keys(t).length>0?e[n]=t:r.fav===void 0&&r.seen===void 0&&(e[n]={});}let n=t;s&&(n={...t,marks:e});let r=Ha$1(n),i=Ua$1(r.data);(s||r.changed||i.changed)&&(c=i.data);}c!==null&&gs$1(c);let l={version:a.version,ids:Array.from(o)};a.sync!==void 0&&(l.sync=a.sync);let u=new Set(a.ids);if(l.ids.length!==a.ids.length||l.ids.some(e=>!u.has(e))){let e=ds$1(l);if(e===null)m.error(`migrateMarksFavToFavs: strict favs validate failed; skipping write`,{key:n});else return ps$1(e),ms$1(e),c!==null}return ms$1(l),c!==null}function H$1(){return is$1&&z$1!==null?z$1:(_s$1(),z$1===null&&ms$1(fs$1()),z$1??new Set)}function vs$1(e){let t={version:L$1().version,ids:Array.from(e)};B$1!==void 0&&(t.sync=B$1),ps$1(t),z$1=e,is$1=true;}function ys$1(){z$1=null,B$1=void 0,is$1=false;}function bs$1(){return H$1()}function xs$1(e){let t=V$1(e);return t!==null&&H$1().has(t)}function Ss$1(e){let t=V$1(e);if(t===null)return;let n=new Set(H$1());n.has(t)?z$1=n:(n.add(t),vs$1(n));}function Cs$1(e){let t=V$1(e);if(t===null)return;let n=new Set(H$1());n.has(t)?(n.delete(t),vs$1(n)):z$1=n;}function ws$1(e){if(e.length===0){H$1();return}let t=new Set(H$1()),n=false;for(let r of e){let e=V$1(r);e!==null&&(t.has(e)||(t.add(e),n=true));}n?vs$1(t):z$1=t;}function Ts$1(){return H$1(),B$1}function Es$1(e){let t=H$1();B$1=e;let n={version:L$1().version,ids:Array.from(t)};e!==void 0&&(n.sync=e),ps$1(n),is$1=true;}function Ds(e){let t=[],n={};for(let[r,i]of Object.entries(e)){if(i.fav===true){let e=V$1(r);e!==null&&t.push(e);}let e={};i.seen===true&&(e.seen=true),Object.keys(e).length>0&&(n[r]=e);}return {marks:n,favIds:t}}var Os=null,ks=false,As=0,js=1e3;function Ms(){return GM_getValue}function Ns(){return GM_setValue}function Ps(){return Ms()(e,void 0)}function Fs(t){Ns()(e,t);}function Is(e){Os=e,ks=true,As=Date.now();}function Ls(e){Io$1(e.artists.map(e=>e.tag));}function Rs(e){Lo$1()===null&&Ls(e);}function zs(){Os=null,ks=false,As=0;}function Bs(){let e=Ps();if(e==null){_s$1();let e=Ya$1();return Rs(e),e}let t=F$1.safeParse(e);if(!t.success){Hs(e),_s$1();let t=Ya$1();return Rs(t),t}if(!_s$1(t.data))return Rs(t.data),Vs(t.data);let n=Ps();if(n==null){let e=Ya$1();return Rs(e),e}let r=F$1.safeParse(n);return r.success?(Rs(r.data),Vs(r.data)):(Rs(t.data),Vs(t.data))}function Vs(e){let t=Wa$1(e);if(!t.changed)return e;let n=F$1.parse(t.data);return Fs(n),n}function Hs(n){Ns()(t,n),m.error(`Invalid storage content backed up`,{key:e,backupKey:t});}function U$1(e){let t={gridFavButtons:Za$1(e),updatesGroupSize:$a$1(e),playlistChunkSize:eo$1(e),tweaksEnabled:Qa$1(e)};return e.settings?.features!==void 0&&(t.features={...e.settings.features}),e.settings?.featureChoice!==void 0&&(t.featureChoice={...e.settings.featureChoice}),e.settings?.featureState!==void 0&&(t.featureState={...e.settings.featureState}),e.settings?.appearance!==void 0&&(t.appearance=e.settings.appearance),t}function W$1(e){if(!Number.isFinite(e))return null;let t=Math.trunc(e);return t<0?null:t}function G$1(){if(ks&&Os!==null)return Os;let e=Bs();return Is(e),e}function K$1(){return zs(),G$1()}function Us(){return ks&&Os!==null&&Date.now()-As<js?Os:K$1()}function Ws(e){for(let t of Object.values(e))if(t.fav!==void 0)return  true;return  false}function q$1(e){let t=Wa$1(F$1.parse(e)).data,n=rs$1(t.marks),r=n.pruned?{...t,marks:n.marks}:t;if(Fs(r),!Ws(r.marks)){Is(r),Ls(r);return}_s$1();let i=Ps();if(i==null){let e=Ya$1();Is(e),Ls(e);return}let a=F$1.safeParse(i);a.success?(Is(a.data),Ls(a.data)):(Is(r),Ls(r));}function Gs(e,t){let n=K$1(),r=n.collections.find(t=>t.id===e);return r===void 0?null:(r.name=t.trim(),P$1.parse(r),q$1(n),r)}function Ks(e){let t=K$1(),n=t.collections.filter(t=>t.id!==e);return n.length!==t.collections.length&&(Wo$1(e),Qo$1(e),t.collections=n,q$1(t),true)}function qs(e){let t=K$1(),n=P$1.parse({id:crypto.randomUUID(),name:e.trim(),tags:[],kind:Ee,postIds:[],thumbs:{},shuffledOrder:null});return t.collections.push(n),q$1(t),n}function Js(){return G$1().collections.filter(I$1)}function Ys(e){let t=W$1(e);return t===null?[]:Js().filter(e=>(e.postIds??[]).includes(t))}var Xs=0,Zs=2,Qs=1;function $s(e){return String(e)}function ec(e,t){if(e===void 0)return null;let n=e[$s(t)];return n===void 0||n.length===0?null:n}function tc(e){if(e===void 0)return null;let t=e.trim();return t.length===0?null:t}function nc(e,t){if(e.length!==t.length)return  false;for(let n=0;n<e.length;n+=1)if(e[n]!==t[n])return  false;return  true}function rc(e){let t=[...e];for(let e=t.length-1;e>Xs;--e){let n=Math.floor(Math.random()*(e+1)),r=t[e],i=t[n];r!==void 0&&i!==void 0&&(t[e]=i,t[n]=r);}if(t.length<Zs||!nc(t,e))return t;let n=t[Xs],r=t[Qs];return n===void 0||r===void 0||(t[Xs]=r,t[Qs]=n),t}function ic(e,t){if(!Number.isFinite(e)||e<Xs)return t;let n=Math.trunc(e);return n>t?t:n}function ac(e){let t=e.postIds??[],n=e.shuffledOrder;if(n==null)return [...t];let r=new Set(t),i=[],a=new Set;for(let e of n)r.has(e)&&!a.has(e)&&(i.push(e),a.add(e));for(let e of t)a.has(e)||(i.push(e),a.add(e));return i}function J$1(e,t){let n=e.collections.find(e=>e.id===t);return n===void 0||!I$1(n)?null:n}function Y$1(e){e.kind=Ee,e.tags=[],e.thumbs===void 0&&(e.thumbs={}),e.shuffledOrder===void 0&&(e.shuffledOrder=null);}function oc(e,t,n){let r=W$1(t);if(r===null)return null;let i=K$1(),a=J$1(i,e);if(a===null)return null;let o=[...a.postIds??[]];o.includes(r)||(o.push(r),a.shuffledOrder!==void 0&&a.shuffledOrder!==null&&(a.shuffledOrder=a.shuffledOrder.filter(e=>e!==r))),a.postIds=o;let s=tc(n),c=ec(a.thumbs,r),l=s??c;return l!==null&&(a.thumbs={...a.thumbs??{},[$s(r)]:l}),Y$1(a),P$1.parse(a),q$1(i),a}function sc(e,t){let n=K$1(),r=J$1(n,e);if(r===null)return null;let i=[...r.postIds??[]],a=new Set(i),o={...r.thumbs??{}},s=new Set;for(let e of t){let t=W$1(e.id);if(t===null)continue;a.has(t)||(a.add(t),i.push(t),s.add(t));let n=tc(e.thumbUrl??void 0)??ec(o,t);n!==null&&(o[$s(t)]=n);}return s.size>0&&r.shuffledOrder!==void 0&&r.shuffledOrder!==null&&(r.shuffledOrder=r.shuffledOrder.filter(e=>!s.has(e))),r.postIds=i,r.thumbs=o,Y$1(r),P$1.parse(r),q$1(n),{collection:r,added:s.size}}function cc(e,t){let n=K$1(),r=J$1(n,e);if(r===null)return null;let i=new Set;for(let e of t){let t=W$1(e);t!==null&&i.add(t);}let a=r.postIds??[],o=ac(r),s=[];for(let e=0;e<a.length;e+=1){let t=a[e];if(t===void 0||!i.has(t))continue;let n=o.indexOf(t);s.push({postId:t,thumbUrl:ec(r.thumbs,t),insertionIndex:e,displayIndex:n<Xs?e:n});}if(s.length===0)return {collectionId:e,posts:s};let c=new Set(s.map(e=>e.postId));return r.postIds=a.filter(e=>!c.has(e)),r.shuffledOrder!==void 0&&r.shuffledOrder!==null&&(r.shuffledOrder=r.shuffledOrder.filter(e=>!c.has(e))),Y$1(r),P$1.parse(r),q$1(n),{collectionId:e,posts:s}}function lc(e,t){let n=W$1(t);return n===null||cc(e,[n])===null?null:G$1().collections.find(t=>t.id===e)??null}function uc(e){let t=K$1(),n=J$1(t,e.collectionId);if(n===null)return null;if(e.posts.length===0)return n;let r=[...n.postIds??[]],i={...n.thumbs??{}},a=[...e.posts].sort((e,t)=>e.insertionIndex-t.insertionIndex);for(let e of a){let t=W$1(e.postId);if(t!==null){if(!r.includes(t)){let n=ic(e.insertionIndex,r.length);r.splice(n,0,t);}e.thumbUrl!==null&&e.thumbUrl.length>0&&(i[$s(t)]=e.thumbUrl);}}if(n.postIds=r,n.thumbs=i,n.shuffledOrder!==void 0&&n.shuffledOrder!==null){let t=[...n.shuffledOrder],r=[...e.posts].sort((e,t)=>e.displayIndex-t.displayIndex);for(let e of r){let n=W$1(e.postId);if(n===null||t.includes(n))continue;let r=ic(e.displayIndex,t.length);t.splice(r,0,n);}n.shuffledOrder=t;}return Y$1(n),P$1.parse(n),q$1(t),n}function dc(e){let t=K$1(),n=J$1(t,e);return n===null?null:(n.shuffledOrder=rc(ac(n)),Y$1(n),P$1.parse(n),q$1(t),n)}function fc(e){let t=K$1(),n=J$1(t,e);return n===null?null:(n.shuffledOrder=null,Y$1(n),P$1.parse(n),q$1(t),n)}function pc(e,t,n){let r=K$1(),i=J$1(r,e);if(i===null||t===n)return  false;let a=ac(i),o=a.indexOf(t),s=a.indexOf(n);return o<0||s<0?false:(a.splice(o,1),a.splice(s,0,t),i.shuffledOrder===void 0||i.shuffledOrder===null?i.postIds=a:i.shuffledOrder=a,Y$1(i),P$1.parse(i),q$1(r),true)}function mc(e){let t=J$1(G$1(),e);return t===null?null:ac(t)}function hc(e,t){let n=K$1(),r=t.trim(),i=P$1.parse({id:crypto.randomUUID(),name:e.trim(),tags:io$1(r),kind:Te,query:r});return n.collections.push(i),q$1(n),i}function gc(e,t){let n=[];for(let e of t){let t=e.trim();if(t.length!==0&&(n.push(t),n.length===4))break}if(n.length===0)return  false;let r=G$1().collections,i=r.find(t=>t.id===e);if(i===void 0||I$1(i)||(Uo$1(e,n,r.map(e=>e.id)),xc(i.cover??[],n)))return  false;let a=K$1(),o=a.collections.find(t=>t.id===e);return o===void 0||I$1(o)||xc(o.cover??[],n)?false:(o.cover=n,P$1.parse(o),q$1(a),true)}function _c(e,t){if(!Number.isInteger(t.value)||t.value<0)return  false;let n=G$1().collections,r=n.find(t=>t.id===e);if(r===void 0||I$1(r)||(Zo$1(e,t,n.map(e=>e.id)),bc(r.postCount,t)))return  false;let i=K$1(),a=i.collections.find(t=>t.id===e);return a===void 0||I$1(a)||bc(a.postCount,t)?false:(a.postCount={value:t.value,exact:t.exact},P$1.parse(a),q$1(i),true)}function vc(e,t,n){if(!Number.isInteger(t)||t<=0)return  false;let r=G$1().collections.find(t=>t.id===e);if(r===void 0||I$1(r)||r.newestPostId===t&&(!n||r.openedPostId===t))return  false;let i=K$1(),a=i.collections.find(t=>t.id===e);return a===void 0||I$1(a)?false:(a.newestPostId=Math.max(a.newestPostId??0,t),n&&(a.openedPostId=t,a.newestPostId=t),P$1.parse(a),q$1(i),true)}function yc(e){return e.openedPostId!==void 0&&e.newestPostId!==void 0&&e.newestPostId>e.openedPostId}function bc(e,t){return e!==void 0&&e.value===t.value&&e.exact===t.exact}function xc(e,t){if(e.length!==t.length)return  false;for(let n=0;n<e.length;n+=1)if(e[n]!==t[n])return  false;return  true}function Sc(e,t){let n=K$1(),r=n.collections.find(t=>t.id===e);if(r===void 0||I$1(r))return null;let i=t.trim();return r.query!==i&&(delete r.cover,delete r.postCount,Wo$1(e),Qo$1(e)),r.query=i,r.tags=io$1(i),r.kind=Te,P$1.parse(r),q$1(n),r}function Cc(e){let t=G$1(),n=t.marks[e]??{};n.seen!==true&&(t.marks[e]={...n,seen:true},q$1(t));}function wc(){return Za$1(G$1())}function Tc(e){let t=G$1();t.settings={...U$1(t),gridFavButtons:e},q$1(t);}function Ec(){return Qa$1(G$1())}function Dc(e){let t=G$1();t.settings={...U$1(t),tweaksEnabled:e},q$1(t);}function Oc(e,t){let n=G$1().settings?.features?.[e];return n===void 0?t:n}function kc(e,t){let n=G$1(),r=U$1(n),i={...r.features??{},[e]:t};n.settings={...r,features:i},q$1(n);}function Ac(e){let t=G$1(),n=U$1(t),r=n.featureState;if(r===void 0||!(e in r))return;let i={};for(let[t,n]of Object.entries(r))t!==e&&(i[t]=n);t.settings={...n,featureState:i},q$1(t);}function jc(e){return G$1().settings?.featureChoice?.[e]}function Mc(e,t){let n=G$1(),r=U$1(n),i={...r.featureChoice??{},[e]:t};n.settings={...r,featureChoice:i},q$1(n);}function Nc(e){return G$1().settings?.featureState?.[e]}function Pc(e,t){let n=K$1(),r=U$1(n),i=r.featureState;if(i!==void 0&&Object.hasOwn(i,e)&&JSON.stringify(i[e])===JSON.stringify(t))return;let a={...i??{},[e]:t};n.settings={...r,featureState:a},q$1(n);}function Fc(){let e=$a$1(G$1());return !Number.isFinite(e)||e<=0?400:Math.min(Math.floor(e),400)}function Ic(e){let t=G$1(),n=Number.isFinite(e)&&e>=0?Math.floor(e):0;n>400&&(n=400),t.settings={...U$1(t),updatesGroupSize:n},q$1(t);}function Lc(){return eo$1(G$1())}function Rc(e){let t=G$1(),n=Number.isFinite(e)&&e>0?Math.floor(e):40;t.settings={...U$1(t),playlistChunkSize:n},q$1(t);}function zc(){return Xa$1(G$1())}function Bc(e){let t=ma$1.parse(e),n=G$1();return n.settings={...U$1(n),appearance:t},q$1(n),t}function Vc(){return to$1(G$1())}function Hc(e){let t=G$1();t.updates={seenPostId:Number.isFinite(e)&&e>=0?Math.floor(e):0},q$1(t);}function Uc(){return Us().artists.map(e=>e.tag)}function Wc(e){return e.kind??`artist`}var X$1=`follow-groups`,Z$1=`collection-groups`;function Q$1(e,t){let n=e.settings?.featureState?.[t];if(!Array.isArray(n))return [];let r=[];for(let e of n)typeof e==`string`&&e.length>0&&r.push(e);return r}function $$1(e,t,n){let r=U$1(e);e.settings={...r,featureState:{...r.featureState??{},[t]:[...new Set(n)]}};}function Gc(e,t){let n=new Set(t),r=new Set;for(let t of e)t!==void 0&&t.length>0&&!n.has(t)&&r.add(t);return [...n,...[...r].sort((e,t)=>e.localeCompare(t))]}function Kc(){let e=G$1();return Gc(e.artists.map(e=>e.group),Q$1(e,X$1))}function qc(e,t){let n=t===null?``:t.trim(),r=new Set(e),i=K$1(),a=0;return i.artists=i.artists.map(e=>{if(!r.has(e.tag)||(e.group??``)===n)return e;a+=1;let{group:t,...i}=e;return n.length>0?{...i,group:n}:i}),n.length>0&&$$1(i,X$1,[...Q$1(i,X$1),n]),(a>0||n.length>0)&&q$1(i),a}function Jc(e){let t=e.trim();if(t.length===0||Kc().includes(t))return  false;let n=K$1();return $$1(n,X$1,[...Q$1(n,X$1),t]),q$1(n),true}function Yc(e,t){let n=t.trim();if(n.length===0||n===e||Kc().includes(n))return  false;let r=K$1();return r.artists=r.artists.map(t=>t.group===e?{...t,group:n}:t),$$1(r,X$1,[...Q$1(r,X$1).map(t=>t===e?n:t),n]),q$1(r),true}function Xc(e){let t=K$1(),n=0;return t.artists=t.artists.map(t=>{if(t.group!==e)return t;n+=1;let{group:r,...i}=t;return i}),$$1(t,X$1,Q$1(t,X$1).filter(t=>t!==e)),q$1(t),n}function Zc(){let e=G$1();return Gc(e.collections.map(e=>e.group),Q$1(e,Z$1))}function Qc(e,t){let n=t===null?``:t.trim(),r=new Set(e),i=K$1(),a=0;return i.collections=i.collections.map(e=>{if(!r.has(e.id)||(e.group??``)===n)return e;a+=1;let{group:t,...i}=e;return n.length>0?{...i,group:n}:i}),n.length>0&&$$1(i,Z$1,[...Q$1(i,Z$1),n]),(a>0||n.length>0)&&q$1(i),a}function $c(e){let t=e.trim();if(t.length===0||Zc().includes(t))return  false;let n=K$1();return $$1(n,Z$1,[...Q$1(n,Z$1),t]),q$1(n),true}function el(e,t){let n=t.trim();if(n.length===0||n===e||Zc().includes(n))return  false;let r=K$1();return r.collections=r.collections.map(t=>t.group===e?{...t,group:n}:t),$$1(r,Z$1,[...Q$1(r,Z$1).map(t=>t===e?n:t),n]),q$1(r),true}function tl(e){let t=K$1(),n=0;return t.collections=t.collections.map(t=>{if(t.group!==e)return t;n+=1;let{group:r,...i}=t;return i}),$$1(t,Z$1,Q$1(t,Z$1).filter(t=>t!==e)),q$1(t),n}function nl(e){let t=K$1(),n=new Set(t.artists.map(e=>e.tag)),r=0,i=0,a=0;for(let o of e){let e=R$1(o);e===null?a+=1:n.has(e)?i+=1:(n.add(e),t.artists.push(oa$1.parse({tag:e,addedAt:Date.now()})),r+=1);}return r>0&&q$1(t),{added:r,duplicates:i,invalid:a}}function rl(e){let t=new Set(e),n=K$1(),r=n.artists.filter(e=>!t.has(e.tag)),i=n.artists.length-r.length;return i>0&&(n.artists=r,q$1(n)),i}function il(e,t){let n=t.postCount;return t.cover.length>0&&!xc(e.cover??[],t.cover)||n!==null&&(e.postCount?.value!==n.value||e.postCount.exact!==n.exact)||t.lastPostId>(e.lastPostId??0)}function al(e,t,n){return t<=0||t<=(e.lastPostId??0)?false:(e.lastPostId=t,e.lastPostSince=n,true)}function ol(e,t,n=Date.now()){let r=Us().artists.find(t=>t.tag===e);if(r===void 0||!il(r,t))return  false;let i=K$1(),a=i.artists.find(t=>t.tag===e);if(a===void 0)return  false;let o=false;t.cover.length>0&&!xc(a.cover??[],t.cover)&&(a.cover=[...t.cover],o=true);let s=t.postCount;return s!==null&&(a.postCount?.value!==s.value||a.postCount.exact!==s.exact)&&(a.postCount={value:s.value,exact:s.exact},o=true),al(a,t.lastPostId,n)&&(o=true),o&&q$1(i),o}function sl(e,t=Date.now()){if(!Us().artists.some(t=>(e.get(t.tag)??0)>(t.lastPostId??0)))return  false;let n=K$1(),r=false;for(let i of n.artists){let n=e.get(i.tag);n!==void 0&&al(i,n,t)&&(r=true);}return r&&q$1(n),r}function cl(e){let t=R$1(e);if(t===null)return  false;let n=K$1(),r=n.artists.filter(e=>e.tag!==t);return r.length!==n.artists.length&&(n.artists=r,q$1(n),true)}var at=new Set;function ot(e){return at.add(e),()=>{at.delete(e);}}function st(e){for(let t of at)try{t(e);}catch(e){m.error(`thumbs-bus: a listener failed`,e);}}var ct=`rule34.xxx`,lt=`https:`;function ut(e){let t;try{t=new URL(e);}catch{return  false}return t.protocol===lt&&(t.hostname===ct||t.hostname.endsWith(`.${ct}`))}var dt=exports("aT",`
.${Bt$1} {
  position: relative;
  anchor-scope: ${Ht$1};
}

.${Bt$1} img.preview,
.${Bt$1} > a > img {
  anchor-name: ${Ht$1};
}
`),ft=`wimg.rule34.xxx`,pt=`https://ws-cdn-video.rule34.xxx`,mt=/^\/+thumbnails\/+([^/]+)\/+thumbnail_([^/]+)\.jpg$/i,ht=`https:`,gt=`thumbnails`,_t=`thumbnail_`,vt=`jpg`,yt=0,bt=new URL(pt).hostname,xt=/^\/+samples\/+([^/]+)\/+sample_([^/]+)\.[^/.]+$/i,St=/^\/+images\/+([^/]+)\/+([^/]+)\.[^/.]+$/i;function Ct(e){return !Number.isInteger(e)||e<yt?null:e}function wt(e){let t=xt.exec(e),n=t===null?St.exec(e):null,r=t??n;if(r===null)return null;let i=r[1],a=r[2];return i===void 0||a===void 0||i.length===0||a.length===0?null:{dir:i,hash:a}}function Tt(e){e.classList.add(Bt$1);}function Et(e){let t;try{t=new URL(e);}catch{return null}if(!ut(e))return null;let n=mt.exec(t.pathname);if(n===null)return null;let r=n[1],i=n[2];return r===void 0||i===void 0||r.length===0||i.length===0?null:`${pt}//images/${r}/${i}.mp4${t.search}`}function Dt(e,t){let n=Ct(t);if(n===null)return null;let r;try{r=new URL(e);}catch{return null}if(r.protocol!==ht||r.hostname!==`wimg.rule34.xxx`&&r.hostname!==bt)return null;let i=wt(r.pathname);return i===null?null:`https://${ft}/${gt}/${i.dir}/${_t}${i.hash}.${vt}?${String(n)}`}var Ot=exports("bR",`:scope > a > img`),kt=`webm-thumb`,At=`video`,jt=`vide`,Mt=/\s+/;function Nt(e){let t=e.trim().split(Mt);return t.includes(At)?true:t[t.length-1]===jt}function Pt(e,t){let n=0;for(let r of e.querySelectorAll(t)){let e=r.querySelector(Ot);e instanceof HTMLImageElement&&(e.classList.contains(kt)||Nt(e.title))&&(r.classList.add(Bt$1,Jt$1),n+=1);}return n}function Ft(e=an$1.thumb){Pt(document,e),ot(t=>{Pt(t,e);});}function It(){Ft(an$1.thumb);}var Lt=`rdw-gif-thumb`,Rt=`animated_gif`,zt=`nimated_gif`,Bt=`animated_gi`,Vt=`rdw-gif-thumb-style`,Ht=`GIF`,Ut=6,Wt=`
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
`.trim();function Gt(e){let t=e.trim().split(Mt);return t.includes(Rt)||t[0]===zt||t[t.length-1]===Bt}function Kt(e,t){let n=0;for(let r of e.querySelectorAll(t)){let e=r.querySelector(Ot);e instanceof HTMLImageElement&&Gt(e.title)&&(r.classList.add(Bt$1,Lt),n+=1);}return n}function qt(e){if(document.getElementById(Vt)===null){let e=document.createElement(`style`);e.id=Vt,e.textContent=Wt,document.head.append(e);}Kt(document,e),ot(t=>{Kt(t,e);});}var _=`html.${c}`,v=`${_}.${Vt$1}`,y=`${_}[${l}="${ee}"]`,Jt=`html[${l}="${u}"]`,Yt=`html[${l}="${d}"]`,Xt=`html[${l}="${ee}"]`,Zt=`rdw-search-tools`,Qt=30,$t=1100,en=96,tn=Ut$1,nn=6,rn=28,an=16,on=`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 6h18'/%3E%3Cpath d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6'/%3E%3Cpath d='M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'/%3E%3Cpath d='M10 11v6'/%3E%3Cpath d='M14 11v6'/%3E%3C/svg%3E") center / contain no-repeat`,sn=4,cn=640,ln=220,b=`:where(:not([class*="rdw-"])${`:not(#${Zt} *)`})`,x=`rdw-post-panel-mounted`,un=`li:has(a[onclick^="iCame("])`,S=Gt$1,dn=`rdw-select__list`,fn=`rdw-ac__list`,pn=`rdw-dialog`,mn=`rdw-playlist-menu`,hn=`thin`,gn=34,_n=2,vn=`rdw-post-panel-actions`,yn=`rdw-post-panel-actions-row`,bn=`rdw-post-panel-fav`,xn=`rdw-post-panel-original`,Sn=`rdw-post-panel-tabpanel`,Cn=`rdw-post-panel-post-action`,wn=`rdw-tabs`,C=`rdw-tabs__tab`,Tn=`rdw-btn--primary`,En=`:not(:disabled:not([aria-busy="true"]))`,Dn=`rdw-search-tools-ai-posts`,On=`rdw-fav-bulk-selected`,kn=`rdw-fav-bulk-check`,An=`rdw-favorites-bulk`,jn=`rdw-favorites-bulk-bar`,Mn=`rdw-favorites-bulk-status`,Nn=`rdw-f-favorites-bulk-selecting`,Pn=`2px`,Fn=`2px`,In=`1.25rem`,Ln=`0.25rem`,Rn=2,zn=`0.75rem`,w=`${_} div#upload-form:has(#fileUpload):has(#tags)`,Bn=`rdw-upload-drag`,Vn=`rdw-upload-has-file`,Hn=`rdw-upload-file-name`,Un=`rdw-upload-preview`,T=`rdw-upload-hint`,Wn=`rdw-upload-note`,Gn=`rdw-notice-gone`,E=`rdw-upload-remove`,Kn=`rdw-upload-preview-box`,qn=`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M18 6 6 18'/%3E%3Cpath d='m6 6 12 12'/%3E%3C/svg%3E") center / contain no-repeat`,Jn=`rdw-upload-tag-count`,Yn=`rdw-upload-tag-count--short`,Xn=`rdw-upload-guide-toggle`,Zn=`rdw-upload-guide-folded`,Qn=`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/%3E%3Cpolyline points='17 8 12 3 7 8'/%3E%3Cline x1='12' x2='12' y1='3' y2='15'/%3E%3C/svg%3E") center / contain no-repeat`,D=`${_} div#forum:not(.response-list)`,O=`${_} div#forum.response-list`,$n=`rdw-forum-row-marked`,er=`rdw-forum-only-new`,tr=`rdw-forum-toolbar`,nr=`rdw-forum-pin`,rr=`rdw-forum-no-value`,ir=`data-rdw-unit`,ar=`rdw-forum-search`,or=`rdw-forum-search-clear`,sr=`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='m21 21-4.3-4.3'/%3E%3C/svg%3E") center / contain no-repeat`,cr=`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M18 6 6 18'/%3E%3Cpath d='m6 6 12 12'/%3E%3C/svg%3E") center / 14px no-repeat`,lr=`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 17v5'/%3E%3Cpath d='M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z'/%3E%3C/svg%3E") center / contain no-repeat`,k={bg:`var(${h.bg})`,surface:`var(${h.surface})`,surface2:`var(${h.surface2})`,border:`var(${h.border})`,text:`var(${h.text})`,muted:`var(${h.muted})`,accent:`var(${h.accent})`,accentSoft:`var(${h.accentSoft})`,danger:`var(${h.danger})`,dangerSoft:`var(${h.dangerSoft})`,tagArtist:`var(${h.tagArtist})`,tagCharacter:`var(${h.tagCharacter})`,tagCopyright:`var(${h.tagCopyright})`,tagMetadata:`var(${h.tagMetadata})`,radiusS:`var(${h.radiusS})`,radiusM:`var(${h.radiusM})`,radiusL:`var(${h.radiusL})`,shadow1:`var(${h.shadow1})`,shadow2:`var(${h.shadow2})`,font:`var(${h.font})`},ur=`
/* —— base —— */
${_} body {
  font-family: ${k.font};
  font-size: 13px;
  line-height: 1.4;
  background: ${k.bg};
  color: ${k.text};
}

${_} body,
${_} body div,
${_} body h1,
${_} body h2,
${_} body h3,
${_} body h4,
${_} body h5,
${_} body h6,
${_} body p,
${_} body ul,
${_} body li,
${_} body dd,
${_} body dt,
${_} body input,
${_} body select,
${_} body button,
${_} body textarea {
  font-family: ${k.font};
}

/* A visited link looks like any other link: one colour for links on a page. */
${_} a:link,
${_} a:visited {
  color: ${k.accent};
  text-decoration: none;
}

${_} a:hover,
${_} a:active {
  color: ${k.text};
  text-decoration: none;
}

/*
 * My Account: "Logout" is not a link but a form button dressed as a heading,
 * <h4><button type="submit" style="… color: inherit …">. It takes the link
 * colour so the list of headings is one colour; the inline style needs
 * !important to be overridden.
 */
${_} h4 > button[type="submit"][style*="color: inherit"] {
  color: ${k.accent} !important;
}

${_} h4 > button[type="submit"][style*="color: inherit"]:hover {
  color: ${k.text} !important;
}

${_} a.last-page {
  color: ${k.muted};
}

${_} a.spoiler,
${_} span.spoiler {
  color: ${k.text};
  background: ${k.text};
}

${_} a.spoiler:hover,
${_} span.spoiler:hover {
  color: ${k.bg};
  background: ${k.text};
}

${_} hr {
  border-color: ${k.border};
}

${_} code {
  font-family: ui-monospace, monospace;
}

/* —— header —— */
${_} div#header {
  background: ${k.surface};
  border-bottom: 1px solid ${k.border};
  margin-bottom: 0.75em;
}

${_} div#header #site-title {
  background-image: none;
  background-color: transparent;
  padding: 12px 18px 4px 18px;
  font: 800 17px ${k.font};
  letter-spacing: -0.02em;
  color: ${k.text};
}

${_} div#header #site-title a {
  color: ${k.text};
  font-weight: 800;
  background: none;
  text-shadow: none;
}

${_} div#header ul#navbar {
  background: transparent;
  padding: 4px 18px 8px 10px;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

${_} div#header ul#navbar li {
  font-size: 13px;
  font-weight: normal;
  padding: 0;
  margin: 0;
  background: transparent;
  background-image: none;
  list-style: none;
  display: inline;
}

${_} div#header ul#navbar li a {
  display: inline-block;
  padding: 6px 10px;
  border-radius: ${k.radiusM};
  color: ${k.muted};
  font-weight: normal;
}

${_} div#header ul#navbar li.current-page {
  background: transparent;
  background-image: none;
}

/* The current section: the text colour and a line under it, so that it does
   not rest on colour alone. The accent on its soft fill was under 4.5:1. */
${_} div#header ul#navbar li.current-page a,
${_} #navbar li.current-page a {
  background: transparent;
  color: ${k.text};
  font-weight: 600;
  border-radius: 0;
  box-shadow: inset 0 -2px 0 ${k.accent};
}

${_} div#header ul#subnavbar {
  background: ${k.surface};
  border-top: 1px solid ${k.border};
  border-bottom: none;
  padding: 6px 18px;
  margin: 0;
}

${_} div#header ul#subnavbar li {
  padding: 0 8px;
  font-size: 12.5px;
}

${_} div#header ul#subnavbar li a {
  color: ${k.muted};
}

${_} div#header ul#subnavbar li a:hover {
  color: ${k.accent};
}

${_} div.tips {
  background: ${k.accentSoft};
  background-image: none;
  border-bottom: 1px solid ${k.border};
  color: ${k.text};
}

/* —— sidebar —— */
${_} div.sidebar {
  width: 228px;
  min-width: 228px;
  max-width: 228px;
  margin-right: 1em;
}

${_} div.sidebar h5,
${_} div.sidebar h6,
${_} ul#tag-sidebar h5,
${_} ul#tag-sidebar h6 {
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
${_} div#comments div#comment-list > div.post > div.col1 img.preview {
  min-width: ${String(en)}px;
  object-fit: cover;
}

/* Standalone "Tags"/"Search" (and similar) headings above the list card */
${_} div.sidebar > h5 {
  display: none;
}

/* Tags between search panel card and tag list (typical site markup) */
${_} div.tag-search + h5 {
  display: none;
}

/* D: Tags heading immediately after search-tools when they are siblings */
${_} ${an$1.tagsHeadingAfterSearchTools} {
  display: none;
}

/* F: native AI filter row — only while search-tools AI posts row is rendered */
${_} body.${Dn} ${an$1.filterAiRow} {
  display: none;
}

${_} div.tag-search,
${_} ul#tag-sidebar {
  background: ${k.surface};
  border: 1px solid ${k.border};
  border-radius: ${k.radiusL};
  padding: 12px;
  box-shadow: ${k.shadow1};
  box-sizing: border-box;
}

${_} div.tag-search {
  margin-bottom: 12px;
}

${_} ul#tag-sidebar {
  margin: 0;
  padding: 12px;
  list-style: none;
}

/*
 * Tag rows: ?/+/- /name (list) or ?/name (post) wrap as inline text;
 * count stays top-right on the first line (artists-sidebar.test markup).
 */
${_} ul#tag-sidebar > li {
  display: block;
  position: relative;
  margin: 0 0 5px;
  padding-right: 4.5em;
  font-size: 12.5px;
  line-height: 1.35;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

${_} ul#tag-sidebar > li > a {
  display: inline;
}

${_} ul#tag-sidebar > li > h5,
${_} ul#tag-sidebar > li > h6 {
  display: block;
  margin-top: 8px;
}

${_} ul#tag-sidebar > li:first-child > h5,
${_} ul#tag-sidebar > li:first-child > h6 {
  margin-top: 0;
}

${_} .tag-count,
${_} span.post-count,
${_} span.tag-count {
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
${_} ul#tag-sidebar > li[class*="tag-type-"] > a:not(:last-of-type) {
  color: ${k.muted};
  font-size: 11px;
  font-weight: normal;
}

${_} .tag-type-artist > a,
${_} .tag-type-artist {
  color: ${k.tagArtist};
}

${_} .tag-type-character > a,
${_} .tag-type-character {
  color: ${k.tagCharacter};
}

${_} .tag-type-copyright > a,
${_} .tag-type-copyright {
  color: ${k.tagCopyright};
}

${_} .tag-type-metadata > a,
${_} .tag-type-metadata {
  color: ${k.tagMetadata};
}

${_} ul#tag-sidebar > li.tag-type-artist > a:last-of-type {
  color: ${k.tagArtist};
  font-size: 12.5px;
  font-weight: normal;
}

${_} ul#tag-sidebar > li.tag-type-character > a:last-of-type {
  color: ${k.tagCharacter};
  font-size: 12.5px;
  font-weight: normal;
}

${_} ul#tag-sidebar > li.tag-type-copyright > a:last-of-type {
  color: ${k.tagCopyright};
  font-size: 12.5px;
  font-weight: normal;
}

${_} ul#tag-sidebar > li.tag-type-metadata > a:last-of-type {
  color: ${k.tagMetadata};
  font-size: 12.5px;
  font-weight: normal;
}

${_} .tag-type-artist > a:hover,
${_} .tag-type-artist:hover,
${_} .tag-type-character > a:hover,
${_} .tag-type-character:hover,
${_} .tag-type-copyright > a:hover,
${_} .tag-type-copyright:hover,
${_} .tag-type-metadata > a:hover,
${_} .tag-type-metadata:hover,
${_} ul#tag-sidebar > li[class*="tag-type-"] > a:last-of-type:hover {
  color: ${k.accent};
}

/* Artist Follow: kit secondary on theme tokens (beats document-chrome #fff) */
${_} button.${Ie.artistFollow} {
  background: ${k.surface};
  border: 1px solid ${k.border};
  color: ${k.text};
  border-radius: ${k.radiusS};
}

${_} button.${Ie.artistFollow}:hover {
  background: ${k.accentSoft};
  border-color: ${k.accent};
  color: ${k.accent};
}

${_} button.${Ie.artistFollow}.${Ie.artistFollowMarked} {
  background: ${k.accentSoft};
  border-color: ${k.accent};
  color: ${k.accent};
}

/* —— search field —— */
${_} div.tag-search input[type="text"],
${_} div.tag-search input[type="search"] {
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

${_} div.tag-search input[type="submit"]${b},
${_} div.tag-search button[type="submit"]${b} {
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

${_} div.tag-search input[type="submit"]${b}:hover,
${_} div.tag-search button[type="submit"]${b}:hover {
  filter: brightness(1.05);
}

/* One ring for the keyboard's focus on anything of the site that is not a
   field: links, thumbnails, buttons. The browser's own was a white rectangle
   on the dark theme. */
${_} a:focus-visible,
${_} button:focus-visible,
${_} summary:focus-visible {
  outline: 2px solid ${k.accent};
  outline-offset: 2px;
  border-radius: 4px;
}

${_} input[type="text"]${b}:focus,
${_} input[type="password"]${b}:focus,
${_} input[type="search"]${b}:focus,
${_} textarea${b}:focus,
${_} select${b}:focus {
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
${_} input${b}:-webkit-autofill,
${_} input${b}:-webkit-autofill:hover,
${_} input${b}:-webkit-autofill:focus,
${_} textarea${b}:-webkit-autofill {
  -webkit-text-fill-color: ${k.text};
  caret-color: ${k.text};
  box-shadow: 0 0 0 1000px ${k.surface} inset;
}

/* —— awesomplete —— */
/* Site hides closed lists with opacity/scale + display:block; do not undo that. */
${_} .awesomplete > ul[hidden],
${_} .awesomplete > ul:empty {
  display: none !important;
  pointer-events: none;
}

${_} .awesomplete > ul:not([hidden]):not(:empty) {
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

${_} .awesomplete > ul:before {
  display: none;
  content: none;
}

${_} .awesomplete > ul > li {
  padding: 6px 10px;
  color: ${k.text};
  cursor: pointer;
}

${_} .awesomplete > ul > li:hover,
${_} .awesomplete > ul > li[aria-selected="true"] {
  background: ${k.accentSoft};
  color: ${k.accent};
}

${_} .awesomplete mark {
  background: ${k.accentSoft};
  color: ${k.text};
}

${_} div.auto_complete {
  background: ${k.surface};
}

${_} div.auto_complete ul {
  border-color: ${k.border};
  background: ${k.surface};
}

${_} div.auto_complete ul li.selected {
  background-color: ${k.accentSoft};
}

${_} div.auto_complete ul strong.highlight {
  color: ${k.accent};
}

/* —— grid / thumbs (cell size unchanged) —— */
${_} div.image-list {
  column-gap: 4px;
  row-gap: 4px;
  align-items: flex-start;
  align-content: flex-start;
}

${_} img.preview,
${_} span.thumb > a > img {
  border-radius: ${k.radiusL};
}

/* Favorites: Remove stays subtle; hover must not paint the thumb cell */
${_} span.thumb,
${_} span.thumb:hover,
${_} span.thumb > a,
${_} span.thumb > a:hover {
  background-color: transparent;
}

${_} span.thumb > a[onclick] {
  color: ${k.muted};
  font-size: 12px;
  font-weight: normal;
  padding: 2px 8px;
  border-radius: ${k.radiusS};
  background: transparent;
  border: none;
}

${_} span.thumb > a[onclick]:hover {
  color: ${k.danger};
  background: transparent;
}

${_} span.thumb > a[onclick] b {
  font-weight: normal;
  color: inherit;
}

/* —— favorites bulk select (F HANDOFF; tokens for Light/Dark/Site) —— */
${_} body.${Nn} span.thumb {
  position: relative;
  cursor: pointer;
}

${_} span.thumb.${On} {
  outline: ${Pn} solid ${k.accent};
  outline-offset: ${Fn};
  border-radius: ${k.radiusL};
}

/*
 * Check badge is a sibling of a#p{ID}, never inside the link.
 * Hidden until the thumb is selected.
 */
${_} span.thumb > .${kn} {
  position: absolute;
  top: ${Ln};
  left: ${Ln};
  z-index: ${String(Rn)};
  display: none;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: ${In};
  height: ${In};
  border-radius: 50%;
  background: ${k.accent};
  color: ${k.surface};
  font-size: ${zn};
  font-weight: 700;
  line-height: 1;
  pointer-events: none;
}

${_} span.thumb.${On} > .${kn} {
  display: inline-flex;
}

${_} #${An},
${_} .${jn} {
  color: ${k.text};
}

${_} #${An} .${Mn} {
  color: ${k.muted};
}

/* The frame of a video. With "Play icon on video thumbnails" on, the feature
   takes it off and puts a label on the thumb instead (features/video-mark.ts). */
${_} .${Jt$1} > a > img,
${_} .webm-thumb {
  border: 1px solid ${k.accent};
  box-sizing: border-box;
}

${_} img.flagged,
${_} img.has-children,
${_} img.has-parent,
${_} img.pending,
${_} img.video {
  border-width: 1px;
  border-style: solid;
  box-sizing: border-box;
}

${_} img.flagged {
  border-color: ${k.danger};
}

${_} img.has-children {
  border-color: ${k.tagCharacter};
}

${_} img.has-parent {
  border-color: ${k.tagMetadata};
}

${_} img.pending,
${_} img.video {
  border-color: ${k.accent};
}

/* —— pagination —— */
${_} div#paginator,
${_} .pagination {
  display: block;
  padding: 1.5em 0 1em;
  text-align: center;
  clear: both;
}

${_} div#paginator a,
${_} .pagination a {
  display: inline-block;
  margin: 0 3px;
  padding: 4px 10px;
  border: 1px solid ${k.border};
  border-radius: ${k.radiusM};
  background: ${k.surface};
  color: ${k.text};
  text-decoration: none;
}

${_} div#paginator a:hover,
${_} .pagination a:hover {
  background: ${k.accentSoft};
  color: ${k.accent};
  border-color: ${k.accent};
}

${_} div#paginator a.current,
${_} div#paginator span.current,
${_} .pagination a.current,
${_} .pagination span.current {
  background: ${k.accent};
  border-color: ${k.accent};
  color: ${k.surface};
  font-weight: 600;
}

${_} div#paginator span {
  margin: 0 3px;
  padding: 4px 8px;
}

${_} .manual-page-chooser > input[type="text"] {
  width: 4em;
  height: 28px;
  border: 1px solid ${k.border};
  border-radius: ${k.radiusS};
  background: ${k.surface};
  color: ${k.text};
  padding: 0 6px;
}

${_} .manual-page-chooser > input[type="submit"] {
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
${_} input${b},
${_} select${b},
${_} textarea${b},
${_} button${b} {
  color: ${k.text};
  font-family: ${k.font};
}

${_} input[type="text"]${b},
${_} input[type="password"]${b},
${_} input[type="search"]${b},
${_} input[type="number"]${b},
${_} select${b},
${_} textarea${b} {
  background: ${k.surface};
  border: 1px solid ${k.border};
  border-radius: ${k.radiusS};
  color: ${k.text};
}

${_} button${b},
${_} input[type="submit"]${b},
${_} input[type="button"]${b},
${_} .gdprbutton button {
  background: ${k.surface};
  border: 1px solid ${k.border};
  border-radius: ${k.radiusS};
  color: ${k.text};
  padding: 4px 10px;
  cursor: pointer;
}

${_} button${b}:hover,
${_} input[type="submit"]${b}:hover,
${_} input[type="button"]${b}:hover,
${_} .gdprbutton button:hover {
  background: ${k.accentSoft};
  border-color: ${k.accent};
  color: ${k.accent};
}

/* Keep search submit as primary accent (overrides generic button chrome) */
${_} div.tag-search input[type="submit"],
${_} div.tag-search button[type="submit"],
${_} .manual-page-chooser > input[type="submit"] {
  background: ${k.accent};
  border: none;
  color: ${k.surface};
  font-weight: 600;
}

${_} div.tag-search input[type="submit"]:hover,
${_} div.tag-search button[type="submit"]:hover,
${_} .manual-page-chooser > input[type="submit"]:hover {
  background: ${k.accent};
  border: none;
  color: ${k.surface};
  filter: brightness(1.05);
}

${_} table {
  color: ${k.text};
}

${_} tr.tableheader,
${_} thead tr {
  background: ${k.surface2} !important;
  background-image: none !important;
  color: ${k.text};
}

${_} table.highlightable th {
  color: ${k.text};
  background: ${k.surface2};
}

${_} table.highlightable td {
  border-color: ${k.border};
}

${_} table.highlightable > tbody > tr:hover {
  background: ${k.accentSoft};
}

${_} table tr.good {
  background: ${k.accentSoft};
}

${_} table tr.selected {
  background: ${k.accentSoft} !important;
}

${_} table tr.highlight {
  background: ${k.surface2};
}

${_} table tr.pending-tag {
  background: ${k.surface2};
}

/* Zebra without native green tint */
${_} table tr:nth-child(odd) {
  background: ${k.surface2};
}

/* —— data tables: one frame for every list (aliases, artists, tags, pools, forum) —— */
${_} table.highlightable {
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
${v} div.image-list > span > a[onclick] {
  color: ${k.muted};
  font-size: 12px;
}

${v} div.image-list > span > a[onclick] > b {
  font-weight: normal;
}

${v} div.image-list > span > a[onclick]:hover {
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
${v} div.image-list > span:not(.thumb):not(:has(span.thumb)) {
  /* The cell carries an inline display: grid. */
  display: none !important;
}

${v} div.image-list > span > span.thumb {
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
  ${v} div.image-list > span:has(> a[onclick]) {
    anchor-scope: ${tn};
    grid-template-rows: auto !important;
  }

  ${v} div.image-list > span:has(> a[onclick]) > br {
    display: none;
  }

  ${v} div.image-list > span > span.thumb > a > img {
    anchor-name: ${Ht$1}, ${tn};
  }

  ${v} div.image-list > span > a[onclick] {
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

  ${v} div.image-list > span > a[onclick]::before {
    content: "";
    width: ${String(an)}px;
    height: ${String(an)}px;
    background: rgb(28, 34, 40);
    -webkit-mask: ${on};
    mask: ${on};
  }

  ${v} div.image-list > span > a[onclick]:hover::before {
    background: ${k.danger};
  }

  ${v} div.image-list > span:hover > a[onclick] {
    opacity: 0.65;
  }

  ${v} div.image-list > span > a[onclick]:hover,
  ${v} div.image-list > span > a[onclick]:focus-visible {
    opacity: 1;
  }

  ${v} body.${Nn} div.image-list > span > a[onclick] {
    display: none;
  }
}

/*
 * Comments and forum posts: the site gives the text columns fixed widths
 * (50em and 30em) and leaves half the window empty. They take the width that
 * is there, up to a readable limit.
 */
${_} div#comments div#comment-list > div.post {
  float: none;
  display: flex;
  gap: 16px;
  max-width: ${String($t)}px;
}

${_} div#comments div#comment-list > div.post > div.col1 {
  float: none;
  flex: 0 0 auto;
}

${_} div#comments div#comment-list > div.post > div.col2 {
  float: none;
  flex: 1 1 auto;
  width: auto;
  min-width: 0;
}

${_} div.response-list > div.post {
  display: flex;
  max-width: ${String($t)}px;
}

${_} div.response-list > div.post > div.author {
  float: none;
  flex: 0 0 auto;
}

${_} div.response-list > div.post > div.content {
  float: none;
  flex: 1 1 auto;
  width: auto;
  min-width: 0;
}

/*
 * Wiki → Create: the intro and the form labels carry an inline dark grey at
 * 11px, unreadable on a dark page. Inline styles need !important.
 */
${_} div.content > div[style*="width: 100%"] > div[style*="font-size: 11px"],
${_} div.content > div[style*="width: 100%"] center > div[style*="font-size: 11px"] {
  color: ${k.muted} !important;
  font-size: 12px !important;
}

${_} div.content > div[style*="width: 100%"] > div[style*="font-size: 11px"] > h3 {
  color: ${k.text};
}

/* Aliases: the example line under the intro is pure red inline. */
${_} div#content > div[style^="color:"] {
  color: ${k.muted} !important;
}

/* Artists: the links under the pager (Create, Order by …) are oversized. */
${_} div#content > div#footer {
  font-size: 13px;
}

/*
 * My Account: a bare list of headings (div#user-index > [h4 > a, p]…, then
 * h1 > a "To main post page"). One card, quiet captions, a normal last link.
 */
${_} div#user-index {
  box-sizing: border-box;
  max-width: ${String(cn)}px;
  padding: 8px 20px 16px;
  background: ${k.surface};
  border: 1px solid ${k.border};
  border-radius: ${k.radiusL};
}

${_} div#user-index h4 {
  margin: 14px 0 2px;
  font-size: 15px;
}

${_} div#user-index > p {
  margin: 0;
  color: ${k.muted};
}

${_} div#user-index > h1 {
  margin: 0;
  font-size: 13px;
  font-weight: normal;
}

/* Help: each group (div#static-more > div > ul > [li > h4, li > a]) is a card. */
${_} div#static-more > div {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 16px;
}

${_} div#static-more > div > ul {
  box-sizing: border-box;
  min-width: ${String(ln)}px;
  margin: 0;
  padding: 12px 20px 14px;
  list-style: none;
  background: ${k.surface};
  border: 1px solid ${k.border};
  border-radius: ${k.radiusL};
}

${_} div#static-more > div > ul > li {
  margin: 0;
  padding: 2px 0;
}

${_} div#static-more > div > ul h4 {
  margin: 0 0 4px;
}

/* Forms are not data: no stripes across their rows. */
${_} table.form tr:nth-child(odd),
${_} div#upload-form table tr:nth-child(odd),
${_} div#edit-form table tr:nth-child(odd) {
  background: transparent;
}

${_} table.form th {
  color: ${k.muted};
}

/* —— site form controls: one height, readable padding —— */
${_} input[type="text"]${b},
${_} input[type="password"]${b},
${_} input[type="search"]${b},
${_} input[type="number"]${b},
${_} select${b} {
  box-sizing: border-box;
  min-height: ${String(Qt)}px;
  padding: 4px 8px;
  font-size: 13px;
}

${_} textarea${b} {
  box-sizing: border-box;
  padding: 6px 8px;
  font-size: 13px;
}

/* "Choose File": the browser's own button, dressed as a secondary button. */
${_} input[type="file"]${b} {
  color: ${k.text};
  font-size: 12px;
}

${_} input[type="file"]${b}::file-selector-button {
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

${_} input[type="file"]${b}::file-selector-button:hover {
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
${w} .${Wn} {
  color: ${k.muted};
  font-size: 12px;
  line-height: 1.5;
}

${w} .${Wn} > b {
  color: ${k.text};
}

/* The site's timing line under the form, a leftover of debugging. */
${_} div#content:has(> div#upload-form) > center {
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
${w} .${Jn} {
  margin: 4px 0 0;
  color: ${k.muted};
}

${w} .${Jn}.${Yn} {
  color: ${k.danger};
  font-weight: 600;
}

${w} .${Jn}[hidden] {
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

${w} td.${Zn} > div {
  display: none;
}

${w} button.${Xn} {
  float: right;
  margin: 0 0 4px 12px;
  padding: 0;
  border: 0;
  background: none;
  color: ${k.accent};
  font: 12px ${k.font};
  cursor: pointer;
}

${w} td.${Zn} > button.${Xn} {
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
${w} td.${Bn}:has(> .${T}) {
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
  -webkit-mask: ${Qn};
  mask: ${Qn};
}

${w} td.${Vn}:has(> .${T})::before {
  display: none;
}

${w} td:has(> .${T}):has(> #fileUpload:focus-visible) {
  outline: 2px solid ${k.accent};
  outline-offset: 2px;
}

${w} .${T} {
  font-size: 13px;
}

${w} .${Hn} {
  color: ${k.text};
  font-size: 13px;
  font-weight: 600;
  overflow-wrap: anywhere;
}

/* As large as the column lets it be: the zone grows with the picture. */
${w} img.${Un} {
  max-width: 100%;
  height: auto;
  border-radius: ${k.radiusM};
}

${w} img.${Un}[hidden] {
  display: none;
}

/* Once a file is chosen the hint is of no use; the button that takes it out is. */
${w} td.${Vn} > .${T} {
  display: none;
}

${w} .${Kn} {
  position: relative;
  display: inline-block;
  max-width: 100%;
  line-height: 0;
}

/* A file that is not a picture has none: the cross goes to the corner of the zone. */
${w} .${Kn}:has(> img[hidden]) {
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
  -webkit-mask: ${qn};
  mask: ${qn};
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
${D} > table.highlightable > tbody > tr > td.${rr} {
  visibility: hidden;
}

${D} > table.highlightable > tbody > tr > td:nth-child(5) {
  grid-area: replies;
  font-size: 13px;
}

${D} > table.highlightable > tbody > tr > td[${ir}]::after {
  content: " " attr(${ir});
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

${D} .${nr} {
  display: inline-block;
  width: 14px;
  height: 14px;
  margin-right: 6px;
  background: ${k.muted};
  -webkit-mask: ${lr};
  mask: ${lr};
  vertical-align: -2px;
}

/* The search: a magnifier in the field and a button that clears it. */
${D} form.${ar} {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 560px;
}

${D} form.${ar}::before {
  content: "";
  position: absolute;
  left: 9px;
  top: 50%;
  z-index: 1;
  width: 14px;
  height: 14px;
  transform: translateY(-50%);
  background: ${k.muted};
  -webkit-mask: ${sr};
  mask: ${sr};
  pointer-events: none;
}

${D} form.${ar} > input[name="search"] {
  flex: 1 1 auto;
  width: auto !important;
  min-width: 0;
  padding-left: 30px;
  padding-right: 30px;
}

/* Pulled back over the right end of the field. */
${D} button.${or} {
  flex: none;
  width: 22px;
  height: 22px;
  margin: 0 0 0 -34px;
  padding: 0;
  border: 0;
  border-radius: ${k.radiusS};
  background: ${k.muted};
  -webkit-mask: ${cr};
  mask: ${cr};
  cursor: pointer;
}

${D} button.${or}:hover {
  background: ${k.text};
}

${D} button.${or}[hidden] {
  display: none;
}

${D} .${tr} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 0 0 10px;
}

${D}.${er} > table.highlightable > tbody > tr:not(.${$n}) {
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

${_} .added-tags {
  color: ${k.tagCharacter};
}

${_} .removed-tags {
  color: ${k.danger};
}

${_} .obsolete-tag-change {
  color: ${k.text};
}

/* —— notices / cards —— */
${_} div.status-notice,
${_} div.notice,
${_} div.has-mail,
${_} div.blocked,
${_} div.quote,
${_} div.help div.code,
${_} div#post-comments div#comment-list > div,
${_} div#comments div#comment-list > div.post > div.col2,
${_} div.response-list > div.post > div.content {
  background: ${k.surface};
  border: 1px solid ${k.border};
  border-radius: ${k.radiusL};
  box-shadow: ${k.shadow1};
}

${_} div.status-notice {
  border-color: ${k.border};
  padding: 1em;
  margin: 1em;
  color: ${k.text};
}

/* In the row of a post a notice stands over the picture, beside the panel:
   it begins where the panel begins and is as wide as the picture. With the
   margin of a notice it was lower than the panel and narrower than the
   picture (Kaze, 19.11.2026, the "previous / next" strip). */
${_} div#post-view div.flexi div.status-notice {
  margin: 0 0 12px;
}

${_} div.notice {
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
${_} body > div#notice.notice {
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

${_} body > div#notice.notice {
  cursor: pointer;
}

${_} body > div#notice.notice:empty,
${_} body > div#notice.notice.${Gn} {
  display: none;
}

${_} div.has-mail {
  border-color: ${k.tagCharacter};
  background: ${k.accentSoft};
  padding: 1em;
  margin: 1em;
  color: ${k.text};
}

${_} div.blocked {
  border-color: ${k.danger};
  background: ${k.dangerSoft};
  color: ${k.danger};
  padding: 1em;
  margin: 1em;
}

${_} div.quote {
  border-color: ${k.border};
  background: ${k.surface2};
  background-image: none;
  color: ${k.text};
  padding: 12px;
  margin-top: 10px;
}

${_} div.help div.code {
  border: 1px dashed ${k.border};
  background: ${k.surface2};
  color: ${k.text};
}

${_} div.help h4 {
  color: ${k.tagCharacter};
}

${_} div#post-comments div#comment-list > div,
${_} div#comments div#comment-list > div.post > div.col2 {
  padding: 12px;
  margin-bottom: 1em;
}

${_} div.response-list > div.post > div.content {
  padding: 10px 12px;
}

${_} div.response-list > div.post > div.content > div.footer {
  color: ${k.muted};
  margin-top: 0.75em;
}

/* Edit | Respond (and similar) on comments / forum posts */
${_} div.response-list > div.post > div.content > div.footer a,
${_} ul.flat-list li a {
  color: ${k.muted};
  font-weight: normal;
  padding: 2px 6px;
  border-radius: ${k.radiusS};
}

${_} div.response-list > div.post > div.content > div.footer a:hover,
${_} ul.flat-list li a:hover {
  color: ${k.accent};
  background: ${k.accentSoft};
}

${_} ul.flat-list li a.forum-update {
  font-style: italic;
  color: ${k.muted};
}

${_} div.link-list ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

${_} div.link-list li {
  margin: 0 0 4px;
}

${_} div.link-list a {
  display: inline-block;
  padding: 4px 8px;
  border-radius: ${k.radiusS};
  color: ${k.muted};
}

${_} div.link-list a:hover {
  color: ${k.accent};
  background: ${k.accentSoft};
}

${_} span.author,
${_} span.date {
  color: ${k.muted};
}

${_} span.locked-topic {
  color: ${k.muted};
}

${_} strong.divider {
  color: ${k.muted};
}

${_} div#footer {
  color: ${k.muted};
}

${_} div#footer > .footer-disabled,
${_} div#footer > #label {
  color: ${k.muted};
}

${_} div#user-record > table > tbody > tr.positive-record {
  background: ${k.accentSoft};
}

${_} div#user-record > table > tbody > tr.negative-record {
  background: ${k.dangerSoft};
}

${_} div.mailbody {
  background-color: ${k.surface};
  border-color: ${k.border};
}

${_} div.mail .received {
  color: ${k.tagCharacter};
}

${_} div.mail .sent {
  color: ${k.danger};
}

${_} .gdprinner {
  background-color: ${k.surface};
  border-color: ${k.border};
  color: ${k.text};
}

/* —— post page —— */
/* E: hide native left-column chrome only while body.rdw-post-panel-mounted */
${_} body.${x} div#stats {
  display: none !important;
}

${_} body.${x} div.link-list {
  display: none !important;
}

${_} body.${x} ${un} {
  display: none !important;
}

/*
 * Comments of a post (markup from Kaze, 18.11.2026). The line about the order
 * is the site's div holding the link "Change", among the comments: not a card, a small
 * grey line. A comment keeps its card; the bold line of score, "Up" and
 * "Report comment" is small and grey, and the rule after each comment and the
 * line breaks between them go.
 */
${_} div#post-comments div#comment-list > div:not([id]) {
  padding: 0;
  margin: 0 0 8px;
  border: 0;
  background: transparent;
  box-shadow: none;
  color: ${k.muted};
  font-size: 12px;
}

${_} div#post-comments div#comment-list > br,
${_} div#post-comments div#comment-list > div[id] > hr,
${_} div#post-comments div#comment-list > a#ci[hidden] {
  display: none;
}

${_} div#post-comments div#comment-list > div[id] > div.col1 > b {
  display: block;
  margin-top: 2px;
  color: ${k.muted};
  font-size: 11.5px;
  font-weight: normal;
}

${_} div#post-comments div#comment-list > div[id] > div.col1 > span {
  color: ${k.muted};
  font-size: 11.5px;
}

/* The site's "Edit | Respond" under the picture: two links, not the loudest
   heading of the page. The script marks the line. */
${_} .rdw-post-reply-links {
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
${_} div#new_user_modal {
  background: ${k.surface};
  border: 1px solid ${k.border};
  border-radius: ${k.radiusL};
  box-shadow: ${k.shadow2};
  color: ${k.text};
  font: 13px/1.5 ${k.font};
}

${_} div#new_user_modal > h2 {
  margin: 0 0 8px;
  color: ${k.text};
  font-size: 16px;
}

${_} div#new_user_modal > p,
${_} div#new_user_modal > ul,
${_} div#new_user_modal > label {
  color: ${k.text};
}

/* The site sets this line red in its own style attribute. */
${_} div#new_user_modal > p[style] {
  color: ${k.danger} !important;
}

${_} div#new_user_modal button {
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

${_} div#new_user_modal button#confirm_agree_btn {
  border-color: ${k.accent};
  background: ${k.accent};
  color: ${k.surface};
}

/* The site's form for a comment, brought into the panel under the comments. */
${_} #${S} form#comment_form table {
  width: 100%;
  border: 0;
  background: transparent;
}

${_} #${S} form#comment_form tr {
  background: transparent;
}

${_} #${S} form#comment_form td {
  padding: 0 0 6px;
  border: 0;
}

${_} #${S} form#comment_form td:empty {
  display: none;
}

${_} #${S} form#comment_form textarea {
  box-sizing: border-box;
  width: 100%;
  min-height: 96px;
}

${_} .rdw-post-panel-comments-empty {
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
${_} body.${x} #${S} #post-comments {
  max-width: none;
}

${_} img#image {
  border-radius: ${k.radiusL};
}

${_} div#post-view > div#right-col > div#edit,
${_} div#edit-box {
  background: ${k.surface};
  border: 1px solid ${k.border};
  border-radius: ${k.radiusL};
  color: ${k.text};
}

${_} div#note-container > div.note-body {
  background: ${k.surface};
  border: 1px solid ${k.border};
  color: ${k.text};
  border-radius: ${k.radiusS};
}

${_} div#note-container > div.note-body > p.tn,
${_} tn {
  color: ${k.muted};
}

${_} div#note-container > div.note-box {
  border-color: ${k.accent};
  background: ${k.accentSoft};
}

${_} div#note-container > div.note-box > div.note-corner {
  background: ${k.accent};
}

${_} div#note-container > div.unsaved {
  background: ${k.surface};
  border-color: ${k.danger};
}

${_} div#note-container > div.unsaved > div.note-corner {
  background: ${k.danger};
}

${_} a.original-file-changed#highres {
  color: ${k.accent};
}

${_} div#post-add p#scale {
  color: ${k.muted};
}

${_} h2.wiki-title {
  color: ${k.accent};
}

${_} div.wiki > h2.title {
  color: ${k.accent};
}

${_} div#wiki-show > div#body > div#byline {
  color: ${k.muted};
}

${_} div#wiki-diff del {
  background-color: ${k.dangerSoft};
  color: ${k.danger};
}

${_} div#wiki-diff ins {
  background-color: ${k.accentSoft};
  color: ${k.text};
}

${_} dt.bad {
  color: ${k.danger};
}

${_} .blacklisted-tags-disabled {
  color: ${k.muted} !important;
}

/* —— dark theme contrast (tokens already dark; keep chrome readable) —— */
${y} a:hover,
${y} a:active {
  color: ${k.text};
}

${y} a.spoiler,
${y} span.spoiler {
  color: ${k.bg};
  background: ${k.text};
}

${y} a.spoiler:hover,
${y} span.spoiler:hover {
  color: ${k.text};
  background: ${k.muted};
}

${y} div#paginator a.current,
${y} div#paginator span.current,
${y} .pagination a.current,
${y} .pagination span.current,
${y} div.tag-search input[type="submit"],
${y} div.tag-search button[type="submit"],
${y} .manual-page-chooser > input[type="submit"],
${y} span.thumb > .${kn},
${y} #${S} .${bn}.${Tn}${En} {
  color: ${k.text};
}

${y} div.has-mail {
  background: ${k.surface2};
  border-color: ${k.tagCharacter};
}

/*
 * Post panel actions + tabs (A→E HANDOFF).
 * Unscoped under #rdw-post-actions so Site default/Site dark (no html.rdw-skin)
 * still beat native button/link chrome via document --rdw-* tokens.
 */
#${S} .${vn},
#${S} .${yn},
#${S} .${Sn} {
  color: ${k.text};
}

#${S} .${bn}.${Tn}${En} {
  background: ${k.accent};
  border-color: ${k.accent};
  color: ${k.surface};
}

#${S} .${xn} {
  box-sizing: border-box;
  width: ${String(gn)}px;
  height: ${String(gn)}px;
  min-width: ${String(gn)}px;
  min-height: ${String(gn)}px;
  background: ${k.surface};
  border: 1px solid ${k.border};
  color: ${k.text};
  text-decoration: none;
}

#${S} .${wn} {
  border-bottom: 1px solid ${k.border};
  color: ${k.text};
}

#${S} .${C} {
  background: transparent;
  border: 0;
  border-bottom: ${String(_n)}px solid transparent;
  color: ${k.muted};
}

#${S} .${C}[aria-selected="true"] {
  color: ${k.text};
  font-weight: 600;
  border-bottom-color: ${k.accent};
}

#${S} .${Cn} {
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
${Xt} #${S} .${bn}.${Tn}${En} {
  color: ${k.text};
}

/*
 * Own scrollable UI — tokens for all four themes (site/site-dark have no html.rdw-skin).
 * Fixes white post-column scrollbar on dark. Kit lists/dialogs + playlist menu.
 */
#${S},
.${dn},
.${fn},
.${pn},
.${mn} {
  scrollbar-width: ${hn};
  scrollbar-color: ${k.border} ${k.surface};
}

/* Site autocomplete lists under rdw-skin */
${_} .awesomplete > ul:not([hidden]):not(:empty),
${_} div.auto_complete ul {
  scrollbar-width: ${hn};
  scrollbar-color: ${k.border} ${k.surface};
}

/*
 * Script page host sits on site bg for Site default / Site dark (no html.rdw-skin).
 * Color uses document tokens; Shadow title inherits from the host once tokens sync.
 */
#${et} {
  color: ${k.text};
}
`.trim();function dr(){return ur}var fr=864e5,pr=`=`,mr=`stylesheet`,hr=`${Me}${Ne}`,gr=`${Me}${Pe}`;function _r(e,t){document.cookie=[`${ke}${pr}${e}`,`expires=${t.toUTCString()}`,`path=/`].join(`; `);}function vr(){document.cookie=[`${ke}${pr}`,`expires=${new Date(0).toUTCString()}`,`path=/`].join(`; `);}var yr=/\/{2,}/g;function br(e){return e.replace(yr,`/`)}function xr(e){try{let t=br(new URL(e,location.href).pathname);return t===hr||t===gr}catch{return  false}}function Sr(e){return e===`dark`?Pe:Ne}function Cr(e,t){return e.includes(`desktop-dark.css`)?e.replace(Pe,t):e.includes(`desktop.css`)?e.replace(Ne,t):e}function wr(){let e=document.querySelectorAll(`link[rel="${mr}"]`);for(let t of e){let e=t.getAttribute(`href`);if(e!==null&&e.length!==0&&xr(e))return t}return null}var Tr=`Site desktop stylesheet link not found; theme cookie updated only`,Er=`loading`,Dr=`DOMContentLoaded`,Or={childList:true,subtree:true},A=null,j=null,kr=false;function Ar(e,t){let n=e.getAttribute(`href`);return n===null||n.length===0?false:(e.setAttribute(`href`,Cr(n,Sr(t))),true)}function jr(){j!==null&&(j.disconnect(),j=null),kr&&=(document.removeEventListener(Dr,Nr),false);}function Mr(){if(A===null)return  false;let e=wr();return e===null||!Ar(e,A)?false:(A=null,jr(),true)}function Nr(){kr=false,Mr()||A!==null&&(m.warn(Tr),A=null,jr());}function Pr(){m.warn(Tr),A=null,jr();}function Fr(e){let t=wr();if(t!==null&&Ar(t,e)){A=null,jr();return}if(A=e,document.readyState!==Er){Pr();return}let n=document.documentElement;j===null&&n!==null&&(j=new MutationObserver(()=>{Mr();}),j.observe(n,Or)),kr||=(document.addEventListener(Dr,Nr),true);}function Ir(e){if(e===`dark`){let e=new Date(Date.now()+365*fr);_r(Ae,e);}else vr();}function Lr(){Ir(`light`),Fr(`light`);}function Rr(e){Ir(e),Fr(e);}var zr=.8,Br=.85,Vr=.05,Hr=`image/jpeg`,Ur=`background-image`,Wr=`background-size`,Gr=`background-position`,Kr=`background-repeat`,qr=`background-attachment`,Jr=`#cc0000`,Yr=`#00aa00`,Xr=`#aa00aa`,Zr=`#ff8800`,Qr=Ln$1,$r=`#f0a0a0`,ei=`#f0f0a0`,ti=`#f0a0f0`,ni=`#90d9ed`,ri=`#74bc6b`,ii=`#333333`,ai=`#e6e6e6`,oi={bg:kn$1,surface:kn$1,surface2:jn$1,border:An$1,text:Mn$1,muted:Pn$1,accent:Nn$1,accentSoft:An$1,danger:pn$1.danger,dangerSoft:pn$1.dangerSoft,warn:pn$1.warn,warnSoft:pn$1.warnSoft,tagArtist:Jr,tagCharacter:Yr,tagCopyright:Xr,tagMetadata:Zr,radiusS:pn$1.radiusS,radiusM:pn$1.radiusM,radiusL:pn$1.radiusL,shadow1:pn$1.shadow1,shadow2:pn$1.shadow2,font:pn$1.font,segTrack:ri,segText:ii,segOn:kn$1,segOnText:Mn$1},si={bg:Fn$1,surface:Fn$1,surface2:In$1,border:Ln$1,text:Rn$1,muted:Bn$1,accent:zn$1,accentSoft:Qr,danger:mn$1.danger,dangerSoft:mn$1.dangerSoft,warn:mn$1.warn,warnSoft:mn$1.warnSoft,tagArtist:$r,tagCharacter:ei,tagCopyright:ti,tagMetadata:ni,radiusS:mn$1.radiusS,radiusM:mn$1.radiusM,radiusL:mn$1.radiusL,shadow1:mn$1.shadow1,shadow2:mn$1.shadow2,font:mn$1.font,segTrack:`transparent`,segText:Bn$1,segOn:Ln$1,segOnText:ai};function ci(e,t,n){let r=mi(t,e);if(r!==null&&r>=4.5)return {text:t,ratio:r,swapped:false};for(let t of n){let n=mi(t,e);if(n!==null&&n>=4.5)return {text:t,ratio:n,swapped:true}}return {text:t,ratio:r,swapped:false}}function li(e){let t=ci(e.surface,e.text,[e.bg,e.muted,e.accent,pn$1.text,mn$1.text]);return t.swapped?{...e,text:t.text}:e}var ui=li(oi),di=li(si);function fi(){return {base:la$1,backgroundDim:0}}function pi(e){return Number.isFinite(e)?Math.min(zr,Math.max(0,e)):0}function mi(e,t){let n=Dn$1(e),r=Dn$1(t);if(n===null||r===null)return null;let i=Math.max(n,r),a=Math.min(n,r);return (i+Vr)/(a+Vr)}function hi(e){let t=e.theme;return t===`site-dark`?di:t===`site`?ui:t===`dark`||t===`custom`&&e.custom?.base===`dark`?mn$1:pn$1}function gi(e){return e.replace(/\\/g,`\\\\`).replace(/"/g,`\\"`)}function _i(){let e=document.body;e!==null&&(e.style.removeProperty(Ur),e.style.removeProperty(Wr),e.style.removeProperty(Gr),e.style.removeProperty(Kr),e.style.removeProperty(qr));}function vi(e,t){let n=document.body;if(n===null)return;if(e===void 0||e.length===0){_i();return}let r=pi(t),i=gi(e);n.style.setProperty(Ur,`linear-gradient(rgba(0, 0, 0, ${String(r)}), rgba(0, 0, 0, ${String(r)})), url("${i}")`),n.style.setProperty(Wr,`cover`),n.style.setProperty(Gr,`center`),n.style.setProperty(Kr,`no-repeat`),n.style.setProperty(qr,`fixed`);}function yi(e){e.theme===`site-dark`?Rr(`dark`):e.theme===`site`?Rr(`light`):Lr();}function bi(){let e=Number.isFinite(window.devicePixelRatio)&&window.devicePixelRatio>0?window.devicePixelRatio:1;return {width:Math.round(window.screen.width*e),height:Math.round(window.screen.height*e)}}function xi(e,t,n,r){if(!Number.isFinite(e)||!Number.isFinite(t)||e<=0||t<=0)return {width:0,height:0};if(e<=n&&t<=r)return {width:Math.round(e),height:Math.round(t)};let i=Math.min(n/e,r/t);return {width:Math.max(1,Math.round(e*i)),height:Math.max(1,Math.round(t*i))}}function Si(e){return new Promise((t,n)=>{let r=new Image;r.onload=()=>{t(r);},r.onerror=()=>{n(Error(`Could not decode image`));},r.src=e;})}function Ci(e){return new Promise((t,n)=>{let r=new FileReader;r.onload=()=>{typeof r.result==`string`?t(r.result):n(Error(`Could not read image file`));},r.onerror=()=>{n(r.error??Error(`Could not read image file`));},r.readAsDataURL(e);})}async function wi(e){let t=await Si(await Ci(e)),n=t.naturalWidth,r=t.naturalHeight,i=bi(),a=xi(n,r,i.width,i.height),o=document.createElement(`canvas`);o.width=a.width,o.height=a.height;let s=o.getContext(`2d`);if(s===null)throw Error(`Could not prepare background image`);return s.drawImage(t,0,0,a.width,a.height),{dataUrl:o.toDataURL(Hr,Br),sourceWidth:n,sourceHeight:r,outputWidth:a.width,outputHeight:a.height,belowScreen:n<i.width||r<i.height}}function Ti(e){let{appearance:t}=e;yi(t),ji({appearance:t,siteSkinCss:e.siteSkinCss??dr(),...e.backgroundDataUrl===void 0?{}:{backgroundDataUrl:e.backgroundDataUrl}});let n=hi(t);if(Di(n),Oi(n),Ei(t.theme)||document.documentElement.classList.remove(c),t.theme===`custom`&&t.custom!==void 0){let n=t.custom;vi(e.backgroundDataUrl??n.backgroundImage,n.backgroundDim??0),n.backgroundDim!==void 0&&document.documentElement.style.setProperty(h.backgroundDim,String(pi(n.backgroundDim)));}else _i();let r=mi(n.text,n.surface);return {contrastWarning:r!==null&&r<4.5,contrastRatio:r}}function Ei(e){return e===`light`||e===`dark`||e===`custom`}function M(e){let t=document.getElementById(e);if(t instanceof HTMLStyleElement)return t;t!==null&&t.remove();let n=document.createElement(`style`);return n.id=e,(document.head??document.documentElement).append(n),n}function Di(e){let t=M(o);return t.textContent=Jn$1(e,`:root`),t}function Oi(e){let t=document.getElementById(et);t instanceof HTMLElement&&Yn$1(t,e);}function ki(e=``){let t=M(s);return t.textContent=e,t}function Ai(e){let t=document.documentElement;t.setAttribute(l,e),Ei(e)?t.classList.add(c):t.classList.remove(c);}function ji(e){let{appearance:t}=e;Ai(t.theme);let n=hi(t);Di(n),Oi(n),ki(e.siteSkinCss??``);let r=document.documentElement;Zn$1(r);let i=e.omitBackgroundImage===true,a=i?void 0:e.backgroundDataUrl??t.custom?.backgroundImage;if(t.theme===`custom`&&t.custom!==void 0){let e=a!==void 0&&a.length>0?{backgroundImage:a,...t.custom.backgroundDim===void 0?{}:{backgroundDim:t.custom.backgroundDim}}:{...t.custom.backgroundDim===void 0?{}:{backgroundDim:t.custom.backgroundDim}};Xn$1(r,e);}else !i&&e.backgroundDataUrl!==void 0&&e.backgroundDataUrl.length>0&&Xn$1(r,{backgroundImage:e.backgroundDataUrl});}var Mi=`light`,Ni=`dark`,Pi,Fi=false;function N(e){return typeof e==`object`&&!!e&&!Array.isArray(e)}function Ii(){return GM_getValue}function Li(){return Fi||=(Pi=Ii()(e,void 0),true),Pi}function Ri(e){return e===`site`?u:e===`site-dark`?d:e===`light`?f:e===`dark`?ee:e===`custom`?te:ne}function zi(e){if(!N(e))return;let t=e.base,n={base:t===Ni||t===Mi?t:Mi};return typeof e.backgroundImage==`string`&&(n.backgroundImage=e.backgroundImage),typeof e.backgroundDim==`number`&&Number.isFinite(e.backgroundDim)&&(n.backgroundDim=e.backgroundDim),n}function Bi(e){if(!N(e))return {theme:ne};let t=e.settings;if(!N(t))return {theme:ne};let n=t.appearance;if(!N(n))return {theme:ne};let r=Ri(n.theme);if(r!==`custom`)return {theme:r};let i=zi(n.custom);return i===void 0?{theme:r}:{theme:r,custom:i}}function Vi(){return Bi(Li())}function Hi(){let e=Li();if(!N(e)||!N(e.settings))return {tweaksEnabled:true,features:{},featureChoice:{}};let t=e.settings,n=typeof t.tweaksEnabled!=`boolean`||t.tweaksEnabled,r={};if(N(t.features))for(let[e,n]of Object.entries(t.features))typeof n==`boolean`&&(r[e]=n);let i={};if(N(t.featureChoice))for(let[e,n]of Object.entries(t.featureChoice))typeof n==`string`&&(i[e]=n);return {tweaksEnabled:n,features:r,featureChoice:i}}function Ui(e,t,n){if(!e.tweaksEnabled)return  false;let r=e.features[t];return r===void 0?n:r}function Wi(e,t,n,r){let i=e.featureChoice[t];return i!==void 0&&r.includes(i)?i:n}function Gi(e){let t=Li();if(N(t)&&N(t.settings)&&N(t.settings.featureState))return t.settings.featureState[e]}function P(e){let t=new URLSearchParams(e),n=t.get(ce),r=t.get(`s`);return n===`post`&&r===`list`?`list`:n===`post`&&r===`view`?`post`:n===`favorites`&&r===`view`?`favorites`:`other`}function Ki(e){let t=new URLSearchParams(e),n=t.get(ce),r=t.get(`s`),i=t.get(`id`);return n!==`post`||r!==`view`||i===null||i.trim().length===0||!/^\d+$/.test(i)?null:i}function qi(e){let t=e.theme===`site-dark`?`dark`:`light`;Ir(t),Fr(t);}function Ji(){if(Rt$1(window.location.hash)===null)return;let e=document.documentElement;if(e===null)return;let t=M(nt);t.textContent=zt$1(),e.classList.add($e);}function Yi(){let e=Vi();ji({appearance:e,siteSkinCss:dr(),omitBackgroundImage:true}),qi(e),Ji(),P(window.location.search)===`favorites`&&document.documentElement.classList.add(Vt$1);}var Xi=`grid-density`,Zi=150,Qi=250,$i=`default`,ea=`compact`,ta=`large`;function na(e,t){let n=qt$1(Xi,e);return [`body.${n} span.thumb,`,`body.${n} span.thumb > a {`,`  width: ${String(t)}px !important;`,`  height: ${String(t)}px !important;`,`}`,`body.${n} img.preview {`,`  max-width: ${String(t)}px !important;`,`  max-height: ${String(t)}px !important;`,`}`].join(`
`)}function ra(){return [`body.${Kt$1(Xi)} div.image-list {`,`  column-gap: 4px !important;`,`  row-gap: 4px !important;`,`}`].join(`
`)}var ia=exports("as",{id:Xi,label:`Grid size`,pages:[`list`,`favorites`],defaultEnabled:true,cssOnly:true,choice:{options:[{value:$i,label:`Default`},{value:ea,label:`Compact (150)`},{value:ta,label:`Large (250)`}],defaultValue:$i},css:[na(ea,Zi),na(ta,Qi),ra()].join(`
`),mount:()=>void 0}),aa=`sidebar-right`,oa=`motion`,sa=Kt$1(oa),ca=`body.${Kt$1(aa)}`,F=`body.${sa}`,I=`120ms`,la=`160ms`,L=`cubic-bezier(0.2, 0, 0, 1)`,ua=`translateY(-2px)`,da=`
${ca} div#post-list > div.sidebar,
${ca} div#post-view > div.sidebar {
  order: 2;
  margin-right: 0 !important;
  margin-left: 1em;
}
${ca} div#post-list > div.content {
  flex: 1 1 auto;
  min-width: 0;
}
`.trim(),fa=[`.rdw-btn`,`.rdw-icon-btn`,`.rdw-seg__btn`,`.rdw-chip`,`.rdw-field__input`,`.rdw-switch__track`,`.rdw-switch__thumb`];function pa(e){return `${fa.map(t=>`${e} ${t}`).join(`,
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
}`}var ma=`@keyframes rdw-appear {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: none; }
}
@keyframes rdw-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}`;function ha(e){return `${e} .rdw-popover {
  animation: rdw-appear ${la} ${L};
}
${e} .rdw-dialog-backdrop {
  animation: rdw-fade ${la} ${L};
}`}var ga=`
@media (prefers-reduced-motion: no-preference) {
${ma}
${F} span.thumb img {
  transition: transform ${la} ${L}, opacity ${I} ${L};
}
/* Not a video thumb: its hover preview is laid over the picture by measured
   position, and a picture that moves would slip from under it. */
${F} span.thumb:not(.rdw-video-thumb):hover img:not(.webm-thumb) {
  transform: ${ua};
}
${F} div#header ul#navbar li a,
${F} div#header ul#navbar li button {
  transition: color ${I} ${L}, box-shadow ${I} ${L};
}
${pa(F)}
${ha(F)}
}
`.trim(),_a=`
@media (prefers-reduced-motion: no-preference) {
${ma}
${pa(`:host-context(${F})`)}
${ha(`:host-context(${F})`)}
}
`.trim(),va={id:aa,label:`Sidebar on the right`,pages:[`list`,`post`],defaultEnabled:false,cssOnly:true,css:da,mount:()=>void 0},ya={id:oa,label:`Motion`,pages:[`list`,`post`,`favorites`,`other`],defaultEnabled:true,cssOnly:true,settingsCaption:`Thumbnails lift under the pointer; buttons, menus and dialogs change smoothly.`,css:ga,mount:()=>void 0},ba=`menu-cleanup`,xa=`Clean header menu`,Sa=`content`,Ca=`rdw-menu-hidden`,wa=Kt$1(ba),Ta=`Header menu not found`,Ea=new Set([`iCame Top 100`,`Discord`,`X`,`Other Sites`,`Contact Us`,`DMCA`,`About`,`TOS`,`My Favorites`]),Da=[`list`,`post`,`favorites`,`other`],Oa=`body.${wa} li.${Ca} { display:none !important; }`; exports({bU:_a,ay:va,az:ya});function ka(e,t){let n=e.closest(`li`);return !(n===null||t!==null&&t.contains(n))}function Aa(){let e=document.getElementById(Sa),t=document.querySelectorAll(`a`),n=[];for(let r of t)r instanceof HTMLAnchorElement&&ka(r,e)&&n.push(r);return n}function ja(e){let t=Aa();if(t.length===0)m.warn(Ta);else for(let e of t){let t=e.textContent?.trim()??``;if(!Ea.has(t))continue;let n=e.closest(`li`);n!==null&&n.classList.add(Ca);}}var Ma=exports("aq",{id:ba,label:xa,pages:[...Da],defaultEnabled:true,cssOnly:true,css:Oa,mount:ja}),Na=new Set,Pa=null,Fa=``;function Ia(e){return Na.has(e)}function La(){return Pa===null?null:{pageKind:Pa,search:Fa}}function Ra(e,t){Pa=e,Fa=t;}function za(e){let t=`${Wt$1}${e.id}`;if(document.getElementById(t)!==null)return;let n=document.createElement(`style`);n.id=t,n.textContent=e.css,document.head.append(n);}function Ba(t,n,r){return {pageKind:n,search:r,getState:e=>e(Nc(t.id)),setState:n=>{Pc(t.id,n);}}}function Va(e){if(e.choice!==void 0)for(let t of e.choice.options)document.body.classList.remove(qt$1(e.id,t.value));}function Ha(e,t,n){if(!Na.has(e.id)&&e.pages.includes(t)){Na.add(e.id);try{e.mount(Ba(e,t,n));}catch(t){m.error(`Feature mount failed: ${e.id}`,t);}}}function Ua(e,t,n,r={}){if(!Na.has(e.id)&&e.pages.includes(t)){if(Ra(t,n),document.body.classList.add(Kt$1(e.id)),e.choice!==void 0){let t=r.choiceValue??(()=>{let t=jc(e.id);return t!==void 0&&e.choice.options.some(e=>e.value===t)?t:e.choice.defaultValue})();Va(e),document.body.classList.add(qt$1(e.id,t));}za(e),Ha(e,t,n);}}function Wa(){return new Promise(e=>{setTimeout(e,0);})}var Ga=`sticky-header`,Ka=`Keep the header and the sidebar in place while scrolling`,qa=`rdw-sticky-header`,R=`rdw-sticky-header`,Ja=`--rdw-header-h`,Ya=`var(${Ja}, 0px)`,Xa=`div#header`,Za=25,Qa=`rdw-skin`,$a=[`div#post-list > div.sidebar`,`div#post-view > div.sidebar`],eo=8,to=$a.join(`, `),no=`--rdw-sidebar-foot`,ro=`rdw-sidebar-more`,io=32,ao=2,oo=`
html.${R} ${Xa} {
  position: sticky;
  top: 0;
  z-index: ${String(Za)};
}
/* The site's header has no background of its own: held at the top it would
   let the page show through. The skin gives its header one; without the skin
   (Site default, Site dark) it gets the colour of the page. */
html.${R}:not(.${Qa}) ${Xa} {
  background: var(--rdw-bg);
}
html.${R} ${$a[0]},
html.${R} ${$a[1]} {
  position: sticky;
  top: calc(${Ya} + ${String(eo)}px);
  max-height: calc(100vh - ${Ya} - 16px - var(${no}, 0px));
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--rdw-border) transparent;
}
/* A strip that stays at the bottom edge of the sidebar and fades its last
   lines into the page. Not a mask on the sidebar: a mask hides everything
   drawn from inside it that lies outside its box, and a dialog opened from
   the search panel is drawn in the middle of the window. */
html.${R} div.sidebar.${ro}::after {
  content: "";
  position: sticky;
  bottom: 0;
  display: block;
  height: ${String(io)}px;
  margin-top: -${String(io)}px;
  background: linear-gradient(to bottom, transparent, var(--rdw-bg));
  pointer-events: none;
}
`.trim(),z=null; exports({cN:Ga,cF:Ka,cG:qa,aR:Ya});function so(){let e=document.querySelector(Xa),t=document.documentElement;if(e===null||!t.classList.contains(`rdw-sticky-header`)){t.style.removeProperty(Ja);return}let n=Math.round(e.getBoundingClientRect().height);t.style.setProperty(Ja,`${String(n)}px`),lo();}function co(){let e=document.querySelector(to);return e instanceof HTMLElement?e:null}function lo(){let e=document.documentElement,t=co(),n=t?.parentElement;if(t===null||n==null){e.style.removeProperty(no);return}V!==t&&document.documentElement.classList.contains(`rdw-sticky-header`)&&(V?.removeEventListener(`scroll`,B),V=t,t.addEventListener(`scroll`,B,{passive:true}));let r=0;for(let e of n.children)e!==t&&e instanceof HTMLElement&&(r=Math.max(r,e.offsetHeight));let i=r<window.innerHeight?0:Math.max(0,Math.round(window.innerHeight-n.getBoundingClientRect().bottom));e.style.setProperty(no,`${String(i)}px`);let a=t.scrollHeight-t.scrollTop-t.clientHeight;t.classList.toggle(ro,a>ao);}function B(){lo();}var V=null;function uo(e){window.removeEventListener(`scroll`,B),window.removeEventListener(`resize`,B),V?.removeEventListener(`scroll`,B),V?.classList.remove(ro),V=null,e&&(window.addEventListener(`scroll`,B,{passive:true}),window.addEventListener(`resize`,B,{passive:true}),V=co(),V?.addEventListener(`scroll`,B,{passive:true}));}function fo(e){document.documentElement.classList.toggle(R,e),z!==null&&(z.disconnect(),z=null);let t=document.querySelector(Xa);e&&t!==null&&typeof ResizeObserver==`function`&&(z=new ResizeObserver(so),z.observe(t),document.body!==null&&z.observe(document.body)),uo(e),so();}var H=`rdw-nav-more`,U=`rdw-nav-more-list`,W=`rdw-nav-account`,po=`rdw-nav-icon`,G=`rdw-subnav-action`,mo=exports("t",`rdw-nav-due`),K=`rdw-subnav-`,ho=`rdw-header-layout`,go=`More`,_o=`My Account`,q=`div#header ul#subnavbar`,vo=[{title:`Browse`,links:[`Tags`,`Artists`,`Pools`,`Aliases`,`Wiki`]},{title:`Community`,links:[`Comments`,`Forum`,`Help`]}],yo=new Set(vo.flatMap(e=>e.links)),bo=`rdw-nav-more-heading`,xo=Math.max(...vo.map(e=>e.links.length))+1,So=new Map([[`Video`,`video`],[`Random`,`random`],[`Help`,`help`],[`Upload`,`upload`],[`Upload Video`,`upload-video`]]),Co=new Set([`Upload`,`Upload Video`]);function J(e){return `url("data:image/svg+xml,${`%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E${e.replaceAll(`<`,`%3C`).replaceAll(`>`,`%3E`)}%3C/svg%3E`}") center / contain no-repeat`}var Y={chevron:J(`<path d='m6 9 6 6 6-6'/>`),stats:J(`<path d='M3 3v18h18'/><path d='M18 17V9'/><path d='M13 17V5'/><path d='M8 17v-3'/>`),account:J(`<path d='M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2'/><circle cx='12' cy='7' r='4'/>`),settings:J(`<path d='M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z'/><circle cx='12' cy='12' r='3'/>`),video:J(`<polygon points='6 3 20 12 6 21 6 3'/>`),random:J(`<path d='m18 14 4 4-4 4'/><path d='m18 2 4 4-4 4'/><path d='M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22'/><path d='M2 6h1.972a4 4 0 0 1 3.6 2.2'/><path d='M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45'/>`),help:J(`<circle cx='12' cy='12' r='10'/><path d='M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3'/><path d='M12 17h.01'/>`),upload:J(`<path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/><polyline points='17 8 12 3 7 8'/><line x1='12' x2='12' y1='3' y2='15'/>`),uploadVideo:J(`<path d='m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5'/><rect x='2' y='6' width='14' height='12' rx='2'/>`)},X=`div#header ul#navbar`,wo=`div#header:has(> #site-title):has(> ul#navbar)`,To=`favorites`,Eo=`aria-current`,Do=18,Z=14,Oo=30;function Q(e,t,n){return `${e}::before {
  content: "";
  display: inline-block;
  flex: none;
  width: ${String(n)}px;
  height: ${String(n)}px;
  background: currentColor;
  -webkit-mask: ${t};
  mask: ${t};
}`}var ko=`
${wo} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}
${wo} > * {
  flex: 0 0 100%;
  box-sizing: border-box;
}
${wo} > #site-title {
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
${wo} > ul#navbar {
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
${X} > li.${po} > a {
  display: inline-flex;
  align-items: center;
  font-size: 0;
  line-height: 0;
  padding: 6px 8px;
}
${Q(`${X} > li#${ot$1.stats} > a`,Y.stats,Do)}
${Q(`${X} > li.${W} > a`,Y.account,Do)}
${Q(`${X} > li#${ot$1.settings} > a`,Y.settings,Do)}
${X} > li.${mo} > a {
  position: relative;
}
${X} > li.${mo} > a::after {
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
  z-index: ${String(Oo)};
  display: grid;
  /* A column to a group: the heading, then its sections. */
  grid-auto-flow: column;
  grid-template-rows: repeat(${String(xo)}, auto);
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
${X} ul.${U} > li.${bo} {
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
${X} ul.${U} > li:not(.${bo}) > a {
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
${oo}
`.trim();function Ao(){if(document.getElementById(ho)!==null)return;let e=document.createElement(`style`);e.id=ho,e.textContent=ko,(document.head??document.documentElement).append(e);}function jo(e){return e.querySelector(`:scope > a`)?.textContent?.trim()??``}function Mo(e,t){let n=e.querySelector(`:scope > button`),r=e.querySelector(`:scope > ul.${U}`);n instanceof HTMLButtonElement&&r instanceof HTMLElement&&(r.hidden=!t,n.setAttribute(`aria-expanded`,t?`true`:`false`));}function No(){let e=document.createElement(`li`);e.id=H;let t=document.createElement(`button`);t.type=`button`,t.textContent=go,t.setAttribute(`aria-haspopup`,`true`),t.setAttribute(`aria-expanded`,`false`);let n=document.createElement(`ul`);return n.className=U,n.hidden=true,e.append(t,n),t.addEventListener(`click`,()=>{Mo(e,n.hasAttribute(`hidden`));}),document.addEventListener(`pointerdown`,t=>{!n.hidden&&t.target instanceof Node&&!e.contains(t.target)&&Mo(e,false);}),document.addEventListener(`keydown`,r=>{r.key===`Escape`&&!n.hidden&&(Mo(e,false),t.focus());}),{item:e,list:n}}function Po(e){let t=document.getElementById(H);if(t instanceof HTMLLIElement)return t;let n=[...e.querySelectorAll(`:scope > li`)].filter(e=>yo.has(jo(e))),r=n[0];if(r===void 0)return null;let{item:i,list:a}=No();r.before(i);for(let e of vo){let t=e.links.map(e=>n.find(t=>jo(t)===e)).filter(e=>e!==void 0);if(t.length===0)continue;let r=document.createElement(`li`);r.className=bo,r.textContent=e.title,r.setAttribute(`role`,`presentation`),a.append(r,...t);}return i}function Fo(e){for(let t of e.querySelectorAll(`:scope > li`)){let e=jo(t),n=e===_o;n&&t.classList.add(W),(n||t.id===ot$1.stats||t.id===ot$1.settings)&&(t.classList.add(po),t.querySelector(`:scope > a`)?.setAttribute(`title`,e));}}function Io(){let e=document.querySelector(q);if(e!==null)for(let t of e.querySelectorAll(`:scope > li`)){let e=jo(t),n=So.get(e);n!==void 0&&t.classList.add(`${K}${n}`),Co.has(e)&&t.classList.add(G);}}function Lo(e){new URLSearchParams(window.location.search).get(`page`)===To&&e.querySelector(`li.current-page`)===null&&(e.querySelector(`li#${ot$1.favorites}`)??e.querySelector(`li#my-favorites-container`))?.classList.add(at$1);}function Ro(e){for(let t of e.querySelectorAll(`li > a`)){let e=t.parentElement?.classList.contains(at$1)===true;e&&t.getAttribute(Eo)!==`page`?t.setAttribute(Eo,`page`):!e&&t.hasAttribute(Eo)&&t.removeAttribute(Eo);}}var zo=new WeakSet;function Bo(e){zo.has(e)||typeof MutationObserver!=`function`||(zo.add(e),new MutationObserver(()=>{Ro(e);}).observe(e,{subtree:true,attributes:true,attributeFilter:[`class`]}));}function Vo(e,t){let n=Array.from(e.children).slice(-t.length);t.length===0||t.every((e,t)=>n[t]===e)||e.append(...t);}function Ho(e){let t=[],n=e.querySelector(`:scope > li#${H}`),r=e.querySelector(`:scope > li#${ot$1.stats}`),i=e.querySelector(`:scope > li.${W}`),a=e.querySelector(`:scope > li#${ot$1.settings}`);for(let e of [n,r,i,a])e!==null&&t.push(e);Vo(e,t);let s=document.querySelector(q);s!==null&&Vo(s,Array.from(s.querySelectorAll(`:scope > li.${G}`)));}function Uo(e){Ao(),Po(e),Fo(e),Io(),Ho(e),Lo(e),Ro(e),Bo(e);}var Wo=`feed`,Go=`Feed`,Ko=`li#${ct$1} a[href*="page=favorites"]`,qo=/^[1-9]\d*$/;function Jo(e){for(let t of e.querySelectorAll(`li > a`))if((t.textContent?.trim()??``)===`Posts`){let e=t.parentElement;return e instanceof HTMLLIElement?e:null}return null}function Yo(e,t,n){let r=document.createElement(`li`);r.id=e;let i=document.createElement(`a`);return i.textContent=t,i.href=n,r.append(i),r}function Xo(){let e=document.querySelector(Ko)?.getAttribute(`href`);if(e==null)return null;let t;try{t=new URL(e,window.location.href).searchParams.get(`id`);}catch{return null}if(t===null||!qo.test(t))return null;let r=new URLSearchParams;return r.set(ce,ue),r.set(`s`,de),r.set(`id`,t),`${ie}?${r.toString()}`}function Zo(e){let t=document.querySelector(it);if(t===null)return  false;let n=Jo(t);if(n===null)return  false;let r=n,i=(e,t,n)=>{let i=document.getElementById(e);if(i!==null){r=i;return}let a=Yo(e,t,n);r.after(a),r=a;};Ui(e,Wo,true)&&i(ut$1,Go,qe),i(ot$1.collections,st$1.collections,Ke),i(ot$1.following,st$1.following,qe);let a=Xo();if(a!==null){i(ot$1.favorites,st$1.favorites,a);let e=document.getElementById(ct$1);e instanceof HTMLElement&&(e.hidden=true);}return e.features[`stats-menu`]!==false&&i(ot$1.stats,st$1.stats,Ye),document.getElementById(ot$1.settings)===null&&t.append(Yo(ot$1.settings,st$1.settings,Je)),Uo(t),(e.features[`sticky-header`]??true)===true&&fo(true),true}var Qo=168,$o=2e3,es=`ruledesk-web.search-tools-height`,ts=`rdw-search-tools-ai-posts`,ns=`rdw-search-tools--mounted`; exports({cn:ts,aM:ns});function rs(){let e=null;try{e=window.localStorage.getItem(es);}catch{}let t=e===null?NaN:Number(e);return !Number.isFinite(t)||t<=0||t>$o?Qo:Math.round(t)}function is(e){if(!(!Number.isFinite(e)||e<=0))try{window.localStorage.setItem(es,String(Math.round(e)));}catch{}}var as=`search-tools`,$=`rdw-search-tools`,os=`rdw-search-tools`,ss=`rdw-search-tools-reserve`,cs=8,ls=`input[name="tags"]`,us=`ul#tag-sidebar`,ds=`content`,fs=[Ma,ia,va];function ps(e){return [`body.${e} #${$}:not(.${ns}) {`,`  min-height: ${String(rs())}px;`,`}`,`body.${e} #${$} {`,`  margin-top: ${String(cs)}px;`,`  box-sizing: border-box;`,`}`].join(`
`)}function ms(){let e=document.querySelector(ls);if(!(e instanceof HTMLInputElement))return;let t=e.closest(`form`);if(!(t instanceof HTMLFormElement))return;let n=document.getElementById($);if(n instanceof HTMLDivElement){n.previousElementSibling!==t&&t.after(n);return}let r=document.createElement(`div`);r.id=$,r.className=os,t.after(r);}function hs(){let e=P(window.location.search);if(e!==`list`&&e!==`post`||!Ui(Hi(),as,true))return  true;if(document.body===null||document.querySelector(ls)===null)return  false;let t=Kt$1(as);document.body.classList.add(t),document.body.classList.add(ts);let n=M(ss);return n.textContent=ps(t),ms(),true}function gs(){let e=Hi(),t=false,n=false,r=()=>(!t&&document.getElementById(ds)!==null&&(ws(),t=Zo(e)),!n&&document.querySelector(us)!==null&&(n=hs()),t&&n);if(r())return;let i=new MutationObserver(()=>{r()&&i.disconnect();});i.observe(document,{childList:true,subtree:true}),document.addEventListener(`DOMContentLoaded`,()=>{i.disconnect(),Zo(e);},{once:true});}function _s(){ws(),hs(),Cs();}var vs=`favorites-bulk`,ys=`rdw-favorites-hold`,bs=5e3;function xs(e){return typeof e==`object`&&!!e&&!Array.isArray(e)}function Ss(){if(Gi(`favorites-view`)===`scroll`)return  true;let e=Gi(en$1);if(!xs(e))return  false;let t=e[tn$1];return e.all===true||xs(t)&&t.favorites===true}function Cs(){if(document.body===null||P(window.location.search)!==`favorites`||!Ui(Hi(),vs,true)||!Ss())return;let e=M(ys);e.textContent=[`body.${Xt$1} div.image-list:not(.${Zt$1}),`,`body.${Xt$1} #paginator {`,`  display: none;`,`}`].join(`
`);let n=document.body;n.classList.add(Xt$1),window.setTimeout(()=>{document.querySelector(`.rdw-fav-results`)===null&&n.classList.remove(Xt$1);},bs);}function ws(){if(document.body===null)return;let e=P(window.location.search),t=window.location.search,n=Hi();for(let r of fs){if(!r.pages.includes(e)||!Ui(n,r.id,r.defaultEnabled))continue;let i=r.choice===void 0?void 0:Wi(n,r.id,r.choice.defaultValue,r.choice.options.map(e=>e.value));Ua(r,e,t,{...i===void 0?{}:{choiceValue:i}});}}function Ts(e){document.readyState===`interactive`||document.readyState===`complete`?e():document.addEventListener(`DOMContentLoaded`,e,{once:true});}function Es(e){requestAnimationFrame(()=>{setTimeout(e,0);});}Yi(),gs(),Ts(()=>{_s(),Es(()=>{module.import('./app-C96QXzu_-Dg1SKPru.js').then(function(n){return n.aW}).then(({startApp:e})=>e()).catch(e=>{m.error(`start failed`,e);});});});})}}));
System.register("./app-C96QXzu_-Dg1SKPru.js", ['./___monkey.entry.js'],(function(exports,module){'use strict';var Gn$2,l$1,u$2,Vn$2,d$2,zn$2,Ln$2,An$2,Hn$2,Fn$2,A$3,N$3,O$3,D$3,E$3,T$2,m$2,Ii,Hi,k$3,G$3,Pc$1,bs$1,ot$3,Oc$1,Uo$1,Nc$1,Lo$1,rt$3,it$3,ut$3,Ke$3,st$3,qe$3,Ts$1,Ye$3,ct$3,Je$3,mo$1,Pa$1,ws$1,Na$1,at$3,Es$1,ie$1,ce$1,ue$1,de$1,fn$2,ut$4,P$3,be$2,Ec$1,en$2,nn$2,Le$3,tn$2,Pt$2,bo$1,xo$1,ho$1,R$3,Us$1,Te$3,ao$1,Fc$1,Zi$1,Mo$1,an$2,ln$2,le$1,re$1,Wa$1,Rt$2,kt$3,qt$2,Ft$2,It$2,Bt$2,Ht$2,Ma$1,Ut$2,ia$1,ba$1,_a$1,va$1,ya$1,ga$1,va$2,ya$2,zc$1,Ti$1,wc$1,xs$1,na$1,ra$1,ia$2,Pt$3,Ua$1,Vc$1,Kt$2,c$1,ns$1,Ki$1,Cc$1,To$1,Gt$2,Ya$1,Es$2,dt$3,tt$3,Uc$1,Jt$2,Yt$2,Vt$2,ot$4,De$3,Ie$3,Tt$3,Cs$1,Ia$1,Lo$2,Io$1,jo$1,ol$1,mo$2,uo$1,is$1,un$2,Lc$1,Js$1,wo$1,M$3,nt$3,zt$2,$e$3,Fe$3,hc$1,po$1,sl$1,Oe$3,go$1,Hc$1,K$4,I$3,Ao$1,Po$1,gc$1,_c$1,vc$1,st$4,za$1,et$3,Ft$3,r,Ss$1,q$4,Nt$3,Ks$1,Gs$1,Sc$1,No$1,je$3,Ce$3,Ys$1,so$1,io$1,fe$1,pe$1,qt$3,Ba$1,Ot$3,Yn$2,hi$1,_a$2,me$1,dn$2,Et$3,dt$4,h$3,kn$2,he$1,ge$1,ve$2,ye$2,_e$2,lc$1,qs$1,oc$1,xe$3,Va$1,za$2,Ha$1,jc$1,Wc$1,a,La$1,i,Ra$1,At$3,dr$2,$t$2,Qt$2,Xt$2,Dt$3,ts$1,Zt$2,mc$1,jt$3,oe$1,Ee$3,Nt$4,sc$1,We$3,ae$1,se$1;return{setters:[function(module){Gn$2=module.G;l$1=module.l;u$2=module.u;Vn$2=module.V;d$2=module.d;zn$2=module.z;Ln$2=module.L;An$2=module.A;Hn$2=module.H;Fn$2=module.F;A$3=module.a;N$3=module.N;O$3=module.O;D$3=module.D;E$3=module.E;T$2=module.T;m$2=module.m;Ii=module.I;Hi=module.b;k$3=module.k;G$3=module.c;Pc$1=module.P;bs$1=module.e;ot$3=module.o;Oc$1=module.f;Uo$1=module.U;Nc$1=module.g;Lo$1=module.h;rt$3=module.r;it$3=module.i;ut$3=module.j;Ke$3=module.K;st$3=module.s;qe$3=module.q;Ts$1=module.n;Ye$3=module.Y;ct$3=module.p;Je$3=module.J;mo$1=module.t;Pa$1=module.v;ws$1=module.w;Na$1=module.x;at$3=module.y;Es$1=module.B;ie$1=module.C;ce$1=module.M;ue$1=module.Q;de$1=module.R;fn$2=module.S;ut$4=module.W;P$3=module.X;be$2=module.Z;Ec$1=module._;en$2=module.$;nn$2=module.a0;Le$3=module.a1;tn$2=module.a2;Pt$2=module.a3;bo$1=module.a4;xo$1=module.a5;ho$1=module.a6;R$3=module.a7;Us$1=module.a8;Te$3=module.a9;ao$1=module.aa;Fc$1=module.ab;Zi$1=module.ac;Mo$1=module.ad;an$2=module.ae;ln$2=module.af;le$1=module.ag;re$1=module.ah;Wa$1=module.ai;Rt$2=module.aj;kt$3=module.ak;qt$2=module.al;Ft$2=module.am;It$2=module.an;Bt$2=module.ao;Ht$2=module.ap;Ma$1=module.aq;Ut$2=module.ar;ia$1=module.as;ba$1=module.at;_a$1=module.au;va$1=module.av;ya$1=module.aw;ga$1=module.ax;va$2=module.ay;ya$2=module.az;zc$1=module.aA;Ti$1=module.aB;wc$1=module.aC;xs$1=module.aD;na$1=module.aE;ra$1=module.aF;ia$2=module.aG;Pt$3=module.aH;Ua$1=module.aI;Vc$1=module.aJ;Kt$2=module.aK;c$1=module.aL;ns$1=module.aM;Ki$1=module.aN;Cc$1=module.aO;To$1=module.aP;Gt$2=module.aQ;Ya$1=module.aR;Es$2=module.aS;dt$3=module.aT;tt$3=module.aU;Uc$1=module.aV;Jt$2=module.aW;Yt$2=module.aX;Vt$2=module.aY;ot$4=module.aZ;De$3=module.a_;Ie$3=module.a$;Tt$3=module.b0;Cs$1=module.b1;Ia$1=module.b2;Lo$2=module.b3;Io$1=module.b4;jo$1=module.b5;ol$1=module.b6;mo$2=module.b7;uo$1=module.b8;is$1=module.b9;un$2=module.ba;Lc$1=module.bb;Js$1=module.bc;wo$1=module.bd;M$3=module.be;nt$3=module.bf;zt$2=module.bg;$e$3=module.bh;Fe$3=module.bi;hc$1=module.bj;po$1=module.bk;sl$1=module.bl;Oe$3=module.bm;go$1=module.bn;Hc$1=module.bo;K$4=module.bp;I$3=module.bq;Ao$1=module.br;Po$1=module.bs;gc$1=module.bt;_c$1=module.bu;vc$1=module.bv;st$4=module.bw;za$1=module.bx;et$3=module.by;Ft$3=module.bz;r=module.bA;Ss$1=module.bB;q$4=module.bC;Nt$3=module.bD;Ks$1=module.bE;Gs$1=module.bF;Sc$1=module.bG;No$1=module.bH;je$3=module.bI;Ce$3=module.bJ;Ys$1=module.bK;so$1=module.bL;io$1=module.bM;fe$1=module.bN;pe$1=module.bO;qt$3=module.bP;Ba$1=module.bQ;Ot$3=module.bR;Yn$2=module.bS;hi$1=module.bT;_a$2=module.bU;me$1=module.bV;dn$2=module.bW;Et$3=module.bX;dt$4=module.bY;h$3=module.bZ;kn$2=module.b_;he$1=module.b$;ge$1=module.c0;ve$2=module.c1;ye$2=module.c2;_e$2=module.c3;lc$1=module.c4;qs$1=module.c5;oc$1=module.c6;xe$3=module.c7;Va$1=module.c8;za$2=module.c9;Ha$1=module.ca;jc$1=module.cb;Wc$1=module.cc;a=module.cd;La$1=module.ce;i=module.cf;Ra$1=module.cg;At$3=module.ch;dr$2=module.ci;$t$2=module.cj;Qt$2=module.ck;Xt$2=module.cl;Dt$3=module.cm;ts$1=module.cn;Zt$2=module.co;mc$1=module.cp;jt$3=module.cq;oe$1=module.cr;Ee$3=module.cs;Nt$4=module.ct;sc$1=module.cu;We$3=module.cv;ae$1=module.cw;se$1=module.cx;}],execute:(function(){exports({$:Cz,A:A$2,B:B$2,C:Cr,D:Dn$1,E:at$2,F:FP,G:Ge,H:H$2,I:Ie$2,J:Mt$2,K:K$3,L:LP,M:MP,N:Nh,P:PP,R:RP,S:Se,T:Tr,U:Un$1,V:V$2,X:vs,Y:nr,Z:Zn,_:gr,a:Cn$1,a0:Sz,a1:Vn,a2:Ze$1,a3:Ke$1,a6:Be$1,a7:ze$1,a8:JL,a9:ia,aA:ft$2,aC:cF,aE:$$1,aF:Q$1,aH:ag,aJ:ze$2,aL:mt$2,aM:zn$1,aN:Dt$2,aO:g$1,aP:fc,aQ:Le$2,aR:$e$1,aS:Mi,aT:Wt,aU:Gt,aV:iI,aa:Qn,ab:Dt$1,ac:Et$1,ad:Re$1,ae:xz,af:Fn,aj:Ge$1,ak:qL,al:W,am:we,an:jp,ao:Jr,ap:dt,at:sF,au:lF,aw:X$1,ax:vg,ay:xt,az:Ot,b:g,c:ct$2,d:bz,f:ai,h:Dr,j:Kt$1,l:xn$1,m:mr,n:qe$1,o:Nt,p:Tn$1,q:q$3,r:pt$2,s:dt$2,t:O,u:ui,v:bs,w:Re$2,y:ra,z:z$2});var u$1,d$1,f$1,p$1,m$1,h$2,g$2,_$2,v$1,y$1,b$1,x$1=Symbol.for(`pv`),S$1={},C$1=[],w$1=/^m(i|n|o|s|text|space)$/,T$1=Array.isArray,E$2=C$1.slice,D$2=Object.assign;function O$2(e){e&&e.parentNode&&e.remove();}function ee(e,t,n){var r,i,a,o={},s=arguments.length;for(a in t)a==`key`?r=t[a]:a==`ref`&&typeof e!=`function`?i=t[a]:o[a]=t[a];return s>2&&(o.children=s>3?E$2.call(arguments,2):n),k$2(e,o,r,i,null)}function k$2(e,t,n,r,i){var a={type:e,props:t,key:n,ref:r,__k:null,__:null,__b:0,__e:null,__c:null,constructor:x$1,__v:i||++d$1,__i:-1,__u:0};return !i&&u$1.vnode&&u$1.vnode(a),a}function A$2(e){return e.children}function j$2(e,t){this.props=e,this.context=t,this.__g=0;}function M$2(e,t){if(t==null)return e.__&&M$2(e.__,e.__i+1);for(var n;t<e.__k.length;t++)if((n=e.__k[t])&&n.__e)return n.__e;return typeof e.type!=`function`||e.props.__P?null:M$2(e)}function te(e){var t,n=e.__v,r=n.__e,i=[],a=[],o=e.__P;o&&((t=D$2({constructor:x$1},n)).__v=n.__v+1,u$1.vnode&&u$1.vnode(t),ue(o,t,n,e.__n,o.namespaceURI,32&n.__u?[r]:null,i,r||M$2(n),32&n.__u,a),t.__v=n.__v,t.__.__k[t.__i]=t,pe(i,t,a),n.__=n.__e=null,t.__e!=r&&N$2(t));}function N$2(e){if((e=e.__)&&e.__c&&!e.props.__P)return e.__e=null,e.__k.some(function(t){return t&&(e.__e=t.__e)}),N$2(e)}function P$2(e){(8&e.__g||(e.__g|=8,f$1.push(e),m$1++))&&p$1==u$1.debounceRendering||((p$1=u$1.debounceRendering)||queueMicrotask)(F$2);}function F$2(){try{for(var e,t=1;f$1.length;)f$1.length>t&&f$1.sort(h$2),e=f$1.shift(),t=f$1.length,8&e.__g&&te(e);}finally{(m$1=f$1.length)&&(p$1||queueMicrotask)(F$2);}}function ne(e,t,n,r,i,a,o,s,c,l,u){var d,f,p,m,h,g,_=r.__k||C$1,v=t.length;for(c=re(n,t,_,c,v),d=0;d<v;d++)(p=n.__k[d])!=null&&(f=~p.__i&&_[p.__i]||S$1,p.__i=d,g=ue(e,p,f,i,a,o,s,c,l,u),m=p.__e,(f.ref!=p.ref||8&f.__u)&&(f.ref&&he(f.ref,null,p,f),p.ref&&u.push(p.ref,p.__c||m,p)),h||=m,4&p.__u?(c=ie(p,c,e,!f.__v),f.__e&&(f.__e=null)):typeof p.type==`function`&&g!==void 0?c=g:m&&(c=m.nextSibling),p.__u&=-21);return n.__e=h,c}function re(e,t,n,r,i){var a,o,s,c,l,u,d,f,p,m=n.length,h=m,g=0,_=0,v=e.__k=Array(i);for(a=0;a<i;a++)(o=t[a])!=null&&typeof o!=`boolean`&&typeof o!=`function`?(typeof o!=`object`||o.constructor===String?o=v[a]=k$2(null,o):T$1(o)?o=v[a]=k$2(A$2,{children:o}):o.constructor===x$1&&o.__b?o=v[a]=k$2(o.type,o.props,o.key,o.ref,o.__v):v[a]=o,c=a+g,o.__=e,o.__b=e.__b+1,s=null,~(l=o.__i=oe(o,n,c,h))&&(h--,(s=n[l])&&(s.__u|=2)),s&&s.__v?(o.__u|=16,l==c-1?g--:l==c+1?g++:l!=c&&(l>c?g--:g++,_=1)):(~l||(i>m?g--:i<m&&g++),typeof o.type!=`function`&&(o.__u|=4))):v[a]=null;if(_){for(u=[],d=[],a=0;a<i;a++)if((o=v[a])&&16&o.__u){for(g=0,f=u.length;g<f;)u[p=g+f>>1]<o.__i?g=p+1:f=p;u[g]=o.__i,d[a]=g+1;}for(g=u.length;a--;)d[a]&&(d[a]==g?g--:v[a].__u|=4);}if(h)for(a=0;a<m;a++)!(s=n[a])||2&s.__u||(s.__e==r&&(r=M$2(s)),ge(s,s));return r}function ie(e,t,n,r){var i,a,o,s;if(typeof e.type==`function`){if(e.props.__P)return t;if(i=e.__k)for(a=0;a<i.length;a++)i[a]&&(i[a].__=e,t=ie(i[a],t,n,false));return t}for(t&&!t.parentNode&&(t=M$2(e))&&!t.parentNode&&(t=null),o=e.__e,s=t;s&&s.nodeType==8;)s=s.nextSibling;for(o!=s&&(!r&&n.moveBefore&&o.parentNode?n.moveBefore(o,t):n.insertBefore(o,t||null)),t=o;(t&&=t.nextSibling)&&t.nodeType==8&&!t.data.startsWith(`$s`););return t}function ae(e,t){return t||=[],e!=null&&typeof e!=`boolean`&&(T$1(e)?e.some(function(e){ae(e,t);}):t.push(e)),t}function oe(e,t,n,r){var i,a=e.key,o=e.type,s=t[n],c=s&&!(2&s.__u);if(s===null&&a==null||c&&a==s.key&&o==s.type)return n;if(r>+!!c){for(i=n-1;i>=0;i--)if((s=t[i])&&!(2&s.__u)&&a==s.key&&o==s.type)return i;for(i=n+1;i<t.length;i++)if((s=t[i])&&!(2&s.__u)&&a==s.key&&o==s.type)return i}return  -1}function se(e,t,n){n??=``,t[0]==`-`?e.setProperty(t,n):e[t]=n;}function ce(e,t,n,r,i){var a,o;if(t==`style`){if(typeof n==`string`)e.style.cssText=n;else {if(typeof r==`string`&&(e.style.cssText=r=``),r)for(t in r)n&&t in n||se(e.style,t);if(n)for(t in n)r&&n[t]==r[t]||se(e.style,t,n[t]);}}else if(t[0]==`o`&&t[1]==`n`)typeof n!=`function`&&(n=null),typeof r!=`function`&&(r=null),(e.__e||={})[t]=n,n&&r||(o=y$1[t]||(y$1[t]=le(t)),(e.__a||={})[t]=v$1,a=t!=(t=t.replace(_$2,`$1`)),(t=t.slice(2))[0]<`a`&&(t=t.toLowerCase()),n?e.addEventListener(t,o,a):e.removeEventListener(t,o,a));else {if(i==`http://www.w3.org/2000/svg`)t=t.replace(/xlink(H|:h)/,`h`).replace(/sName$/,`s`);else if(t!=`width`&&t!=`height`&&t!=`href`&&t!=`list`&&t!=`form`&&t!=`tabIndex`&&t!=`download`&&t!=`rowSpan`&&t!=`colSpan`&&t!=`role`&&t!=`popover`&&t in e)try{e[t]=n??``;return}catch{}if(typeof n==`function`)return;n==null||false===n&&t[4]!=`-`?e.removeAttribute(t):e.setAttribute(t,t==`popover`&&n==1?``:n);}}function le(e){return function(t){var n=this.__e;if(n){if(n=n[e],t[g$2]==null)t[g$2]=v$1++;else if(t[g$2]<this.__a[e])return;return n(u$1.event?u$1.event(t):t)}}}function ue(e,t,n,r,i,a,o,s,c,l){var d,f,p,m,h,g,_,v,y,b,S,w,E,ee,k,te,N,P,F=t.type;if(t.constructor!==x$1)return null;128&n.__u&&(c=32&n.__u,d=n.__c.__z)&&(t.__u|=c,f=a=[],d.nodeType==8?s=de(d,a):a.push(d),s=a[0]||s),(d=u$1.__b)&&d(t);n:if(typeof F==`function`){p=o.length;try{if(v=t.props,y=(d=F.prototype)&&d.render,b=(d=F.contextType)&&r[d.__c],S=d?b?b.props.value:d.__:r,(m=n.__c)?(t.__c=m,2&m.__g&&(m.__g|=1)):(y?t.__c=m=new F(v,S):(t.__c=m=new j$2(v,S),m.constructor=F,m.render=_e$1),b&&b.sub(m),m.state||(m.state={}),m.__n=r,m.__g|=8,m.__h=[],m.__k=[]),y&&(m.__s||(m.__s=m.state),F.getDerivedStateFromProps&&(m.__s==m.state&&(m.__s=D$2({},m.__s)),D$2(m.__s,F.getDerivedStateFromProps(v,m.__s)))),h=m.props,g=m.state,m.__v=t,n.__c){if(v!==h&&y&&!F.getDerivedStateFromProps&&m.componentWillReceiveProps&&m.componentWillReceiveProps(v,S),t.__v==n.__v&&!(8&m.__g)||!(4&m.__g)&&m.shouldComponentUpdate&&!1===m.shouldComponentUpdate(v,m.__s,S)){t.__v!=n.__v&&(m.props=v,m.state=m.__s,m.__g&=-9),t.__e=n.__e,t.__k=n.__k,t.__k.some(function(e){e&&(e.__=t);}),C$1.push.apply(m.__h,m.__k),m.__k=[],m.__h.length&&o.push(m),s=M$2(n);break n}m.componentWillUpdate&&m.componentWillUpdate(v,m.__s,S),y&&m.componentDidUpdate&&m.__h.push(function(){m.componentDidUpdate(h,g,_);});}else y&&!F.getDerivedStateFromProps&&m.componentWillMount&&m.componentWillMount(),y&&m.componentDidMount&&m.__h.push(m.componentDidMount);m.context=S,m.props=v,m.__P=e,m.__g&=-5,w=u$1.__r,E=y?25:0;do m.__g&=-9,w&&w(t),d=m.render(m.props,m.state=m.__s,m.context);while(8&m.__g&&++E<25);y&&(C$1.push.apply(m.__h,m.__k),m.__k=[]),m.state=m.__s,m.getChildContext&&(r=D$2({},r,m.getChildContext())),y&&n.__c&&m.getSnapshotBeforeUpdate&&(_=m.getSnapshotBeforeUpdate(h,g)),ee=d&&d.type===A$2&&d.key==null?d.props.children:d,v.__P&&(d=s,i=(e=v.__P).namespaceURI,c=a=null,n.props&&n.props.__P!=e&&(n.__k.some(function(e){e&&ge(e,e);}),n.__k=null),s=n.__k?M$2(n,0):null),s=ne(e,T$1(ee)?ee:[ee],t,n,r,i,a,o,s,c,l),v.__P&&(t.__e=null,s=d),t.__u&=-161,f&&f.some(O$2),m.__h.length&&o.push(m),1&m.__g&&(m.__g&=-4);}catch(e){if(o.length=p,t.__v=null,c||a){if(e&&e.then){if(t.__u|=128|c,a){for(~(N=a.indexOf(s||void 0))||(N=a.length);(P=a[N-1])&&P.nodeType==8;)N--;for(;N<a.length;N++)if(P=a[N]){if(a[N]=null,k){if(P==te)break}else {if(P.nodeType!=8)break;P.data.startsWith(`$s`)&&(te=de(k=P));}}}if(!k){for(;s&&s.nodeType==8&&s.nextSibling;)s=s.nextSibling;k=s;}(d=de(k=t.__c.__z||(t.__c.__z=k)))?(t.__e=k,s=d):t.__e=s,s&&=s.nextSibling;}else a&&a.some(O$2);}else t.__e=n.__e;t.__k||=n.__k||[],e&&e.then||fe(t),u$1.__e(e,t,n);}}else s=t.__e=me(n.__e,t,n,r,i,a,o,c,l,e);return (d=u$1.diffed)&&d(t),s}function de(e,t){if(e&&e.nodeType==8&&e.data.startsWith(`$s`))for(var n=1;e=e.nextSibling;){if(e.nodeType==8){if(e.data.startsWith(`$s`))n++;else if(e.data.startsWith(`/$s`)&&!--n)return e}t&&t.push(e);}}function fe(e){e&&(e.__c&&(e.__c.__g|=4),e.__k&&e.__k.some(fe));}function pe(e,t,n){for(var r=0;r<n.length;)he(n[r++],n[r++],n[r++]);u$1.__c&&u$1.__c(t,e),e.some(function(t){try{e=t.__h,t.__h=[],e.some(function(e){e.call(t);});}catch(e){u$1.__e(e,t.__v);}});}function me(e,t,n,r,i,a,o,s,c,l){var d,f,p,m,h,g,_,v,y=n.props||S$1,b=t.props,x=t.type;if(x==`svg`?i=`http://www.w3.org/2000/svg`:x==`math`?i=`http://www.w3.org/1998/Math/MathML`:i||=`http://www.w3.org/1999/xhtml`,a){for(d=0;d<a.length;d++)if((h=a[d])&&(x?h.localName==x:h.nodeType==3)){e=h,a[d]=null;break}}if(!e){if(v=l.ownerDocument||document,!x)return v.createTextNode(b);e=v.createElementNS(i,x,b.is?b:l),s&&=(u$1.__m&&u$1.__m(t,a),false),a=null;}if(x){if(l=x==`template`&&e.content||e,a=x==`textarea`&&b.defaultValue!=null?null:a&&E$2.call(l.childNodes),!s&&a)for(y={},d=0;d<e.attributes.length;d++)y[(h=e.attributes[d]).name]=h.value;for(d in y)h=y[d],d==`dangerouslySetInnerHTML`?p=h:d==`children`||d in b||d==`value`&&`defaultValue`in b||d==`checked`&&`defaultChecked`in b||ce(e,d,null,h,i);for(d in b)h=b[d],d==`children`?m=h:d==`dangerouslySetInnerHTML`?f=h:d==`value`?g=h:d==`checked`?_=h:s&&typeof h!=`function`||y[d]===h||ce(e,d,h,y[d],i);f?(s||p&&(f.__html==p.__html||f.__html==e.innerHTML)||(e.innerHTML=f.__html),t.__k=[]):(p&&(e.textContent=``),(x==`foreignObject`||i==`http://www.w3.org/1998/Math/MathML`&&w$1.test(x))&&(i=`http://www.w3.org/1999/xhtml`),ne(l,T$1(m)?m:[m],t,n,r,i,a,o,a?a[0]:n.__k&&M$2(n,0),s,c),a&&a.some(O$2)),s&&x!=`textarea`||(d=`value`,x==`progress`&&g==null?e.removeAttribute(d):g==null||g===e[d]&&(x!=`progress`||g)||ce(e,d,g,y[d],i),d=`checked`,_!=null&&_!=e[d]&&ce(e,d,_,y[d],i));}else y===b||s&&e.data==b||(e.data=b);return e}function he(e,t,n,r){try{typeof e==`function`?t?t.__x=e(t)||1:(r&&=r.__c||r.__e)&&(t=r.__x)&&(r.__x=null,typeof t==`function`?t():e(null)):e.current=t;}catch(e){u$1.__e(e,n);}}function ge(e,t,n){var r,i,a,o;if(u$1.unmount&&u$1.unmount(e),!(r=e.ref)||r.current&&r.current!=e.__e||he(r,null,t,e),r=e.__c){if(r.componentWillUnmount)try{r.componentWillUnmount();}catch(e){u$1.__e(e,t);}r.__P=r.__n=null;}if(r=e.__k)for(o=0;o<r.length;o++)r[o]&&ge(r[o],t,typeof e.type!=`function`||n&&!e.props.__P);!n&&(r=e.__c)&&(r=r.__z)&&(i=de(r,a=[]))&&(r==e.__e&&a.some(O$2),O$2(i),O$2(r)),n||O$2(e.__e),e.__e=e.__c=e.__=null;}function _e$1(e,t,n){return this.constructor(e,n)}function ve$1(e,t){var n,r,i,a;u$1.__&&u$1.__(e,t),t.nodeType==9&&(t=t.documentElement),r=(n=e&&32&e.__u)?null:t.__k,t.__k=k$2(A$2,{children:[e]}),i=[],a=[],ue(t,t.__k,r||S$1,S$1,t.namespaceURI,r?null:t.firstChild?E$2.call(t.childNodes):null,i,r?r.__e:t.firstChild,n,a),pe(i,t.__k,a),t.__k.props.children=null;}function ye$1(e){function t(e){var n,r;return this.getChildContext||(n=new Set,(r={})[t.__c]=this,this.getChildContext=function(){return r},this.shouldComponentUpdate=function(e){this.props.value!=e.value&&n.forEach(function(e){e.__g|=4,P$2(e);});},this.sub=function(e){n.add(e);var t=e.componentWillUnmount;e.componentWillUnmount=function(){n.delete(e),t&&t.call(e);};}),e.children}return t.__c=`__cC`+b$1++,t.__=e,t.Provider=(t.Consumer=function(e,t){return e.children(t)}).contextType=t,t}function be$1(e){return e.children}function xe$2(e,t){return k$2(be$1,{__P:t,children:e})}u$1={__e:function(e,t,n,r){for(var i,a,o;t=t.__;)if((i=t.__c)&&!(1&i.__g)){i.__g|=4;try{if((o=(a=i.constructor)&&a.getDerivedStateFromError)&&i.setState(a.getDerivedStateFromError(e)),i.componentDidCatch&&(i.componentDidCatch(e,r||{}),o=1),o&&8&i.__g)return void(i.__g|=2)}catch(t){e=t;}}throw m$1=0,e}},d$1=0,j$2.prototype.setState=function(e,t){var n=this.__s;n&&n!=this.state||(n=this.__s=D$2({},this.state)),typeof e==`function`&&(e=e(D$2({},n),this.props)),e&&(D$2(n,e),this.__v&&(t&&this.__k.push(t),P$2(this)));},j$2.prototype.forceUpdate=function(e){this.__v&&(this.__g|=4,e&&this.__h.push(e),P$2(this));},j$2.prototype.render=A$2,f$1=[],m$1=0,h$2=function(e,t){return e.__v.__b-t.__v.__b},g$2=Symbol(),_$2=/(PointerCapture)$|Capture$/i,v$1=0,y$1={},b$1=0;var I$2,L$2,Se$2,Ce$2,we$2=Object.is,Te$2=0,Ee$2=[],De$2=[],R$2=u$1,Oe$2=R$2.__b,ke$2=R$2.__r,Ae$2=R$2.diffed,je$2=R$2.__c,Me$2=R$2.unmount,Ne$2=R$2.__;function Pe$2(e,t){R$2.__h&&R$2.__h(L$2,e,Te$2||t),Te$2=0;var n=L$2.__H||(L$2.__H={__:[],__h:[]});return e>=n.__.length&&n.__.push({}),n.__[e]}function z$2(e){return Te$2=1,Fe$2(qe$2,e)}function Fe$2(e,t,n){var r=Pe$2(I$2++,2);if(r.t=e,!r.__c&&(r.__=[qe$2(void 0,t),function(e){var t=(r.__N||r.__)[0],n=r.t(t,e);we$2(t,n)||(r.__N=[n,r.__[1]],r.__c.setState({}));}],r.__c=L$2,!L$2.__f)){L$2.__f=true;var i=L$2.shouldComponentUpdate;L$2.shouldComponentUpdate=function(e,t,n){var r=this.__H;if(!r)return  true;var a=false,o=this.props!=e;if(r.__.some(function(e){e.__N&&(a=true,we$2(e.__[0],e.__N[0])||(o=true));}),i){var s=i.call(this,e,t,n);return a?s||o:s}return !a||o};}return r.__}function B$2(e,t){var n=Pe$2(I$2++,3);!R$2.__s&&Ke$2(n.__H,t)&&(n.__P=true,n.__=e,n.u=t,L$2.__H.__h.push(n));}function Ie$2(e,t){var n=Pe$2(I$2++,4);!R$2.__s&&Ke$2(n.__H,t)&&(n.__P=false,n.__=e,n.u=t,L$2.__h.push(n));}function V$2(e){return Te$2=5,Le$2(function(){return {current:e}},[])}function Le$2(e,t){var n=Pe$2(I$2++,7);return Ke$2(n.__H,t)&&(n.__=e(),n.__H=t),n.__}function Re$2(e,t){return Te$2=8,Le$2(function(){return e},t)}function ze$2(e){var t=L$2.context[e.__c],n=Pe$2(I$2++,9);return n.c=e,t?(n.__??(n.__=true,t.sub(L$2)),t.props.value):e.__}function H$2(){var e=Pe$2(I$2++,11);if(!e.__){for(var t=L$2.__v;!t.__m&&t.__;)t=t.__;var n=t.__m||(t.__m=[0,0]);e.__=`P`+n[0]+`-`+n[1]++;}return e.__}function Be$2(){var e;do{for(;e=De$2.shift();)try{We$2(e);}catch(t){R$2.__e(t,{__:(e=e.__P)&&e.__v});}for(;e=Ee$2.shift();){var t=e.__H;if(e.__P&&t)try{t.__h.some(We$2),t.__h.some(Ge$2),t.__h=[];}catch(n){t.__h=[],R$2.__e(n,e.__v);}}}while(De$2.length)}R$2.__b=function(e){L$2=null,Oe$2&&Oe$2(e);},R$2.__=function(e,t){e&&t.__k&&t.__k.__m&&(e.__m=t.__k.__m),Ne$2&&Ne$2(e,t);},R$2.__r=function(e){ke$2&&ke$2(e),I$2=0;var t=(L$2=e.__c).__H;t&&(Se$2==L$2?L$2.__h=[]:(t.__h.some(We$2),t.__h.some(Ge$2),I$2=0),t.__h=[],t.__.some(function(e){e.__N&&(e.__=e.__N),e.u=e.__N=void 0;})),Se$2=L$2;},R$2.diffed=function(e){Ae$2&&Ae$2(e);var t=e.__c;t&&t.__H&&(t.__H.__h.length&&Ue$2(Ee$2.push(t)),t.__H.__.some(function(e){e.u&&(e.__H=e.u);})),Se$2=L$2=null;},R$2.__c=function(e,t){t.some(function(e){try{e.__h.some(We$2),e.__h=e.__h.filter(function(e){return !e.__||Ge$2(e)});}catch(t){e.__h=[function(){throw t}];}}),je$2&&je$2(e,t);},R$2.unmount=function(e){Me$2&&Me$2(e);var t,n,r=e.__c;r&&r.__H&&(r.__H.__.some(function(r){try{if(r.__P&&r.__c){if(n===void 0){for(n=e.__;n&&(!n.__c||!n.__c.__P);)n=n.__;n&&=n.__c;}r.__P=n,Ue$2(De$2.push(r));}else We$2(r);}catch(e){t=e;}}),r.__H=void 0,t&&R$2.__e(t,r.__v));};var Ve$2=typeof requestAnimationFrame==`function`;function He$2(e){var t,n=function(){clearTimeout(r),Ve$2&&cancelAnimationFrame(t),setTimeout(e);},r=setTimeout(n,35);Ve$2&&(t=requestAnimationFrame(n));}function Ue$2(e){e!=1&&Ce$2==R$2.requestAnimationFrame||((Ce$2=R$2.requestAnimationFrame)||He$2)(Be$2);}function We$2(e){var t=L$2,n=e.__c;typeof n==`function`&&(e.__c=void 0,n()),L$2=t;}function Ge$2(e){var t=L$2;e.__c=e.__(),L$2=t;}function Ke$2(e,t){return !e||e.length!=t.length||t.some(function(t,n){return !we$2(t,e[n])})}function qe$2(e,t){return typeof t==`function`?t(e):t}var Je$2=`--rdw-control-h`,Ye$2=`--rdw-control-font`,Xe$2=12,U$2=`var(${Je$2}, 28px)`,W$2=`var(${Ye$2}, ${String(Xe$2)}px)`,G$2=exports("e",`
.rdw-kit-focusable:focus-visible {
  outline: 2px solid var(--rdw-accent);
  outline-offset: 2px;
}
`),Ze$2=Symbol.for(`pv`),Qe$2=0;function K$3(e,t,n,r,i,a){t||={};var o,s,c=t;if(`ref`in c&&typeof e!=`function`)for(s in c={},t)s==`ref`?o=t[s]:c[s]=t[s];var l={type:e,props:c,key:n,ref:o,__k:null,__:null,__b:0,__e:null,__c:null,constructor:Ze$2,__v:--Qe$2,__i:-1,__u:0};return u$1.vnode&&u$1.vnode(l),l}var $e$2=`ArrowDown`,et$2=`ArrowUp`,tt$2=`Enter`,nt$2=`Escape`,rt$2=-1,it$2=`
${G$2}
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
`;function at$2(e){let t=H$2(),n=H$2(),r=e.id??t,i=V$2(null),[a,o]=z$2(false),[s,c]=z$2(rt$2),l=e.suggestions,u=l.length>0,d=a&&u&&e.disabled!==true;B$2(()=>{c(rt$2),o(!!u);},[l,u]),B$2(()=>{if(!d)return;let e=e=>{let t=i.current;t!==null&&(e.composedPath().includes(t)||(o(false),c(rt$2)));};return document.addEventListener(`mousedown`,e),()=>{document.removeEventListener(`mousedown`,e);}},[d]);let f=t=>{e.replaceOnSelect!==false&&e.onChange(t.value),e.onSelect?.(t),o(false),c(rt$2);},p=[`rdw-ac`,e.className].filter(e=>e!==void 0&&e.length>0).join(` `),m=s>=0&&s<l.length?l[s]:void 0;return K$3(A$2,{children:[K$3(`style`,{children:it$2}),K$3(`div`,{className:p,ref:i,children:[e.label===void 0?null:K$3(`label`,{className:`rdw-ac__label`,htmlFor:r,children:e.label}),K$3(`input`,{id:r,className:`rdw-ac__input rdw-kit-focusable`,type:`text`,role:`combobox`,"aria-autocomplete":`list`,"aria-expanded":d,"aria-controls":n,"aria-activedescendant":m===void 0?void 0:`${n}-opt-${String(s)}`,value:e.value,placeholder:e.placeholder,disabled:e.disabled,"aria-label":e[`aria-label`]??e.label,autoComplete:`off`,onInput:t=>{e.onChange(t.currentTarget.value);},onFocus:()=>{u&&o(true);},onKeyDown:e=>{if(e.key===nt$2)d&&(e.preventDefault(),o(false),c(rt$2));else if(e.key===$e$2){if(!u)return;e.preventDefault(),o(true),c(e=>e<0?0:Math.min(e+1,l.length-1));}else if(e.key===et$2){if(!d)return;e.preventDefault(),c(e=>e<=0?rt$2:e-1);}else e.key===tt$2&&d&&m!==void 0&&(e.preventDefault(),f(m));}}),d?K$3(`ul`,{className:`rdw-ac__list`,role:`listbox`,id:n,tabIndex:-1,children:l.map((e,t)=>K$3(`li`,{id:`${n}-opt-${String(t)}`,role:`option`,className:`rdw-ac__option rdw-kit-focusable`,"aria-selected":t===s,onMouseDown:e=>{e.preventDefault();},onClick:()=>{f(e);},children:[e.type===`artist`||e.type===`character`||e.type===`copyright`||e.type===`metadata`?K$3(`span`,{className:`rdw-ac__dot`,"data-kind":e.type,"aria-hidden":`true`}):null,e.label]},`${e.value}:${e.type??``}:${e.label}`))}):null]})]})}var ot$2=`
${G$2}
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
`;function q$3(e){let t=e.variant??`secondary`,n=e.size??`m`,r=e.loading===true,i=e.disabled===true||r,a=[`rdw-btn`,`rdw-kit-focusable`,`rdw-btn--${t}`,`rdw-btn--${n}`,e.className].filter(e=>e!==void 0&&e.length>0).join(` `);return K$3(A$2,{children:[K$3(`style`,{children:ot$2}),K$3(`button`,{type:e.type??`button`,className:a,disabled:i,"aria-busy":r?true:void 0,"aria-label":e[`aria-label`],title:e.title,"aria-pressed":e.pressed,...e.buttonRef===void 0?{}:{ref:e.buttonRef},onClick:e.onClick,children:[r?K$3(`span`,{className:`rdw-btn__spinner`,"aria-hidden":`true`}):null,e.children]})]})}var st$2=`
.rdw-card {
  background: var(--rdw-surface);
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-l);
  box-shadow: var(--rdw-shadow-1);
}
`;function ct$2(e){let t=e.as??`div`,n=[`rdw-card`,e.className].filter(e=>e!==void 0&&e.length>0).join(` `);return K$3(A$2,{children:[K$3(`style`,{children:st$2}),K$3(t,{className:n,children:e.children})]})}var J$3=16;function Y$3(e,t,n){let r={width:e,height:e,viewBox:`0 0 24 24`,fill:`none`,stroke:`currentColor`,"stroke-width":2,"stroke-linecap":`round`,"stroke-linejoin":`round`,"aria-hidden":n===void 0||void 0,role:n===void 0?void 0:`img`};return t!==void 0&&(r.className=t),n!==void 0&&(r[`aria-label`]=n),r}function lt$2(e){return K$3(`svg`,{...Y$3(e.size??J$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`polygon`,{points:`12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2`})]})}function ut$2(e){return K$3(`svg`,{...Y$3(e.size??J$3,e.className,e.title),fill:`currentColor`,stroke:`none`,children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`polygon`,{points:`12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2`})]})}function dt$2(e){return K$3(`svg`,{...Y$3(e.size??J$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`line`,{x1:`12`,y1:`5`,x2:`12`,y2:`19`}),K$3(`line`,{x1:`5`,y1:`12`,x2:`19`,y2:`12`})]})}function ft$2(e){return K$3(`svg`,{...Y$3(e.size??J$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`polyline`,{points:`20 6 9 17 4 12`})]})}function pt$2(e){return K$3(`svg`,{...Y$3(e.size??J$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`line`,{x1:`18`,y1:`6`,x2:`6`,y2:`18`}),K$3(`line`,{x1:`6`,y1:`6`,x2:`18`,y2:`18`})]})}function mt$2(e){return K$3(`svg`,{...Y$3(e.size??J$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`polyline`,{points:`6 9 12 15 18 9`})]})}function ht$2(e){return K$3(`svg`,{...Y$3(e.size??J$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`line`,{x1:`12`,y1:`19`,x2:`12`,y2:`5`}),K$3(`polyline`,{points:`5 12 12 5 19 12`})]})}function gt$2(e){return K$3(`svg`,{...Y$3(e.size??J$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`path`,{d:`M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6`}),K$3(`polyline`,{points:`15 3 21 3 21 9`}),K$3(`line`,{x1:`10`,y1:`14`,x2:`21`,y2:`3`})]})}function _t$2(e){return K$3(`svg`,{...Y$3(e.size??J$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`path`,{d:`M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z`})]})}function vt$2(e){return K$3(`svg`,{...Y$3(e.size??J$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`path`,{d:`M12 20h9`}),K$3(`path`,{d:`M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z`})]})}function yt$2(e){return K$3(`svg`,{...Y$3(e.size??J$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`path`,{d:`M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z`}),K$3(`line`,{x1:`4`,y1:`22`,x2:`4`,y2:`15`})]})}function bt$2(e){return K$3(`svg`,{...Y$3(e.size??J$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`path`,{d:`M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z`}),K$3(`polyline`,{points:`14 2 14 8 20 8`}),K$3(`line`,{x1:`8`,y1:`13`,x2:`16`,y2:`13`}),K$3(`line`,{x1:`8`,y1:`17`,x2:`12`,y2:`17`})]})}function xt$2(e){return K$3(`svg`,{...Y$3(e.size??J$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`circle`,{cx:`11`,cy:`11`,r:`8`}),K$3(`line`,{x1:`21`,y1:`21`,x2:`16.65`,y2:`16.65`})]})}function St$2(e){return K$3(`svg`,{...Y$3(e.size??J$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`polyline`,{points:`3 6 5 6 21 6`}),K$3(`path`,{d:`M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2`})]})}function Ct$2(e){return K$3(`svg`,{...Y$3(e.size??J$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`rect`,{x:`3`,y:`3`,width:`18`,height:`18`,rx:`2`,ry:`2`}),K$3(`circle`,{cx:`8.5`,cy:`8.5`,r:`1.5`}),K$3(`polyline`,{points:`21 15 16 10 5 21`})]})}function wt$2(e){return K$3(`svg`,{...Y$3(e.size??J$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`line`,{x1:`2`,y1:`2`,x2:`22`,y2:`22`}),K$3(`path`,{d:`M10.41 10.41a2 2 0 1 1-2.83-2.83`}),K$3(`line`,{x1:`13.5`,y1:`13.5`,x2:`6`,y2:`21`}),K$3(`line`,{x1:`18`,y1:`12`,x2:`21`,y2:`15`}),K$3(`path`,{d:`M3.59 3.59A1.99 1.99 0 0 0 3 5v14a2 2 0 0 0 2 2h14c.55 0 1.052-.22 1.41-.59`}),K$3(`path`,{d:`M21 15V5a2 2 0 0 0-2-2H9`})]})}function Tt$2(e){return K$3(`svg`,{...Y$3(e.size??J$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`rect`,{x:`9`,y:`9`,width:`13`,height:`13`,rx:`2`,ry:`2`}),K$3(`path`,{d:`M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1`})]})}function Et$2(e){return K$3(`svg`,{...Y$3(e.size??J$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`rect`,{x:`3`,y:`3`,width:`18`,height:`18`,rx:`2`,ry:`2`}),K$3(`path`,{d:`M16 8h.01`}),K$3(`path`,{d:`M12 12h.01`}),K$3(`path`,{d:`M8 16h.01`})]})}function Dt$2(e){return K$3(`svg`,{...Y$3(e.size??J$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`circle`,{cx:`12`,cy:`12`,r:`1`}),K$3(`circle`,{cx:`19`,cy:`12`,r:`1`}),K$3(`circle`,{cx:`5`,cy:`12`,r:`1`})]})}function Ot$2(e){return K$3(`svg`,{...Y$3(e.size??J$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`circle`,{cx:`12`,cy:`12`,r:`10`}),K$3(`path`,{d:`M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3`}),K$3(`path`,{d:`M12 17h.01`})]})}function kt$2(e){return K$3(`svg`,{...Y$3(e.size??J$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`path`,{d:`M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4`}),K$3(`polyline`,{points:`7 10 12 15 17 10`}),K$3(`line`,{x1:`12`,y1:`15`,x2:`12`,y2:`3`})]})}function At$2(e){return K$3(`svg`,{...Y$3(e.size??J$3,e.className,e.title),children:[e.title===void 0?null:K$3(`title`,{children:e.title}),K$3(`path`,{d:`M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8`}),K$3(`path`,{d:`M21 3v5h-5`}),K$3(`path`,{d:`M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16`}),K$3(`path`,{d:`M8 16H3v5`})]})}var jt$2=`
${G$2}
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
`;function Mt$2(e){let t=e.variant??`dot`,n=e.kind??`default`,r=[`rdw-chip`,`rdw-chip--${t}`,n==="default"?void 0:`rdw-chip--${n}`,e.className].filter(e=>e!==void 0&&e.length>0).join(` `);return K$3(A$2,{children:[K$3(`style`,{children:jt$2}),K$3(`span`,{className:r,children:[t===`dot`?K$3(`i`,{className:`rdw-chip__dot`,"aria-hidden":`true`}):null,K$3(`span`,{children:e.label}),e.onRemove===void 0?null:K$3(`button`,{type:`button`,className:`rdw-chip__remove rdw-kit-focusable`,"aria-label":`Remove ${e.label}`,onClick:e.onRemove,children:K$3(pt$2,{size:12})})]})]})}var Nt$2=Object.assign,Pt$1=/^(-|f[lo].*[^se]$|g.{5,}[^ps]$|z|o[pr]|(W.{5})?[lL]i.*(t|mp)$|an|(bo|s).{4}Im|sca|m.{6}[ds]|ta|c.*[st]$|wido|ini|asp|fill|st)/;function Ft$1(e,t){var n=xe$2(e,t);return n.containerInfo=t,n}var It$1=Symbol.for(`react.element`),Lt$1=/^(?:accent|alignment|arabic|baseline|cap|clip(?!PathU)|color|dominant|fill|flood|font|glyph(?!R)|horiz|image(?!S)|letter|lighting|marker(?!H|W|U)|overline|paint|pointer|shape|stop|strikethrough|stroke|text(?!L)|transform|underline|unicode|units|v|vector|vert|word|writing|x(?!C))[A-Z]/,Rt$1=/[A-Z0-9]/g,zt$1=typeof document<`u`,Bt$1=function(e){return /fil|che|rad/.test(e)};j$2.prototype.isReactComponent=true,[`componentWillMount`,`componentWillReceiveProps`,`componentWillUpdate`].forEach(function(e){Object.defineProperty(j$2.prototype,e,{configurable:true,get:function(){return this[`UNSAFE_`+e]},set:function(t){Object.defineProperty(this,e,{configurable:true,writable:true,value:t});}});});var Vt$1=u$1.event;u$1.event=function(e){return Vt$1&&(e=Vt$1(e)),e.persist=function(){},e.isPropagationStopped=function(){return this.cancelBubble},e.isDefaultPrevented=function(){return this.defaultPrevented},e.nativeEvent=e};var Ht$1={configurable:true,get:function(){return this.class}},Ut$1=u$1.vnode;u$1.vnode=function(e){if(typeof e.type==`string`)(function(e){var t=e.props,n=e.type,r={},i=n.indexOf(`-`)==-1;for(var a in t){var o=t[a];if(!(a==`value`&&`defaultValue`in t&&o==null||zt$1&&a==`children`&&n==`noscript`||a==`class`||a==`className`)){if(a==`style`&&o&&o.constructor==Object){var s=void 0;for(var c in o)typeof o[c]!=`number`||Pt$1.test(c)||(s||=o=Nt$2({},o),o[c]+=`px`);}else if(a==`defaultValue`&&`value`in t&&t.value==null)a=`value`;else if(a==`download`&&true===o)o=``;else if(a==`translate`&&o===`no`)o=false;else if(a[0]==`o`&&a[1]==`n`){var l=a.toLowerCase();l==`ondoubleclick`?a=`ondblclick`:l!=`onchange`||n!=`input`&&n!=`textarea`||Bt$1(t.type)?l==`onfocus`?a=`onfocusin`:l==`onblur`&&(a=`onfocusout`):l=a=`oninput`,l==`oninput`&&r[a=l]&&(a=`oninputCapture`);}else i&&Lt$1.test(a)?a=a.replace(Rt$1,`-$&`).toLowerCase():o===null&&(o=void 0);r[a]=o;}}if(n==`select`){var u=r.defaultValue==null?r.multiple&&Array.isArray(r.value)?r.value:null:r.defaultValue;u!=null&&(r.value=ae(t.children).forEach(function(e){e.props.selected=r.multiple?u.indexOf(e.props.value)!=-1:u==e.props.value;}));}t.class&&!t.className?(r.class=t.class,Object.defineProperty(r,"className",Ht$1)):t.className&&(r.class=r.className=t.className),e.props=r;})(e);else if(typeof e.type==`function`&&(`ref`in e.props&&`prototype`in e.type&&e.type.prototype.render&&(e.ref=e.props.ref,delete e.props.ref),e.type.defaultProps)){var t=Nt$2({},e.props);for(var n in e.type.defaultProps)t[n]===void 0&&(t[n]=e.type.defaultProps[n]);e.props=t;}e.ref&&!(`ref`in e.props)&&Object.defineProperty(e.props,"ref",{value:e.ref,configurable:true,writable:true}),e.$$typeof=It$1,Ut$1&&Ut$1(e);};var Wt$1=exports("aK",ye$1(false)),Gt$1=`
${G$2}
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
`;function Kt$1(e){let t=H$2(),n=e.id??t,r=[`rdw-field`,e.className].filter(e=>e!==void 0&&e.length>0).join(` `);return K$3(A$2,{children:[K$3(`style`,{children:Gt$1}),K$3(`div`,{className:r,children:[e.label===void 0?null:K$3(`label`,{className:`rdw-field__label`,htmlFor:n,children:e.label}),e.type===`password`?K$3(`input`,{id:n,className:`rdw-field__input rdw-kit-focusable`,type:`password`,value:e.value,placeholder:e.placeholder,disabled:e.disabled,"aria-label":e[`aria-label`]??e.label,onInput:t=>{e.onChange(t.currentTarget.value);}}):K$3(`input`,{id:n,className:`rdw-field__input rdw-kit-focusable`,type:`text`,value:e.value,placeholder:e.placeholder,disabled:e.disabled,"aria-label":e[`aria-label`]??e.label,...e.inputAttrs,...e.inputRef===void 0?{}:{ref:e.inputRef},onInput:t=>{e.onChange(t.currentTarget.value);}})]})]})}var qt$1=`confirm`,Jt$1=`fields`,Yt$1=`name`,Xt$1=`query`,Zt$1=`Name`,Qt$1=`Query`,$t$1=`primary`,en$1=`Escape`,tn$1=`combobox`,nn$1=`true`,rn$1=`Tab`,an$1=`keydown`,on$1=`mousedown`,sn$1=40,cn$1=360,ln$1=16,un$1=.45,dn$1=16,fn$1=12,pn$1=8,mn$1=8,hn$1=`a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])`,gn$1=`
${G$2}
.rdw-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: ${String(sn$1)};
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: ${String(ln$1)}px;
  background: rgba(0, 0, 0, ${String(un$1)});
}
.rdw-dialog {
  box-sizing: border-box;
  width: 100%;
  max-width: ${String(cn$1)}px;
  display: grid;
  gap: ${String(fn$1)}px;
  padding: ${String(dn$1)}px;
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
  gap: ${String(pn$1)}px;
  margin: 0;
}
.rdw-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: ${String(mn$1)}px;
}
`;function _n$1(e){let t=e.querySelectorAll(hn$1),n=[];for(let e of t)e instanceof HTMLElement&&e.closest(`[hidden]`)===null&&n.push(e);return n}function vn$1(e,t){if(t===null)return  false;for(let n of e)if(n===t)return  true;return  false}function yn$1(e){if(e.variant===qt$1){let t=e.confirmTone??$t$1;return K$3(A$2,{children:[K$3(`p`,{className:`rdw-dialog__message`,children:e.message}),K$3(`div`,{className:`rdw-dialog__actions`,children:[K$3(q$3,{variant:`secondary`,size:`s`,onClick:e.onClose,children:e.cancelLabel}),K$3(q$3,{variant:t,size:`s`,onClick:e.onConfirm,children:e.confirmLabel})]})]})}if(e.variant===Jt$1){let t=e.nameLabel??Zt$1,n=e.queryLabel??Qt$1,r=t=>{e.onFieldsChange({name:e.fields.name,query:t});};return K$3(`form`,{className:`rdw-dialog__fields`,onSubmit:t=>{t.preventDefault(),e.onSubmit();},children:[e.only===Xt$1?null:K$3(Kt$1,{label:t,value:e.fields.name,onChange:t=>{e.onFieldsChange({name:t,query:e.fields.query});}}),e.only===Yt$1?null:e.renderQueryField===void 0?K$3(Kt$1,{label:n,value:e.fields.query,onChange:r}):e.renderQueryField({label:n,value:e.fields.query,onChange:r}),K$3(`div`,{className:`rdw-dialog__actions`,children:[K$3(q$3,{variant:`secondary`,size:`s`,type:`button`,onClick:e.onClose,children:e.cancelLabel}),K$3(q$3,{variant:`primary`,size:`s`,type:`submit`,children:e.submitLabel})]})]})}return K$3(A$2,{children:e.children})}function bn$1(e){let t=e.composedPath()[0];return t instanceof Element&&t.getAttribute(`role`)===tn$1&&t.getAttribute(`aria-expanded`)===nn$1}function xn$1(e){let t=V$2(null),n=V$2(false),r=V$2(null),i=H$2(),a=e.title!==void 0&&e.title.length>0,o=ze$2(Wt$1);if(B$2(()=>{if(!e.open){if(n.current){n.current=false;let e=r.current;r.current=null,e!==null&&typeof e.focus==`function`&&e.focus();}return}if(!n.current){let e=document.activeElement;r.current=e instanceof HTMLElement?e:null,n.current=true;}let i=t.current;if(i!==null){let t=e.initialFocusRef?.current??null;if(t!==null&&typeof t.focus==`function`)t.focus();else {let e=_n$1(i)[0];e===void 0?i.focus():e.focus();}}let a=n=>{if(n.key===en$1){if(bn$1(n))return;n.preventDefault(),n.stopPropagation(),e.onClose();return}if(n.key!==rn$1)return;let r=t.current;if(r===null)return;let i=_n$1(r);if(i.length===0){n.preventDefault(),r.focus();return}let a=i[0],o=i[i.length-1];if(a===void 0||o===void 0)return;let s=document.activeElement;n.shiftKey?s!==a&&r.contains(s)||(n.preventDefault(),o.focus()):s===o&&(n.preventDefault(),a.focus());},o=n=>{let r=t.current;r!==null&&(vn$1(n.composedPath(),r)||e.onClose());};return document.addEventListener(an$1,a,true),document.addEventListener(on$1,o,true),()=>{document.removeEventListener(an$1,a,true),document.removeEventListener(on$1,o,true);}},[e.open,e.onClose,e.initialFocusRef]),!e.open)return null;let s=[`rdw-dialog`,e.className].filter(e=>e!==void 0&&e.length>0).join(` `),c=K$3(A$2,{children:[K$3(`style`,{children:gn$1}),K$3(`div`,{className:`rdw-dialog-backdrop`,children:K$3(`div`,{ref:t,className:s,role:`dialog`,"aria-modal":`true`,"aria-label":a?void 0:e[`aria-label`],"aria-labelledby":a?i:void 0,tabIndex:-1,children:[a?K$3(`h2`,{id:i,className:`rdw-dialog__title`,children:e.title}):null,yn$1(e)]})})]});return o?c:Ft$1(c,document.body)}var Sn$1=`
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
`;function Cn$1(e){let t=[`rdw-empty`,e.className].filter(e=>e!==void 0&&e.length>0).join(` `);return K$3(A$2,{children:[K$3(`style`,{children:Sn$1}),K$3(`div`,{className:t,role:`status`,children:[K$3(`p`,{className:`rdw-empty__title`,children:e.title}),e.description===void 0?null:K$3(`p`,{className:`rdw-empty__desc`,children:e.description}),e.action]})]})}var wn$1=`
${G$2}
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
`;function Tn$1(e){let t=[`rdw-icon-btn`,`rdw-kit-focusable`,e.className].filter(e=>e!==void 0&&e.length>0).join(` `);return K$3(A$2,{children:[K$3(`style`,{children:wn$1}),K$3(`button`,{type:`button`,className:t,"aria-label":e.label,title:e.label,"aria-pressed":e.pressed,"aria-haspopup":e.menuOpen===void 0?void 0:`menu`,"aria-expanded":e.menuOpen,...e.buttonRef===void 0?{}:{ref:e.buttonRef},disabled:e.disabled,onClick:e.onClick,children:e.children})]})}var En$1=`
${G$2}
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
`;function Dn$1(e){let t=H$2(),n=e.id??t,r=[`rdw-num`,e.className].filter(e=>e!==void 0&&e.length>0).join(` `);return K$3(A$2,{children:[K$3(`style`,{children:En$1}),K$3(`div`,{className:r,children:[e.label===void 0?null:K$3(`label`,{className:`rdw-num__label`,htmlFor:n,children:e.label}),K$3(`input`,{id:n,className:`rdw-num__input rdw-kit-focusable`,type:`number`,value:e.value??``,min:e.min,max:e.max,step:e.step,placeholder:e.placeholder,disabled:e.disabled,"aria-label":e.label,onInput:t=>{let n=t.currentTarget.value;if(n.trim()===``){e.onChange(null);return}let r=Number(n);e.onChange(Number.isFinite(r)?r:null);}})]})]})}var On$1=`Escape`,kn$1=`keydown`,An$1=`mousedown`,jn$1=`scroll`,Mn$1=`resize`,Nn$1=`rdw-popover--fixed`,Pn$1=120,Fn$1=4,In$1=`
${G$2}
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
.rdw-popover.${Nn$1} {
  position: fixed;
  z-index: ${String(Pn$1)};
  min-width: 0;
  margin: 0;
  box-sizing: border-box;
}
`;function Ln$1(e,t,n,r){let i=e;return i+n>r&&(i=r-n),{top:t+Fn$1,left:i}}function Rn$1(e,t){if(t===null)return  false;for(let n of e)if(n===t)return  true;return  false}function zn$1(e){let t=V$2(null),n=V$2(false);B$2(()=>{if(!e.open){if(n.current){n.current=false;let t=e.anchorRef?.current??null;t!==null&&typeof t.focus==`function`&&t.focus();}return}n.current=true;let r=t=>{t.key===On$1&&(t.preventDefault(),e.onClose());},i=n=>{let r=t.current;if(r===null)return;let i=n.composedPath();Rn$1(i,r)||Rn$1(i,e.anchorRef?.current??null)||e.onClose();};return document.addEventListener(kn$1,r),document.addEventListener(An$1,i),()=>{document.removeEventListener(kn$1,r),document.removeEventListener(An$1,i);}},[e.open,e.onClose,e.anchorRef]);let r=e.widthPx,i=r!==void 0;if(Ie$2(()=>{if(!e.open||r===void 0)return;let n=()=>{let n=e.anchorRef?.current??null,i=t.current;if(n===null||i===null)return;let a=n.getBoundingClientRect(),o=Ln$1(e.alignEnd===true?Math.max(0,a.right-r):a.left,a.bottom,r,window.innerWidth);i.style.position=`fixed`,i.style.top=`${String(o.top)}px`,i.style.left=`${String(o.left)}px`,i.style.width=`${String(r)}px`;};n();let i=()=>{n();};return window.addEventListener(jn$1,i,true),window.addEventListener(Mn$1,i),()=>{window.removeEventListener(jn$1,i,true),window.removeEventListener(Mn$1,i);}},[e.open,e.anchorRef,e.alignEnd,r]),!e.open)return null;let a=[`rdw-popover`,i?Nn$1:void 0,e.className].filter(e=>e!==void 0&&e.length>0).join(` `),o=K$3(A$2,{children:[K$3(`style`,{children:In$1}),K$3(`div`,{ref:t,className:a,role:e.role??`dialog`,"aria-label":e[`aria-label`],children:e.children})]});return i&&document.body!==null?Ft$1(o,document.body):o}var Bn$1=`--rdw-progress-width`,Vn$1=`
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
  width: var(${Bn$1}, 0%);
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
`;function Hn$1(e){return !Number.isFinite(e)||e<0?0:e>1?1:e}function Un$1(e){let t=V$2(null),n=e.waiting===true,r=e.value!==void 0&&e.value!==null,i=r?Hn$1(e.value):0,a=[`rdw-progress`,e.className].filter(e=>e!==void 0&&e.length>0).join(` `);return B$2(()=>{let e=t.current;e!==null&&(n||!r?e.style.removeProperty(Bn$1):e.style.setProperty(Bn$1,`${Math.round(i*100)}%`));},[n,r,i]),K$3(A$2,{children:[K$3(`style`,{children:Vn$1}),K$3(`div`,{className:a,children:[e.label===void 0?null:K$3(`div`,{className:`rdw-progress__label`,children:e.label}),K$3(`div`,{className:`rdw-progress__track`,role:`progressbar`,"aria-label":e.label,"aria-valuemin":0,"aria-valuemax":100,"aria-valuenow":r&&!n?Math.round(i*100):void 0,children:K$3(`div`,{ref:t,className:n?`rdw-progress__fill rdw-progress__fill--indeterminate`:`rdw-progress__fill`})})]})]})}var Wn$1=`rdw-search-field`,Gn$1=`rdw-search-help`,Kn$1=`rdw-search-field__icon`,qn$1=`rdw-search-field__tools`,Jn$1=`rdw-search-field__tool`,Yn$1=`rdw-search-help__note`,Xn$1=`rdw-search-field__input`,Zn$1=`rdw-suggest`,Qn$1=`rdw-suggest__heading`,$n$1=`rdw-suggest__list`,X$3=`rdw-suggest__row`,er$1=`rdw-suggest__row--active`,tr$1=`rdw-suggest__row--divider`,nr$1=`rdw-suggest__label`,rr$1=`rdw-suggest__trailing`,ir$1=320,ar$1=480,or$1=28,sr$1=4,cr$1=8,lr$1=120,ur$1=3,dr$1=`ArrowDown`,fr$1=`ArrowUp`,pr$1=`Enter`,mr$1=`Tab`,hr$1=`Escape`,gr$1=`Clear`,_r$1=320,vr$1=14,yr$1=`
.${Wn$1} {
  position: relative;
  min-width: 0;
}
.${Wn$1} .${Xn$1} {
  margin: 0;
}
.${Wn$1} .${Xn$1} .rdw-field__input {
  padding-left: 30px;
  padding-right: 56px;
}
.${Kn$1} {
  position: absolute;
  left: 9px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--rdw-muted);
  pointer-events: none;
}
.${qn$1} {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 2px;
}
.${Jn$1} {
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
.${Jn$1}:hover,
.${Jn$1}[aria-expanded="true"] {
  color: var(--rdw-text);
}
.${Gn$1} {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 4px 12px;
  margin: 0;
}
/* The site styles dt on its own (bold, its own font); a command has to be in
   a fixed-width font, or the spaces that matter in it cannot be seen. */
.rdw-popover .${Gn$1} dt {
  margin: 0;
  font: 400 12px/1.4 ui-monospace, "Cascadia Mono", Consolas, "Courier New", monospace !important;
  white-space: pre;
  color: var(--rdw-text);
}
.${Gn$1} dd {
  margin: 0;
  color: var(--rdw-muted);
}
.${Yn$1} {
  margin: 8px 0 0;
  padding-top: 8px;
  border-top: 1px solid var(--rdw-border);
  color: var(--rdw-muted);
  line-height: 1.4;
}
`.trim(),br$1=`
.${Zn$1} {
  position: fixed;
  z-index: ${String(lr$1)};
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
.${Qn$1} {
  padding: 4px 8px 6px;
  color: var(--rdw-muted);
  font: 600 10.5px var(--rdw-font);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.${$n$1} {
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 224px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--rdw-border) transparent;
}
.${X$3} {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: ${String(or$1)}px;
  margin: 0;
  padding: 0 8px 0 11px;
  border-radius: var(--rdw-radius-s);
  list-style: none;
  cursor: pointer;
  position: relative;
}
.${X$3}.${tr$1} {
  margin-top: 9px;
}
/* The rule between the tags that begin with what was typed and the rest. */
.${X$3}.${tr$1}::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: -5px;
  border-top: 1px solid var(--rdw-border);
}
.${X$3}:hover,
.${X$3}.${er$1} {
  background: var(--rdw-surface-2);
}
/* The line chosen with the keyboard has a bar as well: not told by colour alone. */
.${X$3}.${er$1}::before {
  content: "";
  position: absolute;
  left: 0;
  top: 4px;
  bottom: 4px;
  width: ${String(ur$1)}px;
  border-radius: ${String(ur$1)}px;
  background: var(--rdw-accent);
}
.${nr$1} {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--rdw-muted);
}
.${nr$1} b {
  color: var(--rdw-text);
  font-weight: 700;
}
/* On the chosen line the rest of the tag is in the text colour too: muted on
   the fill of that line passes the contrast limit only just (4.7:1 in Dark).
   What was typed is still told by its weight. */
.${X$3}.${er$1} .${nr$1} {
  color: var(--rdw-text);
}
.${rr$1} {
  flex: none;
  color: var(--rdw-muted);
  font-variant-numeric: tabular-nums;
  text-align: right;
}
`.trim();function xr$1(e,t,n,r){let i=Math.max(0,r-16),a=Math.min(i,Math.max(ir$1,Math.min(ar$1,n))),o=Math.max(cr$1,Math.min(e,r-cr$1-a));return {top:t+sr$1,left:o,width:a}}function Sr(e){return K$3(A$2,{children:[K$3(`style`,{children:yr$1}),K$3(`dl`,{className:Gn$1,children:e.help.rows.map(([e,t])=>K$3(A$2,{children:[K$3(`dt`,{children:e}),K$3(`dd`,{children:t})]}))}),e.help.note===void 0?null:K$3(`p`,{className:Yn$1,children:e.help.note})]})}function Cr(e){let[t,n]=z$2(false),r=V$2(null),i=V$2(null),a=V$2(null),o=V$2(null),s=H$2(),[c,l]=z$2(0),[u,d]=z$2(false),[f,p]=z$2(false),[m,h]=z$2(0),g=V$2(null),{help:_,suggest:v,onCommit:y}=e,b=e.clearLabel??gr$1,x=[Wn$1,e.className].filter(e=>e!==void 0&&e.length>0).join(` `),S=v!==void 0&&u&&!f?v.list(e.value,c):null,C=S?.items??[],w=C.length>0,T=w?Math.min(m,C.length-1):-1,E=()=>a.current?.selectionStart??e.value.length,D=t=>{e.onChange(t);let n=a.current?.selectionStart??t.length;l(n),p(false),h(0);let r=v===void 0?null:v.list(t,n);(r===null||r.items.length===0)&&y?.(t);},O=t=>{let n=v?.pick(e.value,c,t)??null;n!==null&&(g.current=n.caret,e.onChange(n.text),l(n.caret),h(0),y?.(n.text));};Ie$2(()=>{let e=g.current,t=a.current;e!==null&&t!==null&&(g.current=null,t.setSelectionRange(e,e));}),Ie$2(()=>{if(!w)return;let e=()=>{let e=i.current,t=o.current;if(e===null||t===null)return;let n=e.getBoundingClientRect(),r=xr$1(n.left,n.bottom,n.width,window.innerWidth);t.style.top=`${String(r.top)}px`,t.style.left=`${String(r.left)}px`,t.style.width=`${String(r.width)}px`;};return e(),window.addEventListener(`scroll`,e,true),window.addEventListener(`resize`,e),()=>{window.removeEventListener(`scroll`,e,true),window.removeEventListener(`resize`,e);}},[w]),B$2(()=>{if(T<0)return;let e=o.current?.querySelector(`#${CSS.escape(`${s}-${String(T)}`)}`);e instanceof HTMLElement&&typeof e.scrollIntoView==`function`&&e.scrollIntoView({block:`nearest`});},[T,s]);let ee=t=>{if(!w)t.key===pr$1&&y?.(e.value);else if(t.key===dr$1||t.key===fr$1){t.preventDefault();let e=t.key===dr$1?1:-1;h((T+e+C.length)%C.length);}else t.key===pr$1||t.key===mr$1?(t.preventDefault(),O(T)):t.key===hr$1&&(t.preventDefault(),t.stopPropagation(),p(true),y?.(e.value));},k=w?K$3(A$2,{children:[K$3(`style`,{children:br$1}),K$3(`div`,{className:Zn$1,ref:o,onMouseDown:e=>{e.preventDefault();},children:[S?.heading===null||S?.heading===void 0?null:K$3(`div`,{className:Qn$1,"aria-hidden":`true`,children:S.heading}),K$3(`ul`,{className:$n$1,id:s,role:`listbox`,"aria-label":S?.heading===null||S?.heading===void 0?v?.label:`${v?.label??``}: ${S.heading}`,children:C.map((e,t)=>K$3(`li`,{id:`${s}-${String(t)}`,role:`option`,"aria-selected":t===T,"aria-label":e.announce,className:[X$3,t===T?er$1:``,e.divider?tr$1:``].filter(e=>e.length>0).join(` `),onClick:()=>{O(t);},children:[K$3(`span`,{className:nr$1,children:[e.label.slice(0,e.matchStart),K$3(`b`,{children:e.label.slice(e.matchStart,e.matchStart+e.matchLength)}),e.label.slice(e.matchStart+e.matchLength)]}),e.trailing===null?null:K$3(`span`,{className:rr$1,children:e.trailing})]},e.key))})]})]}):null,j=v===void 0?{}:{role:`combobox`,autocomplete:`off`,"aria-autocomplete":`list`,"aria-expanded":w,"aria-controls":s,...T>=0?{"aria-activedescendant":`${s}-${String(T)}`}:{},onKeyDown:ee,onKeyUp:()=>{l(E());},onClick:()=>{l(E());},onFocus:()=>{d(true),l(E()),e.onFocus?.();},onBlur:()=>{d(false),p(false),y?.(e.value);}};return K$3(`div`,{className:x,ref:i,children:[K$3(`style`,{children:yr$1}),K$3(xt$2,{className:Kn$1,size:vr$1}),K$3(Kt$1,{...e.id===void 0?{}:{id:e.id},className:Xn$1,value:e.value,placeholder:e.placeholder,"aria-label":e[`aria-label`],inputRef:a,inputAttrs:j,onChange:D}),k!==null&&document.body!==null?Ft$1(k,document.body):null,K$3(`span`,{className:qn$1,children:[e.value.length>0?K$3(`button`,{type:`button`,className:`${Jn$1} rdw-kit-focusable`,"aria-label":b,title:b,onClick:()=>{e.onChange(``),y?.(``),i.current?.querySelector(`input`)?.focus();},children:K$3(pt$2,{size:vr$1})}):null,_===void 0?null:K$3(`button`,{type:`button`,ref:r,className:`${Jn$1} rdw-kit-focusable`,"aria-label":_.label,title:_.label,"aria-expanded":t,onClick:()=>{n(!t);},children:K$3(Ot$2,{size:vr$1})})]}),_===void 0?null:K$3(zn$1,{open:t,onClose:()=>{n(false);},anchorRef:r,widthPx:_.widthPx??_r$1,alignEnd:true,"aria-label":_.label,children:K$3(Sr,{help:_})})]})}var wr=`
.rdw-section-label {
  display: block;
  font: 600 10.5px var(--rdw-font);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--rdw-muted);
  margin: 0 0 4px;
}
`;function Tr(e){let t=[`rdw-section-label`,e.className].filter(e=>e!==void 0&&e.length>0).join(` `);return e.htmlFor===void 0?K$3(A$2,{children:[K$3(`style`,{children:wr}),K$3(`div`,{className:t,children:e.children})]}):K$3(A$2,{children:[K$3(`style`,{children:wr}),K$3(`label`,{className:t,htmlFor:e.htmlFor,children:e.children})]})}var Er=`
${G$2}
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
`;function Dr(e){let t=[`rdw-seg`,e.className].filter(e=>e!==void 0&&e.length>0).join(` `),n=e.disabled===true;return K$3(A$2,{children:[K$3(`style`,{children:Er}),K$3(`div`,{className:t,role:`radiogroup`,"aria-label":e.label,"aria-disabled":n?true:void 0,children:e.options.map(t=>{let r=t.value===e.value;return K$3(`button`,{type:`button`,role:`radio`,className:`rdw-seg__btn rdw-kit-focusable`,"aria-checked":r,"aria-disabled":n?true:void 0,tabIndex:r?0:-1,onClick:()=>{n||e.onChange(t.value);},onKeyDown:t=>{if(n||t.key!==`ArrowRight`&&t.key!==`ArrowLeft`)return;t.preventDefault();let r=e.options.findIndex(t=>t.value===e.value);if(r<0)return;let i=t.key===`ArrowRight`?1:-1,a=e.options[(r+i+e.options.length)%e.options.length];a!==void 0&&e.onChange(a.value);},children:t.label},t.value)})})]})}var Or=`rdw-selbar`,kr=`rdw-selbar--row`,Ar=`rdw-selbar--stack`,jr=`rdw-selbar__count`,Mr=`rdw-selbar__head`,Nr=`rdw-selbar__pick`,Pr=`rdw-selbar__spacer`,Z$3=`rdw-selbar__actions`,Fr=`rdw-selbar__rule`,Ir=`Selection`,Lr=`Clear`,Rr=`Cancel`,zr=` selected`,Br=` (Ctrl+A)`,Vr=`keydown`,Hr=`KeyA`,Ur=`input, textarea, select, [contenteditable], [role="dialog"]`,Wr=`[role="dialog"]`,Gr=5,Kr=`
.${Or} {
  box-sizing: border-box;
  color: var(--rdw-text);
  font-size: ${W$2};
}
.${kr} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-height: ${U$2};
  margin-inline: ${String(Gr)}px;
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-accent-soft);
  box-shadow: 0 0 0 ${String(Gr)}px var(--rdw-accent-soft);
}
.${Ar} {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border: 1px solid var(--rdw-accent);
  border-radius: var(--rdw-radius-l);
  background: var(--rdw-accent-soft);
}
.${jr} {
  font-weight: 600;
  white-space: nowrap;
}
.${kr} > .${jr} {
  padding-inline: 4px 8px;
}
.${Mr},
.${Nr} {
  display: flex;
  align-items: center;
  gap: 8px;
}
.${Mr} {
  justify-content: space-between;
}
.${Pr} {
  flex: 1 1 0;
  min-width: 0;
}
.${Z$3} {
  display: flex;
  align-items: center;
  gap: 8px;
}
.${Ar} .${Z$3} {
  flex-direction: column;
  align-items: stretch;
}
.${Ar} .${Z$3} > .rdw-btn {
  width: 100%;
}
.${Fr} {
  flex: none;
  align-self: stretch;
  background: var(--rdw-border);
}
.${kr} > .${Fr} {
  width: 1px;
  margin-block: 4px;
}
.${Ar} > .${Fr} {
  height: 1px;
}
`;function qr(e){if(document.querySelector(Wr)!==null)return  true;let t=e.composedPath()[0];if(!(t instanceof Element))return  false;if(t.closest(Ur)!==null)return  true;let n=t.getRootNode();return n instanceof ShadowRoot&&n.querySelector(Wr)!==null}function Jr(e){let t=e.layout??`row`,n=e.count===0,r=V$2(e.onSelectAll);r.current=e.onSelectAll,B$2(()=>{let e=e=>{e.code!==Hr||!(e.ctrlKey||e.metaKey)||e.altKey||e.shiftKey||e.defaultPrevented||qr(e)||(e.preventDefault(),r.current());};return document.addEventListener(Vr,e),()=>{document.removeEventListener(Vr,e);}},[]);let i=K$3(`span`,{className:jr,"aria-live":`polite`,children:`${String(e.count)}${zr}`}),a=e.selectAllLabel??`Select all`,o=e.selectAll??K$3(q$3,{variant:`ghost`,title:`${a}${Br}`,onClick:e.onSelectAll,children:a}),s=K$3(q$3,{variant:`ghost`,disabled:n,onClick:e.onClear,children:Lr}),c=K$3(q$3,{variant:`secondary`,onClick:e.onCancel,children:Rr}),l=e.children!==void 0&&e.children!==null,u=e.danger!==void 0&&e.danger!==null,d=l&&u?K$3(`span`,{className:Fr,"aria-hidden":`true`}):null;return t===`stack`?K$3(`div`,{className:`${Or} ${Ar}`,role:`toolbar`,"aria-label":Ir,"aria-orientation":`vertical`,children:[K$3(`style`,{children:Kr}),K$3(`div`,{className:Mr,children:[i,c]}),K$3(`div`,{className:Nr,children:[o,s]}),l?K$3(`div`,{className:Z$3,children:e.children}):null,d,u?K$3(`div`,{className:Z$3,children:e.danger}):null]}):K$3(`div`,{className:`${Or} ${kr}`,role:`toolbar`,"aria-label":Ir,children:[K$3(`style`,{children:Kr}),i,o,s,K$3(`span`,{className:Pr,"aria-hidden":`true`}),l?K$3(`div`,{className:Z$3,children:e.children}):null,d,u?K$3(`div`,{className:Z$3,children:e.danger}):null,c]})}var Yr=`rdw-select__list`,Xr=`rdw-select__list--floating`,Zr=4,Qr=14,$r=220,ei=8,ti=360,ni=`scroll`,ri=`resize`,ii=`
${G$2}
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
.${Yr} {
  position: absolute;
  z-index: 20;
  top: calc(100% + ${String(Zr)}px);
  left: 0;
  right: 0;
  margin: 0;
  padding: 4px;
  list-style: none;
  background: var(--rdw-surface);
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  box-shadow: var(--rdw-shadow-2);
  max-height: ${String($r)}px;
  overflow: auto;
}
/* On a page of the site the list is drawn in <body> and placed by the trigger. */
.${Yr}.${Xr} {
  position: fixed;
  z-index: 120;
  right: auto;
  box-sizing: border-box;
  max-width: ${String(ti)}px;
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
`;function ai(e){let t=H$2(),n=V$2(null),r=V$2(null),i=V$2(null),[a,o]=z$2(false),s=!ze$2(Wt$1)&&!(n.current?.getRootNode()instanceof ShadowRoot),c=e.options.find(t=>t.value===e.value)??e.options[0],l=[`rdw-select`,e.className].filter(e=>e!==void 0&&e.length>0).join(` `);B$2(()=>{if(!a)return;let e=e=>{e.key===`Escape`&&o(false);},t=e=>{let t=n.current;if(t===null)return;let r=e.composedPath(),a=i.current;r.includes(t)||a!==null&&r.includes(a)||o(false);};return document.addEventListener(`keydown`,e),document.addEventListener(`mousedown`,t),()=>{document.removeEventListener(`keydown`,e),document.removeEventListener(`mousedown`,t);}},[a]),Ie$2(()=>{if(!a||!s)return;let e=()=>{let e=r.current,t=i.current;if(e===null||t===null)return;let n=e.getBoundingClientRect(),a=Math.min(t.scrollHeight,$r),o=n.bottom+Zr,s=o+a<=window.innerHeight-ei,c=n.top-Zr-a;t.style.top=`${String(s||c<ei?o:c)}px`,t.style.left=`${String(n.left)}px`,t.style.minWidth=`${String(n.width)}px`;};return e(),window.addEventListener(ni,e,true),window.addEventListener(ri,e),()=>{window.removeEventListener(ni,e,true),window.removeEventListener(ri,e);}},[a,s]);let u=a?K$3(`ul`,{className:s?`${Yr} ${Xr}`:Yr,role:`listbox`,id:t,tabIndex:-1,ref:i,children:e.options.map(t=>K$3(`li`,{role:`option`,className:`rdw-select__option rdw-kit-focusable`,"aria-selected":t.value===e.value,tabIndex:0,onClick:()=>{e.onChange(t.value),o(false);},onKeyDown:n=>{(n.key===`Enter`||n.key===` `)&&(n.preventDefault(),e.onChange(t.value),o(false),r.current?.focus());},children:[K$3(`span`,{children:t.label}),t.value===e.value?K$3(ft$2,{size:Qr,className:`rdw-select__tick`}):null]},t.value))}):null;return K$3(A$2,{children:[K$3(`style`,{children:ii}),K$3(`div`,{className:l,ref:n,children:[e.label===void 0?null:K$3(`span`,{className:`rdw-select__label`,id:`${t}-label`,children:e.label}),K$3(`button`,{type:`button`,className:`rdw-select__trigger rdw-kit-focusable`,"aria-haspopup":`listbox`,"aria-expanded":a,"aria-controls":t,"aria-labelledby":e.label===void 0?void 0:`${t}-label`,disabled:e.disabled,ref:r,onClick:()=>{o(e=>!e);},children:[K$3(`span`,{children:c?.label??e.value}),K$3(mt$2,{size:14})]}),s?null:u]}),s&&u!==null?Ft$1(u,document.body):null]})}var Q$3=`[${l$1}="${u$2}"]`,oi=`[${l$1}="${d$2}"]`,si=Gn$2(Vn$2,Hn$2,[An$2,`#ffffff`]),ci=Gn$2(zn$2,Fn$2,[`#16181c`,`#ffffff`]),li=`
${G$2}
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
html${Q$3} .rdw-switch[aria-checked="true"] .rdw-switch__track,
:host-context(${Q$3}) .rdw-switch[aria-checked="true"] .rdw-switch__track {
  background: ${Vn$2};
}
html${Q$3} .rdw-switch[aria-checked="true"] .rdw-switch__thumb,
:host-context(${Q$3}) .rdw-switch[aria-checked="true"] .rdw-switch__thumb {
  background: ${si};
}
html${Q$3} .rdw-switch:not([aria-checked="true"]) .rdw-switch__track,
:host-context(${Q$3}) .rdw-switch:not([aria-checked="true"]) .rdw-switch__track {
  background: var(--rdw-border);
}
/* Site dark: ON = accent; OFF = border; thumb contrast-checked vs accent. */
html${oi} .rdw-switch[aria-checked="true"] .rdw-switch__track,
:host-context(${oi}) .rdw-switch[aria-checked="true"] .rdw-switch__track {
  background: ${zn$2};
}
html${oi} .rdw-switch[aria-checked="true"] .rdw-switch__thumb,
:host-context(${oi}) .rdw-switch[aria-checked="true"] .rdw-switch__thumb {
  background: ${ci};
}
html${oi} .rdw-switch:not([aria-checked="true"]) .rdw-switch__track,
:host-context(${oi}) .rdw-switch:not([aria-checked="true"]) .rdw-switch__track {
  background: ${Ln$2};
}
`;function ui(e){let t=[`rdw-switch-row`,e.className].filter(e=>e!==void 0&&e.length>0).join(` `);return K$3(A$2,{children:[K$3(`style`,{children:li}),K$3(`div`,{className:t,children:[K$3(`button`,{type:`button`,id:e.id,className:`rdw-switch rdw-kit-focusable`,role:`switch`,"aria-checked":e.checked,"aria-label":e.label,disabled:e.disabled,onClick:()=>{e.onChange(!e.checked);},children:K$3(`span`,{className:`rdw-switch__track`,children:K$3(`span`,{className:`rdw-switch__thumb`})})}),e.label===void 0?null:K$3(`span`,{className:`rdw-switch__label`,children:e.label})]})]})}var di=`rdw-tab-`,fi=`rdw-tabpanel-`,pi=`ArrowRight`,mi=`ArrowLeft`;function hi(e){return `${di}${e}`}function gi(e){return `${fi}${e}`}var _i=`
${G$2}
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
`;function vi(e){let t=[`rdw-tabs`,e.className].filter(e=>e!==void 0&&e.length>0).join(` `);return K$3(A$2,{children:[K$3(`style`,{children:_i}),K$3(`div`,{className:t,role:`tablist`,"aria-label":e[`aria-label`],children:e.items.map(t=>{let n=t.id===e.value;return K$3(`button`,{type:`button`,role:`tab`,id:hi(t.id),className:`rdw-tabs__tab rdw-kit-focusable`,"aria-selected":n,"aria-controls":gi(t.id),tabIndex:n?0:-1,onClick:()=>{e.onChange(t.id);},onKeyDown:t=>{if(t.key!==pi&&t.key!==mi)return;t.preventDefault();let n=e.items.findIndex(t=>t.id===e.value);if(n<0)return;let r=t.key===pi?1:-1,i=e.items[(n+r+e.items.length)%e.items.length];if(i===void 0)return;e.onChange(i.id);let a=t.currentTarget.parentElement?.querySelector(`#${hi(i.id)}`);a instanceof HTMLElement&&a.focus();},children:t.label},t.id)})})]})}var yi=6e3,bi=45,xi=16,Si=420,Ci=12,wi=8,Ti=12,Ei=0,$$3=null;function Di(e){e.timerId!==null&&(window.clearTimeout(e.timerId),e.timerId=null);}function Oi(e){Ei+=1;let t={id:Ei,close:e,timerId:null},n=$$3;return $$3=t,n!==null&&(Di(n),n.close()),t}function ki(e){if($$3===null||$$3.id!==e)return;let t=$$3;Di(t),$$3=null,t.close();}function Ai(e){$$3!==null&&$$3.id===e&&($$3=null);}var ji=`
${G$2}
.rdw-toast {
  position: fixed;
  z-index: ${String(bi)};
  left: 50%;
  bottom: ${String(xi)}px;
  transform: translateX(-50%);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: ${String(Ti)}px;
  width: max-content;
  max-width: min(${String(Si)}px, calc(100% - 32px));
  padding: ${String(wi)}px ${String(Ci)}px;
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
`;function Mi(e){let[t,n]=z$2(null);return Ie$2(()=>{if(!e.open){n(null);return}let t=true,r=Oi(()=>{t&&n(null),e.onClose();});return n(r.id),r.timerId=window.setTimeout(()=>{ki(r.id);},yi),()=>{t=false,Di(r),Ai(r.id);}},[e.open,e.message,e.onClose]),!e.open||t===null||$$3===null||$$3.id!==t?null:K$3(A$2,{children:[K$3(`style`,{children:ji}),K$3(`div`,{className:`rdw-toast`,role:`status`,children:[K$3(`p`,{className:`rdw-toast__message`,children:e.message}),e.action===void 0?null:K$3(q$3,{variant:`secondary`,size:`s`,onClick:e.action.onClick,children:e.action.label})]})]})}var s=`ruledesk-web.favorites-index`,c=1,l=`posts`,u=`id`,d=A$3({id:D$3(),tags:T$2(),thumb:T$2(),run:E$3(),pos:D$3(),cut:N$3(O$3())});function f(){return typeof indexedDB<`u`}function p(){return new Promise((e,t)=>{let n=indexedDB.open(s,c);n.onerror=()=>{t(n.error??Error(`favorites-index: open failed`));},n.onsuccess=()=>{e(n.result);},n.onupgradeneeded=()=>{let e=n.result;e.objectStoreNames.contains(l)||e.createObjectStore(l,{keyPath:u});};})}function m(e){return new Promise((t,n)=>{e.oncomplete=()=>{t();},e.onerror=()=>{n(e.error??Error(`favorites-index: transaction failed`));},e.onabort=()=>{n(e.error??Error(`favorites-index: transaction aborted`));};})}async function h$1(e){if(e.length===0||!f())return;let t=await p();try{let n=t.transaction(l,`readwrite`),r=n.objectStore(l);for(let t of e)r.put(t);await m(n);}finally{t.close();}}async function g$1(){if(!f())return [];let e=await p();try{let t=e.transaction(l,`readonly`).objectStore(l).getAll(),n=await new Promise((e,n)=>{t.onerror=()=>{n(t.error??Error(`favorites-index: read failed`));},t.onsuccess=()=>{let n=t.result;e(Array.isArray(n)?n:[]);};}),r=[];for(let e of n){let t=d.safeParse(e);t.success&&r.push(t.data);}return r}finally{e.close();}}function _$1(t){h$1(t).catch(t=>{m$2.warn(`favorites-index: write failed`,t);});}var _e=`jpg`,ve=/\.([a-z0-9]{2,5})$/i,ye=`unknown error`,be=`timeout`,xe$1=`downloads`,Se$1=60,Ce$1=/[\\/:*?"<>|]+/g,E$1=/\s+/g,we$1=/^[. ]+|[. ]+$/g;function Te$1(e){let t=e.replace(Ce$1,` `).replace(E$1,` `).slice(0,Se$1).replace(we$1,``);return t.length>0?t:xe$1}var D$1=`rule34-[id]`,Ee$1=[`id`,`md5`,`rating`,`score`,`width`,`height`,`owner`,`date`],De$1=/\[([a-z0-9]+)\]/gi,Oe$1=/[\\/:*?"<>|\u0000-\u001f]+/g,ke$1=/([-_. ])[-_. ]+/g,Ae$1=/^[-_. ]+|[-_. ]+$/g,je$1=120,Me$1=10,Ne$1=/([^/]+?)(?:\.[a-z0-9]{2,5})?$/i; exports({a4:D$1,a5:Ee$1});function Pe$1(e){return Ee$1.some(t=>t===e)}function O$1(e){try{return new URL(e,window.location.href).pathname}catch{return e}}function Fe$1(e){return ve.exec(O$1(e))?.[1]?.toLowerCase()??_e}function Ie$1(e){return Ne$1.exec(O$1(e))?.[1]??``}function Le$1(e,t,n){switch(e){case `id`:return String(t.postId);case `md5`:return Ie$1(t.url);case `rating`:return t.rating??``;case `score`:return t.score===void 0?``:String(t.score);case `width`:return t.width===void 0?``:String(t.width);case `height`:return t.height===void 0?``:String(t.height);case `owner`:return t.owner??``;case `date`:return new Date(n).toISOString().slice(0,Me$1)}}function Re$1(e,t,n=Date.now()){let r=e=>e.replace(De$1,(e,r)=>{let i=r.toLowerCase();return Pe$1(i)?Le$1(i,t,n):``}).replace(Oe$1,` `).replace(E$1,` `).replace(ke$1,`$1`).replace(Ae$1,``).slice(0,je$1).replace(Ae$1,``),i=r(e);return `${i.length>0?i:r(D$1)}.${Fe$1(t.url)}`}function ze$1(e,t){return e.toLowerCase().includes(`[${t}]`)}function Be$1(e,t){if(!ze$1(e,t)){let n=e.trim();return n.length>0?`${n} [${t}]`:`[${t}]`}let n=RegExp(`\\[${t}\\]`,`gi`);return e.replace(n,``).replace(E$1,` `).trim()}var Ve$1=/\.(?:jpe?g|png|gif|webp|avif|bmp|mp4|webm|mov|m4v)$/i;function He$1(e){return Ve$1.test(O$1(e))}function Ue$1(){return typeof GM_download==`function`}function k$1(e,t){return new Promise((n,r)=>{GM_download({url:e,name:t,headers:{Referer:`${window.location.origin}/`},onload:()=>{n();},onerror:e=>{let t=typeof e.error==`string`?e.error:ye;r(Error(t));},ontimeout:()=>{r(Error(be));}});})}var A$1=`ruledesk-web.api`,j$1=A$3({userId:T$2().check(Ii(1)),apiKey:T$2().check(Ii(1))});function We$1(){let e=j$1.safeParse(GM_getValue(A$1));return e.success?e.data:null}function Ge$1(){return We$1()!==null}function Ke$1(e,t){let n=j$1.safeParse({userId:e.trim(),apiKey:t.trim()});return n.success?(GM_setValue(A$1,n.data),true):false}function qe$1(){GM_setValue(A$1,null);}var Je$1=/(?:^|[?&\s])user_id=([^&\s#]+)/i,Ye$1=/(?:^|[?&\s])api_key=([^&\s#]+)/i;function Xe$1(e){try{return decodeURIComponent(e)}catch{return e}}function Ze$1(e){let t=Je$1.exec(e)?.[1],n=Ye$1.exec(e)?.[1];if(t===void 0||n===void 0)return null;let r=j$1.safeParse({userId:Xe$1(t).trim(),apiKey:Xe$1(n).trim()});return r.success?r.data:null}var Qe$1=`downloads`;function $e$1(){return Ec$1()&&Oc$1(`downloads`,true)&&Ue$1()&&Ge$1()}var et$1=`https://api.rule34.xxx/index.php`,tt$1=1e3,nt$1=1e3,rt$1=`omit`,M$1=120,it$1=`sort:`,at$1=`id:<`,ot$1=/\s+/,st$1=`all`;function N$1(e){return new Promise(t=>{window.setTimeout(t,e);})}var ct$1=A$3({id:D$3(),file_url:T$2().check(Ii(1)),rating:N$3(Hi()),score:N$3(Hi()),width:N$3(Hi()),height:N$3(Hi()),owner:N$3(Hi())});function lt$1(e){return typeof e==`string`&&e.length>0?e:void 0}function P$1(e){let t=typeof e==`string`?Number(e):e;return typeof t==`number`&&Number.isFinite(t)?t:void 0}function ut$1(e,t){let n=new URLSearchParams;return n.set(`page`,`dapi`),n.set(`s`,`post`),n.set(`q`,`index`),n.set(`json`,`1`),n.set(`limit`,String(tt$1)),n.set(`pid`,`0`),`id`in e?n.set(`id`,String(e.id)):e.tags.length>0&&e.tags!==st$1&&n.set(`tags`,e.tags),n.set(`user_id`,t.userId),n.set(`api_key`,t.apiKey),`${et$1}?${n.toString()}`}var dt$1=1100,ft$1=15e3,pt$1=429,mt$1=`ruledesk-web.api-last`,F$1=0,ht$1=Promise.resolve();function gt$1(){try{let e=Number(window.localStorage.getItem(mt$1));return Number.isFinite(e)?e:0}catch{return 0}}function _t$1(e){try{window.localStorage.setItem(mt$1,String(e));}catch{}}function vt$1(){let e=ht$1.then(async()=>{let e=Date.now(),t=Math.min(gt$1(),e),n=Math.max(F$1,t)+dt$1-e;n>0&&await N$1(n),F$1=Date.now(),_t$1(F$1);});return ht$1=e.catch(()=>void 0),e}async function yt$1(e,t){for(let n=0;;n+=1){await vt$1();let r=await fetch(ut$1(e,t),{method:`GET`,credentials:rt$1});if(r.status===pt$1&&n<3)await N$1(ft$1);else {if(!r.ok)throw Error(`API HTTP ${String(r.status)}`);return r.text()}}}function bt$1(e){let t=e.trim();if(t.length===0)return [];let n;try{n=JSON.parse(t);}catch{throw Error(`API: ${t.slice(0,M$1)}`)}if(typeof n==`string`)throw Error(`API: ${n.slice(0,M$1)}`);if(!Array.isArray(n))throw Error(`API: ${t.slice(0,M$1)}`);let r=[];for(let e of n){let t=ct$1.safeParse(e);t.success&&ut$4(t.data.file_url)&&r.push({postId:t.data.id,url:t.data.file_url,rating:lt$1(t.data.rating),score:P$1(t.data.score),width:P$1(t.data.width),height:P$1(t.data.height),owner:lt$1(t.data.owner)});}return r}function xt$1(e){return e.trim().split(ot$1).filter(e=>e.length>0&&!e.startsWith(it$1)).join(` `)}async function St$1(e,t){let n=xt$1(e),r=[],i=null;for(;;){if(t.isCancelled())return r;let e=i===null?``:`${at$1}${String(i)}`,a=bt$1(await yt$1({tags:[n===st$1?``:n,e].filter(e=>e.length>0).join(` `)},t.credentials));if(a.length===0)return r;let o=a[0]?.postId??0;for(let e of a)r.push(e),o=Math.min(o,e.postId);if(t.onProgress(r.length),i!==null&&o>=i)return r;i=o,await N$1(nt$1);}}async function Ct$1(e,t){let n=[];for(let r of e){if(t.isCancelled())break;let e=bt$1(await yt$1({id:r},t.credentials)),i=e.find(e=>e.postId===r)??e[0];i!==void 0&&n.push(i),t.onProgress(n.length);}return n}function wt$1(e,t){return e.kind===`query`?St$1(e.tags,t):Ct$1(e.ids,t)}var Tt$1=`download-name`;function Et$1(){let e=Nc$1(Tt$1);return typeof e==`string`&&e.trim().length>0?e:D$1}function Dt$1(t){let n=t.trim();Pc$1(Tt$1,n.length>0?n:D$1);}var I$1=`ruledesk-web.downloads`,L$1=`ruledesk-web.downloads.position`,R$1=`ruledesk-web.downloads.running`,Ot$1=`1`,kt$1=5e3,At$1=`The API returned no files for this. Deleted posts have none.`,jt$1=A$3({label:T$2(),folder:T$2(),selected:N$3(D$3()),files:k$3(A$3({postId:D$3(),url:T$2(),rating:N$3(T$2()),score:N$3(E$3()),width:N$3(E$3()),height:N$3(E$3()),owner:N$3(T$2())}))}),Mt$1=A$3({next:D$3(),failed:k$3(D$3())}),Nt$1=`started in another tab or session`,Pt=`all`,z$1={phase:`idle`,label:``,selected:null,expected:null,total:0,done:0,failed:0,message:``},B$1=z$1,V$1=null,H$1=0,U$1=[],W$1=0,Ft=new Set;function G$1(e){B$1=e;for(let e of Ft)e(B$1);}function It(e){return new Promise(t=>{window.setTimeout(t,e);})}function K$2(e){try{e?window.sessionStorage.setItem(R$1,Ot$1):window.sessionStorage.removeItem(R$1);}catch(e){m$2.warn(`downloads: session storage unavailable`,e);}}function Lt(){try{return window.sessionStorage.getItem(R$1)===Ot$1}catch{return  false}}function Rt(){GM_setValue(L$1,{next:H$1,failed:U$1});}function zt(){GM_setValue(I$1,null),GM_setValue(L$1,null),K$2(false);}function q$2(e,t=``){return {phase:e,label:V$1?.label??B$1.label,selected:V$1===null?B$1.selected:V$1.selected??null,expected:null,total:V$1?.files.length??B$1.total,done:H$1-U$1.length,failed:U$1.length,message:t}}async function Bt(e,t){let n=`${t}/${Re$1(Et$1(),e)}`;try{return await k$1(e.url,n),!0}catch(t){m$2.warn(`downloads: file failed, retrying once`,e.postId,t);}await It(kt$1);try{return await k$1(e.url,n),!0}catch(t){return m$2.warn(`downloads: file failed`,e.postId,t),false}}async function Vt(){let e=V$1;if(e===null)return;W$1+=1;let t=W$1;for(K$2(true),G$1(q$2(`running`));H$1<e.files.length;){let n=e.files[H$1];if(n===void 0)break;let r=await Bt(n,e.folder);if(t!==W$1||(r||U$1.push(n.postId),H$1+=1,Rt(),G$1(q$2(`running`)),H$1<e.files.length&&(await It(400),t!==W$1)))return}zt(),G$1(q$2(`done`));}function Ht(){return B$1}function Ut(e){return Ft.add(e),()=>{Ft.delete(e);}}function Wt(){return B$1.phase===`collecting`||B$1.phase===`running`||B$1.phase===`paused`}async function Gt(e,t,n=Pt){let r=We$1();if(r===null||Wt())return;W$1+=1;let i=W$1;V$1=null,H$1=0,U$1=[];let a=n===`selection`&&t.kind===`ids`?t.ids.length:null,o=t.kind===`ids`?t.ids.length:null,s={...z$1,phase:`collecting`,label:e,selected:a,expected:o};G$1(s);let c;try{c=await wt$1(t,{credentials:r,onProgress:e=>{i===W$1&&G$1({...s,total:e});},isCancelled:()=>i!==W$1});}catch(t){if(i!==W$1)return;let n=t instanceof Error?t.message:String(t);m$2.warn(`downloads: collecting failed`,n),G$1({...z$1,phase:`error`,label:e,selected:a,message:n});return}i===W$1&&(c.length===0?G$1({...z$1,phase:`error`,label:e,selected:a,message:At$1}):(V$1={label:e,folder:Te$1(e),files:c,...a===null?{}:{selected:a}},GM_setValue(I$1,V$1),Rt(),await Vt()));}function Kt(){B$1.phase===`running`&&(W$1+=1,K$2(false),G$1(q$2(`paused`)));}function qt(){B$1.phase===`paused`&&V$1!==null&&Vt();}function Jt(){W$1+=1,V$1=null,H$1=0,U$1=[],zt(),G$1(z$1);}function Yt(){if(B$1.phase!==`idle`)return;let e=jt$1.safeParse(GM_getValue(I$1));if(!e.success)return;let t=Mt$1.safeParse(GM_getValue(L$1));V$1=e.data,H$1=t.success?Math.min(t.data.next,V$1.files.length):0,U$1=t.success?[...t.data.failed]:[],Lt()?Vt():G$1(q$2(`paused`,Nt$1));}var Xt=`span.thumb > a[id^="p"]`,Zt=/^p(\d+)$/,Qt=`:scope > img`;function $t(e,t,n,r=window.location.href){let i=[],a=new Set,o=n;for(let n of e.querySelectorAll(Xt)){let e=Zt.exec(n.id),s=n.querySelector(Qt);if(e?.[1]===void 0||!(s instanceof HTMLImageElement))continue;let c=Number(e[1]);if(a.has(c))continue;a.add(c);let l=``;try{l=new URL(s.getAttribute(`src`)??``,r).href;}catch{l=``;}i.push({id:c,tags:s.title.trim(),thumb:ut$4(l)?l:``,run:t,pos:o,cut:true}),o+=1;}return i}var en=1500,tn=[1e4,3e4,6e4],J$2=Na$1,nn=Pa$1,rn=`li#my-favorites-container a[href*="page=favorites"]`,an=`span.thumb`,on=`span.thumb a[id^="p"]`,sn=`#paginator`,cn=`a[name="lastpage"]`,ln=`a[name="next"]`,un=`a[onclick]`,dn=/^p(\d+)$/,fn=/[?&]pid=(\d+)/,pn=`https://rule34.xxx`,mn=36,hn=2,gn=`not logged in or menu not found`,_n=`unexpected page`; exports({ai:en,ah:J$2,ag:nn});function vn(e,t,n){return {status:`aborted`,total:e,page:t,pages:n}}function yn(e){return e instanceof DOMException&&e.name===`AbortError`||e instanceof Error&&e.name===`AbortError`}function Y$2(e){if(e.aborted)throw new DOMException(`Aborted`,`AbortError`)}function bn(e,t){return new Promise((n,r)=>{if(t.aborted){r(new DOMException(`Aborted`,`AbortError`));return}let i=setTimeout(()=>{t.removeEventListener(`abort`,a),t.aborted?r(new DOMException(`Aborted`,`AbortError`)):n();},e),a=()=>{clearTimeout(i),r(new DOMException(`Aborted`,`AbortError`));};t.addEventListener(`abort`,a,{once:true});})}function xn(e){if(e===null)return null;let t=e.trim();if(t.length===0)return null;let n=Number(t);return !Number.isFinite(n)||n<0?null:Math.trunc(n)}function Sn(e){let t=fn.exec(e)?.[1];return t===void 0?null:xn(t)}function Cn(e){try{return X$2(new DOMParser().parseFromString(e,`text/html`))}catch{return ``}}function X$2(e){let t=e.title.trim();return t.length<=80?t:t.slice(0,80)}function wn(e,t){return t.length===0?`HTTP ${String(e)}`:`HTTP ${String(e)}: ${t}`}function Tn(){let e=Math.random().toString(mn).slice(hn,12);return `tab-${String(Date.now())}-${e}`}function En(e){let t=e.querySelector(rn);if(!(t instanceof HTMLAnchorElement))return null;let n=t.getAttribute(`href`);if(n===null||n.length===0)return null;try{return xn(new URL(n,pn).searchParams.get(`id`))}catch{return null}}function Dn(e){return P$3(e)===`favorites`?xn(new URLSearchParams(e).get(`id`)):null}function On(e,t,n){let r=En(e);if(r!==null)return r;let i=Dn(t);return i===null?n!==void 0&&Number.isFinite(n)?Math.trunc(n):null:i}function kn(e,n){let r=new URLSearchParams;return r.set(ce$1,ue$1),r.set(`s`,de$1),r.set(`id`,String(e)),r.set(`pid`,String(n)),`${ie$1}?${r.toString()}`}function An(e){return Math.floor(e/50)+1}function jn(e){return Math.floor(e/50)+1}function Mn(e){let t=new Set,n=e.querySelectorAll(on);for(let e of n){let n=dn.exec(e.id)?.[1];if(n===void 0)continue;let r=Number(n);Number.isFinite(r)&&t.add(Math.trunc(r));}let r=e.querySelectorAll(un);for(let e of r){let n=e.getAttribute(`onclick`);if(n===null)continue;let r=fn$2(n);if(r===null)continue;let i=Number(r);Number.isFinite(i)&&t.add(Math.trunc(i));}return Array.from(t)}function Nn(e,t){let n=e.querySelector(cn);if(n instanceof HTMLAnchorElement){let e=n.getAttribute(`onclick`);return e===null||e.length===0?null:Sn(e)}return e.querySelector(ln)===null?t:null}function Pn(e){return e.querySelector(sn)!==null}function Fn(e){let t=e?.mode;if(t===J$2||t===nn)return t}function In(e,t){if(e.length===0)return  false;for(let n of e)if(!t.has(n))return  false;return  true}function Ln(e,t,n){return e?Fn(t)??nn:n??J$2}function Rn(e){let t={nextPid:e.nextPid,lastPid:e.lastPid,startedAt:e.startedAt,running:e.running,userId:e.userId,mode:e.mode,lock:{tabId:e.tabId,beatAt:Date.now()}};return e.finishedAt!==void 0&&(t.finishedAt=e.finishedAt),Es$1(t),t}async function zn(e,t){let n;try{n=await fetch(e,{method:`GET`,credentials:be$2,signal:t});}catch(t){if(yn(t))throw t;let n=t instanceof Error?t.message:`request failed`;return m$2.warn(`favorites sync: fetch failed`,e,t),{ok:false,status:0,titleSnippet:n.slice(0,80),message:n}}let i=await n.text(),a=Cn(i);if(!n.ok)return m$2.warn(`favorites sync: HTTP error`,n.status,e),{ok:false,status:n.status,titleSnippet:a,message:wn(n.status,a)};let o=new DOMParser().parseFromString(i,`text/html`);return Pn(o)?{ok:true,doc:o,status:n.status,titleSnippet:X$2(o)}:(m$2.warn(`favorites sync: missing paginator`,e),{ok:false,status:n.status,titleSnippet:X$2(o),message:wn(n.status,X$2(o))})}async function Bn(e,t){let n=null;for(let r=0;r<=tn.length;r+=1){if(Y$2(t),r>0){let n=tn[r-1];if(n===void 0)break;m$2.warn(`favorites sync: retrying after delay`,{attempt:r,delayMs:n,url:e}),await bn(n,t),Y$2(t);}let i=await zn(e,t);if(i.ok)return i;n=i;}return n===null?{ok:false,status:0,titleSnippet:``,message:wn(0,``)}:n}async function Vn(e){let{onProgress:t,signal:n}=e,r=e.tabId??Tn(),i=Ts$1(),a=On(document,window.location.search,i?.userId);if(a===null)return m$2.warn(`favorites sync: user id not found`),{status:`error`,message:gn};let o=i!==void 0&&i.finishedAt===void 0,s=Ln(o,i,e.mode),c=o?i.startedAt:new Date().toISOString(),l=Date.parse(c),ee=Number.isNaN(l)?Date.now():l,u=o?i.nextPid:0,d=o?i.lastPid:0,f=u,p=bs$1().size,h=An(u),g=jn(d),_=o&&i.nextPid>0,v=e=>{let t=e.nextPid??f;f=t,e.lastPid!==void 0&&(d=e.lastPid);let n={nextPid:t,lastPid:d,startedAt:c,userId:a,tabId:r,running:e.running,mode:s};e.finishedAt!==void 0&&(n.finishedAt=e.finishedAt),Rn(n);};try{for(Y$2(n),v({running:!0});;){Y$2(n);let e=await Bn(kn(a,u),n);if(!e.ok)return v({running:!0}),{status:`error`,message:e.message};let{doc:r}=e,i=r.querySelectorAll(an).length;if(h=An(u),i===0&&_){g=Math.max(g,h);let e=new Date().toISOString();return v({nextPid:u+50,running:!1,finishedAt:e}),t({page:h,pages:g,total:p}),m$2.info(`favorites sync: completed on empty trailing page`,{total:p,pages:g,pid:u,mode:s}),{status:`completed`,total:p,pages:g}}let o=Nn(r,u);if(o===null)return m$2.warn(`favorites sync: unexpected page`,{pid:u,cardCount:i}),v({running:!0}),{status:`error`,message:_n};if(d=o,g=jn(d),i===0)return m$2.warn(`favorites sync: unexpected empty page`,{pid:u,lastPid:d}),v({running:!0}),{status:`error`,message:_n};_=!0;let c=Mn(r);_$1($t(r,ee,u));let l=In(c,bs$1());ws$1(c),p=bs$1().size;let f=u+50;if(v({nextPid:f,lastPid:d,running:!0}),t({page:h,pages:g,total:p}),s===J$2&&l){let e=new Date().toISOString();return v({nextPid:f,lastPid:d,running:!1,finishedAt:e}),m$2.info(`favorites sync: incremental early stop`,{total:p,pages:g,page:h,pid:u}),{status:`completed`,total:p,pages:g}}if(u>=d){let e=new Date().toISOString();return v({nextPid:f,lastPid:d,running:!1,finishedAt:e}),m$2.info(`favorites sync: completed`,{total:p,pages:g,mode:s}),{status:`completed`,total:p,pages:g}}Y$2(n),await bn(en,n),Y$2(n),u=f,h=An(u);}}catch(e){return yn(e)?(v({running:false}),m$2.info(`favorites sync: aborted`,{pid:u,total:p,mode:s}),vn(p,h,g)):(m$2.error(`favorites sync: unexpected failure`,e),v({running:true}),{status:`error`,message:e instanceof Error?e.message:`unexpected error`})}}var Hn=`stats-history`,Un=`last-backup`,Wn=864e5,Gn=10;function Kn(e){return typeof e!=`object`||!e?false:`day`in e&&typeof e.day==`string`&&`favorites`in e&&typeof e.favorites==`number`&&`followed`in e&&typeof e.followed==`number`&&`collections`in e&&typeof e.collections==`number`}function qn(e){return new Date(e).toISOString().slice(0,Gn)}function Jn(){let e=Nc$1(Hn);return Array.isArray(e)?e.filter(Kn):[]}function Yn(e,t){return [...e.filter(e=>e.day!==t.day),t].slice(-400)}function Xn(t=Date.now()){let n=Jn(),r=qn(t);if(n.some(e=>e.day===r))return;let i=G$3();Pc$1(Hn,Yn(n,{day:r,favorites:bs$1().size,followed:i.artists.length,collections:i.collections.length}));}function Zn(){let e=Nc$1(Un),t=typeof e==`string`?Date.parse(e):NaN;return Number.isFinite(t)?t:null}function Qn(t=Date.now()){Pc$1(Un,new Date(t).toISOString());}function $n(e,t){return Math.max(0,Math.floor((t-e)/Wn))}function er(e){return `${String(e)} ${e===1?`day`:`days`}`}function tr(e,t,n,r){if(e!==null){let t=$n(e,r),i=t===0?`Last backup: today.`:`Last backup: ${er(t)} ago.`;return {due:n&&t>30,text:i}}let i=t===null?NaN:Date.parse(t),a=Number.isFinite(i)?$n(i,r):0;return {due:n&&a>=14,text:`No backup yet. Export keeps your collections and follows if the browser's data is lost.`}}function nr(e=Date.now()){let t=G$3(),n=t.artists.length>0||t.collections.length>0;return tr(Zn(),Jn()[0]?.day??null,n,e)}var rr=`content`,ir=0,Z$2=null,ar=false;function or(e,t){return !(t!==null&&t.contains(e))}function sr(){let e=document.getElementById(rr),t=document.querySelectorAll(`a`);for(let n of t){if(!(n instanceof HTMLAnchorElement)||(n.textContent?.trim()??``)!==`Posts`)continue;let t=n.closest(`li`);if(t!==null&&t instanceof HTMLLIElement&&or(t,e))return t}return null}function Q$2(){let e=document.querySelector(it$3);return e instanceof HTMLUListElement?e:null}function cr(){let e=document.querySelector(rt$3);return e instanceof HTMLElement?e:null}function lr(e){if(!Number.isFinite(e)||e<=0)return;let t=Math.trunc(e),n=Ts$1();if(n?.userId===t)return;if(n!==void 0){let e={...n,userId:t};Es$1(e);return}let r=new Date().toISOString();Es$1({nextPid:ir,lastPid:ir,startedAt:r,finishedAt:r,userId:t});}function ur(e){let n=new URLSearchParams;return n.set(ce$1,ue$1),n.set(`s`,de$1),n.set(`id`,String(e)),`${ie$1}?${n.toString()}`}function dr(e=document,t=window.location.search){let n=On(e,t,Ts$1()?.userId);return n===null||n<=0?null:(lr(n),ur(n))}function $$2(e,t,n){let r=document.getElementById(e);if(r instanceof HTMLLIElement){let e=r.querySelector(`a`);return e instanceof HTMLAnchorElement&&(e.textContent=t,e.href=n),r}let i=document.createElement(`li`);i.id=e;let a=document.createElement(`a`);return a.textContent=t,a.href=n,i.append(a),i}function fr(){let e=document.getElementById(ct$3);e instanceof HTMLLIElement&&(e.hidden=true);}function pr(){let e=document.getElementById(ut$3);return e instanceof HTMLLIElement?e:sr()}function mr(){if(cr()===null)return;let e=Q$2();if(e===null)return;let t=pr();if(t===null)return;let n=$$2(ot$3.collections,st$3.collections,Ke$3),r=$$2(ot$3.following,st$3.following,qe$3);n.parentElement===e?n.previousElementSibling!==t&&t.after(n):t.after(n),r.previousElementSibling!==n&&n.after(r);let a=dr(),s=document.getElementById(ot$3.favorites);if(a===null)s!==null&&s.remove();else {let e=$$2(ot$3.favorites,st$3.favorites,a);e.previousElementSibling!==r&&r.after(e);}let c=document.getElementById(ot$3.stats);if(Oc$1(`stats-menu`,true)){let e=$$2(ot$3.stats,st$3.stats,Ye$3),t=document.getElementById(ot$3.favorites)??r;e.previousElementSibling!==t&&t.after(e);}else c!==null&&c.remove();fr();let u=$$2(ot$3.settings,st$3.settings,Je$3);(u.parentElement!==e||e.lastElementChild!==u)&&e.append(u),Uo$1(e),gr();}var hr=`RuleDesk: time to export a backup (Data)`;function gr(){let e=document.getElementById(ot$3.settings);if(e===null)return;let t=nr().due;e.classList.toggle(mo$1,t);let n=e.querySelector(`a`);n!==null&&(n.title=t?hr:st$3.settings);}function _r(e){return e===`collections`?ot$3.collections:e===`following`?ot$3.following:e===`stats`?ot$3.stats:ot$3.settings}function vr(){if(ar)return;ar=true;let e=Q$2();if(e===null){Z$2=null;return}let t=e.querySelector(`li.${at$3}`);Z$2=t instanceof HTMLLIElement&&!Object.values(ot$3).includes(t.id)?t:null;}function yr(){for(let e of Object.values(ot$3)){let t=document.getElementById(e);t instanceof HTMLLIElement&&t.classList.remove(at$3);}}function br(e){vr();let t=Q$2();if(t!==null)for(let e of t.querySelectorAll(`li.${at$3}`))e.classList.remove(at$3);yr();let n=document.getElementById(_r(e));n instanceof HTMLLIElement&&n.classList.add(at$3);}function xr(){yr(),Z$2!==null&&Z$2.isConnected&&Z$2.classList.add(at$3),Z$2=null,ar=false;let e=Q$2();e!==null&&Lo$1(e);}
var h=`ruledesk-web.settings-focus`,xe=exports("x",`favorites`);function g(e){return `${Je$3}/${encodeURIComponent(e)}`}function Se(e){let t=`${Je$3}/`;if(!e.startsWith(t))return null;let n=e.slice(t.length).split(`/`)[0]??``;if(n.length===0)return null;try{return decodeURIComponent(n)}catch{return n}}function Ce(e){try{window.sessionStorage.setItem(h,e);}catch{}}function we(){try{let e=window.sessionStorage.getItem(h);return window.sessionStorage.removeItem(h),e}catch{return null}}function _(e){window.location.hash=g(e);}var v=`g`,y=`tag-types`,Te=3e3,b={artist:`a`,character:`c`,copyright:`p`,metadata:`m`},Ee=`:`;function De(e){if(e===v)return `general`;for(let t of [`artist`,`character`,`copyright`,`metadata`])if(b[t]===e)return t;return null}function Oe(e){return e===`artist`||e===`character`||e===`copyright`||e===`metadata`?e:null}function x(e){return e.trim().toLowerCase().replaceAll(` `,`_`)}var S=null;function C(){if(S!==null)return S;let e=new Map,t=null;try{t=Nc$1(y);}catch{}if(Array.isArray(t))for(let n of t){if(typeof n!=`string`)continue;let t=n.indexOf(Ee),r=t>0?De(n.slice(0,t)):null;r!==null&&e.set(n.slice(t+1),r);}return S=e,e}function ke(e){let t=C().get(x(e));return t===void 0||t===`general`?null:t}function Ae(e){return C().has(x(e))}function w(t,n={}){let r=C(),i=false;for(let[e,a]of t){let t=(a===void 0?null:Oe(a))??(n.general===true&&a!==void 0?`general`:null),o=x(e);t!==null&&o.length!==0&&r.get(o)!==t&&(r.delete(o),r.set(o,t),i=true);}if(i){for(;r.size>Te;){let e=r.keys().next();if(e.done===true)break;r.delete(e.value);}try{Pc$1(y,[...r].map(([e,t])=>`${t===`general`?v:b[t]}${Ee}${e}`));}catch{}}}var je=`/public/autocomplete.php`,Me=exports("aD",`artist`),Ne=429,T=`AbortError`,Pe=A$3({label:T$2(),value:T$2(),type:N$3(Zi$1(T$2()))}),Fe=k$3(Pe);function Ie(e){let t=new URLSearchParams;return t.set(`q`,e),`${re$1}${je}?${t.toString()}`}function E(e){return e instanceof DOMException&&e.name===T?true:typeof e!=`object`||!e||!(`name`in e)?false:e.name===T}function Le(e){w(e.map(e=>[e.value,e.type??void 0]));let t=[];for(let n of e){let e=n.type===null||n.type===void 0?void 0:n.type;e===void 0?t.push({label:n.label,value:n.value}):t.push({label:n.label,value:n.value,type:e});}return t}function Re(e,t){let n=[],r=[];for(let i of e)i.type===t?n.push(i):r.push(i);return [...n,...r]}async function ze(e,t){return await D(e,t)??[]}async function D(e,t){let n=e.trim();if(n.length<2)return [];let i;try{let e={method:`GET`,credentials:be$2};t!==void 0&&(e.signal=t),i=await fetch(Ie(n),e);}catch(e){return E(e)||t?.aborted===true||m$2.error(`autocomplete: fetch failed`,e),null}if(i.status===Ne)return m$2.warn(`autocomplete: rate limited`,i.status),null;if(!i.ok)return m$2.warn(`autocomplete: HTTP error`,i.status),null;let a;try{a=await i.json();}catch(e){return E(e)||t?.aborted===true||m$2.error(`autocomplete: invalid JSON`,e),null}let o=Fe.safeParse(a);return o.success?Le(o.data):(m$2.error(`autocomplete: schema mismatch`,o.error),null)}function O(e={}){let t=null,n=null,r=e.preferType,i=()=>{t!==null&&(clearTimeout(t),t=null),n!==null&&(n.abort(),n=null);};return {query:(e,a)=>{i();let o=e.trim();o.length<2?a([]):t=setTimeout(()=>{t=null;let e=new AbortController;n=e,ze(o,e.signal).then(t=>{e.signal.aborted||(n===e&&(n=null),a(r===void 0?t:Re(t,r)));});},300);},cancel:i}}var Be=864e5,Ve=`;`,k=`=`;function A(){let e=`${Le$3}${k}`;for(let t of document.cookie.split(Ve)){let n=t.trim();if(!n.startsWith(e))continue;let r=n.slice(e.length);if(r===`1`)return  true;if(r===`0`)return  false}return null}function j(e){let t=new Date(Date.now()+365*Be);document.cookie=[`${Le$3}${k}${e?`1`:`0`}`,`expires=${t.toUTCString()}`,`path=/`].join(`; `);}var M=`posts`,N=`feed`,P=`following`,F=`collections`,He=[M,N,P,F,nn$2],Ue=`ai_generated`,I=`all`,L=tn$2,R=`show`,z=`hide`,We=`AI posts`,B=[{value:R,label:`Show`},{value:z,label:`Hide`}]; exports({aG:P,aq:F});function V(e){return typeof e==`object`&&!!e&&!Array.isArray(e)}function H(){let e=Nc$1(en$2),t={};if(!V(e))return {all:false,hide:t};let n=e[L];if(V(n))for(let e of He){let r=n[e];typeof r==`boolean`&&(t[e]=r);}return {all:e[I]===true,hide:t}}function U(t){Pc$1(en$2,{[I]:t.all,[L]:t.hide});}function W(){return H().all}function Ge(e){U({...H(),all:e});}function Ke(e){return H().hide[e]??false}function qe(){let e=H();e.hide.posts===void 0&&U({...e,hide:{...e.hide,[M]:A()===true}});}function G(e){return W()||Ke(e)}function K$1(e,t){let n=H();U({...n,hide:{...n.hide,[e]:t}});}function q$1(e){return G(e)?z:R}var Je=`sort:`,Ye=`score:`,Xe=new Set([`video`,`-video`]);function J$1(e){return e.trim().toLowerCase().split(/\s+/).filter(e=>e.length>0&&!e.startsWith(Je)&&!e.startsWith(Ye)&&!Xe.has(e))}function Ze(e,t){if(e.length!==t.length)return  false;let n=new Set(e);return t.every(e=>n.has(e))}function Qe(e,t,r){if(Pt$2(t)!==null)return F;let i=J$1(e);if(i.length===0)return M;let a=i.join(` `),s=[...r.artistTags];if(bo$1(a,s)||xo$1(a,s)||ho$1(a,s,r.groupSize)>=0)return N;let c=i[0];if(i.length===1&&c!==void 0){let e=new Set;for(let t of s){let n=R$3(t);n!==null&&e.add(n);}if(e.has(c))return P}for(let e of r.savedQueries){let t=J$1(e);if(t.length>0&&Ze(t,i))return F}return M}function $e(){let e=Us$1();return {artistTags:e.artists.map(e=>e.tag),groupSize:Fc$1(),savedQueries:e.collections.filter(e=>e.kind===Te$3).map(e=>ao$1(e.tags))}}function Y$1(e){return P$3(e.search)===`list`?Qe(e.searchParams.get(`tags`)??``,e.hash,$e()):null}function et(){return Y$1(new URL(window.location.href))}function X$1(e){if(e===`favorites`)return  false;try{let t=G(e),n=A();return n===t||n===null&&!t?!1:(j(t),!0)}catch(e){return m$2.warn(`ai-scope: the site's AI switch was not set`,e),false}}async function tt(e,t){let n=A(),r=X$1(e);try{return await t()}finally{r&&j(n===true);}}var nt=`rdw-ai-toggle`,rt=`rdw-ai-toggle__label`,Z$1=`rdw-ai-note`,it=`rdw-ai-note__link`,at=`AI`,ot=`AI posts`,st=`Hidden everywhere.`,ct=`Change in Settings`,lt=`
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
`;function ut(e){return K$3(A$2,{children:[K$3(`style`,{children:lt}),K$3(`p`,{className:Z$1,"data-inline":e.inline===true?`true`:void 0,children:[st,` `,K$3(`button`,{type:`button`,className:`${it} rdw-kit-focusable`,onClick:()=>{_(`ai`);},children:ct})]})]})}function dt(e){let t=W(),[n,r]=z$2(()=>q$1(e.scope));return K$3(A$2,{children:[K$3(`style`,{children:lt}),K$3(`span`,{className:nt,children:[K$3(`span`,{className:rt,"aria-hidden":`true`,children:at}),K$3(Dr,{label:ot,options:B,value:t?z:n,disabled:t,onChange:t=>{(t===`show`||t===`hide`)&&(K$1(e.scope,t===z),X$1(e.scope),r(t));}})]}),t?K$3(ut,{inline:true}):null]})}var ft=`?`,pt=/^\d+$/,mt=`-`,ht=`:`,gt=[`(`,`)`,`~`],_t=/\D/g,vt=/\s+/,yt=`score:`,bt=`rating:`;function xt(e,t){let n=e.querySelector(an$2.imageList);if(n===null)return [];let r=[],i=n.querySelectorAll(`${an$2.thumb} ${an$2.previewImage}`);for(let e of i){let n=e.getAttribute(`src`);if(n!==null&&n.trim().length!==0&&(r.push(n.trim()),r.length===t))break}return r}function St(e){let t=0;for(let n of e.querySelectorAll(an$2.thumb)){let e=ln$2(n),r=e===null?NaN:Number(e);Number.isFinite(r)&&r>t&&(t=r);}return t}function Ct(e){let t=e.querySelector(an$2.previewImage),n=t?.getAttribute(`title`)?.trim()??``,r=n.length>0?n:t?.getAttribute(`alt`)?.trim()??``,i=[];for(let e of r.split(vt)){let t=e.toLowerCase();e.length===0||t.startsWith(yt)||t.startsWith(bt)||i.push(t);}return i}function wt(e){let t=e.getAttribute(`href`);if(t===null)return null;let n=t.slice(t.indexOf(ft)+1),r=new URLSearchParams(n).get(`pid`);return r===null||!pt.test(r)?null:Number(r)}function Tt(e){let t=Mo$1(e).split(` `),n=t[0];return t.length!==1||n===void 0||n.length===0||n.startsWith(mt)||n.includes(ht)||gt.includes(n)?null:n.toLowerCase()}function Et(e,t){for(let n of e.querySelectorAll(`a[href]`)){let e=n.getAttribute(`href`)??``,r=e.indexOf(ft);if(r<0)continue;let i=new URLSearchParams(e.slice(r+1)).get(le$1);if(i!==null&&i.trim().toLowerCase()===t)return  true}return  false}function Dt(e,t){let n=Tt(t);if(n===null)return null;for(let t of e.querySelectorAll(an$2.tagSidebarRow)){if(!Et(t,n))continue;let e=(t.querySelector(an$2.tagCount)?.textContent??``).replace(_t,``);return e.length===0?null:{value:Number(e),exact:true}}return null}function Ot(e,t){let n=Dt(e,t);if(n!==null)return n;let r=e.querySelector(an$2.paginationLastPage);if(r!==null){let e=wt(r);if(e!==null)return {value:e,exact:false}}let i=null;for(let t of e.querySelectorAll(an$2.paginationPageLink)){let e=wt(t);e!==null&&(i===null||e>i)&&(i=e);}if(i!==null)return {value:i,exact:false};let a=e.querySelector(an$2.imageList);return a===null?null:{value:a.querySelectorAll(an$2.thumb).length,exact:true}}var kt=`:`,At=/\s$/,jt=/(\S+)$/,Mt=[`(`,`)`,`~`];function Q$1(e){if(e.length===0||At.test(e))return null;let t=jt.exec(e),n=t?.[1];if(t===null||n===void 0||Mt.includes(n)||n.includes(kt))return null;let r=n.startsWith(`-`)&&n.length>1?`-`:``,i=n.slice(r.length);return i===`-`?null:{head:e.slice(0,t.index),prefix:r,stem:i}}function $$1(e,t){let n=Q$1(e);return n===null?`${e}${t} `:`${n.head}${n.prefix}${t} `}function Nt(e){let t=V$2(O()),[n,r]=z$2([]);B$2(()=>{let e=t.current;return ()=>{e.cancel();}},[]);let i=()=>{t.current.cancel(),r([]);},a=n=>{e.onChange(n);let a=Q$1(n);a===null?i():t.current.query(a.stem,r);},o=t=>{e.onChange($$1(e.value,t.value)),i();},s={...e.label===void 0?{}:{label:e.label},...e.placeholder===void 0?{}:{placeholder:e.placeholder},...e.id===void 0?{}:{id:e.id},...e.className===void 0?{}:{className:e.className},...e[`aria-label`]===void 0?{}:{"aria-label":e[`aria-label`]}};return K$3(at$2,{...s,value:e.value,suggestions:n,replaceOnSelect:false,onChange:a,onSelect:o})}var Ui=`;`,Wi=`=`,Gi=/[, ]|%20+/g,Ki=`user:`,qi=`rating:`,Ji=864e5,Yi=365,Xi=` `,Zi=new Set;function Qi(e){return Zi.add(e),()=>{Zi.delete(e);}}function $i(e){let t=document.cookie.split(Ui),n=`${e}${Wi}`;for(let e of t){let t=e.trim();if(t.startsWith(n))return t.slice(n.length)}return null}function ea(e){let t=new Set,n=[];for(let r of e){let e=r.trim().toLowerCase().replaceAll(` `,`_`);e.length===0||t.has(e)||(t.add(e),n.push(e));}return n}function ta(e){return e.length===0?``:encodeURIComponent(encodeURIComponent(e.join(Xi)))}function na(e,t){document.cookie=[`${je$3}${Wi}${e}`,`expires=${t.toUTCString()}`,`path=/`].join(`; `);}function ra(){let e=$i(je$3);if(e===null||e.length===0)return [];let t;try{t=decodeURIComponent(decodeURI(e));}catch{return []}let n=[];for(let e of t.split(Gi)){let t=e.trim().toLowerCase();t.length!==0&&n.push(t);}return n}function ia(e){let t=ea(e),n=new Date(Date.now()+5*Yi*Ji);na(ta(t),n);for(let e of Zi)e(t);}function aa(e,t,n,r){if(r.length===0)return  false;let i=new Set;for(let t of e){let e=t.trim().toLowerCase();e.length>0&&i.add(e);}let a=n.trim().toLowerCase();for(let e of r)if(!e.startsWith(Ki)){if(e.startsWith(qi)){let t=e.slice(7);if(t.length>0&&t===a)return  true}else if(i.has(e))return  true}return  false}var oa=`blacklist-hide`,sa=`Hide blacklisted posts`,ca=[`list`],la=Kt$2(oa),ua=`rdw-blacklisted`,da=`score:`,fa=`rating:`,pa=/\s+/,ma=`
body.${la} span.thumb.${ua} {
  display: none !important;
}
`.trim(),ha,ga;function _a(e){let t=[];for(let n of e.trim().split(pa)){if(n.length===0)continue;let e=n.toLowerCase();e.startsWith(da)||e.startsWith(fa)||t.push(n);}return t}function va(e){for(let t of e.trim().split(pa))if(t.length!==0&&t.toLowerCase().startsWith(fa))return t.slice(7);return ``}function ya(e,t){if(!(e instanceof HTMLElement))return;let n=e.querySelector(an$2.previewImage),r=n?.getAttribute(`alt`)??``,i=n?.getAttribute(`title`)??``,a=aa(_a(r),0,va(i),t);e.classList.toggle(ua,a);}function ba(e,t=ra()){let n=e.querySelectorAll(an$2.thumb);for(let e of n)ya(e,t);}function xa(){ha===void 0&&(ha=ot$4(e=>{ba(e);})),ga===void 0&&(ga=Qi(e=>{ba(document,e);}));}function Sa(e){e.pageKind===`list`&&(ba(document),xa());}var Ca={id:oa,label:sa,pages:[...ca],defaultEnabled:true,cssOnly:true,css:ma,mount:Sa},wa=`cdn-fallback`,Ta=`Retry a failed post image on other servers`,Ea=[`post`],Da=`img#image`,Oa=`error`,ka=[`wimg.rule34.xxx`,`img.rule34.xxx`,`us.rule34.xxx`,`api-cdn.rule34.xxx`];function Aa(e,t){let n;try{n=new URL(e,window.location.href);}catch{return null}if(!ka.includes(n.hostname))return null;for(let e of ka)if(!(e===n.hostname||t.has(e)))return n.hostname=e,n.href;return null}function ja(e){try{return new URL(e,window.location.href).hostname}catch{return ``}}function Ma(e){let t=document.querySelector(Da);if(!(t instanceof HTMLImageElement))return;let n=new Set;t.addEventListener(Oa,()=>{let e=t.getAttribute(`src`)??``;n.add(ja(e));let r=Aa(e,n);r!==null&&t.setAttribute(`src`,r);});}var Na={id:wa,label:Ta,pages:[...Ea],defaultEnabled:true,css:``,mount:Ma},Pa=`mousedown`,Fa=`click`,Ia=`dragstart`,La=0,Ra=0;function za(e){let t=t=>{let n=t.target;return n instanceof Element?e(n):null},n=e=>{if(e.button!==La)return;let n=t(e);n!==null&&(e.preventDefault(),e.stopPropagation(),n());},r=e=>{let n=t(e);n!==null&&(e.preventDefault(),e.stopPropagation(),e.detail===Ra&&n());},i=e=>{t(e)!==null&&e.preventDefault();};return document.addEventListener(Pa,n,true),document.addEventListener(Fa,r,true),document.addEventListener(Ia,i,true),()=>{document.removeEventListener(Pa,n,true),document.removeEventListener(Fa,r,true),document.removeEventListener(Ia,i,true);}}var Ba=`rdw-dl-select`,Va=`rdw-dl-selected`,Ha=`
body.${Ba} ${an$2.thumb} {
  cursor: pointer;
}
/* While posts are being marked a thumbnail does not lift under the pointer
   ("Motion" in the settings): lifted, it stands out of the frame of a marked post. */
body.${Ba} ${an$2.thumb}:hover img {
  transform: none !important;
}
body.${Ba} ${an$2.thumb}.${Va} {
  outline: 3px solid var(--rdw-accent);
  outline-offset: -3px;
  border-radius: var(--rdw-radius-m);
}
/* A tick as well: the outline alone would mark a post by colour only. */
body.${Ba} ${an$2.thumb}.${Va} {
  position: relative;
}
body.${Ba} ${an$2.thumb}.${Va}::after {
  content: "✓";
  position: absolute;
  left: 6px;
  bottom: 6px;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: var(--rdw-accent);
  color: var(--rdw-surface);
  font: 700 12px/1 var(--rdw-font);
  pointer-events: none;
}
`.trim(),Ua=`rdw-grid-select-style`;function Wa(){if(document.getElementById(Ua)!==null)return;let e=document.createElement(`style`);e.id=Ua,e.textContent=Ha,document.head.append(e);}var Ga=null;function Ka(){let e=[];for(let t of document.querySelectorAll(`${an$2.thumb}.${Va}`)){let n=ln$2(t),r=n===null?NaN:Number(n);Number.isFinite(r)&&e.push(r);}return e}function qa(e){let t=e.closest(an$2.thumb);return t===null||e.closest(`button`)!==null?null:()=>{t.classList.toggle(Va),Ga?.(Ka().length);}}var Ja=null;function Ya(e){let t=[];for(let n of document.querySelectorAll(`${an$2.thumb}.${Va}`)){let r=ln$2(n),i=r===null?NaN:Number(r);r!==null&&Number.isFinite(i)&&n instanceof HTMLElement&&t.push({id:i,thumbUrl:e(n,r)});}return t}function Xa(){for(let e of document.querySelectorAll(an$2.thumb))ln$2(e)!==null&&e.classList.add(Va);Ga?.(Ka().length);}function Za(){for(let e of document.querySelectorAll(`.${Va}`))e.classList.remove(Va);Ga?.(0);}function Qa(){return document.body.classList.contains(Ba)}function $a(e){Qa()||(Wa(),Ga=e,document.body.classList.add(Ba),Ja=za(qa));}function eo(){Ja?.(),Ja=null,document.body.classList.remove(Ba);for(let e of document.querySelectorAll(`.${Va}`))e.classList.remove(Va);Ga=null;}var to=Qe$1,no=`Download manager`,ro=[`list`,`post`,`favorites`,`other`],io=tt$3,ao=`rdw-downloads-head`,oo=`rdw-downloads-title`,so=`rdw-downloads-text`,co=`rdw-downloads-actions`,lo=`rdw-downloads-minimised`,uo=`rdw-downloads-chip`,fo=`rdw-progress__label`,po=`rdw-progress__fill--indeterminate`,mo=`ruledesk-web.downloads.minimised`,ho=`1`,go=280,_o=16,vo=30,yo=14,bo=100,xo=`Downloading`,So=`Downloaded`,Co=`Couldn’t download`,wo=`“`,To=`”`,Eo=`selected post`,Do=`selected posts`,Oo=`Looking up files…`,ko=`found`,Ao=`of`,jo=`file`,Mo=`files`,No=`Paused`,Po=`Finished`,Fo=`failed`,Io=` · `,Lo=`Looking up…`,Ro=`Done`,zo=`Failed`,Bo=`Pause`,Vo=`Resume`,Ho=`Cancel`,Uo=`Close`,Wo=`Minimize`,Go=`Show the download`,Ko=`downloads: session storage unavailable`,qo=`
#${io} {
  position: fixed;
  right: ${String(_o)}px;
  bottom: ${String(_o)}px;
  z-index: ${String(vo)};
  width: ${String(go)}px;
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
#${io}:empty {
  display: none;
}
#${io}.${lo} {
  width: auto;
  padding: 0;
  background: transparent;
  border: 0;
  box-shadow: none;
}
#${io} .${uo} {
  box-shadow: var(--rdw-shadow-2);
  font-variant-numeric: tabular-nums;
}
#${io} .${ao} {
  display: flex;
  align-items: center;
  gap: 8px;
}
#${io} .${oo} {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
#${io} .${so} {
  margin: 0;
  color: var(--rdw-muted);
  word-break: break-word;
}
#${io} .${fo} {
  font: 12.5px/1.4 var(--rdw-font);
  letter-spacing: 0;
  text-transform: none;
  word-break: break-word;
}
#${io} .${co} {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
@media (prefers-reduced-motion: reduce) {
  #${io} .${po} {
    animation: none;
  }
}
`.trim();function Jo(){try{return window.sessionStorage.getItem(mo)===ho}catch{return  false}}function Yo(e){try{e?window.sessionStorage.setItem(mo,ho):window.sessionStorage.removeItem(mo);}catch(e){m$2.warn(Ko,e);}}function Xo(e){let t=e.phase===`done`?So:e.phase===`error`?Co:xo;if(e.selected!==null){let n=e.selected===1?Eo:Do;return `${t} ${String(e.selected)} ${n}`}return `${t} ${wo}${e.label}${To}`}function Zo(e){let t=e.total===1?jo:Mo,n=`${String(e.done)} ${Ao} ${String(e.total)} ${t}`;return e.failed>0?`${n}, ${String(e.failed)} ${Fo}`:n}function Qo(e){return e.phase===`collecting`?e.expected===null?`${Oo} ${String(e.total)} ${ko}`:`${Oo} ${String(e.total)} ${Ao} ${String(e.expected)}`:e.phase===`error`?e.message:e.phase===`paused`?`${e.message.length>0?`${No}: ${e.message}`:No}${Io}${Zo(e)}`:e.phase===`done`?`${Po}${Io}${Zo(e)}`:Zo(e)}function $o(e){return e.total===0?0:(e.done+e.failed)/e.total}function es(e){if(e.phase===`collecting`)return Lo;if(e.phase===`error`)return zo;if(e.phase===`done`)return Ro;let t=`${String(Math.round($o(e)*bo))}%`;return e.phase===`paused`?`${No}${Io}${t}`:t}function ts(e){let{host:t}=e,[n,r]=z$2(()=>Ht()),[i,a]=z$2(Jo);B$2(()=>{let e=Ut(r);return r(Ht()),e},[]);let o=n.phase===`idle`;B$2(()=>{t.classList.toggle(lo,i&&!o);},[t,i,o]);let s=e=>{Yo(e),a(e);};if(o)return null;let c=Xo(n),l=Qo(n);if(i)return K$3(q$3,{variant:`secondary`,size:`s`,className:uo,title:`${Go}: ${c}${Io}${l}`,onClick:()=>{s(false);},children:es(n)});let u=n.phase===`done`||n.phase===`error`;return K$3(A$2,{children:[K$3(`div`,{className:ao,children:[K$3(`p`,{className:oo,title:c,children:c}),K$3(Tn$1,{label:Wo,onClick:()=>{s(true);},children:K$3(mt$2,{size:yo})})]}),n.phase===`collecting`?n.expected===null?K$3(Un$1,{waiting:true,label:l}):K$3(Un$1,{value:n.expected===0?0:n.total/n.expected,label:l}):n.phase===`error`?K$3(`p`,{className:so,role:`alert`,children:l}):K$3(Un$1,{value:$o(n),label:l}),K$3(`div`,{className:co,children:[n.phase===`running`?K$3(q$3,{variant:`secondary`,size:`s`,onClick:Kt,children:Bo}):null,n.phase===`paused`?K$3(q$3,{variant:`primary`,size:`s`,onClick:qt,children:Vo}):null,K$3(q$3,{variant:`secondary`,size:`s`,onClick:Jt,children:u?Uo:Ho})]})]})}function ns(e){if(document.getElementById(io)!==null)return;let t=document.createElement(`div`);t.id=io,document.body.append(t),ve$1(K$3(ts,{host:t}),t),Yt();}var rs={id:to,label:no,pages:[...ro],defaultEnabled:true,css:`${qo}
${Ha}`,mount:ns},is=exports("i",`tag-kind-lookup`),as=1100,os=`general`,ss=`:`,cs=`*`,ls=[],us=false,ds=0,fs=new Set,ps=new Set;function ms(e){return ps.add(e),()=>{ps.delete(e);}}function hs(e){return new Promise(t=>{window.setTimeout(t,e);})}async function gs(){us=true;for(let e=ls.shift();e!==void 0;e=ls.shift()){let t=await D(e);if(t===null){for(let t of [e,...ls])fs.delete(t);ls=[];break}let n=e,r=t.find(e=>x(e.value)===n);w([[n,r?.type??os]],{general:true});for(let e of ps)e();ls.length>0&&await hs(as);}us=false;}function _s(e){try{if(!Oc$1(`tag-kind-lookup`,!0))return}catch{return}for(let t of e){let e=x(t);e.length<2||e.includes(ss)||e.includes(cs)||fs.has(e)||Ae(e)||ds>=30||(fs.add(e),ds+=1,ls.push(e));}!us&&ls.length>0&&gs();}function vs(e){let t=x(e);if(t.length===0||t.includes(`:`))return `default`;let n=ke(t);if(n!==null)return n;try{let e=G$3().artists.find(e=>x(e.tag)===t);return e===void 0?`default`:Wc$1(e)}catch{return `default`}}var ys=` `;function bs(e){let[,t]=z$2(0),n=e.join(ys);B$2(()=>{_s((n.length===0?[]:n.split(ys)).filter(e=>vs(e)==="default"));},[n]),B$2(()=>ms(()=>{t(e=>e+1);}),[]);}function xs(e){let t=new URLSearchParams;return t.set(`id`,e),`${re$1}${me$1}?${t.toString()}`}function Ss(e){let t=new URLSearchParams;return t.set(ge$1,ve$2),t.set(`s`,ye$2),t.set(`id`,e),t.set(_e$2,`up`),`${re$1}${he$1}?${t.toString()}`}function Cs(e){let t=new URLSearchParams;return t.set(ce$1,ue$1),t.set(`s`,fe$1),t.set(`id`,e),t.set(pe$1,`0`),`${re$1}${ie$1}?${t.toString()}`}async function ws(e){let t=await fetch(e,{method:`GET`,credentials:be$2});if(!t.ok)throw Error(`HTTP ${String(t.status)}`);return (await t.text()).trim()}function Ts(e){if(e.length===0)return;let t=Number(e);if(Number.isFinite(t))return t}async function Es(e){let t;try{t=await ws(xs(e));}catch(t){return m$2.warn(`addfav request failed`,e,t),{status:`error`}}if(t===`1`)return {status:`already`};if(t===`2`)return {status:`not_logged_in`};if(t!==`3`)return m$2.warn(`Unexpected addfav response`,e,t),{status:`error`};try{let t=await Ds(e);return t===null?{status:`added`}:{status:`added`,score:t}}catch(t){return m$2.warn(`vote request failed after addfav`,e,t),{status:`added`}}}async function Ds(e){try{let t=Ts(await ws(Ss(e)));return t===void 0?null:t}catch(t){return m$2.warn(`vote request failed`,e,t),null}}async function Os(e,t={}){try{let n={method:`GET`,credentials:be$2};t.signal!==void 0&&(n.signal=t.signal);let r=await fetch(Cs(e),n);return r.ok?{status:`removed`}:(m$2.warn(`remove favorite HTTP error`,e,r.status),{status:`error`})}catch(n){return t.signal?.aborted===true||n instanceof DOMException&&n.name===`AbortError`||n instanceof Error&&n.name===`AbortError`||m$2.warn(`remove favorite request failed`,e,n),{status:`error`}}}var ks=/\s+/,As=1,js=`whole`,Ms=`unknown`;function Ns(e){return e.trim().split(ks).filter(e=>e.length>0)}function Ps(e,t,n){let r=e.get(t);r===void 0?e.set(t,new Set([n])):r.add(n);}function Fs(e){if(e?.size!==1)return null;for(let t of e)return t;return null}function Is(e,t,n,r){if(r===false)return {tag:e,state:js};if(n)return {tag:e,state:t===void 0?js:Ms};let i=Fs(t);return i===null?{tag:e,state:`cut`}:{tag:i,state:js}}function Ls(e){let t=e.map(e=>Ns(e.tags)),n=new Set,r=new Map,i=new Map,a=e=>{n.has(e)||(n.add(e),e.length>As&&(Ps(r,e.slice(As),e),Ps(i,e.slice(0,-1),e)));};return e.forEach((e,n)=>{let r=t[n]??[],i=e.cut===false?0:1,o=e.cut===false?r.length:r.length-1;for(let e=i;e<o;e+=1){let t=r[e];t!==void 0&&a(t);}}),e.map((e,a)=>{let o=t[a]??[],s=o[0],c=o[o.length-1];if(s===void 0||c===void 0||e.cut===false)return {...e,tagList:o,firstEnd:js,lastEnd:js};if(o.length===1){let t=n.has(s)?Ms:`cut`;return {...e,tagList:o,firstEnd:t,lastEnd:t}}let l=Is(s,r.get(s),n.has(s),e.cut),u=Is(c,i.get(c),n.has(c),e.cut),d=[l.tag,...o.slice(1,-1),u.tag];return {...e,tagList:d,firstEnd:l.state,lastEnd:u.state}})}var Rs=new WeakMap;function zs(e){let t=Rs.get(e);if(t!==void 0)return t;let n=Ls(e);return Rs.set(e,n),n}var Bs=`images`,Vs=`videos`,Hs=`id-asc`,Us=`id-desc`,Ws=/\s+/,Gs=`-`,Ks=`*`,qs=`(`,Js=`)`,Ys=`~`,Xs=`~`,Zs=`:`,Qs=`sort`,$s=new Map([[`sort:id:asc`,Hs],[`sort:id:desc`,Us],[`sort:id`,Us]]),ec=new Set([Qs,`user`,`md5`,`rating`,`parent`,`width`,`height`,`score`,`aspectratio`,`aspectratiof`,`sourcedomains`,`source`,`id`]),tc=/[.+?^${}()|[\]\\]/g;function nc(e){let t=e.split(Ks).map(e=>e.replace(tc,`\\$&`)).join(`.*`);return RegExp(`^${t}$`)}function rc(e){let t=e.startsWith(Ks)?e:e.slice(1),n=e.endsWith(Ks)?e:e.slice(0,-1),r=e.endsWith(Ks)?t:t.slice(0,-1);return {whole:nc(e),noFirst:nc(t),noLast:nc(n),noEnds:nc(r)}}function ic(e){return e===`all`||e===`images`||e===`videos`}function ac(e){let t=e.indexOf(Zs);return t>0&&ec.has(e.slice(0,t))}function oc(e){let t=[],n=[],r=[],i=[],a=null,o=null;for(let s of e.toLowerCase().split(Ws)){if(s.length===0)continue;if(o!==null){s===Js?(o.length>0&&r.push(o),o=null):s!==Ys&&o.push(rc(s));continue}if(s===qs){o=[];continue}let e=s.startsWith(Gs),c=e?s.slice(1):s;if(c.length!==0){if(ac(c)){let t=e?void 0:$s.get(c);t===void 0?i.push(s):a=t;}else c.endsWith(Xs)?i.push(s):(e?n:t).push(rc(c));}}return o!==null&&o.length>0&&r.push(o),{include:t,exclude:n,anyOf:r,sort:a,unsupported:i}}function sc(e){return e.include.length===0&&e.exclude.length===0&&e.anyOf.length===0&&e.sort===null}function cc(e,t){let n=e.tagList,r=n.length-1;return n.some((n,i)=>{if(t.whole.test(n))return  true;let a=i===0&&e.firstEnd!==`whole`,o=i===r&&e.lastEnd!==`whole`;return a&&t.noFirst.test(n)||o&&t.noLast.test(n)||a&&o&&t.noEnds.test(n)})}function lc(e,t){return t.include.every(t=>cc(e,t))&&!t.exclude.some(t=>cc(e,t))&&t.anyOf.every(t=>t.some(t=>cc(e,t)))}function uc(e,t){return t===`all`||Nt$4(e.tags)===(t===Vs)}function dc(e,t,n,r){let i=zs(e).filter(e=>t.has(e.id)&&uc(e,r)&&lc(e,n));return n.sort===`id-asc`?i.sort((e,t)=>e.id-t.id):n.sort===`id-desc`?i.sort((e,t)=>t.id-e.id):i.sort((e,t)=>t.run-e.run||e.pos-t.pos||t.id-e.id)}function fc(e,t,n){let r=new Map;for(let n of zs(e)){if(!t.has(n.id))continue;let e=n.tagList.length-1,i=n.tagList.filter((t,r)=>(r!==0||n.firstEnd!==`cut`)&&(r!==e||n.lastEnd!==`cut`));for(let e of new Set(i))r.set(e,(r.get(e)??0)+1);}return [...r].map(([e,t])=>({tag:e,count:t})).sort((e,t)=>t.count-e.count||e.tag.localeCompare(t.tag)).slice(0,n)}var pc=1831565813,mc=4294967296;function hc(e,t){let n=t>>>0,r=()=>{n=n+pc>>>0;let e=n;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/mc},i=[...e];for(let e=i.length-1;e>0;--e){let t=Math.floor(r()*(e+1)),n=i[e],a=i[t];n!==void 0&&a!==void 0&&(i[e]=a,i[t]=n);}return i}var gc=new Set([`(`,`)`,`~`]),_c=`-`,vc=`*`,yc=/\s/,bc=`starts`,xc=`inside`,Sc=`Exclude`;function Cc(e,t){let n=Math.max(0,Math.min(t,e.length)),r=n;for(;r>0&&!yc.test(e.charAt(r-1));)--r;let i=n;for(;i<e.length&&!yc.test(e.charAt(i));)i+=1;if(r===i)return null;let a=e.slice(r,i).toLowerCase(),o=a.startsWith(_c);return {start:r,end:i,body:o?a.slice(1):a,negated:o}}function wc(e,t){if(t===null||t.body.length===0)return null;let{body:n,negated:r}=t;if(gc.has(n)||n.includes(vc))return null;let i=r?_c:``,a=[],o=[],s=[],c=null;for(let t of e)t.tag===n?c=t:t.tag.startsWith(n)?o.push(t):t.tag.includes(n)&&s.push(t);let l=(e,t)=>t.count-e.count||e.tag.localeCompare(t.tag);o.sort(l),s.sort(l);let u=(e,t)=>({insert:`${i}${e.tag}`,label:`${i}${e.tag}`,matchStart:i.length+e.tag.indexOf(n),matchLength:n.length,count:e.count,caption:null,group:t});for(let e of c===null?o:[c,...o])a.push(u(e,bc));for(let e of s)a.push(u(e,xc));return a.length===0||a.length===1&&c!==null?null:{heading:r?Sc:null,items:a.slice(0,20)}}function Tc(e,t,n){let r=e.slice(0,t.start),i=e.slice(t.end),a=i.length===0||!yc.test(i.charAt(0))?` `:``,o=`${r}${n}${a}`,s=a.length>0?o.length:o.length+1;return {text:`${o}${i}`,caret:Math.min(s,o.length+i.length)}}function Ec(e,t){let n=new Set(t.map(e=>e.tag)),r=[];for(let t of e.toLowerCase().split(/\s+/))t.length===0||t.startsWith(_c)||gc.has(t)||t.includes(vc)||t.includes(`:`)||n.has(t)||r.push(t);return r}function Dc(e,t){let n=null,r=false;for(let i of e){if(i.tag===t||!i.tag.includes(t))continue;let e=i.tag.startsWith(t);(n===null||e&&!r||e===r&&(i.tag.length<n.tag.length||i.tag.length===n.tag.length&&i.count>n.count))&&(n=i,r=e);}return n}var Oc=`(`,kc=`)`,Ac=`~`,jc=/\S+/g;function Mc(e){return `Any of ${String(e)} ${e===1?`tag`:`tags`}`}function Nc(e){let t=[],n=null,r=0,i=0;for(let a of e.matchAll(jc)){let e=a[0],o=a.index,s=o+e.length;if(i=s,n!==null){e===kc?(t.push({start:n,end:s,label:Mc(r),excluded:false,group:true}),n=null):e!==Ac&&(r+=1);continue}if(e===Oc){n=o,r=0;continue}let c=e.startsWith(_c)&&e.length>1;t.push({start:o,end:s,label:c?e.slice(1):e,excluded:c,group:false});}return n!==null&&t.push({start:n,end:i,label:Mc(r),excluded:false,group:true}),t}function Pc(e){return e.replace(/\s+/g,` `).trim()}function Fc(e,t){return Pc(`${e.slice(0,t.start)} ${e.slice(t.end)}`)}function Ic(e,t){if(t.group)return e;let n=t.excluded?t.label:`${_c}${t.label}`;return Pc(`${e.slice(0,t.start)}${n}${e.slice(t.end)}`)}var Lc=`none`,Rc=`id:`,zc=`Any`,Bc=`Not in any collection`;function Vc(e){return e.kind===Ee$3}function Hc(e){let t=e.filter(Vc).map(e=>({value:`${Rc}${e.id}`,label:e.name})).sort((e,t)=>e.label.localeCompare(t.label));return [{value:`any`,label:zc},{value:Lc,label:Bc},...t]}function Uc(e,t){if(t===`none`){let t=new Set;for(let n of e)if(Vc(n))for(let e of n.postIds??[])t.add(e);return e=>!t.has(e)}if(!t.startsWith(Rc))return null;let n=t.slice(3),r=e.find(e=>Vc(e)&&e.id===n);if(r===void 0)return null;let i=new Set(r.postIds??[]);return e=>i.has(e)}function Wc(e,t){let n=new Map;for(let e of t)n.set(e.tag,e.count);let r=[],i=new Set;for(let t of e){let e=t.tag.toLowerCase(),a=n.get(e);a===void 0||a===0||i.has(e)||(i.add(e),r.push({tag:e,kind:t.kind??`artist`,count:a}));}return r.sort((e,t)=>t.count-e.count||e.tag.localeCompare(t.tag))}function Gc(e,t){return Nc(e).some(e=>!e.group&&!e.excluded&&e.label.toLowerCase()===t)}function Kc(e,t){let n=Nc(e).find(e=>!e.group&&e.label.toLowerCase()===t);if(n!==void 0)return n.excluded?Ic(e,n):Fc(e,n);let r=e.trim();return r.length===0?t:`${r} ${t}`}var qc=`rdw-fav-more`,Jc=`rdw-fav-controls`,Yc=`rdw-fav-layout`,Xc=`rdw-favorites-side`,Zc=`rdw-fav-side`,Qc=`rdw-fav-side-slot`,$c=228,el=60,tl=`rdw-fav-status`,nl=`rdw-fav-search-box`,rl=`rdw-fav-group-label`,il=`rdw-favorites-count`,al=`rdw-favorites-head-actions`,ol=340,sl=Qt$2,cl=`pages`,ll=$t$2,ul=250,dl=`rdw-fav-empty`,fl=`Tags in your favorites`,pl=`No favorites match this search`,ml=`No favorites tagged “`,hl=`”`,gl=`Tags match whole words. Closest tag in your favorites:`,_l=`Tags match whole words, and no tag in your favorites has this in it.`,vl=`Show `,yl=`600px`,bl=`rdw-fav-search`,xl=`Search your favorites`,Sl=`Search favorites`,Cl=`Clear search`,wl={label:`Search syntax`,rows:[[`cat dog`,`posts with both tags`],[`( cat ~ dog )`,`posts with either tag; keep the spaces`],[`-sketch`,`posts without the tag`],[`cat*`,`tags that start with cat`],[`ca*t`,`tags like ca…t`]],note:`Favorites search uses tags only. rating:, score:, width:, height:, user: and the other metatags, and fuzzy tag~, work only in Posts search. The order is set with Sort.`,widthPx:ol},Tl=`Shuffle is on: the order in the search is not applied.`,El=` doesn’t work in Favorites.`,Dl=` don’t work in Favorites.`,Ol=` Favorites search uses tags only.`,kl=`:`,Al=`Reset search`,jl=`Collection`,Ml=`Favorites aren’t synced yet. Search, filters and Scroll need a one-time sync (about 1.5 s per page).`,Nl=`Sync favorites…`,Pl=`Sync now`,Fl=`rdw-fav-sync-link`,Il=`-${Ue}`,Ll=`no AI posts`,Rl=`No favorites here`,zl=`None of your favorites pass the Collection filter. Choose Any to see them all.`,Bl=`Followed tags`,Vl=`Show all`,Hl=`Show less`,Ul=`-`,Wl=`Type`,Gl=`View`,Kl=`Sort`,ql=`newest`,Jl=`oldest`,Yl=`shuffle`,Xl=[{value:ql,label:`Newest`},{value:Jl,label:`Oldest`},{value:Yl,label:`Shuffle`}],Zl=`Search`,Ql=`Click Shuffle again for another order.`,$l=`Finish selecting to change filters.`,eu=`Search terms`,tu=`Click to exclude, click again to include`,nu=12,ru=28,iu=2,au=`rdw-fav-side--more`,ou=`rdw-fav-side--locked`,su=`rdw-fav-side__body`,cu=`rdw-fav-side__head`,lu=`rdw-fav-warning`,uu=`rdw-fav-side__actions`,du=uu,fu=`rdw-fav-side__bar`,pu=`rdw-fav-side__card`,mu=`rdw-fav-side__group`,hu=`rdw-fav-side__lock`,gu=`rdw-fav-side__hint`,_u=`rdw-fav-followed`,vu=`rdw-fav-followed__list`,yu=`rdw-fav-followed__row`,bu=`rdw-fav-followed__dot`,xu=`rdw-fav-followed__name`,Su=`rdw-fav-followed__count`,Cu=`data-kind`,wu=`rdw-fav-chips`,Tu=`rdw-fav-chip`;function Eu(e){return e===`newest`||e===`oldest`}var Du=`Show more`,Ou=`en-US`,ku=`No index yet: run Full resync in RuleDesk → Favorites to search and scroll here.`,Au=`Could not remove the favorite. Try again.`,ju=[{value:`all`,label:`All`},{value:Bs,label:`Images`},{value:Vs,label:`Videos`}],Mu=[{value:cl,label:`Pages`},{value:ll,label:`Scroll`}],Nu=`align-self: flex-start; display: grid; grid-template-rows: auto 10px;`,Pu=`index.php?page=post&s=view&id=`,Fu=`image_thumb`,Iu=`Remove`,Lu=`
body.${Xt$2} ${an$2.imageList}:not(.${Zt$2}),
body.${Xt$2} #paginator {
  display: none !important;
}
body:not(.${Xt$2}) .${Zt$2},
body:not(.${Xt$2}) .${qc} {
  display: none;
}
/* The strip over the grid: the count, how the list is paged, the buttons. */
.${Jc} {
  display: flex;
  flex: 1 1 auto;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.75rem;
  min-width: 0;
}
.${Jc} .rdw-btn {
  font-weight: 500;
}
.${rl} {
  font: 12px var(--rdw-font);
  color: var(--rdw-muted);
}
/* The page in two columns: the filters, and everything the site put there.
   Nothing of the site's is wrapped or moved; the block the grid is in becomes
   a grid of its own, and the column of filters is one more child of it. */
.${Yc} {
  display: grid !important;
  grid-template-columns: ${String($c)}px minmax(0, 1fr);
  column-gap: 16px;
  row-gap: 0;
  align-items: start;
  /* The grid and the card start the same way off the header. The site and the
     skin set the padding of this block themselves: this has to win. */
  padding-top: ${String(nu)}px !important;
}
.${Yc} > * {
  grid-column: 2;
  min-width: 0;
}
/* The place of the column: the first column, every row. It takes no part in
   the sizing of the rows (a child that spans rows makes them taller by its
   own height), so its size is its place and nothing else. */
.${Yc} > .${Qc} {
  grid-column: 1;
  grid-row: 1 / span ${String(el)};
  align-self: stretch;
  contain: size;
}
/* Held beside the grid; taller than the window, it scrolls inside itself. */
.${Zc} {
  box-sizing: border-box;
  position: sticky;
  top: calc(${Ya$1} + ${String(nu)}px);
  max-height: calc(100vh - ${Ya$1} - 24px);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--rdw-border) transparent;
  color: var(--rdw-text);
  font: 12px/1.4 var(--rdw-font);
}
.${Zc} * {
  font-family: var(--rdw-font);
}
/* A strip that fades the last lines while there is more below. Not a mask:
   the suggestions and the "?" open from inside the column. */
.${Zc}.${au}::after {
  content: "";
  position: sticky;
  bottom: 0;
  display: block;
  height: ${String(ru)}px;
  margin-top: -${String(ru)}px;
  background: linear-gradient(to bottom, transparent, var(--rdw-bg));
  pointer-events: none;
}
/* A card, as the search panel of Posts is: the filters read as one block
   and not as controls lying on the page. */
.${su} {
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
.${lu} {
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
.${su} .${du} > .rdw-btn--ghost {
  color: var(--rdw-muted);
}
.${su} .${du} > .rdw-btn--ghost:hover {
  color: var(--rdw-text);
}
.${cu} {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
/* The buttons at the foot of the card, as "Reset" and "Select posts" are on Posts. */
.${su} .${du} {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-top: 12px;
  border-top: 1px solid var(--rdw-border);
}
.${su} .${du}:empty {
  display: none;
}
/* Each on a row of its own: the column has the room, and nothing is tucked away in a menu. */
.${su} .${du} > .rdw-btn {
  flex: 1 1 100%;
  white-space: nowrap;
  font-weight: 500;
}
.${mu} {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
/* The collection filter fills the card, as the switches above it do. */
.${mu} > .rdw-select {
  display: flex;
}
.${mu} > .rdw-select .rdw-select__trigger > span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.${Fl} {
  padding: 0;
  border: 0;
  background: none;
  color: var(--rdw-accent);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}
/* The followed among the favorites: a card of its own under the filters. */
.${_u} {
  margin-top: 12px;
}
.${vu} {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.${vu} > li {
  margin: 0;
  padding: 0;
  list-style: none;
}
.${yu} {
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
.${yu}:hover {
  background: var(--rdw-surface-2);
}
.${yu}[aria-pressed="true"] {
  background: var(--rdw-accent-soft);
  border-color: var(--rdw-accent);
}
.${bu} {
  flex: none;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--rdw-tag-artist);
}
.${yu}[${Cu}="character"] .${bu} {
  background: var(--rdw-tag-character);
}
.${yu}[${Cu}="copyright"] .${bu} {
  background: var(--rdw-tag-copyright);
}
.${xu} {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.${Su} {
  flex: none;
  color: var(--rdw-muted);
  font-variant-numeric: tabular-nums;
}
.${gu} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 11.5px;
}
.${wu} {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.${Tu} {
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
.${hu} {
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
.${Zc}.${ou} .${su} {
  opacity: 0.45;
  pointer-events: none;
}
/* In place of the grid when nothing matches. */
.${dl} {
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
.${dl} strong {
  color: var(--rdw-text);
  font-weight: 700;
}
.${dl} button {
  margin-top: 6px;
}
.${tl} {
  flex: 0 0 100%;
  font: 12px var(--rdw-font);
  color: var(--rdw-muted);
}
.${il} {
  font: 12px var(--rdw-font);
  color: var(--rdw-muted);
  white-space: nowrap;
}
/* The buttons stand at the right end of the strip. */
.${Jc} .${al} {
  display: flex;
  align-items: center;
  gap: 0.35rem 0.5rem;
  margin-left: auto;
}
.${Jc} .${al}:empty {
  display: none;
}
.${qc} {
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
.${qc}[hidden] {
  display: none;
}
`.trim();function Ru(e){return e===`pages`||e===ll}function zu(){let e=Nc$1(sl);return Ru(e)?e:cl}function Bu(){if(document.body.classList.contains(`rdw-fav-browsing`)){let e=document.querySelector(`.${Zt$2}`);if(e!==null)return e}return document}function Vu(e){let t=String(e.id),n=document.createElement(`span`);n.setAttribute(`style`,Nu);let r=document.createElement(`span`);r.className=`thumb`;let i=document.createElement(`a`);i.id=`p${t}`,i.href=`${Pu}${t}`;let a=document.createElement(`img`);a.src=e.thumb,a.title=e.tags,a.alt=Fu,a.loading=`lazy`,i.append(a),r.append(i);let o=document.createElement(`a`);o.href=`#`,o.setAttribute(`onclick`,`document.location='index.php?page=favorites&s=delete&id=${t}&return_pid=0'; return false;`);let s=document.createElement(`b`);return s.textContent=Iu,o.append(s),n.append(r,document.createElement(`br`),o),n}var Hu=null,Uu=null;function Wu(e){let t=e.results.slice(e.shown,e.shown+100);for(let n of t)e.container.append(Vu(n));e.shown+=t.length,e.more.hidden=e.shown>=e.results.length,t.length>0&&st$4(e.container);}function Gu(e){let t=e.target;if(!(t instanceof Element))return;let n=t.closest(`a[onclick]`);if(!(n instanceof HTMLAnchorElement))return;let r=fn$2(n.getAttribute(`onclick`)??``);if(r===null)return;e.preventDefault(),e.stopPropagation();let i=n.parentElement;Os(r).then(e=>{e.status===`removed`?i?.remove():Uu?.();}).catch(e=>{m$2.warn(`favorites-browser: remove failed`,e),Uu?.();});}var Ku=new WeakSet;function qu(e){Ku.has(e)||(Ku.add(e),e.addEventListener(`click`,Gu,true));}function Ju(){if(Hu!==null&&Hu.container.isConnected)return Hu;let e=document.querySelector(`${an$2.imageList}:not(.${Zt$2})`);if(e===null)return null;let t=document.createElement(`div`);t.className=`image-list ${Zt$2}`,qu(t);let n=document.createElement(`button`);n.type=`button`,n.className=qc,n.textContent=Du,n.hidden=true,e.after(t,n);let r={container:t,more:n,results:[],shown:0};return n.addEventListener(`click`,()=>{Wu(r);}),typeof IntersectionObserver==`function`&&new IntersectionObserver(e=>{e.some(e=>e.isIntersecting)&&Wu(r);},{rootMargin:yl}).observe(n),Hu=r,r}function Yu(e){let t=Ju();t!==null&&(t.container.replaceChildren(),t.results=e,t.shown=0,document.body.classList.add(Xt$2),Wu(t));}function Xu(){return Hu===null||!document.body.classList.contains(`rdw-fav-browsing`)?null:Hu.results.map(e=>e.id)}function Zu(e){let t=Ju();t!==null&&(t.container.replaceChildren(e),t.results=[],t.shown=0,t.more.hidden=true,document.body.classList.add(Xt$2));}function Qu(e,t){return fc(e,t,2**53-1)}function $u(e){return e===null?null:{heading:e.heading,items:e.items.map((t,n)=>({key:`${t.group}:${t.insert}`,label:t.label,matchStart:t.matchStart,matchLength:t.matchLength,trailing:t.count===null?t.caption:t.count.toLocaleString(Ou),announce:t.count===null?`${t.label}, ${t.caption??``}`:`${t.label}, ${id(t.count)}`,divider:n>0&&t.group===`inside`&&e.items[n-1]?.group!==`inside`}))}}function ed(e,t){let n=Ec(e,t)[0];if(n===void 0)return {title:pl,note:``,offer:null};let r=Dc(t,n);return {title:`${ml}${n}${hl}`,note:r===null?_l:gl,offer:r===null?null:{word:n,tag:r.tag,count:r.count}}}function td(e,t,n){return e.trim().split(/\s+/).map(e=>e.toLowerCase()===t?n:e).join(` `)}function nd(e,t){let n=document.createElement(`div`);n.className=dl,n.setAttribute(`role`,`status`);let r=document.createElement(`strong`);if(r.textContent=e.title,n.append(r),e.note.length>0){let t=document.createElement(`span`);t.textContent=e.note,n.append(t);}let{offer:i}=e;if(i!==null){let e=document.createElement(`button`);e.type=`button`,e.className=`rdw-btn rdw-kit-focusable rdw-btn--secondary rdw-btn--m`,e.textContent=`${vl}${i.tag} (${i.count.toLocaleString(Ou)})`,e.addEventListener(`click`,()=>{t(i.word,i.tag);}),n.append(e);}return n}function rd(){document.body.classList.remove(Xt$2),Hu!==null&&(Hu.container.replaceChildren(),Hu.results=[],Hu.shown=0,Hu.more.hidden=true);}function id(e){return `${e.toLocaleString(Ou)} ${e===1?`post`:`posts`}`}function ad(e,t){return e>=t?``:`The index holds ${e.toLocaleString(Ou)} of ${t.toLocaleString(Ou)} favorites; Full resync in RuleDesk → Favorites adds the rest.`}function od(e){let t=[];for(let n of e){let e=n.startsWith(Ul)?n.slice(1):n,r=e.indexOf(kl),i=r>0?e.slice(0,r+1):e;t.includes(i)||t.push(i);}return t.length===0?``:`${t.join(`, `)}${t.length===1?El:Dl}${Ol}`}function sd(){return Ts$1()?.finishedAt!==void 0}function cd(){let e=[...bs$1()],t=e[Math.floor(Math.random()*e.length)];t!==void 0&&window.location.assign(`${Pu}${String(t)}`);}function ld(e,t,n=``){let r=[],i=e.trim();i.length>0&&r.push(i);let a=ju.find(e=>e.value===t);return t!==`all`&&a!==void 0&&r.push(a.label),n.length>0&&r.push(n),r.join(` · `)}function ud(e={}){let[t,n]=z$2(``),[r,i]=z$2(``),[a,o]=z$2(`all`),[s,c]=z$2(()=>zu()),[l,u]=z$2(null),[d,f]=z$2(``),[p,m]=z$2(null),h=V$2(false),g=V$2(null),_$1=V$2(null),[v,y]=z$2(null),[b,x]=z$2(ql),[S,C]=z$2(`any`),[w,T]=z$2(()=>G(nn$2)),[ee,te]=z$2(false),[ne,re]=z$2(()=>sd());B$2(()=>{let e=()=>{re(sd());};return window.addEventListener(`hashchange`,e),()=>{window.removeEventListener(`hashchange`,e);}},[]);let ie=W(),[ae,oe]=z$2(false),{sideHost:E}=e,D=E!=null,O=D?E.closest(`.rdw-fav-side`)??E:null,se=D&&!ne,le=oc(r),ue=s===ll||a!==`all`||v!==null||b!==`newest`||S!==`any`||w||!sc(le),{onSummary:de}=e;B$2(()=>{let e=[(S===`any`?void 0:Hc(G$3().collections).find(e=>e.value===S))?.label??``,w?Ll:``].filter(e=>e.length>0);de?.(ld(r,a,e.join(` · `)));},[de,r,a,S,w]);let fe=()=>{h.current||(h.current=true,g$1().then(e=>{u(e);}).catch(e=>{m$2.warn(`favorites-browser: index read failed`,e),u([]);}));};B$2(()=>{t.length>0&&l===null&&fe();},[t,l]),B$2(()=>{if(!D||G$3().artists.length===0)return;let e=window.setTimeout(fe,0);return ()=>{window.clearTimeout(e);}},[D]);let pe=Le$2(()=>l===null?[]:Qu(l,bs$1()),[l]),me=Le$2(()=>pe.length===0?[]:Wc(G$3().artists,pe),[pe]),he=Le$2(()=>({label:fl,list:(e,t)=>$u(wc(pe,Cc(e,t))),pick:(e,t,n)=>{let r=Cc(e,t),i=wc(pe,r)?.items[n];return r===null||i===void 0?null:Tc(e,r,i.insert)}}),[pe]);B$2(()=>{if(O===null)return;let e=()=>{let e=O.scrollHeight-O.scrollTop-O.clientHeight;O.classList.toggle(au,e>iu);};e(),O.addEventListener(`scroll`,e,{passive:true}),window.addEventListener(`resize`,e,{passive:true});let t=typeof ResizeObserver==`function`?new ResizeObserver(e):null;return t?.observe(O),()=>{O.removeEventListener(`scroll`,e),window.removeEventListener(`resize`,e),t?.disconnect();}},[O]);let ge=e.locked===true;B$2(()=>{O?.classList.toggle(ou,ge);},[O,ge]),B$2(()=>(Uu=()=>{f(Au);},()=>{Uu=null;}),[]),B$2(()=>{if(!ue||se){rd(),f(``),te(false),m(null);return}if(l===null){fe();return}let e=window.setTimeout(()=>{let e=bs$1();if(l.length===0){rd(),f(ku),m(null);return}let t=oc(r),o=Uc(G$3().collections,S),s=w?{...t,exclude:[...t.exclude,...oc(Il).exclude]}:t,c=dc(l,e,s,a),u=o===null?c:c.filter(e=>o(e.id)),d=t.sort===null&&b===`oldest`?[...u].reverse():u,p=v===null?d:hc(d,v);p.length===0&&!sc(t)?Zu(nd(ed(r,pe),(e,t)=>{let a=td(r,e,t);n(a),i(a);})):p.length===0&&o!==null?Zu(nd({title:Rl,note:zl,offer:null},()=>void 0)):Yu(p);let h=l.filter(t=>e.has(t.id)).length;f(ad(h,e.size)),te(h<e.size),m(p.length);},ul);return ()=>{window.clearTimeout(e);}},[ue,se,l,r,a,v,b,pe,S,w]);let _e=od(le.unsupported),ve=[v!==null&&le.sort!==null?Tl:``,d].filter(e=>e.length>0),ye=bs$1().size,be=p===null?ye>0?id(ye):``:id(p),{actionsRef:xe$1}=e;B$2(()=>(xe$1?.(_$1.current),()=>{xe$1?.(null);}),[xe$1]);let Se=Nc(t);bs(Se.filter(e=>!e.group&&!e.excluded).map(e=>e.label));let k=e=>{n(e),i(e);},Ce=v===null?b:Yl,we=Hc(G$3().collections),Te=we.some(e=>e.value===S)?S:`any`,Ee=ae?me:me.slice(0,12),De=K$3(Dr,{label:Gl,options:Mu,value:s,onChange:e=>{Ru(e)&&(Pc$1(sl,e),c(e));}}),Oe=K$3(A$2,{children:[ge&&e.onUnlock!==void 0?K$3(`div`,{className:hu,role:`status`,children:[K$3(`span`,{children:$l}),K$3(q$3,{variant:`ghost`,size:`s`,onClick:()=>e.onUnlock?.(),children:Fe$3.cancel})]}):null,K$3(`div`,{className:su,...ge?{inert:true}:{},children:[K$3(`div`,{className:cu,children:[K$3(Tr,{children:Zl}),D&&!se&&be.length>0?K$3(`span`,{className:il,role:`status`,children:be}):null]}),se?K$3(A$2,{children:[K$3(`p`,{className:lu,role:`status`,children:Ml}),K$3(q$3,{variant:`secondary`,size:`s`,onClick:()=>{_(xe);},children:Nl})]}):K$3(A$2,{children:[K$3(Cr,{id:bl,className:nl,value:t,placeholder:xl,"aria-label":Sl,clearLabel:Cl,help:wl,suggest:he,onFocus:fe,onChange:n,onCommit:i}),_e.length>0?K$3(`p`,{className:lu,role:`status`,children:_e}):null,ve.length>0?K$3(`span`,{className:tl,role:`status`,children:[ve.join(` `),ee?K$3(A$2,{children:[` `,K$3(`button`,{type:`button`,className:`${Fl} rdw-kit-focusable`,onClick:()=>{_(xe);},children:Pl})]}):null]}):null,Se.length>0?K$3(`div`,{className:wu,role:`group`,"aria-label":eu,children:Se.map(e=>K$3(`button`,{type:`button`,className:`${Tu} rdw-kit-focusable`,title:e.group?void 0:tu,"aria-pressed":e.group?void 0:e.excluded,onClick:n=>{let r=n.target;r instanceof Element&&r.closest(`button`)!==n.currentTarget||k(Ic(t,e));},children:K$3(Mt$2,{label:e.label,variant:e.group?`group`:e.excluded?`exclude`:`dot`,kind:e.group||e.excluded?`default`:vs(e.label),onRemove:()=>{k(Fc(t,e));}})},`${String(e.start)}:${e.label}`))}):null,K$3(`div`,{className:mu,children:[K$3(Tr,{children:Wl}),K$3(Dr,{label:Wl,options:ju,value:a,onChange:e=>{ic(e)&&o(e);}})]}),K$3(`div`,{className:mu,children:[K$3(Tr,{children:We}),K$3(Dr,{label:We,options:B,value:w?z:R,disabled:ie,onChange:e=>{if(ie)return;let t=e===z;K$1(nn$2,t),T(t);}}),ie?K$3(ut,{}):null]}),K$3(`div`,{className:mu,children:[K$3(Tr,{children:jl}),K$3(ai,{options:we,value:Te,onChange:C})]}),K$3(`div`,{className:mu,children:[K$3(Tr,{children:Kl}),K$3(Dr,{label:Kl,options:Xl,value:Ce,onChange:e=>{e===`shuffle`?(y(Date.now()),x(ql)):Eu(e)&&(y(null),x(e));}}),v===null?null:K$3(`p`,{className:gu,children:Ql})]}),D?K$3(`div`,{className:mu,children:[K$3(Tr,{children:Gl}),De]}):null,t.trim().length>0||a!==`all`||S!==`any`?K$3(`div`,{children:K$3(q$3,{variant:`ghost`,size:`s`,onClick:()=>{k(``),o(`all`),C(`any`);},children:Al})}):null]}),D?K$3(`div`,{className:`${al} ${du}`,ref:_$1}):null]}),D&&!se&&me.length>0?K$3(`div`,{className:`${su} ${_u}`,...ge?{inert:true}:{},children:[K$3(Tr,{children:Bl}),K$3(`ul`,{className:vu,children:Ee.map(e=>K$3(`li`,{children:K$3(`button`,{type:`button`,className:`${yu} rdw-kit-focusable`,"aria-pressed":Gc(t,e.tag),[Cu]:e.kind,onClick:()=>{k(Kc(t,e.tag));},children:[K$3(`span`,{className:bu,"aria-hidden":`true`}),K$3(`span`,{className:xu,children:e.tag}),K$3(`span`,{className:Su,children:e.count.toLocaleString(Ou)})]})},e.tag))}),me.length>12?K$3(`div`,{children:K$3(q$3,{variant:`ghost`,size:`s`,onClick:()=>{oe(!ae);},children:ae?Hl:`${Vl} (${me.length.toLocaleString(Ou)})`})}):null]}):null]});return D?K$3(A$2,{children:[K$3(`style`,{children:Lu}),Ft$1(Oe,E)]}):K$3(A$2,{children:[K$3(`style`,{children:Lu}),Oe,K$3(`div`,{className:Jc,ref:g,children:[be.length>0?K$3(`span`,{className:il,role:`status`,children:be}):null,K$3(`span`,{className:rl,"aria-hidden":`true`,children:Gl}),De,K$3(`div`,{className:al,ref:_$1})]})]})}var dd=`rdw-collection-picker`,fd=`rdw-collection-picker-item`,pd=`rdw-collection-picker-count`,md=`rdw-collection-picker-new`,hd=`rdw-collection-picker-list`,gd=`rdw-collection-picker-check`,_d=`rdw-collection-picker-name`,vd=`rdw-collection-picker-empty`,yd=`rdw-collection-picker-new-field`,bd=`rdw-collection-picker-error`,xd={create:`Create`,newName:`New collection name`,filter:`Filter collections…`,empty:`No collections yet`,noMatch:`No matching collections`,togglePrefix:`Toggle collection`,nameTaken:`A collection with this name already exists.`,list:`Custom collections`},Sd=`menuitemcheckbox`,Cd=12,wd=15,Td=8,Ed=6,Dd=`
.${dd} {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${String(Ed)}px;
  min-width: 0;
  color: var(--rdw-text);
  font: 12px/1.35 var(--rdw-font);
}
.${hd} {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 2px;
  max-height: 232px;
  overflow-x: hidden;
  overflow-y: auto;
}
button.${fd} {
  display: flex;
  align-items: center;
  gap: ${String(Td)}px;
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
button.${fd}:hover,
button.${fd}:focus-visible {
  background: var(--rdw-surface-2);
}
button.${fd}:focus-visible {
  outline: 2px solid var(--rdw-accent);
  outline-offset: -2px;
}
.${gd} {
  flex: 0 0 ${String(wd)}px;
  display: inline-grid;
  place-items: center;
  box-sizing: border-box;
  width: ${String(wd)}px;
  height: ${String(wd)}px;
  border: 1px solid var(--rdw-border);
  border-radius: 4px;
  background: transparent;
  color: var(--rdw-surface);
}
.${fd}[aria-checked="true"] .${gd} {
  background: var(--rdw-accent);
  border-color: var(--rdw-accent);
}
.${_d} {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.${pd} {
  flex: 0 0 auto;
  color: var(--rdw-muted);
  font-variant-numeric: tabular-nums;
}
.${vd} {
  margin: 0;
  padding: 4px 6px;
  color: var(--rdw-muted);
}
form.${md} {
  display: flex;
  align-items: center;
  gap: ${String(Ed)}px;
  margin: 0;
  padding-top: ${String(Ed)}px;
  border-top: 1px solid var(--rdw-border);
}
.${bd} {
  margin: 0;
  color: var(--rdw-danger);
}
.${md} .${yd} {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
}
`.trim();function Od(e){return e.trim().toLowerCase()}function kd(e,t){let n=Od(t);return n.length===0||e.name.toLowerCase().includes(n)}function Ad(e,t,n){let r=n();r===null?oc$1(e,t):oc$1(e,t,r);}function jd(e){let[t,n]=z$2(``),[r,i]=z$2(``),[a,o]=z$2(``),[,s]=z$2(0),c=Js$1(),l=new Set(Ys$1(e.postId).map(e=>e.id)),u=c.length>8,d=u?c.filter(e=>kd(e,t)):c,f=()=>{s(e=>e+1),e.onChange?.();},p=t=>{l.has(t)?lc$1(t,e.postId):Ad(t,e.postId,e.readThumbUrl),f();},m=()=>{let t=r.trim();t.length!==0&&(G$3().collections.some(e=>Od(e.name)===Od(t))?o(xd.nameTaken):(Ad(qs$1(t).id,e.postId,e.readThumbUrl),i(``),f()));},h=c.length===0?xd.empty:xd.noMatch;return K$3(`div`,{className:dd,children:[K$3(`style`,{children:Dd}),u?K$3(Kt$1,{value:t,onChange:n,placeholder:xd.filter,"aria-label":xd.filter}):null,d.length===0?K$3(`p`,{className:vd,children:h}):K$3(`div`,{className:hd,role:`group`,"aria-label":xd.list,children:d.map(e=>K$3(`button`,{type:`button`,className:fd,role:Sd,"aria-checked":l.has(e.id),"aria-label":`${xd.togglePrefix} ${e.name}`,onClick:t=>{t.preventDefault(),t.stopPropagation(),p(e.id);},children:[K$3(`span`,{className:gd,"aria-hidden":`true`,children:l.has(e.id)?K$3(ft$2,{size:Cd}):null}),K$3(`span`,{className:_d,children:e.name}),K$3(`span`,{className:pd,children:String(e.postIds?.length??0)})]},e.id))}),K$3(`form`,{className:md,onSubmit:e=>{e.preventDefault(),e.stopPropagation(),m();},children:[K$3(Kt$1,{className:yd,value:r,onChange:e=>{i(e),o(``);},placeholder:xd.newName,"aria-label":xd.newName}),K$3(q$3,{type:`submit`,variant:`primary`,size:`s`,disabled:r.trim().length===0,children:xd.create})]}),a.length>0?K$3(`p`,{className:bd,role:`alert`,children:a}):null]})}var Md=`img#image`,Nd=`video#gelcomVideoPlayer`,Pd=`source`,Fd=`a[href*='tags=']`,Id=` `;function Ld(e,t,n,r){let i=Number(e);return !Number.isInteger(i)||i<=0||t.length===0?null:{id:i,tags:t.join(Id),thumb:n!==null&&ut$4(n)?n:``,run:r,pos:0,cut:false}}function Rd(e){e!==null&&_$1([e]);}function zd(e,t){let n=t.closest(an$2.thumb);if(n===null)return;let r=n.querySelector(an$2.previewImage),i=r instanceof HTMLImageElement?r.currentSrc||r.src:null;Rd(Ld(e,Ct(n),i,Date.now()));}function Bd(e=document){let t=[];for(let n of e.querySelectorAll(an$2.tagSidebarRow)){let e=n.querySelectorAll(Fd),r=e[e.length-1]?.getAttribute(`href`);if(r==null)continue;let i=null;try{i=new URL(r,window.location.href).searchParams.get(le$1);}catch{i=null;}i!==null&&i.trim().length>0&&t.push(i.trim().toLowerCase());}return t}function Vd(){let e=document.querySelector(Md);if(e instanceof HTMLImageElement&&e.src.length>0)return e.src;let t=document.querySelector(Nd);if(!(t instanceof HTMLVideoElement))return null;let n=t.querySelector(Pd),r=t.currentSrc||t.src||(n instanceof HTMLSourceElement?n.src:``);return r.length>0?r:null}function Hd(e){let t=Vd(),n=t===null?null:Dt$3(t,Number(e));Rd(Ld(e,Bd(),n,Date.now()));}var Ud=`rdw-icon-btn`;function Wd(e,t){return `${t?Fe$3.cardFavRemoveLabel:Fe$3.cardFavAddLabel} ${e}`}function Gd(e,t,n,r){t===`pending`?(e.disabled=true,e.classList.add(Ie$3.cardFavPending)):(e.classList.remove(Ie$3.cardFavMarked,Ie$3.cardFavError,Ie$3.cardFavPending),e.disabled=false,e.removeAttribute(`title`),t===`marked`?(e.setAttribute(`aria-pressed`,`true`),e.setAttribute(`aria-label`,Wd(n,true)),e.classList.add(Ie$3.cardFavMarked)):t===`marked_error`?(e.setAttribute(`aria-pressed`,`true`),e.setAttribute(`aria-label`,Wd(n,true)),e.classList.add(Ie$3.cardFavMarked,Ie$3.cardFavError),e.title=r??Fe$3.cardFavErrorRequest):t===`error`?(e.setAttribute(`aria-pressed`,`false`),e.setAttribute(`aria-label`,Wd(n,false)),e.classList.add(Ie$3.cardFavError),e.title=r??Fe$3.cardFavErrorRequest):(e.setAttribute(`aria-pressed`,`false`),e.setAttribute(`aria-label`,Wd(n,false))));}function Kd(e,t,n=Ie$3.cardFav){let r=document.createElement(`button`);return r.type=`button`,r.className=n,r.textContent=Fe$3.cardFavGlyph,Gd(r,t?`marked`:`idle`,e),r.addEventListener(`click`,t=>{t.preventDefault(),t.stopPropagation(),qd(r,e);}),r}async function qd(e,t){if(e.disabled)return;let n=e.getAttribute(`aria-pressed`)===`true`;if(Gd(e,`pending`,t),n){let n=await Os(t);if(n.status===`removed`){Cs$1(t),Gd(e,`idle`,t);return}Gd(e,`marked_error`,t,Fe$3.cardFavErrorRequest),m$2.warn(`Remove favorite failed`,t,n);return}let r=await Es(t);r.status===`added`||r.status===`already`?(Ss$1(t),zd(t,e),Gd(e,`marked`,t)):r.status===`not_logged_in`?(Gd(e,`error`,t,Fe$3.cardFavErrorNotLoggedIn),m$2.warn(`Favorite requires login`,t)):(Gd(e,`error`,t,Fe$3.cardFavErrorRequest),m$2.warn(`Favorite failed`,t,r));}var Jd=`playlist-menu`,Yd=`Add to collection button`,Xd=[`list`,`post`,`favorites`],K=`rdw-playlist-add`,Zd=`rdw-playlist-add--in`,Qd=`rdw-playlist-menu`,$d=`rdw-playlist-menu--popup`,ef=`data-rdw-post-id`,tf=`+`,nf=`Add to collection`,rf=2147483645,af=260,of=8,sf=4,cf=28,lf=6,uf=38,df=`div.image-list > span > span.thumb`,ff=`rdw-f-favorites-bulk-selecting`,pf=`2px solid var(--rdw-accent)`,mf=`2px`,hf=`keydown`,gf=`pointerdown`,_f=`Escape`,vf=`body.${Kt$2(Jd)}`,yf=`
${vf} .${K} {
  position: absolute;
  top: ${String(uf)}px;
  right: ${String(lf)}px;
  position-anchor: --rdw-img;
  top: calc(anchor(top) + ${String(uf)}px);
  right: calc(anchor(right) + ${String(lf)}px);
  z-index: 5;
  box-sizing: border-box;
  display: inline-grid;
  place-items: center;
  min-width: ${String(cf)}px;
  min-height: ${String(cf)}px;
  width: ${String(cf)}px;
  height: ${String(cf)}px;
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
${vf} ${df} > .${K} {
  position-anchor: ${Ut$2};
}
${vf}.${ff} ${df} > .${K} {
  display: none;
}
${vf} .${Bt$2}:hover .${K},
${vf} .${K}:focus-visible {
  opacity: 0.65;
}
${vf} .${Bt$2} .${K}:hover,
${vf} .${K}:focus-visible {
  opacity: 1;
}
${vf} .${K}:focus-visible {
  outline: ${pf};
  outline-offset: ${mf};
}
${vf} .${K}.${Zd} {
  background: #ffd75e;
  border-color: #c79a00;
  color: #5c4500;
}
${vf} .${Qd} {
  box-sizing: border-box;
  width: ${String(af)}px;
  max-width: calc(100vw - 8px);
  padding: ${String(of)}px;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-l);
  background: var(--rdw-surface);
  color: var(--rdw-text);
  font: 12px/1.35 var(--rdw-font);
}
${vf} .${Qd}.${$d} {
  position: fixed;
  z-index: ${String(rf)};
  box-shadow: var(--rdw-shadow-2);
}
`,bf=()=>null,xf,Sf=null,Cf=false,wf=false;function Tf(e){if(e===null||e.length===0)return null;let t=Number(e);if(!Number.isFinite(t))return null;let n=Math.trunc(t);return n<0?null:n}function Ef(e){return Ys$1(e).length>0}function Df(e,t){let n=Ef(t);e.classList.toggle(Zd,n),e.setAttribute(`aria-pressed`,n?`true`:`false`),e.setAttribute(`aria-label`,`${nf} ${String(t)}`);}function Of(e){return `#p${e}`}function kf(e){let t=e.currentSrc.trim();if(t.length>0)return t;let n=e.getAttribute(`src`);if(n===null)return null;let r=n.trim();return r.length===0?null:r}function Af(e,t){let n=e.querySelector(Of(t)),r=e.querySelectorAll(an$2.previewImage),i=null;for(let e of r){if(!(e instanceof HTMLImageElement))continue;if(n instanceof Element&&n.contains(e)){i===null&&(i=e);continue}let t=kf(e);if(t!==null)return t}if(i!==null)return kf(i);let a=e.querySelector(Ot$3);return a instanceof HTMLImageElement?kf(a):null}function jf(e){let t=e.getAttribute(ef);if(t===null||t.length===0)return null;let n=e.closest(an$2.thumb);return n instanceof HTMLElement?Af(n,t):null}function Mf(e,t){let n=e.querySelector(Of(t));if(n instanceof HTMLAnchorElement)return n;let r=e.querySelector(an$2.thumbLink);return r instanceof HTMLAnchorElement?r:null}function Nf(){Sf!==null&&(ve$1(null,Sf.menu),Sf.menu.remove(),Sf.trigger.setAttribute(`aria-expanded`,`false`),Sf=null,Lf());}function Pf(e){e.key===_f&&Sf!==null&&(e.preventDefault(),Nf());}function Ff(e){if(Sf===null)return;let t=e.target;t instanceof Node&&(Sf.menu.contains(t)||Sf.trigger.contains(t)||Nf());}function If(){Cf||(Cf=true,document.addEventListener(hf,Pf)),wf||(wf=true,document.addEventListener(gf,Ff,true));}function Lf(){Cf&&=(document.removeEventListener(hf,Pf),false),wf&&=(document.removeEventListener(gf,Ff,true),false);}function Rf(e,t){let n=t.getBoundingClientRect(),r=window.innerWidth,i=window.innerHeight;e.style.visibility=`hidden`,e.style.left=`0`,e.style.top=`0`,document.body.append(e);let a=e.offsetWidth,o=e.offsetHeight,s=n.right-a;s<sf&&(s=Math.min(n.left,r-a-sf)),s=Math.max(sf,Math.min(s,r-a-sf));let c=n.bottom+sf;c+o>i-sf&&(c=n.top-o-sf),c<sf&&(c=sf),e.style.left=`${String(s)}px`,e.style.top=`${String(c)}px`,e.style.visibility=``;}function zf(e){let t=document.querySelectorAll(`button.${K}[${ef}="${String(e)}"]`);for(let n of t)n instanceof HTMLButtonElement&&Df(n,e);}function Bf(){for(let e of document.querySelectorAll(`button.${K}[${ef}]`)){let t=Number(e.getAttribute(ef));e instanceof HTMLButtonElement&&Number.isFinite(t)&&Df(e,t);}}function Vf(e,t){let n=document.createElement(`div`);n.className=Qd,n.setAttribute(`role`,`menu`),n.setAttribute(ef,String(e));let r=t?.onChange;return ve$1(ee(jd,{postId:e,readThumbUrl:t?.readThumbUrl??bf,...r===void 0?{}:{onChange:r}}),n),n}function Hf(e,t){if(Sf!==null&&Sf.trigger===e){Nf();return}Nf();let n=Vf(t,{onChange:()=>{zf(t);},readThumbUrl:()=>jf(e)});n.classList.add($d),Rf(n,e),e.setAttribute(`aria-expanded`,`true`),Sf={menu:n,trigger:e,postId:t},If();}function Uf(e,t){if(e.querySelector(`button.${K}`)!==null)return;let n=Tf(t);if(n===null)return;let r=Mf(e,t);if(r===null)return;Tt$3(e);let i=document.createElement(`button`);i.type=`button`,i.className=`${Ud} ${K}`,i.textContent=tf,i.setAttribute(ef,String(n)),i.setAttribute(`aria-haspopup`,`menu`),i.setAttribute(`aria-expanded`,`false`),Df(i,n),i.addEventListener(`click`,e=>{e.preventDefault(),e.stopPropagation(),Hf(i,n);}),r.after(i);}function Wf(e=document){let t=e.querySelectorAll(an$2.thumb);for(let e of t){if(!(e instanceof HTMLElement))continue;let t=ln$2(e)??un$2(e);t!==null&&Uf(e,t);}}function Gf(){xf===void 0&&(xf=ot$4(e=>{Wf(e);}));}function Kf(e){(e.pageKind===`list`||e.pageKind===`favorites`)&&(Wf(document),Gf());}var qf={id:Jd,label:Yd,settingsCaption:`A “+” on each thumbnail and on the post page: it opens the list of custom collections.`,pages:[...Xd],defaultEnabled:true,css:yf,mount:Kf},Jf=`rdw-bulk-collection`,Yf=`rdw-bulk-collection-list`,Xf=`rdw-bulk-collection-item`,Zf=`rdw-bulk-collection-name`,Qf=`rdw-bulk-collection-count`,$f=`rdw-bulk-collection-new`,ep=`rdw-bulk-collection-new-field`,tp=`rdw-bulk-collection-title`,np=`rdw-bulk-collection-note`,rp=`rdw-bulk-collection-error`,ip=`rdw-bulk-collection-foot`,ap=260,op=8,sp=`en-US`,cp={aria:`Add posts to a collection`,filter:`Filter collections…`,empty:`No custom collections yet. Name one below.`,noMatch:`No matching collections`,newName:`New collection name`,create:`Create and add`,nameTaken:`A collection with this name already exists.`},lp=`
.${Jf} {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
  color: var(--rdw-text);
  font: 13px/1.4 var(--rdw-font);
}
.${tp} {
  margin: 0;
  font: 700 15px var(--rdw-font);
  color: var(--rdw-text);
}
.${np} {
  margin: 0;
  color: var(--rdw-muted);
}
.${Yf} {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 2px;
  max-height: ${String(ap)}px;
  overflow-x: hidden;
  overflow-y: auto;
}
button.${Xf} {
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
button.${Xf}:hover,
button.${Xf}:focus-visible {
  background: var(--rdw-surface-2);
}
button.${Xf}:focus-visible {
  outline: 2px solid var(--rdw-accent);
  outline-offset: -2px;
}
.${Zf} {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.${Qf} {
  flex: none;
  color: var(--rdw-muted);
  font-variant-numeric: tabular-nums;
}
form.${$f} {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding-top: 10px;
  border-top: 1px solid var(--rdw-border);
}
.${$f} .${ep} {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
}
.${rp} {
  margin: 0;
  color: var(--rdw-danger);
}
.${ip} {
  display: flex;
  justify-content: flex-end;
}
`.trim();function up(e){return e.trim().toLowerCase()}function dp(e){return `${e.toLocaleString(sp)} ${e===1?`post`:`posts`}`}function fp(e){return `Add ${dp(e)} to a collection`}function pp(e){return e.added===e.total?`Added ${dp(e.total)} to “${e.name}”.`:e.added===0?`All ${dp(e.total)} were already in “${e.name}”.`:`Added ${e.added.toLocaleString(sp)} of ${dp(e.total)} to “${e.name}”; the rest were already there.`}function mp(e){let[t,n]=z$2(``),[r,i]=z$2(``),[a,o]=z$2(``),s=e.open?Js$1():[],c=s.length>op,l=up(t),u=c&&l.length>0?s.filter(e=>e.name.toLowerCase().includes(l)):s,d=()=>{n(``),i(``),o(``),e.onClose();},f=t=>{let n=sc$1(t,e.posts);if(n===null)return;let r={name:n.collection.name,added:n.added,total:e.posts.length};d(),e.onDone(r);},p=()=>{let e=r.trim();e.length!==0&&(G$3().collections.some(t=>up(t.name)===up(e))?o(cp.nameTaken):f(qs$1(e).id));};return K$3(xn$1,{open:e.open,onClose:d,"aria-label":cp.aria,className:Jf,children:[K$3(`style`,{children:lp}),K$3(`h3`,{className:tp,children:fp(e.posts.length)}),c?K$3(Kt$1,{value:t,onChange:n,placeholder:cp.filter,"aria-label":cp.filter}):null,u.length===0?K$3(`p`,{className:np,children:s.length===0?cp.empty:cp.noMatch}):K$3(`div`,{className:Yf,children:u.map(e=>K$3(`button`,{type:`button`,className:Xf,onClick:()=>{f(e.id);},children:[K$3(`span`,{className:Zf,children:e.name}),K$3(`span`,{className:Qf,children:String(e.postIds?.length??0)})]},e.id))}),K$3(`form`,{className:$f,onSubmit:e=>{e.preventDefault(),e.stopPropagation(),p();},children:[K$3(Kt$1,{className:ep,value:r,onChange:e=>{i(e),o(``);},placeholder:cp.newName,"aria-label":cp.newName}),K$3(q$3,{type:`submit`,variant:`primary`,size:`s`,disabled:r.trim().length===0,children:cp.create})]}),a.length>0?K$3(`p`,{className:rp,role:`alert`,children:a}):null,K$3(`div`,{className:ip,children:K$3(q$3,{variant:`secondary`,size:`s`,onClick:d,children:Fe$3.cancel})})]})}var hp=false,gp=`p`;function _p(e){let t=e.querySelectorAll(an$2.favoritesDeleteLink);for(let e of t){if(!(e instanceof HTMLAnchorElement))continue;let t=e.getAttribute(`onclick`);if(t===null)continue;let n=fn$2(t);if(n!==null)return n}let n=ln$2(e);if(n!==null)return n;let r=e.querySelectorAll(`a[id^="${gp}"]`);for(let e of r){if(!(e instanceof HTMLAnchorElement))continue;let t=e.id;if(!t.startsWith(gp))continue;let n=t.slice(1);if(/^\d+$/.test(n))return n}return null}function vp(e=document){let t=[],n=new Set,r=e.querySelectorAll(an$2.thumb);for(let e of r){if(!(e instanceof HTMLElement))continue;let r=_p(e);r===null||n.has(r)||(n.add(r),t.push({thumb:e,postId:r}));}return t}var yp=new Set([`BR`,`HR`,`WBR`]),bp=/^[|\u00b7•·,\s]*$/;function xp(e,t){if(e.nodeType===Node.TEXT_NODE){let t=e.textContent??``;return bp.test(t)}if(!(e instanceof HTMLElement))return  false;if(yp.has(e.tagName))return  true;if(!(e instanceof HTMLAnchorElement))return  false;let n=e.getAttribute(`onclick`);if(n===null)return  false;let r=fn$2(n);return r===null?false:t===null||r===t}function Sp(e){let t=_p(e),n=[e],r=e.nextSibling;for(;r!==null&&!(r instanceof HTMLElement&&r.matches(an$2.thumb)||!xp(r,t));)n.push(r),r=r.nextSibling;for(let e of n)e.remove();}function Cp(e){let t=[],n=new Set,r=e.querySelectorAll(an$2.favoritesDeleteLink);for(let e of r){if(!(e instanceof HTMLAnchorElement))continue;let r=e.getAttribute(`onclick`);if(r===null)continue;let i=fn$2(r);i===null||n.has(i)||(n.add(i),t.push(i));}return t}function wp(){hp||(hp=true,document.addEventListener(`click`,e=>{let t=e.target;if(!(t instanceof Element))return;let n=t.closest(`a`);if(!(n instanceof HTMLAnchorElement))return;let r=n.getAttribute(`onclick`);if(r===null)return;let i=fn$2(r);i!==null&&Cs$1(i);},true));}function Tp(e=document,t=window.location.search){if(P$3(t)!==`favorites`)return;let n=Cp(e),i=[];for(let e of n){let t=Number(e);Number.isFinite(t)&&i.push(Math.trunc(t));}ws$1(i),wp();}var Ep=`keydown`,Dp=`Escape`,Op=`true`,kp=`input, textarea, select, [role="dialog"], [role="listbox"], [role="menu"]`;function Ap(e){if(e.defaultPrevented)return  true;let t=e.composedPath()[0];return t instanceof Element?t.closest(kp)!==null||t.getAttribute(`aria-expanded`)===Op:false}function jp(e,t){let n=V$2(t);n.current=t,B$2(()=>{if(!e)return;let t=e=>{e.key!==Dp||Ap(e)||n.current();};return document.addEventListener(Ep,t),()=>{document.removeEventListener(Ep,t);}},[e]);}var Mp=`favorites-bulk`,Np=`Bulk remove favorites`,Pp=[`favorites`],Fp=`rdw-favorites-bulk`,Ip=`rdw-favorites-bulk`,Lp=`rdw-favorites-pin`,Rp=`rdw-favorites-pin`,zp=`rdw-favorites-filters`,Bp=`rdw-favorites-bulk-summary`,Vp=`rdw-favorites-menu`,Hp=`rdw-favorites-menu-item`,Up=`rdw-favorites-download`,Wp=`rdw-favorites-download-title`,Gp=`rdw-favorites-download-note`,Kp=`rdw-favorites-download-stale`,qp=`rdw-favorites-link`,Jp=200,Yp=12,Xp=`rdw-favorites-bulk-bar`,Zp=`rdw-favorites-bulk-status`,Qp=`rdw-favorites-bulk-confirm`,$p=`rdw-favorites-bulk-confirm-row`,em=`rdw-favorites-bulk-progress`,tm=`rdw-favorites-title`,nm=`Favorites`,rm=`en-US`,im=6,am=`rdw-fav-bulk-selected`,om=`rdw-fav-bulk-check`,sm=`Select`,cm=`Select page`,lm=`Select loaded`,um=`Add to collection`,dm=`Random post`,fm=`Open a random favorite`,pm=`More actions`,mm=`Download all…`,hm=`Sync favorites…`,gm=`Sync first`,_m=`Download all favorites?`,vm=`Download results…`,ym=`Download the results?`,bm=`Download the results`,xm=`Download`,Sm=`Download all favorites`,Cm=`Selected`,wm=864e5,Tm=`Favorites`,Em=Fe$3.cancel,Dm=`Stop`,Om=`Dismiss`,km=`Remove from favorites…`,Am=`Download selected`,jm=`Favorites (selected)`,Mm=`rdw-favorites-bulk-select`,Nm=`Remove `,Pm=` favorite`,Fm=` favorites`,Im=`? This cannot be undone on the site.`,Lm=`Confirm bulk remove favorites`,Rm=` of `,zm=`Deleted `,Bm=` of `,Vm=`. Failed on post `,Hm=`.`,Um=`Stopped after `,Wm=` of `,Gm=`.`,Km=`✓`,qm=`#4c8bf5`,Jm=`#ffffff`,Ym=`2px`,Xm=`2px`,Zm=`1.25rem`,Qm=`0.25rem`,$m=2,eh=`0.75rem`,q=Kt$2(Mp),th=`${q}-selecting`,nh=`
/* While posts are being selected a thumbnail does not lift under the pointer:
   lifted, it stands out of the frame of a selected post. */
body.${th} span.thumb:hover img {
  transform: none !important;
}
body.${q} .${Ip},
body.${q} .${Rp} {
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
body.${q} .${Yc} > .${Ip},
body.${q} .${Yc} > .${Rp} {
  grid-column: 2;
  width: auto;
}
/* The selection bar in the column, over the card of filters. */
body.${q} .${fu} .${Xp} {
  margin-bottom: 8px;
  padding: 10px;
  border: 1px solid var(--rdw-accent);
  border-radius: var(--rdw-radius-l);
  background: var(--rdw-accent-soft);
  color: var(--rdw-text);
}
body.${q} .${fu} .${Xp} > .rdw-btn {
  flex: 1 1 auto;
  white-space: nowrap;
}
/* Holds only the page's heading, which is for screen readers: the menu
   already shows where you are. */
body.${q} .${Ip} {
  position: relative;
  height: 0;
}
/* The space under the header is the row's own padding, so that the row has
   the same space above it as below it, held or not. */
body.${q} div#header {
  margin-bottom: 0 !important;
}
/* The row of search, filters and buttons (or of the selection) stays at the top. */
body.${q} .${Rp} {
  gap: 0.35rem 0.5rem;
  padding: ${String(Yp)}px 0;
  position: sticky;
  top: ${Ya$1};
  z-index: ${String(im)};
  background: var(--rdw-bg);
}
body.${q} .${zp} {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  flex: 1 1 auto;
  min-width: 0;
}
body.${q} .${zp}[hidden] {
  display: none;
}
body.${q} .${tm} {
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
body.${q} .${Ip} .rdw-btn,
body.${q} .${Rp} .rdw-btn {
  font-weight: 500;
}
/* The strip turned into the selection: filled, so that it is seen without
   reading it that a click on a thumbnail now selects (the designer, 17.11.2026). */
body.${q} .${Rp} .${Xp} {
  flex: 1 1 auto;
  padding: 4px 8px;
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-accent-soft);
  color: var(--rdw-text);
}
body.${q} .${Bp} {
  flex: 1 1 8rem;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font: 12px var(--rdw-font);
  color: var(--rdw-muted);
}
.${Vp} {
  padding: 6px;
  gap: 2px;
}
.${Hp} {
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
.${Hp}:hover,
.${Hp}:focus-visible {
  background: var(--rdw-surface-2);
}
.${Up} {
  display: grid;
  gap: 0.5rem;
}
.${Wp} {
  margin: 0;
  font: 700 15px var(--rdw-font);
  color: var(--rdw-text);
}
.${Gp},
.${Kp} {
  margin: 0;
  font: 13px/1.4 var(--rdw-font);
  color: var(--rdw-muted);
}
.${Kp} {
  color: var(--rdw-text);
}
.${qp} {
  padding: 0;
  border: 0;
  background: none;
  color: var(--rdw-accent);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}
.${Up} .${$p} {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.35rem 0.5rem;
  margin-top: 0.25rem;
}
body.${q} .${Mm} {
  display: grid;
  gap: 6px;
  flex: 1 1 auto;
  min-width: 0;
}
body.${q} .${fu} .${Mm} {
  margin-bottom: 8px;
}
body.${q} .${Xp} {
  display: flex;
  flex: 0 1 auto;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.5rem;
  box-sizing: border-box;
}
body.${q} .${Zp} {
  flex: 0 1 auto;
  min-width: 0;
  font: inherit;
  font-size: 0.875rem;
  line-height: 1.3;
}
body.${q} .${Qp} {
  display: grid;
  gap: 0.75rem;
}
body.${q} .${$p} {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.5rem;
}
body.${q} .${em} {
  flex: 1 1 12rem;
  min-width: 8rem;
  max-width: 24rem;
}
body.${q} span.thumb {
  position: relative;
}
body.${q} span.thumb.${am} {
  outline: ${Ym} solid var(--rdw-accent, ${qm});
  outline-offset: ${Xm};
}
body.${q} span.thumb > .${om} {
  position: absolute;
  top: ${Qm};
  left: ${Qm};
  z-index: ${String($m)};
  display: none;
  align-items: center;
  justify-content: center;
  width: ${Zm};
  height: ${Zm};
  border-radius: 999px;
  background: var(--rdw-accent, ${qm});
  color: var(--rdw-surface, ${Jm});
  font-size: ${eh};
  font-weight: 700;
  line-height: 1;
  pointer-events: none;
}
body.${q} span.thumb.${am} > .${om} {
  display: inline-flex;
}
`.trim();function rh(e){return `${Nm}${String(e)}${e===1?Pm:Fm}${Im}`}function ih(e,t){return `${String(e)}${Rm}${String(t)}`}function ah(e,t,n){return `${zm}${String(e)}${Bm}${String(t)}${Vm}${n}${Hm}`}function oh(e,t){return `${Um}${String(e)}${Wm}${String(t)}${Gm}`}function sh(e){return e instanceof DOMException&&e.name===`AbortError`||e instanceof Error&&e.name===`AbortError`}function ch(e,t){return new Promise((n,r)=>{if(t.aborted){r(new DOMException(`Aborted`,`AbortError`));return}let i=setTimeout(()=>{t.removeEventListener(`abort`,a),t.aborted?r(new DOMException(`Aborted`,`AbortError`)):n();},e),a=()=>{clearTimeout(i),r(new DOMException(`Aborted`,`AbortError`));};t.addEventListener(`abort`,a,{once:true});})}function lh(e){if(e.querySelector(`:scope > .rdw-fav-bulk-check`)!==null)return;let t=document.createElement(`span`);t.className=om,t.setAttribute(`role`,`img`),t.setAttribute(`aria-label`,Cm),t.textContent=Km;let n=e.querySelector(`a[id^="p"]`);n instanceof HTMLAnchorElement&&n.parentElement===e?n.after(t):e.prepend(t);}function uh(e=document){let t=e.querySelectorAll(`${an$2.thumb}.${am}`);for(let e of t)e.classList.remove(am);let n=e.querySelectorAll(`${an$2.thumb} > .${om}`);for(let e of n)e.remove();}function dh(e,t){for(let n of e){let e=t.has(n.postId);if(n.thumb.classList.toggle(am,e),e)lh(n.thumb);else {let e=n.thumb.querySelector(`:scope > .${om}`);e!==null&&e.remove();}}}function fh(){let e=document.querySelector(an$2.imageList);if(e!==null&&e.parentNode!==null)return {parent:e.parentNode,before:e};let t=document.querySelector(an$2.thumb);if(t!==null){let e=t.parentElement;if(e!==null&&e.parentNode!==null)return e!==document.body&&e!==document.documentElement?{parent:e.parentNode,before:e}:{parent:e,before:t}}let n=document.querySelector(`#paginator`);return n!==null&&n.parentNode!==null?{parent:n.parentNode,before:n}:{parent:document.body,before:document.body.firstChild}}function ph(e=null){let t=e===null?[...bs$1()].sort((e,t)=>t-e):[...e];t.length===0||Wt()||Gt(Tm,{kind:`ids`,ids:t});}function mh(e){let t=vp(Bu()).find(t=>t.postId===e);if(t!==void 0){Sp(t.thumb);return}let n=document.getElementById(`s${e}`);n instanceof HTMLElement&&Sp(n);}function hh(e,t){let n=e===void 0?NaN:Date.parse(e);if(!Number.isFinite(n))return {text:`Never synced.`,stale:true};let r=Math.max(0,Math.floor((t-n)/wm)),i=r>7;return r===0?{text:`Synced today.`,stale:i}:{text:`Synced ${String(r)} ${r===1?`day`:`days`} ago.`,stale:i}}function gh(e){let t=e===1?`original file`:`original files`;return `${e.toLocaleString(rm)} ${t}: every favorite in the local list, not only this page.`}function _h(e,t){let n=e===1?`original file`:`original files`;return `${e.toLocaleString(rm)} ${n}: favorites matching ${t}, from all pages.`}function vh(){Ce(xe),window.location.hash=Je$3;}function yh(e){let[t,n]=z$2(false),[r,i]=z$2(false),a=V$2(null),[o,s]=z$2(null),c=e.summary.length>0,l=bs$1().size,u=c&&o!==null?o.length:l,d=c?vm:mm,f=()=>{s(c?Xu():null),i(true);},p=hh(Ts$1()?.finishedAt,Date.now()),m=sd(),h=()=>{n(false);},g=()=>{i(false);};return K$3(A$2,{children:[m||!e.stacked?K$3(q$3,{variant:`secondary`,size:`s`,title:fm,onClick:cd,children:[K$3(Et$2,{size:14}),dm]}):null,K$3(q$3,{variant:`secondary`,size:`s`,onClick:e.onSelect,children:sm}),e.stacked&&!m?null:e.stacked?K$3(A$2,{children:[$e$1()?K$3(q$3,{variant:`ghost`,size:`s`,disabled:l===0,onClick:f,children:[K$3(kt$2,{size:14}),d]}):null,K$3(q$3,{variant:`ghost`,size:`s`,onClick:vh,children:[K$3(At$2,{size:14}),hm]})]}):K$3(Tn$1,{label:pm,menuOpen:t,buttonRef:a,onClick:()=>{n(!t);},children:K$3(Dt$2,{size:16})}),K$3(zn$1,{open:t&&!e.stacked,onClose:h,anchorRef:a,widthPx:Jp,alignEnd:true,role:`menu`,"aria-label":pm,className:Vp,children:[$e$1()?K$3(`button`,{type:`button`,role:`menuitem`,className:`${Hp} rdw-kit-focusable`,disabled:l===0,onClick:()=>{h(),f();},children:[K$3(kt$2,{size:16}),d]}):null,K$3(`button`,{type:`button`,role:`menuitem`,className:`${Hp} rdw-kit-focusable`,onClick:()=>{h(),vh();},children:[K$3(At$2,{size:16}),hm]})]}),K$3(xn$1,{open:r,onClose:g,"aria-label":c?bm:Sm,className:Up,children:[K$3(`h3`,{className:Wp,children:c?ym:_m}),K$3(`p`,{className:Gp,children:[c?_h(u,e.summary):gh(u),p.stale?null:` ${p.text}`]}),p.stale?K$3(`p`,{className:Kp,children:[p.text,` `,K$3(`button`,{type:`button`,className:`${qp} rdw-kit-focusable`,onClick:()=>{g(),vh();},children:gm})]}):null,K$3(`div`,{className:$p,children:[K$3(q$3,{variant:`secondary`,size:`s`,onClick:g,children:Em}),K$3(q$3,{variant:`primary`,size:`s`,disabled:u===0,onClick:()=>{g(),ph(c?o:null);},children:`${xm} ${u.toLocaleString(rm)}`})]})]})]})}function bh(e){let t=[];for(let n of vp(Bu())){if(!e.has(n.postId))continue;let r=Number(n.postId);Number.isInteger(r)&&r>0&&t.push({id:r,thumbUrl:Af(n.thumb,n.postId)});}return t}function xh(e){let[t,n]=z$2({kind:`idle`}),[r,i]=z$2(()=>new Set),a=V$2(null),o=V$2(r);o.current=r;let[s,c]=z$2(null),[l,u]=z$2(``),d=t.kind===`selecting`||t.kind===`confirm`||t.kind===`removing`,{onSelectionModeChange:f,onBusyChange:p}=e;B$2(()=>{f(d);},[f,d]);let m=t.kind!==`idle`;B$2(()=>{p(m);},[p,m]),B$2(()=>{d?dh(vp(Bu()),r):uh();},[d,r]),B$2(()=>()=>{a.current?.abort(),uh();},[]),B$2(()=>{if(t.kind===`selecting`||t.kind===`confirm`)return za(e=>{if(e.closest(`.rdw-dialog-backdrop`)!==null)return null;let n=e.closest(an$2.thumb);if(!(n instanceof HTMLElement)||!document.body.contains(n))return null;let r=_p(n);return r===null?null:t.kind===`confirm`?()=>void 0:()=>{u(``),i(e=>{let t=new Set(e);return t.has(r)?t.delete(r):t.add(r),t});}})},[t.kind]);let h=()=>{a.current?.abort(),a.current=null,uh(),u(``),i(new Set),n({kind:`idle`});};jp(t.kind===`selecting`,h);let g=()=>{i(new Set),n({kind:`selecting`});},_=()=>{let e=vp(Bu()).map(e=>e.postId);i(new Set(e));},v=()=>{i(new Set);},y=()=>{let e=o.current.size;e!==0&&n({kind:`confirm`,count:e});},b=()=>{n({kind:`selecting`});},x=async()=>{let e=[...o.current];if(e.length===0){n({kind:`selecting`});return}let t=new AbortController;a.current=t;let{signal:r}=t,s=e.length,c=0;n({kind:`removing`,done:c,total:s});try{for(let t=0;t<e.length;t+=1){if(r.aborted){n({kind:`stopped`,message:oh(c,s)});return}let a=e[t];if(a===void 0)continue;let o=await Os(a,{signal:r});if(r.aborted){n({kind:`stopped`,message:oh(c,s)});return}if(o.status!==`removed`){n({kind:`error`,message:ah(c,s,a)});return}Cs$1(a),mh(a),c+=1,i(e=>{let t=new Set(e);return t.delete(a),t}),n({kind:`removing`,done:c,total:s}),t<e.length-1&&await ch(en,r);}uh(),i(new Set),n({kind:`idle`});}catch(t){if(sh(t)||r.aborted){n({kind:`stopped`,message:oh(c,s)});return}m$2.warn(`favorites-bulk: unexpected removal failure`,t);let i=e[c]??`?`;n({kind:`error`,message:ah(c,s,i)});}finally{a.current===t&&(a.current=null);}},S=()=>{a.current?.abort();};if(t.kind===`idle`)return e.headSlot===null?null:Ft$1(K$3(yh,{onSelect:g,stacked:e.headSlot.classList.contains(uu),summary:e.summary}),e.headSlot);if(t.kind===`removing`){let e=t.total===0?0:t.done/t.total;return K$3(`div`,{className:Xp,children:[K$3(`div`,{className:em,children:K$3(Un$1,{value:e,label:ih(t.done,t.total)})}),K$3(`span`,{className:Zp,children:ih(t.done,t.total)}),K$3(q$3,{variant:`secondary`,size:`s`,onClick:S,children:Dm})]})}if(t.kind===`error`||t.kind===`stopped`)return K$3(`div`,{className:Xp,children:[K$3(`span`,{className:Zp,children:t.message}),K$3(q$3,{variant:`secondary`,size:`s`,onClick:h,children:Om})]});let C=r.size,w=t.kind===`confirm`,T=document.body.classList.contains(Xt$2);return K$3(A$2,{children:[K$3(`div`,{className:Mm,children:[K$3(Jr,{layout:e.inColumn?`stack`:`row`,count:C,selectAllLabel:T?lm:cm,onSelectAll:_,onClear:v,onCancel:h,danger:K$3(q$3,{variant:`danger-quiet`,disabled:C===0||w,onClick:y,children:[K$3(St$2,{size:14}),km]}),children:[K$3(q$3,{variant:`secondary`,disabled:C===0||w,onClick:()=>{c(bh(o.current));},children:um}),$e$1()?K$3(q$3,{variant:`secondary`,disabled:C===0||w,onClick:()=>{let e=bh(o.current).map(e=>e.id);h(),e.length>0&&!Wt()&&Gt(jm,{kind:`ids`,ids:e},`selection`);},children:Am}):null]}),l.length>0||e.summary.length>0?K$3(`span`,{className:Bp,role:l.length>0?`status`:void 0,children:l.length>0?l:e.summary}):null]}),K$3(mp,{open:s!==null,posts:s??[],onClose:()=>{c(null);},onDone:e=>{Bf(),u(pp(e));}}),K$3(xn$1,{open:w,onClose:b,"aria-label":Lm,className:Qp,children:[K$3(`p`,{className:Zp,children:rh(C)}),K$3(`div`,{className:$p,children:[K$3(q$3,{variant:`danger`,size:`s`,onClick:()=>{x();},children:`${Nm}${String(r.size)}`}),K$3(q$3,{variant:`secondary`,size:`s`,onClick:b,children:Em})]})]})]})}function Sh(e){let[t,n]=z$2(null),[r,i]=z$2(false),[a,o]=z$2(``);return K$3(A$2,{children:[K$3(`h1`,{className:tm,children:nm}),Ft$1(K$3(A$2,{children:[K$3(`div`,{className:zp,hidden:r&&e.side===null,children:K$3(ud,{actionsRef:n,onSummary:o,sideHost:e.side,locked:r})}),K$3(xh,{onSelectionModeChange:e.onSelectionModeChange,headSlot:t,summary:a,onBusyChange:i,inColumn:e.side!==null})]}),e.pin)]})}function Ch(e){if(document.getElementById(Fp)!==null)return;let t=fh(),n=document.createElement(`div`);n.id=Fp,n.className=Ip;let r=document.createElement(`div`);r.id=Lp,r.className=Rp,t.parent.insertBefore(n,t.before),t.parent.insertBefore(r,t.before);let i=document.querySelector(an$2.imageList);i!==null&&qu(i);let a=e=>{document.body.classList.toggle(th,e);},o=null;if(t.parent instanceof HTMLElement&&t.parent!==document.body){let e=document.createElement(`div`);e.className=Qc;let i=document.createElement(`div`);i.id=Xc,i.className=Zc;let s=document.createElement(`div`);s.className=fu,o=document.createElement(`div`),o.className=pu,i.append(s,o),e.append(i),t.parent.insertBefore(e,n),t.parent.classList.add(Yc),r.remove(),ve$1(K$3(Sh,{pin:s,side:o,onSelectionModeChange:a}),n);}else ve$1(K$3(Sh,{pin:r,side:o,onSelectionModeChange:a}),n);}var wh={id:Mp,label:Np,pages:[...Pp],defaultEnabled:true,css:nh,mount:Ch},Th=`
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
`,Eh,Dh=`
${wn$1}

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
`;function Oh(){Eh===void 0&&(Eh=ot$4(e=>{Ph(e);}));}function kh(){if(document.getElementById(`ruledesk-web-document-style`)!==null)return;let e=document.createElement(`style`);e.id=De$3,e.textContent=`${dt$3}\n${Th}\n${Dh}`,document.head.append(e);}function Ah(e,t){let n=e.querySelector(`#p${t}`);if(n instanceof HTMLAnchorElement)return n;let r=e.querySelector(an$2.thumbLink);return r instanceof HTMLAnchorElement?r:null}function jh(e,t,n){if(e.querySelector(an$2.cardFavButton)!==null)return;let r=Ah(e,t);if(r===null)return;Tt$3(e);let i=Kd(t,n);i.classList.add(Ud),r.after(i);}function Mh(e){document.body.classList.toggle(Ie$3.gridFavsHidden,!e);}function Nh(e){Mh(e),e&&P$3(window.location.search)===`list`&&Ph();}function Ph(e=document,t=window.location.search){if(Oh(),P$3(t)!==`list`)return;kh();let n=wc$1();if(Mh(n),!n)return;let i=e.querySelectorAll(an$2.thumb);for(let e of i){if(!(e instanceof HTMLElement))continue;let t=ln$2(e);t!==null&&jh(e,t,xs$1(t));}}var Fh=`new`,Ih=/^id:>(\d+)$/,Lh=` new`,Rh=`Marked as seen up to #`,zh=`Only new`,Bh=`Show all`;function Vh(){let e=Lo$2();return e!==null&&e.length>0?[...e]:Uc$1()}function Hh(){let e=Lo$2();Us$1(),e!==null&&e.length>0&&Io$1(e);}function Uh(e){let t=new URLSearchParams(e).get(`pid`);if(t===null||t.trim().length===0)return 0;let n=Number(t);return !Number.isFinite(n)||n<0?0:Math.floor(n)}function Wh(e){let t=0,n=e.querySelectorAll(an$2.thumb);for(let e of n){let n=ln$2(e);if(n===null)continue;let r=Number(n);Number.isFinite(r)&&r>t&&(t=r);}return t}function Gh(e,t){let n=0,r=e.querySelectorAll(an$2.thumb);for(let e of r){let r=ln$2(e);if(r===null)continue;let i=Number(r);Number.isFinite(i)&&i>t&&(n+=1);}return n}function Kh(e){let t=e.trim().split(/\s+/).filter(e=>e.length>0),n=t[t.length-1];return n!==void 0&&Ih.test(n)}function qh(e){let t=e instanceof Document?e.getElementById(Oe$3):e.querySelector(`#${Oe$3}`);t!==null&&t.remove();}function Jh(){let e=document.createElement(`div`);return e.id=Oe$3,e.className=Ie$3.updatesBar,e}function Yh(e,t){e.parentElement?.insertBefore(t,e);}function Xh(e){return e.querySelector(an$2.postListContent)??e.querySelector(an$2.contentRoot)}function Zh(e){let t=e.querySelectorAll(`${an$2.thumb}.${Fh}`);for(let e of t)e.classList.remove(Fh);}function Qh(e,t){if(Kh(e)){let t=document.createElement(`a`);return t.className=Ie$3.secondaryButton,t.href=uo$1(go$1(e)),t.textContent=Bh,t}if(t===0)return null;let n=`${go$1(e)} ${Ce$3}${String(t)}`,r=document.createElement(`a`);return r.className=Ie$3.secondaryButton,r.href=uo$1(n),r.textContent=zh,r}function $h(e,t,n){let r=Qh(t,n);r!==null&&e.append(r);}function eg(e,t){let n=Xh(e);if(n===null){m$2.warn(Fe$3.updatesBarMissingHost);return}let r=Jh(),i=Vc$1(),a=document.createElement(`p`);a.className=Ie$3.hint,a.textContent=`${Fe$3.noNewPostsSince}${String(i)}`;let o=document.createElement(`a`);o.className=Ie$3.secondaryButton,o.href=uo$1(go$1(t)),o.textContent=Bh;let s=document.createElement(`div`);s.className=Ie$3.updatesBarActions,s.append(a,o),r.append(s),n.insertBefore(r,n.firstChild);}function tg(e){let t=Jh(),n=document.createElement(`p`);n.className=Ie$3.hint,n.textContent=Fe$3.updatesPartialHint,t.append(n),Yh(e,t);}function ng(e,t,n,r){let i=Jh(),a=Vc$1();if(Uh(t)>0){let t=document.createElement(`p`);t.className=Ie$3.hint,t.textContent=Fe$3.goToPageOneToMark,i.append(t),Yh(e,i);return}let o=Gh(e,a),s=document.createElement(`div`);if(s.className=Ie$3.updatesBarActions,o===0){let t=document.createElement(`p`);t.className=Ie$3.hint,t.textContent=`${Fe$3.noNewPostsSince}${String(a)}`,s.append(t),r||$h(s,n,a),i.append(s),Yh(e,i);return}let c=document.createElement(`p`);c.className=Ie$3.hint,c.textContent=`${String(o)}${Lh}`;let l=document.createElement(`button`);l.type=`button`,l.className=Ie$3.primaryButton,l.textContent=Fe$3.markAllSeen,l.addEventListener(`click`,()=>{let t=Math.max(Vc$1(),Wh(e));if(Hc$1(t),Zh(document),!r&&Kh(n)){let e=go$1(n);window.location.assign(uo$1(`${e} ${Ce$3}${String(t)}`));return}i.replaceChildren();let a=document.createElement(`p`);a.className=Ie$3.hint,a.textContent=`${Rh}${String(t)}`;let o=document.createElement(`div`);o.className=Ie$3.updatesBarActions,o.append(a),r||$h(o,n,t),i.append(o);}),s.append(c,l),r||$h(s,n,a),i.append(s),Yh(e,i);}function rg(e=document,t=window.location.search,n={}){if(P$3(t)!==`list`)return;let i=new URLSearchParams(t).get(le$1);if(i===null||i.trim().length===0)return;let a=Vh();Hh();let o=n.merged===true,s=o||bo$1(i,a),c=!o&&xo$1(i,a);if(!s&&!c){qh(e);return}qh(e),kh();let l=e.querySelector(an$2.imageList);l===null?eg(e,i):c?tg(l):ng(l,t,i,o);}function ig(e,t){return {cover:xt(e,4),postCount:Ot(e,t),lastPostId:St(e)}}async function ag(e){let t=so$1([{tag:e,type:xe$3}]),n=await fetch(t,{method:`GET`,credentials:be$2});if(!n.ok)throw Error(`HTTP ${String(n.status)}`);let r=await n.text();return ig(new DOMParser().parseFromString(r,`text/html`),e)}var og=`0`,sg;function cg(e,t){let n=new Map;for(let r of e.querySelectorAll(an$2.thumb)){let e=ln$2(r),i=e===null?NaN:Number(e);if(Number.isFinite(i))for(let e of Ct(r))t.has(e)&&i>(n.get(e)??0)&&n.set(e,i);}n.size>0&&sl$1(n);}function lg(e){let t=new URLSearchParams(e).get(`pid`);return t===null||t.length===0||t===og}function ug(e){let t=new Set(Uc$1());if(t.size===0)return;let n=new URLSearchParams(e).get(`tags`)??``,r=Tt(n);r!==null&&t.has(r)&&lg(e)&&!jo$1(n)&&ol$1(r,ig(document,r)),cg(document,t),sg===void 0&&(sg=ot$4(e=>{cg(e,new Set(Uc$1()));}));}var dg=an$2.imageList,fg=an$2.thumb,pg=`div.pagination`,mg=`a[alt="next"]`;function hg(e){let t=new URL(e,window.location.href);if(t.origin!==window.location.origin)throw Error(`Cross-origin next page URL rejected: ${t.origin}`);return t.href}function gg(e){let t=e.querySelector(pg);if(t===null)return null;let n=t.querySelector(mg);if(!(n instanceof HTMLAnchorElement))return null;let r=n.getAttribute(`href`);if(r===null||r.length===0||r===`#`)return null;try{return hg(r)}catch{return null}}function _g(e){let t=e.querySelector(dg);return t===null?[]:Array.from(t.querySelectorAll(fg))}async function vg(e){let t=hg(e),n=await fetch(t,{method:`GET`,credentials:be$2});if(!n.ok)throw Error(`HTTP ${String(n.status)}`);let r=await n.text(),i=new DOMParser().parseFromString(r,`text/html`);return {thumbs:_g(i),nextUrl:gg(i)}}var yg=`rdw-feed-merged`,bg=`rdw-feed-merge-pending`,xg=`rdw-blacklisted`,Sg=`rdw-feed-merge-status`,Cg=`rdw-feed-merge-sentinel`,wg=`rdw-feed-merge-retry`,Tg=1e3,Eg=2,Dg=`0`,Og=`div.pagination a[alt="next"]`,kg=`#`,Ag=`score:`,jg=`rating:`,Mg=/\s+/,Ng=`Loading feed: part `,Pg=` of `,Fg=`End of feed`,Ig=`Failed to load a part of the feed`,Lg=`Retry`,Rg=`
body.${yg} ${an$2.pagination} {
  display: none;
}
body.${yg} ${an$2.thumb}.${bg},
body.${yg} ${an$2.thumb}.${xg} {
  display: none !important;
}
.${Cg} {
  display: block;
  width: 100%;
  height: 1px;
}
.${Sg} {
  display: block;
  width: 100%;
  margin: 12px 0;
  text-align: center;
  font-size: 13px;
  color: var(--rdw-muted);
}
.${wg} {
  margin-left: 8px;
  padding: 2px 8px;
  font: inherit;
  color: var(--rdw-text);
  background: var(--rdw-surface);
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  cursor: pointer;
}
`;function zg(e,t,n){let r=[];for(;;){let i=-1,a=-1;for(let n=0;n<e.length;n+=1){let o=e[n];if(o===void 0)continue;let s=o.buffer[0];if(s===void 0){if(o.nextUrl!==null)return {emitted:r,starving:n};continue}let c=t(s);c>a&&(a=c,i=n);}let o=e[i]?.buffer.shift();if(o===void 0)return {emitted:r,starving:null};n.has(a)||(n.add(a),r.push(o));}}function Bg(e){let t=ln$2(e),n=t===null?NaN:Number(t);return Number.isFinite(n)?n:0}function Vg(e,t){return Bg(t)-Bg(e)}function Hg(e){return new Promise(t=>{window.setTimeout(t,e);})}function Ug(){let e=document.querySelector(Og)?.getAttribute(`href`)??``;if(e.length===0||e===kg)return null;try{return new URL(e,window.location.href).href}catch{return null}}function Wg(e,t){let n=e.querySelector(an$2.previewImage),r=n?.getAttribute(`title`)?.trim()??n?.getAttribute(`alt`)?.trim()??``,i=[],a=0,o=``;for(let e of r.split(Mg)){let t=e.toLowerCase();if(t.startsWith(Ag)){let t=Number(e.slice(6));a=Number.isFinite(t)?t:a;}else t.startsWith(jg)?o=e.slice(7):e.length>0&&i.push(e);}aa(i,a,o,t)&&e.classList.add(xg);}function Gg(e,t,n){let r=new URLSearchParams(e),i=r.get(`pid`);if(i!==null&&i.length>0&&i!==Dg)return  false;let a=r.get(`tags`)??``;return ho$1(a,t,n)===0}function Kg(e){let t=document.querySelector(an$2.imageList);if(t===null)return  false;let n=mo$2(e.artistTags,e.groupSize);document.body.classList.add(yg);let r=Array.from(t.querySelectorAll(an$2.thumb));for(let e of r)e.classList.add(bg);let i=n.map((e,t)=>t===0?{buffer:r.sort(Vg),nextUrl:Ug()}:{buffer:[],nextUrl:uo$1(e)}),a=document.createElement(`div`);a.className=Cg,a.setAttribute(`aria-hidden`,`true`);let o=document.createElement(`div`);o.className=Sg,o.setAttribute(`role`,`status`),t.after(a,o);let s=new Set,c=0,l=false,u=0,d=()=>{let e=Eg*window.innerHeight;return a.getBoundingClientRect().top<window.innerHeight+e},f=n=>{if(n.length!==0){for(let e of n)e.classList.remove(bg),t.append(e);c+=n.length,st$4(t),e.onChange();}},p=async e=>{let t=i[e];if(t===void 0||t.nextUrl===null)return;let n=Tg-(Date.now()-u);u>0&&n>0&&await Hg(n),u=Date.now(),o.textContent=`${Ng}${String(e+1)}${Pg}${String(i.length)}…`,X$1(N);let r=await vg(t.nextUrl),a=ra(),s=[];for(let e of r.thumbs){let t=document.importNode(e,true);Wg(t,a),s.push(t);}t.buffer.push(...s.sort(Vg)),t.nextUrl=r.nextUrl,o.textContent=``;},m=async()=>{if(!l){l=true;try{for(;;){let e=zg(i,Bg,s);if(f(e.emitted),e.starving===null){o.textContent=Fg;return}if(c>0&&!d())return;try{await p(e.starving);}catch(e){m$2.warn(`feed-merge: fetch failed`,e),o.textContent=Ig;let t=document.createElement(`button`);t.type=`button`,t.className=wg,t.textContent=Lg,t.addEventListener(`click`,()=>{o.textContent=``,m();}),o.append(t);return}}}finally{l=false;}}};if(typeof IntersectionObserver==`function`){let e=`${String(Eg*window.innerHeight)}px`;new IntersectionObserver(e=>{e.some(e=>e.isIntersecting)&&m();},{root:null,rootMargin:e,threshold:0}).observe(a);}return m(),true}var qg=`feed`,Jg=`Feed in site menu`,Yg=[`list`,`post`,`favorites`,`other`],Xg=`content`,Zg=`Posts`,Qg=`Feed`,$g=`current-page`,e_=`Follow artists to build your feed`,t_=`feed: Posts menu item not found`;function n_(){let e=Lo$2();return e!==null&&e.length>0?[...e]:Uc$1()}function r_(){let e=Lo$2();Us$1(),e!==null&&e.length>0&&Io$1(e);}var i_=6,a_=6,o_=`pageshow`,s_=`click`,c_=Kt$2(qg),l_=`
body.${c_} span.thumb.new.${Bt$2} {
  position: relative;
}
body.${c_} span.thumb.new.${Bt$2}::after {
  content: "NEW";
  position: absolute;
  z-index: 4;
  left: ${String(i_)}px;
  top: ${String(a_)}px;
  background: var(--rdw-accent);
  color: var(--rdw-surface);
  font: 700 9.5px system-ui, Segoe UI, sans-serif;
  letter-spacing: 0.05em;
  padding: 2px 6px;
  border-radius: 9px;
  pointer-events: none;
}
@supports (anchor-name: --a) {
  body.${c_} span.thumb.new.${Bt$2}::after {
    position-anchor: ${Ht$2};
    left: calc(anchor(left) + ${String(i_)}px);
    top: calc(anchor(top) + ${String(a_)}px);
  }
}
`,u_,d_=false,f_=null;function p_(){let e=document.getElementById(Xg),t=document.querySelectorAll(`a`);for(let n of t){if(!(n instanceof HTMLAnchorElement)||(n.textContent?.trim()??``)!==Zg)continue;let t=n.closest(`li`);if(t!==null&&!(e!==null&&e.contains(t)))return t}return null}function m_(){let e=n_();return e.length===0?qe$3:po$1(e,Fc$1())}function h_(){let e=document.getElementById(ut$3);if(!(e instanceof HTMLLIElement))return null;let t=e.querySelector(`a`);return t instanceof HTMLAnchorElement?t:null}function g_(){let e=h_();e!==null&&(e.href=m_(),n_().length===0?e.title=e_:e.removeAttribute(`title`));}function __(){g_();}function v_(){g_();}function y_(e){d_||(d_=true,window.addEventListener(o_,__)),f_!==e&&(f_!==null&&f_.removeEventListener(s_,v_),e.addEventListener(s_,v_),f_=e);}function b_(){let e=document.getElementById(ut$3);if(e instanceof HTMLLIElement){let t=e.querySelector(`a`);return t instanceof HTMLAnchorElement&&(g_(),y_(t)),e}let t=p_();if(t===null)return m$2.warn(t_),null;let n=document.createElement(`li`);n.id=ut$3;let r=document.createElement(`a`);return r.textContent=Qg,r.href=m_(),n_().length===0&&(r.title=e_),n.append(r),t.after(n),y_(r),n}function x_(e,t){let n=new URLSearchParams(e).get(le$1);return n===null||n.trim().length===0?false:bo$1(n,t)||xo$1(n,t)||ho$1(n,t,Fc$1())>=0}function S_(e,t,n){let r=p_();t?(r?.classList.remove($g),e.classList.add($g)):(e.classList.remove($g),n===`list`&&r?.classList.add($g));}function C_(e,t){if(t===0)return;kh();let n=e.querySelectorAll(an$2.thumb);for(let e of n){if(!(e instanceof HTMLElement))continue;let n=ln$2(e);if(n===null)continue;let r=Number(n);!Number.isFinite(r)||r<=t||(Tt$3(e),e.classList.add(`new`));}}function w_(){u_===void 0&&(u_=ot$4(e=>{C_(e,Vc$1());}));}function T_(e){let t=b_();if(t===null)return;let n=n_();r_();let r=x_(e.search,n);if(S_(t,r,e.pageKind),e.pageKind===`list`&&ug(e.search),!r||e.pageKind!==`list`)return;C_(document,Vc$1()),w_();let i=Gg(e.search,n,Fc$1());rg(document,e.search,{merged:i}),i&&Kg({artistTags:n,groupSize:Fc$1(),onChange:()=>{rg(document,e.search,{merged:i});}});}var E_={id:qg,label:Jg,pages:[...Yg],defaultEnabled:true,css:`${l_}\n${Rg}`,mount:T_},D_=`feed-counter`,O_=`New posts counter beside Feed`,k_=`rdw-feed-count`,A_=`ruledesk-web.feed-count`,j_=Kt$2(D_),M_=`+`,N_=`
body.${j_} .${k_} {
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
body:not(.${j_}) .${k_} {
  display: none;
}
`.trim();function P_(e){return typeof e!=`object`||!e?false:`count`in e&&typeof e.count==`number`&&`more`in e&&typeof e.more==`boolean`&&`at`in e&&typeof e.at==`number`&&`seen`in e&&typeof e.seen==`number`&&`href`in e&&typeof e.href==`string`}function F_(){try{let e=window.localStorage.getItem(A_),t=e===null?null:JSON.parse(e);return P_(t)?t:null}catch{return null}}function I_(e){try{window.localStorage.setItem(A_,JSON.stringify(e));}catch{}}function L_(e,t){let n=0;for(let r of e){let e=ln$2(r),i=e===null?NaN:Number(e);Number.isFinite(i)&&i>t&&(n+=1);}return {count:n,more:e.length>0&&n===e.length}}function R_(e){return e.count<=0?``:e.more?`${String(e.count)}${M_}`:String(e.count)}function z_(e,t,n,r){return e!==null&&e.seen===n&&e.href===r&&t-e.at>=0&&t-e.at<9e5}function B_(e,t){let n=R_(t),r=e.parentElement?.querySelector(`.rdw-feed-count`)??null;if(n.length===0){r?.remove();return}let i=r??document.createElement(`span`);i.className=k_,i.textContent=n,i.setAttribute(`aria-label`,`${n} new posts in the feed`),r===null&&e.append(i);}function V_(e,t){try{return new URL(e,window.location.href).search===new URL(t,window.location.href).search}catch{return  false}}function H_(e){let t=document.getElementById(ut$3)?.querySelector(`a`);if(!(t instanceof HTMLAnchorElement))return;let n=Vc$1(),r=t.href;if(n<=0||Uc$1().length===0||!r.includes(`tags=`)||V_(r,window.location.href))return;let i=Date.now(),a=F_();a!==null&&z_(a,i,n,r)?B_(t,a):tt(N,()=>vg(r)).then(e=>{let i=L_(e.thumbs,n);I_({...i,at:Date.now(),seen:n,href:r}),B_(t,i);}).catch(e=>{I_({count:0,more:false,at:Date.now(),seen:n,href:r}),m$2.warn(`feed-counter: request failed`,e);});}var U_={id:D_,label:O_,pages:[`list`,`post`,`favorites`,`other`],defaultEnabled:true,settingsCaption:`Asks the site for the first page of the feed when a page loads, at most once in 15 minutes. Counts the first feed group only.`,css:N_,mount:H_},W_=`div.link-list ul`,G_=`div#stats`,K_=`#fit-to-screen div.flexi, div#right-col div.flexi, div.flexi`,q_=`image`,J_=`div#header`,Y_=`post-comments`,X_=`comment-list`,Z_=[`Edit`,`Resize image`,`Report to moderation`,`Add Note`],Q_=`psc`,$_=/^(Id|Posted|Size|Source|Rating|Score)\s*:/i,ev=/\s+/g,tv=/\bby\b/i,nv=/^\d+$/,rv=`span, b, strong, em, small`,iv=`nofollow noreferrer`;function av(e){for(let t of Z_)if(t===e)return  true;return  false}function ov(e){return e.replace(ev,` `).trim()}function sv(e){let t=ov(e.textContent??``),n=$_.exec(t);if(n===null)return null;let r=n[1];return r===void 0?null:r.charAt(0).toUpperCase()+r.slice(1).toLowerCase()}var cv=`div.status-notice`,lv=`This post was deleted`,uv=/Reason:\s*(.*?)\s*(?:\/\s*MD5:|$)/,dv=/MD5:\s*([0-9a-f]+)/i;function fv(e=document){for(let t of e.querySelectorAll(cv)){let e=t.textContent?.trim()??``;if(t instanceof HTMLElement&&e.startsWith(lv))return {element:t,reason:uv.exec(e)?.[1]??``,md5:dv.exec(e)?.[1]??``}}return null}function pv(){let e=document.querySelector(K_);return e instanceof HTMLElement?e:null}function mv(e,t){for(let n of e.children)if(n instanceof HTMLElement&&n.id!==t&&n.querySelector(`video`)!==null)return n;for(let n of e.children)if(n instanceof HTMLElement&&n.id!==t&&n.querySelector(`#image`)!==null)return n;for(let n of e.children)if(n instanceof HTMLElement&&n.id!==t)return n;return null}function hv(){let e=document.querySelector(W_),t=e===null?[document]:[e,document];for(let e of t){let t=e.querySelectorAll(`a[href]`);for(let e of t){if(!(e instanceof HTMLAnchorElement)||e.textContent?.trim()!==`Original image`)continue;let t=e.getAttribute(`href`);if(t!==null&&t.length!==0&&t!==`#`)return e}}return null}function gv(){let e=document.querySelector(W_);if(e===null)return [];let t=[],n=e.querySelectorAll(`a[href]`);for(let e of n){if(!(e instanceof HTMLAnchorElement))continue;let n=e.textContent?.trim()??``;av(n)&&t.push({text:n,anchor:e});}return t}function _v(e){return `${Q_}${e}`}function vv(e){let t=document.getElementById(_v(e));return t instanceof HTMLElement?t:null}function yv(e){let t=vv(e);if(t===null)return null;let n=t.textContent?.trim()??``;return n.length>0?n:null}function bv(e,t){let n=vv(e);n!==null&&(n.textContent=String(t));}function xv(e,t){let n=vv(e);if(n===null)return ()=>{};let r=new MutationObserver(()=>{t(n.textContent?.trim()??``);});return r.observe(n,{characterData:true,childList:true,subtree:true}),()=>{r.disconnect();}}function Sv(e){let t=[],n=e.querySelector(`a[href]`),r=null,i=null;if(n instanceof HTMLAnchorElement){let e=n.getAttribute(`href`),t=n.textContent?.trim()??``;e!==null&&e.length>0&&t.length>0&&(r=t,i=e);}let a=e.cloneNode(true);if(!(a instanceof HTMLElement))return t;for(let e of a.querySelectorAll(`a`))e.remove();for(let e of a.querySelectorAll(`br`))e.replaceWith(` `);let o=ov(a.textContent??``);return o=o.replace(/^Posted\s*:\s*/i,``),o=o.replace(tv,``).trim(),o=ov(o),o.length>0&&t.push({label:`Posted`,value:o,href:null}),r!==null&&i!==null&&t.push({label:`By`,value:r,href:i}),t}function Cv(e){let t=e.querySelector(`a[href]`);if(!(t instanceof HTMLAnchorElement))return null;let n=t.getAttribute(`href`);if(n===null||n.length===0||n===`#`||!/^https?:/i.test(t.href))return null;let r=t.textContent?.trim()??``;return {label:`Source`,value:r.length>0?r:n,href:n}}function wv(e,t){let n=ov(e.textContent??``),r=`${t}:`,i=n.toLowerCase(),a=r.toLowerCase();if(!i.startsWith(a))return null;let o=n.slice(r.length).trim();return o.length===0?null:{label:t,value:o,href:null}}function Tv(){let e=document.querySelector(G_);if(e===null)return [];let t=[],n=new Set,r=e.querySelectorAll(`li`);for(let e of r){if(!(e instanceof HTMLElement))continue;let r=sv(e);if(r!==null&&r!==`Score`){if(r===`Posted`)for(let r of Sv(e))n.has(r.label)||(n.add(r.label),t.push(r));else if(r===`Source`){if(n.has(`Source`))continue;let r=Cv(e);r!==null&&(n.add(`Source`),t.push(r));}else if(r===`Id`||r===`Size`||r===`Rating`){if(n.has(r))continue;let i=wv(e,r);i!==null&&(n.add(r),t.push(i));}}}return t}var Ev=/^(\d+)\s*x\s*(\d+)$/i;function Dv(){let e=Tv().find(e=>e.label===`Size`);return e===void 0?null:Ov(e.value)}function Ov(e){let t=Ev.exec(e.trim());if(t===null)return null;let n=Number(t[1]),r=Number(t[2]);return n>0&&r>0?{width:n,height:r}:null}var kv=iv;function Av(e){let t=ov(e.textContent??``);return nv.test(t)?t:null}function jv(e){for(let t of e.querySelectorAll(rv)){let e=Av(t);if(e!==null)return e}let t=Av(e);return t===null?null:t}function Mv(e){let t=e.closest(`li`);if(t!==null){for(let n of t.querySelectorAll(rv)){if(e.contains(n))continue;let t=Av(n);if(t!==null)return t}for(let e of t.childNodes){if(e.nodeType!==Node.TEXT_NODE)continue;let t=ov(e.textContent??``);if(nv.test(t))return t}let n=[t.previousElementSibling,t.nextElementSibling];for(let e of n){if(!(e instanceof HTMLElement)||e.querySelector(`a[onclick^="iCame("]`)!==null||sv(e)!==null)continue;let t=jv(e);if(t!==null)return t}}let n=e.nextElementSibling;if(n!==null){let e=jv(n);if(e!==null)return e}return null}function Nv(){let e=document.querySelector(`div#stats > ul`)?.querySelector(`a[onclick^="iCame("]`)??document.querySelector(`a[onclick^="iCame("]`);return e instanceof HTMLAnchorElement?{anchor:e,count:Mv(e)}:null}function Pv(e){let t=document.querySelector(J_);return t instanceof HTMLElement?t.getBoundingClientRect().height+e:e}function Fv(){let e=document.getElementById(Y_);return e instanceof HTMLElement?e:null}var Iv=/^(\d+)\s+comments?\b/i;function Lv(){let e=document.getElementById(X_);if(e===null)return null;for(let t of e.childNodes){if(t.nodeType!==Node.TEXT_NODE)continue;let e=ov(t.textContent??``);if(e.length===0)continue;let n=Iv.exec(e);if(n===null)return null;let r=n[1];if(r===void 0)return null;let i=Number(r);return Number.isFinite(i)?Math.trunc(i):null}return null}var Rv=`gif-post`,zv=`Play GIFs on the post page`,Bv=/\.gif$/i,Vv=`data-rdw-gif`;function Hv(e){try{return new URL(e,window.location.href).pathname}catch{return e}}function Uv(e){return Bv.test(Hv(e))}function Wv(e=document,t){let n=e.querySelector(`img#${q_}`),r=hv()?.href??``;return !(n instanceof HTMLImageElement)||!Uv(r)||Uv(n.currentSrc||n.src)?false:(n.setAttribute(Vv,``),n.src=r,true)}function Gv(e){document.body.classList.contains(Kt$2(Rv))&&Wv();}var Kv={id:Rv,label:zv,pages:[`post`],defaultEnabled:true,settingsCaption:`The site shows a still copy of a GIF until its original is opened. With this on, the original is loaded at once.`,css:``,mount:Gv},qv=`full-image`,Jv=`Load full-size image`,Yv=`Sharper and larger, but the page opens slower: originals are often several MB.`,Xv=`data-rdw-full`,Zv=/\.(?:jpe?g|png|webp|bmp)$/i,Qv=`(min-width: 1100px)`,$v=`body.${Kt$2(qv)}`,ey=`img#${q_}[${Xv}]`,ty=`
${$v} ${ey} {
  width: auto !important;
  height: auto !important;
  max-width: 100%;
}
@media ${Qv} {
  ${$v} div#post-view > div#right-col {
    flex-grow: 1;
    min-width: 0;
  }
  ${$v} div.flexi:has(${ey}) {
    flex-wrap: nowrap;
  }
  ${$v} div.flexi > :has(${ey}) {
    flex: 0 1 auto;
    min-width: 0;
  }
  ${$v} div.flexi:has(${ey}) > #${Gt$2} {
    flex-shrink: 0;
  }
}
`.trim();function ny(e){try{return new URL(e,window.location.href).pathname}catch{return e}}function ry(e,t){if(t.length===0||Uv(t))return null;let n=ny(t);return !Zv.test(n)||ny(e.currentSrc||e.src)===n?null:t}function iy(e=document,t){let n=e.querySelector(`img#${q_}`);if(!(n instanceof HTMLImageElement))return  false;let r=ry(n,hv()?.href??``);if(r===null)return  false;let i=new Image;return i.addEventListener(`load`,()=>{n.isConnected&&(n.setAttribute(Xv,``),n.src=r);}),i.src=r,true}function ay(e){document.body.classList.contains(Kt$2(qv))&&iy();}var oy={id:qv,label:Jv,pages:[`post`],defaultEnabled:false,settingsCaption:Yv,css:ty,mount:ay},sy=class extends Error{failure;constructor(e,t){super(t),this.failure=e;}},cy=`tag-type-`,ly=[`artist`,`character`,`copyright`,`general`,`metadata`],uy=/\D/g,dy=`?`,fy=` `,py=`webm-thumb`,my=429,hy=2,gy=1e3,_y=2,vy=`(`,yy=`)`,by=`~`,xy=`pid`,Sy=20,Cy=1100,wy=`-`,Ty=new Set(`highres.hi_res.absurdres.absurd_res.lowres.text.english_text.japanese_text.dialogue.speech_bubble.watermark.signature.artist_name.artist_signature.patreon_username.twitter_username.web_address.url.dated.logo.ai_generated.ai_assisted.stable_diffusion.novelai.commentary.tagme.translated.translation_request.sound.animated.video.1girls.1boy.1girl.2girls.2boys.3girls.solo.duo.female.male.female_only.male_only.solo_female.solo_male.solo_focus.female_focus.male_focus.male/female.straight.human.simple_background.looking_at_viewer.explicit.questionable.safe.nsfw.adult.mature.perfect_body.beautiful.sexy.hot.cute.pretty`.split(`.`)),Ey=new Set([`patreon`,`patreon_reward`,`fanbox`,`pixiv`,`pixiv_fanbox`,`fantia`,`twitter`,`x_(twitter)`,`subscribestar`,`gumroad`,`ko-fi`,`boosty`,`skeb`,`onlyfans`,`fansly`,`deviantart`,`newgrounds`,`tumblr`,`discord`,`itch.io`,`original`,`original_character`,`commission`]),Dy=new Set([`original_character`,`oc`]),Oy=1e3,ky=3,Ay=2,jy=4,My=`favorites`,Ny=`similar`,Py=`In your favorites`,Fy=`Similar`;function Iy(e){for(let t of e.classList){if(!t.startsWith(cy))continue;let e=ly.find(e=>e===t.slice(9));if(e!==void 0)return e}return null}var Ly=/&#(\d+);/g,Ry={"&amp;":`&`,"&quot;":`"`,"&lt;":`<`,"&gt;":`>`},zy=/&(?:amp|quot|lt|gt);/g;function By(e){return e.replace(Ly,(e,t)=>String.fromCodePoint(Number(t))).replace(zy,e=>Ry[e]??e)}function Vy(e){let t=[...e.querySelectorAll(`a[href]`)].reverse();for(let e of t){let t=e.getAttribute(`href`)??``,n=t.indexOf(dy);if(n<0)continue;let r=By(new URLSearchParams(t.slice(n+1)).get(`tags`)?.trim().toLowerCase()??``);if(r.length>0&&!r.includes(fy))return r}return null}function Hy(e=document){let t=[],n=new Set;for(let r of e.querySelectorAll(an$2.tagSidebarRow)){let e=Iy(r),i=Vy(r);if(e===null||i===null||n.has(i))continue;n.add(i);let a=(r.querySelector(an$2.tagCount)?.textContent??``).replace(uy,``);t.push({tag:i,kind:e,count:a.length===0?0:Number(a)});}return t}function Uy(e){let t=e.querySelector(an$2.imageList);if(t===null)return [];let n=[];for(let e of t.querySelectorAll(an$2.thumb)){let t=Number(ln$2(e)??NaN),r=e.querySelector(an$2.previewImage),i=r?.getAttribute(`src`)??``;Number.isFinite(t)&&r!==null&&i.length!==0&&n.push({id:t,thumb:i,tags:Ct(e),video:r.classList.contains(py)});}return n}function Wy(e){return 1/Math.log(hy+(e>0?e:gy))}function Gy(e,t,n){let r=new Map(e.map(e=>[e.tag,Wy(e.count)])),i=[];for(let e of t){if(e.id===n)continue;let t=0,a=0;for(let n of new Set(e.tags)){let e=r.get(n);e!==void 0&&(t+=1,a+=e);}i.push({...e,shared:t,score:a});}return i.sort((e,t)=>t.score-e.score||t.shared-e.shared||t.id-e.id)}function Ky(e,t){return e.filter(e=>e.kind!==`metadata`&&e.count>0).sort((e,t)=>e.count-t.count).slice(0,t)}function qy(e){return e.replaceAll(`_`,` `)}function Jy(e){let t=e.filter(e=>e.kind===`general`&&e.count>=Sy&&!Ty.has(e.tag)),n=t.filter(e=>e.count>=Oy);return (n.length>=ky?n:t).sort((e,t)=>e.count-t.count).slice(0,8).map(e=>e.tag)}function Yy(e){return e.split(`_`).sort().join(`_`)}function Xy(e,t){let n=t===`copyright`?Ey:Dy,r=new Map;for(let i of e){if(i.kind!==t||n.has(i.tag))continue;let e=Yy(i.tag),a=r.get(e);(a===void 0||i.count>a.count)&&r.set(e,i);}return [...r.values()]}function Zy(e,t){return [e.length>1?[vy,e.join(` ${by} `),yy].join(fy):e[0]??``,...t.map(e=>`${wy}${e}`)].join(fy)}function Qy(e,t){let n=0;for(let r of e)t.includes(r.tag)&&r.count>n&&(n=r.count);return n}function $y(e,t){let n=Math.min(20,Math.floor(e/42));return n>1?Math.floor(t()*n)*42:0}function eb(e,t){let n=[...e];for(let e=n.length-1;e>0;--e){let r=Math.floor(t()*(e+1)),i=n[e],a=n[r];i!==void 0&&a!==void 0&&(n[e]=a,n[r]=i);}return n}function tb(e,t,n){return (t?[...e]:eb(e,n)).slice(0,5)}function nb(e,t,n){let r=[],i=[];for(let n of e)(t.filter(e=>n.tags.includes(e)).length>=_y?r:i).push(n);return [...eb(r,n),...eb(i,n)]}function rb(e,t){return [...e,...t.map(e=>`${wy}${e}`)].join(fy)}function ib(e){let t=e.filter(e=>e.kind===`artist`).map(e=>e.tag),n=[],r=Jy(e);r.length>0&&n.push({key:Ny,kind:`similar`,name:Fy,tags:r,without:t});for(let r of [`character`,`copyright`])for(let i of Xy(e,r))n.push({key:`${r}:${i.tag}`,kind:r,name:qy(i.tag),tags:[i.tag],without:t});return n.push({key:My,kind:`favorites`,name:Py,tags:[],without:[]}),n}function ab(e,t,n){let r=new Set(t.filter(e=>e.kind===`artist`||e.kind===`character`).map(e=>e.tag)),i=new Set(Ky(t,jy).map(e=>e.tag)),a=[];for(let t of e){let e=t.tags.toLowerCase().split(/\s+/).filter(e=>e.length>0);(r.size>0?e.some(e=>r.has(e)):e.filter(e=>i.has(e)).length>=Ay)&&t.thumb.length>0&&a.push({id:t.id,thumb:t.thumb,tags:e,video:false});}return Gy(t,a,n).slice(0,42)}function ob(e,t=0){let n=new URLSearchParams;return n.set(`page`,`post`),n.set(`s`,`list`),n.set(le$1,e),t>0&&n.set(xy,String(t)),`${re$1}/index.php?${n.toString()}`}function sb(e){return `index.php?page=post&s=view&id=${String(e)}`}async function cb(e,t=0){let n;try{n=await fetch(ob(e,t),{method:`GET`,credentials:be$2});}catch(e){throw new sy(`offline`,e instanceof Error?e.message:`network`)}if(n.status===my)throw new sy(`limited`,`HTTP ${String(n.status)}`);if(!n.ok)throw new sy(`failed`,`HTTP ${String(n.status)}`);let r=await n.text();return Uy(new DOMParser().parseFromString(r,`text/html`))}var lb=`more-like-this`,ub=`Related posts tab`,db=`Loads posts when you open the tab: one request per source.`,fb=`more-like-this-source`,pb=`Related posts`,mb=`None of your favorites share tags with this post.`,hb=`Couldn't load: no connection.`,gb=`The site asked to slow down. Try again in a minute.`,_b=`Couldn't load: the site did not answer as expected.`,vb=`Try again`,yb=`Where the posts come from`,bb=`Mixed from: `,xb=`↻ Another mix`,Sb=`Other posts by these or other rare tags of this post`,Cb=`Search these tags`,wb=`Favorites`,Tb=`▶`,Eb=`→`,Db=`…`,Ob=10,kb=1e3,Ab=150,jb=26,Mb=6,Nb=`rdw-mlt-switch`,Pb=`rdw-mlt-measure`,Fb=`rdw-mlt-chip`,Ib=`rdw-mlt-chip-count`,Lb=`[role="radio"]:not(:disabled)`,Rb=`ArrowLeft`,zb=`ArrowRight`,Bb=`More sources`,Vb=240,Hb=`▾`,Ub=`body.${Kt$2(lb)}`,Wb=`rdw-mlt`,J=`${Ub} #${Gt$2} .${Wb}`,Gb=`
${J} {
  display: grid;
  gap: 10px;
  min-width: 0;
}
${J} .${Nb} {
  position: relative;
}
${J} .rdw-mlt-sources {
  display: flex;
  flex-wrap: wrap;
  gap: ${String(Mb)}px;
}
${J} .${Fb} {
  box-sizing: border-box;
  max-width: 100%;
  height: ${String(jb)}px;
  padding: 0 11px;
  overflow: hidden;
  border: 1px solid var(--rdw-border);
  border-radius: ${String(jb/2)}px;
  background: transparent;
  color: var(--rdw-text);
  font: inherit;
  font-size: 12px;
  line-height: 24px;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}
${J} .${Fb}:hover:not(:disabled) {
  border-color: var(--rdw-muted);
}
${J} .${Fb}[aria-checked="true"] {
  border-color: var(--rdw-accent);
  background: var(--rdw-accent-soft);
  color: var(--rdw-accent);
  font-weight: 600;
}
${J} .${Fb}:disabled {
  opacity: 0.55;
  cursor: default;
}
${J} .${Ib} {
  color: var(--rdw-muted);
  font-weight: 400;
}
${J} .${Pb} {
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  visibility: hidden;
  pointer-events: none;
  height: 0;
  overflow: hidden;
}
${J} .${Pb} .${Fb} {
  flex: none;
  max-width: none;
  font-weight: 600;
}
${Ub} .rdw-mlt-menu {
  padding: 4px;
  gap: 0;
}
${Ub} .rdw-mlt-menu button {
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
${Ub} .rdw-mlt-menu button:hover {
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
  height: ${String(Ab)}px;
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
`.trim();function Kb(e){return e===`similar`||e===`character`||e===`copyright`||e===`favorites`}function qb(e){return e.kind===`similar`?`Mixing similar posts${Db}`:e.kind===`favorites`?`Looking through your favorites${Db}`:`Loading posts with ${e.name}${Db}`}function Jb(e){return e.kind===`favorites`?mb:e.kind===`similar`?`No posts by other artists with these tags.`:`No posts with ${e.name} by other artists.`}function Yb(e){return e===`offline`?hb:e===`limited`?gb:_b}function Xb(e){return `${String(e)} shared ${e===1?`tag`:`tags`}`}function Zb(e){return `Few shared tags \u2014 this post has only ${String(e)} ${e===1?`tag`:`tags`}.`}function Qb(e){return `${bb}${e.map(e=>e.replaceAll(`_`,` `)).join(`, `)}`}function $b(e,t,n){let r=0,i=0;for(let a of e)r===0||i+n+a>t?(r+=1,i=a):i+=n+a;return r}function ex(e,t,n,r,i){let a=e.length;if(r<=0)return a;let o=n===null?[]:[n];for(let n=a;n>=1;--n)if($b([...e.slice(0,n),...n<a?[t]:[],...o],r,i)<=2)return n;return Math.min(1,a)}function tx(e){return `${String(e)} more ${Hb}`}function nx(e,t,n){if(t===null||t>=e.length)return [...e];let r=e.slice(0,Math.max(1,t)),i=e.find(e=>e.key===n);return i!==void 0&&!r.includes(i)&&(r[r.length-1]=i),r}function rx(e,t){let n=e.filter(e=>e.kind!==`favorites`);return n.find(e=>e.kind===t)??n[0]??null}function ix(){return new Promise(e=>{window.setTimeout(e,Cy);})}function ax(e){let t=ib(e.tags),[n,r]=z$2(null),[i,a]=z$2({}),[o,s]=z$2(null),[c,l]=z$2([]),[,u]=z$2(0),[d,f]=z$2(null),p=V$2(null),[m,h]=z$2(false),g=V$2(null),_=V$2(null),v=e.now??Date.now,y=e.random??Math.random,{readFavorites:b}=e,x=(e,t)=>{let n=t instanceof sy?t.failure:`failed`;a(t=>({...t,[e]:{state:`error`,failure:n,at:v()}}));},S=(t,n)=>{let r=tb(t.tags,n,y),i=Zy(r,t.without),o=$y(Qy(e.tags,r),y);a(e=>({...e,[t.key]:{state:`loading`}})),l(e=>e.filter(e=>e!==t.key)),(async()=>{let t=await e.load(i,o);return t.length>0||o===0?t:(await(e.pause??ix)(),e.load(i,0))})().then(e=>{a(n=>({...n,[t.key]:{state:`ready`,posts:nb(e,r,y),query:i,mixed:r}}));}).catch(e=>{x(t.key,e);});},C=(t,n)=>{r(t.key),n&&e.onPick(t.kind);let o=i[t.key];if(t.kind===`favorites`||o!==void 0&&o.state!==`error`)return;if(t.kind===`similar`){S(t,true);return}let s=rb(t.tags,t.without);a(e=>({...e,[t.key]:{state:`loading`}})),e.load(s,0).then(e=>{a(n=>({...n,[t.key]:{state:`ready`,posts:e,query:s,mixed:[]}}));}).catch(e=>{x(t.key,e);});};B$2(()=>{let n=rx(t,e.lastKind);n!==null&&C(n,false);},[]),B$2(()=>{if(b===null){s([]);return}let e=true;return b().then(t=>{e&&s(t);}).catch(()=>{e&&s([]);}),()=>{e=false;}},[b]);let w=t.find(e=>e.key===n),T=w===void 0?void 0:w.kind===`favorites`?o===null?{state:`loading`}:{state:`ready`,posts:o,query:``,mixed:[]}:i[w.key],ee=T?.state===`error`&&T.failure===`limited`?Math.max(0,60-Math.floor((v()-T.at)/kb)):0,te=ee>0;B$2(()=>{if(!te)return;let e=window.setInterval(()=>{u(e=>e+1);},kb);return ()=>{window.clearInterval(e);}},[te]);let ne=Object.values(i).some(e=>e.state===`loading`),re=t.filter(e=>e.kind!==`favorites`),ie=t.find(e=>e.kind===`favorites`),ae=nx(re,d,n),oe=re.filter(e=>!ae.includes(e)),E=ie===void 0||o===null||o.length===0?null:o.length;Ie$2(()=>{let e=g.current?.querySelector(`.rdw-mlt-sources`),t=p.current;if(!(e instanceof HTMLElement)||t===null)return;let n=e=>[...t.querySelectorAll(e)].map(e=>e instanceof HTMLElement?e.offsetWidth:0),r=ex(n(`[data-measure-tag]`),n(`[data-measure-more]`)[0]??0,n(`[data-measure-favorites]`)[0]??null,e.clientWidth,Mb);f(e=>e===r?e:r);});let D=e=>{let t=e.key===zb?1:e.key===Rb?-1:0,n=e.target,r=e.currentTarget;if(t===0||!(n instanceof HTMLElement)||!(r instanceof HTMLElement))return;let i=[...r.querySelectorAll(Lb)],a=i[i.indexOf(n)+t];a instanceof HTMLElement&&(e.preventDefault(),a.focus());},O=(e,t)=>K$3(`button`,{type:`button`,role:`radio`,className:`${Fb} rdw-kit-focusable`,"aria-checked":n===e.key,disabled:ne&&n!==e.key,onClick:()=>{C(e,true);},children:[t===null?e.name:`${wb} `,t===null?null:K$3(`span`,{className:Ib,children:String(t)})]},e.key),se=w!==void 0&&c.includes(w.key),ce=T?.state===`ready`?T.posts:[],le=se?ce:ce.slice(0,6);return K$3(`div`,{className:Wb,children:[K$3(`div`,{ref:g,className:Nb,children:[K$3(`div`,{className:Pb,ref:p,"aria-hidden":`true`,children:[re.map(e=>K$3(`span`,{className:Fb,"data-measure-tag":``,children:e.name},e.key)),K$3(`span`,{className:Fb,"data-measure-more":``,children:tx(re.length)}),E===null?null:K$3(`span`,{className:Fb,"data-measure-favorites":``,children:[`${wb} `,K$3(`span`,{className:Ib,children:String(E)})]})]}),K$3(`div`,{className:`rdw-mlt-sources`,role:`radiogroup`,"aria-label":yb,onKeyDown:D,children:[ae.map(e=>O(e,null)),oe.length>0?K$3(`button`,{type:`button`,className:`${Fb} rdw-kit-focusable`,"aria-haspopup":`menu`,"aria-expanded":m,disabled:ne,onClick:()=>{h(e=>!e);},children:tx(oe.length)}):null,ie===void 0||E===null?null:O(ie,E)]}),K$3(zn$1,{open:m,onClose:()=>{h(false);},anchorRef:g,widthPx:Vb,role:`menu`,"aria-label":Bb,className:`rdw-mlt-menu`,children:oe.map(e=>K$3(`button`,{type:`button`,role:`menuitem`,className:`rdw-kit-focusable`,onClick:()=>{h(false),C(e,true);},children:e.name},e.key))})]}),w?.kind===`similar`&&T?.state===`ready`?K$3(`div`,{className:`rdw-mlt-mix`,children:[K$3(`p`,{className:`rdw-mlt-line`,children:Qb(T.mixed)}),K$3(`button`,{type:`button`,className:`rdw-mlt-link`,title:Sb,disabled:ne,onClick:()=>{S(w,false);},children:xb})]}):null,w===void 0||T===void 0?null:T.state===`loading`?K$3(A$2,{children:[K$3(`p`,{className:`rdw-mlt-line`,role:`status`,children:qb(w)}),K$3(`div`,{className:`rdw-mlt-grid`,"aria-hidden":`true`,children:Array.from({length:6},(e,t)=>K$3(`span`,{className:`rdw-mlt-cell`,"data-waiting":``},t))})]}):T.state===`error`?K$3(`p`,{className:`rdw-mlt-line`,role:`alert`,children:[Yb(T.failure),` `,K$3(`button`,{type:`button`,className:`rdw-mlt-link`,disabled:te,onClick:()=>{C(w,false);},children:te?`${vb} (${String(ee)})`:vb})]}):ce.length===0?K$3(`p`,{className:`rdw-mlt-line`,role:`status`,children:Jb(w)}):K$3(A$2,{children:[e.tags.length<Ob?K$3(`p`,{className:`rdw-mlt-line`,children:Zb(e.tags.length)}):null,K$3(`div`,{className:`rdw-mlt-grid`,ref:_,children:le.map(e=>K$3(`a`,{className:`rdw-mlt-cell`,href:sb(e.id),title:Xb(e.shared),children:[K$3(`img`,{src:e.thumb,alt:`${w.name} #${String(e.id)}`,loading:`lazy`}),e.video?K$3(`span`,{className:`rdw-mlt-video`,"aria-hidden":`true`,children:Tb}):null]},e.id))}),K$3(`div`,{className:`rdw-mlt-foot`,children:[!se&&ce.length>6?K$3(`button`,{type:`button`,className:`rdw-mlt-link`,onClick:()=>{l(e=>[...e,w.key]),window.setTimeout(()=>{let e=_.current?.querySelectorAll(`a`)[6];e instanceof HTMLElement&&e.focus();},0);},children:`Show all ${String(ce.length)}`}):K$3(`span`,{}),w.kind===`favorites`?null:K$3(`a`,{className:`rdw-mlt-link`,href:ob(T.query),children:`${w.kind===`similar`?Cb:`Search ${w.name}`} ${Eb}`})]})]})]})}var ox={id:lb,label:ub,pages:[`post`],defaultEnabled:true,settingsCaption:db,css:Gb,mount:()=>void 0},sx=`seen-dim`,cx=`rdw-seen`,lx=`Dim seen posts`,ux=`0.65`,dx=`1`,fx=`pageshow`,px,mx=false;function hx(e=document){let t=G$3().marks,n=e.querySelectorAll(an$2.thumb);for(let e of n){if(!(e instanceof HTMLElement))continue;let n=ln$2(e);n!==null&&e.classList.toggle(cx,t[n]?.seen===true);}}function gx(e){e.persisted&&(K$4(),hx(document));}function _x(){px===void 0&&(px=ot$4(e=>{hx(e);})),mx||(mx=true,window.addEventListener(fx,gx));}function vx(e){if(e.pageKind===`post`){let t=Ki$1(e.search);if(t===null){m$2.warn(`seen-dim: missing post id in search`,e.search);return}Cc$1(t);}else e.pageKind===`list`&&(hx(document),_x());}var yx={id:sx,label:lx,pages:[`list`,`post`],defaultEnabled:true,cssOnly:true,css:`
body.${Kt$2(sx)} .${cx} img.preview {
  opacity: ${ux};
}

body.${Kt$2(sx)} .${cx}:hover img.preview {
  opacity: ${dx};
}
`,mount:vx},bx=`image-zoom`,xx=`Zoom the picture on click`,Sx=Kt$2(bx),Cx=`rdw-image-viewer`,wx=`rdw-image-viewer-stage`,Tx=`rdw-image-viewer-image`,Ex=`rdw-image-viewer-bar`,Dx=`rdw-image-viewer-button`,Ox=`rdw-image-viewer-scale`,kx=`rdw-image-viewer--dragging`,Ax=2147483e3,jx=24,Mx=1.2,Nx=4,Px=`Picture viewer`,Fx=`Zoom in`,Ix=`Zoom out`,Lx=`Fit to window`,Rx=`Actual size`,zx=`Close`,Bx=`+`,Vx=`−`,Hx=`Fit`,Ux=`1:1`,Wx=`✕`,Gx=`
body.${Sx} img#${q_} {
  cursor: zoom-in;
}
#${Cx} {
  position: fixed;
  inset: 0;
  z-index: ${String(Ax)};
  background: rgba(0, 0, 0, 0.88);
  overflow: hidden;
  touch-action: none;
  cursor: grab;
}
#${Cx}.${kx} {
  cursor: grabbing;
}
#${Cx} .${wx} {
  position: absolute;
  inset: 0;
}
#${Cx} .${Tx} {
  position: absolute;
  left: 50%;
  top: 50%;
  max-width: none;
  max-height: none;
  transform-origin: center;
  user-select: none;
  -webkit-user-drag: none;
}
#${Cx} .${Ex} {
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
#${Cx} .${Dx} {
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
#${Cx} .${Dx}:hover,
#${Cx} .${Dx}:focus-visible {
  background: var(--rdw-surface-2);
}
#${Cx} .${Dx}:focus-visible {
  outline: 2px solid var(--rdw-accent);
  outline-offset: -2px;
}
#${Cx} .${Ox} {
  min-width: 44px;
  text-align: center;
  color: var(--rdw-muted);
  font-variant-numeric: tabular-nums;
}
`.trim();function Kx(e,t,n,r){if(e<=0||t<=0)return 1;let i=Math.max(1,n-48),a=Math.max(1,r-48);return Math.min(1,i/e,a/t)}var qx=2;function Jx(e,t,n,r){let i=Kx(e,t,n,r);if(e<=0||t<=0)return {scale:i,x:0,y:0};let a=Math.min(1,Math.max(1,n-48)/e),o=t*a;return a<=i||o<r*qx?{scale:i,x:0,y:0}:{scale:a,x:0,y:(o-r)/2+jx}}function Yx(e,t,n){let r=e*t-n;return r>0?r/2+jx:0}function Xx(e,t,n){return e*t>n}function Zx(e,t,n,r){let i=Yx(n,e.scale,r);return i===0?{...e,y:0}:{...e,y:Math.min(i,Math.max(-i,e.y-t))}}function Qx(e,t){return Math.min(8,Math.max(t,e))}function $x(e,t,n,r,i){let a=Qx(e.scale*t,i),o=a/e.scale;return a===i?{scale:a,x:0,y:0}:{scale:a,x:n-(n-e.x)*o,y:r-(r-e.y)*o}}var eS=null;function tS(e){let{state:t}=e;e.image.style.transform=`translate(-50%, -50%) translate(${String(t.x)}px, ${String(t.y)}px) scale(${String(t.scale)})`,e.scaleLabel.textContent=`${String(Math.round(t.scale*100))}%`;}function nS(e,t){e.fit=Kx(e.image.naturalWidth,e.image.naturalHeight,window.innerWidth,window.innerHeight),e.state=t?{scale:e.fit,x:0,y:0}:{...e.state,scale:Qx(e.state.scale,e.fit)},tS(e);}function rS(e,t,n,r){e.state=$x(e.state,t,n,r,e.fit),tS(e);}function iS(){if(eS===null)return;let{root:e,opener:t}=eS;eS=null,e.remove(),document.removeEventListener(`keydown`,aS,true),window.removeEventListener(`resize`,cS),t?.focus();}function aS(e){if(eS!==null){if(e.key===`Escape`)e.preventDefault(),e.stopPropagation(),iS();else if(e.key===`+`||e.key===`=`)rS(eS,Mx,0,0);else if(e.key===`-`)rS(eS,1/Mx,0,0);else if(e.key===`0`)nS(eS,true);else {let t=oS.get(e.key);t!==void 0&&sS(eS,t*window.innerHeight)&&e.preventDefault();}}}var oS=new Map([[`ArrowDown`,.15],[`ArrowUp`,-0.15],[`PageDown`,.9],[`PageUp`,-0.9],[` `,.9],[`End`,2**53-1],[`Home`,-9007199254740991]]);function sS(e,t){let n=e.image.naturalHeight;return Xx(n,e.state.scale,window.innerHeight)?(e.state=Zx(e.state,t,n,window.innerHeight),tS(e),true):false}function cS(){eS!==null&&nS(eS,false);}function lS(e,t,n){let r=document.createElement(`button`);return r.type=`button`,r.className=Dx,r.textContent=e,r.setAttribute(`aria-label`,t),r.title=t,r.addEventListener(`click`,e=>{e.stopPropagation(),n();}),r}function uS(e,t){iS();let n=document.createElement(`div`);n.id=Cx,n.setAttribute(`role`,`dialog`),n.setAttribute(`aria-modal`,`true`),n.setAttribute(`aria-label`,Px),n.tabIndex=-1;let r=document.createElement(`div`);r.className=wx;let i=document.createElement(`img`);i.className=Tx,i.alt=``,i.draggable=false,r.append(i);let a=document.createElement(`span`);a.className=Ox;let o=document.createElement(`div`);o.className=Ex;let s={root:n,image:i,scaleLabel:a,opener:t,state:{scale:1,x:0,y:0},fit:1};o.append(lS(Vx,Ix,()=>{rS(s,1/Mx,0,0);}),a,lS(Bx,Fx,()=>{rS(s,Mx,0,0);}),lS(Hx,Lx,()=>{nS(s,true);}),lS(Ux,Rx,()=>{s.state={scale:Qx(1,s.fit),x:0,y:0},tS(s);}),lS(Wx,zx,iS)),o.addEventListener(`pointerdown`,e=>{e.stopPropagation();}),n.append(r,o),i.addEventListener(`load`,()=>{nS(s,true),s.state=Jx(i.naturalWidth,i.naturalHeight,window.innerWidth,window.innerHeight),tS(s);}),i.src=e,n.addEventListener(`wheel`,e=>{if(e.preventDefault(),!e.ctrlKey&&sS(s,e.deltaY))return;let t=e.clientX-window.innerWidth/2,n=e.clientY-window.innerHeight/2;rS(s,e.deltaY<0?Mx:1/Mx,t,n);},{passive:false});let c=null;n.addEventListener(`pointerdown`,e=>{e.button===0&&(c={startX:e.clientX,startY:e.clientY,x:s.state.x,y:s.state.y,moved:false},n.setPointerCapture?.(e.pointerId));}),n.addEventListener(`pointermove`,e=>{if(c===null)return;let t=e.clientX-c.startX,r=e.clientY-c.startY;!c.moved&&Math.hypot(t,r)<Nx||(c.moved=true,n.classList.add(kx),s.state={...s.state,x:c.x+t,y:c.y+r},tS(s));}),n.addEventListener(`pointerup`,e=>{let t=c;c=null,n.classList.remove(kx),t!==null&&!t.moved&&e.target!==i&&iS();}),n.addEventListener(`dblclick`,e=>{if(e.target===i){if(s.state.scale>s.fit)nS(s,true);else {let t=e.clientX-window.innerWidth/2,n=e.clientY-window.innerHeight/2;rS(s,1/s.state.scale,t,n);}}}),eS=s,document.body.append(n),document.addEventListener(`keydown`,aS,true),window.addEventListener(`resize`,cS),tS(s),n.focus();}function dS(e){if(!document.body.classList.contains(Sx))return;let t=e.target;if(!(t instanceof HTMLImageElement)||t.id!==`image`||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault(),e.stopPropagation();let n=hv()?.href??``;uS(n.length>0?n:t.currentSrc||t.src,t);}var fS=false;function pS(e){fS||(fS=true,document.addEventListener(`click`,dS,true));}var mS={id:bx,label:xx,pages:[`post`],defaultEnabled:true,cssOnly:true,settingsCaption:`Pictures and GIFs. Scroll to zoom, drag to move, Esc to close.`,css:Gx,mount:pS},hS=`infinite-scroll`,gS=`Infinite scroll`,_S=[`list`],vS=Kt$2(hS),yS=2,bS=1e3,xS=`rdw-infinite-sentinel`,SS=`rdw-infinite-status`,CS=`rdw-infinite-page`,wS=`rdw-infinite-retry`,TS=`rdw-blacklisted`,ES=`Loading…`,DS=`End of results`,OS=`Failed to load more`,kS=`Retry`,AS=`Paused: the last pages added nothing to the screen`,jS=`Load more`,MS=`Page `,NS=`div.pagination a[alt="next"]`,PS=`infinite-scroll: missing image-list or next link; not mounted`,FS=`score:`,IS=`rating:`,LS=`
body.${vS} .${xS} {
  display: block;
  width: 100%;
  height: 1px;
  margin: 0;
  padding: 0;
  border: 0;
  pointer-events: none;
}
body.${vS} .${SS} {
  display: block;
  width: 100%;
  margin: 0.75rem 0;
  text-align: center;
  font-size: 0.875rem;
  line-height: 1.4;
}
body.${vS} .${CS} {
  display: block;
  width: 100%;
  margin: 0.75rem 0 0.5rem;
  text-align: center;
  font-size: 0.8125rem;
  font-weight: 600;
  opacity: 0.75;
}
body.${vS} .${wS} {
  margin-left: 0.5rem;
  color: inherit;
  background: transparent;
  border: 1px solid currentColor;
  border-radius: 2px;
  padding: 0.15rem 0.5rem;
  cursor: pointer;
  font: inherit;
}
body.${vS} .${wS}:focus-visible {
  outline: 2px solid var(--rdw-accent);
  outline-offset: 2px;
}
body.${vS} span.thumb.${TS} {
  display: none !important;
}
`.trim();function RS(e){return new Promise(t=>{window.setTimeout(t,e);})}function zS(){let e=document.querySelector(NS);if(!(e instanceof HTMLAnchorElement))return null;let t=e.getAttribute(`href`);if(t===null||t.length===0||t===`#`)return null;try{return new URL(t,window.location.href).href}catch{return null}}function BS(e){let t=e.querySelector(an$2.previewImage),n=t?.getAttribute(`title`)?.trim()??``,r=t?.getAttribute(`alt`)?.trim()??``,i=n.length>0?n:r;if(i.length===0)return {tags:[],score:0,rating:``};let a=[],o=0,s=``;for(let e of i.split(/\s+/)){if(e.length===0)continue;let t=e.toLowerCase();if(t.startsWith(FS)){let t=e.slice(6),n=Number(t);Number.isFinite(n)&&(o=n);}else t.startsWith(IS)?s=e.slice(7):a.push(e);}return {tags:a,score:o,rating:s}}function VS(){let e=new Set,t=document.querySelectorAll(an$2.thumb);for(let n of t)n.id.length>0&&e.add(n.id);return e}function HS(e,t){if(!(e instanceof HTMLElement))return;let n=BS(e);aa(n.tags,n.score,n.rating,t)&&e.classList.add(TS);}function US(e){let t=document.createElement(`div`);return t.className=CS,t.textContent=`${MS}${String(e)}`,t}function WS(e){let t=document.createElement(`div`);t.className=xS,t.setAttribute(`aria-hidden`,`true`);let n=document.createElement(`div`);return n.className=SS,n.setAttribute(`role`,`status`),n.setAttribute(`aria-live`,`polite`),e.after(t,n),{sentinel:t,status:n}}function GS(e){e.replaceChildren(),e.textContent=ES;}function KS(e){e.replaceChildren(),e.textContent=DS;}function qS(e,t){e.replaceChildren();let n=document.createElement(`span`);n.textContent=OS;let r=document.createElement(`button`);r.type=`button`,r.className=wS,r.textContent=kS,r.addEventListener(`click`,e=>{e.preventDefault(),t();}),e.append(n,r);}function JS(e,t){e.replaceChildren();let n=document.createElement(`span`);n.textContent=AS;let r=document.createElement(`button`);r.type=`button`,r.className=wS,r.textContent=jS,r.addEventListener(`click`,e=>{e.preventDefault(),t();}),e.append(n,r);}function YS(){return document.documentElement.scrollHeight}function XS(e){e.replaceChildren();}function ZS(){return yS*window.innerHeight}function QS(){return `${String(ZS())}px`}function $S(e){let t=e.getBoundingClientRect(),n=ZS(),r=window.innerHeight+n,i=-n;return t.top<r&&t.bottom>i}function eC(e){if(document.body.classList.contains(`rdw-feed-merged`))return;let t=document.querySelector(an$2.imageList);if(t===null){m$2.warn(PS);return}let n=zS();if(n===null){m$2.warn(PS);return}let{sentinel:r,status:i}=WS(t),a=false,o=0,s=1,c=false,l=0,u=null,d=()=>{c=true,n=null,KS(i),u!==null&&(u.disconnect(),u=null);},f=async e=>{X$1(et()??`posts`);let n=await vg(e),r=0;s+=1,t.append(US(s));let i=VS(),a=ra();for(let e of n.thumbs){if(e.id.length>0&&i.has(e.id))continue;let n=document.importNode(e,true);n.id.length>0&&i.add(n.id),HS(n,a),t.append(n),r+=1;}return st$4(t),{nextUrl:n.nextUrl,added:r}},p=async e=>{if(c||a||n===null)return;a=true;let t=e?.bypassRateLimit===true;try{for(;!c&&n!==null&&(e?.single===!0||$S(r));){let r=Date.now()-o;if(!t&&o>0&&r<bS){await RS(bS-r);continue}t=!1;let a=n;o=Date.now(),GS(i);try{let t=YS(),r=await f(a);if(n=r.nextUrl,XS(i),n===null){d();return}let o=t===0||YS()>t,s=r.added>0&&o;l=s?0:l+1;let c=e?.single===!0;if(l>=2||c&&!s){l=0,JS(i,()=>{p({bypassRateLimit:!0,single:!0});});return}if(c)return}catch(e){m$2.warn(`infinite-scroll: fetch failed`,a,e),qS(i,()=>{p({bypassRateLimit:!0});});return}}}finally{a=false;}};u=new IntersectionObserver(e=>{for(let t of e)if(t.isIntersecting){p();break}},{root:null,rootMargin:QS(),threshold:0}),u.observe(r);}var tC={id:hS,label:gS,pages:[..._S],defaultEnabled:true,css:LS,mount:eC},nC=`playlist-bar`,rC=`Collection header`,iC=[`list`],aC=`rdw-playlist-bar`,oC=`rdw-playlist-bar`,sC=`rdw-playlist-bar-title`,cC=`rdw-playlist-bar-name`,lC=`rdw-playlist-bar-back`,uC=`rdw-playlist-bar-kind`,dC=`← Collections`,fC=`Saved search`,pC=`rdw-playlist-bar-count`,mC=`rdw-playlist-bar-parts`,hC=`rdw-playlist-bar-part-label`,gC=`rdw-playlist-bar-part-link`,_C=`rdw-playlist-bar-caption`,vC=`rdw-dynamic-collection-bar`,yC=`rdw-dynamic-collection-actions`,bC=` posts`,xC=`Part `,SC=` of `,CC=`Posts are ordered by the site (newest first).`,wC=`Previous`,TC=`Next`,EC=`Shuffle`,DC=`Original order`,OC=`Edit query`,kC=`Query`,AC=`none`,jC=`edit-query`,MC=`rename`,NC=`delete`,PC=`fields`,FC=`confirm`,IC=`danger`,LC=`name`,RC=`query`,zC=`secondary`,BC=`danger-quiet`,VC=`s`,HC=18,UC=8,WC=`playlist-bar: image-list not found; playlist bar not mounted`,Y=Kt$2(nC),GC=`
body.${Y} .${oC} {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-width: 100%;
  margin: 0.5rem 0;
  color: var(--rdw-text);
  box-sizing: border-box;
}
body.${Y} .${sC} {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem 0.75rem;
  max-width: 100%;
  font: inherit;
  line-height: 1.3;
}
body.${Y} .${lC} {
  color: var(--rdw-muted);
  font-size: 12px;
  text-decoration: none;
}
body.${Y} .${lC}:hover {
  color: var(--rdw-text);
}
body.${Y} .${uC} {
  color: var(--rdw-muted);
  font-size: 12px;
}
body.${Y} .${cC} {
  font-size: ${String(HC)}px;
  font-weight: 700;
}
body.${Y} .${pC} {
  opacity: 0.85;
}
body.${Y} .${mC} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.75rem;
  max-width: 100%;
  font: inherit;
  line-height: 1.3;
}
body.${Y} .${hC} {
  flex: 0 0 auto;
}
body.${Y} a.${gC} {
  color: inherit;
  text-decoration: underline;
}
body.${Y} a.${gC}:focus-visible {
  outline: 2px solid var(--rdw-accent);
  outline-offset: 2px;
}
body.${Y} .${_C} {
  margin: 0;
  font: inherit;
  font-size: 0.875rem;
  line-height: 1.35;
  opacity: 0.8;
}
body.${Y} .${yC} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${String(UC)}px;
  max-width: 100%;
}
`.trim();function KC(e){return new URLSearchParams(e).get(`tags`)??``}function qC(e,t){if(e.length!==t.length)return  false;let n=new Set(e);if(n.size!==e.length)return  false;for(let e of t)if(!n.has(e))return  false;return  true}function JC(e,t){let n=new Set(e);for(let e of t)if(!n.has(e))return  false;return  true}function YC(e){let t=Lc$1(),n=[];for(let r of Js$1()){let i=r.postIds??[];if(!JC(i,e))continue;let a=wo$1(i,t),o=-1;for(let t=0;t<a.length;t+=1){let n=a[t];if(n===void 0)continue;let r=To$1(n);if(r!==null&&qC(e,r)){o=t;break}}n.push({playlist:r,partIndex:o,partQueries:a});}return n.length===0?null:n.find(e=>e.partIndex>=0)??n[0]??null}function XC(e){return so$1(io$1(e))}function ZC(e){let t=e instanceof Document?e.getElementById(aC):e.querySelector(`#${aC}`);t!==null&&t.remove();}function QC(e){return e.querySelector(an$2.imageList)}function $C(e){return e.querySelector(an$2.postListContent)??e.querySelector(an$2.contentRoot)}function ew(e,t,n){n!==null&&n.parentElement===e?e.insertBefore(t,n):n===null?e.insertBefore(t,e.firstChild):n.parentElement?.insertBefore(t,n);}function tw(e){return `${String(e)}${bC}`}function nw(e,t){return `${xC}${String(e+1)}${SC}${String(t)}`}function rw(e,t,n){if(n===void 0)return;let r=document.createElement(`a`);r.className=gC,r.href=XC(n),r.textContent=t,e.append(r);}function iw(e){let{partIndex:t,partQueries:n}=e;if(n.length===0||t<0)return null;let r=document.createElement(`div`);r.className=mC;let i=document.createElement(`span`);return i.className=hC,i.textContent=nw(t,n.length),r.append(i),n.length>1&&(rw(r,wC,n[t-1]),rw(r,TC,n[t+1])),r}function aw(e){let t=document.createElement(`div`);t.id=aC,t.className=oC;let n=document.createElement(`div`);n.className=sC;let r=document.createElement(`span`);r.className=cC,r.textContent=e.playlist.name;let i=document.createElement(`span`);i.className=pC,i.textContent=tw(e.playlist.postIds?.length??0),n.append(r,i),t.append(n);let a=iw(e);a!==null&&t.append(a);let o=document.createElement(`p`);return o.className=_C,o.textContent=CC,t.append(o),t}function ow(e){let t=QC(document);if(t!==null){let n=t.parentElement;return n===null?(m$2.warn(WC),false):(ew(n,e,t),true)}let n=$C(document);return n===null?(m$2.warn(WC),false):(m$2.warn(WC),ew(n,e,null),true)}function sw(e){return e.query===void 0?ao$1(e.tags):e.query}function cw(e){if(Ao$1(e))return null;for(let t of G$3().collections){if(I$3(t))continue;let n=sw(t);if(!Ao$1(n)&&Po$1(e,n))return t}return null}function lw(e){let t=Pt$2(window.location.hash);if(t===null)return null;for(let n of G$3().collections){if(n.id!==t||I$3(n))continue;let r=sw(n);return Ao$1(r)?Ao$1(e)?n:null:Po$1(e,r)?n:null}return null}var uw=`#`;function dw(e){let t=Nt$3(e);for(let e of document.querySelectorAll(an$2.paginationPageLink)){let n=e.getAttribute(`href`);n===null||n.includes(uw)||e.setAttribute(`href`,`${n}${t}`);}}function fw(e){let t=e instanceof Document?e.getElementById(vC):e.querySelector(`#${vC}`);t instanceof HTMLElement&&(ve$1(null,t),t.remove());}function pw(e){return `${Fe$3.confirmDelete} (${e})`}function mw(e,t){window.location.assign(`${so$1(io$1(e))}${Nt$3(t)}`);}function hw(e){let[t,n]=z$2(e.initialName),[r,i]=z$2(e.storedQuery),[a,o]=z$2(AC),[s,c]=z$2({name:e.initialName,query:e.storedQuery}),l=jo$1(e.pageQuery);function u(){o(AC);}function d(e){c({name:t,query:r}),o(e);}function f(){l?window.location.reload():mw(No$1(e.pageQuery),e.collectionId);}function p(){mw(Mo$1(e.pageQuery),e.collectionId);}function m(){if(Ao$1(s.query))return;let t=Sc$1(e.collectionId,s.query);if(t===null)return;let n=t.query??ao$1(t.tags);i(n),mw(n,e.collectionId);}function h(){let t=s.name.trim();if(t.length===0)return;let r=Gs$1(e.collectionId,t);r!==null&&(n(r.name),u());}function g(){if(!Ks$1(e.collectionId)){u();return}let t=document.getElementById(vC);t instanceof HTMLElement&&(t.remove(),ve$1(null,t));}let _=a===jC||a===MC,v=a===MC?Fe$3.rename:OC,y=a===MC?h:m;return ee(A$2,null,ee(`div`,{className:sC},ee(`a`,{className:lC,href:Ke$3},dC),ee(`span`,{className:cC},t),ee(`span`,{className:uC},fC)),ee(`div`,{className:yC},ee(q$3,{variant:zC,size:VC,onClick:f},EC),l?ee(q$3,{variant:zC,size:VC,onClick:p},DC):null,ee(q$3,{variant:zC,size:VC,onClick:()=>{d(jC);}},OC),ee(q$3,{variant:zC,size:VC,onClick:()=>{d(MC);}},Fe$3.rename),ee(q$3,{variant:BC,size:VC,onClick:()=>{o(NC);}},Fe$3.delete)),_?ee(xn$1,{variant:PC,open:true,title:v,fields:s,onFieldsChange:c,onSubmit:y,onClose:u,submitLabel:Fe$3.save,cancelLabel:Fe$3.cancel,nameLabel:Fe$3.nameLabel,queryLabel:kC,only:a===MC?LC:RC,renderQueryField:e=>ee(Nt,e)}):null,a===NC?ee(xn$1,{variant:FC,open:true,title:Fe$3.delete,message:pw(t),confirmLabel:Fe$3.confirm,cancelLabel:Fe$3.cancel,confirmTone:IC,onConfirm:g,onClose:u}):null)}var gw=`0`;function _w(e){let t=new URLSearchParams(e).get(`pid`);return t===null||t.length===0||t===gw}function vw(e,t,n){if(Ao$1(t)||jo$1(t)||!_w(n))return;gc$1(e,xt(document,4));let r=Ot(document,t);r!==null&&_c$1(e,r),vc$1(e,St(document),true);}function yw(e,t){let n=lw(e),r=n??cw(e);if(r!==null&&vw(r.id,e,t),n===null)return;let i=n;dw(i.id);let a=document.createElement(`div`);a.id=vC,a.className=oC,ow(a)&&ve$1(ee(hw,{collectionId:i.id,initialName:i.name,storedQuery:sw(i),pageQuery:e}),a);}function bw(e,t){vw(e,KC(t),t);}var xw=`hashchange`,Sw=false,Cw=``;function ww(e){Sw||(Sw=true,window.addEventListener(xw,()=>{(Pt$2(window.location.hash)??``)!==Cw&&Tw({...e,search:window.location.search});}));}function Tw(e){ww(e),Cw=Pt$2(window.location.hash)??``,ZC(document),fw(document);let t=KC(e.search),n=To$1(t);if(n!==null){let e=YC(n);e!==null&&ow(aw(e));}yw(t,e.search);}var Ew={id:nC,label:rC,settingsCaption:`A bar over the grid of an opened dynamic collection: its name, Shuffle, Edit query, Rename and Delete.`,pages:[...iC],defaultEnabled:true,css:GC,mount:Tw},Dw=`rdw-post-deleted`,Ow=`rdw-post-deleted-icon`,kw=`rdw-post-deleted-title`,Aw=`rdw-post-deleted-reason`,jw=`rdw-post-deleted-related`,Mw=`rdw-post-deleted-md5-row`,Nw=`rdw-post-deleted-md5`,Pw=`rdw-post-deleted-copy`,Fw=`rdw-post-panel-open-related`,Iw=`This post was deleted`,Lw=`The post was deleted`,Rw=`Show related posts`,zw=`Reason: `,Bw=`MD5 `,Vw=`Copy`,Hw=`Copied`,Uw=`Copy the MD5 of the file`,Ww=40,Gw=12,Kw=1500,qw=new Map([[`tos`,`Breaks the site’s terms of service`]]);function Jw(e){let t=e.trim();return t.length===0?``:qw.get(t.toLowerCase())??`${zw}${t}`}function Yw(e){let[t,n]=z$2(false);B$2(()=>{if(!t)return;let e=window.setTimeout(()=>{n(false);},Kw);return ()=>{window.clearTimeout(e);}},[t]);let r=Jw(e.reason);return K$3(A$2,{children:[K$3(wt$2,{size:Ww,className:Ow}),K$3(`p`,{className:kw,children:Iw}),r.length>0?K$3(`p`,{className:Aw,children:r}):null,e.showRelated?K$3(q$3,{variant:`primary`,size:`m`,className:jw,onClick:()=>{document.dispatchEvent(new CustomEvent(Fw));},children:Rw}):null,e.md5.length>0?K$3(`div`,{className:Mw,children:[K$3(`span`,{className:Nw,children:`${Bw}${e.md5}`}),K$3(q$3,{variant:`ghost`,size:`s`,className:Pw,"aria-label":Uw,onClick:()=>{try{navigator.clipboard.writeText(e.md5).then(()=>{n(!0);},e=>{m$2.warn(`post-actions: MD5 not copied`,e);});}catch(e){m$2.warn(`post-actions: no clipboard`,e);}},children:[K$3(t?ft$2:Tt$2,{size:Gw}),t?Hw:Vw]})]}):null]})}var Xw=`keydown`,Zw=`input, textarea, select, [contenteditable], [role="dialog"], [role="listbox"], [role="menu"]`,Qw=`[role="dialog"]`,$w=`video`;function eT(e){if(e.defaultPrevented||e.repeat||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||document.querySelector(Qw)!==null)return  true;let t=e.composedPath()[0];return t instanceof Element?t.closest(Zw)===null?t===document.body||t===document.documentElement?false:t.closest($w)!==null||t.querySelector($w)!==null:true:false}function tT(e,t,n){let r=V$2(n);r.current=n,B$2(()=>{if(!t)return;let n=t=>{t.code!==e||eT(t)||(t.preventDefault(),r.current());};return document.addEventListener(Xw,n),()=>{document.removeEventListener(Xw,n);}},[t,e]);}var nT=`rdw-post-panel-collection-queue`,rT=`rdw-post-panel-collection-queue-name`,iT=`rdw-post-panel-collection-queue-position`,aT=`rdw-post-panel-collection-queue-nav`,oT=`rdw-kit-focusable`,sT=`‹`,cT=`›`,lT=`Previous post in collection`,uT=`Next post in collection`,dT=`Collection queue`,fT=` / `,pT=-1,mT=1,hT=`hashchange`,gT=`click`,_T=0,vT=8,yT=600,bT=.55,xT=`${ce$1}=${ae$1}&s=${se$1}`,ST=`
${G$2}
.${nT} {
  display: flex;
  align-items: center;
  gap: ${String(vT)}px;
  min-width: 0;
}
.${rT} {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--rdw-accent);
  font-weight: ${String(yT)};
  text-decoration: none;
}
.${iT} {
  flex: 0 0 auto;
  color: var(--rdw-muted);
  font-variant-numeric: tabular-nums;
}
a.${aT},
button.${aT} {
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
button.${aT}:disabled {
  opacity: ${String(bT)};
  cursor: not-allowed;
}
`;function CT(e){if(!e.startsWith(`#rdw-c=`))return null;let t=e.slice(We$3.length).trim();if(t.length===0)return null;try{return decodeURIComponent(t)}catch{return t}}function wT(){return window.location.hash}function TT(e){for(let t of Js$1())if(t.id===e)return t.name;return null}function ET(e,t){for(let n=0;n<e.length;n+=1)if(e[n]===t)return n;return pT}function DT(e,t){return `${ie$1}?${xT}&id=${String(e)}${t}`}function OT(e,t,n){if(t<0||t>=e.length)return null;let r=e[t];return r===void 0?null:DT(r,n)}function kT(e,t){if(e===null)return null;let n=CT(t);if(n===null)return null;let r=mc$1(n);if(r===null)return null;let i=ET(r,e);if(i===pT)return null;let a=TT(n);if(a===null)return null;let o=i+mT;return {name:a,collectionHref:jt$3(n),positionLabel:`${String(o)}${fT}${String(r.length)}`,previousHref:OT(r,i-1,t),nextHref:OT(r,i+1,t)}}function AT(e){window.location.replace(e);}function jT(e){let t=`${aT} ${oT}`;if(e.href===null)return K$3(`button`,{type:`button`,className:t,disabled:true,"aria-label":e.label,title:e.label,children:e.glyph});let n=e.href;return K$3(`a`,{className:t,href:n,"aria-label":e.label,title:e.label,onClick:e=>{MT(e)&&(e.preventDefault(),AT(n));},children:e.glyph})}function MT(e){return e.button===_T&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey}function NT(e,t){let n=e.target;if(!(n instanceof Element))return null;for(let e of t)if(n.closest(e.selector)!==null)return e;return null}function PT(e,t,n){B$2(()=>{if(!n)return;let r=[{selector:an$2.postPrevSearchLink,href:e},{selector:an$2.postNextSearchLink,href:t}],i=e=>{if(!MT(e))return;let t=NT(e,r);t!==null&&(e.preventDefault(),e.stopImmediatePropagation(),t.href!==null&&AT(t.href));};return document.addEventListener(gT,i,true),()=>{document.removeEventListener(gT,i,true);}},[e,t,n]);}function FT(e){let[t,n]=z$2(wT);B$2(()=>{let e=()=>{n(wT());};return window.addEventListener(hT,e),()=>{window.removeEventListener(hT,e);}},[]);let r=kT(e.postId,t);return PT(r===null?null:r.previousHref,r===null?null:r.nextHref,r!==null),r===null?null:K$3(`nav`,{className:nT,"aria-label":dT,children:[K$3(`style`,{children:ST}),K$3(`a`,{className:`${rT} ${oT}`,href:r.collectionHref,children:r.name}),K$3(`span`,{className:iT,children:r.positionLabel}),K$3(jT,{label:lT,glyph:sT,href:r.previousHref}),K$3(jT,{label:uT,glyph:cT,href:r.nextHref})]})}var IT=ga$1,LT=`Video player tweaks`,RT=[`post`],zT=`gelcomVideoPlayer`,BT=`fluid_video_wrapper_gelcomVideoPlayer`,VT=`fluid_video_wrapper`,HT=0,UT=1,WT=12,GT=Kt$2(IT),KT=`body.${GT}`,qT=`#${BT}.${VT}`,JT=`Fit height`,YT=`Fit width`,XT=`Original`,ZT=[_a$1,va$1,ya$1],QT=`Fit height fills under the header (may upscale). Fit width uses the media column. Original is native pixels.`,$T=[`${KT} ${qT} {`,`  box-sizing: border-box;`,`}`].join(`
`);function eE(e){let{mode:t,videoWidth:n,videoHeight:r,columnWidthPx:i,availableHeightPx:a}=e;if(n<=0||r<=0||i<=0||a<=0)return {widthPx:0,heightPx:0};if(t===`original`)return {widthPx:n,heightPx:r};if(t===`fit-width`)return tE(n,r,i);let o=Math.round(a*n/r);return o<=i?{widthPx:o,heightPx:a}:tE(n,r,i)}function tE(e,t,n){return {widthPx:n,heightPx:Math.round(n*t/e)}}function nE(e){return Number.isFinite(e)?Math.min(UT,Math.max(HT,e)):HT}function rE(e){return e.getState(za$1)}function iE(e,t){e.setState({volume:t.volume,muted:t.muted,playbackRate:t.playbackRate});}function aE(){let e=document.getElementById(zT);return e instanceof HTMLVideoElement?e:null}function oE(){let e=document.getElementById(BT);return !(e instanceof HTMLElement)||!e.classList.contains(`fluid_video_wrapper`)?null:e}function sE(){for(let e of ZT)if(document.body.classList.contains(qt$3(IT,e)))return e;return Ba$1(ba$1)}var cE=`div.flexi`,lE=`sticky`;function uE(e){let t=Number.parseFloat(e);return Number.isFinite(t)?t:0}function dE(e){let t=e.parentElement,n=e.closest(cE);if(t!==null&&n instanceof HTMLElement&&n.clientWidth>0){let r=n.clientWidth,i=document.getElementById(Gt$2);if(i!==null&&i.parentElement===n){let e=window.getComputedStyle(i);e.position===lE&&(r-=i.offsetWidth+uE(e.marginLeft)+uE(window.getComputedStyle(n).columnGap));}if(r=Math.floor(r),r>0){let n=e.style.width;e.style.width=`${String(r)}px`;let i=t.clientWidth;return e.style.width=n,i>0?Math.min(r,i):r}}return t!==null&&t.clientWidth>0?t.clientWidth:e.clientWidth}function fE(){let e=Pv(WT);return Math.max(0,window.innerHeight-e)}function pE(e){e.style.removeProperty(`width`),e.style.removeProperty(`height`);}function mE(e,t){if(!document.body.classList.contains(GT)){pE(e);return}let n=t.videoWidth,r=t.videoHeight;if(n<=0||r<=0)return;let i=eE({mode:sE(),videoWidth:n,videoHeight:r,columnWidthPx:dE(e),availableHeightPx:fE()});i.widthPx<=0||i.heightPx<=0||(e.style.width=`${String(i.widthPx)}px`,e.style.height=`${String(i.heightPx)}px`);}function hE(e,t){let n=t.volume??UT,r=t.muted??false,i=t.playbackRate??1;e.volume=nE(n),e.muted=r,e.playbackRate=i;}var gE=400,_E,vE=null;function yE(e,t){vE=()=>{vE=null,window.clearTimeout(_E),_E=void 0,iE(e,{volume:nE(t.volume),muted:t.muted,playbackRate:t.playbackRate});},window.clearTimeout(_E),_E=window.setTimeout(()=>{vE?.();},gE);}function bE(){vE?.();}var xE=15e3;function SE(e,t){let n=rE(e),r=()=>{let e=oE();e!==null&&mE(e,t);};if(oE()===null){let e=new MutationObserver(()=>{oE()!==null&&(e.disconnect(),r());});e.observe(document.body,{childList:true,subtree:true}),window.setTimeout(()=>{e.disconnect();},xE);}t.readyState>=HTMLMediaElement.HAVE_METADATA&&(hE(t,n),r()),t.addEventListener(`loadedmetadata`,()=>{hE(t,rE(e)),r();}),t.addEventListener(`volumechange`,()=>{yE(e,t);}),t.addEventListener(`ratechange`,()=>{yE(e,t);}),window.addEventListener(`pagehide`,bE),window.addEventListener(`resize`,()=>{r();}),new MutationObserver(()=>{r();}).observe(document.body,{attributes:true,attributeFilter:[`class`]});}function CE(e){e.addEventListener(`click`,t=>{document.body.classList.contains(GT)&&t.button===0&&(t.preventDefault(),t.stopImmediatePropagation(),e.paused?e.play().catch(()=>void 0):e.pause());},true);}function wE(e){Es$2(()=>{let t=aE();t!==null&&(SE(e,t),CE(t));});}var TE={id:IT,label:LT,pages:[...RT],defaultEnabled:true,cssOnly:true,settingsCaption:QT,choice:{label:`Video size`,options:[{value:_a$1,label:JT},{value:va$1,label:YT},{value:ya$1,label:XT}],defaultValue:ba$1},css:$T,mount:wE},EE=`Collections`,DE=`Custom collections`,OE=1;function kE(e){return `In ${String(e)} ${e===OE?`collection`:`collections`}`}var AE=14,jE=`source`,ME=`p`,NE=`rdw-post-panel-collections`,PE=`rdw-post-panel-collections-btn`;function FE(e){if(!(e instanceof HTMLSourceElement)){let t=e.currentSrc.trim();if(t.length>0)return t}let t=e.getAttribute(`src`);if(t===null)return null;let n=t.trim();return n.length===0?null:n}function IE(e){let t=document.getElementById(`${ME}${String(e)}`);return t instanceof Element?t:null}function LE(e,t){let n=IE(t);return n!==null&&n.contains(e)}function RE(e){let t=e.querySelector(jE);if(t instanceof HTMLSourceElement){let e=FE(t);if(e!==null)return e}return FE(e)}function zE(e){let t=[],n=document.getElementById(zT);n instanceof HTMLVideoElement&&t.push(n);for(let e of document.querySelectorAll(`video`))e instanceof HTMLVideoElement&&e!==n&&t.push(e);for(let n of t){if(LE(n,e))continue;let t=RE(n);if(t!==null)return t}return null}function BE(e,t){return e===null?null:Dt$3(e,t)}function VE(e){let t=document.getElementById(q_);if(t instanceof HTMLImageElement&&!LE(t,e)){let n=BE(FE(t),e);if(n!==null)return n}return BE(zE(e),e)}function HE(e){let[t,n]=z$2(false),r=V$2(null),[i,a]=z$2(()=>Ys$1(e.postId).length),o=Re$2(()=>{n(false),a(Ys$1(e.postId).length);},[e.postId]),s=Re$2(e=>{let t=e?.querySelector(`button`);r.current=t instanceof HTMLButtonElement?t:null;},[]),c=e.postId,l=Re$2(()=>VE(c),[c]);return K$3(`div`,{className:NE,ref:s,children:[K$3(q$3,{variant:`secondary`,size:`m`,className:PE,pressed:i>0,disabled:e.deleted===true&&i===0&&!t,...e.deleted===true&&i===0?{title:Lw}:{},"aria-label":i>0?kE(i):EE,onClick:()=>{t?o():n(true);},children:[K$3(i>0?ft$2:dt$2,{size:AE}),i>0?kE(i):EE]}),K$3(zn$1,{open:t,onClose:o,anchorRef:r,widthPx:260,"aria-label":DE,children:K$3(jd,{postId:c,readThumbUrl:l})})]})}var UE=`rdw-post-panel-download`,WE=`video#gelcomVideoPlayer`,GE=`Download the original file`,KE=`Downloading…`,qE=`Saved to your downloads folder`,JE=`Could not download. Press to try again`,YE=16,XE={idle:GE,busy:KE,done:qE,failed:JE};function ZE(e){let t=e.querySelector(WE);if(!(t instanceof HTMLVideoElement))return ``;let n=t.querySelector(`source`);return t.currentSrc||t.src||(n instanceof HTMLSourceElement?n.src:``)}function QE(e,t=document){let n=t.querySelector(`img#${q_}`);return [ZE(t),e??``,n instanceof HTMLImageElement?n.currentSrc||n.src:``].find(e=>e.length>0&&He$1(e)&&ut$4(e))??null}function $E(e){let[t,n]=z$2(`idle`);if(!Ue$1()||QE(e.originalHref)===null)return null;let r=XE[t];return K$3(`button`,{type:`button`,className:`${e.className} ${UE} rdw-kit-focusable`,"aria-label":r,title:r,"aria-busy":t===`busy`||void 0,disabled:t===`busy`,"data-phase":t,onClick:()=>{let t=QE(e.originalHref);t===null?n(`failed`):(n(`busy`),k$1(t,Re$1(Et$1(),{...e.info,url:t})).then(()=>{n(`done`);}).catch(t=>{m$2.warn(`post-panel: download failed`,e.info.postId,t),n(`failed`);}));},children:K$3(t===`done`?ft$2:kt$2,{size:YE})})}var eD=`Edit`,tD=`Resize image`,nD=`Report…`,rD=`Report to moderation`,iD=`Add note`,aD=`rdw-post-panel-post-actions`,oD=`rdw-post-panel-post-action`,sD=14;function cD(e){return e===`Edit`?eD:e===`Resize image`?tD:e===`Report to moderation`?nD:iD}function lD(e){return K$3(e===`Edit`?vt$2:e===`Resize image`?Ct$2:e===`Report to moderation`?yt$2:bt$2,{size:sD})}function uD(e){return e.links.length===0?null:K$3(`div`,{className:aD,children:e.links.map(e=>K$3(q$3,{variant:`ghost`,size:`m`,className:oD,"aria-label":e.text===`Report to moderation`?rD:cD(e.text),onClick:()=>{e.anchor.click();},children:[lD(e.text),cD(e.text)]},e.text))})}var dD=`info`,fD=`comments`,pD=`related`,mD=`Favorite`,hD=`In favorites`,gD=`Vote`,_D=`I came`,vD=`Comments`,yD=`Info`,bD=` · `,xD=`Original`,SD=`Vote`,CD=`I came`,wD=`KeyF`,TD=`Add to favorites (F)`,ED=`Remove from favorites (F)`,DD=`Vote up`,OD=`Voted up`,kD=`Post details`,AD=14,jD=14,MD=`rdw-post-panel`,ND=`rdw-post-panel-card`,PD=`rdw-post-panel-actions`,FD=`rdw-post-panel-actions-row`,ID=`rdw-post-panel-fav`,LD=`rdw-post-panel-original`,RD=`rdw-post-panel-vote`,zD=`rdw-post-panel-stats`,BD=`rdw-post-panel-stat-label`,VD=`rdw-post-panel-stat-value`,HD=`rdw-post-panel-source`,UD=`rdw-post-panel-icame`,WD=`rdw-post-panel-comments`,GD=`rdw-post-panel-comments-host`,KD=`rdw-post-panel-info`,qD=`rdw-post-panel-tabs`,JD=`rdw-post-panel-tabpanel`;function YD(e){if(e===null||e.length===0)return null;let t=Number(e);if(!Number.isFinite(t))return null;let n=Math.trunc(t);return n<0?null:n}function XD(e,t){return e.find(e=>e.label===t)?.value.trim()??``}function ZD(e,t,n){let r=Ov(XD(t,`Size`)),i=Number(n),a=XD(t,`Rating`).toLowerCase(),o=XD(t,`By`);return {postId:e,...a.length>0?{rating:a}:{},...n.trim().length>0&&Number.isFinite(i)?{score:i}:{},...r===null?{}:{width:r.width,height:r.height},...o.length>0?{owner:o}:{}}}function QD(e){return `${gD} ${e}`}function $D(e){return e===null?vD:`${vD}${bD}${String(e)}`}function eO(e){let t=YD(e.postId),[n,r]=z$2(()=>e.postId!==null&&xs$1(e.postId)),[i,a]=z$2(false),[o,s]=z$2(()=>e.postId===null?`—`:yv(e.postId)??`—`),[c,l]=z$2(false),[u,d]=z$2(false),[f$1,p]=z$2(false),[m]=z$2(()=>Tv()),[h]=z$2(()=>gv()),[g]=z$2(()=>fv()===null?hv()?.href??null:null),[_]=z$2(()=>fv()!==null),[v]=z$2(()=>Nv()),[y]=z$2(()=>Fv()!==null),[b]=z$2(()=>y?Lv():null),[x,S]=z$2(()=>y&&pO()?fD:dD),[C]=z$2(()=>e.postId!==null&&Oc$1(`more-like-this`,true)?Hy(document):[]),w=C.length>0,[T,ee]=z$2(false),[te]=z$2(()=>{let e=Nc$1(fb);return Kb(e)?e:null}),ne=e.postId===null?NaN:Number(e.postId),[re]=z$2(()=>f()?async()=>ab(await g$1(),C,ne):null),ie=Re$2(async(e,t)=>Gy(C,await cb(e,t),ne),[C,ne]),ae=y||w;B$2(()=>{if(e.postId!==null)return xv(e.postId,e=>{s(e.length>0?e:`—`);})},[e.postId]),B$2(()=>{if(!w)return;let e=()=>{S(pD),ee(true),document.getElementById(hi(pD))?.focus();};return document.addEventListener(Fw,e),()=>{document.removeEventListener(Fw,e);}},[w]);let oe=_&&!n,E=Re$2(async()=>{if(!(e.postId===null||i||oe)){a(true);try{if(n){let t=await Os(e.postId);if(t.status===`removed`){Cs$1(e.postId),r(!1);return}m$2.warn(`post-actions: remove favorite failed`,e.postId,t);return}let t=await Es(e.postId);if(t.status===`added`||t.status===`already`){Ss$1(e.postId),Hd(e.postId),r(!0),t.status===`added`&&t.score!==void 0&&(bv(e.postId,t.score),s(String(t.score)));return}if(t.status===`not_logged_in`){m$2.warn(`post-actions: favorite requires login`,e.postId);return}m$2.warn(`post-actions: favorite failed`,e.postId,t);}finally{a(false);}}},[oe,i,n,e.postId]);tT(wD,e.postId!==null&&!oe,()=>{E();});let D=Re$2(async()=>{if(!(e.postId===null||c||_)){l(true);try{let t=await Ds(e.postId);t!==null&&(bv(e.postId,t),s(String(t)),d(!0));}finally{l(false);}}},[_,e.postId,c]),O=Re$2(()=>{v?.anchor.click(),p(true);},[v]),se=Re$2(e=>{S(e),e===`related`&&ee(true);},[]),le=Le$2(()=>{let e=[{id:dD,label:yD}];return y&&e.push({id:fD,label:$D(b)}),w&&e.push({id:pD,label:pb}),e},[b,y,w]),ue=m.length>0||h.length>0||ae,de=e.postId!==null||v!==null||g!==null;return K$3(`div`,{className:MD,children:[K$3(FT,{postId:t}),K$3(`div`,{className:PD,children:[e.postId!==null||t!==null?K$3(`div`,{className:FD,children:[e.postId===null?null:K$3(q$3,{variant:n?`secondary`:`primary`,size:`m`,className:ID,loading:i,disabled:oe,pressed:n,title:oe?Lw:n?ED:TD,"aria-label":n?`${Fe$3.cardFavRemoveLabel} ${e.postId}`:`${Fe$3.cardFavAddLabel} ${e.postId}`,onClick:()=>{E();},children:[K$3(n?ut$2:lt$2,{size:AD}),n?hD:mD]}),t===null?null:K$3(HE,{postId:t,deleted:_})]}):null,de?K$3(`div`,{className:FD,children:[e.postId===null?null:K$3(q$3,{variant:`secondary`,size:`m`,className:RD,loading:c,disabled:_,pressed:u,title:_?Lw:u?OD:DD,"aria-label":SD,onClick:()=>{D();},children:[K$3(ht$2,{size:AD}),QD(o)]}),v===null?null:K$3(q$3,{variant:`secondary`,size:`m`,className:UD,disabled:_,..._?{title:Lw}:{},pressed:f$1,"aria-label":CD,onClick:O,children:[K$3(_t$2,{size:AD}),_D]}),g===null?null:K$3(`a`,{className:LD,href:g,target:`_blank`,rel:`noopener`,"aria-label":xD,title:xD,children:K$3(gt$2,{size:jD})}),t!==null&&!_?K$3($E,{originalHref:g,info:ZD(t,m,o),className:LD}):null]}):null]}),ue?K$3(ct$2,{className:ND,as:`section`,children:[ae?K$3(vi,{className:qD,"aria-label":kD,items:le,value:x,onChange:se}):null,K$3(`div`,{className:JD,role:`tabpanel`,id:gi(dD),"aria-labelledby":hi(dD),hidden:ae&&x!==`info`,children:K$3(tO,{stats:m,moreLinks:h})}),y?K$3(`div`,{className:`${JD} ${WD}`,role:`tabpanel`,id:gi(fD),"aria-labelledby":hi(fD),hidden:x!==fD,children:K$3(gO,{})}):null,w?K$3(`div`,{className:JD,role:`tabpanel`,id:gi(pD),"aria-labelledby":hi(pD),hidden:x!==pD,children:T?K$3(ax,{tags:C,lastKind:te,onPick:e=>{Pc$1(fb,e);},readFavorites:re,load:ie}):null}):null]}):null]})}function tO(e){return K$3(`div`,{className:KD,children:[e.stats.length>0?K$3(`div`,{className:zD,children:e.stats.map(e=>K$3(_O,{row:e},e.label))}):null,e.moreLinks.length>0?K$3(uD,{links:e.moreLinks}):null]})}var nO=`div#comment-list > div[id^="c"]`,rO=`div#comment-list > a#ci`,iO=`(0 hidden)`,aO=`Respond`,oO=`No comments yet`,sO=`Write a comment`,cO=`rdw-post-panel-comments-empty`,lO=`rdw-post-reply-links`,uO=`div#comment-list > div:not([id]) > a`,dO=`ruledesk-web.comments-return`;function fO(){try{window.sessionStorage.setItem(dO,window.location.search);}catch{}}function pO(){try{let e=window.sessionStorage.getItem(dO);return window.sessionStorage.removeItem(dO),e!==null&&e===window.location.search}catch{return  false}}function mO(){for(let e of document.querySelectorAll(`a`))if(e.textContent.trim()===aO)return e;return null}var hO=`comment_form`;function gO(){let e=V$2(null),t=V$2(null);B$2(()=>()=>{let e=t.current,n=document.getElementById(hO);e!==null&&e.parent!==null&&n!==null&&e.parent.insertBefore(n,e.next);},[]);let[n]=z$2(()=>{let e=Fv();return e!==null&&e.querySelector(nO)===null}),[r]=z$2(()=>mO());return Ie$2(()=>{let e=Fv(),t=e?.querySelector(rO);t instanceof HTMLElement&&t.textContent.trim()===iO&&(t.hidden=true);let n=r?.parentElement??null;n!==null&&Array.from(n.children).every(e=>e.tagName===`A`)&&n.classList.add(lO);let i=e?.querySelector(uO);return i?.addEventListener(`click`,fO),()=>{i?.removeEventListener(`click`,fO);}},[r]),Ie$2(()=>{let t=e.current,n=Fv();if(t===null||n===null||n.parentElement===t)return;let r=n.parentNode,i=n.nextSibling;return t.append(n),()=>{r!==null&&(n.parentElement===t||n.parentNode===null)&&r.insertBefore(n,i);}},[]),K$3(A$2,{children:[n||r!==null?K$3(`div`,{className:cO,children:[K$3(`span`,{children:n?oO:``}),r===null?null:K$3(q$3,{variant:`secondary`,size:`s`,onClick:()=>{let n=e.current,i=document.getElementById(hO);n!==null&&r!==null&&(i instanceof HTMLFormElement?(window.getComputedStyle(i).display===`none`&&r.click(),i.parentElement!==n&&(t.current={parent:i.parentNode,next:i.nextSibling},n.append(i)),i.querySelector(`textarea`)?.focus()):(r.click(),r.scrollIntoView({block:`center`})));},children:sO})]}):null,K$3(`div`,{className:GD,ref:e})]})}function _O(e){let{row:t}=e;return K$3(A$2,{children:[K$3(`span`,{className:BD,children:t.label}),t.label===`Source`&&t.href!==null?K$3(`a`,{className:`${VD} ${HD}`,href:t.href,title:t.href,rel:kv,children:t.value}):t.href===null?K$3(`div`,{className:VD,children:t.value}):K$3(`a`,{className:VD,href:t.href,children:t.value})]})}var vO=`post-actions`,yO=`Post side panel`,bO=[`post`],xO=`rdw-post-panel-mounted`,SO=1100,CO=`(max-width: 1099px)`,wO=`(min-width: ${String(SO)}px)`,TO=360,EO=320,DO=420,OO=13,kO=34,AO=10,jO=8,MO=12,NO=12,PO=12,FO=20,IO=62,LO=34,RO=`--rdw-post-panel-sticky-top`,zO=`--rdw-post-media-head`,BO=`data-rdw-large`,VO=`data-rdw-full`,HO=`rdw-post-actions`,UO=`rdw-post-actions--wide`,WO=`rdw-post-actions--narrow`,GO=`rdw-post-deleted-notice`,KO=640,qO=280,JO=`--rdw-post-deleted-ratio`,YO=`4 / 3`,XO=`post-actions: div.flexi missing; panel not mounted`,X=`body.${Kt$2(vO)}`,ZO=`
${X} #fit-to-screen div.flexi,
${X} div#right-col div.flexi,
${X} div.flexi {
  flex-wrap: wrap;
  align-items: flex-start;
  /* Space between the media and the panel, beside it or under it. */
  gap: ${String(PO)}px;
}
${X} #${Gt$2}.${HO} {
  box-sizing: border-box;
  width: ${String(TO)}px;
  min-width: ${String(EO)}px;
  max-width: min(${String(DO)}px, 100%);
  flex: 0 1 ${String(TO)}px;
  z-index: ${String(FO)};
  font: ${String(OO)}px/1.35 var(--rdw-font);
  color: var(--rdw-text);
}
${X} #${Gt$2}.${UO} {
  position: sticky;
  top: var(${RO}, ${String(NO)}px);
  align-self: flex-start;
  max-height: calc(100vh - var(${RO}, ${String(NO)}px) - ${String(NO)}px);
  overflow-y: auto;
}
${X} #${Gt$2}.${WO} {
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
  gap: ${String(AO)}px;
  position: relative;
}
${X} #${Gt$2} .rdw-post-panel-card {
  padding: ${String(MO)}px;
  display: grid;
  gap: ${String(AO)}px;
}
${X} #${Gt$2} .rdw-btn {
  min-height: ${String(kO)}px;
  font-size: ${String(OO)}px;
}
${X} #${Gt$2} .rdw-post-panel-actions {
  display: grid;
  gap: ${String(jO)}px;
}
${X} #${Gt$2} .rdw-post-panel-actions-row {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: ${String(jO)}px;
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
  flex: 0 0 ${String(LO)}px;
  width: ${String(LO)}px;
  height: ${String(LO)}px;
  min-width: ${String(LO)}px;
  min-height: ${String(LO)}px;
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
  grid-template-columns: ${String(IO)}px 1fr;
  column-gap: ${String(jO)}px;
  row-gap: ${String(jO)}px;
  font-size: ${String(OO)}px;
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
  gap: ${String(AO)}px;
}
${X} #${Gt$2} .rdw-post-panel-post-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2px ${String(jO)}px;
  padding-top: ${String(jO)}px;
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
${X} #${Dw} {
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: ${String(KO)}px;
  max-width: 100%;
  aspect-ratio: var(${JO}, ${YO});
  min-height: ${String(qO)}px;
  max-height: max(${String(qO)}px, calc(100vh - var(${RO}, ${String(NO)}px) - var(${zO}, 0px) - ${String(NO)}px));
  padding: 24px 24px 56px;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-l);
  background: var(--rdw-surface);
  color: var(--rdw-muted);
  font: ${String(OO)}px/1.4 var(--rdw-font);
  text-align: center;
}
${X} #${Dw} p {
  margin: 0;
}
${X} #${Dw} .${Ow} {
  color: var(--rdw-muted);
}
${X} #${Dw} .${kw} {
  color: var(--rdw-text);
  font-size: 16px;
  font-weight: 600;
}
${X} #${Dw} .${jw} {
  margin-top: 8px;
}
${X} #${Dw} .${Mw} {
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
${X} #${Dw} .${Nw} {
  min-width: 0;
  overflow-wrap: anywhere;
  color: var(--rdw-muted);
  font: 11px/1.4 ui-monospace, "Cascadia Mono", Consolas, "Courier New", monospace;
  opacity: 0.8;
}
${X} #${Dw} .${Pw} {
  flex: 0 0 auto;
  min-height: 24px;
  padding: 0 6px;
  color: var(--rdw-muted);
  font-size: 11px;
  font-weight: 400;
}
${X} #${Dw} .${Pw}:hover {
  background: var(--rdw-surface-2);
  color: var(--rdw-text);
}
${X} div.status-notice.${GO} {
  display: none;
}
${X} #${Gt$2} .rdw-post-panel-comments-host {
  min-width: 0;
}
@media ${CO} {
  ${X} #${Gt$2}.${UO} {
    position: static;
    max-height: none;
    overflow-y: visible;
  }
}
@media ${wO} {
  ${X} div#post-view > div#right-col {
    flex-grow: 1;
  }
  ${X} div.flexi > :has(+ #${Gt$2}.${UO}) {
    margin-left: auto;
  }
  ${X} #${Gt$2}.${UO} {
    margin-left: 12px;
    margin-right: auto;
    flex-shrink: 0;
  }
  ${X} div#post-view > div#right-col {
    min-width: 0;
  }
  ${X} div.flexi:has(> #${Gt$2}.${UO}) {
    flex-wrap: nowrap;
  }
  ${X} div.flexi > :has(+ #${Gt$2}.${UO}) {
    flex: 0 1 auto;
    min-width: 0;
  }
  ${X} div.flexi > :has(+ #${Gt$2}.${UO}) img#${q_} {
    max-width: 100%;
    height: auto !important;
  }
  ${X} div.flexi > :has(+ #${Gt$2}.${UO}) img#${q_}[${BO}]:not([${VO}]) {
    max-height: calc(100vh - var(${RO}, ${String(NO)}px) - var(${zO}, 0px) - ${String(NO)}px);
    width: auto !important;
  }
}
`.trim(),QO=null,$O=null;function ek(){QO!==null&&(QO(),QO=null),$O!==null&&(ve$1(null,$O),$O.remove(),$O=null);let e=document.getElementById(Gt$2);e!==null&&e.remove(),document.body.classList.remove(xO);}function tk(){return typeof window.matchMedia==`function`?window.matchMedia(CO).matches:window.innerWidth<SO}function nk(e){let t=Pv(NO);e.style.setProperty(RO,`${String(t)}px`);}function rk(e){let t=e.querySelector(`img#${q_}`);if(!(t instanceof HTMLImageElement)||t.hasAttribute(VO))return;let n=Number(t.getAttribute(`width`)),r=Number.isFinite(n)&&n>0?n:t.naturalWidth;r===0&&!t.complete&&t.addEventListener(`load`,()=>{rk(e);},{once:true}),t.toggleAttribute(BO,r>850);let i=Math.max(0,Math.round(t.getBoundingClientRect().top-e.getBoundingClientRect().top));e.style.setProperty(zO,`${String(i)}px`);}function ik(e,t){let n=tk();e.classList.toggle(UO,!n),e.classList.toggle(WO,n),nk(e),t.style.setProperty(RO,e.style.getPropertyValue(RO));let r=mv(t,Gt$2);r===null?t.append(e):r.after(e),rk(t);}function ak(e,t){let n=()=>{ik(e,t);};n();let r=()=>{n();};window.addEventListener(`resize`,r);let i=null;if(typeof window.matchMedia==`function`){let e=window.matchMedia(CO),t=()=>{n();};typeof e.addEventListener==`function`?(e.addEventListener(`change`,t),i=()=>{e.removeEventListener(`change`,t);}):typeof e.addListener==`function`&&(e.addListener(t),i=()=>{e.removeListener(t);});}QO=()=>{window.removeEventListener(`resize`,r),i!==null&&i();};}function ok(e){let t=document.getElementById(Dw);t!==null&&(ve$1(null,t),t.remove());let n=fv();if(n===null||e.querySelector(`#image, video`)!==null)return;let r=document.createElement(`div`);r.id=Dw,r.setAttribute(`role`,`status`);let i=Dv();i!==null&&r.style.setProperty(JO,`${String(i.width)} / ${String(i.height)}`),ve$1(ee(Yw,{reason:n.reason,md5:n.md5,showRelated:Oc$1(`more-like-this`,true)&&Hy(document).length>0}),r);let a=null;for(let t of e.children)if(t.id!==`rdw-post-actions`){a=t;break}if(a===null)e.prepend(r);else {let e=a.querySelector(`a#prev_search_link, a#next_search_link`);for(;e!==null&&e.parentElement!==a;)e=e.parentElement;e===null?a.prepend(r):e.after(r);}n.element.classList.add(GO);}function sk(e){ek();let t=pv();if(t===null){m$2.warn(XO);return}let r=document.createElement(`div`);r.id=Gt$2,r.className=HO,r.setAttribute(`role`,`complementary`),r.setAttribute(`aria-label`,yO);let i=Ki$1(e.search);$O=r,document.body.classList.add(xO),ik(r,t),ak(r,t),ok(t),ve$1(ee(eO,{postId:i}),r);}var ck={id:vO,label:yO,settingsCaption:`One panel beside the picture: Favorite, vote, download, collections and the details of the post, in place of the site's scattered links.`,pages:[...bO],defaultEnabled:true,css:ZO,mount:sk},lk=`Download results`,uk=`Download every post of this search`,dk=`Select`,fk=`Pick posts on this page to add to a collection`,pk=`Pick posts on this page to add to a collection or to download`,mk=`Add to collection`,hk=`Select page`,gk=`rdw-select-note`,_k=`Download selected`,vk=`Download results`,yk=`Download`,bk=` (selected)`,xk=`selection`,Sk=`selected posts`,Ck=`Download every post of “`,wk=`”? The list is read through the API first, then the files are saved one by one. A large search takes a long time; it can be paused or cancelled in the panel.`;function Tk(e){return Mo$1(new URLSearchParams(e).get(`tags`)??``)}function Ek(e){return new URLSearchParams(e).get(`s`)===oe$1}function Dk(e){let t=Pt$2(window.location.hash);if(t!==null){let e=G$3().collections.find(e=>e.id===t);if(e!==void 0)return e.name}return e}function Ok(e={}){let[t,n]=z$2(false),[r,i]=z$2(0),[a,o]=z$2(false),[s,c]=z$2(null),[l,u]=z$2(``);B$2(()=>()=>{eo();},[]);let{onSelectingChange:d}=e;B$2(()=>{d?.(t);},[d,t]),jp(t,()=>{eo(),n(false),i(0);});let f=window.location.search;if(!Ek(f))return null;let p=$e$1(),m=Tk(f),h=Dk(m),g=()=>{eo(),n(false),i(0);};if(t){let t=K$3(Jr,{layout:`stack`,count:r,selectAllLabel:hk,onSelectAll:Xa,onClear:Za,onCancel:g,children:[K$3(q$3,{variant:`secondary`,disabled:r===0,onClick:()=>{c(Ya(Af));},children:mk}),p?K$3(q$3,{variant:`secondary`,disabled:r===0,onClick:()=>{let e=Ka();g(),e.length>0&&!Wt()&&Gt(h.length>0?`${h}${bk}`:Sk,{kind:`ids`,ids:e},xk);},children:_k}):null]}),n=e.barHost??null;return K$3(A$2,{children:[n===null?t:Ft$1(t,n),K$3(mp,{open:s!==null,posts:s??[],onClose:()=>{c(null);},onDone:e=>{g(),Bf(),u(pp(e));}})]})}return K$3(A$2,{children:[!p||Ao$1(m)?null:K$3(q$3,{variant:`secondary`,size:`s`,title:uk,onClick:()=>{o(true);},children:lk}),K$3(q$3,{variant:`secondary`,size:`s`,title:p?pk:fk,onClick:()=>{u(``),$a(i),n(true);},children:dk}),l.length>0?K$3(`span`,{className:gk,role:`status`,children:l}):null,K$3(xn$1,{variant:`confirm`,open:a,title:vk,message:`${Ck}${h}${wk}`,confirmLabel:yk,cancelLabel:Fe$3.cancel,onConfirm:()=>{o(false),Wt()||Gt(h,{kind:`query`,tags:m});},onClose:()=>{o(false);}})]})}var kk=`Save as collection`,Ak=`Save this search as a dynamic collection`,jk=`New dynamic collection`,Mk=`rdw-search-tools-save`,Nk=`rdw-dialog__fields`,Pk=`rdw-dialog__actions`,Fk=`rdw-search-tools-save-error`,Ik=`rdw-search-tools-saved`,Lk=`Saved to Collections`,Rk=`:`,zk=/\s+/,Bk=[`(`,`)`,`~`],Vk=`Query`,Hk=`Enter a name.`,Uk=`A collection with this name already exists.`,Wk=`Enter a tag search that is not saved yet.`,Gk=`
.${Fk} {
  margin: 0;
  color: var(--rdw-danger);
  font-size: 12px;
}
.${Ik} {
  flex: 1 1 auto;
  align-self: center;
  text-align: center;
  color: var(--rdw-muted);
  font-size: 12px;
}
`.trim();function Kk(e){return e.query??ao$1(e.tags)}function qk(e){let t=Mo$1(e);if(Ao$1(t)||!t.split(zk).some(e=>!Bk.includes(e)&&!e.includes(Rk))||To$1(t)!==null)return null;let n=Uc$1();if(bo$1(t,n)||xo$1(t,n)||ho$1(t,n,Fc$1())>=0)return null;for(let e of G$3().collections)if(!I$3(e)&&Po$1(t,Kk(e)))return null;return t}function Jk(e){let t=e.trim().toLowerCase();if(t.length===0)return Hk;for(let e of G$3().collections)if(e.name.trim().toLowerCase()===t)return Uk;return null}function Yk(e,t){let n=new URLSearchParams(e);return n.get(`s`)===`list`&&Po$1(n.get(`tags`)??``,t)}function Xk(e){let[t,n]=z$2(false),[r,i]=z$2(``),[a,o]=z$2(``),[s,c]=z$2(``),[l,u]=z$2(false),d=qk(e.tags);if(d===null&&!t)return l?K$3(A$2,{children:[K$3(`style`,{children:Gk}),K$3(`span`,{className:Ik,role:`status`,children:Lk})]}):null;let f=()=>{n(false),i(``),c(``);},p=()=>{let e=Jk(r);if(e!==null){c(e);return}let t=qk(a);if(t===null){c(Wk);return}let n=hc$1(r.trim(),t),i=window.location.search;Yk(i,t)?(bw(n.id,i),u(true),f()):(f(),window.location.assign(so$1(io$1(t))));};return K$3(A$2,{children:[K$3(`style`,{children:Gk}),K$3(q$3,{variant:`secondary`,size:`s`,className:Mk,title:Ak,onClick:()=>{o(d??``),i(d??``),n(true);},children:kk}),K$3(xn$1,{open:t,onClose:f,title:jk,children:K$3(`form`,{className:Nk,onSubmit:e=>{e.preventDefault(),e.stopPropagation(),p();},children:[K$3(Kt$1,{label:Fe$3.nameLabel,value:r,onChange:e=>{i(e),c(``);}}),K$3(Nt,{label:Vk,value:a,onChange:e=>{o(e),c(``);}}),s.length>0?K$3(`p`,{className:Fk,role:`alert`,children:s}):null,K$3(`div`,{className:Pk,children:[K$3(q$3,{type:`button`,variant:`secondary`,size:`s`,onClick:f,children:Fe$3.cancel}),K$3(q$3,{type:`submit`,variant:`primary`,size:`s`,children:Fe$3.save})]})]})})]})}function Zk(){return document.documentElement.classList.contains(c$1)}var Qk=`div.awesomplete`,$k=`rdw-site-search-tools`,eA=`rdw-site-search-tool`,tA=`rdw-site-search-box`,nA=`Clear search`,rA=`Search syntax`,iA=380,aA=14,oA={label:rA,widthPx:iA,rows:[[`cat dog`,`posts with both tags`],[`( cat ~ dog )`,`posts with either tag; keep the spaces`],[`-cat`,`posts without the tag`],[`ca*t`,`any tag that starts with ca and ends with t`],[`night~`,`tags spelled like night`],[`user:bob`,`posts uploaded by bob`],[`rating:safe`,`by rating; -rating:safe for the rest`],[`parent:1234`,`post 1234 and its child posts`],[`width:>=1000`,`by size; height: works the same`],[`aspectratio:16:9`,`by shape, within 3%`],[`sourcedomains:x.com`,`by the site of the source`],[`md5:abc*`,`by the file's hash`]],note:`Sort, Min score, Media and AI posts are set with the controls below the field.`};function sA(e){let{input:t}=e,[n,r]=z$2(t.value.length>0),[i,a]=z$2(false),o=V$2(null);return B$2(()=>{let e=()=>{r(t.value.length>0);},n=window.setInterval(e,400);return t.addEventListener(`input`,e),t.addEventListener(`change`,e),()=>{window.clearInterval(n),t.removeEventListener(`input`,e),t.removeEventListener(`change`,e);}},[t]),K$3(A$2,{children:[n?K$3(`button`,{type:`button`,className:`${eA} rdw-kit-focusable`,"aria-label":nA,title:nA,onClick:()=>{t.value=``,t.dispatchEvent(new Event(`input`,{bubbles:true})),r(false),t.focus();},children:K$3(pt$2,{size:aA})}):null,K$3(`button`,{type:`button`,ref:o,className:`${eA} rdw-kit-focusable`,"aria-label":rA,title:rA,"aria-expanded":i,onClick:()=>{a(!i);},children:K$3(Ot$2,{size:aA})}),K$3(zn$1,{open:i,onClose:()=>{a(false);},anchorRef:o,widthPx:iA,"aria-label":rA,children:K$3(Sr,{help:oA})})]})}function cA(e){if(!Zk())return;let t=e.closest(Qk);if(!(t instanceof HTMLElement)||t.querySelector(`.rdw-site-search-tools`)!==null)return;t.classList.add(tA);let n=document.createElement(`span`);n.className=$k,t.append(n),ve$1(K$3(sA,{input:e}),n);}var lA=`search-tools`,uA=`Search tools`,dA=[`list`,`post`];function fA(){let e=Lo$2();return e!==null&&e.length>0?[...e]:Uc$1()}var pA=`input[name="tags"]`,mA=`ul#tag-sidebar`,hA=`rdw-search-tools`,gA=`rdw-search-tools`,_A=`rdw-search-tools-card`,vA=`rdw-search-tools-chips`,yA=`rdw-search-tools-chip`,bA=`data-chip-start`,xA=`data-chip-end`,SA=`data-chip-toggle`,CA=`data-chip-remove`,wA=`rdw-search-tools-field`,TA=`rdw-search-tools-row-sort`,EA=`rdw-search-tools-foot`,DA=`rdw-search-tools-bar`,OA=`rdw-search-tools-locked`,kA=`rdw-search-tools-reset`,AA=/\s+/,jA=/\s+/g,MA=700,NA=400,PA=`:`,FA=`score:>=`,IA=/^score:>=(\d+)$/,LA=`sort:`,RA=`video`,zA=`-${RA}`,BA=`tag-type-`,VA=`Sorts within the current search`,HA=`Reset`,UA=`Clear the search and all filters`,WA=`Enter`,GA=`input`,KA=`change`,qA=`click`,JA=`awesomplete-selectcomplete`,YA=`search-tools: search form not found; not mounted`,Z=Kt$2(lA),XA=4e3,ZA={childList:true,subtree:true},QA=[`artist`,`character`,`copyright`,`general`,`metadata`];function $A(e){for(let t of QA)if(t===e)return  true;return  false}var ej=[{value:`all`,label:`All`},{value:`images`,label:`Images`},{value:`videos`,label:`Videos`}],tj=B,nj=We,rj={[N]:`Feed`,[P]:`Following`,[F]:`Collections`},ij=[{value:`newest`,label:`Newest`,token:null},{value:`oldest`,label:`Oldest`,token:`sort:id:asc`},{value:`score`,label:`Top score`,token:`sort:score:desc`},{value:`updated`,label:`Recently updated`,token:`sort:updated:desc`},{value:`random`,label:`Random`,token:`sort:random`}],aj=new Map;for(let e of ij)e.token!==null&&aj.set(e.token,e.value);var oj=`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='m21 21-4.3-4.3'/%3E%3C/svg%3E") center / contain no-repeat`,sj=228,cj=[`body.${Z} .${gA} {`,`  margin-top: 8px;`,`  max-width: 100%;`,`  box-sizing: border-box;`,`}`,`body.${Z} div.sidebar {`,`  width: ${String(sj)}px;`,`  min-width: ${String(sj)}px;`,`  max-width: ${String(sj)}px;`,`}`,`body.${Z} .${gA} {`,`  font-family: var(--rdw-font);`,`}`,`body.${Z} .${gA} * {`,`  font-family: var(--rdw-font);`,`}`,`body.${Z} .${_A} {`,`  padding: 10px;`,`  display: grid;`,`  gap: 10px;`,`}`,`body.${Z} .${vA} {`,`  display: flex;`,`  flex-wrap: wrap;`,`  gap: 5px;`,`}`,`body.${Z} .${yA} {`,`  cursor: default;`,`}`,`body.${Z} .${yA}[${SA}="1"] {`,`  cursor: pointer;`,`}`,`body.${Z} .${wA} {`,`  display: grid;`,`  gap: 0;`,`  min-width: 0;`,`}`,`body.${Z} .${TA} {`,`  display: grid;`,`  grid-template-columns: 1fr 72px;`,`  gap: 8px;`,`  align-items: start;`,`}`,`body.${Z} .${EA} {`,`  display: flex;`,`  flex-direction: column;`,`  align-items: stretch;`,`  gap: 6px;`,`  border-top: 1px solid var(--rdw-border);`,`  padding-top: 10px;`,`}`,`body.${Z} .${EA} > button {`,`  width: 100%;`,`  white-space: nowrap;`,`}`,`body.${Z} .${tA} {`,`  position: relative;`,`  display: block;`,`}`,`body.${Z} .${tA}::before {`,`  content: "";`,`  position: absolute;`,`  left: 9px;`,`  top: 50%;`,`  z-index: 1;`,`  width: 14px;`,`  height: 14px;`,`  transform: translateY(-50%);`,`  background: var(--rdw-muted);`,`  -webkit-mask: ${oj};`,`  mask: ${oj};`,`  pointer-events: none;`,`}`,`body.${Z} .${tA} > input[name="tags"] {`,`  padding-left: 30px !important;`,`  padding-right: 54px !important;`,`  box-sizing: border-box;`,`}`,`body.${Z} .${$k} {`,`  position: absolute;`,`  right: 4px;`,`  top: 50%;`,`  z-index: 1;`,`  transform: translateY(-50%);`,`  display: flex;`,`  gap: 2px;`,`}`,`body.${Z} button.${eA} {`,`  display: inline-grid;`,`  place-items: center;`,`  width: 22px;`,`  height: 22px;`,`  min-height: 0;`,`  margin: 0;`,`  padding: 0;`,`  border: 0;`,`  border-radius: var(--rdw-radius-s);`,`  background: transparent;`,`  color: var(--rdw-muted);`,`  cursor: pointer;`,`}`,`body.${Z} button.${eA}:hover {`,`  color: var(--rdw-text);`,`}`,`body.${Z} .${DA}:not(:empty) {`,`  margin-bottom: 8px;`,`}`,`body.${Z} .${OA} {`,`  opacity: 0.45;`,`  pointer-events: none;`,`}`,`body.${Z} .${EA} > .${gk} {`,`  font: 12px/1.4 var(--rdw-font);`,`  color: var(--rdw-muted);`,`}`].join(`
`);function lj(){let e=document.querySelector(pA);return e instanceof HTMLInputElement?e:null}function uj(e){let t=e.closest(`form`);return t instanceof HTMLFormElement?t:null}function dj(e){let t=e.trim();return t.length===0?[]:t.split(AA).filter(e=>e.length>0)}function fj(e){return e.replace(jA,` `).trim()}function pj(e){return e.join(` `)}function mj(e){return e.startsWith(`-`)&&e.length>1?e.slice(1):e}function hj(e){return e.trim().toLowerCase().replaceAll(` `,`_`)}function gj(e){return e===RA||e===zA}function _j(e){return mj(e).startsWith(LA)}function vj(e){return IA.test(mj(e))}function yj(e){return gj(e)||_j(e)||vj(e)}function bj(e){return mj(e).includes(PA)}function xj(e){let t=false,n=false;for(let r of e)r===RA?t=true:r===zA&&(n=true);return t?`videos`:n?`images`:`all`}function Sj(e){for(let t of e){let e=aj.get(mj(t));if(e!==void 0)return e}return `newest`}function Cj(e){for(let t of e){let e=IA.exec(mj(t));if(e===null)continue;let n=e[1];if(n===void 0)continue;let r=Number(n);if(Number.isFinite(r)&&r>0)return r}return null}function wj(e){return e.filter(e=>!yj(e))}function Tj(e){return ij.find(t=>t.value===e)?.token??null}function Ej(e,t,n,r){let i=wj(e);t===`images`?i.push(zA):t===`videos`&&i.push(RA);let a=Tj(n);return a!==null&&i.push(a),r!==null&&r>0&&i.push(`${FA}${String(r)}`),i}function Dj(e){window.location.assign(so$1(io$1(pj(e))));}function Oj(e){return e.startsWith(`-`)&&e.length>1?e.slice(1):`-${e}`}function kj(e,t,n){return t<0||n<t||t>=e.length?[...e]:e.filter((e,r)=>r<t||r>n)}function Aj(e,t,n){return e.map((e,r)=>r===t?n:e)}function jj(e){return e===`artist`?`artist`:e===`character`?`character`:e===`copyright`?`copyright`:e===`metadata`?`metadata`:`default`}function Mj(e){for(let t of e){if(!t.startsWith(BA))continue;let e=t.slice(9);if($A(e))return e}return null}var Nj=[`?`,`+`,`-`],Pj=1;function Fj(e){let t=[...e.querySelectorAll(`a[href]`)].reverse();for(let e of t){let t=e.getAttribute(`href`);if(t===null||t.length===0)continue;let n;try{n=new URL(t,re$1);}catch{continue}let r=n.searchParams.get(le$1);if(r===null)continue;let i=dj(r),a=i[0];if(i.length===Pj&&a!==void 0)return hj(mj(a))}for(let e of t){let t=e.textContent?.trim()??``;if(t.length>0&&!Nj.includes(t))return hj(t)}return null}function Ij(){let e=new Map,t=document.querySelector(mA);if(!(t instanceof HTMLUListElement))return e;for(let n of t.children){if(!(n instanceof HTMLLIElement))continue;let t=Mj(n.classList);if(t===null)continue;let r=Fj(n);r!==null&&e.set(r,t);}return w(e),e}function Lj(){let e=document.querySelector(an$2.filterAiCheckbox);return e instanceof HTMLInputElement?e:null}function Rj(e){document.body.classList.toggle(ts$1,e);}function zj(e,t){let n=Lj();if(n!==null)return e(n),()=>{};let r=false,i=e=>{r||(r=true,a.disconnect(),window.clearTimeout(o),e());},a=new MutationObserver(()=>{let t=Lj();t!==null&&i(()=>{e(t);});});a.observe(document.documentElement,ZA);let o=window.setTimeout(()=>{i(t);},XA);return ()=>{i(()=>{});}}function Bj(){return et()??`posts`}function Vj(e){return q$1(Bj())}function Hj(e,t){if(e[t]!==`(`)return null;for(let n=t+1;n<e.length;n+=1){if(e[n]===`(`)return null;if(e[n]===`)`){let r=e.slice(t+1,n);return r.length===0?null:{end:n,inner:r}}}return null}function Uj(e){if(e.length===0||e.length%2==0)return null;let t=[];for(let n=0;n<e.length;n+=1){let r=e[n];if(r===void 0)return null;if(n%2==1){if(r!==`~`)return null}else {if(r===`(`||r===`)`||r===`~`)return null;t.push(r);}}return t.length>0?t:null}function Wj(e){let t=e.join(` `),n=pj([`(`,...e.flatMap((e,t)=>t===0?[e]:[`~`,e]),`)`]),r=fA(),i=e.length;return bo$1(n,r)||ho$1(n,r,Fc$1())>=0?{label:`Feed · ${String(r.length)} artists`,title:t}:{label:`Any of ${String(i)} tags`,title:t}}function Gj(e){return e.map(e=>e.kind===`tag`?`t:${String(e.start)}:${e.token}:${e.chipKind}`:`g:${e.kind}:${String(e.start)}:${String(e.end)}:${e.label}:${e.title}`).join(`|`)}function Kj(e){let t=Ij(),n=[],r=0;for(;r<e.length;){let i=e[r];if(i===void 0)break;if(yj(i)){r+=1;continue}let a=Hj(e,r);if(a!==null){let t=e.slice(r,a.end+1),i=To$1(pj(t));if(i!==null&&i.length>0){n.push({kind:`id-group`,start:r,end:a.end,label:`${String(i.length)} posts`,title:t.join(` `)}),r=a.end+1;continue}let o=Uj(a.inner);if(o!==null){let{label:e,title:t}=Wj(o);n.push({kind:`or-group`,start:r,end:a.end,label:e,title:t}),r=a.end+1;continue}}let o=i.startsWith(`-`)&&i.length>1,s=t.get(hj(mj(i)))??null;n.push({kind:`tag`,start:r,end:r,token:i,label:i,excluded:o,chipKind:s===null?vs(mj(i)):jj(s),title:bj(i)?i:null}),r+=1;}return n}function qj(e,t){let n=dj(e),r=Kj(n);return {chips:r,chipsSig:Gj(r),media:xj(n),sort:Sj(n),minScore:Cj(n)}}function Jj(e){let t=document.getElementById(hA);if(t instanceof HTMLDivElement)return t.previousElementSibling!==e&&e.after(t),t;let n=document.createElement(`div`);return n.id=hA,n.className=gA,e.after(n),n}function Yj(e,t){e.value=fj(pj(t));}function Xj(e){let{input:t}=e,[n,r]=z$2(()=>qj(t.value)),[i,a]=z$2(n.minScore);bs(n.chips.flatMap(e=>e.kind===`tag`&&!e.excluded&&e.chipKind==="default"&&!bj(e.token)?[mj(e.token)]:[]));let[o,s]=z$2(()=>{let e=Lj();return e===null?null:Vj()}),c=V$2(false),l=V$2(null),u=V$2(t.value),d=()=>{l.current!==null&&(window.clearTimeout(l.current),l.current=null);},f=e=>{d(),l.current=window.setTimeout(()=>{l.current=null,Dj(e);},NA);},p=e=>{let n=qj(t.value);u.current=t.value,r(e=>{let t=n.chipsSig===e.chipsSig;return t&&n.media===e.media&&n.sort===e.sort&&n.minScore===e.minScore?e:{...n,chips:t?e.chips:n.chips}}),c.current||a(n.minScore),e.navigate&&f(dj(t.value));},m=(e,n)=>{Yj(t,e),u.current=t.value;let i=qj(t.value);r(e=>{let t=i.chipsSig===e.chipsSig;return {...i,chips:t?e.chips:i.chips}}),c.current||a(i.minScore),n.navigate&&f(e);},h=V$2(p);h.current=p,B$2(()=>{let e=()=>{h.current({navigate:false});};t.addEventListener(GA,e),t.addEventListener(KA,e),t.addEventListener(JA,e);let n=document.querySelector(mA),r=()=>{window.setTimeout(()=>{h.current({navigate:false});},0);};n!==null&&n.addEventListener(qA,r);let i=window.setInterval(()=>{document.hidden||t.value!==u.current&&h.current({navigate:false});},MA);return ()=>{d(),t.removeEventListener(GA,e),t.removeEventListener(KA,e),t.removeEventListener(JA,e),n!==null&&n.removeEventListener(qA,r),window.clearInterval(i);}},[t]),B$2(()=>{let e=null,t=()=>{e!==null&&s(Vj());},n=zj(n=>{e=n,s(Vj()),Rj(true),n.addEventListener(KA,t);},()=>{s(null),Rj(false);});return ()=>{n(),e!==null&&e.removeEventListener(KA,t),Rj(false);}},[]);let g=e=>{let n=e.target;if(!(n instanceof Element))return;let r=n.closest(`[${bA}]`);if(!(r instanceof HTMLElement))return;let i=r.getAttribute(bA),a=r.getAttribute(xA);if(i===null||a===null)return;let o=Number(i),s=Number(a);if(!Number.isFinite(o)||!Number.isFinite(s))return;if(n.closest(`[${CA}]`)!==null){e.preventDefault();let n=dj(t.value);m(kj(n,o,s),{navigate:true});return}if(r.getAttribute(SA)!==`1`)return;e.preventDefault();let c=dj(t.value),l=c[o];l===void 0||bj(l)||m(Aj(c,o,Oj(l)),{navigate:true});},_=e=>{let n=ej.find(t=>t.value===e)?.value;if(n===void 0)return;let r=dj(t.value);m(Ej(r,n,Sj(r),Cj(r)),{navigate:true});},v=e=>{let n=ij.find(t=>t.value===e)?.value;if(n===void 0)return;let r=dj(t.value);m(Ej(r,xj(r),n,Cj(r)),{navigate:true});},y=()=>{let e=dj(t.value),n=null;i!==null&&Number.isFinite(i)&&i>0&&(n=Math.floor(i));let r=Cj(e);r===n?a(r):m(Ej(e,xj(e),Sj(e),n),{navigate:true});},b=e=>{let n=tj.find(t=>t.value===e)?.value;if(n===void 0)return;if(Lj()===null){s(null);return}if(W()||n===q$1(Bj()))return;let r=Bj();K$1(r,n===z),X$1(r),s(n);let i=dj(t.value),a=dj(new URLSearchParams(window.location.search).get(`tags`)??``);pj(i)===pj(a)?window.location.reload():(d(),Dj(i));},x=rj[Bj()],S=x===void 0?nj:`${nj} in ${x}`,[C,w]=z$2(null),[T,ee]=z$2(false),te=()=>{d(),Yj(t,[]),u.current=t.value,r(qj(``)),a(null),window.location.assign(so$1([]));};return K$3(A$2,{children:[K$3(`style`,{children:jt$2}),K$3(`div`,{className:DA,ref:w}),K$3(`div`,{...T?{className:OA,inert:true}:{},children:K$3(ct$2,{className:_A,children:[n.chips.length>0?K$3(`div`,{className:wA,children:[K$3(Tr,{children:`Tags`}),K$3(`div`,{className:vA,onClick:g,role:`list`,"aria-label":`Search tags`,children:n.chips.map(e=>{if(e.kind===`tag`){let t=e.excluded,n=t?`rdw-chip--exclude`:`rdw-chip--dot`,r=e.chipKind==="default"?vs(mj(e.token)):e.chipKind,i=!t&&r!=="default"?`rdw-chip--${r}`:``,a=!bj(e.token);return K$3(`span`,{className:[`rdw-chip`,n,i,yA].filter(e=>e.length>0).join(` `),role:`listitem`,title:e.title??void 0,"data-chip-start":String(e.start),"data-chip-end":String(e.end),"data-chip-toggle":a?`1`:`0`,children:[t?null:K$3(`i`,{className:`rdw-chip__dot`,"aria-hidden":`true`}),K$3(`span`,{children:e.label}),K$3(`button`,{type:`button`,className:`rdw-chip__remove rdw-kit-focusable`,"aria-label":`Remove ${e.label}`,"data-chip-remove":`1`,children:K$3(pt$2,{size:12})})]},`t-${String(e.start)}-${e.token}`)}return K$3(`span`,{className:`rdw-chip rdw-chip--group ${yA}`,role:`listitem`,title:e.title,"data-chip-start":String(e.start),"data-chip-end":String(e.end),"data-chip-toggle":`0`,children:[K$3(`span`,{children:e.label}),K$3(`button`,{type:`button`,className:`rdw-chip__remove rdw-kit-focusable`,"aria-label":`Remove ${e.label}`,"data-chip-remove":`1`,children:K$3(pt$2,{size:12})})]},`g-${String(e.start)}-${String(e.end)}-${e.label}`)})})]}):null,K$3(`div`,{className:wA,children:[K$3(Tr,{children:`Media`}),K$3(Dr,{label:`Media`,options:ej.map(e=>({value:e.value,label:e.label})),value:n.media,onChange:_})]}),K$3(`div`,{className:TA,title:VA,children:[K$3(ai,{label:`Sort`,options:ij.map(e=>({value:e.value,label:e.label})),value:n.sort,onChange:v}),K$3(`div`,{onFocusIn:()=>{c.current=true;},onFocusOut:e=>{let t=e.relatedTarget;t instanceof Node&&e.currentTarget.contains(t)||(c.current=false,y());},onKeyDown:e=>{e.key===WA&&(e.preventDefault(),y());},children:K$3(Dn$1,{label:`Min score`,placeholder:`Any`,value:i,min:1,step:1,onChange:a})})]}),o===null?null:K$3(`div`,{className:wA,children:[K$3(Tr,{children:S}),K$3(Dr,{label:S,options:tj.map(e=>({value:e.value,label:e.label})),value:o,disabled:W(),onChange:b}),W()?K$3(ut,{}):null]}),K$3(`div`,{className:EA,children:[K$3(q$3,{variant:`secondary`,size:`s`,className:kA,title:UA,onClick:te,children:HA}),K$3(Xk,{tags:t.value}),K$3(Ok,{barHost:C,onSelectingChange:ee})]})]})})]})}function Zj(e){let t=lj();if(t===null){m$2.warn(YA);return}let n=uj(t);if(n===null){m$2.warn(YA);return}cA(t);let r=Jj(n);ve$1(K$3(Xj,{input:t}),r),r.classList.add(ns$1);let i=()=>{Qa()||is$1(r.getBoundingClientRect().height);};typeof ResizeObserver==`function`?new ResizeObserver(i).observe(r):window.requestAnimationFrame(i);}var Qj={id:lA,label:uA,settingsCaption:`A panel under the search field: rating, type, order and score are picked there and written into the search as text.`,pages:[...dA],defaultEnabled:true,css:cj,mount:Zj},$j=`tag-groups`,eM=`Collapse tags`,tM=`ul#tag-sidebar`,nM=`rdw-tag-group-toggle`,rM=`rdw-tag-group-collapsed`,iM=Kt$2($j),aM=`Tag sidebar not found`,oM=new Set([`Copyright`,`Character`,`Artist`,`General`,`Meta`]),sM=[`General`,`Meta`],cM=[`list`,`post`],lM=`ul#tag-sidebar > li.${rM}`,uM=`html.${c$1} body.${iM} ${lM}`,dM=`body.${iM} ${lM}`,fM=[`${uM},`,`${dM} { display: none; }`,`body.${iM} button.${nM} {`,`  background: transparent;`,`  border: none;`,`  color: inherit;`,`  cursor: pointer;`,`  font: inherit;`,`  padding: 0;`,`}`,`body.${iM} button.${nM}:focus-visible {`,`  outline: 2px solid var(--rdw-accent);`,`  outline-offset: 2px;`,`}`].join(`
`),pM=A$3({collapsed:k$3(T$2())});function mM(){return {collapsed:[...sM]}}function hM(e){let t=pM.safeParse(e);return t.success?t.data:mM()}function gM(e){return oM.has(e)}function _M(e){let t=e.querySelector(`:scope > h6`);if(!(t instanceof HTMLHeadingElement))return null;let n=t.textContent?.trim()??``;return gM(n)?n:null}function vM(e){let t=[],n=null;for(let r of e.children){if(!(r instanceof HTMLLIElement))continue;let e=_M(r);e===null?n!==null&&n.members.push(r):(n={name:e,headerLi:r,members:[]},t.push(n));}return t}function yM(e,t){return `${e} (${String(t)})`}function bM(e,t,n){for(let t of e)t.classList.toggle(rM,n);t.setAttribute(`aria-expanded`,n?`false`:`true`);}function xM(e,t){e.setState({collapsed:[...t]});}function SM(e,t,n){let r=e.headerLi.querySelector(`:scope > h6`);if(!(r instanceof HTMLHeadingElement))return;let i=document.createElement(`button`);i.type=`button`,i.className=nM,i.textContent=yM(e.name,e.members.length);let a=t.has(e.name);bM(e.members,i,a),i.addEventListener(`click`,()=>{let r=!t.has(e.name);r?t.add(e.name):t.delete(e.name),bM(e.members,i,r),xM(n,[...t]);}),r.replaceChildren(i);}function CM(e){let t=document.querySelector(tM);if(!(t instanceof HTMLUListElement)){m$2.warn(aM);return}let n=e.getState(hM),r=new Set(n.collapsed),i=vM(t);for(let t of i)SM(t,r,e);}var wM={id:$j,label:eM,settingsCaption:`The tags in the sidebar fold by type, and an artist, character or copyright tag gets a Follow button.`,pages:[...cM],defaultEnabled:true,css:fM,resetStateOnToggle:true,mount:CM},TM=`tag-wiki`,EM=`Tag description on the ? in the sidebar`,DM=Kt$2(TM),OM=`ul#tag-sidebar`,kM=`?`,AM=`page=wiki`,jM=`table.highlightable a[href*="page=wiki"][href*="s=view"]`,MM=`div#content > div.flexi > div`,NM=`a[href*="${le$1}="]`,PM=`Now Viewing:`,FM=`Tag type:`,IM=`Other Wiki Information`,LM=`rdw-tag-wiki`,RM=`rdw-tag-wiki-title`,zM=`rdw-tag-wiki-type`,BM=`rdw-tag-wiki-text`,VM=`rdw-tag-wiki-foot`,HM=320,UM=8,WM=2147483e3,GM=`Reading the wiki…`,KM=`The wiki has no entry for this tag.`,qM=`The wiki entry has no description.`,JM=`Could not read the wiki. Try again later.`,YM=`Open in the wiki`,XM=`Tag description`,ZM=`
#${LM} {
  position: fixed;
  z-index: ${String(WM)};
  box-sizing: border-box;
  width: ${String(HM)}px;
  max-width: calc(100vw - 16px);
  padding: 10px 12px;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-l);
  background: var(--rdw-surface);
  box-shadow: var(--rdw-shadow-2);
  color: var(--rdw-text);
  font: 12px/1.45 var(--rdw-font);
}
#${LM} .${RM} {
  margin: 0;
  font: 700 13px var(--rdw-font);
  overflow-wrap: anywhere;
}
#${LM} .${zM} {
  margin: 2px 0 0;
  color: var(--rdw-muted);
}
#${LM} .${BM} {
  margin: 8px 0 0;
  max-height: 240px;
  overflow-y: auto;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
#${LM} .${VM} {
  margin: 8px 0 0;
  padding-top: 8px;
  border-top: 1px solid var(--rdw-border);
}
#${LM} .${VM} a {
  color: var(--rdw-accent);
}
`.trim();function QM(e){return e.trim().toLowerCase().replaceAll(` `,`_`)}function $M(e,t){let n=QM(t);for(let t of e.querySelectorAll(jM))if(QM(t.textContent??``)===n)return t.getAttribute(`href`);return null}function eN(e){return e instanceof HTMLBRElement?`
`:e.textContent??``}function tN(e){let t=e.querySelector(MM),n=t?.querySelector(`h2`)??null;if(t==null||n===null)return null;let r=(n.textContent??``).replace(PM,``).trim(),i=``,a=``,o=false;for(let e of t.childNodes){let t=(e.textContent??``).trim();if(e===n)o=true;else if(o){if(e instanceof HTMLElement&&t.startsWith(FM))i=t.slice(9).trim();else {if(e instanceof HTMLElement&&t===IM)break;a+=eN(e);}}}let s=a.split(`
`).map(e=>e.replace(/\s+/g,` `).trim()).join(`
`).replace(/\n{3,}/g,`

`).trim();return {title:r,type:i,text:s}}var nN=new Map;async function rN(e){let t=new URL(e,window.location.href);if(t.origin!==window.location.origin)throw Error(`cross-origin wiki address`);let n=await fetch(t.href,{method:`GET`,credentials:be$2});if(!n.ok)throw Error(`HTTP ${String(n.status)}`);return new DOMParser().parseFromString(await n.text(),`text/html`)}async function iN(e,t){let n=nN.get(e);if(n!==void 0&&n.kind!==`failed`)return n;let r;try{let n=$M(await rN(t),e);if(n===null)r={kind:`none`,href:t};else {let e=tN(await rN(n));r=e===null?{kind:`none`,href:n}:{kind:`entry`,entry:e,href:n};}}catch(n){m$2.warn(`tag-wiki: request failed`,e,n),r={kind:`failed`,href:t};}return nN.set(e,r),r}var aN=null;function oN(){document.getElementById(LM)?.remove(),document.removeEventListener(`keydown`,sN,true),document.removeEventListener(`pointerdown`,cN,true);let e=aN;aN=null,e?.focus();}function sN(e){e.key===`Escape`&&(e.preventDefault(),oN());}function cN(e){let t=document.getElementById(LM),n=e.target;t!==null&&n instanceof Node&&!t.contains(n)&&!(aN?.contains(n)??false)&&oN();}function lN(e,t){let n=document.createElement(`p`);return n.className=e,n.textContent=t,n}function uN(e,t,n){let r=[lN(RM,n?.kind===`entry`?n.entry.title:t)];if(n===null?r.push(lN(BM,GM)):n.kind===`entry`?(n.entry.type.length>0&&r.push(lN(zM,n.entry.type)),r.push(lN(BM,n.entry.text.length>0?n.entry.text:qM))):r.push(lN(BM,n.kind===`none`?KM:JM)),n!==null){let e=document.createElement(`p`);e.className=VM;let t=document.createElement(`a`);t.href=n.href,t.textContent=YM,e.append(t),r.push(e);}e.replaceChildren(...r);}function dN(e,t){let n=t.getBoundingClientRect(),r=Math.min(HM,window.innerWidth-16),i=n.right+UM;i+r>window.innerWidth-UM&&(i=Math.max(UM,n.left-r-UM));let a=e.offsetHeight,o=Math.max(UM,Math.min(n.top,window.innerHeight-a-UM));e.style.left=`${String(i)}px`,e.style.top=`${String(o)}px`;}function fN(e){let t=e.querySelectorAll(NM),n=t[t.length-1]?.getAttribute(`href`)??null;if(n===null)return null;try{let e=new URL(n,window.location.href).searchParams.get(le$1);return e===null||e.trim().length===0?null:e.trim()}catch{return null}}function pN(e,t){if(aN===e){oN();return}oN();let n=document.createElement(`div`);n.id=LM,n.setAttribute(`role`,`dialog`),n.setAttribute(`aria-label`,XM),uN(n,t,null),document.body.append(n),dN(n,e),aN=e,document.addEventListener(`keydown`,sN,true),document.addEventListener(`pointerdown`,cN,true),iN(t,e.href).then(r=>{aN===e&&n.isConnected&&(uN(n,t,r),dN(n,e));});}function mN(e){if(!document.body.classList.contains(DM)||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;let t=e.target,n=t instanceof Element?t.closest(`a`):null;if(!(n instanceof HTMLAnchorElement)||(n.textContent??``).trim()!==kM||!(n.getAttribute(`href`)??``).includes(AM))return;let r=n.closest(`li`),i=r===null?null:fN(r);i!==null&&(e.preventDefault(),e.stopPropagation(),pN(n,i));}var hN=null;function gN(e){let t=document.querySelector(OM);t!==null&&t!==hN&&(hN=t,t.addEventListener(`click`,e=>{e instanceof MouseEvent&&mN(e);}));}var _N={id:TM,label:EM,pages:[`list`,`post`],defaultEnabled:true,cssOnly:true,settingsCaption:`Shows the wiki text beside the tag instead of opening the wiki. Two requests on a click: the wiki search and the entry.`,css:ZM,mount:gN},vN=`thumb-tooltip`,yN=`Hide tag tooltip on thumbnails`,bN=[`list`,`favorites`,`other`],xN=Kt$2(vN),SN=`${xN}-inline`,CN=`inline`,wN=`:is(${an$2.thumb}, ${an$2.commentThumb}) > a:not([onclick])`,TN=`
body.${xN} ${an$2.thumb} > a > img,
body.${xN} ${an$2.commentThumb} > a > img {
  pointer-events: none;
}
body.${xN}.${SN} ${wN} {
  display: inline-block;
}
`.trim();function EN(e){let t=document.querySelector(wN);t!==null&&window.getComputedStyle(t).display===CN&&document.body.classList.add(SN);}var DN={id:vN,label:yN,pages:[...bN],defaultEnabled:true,css:TN,cssOnly:true,mount:EN},ON=`video-mark`,kN=`Play icon on video thumbnails`,AN=`Off: a frame around the thumbnail instead. In the site's own themes the site's frame stays.`,jN=Kt$2(ON),MN=`html.${c$1} body.${jN}`,NN={id:ON,label:kN,pages:[`list`,`favorites`,`other`],defaultEnabled:true,cssOnly:true,settingsCaption:AN,css:`
${MN} .${Jt$2} > a > img,
${MN} .webm-thumb {
  border: 0;
}
${MN} .${Jt$2}::after {
  content: "\\25B6\\FE0E";${Yt$2}
}
@supports (anchor-name: --a) {
  ${MN} .${Jt$2}::after {
    position-anchor: ${Ht$2};
    left: calc(anchor(left) + 6px);
    bottom: calc(anchor(bottom) + 6px);
  }
  html.${Vt$2}.${c$1} body.${jN} .${Jt$2}::after {
    position-anchor: ${Ut$2};
  }
}
`.trim(),mount:()=>void 0},PN=`rdw-tags-collapsed`,FN=`rdw-tags-toggle`,IN=`rdw-comments-page-style`,LN=3,RN=1,zN=`:scope > span`,BN=`aria-expanded`,VN=`
${an$2.commentTags}.${PN} {
  max-height: ${String(LN)}lh !important;
  overflow: hidden !important;
}
.${FN} {
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
.${FN}:hover {
  color: var(--rdw-text);
}
.${FN}:focus-visible {
  outline: 2px solid var(--rdw-accent);
  outline-offset: 2px;
}
`.trim();function HN(e=document){return e.querySelector(an$2.commentList)!==null}function UN(e){return `Show all ${String(e)} tags`}var WN=`Show fewer tags`;function GN(){if(document.getElementById(IN)!==null)return;let e=document.createElement(`style`);e.id=IN,e.textContent=VN,document.head.append(e);}function KN(e){if(e.classList.add(PN),e.scrollHeight<=e.clientHeight+RN)return e.classList.remove(PN),false;let t=UN(e.querySelectorAll(zN).length),n=document.createElement(`button`);return n.type=`button`,n.className=FN,n.textContent=t,n.setAttribute(BN,`false`),n.addEventListener(`click`,()=>{let r=e.classList.toggle(PN);n.textContent=r?t:WN,n.setAttribute(BN,r?`false`:`true`);}),e.after(n),true}function qN(e=document){let t=0;for(let n of e.querySelectorAll(an$2.commentTags))n instanceof HTMLElement&&KN(n)&&(t+=1);return t}function JN(){HN()&&(GN(),Pt$3(document,an$2.commentThumb),qt$2(an$2.commentThumb),qN());}var YN=`video-preview`,XN=`Video preview on hover`,ZN=`Each preview loads the video file itself.`,QN=[`list`,`favorites`,`other`],$N=`rdw-video-preview`,eP=`img.preview.webm-thumb`,tP=`${an$2.thumb}, ${an$2.commentThumb}`,nP=3,rP=`none`,iP=`body.${Kt$2(YN)}`,aP=`
${dt$3.trim()}
${iP} .${$N} {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: ${String(nP)};
  margin: 0;
  padding: 0;
  border: 0;
  object-fit: contain;
  pointer-events: none;
}
@supports (anchor-name: --a) {
  ${iP} .${$N} {
    position-anchor: ${Ht$2};
    top: anchor(top);
    left: anchor(left);
    width: anchor-size(width);
    height: anchor-size(height);
  }
}
`.trim(),oP=new Map;function sP(e){let t=oP.get(e);return t===void 0?false:Date.now()-t<3e4||(oP.delete(e),false)}var cP=new WeakMap,lP=0,uP=null,dP=null,fP=null,pP=false;function mP(){dP!==null&&(window.clearTimeout(dP),dP=null);}function hP(){let e=uP;e!==null&&(uP=null,e.video.removeEventListener(`error`,e.onError),e.video.pause(),e.video.src=``,e.video.load(),e.video.remove());}function gP(e,t){let n=e.querySelector(`#p${t}`);if(n instanceof HTMLAnchorElement)return n;let r=e.querySelector(an$2.thumbLink);if(r instanceof HTMLAnchorElement)return r;let i=e.querySelector(Ot$3)?.parentElement;return i instanceof HTMLAnchorElement?i:null}function _P(e){return ln$2(e)??un$2(e)??dn$2(e)}function vP(e){let t=e.querySelector(eP);if(t instanceof HTMLImageElement)return t;if(!e.classList.contains(`rdw-video-thumb`))return null;let n=e.querySelector(Ot$3);return n instanceof HTMLImageElement?n:null}function yP(e,t,n){let r=n.getBoundingClientRect();if(r.width<=0||r.height<=0)return;let i=t.getBoundingClientRect();e.style.top=`${String(r.top-i.top-t.clientTop)}px`,e.style.left=`${String(r.left-i.left-t.clientLeft)}px`,e.style.width=`${String(r.width)}px`,e.style.height=`${String(r.height)}px`;}function bP(e){let t=_P(e);if(t===null||sP(t))return;let n=vP(e);if(n===null)return;let r=Et$3(n.currentSrc||n.src);if(r===null)return;let i=gP(e,t);if(i===null)return;hP(),Tt$3(e);let o=document.createElement(`video`);o.className=$N,o.muted=true,o.defaultMuted=true,o.loop=true,o.playsInline=true,o.setAttribute(`playsinline`,``),o.preload=rP,o.setAttribute(`aria-hidden`,`true`);let s=()=>{oP.set(t,Date.now()),uP?.video===o?hP():(o.removeEventListener(`error`,s),o.pause(),o.src=``,o.load(),o.remove());};o.addEventListener(`error`,s),o.src=r,i.after(o),yP(o,e,n),uP={thumb:e,video:o,postId:t,onError:s};let c=o.play();c!==void 0&&c.catch(()=>{});}function xP(e){let t=e.currentTarget;if(!(t instanceof HTMLElement))return;let n=_P(t);n===null||sP(n)||vP(t)!==null&&(mP(),fP=t,dP=window.setTimeout(()=>{dP=null,fP===t&&bP(t);},200));}function SP(e){let t=e.currentTarget;t instanceof HTMLElement&&(fP===t&&(fP=null),mP(),uP?.thumb===t&&hP());}function CP(e){cP.get(e)!==lP&&vP(e)!==null&&(cP.set(e,lP),e.addEventListener(`pointerenter`,xP),e.addEventListener(`pointerleave`,SP));}function wP(e){let t=e.querySelectorAll(tP);for(let e of t)e instanceof HTMLElement&&CP(e);}function TP(){pP||(pP=true,wP(document),ot$4(e=>{wP(e);}));}function EP(e){(e.pageKind!==`other`||HN())&&Es$2(()=>{TP();});}var DP={id:YN,label:XN,pages:[...QN],defaultEnabled:false,settingsCaption:ZN,css:aP,mount:EP},OP=[E_,Ma$1,wM,Qj,yx,qf,Ew,Ca,tC,ck,ia$1,DN,wh,TE,DP,Na,rs,mS,Kv,oy,ox,va$2,ya$2,U_,_N,NN],Q={header:`header`,grid:`grid`,post:`post`,video:`video`,feed:`feed`,ai:`ai`,search:`search`,collections:`collections`,favorites:`favorites`,downloads:`downloads`,appearance:`appearance`,other:`other`},kP=[{id:Q.header,title:`Header`},{id:Q.grid,title:`Grid and thumbnails`},{id:Q.post,title:`Post page`},{id:Q.video,title:`Video`},{id:Q.feed,title:`Feed`},{id:Q.ai,title:`AI posts`},{id:Q.search,title:`Search and sidebar`},{id:Q.collections,title:`Collections`},{id:Q.other,title:`Other`}]; exports({O:OP,Q:Q,k:kP});function AP(){return new Map([[Ma$1.id,Q.header],[yx.id,Q.grid],[Ca.id,Q.grid],[tC.id,Q.grid],[DN.id,Q.grid],[ia$1.id,Q.grid],[ck.id,Q.post],[mS.id,Q.post],[oy.id,Q.post],[ox.id,Q.post],[Kv.id,Q.post],[Na.id,Q.post],[TE.id,Q.video],[DP.id,Q.video],[NN.id,Q.video],[E_.id,Q.feed],[U_.id,Q.feed],[Qj.id,Q.search],[wM.id,Q.search],[_N.id,Q.search],[va$2.id,Q.search],[qf.id,Q.collections],[Ew.id,Q.collections],[wh.id,Q.favorites],[rs.id,Q.downloads],[ya$2.id,Q.appearance]])}var jP=null;function MP(e){return jP??=AP(),jP.get(e)??Q.other}function NP(e){return OP.find(t=>t.id===e)}function PP(e){let t=NP(e);return t!==void 0&&Oc$1(e,t.defaultEnabled)}function FP(e){let t=NP(e);if(t?.choice===void 0)return ``;let n=jc$1(e);return n!==void 0&&t.choice.options.some(e=>e.value===n)?n:t.choice.defaultValue}function IP(){return La$1()??{pageKind:P$3(window.location.search),search:window.location.search}}function LP(e,t){let n=NP(e);if(n?.cssOnly!==true||!Ec$1())return;if(!t){document.body.classList.remove(Kt$2(n.id)),Va$1(n);return}za$2(n),document.body.classList.add(Kt$2(n.id)),n.choice!==void 0&&(Va$1(n),document.body.classList.add(qt$3(n.id,FP(n.id))));let{pageKind:r,search:i}=IP();Ha$1(n,r,i);}function RP(e,t){let n=NP(e);n?.cssOnly===true&&n.choice!==void 0&&Ec$1()&&Oc$1(e,n.defaultEnabled)&&(za$2(n),Va$1(n),document.body.classList.add(qt$3(n.id,t)));}function zP(e,t){return !Ia$1(e.id)&&e.pages.includes(t)&&Oc$1(e.id,e.defaultEnabled)}async function BP(e,t,n=OP){if(Ra$1(e,t),Ec$1())for(let r of n)zP(r,e)&&(Ua$1(r,e,t),await Wa$1());}var VP=`rdw-page-title`,HP=`rdw-section-label`,UP=`rdw-select__list`,WP=`rdw-ac__list`,GP=`rdw-dialog`,KP=`thin`,qP=`rdw-tabs`,JP=`rdw-tabs__tab`,YP=2,XP=12,ZP=`[${l$1}="${u$2}"]`,QP=`[${l$1}="${d$2}"]`,$P=`
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
.${UP},
.${WP},
.${GP} {
  scrollbar-width: ${KP};
  scrollbar-color: var(${h$3.border}) var(${h$3.surface});
}
/* Kit tabs in page shadow — tokens for all themes; Site muted→text. */
.${qP} {
  border-bottom: 1px solid var(${h$3.border});
  color: var(${h$3.text});
}
.${JP} {
  background: transparent;
  border: 0;
  border-bottom: ${String(YP)}px solid transparent;
  color: var(${h$3.muted});
}
.${JP}[aria-selected="true"] {
  color: var(${h$3.text});
  font-weight: 600;
  border-bottom-color: var(${h$3.accent});
}
:host-context(${ZP}) .${JP},
:host-context(${QP}) .${JP} {
  color: var(${h$3.text});
}
:host-context(${ZP}) .${JP}[aria-selected="true"],
:host-context(${QP}) .${JP}[aria-selected="true"] {
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
  font-size: ${String(XP)}px;
  line-height: 1.4;
  color: var(--rdw-muted);
}
/* Muted fails AA on the site's own themes (see the section label below). */
:host-context(${ZP}) .${dt$4.settingsCaption},
:host-context(${QP}) .${dt$4.settingsCaption} {
  color: var(--rdw-text);
}
/*
 * Card vs page: surface not darker than page; Site default card = --c-bg,
 * border = --c-bg-alt. Higher specificity than kit .rdw-card so it wins.
 */
:host-context(${ZP}) .rdw-card.${dt$4.pageCard} {
  background: ${kn$2};
  border-color: ${An$2};
}
:host-context(${QP}) .rdw-card.${dt$4.pageCard} {
  background: ${Fn$2};
  border-color: ${Ln$2};
}
.${VP} {
  color: var(--rdw-text);
}
.${HP} {
  color: var(--rdw-muted);
}
/* Muted fails AA on site greens / site-dark chrome — use text. */
:host-context(${ZP}) .${VP},
:host-context(${QP}) .${VP},
:host-context(${ZP}) .${HP},
:host-context(${QP}) .${HP} {
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
.${dt$4.settingsRow} .${UP} {
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
`.trim(),eF=`tiles`,tF=`list`,nF=`View`,rF=[{value:eF,label:`Tiles`},{value:tF,label:`List`}],iF=`following-view`,aF=`collections-view`,oF=`max(0px, calc((100% - 960px) / 2))`; exports({as:nF,ar:rF,aI:iF,aB:aF,av:oF});function sF(e){return e===`tiles`||e===`list`}function cF(e){let t=Nc$1(e);return sF(t)?t:eF}function lF(e,t){Pc$1(e,t);}var uF=32,dF=13,fF=`rdw-page-shell`,pF=`rdw-page-shell--bare`,mF=12,hF=24,gF=`rdw-page-title`,_F=`rdw-page-title--hidden`,vF=`rdw-layout-wide`,yF=`rdw-layout-full`,bF=`
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
  ${Je$2}: ${String(uF)}px;
  ${Ye$2}: ${String(dF)}px;
}
.${fF} {
  box-sizing: border-box;
  max-width: 960px;
  margin: 0 auto;
  padding: ${String(hF)}px 12px 32px;
  display: flex;
  flex-direction: column;
  gap: ${String(mF)}px;
}
.${vF} .${fF} {
  max-width: none;
  margin: 0;
  padding: ${String(hF)}px 20px 32px;
}
.${yF} .${fF} {
  max-width: none;
  margin: 0;
  padding: ${String(hF)}px 20px 32px;
}
/* The toolbar gets the same space above it as there is between it and the list. */
.${fF}.${pF} {
  padding-top: ${String(mF)}px;
}
.${vF} .${gF} {
  padding-inline: ${oF};
}
.${gF} {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--rdw-text);
}
.${gF}.${_F} {
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
${$P}
${_a$2}
`;function xF(e){return K$3(A$2,{children:[K$3(`style`,{children:bF}),K$3(`div`,{className:e.titleHidden?`${fF} ${pF}`:fF,children:[e.title===null?null:K$3(`h1`,{className:e.titleHidden?`${gF} ${_F}`:gF,children:e.title}),e.children]})]})}function SF(e){return kt$3(e)?null:e===`collections`?st$3.collections:e===`following`?st$3.following:e===`stats`?st$3.stats:st$3.settings}function CF(e){return e===`collections`||e===`following`||e===`settings`}var wF=null,TF=null,EF=null,DF=null;function OF(){return wF===null&&(wF=async()=>{let e=await module.import('./settings-page-gFnDmuGb-BidOssFk.js');return K$3(e.SettingsPage,{})}),wF}function kF(){return TF===null&&(TF=async()=>{let e=await module.import('./collections-page-DNArtZ5S-2InmhwnG.js');return K$3(e.CollectionsPage,{})}),TF}function AF(){return EF===null&&(EF=async()=>{let e=await module.import('./following-page-G2uXgvvc-CWbjsRG4.js');return K$3(e.FollowingPage,{})}),EF}function jF(){return DF===null&&(DF=async()=>{let e=await module.import('./stats-section-CE3Lk5Tt-BP3atnGY.js');return K$3(e.StatsPage,{})}),DF}function MF(e){return async()=>{let t=await module.import('./collection-detail-page-DPOpIfb7-qplz-zNu.js');return K$3(t.CollectionDetailPage,{collectionId:e},e)}}function NF(e){return kt$3(e)?MF(e.collectionId):e===`collections`?kF():e===`following`?AF():e===`stats`?jF():OF()}function PF(e){return e===`collections`||e===`following`}var FF=null;function IF(){RF!==null&&FF!==null&&(RF.classList.toggle(vF,PF(FF)),RF.classList.toggle(yF,FF===`stats`||FF===`settings`));}var LF=null,RF=null,zF=0;function BF(e){Yn$2(e,hi$1(zc$1()));}function VF(e){if(LF!==null&&RF!==null)return LF.parentElement!==e.parentElement&&e.after(LF),{host:LF,mount:RF};let t=document.getElementById(et$3);t!==null&&t.remove();let n=document.createElement(`div`);n.id=et$3;let r=n.attachShadow({mode:`open`}),i=document.createElement(`div`);return r.append(i),e.after(n),LF=n,RF=i,{host:n,mount:i}}async function HF(e,t){let{host:n,mount:r}=VF(t);BF(n);let i=++zF,a=await NF(e)();i===zF&&RF===r&&(FF=e,IF(),ve$1(K$3(Wt$1.Provider,{value:true,children:K$3(xF,{title:SF(e),titleHidden:CF(e),children:a})}),r));}function UF(){zF+=1,RF!==null&&ve$1(null,RF),LF!==null&&LF.remove(),LF=null,RF=null,FF=null;let e=document.getElementById(et$3);e!==null&&e.remove();}var WF=`hashchange`,GF=`popstate`,KF=`click`,qF=``,JF=false;function XF(){let e=M$3(nt$3);e.textContent=zt$2();}function ZF(){let e=document.querySelector(rt$3);return e instanceof HTMLElement?e:null}async function QF(e){let t=ZF();t!==null&&(document.documentElement.classList.add($e$3),await HF(e,t),br(At$3(e)));}function $F(){document.documentElement.classList.remove($e$3),UF(),xr();}async function eI(){if(ZF()===null){$F();return}let e=Rt$2(window.location.hash);e===null?$F():await QF(e);}function tI(){eI();}function nI(){eI();}function rI(e){return e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey}async function iI(e){let t=Ft$3(e),n=`${window.location.pathname}${window.location.search}${t}`;Rt$2(window.location.hash)===null?window.history.pushState(window.history.state,qF,n):window.history.replaceState(window.history.state,qF,n),await eI();}function aI(e){if(e.defaultPrevented||rI(e))return;let t=e.target;if(!(t instanceof Element))return;let n=t.closest(`a`);if(!(n instanceof HTMLAnchorElement)||n.target===`_blank`||n.hasAttribute(`download`))return;let r;try{r=new URL(n.href,window.location.href);}catch{return}if(r.origin!==window.location.origin||r.pathname!==window.location.pathname||r.search!==window.location.search)return;let i=Rt$2(r.hash);i!==null&&(e.preventDefault(),iI(i));}async function oI(){XF(),ZF()===null?$F():(mr(),JF||(JF=true,window.addEventListener(WF,tI),window.addEventListener(GF,nI),document.addEventListener(KF,aI)),await eI());}function sI(e){let t=e.querySelectorAll(`a[href]`);for(let e of t){if(!(e instanceof HTMLAnchorElement)||e.hasAttribute(`onclick`))continue;let t=e.getAttribute(`href`);if(t===null||t.length===0)continue;let n;try{n=new URL(t,re$1);}catch{continue}if(n.searchParams.get(`page`)!==`post`||n.searchParams.get(`s`)!==`list`)continue;let r=n.searchParams.get(le$1);if(r!==null)return R$3(r)}return null}function cI(e,t){let n=new Set,r=[];for(let t of e)n.has(t)||(n.add(t),r.push(t));for(let e of t)n.has(e)||(n.add(e),r.push(e));return r}function lI(){let e=Lo$2(),t=Uc$1();if(e===null||e.length===0)return t;let n=cI(e,t);return Io$1(n),n}function uI(e,t){let n=K$4(),r=new Map(n.artists.map(e=>[e.tag,e])),i=Date.now();n.artists=e.map(e=>{let n=r.get(e);return n===void 0?t!==void 0&&t.tag===e&&t.kind!==`artist`?{tag:e,addedAt:i,kind:t.kind}:{tag:e,addedAt:i}:n}),q$4(n),Io$1(e);}var dI=[[an$2.tagTypeArtist,na$1],[an$2.tagTypeCharacter,ra$1],[an$2.tagTypeCopyright,ia$2]];function fI(e){return lI().includes(e)}function pI(e,t){let n=lI();n.includes(e)?uI(n):uI([...n,e],{tag:e,kind:t});}function mI(e){uI(lI().filter(t=>t!==e));}function hI(e,t){e.setAttribute(`aria-pressed`,t?`true`:`false`),e.classList.toggle(Ie$3.artistFollowMarked,t);let n=t?Fe$3.artistFollowing:Fe$3.artistFollow,r=e.dataset.rdwArtistTag??``;e.setAttribute(`aria-label`,`${n}: ${r}`),e.textContent=n;}function gI(e,t,n){if(e.querySelector(an$2.artistFollowButton)!==null)return;let r=document.createElement(`button`);r.type=`button`,r.className=Ie$3.artistFollow,r.dataset.rdwArtistTag=t,hI(r,fI(t)),r.addEventListener(`click`,e=>{e.preventDefault(),e.stopPropagation();let i=r.getAttribute(`aria-pressed`)===`true`;try{i?(mI(t),hI(r,!1)):(pI(t,n),hI(r,!0));}catch{hI(r,fI(t));}}),e.append(r);}function _I(e=document,t=window.location.search){let n=P$3(t);if(n!==`list`&&n!==`post`)return;kh();let i=e.querySelector(an$2.tagSidebar);if(i!==null)for(let[e,t]of dI)for(let n of i.querySelectorAll(e)){if(!(n instanceof HTMLElement))continue;let e=sI(n);e!==null&&gI(n,e,t);}}var vI=`rdw-list-pages-style`,yI=`table.highlightable tr.odd, table.highlightable tr.even`,bI=`a[href*="${le$1}="]`,xI=`forum-seen`,SI=`div#forum`,CI=`span.forum-topic a[href], a[href*='page=forum'][href*='s=view']`,wI=`rdw-forum-badge`,TI=`rdw-forum-row-marked`,EI=`rdw-forum-read-all`,DI=`new`,OI=`updated`,kI=`Mark all as read`,AI=`All`,jI=`New for me`,MI=`rdw-forum-only-new`,NI=`rdw-forum-toolbar`,PI=`rdw-forum-pin`,FI=`rdw-forum-row-sticky`,II=`rdw-forum-no-value`,LI=`data-rdw-unit`,RI=`rdw-forum-filter`,zI=`div#search > form > input[name="search"]`,BI=`rdw-forum-search`,VI=`rdw-forum-search-clear`,HI=`Clear search`,UI=`Search the forum`,WI=`sticky`,GI=`Sticky`,KI=`Locked`,qI=`N/A`,JI=`reply`,YI=`replies`,XI=3,ZI=4,QI=`id`,$I=/\s+/g,eL=`tr[id^="artist-"]`,tL=`a[href*="page=artist"][href*="s=show"]`,nL=`tr`,rL=/^[a-z]+/,iL=`tags`,aL=`rdw-row-actions`,oL=`rdw-save-tag`,sL=`rdw-artist-name-cell`,cL=`Save as collection`,lL=`Saved`,uL=`RuleDesk`,dL=[[`tag-type-artist`,na$1],[`tag-type-character`,ra$1],[`tag-type-copyright`,ia$2]],fL=new Map([[`artist`,na$1],[`character`,ra$1],[`copyright`,ia$2]]),pL=`
.${wI} {
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
tr.${TI} span.forum-topic a {
  font-weight: 700;
}
.${EI},
.${RI},
.${oL} {
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
.${RI} {
  background: var(--rdw-seg-track, transparent);
  color: var(--rdw-seg-text, var(--rdw-muted));
}
.${RI}:first-of-type {
  border-radius: var(--rdw-radius-m) 0 0 var(--rdw-radius-m);
}
.${RI} + .${RI} {
  margin-left: -1px;
  border-radius: 0 var(--rdw-radius-m) var(--rdw-radius-m) 0;
}
.${RI}[aria-pressed="true"] {
  background: var(--rdw-seg-on, var(--rdw-surface));
  color: var(--rdw-seg-on-text, var(--rdw-text));
  font-weight: 600;
}
.${EI} {
  margin-left: auto;
}
/* Artists: Follow stands at the right edge of the name's cell, one under
   another. Put straight after the name, the buttons made a staircase. */
.${sL} > button {
  float: right;
  margin-left: 12px;
}
/* Tags: two buttons to a row is forty on a page, heavier than the table
   itself. They show for the row under the pointer or the keyboard; a state
   that is already set (Following, Saved) stays in view. */
tr:not(:hover):not(:focus-within) > td.${aL} > button:not(:disabled):not([aria-pressed="true"]) {
  opacity: 0;
}
.${oL}:disabled {
  color: var(--rdw-muted);
  cursor: default;
}
.${aL} {
  white-space: nowrap;
}
.${aL} > * + * {
  margin-left: 6px;
}
`.trim();function mL(){if(document.getElementById(vI)!==null)return;let e=document.createElement(`style`);e.id=vI,e.textContent=pL,document.head.append(e);}function hL(e){return (e.textContent??``).replace($I,` `).trim()}function gL(e){let t=e.querySelector(CI)?.getAttribute(`href`)??null;if(t===null||t.length===0)return null;try{return new URL(t,window.location.href).searchParams.get(QI)??t}catch{return t}}function _L(e){return typeof e==`object`&&!!e&&!Array.isArray(e)&&Object.values(e).every(e=>typeof e==`string`)}function vL(){let e=Nc$1(xI);return _L(e)?e:null}function yL(e,t){let n=new Map(Object.entries(e));for(let[e,r]of t)n.delete(e),n.set(e,r);let r=[...n].slice(Math.max(0,n.size-600));return Object.fromEntries(r)}function bL(e,t,n){let r=e[t];return r===void 0?DI:r===n?null:OI}function xL(e){e.classList.remove(TI),e.querySelector(`.${wI}`)?.remove();}function SL(e){let t=e.querySelector(`span.forum-topic`)?.firstChild??null;return t instanceof Text&&t.data.trim().toLowerCase().startsWith(WI)}function CL(e){return Number(e.trim())===1?JI:YI}function wL(e){let t=e.querySelector(`span.forum-topic`),n=t?.firstChild??null;if(t!==null&&n instanceof Text&&SL(e)){let t=document.createElement(`span`);t.className=PI,t.setAttribute(`role`,`img`),t.setAttribute(`aria-label`,GI),t.title=GI,n.replaceWith(t),e.classList.add(FI);}let r=e.querySelector(`span.locked-topic`);r!==null&&(r.textContent=KI);let i=e.querySelectorAll(`:scope > td`),a=i[XI];a!==void 0&&(a.textContent??``).trim()===qI&&a.classList.add(II);let o=i[ZI];o!==void 0&&o.setAttribute(LI,CL(o.textContent??``));}function TL(e,t){let n=document.createElement(`button`);return n.type=`button`,n.className=t,n.textContent=e,n}function EL(e){let t=e.querySelector(zI),n=t?.parentElement??null;if(!(t instanceof HTMLInputElement)||n===null||n.querySelector(`.rdw-forum-search-clear`)!==null)return;n.classList.add(BI),t.placeholder.length===0&&(t.placeholder=UI);let r=document.createElement(`button`);r.type=`button`,r.className=VI,r.setAttribute(`aria-label`,HI),r.title=HI;let i=()=>{r.hidden=t.value.length===0;};r.addEventListener(`click`,()=>{t.value=``,i(),t.focus();}),t.addEventListener(`input`,i),t.after(r),i();}function DL(e){let t=Zk();t&&EL(e);let n=e.querySelector(`table.highlightable`),r=[...e.querySelectorAll(yI)],i=[];for(let e of r){let t=gL(e);t!==null&&i.push({row:e,key:t,signature:hL(e)});}if(i.length===0||n===null)return;if(t)for(let e of r)wL(e);n.addEventListener(`click`,e=>{let t=e.target;if(!(t instanceof Element)||t.closest(`a, button`)!==null)return;let n=t.closest(`tr`)?.querySelector(CI);n instanceof HTMLAnchorElement&&n.click();});let a=document.createElement(`div`);a.className=NI,n.before(a);let o=vL();if(o===null){Pc$1(xI,yL({},i.map(e=>[e.key,e.signature])));return}let s=e=>{Pc$1(xI,yL(vL()??{},e));},c=0;for(let e of i){let t=bL(o,e.key,e.signature);if(t===null)continue;c+=1,e.row.classList.add(TI);let n=document.createElement(`span`);n.className=wI,n.textContent=t;let r=e.row.querySelector(CI);(r?.parentElement??e.row.lastElementChild)?.append(n),r?.addEventListener(`click`,()=>{s([[e.key,e.signature]]);});}if(c===0)return;let l=TL(AI,RI),u=TL(jI,RI),d=t=>{e.classList.toggle(MI,t),l.setAttribute(`aria-pressed`,t?`false`:`true`),u.setAttribute(`aria-pressed`,t?`true`:`false`);};l.addEventListener(`click`,()=>{d(false);}),u.addEventListener(`click`,()=>{d(true);}),d(false);let f=TL(kI,EI);f.addEventListener(`click`,()=>{s(i.map(e=>[e.key,e.signature]));for(let e of i)xL(e.row);d(false),a.replaceChildren();}),a.append(l,u,f);}function OL(e){for(let t of e.querySelectorAll(bI)){let e=t.getAttribute(`href`);if(e!==null)try{let t=new URL(e,window.location.href).searchParams.get(le$1),n=t===null?null:R$3(t);if(n!==null)return n}catch{}}return null}function kL(e){for(let[t,n]of dL)if(e.classList.contains(t)||e.querySelector(`.${t}`)!==null)return n;for(let t of e.querySelectorAll(`td`)){let e=rL.exec((t.textContent??``).trim().toLowerCase())?.[0]??``,n=fL.get(e);if(n!==void 0&&t.querySelector(bI)===null)return n}return null}function AL(e){let t=e.querySelector(tL)?.textContent??``;return t.trim().length===0?null:R$3(t.trim())}function jL(e){kh();for(let t of e){let e=AL(t),n=t.querySelector(tL)?.closest(`td`);e!==null&&n instanceof HTMLElement&&(n.classList.add(sL),gI(n,e,na$1));}}function ML(e){return G$3().collections.some(t=>t.kind===`search`&&(t.query??``).trim()===e||t.name.trim().toLowerCase()===e)}function NL(e){let t=document.createElement(`button`);t.type=`button`,t.className=oL;let n=ML(e);return t.textContent=n?lL:cL,t.disabled=n,t.title=`${cL}: ${e}`,t.addEventListener(`click`,()=>{ML(e)||hc$1(e,e),t.textContent=lL,t.disabled=true;}),t}function PL(e){kh();let t=[...e.querySelectorAll(nL)].filter(e=>e.querySelector(`th`)===null),n=0;for(let e of t){let t=OL(e);if(t===null||e.querySelector(`.rdw-row-actions`)!==null)continue;let r=document.createElement(`td`);r.className=aL;let i=kL(e);i!==null&&gI(r,t,i),r.append(NL(t)),e.append(r),n+=1;}let r=e.querySelector(`tr.tableheader`)??e.querySelector(`th`)?.closest(`tr`)??null;if(n>0&&r!==null&&r.querySelector(`.rdw-row-actions`)===null){let e=document.createElement(`th`);e.className=aL,e.textContent=uL,r.append(e);}}function FL(e){return new URLSearchParams(e).get(`page`)===iL}function IL(e=window.location.search){let t=document.querySelector(SI);if(t!==null){mL(),DL(t);return}let n=[...document.querySelectorAll(eL)];if(n.length>0){mL(),jL(n);return}let r=document.querySelector(`table.highlightable`);r!==null&&FL(e)&&(mL(),PL(r));}var LL=`body > div#notice`,RL=`rdw-notice-gone`,zL=2500;function BL(){let e=document.querySelector(LL);return e instanceof HTMLElement?e:null}function VL(e){let t,n=()=>{window.clearTimeout(t),e.classList.add(RL);},r=()=>{window.clearTimeout(t),e.classList.remove(RL),e.textContent.trim()!==``&&(t=window.setTimeout(n,zL));};e.addEventListener(`click`,n),new MutationObserver(r).observe(e,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:[`style`]}),r();}function HL(){if(!Zk())return;let e=BL();if(e!==null){VL(e);return}let t=new MutationObserver(()=>{let e=BL();e!==null&&(t.disconnect(),VL(e));});t.observe(document.body,{childList:true});}var UL=`upload-tag-sets`,WL=exports("W",2e3),GL=/\s+/;function KL(e){if(typeof e!=`object`||!e||!(`name`in e)||!(`tags`in e))return null;let{name:t,tags:n}=e;return typeof t!=`string`||typeof n!=`string`?null:{name:t.slice(0,40),tags:n.slice(0,WL)}}function qL(){let e=Nc$1(UL);if(!Array.isArray(e))return [];let t=[];for(let n of e){let e=KL(n);e!==null&&t.push(e);}return t}function JL(e){Pc$1(UL,e.map(e=>({name:e.name.slice(0,40),tags:e.tags.slice(0,WL)})));}function YL(){return qL().filter(e=>e.name.trim().length>0&&e.tags.trim().length>0)}function XL(e,t){let n=new Set(e.toLowerCase().split(GL).filter(e=>e.length>0)),r=[];for(let e of t.split(GL)){let t=e.toLowerCase();e.length>0&&!n.has(t)&&(n.add(t),r.push(e));}if(r.length===0)return e;let i=e.trimEnd();return `${i.length>0?`${i} `:``}${r.join(` `)} `}var ZL=`div#upload-form`,QL=`fileUpload`,$L=`tags`,eR=`rdw-upload-drag`,tR=`rdw-upload-has-file`,nR=`rdw-upload-file-name`,rR=`rdw-upload-preview`,iR=`rdw-upload-hint`,aR=`rdw-upload-remove`,oR=`rdw-upload-preview-box`,sR=`rdw-upload-tag-count`,cR=`rdw-upload-tag-count--short`,lR=`rdw-upload-guide-toggle`,uR=`rdw-upload-guide-folded`,dR=`upload-guide-folded`,fR=`rdw-upload-sets`,pR=`rdw-upload-set`,mR=`rdw-upload-sets-label`,hR=`rdw-upload-sets-edit`,gR=exports("g",`upload`),_R=`Tag sets:`,vR=`Edit sets`,yR=`Add tag sets`,bR=`Adds: `,xR=`rdw-upload-note`,SR=`Drop a file here or click to choose one`,CR=`Remove file`,wR=`Show the upload guidelines`,TR=`Hide the guidelines`,ER=1024,DR=[`B`,`KB`,`MB`,`GB`],OR=`image/`,kR=/\s+/;function AR(e){let t=Math.max(0,e),n=0;for(;t>=ER&&n<DR.length-1;)t/=ER,n+=1;return `${n===0||t>=100?String(Math.round(t)):t.toFixed(1)} ${DR[n]??`B`}`}function jR(e){return new Set(e.toLowerCase().split(kR).filter(e=>e.length>0)).size}function MR(e){let t=new Set,n=[];for(let r of e.split(kR)){let e=r.toLowerCase();r.length>0&&!t.has(e)&&(t.add(e),n.push(r));}let r=n.join(` `);return n.length>0&&/\s$/.test(e)?`${r} `:r}function NR(e){return e>=5?``:`${String(e)} of 5 tags`}function PR(e){let t=e.closest(`td`);if(t===null||t.querySelector(`.rdw-upload-hint`)!==null)return;let n=document.createElement(`span`);n.className=iR,n.textContent=SR;let r=document.createElement(`span`);r.className=nR,r.setAttribute(`role`,`status`);let i=document.createElement(`img`);i.className=rR,i.alt=``,i.hidden=true;let a=document.createElement(`button`);a.type=`button`,a.className=aR,a.setAttribute(`aria-label`,CR),a.title=CR,a.hidden=true,a.addEventListener(`click`,()=>{e.value=``,e.dispatchEvent(new Event(`change`,{bubbles:true}));});let o=document.createElement(`span`);o.className=oR,o.append(i,a),t.append(o,n,r);let s=null,c=()=>{let n=e.files?.[0];s!==null&&(URL.revokeObjectURL(s),s=null),t.classList.toggle(tR,n!==void 0),a.hidden=n===void 0,r.textContent=n===void 0?``:`${n.name} · ${AR(n.size)}`,n!==void 0&&n.type.startsWith(OR)?(s=URL.createObjectURL(n),i.src=s,i.hidden=false):(i.removeAttribute(`src`),i.hidden=true);};e.addEventListener(`change`,c);for(let n of [`dragenter`,`dragover`])e.addEventListener(n,()=>{t.classList.add(eR);});for(let n of [`dragleave`,`drop`])e.addEventListener(n,()=>{t.classList.remove(eR);});c();}function FR(e){let t=e.closest(`td`);if(t===null||t.querySelector(`.rdw-upload-tag-count`)!==null)return;let n=document.createElement(`div`);n.className=sR,n.setAttribute(`role`,`status`),(e.parentElement?.parentElement===t?e.parentElement:e).after(n);let r=false,i=()=>{let t=jR(e.value);n.textContent=NR(t),n.hidden=t>=5,n.classList.toggle(cR,r&&t<5);},a=()=>{r=true,i();};e.addEventListener(`blur`,a),t.closest(`form`)?.addEventListener(`submit`,a,true);let o=()=>{let t=MR(e.value);t!==e.value&&(e.value=t);};for(let t of [`change`,`blur`,`awesomplete-selectcomplete`])e.addEventListener(t,o);t.closest(`form`)?.addEventListener(`submit`,o,true);for(let t of [`input`,`change`,`keyup`,`blur`,`awesomplete-selectcomplete`])e.addEventListener(t,i);t.closest(`form`)?.addEventListener(`click`,()=>{window.setTimeout(i,0);}),i();}function IR(e){let t=e.closest(`td`);if(t===null||t.querySelector(`.rdw-upload-sets`)!==null)return;let n=document.createElement(`div`);n.className=fR;let r=YL();if(r.length>0){let e=document.createElement(`span`);e.className=mR,e.textContent=_R,n.append(e);}for(let t of r){let r=document.createElement(`button`);r.type=`button`,r.className=pR,r.textContent=t.name.trim(),r.title=`${bR}${t.tags.trim()}`,r.addEventListener(`click`,()=>{let n=XL(e.value,t.tags);if(n!==e.value){e.value=n;for(let t of [`input`,`change`])e.dispatchEvent(new Event(t,{bubbles:true}));}}),n.append(r);}let i=document.createElement(`button`);i.type=`button`,i.className=hR,i.textContent=r.length>0?vR:yR,i.addEventListener(`click`,()=>{_(gR);}),n.append(i);let a=t.querySelector(`.${sR}`),o=e.parentElement?.parentElement===t?e.parentElement:e;(a??o).after(n);}function LR(e){let t=e.querySelector(`td > div:has(> h3)`),n=t?.parentElement??null;if(t==null||n===null||n.querySelector(`.rdw-upload-guide-toggle`)!==null)return;let r=document.createElement(`button`);r.type=`button`,r.className=lR;let i=e=>{n.classList.toggle(uR,e),r.textContent=e?wR:TR,r.setAttribute(`aria-expanded`,e?`false`:`true`);};r.addEventListener(`click`,()=>{let e=!n.classList.contains(uR);Pc$1(dR,e),i(e);}),n.prepend(r),i(Nc$1(dR)===true);}function RR(e){let t=e.querySelector(`:scope > form`);if(t===null)return;let n=t.querySelector(`:scope > b`),r=t.querySelector(`tr:has(input[type="submit"]) > td`);if(n===null||r===null||t.querySelector(`.rdw-upload-note`)!==null)return;let i=document.createElement(`div`);i.className=xR;let a=n;for(;a!==null&&!(a instanceof HTMLScriptElement);){let e=a.nextSibling;a instanceof HTMLBRElement||i.append(a),a=e;}r.append(i);}function zR(){let e=document.querySelector(ZL),t=document.getElementById(QL),n=document.getElementById($L);e!==null&&t instanceof HTMLInputElement&&e.contains(t)&&(Zk()&&(PR(t),LR(e),RR(e)),n instanceof HTMLTextAreaElement&&e.contains(n)&&(FR(n),IR(n)));}var BR=`#paginator a[onclick]`,VR=`next`,HR=`lastpage`,UR=/[?&]pid=(\d+)/,WR=`none`;function GR(e){return e<=0?null:Math.floor((e-1)/50)*50}function KR(e){let t=UR.exec(e.getAttribute(`onclick`)??``);return t?.[1]===void 0?null:Number(t[1])}function qR(e,t,n){let r=0;for(let i of e.querySelectorAll(BR)){if(!(i instanceof HTMLElement))continue;let e=KR(i),a=i.getAttribute(`name`),o=n>=t;a===HR&&!o?e!==null&&e>t&&i.setAttribute(`onclick`,(i.getAttribute(`onclick`)??``).replace(UR,n=>n.replace(String(e),String(t)))):(e!==null&&e>t||(a===VR||a===HR)&&o)&&(i.style.display=WR,r+=1);}return r}function JR(){let e=Ts$1();return e?.finishedAt!==void 0&&e.running!==true}function YR(e=window.location.search){if(!JR())return;let t=GR(bs$1().size);if(t===null)return;let n=new URLSearchParams(e).get(`pid`),r=n!==null&&/^\d+$/.test(n)?Number(n):0;qR(document,t,r);}var XR=1e4,ZR=3e3,QR,$R=false;function ez(e){return new Promise(t=>{setTimeout(t,e);})}function tz(){return QR===void 0&&(QR=Tn()),QR}function nz(e,t){if(e?.running!==true)return  false;let n=e.lock;return n===void 0||t-n.beatAt>XR}function rz(e,t,n){if(e?.running!==true)return  false;let r=e.lock;return r===void 0||n-r.beatAt>1e4?false:r.tabId!==t}async function iz(){let e=tz(),t=Ts$1();if(rz(t,e,Date.now())||!nz(t,Date.now()))return  false;await ez(ZR);let n=Ts$1();if(rz(n,e,Date.now())||!nz(n,Date.now()))return  false;let r=Fn(n)??nn;return await Vn({tabId:e,signal:new AbortController().signal,onProgress:()=>{},mode:r}),true}function az(){$R||($R=true,iz().catch(e=>{m$2.error(`favorites sync resume failed`,e);}));}var oz=`ruledesk-web.background`,sz=1,cz=`background`,lz=`dataUrl`;function uz(){return GM_getValue}function dz(){return GM_setValue}function fz(e){return typeof TextEncoder<`u`?new TextEncoder().encode(e).length:e.length}function pz(){try{let e=uz()(r,void 0);return typeof e!=`string`||e.length===0?null:e}catch(e){return m$2.error(`background-store: GM read failed`,e),null}}function mz(){try{dz()(r,``);}catch(e){m$2.error(`background-store: GM clear failed`,e);}}function hz(){return new Promise((e,t)=>{let n=indexedDB.open(oz,sz);n.onerror=()=>{t(n.error??Error(`background-store: indexedDB open failed`));},n.onsuccess=()=>{e(n.result);},n.onupgradeneeded=()=>{let e=n.result;e.objectStoreNames.contains(cz)||e.createObjectStore(cz);};})}function gz(e){return new Promise((t,n)=>{let r=e.transaction(cz,`readonly`).objectStore(cz).get(lz);r.onerror=()=>{n(r.error??Error(`background-store: get failed`));},r.onsuccess=()=>{let e=r.result;typeof e==`string`&&e.length>0?t(e):t(null);};})}function _z(e,t){return new Promise((n,r)=>{let i=e.transaction(cz,`readwrite`),a=i.objectStore(cz).put(t,lz);a.onerror=()=>{r(a.error??Error(`background-store: put failed`));},i.oncomplete=()=>{n();},i.onerror=()=>{r(i.error??Error(`background-store: put transaction failed`));};})}function vz(e){return new Promise((t,n)=>{let r=e.transaction(cz,`readwrite`),i=r.objectStore(cz).delete(lz);i.onerror=()=>{n(i.error??Error(`background-store: delete failed`));},r.oncomplete=()=>{t();},r.onerror=()=>{n(r.error??Error(`background-store: delete transaction failed`));};})}async function yz(e){let t=await gz(e);if(t!==null)return mz(),t;let n=pz();return n===null?null:(await _z(e,n),mz(),n)}async function bz(){try{let e=await hz();try{return await yz(e)}finally{e.close();}}catch(e){return m$2.error(`background-store: load failed`,e),null}}function xz(e){return fz(e)>i}async function Sz(e){if(xz(e))throw Error(a);let t=await hz();try{await _z(t,e),mz();}finally{t.close();}}async function Cz(){try{let e=await hz();try{await vz(e);}finally{e.close();}}catch(e){m$2.error(`background-store: clear idb failed`,e);}mz();}var wz=`click`,Tz=`auxclick`,Ez=`hashchange`,Dz=`change`,Oz=`ruledesk-web.ai-reload`;function kz(e){let t=Rt$2(e);return t===null?null:t===`following`?P:t===`collections`||kt$3(t)?F:null}function Az(){return kz(window.location.hash)??et()}function jz(){let e=Az();e!==null&&X$1(e);}function Mz(){try{return window.sessionStorage.getItem(Oz)}catch{return null}}function Nz(e){try{e===null?window.sessionStorage.removeItem(Oz):window.sessionStorage.setItem(Oz,e);}catch{}}function Pz(e){let t=e.target;if(!(t instanceof Element))return;let n=t.closest(`a[href]`);if(!(n instanceof HTMLAnchorElement))return;let r;try{r=new URL(n.href,window.location.href);}catch{return}if(r.origin!==window.location.origin)return;let i=Y$1(r);i!==null&&X$1(i);}function Fz(e){let t=e.target;if(!e.isTrusted||!(t instanceof HTMLInputElement)||!t.matches(an$2.filterAiCheckbox))return;let n=et();n!==null&&K$1(n,t.checked);}var Iz=false;function Lz(){qe(),Iz||(Iz=true,document.addEventListener(wz,Pz,true),document.addEventListener(Tz,Pz,true),window.addEventListener(Ez,jz),document.addEventListener(Dz,Fz,true));let e=kz(window.location.hash);if(e!==null)return X$1(e),false;let t=et();if(t===null)return  false;let n=window.location.href;return !X$1(t)||Mz()===n?(Nz(null),false):(Nz(n),window.location.reload(),true)}async function Rz(){let e=zc$1(),t=await bz();Ti$1({appearance:e,siteSkinCss:dr$2(),...t!==null&&t.length>0?{backgroundDataUrl:t}:{}});}function $(e,t){try{t();}catch(t){m$2.error(`start: ${e} failed`,t);}}async function zz(e,t){try{await t();}catch(t){m$2.error(`start: ${e} failed`,t);}}async function Bz(){if(await zz(`appearance`,Rz),await Wa$1(),Lz())return;let t=P$3(window.location.search),n=window.location.search;$(`site notice`,HL),t===`list`?($(`gif marks`,()=>{qt$2(an$2.thumb);}),$(`video marks`,()=>{Ft$2(an$2.thumb);}),$(`cards`,Ph),await Wa$1(),$(`artist sidebar`,_I),await Wa$1()):t===`post`?($(`artist sidebar`,_I),await Wa$1()):t===`favorites`?($(`favorites page`,Tp),$(`favorite video marks`,It$2),$(`gif marks`,()=>{qt$2(an$2.thumb);}),$(`favorites pager`,YR),await Wa$1()):($(`comments page`,JN),$(`list pages`,IL),$(`upload page`,zR),await Wa$1()),await zz(`features`,()=>BP(t,n)),await Wa$1(),await zz(`own pages`,oI),await Wa$1(),$(`favorites sync resume`,az),$(`stats point`,Xn);}var appC96QXzu_=/*#__PURE__*/Object.freeze({__proto__:null,A:jp,C:OP,D:vg,E:MP,F:ra,I:ia,M:bs,N:vs,O:ag,P:is,S:PP,T:kP,_:cF,a:gR,b:LP,c:JL,d:iF,f:oF,g:sF,h:rF,i:Sz,j:fc,k:Nh,l:iI,m:tF,n:Cz,o:WL,p:nF,r:bz,s:qL,startApp:Bz,t:xz,u:aF,v:lF,w:Q,x:FP,y:RP});exports("aW",appC96QXzu_);})}}));
System.register("./settings-page-gFnDmuGb-BidOssFk.js", ['./app-C96QXzu_-Dg1SKPru.js','./___monkey.entry.js','./format-date-CpY7IdAY-BzMD4ndT.js'],(function(exports){'use strict';var z,V,B,Se,Ie,Q$1,K$1,Dn$1,ui$1,Ge,mr$1,A,kP,xe,gR,Cr$1,ct,Cn$1,q$1,g,Nh,PP,OP,MP,is,H,bz,G$1,Tr$1,ai$1,Dr$1,Kt,xn$1,LP,RP,FP,Un$1,qe,Nt,WL,Tn$1,pt,dt$1,O,bs,Re,ra$1,at,Mt,vs,nr$1,Zn$1,gr$1,Cz,Sz,Vn$1,Ze$1,Ke,D,Ee,Be,ze,JL,ia$1,Qn$1,Dt,Et,Re$1,xz,Fn$1,nn$1,J$1,en$1,Ge$1,qL,W$1,we$1,dt,Fe,vt,Rc,Lc,kc,_t,Ic,Fc,Ze,Qe,Ka$1,qa$1,fo$1,xt,Dc,Ya$1,bt,Tc,Xe,Ga$1,zc,Ti$1,dr$1,te,u,d,f,ee,la$1,ua$1,pi$1,Tt,ht,Ac,gt,Mc,fi$1,ca$1,wi$1,m,Ts,G$2,a,Ya$2,zs,ys,Bc,bs$1,n,L,ds,A$1,F,N,T,La$1,Ji$1,we,ut,Ha$1,q$2,_s,t,Ds,ia$2,Ec,wc,Oc,jc,bi$1,n$1;return{setters:[function(module){z=module.z;V=module.V;B=module.B;Se=module.S;Ie=module.I;Q$1=module.Q;K$1=module.K;Dn$1=module.D;ui$1=module.u;Ge=module.G;mr$1=module.m;A=module.A;kP=module.k;xe=module.x;gR=module.g;Cr$1=module.C;ct=module.c;Cn$1=module.a;q$1=module.q;g=module.b;Nh=module.N;PP=module.P;OP=module.O;MP=module.M;is=module.i;H=module.H;bz=module.d;G$1=module.e;Tr$1=module.T;ai$1=module.f;Dr$1=module.h;Kt=module.j;xn$1=module.l;LP=module.L;RP=module.R;FP=module.F;Un$1=module.U;qe=module.n;Nt=module.o;WL=module.W;Tn$1=module.p;pt=module.r;dt$1=module.s;O=module.t;bs=module.v;Re=module.w;ra$1=module.y;at=module.E;Mt=module.J;vs=module.X;nr$1=module.Y;Zn$1=module.Z;gr$1=module._;Cz=module.$;Sz=module.a0;Vn$1=module.a1;Ze$1=module.a2;Ke=module.a3;D=module.a4;Ee=module.a5;Be=module.a6;ze=module.a7;JL=module.a8;ia$1=module.a9;Qn$1=module.aa;Dt=module.ab;Et=module.ac;Re$1=module.ad;xz=module.ae;Fn$1=module.af;nn$1=module.ag;J$1=module.ah;en$1=module.ai;Ge$1=module.aj;qL=module.ak;W$1=module.al;we$1=module.am;},function(module){dt=module.bY;Fe=module.bi;vt=module.cy;Rc=module.cz;Lc=module.bb;kc=module.cA;_t=module.cB;Ic=module.cC;Fc=module.ab;Ze=module.cD;Qe=module.cE;Ka$1=module.cF;qa$1=module.cG;fo$1=module.cH;xt=module.cI;Dc=module.cJ;Ya$1=module.aR;bt=module.cK;Tc=module.cL;Xe=module.cM;Ga$1=module.cN;zc=module.aA;Ti$1=module.aB;dr$1=module.ci;te=module.cO;u=module.u;d=module.d;f=module.cP;ee=module.cQ;la$1=module.cR;ua$1=module.cS;pi$1=module.cT;Tt=module.cU;ht=module.cV;Ac=module.cW;gt=module.cX;Mc=module.cY;fi$1=module.cZ;ca$1=module.c_;wi$1=module.c$;m=module.m;Ts=module.n;G$2=module.c;a=module.cd;Ya$2=module.d0;zs=module.d1;ys=module.d2;Bc=module.d3;bs$1=module.e;n=module.d4;L=module.d5;ds=module.d6;A$1=module.a;F=module.d7;N=module.N;T=module.T;La$1=module.d8;Ji$1=module.d9;we=module.da;ut=module.W;Ha$1=module.db;q$2=module.bC;_s=module.dc;t=module.dd;Ds=module.de;ia$2=module.as;Ec=module._;wc=module.aC;Oc=module.f;jc=module.cb;bi$1=module.df;},function(module){n$1=module.n;}],execute:(function(){exports("SettingsPage",Zo);var Qt=ia$2.id,$t=[{value:u,label:`Site default`},{value:d,label:`Site dark`},{value:f,label:`Light`},{value:ee,label:`Dark`},{value:te,label:`Custom`}],en=[{value:`default`,label:`Default`},{value:`compact`,label:`Compact`},{value:`large`,label:`Large`}],tn=[{value:la$1,label:`Light`},{value:ua$1,label:`Dark`}],nn=`Appearance`,rn=`Site theme`,an=`Light, Dark and Custom are drawn by RuleDesk. Site default and Site dark keep the site's own look.`,on=`In the site's own themes RuleDesk does not restyle the site: its fields, tables and buttons stay as the site draws them, and what RuleDesk adds can look out of place beside them. Light, Dark or Custom is recommended.`,sn=`Base`,cn=`Background image`,ln=`From a link or a file`,un=`https://… or data URL`,dn=`Dim`,fn=`Choose…`,pn=`Remove`,mn=`Reset theme`,hn=`Reset theme?`,gn=`The Custom theme goes back to the Light base, and its background image is removed. This cannot be undone.`,_n=`Reset`,vn=`danger`,yn=`rdw-appearance__bg-thumb`,bn=56,xn=36,Sn=160,Cn=`Grid`,wn=`For this screen use at least `,Tn=`Image size: `,En=`This image is smaller than your screen; it may look soft when stretched.`,Dn=`image/*`,On=`
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
`;function kn(){let e=jc(Qt),t=ia$2.choice?.options??[];return e!==void 0&&t.some(t=>t.value===e)?e:ia$2.choice?.defaultValue??`default`}function U(e){return e.custom??fi$1()}function An(e,t){let n=Bc(e);Ti$1({appearance:n,siteSkinCss:dr$1(),...t!=null&&t.length>0?{backgroundDataUrl:t}:{}});}function jn(){let e=bi$1();return `${wn}${String(e.width)}x${String(e.height)}`}function Mn(e){let t=H(),n=V(null),[r,i]=z(()=>zc()),[a,o]=z(()=>kn()),[s,c]=z(()=>zc().custom?.backgroundImage??``),[l,u]=z(null),[d,ee]=z(``),[m,g]=z(null),[_]=z(()=>jn()),[v,y]=z(false);B(()=>{let e=false;return bz().then(t=>{if(e||t===null)return;u(t);let n=zc();n.theme===`custom`&&Ti$1({appearance:n,siteSkinCss:dr$1(),backgroundDataUrl:t});}),()=>{e=true;}},[]);let x=U(r),te$1=r.theme===te,ne=r.theme===`site`||r.theme===`site-dark`,re=(l?.length??0)>0||(x.backgroundImage?.length??0)>0||s.length>0,ie=l!==null&&l.length>0?l:x.backgroundImage??``;function S(e,t){i(e),An(e,t),ee(``);}function C(e){let t=ca$1.safeParse(e);if(!t.success)return;let n=t.data;n===`custom`?S({theme:n,custom:U(r)},l):S({theme:n});}function ae(e){if(e!==`light`&&e!==`dark`)return;let t=e,n=U(zc()),r={base:t,backgroundDim:pi$1(n.backgroundDim??0),...n.backgroundImage===void 0?{}:{backgroundImage:n.backgroundImage}};S({theme:te,custom:r},l);}function oe(e){let t=e.trim();c(t),g(null);let n=U(zc()),r={base:n.base,backgroundDim:pi$1(n.backgroundDim??0),...t.length>0?{backgroundImage:t}:{}};t.length>0&&(u(null),Cz()),S({theme:te,custom:r});}function w(e){let t=pi$1(e),n=U(zc()),r={base:n.base,backgroundDim:t,...n.backgroundImage===void 0?{}:{backgroundImage:n.backgroundImage}};S({theme:te,custom:r},l);}async function T(e){if(e!==void 0)try{let t=await wi$1(e);await Sz(t.dataUrl),u(t.dataUrl),c(``),g({width:t.sourceWidth,height:t.sourceHeight,belowScreen:t.belowScreen});let n=U(zc()),r={base:n.base,backgroundDim:pi$1(n.backgroundDim??0)};S({theme:te,custom:r},t.dataUrl);}catch(e){let t=e instanceof Error?e.message:`Could not read image file`;ee(t);}}function se(){Cz(),u(null),c(``),g(null);let e=U(zc());S({theme:te,custom:{base:e.base,backgroundDim:0}});}function ce(){Cz(),u(null),c(``),g(null);let e=fi$1();S({theme:te,custom:e});}function le(e){o(e),Mc(Qt,e),RP(Qt,e);}let k=[`rdw-appearance`,e.className].filter(e=>e!==void 0&&e.length>0).join(` `);return K$1(A,{children:[K$1(`style`,{children:On}),K$1(`section`,{className:k,"aria-label":nn,children:[e.includeHeading===false?null:K$1(Tr$1,{children:nn}),K$1(`div`,{className:`rdw-appearance__row`,children:[K$1(`div`,{className:`rdw-appearance__row-text`,children:[K$1(`span`,{children:rn}),K$1(`small`,{children:an})]}),K$1(ai$1,{className:`rdw-appearance__select`,options:$t,value:r.theme,onChange:C})]}),ne?K$1(`p`,{className:`rdw-appearance__note`,role:`note`,children:on}):null,te$1?K$1(A,{children:[K$1(`div`,{className:`rdw-appearance__row`,children:[K$1(`div`,{className:`rdw-appearance__row-text`,children:K$1(`span`,{children:sn})}),K$1(Dr$1,{className:`rdw-appearance__base`,options:tn,value:x.base,label:sn,onChange:ae})]}),K$1(`div`,{className:`rdw-appearance__row rdw-appearance__row--stack`,children:[K$1(`div`,{className:`rdw-appearance__row-text rdw-appearance__row-text--line`,children:[K$1(`span`,{children:cn}),K$1(`small`,{children:ln})]}),K$1(`div`,{className:`rdw-appearance__bg`,onFocusOut:e=>{let t=e.currentTarget,n=e.relatedTarget;n instanceof Node&&t.contains(n)||oe(s);},children:[K$1(`div`,{className:`rdw-appearance__bg-field`,children:[K$1(Kt,{value:s,placeholder:un,"aria-label":cn,onChange:e=>{c(e);}}),ie.length>0?K$1(`img`,{className:yn,src:ie,alt:``}):null]}),K$1(`div`,{className:`rdw-appearance__bg-actions`,children:[K$1(q$1,{variant:`secondary`,size:`s`,onClick:()=>{n.current?.click();},children:fn}),re?K$1(q$1,{variant:`ghost`,size:`s`,onClick:se,children:pn}):null,K$1(`input`,{ref:n,id:t,className:`rdw-appearance__file`,type:`file`,accept:Dn,"aria-hidden":`true`,tabIndex:-1,onChange:e=>{let t=e.currentTarget.files?.[0];T(t),e.currentTarget.value=``;}})]}),K$1(`p`,{className:`rdw-appearance__hint`,children:_}),m===null?null:K$1(`p`,{className:`rdw-appearance__hint`,children:[Tn,String(m.width),`x`,String(m.height)]}),m?.belowScreen===true?K$1(`div`,{className:`rdw-appearance__warn`,role:`status`,children:En}):null,re?K$1(`label`,{className:`rdw-appearance__dim`,children:[K$1(`span`,{children:dn}),K$1(`input`,{type:`range`,min:0,max:.8,step:.05,value:x.backgroundDim??0,"aria-label":dn,onInput:e=>{w(Number(e.currentTarget.value));}}),K$1(`span`,{children:String(pi$1(x.backgroundDim??0))})]}):null,d.length>0?K$1(`div`,{className:`rdw-appearance__warn`,role:`status`,children:d}):null]})]}),K$1(`div`,{className:`rdw-appearance__footer`,children:K$1(q$1,{variant:`secondary`,size:`s`,onClick:()=>{y(true);},children:mn})}),K$1(xn$1,{variant:`confirm`,open:v,title:hn,message:gn,confirmLabel:_n,cancelLabel:Fe.cancel,confirmTone:vn,onConfirm:()=>{y(false),ce();},onClose:()=>{y(false);}})]}):null,K$1(`div`,{className:`rdw-appearance__row`,children:[K$1(`div`,{className:`rdw-appearance__row-text`,children:K$1(`span`,{children:Cn})}),K$1(ai$1,{className:`rdw-appearance__select`,options:en,value:a,onChange:le})]})]})]})}var W=`rdw-blacklist`,Nn=`rdw-blacklist-chips`,Pn=`rdw-blacklist-add-row`,Fn=`rdw-blacklist-hint`,In=`Add a tag`,Ln=`Add`,Rn=`Stored in this browser's site cookie. The list in your account settings is not changed and may overwrite this one after you log in again.`,zn=`rdw-blacklist-add`,Bn=/[, ]+/,Vn=`
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
`.trim();function Hn(e){let t=[];for(let n of e.split(Bn)){let e=n.trim();e.length!==0&&t.push(e);}return t}function Un(e){return ia$1([...e]),ra$1()}function Wn(e={}){let t=e.includeHeading!==false,[r,o]=z(()=>ra$1()),[s,c]=z(``),[l,u]=z([]),d=V(O());bs(r),B(()=>{let e=d.current;return ()=>{e.cancel();}},[]);let f=Re(()=>{let e=Hn(s);e.length!==0&&(o(Un([...ra$1(),...e])),c(``),u([]),d.current.cancel());},[s]);return K$1(A,{children:[K$1(`style`,{children:Vn}),K$1(`section`,{className:`rdw-section ${W}`,children:[t?K$1(Tr$1,{children:`Blacklist`}):null,K$1(`form`,{className:Pn,onSubmit:e=>{e.preventDefault(),f();},children:[K$1(at,{id:zn,label:In,value:s,suggestions:l,onChange:e=>{c(e),d.current.query(e,u);},onSelect:()=>{d.current.cancel(),u([]);}}),K$1(q$1,{type:`submit`,variant:`primary`,children:Ln})]}),K$1(`ul`,{className:Nn,children:r.map(e=>K$1(`li`,{children:K$1(Mt,{label:e,variant:`dot`,kind:vs(e),onRemove:()=>{let t=ra$1().filter(t=>t!==e);o(Un(t));}})},e))}),K$1(`p`,{className:Fn,children:Rn})]})]})}var Gn=`ruledesk-web-backup`,Kn=`merge`,qn=`replace`,Jn=A$1({format:Ji$1(Gn),version:Ji$1(1),exportedAt:T(),storage:F,favs:N(La$1),background:N(T())}),Yn=`The background in this file is not a picture`;function Xn(){return GM_getValue}function Zn(){return GM_setValue}function Qn(e){let t=e.issues[0];if(t===void 0)return `${we}: (root): Invalid data`;let n=t.path.length===0?`(root)`:t.path.map(e=>String(e)).join(`.`);return `${we}: ${n}: ${t.message}`}async function $n(){let e=await bz();if(e!==null&&e.length!==0)return e}async function er(e){e===void 0||e.length===0?await Cz():await Sz(e);}function tr(){let e=Xn()(n,void 0);if(e==null)return L();let t=ds(e);return t===null?(m.error(`backup: invalid favs; exporting empty favs`,{key:n}),L()):t}function nr(e){Zn()(n,La$1.parse(e)),ys();}async function rr(){let e=await $n(),t$1={format:Gn,version:1,exportedAt:new Date().toISOString(),storage:G$2(),favs:tr(),...e===void 0?{}:{background:e}};Zn()(t,t$1);}function ir(e){return e===void 0?void 0:e.filter(ut)}function ar(e){return {...e,settings:cr(e.settings),collections:e.collections.map(e=>{let t={...e},n=ir(e.cover);if(n!==void 0&&(t.cover=n),e.thumbs!==void 0){let n={};for(let[t,r]of Object.entries(e.thumbs))ut(r)&&(n[t]=r);t.thumbs=n;}return t}),artists:e.artists.map(e=>{let t=ir(e.cover);return t===void 0?e:{...e,cover:t}})}}var or=/^data:image\/(?:jpeg|png|webp|gif|avif);base64,/i;function sr(e){return or.test(e)}function cr(e){let t=e?.appearance?.custom,n=t?.backgroundImage;if(e===void 0||e.appearance===void 0||t===void 0||n===void 0||ut(n)||sr(n))return e;let{backgroundImage:r,...i}=t;return {...e,appearance:{...e.appearance,custom:i}}}function lr(e){return {version:e.version,ids:e.ids}}function ur(e,t){let n=new Map;for(let t of e)n.set(t.tag,t);for(let e of t)n.set(e.tag,{...n.get(e.tag),...e});return Array.from(n.values())}function dr(e,t){let n=new Map;for(let t of e)n.set(t.id,t);for(let e of t)n.set(e.id,e);return Array.from(n.values())}function fr(e,t){let n={...e};for(let[e,r]of Object.entries(t))n[e]={...n[e]??{},...r};return n}function pr(e,t){let n=new Set([...e.ids,...t.ids]),r={version:t.version,ids:Array.from(n)};return e.sync!==void 0&&(r.sync=e.sync),r}function mr(e,t){return {artistCount:e.artists.length,collectionCount:e.collections.length,favCount:t.ids.length}}function hr(e){let t=Ds(e.marks);return {...e,marks:t.marks}}async function gr(e,t,n,r,i){await rr();let a=i?e:hr(e),o=Ha$1(a);return q$2(o.data),i&&t!==void 0&&nr(t),r&&await er(n),_s(),zs(),ys(),mr(G$2(),tr())}function _r(e=new Date){return `${String(e.getFullYear())}-${String(e.getMonth()+1).padStart(2,`0`)}-${String(e.getDate()).padStart(2,`0`)}`}function vr(e=new Date){return `ruledesk-web-backup-${_r(e)}.json`}async function yr(e){let t=G$2(),n={format:Gn,version:1,exportedAt:new Date().toISOString(),storage:t,...e.includeFavorites?{favs:tr()}:{}};if(e.includeBackground){let e=await $n();if(e!==void 0)return {...n,background:e}}return n}function br(e){return `${JSON.stringify(e,null,2)}\n`}function xr(e,t){let n=new Blob([e],{type:`application/json`}),r=URL.createObjectURL(n),i=document.createElement(`a`);i.href=r,i.download=t,i.rel=`noopener`,document.body.append(i),i.click(),i.remove(),URL.revokeObjectURL(r);}async function Sr(e){let t=await yr(e);return xr(br(t),vr()),Qn$1(),t}async function Cr(e,t){let n;try{n=JSON.parse(e);}catch(e){return {ok:false,error:e instanceof Error?e.message:`Invalid JSON`}}let r=Jn.safeParse(n);if(!r.success)return {ok:false,error:Qn(r.error)};let i={...r.data,storage:ar(r.data.storage)};if(i.background!==void 0&&i.background.length>0){if(!sr(i.background))return {ok:false,error:Yn};if(xz(i.background))return {ok:false,error:a}}let a$1=Object.prototype.hasOwnProperty.call(i,`background`),o=Object.prototype.hasOwnProperty.call(i,`favs`),s=i.favs===void 0?void 0:lr(i.favs);try{if(t===`replace`)return {ok:!0,summary:await gr(i.storage,o?s:void 0,a$1?i.background:void 0,!0,o)};let e=G$2(),n=tr(),r={version:e.version,collections:dr(e.collections,i.storage.collections),artists:ur(e.artists,i.storage.artists),marks:fr(e.marks,i.storage.marks),settings:i.storage.settings,updates:i.storage.updates??e.updates};return r.settings===void 0&&(r.settings=Ya$2().settings),{ok:!0,summary:await gr(r,o&&s!==void 0?pr(n,s):void 0,i.background,a$1,o)}}catch(e){return m.error(`backup import failed after parse`,e),zs(),ys(),{ok:false,error:e instanceof Error?e.message:`Import failed unexpectedly`}}}var wr=`Could not read file`;function Tr(e){return new Promise((t,n)=>{let r=new FileReader;r.onload=()=>{typeof r.result==`string`?t(r.result):n(Error(wr));},r.onerror=()=>{n(r.error??Error(wr));},r.readAsText(e);})}var G=`rdw-data-section`,Er=`rdw-data-actions`,Dr=`rdw-data-hint`,Or=`rdw-data-backup-plate`,kr=`rdw-data-backup-plate-text`,Ar=`rdw-data-backup-mark`,jr=`!`,Mr=`Time to export one.`,Nr=`rdw-data-import-choice`,Pr=`rdw-data-file`,Fr=`Data`,Ir=`Include background image`,Lr=`rdw-backup-include-bg`,Rr=`Include favorites`,zr=`rdw-backup-include-favs`,Br=`Favorites restore via Favorites sync. Include them in the file only if you need to copy the local fav list.`,Vr=`Import the file`,Hr=`Merge adds the collections, followed artists and marks of the file to the ones here and takes the settings from the file. Replace erases what is here first.`,Ur=`Merge into current data`,Wr=`Replace current data`,Gr=`Replace everything?`,Kr=`Collections, followed artists, marks and settings in this browser are erased and the file is put in their place. This cannot be undone. Export first if you are not sure.`,qr=`Replace`,Jr=Fe.export,Yr=Fe.import,Xr=`Export failed:`,Zr=`The file holds collections, followed artists (with covers and post counts) and settings. Blacklist and site theme are browser cookies and are not included.`,Qr=`
.${G} {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.${G} .${Er} {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.${G} .${Dr} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 12px;
}
/* No backup, or an old one, is a warning with its way out in it, not a grey line. */
.${G} .${Or} {
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
.${G} .${kr} {
  flex: 1 1 200px;
  margin: 0;
}
.${G} .${Ar} {
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
.${Nr} {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}
.${Nr} p {
  margin: 0;
}
.${G} .${Pr} {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
`.trim();function $r(e){return `Imported ${String(e.artistCount)} artists, ${String(e.collectionCount)} collections, ${String(e.favCount)} favorites.`}function ei(e={}){let t=e.includeHeading!==false,n=V(null),[r,i]=z(false),[a,o]=z(false),[s,c]=z(``),[l,u]=z(``),[d,f]=z(()=>nr$1()),[ee,p]=z(()=>Zn$1()===null),[m,h]=z(null),[g,_]=z(null),v=(e,t)=>{Cr(e,t).then(e=>{e.ok?u($r(e.summary)):c(`${Fe.importErrorPrefix} ${e.error}`);}).catch(e=>{let t=e instanceof Error?e.message:`Could not read file`;c(`${Fe.importErrorPrefix} ${t}`);});},y=K$1(q$1,{variant:`primary`,onClick:()=>{c(``),u(``),Sr({includeBackground:r,includeFavorites:a}).then(()=>{f(nr$1()),p(Zn$1()===null),gr$1();}).catch(e=>{let t=e instanceof Error?e.message:`Export failed unexpectedly`;c(`${Xr} ${t}`);});},children:Jr}),b=ee||d.due;return K$1(A,{children:[K$1(`style`,{children:Qr}),K$1(`section`,{className:`rdw-section ${G}`,children:[t?K$1(Tr$1,{children:Fr}):null,b?K$1(`div`,{className:Or,role:`status`,children:[K$1(`span`,{className:Ar,"aria-hidden":`true`,children:jr}),K$1(`p`,{className:kr,children:d.due?`${d.text} ${Mr}`:d.text}),y]}):K$1(`p`,{className:Dr,children:d.text}),K$1(`div`,{className:dt.settingsGroup,children:[K$1(`div`,{className:dt.settingsRow,children:K$1(ui$1,{id:Lr,label:Ir,checked:r,onChange:i})}),K$1(`div`,{className:dt.settingsRow,children:[K$1(ui$1,{id:zr,label:Rr,checked:a,onChange:o}),K$1(`p`,{className:dt.settingsCaption,children:Br})]})]}),K$1(`div`,{className:Er,children:[b?null:y,K$1(q$1,{variant:`secondary`,onClick:()=>{n.current?.click();},children:Yr}),K$1(`input`,{ref:n,className:Pr,type:`file`,accept:`application/json,.json`,"aria-hidden":`true`,tabIndex:-1,onChange:e=>{let t=e.currentTarget.files?.[0];e.currentTarget.value=``,t!==void 0&&(c(``),u(``),Tr(t).then(e=>{h(e);}).catch(e=>{let t=e instanceof Error?e.message:`Could not read file`;c(`${Fe.importErrorPrefix} ${t}`);}));}})]}),s.length>0?K$1(`p`,{className:`rdw-error`,children:s}):null,l.length>0?K$1(`p`,{className:`rdw-hint`,children:l}):null,K$1(`p`,{className:Dr,children:Zr}),K$1(xn$1,{open:m!==null,title:Vr,onClose:()=>{h(null);},children:K$1(`div`,{className:Nr,children:[K$1(`p`,{children:Hr}),K$1(q$1,{variant:`primary`,onClick:()=>{let e=m;h(null),e!==null&&v(e,Kn);},children:Ur}),K$1(q$1,{variant:`danger-quiet`,onClick:()=>{_(m),h(null);},children:Wr}),K$1(q$1,{variant:`secondary`,onClick:()=>{h(null);},children:Fe.cancel})]})}),K$1(xn$1,{variant:`confirm`,open:g!==null,title:Gr,message:Kr,confirmLabel:qr,cancelLabel:Fe.cancel,confirmTone:`danger`,onConfirm:()=>{let e=g;_(null),e!==null&&v(e,qn);},onClose:()=>{_(null);}})]})]})}var K=`rdw-downloads-settings`,ti=`rdw-downloads-settings-actions`,q=`rdw-downloads-settings-hint`,ni=`rdw-downloads-settings-tokens`,ri=`rdw-downloads-settings-token`,ii=`rdw-api-credentials`,ai=`rdw-download-name`,oi=`File name`,si=`Saved.`,ci=`Anything typed outside the brackets is kept as it is; the extension is added by itself. Keep id or md5 in the name, or files will share one.`,li=`Files are saved as: `,ui=`Files go to the browser's download folder, each download into a folder named after the collection or the search.`,di=`0f3a9c7b2d1e4f5a6b7c8d9e0f1a2b3c`,fi=`${di.slice(0,4)}…${di.slice(-4)}`,pi={postId:19374686,url:`https://wimg.rule34.xxx/images/1234/${di}.jpg`,rating:`explicit`,score:42,width:1080,height:1632,owner:`uploader`},mi=`API key`,hi=`rdw-downloads-settings-key`,gi=`&api_key=…&user_id=…`,_i=`Remove key`,vi=`https://rule34.xxx/index.php?page=account&s=options`,yi=`account options page`,bi=`The download manager finds files through the site API with your own key. Generate it on the `,xi=`, copy the whole line it shows and paste it here. The key stays in this browser and is not part of the Data export. Without a key there are no download buttons.`,Si=`Saved. Download buttons appear on collection pages and under the search panel.`,Ci=`Key removed.`,wi=`Paste the whole line from the site: it must hold both api_key and user_id.`,Ti=`A key is stored. Paste a new line to replace it.`,Ei=`
.${K} {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.${K} .${ti} {
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
.${hi} {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}
.${hi} .rdw-field {
  flex: 1 1 auto;
  min-width: 0;
}
.${ni} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 6px;
}
.${ri} {
  min-height: 24px;
  padding: 0 8px;
  border: 1px solid var(--rdw-border);
  border-radius: 12px;
  background: var(--rdw-surface-2);
  color: var(--rdw-text);
  font: 12px var(--rdw-font);
  cursor: pointer;
}
.${ri}:hover {
  border-color: var(--rdw-accent);
}
.${ri}[aria-pressed="true"] {
  background: var(--rdw-accent-soft);
  border-color: var(--rdw-accent);
}
`.trim(),Di=[{mask:D,name:`Site + ID`},{mask:`[id]`,name:`ID`},{mask:`[md5]`,name:`MD5 hash`},{mask:`[date] [id]`,name:`Date + ID`},{mask:`[id] [width]x[height]`,name:`ID + size`},{mask:`[rating] [id]`,name:`Rating + ID`},{mask:`[owner] [id]`,name:`Uploader + ID`}],Oi=Di.map(e=>e.mask),ki=`custom`,Ai=`Custom…`,ji=`In the name:`,Mi=` — `;function Ni(e){return Re$1(e,pi)}function Pi(e,t){return `${e}${Mi}${Ni(t).replace(di,fi)}`}function Fi(e){let[t,n]=z(()=>Et()),[r,i]=z(()=>!Oi.includes(Et())),[a,o]=z(false),s=e=>{Dt(e),n(Et()),o(true);},c=[{value:ki,label:Ai},...Di.map(e=>({value:e.mask,label:Pi(e.name,e.mask)}))];return K$1(`form`,{className:K,onSubmit:e=>{e.preventDefault(),s(t);},children:[K$1(ai$1,{label:oi,disabled:e.disabled,options:c,value:r?ki:t,onChange:e=>{e===ki?(i(true),o(false)):(i(false),s(e));}}),r?K$1(A,{children:[K$1(Kt,{id:ai,value:t,placeholder:D,"aria-label":oi,disabled:e.disabled,onChange:e=>{n(e),o(false);}}),K$1(`div`,{className:ni,children:[K$1(`span`,{className:q,children:ji}),Ee.map(r=>K$1(`button`,{type:`button`,className:`${ri} rdw-kit-focusable`,"aria-pressed":ze(t,r),disabled:e.disabled,onClick:()=>{n(Be(t,r)),o(false);},children:r},r))]}),K$1(`div`,{className:ti,children:K$1(q$1,{type:`submit`,variant:`primary`,size:`s`,disabled:e.disabled,children:Fe.save})}),K$1(`p`,{className:q,children:ci})]}):null,r||a?K$1(`p`,{className:q,role:`status`,children:[r?`${li}${Ni(t)}`:``,a?si:``].filter(e=>e.length>0).join(` `)}):null,K$1(`p`,{className:q,children:ui})]})}function Ii(e){let t=e.disabled===true,[n,r]=z(()=>Ge$1()),[i,a]=z(``),[o,s]=z(``),c=()=>{let e=Ze$1(i);e===null||!Ke(e.userId,e.apiKey)?s(wi):(a(``),r(true),s(Si));};return K$1(`section`,{className:`rdw-section ${K}`,children:[K$1(`style`,{children:Ei}),K$1(`form`,{className:K,onSubmit:e=>{e.preventDefault(),c();},children:[K$1(`div`,{className:hi,children:[K$1(Kt,{id:ii,label:mi,type:`password`,value:i,placeholder:n?Ti:gi,disabled:t,onChange:e=>{a(e),s(``);}}),K$1(q$1,{type:`submit`,variant:`primary`,disabled:t||i.trim().length===0,children:Fe.save}),n?K$1(q$1,{type:`button`,variant:`secondary`,disabled:t,onClick:()=>{qe(),a(``),r(false),s(Ci);},children:_i}):null]}),K$1(`p`,{className:q,children:[bi,K$1(`a`,{href:vi,target:`_blank`,rel:`noopener`,children:yi}),xi]})]}),o.length>0?K$1(`p`,{className:q,role:`status`,children:o}):null,K$1(Fi,{disabled:t})]})}var Li=`rdw-upload-sets-settings`,Ri=`rdw-upload-sets-settings-row`,zi=`rdw-upload-sets-settings-name`,Bi=`rdw-upload-sets-settings-tags`,Vi=`rdw-upload-sets-settings-hint`,Hi=`rdw-upload-sets-settings-actions`,Ui=`Name`,Wi=`Tags`,Gi=`My usual tags`,Ki=`tag_one tag_two`,qi=`Add a set`,Ji=`Remove the set `,Yi=`Remove this set`,Xi=`No sets yet.`,Zi=`A set is a button on the Upload page: it adds its tags to the Tags field, and a tag that is there already is not added twice. Tags are separated by spaces.`,Qi=200,$i=14,ea=`
.${Li} {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.${Ri} {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}
.${Ri} .${zi} {
  flex: none;
  width: ${String(Qi)}px;
}
.${Ri} .${Bi} {
  flex: 1 1 auto;
  min-width: 0;
}
.${Li} .${Vi} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 12px;
}
.${Hi} {
  display: flex;
}
`.trim();function ta(){let[e,t]=z(()=>qL()),n=e=>{JL(e),t(e);},r=(t,r)=>{n(e.map((e,n)=>n===t?{...e,...r}:e));};return K$1(`section`,{className:`rdw-section ${Li}`,children:[K$1(`style`,{children:ea}),e.length===0?K$1(`p`,{className:Vi,children:Xi}):null,e.map((t,i)=>K$1(`div`,{className:Ri,children:[K$1(Kt,{className:zi,...i===0?{label:Ui}:{"aria-label":Ui},value:t.name,placeholder:Gi,inputAttrs:{maxLength:40},onChange:e=>{r(i,{name:e});}}),K$1(Nt,{className:Bi,...i===0?{label:Wi}:{"aria-label":Wi},value:t.tags,placeholder:Ki,onChange:e=>{r(i,{tags:e.slice(0,WL)});}}),K$1(Tn$1,{label:t.name.trim().length>0?`${Ji}${t.name.trim()}`:Yi,onClick:()=>{n(e.filter((e,t)=>t!==i));},children:K$1(pt,{size:$i})})]},i)),K$1(`div`,{className:Hi,children:K$1(q$1,{variant:`secondary`,onClick:()=>{n([...e,{name:``,tags:``}]);},children:[K$1(dt$1,{size:$i}),qi]})}),K$1(`p`,{className:Vi,children:Zi})]})}var J=`rdw-favs-sync`,na=`rdw-favs-sync-status`,ra=`rdw-favs-sync-actions`,ia=`rdw-favs-sync-note`,aa=`Favorites sync`,oa=`Sync favorites`,sa=`Full resync`,ca=`Resume`,la=`Stop`,ua=`Starting sync…`,da=`Favorites sync progress`,fa=` · `,Y=`en-US`,pa=1e3,ma=60,ha=e=>`${e.toLocaleString(Y)} ${e===1?`favorite`:`favorites`}`,ga=e=>`last sync ${e}`,_a=e=>`last full sync ${e}`,va=(e,t)=>t===null?`page ${e.toLocaleString(Y)}`:`page ${e.toLocaleString(Y)} of ${t.toLocaleString(Y)}`,ya=(e,t)=>`paused at ${va(e,t)}`,ba=e=>`Page ${e.page.toLocaleString(Y)} of ${e.pages.toLocaleString(Y)}`,xa=`Sync adds new favorites and stops at the first page where every favorite is already known.`,Sa=`Full resync re-reads every page to refresh tags.`,Ca=(e,t)=>`Full resync re-reads all ${e.toLocaleString(Y)} pages (${t}) to refresh tags.`,wa=`Posts you removed on the site stay here.`,Ta=`under a minute`,Ea=e=>`about ${String(e)} min`,Da=`
.${J} {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.${J} .${na} {
  margin: 0;
  color: var(--rdw-text);
  font-size: 12px;
}
.${J} .${ra} {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.${J} .${ia} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 12px;
}
`.trim(),X=null;function Oa(e){let t=Date.parse(e);return Number.isFinite(t)?n$1(t):e}function ka(e){return Math.floor(e/50)+1}function Aa(e){return e===void 0||e.lastPid===0&&e.finishedAt===void 0?null:ka(e.lastPid)}function ja(e){let t=(e-1)*en$1/pa;return t<ma?Ta:Ea(Math.ceil(t/ma))}function Ma(){let e=Aa(Ts());return [xa,e===null||e<=1?Sa:Ca(e,ja(e)),wa].join(` `)}function Na(e){return e!==void 0&&e.finishedAt===void 0}function Pa(e){return e.pages<=0?null:e.page/e.pages}function Fa(){let e=Ts(),t=[ha(bs$1().size)];if(e!==void 0&&e.finishedAt===void 0){let n=ka(e.nextPid),r=Aa(e);t.push(ya(n,r===null?null:Math.max(r,n)));}else if(e?.finishedAt!==void 0){let n=Oa(e.finishedAt);t.push(Fn$1(e)===nn$1?_a(n):ga(n));}return t.join(fa)}function Ia(){return {status:Fa(),progress:null,waiting:false,error:``,unfinished:Na(Ts()),busy:X!==null}}function La(e){let t=Pa(e);return {status:ba(e),progress:t,waiting:t===null,error:``,unfinished:true,busy:true}}function Ra(e){return X=null,e.status===`error`?{...Ia(),error:e.message}:Ia()}async function za(e,t){if(X!==null)return;let n=new AbortController,r=new Set;X={controller:n,listeners:r},r.add(t=>{e(La(t));}),e({status:ua,progress:null,waiting:true,error:``,unfinished:true,busy:true});try{let i=await Vn$1({onProgress:e=>{for(let t of r)t(e);},signal:n.signal,...t===void 0?{}:{mode:t}});X?.controller===n&&e(Ra(i));}catch(t){m.error(`favorites sync section: unexpected failure`,t),X?.controller===n&&(X=null,e({...Ia(),error:t instanceof Error?t.message:`unexpected error`}));}}function Ba(e={}){let t=e.includeHeading!==false,[n,r]=z(()=>Ia());return B(()=>{if(X===null)return;let e=e=>{r(La(e));};return X.listeners.add(e),r({status:ua,progress:null,waiting:true,error:``,unfinished:true,busy:true}),()=>{X?.listeners.delete(e);}},[]),K$1(A,{children:[K$1(`style`,{children:Da}),K$1(`section`,{className:`rdw-section ${J}`,children:[t?K$1(Tr$1,{children:aa}):null,K$1(`p`,{className:na,children:n.status}),n.busy?K$1(Un$1,{value:n.progress,waiting:n.waiting,label:da}):null,K$1(`div`,{className:ra,children:n.busy?K$1(q$1,{variant:`secondary`,onClick:()=>{X?.controller.abort();},children:la}):n.unfinished?K$1(q$1,{variant:`primary`,onClick:()=>{za(r);},children:ca}):K$1(A,{children:[K$1(q$1,{variant:`primary`,onClick:()=>{za(r,J$1);},children:oa}),K$1(q$1,{variant:`secondary`,onClick:()=>{za(r,nn$1);},children:sa})]})}),n.error.length>0?K$1(`p`,{className:`rdw-error`,children:n.error}):null,K$1(`p`,{className:ia,children:Ma()})]})]})}var Va=`rdw-ai-everywhere`,Ha=`Hide AI posts everywhere`,Ua=`When off, Posts, Feed, Following, Collections and Favorites each keep their own Show / Hide choice.`,Wa=`Off: the site looks as without RuleDesk. The page features below need this on; Favorites sync, Blacklist and Data work without it.`,Ga=`rdw-tag-kind-lookup`,Ka=`Look up the kind of unknown tags`,qa=`Colours the dot of a tag the script has not met on the site yet. Asks the site's tag suggestions once for each such tag, one request at a time.`,Ja=`Posts of a custom collection opened as one search. A longer collection is opened in parts.`,Ya=`Local index`,Xa=`rdw-settings-block`,Za=`rdw-settings-block-title`,Qa=`rdw-settings-nav-search`,$a=`Artists per search`,eo=`0 means the default, 400.`,to=new Set([`grid-density`]),no=`.rdw-appearance__row:nth-child(even) {
  background: transparent;
}`,ro=`rdw-settings-section`,io=`rdw-settings-section-title`,Z=`data-settings-section`,ao=`rdw-settings-section-`,oo=`data-settings-rows`,so=`data-settings-hidden`,co=`rdw-settings-rows`,lo=`rdw-settings-master`,uo=`rdw-settings-row--master`,fo=`rdw-settings-layout`,po=`rdw-settings-nav`,mo=`rdw-settings-nav-title`,ho=`rdw-settings-nav-sub`,go=`rdw-settings-nav-list`,_o=`rdw-settings-nav-link`,vo=`rdw-settings-nav-rule`,Q=`rdw-settings-content`,yo=200,bo=720,xo=40,So=900,Co=16,wo=160,To=2,Eo=`RuleDesk`,Do=`Settings`,Oo=`Sections of the settings`,ko=`Search settings`,Ao=`Clear`,jo=`rdw-settings-match`,Mo=`scroll`,No=`hashchange`,Po=`STYLE`,Fo=`appearance`,Io=`blacklist`,Lo=xe,Ro=`downloads`,zo=gR,Bo=`data`,Vo=[{id:Fo,title:`Appearance`,service:false},...kP.map(e=>({id:e.id,title:e.title,service:false})),{id:Lo,title:`Favorites`,service:true},{id:Ro,title:`Downloads`,service:true},{id:zo,title:`Upload`,service:true},{id:Io,title:`Blacklist`,service:true},{id:Bo,title:`Data`,service:true}];function Ho(e){return `No settings match \u201c${e.trim()}\u201d.`}function Uo(){let e=typeof GM_info>`u`?``:GM_info.script.version;return e.length>0?`${Do} \u00b7 ${e}`:Do}var Wo=`
/* The list of sections on the left, held in place, and a column of settings
   beside it: a name and its switch are near each other, not a screen apart. */
.${fo} {
  display: grid;
  grid-template-columns: ${String(yo)}px minmax(0, ${String(bo)}px);
  column-gap: ${String(xo)}px;
  justify-content: center;
  align-items: start;
}
.${po} {
  position: sticky;
  top: calc(${Ya$1} + ${String(Co)}px);
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}
.${mo} {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--rdw-text);
}
.${ho} {
  margin: -10px 0 0;
  font-size: 12px;
  color: var(--rdw-muted);
}
.${go} {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.${_o} {
  display: block;
  padding: 6px 10px;
  border-radius: var(--rdw-radius-m);
  color: var(--rdw-text);
  font-size: 13px;
  text-decoration: none;
}
.${_o}:hover {
  background: var(--rdw-surface);
}
.${_o}[aria-current="true"] {
  background: var(--rdw-surface-2);
  font-weight: 600;
}
.${vo} {
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
.${ro} {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 28px;
  scroll-margin-top: calc(${Ya$1} + ${String(Co)}px);
}
.${io} {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--rdw-text);
}
.rdw-card.${co} {
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
.${Xa} {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 14px;
  border-top: 1px solid var(--rdw-border);
}
.${Za} {
  margin: 0;
  font: 600 12.5px var(--rdw-font);
  color: var(--rdw-text);
}
.${Qa} {
  width: 100%;
}
/* The switch the others depend on stands first and apart, on a ground of its own. */
.rdw-card.${lo} {
  background: var(--rdw-surface-2);
}
.${uo} .rdw-switch__label {
  font-weight: 600;
}
[${so}] {
  display: none !important;
}
::highlight(${jo}) {
  background-color: var(--rdw-accent-soft);
  color: var(--rdw-text);
}
@media (max-width: ${String(So)}px) {
  .${fo} {
    grid-template-columns: minmax(0, 1fr);
    row-gap: 16px;
  }
  .${po} {
    position: static;
  }
}
`.trim();function Go(e){let t=document.createTreeWalker(e,NodeFilter.SHOW_TEXT),n=[];for(let e=t.nextNode();e!==null;e=t.nextNode())e instanceof Text&&e.parentElement?.tagName!==Po&&n.push(e);return n}function Ko(e){return Go(e).map(e=>e.data).join(` `).toLowerCase()}function $(e,t){t?e.setAttribute(so,``):e.removeAttribute(so);}function qo(e,t){let n=t.trim().toLowerCase(),r=0;for(let t of e.querySelectorAll(`[${Z}]`)){let e=[...t.querySelectorAll(`.${dt.settingsRow}`)],i=t.hasAttribute(oo);if(n.length===0){$(t,false);for(let t of e)$(t,false);r+=1;continue}let a=t.querySelector(`.${io}`),o=a!==null&&Ko(a).includes(n);if(!i||o){for(let t of e)$(t,false);let i=o||Ko(t).includes(n);$(t,!i),r+=+!!i;continue}let s=false,c=false;for(let t of e){let e=t.classList.contains(dt.settingsRowSub),r=Ko(t).includes(n)||e&&c;e?r&&t.previousElementSibling!==null&&$(t.previousElementSibling,false):c=r,$(t,!r),s||=r;}$(t,!s),r+=+!!s;}return r}function Jo(e,t){if(typeof Highlight>`u`||typeof CSS>`u`||!(`highlights`in CSS))return;CSS.highlights.delete(jo);let n=t.trim().toLowerCase();if(n.length===0)return;let r=[];for(let t of Go(e)){let e=t.data.toLowerCase();for(let i=e.indexOf(n);i!==-1;i=e.indexOf(n,i+n.length)){let e=new Range;e.setStart(t,i),e.setEnd(t,i+n.length),r.push(e);}}r.length>0&&CSS.highlights.set(jo,new Highlight(...r));}function Yo(e){return K$1(`section`,{id:`${ao}${e.id}`,className:ro,"aria-labelledby":`${ao}${e.id}-title`,[Z]:e.id,...e.rows===true?{[oo]:``}:{},children:[K$1(`h2`,{id:`${ao}${e.id}-title`,className:io,children:e.title}),e.children]})}function Xo(e){let[,t]=z(0),n=()=>{t(e=>e+1);};return K$1(A,{children:e.features.map(t=>{let r=Tt(t.id,t.label),i=t.choice;return K$1(A,{children:[K$1(`div`,{className:dt.settingsRow,children:[K$1(ui$1,{id:`${ht}${t.id}`,label:r,checked:PP(t.id),disabled:e.disabled,onChange:e=>{kc(t.id,e),t.resetStateOnToggle===true&&Ac(t.id),t.cssOnly===true?(LP(t.id,e),n()):window.location.reload();}}),t.settingsCaption!==void 0&&i===void 0?K$1(`p`,{className:dt.settingsCaption,children:t.settingsCaption}):null]}),i===void 0?null:K$1(`div`,{className:`${dt.settingsRow} ${dt.settingsRowSub}`,id:`${gt}${t.id}`,children:[K$1(ai$1,{label:i.label??r,disabled:e.disabled||!PP(t.id),options:i.options.map(e=>({value:e.value,label:e.label})),value:FP(t.id),onChange:e=>{Mc(t.id,e),t.cssOnly===true?(RP(t.id,e),n()):window.location.reload();}}),t.settingsCaption===void 0?null:K$1(`p`,{className:dt.settingsCaption,children:t.settingsCaption})]})]},t.id)})})}function Zo(){let[n,r]=z(()=>Ec()),[i,a]=z(()=>Fc()),[l,u]=z(()=>Lc()),[d,f]=z(()=>wc()),[p,m]=z(()=>Oc(Xe,true)),[h,g$1]=z(()=>W$1()),[_,y]=z(()=>Oc(is,true)),[b,re]=z(()=>Oc(Ga$1,true)),S=V(null),C=V(null),[w,se]=z(``),[ce,ue]=z(false),[de,fe]=z(Fo),[pe]=z(()=>we$1());B(()=>{let e=e=>{if(e===null)return;let t=S.current?.querySelector(`[${Z}="${CSS.escape(e)}"]`);t instanceof HTMLElement&&typeof t.scrollIntoView==`function`&&(t.scrollIntoView({block:`start`}),fe(e));};e(Se(window.location.hash)??pe);let t=()=>{e(Se(window.location.hash));};return window.addEventListener(No,t),()=>{window.removeEventListener(No,t);}},[pe]),B(()=>{let e=()=>{let e=[...C.current?.querySelectorAll(`[${Z}]:not([${so}])`)??[]],t=e[0];for(let n of e)n.getBoundingClientRect().top<=wo&&(t=n);let n=document.documentElement;window.innerHeight+window.scrollY>=n.scrollHeight-To&&(t=e[e.length-1]??t);let r=t?.getAttribute(Z)??null;r!==null&&fe(r);};return window.addEventListener(Mo,e,{passive:true}),()=>{window.removeEventListener(Mo,e);}},[]),Ie(()=>{let e=C.current;e!==null&&(ue(qo(e,w)===0),Jo(e,w));});let A$1={[Q$1.header]:K$1(A,{children:[K$1(`div`,{className:dt.settingsRow,children:K$1(ui$1,{id:Qe,label:Ze,checked:p,onChange:e=>{kc(Xe,e),m(e),mr$1();}})}),K$1(`div`,{className:dt.settingsRow,children:K$1(ui$1,{id:qa$1,label:Ka$1,checked:b,onChange:e=>{kc(Ga$1,e),re(e),fo$1(e);}})})]}),[Q$1.feed]:K$1(`div`,{className:dt.settingsRow,children:[K$1(Dn$1,{id:_t,label:$a,value:i,min:0,step:1,onChange:e=>{Ic(e??0),a(Fc());}}),K$1(`p`,{className:dt.settingsCaption,children:eo})]}),[Q$1.ai]:K$1(`div`,{className:dt.settingsRow,children:[K$1(ui$1,{id:Va,label:Ha,checked:h,onChange:e=>{Ge(e),g$1(e);}}),K$1(`p`,{className:dt.settingsCaption,children:Ua})]}),[Q$1.search]:K$1(`div`,{className:dt.settingsRow,children:[K$1(ui$1,{id:Ga,label:Ka,checked:_,onChange:e=>{kc(is,e),y(e);}}),K$1(`p`,{className:dt.settingsCaption,children:qa})]}),[Q$1.collections]:K$1(`div`,{className:dt.settingsRow,children:[K$1(Dn$1,{id:vt,label:Fe.playlistChunkSizeLabel,value:l,min:1,step:1,onChange:e=>{Rc(e??0),u(Lc());}}),K$1(`p`,{className:dt.settingsCaption,children:Ja})]})},j=n=>OP.filter(e=>!to.has(e.id)&&MP(e.id)===n),M=`${dt.pageCard} ${co}`,he=new Set(kP.map(e=>e.id)),_e=e=>kP.some(t=>t.id===e&&j(t.id).length===0&&A$1[t.id]===void 0),I=Vo.filter(e=>!_e(e.id)),ve=e=>{if(e===Fo)return K$1(ct,{className:dt.pageCard,children:[K$1(Mn,{includeHeading:false}),K$1(`style`,{children:no}),K$1(`div`,{className:dt.settingsGroup,children:K$1(Xo,{features:j(Q$1.appearance),disabled:!n})})]});if(e===Lo)return K$1(ct,{className:dt.pageCard,children:[K$1(`div`,{className:dt.settingsGroup,children:[K$1(`div`,{className:dt.settingsRow,children:K$1(ui$1,{id:bt,label:Fe.gridFavButtonsLabel,checked:d,onChange:e=>{Tc(e),Nh(e),f(e);}})}),K$1(Xo,{features:j(Q$1.favorites),disabled:!n})]}),K$1(`div`,{className:Xa,children:[K$1(`p`,{className:Za,children:Ya}),K$1(Ba,{includeHeading:false})]})]});if(e===Ro)return K$1(ct,{className:dt.pageCard,children:[K$1(`div`,{className:dt.settingsGroup,children:K$1(Xo,{features:j(Q$1.downloads),disabled:!n})}),K$1(Ii,{disabled:!n||!PP(`downloads`)})]});if(e===zo)return K$1(ct,{className:dt.pageCard,children:K$1(ta,{})});if(e===Io)return K$1(ct,{className:dt.pageCard,children:K$1(Wn,{includeHeading:false})});if(e===Bo)return K$1(ct,{className:dt.pageCard,children:K$1(ei,{includeHeading:false})});let t=kP.find(t=>t.id===e);return t===void 0?null:K$1(ct,{className:M,children:[K$1(Xo,{features:j(t.id),disabled:!n}),A$1[t.id]]})},be=e=>K$1(`li`,{children:K$1(`a`,{className:`${_o} rdw-kit-focusable`,href:g(e.id),...de===e.id?{"aria-current":`true`}:{},children:e.title})},e.id);return K$1(`div`,{className:fo,ref:S,children:[K$1(`style`,{children:Wo}),K$1(`nav`,{className:po,"aria-label":Oo,children:[K$1(`p`,{className:mo,children:Eo}),K$1(`p`,{className:ho,children:Uo()}),K$1(Cr$1,{className:Qa,value:w,placeholder:ko,"aria-label":ko,onChange:se}),K$1(`ul`,{className:go,children:[I.filter(e=>!e.service).map(be),K$1(`li`,{className:vo,role:`separator`}),I.filter(e=>e.service).map(be)]})]}),K$1(`div`,{className:`${Q} ${dt.scrollRegion}`,ref:C,children:[w.trim().length===0?K$1(ct,{className:`${M} ${lo}`,children:K$1(`div`,{className:`${dt.settingsRow} ${uo}`,children:[K$1(ui$1,{id:xt,label:Fe.enablePageTweaksLabel,checked:n,onChange:e=>{Dc(e),r(e),window.location.reload();}}),K$1(`p`,{className:dt.settingsCaption,children:Wa})]})}):null,I.map(e=>K$1(Yo,{id:e.id,title:e.title,rows:he.has(e.id),children:ve(e.id)},e.id)),ce?K$1(Cn$1,{title:Ho(w),action:K$1(q$1,{variant:`secondary`,onClick:()=>{se(``);},children:Ao})}):null]})]})}})}}));
System.register("./collections-page-DNArtZ5S-2InmhwnG.js", ['./___monkey.entry.js','./app-C96QXzu_-Dg1SKPru.js','./filter-terms-D4vK_G3t-DEF-Gl6D.js'],(function(exports){'use strict';var K$1,G$1,Zc,Fe,Pc,Ks,tl,el,Qc,$c,Ga,Ya,l,te,Ao,yc,hc,qs,so,gc,_c,vc,Ee,jt$1,Ho,Te,ln$1,Xo,Nt$2,ao,Nc,z$1,V$1,B$1,Re,jp,K$2,Jr,q$1,Dr,Cr,ai,dt$1,F$1,rF,nF,sF,lF,A$1,dt$2,Cn$1,Tn$1,pt$1,xn$1,oF,Kt$1,Nt$1,X$1,vg,xt$1,Ot$1,ft$1,aF,cF,Oe,Ne,Me,De,Ie,Be,ze,Re$1;return{setters:[function(module){K$1=module.bp;G$1=module.c;Zc=module.dg;Fe=module.bi;Pc=module.P;Ks=module.bE;tl=module.dh;el=module.di;Qc=module.dj;$c=module.dk;Ga=module.dl;Ya=module.aR;l=module.l;te=module.cO;Ao=module.br;yc=module.dm;hc=module.bj;qs=module.c5;so=module.bL;gc=module.bt;_c=module.bu;vc=module.bv;Ee=module.cs;jt$1=module.cq;Ho=module.dn;Te=module.a9;ln$1=module.af;Xo=module.dp;Nt$2=module.bD;ao=module.aa;Nc=module.g;},function(module){z$1=module.z;V$1=module.V;B$1=module.B;Re=module.w;jp=module.an;K$2=module.K;Jr=module.ao;q$1=module.q;Dr=module.h;Cr=module.C;ai=module.f;dt$1=module.ap;F$1=module.aq;rF=module.ar;nF=module.as;sF=module.at;lF=module.au;A$1=module.A;dt$2=module.s;Cn$1=module.a;Tn$1=module.p;pt$1=module.r;xn$1=module.l;oF=module.av;Kt$1=module.j;Nt$1=module.o;X$1=module.aw;vg=module.ax;xt$1=module.ay;Ot$1=module.az;ft$1=module.aA;aF=module.aB;cF=module.aC;},function(module){Oe=module.O;Ne=module.N;Me=module.M;De=module.D;Ie=module.I;Be=module.B;ze=module.z;Re$1=module.R;}],execute:(function(){exports("CollectionsPage",Sr);var Ye=1500,Xe=8e3,C=4,w=`sort:`;function Ze(e){return e.filter(e=>e.kind===`search`&&!Ao((e.query??``).trim()))}function T(e){return !(e.query??``).toLowerCase().split(/\s+/).some(e=>e.startsWith(w))}function E(e){let t=0;for(let n of e){let e=ln$1(n),r=e===null?NaN:Number(e);Number.isFinite(r)&&r>t&&(t=r);}return t}function D(e){return new Promise(t=>{window.setTimeout(t,e);})}async function Qe(e,t,n){let r=e.length,i=0;for(let a of e){if(n())break;try{let e=so(a.tags);X$1(F$1);let t=await vg(e).catch(async()=>(await D(Xe),vg(e))),n=t.thumbs[0]?.parentElement??null,r=t.thumbs[0]?.ownerDocument??null;if(n!==null&&gc(a.id,xt$1(n,C)),r!==null){let e=Ot$1(r,(a.query??``).trim());e!==null&&_c(a.id,e);}T(a)&&vc(a.id,E(t.thumbs),a.openedPostId===void 0);}catch(e){return {ok:false,checked:i,name:a.name,reason:e instanceof Error?e.message:String(e)}}i+=1,t({done:i,total:r}),i<r&&await D(Ye);}return {ok:true,checked:i}}var $e=`pageshow`,et=`rdw-collections-page`,O=`rdw-collections-header`,k=`rdw-collections-toolbar`,A=`rdw-collections-filter`,tt=`rdw-collections-grid`,j=`rdw-collections-grid--list`,M=`rdw-collections-cell`,N=`rdw-collections-cell-actions`,nt=`Move to a group: `,rt=`text/plain`,it=44,P=`rdw-collection-card`,F=`rdw-collection-cover`,I=`rdw-collection-cover-cell`,L=`rdw-collection-cover-image`,R=`rdw-collection-cover-empty`,z=`rdw-collection-meta-row`,B=`rdw-collection-name`,V=`rdw-collection-caption`,H=`rdw-collection-form-error`,U=`rdw-collections-form-hint`,W=`name`,at=`query`,G=`Posts you add by hand.`,K=`A saved search. Check for new shows when it grows.`,q=`Same syntax as the site search.`,J=`rdw-collection-card--selected`,Y=`rdw-collection-card-mark`,ot=`rdw-collections-selected-count`,st=`all`,X=`custom`,Z=`dynamic`,Q=`custom`,$=`dynamic`,ct=`All`,lt=`Custom`,ut=`Dynamic`,dt=`New`,ft=`Select`,pt=`Select collections to delete`,mt=`${Fe.delete}\u2026`,ht=`Delete collections`,gt=`Delete collection`,_t=`${Fe.delete} `,vt=`Delete 1 collection? This cannot be undone.`,yt=`Delete `,bt=` collections? This cannot be undone.`,xt=`checkbox`,St=1,Ct=3,wt=`rdw-collections-check--failed`,Tt=`Retry`,Et=`New collection`,Dt=`Create`,Ot=`Query`,kt=`cat_ears -comic`,At=`Show`,jt=`Collection kind`,Mt=`Filter by name; several names separated by commas`,Nt=`Filter collections`,Pt=`Collections`,Ft=`Custom`,It=`Dynamic`,Lt=`new`,Rt=`rdw-collection-new`,zt=` · `;function Bt(e,t){return `${e}${zt}${t}`}var Vt=`Check for new`,Ht=`Read the first page of every saved search: refresh its cover and post count and mark the ones with new posts. One request per search`,Ut=`rdw-collections-check-status`,Wt=`saved search`,Gt=`no query`,Kt=`en-US`,qt=`+`,Jt=`No collections yet`,Yt=`Custom collections are posts you pick. Dynamic collections are saved searches.`,Xt=`No matching collections`,Zt=`Nothing matches this filter.`,Qt=`Clear filter`;function $t(e){return `No collections match \u201c${e.trim()}\u201d.`}var en=`Enter a name.`,tn=`Enter a query.`,nn=`A collection with this name already exists.`,rn=`post`,an=`posts`,on=1,sn=2,cn=4,ln=2,un=12,dn=12,fn=12,pn=8,mn=220,hn=5,gn=`rdw-collections-toolbar-spacer`,_n=8,vn=8,yn=8,bn=10,xn=12,Sn=14,Cn=22,wn=14,Tn=14,En=2,Dn=`0.04em`,On=`rdw-collection-name`,kn=`rdw-collection-query`,An=`rdw-collections-filter`,jn=`rdw-collection-form-error`,Mn=[{value:st,label:ct},{value:X,label:lt},{value:Z,label:ut}],Nn=[{value:Q,label:lt},{value:$,label:ut}],Pn=`
.${et} {
  display: flex;
  flex-direction: column;
  gap: ${String(dn)}px;
}
.${O} {
  display: flex;
  flex-direction: column;
  gap: ${String(fn)}px;
}
.${k} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${String(pn)}px;
}
.${k} .${A} {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 100%;
  margin: 0;
}
/* The caption over the sort list would make the row taller; the options say what they sort by. */
.${k} .rdw-select__label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
/* Starts short and grows with what is typed, up to the row. */
.${A} .rdw-field__input {
  field-sizing: content;
  width: ${String(mn)}px;
  min-width: ${String(mn)}px;
  max-width: 100%;
}
@supports (field-sizing: content) {
  .${A} .rdw-field__input {
    width: auto;
  }
}
/* Stays at the top of the window while the list scrolls under it. */
.${O} {
  position: sticky;
  top: ${Ya};
  z-index: ${String(hn)};
  padding-block: 8px;
  margin: -8px 0;
  background: var(--rdw-bg);
}
/* Custom theme: over the user's picture a bar of the page's colour from edge
   to edge is a black slab. The toolbar is a card there, like the tiles. */
:host-context(html[${l}="${te}"]) .${O} {
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
.${et} > :not(.${tt}):not(.${O}),
.${j} {
  padding-inline: ${oF};
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
.${j} .${Y} {
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
.${J},
.${J}:hover {
  border-color: var(--rdw-accent);
  box-shadow: 0 0 0 1px var(--rdw-accent);
  background: var(--rdw-accent-soft);
}
.${Y} {
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
.${J} .${Y} {
  border-color: var(--rdw-accent);
  background: var(--rdw-accent);
}
.${ot} {
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
.${Ut} {
  flex: 1 1 100%;
  color: var(--rdw-muted);
  font-size: 12px;
}
/* A check that stopped: not a grey line among others, and with a way on. */
.${Ut}.${wt} {
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
.${Rt} {
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
`.trim();function Fn(e){return e===st||e===X||e===Z}function In(e){return e===Q||e===$}function Ln(e){return e.trim().toLowerCase()}function Rn(e){return `${String(e)} ${e===on?rn:an}`}function zn(e,t){let n=e.trim();if(n.length===0)return en;let r=Ln(n);for(let e of t)if(Ln(e.name)===r)return nn;return null}function Bn(e,t){return Be([e],ze(t,Re$1))}function Vn(e,t,n){let r=[];for(let i of e){if(!Bn(i.name,n))continue;let e=Ga(i);t===X&&e!==`posts`||t===Z&&e!==`search`||r.push(i);}return r}var Hn=`created`,Un=`newest`,Wn=`name`,Gn=`size`,Kn=`collections-sort`,qn=`Sort`,Jn=[{value:Un,label:`Newest first`},{value:Hn,label:`Oldest first`},{value:Wn,label:`Name`},{value:Gn,label:`Most posts`}];function Yn(e){return e===`created`||e===`newest`||e===`name`||e===`size`}function Xn(){let e=Nc(Kn);return Yn(e)?e:Hn}function Zn(e){return Ga(e)===`posts`?e.postIds?.length??0:e.postCount?.value??0}function Qn(e,t){let n=[...e];return t===`created`?n:t===`newest`?n.reverse():(n.sort((e,t)=>e.name.localeCompare(t.name,void 0,{sensitivity:`base`,numeric:true})),t===`size`&&n.sort((e,t)=>Zn(t)-Zn(e)),n)}function $n(e){return e===Z?$:Q}function er(e,t){return e===$&&t===X?Z:e===Q&&t===Z?X:t}function tr(e){let t=e.postIds??[],n=[];for(let e=0;e<cn;e+=1){let r=t[e];n.push(r===void 0?null:r);}return n}function nr(e,t){let n=e.thumbs;if(n===void 0)return null;let r=n[String(t)];return r===void 0||r.trim().length===0?null:r}function rr(e,t,n){let r=Bt(e,t);return n.length>0?`${r}${zt}${n}`:r}function ir(e){let t=e.length,n=t===St?vt:`${yt}${String(t)}${bt}`;if(t===0)return n;let r=e.slice(0,Ct).map(e=>`\u201c${e}\u201d`),i=t-r.length;return `${n} ${i>0?`${r.join(`, `)} and ${String(i)} more`:r.join(`, `)}.`}function ar(e){return `${e.toLocaleString(Kt)} ${e===St?`collection`:`collections`}`}function or(e,t){return e===t?ar(t):`${e.toLocaleString(Kt)} of ${ar(t)}`}var sr=`HTTP 429`,cr=`the site is asked too often (429). Wait a minute, then retry.`,lr=`no answer from the site. Check the connection, then retry.`;function ur(e){return e.includes(sr)?cr:/failed to fetch|networkerror|load failed/i.test(e)?lr:`${e}. Retry later.`}function dr(e,t,n){return `${e}, ${t}, ${n}`}function fr(e){let n=e.select,r=dr(e.collection.name,e.badge,e.meta);return n===null?K$2(`a`,{className:P,href:e.href,draggable:false,"aria-label":r,"data-collection-id":e.collection.id,"data-collection-kind":e.kind,children:[e.children,K$2(`span`,{className:z,children:[K$2(`span`,{className:B,children:e.collection.name}),e.hasNew?K$2(`span`,{className:Rt,children:Lt}):null]}),K$2(`span`,{className:V,children:rr(e.badge,e.meta,e.group)})]}):K$2(`a`,{className:n.selected?`${P} ${J}`:P,href:e.href,role:xt,"aria-checked":n.selected,"aria-label":r,"data-collection-id":e.collection.id,"data-collection-kind":e.kind,onClick:e=>{e.preventDefault(),n.onToggle();},children:[K$2(`span`,{className:Y,"aria-hidden":`true`,children:n.selected?K$2(ft$1,{size:Tn}):null}),e.children,K$2(`span`,{className:z,children:[K$2(`span`,{className:B,children:e.collection.name}),e.hasNew?K$2(`span`,{className:Rt,children:Lt}):null]}),K$2(`span`,{className:V,children:rr(e.badge,e.meta,e.group)})]})}function pr(e){let[n,r]=z$1(null);return n===e.url?K$2(`span`,{className:R}):K$2(`img`,{className:L,src:e.url,alt:``,onError:()=>{r(e.url);}})}function mr(e){let n=e.urls.filter(e=>e!==null).length;return K$2(`span`,{className:F,"data-filled":String(n),children:e.urls.map((n,r)=>{let i=e.postIds?.[r]??null;return K$2(`span`,{className:I,"data-empty":n===null?`true`:void 0,"data-cover-index":String(r),"data-post-id":i===null?``:String(i),children:n===null?K$2(`span`,{className:R}):K$2(pr,{url:n})},`${e.collectionId}-${String(r)}`)})})}function hr(e){let n=Rn(e.collection.postIds?.length??0),r=tr(e.collection),i=r.map(t=>t===null?null:nr(e.collection,t));return K$2(fr,{collection:e.collection,href:jt$1(e.collection.id),kind:Ee,badge:Ft,meta:n,select:e.select,group:e.group,children:K$2(mr,{collectionId:e.collection.id,urls:i,postIds:r})})}function gr(e){return e.query??ao(e.tags)}function _r(e){return `${so(e.tags)}${Nt$2(e.id)}`}function vr(e){if(Ao(gr(e)))return Gt;let t=Xo(e.id)??e.postCount??null;if(t===null)return Wt;let n=t.value.toLocaleString(Kt);return t.exact?`${n} ${t.value===on?rn:an}`:`${n}${qt} ${an}`}function yr(e){let n=Ho(e.collection.id)??e.collection.cover??[],r=[];for(let e=0;e<cn;e+=1)r.push(n[e]??null);return K$2(fr,{collection:e.collection,href:_r(e.collection),kind:Te,badge:It,hasNew:yc(e.collection),meta:vr(e.collection),select:e.select,group:e.group,children:K$2(mr,{collectionId:e.collection.id,urls:r})})}function br(e){return Ga(e.collection)===`posts`?K$2(hr,{collection:e.collection,select:e.select,group:e.group}):K$2(yr,{collection:e.collection,select:e.select,group:e.group})}function xr(e){let r=e.error.length>0,i=r&&e.errorField===W,a=r&&e.errorField===at,ee=K$2(`p`,{id:jn,className:H,role:`alert`,children:e.error});return K$2(xn$1,{variant:`content`,open:e.open,onClose:e.onClose,title:Et,children:[K$2(Dr,{label:jt,options:Nn,value:e.kind,onChange:t=>{In(t)&&e.onKindChange(t);}}),K$2(`p`,{className:U,children:e.kind===$?K:G}),K$2(`form`,{className:`rdw-dialog__fields`,onSubmit:t=>{t.preventDefault(),e.onSubmit();},children:[K$2(Kt$1,{id:On,label:Fe.nameLabel,value:e.name,onChange:e.onNameChange}),i?ee:null,e.kind===$?K$2(A$1,{children:[K$2(Nt$1,{id:kn,label:Ot,placeholder:kt,value:e.query,onChange:e.onQueryChange}),a?ee:K$2(`p`,{className:U,children:q})]}):null,K$2(`div`,{className:`rdw-dialog__actions`,children:[K$2(q$1,{type:`button`,variant:`secondary`,size:`s`,onClick:e.onClose,children:Fe.cancel}),K$2(q$1,{type:`submit`,variant:`primary`,size:`s`,disabled:i,children:Dt})]})]})]})}function Sr(){let[e,i]=z$1(st),[s,pe]=z$1(``),[c,me]=z$1(()=>cF(aF)),[_e,ye]=z$1(()=>Xn()),[be,xe]=z$1(false),[u,Se]=z$1(Q),[d,Te]=z$1(``),[p,m]=z$1(``),[h,g]=z$1(``),[je,_]=z$1(W),[,v]=z$1(0),[y,Re$1]=z$1(false),[ze,b]=z$1([]),[Ve,x]=z$1(false),[S,Ye]=z$1(``),[Xe,C]=z$1(null),[w,T]=z$1(null),[E,D]=z$1(null),[it,P]=z$1(``),[F,I]=z$1(false),[L,R]=z$1(false),z=V$1(false);B$1(()=>()=>{z.current=true;},[]);let B=()=>{let e=Ze(G$1().collections);e.length===0||L||(z.current=false,I(false),R(true),P(`Checking 0 of ${String(e.length)}…`),Qe(e,e=>{P(`Checking ${String(e.done)} of ${String(e.total)}…`);},()=>z.current).then(e=>{if(z.current)return;K$1(),R(false);let t=G$1().collections.filter(yc).length;P(e.ok?`Checked ${String(e.checked)}; ${String(t)} with new posts.`:`Stopped at “${e.name}” after ${String(e.checked)} checked: ${ur(e.reason)}`),I(!e.ok),v(e=>e+1);}));},V=Re(()=>{xe(false),g(``),Te(``),m(``);},[]);B$1(()=>{let e=()=>{K$1(),v(e=>e+1);};return window.addEventListener($e,e),()=>{window.removeEventListener($e,e);}},[]);let H=G$1().collections,U=Zc(),G=Qn(Vn(H,e,s),_e).filter(e=>Oe(e.group,S)),K=(e,t)=>{Qc(e,t),v(e=>e+1);},q=H.length===0?{title:Jt,description:Yt}:s.trim().length>0?{title:$t(s),description:``}:{title:Xt,description:Zt},J=G.filter(e=>ze.includes(e.id)),Y=()=>{Re$1(false),b([]),x(false);};jp(y,Y);let X=e=>{b(t=>t.includes(e)?t.filter(t=>t!==e):[...t,e]);},Z=()=>{for(let e of J)Ks(e.id);Y(),v(e=>e+1);},ct=()=>{Se($n(e)),Te(``),m(``),g(``),xe(true);},lt=()=>{let e=zn(d,G$1().collections);if(e!==null){_(W),g(e);return}if(u===$&&Ao(p)){_(at),g(tn);return}let t=d.trim();u===$?hc(t,p):qs(t),i(e=>er(u,e)),V(),v(e=>e+1);};return K$2(`div`,{className:et,children:[K$2(`style`,{children:Pn}),K$2(`header`,{className:O,children:[y?K$2(Jr,{count:J.length,onSelectAll:()=>{b(G.map(e=>e.id));},onClear:()=>{b([]);},onCancel:Y,danger:K$2(q$1,{type:`button`,variant:`danger-quiet`,disabled:J.length===0,onClick:()=>{x(true);},children:mt}),children:K$2(Ne,{groups:U,disabled:J.length===0,onMove:e=>{K(J.map(e=>e.id),e);},onNew:()=>{C({kind:`new`,targets:J.map(e=>e.id)});}})}):K$2(`div`,{className:k,children:[K$2(Dr,{label:At,options:Mn,value:e,onChange:e=>{Fn(e)&&i(e);}}),K$2(Cr,{id:An,className:A,value:s,placeholder:Nt,"aria-label":Mt,onChange:pe}),K$2(ai,{label:qn,options:Jn,value:_e,onChange:e=>{Yn(e)&&(Pc(Kn,e),ye(e));}}),K$2(dt$1,{scope:F$1}),K$2(Dr,{label:nF,options:rF,value:c,onChange:e=>{sF(e)&&(lF(aF,e),me(e));}}),K$2(`span`,{className:ot,children:or(G.length,H.length)}),K$2(`span`,{className:gn,"aria-hidden":`true`}),K$2(A$1,{children:[H.length>0?K$2(q$1,{type:`button`,variant:`secondary`,title:pt,onClick:()=>{Re$1(true);},children:ft}):null,Ze(H).length>0?K$2(q$1,{type:`button`,variant:`secondary`,title:Ht,disabled:L,onClick:B,children:Vt}):null,K$2(q$1,{type:`button`,variant:`primary`,onClick:ct,children:[K$2(dt$2,{size:Sn}),dt]}),it.length>0?K$2(`span`,{className:F?`${Ut} ${wt}`:Ut,role:`status`,children:[it,F?K$2(A$1,{children:[` `,K$2(q$1,{type:`button`,variant:`secondary`,size:`s`,onClick:B,children:Tt})]}):null]}):null]})]}),H.length>0?K$2(Me,{total:H.length,groups:De(U,H.map(e=>e.group)),value:S,onChange:Ye,onNew:()=>{C({kind:`new`,targets:[]});},onRename:e=>{C({kind:`rename`,name:e});},onDelete:e=>{C({kind:`delete`,name:e,count:H.filter(t=>t.group===e).length});},dragging:w!==null,onDropTo:e=>{w!==null&&K([w],e),T(null);},locked:y}):null]}),G.length===0?K$2(Cn$1,{title:q.title,...q.description.length>0?{description:q.description}:{},...H.length>0&&s.trim().length>0?{action:K$2(q$1,{variant:`secondary`,onClick:()=>{pe(``);},children:Qt})}:{}}):K$2(`div`,{className:c===`list`?`${tt} ${j}`:tt,"aria-label":Pt,children:G.map(e=>K$2(`div`,{className:M,...w===e.id?{"data-dragged":``}:{},draggable:!y,onDragStart:t=>{t.dataTransfer?.setData(rt,e.name),T(e.id);},onDragEnd:()=>{T(null);},children:[K$2(br,{collection:e,group:e.group===S?``:e.group??``,select:y?{selected:ze.includes(e.id),onToggle:()=>{X(e.id);}}:null}),y?null:K$2(`div`,{className:N,children:[K$2(Ne,{groups:U,current:e.group??``,iconLabel:`${nt}${e.name}`,onMove:t=>{K([e.id],t);},onNew:()=>{C({kind:`new`,targets:[e.id]});}}),K$2(Tn$1,{label:`${_t}${e.name}`,onClick:()=>{D(e);},children:K$2(pt$1,{size:Sn})})]})]},e.id))}),K$2(xn$1,{variant:`confirm`,open:Ve,title:ht,message:ir(J.map(e=>e.name)),confirmLabel:Fe.delete,cancelLabel:Fe.cancel,confirmTone:`danger`,onConfirm:Z,onClose:()=>{x(false);}}),K$2(xn$1,{variant:`confirm`,open:E!==null,title:gt,message:E===null?``:ir([E.name]),confirmLabel:Fe.delete,cancelLabel:Fe.cancel,confirmTone:`danger`,onConfirm:()=>{E!==null&&(Ks(E.id),v(e=>e+1)),D(null);},onClose:()=>{D(null);}}),K$2(Ie,{request:Xe,groups:U,countLabel:ar,onCreate:(e,t)=>{t.length>0?Qc(t,e):$c(e),C(null),v(e=>e+1);},onRename:(e,t)=>{el(e,t),S===e&&Ye(t),C(null),v(e=>e+1);},onDelete:e=>{tl(e),S===e&&Ye(``),C(null),v(e=>e+1);},onClose:()=>{C(null);}}),K$2(xr,{open:be,kind:u,name:d,query:p,error:h,errorField:je,onClose:V,onKindChange:e=>{Se(e),g(``);},onNameChange:e=>{Te(e);let t=e.trim().length>0?zn(e,G$1().collections):null;_(W),g(t??``);},onQueryChange:e=>{m(e),g(``);},onSubmit:lt})]})}})}}));
System.register("./following-page-G2uXgvvc-CWbjsRG4.js", ['./___monkey.entry.js','./app-C96QXzu_-Dg1SKPru.js','./filter-terms-D4vK_G3t-DEF-Gl6D.js'],(function(exports){'use strict';var K$1,Vc,Kc,Wc,na,pt$1,ft$1,ie,ce,ae,oe,mt$1,yt$1,ra,ia,Fe,Xc,Yc,qc,Jc,cl,G$1,nl,Ya,l,te,so,xe,rl,ol,m,z$1,V$1,O$1,Me,B$1,jp,K$2,dt$1,q$1,$$1,Q$1,Cn,A$1,Jr,Dr,Cr,ai,dt$2,P$1,rF,nF,sF,lF,Un,xn,at$1,oF,Tn,pt$2,ft$2,X$1,ag,iF,cF,ze,Ne,Me$1,De,Ie,Be,Oe,Le;return{setters:[function(module){K$1=module.bp;Vc=module.aJ;Kc=module.dq;Wc=module.cc;na=module.aE;pt$1=module.dr;ft$1=module.ds;ie=module.C;ce=module.M;ae=module.cw;oe=module.cr;mt$1=module.dt;yt$1=module.du;ra=module.aF;ia=module.aG;Fe=module.bi;Xc=module.dv;Yc=module.dw;qc=module.dx;Jc=module.dy;cl=module.dz;G$1=module.c;nl=module.dA;Ya=module.aR;l=module.l;te=module.cO;so=module.bL;xe=module.c7;rl=module.dB;ol=module.b6;m=module.m;},function(module){z$1=module.z;V$1=module.V;O$1=module.t;Me=module.aD;B$1=module.B;jp=module.an;K$2=module.K;dt$1=module.s;q$1=module.q;$$1=module.aE;Q$1=module.aF;Cn=module.a;A$1=module.A;Jr=module.ao;Dr=module.h;Cr=module.C;ai=module.f;dt$2=module.ap;P$1=module.aG;rF=module.ar;nF=module.as;sF=module.at;lF=module.au;Un=module.U;xn=module.l;at$1=module.E;oF=module.av;Tn=module.p;pt$2=module.r;ft$2=module.aA;X$1=module.aw;ag=module.aH;iF=module.aI;cF=module.aC;},function(module){ze=module.z;Ne=module.N;Me$1=module.M;De=module.D;Ie=module.I;Be=module.B;Oe=module.O;Le=module.L;}],execute:(function(){exports("FollowingPage",hn);var $e=`pageshow`,et=`rdw-following-page`,b=`rdw-following-sticky`,x=`rdw-following-toolbar`,S=`rdw-following-filter`,tt=`rdw-following-meta`,C=`rdw-following-grid`,w=`rdw-following-grid--list`,T=`rdw-artist-card`,E=`rdw-artist-card--selected`,D=`rdw-artist-card-link`,O=`rdw-artist-card-mark`,k=`rdw-artist-card-actions`,A=`rdw-artist-cover`,nt=`rdw-artist-cover-cell`,j=`rdw-artist-cover-image`,M=`rdw-artist-name-row`,N=`rdw-artist-name`,P=`rdw-artist-new`,F=`rdw-artist-caption`,rt=`rdw-following-progress`,it=`rdw-following-add-tag`,at=`Open Posts`,ot=`${ie}?${ce}=${ae}&s=${oe}`,st=`all`,ct=`new`,I=`name`,L=`posts`,R=`added`,lt=`Show`,ut=`Sort`,z=`new`,dt=`Select`,ft=`Unfollow`,pt=`Unfollow…`,mt=`Refresh`,ht=`Read each artist's first page again: cover, post count, newest post`,gt=`Artist tags, separated by spaces`,_t=`Add artists`,B=`Follow artists`,vt=/\s+/,yt=`Close`,V=`not opened yet`,H=`no new posts since `,U=`post`,W=`posts`,bt=`+`,xt=`No matching artists`,St=`Nothing matches this filter.`,Ct=`Clear filter`;function wt(e){return `No artists match \u201c${e.trim()}\u201d.`}var Tt=`Unfollow artists`,Et=`Refresh artists`,Dt=`Stopped at `,Ot=`Refreshed `,kt=`checkbox`,G=`en-US`,At=`en-GB`,K=1,jt=864e5,q=60,Mt=1500,Nt=2e3,Pt=1e3,J=2,Ft=14,Y=44,X=220,Z=5,It=`rdw-following-toolbar-spacer`,Lt=`rdw-following-toolbar-count`,Rt=`Filter by name`,zt=`all`,Bt=`Type`,Vt=[{value:zt,label:`All types`},{value:na,label:`Artists`},{value:ra,label:`Characters`},{value:ia,label:`Copyrights`}],Ht={[na]:``,[ra]:`character`,[ia]:`copyright`},Ut=`Move to a group: `,Q=`text/plain`,Wt=[{value:st,label:`All`},{value:ct,label:`New`}],Gt=[{value:I,label:`By name`},{value:L,label:`By posts`},{value:R,label:`Recently followed`}],Kt=`
.${et} {
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
  width: ${String(X)}px;
  min-width: ${String(X)}px;
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
  top: ${Ya};
  z-index: ${String(Z)};
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
.${Lt} {
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
.${et} > :not(.${C}):not(.${b}),
.${w} {
  padding-inline: ${oF};
}
/* Between the filters and the actions: the actions stand at the right end. */
.${It} {
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
  width: ${String(Y)}px;
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
  grid-template-columns: repeat(${String(J)}, minmax(0, 1fr));
  grid-template-rows: repeat(${String(J)}, minmax(0, 1fr));
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
`.trim();function qt(e){return e===st||e===ct}function Jt(e,t=``){let n=e.group??``;return [Ht[Wc(e)],n===t?``:n].filter(e=>e.length>0).join(` · `)}function Yt(e,t,n){return t!==zt&&Wc(e)!==t?false:Oe(e.group,n)}function Xt(e,t){let n=t===K?`artist`:`artists`;return e===t?`${String(t)} ${n}`:`${String(e)} of ${String(t)} ${n}`}function Zt(e){return e===I||e===L||e===R}function Qt(e){return e.replaceAll(`_`,` `)}function $t(e,t){return e.localeCompare(t,void 0,{sensitivity:`base`})}function $(){return [...G$1().artists]}function en(e,t){return t>0&&(e.lastPostId??0)>t}function tn(e,t){let n=e.lastPostSince;return n===void 0||t-n<q*jt?null:n}function nn(e){let t=e.postCount;if(t===void 0)return V;let n=t.value.toLocaleString(G);return t.exact?`${n} ${t.value===K?U:W}`:`${n}${bt} ${W}`}function rn(e){return new Date(e).toLocaleDateString(At,{day:`numeric`,month:`short`,year:`numeric`})}function an(e,t){let n=[...e].sort((e,t)=>$t(e.tag,t.tag));return t===L?n.sort((e,t)=>(t.postCount?.value??-1)-(e.postCount?.value??-1)):t===R&&n.sort((e,t)=>(t.addedAt??0)-(e.addedAt??0)),n}function on(e){return `Unfollow ${Qt(e)}? This cannot be undone.`}function sn(e){return e.duplicates===0&&e.invalid===0?``:e.added===0&&e.invalid===0?Fe.artistDuplicate:e.added===0&&e.duplicates===0?Fe.artistInvalid:`Added ${String(e.added)}, already followed ${String(e.duplicates)}, invalid ${String(e.invalid)}.`}function cn(e){return e===K?`Unfollow 1 artist? This cannot be undone.`:`Unfollow ${String(e)} artists? This cannot be undone.`}function ln(e){let t=Math.ceil(e*Mt/Pt);return `This makes ${e===K?`1 request`:`${String(e)} requests`} to the site, one every ${String(Mt/Pt)} seconds (about ${String(t)} s). It stops at the first error.`}function un(e){return new Promise(t=>{window.setTimeout(t,e);})}function dn(e){let[n,r]=z$1(null);return n===e.url?null:K$2(`img`,{className:j,src:e.url,alt:``,loading:`lazy`,onError:()=>{r(e.url);}})}function fn(e){let n=e.artist.cover??[],r=[];for(let e=0;e<4;e+=1){let i=n[e];r.push(K$2(`span`,{className:nt,children:i===void 0?null:K$2(dn,{url:i})},e));}return K$2(`span`,{className:A,children:r})}function pn(e){let{artist:n,select:r}=e,o=Jt(n,e.openTab),s=tn(n,e.now),c=K$2(A$1,{children:[K$2(fn,{artist:n}),K$2(`span`,{className:M,children:[K$2(`span`,{className:N,title:n.tag,children:Qt(n.tag)}),e.hasNew?K$2(`span`,{className:P,children:z}):null]}),K$2(`span`,{className:F,children:nn(n)}),o.length>0?K$2(`span`,{className:F,children:o}):null,s===null?null:K$2(`span`,{className:F,children:`${H}${rn(s)}`})]}),l=so([{tag:n.tag,type:xe}]);return r===null?K$2(`div`,{className:T,"data-tag":n.tag,...e.dragged?{"data-dragged":``}:{},draggable:true,onDragStart:t=>{t.dataTransfer?.setData(Q,n.tag),e.onDragStart();},onDragEnd:e.onDragEnd,children:[K$2(`a`,{className:D,href:l,draggable:false,children:c}),K$2(`div`,{className:k,children:[K$2(Ne,{groups:e.groups,current:n.group??``,iconLabel:`${Ut}${n.tag}`,onMove:e.onMove,onNew:e.onNewGroup}),K$2(Tn,{label:`Unfollow ${n.tag}`,onClick:e.onUnfollow,children:K$2(pt$2,{size:Ft})})]})]}):K$2(`div`,{className:r.selected?`${T} ${E}`:T,"data-tag":n.tag,children:[K$2(`a`,{className:D,href:l,role:kt,"aria-checked":r.selected,"aria-label":n.tag,onClick:e=>{e.preventDefault(),r.onToggle();},children:c}),K$2(`span`,{className:O,"aria-hidden":`true`,children:r.selected?K$2(ft$2,{size:Ft}):null})]})}function mn(e){return K$2(xn,{variant:`content`,open:e.open,onClose:e.onClose,title:B,children:K$2(`form`,{className:`rdw-dialog__fields`,onSubmit:t=>{t.preventDefault(),e.onSubmit();},children:[K$2(at$1,{id:it,label:gt,value:e.draft,suggestions:e.suggestions,replaceOnSelect:false,onChange:e.onDraftChange,onSelect:t=>{e.onSuggestionSelect(t.value);}}),e.error.length>0?K$2(`p`,{className:`rdw-error`,role:`alert`,children:e.error}):null,K$2(`div`,{className:`rdw-dialog__actions`,children:[K$2(q$1,{type:`button`,variant:`secondary`,size:`s`,onClick:e.onClose,children:Fe.cancel}),K$2(q$1,{type:`submit`,variant:`primary`,size:`s`,children:Fe.artistAdd})]})]})})}function hn(){let[e,i]=z$1(()=>$()),[a,ee]=z$1(``),[te,oe]=z$1(st),[ce,le]=z$1(I),[ue,_e]=z$1(()=>cF(iF)),[m$1,h]=z$1(``),[g,_]=z$1(``),[Te,v]=z$1(false),[Pe,y]=z$1([]),[T,E]=z$1(false),[D,O]=z$1(zt),[k,A]=z$1(``),[nt,j]=z$1(null),[M,N]=z$1(null),[P,F]=z$1([]),[it,L]=z$1(false),[R,z]=z$1(null),[gt,B]=z$1(false),[V,H]=z$1(null),U=V$1(false),W=V$1(O$1({preferType:Me}));B$1(()=>{let e=W.current,t=()=>{K$1(),i($());};return window.addEventListener($e,t),()=>{window.removeEventListener($e,t),e.cancel(),U.current=true;}},[]);let bt=V?.succeeded===true;B$1(()=>{if(!bt)return;let e=window.setTimeout(()=>{H(null);},Nt);return ()=>{window.clearTimeout(e);}},[bt]);let kt=()=>{let e=m$1.split(vt).filter(e=>e.length>0);if(e.length===0){_(Fe.artistInvalid);return}let t=nl(e),n=sn(t);_(n),t.added>0&&h(``),n.length===0&&v(false),y([]),W.current.cancel(),i($());},G=Vc(),At=Date.now(),K=ze(a,Le),jt=e=>te===ct&&!en(e,G)||!Yt(e,D,k)?false:Be([e.tag],K),q=Kc(),Pt=e.some(e=>Wc(e)!==na),J=(e,t)=>{qc(e,t),i($());},Y=an(e,ce).filter(jt),X=Y.filter(e=>P.includes(e.tag)),Z=e.length,Ht=Z===0,Ut=V!==null&&V.running,Q=()=>{E(false),F([]),L(false);};jp(T,Q);let Jt=e=>{F(t=>t.includes(e)?t.filter(t=>t!==e):[...t,e]);},Qt=()=>{rl(X.map(e=>e.tag)),Q(),i($());},$t=async e=>{U.current=false;let t=e.length;H({done:0,total:t,running:true,message:``});let n=0;for(let r of e){if(U.current||n>0&&(await un(Mt),U.current))break;try{X$1(P$1),ol(r.tag,await ag(r.tag));}catch(e){let a=e instanceof Error?e.message:String(e);m.warn(`following: refresh failed`,r.tag,e),i($()),H({done:n,total:t,running:false,message:`${Dt}${r.tag}: ${a}`});return}n+=1,i($()),H({done:n,total:t,running:true,message:``});}H({done:n,total:t,running:false,message:`${Ot}${String(n)} of ${String(t)}`,succeeded:true});},tn=()=>{v(false),_(``),y([]),W.current.cancel();},nn=K$2(q$1,{variant:`primary`,onClick:()=>{v(true);},children:[K$2(dt$1,{size:Ft}),_t]}),rn=K$2(mn,{open:Te,onClose:tn,draft:m$1,error:g,suggestions:Pe,onDraftChange:e=>{h(e),g.length>0&&_(``);let t=Q$1(e);t===null?(W.current.cancel(),y([])):W.current.query(t.stem,y);},onSuggestionSelect:e=>{h($$1(m$1,e)),W.current.cancel(),y([]);},onSubmit:kt});return K$2(`div`,{className:et,children:[K$2(`style`,{children:Kt}),Ht?K$2(Cn,{title:ft$1,description:pt$1,action:K$2(A$1,{children:[nn,K$2(q$1,{variant:`secondary`,onClick:()=>{window.location.assign(ot);},children:at})]})}):K$2(A$1,{children:[K$2(`div`,{className:b,children:[T?K$2(Jr,{count:X.length,onSelectAll:()=>{F(Y.map(e=>e.tag));},onClear:()=>{F([]);},onCancel:Q,danger:K$2(q$1,{variant:`danger-quiet`,disabled:X.length===0,onClick:()=>{L(true);},children:pt}),children:K$2(Ne,{groups:q,disabled:X.length===0,onMove:e=>{J(X.map(e=>e.tag),e);},onNew:()=>{j({kind:`new`,targets:X.map(e=>e.tag)});}})}):K$2(`div`,{className:x,children:[K$2(Dr,{label:lt,options:Wt,value:te,onChange:e=>{qt(e)&&oe(e);}}),K$2(Cr,{id:yt$1,className:S,value:a,placeholder:Rt,"aria-label":mt$1,onChange:ee}),K$2(ai,{label:ut,options:Gt,value:ce,onChange:e=>{Zt(e)&&le(e);}}),Pt?K$2(ai,{label:Bt,options:Vt,value:D,onChange:O}):null,K$2(dt$2,{scope:P$1}),K$2(Dr,{label:nF,options:rF,value:ue,onChange:e=>{sF(e)&&(lF(iF,e),_e(e));}}),K$2(`span`,{className:`${tt} ${Lt}`,children:`${Xt(Y.length,Z)} · ${G>0?`${Fe.seenUpTo}${String(G)}`:Fe.seenNothing}`}),K$2(`span`,{className:It,"aria-hidden":`true`}),K$2(A$1,{children:[K$2(q$1,{variant:`secondary`,disabled:Ut,onClick:()=>{E(true);},children:dt}),K$2(q$1,{variant:`secondary`,title:ht,disabled:Ut||Y.length===0,onClick:()=>{B(true);},children:mt}),nn]})]}),K$2(Me$1,{total:Z,groups:De(q,e.map(e=>e.group)),value:k,onChange:A,onNew:()=>{j({kind:`new`,targets:[]});},onRename:e=>{j({kind:`rename`,name:e});},onDelete:t=>{j({kind:`delete`,name:t,count:e.filter(e=>e.group===t).length});},dragging:M!==null,onDropTo:e=>{M!==null&&J([M],e),N(null);},locked:T})]}),V===null?null:K$2(`div`,{className:rt,role:`status`,children:[K$2(Un,{value:V.total===0?0:V.done/V.total,label:V.running?`${mt}: ${String(V.done)} of ${String(V.total)}`:V.message}),V.running?K$2(q$1,{variant:`secondary`,size:`s`,onClick:()=>{U.current=true;},children:Fe.cancel}):K$2(q$1,{variant:`secondary`,size:`s`,onClick:()=>{H(null);},children:yt})]}),Y.length===0?a.trim().length>0?K$2(Cn,{title:wt(a),action:K$2(q$1,{variant:`secondary`,onClick:()=>{ee(``);},children:Ct})}):K$2(Cn,{title:xt,description:St}):K$2(`div`,{className:ue===`list`?`${C} ${w}`:C,children:Y.map(e=>K$2(pn,{artist:e,hasNew:en(e,G),now:At,select:T?{selected:P.includes(e.tag),onToggle:()=>{Jt(e.tag);}}:null,onUnfollow:()=>{z(e.tag);},groups:q,openTab:k,onMove:t=>{J([e.tag],t);},onNewGroup:()=>{j({kind:`new`,targets:[e.tag]});},onDragStart:()=>{N(e.tag);},onDragEnd:()=>{N(null);},dragged:M===e.tag},e.tag))})]}),rn,K$2(Ie,{request:nt,groups:q,countLabel:e=>Xt(e,e),onCreate:(e,t)=>{t.length>0?qc(t,e):Jc(e),j(null),i($());},onRename:(e,t)=>{Yc(e,t),k===e&&A(t),j(null),i($());},onDelete:e=>{Xc(e),k===e&&A(``),j(null),i($());},onClose:()=>{j(null);}}),K$2(xn,{variant:`confirm`,open:it,title:Tt,message:cn(X.length),confirmLabel:ft,cancelLabel:Fe.cancel,confirmTone:`danger`,onConfirm:Qt,onClose:()=>{L(false);}}),K$2(xn,{variant:`confirm`,open:R!==null,title:ft,message:on(R??``),confirmLabel:ft,cancelLabel:Fe.cancel,confirmTone:`danger`,onConfirm:()=>{R!==null&&(cl(R),i($())),z(null);},onClose:()=>{z(null);}}),K$2(xn,{variant:`confirm`,open:gt,title:Et,message:ln(Y.length),confirmLabel:mt,cancelLabel:Fe.cancel,onConfirm:()=>{B(false),$t(Y);},onClose:()=>{B(false);}})]})}})}}));
System.register("./filter-terms-D4vK_G3t-DEF-Gl6D.js", ['./app-C96QXzu_-Dg1SKPru.js'],(function(exports){'use strict';var z$1,ze$1,Wt,V$1,K$1,q$1,mt,Tn,zn,ft,B$1,Ie$1,Dt,dt,xn,Kt,A$1;return{setters:[function(module){z$1=module.z;ze$1=module.aJ;Wt=module.aK;V$1=module.V;K$1=module.K;q$1=module.q;mt=module.aL;Tn=module.p;zn=module.aM;ft=module.aA;B$1=module.B;Ie$1=module.I;Dt=module.aN;dt=module.s;xn=module.l;Kt=module.j;A$1=module.A;}],execute:(function(){exports({B:Be,D:De,I:Ie,M:Me,N:Ne,O:Oe,z:ze});var _=`\0none`,ee=`Groups`,v=`No group`,te=`New group`,y=`New group…`,b=`Move to group`,ne=`Actions of the group `,re=`Group options`,ie=`Rename…`,x=`Rename group`,S=`Delete`,ae=`Delete group…`,oe=`Delete group`,C=`Group name`,w=`Create`,T=`Save`,E=`Cancel`,D=`There is a group with this name already.`,se=`More`,O=`Find a group`,k=`No group with this name.`,A=`…`,j=28,ce=`resize`,le=`ArrowDown`,M=`ArrowUp`,ue=`Enter`,N=`rdw-groups`,P=`rdw-groups__tab`,F=`rdw-groups__item`,I=`rdw-groups__count`,de=`rdw-groups__item--over`,L=`rdw-groups__item--drop`,R=`rdw-groups__item--landed`,z=`rdw-groups--dragging`,B=`rdw-groups__more`,fe=`rdw-groups__new`,V=`rdw-groups__measure`,H=`rdw-groups-menu__box`,U=`rdw-groups-menu__list`,W=`rdw-groups-menu__count`,G=`rdw-groups-menu__empty`,K=`rdw-groups-name__count`,q=`[role="menuitem"]:not(:disabled)`,J=`input, ${q}`,pe=`[role="tab"]`,me=`ArrowLeft`,he=`ArrowRight`,Y=`rdw-groups-menu`,X=`rdw-groups-menu__item`,Z=`rdw-groups-menu__rule`,Q=`rdw-groups-menu--in-place`,ge=`rdw-groups-menu--end`,_e=`rdw-groups-menu__tick`,ve=`rdw-groups-move`,ye=`rdw-groups-name`,be=`rdw-groups-name__error`,xe=`rdw-groups-name__actions`,Se=220,Ce=160,$=14,we=`
/* Tabs as in the header of the site (the designer's mock-up, 18.11.2026):
   words with no frames, a line under the row, a thicker one under the open tab. */
.${N} {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  position: relative;
  column-gap: ${String(j)}px;
  min-width: 0;
  border-bottom: 1px solid var(--rdw-border);
}
.${N}[inert] {
  opacity: 0.45;
}
.${F} {
  position: relative;
  display: inline-flex;
  align-items: center;
  margin-bottom: -1px;
  border-bottom: 2px solid transparent;
  transition: border-color 120ms ease, background-color 120ms ease, transform 120ms ease;
}
.${F}[data-selected="true"] {
  border-bottom-color: var(--rdw-accent);
}
.${P} {
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
.${F}[data-none] .${P} {
  opacity: 0.8;
}
.${P}:hover,
.${F}[data-selected="true"] .${P} {
  color: var(--rdw-text);
  opacity: 1;
}
.${F}[data-selected="true"] .${P} {
  font-weight: 600;
}
.${I} {
  color: var(--rdw-muted);
  font-size: 12px;
  font-weight: 400;
}
/* The button of a group's own actions stands in the gap after its tab. Only
   the open group has it, and there it is always seen (the designer,
   18.11.2026): a group is renamed or deleted when it is open, and one button
   in the row is no noise. Hidden until the pointer came, it was not found. */
.${F} .${B} {
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
.${F} .${B}:hover,
.${F} .${B}[aria-expanded="true"] {
  color: var(--rdw-text);
}
/* Every group once more, unseen: by these it is counted how many fit the row. */
.${V} {
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  visibility: hidden;
  pointer-events: none;
  height: 0;
  overflow: hidden;
}
.${V} > * {
  flex: none;
}
.${fe} {
  display: inline-flex;
  align-items: center;
  margin-left: auto;
  padding-bottom: 2px;
}
/* While a card is carried, the tabs that take it say so, and the one under
   it comes forward; the tab that took it nods once. */
.${z} .${L} {
  border-bottom-style: dashed;
  border-bottom-color: var(--rdw-accent);
  animation: rdw-groups-wait 900ms ease-in-out infinite alternate;
}
.${z} .${L} .${P} {
  color: var(--rdw-text);
}
.${z} .${L}.${de} {
  border-bottom-style: solid;
  background: var(--rdw-accent-soft);
  box-shadow: 0 0 0 6px var(--rdw-accent-soft);
  border-radius: var(--rdw-radius-s);
  transform: scale(1.08);
  animation: none;
}
.${R} {
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
  .${F},
  .${z} .${L},
  .${R} {
    animation: none;
    transition: none;
  }
}
.${ve} {
  position: relative;
  display: inline-flex;
}
`,Te=`
.${Y} {
  padding: 4px;
  gap: 0;
}
/*
 * An own page hides everything of the body but itself, so a menu drawn in the
 * body would not be seen there: it is drawn under its button instead, as the
 * dialogs and the lists of an own page are drawn inside the page.
 */
.${Y}.${Q} {
  top: calc(100% + 4px);
  left: 0;
  box-sizing: border-box;
  width: max-content;
  min-width: ${String(Ce)}px;
  max-width: ${String(Se)}px;
}
.${Y}.${Q}.${ge} {
  left: auto;
  right: 0;
}
.${X} {
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
.${X} > span:first-of-type {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.${H} {
  display: grid;
  gap: 4px;
  min-width: 0;
}
.${U} {
  display: grid;
  max-height: 320px;
  overflow-y: auto;
}
.${W} {
  flex: none;
  color: var(--rdw-muted);
}
.${G} {
  margin: 0;
  padding: 6px 8px;
  color: var(--rdw-muted);
}
.${X}:hover:not(:disabled),
.${X}:focus-visible {
  background: var(--rdw-surface-2);
}
.${X}:disabled {
  cursor: default;
  font-weight: 600;
}
.${X}[data-tone="danger"] {
  color: var(--rdw-danger);
}
.${_e} {
  flex: none;
  display: inline-flex;
  color: var(--rdw-accent);
}
.${Z} {
  height: 1px;
  margin: 4px 0;
  background: var(--rdw-border);
}
`,Ee=`
.${ye} {
  display: grid;
  gap: 8px;
  min-width: 260px;
}
.${K} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 11px;
  text-align: right;
}
.${be} {
  margin: 0;
  color: var(--rdw-danger);
  font-size: 12px;
}
.${xe} {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
`;function De(e,t){let n=new Map;for(let e of t)e!==void 0&&e.length>0&&n.set(e,(n.get(e)??0)+1);return e.map(e=>({name:e,count:n.get(e)??0}))}function Oe(e,t){if(t===``)return  true;let n=e??``;return t===`\0none`?n.length===0:n===t}function ke(e){return e.length>20?`${e.slice(0,20)}${A}`:e}function Ae(e,t,n,r,i){let a=e.map((e,t)=>t);if(e.reduce((e,t)=>e+t+i,0)<=n)return a;let o=n-r-i,s=[];for(let t of a){let n=(e[t]??0)+i;if(n>o)break;s.push(t),o-=n;}if(t>=0&&t<e.length&&!s.includes(t)){let n=(e[t]??0)+i;for(;s.length>0&&o<n;){let t=s.pop();o+=(t===void 0?0:e[t]??0)+i;}s.push(t);}return s}function je(e){let[t,r]=z$1(``),o=V$1(null),s=V$1(null),{searchable:c}=e;B$1(()=>{if(c){s.current?.focus();return}let e=o.current?.querySelector(q);e instanceof HTMLElement&&e.focus();},[c]);let l=t.trim().toLowerCase(),u=l.length===0?e.entries:e.entries.filter(e=>e.label.toLowerCase().includes(l));return K$1(`div`,{className:H,ref:o,onKeyDown:e=>{let t=o.current;if(t===null)return;if(e.key===ue&&e.target instanceof HTMLInputElement){let n=t.querySelector(`.${U} ${q}`);n instanceof HTMLElement&&(e.preventDefault(),n.click());return}let n=e.key===le?1:e.key===M?-1:0;if(n===0)return;let r=[...t.querySelectorAll(J)];if(r.length===0)return;let i=r[((e.target instanceof Element?r.indexOf(e.target):-1)+n+r.length)%r.length];i instanceof HTMLElement&&(e.preventDefault(),i.focus());},children:[c?K$1(Kt,{value:t,placeholder:O,"aria-label":O,inputRef:s,onChange:r}):null,K$1(`div`,{className:U,children:[u.map(e=>K$1(`button`,{type:`button`,role:`menuitem`,className:`${X} rdw-kit-focusable`,disabled:e.current===true,onClick:e.onPick,children:[K$1(`span`,{children:e.label}),e.count===void 0?null:K$1(`span`,{className:W,children:String(e.count)}),e.current===true?K$1(`span`,{className:_e,"aria-hidden":`true`,children:K$1(ft,{size:$})}):null]},e.key)),u.length===0&&l.length>0?K$1(`p`,{className:G,children:k}):null]}),e.children]})}function Me(a){let[u,m]=z$1(null),[h,y]=z$1(null),[b,x]=z$1(null),[S,oe]=z$1(null),[C,w]=z$1(false),T=V$1(null),E=V$1(null),D=V$1(null),O=ze$1(Wt),k=V$1(null);k.current=h?.anchor??null;let A=a.dragging===true;B$1(()=>{A||m(null);},[A]);let le=a.groups.reduce((e,t)=>e+t.count,0),M=a.groups.map(e=>`${e.name}\u0000${String(e.count)}`).join(``),{value:ue,total:H}=a;Ie$1(()=>{let e=T.current,t=E.current;if(e===null||t===null)return;let n=()=>{let n=M.length===0?[]:M.split(``).map(e=>e.split(`\0`)[0]??``),r=[...t.querySelectorAll(`[data-measure]`)].map(e=>e instanceof HTMLElement?e.offsetWidth:0),i=t.querySelector(`[data-measure-more]`),a=e.clientWidth;for(let t of e.querySelectorAll(`[data-fixed]`))a-=(t instanceof HTMLElement?t.offsetWidth:0)+j;let o=e.clientWidth===0?r.map((e,t)=>t):Ae(r,n.indexOf(ue),a,i instanceof HTMLElement?i.offsetWidth:0,j),s=o.length===n.length?null:o.map(e=>n[e]??``);oe(e=>(e===null?``:e.join(``))===(s===null?``:s.join(``))&&e===null==(s===null)?e:s);};n(),window.addEventListener(ce,n);let r=typeof ResizeObserver>`u`?null:new ResizeObserver(n);return r?.observe(e),()=>{window.removeEventListener(ce,n),r?.disconnect();}},[M,ue,H]);let U=S===null?a.groups:S.flatMap(e=>a.groups.filter(t=>t.name===e)),W=S===null?[]:a.groups.filter(e=>!S.includes(e.name)),G=(e,t)=>A&&a.onDropTo!==void 0?{onDragOver:t=>{t.preventDefault();let n=t.dataTransfer??void 0;n!==void 0&&(n.dropEffect=`move`),m(e);},onDragLeave:()=>{m(t=>t===e?null:t);},onDrop:n=>{n.preventDefault(),m(null),x(e),a.onDropTo?.(t);}}:{},K=(e,t,r)=>K$1(`button`,{type:`button`,role:`tab`,className:`${P} rdw-kit-focusable`,"aria-selected":a.value===e,...ke(t)===t?{}:{title:t},onClick:()=>{a.onChange(e);},children:[ke(t),K$1(`span`,{className:I,children:String(r)})]}),q=e=>[F,L,u===e?de:``,b===e?R:``].filter(e=>e.length>0).join(` `),J=e=>b===e?{onAnimationEnd:()=>{x(null);}}:{},Z=e=>{let t=e.key===he?1:e.key===me?-1:0,n=e.target;if(t===0||!(n instanceof HTMLElement)||!n.matches(pe))return;let r=e.currentTarget;if(!(r instanceof HTMLElement))return;let i=[...r.querySelectorAll(pe)],a=i[i.indexOf(n)+t];a instanceof HTMLElement&&(e.preventDefault(),a.focus(),a.click());},ge=e=>K$1(zn,{open:true,onClose:()=>{y(null);},anchorRef:k,...O?{}:{widthPx:Ce},role:`menu`,"aria-label":`${ne}${e}`,className:O?`${Y} ${Q}`:Y,children:[K$1(`style`,{children:Te}),K$1(`button`,{type:`button`,role:`menuitem`,className:`${X} rdw-kit-focusable`,onClick:()=>{y(null),a.onRename(e);},children:K$1(`span`,{children:ie})}),K$1(`button`,{type:`button`,role:`menuitem`,className:`${X} rdw-kit-focusable`,"data-tone":`danger`,onClick:()=>{y(null),a.onDelete(e);},children:K$1(`span`,{children:ae})})]});return K$1(`div`,{className:A?`${N} ${z}`:N,ref:T,role:`tablist`,"aria-label":ee,onKeyDown:Z,...a.locked===true?{inert:true}:{},children:[K$1(`style`,{children:we}),K$1(`span`,{className:V,ref:E,"aria-hidden":`true`,children:[a.groups.map(e=>K$1(`span`,{className:P,"data-measure":``,children:[ke(e.name),K$1(`span`,{className:I,children:String(e.count)})]},e.name)),K$1(`span`,{className:P,"data-measure-more":``,children:[`${se} (${String(a.groups.length)})`,K$1(mt,{size:$})]})]}),K$1(`span`,{className:F,"data-selected":String(a.value===``),"data-fixed":``,children:K(``,`All`,a.total)}),U.map(e=>K$1(`span`,{className:q(e.name),"data-selected":String(a.value===e.name),"data-group":e.name,onContextMenu:t=>{t.preventDefault();let n=t.currentTarget;y({name:e.name,anchor:n});},...G(e.name,e.name),...J(e.name),children:[K(e.name,e.name,e.count),a.value===e.name?K$1(Tn,{className:B,label:re,menuOpen:h?.name===e.name,onClick:t=>{let n=t.currentTarget;y(t=>t?.name===e.name?null:{name:e.name,anchor:n});},children:K$1(Dt,{size:$})}):null,h?.name===e.name?ge(e.name):null]},e.name)),W.length>0?K$1(`span`,{className:F,"data-selected":`false`,"data-more":``,children:[K$1(`button`,{type:`button`,className:`${P} rdw-kit-focusable`,"aria-haspopup":`menu`,"aria-expanded":C,ref:D,onClick:()=>{w(e=>!e);},children:[`${se} (${String(W.length)})`,K$1(mt,{size:$})]}),C?K$1(zn,{open:true,onClose:()=>{w(false);},anchorRef:D,...O?{}:{widthPx:Se},role:`menu`,"aria-label":ee,className:O?`${Y} ${Q}`:Y,children:[K$1(`style`,{children:Te}),K$1(je,{searchable:a.groups.length>10,entries:W.map(e=>({key:e.name,label:e.name,count:e.count,onPick:()=>{w(false),a.onChange(e.name);}}))})]}):null]}):null,a.groups.length>0?K$1(`span`,{className:q(_),"data-selected":String(a.value===_),"data-fixed":``,"data-none":``,...G(_,null),...J(_),children:K(_,v,a.total-le)}):null,K$1(`span`,{className:fe,"data-fixed":``,children:K$1(q$1,{variant:`ghost`,onClick:a.onNew,children:[K$1(dt,{size:$}),te]})})]})}function Ne(e){let[i,l]=z$1(false),u=ze$1(Wt),m=V$1(null),h=e.current??``,g=e=>{l(false),e();},_=()=>{l(e=>!e);};return K$1(`span`,{className:ve,children:[e.iconLabel===void 0?K$1(q$1,{variant:`secondary`,disabled:e.disabled===true,buttonRef:m,onClick:_,children:[b,K$1(mt,{size:$})]}):K$1(Tn,{label:e.iconLabel,menuOpen:i,disabled:e.disabled===true,buttonRef:m,onClick:_,children:K$1(Pe,{})}),K$1(zn,{open:i,onClose:()=>{l(false);},anchorRef:m,...u?{}:{widthPx:Se,alignEnd:true},role:`menu`,"aria-label":b,className:u?`${Y} ${Q} ${ge}`:Y,children:[K$1(`style`,{children:Te}),K$1(je,{searchable:e.groups.length>10,entries:e.groups.map(t=>({key:t,label:t,current:t===h,onPick:()=>{g(()=>{e.onMove(t);});}})),children:[e.groups.length>0?K$1(`div`,{className:Z,"aria-hidden":`true`}):null,e.groups.length>0?K$1(`button`,{type:`button`,role:`menuitem`,className:`${X} rdw-kit-focusable`,disabled:e.current!==void 0&&h.length===0,onClick:()=>{g(()=>{e.onMove(null);});},children:[K$1(`span`,{children:v}),e.current!==void 0&&h.length===0?K$1(`span`,{className:_e,"aria-hidden":`true`,children:K$1(ft,{size:$})}):null]}):null,K$1(`button`,{type:`button`,role:`menuitem`,className:`${X} rdw-kit-focusable`,onClick:()=>{g(e.onNew);},children:K$1(`span`,{children:y})})]},String(i))]})]})}function Pe(){return K$1(`svg`,{width:$,height:$,viewBox:`0 0 24 24`,fill:`none`,stroke:`currentColor`,"stroke-width":`2`,"stroke-linecap":`round`,"stroke-linejoin":`round`,"aria-hidden":`true`,children:[K$1(`path`,{d:`M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z`}),K$1(`path`,{d:`M10 13h6`}),K$1(`path`,{d:`M13.5 10.5 16 13l-2.5 2.5`})]})}function Fe(e,t,n){let r=`Delete the group “${e}”?`;return n===0?`${r} Nothing is in it.`:`${r} Its ${t} ${n===1?`goes`:`go`} to ${v}; nothing else is deleted.`}function Ie(e){let{request:t}=e,[a,o]=z$1(``),s=t!==null&&t.kind!==`delete`,c=t!==null&&t.kind===`rename`?t.name:``;B$1(()=>{s&&o(c);},[s,c]);let l=a.trim(),d=l.length>0&&l!==c&&e.groups.includes(l),p=l.length>0&&l!==c&&!d,g=()=>{p&&t!==null&&(t.kind===`new`?e.onCreate(l,t.targets):t.kind===`rename`&&e.onRename(t.name,l));};return K$1(A$1,{children:[K$1(xn,{open:s,title:t!==null&&t.kind===`rename`?x:te,onClose:e.onClose,children:[K$1(`style`,{children:Ee}),K$1(`form`,{className:ye,onSubmit:e=>{e.preventDefault(),g();},children:[K$1(Kt,{value:a,placeholder:C,"aria-label":C,inputAttrs:{maxLength:40},onChange:e=>{o(e.slice(0,40));}}),K$1(`p`,{className:K,children:`${String(a.length)} / 40`}),d?K$1(`p`,{className:be,role:`alert`,children:D}):null,K$1(`div`,{className:xe,children:[K$1(q$1,{type:`button`,variant:`secondary`,size:`s`,onClick:e.onClose,children:E}),K$1(q$1,{type:`submit`,variant:`primary`,size:`s`,disabled:!p,children:t!==null&&t.kind===`rename`?T:w})]})]})]}),K$1(xn,{variant:`confirm`,open:t!==null&&t.kind===`delete`,title:oe,message:t!==null&&t.kind===`delete`?Fe(t.name,e.countLabel(t.count),t.count):``,confirmLabel:S,cancelLabel:E,confirmTone:`danger`,onConfirm:()=>{t!==null&&t.kind===`delete`&&e.onDelete(t.name);},onClose:e.onClose})]})}var Le=/[\s,]+/,Re=/,/; exports({L:Le,R:Re});function ze(e,t){return e.toLowerCase().split(t).map(e=>e.trim()).filter(e=>e.length>0)}function Be(e,t){if(t.length===0)return  true;let n=e.map(e=>e.toLowerCase());return t.some(e=>n.some(t=>t.includes(e)))}})}}));
System.register("./stats-section-CE3Lk5Tt-BP3atnGY.js", ['./app-C96QXzu_-Dg1SKPru.js','./___monkey.entry.js','./format-date-CpY7IdAY-BzMD4ndT.js'],(function(exports){'use strict';var K$1,ct$1,z$1,B$1,q$1,g$1,fc,dt$1,bs,G$1,Ga,Nc,A$1,E$1,N$1,T$1,Pc,D$1,be$1,ie,ce$1,n,r;return{setters:[function(module){K$1=module.K;ct$1=module.c;z$1=module.z;B$1=module.B;q$1=module.q;g$1=module.aO;fc=module.aP;},function(module){dt$1=module.bY;bs=module.e;G$1=module.c;Ga=module.dl;Nc=module.g;A$1=module.a;E$1=module.E;N$1=module.N;T$1=module.T;Pc=module.P;D$1=module.D;be$1=module.Z;ie=module.C;ce$1=module.M;},function(module){n=module.n;r=module.r;}],execute:(function(){exports("StatsPage",ft);var h=`profile-stats`,ce=1500,g=`account`,le=`home`,ue=`profile`,_=`div#user-index h4 > a[href*="s=profile"]`,de=`table.highlightable tr`,fe=`:scope > td`,pe=/^\d{4}-\d{2}-\d{2}$/,me=/^\d+$/,he=`Join Date`,ge=`Level`,v=`Posts`,_e=`Deleted Posts`,ve=`Comments`,ye=`Tag Edits`,be=`Note Edits`,xe=`Forum Posts`,Se=`No profile link on My Account. Log in to the site first.`,Ce=`The profile page has no table to read.`,y=N$1(D$1()),b=A$1({joinDate:N$1(T$1()),level:N$1(T$1()),posts:y,deletedPosts:y,comments:y,tagEdits:y,noteEdits:y,forumPosts:y,readAt:E$1()});function x(){let e=b.safeParse(Nc(h));return e.success?e.data:null}function we(){return `${ie}?${ce$1}=${g}&s=${le}`}function Te(e,t){let n=e.querySelector(_)?.getAttribute(`href`);if(n==null)return null;let r;try{r=new URL(n,t);}catch{return null}return r.origin!==new URL(t).origin||r.searchParams.get(`page`)!==g||r.searchParams.get(`s`)!==ue?null:r.href}function S(e){return e!==void 0&&me.test(e)?Number(e):void 0}function C(e,t){let n=new Map;for(let t of e.querySelectorAll(de)){let e=t.querySelectorAll(fe),r=e[0]?.textContent?.trim(),i=e[1]?.textContent?.trim();r!==void 0&&i!==void 0&&r.length>0&&n.set(r,i);}if(n.size===0)return null;let r=n.get(he),i=n.get(ge),a={readAt:t};r!==void 0&&pe.test(r)&&(a.joinDate=r),i!==void 0&&i.length>0&&(a.level=i);let o={posts:S(n.get(v)),deletedPosts:S(n.get(_e)),comments:S(n.get(ve)),tagEdits:S(n.get(ye)),noteEdits:S(n.get(be)),forumPosts:S(n.get(xe))};return {...a,...w(o)}}function w(e){let t={};for(let[n,r]of Object.entries(e))r!==void 0&&(t[n]=r);return t}async function T(e){let t=await fetch(e,{method:`GET`,credentials:be$1});if(!t.ok)throw Error(`HTTP ${String(t.status)}`);return new DOMParser().parseFromString(await t.text(),`text/html`)}function E(e){return new Promise(t=>{window.setTimeout(t,e);})}async function D(){let e=window.location.href,t=Te(await T(we()),e);if(t===null)throw Error(Se);await E(ce);let n=C(await T(t),Date.now()),r=b.safeParse(n);if(n===null||!r.success)throw Error(Ce);return Pc(h,r.data),r.data}var O=`rdw-stats`,k=`rdw-stats-tiles`,A=`rdw-stats-tile`,j=`rdw-stats-value`,M=`rdw-stats-label`,N=`rdw-stats-chart`,P=`rdw-stats-heading`,F=`rdw-stats-top`,I=`rdw-stats-top-row`,L=`rdw-stats-top-bar`,R=`rdw-stats-top-fill`,z=`rdw-stats-hint`,B=`rdw-stats-top--plain`,V=`rdw-stats-skeleton`,H=`rdw-stats-skeleton-bar`,U=`rdw-stats-profile`,W=`rdw-stats-profile-head`,G=`rdw-stats-profile-side`,Ee=`en-US`,De=10,Oe=1024,ke=100,Ae=2,je=160,K=`rdw-stats-column`,q=`rdw-stats-foot`,Me=20,Ne=1100,J=18,Y=`rdw-stats-skeleton-pulse`,Pe=1200,Fe=.5,Ie=`custom`,Le=`dynamic`,Re=` · `,X=`Collections`,ze=`Collections by posts`,Be=`Collections show here once they hold posts or their count is known.`,Ve=`Top tags in favorites`,He=`Run Full resync in RuleDesk → Favorites to fill this: it reads the tags of your favorites.`,Z=20,Ue=`Counting the tags of your favorites`,We=`Site profile`,Ge=`Refresh profile`,Ke=`Reads your profile page on the site: two requests, a moment apart`,qe=`Reading…`,Je=`These numbers are read from your profile page when this page is opened.`;function Ye(e,t){return e===null||t-e.readAt>=9e5}var Xe=`Read on `,Ze=`Could not read the profile: `,Qe=`Since `,$e=`Level`,et=315576e5,Q=12,tt=`Counted from the script's own data in this browser, except the site profile. Seen posts keep only the newest marks.`,nt=`
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
`.trim();function rt(e,t){return `${$(e)} ${Ie}${Re}${$(t)} ${Le}`}function it(e,t){let n=0,r=0,i=new Set,a=[];for(let t of e.collections){let e;if(Ga(t)===`posts`){n+=1;let r=t.postIds??[];for(let e of r)i.add(e);e=r.length;}else r+=1,e=t.postCount?.value;e!==void 0&&e>0&&a.push({id:t.id,name:t.name,posts:e});}a.sort((e,t)=>t.posts-e.posts||e.name.localeCompare(t.name));let o=0;for(let t of Object.values(e.marks))t.seen===true&&(o+=1);let s=Math.ceil(JSON.stringify(e).length/Oe);return {tiles:[{label:`Followed artists`,value:e.artists.length},n+r===0?{label:X,value:0}:{label:X,value:n+r,detail:rt(n,r)},{label:`Posts in custom collections`,value:i.size},{label:`Favorites`,value:t},{label:`Seen posts`,value:o},{label:`Stored data`,value:s,unit:`KB`}],customCollections:n,dynamicCollections:r,topCollections:a.slice(0,De)}}function $(e){return e.toLocaleString(Ee)}function at(e){return e.collections.length===0?K$1(`p`,{className:z,children:Be}):K$1(`ol`,{className:`${F} ${B}`,children:e.collections.map(e=>K$1(`li`,{className:I,children:[K$1(`span`,{title:e.name,children:e.name}),K$1(`span`,{children:$(e.posts)})]},e.id))})}function ot(e,t){let n=Date.parse(`${e}T00:00:00Z`);if(Number.isNaN(n)||n>t)return null;let r=Math.floor((t-n)/et*Q),i=Math.floor(r/Q),a=r%Q,o=[];return i>0&&o.push(`${String(i)} ${i===1?`year`:`years`}`),a>0&&o.push(`${String(a)} ${a===1?`month`:`months`}`),o.length>0?o.join(` `):`under a month`}function st(e,t){let n=[],r$1=e.joinDate===void 0?null:ot(e.joinDate,t);if(r$1!==null&&e.joinDate!==void 0){let t=Date.parse(`${e.joinDate}T00:00:00`);n.push({label:r$1,text:`${Qe}${r(t)}`});}e.level!==void 0&&n.push({label:$e,text:e.level});let i=[[`Posts uploaded`,e.posts],[`Deleted posts`,e.deletedPosts],[`Comments`,e.comments],[`Tag edits`,e.tagEdits],[`Note edits`,e.noteEdits],[`Forum posts`,e.forumPosts]];for(let[e,t]of i)t!==void 0&&n.push({label:e,text:$(t)});return n}function ct(){return K$1(`div`,{className:`${F} ${V}`,role:`status`,"aria-label":Ue,children:Array.from({length:Z},(e,n)=>K$1(`div`,{children:K$1(`span`,{className:H})},n))})}function lt(){let[e,n]=z$1(null);B$1(()=>{let e=true;return g$1().then(t=>{let r=fc(t,bs(),Z);e&&n(r);}).catch(()=>{e&&n([]);}),()=>{e=false;}},[]);let a=e?.[0]?.count??0;return K$1(`div`,{className:N,children:[K$1(`p`,{className:P,children:Ve}),e===null?K$1(ct,{}):a===0?K$1(`p`,{className:z,children:He}):K$1(`ol`,{className:F,children:e.map(e=>K$1(`li`,{className:I,children:[K$1(`span`,{title:e.tag,children:e.tag.replaceAll(`_`,` `)}),K$1(`span`,{className:L,"aria-hidden":`true`,children:K$1(`span`,{className:R,style:{width:`${String(Math.max(Ae,Math.round(e.count/a*ke)))}%`}})}),K$1(`span`,{children:$(e.count)})]},e.tag))})]})}function ut(){let[e,a]=z$1(()=>x()),[o,s]=z$1(false),[c,l]=z$1(``),u=()=>{s(true),l(``),D().then(e=>{a(e);}).catch(e=>{l(e instanceof Error?e.message:String(e));}).finally(()=>{s(false);});};return B$1(()=>{Ye(x(),Date.now())&&u();},[]),K$1(`div`,{className:`${N} ${U}`,children:[K$1(`div`,{className:W,children:[K$1(`p`,{className:P,children:We}),K$1(`div`,{className:G,children:[e===null?null:K$1(`span`,{className:z,children:`${Xe}${n(e.readAt)}`}),K$1(q$1,{variant:`secondary`,size:`s`,title:Ke,disabled:o,onClick:u,children:o?qe:Ge})]})]}),c.length>0?K$1(`p`,{className:z,role:`status`,children:`${Ze}${c}`}):null,e===null?K$1(`p`,{className:z,children:Je}):K$1(`div`,{className:k,children:st(e,Date.now()).map(e=>K$1(`div`,{className:A,children:[K$1(`span`,{className:j,children:e.text}),K$1(`span`,{className:M,children:e.label})]},e.label))})]})}function dt(){let e=it(G$1(),bs().size);return K$1(`section`,{className:`rdw-section ${O}`,children:[K$1(`style`,{children:nt}),K$1(`div`,{className:K,children:[K$1(`div`,{className:k,children:e.tiles.map(e=>K$1(`div`,{className:A,children:[K$1(`span`,{className:j,children:e.unit===void 0?$(e.value):`${$(e.value)} ${e.unit}`}),K$1(`span`,{className:M,children:e.label}),e.detail===void 0?null:K$1(`span`,{className:M,children:e.detail})]},e.label))}),K$1(`div`,{className:N,children:[K$1(`p`,{className:P,children:ze}),K$1(at,{collections:e.topCollections})]}),K$1(ut,{})]}),K$1(`div`,{className:K,children:K$1(lt,{})}),K$1(`p`,{className:`${z} ${q}`,children:tt})]})}function ft(){return K$1(ct$1,{className:dt$1.pageCard,children:K$1(dt,{})})}})}}));
System.register("./format-date-CpY7IdAY-BzMD4ndT.js", [],(function(exports){'use strict';return{execute:(function(){exports({n:n,r:r});var e=`en-GB`;function t(t){return new Date(t).toLocaleDateString(e,{day:`numeric`,month:`short`,year:`numeric`})}function n(n){let r=new Date(n).toLocaleTimeString(e,{hour:`2-digit`,minute:`2-digit`,hour12:false});return `${t(n)}, ${r}`}function r(t){return new Date(t).toLocaleDateString(e,{month:`short`,year:`numeric`})}})}}));
System.register("./collection-detail-page-DPOpIfb7-qplz-zNu.js", ['./app-C96QXzu_-Dg1SKPru.js','./___monkey.entry.js'],(function(exports){'use strict';var z$1,jp,V$1,Le$1,Re$1,$e,K$1,A$1,Jr,q$1,Cn,xn,Kt,Mi,Wt,Gt,iI,dc,fc,Fe$1,mc,Js,Ke$1,cc,pc,Gs,Ks,Re$2,uc,ie,ce,ae,se,Mt;return{setters:[function(module){z$1=module.z;jp=module.an;V$1=module.V;Le$1=module.aQ;Re$1=module.w;$e=module.aR;K$1=module.K;A$1=module.A;Jr=module.ao;q$1=module.q;Cn=module.a;xn=module.l;Kt=module.j;Mi=module.aS;Wt=module.aT;Gt=module.aU;iI=module.aV;},function(module){dc=module.dC;fc=module.dD;Fe$1=module.bi;mc=module.cp;Js=module.bc;Ke$1=module.K;cc=module.dE;pc=module.dF;Gs=module.bF;Ks=module.bE;Re$2=module.dG;uc=module.dH;ie=module.C;ce=module.M;ae=module.cw;se=module.cx;Mt=module.dI;}],execute:(function(){exports("CollectionDetailPage",Xe);var b=200,x=4,S=12,C=8,w=8,me=1,T=1,E=0,D=`move`,O=`0.4`,k=`contain`,A=`lazy`,j=`rdw-fav-bulk-selected`,M=`rdw-fav-bulk-check`,N=`✓`,P=`2px`,F=`2px`,I=`1.25rem`,L=`0.25rem`,he=2,R=`0.75rem`,z=`#4c8bf5`,B=`#ffffff`,V=`rdw-collection-detail`,H=`rdw-collection-back`,U=`rdw-collection-heading`,W=`rdw-collection-name`,G=`rdw-collection-count`,K=`rdw-collection-actions`,q=`rdw-collection-grid`,J=`rdw-collection-cell`,Y=`rdw-collection-fallback`,ge=`rdw-collection-missing`,_e=`rdw-collection-dialog-form`,ve=`rdw-collection-dialog-actions`,ye=`← Collections`,be=`Shuffle`,xe=`Original order`,Se=`Select`,Ce=`Download all`,we=`Download selected`,Te=`Drag a post onto another to change the order.`,X=`rdw-collection-cell--dragging`,Z=`rdw-collection-cell--drop`,Ee=`rdw-collection-hint`,De=`Undo`,Oe=`Remove from collection`,Q=`#`,ke=`Post #`,Ae=`post`,je=`posts`,Me=`Removed `,Ne=`Collection not found.`,Pe=`No posts yet`,Fe=`Add posts with + on a thumbnail, and with Collections on the post page.`,Ie=`rdw-collection-rename-name`,Le=`Rename collection`,Re=`Delete collection`;function ze(e){return e.length===0?Fe$1.confirmDelete:`Delete the collection \u201c${e}\u201d? The posts stay on the site; the list of them is lost. This cannot be undone.`}var Be=`Collection posts`,Ve=`
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
`.trim();function He(e){return `${String(e)} ${e===T?Ae:je}`}function Ue(e){return `${Me}${String(e)} ${e===T?Ae:je}`}function We(e){return `${Q}${String(e)}`}function Ge(e,t){let n=e[String(t)];return n===void 0||n.length===0?null:n}function Ke(e){let t=mc(e);if(t===null)return null;let n=Js().find(t=>t.id===e);return n===void 0?null:{name:n.name,order:t,thumbs:n.thumbs??{},shuffled:n.shuffledOrder!==null&&n.shuffledOrder!==void 0}}function qe(e,t){let n=new URLSearchParams;return n.set(ce,ae),n.set(`s`,se),n.set(`id`,String(t)),`${ie}?${n.toString()}${Mt(e)}`}function Je(e){return e.button!==E||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey}function Ye(t){let[n,ee]=z$1(null),i=t.thumbUrl,o=i!==null&&n===i,s=V$1(i);s.current=i;let l=Re$1(()=>{ee(s.current);},[]),u=Re$1(e=>{e!==null&&e.addEventListener(`error`,l);},[l]),d=i!==null&&!o,f=t.drag,p=[J,t.selected?j:``,f?.draggingId===t.postId?X:``,f!==null&&f.overId===t.postId&&f.draggingId!==t.postId?Z:``].filter(e=>e.length>0).join(` `);return K$1(`a`,{className:p,href:qe(t.collectionId,t.postId),"aria-label":`${ke}${String(t.postId)}`,...t.selecting?{"aria-pressed":t.selected}:{},draggable:f!==null,onDragStart:e=>{f!==null&&(e.dataTransfer!==null&&(e.dataTransfer.effectAllowed=D),f.onStart(t.postId));},onDragOver:e=>{f!==null&&f.draggingId!==null&&(e.preventDefault(),f.onOver(t.postId));},onDrop:e=>{f!==null&&f.draggingId!==null&&(e.preventDefault(),f.onDrop(t.postId));},onDragEnd:()=>{f?.onEnd();},onClick:e=>{t.selecting&&!Je(e)&&(e.preventDefault(),t.onToggle(t.postId));},children:[d?K$1(`img`,{src:i,alt:``,loading:A,ref:u}):K$1(`span`,{className:Y,children:We(t.postId)}),t.selected?K$1(`span`,{className:M,"aria-hidden":`true`,children:N}):null]})}function $(){return K$1(`a`,{className:H,href:Ke$1,children:ye})}function Xe(d){let[p,h]=z$1(0),[g,_]=z$1(false);jp(g,H);let[v,y]=z$1(()=>new Set),[re,b]=z$1(false),[x,S]=z$1(``),[C,w]=z$1(false),[E,D]=z$1(null),O=V$1(null),k=V$1(0),[A,j]=z$1(null),[M,N]=z$1(null),P=Le$1(()=>Ke(d.collectionId),[d.collectionId,p]),F=Re$1(()=>{h(e=>e+1);},[]),I=Re$1(()=>{O.current=null,D(null);},[]),L=Re$1(()=>{let e=O.current;e!==null&&(uc(e.snapshot),O.current=null,D(null),h(e=>e+1));},[]);function he(e){if(e.posts.length===0)return;k.current+=1;let t={id:k.current,message:Ue(e.posts.length),snapshot:e};O.current=t,D(t);}let R={draggingId:A,overId:M,onStart:j,onOver:N,onDrop:e=>{A!==null&&pc(d.collectionId,A,e),j(null),N(null),F();},onEnd:()=>{j(null),N(null);}};function z(e,t){t.length===0||Wt()||Gt(e,{kind:`ids`,ids:t});}let B=$e();function H(){_(false),y(new Set);}function J(e){y(t=>{let n=new Set(t);return n.has(e)?n.delete(e):n.add(e),n});}function Y(){P!==null&&(S(P.name),b(true));}function ye(e){e.preventDefault();let t=x.trim();t.length<me||(Gs(d.collectionId,t),b(false),F());}function X(){w(false),Ks(d.collectionId)?iI(Re$2):F();}function Z(){if(v.size===0)return;let e=cc(d.collectionId,[...v]);H(),F(),e!==null&&he(e);}let Q=E===null?null:{label:De,onClick:L};return K$1(`div`,{className:V,"data-collection-id":d.collectionId,children:[K$1(`style`,{children:Ve}),P===null?K$1(A$1,{children:[K$1(`p`,{className:ge,children:Ne}),K$1($,{})]}):K$1(A$1,{children:[K$1($,{}),K$1(`div`,{className:U,children:[K$1(`h1`,{className:W,children:P.name}),K$1(`p`,{className:G,children:He(P.order.length)})]}),g?K$1(Jr,{count:v.size,onSelectAll:()=>{y(new Set(P.order));},onClear:()=>{y(new Set);},onCancel:H,danger:K$1(q$1,{variant:`danger-quiet`,disabled:v.size===0,onClick:Z,children:Oe}),children:B?K$1(q$1,{variant:`secondary`,disabled:v.size===0,onClick:()=>{z(P.name,P.order.filter(e=>v.has(e))),H();},children:we}):null}):K$1(`div`,{className:K,children:K$1(A$1,{children:[P.order.length>0?K$1(q$1,{variant:`secondary`,size:`s`,onClick:()=>{dc(d.collectionId),F();},children:be}):null,P.shuffled?K$1(q$1,{variant:`secondary`,size:`s`,onClick:()=>{fc(d.collectionId),F();},children:xe}):null,P.order.length>0?K$1(q$1,{variant:`secondary`,size:`s`,onClick:()=>{y(new Set),_(true);},children:Se}):null,B&&P.order.length>0?K$1(q$1,{variant:`secondary`,size:`s`,onClick:()=>{z(P.name,P.order);},children:Ce}):null,K$1(q$1,{variant:`secondary`,size:`s`,onClick:Y,children:Fe$1.rename}),K$1(q$1,{variant:`danger-quiet`,size:`s`,onClick:()=>{w(true);},children:Fe$1.delete})]})}),!g&&P.order.length>T?K$1(`p`,{className:Ee,children:Te}):null,P.order.length===0?K$1(Cn,{title:Pe,description:Fe}):K$1(`div`,{className:q,"aria-label":Be,children:P.order.map(t=>K$1(Ye,{postId:t,collectionId:d.collectionId,thumbUrl:Ge(P.thumbs,t),selecting:g,selected:v.has(t),onToggle:J,drag:g?null:R},t))}),K$1(xn,{open:re,onClose:()=>{b(false);},title:Fe$1.rename,"aria-label":Le,children:K$1(`form`,{className:_e,onSubmit:ye,children:[K$1(Kt,{id:Ie,label:Fe$1.nameLabel,value:x,onChange:S}),K$1(`div`,{className:ve,children:[K$1(q$1,{type:`button`,variant:`secondary`,size:`s`,onClick:()=>{b(false);},children:Fe$1.cancel}),K$1(q$1,{type:`submit`,variant:`primary`,size:`s`,children:Fe$1.save})]})]})}),K$1(xn,{variant:`confirm`,open:C,onClose:()=>{w(false);},title:Fe$1.delete,"aria-label":Re,message:ze(P===null?``:P.name),confirmLabel:Fe$1.delete,cancelLabel:Fe$1.cancel,confirmTone:`danger`,onConfirm:X})]}),K$1(Mi,{open:E!==null,message:E===null?``:E.message,onClose:I,...Q===null?{}:{action:Q}},E?.id)]})}})}}));
System.import("./___monkey.entry.js", "./");
