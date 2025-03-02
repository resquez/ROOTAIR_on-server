// ✅ 헤더 토글 버튼 기능
const togglebtn = document.querySelector('.navbar_togglebtn');
const menu = document.querySelector('.navbar_menu');
const member = document.querySelector('.navbar_member');

togglebtn.addEventListener('click', () => {
    menu.classList.toggle('active');
    member.classList.toggle('active');
});

// ✅ 현재 활성화된 탭 ("all" = 전체 문의, "my" = 나의 문의)
let currentTab = "all";  
let CURRENT_USER_ID = null;  // ✅ 로그인한 사용자 ID 저장
let currentPage = 1;  // ✅ 현재 페이지

// ✅ 탭 전환 기능
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');

    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    // ✅ 현재 탭 상태 변경 및 API 호출
    if (tabId === "all-questions") {
        fetchInquiryList(1);  // ✅ 전체 문의사항 로드
    } else if (tabId === "my-questions") {
        fetchMyInquiryList(1);  // ✅ 나의 문의 로드
    }
}

// ✅ 페이지당 표시할 개수 및 현재 페이지 설정
const itemsPerPage = 5;


// ✅ 전체문의 불러오기
function fetchInquiryList(page = 1) {
    console.log(`🔥 [DEBUG] 문의사항 API 호출: 페이지 = ${page}`);

    fetch(`http://58.127.241.84:60119/api/qna/list?page=${page}`)  // ✅ 항상 전체 목록만 가져오기
        .then(response => response.json())
        .then(data => {
            console.log("🔥 [DEBUG] 전체 문의 API 응답:", data);
            displayInquiryList(data.qna);
            createPaginationButtons(data.total_pages, page, "all");
        })
        .catch(error => console.error("🔥 [ERROR] 전체 문의 데이터를 불러오는 중 오류 발생:", error));

}

// ✅나의 문의 불러오기
function fetchMyInquiryList(page = 1) {
    console.log(`🔥 [DEBUG] 나의 문의 API 호출: 페이지 = ${page}`);

    fetch(`http://58.127.241.84:60119/api/qna/my?page=${page}`)
        .then(response => response.json())
        .then(data => {
            console.log("🔥 [DEBUG] 나의 문의 API 응답:", data);
            displayMyInquiryList(data.qna_list);  // ✅ 기존 코드 확인 필요
            createPaginationButtons(data.total_pages, page, "my");
        })
        .catch(error => console.error("🚨 나의 문의 데이터를 불러오는 중 오류 발생:", error));
}

