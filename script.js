/* ═══════════════════════════════════════════
   CodeX AI – Script Engine
   Author: OG Fazal | codexploid
   Version: 4.7.0
═══════════════════════════════════════════ */

'use strict';

// ══ State ══
const State = {
  chats: [],
  activeChat: null,
  settings: {
    theme: 'dark',
    accent: '#a78bfa',
    fontScale: 1,
    animEnabled: true,
    cursorEnabled: true,
    aiMode: 'casual',
    persona: 'assistant',
    responseLength: 'auto',
    memoryEnabled: true,
    autoTitle: true,
    apiEndpoint: 'https://4-7-claude-by-noneusr.vercel.app/claude/4.7/by/noneusrx/?messege=',
    apiKey: '',
    debugEnabled: false,
  },
  pomodoro: {
    running: false,
    phase: 'focus',
    seconds: 25 * 60,
    focusMin: 25,
    breakMin: 5,
    sessions: 0,
    timer: null,
  },
  habits: [],
  tasks: [],
  attachments: [],
  isGenerating: false,
  lastReq: null,
  lastRes: null,
  recording: false,
  recognizer: null,
};

// ══ DOM Shortcuts ══
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

// ══ Boot ══
window.addEventListener('DOMContentLoaded', () => {
  loadState();
  applySettings();
  setTimeout(bootDone, 2000);
});

function bootDone() {
  const boot = $('boot-screen');
  boot.style.opacity = '0';
  boot.style.transition = '0.5s';
  setTimeout(() => {
    boot.style.display = 'none';
    $('app').classList.remove('hidden');
    initApp();
  }, 500);
}

// ══ Init ══
function initApp() {
  initCursor();
  initCanvas();
  initNavbar();
  initSidebar();
  initComposer();
  initWelcome();
  initCmdPalette();
  initSettings();
  initProductivity();
  initDragDrop();
  initKeyboard();
  initVoice();
  renderChatList();
  updateGreeting();
  showToast('🚀 Workspace loaded', 'success');
  document.body.classList.toggle('anim-enabled', State.settings.animEnabled);
}

// ══ State Persistence ══
function loadState() {
  try {
    const s = localStorage.getItem('codex_settings');
    if (s) Object.assign(State.settings, JSON.parse(s));
    const c = localStorage.getItem('codex_chats');
    if (c) State.chats = JSON.parse(c);
    const h = localStorage.getItem('codex_habits');
    if (h) State.habits = JSON.parse(h);
    const t = localStorage.getItem('codex_tasks');
    if (t) State.tasks = JSON.parse(t);
    const p = localStorage.getItem('codex_pom');
    if (p) {
      const pp = JSON.parse(p);
      State.pomodoro.sessions = pp.sessions || 0;
    }
  } catch(e) { console.warn('Load state error', e); }
}

function saveSettings() {
  localStorage.setItem('codex_settings', JSON.stringify(State.settings));
}

function saveChats() {
  localStorage.setItem('codex_chats', JSON.stringify(State.chats));
}

function saveHabits() {
  localStorage.setItem('codex_habits', JSON.stringify(State.habits));
}

function saveTasks() {
  localStorage.setItem('codex_tasks', JSON.stringify(State.tasks));
}

// ══ Apply Settings ══
function applySettings() {
  const s = State.settings;
  document.documentElement.setAttribute('data-theme', s.theme);
  document.documentElement.style.setProperty('--font-scale', s.fontScale);
  document.documentElement.style.setProperty('--accent', s.accent);
  // Derive glow colors
  const hexToRgb = hex => {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return {r,g,b};
  };
  const c = hexToRgb(s.accent);
  document.documentElement.style.setProperty('--accent-glow', `rgba(${c.r},${c.g},${c.b},0.25)`);
  document.body.classList.toggle('anim-enabled', s.animEnabled);
  $('cursor').style.display = s.cursorEnabled && s.animEnabled ? 'block' : 'none';
  $('cursor-trail').style.display = s.cursorEnabled && s.animEnabled ? 'block' : 'none';
  // Sync settings UI
  syncSettingsUI();
}

function syncSettingsUI() {
  const s = State.settings;
  // Theme cards
  $$('.theme-card').forEach(c => c.classList.toggle('active', c.dataset.theme === s.theme));
  // Accent
  $$('.accent-dot').forEach(d => d.classList.toggle('active', d.dataset.color === s.accent));
  // Font scale
  if ($('font-scale')) $('font-scale').value = Math.round(s.fontScale * 100);
  if ($('anim-toggle')) $('anim-toggle').checked = s.animEnabled;
  if ($('cursor-toggle')) $('cursor-toggle').checked = s.cursorEnabled;
  if ($('memory-toggle')) $('memory-toggle').checked = s.memoryEnabled;
  if ($('autotitle-toggle')) $('autotitle-toggle').checked = s.autoTitle;
  if ($('default-mode-select')) $('default-mode-select').value = s.aiMode;
  if ($('api-endpoint')) $('api-endpoint').value = s.apiEndpoint;
  if ($('api-key-input')) $('api-key-input').value = s.apiKey;
  if ($('debug-toggle')) {
    $('debug-toggle').checked = s.debugEnabled;
    $('debug-panel')?.classList.toggle('hidden', !s.debugEnabled);
  }
  // Persona
  $$('.persona-card').forEach(c => c.classList.toggle('active', c.dataset.persona === s.persona));
  // Length
  $$('.len-btn').forEach(b => b.classList.toggle('active', b.dataset.len === s.responseLength));
  // AI mode select
  if ($('ai-mode-select')) $('ai-mode-select').value = s.aiMode;
  // Theme icon
  const isDark = ['dark','midnight','purple','ocean'].includes(s.theme);
  $$('.icon-dark').forEach(i => i.style.display = isDark ? 'block' : 'none');
  $$('.icon-light').forEach(i => i.style.display = isDark ? 'none' : 'block');
}

// ══ Custom Cursor ══
function initCursor() {
  const cursor = $('cursor');
  const trail = $('cursor-trail');
  let mx = 0, my = 0;
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top = my + 'px';
    trail.style.left = mx + 'px';
    trail.style.top = my + 'px';
  });
  document.addEventListener('mousedown', () => cursor.style.transform = 'translate(-50%,-50%) scale(0.7)');
  document.addEventListener('mouseup', () => cursor.style.transform = 'translate(-50%,-50%) scale(1)');
  document.querySelectorAll('button,a,input,textarea,select,[role="button"],[data-prompt]').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.style.transform = 'translate(-50%,-50%) scale(1.6)');
    el.addEventListener('mouseleave', () => cursor.style.transform = 'translate(-50%,-50%) scale(1)');
  });
}

// ══ Ambient Canvas ══
function initCanvas() {
  const canvas = $('ambient-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, orbs = [];
  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    orbs = Array.from({length: 4}, (_, i) => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      r: 200 + Math.random() * 200,
      color: i % 2 === 0 ? [167,139,250] : [56,189,248],
      opacity: 0.03 + Math.random() * 0.04,
    }));
  }
  resize();
  window.addEventListener('resize', resize);
  let raf;
  function draw() {
    ctx.clearRect(0, 0, W, H);
    orbs.forEach(o => {
      o.x += o.vx; o.y += o.vy;
      if (o.x < -o.r) o.x = W + o.r;
      if (o.x > W + o.r) o.x = -o.r;
      if (o.y < -o.r) o.y = H + o.r;
      if (o.y > H + o.r) o.y = -o.r;
      const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
      g.addColorStop(0, `rgba(${o.color.join(',')},${o.opacity})`);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    });
    raf = requestAnimationFrame(draw);
  }
  draw();
}

