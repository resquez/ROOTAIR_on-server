document.addEventListener("DOMContentLoaded", async function () {
    console.log("✅ 공지사항 상세 페이지 로드됨");

    const urlParams = new URLSearchParams(window.location.search);
    const noticeId = urlParams.get("notice_id");

    if (!noticeId) {
        alert("공지사항 ID가 없습니다.");
        window.location.href = "/notices/notices.html";
        return;
    }

    // ✅ 사용자 정보 한 번만 가져오기
    const userData = await fetchUserStatus();

    // ✅ 공지사항 상세 정보 불러오기
    fetchNoticeDetail(noticeId);

    // ✅ 관리자 확인 후 버튼 표시
    if (userData.is_admin) {
        showAdminButtons(noticeId);
    }
});

// ✅ 사용자 로그인 상태 및 관리자 여부 가져오기
async function fetchUserStatus() {
    try {
        const response = await fetch("http://58.127.241.84:60119/api/member/status", {
            method: "GET",
            credentials: "include"
        });
        const data = await response.json();
        console.log("🔹 사용자 상태 응답:", data);

        // ✅ 'isadmin'을 'is_admin'으로 변환 (백엔드가 일관적이지 않을 경우 대비)
        if (!data.hasOwnProperty("is_admin") && data.hasOwnProperty("isadmin")) {
            data.is_admin = data.isadmin === 1;
            console.log("✅ 'isadmin' 값을 'is_admin'으로 변환 완료!");
        }

        updateNavbar(data);  // ✅ 네비게이션 업데이트
        return data;
    } catch (error) {
        console.error("❌ 사용자 상태 확인 중 오류 발생:", error);
        return { is_authenticated: false, is_admin: false }; // 기본값 반환
    }
}

// ✅ 네비게이션 업데이트
function updateNavbar(userData) {
    const navbarMember = document.getElementById("navbar_member");
    if (!navbarMember) {
        console.error("❌ navbar_member 요소를 찾을 수 없음!");
        return;
    }
    navbarMember.innerHTML = "";

    if (userData.is_authenticated) {
        navbarMember.innerHTML = userData.is_admin
            ? `<li class="navbar_signup"><a href="http://58.127.241.84:60119/api/member/logout">로그아웃</a></li>
               <li class="navbar_login"><a href="http://58.127.241.84:61080/admin/admin_man.html">회원정보</a></li>`
            : `<li class="navbar_signup"><a href="http://58.127.241.84:60119/api/member/logout">로그아웃</a></li>
               <li class="navbar_login"><a href="http://58.127.241.84:61080/mypage/mypage.html">마이페이지</a></li>`;
    } else {
        navbarMember.innerHTML = `
            <li class="navbar_signup"><a href="http://58.127.241.84:61080/member/member_email.html">회원가입</a></li>
            <li class="navbar_login"><a href="http://58.127.241.84:61080/member/member_login.html">로그인</a></li>
        `;
    }
}

// ✅ 공지사항 상세 정보 불러오기
function fetchNoticeDetail(noticeId) {
    console.log(`📌 공지사항 ID: ${noticeId} 데이터 요청`);

    fetch(`http://58.127.241.84:60119/api/notices/detail/${noticeId}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert("공지사항을 찾을 수 없습니다.");
                window.location.href = "/notices/notices.html";
                return;
            }

            console.log("📌 공지사항 상세 데이터:", data);
            document.getElementById("notice_detail_title").textContent = data.title;
            document.getElementById("notice_detail_date").textContent = data.created_at;
            document.getElementById("notice_detail_content").textContent = data.content;

            if (data.file_url) {
                const downloadLink = document.getElementById("download_link");
                downloadLink.href = data.file_url;
                downloadLink.style.display = "inline";
            }
        })
        .catch(error => console.error("❌ 공지사항 불러오기 오류:", error));
}

// ✅ 관리자 버튼 보이기 (기존 HTML 버튼 활용)
function showAdminButtons(noticeId) {
    const editButtonContainer = document.getElementById("editButtonContainer");
    const deleteButtonContainer = document.getElementById("deleteButtonContainer");
    const editBtn = document.getElementById("editBtn");
    const deleteBtn = document.getElementById("deleteBtn");

    if (editButtonContainer) editButtonContainer.style.display = "block";
    if (deleteButtonContainer) deleteButtonContainer.style.display = "block";

    if (editBtn) {
        editBtn.setAttribute("data-notice-id", noticeId);
        editBtn.addEventListener("click", editNotice);
    }
    if (deleteBtn) {
        deleteBtn.setAttribute("data-notice-id", noticeId);
        deleteBtn.addEventListener("click", deleteNotice);
    }
}

// ✅ 공지사항 수정 함수
function editNotice(event) {
    const noticeId = event.target.getAttribute("data-notice-id");
    window.location.href = `/notices/notice_edit.html?notice_id=${noticeId}`;
}

// ✅ 공지사항 삭제 함수
function deleteNotice(event) {
    const noticeId = event.target.getAttribute("data-notice-id");

    if (!confirm("정말로 이 공지사항을 삭제하시겠습니까?")) return;

    fetch(`http://58.127.241.84:60119/api/notices/delete/${noticeId}`, {
        method: "DELETE",
        credentials: "include"
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(`❌ 오류 발생: ${data.error}`);
        } else {
            alert("✅ 공지사항이 삭제되었습니다.");
            window.location.href = "/notices/notices.html";
        }
    })
    .catch(error => console.error("❌ 공지사항 삭제 중 오류 발생:", error));
}

//
function goBack() {
    window.location.href = "/notices/notices.html";
}
