(function () {
  var config = window.__OMNICHANNEL_CHAT_WIDGET__;
  if (!config || !config.baseUrl || !config.websiteToken) {
    console.warn("[fsel-techie] Missing widget config.");
    return;
  }

  var ROOT_ID = "omni-fsel-techie-root";
  if (document.getElementById(ROOT_ID)) return;

  var THEME = {
    primary: config.primaryColor || "#6E85FA",
    primarySoft: "#EEF1FF",
    primarySurface: "#F5F7FF",
    ink: "#1A2456",
    inkBody: "#2B3674",
    muted: "#7B88B8",
    border: "#D4DCFA",
    borderStrong: "#B8C4F5",
  };

  var state = {
    open: false,
    chatting: false,
    showQuickReplies: true,
  };

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function formatTimestamp(date) {
    return (
      pad(date.getDate()) +
      "/" +
      pad(date.getMonth() + 1) +
      "/" +
      date.getFullYear() +
      " - " +
      pad(date.getHours()) +
      ":" +
      pad(date.getMinutes())
    );
  }

  function messageAreaMinHeight() {
    var count =
      config.quickReplies && config.quickReplies.length
        ? config.quickReplies.length
        : 0;
    if (!count) return "10rem";
    return Math.max(count * 2.65 + (count - 1) * 0.5, 10) + "rem";
  }

  function injectStyles() {
    if (document.getElementById("omni-fsel-techie-style")) return;
    var style = document.createElement("style");
    style.id = "omni-fsel-techie-style";
    style.textContent =
      "#" +
      ROOT_ID +
      "{position:fixed;right:20px;bottom:20px;z-index:2147483000;font-family:Inter,Segoe UI,Roboto,sans-serif;pointer-events:none}" +
      "#" +
      ROOT_ID +
      " .omni-fsel-dock{pointer-events:auto}" +
      "#" +
      ROOT_ID +
      " *{box-sizing:border-box}" +
      ".omni-fsel-stack{display:flex;flex-direction:column;align-items:flex-end;gap:16px}" +
      ".omni-fsel-panel{width:360px;max-width:calc(100vw - 32px);min-height:26rem;display:flex;flex-direction:column;border:1px solid " +
      THEME.border +
      ";border-radius:20px;background:#fff;box-shadow:0 16px 40px rgba(110,133,250,.18),0 4px 12px rgba(26,36,86,.05);overflow:hidden;opacity:0;pointer-events:none;transform:translateY(8px);transition:opacity .2s ease,transform .2s ease}" +
      ".omni-fsel-panel.is-open{opacity:1;pointer-events:auto;transform:translateY(0)}" +
      "#" +
      ROOT_ID +
      ".is-chatting .omni-fsel-panel{opacity:0;pointer-events:none;transform:translateY(8px)}" +
      ".omni-fsel-header{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid " +
      THEME.border +
      ";padding:12px 16px;background:linear-gradient(180deg,#fff 0%," +
      THEME.primarySurface +
      " 100%)}" +
      ".omni-fsel-title-wrap{display:flex;align-items:center;gap:10px;min-width:0}" +
      ".omni-fsel-logo-wrap{width:32px;height:32px;border-radius:999px;background:" +
      THEME.primarySoft +
      ";border:2px solid " +
      THEME.border +
      ";box-shadow:0 2px 8px rgba(110,133,250,.18);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0}" +
      ".omni-fsel-logo{width:32px;height:32px;object-fit:cover;display:block}" +
      ".omni-fsel-title{font-size:14px;font-weight:700;color:" +
      THEME.ink +
      ";letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
      ".omni-fsel-close{border:0;background:transparent;color:" +
      THEME.muted +
      ";width:28px;height:28px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0}" +
      ".omni-fsel-close:hover{background:" +
      THEME.primarySoft +
      "}" +
      ".omni-fsel-body{flex:1;display:flex;flex-direction:column;background:" +
      THEME.primarySurface +
      ";padding:16px;min-height:0}" +
      ".omni-fsel-message-block{max-width:80%;flex-shrink:0}" +
      ".omni-fsel-meta{display:flex;justify-content:space-between;gap:8px;font-size:11px;line-height:1;padding:0 12px;margin-bottom:4px}" +
      ".omni-fsel-meta strong{color:" +
      THEME.ink +
      ";font-weight:600}" +
      ".omni-fsel-meta span{color:" +
      THEME.muted +
      ";font-weight:500}" +
      ".omni-fsel-bubble{border:1px solid " +
      THEME.border +
      ";background:#fff;border-radius:12px;padding:10px 12px;font-size:14px;font-weight:500;line-height:1.45;color:" +
      THEME.inkBody +
      ";box-shadow:0 2px 10px rgba(110,133,250,.12)}" +
      ".omni-fsel-message-area{flex:1;min-height:0;margin-top:8px}" +
      ".omni-fsel-actions{display:grid;gap:8px}" +
      ".omni-fsel-action{border:1px solid " +
      THEME.border +
      ";background:#fff;border-radius:12px;padding:10px 12px;text-align:center;font-size:14px;font-weight:600;color:" +
      THEME.ink +
      ";cursor:pointer;box-shadow:0 2px 8px rgba(110,133,250,.08);transition:border-color .2s,background .2s,box-shadow .2s}" +
      ".omni-fsel-action:hover{border-color:" +
      THEME.borderStrong +
      ";background:" +
      THEME.primarySoft +
      ";box-shadow:0 4px 14px rgba(110,133,250,.18)}" +
      ".omni-fsel-footer{flex-shrink:0;border-top:1px solid " +
      THEME.border +
      ";background:#fff;padding:12px 16px}" +
      ".omni-fsel-quota-wrap{min-height:16px;margin-bottom:8px}" +
      ".omni-fsel-quota{margin:0;text-align:center;font-size:11px;font-weight:500;color:" +
      THEME.muted +
      "}" +
      ".omni-fsel-quota.is-placeholder{visibility:hidden}" +
      ".omni-fsel-input-row{display:flex;gap:8px;align-items:center}" +
      ".omni-fsel-input{flex:1;min-width:0;min-height:36px;height:36px;border:1px solid " +
      THEME.borderStrong +
      ";border-radius:12px;padding:8px 12px;font-size:12px;font-weight:500;color:" +
      THEME.inkBody +
      ";background:#fff;box-shadow:inset 0 1px 2px rgba(110,133,250,.07);outline:none;pointer-events:auto;caret-color:" +
      THEME.ink +
      "}" +
      ".omni-fsel-input::placeholder{color:" +
      THEME.muted +
      "}" +
      ".omni-fsel-input:focus{border-color:" +
      THEME.primary +
      ";box-shadow:0 0 0 3px rgba(110,133,250,.16)}" +
      ".omni-fsel-send{width:36px;height:36px;border:0;border-radius:12px;background:" +
      THEME.primary +
      ";color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(110,133,250,.32);transition:filter .2s,transform .2s;flex-shrink:0}" +
      ".omni-fsel-send:hover{filter:brightness(.95)}" +
      ".omni-fsel-send:active{transform:scale(.95)}" +
      ".omni-fsel-dock{display:flex;align-items:flex-end;justify-content:flex-end;gap:10px}" +
      ".omni-fsel-prompt{display:none;max-width:calc(100vw - 120px);border:1px solid " +
      THEME.border +
      ";background:#fff;border-radius:16px;padding:10px 14px;text-align:left;font-size:12px;font-weight:500;line-height:1.45;color:" +
      THEME.ink +
      ";cursor:pointer;box-shadow:0 8px 22px rgba(110,133,250,.14);transition:border-color .2s,box-shadow .2s}" +
      ".omni-fsel-prompt.is-visible{display:block}" +
      ".omni-fsel-launcher{width:48px;height:48px;border:0;border-radius:999px;background:" +
      THEME.primary +
      ";color:#fff;box-shadow:0 12px 28px rgba(110,133,250,.38);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:transform .2s,box-shadow .2s;padding:0;overflow:hidden}" +
      ".omni-fsel-launcher:hover{transform:scale(1.05)}" +
      ".omni-fsel-launcher:active{transform:scale(.95)}" +
      ".omni-fsel-launcher.is-open{box-shadow:0 12px 28px rgba(110,133,250,.38),0 0 0 2px #fff,0 0 0 4px " +
      THEME.primarySurface +
      "}" +
      ".omni-fsel-launcher-logo{width:28px;height:28px;border-radius:999px;object-fit:cover;display:block}" +
      ".omni-fsel-icon{width:20px;height:20px;display:block}" +
      ".woot-widget-bubble,.woot--bubble-holder{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}" +
      ".woot-widget-holder{z-index:2147483645!important;right:20px!important;bottom:84px!important;max-width:calc(100vw - 32px)!important}";
    document.head.appendChild(style);
  }

  var ICONS = {
    close:
      '<svg class="omni-fsel-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    send: '<svg class="omni-fsel-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>',
    chat: '<svg class="omni-fsel-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  };

  function withChatwoot(callback) {
    if (window.$chatwoot) {
      callback(window.$chatwoot);
      return true;
    }
    return false;
  }

  function openChatwoot() {
    var opened = withChatwoot(function (chatwoot) {
      if (typeof chatwoot.toggle === "function") chatwoot.toggle("open");
    });
    if (opened) return;

    window.addEventListener(
      "chatwoot:ready",
      function onReady() {
        withChatwoot(function (chatwoot) {
          if (typeof chatwoot.toggle === "function") chatwoot.toggle("open");
        });
      },
      { once: true },
    );
  }

  function closeChatwoot() {
    withChatwoot(function (chatwoot) {
      if (typeof chatwoot.toggle === "function") chatwoot.toggle("close");
    });
  }

  function startConversation() {
    state.showQuickReplies = false;
    state.chatting = true;
    state.open = true;
    render();
    openChatwoot();
  }

  function submitComposer() {
    var input = document.querySelector("#" + ROOT_ID + " .omni-fsel-input");
    if (input) input.blur();
    startConversation();
  }

  function renderQuickReplies(container) {
    container.innerHTML = "";
    container.style.minHeight = messageAreaMinHeight();

    if (
      !state.showQuickReplies ||
      !config.quickReplies ||
      !config.quickReplies.length
    ) {
      return;
    }

    config.quickReplies.forEach(function (item) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "omni-fsel-action";
      button.textContent = item.label;
      button.addEventListener("click", startConversation);
      container.appendChild(button);
    });
  }

  function renderLauncherContent(launcher) {
    if (!launcher) return;
    launcher.classList.toggle("is-open", state.open);
    launcher.innerHTML = "";

    if (state.open) {
      launcher.innerHTML = ICONS.close;
      launcher.setAttribute("aria-label", "Đóng khung chat");
      return;
    }

    if (config.logoUrl) {
      var img = document.createElement("img");
      img.className = "omni-fsel-launcher-logo";
      img.src = config.logoUrl;
      img.alt = "";
      launcher.appendChild(img);
    } else {
      launcher.innerHTML = ICONS.chat;
    }
    launcher.setAttribute("aria-label", "Mở khung chat");
  }

  function render() {
    var root = document.getElementById(ROOT_ID);
    if (!root) return;

    var panel = root.querySelector(".omni-fsel-panel");
    var launcher = root.querySelector(".omni-fsel-launcher");
    var prompt = root.querySelector(".omni-fsel-prompt");
    var actions = root.querySelector(".omni-fsel-actions");
    var quota = root.querySelector(".omni-fsel-quota");
    var quotaWrap = root.querySelector(".omni-fsel-quota-wrap");
    var input = root.querySelector(".omni-fsel-input");

    root.classList.toggle("is-chatting", state.chatting && state.open);
    if (panel) panel.classList.toggle("is-open", state.open && !state.chatting);

    if (prompt) {
      var label = config.launcherPromptLabel || "Bạn có cần hỗ trợ gì không?";
      prompt.textContent = label;
      prompt.classList.toggle("is-visible", !state.open && !!label);
    }

    renderLauncherContent(launcher);
    if (actions) renderQuickReplies(actions);

    if (quota && quotaWrap) {
      var showQuota = config.showUsageQuota && !state.showQuickReplies;
      quota.textContent = config.usageQuotaLabel || "";
      quota.classList.toggle(
        "is-placeholder",
        config.showUsageQuota && !showQuota,
      );
      quota.style.display = config.showUsageQuota ? "block" : "none";
      if (!config.showUsageQuota) {
        quotaWrap.style.minHeight = "0";
        quotaWrap.style.marginBottom = "0";
      }
    }

    if (input) {
      input.placeholder = state.showQuickReplies
        ? config.inputPlaceholder || "Nhập tin nhắn..."
        : config.inputPlaceholderWithActions ||
          config.inputPlaceholder ||
          "Nhập tin nhắn...";
      input.disabled = false;
      input.readOnly = false;
    }
  }

  function setOpen(next) {
    state.open = !!next;
    if (!state.open) {
      state.chatting = false;
      closeChatwoot();
    }
    render();
  }

  function mountWidget() {
    injectStyles();

    var root = document.createElement("div");
    root.id = ROOT_ID;

    root.innerHTML =
      '<div class="omni-fsel-stack">' +
      '<div class="omni-fsel-panel">' +
      '<div class="omni-fsel-header">' +
      '<div class="omni-fsel-title-wrap">' +
      '<div class="omni-fsel-logo-wrap">' +
      (config.logoUrl
        ? '<img class="omni-fsel-logo" src="' + config.logoUrl + '" alt="" />'
        : "") +
      "</div>" +
      '<div class="omni-fsel-title"></div>' +
      "</div>" +
      '<button type="button" class="omni-fsel-close" aria-label="Đóng">' +
      ICONS.close +
      "</button>" +
      "</div>" +
      '<div class="omni-fsel-body">' +
      '<div class="omni-fsel-message-block">' +
      '<div class="omni-fsel-meta"><strong class="omni-fsel-meta-name"></strong><span class="omni-fsel-meta-time"></span></div>' +
      '<div class="omni-fsel-bubble"></div>' +
      "</div>" +
      '<div class="omni-fsel-message-area">' +
      '<div class="omni-fsel-actions"></div>' +
      "</div>" +
      "</div>" +
      '<div class="omni-fsel-footer">' +
      '<div class="omni-fsel-quota-wrap"><p class="omni-fsel-quota"></p></div>' +
      '<form class="omni-fsel-input-row">' +
      '<input class="omni-fsel-input" type="text" autocomplete="off" enterkeyhint="send" />' +
      '<button type="submit" class="omni-fsel-send" aria-label="Gửi">' +
      ICONS.send +
      "</button>" +
      "</form>" +
      "</div>" +
      "</div>" +
      '<div class="omni-fsel-dock">' +
      '<button type="button" class="omni-fsel-prompt"></button>' +
      '<button type="button" class="omni-fsel-launcher" aria-label="Mở chat"></button>' +
      "</div>" +
      "</div>";

    document.body.appendChild(root);

    var assistantName = config.assistantName || "Trợ lý Techie";
    root.querySelector(".omni-fsel-title").textContent = assistantName;
    root.querySelector(".omni-fsel-meta-name").textContent = assistantName;
    root.querySelector(".omni-fsel-meta-time").textContent = formatTimestamp(
      new Date(),
    );
    root.querySelector(".omni-fsel-bubble").textContent =
      config.greetingMessage || "";

    root
      .querySelector(".omni-fsel-close")
      .addEventListener("click", function () {
        setOpen(false);
      });

    root
      .querySelector(".omni-fsel-launcher")
      .addEventListener("click", function () {
        if (state.open) {
          setOpen(false);
          return;
        }
        setOpen(true);
      });

    root
      .querySelector(".omni-fsel-prompt")
      .addEventListener("click", function () {
        setOpen(true);
      });

    root
      .querySelector(".omni-fsel-input-row")
      .addEventListener("submit", function (event) {
        event.preventDefault();
        submitComposer();
      });

    render();
  }

  function loadChatwootSdk() {
    window.chatwootSettings = Object.assign({}, window.chatwootSettings || {}, {
      hideMessageBubble: true,
      showPopoutButton: false,
    });

    function runSdk() {
      if (!window.chatwootSDK || typeof window.chatwootSDK.run !== "function") {
        console.warn("[fsel-techie] Chatwoot SDK unavailable.");
        return;
      }
      window.chatwootSDK.run({
        websiteToken: config.websiteToken,
        baseUrl: config.baseUrl,
      });
    }

    if (window.$chatwoot || window.chatwootSDK) {
      runSdk();
      return;
    }

    var existing = document.getElementById("omni-fsel-chatwoot-sdk");
    if (existing) {
      existing.addEventListener("load", runSdk);
      return;
    }

    var script = document.createElement("script");
    script.id = "omni-fsel-chatwoot-sdk";
    script.src = config.baseUrl + "/packs/js/sdk.js";
    script.async = true;
    script.onload = runSdk;
    document.head.appendChild(script);
  }

  mountWidget();
  loadChatwootSdk();
})();
