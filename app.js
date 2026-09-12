// ===================================================
// 우리 반 담벼락
//
// Firebase Firestore와 연동하여 메모를 실시간으로 저장하고 읽어옵니다.
// ===================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-analytics.js";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyB7KuYIowVNNiN7ESn4PA5ajjfV0RvaGWs",
  authDomain: "live-draft-program.firebaseapp.com",
  projectId: "live-draft-program",
  storageBucket: "live-draft-program.firebasestorage.app",
  messagingSenderId: "13118143377",
  appId: "1:13118143377:web:d4120e4879212a56b77830",
  measurementId: "G-F857DG48QD"
};

// Firebase 및 Firestore 초기화
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// --- 메모 목록 (Firestore에서 읽어와 보관하는 배열) ---
let memos = [];
let unsubscribe = null;


// ===================================================
// 데이터를 다루는 함수 세 개
// Firestore를 사용해 실시간으로 읽고 쓰고 지웁니다.
// ===================================================

// 메모를 읽어 옵니다.
// Firestore의 memos 컬렉션을 실시간(onSnapshot)으로 감시하고,
// createdAt 기준으로 올린 순서대로 정렬하여 불러옵니다.
function loadMemos() {
  if (unsubscribe) {
    unsubscribe();
  }

  const q = query(collection(db, "memos"), orderBy("createdAt", "asc"));
  unsubscribe = onSnapshot(q, function (snapshot) {
    memos = [];
    snapshot.forEach(function (docSnap) {
      memos.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });
    render();
  });
}

// 메모를 새로 씁니다.
// 백엔드 2: 여기에 "누가 썼는지"(uid)를 함께 저장하게 됩니다.
async function addMemo(text) {
  try {
    await addDoc(collection(db, "memos"), {
      text: text,
      createdAt: Date.now()
    });
  } catch (error) {
    console.error("메모 저장 실패:", error);
    if (error.code === "permission-denied") {
      alert("메모는 5글자 이상이어야 저장할 수 있습니다.");
    } else {
      alert("메모를 저장하지 못했습니다.");
    }
  }
}

// 메모를 지웁니다.
// 백엔드 2: 지금은 누구든 남의 메모를 지울 수 있습니다. 이걸 막는 것이 과제입니다.
async function deleteMemo(id) {
  try {
    await deleteDoc(doc(db, "memos", id));
  } catch (error) {
    console.error("메모 삭제 실패:", error);
    alert("메모를 삭제하지 못했습니다.");
  }
}


// ===================================================
// 화면 그리기
// ===================================================

function render() {
  const wall = document.getElementById("wall");
  wall.innerHTML = "";

  memos.forEach(function (memo) {
    wall.appendChild(makeMemo(memo));
  });
}

// 메모 한 장 만들기
function makeMemo(memo) {
  const div = document.createElement("div");
  div.className = "memo";

  const del = document.createElement("button");
  del.textContent = "×";
  del.addEventListener("click", async function () {
    await deleteMemo(memo.id);
  });
  div.appendChild(del);

  const span = document.createElement("span");
  span.textContent = memo.text;
  div.appendChild(span);

  return div;
}


// ===================================================
// 메모 쓰는 칸
// 엔터를 누르면 담벼락에 붙습니다 (줄바꿈은 Shift + 엔터)
// ===================================================

const input = document.getElementById("input");

input.addEventListener("keydown", async function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();

    const text = input.value.trim();
    if (text === "") return;

    input.value = "";
    await addMemo(text);
  }
});


// 첫 화면 그리기 및 실시간 데이터 불러오기
loadMemos();
input.focus();
