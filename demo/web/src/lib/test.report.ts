import { FileDiff } from './diff';
import { ModelUsageMetrics } from './openai';

export class TestReport {
	path: string;
	model_usage_metrics: ModelUsageMetrics;

	test_file_path: string;
	existing_test_code: string;
	original_code: string;
	test_code: string;
	amount_of_generated_test_cases: number;
	single_test_run_command: string;

	toDiff(): FileDiff {
		return new FileDiff(this.test_file_path, this.existing_test_code, this.test_code);
	}

	static with(obj: any): TestReport {
		if (!obj) return obj;
		Object.setPrototypeOf(obj, TestReport.prototype);
		ModelUsageMetrics.with(obj.model_usage_metrics);
		return obj;
	}

	static withMany(cmds: any[]): TestReport[] {
		if (!cmds) return cmds;
		return cmds.map(TestReport.with);
	}
}
