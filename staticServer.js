var restify = require('restify');
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
    res.send([
        { "id": 1, "name": "NUM-008-MSI-WINDTOUCH", "location_name": "QMI-001 - ABRIBUS 1" },
        { "id": 2, "name": "BAR-STH-000-4000", "location_name": "STH-000 - SIÈGE SOCIAL" },
        { "id": 3, "name": "NUM-008-MSI-WINDTOUCH", "location_name": "QMI-001 - ABRIBUS 1" },
        { "id": 4, "name": "BAR-STH-000-4000", "location_name": "STH-000 - SIÈGE SOCIAL" },
        { "id": 5, "name": "NUM-008-MSI-WINDTOUCH", "location_name": "QMI-001 - ABRIBUS 1" },
        { "id": 6, "name": "BAR-STH-000-4000", "location_name": "STH-000 - SIÈGE SOCIAL" },
        { "id": 7, "name": "NUM-008-MSI-WINDTOUCH", "location_name": "QMI-001 - ABRIBUS 1" },
        { "id": 8, "name": "BAR-STH-000-4000", "location_name": "STH-000 - SIÈGE SOCIAL" },
        { "id": 9, "name": "NUM-008-MSI-WINDTOUCH", "location_name": "QMI-001 - ABRIBUS 1" },
        { "id": 10, "name": "BAR-STH-000-4000", "location_name": "STH-000 - SIÈGE SOCIAL" }
    ]);
    return next();
});


/**
 * Find an asset
 */
server.get('/hardware/findOne', function (req, res, next) {
    res.send({
        "id": 2457,
        "name": "DEV-UAD2-QMI",
        "location_name": "WHC-NUM",
        "can_checkin": 1,
        "can_checkout": 1,
        "can_repare": 1
    });
    return next();
});

/**
 * View of an asset
 */
server.get('/hardware/:id', function (req, res, next) {
    res.send({
        "id": 2457,
        "name": "DEV-UAD2-QMI",
        "macAddress": "0000.0000.0000",
        "serial": "8476MB4567BGHD",
        "notes": "Test de notes",
        "can_checkin": 1,
        "can_checkout": 1,
        "can_repare": 1,
        "logs": [
            { "id": 35, "action_type": "Edit", "note": "", "creation_date": "2014-08-11 13:13:12", "location_name": "WHC-NUM" },
            { "id": 34, "action_type": "Checkout to", "note": "", "creation_date": "2014-08-10 22:01:00", "location_name": "STH-079 - CADILLAC" },
            { "id": 33, "action_type": "Edit", "note": "", "creation_date": "2014-08-10 22:00:44", "location_name": "NUMEDIA OFFICE" },
            { "id": 32, "action_type": "Edit", "note": "", "creation_date": "2014-08-10 21:59:30", "location_name": "NUMEDIA OFFICE" },
            { "id": 26, "action_type": "Edit", "note": "", "creation_date": "2014-08-10 21:55:02", "location_name": "COQ-002 - ST-JEAN-SUR-RICHELIEU" }
        ],
        "location": {
            "id": 1131,
            "name": "WHC-NUM",
            "city": "Montreal",
            "state": "QC",
            "country": "CA",
            "address": "4200 rue Saint Laurent",
            "address2": "Suite 8000",
            "zip": "H2N4K9"
        },
        "status": {
            "id": 2,
            "name": "Out for Repair"
        },
        "model": {
            "id": 15,
            "name": "DIVA700"
        }
    });
    return next();
});

/**
 * Checkin an asset
 */
server.post('/hardware/:id/checkin', function (req, res, next) {
    if (req.params.error == 'true') {
        res.send({
            success: false,
            error: "Asset id is undefined."
        });
    } else {
        res.send({
            success: true
        });
    }
    return next();
});

/**
 * Repare an asset
 */
server.post('/hardware/:id/repare', function (req, res, next) {
    if (req.params.error == 'true') {
        res.send({
            success: false,
            error: "Asset id is undefined."
        });
    } else {
        res.send({
            success: true
        });
    }
    return next();
});

/**
 * Checkout an asset
 */
server.post('/hardware/:id/checkout', function (req, res, next) {
    if (req.params.error == 'true') {
        res.send({
            success: false,
            error: "Asset id is undefined."
        });
    } else {
        res.send({
            success: true
        });
    }
    return next();
});

/**
 * Save an asset
 */
server.put('/hardware/:id', function (req, res, next) {
    if (req.params.error == 'true') {
        res.send({
            success: false,
            error: "Asset id is undefined."
        });
    } else {
        res.send({
            success: true
        });
    }
    return next();
});

/**
 * Search of locations
 */
server.get('/location/search', function (req, res, next) {
    res.send([
        { "id": 1, "name": "DEVEL" },
        { "id": 5, "name": "CROY MAISON" },
        { "id": 6, "name": "NOC" },
        { "id": 7, "name": "DOC" },
        { "id": 8, "name": "NUMEDIA OFFICE" },
        { "id": 9, "name": "STH-079 - CADILLAC" },
        { "id": 10, "name": "STH-000 - SIÈGE SOCIAL" },
        { "id": 11, "name": "AGD-001 - ASS GAUDREAU DEMERS ANJOU" },
        { "id": 12, "name": "AGD-002 - ASS. GAUDREAU DEMERS LAVAL" },
        { "id": 13, "name": "TEST CREATE" },
        { "id": 14, "name": "COQ-002 - ST-JEAN-SUR-RICHELIEU" },
        { "id": 16, "name": "STH-036 - MAISONNEUVE" },
        { "id": 17, "name": "STH-070 - AMHERST" },
        { "id": 18, "name": "COUCHE-TARD SIEGE SOCIAL" },
        { "id": 19, "name": "GMX-001 - COMPLEXE GYMAX" },
        { "id": 20, "name": "STH-064 - ST-MARTIN-LAVAL" },
        { "id": 21, "name": "STH-001 - COUSINEAU" },
        { "id": 22, "name": "STH-002 - PIEDMONT " },
        { "id": 23, "name": "STH-003 - GARE WINDSOR" },
        { "id": 24, "name": "STH-004 - COMPLEXE DESJARDINS" }
    ]);
    return next();
});

/**
 * Status list
 */
server.get('/status', function (req, res, next) {
    res.send([
        { "id": 1, "name": "Out for Diagnostics" },
        { "id": 2, "name": "Out for Repair" },
        { "id": 3, "name": "Broken - Not Fixable" },
        { "id": 4, "name": "Lost/Stolen" },
        { "id": 5, "name": "Ready to deploy" },
        { "id": 6, "name": "Testing" },
        { "id": 7, "name": "Deployed" }
    ]);
    return next();
});

/**
 * Models list
 */
server.get('/model', function (req, res, next) {
    res.send([
        { "id": 1, "name": "MODEL_1" },
        { "id": 2, "name": "MODEL_2" },
        { "id": 3, "name": "MODEL_3" },
        { "id": 4, "name": "MODEL_4" },
        { "id": 5, "name": "MODEL_5" },
        { "id": 6, "name": "MODEL_6" },
        { "id": 7, "name": "MODEL_7" },
        { "id": 8, "name": "MODEL_8" },
        { "id": 9, "name": "MODEL_9" },
        { "id": 10, "name": "MODEL_10" }
    ]);
    return next();
});

server.listen(3000, function () {
    console.log('%s listening at %s', server.name, server.url);
});