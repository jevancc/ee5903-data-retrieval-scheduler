let express = require('express')
let path = require('path')
let nocache = require('nocache')
let secureRandom = require('secure-random')
let bwMonitor = require('../lib/BandwidthMonitor')
var endMw = require('express-end')

app = express()

app.use(endMw)
app.use(nocache())

let scheduler = {
    isSending: false,
    requests: [],
    maxPrice: function() {
        return this.requests[0].pri
    },
    pop: function () {
        return this.requests.splice(0, 1)
    },
    push: function (res, pri) {
        this.requests.push({
            res: res,
            pri: pri,
        })
        this.requests.sort((a, b) => b.pri - a.pri)
    }
}

app.get('/data', (req, res, next) => {


    res.once('finish', () => {
        scheduler.pop()
        console.log('end')
    })

    next()
}, (req, res) => {
    let dataSize = req.param('size')
    let pri = req.param('price') || 0
    scheduler.push(res, pri)

    let data = secureRandom.randomBuffer(parseInt(dataSize))

    while (pri < scheduler.maxPrice() + 1e-7) {
        console.log(pri, scheduler.maxPrice())
    
    console.log('start')
    res.send(data)
})

app.get('/bandwidth', (req, res) => {
    let Action = req.param('action')
    let Interval = req.param('inverval') || 1000

    if (Action === 'start') {
        bwMonitor.start(Interval)
        res.json({ success: true })
    } else if (Action === 'stop') {
        bwMonitor.stop()
        res.json({ success: true })
    } else if (Action === 'reset') {
        bwMonitor.reset()
        res.json({ success: true })
    } else if (Action === 'log') {
        res.json({
            log: bwMonitor.log()
        })
    } else {
        res.json({
            error: 'Invalid parameter'
        })
    }
})

app.get('/alive', (req, res) => {
    res.json({ alive: true })
})

app.listen('8080', () => {
    console.log('Server is listening on port 8080')
})
