const searchContainer = document.getElementById("search");
const headerSearchInput = searchContainer?.querySelector(".search-input");

function activateSearch(event) {
  event.stopPropagation();
  searchContainer?.classList.add("active");
  headerSearchInput?.focus();
}

// header kereső nyit/zár
document.addEventListener("click", (e) => {
  if (!searchContainer?.contains(e.target)) {
    if ((headerSearchInput?.value || "").trim() === "") {
      searchContainer?.classList.remove("active");
    }
  }
});

// kereső állapot törlése
function clearSearchState() {
  const shopInp = document.getElementById("searchInput");
  if (shopInp) shopInp.value = "";

  if (headerSearchInput) headerSearchInput.value = "";

  const url = new URL(window.location);
  if (url.searchParams.has("search")) {
    url.searchParams.delete("search");
    history.replaceState({}, "", url);
  }

  window.dispatchEvent(new CustomEvent("shop:searchchange", { detail: "" }));
}


// ====== CHECKBOXOK ÉS ENTERES KERESÉS ======
function handleShopAction({ type, value }) {
  // Ha checkbox → töröljük a header keresőt
  if (type === "checkbox") clearSearchState();

  // Összegyűjtjük a checkboxokat
  const selectedTags = Array.from(document.querySelectorAll(".shopfilter input[type='checkbox']:checked"))
                            .map(c => c.dataset.tag)
                            .filter(Boolean);

  const params = new URLSearchParams();
  if (selectedTags.length) params.set("filter", selectedTags.join(","));
  if (type === "search" && value) params.set("search", value);

  // ha nem shop.html → átirányítás
  if (!/\/?shop\.html$/i.test(location.pathname)) {
    window.location.href = `shop.html?${params.toString()}`;
    return;
  }

  // ha már shop.html → alkalmazzuk a szűrést
  const shopSearchInput = document.getElementById("searchInput");
  if (type === "search" && shopSearchInput) shopSearchInput.value = value || "";

  window.dispatchEvent(new CustomEvent("shop:searchchange", { detail: value || "" }));
  if (typeof applyFilters === "function") applyFilters();
}

// Checkbox változás
document.querySelectorAll(".shopfilter input[type='checkbox']").forEach(cb => {
  cb.addEventListener("change", () => handleShopAction({ type: "checkbox" }));
});

// Header kereső Enter
headerSearchInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    const query = (headerSearchInput.value || "").trim();
    if (!query) return;
    handleShopAction({ type: "search", value: query });
  }
});