// ══ Navbar ══
function initNavbar() {
  // Sidebar toggle
  $('sidebar-toggle').addEventListener('click', () => {
    $('sidebar').classList.toggle('collapsed');
  });

  // Theme toggle
  $('theme-toggle').addEventListener('click', () => {
    const themes = ['dark','light','midnight','purple','ocean'];
    const cur = State.settings.theme;
    const next = themes[(themes.indexOf(cur) + 1) % themes.length];
    State.settings.theme = next;
    saveSettings();
    applySettings();
    showToast(`Theme: ${next}`, 'success');
  });

  // Settings nav btn
  $('settings-nav-btn').addEventListener('click', () => openModal('settings-overlay'));
  $('pd-settings').addEventListener('click', () => { closeProfileMenu(); openModal('settings-overlay'); });

  // Profile dropdown
  $('profile-btn').addEventListener('click', e => {
    e.stopPropagation();
    $('profile-menu').classList.toggle('open');
    $('ws-dropdown') && document.querySelector('.workspace-switcher')?.classList.remove('open');
  });
  document.addEventListener('click', () => {
    $('profile-menu').classList.remove('open');
    document.querySelector('.workspace-switcher')?.classList.remove('open');
    $('notif-panel')?.classList.add('hidden');
  });

  // Workspace switcher
  const wsSwitcher = document.querySelector('.workspace-switcher');
  wsSwitcher.addEventListener('click', e => {
    e.stopPropagation();
    wsSwitcher.classList.toggle('open');
  });
  $$('.ws-item[data-ws]').forEach(item => {
    item.addEventListener('click', () => {
      $$('.ws-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      document.querySelector('.ws-name').textContent = item.dataset.ws;
      wsSwitcher.classList.remove('open');
      showToast(`Switched to ${item.dataset.ws} workspace`);
    });
  });

  // New chat btn
  $('new-chat-btn').addEventListener('click', createNewChat);

  // Notifications
  $('notif-btn').addEventListener('click', e => {
    e.stopPropagation();
    $('notif-panel').classList.toggle('hidden');
  });
  $('notif-panel').addEventListener('click', e => e.stopPropagation());
  $('notif-clear').addEventListener('click', () => {
    $('np-list').innerHTML = '<div style="padding:20px;text-align:center;color:var(--text3);font-size:13px;">No notifications</div>';
    $('notif-btn').querySelector('.notif-badge').style.display = 'none';
  });

  // Global search
  $('global-search-btn').addEventListener('click', openCmdPalette);

  // Clear data
  $('pd-clear').addEventListener('click', () => {
    if (confirm('Clear all data? This cannot be undone.')) clearAllData();
  });
}

function closeProfileMenu() {
  $('profile-menu').classList.remove('open');
}

// ══ Update Greeting ══
function updateGreeting() {
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const el = document.querySelector('.welcome-title');
  if (el) el.textContent = `${greet}, OG Fazal`;
}

// ══ Sidebar ══
function initSidebar() {
  $('new-chat-sidebar').addEventListener('click', createNewChat);
  $('sidebar-search').addEventListener('input', e => renderChatList(e.target.value));
  $('toggle-productivity-panel').addEventListener('click', () => {
    const pp = $('productivity-panel');
    pp.classList.toggle('hidden');
    if (!pp.classList.contains('hidden')) initProductivityPanel();
  });
  $('open-dev-mode').addEventListener('click', () => {
    $('dev-panel-float').classList.toggle('hidden');
    updateDevPanel();
  });
  $('dev-panel-close').addEventListener('click', () => $('dev-panel-float').classList.add('hidden'));
  $('pp-close').addEventListener('click', () => $('productivity-panel').classList.add('hidden'));
}

function renderChatList(search = '') {
  const list = $('chat-list');
  list.innerHTML = '';
  const q = search.toLowerCase();
  const filtered = q ? State.chats.filter(c => c.title.toLowerCase().includes(q)) : State.chats;

  // Group: Today, Yesterday, Older
  const now = Date.now();
  const day = 86400000;
  const groups = { Today: [], Yesterday: [], 'This Week': [], Older: [] };
  filtered.forEach(c => {
    const d = now - c.timestamp;
    if (d < day) groups['Today'].push(c);
    else if (d < 2 * day) groups['Yesterday'].push(c);
    else if (d < 7 * day) groups['This Week'].push(c);
    else groups['Older'].push(c);
  });

  let hasAny = false;
  Object.entries(groups).forEach(([label, chats]) => {
    if (!chats.length) return;
    hasAny = true;
    const gl = document.createElement('div');
    gl.className = 'chat-group-label';
    gl.textContent = label;
    list.appendChild(gl);
    chats.forEach(c => list.appendChild(buildChatItem(c)));
  });

  if (!hasAny) {
    list.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text3);font-size:13px;">${search ? 'No results' : 'No chats yet'}</div>`;
  }
}

function buildChatItem(chat) {
  const el = document.createElement('div');
  el.className = 'chat-item' + (State.activeChat?.id === chat.id ? ' active' : '');
  el.dataset.id = chat.id;
  el.innerHTML = `
    <span class="chat-item-icon">${getModeEmoji(chat.mode)}</span>
    <span class="chat-item-title">${escHtml(chat.title)}</span>
    ${chat.pinned ? '<span class="chat-item-pin">📌</span>' : ''}
    <div class="chat-item-actions">
      <button class="cia-btn" title="Pin" data-action="pin">📌</button>
      <button class="cia-btn" title="Rename" data-action="rename">✏️</button>
      <button class="cia-btn" title="Delete" data-action="delete">🗑</button>
    </div>
  `;
  el.addEventListener('click', e => {
    if (!e.target.closest('.chat-item-actions')) loadChat(chat.id);
  });
  el.querySelectorAll('.cia-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      handleChatAction(btn.dataset.action, chat.id);
    });
  });
  return el;
}

function handleChatAction(action, id) {
  const chat = State.chats.find(c => c.id === id);
  if (!chat) return;
  if (action === 'pin') {
    chat.pinned = !chat.pinned;
    saveChats();
    renderChatList();
    showToast(chat.pinned ? '📌 Pinned' : 'Unpinned');
  } else if (action === 'rename') {
    const name = prompt('Rename chat:', chat.title);
    if (name?.trim()) {
      chat.title = name.trim();
      saveChats();
      renderChatList();
      if ($('chat-title') && State.activeChat?.id === id) $('chat-title').textContent = chat.title;
    }
  } else if (action === 'delete') {
    State.chats = State.chats.filter(c => c.id !== id);
    saveChats();
    if (State.activeChat?.id === id) {
      State.activeChat = null;
      showWelcome();
    }
    renderChatList();
    showToast('Chat deleted', 'error');
  }
}

// ══ Chat Management ══
function createNewChat() {
  const id = 'chat_' + Date.now();
  const chat = {
    id,
    title: 'New Chat',
    messages: [],
    timestamp: Date.now(),
    mode: $('ai-mode-select')?.value || State.settings.aiMode,
    pinned: false,
  };
  State.chats.unshift(chat);
  saveChats();
  loadChat(id);
  renderChatList();
}

