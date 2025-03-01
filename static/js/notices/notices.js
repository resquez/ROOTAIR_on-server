
document.addEventListener("DOMContentLoaded", function () {
    const itemsPerPage = 5;
    let currentPage = 1;
    let notices = [];

    function fetchNotices() {
        fetch("http://58.127.241.84:60119/api/notices/list?page=" + currentPage)
            .then(response => response.json())
            .then(data => {
                notices = data.notices;
                displayNotices();
                updatePagination(data.total_pages);
            })
            .catch(error => console.error("공지사항 데이터를 불러오는 중 오류 발생:", error));
    }

    function displayNotices() {
        const noticeList = document.getElementById("notice_list");
        noticeList.innerHTML = "";

        notices.forEach(notice => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>📢 공지사항</td>
                <td><a href="/notices/${notice.notice_id}" class="notice_link">${notice.title}</a></td>
                <td>${notice.created_at.split("T")[0]}</td>
            `;
            noticeList.appendChild(row);
        });
    }

    function updatePagination(totalPages) {
        const pageNumbers = document.getElementById("pageNumbers");
        pageNumbers.innerHTML = "";

        for (let i = 1; i <= totalPages; i++) {
            const pageSpan = document.createElement("span");
            pageSpan.textContent = i;
            pageSpan.classList.add("page-btn");
            if (i === currentPage) {
                pageSpan.classList.add("active-page");
            }
            pageSpan.addEventListener("click", () => {
                currentPage = i;
                fetchNotices();
            });
            pageNumbers.appendChild(pageSpan);
        }

        document.getElementById("prevPage").style.display = currentPage > 1 ? "inline-block" : "none";
        document.getElementById("nextPage").style.display = currentPage < totalPages ? "inline-block" : "none";
    }

    document.getElementById("prevPage").addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            fetchNotices();
        }
    });

    document.getElementById("nextPage").addEventListener("click", () => {
        fetch("http://58.127.241.84:60119/api/notices/list?page=" + (currentPage + 1))
            .then(response => response.json())
            .then(data => {
                if (data.notices.length > 0) {
                    currentPage++;
                    fetchNotices();
                }
            });
    });

    fetchNotices();
});


// 공지사항 등록 버튼 구현
function gosubmit() {
    window.location.href = "/notices/create";  // 공지 등록 페이지로 이동
}
