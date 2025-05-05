import { getPageviewMetrics, getSessionMetrics, getWebsiteById } from 'lib/queries';
import { ok, methodNotAllowed, unauthorized, badRequest } from 'lib/response';
import { allowQuery, getAuthToken } from 'lib/auth';

const sessionColumns = ['browser', 'os', 'device', 'country'];
const pageviewColumns = ['url', 'referrer'];

function getTable(type) {
  if (type === 'event') {
    return 'event';
  }

  if (sessionColumns.includes(type)) {
    return 'session';
  }

  return 'pageview';
}

function getColumn(type) {
  if (type === 'event') {
    return `concat(event_type, '\t', event_value, '-url-', admin_url)`;
  }
  return type;
}

export default async (req, res) => {
  if (req.method === 'GET') {
    if (!(await allowQuery(req))) {
      return unauthorized(res);
    }

    const { id, type, start_at, end_at, url } = req.query;
    const { pan_account_id } = await getAuthToken(req);

    const websiteId = +id;
    const startDate = new Date(+start_at);
    const endDate = new Date(+end_at);

    if (sessionColumns.includes(type)) {
      const data = await getSessionMetrics(
        websiteId,
        startDate,
        endDate,
        type,
        { url },
        pan_account_id,
      );

      return ok(res, data);
    }

    if (pageviewColumns.includes(type) || type === 'event') {
      let domain;
      if (type === 'referrer') {
        const website = getWebsiteById(websiteId, pan_account_id);

        if (!website) {
          return badRequest(res);
        }

        domain = website.domain;
      }

      const data = await getPageviewMetrics(
        websiteId,
        startDate,
        endDate,
        getColumn(type),
        getTable(type),
        {
          domain,
          url: type !== 'url' && url,
        },
        pan_account_id,
      );

      return ok(res, data);
    }
  }

  return methodNotAllowed(res);
};
