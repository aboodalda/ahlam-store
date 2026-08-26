// ===== state =====
let PRODUCTS = [];
let currentCategory = 'all';
let cart = JSON.parse(localStorage.getItem('ahlam_cart') || '[]');

const grid = document.getElementById('productGrid');
const emptyNote = document.getElementById('emptyNote');
const toastEl = document.getElementById('toast');

function showToast(msg){
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  setTimeout(()=>toastEl.classList.remove('show'), 2200);
}

function riyal(n){
  return `${Number(n).toLocaleString('en-US')} <span class="riyal">ر.س</span>`;
}

const CATEGORY_LABELS = { phone:'جوالات', watch:'ساعات ذكية', console:'بلايستيشن' };

// ===== load products from Firestore =====
function loadProducts(){
  db.collection('products').orderBy('createdAt','desc').onSnapshot(snap=>{
    PRODUCTS = snap.docs.map(d=>({ id:d.id, ...d.data() }));
    renderGrid();
  }, err=>{
    console.error(err);
    grid.innerHTML = '';
    emptyNote.style.display='block';
    emptyNote.textContent = 'تعذر تحميل المنتجات، تحقق من إعدادات Firebase';
  });
}

function renderGrid(){
  const list = currentCategory==='all' ? PRODUCTS : PRODUCTS.filter(p=>p.category===currentCategory);
  grid.innerHTML = '';
  if(!list.length){
    emptyNote.style.display='block';
    emptyNote.textContent = 'لا توجد منتجات في هذا التصنيف حالياً';
    return;
  }
  emptyNote.style.display='none';
  list.forEach(p=>{
    const card = document.createElement('div');
    card.className='card';
    card.innerHTML = `
      <div class="card-img">
        <img src="${p.image || ''}" alt="${p.name}" loading="lazy">
      </div>
      <div class="card-body">
        <span class="card-brand">${p.brand||''}</span>
        <span class="card-name">${p.name}</span>
        <div class="card-price">
          ${p.oldPrice ? `<span class="old">${riyal(p.oldPrice)}</span>` : ''}
          ${riyal(p.price)}
        </div>
        <button class="add-btn" data-id="${p.id}">أضف للسلة 🛒</button>
      </div>
    `;
    card.querySelector('.card-img').addEventListener('click', ()=>openProduct(p.id));
    card.querySelector('.card-name').addEventListener('click', ()=>openProduct(p.id));
    card.querySelector('.add-btn').addEventListener('click', (e)=>{
      e.stopPropagation();
      addToCart(p.id);
    });
    grid.appendChild(card);
  });
}

// category chips
document.getElementById('chipsWrap').addEventListener('click', e=>{
  const chip = e.target.closest('.chip');
  if(!chip) return;
  document.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
  chip.classList.add('active');
  currentCategory = chip.dataset.cat;
  renderGrid();
});

// ===== product modal =====
const productOverlay = document.getElementById('productOverlay');
const productSheet = document.getElementById('productSheet');

function openProduct(id){
  const p = PRODUCTS.find(x=>x.id===id);
  if(!p) return;
  const specs = (p.specs||[]).map(s=>`<tr><td>${s.label}</td><td>${s.value}</td></tr>`).join('');
  productSheet.innerHTML = `
    <button class="sheet-close" id="sheetCloseBtn">✕</button>
    <div class="sheet-img"><img src="${p.image||''}" alt="${p.name}"></div>
    <div class="sheet-body">
      <div class="sheet-brand">${p.brand||''} · ${CATEGORY_LABELS[p.category]||''}</div>
      <div class="sheet-name">${p.name}</div>
      <div class="sheet-price">
        ${riyal(p.price)}
        ${p.oldPrice ? `<span class="old" style="font-size:14px">${riyal(p.oldPrice)}</span>` : ''}
      </div>
      ${p.description ? `<div class="sheet-desc">${p.description}</div>` : ''}
      ${specs ? `<table class="spec-table">${specs}</table>` : ''}
      <button class="sheet-add" data-id="${p.id}">أضف للسلة 🛒</button>
    </div>
  `;
  productSheet.querySelector('#sheetCloseBtn').addEventListener('click', closeProduct);
  productSheet.querySelector('.sheet-add').addEventListener('click', ()=>{
    addToCart(p.id);
    closeProduct();
  });
  productOverlay.classList.add('open');
}
function closeProduct(){ productOverlay.classList.remove('open'); }
productOverlay.addEventListener('click', e=>{ if(e.target===productOverlay) closeProduct(); });

