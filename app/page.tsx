"use client";

import { RiVideoUploadFill } from "react-icons/ri";

import { useEffect, useRef, useState } from "react";
import Controls from "@/components/Controls";
import Settings from "@/components/Settings";
import VideoPlayer from "@/components/VideoPlayer";

// Declaring a global interface for the 'cv' object
declare global {
  interface Window {
    cv: typeof import("mirada/dist/src/types/opencv/_types");
  }
}

export default function Home() {
    // Refs for DOM elements

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const roiRef = useRef<HTMLDivElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  // State for tracking mouse events and video-related data
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [endPoint, setEndPoint] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [videoSrc, setVideoSrc] = useState("");
  const [vidCurrentTime, setVidCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  let [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const runOpenCv = async () => {

      if (
        window.cv && videoRef.current
      ) {
        const cv = window.cv;

        let video = videoRef.current!;
        let cap = new cv.VideoCapture(video);

        // take first frame of the video
        let frame = new cv.Mat(video.height, video.width, cv.CV_8UC4);
        let trackWindow = new cv.Rect(0, 0, 1, 1);

        cap.read(frame);

        // set the location of region of interest
        if (roiRef && roiRef.current) {
          // define the coordinates of the selected region of interest box
          const canvasRect = canvasRef.current!.getBoundingClientRect();
          const rectX = Math.min(startPoint.x, endPoint.x) - canvasRect.x;
          const rectY = Math.min(startPoint.y, endPoint.y) - canvasRect.y;
          const rectWidth = Math.abs(startPoint.x - endPoint.x);
          const rectHeight = Math.abs(startPoint.y - endPoint.y);

          // set our roi to be tracked
          // check if the position of the roi box is inbound
          if (
            rectX >= 0 &&
            rectX <= canvasRect.width &&
            rectY >= 0 &&
            rectY <= canvasRect.height
          ) {
            trackWindow = new cv.Rect(rectX, rectY, rectWidth, rectHeight);
          }
        }

        // set up the ROI for tracking
        let roi = frame.roi(trackWindow);
        let hsvRoi = new cv.Mat();

        // Converting ROI to HSV color space
        cv.cvtColor(roi, hsvRoi, cv.COLOR_RGBA2RGB);
        cv.cvtColor(hsvRoi, hsvRoi, cv.COLOR_RGB2HSV);

        let mask = new cv.Mat();
        let lowScalar = new cv.Scalar(30, 30, 0);
        let highScalar = new cv.Scalar(180, 180, 180);
        let low = new cv.Mat(
          hsvRoi.rows,
          hsvRoi.cols,
          hsvRoi.type(),
          lowScalar
        );
        let high = new cv.Mat(
          hsvRoi.rows,
          hsvRoi.cols,
          hsvRoi.type(),
          highScalar
        );
        cv.inRange(hsvRoi, low, high, mask);
        let roiHist = new cv.Mat();
        let hsvRoiVec = new cv.MatVector();
        hsvRoiVec.push_back(hsvRoi);
        cv.calcHist(hsvRoiVec, [0], mask, roiHist, [180], [0, 180]);
        cv.normalize(roiHist, roiHist, 0, 255, cv.NORM_MINMAX);

        // delete useless mats.
        roi.delete();
        hsvRoi.delete();
        mask.delete();
        low.delete();
        high.delete();
        hsvRoiVec.delete();

        // Setup the termination criteria, either 10 iteration or move by at least 1 pt
        let termCrit = new cv.TermCriteria(
          cv.TermCriteria_EPS | cv.TermCriteria_COUNT,
          10,
          1
        );

        let hsv = new cv.Mat(video.height, video.width, cv.CV_8UC3);
        let hsvVec = new cv.MatVector();
        hsvVec.push_back(hsv);
        let dst = new cv.Mat();

        const processVideo = () => {
          try {

            // start processing.
            cap.read(frame);

            cv.cvtColor(frame, hsv, cv.COLOR_RGBA2RGB);
            cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);
            cv.calcBackProject(hsvVec, [0], roiHist, dst, [0, 180], 1);

            // apply mean shift algorithm to track the roi
            [, trackWindow] = cv.meanShift(dst, trackWindow, termCrit);

            // Draw it on image
            let [x, y, w, h] = [trackWindow.x, trackWindow.y, trackWindow.width, trackWindow.height];
            cv.rectangle(frame, new cv.Point(x, y), new cv.Point(x + w, y + h), [255, 0, 0, 255], 2);

            cv.imshow(canvasRef.current!, frame);

            requestAnimationFrame(processVideo);

          } catch (err) {
            console.log(err);
          }
        };

        if (timeoutId) {
          clearTimeout(timeoutId)
        }

        setTimeoutId(setTimeout(processVideo, 0))

        return () => {
          frame.delete();
          hsv.delete();
          hsvVec.delete();
          roiHist.delete();
          dst.delete();
        }
      }

    };

    runOpenCv();
  }, [isDragging, videoSrc]);


  useEffect(() => {

    if (roiRef.current && isDragging) {

      roiRef.current.style.left = Math.min(startPoint.x, endPoint.x) + "px";
      roiRef.current.style.top = Math.min(startPoint.y, endPoint.y) + "px";
      roiRef.current.style.width = Math.abs(startPoint.x - endPoint.x) + "px";
      roiRef.current.style.height = Math.abs(startPoint.y - endPoint.y) + "px";
    }
  }, [isDragging, startPoint, endPoint]);


  const reset = () => {
    setIsDragging(false)
    setStartPoint({ x: 0, y: 0 });
    setEndPoint({ x: 0, y: 0 });
  }
  // Mouse events for selecting the object to track
  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    setIsDragging(true);
    setStartPoint({ x: e.clientX, y: e.clientY });
    setEndPoint({ x: e.clientX, y: e.clientY });
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (isDragging) {
      setEndPoint({ x: e.clientX, y: e.clientY });
    }
  };

  const onMouseUp = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {

    setIsDragging(false);

    if (roiRef && roiRef.current) {
      roiRef.current.style.left = `${0}px`;
      roiRef.current.style.top = `${0}px`;
      roiRef.current.style.width = `${0}px`;
      roiRef.current.style.height = `${0}px`;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileURL = URL.createObjectURL(e.target.files[0]);
      setVideoSrc(fileURL);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setVidCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeekChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(event.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setVidCurrentTime(newTime);
    }
  };


  return (

    <><main className="min-h-screen w-full flex flex-col justify-start gap-12 px-4 py-24 md:justify-center">

      <section className="max-w-7xl mx-auto flex flex-col gap-12 justify-center">
        <h1 className="text-center text-3xl md:text-6xl">
          Object Tracking Web Tool
        </h1>

        <div>
          <h2 className="text-center text-xl md:text-2xl">
            Upload your video here and track any objects in real-time.
          </h2>
        </div>
      </section>
      <section className="max-w-7xl mx-auto w-full">
        {videoSrc.length === 0 ? (
          <div>
            <input
              ref={videoInputRef}
              id="videoInput"
              hidden
              type="file"
              accept="video/*"
              onChange={handleFileChange} />
            <label htmlFor="videoInput">
              <div className="flex flex-col items-center cursor-pointer border border-slate-600/10 rounded-2xl w-full py-24 md:py-48">
                <RiVideoUploadFill className="w-12 h-12 md:w-24 md:h-24" />
                <p>Upload your video here.</p>
              </div>
            </label>
          </div>
        ) : (
          <div>
            <VideoPlayer canvasRef={canvasRef} handleTimeUpdate={handleTimeUpdate} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} setIsPlaying={setIsPlaying} videoRef={videoRef} videoSrc={videoSrc} />

            <Controls isPlaying={isPlaying} handleSeekChange={handleSeekChange} vidCurrentTime={vidCurrentTime} videoRef={videoRef} />

            <Settings handleFileChange={handleFileChange} />
          </div>
        )}
      </section>

          

    </main><div ref={roiRef} className="absolute top-0 left-0 border-2 border-green-600" /></>
  );
}