import type { ImageProvider } from "./types";

// STUB — Ideogram 3.0 has the best in-image text rendering and is a strong
// second provider for text-heavy social posts. Wire it up in a later phase
// (separate API billing from Ideogram web subscriptions). Kept here so
// IMAGE_PROVIDER="ideogram" has a real target and the interface stays honest.
export const ideogramProvider: ImageProvider = {
  name: "ideogram",
  async generate() {
    throw new Error(
      "Ideogram provider not implemented yet. Set IMAGE_PROVIDER=openai for now.",
    );
  },
  estimateCost(_quality, _size, n) {
    return 0.05 * n; // ~Ideogram 3.0 default tier placeholder
  },
};
