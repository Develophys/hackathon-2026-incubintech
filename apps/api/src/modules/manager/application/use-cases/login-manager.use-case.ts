import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ManagerTokenService, type IssuedManagerToken } from "../services/manager-token.service.ts";
import { timingSafeStringEqual } from "../services/timing-safe-equal.ts";

export class InvalidManagerCodeError extends Error {}

@Injectable()
export class LoginManagerUseCase {
  constructor(
    @Inject(ConfigService) private readonly config: ConfigService,
    @Inject(ManagerTokenService) private readonly tokenService: ManagerTokenService,
  ) {}

  execute(code: string): IssuedManagerToken {
    const expectedCode = this.config.getOrThrow<string>("MANAGER_ACCESS_CODE");
    if (!timingSafeStringEqual(code, expectedCode)) {
      throw new InvalidManagerCodeError();
    }
    return this.tokenService.issue();
  }
}
