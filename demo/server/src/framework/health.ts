import { Controller, Get } from '@nestjs/common';
import { RequiredRoles, Role } from './role';
import { HealthCheck, HealthCheckService, HttpHealthIndicator, TypeOrmHealthIndicator } from '@nestjs/terminus';

@Controller('rest/v1/health')
export class HealthRest {
	constructor(
		private health: HealthCheckService,
		private db: TypeOrmHealthIndicator,
		private http: HttpHealthIndicator,
	) {}

	@RequiredRoles(Role.None)
	@Get()
	@HealthCheck()
	check() {
		const indicators = [() => this.db.pingCheck('database')];
		if (process.env.NODE_ENV === 'production') {
			//indicators.push(() => this.http.pingCheck('github', 'https://github.com'));
			//indicators.push(() => this.http.pingCheck('openai', 'https://api.openai.com'));
		}
		return this.health.check(indicators);
	}
}
