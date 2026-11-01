/* ============================================================
   SUPABASE SOZLAMALARI
   ============================================================ */
const SUPABASE_URL  = "https://iqewvqoxjhyyecipdohv.supabase.co";
const SUPABASE_ANON = "sb_publishable_Dpjg-tDUt51x-8eLV2Limg_iLJC3wsk";


const TABLE_PRODUCTS = "products";
const TABLE_MARKUPS  = "price_markups";
const PER_PAGE = 20;

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

/* ============================================================
   HOLAT
   ============================================================ */
const state = {
  query: "",
  page: 1,
  total: 0,
  markups: {},
  markupsList: [],
};

/* ============================================================
   DOM
   ============================================================ */
const dom = {
  markupsList:       document.getElementById("markupsList"),
  addMarkupBtn:      document.getElementById("addMarkupBtn"),
  markupModal:       document.getElementById("markupModal"),
  markupModalTitle:  document.getElementById("markupModalTitle"),
  markupModalClose:  document.getElementById("markupModalClose"),
  markupForm:        document.getElementById("markupForm"),
  markupId:          document.getElementById("markupId"),
  markupType:        document.getElementById("markupType"),
  markupValue:       document.getElementById("markupValue"),
  markupCancelBtn:   document.getElementById("markupCancelBtn"),

  searchInput:       document.getElementById("searchInput"),
  searchBtn:         document.getElementById("searchBtn"),
  grid:              document.getElementById("grid"),
  pagination:        document.getElementById("pagination"),
  resultsInfo:       document.getElementById("resultsInfo"),
  loader:            document.getElementById("loader"),
  errorBox:          document.getElementById("errorBox"),

  productModal:      document.getElementById("productModal"),
  productModalTitle: document.getElementById("productModalTitle"),
  productModalClose: document.getElementById("productModalClose"),
  productForm:       document.getElementById("productForm"),
  productId:         document.getElementById("productId"),
  productModel:      document.getElementById("productModel"),
  productPhone:      document.getElementById("productPhone"),
  productBrand:      document.getElementById("productBrand"),
  productType:       document.getElementById("productType"),
  productPrice:      document.getElementById("productPrice"),
  productCancelBtn:  document.getElementById("productCancelBtn"),
};

/* ============================================================
   TOAST
   ============================================================ */
function toast(message, type = "success") {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 300);
  }, 2500);
}

/* ============================================================
   YORDAMCHI
   ============================================================ */
function showLoader(v) { dom.loader.classList.toggle("show", v); }

function showError(title, msg) {
  dom.errorBox.classList.add("show");
  dom.errorBox.innerHTML = `<div class="error-inner"><strong>⚠ ${esc(title)}</strong>${esc(msg)}</div>`;
}
function hideError() {
  dom.errorBox.classList.remove("show");
  dom.errorBox.innerHTML = "";
}

