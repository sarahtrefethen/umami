import { serialize } from 'cookie';
import { createSecureToken } from 'lib/crypto';
import { getAccounts } from 'lib/queries';
import { AUTH_COOKIE_NAME } from 'lib/constants';
import { ok, unauthorized } from 'lib/response';
import { JWT } from 'jose';

export default async (req, res) => {
  const { keycloak_token } = req.body;
  const parsed_token = JWT.decode(keycloak_token.toString());
  const user_group_id = parsed_token?.user_group[0].split('/')[1].split('--')[0];

  // using get accounts query as only 1 account should be returned based on RLS
  const accounts = await getAccounts(user_group_id);
  const account = accounts && accounts.length > 0 ? accounts[0] : null;

  if (account) {
    const { user_id, username, is_admin, pan_account_id } = account;
    const token = await createSecureToken({ user_id, username, is_admin, pan_account_id });
    const cookie = serialize(AUTH_COOKIE_NAME, token, {
      path: '/',
      httpOnly: true,
      sameSite: true,
      maxAge: 60 * 60 * 24 * 365,
    });

    res.setHeader('Set-Cookie', [cookie]);

    return ok(res, { token });
  }

  return unauthorized(res);
};
