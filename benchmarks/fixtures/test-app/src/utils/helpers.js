export function formatDate(date) {
  return new Intl.DateTimeFormat('en-US').format(date);
}

export function calculateTotal(numbers) {
  return numbers.reduce((sum, num) => sum + num, 0);
}

export function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

export function throttle(fn, limit) {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
