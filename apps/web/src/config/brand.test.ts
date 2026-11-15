import { describe, it, expect } from "vitest";
import { APP_NAME } from "./brand";

describe("brand config", () => {
  it("APP_NAME defaults to BackendGen or environment variable", () => {
    expect(typeof APP_NAME).toBe("string");
    expect(APP_NAME.length).toBeGreaterThan(0);
    expect(APP_NAME).toBe("BackendGen");
  });
});