function loadChat(id) {
  const chat = State.chats.find(c => c.id === id);
  if (!chat) return;
  State.activeChat = chat;
  showChatArea();
  $('chat-title').textContent = chat.title;
  $('ch-mode-badge').textContent = getModeLabel(chat.mode);
  if ($('ai-mode-select')) $('ai-mode-select').value = chat.mode;
  renderMessages();
  renderChatList();
  setTimeout(() => scrollToBottom(), 50);
}

function showWelcome() {
  $('welcome-screen').classList.remove('hidden');
  $('chat-area').classList.add('hidden');
}

function showChatArea() {
  $('welcome-screen').classList.add('hidden');
  $('chat-area').classList.remove('hidden');
}

function renderMessages() {
  const msgs = $('messages');
  msgs.innerHTML = '';
  if (!State.activeChat) return;
  if (State.activeChat.messages.length === 0) {
    msgs.innerHTML = `<div style="padding:40px 0;text-align:center;color:var(--text3);font-size:14px;">Send a message to start the conversation.</div>`;
    return;
  }
  State.activeChat.messages.forEach((m, i) => {
    msgs.appendChild(buildMessage(m, i));
  });
  // Context bar
  if (State.activeChat.messages.length > 2) {
    const cb = document.createElement('div');
    cb.className = 'context-bar';
    cb.innerHTML = `<span class="ctx-dot"></span> ${State.activeChat.messages.length} messages in context`;
    msgs.appendChild(cb);
  }
}

function buildMessage(msg, idx) {
  const isUser = msg.role === 'user';
  const el = document.createElement('div');
  el.className = 'message';
  el.dataset.idx = idx;

  const time = new Date(msg.timestamp || Date.now()).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});

  el.innerHTML = `
    <div class="message-header">
      <div class="msg-avatar ${isUser ? 'user-av' : 'ai-av'}">
        ${isUser ? 'OG' : '<div class="ai-av-inner"></div>'}
      </div>
      <span class="msg-name">${isUser ? 'You' : 'CodeX AI'}</span>
      <span class="msg-time">${time}</span>
      ${msg.favorite ? '<span class="msg-fav-indicator">⭐</span>' : ''}
    </div>
    <div class="message-body">
      <div class="msg-text">${isUser ? escHtml(msg.content).replace(/\n/g,'<br>') : renderMarkdown(msg.content)}</div>
      ${msg.error ? `<div class="error-message">⚠️ ${escHtml(msg.error)}</div>` : ''}
    </div>
    <div class="message-actions">
      <button class="ma-btn" data-action="copy">📋 Copy</button>
      ${!isUser ? `<button class="ma-btn" data-action="retry">🔄 Retry</button>` : `<button class="ma-btn" data-action="edit">✏️ Edit</button>`}
      <button class="ma-btn fav ${msg.favorite ? 'active' : ''}" data-action="fav">⭐ ${msg.favorite ? 'Saved' : 'Save'}</button>
      <button class="ma-btn" data-action="delete">🗑</button>
      ${!isUser ? '<button class="ma-btn" data-action="speak">🔊 Speak</button>' : ''}
    </div>
    ${!isUser && idx === (State.activeChat?.messages.length || 0) - 1 ? buildFollowups() : ''}
  `;

  el.querySelectorAll('.ma-btn').forEach(btn => {
    btn.addEventListener('click', () => handleMessageAction(btn.dataset.action, idx));
  });

  el.querySelectorAll('.followup-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      $('prompt-input').value = chip.textContent;
      sendMessage();
    });
  });

  // Copy code blocks
  el.querySelectorAll('.code-copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const pre = btn.closest('.code-block-wrap')?.querySelector('pre');
      if (pre) {
        navigator.clipboard.writeText(pre.textContent);
        btn.textContent = '✓ Copied';
        setTimeout(() => btn.textContent = 'Copy', 1500);
      }
    });
  });

  return el;
}

function buildFollowups() {
  const suggestions = generateFollowups();
  if (!suggestions.length) return '';
  return `<div class="followups">${suggestions.map(s => `<button class="followup-chip">${escHtml(s)}</button>`).join('')}</div>`;
}

function generateFollowups() {
  const mode = State.activeChat?.mode || 'casual';
  const pools = {
    casual: ['Tell me more', 'Give an example', 'Simplify this', 'Why is this important?'],
    study: ['Explain with diagram', 'Give practice problems', 'Create flashcards', 'Summarize key points'],
    coding: ['Show alternative approach', 'Add error handling', 'Write tests', 'Optimize this code'],
    research: ['Cite sources', 'Counter-arguments', 'Latest developments', 'Key statistics'],
    creative: ['Continue the story', 'Different perspective', 'Make it darker', 'Add more detail'],
    deep: ['Challenge this assumption', 'First principles', 'Edge cases', 'Historical context'],
  };
  const pool = pools[mode] || pools.casual;
  return pool.slice(0, 3);
}

function handleMessageAction(action, idx) {
  const msg = State.activeChat?.messages[idx];
  if (!msg) return;
  if (action === 'copy') {
    navigator.clipboard.writeText(msg.content);
    showToast('📋 Copied to clipboard', 'success');
  } else if (action === 'fav') {
    msg.favorite = !msg.favorite;
    saveChats();
    renderMessages();
    showToast(msg.favorite ? '⭐ Saved to favorites' : 'Removed from favorites');
  } else if (action === 'delete') {
    if (State.activeChat) {
      State.activeChat.messages.splice(idx, 1);
      saveChats();
      renderMessages();
    }
  } else if (action === 'retry') {
    // Remove last AI message and resend
    if (State.activeChat && idx > 0) {
      const userMsg = State.activeChat.messages[idx - 1];
      State.activeChat.messages.splice(idx, 1);
      saveChats();
      renderMessages();
      sendToAI(userMsg.content);
    }
  } else if (action === 'edit') {
    const newContent = prompt('Edit message:', msg.content);
    if (newContent?.trim()) {
      msg.content = newContent.trim();
      // Remove subsequent messages
      State.activeChat.messages.splice(idx + 1);
      saveChats();
      renderMessages();
      sendToAI(newContent.trim());
    }
  } else if (action === 'speak') {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(msg.content.replace(/[*#`]/g, ''));
      utt.rate = 0.95;
      window.speechSynthesis.speak(utt);
      showToast('🔊 Speaking...');
    }
  }
}

// ══ Welcome Screen ══
function initWelcome() {
  $$('.mode-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      $$('.mode-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      State.settings.aiMode = pill.dataset.mode;
      if ($('ai-mode-select')) $('ai-mode-select').value = pill.dataset.mode;
      saveSettings();
    });
  });

  $$('.bento-card').forEach(card => {
    card.addEventListener('click', () => {
      const prompt = card.dataset.prompt;
      if (prompt) {
        createNewChat();
        setTimeout(() => {
          $('prompt-input').value = prompt;
          sendMessage();
        }, 100);
      }
    });
  });
}

