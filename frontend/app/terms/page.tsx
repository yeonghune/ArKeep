import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관 | ArKeep",
  description: "ArKeep 서비스 이용약관입니다.",
  robots: { index: true, follow: true },
};

function LegalLayout({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100dvh", background: "#ffffff" }}>
      <header
        style={{
          borderBottom: "1px solid #f1f5f9",
          padding: "28px 24px",
        }}
      >
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.6px" }}>{title}</h1>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "#64748b" }}>최종 수정일: {updatedAt}</p>
        </div>
      </header>

      <main style={{ padding: "24px 24px 40px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>{children}</div>
      </main>

      <footer style={{ borderTop: "1px solid #f1f5f9", padding: "16px 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>© {new Date().getFullYear()} ArKeep</p>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ padding: "20px 0" }}>
      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{title}</h2>
      <p style={{ margin: "10px 0 0", fontSize: 14, color: "#334155", lineHeight: 1.9 }}>{children}</p>
    </section>
  );
}

export default function TermsPage() {
  return (
    <LegalLayout title="이용약관" updatedAt="2026-04-01">
      <Section title="제1조 (목적)">
        본 약관은 ArKeep(이하 “서비스”)가 제공하는 북마크 저장 서비스의 이용과 관련하여 서비스와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
      </Section>

      <hr style={{ border: 0, borderTop: "1px solid #e2e8f0", margin: 0 }} />

      <Section title="제2조 (서비스 제공)">
        서비스는 다음과 같은 기능을 제공합니다.
        <ul>
          <li>링크(URL) 저장 및 관리</li>
          <li>카테고리/태그 분류 및 정리</li>
          <li>검색 및 필터링</li>
          <li>읽기 상태(열람/미열람) 관리</li>
        </ul>
      </Section>

      <hr style={{ border: 0, borderTop: "1px solid #e2e8f0", margin: 0 }} />

      <Section title="제3조 (회원가입)">
        서비스는 Google 소셜 로그인 방식으로 회원가입을 제공합니다. 이용자는 본 약관 및 개인정보 처리방침에 동의함으로써 회원으로 가입할 수 있습니다.
      </Section>

      <hr style={{ border: 0, borderTop: "1px solid #e2e8f0", margin: 0 }} />

      <Section title="제4조 (이용자의 의무)">
        <ul>
          <li>봇 또는 자동화된 수단을 통한 과도한 요청, 무단 크롤링 등 서비스 운영을 방해하는 행위를 할 수 없습니다</li>
          <li>불법 정보, 저작권 침해 자료 등 법령에 위반되는 콘텐츠를 저장하는 행위를 할 수 없습니다</li>
          <li>서비스의 정상적인 운영을 방해하는 행위를 할 수 없습니다</li>
          <li>타인의 계정을 무단으로 사용하는 행위를 할 수 없습니다</li>
        </ul>
      </Section>

      <hr style={{ border: 0, borderTop: "1px solid #e2e8f0", margin: 0 }} />

      <Section title="제5조 (콘텐츠 책임)">
        이용자가 서비스에 저장·게시한 콘텐츠에 대한 책임은 이용자에게 있습니다. 서비스는 이용자의 콘텐츠를 상시 모니터링할 의무는
        없으나, 약관 위반 콘텐츠를 발견하거나 신고받은 경우 관련 콘텐츠에 대해 노출 제한 또는 삭제 등 필요한 조치를 취할 수 있습니다.
      </Section>

      <hr style={{ border: 0, borderTop: "1px solid #e2e8f0", margin: 0 }} />

      <Section title="제6조 (서비스 변경 및 중단)">
        서비스는 운영상 또는 기술상 필요에 따라 서비스의 전부 또는 일부를 변경하거나 중단할 수 있습니다. 서비스 중단 시 사전 공지를
        원칙으로 하나, 긴급한 경우 사후 공지할 수 있습니다.
      </Section>

      <hr style={{ border: 0, borderTop: "1px solid #e2e8f0", margin: 0 }} />

      <Section title="제7조 (면책조항)">
        서비스는 천재지변, 서버 장애 등 불가항력적인 사유로 인해 발생한 손해에 대해 책임을 지지 않습니다. 이용자 간의 분쟁 및
        이용자가 저장한 외부 콘텐츠로 인한 피해에 대해서도 서비스는 책임을 지지 않습니다. 다만 관련 법령에 따라 책임이 제한될 수
        있습니다.
      </Section>

      <hr style={{ border: 0, borderTop: "1px solid #e2e8f0", margin: 0 }} />

      <Section title="제8조 (문의)">
        본 약관에 관한 문의사항은 <a href="mailto:arkeep.service@gmail.com">arkeep.service@gmail.com</a>로 문의해주세요.
      </Section>
    </LegalLayout>
  );
}

