// ========== PRESETS ==========
const SYSTEM_PRESETS = {
  default: `You are a helpful, honest, and thoughtful AI assistant, combining the best qualities of Claude (by Anthropic) and ChatGPT (by OpenAI).

Your style:
- Clear, well-structured, and easy to read
- Use markdown (headings, lists, code blocks, bold) when it improves clarity
- Be maximally helpful and thorough, but avoid unnecessary fluff
- Be honest about uncertainty and limitations
- Match the user's language (if they write in Indonesian, reply in Indonesian)
- For complex topics, break things down step by step
- Be warm and professional, never condescending

Always prioritize truthfulness and usefulness.`,

  claude: `You are Claude, an AI assistant created by Anthropic. You are helpful, harmless, and honest.

Your communication style:
- Thoughtful, nuanced, and precise
- Prefer clear structure with headings and bullet points when useful
- Explain reasoning step-by-step for complex topics
- Admit uncertainty rather than guessing
- Be warm but professional
- Avoid being overly verbose or sycophantic
- Match the language the user is using

You aim to be maximally helpful while staying truthful.`,

  chatgpt: `You are ChatGPT, a helpful AI assistant created by OpenAI.

Your style:
- Friendly, conversational, and approachable
- Clear explanations with good structure
- Use examples when they help understanding
- Be enthusiastic and encouraging when appropriate
- Break down complex topics into simple steps
- Use markdown formatting to make answers easy to scan
- Match the language the user writes in

Always try to be as helpful as possible.`
};

// ========== STATE ==========
const state = {
  settings: {
    baseUrl: '',
    apiKey: '',
    model: '',
    systemPrompt: SYSTEM_PRESETS.default,
    stream: true
  },
  chats: [],
  currentChatId: null,
  isGenerating: false,
  theme: 'light'
};

// ========== DOM ==========
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const els = {
  sidebar: $('#sidebar'),
  chatList: $('#chat-list'),
  messages: $('#messages'),
  welcome: $('#welcome'),
  userInput: $('#user-input'),
  btnSend: $('#btn-send'),
  btnNewChat: $('#btn-new-chat'),
  btnSettings: $('#btn-settings'),
  btnCloseSettings: $('#btn-close-settings'),
  btnSaveSettings: $('#btn-save-settings'),
  btnTheme: $('#btn-theme'),
  btnToggleSidebar: $('#btn-toggle-sidebar'),
  btnToggleKey: $('#btn-toggle-key'),
  settingsModal: $('#settings-modal'),
  baseUrl: $('#base-url'),
  apiKey: $('#api-key'),
  modelName: $('#model-name'),
  systemPrompt: $('#system-prompt'),
  streamEnabled: $('#stream-enabled'),
  modelBadge: $('#model-badge'),
  currentChatTitle: $('#current-chat-title'),
  toast: $('#toast')
};

// ========== INIT ==========
function init() {
  loadState();
  applyTheme();
  renderChatList();
  renderMessages();
  updateModelBadge();
  bindEvents();

  // Auto-resize textarea
  els.userInput.addEventListener('input', () => {
    els.userInput.style.height = 'auto';
    els.userInput.style.height = Math.min(els.userInput.scrollHeight, 160) + 'px';
    els.btnSend.disabled = !els.userInput.value.trim() || state.isGenerating;
  });
}

// ========== STORAGE ==========
function loadState() {
  try {
    const saved = localStorage.getItem('claude-clone-state');
    if (saved) {
      const data = JSON.parse(saved);
      state.settings = { ...state.settings, ...data.settings };
      state.chats = data.chats || [];
      state.currentChatId = data.currentChatId || null;
      state.theme = data.theme || 'light';
    }
  } catch (e) {
    console.warn('Gagal load state:', e);
  }

  // Populate form
  els.baseUrl.value = state.settings.baseUrl || '';
  els.apiKey.value = state.settings.apiKey || '';
  els.modelName.value = state.settings.model || '';
  els.systemPrompt.value = state.settings.systemPrompt || '';
  els.streamEnabled.checked = state.settings.stream !== false;
}

function saveState() {
  try {
    localStorage.setItem('claude-clone-state', JSON.stringify({
      settings: state.settings,
      chats: state.chats,
      currentChatId: state.currentChatId,
      theme: state.theme
    }));
  } catch (e) {
    console.warn('Gagal save state:', e);
  }
}

