import { Module } from "@nestjs/common";
import { PrismaModule } from "./shared/prisma/prisma.module.ts";

@Module({
  imports: [PrismaModule],
})
export class AppModule {}
