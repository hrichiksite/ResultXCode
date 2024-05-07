import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import { Toaster } from 'react-hot-toast';
import  NoSSR  from '../components/nossr'
import { GoogleAnalytics } from '@next/third-parties/google'
//component for enclosing the whole app 
//need to use something like a viewport for the whole app
//import view for react 

export default function App({ Component, pageProps }: AppProps) {
  return (  <div><SessionProvider session={pageProps.session}>
    <Component {...pageProps} />
    <GoogleAnalytics gaId="G-VPKMB0TGQJ" />
    <NoSSR>
    <Toaster/>
    </NoSSR>
   </SessionProvider>    
</div>)
}