// ========== THEME ==========
function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  const icon = $('#theme-icon');
  if (state.theme === 'dark') {
    icon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`;
  } else {
    icon.innerHTML = `<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>`;
  }
  // Update highlight.js theme
  const hljsTheme = $('#hljs-theme');
  if (hljsTheme) {
    hljsTheme.href = state.theme === 'dark'
      ? 'https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/github-dark.min.css'
      : 'https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/github.min.css';
  }
}

function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  applyTheme();
  saveState();
}

// ========== CHATS ==========
function createNewChat() {
  const id = 'chat_' + Date.now();
  const chat = {
    id,
    title: 'Obrolan Baru',
    messages: [],
    createdAt: Date.now()
  };
  state.chats.unshift(chat);
  state.currentChatId = id;
  saveState();
  renderChatList();
  renderMessages();
  els.userInput.focus();
}

function getCurrentChat() {
  return state.chats.find(c => c.id === state.currentChatId);
}

function switchChat(id) {
  state.currentChatId = id;
  saveState();
  renderChatList();
  renderMessages();
  // Close sidebar on mobile
  els.sidebar.classList.remove('open');
}

function deleteChat(id, e) {
  e.stopPropagation();
  state.chats = state.chats.filter(c => c.id !== id);
  if (state.currentChatId === id) {
    state.currentChatId = state.chats[0]?.id || null;
  }
  saveState();
  renderChatList();
  renderMessages();
}

function updateChatTitle(chat) {
  if (chat.messages.length > 0 && chat.title === 'Obrolan Baru') {
    const firstUser = chat.messages.find(m => m.role === 'user');
    if (firstUser) {
      chat.title = firstUser.content.slice(0, 40) + (firstUser.content.length > 40 ? '…' : '');
    }
  }
}

// ========== RENDER ==========
function renderChatList() {
  els.chatList.innerHTML = '';
  state.chats.forEach(chat => {
    const div = document.createElement('div');
    div.className = 'chat-item' + (chat.id === state.currentChatId ? ' active' : '');
    div.innerHTML = `
      <span class="chat-item-title">${escapeHtml(chat.title)}</span>
      <button class="chat-item-delete" title="Hapus">×</button>
    `;
    div.addEventListener('click', () => switchChat(chat.id));
    div.querySelector('.chat-item-delete').addEventListener('click', (e) => deleteChat(chat.id, e));
    els.chatList.appendChild(div);
  });
}

function renderMessages() {
  const chat = getCurrentChat();
  els.messages.innerHTML = '';

  if (!chat || chat.messages.length === 0) {
    els.messages.appendChild(els.welcome);
    els.currentChatTitle.textContent = 'Claude Clone';
    return;
  }

  els.currentChatTitle.textContent = chat.title;

  chat.messages.forEach((msg, idx) => {
    const div = document.createElement('div');
    div.className = `message ${msg.role}`;
    div.dataset.idx = idx;

    const avatar = msg.role === 'user' ? 'U' : '✦';
    let contentHtml = '';

    if (msg.role === 'assistant') {
      contentHtml = renderMarkdown(msg.content);
    } else {
      contentHtml = `<div class="message-bubble">${escapeHtml(msg.content)}</div>`;
    }

    div.innerHTML = `
      <div class="message-avatar">${avatar}</div>
      <div class="message-content">
        ${msg.role === 'assistant' ? `<div class="message-bubble">${contentHtml}</div>` : contentHtml}
      </div>
    `;
    els.messages.appendChild(div);
  });

  // Highlight code blocks
  els.messages.querySelectorAll('pre code').forEach(block => {
    hljs.highlightElement(block);
  });

  scrollToBottom();
}

function renderMarkdown(text) {
  if (!text) return '';
  try {
    marked.setOptions({
      breaks: true,
      gfm: true,
      highlight: function(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
          return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
      }
    });
    return marked.parse(text);
  } catch (e) {
    return escapeHtml(text);
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    els.messages.scrollTop = els.messages.scrollHeight;
  });
}

function updateModelBadge() {
  els.modelBadge.textContent = state.settings.model
    ? `Model: ${state.settings.model}`
    : 'Model: —';
}

// ========== TOAST ==========
function showToast(msg, duration = 2500) {
  els.toast.textContent = msg;
  els.toast.classList.remove('hidden');
  setTimeout(() => els.toast.classList.add('hidden'), duration);
}

// ========== API CALL ==========
async function sendMessage() {
  const text = els.userInput.value.trim();
  if (!text || state.isGenerating) return;

  // Validate settings
  if (!state.settings.baseUrl || !state.settings.apiKey || !state.settings.model) {
    showToast('Isi Base URL, API Key, dan Model di Pengaturan dulu!');
    openSettings();
    return;
  }

  let chat = getCurrentChat();
  if (!chat) {
    createNewChat();
    chat = getCurrentChat();
  }

  // Add user message
  chat.messages.push({ role: 'user', content: text });
  updateChatTitle(chat);
  els.userInput.value = '';
  els.userInput.style.height = 'auto';
  els.btnSend.disabled = true;
  saveState();
  renderChatList();
  renderMessages();

  // Prepare messages for API
  const apiMessages = [];
  if (state.settings.systemPrompt) {
    apiMessages.push({ role: 'system', content: state.settings.systemPrompt });
  }
  chat.messages.forEach(m => {
    apiMessages.push({ role: m.role, content: m.content });
  });

  state.isGenerating = true;
  els.btnSend.disabled = true;

  // Add placeholder assistant message
  const assistantMsg = { role: 'assistant', content: '' };
  chat.messages.push(assistantMsg);
  renderMessages();

  // Show typing
  const lastMsgEl = els.messages.querySelector('.message.assistant:last-child .message-bubble');
  if (lastMsgEl) {
    lastMsgEl.innerHTML = `<div class="typing"><span></span><span></span><span></span></div>`;
  }

  try {
    const url = state.settings.baseUrl.replace(/\/+$/, '') + '/chat/completions';
    const body = {
      model: state.settings.model,
      messages: apiMessages,
      stream: state.settings.stream
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.settings.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = `Error ${response.status}`;
      try {
        const errJson = JSON.parse(errText);
        errMsg = errJson.error?.message || errJson.message || errText;
      } catch {
        errMsg = errText || errMsg;
      }
      throw new Error(errMsg);
    }

    if (state.settings.stream && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (trimmed.startsWith('data: ')) {
            try {
              const json = JSON.parse(trimmed.slice(6));
              const delta = json.choices?.[0]?.delta?.content || '';
              if (delta) {
                fullContent += delta;
                assistantMsg.content = fullContent;
                // Update UI
                if (lastMsgEl) {
                  lastMsgEl.innerHTML = renderMarkdown(fullContent);
                  lastMsgEl.querySelectorAll('pre code').forEach(b => hljs.highlightElement(b));
                }
                scrollToBottom();
              }
            } catch (e) {
              // ignore parse errors for incomplete chunks
            }
          }
        }
      }
      assistantMsg.content = fullContent || '(tidak ada respons)';
    } else {
      // Non-streaming
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '(tidak ada respons)';
      assistantMsg.content = content;
    }

    saveState();
    renderMessages();
  } catch (err) {
    console.error(err);
    assistantMsg.content = `⚠️ **Error:** ${err.message}`;
    saveState();
    renderMessages();
    showToast('Gagal memanggil API');
  } finally {
    state.isGenerating = false;
    els.btnSend.disabled = !els.userInput.value.trim();
    updateChatTitle(chat);
    renderChatList();
    els.currentChatTitle.textContent = chat.title;
  }
}

// ========== SETTINGS ==========
function openSettings() {
  els.settingsModal.classList.remove('hidden');
  els.baseUrl.value = state.settings.baseUrl || '';
  els.apiKey.value = state.settings.apiKey || '';
  els.modelName.value = state.settings.model || '';
  els.systemPrompt.value = state.settings.systemPrompt || '';
  els.streamEnabled.checked = state.settings.stream !== false;
}

function closeSettings() {
  els.settingsModal.classList.add('hidden');
}

function saveSettings() {
  state.settings.baseUrl = els.baseUrl.value.trim();
  state.settings.apiKey = els.apiKey.value.trim();
  state.settings.model = els.modelName.value.trim();
  state.settings.systemPrompt = els.systemPrompt.value.trim();
  state.settings.stream = els.streamEnabled.checked;
  saveState();
  updateModelBadge();
  closeSettings();
  showToast('Pengaturan disimpan!');
}

// ========== EVENTS ==========
function bindEvents() {
  els.btnNewChat.addEventListener('click', createNewChat);
  els.btnSettings.addEventListener('click', openSettings);
  els.btnCloseSettings.addEventListener('click', closeSettings);
  els.btnSaveSettings.addEventListener('click', saveSettings);
  els.btnTheme.addEventListener('click', toggleTheme);
  els.btnToggleSidebar.addEventListener('click', () => {
    els.sidebar.classList.toggle('open');
  });
  els.btnToggleKey.addEventListener('click', () => {
    const input = els.apiKey;
    input.type = input.type === 'password' ? 'text' : 'password';
  });

  els.btnSend.addEventListener('click', sendMessage);

  els.userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Preset buttons
  document.querySelectorAll('.btn-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.dataset.preset;
      if (SYSTEM_PRESETS[preset]) {
        els.systemPrompt.value = SYSTEM_PRESETS[preset];
        // visual feedback
        document.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }
    });
  });

  // Close modal on backdrop
  els.settingsModal.querySelector('.modal-backdrop').addEventListener('click', closeSettings);

  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 &&
        els.sidebar.classList.contains('open') &&
        !els.sidebar.contains(e.target) &&
        !els.btnToggleSidebar.contains(e.target)) {
      els.sidebar.classList.remove('open');
    }
  });
}

// ========== START ==========
init();
