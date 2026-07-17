import {
  BadGatewayException,
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Post,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { z } from "zod";
import { LoginManagerUseCase, InvalidManagerCodeError } from "../application/use-cases/login-manager.use-case.ts";
import { GetManagerSignalsUseCase, type ManagerSignalsResponse } from "../application/use-cases/get-manager-signals.use-case.ts";
import { GenerateManagerInsightUseCase } from "../application/use-cases/generate-manager-insight.use-case.ts";
import { GetManagerInsightHistoryUseCase } from "../application/use-cases/get-manager-insight-history.use-case.ts";
import { InsightGenerationFailedError, type ManagerInsightResponse } from "../application/ports/ai-insight.port.ts";
import type { StoredManagerInsight } from "../application/ports/manager-insight-repository.port.ts";
import type { IssuedManagerToken } from "../application/services/manager-token.service.ts";
import { ManagerAuthGuard } from "./manager-auth.guard.ts";

const LoginRequestSchema = z.object({ code: z.string().min(1) });

@Controller("manager")
export class ManagerController {
  constructor(
    @Inject(LoginManagerUseCase) private readonly loginManager: LoginManagerUseCase,
    @Inject(GetManagerSignalsUseCase) private readonly getManagerSignals: GetManagerSignalsUseCase,
    @Inject(GenerateManagerInsightUseCase) private readonly generateManagerInsight: GenerateManagerInsightUseCase,
    @Inject(GetManagerInsightHistoryUseCase) private readonly getManagerInsightHistory: GetManagerInsightHistoryUseCase,
  ) {}

  @Post("login")
  @HttpCode(200)
  login(@Body() body: unknown): IssuedManagerToken {
    const parsed = LoginRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    try {
      return this.loginManager.execute(parsed.data.code);
    } catch (error) {
      if (error instanceof InvalidManagerCodeError) {
        throw new UnauthorizedException();
      }
      throw error;
    }
  }

  @Get("signals")
  @UseGuards(ManagerAuthGuard)
  async signals(): Promise<ManagerSignalsResponse> {
    return this.getManagerSignals.execute();
  }

  @Post("insights")
  @HttpCode(200)
  @UseGuards(ManagerAuthGuard)
  async insights(): Promise<ManagerInsightResponse> {
    try {
      return await this.generateManagerInsight.execute();
    } catch (error) {
      if (error instanceof InsightGenerationFailedError) {
        throw new BadGatewayException();
      }
      throw error;
    }
  }

  @Get("insights/history")
  @UseGuards(ManagerAuthGuard)
  async insightsHistory(): Promise<StoredManagerInsight[]> {
    return this.getManagerInsightHistory.execute();
  }
}
