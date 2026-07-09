import { Inject, Injectable } from "@nestjs/common";
import type { Assessment } from "@zelo/domain";
import type { AssessmentRepository } from "../../application/ports/assessment-repository.port.ts";
import { PrismaService } from "../../../../shared/prisma/prisma.service.ts";

@Injectable()
export class PrismaAssessmentRepository implements AssessmentRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async save(assessment: Assessment): Promise<void> {
    await this.prisma.assessment.create({
      data: {
        id: assessment.id,
        scaleType: assessment.scaleType,
        capturedAt: new Date(assessment.capturedAt),
        ciphertext: assessment.ciphertext,
      },
    });
  }
}
