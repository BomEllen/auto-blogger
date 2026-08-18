function sanitizeFormattingHtml(text) {
  return text.replace(/<([^>]+)>/g, (match) => {
    const inner = match.slice(1, -1).trim();
    if (/^\/?(b|u)$/i.test(inner)) return match;
    if (/^b\s/i.test(inner)) return match;
    return '';
  });
}

function stripTitleFormatting(t) {
  if (!t) return t;
  return t
    .replace(/<[^>]+>/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .trim();
}

function parseTitles(titleBlock) {
  if (!titleBlock) return [];
  const numbered = [...titleBlock.matchAll(/^\d+\.\s*(.+)$/gm)].map(m => stripTitleFormatting(m[1].trim())).filter(Boolean);
  if (numbered.length > 0) return numbered;
  return [stripTitleFormatting(titleBlock.trim())].filter(Boolean);
}

module.exports = { sanitizeFormattingHtml, stripTitleFormatting, parseTitles };