// ===== cart =====
function saveCart(){
  localStorage.setItem('ahlam_cart', JSON.stringify(cart));
  updateCartUI();
}
function addToCart(id){
  const p = PRODUCTS.find(x=>x.id===id);
  if(!p) return;
  const existing = cart.find(c=>c.id===id);
  if(existing){ existing.qty++; }
  else { cart.push({ id:p.id, name:p.name, price:p.price, image:p.image, qty:1 }); }
  saveCart();
  showToast('تمت الإضافة للسلة ✅');
}
function changeQty(id, delta){
  const item = cart.find(c=>c.id===id);
  if(!item) return;
  item.qty += delta;
  if(item.qty<=0) cart = cart.filter(c=>c.id!==id);
  saveCart();
}
function cartTotal(){
  return cart.reduce((sum,c)=>sum + c.price*c.qty, 0);
}
function updateCartUI(){
  document.getElementById('cartCount').textContent = cart.reduce((s,c)=>s+c.qty,0);
  document.getElementById('cartTotal').innerHTML = riyal(cartTotal());
  document.getElementById('checkoutBtn').disabled = cart.length===0;

  const itemsWrap = document.getElementById('cartItems');
  if(!cart.length){
    itemsWrap.innerHTML = `<div class="empty-note">سلتك فارغة، تصفح المنتجات وضيف اللي يعجبك 🛍️</div>`;
    return;
  }
  itemsWrap.innerHTML = cart.map(c=>`
    <div class="cart-item">
      <img src="${c.image||''}" alt="${c.name}">
      <div class="ci-info">
        <div class="ci-name">${c.name}</div>
        <div class="ci-price">${riyal(c.price)}</div>
        <div class="ci-qty">
          <button class="qty-btn" data-act="dec" data-id="${c.id}">－</button>
          <span>${c.qty}</span>
          <button class="qty-btn" data-act="inc" data-id="${c.id}">＋</button>
          <button class="ci-remove" data-act="rm" data-id="${c.id}">حذف</button>
        </div>
      </div>
    </div>
  `).join('');
}
document.getElementById('cartItems').addEventListener('click', e=>{
  const btn = e.target.closest('[data-act]');
  if(!btn) return;
  const id = btn.dataset.id;
  if(btn.dataset.act==='inc') changeQty(id, 1);
  if(btn.dataset.act==='dec') changeQty(id, -1);
  if(btn.dataset.act==='rm'){ cart = cart.filter(c=>c.id!==id); saveCart(); }
});

const cartOverlay = document.getElementById('cartOverlay');
document.getElementById('cartBtn').addEventListener('click', ()=> cartOverlay.classList.add('open'));
document.getElementById('closeCart').addEventListener('click', ()=> cartOverlay.classList.remove('open'));
cartOverlay.addEventListener('click', e=>{ if(e.target===cartOverlay) cartOverlay.classList.remove('open'); });

// ===== checkout =====
const checkoutOverlay = document.getElementById('checkoutOverlay');
const checkoutFormWrap = document.getElementById('checkoutFormWrap');

document.getElementById('checkoutBtn').addEventListener('click', ()=>{
  if(!cart.length) return;
  cartOverlay.classList.remove('open');
  renderOrderSummary();
  checkoutOverlay.classList.add('open');
});
document.getElementById('closeCheckout').addEventListener('click', ()=> checkoutOverlay.classList.remove('open'));
checkoutOverlay.addEventListener('click', e=>{ if(e.target===checkoutOverlay) checkoutOverlay.classList.remove('open'); });

function renderOrderSummary(){
  const wrap = document.getElementById('orderSummary');
  wrap.innerHTML = cart.map(c=>`<div><span>${c.name} × ${c.qty}</span><span>${c.price*c.qty} ر.س</span></div>`).join('')
    + `<div style="border-top:1px solid #ddd6c4;margin-top:6px;padding-top:6px;font-weight:800"><span>الإجمالي</span><span>${cartTotal()} ر.س</span></div>`;
}

document.getElementById('checkoutForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const btn = document.getElementById('submitOrderBtn');
  btn.disabled = true;
  btn.textContent = 'جارِ إرسال الطلب...';

  const order = {
    customerName: document.getElementById('custName').value.trim(),
    phone: document.getElementById('custPhone').value.trim(),
    city: document.getElementById('custCity').value.trim(),
    address: document.getElementById('custAddress').value.trim(),
    notes: document.getElementById('custNotes').value.trim(),
    items: cart.map(c=>({ productId:c.id, name:c.name, price:c.price, qty:c.qty })),
    total: cartTotal(),
    status: 'جديد',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  try{
    // 1) send to dashboard (Firestore)
    await db.collection('orders').add(order);

    // 2) send to WhatsApp simultaneously
    const lines = [
      `*طلب جديد من أحلام ستور* 🛍️`,
      ``,
      `👤 الاسم: ${order.customerName}`,
      `📱 الجوال: ${order.phone}`,
      `🏙️ المدينة: ${order.city}`,
      `📍 العنوان: ${order.address}`,
      order.notes ? `📝 ملاحظات: ${order.notes}` : null,
      ``,
      `*المنتجات:*`,
      ...order.items.map(i=>`- ${i.name} × ${i.qty} = ${i.price*i.qty} ر.س`),
      ``,
      `*الإجمالي: ${order.total} ر.س*`
    ].filter(Boolean).join('\n');

    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines)}`;
    window.open(waUrl, '_blank');

    cart = [];
    saveCart();
    checkoutOverlay.classList.remove('open');
    showSuccess();
  }catch(err){
    console.error(err);
    showToast('صار خطأ، حاول مرة ثانية 🙏');
  }finally{
    btn.disabled = false;
    btn.textContent = 'تأكيد الطلب وإرسال عبر واتساب 📲';
    document.getElementById('checkoutForm').reset();
  }
});

function showSuccess(){
  checkoutFormWrap.innerHTML = `
    <div class="success-box">
      <div class="success-icon">✓</div>
      <h3>تم إرسال طلبك بنجاح</h3>
      <p>وصل طلبك للوحة التحكم وفتحنا لك واتساب لتأكيد الطلب مع فريق أحلام ستور</p>
      <button class="checkout-btn" onclick="location.reload()">متابعة التسوق</button>
    </div>
  `;
}

// init
document.getElementById('year').textContent = new Date().getFullYear();
updateCartUI();
loadProducts();
