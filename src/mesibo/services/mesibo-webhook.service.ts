import type { Request } from 'express';
import { MesiboGroupMember, MesiboWebhookRequest } from '../types';
import { messageMany, messageOne } from '@firebase';
import { prisma } from '@database';
import { AppNotification } from '@firebase/enums';
import { i18n } from '@common/locales';

export function mapAddr(
  members: MesiboGroupMember[],
  excludeAddress: number,
): number[] {
  return members
    .map((m) => Number(m.address))
    .filter((addr) => addr !== excludeAddress);
}
class MesiboWebHookService {
  async listen(req: Request) {
    const body = req.body as MesiboWebhookRequest;
    console.log(req.body);
    if (body.secret == process.env.MESIBO_BACKEND_SECRET) {
      if (body.type == 'LOCAL') {
        try {
          for (const event of body.events) {
            const sender = await prisma.user.findFirst({
              where: {
                mesiboId: event.src,
              },
              select: {
                id: true,
                username: true,
                name: true,
                language: true,
              },
            });

            if (!sender) {
              console.warn(`Webhook: unknown sender mesiboId=${event.src}, skipping event`);
              continue;
            }

            if (event.gid) {
              const dbGroup = await prisma.chat.findUnique({
                where: {
                  mesiboId: event.gid,
                },
              });

              if (!dbGroup) {
                console.warn(`Webhook: chat gid=${event.gid} not found in DB, skipping`);
                continue;
              }

              const dbMembers = await prisma.userChat.findMany({
                where: {
                  notifications: true,
                  chatId: event.gid,
                  userId: {
                    not: sender.id,
                  },
                },
              });

              const members = dbMembers.map((m) => Number(m.userId));
              console.log('Notification to', members);
              try {
                await messageMany(
                  members,
                  {
                    title: `${dbGroup.name}`,
                    body: `${sender.username}: ${
                      event.message
                        ? event.message
                        : i18n.__.call(
                            { locale: sender.language },
                            'notifications.pm.body',
                          )
                    }`,
                    type: AppNotification.GroupMessage,
                    id: `${dbGroup.mesiboId}`,
                  },
                  sender.id,
                );
              } catch (error) {
                console.warn(error);
              }
            } else {
              const user = await prisma.user.findFirst({
                where: {
                  mesiboId: event.uid,
                },
                select: {
                  id: true,
                  language: true,
                },
              });

              if (!user) {
                console.warn(`Webhook: unknown recipient mesiboId=${event.uid}, skipping DM`);
                continue;
              }

              try {
                await messageOne(
                  user.id,
                  {
                    title: i18n.__.call(
                      { locale: user.language },
                      'notifications.pm.title',
                      sender.username,
                    ),
                    body: event.message
                      ? event.message
                      : i18n.__.call(
                          { locale: user.language },
                          'notifications.pm.body',
                        ),
                    type: AppNotification.PesonalMessage,
                    id: `${event.src}`,
                  },
                  sender.id,
                );
              } catch (error) {
                console.warn(error);
              }
            }
          }
          return true;
        } catch (error) {
          console.error(error);
          return false;
        }
      } else {
        console.log(req.body);
        return false;
      }
    }
    console.log(
      "Secrets doesn't match: \n",
      req.body.secret,
      '\n',
      process.env.MESIBO_BACKEND_SECRET,
      '\n',
      req.body,
    );
    return false;
  }
}

export const mesiboWebHookService = new MesiboWebHookService();
