import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, query, orderBy, doc, getDoc, setDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const firebaseConfig = {
        apiKey: "AIzaSyAjBgwEJq75lxPc8DcDC_rEH-goRIF7zbI",
        authDomain: "bustievegastrip.firebaseapp.com",
        projectId: "bustievegastrip",
        storageBucket: "bustievegastrip.appspot.com",
        messagingSenderId: "4366754720",
        appId: "1:4366754720:web:0257a540b75a2262a83ac5",
        measurementId: "G-D66NTDR20N"
    };
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const commentsCollection = collection(db, "comments");
    const hotelsCollection = collection(db, "hotels");

    const menuBtn = document.getElementById('menu-btn');
    const sidebar = document.getElementById('sidebar');

    menuBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        menuBtn.classList.toggle('active');
        sidebar.classList.toggle('open');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault(); 
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                sidebar.classList.remove('open');
                menuBtn.classList.remove('active');

                setTimeout(() => {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }, 150); 
            }
        });
    });

    let isModalOpen = false;
    const closeAllFlippedCards = (exceptThisCard) => {
        if (isModalOpen) return;
        document.querySelectorAll('.flippable-card.is-flipped').forEach(card => {
            if (card !== exceptThisCard) {
                card.classList.remove('is-flipped');
            }
        });
    };

    const modal = document.getElementById('fullscreen-modal');
    const modalImage = document.getElementById('fullscreen-image');
    const openFullscreen = (imgSrc) => {
        modalImage.src = imgSrc;
        modal.classList.add('active');
        isModalOpen = true;
    };

    modal.addEventListener('click', () => {
        modal.classList.remove('active');
        isModalOpen = false;
        modalImage.src = '';
    });

    document.body.addEventListener('click', (e) => {
        if (e.target.matches('.polaroid-frame img, .photo-grid-item img, .itinerary-back-photo img')) {
            e.stopPropagation();
            openFullscreen(e.target.dataset.img || e.target.src);
        }
    });

    document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== menuBtn && !menuBtn.contains(e.target)) {
            sidebar.classList.remove('open');
            menuBtn.classList.remove('active');
        }
        if (!e.target.closest('.flippable-card')) {
            closeAllFlippedCards(null);
        }
    });

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
    setInterval(updateCountdown, 3600000);

    document.getElementById('countdown-days')?.addEventListener('click', function() {
        this.classList.toggle('expanded');
        if (this.classList.contains('expanded')) {
            this.textContent = 'Sep 11, 2025';
        } else {
            updateCountdown();
        }
    });

    const commentModalBackdrop = document.getElementById('comment-modal-backdrop');
    document.getElementById('add-comment-btn')?.addEventListener('click', () => commentModalBackdrop?.classList.add('active'));
    document.getElementById('cancel-comment-btn')?.addEventListener('click', () => commentModalBackdrop?.classList.remove('active'));
    commentModalBackdrop?.addEventListener('click', (e) => {
        if (e.target === commentModalBackdrop) commentModalBackdrop.classList.remove('active');
    });

    document.getElementById('post-comment-btn')?.addEventListener('click', async () => {
        const nameInput = document.getElementById('comment-name');
        const textInput = document.getElementById('comment-text');
        const name = nameInput.value.trim();
        const text = textInput.value.trim();
        if (name && text) {
            commentModalBackdrop.classList.remove('active');
            nameInput.value = '';
            textInput.value = '';
            try {
                await addDoc(commentsCollection, { name, text, createdAt: serverTimestamp() });
            } catch (error) {
                console.error("Error adding comment: ", error);
            }
        }
    });

    onSnapshot(query(commentsCollection, orderBy("createdAt", "desc")), (snapshot) => {
        const commentList = document.getElementById('comment-list');
        if(!commentList) return;
        commentList.innerHTML = '';
        snapshot.forEach((doc) => {
            const comment = doc.data();
            const commentBox = document.createElement('div');
            commentBox.className = 'comment-box';
            const dateStr = comment.createdAt ? new Date(comment.createdAt.seconds * 1000).toLocaleDateString() : '';
            commentBox.innerHTML = `<div class="comment-header"><div class="comment-name">${comment.name}</div><span class="comment-date">${dateStr}</span></div><p class="comment-text">${comment.text}</p>`;
            commentList.appendChild(commentBox);
        });
    });

    document.querySelectorAll('.flippable-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('button, a, .itinerary-back-photo')) {
                return;
            }
            if (!e.target.closest('.hotel-leaflet-map')) {
               closeAllFlippedCards(card);
               card.classList.toggle('is-flipped');
            }
        });
    });

    const HOTELS_DATA = [
        { id: 'luxor', name: 'Luxor' },
        { id: 'flamingo', name: 'Flamingo' },
        { id: 'harrahs', name: "Harrah's" },
        { id: 'treasureisland', name: 'Treasure Island' },
        { id: 'excalibur', name: 'Excalibur' },
    ];

    HOTELS_DATA.forEach(hotel => {
        const hotelRef = doc(db, 'hotels', hotel.name);
        const likeCircle = document.getElementById(`hotel-like-${hotel.id}`);
        const likeBtn = document.querySelector(`.hotel-action-btn[data-hotel="${hotel.name}"]`);

        if (likeBtn) {
            onSnapshot(hotelRef, (docSnap) => {
                if (likeCircle) {
                    likeCircle.textContent = docSnap.exists() ? (docSnap.data().likes ?? 0) : 0;
                }
            });

            likeBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                likeBtn.classList.add('popped');
                likeBtn.addEventListener('animationend', () => likeBtn.classList.remove('popped'), { once: true });
                try {
                    const docSnap = await getDoc(hotelRef);
                    if (docSnap.exists()) {
                        await updateDoc(hotelRef, { likes: increment(1) });
                    } else {
                        await setDoc(hotelRef, { likes: 1 });
                    }
                } catch (err) {
                    console.error('Error incrementing like:', err);
                }
            });
        }
    });
    
    const mapInstances = {};
    const hotelCoordinates = {
        luxor: [36.0954, -115.1762],
        flamingo: [36.1162, -115.1713],
        harrahs: [36.1189, -115.1710],
        treasureisland: [36.1246, -115.1720],
        excalibur: [36.0987, -115.1754]
    };
    const pitbullLocation = [36.1451, -115.1611];
    
    const mapCenter = [36.1405, -115.1732];
    const mapZoom = 12;

    // Move Las Vegas title much farther to the right (east) so it is fully visible on the map
    const titleLocation = [36.13, -114.95]; 
    const stripLocation = [36.132, -115.17105206313667];

    const hotelIcon = L.icon({
        iconUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23fd9644" width="48px" height="48px"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
        iconSize: [48, 48],
        iconAnchor: [24, 48],
        tooltipAnchor: [16, -38]
    });

    const pitbullIcon = L.icon({
        iconUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%239d4edd" width="36px" height="36px"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        tooltipAnchor: [12, -28]
    });

    const titleIcon = L.divIcon({
        className: 'leaflet-map-title',
        html: 'Las Vegas',
        iconSize: [200, 40],
        iconAnchor: [100, 20]
    });

    document.querySelectorAll('.flippable-card[data-card-type="hotel"]').forEach(card => {
        const hotelId = card.dataset.hotelId;
        const mapContainer = card.querySelector('.hotel-leaflet-map');

        if (mapContainer) {
            const hotelCoord = hotelCoordinates[hotelId];
            
            const map = L.map(mapContainer, {
                center: mapCenter, 
                zoom: mapZoom,     
                zoomControl: false,
                attributionControl: false,
                dragging: true,
                scrollWheelZoom: true,
            });

            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(map);
            
            L.marker(titleLocation, { icon: titleIcon, interactive: false }).addTo(map);

            const hotelName = card.querySelector('h3').textContent;
            const hotelMarker = L.marker(hotelCoord, { icon: hotelIcon }).addTo(map);
            hotelMarker.bindTooltip(hotelName, {
                permanent: true,
                direction: 'right',
                offset: [15, 0],
                className: 'hotel-tooltip'
            }).openTooltip();

            const pitbullMarker = L.marker(pitbullLocation, { icon: pitbullIcon }).addTo(map);
            pitbullMarker.bindTooltip("Pitbull", {
                permanent: true,
                direction: 'top',
                offset: [10, -20],
                className: 'pitbull-tooltip'
            }).openTooltip();
            
            const stripMarker = L.marker(stripLocation).addTo(map);
            stripMarker.bindTooltip("The Strip", {
                permanent: true,
                direction: 'left',
                offset: [-15, 0],
                className: 'strip-tooltip'
            }).openTooltip();


            mapInstances[hotelId] = map;

            card.addEventListener('transitionend', function() {
                if (card.classList.contains('is-flipped')) {
                    setTimeout(() => {
                        map.invalidateSize();
                    }, 10);
                }
            });

            map.on('click', function() {
                card.classList.remove('is-flipped');
            });
        }
    });

});
