import { FastifyInstance } from "fastify"
import { StatusCodes } from "http-status-codes"
import { parseDto } from "../../shared/http/validation"
import { AuthService } from "./auth.service"
import { authLoginDto } from "./dto/auth.dto"

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  registerRoutes(app: FastifyInstance): void {
    app.post("/auth/login", async (request, reply) => {
      const body = parseDto(authLoginDto, request.body)
      const token = await this.authService.login(body)

      return reply.status(StatusCodes.OK).send({
        data: token
      })
    })

    app.get("/auth/me", async (request, reply) => {
      const user = await this.authService.authenticateRequest(request)

      return reply.status(StatusCodes.OK).send({
        data: user
      })
    })
  }
}
