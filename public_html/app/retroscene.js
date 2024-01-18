(function(){
    const app = {};

    app.tools =
        {
            mod: function(item)
                {
                    item.seelink = item.link.replace('https://','').replace(/\/$/,'')
                },
            tagFromText: function(text)
                {
                    const $d = document.createElement('div');
                    $d.innerHTML = text
                    return $d.firstChild
                }
        }

    app.tools.ajax =
        {
            json: function(url, callback)
                {
                    app.tools.ajax.get(url, function(text){
                        callback(JSON.parse(text))
                    })
                },
            get: function(url, callback)  
                {
                    const xobj = new XMLHttpRequest()

                    xobj.overrideMimeType("application/json")
                    xobj.open('GET', url, true)

                    xobj.onreadystatechange = function () 
                        {
                            if (xobj.readyState === 4 && xobj.status === 200) {
                                callback(xobj.responseText)
                            }
                        }

                    xobj.send(null)
                }
        }

    app.config =
        {
            url: '/config.json',
            onload: function(onDone)
                {
                    return function(config)
                    {
                        onDone.map(function(f){
                            f(config)
                        })
                    }
                },
            load: function(onDone)
                {
                    app.tools.ajax.json(app.config.url, app.config.onload(onDone))
                }
        }

    app.templates =
        {
            fetch: function(data)
                {
                    const $sets = document.querySelectorAll('[app-repeat]');

                    for (let i = 0; i < $sets.length; i++){
                        const set = $sets[i].getAttribute('app-repeat');
                        app.templates.build($sets[i], set, data[set])
                    }

                    app.templates.inline(data)
                },
            one: function(template, data)
                {
                    let item = template

                    for (const key in data){
                        item = item.replace(new RegExp('{' + key + '}','g'),data[key])
                    }
                    item = item.replace('ximg','img')

                    return app.tools.tagFromText(item)
                },
            build: function($container, name, data)
                {
                    const template = $container.innerHTML;

                    $container.innerHTML = ''
                    data.map(app.tools.mod)

                    for (let i = 0; i < data.length; i++){
                        const $item = app.templates.one(template, data[i]);
                        $container.appendChild($item)
                    }

                    $container.className += ' builded'
                },
            inline: function(data)
                {
                    const $elements = document.querySelectorAll('[data-config]')

                    for (let i = 0; i < $elements.length; i++){
                        const cfg = $elements[i].getAttribute('data-config').replace(/ /g, '').split('>'),
                            cname = cfg[0],
                            aname = cfg[1];

                        $elements[i].setAttribute(aname,data[cname])
                    }
                }
        }

    app.init = function()
        {
            document.addEventListener('DOMContentLoaded',function(){
                app.config.load([
                    app.templates.fetch
                ])
            })
        }


// ============ ENTER ================

    app.init()

})()