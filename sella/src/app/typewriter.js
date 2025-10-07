// Typewriter effect with individual letter animations
function initTypewriterEffect() {
  const expiryElement = document.querySelector('.slide-expiry');

  if (!expiryElement) return;

  const text = expiryElement.textContent;
  expiryElement.innerHTML = '';

  // Split text into individual letters
  const letters = text.split('').map((letter, index) => {
    const span = document.createElement('span');
    span.textContent = letter;
    span.className = 'letter';
    span.style.animationDelay = `${index * 100}ms`;
    return span;
  });

  letters.forEach(letter => expiryElement.appendChild(letter));

  // Start fade-in animation
  letters.forEach((letter, index) => {
    setTimeout(() => {
      letter.classList.add('fade-in');
    }, index * 100);
  });

  // Start fade-out animation after delay
  const totalFadeInTime = letters.length * 100 + 500; // 500ms for each letter animation
  const holdTime = 1000; // 1 second hold

  setTimeout(() => {
    letters.forEach((letter, index) => {
      setTimeout(() => {
        letter.classList.remove('fade-in');
        letter.classList.add('fade-out');
      }, index * 100);
    });
  }, totalFadeInTime + holdTime);
}

// Initialize on slide change or page load
document.addEventListener('DOMContentLoaded', initTypewriterEffect);

// Re-initialize when slides change (you'll need to call this when slides transition)
function onSlideChange() {
  // Reset any existing animations
  document.querySelectorAll('.letter').forEach(letter => {
    letter.classList.remove('fade-in', 'fade-out');
  });
  initTypewriterEffect();
}
