import { getWebsiteByUuid, getSessionByUuid, createSession } from 'lib/queries';
import { getClientInfo } from 'lib/request';
import { uuid, isValidUuid, parseToken } from 'lib/crypto';

export async function getSession(req) {
  const { payload } = req.body;

  if (!payload) {
    throw new Error('Invalid request');
  }

  const { website: website_uuid, hostname, screen, language, cache } = payload;

  if (cache) {
    const result = await parseToken(cache);

    if (result) {
      return result;
    }
  }

  if (!isValidUuid(website_uuid)) {
    throw new Error(`Invalid website: ${website_uuid}`);
  }

  const { userAgent, browser, os, ip, country, device } = await getClientInfo(req, payload);

  //Need to set the account_id as pandium's as this is a backend/system process with no context of the account
  const website = await getWebsiteByUuid(website_uuid, 420);

  if (!website) {
    throw new Error(`Website not found: ${website_uuid}`);
  }

  const { website_id, pan_account_id } = website;
  const session_uuid = uuid(website_id, hostname, ip, userAgent, os);

  let session = await getSessionByUuid(session_uuid, pan_account_id);

  if (!session) {
    session = await createSession(
      website_id,
      {
        session_uuid,
        hostname,
        browser,
        os,
        screen,
        language,
        country,
        device,
      },
      pan_account_id,
    );
  }

  const { session_id } = session;

  return {
    website_id,
    session_id,
  };
}
