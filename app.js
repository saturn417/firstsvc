/* =========================
   우리학교 구글 계정 안내 - Frontend JS
   - 학번+이름 검색
   - ID 표시(옵션: 마스킹)
   - PW는 표시하지 않음 (재설정 안내 버튼 제공)
========================= */

/**
 * (예시 데이터)
 * 실제 운영에서는 절대 프론트엔드 코드에 전체 계정 목록을 넣지 마세요.
 * → 서버(백엔드)에서 인증된 사용자에게만 조회되도록 처리해야 안전합니다.
 */
const STUDENTS = [
  // 예시
  { studentNo: "10123", name: "홍길동", googleId: "honggildong@school.kr" },
  { studentNo: "20501", name: "김민지", googleId: "minji.kim@school.kr" },
];

// 옵션: ID 마스킹 사용 여부
const USE_ID_MASKING = false;

const $ = (sel) => document.querySelector(sel);

const form = $("#lookupForm");
const studentNoInput = $("#studentNo");
const studentNameInput = $("#studentName");

const statusEl = $("#status");
const resultEl = $("#result");
const accountIdEl = $("#accountId");

const resetBtn = $("#resetBtn");
const resetPwBtn = $("#resetPwBtn");

/* =========================
   유틸
========================= */
function normalize(str) {
  return String(str ?? "").trim();
}

function normalizeName(str) {
  // 공백 제거 + 기본 정규화
  return normalize(str).replace(/\s+/g, "");
}

function maskEmail(email) {
  // 예: abcdef@school.kr -> abc***@school.kr
  const value = normalize(email);
  const at = value.indexOf("@");
  if (at <= 1) return value; // 너무 짧으면 그대로

  const local = value.slice(0, at);
  const domain = value.slice(at);

  const keep = Math.min(3, local.length);
  const masked = local.slice(0, keep) + "*".repeat(Math.max(3, local.length - keep));
  return masked + domain;
}

function setStatus(message, type = "info") {
  // type: info | error | success
  statusEl.textContent = message;

  // 간단한 스타일(원하면 CSS로 더 예쁘게 빼도 됨)
  statusEl.style.padding = message ? "10px 12px" : "0";
  statusEl.style.borderRadius = "10px";
  statusEl.style.border = message ? "1px solid #dbe4df" : "none";
  statusEl.style.background =
    type === "error" ? "#fff3f3" : type === "success" ? "#f2fbf6" : "#f5fbfb";
  statusEl.style.color =
    type === "error" ? "#7a2d2d" : type === "success" ? "#1f4f5c" : "#1f4f5c";
}

function hideResult() {
  resultEl.hidden = true;
  accountIdEl.textContent = "-";
}

/* =========================
   핵심 로직: 조회
========================= */
function lookupAccount(studentNo, name) {
  const no = normalize(studentNo);
  const nm = normalizeName(name);

  if (!no || !nm) return null;

  return (
    STUDENTS.find(
      (s) => normalize(s.studentNo) === no && normalizeName(s.name) === nm
    ) || null
  );
}

function showResult(student) {
  const id = normalize(student.googleId);
  accountIdEl.textContent = USE_ID_MASKING ? maskEmail(id) : id;

  resultEl.hidden = false;
  setStatus("계정을 찾았습니다. 비밀번호는 재설정 절차로 안내합니다.", "success");
}

/* =========================
   이벤트 바인딩
========================= */
form.addEventListener("submit", (e) => {
  e.preventDefault();

  hideResult();

  const studentNo = studentNoInput.value;
  const studentName = studentNameInput.value;

  // 입력 검증
  if (!normalize(studentNo) || !normalize(studentName)) {
    setStatus("학번과 이름을 모두 입력해 주세요.", "error");
    return;
  }

  // 검색
  const found = lookupAccount(studentNo, studentName);
  if (!found) {
    setStatus("일치하는 정보를 찾지 못했습니다. 학번/이름을 다시 확인해 주세요.", "error");
    return;
  }

  showResult(found);
});

resetBtn.addEventListener("click", () => {
  studentNoInput.value = "";
  studentNameInput.value = "";
  hideResult();
  setStatus("");
  studentNoInput.focus();
});

resetPwBtn?.addEventListener("click", () => {
  // 실제 학교 정책에 맞게 수정:
  // - 구글 비밀번호 재설정 안내 페이지로 이동
  // - 또는 '담임/관리자 문의' 안내
  //
  // 예시: 안내 문구만 띄우기
  alert(
    "비밀번호는 보안을 위해 화면에 표시하지 않습니다.\n\n" +
      "1) 학교 계정 관리자에게 임시 비밀번호 발급을 요청하거나\n" +
      "2) 안내된 비밀번호 재설정 절차를 진행해 주세요."
  );
});

/* 초기 상태 */
hideResult();
setStatus("");
