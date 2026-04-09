import { FastifyInstance } from "fastify"
import { StatusCodes } from "http-status-codes"
import { PrescriptionsService } from "./prescriptions.service"
import {AuthService} from "../auth";
import {getRequestLanguage, parseDto} from "../../shared";
import {prescriptionsCreateDto, prescriptionsFindAllDto, prescriptionsGetOneDto, prescriptionsParamsDto} from "./dto";

export class PrescriptionsController {

  constructor(
    private readonly prescriptionsService: PrescriptionsService,
    private readonly authService: AuthService
  ) {}

  registerRoutes(app: FastifyInstance): void {
    app.get("/prescriptions/find-all", async (request, reply) => {
      const currentUser = await this.authService.authenticateRequest(request)
      const query = parseDto(prescriptionsFindAllDto, request.query)
      const prescriptions = await this.prescriptionsService.findAll(query, getRequestLanguage(request), currentUser)

      return reply.status(StatusCodes.OK).send(prescriptions)
    })

    app.get("/prescriptions/get-one/:id", async (request, reply) => {
      const currentUser = await this.authService.authenticateRequest(request)
      const params = parseDto(prescriptionsGetOneDto, request.params)
      const prescription = await this.prescriptionsService.getOne(params.id, getRequestLanguage(request), currentUser)

      return reply.status(StatusCodes.OK).send({
        data: prescription
      })
    })

    app.post("/appointments/:id/prescription", async (request, reply) => {
      const currentUser = await this.authService.authenticateRequest(request)
      const params = parseDto(prescriptionsParamsDto, request.params)
      const body = parseDto(prescriptionsCreateDto, request.body)
      const prescription = await this.prescriptionsService.createPrescription(
        params.id,
        body,
        getRequestLanguage(request),
        currentUser
      )

      return reply.status(StatusCodes.CREATED).send({
        data: prescription
      })
    })
  }
}
