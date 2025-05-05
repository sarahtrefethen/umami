import moment from 'moment-timezone';
import prisma from 'lib/db';
import { subMinutes } from 'date-fns';
import {
  MYSQL,
  POSTGRESQL,
  MYSQL_DATE_FORMATS,
  POSTGRESQL_DATE_FORMATS,
  URL_LENGTH,
} from 'lib/constants';

export function getDatabase() {
  return 'postgresql';
}

export async function runQuery(query) {
  return query.catch(e => {
    throw e;
  });
}

export async function rawQuery(query, params = []) {
  const db = getDatabase();

  if (db !== POSTGRESQL && db !== MYSQL) {
    return Promise.reject(new Error('Unknown database.'));
  }

  const sql = db === MYSQL ? query.replace(/\$[0-9]+/g, '?') : query;

  return prisma.$queryRaw.apply(prisma, [sql, ...params]);
}

export function getDateQuery(field, unit, timezone) {
  const db = getDatabase();

  if (db === POSTGRESQL) {
    if (timezone) {
      return `to_char(date_trunc('${unit}', ${field} at time zone '${timezone}'), '${POSTGRESQL_DATE_FORMATS[unit]}')`;
    }
    return `to_char(date_trunc('${unit}', ${field}), '${POSTGRESQL_DATE_FORMATS[unit]}')`;
  }

  if (db === MYSQL) {
    if (timezone) {
      const tz = moment.tz(timezone).format('Z');

      return `DATE_FORMAT(convert_tz(${field},'+00:00','${tz}'), '${MYSQL_DATE_FORMATS[unit]}')`;
    }

    return `DATE_FORMAT(${field}, '${MYSQL_DATE_FORMATS[unit]}')`;
  }
}

export function getTimestampInterval(field) {
  const db = getDatabase();

  if (db === POSTGRESQL) {
    return `floor(extract(epoch from max(${field}) - min(${field})))`;
  }

  if (db === MYSQL) {
    return `floor(unix_timestamp(max(${field})) - unix_timestamp(min(${field})))`;
  }
}

export async function getWebsiteById(website_id, pan_account_id) {
  return runQuery(
    prisma.website.findUnique({
      where: {
        website_id,
      },
      pan_account_id: pan_account_id,
    }),
  );
}

export async function getWebsiteByUuid(website_uuid, pan_account_id) {
  return runQuery(
    prisma.website.findUnique({
      where: {
        website_uuid,
      },
      pan_account_id: pan_account_id,
    }),
  );
}

export async function getWebsiteByShareId(share_id, pan_account_id) {
  return runQuery(
    prisma.website.findUnique({
      where: {
        share_id,
      },
      pan_account_id: pan_account_id,
    }),
  );
}

export async function getUserWebsites(user_id, pan_account_id) {
  return runQuery(
    prisma.website.findMany({
      orderBy: {
        name: 'asc',
      },
      pan_account_id: pan_account_id,
    }),
  );
}

export async function createWebsite(user_id, data, pan_account_id) {
  return runQuery(
    prisma.website.create({
      data: {
        account: {
          connect: {
            user_id,
          },
        },
        ...data,
        pan_account_id: pan_account_id,
      },
      pan_account_id: pan_account_id,
    }),
  );
}

export async function updateWebsite(website_id, data, pan_account_id) {
  return runQuery(
    prisma.website.update({
      where: {
        website_id,
      },
      data,
      pan_account_id: pan_account_id,
    }),
  );
}

export async function resetWebsite(website_id, pan_account_id) {
  return runQuery(prisma.$queryRaw`delete from session where website_id=${website_id} and pan_account_id=${pan_account_id}`);
}

export async function deleteWebsite(website_id, pan_account_id) {
  return runQuery(
    /* Prisma bug, does not cascade on non-nullable foreign keys
    prisma.website.delete({
      where: {
        website_id,
      },
    }),
     */
    prisma.$queryRaw`delete from website where website_id=${website_id} and pan_account_id=${pan_account_id}`,
  );
}

export async function createSession(website_id, data, pan_account_id) {
  return runQuery(
    prisma.session.create({
      data: {
        website_id,
        ...data,
        pan_account_id,
      },
      select: {
        session_id: true,
      },
      pan_account_id: pan_account_id,
    }),
  );
}

