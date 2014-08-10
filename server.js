var LOCATION_NUMEDIA = 8;
var LOCATION_EXABIT = 1621;

var STATUS_OUT_FOR_REPAIR = 2;
var STATUS_READY_TO_DEPLOY = 5;
var STATUS_TESTING = 6;
var STATUS_DEPLOYED = 7;

var StatusLabelCheckinStatus = [
    STATUS_OUT_FOR_REPAIR,
    STATUS_DEPLOYED
];
var StatusLabelCheckoutStatus = [
    // READY_TO_DEPLOY
    STATUS_READY_TO_DEPLOY
];
var StatusLabelRepareStatus = [
    STATUS_TESTING
];


var restify = require('restify');
var knex = require('knex')({
    client: 'mysql',
    connection: {
        host     : '192.168.2.21',
        user     : 'root',
        password : 'zliRme9U',
        database : 'snipeit_laravel',
        debug    : true
    }
});

var server = restify.createServer({
    name: 'snipe-it-api',
    version: '1.0.0'
});
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());
server.use(
    function crossOrigin(req,res,next){
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        return next();
    }
);

/**
 * List of assets
 */
server.get('/hardware', function (req, res, next) {
    var perPage = (req.params.perPage) ? parseInt(req.params.perPage) : 10;
    var page = req.params.page ? parseInt(req.params.page) : 1;
    var assetsQuery = knex
        .select('assets.id as id')
        .select('assets.name as name')
        .select('locations.name as location_name')
        .from('assets')
        .leftJoin('locations', function () {
            this.on('assets.location_id', '=', 'locations.id')
        })
        .where('assets.deleted_at', null)
        .limit(perPage)
        .offset((page - 1) * perPage);

    assetsQuery.exec(function(err, rows) {
        res.send(rows);
        return next();
    });
});


/**
 * Find an asset
 */
server.get('/hardware/findOne', function (req, res, next) {

    if (req.params.macAddress == undefined) {
        res.send({});
        return next();
    }

    var assetQuery = knex
        .select('assets.id as id')
        .select('assets.name as name')
        .select('locations.name as location_name')
        .select(knex.raw('IF(assets.status_id IN ('+StatusLabelCheckinStatus.join()+') AND locations.id <> '+LOCATION_NUMEDIA+', 1, 0) as can_checkin'))
        .select(knex.raw('IF(assets.status_id IN ('+StatusLabelCheckoutStatus.join()+') AND locations.id = '+LOCATION_NUMEDIA+', 1, 0) as can_checkout'))
        .select(knex.raw('IF(assets.status_id IN ('+StatusLabelRepareStatus.join()+') AND locations.id = '+LOCATION_NUMEDIA+', 1, 0) as can_repare'))
        .from('assets')
        .leftJoin('locations', function () {
            this.on('assets.location_id', '=', 'locations.id')
        })
        .where('assets.deleted_at', null)
        .limit(1);

    if (req.params.macAddress) {
        assetQuery.where('assets.asset_tag', req.params.macAddress);
    }

    assetQuery.exec(function(err, rows) {
        if (rows.length === 1) {
            res.send(rows[0]);
        } else {
            res.send({});
        }
        return next();
    });
});

/**
 * View of an asset
 */
server.get('/hardware/:id', function (req, res, next) {
    var assetId = parseInt(req.params.id);
    var assetQuery = knex
        .select('assets.id as id')
        .select('assets.name as name')
        .select('assets.asset_tag as macAddress')
        .select('assets.status_id as status_id')
        .select('status_labels.name as status_name')
        .select('locations.name as location_name')
        .from('assets')
        .leftJoin('locations', function () {
            this.on('assets.location_id', '=', 'locations.id')
        })
        .leftJoin('status_labels', function () {
            this.on('assets.status_id', '=', 'status_labels.id')
        })
        .where('assets.deleted_at', null)
        .where('assets.id', assetId)
        .limit(1);

    assetQuery.exec(function(err, rows) {
        if (err) {
            res.send({
                success: false,
                error: err
            });
            return next();
        }

        if (rows.length === 1) {
            var asset = rows[0];
            var logsQuery = knex
                .select('asset_logs.id as id')
                .select('asset_logs.action_type as action_type')
                .select('asset_logs.note as note')
                .select(knex.raw('DATE_FORMAT(asset_logs.added_on, "%Y-%m-%e %H:%i:%s") as creation_date'))
                .select('locations.name as location_name')
                .from('asset_logs')
                .leftJoin('locations', function () {
                    this.on('asset_logs.location_id', '=', 'locations.id')
                })
                .where('asset_logs.asset_id', assetId)
                .orderBy('creation_date', 'DESC');
            logsQuery.exec(function (err, rows) {
                if (err) {
                    res.send({
                        success: false,
                        error: err
                    });
                    return next();
                }

                asset.logs = rows;
                res.send(asset);
                return next();
            });
        } else {
            res.send({});
            return next();
        }
    });
});

/**
 * Checkin an asset
 */
server.post('/hardware/:id/checkin', function (req, res, next) {
    var assetId = req.params.id;
    if (assetId == undefined) {
        res.send({
            success: false,
            error: "Asset id is undefined."
        });
        return next();
    }

    var updateAssetQuery = knex('assets')
        .where('assets.id', assetId)
        .update({
            status_id: STATUS_TESTING,
            location_id: LOCATION_NUMEDIA
        });

    updateAssetQuery.exec(function(err, rows) {
        if (err) {
            res.send({
                success: false,
                error: err
            });
            return next();
        }

        var insertLogQuery = knex('asset_logs')
            .insert({
                checkedout_to: LOCATION_NUMEDIA,
                asset_id: assetId,
                location_id: LOCATION_NUMEDIA,
                asset_type: 'hardware',
                note: req.params.note ? req.params.note : '',
                user_id: 1,
                action_type: 'Checkin from'
            });

        insertLogQuery.exec(function (err, rows) {
            if (err) {
                res.send({
                    success: false,
                    error: err
                });
                return next();
            }
            res.send({
                success: true
            });
            return next();
        });
    });
});

/**
 * Repare an asset
 */
server.post('/hardware/:id/repare', function (req, res, next) {
    var assetId = req.params.id;
    if (assetId == undefined) {
        res.send({
            success: false,
            error: "Asset id is undefined."
        });
        return next();
    }

    var updateAssetQuery = knex('assets')
        .where('assets.id', assetId)
        .update({
            status_id: STATUS_OUT_FOR_REPAIR,
            location_id: LOCATION_EXABIT
        });

    updateAssetQuery.exec(function(err, rows) {
        if (err) {
            res.send({
                success: false,
                error: err
            });
            return next();
        }

        var insertLogQuery = knex('asset_logs')
            .insert({
                checkedout_to: LOCATION_EXABIT,
                asset_id: assetId,
                location_id: LOCATION_EXABIT,
                asset_type: 'hardware',
                note: req.params.note ? req.params.note : '',
                user_id: 1,
                action_type: 'Repare'
            });

        insertLogQuery.exec(function (err, rows) {
            if (err) {
                res.send({
                    success: false,
                    error: err
                });
                return next();
            }
            res.send({
                success: true
            });
            return next();
        });
    });
});

server.listen(3000, function () {
    console.log('%s listening at %s', server.name, server.url);
});