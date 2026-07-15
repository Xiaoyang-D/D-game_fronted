export function plainTextLength(html: string): number {
  if (!html) return 0
  const container = document.createElement('div')
  container.innerHTML = html
  return (container.textContent || '').length
}
