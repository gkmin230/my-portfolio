import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="bg-background text-foreground min-h-screen flex items-center">
      <div className="max-w-screen-xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center">

        {/* 왼쪽 텍스트 */}
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-6">
            클라우드 보안 엔지니어를 준비하는 <br />
            <span className="text-blue-600 dark:text-blue-400">&quot;&quot;</span> 입니다
          </h1>

          <p className="text-gray-700 dark:text-gray-300 mb-6">
            보안관제 경험을 바탕으로 AWS, WAF, GuardDuty, Lambda 자동화 실습을 진행하며
            클라우드 보안과 DevSecOps 역량을 쌓고 있습니다.
          </p>

          <div className="flex gap-4">
            <Link
              href="/project"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              프로젝트 보기
            </Link>

            <Link
              href="/aboutme"
              className="px-6 py-3 border border-border rounded-lg hover:bg-surface-muted"
            >
              소개 보기
            </Link>

            <Link
              href="/chat"
              className="px-6 py-3 border border-border rounded-lg hover:bg-surface-muted"
            >
              AI 채팅
            </Link>
          </div>
        </div>

        {/* 오른쪽 이미지 */}
        <div>
          <Image
            src="https://images.unsplash.com/photo-1555066931-4365d14bab8c"
            alt="developer"
            width={1200}
            height={800}
            priority
            className="h-auto w-full rounded-lg shadow-lg shadow-gray-200 dark:shadow-black/40"
          />
        </div>

      </div>
    </main>
  );
}
