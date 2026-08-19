import { prisma } from '@database';
import { paginate } from '@common/pagination';
import { PaginateDto } from '@common/dto';
import { HttpException } from '@common/exceptions';
import { ErrorCodes } from '@common/enums';
import { AuthorizedRequest } from '@auth/types';
import { CreateQuestionDto } from '../dto';
import { messageOne } from '@firebase';
import { AppNotification } from '@firebase/enums';
import { i18n } from '@common/locales';
import { deltaToPlainText } from '@common/utils';
class QuestionService {
  async findAll(
    dto: PaginateDto,
    sectionId?: number,
    subsectionId?: number,
    lang?: string,
  ) {
    const paginatedQuestions = await paginate({
      modelName: 'Question',
      orderBy: { createdAt: 'desc' },
      where: {
        sectionId,
        subsectionId,
      },
      include: {
        section: {
          include: {
            translations: {
              where: { lang },
            },
          },
        },
        subsection: {
          include: {
            translations: {
              where: { lang },
            },
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            photo: true,
          },
        },
        _count: {
          select: {
            answers: true,
          },
        },
      },
      ...dto,
    });
    const items = paginatedQuestions.items.map((q) => {
      const sectionName = q.section.translations[0]?.title ?? null;
      const subsectionName = q.subsection?.translations[0]?.title ?? null;

      return {
        ...q,
        section: {
          id: q.section.id,
          name: sectionName,
          translations: undefined,
        },
        subsection: q.subsection
          ? {
              id: q.subsection.id,
              name: subsectionName,
              translations: undefined,
            }
          : null,
      };
    });

    return {
      items,
      meta: paginatedQuestions.meta,
    };
  }

