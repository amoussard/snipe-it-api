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
    STATUS_READY_TO_DEPLOY
];
var StatusLabelRepareStatus = [
    STATUS_TESTING
];


var restify = require('restify');
var config = require('config');
var knex = require('knex')({
    client: 'mysql',
    connection: config.database
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

var getAssetQuery = function (assetId) {
    return knex
        .select('assets.id as id')
        .select('assets.name as name')
        .select('assets.asset_tag as macAddress')
        .select('assets.status_id as status_id')
        .select('assets.location_id as location_id')
        .select('assets.serial as serial')
        .select('assets.model_id as model_id')
        .select('assets.notes as notes')
        .select(knex.raw('IF(assets.status_id IN ('+StatusLabelCheckinStatus.join()+') AND assets.location_id <> '+LOCATION_NUMEDIA+', 1, 0) as can_checkin'))
        .select(knex.raw('IF(assets.status_id IN ('+StatusLabelCheckoutStatus.join()+') AND assets.location_id = '+LOCATION_NUMEDIA+', 1, 0) as can_checkout'))
        .select(knex.raw('IF(assets.status_id IN ('+StatusLabelRepareStatus.join()+') AND assets.location_id = '+LOCATION_NUMEDIA+', 1, 0) as can_repare'))
        .from('assets')
        .where('assets.deleted_at', null)
        .where('assets.id', assetId)
        .limit(1);
};

var getAssetLogsQuery = function (assetId) {
    return knex
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
};

var getLocationQuery = function (locationId) {
    return knex
        .select('locations.id as id')
        .select('locations.name as name')
        .select('locations.city as city')
        .select('locations.state as state')
        .select('locations.country as country')
        .select('locations.address as address')
        .select('locations.address2 as address2')
        .select('locations.zip as zip')
        .from('locations')
        .where('locations.id', locationId);
};

var getStatusQuery = function (statusId) {
    return knex
        .select('status_labels.id as id')
        .select('status_labels.name as name')
        .from('status_labels')
        .where('status_labels.id', statusId);
};

var getModelQuery = function (modelId) {
    return knex
        .select('models.id as id')
        .select('models.name as name')
        .from('models')
        .where('models.id', modelId);
};

/**
 * View of an asset
 */
server.get('/hardware/:id', function (req, res, next) {
    var assetId = parseInt(req.params.id);
    var assetQuery = getAssetQuery(assetId)

    assetQuery.exec(function(err, rows) {
        if (err) {
            res.send({ success: false, error: err });
            return next();
        }

        if (rows.length === 1) {
            var asset = rows[0];

            // Add logs on asset
            var logsQuery = getAssetLogsQuery(assetId)
            logsQuery.exec(function (err, rows) {
                if (err) {
                    res.send({ success: false, error: err });
                    return next();
                }
                asset.logs = rows;

                // Add location on asset
                var locationQuery = getLocationQuery(asset.location_id);
                locationQuery.exec(function (err, rows) {
                    if (err) {
                        res.send({ success: false, error: err });
                        return next();
                    }
                    delete asset.location_id;
                    asset.location = rows[0];

                    var statusQuery = getStatusQuery(asset.status_id);
                    statusQuery.exec(function (err, rows) {
                        if (err) {
                            res.send({ success: false, error: err });
                            return next();
                        }
                        delete asset.status_id;
                        asset.status = rows[0];

                        var modelQuery = getModelQuery(asset.model_id);
                        modelQuery.exec(function (err, rows) {
                            if (err) {
                                res.send({ success: false, error: err });
                                return next();
                            }

                            delete asset.model_id;
                            asset.model = rows[0];

                            res.send(asset);
                            return next();
                        });
                    });
                });
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

/**
 * Checkout an asset
 */
server.post('/hardware/:id/checkout', function (req, res, next) {
    var assetId = req.params.id;

    if (assetId == undefined) {
        res.send({
            success: false,
            error: "Asset id is undefined."
        });
        return next();
    }

    var locationId = req.params.location;
    var updateAssetQuery = knex('assets')
        .where('assets.id', assetId)
        .update({
            status_id: STATUS_DEPLOYED,
            location_id: locationId
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
                checkedout_to: locationId,
                asset_id: assetId,
                location_id: locationId,
                asset_type: 'hardware',
                note: req.params.note ? req.params.note : '',
                user_id: 1,
                action_type: 'Checkout to'
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
 * Save an asset
 */
server.put('/hardware/:id', function (req, res, next) {
    var assetId = req.params.id;
    if (assetId == undefined) {
        res.send({
            success: false,
            error: "Asset id is undefined."
        });
        return next();
    }

    var name = req.params.name;
    if (name == undefined) {
        res.send({
            success: false,
            error: "Asset name must be fill."
        });
        return next();
    }

    var updateAssetQuery = knex('assets')
        .where('assets.id', assetId)
        .update({
            name: req.params.name,
            serial: req.params.serial,
            status_id: req.params.status_id,
            model_id: req.params.model_id,
            location_id: req.params.location_id,
            notes: req.params.notes
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
                checkedout_to: req.params.location_id,
                asset_id: assetId,
                location_id: req.params.location_id,
                asset_type: 'hardware',
                note: '',
                user_id: 1,
                action_type: 'Edit'
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
 * Search of locations
 */
server.get('/location/search', function (req, res, next) {

    var locationsQuery = knex
        .select('locations.id as id')
        .select('locations.name as name')
        .from('locations')
        .where('locations.deleted_at', null)
        .limit(20);

    if (req.params.s) {
        locationsQuery.where('locations.name', 'LIKE', '%'+req.params.s+'%');
    }

    locationsQuery.exec(function(err, rows) {
        res.send(rows);
        return next();
    });
});

/**
 * Status list
 */
server.get('/status', function (req, res, next) {

    var statusQuery = knex
        .select('status_labels.id as id')
        .select('status_labels.name as name')
        .from('status_labels')
        .where('status_labels.deleted_at', null);

    statusQuery.exec(function(err, rows) {
        res.send(rows);
        return next();
    });
});

/**
 * Models list
 */
server.get('/model', function (req, res, next) {

    var modelsQuery = knex
        .select('models.id as id')
        .select('models.name as name')
        .from('models');

    modelsQuery.exec(function(err, rows) {
        res.send(rows);
        return next();
    });
});

server.listen(config.node_application.port, function () {
    console.log('%s listening at %s', server.name, server.url);
});