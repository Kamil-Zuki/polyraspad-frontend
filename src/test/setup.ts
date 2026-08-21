import * as matchers from "@testing-library/jest-dom/matchers"
import { expect, vi } from "vitest"

expect.extend(matchers)

vi.mock("next-intl", () => ({
  useTranslations: () => {
    const t = (key: string) => key
    t.rich = (key: string) => key
    return t
  },
}))
