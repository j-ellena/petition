console.log("client script");

// *****************************************************************************

function highlightNav() {
    const url = location.href.toLowerCase();
    const links = $(".nav li a");
    let matchedFlag = false;

    links.each(function() {
        const linkUrl = this.href.toLowerCase();

        if (url === linkUrl) {
            matchedFlag = true;

            $("li.current").removeClass("current");
            $(this)
                .parent()
                .addClass("current");
        }
    });

    if (matchedFlag === false) {
        $("li.current").removeClass("current");
    }
}

highlightNav();

// *****************************************************************************

const canvas = $("#canvas");
const ctx = canvas[0].getContext("2d");
const hiddenInput = $("#hidden-input");
const buttonClear = $("#button-clear");

const pointSize = 2;
ctx.fillStyle = "red";
ctx.strokeStyle = "red";
ctx.lineWidth = 3;
ctx.lineJoin = "round";

let x, y;

// *****************************************************************************

canvas.on("mousedown", e => {
    drawPoint(e);

    canvas.on("mousemove", e => {
        drawLine(e);
    });
});

canvas.on("mouseup", () => {
    canvas.off("mousemove");
    hiddenInput.val(canvas[0].toDataURL());
});

buttonClear.on("click", () => {
    ctx.clearRect(0, 0, canvas[0].width, canvas[0].height);
});

// *****************************************************************************

function getXY(e) {
    const rect = canvas[0].getBoundingClientRect();
    x = e.clientX - rect.left;
    y = e.clientY - rect.top;
}

function drawPoint(e) {
    ctx.beginPath();
    getXY(e);
    ctx.arc(x, y, pointSize, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.closePath();
}

function drawLine(e) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    getXY(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.closePath();
}

// *****************************************************************************
