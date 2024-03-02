import React, { Dispatch, MutableRefObject, SetStateAction } from 'react'

interface Props {
    videoRef: MutableRefObject<HTMLVideoElement | null>;
    canvasRef: MutableRefObject<HTMLCanvasElement | null>;
    setIsPlaying: Dispatch<SetStateAction<boolean>>;
    handleTimeUpdate: () => void;
    videoSrc: string;
    onMouseDown: (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => void
    onMouseMove: (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => void
    onMouseUp: (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => void
}

const VideoPlayer = ({ videoRef, canvasRef, handleTimeUpdate, setIsPlaying, videoSrc, onMouseDown, onMouseMove, onMouseUp }: Props) => {
    return (
        <div className="flex flex-col items-center justify-center gap-6">
            <video
                className="w-0 h-0"
                src={videoSrc}
                ref={videoRef}
                width={1200}
                height={675}
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                onTimeUpdate={handleTimeUpdate}
            />
            <canvas
                className="rounded-2xl object-cover w-full"
                ref={canvasRef}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp} />
            
            <p className='text-green-600 bg-green-200 px-4 py-2 w-full rounded-xl'>Drag over the video to select any object to track</p>
        </div>
    )
}

export default VideoPlayer