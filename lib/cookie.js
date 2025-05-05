import cookie from 'cookie';

export const parseCookies = req => {
  if (!req || !req.headers) {
    return {};
  }
  return cookie.parse(req.headers.cookie || '');
};
