(function(){
    /* const */var app = {}

    app.tools =
        {
            mod: function(item)
                {
                    item.seelink = item.link.replace('http://','').replace(/\/$/,'')
                },
            tagFromText: function(text)
                {
                    /* const */var $d = document.createElement('div')
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
                    /* const */var xobj = new XMLHttpRequest()

                    xobj.overrideMimeType("application/json")
                    xobj.open('GET', url, true)

                    xobj.onreadystatechange = function () 
                        {
                            if (xobj.readyState == 4 && xobj.status == "200") {
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
                    /* const */var $sets = document.querySelectorAll('[app-repeat]')

                    for (/* let */var i = 0; i < $sets.length; i++){
                        /* const */var set = $sets[i].getAttribute('app-repeat')
                        app.templates.build($sets[i], set, data[set])
                    }

                    app.templates.inline(data)
                },
            one: function(template, data)
                {
                    /* let */var item = template

                    for (/* const */var key in data){
                        item = item.replace(new RegExp('{' + key + '}','g'),data[key])
                    }
                    item = item.replace('ximg','img')

                    return app.tools.tagFromText(item)
                },
            build: function($container, name, data)
                {
                    /* const */var template = $container.innerHTML

                    $container.innerHTML = ''
                    data.map(app.tools.mod)

                    for (/* let */var i = 0; i < data.length; i++){
                        /* const */var $item = app.templates.one(template, data[i])
                        $container.appendChild($item)
                    }

                    $container.className += ' builded'
                },
            inline: function(data)
                {
                    /* const */var $elements = document.querySelectorAll('[data-config]')

                    for (/* let */var i = 0; i < $elements.length; i++){
                        /* const */var cfg = $elements[i].getAttribute('data-config').replace(/ /g,'').split('>'),
                            cname = cfg[0],
                            aname = cfg[1]

                        $elements[i].setAttribute(aname,data[cname])
                    }
                }
        }

    app.calendar =
        {
            init: function(config)
                {
                    /* const */var $container = document.querySelector('[app-calendar]')
                        
                    app.tools.ajax.get(config.calendarUrl,function(raw){
                        /* const */var $html = app.calendar.dom(raw)
                        app.calendar.render($container, app.calendar.parse($html))
                    })                        
                },
            dom: function(data)
                {
                    data = data.match(/<table width=\"100%\".+<\/table>/)

                    if (data){
                        /* const */var $tmp = document.createElement('div')
                        $tmp.innerHTML = data[0]
                        return $tmp
                    } else {
                        console.error('Wrong calendar URL or data sceheme was changed.')
                        return false
                    }
                },
            parse: function($html)
                {
                    /* const */var $lines = $html.querySelectorAll('tr'),
                        data = []

                    /* let */var month = null, 
                        template = ''

                    for (/* let */var i = 0; i < $lines.length; i++){
                        /* const */var $items = $lines[i].querySelectorAll('td')

                        if (i === 0){
                            template = app.calendar.fetch.keys($items)
                        } else {
                            ;($items.length == 1)
                                ? month = app.calendar.fetch.month($items[0])
                                : data.push(app.calendar.fetch.values($items,template,month))
                        }
                    }

                    return data
                },
            fetch:
                {
                    month: function($item)
                        {
                            return $item.textContent
                        },
                    keys: function($items)
                        {
                            /* const */var arr = []

                            for (/* let */var i = 0; i < $items.length; i++){
                                arr.push($items[i].textContent.toLowerCase())
                            }

                            return arr
                        },
                    values: function($items, tmp, month)
                        {
                            /* const */var ret = []

                            for (/* let */var i = 0; i < $items.length; i++){
                                ;(tmp[i] === 'links')
                                    ? ret[tmp[i]] = app.calendar.fetch.link($items[i])
                                    : ret[tmp[i]] = $items[i].textContent
                            }

                            ret['jsdate'] = new Date(ret['date'].split('-')[0] + ' ' + month + ' 2016')
                            ret['month'] = month

                            return ret
                        },
                    link: function($item)
                        {
                            /* const */var $links = $item.querySelectorAll('a')

                            for (/* let */var i = 0; i < $links.length; i++){
                                if ($links[i].href !== ''){
                                    return $links[i].href
                                }
                            }

                            return '#'
                        }
                },
            render: function($container, data)
                {
                    /* const */var today = new Date(),
                        tmp = '<a href="{links}" class="calendar-item"><div class="calendar-sheet">{date}<small>{month}</small></div><h2>{demoparty}</h2></a>',
                        width = window.innerWidth / 7,
                        $items = document.createElement('div')

                    /* let */var nearest = null

                    $items.className += 'calendar-wrapper'
                    $container.appendChild($items)

                    data.sort(function(a, b){
                        return (a.jsdate < b.jsdate)
                            ? -1
                            : 1
                    })

                    for (/* let */var i = 0; i < data.length; i++){
                        /* const */var $item = app.templates.one(tmp,data[i])

                        $item.style.width = width + 'px'

                        if (data[i].jsdate < today){
                            $item.className += ' past'
                        } else {
                            if (nearest === null) {
                                $item.className += ' nearest'
                                nearest = i
                            }
                        }

                        $items.appendChild($item)
                    }

                    $items.style.width = width * data.length + 'px'
                    $items.style.transform = 'translateX(-' + (width * (nearest - 3) + 8) + 'px)'
                    $container.className += ' builded'
                }
        }

    app.init = function()
        {
            document.addEventListener('DOMContentLoaded',function(){
                app.config.load([
                    app.templates.fetch,
                    app.calendar.init
                ])
            })
        }


// ============ ENTER ================

    app.init()

})()