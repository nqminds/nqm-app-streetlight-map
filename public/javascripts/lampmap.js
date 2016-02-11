/*
 * Created by G on 15/01/16.
 */


var count1 = 159062;
var baseurl1 = 'http://q.nqminds.com/v1/datasets/41-CCIo4wl/'; //TDX-Street Lighting_Hampshire
baseurl1 += 'data?opts={"limit":' + count1 + '}';
baseurl1 += '&proj={"type":1,"properties.UN_UNIT":1,"geometry.type":1,"geometry.coordinates":1,"_id":0}';

var count2 = 1194;
var baseurl2 = 'http://q.nqminds.com/v1/datasets/4JWEV09nDe/'; //Geo LSOA Hampshire BGC_wgs84
baseurl2 += 'data?opts={"limit":' + count2 + '}';
baseurl2 += '&proj={"type":1,"properties.LSOA11CD":1,"geometry.type":1,"geometry.coordinates":1,"_id":0}';

var layer = L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
    maxZoom: 20
});

var map = L.map('map', {
    layers: [layer],
    center: [50.96139, -1.42528],
    zoom: 9
});

map.attributionControl.setPrefix('');

//Extend the Default marker class
var MyIcon = L.Icon.extend({
    options: {
        iconUrl: '/images/circle-outline-16.png'
    }
});

var myIcon1 = new MyIcon({
    iconSize: [8, 8]
});

var gridDataurl = [];

gridDataurl[0] = 'http://q.nqminds.com/v1/datasets/N1ZsS1-XYl/data?opts={"limit":145}&proj={"type":1,"properties.numUNITS":1,"geometry.type":1,"geometry.coordinates":1,"_id":0}';
gridDataurl[1] = 'http://q.nqminds.com/v1/datasets/4kW3i1WXtl/data?opts={"limit":2672}&proj={"type":1,"properties.numUNITS":1,"geometry.type":1,"geometry.coordinates":1,"_id":0}';

var clusters = [];

for (var j = 0; j < 2; j++) {
    clusters[j] = L.markerClusterGroup({
        maxClusterRadius: 120,
        iconCreateFunction: function(cluster) {
            var markers = cluster.getAllChildMarkers();

            var childCount = 0;

            for (var i = 0; i < markers.length; i++) {
                childCount += markers[i].feature.properties.numUNITS;
            }

            var c = ' marker-cluster-';
            if (childCount < 10) {
                c += 'small';
            } else if (childCount < 100) {
                c += 'medium';
            } else {
                c += 'large';
            }

            return new L.DivIcon({
                html: '<div><span>' + childCount + '</span></div>',
                className: 'marker-cluster' + c,
                iconSize: new L.Point(40, 40)
            });
        }
    });
}

var gridData = [];
var gridMapData = [];

for (var i = 0; i < 2; i++) {
    gridData[i] = loadTextFileAjaxSync(gridDataurl[i], "application/json");
    // Parse json
    gridData[i] = JSON.parse(gridData[i]);

    gridData[i] = gridData[i].data;
    gridData[i] = {
        features: gridData[i]
    };

    gridMapData[i] = L.geoJson(gridData[i], {
        pointToLayer: function(feature, latlng) {
            var myIcon2 = myIconf(feature);

            var gridMarker = L.marker(latlng, {
                icon: myIcon2
            });

            gridMarker.on('click', function(e) {
                if (feature.properties.numUNITS < 10) {
                    map.setView(e.latlng, 16);
                } else {
                    map.setView(e.latlng, map.getZoom() + 1);
                }
            });

            return gridMarker;
        }
    });

    if (i == 0) {
        clean_map();
        clusters[0].addLayer(gridMapData[0]);
        map.addLayer(clusters[0]);

    }
}

L.control.scale().addTo(map);

var hoodsData = loadTextFileAjaxSync(baseurl2, "application/json");
// Parse json
hoodsData = JSON.parse(hoodsData);

hoodsData = hoodsData.data;
hoodsData = {
    features: hoodsData
};

var myStyle = {
    "weight": 2
};

var hoodsMapData = L.geoJson(hoodsData, {
    style: myStyle,
    onEachFeature: function(feature, layer) {
        layer.bindPopup("<strong>" + feature.properties.LSOA11CD + "</strong>");
    }
});

L.control.layers({
    'OSM': layer
}, {
    "LSOA": hoodsMapData
}, {
    collapsed: true
}).addTo(map);

map.on('zoomend', function() {
    map.off('dragend');
    clean_map();

    zoom_based_layerchange();
});

function myIconf(feature) {
    var childCount = feature.properties.numUNITS;
    var c = ' marker-cluster-';
    if (childCount < 10) {
        c += 'small';
    } else if (childCount < 100) {
        c += 'medium';
    } else {
        c += 'large';
    }

    return new L.DivIcon({
        html: '<div><span>' + childCount + '</span></div>',
        className: 'marker-cluster' + c,
        iconSize: new L.Point(40, 40)
    });
}

function popUp(f, l) {
    var out = [];
    if (f.properties) {
        for (key in f.properties) {
            out.push(key + ": " + f.properties[key]);
        }
        l.bindPopup(out.join("<br />"));
    }
}

// Load text with Ajax synchronously: takes path to file and optional MIME type
function loadTextFileAjaxSync(filePath, mimeType) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", filePath, false);
    if (mimeType != null) {
        if (xmlhttp.overrideMimeType) {
            xmlhttp.overrideMimeType(mimeType);
        }
    }
    xmlhttp.send();
    if (xmlhttp.status == 200) {
        return xmlhttp.responseText;
    } else {
        // TODO Throw exception
        return null;
    }
}

function clean_map() {
    map.eachLayer(function(layer) {
        if ((layer instanceof L.MarkerClusterGroup) || ((layer instanceof L.GeoJSON) && (layer != hoodsMapData))) {
            map.removeLayer(layer);
        }
    });
}

function zoom_based_layerchange() {
    var currentZoom = map.getZoom();
    var currentGridData;

    if (currentZoom <= 9) {
        currentGridData = gridMapData[0];

        clusters[0].addLayer(currentGridData);
        map.addLayer(clusters[0]);
    } else if (currentZoom > 9 && currentZoom <= 15) {
        currentGridData = gridMapData[1];

        clusters[1].addLayer(currentGridData);
        map.addLayer(clusters[1]);
    } else if (currentZoom > 15) {
        currentGridData = zoom_based_orignaldata();

        map.addLayer(currentGridData);

        map.on('dragend', function() {
            currentGridData = zoom_based_orignaldata();

            clean_map();
            map.addLayer(currentGridData);
        });
    }
}

function zoom_based_orignaldata() {
    var lampData = get_screen_data();
    // Parse json
    lampData = JSON.parse(lampData);

    lampData = lampData.data;
    lampData = {
        features: lampData
    };

    var lampMapData = L.geoJson(lampData, {
        onEachFeature: popUp,
        pointToLayer: function(feature, latlng) {
            return L.marker(latlng, {
                icon: myIcon1
            });
        }
    });

    return lampMapData;
}

function get_screen_data() {
    var bounds = map.getBounds(),
        sw = bounds._southWest,
        ne = bounds._northEast,
        filterurl = '&filter={"geometry.coordinates.0":{"$gte":' + sw.lng + ',"$lte":' + ne.lng + '},"geometry.coordinates.1":{"$gte":' + sw.lat + ',"$lte":' + ne.lat + '}}';

    filterurl = baseurl1 + filterurl;

    var lampData = loadTextFileAjaxSync(filterurl, "application/json");

    return lampData;
}
