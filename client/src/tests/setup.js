// Vitest global setup.
// jsdom does not implement matchMedia, which some UI primitives probe for
// reduced-motion / responsive behaviour. Provide a minimal stub so component
// tests can mount without throwing.
import { vi } from 'vitest'

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}
