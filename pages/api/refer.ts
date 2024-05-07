import type { NextApiRequest, NextApiResponse } from 'next'
import rateLimit from "@/utils/ratelimit"
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { getServerSession } from "next-auth/next"

import { createClient } from 'redis';

const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 100, // Max 500 users per second
});

const rclient = await createClient({
  url: process.env.REDIS_URL
})
  .on('error', err => console.log('Redis Client Error', err))
  .connect();

rclient.on('connect', () => {
  console.log('Redis Client Connected')
})

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
  

type ResponseData = {
  error?: string,
  noOfClicks?: number,
  success: boolean
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  if (req.method === 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed', success: false });
  }
  const session = await getServerSession(req, res, authOptions)
  if(!session) {
    return res.status(401).json({ error: 'Unauthorized', success: false });
  }
  
  if(!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized', success: false });
  }

  const email = session.user.email;
  const { refID } = req.query;

  //check the refID
    if(!refID) {
        return res.status(400).json({ error: 'Bad Request. No ref ID.', success: false });
    }
    //get refID from redis
    //@ts-ignore
    let ref = await rclient.json.get(`ref:${refID}`, {
      
    })
    console.log(ref)

    if(!ref) {
        return res.status(400).json({ error: 'Bad Request', success: false });
    }
    //return the no of clicks
    //@ts-ignore
    return res.status(200).json({ success: true, noOfClicks: ref.c });


}
