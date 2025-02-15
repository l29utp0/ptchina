const { Boards } = require(__dirname+'/../../../db/')
  , cache = require(__dirname+'/../../redis/redis.js');

module.exports = async (req, res, next) => {

  // Try getting from cache first
  let topBoards = await cache.get('top_boards');
  
  if (!topBoards) {
    // Get top 10 boards using existing boardSort
    topBoards = await Boards.boardSort(0, 13, { ppd: -1, sequence_value: -1 });
    
    // Cache for 30 seconds
    await cache.set('top_boards', topBoards, 30);
  }

  // Attach to res.locals for templates
  res.locals.topBoards = topBoards;
  
  next();

};