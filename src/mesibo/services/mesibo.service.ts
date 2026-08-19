import { prisma } from '@database';
import { HttpException } from '@common/exceptions';
import { ErrorCodes } from '@common/enums';
import { Company, User } from '@prisma/client';
import axios from 'axios';
import { Feature } from '@mapbox/types';
import { ChatType } from '@mesibo/enums';
import { Request } from 'express';
import { AuthorizedRequest } from '@auth/types';
import {
  MesiboGroupGetMembersResponse,
  MesiboTokenV2Config,
} from '@mesibo/types';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const emojiStrip = require('emoji-strip');

class MesiboService {
  private getTokenConfig(deviceType?: string): MesiboTokenV2Config {
    let android = true;
    let ios = false;

    if (deviceType === 'ios') {
      android = false;
      ios = true;
    } else if (deviceType === 'android') {
      android = true;
      ios = false;
    }
    // else: unknown or undefined - both enabled (fallback)

    return {
      v2: true,
      android,
      ios,
      appid: process.env.APP_ID,
      expiry: 525600, // 1 year in minutes
      autorefresh: 30, // 30 minutes
    };
  }

  async registerUserOnMesibo(user: User, req?: Request) {
    const deviceType = req?.headers['x-device-type'] as string | undefined;

    const data = await this.request({
      op: 'useradd',
      token: process.env.MESIBO_TOKEN,
      user: {
        address: user.id,
        name: user.username,
        permissions: { retention: true },
        token: this.getTokenConfig(deviceType),
      },
    });
    return await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        mesiboId: data.user.uid,
      },
      select: {
        id: true,
      },
    });
  }

  removeEmojis(text: string) {
    return emojiStrip(text).trim();
  }

  async createChatForPoint(feature: Feature): Promise<number> {
    const data = await this.request({
      op: 'groupadd',
      token: process.env.MESIBO_TOKEN,
      group: {
        name:
          this.removeEmojis(feature.properties.name) ||
          `Parking on ${this.removeEmojis(feature.properties.address)}`,
        permissions: {
          send: 0,
          recv: 0,
          pub: 0,
          sub: 0,
          list: 0,
        },
        profile: {
          name:
            this.removeEmojis(feature.properties.name) ||
            `Parking on ${this.removeEmojis(feature.properties.address)}`,
          status: 'Parking chat status',
          info: 'Parking chat info',
          other: 'Parking chat other',
        },
      },
    });
    if (data.group.gid) {
      const existingChat = await prisma.chat.findUnique({
        where: { mesiboId: data.group.gid },
      });
      if (!existingChat) {
        await prisma.chat.create({
          data: {
            mesiboId: data.group.gid,
            name:
              this.removeEmojis(feature.properties.name) ||
              `Parking on ${this.removeEmojis(feature.properties.address)}`,
            typeId: ChatType.Point,
          },
        });
      } else {
        await prisma.chat.update({
          where: { mesiboId: data.group.gid },
          data: {
            name:
              this.removeEmojis(feature.properties.name) ||
              `Parking on ${this.removeEmojis(feature.properties.address)}`,
            typeId: ChatType.Point,
          },
        });
      }

      await prisma.point.updateMany({
        where: {
          origId: `${feature.properties.id}`,
        },
        data: {
          chatid: data.group.gid,
        },
      });

      return data.group.gid;
    } else {
      console.log('Could not create a point chat: \n', feature, '\n', data);
    }
  }

  async createChatForCompany(company: Company): Promise<number> {
    if (company.chatId) {
      return;
    }
    const potentialUsers = await prisma.user.findMany({
      where: {
        companyId: company.id,
      },
      select: { id: true },
    });
    const data = await this.request({
      op: 'groupadd',
      token: process.env.MESIBO_TOKEN,
      group: {
        name: company.label,
        permissions: {
          send: 0,
          recv: 0,
          pub: 0,
          sub: 0,
          list: 0,
        },
        members: {
          m: potentialUsers ? potentialUsers.map((u) => u.id).join(',') : '',
          permissions: {
            send: true,
            recv: true,
            pub: true,
            sub: true,
            list: true,
          },
        },
        profile: {
          name: company.label,
          status: 'Company chat status',
          info: 'Company chat info',
          other: 'Company chat other',
        },
      },
    });
    if (data.group.gid) {
      const existingChat = await prisma.chat.findUnique({
        where: { mesiboId: data.group.gid },
      });
      if (!existingChat) {
        await prisma.chat.create({
          data: {
            mesiboId: data.group.gid,
            name: company.label,
            typeId: ChatType.Company,
          },
        });
      } else {
        await prisma.chat.update({
          where: { mesiboId: data.group.gid },
          data: {
            name: company.label,
            typeId: ChatType.Company,
          },
        });
      }

      await prisma.company.update({
        where: {
          id: company.id,
        },
        data: {
          chatId: data.group.gid,
        },
      });
    } else {
      console.log('Could not create a company chat: \n', company, '\n', data);
    }
  }

  async createCustomChat(
    chatName: string,
    photoLink: string,
    startMembers: number[],
  ) {
    const uniqueMembers = [...new Set(startMembers)];
    const data = await this.request({
      op: 'groupadd',
      token: process.env.MESIBO_TOKEN,
      group: {
        name: chatName,
        permissions: {
          send: 0,
          recv: 0,
          pub: 0,
          sub: 0,
          list: 0,
        },
        members: {
          m: startMembers ? uniqueMembers.join(',') : '',
          permissions: {
            send: true,
            recv: true,
            pub: true,
            sub: true,
            list: true,
          },
        },
        profile: {
          name: chatName,
          image: photoLink,
          status: 'Custom chat status',
          info: 'Custom chat info',
          other: 'Custom chat other',
        },
      },
    });
    if (data.group.gid) {
      const existingChat = await prisma.chat.findUnique({
        where: { mesiboId: data.group.gid },
      });
      if (!existingChat) {
        await prisma.chat.create({
          data: {
            mesiboId: data.group.gid,
            name: chatName,
            photo: photoLink,
            typeId: ChatType.Private,
            ownerId: Number(uniqueMembers[0]) || undefined,
          },
        });
        for (let i = 0; i < uniqueMembers.length; i++) {
          try {
            await prisma.userChat.create({
              data: {
                userId: Number(uniqueMembers[i]),
                chatId: data.group.gid,
                isAdmin: i == 0,
                isOwner: i == 0,
              },
            });
          } catch (_error) {
            console.log(
              '\nCould not invite not existing user: ',
              uniqueMembers[i],
            );
          }
        }
      } else {
        await prisma.chat.update({
          where: { mesiboId: data.group.gid },
          data: {
            name: chatName,
            photo: photoLink,
            typeId: ChatType.Private,
          },
        });
      }

      return await prisma.chat.findUnique({
        where: { mesiboId: data.group.gid },
      });
    } else {
      console.log('Could not create a company chat: \n', chatName, '\n', data);
    }
  }

  async updateGroup(mesiboId: number, groupName: string, photoLink: string) {
    const data = await this.request({
      op: 'groupset',
      token: process.env.MESIBO_TOKEN,

      group: {
        gid: mesiboId,
        name: groupName,
        image: photoLink,
      },
    });
    return data;
  }

  async getNewToken(userId: number, req?: Request): Promise<string> {
    const deviceType = req?.headers['x-device-type'] as string | undefined;

    const data = await this.request({
      op: 'useradd',
      token: process.env.MESIBO_TOKEN,
      user: {
        address: userId,
        permissions: { retention: true },
        token: this.getTokenConfig(deviceType),
      },
    });

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        mesiboId: data.user.uid,
      },
      select: {
        id: true,
      },
    });
    console.log('Mesibo responce: ', data);
    console.log('Device type:', deviceType);
    return data.user.token;
  }

  async updateCompanyGroupMembers(companyId: number) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      return null;
    }
    const potentialUsers = await prisma.user.findMany({
      where: {
        companyId: company.id,
      },
      select: { id: true },
    });
    const data = await this.request({
      op: 'groupeditmembers',
      token: process.env.MESIBO_TOKEN,
      group: {
        gid: company.chatId,
        members: {
          m: potentialUsers ? potentialUsers.map((u) => u.id).join(',') : '',
          permissions: {
            send: true,
            recv: true,
            pub: true,
            sub: true,
            list: true,
          },
        },
      },
    });
    console.log(data);
    return data;
  }

  async deleteUserFromGroup(gid: number, member: string) {
    await this.prismaDeleteGroupMember(gid, member);
    const data = await this.request({
      op: 'groupeditmembers',
      token: process.env.MESIBO_TOKEN,
      group: {
        gid,
        members: {
          m: member,
          permissions: null,
        },
      },
    });
    return data;
  }

  async prismaDeleteGroupMember(gid: number, member: string) {
    try {
      await prisma.userChat.delete({
        where: {
          userId_chatId: {
            userId: Number(member),
            chatId: gid,
          },
        },
      });
    } catch (error) {
      console.error('Error while deleting user: ', error);
    }
  }

  async AddUserToGroup(gid: number, member: string) {
    await this.prismaAddGroupMember(gid, member);
    const data = await this.request({
      op: 'groupeditmembers',
      token: process.env.MESIBO_TOKEN,
      group: {
        gid,
        members: {
          m: member,
          permissions: {
            send: true,
            recv: true,
            pub: true,
            sub: true,
            list: true,
          },
        },
      },
    });
    return data;
  }

  async prismaAddGroupMember(gid: number, member: string) {
    try {
      await prisma.userChat.upsert({
        where: { userId_chatId: { userId: Number(member), chatId: gid } },
        update: {},
        create: { userId: Number(member), chatId: gid },
      });
    } catch (error) {
      console.error('Error while adding user: ', error);
    }
  }

  async updatePointGroupMembers(gid: number, members: string) {
    const data = await this.request({
      op: 'groupeditmembers',
      token: process.env.MESIBO_TOKEN,
      group: {
        gid,
        members: {
          m: members,
          permissions: {
            send: true,
            recv: true,
            pub: true,
            sub: true,
            list: true,
          },
        },
      },
    });
    return data;
  }

  async updateUserProfile(user: User) {
    const data = await this.request({
      op: 'userset',
      token: process.env.MESIBO_TOKEN,
      user: {
        address: user.id,
        profile: {
          name: user.username,
          image: user.photo || '',
          info: user.description,
          update: true,
        },
      },
    });
    console.log(data);
    return data;
  }

  async request(body: any) {
    console.log('Mesibo Request:', JSON.stringify(body, null, 2));
    const data = await axios.post(process.env.MESIBO_URL, { body });

    if (data.data.result) {
      return data.data;
    }
    console.error('Mesibo Error Response:', JSON.stringify(data.data, null, 2));
    throw HttpException.BadRequest(
      ErrorCodes.Internal,
      `Could not complete mesibo operation: ${JSON.stringify(data.data, null, 2)}`,
    );
  }

  async saveMesiboFile(
    req: Request,
  ): Promise<{ result: boolean; url?: string; error?: string }> {
    try {
      const file = req.file;
      if (!file) {
        return { result: false, error: 'No file provided' };
      }

      const auth = req.body.auth;
      if (!auth || auth != process.env.MESIBO_BACKEND_SECRET) {
        return { result: false, error: 'Wrong or no secret' };
      }

      const fileUrl = `${process.env.CLIENT_URL}/static/mesibo/${encodeURIComponent(file.filename)}`;

      return { result: true, url: fileUrl };
    } catch (err: any) {
      console.error('File upload error:', err);
      return { result: false, error: err.message };
    }
  }

  async getChatUsers(gid: number): Promise<MesiboGroupGetMembersResponse> {
    const data = await this.request({
      op: 'groupgetmembers',
      token: process.env.MESIBO_TOKEN,
      count: 100000,
      group: {
        gid,
      },
    });
    return data;
  }

  getCombinedAddresses(data: any, newAddress: string): string {
    const existingAddresses = data.members.map((member: any) => member.address);

    if (!existingAddresses.includes(newAddress)) {
      existingAddresses.push(newAddress);
    }

    return existingAddresses.join(',');
  }

  // async addUserToChat(userId: number, mesiboChatId: number) {
  //   if (!(await prisma.user.findUnique({ where: { id: userId } }))) {
  //     throw HttpException.BadRequest(
  //       ErrorCodes.NotFound,
  //       `No such user with id ${userId}`,
  //     );
  //   }

  //   if (
  //     !(await prisma.chat.findUnique({ where: { mesiboId: mesiboChatId } }))
  //   ) {
  //     throw HttpException.BadRequest(
  //       ErrorCodes.NotFound,
  //       `No such chat with id ${mesiboChatId}`,
  //     );
  //   }
  //   const data = await this.getChatUsers(Number(mesiboChatId));
  //   const combinedAddr = this.getCombinedAddresses(data, `${userId}`);
  //   return await this.updatePointGroupMembers(mesiboChatId, combinedAddr);
  // }

  async getChatMessages(req: Request) {
    const response = await axios.get('http://localhost:3000/messages', {
      params: req.query,
    });

    const items = response.data?.items || [];

    const uniqueSrcIds = [
      ...new Set(items.map((msg: any) => Number(msg.src))),
    ] as number[];

    const users = await prisma.user.findMany({
      where: {
        mesiboId: { in: uniqueSrcIds },
      },
      select: {
        id: true,
        mesiboId: true,
        photo: true,
        username: true,
        name: true,
      },
    });

    const userMap = new Map(users.map((user) => [user.mesiboId, user]));

    const enrichedMessages = items.map((msg) => ({
      ...msg,
      user: userMap.get(msg.src) || null,
    }));

    return { ...response.data, items: enrichedMessages };
  }

  async getYourMesiboAccess(req: AuthorizedRequest) {
    return await this.getNewToken(req.user.id);
  }

  async deleteUserToken(mesiboId: number) {
    const data = await this.request({
      op: 'userset',
      token: process.env.MESIBO_TOKEN,
      user: {
        uid: mesiboId,
        token: {
          ...this.getTokenConfig(),
          remove: true,
        },
      },
    });
    return data;
  }

  async deleteChat(mesiboId: number) {
    const data = await this.request({
      op: 'groupdel',
      group: {
        gid: mesiboId,
      },
      token: process.env.MESIBO_TOKEN,
    });
    return data;
  }

  /**
   * Check message server health
   * For admin dashboard monitoring
   */
  async getMessageServerStatus() {
    try {
      const response = await axios.get('http://localhost:3000/health', {
        timeout: 5000,
      });
      return {
        connected: true,
        status: response.data,
      };
    } catch (error: any) {
      return {
        connected: false,
        error: error.message || 'Message server unavailable',
      };
    }
  }
}

export const mesiboService = new MesiboService();
