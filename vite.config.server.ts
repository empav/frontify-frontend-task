import { defineConfig } from 'vitest/config';

// https://vitejs.dev/config/
export default defineConfig({
    test: {
        include: ['src/server/**/*.{test,e2e,spec}.{ts,tsx}'],
        env: {
            NODE_ENV: 'test',
        },
    },
});
