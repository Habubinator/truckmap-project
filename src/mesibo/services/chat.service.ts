import { prisma } from '@database';
import { HttpException } from '@common/exceptions';
import { ErrorCodes } from '@common/enums';
import { ChatType } from '@mesibo/enums';
import { AuthorizedRequest } from '@auth/types';
import { mesiboService } from './';

class ChatService {
  async createChat(req: AuthorizedRequest) {
    const file = req.file;
    const photo = `${file ? `${process.env.CLIENT_URL}/static/chats/${encodeURIComponent(file.filename)}` : ''}`;
    const chatName = req.body.chatName;
    const members: number[] =
      typeof req.body?.members == 'object'
        ? req.body?.members
        : req.body?.members?.split(',') || [];
    members.unshift(req.user.id);
    return await mesiboService.createCustomChat(chatName, photo, members);
  }

  async updateChat(req: AuthorizedRequest) {
    const file = req.file;
    const photo = `${file ? `${process.env.CLIENT_URL}/static/chats/${encodeURIComponent(file.filename)}` : ''}`;
    const chatName = req.body.chatName;
    const mesiboChatId = Number(req.params.chatId);
    const requesterId = req.user.id;

    const requesterLink = await prisma.userChat.findUnique({
      where: {
        userId_chatId: {
          userId: requesterId,
          chatId: mesiboChatId,
        },
      },
    });

    if (!requesterLink) {
      throw HttpException.Forbidden(
        ErrorCodes.Forbidden,
        'You are not member of this chat',
      );
    }

    if (!requesterLink.isAdmin) {
      throw HttpException.Forbidden(
        ErrorCodes.Forbidden,
        'Only admin can delete users from chat',
      );
    }

    const updatedChat = await prisma.chat.update({
      where: {
        mesiboId: mesiboChatId,
      },
      data: {
        photo: photo || undefined,
        name: chatName || undefined,
      },
    });

    await mesiboService.updateGroup(
      mesiboChatId,
      chatName || updatedChat.name,
      photo || updatedChat.photo,
    );

    return updatedChat;
  }

  async getPrivateChatsOfUser(req: AuthorizedRequest) {
    const userChats = await prisma.userChat.findMany({
      where: {
        userId: req.user.id,
        chat: {
          typeId: ChatType.Private,
        },
      },
      include: {
        chat: {
          include: {
            _count: {
              select: { members: true },
            },
          },
        },
      },
    });
    if (userChats.length) {
      return userChats.map((uchat) => uchat.chat);
    } else {
      return [];
    }
  }

  async getChat(req: AuthorizedRequest) {
    const chatId = Number(req.params.chatId);
    const chat = await prisma.chat.findUnique({
      where: {
        mesiboId: chatId,
      },
      include: {
        point: {
          select: {
            id: true,
            type: true,
            chatid: true,
            verified: true,
            number_of_parking_spots: true,
            address: true,
            name: true,
            security_rating: true,
            latitude: true,
            longitude: true,
          },
        },
        members: {
          omit: {
            chatId: true,
          },
          include: {
            user: {
              select: {
                id: true,
                mesiboId: true,
                username: true,
                name: true,
                company: {
                  include: {
                    _count: {
                      select: {
                        members: true,
                      },
                    },
                  },
                },
                isShowOnParkings: true,
                photo: true,
              },
            },
          },
        },
      },
    });

    if (!chat) {
      throw HttpException.BadRequest(
        ErrorCodes.NotFound,
        `No chat found with this id: ${chatId}`,
      );
    }

    if (chat?.point?.type) {
      chat.point.type = chat?.point?.type.replace('_', '-');
    }

    return chat;
  }

  async switchChatNotifications(req: AuthorizedRequest) {
    const chatId = Number(req.params.chatId);
    const chat = await prisma.chat.findUnique({
      where: {
        mesiboId: chatId,
      },
      include: {
        members: {
          where: {
            userId: req.user.id,
            chatId: chatId,
          },
        },
      },
    });

    if (!chat) {
      throw HttpException.BadRequest(
        ErrorCodes.NotFound,
        `No chat found with this id: ${chatId}`,
      );
    }

    if (!chat.members) {
      throw HttpException.Forbidden(
        ErrorCodes.Forbidden,
        'You are not member of this chat',
      );
    }

    return await prisma.userChat.update({
      where: {
        userId_chatId: {
          userId: req.user.id,
          chatId,
        },
      },
      data: {
        notifications: !chat.members[0].notifications,
      },
    });
  }

