import { hslToRgb, Gamma } from "./util";

export interface LedEffect {
  (buffer: Uint8Array, length: number, time: number): void;
}

export const Rainbow: LedEffect = (buffer, length, time) => {
  for (let idx = 0; idx < length; idx += 1) {
    const hue = ((idx + time * 0.25) % length) / length;

    const [r, g, b] = hslToRgb(hue, 1, (Math.sin(time / 25) + 1) * 0.06125);

    // const [r, g, b] = hslToRgb(hue, 1, Math.random() / 5 + 0.5);

    buffer[idx * 3 + 0] = Gamma[g];
    buffer[idx * 3 + 1] = Gamma[r];
    buffer[idx * 3 + 2] = Gamma[b];
  }
};

export const Race: LedEffect = (buffer, length, time) => {
  for (let idx = 0; idx < length; idx += 1) {
    if (idx < (time % length)) {
      buffer[idx * 3 + 0] = 31;
      buffer[idx * 3 + 1] = 31;
      buffer[idx * 3 + 2] = 31;
    }

    buffer[idx] = time % 128;
  }
};
