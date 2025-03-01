document.addEventListener("DOMContentLoaded", async function () {
    await fetchMembers();  // 페이지 로드 시 회원 목록 가져오기
});

let members = [];
const itemsPerPage = 10;
let currentPage = 1;

async function fetchMembers() {
    try {
        const response = await fetch('http://58.127.241.84:60119/api/admin/get_members');
        if (!response.ok) {
            throw new Error(`서버 응답 오류: ${response.status}`);
        }
        members = await response.json();
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
        const response = await fetch('http://58.127.241.84:60119/api/admin/delete_member', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });

        const result = await response.json();
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
