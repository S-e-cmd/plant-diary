const GAS_URL = 'https://script.google.com/macros/s/AKfycbzdwRh9gKVnNcRKQwvf22zuXBQLAM1pm4NuiXfPWIDdj884SWzlWIb4lGeu7XdSVPlcWQ/exec';

export class GasResponseError extends Error {}

export function fetchGas(body) {
  return fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body,
    redirect: 'follow'
  });
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
