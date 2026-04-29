import { initializeApp } from './app';

initializeApp().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
