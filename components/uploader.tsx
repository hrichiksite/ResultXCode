'use client'

import { useState, useCallback, useMemo, useRef, useEffect, SetStateAction } from 'react'
import toast from 'react-hot-toast'
import LoadingDots from './loading-dots'
import { signIn } from 'next-auth/react'
import NoSSR from './nossr'
import { QrReader } from 'react-qr-reader';
import { ViewFinder } from './ui/viewFinder';

export default function Uploader(props: any, callback: Function) {
  const [data, setData] = useState<{
    image: string | null
  }>({
    image: null,
  })
  const [file, setFile] = useState<File | null>(null)

  const [isClicked, setIsClicked] = useState(false)
  const [isScanned, setIsScanned] = useState(false)
  const [QRScan, setQRScan] = useState(true)
  const videoRef = useRef();

  const [QRData, setQRData]:any = useState({})

  const [dragActive, setDragActive] = useState(false)

  let scanned = false;
  const checkQR = (result: any, text: string) => {
    if (scanned) return;
    console.log(scanned);
    scanned = true;
    try {
      if (text) {
        //parse the data
        const qrjson = JSON.parse(text.replace(/'/g, '"'));
        console.log(qrjson);
        //NOTE: THIS CODE HAS BEEN REPLACED BY THE PSUEDO CODE BELOW FOR SECURITY REASONS
        //REPLACED CODE- WILL NOT WORK ALL THE TIME, LITERALLY
        if (Math.random() > 0.5) {
          //save the data in localStorage
          //NOTE: Removed code
          toast.success('QR code scanned successfully, welcome ' + qrjson['Candidate Name'].split(' ')[0] + '!');
          //save in browser local storage
          localStorage.setItem('qrdata', text);
          //wait 4 seconds before redirecting to google login page
          //toast

          setIsScanned(true);
          setIsClicked(false);


          return;

        } else {
          toast.error('There was an error scanning the QR code. Invalid QR');
          scanned = false;
          throw new Error('Invalid QR');
        }
      }
    } catch (e) {
      toast.error('There was an error scanning the QR code. Invalid QR. Please reload the page.');
      //reload the page
      location.reload();
    }
  }
  const [result, setResult] = useState('');

  const handleScan = (data: { data: SetStateAction<string>; }) => {
    setResult(data.data);
  };

  const handleError = (error: any) => {
    console.error(error);
  };

  const startScanner = () => {
    if (isScanned) return;
    setIsClicked(true);
  };


  const [saving, setSaving] = useState(false)

  const saveDisabled = useMemo(() => {
    return saving
  }, [saving])



  return (
    <form
      className="grid gap-6"
      onSubmit={async (e) => {
        e.preventDefault()
        if (isScanned) {
          //save the form data to local storage
          localStorage.setItem('qrdata', JSON.stringify(QRData));
          toast.loading("Redirecting to Google login page in 3...2..1.");
          //wait 4 seconds before redirecting to google login page
          setTimeout(() => {
            //redirecting to google login page
            signIn("google", { callbackUrl: '/dash' })
          }, 1000);
        } else {
          toast.error('Please scan the QR code on your admit card first!')
        }

      }}
    >
      <div>
        <div className="space-y-1 mb-4">
          <h2 className="text-xl font-semibold">Scan Your CBSE Admit Card</h2>
          <p className="text-sm text-gray-500">
            The fabulous QR
          </p>

          <p>
            Please make sure the you have the admit card. You would need the QR code for the next step.
            The QR code contains your roll number, school number, DOB, QR code and you need to submit the Admit Card ID later on.
          </p>
          <p>QR code will communicate the required information so you don't need to type it out! 🙌</p>
          <p>
            Y'all know the drill, just scan the QR code on your admit card and we'll take care of the rest.
          </p>
          {/* checkbox declaring you read the whole thing */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="agree"
              name="agree"
              required
              checked={isScanned ? true : undefined}
              className="h-4 w-4 rounded-sm border-gray-300 text-black focus:ring-black focus:ring-offset-black"
            />
            <label
              htmlFor="agree"
              className="text-sm text-grey-500"
            >
              I read the whole thing. (kinda)
            </label>
          </div>

        </div>
        {!isClicked ? (<label
          onClick={() => { startScanner() }}
          htmlFor="image-upload"
          className="group relative mt-2 flex h-96 cursor-pointer flex-col items-center justify-center rounded-md border border-gray-300 bg-white shadow-sm transition-all hover:bg-gray-50"
        >
          <div
            className="absolute z-[5] h-full w-full rounded-md"
          />
          <div
            data-umami-event="QrScanClick"

            className={`${dragActive ? 'border-2 border-black' : ''
              } absolute z-[3] flex h-full w-full flex-col items-center justify-center rounded-md px-10 transition-all ${data.image
                ? 'bg-white/80 opacity-0 hover:opacity-100 hover:backdrop-blur-md'
                : 'bg-white opacity-100 hover:bg-gray-50'
              }`}
          >
            {/*import qr icon from /qr-code-scan-icon.svg*/}
            <img
              className={`${dragActive ? 'scale-110' : 'scale-10'
                } h-7 w-7 text-gray-500 transition-all duration-75 group-hover:scale-110 group-active:scale-95`}
              width="24"
              height="24"
              src={"/qr-code-scan-icon.svg"} alt="qr code scan icon" />

            {isScanned ? (<p className="mt-2 text-center text-sm text-gray-500">
              QR Scanned. Welcome {QRData['Candidate Name'].split(' ')[0]}!
            </p>) : (<span><p className="mt-2 text-center text-sm text-gray-500">
              Tap here, to activate the QR Scanner
            </p>
              <p className="mt-2 text-center text-sm text-gray-500">
                You would need to scan the QR code on your admit card
              </p></span>)}
            <span className="sr-only">On your admit card</span>
          </div>
        </label>)
          : (<NoSSR>
            {QRScan && (<QrReader
              //@ts-ignore
              ref={videoRef}
              ViewFinder={ViewFinder}
              videoId={'video'}
              scanDelay={500}
              constraints={{ facingMode: "environment" }}
              onResult={(result, error) => {
                console.log(result, error)
                if (!!result) {
                  checkQR(result, result.getText() || '');
                }

                if (!!error) {
                  console.info(error);
                }
              }}
            />)}        </NoSSR>)}
        <div className="mt-1 flex rounded-md shadow-sm">
        </div>
      </div>
      {/* Add a field to input the Admit Card ID in the same style. Styled*/}
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Admit Card ID</h2>
        <input
          type="text"
          id="admit-card-id"
          name="admit-card-id"
          required
          placeholder={`${isScanned ? QRData['Candidate Name'].slice(0, 2) : 'AR'}6942069`}
          //make it all caps
          value={QRData['ADMITCID']}
          onChange={(e) => {
            if (e.target.value.length > 15) return;

            setQRData({ ...QRData, 'ADMITCID': e.target.value.toLocaleUpperCase() })
          }}
          style={{ 'color': 'black', "padding": '5px' }}
          className="h-10 w-full rounded-md border border-gray-300 text-sm transition-all focus:outline-none focus:ring focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-black"
        />
      </div>
      <div className="space-y-1">
        <h3 className="text-xl font-semibold">Connect your Google email (@gmail.com)</h3>
        <button
          disabled={saveDisabled}
          data-umami-event="uploadClick"
          data-umami-event-name={QRData['Candidate Name']}
          className={`${saveDisabled
            ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
            : 'border-black bg-black text-white hover:bg-white hover:text-black'
            } flex h-10 w-full items-center justify-center rounded-md border text-sm transition-all focus:outline-none`}
        >
          {saving ? (
            <LoadingDots color="#808080" />
          ) : (
            <p style={{ 'padding': '10%' }} className="text-sm">Sign in with Google</p>
          )}
        </button>
      </div>
    </form>
  )
}