const motion = window.matchMedia('(prefers-reduced-motion: no-preference) and (min-width: 48rem)');

const headings = [...document.querySelectorAll('main .band h2.heading')];
const rails = [...document.querySelectorAll('.rail')].map(element => ({
  element,
  sticky: element.querySelector('.rail-sticky'),
  track: element.querySelector('.rail-track'),
  distance: 0,
}));

function measureRails() {
  for (const rail of rails) {
    rail.distance = motion.matches
      ? Math.max(0, rail.track.scrollWidth - rail.sticky.clientWidth)
      : 0;
    rail.element.classList.toggle('scroll-driven', rail.distance > 0);
    rail.element.style.height = rail.distance
      ? (rail.sticky.offsetHeight + rail.distance * .7) + 'px'
      : '';
    if (!rail.distance) rail.track.style.transform = '';
  }
}

const clamp = value => Math.max(0, Math.min(1, value));
let frame = 0;

function paint() {
  frame = 0;
  for (const heading of headings) {
    const {top, bottom} = heading.getBoundingClientRect();
    if (!motion.matches) {
      heading.style.transform = '';
      heading.style.opacity = '';
      continue;
    }
    if (bottom < 0 || top > innerHeight + 70) continue;
    const progress = clamp((innerHeight - top) / (innerHeight * .29));
    heading.style.transform = 'translateX(' + (1 - progress) * -36 + 'px)';
    heading.style.opacity = .35 + progress * .65;
  }
  for (const rail of rails) {
    if (!rail.distance) continue;
    const top = rail.element.getBoundingClientRect().top;
    const pin = parseFloat(getComputedStyle(rail.sticky).top);
    const travel = rail.element.offsetHeight - rail.sticky.offsetHeight;
    const progress = clamp((pin - top) / travel);
    rail.track.style.transform = 'translateX(' + -rail.distance * progress + 'px)';
  }
}

function queuePaint() {
  if (!frame) frame = requestAnimationFrame(paint);
}

function resize() {
  measureRails();
  queuePaint();
}

for (const rail of rails) {
  rail.track.addEventListener('focusin', event => {
    if (!rail.distance || !event.target.matches('a')) return;
    const item = event.target.getBoundingClientRect();
    const viewport = rail.sticky.getBoundingClientRect();
    if (item.left >= viewport.left && item.right <= viewport.right) return;
    rail.sticky.scrollLeft = 0;
    const start = scrollY + rail.element.getBoundingClientRect().top
      - parseFloat(getComputedStyle(rail.sticky).top);
    const progress = clamp(event.target.offsetLeft / rail.distance);
    window.scrollTo(0, start + (rail.element.offsetHeight - rail.sticky.offsetHeight) * progress);
  });
}
window.addEventListener('scroll', queuePaint, {passive: true});
window.addEventListener('resize', resize);
window.addEventListener('load', resize);
motion.addEventListener('change', resize);
resize();

const navDetails = document.querySelector('nav details');
document.addEventListener('click', event => {
  if (!navDetails.contains(event.target) || event.target.closest('a')) navDetails.open = false;
});
navDetails.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navDetails.open) {
    navDetails.open = false;
    navDetails.querySelector('summary').focus();
  }
});

for (const form of document.querySelectorAll('form.inquiry')) {
  const steps = [...form.querySelectorAll('fieldset')];
  const status = form.querySelector('.form-status');
  let active = 0;

  function showStep(index) {
    active = index;
    steps.forEach((step, i) => { step.hidden = i !== index; });
    steps[index].querySelector('input, textarea')?.focus();
    status.textContent = '';
  }

  function nextStep() {
    for (const field of steps[active].querySelectorAll('input, textarea')) {
      if (!field.reportValidity()) return;
    }
    showStep(active + 1);
  }

  form.querySelector('[data-next]')?.addEventListener('click', nextStep);
  form.querySelector('[data-back]')?.addEventListener('click', () => showStep(active - 1));

  const upload = form.querySelector('input[type=file][data-max-mb]');
  upload?.addEventListener('change', () => {
    const max = Number(upload.dataset.maxMb);
    upload.setCustomValidity(upload.files[0]?.size > max * 1024 * 1024
      ? 'Please choose a file no larger than ' + max + ' MB.'
      : '');
    upload.reportValidity();
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (active < steps.length - 1) {
      nextStep();
      return;
    }
    for (const field of steps[active].querySelectorAll('input, textarea')) {
      if (!field.reportValidity()) return;
    }
    status.replaceChildren('Online submissions are currently unavailable. Please call ');
    const phone = document.createElement('a');
    phone.href = 'tel:+16195473002';
    phone.textContent = '(619) 547-3002';
    status.append(phone, '.');
  });
}
