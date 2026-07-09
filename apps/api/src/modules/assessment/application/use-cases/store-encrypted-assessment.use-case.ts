import { Inject, Injectable } from "@nestjs/common";
import type { Assessment } from "@zelo/domain";
import { ASSESSMENT_REPOSITORY, type AssessmentRepository } from "../ports/assessment-repository.port.ts";

@Injectable()
export class StoreEncryptedAssessmentUseCase {
  constructor(@Inject(ASSESSMENT_REPOSITORY) private readonly repository: AssessmentRepository) {}

  async execute(assessment: Assessment): Promise<void> {
    await this.repository.save(assessment);
  }
}
