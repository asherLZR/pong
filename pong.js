"use strict";
function pong() {
    const svg = document.getElementById("canvas"), rightPaddle = document.getElementById("rightPaddle");
    Observable.fromEvent(svg, 'mousemove')
        .subscribe(({ clientY }) => rightPaddle.setAttribute('y', String(clientY - Number(rightPaddle.getAttribute('height')) / 2)));
    play(svg);
}
function randomPosOrNeg() {
    return Math.random() < 0.5 ? -1 : 1;
}
function newBall(svg) {
    const svgRect = svg.getBoundingClientRect(), ball = new Elem(svg, "ellipse").attr('cx', (svgRect.left + svgRect.right) / 2).attr('cy', String(Math.random() * 500 + 50))
        .attr('rx', 10).attr('ry', 10).attr('fill', 'white').attr("id", "ball");
    return ball;
}
function play(svg) {
    const ball = newBall(svg), svgRect = svg.getBoundingClientRect(), ballSize = Number(ball.attr("rx")), leftPaddle = document.getElementById("leftPaddle"), rightPaddle = document.getElementById("rightPaddle"), paddleWidth = Number(leftPaddle.getAttribute("width")), paddleHeight = Number(leftPaddle.getAttribute("height"));
    const gameTime = Observable.interval(1), infiniteStream = gameTime.map(() => (({ x: Number(ball.attr("cx")), y: Number(ball.attr("cy")) }))), boundaryCondition = infiniteStream.filter(({ x }) => x + ballSize <= svgRect.left || x - ballSize >= svgRect.right).take(1), finiteStream = infiniteStream.takeUntil(boundaryCondition);
    finiteStream.map(({ y }) => y).subscribe(ballY => ballY > Number(leftPaddle.getAttribute('y')) + paddleHeight / 2 ?
        leftPaddle.setAttribute("y", String(Number(leftPaddle.getAttribute('y')) + 0.5)) :
        leftPaddle.setAttribute("y", String(Number(leftPaddle.getAttribute('y')) - 0.5)));
    Observable.interval(1).takeUntil(boundaryCondition)
        .scan({ gradX: randomPosOrNeg() * 1.5, gradY: randomPosOrNeg() * Math.random() }, ({ gradX, gradY }, _) => (function () {
        const rightX = Math.ceil(Number(rightPaddle.getAttribute("x"))), rightY = Math.ceil(Number(rightPaddle.getAttribute("y"))), leftX = Math.ceil(Number(leftPaddle.getAttribute("x")) + paddleWidth), leftY = Math.ceil(Number(leftPaddle.getAttribute("y"))), x = Number(ball.attr('cx')), y = Number(ball.attr('cy'));
        if (y <= svgRect.top || y + ballSize >= svgRect.bottom) {
            return { gradX, gradY: gradY * -1 };
        }
        if ((Math.abs(x + ballSize - rightX) <= 1 && y >= rightY && y <= (rightY + paddleHeight)) ||
            (Math.abs(x - leftX) <= 1 && leftY <= y && y <= (leftY + paddleHeight))) {
            return { gradX: gradX * -1, gradY: randomPosOrNeg() * Math.random() };
        }
        else {
            return { gradX, gradY };
        }
    }()))
        .subscribe(({ gradX, gradY }) => (ball.attr('cx', String(gradX + Number(ball.attr('cx')))),
        ball.attr("cy", String(gradY + Number(ball.attr('cy'))))));
    gameCleanUp(finiteStream, svg, ball, svgRect);
}
function gameCleanUp(finiteStream, svg, ball, svgRect) {
    const leftScore = document.getElementById("leftScore"), rightScore = document.getElementById("rightScore"), maxScore = 11, finishedColour = "red";
    finiteStream.last().finally(() => (ball.destroy(svg),
        Number(leftScore.innerHTML) < maxScore && Number(rightScore.innerHTML) < maxScore ? play(svg) :
            (Number(leftScore.innerHTML) >= maxScore ? leftScore.setAttribute("fill", finishedColour) :
                rightScore.setAttribute("fill", finishedColour))))
        .map(({ x }) => x).subscribe(x => Math.ceil(Number(x)) >= svgRect.right ? leftScore.innerHTML = String(1 + Number(leftScore.innerHTML))
        : rightScore.innerHTML = String(1 + Number(rightScore.innerHTML)));
}
if (typeof window != 'undefined')
    window.onload = () => {
        pong();
    };
//# sourceMappingURL=pong.js.map