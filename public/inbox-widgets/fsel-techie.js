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
    authToken: "",
    hasConversation: false,
    messages: [],
    error: "",
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
    state.authToken = "";
    state.hasConversation = false;
    state.messages = [];
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
      // Không gửi cookie Chatwoot → mỗi lần load trang là contact/phiên mới
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
      ".omni-fsel-message-block{max-width:88%;flex-shrink:0;margin-bottom:4px}" +
      ".omni-fsel-message-block.is-hidden{display:none}" +
      ".omni-fsel-meta{display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-size:11px;line-height:1.2;padding:0 4px;margin-bottom:6px;width:100%}" +
      ".omni-fsel-meta strong{color:" +
      THEME.muted +
      ";font-weight:500}" +
      ".omni-fsel-meta span{color:" +
      THEME.muted +
      ";font-weight:500;white-space:nowrap}" +
      ".omni-fsel-bubble{border:1px solid #E5E7EB;background:#fff;border-radius:12px;padding:12px 14px;font-size:14px;font-weight:400;line-height:1.5;color:#111827;box-shadow:none}" +
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
      ".omni-fsel-messages{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:16px;padding-right:2px}" +
      ".omni-fsel-msg-row{display:flex;flex-direction:column;gap:6px;max-width:88%}" +
      ".omni-fsel-msg-row.is-agent{align-self:flex-start;align-items:stretch;width:88%}" +
      ".omni-fsel-msg-row.is-user{align-self:flex-end;align-items:stretch;width:fit-content}" +
      ".omni-fsel-msg-meta{display:flex;align-items:baseline;gap:10px;font-size:11px;line-height:1.2;padding:0 4px;color:" +
      THEME.muted +
      ";font-weight:500}" +
      ".omni-fsel-msg-row.is-agent .omni-fsel-msg-meta{justify-content:space-between}" +
      ".omni-fsel-msg-row.is-user .omni-fsel-msg-meta{justify-content:flex-end}" +
      ".omni-fsel-msg-name{color:" +
      THEME.muted +
      ";font-weight:500}" +
      ".omni-fsel-msg-time{color:" +
      THEME.muted +
      ";font-weight:500;white-space:nowrap}" +
      ".omni-fsel-msg{border-radius:12px;padding:12px 14px;font-size:14px;font-weight:400;line-height:1.5;word-break:break-word}" +
      ".omni-fsel-msg.is-agent{border:1px solid #E5E7EB;background:#fff;color:#111827;box-shadow:none}" +
      ".omni-fsel-msg.is-user{border:0;background:#EEF2F7;color:#111827;box-shadow:none}" +
      ".omni-fsel-error{margin-top:8px;font-size:11px;font-weight:500;color:#c2410c;flex-shrink:0}" +
      ".omni-fsel-footer{flex-shrink:0;border-top:1px solid " +
      THEME.border +
      ";background:#fff;padding:12px 16px}" +
      ".omni-fsel-quota-wrap{min-height:16px;margin-bottom:8px}" +
      ".omni-fsel-quota{margin:0;text-align:left;font-size:12px;font-weight:500;color:" +
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

    selectLiveChatPersona(persona)
      .catch(function (error) {
        console.warn("[fsel-techie] personas SELECT failed:", error);
      })
      .then(function () {
        state.selectingPersona = false;
        state.showQuickReplies = false;
        state.showGreeting = false;
        render();
        return sendText(persona.label);
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
      input.disabled = state.sending || state.selectingPersona;
    }

    if (send) send.disabled = state.sending || state.selectingPersona;
  }

  function setOpen(next) {
    state.open = !!next;
    render();
    if (state.open) {
      // Chỉ fetch 1 lần khi mở lại phiên hiện tại — không poll liên tục
      if (state.hasConversation && state.authToken) {
        fetchMessages()
          .then(function () {
            focusInput();
          })
          .catch(function () {
            focusInput();
          });
      } else {
        focusInput();
      }
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

    render();

    fetchLiveChatPersonas().then(function () {
      render();
    });
  }

  mountWidget();
})();
