import isbot from 'isbot';
import ipaddr from 'ipaddr.js';
import { savePageView, saveEvent, getWebsiteById } from 'lib/queries';
import { useCors, useSession } from 'lib/middleware';
import { getIpAddress } from 'lib/request';
import { ok, badRequest } from 'lib/response';
import { createToken } from 'lib/crypto';

export default async (req, res) => {
  await useCors(req, res);

  if (isbot(req.headers['user-agent'])) {
    return ok(res);
  }

  if (process.env.IGNORE_IP) {
    const ips = process.env.IGNORE_IP.split(',').map(n => n.trim());
    const ip = getIpAddress(req);
    const blocked = ips.find(i => {
      if (i === ip) return true;

      // CIDR notation
      if (i.indexOf('/') > 0) {
        const addr = ipaddr.parse(ip);
        const range = ipaddr.parseCIDR(i);

        if (addr.kind() === range[0].kind() && addr.match(range)) return true;
      }

      return false;
    });

    if (blocked) {
      return ok(res);
    }
  }

  await useSession(req, res);
  const { type, payload } = req.body;
  const {
    session: { website_id, session_id },
  } = req;

  //Need to set the account_id as pandium's as this is a backend/system process with no context of the account
  const website = await getWebsiteById(website_id, 420);
  const pan_account_id = website['pan_account_id'];

  if (type === 'pageview') {
    const { url, referrer } = payload;

    await savePageView(website_id, session_id, url, referrer, pan_account_id);
  } else if (type === 'event') {
    const { url, event_type, event_value, kc_user_id, admin_url } = payload;

    await saveEvent(
      website_id,
      session_id,
      url,
      event_type,
      event_value,
      pan_account_id,
      kc_user_id,
      admin_url,
    );
  } else {
    return badRequest(res);
  }

  const token = await createToken({ website_id, session_id });

  return ok(res, token);
};
