import type { NextApiRequest, NextApiResponse } from 'next'
import rateLimit from "@/utils/ratelimit"

import { createClient } from 'redis';
import ms from 'ms';

const limiter = rateLimit({
  interval: ms('60 sec'), // 60 seconds
  uniqueTokenPerInterval: 500, // Max 5000 users per minute
});

const rclient = await createClient({
  url: process.env.REDIS_URL
})
  .on('error', err => console.log('Redis Client Error', err))
  .connect();

rclient.on('connect', () => {
  console.log('Redis Client Connected')
})


type ResponseData = {
  error?: string,
  noOfSubmissions?: number,
  success: boolean
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  //console.log(req.headers['CF-Connecting-IP'] || 'noip')
   try{
   
    //@ts-ignore
    await limiter.check(res, 2, req.headers['CF-Connecting-IP'] || 'noip')

  if (req.method === 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed', success: false });
  }
  //get slug
    const { slug } = req.query;

    //NOTE: Removed code for security reasons
    //check if valid request

  //increment the no of clicks on refereal link
    await rclient.json.numIncrBy(`ref:${slug}`, '.c', 1);
    return res.status(200).json({ success: true });

  } catch (e) {
    return res.status(429).json({ error: 'Too many requests', success: false });
  }
}
