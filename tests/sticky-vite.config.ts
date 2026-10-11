import config from '../vite.pages.config';
export default { ...config, resolve: { alias: { '@': new URL('../', import.meta.url).pathname.replace(/^\/(\w:)/, '$1') } } };
