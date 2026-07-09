import { Module } from "@nestjs/common";
import { AssessmentController } from "./infrastructure/assessment.controller.ts";
import { StoreEncryptedAssessmentUseCase } from "./application/use-cases/store-encrypted-assessment.use-case.ts";
import { PrismaAssessmentRepository } from "./infrastructure/persistence/prisma-assessment.repository.ts";
import { ASSESSMENT_REPOSITORY } from "./application/ports/assessment-repository.port.ts";

@Module({
  controllers: [AssessmentController],
  providers: [
    StoreEncryptedAssessmentUseCase,
    { provide: ASSESSMENT_REPOSITORY, useClass: PrismaAssessmentRepository },
  ],
})
export class AssessmentModule {}
