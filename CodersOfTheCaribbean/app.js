const OFFSETS = [[{x:1,y:0},{x:0,y:-1},{x:-1,y:-1},{x:-1,y:0},{x:-1,y:1},{x:0,y:1}],
                 [{x:1,y:0},{x:1,y:-1},{x:0,y:-1},{x:-1,y:0},{x:0,y:1},{x:1,y:1}]];
//Game entities
var Ship = function(id,x,y,orientation,speed, rhum){
  this.id = id;
  this.x = x;
  this.y = y;
  this.orientation = orientation;
  this.speed = speed;
  this.rhum = rhum;

  this.cx=0;
  this.cy=0;
  this.cz=0;

  this.findGridPosition = function(){
    var _c = toCube(this.x, this.y);
    this.cx = _c[0];
    this.cy = _c[1];
    this.cz = _c[2];
  };

  this.getBowPos = function(){
     var _off = getOffset(this.orientation, this.y);
     return {x:this.x + _off.x,y:this.y + _off.y};
  };

  this.getSternPos = function(){
      var _opposite = this.orientation > 2 ? this.orientation -3 : this.orientation +3;
      var _off = getOffset(_opposite, this.y);
     return {x:this.x + _off.x,y:this.y + _off.y};
  };

  /*
   Bow-->> <0  1   2 |   <<-- Stern
  */
  this.willBeShot = function(cBall){
      if(cBall.eta == 1){
           var _bow = this.getBowPos();
            var _stern = this.getSternPos();
            if(cBall.x == _stern.x && cBall.y == _stern.y) return 2;
            if(cBall.x == _bow.x && cBall.y == _bow.y) return 0;
            if(cBall.x == this.x && cBall.y == this.y) return 1;

      }

      return -1;
  }

  this.isBlocking = function(aShip){
      var _bow = this.getBowPos();
      var _stern = this.getSternPos();

      for(var s=1; s<=aShip.speed+1; s++){
          var _futurPos = aShip.interpPos(s);
          if(   (_futurPos.x == _bow.x && _futurPos.y == _bow.y) ||
                (_futurPos.x == _stern.x && _futurPos.y == _stern.y) ||
                (_futurPos.x == this.x && _futurPos.y == this.y)){
                    return true;
                }
      }
      return false;
  };

  this.interpPos = function(offset){
    var _bow = this.getBowPos();
    var _hxBow = toCube(_bow.x, _bow.y);
    var _hxOffset= getHexGridOffset(this.orientation, offset);
    _hxBow[0] += _hxOffset.cx;
    _hxBow[1] += _hxOffset.cy;
    _hxBow[2] += _hxOffset.cz;
    var _future = toOffset(_hxBow[0],_hxBow[1],_hxBow[2]);
    return {x:_future[0],y:_future[1]};
  };

  this.findGridPosition();
  return this;
};

var Barrel = function(id,x,y,qty){
  this.id = id;
  this.x = x;
  this.y = y;
  this.qty = qty;

  this.cx=0;
  this.cy=0;
  this.cz=0;

  this.findGridPosition = function(){
    var _c = toCube(this.x, this.y);
    this.cx = _c[0];
    this.cy = _c[1];
    this.cz = _c[2];
  };
  this.findGridPosition();
  return this;
};

var Mine = function(id,x,y){
  this.id = id;
  this.x = x;
  this.y = y;

  this.cx=0;
  this.cy=0;
  this.cz=0;

  this.isAheadOf = function(ship){
    for (var s = 1; s <= ship.speed+2; s++) {
      var _fP = ship.interpPos(s);
      if(_fP.x == this.x && _fP.y == this.y) return true;
    }
    return false;
  };


  this.findGridPosition = function(){
    var _c = toCube(this.x, this.y);
    this.cx = _c[0];
    this.cy = _c[1];
    this.cz = _c[2];
  };
  this.findGridPosition();
  return this;
};

var CannonBall = function(id,x,y,eta){
  this.id = id;
  this.targetx = x;
  this.targety = y;
  this.eta = eta;

  return this;
};

//Utility
function getOffset(heading, y){
  return OFFSETS[y&1][heading];
}

function getHexGridOffset(heading, delta){
  var disp = {cx:0,cy:0,cz:0};
  switch(heading){
      case 0: disp = {cx:delta,cy:-delta,cz:0};break;
      case 1: disp = {cx:delta,cy:0,cz:-delta};break;
      case 2: disp = {cx:0,cy:delta,cz:-delta};break;
      case 3: disp = {cx:-delta,cy:delta,cz:0};break;
      case 4: disp = {cx:-delta,cy:0,cz:delta};break;
      case 5: disp = {cx:0,cy:-delta,cz:delta};break;
  }

  return disp;
}

function toCube(c,r){
    var x,y,z;
    x = c - (r + (r&1)) / 2;
    z = r;
    y = -x-z;
    return [x,y,z];
}

function toOffset(cx, cy,cz){
   return [cx + (cz + (cz&1)) / 2 ,cz];
}
function entityPosOffset(e){
  return toOffset(e.cx,e.cy,e.cz);
}

