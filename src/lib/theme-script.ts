export type Theme = 'dark' | 'light';

export const THEME_KEY = 'component:theme';
export const THEME_COLORS: Record<Theme, string> = { dark: '#131011', light: '#f8f4f1' };

/**
 * Runs inline in <head> before first paint so the page never flashes the wrong theme.
 * Dark is the default; a saved choice wins.
 */
export const themeInitScript = `(function(){var t='dark';try{if(localStorage.getItem('${THEME_KEY}')==='light')t='light'}catch(e){}document.documentElement.dataset.theme=t})();`;
