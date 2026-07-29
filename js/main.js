// עמית פרחן — דולה מוסמכת: אינטראקציות משותפות לכל הדפים

document.addEventListener('DOMContentLoaded', () => {
  initNavToggle();
  initScrollReveal();
  initReviewsCarousel();
  initHeroVideo();
});

// וידאו ההירו: מנסה גם הפעלה יזומה מ-JS (חלק ממכשירים חוסמים autoplay
// דקלרטיבי בגלל חיסכון בסוללה/נתונים) ומאפשרת ללחוץ על הווידאו כדי
// להפעיל אותו ידנית אם ה-autoplay נחסם.
function initHeroVideo() {
  const video = document.querySelector('.hero-video');
  if (!video) return;

  // אם הוגדר סרטון פתיח נוסף — בכל טעינת עמוד מגרילים באיזה מהשניים לנגן,
  // כך שמבקרת חוזרת רואה לסירוגין. ה-HTML מגיע תמיד עם הסרטון הראשון,
  // כדי שגם בלי JavaScript יוצג סרטון ולא רק תמונה.
  const second = video.dataset.videoSecond;
  const source = video.querySelector('source');
  if (second && source && Math.random() < 0.5) {
    source.src = second;
    video.load(); // מאפס את הטעינה כדי שהמקור החדש ייכנס לתוקף
  }

  const tryPlay = () => {
    const promise = video.play();
    if (promise && promise.catch) promise.catch(() => {});
  };

  // מכשיר שביקש צמצום תנועה: הסרטון מוצג אבל ממתין ללחיצה במקום להתנגן לבד
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const playButton = document.querySelector('.hero-play');

  if (reduceMotion) {
    video.autoplay = false;
    video.removeAttribute('autoplay');
    video.pause();
    if (playButton) {
      playButton.hidden = false;
      playButton.addEventListener('click', () => {
        playButton.hidden = true;
        tryPlay();
      });
    }
  } else if (video.readyState >= 2) {
    tryPlay();
  } else {
    video.addEventListener('loadeddata', tryPlay, { once: true });
  }

  video.addEventListener('click', () => {
    if (video.paused) {
      if (playButton) playButton.hidden = true;
      tryPlay();
    }
  });
}

function initScrollReveal() {
  const items = document.querySelectorAll('.reveal');
  if (items.length === 0) return;

  const revealAll = () => items.forEach((el) => el.classList.add('is-visible'));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    revealAll();
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  items.forEach((el) => observer.observe(el));

  // ניווט ישיר לעוגן (למשל קישור בתפריט) יכול "לדלג" מעל סקשן בלי
  // שהוא אי-פעם ייכנס לתצוגה — במקרה כזה חושפים הכל מיד במקום להשאיר
  // אותו שקוף לצמיתות.
  document.querySelectorAll('a[href*="#"]').forEach((link) => {
    link.addEventListener('click', revealAll);
  });
  window.addEventListener('hashchange', revealAll);
}

// קיר ההמלצות: התמונות זזות לבד ברצף אינסופי, ואפשר גם לגרור/לגלול אותן ידנית.
// מבוסס על גלילה אמיתית (scrollLeft) ולא על transform מדומה — כך שגם אם
// האנימציה האוטומטית לא רצה מסיבה כלשהי, אפשר תמיד לגלול/להחליק ולראות
// את כל התמונות (גיבוי טבעי של הדפדפן, לא תלוי ב-JS).
function initReviewsCarousel() {
  const wall = document.querySelector('.reviews-wall');
  const track = wall ? wall.querySelector('.reviews-track') : null;
  if (!wall || !track) return;

  const items = Array.from(track.children);
  const setSize = items.length / 2;
  if (!setSize) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // המרחק האמיתי בין תחילת הסט הראשון לתחילת הסט המשוכפל — נמדד ישירות
  // מהעמודים בפועל (ולא מחושב מרוחב+רווחים), כדי שהלופ יהיה מדויק.
  let repeatWidth = 1;
  const remeasure = () => {
    const r0 = items[0].getBoundingClientRect();
    const r1 = items[setSize].getBoundingClientRect();
    repeatWidth = Math.abs(r1.left - r0.left) || 1;
  };
  remeasure();
  window.addEventListener('resize', remeasure);
  track.querySelectorAll('img').forEach((img) => {
    if (!img.complete) img.addEventListener('load', remeasure);
  });

  // בעמוד RTL דפדפנים תקניים מציגים scrollLeft=0 בקצה ההתחלתי (ימין) והולך
  // ושלילי ככל שגוללים פנימה לתוכן. בודקים בפועל כדי לא להניח כיוון בטעות.
  const startScrollLeft = wall.scrollLeft;
  wall.scrollLeft = startScrollLeft - 1;
  const rtlSign = wall.scrollLeft < startScrollLeft ? -1 : 1;
  wall.scrollLeft = startScrollLeft;

  const wrap = () => {
    if (rtlSign < 0 && wall.scrollLeft <= -repeatWidth) {
      wall.scrollLeft += repeatWidth;
    } else if (rtlSign > 0 && wall.scrollLeft >= repeatWidth) {
      wall.scrollLeft -= repeatWidth;
    }
  };

  let isPaused = false;
  let isDragging = false;
  let resumeTimer;
  const schedulePause = () => {
    isPaused = true;
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => { isPaused = false; }, 2000);
  };

  // עצירה זמנית בכל אינטראקציה ידנית (מגע/עכבר/טאץ'-פד אופקי) —
  // גלילה אנכית רגילה של העמוד לא אמורה לעצור את התזוזה.
  wall.addEventListener('touchstart', schedulePause, { passive: true });
  wall.addEventListener('wheel', (event) => {
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) schedulePause();
  }, { passive: true });

  let dragStartX = 0;
  let dragStartScroll = 0;
  let dragMoved = false;
  const dragStart = (event) => {
    isDragging = true;
    dragMoved = false;
    wall.classList.add('is-dragging');
    dragStartX = event.clientX;
    dragStartScroll = wall.scrollLeft;
  };
  const dragMove = (event) => {
    if (!isDragging) return;
    if (Math.abs(event.clientX - dragStartX) > 5) dragMoved = true;
    wall.scrollLeft = dragStartScroll + (event.clientX - dragStartX);
    wrap();
  };
  const dragEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    wall.classList.remove('is-dragging');
    schedulePause();
  };
  wall.addEventListener('mousedown', dragStart);
  window.addEventListener('mousemove', dragMove);
  window.addEventListener('mouseup', dragEnd);

  // לחיצה על תמונה (לא בסוף גרירה) פותחת אותה מוגדלת בלייטבוקס
  const lightbox = document.getElementById('reviews-lightbox');
  if (lightbox) {
    const lightboxImg = lightbox.querySelector('.lightbox-img');
    const closeLightbox = () => {
      lightbox.hidden = true;
      lightboxImg.src = '';
    };
    track.addEventListener('click', (event) => {
      if (dragMoved) return;
      const clicked = event.target.closest('.testimonial-photo');
      if (!clicked) return;
      lightboxImg.src = clicked.src;
      lightboxImg.alt = clicked.alt;
      lightbox.hidden = false;
    });
    lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) closeLightbox();
    });
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeLightbox();
    });
  }

  const speed = 0.5;
  function tick() {
    if (!isDragging && !isPaused && !reduceMotion) {
      wall.scrollLeft += rtlSign * speed;
      wrap();
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function initNavToggle() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}