// ==== FELHASZNÁLÓ ÉS KOSÁR PANEL ====
document.addEventListener("DOMContentLoaded", () => {
  const userIcon = document.querySelector(".fa-user");
  const cartIcon = document.querySelector(".fa-basket-shopping");
  const popupUser = document.getElementById("popupUser");
  const popupCart = document.getElementById("popupCart");

  function togglePopup(popupToShow, popupToHide) {
    if (popupToShow.classList.contains("show")) {
      popupToShow.classList.remove("show");
    } else {
      popupToHide.classList.remove("show");
      popupToShow.classList.add("show");
    }
  }

  userIcon.addEventListener("click", (e) => {
    e.stopPropagation();
    togglePopup(popupUser, popupCart);
  });

  cartIcon.addEventListener("click", (e) => {
    e.stopPropagation();
    togglePopup(popupCart, popupUser);
  });

  document.addEventListener("click", () => {
    popupUser.classList.remove("show");
    popupCart.classList.remove("show");
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const slideWrapper = document.getElementById("slides");
  const carousel = document.querySelector(".carousel");
  const slides = slideWrapper.querySelectorAll(".slide");
  const total = slides.length;
  let current = 0;

  // Állítsd be a slides konténer szélességét az összes slide szélességére
  function setSlidesWidth() {
    const carouselWidth = carousel.clientWidth;
    slideWrapper.style.width = `${carouselWidth * total}px`;
    slides.forEach(slide => {
      slide.style.width = `${carouselWidth}px`;
    });
  }

  function updateCarousel() {
    const carouselWidth = carousel.clientWidth;
    slideWrapper.style.transform = `translateX(-${current * carouselWidth}px)`;
  }

  const nextBtn = document.getElementById("next");
  const prevBtn = document.getElementById("prev");

  function handleButtonsVisibility() {
    if(window.innerWidth <= 1200) {
      nextBtn.style.display = 'none';
      prevBtn.style.display = 'none';
    } else {
      nextBtn.style.display = 'block';
      prevBtn.style.display = 'block';
    }
  }

  // Swipe handling (ugyanaz mint előzőleg)
  let touchStartX = 0;
  let touchEndX = 0;

  slideWrapper.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  });

  slideWrapper.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipeGesture();
  });

  function handleSwipeGesture() {
    const swipeDistance = touchEndX - touchStartX;
    const swipeThreshold = 50;

    if (swipeDistance > swipeThreshold) {
      current = (current - 1 + total) % total;
      updateCarousel();
    } else if (swipeDistance < -swipeThreshold) {
      current = (current + 1) % total;
      updateCarousel();
    }
  }

  if (nextBtn && prevBtn) {
    nextBtn.addEventListener("click", () => {
      current = (current + 1) % total;
      updateCarousel();
    });

    prevBtn.addEventListener("click", () => {
      current = (current - 1 + total) % total;
      updateCarousel();
    });

    setInterval(() => {
      current = (current + 1) % total;
      updateCarousel();
    }, 7000);

    window.addEventListener('resize', () => {
      setSlidesWidth();
      updateCarousel();
      handleButtonsVisibility();
    });

    // Kezdeti beállítások
    setSlidesWidth();
    updateCarousel();
    handleButtonsVisibility();

  } else {
    console.warn("Nem található a 'next' vagy 'prev' gomb!");
  }
});


fetch('data.json')
  .then(response => response.json())
  .then(products => {
    const saleContainer = document.getElementById('products-container'); // akciós
    const normalContainer = document.getElementById('normal-products-container'); // normál

    // szétválasztjuk a termékeket
    const saleProducts = products.filter(p => p.oldPrice);
    const normalProducts = products.filter(p => !p.oldPrice);

    // megkeverjük a normál termékeket (Fisher–Yates shuffle)
    function shuffle(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }

    const shuffledNormal = shuffle(normalProducts);

    // max 4 akciós
    const displayedSales = saleProducts.length > 4 ? shuffle(saleProducts).slice(0, 4) : saleProducts;

    // max 8 normál
    const displayedNormal = shuffledNormal.slice(0, 8);

    // megjelenítés akciósok
    displayedSales.forEach(product => {
      const div = document.createElement('div');
      div.classList.add('salescube');
      div.innerHTML = `
        <a href="product.html?id=${product.id}">
          <img src="${product.image}" alt="${product.title}">
          <h1>${product.title}</h1>
          <p>${product.oldPrice}</p>
          <h3>${product.newPrice}</h3>
        </a>
      `;
      saleContainer?.appendChild(div);
    });

    // megjelenítés normálok (teljes kocka kattintható)
    displayedNormal.forEach(product => {
      const div = document.createElement('div');
      div.classList.add('cubes');
      div.innerHTML = `
        <a href="product.html?id=${product.id}">
          <img src="${product.image}" alt="${product.title}">
          <h1>${product.title}</h1>
          <div class="buttpri">
            <i class="fa-solid fa-basket-shopping"></i>
            <h3>${product.newPrice}</h3>
          </div>
        </a>
      `;
      normalContainer?.appendChild(div);
    });
  })
  .catch(error => {
    console.error('Hiba a termékek betöltésekor:', error);
  });


  // Lekérjük az URL-ből a product ID-t
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  if (productId) {
    fetch('data.json')
      .then(response => response.json())
      .then(products => {
        const product = products.find(p => p.id == productId);
        if (product) {
          // Kitöltjük a HTML elemeket
          document.getElementById('product-image').src = product.image;
          document.getElementById('product-image').alt = product.title;

          document.getElementById('product-title').textContent = product.title;

          // Ha van régi ár, akkor mutassuk, különben üres
          document.getElementById('product-oldprice').textContent = product.oldPrice ? `Régi ár: ${product.oldPrice}` : '';
          document.getElementById('product-newprice').textContent = product.newPrice;
        } else {
          console.error('Nincs ilyen termék ID.');
        }
      })
      .catch(err => console.error('Hiba a termék betöltésekor:', err));
  } else {
    console.error('Nem található termék ID az URL-ben.');
  }


    document.querySelectorAll(".shop-item h1").forEach(h1 => {
    h1.addEventListener("click", () => {
      let item = h1.parentElement;
      item.classList.toggle("open");
      let symbol = h1.querySelector("span");
      symbol.textContent = item.classList.contains("open") ? "−" : "+";
    });
  });



