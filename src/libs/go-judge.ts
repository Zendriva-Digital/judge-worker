import "dotenv/config";

export interface JudgeResult {
	status: string;
	time?: number;
	memory?: number;
	stdout?: string;
	stderr?: string;
	error?: string;
	fileIds?: Record<string, string>;
}

function isJudgeResult(data: unknown): data is JudgeResult {
	return (
		typeof data === "object" &&
		data !== null &&
		"status" in data &&
		typeof (data as any).status === "string"
	);
}

export async function runJudge(payload: any): Promise<JudgeResult> {
	const res = await fetch(`${process.env.GO_JUDGE_URL}/run`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Go Judge HTTP ${res.status}: ${text}`);
	}

	const data: unknown = await res.json();

	if (Array.isArray(data) && data.length > 0 && isJudgeResult(data[0])) {
		return data[0];
	}

	if (isJudgeResult(data)) {
		return data;
	}

	console.error("UNKNOWN GO JUDGE RESPONSE:", data);
	throw new Error("Unknown Go Judge response format");
}

export const executeJudge = runJudge;
