
/**
 * Lampa Plugin: ShowyPro FXAPI Dedicated
 * Version: 1.0.2
 * Target: http://showypro.com/lite/fxapi
 * 
 * This plugin connects Lampa directly to the ShowyPro FXAPI balancer.
 */
(function () {
    'use strict';

    function ShowyFXAPI() {
        var network = new Lampa.Reguest();
        var api_url = 'http://showypro.com/lite/fxapi';
        
        /**
         * Generates a persistent UID (8 characters)
         */
        function generateUID() {
            var chars = "abcdefghijklmnopqrstuvwxyz0123456789";
            var res = "";
            for (var i = 0; i < 8; i++) {
                res += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return res;
        }

        /**
         * Generates a Showy Token (UUID format)
         * Note: The last character must be in the range [k-z]
         */
        function generateToken() {
            var hex = "0123456789abcdef";
            var end = "klmnpqrstuvwxyz";
            function p(len, isLast) {
                var s = "";
                for (var i = 0; i < (isLast ? len - 1 : len); i++) {
                    s += hex.charAt(Math.floor(Math.random() * hex.length));
                }
                if (isLast) s += end.charAt(Math.floor(Math.random() * end.length));
                return s;
            }
            return p(8) + '-' + p(4) + '-' + p(4) + '-' + p(4) + '-' + p(12, true);
        }

        // Initialize or load credentials from Lampa Storage
        var uid = Lampa.Storage.get('showy_fxapi_uid', generateUID());
        var token = Lampa.Storage.get('showy_fxapi_token', generateToken());
        
        Lampa.Storage.set('showy_fxapi_uid', uid);
        Lampa.Storage.set('showy_fxapi_token', token);

        /**
         * Main search logic
         */
        this.search = function (params) {
            var query = params.query || (params.movie ? params.movie.title : '');
            var url = api_url + '?title=' + encodeURIComponent(query) + '&uid=' + uid + '&showy_token=' + token + '&s=1&rjson=False';
            
            network.silent(url, function (html) {
                var items = [];
                var dom = $(html);
                
                dom.find('.videos__item').each(function() {
                    var btn = $(this).find('.videos__button');
                    var data = btn.data('json');
                    
                    if (data) {
                        items.push({
                            title: $(this).find('.videos__title').text() || query,
                            quality: data.quality || '720p',
                            url: data.url,
                            timeline: false,
                            voice: data.voice || '',
                            player: true
                        });
                    }
                });

                if (items.length > 0) {
                    params.onSearch ? params.onSearch(items) : params.onResult(items);
                } else {
                    params.onEmpty();
                }
            }, function () {
                params.onError();
            });
        };
    }

    // Plugin Registration
    if (window.Lampa) {
        Lampa.Plugins.add({
            name: 'ShowyPro FXAPI',
            version: '1.0.2',
            description: 'Прямой доступ к балансеру ShowyPro (Filmix FXAPI)',
            component: 'showy_fxapi',
            type: 'balancer',
            onSearch: function (params) {
                var api = new ShowyFXAPI();
                api.search(params);
            },
            onMovie: function (params) {
                var api = new ShowyFXAPI();
                api.search(params);
            }
        });
    }
})();
