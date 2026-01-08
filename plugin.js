
/**
 * Lampa Plugin: ShowyPro FXAPI Dedicated
 * Target: http://showypro.com/lite/fxapi
 */
(function () {
    'use strict';

    function ShowyFXAPI() {
        var network = new Lampa.Reguest();
        var api_url = 'http://showypro.com/lite/fxapi';
        
        // Function to generate a random UID (8 chars)
        function generateUID() {
            var chars = "abcdefghijklmnopqrstuvwxyz0123456789";
            var res = "";
            for (var i = 0; i < 8; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
            return res;
        }

        // Function to generate a Showy Token (UUID format with special last char)
        function generateToken() {
            var hex = "0123456789abcdef";
            var end = "klmnpqrstuvwxyz";
            function p(len, isLast) {
                var s = "";
                for (var i = 0; i < (isLast ? len - 1 : len); i++) s += hex.charAt(Math.floor(Math.random() * hex.length));
                if (isLast) s += end.charAt(Math.floor(Math.random() * end.length));
                return s;
            }
            return p(8) + '-' + p(4) + '-' + p(4) + '-' + p(4) + '-' + p(12, true);
        }

        // Get or generate persistent credentials
        var uid = Lampa.Storage.get('showy_fxapi_uid', generateUID());
        var token = Lampa.Storage.get('showy_fxapi_token', generateToken());
        Lampa.Storage.set('showy_fxapi_uid', uid);
        Lampa.Storage.set('showy_fxapi_token', token);

        this.search = function (params) {
            var url = api_url + '?title=' + encodeURIComponent(params.query) + '&uid=' + uid + '&showy_token=' + token + '&s=1&rjson=False';
            
            network.silent(url, function (html) {
                var items = [];
                // Use Lampa's internal jQuery-like engine to parse HTML
                var dom = $(html);
                dom.find('.videos__item').each(function() {
                    var btn = $(this).find('.videos__button');
                    var data = btn.data('json');
                    if (data) {
                        items.push({
                            title: $(this).find('.videos__title').text() || params.query,
                            quality: data.quality || '720p',
                            url: data.url,
                            timeline: false,
                            voice: data.voice || ''
                        });
                    }
                });

                if (items.length > 0) {
                    params.onSearch(items);
                } else {
                    params.onEmpty();
                }
            }, function () {
                params.onError();
            });
        };
    }

    // Register the plugin in Lampa
    if (window.Lampa) {
        Lampa.Plugins.add({
            name: 'ShowyPro FXAPI',
            version: '1.0.1',
            description: 'Прямое подключение к балансеру ShowyPro FXAPI',
            component: 'showy_fxapi',
            type: 'balancer',
            onSearch: function (params) {
                var api = new ShowyFXAPI();
                api.search(params);
            },
            onMenu: function(params) {}
        });
    }
})();
