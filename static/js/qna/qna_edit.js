document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ 페이지 로드됨!");
    const urlParams = new URLSearchParams(window.location.search);
    const qnaId = urlParams.get("id");  // ✅ 여기 반드시 "id"
    console.log("✅ 가져온 qnaId:", qnaId);
    if (!qnaId) {
        alert("문의사항 ID가 없습니다.");
        //window.location.href = "http://58.127.241.84:61080/qna/qna.html";
        return;
    }

    const form = document.getElementById("qnaForm");
    form.setAttribute("data-qna-id", qnaId);

    // ✅ 문의사항 상세 조회
    fetch(`http://58.127.241.84:60119/api/qna/detail/${qnaId}`, {
	method: "GET",
    	credentials: "include" 
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert("문의사항을 찾을 수 없습니다.");
               // window.location.href = "http://58.127.241.84:61080/qna/qna.html";
                return;
            }

            document.getElementById("title").value = data.title;
            document.getElementById("content").value = data.content;
            document.getElementById("private").checked = data.is_secret;

            if (data.file_url) {
                document.getElementById("fileNameDisplay").innerHTML = `
                    <span id="existingFile">${data.file_url.split('/').pop()}</span>
                    <button type="button" id="removeFile">삭제</button>
                `;
                addRemoveEvent();
            }
        })
        .catch(error => console.error("문의사항 불러오기 오류:", error));

    document.getElementById("fileUploadBtn").addEventListener("click", function () {
        document.getElementById("file").click();
    });

    document.getElementById("file").addEventListener("change", function (event) {
        let fileInput = event.target;
        let fileNameDisplay = document.getElementById("fileNameDisplay");

        if (fileInput.files.length > 0) {
            fileNameDisplay.innerHTML = fileInput.files[0].name +
                ' <button type="button" id="removeFile">삭제</button>';
            addRemoveEvent();
        }
    });

    function addRemoveEvent() {
        let removeBtn = document.getElementById("removeFile");
        if (removeBtn) {
            removeBtn.addEventListener("click", function () {
                document.getElementById("file").value = "";
                document.getElementById("fileNameDisplay").textContent = "선택된 파일 없음";
            });
        }
    }

    document.getElementById("qnaForm").addEventListener("submit", function (event) {
        event.preventDefault();

        let formData = new FormData();
        formData.append("title", document.getElementById("title").value);
        formData.append("content", document.getElementById("content").value);
        formData.append("isPrivate", document.getElementById("private").checked ? "true" : "false");

        let fileInput = document.getElementById("file");
        if (fileInput.files.length > 0) {
            formData.append("file", fileInput.files[0]);
        }

        fetch(`http://58.127.241.84:60119/api/qna/edit/${qnaId}`, {
            method: "POST",
            body: formData,
            credentials: "include"
        })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    alert(data.message);
                    window.location.href = "http://58.127.241.84:61080/qna/qna.html";
                } else {
                    alert("문의 등록 실패: " + data.error);
                }
            })
            .catch(error => console.error("에러 발생:", error));
    });
});

