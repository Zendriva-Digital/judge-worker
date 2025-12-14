import "dotenv/config";
import { redis } from "@/libs/redis";
import { db } from "@/db";
import { submissions } from "@/db/schema/submissions";
import { runJudge } from "@/libs/go-judge";
import { JUDGE_LANGUAGES } from "@/constants/judge";
import { eq } from "drizzle-orm";

const MAX_CONCURRENT = 2;
let running = 0;

async function processSubmission(submissionId: string) {
    console.log('oke')

    const submission = await db.query.submissions.findFirst({
        where: eq(submissions.id, submissionId),
        with: { problem: true },
    });

    if (!submission || !submission.problem) return;

    if (submission.language !== "c") {
        await db.update(submissions).set({ status: "CE" }).where(eq(submissions.id, submissionId));
        return;
    }

    const cfg = JUDGE_LANGUAGES.c;
    const problem = submission.problem;

    await db.update(submissions).set({ status: "RUNNING" }).where(eq(submissions.id, submissionId));

    const compileResult = await runJudge({
        cmd: [
            {
                "args": ["/usr/bin/g++", "main.cc", "-o", "main"],
                "files": [{
                    "content": ""
                }, {
                    "name": "stdout",
                    "max": 10240
                }, {
                    "name": "stderr",
                    "max": 10240
                }],
                "timeout": 500000000000000000000000000000,
                "cpuLimit": 500000000,
                "memoryLimit": 120000000,
                "procLimit": 256,
                copyIn:{
                    "main.cc": {
                        content: submission.sourceCode
                    }
                },
                "copyOut": ["stdout", "stderr"],
                "copyOutCached": ["main.cc", "main"],
                env: ["PATH=/usr/bin:/bin"],
            },
        ]
    });

    console.log("[COMPILE]", {
        status: compileResult.status,
        stdout: compileResult.stdout,
        stderr: compileResult.stderr,
        fileIds: compileResult.fileIds,
    });

    if (compileResult.status !== "Accepted" || !compileResult.fileIds) {
        await db
            .update(submissions)
            .set({ status: "CE" })
            .where(eq(submissions.id, submissionId));

        return;
    }

    let finalStatus: "AC" | "WA" | "TLE" | "MLE" | "RE" = "AC";
    let maxTime = 0;
    let maxMemory = 0;

    for (const tc of problem.testcases) {
        const result = await runJudge({
            "cmd": [{
                "args": ["main"],
                "env": ["PATH=/usr/bin:/bin"],
                "files": [{
                    "content": `${tc.input}`
                }, {
                    "name": "stdout",
                    "max": 10240
                }, {
                    "name": "stderr",
                    "max": 10240
                }],
                timeout: 500000000000000000000000000000,
                "cpuLimit": 10000000000,
                "memoryLimit": 104857600,
                "procLimit": 50,
                "copyIn": {
                    "main": {
                        "fileId": `${compileResult.fileIds['main']}` // saved file id from previous request
                    }
                }
            }]
        });

        console.log("[RUN]", {
            status: result.status,
            stdout: result.stdout,
            stderr: result.stderr,
            time: result.time,
            memory: result.memory,
        });

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

        if ((result.stdout ?? "").trim() !== tc.output.trim()) {
            finalStatus = "WA";
            break;
        }

        maxTime = Math.max(maxTime, result.time ?? 0);
        maxMemory = Math.max(maxMemory, result.memory ?? 0);
    }

    await db
        .update(submissions)
        .set({
            status: finalStatus,
            timeMs: maxTime,
            memoryKb: maxMemory,
        })
        .where(eq(submissions.id, submissionId));
}

async function start() {
    console.log("[Judge Worker] started");

    while (true) {
        if (running >= MAX_CONCURRENT) {
            await new Promise((r) => setTimeout(r, 50));
            continue;
        }

        const submissionId = await redis.lpop("judge:queue");
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
