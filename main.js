const CONFIG_URL = "content-config.json";
const DEFAULT_PHOTO_FOLDER = "assets/photos";
const PHOTO_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"];
const annotationCache = new Map();
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
    await renderPhotos(data.photos || [], data.photoFolder || DEFAULT_PHOTO_FOLDER);
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
  bio.classList.add("annotation");
  applyAnnotation(
    bio,
    {
      annotation: data.bio,
      annotationFile: data.bioFile,
    },
    "Načítavam príbeh..."
  );
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

    const annotation = document.createElement("div");
    annotation.className = "annotation";
    applyAnnotation(annotation, video);

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

    card.append(heading, embedWrapper, annotation);
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

async function renderPhotos(configPhotos, photoFolder) {
  const gallery = document.getElementById("photoGallery");
  gallery.innerHTML = "";

  let mergedPhotos = configPhotos;
  try {
    const discovered = await discoverPhotos(photoFolder);
    mergedPhotos = mergePhotoEntries(configPhotos, discovered);
  } catch (error) {
    console.warn("Fotografie sa podarilo načítať iba z konfigurácie:", error);
  }

  state.photos = mergedPhotos;

  if (!mergedPhotos.length) {
    gallery.innerHTML = "<p>Galéria bude čoskoro sprístupnená.</p>";
    return;
  }

  mergedPhotos.forEach((photo, index) => {
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
  annotation.classList.add("annotation");

  img.src = photo.src;
  img.alt = photo.title || "Fotografia";
  title.textContent = photo.title || "";
  applyAnnotation(annotation, photo, "Načítavam popis...");
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

    const title = document.createElement("strong");
    title.textContent = poem.title;

    const annotation = document.createElement("div");
    annotation.className = "annotation";
    applyAnnotation(annotation, poem);

    button.append(title, annotation);
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
    article.className = "poem-article";

    const heading = document.createElement("h3");
    heading.textContent = poem.title;

    const annotation = document.createElement("div");
    annotation.className = "poem-annotation annotation";
    applyAnnotation(annotation, poem, "Načítavam anotáciu...");

    const poemBody = document.createElement("pre");
    poemBody.textContent = text;

    article.append(heading, annotation, poemBody);
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

async function discoverPhotos(photoFolder = DEFAULT_PHOTO_FOLDER) {
  const folder = (photoFolder || DEFAULT_PHOTO_FOLDER).replace(/\/+$/, "");
  const manifestPhotos = await tryLoadPhotoManifest(folder);
  if (manifestPhotos.length) {
    return manifestPhotos;
  }
  return tryScrapePhotoDirectory(folder);
}

async function tryLoadPhotoManifest(folder) {
  const candidates = [
    `${folder}/photos-manifest.json`,
    `${folder}/manifest.json`,
  ];

  for (const url of candidates) {
    const entries = await fetchManifestEntries(url, folder);
    if (entries.length) {
      return entries;
    }
  }
  return [];
}

async function fetchManifestEntries(url, folder) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      return [];
    }
    const payload = await response.json();
    if (!Array.isArray(payload)) {
      return [];
    }
    return payload
      .map((entry) => normalizePhotoEntry(entry, folder))
      .filter(Boolean);
  } catch (error) {
    return [];
  }
}

async function tryScrapePhotoDirectory(folder) {
  try {
    const response = await fetch(`${folder}/`, { cache: "no-store" });
    if (!response.ok) {
      return [];
    }
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text")) {
      return [];
    }
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const links = Array.from(doc.querySelectorAll("a"));
    return links
      .map((link) => link.getAttribute("href") || "")
      .filter((href) => PHOTO_EXTENSIONS.some((ext) => href.toLowerCase().endsWith(ext)))
      .map((href) => normalizePhotoEntry(href, folder))
      .filter(Boolean);
  } catch (error) {
    console.warn("Automatické načítanie fotografií z priečinka zlyhalo", error);
    return [];
  }
}