  async getCustomChatLink(req: AuthorizedRequest) {
    const chatId = Number(req.params.chatId);
    const requesterId = req.user.id;

    const requesterLink = await prisma.userChat.findUnique({
      where: {
        userId_chatId: {
          userId: requesterId,
          chatId,
        },
      },
      include: { chat: true },
    });

    if (!requesterLink) {
      throw HttpException.Forbidden(
        ErrorCodes.Forbidden,
        'You are not member of this chat',
      );
    }

    return requesterLink.chat.joinlink;
  }

  async joinByChatLink(req: AuthorizedRequest) {
    const joinlink = req.params.joinlink;
    const requesterId = req.user.id;
    const chat = await prisma.chat.findFirst({
      where: {
        joinlink: joinlink,
      },
      include: {
        members: {
          where: {
            AND: [{ userId: req.user.id }, { chat: { joinlink } }],
          },
        },
      },
    });

    if (!chat) {
      throw HttpException.BadRequest(
        ErrorCodes.NotFound,
        `No chat found with this joinlink: ${joinlink}`,
      );
    }
    console.log(chat.members);
    if (chat.members.length) {
      throw HttpException.Forbidden(
        ErrorCodes.Forbidden,
        'You are already member of this chat',
      );
    }

    await mesiboService.AddUserToGroup(chat.mesiboId, `${requesterId}`);

    return {
      invited: requesterId,
      chat: chat.mesiboId,
    };
  }

  async inviteUsersToChat(req: AuthorizedRequest) {
    const mesiboChatId = Number(req.params.chatId);
    const inviterUserId = req.user.id;
    const userIds: number[] = req.body.userIds;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw HttpException.BadRequest(
        ErrorCodes.Validation,
        'Body must contain non-empty array userIds',
      );
    }

    const chat = await prisma.chat.findUnique({
      where: { mesiboId: mesiboChatId },
    });
    if (!chat) {
      throw HttpException.BadRequest(
        ErrorCodes.NotFound,
        `No chat found with this id: ${mesiboChatId}`,
      );
    }

    const inviterLink = await prisma.userChat.findUnique({
      where: {
        userId_chatId: {
          userId: inviterUserId,
          chatId: mesiboChatId,
        },
      },
    });
    if (!inviterLink) {
      throw HttpException.Forbidden(
        ErrorCodes.Forbidden,
        'You are not member of this chat',
      );
    }

    const invited: number[] = [];
    for (const targetUserId of userIds) {
      const exists = await prisma.userChat.findUnique({
        where: {
          userId_chatId: {
            userId: targetUserId,
            chatId: mesiboChatId,
          },
        },
      });
      if (exists) {
        continue;
      }

      try {
        await mesiboService.AddUserToGroup(mesiboChatId, `${targetUserId}`);
        invited.push(targetUserId);
      } catch (err) {
        console.error(
          `Failed to add user ${targetUserId} to Mesibo group ${mesiboChatId}:`,
          err,
        );
        throw HttpException.BadRequest(
          ErrorCodes.Internal,
          `Failed to add user ${targetUserId} to Mesibo group ${mesiboChatId}`,
        );
      }
    }

