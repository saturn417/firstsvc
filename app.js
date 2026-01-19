/* =========================
   우리학교 구글 계정 안내 - Frontend JS (학년/반/번호/이름)
   - students.json을 fetch로 로드
   - 학/반/번 + 이름으로 계정 ID 조회
   - 비밀번호는 표시/저장하지 않음
========================= */

// students.json 경로
const DATA_URL = "./students.json";

// 옵션: ID 마스킹 사용 여부 (원하시면 false로 전체 표시)
const USE_ID_MASKING = false;

const $ = (sel) => document.querySelector(sel);

const form = $("#lookupForm");
const gradeInput = $("#grade");
const klassInput = $("#klass");
const numberInput = $("#number");
const nameInput = $("#studentName");

const statusEl = $("#status");
const resultEl = $("#result");
const accountIdEl = $("#accountId");

const resetBtn = $("#resetBtn");
const resetPwBtn = $("#resetPwBtn");

// 로드된 학생 데이터(키 기반 Map)
let studentMap = new Map();

/* =========================
   유틸
========================= */
function normalize(str) {
  return String(str ?? "").trim();
}

function normalizeName(str) {
  return normalize(str).replace(/\s+/g, "");
}

function makeKey(grade, klass, number) {
  return `${normalize(grade)}-${normalize(klass)}-${normalize(number)}`;
}

function maskEmail(email) {
  const value = normalize(email);
  const at = value.indexOf("@");
  if (at <= 1) return value;

  const local = value.slice(0, at);
  const domain = value.slice(at);

  const keep = Math.min(3, local.length);
  const masked = local.slice(0, keep) + "*".repeat(Math.max(3, local.length - keep));
  return masked + domain;
}

function setStatus(message, type = "info") {
  statusEl.textContent = message;

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
   데이터 로드
========================= */
async function loadStudents() {
  setStatus("데이터를 불러오는 중입니다...", "info");
  hideResult();

  try {
    const res = await fetch(DATA_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`데이터 로드 실패: HTTP ${res.status}`);
    const data = await res.json();

    // Map 구성: 같은 학/반/번이 있을 수 없다는 전제(일반적으로 유일)
    // 그래도 안전하게 배열로 저장 후 이름으로 최종 확인
    const map = new Map();
    for (const s of data) {
      const key = makeKey(s.grade, s.class, s.number);
      const arr = map.get(key) ?? [];
      arr.push({
        grade: normalize(s.grade),
        class: normalize(s.class),
        number: normalize(s.number),
        name: normalizeName(s.name),
        googleId: normalize(s.googleId),
      });
      map.set(key, arr);
    }

    studentMap = map;
    setStatus("준비되었습니다. 학년/반/번호/이름을 입력해 주세요.", "success");
  } catch (err) {
    console.error(err);
    setStatus("데이터를 불러오지 못했습니다. students.json 위치/이름을 확인해 주세요.", "error");
  }
}

/* =========================
   조회 로직
========================= */
function lookupAccount(grade, klass, number, name) {
  const key = makeKey(grade, klass, number);
  const candidates = studentMap.get(key);
  if (!candidates || candidates.length === 0) return null;

  const nm = normalizeName(name);
  return candidates.find((c) => c.name === nm) || null;
}

function showResult(student) {
  const id = student.googleId;
  accountIdEl.textContent = USE_ID_MASKING ? maskEmail(id) : id;

  resultEl.hidden = false;
  setStatus("계정을 찾았습니다. 비밀번호는 재설정 절차로 안내합니다.", "success");
}

/* =========================
   이벤트
========================= */
form.addEventListener("submit", (e) => {
  e.preventDefault();

  hideResult();

  const grade = gradeInput.value;
  const klass = klassInput.value;
  const number = numberInput.value;
  const name = nameInput.value;

  if (!normalize(grade) || !normalize(klass) || !normalize(number) || !normalize(name)) {
    setStatus("학년/반/번호/이름을 모두 입력해 주세요.", "error");
    return;
  }

  const found = lookupAccount(grade, klass, number, name);

  if (!found) {
    setStatus("일치하는 정보를 찾지 못했습니다. 학년/반/번호/이름을 다시 확인해 주세요.", "error");
    return;
  }

  showResult(found);
});

resetBtn.addEventListener("click", () => {
  gradeInput.value = "";
  klassInput.value = "";
  numberInput.value = "";
  nameInput.value = "";
  hideResult();
  setStatus("");
  gradeInput.focus();
});

resetPwBtn?.addEventListener("click", () => {
  alert(
    "비밀번호는 보안을 위해 화면에 표시하지 않습니다.\n\n" +
      "학교 계정 관리자에게 임시 비밀번호 발급을 요청하거나\n" +
      "안내된 비밀번호 재설정 절차를 진행해 주세요."
  );
});

// 초기 실행
hideResult();
loadStudents();
