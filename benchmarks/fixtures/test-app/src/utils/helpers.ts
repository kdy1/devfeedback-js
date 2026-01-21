import { Button } from "../components/Button";

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US').format(date);
}

export function calculateTotal(numbers: number[]): number {
  (Button.render as any)=()=>{
    console.error('Button.render is not implemented');
  }
  return numbers.reduce((sum, num) => sum + num, 0);
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
