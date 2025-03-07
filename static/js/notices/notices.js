let currentPage = 1;  // 🔹 전역 변수로 설정

// ✅ 공지사항 목록 불러오기 함수
function fetchNotices(page = 1) {
    console.log(`📌 fetchNotices 실행됨 (현재 페이지: ${page})`);
    currentPage = page;  // 🔹 현재 페이지 유지

    fetch(`http://58.127.241.84:60119/api/notices/list?page=${page}`)
        .then(response => response.json())
        .then(data => {
            console.log("📌 공지사항 데이터 수신:", data);
            displayNotices(data.notices);
            updatePagination(data.total_pages);
        })
        .catch(error => console.error("❌ 공지사항 데이터를 불러오는 중 오류 발생:", error));
}

// ✅ 공지사항 리스트 표시
function displayNotices(notices) {
    const noticeList = document.getElementById("notice_list");
    if (!noticeList) {
        console.error("❌ notice_list 요소를 찾을 수 없음!");
        return;
    }
    noticeList.innerHTML = "";

    notices.forEach(notice => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>📢 공지사항</td>
            <td><a href="http://58.127.241.84:61080/notices/notice_detail.html?notice_id=${notice.notice_id}" class="notice_link">
                ${notice.title}
            </a></td>
            <td>${notice.created_at.split("T")[0]}</td>
        `;
        noticeList.appendChild(row);
    });
}

// ✅ 페이지네이션 버튼 생성
function updatePagination(totalPages) {
    const pageNumbers = document.getElementById("pageNumbers");

    if (!pageNumbers) {
        console.error("❌ pageNumbers 요소를 찾을 수 없음!");
        return;
    }

    pageNumbers.innerHTML = "";

    for (let i = 1; i <= totalPages; i++) {
        const pageSpan = document.createElement("span");
        pageSpan.textContent = i;
        pageSpan.classList.add("page-btn");
        if (i === currentPage) {
            pageSpan.classList.add("active-page");
        }

        // ✅ 현재 페이지 클릭 방지
        pageSpan.addEventListener("click", () => {
            if (currentPage !== i) {
                fetchNotices(i);
            }
        });

        pageNumbers.appendChild(pageSpan);
    }

    // ✅ 이전 / 다음 버튼 활성화 여부 설정
    document.getElementById("prevPage").style.display = currentPage > 1 ? "inline-block" : "none";
    document.getElementById("nextPage").style.display = currentPage < totalPages ? "inline-block" : "none";
}

// ✅ 페이지 버튼 이벤트 리스너 등록 (중복 방지)
document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ 페이지네이션 버튼 이벤트 등록됨");

    document.getElementById("prevPage").addEventListener("click", () => {
        if (currentPage > 1) {
            fetchNotices(currentPage - 1);
        }
    });

    document.getElementById("nextPage").addEventListener("click", () => {
        fetch(`http://58.127.241.84:60119/api/notices/list?page=${currentPage + 1}`)
            .then(response => response.json())
            .then(data => {
                if (data.notices.length > 0) {
                    fetchNotices(currentPage + 1);
                }
            })
            .catch(error => console.error("❌ 다음 페이지 데이터를 불러오는 중 오류 발생:", error));
    });

    fetchNotices(currentPage);  // ✅ 초기 페이지 로드
});

//버튼
function checkAdminStatus() {
    console.log("✅ checkAdminStatus 실행됨");

    fetch("http://58.127.241.84:60119/api/member/status", {
        method: "GET",
        credentials: "include"
    })
    .then(response => response.json())
    .then(data => {
        console.log("🔹 서버 응답:", data);  // ✅ 응답 로그 확인

        // ✅ 'isadmin'을 'is_admin'으로 변환
        if (!data.hasOwnProperty("is_admin") && data.hasOwnProperty("isadmin")) {
            data.is_admin = data.isadmin === 1;  // 1이면 true, 0이면 false
            console.log("✅ 'isadmin' 값을 'is_admin'으로 변환 완료!");
        }

        if (!data.is_admin) {
            console.warn("⚠️ 현재 계정은 관리자가 아님:", data);
        }

        const adminBtn = document.getElementById("adminSubmitBtn");
        if (adminBtn) {
            adminBtn.style.display = data.is_admin ? "block" : "none";
            console.log(data.is_admin ? "✅ 공지 등록 버튼 표시 완료!" : "⚠️ 공지 등록 버튼 숨김.");
        } else {
            console.error("❌ adminSubmitBtn 요소를 찾을 수 없음.");
        }
    })
    .catch(error => {
        console.error("❌ 관리자 확인 중 오류 발생:", error);
    });
}

// ✅ 사용자 상태 확인 및 네비게이션 업데이트
function updateNavbar() {
    fetch("http://58.127.241.84:60119/api/member/status", {
        method: "GET",
        credentials: "include"
    })
    .then(response => response.json())
    .then(data => {
        console.log("🔹 사용자 상태 응답:", data);

        const navbarMember = document.getElementById("navbar_member");
        if (!navbarMember) {
            console.error("❌ navbar_member 요소를 찾을 수 없음!");
            return;
        }
        navbarMember.innerHTML = "";

        if (data.is_authenticated) {
            if (data.is_admin) {
                navbarMember.innerHTML = `
                    <li class="navbar_signup"><a href="http://58.127.241.84:60119/api/member/logout">로그아웃</a></li>
                    <li class="navbar_login"><a href="http://58.127.241.84:61080/admin/admin_man.html">회원정보</a></li>
                `;
            } else {
                navbarMember.innerHTML = `
                    <li class="navbar_signup"><a href="http://58.127.241.84:60119/api/member/logout">로그아웃</a></li>
                    <li class="navbar_login"><a href="http://58.127.241.84:61080/mypage/mypage.html">마이페이지</a></li>
                `;
            }
        } else {
            navbarMember.innerHTML = `
                <li class="navbar_signup"><a href="http://58.127.241.84:61080/member/member_email.html">회원가입</a></li>
                <li class="navbar_login"><a href="http://58.127.241.84:61080/member/member_login.html">로그인</a></li>
            `;
        }
    })
    .catch(error => console.error("❌ 사용자 상태 확인 중 오류 발생:", error));
}

// ✅ `DOMContentLoaded`에서 실행할 함수들 호출
document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ DOMContentLoaded 실행됨");

    checkAdminStatus();  // ✅ 관리자 여부 확인
    fetchNotices();      // ✅ 공지사항 목록 불러오기
    updateNavbar();      // ✅ 네비게이션 업데이트

    // ✅ 공지 등록 버튼 클릭 이벤트 강제 등록
    const adminBtn = document.getElementById("adminSubmitBtn");
    if (adminBtn) {
        adminBtn.addEventListener("click", gosubmit);
        console.log("✅ 공지 등록 버튼 클릭 이벤트 추가됨!");
    } else {
        console.error("❌ adminSubmitBtn 요소를 찾을 수 없음.");
    }
});


// ✅ 공지사항 등록 버튼 클릭 이벤트
function gosubmit() {
    window.location.href = "/notices/notice_create";
}



