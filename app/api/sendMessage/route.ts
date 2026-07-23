import { randomUUID } from "crypto";

import { getMongoDatabase } from "@/lib/mongodb";

const RESUME_CONTEXT = `
이름: 민경건
출생연도/성별: 1997년생 남성
현재 회사: 이글루 코퍼레이션
현재 경력: 보안관제 업무 2년 이상 재직 중
희망/관심 직무: 클라우드 보안 엔지니어, DevSecOps

핵심 소개:
민경건은 이글루 코퍼레이션에서 2년 이상 보안관제 업무를 수행하며
위협 탐지, 분석, 대응 관점의 실무 경험을 쌓았습니다.
현재는 기존 보안관제 경험을 바탕으로 클라우드 보안 엔지니어로 성장하기 위해
AWS, WAF, GuardDuty, Lambda 자동화 실습을 진행하고 있습니다.

학습 및 실습:
- AWS 기반 클라우드 보안 학습
- WAF를 활용한 웹 공격 방어 실습
- GuardDuty를 활용한 위협 탐지 실습
- Lambda를 활용한 보안 자동화 대응 실습
- 클라우드 보안과 DevSecOps 역량 강화
- 위협탐지 및 자동대응 SOAR 아키텍처 과제 수행

답변 규칙:
- 사용자의 이력서 기반 AI 아바타처럼 1인칭으로 답변합니다.
- 이력서에 없는 경력이나 자격증은 지어내지 않습니다.
- 모르는 내용은 솔직하게 말하고, 대신 준비 중인 방향을 설명합니다.
- 한국어로 자연스럽고 간결하게 답변합니다.
`;

type GeminiResponse = {
  output_text?: string;
  steps?: {
    type?: string;
    content?: {
      type?: string;
      text?: string;
    }[];
  }[];
  error?: {
    message?: string;
  };
};

type ChatLog =
  | {
      sessionId: string;
      userMessage: string;
      assistantMessage: string;
      status: "success";
      responseTimeMs: number;
      aiResponseTimeMs: number;
      mongoSaveTimeMs?: number;
      suggestedQuestions: string[];
      createdAt: Date;
    }
  | {
      sessionId: string;
      userMessage: string;
      status: "error";
      errorType: string;
      errorMessage: string;
      responseTimeMs: number;
      aiResponseTimeMs?: number;
      mongoSaveTimeMs?: number;
      createdAt: Date;
    };

async function saveChatLog(chatLog: ChatLog) {
  const mongoStartedAt = Date.now();

  try {
    const db = await getMongoDatabase();
    const collection = db.collection("chat_logs");
    const result = await collection.insertOne({
      ...chatLog,
      mongoSaveTimeMs: 0,
    });
    const mongoSaveTimeMs = Date.now() - mongoStartedAt;

    await collection.updateOne(
      { _id: result.insertedId },
      { $set: { mongoSaveTimeMs } },
    );

    return { saved: true, mongoSaveTimeMs };
  } catch (error) {
    const mongoSaveTimeMs = Date.now() - mongoStartedAt;

    console.error("채팅 로그 MongoDB 저장 실패:", error);

    return {
      saved: false,
      mongoSaveTimeMs,
      error: error instanceof Error ? error.message : "알 수 없는 저장 오류",
    };
  }
}

