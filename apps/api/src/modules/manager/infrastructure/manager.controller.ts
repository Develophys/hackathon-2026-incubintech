import { BadRequestException, Body, Controller, Get, HttpCode, Inject, Post, UnauthorizedException, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { LoginManagerUseCase, InvalidManagerCodeError } from "../application/use-cases/login-manager.use-case.ts";
import { GetManagerSignalsUseCase, type ManagerSignalsResponse } from "../application/use-cases/get-manager-signals.use-case.ts";
import type { IssuedManagerToken } from "../application/services/manager-token.service.ts";
import { ManagerAuthGuard } from "./manager-auth.guard.ts";

const LoginRequestSchema = z.object({ code: z.string().min(1) });

@Controller("manager")
export class ManagerController {
  constructor(
    @Inject(LoginManagerUseCase) private readonly loginManager: LoginManagerUseCase,
    @Inject(GetManagerSignalsUseCase) private readonly getManagerSignals: GetManagerSignalsUseCase,
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
}
