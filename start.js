var express = require("express");
var path = require("path");
var utils = Utils;
var _ = require('lodash');

var app = express();

var fs = require('fs');
var obj;
app.use(express.static(__dirname + '/public'));
app.use(express.json());

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/public/index.html'));
    //__dirname : It will resolve to your project folder.
});

app.get('/configuration', function (req, res) {
    res.sendFile(path.join(__dirname + '/public/configuration.html'));
});

app.get('/save', function(req, res) {
    fs.readFile('saves/last.json', 'utf8', function (err, data) {
        if (err) throw err;
        res.send(JSON.parse(data));
    });
});

app.get('/steps', function(req, res) {
    fs.readFile('saves/last.json', 'utf8', function (err, data) {
        if (err) throw err;
        res.send(JSON.parse(data).config.steps);
    });
});


app.get('/sellers', function(req, res) {
    res.send(utils.getData().sellers);
});

app.get('/sells', function(req, res) {
    res.send({data: utils.getCompleteSells()})
});

app.post('/add/table', function(req, res) {
    req.body.id = utils.generateId();
    utils.addEntry(req.body);
    res.send({data: utils.getCompleteSells()});
});

app.post('/sell/:id/:sellerId', function(req, res){
    utils.updateEntry(req.params.id, req.params.sellerId, req.body);
    res.send({data: utils.getCompleteSells()});
});

app.delete('/sell/:id', function(req, res) {
    utils.deleteEntry(req.params.id);
    res.send({data: utils.getCompleteSells()});
});

app.listen(3000);

console.log("Running at Port 3000");

// pkg package.json --target latest-win-x64 -o bouty.exe

function _getFile() {
    return JSON.parse(fs.readFileSync('saves/last.json', 'utf8'));
}

function getData() {
    if (!Utils.data) {
        Utils.data = _getFile();
    }
    return Utils.data;
}

function _getThresholds() {
    return getData().config.steps;
}

function _calculateBounties(value) {
    var thresholds = _getThresholds();
    var toReturn = {
        value: value,
        thresholds: [],
        total: 0
    };
    _.each(thresholds, function (item, key) {
        if (value >= item.threshold) {
            var nextThreshold = thresholds[key + 1];
            var toBounty = value - item.threshold;
            if (nextThreshold) {
                toBounty = Math.min(toBounty, nextThreshold.threshold - item.threshold);
            }
            var bounty = item.percent / 100 * toBounty;
            toReturn.total += bounty;
            toReturn.thresholds.push({
                threshold: item.threshold,
                effective: toBounty,
                bounty: bounty
            });
            return true;
        }
        return false;
    });
    return toReturn;
}

function updateData(data) {
    fs.writeFileSync('saves/last.json', JSON.stringify(data), 'utf-8');
    Utils.data = _getFile();
    return getData();
}

function updateSells(sells) {
    var data = getData();
    data.sells = sells;
    return updateData(data).sells;
}

function updateEntry(id, sellerId, data) {
    var sells = getData().sells;
    _.each(sells, function (sell, key) {
        if (sell.id === id) {
            _.each(sell.data, function (item, _sellerId) {
                if (sellerId === _sellerId) {
                    sells[key].data[_sellerId] = data;
                }
            });
            return false;
        }
    });
    updateSells(sells);
}

function getCompleteSells() {
    var data = getData();
    var toReturn = [];
    var basics = {
        sellers: {}
    };
    _.each(data.sells, function (sell) {
        var toPush = {
            title: sell.title,
            data: {},
            id: sell.id
        };
        _.each(sell.data, function (item, id) {
            var basic = _.extend({
                totalValue: 0,
                value: 0,
                paid: 0,
                totalPaid: 0,
                remaining: 0,
                totalBounty: 0
            }, basics.sellers[id]) || {
                totalValue: 0,
                value: 0,
                paid: 0,
                totalPaid: 0,
                remaining: 0,
                totalBounty: 0
            };
            basic.value = parseFloat(item.value);
            basic.totalValue += parseFloat(item.value);
            basic.paid = parseFloat(item.paid);
            basic.totalPaid += parseFloat(item.paid);
            basic.bounty = _calculateBounties(basic.totalValue);
            basic.totalBounty += basic.bounty.total;
            basic.remaining = basic.totalPaid - basic.bounty.total;
            basics.sellers[id] = basic;
            toPush.data[id] = basic;
        });
        toReturn.push(toPush);
    });
    return toReturn;
}

function addEntry(sell) {
    var data = getData();
    data.sells.push(sell);
    updateData(data)
}

function deleteEntry(id) {
    var data = getData();
    _.each(data.sells, function (sell, i) {
        if (sell.id === id) {
            data.sells.splice(i, 1);
            return false;
        }
    });
    updateData(data);
}

var Utils = {
    data: null,
    getData: getData,
    generateId: function () {
        return Math.floor(Math.random() * 10000000).toString();
    },
    getCompleteSells: getCompleteSells,
    updateEntry: updateEntry,
    addEntry: addEntry,
    deleteEntry: deleteEntry
};