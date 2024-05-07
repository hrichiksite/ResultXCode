import { customAlphabet } from 'nanoid'
import type { NextApiRequest, NextApiResponse } from 'next'
import rateLimit from "@/utils/ratelimit"
import { NextAuthOptions } from 'next-auth';
import { getServerSession } from "next-auth/next"
import GoogleProvider from 'next-auth/providers/google';
var crypto = require('crypto');
import { createClient } from 'redis';
const numbers = '0123456789';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID || '',
      clientSecret: process.env.GOOGLE_SECRET || '',  
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  secret: process.env.SECRET,
};

const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 100, // Max 100 users per second
});

const rclient = await createClient({
  url: process.env.REDIS_URL
})
  .on('error', err => console.log('Redis Client Error', err))
  .connect();

rclient.on('connect', () => {
  console.log('Redis Client Connected')
})



export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25kb' // Set desired value here
    }
  }
}


const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  7
) // 7-character random string

type ResponseData = {
  error?: string,
  finalSubmissionEmail?: string,
  finalSubmissionNumber?: number,
  finalSubmissionTime?: string,
  finalSubmissionID?: string,
  stale?: boolean,
  success: boolean
}


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const session = await getServerSession(req, res, authOptions)
  if(!session) {
    console.log(session);
    res.status(400).json({ error: 'Invalid request. No session?', success: false });
  }
  //reject if not a post request
  if (req.method !== 'POST') {
    res.status(400).json({ error: 'Invalid request. Not the right way.', success: false });
    return;
  }

  if(!!session?.user?.email) {
    //check for the jwt in post body
    const { qrdata } = req.body;
    if(!!req.body?.justdata) {
      //get email hash
      const email = session.user.email;
      const emailhash = crypto.createHash('md5').update(email).digest('hex');
      //query the redis for the emailhash 
      rclient.ft.search('emailhash', `@emailhash:${emailhash}`).then((result) => {
        //@ts-ignore
        if(!!result.total > 0) {
          //@ts-ignore
          const finalData = result.documents[0].value;
          //if the emailhash is found, return the qrdata
          //@ts-ignore
          res.status(200).json({ finalSubmissionEmail: finalData.finalSubmissionEmail,    finalSubmissionNumber: finalData.finalSubmissionNumber,    finalSubmissionTime: finalData.finalSubmissionTime,    finalSubmissionID: finalData.finalSubmissionID, ref: finalData.ref, success: true, stale: true });
          return;
        } else {
          res.status(400).json({ error: "No data found for this email. Add your admit card again.", success: false });
          return;
        }
      })
      return
    }
    if(!qrdata) {
      res.status(400).json({ error: "Invalid request. Nope.", success: false });
      return;
    }
    
    const qrdatajson = qrdata;
    const email = session.user.email;
    
let verified = false;
//NOTE: Removed code for security reasons
//verify the qrdata
if (true) {
  verified = true;
}

if(!verified) {
  res.status(400).json({ error: "Invalid QR data. Dosen't work.", success: false });
  return;
}

let redefJSON = qrdatajson



const qrdatastring = JSON.stringify(redefJSON);
//qrhash for redis key
const qrdatahash = crypto.createHash('sha256').update(qrdatastring).digest('hex');

//check if the qrdata is already uploaded



const qrdataexists = await rclient.json.get(qrdatahash, {
  path: [
    'finalSubmissionEmail',
    'finalSubmissionNumber',
    'finalSubmissionTime',
    'finalSubmissionID',
    'ref'
  ]
});
//todo: todo: fix this part, redis connections will pile up and fuck up everything

if(qrdataexists) {
  const qrdataexistsjson = qrdataexists;
  //if the qrdata exists, we can return the data
  //@ts-ignore
  if(qrdataexistsjson.finalSubmissionEmail === email) {
  //@ts-ignore
  res.status(200).json({ finalSubmissionEmail: qrdataexistsjson.finalSubmissionEmail,    finalSubmissionNumber: qrdataexistsjson.finalSubmissionNumber,    finalSubmissionTime: qrdataexistsjson.finalSubmissionTime,    finalSubmissionID: qrdataexistsjson.finalSubmissionID, ref: qrdataexistsjson.ref, success: true, stale: true });
  return;   
} else {
  res.status(400).json({ error: "QR data already uploaded. Linked with different email address. If you have scanned another QR on this device please try again, that data would be removed when you click ok on alert.", success: false });
  return;
}
  } else {
    //lets check if the user already has a submission
    //check if email is already present in the noderedis:emaillist
    const emailExists = await rclient.json.arrIndex('noderedis:emaillist', 'emails', email);
    //@ts-ignore
    if(emailExists >= 0) {
      res.status(400).json({ error: "This email is registered with another admit card. If you have scanned another QR on this device please try again, that data would be removed when you click ok on alert.", success: false });
      return;
    }
    //get email hash
    const emailhash = crypto.createHash('md5').update(email).digest('hex');
    //add the email to the noderedis:emaillist
    await rclient.json.arrAppend('noderedis:emaillist', 'emails', email);
    await rclient.json.numIncrBy('noderedis:counter', '.num', 1);
    //get final submission number
    //@ts-ignore
    const {num:finalSubmissionNumber} = await rclient.json.get('noderedis:counter');
  //@ts-ignore
  redefJSON = { ...redefJSON,   "finalSubmissionEmail": email,
  "finalSubmissionNumber": finalSubmissionNumber,
  "finalSubmissionTime": new Date().toISOString(),
  "finalSubmissionID": nanoid(11),
  //get first 2 characters of the name with random numbers, total length 10
  "ref": qrdatajson['Candidate Name'].substring(0, 2) + customAlphabet(numbers, 11)(),
  emailhash };
  //push the qrdata to redis
  await rclient.json.set(qrdatahash, '$', redefJSON);
  //@ts-ignore
  await rclient.json.set(`ref:${redefJSON.ref}`, '$', {"c":0});
  //return the qrdata
  //@ts-ignore
  res.status(200).json({ finalSubmissionEmail: !!email ? email : '',    finalSubmissionNumber: redefJSON.finalSubmissionNumber,    finalSubmissionTime: redefJSON.finalSubmissionTime,    finalSubmissionID: redefJSON.finalSubmissionID, ref:redefJSON.ref, success: true, stale: false });
}
}


}

//TODO:before closing the function, we need to close the redis connection



