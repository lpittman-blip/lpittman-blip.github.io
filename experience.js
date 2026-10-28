/* Presentation only. Authentication and durable conversations stay in workspace.js. */
(() => {
  'use strict';
  const view = document.getElementById('view-chat');
  if (!view) return;
  const sidebar = view.querySelector('.chat > aside');
  const convo = view.querySelector('.convo');
  const top = view.querySelector('.workspace-top');
  const box = view.querySelector('.msgs');
  if (!sidebar || !convo || !top || !box) return;
  const make = (tag, cls, text) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text !== undefined) el.textContent = text;
    return el;
  };
  const action = (label, handler, cls) => {
    const el = make('button', cls, label); el.type = 'button';
    el.addEventListener('click', handler); return el;
  };
  const railHead = make('div', 'experience-rail-head');
  const brand = make('a', 'brand'); brand.href = '../';
  const logo = make('span', 'experience-logo', 'A'); logo.setAttribute('aria-hidden', 'true');
  brand.append(logo, document.createTextNode('Artemis'));
  const close = action('×', () => setOpen(false), 'experience-sidebar-close');
  close.setAttribute('aria-label', 'Close chat history');
  railHead.append(brand, close); sidebar.prepend(railHead);
  sidebar.id = 'experience-history';
  const menu = action('☰', () => setOpen(!open), 'experience-menu');
  menu.setAttribute('aria-label', 'Open chat history');
  menu.setAttribute('aria-controls', sidebar.id); menu.setAttribute('aria-expanded', 'false');
  top.prepend(menu);
  const historyLabel = make('p', 'experience-history-label', 'Your conversations');
  sidebar.querySelector('.session-list')?.before(historyLabel);
  const links = make('nav', 'experience-rail-links'); links.setAttribute('aria-label', 'Workspace navigation');
  function navigate(name) {
    setOpen(false, false);
    document.querySelector('#navLinks [data-go="' + name + '"]')?.click();
  }
  links.append(action('Products', () => navigate('products')), action('Your account', () => navigate('account')));
  const support = make('a', '', 'Help & support'); support.href = 'mailto:support@artemisai-bycutlineindustries.studio'; links.append(support);
  const motion = document.getElementById('experience-motion'); if (motion) links.append(motion);
  sidebar.append(links, make('p', 'experience-rail-footer', 'BY CUTLINE INDUSTRIES'));
  const veil = action('', () => setOpen(false), 'experience-veil'); veil.setAttribute('aria-label', 'Close chat history'); veil.tabIndex = -1;
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
      sidebar.setAttribute('role', 'dialog'); sidebar.setAttribute('aria-modal', 'true');
      close.focus();
    } else {
      sidebar.removeAttribute('role'); sidebar.removeAttribute('aria-modal');
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
    settings.append(make('summary', '', 'Read-aloud settings'));
    voice.before(settings); settings.append(voice);
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
    if (welcome) {
      if (!welcome.querySelector('.experience-orbit')) {
        const orbit = make('div', 'experience-orbit'); orbit.setAttribute('aria-hidden', 'true');
        orbit.append(make('i'), make('i'), make('i')); welcome.prepend(orbit);
      }
      const heading = welcome.querySelector('h2');
      if (heading && heading.textContent !== 'What would you like to create?') heading.textContent = 'What would you like to create?';
    }
    if (hint) {
      const text = account?.textContent === 'Account' ? 'Saved to your account. Check important answers.' : 'Sign in to save your conversations. Check important answers.';
      if (hint.textContent !== text) hint.textContent = text;
    }
  }
  function schedule() { if (!scheduled) { scheduled = true; requestAnimationFrame(refresh); } }
  new MutationObserver(schedule).observe(box, { childList: true, subtree: true });
  new MutationObserver(schedule).observe(view, { attributes: true, attributeFilter: ['hidden'] });
  if (account) new MutationObserver(schedule).observe(account, { childList: true, characterData: true, subtree: true });
  refresh(); setOpen(false, false);
})();
