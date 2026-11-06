// @ts-nocheck
/**
 * Placement-Guaranteed Career Course Affiliate Monetization & Commission Tracker
 * Statutory Entity: Orderkingpay | GSTIN: 18AFXPH9838M1Z9 (Assam - 788710)
 *
 * Directives:
 * 1. Placement-linked course catalog with unique affiliate tracking IDs (OK-AFF-*).
 * 2. Automated commission tracker crediting ₹2,500 (250,000 paise) to ₹7,500 (750,000 paise)
 *    per confirmed student enrollment into the platform revenue ledger (canonical-ledger.ts).
 * 3. Exact integer paise double-entry accounting with zero floating-point drift.
 */

import { canonicalLedger, type EdTechAffiliateCommissionResult } from '../finance/canonical-ledger.ts';
import { assertSafePaise } from '../revenue/tax-calculator.ts';
import * as crypto from 'crypto';

export interface EdTechCourse {
  courseId: string;
  title: string;
  partnerInstitute: string;
  placementGuaranteeLabel: string;
  courseFeePaise: number;
  affiliateCommissionPaise: number; // Statutory bound: ₹2,500 (250,000 paise) to ₹7,500 (750,000 paise)
  affiliateTrackingId: string;
  minPlacementCtcPaise: number;
  durationWeeks: number;
  curriculumTrack: 'FULL_STACK' | 'FINOPS_DATA_ANALYTICS' | 'CLOUD_DEVOPS_AI';
}

/**
 * Authentic Placement-Linked Career Cohorts
 */
export const PLACEMENT_CAREER_COURSES: EdTechCourse[] = [
  {
    courseId: 'ED-FS-101',
    title: 'Full-Stack Cloud & FinTech Engineering Bootcamp',
    partnerInstitute: 'KingPay Career Academy',
    placementGuaranteeLabel: '100% Job Placement Guarantee (Min ₹6.5 LPA CTC)',
    courseFeePaise: 3499900,
    affiliateCommissionPaise: 550000, // ₹5,500.00
    affiliateTrackingId: 'OK-AFF-FS101-PLCMT',
    minPlacementCtcPaise: 65000000, // ₹6.5 LPA CTC
    durationWeeks: 24,
    curriculumTrack: 'FULL_STACK',
  },
  {
    courseId: 'ED-DA-202',
    title: 'Applied Data Analytics & GST FinOps Certification',
    partnerInstitute: 'Assam Digital Skills Mission Partner',
    placementGuaranteeLabel: 'Guaranteed Placement or 100% Tuition Refund',
    courseFeePaise: 1999900,
    affiliateCommissionPaise: 325000, // ₹3,250.00
    affiliateTrackingId: 'OK-AFF-DA202-FINOPS',
    minPlacementCtcPaise: 48000000, // ₹4.8 LPA CTC
    durationWeeks: 16,
    curriculumTrack: 'FINOPS_DATA_ANALYTICS',
  },
  {
    courseId: 'ED-AI-303',
    title: 'Cloud Native AI & Systems Architecture Accelerator',
    partnerInstitute: 'National Tech Career Alliance',
    placementGuaranteeLabel: 'Guaranteed Placement (Min ₹10 LPA CTC)',
    courseFeePaise: 4999900,
    affiliateCommissionPaise: 750000, // ₹7,500.00 (Upper Bound)
    affiliateTrackingId: 'OK-AFF-AI303-EXEC',
    minPlacementCtcPaise: 100000000, // ₹10 LPA CTC
    durationWeeks: 20,
    curriculumTrack: 'CLOUD_DEVOPS_AI',
  },
  {
    courseId: 'ED-FOP-104',
    title: 'FinTech Core Banking Operations & T+1 Settlement Associate',
    partnerInstitute: 'Barak Valley BFSI Skill Council',
    placementGuaranteeLabel: 'Direct Placement in Regional FinTech & Banking Hubs',
    courseFeePaise: 1499900,
    affiliateCommissionPaise: 250000, // ₹2,500.00 (Lower Bound)
    affiliateTrackingId: 'OK-AFF-FOP104-BANKING',
    minPlacementCtcPaise: 36000000, // ₹3.6 LPA CTC
    durationWeeks: 12,
    curriculumTrack: 'FINOPS_DATA_ANALYTICS',
  },
];

