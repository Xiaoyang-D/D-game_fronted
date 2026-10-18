/** Only the server's versioned avatar URL can be switched to its 128px sibling. */
export function avatarSources(url: string, size: 'sm' | 'md' | 'lg') {
  const match = /^(.*\/)_variants\/v1\/(\d{4}\/\d{2}\/\d{2}\/[a-fA-F0-9]{32}(?:\.[a-zA-Z0-9]{1,10})?)\.avatar256\.(jpg|png)$/.exec(url)
  if (!match) return { source: url, original: url }
  return {
    source: size === 'lg' ? url : `${match[1]}_variants/v1/${match[2]}.avatar128.${match[3]}`,
    original: `${match[1]}${match[2]}`,
  }
}
