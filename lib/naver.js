async function fetchNaverBlogTitles(query) {
  const clientId     = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret || !query?.trim()) return [];
  try {
    const url = `https://openapi.naver.com/v1/search/blog?query=${encodeURIComponent(query.trim())}&display=20&sort=sim`;
    const resp = await fetch(url, {
      headers: { 'X-Naver-Client-Id': clientId, 'X-Naver-Client-Secret': clientSecret },
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data.items || []).map(item => item.title.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
  } catch {
    return [];
  }
}

module.exports = { fetchNaverBlogTitles };
