import { parseCookies } from './cookie';
import { getKeycloakInstance, SSRCookies } from '@react-keycloak/ssr';

export const keycloakURIFromHost = () => {
  const ourHostName = typeof window !== 'undefined' && window.location.hostname;
  const baseHost = ourHostName && ourHostName.split('.').slice(1).join('.');
  return `https://authz.${baseHost}/auth`;
};

export const keycloakConfig = {
  realm: 'admin-dash',
  url: keycloakURIFromHost(),
  clientId: 'admin-dash',
};

export const initOptions = {
  onLoad: 'check-sso',
  checkLoginIframe: false,
};

export const getPersistor = cookies => {
  return SSRCookies(cookies);
};

export const Keycloak = req => {
  const cookies = parseCookies(req);
  return getKeycloakInstance(keycloakConfig, getPersistor(cookies));
};

export const keycloak = Keycloak(keycloakConfig);
