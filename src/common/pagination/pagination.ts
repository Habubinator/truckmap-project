import type * as T from './types';
import { prisma } from '@database';

export async function paginate<ModelName extends T.ModelNames>({
  page,
  pageSize,
  modelName,
  where,
  select,
  omit,
  include,
  orderBy,
  distinct = undefined,
}: T.PaginationOptions<ModelName>) {
  try {
    const db = prisma[modelName as string];
    const skip = (page - 1) * pageSize;

    const [items, count] = await prisma.$transaction([
      db.findMany({
        where,
        select,
        omit,
        include,
        skip,
        take: pageSize,
        orderBy,
        distinct,
      }),
      db.count({ where }),
    ]);

    const paginated: {
      items: any[];
      meta: {
        page: number;
        pageSize: number;
        pageCount: number;
        total: any;
        prevPage: any;
        nextPage: any;
      };
    } = {
      items,
      meta: {
        page,
        pageSize,
        pageCount: Math.ceil(count / pageSize),
        total: count,
        prevPage: null,
        nextPage: null,
      },
    };

    if (page > 1 && page <= paginated.meta.pageCount) {
      paginated.meta.prevPage = page - 1;
    }

    if (page < paginated.meta.pageCount) {
      paginated.meta.nextPage = page + 1;
    }

    return paginated;
  } catch (e: unknown) {
    throw e;
  }
}
