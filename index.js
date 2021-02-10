const {Engine, Runner, Render, World, Bodies, Body, Events} = Matter;

const cellsHorizontal = 14;
const cellsVertical = 10;
const width = window.innerWidth;
const height = window.innerHeight;

const unitLengthX = width / cellsHorizontal;
const unitLengthY = height / cellsVertical;

const engine = Engine.create();
engine.world.gravity.y = 0;
const {world} = engine;
const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    wireframes: false,
    width,
    height
  }
});
Render.run(render);
Runner.run(Runner.create(), engine);


// Walls
const walls = [
  Bodies.rectangle(
    width / 2, 0, width, 2, {isStatic: true}
  ),
  Bodies.rectangle(
    width / 2, height, width, 2, {isStatic: true}
  ),
  Bodies.rectangle(
    0, height / 2, 2, height, {isStatic: true}
  ),
  Bodies.rectangle(
    width, height / 2, 2, height, {isStatic: true}
  )
];
World.add(world, walls);

// Maze Generation

const shuffle = (arr) => {
  let counter = arr.length;

  while (counter > 0) {
    const idx = Math.floor(Math.random() * counter);

    counter --;

    const temp = arr[counter];
    arr[counter] = arr[idx];
    arr[idx] = temp;
  }

  return arr;
};

const grid = Array(cellsVertical)
  .fill(null)
  .map(() => Array(cellsHorizontal).fill(false));

const verticals = Array(cellsVertical)
  .fill(null)
  .map(() => Array(cellsHorizontal - 1).fill(false));

const horizontals = Array(cellsVertical - 1)
  .fill(null)
  .map(() => Array(cellsHorizontal).fill(false));


const startRow = Math.floor(Math.random() * cellsVertical);
const startColumn = Math.floor(Math.random() * cellsHorizontal);

const recurse = (row, column) => {
  if (grid[row][column]) {
    return;
  }
  grid[row][column] = true;

  const neighbours = shuffle([
    [row - 1, column, 'up'],
    [row, column + 1, 'right'],
    [row + 1, column, 'down'],
    [row, column - 1, 'left']
  ]);

  for (let neighbour of neighbours) {
    const [nextRow, nextColumn, direction] = neighbour;

    if (nextRow < 0 || nextRow >= cellsVertical || nextColumn < 0 || nextColumn >= cellsHorizontal) {
      continue;
    }

    if (grid[nextRow][nextColumn]) {
      continue;
    }

    if (direction === 'left') {
      verticals[row][column - 1] = true;
    } else if (direction === 'right') {
      verticals[row][column] = true;
    } else if (direction === 'up') {
      horizontals[row - 1][column] = true;
    } else if (direction === 'down') {
      horizontals[row][column] = true;
    }

    recurse(nextRow, nextColumn);
  }

};

recurse(startRow, startColumn);

horizontals.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (open) {
      return;
    }

    const wall = Bodies.rectangle(
      columnIndex * unitLengthX + unitLengthX / 2,
      rowIndex * unitLengthY + unitLengthY,
      unitLengthX,
      5,
      {
        label: 'wall', 
        isStatic: true,
        render: {fillStyle: '#005377'}
      }
    );
    World.add(world, wall);
  });
});

verticals.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (open) {
      return;
    }

    const wall = Bodies.rectangle(
      columnIndex * unitLengthX + unitLengthX,
      rowIndex * unitLengthY + unitLengthY / 2,
      5,
      unitLengthY,
      {
        label: 'wall', 
        isStatic: true,
        render: {fillStyle: '#005377'}
      }
    );
    World.add(world, wall);
  });
});

// Goal

const goal = Bodies.rectangle(
  width - unitLengthX / 2,
  height - unitLengthY / 2,
  unitLengthX * .7,
  unitLengthY * .7,
  {
    label: 'goal', 
    isStatic: true,
    render: {fillStyle: '#417B5A'}
  }
);
World.add(world, goal);

// Ball

const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
const ball = Bodies.circle(
  unitLengthX / 2,
  unitLengthY / 2,
  ballRadius,
  {
    label: 'ball',
    render: {fillStyle: '#052F5F'}
  }
);
World.add(world, ball);

document.addEventListener('keydown', ({keyCode}) => {
  const {x, y} = ball.velocity;
  console.log(x, y);
  if (keyCode === 38) {
    Body.setVelocity(ball, {x, y: y - 5});
  }

  if (keyCode === 39) {
    Body.setVelocity(ball, {x: x + 5, y});
  }

  if (keyCode === 40) {
    Body.setVelocity(ball, {x, y: y + 5});
  }

  if (keyCode === 37) {
    Body.setVelocity(ball, {x: x - 5, y});
  }
});

// Win

Events.on(engine, 'collisionStart', ({pairs}) => {
  pairs.forEach((collision) => {
    const labels = ['goal', 'ball'];

    if (labels.includes(collision.bodyA.label) && labels.includes(collision.bodyB.label)) {
      document.querySelector('.winner').classList.remove('hidden');
      world.gravity.y = 1;
      world.bodies.forEach((body) => {
        if (body.label === 'wall') {
          Body.setStatic(body, false);
        }
      });
    }
  });
});