  async findOne(id: number, lang: string) {
    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        section: {
          include: {
            translations: {
              where: { lang },
            },
          },
        },
        subsection: {
          include: {
            translations: {
              where: { lang },
            },
          },
        },
        bestAnswer: true,
        answers: {
          omit: {
            questionId: true,
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                photo: true,
                company: {
                  include: {
                    _count: {
                      select: {
                        members: true,
                      },
                    },
                  },
                },
              },
            },
            votes: true,
            _count: {
              select: { comments: true },
            },
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            photo: true,
          },
        },
        questionVotes: true,
        _count: {
          select: {
            answers: true,
          },
        },
      },
    });

    if (question) {
      const sectionName = question.section.translations[0]?.title ?? null;
      const subsectionName =
        question.subsection?.translations[0]?.title ?? null;
      return {
        ...question,
        section: {
          id: question.section.id,
          name: sectionName,
          translations: undefined,
        },
        subsection: question.subsection
          ? {
              id: question.subsection.id,
              name: subsectionName,
              translations: undefined,
            }
          : null,
      };
    }
    throw HttpException.BadRequest(ErrorCodes.NotFound);
  }

  async getUserQuestions(userId: number, lang: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        questions: {
          include: {
            section: {
              include: {
                translations: {
                  where: { lang },
                },
              },
            },
            subsection: {
              include: {
                translations: {
                  where: { lang },
                },
              },
            },
            creator: {
              select: {
                id: true,
                name: true,
                username: true,
                photo: true,
              },
            },
            _count: {
              select: {
                answers: true,
              },
            },
          },
        },
      },
    });
    if (!user) {
      throw HttpException.BadRequest(ErrorCodes.NotFound);
    }
    return user.questions;
  }

  async getMyQuestions(req: AuthorizedRequest, lang: string) {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        questions: {
          include: {
            section: {
              include: {
                translations: {
                  where: { lang },
                },
              },
            },
            subsection: {
              include: {
                translations: {
                  where: { lang },
                },
              },
            },
            _count: {
              select: {
                answers: true,
              },
            },
          },
        },
      },
    });
    if (!user) {
      throw HttpException.BadRequest(ErrorCodes.NotFound);
    }
    const items = user.questions.map((q) => {
      const sectionName = q.section.translations[0]?.title ?? null;
      const subsectionName = q.subsection?.translations[0]?.title ?? null;

      return {
        ...q,
        section: {
          id: q.section.id,
          name: sectionName,
          translations: undefined,
        },
        subsection: q.subsection
          ? {
              id: q.subsection.id,
              name: subsectionName,
              translations: undefined,
            }
          : null,
      };
    });
    return items;
  }

  async searchQuestion(
    dto: PaginateDto,
    phrase: string,
    titleOnly: boolean,
    lang: string,
  ) {
    const paginatedQuestions = await paginate({
      modelName: 'Question',
      orderBy: { resolved: 'desc' },
      where: {
        OR: titleOnly
          ? [
              {
                title: {
                  contains: phrase,
                  mode: 'insensitive',
                },
              },
            ]
          : [
              {
                title: {
                  contains: phrase,
                  mode: 'insensitive',
                },
              },
              {
                content: {
                  contains: phrase,
                  mode: 'insensitive',
                },
              },
            ],
      },
      include: {
        section: {
          include: {
            translations: {
              where: { lang },
            },
          },
        },
        subsection: {
          include: {
            translations: {
              where: { lang },
            },
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            photo: true,
          },
        },
        _count: {
          select: {
            answers: true,
          },
        },
      },
      ...dto,
    });

    const items = paginatedQuestions.items.map((q) => {
      const sectionName = q.section.translations[0]?.title ?? null;
      const subsectionName = q.subsection?.translations[0]?.title ?? null;

      return {
        ...q,
        section: {
          id: q.section.id,
          name: sectionName,
          translations: undefined,
        },
        subsection: q.subsection
          ? {
              id: q.subsection.id,
              name: subsectionName,
              translations: undefined,
            }
          : null,
      };
    });

    return {
      items,
      meta: paginatedQuestions.meta,
    };
  }

  async getSections(lang: string) {
    const sections = await prisma.qSection.findMany({
      orderBy: { id: 'asc' },
      include: {
        translations: { where: { lang } },
        subsections: {
          include: { translations: { where: { lang } } },
        },
      },
    });

    return sections.map((sec) => ({
      id: sec.id,
      name: sec.translations[0]?.title ?? '',
      subsections: sec.subsections.map((sub) => ({
        id: sub.id,
        name: sub.translations[0]?.title ?? '',
      })),
    }));
  }

  async getSubSections(sectionId: number, lang: string) {
    const subs = await prisma.qSubsection.findMany({
      where: { sectionId },
      orderBy: { id: 'asc' },
      include: { translations: { where: { lang } } },
    });

    return subs.map((sub) => ({
      id: sub.id,
      name: sub.translations[0]?.title ?? '',
    }));
  }

  async createQuestion(dto: CreateQuestionDto) {
    if (
      !dto.creatorId ||
      !(await prisma.user.findUnique({ where: { id: dto.creatorId } }))
    ) {
      throw HttpException.BadRequest(ErrorCodes.NotFound);
    }

    if (
      dto.sectionId &&
      dto.subsectionId &&
      !(await prisma.qSection.findUnique({
        where: {
          id: dto.sectionId,
          subsections: dto.subsectionId
            ? {
                some: {
                  id: dto.subsectionId,
                },
              }
            : undefined,
        },
      }))
    ) {
      throw HttpException.BadRequest(ErrorCodes.BadRequest);
    }
    return await prisma.question.create({ data: dto });
  }

  async createAnswer(questionId: number, authorId: number, content: string) {
    const answer = await prisma.answer.create({
      data: {
        content,
        question: { connect: { id: questionId } },
        author: { connect: { id: authorId } },
      },
      include: {
        author: true,
      },
    });

    try {
      const question = await prisma.question.findUnique({
        where: {
          id: questionId,
        },
        include: { creator: true },
      });

      await messageOne(
        question.creatorId,
        {
          title: i18n.__.call(
            { locale: question.creator.language },
            'notifications.question_answer.title',
            question.title,
          ),
          body: `${answer.author.username}: ${answer.content ? deltaToPlainText(JSON.parse(answer.content), 50) : '...'}`,
          type: AppNotification.QuestionAnswered,
          id: `${answer.id}`,
          questionId: String(questionId),
          answerId: String(answer.id),
        },
        answer.authorId,
      );
    } catch (error) {
      console.warn(error);
    }
    return answer;
  }

  async editAnswer(answerId: number, userId: number, content: string) {
    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
      include: {
        question: {
          select: { bestAnswerId: true },
        },
      },
    });

    if (!answer) {
      throw HttpException.BadRequest(ErrorCodes.NotFound);
    }

    if (answer.authorId !== userId) {
      throw HttpException.Forbidden(ErrorCodes.Forbidden);
    }

    return prisma.answer.update({
      where: { id: answerId },
      data: {
        content,
        isEdited: true,
        editedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            photo: true,
            company: {
              include: {
                _count: {
                  select: {
                    members: true,
                  },
                },
              },
            },
          },
        },
        votes: true,
        _count: {
          select: { comments: true },
        },
      },
    });
  }

  async deleteAnswer(answerId: number, userId: number) {
    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
      include: {
        question: {
          select: { bestAnswerId: true, creatorId: true },
        },
        _count: {
          select: { comments: true },
        },
      },
    });

    if (!answer) {
      throw HttpException.BadRequest(ErrorCodes.NotFound);
    }

    if (answer.authorId !== userId && answer.question.creatorId !== userId) {
      throw HttpException.Forbidden(ErrorCodes.Forbidden);
    }

    return prisma.answer.update({
      where: { id: answerId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  async getCommentsByAnswer(answerId: number, dto: PaginateDto) {
    return paginate({
      modelName: 'AnswerComment',
      where: {
        answerId,
        parentId: null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            photo: true,
            company: {
              include: {
                _count: {
                  select: {
                    members: true,
                  },
                },
              },
            },
          },
        },
        votes: true,
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                photo: true,
                company: {
                  include: {
                    _count: {
                      select: {
                        members: true,
                      },
                    },
                  },
                },
              },
            },
            votes: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { replies: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      ...dto,
    });
  }

  async voteQuestion(userId: number, questionId: number, value: number) {
    return prisma.questionVote.upsert({
      where: {
        userId_questionId: { userId, questionId },
      },
      update: {
        value,
      },
      create: {
        userId,
        questionId,
        value,
      },
    });
  }

  async voteAnswer(userId: number, answerId: number, value: number) {
    return prisma.answerVote.upsert({
      where: {
        userId_answerId: { userId, answerId },
      },
      update: {
        value,
      },
      create: {
        userId,
        answerId,
        value,
      },
    });
  }

  async markAnswerIrrelevant(answerId: number, userId: number) {
    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
      include: {
        question: true,
        author: {
          select: { language: true },
        },
      },
    });

    if (!answer || answer.question.creatorId !== userId) {
      throw HttpException.Forbidden(ErrorCodes.Forbidden);
    }

    const updatedAnswer = await prisma.answer.update({
      where: { id: answerId },
      data: { markedAsIrrelevant: true },
      include: {
        _count: {
          select: { comments: true },
        },
      },
    });

    try {
      await messageOne(
        answer.authorId,
        {
          title: i18n.__.call(
            { locale: answer.author.language },
            'notifications.answer_irrelevant.title',
          ),
          body: i18n.__.call(
            { locale: answer.author.language },
            'notifications.answer_irrelevant.body',
            answer.question.title,
          ),
          type: AppNotification.YourAnswerIsUselles,
          id: `${answer.question.id}`,
          questionId: String(answer.question.id),
          answerId: String(answerId),
        },
        answer.question.creatorId,
      );
    } catch (error) {
      console.warn(error);
    }

    return updatedAnswer;
  }

  async markBestAnswer(answerId: number, userId: number) {
    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
      include: {
        question: true,
        author: {
          select: {
            language: true,
          },
        },
      },
    });

    if (!answer || answer.question.creatorId !== userId) {
      throw HttpException.Forbidden(ErrorCodes.Forbidden);
    }

    const updatedQuestion = await prisma.question.update({
      where: { id: answer.question.id },
      data: { bestAnswerId: answerId, resolved: true },
    });
    try {
      await prisma.user.update({
        where: {
          id: answer.authorId,
        },
        data: {
          answerScore: {
            increment: 10,
          },
        },
      });
    } catch (error) {
      console.warn(error);
    }
    try {
      await messageOne(
        answer.authorId,
        {
          title: i18n.__.call(
            { locale: answer.author.language },
            'notifications.answer_best.title',
          ),
          body: i18n.__.call(
            { locale: answer.author.language },
            'notifications.answer_best.body',
            updatedQuestion.title,
          ),
          type: AppNotification.YourAnswerIsBest,
          id: `${updatedQuestion.id}`,
          questionId: String(updatedQuestion.id),
          answerId: String(answerId),
        },
        answer.question.creatorId,
      );
    } catch (error) {
      console.warn(error);
    }

    return updatedQuestion;
  }

  async getQuestionsThatAnswered(req: AuthorizedRequest, lang: string) {
    const answers = await prisma.answer.findMany({
      where: { authorId: req.user.id },
      include: {
        question: {
          include: {
            section: {
              include: { translations: { where: { lang } } },
            },
            subsection: {
              include: { translations: { where: { lang } } },
            },
            creator: {
              select: { id: true, name: true, username: true, photo: true },
            },
            _count: { select: { answers: true } },
          },
        },
      },
    });

    const questions = answers.map(({ question }) => {
      const sectionTrans = question.section.translations[0];
      const subsectionTrans = question.subsection?.translations[0];

      const { translations: _sec, ...secRest } = question.section;
      const subRest = question.subsection
        ? (({ translations: _s, ...rest }) => rest)(question.subsection)
        : null;

      return {
        ...question,
        section: {
          ...secRest,
          name: sectionTrans?.title ?? '',
        },
        subsection: subRest
          ? {
              ...subRest,
              name: subsectionTrans?.title ?? '',
            }
          : null,
      };
    });

    return questions;
  }

  async createComment(
    answerId: number,
    authorId: number,
    content: string,
    parentId?: number,
  ) {
    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
      include: {
        question: true,
        author: {
          select: {
            language: true,
          },
        },
      },
    });

    if (!answer) {
      throw HttpException.BadRequest(ErrorCodes.NotFound);
    }

    let parentComment: {
      id: number;
      content: string;
      authorId: number;
      isEdited: boolean;
      isDeleted: boolean;
      editedAt: Date;
      deletedAt: Date;
      createdAt: Date;
      answerId: number;
      parentId: number;
      author: {
        id: number;
        language: string;
      };
    };
    if (parentId) {
      const parentComment = await prisma.answerComment.findUnique({
        where: { id: parentId },
        include: {
          author: {
            select: {
              id: true,
              language: true,
            },
          },
        },
      });

      if (!parentComment || parentComment.answerId !== answerId) {
        throw HttpException.BadRequest(ErrorCodes.BadRequest);
      }
    }

    const comment = await prisma.answerComment.create({
      data: {
        content,
        answerId,
        authorId,
        parentId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            photo: true,
            company: {
              include: {
                _count: {
                  select: {
                    members: true,
                  },
                },
              },
            },
          },
        },
        votes: true,
        _count: {
          select: { replies: true },
        },
      },
    });

    try {
      await messageOne(
        answer.authorId,
        {
          title: i18n.__.call(
            { locale: answer.author.language },
            'notifications.comment.title',
            answer.question.title,
          ),
          body: `${comment.author.username}: ${comment.content}`,
          type: AppNotification.AnswerCommented,
          id: `${answer.question.id}`,
          questionId: String(answer.question.id),
          answerId: String(answerId),
        },
        comment.authorId,
      );
      if (parentComment) {
        await messageOne(
          parentComment.author.id,
          {
            title: i18n.__.call(
              { locale: parentComment.author.language },
              'notifications.comment.title',
              answer.question.title,
            ),
            body: `${comment.author.username}: ${comment.content}`,
            type: AppNotification.AnswerCommented,
            id: `${answer.question.id}`,
            questionId: String(answer.question.id),
            answerId: String(answerId),
          },
          comment.authorId,
        );
      }
    } catch (error) {
      console.warn(error);
    }

    return comment;
  }

  async editComment(commentId: number, userId: number, content: string) {
    const comment = await prisma.answerComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw HttpException.BadRequest(ErrorCodes.NotFound);
    }

    if (comment.authorId !== userId) {
      throw HttpException.Forbidden(ErrorCodes.Forbidden);
    }

    return prisma.answerComment.update({
      where: { id: commentId },
      data: {
        content,
        isEdited: true,
        editedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            photo: true,
          },
        },
        votes: true,
      },
    });
  }

  async deleteComment(commentId: number, userId: number) {
    const comment = await prisma.answerComment.findUnique({
      where: { id: commentId },
      include: {
        _count: {
          select: { replies: true },
        },
      },
    });

    if (!comment) {
      throw HttpException.BadRequest(ErrorCodes.NotFound);
    }

    if (comment.authorId !== userId) {
      throw HttpException.Forbidden(ErrorCodes.Forbidden);
    }

    return prisma.answerComment.update({
      where: { id: commentId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  async voteComment(userId: number, commentId: number, value: number) {
    return prisma.commentVote.upsert({
      where: {
        userId_commentId: { userId, commentId },
      },
      update: {
        value,
      },
      create: {
        userId,
        commentId,
        value,
      },
    });
  }

  async getTopBest() {
    return await prisma.user.findMany({
      where: {
        answerScore: {
          gt: 0,
        },
      },
      select: {
        id: true,
        name: true,
        username: true,
        photo: true,
        answerScore: true,
      },
      orderBy: {
        answerScore: 'desc',
      },
      take: 20,
    });
  }

  async getTopActive() {
    return await prisma.user.findMany({
      where: {
        Answer: {
          some: {},
        },
      },
      select: {
        id: true,
        name: true,
        username: true,
        photo: true,
        _count: {
          select: {
            Answer: true,
          },
        },
      },
      orderBy: {
        Answer: {
          _count: 'desc',
        },
      },
      take: 20,
    });
  }
}

export const questionService = new QuestionService();
