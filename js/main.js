
function addToURL(value){
  if (history.pushState) {
    var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + value;
    window.history.pushState({path:newurl},'',newurl);
  }
}

const version = "v0.0.1";

log('COSMiC Explorer', version);
el('#footerversion').innerHTML = version;

var stats_updated_count = 0;
/* todo: move these into some kind of contract helper class */
const _BLOCKS_PER_READJUSTMENT = 1024;
const _CONTRACT_ADDRESS = "0xB6eD7644C69416d67B522e20bC294A9a9B405B31";
const _MAXIMUM_TARGET_STR = "27606985387162255149739023449108101809804435888681546220650096895197184";  // 2**234
const _MAXIMUM_TARGET_BN = new Eth.BN(_MAXIMUM_TARGET_STR, 10);
const _MINIMUM_TARGET = 2**16;
const _MINIMUM_TARGET_BN = new Eth.BN(_MINIMUM_TARGET);
const _ZERO_BN = new Eth.BN(0, 10);

/* colors used by pool names. todo: move to css, still use them for chart.js */
var pool_colors = {
  orange      : "#C64500",
  purple      : "#4527A0", // note: purple looks a lot like blue
  blue        : "#0277BD",
  green       : "#2E7D32",
  yellow      : "#997500",
  darkpurple  : "#662354",
  darkred     : "hsl(356, 48%, 30%)",
  teal        : "#009688",
  red         : "#f44336",

  /* colors below here are not assigned yet */
  pink        : "#e91e63",
  lightpurple : "#9c27b0",
  lime        : "#cddc39",
  brown       : "#8d6e63",
  grey        : "#78909c",


}

/* TODO: figure out why it doesn't work w metamask */
var eth = new Eth(new Eth.HttpProvider("https://mainnet.infura.io/MnFOXCPE2oOhWpOCyEBT"));
// if (typeof window.web3 !== 'undefined' && typeof window.web3.currentProvider !== 'undefined') {
//   var eth = new Eth(window.web3.currentProvider);
// } else {
//   var eth = new Eth(new Eth.HttpProvider("https://mainnet.infura.io/MnFOXCPE2oOhWpOCyEBT"));
//   log("warning: no web3 provider found, using infura.io as backup provider")
// }


const token = eth.contract(tokenABI).at(_CONTRACT_ADDRESS);


/* move fetching/storing stats into a class, even just to wrap it */
stats = [
  ['Mining Difficulty',             token.getMiningDifficulty,            "",           1,          null     ], /* mining difficulty */
  ['Estimated Hashrate',            null,                                 "Mh/s",       1,          null     ], /* mining difficulty */
  ['Rewards Until Readjustment',    null,                                 "",           1,          null     ], /* mining difficulty */
  ['Current Average Reward Time',   null,                                 "minutes",    1,          null     ], /* mining difficulty */
  ['Last Difficulty Start Block',   token.latestDifficultyPeriodStarted,  "",           1,          null     ], /* mining difficulty */
  ['Tokens Minted',                 token.tokensMinted,                   "0xBTC",      0.00000001, null     ], /* supply */
  ['Max Supply for Current Era',    token.maxSupplyForEra,                "0xBTC",      0.00000001, null     ], /* mining */
  ['Last Eth Reward Block',         token.lastRewardEthBlockNumber,       "",           1,          null     ], /* mining */
  ['Last Eth Block',                eth.blockNumber,                      "",           1,          null     ], /* mining */
  ['Epoch Count',                   token.epochCount,                     "",           1,          null     ], /* mining */
];

var latest_eth_block = null;
eth.blockNumber().then((value)=>{
  latest_eth_block = parseInt(value.toString(10), 10);
});
function ethBlockNumberToDateStr(eth_block) {
  //log('converting', eth_block)
  //log('latest e', latest_eth_block)
  /* TODO: use web3 instead, its probably more accurate */
  /* blockDate = new Date(web3.eth.get bBlock(startBlock-i+1).timestamp*1000); */
  return new Date(Date.now() - ((latest_eth_block - eth_block)*15*1000)).toLocaleDateString()
}
function ethBlockNumberToTimestamp(eth_block) {
  //log('converting', eth_block)
  //log('latest e', latest_eth_block)
  /* TODO: use web3 instead, its probably more accurate */
  /* blockDate = new Date(web3.eth.getBlock(startBlock-i+1).timestamp*1000); */
  return new Date(Date.now() - ((latest_eth_block - eth_block)*15*1000)).toLocaleString()
}



