import React from 'react';
import ReactDOM from 'react-dom';
import "./Sudoku.css";

// GENERAL
function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

// SUDOKU FUNCTIONS
function coord_tostring(i,j){
  return "(" + i + ","+ j +")";
}

// Makes a deep copy
function my_deep_copy(b){
  var newboard = [];
  b.forEach(
    (row) =>{
      var new_row;
      if(Array.isArray(row)){
        new_row = [];
        row.forEach(
          (num) => {
            new_row.push(num);
          }
        )
      } else {
        // It is an obj
        new_row = {};
        Object.assign(new_row, row); 
      }
      newboard.push(new_row);
    }
  )
  return newboard;
}

function make_board(s){
  var arr;
  arr = new Array(9)
  for (var i = 0; i < arr.length; i++){
    arr[i] = new Array(9).fill(0);
  }
  // Preset boards
  // EASY
  if(s === "easy"){
    arr = [
      [0,0,0,2,6,0,7,0,1],
      [6,8,0,0,7,0,0,9,0],
      [1,9,0,0,0,4,5,0,0],
      [8,2,0,1,0,0,0,4,0],
      [0,0,4,6,0,2,9,0,0],
      [0,5,0,0,0,3,0,2,8],
      [0,0,9,3,0,0,0,7,4],
      [0,4,0,0,5,0,0,3,6],
      [7,0,3,0,1,8,0,0,0]
    ];
  }
  // HARD
  if(s === "hard"){
    arr = [
      [4,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,9,0,0,0],
      [0,0,0,0,0,0,7,8,5],
      [0,0,7,0,4,8,0,5,0],
      [0,0,1,3,0,0,0,0,0],
      [0,0,6,0,7,0,0,0,0],
      [8,6,0,0,0,0,9,0,3],
      [7,0,0,0,0,5,0,6,2],
      [0,0,3,7,0,0,0,0,0],
    ];
  }
    // HARD2
    if(s === "hard2"){
      arr = [
        [0,0,0,7,0,0,0,0,0],
        [1,0,0,0,0,0,0,0,0],
        [0,0,0,4,3,0,2,0,0],
        [0,0,0,0,0,0,0,0,6],
        [0,0,0,5,0,9,0,0,0],
        [0,0,0,0,0,0,4,1,8],
        [0,0,0,0,8,1,0,0,0],
        [0,0,2,0,0,0,0,5,0],
        [0,4,0,0,0,0,3,0,0],
      ];
    }
  return arr
}

// Make a record of legal moves for every square
// Returns a Map object with the key in the form "1s":
function compute_constraint_board(board){
  var cb = new Map();
  var square_space;
  var dead_flag = false;
  var c_key;
  for (var i = 0; i < board.length; i++){
    for(var j = 0; j < board[i].length; j++){
      square_space = get_legal(i,j,board);      
      if (square_space.length < 1 && board[i][j] === 0){
        // If there are no more legal moves, and the square is unfilled
        dead_flag = true;
      }
      c_key = square_space.length;
      if (!cb.has(c_key)){cb.set(c_key,[]);} // If absent, create
      cb.get(c_key).push({coords: [i,j], move_space: square_space});
    }
  }
  return {map: cb, dead: dead_flag}
}

function printCB(cb){
  console.log("PRINTING CB")
  console.log("DEAD FLAG: " + cb.dead);
  const m = cb.map;
  var move_group;
  for(let key of m.keys()){
    move_group = m.get(key);
    console.log("MOVE GROUP: " + key);
    for(let sq of move_group){
      console.log(sq.coords + "|" + sq.move_space);
    }
  }
}

function compare_boards(bo, bt){
  // return 1;
  for(var i = 0; i < bo.length; i++){
    for(var j = 0; j < bo[i].length; j++){
      if(!(bo[i][j] === bt[i][j])){
        console.log("Difference at " + coord_tostring(i,j) + " 1: " + bo[i][j] + " 2: " + bt[i][j]);
      }
    }
  }
  console.log("Finished comparison")
}

function get_col(c, board){
  let col = new Array(9).fill(0);
  for(var i = 0; i < board.length; i++){
    // Get the c'th index element in each row
    col[i] = board[i][c]; 
  }
  return col
}

function get_row(r, board){
  if(r > board.length){
    return new Array(9).fill(0);
  }
  return board[r];
}

