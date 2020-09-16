const AWS = require("aws-sdk");
AWS.config.update({ region: process.env.AWS_REGION });
const DDB = new AWS.DynamoDB({ apiVersion: "2012-10-08" });
var docClient = new AWS.DynamoDB.DocumentClient();
const dynamoose = require("dynamoose");
const jwk = require("jsonwebtoken");
const jwkToPem = require("jwk-to-pem");
const request = require("request");

exports.hello = (event, context, cb) => {
  // const User = dynamoose.model("User", {
  //   "username": String,
  //   "ts": String
  // })

  console.log(event);
  // const body = JSON.parse(event.body);
  // const lastKey = body.LastEvaluatedKey;
  // console.log(body);
  const iss = "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_8DxEqpEuY";
  const token = event.headers.Authorization.substring(7);



  request(
    { url: `${iss}/.well-known/jwks.json`, json: true },
    (error, response, body) => {
      console.log("body : %j", body);
      if (error || response.statusCode !== 200) {
        console.log("Request error:", error);
        cb("Unauthorized");
      }
      const keys = body;
      // Based on the JSON of `jwks` create a Pem:
      const k = keys.keys[0];
      const jwkArray = {
        kty: k.kty,
        n: k.n,
        e: k.e,
      };
      const pem = jwkToPem(jwkArray);

      // Verify the token:
      jwk.verify(token, pem, { issuer: iss }, (err, decoded) => {
        if (err) {
          console.log("Unauthorized user:", err.message);
          cb("Unauthorized");
        } else {
          console.log(decoded)
            // put data
            let ts = Math.floor(new Date()).toString();
            const putParams = {
              TableName: process.env.TABLE_NAME,
              Item: {
                username: decoded["cognito:username"],
                ts: ts,
              },
            };
            // const newUser = new User({
            //   username: decoded["cognito:username"] + '-dynamoose',
            //   ts: ts,
            // })
            // newUser.save({return: 'document'}, (err, data) => {
            //   console.log(err)
            //   User.query("username").eq(decoded["cognito:username"]).limit(5).exec((err, data) => {
            //     console.log(err)
            //     cb(null, {
            //       statusCode: 200,
            //       headers: {
            //         "Access-Control-Allow-Origin": "*",
            //       },
            //       body: JSON.stringify({
            //         username: decoded["cognito:username"],
            //         email: decoded["email"]
            //       }),
            //     });
            //   })
            // })
            docClient.put(putParams, (err, data) => {
              if(err) cb("500")
              else{
                cb(null, {
                  statusCode: 200,
                  headers: {
                    "Access-Control-Allow-Origin": "*",
                  },
                  body: JSON.stringify({
                    username: decoded["cognito:username"],
                    email: decoded["email"]
                  }),
                });
              }              
            })
        }
      });
    }
  );


  // // get data
  // let params = {
  //   TableName: process.env.TABLE_NAME,
  //   KeyConditionExpression: "#un = :un",
  //   ExpressionAttributeNames: {
  //     "#un": "username",
  //   },
  //   Limit: 2,
  //   ExpressionAttributeValues: {
  //     ":un": body.username,
  //   },
  // };
  // if (lastKey) {
  //   params.ExclusiveStartKey = lastKey;
  // }
  // const users = await docClient.query(params).promise();
  // console.log("users: %j", users);

  // return {
  //   statusCode: 200,
  //   headers: {
  //     "Access-Control-Allow-Origin": "*",
  //   },
  //   body: JSON.stringify(users),
  // };
};
