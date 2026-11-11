// Where the closing scene's sea meets the sky, in pixels from the top of the section. It sits far enough under
// the contact text that the big name clears the text even when a letter is raised, but never so high or
// so low that the sea or the sky is squeezed out. The sea, the name and the page's last waterfall all use this,
// so they agree.
export function seaHorizon(section: HTMLElement): number {
  const h = section.offsetHeight;
  const above = section.querySelector<HTMLElement>("[data-above-sea]");
  const name = section.querySelector<HTMLElement>(".foot__name");
  const bottom = above ? above.offsetTop + above.offsetHeight : h * 0.5;
  // A letter at rest has 46% of its box above the water, and lifts by --rise more when pointed at. The drawn
  // letter starts about 19% down its box, so that much of the box may pass behind the text unseen. What is left
  // is how tall a fully raised letter stands, and the text has to clear that.
  const rise = parseFloat(getComputedStyle(section).getPropertyValue("--rise")) || 0;
  const showing = name ? name.offsetHeight * (0.46 + rise - 0.19) + 20 : h * 0.08;
  return Math.round(Math.max(h * 0.42, Math.min(h * 0.82, bottom + showing)));
}
