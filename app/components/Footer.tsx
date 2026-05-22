export default function Footer() {
  return (
    <footer className="bg-surface-muted text-gray-700 dark:text-gray-200 mt-20 border-t border-border">
      <div className="max-w-screen-xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">

        {/* 로고 / 소개 */}
        <div>
          <h2 className="text-xl font-bold mb-3">My Portfolio</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Next.js와 Tailwind로 만든 포트폴리오입니다.
          </p>
        </div>

        

        {/* 연락 */}
        <div>
          <h3 className="font-semibold mb-3">Contact</h3>
          <p className="text-sm">email@example.com</p>
          <p className="text-sm">GitHub / LinkedIn</p>
        </div>

        {/* 기타 */}
        <div>
          <h3 className="font-semibold mb-3">Etc</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © 2026 My Portfolio
          </p>
        </div>

      </div>
    </footer>
  );
}
