import { FileDiff } from './diff';
import { ModelUsageMetrics } from './openai';

export class CheckIssue {
	short_description: string;
	detailed_explaination: string;
	suggestion: string;
	issue_line_begin: number;
	issue_line_end: number;
	issue_reference_urls: string[];
	severity: string;
	severity_reason: string;

	static with(obj: any): CheckIssue {
		if (!obj) return obj;
		Object.setPrototypeOf(obj, CheckIssue.prototype);
		return obj;
	}

	static withMany(cmds: any[]): CheckIssue[] {
		if (!cmds) return cmds;
		return cmds.map(CheckIssue.with);
	}
}

export class CheckReport {
	has_issue: string;
	overall_severity: string;
	issues: CheckIssue[];
	original_code: string;
	fixed_code: string;
	path: string;
	model_usage_metrics: ModelUsageMetrics;

	toDiff(): FileDiff {
		return new FileDiff(this.path, this.original_code, this.fixed_code);
	}

	static with(obj: any): CheckReport {
		if (!obj) return obj;
		Object.setPrototypeOf(obj, CheckReport.prototype);
		obj.issues = CheckIssue.withMany(obj.issues);
		return obj;
	}

	static withMany(cmds: any[]): CheckReport[] {
		if (!cmds) return cmds;
		return cmds.map(CheckReport.with);
	}
}
