export function makeReq({ body = {}, params = {}, query = {}, auth = "" } = {}) {
  return {
    body,
    params,
    query,
    get: jest.fn((h) => (h.toLowerCase() === "authorization" ? auth : undefined)),
  };
}

export function makeRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.send = jest.fn(() => res);
  return res;
}