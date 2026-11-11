// Where the closing scene's sea meets the sky, in pixels from the top of the section. It sits far enough under
// the contact text that the part of the big name standing out of the water clears the text, but never so high or
// so low that the sea or the sky is squeezed out. The sea, the name and the page's last waterfall all use this,
// so they agree.
export function seaHorizon(section: HTMLElement): number {
  const h = section.offsetHeight;
  const above = section.querySelector<HTMLElement>("[data-above-sea]");
  const name = section.querySelector<HTMLElement>(".foot__name");
  const bottom = above ? above.offsetTop + above.offsetHeight : h * 0.5;
  const showing = name ? name.offsetHeight * 0.46 : h * 0.08; // how much of the name is above the water at rest
  return Math.round(Math.max(h * 0.42, Math.min(h * 0.8, bottom + showing + 18)));
}
