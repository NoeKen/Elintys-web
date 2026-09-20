import api from '@/shared/lib/api';

export type PublicReviewTargetType = 'event' | 'vendor' | 'venue';
export type ReviewTargetType = PublicReviewTargetType | 'organizer';
export type ReviewContextType = 'event' | 'vendor_request' | 'venue_booking';
export interface PublicReview { _id: string; rating: number; comment: string; author?: { fullName?: string }; verifiedAt: string; createdAt: string }
export interface ReviewFeed { data: PublicReview[]; total: number; page: number; limit: number; summary: { average: number; count: number } }
export type ReviewEligibility = { canReview: false; reason: string } | { canReview: true; targetType: ReviewTargetType; contextType: ReviewContextType; contextId: string };

export const reviewsService = {
  async list(targetType: PublicReviewTargetType, targetId: string, page = 1): Promise<ReviewFeed> {
    return (await api.get<ReviewFeed>(`/reviews/${targetType}/${targetId}`, { params: { page, limit: 10 } })).data;
  },
  async eligibility(targetType: ReviewTargetType, targetId: string): Promise<ReviewEligibility> {
    return (await api.get<ReviewEligibility>(`/reviews/eligibility/${targetType}/${targetId}`)).data;
  },
  async contextEligibility(contextType: ReviewContextType, contextId: string): Promise<ReviewEligibility> {
    return (await api.get<ReviewEligibility>(`/reviews/context/${contextType}/${contextId}/eligibility`)).data;
  },
  async create(input: { targetType: ReviewTargetType; contextType: ReviewContextType; contextId: string; rating: number; comment: string }) {
    return (await api.post('/reviews', input)).data;
  },
};
