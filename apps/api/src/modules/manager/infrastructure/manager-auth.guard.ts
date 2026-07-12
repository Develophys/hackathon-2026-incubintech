import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { ManagerTokenService } from "../application/services/manager-token.service.ts";

@Injectable()
export class ManagerAuthGuard implements CanActivate {
  constructor(@Inject(ManagerTokenService) private readonly tokenService: ManagerTokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException();
    }

    const token = authHeader.slice("Bearer ".length);
    if (!this.tokenService.verify(token)) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