function get_nine(x,y,board){
  let nine = new Array(9).fill(0);
  let coords = new Array(9).fill('');
  const x_offset = Math.floor(x/3) * 3;
  const y_offset = Math.floor(y/3) * 3;
  for(var i = 0; i < 3; i++){
    for(var j = 0; j < 3; j++){
      // Get the grid around which the
      coords[3*i+j] = coord_tostring(x_offset+i, y_offset+j);
      // console.log("x"+ x + "y" + y + "|||"+ x_offset + "; " + y_offset + "; " + coords[3*i+j]);
      nine[3*i+j] = board[(x_offset + i)][(y_offset + j)]; 
    }
  }

  return nine
}

function get_constraints(x, y, board){
  if(board[x][y] > 0){
    return [1,2,3,4,5,6,7,8,9]
  }
  const col = get_col(y, board);
  const row = get_row(x, board);
  const nine = get_nine(x, y, board);
  const constraints = [].concat(col, row, nine);
  return constraints
}

// Checks if the number in a space is legal
function check_legal(val, x, y, board){
  if(val === 0){return true;} // It is always legal to turn a number into a 0
  const constraints = get_constraints(x, y, board);
  return (!constraints.includes(val,0))
}

// Returns a list of legal moves.
// AKA gets the constraint space
function get_legal(x, y, board){
  const constraints = get_constraints(x, y, board);
  // console.log("<GET LEGAL> constraints " + constraints);
  let all_moves = [1,2,3,4,5,6,7,8,9]
  if(constraints.length === all_moves.length){
    return [];
  }
  let remaining_moves = [];
  all_moves.forEach(n => {
      if(!constraints.includes(n,0)){
        remaining_moves.push(n);
      }
    }
  )
  return remaining_moves
}

// Count the remaining blank spaces
function countRemaining(grid){
  var count = 0;
  grid.forEach( 
    row =>{
      row.forEach (
        element => {if(element === 0){count++;}}
      )
    })
  return count;
}

function check_win(grid){
  return (countRemaining(grid) === 0);
}



// REACT things
// Sudoku Square as a text form
function Square(props) {
  const square_classes = ["Square Square-normal","Square Square-highlighted","Square Square-red"];
  return (
    <form>
      <input 
        className={square_classes[props.hl_flag]}
        type="text" 
        maxLength="1"
        value={props.value}
        onChange={props.e_onChange}
        
      />
    </form>
  );
}

class Board extends React.Component {
  // Define the function to render a square
  renderSquare(i,j, hl_flag){
    return (
      <Square
        key={i.toString() + "," + j.toString()}
        value={this.props.grid[i][j] > 0 ? this.props.grid[i][j] : ""}
        hl_flag={hl_flag}
        e_onClick={() => this.props.onClick(i,j)}
        e_onChange={(event) => this.props.onChange(i,j,event)}
        e_onSubmit={(event) => this.props.onSubmit(i,j,event)}
      />
    );
  }

  renderGrid(grid){
    const hl_map = this.props.hl_map;
    var hl_flag;
    var getted;
    let grid_render = Array(9);
    for(var i = 0; i < grid.length; i++){
      let row_render = Array(9)
      for(var j = 0; j < grid[i].length; j++){
        getted = hl_map.get(coord_tostring(i,j));
        hl_flag = ( getted === undefined ? 0 : getted);
        row_render[j] = this.renderSquare(i,j,hl_flag);
      }
      grid_render[i] = row_render;
    }
    return grid_render;
  }

  // Very shameful display of hardcode here
  render(){
    const grid = this.renderGrid(this.props.grid);

    return(
      <div>
        <div className="grid-row">
          {grid[0]}
        </div>
        <div className="grid-row">
          {grid[1]}
        </div>
        <div className="grid-row">
          {grid[2]}
        </div>
        <div className="grid-row">
          {grid[3]}
        </div>
        <div className="grid-row">
          {grid[4]}
        </div>
        <div className="grid-row">
          {grid[5]}
        </div>
        <div className="grid-row">
          {grid[6]}
        </div>
        <div className="grid-row">
          {grid[7]}
        </div>
        <div className="grid-row">
          {grid[8]}
        </div>
      </div>
    );
  }
}

var GLOBAL_cycles = 0;
var GLOBAL_backtracks = 0;