export async function getSessionByUuid(session_uuid, pan_account_id) {
  return runQuery(
    prisma.session.findUnique({
      where: {
        session_uuid,
      },
      pan_account_id: pan_account_id,
    }),
  );
}

export async function savePageView(website_id, session_id, url, referrer, pan_account_id) {
  return runQuery(
    prisma.pageview.create({
      data: {
        website_id,
        session_id,
        url: url?.substr(0, URL_LENGTH),
        referrer: referrer?.substr(0, URL_LENGTH),
        pan_account_id: pan_account_id,
      },
      pan_account_id: pan_account_id,
    }),
  );
}

export async function saveEvent(
  website_id,
  session_id,
  url,
  event_type,
  event_value,
  pan_account_id,
) {
  return runQuery(
    prisma.event.create({
      data: {
        website_id,
        session_id,
        url: url?.substr(0, URL_LENGTH),
        event_type: event_type?.substr(0, 50),
        event_value: event_value?.substr(0, 50),
        pan_account_id: pan_account_id,
      },
      pan_account_id: pan_account_id,
    }),
  );
}

export async function getAccounts(pan_account_id) {
  return runQuery(
    prisma.account.findMany({
      pan_account_id: pan_account_id,
    }),
  );
}

export async function getAccountById(user_id, pan_account_id) {
  return runQuery(
    prisma.account.findUnique({
      where: {
        user_id,
      },
      pan_account_id: pan_account_id,
    }),
  );
}

export async function getAccountByUsername(username, pan_account_id) {
  return runQuery(
    prisma.account.findUnique({
      where: {
        username,
      },
      pan_account_id: pan_account_id,
    }),
  );
}

export async function updateAccount(user_id, data, pan_account_id) {
  return runQuery(
    prisma.account.update({
      where: {
        user_id,
      },
      pan_account_id: pan_account_id,
      data,
    }),
  );
}

export async function deleteAccount(user_id) {
  return runQuery(
    /* Prisma bug, does not cascade on non-nullable foreign keys
    prisma.account.delete({
      where: {
        user_id,
      },
    }),
     */
    prisma.$queryRaw`delete from account where user_id=${user_id}`,
  );
}

export async function createAccount(data, pan_account_id) {
  return runQuery(
    prisma.account.create({
      pan_account_id: pan_account_id,
      data,
    }),
  );
}

export async function getSessions(websites, start_at, pan_account_id) {
  return runQuery(
    prisma.session.findMany({
      where: {
        website: {
          website_id: {
            in: websites,
          },
        },
        created_at: {
          gte: start_at,
        },
      },
      pan_account_id: pan_account_id,
    }),
  );
}

export async function getPageviews(websites, start_at, pan_account_id) {
  return runQuery(
    prisma.pageview.findMany({
      where: {
        website: {
          website_id: {
            in: websites,
          },
        },
        created_at: {
          gte: start_at,
        },
      },
      pan_account_id: pan_account_id,
    }),
  );
}

export async function getEvents(websites, start_at, pan_account_id) {
  return runQuery(
    prisma.event.findMany({
      where: {
        website: {
          website_id: {
            in: websites,
          },
        },
        created_at: {
          gte: start_at,
        },
      },
      pan_account_id: pan_account_id,
    }),
  );
}

export function getWebsiteStats(website_id, start_at, end_at, filters = {}, pan_account_id) {
  const params = [website_id, start_at, end_at, { pan_account_id: pan_account_id }];
  const { url } = filters;
  let urlFilter = '';

  if (url) {
    urlFilter = `and url=$${params.length + 1}`;
    params.push(decodeURIComponent(url));
  }

  return rawQuery(
    `
      select sum(t.c) as "pageviews",
        count(distinct t.session_id) as "uniques",
        sum(case when t.c = 1 then 1 else 0 end) as "bounces",
        sum(t.time) as "totaltime"
      from (
         select session_id,
           ${getDateQuery('created_at', 'hour')},
           count(*) c,
           ${getTimestampInterval('created_at')} as "time"
         from pageview
         where website_id=$1
         and created_at between $2 and $3
         ${urlFilter}
         group by 1, 2
     ) t
    `,
    params,
  );
}

