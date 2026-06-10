interface FloatingCardPositionInput {
  cursorX: number;
  cursorY: number;
  cardWidth: number;
  cardHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  offset?: number;
  margin?: number;
}

export function computeFloatingCardPosition({
  cursorX,
  cursorY,
  cardWidth,
  cardHeight,
  viewportWidth,
  viewportHeight,
  offset = 16,
  margin = 16,
}: FloatingCardPositionInput): { left: number; top: number } {
  let left = cursorX + offset;
  let top = cursorY + offset;

  if (left + cardWidth + margin > viewportWidth) {
    left = cursorX - cardWidth - offset;
  }

  if (top + cardHeight + margin > viewportHeight) {
    top = cursorY - cardHeight - offset;
  }

  const maxLeft = Math.max(margin, viewportWidth - cardWidth - margin);
  const maxTop = Math.max(margin, viewportHeight - cardHeight - margin);

  return {
    left: Math.max(margin, Math.min(left, maxLeft)),
    top: Math.max(margin, Math.min(top, maxTop)),
  };
}
