import { BadRequestException, Body, Controller, HttpCode, Inject, Post } from "@nestjs/common";
import { AssessmentSchema } from "@zelo/domain";
import { StoreEncryptedAssessmentUseCase } from "../application/use-cases/store-encrypted-assessment.use-case.ts";

@Controller("assessments")
export class AssessmentController {
  constructor(@Inject(StoreEncryptedAssessmentUseCase) private readonly storeAssessment: StoreEncryptedAssessmentUseCase) {}

  @Post()
  @HttpCode(201)
  async create(@Body() body: unknown): Promise<{ id: string }> {
    const parsed = AssessmentSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    await this.storeAssessment.execute(parsed.data);
    return { id: parsed.data.id };
  }
}