export function getPageviewStats(
  website_id,
  start_at,
  end_at,
  timezone = 'utc',
  unit = 'day',
  count = '*',
  url,
  pan_account_id,
) {
  const params = [website_id, start_at, end_at, { pan_account_id: pan_account_id }];
  let urlFilter = '';

  if (url) {
    urlFilter = `and url=$${params.length + 1}`;
    params.push(decodeURIComponent(url));
  }

  return rawQuery(
    `
    select ${getDateQuery('created_at', unit, timezone)} t,
      count(${count}) y
    from pageview
    where website_id=$1
    and created_at between $2 and $3
    ${urlFilter}
    group by 1
    order by 1
    `,
    params,
  );
}

export function getSessionMetrics(
  website_id,
  start_at,
  end_at,
  field,
  filters = {},
  pan_account_id = null,
) {
  const params = [website_id, start_at, end_at, { pan_account_id: pan_account_id }];
  const { url } = filters;

  let urlFilter = '';

  if (url) {
    urlFilter = `and url=$${params.length + 1}`;
    params.push(decodeURIComponent(url));
  }

  return rawQuery(
    `
    select ${field} x, count(*) y
    from session
    where session_id in (
      select session_id
      from pageview
      where website_id=$1
      and created_at between $2 and $3
      ${urlFilter}
    )
    group by 1
    order by 2 desc
    `,
    params,
  );
}

export function getPageviewMetrics(
  website_id,
  start_at,
  end_at,
  field,
  table,
  filters = {},
  pan_account_id = null,
) {
  const params = [website_id, start_at, end_at, { pan_account_id: pan_account_id }];
  const { domain, url } = filters;

  let domainFilter = '';
  let urlFilter = '';

  if (domain) {
    domainFilter = `and referrer not like $${params.length + 1} and referrer not like '/%'`;
    params.push(`%://${domain}/%`);
  }

  if (url) {
    urlFilter = `and url=$${params.length + 1}`;
    params.push(decodeURIComponent(url));
  }

  return rawQuery(
    `
    select ${field} x, count(*) y
    from ${table}
    where website_id=$1
    and created_at between $2 and $3
    ${domainFilter}
    ${urlFilter}
    group by 1
    order by 2 desc
    `,
    params,
  );
}

export function getActiveVisitors(website_id, pan_account_id) {
  const date = subMinutes(new Date(), 5);
  const params = [website_id, date, { pan_account_id: pan_account_id }];

  return rawQuery(
    `
    select count(distinct session_id) x
    from pageview
    where website_id=$1
    and created_at >= $2
    `,
    params,
  );
}

export function getEventMetrics(
  website_id,
  start_at,
  end_at,
  timezone = 'utc',
  unit = 'day',
  filters = {},
  pan_account_id = null,
) {
  const params = [website_id, start_at, end_at, { pan_account_id: pan_account_id }];
  const { url } = filters;

  let urlFilter = '';

  if (url) {
    urlFilter = `and url=$${params.length + 1}`;
    params.push(decodeURIComponent(url));
  }

  return rawQuery(
    `
    select
      event_value x,
      ${getDateQuery('created_at', unit, timezone)} t,
      count(*) y
    from event
    where website_id=$1
    and created_at between $2 and $3
    ${urlFilter}
    group by 1, 2
    order by 2
    `,
    params,
  );
}

export async function getRealtimeData(websites, time, pan_account_id) {
  const [pageviews, sessions, events] = await Promise.all([
    getPageviews(websites, time, pan_account_id),
    getSessions(websites, time, pan_account_id),
    getEvents(websites, time, pan_account_id),
  ]);

  return {
    pageviews: pageviews.map(({ view_id, ...props }) => ({
      __id: `p${view_id}`,
      view_id,
      ...props,
    })),
    sessions: sessions.map(({ session_id, ...props }) => ({
      __id: `s${session_id}`,
      session_id,
      ...props,
    })),
    events: events.map(({ event_id, ...props }) => ({
      __id: `e${event_id}`,
      event_id,
      ...props,
    })),
    timestamp: Date.now(),
  };
}