// ✅ 전체문의 목록 표시
function displayInquiryList(qna) {
    let questionList = document.getElementById("question-list");
    if (!questionList) {
        console.error("🚨 [ERROR] #question-list 요소를 찾을 수 없음!");
        return;
    }
    questionList.innerHTML = ""; // ✅ 기존 내용 비우기

    console.log("🔥 [DEBUG] API에서 받아온 문의사항 목록:", qna);

    qna.forEach((item) => {
        let created_at_display = item.created_at ? item.created_at : "날짜 없음";  // ✅ undefined 방지
        let user_id_display = item.user_id ? item.user_id.replace(/'/g, "\\'") : "알 수 없음";  // ✅ 작은따옴표 이스케이프 처리
        let is_secret_display = Number(item.is_secret); // ✅ 숫자로 변환
        let row = `
            <tr onclick="viewDetail(${item.qna_id}, ${item.is_secret},'${item.user_id}')">
                <td>${item.qna_id}</td>
                <td><a href="javascript:void(0);">${item.title}</a></td>
                <td>${user_id_display}</td>  
                <td>${created_at_display}</td>
            </tr>
        `;
        questionList.innerHTML += row;
    });
}

// ✅ 나의문의 목록 표시
function displayMyInquiryList(qna) {
    let myQuestionList = document.getElementById("my-question-list");
    if (!myQuestionList) {
        console.error("🚨 [ERROR] #my-question-list 요소를 찾을 수 없음!");
        return;
    }
    myQuestionList.innerHTML = ""; // ✅ 기존 내용 비우기
    if (!Array.isArray(qna) || qna.length === 0) {
        console.warn("⚠️ [INFO] 나의 문의가 없습니다.");
        myQuestionList.innerHTML = "<tr><td colspan='3' style='text-align:center;'>등록된 문의가 없습니다.</td></tr>";
        return;
    }

    console.log("🔥 [DEBUG] 나의 문의 목록:", qna);

    qna.forEach((item) => {
        let row = `
            <tr onclick="viewDetail(${item.qna_id}, '${item.user_id}')">
                <td>${item.qna_id}</td>
                <td><a href="javascript:void(0);">${item.title}</a></td>
                <td>${item.created_at}</td>
            </tr>
        `;
        myQuestionList.innerHTML += row;
    });
}


// ✅ 페이지네이션 버튼 생성
function createPaginationButtons(totalPages, currentPage) {
    let pagination = document.getElementById("pagination");
    pagination.innerHTML = "";

    // "Previous" 버튼
    let prevButton = document.createElement("button");
    prevButton.innerText = "← Previous";
    prevButton.disabled = currentPage === 1;
    prevButton.onclick = () => fetchInquiryList(currentPage - 1);
    pagination.appendChild(prevButton);

    // 페이지 번호 버튼 생성
    for (let i = 1; i <= totalPages; i++) {
        let pageButton = document.createElement("button");
        pageButton.innerText = i;
        pageButton.classList.add("page-btn");
        if (i === currentPage) {
            pageButton.classList.add("active");
        }
        pageButton.onclick = () => {
            if (currentTab === "all") {
                fetchInquiryList(i);
            } else {
                fetchMyInquiryList(i);
            }
        };
        
        pagination.appendChild(pageButton);
    }

    // "Next" 버튼
    let nextButton = document.createElement("button");
    nextButton.innerText = "Next →";
    nextButton.disabled = currentPage === totalPages;
    nextButton.onclick = () => fetchInquiryList(currentPage + 1);
    pagination.appendChild(nextButton);
}


// ✅ 로그인 상태 확인 API 호출
function fetchLoginStatus() {
    console.log("🔥 [DEBUG] 로그인 상태 확인 요청");

    return fetch("http://58.127.241.84:60119/api/member/status", { // 백엔드의 @member_bp.route("/status") 활용
        method: "GET",
        credentials: "include" // ✅ 세션 쿠키 포함
    })
    .then(response => response.json())
    .then(data => {
        console.log("🔥 [DEBUG] 로그인 상태 API 응답:", data);

        if (data.is_authenticated) {
            console.log("✅ 사용자는 로그인 상태입니다.");
            sessionStorage.setItem("IS_AUTHENTICATED", "true");
        } else {
            console.warn("🚨 사용자는 로그인하지 않았습니다.");
            sessionStorage.setItem("IS_AUTHENTICATED", "false");
        }

        return data.is_authenticated;  // ✅ 로그인 여부 반환
    })
    .catch(error => {
        console.error("🚨 로그인 상태 확인 중 오류 발생:", error);
        return false;
    });
}


// ✅ 문의사항 상세 페이지 이동 (비밀글 접근 검증 추가)
async function viewDetail(qna_id, is_secret, writer_id) {
    console.log("🔥 [DEBUG] 클릭한 게시글 ID:", qna_id);
    console.log("🔥 [DEBUG] is_secret:", is_secret);
    console.log("🔥 [DEBUG] writer_id:", writer_id);

    // ✅ 비밀글이라면 로그인 상태 확인
    if (is_secret === 1) {
        const isAuthenticated = await fetchLoginStatus();

        if (!isAuthenticated) {
            console.warn("🚨 [WARNING] 로그인하지 않은 사용자! 로그인 페이지로 이동");
            alert("비밀글은 로그인한 사용자만 볼 수 있습니다. 로그인 페이지로 이동합니다.");
            window.location.href = "http://58.127.241.84:61080/member/member_login.html";  // ✅ 로그인 페이지로 이동
            return;
        }

        // ✅ 로그인했지만 작성자가 아니라면 접근 차단
        if (String(writer_id) !== String(CURRENT_USER_ID)) {
            console.warn("🚨 [WARNING] 작성자가 아님! 접근 차단됨.");
            alert("비밀글은 작성자만 볼 수 있습니다.");
            return;
        }
    }

    // ✅ 비밀글이 아니거나, 작성자라면 정상적으로 상세 페이지 이동
    window.location.href = `http://58.127.241.84:61080/qna/qna_detail.html?qna_id=${qna_id}`;
}

//console.log("🔥 [DEBUG] writer_id:", writer_id, "(타입:", typeof writer_id, ")");
console.log("🔥 [DEBUG] CURRENT_USER_ID:", CURRENT_USER_ID, "(타입:", typeof CURRENT_USER_ID, ")");

// ✅ 로그인한 사용자 정보 가져오기 (로그인 상태 API 활용)
async function fetchCurrentUser() {
    console.log("🔥 [DEBUG] 로그인한 사용자 정보 가져오기");

    const isAuthenticated = await fetchLoginStatus();

    if (!isAuthenticated) {
        console.warn("🚨 [WARNING] 로그인한 사용자 없음. 기본 상태 유지");
        CURRENT_USER_ID = null;
        return;
    }

    fetch('http://58.127.241.84:60119/api/member/status')  // ✅ 실제 사용자 정보를 가져오는 API
        .then(response => response.json())
        .then(data => {
            console.log("🔥 [DEBUG] API 응답:", data);

            if (data.current_user_id) {
                CURRENT_USER_ID = data.current_user_id;
                sessionStorage.setItem('CURRENT_USER_ID', CURRENT_USER_ID);
            } else {
                console.error("🚨 [ERROR] API에서 current_user_id를 가져오지 못함!");
            }

            console.log("🔥 [DEBUG] 로그인한 사용자 ID:", CURRENT_USER_ID);
            fetchInquiryList(1);  // ✅ 전체 문의 목록 불러오기
        })
        .catch(error => console.error("🚨 사용자 정보를 불러오는 중 오류 발생:", error));
}

// ✅ 페이지 로드 시 실행
document.addEventListener("DOMContentLoaded", async () => {
    await fetchCurrentUser(); // ✅ 로그인 상태 확인 후 사용자 ID 저장
    fetchInquiryList(1); // ✅ 전체 문의 목록 불러오기
    console.log("🔥 [DEBUG] document.getElementById('question-list'):", document.getElementById("question-list"));
});
