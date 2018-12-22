// FIT2102 2018 Assignment 1
// https://docs.google.com/document/d/1woMAgJVf1oL3M49Q8N3E1ykTuTu5_r28_MQPVS5QIVo/edit?usp=sharing

/**
 * Added code in other files:
 * --- pong.html + elements in svg canvas
 * --- svgelement.ts + destroy()
 * --- observable.ts + finally() + take() + last()
 */

 /**
  * Main Pong function ensures that the right paddle follows each mouse move and calls the recursive Play function.
  */
function pong() {
  const svg = document.getElementById("canvas")!, rightPaddle = document.getElementById("rightPaddle")!

  // subscribe mouse move event update the right paddle position with the current mouse y-position
  Observable.fromEvent<MouseEvent>(svg, 'mousemove')
  .subscribe(({clientY}) => rightPaddle.setAttribute('y', String(clientY - Number(rightPaddle.getAttribute('height'))!/2)))

  // play the game :)
  play(svg)
}

/**
 * Generates either 1 or -1 randomly.
 * @return 1 or -1
 */
function randomPosOrNeg(): number {
  return Math.random() < 0.5 ? -1 : 1;
}

/**
 * Creates a new ball element with attributes for a random x-y location on the centre of the canvas.
 * @param svg canvas for the game
 * @return Elem of ellipse
 */
function newBall (svg: HTMLElement): Elem {
  const svgRect = svg.getBoundingClientRect(),
  ball = new Elem(svg, "ellipse").attr('cx', (svgRect.left + svgRect.right)/2).attr('cy', String(Math.random() * 500 + 50))
  .attr('rx', 10).attr('ry', 10).attr('fill', 'white').attr("id", "ball")
  return ball
}

/**
 * Recursive function of the Pong game. It consists of observables built upon the lowest level observable, gameTime,
 * which provides ticking for time in the game. The following describes the other observables used:
 * 
 * infiniteStream - emits the ball's x-y values at each tick
 * boundaryCondition - emits one and only one x-y value if the ball exits the svg canvas' x-boundary
 * finiteStream - emits ball's x-y values until boundaryCondition is met
 *              - subscribed to ensure the left paddle follows the postion of the ball
 *              - does clean-up of ball and recursive call of play() on completion
 *              - subscribed to update score with the final value emitted on completion 
 * gradient - emits x-y gradients for adding to a ball's x-y values to provide movement at each tick
 *          - when emitting, adjust gradient if ball needs to be bounced on paddles or top and bottom of svg canvas
 *          - subscribed to update the ball position with each new x-y gradient emitted 
 * 
 * The ball bounces off the ceiling and floor of the canvas with a perfect deflection of the y-gradient. For 
 * paddles, it bounces off with a deflection of the x-gradient and a randomly chosen y-gradient.
 * 
 * The left paddle follows the ball, incrementing its y-position by a constant value towards the direction
 * of the ball at each tick.
 * 
 * @param svg canvas for the game
 */
