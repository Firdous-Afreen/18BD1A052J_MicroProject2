const express = require("express");
const { WebhookClient } = require("dialogflow-fulfillment");
const { Payload } = require("dialogflow-fulfillment");
const app = express();

const MongoClient=require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
var randomstring=require("randomstring");
var user_name="";
var phno;

app.post("/dialogflow", express.json(), (req, res) => {
const agent = new WebhookClient({ request: req, response: res });

async function identify_user(agent){
    phno=agent.parameters.phone_number;
    const client=new MongoClient(url);
    await client.connect();
    const data= await client.db("mydb").collection("User_details").findOne({phno: phno});

    if(data==null){
        agent.add("You seem to be a new customer. Please enter your name.");
    }
    else{
        user_name=data.username;
        await agent.add("Welcome "+user_name+"!\n How can I help you?");
    }
}

async function add_user(agent){
    user_name=agent.parameters.person;
    
    MongoClient.connect(url, function(err,db){
        if(err) throw err;
        var dbo=db.db("mydb");
        var new_obj={username:user_name.name, phno:phno};
        dbo.collection("User_details").insertOne(new_obj, function(err,res){
            if(err) throw err;
            db.close();
        });
    });
    await agent.add("Welcome "+user_name.name+"!\n How can I help you?");
}

function report_issue(agent){
    var issue_vals={1:"Internet is down",2:"Internet is slow",3:"Buffering Problem",4:"Connectivity Problem"};
    const intent_val=agent.parameters.number;
    var val=issue_vals[intent_val];
    var trouble_ticket=randomstring.generate(7);

    MongoClient.connect(url, function(err,db){
        if(err) throw err;
        var dbo=db.db("mydb");

        var issue_val=val;
        var status="pending";

        let d=Date.now();
        let date_ob=new Date(d);
        let date=date_ob.getDate();
        let month=date_ob.getMonth()+1;
        let year=date_ob.getFullYear();

        var time_date=year+"-"+month+"-"+date;

        var myobj={username:user_name, issue:issue_val, status:status, time_date:time_date,
            trouble_ticket:trouble_ticket};
        dbo.collection("Issue_details").insertOne(myobj, function(err,res){
            if(err) throw err;
            db.close();
        });
    });
    agent.add("The issue reported is: "+val+"\nThe ticket number is: "+trouble_ticket);
}

//trying to load rich response
function custom_payload(agent){
    var payloadData=
    {
        "richContent":[
            [
                {
                    "type":"list",
                    "title":"Internet Down",
                    "subtitle":"Press '1' for Internet is down",
                    "event":{
                        "name": "",
                        "languageCode": "",
                        "parameters": {}
                    }
                },
                {
                "type":"divider"
                },
                {
                    "type":"list",
                    "title":"Slow Internet",
                    "subtitle":"Press '2' for Internet is slow",
                    "event":{
                        "name": "",
                        "languageCode": "",
                        "parameters": {}
                    }
                },
                {
                    "type":"divider"
                },
                {
                    "type":"list",
                    "title":"Buffering Problem",
                    "subtitle":"Press '3' for Buffering problem",
                    "event":{
                        "name": "",
                        "languageCode": "",
                        "parameters": {}
                    }
                },
                {
                    "type":"divider"
                },
                {
                    "type":"list",
                    "title":"Connectivity Problem",
                    "subtitle":"Press '4' for Connectivity problem",
                    "event":{
                        "name": "",
                        "languageCode": "",
                        "parameters": {}
                    }
                }
            ]
        ]
    }        
    agent.add(new Payload(agent.UNSPECIFIED,payloadData,{sendAsMessage:true, rawPayload:true}));
}

var intentMap = new Map();
intentMap.set("Service", identify_user);
intentMap.set("Service - custom-2", add_user);
intentMap.set("Service - custom - custom", report_issue);
intentMap.set("Service - custom", custom_payload);

agent.handleRequest(intentMap);

});
app.listen(process.env.PORT || 80);