// ══ Composer ══
function initComposer() {
  const input = $('prompt-input');
  const sendBtn = $('send-btn');

  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 200) + 'px';
    autoSaveDraft();
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  sendBtn.addEventListener('click', sendMessage);

  // Restore draft
  const draft = sessionStorage.getItem('codex_draft');
  if (draft) { input.value = draft; input.dispatchEvent(new Event('input')); }

  // Mode select
  $('ai-mode-select').addEventListener('change', e => {
    State.settings.aiMode = e.target.value;
    if (State.activeChat) {
      State.activeChat.mode = e.target.value;
      $('ch-mode-badge').textContent = getModeLabel(e.target.value);
      saveChats();
    }
    saveSettings();
  });

  // Prompt library
  $('prompt-lib-btn').addEventListener('click', openPromptLibrary);

  // Attach
  $('attach-btn').addEventListener('click', () => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.multiple = true;
    inp.accept = 'image/*,.pdf,.txt,.md,.json,.js,.py,.html,.css';
    inp.addEventListener('change', () => {
      Array.from(inp.files).forEach(addAttachment);
    });
    inp.click();
  });

  // Split toggle
  $('toggle-split').addEventListener('click', () => {
    const notes = $('notes-panel');
    notes.classList.toggle('hidden');
    if (!notes.classList.contains('hidden')) {
      $('notes-area').value = localStorage.getItem('codex_notes') || '';
    }
  });
  $('close-notes').addEventListener('click', () => $('notes-panel').classList.add('hidden'));
  $('notes-area').addEventListener('input', () => {
    localStorage.setItem('codex_notes', $('notes-area').value);
  });

  // Clear chat
  $('clear-chat-btn').addEventListener('click', () => {
    if (State.activeChat && confirm('Clear this chat?')) {
      State.activeChat.messages = [];
      saveChats();
      renderMessages();
    }
  });

  // Summarize
  $('summarize-btn').addEventListener('click', summarizeChat);

  // Chat title edit
  $('chat-title').addEventListener('dblclick', function() {
    this.contentEditable = 'true';
    this.focus();
  });
  $('chat-title').addEventListener('blur', function() {
    this.contentEditable = 'false';
    if (State.activeChat) {
      State.activeChat.title = this.textContent.trim() || 'New Chat';
      saveChats();
      renderChatList();
    }
  });
}

let draftTimer = null;
function autoSaveDraft() {
  clearTimeout(draftTimer);
  draftTimer = setTimeout(() => {
    sessionStorage.setItem('codex_draft', $('prompt-input').value);
  }, 400);
}

function addAttachment(file) {
  if (State.attachments.length >= 4) { showToast('Max 4 files', 'warning'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    const att = { name: file.name, size: file.size, type: file.type, data: e.target.result };
    State.attachments.push(att);
    renderAttachPreview();
  };
  reader.readAsDataURL(file);
}

function renderAttachPreview() {
  const prev = $('attach-preview');
  prev.innerHTML = State.attachments.map((a, i) => `
    <div class="attach-item">
      ${a.type.startsWith('image') ? '🖼' : '📄'} ${escHtml(a.name)}
      <button class="attach-remove" data-idx="${i}">✕</button>
    </div>
  `).join('');
  prev.querySelectorAll('.attach-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      State.attachments.splice(parseInt(btn.dataset.idx), 1);
      renderAttachPreview();
    });
  });
}

async function sendMessage() {
  if (State.isGenerating) return;
  const input = $('prompt-input');
  const text = input.value.trim();
  if (!text && !State.attachments.length) return;

  // Ensure active chat
  if (!State.activeChat) createNewChat();

  // Clear input
  input.value = '';
  input.style.height = 'auto';
  sessionStorage.removeItem('codex_draft');
  State.attachments = [];
  renderAttachPreview();

  // Add user message
  const userMsg = {
    role: 'user',
    content: text,
    timestamp: Date.now(),
    id: 'msg_' + Date.now(),
  };
  State.activeChat.messages.push(userMsg);

  // Auto-title
  if (State.settings.autoTitle && State.activeChat.title === 'New Chat' && text.length > 5) {
    State.activeChat.title = text.slice(0, 42) + (text.length > 42 ? '...' : '');
    $('chat-title').textContent = State.activeChat.title;
    renderChatList();
  }

  saveChats();
  showChatArea();
  renderMessages();
  scrollToBottom();

  await sendToAI(text);
}

async function sendToAI(prompt) {
  State.isGenerating = true;
  $('send-btn').disabled = true;

  // Build context
  const mode = State.activeChat?.mode || State.settings.aiMode;
  const modeInstructions = {
    casual: 'Be conversational, friendly, and helpful.',
    study: 'Be educational. Use structured explanations, examples, and summaries. Use markdown for clarity.',
    coding: 'Provide clean, well-commented code. Use code blocks with language labels. Explain the logic.',
    research: 'Be thorough and analytical. Cite concepts, provide structured insights, consider multiple angles.',
    creative: 'Be imaginative, vivid, and original. Embrace creative writing with strong narrative voice.',
    deep: 'Think step by step. Challenge assumptions, explore edge cases, use first principles reasoning.',
  };

  const sysHint = `You are CodeX AI, an elite AI assistant. ${modeInstructions[mode] || ''} Use markdown formatting when helpful. Keep responses well-structured and clear.`;

  // History context (last 6 messages)
  const history = State.activeChat?.messages.slice(-7) || [];
  const fullPrompt = [
    `[System: ${sysHint}]`,
    ...history.slice(0, -1).map(m => `[${m.role === 'user' ? 'User' : 'Assistant'}]: ${m.content}`),
    `[User]: ${prompt}`
  ].join('\n\n');

  // Show typing
  showTypingIndicator();

  // Debug
  State.lastReq = { prompt: fullPrompt.slice(0, 300), mode, endpoint: State.settings.apiEndpoint };

  try {
    const url = State.settings.apiEndpoint + encodeURIComponent(fullPrompt);
    const res = await fetch(url);

    if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);

    let text = await res.text();
    text = text.trim();
    if (!text) throw new Error('Empty response from API');

    State.lastRes = text.slice(0, 300);
    updateDevPanel();

    hideTypingIndicator();

    // Add AI message with streaming reveal
    const aiMsg = {
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      id: 'msg_' + Date.now(),
    };
    State.activeChat.messages.push(aiMsg);
    saveChats();
    renderMessages();

    // Stream reveal
    await streamReveal(text, aiMsg);

    // Auto-title refinement for quality
    if (State.settings.autoTitle && State.activeChat.title.length > 40 && State.activeChat.messages.length === 2) {
      const words = prompt.split(' ').slice(0, 5).join(' ');
      State.activeChat.title = words.length > 3 ? words : State.activeChat.title;
      $('chat-title').textContent = State.activeChat.title;
      renderChatList();
    }

  } catch(err) {
    hideTypingIndicator();
    const errMsg = {
      role: 'assistant',
      content: 'I encountered an issue connecting to the AI service.',
      error: err.message,
      timestamp: Date.now(),
      id: 'msg_' + Date.now(),
    };
    State.activeChat?.messages.push(errMsg);
    saveChats();
    renderMessages();
    showToast('⚠️ API Error: ' + err.message, 'error');
    console.error('AI error:', err);
  }

  State.isGenerating = false;
  $('send-btn').disabled = false;
  scrollToBottom();
}

