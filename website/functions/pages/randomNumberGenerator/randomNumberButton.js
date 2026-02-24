document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('generateBtn');
  const display = document.getElementById('randomNumberDisplay');
  const minInput = document.getElementById('minInput');
  const maxInput = document.getElementById('maxInput');

  if (!btn || !display || !minInput || !maxInput) return;

  btn.addEventListener('click', () => {
    let min = 0, max = 100;
    
    try {
      if (minInput.value.trim() != '') {
        min = parseInt(minInput.value.trim());
      } 
    } catch (error) {
      display.textContent = 'Invalid minimum value!';
    }
  
    try {
      if (maxInput.value.trim() != '') {
        max = parseInt(maxInput.value.trim());
      }
    } catch (error) {
      display.textContent = 'Invalid maximum value!';
    }

    const number = Math.round(Math.random() * (max - min)) + min; 
    if (max >= min) {
      display.textContent = number.toLocaleString('en-US');
    } else {
      display.textContent = 'Invalid inputs!';
    }
    
  });
});