function getSuggestedQuestions(reply: string) {
  const source = reply.toLowerCase();
  const suggestions: string[] = [];
  const topicRules = [
    {
      label: "SOAR 아키텍처",
      keywords: ["soar", "자동대응", "자동 대응", "플레이북"],
      questions: [
        "방금 말한 SOAR 흐름을 단계별로 더 설명해줘",
        "SOAR에서 자동화하면 좋은 대응은 뭐였나요?",
      ],
    },
    {
      label: "GuardDuty",
      keywords: ["guardduty", "탐지", "위협"],
      questions: [
        "GuardDuty 탐지 결과를 어떻게 판단했나요?",
        "탐지된 위협을 실제로 어떻게 대응했나요?",
      ],
    },
    {
      label: "Lambda",
      keywords: ["lambda", "람다", "자동화"],
      questions: [
        "Lambda 자동화 로직을 더 구체적으로 설명해줘",
        "Lambda가 실행된 뒤 어떤 조치가 이어지나요?",
      ],
    },
    {
      label: "WAF",
      keywords: ["waf", "웹 공격", "방어"],
      questions: [
        "WAF로 막을 수 있는 공격 예시를 들어줘",
        "WAF 룰을 어떻게 설계했다고 말하면 좋을까요?",
      ],
    },
    {
      label: "보안관제 경험",
      keywords: ["보안관제", "관제", "분석", "대응"],
      questions: [
        "보안관제 경험이 이 프로젝트에 어떻게 연결되나요?",
        "실무 관제 경험 중 어떤 부분이 강점인가요?",
      ],
    },
    {
      label: "DevSecOps",
      keywords: ["devsecops", "보안 내재화", "파이프라인"],
      questions: [
        "DevSecOps 관점에서 이 경험을 어떻게 설명할까요?",
        "앞으로 DevSecOps 역량은 어떻게 보완할 계획인가요?",
      ],
    },
    {
      label: "AWS 보안",
      keywords: ["aws", "클라우드", "cloudtrail", "eventbridge", "iam"],
      questions: [
        "AWS 보안 구성에서 가장 중요한 포인트는 뭐였나요?",
        "클라우드 보안 엔지니어 관점에서 배운 점은 무엇인가요?",
      ],
    },
  ]
    .map((rule) => ({
      ...rule,
      firstIndex: Math.min(
        ...rule.keywords
          .map((keyword) => source.indexOf(keyword))
          .filter((index) => index >= 0),
      ),
    }))
    .filter((rule) => Number.isFinite(rule.firstIndex))
    .sort((firstRule, secondRule) => firstRule.firstIndex - secondRule.firstIndex);

  function add(question: string) {
    if (!suggestions.includes(question)) {
      suggestions.push(question);
    }
  }

  topicRules.forEach((rule) => {
    rule.questions.forEach(add);
  });

  const mainTopic = topicRules[0]?.label ?? "방금 답변한 내용";

  if (source.includes("어려") || source.includes("한계")) {
    add(`${mainTopic}에서 어려웠던 점은 어떻게 해결했나요?`);
  }

  if (source.includes("준비") || source.includes("계획")) {
    add(`${mainTopic}을 더 발전시키려면 뭘 준비해야 하나요?`);
  }

  add(`${mainTopic}을 면접에서 말하기 좋게 정리해줘`);
  add(`${mainTopic}에서 제가 직접 한 역할은 무엇인가요?`);
  add(`${mainTopic}을 실제 사례처럼 더 자세히 말해줘`);

  return suggestions.slice(0, 3);
}

function getGeminiErrorMessage(message?: string) {
  if (!message) {
    return "Gemini API 요청 중 오류가 발생했습니다.";
  }

  if (message.toLowerCase().includes("quota")) {
    return "Gemini API 사용량 한도 문제로 응답을 받을 수 없습니다. Google AI Studio에서 quota 또는 결제 상태를 확인해 주세요.";
  }

  return message;
}

function getGeminiReply(data: GeminiResponse | null) {
  if (!data) {
    return "";
  }

  if (data.output_text) {
    return data.output_text;
  }

  return (
    data.steps
      ?.filter((step) => step.type === "model_output")
      .flatMap((step) => step.content ?? [])
      .filter((content) => content.type === "text")
      .map((content) => content.text)
      .filter(Boolean)
      .join("\n\n") ?? ""
  );
}

function getMessageFromBody(body: unknown) {
  if (!body || typeof body !== "object" || !("message" in body)) {
    return null;
  }

  const { message } = body as { message?: unknown };

  if (typeof message !== "string") {
    return null;
  }

  const trimmedMessage = message.trim();

  return trimmedMessage || null;
}