export interface StudentAffiliateClickRecord {
  clickId: string;
  courseId: string;
  studentId: string;
  channel: string;
  trackingId: string;
  trackingUrl: string;
  createdAt: string;
}

export interface ConfirmedStudentEnrollment {
  enrollmentId: string;
  courseId: string;
  courseName: string;
  partnerInstitute: string;
  studentId: string;
  studentName?: string;
  courseFeePaise: number;
  commissionAmountPaise: number;
  retainedPlatformRevenuePaise: number;
  studentCashbackPaise: number;
  affiliateTrackingId: string;
  paymentRef: string;
  ledgerTransactionId: string;
  status: 'CONFIRMED' | 'SETTLED';
  enrolledAt: string;
}

export interface ConfirmEnrollmentParams {
  courseId: string;
  studentId: string;
  studentName?: string;
  paymentRef: string;
  affiliateTrackingId?: string;
  studentCashbackPaise?: number;
  idempotencyKey?: string;
}

export class EdTechCommissionTracker {
  private courses: Map<string, EdTechCourse> = new Map();
  private clicks: Map<string, StudentAffiliateClickRecord> = new Map();
  private enrollments: Map<string, ConfirmedStudentEnrollment> = new Map();

  constructor(courses: EdTechCourse[] = PLACEMENT_CAREER_COURSES) {
    for (const c of courses) {
      this.registerCourse(c);
    }
  }

  public registerCourse(course: EdTechCourse): void {
    assertSafePaise(course.courseFeePaise, `courseFee.${course.courseId}`);
    assertSafePaise(course.affiliateCommissionPaise, `commission.${course.courseId}`);

    if (course.affiliateCommissionPaise < 250_000 || course.affiliateCommissionPaise > 750_000) {
      throw new Error(
        `STATUTORY ERROR: Course ${course.courseId} commission must be between ₹2,500 (250,000 paise) and ₹7,500 (750,000 paise). Received: ${course.affiliateCommissionPaise} paise.`
      );
    }

    if (!course.affiliateTrackingId || !this.validateAffiliateTrackingId(course.affiliateTrackingId)) {
      throw new Error(
        `INVALID AFFILIATE ID: Course ${course.courseId} tracking ID '${course.affiliateTrackingId}' violates OrderKing convention.`
      );
    }

    this.courses.set(course.courseId, course);
  }

  public getCourse(courseId: string): EdTechCourse | undefined {
    return this.courses.get(courseId);
  }

  public getAllCourses(): EdTechCourse[] {
    return Array.from(this.courses.values());
  }

  public validateAffiliateTrackingId(trackingId: string): boolean {
    if (!trackingId || typeof trackingId !== 'string') return false;
    return /^OK-AFF-[A-Z0-9]+-[A-Z0-9]+$/i.test(trackingId.trim());
  }

  /**
   * Generates authentic affiliate click attribution record and tracking URL
   */
  public generateStudentAffiliateClick(params: {
    courseId: string;
    studentId: string;
    channel?: string;
    partnerRef?: string;
  }): {
    clickId: string;
    trackingUrl: string;
    trackingId: string;
    course: EdTechCourse;
    timestamp: string;
  } {
    const course = this.courses.get(params.courseId);
    if (!course) {
      throw new Error(`Course not found: ${params.courseId}`);
    }

    const clickId = `clk_${crypto.randomBytes(8).toString('hex')}`;
    const channel = params.channel || 'portal';
    const trackingId = course.affiliateTrackingId;
    const trackingUrl = `https://orderking.in/careers/edtech/enroll?course=${course.courseId}&affid=${trackingId}&sid=${params.studentId}&ch=${channel}&clk=${clickId}`;

    const record: StudentAffiliateClickRecord = {
      clickId,
      courseId: course.courseId,
      studentId: params.studentId,
      channel,
      trackingId,
      trackingUrl,
      createdAt: new Date().toISOString(),
    };

    this.clicks.set(clickId, record);

    return {
      clickId,
      trackingUrl,
      trackingId,
      course,
      timestamp: record.createdAt,
    };
  }

