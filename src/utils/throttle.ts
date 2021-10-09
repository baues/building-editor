let enableCall = true;

export function throttle(callback: (...args: any[]) => void, ms: number, ...args: any[]): void {
  if (!enableCall) return;

  enableCall = false;
  callback(...args);
  setTimeout(() => {
    enableCall = true;
  }, ms);
}