class Sudoku extends React.Component {
  constructor(props) {
    super(props);
    const board = make_board("no_settings");
    this.state = {
      highlights:new Map(),
      snapshots:[],
      history:[{grid:board}], 
      grid:board, 
      remaining:countRemaining(board),
      gameover:false
    };
  }

  set_up_game(setting){
    const board = make_board(setting)
    this.setState({
      highlights:new Map(),
      history: [{grid:board}], 
      grid: board, 
      remaining:countRemaining(board),
      gameover:false
    });
  }

  add_snapshot(x,y,v){
    this.state.snapshots.push(new Array(x,y,v));
  }

  unroll_snapshots(){
    var delay = 100;
    var curr_ss;
    if(this.state.snapshots.length > 600){
      delay = 50;
    } 
    const timing = this.state.snapshots.length * delay / 1000
    console.log("Number of snapshots: " + this.state.snapshots.length + " Replay timing: " + timing + "s");

    function unroll(snapshots, ss_func){
      if(snapshots.length < 1){
        return 0
      }
      curr_ss = snapshots.shift();
      // console.log("snapshot: " + curr_ss);
      ss_func(curr_ss[0], curr_ss[1], curr_ss[2]);
      setTimeout(()=>{unroll(snapshots, ss_func)},delay);
    }
    unroll(this.state.snapshots, (x,y,v) => {this.updateGrid(x,y,v)})
  }

  updateGrid(x,y,val){
    const oldgrid = my_deep_copy(this.state.grid);
    var history = this.state.history;
    const beforelen = history.length;
    // Push in the OLD grid!
    // If not, the first undo will always have no effect because you
    // revert to the state you are currently on!
    history.push({
      grid:oldgrid, 
      remaining: this.state.remaining
    });
    this.state.grid[x][y] = val;
    // For debugging deep copying
    // console.log("Comparing updategrid");
    // compare_boards(oldgrid, this.state.grid);
    const hl_type = (val === 0 ? 2 : 1); // 2 = red, 1 = blue
    const remainingCount = countRemaining(this.state.grid);
    this.setState({
      highlights:new Map().set(coord_tostring(x,y), hl_type),
      grid: this.state.grid,
      history:history,
      remaining: remainingCount,
      gameover:(remainingCount === 0)
    });
    // console.log("History Length Before: " + beforelen + " After " + this.state.history.length);
  }

  handleChange(i, j, event){
    var newval = parseInt(event.target.value,10);
    if(isNaN(newval)){
      newval = 0;
    }
    newval = ((newval === "" || newval === " ") ? 0 :newval); // Make sure blanks are converted 

    if(check_legal(newval,i,j,this.state.grid)){
      this.updateGrid(i,j,newval);
    } else {
      console.log(newval + " cannot be placed at " + coord_tostring(i,j));
    }
  }

  goto_last_move(){
    if(this.state.history.length < 1){
      return false;
    } 
    const history = this.state.history; // Intentionally mutate it in interest of saving computation time
    const prev = history.pop();
    const prev_remain = countRemaining(prev.grid);
    console.log("GOING BACK A MOVE! Comparing before and after");
    compare_boards(this.state.grid, prev.grid);

    // We don't call updateGrid because that would increase history
    this.setState({
      grid:prev.grid,
      history:history,
      remaining:prev_remain,
      gameover:(prev_remain===0)
    });

    return 1;
  }

  solve_board_wrapper(){
    GLOBAL_cycles = 0;
    GLOBAL_backtracks = 0;
    const result = this.iter_solve_board(this.state.grid);
    this.unroll_snapshots();

    if(!result){
      console.log("No solution found! Processed: " + GLOBAL_cycles + " steps | " + GLOBAL_backtracks + " backtracks");
      return false;
    } else {
      console.log("Solved in " + GLOBAL_cycles + " steps | " + GLOBAL_backtracks + " backtracks");
      return result;
    }
  }