    return {
      invited,
      chat: mesiboChatId,
    };
  }

  async toggleAdminStatus(req: AuthorizedRequest) {
    const mesiboChatId = Number(req.params.chatId);
    const targetUserId = Number(req.params.userId);
    const requesterId = req.user.id;

    const chat = await prisma.chat.findUnique({
      where: { mesiboId: mesiboChatId },
    });
    if (!chat) {
      throw HttpException.BadRequest(
        ErrorCodes.NotFound,
        `No chat found with id ${mesiboChatId}`,
      );
    }

    const requesterLink = await prisma.userChat.findUnique({
      where: {
        userId_chatId: {
          userId: requesterId,
          chatId: mesiboChatId,
        },
      },
    });
    if (!requesterLink) {
      throw HttpException.Forbidden(
        ErrorCodes.Forbidden,
        'You are not a member of this chat',
      );
    }
    if (!requesterLink.isAdmin) {
      throw HttpException.Forbidden(
        ErrorCodes.Forbidden,
        'Only an admin can change member permissions',
      );
    }

    const existingLink = await prisma.userChat.findUnique({
      where: {
        userId_chatId: {
          userId: targetUserId,
          chatId: mesiboChatId,
        },
      },
    });
    if (!existingLink) {
      throw HttpException.BadRequest(
        ErrorCodes.Conflict,
        `User ${targetUserId} is not a member of chat ${mesiboChatId}`,
      );
    }

    const newAdminStatus = !existingLink.isAdmin;
    try {
      await prisma.userChat.update({
        where: {
          userId_chatId: {
            userId: targetUserId,
            chatId: mesiboChatId,
          },
        },
        data: {
          isAdmin: newAdminStatus,
        },
      });
    } catch (err) {
      console.error(
        `Failed to ${newAdminStatus ? 'promote' : 'demote'} user ${targetUserId} ` +
          `in chat ${mesiboChatId}:`,
        err,
      );
      throw HttpException.BadRequest(
        ErrorCodes.Internal,
        `Could not ${newAdminStatus ? 'promote' : 'demote'} user ${targetUserId}`,
      );
    }

    return {
      userId: targetUserId,
      chatId: mesiboChatId,
      isAdmin: newAdminStatus,
    };
  }

  async kickUserFromChat(req: AuthorizedRequest) {
    const mesiboChatId = Number(req.params.chatId);
    const targetUserId = Number(req.params.userId);
    const requesterId = req.user.id;

    const requesterLink = await prisma.userChat.findUnique({
      where: {
        userId_chatId: {
          userId: requesterId,
          chatId: mesiboChatId,
        },
      },
    });

    if (!requesterLink) {
      throw HttpException.Forbidden(
        ErrorCodes.Forbidden,
        'You are not member of this chat',
      );
    }

    if (!requesterLink.isAdmin) {
      throw HttpException.Forbidden(
        ErrorCodes.Forbidden,
        'Only admin can delete users from chat',
      );
    }

    const targetLink = await prisma.userChat.findUnique({
      where: {
        userId_chatId: {
          userId: targetUserId,
          chatId: mesiboChatId,
        },
      },
    });

    if (!targetLink) {
      throw HttpException.BadRequest(
        ErrorCodes.NotFound,
        `User ${targetUserId} isnt part of the chat`,
      );
    }

    if (targetLink.isOwner) {
      throw HttpException.BadRequest(
        ErrorCodes.NotFound,
        `User ${targetUserId} is owner and can't be kicked`,
      );
    }

    try {
      await mesiboService.deleteUserFromGroup(
        mesiboChatId,
        String(targetUserId),
      );
    } catch (err) {
      console.warn(
        `Не удалось убрать пользователя ${targetUserId} из Mesibo-группы ${mesiboChatId}`,
        err,
      );
    }

    return { removedUserId: targetUserId };
  }

  async leaveChat(req: AuthorizedRequest) {
    const chatId = Number(req.params.chatId);
    const chat = await prisma.chat.findUnique({
      where: {
        mesiboId: chatId,
      },
      include: {
        members: {
          where: {
            userId: req.user.id,
            chatId: chatId,
          },
        },
      },
    });

    if (!chat) {
      throw HttpException.BadRequest(
        ErrorCodes.NotFound,
        `No chat found with this id: ${chatId}`,
      );
    }

    if (!chat.members) {
      throw HttpException.Forbidden(
        ErrorCodes.Forbidden,
        'You are not member of this chat',
      );
    }

    await mesiboService.deleteUserFromGroup(chatId, `${req.user.id}`);
    return { removedUserId: req.user.id };
  }

  async deleteChat(req: AuthorizedRequest) {
    const chatId = Number(req.params.chatId);
    const requesterId = req.user.id;

    const requesterLink = await prisma.userChat.findUnique({
      where: {
        userId_chatId: {
          userId: requesterId,
          chatId,
        },
      },
    });

    if (!requesterLink) {
      throw HttpException.Forbidden(
        ErrorCodes.Forbidden,
        'You are not member of this chat',
      );
    }

    if (!requesterLink.isAdmin) {
      throw HttpException.Forbidden(
        ErrorCodes.Forbidden,
        'Only admin can delete chat',
      );
    }
    await prisma.chat.delete({ where: { mesiboId: chatId } });
    return await mesiboService.deleteChat(chatId);
  }

  async getUsersInParking(closestParkingChatId: number) {
    return await prisma.user.findMany({
      where: {
        closestParkingChatId,
      },
      include: {
        company: {
          include: {
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
        role: true,
      },
      omit: {
        roleId: true,
        emailVerificationKey: true,
        passwordHash: true,
        createdAt: true,
        updatedAt: true,
        emailVerifiedAt: true,
      },
    });
  }
}

export const chatService = new ChatService();
