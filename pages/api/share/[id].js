import { getWebsiteByShareId } from 'lib/queries';
import { ok, notFound, methodNotAllowed } from 'lib/response';
import { createToken } from 'lib/crypto';
import { getAuthToken } from '../../../lib/auth';

export default async (req, res) => {
  const { id } = req.query;
  const { pan_account_id } = await getAuthToken(req);

  if (req.method === 'GET') {
    const website = await getWebsiteByShareId(id, pan_account_id);

    if (website) {
      const websiteId = website.website_id;
      const token = await createToken({ website_id: websiteId, pan_account_id: pan_account_id });

      return ok(res, { websiteId, token });
    }

    return notFound(res);
  }

  return methodNotAllowed(res);
};
