const mqtt = require("mqtt")

const protocol = "mqtt"
const host = "broker.emqx.io"
const port = "1883" // Correct port
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`
const connectUrl = `${protocol}://${host}:${port}`
const {WebSocketServer} = require("ws")
const wss = new WebSocketServer({port: 8083})
const express = require('express')
const app = express();
const url = require("url")

const client = mqtt.connect(connectUrl, {
    clientId,
    clean: true,
    connectTimeout: 4000,
    // username: 'emqx',
    // password: 'public',
    reconnectPeriod: 1000,
})

wss.on('connection', function connection(ws) {
    ws.on('error', console.error);
    client.subscribe(['testtopic'], () => {
        console.log(`Subscribe to topic 'testtopic'`)
        client.publish("testtopic", 'nodejs mqtt test', { qos: 0, retain: false }, (error) => {
            if (error) {
                console.error(error)
            }
        })
    })
    client.subscribe(['newtopic'], () => {
        console.log(`Subscribe to topic newtopic'`)
        client.publish("newtopic", 'nodejs mqtt test', { qos: 0, retain: false }, (error) => {
            if (error) {
                console.error(error)
            }
        })
    })
    ws.on('message', function message(data) {
        console.log('received: %s', data);
        let dates = JSON.parse(data)
        console.log(dates.message)
        if(dates.message === "testtopic"){
            console.log("inside data.message condition")
            client.publish('testtopic', 'more for testing messages', { qos: 0, retain: false }, (error) => {
                console.log('published message')
                if (error) {
                    console.error(error)
                }
            })
        }

    });
    client.on('message', (topic, payload) => {
        console.log('Received Message:', topic, payload.toString())
        let data = {
            topic: topic,
            message: payload.toString()
        }
        ws.send(JSON.stringify(data));
    })
});

client.on('connect', () => {
    console.log("connected to mqttbroker also")
})

client.on("error", (err)=>{
    console.error(err)
})

app.get("/event", (req, res)=>{
    const client = mqtt.connect(connectUrl, {
        clientId,
        clean: true,
        connectTimeout: 4000,
        // username: 'emqx', // Uncomment these lines if you've set up authentication
        // password: 'public',
        reconnectPeriod: 1000
    })
    // client
    client.publish('testtopic', 'this is a new message for much better testing of qos and mqtt', { qos: 2, retain: false }, (error) => {
        console.log('published message')
        if (error) {
            console.error(error)
        }
        else{
            client.end()
            return res.status(200).json({message: "success"})
        }
    })
})

app.listen(3000, ()=>{
    console.log('express serer running')
})