function secondsToReadableTime(seconds) {
  if(seconds <= 0) {
    return "0 seconds";
  }

  units = ['years', 'months', 'days', 'hours', 'minutes', 'seconds'];
  divisors = [365.25*24*60*60, 30.4*24*60*60, 24*60*60, 60*60, 60, 1]
  for(idx in units) {
    var unit = units[idx];
    var divisor = divisors[idx];
    if(seconds > divisor) {
      return (seconds / divisor).toFixed(1) + ' ' + unit;
    }
  }
  return seconds.toFixed(1) + ' ' + 'seconds';
}

function toReadableThousands(num_value, should_add_b_tags) {
  units = ['', 'K', 'M', 'B'];
  var final_unit = 'T';
  for(idx in units) {
    var unit = units[idx];
    if(num_value < 1000) {
      final_unit = unit;
      break;
    } else {
      num_value /= 1000;
    }
  }
  var num_value_string = num_value.toFixed(2);

  if(num_value_string.endsWith('.00')) {
    num_value_string = num_value.toFixed(0);
  }

  if(should_add_b_tags) {
    num_value_string = '<b>' + num_value_string + '</b>';
  }
  return num_value_string + ' ' + final_unit;
}

function toReadableThousandsLong(num_value, should_add_b_tags) {
  units = ['', 'Thousand', 'Million', 'Billion'];
  var final_unit = 'Trillion';
  for(idx in units) {
    var unit = units[idx];
    if(num_value < 1000) {
      final_unit = unit;
      break;
    } else {
      num_value /= 1000;
    }
  }
  var num_value_string = num_value.toFixed(0);
  if(should_add_b_tags) {
    num_value_string = '<b>' + num_value_string + '</b>';
  }
  return num_value_string + ' ' + final_unit;
}

function toReadableHashrate(hashrate, should_add_b_tags) {
  units = ['H/s', 'Kh/s', 'Mh/s', 'Gh/s', 'Th/s', 'Ph/s'];
  var final_unit = 'Eh/s';
  for(idx in units) {
    var unit = units[idx];
    if(hashrate < 1000) {
      final_unit = unit;
      break;
    } else {
      hashrate /= 1000;
    }
  }
  var hashrate_string = hashrate.toFixed(2);

  if(hashrate_string.endsWith('.00')) {
    hashrate_string = hashrate.toFixed(0);
  }

  if(should_add_b_tags) {
    hashrate_string = '<b>' + hashrate_string + '</b>';
  }
  return hashrate_string + ' ' + final_unit;
}

function getValueFromStats(name, stats) {
  value = null
  stats.forEach(function(stat){
    if (stat[0] === name) {
      value = stat[4];
    }})
  return value
}

