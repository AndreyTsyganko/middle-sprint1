export const formatTime = (date: Date): string => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const formatDate = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return formatTime(date);
  } if (date.toDateString() === yesterday.toDateString()) {
    return 'Вчера';
  }
  return date.toLocaleDateString();
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
