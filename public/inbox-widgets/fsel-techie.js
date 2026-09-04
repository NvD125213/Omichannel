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
  var SESSION_KEY = "omni_fsel_session_" + config.websiteToken;

  var initialGreeting = String(config.greetingMessage || "").trim();

  var state = {
    open: false,
    showQuickReplies: true,
    /** Lời chào chỉ hiện trước khi chọn persona / bắt đầu chat */
    showGreeting: Boolean(initialGreeting),
    sending: false,
    selectingPersona: false,
    loadingPersonas: false,
    /** Đã POST select + setUser xong — mới cho nhắn tin */
    chatReady: false,
    chatwootReady: false,
    authToken: "",
    pubsubToken: "",
    accountId: null,
    hasConversation: false,
    messages: [],
    error: "",
    cableConnected: false,
    showEmojiPanel: false,
    /** [{ id, label }] — ưu tiên từ GET personas */
    quickReplies: Array.isArray(config.quickReplies)
      ? config.quickReplies
          .map(function (item) {
            return {
              id:
                item && (item.id || item.persona_id)
                  ? String(item.id || item.persona_id)
                  : "",
              label:
                item && item.label ? String(item.label) : String(item || ""),
            };
          })
          .filter(function (item) {
            return item.label;
          })
      : [],
  };

  var cableSocket = null;
  var cableIdentifier = "";
  var presenceTimer = null;
  var reconnectTimer = null;
  var reconnectAttempt = 0;
  var fallbackPollTimers = [];
  var intentionalCableClose = false;
  var chatwootSdkPromise = null;
  var chatwootReadyPromise = null;

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function formatTimestamp(date) {
    var d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) d = new Date();
    return (
      pad(d.getDate()) +
      "/" +
      pad(d.getMonth() + 1) +
      "/" +
      d.getFullYear() +
      " - " +
      pad(d.getHours()) +
      ":" +
      pad(d.getMinutes())
    );
  }

  /** Reload = phiên mới: xóa token/session cũ, không khôi phục lịch sử. */
  function resetSessionForNewVisit() {
    disconnectCable(true);
    clearFallbackPolls();
    state.authToken = "";
    state.pubsubToken = "";
    state.accountId = null;
    state.hasConversation = false;
    state.messages = [];
    state.cableConnected = false;
    state.chatReady = false;
    try {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(SESSION_KEY);
    } catch (error) {
      /* ignore */
    }
  }

  function messageAreaMinHeight() {
    var count =
      state.quickReplies && state.quickReplies.length
        ? state.quickReplies.length
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
    // Không khôi phục auth qua reload — luôn phiên mới trong tab hiện tại.
    return state.authToken || "";
  }

  function writeStoredAuth(token) {
    state.authToken = token || "";
    // Chỉ giữ trong memory trong phiên trang; không persist để reload = chat mới.
  }

  function getClientSessionId() {
    if (state._clientSessionId) return state._clientSessionId;
    state._clientSessionId =
      "sess_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 10);
    return state._clientSessionId;
  }

  function omniApiBase() {
    return String(config.omniApiBaseUrl || "").replace(/\/$/, "");
  }

  function personaApiUrl(path) {
    var base = omniApiBase();
    if (!base) return "";
    return base + path;
  }

  function extractPersonaRecords(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (typeof payload !== "object") return [];

    var candidates = [
      payload.payload,
      payload.personas,
      payload.items,
      payload.results,
      payload.data,
    ];

    for (var i = 0; i < candidates.length; i++) {
      if (Array.isArray(candidates[i])) return candidates[i];
    }

    if (
      payload.data &&
      typeof payload.data === "object" &&
      !Array.isArray(payload.data)
    ) {
      var nested = payload.data;
      var nestedCandidates = [
        nested.payload,
        nested.personas,
        nested.items,
        nested.messaging && nested.messaging.payload,
      ];
      for (var j = 0; j < nestedCandidates.length; j++) {
        if (Array.isArray(nestedCandidates[j])) return nestedCandidates[j];
      }
    }

    return [];
  }

  function normalizePersona(raw, index) {
    if (!raw || typeof raw !== "object") return null;
    var id = String(
      raw.persona_id || raw.id || raw.uuid || raw.key || "",
    ).trim();
    var label = String(
      raw.name ||
        raw.label ||
        raw.title ||
        raw.available_name ||
        raw.display_name ||
        "",
    ).trim();
    if (!label) label = id ? "Đối tượng " + (index + 1) : "";
    if (!id && !label) return null;
    return {
      id: id || "persona-" + (index + 1),
      label: label,
    };
  }

  /** Tương đương useGetLiveChatPersonas */
  function fetchLiveChatPersonas() {
    var base = omniApiBase();
    if (!base || !config.websiteToken) {
      return Promise.resolve(state.quickReplies);
    }

    state.loadingPersonas = true;
    var url = personaApiUrl(
      "/public/live-chat/" +
        encodeURIComponent(config.websiteToken) +
        "/personas",
    );

    return fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })
      .then(function (response) {
        return response.text().then(function (text) {
          var data = null;
          if (text) {
            try {
              data = JSON.parse(text);
            } catch (error) {
              data = null;
            }
          }
          if (!response.ok) {
            throw new Error(
              (data && data.message) ||
                "Không tải được danh sách đối tượng (" + response.status + ")",
            );
          }
          return data;
        });
      })
      .then(function (body) {
        var records = extractPersonaRecords(body);
        if (!records.length && body && body.data != null) {
          records = extractPersonaRecords(body.data);
        }
        var personas = records.map(normalizePersona).filter(function (item) {
          return Boolean(item);
        });
        if (personas.length) {
          state.quickReplies = personas;
        }
        state.loadingPersonas = false;
        return state.quickReplies;
      })
      .catch(function (error) {
        state.loadingPersonas = false;
        console.warn("[fsel-techie] personas GET failed:", error);
        return state.quickReplies;
      });
  }

  /** Tương đương useSelectLiveChatPersona */
  function selectLiveChatPersona(persona) {
    var base = omniApiBase();
    if (!base || !config.websiteToken || !persona || !persona.id) {
      return Promise.resolve(null);
    }

    var url = personaApiUrl(
      "/public/live-chat/" +
        encodeURIComponent(config.websiteToken) +
        "/personas/select",
    );

    return fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        persona_id: String(persona.id),
        client_session_id: getClientSessionId(),
        meta: {
          label: persona.label || "",
          referer_url: window.location.href,
        },
      }),
    }).then(function (response) {
      return response.text().then(function (text) {
        var data = null;
        if (text) {
          try {
            data = JSON.parse(text);
          } catch (error) {
            data = null;
          }
        }
        if (!response.ok) {
          throw new Error(
            (data && data.message) ||
              "Không chọn được đối tượng (" + response.status + ")",
          );
        }
        return data;
      });
    });
  }

  function extractClientSessionId(payload) {
    if (!payload || typeof payload !== "object") return getClientSessionId();
    var nested =
      payload.data && typeof payload.data === "object" ? payload.data : null;
    var raw =
      payload.client_session_id ||
      payload.clientSessionId ||
      (nested && (nested.client_session_id || nested.clientSessionId)) ||
      "";
    if (raw && String(raw).trim()) {
      state._clientSessionId = String(raw).trim();
      return state._clientSessionId;
    }
    return getClientSessionId();
  }

  function hideChatwootDefaultUi() {
    if (document.getElementById("omni-fsel-hide-cw-style")) return;
    var style = document.createElement("style");
    style.id = "omni-fsel-hide-cw-style";
    style.textContent =
      ".woot-widget-bubble,.woot-widget-holder,.woot--bubble-holder," +
      "#cw-widget-holder,#woot-widget-holder{display:none!important;visibility:hidden!important;pointer-events:none!important}";
    document.head.appendChild(style);
  }

  /** Load Omni SDK (ẩn bubble) — phục vụ ready + setUser. */
  function ensureChatwootSdk() {
    if (chatwootSdkPromise) return chatwootSdkPromise;

    hideChatwootDefaultUi();

    chatwootSdkPromise = new Promise(function (resolve, reject) {
      var base = String(config.baseUrl || "").replace(/\/$/, "");
      if (!base || !config.websiteToken) {
        reject(new Error("Thiếu baseUrl/websiteToken để load Omni SDK."));
        return;
      }

      window.chatwootSettings = Object.assign(
        {},
        window.chatwootSettings || {},
        {
          hideMessageBubble: true,
          showUnreadMessagesDialog: false,
          position: "right",
        },
      );

      function runSdk() {
        try {
          if (
            window.chatwootSDK &&
            typeof window.chatwootSDK.run === "function"
          ) {
            window.chatwootSDK.run({
              websiteToken: config.websiteToken,
              baseUrl: base,
            });
          }
          resolve(window.$chatwoot || window.chatwootSDK);
        } catch (error) {
          reject(error);
        }
      }

      if (window.$chatwoot || (window.chatwootSDK && window.chatwootSDK.run)) {
        runSdk();
        return;
      }

      var existing = document.querySelector(
        'script[data-omni-fsel-chatwoot-sdk="1"]',
      );
      if (existing) {
        existing.addEventListener("load", runSdk);
        existing.addEventListener("error", function () {
          reject(new Error("Không tải được Omni SDK."));
        });
        return;
      }

      var script = document.createElement("script");
      script.src = base + "/packs/js/sdk.js";
      script.async = true;
      script.defer = true;
      script.dataset.omniFselChatwootSdk = "1";
      script.id = "omni-fsel-chatwoot-sdk";
      script.onload = runSdk;
      script.onerror = function () {
        reject(new Error("Không tải được Omni SDK."));
      };
      (document.head || document.body).appendChild(script);
    });

    return chatwootSdkPromise;
  }

  function waitForChatwootReady(timeoutMs) {
    if (state.chatwootReady && window.$chatwoot) {
      return Promise.resolve(window.$chatwoot);
    }
    if (chatwootReadyPromise) return chatwootReadyPromise;

    var timeout = typeof timeoutMs === "number" ? timeoutMs : 20000;

    chatwootReadyPromise = new Promise(function (resolve, reject) {
      if (state.chatwootReady && window.$chatwoot) {
        resolve(window.$chatwoot);
        return;
      }

      var settled = false;
      var timer = window.setTimeout(function () {
        if (settled) return;
        settled = true;
        window.removeEventListener("chatwoot:ready", onReady);
        reject(new Error("Hết thời gian chờ kết nối widget."));
      }, timeout);

      function onReady() {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        state.chatwootReady = true;
        resolve(window.$chatwoot);
      }

      window.addEventListener("chatwoot:ready", onReady, { once: true });

      // SDK đã ready trước khi gắn listener
      if (window.$chatwoot && window.$chatwoot.hasLoaded) {
        onReady();
      }
    }).catch(function (error) {
      chatwootReadyPromise = null;
      throw error;
    });

    return chatwootReadyPromise;
  }

  /**
   * POST select → widget ready → setUser(client_session_id)
   * Xong mới mở chat (chatReady).
   */
  function activateChatAfterPersona(persona, selectPayload) {
    var sessionId = extractClientSessionId(selectPayload);

    return ensureChatwootSdk()
      .then(function () {
        return waitForChatwootReady();
      })
      .then(function () {
        if (
          !window.$chatwoot ||
          typeof window.$chatwoot.setUser !== "function"
        ) {
          throw new Error("Omni SDK chưa sẵn sàng (thiếu setUser).");
        }
        window.$chatwoot.setUser(sessionId, {
          name: (persona && persona.label) || "Khách truy cập",
        });
        state._clientSessionId = sessionId;
        state.chatReady = true;
        state.showQuickReplies = false;
        state.showGreeting = false;
        state.error = "";
        return sessionId;
      });
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
      // Không gửi cookie phiên chat → mỗi lần load trang là contact/phiên mới
      credentials: "omit",
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

  function extractPubsubToken(data) {
    if (!data || typeof data !== "object") return "";
    return (
      data.pubsub_token ||
      data.pubsubToken ||
      (data.contact &&
        (data.contact.pubsub_token || data.contact.pubsubToken)) ||
      (data.contact_inbox &&
        (data.contact_inbox.pubsub_token || data.contact_inbox.pubsubToken)) ||
      (data.meta &&
        data.meta.contact &&
        (data.meta.contact.pubsub_token || data.meta.contact.pubsubToken)) ||
      ""
    );
  }

  function extractAccountId(data) {
    if (!data || typeof data !== "object") return null;
    var raw =
      data.account_id ||
      data.accountId ||
      (data.website_channel_config &&
        (data.website_channel_config.account_id ||
          data.website_channel_config.accountId)) ||
      (data.contact && (data.contact.account_id || data.contact.accountId)) ||
      (data.inbox && (data.inbox.account_id || data.inbox.accountId)) ||
      null;
    if (raw == null || raw === "") return null;
    var num = Number(raw);
    return isNaN(num) ? raw : num;
  }

  function applySessionMeta(data) {
    if (!data || typeof data !== "object") return;
    var pubsub = extractPubsubToken(data);
    if (pubsub) state.pubsubToken = String(pubsub);
    var accountId = extractAccountId(data);
    if (accountId != null) state.accountId = accountId;
    if (Array.isArray(data.messages) && data.messages.length) {
      var fromMsg = extractAccountId(data.messages[0]);
      if (fromMsg != null) state.accountId = fromMsg;
    }
  }

  function cableUrl() {
    var base = String(config.baseUrl || "").replace(/\/$/, "");
    if (!base) return "";
    var hostPath = "";
    if (base.indexOf("https://") === 0) {
      hostPath = "wss://" + base.slice("https://".length);
    } else if (base.indexOf("http://") === 0) {
      hostPath = "ws://" + base.slice("http://".length);
    } else if (base.indexOf("wss://") === 0 || base.indexOf("ws://") === 0) {
      hostPath = base;
    } else {
      hostPath = "wss://" + base.replace(/^\/\//, "");
    }
    return hostPath.replace(/\/$/, "") + "/cable";
  }

  function buildCableIdentifier() {
    var payload = {
      channel: "RoomChannel",
      pubsub_token: state.pubsubToken,
    };
    if (state.accountId != null) payload.account_id = state.accountId;
    return JSON.stringify(payload);
  }

  function stopPresence() {
    if (presenceTimer) {
      window.clearInterval(presenceTimer);
      presenceTimer = null;
    }
  }

  function startPresence() {
    stopPresence();
    if (!cableSocket || cableSocket.readyState !== WebSocket.OPEN) return;
    presenceTimer = window.setInterval(function () {
      if (!cableSocket || cableSocket.readyState !== WebSocket.OPEN) return;
      try {
        cableSocket.send(
          JSON.stringify({
            command: "message",
            identifier: cableIdentifier,
            data: JSON.stringify({ action: "update_presence" }),
          }),
        );
      } catch (error) {
        /* ignore */
      }
    }, 30000);
  }

  function clearFallbackPolls() {
    fallbackPollTimers.forEach(function (id) {
      window.clearTimeout(id);
    });
    fallbackPollTimers = [];
  }

  /** Khi WS chưa sống: poll GET messages vài lần sau khi gửi để bắt reply bot. */
  function scheduleFallbackMessagePolls() {
    clearFallbackPolls();
    if (state.cableConnected) return;
    [1500, 3500, 7000].forEach(function (delay) {
      fallbackPollTimers.push(
        window.setTimeout(function () {
          if (!state.authToken || !state.hasConversation) return;
          if (state.cableConnected) return;
          fetchMessages();
        }, delay),
      );
    });
  }

  function handleCableEvent(eventName, data) {
    if (!eventName) return;

    if (eventName === "message.created" || eventName === "message.updated") {
      if (data) {
        mergeMessages([data]);
        state.hasConversation = true;
        renderMessages();
      } else {
        fetchMessages();
      }
      return;
    }

    if (
      eventName === "conversation.created" ||
      eventName === "conversation.status_changed"
    ) {
      state.hasConversation = true;
      applySessionMeta(data);
      if (data && Array.isArray(data.messages) && data.messages.length) {
        mergeMessages(data.messages);
        renderMessages();
      } else {
        fetchMessages();
      }
    }
  }

  function onCableMessage(raw) {
    var payload = null;
    try {
      payload = JSON.parse(raw);
    } catch (error) {
      return;
    }
    if (!payload || typeof payload !== "object") return;

    if (payload.type === "welcome") {
      try {
        cableSocket.send(
          JSON.stringify({
            command: "subscribe",
            identifier: cableIdentifier,
          }),
        );
      } catch (error) {
        console.warn("[fsel-techie] cable subscribe failed:", error);
      }
      return;
    }

    if (payload.type === "confirm_subscription") {
      state.cableConnected = true;
      reconnectAttempt = 0;
      clearFallbackPolls();
      startPresence();
      // Sync lại sau khi cable sẵn sàng (bot reply có thể đã về trước đó)
      if (state.hasConversation) fetchMessages();
      return;
    }

    if (payload.type === "ping" || payload.type === "disconnect") return;

    if (payload.type === "reject_subscription") {
      state.cableConnected = false;
      console.warn("[fsel-techie] cable subscription rejected");
      return;
    }

    var message = payload.message;
    if (!message || typeof message !== "object") return;
    handleCableEvent(message.event, message.data);
  }

  function scheduleCableReconnect() {
    if (intentionalCableClose || !state.pubsubToken) return;
    if (reconnectTimer) return;
    var delay = Math.min(1000 * Math.pow(2, reconnectAttempt), 15000);
    reconnectAttempt += 1;
    reconnectTimer = window.setTimeout(function () {
      reconnectTimer = null;
      connectCable();
    }, delay);
  }

  function disconnectCable(intentional) {
    intentionalCableClose = !!intentional;
    stopPresence();
    if (reconnectTimer) {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    state.cableConnected = false;
    if (cableSocket) {
      try {
        cableSocket.onopen = null;
        cableSocket.onmessage = null;
        cableSocket.onerror = null;
        cableSocket.onclose = null;
        cableSocket.close();
      } catch (error) {
        /* ignore */
      }
      cableSocket = null;
    }
    cableIdentifier = "";
  }

  /** Realtime widget: wss://…/cable + RoomChannel (contact pubsub_token). */
  function connectCable() {
    if (!state.pubsubToken) return;
    if (
      cableSocket &&
      (cableSocket.readyState === WebSocket.OPEN ||
        cableSocket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    var url = cableUrl();
    if (!url || typeof WebSocket === "undefined") {
      scheduleFallbackMessagePolls();
      return;
    }

    intentionalCableClose = false;
    cableIdentifier = buildCableIdentifier();

    try {
      // Protocol subprotocol giống @rails/actioncable — bắt buộc với nhiều bản Omni
      cableSocket = new WebSocket(url, [
        "actioncable-v1-json",
        "actioncable-unsupported",
      ]);
    } catch (error) {
      try {
        cableSocket = new WebSocket(url);
      } catch (fallbackError) {
        console.warn("[fsel-techie] cable connect failed:", fallbackError);
        scheduleCableReconnect();
        return;
      }
    }

    cableSocket.onopen = function () {
      // ActionCable gửi welcome trước; subscribe trong onmessage
    };

    cableSocket.onmessage = function (event) {
      onCableMessage(event.data);
    };

    cableSocket.onerror = function () {
      state.cableConnected = false;
    };

    cableSocket.onclose = function () {
      state.cableConnected = false;
      stopPresence();
      cableSocket = null;
      if (!intentionalCableClose) {
        scheduleFallbackMessagePolls();
        scheduleCableReconnect();
      }
    };
  }

  function ensureSession() {
    if (state.authToken) {
      if (state.pubsubToken) connectCable();
      return Promise.resolve(state.authToken);
    }

    return request("POST", "/api/v1/widget/config", {}).then(function (data) {
      var token = extractAuthToken(data);
      if (!token) throw new Error("Không nhận được auth token từ Omni.");
      writeStoredAuth(token);
      applySessionMeta(data);
      connectCable();
      return token;
    });
  }

  function fetchMessages() {
    return request("GET", "/api/v1/widget/messages", null)
      .then(function (data) {
        applySessionMeta(data);
        var payload =
          (data && data.payload) ||
          (data && data.messages) ||
          (Array.isArray(data) ? data : []);
        if (payload && payload.length) {
          state.hasConversation = true;
          var first = payload[0];
          if (first) applySessionMeta(first);
        }
        mergeMessages(payload);
        state.error = "";
        renderMessages();
        if (state.pubsubToken) connectCable();
      })
      .catch(function (error) {
        if (error && error.status === 404) return;
        // Session hết hạn → tạo lại
        if (error && (error.status === 401 || error.status === 403)) {
          writeStoredAuth("");
          disconnectCable(true);
          state.pubsubToken = "";
        }
      });
  }

  function createConversation(content) {
    return request("POST", "/api/v1/widget/conversations", {
      contact: {
        name: "Khách truy cập",
        identifier: getClientSessionId(),
      },
      message: {
        content: content,
        timestamp: new Date().toString(),
        referer_url: window.location.href,
      },
    }).then(function (data) {
      state.hasConversation = true;
      applySessionMeta(data);
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
      connectCable();
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
      applySessionMeta(data);
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
      connectCable();
    });
  }

  function sendText(content) {
    var text = String(content || "").trim();
    if (!text || state.sending) return Promise.resolve();

    if (!state.chatReady) {
      state.error = "Vui lòng chọn đối tượng trước khi nhắn tin.";
      render();
      return Promise.resolve();
    }

    state.sending = true;
    state.showQuickReplies = false;
    state.showGreeting = false;
    state.error = "";
    render();

    return ensureSession()
      .then(function () {
        if (state.hasConversation) return sendFollowUp(text);
        return createConversation(text);
      })
      .then(function () {
        renderMessages();
        connectCable();
        scheduleFallbackMessagePolls();
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
      ".omni-fsel-panel{width:420px;max-width:calc(100vw - 24px);height:min(40rem,calc(100dvh - 88px));display:flex;flex-direction:column;border:1px solid " +
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
      ".omni-fsel-body{flex:1;display:flex;flex-direction:column;background:#F7F8FA;padding:16px;min-height:0;overflow:hidden}" +
      ".omni-fsel-message-block{max-width:88%;width:fit-content;flex-shrink:0;margin-bottom:4px}" +
      ".omni-fsel-message-block.is-hidden{display:none}" +
      ".omni-fsel-meta{display:flex;justify-content:flex-start;align-items:baseline;gap:10px;font-size:11px;line-height:1.2;padding:0 4px;margin-bottom:6px;width:fit-content;max-width:100%}" +
      ".omni-fsel-meta strong{color:" +
      THEME.muted +
      ";font-weight:500}" +
      ".omni-fsel-meta span{color:" +
      THEME.muted +
      ";font-weight:500;white-space:nowrap}" +
      ".omni-fsel-bubble{border:1px solid #E5E7EB;background:#fff;border-radius:12px;padding:12px 14px;font-size:14px;font-weight:400;line-height:1.5;color:#111827;box-shadow:none;width:fit-content;max-width:100%;box-sizing:border-box}" +
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
      ".omni-fsel-action:disabled{opacity:.6;cursor:not-allowed}" +
      ".omni-fsel-messages{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:16px;padding-right:2px;-ms-overflow-style:none;scrollbar-width:none}" +
      ".omni-fsel-messages::-webkit-scrollbar{width:0;height:0;display:none}" +
      ".omni-fsel-msg-row{display:flex;flex-direction:column;gap:6px;max-width:88%;width:fit-content}" +
      ".omni-fsel-msg-row.is-agent{align-self:flex-start;align-items:flex-start}" +
      ".omni-fsel-msg-row.is-user{align-self:flex-end;align-items:flex-end}" +
      ".omni-fsel-msg-meta{display:flex;align-items:baseline;gap:10px;font-size:11px;line-height:1.2;padding:0 4px;color:" +
      THEME.muted +
      ";font-weight:500;max-width:100%;width:fit-content}" +
      ".omni-fsel-msg-row.is-agent .omni-fsel-msg-meta{justify-content:flex-start}" +
      ".omni-fsel-msg-row.is-user .omni-fsel-msg-meta{justify-content:flex-end}" +
      ".omni-fsel-msg-name{color:" +
      THEME.muted +
      ";font-weight:500}" +
      ".omni-fsel-msg-time{color:" +
      THEME.muted +
      ";font-weight:500;white-space:nowrap}" +
      ".omni-fsel-msg{border-radius:12px;padding:12px 14px;font-size:14px;font-weight:400;line-height:1.5;word-break:break-word;width:fit-content;max-width:100%;box-sizing:border-box}" +
      ".omni-fsel-msg.is-agent{border:1px solid #E5E7EB;background:#fff;color:#111827;box-shadow:none}" +
      ".omni-fsel-msg.is-user{border:0;background:#EEF2F7;color:#111827;box-shadow:none}" +
      ".omni-fsel-error{margin-top:8px;font-size:11px;font-weight:500;color:#c2410c;flex-shrink:0}" +
      ".omni-fsel-footer{flex-shrink:0;border-top:1px solid " +
      THEME.border +
      ";background:#fff;padding:12px 16px;position:relative}" +
      ".omni-fsel-quota-wrap{min-height:16px;margin-bottom:8px}" +
      ".omni-fsel-quota{margin:0;text-align:left;font-size:12px;font-weight:500;color:" +
      THEME.muted +
      "}" +
      ".omni-fsel-quota.is-placeholder{visibility:hidden}" +
      ".omni-fsel-composer{position:relative}" +
      ".omni-fsel-input-row{display:flex;gap:8px;align-items:center;margin:0}" +
      ".omni-fsel-input-wrap{flex:1;min-width:0;position:relative;display:flex;align-items:center}" +
      ".omni-fsel-input{flex:1;min-width:0;width:100%;min-height:36px;height:36px;border:1px solid " +
      THEME.borderStrong +
      ";border-radius:12px;padding:8px 40px 8px 12px;font-size:12px;font-weight:500;color:" +
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
      ".omni-fsel-emoji-btn{position:absolute;right:6px;top:50%;transform:translateY(-50%);width:28px;height:28px;border:0;border-radius:8px;background:transparent;color:" +
      THEME.muted +
      ";cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0}" +
      ".omni-fsel-emoji-btn:hover{background:" +
      THEME.primarySoft +
      ";color:" +
      THEME.ink +
      "}" +
      ".omni-fsel-emoji-btn.is-active{background:" +
      THEME.primarySoft +
      ";color:" +
      THEME.primary +
      "}" +
      ".omni-fsel-emoji-btn:disabled{opacity:.5;cursor:not-allowed}" +
      ".omni-fsel-emoji-panel{display:none;position:absolute;right:0;bottom:calc(100% + 8px);width:min(280px,calc(100vw - 64px));max-height:180px;overflow-y:auto;padding:8px;border:1px solid " +
      THEME.border +
      ";border-radius:12px;background:#fff;box-shadow:0 12px 28px rgba(26,36,86,.14);z-index:5;-ms-overflow-style:none;scrollbar-width:none}" +
      ".omni-fsel-emoji-panel::-webkit-scrollbar{width:0;height:0;display:none}" +
      ".omni-fsel-emoji-panel.is-open{display:grid;grid-template-columns:repeat(8,1fr);gap:2px}" +
      ".omni-fsel-emoji-item{border:0;background:transparent;border-radius:8px;width:100%;aspect-ratio:1;font-size:18px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0}" +
      ".omni-fsel-emoji-item:hover{background:" +
      THEME.primarySoft +
      "}" +
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
    emoji:
      '<svg class="omni-fsel-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
  };

  var EMOJI_LIST = [
    "😀",
    "😁",
    "😂",
    "🤣",
    "😊",
    "😍",
    "😘",
    "😜",
    "🤗",
    "🤔",
    "😎",
    "😢",
    "😭",
    "😡",
    "👍",
    "👎",
    "👏",
    "🙏",
    "🎉",
    "🔥",
    "❤️",
    "💯",
    "✨",
    "⭐",
    "✅",
    "❌",
    "📌",
    "💡",
    "👋",
    "🤝",
    "💪",
    "☕",
  ];

  function setEmojiPanelOpen(open) {
    state.showEmojiPanel = !!open;
    var root = document.getElementById(ROOT_ID);
    if (!root) return;
    var panel = root.querySelector(".omni-fsel-emoji-panel");
    var btn = root.querySelector(".omni-fsel-emoji-btn");
    if (panel) panel.classList.toggle("is-open", state.showEmojiPanel);
    if (btn) btn.classList.toggle("is-active", state.showEmojiPanel);
  }

  function insertEmoji(emoji) {
    var input = document.querySelector("#" + ROOT_ID + " .omni-fsel-input");
    if (!input || input.disabled) return;
    var start =
      typeof input.selectionStart === "number"
        ? input.selectionStart
        : input.value.length;
    var end =
      typeof input.selectionEnd === "number"
        ? input.selectionEnd
        : input.value.length;
    var value = String(input.value || "");
    input.value = value.slice(0, start) + emoji + value.slice(end);
    var caret = start + emoji.length;
    try {
      input.setSelectionRange(caret, caret);
    } catch (error) {
      /* ignore */
    }
    input.focus();
  }

  function renderEmojiPanel(container) {
    if (!container || container.getAttribute("data-ready") === "1") return;
    container.innerHTML = "";
    EMOJI_LIST.forEach(function (emoji) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "omni-fsel-emoji-item";
      button.textContent = emoji;
      button.setAttribute("aria-label", "Chèn " + emoji);
      button.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        insertEmoji(emoji);
      });
      container.appendChild(button);
    });
    container.setAttribute("data-ready", "1");
  }

  function renderQuickReplies(container) {
    container.innerHTML = "";
    if (state.selectingPersona) {
      container.style.display = "grid";
      container.style.minHeight = "4rem";
      container.innerHTML =
        '<div style="grid-column:1/-1;text-align:center;font-size:12px;color:' +
        THEME.muted +
        ';padding:12px 0">Đang kết nối chat…</div>';
      return;
    }
    if (
      !state.showQuickReplies ||
      !state.quickReplies ||
      !state.quickReplies.length
    ) {
      if (state.loadingPersonas && state.showQuickReplies) {
        container.style.display = "grid";
        container.style.minHeight = "4rem";
        container.innerHTML =
          '<div style="grid-column:1/-1;text-align:center;font-size:12px;color:' +
          THEME.muted +
          ';padding:12px 0">Đang tải lựa chọn…</div>';
        return;
      }
      container.style.display = "none";
      return;
    }

    container.style.display = "grid";
    container.style.minHeight = messageAreaMinHeight();
    state.quickReplies.forEach(function (item) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "omni-fsel-action";
      button.textContent = item.label;
      button.disabled = state.selectingPersona || state.sending;
      button.addEventListener("click", function () {
        selectPersonaAndContinue(item);
      });
      container.appendChild(button);
    });
  }

  function selectPersonaAndContinue(persona) {
    if (!persona || state.selectingPersona || state.sending) return;

    state.selectingPersona = true;
    state.error = "";
    render();

    // POST select → widget ready → setUser(client_session_id) → mở chat
    selectLiveChatPersona(persona)
      .then(function (selectPayload) {
        return activateChatAfterPersona(persona, selectPayload);
      })
      .then(function () {
        state.selectingPersona = false;
        render();
        focusInput();
        // Chuẩn bị REST session (auth) sau setUser — chưa gửi tin tự động
        return ensureSession().catch(function (error) {
          console.warn("[fsel-techie] ensureSession after setUser:", error);
        });
      })
      .catch(function (error) {
        state.selectingPersona = false;
        state.chatReady = false;
        state.error =
          (error && error.message) ||
          "Không khởi tạo được phiên chat. Thử chọn lại đối tượng.";
        console.warn("[fsel-techie] persona activate failed:", error);
        render();
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

    var assistantName = config.assistantName || "Trợ lý";
    var html = state.messages
      .map(function (message) {
        var side = message.fromVisitor ? "is-user" : "is-agent";
        var timeLabel = formatTimestamp(message.createdAt);
        var meta = message.fromVisitor
          ? '<div class="omni-fsel-msg-meta"><span class="omni-fsel-msg-time">' +
            escapeHtml(timeLabel) +
            "</span></div>"
          : '<div class="omni-fsel-msg-meta"><span class="omni-fsel-msg-name">' +
            escapeHtml(assistantName) +
            '</span><span class="omni-fsel-msg-time">' +
            escapeHtml(timeLabel) +
            "</span></div>";
        return (
          '<div class="omni-fsel-msg-row ' +
          side +
          '">' +
          meta +
          '<div class="omni-fsel-msg ' +
          side +
          '">' +
          escapeHtml(message.content) +
          "</div>" +
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
    var greetingBlock = root.querySelector(".omni-fsel-message-block");
    var greetingBubble = root.querySelector(".omni-fsel-bubble");
    var greetingTime = root.querySelector(".omni-fsel-meta-time");
    var greetingName = root.querySelector(".omni-fsel-meta-name");
    var actions = root.querySelector(".omni-fsel-actions");
    var quota = root.querySelector(".omni-fsel-quota");
    var quotaWrap = root.querySelector(".omni-fsel-quota-wrap");
    var input = root.querySelector(".omni-fsel-input");
    var send = root.querySelector(".omni-fsel-send");
    var emojiBtn = root.querySelector(".omni-fsel-emoji-btn");
    var emojiPanel = root.querySelector(".omni-fsel-emoji-panel");
    var error = root.querySelector(".omni-fsel-error");

    if (panel) panel.classList.toggle("is-open", state.open);

    if (prompt) {
      var label = config.launcherPromptLabel || "Bạn có cần hỗ trợ gì không?";
      prompt.textContent = label;
      prompt.classList.toggle("is-visible", !state.open && !!label);
    }

    if (greetingBlock) {
      var canShowGreeting =
        state.showGreeting &&
        Boolean(initialGreeting) &&
        state.showQuickReplies;
      greetingBlock.classList.toggle("is-hidden", !canShowGreeting);
      if (greetingBubble) greetingBubble.textContent = initialGreeting;
      if (greetingTime) greetingTime.textContent = formatTimestamp(new Date());
      if (greetingName) {
        greetingName.textContent = config.assistantName || "Trợ lý";
      }
    }

    renderLauncherContent(launcher);
    if (actions) renderQuickReplies(actions);
    renderMessages();
    if (emojiPanel) renderEmojiPanel(emojiPanel);
    if (emojiPanel)
      emojiPanel.classList.toggle("is-open", state.showEmojiPanel);
    if (emojiBtn) emojiBtn.classList.toggle("is-active", state.showEmojiPanel);

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
      input.placeholder = !state.chatReady
        ? config.inputPlaceholder || "Vui lòng chọn đối tượng để bắt đầu..."
        : config.inputPlaceholderWithActions ||
          config.inputPlaceholder ||
          "Nhập tin nhắn...";
      input.disabled =
        !state.chatReady || state.sending || state.selectingPersona;
    }

    if (send)
      send.disabled =
        !state.chatReady || state.sending || state.selectingPersona;
    if (emojiBtn)
      emojiBtn.disabled =
        !state.chatReady || state.sending || state.selectingPersona;
  }

  function setOpen(next) {
    state.open = !!next;
    if (!state.open) state.showEmojiPanel = false;
    render();
    if (state.open) {
      if (state.hasConversation && state.authToken) {
        fetchMessages()
          .then(function () {
            connectCable();
            focusInput();
          })
          .catch(function () {
            connectCable();
            focusInput();
          });
      } else if (state.authToken && state.pubsubToken) {
        connectCable();
        focusInput();
      } else {
        focusInput();
      }
    }
  }

  function submitComposer(event) {
    if (event) event.preventDefault();
    setEmojiPanelOpen(false);
    var input = document.querySelector("#" + ROOT_ID + " .omni-fsel-input");
    if (!input) return;
    var value = input.value;
    input.value = "";
    sendText(value);
  }

  function mountWidget() {
    injectStyles();
    resetSessionForNewVisit();

    var root = document.createElement("div");
    root.id = ROOT_ID;

    root.innerHTML =
      '<div class="omni-fsel-stack">' +
      '<div class="omni-fsel-panel">' +
      '<div class="omni-fsel-header">' +
      '<div class="omni-fsel-title-wrap">' +
      '<div class="omni-fsel-logo-wrap">' +
      (config.logoUrl
        ? '<img class="omni-fsel-logo" src="' +
          escapeHtml(config.logoUrl) +
          '" alt="" />'
        : "") +
      "</div>" +
      '<div class="omni-fsel-title"></div>' +
      "</div>" +
      '<button type="button" class="omni-fsel-close" aria-label="Đóng">' +
      ICONS.close +
      "</button>" +
      "</div>" +
      '<div class="omni-fsel-body">' +
      '<div class="omni-fsel-message-block' +
      (state.showGreeting ? "" : " is-hidden") +
      '">' +
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
      '<div class="omni-fsel-composer">' +
      '<div class="omni-fsel-emoji-panel" role="listbox" aria-label="Biểu cảm"></div>' +
      '<form class="omni-fsel-input-row">' +
      '<div class="omni-fsel-input-wrap">' +
      '<input class="omni-fsel-input" type="text" autocomplete="off" enterkeyhint="send" />' +
      '<button type="button" class="omni-fsel-emoji-btn" aria-label="Thêm biểu cảm">' +
      ICONS.emoji +
      "</button>" +
      "</div>" +
      '<button type="submit" class="omni-fsel-send" aria-label="Gửi">' +
      ICONS.send +
      "</button>" +
      "</form>" +
      "</div>" +
      "</div>" +
      "</div>" +
      '<div class="omni-fsel-dock">' +
      '<button type="button" class="omni-fsel-prompt"></button>' +
      '<button type="button" class="omni-fsel-launcher" aria-label="Mở chat"></button>' +
      "</div>" +
      "</div>";

    document.body.appendChild(root);

    var assistantName = config.assistantName || "Trợ lý";
    root.querySelector(".omni-fsel-title").textContent = assistantName;

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

    root
      .querySelector(".omni-fsel-emoji-btn")
      .addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        setEmojiPanelOpen(!state.showEmojiPanel);
      });

    document.addEventListener("click", function (event) {
      if (!state.showEmojiPanel) return;
      var composer = root.querySelector(".omni-fsel-composer");
      if (composer && composer.contains(event.target)) return;
      setEmojiPanelOpen(false);
    });

    render();

    // Preload Omni SDK (ẩn) để sẵn sàng khi chọn persona
    ensureChatwootSdk()
      .then(function () {
        return waitForChatwootReady(30000);
      })
      .catch(function (error) {
        console.warn("[fsel-techie] Omni SDK preload:", error);
      });

    fetchLiveChatPersonas().then(function () {
      render();
    });
  }

  mountWidget();
})();
