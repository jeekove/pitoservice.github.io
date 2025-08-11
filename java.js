// ==== KERESŐ MEZŐ ====
const searchContainer = document.getElementById("search");
const searchInput = searchContainer.querySelector(".search-input");

function activateSearch(event) {
    event.stopPropagation();
    searchContainer.classList.add("active");
    searchInput.focus();
}

document.addEventListener("click", function (e) {
    if (!searchContainer.contains(e.target)) {
        if (searchInput.value.trim() === "") {
            searchContainer.classList.remove("active");
        }
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