(() => {
  const MIN = 1, MAX = 10000;

  const minN = document.getElementById('minPrice');
  const maxN = document.getElementById('maxPrice');
  const minR = document.getElementById('minRange');
  const maxR = document.getElementById('maxRange');
  const fill = document.getElementById('rangeFill');

  // segédek
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const pct = (v) => ((v - MIN) / (MAX - MIN)) * 100;

  function updateFill(){
    const a = Number(minR.value), b = Number(maxR.value);
    fill.style.left  = pct(a) + '%';
    fill.style.right = (100 - pct(b)) + '%';
  }

  function emit(){
    // ha kell szűrni a listát:
    // document.getElementById('priceFilter').dispatchEvent(new CustomEvent('pricechange', {bubbles:true, detail:{min:+minR.value, max:+maxR.value}}));
  }

  // ---- Range -> Number (nem engedjük keresztezni) ----
  minR.addEventListener('input', () => {
    if (+minR.value > +maxR.value) minR.value = maxR.value;
    minN.value = minR.value; // itt már nyugodtan írhatjuk vissza
    updateFill(); emit();
  });

  maxR.addEventListener('input', () => {
    if (+maxR.value < +minR.value) maxR.value = minR.value;
    maxN.value = maxR.value;
    updateFill(); emit();
  });

  // ---- Number -> Range (gépelés közben NEM írjuk vissza a mezőt) ----
  minN.addEventListener('input', () => {
    if (minN.value === '') return;                // üres: hagyjuk gépelni
    let v = parseInt(minN.value); if (isNaN(v)) return;
    v = clamp(v, MIN, MAX);                       // csak a csúszkát mozgatjuk
    minR.value = v;
    updateFill(); emit();
  });

  maxN.addEventListener('input', () => {
    if (maxN.value === '') return;
    let v = parseInt(maxN.value); if (isNaN(v)) return;
    v = clamp(v, MIN, MAX);
    maxR.value = v;
    updateFill(); emit();
  });

  // ---- Véglegesítés blur/Enter: ekkor rendezünk és írunk vissza értéket ----
  function finalizeMin(){
    let a = minN.value === '' ? MIN : clamp(parseInt(minN.value)||MIN, MIN, MAX);
    let b = +maxR.value;
    if (a > b) { b = a; maxR.value = b; maxN.value = b; } // ha min > max, max-ot visszük fel
    minR.value = a; minN.value = a;
    updateFill(); emit();
  }
  function finalizeMax(){
    let b = maxN.value === '' ? MAX : clamp(parseInt(maxN.value)||MAX, MIN, MAX);
    let a = +minR.value;
    if (b < a) { a = b; minR.value = a; minN.value = a; } // ha max < min, min-t visszük le
    maxR.value = b; maxN.value = b;
    updateFill(); emit();
  }

  minN.addEventListener('blur', finalizeMin);
  maxN.addEventListener('blur', finalizeMax);
  minN.addEventListener('keydown', (e) => { if (e.key === 'Enter') minN.blur(); });
  maxN.addEventListener('keydown', (e) => { if (e.key === 'Enter') maxN.blur(); });

  // init alapértékek (ha üres a mező, a csúszka értékét mutatjuk)
  minN.value = minR.value;
  maxN.value = maxR.value;
  updateFill();
})();

 


