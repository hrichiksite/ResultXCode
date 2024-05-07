import Link from "next/link";
import Uploader from "../uploader";
import { toast } from "react-hot-toast";
import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export function Landing() {

  const { data: session, status } = useSession();
  const Router = useRouter();

  //if the user is signed in, we can redirect them to the new page, where they can see they can see that their file is connected to their email.
  if (status === "authenticated") {
    Router.push('/dash');
  }

  //check if the url has a query parameter, if yes, check if the query parameter is a ref, if yes, check if a ref exists in the local storage, if no, save the ref in the local storage and call the api to increment the ref count
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      const refFromLocalStorage = localStorage.getItem('ref');
      if (!refFromLocalStorage) {
        localStorage.setItem('ref', ref);
        fetch(`/api/handleRef?slug=${ref}`, {
          method: 'GET',
          headers: { 'content-type': 'application/json' },
        }).then(async (res) => {
          if (res.status === 200) {
            const { done } = (await res.json())
            if (done) {
             // toast.success("Referral count incremented successfully!");
            } else {
             // toast.error("There was an error incrementing the referral count!");
            }
          } else {
            const error = await res.text()
            toast.error(error)
          }
        })
      }
    }
  }

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen flex flex-col justify-between">
      <header className="py-4 md:py-6 px-4 md:px-6">
        <div className="container flex justify-between items-center">
          <Link href="/">
            <span className="flex items-center space-x-2 text-xl md:text-2xl font-semibold tracking-wider dark:text-gray-50">
              ResultX
            </span>
          </Link>
          {/* Show a link to sign in and go to dash */}
          <div>
              <Link href="" onClick={()=>{
                signIn("google", { callbackUrl: '/dash' })
              }} className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300">Sign in</Link>
          </div>
          <p className="hidden md:block text-sm text-gray-600 dark:text-gray-400">
            Get information your class 10 results delivered right to your mailbox!
          </p>
        </div>
      </header>
      <main className="py-8 md:py-12 flex-grow px-4 md:px-6">
        <div className="container mx-auto flex flex-col md:flex-row justify-center md:justify-between items-center space-y-8 md:space-y-0 md:space-x-8 max-w-screen-lg">
          <div className="w-full md:w-1/2 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight md:tracking-tighter leading-snug md:leading-normal text-gray-800 dark:text-white">
              Scan your admit card and get your results when they're out!
            </h1>
            <p className="text-gray-700 text-sm md:text-base dark:text-gray-300">
              We'll send you an email about your results as soon as they're out. No need to keep checking the website!
            </p>
            <p className="text-gray-700 text-sm dark:text-gray-300">We will email you about your preferences soon!</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">Best of luck!</p>
          </div>
          <div className="w-full md:w-1/2">
            <Uploader/>
          </div>
        </div>
      </main>
    </div>
  );

}
