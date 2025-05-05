import { PrismaClient } from '@prisma/client';
import chalk from 'chalk';
import { getItem } from './web';

const options = {
  log: [
    {
      emit: 'event',
      level: 'query',
    },
  ],
  datasources: {
    db: {
      url: `postgresql://${process.env.PAN_SEC_POSTGRES_USER}:${process.env.PAN_SEC_POSTGRES_PASSWORD}@${process.env.PAN_CFG_POSTGRES_SERVER}:5432/keycloak?schema=umami`,
    },
  },
};

function logQuery(e) {
  if (process.env.LOG_QUERY) {
    console.log(chalk.yellow(e.params), '->', e.query, chalk.greenBright(`${e.duration}ms`));
  }
}

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient(options);
  prisma.$on('query', logQuery);
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient(options);
    global.prisma.$on('query', logQuery);
  }

  prisma = global.prisma;
}

// https://github.com/prisma/prisma/issues/5128
const rlsMiddleware = async (params, next) => {
  if (params.runInTransaction) return next(params);

  const panAccountID = getItem('pan_account_id', true);
  console.log(typeof window);
  console.log('Middleway:', panAccountID);

  let actualValues = [];
  if (params.action === 'queryRaw') {
    const jsonVals = JSON.parse(params.args?.parameters?.values);
    jsonVals.map(ele =>
      actualValues.push(
        typeof ele === 'object' && ele !== null
          ? ele['prisma__type'] === 'date'
            ? new Date(ele['prisma__value'])
            : ele['prisma__value']
          : ele,
      ),
    );
  }

  // Generate model class name from model params (PascalCase to camelCase)
  const modelName =
    params.model !== undefined
      ? params.model.charAt(0).toLowerCase() + params.model.slice(1)
      : undefined;

  const [, results] = await prisma.$transaction([
    prisma.$executeRaw(`SET app.pan_account = ${panAccountID ? panAccountID : 420}`),
    params.action === 'queryRaw'
      ? prisma.$queryRaw.apply(prisma, [params.args.query, ...actualValues])
      : prisma[modelName][params.action](params.args),
  ]);

  console.log('RESULTS!: ', results);
  return results;
};

prisma.$use(rlsMiddleware);

export default prisma;
