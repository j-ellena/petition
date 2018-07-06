console.log("sanity-check");

const canvas = $("#canvas");
const ctx = canvas[0].getContext("2d");
const buttonClear = $("#button-clear");
const hiddenInput = $("#hidden-input");

ctx.strokeStyle = "purple";
ctx.lineJoin = "round";
ctx.lineWidth = 2;

let click = {
    x: [],
    y: [],
    dragging: []
};
let drawing = false;

canvas.on("mousedown", function(e) {
    drawing = true;
    const offset = $(this).offset();
    click.x.push(e.pageX - offset.left);
    click.y.push(e.pageY - offset.top);
    click.dragging.push(false);
    redraw();
});

canvas.on("mousemove", function(e) {
    if (drawing) {
        const offset = $(this).offset();
        click.x.push(e.pageX - offset.left);
        click.y.push(e.pageY - offset.top);
        click.dragging.push(true);
        redraw();
    }
});

canvas.on("mouseup", function() {
    hiddenInput.val(canvas[0].toDataURL());
    drawing = false;
});

function redraw() {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    for (let i = 0; i < click.x.length; i++) {
        ctx.beginPath();
        if (click.dragging[i] && i) {
            ctx.moveTo(click.x[i - 1], click.y[i - 1]);
        } else {
            ctx.moveTo(click.x[i], click.y[i]);
        }
        ctx.lineTo(click.x[i], click.y[i]);
        ctx.closePath();
        ctx.stroke();
    }
}

buttonClear.on("click", () => {
    ctx.clearRect(0, 0, canvas[0].width, canvas[0].height);
    click.x = [];
    click.y = [];
    click.dragging = [];
});
