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
  if (!body || typeof body !== "object") {
    return "";
  }

  const { message } = body as { message?: unknown };

  return typeof message === "string" ? message.trim() : "";
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";

  if (!apiKey) {
    return Response.json(
      {
        error:
          "GEMINI_API_KEY가 설정되어 있지 않습니다. .env.local에 GEMINI_API_KEY=발급받은키 를 추가해 주세요.",
      },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => null);
  const message = getMessageFromBody(body);

  if (!message) {
    return Response.json(
      { error: "message 값을 JSON으로 보내주세요." },
      { status: 400 },
    );
  }

  const geminiResponse = await fetch(
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

  const data = (await geminiResponse.json().catch(() => null)) as
    | GeminiResponse
    | null;

  if (!geminiResponse.ok) {
    return Response.json(
      {
        error: getGeminiErrorMessage(data?.error?.message),
      },
      { status: geminiResponse.status },
    );
  }

  const reply = getGeminiReply(data);

  return Response.json({
    reply: reply || "응답 텍스트를 찾지 못했습니다.",
  });
}
