import type { ManagerAuthPort, ManagerLoginResult } from "@/ports/manager-auth.port";

export class LoginManagerUseCase {
  constructor(private readonly authPort: ManagerAuthPort) {}

  async execute(code: string): Promise<ManagerLoginResult> {
    return this.authPort.login(code);
  }
}
