import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const account = JSON.parse(readFileSync('firebase-credentials.json', 'utf-8'));
import { prisma } from '@database';
import { AppNotification } from '@firebase/enums';

admin.initializeApp({
  credential: admin.credential.cert(account as any),
});

const messaging = admin.messaging();

export interface NotificationData {
  title: string;
  body: string;
  type: AppNotification;
  id: string;
  questionId?: string;
  answerId?: string;
}

export interface ExtraData {
  photo?: string;
  name?: string;
  nickname?: string;
  questionId?: string;
  answerId?: string;
}

export async function messageOne(
  userId: number,
  notification: NotificationData,
  fromUserId?: number,
) {
  // Получаем данные инициатора уведомления если есть fromUserId
  let fromUserData: ExtraData = {};
  if (fromUserId) {
    const fromUser = await prisma.user.findUnique({
      where: { id: fromUserId },
      select: {
        name: true,
        username: true,
        photo: true,
      },
    });

    if (fromUser) {
      fromUserData = {
        photo: fromUser.photo || undefined,
        name: fromUser.name || undefined,
        nickname: fromUser.username || undefined,
      };
    }
  }

  // Добавляем связанные ID для вопросов/ответов/комментариев
  if (notification.questionId) {
    fromUserData.questionId = notification.questionId;
  }
  if (notification.answerId) {
    fromUserData.answerId = notification.answerId;
  }

  // Сохраняем в базу данных (кроме сообщений)
  if (
    notification.type !== AppNotification.PesonalMessage &&
    notification.type !== AppNotification.GroupMessage
  ) {
    try {
      await prisma.notificationList.create({
        data: {
          title: notification.title,
          body: notification.body,
          type: notification.type,
          id: notification.id,
          userId,
          fromUserId: fromUserId || undefined,
          questionId: +notification.questionId,
          answerId: +notification.answerId,
        },
      });
    } catch (error) {
      console.error('Error while sending notification log: ', error);
    }
  }

  const sessions = await prisma.userSession.findMany({
    where: {
      userId,
      NOT: { notificationToken: null },
    },
  });
  if (!sessions.length) return;

  const uniqueTokens = Array.from(
    new Set(sessions.map((s) => s.notificationToken!)),
  );

  // Формируем данные для push-уведомления
  const pushData: Record<string, string> = {
    type: String(notification.type),
    id: notification.id,
  };

  // Добавляем extraData если есть данные инициатора
  if (Object.keys(fromUserData).length > 0) {
    pushData.extraData = JSON.stringify(fromUserData);
  }

  const messages = uniqueTokens.map((token) => ({
    token,
    notification: {
      title: notification.title,
      body: notification.body,
    },
    data: pushData,
  }));

  console.log('messages:', messages);
  const messagingResponse = await messaging.sendEach(messages);
  if (messagingResponse.failureCount > 0) {
    console.log(JSON.stringify(messagingResponse, null, 2));
  }
}

export async function messageMany(
  userIds: number[],
  notification: NotificationData,
  fromUserId?: number,
) {
  // Получаем данные инициатора уведомления если есть fromUserId
  let fromUserData: ExtraData = {};
  if (fromUserId) {
    const fromUser = await prisma.user.findUnique({
      where: { id: fromUserId },
      select: {
        name: true,
        username: true,
        photo: true,
      },
    });

    if (fromUser) {
      fromUserData = {
        photo: fromUser.photo || undefined,
        name: fromUser.name || undefined,
        nickname: fromUser.username || undefined,
      };
    }
  }

  // Добавляем связанные ID для вопросов/ответов/комментариев
  if (notification.questionId) {
    fromUserData.questionId = notification.questionId;
  }
  if (notification.answerId) {
    fromUserData.answerId = notification.answerId;
  }

  // Сохраняем в базу данных (кроме сообщений)
  if (
    notification.type !== AppNotification.PesonalMessage &&
    notification.type !== AppNotification.GroupMessage
  ) {
    await prisma.notificationList.createMany({
      data: userIds.map((userId) => ({
        title: notification.title,
        body: notification.body,
        type: notification.type,
        id: notification.id,
        userId,
        fromUserId: fromUserId || undefined,
        questionId: +notification.questionId,
        answerId: +notification.answerId,
      })),
    });
  }

  const sessions = await prisma.userSession.findMany({
    where: {
      userId: { in: userIds },
      NOT: { notificationToken: null },
    },
  });
  if (!sessions.length) return;

  const uniqueTokens = Array.from(
    new Set(sessions.map((s) => s.notificationToken!)),
  );

  // Формируем данные для push-уведомления
  const pushData: Record<string, string> = {
    type: String(notification.type),
    id: notification.id,
  };

  // Добавляем extraData если есть данные инициатора
  if (Object.keys(fromUserData).length > 0) {
    pushData.extraData = JSON.stringify(fromUserData);
  }

  const messages = uniqueTokens.map((token) => ({
    token,
    notification: {
      title: notification.title,
      body: notification.body,
    },
    data: pushData,
  }));

  console.log('messages:', messages);

  const BATCH_SIZE = 500;
  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE);
    const messagingResponse = await messaging.sendEach(batch);
    if (messagingResponse.failureCount > 0) {
      console.log(JSON.stringify(messagingResponse, null, 2));
    }
  }
}
