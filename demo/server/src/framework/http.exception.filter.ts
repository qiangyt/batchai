import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
	private readonly logger = new Logger(HttpExceptionFilter.name);

	catch(ex: any, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const req = ctx.getRequest();

		const status = ex instanceof HttpException ? ex.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

		let data: any = {
			statusCode: status,
			message: 'An unexpected error occurred',
		};

		if (ex instanceof HttpException) {
			const exceptionResponse = ex.getResponse();

			if (typeof exceptionResponse === 'string') {
				data.message = exceptionResponse;
			} else if (typeof exceptionResponse === 'object') {
				data = {
					...data,
					...exceptionResponse,
				};
			}
		} else {
			data.message = ex.message || data.message;
		}

		this.logger.error(
			`${req.method} ${req.url} ${status}: error=${data.error}, user=${JSON.stringify(req.user)}, body=${JSON.stringify(req.body)}, message=${data.message}`,
			ex.stack,
		);

		ctx.getResponse().status(status).json(data);
	}
}