function normalizePhotoEntry(entry, folder) {
  if (!entry) {
    return null;
  }

  if (typeof entry === "string") {
    const src = resolvePhotoPath(folder, entry);
    return src ? { src } : null;
  }

  if (typeof entry === "object") {
    const source = entry.src || entry.path || entry.file;
    const src = resolvePhotoPath(folder, source);
    if (!src) {
      return null;
    }
    return {
      src,
      title: entry.title,
      annotation: entry.annotation,
      annotationFile: entry.annotationFile,
    };
  }
  return null;
}

function resolvePhotoPath(folder, value = "") {
  if (!value) {
    return "";
  }
  if (/^https?:/i.test(value)) {
    return value;
  }
  let path = value
    .replace(/^\.\//, "")
    .replace(/^\/+/, "");
  if (path.startsWith(folder)) {
    return path;
  }
    return `${folder}/${path}`.replace(/\/{2,}/g, "/");
}

function mergePhotoEntries(configPhotos, discoveredPhotos) {
  const catalogue = new Map();
  (configPhotos || []).forEach((photo) => {
    const key = normalizePhotoSrc(photo.src);
    if (!key) {
      return;
    }
    catalogue.set(key, { ...photo, src: photo.src });
  });

  (discoveredPhotos || []).forEach((photo) => {
    const key = normalizePhotoSrc(photo.src);
    if (!key || catalogue.has(key)) {
      return;
    }
    catalogue.set(key, {
      src: photo.src,
      title: photo.title,
      annotation: photo.annotation,
      annotationFile: photo.annotationFile,
    });
  });

  return Array.from(catalogue.values());
}

function normalizePhotoSrc(src = "") {
  return src.replace(/^\.\//, "").replace(/^\/+/, "");
}

function applyAnnotation(element, item, loadingText = "Načítavam anotáciu...") {
  const sourceKey = item.annotationFile || item.annotation || "";
  element.dataset.annotationSource = sourceKey;

  if (item.annotationFile) {
    element.textContent = loadingText;
    fetchAnnotationHtml(item.annotationFile)
      .then((html) => {
        if (element.dataset.annotationSource === sourceKey) {
          element.innerHTML = html;
        }
      })
      .catch(() => {
        if (element.dataset.annotationSource === sourceKey) {
          element.textContent = item.annotation || "Anotáciu sa nepodarilo načítať.";
        }
      });
    return;
  }

  if (item.annotation) {
    element.innerHTML = markdownToHtml(item.annotation);
  } else {
    element.textContent = "";
  }
}

function fetchAnnotationHtml(path) {
  if (!annotationCache.has(path)) {
    const promise = fetch(path)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Načítanie anotácie z ${path} zlyhalo.`);
        }
        return response.text();
      })
      .then((markdown) => markdownToHtml(markdown))
      .catch((error) => {
        annotationCache.delete(path);
        throw error;
      });
    annotationCache.set(path, promise);
  }
  return annotationCache.get(path);
}

function markdownToHtml(markdown = "") {
  const escaped = escapeHtml(markdown.trim());
  if (!escaped) return "";

  let formatted = escaped;
  formatted = formatted.replace(/\[(.+?)\]\((https?:[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  formatted = formatted.replace(/\*(.+?)\*/g, "<em>$1</em>");

  return formatted
    .split(/(?:\r?\n){2,}/)
    .map((block) => convertBlock(block))
    .filter(Boolean)
    .join(" ");
}

function convertBlock(block) {
  const lines = block.split(/\r?\n/).filter((line) => line.trim().length);
  if (!lines.length) {
    return "";
  }

  if (lines.every((line) => /^[-*]\s+/.test(line))) {
    const items = lines.map((line) => line.replace(/^[-*]\s+/, "").trim());
    return `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  if (lines.every((line) => /^\d+\.\s+/.test(line))) {
    const items = lines.map((line) => line.replace(/^\d+\.\s+/, "").trim());
    return `<ol>${items.map((item) => `<li>${item}</li>`).join("")}</ol>`;
  }

  return `<p>${lines.join(" <br>")}</p>`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
