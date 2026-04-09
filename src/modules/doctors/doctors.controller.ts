import { FastifyInstance } from "fastify"
import { StatusCodes } from "http-status-codes"
import { DoctorsService } from "./doctors.service"
import {AuthService} from "../auth";
import {doctorsFindAllDto, doctorsGetOneDto} from "./dto";
import {getRequestLanguage, parseDto} from "../../shared";

export class DoctorsController {

  constructor(
    private readonly doctorsService: DoctorsService,
    private readonly authService: AuthService
  ) {}

  registerRoutes(app: FastifyInstance): void {
    app.get("/doctors", async (request, reply) => {
      await this.authService.authenticateRequest(request)
      const query = parseDto(doctorsFindAllDto, request.query)
      const doctors = await this.doctorsService.findAll(query, getRequestLanguage(request))

      return reply.status(StatusCodes.OK).send(doctors)
    })

    app.get("/doctors/find-all", async (request, reply) => {
      await this.authService.authenticateRequest(request)
      const query = parseDto(doctorsFindAllDto, request.query)
      const doctors = await this.doctorsService.findAll(query, getRequestLanguage(request))

      return reply.status(StatusCodes.OK).send(doctors)
    })

    app.get("/doctors/get-one/:id", async (request, reply) => {
      await this.authService.authenticateRequest(request)
      const params = parseDto(doctorsGetOneDto, request.params)
      const doctor = await this.doctorsService.getOne(params.id, getRequestLanguage(request))

      return reply.status(StatusCodes.OK).send({
        data: doctor
      })
    })
  }
}
