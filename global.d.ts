import type Alpine from 'alpinejs';

declare global {
  interface Window {
    Alpine: typeof Alpine;
    // Add htmx types here later
  }
}

export {};
