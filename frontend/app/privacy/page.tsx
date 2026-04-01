import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 | ArKeep",
  description: "ArKeep 개인정보처리방침입니다.",
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

export default function PrivacyPage() {
  return (
    <LegalLayout title="개인정보처리방침" updatedAt="2026-04-01">
      <Section title="제1조 (수집하는 개인정보 항목)">
        서비스(ArKeep)는 Google 로그인을 통해 다음의 정보를 수집합니다.
        <ul>
          <li>Google 계정 이메일 주소</li>
          <li>Google 계정 닉네임</li>
          <li>Google 계정 프로필 이미지 주소</li>
          <li>Google 계정 고유 식별자</li>
          <li>서비스 이용 기록</li>
          <li>접속 로그</li>
        </ul>
      <p>비밀번호는 수집하지 않으며, Google 이 제공하는 토큰을 통해 인증합니다.</p>
      </Section>

      <hr style={{ border: 0, borderTop: "1px solid #e2e8f0", margin: 0 }} />

      <Section title="제2조 (개인정보 수집 및 이용 목적)">
        서비스는 수집한 개인정보를 다음의 목적을 위해 이용합니다.
        <ul>
          <li>회원 식별 및 로그인/인증</li>
          <li>링크 저장/분류/검색/읽기 상태 관리 등 서비스 기능 제공</li>
          <li>고객 문의 대응 및 공지 전달</li>
          <li>보안, 부정 이용 방지 및 서비스 안정화</li>
          <li>서비스 품질 개선</li>
        </ul>
      </Section>

      <hr style={{ border: 0, borderTop: "1px solid #e2e8f0", margin: 0 }} />

      <Section title="제3조 (개인정보 보유 및 이용 기간)">
        개인정보는 원칙적으로 회원 탈퇴 시까지 보유합니다. 다만 관련 법령에 따라 일정 기간 보존이 필요한 경우 해당 기간 동안 보관할 수
        있습니다.
      </Section>

      <hr style={{ border: 0, borderTop: "1px solid #e2e8f0", margin: 0 }} />

      <Section title="제4조 (개인정보 제3자 제공)">
        서비스는 이용자의 개인정보를 원칙적으로 제3자에게 제공하지 않습니다. 다만 다음의 경우는 예외로 합니다.
        <ul>
          <li>이용자가 사전에 동의한 경우</li>
          <li>법령의 규정에 의거하거나 수사기관의 적법한 요청이 있는 경우</li>
        </ul>
      </Section>

      <hr style={{ border: 0, borderTop: "1px solid #e2e8f0", margin: 0 }} />

      <Section title="제5조 (개인정보 처리 위탁)">
        서비스는 원활한 운영을 위해 아래 업무를 외부 서비스 제공자에게 위탁할 수 있습니다.
        <ul>
          <li>Google OAuth 인증 처리</li>
        </ul>
        위탁이 발생하는 경우, 서비스는 위탁 대상과 위탁 업무 범위를 서비스 내 안내 또는 본 방침을 통해 고지합니다.
      </Section>

      <hr style={{ border: 0, borderTop: "1px solid #e2e8f0", margin: 0 }} />

      <Section title="제6조 (이용자의 권리)">
        이용자는 언제든지 다음의 권리를 행사할 수 있습니다.
        <ul>
          <li>개인정보 열람 요청</li>
          <li>개인정보 수정 요청</li>
          <li>회원 탈퇴 및 개인정보 삭제 요청</li>
        </ul>
      </Section>

      <hr style={{ border: 0, borderTop: "1px solid #e2e8f0", margin: 0 }} />

      <Section title="제7조 (쿠키 및 토큰)">
        서비스는 로그인 상태 유지를 위해 브라우저의 쿠키 또는 로컬 저장소에 인증 관련 정보(예: 토큰)를 저장합니다. 이용자는 브라우저 설정을 통해 삭제할 수 있으나, 이 경우 로그인 상태가 해제될 수 있습니다.
      </Section>

      <hr style={{ border: 0, borderTop: "1px solid #e2e8f0", margin: 0 }} />

      <Section title="제8조 (개인정보 보호책임 및 문의)">
        개인정보 처리와 관련한 문의는 <a href="mailto:arkeep.service@gmail.com">arkeep.service@gmail.com</a>로 문의해주세요.
      </Section>

      <hr style={{ border: 0, borderTop: "1px solid #e2e8f0", margin: 0 }} />
    </LegalLayout>
  );
}

