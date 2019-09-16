/*
 *  This file is part of Stream Recorder <https://www.hlsloader.com/>
 */

'use strict';
(function() {
  const _LOG_ = localStorage.log;
  const TRIAL = 100;
  const UA = navigator.userAgent;
  const WebExtensions = UA.includes("Chrome") ? chrome : browser;
  const manifest = WebExtensions.runtime.getManifest();
  const i18n = WebExtensions.i18n;
  const language = getLanguage();
  const isEdge = UA.includes("Edge");
  const isFirefox = !isEdge && UA.includes("Firefox");
  const isChrome = !isEdge && UA.includes("Chrome");
  const chromeVersion = isChrome && Number((UA.match(/Chrome\/(\d+)/) || [])[1] || 0) || 0;
  const opt_extraInfoSpec = chromeVersion < 72 ? ["blocking", "requestHeaders"] : ["blocking", "requestHeaders", "extraHeaders"];
  const supportedLanguages = ["ja"];
  const DISABLE_DOWNLOADING_FROM_YOUTUBE_REGEXP = /^https?:\/\/www\.youtube\.com\//;
  const SYSTEM_URL_REGEXP = /^https?:\/\/www\.hlsloader\.com\//;
  const LOADER_URL = "://www.hlsloader.com/" + (supportedLanguages.includes(language) ? language + "/" : "") + "rec.html";
  const M3U8_FILTER_REGEXP = /^[^\?#]+\.m3u8(#.*|\?.*|)$/;
  const CMD_GET_INFO = "cmd_get_info";
  const CMD_GET_TITLE = "cmd_get_title";
  const CMD_DOWNLOAD = "cmd_download";
  const CMD_SETTING = "cmd_setting";
  const CMD_FETCH = "cmd_fetch";
  const CMD_MODIFY_HEADERS = "cmd_modify_headers";
  const CMD_WATCH_HEADERS = "cmd_watch_headers";
  const WATCH_LIFETIME = 1000 * 60;
  const ACTION_BUTTON_PARAMS = {off:{title:"action_button_off", path:"action_off_19"}, enable:{title:"action_button_enable", path:"action_enable_19"}, capturing:{title:"action_button_capturing", path:"action_capturing_19"}, loader:{title:"action_button_loader", path:"action_loader_19"}};
  if (_LOG_) {
    console.log(...logGen(null, manifest.name, manifest.version + " start"));
  }
  const option = loadOption();
  if (_LOG_) {
    console.log(...logGen(null, "option", JSON.stringify(option)));
  }
  const tab2url = {};
  const frame2url = {};
  const videoLists = {};
  const watchRequest = {};
  const loaderTabs = {};
  const tabRelation = {};
  const captureTabs = {};
  const cookies = {};
  const additions = {};
  WebExtensions.webRequest.onBeforeRequest.addListener((details) => {
    if (_LOG_) {
      console.log(...logGen(details.tabId, "onBeforeRequest( main_frame )", details.url));
    }
    const tabId = details.tabId;
    const isLoaderTab = loaderTabs[tabId] && details.url.includes(LOADER_URL);
    if (isLoaderTab) {
    } else {
      deleteTabInfo(tabId);
    }
  }, {urls:["<all_urls>"], types:["main_frame"]}, []);
  WebExtensions.webRequest.onBeforeSendHeaders.addListener((details) => {
    let {requestHeaders} = details;
    const {url, tabId, type} = details;
    const watchReq = watchRequest[tabId];
    const isLoaderTab = loaderTabs[tabId] || details.initiator && details.initiator.startsWith("chrome-extension://");
    if (!isLoaderTab && cookies[tabId]) {
      if (type.match(/main_frame|sub_frame|xmlhttprequest|media|websocket/)) {
        const domain = (url.match(/https?:\/\/([^\/]+)/) || [])[1];
        if (domain && cookies[tabId][domain] !== undefined) {
          for (const header of requestHeaders) {
            if (header.name.toLowerCase() === "cookie") {
              cookies[tabId][domain] = header.value;
              break;
            }
          }
        }
      }
    }
    if (M3U8_FILTER_REGEXP.exec(url)) {
      additions[details.requestId] = requestHeaders;
    }
    if (type === "xmlhttprequest" && url.includes("hlsloader_promotion")) {
      return {cancel:true};
    }
    if (watchReq && url.includes(watchReq.targetString)) {
      const headers = {};
      for (const header of requestHeaders) {
        headers[header.name] = header.value;
      }
      if (_LOG_) {
        console.log(...logGen(tabId, "onBeforeSendHeaders( watch )", "find headers : " + JSON.stringify(headers)));
      }
      watchReq.sendResponse({url, headers});
      delete watchRequest[tabId];
    }
    if (isLoaderTab) {
      if (option.counter < TRIAL && url.includes("pagead2")) {
        return {cancel:true};
      }
      if (type === "xmlhttprequest") {
        let foundModifiedRequest = false;
        let modifiedHeaders = {};
        for (let i = 0, len = requestHeaders.length; i < len; i++) {
          if (requestHeaders[i].name.startsWith("LM_")) {
            foundModifiedRequest = true;
            break;
          }
        }
        const loaderInfo = loaderTabs[tabId];
        const refId = loaderInfo && loaderInfo.rootId >= 0 ? loaderInfo.rootId : tabId;
        if (cookies[refId]) {
          const domain = (url.match(/https?:\/\/([^\/]+)/) || [])[1];
          if (cookies[refId][domain]) {
            foundModifiedRequest = true;
            modifiedHeaders["Cookie"] = cookies[refId][domain];
          }
        }
        if (foundModifiedRequest) {
          let originalReqHeaders = [];
          for (let i = 0, len = requestHeaders.length; i < len; i++) {
            const r = requestHeaders[i];
            if (r.name.startsWith("LM_")) {
              modifiedHeaders[r.name.substr(3)] = r.value !== "null" ? r.value : null;
            } else {
              originalReqHeaders.push(r);
            }
          }
          requestHeaders = originalReqHeaders;
          const headerKeys = headersNameToLowerCase(requestHeaders);
          for (const key in modifiedHeaders) {
            const value = modifiedHeaders[key];
            const idx = headerKeys.indexOf(key.toLowerCase());
            if (idx >= 0) {
              if (requestHeaders[idx].value !== value) {
                if (_LOG_) {
                  console.log(...logGen(tabId, "onBeforeSendHeaders", "Modify requestHeaders => " + key + " : " + value));
                }
                if (value) {
                  requestHeaders[idx].value = value;
                } else {
                  if (_LOG_) {
                    console.log(...logGen(tabId, "onBeforeSendHeaders", "splice : " + key));
                  }
                  requestHeaders.splice(idx, 1);
                }
              }
            } else {
              if (value) {
                requestHeaders.push({name:key, value});
              }
            }
          }
        }
      }
    }
    return {requestHeaders};
  }, {urls:["<all_urls>"]}, opt_extraInfoSpec);
  WebExtensions.webRequest.onHeadersReceived.addListener((details) => {
    const {url, tabId, frameId, statusCode} = details;
    const flatUrl = getFlatUrl(url);
    const responseHeaders = details.responseHeaders;
    const isRedirect = statusCode >= 300 && statusCode < 400;
    const headerKeys = headersNameToLowerCase(responseHeaders);
    if (DISABLE_DOWNLOADING_FROM_YOUTUBE_REGEXP.exec(tab2url[tabId])) {
      return;
    }
    if (!url.startsWith("http")) {
      return;
    }
    if (isRedirect) {
      const locationIdx = headerKeys.indexOf("location");
      if (locationIdx >= 0) {
        const redirectUrl = responseHeaders[locationIdx].value;
        const list = videoLists[details.tabId];
        if (list) {
          for (const video of list) {
            if (video.url === url) {
              if (_LOG_) {
                console.log(...logGen(details.tabId, "onHeadersReceived", "videoList update : " + video.url.substr(0, 100) + " to " + redirectUrl.substr(0, 100)));
              }
              video.url = redirectUrl;
            }
          }
        }
        return;
      }
    }
    if (statusCode < 200 || statusCode >= 300) {
      return;
    }
    if (!frame2url[tabId]) {
      frame2url[tabId] = {};
    }
    if (!frame2url[tabId][details.frameId]) {
      frame2url[tabId][details.frameId] = details.url;
    }
    if (loaderTabs[tabId]) {
      return;
    }
    if (!videoLists[tabId]) {
      videoLists[tabId] = [];
    }
    const list = videoLists[tabId];
    const addition = additions[details.requestId];
    delete additions[details.requestId];
    for (const item of list) {
      if (item.url === url) {
        if (addition) {
          item.addition = addition;
        }
        return;
      }
    }
    const idx = headerKeys.indexOf("content-type");
    const contentType = idx >= 0 ? responseHeaders[idx].value.toLowerCase() : "";
    if (contentType.includes("mpegurl") || M3U8_FILTER_REGEXP.exec(url)) {
      if (_LOG_) {
        console.log(...logGen(tabId, "Found : " + url, ""));
      }
      const referer = frameId === 0 ? tab2url[tabId] : frame2url[tabId][frameId];
      list.push({url, contentType, referer, addition});
      updatePageActionButton(tabId);
      const domain = (url.match(/https?:\/\/([^\/]+)/) || [])[1];
      if (!cookies[tabId]) {
        cookies[tabId] = {};
      }
      if (!cookies[tabId][domain]) {
        cookies[tabId][domain] = "";
      }
      return;
    }
  }, {urls:["<all_urls>"]}, ["responseHeaders", "blocking"]);
  WebExtensions.browserAction.onClicked.addListener((tab) => {
    if (_LOG_) {
      console.log(...logGen(tab.id, "browserAction.onClicked", ""));
    }
    const tabId = tab.id;
    const url = tab2url[tabId];
    if (!url || !url.startsWith("http")) {
      return;
    }
    if (loaderTabs[tabId]) {
      return;
    }
    if (DISABLE_DOWNLOADING_FROM_YOUTUBE_REGEXP.exec(url)) {
      return;
    }
    if (tabRelation[tabId]) {
      WebExtensions.tabs.update(tabRelation[tabId].id, {active:true}, handleError("tabs.update.1"));
    } else {
      const list = videoLists[tabId];
      const protocol = url.startsWith("https://") ? "https" : "http";
      WebExtensions.tabs.create({url:protocol + LOADER_URL, index:tab.index + 1, active:true}, (newTab) => {
        if (!handleError("tabs.create")()) {
          loaderTabs[newTab.id] = {tabId:newTab.id, rootId:tabId, referer:url, list};
          tabRelation[tabId] = newTab;
          option.counter++;
          saveOption();
        }
      });
    }
  });
  WebExtensions.tabs.onUpdated.addListener((tabId, change, tab) => {
    if (change.status === "loading") {
      if (_LOG_) {
        console.log(...logGen(tabId, "tabs.onUpdated", tab.url));
      }
      let url = tab.url;
      if (!url.startsWith("http")) {
        return;
      }
      url = url.match(/[^#]+/)[0];
      if (tab2url[tabId] && tab2url[tabId] !== url && !url.includes(LOADER_URL)) {
        deleteTabInfo(tabId);
      }
      tab2url[tabId] = url;
      updatePageActionButton(tabId);
    }
  });
  WebExtensions.tabs.onRemoved.addListener((tabId) => {
    if (_LOG_) {
      console.log(...logGen(tabId, "tabs.onRemoved", "delete loaderTabs"));
    }
    const rootId = parseInt(deleteTabInfo(tabId));
    if (rootId >= 0) {
      WebExtensions.tabs.update(rootId, {active:true}, handleError("tabs.update.2"));
    }
  });
  WebExtensions.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const {cmd, params} = message;
    const tabId = sender.tab && sender.tab.id;
    if (_LOG_) {
      console.log(...logGen(tabId, "onMessage", JSON.stringify(message)));
    }
    if (cmd === CMD_GET_INFO) {
      const statistics = {version:manifest.version, counter:option.counter || 1, threshold:TRIAL};
      if (loaderTabs[tabId]) {
        const _tabInfo = loaderTabs[tabId];
        const {rootId} = _tabInfo;
        const referer = tab2url[rootId] || _tabInfo.referer;
        return sendResponse(Object.assign(_tabInfo, {referer, statistics}));
      } else {
        return sendResponse({statistics});
      }
    } else {
      if (cmd === CMD_GET_TITLE) {
        if (loaderTabs[tabId]) {
          const {rootId} = loaderTabs[tabId];
          if (rootId >= 0) {
            WebExtensions.tabs.sendMessage(rootId, {cmd:CMD_GET_TITLE, params:{}}, (pageInfo) => {
              if (handleError("tabs.sendMessage.1")()) {
                return sendResponse();
              }
              if (pageInfo && pageInfo.title) {
                loaderTabs[tabId].title = pageInfo.title;
              }
              sendResponse(pageInfo);
            });
            return true;
          }
        }
      } else {
        if (cmd === CMD_WATCH_HEADERS) {
          const {targetString} = params;
          if (watchRequest[tabId]) {
            watchRequest[tabId].sendResponse("error : busy calling on watch_headers");
          }
          watchRequest[tabId] = {targetString, sendResponse};
          setTimeout(() => {
            delete watchRequest[tabId];
          }, WATCH_LIFETIME);
          return true;
        } else {
          if (cmd === CMD_SETTING) {
            const {operation, key, value} = params;
            if (operation === "get") {
              return sendResponse(option);
            } else {
              if (operation === "set") {
                let assertedValue = value;
                if (key === "connectionCount") {
                  assertedValue = Math.min(6, Math.max(1, Number(value) || 3));
                }
                option[key] = assertedValue;
                saveOption();
              }
            }
          } else {
            if (cmd === "intercept") {
              const tabInfo = loaderTabs[tabId];
              if (tabInfo) {
                const rootId = tabInfo.rootId;
                if (tab2url[rootId] === tabInfo.referer) {
                  tabInfo.ignoreDisconnectOnce = true;
                  setTimeout(() => {
                    delete tabInfo.ignoreDisconnectOnce;
                  }, 3000);
                  WebExtensions.tabs.update(rootId, {active:true}, handleError("tabs.update.3"));
                  WebExtensions.tabs.executeScript(rootId, {code:"localStorage._intercept_=" + tabId + ";location.reload();", allFrames:true}, handleError("tabs.executeScript.1"));
                }
              }
            } else {
              if (cmd === "intercept_success") {
                const tabInfo = loaderTabs[tabId];
                if (tabInfo) {
                  const rootId = tabInfo.rootId;
                  if (tab2url[rootId] === tabInfo.referer) {
                    delete tabInfo.ignoreDisconnectOnce;
                    WebExtensions.tabs.executeScript(rootId, {code:"delete localStorage._intercept_;"}, handleError("tabs.executeScript.2"));
                  }
                }
              } else {
                if (cmd === "ondata") {
                  const {targetId} = params;
                  if (loaderTabs[targetId] && loaderTabs[targetId].rootId === tabId) {
                    WebExtensions.tabs.sendMessage(targetId, {cmd, params}, handleError("tabs.sendMessage.2"));
                  }
                }
              }
            }
          }
        }
      }
    }
    sendResponse();
  });
  function deleteTabInfo(tabId) {
    if (!tab2url[tabId]) {
      return;
    }
    if (_LOG_) {
      console.log(...logGen(tabId, "deleteTabInfo", ""));
    }
    let backTo = -1;
    delete videoLists[tabId];
    delete captureTabs[tabId];
    delete watchRequest[tabId];
    delete tab2url[tabId];
    delete frame2url[tabId];
    const isLoader = loaderTabs[tabId];
    if (isLoader) {
      const rootId = isLoader.rootId;
      backTo = rootId;
      delete loaderTabs[tabId];
      delete cookies[tabId];
      delete tabRelation[rootId];
      delete captureTabs[rootId];
      updatePageActionButton(rootId);
    } else {
      if (tabRelation[tabId]) {
        const loaderTabId = tabRelation[tabId].id;
        const loader = loaderTabs[loaderTabId];
        if (loader.ignoreDisconnectOnce) {
          delete loader.ignoreDisconnectOnce;
          captureTabs[tabId] = true;
          updatePageActionButton(tabId);
        } else {
          WebExtensions.tabs.sendMessage(loader.tabId, {cmd:"disconnect", params:{}}, handleError("tabs.sendMessage.3"));
          cookies[loaderTabId] = cookies[tabId];
          delete cookies[tabId];
          loader.rootId = -1;
          delete tabRelation[tabId];
        }
      }
    }
    return backTo;
  }
  function updatePageActionButton(tabId) {
    const isLoader = loaderTabs[tabId];
    const isCapturing = captureTabs[tabId];
    const list = videoLists[tabId];
    const stat = isLoader ? "loader" : isCapturing ? "capturing" : list && list.length ? "enable" : "off";
    if (_LOG_) {
      console.log(...logGen(null, "updatePageActionButton", stat));
    }
    const params = ACTION_BUTTON_PARAMS[stat];
    const title = i18n.getMessage(params.title);
    const path = "images/" + params.path + ".png";
    const actionButton = WebExtensions.browserAction;
    actionButton.setTitle({title, tabId});
    actionButton.setIcon({path, tabId});
  }
  function loadOption() {
    const i = localStorage.option;
    let o = {counter:0};
    try {
      if (i) {
        o = Object.assign(o, JSON.parse(i));
      }
      o.counter = Math.max(0, Math.floor(Number(o.counter) || 0));
      localStorage.option = JSON.stringify(o);
    } catch (e) {
    }
    return o;
  }
  function saveOption() {
    localStorage.option = JSON.stringify(option);
  }
  function logColor(tabId) {
    const _r = tabId % 64;
    return "color:#" + ((_r >> 4 & 3) << 22 | (_r >> 2 & 3) << 14 | (_r & 3) << 6 | 1048576).toString(16);
  }
  function logGen(tabId, eventName, message) {
    if (tabId) {
      return ["tabId %c" + tabId + "%c [" + eventName + "]%c " + message, logColor(tabId), "color:#f60b91", ""];
    } else {
      return ["%c%c[" + eventName + "]%c " + message, logColor(tabId), "color:#f60b91", ""];
    }
  }
  function getFlatUrl(url) {
    return url.replace(/^https?:/, "").replace(/[^A-Za-z0-9]/g, "X");
  }
  function getLanguage() {
    const language = i18n.getUILanguage();
    if (language.match(/zh.CN/)) {
      return "cn";
    }
    if (language.match(/zh.TW/)) {
      return "tw";
    }
    if (language.startsWith("zh")) {
      return "cn";
    }
    if (language.match(/pt.BR/)) {
      return "br";
    }
    if (language.startsWith("pt")) {
      return "pt";
    }
    return language.substr(0, 2);
  }
  function headersNameToLowerCase(headers) {
    const r = [];
    for (let i = 0, len = headers.length; i < len; i++) {
      r[i] = headers[i].name.toLowerCase();
    }
    return r;
  }
  function clearMemoryCache() {
    const onFlushed = function() {
      if (_LOG_) {
        console.log(...logGen(null, "clearMemoryCache", "In-memory cache flushed"));
      }
    };
    const onError = function(error) {
      if (_LOG_) {
        console.log(...logGen(null, "clearMemoryCache", "Error: " + error));
      }
    };
    const flushingCache = WebExtensions.webRequest.handlerBehaviorChanged();
    if (flushingCache) {
      flushingCache.then(onFlushed, onError).catch(onError);
    }
  }
  function handleError(label) {
    return () => {
      if (WebExtensions.runtime.lastError) {
        if (_LOG_) {
          console.error(...logGen(label, "chrome.runtime.lastError", WebExtensions.runtime.lastError.message));
        }
        return true;
      }
      return false;
    };
  }
  function throttle(func, wait) {
    var ctx, args, rtn, timeoutID;
    var last = 0;
    return function throttled() {
      ctx = this;
      args = arguments;
      var delta = new Date - last;
      if (!timeoutID) {
        if (delta >= wait) {
          call();
        } else {
          timeoutID = setTimeout(call, wait - delta);
        }
      }
      return rtn;
    };
    function call() {
      timeoutID = 0;
      last = +new Date;
      rtn = func.apply(ctx, args);
      ctx = null;
      args = null;
    }
  }
})();