  // Solves a board of sudoku
  iter_solve_board(board){
    var steps = [];
    var inital_board;
    var curr_board = my_deep_copy(board);
    var curr_cb = compute_constraint_board(curr_board);
    var curr_movespace;
    var min_space;
    var bx = 0;
    var by = 0;
    var move;
    var curr_square;
    var next_cb;
    var initial_val;
    var curr_map;
    var move_group;
    var firststep; 
    var prev_step;
    
    while(true){
      inital_board = my_deep_copy(curr_board);
      // Exit condition for success
      if(check_win(curr_board)){return curr_board;}

      // Get the smallest non zero space
      curr_map = curr_cb.map;
      // Starts at 1 to only look at squares that have a legal move
      for (var i = 1; i < 10; i++) {
        if(curr_map.has(i)){
          // move_group is an array of {coords, move_space} that all share the same movespace size
          move_group = curr_map.get(i);
          if(move_group.length > 0){
            min_space = i;
            break;
          }
        }
      }
      
      // Find most constrained square
      // pop from the move_group (last element)
      curr_square = move_group.pop();
      curr_movespace = curr_square.move_space;
      bx = curr_square.coords[0];
      by = curr_square.coords[1];

      // Solve
      initial_val = curr_board[bx][by];
      firststep = true
      while(firststep || next_cb.dead){
        firststep = false;
        if(curr_movespace.length < 1){
          // If you ran out of moves
          if(steps.length > 0){
            // Backtrack
            GLOBAL_backtracks++;
            prev_step = steps.pop()
            curr_board = prev_step.board; // Reset board
            curr_cb = compute_constraint_board(curr_board); // Compute constraints
            curr_movespace = prev_step.movespace;
            curr_square = prev_step.square;
            bx = curr_square.coords[0];
            by = curr_square.coords[1];
            this.add_snapshot(bx,by,0);
          } else {
            // Exit condition for failure
            return false;
          }
        }

 
        
        if(curr_movespace.length > 0){
          // If you can still make moves, try a move
          GLOBAL_cycles++;
          if(GLOBAL_cycles > 5000){
            alert("Global cycle limit reached: " + GLOBAL_cycles);
            return false;
          }
          move = curr_movespace.pop();         
          // console.log("LOOPING " + coord_tostring(bx,by) + " Available moves: " + curr_movespace)
          curr_board[bx][by] = move; // Update board with new move
          // console.log("PLACING " + move + " at " + coord_tostring(bx,by) + " Initial cell value: " + initial_val)
          next_cb = compute_constraint_board(curr_board); // Look ahead to check for dead end!   
        }
      }

      // Next step is OK
      // We store the state of the board BEFORE the move is made
      // So that when we backtrack, we land on the state before our move!
      const curr_step = {
        square:curr_square,
        board: my_deep_copy(inital_board),
        movespace: curr_movespace
      }
      steps.push(curr_step);

      curr_cb = next_cb;
      
      this.add_snapshot(bx,by,move);
    }

    // If you run out of moves after a backtrack.
    // RESTRUCTURE THIS
    // if (curr_movespace.length < 1){
    //   if(steps.length > 0){
    //     // Backtrack
    //     GLOBAL_backtracks++;
    //     console.log("OUT OF MOVES! BACKTRACKING! Step: " + steps.length);
    //     const prev_step = steps.pop()
    //     curr_board = prev_step.board;
    //     curr_cb = compute_constraint_board(curr_board);
    //     curr_movespace = prev_step.movespace;
    //     console.log("BACKTRACKED MOVESPACE: <" + prev_step.movespace + ">");
    //   } else {
    //     // Exit condition for failure
    //     return false;
    //   }
    // }
  
  }

  render() {
    // console.log("Rendering!!!")
    const remain_text = "Remaining: " + this.state.remaining.toString(10);
    const gameover_text = (this.state.gameover ? "YOU WIN!" : "");
    return (
      <div className="game">
        <div className="game-board">
          <Board
            grid={this.state.grid}
            hl_map = {this.state.highlights}
            onClick={(i,j) => this.handleClick(i,j)}
            onChange={(i,j,e) => this.handleChange(i,j,e)}
            />
        </div>
        <div className="game-info">
          <div>{remain_text}</div>
          <div>{gameover_text}</div>
          <button className="solve-button" onClick={()=>this.solve_board_wrapper()}>
            Solve!
          </button>
          <button className="undo-button" onClick={()=>this.goto_last_move()}>
            Undo!
          </button>
          <button className="easy-button" onClick={()=>this.set_up_game('easy')}>
            Easy Board
          </button>
          <button className="hard-button" onClick={()=>this.set_up_game('hard')}>
            Hard Board
          </button>
          <button className="hard2-button" onClick={()=>this.set_up_game('hard2')}>
            Hard Board 2
          </button>
          <button className="blank-button" onClick={()=>this.set_up_game()}>
            Blank Board
          </button>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<Sudoku />, document.getElementById("root"));

export default Sudoku;
