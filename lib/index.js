const AdmZip = require('adm-zip');
const ProgressBar = require('progress');
const cheerio = require('cheerio');

const KOTOBEE_KEY = 'kotobee%%author';
const XORCipher = (function() {
    var u = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    return {
        encode: function(e, t) {
            return function(e) {
                var t, n, a, i, r, o, s, c, d = 0,
                    l = "";
                if (!e) return e;
                for (; t = e[d++], n = e[d++], a = e[d++], i = (s = t << 16 | n << 8 | a) >> 12 & 63, r = s >> 6 & 63, o = 63 & s, l += u.charAt(s >> 18 & 63) + u.charAt(i) + u.charAt(r) + u.charAt(o), d < e.length;);
                return ((c = e.length % 3) ? l.slice(0, c - 3) : l) + "===".slice(c || 3)
            }(t = function(n, e) {
                return i(e, function(e, t) {
                    return e.charCodeAt(0) ^ a(n, t)
                })
            }(e, t))
        },
        decode: function(e, t) {
            return function(n, e) {
                return i(e, function(e, t) {
                    return String.fromCharCode(e ^ a(n, t))
                }).join("")
            }(e, t = function(e) {
                var t, n, a, i, r, o, s, c, d = 0,
                    l = [];
                if (!e) return e;
                e += "";
                for (; i = u.indexOf(e.charAt(d++)), r = u.indexOf(e.charAt(d++)), o = u.indexOf(e.charAt(d++)), s = u.indexOf(e.charAt(d++)), t = (c = i << 18 | r << 12 | o << 6 | s) >> 16 & 255, n = c >> 8 & 255, a = 255 & c, l.push(t), 64 !== o && (l.push(n), 64 !== s && l.push(a)), d < e.length;);
                return l
            }(t))
        }
    };

    function a(e, t) {
        return e.charCodeAt(Math.floor(t % e.length))
    }

    function i(e, t) {
        for (var n = [], a = 0; a < e.length; a++) n[a] = t(e[a], a);
        return n
    }
}());

function decode(fileName, replacer = (href) => href, attribute) {
    const result = new AdmZip();
    const zip = new AdmZip(fileName);
    const zipEntries = zip.getEntries();
    const summary = {};

    const bar = new ProgressBar('[:bar] :percent processing :fileName', {
        complete: '=',
        incomplete: ' ',
        width: 20,
        total: zipEntries.length,
        clear: true,
    });

    zipEntries.forEach((zipEntry) => {
        bar.tick({ fileName: zipEntry.entryName });
        if (!zipEntry.entryName.endsWith('.xhtml')) {
            result.addFile(zipEntry.entryName, zipEntry.getData(), zipEntry.comment || '');
            return;
        }

        let buffer = zipEntry.getData();
        let html = buffer.toString('utf8');
        let $ = cheerio.load(html, {
            xmlMode: true,
            decodeEntities: false,
        });
        let entries = $('[data-kotobee]');
        if (entries.length === 0) {
            result.addFile(zipEntry.entryName, buffer, zipEntry.comment || '');
            return;
        }
        entries.each(function() {
            let encodedUrl = $(this).attr('data-kotobee');
            let data = JSON.parse(decodeURI(XORCipher.decode(KOTOBEE_KEY, encodedUrl)));
            if (!data.href) {
                return;
            }
            let href = data.href;
            let newHref = replacer(data.href);
            summary[zipEntry.entryName] = summary[zipEntry.entryName] || [];
            summary[zipEntry.entryName].push([href, newHref]);
            data.href = newHref;
            $(this).attr('data-kotobee', XORCipher.encode(
                KOTOBEE_KEY,
                encodeURI(JSON.stringify(data))
            ));
            if (attribute) {
                $(this).attr(attribute, newHref);
            }
        });

        let content = $.html();
        result.addFile(zipEntry.entryName, Buffer.from(content, 'utf8'), zipEntry.comment || '');
    });

    return { result, summary };
}

module.exports = decode;