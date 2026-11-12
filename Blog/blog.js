/* Consult Hub Blog: filter and paginate existing HTML articles. No card generation. */
(() => {
  'use strict';
  const root = document.querySelector('.page-blog');
  if (!root) return;
  const cards = [...root.querySelectorAll('#blog-grid > .blog-card')];
  const controls = [...root.querySelectorAll('[data-filter]')];
  const count = root.querySelector('#blog-results-count');
  const empty = root.querySelector('#blog-empty');
  const pagination = root.querySelector('#blog-pagination');
  const pageNote = root.querySelector('#blog-pagination-note');
  const list = root.querySelector('#blog-list');
  const PAGE_SIZE = 6;
  let category = 'all';
  let page = 1;
  const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function render(scroll = false) {
    const filtered = cards.filter(card => category === 'all' || card.dataset.category === category);
    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    page = Math.min(page, pages);
    const start = (page - 1) * PAGE_SIZE;
    const currentCards = new Set(filtered.slice(start, start + PAGE_SIZE));
    cards.forEach(card => { card.hidden = !currentCards.has(card); });
    controls.forEach(button => {
      const active = button.dataset.filter === category;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    count.textContent = filtered.length + ' ' + (filtered.length === 1 ? 'матеріал' : filtered.length < 5 ? 'матеріали' : 'матеріалів') + ' у вибраній рубриці';
    empty.hidden = filtered.length > 0;
    pagination.hidden = filtered.length === 0;
    pageNote.hidden = filtered.length === 0;
    const pageButtons = [...pagination.querySelectorAll('[data-page]')];
    // Keep three visible page slots for the planned growth; create more if needed.
    const needed = Math.max(3, pages);
    for (let i = pageButtons.length + 1; i <= needed; i++) {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'blog-page'; button.dataset.page = String(i); button.textContent = String(i);
      pagination.querySelector('[data-page-action="next"]').before(button);
    }
    pagination.querySelectorAll('[data-page]').forEach(button => {
      const number = Number(button.dataset.page);
      const active = number === page;
      button.disabled = number > pages;
      button.classList.toggle('is-current', active);
      if (active) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
      button.title = number > pages ? 'Сторінка стане доступною після додавання новин' : 'Перейти на сторінку ' + number;
    });
    pagination.querySelector('[data-page-action="prev"]').disabled = page === 1;
    pagination.querySelector('[data-page-action="next"]').disabled = page === pages;
    pageNote.textContent = pages === 1
      ? 'До 6 новин на сторінці. Сторінки 2 і 3 активуються автоматично, коли додасте більше матеріалів.'
      : 'Сторінка ' + page + ' із ' + pages + ' · до 6 матеріалів на сторінці.';
    if (scroll) list.scrollIntoView({behavior: prefersReduced() ? 'auto' : 'smooth', block:'start'});
  }
  controls.forEach(button => button.addEventListener('click', () => {
    category = button.dataset.filter || 'all'; page = 1;
    render(button.classList.contains('blog-category'));
  }));
  pagination.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    const pages = Math.max(1, Math.ceil(cards.filter(card => category === 'all' || card.dataset.category === category).length / PAGE_SIZE));
    if (button.dataset.page) page = Number(button.dataset.page);
    if (button.dataset.pageAction === 'prev') page = Math.max(1, page - 1);
    if (button.dataset.pageAction === 'next') page = Math.min(pages, page + 1);
    render(true);
  });
  render();
  const dialog=root.querySelector('#blog-inquiry-dialog');
  const form=root.querySelector('#blog-inquiry-form');
  const select=root.querySelector('#blog-request-type');
  root.querySelectorAll('[data-inquiry]').forEach(button=>button.addEventListener('click',()=>{select.value=button.dataset.inquiry;dialog.showModal();}));
  root.querySelector('[data-close-dialog]')?.addEventListener('click',()=>dialog.close());
  dialog?.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  form?.addEventListener('submit',event=>{
    event.preventDefault();if(!form.reportValidity())return;
    const data=new FormData(form);
    const subject=String(data.get('requestType')||'Звернення Consult Hub');
    const body=['Ім’я: '+data.get('name'),'Email: '+data.get('email'),'Телефон: '+(data.get('phone')||'Не вказано'),'Тип звернення: '+subject,'','Питання: '+data.get('message')].join('\n');
    window.location.href='mailto:office@consulthub.com.ua?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
  });
})();
