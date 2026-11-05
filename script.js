const products = [
  {
    id: 1,
    name: 'Sagrada Face de Cristo',
    size: '28 cm',
    price: 350,
    material: 'Gesso',
    image: 'img/sagradaface.jpeg',
    description:
      'Inspirada na tradição cristã da Sagrada Face, esta imagem representa o rosto de Jesus durante sua Paixão. Uma peça de grande significado religioso, que carrega consigo uma história de fé, devoção e espiritualidade.',
  },
  {
    id: 2,
    name: 'Santa Terezinha',
    size: '30 cm',
    price: 150,
    material: 'Gesso',
    image: 'img/santaterezinha.jpeg',
    description:
      'Imagem de Santa Terezinha produzida com cuidado e pintura artesanal.',
  },
  {
    id: 3,
    name: 'Nossa Senhora de Fátima',
    size: '25 cm',
    price: 150,
    material: 'Gesso',
    image: 'img/nossasenhorafatima.jpeg',
    description:
      'Uma representação delicada de Nossa Senhora de Fátima para seu espaço de oração.',
  },
  {
    id: 4,
    name: 'São Miguel',
    size: '30 cm',
    price: 250,
    material: 'Gesso',
    image: 'img/miguelarcanjo.jpeg',
    description:
      'Imagem sacra de São Miguel Arcanjo com acabamento artesanal.',
  },
  {
    id: 5,
    name: 'Crucifixo',
    size: '45 cm',
    price: 350,
    material: 'Gesso',
    image: 'img/crucifixo.jpeg',
    description: 'Crucifixo artesanal, símbolo de fé e esperança.',
  },
  {
    id: 6,
    name: 'Sagrada Família',
    size: '30 cm',
    price: 150,
    material: 'Gesso',
    image: 'img/sagradafamilia.jpeg',
    description:
      'Imagem da Sagrada Família para inspirar união, fé e devoção.',
  },
];
const WHATSAPP_NUMBER = '5551996643587';

const cart = [];
try {
  const saved = JSON.parse(sessionStorage.getItem('atelie-cart') || '[]');
  if (Array.isArray(saved)) saved.forEach((item) => {
    const product = products.find((p) => p.id === item.id);
    if (product && Number.isInteger(item.qty) && item.qty > 0) {
      cart.push({ ...product, qty: item.qty });
    }
  });
} catch { /* O carrinho continua disponível se o armazenamento estiver bloqueado. */ }

const grid = document.querySelector('#productGrid');

const money = (n) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Remove acentos e coloca em minúsculas, para a busca ignorar acentuação
const normalize = (text) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const cartTotal = () => cart.reduce((sum, p) => sum + p.price * p.qty, 0);

/* ---------- Lista de produtos ---------- */

function render(query = '') {
  if (!grid) return;
  const term = normalize(query);
  const found = products.filter((p) => normalize(p.name).includes(term));

  grid.innerHTML = found
    .map(
      (p) => `
        <button class="product" data-id="${p.id}" aria-label="Ver detalhes de ${p.name}">
          <div class="photo">
            <img src="${p.image}" alt="${p.name}" loading="lazy">
          </div>
          <h3>${p.name}</h3>
          <p>${p.size} / ${money(p.price)}</p>
        </button>`
    )
    .join('');

  document.querySelector('#empty').hidden = found.length > 0;
}

/* ---------- Detalhes do produto ---------- */

function openProduct(id) {
  const p = products.find((x) => x.id === id);
  if (!p) return;

  document.querySelector('#productDetail').innerHTML = `
    <div class="detail">
      <img src="${p.image}" alt="${p.name}">
      <div>
        <h2>${p.name}</h2>
        <p>${p.description}</p>
        <p>
          <b>Material:</b> ${p.material}<br>
          <b>Altura:</b> ${p.size}
        </p>
        <h3>${money(p.price)}</h3>
        <label>
          Quantidade:
          <input id="qty" type="number" min="1" max="99" value="1">
        </label>
        <button class="primary" id="addCart">Adicionar ao carrinho</button>
        <p><small>Frete e disponibilidade sob consulta.</small></p>
      </div>
    </div>`;

  document.querySelector('#productDialog').showModal();

  document.querySelector('#addCart').onclick = () => {
    const qty = Math.max(
      1,
      Math.min(99, Number(document.querySelector('#qty').value) || 1)
    );
    const item = cart.find((x) => x.id === id);

    if (item) {
      item.qty += qty;
    } else {
      cart.push({ ...p, qty });
    }

    updateCart();
    document.querySelector('#productDialog').close();
    location.href = 'carrinho.html';
  };
}

