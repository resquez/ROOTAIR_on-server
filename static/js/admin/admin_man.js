
                // 네비게이션 스크립트
    document.addEventListener("DOMContentLoaded", function () {
        fetch("http://58.127.241.84:60119/api/member/status", {
                mcdethod: "GET",
                credentials:"include"
            })
            .then(response => response.json())
            .then(data => {
                const navbarMember = document.getElementById("navbar_member");
                navbarMember.innerHTML = "";  // 기존 내용 초기화
                if (data.is_authenticated) {
                    if (data.is_admin) {
                        // ✅ 관리자 계정
                        navbarMember.innerHTML = `
                            <li class="navbar_signup"><a href="http://58.127.241.84:60119/api/member/logout">로그아웃</a></li>
                            <li class="navbar_login"><a href="http://58.127.241.84:61080/admin/admin_man.html">회원정보</a></li>
                        `;
                    } else {
                        // ✅ 일반 로그인 사용자
                        navbarMember.innerHTML = `
                            <li class="navbar_signup"><a href="http://58.127.241.84:60119/api/member/logout">로그아웃</a></li>
                            <li class="navbar_login"><a href="http://58.127.241.84:61080/mypage/mypage.html">마이페이지</a></li>
                        `;
                    }
                } else {
                    // ✅ 비로그인 상태
                    navbarMember.innerHTML = `
                        <li class="navbar_signup"><a href="http://58.127.241.84:61080/member/member_email.html">회원가입</a></li>
                        <li class="navbar_login"><a href="http://58.127.241.84:61080/member/member_login.html">로그인</a></li>
                    `;
                }
            })
            .catch(error => console.error("사용자 상태 확인 중 오류 발생:", error));
    });

document.addEventListener("DOMContentLoaded", function () {
    console.log("📌 DOMContentLoaded 실행됨!");

    const togglebtn = document.querySelector('.navbar_togglebtn');
    const menu = document.querySelector('.navbar_menu');
    const member = document.querySelector('.navbar_member');

    if (togglebtn && menu && member) {
        togglebtn.addEventListener('click', () => {
            menu.classList.toggle('active');
            member.classList.toggle('active');
        });
    } else {
        console.error("❌ HTML 요소를 찾을 수 없습니다.");
    }

    fetchMembers();  // ✅ 회원 목록 불러오기
});

let members = [];
const itemsPerPage = 10;
let currentPage = 1;

async function fetchMembers() {
    try {
        const response = await fetch('http://58.127.241.84:60119/api/admin/get_members', {
           method: 'GET',
           credentials: 'include'
        });
        if (!response.ok) {
            throw new Error(`서버 응답 오류: ${response.status}`);
        }
        const data = await response.json();
        console.log("서버에서 받은 회원 목록:", data);

        // ✅ `members`가 배열인지 확인 후 저장
        if (Array.isArray(data.members)) {
            members = data.members;
        } else {
            console.error("❌ 서버 응답이 배열이 아님:", data);
            members = [];  // 오류 방지를 위해 빈 배열 설정
        }

        displayMembers();
        displayPagination();
    } catch (error) {
        console.error('회원 데이터를 가져오는 중 오류 발생:', error);
    }
}

function displayMembers() {
    const memberTable = document.getElementById("memberTable");
    memberTable.innerHTML = "";

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedMembers = members.slice(start, end);

    paginatedMembers.forEach(member => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${member.id}</td>
                <td><input type="text" value="${member.user_id}" readonly></td>
                <td><input type="text" value="${member.username}" readonly></td>
                <td><input type="text" value="${member.phone_number}" readonly></td>
                <td><input type="text" value="${member.email}" readonly></td>
                <td><button class="delete-btn" onclick="deleteMember(${member.id})" readonly>삭제</button></td>
        `;

        memberTable.appendChild(row);
    });
}

function displayPagination() {
    const pageNumbers = document.getElementById("pageNumbers");
    pageNumbers.innerHTML = "";

    const totalPages = Math.ceil(members.length / itemsPerPage);

    for (let i = 1; i <= totalPages; i++) {
        const pageSpan = document.createElement("span");
        pageSpan.textContent = i;
        pageSpan.classList.add("page-btn");
        if (i === currentPage) {
            pageSpan.classList.add("active-page");
        }
        pageSpan.addEventListener("click", () => {
            currentPage = i;
            displayMembers();
        });
        pageNumbers.appendChild(pageSpan);
    }

    document.getElementById("prevPage").style.display = currentPage > 1 ? "inline-block" : "none";
    document.getElementById("nextPage").style.display = currentPage < totalPages ? "inline-block" : "none";
}

async function deleteMember(id) {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
        //console.log("회원 삭제 요청: ID ${id}")'
        const response = await fetch('http://58.127.241.84:60119/api/admin/delete_member', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ id: id })
        });

        const result = await response.json();
        console.log("서버 응답:", result);

        if (response.ok) {
            alert(result.message);
            await fetchMembers();  // 삭제 후 목록 갱신
        } else {
            alert(result.error);
        }
    } catch (error) {
        console.error('회원 삭제 중 오류 발생:', error);
    }
}

document.getElementById("prevPage").addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        displayMembers();
    }
});

document.getElementById("nextPage").addEventListener("click", () => {
    const totalPages = Math.ceil(members.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayMembers();
    }
});

// 검색 기능
function searchMembers() {
    const input = document.getElementById("searchInput").value.toLowerCase();
    const rows = document.querySelectorAll("#memberTable tr");

    rows.forEach(row => {
        const rowText = row.innerText.toLowerCase();
        row.style.display = rowText.includes(input) ? "" : "none";
    });
}
