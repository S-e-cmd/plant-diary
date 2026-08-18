export async function requestApi(payload, { fetchImpl = globalThis.fetch, apiUrl = '/api' } = {}) {
  if (typeof fetchImpl !== 'function') throw new TypeError('fetch implementation is required');
  const response = await fetchImpl(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error('APIから正しい応答が返りませんでした。');
  }

  if (!response.ok || !body?.ok) {
    throw new Error(body?.error || '通信に失敗しました。');
  }
  return body.data;
}
