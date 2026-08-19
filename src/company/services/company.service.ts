import type { Request } from 'express';
import { paginate } from '@common/pagination';
import { FindAllCompaniesDto } from '../dto';
import { prisma } from '@database';
import { AuthorizedRequest } from '@auth/types';
import { hashObject } from '@common/utils';

class CompanyService {
  async findAllCompamnies(req: Request) {
    const dto = new FindAllCompaniesDto({
      ...(req.query as any),
    });
    const allCompanies = await prisma.company.findMany();
    const companies = await paginate({
      modelName: 'Company',
      where: {
        label: {
          contains: dto.label,
          mode: 'insensitive',
        },
      },
      orderBy: {
        label: 'asc',
        // stuff: {
        //   _count: 'desc',
        // },
      },
      include: {
        _count: {
          select: {
            members: true,
          },
        },
      },
      ...dto,
    });
    return { ...companies, hash: hashObject(allCompanies) };
  }

  async getYourCompanyChat(req: AuthorizedRequest) {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { company: { include: { chat: true } } },
    });
    return user?.company?.chat;
  }

  async getCompanyMembers() {
    return await prisma.company.findMany({
      select: {
        id: true,
        label: true,
        logo: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
      where: {
        members: {
          some: {},
        },
      },
      orderBy: {
        label: 'asc',
      },
    });
  }
}

export const companyService = new CompanyService();
