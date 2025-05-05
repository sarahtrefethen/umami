import moment from 'moment-timezone';
import { getPageviewStats } from 'lib/queries';
import { ok, badRequest, methodNotAllowed, unauthorized } from 'lib/response';
import { allowQuery, getAuthToken } from 'lib/auth';

const unitTypes = ['year', 'month', 'hour', 'day'];

export default async (req, res) => {
  if (req.method === 'GET') {
    if (!(await allowQuery(req))) {
      return unauthorized(res);
    }
    const { pan_account_id } = await getAuthToken(req);
    const { id, start_at, end_at, unit, tz, url } = req.query;

    const websiteId = +id;
    const startDate = new Date(+start_at);
    const endDate = new Date(+end_at);

    if (!moment.tz.zone(tz) || !unitTypes.includes(unit)) {
      return badRequest(res);
    }

    const [pageviews, sessions] = await Promise.all([
      getPageviewStats(websiteId, startDate, endDate, tz, unit, '*', url, pan_account_id),
      getPageviewStats(
        websiteId,
        startDate,
        endDate,
        tz,
        unit,
        'distinct session_id',
        url,
        pan_account_id,
      ),
    ]);

    return ok(res, { pageviews, sessions });
  }

  return methodNotAllowed(res);
};