async function streamReveal(text, msg) {
  return new Promise(resolve => {
    const msgs = $('messages');
    const lastEl = msgs.lastElementChild;
    if (!lastEl) { resolve(); return; }

    const textEl = lastEl.querySelector('.msg-text');
    if (!textEl) { msg.content = text; resolve(); return; }

    textEl.classList.add('streaming-cursor');

    const chunkSize = 4;
    let i = 0;
    const total = text.length;

    function step() {
      if (i >= total) {
        textEl.classList.remove('streaming-cursor');
        textEl.innerHTML = renderMarkdown(text);
        msg.content = text;
        saveChats();

        // Wire code copy btns
        textEl.querySelectorAll('.code-copy-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const pre = btn.closest('.code-block-wrap')?.querySelector('pre');
            if (pre) {
              navigator.clipboard.writeText(pre.textContent);
              btn.textContent = '✓ Copied';
              setTimeout(() => btn.textContent = 'Copy', 1500);
            }
          });
        });

        // Append followups
        const lastMsgEl = $('messages').lastElementChild;
        if (lastMsgEl) {
          const prev = lastMsgEl.querySelector('.followups');
          if (prev) prev.remove();
          const fuDiv = document.createElement('div');
          fuDiv.innerHTML = buildFollowups();
          lastMsgEl.appendChild(fuDiv.firstElementChild || document.createElement('div'));
          fuDiv.querySelector && lastMsgEl.querySelectorAll('.followup-chip').forEach(chip => {
            chip.addEventListener('click', () => {
              $('prompt-input').value = chip.textContent;
              sendMessage();
            });
          });
        }
        resolve();
        return;
      }
      const chunk = text.slice(0, i + chunkSize);
      textEl.innerHTML = escHtml(chunk).replace(/\n/g,'<br>');
      i += chunkSize;
      scrollToBottom();
      setTimeout(step, 8);
    }
    step();
  });
}

function showTypingIndicator() {
  const msgs = $('messages');
  const ti = document.createElement('div');
  ti.id = 'typing-indicator';
  ti.className = 'message';
  ti.innerHTML = `
    <div class="message-header">
      <div class="msg-avatar ai-av"><div class="ai-av-inner"></div></div>
      <span class="msg-name">CodeX AI</span>
    </div>
    <div class="thinking-bar">
      <span></span><span></span><span></span><span></span><span></span>
    </div>
    <div class="typing-dots">
      <span></span><span></span><span></span>
    </div>
  `;
  msgs.appendChild(ti);
  scrollToBottom();
}

function hideTypingIndicator() {
  $('typing-indicator')?.remove();
}

function scrollToBottom() {
  const wrap = $('messages-wrap');
  if (wrap) wrap.scrollTop = wrap.scrollHeight;
}

async function summarizeChat() {
  if (!State.activeChat || State.activeChat.messages.length < 2) {
    showToast('Not enough messages to summarize', 'warning');
    return;
  }
  const content = State.activeChat.messages.slice(-10).map(m => `${m.role}: ${m.content}`).join('\n');
  showToast('Summarizing...', 'success');
  try {
    const url = State.settings.apiEndpoint + encodeURIComponent(`Provide a brief 2-3 sentence summary of this conversation:\n\n${content}`);
    const res = await fetch(url);
    const text = await res.text();
    showToast('📋 ' + text.slice(0, 80));
  } catch(e) {
    showToast('Could not summarize', 'error');
  }
}

// ══ Markdown ══
function renderMarkdown(text) {
  if (!text) return '';
  let html = escHtml(text);

  // Code blocks
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    return `<div class="code-block-wrap"><div class="code-block-header"><span class="code-lang">${lang || 'code'}</span><button class="code-copy-btn">Copy</button></div><pre>${code.trim()}</pre></div>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_\n]+)_/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // Blockquote
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr>');

  // Unordered list
  html = html.replace(/^[\*\-] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');

  // Ordered list
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

  // Tables
  html = html.replace(/\|(.+)\|\n\|[\-\| :]+\|\n((?:\|.+\|\n?)*)/g, (_, header, rows) => {
    const ths = header.split('|').filter(c => c.trim()).map(c => `<th>${c.trim()}</th>`).join('');
    const trs = rows.trim().split('\n').map(row => {
      const tds = row.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('');
      return `<tr>${tds}</tr>`;
    }).join('');
    return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
  });

  // Paragraphs (convert double newlines)
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';

  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p>(<h[1-3]>)/g, '$1');
  html = html.replace(/(<\/h[1-3]>)<\/p>/g, '$1');
  html = html.replace(/<p>(<ul>)/g, '$1');
  html = html.replace(/(<\/ul>)<\/p>/g, '$1');
  html = html.replace(/<p>(<table>)/g, '$1');
  html = html.replace(/(<\/table>)<\/p>/g, '$1');
  html = html.replace(/<p>(<blockquote>)/g, '$1');
  html = html.replace(/(<\/blockquote>)<\/p>/g, '$1');
  html = html.replace(/<p>(<div class="code-block)/g, '$1');
  html = html.replace(/(<\/div>)<\/p>/g, '$1');
  html = html.replace(/<p>(<hr>)<\/p>/g, '$1');

  // Single newlines to br inside paragraphs
  html = html.replace(/([^>])\n([^<])/g, '$1<br>$2');

  return html;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ══ Command Palette ══
function initCmdPalette() {
  const overlay = $('cmd-overlay');
  const input = $('cmd-input');
  let selectedIdx = 0;

  const commands = [
    { icon: '💬', title: 'New Chat', desc: 'Start a fresh conversation', kbd: 'N', action: createNewChat },
    { icon: '🎨', title: 'Toggle Theme', desc: 'Switch between themes', kbd: 'T', action: () => $('theme-toggle').click() },
    { icon: '⚙️', title: 'Open Settings', desc: 'Configure your workspace', kbd: ',', action: () => openModal('settings-overlay') },
    { icon: '📚', title: 'Prompt Library', desc: 'Browse prompt templates', action: openPromptLibrary },
    { icon: '⚡', title: 'Productivity Panel', desc: 'Pomodoro, habits, tasks', action: () => $('toggle-productivity-panel').click() },
    { icon: '📝', title: 'Toggle Notes', desc: 'Open scratchpad', action: () => $('toggle-split').click() },
    { icon: '🗑', title: 'Clear Current Chat', desc: 'Delete all messages', action: () => $('clear-chat-btn').click() },
    { icon: '📤', title: 'Export Chats', desc: 'Download chat history', action: exportChats },
    { icon: '🔊', title: 'Stop Speech', desc: 'Cancel text-to-speech', action: () => window.speechSynthesis?.cancel() },
    { icon: '📊', title: 'Summarize Chat', desc: 'Get conversation summary', action: summarizeChat },
    { icon: '💬', title: 'Mode: Casual', desc: 'Switch AI to casual mode', action: () => setMode('casual') },
    { icon: '📚', title: 'Mode: Study', desc: 'Switch AI to study mode', action: () => setMode('study') },
    { icon: '⚡', title: 'Mode: Coding', desc: 'Switch AI to coding mode', action: () => setMode('coding') },
    { icon: '🔬', title: 'Mode: Research', desc: 'Switch AI to research mode', action: () => setMode('research') },
  ];

  function setMode(m) {
    State.settings.aiMode = m;
    if ($('ai-mode-select')) $('ai-mode-select').value = m;
    if (State.activeChat) State.activeChat.mode = m;
    saveSettings(); saveChats();
    showToast(`Mode: ${getModeLabel(m)}`);
  }

  function renderResults(q) {
    const results = $('cmd-results');
    results.innerHTML = '';
    const filtered = q ? commands.filter(c => c.title.toLowerCase().includes(q.toLowerCase()) || (c.desc||'').toLowerCase().includes(q.toLowerCase())) : commands;

    if (!filtered.length) {
      results.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text3);font-size:13px;">No results for "${q}"</div>`;
      return;
    }

    const label = document.createElement('div');
    label.className = 'cmd-section-label';
    label.textContent = q ? 'Results' : 'Commands';
    results.appendChild(label);

    filtered.slice(0, 10).forEach((cmd, i) => {
      const item = document.createElement('div');
      item.className = 'cmd-item' + (i === selectedIdx ? ' selected' : '');
      item.innerHTML = `
        <div class="cmd-item-icon">${cmd.icon}</div>
        <div class="cmd-item-info">
          <div class="cmd-item-title">${cmd.title}</div>
          ${cmd.desc ? `<div class="cmd-item-desc">${cmd.desc}</div>` : ''}
        </div>
        ${cmd.kbd ? `<kbd class="cmd-item-kbd">${cmd.kbd}</kbd>` : ''}
      `;
      item.addEventListener('click', () => { closeCmdPalette(); cmd.action?.(); });
      results.appendChild(item);
    });
    selectedIdx = 0;
    updateSelection(results);
  }

  function updateSelection(container) {
    const items = container.querySelectorAll('.cmd-item');
    items.forEach((el, i) => el.classList.toggle('selected', i === selectedIdx));
    items[selectedIdx]?.scrollIntoView({ block: 'nearest' });
  }

  input.addEventListener('input', () => { selectedIdx = 0; renderResults(input.value); });
  input.addEventListener('keydown', e => {
    const items = $('cmd-results').querySelectorAll('.cmd-item');
    if (e.key === 'ArrowDown') { e.preventDefault(); selectedIdx = (selectedIdx + 1) % items.length; updateSelection($('cmd-results')); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); selectedIdx = (selectedIdx - 1 + items.length) % items.length; updateSelection($('cmd-results')); }
    else if (e.key === 'Enter') { const sel = items[selectedIdx]; if (sel) sel.click(); }
    else if (e.key === 'Escape') closeCmdPalette();
  });

  overlay.addEventListener('click', e => { if (e.target === overlay) closeCmdPalette(); });
  renderResults('');
}

