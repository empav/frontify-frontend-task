import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: './src/client/setupTests.ts',
        include: ['src/client/**/*.{test,e2e}.{ts,tsx}'],
        env: {
            NODE_ENV: 'test',
        },
    },
});
