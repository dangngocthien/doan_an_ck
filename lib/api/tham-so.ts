// Lấy query string của request thành object { khoa: giaTri }.
// Khóa lặp (?a=1&a=2) thì lấy giá trị đầu, giống cách các trang web đang đọc.
export function thamSoTuUrl(request: Request): Record<string, string> {
  const sp = new URL(request.url).searchParams;
  return Object.fromEntries([...sp.keys()].map((k) => [k, sp.get(k) as string]));
}
