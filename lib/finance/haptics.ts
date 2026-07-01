/** Light tap feedback on supported devices (iOS PWA, Android). */
export function haptic(type: "light" | "medium" | "success" | "warning" = "light") {
  if (typeof navigator === "undefined") return;
  const nav = navigator as Navigator & { vibrate?: (pattern: number | number[]) => boolean };
  if (type === "success") nav.vibrate?.([8, 40, 8]);
  else if (type === "warning") nav.vibrate?.([12, 30, 12, 30, 12]);
  else nav.vibrate?.(type === "medium" ? 14 : 8);
}
