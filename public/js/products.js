/* THE HOUSE OF VRINDAVAN - dynamic product grid loader
   Product pages read from the backend database, so admin add/edit/delete
   changes show without putting product names inside the HTML files. */

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.querySelector('[data-product-grid]');
  if (!grid) return;

  const category = grid.dataset.productGrid;
  const iconSvg = grid.dataset.icon || '';
  const waNumber = '917760229555';
  let lastSignature = '';
  let isLoading = false;

  const setMessage = (message) => {
    grid.innerHTML = `<p style="grid-column:1/-1;color:var(--stone);font-size:14px;">${message}</p>`;
  };

  const loadProducts = async ({ showLoading = false } = {}) => {
    if (isLoading) return;
    isLoading = true;
    if (showLoading) setMessage('Loading products...');

    try {
      const cacheBust = Date.now();
      const res = await fetch(`/api/products?category=${encodeURIComponent(category)}&_=${cacheBust}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (!res.ok) throw new Error('Product request failed');
      const products = await res.json();
      const signature = JSON.stringify(products);
      if (signature === lastSignature) return;
      lastSignature = signature;

      if (!Array.isArray(products) || products.length === 0) {
        setMessage('No products listed here yet. Add products from the admin panel.');
        return;
      }

      grid.innerHTML = products.map(p => renderCard(p, iconSvg, waNumber)).join('');
    } catch (err) {
      setMessage("Couldn't load products right now. Please refresh, or check that the backend server is running.");
    } finally {
      isLoading = false;
    }
  };

  loadProducts({ showLoading: true });

  window.addEventListener('pageshow', () => loadProducts());
  window.addEventListener('focus', () => loadProducts());
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) loadProducts();
  });
});

function renderCard(product, iconSvg, waNumber) {
  const name = escapeHtml(product.name);
  const description = product.description ? `<p>${escapeHtml(product.description)}</p>` : '';
  const waText = encodeURIComponent(`Hi, I'd like a quote for ${product.name} (corporate gifting).`);
  const waHref = `https://wa.me/${waNumber}?text=${waText}`;

  const photoInner = product.image_path
    ? `<img src="${escapeAttr(product.image_path)}" alt="${name}" data-lightbox data-caption="${name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
       <div class="photo-pending">Photo Coming Soon</div>`
    : `<div class="photo-pending" style="display:flex;">Photo Coming Soon</div>`;

  return `
    <div class="product-card">
      <div class="product-photo">
        <div class="product-photo-bg"></div>
        ${iconSvg}
        ${photoInner}
      </div>
      <div class="product-body">
        <h4>${name}</h4>
        ${description}
        <a href="${waHref}" target="_blank" rel="noopener" class="link">Enquire <svg viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function escapeAttr(str) {
  return String(str ?? '').replace(/"/g, '&quot;');
}