// ====== SHOP FILTER LEHÚZÓ MENÜ ======
document.querySelectorAll(".shop-item h1").forEach(header => {
  header.addEventListener("click", () => {
    const dropdown = header.nextElementSibling; // a h1 utáni div.dropdownshop
    const span = header.querySelector("span");

    // váltogatjuk az open class-t
    dropdown.classList.toggle("open");

    // + jelet - jelekre cseréljük
    if (dropdown.classList.contains("open")) {
      span.textContent = "−";
    } else {
      span.textContent = "+";
    }
  });
});


document.addEventListener("DOMContentLoaded", () => {
  const userIcon = document.querySelector(".fa-user");
  const cartIcon = document.querySelector(".fa-basket-shopping");
  const popupUser = document.getElementById("popupUser");
  const popupCart = document.getElementById("popupCart");

  function togglePopup(popupToShow, popupToHide) {
    if (!popupToShow || !popupToHide) return;
    if (popupToShow.classList.contains("show")) {
      popupToShow.classList.remove("show");
    } else {
      popupToHide.classList.remove("show");
      popupToShow.classList.add("show");
    }
  }

  userIcon?.addEventListener("click", (e) => {
    e.stopPropagation();
    togglePopup(popupUser, popupCart);
  });

  cartIcon?.addEventListener("click", (e) => {
    e.stopPropagation();
    togglePopup(popupCart, popupUser);
  });

  document.addEventListener("click", () => {
    popupUser?.classList.remove("show");
    popupCart?.classList.remove("show");
  });
});

/****************
 * CAROUSEL     *
 ****************/
document.addEventListener("DOMContentLoaded", () => {
  const slideWrapper = document.getElementById("slides");
  const carousel = document.querySelector(".carousel");
  const slides = slideWrapper?.querySelectorAll(".slide") || [];
  const total = slides.length;
  let current = 0;

  function setSlidesWidth() {
    if (!carousel || !slideWrapper) return;
    const carouselWidth = carousel.clientWidth;
    slideWrapper.style.width = `${carouselWidth * total}px`;
    slides.forEach((slide) => {
      slide.style.width = `${carouselWidth}px`;
    });
  }

  function updateCarousel() {
    if (!carousel || !slideWrapper) return;
    const carouselWidth = carousel.clientWidth;
    slideWrapper.style.transform = `translateX(-${current * carouselWidth}px)`;
  }

  const nextBtn = document.getElementById("next");
  const prevBtn = document.getElementById("prev");

  function handleButtonsVisibility() {
    if (!nextBtn || !prevBtn) return;
    if (window.innerWidth <= 1200) {
      nextBtn.style.display = "none";
      prevBtn.style.display = "none";
    } else {
      nextBtn.style.display = "block";
      prevBtn.style.display = "block";
    }
  }

  // Swipe
  let touchStartX = 0;
  let touchEndX = 0;

  slideWrapper?.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
  });

  slideWrapper?.addEventListener("touchend", (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const swipeDistance = touchEndX - touchStartX;
    const swipeThreshold = 50;
    if (swipeDistance > swipeThreshold) {
      current = (current - 1 + total) % total;
    } else if (swipeDistance < -swipeThreshold) {
      current = (current + 1) % total;
    }
    updateCarousel();
  });

  if (nextBtn && prevBtn && slideWrapper && carousel) {
    nextBtn.addEventListener("click", () => {
      current = (current + 1) % total;
      updateCarousel();
    });

    prevBtn.addEventListener("click", () => {
      current = (current - 1 + total) % total;
      updateCarousel();
    });

    setInterval(() => {
      current = (current + 1) % total;
      updateCarousel();
    }, 7000);

    window.addEventListener("resize", () => {
      setSlidesWidth();
      updateCarousel();
      handleButtonsVisibility();
    });

    setSlidesWidth();
    updateCarousel();
    handleButtonsVisibility();
  }
});

