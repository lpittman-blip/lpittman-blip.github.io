/* Presentation only. Authentication and conversations stay in workspace.js. */
(() => {
  'use strict';
  const view = document.getElementById('view-chat');
  if (!view) return;
  const sidebar = view.querySelector('.chat > aside');
  const convo = view.querySelector('.convo');
  const top = view.querySelector('.workspace-top');
  const box = view.querySelector('.msgs');
  const form = view.querySelector('#composer');
  const input = document.getElementById('prompt');
  const send = form?.querySelector('.send');
  if (!sidebar || !convo || !top || !box || !form) return;

  const make = (tag, cls, text) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text !== undefined) el.textContent = text;
    return el;
  };
  const action = (label, handler, cls) => {
    const el = make('button', cls, label);
    el.type = 'button';
    el.addEventListener('click', handler);
    return el;
  };

  const railHead = make('div', 'experience-rail-head');
  const brand = make('a', 'brand');
  brand.href = '../';
  brand.append(mark(), document.createTextNode('Artemis'));
  const close = action('×', () => setOpen(false), 'experience-sidebar-close');
  close.setAttribute('aria-label', 'Close chat history');
  railHead.append(brand, close);
  sidebar.prepend(railHead);
  sidebar.id = 'experience-history';

  const menu = action('☰', () => setOpen(!open), 'experience-menu');
  menu.setAttribute('aria-label', 'Open chat history');
  menu.setAttribute('aria-controls', sidebar.id);
  menu.setAttribute('aria-expanded', 'false');
  top.prepend(menu);

  const mini = document.createElement('canvas');
  mini.className = 'orb orb-mini';
  mini.setAttribute('data-orb', 'agent');
  mini.setAttribute('aria-hidden', 'true');
  mini.width = 128;
  mini.height = 128;
  menu.after(mini);

  const historyLabel = make('p', 'experience-history-label', 'Your conversations');
  sidebar.querySelector('.session-list')?.before(historyLabel);
  const links = make('nav', 'experience-rail-links');
  links.setAttribute('aria-label', 'Workspace navigation');
  function navigate(name) {
    setOpen(false, false);
    document.querySelector('#navLinks [data-go="' + name + '"]')?.click();
  }
  links.append(action('Products', () => navigate('products')), action('Your account', () => navigate('account')));
  const support = make('a', '', 'Help & support');
  support.href = 'mailto:support@artemisai-bycutlineindustries.studio';
  links.append(support);
  const motion = document.getElementById('experience-motion');
  if (motion) links.append(motion);
  sidebar.append(links, make('p', 'experience-rail-footer', 'BY CUTLINE INDUSTRIES'));

  const veil = action('', () => setOpen(false), 'experience-veil');
  veil.setAttribute('aria-label', 'Close chat history');
  veil.tabIndex = -1;
  document.body.append(veil);

  let open = false, priorFocus = null;
  const narrow = matchMedia('(max-width: 899px)');
  function setOpen(value, restore = true) {
    const next = narrow.matches && !view.hidden && value;
    if (next && !open) priorFocus = document.activeElement;
    open = next;
    document.body.classList.toggle('experience-sidebar-open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close chat history' : 'Open chat history');
    sidebar.inert = narrow.matches && !open;
    sidebar.setAttribute('aria-hidden', String(narrow.matches && !open));
    convo.inert = open;
    if (open) {
      sidebar.setAttribute('role', 'dialog');
      sidebar.setAttribute('aria-modal', 'true');
      close.focus();
    } else {
      sidebar.removeAttribute('role');
      sidebar.removeAttribute('aria-modal');
      if (restore && priorFocus?.isConnected && !view.hidden) priorFocus.focus();
      priorFocus = null;
    }
  }
  narrow.addEventListener('change', () => setOpen(false, false));
  document.addEventListener('keydown', event => {
    if (view.hidden) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      const search = sidebar.querySelector('.session-search');
      if (search?.disabled) { view.querySelector('.workspace-account')?.click(); return; }
      if (narrow.matches && !open) setOpen(true);
      search?.focus();
    }
    if (!open) return;
    if (event.key === 'Escape') { event.preventDefault(); setOpen(false); }
    if (event.key === 'Tab') {
      const items = [...sidebar.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled])')].filter(el => !el.hidden && el.getClientRects().length);
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  });
  sidebar.addEventListener('click', event => {
    if (narrow.matches && (event.target.closest('.c') || event.target.closest('.new'))) setOpen(false, false);
  });

  const voice = view.querySelector('.workspace-voice');
  if (voice?.children.length) {
    const settings = make('details', 'experience-read-aloud');
    settings.append(make('summary', '', 'Voices'));
    voice.before(settings);
    settings.append(voice);
  }

  const banner = make('p', 'offline-banner', 'You are offline. The composer stays put — messages send when you reconnect.');
  banner.setAttribute('role', 'status');
  form.before(banner);
  const net = () => document.body.classList.toggle('is-offline', !navigator.onLine);
  addEventListener('online', net);
  addEventListener('offline', net);
  net();

  const jump = action('Latest', () => { box.scrollTop = box.scrollHeight; }, 'jump');
  jump.setAttribute('aria-label', 'Scroll to latest message');
  jump.hidden = true;
  form.before(jump);
  box.addEventListener('scroll', () => {
    const welcome = box.querySelector('.workspace-welcome');
    jump.hidden = !!welcome || box.scrollHeight - box.scrollTop - box.clientHeight < 140;
  }, { passive: true });

  if (window.visualViewport) {
    const pin = () => {
      const vv = window.visualViewport;
      const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      document.documentElement.style.setProperty('--kb', kb + 'px');
    };
    visualViewport.addEventListener('resize', pin);
    visualViewport.addEventListener('scroll', pin);
    pin();
  }

  const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (Speech && input && send) {
    const mic = action('', () => {}, 'mic');
    mic.setAttribute('aria-label', 'Dictate a message');
    mic.setAttribute('aria-pressed', 'false');
    mic.setAttribute('data-track', 'chat_mic');
    mic.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4"/></svg>';
    send.before(mic);
    let rec = null, on = false, base = '';
    mic.addEventListener('click', () => {
      if (on) { try { rec.stop(); } catch (e) {} return; }
      rec = new Speech();
      rec.lang = navigator.language || 'en-US';
      rec.interimResults = true;
      rec.continuous = false;
      base = input.value;
      rec.onstart = () => {
        on = true;
        document.body.classList.add('is-listening');
        mic.setAttribute('aria-pressed', 'true');
        document.body.dataset.amp = '0.7';
      };
      rec.onresult = event => {
        let said = '';
        for (let i = 0; i < event.results.length; i++) said += event.results[i][0].transcript;
        input.value = (base ? base.replace(/\s*$/, ' ') : '') + said.trim();
        input.dispatchEvent(new Event('input', { bubbles: true }));
        document.body.dataset.amp = event.results[event.results.length - 1].isFinal ? '0.35' : '0.9';
      };
      rec.onerror = () => { on = false; document.body.classList.remove('is-listening'); mic.setAttribute('aria-pressed', 'false'); };
      rec.onend = () => { on = false; document.body.classList.remove('is-listening'); mic.setAttribute('aria-pressed', 'false'); document.body.dataset.amp = '0'; };
      try { rec.start(); } catch (e) { rec.onend(); }
    });
  }

  const account = view.querySelector('.workspace-account');
  const hint = view.querySelector('.composer .hint');
  let scheduled = false;
  function refresh() {
    scheduled = false;
    const welcome = box.querySelector('.workspace-welcome');
    document.body.classList.toggle('is-chat-experience', !view.hidden);
    document.body.classList.toggle('experience-empty', !view.hidden && Boolean(welcome));
    if (view.hidden && open) setOpen(false, false);
    if (welcome && !welcome.querySelector('[data-orb]')) {
      const slot = make('div', 'orb-slot');
      const canvas = document.createElement('canvas');
      canvas.className = 'orb';
      canvas.setAttribute('data-orb', 'agent');
      canvas.setAttribute('aria-hidden', 'true');
      canvas.width = 320;
      canvas.height = 320;
      slot.append(canvas);
      welcome.prepend(slot);
      window.ArtemisFX?.mountOrb(canvas);
    }
    const heading = welcome?.querySelector('h2');
    if (heading && heading.textContent !== 'What would you like to create?') heading.textContent = 'What would you like to create?';
    box.querySelectorAll('.msg.sys').forEach(msg => {
      const streaming = !!msg.querySelector('.message-state:not(.message-error)');
      msg.classList.toggle('is-streaming', streaming);
      const empty = !(msg.querySelector('.body')?.textContent || '').trim();
      let dots = msg.querySelector('.typing-dots');
      if (streaming && empty && !dots) {
        dots = make('p', 'typing-dots');
        dots.setAttribute('aria-hidden', 'true');
        dots.append(make('i'), make('i'), make('i'));
        (msg.querySelector('.body') || msg).after(dots);
      } else if ((!streaming || !empty) && dots) dots.remove();
    });
    if (hint) {
      const text = account?.textContent === 'Account' ? 'Saved to your account. Check important answers.' : 'Sign in to save your conversations. Check important answers.';
      if (hint.textContent !== text) hint.textContent = text;
    }
    syncAgent();
  }
  function syncAgent() {
    const listen = document.body.classList.contains('is-listening');
    const speak = document.body.classList.contains('is-speaking') || !!(window.speechSynthesis && speechSynthesis.speaking);
    const think = form.getAttribute('aria-busy') === 'true' || !!box.querySelector('.message-state:not(.message-error)');
    const state = listen ? 'listen' : speak ? 'speak' : think ? 'think' : 'idle';
    const level = Number(document.body.dataset.amp || (state === 'think' ? 0.55 : state === 'speak' ? 0.7 : 0.16));
    window.ArtemisFX?.setAgent(state, level);
  }
  function schedule() { if (!scheduled) { scheduled = true; requestAnimationFrame(refresh); } }
  new MutationObserver(schedule).observe(box, { childList: true, subtree: true });
  new MutationObserver(schedule).observe(view, { attributes: true, attributeFilter: ['hidden'] });
  new MutationObserver(schedule).observe(form, { attributes: true, attributeFilter: ['aria-busy'] });
  new MutationObserver(schedule).observe(document.body, { attributes: true, attributeFilter: ['class', 'data-amp'] });
  if (account) new MutationObserver(schedule).observe(account, { childList: true, characterData: true, subtree: true });
  setInterval(syncAgent, 250);
  refresh();
  setOpen(false, false);

  function mark() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 32 32');
    svg.setAttribute('class', 'mark');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = '<defs><linearGradient id="mark-rail" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#7C9CFF"/><stop offset=".55" stop-color="#19D3C5"/><stop offset="1" stop-color="#FF4FD8"/></linearGradient></defs><path d="M5 23c3.4-13 18.6-13 22 0" fill="none" stroke="url(#mark-rail)" stroke-width="3" stroke-linecap="round"/>';
    return svg;
  }
})();