/* ---------- Carrinho ---------- */

function updateCart() {
  try { sessionStorage.setItem('atelie-cart', JSON.stringify(cart)); } catch {}
  document.querySelector('#cartCount').textContent = cart.reduce(
    (sum, p) => sum + p.qty,
    0
  );

  if (!document.querySelector('#cartItems')) return;
  document.querySelector('#cartItems').innerHTML = cart.length
    ? cart
        .map(
          (p) => `
            <div class="cart-row">
              <a class="cart-product-photo" href="produtos.html?produto=${p.id}"><img src="${p.image}" alt="${p.name}"></a>
<div class="cart-product-copy"><a href="produtos.html?produto=${p.id}">${p.name}</a><p>${p.material} · ${p.size}</p><label class="cart-quantity" for="cart-qty-${p.id}">Quantidade: <input id="cart-qty-${p.id}" data-quantity="${p.id}" type="number" min="1" step="1" value="${p.qty}" inputmode="numeric" aria-label="Quantidade de ${p.name}"></label></div>
              <span>
                ${money(p.price * p.qty)}
                <button data-remove="${p.id}" aria-label="Remover ${p.name} do carrinho">Remover</button>
              </span>
            </div>`
        )
        .join('')
    : 'Seu carrinho está vazio.';

  document.querySelector('#cartTotal').textContent =
    'Total: ' + money(cartTotal());

  document.querySelector('#checkout').disabled = !cart.length;
}

/* ---------- Eventos ---------- */

const search = document.querySelector('#search');
if (grid) {
  search.value = new URLSearchParams(location.search).get('q') || '';
  search.addEventListener('input', (e) => render(e.target.value));
  search.form.addEventListener('submit', (e) => {
    e.preventDefault();
    render(search.value);
  });
}

grid?.addEventListener('click', (e) => {
  const card = e.target.closest('[data-id]');
  if (card) openProduct(Number(card.dataset.id));
});

const cartItems = document.querySelector('#cartItems');
if (cartItems) cartItems.onclick = (e) => {
  if (!e.target.dataset.remove) return;

  const index = cart.findIndex((p) => p.id == e.target.dataset.remove);
  if (index !== -1) cart.splice(index, 1);
  updateCart();
};

if (cartItems) cartItems.addEventListener('change', (e) => {
  const input = e.target.closest('input[data-quantity]');
  if (!input) return;
  const item = cart.find((p) => p.id === Number(input.dataset.quantity));
  if (!item) return;
  const qty = Number(input.value);
  if (!Number.isSafeInteger(qty) || qty < 1) {
    input.value = item.qty;
    return;
  }
  item.qty = qty;
  updateCart();
  document.querySelector(`#cart-qty-${item.id}`)?.focus();
});
document.querySelector('#cartBtn').onclick = () => {
  updateCart();
  location.href = 'carrinho.html';
};

const loginButton = document.querySelector('#loginBtn');
if (loginButton) loginButton.onclick = () => {
  location.href = 'cadastro.html';
};

document.querySelectorAll('[data-close]').forEach((btn) => {
  btn.onclick = () => btn.closest('dialog').close();
});

const checkoutButton = document.querySelector('#checkout');
if (checkoutButton) checkoutButton.onclick = () => {
  let signedIn = false;
  try {
    const userId = sessionStorage.getItem('atelie-user-v1');
    const users = JSON.parse(localStorage.getItem('atelie-accounts-v1') || '[]');
    signedIn = !!userId && Array.isArray(users) && users.some(user => user.id === userId);
  } catch {}
  if (!signedIn) {
    location.href = 'entrar.html?continuar=compra';
    return;
  }
  if (!cart.length) return;
  const items = cart
    .map((p) => `${p.qty}x ${p.name} — ${money(p.price * p.qty)}`)
    .join('\n');

  const msg =
    'Olá! Gostaria de consultar a compra:\n' +
    items +
    '\nTotal: ' +
    money(cartTotal());

  window.recordOrderRequest?.(cart);
  window.open(
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,
    '_blank'
  );
};

/* ---------- Inicialização ---------- */

render(search.value);
updateCart();
if (new URLSearchParams(location.search).get('carrinho') === '1' && cart.length) {
  location.href = 'carrinho.html';
}

// Abre o produto selecionado no histórico da conta.
if (grid) {
  const selectedProduct = Number(new URLSearchParams(location.search).get('produto'));
  if (products.some(product => product.id === selectedProduct)) {
    openProduct(selectedProduct);
  }
}