function hexDistance(a,b){
  return Math.max(Math.abs(a.cx - b.cx), Math.abs(a.cy - b.cy), Math.abs(a.cz - b.cz));
}

var cooldowns = {};
var isFirstRound = true;
while (true) {

  var enemies = [];
  var myShips = [];
  var barrels = [];
  var mines = [];
  var cannonBalls = [];

  var myShipCount = parseInt(readline()); // the number of remaining ships
  var entityCount = parseInt(readline()); // the number of entities (e.g. ships, mines or cannonballs)

  for (var i = 0; i < entityCount; i++) {
      var inputs = readline().split(' ');
      var entityId = parseInt(inputs[0]);
      var entityType = inputs[1];

      if(entityType == "BARREL"){
          barrels.push(new Barrel(entityId,parseInt(inputs[2]), parseInt(inputs[3]), parseInt(inputs[4])));
      }
      else if(entityType == "SHIP"){
          if(parseInt(inputs[7]) == 1){
              myShips.push(new Ship(entityId,parseInt(inputs[2]), parseInt(inputs[3]),parseInt(inputs[4]),
                              parseInt(inputs[5]),parseInt(inputs[6])));

          }
          else{
              enemies.push(new Ship(entityId,parseInt(inputs[2]), parseInt(inputs[3]),parseInt(inputs[4]),
                              parseInt(inputs[5]),parseInt(inputs[6])));
          }
      }
      else if(entityType == "MINE"){
          mines.push(new Mine(entityId,parseInt(inputs[2]), parseInt(inputs[3])));
      }
      else if(entityType == "CANNONBALL"){
          cannonBalls.push(new CannonBall(entityId,parseInt(inputs[2]), parseInt(inputs[3]), parseInt(inputs[4])));
      }
  }


  for (var ship of myShips) {
      var bTarget = undefined;
      var eTarget = undefined;
      var obstacleAhead = false;
      var shouldSpeed = false;

      //Seek closest barrel
      var minDist = 999;
      for (var barrel of barrels) {
        //var _dist = hexDistance(ship, barrel);
        var _sBowOff = ship.getBowPos();
        var _sBowHex = toCube(_sBowOff.x, _sBowOff.y);
        var _dist = hexDistance({cx:_sBowHex[0],cy:_sBowHex[1],cz:_sBowHex[2]}, barrel);
        if(_dist < minDist){
          minDist = _dist;
          bTarget = barrel;
        }
      }

      //Scan for mines
      if(ship.speed > 0){
        for (var mine of mines) {
          if(mine.isAheadOf(ship)){
            obstacleAhead = true;
            break;
          }
        }
        if(obstacleAhead == false){//check if we drunk to rhum and gonna collide with a friendlyship :)
            for (var otherShip of myShips) {
                if(otherShip.id != ship.id){
                    if(otherShip.isBlocking(ship)){
                        obstacleAhead = true;
                    }
                }
            }
        }
      }



      //Scan for enemies
      var _eDist = 999;
      for (var enemy of enemies) {
        var _sBowOff = ship.getBowPos();
        var _sBowHex = toCube(_sBowOff.x, _sBowOff.y);
        var _dist = hexDistance({cx:_sBowHex[0],cy:_sBowHex[1],cz:_sBowHex[2]}, enemy);
        if(_dist < 11 && _dist < _eDist){
          eTarget = enemy;
          _eDist = _dist;
        }
      }

      for (var canonball of cannonBalls){
          var _impact = ship.willBeShot(canonball)
           if(_impact>-1){
                switch(_impact){
                    case 0 : obstacleAhead; break;
                    case 1 :
                    case 2 : shouldSpeed = true;break;
                }
           }

      }



      if(obstacleAhead && !shouldSpeed){
          print("STARBOARD");
      }
      else if(shouldSpeed && !obstacleAhead){
          print("FASTER");
      }
      else{
        if(eTarget && (!cooldowns[ship.id] || cooldowns[ship.id]<=0) ){
          var _future = eTarget.speed>0 ? eTarget.interpPos(eTarget.speed*(1+Math.round(_eDist/3))):
                        (isFirstRound ? eTarget.getBowPos():eTarget);
          if(_future.x < 0 ) _future.x = eTarget.x;
          if(_future.y < 0 ) _future.y = eTarget.y;
          cooldowns[ship.id] = 1+Math.round(_eDist/3);


          print("FIRE "+_future.x+" "+_future.y);
        }
        else if((!eTarget && bTarget) || ((cooldowns[ship.id] || cooldowns[ship.id]>0) && bTarget) ){
            lastMove = bTarget.x+" "+bTarget.y;
            print("MOVE "+bTarget.x+" "+bTarget.y);
          }
        else if(!bTarget && (cooldowns[ship.id] || cooldowns[ship.id]>0) && eTarget) print("MOVE "+eTarget.x+" "+eTarget.y);
        else{
          print("WAIT");
        }
      }


      cooldowns[ship.id]--;


  }


 isFirstRound = false;

}
