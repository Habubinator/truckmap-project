import { prisma } from '@database';
import { HttpException } from '@common/exceptions';
import { ErrorCodes } from '@common/enums';

class RatingService {
  async createReview(
    userId: number,
    pointId: number,
    rating: number,
    text?: string,
    imageUrls: string[] = [],
  ) {
    const review = await prisma.pointReview.create({
      data: {
        userId,
        pointId,
        rating,
        text,
        images: {
          create: imageUrls.map((url) => ({ imageUrl: url })),
        },
      },
      include: {
        images: true,
      },
    });

    return review;
  }

  async addImagesToReview(
    userId: number,
    reviewId: number,
    imageUrls: string[],
  ) {
    const review = await prisma.pointReview.findUnique({
      where: { id: reviewId },
    });
    if (!review) {
      throw HttpException.BadRequest(
        ErrorCodes.NotFound,
        `Not found review with id ${reviewId}`,
      );
    }
    if (userId != review.userId) {
      throw HttpException.Forbidden(ErrorCodes.Forbidden);
    }

    const images = await prisma.reviewImage.createManyAndReturn({
      data: imageUrls.map((url) => ({
        reviewId,
        imageUrl: url,
      })),
    });

    return images;
  }

  async replyToReviewOrComment(
    userId: number,
    reviewId: number,
    text: string,
    parentId?: number,
  ) {
    const review = await prisma.pointReview.findUnique({
      where: { id: reviewId },
    });
    if (!review) {
      throw HttpException.BadRequest(
        ErrorCodes.NotFound,
        `Not found review with id ${reviewId}`,
      );
    }
    const existing = await prisma.reviewReply.findUnique({
      where: { id: parentId },
    });
    if (!existing) {
      throw HttpException.BadRequest(
        ErrorCodes.NotFound,
        `Not found comment with id ${parentId}`,
      );
    }

    const reply = await prisma.reviewReply.create({
      data: {
        userId,
        reviewId,
        text,
        parentId,
      },
    });

    return reply;
  }

  async toggleLike(userId: number, reviewId: number) {
    const existingReview = await prisma.reviewReply.findUnique({
      where: { id: reviewId },
    });
    if (!existingReview) {
      throw HttpException.BadRequest(
        ErrorCodes.NotFound,
        `Not found comment with id ${reviewId}`,
      );
    }

    const existing = await prisma.reviewLike.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId,
        },
      },
    });

    if (existing) {
      await prisma.reviewLike.delete({
        where: {
          id: existing.id,
        },
      });
      return { liked: false };
    } else {
      await prisma.reviewLike.create({
        data: { reviewId, userId },
      });
      return { liked: true };
    }
  }

  async getRepliesTree(reviewId: number) {
    const flatReplies = await prisma.reviewReply.findMany({
      where: { reviewId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          omit: {
            roleId: true,
            emailVerificationKey: true,
            passwordHash: true,
          },
        },
      },
    });

    const map = new Map<number, any>();
    const roots: any[] = [];

    for (const reply of flatReplies) {
      map.set(reply.id, { ...reply, replies: [] });
    }

    for (const reply of flatReplies) {
      const node = map.get(reply.id);
      if (reply.parentId) {
        const parent = map.get(reply.parentId);
        if (parent) {
          parent.replies.push(node);
        }
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  async getPointReviewsWithReplies(pointId: number, currentUserId?: number) {
    const existing = await prisma.point.findUnique({
      where: { id: pointId },
    });
    if (!existing) {
      throw HttpException.BadRequest(
        ErrorCodes.NotFound,
        `Not found Point with id ${pointId}`,
      );
    }

    const reviews = await prisma.pointReview.findMany({
      where: { pointId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          omit: {
            roleId: true,
            emailVerificationKey: true,
            passwordHash: true,
          },
        },
        images: true,
        likes: true,
      },
    });

    const results = await Promise.all(
      reviews.map(async (review) => {
        const replies = await this.getRepliesTree(review.id);

        const liked = currentUserId
          ? review.likes.some((like) => like.userId === currentUserId)
          : undefined;

        return {
          ...review,
          likesCount: review.likes.length,
          liked,
          replies,
        };
      }),
    );

    return results;
  }
}

export const ratingService = new RatingService();
