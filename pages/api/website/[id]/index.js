import { deleteWebsite, getWebsiteById } from 'lib/queries';
import { methodNotAllowed, ok, unauthorized } from 'lib/response';
import { allowQuery, getAuthToken } from 'lib/auth';

export default async (req, res) => {
  const { id } = req.query;
  const { pan_account_id } = await getAuthToken(req);
  const websiteId = +id;

  if (req.method === 'GET') {
    if (!(await allowQuery(req))) {
      return unauthorized(res);
    }

    const website = await getWebsiteById(websiteId, pan_account_id);

    return ok(res, website);
  }

  if (req.method === 'DELETE') {
    if (!(await allowQuery(req, true))) {
      return unauthorized(res);
    }

    await deleteWebsite(websiteId, pan_account_id);

    return ok(res);
  }

  return methodNotAllowed(res);
};
