const GAS_URL = 'https://script.google.com/macros/s/AKfycbz5pgdvPVOvgpPMhoTFvkWDvZrk4FILj8IAjE58xl8vJdN25m5Ea1pUimqRxArhY3F9LA/exec';
export const GAS_TIMEOUT_MS = 25000;

export class GasResponseError extends Error {}
export class GasTimeoutError extends Error {}

export async function fetchGas(body) {
  const signal = AbortSignal.timeout(GAS_TIMEOUT_MS);

  try {
    return await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body,
      redirect: 'follow',
      signal
    });
  } catch (error) {
    if (signal.aborted || error?.name === 'TimeoutError') {
      throw new GasTimeoutError('GASの応答がタイムアウトしました。時間をおいて再度お試しください。');
    }
    throw error;
  }
}

export async function parseGasJson(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new GasResponseError(
      'GASからJSONが返りませんでした。GASの再デプロイと公開範囲を確認してください。'
    );
  }
}
