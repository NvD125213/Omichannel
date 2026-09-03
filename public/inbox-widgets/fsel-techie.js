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

  var AUTH_KEY = "omni_fsel_auth_" + config.websiteToken;
  var POLL_MS = 3000;

  var state = {
    open: false,
    showQuickReplies: true,
    sending: false,
    authToken: "",
    hasConversation: false,
    messages: [],
    error: "",
  };

  var pollTimer = null;

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

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function readStoredAuth() {
    try {
      return localStorage.getItem(AUTH_KEY) || "";
    } catch (error) {
      return "";
    }
  }

  function writeStoredAuth(token) {
    state.authToken = token || "";
    try {
      if (token) localStorage.setItem(AUTH_KEY, token);
      else localStorage.removeItem(AUTH_KEY);
    } catch (error) {
      /* ignore */
    }
  }

  function apiUrl(path) {
    var base = String(config.baseUrl || "").replace(/\/$/, "");
    var separator = path.indexOf("?") >= 0 ? "&" : "?";
    return (
      base +
      path +
      separator +
      "website_token=" +
      encodeURIComponent(config.websiteToken)
    );
  }

  function request(method, path, body) {
    var headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    if (state.authToken) headers["X-Auth-Token"] = state.authToken;

    return fetch(apiUrl(path), {
      method: method,
      headers: headers,
      body: body ? JSON.stringify(body) : undefined,
    }).then(function (response) {
      return response.text().then(function (text) {
        var data = null;
        if (text) {
          try {
            data = JSON.parse(text);
          } catch (error) {
            data = { raw: text };
          }
        }
        if (!response.ok) {
          var message =
            (data && (data.error || data.message)) ||
            "Yêu cầu thất bại (" + response.status + ")";
          var err = new Error(message);
          err.status = response.status;
          err.data = data;
          throw err;
        }
        return data;
      });
    });
  }

  function normalizeMessage(raw) {
    if (!raw || typeof raw !== "object") return null;
    var id = raw.id;
    var content = typeof raw.content === "string" ? raw.content.trim() : "";
    if (!content && !(raw.attachments && raw.attachments.length)) return null;

    var messageType = Number(raw.message_type);
    // 0 = visitor/incoming, 1 = agent/outgoing, 2 = activity
    if (messageType === 2) return null;

    return {
      id: id,
      content: content || "[Tệp đính kèm]",
      fromVisitor: messageType === 0,
      createdAt: raw.created_at
        ? new Date(
            typeof raw.created_at === "number"
              ? raw.created_at * 1000
              : raw.created_at,
          )
        : new Date(),
    };
  }

  function mergeMessages(list) {
    var map = {};
    state.messages.forEach(function (item) {
      map[String(item.id)] = item;
    });
    (list || []).forEach(function (item) {
      var normalized = normalizeMessage(item);
      if (!normalized) return;
      map[String(normalized.id)] = normalized;
    });
    state.messages = Object.keys(map)
      .map(function (key) {
        return map[key];
      })
      .sort(function (a, b) {
        return a.createdAt - b.createdAt;
      });
  }

  function extractAuthToken(data) {
    if (!data || typeof data !== "object") return "";
    return (
      data.auth_token ||
      data.authToken ||
      (data.config && (data.config.auth_token || data.config.authToken)) ||
      (data.website_channel_config &&
        (data.website_channel_config.auth_token ||
          data.website_channel_config.authToken)) ||
      ""
    );
  }

  function ensureSession() {
    if (state.authToken) return Promise.resolve(state.authToken);

    return request("POST", "/api/v1/widget/config", {}).then(function (data) {
      var token = extractAuthToken(data);
      if (!token) throw new Error("Không nhận được auth token từ Chatwoot.");
      writeStoredAuth(token);
      return token;
    });
  }

  function fetchMessages() {
    return request("GET", "/api/v1/widget/messages", null)
      .then(function (data) {
        var payload =
          (data && data.payload) ||
          (data && data.messages) ||
          (Array.isArray(data) ? data : []);
        if (payload && payload.length) {
          state.hasConversation = true;
          state.showQuickReplies = false;
        }
        mergeMessages(payload);
        state.error = "";
        renderMessages();
      })
      .catch(function (error) {
        if (error && error.status === 404) return;
        // Session hết hạn → tạo lại
        if (error && (error.status === 401 || error.status === 403)) {
          writeStoredAuth("");
        }
      });
  }

  function createConversation(content) {
    return request("POST", "/api/v1/widget/conversations", {
      contact: {
        name: "Khách truy cập",
      },
      message: {
        content: content,
        timestamp: new Date().toString(),
        referer_url: window.location.href,
      },
    }).then(function (data) {
      state.hasConversation = true;
      var messages = (data && data.messages) || [];
      mergeMessages(messages);
      if (!messages.length) {
        mergeMessages([
          {
            id: "local-" + Date.now(),
            content: content,
            message_type: 0,
            created_at: Math.floor(Date.now() / 1000),
          },
        ]);
      }
    });
  }

  function sendFollowUp(content) {
    return request("POST", "/api/v1/widget/messages", {
      message: {
        content: content,
        timestamp: new Date().toString(),
        referer_url: window.location.href,
      },
    }).then(function (data) {
      if (data) mergeMessages([data]);
      else {
        mergeMessages([
          {
            id: "local-" + Date.now(),
            content: content,
            message_type: 0,
            created_at: Math.floor(Date.now() / 1000),
          },
        ]);
      }
    });
  }

  function sendText(content) {
    var text = String(content || "").trim();
    if (!text || state.sending) return Promise.resolve();

    state.sending = true;
    state.showQuickReplies = false;
    state.error = "";
    render();

    return ensureSession()
      .then(function () {
        if (state.hasConversation) return sendFollowUp(text);
        return createConversation(text);
      })
      .then(function () {
        renderMessages();
        startPolling();
        return fetchMessages();
      })
      .catch(function (error) {
        state.error =
          (error && error.message) ||
          "Không gửi được tin nhắn. Kiểm tra allowed_domains / CORS.";
        render();
      })
      .then(function () {
        state.sending = false;
        render();
        focusInput();
      });
  }

  function startPolling() {
    stopPolling();
    if (!state.open) return;
    pollTimer = window.setInterval(function () {
      if (!state.open || !state.authToken) return;
      fetchMessages();
    }, POLL_MS);
  }

  function stopPolling() {
    if (pollTimer) {
      window.clearInterval(pollTimer);
      pollTimer = null;
    }
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
      ".omni-fsel-panel{width:360px;max-width:calc(100vw - 32px);height:min(32rem,calc(100dvh - 96px));display:flex;flex-direction:column;border:1px solid " +
      THEME.border +
      ";border-radius:20px;background:#fff;box-shadow:0 16px 40px rgba(110,133,250,.18),0 4px 12px rgba(26,36,86,.05);overflow:hidden;opacity:0;pointer-events:none;transform:translateY(8px);transition:opacity .2s ease,transform .2s ease}" +
      ".omni-fsel-panel.is-open{opacity:1;pointer-events:auto;transform:translateY(0)}" +
      ".omni-fsel-header{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid " +
      THEME.border +
      ";padding:12px 16px;background:linear-gradient(180deg,#fff 0%," +
      THEME.primarySurface +
      " 100%);flex-shrink:0}" +
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
      ";padding:16px;min-height:0;overflow:hidden}" +
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
      ".omni-fsel-message-area{flex:1;min-height:0;margin-top:8px;display:flex;flex-direction:column;overflow:hidden}" +
      ".omni-fsel-actions{display:grid;gap:8px;flex-shrink:0}" +
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
      ".omni-fsel-messages{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:10px;padding-right:2px}" +
      ".omni-fsel-msg{max-width:80%;border-radius:12px;padding:10px 12px;font-size:13px;font-weight:500;line-height:1.45;word-break:break-word}" +
      ".omni-fsel-msg.is-agent{align-self:flex-start;border:1px solid " +
      THEME.border +
      ";background:#fff;color:" +
      THEME.inkBody +
      ";box-shadow:0 2px 10px rgba(110,133,250,.12)}" +
      ".omni-fsel-msg.is-user{align-self:flex-end;background:" +
      THEME.primary +
      ";color:#fff;box-shadow:0 4px 14px rgba(110,133,250,.28)}" +
      ".omni-fsel-error{margin-top:8px;font-size:11px;font-weight:500;color:#c2410c;flex-shrink:0}" +
      ".omni-fsel-footer{flex-shrink:0;border-top:1px solid " +
      THEME.border +
      ";background:#fff;padding:12px 16px}" +
      ".omni-fsel-quota-wrap{min-height:16px;margin-bottom:8px}" +
      ".omni-fsel-quota{margin:0;text-align:center;font-size:11px;font-weight:500;color:" +
      THEME.muted +
      "}" +
      ".omni-fsel-quota.is-placeholder{visibility:hidden}" +
      ".omni-fsel-input-row{display:flex;gap:8px;align-items:center;margin:0}" +
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
      ".omni-fsel-input:disabled{opacity:.7;cursor:not-allowed}" +
      ".omni-fsel-send{width:36px;height:36px;border:0;border-radius:12px;background:" +
      THEME.primary +
      ";color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(110,133,250,.32);transition:filter .2s,transform .2s;flex-shrink:0}" +
      ".omni-fsel-send:hover{filter:brightness(.95)}" +
      ".omni-fsel-send:active{transform:scale(.95)}" +
      ".omni-fsel-send:disabled{opacity:.6;cursor:not-allowed;transform:none}" +
      ".omni-fsel-dock{display:flex;align-items:flex-end;justify-content:flex-end;gap:10px}" +
      ".omni-fsel-prompt{display:none;max-width:calc(100vw - 120px);border:1px solid " +
      THEME.border +
      ";background:#fff;border-radius:16px;padding:10px 14px;text-align:left;font-size:12px;font-weight:500;line-height:1.45;color:" +
      THEME.ink +
      ";cursor:pointer;box-shadow:0 8px 22px rgba(110,133,250,.14);transition:border-color .2s,box-shadow .2s}" +
      ".omni-fsel-prompt.is-visible{display:block}" +
      ".omni-fsel-prompt:hover{border-color:" +
      THEME.borderStrong +
      ";box-shadow:0 10px 28px rgba(110,133,250,.2)}" +
      ".omni-fsel-launcher{width:48px;height:48px;border:0;border-radius:999px;background:" +
      THEME.primary +
      ";color:#fff;box-shadow:0 12px 28px rgba(110,133,250,.38);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:transform .2s,box-shadow .2s;padding:0;overflow:hidden}" +
      ".omni-fsel-launcher:hover{transform:scale(1.05)}" +
      ".omni-fsel-launcher:active{transform:scale(.95)}" +
      ".omni-fsel-launcher.is-open{box-shadow:0 12px 28px rgba(110,133,250,.38),0 0 0 2px #fff,0 0 0 4px " +
      THEME.primarySurface +
      "}" +
      ".omni-fsel-launcher-logo{width:28px;height:28px;border-radius:999px;object-fit:cover;display:block}" +
      ".omni-fsel-icon{width:20px;height:20px;display:block}";
    document.head.appendChild(style);
  }

  var ICONS = {
    close:
      '<svg class="omni-fsel-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    send: '<svg class="omni-fsel-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>',
    chat: '<svg class="omni-fsel-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  };

  function renderQuickReplies(container) {
    container.innerHTML = "";
    if (
      !state.showQuickReplies ||
      !config.quickReplies ||
      !config.quickReplies.length
    ) {
      container.style.display = "none";
      return;
    }

    container.style.display = "grid";
    container.style.minHeight = messageAreaMinHeight();
    config.quickReplies.forEach(function (item) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "omni-fsel-action";
      button.textContent = item.label;
      button.addEventListener("click", function () {
        sendText(item.label);
      });
      container.appendChild(button);
    });
  }

  function renderMessages() {
    var root = document.getElementById(ROOT_ID);
    if (!root) return;
    var list = root.querySelector(".omni-fsel-messages");
    if (!list) return;

    var shouldShowThread = !state.showQuickReplies || state.messages.length > 0;
    list.style.display = shouldShowThread ? "flex" : "none";

    if (!shouldShowThread) {
      list.innerHTML = "";
      return;
    }

    var html = state.messages
      .map(function (message) {
        return (
          '<div class="omni-fsel-msg ' +
          (message.fromVisitor ? "is-user" : "is-agent") +
          '">' +
          escapeHtml(message.content) +
          "</div>"
        );
      })
      .join("");

    var nearBottom =
      list.scrollHeight - list.scrollTop - list.clientHeight < 48;
    list.innerHTML = html;
    if (nearBottom || state.sending) {
      list.scrollTop = list.scrollHeight;
    }
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

  function focusInput() {
    var input = document.querySelector("#" + ROOT_ID + " .omni-fsel-input");
    if (input && state.open && !state.sending) {
      window.setTimeout(function () {
        input.focus();
      }, 0);
    }
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
    var send = root.querySelector(".omni-fsel-send");
    var error = root.querySelector(".omni-fsel-error");

    if (panel) panel.classList.toggle("is-open", state.open);

    if (prompt) {
      var label = config.launcherPromptLabel || "Bạn có cần hỗ trợ gì không?";
      prompt.textContent = label;
      prompt.classList.toggle("is-visible", !state.open && !!label);
    }

    renderLauncherContent(launcher);
    if (actions) renderQuickReplies(actions);
    renderMessages();

    if (error) {
      error.textContent = state.error || "";
      error.style.display = state.error ? "block" : "none";
    }

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
      input.disabled = state.sending;
    }

    if (send) send.disabled = state.sending;
  }

  function setOpen(next) {
    state.open = !!next;
    render();
    if (state.open) {
      ensureSession()
        .then(function () {
          return fetchMessages();
        })
        .then(function () {
          startPolling();
          focusInput();
        })
        .catch(function (error) {
          state.error =
            (error && error.message) ||
            "Không kết nối được Chatwoot widget API.";
          render();
        });
    } else {
      stopPolling();
    }
  }

  function submitComposer(event) {
    if (event) event.preventDefault();
    var input = document.querySelector("#" + ROOT_ID + " .omni-fsel-input");
    if (!input) return;
    var value = input.value;
    input.value = "";
    sendText(value);
  }

  function mountWidget() {
    injectStyles();
    state.authToken = readStoredAuth();

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
      '<div class="omni-fsel-messages"></div>' +
      '<div class="omni-fsel-error" style="display:none"></div>' +
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
        setOpen(!state.open);
      });

    root
      .querySelector(".omni-fsel-prompt")
      .addEventListener("click", function () {
        setOpen(true);
      });

    root
      .querySelector(".omni-fsel-input-row")
      .addEventListener("submit", submitComposer);

    render();
  }

  mountWidget();
})();
