const CONFIG_URL = "content-config.json";
const state = {
  photos: [],
  currentPhotoIndex: 0,
  activeModal: null,
  modalReturnFocus: null,
};

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("year").textContent = new Date().getFullYear();
  setupNavigation();
  setupAnimations();
  setupModalControls();
  loadConfig();
});

function setupNavigation() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("siteNav");

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    nav.classList.toggle("open");
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

function setupAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll("[data-animate]").forEach((el) => {
    observer.observe(el);
  });
}

async function loadConfig() {
  try {
    const response = await fetch(CONFIG_URL);
    if (!response.ok) {
      throw new Error("Nepodarilo sa načítať obsah.");
    }
    const data = await response.json();
    renderHero(data);
    renderVideos(data.videos || []);
    renderPhotos(data.photos || []);
    renderPoems(data.poems || []);
  } catch (error) {
    console.error(error);
    const bio = document.getElementById("bioText");
    bio.textContent = "Ospravedlňujem sa, obsah sa teraz nepodarilo načítať.";
  }
}

function renderHero(data) {
  const bio = document.getElementById("bioText");
  const photo = document.getElementById("mainPhoto");
  bio.textContent = data.bio || "";
  if (data.mainPhoto) {
    photo.src = data.mainPhoto;
  }
  photo.alt = "Portrét A. ko.";
}

function renderVideos(videos) {
  const list = document.getElementById("videoList");
  list.innerHTML = "";
  if (!videos.length) {
    list.innerHTML = "<p>Video obsah bude čoskoro doplnený.</p>";
    return;
  }

  videos.forEach((video) => {
    const card = document.createElement("article");
    card.className = "card";

    const heading = document.createElement("h3");
    heading.textContent = video.title;

    const annotation = document.createElement("p");
    annotation.textContent = video.annotation;

    const embedWrapper = document.createElement("div");
    embedWrapper.className = "video-embed";
    const iframe = document.createElement("iframe");
    iframe.src = getYoutubeEmbedUrl(video.url);
    iframe.title = `${video.title} – video`;
    iframe.loading = "lazy";
    iframe.setAttribute(
      "allow",
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    );
    iframe.allowFullscreen = true;
    embedWrapper.appendChild(iframe);

    card.append(heading, annotation, embedWrapper);
    list.appendChild(card);
  });
}

function getYoutubeEmbedUrl(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    }
    if (u.searchParams.has("v")) {
      return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
    }
    return url;
  } catch (err) {
    return url;
  }
}

function renderPhotos(photos) {
  const gallery = document.getElementById("photoGallery");
  gallery.innerHTML = "";
  state.photos = photos;

  if (!photos.length) {
    gallery.innerHTML = "<p>Galéria bude čoskoro sprístupnená.</p>";
    return;
  }

  photos.forEach((photo, index) => {
    const button = document.createElement("button");
    button.setAttribute("aria-label", photo.title || "Fotografia");
    const img = document.createElement("img");
    img.src = photo.src;
    img.alt = photo.title || "Fotografia";
    button.appendChild(img);
    button.addEventListener("click", () => openPhotoModal(index));
    gallery.appendChild(button);
  });
}

function openPhotoModal(index) {
  state.currentPhotoIndex = index;
  updatePhotoModal();
  openModal("photo");
}

function updatePhotoModal() {
  const photo = state.photos[state.currentPhotoIndex];
  if (!photo) return;
  const img = document.getElementById("lightboxImage");
  const title = document.getElementById("lightboxTitle");
  const annotation = document.getElementById("lightboxAnnotation");

  img.src = photo.src;
  img.alt = photo.title || "Fotografia";
  title.textContent = photo.title || "";
  annotation.textContent = photo.annotation || "";
}

function renderPoems(poems) {
  const list = document.getElementById("poemList");
  list.innerHTML = "";

  if (!poems.length) {
    list.innerHTML = "<p>Poetická časť je v príprave.</p>";
    return;
  }

  poems.forEach((poem, index) => {
    const button = document.createElement("button");
    button.className = "poem-item";
    button.type = "button";
    button.setAttribute("data-index", index);
    button.innerHTML = `<strong>${poem.title}</strong><br><span>${poem.annotation}</span>`;
    button.addEventListener("click", () => {
      list.querySelectorAll("button").forEach((btn) => btn.setAttribute("aria-pressed", "false"));
      button.setAttribute("aria-pressed", "true");
      loadPoem(poem);
    });
    list.appendChild(button);
  });
}

async function loadPoem(poem) {
  const detail = document.getElementById("poemDetail");
  detail.innerHTML = "<p>Načítavam báseň...</p>";
  try {
    const response = await fetch(poem.file);
    if (!response.ok) throw new Error("Poéziu sa nepodarilo načítať.");
    const text = await response.text();
    const article = document.createElement("div");
    article.innerHTML = `
      <h3>${poem.title}</h3>
      <p class="poem-annotation">${poem.annotation || ""}</p>
      <pre>${text}</pre>
    `;
    if (poem.audio) {
      const player = document.createElement("audio");
      player.controls = true;
      player.src = poem.audio;
      player.setAttribute("aria-label", `Audio verzia básne ${poem.title}`);
      article.appendChild(player);
    }
    detail.innerHTML = "";
    detail.appendChild(article);
  } catch (error) {
    console.error(error);
    detail.innerHTML = "<p>Ospravedlňujem sa, báseň sa nepodarilo načítať.</p>";
  }
}

function setupModalControls() {
  document.querySelectorAll("[data-close-modal]").forEach((el) => {
    el.addEventListener("click", closeModal);
  });

  document.querySelectorAll("[data-photo-nav]").forEach((button) => {
    button.addEventListener("click", (event) => {
      if (!state.photos.length) return;
      if (event.currentTarget.dataset.photoNav === "prev") {
        state.currentPhotoIndex = (state.currentPhotoIndex - 1 + state.photos.length) % state.photos.length;
      } else {
        state.currentPhotoIndex = (state.currentPhotoIndex + 1) % state.photos.length;
      }
      updatePhotoModal();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.activeModal) {
      closeModal();
    }
    if (state.activeModal === "photo") {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        document.querySelector('[data-photo-nav="prev"]').click();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        document.querySelector('[data-photo-nav="next"]').click();
      }
    }
  });
}

function openModal(name) {
  const modal = document.querySelector(`.modal[data-modal="${name}"]`);
  if (!modal) return;
  state.activeModal = name;
  state.modalReturnFocus = document.activeElement;
  modal.setAttribute("aria-hidden", "false");
  const focusable = modal.querySelector("button, [href], input, textarea, select, [tabindex]:not([tabindex='-1'])");
  if (focusable) {
    focusable.focus();
  }
}

function closeModal() {
  if (!state.activeModal) return;
  const modal = document.querySelector(`.modal[data-modal="${state.activeModal}"]`);
  modal.setAttribute("aria-hidden", "true");
  state.activeModal = null;
  if (state.modalReturnFocus) {
    state.modalReturnFocus.focus();
    state.modalReturnFocus = null;
  }
}
