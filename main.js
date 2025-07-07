// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, query, orderBy, doc, getDoc, setDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, listAll } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAjBgwEJq75lxPc8DcDC_rEH-goRIF7zbI",
  authDomain: "bustievegastrip.firebaseapp.com",
  projectId: "bustievegastrip",
  storageBucket: "bustievegastrip.appspot.com",
  messagingSenderId: "4366754720",
  appId: "1:4366754720:web:0257a540b75a2262a83ac5",
  measurementId: "G-D66NTDR20N"
};

// Initialize Firebase Services
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const commentsCollection = collection(db, "comments");
const photosCollection = collection(db, "photos");


// --- Improved Menu Toggle ---
const menuBtn = document.getElementById('menu-btn');
const sidebar = document.getElementById('sidebar');
const navLinks = document.querySelectorAll('.nav-link');

// Helper: get the .section-bar above a section by id
function getSectionBarForLink(href) {
  if (!href || !href.startsWith('#')) return null;
  const section = document.querySelector(href);
  if (!section) return null;
  // Find the .section-bar immediately before the section
  let prev = section.previousElementSibling;
  while (prev) {
    if (prev.classList && prev.classList.contains('section-bar')) return prev;
    prev = prev.previousElementSibling;
  }
  return null;
}

menuBtn.addEventListener('mousedown', (e) => {
  e.preventDefault();
  menuBtn.classList.toggle('active');
  sidebar.classList.toggle('open');
});

// Sidebar link click: scroll .section-bar to top (below header), close menu
navLinks.forEach(link => {
  link.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (href && href.startsWith('#')) {
      e.preventDefault();
      setTimeout(() => {
        const sectionBar = getSectionBarForLink(href);
        if (sectionBar) {
          const header = document.querySelector('header');
          const headerHeight = header ? header.offsetHeight : 0;
          const rect = sectionBar.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const targetY = rect.top + scrollTop - headerHeight;
          window.scrollTo({ top: targetY, behavior: 'smooth' });
        }
      }, 10); // Delay to allow sidebar to close before scrolling
      sidebar.classList.remove('open');
      menuBtn.classList.remove('active');
    }
  });
});

// --- Smooth Scrolling & Close Menu on Nav Link Click ---
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const targetId = link.getAttribute('href');
    const targetSection = document.querySelector(targetId);
    
    if (targetSection) {
      sidebar.classList.remove('open');
      menuBtn.classList.remove('active');
      
      let scrollTarget = targetSection;
      const precedingElement = targetSection.previousElementSibling;
      if (precedingElement && precedingElement.classList.contains('section-bar')) {
          scrollTarget = precedingElement;
      }
      
      const headerOffset = 60;
      const elementPosition = scrollTarget.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  });
});

// --- Card Flip Logic (Handles both Itinerary and Hotels) ---
const flippableCards = document.querySelectorAll('.flippable-card');
let isModalOpen = false; // Track if fullscreen modal is open

const closeAllFlippedCards = (exceptThisCard) => {
    // Only close cards if modal is not open
    if (isModalOpen) return;
    flippableCards.forEach(card => {
        if (card !== exceptThisCard) {
            card.classList.remove('is-flipped');
        }
    });
};

flippableCards.forEach(card => {
  card.addEventListener('click', (e) => {
      // Prevent card flip if hotel-action-btn is clicked
      if (e.target.closest('.hotel-action-btn')) {
          // Add pressed effect is handled by CSS :active
          return;
      }
      // Do not flip if a button inside the card is clicked
      if (e.target.closest('a.btn')) {
          return;
      }
      // If clicking on the back of a hotel card, flip it back
      if (card.dataset.cardType === 'hotel' && e.target.closest('.card-back')) {
          card.classList.remove('is-flipped');
          return;
      }
      // If clicking on the back of an itinerary card, flip it back
      if (card.dataset.cardType === 'itinerary' && e.target.closest('.card-back')) {
          card.classList.remove('is-flipped');
          return;
      }
      // Only flip to back if not already flipped
      const isAlreadyFlipped = card.classList.contains('is-flipped');
      closeAllFlippedCards(card);
      if (!isAlreadyFlipped) {
          card.classList.add('is-flipped');
      }
  });
});

