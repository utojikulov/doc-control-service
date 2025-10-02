import { UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/modules/auth/guard/jwt.guard";

export const Auth = () => UseGuards(JwtAuthGuard)
