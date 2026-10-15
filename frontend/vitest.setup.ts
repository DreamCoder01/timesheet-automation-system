import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// 1. Intercept and completely mock out Next.js 15 App Router navigation hooks
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
}));

// 2. Inject native browser alert stub spies to prevent unhandled rejection failures inside Node environments
vi.stubGlobal("alert", vi.fn());

// 3. Inject absolute mock paths to prevent relative fetch routing errors inside your fetch clients
process.env.NEXT_PUBLIC_API_URL = "http://localhost:8000";
