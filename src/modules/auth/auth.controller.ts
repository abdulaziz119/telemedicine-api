import { FastifyInstance } from "fastify"
import { StatusCodes } from "http-status-codes"
import { AuthService } from "./auth.service"
import {authLoginDto} from "./dto";
import {parseDto} from "../../shared";

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
