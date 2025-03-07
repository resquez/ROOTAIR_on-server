document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ 공지사항 수정 페이지 로드됨");

    const urlParams = new URLSearchParams(window.location.search);
    const noticeId = urlParams.get("notice_id");
    const apiUrl = `http://58.127.241.84:60119/api/notices/detail/${noticeId}`;
    const editApiUrl = `http://58.127.241.84:60119/api/notices/edit/${noticeId}`;

    if (!noticeId) {
        alert("❌ 공지사항 ID가 없습니다.");
        window.location.href = "/notices/notices.html";
        return;
    }

    // ✅ 기존 공지사항 데이터 불러오기
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert("❌ 공지사항을 찾을 수 없습니다.");
                window.location.href = "/notices/notices.html";
                return;
            }

            console.log("📌 기존 공지사항 데이터:", data);
            document.getElementById("title").value = data.title;
            document.getElementById("content").value = data.content;

            if (data.file_url) {
                document.getElementById("existingFile").textContent = data.file_url.split('/').pop();
                document.getElementById("existingFile").setAttribute("data-file-url", data.file_url);
            }
        })
        .catch(error => console.error("❌ 공지사항 불러오기 오류:", error));

    // ✅ 공지사항 수정 요청 (버튼 클릭 시 실행)
    document.getElementById("submit_btn").addEventListener("click", function (event) {
        event.preventDefault();  // 기본 제출 동작 방지
        updateNotice(noticeId, editApiUrl);
    });

    // ✅ 첨부 파일 업로드 버튼 동작
    document.getElementById("fileUploadBtn").addEventListener("click", function () {
        document.getElementById("file").click();
    });

    // ✅ 파일 선택 시 파일명 표시
    document.getElementById("file").addEventListener("change", function (event) {
        let fileInput = event.target;
        let fileNameDisplay = document.getElementById("fileNameDisplay");

        if (fileInput.files.length > 0) {
            fileNameDisplay.innerHTML = fileInput.files[0].name +
                ' <button type="button" id="removeFile">삭제</button>';
            addRemoveEvent();
        }
    });

    // ✅ 첨부파일 삭제 버튼 기능 추가
    addRemoveEvent();
});

// ✅ 공지사항 수정 요청 함수
function updateNotice(noticeId, editApiUrl) {
    console.log(`✏️ 공지사항 ID ${noticeId} 수정 요청`);

    const title = document.getElementById("title").value.trim();
    const content = document.getElementById("content").value.trim();

    if (!title || !content) {
        alert("❌ 제목과 내용을 입력하세요.");
        return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);

    const fileInput = document.getElementById("file");
    if (fileInput.files.length > 0) {
        formData.append("file", fileInput.files[0]);
    } else {
        // 기존 파일 유지
        const existingFile = document.getElementById("existingFile").getAttribute("data-file-url");
        if (existingFile) {
            formData.append("existing_file", existingFile);
        }
    }

    fetch(editApiUrl, {
        method: "POST",
        credentials: "include",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.redirect_url) {
            alert("✅ 공지사항이 수정되었습니다.");
            window.location.href = "/notices/notices.html";  // 🔹 공지사항 목록 페이지로 이동
        } else {
            alert("❌ 수정 실패: " + (data.error || "알 수 없는 오류"));
        }
    })
    .catch(error => console.error("❌ 공지사항 수정 오류:", error));
}

// ✅ 첨부파일 삭제 버튼 기능
function addRemoveEvent() {
    let removeBtn = document.getElementById("removeFile");
    if (removeBtn) {
        removeBtn.addEventListener("click", function () {
            document.getElementById("file").value = "";
            document.getElementById("fileNameDisplay").textContent = "선택된 파일 없음";

            let existingFile = document.getElementById("existingFile");
            if (existingFile) {
                existingFile.textContent = "";
                existingFile.removeAttribute("data-file-url");
            }
        });
    }
}
