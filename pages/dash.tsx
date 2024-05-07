import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import useWindowSize from 'react-use/lib/useWindowSize'
import Confetti from 'react-confetti'
import NoSSR from '@/components/nossr';
//@ts-ignore
import { ShimmerText, ShimmerTitle } from "react-shimmer-effects";
import { RWebShare } from "react-web-share";

const Success = () => {

  const { data: session, status } = useSession();
  const { width, height } = useWindowSize()
  const [confettiRun, setConfettiRun] = useState(false)
  const [qrdata, setQrdata]: any = useState()
  const [submissionData, setSubmissionData] = useState({
    finalSubmissionNumber: Number,
    finalSubmissionTime: Date,
    finalSubmissionID: String,
    finalSubmissionEmail: String,
    done: false,
    error: '',
    ref: '',
  })

  const [refer, setRefer] = useState({
    'c': 0
  })

  const [doonce, setDoonce] = useState(0);
  useEffect(() => {
    setDoonce(doonce + 1);
  }, [session])

  useMemo(() => {
    if (doonce > 1) return;
    if (doonce < 1) return;
    console.log(session)
    const QRdata = localStorage.getItem('qrdata');
    if (!!QRdata) {
      console.log('QRdata found')
      let qrdatajson = JSON.parse(QRdata);
      setQrdata(qrdatajson);
      //push the data to the server
      fetch('/api/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ qrdata: qrdatajson }),
      }).then(async (res) => {
        if (res.status === 200 || res.status === 400) {
          const submissionDataRes = (await res.json())
          if (submissionDataRes?.success) {
            if (!submissionDataRes.stale) toast.success("Data submitted successfully!");
            setSubmissionData({ ...submissionDataRes, done: true })
          } else {
            toast.error(submissionDataRes?.error, { duration: 100000 });
            setSubmissionData({ ...submissionDataRes, done: false })
            //after 4 seconds, put the error message on alert
            setTimeout(() => {
              alert(submissionDataRes?.error + " Redirecting to the home page when you click ok.")
              //remove localstorage data
              localStorage.removeItem('qrdata');
              //when the alert is closed, redirect to the home page
              signOut({ callbackUrl: '/' })
            }, 4000)
          }
        } else {
          toast.error("There was an error submitting the data :/");
        }
      })
    } else {
      //just fetch the data
      fetch('/api/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ justdata: true })
      }).then(async (res) => {
        if (res.status === 200 || res.status === 400) {
          const submissionDataRes = (await res.json())
          if (submissionDataRes?.success) {
            setSubmissionData({ ...submissionDataRes, done: true })
          } else {
            toast.error(submissionDataRes?.error, { duration: 100000 });
            setSubmissionData({ ...submissionDataRes, done: false })
            //after 4 seconds, put the error message on alert
            setTimeout(() => {
              alert(submissionDataRes?.error + " Redirecting to the home page when you click ok.")
              //remove localstorage data
              localStorage.removeItem('qrdata');
              //when the alert is closed, redirect to the home page
              signOut({ callbackUrl: '/' })
            }, 4000)
          }
        } else {
          toast.error("There was an error submitting the data :/");
        }
      })
    }
    console.log(qrdata)
  }, [doonce])

  useEffect(() => {
    if (submissionData.done) {
      //get referral data
      fetch(`/api/refer?refID=${submissionData.ref}`, {
        method: 'GET',
        headers: { 'content-type': 'application/json' },
      }).then(async (res) => {
        if (res.status === 200 || res.status === 400) {
          const referData = (await res.json())
          if (referData?.success) {
            setRefer({ c: referData?.noOfClicks })
          } else {
            toast.error(referData?.error);
            setRefer({ c: 0 })
          }
        } else {
          toast.error("There was an error getting the referral data, sorry :/");
        }
      })
    }
  }
    , [submissionData.done])


  const [quote, setQuote] = useState([])
  const [quoteData, setQuoteData] = useState([])
  useMemo(async () => {
    // load from /quotes.json
    //need to fix later, now just using a small subset of quotes in a array
    //const res = require('../public/quotes.json')
    const res =  [ "Believe you can and you're halfway there. - Theodore Roosevelt",
    "You are capable of more than you know. Choose a goal that seems right for you and strive to be the best, however hard the path. Aim high. Behave honorably. Prepare to be alone at times, and to endure failure. Persist! The world needs all you can give. - E. O. Wilson",
    "Success is not final, failure is not fatal: It is the courage to continue that counts. - Winston Churchill",
    "The only way to do great work is to love what you do. If you haven't found it yet, keep looking. Don't settle. - Steve Jobs",
    "Success is stumbling from failure to failure with no loss of enthusiasm. - Winston Churchill",
    "Believe in yourself and all that you are. Know that there is something inside you that is greater than any obstacle. - Christian D. Larson",
    "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
    "Do not wait to strike till the iron is hot; but make it hot by striking. - William Butler Yeats",
    "Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful. - Albert Schweitzer",
    "The secret of success is to do the common thing uncommonly well. - John D. Rockefeller Jr.",
    "The only limit to our realization of tomorrow will be our doubts of today. - Franklin D. Roosevelt",
    "It does not matter how slowly you go as long as you do not stop. - Confucius"]
    //console.log(res)
    setQuote(res)

    let selected_qt = quote[Math.floor(Math.random() * quote.length)]
    //console.log(selected_qt)
    setQuoteData(selected_qt)

  }, [])

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen flex flex-col justify-between">
      <header className="py-4 md:py-6 px-4 md:px-6">
        <div className="container flex justify-between items-center">
          <Link href="/">
            <span className="flex items-center space-x-2 text-xl md:text-2xl font-semibold tracking-wider dark:text-gray-50">
              ResultX
            </span>
          </Link>
          <p className="hidden md:block text-sm text-gray-600 dark:text-gray-400">
            Hey there! {session ? `Welcome, ${qrdata ? qrdata['Candidate Name'].split(' ')[0] : session.user?.name}!` : 'You are not signed in'}
          </p>
        </div>
      </header>
      <main className="py-8 md:py-12 flex-grow px-4 md:px-6">
        <div className="container mx-auto flex flex-col md:flex-row justify-center md:justify-between items-center space-y-8 md:space-y-0 md:space-x-8 max-w-screen-lg">
          <div className="w-full md:w-1/2 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight md:tracking-tighter leading-snug md:leading-normal text-gray-800 dark:text-white">
              {status != 'loading' ? status == 'authenticated' ? submissionData.done ? !submissionData.error ? `You've successfully uploaded your admit card ${qrdata ? qrdata['Candidate Name'].split(' ')[0] : session?.user?.name}! 🎉` : submissionData.error : submissionData.error ? submissionData.error : (<ShimmerTitle line={2} gap={10} variant="primary" />) : 'Not Signed in.' : (<ShimmerTitle line={2} gap={10} variant="primary" />)}
            </h1>
            {submissionData.done ?
              (<><p className="text-gray-700 pt-8 text-sm md:text-base dark:text-gray-300">
                We'll send you an email about your results as soon as they're out. No need to keep checking the website!
              </p>
                <p className="text-gray-700 text-sm dark:text-gray-300">We will email you about your preferences soon!</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">We hope we send you the bestest results!!</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">Here's a random quote to keep you motivated: <i>{quoteData}</i></p>

                <div><p className="text-sm pt-8 text-gray-700 dark:text-gray-300">Here's some details about your submission since you're probably bored: (We recommend you take a screenshot for future reference)</p>
                  <ul className="text-sm text-gray-700 pt-4 dark:text-gray-300">
                    <li>Signup Position: {String(submissionData.finalSubmissionNumber)}</li>
                    <li>Email: {String(submissionData.finalSubmissionEmail)}</li>
                    <li>Unique Submission ID: {String(submissionData.finalSubmissionID)}</li>
                    <li>Timestamp (UTC): {String(submissionData.finalSubmissionTime)}</li>
                  </ul></div></>) : submissionData.error ? null : (<ShimmerText line={10} gap={10} />)}
          </div>
          {/* a button that will trigger the Finalize upload!  */}
          <div className="w-full md:w-1/2 text-center md:text-left">
            {submissionData.done ? (<button
              data-umami-event="celebrateClick"
              data-umami-event-id={submissionData.finalSubmissionID}
              onClick={() => { setConfettiRun(!confettiRun) }} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md">{confettiRun ? 'Freeze Time!' : 'Celebrate!'}</button>) : (<p onClick={() => signOut({ callbackUrl: '/' })}>Go to home.</p>)}
          </div>
          <div className="w-full md:w-1/2">
            <NoSSR>
              <Confetti width={width} height={height} friction={1} gravity={0.1} run={confettiRun} numberOfPieces={600} />
            </NoSSR>
          </div>
          {submissionData.done ?
            (<>
              <div className="w-full md:w-1/2 pt-3">
                {/* Give buttons to share a unique ref link  */}
                <h2 className="text-gray-700 pt-8 text-sm md:text-base dark:text-gray-300">Share your unique referral link with your friends to get your submission processed first!</h2>
                <p className="text-sm text-gray-700 dark:text-gray-300">We will prioritise submissions based on number of referral link clicks! The more people you refer, the faster your submission will be processed once we start processing them!</p>
                {/* The link in a while underline looks clickable but isn't */}
                <p className="py-2 text-sm text-gray-700 dark:text-gray-300 underline">https://resultx.thatis.my.id/r/{submissionData.ref}</p>
                {/* The number of people who have clicked on the referral link */}
                <p className="text-sm text-gray-700 dark:text-gray-300">Your referral link has been clicked {refer.c} times!</p>
                {/* Share buttons */}
                <RWebShare
                  data-umami-event="shareRefLink"
                  data-umami-event-id={submissionData.finalSubmissionID}
                  data={{
                    //@ts-ignore
                    text: `Know your Class X boards results with ease. Know which LOT your papers are in! and get notified when your results come out! Check it out!\n`,
                    url: `https://resultx.thatis.my.id/r/${submissionData.ref}`,
                    title: "Share your unique referral link with your friends!!"
                  }}
                  onClick={() => console.info("share successful!")}
                >
                  <div className="pt-4 flex flex-col md:flex-row justify-center md:justify-start items-center space-y-4 md:space-y-0 md:space-x-4">
                    <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md">Share!</button>
                  </div>
                </RWebShare>

              </div>
            </>) : null}
        </div>
      </main>
    </div>
  );
};

export default Success;