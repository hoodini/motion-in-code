// One bundle serves both editions: the page's <html lang> decides which strings and direction a demo uses.
export const EN = typeof document !== 'undefined' && (document.documentElement.lang || '').toLowerCase().startsWith('en');
export const T = (he, en) => (EN ? en : he);
export const DIR = EN ? 'ltr' : 'rtl';
