'use strict';

exports.trackers = [
    'udp://open.demonii.com:1337',
    'udp://tracker.istole.it:80',
    'http://tracker.yify-torrents.com/announce',
    'udp://tracker.publicbt.com:80',
    'udp://tracker.openbittorrent.com:80',
    'udp://tracker.coppersurfer.tk:6969',
    'udp://exodus.desync.com:6969',
    'http://exodus.desync.com:6969/announce'
];

exports.magnetize = torrent => {
    let magnet = `magnet:?xt=urn:btih:${torrent.hash}`;
    magnet += `&dn=${encodeURIComponent(torrent.name)}`;
    this.trackers.forEach(tracker => {
        magnet += `&tr=${tracker}`;
    });
    return magnet;
};
