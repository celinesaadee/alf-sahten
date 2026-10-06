// Position runs from -1 to 1; the preview and exported photo use the same source rectangle.
export function photoCrop(width: number, height: number, aspect: number, position: { x: number; y: number; zoom: number }) {
  const zoom = Math.max(1, Math.min(4, position.zoom));
  const cropWidth = Math.min(width, height * aspect) / zoom;
  const cropHeight = cropWidth / aspect;
  return { aspect, width: cropWidth, height: cropHeight,
    x: (width - cropWidth) * (Math.max(-1, Math.min(1, position.x)) + 1) / 2,
    y: (height - cropHeight) * (Math.max(-1, Math.min(1, position.y)) + 1) / 2 };
}
