// Interactive 5-star rating. onChange receives the new value (0-5).
export function createRating(value = 0, onChange) {
  const wrap = document.createElement('div');
  wrap.className = 'rating';

  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('button');
    star.type = 'button';
    star.className = 'star' + (i <= value ? ' filled' : '');
    star.textContent = '★';
    star.setAttribute('aria-label', `${i} stelle`);
    star.addEventListener('click', () => {
      const newVal = (i === value) ? 0 : i; // tap same star again to clear
      value = newVal;
      [...wrap.children].forEach((s, idx) =>
        s.classList.toggle('filled', idx < newVal)
      );
      onChange?.(newVal);
    });
    wrap.appendChild(star);
  }
  return wrap;
}

// Read-only stars for display
export function ratingHTML(value = 0) {
  if (!value) return '';
  let html = '<div class="rating rating-static">';
  for (let i = 1; i <= 5; i++) {
    html += `<span class="star${i <= value ? ' filled' : ''}">★</span>`;
  }
  return html + '</div>';
}
