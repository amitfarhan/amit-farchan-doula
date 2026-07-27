// עמית פרחן — דולה מוסמכת: אינטראקציות משותפות לכל הדפים

document.addEventListener('DOMContentLoaded', () => {
  initNavToggle();
  initScrollReveal();
  initReviewsCarousel();
});

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

// קיר ההמלצות: התמונות זזות לבד ברצף אינסופי, ואפשר גם לגרור אותן בעכבר/מגע
function initReviewsCarousel() {
  const wall = document.querySelector('.reviews-wall');
  const track = wall ? wall.querySelector('.reviews-track') : null;
  if (!wall || !track) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let offset = 0;
  let halfWidth = track.scrollWidth / 2;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartOffset = 0;
  let isPaused = false;
  let resumeTimer;

  const remeasure = () => {
    halfWidth = track.scrollWidth / 2;
  };
  window.addEventListener('resize', remeasure);
  // התמונות טעונות eager, אבל מוודאים שהמדידה נכונה גם אם התמונות
  // מסיימות להיטען אחרי שהקרוסלה כבר אותחלה
  track.querySelectorAll('img').forEach((img) => {
    if (!img.complete) img.addEventListener('load', remeasure);
  });

  const applyOffset = () => {
    let x = offset % halfWidth;
    if (x > 0) x -= halfWidth;
    track.style.transform = `translateX(${x}px)`;
  };

  const schedulePause = () => {
    isPaused = true;
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => { isPaused = false; }, 2000);
  };

  const dragStart = (event) => {
    isDragging = true;
    wall.classList.add('is-dragging');
    dragStartX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    dragStartOffset = offset;
  };
  const dragMove = (event) => {
    if (!isDragging) return;
    const x = 'touches' in event ? event.touches[0].clientX : event.clientX;
    offset = dragStartOffset + (x - dragStartX);
    applyOffset();
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
  wall.addEventListener('touchstart', dragStart, { passive: true });
  window.addEventListener('touchmove', dragMove, { passive: true });
  window.addEventListener('touchend', dragEnd);

  const speed = 0.5;
  function tick() {
    if (!isDragging && !isPaused && !reduceMotion) {
      offset -= speed;
      applyOffset();
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