function formatPrice(n) {
  if (n === null || n === undefined || isNaN(Number(n))) return "—";
  return Number(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " so'm";
}

function esc(s) {
  if (s === null || s === undefined) return "";
  return String(s).replace(
    /[&<>"']/g,
    (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])
  );
}

/* ============================================================
   1) USTAMALAR
   ============================================================ */
async function loadMarkups() {
  try {
    const { data, error } = await sb
      .from(TABLE_MARKUPS)
      .select("*")
      .order("type", { ascending: true });

    if (error) throw error;

    state.markupsList = data || [];
    state.markups = {};
    state.markupsList.forEach((m) => {
      state.markups[m.type] = Number(m.markup) || 0;
    });

    renderMarkups();
  } catch (err) {
    console.error("[markups] xato:", err);
    dom.markupsList.innerHTML =
      `<div class="panel-loading" style="color:#f87171">Yuklab bo'lmadi: ${esc(err.message)}</div>`;
  }
}

function renderMarkups() {
  if (state.markupsList.length === 0) {
    dom.markupsList.innerHTML =
      `<div class="panel-loading">Hozircha ustama qo'shilmagan. "+ Yangi ustama" tugmasini bosing.</div>`;
    return;
  }

  dom.markupsList.innerHTML = state.markupsList
    .map(
      (m) => `
      <div class="markup-item">
        <div class="info">
          <div class="type">${esc(m.type)}</div>
          <div class="value">+ ${formatPrice(m.markup)}</div>
        </div>
        <div class="actions">
          <button class="icon-btn" data-action="edit-markup" data-id="${m.id}" title="Tahrirlash">✏️</button>
          <button class="icon-btn danger" data-action="delete-markup" data-id="${m.id}" title="O'chirish">🗑️</button>
        </div>
      </div>`
    )
    .join("");

  dom.markupsList.querySelectorAll('[data-action="edit-markup"]').forEach((btn) => {
    btn.addEventListener("click", () => openMarkupModal(Number(btn.dataset.id)));
  });
  dom.markupsList.querySelectorAll('[data-action="delete-markup"]').forEach((btn) => {
    btn.addEventListener("click", () => deleteMarkup(Number(btn.dataset.id)));
  });
}

function openMarkupModal(id = null) {
  dom.markupForm.reset();
  dom.markupId.value = "";
  dom.markupModalTitle.textContent = id ? "Ustamani tahrirlash" : "Yangi ustama";

  if (id) {
    const m = state.markupsList.find((x) => x.id === id);
    if (m) {
      dom.markupId.value = m.id;
      dom.markupType.value = m.type;
      dom.markupValue.value = m.markup;
    }
  }

  dom.markupModal.classList.add("show");
  setTimeout(() => dom.markupType.focus(), 100);
}

function closeMarkupModal() { dom.markupModal.classList.remove("show"); }

async function saveMarkup(e) {
  e.preventDefault();
  const id    = dom.markupId.value;
  const type  = dom.markupType.value.trim();
  const value = Number(dom.markupValue.value);

  if (!type) return toast("Turini kiriting", "error");
  if (isNaN(value) || value < 0) return toast("To'g'ri summa kiriting", "error");

  try {
    if (id) {
      const { error } = await sb
        .from(TABLE_MARKUPS)
        .update({ type, markup: value })
        .eq("id", id);
      if (error) throw error;
      toast("Ustama yangilandi");
    } else {
      const { error } = await sb
        .from(TABLE_MARKUPS)
        .insert({ type, markup: value });
      if (error) throw error;
      toast("Yangi ustama qo'shildi");
    }

    closeMarkupModal();
    await loadMarkups();
    await fetchProducts();
  } catch (err) {
    console.error(err);
    toast("Xato: " + err.message, "error");
  }
}

async function deleteMarkup(id) {
  if (!confirm("Bu ustamani o'chirishni tasdiqlaysizmi?")) return;
  try {
    const { error } = await sb.from(TABLE_MARKUPS).delete().eq("id", id);
    if (error) throw error;
    toast("Ustama o'chirildi");
    await loadMarkups();
    await fetchProducts();
  } catch (err) {
    console.error(err);
    toast("Xato: " + err.message, "error");
  }
}

dom.addMarkupBtn.addEventListener("click", () => openMarkupModal());
dom.markupModalClose.addEventListener("click", closeMarkupModal);
dom.markupCancelBtn.addEventListener("click", closeMarkupModal);
dom.markupForm.addEventListener("submit", saveMarkup);
dom.markupModal.addEventListener("click", (e) => {
  if (e.target === dom.markupModal) closeMarkupModal();
});

/* ============================================================
   2) MAHSULOTLAR
   ============================================================ */
async function fetchProducts() {
  showLoader(true);
  hideError();

  const from = (state.page - 1) * PER_PAGE;
  const to   = from + PER_PAGE - 1;

  try {
    let query = sb.from(TABLE_PRODUCTS).select("*", { count: "exact" });

    if (state.query) {
      const q = state.query.replace(/[%_\\]/g, "");
      query = query.or(
        `model.ilike.%${q}%,` +
        `phone.ilike.%${q}%,` +
        `brand.ilike.%${q}%,` +
        `type.ilike.%${q}%`
      );
    }

    query = query.order("id", { ascending: true }).range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    state.total = count || 0;
    renderProducts(data || []);
    renderPagination();
  } catch (err) {
    console.error("[products] xato:", err);
    showError("Ma'lumotlarni yuklab bo'lmadi", err.message);
    dom.grid.innerHTML = "";
    dom.pagination.innerHTML = "";
    dom.resultsInfo.textContent = "";
  } finally {
    showLoader(false);
  }
}

function renderProducts(items) {
  if (!items || items.length === 0) {
    dom.grid.innerHTML = `
      <div class="empty">
        <span>🔍</span>
        Hech qanday mahsulot topilmadi.
      </div>`;
    dom.resultsInfo.textContent = "0 ta natija";
    return;
  }

  const totalPages = Math.max(1, Math.ceil(state.total / PER_PAGE));
  dom.resultsInfo.textContent =
    `Jami ${state.total} ta natija — ${state.page}-sahifa (${totalPages} sahifadan)`;

  dom.grid.innerHTML = items
    .map((p) => {
      const markup = state.markups[p.type] || 0;
      const base   = Number(p.price) || 0;
      const final  = base + markup;

      // MUHIM: bazada brand = telefon modeli, phone = telefon markasi
      const phoneModel = p.brand || "";   // y1s, IP XS, RM NOTE 10
      const phoneBrand = p.phone || "";   // Samsung, Iphone, Redmi

      const title = phoneModel.trim() !== ""
        ? phoneModel
        : (p.model || "—");

      return `
        <div class="card">
          <button class="edit-btn" data-action="edit-product" data-id="${p.id}" title="Tahrirlash">✏️</button>
          <div class="model">${esc(title)}</div>

          <div class="row">
            <span class="k">Zapchast kodi:</span>
            <span class="v">${esc(p.model || "—")}</span>
          </div>
          <div class="row">
            <span class="k">Telefon markasi:</span>
            <span class="v brands">${esc(phoneBrand || "—")}</span>
          </div>
          <div class="row">
            <span class="k">Telefon modeli:</span>
            <span class="v">${esc(phoneModel || "—")}</span>
          </div>
          <div class="row">
            <span class="k">Zapchast turi:</span>
            <span class="v"><span class="type-tag">${esc(p.type || "—")}</span></span>
          </div>

          <div class="price">
            <div class="price-main">${formatPrice(final)}</div>
            <div class="price-base">
              Asosiy: ${formatPrice(base)}
              ${markup > 0 ? `+ ustama: <b>${formatPrice(markup)}</b>` : ""}
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  // Tahrirlash tugmalariga hodisa (id'ni to'g'ri o'qish)
  dom.grid.querySelectorAll('[data-action="edit-product"]').forEach((btn) => {
    btn.addEventListener("click", () => openProductModal(btn.dataset.id));
  });
}

/* ============================================================
   3) MAHSULOT MODALI
   ============================================================ */
async function openProductModal(id) {
  try {
    const { data, error } = await sb
      .from(TABLE_PRODUCTS)
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    dom.productId.value    = data.id;
    dom.productModel.value = data.model || "";
    // MUHIM: brend→phone maydoni, model→brand maydoni
    dom.productBrand.value = data.phone || "";   // telefon markasi
    dom.productPhone.value = data.brand || "";   // telefon modeli
    dom.productType.value  = data.type || "";
    dom.productPrice.value = data.price ?? 0;

    dom.productModalTitle.textContent = `Tahrirlash: ${data.model}`;
    dom.productModal.classList.add("show");
    setTimeout(() => dom.productModel.focus(), 100);
  } catch (err) {
    console.error("[openProductModal]", err);
    toast("Mahsulot yuklanmadi: " + err.message, "error");
  }
}

function closeProductModal() {
  dom.productModal.classList.remove("show");
  dom.productForm.reset();
  dom.productId.value = "";
}

async function saveProduct(e) {
  e.preventDefault();
  const id = dom.productId.value;
  if (!id) return toast("ID topilmadi", "error");

  const updates = {
    model: dom.productModel.value.trim(),
    phone: dom.productPhone.value.trim(),
    brand: dom.productBrand.value.trim() || null,
    type:  dom.productType.value.trim(),
    price: Number(dom.productPrice.value),
  };

  if (!updates.model) return toast("Zapchast kodi bo'sh", "error");
  if (!updates.phone) return toast("Telefon modeli bo'sh", "error");
  if (!updates.type)  return toast("Zapchast turi bo'sh", "error");
  if (isNaN(updates.price) || updates.price < 0) return toast("Narx noto'g'ri", "error");

  try {
    const { error } = await sb
      .from(TABLE_PRODUCTS)
      .update(updates)
      .eq("id", id);

    if (error) throw error;

    toast("Mahsulot yangilandi");
    closeProductModal();
    await fetchProducts();
  } catch (err) {
    console.error(err);
    toast("Xato: " + err.message, "error");
  }
}

dom.productModalClose.addEventListener("click", closeProductModal);
dom.productCancelBtn.addEventListener("click", closeProductModal);
dom.productForm.addEventListener("submit", saveProduct);
dom.productModal.addEventListener("click", (e) => {
  if (e.target === dom.productModal) closeProductModal();
});

/* ============================================================
   4) QIDIRUV
   ============================================================ */
dom.searchBtn.addEventListener("click", () => {
  state.query = dom.searchInput.value.trim();
  state.page = 1;
  fetchProducts();
});

dom.searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    state.query = dom.searchInput.value.trim();
    state.page = 1;
    fetchProducts();
  }
});

let debounceTimer;
dom.searchInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    state.query = dom.searchInput.value.trim();
    state.page = 1;
    fetchProducts();
  }, 350);
});

/* ============================================================
   5) PAGINATION
   ============================================================ */
function renderPagination() {
  const totalPages = Math.max(1, Math.ceil(state.total / PER_PAGE));
  dom.pagination.innerHTML = "";
  if (totalPages <= 1) return;

  const addBtn = (label, page, disabled = false, active = false) => {
    const b = document.createElement("button");
    b.className = "page-btn" + (active ? " active" : "");
    b.textContent = label;
    b.disabled = disabled;
    if (!disabled && !active) {
      b.onclick = () => {
        state.page = page;
        fetchProducts();
        window.scrollTo({ top: 0, behavior: "smooth" });
      };
    }
    dom.pagination.appendChild(b);
  };

  const addDots = () => {
    const s = document.createElement("span");
    s.className = "page-dots";
    s.textContent = "…";
    dom.pagination.appendChild(s);
  };

  addBtn("«", state.page - 1, state.page === 1);

  const pages = [];
  const cur = state.page;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - cur) <= 2) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  pages.forEach((p) => {
    if (p === "...") addDots();
    else addBtn(p, p, false, p === cur);
  });

  addBtn("»", state.page + 1, state.page === totalPages);
}

/* ============================================================
   ISHGA TUSHIRISH
   ============================================================ */
async function init() {
  await loadMarkups();
  await fetchProducts();
}

init();