function play(svg: HTMLElement): void {
  // initialisation of constants to be used
  const ball = newBall(svg), svgRect = svg.getBoundingClientRect(), ballSize = Number(ball.attr("rx")), 
  leftPaddle = document.getElementById("leftPaddle")!, rightPaddle = document.getElementById("rightPaddle")!,
  paddleWidth = Number(leftPaddle.getAttribute("width")), paddleHeight = Number(leftPaddle.getAttribute("height"))
  
  // ticker for the game
  const gameTime = Observable.interval(1),
  // every tick of the timer observes the ball coordinates
  infiniteStream = gameTime.map(() => (({x: Number(ball.attr("cx")), y: Number(ball.attr("cy"))}))),
  // filter for instances where ball reaches left or right of svg
  boundaryCondition = infiniteStream.filter(({x}) => x + ballSize <= svgRect.left || x - ballSize >= svgRect.right).take(1)!,
  // games stops when the filter fires
  finiteStream = infiniteStream.takeUntil(boundaryCondition)

  // left paddle follows position of the ball
  finiteStream.map(({y}) => y).subscribe(ballY => ballY > Number(leftPaddle.getAttribute('y')) + paddleHeight/2 ?
  // increment or decrement y of paddle by fixed amount according to position of ball 
  leftPaddle.setAttribute("y", String(Number(leftPaddle.getAttribute('y')) + 0.5)):
  leftPaddle.setAttribute("y", String(Number(leftPaddle.getAttribute('y')) - 0.5)))

  // gradient observable is anonymous and immediately subscribed to
  Observable.interval(1).takeUntil(boundaryCondition)
  // initialising values for the gradient - it returns a gradient at each second
  .scan({gradX: randomPosOrNeg() * 1.5, gradY: randomPosOrNeg() * Math.random()}, 
  // ball bounces off paddles; stream of x-y coordinates update the gradient of the ball trajaectory
  ({gradX, gradY}, _) => (function (){
    // initialisation of values for positions of paddles and ball
    const rightX = Math.ceil(Number(rightPaddle.getAttribute("x"))), rightY = Math.ceil(Number(rightPaddle.getAttribute("y"))),
    leftX = Math.ceil(Number(leftPaddle.getAttribute("x")) + paddleWidth), leftY = Math.ceil(Number(leftPaddle.getAttribute("y"))),
    x = Number(ball.attr('cx')), y = Number(ball.attr('cy'))

    // bounce the ball off top and bottom of svg, reversing the direction of gradY
    if (y <= svgRect.top || y + ballSize >= svgRect.bottom){
      return {gradX, gradY: gradY * -1}
    }
    
    // bounce the ball on the opposite x-direction and on a random y-direction if the ball is within paddle range
    if ((Math.abs(x + ballSize - rightX) <= 1 && y >= rightY && y <= (rightY + paddleHeight)) || 
    (Math.abs(x - leftX) <= 1 && leftY <= y && y <= (leftY + paddleHeight))){
      // reverse the direction of the x-gradient and choose a random y-gradient 
      return {gradX: gradX * -1, gradY: randomPosOrNeg() * Math.random()}
    }else{
      // return the original gradient unchanged if it does not bounce off paddles
      return {gradX, gradY}
      }
    } ())
  )
  // move the ball according to gradient
  .subscribe(({gradX, gradY}) => (ball.attr('cx', String(gradX + Number(ball.attr('cx')))), 
  ball.attr("cy", String(gradY + Number(ball.attr('cy'))))))
  
  gameCleanUp(finiteStream, svg, ball, svgRect)
}

/**
 * On completion of each round of the game, destroy the ball, update the score, and either recursively call play() or indicate the winner.
 * 
 * @param finiteStream stream of x-y coordinates for the ball
 * @param svg canvas for the game
 * @param ball the ball element
 * @param svgRect the game's bounding coordinates
 */
function gameCleanUp(finiteStream: Observable<{x: number, y: number}>, svg: HTMLElement, ball: Elem, svgRect: ClientRect|DOMRect): void{
  const leftScore = document.getElementById("leftScore")!, rightScore = document.getElementById("rightScore")!, maxScore = 11,
  finishedColour = "red"

  // do the following things on game completion with the final value of the stream
  finiteStream.last().finally(() => (
    // destroy the ball so it no longer resides on the svg
    ball.destroy(svg), 
    // recursive call on play until max score has been hit
    Number(leftScore.innerHTML) < maxScore && Number(rightScore.innerHTML) < maxScore ? play(svg) : 
    // if the max score has been hit, change the color of the score of the winning side
    (Number(leftScore.innerHTML) >= maxScore ? leftScore.setAttribute("fill", finishedColour) :
    rightScore.setAttribute("fill", finishedColour))
  ))
  // update score on left or right panel based on final x-position of the ball
  .map(({x}) => x).subscribe(x => Math.ceil(Number(x)) >= svgRect.right ? leftScore.innerHTML = String(1 + Number(leftScore.innerHTML)) 
  : rightScore.innerHTML = String(1 + Number(rightScore.innerHTML))) 
}

// the following simply runs your pong function on window load.  Make sure to leave it in place.
if (typeof window != 'undefined')
  window.onload = () => {
    pong();
}