function openCmdPalette() {
  $('cmd-overlay').classList.remove('hidden');
  setTimeout(() => $('cmd-input').focus(), 50);
  $('cmd-input').value = '';
  $('cmd-input').dispatchEvent(new Event('input'));
}
function closeCmdPalette() {
  $('cmd-overlay').classList.add('hidden');
}

// ══ Settings Modal ══
function initSettings() {
  // Nav tabs
  $$('.sn-item').forEach(item => {
    item.addEventListener('click', () => {
      $$('.sn-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      $$('.settings-tab').forEach(t => t.classList.remove('active'));
      $('tab-' + item.dataset.tab)?.classList.add('active');
    });
  });

  // Theme cards
  $$('.theme-card').forEach(card => {
    card.addEventListener('click', () => {
      State.settings.theme = card.dataset.theme;
      saveSettings();
      applySettings();
      showToast(`Theme: ${card.dataset.theme}`, 'success');
    });
  });

  // Accent dots
  $$('.accent-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      State.settings.accent = dot.dataset.color;
      saveSettings();
      applySettings();
    });
  });

  // Font scale
  $('font-scale').addEventListener('input', e => {
    State.settings.fontScale = parseInt(e.target.value) / 100;
    document.documentElement.style.setProperty('--font-scale', State.settings.fontScale);
    saveSettings();
  });

  // Toggles
  $('anim-toggle').addEventListener('change', e => {
    State.settings.animEnabled = e.target.checked;
    document.body.classList.toggle('anim-enabled', e.target.checked);
    saveSettings();
  });
  $('cursor-toggle').addEventListener('change', e => {
    State.settings.cursorEnabled = e.target.checked;
    $('cursor').style.display = e.target.checked ? 'block' : 'none';
    $('cursor-trail').style.display = e.target.checked ? 'block' : 'none';
    saveSettings();
  });
  $('memory-toggle').addEventListener('change', e => { State.settings.memoryEnabled = e.target.checked; saveSettings(); });
  $('autotitle-toggle').addEventListener('change', e => { State.settings.autoTitle = e.target.checked; saveSettings(); });
  $('debug-toggle').addEventListener('change', e => {
    State.settings.debugEnabled = e.target.checked;
    $('debug-panel')?.classList.toggle('hidden', !e.target.checked);
    saveSettings();
  });

  // Persona
  $$('.persona-card').forEach(c => {
    c.addEventListener('click', () => {
      $$('.persona-card').forEach(p => p.classList.remove('active'));
      c.classList.add('active');
      State.settings.persona = c.dataset.persona;
      saveSettings();
    });
  });

  // Default mode
  $('default-mode-select').addEventListener('change', e => {
    State.settings.aiMode = e.target.value;
    saveSettings();
  });

  // Length
  $$('.len-btn').forEach(b => {
    b.addEventListener('click', () => {
      $$('.len-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      State.settings.responseLength = b.dataset.len;
      saveSettings();
    });
  });

  // API endpoint
  $('api-endpoint').addEventListener('change', e => { State.settings.apiEndpoint = e.target.value.trim(); saveSettings(); });
  $('api-key-input').addEventListener('change', e => { State.settings.apiKey = e.target.value.trim(); saveSettings(); });

  // Export theme
  $('export-theme-btn').addEventListener('click', () => {
    const theme = {
      theme: State.settings.theme,
      accent: State.settings.accent,
      fontScale: State.settings.fontScale,
    };
    downloadJSON(theme, 'codex-theme.json');
    showToast('Theme exported!', 'success');
  });

  // Data
  $('export-chats-btn').addEventListener('click', exportChats);
  $('import-chats-btn').addEventListener('click', () => $('import-file').click());
  $('import-file').addEventListener('change', importChats);
  $('clear-all-btn').addEventListener('click', () => {
    if (confirm('This will erase all chats, settings and data. Are you sure?')) clearAllData();
  });

  // Close
  $('settings-close').addEventListener('click', () => closeModal('settings-overlay'));
  $('settings-overlay').addEventListener('click', e => { if (e.target.id === 'settings-overlay') closeModal('settings-overlay'); });

  // Update storage info
  updateStorageInfo();
}

function updateStorageInfo() {
  try {
    let total = 0;
    for (let key in localStorage) { if (key.startsWith('codex')) total += (localStorage[key] || '').length * 2; }
    const kb = (total / 1024).toFixed(1);
    const pct = Math.min((total / (5 * 1024 * 1024)) * 100, 100);
    $('storage-bar').style.width = pct + '%';
    $('storage-info').textContent = `Used: ${kb} KB of 5 MB`;
  } catch(e) {}
}

function exportChats() {
  downloadJSON(State.chats, 'codex-chats.json');
  showToast('📤 Chats exported!', 'success');
}

function importChats(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (Array.isArray(data)) {
        State.chats = [...data, ...State.chats];
        saveChats();
        renderChatList();
        showToast('📥 Chats imported!', 'success');
      } else throw new Error('Invalid format');
    } catch(err) { showToast('Import failed: ' + err.message, 'error'); }
  };
  reader.readAsText(file);
}