function setValueInStats(name, value, stats) {
  stats.forEach(function(stat){
    if (stat[0] === name) {
      stat[4] = value;
      return;
    }});
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function updateStatsThatHaveDependencies(stats) {
  /* estimated hashrate */
  difficulty = getValueFromStats('Mining Difficulty', stats)
  //hashrate = difficulty * 2**22 / 600
  //hashrate /= 1000000000
  //el('#EstimatedHashrate').innerHTML = "<b>" + hashrate.toFixed(2) + "</b> Gh/s";

  /* supply remaining in era */
  max_supply_for_era = getValueFromStats('Max Supply for Current Era', stats)
  current_supply = getValueFromStats('Tokens Minted', stats)
  current_reward = getValueFromStats('Current Mining Reward', stats)
  supply_remaining_in_era = max_supply_for_era - current_supply; /* TODO: probably need to round to current mining reward */
  rewards_blocks_remaining_in_era = supply_remaining_in_era / current_reward;
  el_safe('#SupplyRemaininginEra').innerHTML = "<b>" + supply_remaining_in_era.toLocaleString() + "</b> 0xBTC <span style='font-size:0.8em;'>(" + rewards_blocks_remaining_in_era + " blocks)</span>";

  /* time until next epoch ('halvening') */
  el_safe('#CurrentRewardEra').innerHTML += " <span style='font-size:0.8em;'>(next era: ~" + secondsToReadableTime(rewards_blocks_remaining_in_era * 600) + ")</div>";

  /* rewards until next readjustment */
  epoch_count = getValueFromStats('Epoch Count', stats)
  rewards_since_readjustment = epoch_count % _BLOCKS_PER_READJUSTMENT
  rewards_left = _BLOCKS_PER_READJUSTMENT - rewards_since_readjustment
  el_safe('#RewardsUntilReadjustment').innerHTML = "<b>" + rewards_left.toString(10) + "</b>";

  /* time per reward block */
  current_eth_block = getValueFromStats('Last Eth Block', stats)
  difficulty_start_eth_block = getValueFromStats('Last Difficulty Start Block', stats)

  /* Add timestamp to 'Last difficulty start block' stat */
  el_safe('#LastDifficultyStartBlock  ').innerHTML += "<span style='font-size:0.8em;'>(" + ethBlockNumberToTimestamp(difficulty_start_eth_block) + ")</span>";

  /* time calculated using 15-second eth blocks */
  var eth_blocks_since_last_difficulty_period = current_eth_block - difficulty_start_eth_block;
  var seconds_since_readjustment = eth_blocks_since_last_difficulty_period * 15

  seconds_per_reward = seconds_since_readjustment / rewards_since_readjustment;
  minutes_per_reward = (seconds_per_reward / 60).toFixed(2)
  el_safe('#CurrentAverageRewardTime').innerHTML = "<b>" + minutes_per_reward + "</b> minutes";
  /* add a time estimate to RewardsUntilReadjustment */
  el_safe('#RewardsUntilReadjustment').innerHTML += "  <span style='font-size:0.8em;'>(~" + secondsToReadableTime(rewards_left*minutes_per_reward*60) + ")</span>";

  /* estimated hashrate */
  //difficulty = getValueFromStats('Mining Difficulty', stats)
  hashrate = difficulty * 2**22 / 600
  /* use current reward rate in hashrate calculation */
  hashrate *= (10 / minutes_per_reward)
  setValueInStats('Estimated Hashrate', hashrate, stats);
  el_safe('#EstimatedHashrate').innerHTML = toReadableHashrate(hashrate, true);
}

function updateLastUpdatedTime() {
  var time = new Date();
  current_time = time.toLocaleTimeString();
  el('#LastUpdatedTime').innerHTML = current_time;
}

function getMinerColor(address, known_miners) {
  function simpleHash(seed, string) {
    var h = seed;
    for (var i = 0; i < string.length; i++) {
      h = ((h << 5) - h) + string[i].codePointAt();
      h &= 0xFFFFFFFF;
    }
    return h;
  }

  if(known_miners[address] !== undefined) {
    var hexcolor = known_miners[address][2];
  } else {
    //var address_url = 'https://etherscan.io/address/' + address;
    //var hexcolor = (simpleHash(7, address) & 0xFFFFFF) | 0x000000;
    hexcolor = 'hsl(' + (simpleHash(2, address) % 360) + ', 48%, 30%)';
    
  }
  return hexcolor;
}

function getMinerName(address, known_miners) {
  if(known_miners[address] !== undefined) {
    return known_miners[address][0];
  } else {
    return address.substr(0, 14) + '...';
  }
}

function getMinerNameLinkHTML(address, known_miners) {
  var hexcolor = getMinerColor(address, known_miners);
  var poolstyle = '<span style="background-color: ' + hexcolor + ';" class="poolname">';

  if(known_miners[address] !== undefined) {
    var readable_name = known_miners[address][0];
    var address_url = known_miners[address][1];
  } else {
    var readable_name = address.substr(0, 14) + '...';
    var address_url = 'https://etherscan.io/address/' + address;
  }

  return '<a href="' + address_url + '">' + poolstyle + readable_name + '</span></a>';
}

function updateAllMinerInfo(eth, stats, hours_into_past){

  var known_miners = {
    "0xf3243babf74ead828ac656877137df705868fd66" : [ "Token Mining Pool", "http://TokenMiningPool.com",     pool_colors.orange ],
    "0x53ce57325c126145de454719b4931600a0bd6fc4" : [ "0xPool",            "http://0xPool.io",               pool_colors.purple ],
    "0x98b155d9a42791ce475acc336ae348a72b2e8714" : [ "0xBTCpool",         "http://0xBTCpool.com",           pool_colors.blue ],
    "0x363b5534fb8b5f615583c7329c9ca8ce6edaf6e6" : [ "mike.rs pool",      "http://mike.rs:3000",            pool_colors.green ],
    "0x02c8832baf93380562b0c8ce18e2f709d6514c60" : [ "mike.rs pool B",    "http://b.mike.rs:3000",          pool_colors.green ],
    "0x8dcee1c6302232c4cc5ce7b5ee8be16c1f9fd961" : [ "Mine0xBTC",         "http://mine0xbtc.eu",            pool_colors.darkpurple ],
    "0x20744acca6966c0f45a80aa7baf778f4517351a4" : [ "PoolOfD32th",       "http://0xbtc.poolofd32th.club",  pool_colors.darkred ],
    "0xd4ddfd51956c19f624e948abc8619e56e5dc3958" : [ "0xMiningPool",      "http://0xminingpool.com/",       pool_colors.teal ],
    "0x88c2952c9e9c56e8402d1b6ce6ab986747336b30" : [ "0xbtc.wolfpool.io", "http://wolfpool.io/",            pool_colors.red ],
    "0x6917035f1deecc51fa475be4a2dc5528b92fd6b0" : [ "PiZzA pool",        "http://gpu.PiZzA",               pool_colors.yellow ],
    "0x693d59285fefbd6e7be1b87be959eade2a4bf099" : [ "PiZzA pool",        "http://gpu.PiZzA",               pool_colors.yellow ],
    "0x697f698dd492d71734bcaec77fd5065fa7a95a63" : [ "PiZzA pool",        "http://gpu.PiZzA",               pool_colors.yellow ],
    "0x69ebd94944f0dba3e9416c609fbbe437b45d91ab" : [ "PiZzA pool",        "http://gpu.PiZzA",               pool_colors.yellow ],
    "0x69b85604799d16d938835852e497866a7b280323" : [ "PiZzA pool",        "http://gpu.PiZzA",               pool_colors.yellow ],
    "0x69ded73bd88a72bd9d9ddfce228eadd05601edd7" : [ "PiZzA pool",        "http://gpu.PiZzA",               pool_colors.yellow ],
  }

  var last_reward_eth_block = getValueFromStats('Last Eth Reward Block', stats)
  var current_eth_block = getValueFromStats('Last Eth Block', stats)
  var estimated_network_hashrate = getValueFromStats('Estimated Hashrate', stats)
  var last_difficulty_start_block = getValueFromStats('Last Difficulty Start Block', stats)

  var num_eth_blocks_to_search = hours_into_past * 60 * 60 / 15;
  log("searching last", num_eth_blocks_to_search, "blocks");

  /* get all mint() transactions in the last N blocks */
  /* more info: https://github.com/ethjs/ethjs/blob/master/docs/user-guide.md#ethgetlogs */
  /* and https://ethereum.stackexchange.com/questions/12950/what-are-event-topics/12951#12951 */
  eth.getLogs({
    fromBlock: last_reward_eth_block - num_eth_blocks_to_search,
    toBlock: last_reward_eth_block,
    address: '0xB6eD7644C69416d67B522e20bC294A9a9B405B31',
    topics: ['0xcf6fbb9dcea7d07263ab4f5c3a92f53af33dffc421d9d121e1c74b307e68189d', null],
  })
  .then(async function(result) {
    /* array of all miner addresses */
    var miner_list = [];
    /* array of arrays of type [eth_block, txhash, miner_addr] */
    var mined_blocks = [];
    /* dict where key=miner_addr and value=total_mined_block_count */
    var miner_block_count = {};
    /* total number of blocks mined in this filter */
    var total_block_count = result.length;

    log("got filter results:", total_block_count, "transactions");

    result.forEach(async function(transaction){
      function getMinerAddressFromTopic(address_from_topic) {
        return '0x' + address_from_topic.substr(26, 41);
      }
      var tx_hash = transaction['transactionHash'];
      var block_number = parseInt(transaction['blockNumber'].toString());
      var miner_address = getMinerAddressFromTopic(transaction['topics'][1].toString());

      console.log(transaction);

      eth.getTransactionByHash(tx_hash)
      .then(async function(result){
        nonce = result['input'].substr(2, 72);
        log('tx_hash', tx_hash)
        log('  nonce', nonce);

        mined_blocks.push([block_number, tx_hash, miner_address, nonce])
      });
    });

    while(mined_blocks.length < result.length) {
      log('waiting...', mined_blocks.length, '!=', result.length)
      await sleep(500);
    }

    /* sort the blocks by block number */
    mined_blocks.sort((a, b) => {return b[0] - a[0];});



    var blocks_since_last_reward = current_eth_block - last_reward_eth_block;
    var date_now = new Date();
    var date_of_last_mint = new Date(date_now.getTime() - blocks_since_last_reward*15*1000)
    function get_date_from_eth_block(eth_block) {
      /* TODO: use web3 instead, its probably more accurate */
      /* blockDate = new Date(web3.eth.getBlock(startBlock-i+1).timestamp*1000); */
      return new Date(date_of_last_mint.getTime() - ((last_reward_eth_block - eth_block)*15*1000)).toLocaleString()
    }

    /* fill in block info */
    var dt = new Date();
    var innerhtml_buffer = '<tr><th>Time (Approx)</th><th>Nonce</th><th>Miner</th></tr>';
    mined_blocks.forEach(function(block_info) {
      var eth_block = parseInt(block_info[0]);
      var tx_hash = block_info[1];
      var addr = block_info[2];
      var nonce = block_info[3];

      var miner_name_link = getMinerNameLinkHTML(addr, known_miners);

      var transaction_url = 'https://etherscan.io/tx/' + tx_hash;

      //log('hexcolor:', hexcolor, address_url);

      innerhtml_buffer  += '<tr><td>'
        + '<a href="' + transaction_url + '" title="' + tx_hash + '">'
        + get_date_from_eth_block(eth_block)
        + '</a></td><td align="right" style="font-family: Monospace;">'
        + nonce + '</td><td>'
        + miner_name_link + '</td></tr>';
    });
    el('#blockstats').innerHTML = innerhtml_buffer;
    log('done populating block stats');
  })
  .catch((error) => {
    log('error filtering txs:', error);
  });
}

function createStatsTable(){
  stats.forEach(function(stat){
    stat_name = stat[0]
    stat_function = stat[1]
    stat_unit = stat[2]
    stat_multiplier = stat[3]

    el('#statistics').innerHTML += '<tr><td>'
      + stat_name + '</td><td id="'
      + stat_name.replace(/ /g,"") + '"></td></tr>';
  });
}

function areAllBlockchainStatsLoaded(stats) {
  all_loaded = true;

  stats.forEach(function(stat){
    stat_name = stat[0]
    stat_function = stat[1]
    stat_unit = stat[2]
    stat_multiplier = stat[3]
    stat_value = stat[4]
    /* if there is a function without an associated value, we are still waiting */
    if(stat_function !== null && stat_value === null) {
      all_loaded = false;
    }
  })

  if(all_loaded) {
    return true;
  } else {
    return false;
  }
}

function updateStatsTable(stats){
  stats.forEach(function(stat){
    stat_name = stat[0]
    stat_function = stat[1]
    stat_unit = stat[2]
    stat_multiplier = stat[3]

    set_value = function(stats, stat_name, stat_unit, stat_multiplier, save_fn) {
      return function(result) {
        try {
          result = result[0].toString(10)
        } catch (err) {
          result = result.toString(10)
        }

        result = result.toString(10)*stat_multiplier
        save_fn(result)

        /* modify some of the values on display */
        if(stat_name == "Total Supply") {
          result = result.toLocaleString();
        } else if(stat_name == "Mining Difficulty"
               || stat_name == "Tokens Minted"
               || stat_name == "Max Supply for Current Era"
               || stat_name == "Supply Remaining in Era"
               || stat_name == "Token Transfers"
               || stat_name == "Total Contract Operations") {
          result = result.toLocaleString()
        }

        el_safe('#' + stat_name.replace(/ /g,"")).innerHTML = "<b>" + result + "</b> " + stat_unit;

        /* once we have grabbed all stats, update the calculated ones */
        if(areAllBlockchainStatsLoaded(stats)) {
          updateStatsThatHaveDependencies(stats);
          setTimeout(()=>{updateAllMinerInfo(eth, stats, 48)}, 0);
        }
      }
    }
    /* run promises that store stat values */
    if(stat_function !== null) {
      stat_function().then(set_value(stats, stat_name, stat_unit, stat_multiplier, (value) => {stat[4]=value}));
    }
  });
}


function updateAndDisplayAllStats() {
  createStatsTable();
  updateStatsTable(stats);
}


