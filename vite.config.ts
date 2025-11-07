import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/SoftballStads_Ochoa/',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});

