const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwQjyQLYf0Oo28J_xFxJSZwq-edVJTHkEvd6nAkrpIJAtg28GtsIpaTCVLt7qvx0PZq/exec';

function reply(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return reply(405, {
      ok: false,
      message: '請由網站表單送出。'
    });
  }

  const origin = req.headers.get('origin');
  if (origin && origin !== new URL(req.url).origin) {
    return reply(403, {
      ok: false,
      message: '請由網站表單送出。'
    });
  }

  if (!req.headers.get('content-type')?.includes('application/json')) {
    return reply(415, {
      ok: false,
      message: '資料格式不正確。'
    });
  }

  let payload;
  let raw;

  try {
    raw = await req.text();
    if (raw.length > 12000) throw new Error();

    payload = JSON.parse(raw);

    if (
      !payload ||
      Array.isArray(payload) ||
      payload.consent !== true ||
      payload.website ||
      typeof payload.requestId !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.requestId)
    ) {
      throw new Error();
    }

    for (const [key, max] of [
      ['name', 60],
      ['contact', 100],
      ['interest', 30],
      ['time', 40]
    ]) {
      if (
        typeof payload[key] !== 'string' ||
        !payload[key].trim() ||
        payload[key].length > max
      ) {
        throw new Error();
      }
    }
  } catch {
    return reply(400, {
      ok: false,
      message: '請確認必填資料並同意聯繫。'
    });
  }

  try {
    const upstream = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: raw,
      redirect: 'follow',
      signal: AbortSignal.timeout(25000)
    });

    if (
      !upstream.ok ||
      !upstream.headers.get('content-type')?.includes('application/json')
    ) {
      throw new Error();
    }

    const data = await upstream.json();

    if (data.ok === true && data.requestId === payload.requestId) {
      return reply(200, {
        ok: true,
        requestId: data.requestId,
        duplicate: data.duplicate === true
      });
    }

    const errors = {
      INVALID_INPUT: [400, '請確認必填資料並同意聯繫。'],
      BUSY: [503, '目前忙碌，請保留資料稍後重試。'],
      RATE_LIMITED: [429, '同一聯絡資料送出過於頻繁，請稍後再試。'],
      SAVE_UNCONFIRMED: [
        502,
        '暫時無法確認是否完成，請保持頁面開啟並重新送出。'
      ]
    };

    if (data.ok === false && Object.hasOwn(errors, data.code)) {
      const [status, message] = errors[data.code];
      return reply(status, {
        ok: false,
        code: data.code,
        message
      });
    }

    throw new Error();
  } catch {
    return reply(502, {
      ok: false,
      code: 'SAVE_UNCONFIRMED',
      message: '暫時無法確認是否完成，請保持頁面開啟並重新送出。'
    });
  }
}
