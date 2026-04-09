import { FastifyInstance } from "fastify"
import { StatusCodes } from "http-status-codes"
import { AuthService } from "../auth/auth.service"
import { parseDto } from "../../shared/http/validation"
import {
  appointmentsCompleteDto,
  appointmentsCreateDto,
  appointmentsFindAllDto,
  appointmentsParamsDto
} from "./dto/appointments.dto"
import { AppointmentsService } from "./appointments.service"

export class AppointmentsController {

  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly authService: AuthService
  ) {}

  registerRoutes(app: FastifyInstance): void {
    app.get("/appointments/find-all", async (request, reply) => {
      const currentUser = await this.authService.authenticateRequest(request)
      const query = parseDto(appointmentsFindAllDto, request.query)
      const appointments = await this.appointmentsService.findAll(query, currentUser)

      return reply.status(StatusCodes.OK).send(appointments)
    })

    app.get("/appointments/get-one/:id", async (request, reply) => {
      const currentUser = await this.authService.authenticateRequest(request)
      const params = parseDto(appointmentsParamsDto, request.params)
      const appointment = await this.appointmentsService.getOne(params.id, currentUser)

      return reply.status(StatusCodes.OK).send({
        data: appointment
      })
    })

    app.post("/appointments", async (request, reply) => {
      const currentUser = await this.authService.authenticateRequest(request)
      const body = parseDto(appointmentsCreateDto, request.body)
      const appointment = await this.appointmentsService.createAppointment(body, currentUser)

      return reply.status(StatusCodes.CREATED).send({
        data: appointment
      })
    })

    app.put("/appointments/:id/complete", async (request, reply) => {
      const currentUser = await this.authService.authenticateRequest(request)
      const params = parseDto(appointmentsParamsDto, request.params)
      const body = parseDto(appointmentsCompleteDto, request.body)
      const appointment = await this.appointmentsService.completeAppointment(params.id, body, currentUser)

      return reply.status(StatusCodes.OK).send({
        data: appointment
      })
    })
  }
}