function clearAllData() {
  Object.keys(localStorage).filter(k => k.startsWith('codex')).forEach(k => localStorage.removeItem(k));
  sessionStorage.clear();
  State.chats = [];
  State.activeChat = null;
  State.habits = [];
  State.tasks = [];
  showWelcome();
  renderChatList();
  showToast('All data cleared', 'success');
  location.reload();
}

// ══ Prompt Library ══
const PROMPTS = [
  { cat: 'Study', title: 'Explain Simply', text: 'Explain [topic] in simple terms as if I\'m 15 years old, with a real-world analogy.' },
  { cat: 'Study', title: 'Study Plan', text: 'Create a 30-day study plan for [subject] with daily topics and revision schedule.' },
  { cat: 'Study', title: 'Quiz Me', text: 'Generate 10 multiple-choice questions on [topic] with answers and explanations.' },
  { cat: 'Coding', title: 'Code Review', text: 'Review this code for bugs, performance issues, and best practices: [paste code]' },
  { cat: 'Coding', title: 'Build Feature', text: 'Build a [feature] in [language] with clean code, error handling, and comments.' },
  { cat: 'Coding', title: 'Debug Help', text: 'Debug this error and explain the root cause: [error/code]' },
  { cat: 'Creative', title: 'Write Story', text: 'Write a short story about [theme] with vivid characters and unexpected twist.' },
  { cat: 'Creative', title: 'Blog Post', text: 'Write an engaging blog post about [topic] with a catchy title and clear structure.' },
  { cat: 'Research', title: 'Deep Analysis', text: 'Provide a comprehensive analysis of [topic] covering history, current state, challenges, and future.' },
  { cat: 'Research', title: 'Compare', text: 'Compare and contrast [A] vs [B] across multiple dimensions with a summary table.' },
  { cat: 'Productivity', title: 'Action Plan', text: 'Create a detailed action plan to achieve [goal] with milestones and daily tasks.' },
  { cat: 'Productivity', title: 'Decision Framework', text: 'Help me decide between [options] using a structured decision framework.' },
];

function openPromptLibrary() {
  const modal = $('prompt-lib-overlay');
  modal.classList.remove('hidden');
  const cats = [...new Set(PROMPTS.map(p => p.cat))];
  const catDiv = $('pl-categories');
  catDiv.innerHTML = ['All', ...cats].map(c => `<button class="pl-cat ${c==='All'?'active':''}" data-cat="${c}">${c}</button>`).join('');
  catDiv.querySelectorAll('.pl-cat').forEach(btn => {
    btn.addEventListener('click', () => {
      catDiv.querySelectorAll('.pl-cat').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderPrompts(btn.dataset.cat, $('pl-search').value);
    });
  });
  $('pl-search').addEventListener('input', () => {
    const activeCat = catDiv.querySelector('.pl-cat.active')?.dataset.cat || 'All';
    renderPrompts(activeCat, $('pl-search').value);
  });
  $('prompt-lib-close').addEventListener('click', () => closeModal('prompt-lib-overlay'));
  $('prompt-lib-overlay').addEventListener('click', e => { if (e.target.id === 'prompt-lib-overlay') closeModal('prompt-lib-overlay'); });
  renderPrompts('All', '');
}

function renderPrompts(cat, search) {
  const grid = $('pl-grid');
  const filtered = PROMPTS.filter(p =>
    (cat === 'All' || p.cat === cat) &&
    (!search || p.title.toLowerCase().includes(search.toLowerCase()) || p.text.toLowerCase().includes(search.toLowerCase()))
  );
  grid.innerHTML = filtered.map(p => `
    <div class="pl-card" data-text="${escHtml(p.text)}">
      <div class="pl-card-title">${escHtml(p.title)}</div>
      <div class="pl-card-text">${escHtml(p.text)}</div>
    </div>
  `).join('') || '<div style="padding:20px;color:var(--text3);font-size:13px;">No prompts found</div>';
  grid.querySelectorAll('.pl-card').forEach(card => {
    card.addEventListener('click', () => {
      $('prompt-input').value = card.dataset.text;
      $('prompt-input').dispatchEvent(new Event('input'));
      closeModal('prompt-lib-overlay');
      $('prompt-input').focus();
    });
  });
}

// ══ Productivity ══
function initProductivity() {
  // Pomodoro
  $('pom-start').addEventListener('click', togglePomodoro);
  $('pom-reset').addEventListener('click', resetPomodoro);
  $('pom-focus').addEventListener('change', e => {
    State.pomodoro.focusMin = parseInt(e.target.value) || 25;
    if (!State.pomodoro.running && State.pomodoro.phase === 'focus') {
      State.pomodoro.seconds = State.pomodoro.focusMin * 60;
      updatePomDisplay();
    }
  });
  $('pom-break').addEventListener('change', e => {
    State.pomodoro.breakMin = parseInt(e.target.value) || 5;
  });

  // PP tabs
  $$('.pp-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.pp-tab').forEach(t => t.classList.remove('active'));
      $$('.pp-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      $('ptab-' + tab.dataset.ptab)?.classList.add('active');
    });
  });

  // Habits
  $('habit-add-btn').addEventListener('click', addHabit);
  $('habit-input').addEventListener('keydown', e => { if (e.key === 'Enter') addHabit(); });

  // Tasks
  $('task-add-btn').addEventListener('click', addTask);
  $('task-input').addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });

  renderHabits();
  renderTasks();
}

function initProductivityPanel() {
  updatePomDisplay();
  renderHabits();
  renderTasks();
}

function togglePomodoro() {
  const pom = State.pomodoro;
  pom.running = !pom.running;
  $('pom-start').textContent = pom.running ? '⏸ Pause' : '▶ Start';
  if (pom.running) {
    pom.timer = setInterval(() => {
      pom.seconds--;
      updatePomDisplay();
      if (pom.seconds <= 0) {
        pom.running = false;
        clearInterval(pom.timer);
        $('pom-start').textContent = '▶ Start';
        if (pom.phase === 'focus') {
          pom.sessions++;
          $('pom-count').textContent = pom.sessions;
          localStorage.setItem('codex_pom', JSON.stringify({sessions: pom.sessions}));
          pom.phase = 'break';
          pom.seconds = pom.breakMin * 60;
          showToast('🍅 Focus done! Take a break.', 'success');
          $('pom-phase').textContent = 'Break';
        } else {
          pom.phase = 'focus';
          pom.seconds = pom.focusMin * 60;
          $('pom-phase').textContent = 'Focus';
          showToast('⚡ Break over! Back to work.', 'success');
        }
        updatePomDisplay();
      }
    }, 1000);
  } else {
    clearInterval(pom.timer);
  }
}

function resetPomodoro() {
  clearInterval(State.pomodoro.timer);
  State.pomodoro.running = false;
  State.pomodoro.phase = 'focus';
  State.pomodoro.seconds = State.pomodoro.focusMin * 60;
  $('pom-start').textContent = '▶ Start';
  $('pom-phase').textContent = 'Focus';
  updatePomDisplay();
}