/********************************
 * KEZDŐOLDAL TERMÉK BLOKKOK   *
 ********************************/
fetch("data.json")
  .then((r) => r.json())
  .then((products) => {
    const saleContainer = document.getElementById("products-container");
    const normalContainer = document.getElementById("normal-products-container");
    if (!Array.isArray(products)) return;

    const saleProducts = products.filter((p) => p.oldPrice);
    const normalProducts = products.filter((p) => !p.oldPrice);

    function shuffle(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }

    const displayedSales =
      saleProducts.length > 4 ? shuffle([...saleProducts]).slice(0, 4) : saleProducts;
    const displayedNormal = shuffle([...normalProducts]).slice(0, 8);

    displayedSales.forEach((product) => {
      const div = document.createElement("div");
      div.classList.add("salescube");
      div.innerHTML = `
        <a href="product.html?id=${product.id}">
          <img src="${product.image}" alt="${product.title}">
          <h1>${product.title}</h1>
          <p>${product.oldPrice || ""}</p>
          <h3>${product.newPrice || ""}</h3>
        </a>
      `;
      saleContainer?.appendChild(div);
    });

    displayedNormal.forEach((product) => {
      const div = document.createElement("div");
      div.classList.add("cubes");
      div.innerHTML = `
        <a href="product.html?id=${product.id}">
          <img src="${product.image}" alt="${product.title}">
          <h1>${product.title}</h1>
          <div class="buttpri">
            <i class="fa-solid fa-basket-shopping"></i>
            <h3>${product.newPrice || ""}</h3>
          </div>
        </a>
      `;
      normalContainer?.appendChild(div);
    });
  })
  .catch((e) => console.error("Hiba a termékek betöltésekor:", e));

/*************************
 * TERMÉKOLDAL KITÖLTÉS *
 *************************/
(() => {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");
  if (!productId) return;

  fetch("data.json")
    .then((res) => res.json())
    .then((products) => {
      const product = (products || []).find((p) => String(p.id) === String(productId));
      if (!product) return console.error("Nincs ilyen termék ID.");

      const img = document.getElementById("product-image");
      const title = document.getElementById("product-title");
      const oldP = document.getElementById("product-oldprice");
      const newP = document.getElementById("product-newprice");

      if (img) {
        img.src = product.image;
        img.alt = product.title;
      }
      if (title) title.textContent = product.title || "";
      if (oldP) oldP.textContent = product.oldPrice ? `Régi ár: ${product.oldPrice}` : "";
      if (newP) newP.textContent = product.newPrice || "";
    })
    .catch((err) => console.error("Hiba a termék betöltésekor:", err));
})();

/***********************
 * SHOP OLDAL LOGIKA   *
 ***********************/
