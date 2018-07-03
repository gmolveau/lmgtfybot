'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const dotenv = require('dotenv').config()
const app = express()

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.get('/', function (req, res) {
    res.send('Hello world, I am the unofficial LMGTFY FB messenger bot @ https://m.me/lmgtfybot')
})

app.get('/privacy', function (req, res) {
	res.send(`This Facebook bot only purpose is to quickly create a tinyurl link with the concatenation of the lmgtfy service and the user input. That's all. We don't store the data or use it in any other way.`)
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === process.env.FB_WEBHOOK_TOKEN) {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong FB token.')
})

app.post('/webhook/', function (req, res) {
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
	    let event = req.body.entry[0].messaging[i]
        console.log(event)
	    let sender = event.sender.id
	    if (event.message && event.message.text) {
		    let text = event.message.text
		    sendTextMessage(sender, text)
	    }
    }
    res.sendStatus(200)
})

function sendTextMessage(sender, text) {
    let base_url = "http://tinyurl.com/api-create.php?url=http://lmgtfy.com/?q="+encodeURIComponent(text)

    request({
        url: base_url,
        method: 'GET',
    }, (error, response, body) => {
        if (error) {
            console.log('Error tinyurl: ', error)
        } else if (response.body.error) {
            console.log('Error tinyurl body: ', response.body.error)
        } else {
            request({
                url: 'https://graph.facebook.com/v2.6/me/messages',
                qs: {access_token:process.env.FB_ACCESS_PAGE_TOKEN},
                method: 'POST',
                json: {
                    recipient: {id:sender},
                    message: { text:body },
                }
            }, (error, response, body) => {
                if (error) {
                    console.log('Error sending messages: ', error)
                } else if (response.body.error) {
                    console.log('Error: ', response.body.error)
                }
            })
        }
    })
}


app.listen( process.env.PORT || 5000, function() {
    console.log('running on port', app.get('port'))
})