function updatePomDisplay() {
  const s = State.pomodoro.seconds;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  $('pom-time').textContent = `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  const total = (State.pomodoro.phase === 'focus' ? State.pomodoro.focusMin : State.pomodoro.breakMin) * 60;
  const frac = 1 - (s / total);
  const circum = 2 * Math.PI * 52;
  const offset = circum * (1 - frac);
  const prog = $('pom-progress');
  if (prog) prog.style.strokeDashoffset = offset;
}

function addHabit() {
  const val = $('habit-input').value.trim();
  if (!val) return;
  State.habits.push({ id: Date.now(), text: val, done: false });
  saveHabits();
  renderHabits();
  $('habit-input').value = '';
}

function renderHabits() {
  const list = $('habits-list');
  if (!list) return;
  list.innerHTML = State.habits.map(h => `
    <div class="habit-item ${h.done ? 'done' : ''}" data-id="${h.id}">
      <input type="checkbox" class="habit-cb" ${h.done ? 'checked' : ''} aria-label="${h.text}" />
      <span>${escHtml(h.text)}</span>
      <button class="habit-del" title="Delete">✕</button>
    </div>
  `).join('') || '<div style="font-size:13px;color:var(--text3);padding:8px 0;">No habits yet</div>';
  list.querySelectorAll('.habit-cb').forEach(cb => {
    cb.addEventListener('change', () => {
      const id = parseInt(cb.closest('.habit-item').dataset.id);
      const h = State.habits.find(h => h.id === id);
      if (h) { h.done = cb.checked; saveHabits(); renderHabits(); }
    });
  });
  list.querySelectorAll('.habit-del').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.closest('.habit-item').dataset.id);
      State.habits = State.habits.filter(h => h.id !== id);
      saveHabits();
      renderHabits();
    });
  });
}

function addTask() {
  const val = $('task-input').value.trim();
  if (!val) return;
  State.tasks.push({ id: Date.now(), text: val, done: false });
  saveTasks();
  renderTasks();
  $('task-input').value = '';
}

function renderTasks() {
  const list = $('tasks-list');
  if (!list) return;
  list.innerHTML = State.tasks.map(t => `
    <div class="task-item ${t.done ? 'done' : ''}" data-id="${t.id}">
      <input type="checkbox" class="task-cb" ${t.done ? 'checked' : ''} aria-label="${t.text}" />
      <span>${escHtml(t.text)}</span>
      <button class="task-del" title="Delete">✕</button>
    </div>
  `).join('') || '<div style="font-size:13px;color:var(--text3);padding:8px 0;">No tasks yet</div>';
  list.querySelectorAll('.task-cb').forEach(cb => {
    cb.addEventListener('change', () => {
      const id = parseInt(cb.closest('.task-item').dataset.id);
      const t = State.tasks.find(t => t.id === id);
      if (t) { t.done = cb.checked; saveTasks(); renderTasks(); }
    });
  });
  list.querySelectorAll('.task-del').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.closest('.task-item').dataset.id);
      State.tasks = State.tasks.filter(t => t.id !== id);
      saveTasks();
      renderTasks();
    });
  });
}

// ══ Drag & Drop ══
function initDragDrop() {
  const box = $('composer-box');
  const overlay = $('drop-overlay');
  let dragCount = 0;

  document.addEventListener('dragenter', e => {
    if (e.dataTransfer?.types.includes('Files')) {
      dragCount++;
      overlay.classList.remove('hidden');
    }
  });
  document.addEventListener('dragleave', () => {
    dragCount--;
    if (dragCount <= 0) { dragCount = 0; overlay.classList.add('hidden'); }
  });
  document.addEventListener('dragover', e => e.preventDefault());
  document.addEventListener('drop', e => {
    e.preventDefault();
    dragCount = 0;
    overlay.classList.add('hidden');
    if (e.dataTransfer.files.length) {
      Array.from(e.dataTransfer.files).slice(0, 4).forEach(addAttachment);
      showToast(`${e.dataTransfer.files.length} file(s) attached`);
    }
  });
}

// ══ Keyboard Shortcuts ══
function initKeyboard() {
  document.addEventListener('keydown', e => {
    const ctrl = e.ctrlKey || e.metaKey;

    // Cmd+K – command palette
    if (ctrl && e.key === 'k') { e.preventDefault(); openCmdPalette(); return; }
    // Cmd+N – new chat
    if (ctrl && e.key === 'n') { e.preventDefault(); createNewChat(); return; }
    // Cmd+, – settings
    if (ctrl && e.key === ',') { e.preventDefault(); openModal('settings-overlay'); return; }
    // Escape
    if (e.key === 'Escape') {
      closeCmdPalette();
      closeModal('settings-overlay');
      closeModal('prompt-lib-overlay');
      closeModal('feedback-overlay');
      return;
    }
    // F11 fullscreen
    if (e.key === 'F11') {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen();
      else document.exitFullscreen();
      return;
    }
  });
}

// ══ Voice ══
function initVoice() {
  const btn = $('voice-btn');
  if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    btn.title = 'Voice not supported in this browser';
    btn.style.opacity = '0.4';
    return;
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  btn.addEventListener('click', () => {
    if (State.recording) {
      State.recognizer?.stop();
      State.recording = false;
      btn.classList.remove('recording');
      return;
    }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-IN';
    rec.onresult = e => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
      $('prompt-input').value = transcript;
      $('prompt-input').dispatchEvent(new Event('input'));
    };
    rec.onend = () => {
      State.recording = false;
      btn.classList.remove('recording');
    };
    rec.onerror = () => {
      State.recording = false;
      btn.classList.remove('recording');
      showToast('Voice input error', 'error');
    };
    rec.start();
    State.recognizer = rec;
    State.recording = true;
    btn.classList.add('recording');
    showToast('🎤 Listening...', 'success');
  });
}

// ══ Dev Panel ══
function updateDevPanel() {
  const dp = $('dp-endpoint');
  if (dp) dp.textContent = State.settings.apiEndpoint.slice(8, 40) + '...';
  if ($('dp-req')) $('dp-req').textContent = JSON.stringify(State.lastReq, null, 2) || '—';
  if ($('dp-res')) $('dp-res').textContent = State.lastRes || '—';
  if ($('debug-req')) $('debug-req').textContent = JSON.stringify(State.lastReq, null, 2) || '—';
  if ($('debug-res')) $('debug-res').textContent = State.lastRes || '—';
}

// ══ Modal Helpers ══
function openModal(id) {
  $(id)?.classList.remove('hidden');
  if (id === 'settings-overlay') updateStorageInfo();
}
function closeModal(id) {
  $(id)?.classList.add('hidden');
}

// ══ Toast ══
function showToast(msg, type = '') {
  const c = $('toast-container');
  const t = document.createElement('div');
  t.className = 'toast' + (type ? ' ' + type : '');
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => {
    t.classList.add('out');
    setTimeout(() => t.remove(), 300);
  }, 2800);
}

// ══ Utils ══
function getModeEmoji(mode) {
  const map = { casual:'💬', study:'📚', coding:'⚡', research:'🔬', creative:'🎨', deep:'🧠' };
  return map[mode] || '💬';
}
function getModeLabel(mode) {
  const map = { casual:'💬 Casual', study:'📚 Study', coding:'⚡ Coding', research:'🔬 Research', creative:'🎨 Creative', deep:'🧠 Deep Think' };
  return map[mode] || '💬 Casual';
}

function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
