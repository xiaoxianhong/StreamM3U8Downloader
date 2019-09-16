/*
 *  This file is part of Stream Recorder <https://www.hlsloader.com/>
 */

'use strict';
(function() {
  const WebExtensions = navigator.userAgent.includes("Chrome") ? chrome : browser;
  const i18n = WebExtensions.i18n;
  const CMD_SETTING = "cmd_setting";
  let option = null;
  const checks = [];
  const radios = [];
  const init = function() {
    if (option) {
      checks.forEach(function(id) {
        if (option[id] != null) {
          const checkbox = document.getElementById(id);
          if (checkbox) {
            checkbox.checked = option[id];
          }
        }
      });
      radios.forEach(function(id) {
        if (option[id] != null) {
          const radio = document.querySelector('input[name="' + id + '"][value="' + option[id] + '"]');
          if (radio) {
            radio.checked = true;
          }
        }
        const label = document.querySelector("#" + id + "Container label");
        if (label) {
          label.innerHTML = i18n.getMessage(id);
        }
      });
    }
  };
  WebExtensions.runtime.sendMessage({cmd:CMD_SETTING, params:{operation:"get"}}, function(result) {
    option = result;
    init();
  });
  const start = function() {
    init();
    checks.forEach(function(id) {
      const checkbox = document.getElementById(id);
      if (checkbox) {
        checkbox.addEventListener("click", function(evt) {
          WebExtensions.runtime.sendMessage({cmd:CMD_SETTING, params:{operation:"set", key:id, value:checkbox.checked}});
        });
      }
    });
    radios.forEach(function(id) {
      const buttons = document.querySelectorAll('input[name="' + id + '"]');
      for (let i = 0, len = buttons.length; i < len; i++) {
        buttons[i].addEventListener("click", function(evt) {
          WebExtensions.runtime.sendMessage({cmd:CMD_SETTING, params:{operation:"set", key:id, value:parseInt(evt.target.value)}});
        });
      }
    });
  };
  document.addEventListener("DOMContentLoaded", start);
})();

