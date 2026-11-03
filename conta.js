(() => {
  const KEY = 'atelie-accounts-v1';
  const SESSION = 'atelie-user-v1';
  const read = () => JSON.parse(localStorage.getItem(KEY) || '[]');
  const save = (users) => localStorage.setItem(KEY, JSON.stringify(users));
  let current = null;
  try { current = read().find(u => u.id === sessionStorage.getItem(SESSION)) || null; } catch {}
  const accountButton = document.querySelector('#loginBtn');
  if (accountButton) {
    accountButton.textContent = current ? 'Minha conta' : 'Cadastre-se | Entre';
    accountButton.onclick = () => { location.href = current ? 'minha-conta.html' : 'cadastro.html'; };
  }
  const continuingPurchase = new URLSearchParams(location.search).get('continuar') === 'compra';
  if (continuingPurchase) {
    document.querySelectorAll('.auth-tabs a').forEach(link => {
      link.href = link.getAttribute('href').split('?')[0] + '?continuar=compra';
    });
    const form = document.querySelector('#signInForm') || document.querySelector('#registerForm');
    if (form) form.querySelector('.form-message').textContent = 'Entre ou cadastre-se para finalizar sua compra. Seu carrinho foi mantido.';
  }
  const hash = async (password, salt) => {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({name:'PBKDF2', salt:Uint8Array.from(salt), iterations:210000, hash:'SHA-256'}, key, 256);
    return Array.from(new Uint8Array(bits), n => n.toString(16).padStart(2,'0')).join('');
  };
  function bind(id, action) {
    const form = document.querySelector(id);
    if (!form) return;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const button = form.querySelector('button');
      const message = form.querySelector('.form-message');
      button.disabled = true;
      message.textContent = '';
      try { await action(form, new FormData(form), message); }
      catch { message.textContent = 'Não foi possível acessar os dados locais. Abra o site em um navegador com armazenamento habilitado.'; }
      finally { button.disabled = false; }
    });
  }
  const details = data => ({name: data.get('name').trim(), email: data.get('email').trim().toLowerCase(), phone: data.get('phone').trim()});
  bind('#registerForm', async (form,data,message) => {
    const profile = details(data);
    if (!profile.name) { message.textContent = 'Informe seu nome completo.'; return; }
    if (data.get('password') !== data.get('confirm')) { message.textContent = 'As senhas precisam ser iguais.'; return; }
    const users = read();
    if (users.some(u => u.email === profile.email)) { message.textContent = 'Já existe uma conta local com este e-mail. Acesse a página Entre.'; return; }
    const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)));
    const user = {...profile, id: crypto.randomUUID(), salt, passwordHash: await hash(data.get('password'),salt), orders:[]};
    users.push(user);
    save(users);
    sessionStorage.setItem(SESSION,user.id);
    location.href = new URLSearchParams(location.search).get('continuar') === 'compra' ? 'carrinho.html' : 'minha-conta.html';
  });
  bind('#signInForm', async (form,data,message) => {
    const user = read().find(u => u.email === data.get('email').trim().toLowerCase());
    if (!user || await hash(data.get('password'),user.salt) !== user.passwordHash) { message.textContent = 'E-mail ou senha incorretos.'; return; }
    sessionStorage.setItem(SESSION,user.id);
    location.href = 'minha-conta.html';
  });
  const edit = document.querySelector('#editForm');
  if (edit) {
    if (!current) { location.replace('entrar.html'); return; }
    for (const key of ['name','email','phone']) edit.elements.namedItem(key).value = current[key] || '';
  }
  bind('#editForm', async (form,data,message) => {
    const profile = details(data);
    if (!profile.name) { message.textContent = 'Informe seu nome completo.'; return; }
    const users = read();
    if (users.some(u => u.id !== current.id && u.email === profile.email)) { message.textContent = 'Este e-mail já está em uso.'; return; }
    const user = users.find(u => u.id === current.id);
    Object.assign(user,profile);
    save(users);
    location.href = 'minha-conta.html';
  });
  const content = document.querySelector('#accountContent');
  if (content) {
    document.querySelector('#accountGuest').hidden = !!current;
    content.hidden = !current;
    if (current) {
      document.querySelector('#profileName').textContent = current.name;
      document.querySelector('#profileEmail').textContent = current.email;
      document.querySelector('#profilePhone').textContent = current.phone || 'Telefone não informado';
      document.querySelector('#logoutBtn').onclick = () => { sessionStorage.removeItem(SESSION); location.href='entrar.html'; };
      const list = document.querySelector('#orderList');
      const orders = current.orders || [];
      if (!orders.length) {
        const p = document.createElement('p'); p.textContent = 'Você ainda não iniciou nenhuma solicitação.'; list.append(p);
        const a = document.createElement('a'); a.href = 'produtos.html'; a.className = 'primary link-button'; a.textContent = 'Conheça nossas imagens'; list.append(a);
      }
      for (const order of [...orders].reverse()) {
        const article = document.createElement('article'); article.className='order-card';
        const status = document.createElement('p'); status.textContent = new Date(order.date).toLocaleDateString('pt-BR') + ' · Solicitação iniciada · Aguardando confirmação pelo WhatsApp'; article.append(status);
        for (const item of order.items) {
          const product = products.find(p => p.id === item.id); if (!product) continue;
          const row=document.createElement('div'); row.className='order-product';
          const img=document.createElement('img'); img.src=product.image; img.alt=product.name;
          const copy=document.createElement('div'); const title=document.createElement('b'); title.textContent=product.name;
          const detail=document.createElement('span'); detail.textContent=`${product.material}, ${product.size} · ${item.qty} unidade(s)`;
          const link=document.createElement('a');
          link.href='produtos.html?produto='+product.id;
          link.setAttribute('aria-label','Ver '+product.name+' na página de produtos');
          link.append(img);
          copy.append(title,detail); row.append(link,copy); article.append(row);
        }
        list.append(article);
      }
    }
  }
  window.recordOrderRequest = items => {
    if (!current || !items.length) return;
    try {
      const users=read(), user=users.find(u=>u.id===current.id);
      if (!user) return;
      user.orders ||= [];
      const selected=items.map(({id,qty})=>({id,qty}));
      const last=user.orders.at(-1);
      if (last && JSON.stringify(last.items)===JSON.stringify(selected) && Date.now()-new Date(last.date).getTime()<60000) return;
      user.orders.push({date:new Date().toISOString(),items:selected}); save(users);
    } catch {}
  };
})();
