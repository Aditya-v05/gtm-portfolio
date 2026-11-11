// Where the closing scene's sea meets the sky, in pixels from the top of the section: just under the contact
// content, but never so high or so low that the sea or the sky is squeezed out. The sea, the big name and the
// page's last waterfall all use this, so they agree.
export function seaHorizon(section: HTMLElement): number {
  const h = section.offsetHeight;
  const above = section.querySelector<HTMLElement>("[data-above-sea]");
  const bottom = above ? above.offsetTop + above.offsetHeight : h * 0.5;
  return Math.round(Math.max(h * 0.42, Math.min(h * 0.78, bottom + h * 0.09)));
}
