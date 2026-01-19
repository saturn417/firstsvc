/* =========================
   우리학교 구글 계정 안내 - Frontend JS (드롭다운: 학년/반/번호)
   - students.json을 fetch로 로드
   - 학년→반→번호 연동 드롭다운
   - 번호 선택 시 이름 자동 표시
   - 비밀번호는 표시/저장하지 않음
========================= */

const DATA_URL = "./students.json";
const USE_ID_MASKING = false;

const $ = (sel) => document.querySelector(sel);

const form = $("#lookupForm");
const gradeSelect = $("#grade");
const klassSelect = $("#klass");
const numberSelect = $("#number");
const nameInput = $("#studentName");

const statusEl = $("#status");
const resultEl = $("#result");
const accountIdEl = $("#accountId");

const resetBtn = $("#resetBtn");
const resetPwBtn = $("#resetPwBtn");

// key: "grade-class-number" -> student {grade,class,number,name,googleId}
let studentByKey = new Map();

// 인덱스: grade -> Set(classes), grade|class -> Set(numbers)
let classesByGrade = new Map();
let numbersByGradeClass = new Map();

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
    type === "error" ? "#7a2d2d" : "#1f4f5c";
}
function hideResult() {
  resultEl.hidden = true;
  accountIdEl.textContent = "-";
}

function setSelectOptions(selectEl, options, placeholder) {
  selectEl.innerHTML = "";
  const ph = document.createElement("option");
  ph.value = "";
  ph.disabled = true;
  ph.selected = true;
  ph.textContent = placeholder;
  selectEl.appendChild(ph);

  for (const opt of options) {
    const o = document.createElement("option");
    o.value = opt;
    o.textContent = opt;
    selectEl.appendChild(o);
  }
}

function disableSelect(selectEl, placeholder) {
  selectEl.disabled = true;
  setSelectOptions(selectEl, [], placeholder);
}

function enableSelect(selectEl) {
  selectEl.disabled = false;
}

async function loadStudents() {
  setStatus("데이터를 불러오는 중입니다...", "info");
  hideResult();

  try {
    const res = await fetch(DATA_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // 초기화
    studentByKey = new Map();
    classesByGrade = new Map();
    numbersByGradeClass = new Map();

    for (const s of data) {
      const grade = normalize(s.grade);
      const klass = normalize(s.class);
      const number = normalize(s.number);
      const name = normalizeName(s.name);
      const googleId = normalize(s.googleId);

      const key = makeKey(grade, klass, number);

      // 같은 학/반/번 중복이 없다면 그대로 저장
      studentByKey.set(key, { grade, klass, number, name, googleId });

      // grade -> classes
      if (!classesByGrade.has(grade)) classesByGrade.set(grade, new Set());
      classesByGrade.get(grade).add(klass);

      // grade|class -> numbers
      const gc = `${grade}|${klass}`;
      if (!numbersByGradeClass.has(gc)) numbersByGradeClass.set(gc, new Set());
      numbersByGradeClass.get(gc).add(number);
    }

    // 드롭다운 채우기: 학년
    const grades = Array.from(classesByGrade.keys()).sort((a, b) => Number(a) - Number(b));
    setSelectOptions(gradeSelect, grades, "학년 선택");
    enableSelect(gradeSelect);

    // 반/번호 초기 비활성화
    disableSelect(klassSelect, "반 선택");
    disableSelect(numberSelect, "번호 선택");
  

    setStatus("준비되었습니다. 학년/반/번호를 선택해 주세요.", "success");
  } catch (e) {
    console.error(e);
    setStatus("데이터를 불러오지 못했습니다. students.json 위치/이름을 확인해 주세요.", "error");
  }
}

// 학년 선택 → 반 갱신
gradeSelect.addEventListener("change", () => {
  hideResult();
  
  const grade = gradeSelect.value;
  const classes = Array.from(classesByGrade.get(grade) ?? []).sort((a, b) => Number(a) - Number(b));

  setSelectOptions(klassSelect, classes, "반 선택");
  enableSelect(klassSelect);

  disableSelect(numberSelect, "번호 선택");
});

// 반 선택 → 번호 갱신
klassSelect.addEventListener("change", () => {
  hideResult();
 
  const grade = gradeSelect.value;
  const klass = klassSelect.value;
  const gc = `${grade}|${klass}`;

  const numbers = Array.from(numbersByGradeClass.get(gc) ?? []).sort((a, b) => Number(a) - Number(b));
  setSelectOptions(numberSelect, numbers, "번호 선택");
  enableSelect(numberSelect);
});

// 번호 선택 → 이름 자동 표시
numberSelect.addEventListener("change", () => {
  hideResult();

  const key = makeKey(gradeSelect.value, klassSelect.value, numberSelect.value);
  const student = studentByKey.get(key);

 
});

// 검색 버튼
form.addEventListener("submit", (e) => {
  e.preventDefault();
  hideResult();

  const grade = gradeSelect.value;
  const klass = klassSelect.value;
  const number = numberSelect.value;
  const inputName = normalizeName(nameInput.value);
  if (!student || student.name !== inputName) {
    setStatus("학년·반·번호·이름이 일치하지 않습니다.", "error");
    return;
  }

  if (!grade || !klass || !number) {
    setStatus("학년/반/번호를 모두 선택해 주세요.", "error");
    return;
  }

  const key = makeKey(grade, klass, number);
  const student = studentByKey.get(key);

  if (!student) {
    setStatus("일치하는 정보를 찾지 못했습니다. 선택 값을 다시 확인해 주세요.", "error");
    return;
  }

  // ID 표시
  accountIdEl.textContent = USE_ID_MASKING ? maskEmail(student.googleId) : student.googleId;
  resultEl.hidden = false;
  setStatus("계정을 찾았습니다. 비밀번호는 재설정 절차로 안내합니다.", "success");
});

// 초기화
resetBtn.addEventListener("click", () => {
  hideResult();
  setStatus("");

  gradeSelect.value = "";
  disableSelect(klassSelect, "반 선택");
  disableSelect(numberSelect, "번호 선택");
  
});

// 재설정 안내
resetPwBtn?.addEventListener("click", () => {
  alert(
    "비밀번호는 보안을 위해 화면에 표시하지 않습니다.\n\n" +
    "학교 계정 관리자에게 임시 비밀번호 발급을 요청하거나\n" +
    "안내된 비밀번호 재설정 절차를 진행해 주세요."
  );
});

// 시작
hideResult();
loadStudents();
