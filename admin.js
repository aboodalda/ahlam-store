const auth = firebase.auth();
const toastEl = document.getElementById('toast');
function showToast(msg){
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  setTimeout(()=>toastEl.classList.remove('show'), 2200);
}

// ===== auth =====
document.getElementById('loginBtn').addEventListener('click', async ()=>{
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPass').value;
  const errEl = document.getElementById('loginErr');
  errEl.style.display='none';
  try{
    await auth.signInWithEmailAndPassword(email, pass);
  }catch(e){
    errEl.style.display='block';
  }
});
document.getElementById('logoutBtn').addEventListener('click', ()=> auth.signOut());

auth.onAuthStateChanged(user=>{
  if(user){
    document.getElementById('loginWrap').style.display='none';
    document.getElementById('app').style.display='block';
    initDashboard();
  }else{
    document.getElementById('loginWrap').style.display='flex';
    document.getElementById('app').style.display='none';
  }
});

let dashboardInitialized = false;
function initDashboard(){
  if(dashboardInitialized) return;
  dashboardInitialized = true;
  loadOrders();
  loadProducts();
}

// ===== tabs =====
document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-'+btn.dataset.tab).classList.add('active');
  });
});

// ===== orders =====
let ORDERS = [];
const CATEGORY_LABELS = { phone:'جوالات', watch:'ساعات ذكية', console:'بلايستيشن' };

function loadOrders(){
  db.collection('orders').orderBy('createdAt','desc').onSnapshot(snap=>{
    ORDERS = snap.docs.map(d=>({ id:d.id, ...d.data() }));
    renderOrders();
    renderStats();
  });
}

function renderOrders(){
  const wrap = document.getElementById('ordersList');
  if(!ORDERS.length){
    wrap.innerHTML = `<div class="empty-note">ما فيه طلبات لسه</div>`;
    return;
  }
  wrap.innerHTML = ORDERS.map(o=>{
    const date = o.createdAt && o.createdAt.toDate ? o.createdAt.toDate().toLocaleString('ar-SA') : '';
    const itemsHtml = (o.items||[]).map(i=>`<div><span>${i.name} × ${i.qty}</span><span>${i.price*i.qty} ر.س</span></div>`).join('');
    const statusClass = 'status-' + (o.status||'جديد').replace(/\s/g,'_');
    return `
      <div class="order-card">
        <div class="order-top">
          <div>
            <div class="order-cust">${o.customerName}</div>
            <div class="order-date">${date}</div>
          </div>
          <span class="order-status ${statusClass}">${o.status||'جديد'}</span>
        </div>
        <div class="order-details">
          📱 ${o.phone} &nbsp;|&nbsp; 🏙️ ${o.city}<br>
          📍 ${o.address}
          ${o.notes ? `<br>📝 ${o.notes}` : ''}
        </div>
        <div class="order-items">${itemsHtml}</div>
        <div class="order-total">الإجمالي: ${o.total} ر.س</div>
        <div class="order-actions">
          <select class="status-select" data-id="${o.id}">
            ${['جديد','قيد التجهيز','تم التوصيل','ملغي'].map(s=>`<option value="${s}" ${o.status===s?'selected':''}>${s}</option>`).join('')}
          </select>
          <a class="wa-link" target="_blank" href="https://wa.me/${(o.phone||'').replace(/[^0-9]/g,'')}">واتساب العميل 📲</a>
        </div>
      </div>
    `;
  }).join('');

  wrap.querySelectorAll('.status-select').forEach(sel=>{
    sel.addEventListener('change', ()=>{
      db.collection('orders').doc(sel.dataset.id).update({ status: sel.value });
    });
  });
}

// ===== products =====
let PRODUCTS = [];
function loadProducts(){
  db.collection('products').orderBy('createdAt','desc').onSnapshot(snap=>{
    PRODUCTS = snap.docs.map(d=>({ id:d.id, ...d.data() }));
    renderProductsList();
    renderStats();
  });
}

