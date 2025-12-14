import "dotenv/config";
import { redis } from "@/libs/redis";
import { runJudge } from "@/libs/go-judge";

const BACKEND_URL = process.env.BACKEND_URL!;
const INTERNAL_KEY = process.env.INTERNAL_API_KEY!;
console.log("[WORKER ENV]", {
	BACKEND_URL: process.env.BACKEND_URL,
	INTERNAL_API_KEY: process.env.INTERNAL_API_KEY,
});

const MAX_CONCURRENT = 2;
let running = 0;

type SubmissionForJudge = {
	submissionId: string;
	language: string;
	sourceCode: string;
	testcases: {
		input: string;
		output: string;
	}[];
};

async function fetchSubmission(id: string): Promise<SubmissionForJudge> {
	const res = await fetch(`${BACKEND_URL}/submissions/${id}/judge`, {
		headers: {
			"x-internal-key": INTERNAL_KEY,
		},
	});

	if (!res.ok) {
		throw new Error("Failed to fetch submission");
	}

	return (await res.json()) as SubmissionForJudge;
}

async function sendResult(result: {
	submissionId: string;
	status: string;
	timeMs: number;
	memoryKb: number;
}) {
	await fetch(`${BACKEND_URL}/judge/result`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"x-internal-key": INTERNAL_KEY,
		},
		body: JSON.stringify(result),
	});
}

async function processSubmission(id: string) {
	console.log("[WORKER] fetch submission:", id);
	const job = await fetchSubmission(id);
	console.log("[WORKER] fetched submission:", job.submissionId);
	console.log("[WORKER] compiling...");
	const compile = await runJudge({
		cmd: [
			{
				args: ["/usr/bin/g++", "main.cc", "-o", "main"],
				env: ["PATH=/usr/bin:/bin"],
				files: [
					{ content: "" },
					{ name: "stdout", max: 10240 },
					{ name: "stderr", max: 10240 },
				],
				timeout: 5000000000,
				cpuLimit: 500000000,
				memoryLimit: 120000000,
				procLimit: 256,
				copyIn: {
					"main.cc": { content: job.sourceCode },
				},
				copyOutCached: ["main"],
			},
		],
	});

	if (compile.status !== "Accepted" || !compile.fileIds) {
		console.log("[WORKER] compile failed");
		await sendResult({
			submissionId: id,
			status: "CE",
			timeMs: 0,
			memoryKb: 0,
		});
		return;
	}

	let finalStatus = "AC";
	let maxTime = 0;
	let maxMemory = 0;

	for (const tc of job.testcases) {
		console.log("[WORKER] running testcase");

		const result = await runJudge({
			
			cmd: [
				{
					args: ["main"],
					env: ["PATH=/usr/bin:/bin"],
					files: [
						{
							name: "stdin",
							content: tc.input,
						},
						{
							name: "stdout",
							max: 10240,
						},
						{
							name: "stderr",
							max: 10240,
						},
					],
					timeout: 5000000000,
					cpuLimit: 1000000000,
					memoryLimit: 104857600,
					procLimit: 50,
					copyIn: {
						main: { fileId: compile.fileIds["main"] },
					},
					copyOut: ["stdout", "stderr"],
				},
			],
		});
		
		console.log("[DEBUG FULL RESULT]", JSON.stringify(result, null, 2));
		console.log("[DEBUG] stdout:", JSON.stringify(result.files?.stdout));
		console.log("[DEBUG] expected:", JSON.stringify(tc.output));

		if (result.status === "Time Limit Exceeded") {
			finalStatus = "TLE";
			break;
		}
		if (result.status === "Memory Limit Exceeded") {
			finalStatus = "MLE";
			break;
		}
		if (result.status !== "Accepted") {
			finalStatus = "RE";
			break;
		}
		const stdout = result.files?.stdout ?? "";
		if (stdout.trim() !== tc.output.trim()) {
			finalStatus = "WA";
			break;
		}

		maxTime = Math.max(maxTime, result.time ?? 0);
		maxMemory = Math.max(maxMemory, result.memory ?? 0);
	}
	console.log("[WORKER] final status:", finalStatus);

	await sendResult({
		submissionId: id,
		status: finalStatus,
		timeMs: maxTime,
		memoryKb: maxMemory,
	});
}

async function start() {
	console.log("[Judge Worker] started");

	while (true) {
		if (running >= MAX_CONCURRENT) {
			await new Promise((r) => setTimeout(r, 50));
			continue;
		}

		const submissionId = await redis.lpop("judge:queue");
		console.log("[WORKER POP]", submissionId);
		if (!submissionId) {
			await new Promise((r) => setTimeout(r, 100));
			continue;
		}

		running++;
		processSubmission(submissionId)
			.catch(console.error)
			.finally(() => running--);
	}
}

start();
