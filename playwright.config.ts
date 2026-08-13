import { defineConfig, devices } from '@playwright/test'

const testPort = process.env.PLAYWRIGHT_PORT ?? '4173'
const testBaseUrl = `http://127.0.0.1:${testPort}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'line',
  outputDir: 'test-results',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: testBaseUrl,
    colorScheme: 'light',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npm run dev -- --mode test --port ${testPort} --strictPort`,
    url: testBaseUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