function renderProductsList(){
  const wrap = document.getElementById('productsList');
  if(!PRODUCTS.length){
    wrap.innerHTML = `<div class="empty-note">ما فيه منتجات مضافة لسه، روح لتبويب "إضافة منتج"</div>`;
    return;
  }
  wrap.innerHTML = PRODUCTS.map(p=>`
    <div class="product-row">
      <img src="${p.image||''}" alt="${p.name}">
      <div class="pr-info">
        <div class="pr-name">${p.name}</div>
        <div class="pr-meta">${p.brand||''} · ${CATEGORY_LABELS[p.category]||''}</div>
      </div>
      <div class="pr-price">${p.price} ر.س</div>
      <div class="pr-actions">
        <button class="icon-btn edit" data-id="${p.id}">✏️</button>
        <button class="icon-btn del" data-id="${p.id}">🗑️</button>
      </div>
    </div>
  `).join('');

  wrap.querySelectorAll('.edit').forEach(b=> b.addEventListener('click', ()=> startEdit(b.dataset.id)));
  wrap.querySelectorAll('.del').forEach(b=> b.addEventListener('click', ()=> deleteProduct(b.dataset.id)));
}

async function deleteProduct(id){
  if(!confirm('متأكد تبي تحذف هذا المنتج؟')) return;
  await db.collection('products').doc(id).delete();
  showToast('تم حذف المنتج 🗑️');
}

function startEdit(id){
  const p = PRODUCTS.find(x=>x.id===id);
  if(!p) return;
  document.querySelector('.tab-btn[data-tab="add"]').click();
  document.getElementById('formTitle').textContent = 'تعديل المنتج';
  document.getElementById('editId').value = p.id;
  document.getElementById('pName').value = p.name||'';
  document.getElementById('pBrand').value = p.brand||'';
  document.getElementById('pCategory').value = p.category||'phone';
  document.getElementById('pPrice').value = p.price||'';
  document.getElementById('pOldPrice').value = p.oldPrice||'';
  document.getElementById('pDesc').value = p.description||'';
  currentImageBase64 = p.image || null;
  const preview = document.getElementById('imgPreview');
  if(p.image){ preview.src = p.image; preview.style.display='block'; document.getElementById('uploadHint').style.display='none'; }
  document.getElementById('specsList').innerHTML='';
  (p.specs||[]).forEach(s=> addSpecRow(s.label, s.value));
  document.getElementById('saveProductBtn').textContent = 'حفظ التعديلات';
  document.getElementById('cancelEditBtn').style.display='inline-block';
}

document.getElementById('cancelEditBtn').addEventListener('click', resetForm);
function resetForm(){
  document.getElementById('productForm').reset();
  document.getElementById('editId').value='';
  document.getElementById('formTitle').textContent='إضافة منتج جديد';
  document.getElementById('saveProductBtn').textContent='حفظ المنتج';
  document.getElementById('cancelEditBtn').style.display='none';
  document.getElementById('specsList').innerHTML='';
  document.getElementById('imgPreview').style.display='none';
  document.getElementById('uploadHint').style.display='block';
  document.getElementById('compressNote').textContent='';
  currentImageBase64 = null;
}

// ===== specs rows =====
function addSpecRow(label='', value=''){
  const row = document.createElement('div');
  row.className='spec-row';
  row.innerHTML = `
    <input type="text" placeholder="مثال: الذاكرة" class="spec-label" value="${label}">
    <input type="text" placeholder="مثال: 256GB" class="spec-value" value="${value}">
    <button type="button" class="spec-remove">✕</button>
  `;
  row.querySelector('.spec-remove').addEventListener('click', ()=> row.remove());
  document.getElementById('specsList').appendChild(row);
}
document.getElementById('addSpecBtn').addEventListener('click', ()=> addSpecRow());

// ===== image compression =====
let currentImageBase64 = null;

document.getElementById('imageInput').addEventListener('change', async (e)=>{
  const file = e.target.files[0];
  if(!file) return;
  const note = document.getElementById('compressNote');
  note.textContent = 'جارِ ضغط الصورة...';
  try{
    const originalKB = Math.round(file.size/1024);
    const compressed = await compressImage(file, 800, 0.62);
    currentImageBase64 = compressed;
    const preview = document.getElementById('imgPreview');
    preview.src = compressed;
    preview.style.display='block';
    document.getElementById('uploadHint').style.display='none';
    const newKB = Math.round((compressed.length*0.75)/1024);
    note.textContent = `تم ضغط الصورة: ${originalKB}KB ← ${newKB}KB ✅`;
  }catch(err){
    console.error(err);
    note.textContent = 'تعذر معالجة الصورة';
  }
});

