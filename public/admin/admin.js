let CATEGORIES = [];
let PRODUCTS = [];
let activeCategory = '';

const el = (id) => document.getElementById(id);

// ---------- Session guard ----------
async function checkSession() {
  const res = await fetch('/api/admin/session');
  const data = await res.json();
  if (!data.loggedIn) {
    window.location.href = 'login.html';
    return;
  }
  el('who').textContent = `Logged in as ${data.username}`;
}

// ---------- Load categories + products ----------
async function loadCategories() {
  const res = await fetch('/api/categories');
  CATEGORIES = await res.json();

  const tabsWrap = el('tabs');
  CATEGORIES.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'tab';
    btn.dataset.category = cat.slug;
    btn.textContent = cat.label;
    btn.addEventListener('click', () => setActiveTab(cat.slug));
    tabsWrap.appendChild(btn);
  });

  // populate category <select> in the modal
  const select = el('p-category');
  select.innerHTML = CATEGORIES.map(c => `<option value="${c.slug}">${c.label}</option>`).join('');

  tabsWrap.querySelector('[data-category=""]').addEventListener('click', () => setActiveTab(''));
}

function setActiveTab(category) {
  activeCategory = category;
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.dataset.category === category);
  });
  renderProducts();
}

async function loadProducts() {
  const res = await fetch('/api/admin/products');
  PRODUCTS = await res.json();
  renderProducts();
}

function categoryLabel(slug) {
  const c = CATEGORIES.find(c => c.slug === slug);
  return c ? c.label : slug;
}

function renderProducts() {
  const rowsWrap = el('product-rows');
  const list = activeCategory ? PRODUCTS.filter(p => p.category === activeCategory) : PRODUCTS;

  if (list.length === 0) {
    rowsWrap.innerHTML = `<div class="empty-state">No products yet${activeCategory ? ' in this category' : ''}. Click "+ Add Product" to add one.</div>`;
    return;
  }

  rowsWrap.innerHTML = list.map(p => `
    <div class="p-row" data-id="${p.id}">
      <div class="p-thumb">
        ${p.image_path
          ? `<img src="${p.image_path}" alt="${escapeHtml(p.name)}">`
          : `No photo`}
      </div>
      <div class="p-name">${escapeHtml(p.name)}${p.description ? `<span class="desc">${escapeHtml(p.description)}</span>` : ''}</div>
      <div class="p-cat">${escapeHtml(categoryLabel(p.category))}</div>
      <div class="p-actions">
        <button class="btn btn-outline btn-sm" data-edit="${p.id}">Edit</button>
        <button class="btn btn-danger btn-sm" data-delete="${p.id}">Delete</button>
      </div>
    </div>
  `).join('');

  rowsWrap.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.edit));
  });
  rowsWrap.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => deleteProduct(btn.dataset.delete));
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

// ---------- Add / Edit modal ----------
const productModal = el('product-modal-overlay');
const productForm = el('product-form');
const productError = el('product-error');

function openAddModal() {
  el('modal-title').textContent = 'Add Product';
  el('product-id').value = '';
  productForm.reset();
  el('current-image').style.display = 'none';
  productError.classList.remove('show');
  productModal.classList.add('show');
}

function openEditModal(id) {
  const product = PRODUCTS.find(p => String(p.id) === String(id));
  if (!product) return;
  el('modal-title').textContent = 'Edit Product';
  el('product-id').value = product.id;
  el('p-name').value = product.name;
  el('p-category').value = product.category;
  el('p-description').value = product.description || '';
  el('p-image').value = '';
  productError.classList.remove('show');

  if (product.image_path) {
    el('current-image').style.display = 'flex';
    el('current-image-img').src = product.image_path;
  } else {
    el('current-image').style.display = 'none';
  }
  productModal.classList.add('show');
}

function closeProductModal() {
  productModal.classList.remove('show');
}

el('add-product-btn').addEventListener('click', openAddModal);
el('cancel-btn').addEventListener('click', closeProductModal);
productModal.addEventListener('click', (e) => { if (e.target === productModal) closeProductModal(); });

productForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  productError.classList.remove('show');

  const id = el('product-id').value;
  const formData = new FormData(productForm);
  const saveBtn = el('save-btn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving…';

  try {
    const url = id ? `/api/admin/products/${id}` : '/api/admin/products';
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, { method, body: formData });
    const data = await res.json();
    if (!res.ok) {
      productError.textContent = data.error || 'Could not save the product.';
      productError.classList.add('show');
      return;
    }
    closeProductModal();
    await loadProducts();
  } catch (err) {
    productError.textContent = 'Network error — please try again.';
    productError.classList.add('show');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Product';
  }
});

async function deleteProduct(id) {
  const product = PRODUCTS.find(p => String(p.id) === String(id));
  if (!product) return;
  if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;

  const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
  if (res.ok) {
    await loadProducts();
  } else {
    const data = await res.json().catch(() => ({}));
    alert(data.error || 'Could not delete the product.');
  }
}

// ---------- Change password modal ----------
const pwModal = el('pw-modal-overlay');
el('change-pw-btn').addEventListener('click', () => {
  el('pw-form').reset();
  el('pw-error').classList.remove('show');
  el('pw-success').classList.remove('show');
  pwModal.classList.add('show');
});
el('pw-cancel-btn').addEventListener('click', () => pwModal.classList.remove('show'));
pwModal.addEventListener('click', (e) => { if (e.target === pwModal) pwModal.classList.remove('show'); });

el('pw-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const currentPassword = el('current-password').value;
  const newPassword = el('new-password').value;
  const pwError = el('pw-error');
  const pwSuccess = el('pw-success');
  pwError.classList.remove('show');
  pwSuccess.classList.remove('show');

  const res = await fetch('/api/admin/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) {
    pwError.textContent = data.error || 'Could not update password.';
    pwError.classList.add('show');
    return;
  }
  pwSuccess.textContent = 'Password updated successfully.';
  pwSuccess.classList.add('show');
  el('pw-form').reset();
});

// ---------- Logout ----------
el('logout-btn').addEventListener('click', async () => {
  await fetch('/api/admin/logout', { method: 'POST' });
  window.location.href = 'login.html';
});

// ---------- Init ----------
(async function init() {
  await checkSession();
  await loadCategories();
  await loadProducts();
})();