  /**
   * Confirms student enrollment and automatically books commission revenue into the canonical ledger.
   * Statutory constraint: Every confirmed enrollment credits ₹2,500 to ₹7,500 into platform revenue ledger.
   */
  public async confirmStudentEnrollment(
    params: ConfirmEnrollmentParams
  ): Promise<{
    enrollment: ConfirmedStudentEnrollment;
    ledgerReceipt: EdTechAffiliateCommissionResult;
  }> {
    const course = this.courses.get(params.courseId);
    if (!course) {
      throw new Error(`EdTech course not found: ${params.courseId}`);
    }

    const affiliateTrackingId = params.affiliateTrackingId || course.affiliateTrackingId;
    if (!this.validateAffiliateTrackingId(affiliateTrackingId)) {
      throw new Error(`Invalid affiliate tracking ID: ${affiliateTrackingId}`);
    }

    const commissionPaise = course.affiliateCommissionPaise;
    const studentCashbackPaise = params.studentCashbackPaise ? Math.floor(params.studentCashbackPaise) : 0;
    
    if (studentCashbackPaise < 0 || studentCashbackPaise > commissionPaise) {
      throw new Error(
        `Invalid student cashback: ${studentCashbackPaise} paise. Must be between 0 and ${commissionPaise} paise.`
      );
    }

    const enrollmentId = `ENR-${course.courseId}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const idempotencyKey = params.idempotencyKey || `idem-edtech-${enrollmentId}`;

    // Automatically book into double-entry canonical ledger
    const ledgerReceipt = await canonicalLedger.recordEdTechAffiliateCommission({
      enrollmentId,
      courseId: course.courseId,
      courseName: course.title,
      partnerInstitute: course.partnerInstitute,
      studentId: params.studentId,
      studentName: params.studentName,
      courseFeePaise: course.courseFeePaise,
      commissionAmountPaise: commissionPaise,
      studentCashbackPaise,
      affiliateTrackingId,
      idempotencyKey,
    });

    const retainedPlatformRevenuePaise = commissionPaise - studentCashbackPaise;

    const confirmedRecord: ConfirmedStudentEnrollment = {
      enrollmentId,
      courseId: course.courseId,
      courseName: course.title,
      partnerInstitute: course.partnerInstitute,
      studentId: params.studentId,
      studentName: params.studentName,
      courseFeePaise: course.courseFeePaise,
      commissionAmountPaise: commissionPaise,
      retainedPlatformRevenuePaise,
      studentCashbackPaise,
      affiliateTrackingId,
      paymentRef: params.paymentRef,
      ledgerTransactionId: ledgerReceipt.transaction.transactionId,
      status: 'CONFIRMED',
      enrolledAt: new Date().toISOString(),
    };

    this.enrollments.set(enrollmentId, confirmedRecord);

    return {
      enrollment: confirmedRecord,
      ledgerReceipt,
    };
  }

  public getEnrollmentAudit(enrollmentId: string): ConfirmedStudentEnrollment | undefined {
    return this.enrollments.get(enrollmentId);
  }

  public listPlatformEdTechRevenueSummary(): {
    totalEnrollments: number;
    totalGrossCommissionsPaise: number;
    totalRetainedRevenuePaise: number;
    totalStudentScholarshipsPaise: number;
    cohorts: Record<string, number>;
  } {
    let totalGrossCommissionsPaise = 0;
    let totalRetainedRevenuePaise = 0;
    let totalStudentScholarshipsPaise = 0;
    const cohorts: Record<string, number> = {};

    for (const enr of this.enrollments.values()) {
      totalGrossCommissionsPaise += enr.commissionAmountPaise;
      totalRetainedRevenuePaise += enr.retainedPlatformRevenuePaise;
      totalStudentScholarshipsPaise += enr.studentCashbackPaise;
      cohorts[enr.courseId] = (cohorts[enr.courseId] || 0) + 1;
    }

    return {
      totalEnrollments: this.enrollments.size,
      totalGrossCommissionsPaise,
      totalRetainedRevenuePaise,
      totalStudentScholarshipsPaise,
      cohorts,
    };
  }
}

export const edTechCommissionTracker = new EdTechCommissionTracker();