function compressImage(file, maxWidth, quality){
  return new Promise((resolve, reject)=>{
    const reader = new FileReader();
    reader.onload = (e)=>{
      const img = new Image();
      img.onload = ()=>{
        let w = img.width, h = img.height;
        if(w > maxWidth){
          h = Math.round(h * (maxWidth/w));
          w = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0,0,w,h);
        ctx.drawImage(img, 0, 0, w, h);

        // shrink quality further if still large
        let q = quality;
        let dataUrl = canvas.toDataURL('image/jpeg', q);
        while(dataUrl.length > 700000 && q > 0.25){
          q -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', q);
        }
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ===== save product =====
document.getElementById('productForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const btn = document.getElementById('saveProductBtn');
  const editId = document.getElementById('editId').value;

  if(!currentImageBase64){
    showToast('لازم تضيف صورة للمنتج 📷');
    return;
  }

  const specs = Array.from(document.querySelectorAll('.spec-row')).map(row=>({
    label: row.querySelector('.spec-label').value.trim(),
    value: row.querySelector('.spec-value').value.trim()
  })).filter(s=> s.label && s.value);

  const data = {
    name: document.getElementById('pName').value.trim(),
    brand: document.getElementById('pBrand').value.trim(),
    category: document.getElementById('pCategory').value,
    price: Number(document.getElementById('pPrice').value),
    oldPrice: document.getElementById('pOldPrice').value ? Number(document.getElementById('pOldPrice').value) : null,
    description: document.getElementById('pDesc').value.trim(),
    specs,
    image: currentImageBase64
  };

  btn.disabled = true;
  btn.textContent = 'جارِ الحفظ...';
  try{
    if(editId){
      await db.collection('products').doc(editId).update(data);
      showToast('تم تحديث المنتج ✅');
    }else{
      data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection('products').add(data);
      showToast('تمت إضافة المنتج ✅');
    }
    resetForm();
    document.querySelector('.tab-btn[data-tab="products"]').click();
  }catch(err){
    console.error(err);
    showToast('صار خطأ أثناء الحفظ');
  }finally{
    btn.disabled = false;
    btn.textContent = editId ? 'حفظ التعديلات' : 'حفظ المنتج';
  }
});

// ===== stats =====
function renderStats(){
  if(!ORDERS.length && !PRODUCTS.length) return;

  const totalRevenue = ORDERS.filter(o=>o.status!=='ملغي').reduce((s,o)=>s+(o.total||0),0);
  const totalOrders = ORDERS.length;
  const newOrders = ORDERS.filter(o=>(o.status||'جديد')==='جديد').length;
  const totalProducts = PRODUCTS.length;

  document.getElementById('statsGrid').innerHTML = `
    <div class="stat-card gold"><div class="val">${totalRevenue.toLocaleString('en-US')} ر.س</div><div class="lbl">إجمالي المبيعات</div></div>
    <div class="stat-card"><div class="val">${totalOrders}</div><div class="lbl">إجمالي الطلبات</div></div>
    <div class="stat-card"><div class="val">${newOrders}</div><div class="lbl">طلبات جديدة</div></div>
    <div class="stat-card"><div class="val">${totalProducts}</div><div class="lbl">عدد المنتجات</div></div>
  `;

  // sales by category
  const catTotals = {};
  ORDERS.forEach(o=>{
    (o.items||[]).forEach(i=>{
      const prod = PRODUCTS.find(p=>p.id===i.productId);
      const cat = prod ? prod.category : 'phone';
      catTotals[cat] = (catTotals[cat]||0) + i.price*i.qty;
    });
  });
  const maxCat = Math.max(1, ...Object.values(catTotals));
  const catHtml = Object.keys(CATEGORY_LABELS).map(cat=>{
    const val = catTotals[cat]||0;
    const pct = Math.round((val/maxCat)*100);
    return `<div class="bar-row"><div class="bar-label">${CATEGORY_LABELS[cat]}</div><div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div><div class="bar-val">${val} ر.س</div></div>`;
  }).join('');
  document.getElementById('categoryChart').innerHTML = catHtml || `<div class="empty-note">لا توجد بيانات كافية</div>`;

  // top products by qty
  const qtyMap = {};
  ORDERS.forEach(o=> (o.items||[]).forEach(i=>{ qtyMap[i.name] = (qtyMap[i.name]||0) + i.qty; }));
  const top = Object.entries(qtyMap).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const maxQty = Math.max(1, ...top.map(t=>t[1]));
  const topHtml = top.map(([name,qty])=>{
    const pct = Math.round((qty/maxQty)*100);
    return `<div class="bar-row"><div class="bar-label">${name}</div><div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div><div class="bar-val">${qty} قطعة</div></div>`;
  }).join('');
  document.getElementById('topProducts').innerHTML = topHtml || `<div class="empty-note">لا توجد بيانات كافية</div>`;
}
