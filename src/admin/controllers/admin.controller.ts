import type { NextFunction, Response, Request } from 'express';
import type { AuthorizedRequest } from '@auth/types';
import { adminService } from '../services';
import { ReportStatus, ReportType } from '@database';
import { PaginateDto } from '@common/dto';
import { HttpCodes } from '@common/enums';

export const adminController = {
  // Authentication
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminService.login(req);
      res.status(HttpCodes.Ok).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async logout(req: AuthorizedRequest, res: Response, next: NextFunction) {
    try {
      await adminService.logout(req);
      res.status(HttpCodes.Ok).json({ success: true });
    } catch (error) {
      next(error);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminService.refresh(req);
      res.status(HttpCodes.Ok).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  // Dashboard Statistics
  async getDashboardStats(
    _req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await adminService.getDashboardStats();
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  // System Status
  async getSystemStatus(
    _req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await adminService.getSystemStatus();
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  // Dashboard Chart Data
  async getDashboardChartData(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { type } = req.query;
      const result = await adminService.getDashboardChartData(type as string);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  // Profile Management
  async grantPremium(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { userId } = req.params;
      const { tariffId } = req.body;
      const result = await adminService.grantPremium(
        parseInt(userId),
        tariffId ? parseInt(tariffId) : undefined,
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async revokePremium(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { userId } = req.params;
      const result = await adminService.revokePremium(parseInt(userId));
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async banUser(req: AuthorizedRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { reason, duration } = req.body;
      const result = await adminService.banUser(
        parseInt(userId),
        reason,
        duration,
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async unbanUser(req: AuthorizedRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const result = await adminService.unbanUser(parseInt(userId));
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async muteUser(req: AuthorizedRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { duration } = req.body;
      const result = await adminService.muteUser(parseInt(userId), duration);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async unmuteUser(req: AuthorizedRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const result = await adminService.unmuteUser(parseInt(userId));
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async grantAdmin(req: AuthorizedRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const result = await adminService.grantAdmin(parseInt(userId));
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async revokeAdmin(req: AuthorizedRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const result = await adminService.revokeAdmin(parseInt(userId));
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async editUserProfile(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { userId } = req.params;
      const profileData = req.body;
      const result = await adminService.editUserProfile(
        parseInt(userId),
        profileData,
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async deleteUserPhoto(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { userId } = req.params;
      const result = await adminService.deleteUserPhoto(parseInt(userId));
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  // Messenger Management
  async getGroupMessages(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { chatId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      const result = await adminService.getGroupMessages(
        parseInt(chatId),
        {
          page: parseInt(page as string),
          pageSize: parseInt(limit as string),
        }
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  // Q&A Management
  async deleteAnswer(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { answerId } = req.params;
      const result = await adminService.deleteAnswer(parseInt(answerId));
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async setBestAnswer(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { answerId } = req.params;
      const { questionId } = req.body;
      const result = await adminService.setBestAnswer(
        parseInt(answerId),
        parseInt(questionId),
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async unsetBestAnswer(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { answerId } = req.params;
      const { questionId } = req.body;
      const result = await adminService.unsetBestAnswer(parseInt(questionId));
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async setUselessAnswer(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { answerId } = req.params;
      const result = await adminService.setUselessAnswer(parseInt(answerId));
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async unsetUselessAnswer(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { answerId } = req.params;
      const result = await adminService.unsetUselessAnswer(parseInt(answerId));
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async deleteQuestion(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { questionId } = req.params;
      const result = await adminService.deleteQuestion(parseInt(questionId));
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  // Subscription Management
  async getUserSubscription(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { userId } = req.params;
      const result = await adminService.getUserSubscription(parseInt(userId));
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async checkUserPremium(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { userId } = req.params;
      const result = await adminService.isUserPremium(parseInt(userId));
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  // Tariff Management
  async getAllTariffs(
    _req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await adminService.getAllTariffs();
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async createTariff(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const tariffData = req.body;
      const result = await adminService.createTariff(tariffData);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async updateTariff(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { tariffId } = req.params;
      const tariffData = req.body;
      const result = await adminService.updateTariff(
        parseInt(tariffId),
        tariffData,
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async deactivateTariff(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { tariffId } = req.params;
      const result = await adminService.deactivateTariff(parseInt(tariffId));
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  // Report Management
  async getAllReports(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const {
        status,
        type,
        userId,
        reportedId,
        page = 1,
        pageSize = 20,
      } = req.query;

      const dto = {
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
        status: status as ReportStatus,
        type: type as ReportType,
        userId: userId ? parseInt(userId as string) : undefined,
        reportedId: reportedId ? parseInt(reportedId as string) : undefined,
      };

      const result = await adminService.getAllReports(dto);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getReportsForUser(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { userId } = req.params;
      const { page = 1, pageSize = 20 } = req.query;

      const dto = new PaginateDto({
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
      });

      const result = await adminService.getReportsForUser(
        parseInt(userId),
        dto,
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async updateReportStatus(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { reportId } = req.params;
      const { status, reason } = req.body;
      const adminId = req.user.id;

      const result = await adminService.updateReportStatus(
        parseInt(reportId),
        status as ReportStatus,
        adminId,
        reason,
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getReportById(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { reportId } = req.params;
      const result = await adminService.getReportById(parseInt(reportId));
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getReportsStats(
    _req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await adminService.getReportsStats();
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  // Company Management
  async getAllCompanies(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const dto = new PaginateDto({
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        pageSize: req.query.pageSize
          ? parseInt(req.query.pageSize as string)
          : 20,
      });
      const status = req.query.status as any;
      const result = await adminService.getAllCompanies(dto, status || undefined);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async approveCompany(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const companyId = parseInt(req.params.companyId);
      const result = await adminService.approveCompany(companyId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async rejectCompany(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const companyId = parseInt(req.params.companyId);
      const result = await adminService.rejectCompany(companyId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async deleteCompany(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { companyId } = req.params;
      const result = await adminService.deleteCompany(parseInt(companyId));
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  // ===================
  // Users Module Controllers
  // ===================
  async getAllUsers(req: AuthorizedRequest, res: Response, next: NextFunction) {
    try {
      const dto = new PaginateDto({
        page: +req.query.page as any,
        pageSize: +req.query.pageSize as any,
      });
      const filters = {
        search: req.query.search ? decodeURIComponent(req.query.search as string) : undefined,
        roleId: req.query.roleId,
        companyId: req.query.companyId,
        isBanned: req.query.isBanned,
        emailVerified: req.query.emailVerified,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
      };
      const result = await adminService.getAllUsers(dto, filters);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getUserById(req: AuthorizedRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const result = await adminService.getUserById(parseInt(userId));
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async deleteUser(req: AuthorizedRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const result = await adminService.deleteUser(parseInt(userId));
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  // ===================
  // Companies Module Controllers (Extensions)
  // ===================
  async getCompanyById(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { companyId } = req.params;
      const result = await adminService.getCompanyById(parseInt(companyId));
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async updateCompany(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { companyId } = req.params;
      const result = await adminService.updateCompany(
        parseInt(companyId),
        req.body,
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async addMemberToCompany(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { companyId } = req.params;
      const { userId } = req.body;
      const result = await adminService.addMemberToCompany(
        parseInt(companyId),
        parseInt(userId),
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async removeMemberFromCompany(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { userId } = req.params;
      const result = await adminService.removeMemberFromCompany(
        parseInt(userId),
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getCompanyChatMessages(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { chatId } = req.params;
      const result = await adminService.getCompanyChatMessages(
        parseInt(chatId),
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  // ===================
  // Points Module Controllers (NEW)
  // ===================
  async getAllPoints(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const dto = new PaginateDto({
        page: req.query.page as any,
        pageSize: req.query.pageSize as any,
      });
      const filters = {
        search: req.query.search ? decodeURIComponent(req.query.search as string) : undefined,
        verified: req.query.verified,
        type: req.query.type,
        country: req.query.country,
        minRating: req.query.minRating,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
      };
      const result = await adminService.getAllPoints(dto, filters);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getPointById(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { pointId } = req.params;
      const result = await adminService.getPointById(parseInt(pointId));
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async createPoint(req: AuthorizedRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.createPoint(req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async updatePoint(req: AuthorizedRequest, res: Response, next: NextFunction) {
    try {
      const { pointId } = req.params;
      const result = await adminService.updatePoint(
        parseInt(pointId),
        req.body,
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async deletePoint(req: AuthorizedRequest, res: Response, next: NextFunction) {
    try {
      const { pointId } = req.params;
      const result = await adminService.deletePoint(parseInt(pointId));
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async verifyPoint(req: AuthorizedRequest, res: Response, next: NextFunction) {
    try {
      const { pointId } = req.params;
      const { verified } = req.body;
      const result = await adminService.verifyPoint(
        parseInt(pointId),
        verified,
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getPointReviews(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { pointId } = req.params;
      const result = await adminService.getPointReviews(parseInt(pointId));
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async deletePointReview(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { reviewId } = req.params;
      const result = await adminService.deletePointReview(parseInt(reviewId));
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async recalculatePointRating(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { pointId } = req.params;
      const result = await adminService.recalculatePointRating(
        parseInt(pointId),
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getPointChatMessages(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { chatId } = req.params;
      const result = await adminService.getPointChatMessages(parseInt(chatId));
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  // ===================
  // Questions Module Controllers
  // ===================
  async getAllQuestions(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const dto = new PaginateDto({
        page: req.query.page as any,
        pageSize: req.query.pageSize as any,
      });
      const filters = {
        search: req.query.search ? decodeURIComponent(req.query.search as string) : undefined,
        sectionId: req.query.sectionId,
        subsectionId: req.query.subsectionId,
        resolved: req.query.resolved,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
      };
      const result = await adminService.getAllQuestions(dto, filters);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getQuestionById(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { questionId } = req.params;
      const result = await adminService.getQuestionById(parseInt(questionId));
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async updateQuestion(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { questionId } = req.params;
      const result = await adminService.updateQuestion(
        parseInt(questionId),
        req.body,
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async toggleResolveQuestion(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { questionId } = req.params;
      const result = await adminService.toggleResolveQuestion(
        parseInt(questionId),
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getQuestionAnswers(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { questionId } = req.params;
      const result = await adminService.getQuestionAnswers(
        parseInt(questionId),
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async updateAnswer(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { answerId } = req.params;
      const result = await adminService.updateAnswer(
        parseInt(answerId),
        req.body,
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  // Point Instruction Management
  async getAllPointInstructions(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const dto = new PaginateDto({
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        pageSize: req.query.pageSize
          ? parseInt(req.query.pageSize as string)
          : req.query.limit
            ? parseInt(req.query.limit as string)
            : 20,
      });
      const filters = {
        status: req.query.status as any,
        type: req.query.type as any,
        pointId: req.query.pointId
          ? parseInt(req.query.pointId as string)
          : undefined,
      };
      const result = await adminService.getAllPointInstructions(dto, filters);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getPointInstructionById(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const id = parseInt(req.params.id);
      const result = await adminService.getPointInstructionById(id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async createPointInstruction(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const result = await adminService.createPointInstruction({
        ...req.body,
        pointId: parseInt(req.body.pointId),
        creatorId: req.user?.id,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async updatePointInstruction(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const id = parseInt(req.params.id);
      const body = { ...req.body };
      if (body.pointId !== undefined) {
        body.pointId = parseInt(body.pointId);
      }
      const result = await adminService.updatePointInstruction(id, body);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async approvePointInstruction(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const id = parseInt(req.params.id);
      const result = await adminService.approvePointInstruction(id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async rejectPointInstruction(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const id = parseInt(req.params.id);
      const result = await adminService.rejectPointInstruction(id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async deletePointInstruction(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const id = parseInt(req.params.id);
      const result = await adminService.deletePointInstruction(id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