document.addEventListener("DOMContentLoaded", () => {
  // csak akkor fut, ha van shop grid
  const shopContainer = document.querySelector(".shopcube");
  if (!shopContainer) return;

  // --- Segédek ---
  const normalizeText = (str) =>
    String(str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const getSearchEl = () =>
    document.getElementById("searchInput") ||
    document.querySelector("#search .search-input") ||
    document.querySelector(".search-input");

  const readSearch = () => {
    const el = getSearchEl();
    const v = (el?.value || "").trim();
    if (v) return normalizeText(v);
    // fallback: URL param
    const params = new URLSearchParams(window.location.search);
    return normalizeText(params.get("search") || "");
  };

  const setSearchFromURL = () => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get("search");
    if (!s) return;
    const el = getSearchEl();
    if (el && !el.value) el.value = s; // ne írjuk felül a kézzel beírtat
  };

  const getCheckedTags = () => {
    const boxes = document.querySelectorAll(".shopfilter input[type='checkbox']:checked");
    return Array.from(boxes)
      .map(
        (cb) =>
          cb.dataset.tag?.trim().toLowerCase() ||
          cb.value?.trim().toLowerCase() ||
          ""
      )
      .filter(Boolean);
  };

  const minPriceEl = document.getElementById("minPrice");
  const maxPriceEl = document.getElementById("maxPrice");
  const minRangeEl = document.getElementById("minRange");
  const maxRangeEl = document.getElementById("maxRange");

  const getMinPrice = () => parseInt(minPriceEl?.value) || 1;
  const getMaxPrice = () => parseInt(maxPriceEl?.value) || 10000;

  // --- Render ---
  const renderProducts = (products) => {
    shopContainer.innerHTML = "";

    if (!products.length) {
      const hasText = !!readSearch();
      shopContainer.innerHTML = `<p class="no-products">${
        hasText ? "A keresett termék nem létezik." : "A szűrők alapján nem található termék."
      }</p>`;
      return;
    }

    products.forEach((p) => {
      const div = document.createElement("div");
      div.classList.add("scube");
      const oldP = p.oldPrice ? `<h2>${p.oldPrice}</h2>` : `<h2></h2>`;
      const priceText = /\d/.test(String(p.newPrice)) ? String(p.newPrice) : "";

      div.innerHTML = `
        <a href="product.html?id=${p.id}">
          <img src="${p.image}" alt="${p.title}">
          <h1>${p.title}</h1>
          <span>${oldP}</span>
          <h3>${priceText}</h3>
          <div class="sbutton">
            <a class="favorit"><i class="fa-solid fa-star"></i></a>
            <a class="cart"><i class="fa-solid fa-basket-shopping"></i></a>
          </div>
        </a>
      `;
      shopContainer.appendChild(div);
    });
  };

  // --- Fő szűrés ---
  let allProducts = [];
  let allProductsShuffled = [];

  const applyFilters = () => {
    if (!allProductsShuffled.length) return;

    const searchValue = readSearch(); // mindig az input az elsődleges
    const checkedTags = getCheckedTags();
    const minPrice = getMinPrice();
    const maxPrice = getMaxPrice();

    const filtered = allProductsShuffled.filter((p) => {
      const priceNum = parseInt(String(p.newPrice).replace(/\D/g, "")) || 0;
      const matchesPrice = priceNum >= minPrice && priceNum <= maxPrice;

      const productTagsRaw = Array.isArray(p.tags)
        ? p.tags
        : Array.isArray(p.tag)
        ? p.tag
        : typeof p.tag === "string"
        ? p.tag.split(",")
        : [];
      const productTags = productTagsRaw.map((t) => String(t).trim().toLowerCase()).filter(Boolean);
      const matchesTag = checkedTags.length === 0 || productTags.some((t) => checkedTags.includes(t));

      const productTitle = normalizeText(p.title);
      const matchesSearch =
        !searchValue || searchValue.split(/\s+/).every((w) => productTitle.includes(w));

      return matchesPrice && matchesTag && matchesSearch;
    });

    renderProducts(filtered);
  };

  // --- URL sync a shopon belül (reload nélkül) ---
  const syncURLFromInput = () => {
    const el = getSearchEl();
    const q = (el?.value || "").trim();
    const url = new URL(window.location);
    if (q) url.searchParams.set("search", q);
    else url.searchParams.delete("search");
    history.replaceState({}, "", url);
  };

  // --- Események ---
  // header/searchInput gépelés a shopon → élő szűrés
  const searchEl = getSearchEl();
  searchEl?.addEventListener("input", () => {
    syncURLFromInput();
    applyFilters();
  });
  searchEl?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      syncURLFromInput();
      applyFilters();
    }
  });

  // külső esemény: fejléc enter másik oldalon → shop:searchchange
  window.addEventListener("shop:searchchange", (ev) => {
    const q = String(ev.detail || "");
    const el = getSearchEl();
    if (el) el.value = q;
    applyFilters();
  });

  // checkboxok
  document.querySelectorAll(".shopfilter input[type='checkbox']").forEach((cb) => {
    cb.addEventListener("change", applyFilters);
  });

  // ár inputok
  minPriceEl?.addEventListener("input", applyFilters);
  maxPriceEl?.addEventListener("input", applyFilters);

  // range → input tükrözés + szűrés
  minRangeEl?.addEventListener("input", (e) => {
    if (minPriceEl) minPriceEl.value = e.target.value;
    applyFilters();
  });
  maxRangeEl?.addEventListener("input", (e) => {
    if (maxPriceEl) maxPriceEl.value = e.target.value;
    applyFilters();
  });

  // --- Kezdés: URL-ből betöltjük a keresőt, majd szűrünk ---
  setSearchFromURL();

  fetch("data.json")
    .then((res) => res.json())
    .then((data) => {
      allProducts = Array.isArray(data) ? data : data?.products || [];
      allProductsShuffled = shuffle([...allProducts]);
      applyFilters();
    })
    .catch((err) => {
      console.error("Hiba a termékek betöltésénél:", err);
      shopContainer.innerHTML = `<p class="no-products">Hiba a termékek betöltésénél.</p>`;
    });
});

