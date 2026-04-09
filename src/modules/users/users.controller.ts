import { FastifyInstance } from "fastify"
import { StatusCodes } from "http-status-codes"
import { UsersService } from "./users.service"
import {AuthService} from "../auth";
import {getRequestLanguage, parseDto} from "../../shared";
import {usersFindAllDto, usersGetOneDto} from "./dto";

export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService
  ) { }

  registerRoutes(app: FastifyInstance): void {
    app.get("/users/find-all", async (request, reply) => {
      const currentUser = await this.authService.authenticateRequest(request)
      const query = parseDto(usersFindAllDto, request.query)
      const users = await this.usersService.findAll(query, getRequestLanguage(request), currentUser)

      return reply.status(StatusCodes.OK).send(users)
    })

    app.get("/users/get-one/:id", async (request, reply) => {
      const currentUser = await this.authService.authenticateRequest(request)
      const params = parseDto(usersGetOneDto, request.params)
      const user = await this.usersService.getOne(params.id, getRequestLanguage(request), currentUser)

      return reply.status(StatusCodes.OK).send({
        data: user
      })
    })
  }
}
