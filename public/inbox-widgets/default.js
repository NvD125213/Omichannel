(function () {
  var config = window.__OMNICHANNEL_CHAT_WIDGET__;
  if (!config || !config.baseUrl || !config.websiteToken) {
    console.warn("[omni-default] Missing widget config.");
    return;
  }

  var ROOT_ID = "omni-default-root";
  if (document.getElementById(ROOT_ID)) return;

  var THEME = {
    primary: config.primaryColor || "#1f93ff",
    primarySoft: "#EEF1FF",
    primarySurface: "#F5F7FF",
    ink: "#1A2456",
    inkBody: "#2B3674",
    muted: "#7B88B8",
    border: "#D4DCFA",
    borderStrong: "#B8C4F5",
  };

  var AUTH_KEY = "omni_default_auth_" + config.websiteToken;
  var SESSION_KEY = "omni_default_session_" + config.websiteToken;

  /** Lời chào inbox (dùng để lọc tin chào server trùng, không hiện trên UI chọn persona) */
  var inboxGreeting = String(config.greetingMessage || "").trim();
  /** Tagline hiện phía trên nút chọn persona */
  var prePersonaIntro = String(
    config.welcomeTagline || config.welcome_tagline || "",
  ).trim();

  var state = {
    open: false,
    showQuickReplies: true,
    /** Tagline chỉ hiện trước khi chọn persona / bắt đầu chat */
    showGreeting: Boolean(prePersonaIntro),
    sending: false,
    /** Đang chờ bot phản hồi — hiện indicator "đang suy nghĩ" */
    awaitingReply: false,
    selectingPersona: false,
    loadingPersonas: false,
    /** Đã POST select + setUser xong — mới cho nhắn tin */
    chatReady: false,
    chatwootReady: false,
    /** Policy GET personas.contact_capture */
    contactCapture: null,
    contactSubmitted: false,
    submittingContact: false,
    submittedContact: { name: "", email: "", phone: "" },
    selectedPersonaId: "",
    sessionRestored: false,
    authToken: "",
    pubsubToken: "",
    accountId: null,
    hasConversation: false,
    messages: [],
    error: "",
    cableConnected: false,
    showEmojiPanel: false,
    /** Chỉ hiện typing khi biết inbox/conversation có bot trả lời. */
    botReplyEnabled: false,
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
  var awaitingReplyTimer = null;
  var reconnectTimer = null;
  var reconnectAttempt = 0;
  var fallbackPollTimers = [];
  var intentionalCableClose = false;
  var chatwootSdkPromise = null;
  var chatwootReadyPromise = null;
  /** Đếm số lần SDK bắn chatwoot:ready — dùng để đợi ready LẠI sau reset(). */
  var chatwootReadyCount = 0;

  // ===== Debug log — tắt bằng window.__OMNICHANNEL_CHAT_WIDGET__.debug = false =====
  var DEBUG = config.debug !== false;

  function maskToken(token) {
    var t = String(token || "");
    if (!t) return "(trống)";
    if (t.length <= 14) return t;
    return t.slice(0, 10) + "…" + t.slice(-4) + " (len=" + t.length + ")";
  }

  function dlog(step, detail) {
    if (!DEBUG) return;
    try {
      if (detail !== undefined) console.log("[omni-default] " + step, detail);
      else console.log("[omni-default] " + step);
    } catch (error) {
      /* ignore */
    }
  }

  window.addEventListener("chatwoot:ready", function () {
    chatwootReadyCount += 1;
    state.chatwootReady = true;
    dlog("SDK bắn chatwoot:ready (lần " + chatwootReadyCount + ")", {
      cookie_cw_conversation: maskToken(readSdkAuthToken()),
    });
  });

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

  /** sessionStorage: reload giữ phiên; đóng tab mất phiên → chat mới. */
  function persistTabSession() {
    try {
      sessionStorage.setItem(AUTH_KEY, state.authToken || "");
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          clientSessionId: state._clientSessionId || "",
          chatReady: !!state.chatReady,
          contactSubmitted: !!state.contactSubmitted,
          submittedContact: state.submittedContact || {
            name: "",
            email: "",
            phone: "",
          },
          selectedPersonaId: state.selectedPersonaId || "",
          hasConversation: !!state.hasConversation,
          pubsubToken: state.pubsubToken || "",
          accountId: state.accountId,
          botReplyEnabled: !!state.botReplyEnabled,
        }),
      );
    } catch (error) {
      /* ignore */
    }
  }

  function restoreTabSession() {
    try {
      var raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return false;
      var saved = JSON.parse(raw);
      var sessionId = saved && String(saved.clientSessionId || "").trim();
      if (!sessionId) return false;

      state._clientSessionId = sessionId;
      state.chatReady = !!saved.chatReady;
      state.contactSubmitted = !!saved.contactSubmitted;
      state.submittedContact = saved.submittedContact || {
        name: "",
        email: "",
        phone: "",
      };
      state.selectedPersonaId = saved.selectedPersonaId || "";
      state.hasConversation = !!saved.hasConversation;
      state.pubsubToken = saved.pubsubToken || "";
      if (saved.accountId != null) state.accountId = saved.accountId;
      state.botReplyEnabled = !!saved.botReplyEnabled;
      state.authToken = sessionStorage.getItem(AUTH_KEY) || "";
      if (state.chatReady) {
        state.showQuickReplies = false;
        state.showGreeting = false;
      }
      state.sessionRestored = true;
      dlog("B0. Khôi phục phiên tab (reload)", {
        client_session_id: sessionId,
        chatReady: state.chatReady,
        contactSubmitted: state.contactSubmitted,
        has_auth: Boolean(state.authToken),
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /** Tab mới / đóng tab: xóa cookie SDK cũ để không dính conversation tab trước. */
  function resetSessionForNewVisit() {
    dlog("B0. Tab mới — xóa phiên cũ", {
      cookie_cw_conversation_truoc_khi_xoa: maskToken(readSdkAuthToken()),
    });
    disconnectCable(true);
    clearFallbackPolls();
    state.authToken = "";
    state.pubsubToken = "";
    state.accountId = null;
    state.hasConversation = false;
    state.messages = [];
    state.cableConnected = false;
    state.chatReady = false;
    state.contactSubmitted = false;
    state.submittingContact = false;
    state.submittedContact = { name: "", email: "", phone: "" };
    state.selectedPersonaId = "";
    state.sessionRestored = false;
    state.botReplyEnabled = false;
    state._clientSessionId = "";
    try {
      sessionStorage.removeItem(AUTH_KEY);
      sessionStorage.removeItem(SESSION_KEY);
    } catch (error) {
      /* ignore */
    }
    clearSdkStoredSession();
    dlog("B0. Đã xóa phiên cũ", {
      cookie_cw_conversation_sau_khi_xoa: maskToken(readSdkAuthToken()),
    });
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

  /** Bỏ dấu câu cuối URL (vd. "https://a.com.") để không dính vào href. */
  function splitUrlTrailingPunct(url) {
    var end = String(url || "").length;
    while (end > 0) {
      var ch = url.charAt(end - 1);
      if (".,;:!?)]}'\"".indexOf(ch) === -1) break;
      end -= 1;
    }
    return {
      url: url.slice(0, end),
      trailing: url.slice(end),
    };
  }

  /** Markdown tối thiểu trên đoạn text đã escape (không chứa thẻ HTML). */
  function formatMarkdownInline(escaped) {
    var next = String(escaped || "");
    next = next.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    next = next.replace(/__([^_]+?)__/g, "<strong>$1</strong>");
    next = next.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
    next = next.replace(
      /(^|[^A-Za-z0-9_])_([^_\n]+)_(?![A-Za-z0-9_])/g,
      "$1<em>$2</em>",
    );
    return next;
  }

  /**
   * Escape HTML + markdown tối thiểu + tự biến URL thành link bấm được.
   * Hỗ trợ http(s):// và www.
   */
  function formatMessageHtml(value) {
    var text = String(value || "").replace(/\r\n/g, "\n");
    var urlRe = /(?:https?:\/\/|www\.)[^\s<]+/gi;
    var html = "";
    var lastIndex = 0;
    var match;

    while ((match = urlRe.exec(text)) !== null) {
      html += formatMarkdownInline(
        escapeHtml(text.slice(lastIndex, match.index)),
      );

      var parts = splitUrlTrailingPunct(match[0]);
      if (!parts.url) {
        html += formatMarkdownInline(escapeHtml(match[0]));
      } else {
        var href = parts.url;
        if (/^www\./i.test(href)) href = "https://" + href;
        html +=
          '<a class="omni-fsel-msg-link" href="' +
          escapeHtml(href) +
          '" target="_blank" rel="noopener noreferrer">' +
          escapeHtml(parts.url) +
          "</a>" +
          formatMarkdownInline(escapeHtml(parts.trailing));
      }

      lastIndex = match.index + match[0].length;
    }

    html += formatMarkdownInline(escapeHtml(text.slice(lastIndex)));
    return html.replace(/\n/g, "<br>");
  }

  function getComposer() {
    return document.querySelector("#" + ROOT_ID + " .omni-fsel-input");
  }

  function resizeComposer(el) {
    var input = el || getComposer();
    if (!input) return;
    input.style.height = "auto";
    var max = 132;
    var contentHeight = input.scrollHeight;
    var next = Math.min(Math.max(contentHeight, 42), max);
    input.style.height = next + "px";
    input.style.overflowY = contentHeight > max ? "auto" : "hidden";
  }

  function personaIntroMessage(persona) {
    var label = String((persona && persona.label) || "").trim();
    return label;
  }

  function readStoredAuth() {
    if (state.authToken) return state.authToken;
    try {
      state.authToken = sessionStorage.getItem(AUTH_KEY) || "";
    } catch (error) {
      /* ignore */
    }
    return state.authToken || "";
  }

  function writeStoredAuth(token) {
    state.authToken = token || "";
    persistTabSession();
  }

  function getClientSessionId() {
    if (state._clientSessionId) return state._clientSessionId;
    state._clientSessionId =
      "sess_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 10);
    persistTabSession();
    return state._clientSessionId;
  }

  function asRecord(value) {
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : null;
  }

  function normalizeContactCapture(raw) {
    var rec = asRecord(raw);
    var fieldDefs = [
      { key: "name", label: "Họ và tên" },
      { key: "phone", label: "Số điện thoại" },
      { key: "email", label: "Email" },
    ];
    var byKey = {};
    var list = rec && Array.isArray(rec.fields) ? rec.fields : [];
    list.forEach(function (item) {
      var row = asRecord(item);
      if (!row) return;
      var key = String(row.key || "").trim();
      if (key) byKey[key] = row;
    });
    var mode = rec ? String(rec.mode || "").trim() : "";
    if (
      mode !== "off" &&
      mode !== "pre_chat" &&
      mode !== "bot" &&
      mode !== "pre_chat_or_bot"
    ) {
      mode = "pre_chat_or_bot";
    }
    return {
      enabled: rec && typeof rec.enabled === "boolean" ? rec.enabled : false,
      mode: mode,
      message:
        rec && typeof rec.message === "string"
          ? rec.message
          : "Vui lòng để lại thông tin để chúng tôi hỗ trợ bạn tốt hơn.",
      fields: fieldDefs.map(function (item) {
        var row = byKey[item.key];
        var enabled = Boolean(row) && row.enabled !== false;
        var required = enabled && row && row.required === true;
        return {
          key: item.key,
          label:
            row && typeof row.label === "string" && row.label.trim()
              ? row.label.trim()
              : item.label,
          enabled: enabled,
          required: required,
        };
      }),
    };
  }

  function findContactCaptureNode(value, depth) {
    if (depth > 6) return null;
    var rec = asRecord(value);
    if (!rec) return null;
    if (asRecord(rec.contact_capture)) return rec.contact_capture;
    var options = asRecord(rec.pre_chat_form_options);
    if (options && asRecord(options.omnihub_contact_capture)) {
      return options.omnihub_contact_capture;
    }
    var keys = ["data", "messaging", "payload", "inbox", "channel"];
    for (var i = 0; i < keys.length; i++) {
      var found = findContactCaptureNode(rec[keys[i]], depth + 1);
      if (found) return found;
    }
    return null;
  }

  function enabledContactFields(policy) {
    var fields = policy && Array.isArray(policy.fields) ? policy.fields : [];
    return fields.filter(function (field) {
      return field && field.enabled;
    });
  }

  function hasContactValues(values) {
    var v = values || {};
    return Boolean(
      String(v.name || "").trim() ||
      String(v.email || "").trim() ||
      String(v.phone || "").trim(),
    );
  }

  function applySubmittedContact(values) {
    var v = values || {};
    state.submittedContact = {
      name: String(v.name || "").trim(),
      email: String(v.email || "").trim(),
      phone: String(v.phone || "").trim(),
    };
    state.contactSubmitted = true;
    persistTabSession();
  }

  /** Chỉ hiện form overlay khi bật thu thập VÀ còn ít nhất 1 trường đang hiện. */
  function overlayNeedsContactForm(policy) {
    if (!policy || policy.enabled !== true) return false;
    return enabledContactFields(policy).length > 0;
  }

  function isTruthyFlag(value) {
    return value === true || value === "true" || value === 1 || value === "1";
  }

  /** 1 persona + is_default → bỏ picker, POST select thẳng. */
  function canAutoSelectPersona(personas) {
    var list = personas || [];
    return list.length === 1 && isTruthyFlag(list[0] && list[0].is_default);
  }

  function autoSelectPersona() {
    return canAutoSelectPersona(state.quickReplies)
      ? state.quickReplies[0]
      : null;
  }

  function isContactFormStep() {
    return (
      overlayNeedsContactForm(state.contactCapture) &&
      !state.contactSubmitted &&
      !state.chatReady
    );
  }

  function readContactFormValues() {
    var root = document.getElementById(ROOT_ID);
    var form = root && root.querySelector(".omni-fsel-contact-form");
    var values = { name: "", email: "", phone: "" };
    if (!form) return values;
    ["name", "email", "phone"].forEach(function (key) {
      var input = form.querySelector('[name="' + key + '"]');
      values[key] = input ? String(input.value || "").trim() : "";
    });
    return values;
  }

  function validateContactForm(policy, values) {
    var missing = enabledContactFields(policy).filter(function (field) {
      return field.required && !String(values[field.key] || "").trim();
    });
    if (!missing.length) return "";
    return (
      "Vui lòng nhập " +
      missing
        .map(function (field) {
          return field.label;
        })
        .join(", ")
    );
  }

  function getCookieValue(name) {
    var match = document.cookie.match(
      new RegExp("(?:^|;\\s*)" + name + "=([^;]*)"),
    );
    return match ? decodeURIComponent(match[1]) : "";
  }

  function deleteCookie(name) {
    var host = window.location.hostname;
    var expiry = ";expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    document.cookie = name + "=" + expiry;
    document.cookie = name + "=" + expiry + ";domain=" + host;
    document.cookie = name + "=" + expiry + ";domain=." + host;
  }

  /** Token phiên của SDK (cookie cw_conversation) — dùng chung cho REST. */
  function readSdkAuthToken() {
    return getCookieValue("cw_conversation");
  }

  /** Xóa phiên SDK cũ để không tách contact / dính conversation ẩn danh cũ. */
  function clearSdkStoredSession() {
    deleteCookie("cw_conversation");
    // cw_user_<token>: SDK cache user-hash — nếu trùng sẽ BỎ QUA setUser lần sau
    deleteCookie("cw_user_" + config.websiteToken);
    try {
      Object.keys(localStorage).forEach(function (key) {
        if (key.indexOf("cw_") === 0) localStorage.removeItem(key);
      });
    } catch (error) {
      /* ignore */
    }
  }

  /** Đợi SDK mint token mới sau reset/setUser. */
  function waitForSdkAuthToken(timeoutMs, notEqualTo) {
    var timeout = typeof timeoutMs === "number" ? timeoutMs : 10000;
    var started = Date.now();
    return new Promise(function (resolve) {
      (function check() {
        var token = readSdkAuthToken();
        if (token && token !== notEqualTo) {
          dlog(
            "B6. Đọc được token SDK sau " + (Date.now() - started) + "ms:",
            maskToken(token),
          );
          return resolve(token);
        }
        if (Date.now() - started >= timeout) {
          dlog(
            "B6. TIMEOUT " + timeout + "ms chờ token SDK",
            token
              ? "cookie vẫn là token cũ: " + maskToken(token)
              : "cookie cw_conversation trống",
          );
          return resolve(token || "");
        }
        window.setTimeout(check, 250);
      })();
    });
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
      is_default: isTruthyFlag(raw.is_default || raw.isDefault),
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
        var captureNode = findContactCaptureNode(body);
        if (captureNode) {
          state.contactCapture = normalizeContactCapture(captureNode);
        }
        applyBotReplyFromPayload(body);
        state.loadingPersonas = false;
        return state.quickReplies;
      })
      .catch(function (error) {
        state.loadingPersonas = false;
        console.warn("[omni-default] personas GET failed:", error);
        return state.quickReplies;
      });
  }

  /** POST /public/live-chat/:token/contact — Redis pending trước setUser. */
  function submitLiveChatContact(values) {
    if (!hasContactValues(values)) {
      applySubmittedContact(values);
      dlog("B0b. Bỏ POST /contact — không có name/email/phone, vẫn vào chat");
      return Promise.resolve(null);
    }

    var base = omniApiBase();
    if (!base || !config.websiteToken) {
      return Promise.reject(
        new Error("Thiếu cấu hình API để gửi thông tin liên hệ."),
      );
    }

    var payload = {
      client_session_id: getClientSessionId(),
    };
    if (values.name) payload.name = values.name;
    if (values.email) payload.email = values.email;
    if (values.phone) payload.phone = values.phone;

    var url = personaApiUrl(
      "/public/live-chat/" +
        encodeURIComponent(config.websiteToken) +
        "/contact",
    );

    dlog("B0b. POST /contact", {
      url: url,
      client_session_id_gui_len: payload.client_session_id,
      has_name: Boolean(payload.name),
      has_email: Boolean(payload.email),
      has_phone: Boolean(payload.phone),
    });

    return fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
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
          dlog("B0b. POST /contact THẤT BẠI", {
            status: response.status,
            body: data,
          });
          throw new Error(
            (data && data.message) ||
              "Không gửi được thông tin liên hệ (" + response.status + ")",
          );
        }
        extractClientSessionId(data);
        state.submittedContact = {
          name: values.name || "",
          email: values.email || "",
          phone: values.phone || "",
        };
        state.contactSubmitted = true;
        persistTabSession();
        dlog("B0b. POST /contact OK", {
          client_session_id: getClientSessionId(),
        });
        return data;
      });
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

    dlog("B1. POST personas/select", {
      url: url,
      persona_id: String(persona.id),
      client_session_id_gui_len: getClientSessionId(),
    });

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
          dlog("B1. POST select THẤT BẠI", {
            status: response.status,
            body: data,
          });
          throw new Error(
            (data && data.message) ||
              "Không chọn được đối tượng (" + response.status + ")",
          );
        }
        dlog("B1. POST select OK", {
          status: response.status,
          response: data,
        });
        state.selectedPersonaId = String(persona.id);
        persistTabSession();
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
      persistTabSession();
      return state._clientSessionId;
    }
    return getClientSessionId();
  }

  function hideChatwootDefaultUi() {
    if (document.getElementById("omni-default-hide-cw-style")) return;
    var style = document.createElement("style");
    style.id = "omni-default-hide-cw-style";
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
          installSetUserGuard();
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
        'script[data-omni-default-chatwoot-sdk="1"]',
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
      script.dataset.omniDefaultChatwootSdk = "1";
      script.id = "omni-default-chatwoot-sdk";
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
        installSetUserGuard();
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
   * Đợi phiên SDK mới sẵn sàng sau reset(). Một số bản SDK không bắn lại
   * chatwoot:ready khi reset — khi đó nhận biết bằng cookie cw_conversation
   * xuất hiện token MỚI (khác token trước reset). Cái nào đến trước thì dùng.
   */
  function waitForSdkSessionRenewal(timeoutMs, previousToken) {
    var timeout = typeof timeoutMs === "number" ? timeoutMs : 15000;
    var baseline = chatwootReadyCount;
    var started = Date.now();
    return new Promise(function (resolve) {
      (function check() {
        if (chatwootReadyCount > baseline) {
          return resolve({
            ok: true,
            via: "chatwoot:ready bắn lại",
            elapsedMs: Date.now() - started,
          });
        }
        var token = readSdkAuthToken();
        if (token && token !== previousToken) {
          return resolve({
            ok: true,
            via: "cookie có token mới",
            elapsedMs: Date.now() - started,
          });
        }
        if (Date.now() - started >= timeout) {
          return resolve({
            ok: false,
            via: "timeout",
            elapsedMs: Date.now() - started,
          });
        }
        window.setTimeout(check, 150);
      })();
    });
  }

  /**
   * Tên khách khi không điền form: {tên livechat} #{mã phiên}.
   * Mã lấy từ client_session_id nên ổn định trong tab, khác nhau giữa các khách.
   */
  function guestDisplayName() {
    var livechat = String(
      config.inboxName ||
        config.inbox_name ||
        config.channelName ||
        config.welcomeTitle ||
        config.assistantName ||
        "Livechat",
    ).trim();
    if (!livechat) livechat = "Livechat";
    var session = String(getClientSessionId() || "").replace(
      /[^a-zA-Z0-9]/g,
      "",
    );
    var code = session.slice(-6).toUpperCase();
    if (code.length < 4) {
      code = (Date.now().toString(36) + "0000").slice(-6).toUpperCase();
    }
    return livechat + " #" + code;
  }

  function truthyChatwootUserAttrs(raw) {
    var src = raw && typeof raw === "object" ? raw : {};
    var attrs = {};
    var name = String(src.name || "").trim();
    var email = String(src.email || "").trim();
    var avatar = String(src.avatar_url || "").trim();
    if (name) attrs.name = name;
    if (email) attrs.email = email;
    if (avatar) attrs.avatar_url = avatar;
    if (!attrs.name && !attrs.email && !attrs.avatar_url) {
      attrs.name = guestDisplayName();
    }
    return attrs;
  }

  function buildChatwootUserAttrs() {
    return truthyChatwootUserAttrs(state.submittedContact);
  }

  function installSetUserGuard() {
    var api = window.$chatwoot;
    if (!api || typeof api.setUser !== "function") return;
    if (api.setUser.__omniPatched) return;
    var original = api.setUser;
    function guardedSetUser(identifier, user) {
      var id = identifier;
      if (typeof id !== "string" && typeof id !== "number") {
        id = String(id == null ? getClientSessionId() : id);
      }
      if (id === "") id = getClientSessionId();
      var attrs = truthyChatwootUserAttrs(user);
      try {
        return original.call(api, id, attrs);
      } catch (error) {
        try {
          return original.call(api, String(id), { name: guestDisplayName() });
        } catch (retryError) {
          console.warn("[omni-default] setUser:", retryError);
        }
      }
    }
    guardedSetUser.__omniPatched = true;
    api.setUser = guardedSetUser;
  }

  /**
   * POST select → load SDK lần đầu (sau form/persona) → setUser(client_session_id).
   * Không preload SDK lúc mount: chatwootSDK.run() mint contact ẩn danh (haiku).
   * Không reset() trên phiên vừa mint — reset() tạo thêm một contact ẩn danh nữa.
   */
  function activateChatAfterPersona(persona, selectPayload) {
    var sessionId = extractClientSessionId(selectPayload);
    dlog("B2. client_session_id dùng cho setUser:", sessionId);

    var sdkAlreadyLoaded = Boolean(
      window.$chatwoot && (window.$chatwoot.hasLoaded || state.chatwootReady),
    );
    if (!sdkAlreadyLoaded) {
      var leftoverToken = readSdkAuthToken();
      if (leftoverToken) {
        dlog(
          "B2. Xóa cookie SDK leftover trước khi run() — tránh resume contact ẩn danh cũ",
        );
        clearSdkStoredSession();
      }
    }

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

        dlog("B3. Bỏ phiên REST cũ", {
          token_rest_cu: maskToken(state.authToken),
          da_co_conversation: state.hasConversation,
          sdk_da_load_truoc: sdkAlreadyLoaded,
        });
        disconnectCable(true);
        clearFallbackPolls();
        writeStoredAuth("");
        state.pubsubToken = "";
        state.accountId = null;
        state.hasConversation = false;
        state.messages = [];

        var previousSdkToken = readSdkAuthToken();
        var didReset = false;
        if (sdkAlreadyLoaded && typeof window.$chatwoot.reset === "function") {
          try {
            window.$chatwoot.reset();
            didReset = true;
          } catch (error) {
            console.warn("[omni-default] SDK reset:", error);
          }
          clearSdkStoredSession();
        }
        dlog("B4. Phiên SDK", {
          da_goi_reset: didReset,
          ly_do: didReset
            ? "SDK đã chạy từ trước — reset rồi setUser"
            : "run() lần đầu — không reset (tránh mint contact ẩn danh thứ hai)",
          token_sdk_truoc_reset: maskToken(previousSdkToken),
        });

        // 3) QUAN TRỌNG: sau reset() phải đợi phiên SDK mới sẵn sàng rồi mới
        //    setUser (nếu không lệnh setUser bị iframe nuốt mất). Bản SDK này
        //    không bắn lại chatwoot:ready khi reset → nhận biết thêm bằng
        //    cookie cw_conversation có token mới.
        var waitRenewal = didReset
          ? waitForSdkSessionRenewal(15000, previousSdkToken)
          : Promise.resolve({ ok: true, via: "không reset", elapsedMs: 0 });

        return waitRenewal
          .then(function (renewal) {
            if (didReset) {
              dlog(
                "B5. Phiên SDK mới sau reset: " +
                  (renewal.ok ? "OK" : "TIMEOUT — vẫn gọi setUser") +
                  " (qua: " +
                  renewal.via +
                  ", " +
                  renewal.elapsedMs +
                  "ms)",
              );
            }
            // Nhịp ngắn cho iframe gắn xong listener trước khi nhận set-user
            if (didReset && renewal.ok) {
              return new Promise(function (resolve) {
                window.setTimeout(resolve, 250);
              });
            }
            return undefined;
          })
          .then(function () {
            // 4) setUser — luôn có name/email/avatar_url truthy (SDK lọc chuỗi rỗng)
            installSetUserGuard();
            var userAttrs = buildChatwootUserAttrs();
            dlog("B5. Gọi $chatwoot.setUser", {
              identifier: sessionId,
              name: userAttrs.name || "(không gửi name)",
              email: userAttrs.email || "(không gửi email)",
            });
            window.$chatwoot.setUser(sessionId, userAttrs);
            state._clientSessionId = sessionId;

            // 5) Chờ token phiên SDK (token mới nếu đã reset)
            return waitForSdkAuthToken(12000, didReset ? previousSdkToken : "");
          });
      })
      .then(function (sdkToken) {
        if (sdkToken) {
          // REST dùng chung token với SDK → conversation gắn đúng contact oh_sess_…
          writeStoredAuth(sdkToken);
          dlog("B7. REST adopt token SDK:", maskToken(sdkToken));
        } else {
          console.warn(
            "[omni-default] B7. Không đọc được token phiên SDK — REST sẽ tự mint phiên riêng (SẼ TÁCH CONTACT — đây chính là bug BE báo).",
          );
        }

        state.chatReady = true;
        state.showQuickReplies = false;
        state.showGreeting = false;
        state.error = "";
        persistTabSession();
        render();

        // Lấy pubsub_token / account theo đúng contact đã setUser
        return ensureSession().catch(function (error) {
          console.warn("[omni-default] ensureSession sau setUser:", error);
        });
      })
      .then(function () {
        dlog("B8. Chat sẵn sàng", {
          chatReady: state.chatReady,
          auth_token_rest: maskToken(state.authToken),
          pubsub_token: maskToken(state.pubsubToken),
          account_id: state.accountId,
        });
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

  function isHardcodedInboxGreeting(content) {
    if (!inboxGreeting) return false;
    var left = String(content || "")
      .replace(/\s+/g, " ")
      .trim();
    var right = inboxGreeting.replace(/\s+/g, " ").trim();
    return Boolean(left) && left === right;
  }

  function normalizeMessage(raw) {
    if (!raw || typeof raw !== "object") return null;
    var id = raw.id;
    var content = typeof raw.content === "string" ? raw.content.trim() : "";
    if (!content && !(raw.attachments && raw.attachments.length)) return null;

    var messageType = Number(raw.message_type);
    // 0 = visitor/incoming, 1 = agent/outgoing, 2 = activity
    if (messageType === 2) return null;
    // Bỏ greeting inbox gắn cứng — template persona đã chào + hỏi đầu
    // if (messageType !== 0 && isHardcodedInboxGreeting(content)) return null;

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

  function looksLikeBotType(value) {
    var type = String(value || "").toLowerCase();
    return (
      type === "bot" || type === "agent_bot" || type.indexOf("agent_bot") !== -1
    );
  }

  function isBotSender(raw) {
    if (!raw || typeof raw !== "object") return false;
    if (looksLikeBotType(raw.sender_type)) {
      return true;
    }
    var sender = raw.sender;
    if (sender && typeof sender === "object") {
      if (
        looksLikeBotType(sender.type) ||
        looksLikeBotType(sender.sender_type) ||
        sender.bot === true ||
        sender.agent_bot === true
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * true = có bot trả lời, false = chắc chắn không, null = không rõ.
   * Typing chỉ hiện khi true.
   */
  function detectBotReplyEnabled(value, depth) {
    if (depth > 6 || !value || typeof value !== "object") return null;
    if (Array.isArray(value)) {
      for (var i = 0; i < value.length; i++) {
        if (detectBotReplyEnabled(value[i], depth + 1) === true) return true;
      }
      return null;
    }

    var rec = value;
    var flagKeys = [
      "bot_reply_enabled",
      "botReplyEnabled",
      "chatbot_enabled",
      "chatbotEnabled",
      "bot_enabled",
      "botEnabled",
      "agent_bot_enabled",
      "agentBotEnabled",
    ];
    for (var f = 0; f < flagKeys.length; f++) {
      if (rec[flagKeys[f]] === false) return false;
      if (isTruthyFlag(rec[flagKeys[f]])) return true;
    }

    if (rec.agent_bot === false || rec.agentBot === false) return false;
    if (rec.agent_bot || rec.agentBot || rec.agent_bot_id || rec.agentBotId) {
      return true;
    }

    var assignee = rec.assignee || (rec.meta && rec.meta.assignee) || null;
    if (assignee && typeof assignee === "object") {
      if (
        looksLikeBotType(assignee.type) ||
        looksLikeBotType(assignee.assignee_type)
      ) {
        return true;
      }
    }

    if (isBotSender(rec)) return true;

    var nestedKeys = [
      "data",
      "inbox",
      "channel",
      "messaging",
      "meta",
      "payload",
      "config",
      "website_channel_config",
    ];
    for (var k = 0; k < nestedKeys.length; k++) {
      var nested = detectBotReplyEnabled(rec[nestedKeys[k]], depth + 1);
      if (nested === true) return true;
    }
    return null;
  }

  function applyBotReplyFromPayload(data) {
    var detected = detectBotReplyEnabled(data, 0);
    if (detected === true && !state.botReplyEnabled) {
      state.botReplyEnabled = true;
      persistTabSession();
      dlog("Bot trả lời: BẬT", data);
    }
  }

  function shouldAwaitBotReply() {
    if (
      config.botReplyEnabled === false ||
      config.chatbotEnabled === false ||
      config.chatbot_enabled === false
    ) {
      return false;
    }
    if (
      isTruthyFlag(config.botReplyEnabled) ||
      isTruthyFlag(config.chatbotEnabled) ||
      isTruthyFlag(config.chatbot_enabled)
    ) {
      return true;
    }
    return state.botReplyEnabled === true;
  }

  /** Bật indicator "đang suy nghĩ" — chỉ khi bot được kích hoạt trả lời. */
  function startAwaitingReply() {
    if (!shouldAwaitBotReply()) {
      stopAwaitingReply();
      return;
    }
    state.awaitingReply = true;
    if (awaitingReplyTimer) window.clearTimeout(awaitingReplyTimer);
    awaitingReplyTimer = window.setTimeout(function () {
      awaitingReplyTimer = null;
      if (state.awaitingReply) {
        state.awaitingReply = false;
        renderMessages();
      }
    }, 60000);
    renderMessages();
  }

  function stopAwaitingReply() {
    if (awaitingReplyTimer) {
      window.clearTimeout(awaitingReplyTimer);
      awaitingReplyTimer = null;
    }
    if (state.awaitingReply) {
      state.awaitingReply = false;
      renderMessages();
    }
  }

  function mergeMessages(list) {
    var map = {};
    state.messages.forEach(function (item) {
      map[String(item.id)] = item;
    });
    (list || []).forEach(function (item) {
      if (isBotSender(item)) applyBotReplyFromPayload(item);
      var normalized = normalizeMessage(item);
      if (!normalized) return;
      map[String(normalized.id)] = normalized;
    });

    // Khi đã có tin visitor thật từ server → bỏ bản optimistic local trùng nội dung
    var realVisitorContent = {};
    Object.keys(map).forEach(function (key) {
      var item = map[key];
      if (item && item.fromVisitor && String(item.id).indexOf("local-") !== 0) {
        realVisitorContent[String(item.content || "").trim()] = true;
      }
    });
    Object.keys(map).forEach(function (key) {
      var item = map[key];
      if (
        !item ||
        !item.fromVisitor ||
        String(item.id).indexOf("local-") !== 0
      ) {
        return;
      }
      if (realVisitorContent[String(item.content || "").trim()]) {
        delete map[key];
      }
    });

    state.messages = Object.keys(map)
      .map(function (key) {
        return map[key];
      })
      .sort(function (a, b) {
        return a.createdAt - b.createdAt;
      });

    // Bot vừa trả lời (tin cuối là agent) → tắt "đang suy nghĩ"
    var last = state.messages[state.messages.length - 1];
    if (last && !last.fromVisitor) {
      stopAwaitingReply();
    }
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
    applyBotReplyFromPayload(data);
    persistTabSession();
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
        console.warn("[omni-default] cable subscribe failed:", error);
      }
      return;
    }

    if (payload.type === "confirm_subscription") {
      state.cableConnected = true;
      reconnectAttempt = 0;
      clearFallbackPolls();
      startPresence();
      dlog("Cable: đã subscribe RoomChannel", {
        pubsub_token: maskToken(state.pubsubToken),
        account_id: state.accountId,
      });
      // Sync lại sau khi cable sẵn sàng (bot reply có thể đã về trước đó)
      if (state.hasConversation) fetchMessages();
      return;
    }

    if (payload.type === "ping" || payload.type === "disconnect") return;

    if (payload.type === "reject_subscription") {
      state.cableConnected = false;
      console.warn("[omni-default] cable subscription rejected");
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
        console.warn("[omni-default] cable connect failed:", fallbackError);
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
    // Ưu tiên token phiên SDK (sau setUser) — REST và SDK phải chung 1 contact
    if (!state.authToken) {
      var sdkToken = readSdkAuthToken();
      if (sdkToken) {
        writeStoredAuth(sdkToken);
        dlog("ensureSession: adopt token từ cookie SDK", maskToken(sdkToken));
      }
    }

    if (state.authToken && state.pubsubToken) {
      connectCable();
      return Promise.resolve(state.authToken);
    }

    var hadTokenBefore = Boolean(state.authToken);
    if (!hadTokenBefore) {
      console.warn(
        "[omni-default] ensureSession: KHÔNG có token SDK — POST /widget/config sẽ mint contact ẨN DANH mới (nguy cơ tách contact!).",
      );
    }

    // Có token: gọi config kèm X-Auth-Token để lấy pubsub/account (không mint contact mới).
    // Chưa có token: config sẽ mint phiên mới (fallback).
    return request("POST", "/api/v1/widget/config", {}).then(function (data) {
      var token = extractAuthToken(data) || state.authToken;
      if (!token) throw new Error("Không nhận được auth token từ Omni.");
      dlog("ensureSession: POST /widget/config OK", {
        goi_kem_x_auth_token: hadTokenBefore,
        token_tra_ve: maskToken(extractAuthToken(data)),
        token_dung_tiep: maskToken(token),
        token_doi_khac_truoc: hadTokenBefore && token !== state.authToken,
        contact_trong_response:
          (data && data.contact) || (data && data.payload) || null,
      });
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
          persistTabSession();
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
          console.warn(
            "[omni-default] GET messages bị " +
              error.status +
              " — token REST không hợp lệ, bỏ token.",
          );
          writeStoredAuth("");
          disconnectCable(true);
          state.pubsubToken = "";
        }
      });
  }

  function createConversation(content) {
    dlog("Tạo conversation (POST /widget/conversations)", {
      x_auth_token: maskToken(state.authToken),
      contact_identifier_gui_len: getClientSessionId(),
    });
    var contactName = String(
      (state.submittedContact && state.submittedContact.name) || "",
    ).trim();
    return request("POST", "/api/v1/widget/conversations", {
      contact: {
        name: contactName || guestDisplayName(),
        identifier: getClientSessionId(),
      },
      message: {
        content: content,
        timestamp: new Date().toString(),
        referer_url: window.location.href,
      },
    }).then(function (data) {
      // ==== ĐIỂM VERIFY QUYẾT ĐỊNH: contact của conversation phải có identifier = oh_sess_… ====
      var respContact =
        (data && data.contact) ||
        (data && data.meta && data.meta.sender) ||
        null;
      var respIdentifier = respContact ? respContact.identifier : undefined;
      dlog("Conversation đã tạo — VERIFY contact", {
        conversation_id: data && (data.id || data.display_id),
        contact_id: respContact && respContact.id,
        contact_name: respContact && respContact.name,
        contact_identifier: respIdentifier,
        response_keys: data ? Object.keys(data) : null,
      });
      if (respContact && !respIdentifier) {
        console.warn(
          "[omni-default] ⚠️ Conversation nằm trên contact identifier=null (ẨN DANH) — setUser chưa gắn vào phiên này. Đây chính là bug BE báo.",
        );
      } else if (respIdentifier && respIdentifier !== getClientSessionId()) {
        console.warn(
          "[omni-default] ⚠️ identifier của contact (" +
            respIdentifier +
            ") KHÁC client_session_id (" +
            getClientSessionId() +
            ").",
        );
      }
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

    // Hiện ngay tin visitor (vd: "Tôi là học viên") — template bot sẽ nối sau
    mergeMessages([
      {
        id: "local-out-" + Date.now(),
        content: text,
        message_type: 0,
        created_at: Math.floor(Date.now() / 1000),
      },
    ]);
    startAwaitingReply();
    render();

    return ensureSession()
      .then(function () {
        dlog("Gửi tin nhắn", {
          da_co_conversation: state.hasConversation,
          x_auth_token: maskToken(state.authToken),
        });
        if (state.hasConversation) return sendFollowUp(text);
        return createConversation(text);
      })
      .then(function () {
        // Đã gửi xong — chờ template / reply bot
        startAwaitingReply();
        renderMessages();
        connectCable();
        scheduleFallbackMessagePolls();
        return fetchMessages();
      })
      .catch(function (error) {
        stopAwaitingReply();
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
    if (document.getElementById("omni-default-style")) return;
    var style = document.createElement("style");
    style.id = "omni-default-style";
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
      ".omni-fsel-title{font-size:14px; padding-right: 10px;font-weight:700;color:" +
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
      ".omni-fsel-meta{display:flex;justify-content:flex-start;align-items:baseline;gap:10px;font-size:12px;line-height:1.2;padding:0 4px;margin-bottom:6px;width:fit-content;max-width:100%}" +
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
      ".omni-fsel-contact{flex-shrink:0;margin-bottom:8px}" +
      ".omni-fsel-contact-form{display:flex;flex-direction:column;gap:10px;border:1px solid " +
      THEME.border +
      ";background:#fff;border-radius:12px;padding:12px;box-shadow:0 2px 8px rgba(110,133,250,.08)}" +
      ".omni-fsel-contact-message{font-size:13px;line-height:1.45;color:" +
      THEME.inkBody +
      "}" +
      ".omni-fsel-contact-field{display:flex;flex-direction:column;gap:4px}" +
      ".omni-fsel-contact-label{font-size:12px;font-weight:600;color:" +
      THEME.ink +
      "}" +
      ".omni-fsel-contact-label em{font-style:normal;color:#c2410c;margin-left:2px}" +
      ".omni-fsel-contact-input{border:1px solid " +
      THEME.border +
      ";border-radius:10px;padding:9px 11px;font-size:14px;color:" +
      THEME.ink +
      ";outline:none;background:#fff}" +
      ".omni-fsel-contact-input:focus{border-color:" +
      THEME.borderStrong +
      ";box-shadow:0 0 0 3px rgba(110,133,250,.16)}" +
      ".omni-fsel-contact-submit{border:0;border-radius:12px;padding:10px 12px;font-size:14px;font-weight:700;color:#fff;background:" +
      THEME.primary +
      ";cursor:pointer}" +
      ".omni-fsel-contact-submit:disabled{opacity:.6;cursor:not-allowed}" +
      ".omni-fsel-messages{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:16px;padding-right:2px;-ms-overflow-style:none;scrollbar-width:none}" +
      ".omni-fsel-messages::-webkit-scrollbar{width:0;height:0;display:none}" +
      ".omni-fsel-msg-row{display:flex;flex-direction:column;gap:6px;max-width:88%;width:fit-content}" +
      ".omni-fsel-msg-row.is-agent{align-self:flex-start;align-items:flex-start}" +
      ".omni-fsel-msg-row.is-user{align-self:flex-end;align-items:flex-end}" +
      ".omni-fsel-msg-meta{display:flex;align-items:baseline;gap:10px;font-size:12px;line-height:1.2;padding:0 4px;color:" +
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
      ".omni-fsel-msg strong,.omni-fsel-bubble strong{font-weight:700}" +
      ".omni-fsel-msg em,.omni-fsel-bubble em{font-style:italic}" +
      ".omni-fsel-msg-link{color:#2563eb;text-decoration:underline;underline-offset:2px;word-break:break-all;cursor:pointer}" +
      ".omni-fsel-msg-link:hover{color:#1d4ed8}" +
      ".omni-fsel-msg.is-user .omni-fsel-msg-link{color:#1d4ed8}" +
      ".omni-fsel-msg.is-user .omni-fsel-msg-link:hover{color:#1e40af}" +
      ".omni-fsel-typing{display:flex;align-items:center;gap:5px;min-height:20px}" +
      ".omni-fsel-typing-dot{width:7px;height:7px;border-radius:999px;background:" +
      THEME.muted +
      ";animation:omniFselTyping 1.2s ease-in-out infinite}" +
      ".omni-fsel-typing-dot:nth-child(2){animation-delay:.2s}" +
      ".omni-fsel-typing-dot:nth-child(3){animation-delay:.4s}" +
      "@keyframes omniFselTyping{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}" +
      ".omni-fsel-error{margin-top:8px;font-size:12px;font-weight:500;color:#c2410c;flex-shrink:0}" +
      ".omni-fsel-footer{flex-shrink:0;border-top:1px solid " +
      THEME.border +
      ";background:#fff;padding:12px 16px;position:relative}" +
      ".omni-fsel-quota-wrap{min-height:16px;margin-bottom:8px}" +
      ".omni-fsel-quota{margin:0;text-align:left;font-size:12px;font-weight:500;color:" +
      THEME.muted +
      "}" +
      ".omni-fsel-quota.is-placeholder{visibility:hidden}" +
      ".omni-fsel-composer{position:relative}" +
      ".omni-fsel-input-row{display:flex;gap:8px;align-items:flex-end;margin:0}" +
      ".omni-fsel-input-wrap{flex:1;min-width:0;position:relative;display:flex;align-items:flex-end}" +
      ".omni-fsel-input{flex:1;min-width:0;width:100%;min-height:42px;height:42px;max-height:132px;border:1px solid " +
      THEME.borderStrong +
      ";border-radius:12px;padding:10px 40px 10px 12px;font-size:15px;font-weight:500;line-height:1.45;font-family:inherit;color:" +
      THEME.inkBody +
      ";background:#fff;box-shadow:inset 0 1px 2px rgba(110,133,250,.07);outline:none;pointer-events:auto;caret-color:" +
      THEME.ink +
      ";resize:none;overflow-y:hidden;white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;display:block}" +
      ".omni-fsel-input::placeholder{color:" +
      THEME.muted +
      ";font-size:15px}" +
      ".omni-fsel-input:focus{border-color:" +
      THEME.primary +
      ";box-shadow:0 0 0 3px rgba(110,133,250,.16)}" +
      ".omni-fsel-input:disabled{opacity:.7;cursor:not-allowed}" +
      ".omni-fsel-emoji-btn{position:absolute;right:6px;bottom:7px;width:28px;height:28px;border:0;border-radius:8px;background:transparent;color:" +
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
      ".omni-fsel-send{width:42px;height:42px;border:0;border-radius:12px;background:" +
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
    var input = getComposer();
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
    resizeComposer(input);
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

  function renderContactForm(container) {
    if (!isContactFormStep() || !state.contactCapture) {
      container.style.display = "none";
      return;
    }

    container.style.display = "block";
    var policy = state.contactCapture;
    var policyKey = JSON.stringify({
      message: policy.message,
      fields: policy.fields,
    });
    if (container.getAttribute("data-policy") !== policyKey) {
      var fieldsHtml = enabledContactFields(policy)
        .map(function (field) {
          var inputType =
            field.key === "email"
              ? "email"
              : field.key === "phone"
                ? "tel"
                : "text";
          var autocomplete =
            field.key === "email"
              ? "email"
              : field.key === "phone"
                ? "tel"
                : "name";
          return (
            '<label class="omni-fsel-contact-field">' +
            '<span class="omni-fsel-contact-label">' +
            escapeHtml(field.label) +
            (field.required ? "<em>*</em>" : "") +
            "</span>" +
            '<input class="omni-fsel-contact-input" name="' +
            escapeHtml(field.key) +
            '" type="' +
            inputType +
            '" autocomplete="' +
            autocomplete +
            '"' +
            (field.required ? " required" : "") +
            " />" +
            "</label>"
          );
        })
        .join("");
      container.innerHTML =
        '<form class="omni-fsel-contact-form">' +
        (policy.message
          ? '<p class="omni-fsel-contact-message">' +
            escapeHtml(policy.message) +
            "</p>"
          : "") +
        fieldsHtml +
        '<button type="submit" class="omni-fsel-contact-submit">Tiếp tục</button>' +
        "</form>";
      container.setAttribute("data-policy", policyKey);
      var form = container.querySelector(".omni-fsel-contact-form");
      if (form) {
        form.addEventListener("submit", handleContactFormSubmit);
      }
    }

    var submit = container.querySelector(".omni-fsel-contact-submit");
    var inputs = container.querySelectorAll(".omni-fsel-contact-input");
    var busy = state.submittingContact || state.selectingPersona;
    if (submit) {
      submit.disabled = busy;
      submit.textContent = state.submittingContact
        ? "Đang lưu thông tin…"
        : "Tiếp tục";
    }
    inputs.forEach(function (input) {
      input.disabled = busy;
    });
  }

  function handleContactFormSubmit(event) {
    event.preventDefault();
    if (state.submittingContact || state.selectingPersona || state.chatReady) {
      return;
    }
    var values = readContactFormValues();
    var invalid = validateContactForm(state.contactCapture, values);
    if (invalid) {
      state.error = invalid;
      render();
      return;
    }

    state.submittingContact = true;
    state.error = "";
    render();

    submitLiveChatContact(values)
      .then(function () {
        state.submittingContact = false;
        persistTabSession();
        var autoPersona = autoSelectPersona();
        if (autoPersona) {
          startChatAfterContact(autoPersona);
          return;
        }
        if (!state.quickReplies.length) {
          startChatAfterContact(null);
          return;
        }
        render();
      })
      .catch(function (error) {
        state.submittingContact = false;
        state.contactSubmitted = false;
        state.error =
          (error && error.message) ||
          "Không gửi được thông tin liên hệ. Vui lòng thử lại.";
        console.warn("[omni-default] POST /contact failed:", error);
        render();
      });
  }

  function startChatAfterContact(persona) {
    if (state.selectingPersona || state.sending) return;
    if (persona) {
      dlog("=== BẮT ĐẦU CHỌN PERSONA ===", {
        persona_id: persona.id,
        label: persona.label,
      });
    }
    state.selectingPersona = true;
    state.error = "";
    render();

    var selectPromise = persona
      ? selectLiveChatPersona(persona)
      : Promise.resolve(null);

    selectPromise
      .then(function (selectPayload) {
        return activateChatAfterPersona(persona, selectPayload);
      })
      .then(function () {
        state.selectingPersona = false;
        persistTabSession();
        render();
      })
      .catch(function (error) {
        state.selectingPersona = false;
        state.chatReady = false;
        state.error =
          (error && error.message) ||
          "Không khởi tạo được phiên chat. Thử lại.";
        console.warn("[omni-default] persona activate failed:", error);
        render();
      });
  }

  function renderQuickReplies(container) {
    container.innerHTML = "";
    if (isContactFormStep()) {
      container.style.display = "none";
      return;
    }
    if (canAutoSelectPersona(state.quickReplies) && !state.chatReady) {
      if (!state.selectingPersona) {
        container.style.display = "none";
        return;
      }
    }
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
    startChatAfterContact(persona);
  }

  function renderMessages() {
    var root = document.getElementById(ROOT_ID);
    if (!root) return;
    var list = root.querySelector(".omni-fsel-messages");
    if (!list) return;

    var shouldShowThread =
      !state.showQuickReplies ||
      state.messages.length > 0 ||
      state.awaitingReply;
    list.style.display = shouldShowThread ? "flex" : "none";

    if (!shouldShowThread) {
      list.innerHTML = "";
      return;
    }

    var assistantName = config.assistantName || "Hỗ trợ";
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
          formatMessageHtml(message.content) +
          "</div>" +
          "</div>"
        );
      })
      .join("");

    // Indicator "đang suy nghĩ" — bubble agent với 3 chấm nhấp nháy
    if (state.awaitingReply) {
      html +=
        '<div class="omni-fsel-msg-row is-agent omni-fsel-typing-row">' +
        '<div class="omni-fsel-msg-meta"><span class="omni-fsel-msg-name">' +
        escapeHtml(assistantName) +
        "</span></div>" +
        '<div class="omni-fsel-msg is-agent omni-fsel-typing" aria-label="Đang soạn trả lời">' +
        '<span class="omni-fsel-typing-dot"></span>' +
        '<span class="omni-fsel-typing-dot"></span>' +
        '<span class="omni-fsel-typing-dot"></span>' +
        "</div>" +
        "</div>";
    }

    var nearBottom =
      list.scrollHeight - list.scrollTop - list.clientHeight < 48;
    list.innerHTML = html;
    if (nearBottom || state.sending || state.awaitingReply) {
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
    var input = getComposer();
    if (input && state.open && !state.sending) {
      window.setTimeout(function () {
        input.focus();
        resizeComposer(input);
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
    var contact = root.querySelector(".omni-fsel-contact");
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
        Boolean(prePersonaIntro) &&
        state.showQuickReplies;
      greetingBlock.classList.toggle("is-hidden", !canShowGreeting);
      if (greetingBubble)
        greetingBubble.innerHTML = formatMessageHtml(prePersonaIntro);
      if (greetingTime) greetingTime.textContent = formatTimestamp(new Date());
      if (greetingName) {
        greetingName.textContent = config.assistantName || "Hỗ trợ";
      }
    }

    renderLauncherContent(launcher);
    if (contact) renderContactForm(contact);
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
      resizeComposer(input);
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
      if (!state.chatReady && !state.selectingPersona) {
        maybeContinueAfterPersonas();
      }
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
    var input = getComposer();
    if (!input) return;
    var value = input.value;
    input.value = "";
    resizeComposer(input);
    sendText(value);
  }

  function maybeContinueAfterPersonas() {
    if (state.chatReady || state.selectingPersona) {
      render();
      return;
    }

    if (state.loadingPersonas) {
      render();
      return;
    }

    var needForm = overlayNeedsContactForm(state.contactCapture);
    var autoPersona = autoSelectPersona();

    if (needForm && !state.contactSubmitted) {
      dlog("Hiện form contact_capture — chưa load SDK");
      render();
      return;
    }

    if (!state.open) {
      dlog("Chưa mở panel — hoãn load SDK (tránh mint contact ẩn danh)");
      render();
      return;
    }

    if (autoPersona) {
      dlog("Auto-select persona mặc định", {
        persona_id: autoPersona.id,
        label: autoPersona.label,
      });
      startChatAfterContact(autoPersona);
      return;
    }

    if (!state.quickReplies.length) {
      dlog("Không có persona — vào livechat");
      startChatAfterContact(null);
      return;
    }

    dlog("Hiện picker persona", { count: state.quickReplies.length });
    render();
  }

  function restoreLiveChat() {
    dlog("B0. Restore livechat từ sessionStorage");
    return ensureChatwootSdk()
      .then(function () {
        return waitForChatwootReady(30000);
      })
      .then(function () {
        return ensureSession();
      })
      .then(function () {
        return fetchMessages();
      })
      .then(function () {
        persistTabSession();
        render();
      })
      .catch(function (error) {
        console.warn("[omni-default] restore session failed:", error);
        render();
      });
  }

  function mountWidget() {
    injectStyles();
    var restored = restoreTabSession();
    if (!restored) {
      resetSessionForNewVisit();
    }
    applyBotReplyFromPayload(config);

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
      '<div class="omni-fsel-contact" style="display:none"></div>' +
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
      '<textarea class="omni-fsel-input" rows="1" wrap="soft" autocomplete="off" enterkeyhint="send" aria-label="Soạn tin nhắn"></textarea>' +
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

    var assistantName = config.assistantName || "Hỗ trợ";
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

    var composer = root.querySelector(".omni-fsel-input");
    if (composer) {
      composer.addEventListener("input", function () {
        resizeComposer(composer);
      });
      composer.addEventListener("keydown", function (event) {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          submitComposer(event);
        }
      });
    }

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

    if (restored && state.chatReady) {
      restoreLiveChat();
      return;
    }

    fetchLiveChatPersonas().then(function () {
      maybeContinueAfterPersonas();
    });
  }

  mountWidget();
})();