// --- Fullscreen Modal Logic ---
const modal = document.getElementById('fullscreen-modal');
const modalImage = document.getElementById('fullscreen-image');
  
const openFullscreen = (imgSrc) => {
    modalImage.src = imgSrc;
    modal.classList.add('active');
    isModalOpen = true;
};

// Event delegation for dynamically added photos
document.body.addEventListener('click', (e) => {
    if (e.target.matches('.itinerary-back-photo img') || e.target.matches('.photo-grid-item img')) {
        e.stopPropagation();
        openFullscreen(e.target.src);
    }
});

// Add click event for polaroid gallery images
const polaroidImgs = document.querySelectorAll('.polaroid-gallery-img');
polaroidImgs.forEach(img => {
  img.addEventListener('click', () => {
    modalImage.src = img.dataset.img;
    modal.classList.add('active');
  });
});

// Only close modal if clicking outside the image
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('active');
        isModalOpen = false;
    }
});

// Fullscreen modal close on click
modal.addEventListener('click', () => {
  modal.classList.remove('active');
  modalImage.src = '';
});

// --- Click Outside Logic (Menu and Cards) ---
document.addEventListener('click', (e) => {
  if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== menuBtn && !menuBtn.contains(e.target)) {
    sidebar.classList.remove('open');
    menuBtn.classList.remove('active');
  }

  if (!e.target.closest('.flippable-card')) {
      closeAllFlippedCards(null);
  }
});


  // --- Photos Page Logic with Firebase ---
  const photoGrid = document.getElementById('photo-grid');
  const addPhotoBtn = document.getElementById('add-photo-btn');
  const photoUploadInput = document.getElementById('photo-upload-input');
  
  addPhotoBtn?.addEventListener('click', () => {
    photoUploadInput.value = '';
    photoUploadInput.click();
  });

  photoUploadInput?.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    addPhotoBtn.textContent = 'Uploading...';
    addPhotoBtn.disabled = true;
    let success = false;

    // The main upload button adds to the general 'photos/' folder
    const storageRef = ref(storage, `photos/${Date.now()}-${file.name}`);
    
    try {
        // Upload file to Firebase Storage
        const snapshot = await uploadBytes(storageRef, file);
        // Get the download URL
        const downloadURL = await getDownloadURL(snapshot.ref);
        // Add photo document to Firestore
        await addDoc(photosCollection, {
            imageUrl: downloadURL,
            createdAt: serverTimestamp()
        });
        success = true;
    } catch (error) {
        console.error("Error uploading photo:", error);
        addPhotoBtn.textContent = 'Upload Failed';
        addPhotoBtn.style.backgroundColor = 'var(--error-red)';
    } finally {
        if (success) {
            addPhotoBtn.textContent = 'Add Photo';
            addPhotoBtn.disabled = false;
        } else {
            setTimeout(() => {
                addPhotoBtn.textContent = 'Add Photo';
                addPhotoBtn.disabled = false;
                addPhotoBtn.style.backgroundColor = '';
            }, 3000);
        }
    }
  });

  // --- Listen for and display photos in the main gallery ---
  const photoQuery = query(photosCollection, orderBy("createdAt", "desc"));
  onSnapshot(photoQuery, (snapshot) => {
      photoGrid.innerHTML = ''; // Clear grid
      snapshot.forEach((doc) => {
          const photo = doc.data();
          const item = document.createElement('div');
          item.className = 'photo-grid-item';
          const img = document.createElement('img');
          img.src = photo.imageUrl;
          img.alt = "Vegas Trip Photo";
          item.appendChild(img);
          photoGrid.appendChild(item);
      });
  });

  // --- Dynamic Photo Loading for Polaroids and Itinerary Cards ---
  const getRandomImages = async (path, count) => {
      try {
          const folderRef = ref(storage, path);
          const res = await listAll(folderRef);
          const urls = await Promise.all(res.items.map(itemRef => getDownloadURL(itemRef)));
          
          // Shuffle and slice
          return urls.sort(() => 0.5 - Math.random()).slice(0, count);
      } catch (error) {
          console.error(`Error getting images from ${path}:`, error);
          return [];
      }
  };

  // Load main polaroids
  getRandomImages('mainpolaroids/', 2).then(urls => {
      if (urls[0]) document.getElementById('polaroid-img-1').src = urls[0];
      if (urls[1]) document.getElementById('polaroid-img-2').src = urls[1];
  });

  // Load itinerary card photos
  // Only replace the backContent if Firebase returns images

  document.querySelectorAll('.flippable-card[data-day]').forEach(card => {
      const day = card.dataset.day;
      const backContent = card.querySelector('.itinerary-back-content');
      getRandomImages(`itinerary/day${day}/`, 4).then(urls => {
          if (urls && urls.length > 0) {
              backContent.innerHTML = '';
              urls.forEach(url => {
                  const photoDiv = document.createElement('div');
                  photoDiv.className = 'itinerary-back-photo';
                  const img = document.createElement('img');
                  img.src = url;
                  img.alt = `Day ${day} Photo`;
                  photoDiv.appendChild(img);
                  backContent.appendChild(photoDiv);
              });
          }
          // If no images, leave the static HTML in place
      });
  });


  // --- Countdown Timer ---
  function updateCountdown() {
    const targetDate = new Date('2025-09-11T00:00:00');
    const now = new Date();
    const diff = targetDate - now;
    const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    const countdownBox = document.getElementById('countdown-days');
    if (countdownBox && !countdownBox.classList.contains('expanded')) {
      countdownBox.textContent = days;
    }
  }
  
  updateCountdown();
  setInterval(updateCountdown, 1000 * 60 * 60);

  // --- Countdown Box Expand/Collapse ---
  const countdownBox = document.getElementById('countdown-days');
  if (countdownBox) {
    countdownBox.addEventListener('click', function() {
      if (countdownBox.classList.contains('expanded')) {
        countdownBox.classList.remove('expanded');
        updateCountdown();
      } else {
        countdownBox.classList.add('expanded');
        countdownBox.textContent = 'Sep 11, 2025';
      }
    });
  }

  // --- Comment Modal Logic ---
  const commentModalBackdrop = document.getElementById('comment-modal-backdrop');
  const addCommentBtn = document.getElementById('add-comment-btn');
  const cancelCommentBtn = document.getElementById('cancel-comment-btn');
  const postCommentBtn = document.getElementById('post-comment-btn');
  const commentNameInput = document.getElementById('comment-name');
  const commentTextInput = document.getElementById('comment-text');
  const commentList = document.getElementById('comment-list');

  const openCommentModal = () => commentModalBackdrop.classList.add('active');
  const closeCommentModal = () => {
      commentModalBackdrop.classList.remove('active');
      commentNameInput.value = '';
      commentTextInput.value = '';
  };

  addCommentBtn.addEventListener('click', openCommentModal);
  cancelCommentBtn.addEventListener('click', closeCommentModal);
  commentModalBackdrop.addEventListener('click', (e) => {
      if (e.target === commentModalBackdrop) {
          closeCommentModal();
      }
  });

  postCommentBtn.addEventListener('click', async () => {
      const name = commentNameInput.value.trim();
      const text = commentTextInput.value.trim();

      if (name && text) {
          closeCommentModal(); // Close modal immediately for better UX
          try {
              await addDoc(commentsCollection, {
                  name: name,
                  text: text,
                  createdAt: serverTimestamp()
              });
          } catch (error) {
              console.error("Error adding document: ", error);
              alert("Could not post comment. See console for details.");
          }
      } else {
          alert("Please fill out both name and comment fields.");
      }
  });

  // --- Listen for and display comments ---
  const commentQuery = query(commentsCollection, orderBy("createdAt", "desc"));
  onSnapshot(commentQuery, (snapshot) => {
      commentList.innerHTML = ''; // Clear the list
      snapshot.forEach((doc) => {
          const comment = doc.data();
          const commentBox = document.createElement('div');
          commentBox.className = 'comment-box';
          
          const header = document.createElement('div');
          header.className = 'comment-header';

          const nameElement = document.createElement('div');
          nameElement.className = 'comment-name';
          nameElement.textContent = comment.name;

          const dateElement = document.createElement('span');
          dateElement.className = 'comment-date';
          if (comment.createdAt) {
              dateElement.textContent = new Date(comment.createdAt.seconds * 1000).toLocaleDateString();
          }

          header.appendChild(nameElement);
          header.appendChild(dateElement);

          const textElement = document.createElement('p');
          textElement.className = 'comment-text';
          textElement.textContent = comment.text;

          commentBox.appendChild(header);
          commentBox.appendChild(textElement);
          commentList.appendChild(commentBox);
      });
  });


  // --- Leaflet Map for Hotel Cards ---
  // Hotel map coordinates
  const LAS_VEGAS_CENTER = [36.1699, -115.1398];
  const FONTAINEBLEAU = [36.1376, -115.1607];
  const HOTELS = [
    {
      id: 'hotel-map-luxor',
      name: 'Luxor',
      coords: [36.0955, -115.1761]
    },
    // Add more hotels here as you update the HTML
  ];

  HOTELS.forEach(hotel => {
    const mapDiv = document.getElementById(hotel.id);
    if (mapDiv) {
      const map = L.map(mapDiv, {
        center: LAS_VEGAS_CENTER,
        zoom: 12,
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        tap: false,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        minZoom: 10,
        maxZoom: 18,
      }).addTo(map);
      // Hotel pin
      L.marker(hotel.coords, {
        title: hotel.name
      }).addTo(map).bindPopup(hotel.name);
      // Fontainebleau pin
      L.marker(FONTAINEBLEAU, {
        title: 'Fontainebleau',
        icon: L.icon({
          iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-violet.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
        })
      }).addTo(map).bindPopup('Fontainebleau');
    }
  });

  // --- Hotel Likes Logic (Efficient Firestore Model) ---
  // Each hotel is a document in the 'hotels' collection, with a 'likes' field (number)
  const HOTEL_IDS = ['Luxor', 'Flamingo', "Harrah's", 'Treasure Island', 'Excalibur'];

  // Helper to get or create a hotel doc with 0 likes if missing
  async function getOrCreateHotelDoc(hotelName) {
    const hotelRef = doc(db, 'hotels', hotelName);
    const hotelSnap = await getDoc(hotelRef);
    if (!hotelSnap.exists()) {
      await setDoc(hotelRef, { likes: 0 });
      return { ref: hotelRef, likes: 0 };
    } else {
      return { ref: hotelRef, likes: hotelSnap.data().likes };
    }
  }

  HOTEL_IDS.forEach(hotelName => {
    const idSafe = hotelName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const likeCircle = document.getElementById(`hotel-like-${idSafe}`);
    const likeBtn = document.querySelector(`.hotel-action-btn[data-hotel="${hotelName}"]`);
    const hotelRef = doc(db, 'hotels', hotelName);

    // Real-time listener for this hotel's like count
    onSnapshot(hotelRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (likeCircle) likeCircle.textContent = data.likes ?? 0;
      } else {
        // If doc doesn't exist, show 0
        if (likeCircle) likeCircle.textContent = 0;
      }
    });

    // Ensure doc exists on page load
    getOrCreateHotelDoc(hotelName);

    // Button click increments like count atomically
    likeBtn?.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        await updateDoc(hotelRef, { likes: increment(1) });
      } catch (err) {
        // If doc doesn't exist, create it and retry
        if (err.code === 'not-found') {
          await setDoc(hotelRef, { likes: 1 });
        } else {
          console.error('Error incrementing like:', err);
        }
      }
    });
  });