function getSessionIdFromBody(body: unknown) {
  if (!body || typeof body !== "object" || !("sessionId" in body)) {
    return randomUUID();
  }

  const { sessionId } = body as { sessionId?: unknown };

  return typeof sessionId === "string" && sessionId.trim()
    ? sessionId.trim()
    : randomUUID();
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";
  const body = await request.json().catch(() => null);
  const sessionId = getSessionIdFromBody(body);
  const message = getMessageFromBody(body);

  if (!message) {
    const logResult = await saveChatLog({
      sessionId,
      userMessage: "",
      status: "error",
      errorType: "validation_error",
      errorMessage: "message 값은 비어 있지 않은 문자열이어야 합니다.",
      responseTimeMs: Date.now() - startedAt,
      aiResponseTimeMs: 0,
      createdAt: new Date(),
    });

    return Response.json(
      {
        error: "message 값은 비어 있지 않은 문자열이어야 합니다.",
        logSaved: logResult.saved,
        logError: logResult.error,
      },
      { status: 400 },
    );
  }

  if (!apiKey) {
    const errorMessage =
      "GEMINI_API_KEY가 설정되어 있지 않습니다. .env.local에 GEMINI_API_KEY=발급받은키 를 추가해 주세요.";

    const logResult = await saveChatLog({
      sessionId,
      userMessage: message,
      status: "error",
      errorType: "missing_api_key",
      errorMessage,
      responseTimeMs: Date.now() - startedAt,
      aiResponseTimeMs: 0,
      createdAt: new Date(),
    });

    return Response.json(
      {
        error: errorMessage,
        logSaved: logResult.saved,
        logError: logResult.error,
      },
      { status: 500 },
    );
  }

  let geminiResponse: Response;
  const aiStartedAt = Date.now();
  let aiResponseTimeMs = 0;

  try {
    geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          model,
          system_instruction: RESUME_CONTEXT,
          input: message,
          generation_config: {
            temperature: 0.7,
            thinking_level: "low",
          },
        }),
      },
    );
    aiResponseTimeMs = Date.now() - aiStartedAt;
  } catch (error) {
    aiResponseTimeMs = Date.now() - aiStartedAt;
    const errorMessage =
      error instanceof Error ? error.message : "Gemini API 네트워크 오류";

    const logResult = await saveChatLog({
      sessionId,
      userMessage: message,
      status: "error",
      errorType: "network_error",
      errorMessage,
      responseTimeMs: Date.now() - startedAt,
      aiResponseTimeMs,
      createdAt: new Date(),
    });

    return Response.json(
      {
        error: "Gemini API 요청 중 네트워크 오류가 발생했습니다.",
        logSaved: logResult.saved,
        logError: logResult.error,
      },
      { status: 500 },
    );
  }

  const data = (await geminiResponse.json().catch(() => null)) as
    | GeminiResponse
    | null;

  if (!geminiResponse.ok) {
    const errorMessage = getGeminiErrorMessage(data?.error?.message);

    const logResult = await saveChatLog({
      sessionId,
      userMessage: message,
      status: "error",
      errorType: "gemini_error",
      errorMessage,
      responseTimeMs: Date.now() - startedAt,
      aiResponseTimeMs,
      createdAt: new Date(),
    });

    return Response.json(
      {
        error: errorMessage,
        logSaved: logResult.saved,
        logError: logResult.error,
      },
      { status: geminiResponse.status },
    );
  }

  const reply = getGeminiReply(data);
  const assistantMessage = reply || "응답 텍스트를 찾지 못했습니다.";
  const suggestedQuestions = getSuggestedQuestions(assistantMessage);

  const logResult = await saveChatLog({
    sessionId,
    userMessage: message,
    assistantMessage,
    status: "success",
    responseTimeMs: Date.now() - startedAt,
    aiResponseTimeMs,
    suggestedQuestions,
    createdAt: new Date(),
  });
  const totalResponseTimeMs = Date.now() - startedAt;

  return Response.json({
    reply: assistantMessage,
    suggestedQuestions,
    timings: {
      aiResponseTimeMs,
      mongoSaveTimeMs: logResult.mongoSaveTimeMs,
      totalResponseTimeMs,
    },
    logSaved: logResult.saved,
    logError: logResult.error,
  });
}