/****************************
 * ÁR SLIDER (vizuális rész) *
 ****************************/
(() => {
  const MIN = 1,
    MAX = 10000;

  const minN = document.getElementById("minPrice");
  const maxN = document.getElementById("maxPrice");
  const minR = document.getElementById("minRange");
  const maxR = document.getElementById("maxRange");
  const fill = document.getElementById("rangeFill");

  if (!minN || !maxN || !minR || !maxR) return;

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const pct = (v) => ((v - MIN) / (MAX - MIN)) * 100;

  function updateFill() {
    if (!fill) return;
    const a = Number(minR.value),
      b = Number(maxR.value);
    fill.style.left = pct(a) + "%";
    fill.style.right = 100 - pct(b) + "%";
  }

  function finalizeMin() {
    let a = minN.value === "" ? MIN : clamp(parseInt(minN.value) || MIN, MIN, MAX);
    let b = +maxR.value;
    if (a > b) {
      b = a;
      maxR.value = b;
      maxN.value = b;
    }
    minR.value = a;
    minN.value = a;
    updateFill();
    // ha shopon vagyunk, fut a szűrés (a shop rész figyeli az input eseményt is)
    minN.dispatchEvent(new Event("input", { bubbles: true }));
  }
  function finalizeMax() {
    let b = maxN.value === "" ? MAX : clamp(parseInt(maxN.value) || MAX, MIN, MAX);
    let a = +minR.value;
    if (b < a) {
      a = b;
      minR.value = a;
      minN.value = a;
    }
    maxR.value = b;
    maxN.value = b;
    updateFill();
    maxN.dispatchEvent(new Event("input", { bubbles: true }));
  }

  // Range -> Number
  minR.addEventListener("input", () => {
    if (+minR.value > +maxR.value) minR.value = maxR.value;
    minN.value = minR.value;
    updateFill();
    minN.dispatchEvent(new Event("input", { bubbles: true }));
  });

  maxR.addEventListener("input", () => {
    if (+maxR.value < +minR.value) maxR.value = minR.value;
    maxN.value = maxR.value;
    updateFill();
    maxN.dispatchEvent(new Event("input", { bubbles: true }));
  });

  // Number -> Range
  minN.addEventListener("input", () => {
    if (minN.value === "") return;
    let v = parseInt(minN.value);
    if (isNaN(v)) return;
    v = clamp(v, MIN, MAX);
    minR.value = v;
    updateFill();
  });

  maxN.addEventListener("input", () => {
    if (maxN.value === "") return;
    let v = parseInt(maxN.value);
    if (isNaN(v)) return;
    v = clamp(v, MIN, MAX);
    maxR.value = v;
    updateFill();
  });

  minN.addEventListener("blur", finalizeMin);
  maxN.addEventListener("blur", finalizeMax);
  minN.addEventListener("keydown", (e) => e.key === "Enter" && finalizeMin());
  maxN.addEventListener("keydown", (e) => e.key === "Enter" && finalizeMax());

  // init
  minN.value = minR.value || MIN;
  maxN.value = maxR.value || MAX;
  updateFill();
})();